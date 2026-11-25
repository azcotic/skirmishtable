/**
 * IA "fácil" (docs/IA.md §3): elige qué agente activar y qué hace, puntuando unos pocos planes
 * legales. Sin DOM: lee la partida (OPS, OBJECTIVES) y devuelve un plan; quien lo ejecuta es
 * la interfaz. Cada plan guarda sus razones para explicar la decisión en el registro.
 *
 * Planes por agente: disparar desde donde está · moverse y disparar · cargar y combatir ·
 * combatir si ya está trabado · ir a un objetivo · ponerse a cubierto.
 * Puntuación: daño esperado, probabilidad de incapacitar (y rematar a un lesionado), objetivos
 * (cambio en cuántos controla cada bando, con src/engine/objetivos.js; ver docs/IA.md §3),
 * menos el riesgo de terminar donde le pueden cargar o disparar sin cobertura, más un poco de azar.
 */
import { BH, BW, OBJECTIVES, OPS } from '../engine/world.js';
import { CTRL, WPN } from '../config.js';
import { dist, opGap, opR } from '../engine/geometry.js';
import { controlDeTodos, enObjetivo, objetivoControladoPor, objetivosControlados } from '../engine/objetivos.js';
import { SHOT_KINDS, judgeShot } from '../engine/shots.js';
import { clampPath, nearestFree, planRoute, useBase } from '../engine/movement.js';
import { foesNear } from '../engine/engage.js';
import { threatMap, threatsAt } from '../engine/threat.js';
import { effMove, isInjured } from '../engine/dice.js';
import { combate, disparo } from '../game/probabilidades.js';
import { enZonaDeControl, puede } from '../game/acciones.js';

export const PESOS = {
  dano: 1,            // por punto de daño esperado
  incapacitar: 12,    // por probabilidad de incapacitar (0–1)
  rematar: 4,         // extra si el blanco ya está lesionado
  recibido: 0.7,      // en combate, por punto de daño que recibiría
  riesgo: 2,          // por enemigo que podría cargarle donde termina
  expuesto: 0.8,      // por enemigo que podría dispararle sin cobertura donde termina
  objetivo: 4,        // por cada objetivo más que controlaría su bando si hace la jugada (libre o disputado)
  perder: 6,          // por cada objetivo que dejaría de controlar (no abandonar el que sostiene solo)
  disputar: 3,        // por cada objetivo que el enemigo dejaría de controlar por su jugada (queda disputado o mío)
  presencia: 1,       // por entrar en la zona de un objetivo que su bando aún no controla
  romper: 4,          // por objetivo que cambia de manos si incapacita a un enemigo que lo sostiene (x prob. de incapacitar)
  sostener: 2,        // por quedarse oculto dentro de un objetivo que ya controla
  cubierto: 1.5,      // terminar oculto a cubierto cuando no hay nada mejor
  azar: 0.6,          // ruido para no ser idéntica cada partida
};

const ARMAS_DIST = op => op.weapons.filter(k => WPN[k] && WPN[k].type === "R");
const ARMAS_CC = op => op.weapons.filter(k => WPN[k] && WPN[k].type === "M");
const alcance = w => { const r = (w.rules || []).find(x => x.startsWith("Range ")); return r ? parseFloat(r.slice(6)) : Infinity; };

// El mejor disparo de `op` desde (x, y): {blanco, arma, r, puntos} o null
export function mejorDisparo(op, x, y) {
  let mejor = null;
  const eye = { x, y, z: op.z || 0, team: op.team, op: { ...op, x, y, order: "engage" } };
  if (foesNear(x, y, op.team, op.id, opR(op)).length) return null;          // trabado: no dispara
  for (const e of OPS) {
    if (!e.alive || e.team === op.team) continue;
    const sh = judgeShot(eye, e);
    if (!SHOT_KINDS[sh.kind].valid) continue;
    for (const k of ARMAS_DIST(op)) {
      const w = WPN[k];
      if (sh.sight && sh.sight.gap > alcance(w)) continue;
      const r = disparo(w, { save: e.save, heridas: e.wounds },
        { cubierto: !!sh.save, ofuscado: sh.kind === "obscured" && !w.sinOfuscar, certera: sh.accurate || 0, lesionado: isInjured(op) });
      const romper = valorRomper(op, e, x, y);
      const puntos = PESOS.dano * r.esperado + PESOS.incapacitar * r.incapacitar + (isInjured(e) ? PESOS.rematar * r.incapacitar : 0)
        + PESOS.romper * romper * r.incapacitar;
      if (!mejor || puntos > mejor.puntos) mejor = { blanco: e, arma: k, r, puntos, romper };
    }
  }
  return mejor;
}

