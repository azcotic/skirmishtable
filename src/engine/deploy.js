/**
 * Despliegue por turnos, antes del primer punto de inflexión (sin DOM).
 *
 * Reglas (Reglas breves de Kill Team): los jugadores se alternan para desplegar, empezando
 * por el que tiene la iniciativa; cada agente se despliega completamente dentro de su zona
 * de descenso y con orden de ocultarse. Aquí se alterna de uno en uno (las reglas lo hacen
 * por tercios del comando: queda para el motor de partida).
 *
 * Un agente por desplegar tiene `deployed: false` y `alive: false`: está fuera de la mesa, así
 * que el motor (visión, amenazas, combate) lo ignora. El turno se deduce de los agentes, sin
 * estado aparte, para que los dos navegadores de una partida en línea siempre coincidan.
 */
import { dist, opR } from './geometry.js';

export const porDesplegar = (ops, team = null) =>
  ops.filter(o => o.deployed === false && (team === null || o.team === team));

export const enDespliegue = ops => ops.some(o => o.deployed === false);

// De quién es el turno de desplegar (0 o 1), o null si ya no queda nadie por desplegar.
// Se alterna: le toca a quien lleva menos agentes desplegados; si empatan, a `inicia` (el
// jugador con la iniciativa). Si un bando ya terminó, el otro despliega lo que le quede.
export function turnoDespliegue(ops, inicia = 0) {
  const falta = s => ops.some(o => o.team === s && o.deployed === false);
  if (!falta(0) && !falta(1)) return null;
  if (!falta(0)) return 1;
  if (!falta(1)) return 0;
  const hechos = s => ops.filter(o => o.team === s && o.deployed !== false).length;
  const otro = 1 - inicia;
  return hechos(inicia) <= hechos(otro) ? inicia : otro;
}

// La peana completa dentro de la zona de descenso.
export function dentroDeZona(op, x, y, dz) {
  const R = opR(op);
  return !!dz && x - R >= dz.x - 1e-9 && x + R <= dz.x + dz.w + 1e-9 && y - R >= dz.y - 1e-9 && y + R <= dz.y + dz.h + 1e-9;
}

// Sin pisar a otro agente que ya esté en la mesa.
export function chocaConAgente(op, x, y, ops) {
  return ops.some(o => o !== op && o.alive && dist(o.x, o.y, x, y) < opR(o) + opR(op) - 1e-6);
}

// Saca de la mesa a todos los agentes: empieza el despliegue.
export function retirarParaDesplegar(ops) {
  for (const o of ops) { o.alive = false; o.deployed = false; }
}

// Pone un agente en la mesa en (x, y), listo para el primer punto de inflexión.
export function desplegar(op, x, y) {
  Object.assign(op, { x: +x.toFixed(2), y: +y.toFixed(2), z: 0, alive: true, deployed: true,
    order: "conceal", ready: true, ap: op.apl, used: [] });
  delete op.deployed;   // desplegado = sin la marca, como cualquier agente en la mesa
  return op;
}
