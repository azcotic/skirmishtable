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
import { regla } from './dice.js';

const ojoDe = b => ({ x: b.x, y: b.y, z: b.z || 0, team: b.team, op: b });

// Los agentes que reciben el daño de Devastadora con distancia (ya aplicado); r: resolverDisparo
export function danoDevastadoraArea(ops, b, r) {
  if (!r || !r.devArea) return [];
  const out = [];
  for (const o of ops) {
    if (o.id === b.id || !o.alive || o.deployed === false) continue;
    if (opGap(o, b) > r.devArea.dist + 1e-9) continue;
    if (!sightAnalysis(ojoDe(b), o).visible) continue;
    o.wounds = Math.max(0, o.wounds - r.devArea.dmg);
    if (o.wounds === 0) o.alive = false;
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
// Aturdidora: true si el agente quedó aturdido ahora (una vez a la vez: no se acumula)
export function aturdir(op, rules, criticos) {
  if (!regla(rules, "Stun") || !(criticos > 0) || !op.alive || op.aturdido) return false;
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