// Posiciones a las que `op` llega con un movimiento (rutas reales, con escalada si se puede)
function destinos(op, tipo, cache) {
  const allow = tipo === "charge" ? effMove(op) + 2 : tipo === "dash" ? 3 : effMove(op);
  const hi = tipo === "dash" ? -1 : allow;   // correr no trepa
  const R = opR(op);
  useBase(R);
  const out = [];
  for (let k = 0; k < 16; k++) for (const f of [0.5, 1]) {
    const a = 2 * Math.PI * k / 16;
    const gx = Math.min(BW - R, Math.max(R, op.x + Math.cos(a) * allow * f));
    const gy = Math.min(BH - R, Math.max(R, op.y + Math.sin(a) * allow * f));
    const p = nearestFree(gx, gy, op.id, 0);
    if (!p) continue;
    const clave = p[0].toFixed(1) + "," + p[1].toFixed(1);
    if (cache.has(clave)) continue;
    cache.add(clave);
    const raw = planRoute(op, p[0], p[1], 0, hi, allow, tipo === "charge", 0);
    if (!raw) continue;
    const c = clampPath(raw, allow);
    if (c.clamped || raw.partial) continue;
    if (tipo !== "charge" && foesNear(p[0], p[1], op.team, op.id, R).length) continue;
    out.push({ x: p[0], y: p[1] });
  }
  return out;
}

// Riesgo de terminar en (x, y): enemigos sin activar que podrían cargarle o dispararle sin cobertura
function riesgo(mapa, x, y) {
  if (!mapa) return { puntos: 0, carga: 0, expuesto: 0 };
  const t = threatsAt(mapa, x, y);
  return { puntos: PESOS.riesgo * t.charge.length + PESOS.expuesto * t.close.length, carga: t.charge.length, expuesto: t.close.length };
}

// Valor de objetivos de poner a `op` en (x, y): cuántos objetivos más/menos controlaría cada bando
// (src/engine/objetivos.js, parámetro `mover`). Devuelve { puntos, ganan, pierden, disputa, obj, sostiene }.
export function valorObjetivos(op, x, y) {
  const cero = { puntos: 0, ganan: 0, pierden: 0, disputa: 0, obj: null, sostiene: false };
  if (!OBJECTIVES.length) return cero;
  const mover = { id: op.id, x, y }, otro = 1 - op.team;
  const mios = objetivosControlados(op.team), suyos = objetivosControlados(otro);
  const des = controlDeTodos(OPS, OBJECTIVES, mover);
  const mios2 = des.filter(c => c.controla === op.team).length, suyos2 = des.filter(c => c.controla === otro).length;
  const ganan = Math.max(0, mios2 - mios), pierden = Math.max(0, mios - mios2), disputa = Math.max(0, suyos - suyos2);
  const aqui = enObjetivo({ ...op, x, y });
  const c = aqui ? des.find(d => d.obj === aqui) : null;
  const sostiene = !!c && c.controla === op.team;
  const presencia = c && !sostiene ? 1 : 0;
  return { ganan, pierden, disputa, obj: aqui, sostiene,
    puntos: PESOS.objetivo * ganan - PESOS.perder * pierden + PESOS.disputar * disputa + PESOS.presencia * presencia };
}
// Cuántos objetivos cambian de manos a favor de `op` si el enemigo `e` sale del juego (0 si no sostiene ninguno)
export function valorRomper(op, e, x = op.x, y = op.y) {
  if (!OBJECTIVES.length || !enObjetivo(e)) return 0;
  const mover = { id: op.id, x, y }, cuenta = (l, t) => l.filter(c => c.controla === t).length;
  const antes = controlDeTodos(OPS, OBJECTIVES, mover), despues = controlDeTodos(OPS.filter(o => o.id !== e.id), OBJECTIVES, mover);
  const neto = cuenta(despues, op.team) - cuenta(antes, op.team) + cuenta(antes, e.team) - cuenta(despues, e.team);
  return Math.max(0, neto);
}

