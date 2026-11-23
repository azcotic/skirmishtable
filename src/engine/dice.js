/**
 * Dice and injury helpers, and the dice part of Shoot and Fight. `die` gives the next D6:
 * Math.random offline, the shared roll online (src/net/fairdice.js), so both players'
 * browsers can work out the same result from the same dice.
 *
 * Reglas de arma aplicadas en las tiradas (Reglas breves de Kill Team 2024, con nuestras
 * palabras): Letal x+, Implacable, Incesante, Equilibrada (repeticiones automáticas: siempre
 * convienen), Severa, Castigadora, Desgarradora, Certera x, Devastadora x, Penetración x,
 * Críticos de penetración x, Saturación y Sobrecalentamiento al disparar; Brutal y Choque al
 * combatir. El defensor bloquea de la forma que menos daño recibe.
 *
 * Las piezas (rollAttack, clasificarAtaque, rollDefence, bloquear, y el combate paso a paso:
 * iniciarCombate / opcionesCombate / aplicarCombate / decisionCombate) se exportan para que la
 * interfaz pueda resolver tiradas con decisiones del jugador (Repetición de mando, golpear o
 * bloquear). shootRoll y fightRoll las componen sin decisiones (IA, partidas en línea).
 *
 * Las notas (r.notes) son códigos que traduce la interfaz (src/i18n/es.js, T.disparo.nota).
 */
import { WPN } from '../config.js';

/* ---------- dice ---------- */
export const d6 = () => 1 + Math.floor(Math.random()*6);

// Cambios al arma con que se tira según el momento de la partida (p. ej. los ardides:
// src/ui/ardides.js): f(arma, atacante, rival, "disparo" | "combate") -> arma (una copia si cambia)
export const ajustesArma = [];
export const armaPara = (w, a, b, modo) => ajustesArma.reduce((x, f) => f(x, a, b, modo) || x, w);

// Una regla de arma de la lista: true si está sin número, su número si lo tiene, o null.
// "Piercing" no coincide con "Piercing Crits 1" ni "Seek" con "Seek Light".
export function regla(rules, nombre) {
  const r = (rules || []).find(x => x === nombre || (x.startsWith(nombre + " ") && !/^[A-Za-z]/.test(x.slice(nombre.length + 1))));
  if (!r) return null;
  const v = parseInt(r.slice(nombre.length), 10);
  return Number.isFinite(v) ? v : true;
}
const numero = (rules, nombre) => { const v = regla(rules, nombre); return typeof v === "number" ? v : 0; };
export const critDesde = rules => { const l = regla(rules, "Lethal"); return typeof l === "number" ? l : 6; };

// Éxitos de unos dados de ataque ya tirados: críticos (≥ Letal o 6) y normales (≥ Impactar);
// el 1 siempre falla. Después, las reglas que cambian resultados (siempre convienen):
// Castigadora (con algún crítico, un fallo pasa a normal), Desgarradora (con algún crítico, un
// normal pasa a crítico) y Severa (sin críticos, un normal pasa a crítico).
export function clasificarAtaque(dice, hit, rules) {
  const cd = critDesde(rules);
  let crit = dice.filter(v => v !== 1 && v >= cd).length;
  let norm = dice.filter(v => v !== 1 && v < cd && v >= hit).length;
  let fail = dice.length - crit - norm;
  const notes = [];
  // Castigadora y Desgarradora piden haber guardado un crítico de la tirada; Severa, ninguno (y el
  // crítico que crea Severa no activa las otras dos)
  if (regla(rules, "Punishing") && crit > 0 && fail > 0) { fail--; norm++; notes.push("punishing"); }
  if (regla(rules, "Rending") && crit > 0 && norm > 0) { norm--; crit++; notes.push("rending"); }
  if (regla(rules, "Severe") && crit === 0 && norm > 0) { norm--; crit++; notes.push("severe"); }
  return { crit, norm, notes };
}

