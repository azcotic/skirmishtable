/**
 * Paso de despliegue antes de jugar (interfaz). El motor está en src/engine/deploy.js.
 *
 * Al cargar o reiniciar un mapa, según la opción "Despliegue" (⚙):
 * - por turnos: todos los agentes salen de la mesa y los jugadores se alternan para colocarlos,
 *   uno a uno, tocando dentro de su zona de descenso en el mapa 2D. En línea, cada jugador
 *   coloca los suyos cuando es su turno; en solitario los colocas tú todos.
 * - al azar: como antes, repartidos por la mesa (scatterRoster).
 * La dirección lo puede fijar: ?deploy=zones (cada bando en su zona) o ?deploy=scatter.
 */
import { T } from '../i18n/es.js';
import { TEAMNAME } from '../config.js';
import { BH, BW, DROPZONES, OPS } from '../engine/world.js';
import { chocaConAgente, dentroDeZona, desplegar, enDespliegue, porDesplegar, retirarParaDesplegar, turnoDespliegue } from '../engine/deploy.js';
import { nearestFree, useBase } from '../engine/movement.js';
import { opR } from '../engine/geometry.js';
import { mayControl, online } from '../net/sync.js';
import { hint, logLine } from './dom.js';
import { snapshot } from './panels.js';
import { renderAll } from './board.js';
import { options } from './options.js';
import { setModoEspecial } from './acciones.js';
import { modelIndex, teamOf } from '../view3d/units.js';

// qué es el agente: su modelo si el bando tiene comando (p. ej. "Hechicero del Destino"),
// si no, su tipo genérico ("Líder", "Francotirador"…)
export function queEs(op) {
  const t = teamOf(op.team);
  if (t && t.models.length) return t.models[modelIndex(op, t.models.length)].name;
  return T.tipos[op.kind] || op.kind;
}

// quién empieza a desplegar: el jugador con la iniciativa (por ahora, siempre el primer bando)
export const INICIA = 0;
let elegido = null;   // el agente que el jugador eligió colocar (si no, el primero que falte)

const nombreEquipo = t => TEAMNAME[t];
export const despliegueActivo = () => enDespliegue(OPS);
export const turno = () => turnoDespliegue(OPS, INICIA);
export const zonaActiva = () => { const t = turno(); return t === null ? null : DROPZONES.find(d => d.team === t) || null; };

function siguiente() {
  const t = turno();
  if (t === null) return null;
  const lista = porDesplegar(OPS, t);
  return lista.find(o => o.id === elegido) || lista[0];
}

// cómo empieza la partida: "zonas", "azar" o "turnos"
export function modoDespliegue() {
  const q = typeof location === "undefined" ? "" : location.search;
  if (/[?&]deploy=zones\b/.test(q)) return "zonas";
  if (/[?&]deploy=scatter\b/.test(q)) return "azar";
  return options.despliegue === "azar" ? "azar" : "turnos";
}

// Saca de la mesa a todos los agentes (lo llama loadMap antes de pintar).
export function prepararDespliegue() { retirarParaDesplegar(OPS); elegido = null; }
export function anunciarDespliegue() {
  logLine(T.despliegue.empieza(nombreEquipo(turno())));
  hint(pista());
}

export function pista() {
  const t = turno();
  if (t === null) return T.despliegue.terminaPista;
  if (!mayControl({ team: t })) return T.despliegue.esperando(nombreEquipo(t));
  const op = siguiente();
  return T.despliegue.toca(nombreEquipo(t), queEs(op), op.id);
}

// Un toque en el mapa 2D durante el despliegue: coloca al siguiente agente ahí (o lo más
// cerca donde quepa su peana). Devuelve true si el toque era para el despliegue.
export function colocarEn(x, y) {
  const t = turno();
  if (t === null) return false;
  if (!mayControl({ team: t })) { hint(T.despliegue.esperando(nombreEquipo(t))); return true; }
  const op = siguiente(), dz = DROPZONES.find(d => d.team === t);
  useBase(opR(op));
  const spot = nearestFree(x, y, op.id, 0, 1);
  if (!spot) { hint(T.despliegue.noCabe); return true; }
  if (!dentroDeZona(op, spot[0], spot[1], dz)) { hint(T.despliegue.fueraDeZona(nombreEquipo(t))); return true; }
  if (chocaConAgente(op, spot[0], spot[1], OPS)) { hint(T.despliegue.ocupado); return true; }
  snapshot();
  desplegar(op, spot[0], spot[1]);
  elegido = null;
  logLine(T.despliegue.log(op.name, op.id));
  if (!despliegueActivo()) logLine(T.despliegue.termina);
  renderAll();
  hint(pista());
  return true;
}

// Solitario: coloca al azar, dentro de su zona, a todos los que faltan.
function restoAlAzar() {
  if (online() || !despliegueActivo()) return;
  snapshot();
  let n = 0;
  for (const op of porDesplegar(OPS)) {
    const dz = DROPZONES.find(d => d.team === op.team), R = opR(op);
    useBase(R);
    for (let i = 0; i < 400; i++) {
      const x = dz.x + R + Math.random() * Math.max(0, dz.w - 2 * R), y = dz.y + R + Math.random() * Math.max(0, dz.h - 2 * R);
      const spot = x > 0 && x < BW && y > 0 && y < BH && nearestFree(x, y, op.id, 0, 0.5);
      if (spot && dentroDeZona(op, spot[0], spot[1], dz) && !chocaConAgente(op, spot[0], spot[1], OPS)) { desplegar(op, spot[0], spot[1]); n++; break; }
    }
  }
  logLine(T.despliegue.restoLog(n));
  if (!despliegueActivo()) logLine(T.despliegue.termina);
  renderAll();
  hint(pista());
}

// La barra de acciones durante el despliegue: los agentes que faltan del bando en turno
// (tocar uno lo elige) y, en solitario, "Resto al azar".
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function accionesHTML() {
  if (!despliegueActivo()) return null;
  const t = turno(), mio = mayControl({ team: t }), sig = siguiente();
  // cada botón en el color del bando que despliega: qué es el agente, y su nombre y heridas
  const lista = mio ? porDesplegar(OPS, t).map(o =>
    `<button class="accion eq${t}${o === sig ? " active" : ""}" data-esp="${o.id}" title="${esc(T.despliegue.elegirTitulo(queEs(o)))}">` +
    `<b>${esc(o.id)} · ${esc(queEs(o))}</b><small>${esc(T.despliegue.detalle(o.name, o.maxW))}</small></button>`) : [];
  if (!online()) lista.push(`<button class="accion" data-esp="azar" title="${esc(T.despliegue.restoAzarTitulo)}">${T.despliegue.restoAzar}</button>`);
  return lista.join("");
}
function accionClick(b) {
  if (b.dataset.esp === "azar") { restoAlAzar(); return; }
  elegido = b.dataset.esp;
  hint(pista());
  renderAll();
}

export function wireDespliegue() {
  setModoEspecial({ html: accionesHTML, click: accionClick });
}