// Los planes de un agente, cada uno con sus puntos y razones
export function planesDe(op, rng = Math.random) {
  const planes = [];
  if (!op.alive || !op.ready) return planes;
  const mapa = (() => { try { return threatMap(op); } catch (e) { return null; } })();
  const comoTrabado = { ...op, order: "engage" };
  const ruido = () => PESOS.azar * (rng() - 0.5);

  // 1. trabado: combatir (o retroceder si pierde)
  const cerca = enZonaDeControl(op, OPS);
  if (cerca.length && ARMAS_CC(op).length) {
    for (const e of cerca) {
      const wB = ARMAS_CC(e)[0];
      const r = combate(WPN[ARMAS_CC(op)[0]], wB ? WPN[wB] : null, { heridas: op.wounds }, { heridas: e.wounds },
        { atacanteLesionado: isInjured(op), blancoLesionado: isInjured(e) });
      const puntos = PESOS.dano * r.alBlanco.esperado + PESOS.incapacitar * r.alBlanco.incapacitar
        - PESOS.recibido * r.alAtacante.esperado - PESOS.incapacitar * 0.5 * r.alAtacante.incapacitar
        + PESOS.romper * valorRomper(op, e) * r.alBlanco.incapacitar + ruido();
      planes.push({ op, tipo: "combatir", orden: "engage", pasos: [{ accion: "fight", blanco: e }], puntos,
        razon: { blanco: e, romper: valorRomper(op, e), esperado: r.alBlanco.esperado, incapacitar: r.alBlanco.incapacitar, recibido: r.alAtacante.esperado } });
    }
  }

  // 2. disparar desde donde está
  if (!cerca.length && puede(comoTrabado, "shoot", OPS).ok) {
    const d = mejorDisparo(op, op.x, op.y);
    if (d) planes.push({ op, tipo: "disparar", orden: "engage", pasos: [{ accion: "shoot", blanco: d.blanco, arma: d.arma }],
      puntos: d.puntos - riesgo(mapa, op.x, op.y).puntos * 0.5 + ruido(), razon: { blanco: d.blanco, arma: d.arma, romper: d.romper, ...d.r } });
  }

  // 3. moverse (y disparar si puede), ir a un objetivo o ponerse a cubierto
  if (!cerca.length && op.apl >= 1) {
    const vistos = new Set();
    for (const p of destinos(op, "reposition", vistos)) {
      const rg = riesgo(mapa, p.x, p.y), vo = valorObjetivos(op, p.x, p.y), obj = vo.obj;
      const d = op.apl >= 2 ? mejorDisparo(op, p.x, p.y) : null;
      if (d) planes.push({ op, tipo: "moverYDisparar", orden: "engage",
        pasos: [{ accion: "reposition", x: p.x, y: p.y }, { accion: "shoot", blanco: d.blanco, arma: d.arma }],
        puntos: d.puntos - rg.puntos + vo.puntos + ruido(), razon: { blanco: d.blanco, arma: d.arma, romper: d.romper, ...d.r, riesgo: rg, objetivo: obj, obj: vo } });
      if (obj) planes.push({ op, tipo: "objetivo", orden: "conceal", pasos: [{ accion: "reposition", x: p.x, y: p.y }],
        puntos: vo.puntos + (vo.sostiene ? PESOS.sostener : 0) - rg.puntos + ruido(), razon: { objetivo: obj, riesgo: rg, obj: vo } });
      planes.push({ op, tipo: "cubrirse", orden: "conceal", pasos: [{ accion: "reposition", x: p.x, y: p.y }],
        puntos: PESOS.cubierto + vo.puntos - rg.puntos + ruido(), razon: { riesgo: rg, obj: vo } });
    }
  }

  // 4. cargar y combatir
  if (!cerca.length && puede(comoTrabado, "charge", OPS).ok && ARMAS_CC(op).length) {
    const allow = effMove(op) + 2, R = opR(op);
    useBase(R);
    for (const e of OPS) {
      if (!e.alive || e.team === op.team || dist(op.x, op.y, e.x, e.y) > allow + R + opR(e) + CTRL) continue;
      const a = Math.atan2(op.y - e.y, op.x - e.x), g = R + opR(e) + 0.4;
      const p = nearestFree(e.x + Math.cos(a) * g, e.y + Math.sin(a) * g, op.id, 0, 0.6);
      if (!p || opGap({ ...op, x: p[0], y: p[1] }, e) > CTRL) continue;
      const raw = planRoute(op, p[0], p[1], 0, allow, allow, true, 0);
      if (!raw || raw.partial || clampPath(raw, allow).clamped) continue;
      const wB = ARMAS_CC(e)[0];
      const r = combate(WPN[ARMAS_CC(op)[0]], wB ? WPN[wB] : null, { heridas: op.wounds }, { heridas: e.wounds },
        { atacanteLesionado: isInjured(op), blancoLesionado: isInjured(e) });
      const vo = valorObjetivos(op, p[0], p[1]), romper = valorRomper(op, e, p[0], p[1]);
      planes.push({ op, tipo: "cargar", orden: "engage", pasos: [{ accion: "charge", x: p[0], y: p[1], blanco: e }, { accion: "fight", blanco: e }],
        puntos: PESOS.dano * r.alBlanco.esperado + PESOS.incapacitar * r.alBlanco.incapacitar - PESOS.recibido * r.alAtacante.esperado
          + vo.puntos + PESOS.romper * romper * r.alBlanco.incapacitar + ruido(),
        razon: { blanco: e, romper, obj: vo, esperado: r.alBlanco.esperado, incapacitar: r.alBlanco.incapacitar, recibido: r.alAtacante.esperado } });
    }
  }

  // 5. no hacer nada útil: quedarse oculto donde está
  // (si ya sostiene un objetivo, quedarse oculto dentro de él vale más)
  const sostiene = !!objetivoControladoPor(op);
  planes.push({ op, tipo: "esperar", orden: "conceal", pasos: [],
    puntos: PESOS.cubierto * 0.5 + (sostiene ? PESOS.sostener : 0) - riesgo(mapa, op.x, op.y).puntos + ruido(), razon: { sostiene } });
  return planes;
}

// La activación que elige la IA para el bando `team`: el mejor plan de sus agentes apostados.
export function decidirActivacion(team, rng = Math.random) {
  let mejor = null;
  for (const op of OPS.filter(o => o.alive && o.team === team && o.ready))
    for (const p of planesDe(op, rng)) if (!mejor || p.puntos > mejor.puntos) mejor = p;
  return mejor;
}
