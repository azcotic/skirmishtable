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
  tab = tab === nombre ? "" : nombre;
  apply();
}
export const cerrarHoja = () => { if (tab) { tab = ""; apply(); } };

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
  document.getElementById("panelbtn").onclick = () => {
    open = !open;
    try { localStorage.setItem(KEY, open ? "open" : "folded"); } catch (e) { /* ventana privada: no se recuerda */ }
    apply();
  };
  for (const b of document.querySelectorAll(".hojatabs [data-tab]")) b.onclick = () => abrirPestana(b.dataset.tab);
  document.getElementById("hojacerrar").onclick = cerrarHoja;
  ANCHO.addEventListener("change", avisarTamano);
  // la barra de acciones y la pista cambian de alto: el tablero (y la mesa 3D) se reajustan
  if (window.ResizeObserver) {
    const stage = document.querySelector(".stage");
    if (stage) new ResizeObserver(avisarTamano).observe(stage);
  }
  apply();
}
