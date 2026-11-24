/**
 * Side panels (operative card, verdict, tray), actions (shoot, fight, undo) and UI state.
 */
import { state } from '../state.js';
import { CTRL, TEAMCOL, TEAMCOL_LT, TEAMNAME, WPN } from '../config.js';
import { retrato } from '../view3d/units.js';
import { aplicarCombate, bloquear, certera, clasificarAtaque, critDesde, decisionCombate, effHit, fightRoll, iniciarCombate,
  armaPara, distanciaRegla, isInjured, meleeKey, opcionesCombate, resolverDisparo, rollAttack, shootRoll } from '../engine/dice.js';
import { elegirCombate, elegirDestino, elegirRepeticion, elegirSigilosos, ofrecerArdides, preguntarHabilidad } from './tirada.js';
import { activar, candidatos, silenciado, silenciar } from '../game/disparadores.js';
import { quitarPrestadas, conectarRegistro, conectarArdides, dadosGuardados, gastarDestino, gastarHabilidad, habilidadDisponible, opcionesSigilosos } from './ardides.js';
import { opGap, opR } from '../engine/geometry.js';
import { nearestFree, opLayer, useBase } from '../engine/movement.js';
import { SHOT_KINDS, cannotShoot, judgeShot, shotsFrom } from '../engine/shots.js';
import { KINDS, OPS } from '../engine/world.js';
import { aturdir, critDanoCombate, danoDevastadoraArea, quemarMente, quitarAturdido, quitarQuemarMente, terrotoxinas,
  veneno } from '../engine/efectos.js';
import { SHOT_COL, renderAll } from './board.js';
import { HINT0, aviso, fmtDice, hint, logLine } from './dom.js';
import { RULES, fmtIn, moveSpec } from '../rules/index.js';
import { mayControl, online } from '../net/sync.js';
import { showRoll } from './dicetray.js';
import { fairNote, rollFor } from '../net/roll.js';
import { renderMinis } from './minis.js';
import { T, pulg } from '../i18n/es.js';
import { accionesHooks, renderAcciones } from './acciones.js';
import { accionesLegales, agotada, alcanceArma, blancoValidoCon, buscadoraAplica, costeAccion, puede, puedeCambiarOrden } from '../game/acciones.js';
import { alternasObligatorias, conectarTurno, pistaDeTurno, porQueNoActua, puedeActuar, todosUsados } from './turno.js';
import { control, esDeLaIA } from './control.js';

// Repetición de mando (ardid de tiroteo, 1 PM, sin límite de usos): repetir un dado fallado.
// Pregunta al jugador (la IA decide sola: repite su peor fallo si le queda PM). Cambia `dados`
// en el lugar y devuelve true si se usó.
// fijos: índices de dados que no se pueden repetir (los puestos con El destino es mi arma)
async function repeticionDeMando(team, dados, exito, die, titulo, quien, contexto = [], inutil = false, fijos = null) {
  if (tray.cp[team] < 1 || (!esDeLaIA(team) && silenciado(tray, team, T.repeticion.nombre))) return false;
  const ok = dados.map((v, k) => exito(v) || !!(fijos && fijos.has(k)));
  if (ok.every(Boolean)) return false;
  let i;
  if (esDeLaIA(team)) {
    if (inutil) return false;          // la IA no gasta PM si repetir no puede cambiar el resultado
    i = dados.map((v, k) => [v, k]).filter(([, k]) => !ok[k]).sort((x, y) => x[0] - y[0])[0][1];
  } else i = await elegirRepeticion({ titulo, quien, dados, exito: ok, pm: tray.cp[team], contexto });
  if (i === 'silencio') { silenciar(tray, team, T.repeticion.nombre); return false; }   // No avisar hasta el próximo PI
  if (i === null || i === undefined) return false;
  const antes = dados[i];
  dados[i] = die();
  tray.cp[team] -= 1;
  logLine(T.repeticion.log(TEAMNAME[team], antes, dados[i]));
  return true;
}
// El destino es mi arma: antes de repetir, cada bando con dados guardados puede cambiar un dado de
// ataque de esta secuencia (suyo o del rival). grupos: [{team, nombre, dados, exito(v), fijos}].
// Devuelve los grupos cambiados. La IA solo mejora sus propios dados.
async function usarDestino(grupos) {
  const cambiados = new Set();
  for (const s of [0, 1]) {
    const g = dadosGuardados(s);
    if (!g.length) continue;
    let e = null;
    if (esDeLaIA(s)) {
      const mejor = g.map((v, k) => [v, k]).sort((x, y) => y[0] - x[0])[0];
      for (const [j, gr] of grupos.entries()) {
        if (gr.team !== s || !gr.exito(mejor[0])) continue;
        const i = gr.dados.findIndex(v => !gr.exito(v));
        if (i >= 0) { e = { g: mejor[1], grupo: j, i }; break; }
      }
    } else {
      e = await elegirDestino({ quien: TEAMNAME[s], guardados: g,
        grupos: grupos.map(gr => ({ nombre: gr.nombre, dados: gr.dados, exito: gr.dados.map(gr.exito) })) });
    }
    if (!e) continue;
    const gr = grupos[e.grupo], antes = gr.dados[e.i], v = gastarDestino(s, e.g);
    gr.dados[e.i] = v; gr.fijos.add(e.i); cambiados.add(e.grupo);
    logLine(T.destino.log(TEAMNAME[s], antes, v, gr.nombre));
  }
  return [...cambiados];
}
// Ventana de ardides de tiroteo en un momento de la tirada (solo fuera de línea; la IA no recibe
// ventanas). Muestra juntos los que se pueden usar, aplica los activados (−1 PM, usado este punto
// de inflexión) y guarda el silencio. Devuelve los disparadores que se activaron.
async function ventanaArdides(momento, ctx) {
  const c = candidatos(tray, momento, ctx).filter(({ bando }) => !esDeLaIA(bando) && mayControl({ team: bando }));
  if (!c.length) return [];
  const { activar: si, silenciar: no } = await ofrecerArdides({ pm: tray.cp,
    lista: c.map(({ d, bando }) => ({ id: d.id, nombre: d.ardid, desc: T.ardidDesc[d.ardid] || '', gratis: !!d.gratis, bando, quien: TEAMNAME[bando] })) });
  const hechos = [];
  for (const { d, bando } of c) {
    if (no.includes(d.id)) silenciar(tray, bando, d.ardid);
    if (si.includes(d.id) && activar(tray, bando, d.ardid, !!d.gratis)) {
      logLine(d.gratis ? T.ventanaArdid.logEquipo(TEAMNAME[bando], d.ardid) : T.ventanaArdid.log(TEAMNAME[bando], d.ardid));
      await d.efecto(ctx); hechos.push(d);
    }
  }
  return hechos;
}
// el agente al que ya se le sugirió terminar su activación por quedarse sin PA
let avisadoSinPA = null;
let avisadoOrden = null;

