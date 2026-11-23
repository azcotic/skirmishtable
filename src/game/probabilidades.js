/**
 * Motor de partida (sin DOM): probabilidades de un ataque, exactas (se recorren todas las
 * combinaciones de dados: son pocos). Es lo que la IA compara para elegir a quién atacar.
 *
 * Disparo (Reglas breves, con nuestras palabras): el atacante tira tantos D6 como Ataques; cada
 * resultado ≥ Impactar es un éxito, el 6 siempre es crítico y el 1 siempre falla. El defensor
 * tira 3 dados de defensa contra su Salvación; a cubierto guarda un éxito normal sin tirarlo
 * (y tira uno menos). Bloquea: normal con normal, crítico con normal o crítico, y dos normales
 * bloquean un crítico. Lo que no se bloquea hace Daño normal / crítico.
 *
 * Reglas de arma que se tienen en cuenta: Letal x+, Penetración x, Críticos de penetración x,
 * Desgarradora, Castigadora, Severa, Devastadora x, Saturación, Certera x (y la del terreno
 * aventajado), Equilibrada, Implacable e Incesante (aproximada). Ofuscado: los críticos cuentan
 * como normales y se descarta un éxito.
 */

// la misma lectura de reglas que el motor de dados ("Piercing" no confunde "Piercing Crits 1")
import { regla } from '../engine/dice.js';

// probabilidad de [fallo, normal, crítico] de un dado
function dado(exito, critDesde = 6) {
  const pc = (7 - critDesde) / 6;
  let pn = 0;
  for (let v = 2; v < critDesde; v++) if (v >= exito) pn += 1 / 6;
  return [1 - pn - pc, pn, pc];
}
// repetir: todos los fallos (Implacable) o un resultado concreto, el 1 (Incesante, aproximado)
function repetido([f, n, c], modo) {
  if (modo === "todos") return [f * f, n + f * n, c + f * c];
  if (modo === "unos") { const p1 = 1 / 6; return [f - p1 + p1 * f, n + p1 * n, c + p1 * c]; }
  return [f, n, c];
}
const fact = k => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
// distribución de (normales, críticos) con n dados
function multinomial(n, [f, pn, pc]) {
  const out = [];
  for (let c = 0; c <= n; c++) for (let k = 0; k <= n - c; k++) {
    const p = fact(n) / (fact(k) * fact(c) * fact(n - k - c)) * pn ** k * pc ** c * f ** (n - k - c);
    if (p > 0) out.push({ n: k, c, f: n - k - c, p });
  }
  return out;
}
const sumar = (m, k, p) => m.set(k, (m.get(k) || 0) + p);

// Los dados de ataque que quedan tras las reglas: lista de {n, c, p}
function ataque(arma, { certera = 0, ofuscado = false, lesionado = false } = {}) {
  const R = arma.rules || [];
  const hit = Math.min(6, arma.hit + (lesionado ? 1 : 0));
  const letal = regla(R, "Lethal");
  const acc = Math.min(arma.atk, (regla(R, "Accurate") || 0) + certera);
  let dist = dado(hit, typeof letal === "number" ? letal : 6);
  dist = repetido(dist, regla(R, "Relentless") ? "todos" : regla(R, "Ceaseless") ? "unos" : null);
  const res = new Map();
  for (const o of multinomial(arma.atk - acc, dist)) {
    let variantes = [{ n: o.n + acc, c: o.c, f: o.f, p: o.p }];
    // Equilibrada: repite un dado fallado
    if (regla(R, "Balanced") && !regla(R, "Relentless")) variantes = variantes.flatMap(v => v.f > 0
      ? [{ ...v, p: v.p * dist[0] }, { n: v.n + 1, c: v.c, f: v.f - 1, p: v.p * dist[1] }, { n: v.n, c: v.c + 1, f: v.f - 1, p: v.p * dist[2] }]
      : [v]);
    for (let { n, c, f, p } of variantes) {
      if (regla(R, "Rending") && c > 0 && n > 0) { n--; c++; }          // Desgarradora
      if (regla(R, "Punishing") && c > 0 && f > 0) { n++; }             // Castigadora
      if (regla(R, "Severe") && c === 0 && n > 0) { n--; c++; }          // Severa
      if (ofuscado) { n += c; c = 0; if (n > 0) n--; }                  // ofuscado
      sumar(res, n + "," + c, p);
    }
  }
  return [...res].map(([k, p]) => { const [n, c] = k.split(",").map(Number); return { n, c, p }; });
}

