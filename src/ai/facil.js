/**
 * IA "fácil" (docs/IA.md §3): elige qué agente activar y qué hace, puntuando unos pocos planes
 * legales. Sin DOM: lee la partida (OPS, OBJECTIVES) y devuelve un plan; quien lo ejecuta es
 * la interfaz. Cada plan guarda sus razones para explicar la decisión en el registro.
 *
 * Planes por agente: disparar desde donde está · moverse y disparar · cargar y combatir ·
 * combatir si ya está trabado · ir a un objetivo · ponerse a cubierto.
 * Puntuación: daño esperado, probabilidad de incapacitar (y rematar a un lesionado), objetivos,
 * menos el riesgo de terminar donde le pueden cargar o disparar sin cobertura, más un poco de azar.
 */
import { BH, BW, OBJECTIVES, OPS } from '../engine/world.js';
import { CTRL, OBJ_R, WPN } from '../config.js';
import { dist, opGap, opR } from '../engine/geometry.js';
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
  objetivo: 4,        // por controlar un objetivo (más que matar si hay misión: subir este peso)
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
        { cubierto: !!sh.save, ofuscado: sh.kind === "obscured", certera: sh.accurate || 0, lesionado: isInjured(op) });
      const puntos = PESOS.dano * r.esperado + PESOS.incapacitar * r.incapacitar + (isInjured(e) ? PESOS.rematar * r.incapacitar : 0);
      if (!mejor || puntos > mejor.puntos) mejor = { blanco: e, arma: k, r, puntos };
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
const controla = (op, x, y) => OBJECTIVES.find(o => dist(x, y, o.x, o.y) - opR(op) - OBJ_R <= CTRL + 1e-9) || null;

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
        - PESOS.recibido * r.alAtacante.esperado - PESOS.incapacitar * 0.5 * r.alAtacante.incapacitar + ruido();
      planes.push({ op, tipo: "combatir", orden: "engage", pasos: [{ accion: "fight", blanco: e }], puntos,
        razon: { blanco: e, esperado: r.alBlanco.esperado, incapacitar: r.alBlanco.incapacitar, recibido: r.alAtacante.esperado } });
    }
  }

  // 2. disparar desde donde está
  if (!cerca.length && puede(comoTrabado, "shoot", OPS).ok) {
    const d = mejorDisparo(op, op.x, op.y);
    if (d) planes.push({ op, tipo: "disparar", orden: "engage", pasos: [{ accion: "shoot", blanco: d.blanco, arma: d.arma }],
      puntos: d.puntos - riesgo(mapa, op.x, op.y).puntos * 0.5 + ruido(), razon: { blanco: d.blanco, arma: d.arma, ...d.r } });
  }

  // 3. moverse (y disparar si puede), ir a un objetivo o ponerse a cubierto
  if (!cerca.length && op.apl >= 1) {
    const vistos = new Set();
    for (const p of destinos(op, "reposition", vistos)) {
      const rg = riesgo(mapa, p.x, p.y), obj = controla(op, p.x, p.y);
      const d = op.apl >= 2 ? mejorDisparo(op, p.x, p.y) : null;
      if (d) planes.push({ op, tipo: "moverYDisparar", orden: "engage",
        pasos: [{ accion: "reposition", x: p.x, y: p.y }, { accion: "shoot", blanco: d.blanco, arma: d.arma }],
        puntos: d.puntos - rg.puntos + (obj ? PESOS.objetivo : 0) + ruido(), razon: { blanco: d.blanco, arma: d.arma, ...d.r, riesgo: rg, objetivo: obj } });
      if (obj) planes.push({ op, tipo: "objetivo", orden: "conceal", pasos: [{ accion: "reposition", x: p.x, y: p.y }],
        puntos: PESOS.objetivo - rg.puntos + ruido(), razon: { objetivo: obj, riesgo: rg } });
      planes.push({ op, tipo: "cubrirse", orden: "conceal", pasos: [{ accion: "reposition", x: p.x, y: p.y }],
        puntos: PESOS.cubierto - rg.puntos + ruido(), razon: { riesgo: rg } });
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
      planes.push({ op, tipo: "cargar", orden: "engage", pasos: [{ accion: "charge", x: p[0], y: p[1], blanco: e }, { accion: "fight", blanco: e }],
        puntos: PESOS.dano * r.alBlanco.esperado + PESOS.incapacitar * r.alBlanco.incapacitar - PESOS.recibido * r.alAtacante.esperado + ruido(),
        razon: { blanco: e, esperado: r.alBlanco.esperado, incapacitar: r.alBlanco.incapacitar, recibido: r.alAtacante.esperado } });
    }
  }

  // 5. no hacer nada útil: quedarse oculto donde está
  planes.push({ op, tipo: "esperar", orden: "conceal", pasos: [], puntos: PESOS.cubierto * 0.5 - riesgo(mapa, op.x, op.y).puntos + ruido(), razon: {} });
  return planes;
}

// La activación que elige la IA para el bando `team`: el mejor plan de sus agentes apostados.
export function decidirActivacion(team, rng = Math.random) {
  let mejor = null;
  for (const op of OPS.filter(o => o.alive && o.team === team && o.ready))
    for (const p of planesDe(op, rng)) if (!mejor || p.puntos > mejor.puntos) mejor = p;
  return mejor;
}