/* ---------- state / undo / log ---------- */
// ini: bando con la iniciativa (null antes de decidirla); ardides: los usados en este PI
export let tray = {tp:1, cp:[2,2], vp:[0,0], ini:null, ardides:[[],[]]};
conectarArdides(tray); conectarRegistro(logLine);                // los ardides leen qué se usó en este punto de inflexión
export const undoStack = [];
// other modules' state that undo restores too ({get, set}; the ops & score panel)
export const undoExtras = [];
// Where each operative stood when its activation began, for "Undo activation". Every
// snapshot (taken before each change) refreshes the operatives that haven't acted yet,
// so the entry freezes the moment one starts acting. Local to this browser.
const actStart = new Map();
const untouched = o => o.ready && !o.used.length && o.ap === o.apl;
// An order change costs no AP, so it can be the first thing an activation does: the record
// taken before it (same turning point, same spot, different order) must not be refreshed.
const orderChanged = o => {
  const st = actStart.get(o.id);
  return !!st && !!RULES.orders && st.tp === tray.tp && st.order !== o.order && st.x === o.x && st.y === o.y && st.z === (o.z || 0);
};
// cada estado guardado lleva un número: así se sabe si hubo otra acción después de un movimiento
let guardados = 0;
// el último movimiento (para deshacerlo con doble toque, solo si no hizo nada después)
let ultimoMov = null;
export function registrarMovimiento(op, tipos) { ultimoMov = { id: op.id, tipos, guardado: guardados }; }
export function snapshot() {
  guardados++;
  for (const o of OPS) if (o.alive && untouched(o) && !orderChanged(o)) actStart.set(o.id, {tp: tray.tp, x: o.x, y: o.y, z: o.z || 0, order: o.order});
  undoStack.push(JSON.stringify({ops:OPS, tray, extras: undoExtras.map(x => x.get())}));
  if (undoStack.length > 40) undoStack.shift();
}
export function doUndo() {
  ultimoMov = null;
  const s = undoStack.pop();
  if (!s) { hint(online() ? T.deshacer.nadaEnLinea : T.deshacer.nada); return false; }
  const o = JSON.parse(s); OPS.splice(0, OPS.length, ...o.ops); Object.assign(tray, o.tray);
  if (o.extras) undoExtras.forEach((x, i) => { if (o.extras[i] !== undefined) x.set(o.extras[i]); });
  if (state.sel) state.sel = OPS.find(x => x.id === state.sel.id) || null;
  state.target = null; state.lastShot = null; cancelMode();
  logLine(T.deshacer.hecho);
  renderAll(); renderMinis();             // the roster may have changed (Miniatures panel)
  return true;
}