// Los dados de defensa: lista de {n, c, p}
function defensa(salvacion, { cubierto = false, dados = 3 } = {}) {
  const auto = cubierto ? 1 : 0;
  return multinomial(Math.max(0, dados - auto), dado(salvacion)).map(o => ({ n: o.n + auto, c: o.c, p: o.p }));
}

// El menor daño posible si el defensor reparte bien sus bloqueos.
export function danoTrasBloqueos(aN, aC, dN, dC, dmgN, dmgC) {
  let mejor = Infinity;
  for (let x = 0; x <= Math.min(dC, aC); x++) {             // críticos que bloquean críticos
    const restoDC = dC - x, critsVivos = aC - x;
    for (let y = 0; y <= Math.min(critsVivos, Math.floor(dN / 2)); y++) {   // pares de normales sobre críticos
      const c = critsVivos - y, normalesDef = dN - 2 * y;
      const n = Math.max(0, aN - normalesDef - restoDC);   // el resto bloquea normales
      mejor = Math.min(mejor, n * dmgN + c * dmgC);
    }
  }
  return mejor;
}

// Disparo: distribución del daño, daño esperado y probabilidad de incapacitar.
// arma: {atk, hit, dmgN, dmgC, rules}; blanco: {save, heridas}; opciones: cubierto, ofuscado,
// certera (dados de terreno aventajado), lesionado (el atacante, peor Impactar).
export function disparo(arma, blanco, opciones = {}) {
  const R = arma.rules || [];
  const cubierto = !!opciones.cubierto && !regla(R, "Saturate");
  const pen = regla(R, "Piercing") || 0, penCrit = regla(R, "Piercing Crits") || 0;
  const devastadora = typeof regla(R, "Devastating") === "number" ? regla(R, "Devastating") : 0;
  const danos = new Map();
  for (const a of ataque(arma, opciones)) {
    const dados = 3 - pen - (a.c > 0 ? penCrit : 0);
    for (const d of defensa(blanco.save, { cubierto, dados })) {
      const dano = devastadora * a.c + danoTrasBloqueos(a.n, a.c, d.n, d.c, arma.dmgN, arma.dmgC);
      sumar(danos, dano, a.p * d.p);
    }
  }
  return resumen(danos, blanco.heridas);
}

// Combate, aproximado: los dos golpean con todos sus éxitos (sin bloquear), lo que suele pasar
// cuando un golpe puede incapacitar. Devuelve lo que recibe el blanco y lo que recibe el atacante.
export function combate(armaA, armaB, atacante, blanco, opciones = {}) {
  const golpes = (arma, lesionado) => {
    const m = new Map();
    for (const a of ataque(arma, { lesionado })) sumar(m, a.n * arma.dmgN + a.c * arma.dmgC, a.p);
    return m;
  };
  return {
    alBlanco: resumen(golpes(armaA, opciones.atacanteLesionado), blanco.heridas),
    alAtacante: armaB ? resumen(golpes(armaB, opciones.blancoLesionado), atacante.heridas) : resumen(new Map([[0, 1]]), atacante.heridas),
  };
}

function resumen(danos, heridas) {
  let esperado = 0, incapacitar = 0;
  for (const [d, p] of danos) { esperado += d * p; if (heridas !== undefined && d >= heridas) incapacitar += p; }
  return { esperado, incapacitar, distribucion: danos };
}
