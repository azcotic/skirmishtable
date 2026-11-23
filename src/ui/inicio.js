/**
 * Flujo de inicio de partida, estilo juego de móvil: pantallas sencillas, una decisión por
 * pantalla; tocas una opción y pasas a la siguiente (← vuelve atrás).
 *
 *   Inicio (solitario / con un amigo / aprender) → zona de aniquilación → tu comando →
 *   comando rival → despliegue → resumen → ¡A jugar!  (en línea: + pantalla para invitar)
 *
 * Se muestra al abrir la app, salvo que la dirección traiga una partida (#room=, #host=,
 * #game=, #replay=) o ?deploy=, o que este navegador lo omita (localStorage
 * "skirmishtable.inicio" = "omitir", lo usan los tests). "Nueva partida" lo vuelve a abrir.
 */
import { T } from '../i18n/es.js';
import { MAPS } from '../engine/world.js';
import { TTS_TEAMS } from '../data/tts-teams.js';
import { loadMap } from './controls.js';
import { setTeam } from '../view3d/units.js';
import { renderMinis } from './minis.js';
import { setOption } from './options.js';
import { hostGame, net, online } from '../net/sync.js';
import { cerrarHoja } from './sidepanel.js';
import { despliegueActivo, pista, setAlTerminarDespliegue } from './despliegue.js';
import { doUndo } from './panels.js';
import { hint, logLine } from './dom.js';

const KEY = "skirmishtable.inicio";
// los comandos de prueba (ids del catálogo de Steam): Garra Némesis y Aquelarre Disforme
const COMANDOS_PRUEBA = ["3352828814", "3348897103"];
const ORDEN = ["modo", "mapa", "comando0", "comando1", "despliegue", "resumen"];

const eleccion = { modo: null, mapa: null, comando: [null, null], despliegue: null };
let paso = "modo";
const pila = [];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pantalla = () => document.getElementById("inicio");
const nombreComando = id => id ? (TTS_TEAMS.find(t => t.id === id) || {}).name || id : T.inicio.fichasSimples;
const nombreMapa = k => MAPS[k] ? MAPS[k].name : k;

// una opción grande: título, descripción y valor
const opcion = (v, titulo, desc = "", { activa = false, deshabilitada = false, extra = "" } = {}) =>
  `<button class="pant-op${activa ? " activa" : ""}" data-v="${esc(v)}"${deshabilitada ? " disabled" : ""}>` +
  `<span class="pant-op-t">${titulo}</span>${desc ? `<span class="pant-op-d">${desc}</span>` : ""}${extra}</button>`;

function opcionesComando(lado) {
  const elegido = eleccion.comando[lado];
  return COMANDOS_PRUEBA.filter(id => TTS_TEAMS.some(t => t.id === id))
    .map(id => opcion(id, esc(nombreComando(id)), T.inicio.comandoDesc(TTS_TEAMS.find(t => t.id === id).models.length), { activa: elegido === id }))
    .concat(opcion("", T.inicio.fichasSimples, T.inicio.fichasSimplesDesc, { activa: eleccion.comando[lado] === "" }))
    .join("");
}

function opcionesMapa() {
  const grupos = new Map();
  for (const [k, m] of Object.entries(MAPS)) {
    if (!m || /^imp/.test(k)) continue;
    const g = m.group || "";
    if (!grupos.has(g)) grupos.set(g, []);
    grupos.get(g).push(`<button class="pant-mapa${eleccion.mapa === k ? " activa" : ""}" data-v="${esc(k)}" title="${esc(m.name)}">${esc(m.short || m.name)}</button>`);
  }
  return [...grupos].map(([g, bs]) => `<div class="pant-grupo"><h3>${esc(g)}</h3><div class="pant-mapas">${bs.join("")}</div></div>`).join("");
}

function contenido() {
  const I = T.inicio;
  switch (paso) {
    case "modo": return { titulo: I.modoTitulo, sub: I.modoSub, html:
      opcion("solo", I.solo, I.soloDesc) + opcion("linea", I.linea, I.lineaDesc) +
      opcion("aprender", I.aprender, I.aprenderDesc, { deshabilitada: true, extra: `<span class="pant-pronto">${I.pronto}</span>` }) };
    case "mapa": return { titulo: I.mapaTitulo, sub: I.mapaSub, html: opcionesMapa() };
    case "comando0": return { titulo: I.comandoTitulo, sub: I.comandoSub, html: opcionesComando(0) };
    case "comando1": return { titulo: I.rivalTitulo, sub: eleccion.modo === "linea" ? I.rivalSubLinea : I.rivalSub, html: opcionesComando(1) };
    case "despliegue": return { titulo: I.despliegueTitulo, sub: I.despliegueSub, html:
      opcion("turnos", I.turnos, I.turnosDesc, { activa: eleccion.despliegue === "turnos" }) +
      opcion("azar", I.azar, I.azarDesc, { activa: eleccion.despliegue === "azar" }) };
    case "resumen": return { titulo: I.resumenTitulo, sub: "", html:
      `<dl class="pant-resumen">` +
      `<dt>${I.rModo}</dt><dd>${eleccion.modo === "linea" ? I.linea : I.solo}</dd>` +
      `<dt>${I.rMapa}</dt><dd>${esc(nombreMapa(eleccion.mapa))}</dd>` +
      `<dt>${I.rComando}</dt><dd>${esc(nombreComando(eleccion.comando[0]))}</dd>` +
      `<dt>${I.rRival}</dt><dd>${esc(nombreComando(eleccion.comando[1]))}</dd>` +
      `<dt>${I.rDespliegue}</dt><dd>${eleccion.despliegue === "azar" ? I.azar : I.turnos}</dd></dl>`,
      principal: `<button class="pant-jugar" id="pantjugar">${I.jugar}</button>` };
    case "listo": return { titulo: I.listoTitulo, sub: I.listoSub, html:
      `<p class="pant-nota">${I.opcionales}</p>` +
      opcion("equipo", I.equipoT, I.equipoD, { deshabilitada: true, extra: `<span class="pant-pronto">${I.pronto}</span>` }) +
      opcion("operaciones", I.opsT, I.opsD, { deshabilitada: true, extra: `<span class="pant-pronto">${I.pronto}</span>` }),
      principal: `<button class="pant-jugar" id="pantempezar">${I.empezar}</button>` +
        `<button class="pant-secundario" id="pantdeshacer">${I.deshacerUltimo}</button>` };
    case "invitar": {
      const link = location.origin + location.pathname + location.search + "#room=" + net.code;
      return { titulo: I.invitarTitulo, sub: I.invitarSub, html:
        `<input class="pant-link" id="pantlink" readonly value="${esc(link)}" aria-label="${I.invitarTitulo}">` +
        `<button class="pant-op" id="pantcopiar"><span class="pant-op-t">${I.copiar}</span></button>`,
        principal: `<button class="pant-jugar" id="pantmesa">${I.irMesa}</button>` };
    }
  }
  return { titulo: "", sub: "", html: "" };
}