/* ---------- combat ---------- */
// Área x y Ráfaga x: los blancos secundarios de un disparo de `a` a `b` (shot: cómo se juzgó b),
// como [{id, acc, obsc, cover}].
//  - Área: todo agente (de cualquier bando, salvo el tirador) a x″ o menos del blanco y visible
//    para él; son blancos válidos aunque estén ocultos, y a cubierto si el principal lo estaba.
//  - Ráfaga: los demás blancos válidos a x″ o menos del blanco, que no estén en la zona de
//    control de un agente amigo del tirador; cada uno juzgado desde el tirador.
export function blancosSecundarios(a, b, w, shot) {
  const area = distanciaRegla(w.rules, "Blast"), rafaga = distanciaRegla(w.rules, "Torrent");
  const cerca = (o, d) => o.alive && o.deployed !== false && o.id !== a.id && o.id !== b.id && opGap(o, b) <= d + 1e-9;
  if (area) {
    const ojo = { x: b.x, y: b.y, z: b.z || 0, team: b.team, op: b };
    return OPS.filter(o => cerca(o, area) && judgeShot(ojo, o).kind !== "hidden")
      .map(o => ({ id: o.id, acc: 0, obsc: false, cover: !!shot.save }));
  }
  if (rafaga) {
    const amigos = OPS.filter(o => o.alive && o.team === a.team);
    return shotsFrom({ x: a.x, y: a.y, z: a.z || 0, team: a.team, op: a })
      .filter(s => cerca(s.target, rafaga) && (SHOT_KINDS[s.kind].valid || buscadoraAplica(w, s)) && blancoValidoCon(w, s)
        && !amigos.some(f => opGap(f, s.target) <= CTRL + 1e-9))
      .map(s => ({ id: s.target.id, acc: Math.min(s.accurate || 0, w.atk), obsc: !!s.obscured, cover: !!s.save }));
  }
  return [];
}
// Lo que pasa después de una tirada de disparo además del daño al blanco: Devastadora con
// distancia y Aturdidora. Devuelve el texto para el registro.
function efectosDisparo(a, b, r) {
  let extra = "";
  if (quemarMente(OPS, a, b, r.w.rules, r)) extra += T.disparo.quemaMente(b.name);
  if (terrotoxinas(a, b, r.w.rules, r.critDano)) extra += T.disparo.terrotoxinas(b.name);
  const area = danoDevastadoraArea(OPS, b, r);
  if (area.length) extra += T.disparo.devArea(r.devArea.dmg, r.devArea.dist,
    area.map(o => o.name + (o.alive ? "" : T.disparo.cae)));
  if (aturdir(b, r.w.rules, r.atkC)) extra += T.disparo.aturdido(b.name);
  return extra;
}
// Cada blanco secundario, uno tras otro: su propia tirada (sin decisiones a mitad), sin gastar
// PA ni usos; Sobrecalentamiento solo se tiró en el principal.
async function disparosSecundarios(a, what, lista) {
  for (const s of lista) {
    const b = OPS.find(o => o.id === s.id);
    if (!a.alive || !b || !b.alive) continue;
    const w2 = { k: "shoot", by: a.id, at: b.id, w: what.w, acc: s.acc, obsc: s.obsc, cover: s.cover, sec: what.at };
    await new Promise(fin => {
      const why = rollFor(w2, (die, done, n) => {
        const r = shootRoll(w2, a, b, die);
        if (!r) { fin(); return; }
        showRoll(r.atk.dice, r.hit, a.team, T.disparo.tiradaAtq(a.name));
        showRoll(r.dfn.dice, b.save, b.team, T.disparo.tiradaDef(b.name, r.dfn.cover));
        b.wounds = Math.max(0, b.wounds - r.dmg);
        let line = `${T.disparo.secundario} ` + T.disparo.log(a.name, b.name, r.w.name, fmtDice(r.atk.dice), fmtDice(r.dfn.dice), r.dfn.cover, r.dmg, r.notes);
        if (b.wounds === 0) { b.alive = false; line += T.heridas.incapacitado; }
        else if (isInjured(b)) line += T.heridas.lesionado;
        line += efectosDisparo(a, b, r);
        logLine(line + fairNote(n), r.dmg > 0, true);
        rolled(n, done);
        fin();
      });
      if (why) fin();
    });
  }
}
// Por qué algo no se puede hacer: queda en el registro y sale un aviso en el centro (en el teléfono
// no hay tooltips ni se ve el registro). Se cierra solo.
function explicar(texto) {
  logLine(texto);
  aviso(texto, false, { siempre: true, ms: 7000, clave: "explica" });
}
// Por qué no se puede disparar ahora (o null): lo que doShoot comprobaría, sin hacer nada
function razonNoDisparar() {
  const a = state.sel;
  if (!a) return null;
  const w = WPN[a.weapon];
  if (w.type !== "R") return T.disparo.armaDeCombate;
  if (!state.target) return T.disparo.eligeBlanco;
  const no = cannotShoot(selEye());
  if (no) return T.disparo.noPuedeLog(a.name, noShootWhy(no));
  const shot = state.lastShot;
  if (!shot || !(SHOT_KINDS[shot.kind].valid || buscadoraAplica(w, shot))) return T.disparo.noValido(state.target.name, shot ? shotWhy(shot) : T.disparo.sinBlanco);
  if (!blancoValidoCon(w, shot)) return T.disparo.fueraDeAlcance(state.target.name, w.name, alcanceArma(w), shot.range);
  if (agotada(a, a.weapon)) return T.disparo.agotada(w.name);
  const pr = puede(a, "shoot", OPS);
  if (!pr.ok) return T.reglas.noPuede(T.reglas.accion.shoot, T.reglas.motivo[pr.motivo] || pr.motivo);
  return null;
}
function razonNoCombatir() {
  const a = state.sel;
  if (!a) return null;
  if (!state.target) return T.combate.eligeBlanco;
  if (opGap(a, state.target) > CTRL) return T.combate.fueraDeZona(CTRL);
  const pr = puede(a, "fight", OPS);
  if (!pr.ok) return T.reglas.noPuede(T.reglas.accion.fight, T.reglas.motivo[pr.motivo] || pr.motivo);
  return null;
}
const ACCION_DE = { "mv-reposition": "reposition", "mv-dash": "dash", "mv-charge": "charge", "mv-fallBack": "fallBack" };
// El motivo por el que el botón de la barra de acciones no se puede usar ahora (o null)
accionesHooks.porQue = id => {
  if (!state.sel) return null;
  if (id === "shootbtn") return razonNoDisparar();
  if (id === "fightbtn") return razonNoCombatir();
  if (id === "ordbtn") return T.orden.fijada;
  const a = ACCION_DE[id];
  if (!a) return null;
  const r = accionesLegales(state.sel, OPS).find(x => x.accion === a);
  return r && !r.ok && r.motivo !== "yaHecha" ? T.reglas.noPuede(T.reglas.accion[a], T.reglas.motivo[r.motivo] || r.motivo) : null;
};
export function doShoot() {
  if (!state.sel || !state.target) return;
  const w = WPN[state.sel.weapon];
  if (w.type !== "R") { explicar(T.disparo.armaDeCombate); return; }
  const no = cannotShoot(selEye());
  if (no) { explicar(T.disparo.noPuedeLog(state.sel.name, noShootWhy(no))); return; }
  refreshSight();                        // judge it as things stand now, not when targeted
  const shot = state.lastShot;
  if (!shot || !(SHOT_KINDS[shot.kind].valid || buscadoraAplica(w, shot))) {
    explicar(T.disparo.noValido(state.target.name, shot ? shotWhy(shot) : T.disparo.sinBlanco));
    renderAll(); return;
  }
  if (!blancoValidoCon(w, shot)) {        // Alcance x: más lejos que el alcance del arma
    explicar(T.disparo.fueraDeAlcance(state.target.name, w.name, alcanceArma(w), shot.range)); return;
  }
  if (agotada(state.sel, state.sel.weapon)) { explicar(T.disparo.agotada(w.name)); return; }
  // ya disparó todas las veces que puede, sin PA, o repite arma psíquica (regla Astartes)
  const pr = puede(state.sel, "shoot", OPS);
  if (!pr.ok && ["yaHecha", "sinPA", "psiquicaRepetida", "sinBolter"].includes(pr.motivo)) {
    explicar(T.reglas.noPuede(T.reglas.accion.shoot, T.reglas.motivo[pr.motivo])); return;
  }
  // what is rolled for: the shot as this table judges it, fixed before the dice are known
  const what = {k: "shoot", by: state.sel.id, at: state.target.id, w: state.sel.weapon,
                acc: Math.min(shot.accurate, w.atk), obsc: !!shot.obscured, cover: !!shot.save};
  // Área / Ráfaga: quiénes más reciben el disparo, decidido al apuntar
  const secundarios = blancosSecundarios(state.sel, state.target, w, shot);
  if (secundarios.length) logLine(T.disparo.secundarios(distanciaRegla(w.rules, "Blast") ? "area" : "rafaga",
    secundarios.map(s => OPS.find(o => o.id === s.id).name)));
  // la tirada puede esperar decisiones del jugador: la promesa se cumple al resolverse (la IA la espera)
  let terminar;
  const hecho = new Promise(r => { terminar = r; });
  const why = rollFor(what, async (die, done, n, cancel) => {
    // the dice arrive a moment after the click: judge again what they are for
    const a = OPS.find(o => o.id === what.by), b = OPS.find(o => o.id === what.at);
    if (!a || !b || !a.alive || !b.alive || a.ap < costeAccion(a, "shoot", what.w) || a.weapon !== what.w) {
      cancel();
      logLine(T.disparo.yaNo(a ? a.name : what.by));
      renderAll(); terminar(); return;
    }
    snapshot();
    let r;
    if (n != null || online()) r = shootRoll(what, a, b, die);   // en línea: sin decisiones a mitad de tirada
    else {
      // fuera de línea: se puede usar Repetición de mando en el ataque y en la defensa
      const w = armaPara(WPN[what.w], a, b, "disparo"), hit = effHit(a, w), cd = critDesde(w.rules);
      const atk = rollAttack(Math.max(0, w.atk - certera(what, w)), hit, w.rules, die);
      const exitoAtk = v => v !== 1 && (v >= cd || v >= hit), fijos = new Set();
      if ((await usarDestino([{ team: a.team, nombre: a.name, dados: atk.dice, exito: exitoAtk, fijos }])).length)
        Object.assign(atk, clasificarAtaque(atk.dice, hit, w.rules));
      const ctxAtk = T.repeticion.ctxAtaque(atk.crit, w.dmgC, atk.norm, w.dmgN, b.name, b.save, !!what.cover);
      if (await repeticionDeMando(a.team, atk.dice, exitoAtk, die, T.repeticion.ataque, a.name, ctxAtk, false, fijos))
        Object.assign(atk, clasificarAtaque(atk.dice, hit, w.rules));
      // Sigilosos: el defensor elige cómo guardar su cobertura (la computadora, sola)
      const sig = opcionesSigilosos(b, w, what);
      if (sig.length && !esDeLaIA(b.team))
        what.sigilo = await elegirSigilosos({ quien: b.name, atacante: a.name, ids: sig, ataque: { crit: atk.crit, norm: atk.norm + certera(what, w) } });
      if (habilidadDisponible(b, "danoNormal") && !esDeLaIA(b.team)) what.aura = false;   // la ventana decide
      r = resolverDisparo(what, w, hit, atk, b, die);
      // lo que sacó el atacante y cuánto cambiaría el daño si la repetición sale bien
      const siNormal = r.dev + bloquear(r.atkN, r.atkC, r.dfn.norm + 1, r.dfn.crit, w.dmgN, w.dmgC).dmg;
      const siCritico = r.dev + bloquear(r.atkN, r.atkC, r.dfn.norm, r.dfn.crit + 1, w.dmgN, w.dmgC).dmg;
      const ctxDfn = T.repeticion.ctxDefensa(a.name, r.atkC, w.dmgC, r.atkN, w.dmgN, r.dev, r.dmg, siNormal, siCritico);
      const dfn = [...r.dfn.dice];
      if (dfn.length && await repeticionDeMando(b.team, dfn, v => v === 6 || (v !== 1 && v >= b.save), die, T.repeticion.defensa, b.name, ctxDfn, siCritico === r.dmg))
        r = resolverDisparo(what, w, hit, atk, b, die, dfn, r.hotDado);
      // Aura de hierro: un dado normal va a hacerle daño: ¿lo ignora?
      if (r.auraPosible && what.aura === false && await preguntarHabilidad("aura", [a.name, w.dmgN], b.name)) {
        what.aura = true;
        r = resolverDisparo(what, w, hit, atk, b, die, [...r.dfn.dice], r.hotDado);
      }
      // Ardides de tiroteo al recibir daño (p. ej. Todo es polvo): cuántos dados normales llegan
      const resto = r.aura ? { n: 0, c: 0 } : bloquear(r.atkN, r.atkC, r.dfn.norm, r.dfn.crit, w.dmgN, w.dmgC);
      await ventanaArdides('recibirDano', { a, b, w, r, normales: resto.n, criticos: resto.c });
    }
    showRoll(r.atk.dice, r.hit, a.team, T.disparo.tiradaAtq(a.name));
    showRoll(r.dfn.dice, b.save, b.team, T.disparo.tiradaDef(b.name, r.dfn.cover));
    b.wounds = Math.max(0, b.wounds - r.dmg);
    if (r.aura) gastarHabilidad(b, "aura");       // Aura de hierro: ya la gastó
    a.ap -= costeAccion(a, "shoot", what.w); a.used.push("shoot");
    a.psiPI = [...(a.psiPI || []), what.w];   // armas ya usadas en este punto de inflexión (Cábala psíquica)
    a.disparadas = [...(a.disparadas || []), what.w.split("~")[0]];   // Astartes: armas psíquicas ya usadas
    a.usos = { ...(a.usos || {}), [what.w]: ((a.usos || {})[what.w] || 0) + 1 };   // Limitada
    let line = T.disparo.log(a.name, b.name, r.w.name, fmtDice(r.atk.dice), fmtDice(r.dfn.dice), r.dfn.cover, r.dmg, r.notes);
    if (b.wounds === 0) { b.alive = false; line += T.heridas.incapacitado; }
    else if (isInjured(b)) line += T.heridas.lesionado;
    if (r.selfDmg) {                     // Sobrecalentamiento: el tirador se daña
      a.wounds = Math.max(0, a.wounds - r.selfDmg);
      line += T.disparo.sobrecalentado(a.name, r.selfDmg);
      if (a.wounds === 0) { a.alive = false; line += T.heridas.incapacitado; }
    }
    line += efectosDisparo(a, b, r);     // Devastadora con distancia, Aturdidora
    logLine(line + fairNote(n), r.dmg > 0, true);   // también en un aviso en pantalla
    rolled(n, done);
    if (secundarios.length) await disparosSecundarios(a, what, secundarios);
    terminar();
  });
  if (why) { hint(T.disparo.aunNo(why)); terminar(); }
  return hecho;
}
// a roll's result is in: send it (online), and online a shared roll can't be undone
function rolled(n, done) {
  done();
  if (n != null) undoStack.length = 0;
  cancelMode(); renderAll();
  control.alComprobarFin();        // ¿un bando se quedó sin agentes?
}
export function doFight() {
  if (!state.sel || !state.target) return;
  const gap = opGap(state.sel, state.target);
  if (gap > CTRL) { explicar(T.combate.fueraDeZona(CTRL)); return; }
  // ya combatió todas las veces que puede (dos, si es Astartes) o no le quedan PA
  const pr = puede(state.sel, "fight", OPS);
  if (!pr.ok && ["yaHecha", "sinPA"].includes(pr.motivo)) {
    explicar(T.reglas.noPuede(T.reglas.accion.fight, T.reglas.motivo[pr.motivo])); return;
  }
  const what = {k: "fight", by: state.sel.id, at: state.target.id, wa: meleeKey(state.sel),
                wb: state.target.weapons.find(k => WPN[k].type === "M") || "knife"};
  let terminar;
  const hecho = new Promise(r => { terminar = r; });
  const why = rollFor(what, async (die, done, n, cancel) => {
    const a = OPS.find(o => o.id === what.by), b = OPS.find(o => o.id === what.at);
    if (!a || !b || !a.alive || !b.alive || a.ap < 1 || opGap(a, b) > CTRL) {
      cancel();
      logLine(T.combate.yaNo(a ? a.name : what.by));
      renderAll(); terminar(); return;
    }
    snapshot();
    let r;
    if (n != null || online()) r = fightRoll(what, a, b, die);   // en línea: decisiones automáticas
    else {
      // fuera de línea: Repetición de mando y, en cada turno, golpear o bloquear (la IA decide sola)
      const est = iniciarCombate(what, a, b, die);
      const lados = [[0, a, est.ra, est.hitA, est.wa], [1, b, est.rb, est.hitB, est.wb]];
      const reclasificar = (k, roll, hit, w) => {
        Object.assign(roll, clasificarAtaque(roll.dice, hit, w.rules));
        est.pools[k].crit = roll.crit; est.pools[k].norm = roll.norm + (est.acc[k] || 0);
      };
      // El destino es mi arma: antes de repetir, sobre los dados de cualquiera de los dos
      const fijosC = [new Set(), new Set()];
      const grupos = lados.map(([k, op, roll, hit, w]) => ({ team: op.team, nombre: op.name, dados: roll.dice,
        exito: v => v !== 1 && (v >= critDesde(w.rules) || v >= hit), fijos: fijosC[k] }));
      for (const k of await usarDestino(grupos)) reclasificar(k, lados[k][2], lados[k][3], lados[k][4]);
      for (const [k, op, roll, hit, w] of lados) {
        const cd = critDesde(w.rules);
        // los éxitos de los dos y sus heridas: el rival ya tiró
        const p = est.pools[k], q = est.pools[1 - k], rival = k === 0 ? b : a;
        const ctx = T.repeticion.ctxCombate(p.crit, p.w.dmgC, p.norm, p.w.dmgN, est.vida[k].wounds,
          rival.name, q.crit, q.w.dmgC, q.norm, q.w.dmgN, est.vida[1 - k].wounds);
        if (await repeticionDeMando(op.team, roll.dice, v => v !== 1 && (v >= cd || v >= hit), die, T.repeticion.combate, op.name, ctx, false, fijosC[k]))
          reclasificar(k, roll, hit, w);
      }
      const quedan = k => est.pools[k].crit + est.pools[k].norm > 0;
      est.fin = !quedan(0) && !quedan(1);
      if (!est.fin && !quedan(0)) est.turno = 1;
      let guard = 0;
      while (!est.fin && guard++ < 60) {
        const ops = opcionesCombate(est);
        if (!ops.length) { est.turno = 1 - est.turno; if (!opcionesCombate(est).length) break; continue; }
        const lado = est.turno === 0 ? a : b;
        let op = esDeLaIA(lado.team) ? decisionCombate(est)
          : await elegirCombate(est, { nombres: [a.name, b.name], opciones: ops });
        // Aura de hierro: si este golpe normal va a hacerle daño al otro, su jugador decide si lo ignora
        const [riv, ri] = est.turno === 0 ? [b, 1] : [a, 0];
        if (op.tipo === "golpe" && op.con === "norm" && est.pools[est.turno].w.dmgN > 0 && est.rasgos[ri].aura
            && !est.usado["aura" + ri] && !esDeLaIA(riv.team))
          op = { ...op, aura: await preguntarHabilidad("aura", [lado.name, est.pools[est.turno].w.dmgN], riv.name) };
        // Ardides de tiroteo al recibir daño normal (Todo es polvo): baja el daño de este dado
        const dN = est.pools[est.turno].w.dmgN;
        if (op.tipo === "golpe" && op.con === "norm" && !op.aura && dN > 0) {
          const c = { a: lado, b: riv, w: est.pools[est.turno].w, r: { dmg: dN, notes: [] }, normales: 1 };
          await ventanaArdides('recibirDano', c);
          if (c.r.dmg < dN) op = { ...op, menos: dN - c.r.dmg };
        }
        aplicarCombate(est, op);
      }
      r = { wa: est.wa, wb: est.wb, hitA: est.hitA, hitB: est.hitB, ra: est.ra, rb: est.rb, a: est.vida[0], b: est.vida[1], pasos: est.pasos };
    }
    showRoll(r.ra.dice, r.hitA, a.team, T.combate.tiradaAtq(a.name));
    showRoll(r.rb.dice, r.hitB, b.team, T.combate.tiradaDef(b.name));
    Object.assign(a, r.a); Object.assign(b, r.b);
    for (const p of r.pasos || []) if (p.aura) gastarHabilidad(p.quien === 0 ? b : a, "aura");   // Aura de hierro
    a.ap -= 1; a.used.push("fight");
    const aturdidos = [aturdir(b, r.wa.rules, r.ra.crit) && b, aturdir(a, r.wb.rules, r.rb.crit) && a].filter(Boolean);
    const envenenados = [terrotoxinas(a, b, r.wa.rules, critDanoCombate(r.pasos, 0)) && b,
      terrotoxinas(b, a, r.wb.rules, critDanoCombate(r.pasos, 1)) && a].filter(Boolean);
    // quien la recibe en plena activación (el atacante, en el contraataque) sufre el veneno en la siguiente
    for (const o of envenenados) if (o.ready && ((o.used && o.used.length) || o.ap < o.apl)) o.venenoTP = tray.tp;
    let line = T.combate.log(a.name, b.name, fmtDice(r.ra.dice), fmtDice(r.rb.dice), a.wounds, b.wounds);
    if (!b.alive) line += T.combate.cae(b.name);
    if (!a.alive) line += T.combate.cae(a.name);
    for (const o of aturdidos) line += T.disparo.aturdido(o.name);
    for (const o of envenenados) line += T.disparo.terrotoxinas(o.name);
    logLine(line + fairNote(n), true, true);
    rolled(n, done);
    terminar();
  });
  if (why) { hint(T.combate.aunNo(why)); terminar(); }
  return hecho;
}
// The ruleset's move actions as buttons: ① main move, ② secondary move, and its charge.
function moveButtons(repoUsed, dashUsed, chargeUsed) {
  const M = RULES.moves, op = state.sel, out = [];
  const btn = (t, spec, used, prefix, title, extraCls = "") =>
    `<button id="mv-${t}" class="${state.moveType === t ? "active" : ""} ${used ? "used" : ""} ${extraCls}" title="${title}">` +
    `${used ? "✓ " + T.mover.nombre[t] : `${prefix}${T.mover.nombre[t]} ${pulg(op.reaccion ? Math.min(2, spec.allow(op)) : spec.allow(op))}`}</button>`;
  out.push(btn("reposition", M.primary, repoUsed, "① ", T.ficha.movTitulo(M.primary.allow(op), M.primary.climb)));
  out.push(btn("dash", M.secondary, dashUsed, "② ", T.ficha.movTitulo(M.secondary.allow(op), M.secondary.climb)));
  // Retroceder: solo aparece con un enemigo en su zona de control (en la barra, en lugar de Correr)
  if (OPS.some(o => o.alive && o.team !== op.team && opGap(op, o) <= CTRL + 1e-9))
    out.push(btn("fallBack", M.primary, op.used.includes("fallBack"), "", T.ficha.retrocederTitulo(M.primary.allow(op))));
  if (M.charge) {
    const restricted = !chargeUsed && (repoUsed || dashUsed);
    out.push(btn("charge", M.charge, chargeUsed, "", restricted
      ? T.ficha.cargaRestringida
      : T.ficha.cargaTitulo(M.charge.allow(op)), restricted ? "restricted" : ""));
  }
  return out.join("\n      ");
}
// Hand-applied damage (ploys, falls, house rules), logged the way TTS players' wound
// counters log it: "[12/15] Blademaster took damage".
export function adjustWounds(op, d) {
  if (!op || !op.alive) return;
  snapshot();
  op.wounds = Math.max(0, Math.min(op.maxW, op.wounds + d));
  let line = T.heridas.log(op.name, op.wounds, op.maxW, d < 0);
  if (op.wounds === 0) { op.alive = false; line += T.heridas.incapacitado; }
  else if (d < 0 && isInjured(op) && !isInjured({ ...op, wounds: op.wounds - d })) line += T.heridas.lesionado;
  logLine(line, d < 0);
  renderAll();
}
function woundClass(op) { const f = op.wounds / op.maxW; return f <= 0.25 ? "crit" : f < 0.5 ? "hurt" : ""; }
export function defaultMoveType(op) {
  // trabado (un enemigo en su zona de control): lo que puede hacer es Retroceder
  if (!op.used.includes("fallBack") && !op.used.includes("reposition") && !op.used.includes("charge")
      && OPS.some(o => o.alive && o.team !== op.team && opGap(op, o) <= CTRL + 1e-9)) return "fallBack";
  const slot1Used = op.used.includes("reposition") || op.used.includes("charge");
  if (!slot1Used) return "reposition";
  if (!op.used.includes("dash")) return "dash";
  return "reposition";
}
// Veneno de terrotoxinas: el agente con la ficha que empieza su activación (su primera acción en
// este punto de inflexión; una reacción no cuenta) recibe 1D3 de daño. Lo tira quien lo controla.
let tirandoVeneno = false;
function comprobarVeneno() {
  if (tirandoVeneno) return;
  const op = OPS.find(o => o.alive && o.ready && o.terrotoxinas && !o.reaccion && o.venenoTP !== tray.tp
    && ((o.used && o.used.length) || o.ap < o.apl) && mayControl(o));
  if (!op) return;
  tirandoVeneno = true;
  const what = { k: "veneno", by: op.id, at: op.id, tp: tray.tp };
  setTimeout(() => {
    const why = rollFor(what, (die, done, n) => {
      tirandoVeneno = false;
      if (!op.alive || op.venenoTP === tray.tp) { done(); return; }
      op.venenoTP = tray.tp;
      const d = veneno(op, die());
      logLine(T.disparo.veneno(op.name, d) + (op.alive ? "" : T.heridas.incapacitado) + fairNote(n), true, true);
      rolled(n, done);
    });
    if (why) tirandoVeneno = false;
  }, 0);
}
// El retrato del agente para su tarjeta (el mismo de su ficha 2D), o nada mientras no esté
const retratoHtml = op => { const u = retrato(op); return u ? `<img class="opretrato" src="${u}" alt="" style="border-color:${TEAMCOL[op.team]}">` : ""; };
export function renderCard() {
  comprobarVeneno();                 // ¿alguien con terrotoxinas acaba de empezar su activación?
  comprobarInicio();                 // ¿ardides al empezar la activación?
  const c = document.getElementById("opcard");
  // todos los agentes usados: sugerir "Fin del PI" (en el marcador y en la barra de acciones)
  const finPI = document.getElementById("endtp");
  if (finPI) finPI.classList.toggle("sugerido", todosUsados());
  if (!state.sel || !state.sel.alive) { c.innerHTML = `<span class="hint">${T.ficha.vacia}</span>`; renderAcciones(); return; }
  const inj = isInjured(state.sel);
  const meleeFoes = OPS.filter(o => o.alive && o.team !== state.sel.team && opGap(state.sel, o) <= CTRL);
  const repoUsed = state.sel.used.includes("reposition"), dashUsed = state.sel.used.includes("dash"), chargeUsed = state.sel.used.includes("charge");
  const slot1Used = repoUsed || chargeUsed;
  c.innerHTML = `
    <div class="opcabeza">${retratoHtml(state.sel)}
    <div class="opname" style="color:${TEAMCOL_LT[state.sel.team]}">${state.sel.id} · ${state.sel.name} ${KINDS[state.sel.kind] && KINDS[state.sel.kind].comando ? (KINDS[state.sel.kind].lider ? `<span class="tag">${T.fichaDatos.lider}</span>` : "") : `<span class="tag">${T.tipos[state.sel.kind] || state.sel.kind}</span>`}
      ${inj ? `<span class="tag warn">${T.ficha.lesionado}</span>` : ''}${state.sel.terrotoxinas ? ` <span class="tag warn">${T.ficha.terrotoxinas}</span>` : ''}${state.sel.aturdido ? ` <span class="tag warn">${T.ficha.aturdido}</span>` : ''}${state.sel.quemarMente ? ` <span class="tag warn">${T.ficha.quemarMente}</span>` : ''} ${state.sel.ready ? '' : `<span class="tag">${T.ficha.usado}</span>`}</div></div>
    <div class="stats">
      <div><div class="v">${state.sel.apl}</div><div class="k">${T.ficha.stat.lpa}</div></div>
      <div><div class="v">${pulg(RULES.moves.primary.allow(state.sel))}</div><div class="k">${T.ficha.stat.mov}</div></div>
      <div><div class="v">${state.sel.save}+</div><div class="k">${T.ficha.stat.salv}</div></div>
      <div><div class="v">${state.sel.wounds}/${state.sel.maxW}</div><div class="k">${T.ficha.stat.heridas}</div></div>
      <div><div class="v">${state.sel.ap}</div><div class="k">${T.ficha.stat.pa}</div></div>
      <div><div class="v" title="${T.ficha.dosMovimientos(T.mover.nombre.reposition, RULES.moves.charge ? T.mover.nombre.charge : null, T.mover.nombre.dash)}">${slot1Used?"○":"●"}${dashUsed?"○":"●"}</div><div class="k">${T.ficha.stat.movs}</div></div>
    </div>
    <div class="woundbar"><i class="${woundClass(state.sel)}" style="width:${100*state.sel.wounds/state.sel.maxW}%"></i></div>
    <div class="btnrow woundbtns">
      <button class="mini" id="wdn" title="${T.ficha.menosHeridaTitulo}">${T.ficha.menosHerida}</button>
      <button class="mini" id="wup" title="${T.ficha.masHeridaTitulo}" ${state.sel.wounds >= state.sel.maxW ? "disabled" : ""}>${T.ficha.masHerida}</button>
    </div>
    <div class="btnrow">
      ${RULES.orders ? (() => {   // la orden actual, y qué hará el botón (o por qué ya no se puede cambiar)
        const fija = !puedeCambiarOrden(state.sel).ok, o = state.sel.order;
        // oculto y sin haber actuado: se resalta, para elegir la orden antes de moverse
        const elegir = !fija && o === "conceal" && state.sel.ready && mayControl(state.sel) && !porQueNoActua(state.sel);
        return `<button id="ordbtn" class="orden ${o}${fija ? " fijada" : ""}${elegir ? " elegir" : ""}" title="${fija ? T.orden.fijada : T.orden.titulo(o)}"${fija ? " disabled" : ""}>` +
          `${fija ? T.orden.botonFijo(o) : T.orden.boton(o)}</button>`;
      })() : ""}
      <button id="endact"${state.sel.ready && state.sel.ap <= 0 ? ' class="sugerido"' : ""}>${T.ficha.terminar}</button>
      <button id="verficha">${T.fichaDatos.ver}</button>
    </div>
    <div class="weapons">${state.sel.weapons.map(k => {
      const w = WPN[k];
      return `<label><input type="radio" name="wpn" value="${k}" ${state.sel.weapon===k?"checked":""}>
        <span class="wname">${w.type==="R"?"⌖":"⚔"} ${w.name}</span>
        <span class="wstat">${w.atk}A ${effHit(state.sel,w)}+ ${w.dmgN}/${w.dmgC}${w.rules.length?" · "+T.ficha.reglas(w.rules):""}</span></label>`;
    }).join("")}</div>
    <div class="btnrow">${moveButtons(repoUsed, dashUsed, chargeUsed)}</div>
    <div class="btnrow">
      <button id="tgtbtn" class="${state.mode==='target'?'active':''}">${T.ficha.apuntarBoton}</button>
      <button id="shootbtn" ${(!state.target || !state.lastShot || !(SHOT_KINDS[state.lastShot.kind].valid || buscadoraAplica(WPN[state.sel.weapon], state.lastShot)) || cannotShoot(selEye()) || WPN[state.sel.weapon].type!=="R") ? "disabled" : ""}>${T.ficha.disparar}</button>
      <button id="fightbtn" ${meleeFoes.length ? "" : "disabled"}>${T.ficha.combatir}</button>
    </div>`;
  if (RULES.orders) c.querySelector("#ordbtn").onclick = () => toggleOrder(state.sel.id);
  c.querySelector("#endact").onclick = () => endActivation(state.sel);
  c.querySelectorAll("input[name=wpn]").forEach(r => r.onchange = () => { state.sel.weapon = r.value; refreshSight(); renderAll(); });
  c.querySelector("#wdn").onclick = () => adjustWounds(state.sel, -1);
  c.querySelector("#wup").onclick = () => adjustWounds(state.sel, +1);
  for (const t of ["reposition", "dash", "charge", "fallBack"]) {
    if (!c.querySelector("#mv-" + t)) continue;
    c.querySelector("#mv-" + t).onclick = () => {
      // doble toque sobre Reposicionarse o Correr: deshace ese movimiento si fue lo último que hizo
      const ahora = performance.now();
      if ((t === "reposition" || t === "dash") && toqueMov.t === t && ahora - toqueMov.en < 400) {
        toqueMov = { t: null, en: 0 };
        deshacerMovimiento(t);
        return;
      }
      toqueMov = { t, en: ahora };
      state.moveType = t;
      const label = T.mover.nombre[t];
      const r = state.sel ? puede(state.sel, t, OPS) : { ok: true };
      if (state.sel && state.sel.used.includes(t))
        hint(T.mover.yaUsado(label));
      else if (!r.ok)                           // las reglas no lo permiten: se explica (la mesa no lo impide)
        hint(T.reglas.noPuede(label, T.reglas.motivo[r.motivo] || r.motivo));
      else
        hint(T.mover.elegido(label, state.sel && state.sel.name, allowance()));
      renderCard();
    };
  }
  c.querySelector("#tgtbtn").onclick = () => { state.mode = state.mode === "target" ? null : "target";
    hint(state.mode === "target" ? T.seleccion.apuntando : HINT0); renderAll(); };
  c.querySelector("#shootbtn").onclick = doShoot;
  // online: los agentes del otro jugador se ven, no se manejan; activaciones alternas: tampoco
  // los que no tienen el turno (turno.js), con el motivo arriba de la ficha
  const noActua = porQueNoActua(state.sel);
  if (!mayControl(state.sel) || noActua)
    c.querySelectorAll("button:not(#tgtbtn):not(#verficha), input").forEach(b => { b.disabled = true; });
  if (noActua) c.insertAdjacentHTML("afterbegin", `<div class="turnoaviso">${noActua}</div>`);
  // oculto al empezar su activación: avisar que se elige la orden antes de actuar (una vez por agente)
  if (RULES.orders && state.sel.order === "conceal" && state.sel.ready && puedeCambiarOrden(state.sel).ok
      && mayControl(state.sel) && !noActua) {
    if (avisadoOrden !== state.sel.id) { avisadoOrden = state.sel.id; hint(T.orden.eligeAntes(state.sel.name)); }
  } else if (avisadoOrden === state.sel.id && !puedeCambiarOrden(state.sel).ok) avisadoOrden = null;
  // sin PA: sugerir "Terminar activación" (una vez por agente)
  if (state.sel.ready && state.sel.ap <= 0 && mayControl(state.sel)) {
    if (avisadoSinPA !== state.sel.id) { avisadoSinPA = state.sel.id; hint(T.turno.sinPA(state.sel.name)); }
  } else if (avisadoSinPA === state.sel.id) avisadoSinPA = null;
  c.querySelector("#fightbtn").onclick = () => {
    if (!state.target || opGap(state.sel, state.target) > CTRL) {
      state.target = meleeFoes[0]; refreshSight();
    }
    doFight();
  };
  // lo que las reglas no permiten ahora (src/game/acciones.js): atenuado y con el motivo
  const legal = Object.fromEntries(accionesLegales(state.sel, OPS).map(a => [a.accion, a]));
  for (const [id, a] of [["mv-reposition", "reposition"], ["mv-dash", "dash"], ["mv-charge", "charge"], ["mv-fallBack", "fallBack"], ["shootbtn", "shoot"], ["fightbtn", "fight"]]) {
    const b = c.querySelector("#" + id), r = legal[a];
    if (!b || !r || r.ok || r.motivo === "yaHecha") continue;   // lo ya hecho lleva su ✓
    b.classList.add("restricted");
    b.title = T.reglas.noPuede(T.reglas.accion[a], T.reglas.motivo[r.motivo] || r.motivo);
  }
  renderAcciones();               // la barra de acciones refleja estos botones
}
let toqueMov = { t: null, en: 0 };
function deshacerMovimiento(t) {
  const label = T.mover.nombre[t];
  if (ultimoMov && state.sel && ultimoMov.id === state.sel.id && ultimoMov.tipos.includes(t) && ultimoMov.guardado === guardados) {
    doUndo();
    hint(T.mover.deshecho(label));
  } else hint(T.mover.noDeshacer(label));
}
export function renderVerdict() {
  const v = document.getElementById("verdict");
  if (!state.sel || !state.target || !state.lastShot || !state.target.alive) {
    v.innerHTML = `<span class="hint">${T.veredicto.ayuda}</span>`; return;
  }
  const shot = state.lastShot, s = shot.sight, c = s.coverBy, o = s.obscBy;
  let big, cls, why = [];
  const V = T.veredicto;
  big = V.grande[shot.kind];
  if (shot.kind === "engaged") { cls = "v-novis";
    why.push(V.aliadoCerca(shot.engagedBy.name, CTRL)); }
  else if (shot.kind === "hidden") { cls = "v-novis"; why.push(V.sinLinea); }
  else {
    if (shot.kind === "obscured") { cls = "v-obsc";
      why.push(V.ofuscado(o.id, RULES.obscure.fromShooter, RULES.obscure.fromTarget));
      if (c) why.push(V.tambienCubierto(c.id, shot.vantage)); }
    else if (shot.kind === "concealed") { cls = "v-novis";
      why.push(V.oculto(c.id, s.hardCover)); }
    else if (shot.kind === "cover") { cls = "v-cover";
      why.push(shot.vantage ? V.cubiertoAventajado(c.id) : V.cubierto(c.id, RULES.cover.range)); }
    else { cls = "v-valid"; why.push(V.limpio); }
    if (shot.accurate) why.push(V.certera(shot.accurate));
    // un blanco con orden de ocultarse sin cobertura sigue siendo válido (Reglas breves): se dice
    if (RULES.orders && state.target.order === "conceal" && !c && (shot.kind === "clear" || shot.kind === "obscured")) why.push(V.ocultoSinCobertura);
    if (RULES.cover.voidWithin > 0 && s.gap <= RULES.cover.voidWithin) why.push(V.muyCerca(RULES.cover.voidWithin));
  }
  why.push(V.distancia(s.gap));
  // reglas del arma elegida: Buscadora (vale contra un oculto a cubierto) y Alcance
  const wsel = WPN[state.sel.weapon];
  if (wsel && wsel.type === "R") {
    if (buscadoraAplica(wsel, shot)) why.push(V.buscadora(wsel.name));
    if (s.gap > alcanceArma(wsel) + 1e-9) why.push(V.fueraAlcance(wsel.name, alcanceArma(wsel)));
  }
  const no = cannotShoot(selEye());
  const head = no ? `<div class="why">${V.noPuede(state.sel.name, noShootWhy(no))}</div>` : "";
  v.innerHTML = `${head}<div class="big ${cls}">${big}</div><div class="why">${state.sel.name} → ${state.target.name} · ${why.join(" · ")}</div>`;
}
// the selected operative as a shooter, where it stands
const selEye = () => ({x: state.sel.x, y: state.sel.y, team: state.sel.team, op: state.sel});
// why an operative can't take a Shoot action at all
const noShootWhy = n => n.why === "conceal" ? T.disparo.noPuede.conceal : T.disparo.noPuede.engaged(n.by.name);
// one short reason per judgement, for the valid-shots list and the log
function shotWhy(s) {
  const c = s.sight.coverBy, o = s.sight.obscBy, P = T.disparo.porque;
  if (s.kind === "clear") return P.clear;
  if (s.kind === "cover") return s.vantage ? P.coverVantage(c.id) : P.cover(c.id, RULES.cover.range, s.accurate);
  if (s.kind === "obscured") return P.obscured(o.id, c && c.id);
  if (s.kind === "concealed") return P.concealed(c.id);
  if (s.kind === "engaged") return P.engaged(s.engagedBy.name);
  return P.hidden;
}

