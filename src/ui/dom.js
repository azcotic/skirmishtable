/**
 * DOM helpers: the SVG board, element factory, hint line and battle log.
 */
import { T } from '../i18n/es.js';
export const capName = s => s[0].toUpperCase() + s.slice(1);
export function fmtDice(dice) { return dice.map(v => v===6?`<span class="crit">${v}</span>`:v).join(" "); }
export const HINT0 = T.ayuda.inicio;
export const logEl = document.getElementById("log");
// tap: online play collects this browser's lines to send; rec: the replay recorder's
// copy of every game line (replayer.js); mute: lines that stay local
export const logHooks = { tap: null, rec: null, mute: false };
// conAviso: además del registro, un aviso en el centro de la pantalla (resultados de los dados)
export function logLine(html, hit, conAviso = false) {
  const p = document.createElement("p"); if (hit) p.className = "hit";
  p.innerHTML = html; logEl.prepend(p);
  if (conAviso) aviso(html, hit);
  if (logHooks.tap && !logHooks.mute) logHooks.tap(html, !!hit);
  if (logHooks.rec && !logHooks.mute) logHooks.rec(p.textContent);
}
// A line from another browser: only <b> and <span class="dice|crit"> survive, the rest
// becomes plain text, so nothing sent over the network can run in this page.
function safeCopy(from, to) {
  for (const c of from.childNodes) {
    if (c.nodeType === 3) { to.appendChild(document.createTextNode(c.textContent)); continue; }
    if (c.nodeType !== 1) continue;
    const tag = c.tagName.toLowerCase();
    if (tag !== "b" && tag !== "span") { safeCopy(c, to); continue; }
    const e = document.createElement(tag), cls = c.getAttribute("class");
    if (tag === "span" && (cls === "dice" || cls === "crit")) e.className = cls;
    safeCopy(c, e); to.appendChild(e);
  }
}
export function logRemote(html, hit) {
  const t = document.createElement("template"); t.innerHTML = html;   // inert: nothing loads or runs
  const p = document.createElement("p"); if (hit) p.className = "hit";
  safeCopy(t.content, p); logEl.prepend(p);
  if (/atq \[| vs /.test(p.textContent)) aviso(p.innerHTML, hit);   // dados del otro jugador
  if (logHooks.rec) logHooks.rec(p.textContent);
}
export function hint(t) { document.getElementById("hint").textContent = t; }

// Un aviso en el centro de la pantalla que se queda hasta que lo cierras (tocándolo o con ✕):
// el resultado de los dados, que en el teléfono no se ve porque el registro está en su pestaña.
// En escritorio, con el panel lateral a la vista, solo si el panel está plegado.
// alCerrar: al cerrarlo, las cajas de dados se cierran también (dicebox.js lo pone).
export const avisoHooks = { alCerrar: () => {} };
const ANCHO = typeof matchMedia === "function" ? matchMedia("(min-width: 1024px)") : { matches: false };
// opt.siempre: también en escritorio con el panel a la vista (las explicaciones de por qué no se puede algo);
// opt.ms: se cierra solo a los ms; opt.clave: reemplaza al aviso anterior con esa clave (no se apilan)
export function aviso(html, golpe = false, opt = {}) {
  const caja = document.getElementById("avisos");
  if (!caja) return;
  const main = document.querySelector(".main");
  if (!opt.siempre && ANCHO.matches && main && !main.classList.contains("folded")) return;
  if (opt.clave) for (const v of caja.querySelectorAll(`.aviso[data-clave="${opt.clave}"]`)) v.remove();
  const a = document.createElement("div");
  a.className = "aviso" + (golpe ? " golpe" : "") + (opt.siempre ? " explica" : "");
  if (opt.clave) a.dataset.clave = opt.clave;
  if (opt.ms) setTimeout(() => { if (a.isConnected) { a.classList.add("saliendo"); setTimeout(() => a.remove(), 250); } }, opt.ms);
  a.innerHTML = `<button class="aviso-cerrar" aria-label="${T.dados.cerrarAviso}">✕</button>${html}`;
  a.onclick = () => { a.classList.add("saliendo"); setTimeout(() => a.remove(), 250); avisoHooks.alCerrar(); };
  caja.prepend(a);
  while (caja.children.length > 3) caja.lastElementChild.remove();
}

/* ---------- board rendering ---------- */
export const svg = document.getElementById("board");
// Todo el mapa se dibuja dentro de un grupo raíz (#raiz, lo crea board.js) que lleva el giro
// del mapa en vertical (vista2d.js); girarTextos: los textos se giran al revés, para leerse derechos.
export const lienzo = { g: null, girarTextos: false };
export const NS = "http://www.w3.org/2000/svg";
export function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  const p = parent || lienzo.g || svg;
  if (tag === "text" && lienzo.girarTextos && p !== svg && attrs && attrs.x !== undefined && !attrs.transform)
    e.setAttribute("transform", `rotate(90 ${attrs.x} ${attrs.y})`);
  p.appendChild(e); return e;
}