function render() {
  const el = pantalla();
  if (!el) return;
  const c = contenido(), i = ORDEN.indexOf(paso);
  const puntos = i < 0 ? "" : ORDEN.map((_, k) => `<i class="${k < i ? "hecho" : k === i ? "ahora" : ""}"></i>`).join("");
  el.innerHTML = `<div class="pant" data-paso="${paso}">
    <div class="pant-cab">
      ${pila.length && paso !== "invitar" ? `<button class="pant-atras" id="pantatras" aria-label="${T.inicio.atras}">←</button>` : `<span class="pant-marca">Skirmish<b>Table</b></span>`}
      <div class="pant-puntos" aria-hidden="true">${puntos}</div>
    </div>
    <h2 class="pant-titulo">${c.titulo}</h2>
    ${c.sub ? `<p class="pant-sub">${c.sub}</p>` : ""}
    <div class="pant-opciones">${c.html}</div>
    ${c.principal ? `<div class="pant-pie">${c.principal}</div>` : ""}
  </div>`;
  el.scrollTop = 0;
}

function ir(siguiente) { pila.push(paso); paso = siguiente; render(); }
function atras() { if (pila.length) { paso = pila.pop(); render(); } }

function elegir(v) {
  switch (paso) {
    case "modo": eleccion.modo = v; return ir("mapa");
    case "mapa": eleccion.mapa = v; return ir("comando0");
    case "comando0": eleccion.comando[0] = v; return ir("comando1");
    case "comando1": eleccion.comando[1] = v; return ir("despliegue");
    case "despliegue": eleccion.despliegue = v; return ir("resumen");
  }
}

// Arma la partida con lo elegido y cierra las pantallas (en línea: antes, la de invitar).
function empezar() {
  setOption("despliegue", eleccion.despliegue);
  setTeam(0, eleccion.comando[0] || null);
  setTeam(1, eleccion.comando[1] || null);
  loadMap(eleccion.mapa);
  renderMinis();
  cerrarHoja();
  if (eleccion.modo === "linea" && !online()) { hostGame(); ir("invitar"); return; }
  cerrar();
}

export function abrirInicio() {
  const el = pantalla();
  if (!el) return;
  Object.assign(eleccion, { modo: null, mapa: null, comando: [null, null], despliegue: null });
  paso = "modo"; pila.length = 0;
  el.hidden = false;
  render();
}
export function cerrar() { const el = pantalla(); if (el) el.hidden = true; }

// Al terminar el despliegue: confirmar antes del primer punto de inflexión. Equipo y
// operaciones aparecen como pasos opcionales (aún no disponibles).
export function abrirListo() {
  const el = pantalla();
  if (!el) return;
  paso = "listo"; pila.length = 0;
  el.hidden = false;
  render();
}

// ¿Se muestra al abrir la app?
export function inicioAlAbrir() {
  if (typeof location !== "undefined" && (/#(room|host|game|replay)=/.test(location.hash) || /[?&]deploy=/.test(location.search))) return false;
  try { if (localStorage.getItem(KEY) === "omitir") return false; } catch (e) {}
  return true;
}

export function wireInicio() {
  const el = pantalla();
  if (!el) return;
  el.addEventListener("click", ev => {
    const b = ev.target.closest("button");
    if (!b || b.disabled) return;
    if (b.id === "pantatras") return atras();
    if (b.id === "pantjugar") return empezar();
    if (b.id === "pantmesa") return cerrar();
    if (b.id === "pantempezar") {                  // confirmado: empieza el primer punto de inflexión
      cerrar(); logLine(T.despliegue.termina); hint(T.despliegue.terminaPista); return;
    }
    if (b.id === "pantdeshacer") {                 // vuelve al despliegue: se retira el último agente
      cerrar(); doUndo(); if (despliegueActivo()) hint(pista()); return;
    }
    if (b.id === "pantcopiar") {
      const inp = document.getElementById("pantlink");
      inp.select();
      (navigator.clipboard ? navigator.clipboard.writeText(inp.value) : Promise.reject()).catch(() => document.execCommand("copy"));
      b.querySelector(".pant-op-t").textContent = T.inicio.copiado;
      return;
    }
    if (b.dataset.v !== undefined) elegir(b.dataset.v);
  });
  setAlTerminarDespliegue(abrirListo);
  const nueva = document.getElementById("nuevapartida");
  if (nueva) nueva.onclick = abrirInicio;
  if (inicioAlAbrir()) abrirInicio();
}