// The valid-shots summary: every enemy from the selected operative (or its landing spot
// while dragging), valid targets first. Rewritten only when the text changes.
const SHOT_ORDER = ["clear", "cover", "obscured", "engaged", "concealed", "hidden"];
export function renderShots(eye) {
  const box = document.getElementById("shots");
  if (!box) return;
  let html;
  if (!eye) html = state.drag && state.drag.active
    ? `<span class="hint">${T.blancos.sinLlegada}</span>`
    : `<span class="hint">${T.blancos.ayuda}</span>`;
  else {
    const list = [...shotsFrom(eye)].sort((p, q) => SHOT_ORDER.indexOf(p.kind) - SHOT_ORDER.indexOf(q.kind) || p.range - q.range);
    const valid = list.filter(s => SHOT_KINDS[s.kind].valid).length, no = cannotShoot(eye);
    html = `<div class="shothead">${T.blancos.cabecera(eye.op.name, eye.landing, valid, list.length)}` +
      `${no ? T.blancos.noPuede(noShootWhy(no)) : ""}</div><ul class="shotlist">` +
      list.map(s => `<li data-shot="${s.kind}" data-oid="${s.target.id}"><i style="background:${SHOT_COL[s.kind]}"></i>` +
        `<b>${s.target.id} ${s.target.name}</b> <span class="k-${s.kind}">${T.disparo.tipo[s.kind]}</span>` +
        `${s.kind === "hidden" ? "" : ` · ${pulg(s.range)}`}<span class="why"> — ${shotWhy(s)}</span></li>`).join("") + "</ul>";
  }
  if (box._html !== html) { box.innerHTML = html; box._html = html; }
}

