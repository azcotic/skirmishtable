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
  ["tgtbtn", ""], ["shootbtn", "fuerte"], ["fightbtn", "fuerte"], ["endact", ""]];
// ("ardidestiroteo", los ardides de tiroteo, queda fuera hasta que tengan efecto: docs/PENDIENTE.md)
const DE_LA_PARTIDA = [["endtp", ""], ["undo", ""], ["rulerbtn", ""], ["iasugerir", "ia"]];

let alQuitarSeleccion = () => {};
// 🪽 volar (Vuelo inmaterial): input.js dice si el agente seleccionado puede y si ya lo eligió
export const accionesHooks = { volar: () => false, volando: () => false };
// un modo que pone sus propios botones (p. ej. el despliegue): { html() -> string|null, click(boton) }
// modos que ponen sus propios botones (despliegue, reacción): el primero que devuelva html manda
const especiales = [];
let especial = null;
export const setModoEspecial = m => { especiales.push(m); };

export function renderAcciones() {
  const bar = document.getElementById("acciones");
  if (!bar) return;
  let propio = null;
  especial = null;
  for (const m of especiales) { const h = m.html(); if (h != null) { propio = h; especial = m; break; } }
  if (propio != null) {
    for (const id of ["quitarsel", "fichasel", "volarsel"]) { const b = document.getElementById(id); if (b) b.hidden = true; }
    bar.classList.remove("con-agente");
    bar.classList.add("especial");
    if (bar._html !== propio) { bar.innerHTML = propio; bar._html = propio; }
    return;
  }
  bar.classList.remove("especial");
  const conAgente = !!(state.sel && state.sel.alive);
  // trabado no puede correr: en su lugar, Retroceder (si la ficha lo muestra)
  const lista = conAgente ? DEL_AGENTE.map(([id, x]) => id === "mv-dash" && document.getElementById("mv-fallBack") ? ["mv-fallBack", "mov"] : [id, x]) : DE_LA_PARTIDA;
  const botones = lista.map(([id, extra]) => {
    const src = document.getElementById(id);
    if (!src) return "";
    const cls = ["accion", extra, ...[...src.classList].filter(c => c !== "mini")].filter(Boolean).join(" ");
    return `<button class="${cls}" data-press="${id}"${src.title ? ` title="${src.title.replace(/"/g, "&quot;")}"` : ""}` +
      `${src.disabled ? " disabled" : ""}>${src.innerHTML}</button>`;
  });
  // ✕ quitar la selección y 📋 ver su ficha, en la línea de la pista (la barra no cambia de alto)
  for (const id of ["quitarsel", "fichasel"]) { const b = document.getElementById(id); if (b) b.hidden = !conAgente; }
  const volar = document.getElementById("volarsel");
  if (volar) { volar.hidden = !(conAgente && accionesHooks.volar()); volar.classList.toggle("activo", accionesHooks.volando()); }
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
