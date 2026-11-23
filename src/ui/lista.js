/**
 * La lista de unidades (escritorio ancho, columna derecha, bajo las acciones): las unidades de un
 * bando con su retrato, nombre, heridas y estado; tocar una la selecciona (o, si es del rival y ya
 * hay un agente propio seleccionado, la marca como blanco, igual que en el mapa). Durante el
 * despliegue no se muestra: ahí manda la lista de agentes por colocar (acciones.js, despliegue.js).
 * Qué bando se ve: el del agente seleccionado, si no el que tiene el turno, si no el primero; el
 * botón ⇄ enseña el otro.
 */
import { T } from '../i18n/es.js';
import { state } from '../state.js';
import { TEAMCOL, TEAMNAME } from '../config.js';
import { OPS } from '../engine/world.js';
import { isInjured } from '../engine/dice.js';
import { retrato } from '../view3d/units.js';

let bando = null;          // el que se ve (null: automático)
let alElegir = () => {};   // qué hacer al tocar una unidad (lo pone main.js: input.js clickOp)
let ultimo = "";
export const wireLista = fn => {
  alElegir = fn;
  const box = document.getElementById("listaunidades");
  if (!box) return;
  box.addEventListener("click", ev => {
    const b = ev.target.closest && ev.target.closest("button");
    if (!b) return;
    if (b.id === "listacambiar") { bando = 1 - ladoVisible(); renderLista(); return; }
    if (b.dataset.oid) alElegir(b.dataset.oid);
  });
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function ladoVisible() {
  if (bando !== null) return bando;
  return state.sel ? state.sel.team : 0;
}

export function renderLista() {
  const box = document.getElementById("listaunidades");
  if (!box || !document.body.classList.contains("ancho")) return;
  const L = T.lista, lado = ladoVisible();
  const enMesa = OPS.filter(o => o.team === lado && o.deployed !== false);
  // en pleno despliegue la lista que importa es la de los agentes por colocar
  if (!enMesa.length || OPS.some(o => o.deployed === false)) { if (ultimo !== "") { box.innerHTML = ""; ultimo = ""; } box.hidden = true; return; }
  box.hidden = false;
  const filas = enMesa.map(o => {
    const r = retrato(o), sel = state.sel === o, objetivo = state.target === o;
    const cara = r ? `<img class="lu-cara" src="${r}" alt="" style="border-color:${TEAMCOL[o.team]}">`
      : `<span class="lu-cara lu-letra" style="background:${TEAMCOL[o.team]}">${esc(o.id)}</span>`;
    const pct = Math.max(0, Math.round(100 * o.wounds / o.maxW));
    const estado = !o.alive ? L.fuera : !o.ready ? L.usado : "";
    return `<button class="lu${sel ? " sel" : ""}${objetivo ? " blanco" : ""}${!o.alive ? " muerto" : ""}${!o.ready && o.alive ? " usado" : ""}" data-oid="${esc(o.id)}"` +
      ` title="${esc(L.tocar(o.name))}">${cara}<span class="lu-txt"><b>${esc(o.id)} · ${esc(o.name)}</b>` +
      `<span class="lu-barra"><i class="${isInjured(o) ? "herido" : ""}" style="width:${pct}%"></i></span>` +
      `<small>${o.wounds}/${o.maxW} ${T.ficha.stat.heridas.toLowerCase().slice(0, 1) === "h" ? "H" : ""}${estado ? " · " + esc(estado) : ""}</small></span></button>`;
  }).join("");
  const html = `<div class="lu-cab"><b style="color:${TEAMCOL[lado]}">${esc(L.titulo(TEAMNAME[lado]))}</b>` +
    `<button class="mini" id="listacambiar" title="${esc(L.cambiarTitulo)}">⇄</button></div><div class="lu-filas">${filas}</div>`;
  if (html !== ultimo) { box.innerHTML = html; ultimo = html; }
}