/* ---------- interaction ---------- */
export function allowance() {
  if (!state.sel) return 0;
  const spec = moveSpec(state.moveType) || RULES.moves.primary;
  return spec.allow(state.sel);
}
// el bando que activó por última vez en este punto de inflexión (para saber a quién le toca)
export let ultimoBando = null;
export const reiniciarActivaciones = () => { ultimoBando = null; };
// Pasar (ventana de reacción): cuenta como si ese bando hubiera activado, le toca al rival
export const pasarTurno = team => { ultimoBando = team; };
conectarTurno({ tray, ultimo: () => ultimoBando });   // turno.js consulta el marcador sin importar este módulo
// Mark an operative expended: its activation is over for this turning point.
let cerrando = false;
// Terminar la activación. Fuera de línea, antes puede salir la ventana de los ardides "al terminar la
// activación" (Plan caprichoso): si dan una acción libre de Correr, la activación sigue abierta.
export function endActivation(op) {
  if (!op || !op.alive || !op.ready || !mayControl(op) || !puedeActuar(op)) return;
  if (!online() && !cerrando && !esDeLaIA(op.team) && candidatos(tray, 'finActivacion', { op }).length) {
    cerrando = true;
    (async () => {
      const ctx = { op, seguir: false };
      try { await ventanaArdides('finActivacion', ctx); } finally { cerrando = false; }
      if (ctx.seguir) { renderAll(); return; }
      terminarActivacion(op);
    })();
    return;
  }
  terminarActivacion(op);
}
// Al empezar su activación (primera vez que se toca a un agente al que le toca), salen los ardides
// "al empezar la activación" (Cábala psíquica, Rebaño mutante); una sola vez por activación.
let preguntandoInicio = false;
function comprobarInicio() {
  const op = state.sel;
  if (preguntandoInicio || online() || !op || !op.alive || !op.ready || op.reaccion || op.inicioTP === tray.tp
    || esDeLaIA(op.team) || !mayControl(op) || !puedeActuar(op) || (op.used && op.used.length) || op.ap < op.apl) return;
  if (!candidatos(tray, 'inicioActivacion', { op }).length) return;
  op.inicioTP = tray.tp; preguntandoInicio = true;
  setTimeout(async () => {
    try { await ventanaArdides('inicioActivacion', { op }); } finally { preguntandoInicio = false; }
    renderAll();
  }, 0);
}
function terminarActivacion(op) {
  if (!op || !op.alive || !op.ready) return;
  ultimoBando = op.team;
  quitarPrestadas(op); delete op.grupo; delete op.gratisCorrer;
  snapshot();
  // Aturdidora: termina su siguiente activación (una reacción no cuenta como activación)
  if (!op.reaccion && quitarAturdido(op)) logLine(T.disparo.recuperaLPA(op.name));
  if (!op.reaccion && quitarQuemarMente(op)) logLine(T.disparo.sinQuemarMente(op.name));
  op.ready = false; op.ap = op.apl; op.used = []; op.reaccion = false; op.disparadas = []; op.ecosActivo = false;
  if (state.sel === op) state.moveType = "reposition";
  logLine(T.activacion.termina(op.name)); cancelMode(); renderAll();
  const p = pistaDeTurno();          // activaciones alternas: a quién le toca ahora
  if (p) hint(p);
  control.alTerminarActivacion();    // contra la computadora: ¿le toca a la IA? (ia.js)
  // ya activaron todos los agentes de ambos bandos: directo al siguiente punto de inflexión
  if (alternasObligatorias() && todosUsados())
    setTimeout(() => { if (todosUsados()) document.getElementById("endtp")?.click(); }, 500);
}
// Something to undo: the operative has acted, or is expended.
export const canUndoActivation = op => !!op && op.alive && (!untouched(op) || orderChanged(op));
// Put an operative back as it was when its activation began: where it stood, its order,
// ready with full AP. Wounds stay as they are (they may come from the other side).
export function undoActivation(op) {
  if (!canUndoActivation(op) || !mayControl(op)) return;
  const st = actStart.get(op.id), here = st && st.tp === tray.tp;
  snapshot();
  if (here) { op.x = st.x; op.y = st.y; op.z = st.z; if (RULES.orders) op.order = st.order; }
  op.ready = true; op.ap = op.apl; op.used = []; op.disparadas = [];
  if (state.sel === op) state.moveType = "reposition";
  logLine(T.activacion.deshecha(op.name, here));
  cancelMode(); refreshSight(); renderAll();
}
// Take an operative off the table as incapacitated (down = true), or put it back (with at
// least 1 wound) if that was a mistake: where it was, or the nearest spot within 3" where its
// base fits (someone may have moved in meanwhile); if there's none it stays down.
export function setIncapacitated(op, down) {
  if (!op || op.alive !== down || !mayControl(op)) return;
  let spot = null;
  if (!down) {
    useBase(opR(op));
    spot = nearestFree(op.x, op.y, op.id, opLayer(op), 3);
    if (!spot) { logLine(T.activacion.sinEspacio(op.name)); return; }
  }
  snapshot();
  op.alive = !down;
  if (down) {
    if (state.sel === op) state.sel = null;
    if (state.target === op) state.target = null;
    logLine(T.activacion.fuera(op.name), true);
  } else {
    const moved = Math.hypot(spot[0] - op.x, spot[1] - op.y) > 1e-6;
    op.x = spot[0]; op.y = spot[1];
    op.wounds = Math.max(1, op.wounds);
    logLine(T.activacion.vuelve(op.name, op.wounds, moved));
  }
  cancelMode(); refreshSight(); renderAll();
}
export function cancelMode() { state.mode = null; state.drag = null; state.rulerPts = []; hint(HINT0); }
// Judge the shot at the chosen target from where the selected operative stands.
export function refreshSight() {
  state.lastShot = state.sel && state.target && state.target.alive
    ? judgeShot(selEye(), state.target) : null;
}
export function toggleOrder(oid) {
  const o = OPS.find(z => z.id === oid);
  if (!o || !o.alive || !mayControl(o)) return;
  const noActua = porQueNoActua(o);
  if (noActua) { hint(noActua); return; }
  if (!puedeCambiarOrden(o).ok) { hint(T.orden.fijada); return; }   // solo al empezar la activación
  snapshot();
  o.order = o.order === "conceal" ? "engage" : "conceal";
  refreshSight();
  logLine(T.orden.log(o.name, o.order));
  hint(T.orden.ayuda(o.name, o.order));
  renderAll();
}
