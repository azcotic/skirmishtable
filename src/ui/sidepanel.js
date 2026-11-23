/**
 * La hoja de paneles (index.html, aside#sidepanel):
 * - Teléfono y tablet (< 1024 px): hoja inferior sobre el tablero. Las pestañas de abajo
 *   (Agente, Partida, Misión, Registro, Más) la abren con los paneles de esa pestaña; tocar la
 *   pestaña abierta o ✕ la cierra. Empieza cerrada: primero el tablero.
 * - Escritorio (≥ 1024 px): panel lateral con todos los paneles; el botón del encabezado lo
 *   pliega y lo despliega, y se recuerda en este navegador.
 */
import { T } from '../i18n/es.js';

const KEY = "skirmishtable.sidebar";        // escritorio: "open" = panel lateral visible
const KEY_AV = "skirmishtable.avanzado";    // la sección Avanzado, abierta o cerrada
const ANCHO = typeof matchMedia === "function" ? matchMedia("(min-width: 1024px)") : { matches: true, addEventListener() {} };
// escritorio ancho (columnas.js): el menú de la derecha empieza cerrado; la pestaña del agente va a la izquierda
const MUY_ANCHO = typeof matchMedia === "function" ? matchMedia("(min-width: 1280px)") : { matches: false, addEventListener() {} };

let open = false;   // escritorio
let tab = "";       // teléfono/tablet: pestaña abierta ("" = hoja cerrada)
try { open = localStorage.getItem(KEY) === "open"; } catch (e) {}

const avisarTamano = () => window.dispatchEvent(new Event("resize"));   // la mesa 3D y las cajas de dados se ajustan a su caja

function apply() {
  const main = document.querySelector(".main"), aside = document.getElementById("sidepanel");
  const btn = document.getElementById("panelbtn");
  main.classList.toggle("folded", !open);
  main.classList.toggle("hoja-abierta", !!tab);
  aside.dataset.tab = tab;
  btn.textContent = open ? T.app.ocultarPanel : T.app.mostrarPanel;
  btn.setAttribute("aria-expanded", String(open));
  for (const b of document.querySelectorAll(".hojatabs [data-tab]")) b.setAttribute("aria-selected", String(b.dataset.tab === tab));
  avisarTamano();
}

// Abre una pestaña de la hoja (o la cierra si ya estaba abierta). Exportada para que otros
// módulos puedan llevar al jugador a un panel, p. ej. el registro.
export function abrirPestana(nombre) {
  if (MUY_ANCHO.matches && nombre === "agente") return;   // la tarjeta del agente está a la izquierda (columnas.js)
  tab = tab === nombre ? "" : nombre;
  apply();
}
export const cerrarHoja = () => {
  document.getElementById("sidepanel").classList.remove("alta");
  if (tab) { tab = ""; apply(); }
};

// La agarradera de la hoja (teléfono/tablet): arrastrarla hacia arriba la agranda casi a
// pantalla completa; hacia abajo, la vuelve a su alto o la cierra.
function wireAsa() {
  const asa = document.querySelector(".hojaasa"), aside = document.getElementById("sidepanel");
  if (!asa) return;
  let y0 = null, h0 = 0;
  asa.addEventListener("pointerdown", ev => {
    if (ANCHO.matches || ev.target.closest("button")) return;
    y0 = ev.clientY; h0 = aside.getBoundingClientRect().height;
    asa.setPointerCapture(ev.pointerId);
  });
  asa.addEventListener("pointermove", ev => {
    if (y0 === null) return;
    const h = Math.max(60, h0 - (ev.clientY - y0));
    aside.style.maxHeight = aside.style.height = h + "px";   // la hoja sigue al dedo
  });
  const soltar = ev => {
    if (y0 === null) return;
    const dy = ev.clientY - y0;
    y0 = null;
    aside.style.maxHeight = aside.style.height = "";
    if (dy < -40) aside.classList.add("alta");
    else if (dy > 80 && !aside.classList.contains("alta")) cerrarHoja();
    else if (dy > 30) aside.classList.remove("alta");
    avisarTamano();
  };
  asa.addEventListener("pointerup", soltar);
  asa.addEventListener("pointercancel", soltar);
}

function wireAdvanced() {
  const av = document.getElementById("avanzado");
  if (!av) return;
  try { av.open = localStorage.getItem(KEY_AV) === "open"; } catch (e) {}
  av.addEventListener("toggle", () => {
    try { localStorage.setItem(KEY_AV, av.open ? "open" : "closed"); } catch (e) { /* ventana privada: no se recuerda */ }
  });
}

export function wireSidePanel() {
  wireAdvanced();
  wireAsa();
  document.getElementById("panelbtn").onclick = () => {
    open = !open;
    try { localStorage.setItem(KEY, open ? "open" : "folded"); } catch (e) { /* ventana privada: no se recuerda */ }
    apply();
  };
  for (const b of document.querySelectorAll(".hojatabs [data-tab]")) b.onclick = () => abrirPestana(b.dataset.tab);
  document.getElementById("hojacerrar").onclick = cerrarHoja;
  ANCHO.addEventListener("change", avisarTamano);
  MUY_ANCHO.addEventListener("change", () => { tab = ""; apply(); });
  // la barra de acciones y la pista cambian de alto: el tablero (y la mesa 3D) se reajustan
  if (window.ResizeObserver) {
    const stage = document.querySelector(".stage");
    if (stage) new ResizeObserver(avisarTamano).observe(stage);
  }
  apply();
}
