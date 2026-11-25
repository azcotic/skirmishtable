/**
 * Control de objetivos (sin DOM): quién controla cada marcador de objetivo de la mesa.
 * Regla (Reglas breves de Kill Team, en nuestras palabras): un agente disputa un marcador si está en su zona de
 * control (a 1″ del borde del marcador); lo controla el bando cuyos agentes sumen más LPA en esa zona. Con la
 * misma suma, nadie lo controla (queda disputado). Solo cuentan los agentes vivos y desplegados.
 *
 * `mover` (opcional) pone a un agente en otra posición, para que la IA compare jugadas sin tocar la mesa:
 * { id, x, y } y, si hace falta, { apl }.
 */
import { OBJECTIVES, OPS } from './world.js';
import { CTRL, OBJ_R } from '../config.js';
import { dist, opR } from './geometry.js';

// ¿Está `op` (en x, y; por defecto donde está) en la zona de control de `obj`?
export const enRangoDe = (op, obj, x = op.x, y = op.y) => dist(x, y, obj.x, obj.y) - opR(op) - OBJ_R <= CTRL + 1e-9;

// Para un objetivo: { apl: [LPA del bando 0, LPA del bando 1], controla: 0 | 1 | null }
export function controlDe(obj, ops = OPS, mover = null) {
  const apl = [0, 0];
  for (const o of ops) {
    if (!o.alive || o.deployed === false) continue;
    const m = mover && mover.id === o.id ? { ...o, ...mover } : o;
    if (enRangoDe(m, obj, m.x, m.y)) apl[o.team] += m.apl || 0;
  }
  return { apl, controla: apl[0] > apl[1] ? 0 : apl[1] > apl[0] ? 1 : null };
}
// Todos los objetivos de la mesa: [{ obj, apl, controla }]
export const controlDeTodos = (ops = OPS, objetivos = OBJECTIVES, mover = null) =>
  objetivos.map(obj => ({ obj, ...controlDe(obj, ops, mover) }));
// Cuántos objetivos controla el bando `team`
export const objetivosControlados = (team, ops = OPS, objetivos = OBJECTIVES, mover = null) =>
  controlDeTodos(ops, objetivos, mover).filter(c => c.controla === team).length;
// El objetivo que `op` está disputando (en su posición) y controla su bando, o null
export const objetivoControladoPor = (op, ops = OPS, objetivos = OBJECTIVES) =>
  objetivos.find(o => enRangoDe(op, o) && controlDe(o, ops).controla === op.team) || null;
// ¿Está `op` en la zona de control de algún objetivo?
export const enObjetivo = (op, objetivos = OBJECTIVES) => objetivos.find(o => enRangoDe(op, o)) || null;
