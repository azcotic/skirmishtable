/**
 * Reaccionar (Reglas breves): si todos tus agentes están usados pero los del rival no, cuando te
 * tocaría activar, un agente tuyo usado con orden de trabarse puede reaccionar: hace gratis una
 * acción de 1 PA, moviendo como mucho 2″. Cada agente reacciona una vez por punto de inflexión.
 *
 * Cuando se abre esa ventana (turnoDeActivacion la da al bando que solo puede reaccionar), la
 * barra de acciones muestra "Reaccionar con …" por cada agente que puede, y "Pasar". Reaccionar
 * deja al agente apostado con 1 PA (op.reaccion) para esa acción; al terminar su activación,
 * vuelve a quedar usado. Pasar le da el turno al rival.
 */
import { T } from '../i18n/es.js';
import { TEAMNAME } from '../config.js';
import { KINDS, OPS } from '../engine/world.js';
import { enDespliegue } from '../engine/deploy.js';
import { puedeReaccionar } from '../game/acciones.js';
import { state } from '../state.js';
import { mayControl } from '../net/sync.js';
import { pasarTurno, snapshot } from './panels.js';
import { renderAll } from './board.js';
import { hint, logLine } from './dom.js';
import { setModoEspecial } from './acciones.js';
import { alternasObligatorias, bandoEnTurno, enActivacion } from './turno.js';
import { control, esDeLaIA } from './control.js';

const nombre = op => `${op.id} · ${(KINDS[op.kind] && KINDS[op.kind].nombre) || op.name}`;
export const reaccionables = s => OPS.filter(o => puedeReaccionar(o) && o.team === s);

// ¿Está abierta la ventana de reacción? Devuelve el bando que puede reaccionar, o null.
export function ventanaReaccion() {
  if (!alternasObligatorias() || enDespliegue(OPS) || enActivacion()) return null;
  const s = bandoEnTurno();
  if (s === null || OPS.some(o => o.alive && o.team === s && o.ready)) return null;
  return reaccionables(s).length ? s : null;
}

export function iniciarReaccion(op) {
  snapshot();
  Object.assign(op, { ready: true, ap: 1, used: [], reaccion: true, reacciono: true });
  state.sel = op; state.target = null;
  logLine(T.reaccion.log(op.name));
  renderAll();
  hint(T.reaccion.empieza(op.name));
}
export function pasar(s) {
  pasarTurno(s);
  logLine(T.reaccion.pasa(TEAMNAME[s]));
  renderAll();
  control.alTerminarActivacion();   // ¿le toca a la IA?
}

function accionesHTML() {
  const s = ventanaReaccion();
  if (s === null) return null;
  const mio = mayControl({ team: s }) && !esDeLaIA(s);
  if (!mio) return "";
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  return reaccionables(s).map(o => `<button class="accion eq${s}" data-esp="r:${o.id}" title="${esc(T.reaccion.titulo)}">` +
    `<b>${esc(T.reaccion.boton)}</b><small>${esc(nombre(o))}</small></button>`).join("") +
    `<button class="accion" data-esp="pasar">${T.reaccion.pasar}</button>`;
}
function click(b) {
  const s = ventanaReaccion();
  if (s === null) return;
  if (b.dataset.esp === "pasar") return pasar(s);
  const op = OPS.find(o => o.id === b.dataset.esp.slice(2));
  if (op) iniciarReaccion(op);
}

// La pista cuando se abre la ventana
export function pistaReaccion() {
  const s = ventanaReaccion();
  return s === null ? null : T.reaccion.pista(TEAMNAME[s]);
}

export function wireReaccion() {
  setModoEspecial({ html: accionesHTML, click });
}
