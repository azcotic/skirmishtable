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
import { control, esDeLaIA } from './control.js';
import { despliegueActivo, pista, setAlTerminarDespliegue } from './despliegue.js';
import { doUndo, snapshot, tray } from './panels.js';
import { hint, logLine } from './dom.js';
import { renderAll } from './board.js';
import { setAlNuevoPI } from './controls.js';
import { TEAMNAME } from '../config.js';
import { G } from '../i18n/es.js';
import { teamOf } from '../view3d/units.js';
import { ARDIDES } from '../i18n/nombres.js';
import { pmDelPI, puedeUsarArdid, quienDecide, tirarD6, COSTE_ARDID } from '../game/fases.js';
import { OPS, rosterInit } from '../engine/world.js';
import { agenteDeMuestra, comandoPorId, eleccionesDe, modelosPara, pesoAgente, plantillaDefs, puedeAnadir, seleccionesMax,
  validarComando } from '../data/teams/index.js';
import { abrirFicha } from './ficha.js';
import { gradoActual, puntuarKillOp, reiniciarPuntos } from './ops.js';
import { setPick } from '../view3d/units.js';
import { bandoEnTurno } from './turno.js';
import { mayControl } from '../net/sync.js';

const KEY = "skirmishtable.inicio";
// los comandos de prueba (ids del catálogo de Steam): Garra Némesis y Aquelarre Disforme
const COMANDOS_PRUEBA = ["3352828814", "3348897103"];
const ORDEN = ["modo", "mapa", "comando0", "plantilla0", "comando1", "plantilla1", "despliegue", "resumen"];