// n dados de ataque, con las repeticiones del arma (Implacable: todos los fallos; Incesante:
// todos los de un mismo resultado fallado, el más repetido; Equilibrada: un fallo).
export function rollAttack(n, hit, rules, die = d6) {
  const cd = critDesde(rules);
  const exito = v => v !== 1 && (v >= cd || v >= hit);
  let dice = Array.from({length: n}, () => die());
  const rerolled = [], notes = [];
  if (regla(rules, "Relentless")) {
    dice = dice.map((v, i) => { if (exito(v)) return v; rerolled.push(i); return die(); });
    if (rerolled.length) notes.push("relentless");
  } else if (regla(rules, "Ceaseless")) {
    const fails = dice.filter(v => !exito(v));
    if (fails.length) {
      const counts = {}; fails.forEach(v => counts[v] = (counts[v] || 0) + 1);
      const pick = +Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
      dice = dice.map((v, i) => { if (v !== pick) return v; rerolled.push(i); return die(); });
      notes.push("ceaseless");
    }
  } else if (regla(rules, "Balanced")) {
    const i = dice.findIndex(v => !exito(v));
    if (i >= 0) { dice[i] = die(); rerolled.push(i); notes.push("balanced"); }
  }
  const c = clasificarAtaque(dice, hit, rules);
  return { dice, crit: c.crit, norm: c.norm, rerolled, notes: [...notes, ...c.notes] };
}

// Dados de defensa: 3 (menos los que quite Penetración); a cubierto, uno es un éxito normal
// guardado sin tirarlo.
export function rollDefence(save, cover, die = d6, dados = 3) {
  const rolled = Array.from({length: Math.max(0, dados - (cover ? 1 : 0))}, () => die());
  return { ...clasificarDefensa(rolled, save, cover), dice: rolled, cover };
}
export function clasificarDefensa(dice, save, cover) {
  const crit = dice.filter(v => v === 6).length;
  let norm = dice.filter(v => v !== 6 && v !== 1 && v >= save).length;
  if (cover) norm += 1;   // banked cover save
  return { crit, norm };
}

// Lo que queda sin bloquear si el defensor reparte sus éxitos para recibir el menor daño:
// normal bloquea normal; crítico bloquea normal o crítico; dos normales bloquean un crítico.
export function bloquear(aN, aC, dN, dC, dmgN, dmgC) {
  let mejor = { n: aN, c: aC, dmg: aN * dmgN + aC * dmgC };
  for (let x = 0; x <= Math.min(dC, aC); x++) {                 // críticos sobre críticos
    const restoDC = dC - x, critsVivos = aC - x;
    for (let y = 0; y <= Math.min(critsVivos, Math.floor(dN / 2)); y++) {   // pares de normales sobre críticos
      const c = critsVivos - y, n = Math.max(0, aN - (dN - 2 * y) - restoDC);
      const dmg = n * dmgN + c * dmgC;
      if (dmg < mejor.dmg) mejor = { n, c, dmg };
    }
  }
  return mejor;
}

// Impactar: 1 peor si está lesionado o tiene una ficha de Quemar mente (no se acumulan)
export function effHit(op, w) { return Math.min(6, w.hit + (isInjured(op) || op.quemarMente ? 1 : 0)); }
export function isInjured(op) { return op.wounds < op.maxW/2; }
export function effMove(op) { return isInjured(op) ? Math.max(4, op.move-2) : op.move; }

