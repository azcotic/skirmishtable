/**
 * Efectos de un disparo o combate sobre otros agentes, fuera de la tirada misma. Lo usan la
 * interfaz (panels.js) y el otro navegador de una partida en línea (net/fairdice.js), sobre su
 * propia lista de agentes, para llegar al mismo resultado.
 *
 * - Devastadora con distancia ('2" Devastating 2'): el daño de los críticos llega también a cada
 *   agente (de cualquier bando) a esa distancia o menos del blanco y visible para él.
 * - Aturdidora (Stun): si el atacante guarda algún crítico, el blanco pierde 1 de LPA hasta el
 *   final de su siguiente activación (op.aturdido).
 */
import { sightAnalysis } from './sight.js';
import { opGap } from './geometry.js';
import { puedeRenacer, regla, renaceCon } from './dice.js';

// Quita heridas a un agente fuera de una tirada propia (Devastadora de área, veneno): si iba a quedar incapacitado y
// puede renacer (Semilla de renacimiento), tira 1D6 con `die` (sin dado, no hay segunda oportunidad). Devuelve { dado, ok } o null.
export function danarAgente(op, dmg, die = null) {
  op.wounds = Math.max(0, op.wounds - dmg);
  if (op.wounds > 0) return null;
  op.alive = false;
  if (!die || !puedeRenacer(op)) return null;
  const dado = die(), ok = renaceCon(dado);
  op.semillaUsada = true;
  if (ok) { op.wounds = 1; op.alive = true; }
  return { dado, ok };
}

const ojoDe = b => ({ x: b.x, y: b.y, z: b.z || 0, team: b.team, op: b });

// Los agentes que reciben el daño de Devastadora con distancia (ya aplicado); r: resolverDisparo
export function danoDevastadoraArea(ops, b, r, die = null) {
  if (!r || !r.devArea) return [];
  const out = [];
  for (const o of ops) {
    if (o.id === b.id || !o.alive || o.deployed === false) continue;
    if (opGap(o, b) > r.devArea.dist + 1e-9) continue;
    if (!sightAnalysis(ojoDe(b), o).visible) continue;
    const semilla = danarAgente(o, r.devArea.dmg, die);
    if (semilla) (r.devSemillas = r.devSemillas || []).push({ id: o.id, ...semilla });
    out.push(o);
  }
  return out;
}

// Quemar mente (Mindburn*): al usar el arma, se retiran las fichas que ya había puesto ese bando;
// si algún crítico hace daño, el blanco recibe una (si no tiene) hasta el final de su siguiente
// activación o hasta que caiga. Con ella, Impactar 1 peor (effHit). true si la recibe ahora.
export function quemarMente(ops, a, b, rules, r) {
  if (!regla(rules, "Mindburn*")) return false;
  for (const o of ops) if (o.quemarMente && o.quemarDe === a.team) { o.quemarMente = false; delete o.quemarDe; }
  if (!r || !r.critDano || !b.alive || b.quemarMente) return false;
  b.quemarMente = true; b.quemarDe = a.team;
  return true;
}
export function quitarQuemarMente(op) {
  if (!op.quemarMente) return false;
  op.quemarMente = false; delete op.quemarDe;
  return true;
}
// Terrotoxinas (Terrorchem*): si algún crítico hace daño (también el de Devastadora), el blanco
// gana una ficha de Terrotoxinas (si no tiene). Veneno: cada vez que se activa, recibe 1D3 de
// daño (la interfaz lo tira al empezar su activación). true si la recibe ahora.
export function terrotoxinas(a, b, rules, critDano) {
  if (!regla(rules, "Terrorchem*") || !critDano || !b.alive || b.terrotoxinas) return false;
  b.terrotoxinas = true; b.terroDe = a.team;
  return true;
}
// En un combate: ¿algún golpe crítico de ese bando (0 atacante, 1 defensor) hizo daño?
export const critDanoCombate = (pasos, quien) => (pasos || []).some(p => p.quien === quien && p.tipo === "golpe" && p.con === "crit" && p.dmg > 0);
// Veneno de terrotoxinas: 1D3 (con un D6: 1-2 → 1, 3-4 → 2, 5-6 → 3)
export function veneno(op, d6, die = null) {
  const d = Math.ceil(d6 / 2);
  danarAgente(op, d, die);
  return d;
}
// Aturdidora: true si el agente quedó aturdido ahora (una vez a la vez: no se acumula)
// Reglas que hacen ignorar los cambios de LPA (p. ej. la táctica Resueltos): (op) => true
export const ignoraAturdir = [];
export function aturdir(op, rules, criticos) {
  if (!regla(rules, "Stun") || !(criticos > 0) || !op.alive || op.aturdido || ignoraAturdir.some(f => f(op))) return false;
  op.aturdido = true;
  op.apl = Math.max(1, op.apl - 1);
  if (op.ready && !(op.used || []).length && op.ap > op.apl) op.ap = op.apl;   // aún no activó
  return true;
}
// Al terminar su siguiente activación, recupera su LPA
export function quitarAturdido(op) {
  if (!op.aturdido) return false;
  op.aturdido = false;
  op.apl += 1;
  return true;
}