// plantilla: los agentes elegidos de cada bando (claves); config: el nombre de la configuración
// faccion: por bando, lo elegido en las elecciones de facción de su comando (src/data/teams):
// { [índice del agente en la plantilla]: { [id de la elección]: id de la opción } }
const eleccion = { modo: null, mapa: null, comando: [null, null], plantilla: [null, null], config: [null, null], faccion: [{}, {}], despliegue: null };
// Lo que falta o hay que elegir en un bando: una entrada por agente y elección que le toca
function porElegir(s) {
  if (!eleccion.plantilla[s]) return [];
  const els = eleccionesDe(eleccion.comando[s]);
  return els.flatMap(e => eleccion.plantilla[s].map((k, i) => e.agentes.includes(k) ? { e, i } : null).filter(Boolean));
}
const elegido = (s, { e, i }) => (eleccion.faccion[s][i] || {})[e.id];
// lo que ya eligieron los demás agentes del bando en esa elección (si es "unica", no se repite)
const tomadas = (s, { e, i }) => porElegir(s).filter(x => x.e === e && x.i !== i).map(x => elegido(s, x)).filter(Boolean);
function elegirOpcion(s, { e, i }, id) { eleccion.faccion[s][i] = { ...(eleccion.faccion[s][i] || {}), [e.id]: id }; }
// Tras la configuración de un bando: sus elecciones de facción (si las hay), una pantalla por
// agente, y luego el siguiente paso. La computadora elige al azar entre las que ya hacen algo.
function trasConfig(s) {
  const despues = s === 0 ? "comando1" : "despliegue";
  eleccion.faccion[s] = {};
  const lista = porElegir(s);
  if (!lista.length) return ir(despues);
  if (s === 1 && eleccion.modo === "ia") {
    for (const x of lista) {
      const libres = x.e.opciones.filter(o => !o.pendiente && !(x.e.unica && tomadas(1, x).includes(o.id)));
      if (libres.length) elegirOpcion(1, x, libres[Math.floor(Math.random() * libres.length)].id);
    }
    return ir(despues);
  }
  return ir("faccion" + s);
}
let paso = "modo";
const pila = [];
let tirada = null;          // fase de estrategia en línea: {dados: [a, b], decide: 0|1|null}
let ordenArdides = [0, 1];  // quién elige ardides primero (quien tiene la iniciativa)
const SIN_ATRAS = ["invitar", "listo", "iniciativa", "ardidesA", "ardidesB", "fin", "ardidesT"];
const bando = s => { const t = teamOf(s); return t ? `${TEAMNAME[s]} · ${t.name}` : TEAMNAME[s]; };

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
      opcion("ia", I.contraIA, I.contraIADesc) + opcion("solo", I.solo, I.soloDesc) + opcion("linea", I.linea, I.lineaDesc) +
      opcion("aprender", I.aprender, I.aprenderDesc, { deshabilitada: true, extra: `<span class="pant-pronto">${I.pronto}</span>` }) };
    case "mapa": return { titulo: I.mapaTitulo, sub: I.mapaSub, html: opcionesMapa() };
    case "comando0": return { titulo: I.comandoTitulo, sub: I.comandoSub, html: opcionesComando(0) };
    case "plantilla0": case "plantilla1": {   // 3 configuraciones de ejemplo y "Elige tú mismo"
      const s = +paso.slice(-1), c = comandoPorId(eleccion.comando[s]);
      const html = c.ejemplos.map((e, k) => opcion("ej:" + k, esc(e.nombre),
        `${esc(e.desc)}<br><span class="pant-agentes">${e.agentes.map(a => esc(c.agentes[a].nombre)).join(" · ")}</span>`,
        { activa: eleccion.config[s] === e.nombre })).join("") +
        opcion("propia", I.propia, I.propiaDesc(seleccionesMax(c)), { activa: eleccion.config[s] === I.propia });
      return { titulo: s === 0 ? I.configTitulo : I.configTituloRival, sub: esc(c.nombre), html };
    }
    case "faccion0": case "faccion1": {        // elecciones de facción: una pantalla por agente y elección
      const s = +paso.slice(-1), c = comandoPorId(eleccion.comando[s]), lista = porElegir(s), F = T.faccion;
      const x = lista.find(y => !elegido(s, y)) || lista[lista.length - 1];
      const deEsta = lista.filter(y => y.e === x.e), ya = x.e.unica ? tomadas(s, x) : [];
      const html = x.e.opciones.map(o => opcion(`op:${lista.indexOf(x)}:${o.id}`, esc(o.nombre),
        `${F.desc[o.id] || ""}${o.pendiente ? ` <em class="pant-pendiente">${F.pendiente}</em>` : ""}`,
        { activa: elegido(s, x) === o.id, deshabilitada: ya.includes(o.id) })).join("");
      return { titulo: F.titulo[x.e.id] || F.tituloGenerico,
        sub: F.sub(esc(c.agentes[eleccion.plantilla[s][x.i]].nombre), deEsta.indexOf(x) + 1, deEsta.length, !!x.e.unica), html };
    }
    case "elegir0": case "elegir1": {          // armar el comando agente por agente
      const s = +paso.slice(-1), c = comandoPorId(eleccion.comando[s]), lista = eleccion.plantilla[s] || [];
      const v = validarComando(c, lista), comp = c.composicion || {};
      const elegidos = lista.length
        ? lista.map((k, i) => `<button class="pant-chip" data-v="rm:${i}" aria-label="${esc(I.quitar(c.agentes[k].nombre))}">${esc(c.agentes[k].nombre)} ✕</button>`).join("")
        : `<p class="pant-nota">${I.ningunoAun}</p>`;
      const disponibles = Object.entries(c.agentes).map(([k, a]) => {
        const veces = lista.filter(x => x === k).length, p = puedeAnadir(c, lista, k);
        const medio = pesoAgente(c, k) < 1 ? ` <small class="medio" title="${I.medioTitulo}">½</small>` : "";
        return `<div class="pant-agente${veces ? " elegido" : ""}">
          <div class="pant-agente-info"><b>${esc(a.nombre)}${a.lider ? ` <small>${T.fichaDatos.lider}</small>` : ""}${medio}${veces ? ` <span class="pant-veces">×${veces}</span>` : ""}</b>
            <span>${I.statsCortas(a.move, a.apl, a.save, a.wounds)}${p.motivo === "unico" ? ` · <em>${I.soloUno}</em>` : ""}</span></div>
          <button class="pant-ver" data-v="ver:${k}" aria-label="${esc(I.verFicha(a.nombre))}">👁</button>
          <button class="pant-mas" data-v="add:${k}"${p.ok ? "" : " disabled"} aria-label="${esc(I.anadir(a.nombre))}">＋</button></div>`;
      }).join("");
      const reglas = [I.reglas.selecciones(v.max), ...(comp.requiere || []).map(r => I.reglas.requiere(r.nombre)),
        ...(comp.repetibles ? [I.reglas.unicos] : []), ...(comp.medio ? [I.reglas.medio] : [])];
      const errores = lista.length ? v.errores.map(([t, x]) => I.error[t](t === "repetido" ? c.agentes[x].nombre : x)) : [];
      return { titulo: I.armarTitulo, sub: `${esc(c.nombre)} · ${I.cuenta(v.usadas, v.max)}`,
        html: `<div class="pant-elegidos">${elegidos}</div>
          ${errores.length ? `<ul class="pant-errores">${errores.map(e => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
          <h3 class="pant-sec">${I.disponibles}</h3>${disponibles}
          <h3 class="pant-sec">${I.reglasTitulo}</h3><ul class="pant-reglas">${reglas.map(r => `<li>${esc(r)}</li>`).join("")}</ul>`,
        principal: `<button class="pant-jugar" id="pantlistoarmar"${v.ok ? "" : " disabled"}>${I.listoArmar(lista.length, v.ok)}</button>` };
    }
    case "comando1": return { titulo: eleccion.modo === "ia" ? I.rivalTituloIA : I.rivalTitulo,
      sub: eleccion.modo === "linea" ? I.rivalSubLinea : eleccion.modo === "ia" ? I.rivalSubIA : I.rivalSub, html: opcionesComando(1) };
    case "despliegue": return { titulo: I.despliegueTitulo, sub: I.despliegueSub, html:
      opcion("turnos", I.turnos, I.turnosDesc, { activa: eleccion.despliegue === "turnos" }) +
      opcion("azar", I.azar, I.azarDesc, { activa: eleccion.despliegue === "azar" }) };
    case "resumen": return { titulo: I.resumenTitulo, sub: "", html:
      `<dl class="pant-resumen">` +
      `<dt>${I.rModo}</dt><dd>${eleccion.modo === "linea" ? I.linea : eleccion.modo === "ia" ? I.contraIA : I.solo}</dd>` +
      `<dt>${I.rMapa}</dt><dd>${esc(nombreMapa(eleccion.mapa))}</dd>` +
      `<dt>${I.rComando}</dt><dd>${esc(nombreComando(eleccion.comando[0]))}${eleccion.config[0] ? ` · ${esc(eleccion.config[0])}` : ""}</dd>` +
      `<dt>${I.rRival}</dt><dd>${esc(nombreComando(eleccion.comando[1]))}${eleccion.config[1] ? ` · ${esc(eleccion.config[1])}` : ""}</dd>` +
      `<dt>${I.rDespliegue}</dt><dd>${eleccion.despliegue === "azar" ? I.azar : I.turnos}</dd></dl>`,
      principal: `<button class="pant-jugar" id="pantjugar">${I.jugar}</button>` };
    case "listo": return { titulo: I.listoTitulo, sub: I.listoSub, html:
      `<p class="pant-nota">${I.opcionales}</p>` +
      opcion("equipo", I.equipoT, I.equipoD, { deshabilitada: true, extra: `<span class="pant-pronto">${I.pronto}</span>` }) +
      opcion("operaciones", I.opsT, I.opsD, { deshabilitada: true, extra: `<span class="pant-pronto">${I.pronto}</span>` }),
      principal: `<button class="pant-jugar" id="pantempezar">${I.empezar}</button>` +
        `<button class="pant-secundario" id="pantdeshacer">${I.deshacerUltimo}</button>` };
    case "iniciativa": {
      const E = T.estrategia;
      const opciones = d => [0, 1].map(s => opcion("ini" + s, esc(bando(s)), E.iniOpDesc, { deshabilitada: d, extra: `<span class="pant-marca-eq eq${s}"></span>` })).join("");
      if (!online()) return { titulo: `${E.titulo(tray.tp)} · ${E.iniTitulo}`, sub: E.iniSoloSub, html: opciones(false) };
      if (!tirada) return { titulo: `${E.titulo(tray.tp)} · ${E.iniTitulo}`, sub: E.tirarSub, html: opcion("tirar", E.tirar) };
      const dados = `<div class="pant-dados"><span class="eq0">${esc(TEAMNAME[0])} <b>${tirada.dados[0]}</b></span><span class="eq1">${esc(TEAMNAME[1])} <b>${tirada.dados[1]}</b></span></div>`;
      if (tirada.decide === null) return { titulo: `${E.titulo(tray.tp)} · ${E.iniTitulo}`, sub: E.empate, html: dados + opcion("tirar", E.tirar) };
      const mio = mayControl({ team: tirada.decide });
      return { titulo: `${E.titulo(tray.tp)} · ${E.iniTitulo}`, sub: mio ? E.decide(esc(TEAMNAME[tirada.decide])) : E.esperaDecision(esc(TEAMNAME[tirada.decide])),
        html: dados + opciones(!mio) };
    }
    case "ardidesT": {   // ardides de tiroteo: se usan durante la fase de tiroteo
      const E = T.estrategia, lado = ladoTiroteo, mio = mayControl({ team: lado }) && !esDeLaIA(lado);
      const t = teamOf(lado), lista = (t && ARDIDES[t.id] && ARDIDES[t.id].tiroteo) || [];
      const usados = (tray.ardidesT && tray.ardidesT[lado]) || [];
      const html = (!lista.length ? `<p class="pant-nota">${E.sinArdides}</p>` : lista.map(n => {
        const usado = usados.includes(n);
        return opcion("ardidT:" + n, esc(n), usado ? E.ardidUsado : E.ardidCoste,
          { activa: usado, deshabilitada: !mio || (!usado && !puedeUsarArdid(tray.cp, tray.ardidesT || [[], []], lado, n)) });
      }).join("")) + `<p class="pant-nota">${E.repeticionNota}</p>`;
      const otro = control.ia === null ? `<button class="pant-secundario" id="pantotrobando">${E.verOtro(esc(TEAMNAME[1 - lado]))}</button>` : "";
      return { titulo: `${E.titulo(tray.tp)} · ${E.tiroteoTitulo}`, sub: E.tiroteoSub(esc(bando(lado)), tray.cp[lado]), html,
        principal: `<button class="pant-jugar" id="pantmesa">${E.volverMesa}</button>${otro}` };
    }
    case "ardidesA": case "ardidesB": {
      const E = T.estrategia, lado = ordenArdides[paso === "ardidesA" ? 0 : 1], mio = mayControl({ team: lado });
      const t = teamOf(lado), lista = (t && ARDIDES[t.id] && ARDIDES[t.id].estrategia) || [];
      const usados = (tray.ardides && tray.ardides[lado]) || [];
      const html = !lista.length ? `<p class="pant-nota">${E.sinArdides}</p>` : lista.map(n => {
        const usado = usados.includes(n);
        return opcion("ardid:" + n, esc(n), usado ? E.ardidUsado : E.ardidCoste,
          { activa: usado, deshabilitada: !mio || (!usado && !puedeUsarArdid(tray.cp, tray.ardides || [[], []], lado, n)) });
      }).join("");
      const ultimo = paso === "ardidesB";
      return { titulo: `${E.titulo(tray.tp)} · ${E.ardidesTitulo}`,
        sub: mio ? E.ardidesSub(esc(bando(lado)), tray.cp[lado]) : E.esperaArdides(esc(TEAMNAME[lado])), html,
        principal: mio ? `<button class="pant-jugar" id="pantardidesok">${ultimo ? E.aTiroteo : E.siguiente(esc(TEAMNAME[ordenArdides[1]]))}</button>` : "" };
    }
    case "fin": {
      const F = T.fin, r = resultadoFinal();
      const fila = s => `<div class="pant-fin-bando eq${s}${r.ganador === s ? " gana" : ""}">` +
        `<span class="pant-fin-nombre">${esc(bando(s))}${esDeLaIA(s) ? ` <small>${F.computadora}</small>` : ""}</span>` +
        `<b>${tray.vp[s]} ${G.pv.abrev}</b><span>${F.enPie(r.enPie[s], r.total[s])} · ${F.bajas(r.bajas[s])} · ${T.operaciones.gradoCorto(gradoActual(s))}</span></div>`;
      return { titulo: F.titulo, sub: r.motivo === "aniquilado" ? F.aniquilado(TEAMNAME[r.ganador]) : F.trasPI(tray.tp),
        html: `<div class="pant-fin-ganador">${r.ganador === null ? F.empate : F.gana(esc(bando(r.ganador)), esDeLaIA(r.ganador))}</div>` +
          fila(0) + fila(1) + `<p class="pant-nota">${F.notaPV}</p>`,
        principal: `<button class="pant-jugar" id="pantnueva">${F.nueva}</button><button class="pant-secundario" id="pantmesa">${F.verMesa}</button>` };
    }
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
  // armar el comando cuenta como el paso de su configuración, para los puntos de progreso
  const c = contenido(), i = ORDEN.indexOf(/^(elegir|faccion)/.test(paso) ? "plantilla" + paso.slice(-1) : paso);
  const puntos = i < 0 ? "" : ORDEN.map((_, k) => `<i class="${k < i ? "hecho" : k === i ? "ahora" : ""}"></i>`).join("");
  el.innerHTML = `<div class="pant" data-paso="${paso}">
    <div class="pant-cab">
      ${pila.length && !SIN_ATRAS.includes(paso) ? `<button class="pant-atras" id="pantatras" aria-label="${T.inicio.atras}">←</button>` : `<span class="pant-marca">Skirmish<b>Table</b></span>`}
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
    case "comando0": case "comando1": {
      const s = +paso.slice(-1), c = comandoPorId(v);
      eleccion.comando[s] = v; eleccion.plantilla[s] = null; eleccion.config[s] = null;
      if (!c) return ir(s === 0 ? "comando1" : "despliegue");   // fichas simples: sin configuración
      if (s === 1 && eleccion.modo === "ia") {          // la computadora elige una de las de ejemplo
        const e = c.ejemplos[Math.floor(Math.random() * c.ejemplos.length)];
        eleccion.plantilla[1] = [...e.agentes]; eleccion.config[1] = e.nombre;
        return trasConfig(1);
      }
      return ir("plantilla" + s);
    }
    case "plantilla0": case "plantilla1": {
      const s = +paso.slice(-1), c = comandoPorId(eleccion.comando[s]);
      if (v === "propia") { eleccion.plantilla[s] = eleccion.config[s] === T.inicio.propia ? eleccion.plantilla[s] : []; return ir("elegir" + s); }
      const e = c.ejemplos[+v.slice(3)];
      eleccion.plantilla[s] = [...e.agentes]; eleccion.config[s] = e.nombre;
      return trasConfig(s);
    }
    case "faccion0": case "faccion1": {
      const s = +paso.slice(-1), [, n, id] = v.split(":"), lista = porElegir(s);
      elegirOpcion(s, lista[+n], id);
      if (lista.every(y => elegido(s, y))) return ir(s === 0 ? "comando1" : "despliegue");
      return render();
    }
    case "elegir0": case "elegir1": {
      const s = +paso.slice(-1), c = comandoPorId(eleccion.comando[s]), lista = eleccion.plantilla[s] = eleccion.plantilla[s] || [];
      if (v.startsWith("add:") && puedeAnadir(c, lista, v.slice(4)).ok) lista.push(v.slice(4));
      else if (v.startsWith("rm:")) lista.splice(+v.slice(3), 1);
      else if (v.startsWith("ver:")) { abrirFicha(agenteDeMuestra(s, c.id, v.slice(4))); return; }
      return render();
    }
    case "despliegue": eleccion.despliegue = v; return ir("resumen");
    case "iniciativa":
      if (v === "tirar") {
        tirada = { dados: [tirarD6(), tirarD6()] };
        tirada.decide = quienDecide(tirada.dados, tray.ini);
        logLine(T.estrategia.logDados(TEAMNAME[0], tirada.dados[0], TEAMNAME[1], tirada.dados[1]));
        return render();
      }
      return fijarIniciativa(+v.slice(3));
    case "ardidesA": case "ardidesB":
      if (v.startsWith("ardid:")) return alternarArdid(ordenArdides[paso === "ardidesA" ? 0 : 1], v.slice(6));
      break;
    case "ardidesT":
      if (v.startsWith("ardidT:")) return alternarArdid(ladoTiroteo, v.slice(7), "ardidesT");
  }
}

/* ---------- fase de estrategia (cada punto de inflexión) ---------- */
export function abrirFaseEstrategia() {
  const el = pantalla();
  if (!el) return;
  tirada = null;
  tray.ardides = [[], []];
  paso = "iniciativa"; pila.length = 0;
  el.hidden = false;
  render();
}
// Quien decide elige quién tiene la iniciativa: se reparten los PM del punto de inflexión.
function fijarIniciativa(s) {
  snapshot();
  tray.ini = s;
  const g = pmDelPI(tray.tp, s);
  tray.cp[0] += g[0]; tray.cp[1] += g[1];
  logLine(T.estrategia.logIni(TEAMNAME[s], g[0], g[1], TEAMNAME[0], TEAMNAME[1]));
  ordenArdides = [s, 1 - s];
  renderAll();
  irArdides("ardidesA");
}
// la pantalla de ardides de un bando; la IA no usa ardides todavía: se salta la suya
function irArdides(p) {
  const lado = ordenArdides[p === "ardidesA" ? 0 : 1];
  if (esDeLaIA(lado)) return p === "ardidesA" ? irArdides("ardidesB") : aTiroteo();
  ir(p);
}
// Usar un ardid (−1 PM) o devolverlo si fue sin querer (+1 PM).
// clave: "ardides" (de estrategia) o "ardidesT" (de tiroteo), los usados en este punto de inflexión
function alternarArdid(lado, n, clave = "ardides") {
  if (!mayControl({ team: lado })) return;
  tray[clave] = tray[clave] || [[], []];
  const usados = tray[clave][lado];
  snapshot();
  if (usados.includes(n)) {
    usados.splice(usados.indexOf(n), 1); tray.cp[lado] += COSTE_ARDID;
    logLine(T.estrategia.logDevuelto(TEAMNAME[lado], n));
  } else if (puedeUsarArdid(tray.cp, tray[clave], lado, n)) {
    usados.push(n); tray.cp[lado] -= COSTE_ARDID;
    logLine(T.estrategia.logArdid(TEAMNAME[lado], n));
  }
  renderAll();
  render();
}
// Ardides de tiroteo: la pantalla del bando que juega (contra la computadora, siempre el tuyo)
let ladoTiroteo = 0;
export function abrirArdidesTiroteo() {
  const el = pantalla();
  if (!el) return;
  const enTurno = bandoEnTurno();
  ladoTiroteo = control.ia !== null ? 1 - control.ia : enTurno !== null ? enTurno : 0;
  paso = "ardidesT"; pila.length = 0;
  el.hidden = false;
  render();
}
function aTiroteo() {
  cerrar();
  logLine(T.estrategia.logTiroteo(TEAMNAME[tray.ini]));
  hint(T.estrategia.tiroteo(TEAMNAME[tray.ini]));
  control.alEmpezarTiroteo();        // si la IA tiene la iniciativa, empieza ella (ia.js)
}

// Arma la partida con lo elegido y cierra las pantallas (en línea: antes, la de invitar).
function empezar() {
  control.ia = eleccion.modo === "ia" ? 1 : null;   // contra la computadora: la IA lleva el comando rival
  setOption("despliegue", eleccion.despliegue);
  setTeam(0, eleccion.comando[0] || null);
  setTeam(1, eleccion.comando[1] || null);
  // los agentes de cada bando: el comando de prueba con sus fichas reales (o fichas simples)
  // con sus elecciones de facción (5.º dato de cada agente)
  rosterInit([0, 1].flatMap(s => plantillaDefs(s, eleccion.comando[s], eleccion.plantilla[s])
    .map((d, i) => eleccion.faccion[s][i] ? [...d, eleccion.faccion[s][i]] : d)));
  loadMap(eleccion.mapa);
  reiniciarPuntos();                 // hoja de PV en blanco (grado de bajas incluido)
  // cada agente con el modelo 3D que le corresponde
  for (const s of [0, 1]) {
    const picks = modelosPara(OPS.filter(o => o.team === s), teamOf(s));
    for (const [id, i] of Object.entries(picks)) setPick(s, id, i);
  }
  renderMinis();
  cerrarHoja();
  if (eleccion.modo === "linea" && !online()) { hostGame(); ir("invitar"); return; }
  if (!despliegueActivo()) abrirFaseEstrategia();   // al azar: no hay despliegue, empieza ya el PI 1
  else cerrar();
}

export function abrirInicio() {
  const el = pantalla();
  if (!el) return;
  finMostrado = false;
  Object.assign(eleccion, { modo: null, mapa: null, comando: [null, null], plantilla: [null, null], config: [null, null], faccion: [{}, {}], despliegue: null });
  paso = "modo"; pila.length = 0;
  el.hidden = false;
  render();
}
export function cerrar() { const el = pantalla(); if (el) el.hidden = true; }

// Al terminar el despliegue: confirmar antes del primer punto de inflexión. Equipo y
// operaciones aparecen como pasos opcionales (aún no disponibles).
// Fin de la batalla: tras el último punto de inflexión, o cuando un bando se queda sin agentes.
let finMostrado = false;
function resultadoFinal() {
  const enMesa = s => OPS.filter(o => o.team === s && o.deployed !== false);
  const enPie = [0, 1].map(s => enMesa(s).filter(o => o.alive).length);
  const total = [0, 1].map(s => enMesa(s).length);
  const bajas = [0, 1].map(s => enMesa(1 - s).filter(o => !o.alive).length);   // enemigos que incapacitó
  let ganador, motivo = "pi";
  if (enPie[0] === 0 || enPie[1] === 0) { motivo = "aniquilado"; ganador = enPie[0] === 0 ? (enPie[1] === 0 ? null : 1) : 0; }
  else ganador = tray.vp[0] > tray.vp[1] ? 0 : tray.vp[1] > tray.vp[0] ? 1 : null;
  return { enPie, total, bajas, ganador, motivo };
}
export function abrirFin() {
  const el = pantalla();
  if (!el) return;
  finMostrado = true;
  paso = "fin"; pila.length = 0;
  el.hidden = false;
  render();
}
function comprobarFin() {
  if (finMostrado || despliegueActivo() || !OPS.some(o => o.deployed !== false)) return;

  const r = resultadoFinal();
  if (r.motivo === "aniquilado") { logLine(T.fin.logAniquilado); puntuarKillOp(false); abrirFin(); }
}

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
    if (b.id === "pantnueva") return abrirInicio();
    if (b.id === "pantlistoarmar") {               // comando armado a mano
      const s = +paso.slice(-1);
      eleccion.config[s] = T.inicio.propia;
      return trasConfig(s);
    }
    if (b.id === "pantotrobando") { ladoTiroteo = 1 - ladoTiroteo; return render(); }
    if (b.id === "pantempezar") {                  // confirmado: empieza el primer punto de inflexión
      logLine(T.despliegue.termina); abrirFaseEstrategia(); return;
    }
    if (b.id === "pantardidesok") { if (paso === "ardidesA") irArdides("ardidesB"); else aTiroteo(); return; }
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
  // fin de la batalla: los PV de la operación de bajas (con el punto extra tras el 4.º PI)
  control.alFinBatalla = motivo => { puntuarKillOp(motivo === "pi"); abrirFin(); };
  control.alComprobarFin = comprobarFin;
  // en cada punto de inflexión, la fase de estrategia (los tests la omiten: PM automáticos)
  let omitir = false;
  try { omitir = localStorage.getItem(KEY) === "omitir"; } catch (e) {}
  if (!omitir) setAlNuevoPI(abrirFaseEstrategia);
  const at = document.getElementById("ardidestiroteo");
  if (at) at.onclick = abrirArdidesTiroteo;
  const nueva = document.getElementById("nuevapartida");
  if (nueva) nueva.onclick = abrirInicio;
  if (inicioAlAbrir()) abrirInicio();
}
