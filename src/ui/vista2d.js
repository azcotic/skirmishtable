/**
 * Vista del mapa 2D: orientación y zoom (Fase 4).
 *
 * - Vertical: si la caja del tablero es más alta que ancha (un teléfono de pie), el mapa gira
 *   90° para usar todo el alto. Todo se dibuja dentro de un grupo raíz (#raiz, dom.js) que
 *   lleva el giro; los textos se giran al revés para leerse derechos. El primer bando queda
 *   abajo, del lado del jugador.
 * - Zoom: pellizcar con dos dedos, la rueda del ratón, o arrastrar con un dedo el espacio
 *   vacío cuando hay zoom. Se hace moviendo el viewBox; las coordenadas de la mesa se leen
 *   siempre con la matriz de #raiz (input.js), así que el resto del código no cambia.
 */
import { svg, lienzo } from './dom.js';
import { BH, BW } from '../engine/world.js';
import { px } from '../engine/geometry.js';
import { state } from '../state.js';
import { buildStatic, renderAll } from './board.js';

const ZOOM_MAX = 5;
export const vista = { vertical: false, s: 1, cx: null, cy: null };

// el tamaño del mapa en unidades del viewBox, ya girado si toca
function base() {
  const W = px(BW), H = px(BH);
  return vista.vertical ? { w: H, h: W } : { w: W, h: H };
}
// el giro del grupo raíz: (x, y) de la mesa -> (y, W - x), el borde x = 0 abajo
export const transformRaiz = () => vista.vertical ? `translate(0 ${px(BW)}) rotate(-90)` : "";

export function aplicarVista() {
  const b = base(), w = b.w / vista.s, h = b.h / vista.s;
  if (vista.cx === null) { vista.cx = b.w / 2; vista.cy = b.h / 2; }
  vista.cx = Math.min(b.w - w / 2, Math.max(w / 2, vista.cx));
  vista.cy = Math.min(b.h - h / 2, Math.max(h / 2, vista.cy));
  svg.setAttribute("viewBox", `${(vista.cx - w / 2).toFixed(1)} ${(vista.cy - h / 2).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
  const btn = document.getElementById("vistareset");
  if (btn) btn.hidden = vista.s <= 1.001;
}
export function reiniciarVista() { vista.s = 1; vista.cx = vista.cy = null; aplicarVista(); }

// ¿Vertical u horizontal? Se decide por la forma de la caja del tablero. Si cambia, se
// vuelve a dibujar el mapa entero (el giro va en el grupo raíz y en cada texto).
export function revisarOrientacion() {
  const caja = svg.parentElement && svg.parentElement.getBoundingClientRect();
  if (!caja || !caja.width || !caja.height) return false;
  const v = caja.height > caja.width * 1.05;
  if (v === vista.vertical) return false;
  vista.vertical = v; lienzo.girarTextos = v;
  vista.s = 1; vista.cx = vista.cy = null;
  buildStatic(); renderAll(); aplicarVista();
  return true;
}

/* ---------- gestos ---------- */
const punteros = new Map();   // pointerId -> {x, y}
let pellizco = null;          // {d0, s0, p0: punto de la vista bajo el centro de los dedos}
let arrastre = null;          // {x0, y0, cx0, cy0, movido}

// unidades del viewBox por píxel de pantalla (preserveAspectRatio: meet)
function escala() {
  const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
  return Math.max(vb.width / r.width, vb.height / r.height);
}
// un punto de la pantalla en unidades del viewBox (sin el giro: el del svg, no el de #raiz)
function aVista(x, y) {
  const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM().inverse());
  return { x: p.x, y: p.y };
}
function zoomEn(sx, sy, factor) {
  const s = Math.min(ZOOM_MAX, Math.max(1, vista.s * factor));
  if (s === vista.s) return;
  const p = aVista(sx, sy), k = vista.s / s;
  vista.cx = p.x + (vista.cx - p.x) * k;
  vista.cy = p.y + (vista.cy - p.y) * k;
  vista.s = s;
  aplicarVista();
}
const medio = () => { const [a, b] = [...punteros.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) }; };

export function wireVista2D() {
  // orientación inicial, antes de dibujar el primer mapa
  const caja = svg.parentElement && svg.parentElement.getBoundingClientRect();
  if (caja && caja.width && caja.height) vista.vertical = lienzo.girarTextos = caja.height > caja.width * 1.05;
  svg.style.touchAction = "none";   // el pellizco es del mapa, no de la página
  svg.addEventListener("wheel", ev => {
    ev.preventDefault();
    zoomEn(ev.clientX, ev.clientY, Math.exp(-ev.deltaY * 0.0015));
  }, { passive: false });
  svg.addEventListener("pointerdown", ev => {
    punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (punteros.size === 2) {                     // segundo dedo: pellizco; se suelta lo que el primero arrastraba
      if (state.drag) { state.drag = null; renderAll(); }
      arrastre = null;
      const m = medio();
      pellizco = { d0: m.d || 1, s0: vista.s, ultimo: m };
      return;
    }
    // un dedo (o el ratón) sobre espacio vacío con zoom: mover la vista
    const sobreFicha = ev.target.closest && ev.target.closest("[data-oid]");
    if (punteros.size === 1 && !sobreFicha && vista.s > 1.001 && state.mode !== "ruler")
      arrastre = { x0: ev.clientX, y0: ev.clientY, cx0: vista.cx, cy0: vista.cy, movido: false };
  });
  window.addEventListener("pointermove", ev => {
    if (!punteros.has(ev.pointerId)) return;
    punteros.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pellizco && punteros.size === 2) {
      const m = medio(), k = escala();
      vista.cx -= (m.x - pellizco.ultimo.x) * k;   // los dedos arrastran la vista
      vista.cy -= (m.y - pellizco.ultimo.y) * k;
      pellizco.ultimo = m;
      zoomEn(m.x, m.y, (pellizco.s0 * m.d / pellizco.d0) / vista.s);
      aplicarVista();
      return;
    }
    if (arrastre) {
      const dx = ev.clientX - arrastre.x0, dy = ev.clientY - arrastre.y0;
      if (!arrastre.movido && Math.hypot(dx, dy) < 8) return;
      arrastre.movido = true;
      const k = escala();
      vista.cx = arrastre.cx0 - dx * k; vista.cy = arrastre.cy0 - dy * k;
      aplicarVista();
    }
  });
  const soltar = ev => {
    if (!punteros.delete(ev.pointerId)) return;
    if (punteros.size < 2) pellizco = null;
    if (arrastre && arrastre.movido) {               // fue un arrastre de la vista, no un toque
      state.suppressClick = true; setTimeout(() => { state.suppressClick = false; }, 0);
    }
    if (!punteros.size) arrastre = null;
  };
  window.addEventListener("pointerup", soltar);
  window.addEventListener("pointercancel", soltar);
  const btn = document.getElementById("vistareset");
  if (btn) btn.onclick = reiniciarVista;
  window.addEventListener("resize", () => { if (!revisarOrientacion()) aplicarVista(); });
}
