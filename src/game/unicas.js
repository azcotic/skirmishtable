/**
 * Acciones únicas psíquicas de los Hechiceros del Aquelarre Disforme (sin DOM).
 * Los textos están en src/i18n/es.js (T.unicas); aquí solo los números y las reglas de quién puede.
 *
 * - proteccionDestino: un agente amigo visible; mientras dure, quien le dispare repite sus dados de
 *   defensa fallados (src/engine/dice.js, repiteDefensa).
 * - saboteaDestino: un enemigo a 9″ o menos y visible; mientras dure, repite los 6 de sus dados de
 *   ataque al disparar, combatir o contraatacar (repiteSeises) y su LPA cuenta 1 menos para
 *   controlar un marcador (aún no hay marcadores).
 * - ritual: un agente amigo a 6″ o menos y visible recupera hasta 2D3 heridas; una vez por punto de
 *   inflexión para todo el bando.
 * - prender: un enemigo visible; mientras dure, las armas de los agentes del bando contra él tienen
 *   Incesante.
 * - flujoTemporal: pendiente (necesita marcadores en la mesa).
 *
 * Los efectos duran hasta que el agente que los puso empiece su siguiente activación, quede
 * incapacitado o un agente amigo repita la acción (lo que ocurra antes).
 */
import { opGap } from '../engine/geometry.js';
import { opcionesDe } from '../data/teams/index.js';
import { KINDS } from '../engine/world.js';
import { enZonaDeControl } from './acciones.js';

export const UNICAS = {
  proteccionDestino: { pa: 1, objetivo: 'amigo', alcance: null, duradera: true },
  saboteaDestino: { pa: 1, objetivo: 'enemigo', alcance: 9, duradera: true },
  ritual: { pa: 1, objetivo: 'amigo', alcance: 6, unaPorPI: true },
  prender: { pa: 1, objetivo: 'enemigo', alcance: null, duradera: true },
  flujoTemporal: { pa: 1, objetivo: 'amigo', alcance: 6, pendiente: true },
};

// Las acciones únicas de un agente: las de su ficha y las prestadas por Cábala psíquica
export const unicasDe = op => [...((KINDS[op.kind] || {}).unicas || []), ...(op.unicasPrestadas || [])];
// el alcance de la acción: Maestro del Immaterium suma 3″ a los requisitos de distancia psíquicos
export function alcanceUnica(op, id) {
  const base = UNICAS[id].alcance;
  return base == null ? null : base + opcionesDe(op).reduce((s, o) => s + (o.distanciaPsiquica || 0), 0);
}

// Los agentes a los que se puede dirigir; `ven(a, b)` dice si a ve a b (lo presta la interfaz)
export function objetivosUnica(op, id, ops, ven) {
  const u = UNICAS[id], r = alcanceUnica(op, id);
  return ops.filter(o => o.alive && o.deployed !== false && o.id !== op.id
    && (u.objetivo === 'amigo' ? o.team === op.team && (KINDS[o.kind] || {}).comando === (KINDS[op.kind] || {}).comando : o.team !== op.team)
    && (r == null || opGap(op, o) <= r + 1e-9)
    && (id !== 'ritual' || o.wounds < o.maxW)
    && ven(op, o));
}

// ¿Puede `op` realizar la acción ahora? -> { ok: true } o { ok: false, motivo }
export function puedeUnica(op, id, ops, tray) {
  const u = UNICAS[id], no = motivo => ({ ok: false, motivo });
  if (!u) return no('desconocida');
  if (u.pendiente) return no('pendiente');
  if (!op.alive || !op.ready) return no('usado');
  if ((op.ap ?? op.apl) < u.pa) return no('sinPA');
  if (enZonaDeControl(op, ops).length) return no('enZonaDeControl');
  if ((op.vetadas || []).includes('u:' + id)) return no('vetada');
  if (u.unaPorPI && tray.ritual && tray.ritual[op.team] === tray.tp) return no('yaEsePI');
  return { ok: true };
}

/* ---------- efectos que duran ---------- */
// fx = { id, de: id del agente que la hizo, act: cuántas activaciones había terminado entonces }
export function vigente(fx, ops) {
  const s = ops.find(o => o.id === fx.de);
  if (!s || !s.alive) return false;
  const act = s.activaciones || 0, iniciada = s.ready && ((s.used && s.used.length) || s.ap < s.apl);
  return act === fx.act || (act === fx.act + 1 && !iniciada);
}
export const efectoEn = (op, id, ops) => (op && op.fx || []).find(f => f.id === id && vigente(f, ops)) || null;
// Pone el efecto en `objetivo`; el de un agente amigo anterior con la misma acción se acaba
export function ponerEfecto(op, id, objetivo, ops) {
  for (const o of ops) if (o.fx) o.fx = o.fx.filter(f => !(f.id === id && (ops.find(x => x.id === f.de) || {}).team === op.team));
  objetivo.fx = [...(objetivo.fx || []), { id, de: op.id, act: op.activaciones || 0 }];
}