/* ---------- Shoot ---------- */
// One shot, `what` = {by, at, w: weapon key, acc: Accurate dice, obsc: obscured, cover}:
// the attack and defence dice and the damage. The shooter `a` and target `b` aren't changed.
// Null if the weapon isn't one of the shooter's ranged weapons.
// selfDmg: daño que se hace el tirador con un arma de Sobrecalentamiento.
export function shootRoll(what, a, b, die = d6) {
  const w = WPN[what.w] && armaPara(WPN[what.w], a, b, "disparo");
  if (!w || w.type !== "R" || !a.weapons.includes(what.w)) return null;
  const hit = effHit(a, w);
  const atk = rollAttack(Math.max(0, w.atk - certera(what, w)), hit, w.rules, die);
  // un blanco secundario (Área / Ráfaga: what.sec): Sobrecalentamiento ya se tiró en el principal
  return resolverDisparo(what, w, hit, atk, b, die, null, what.sec ? false : null);
}
// Dados de Certera: los del terreno aventajado y los de la regla del arma, guardados como
// éxitos normales sin tirarlos.
export const certera = (what, w) => Math.max(0, Math.min((what.acc | 0) + numero(w.rules, "Accurate"), w.atk));
// Devastadora x, o con distancia ('2" Devastating 2'): {x, dist} (dist: null si no tiene), o null
export function devastadora(rules) {
  for (const r of rules || []) {
    const m = /^(?:(\d+(?:\.\d+)?)" )?Devastating (\d+)$/.exec(r);
    if (m) return { x: +m[2], dist: m[1] ? +m[1] : null };
  }
  return null;
}
// Área x / Ráfaga x: la distancia en pulgadas ('Blast 2"' -> 2), o null
export const distanciaRegla = (rules, nombre) => {
  const r = (rules || []).find(x => x.startsWith(nombre + " "));
  const v = r && parseFloat(r.slice(nombre.length + 1));
  return Number.isFinite(v) ? v : null;
};

// Del ataque ya tirado (y quizá repetido con Repetición de mando) al daño: ofuscado,
// Devastadora, Penetración, Saturación, la defensa (tirada aquí con `die`, o `dfnDados` si ya
// se tiró), bloqueos y Sobrecalentamiento.
export function resolverDisparo(what, w, hit, atk, b, die = d6, dfnDados = null, hotDado = null) {
  const R = w.rules, notes = [...(atk.notes || [])];
  const acc = certera(what, w);
  let aCrit = atk.crit, aNorm = atk.norm + acc;
  if (acc) notes.push(`Accurate ${acc}`);
  if (what.obsc && !w.sinOfuscar) {   // crits become normal, then discard one success (Visión incorpórea: no)
    aNorm += aCrit; aCrit = 0;
    if (aNorm > 0) aNorm--;
    notes.push("obscured");
  }
  // cada crítico guardado: daño inmediato (no se descarta: luego aún se resuelve). Con distancia,
  // ese daño también lo reciben los agentes cercanos al blanco (devArea: la interfaz lo aplica)
  const dv = devastadora(R), dev = dv ? dv.x * aCrit : 0;
  const devArea = dv && dv.dist && dev ? { dist: dv.dist, dmg: dev } : null;
  if (dev) notes.push("devastating:" + dev);
  const saturacion = !!regla(R, "Saturate");
  const cover = !!what.cover && !saturacion;
  if (saturacion && what.cover) notes.push("saturate");
  const pen = numero(R, "Piercing") + (aCrit > 0 ? numero(R, "Piercing Crits") : 0);
  if (pen) notes.push("piercing:" + pen);
  const dfn = dfnDados
    ? { ...clasificarDefensa(dfnDados, b.save, cover), dice: dfnDados, cover }
    : rollDefence(b.save, cover, die, Math.max(0, 3 - pen));
  if (dfn.cover) notes.push("cover save banked");
  const rest = bloquear(aNorm, aCrit, dfn.norm, dfn.crit, w.dmgN, w.dmgC);
  let selfDmg = 0, hotV = null;
  if (regla(R, "Hot") && hotDado !== false) {   // tras disparar: 1D6; si sale menos que Impactar, el tirador recibe el doble
    hotV = hotDado ?? die();                    // (false: blanco secundario, ya se tiró en el principal)
    if (hotV < hit) { selfDmg = hotV * 2; notes.push("hot:" + selfDmg); }
  }
  // atkN/atkC: los éxitos del ataque que llegan a la defensa (para explicar decisiones)
  // critDano: algún crítico hizo daño (Devastadora o sin bloquear): Quemar mente
  return { w, hit, atk, dfn, dmg: dev + rest.dmg, notes, selfDmg, pen, cover, hotDado: hotV, atkN: aNorm, atkC: aCrit, dev, devArea,
    critDano: dev > 0 || rest.c > 0 };
}

/* ---------- Fight ---------- */
// The melee weapon an operative fights with: its chosen one if that is melee, else its
// first melee weapon, else a knife.
export const meleeKey = op => WPN[op.weapon] && WPN[op.weapon].type === "M" ? op.weapon
  : op.weapons.find(k => WPN[k] && WPN[k].type === "M") || "knife";

// El combate paso a paso. Los dos tiran; luego, empezando por el atacante, se turnan para
// resolver un dado: golpear (hace su daño) o bloquear un dado del rival (normal con normal,
// crítico con normal o crítico; contra un arma Brutal solo se bloquea con críticos). Choque: la
// primera vez que se golpea con un crítico, se descarta también un éxito del rival. Escudo: cada
// bloqueo anula dos éxitos sin resolver del rival (contra: una lista de dos).
export function iniciarCombate(what, a, b, die = d6) {
  const ok = (op, k) => WPN[k] && WPN[k].type === "M" && (k === "knife" || op.weapons.includes(k));
  if (!ok(a, what.wa) || !ok(b, what.wb)) return null;
  const wa = armaPara(WPN[what.wa], a, b, "combate"), wb = armaPara(WPN[what.wb], b, a, "combate");
  const hitA = effHit(a, wa), hitB = effHit(b, wb);
  // Certera x: x dados guardados como éxitos normales sin tirarlos (acc)
  const acc = [wa, wb].map(w => Math.min(numero(w.rules, "Accurate"), w.atk));
  const ra = rollAttack(wa.atk - acc[0], hitA, wa.rules, die), rb = rollAttack(wb.atk - acc[1], hitB, wb.rules, die);
  return { wa, wb, hitA, hitB, ra, rb, acc,
    vida: [{ wounds: a.wounds, alive: a.alive }, { wounds: b.wounds, alive: b.alive }],
    pools: [{ crit: ra.crit, norm: ra.norm + acc[0], w: wa, shock: false }, { crit: rb.crit, norm: rb.norm + acc[1], w: wb, shock: false }],
    turno: 0, pasos: [], fin: ra.crit + ra.norm + acc[0] + rb.crit + rb.norm + acc[1] === 0 };
}
// Lo que puede hacer el que tiene el turno: [{tipo: "golpe", con}, {tipo: "bloqueo", con, contra}]
export function opcionesCombate(est) {
  const p = est.pools[est.turno], q = est.pools[1 - est.turno], out = [];
  const soloCriticos = !!regla(q.w.rules, "Brutal");
  if (p.crit > 0) out.push({ tipo: "golpe", con: "crit" });
  if (p.norm > 0) out.push({ tipo: "golpe", con: "norm" });
  if (p.crit > 0 && q.crit > 0) out.push({ tipo: "bloqueo", con: "crit", contra: "crit" });
  if (p.crit > 0 && q.norm > 0) out.push({ tipo: "bloqueo", con: "crit", contra: "norm" });
  if (p.norm > 0 && q.norm > 0 && !soloCriticos) out.push({ tipo: "bloqueo", con: "norm", contra: "norm" });
  if (regla(p.w.rules, "Shield*")) {
    if (p.crit > 0 && q.crit >= 2) out.push({ tipo: "bloqueo", con: "crit", contra: ["crit", "crit"] });
    if (p.crit > 0 && q.crit >= 1 && q.norm >= 1) out.push({ tipo: "bloqueo", con: "crit", contra: ["crit", "norm"] });
    if (p.crit > 0 && q.norm >= 2) out.push({ tipo: "bloqueo", con: "crit", contra: ["norm", "norm"] });
    if (p.norm > 0 && q.norm >= 2 && !soloCriticos) out.push({ tipo: "bloqueo", con: "norm", contra: ["norm", "norm"] });
  }
  return out;
}
export function aplicarCombate(est, op) {
  const i = est.turno, p = est.pools[i], q = est.pools[1 - i], rival = est.vida[1 - i];
  p[op.con]--;
  if (op.tipo === "golpe") {
    const dmg = op.con === "crit" ? p.w.dmgC : p.w.dmgN;
    rival.wounds = Math.max(0, rival.wounds - dmg);
    if (rival.wounds === 0) rival.alive = false;
    let choque = false;
    if (op.con === "crit" && !p.shock && regla(p.w.rules, "Shock")) {
      p.shock = true; choque = true;
      if (q.norm > 0) q.norm--; else if (q.crit > 0) q.crit--;
    }
    est.pasos.push({ quien: i, ...op, dmg, choque });
  } else {
    for (const c of [].concat(op.contra)) q[c]--;
    est.pasos.push({ quien: i, ...op });
  }
  const quedan = k => est.pools[k].crit + est.pools[k].norm > 0;
  est.fin = !est.vida[0].alive || !est.vida[1].alive || (!quedan(0) && !quedan(1));
  if (!est.fin) est.turno = quedan(1 - i) ? 1 - i : i;   // se alternan; si el otro no tiene dados, sigue
}
// La decisión automática (IA, partidas en línea): rematar si puede; si el rival puede matarlo
// con lo que le queda, bloquear su dado más dañino; si no, golpear con el mejor dado.
export function decisionCombate(est) {
  const i = est.turno, p = est.pools[i], q = est.pools[1 - i], yo = est.vida[i], rival = est.vida[1 - i];
  const ops = opcionesCombate(est);
  const dano = (pool, con) => [].concat(con).reduce((s, c) => s + (c === "crit" ? pool.w.dmgC : pool.w.dmgN), 0);
  const mata = ops.filter(o => o.tipo === "golpe" && dano(p, o.con) >= rival.wounds);
  if (mata.length) return mata.find(o => o.con === "norm") || mata[0];
  const peligro = q.crit * q.w.dmgC + q.norm * q.w.dmgN >= yo.wounds;
  const bloqueos = ops.filter(o => o.tipo === "bloqueo");
  if (peligro && bloqueos.length) {
    // quitar el dado que más daño hace, gastando el dado propio más barato
    return bloqueos.sort((x, y) => dano(q, y.contra) - dano(q, x.contra) || (x.con === "norm" ? -1 : 1))[0];
  }
  return ops.find(o => o.tipo === "golpe" && o.con === "crit") || ops.find(o => o.tipo === "golpe") || ops[0];
}

// One fight, `what` = {by, at, wa, wb: the two melee weapon keys}, resuelto con decisiones
// automáticas. Returns the dice, the steps and both operatives' wounds and alive afterwards;
// `a` and `b` aren't changed. Null for a weapon that isn't the operative's (a knife always is).
export function fightRoll(what, a, b, die = d6) {
  const est = iniciarCombate(what, a, b, die);
  if (!est) return null;
  let guard = 0;
  while (!est.fin && guard++ < 60) {
    const ops = opcionesCombate(est);
    if (!ops.length) { est.turno = 1 - est.turno; if (!opcionesCombate(est).length) break; continue; }
    aplicarCombate(est, decisionCombate(est));
  }
  return { wa: est.wa, wb: est.wb, hitA: est.hitA, hitB: est.hitB, ra: est.ra, rb: est.rb,
           a: est.vida[0], b: est.vida[1], pasos: est.pasos };
}
