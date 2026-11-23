/**
 * Escritorio ancho (≥ 1100 px): el tablero ocupa el centro y los lados dejan de estar vacíos.
 *   · Izquierda (#colinfo): lo que estás haciendo y la ficha del agente: la pista con los PA libres,
 *     la tarjeta del agente con su retrato, el veredicto y los blancos.
 *   · Derecha (el panel lateral de siempre): las acciones del agente arriba y, debajo, el menú con las
 *     pestañas Partida, Misión, Registro y Más.
 * No se duplica nada: se reubican los mismos bloques de index.html (los renderizadores los buscan
 * por id) y, al estrechar la ventana, vuelven a la zona del pulgar y a la hoja inferior del teléfono.
 */
import { T } from '../i18n/es.js';

const ANCHO = typeof matchMedia === "function" ? matchMedia("(min-width: 1100px)") : { matches: false, addEventListener() {} };
let info = null;

const $ = id => document.getElementById(id);

function aAncho() {
  if (info) return;
  const main = document.querySelector(".main"), hoja = $("sidepanel"), abajo = document.querySelector(".abajo");
  const cuerpo = hoja && hoja.querySelector(".hojacuerpo");
  if (!main || !hoja || !abajo || !cuerpo) return;
  info = document.createElement("aside");
  info.id = "colinfo"; info.className = "colinfo";
  info.setAttribute("aria-label", T.hoja.info);
  main.insertBefore(info, main.firstChild);
  info.appendChild(abajo.querySelector(".filapista"));
  for (const p of [...cuerpo.querySelectorAll(":scope > .panel[data-tab=\"agente\"]")]) { p.dataset.casa = "agente"; info.appendChild(p); }
  hoja.insertBefore($("acciones"), cuerpo);
  hoja.insertBefore(abajo.querySelector(".hojatabs"), cuerpo);
  main.classList.add("ancho"); document.body.classList.add("ancho");
}

function aEstrecho() {
  if (!info) return;
  const main = document.querySelector(".main"), hoja = $("sidepanel"), abajo = document.querySelector(".abajo");
  const cuerpo = hoja.querySelector(".hojacuerpo");
  // pista, acciones y pestañas vuelven a la zona del pulgar, en su orden
  abajo.insertBefore(info.querySelector(".filapista"), abajo.firstChild);
  abajo.insertBefore($("acciones"), abajo.children[1] || null);
  abajo.appendChild(hoja.querySelector(".hojatabs"));
  // y los paneles del agente, al principio de la hoja
  const paneles = [...info.querySelectorAll(".panel[data-casa=\"agente\"]")];
  cuerpo.prepend(...paneles);
  for (const p of paneles) delete p.dataset.casa;
  info.remove(); info = null;
  main.classList.remove("ancho"); document.body.classList.remove("ancho");
}

function ajustar() {
  if (ANCHO.matches) aAncho(); else aEstrecho();
  window.dispatchEvent(new Event("resize"));   // la mesa 3D y las cajas de dados se ajustan a su caja
}

export const esAncho = () => ANCHO.matches;
export function wireColumnas() {
  ANCHO.addEventListener("change", ajustar);
  if (ANCHO.matches) aAncho();
}
