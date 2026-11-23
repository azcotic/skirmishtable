/**
 * Barra de acciones contextual (zona del pulgar, index.html #acciones).
 * Con un agente seleccionado: sus movimientos, orden, Apuntar, Disparar, Combatir y Terminar.
 * Sin selección: Fin del PI, Deshacer y Regla.
 *
 * No tiene lógica propia: cada botón es un reflejo de un botón de la ficha del agente
 * (panels.js) o del marcador (index.html), con su texto, título y estado, y al tocarlo pulsa
 * el original. Así las reglas de qué se puede hacer siguen en un solo lugar.
 */
import { state } from '../state.js';

// [id del botón original, clase extra]
const DEL_AGENTE = [["mv-reposition", "mov"], ["mv-dash", "mov"], ["mv-charge", "mov"], ["ordbtn", ""],
  ["tgtbtn", ""], ["shootbtn", "fuerte"], ["fightbtn", "fuerte"], ["endact", ""], ["verficha", "ficha"]];
const DE_LA_PARTIDA = [["endtp", ""], ["undo", ""], ["rulerbtn", ""], ["iasugerir", "ia"]];

let alQuitarSeleccion = () => {};
// un modo que pone sus propios botones (p. ej. el despliegue): { html() -> string|null, click(boton) }
let especial = null;
export const setModoEspecial = m => { especial = m; };

export function renderAcciones() {
  const bar = document.getElementById("acciones");
  if (!bar) return;
  const propio = especial && especial.html();
  if (propio != null) {
    const quitar = document.getElementById("quitarsel");
    if (quitar) quitar.hidden = true;
    bar.classList.remove("con-agente");
    bar.classList.add("especial");
    if (bar._html !== propio) { bar.innerHTML = propio; bar._html = propio; }
    return;
  }
  bar.classList.remove("especial");
  const conAgente = !!(state.sel && state.sel.alive);
  const botones = (conAgente ? DEL_AGENTE : DE_LA_PARTIDA).map(([id, extra]) => {
    const src = document.getElementById(id);
    if (!src) return "";
    const cls = ["accion", extra, ...[...src.classList].filter(c => c !== "mini")].filter(Boolean).join(" ");
    return `<button class="${cls}" data-press="${id}"${src.title ? ` title="${src.title.replace(/"/g, "&quot;")}"` : ""}` +
      `${src.disabled ? " disabled" : ""}>${src.innerHTML}</button>`;
  });
  const quitar = document.getElementById("quitarsel");
  if (quitar) quitar.hidden = !conAgente;
  const html = botones.join("");
  bar.classList.toggle("con-agente", conAgente);
  if (bar._html !== html) { bar.innerHTML = html; bar._html = html; }
}

// onQuitar: qué hacer al tocar ✕ (quitar la selección); lo pasa main.js para no crear ciclos.
export function wireAcciones(onQuitar) {
  if (onQuitar) alQuitarSeleccion = onQuitar;
  const bar = document.getElementById("acciones");
  if (!bar) return;
  bar.addEventListener("click", ev => {
    const b = ev.target.closest("button");
    if (!b || b.disabled) return;
    if (b.dataset.esp && especial) { especial.click(b); return; }
    const src = b.dataset.press && document.getElementById(b.dataset.press);
    if (src) src.click();
  });
  const quitar = document.getElementById("quitarsel");
  if (quitar) quitar.onclick = () => alQuitarSeleccion();
  renderAcciones();
}
