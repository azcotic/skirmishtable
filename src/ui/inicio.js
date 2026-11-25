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
import { ARDID, DOCTRINAS, idoloAncestrales, dadosGuardados, doctrina, elegirDoctrina, elegirFlexible, guardarDestino, guerraDoctrinas, quitarDestino, tacticasDeBando } from './ardides.js';
import { ventanaInicioPI } from './sacerdotes-sl.js';
import { d6 } from '../engine/dice.js';
import { showRoll } from './dicetray.js';
import { gradoActual, puntuarKillOp, reiniciarPuntos } from './ops.js';
import { setPick } from '../view3d/units.js';
import { bandoEnTurno } from './turno.js';
import { mayControl } from '../net/sync.js';
import { MAX_EQUIPO, alternarEquipo, equipoDeFaccion, separar, todoElEquipo } from '../game/equipo.js';

const KEY = "skirmishtable.inicio";
export const KEY_PARTIDA = "skirmishtable.partida";   // la partida guardada (src/ui/guardado.js)
// los comandos de prueba (ids del catálogo de Steam): Garra Némesis y Aquelarre Disforme
const COMANDOS_PRUEBA = ["3352828814", "3348897103", "2272196183", "3272457903"];   // Garra Némesis, Aquelarre Disforme, Ángeles de la Muerte, Saurios de Lustria
const ORDEN = ["modo", "mapa", "comando0", "plantilla0", "comando1", "plantilla1", "despliegue", "resumen"];

// plantilla: los agentes elegidos de cada bando (claves); config: el nombre de la configuración
// faccion: por bando, lo elegido en las elecciones de facción de su comando (src/data/teams):
// { [índice del agente en la plantilla]: { [id de la elección]: id de la opción } }
const eleccion = { modo: null, mapa: null, comando: [null, null], plantilla: [null, null], config: [null, null], faccion: [{}, {}], tacticas: [[null, null], [null, null]], equipo: [[], []], despliegue: null };
// Lo que falta o hay que elegir en un bando: una entrada por agente y elección que le toca
function porElegir(s) {
  if (!eleccion.plantilla[s]) return [];
  const els = eleccionesDe(eleccion.comando[s]);
  return els.flatMap(e => eleccion.plantilla[s].map((k, i) => e.agentes.includes(k) ? { e, i } : null).filter(Boolean));
}
const elegido = (s, { e, i }) => (eleccion.faccion[s][i] || {})[e.id];
// lo que ya eligieron los demás agentes del bando en esa elección (si es "unica", no se repite)
const tomadas = (s, { e, i }) => porElegir(s).filter(x => x.e === e && x.i !== i).map(x => elegido(s, x)).filter(Boolean);
// los que eligen junto con x: él solo si la elección es "unica"; si no, todos los del mismo tipo
const mismos = (s, x) => x.e.unica ? [x] : porElegir(s).filter(y => y.e === x.e && eleccion.plantilla[s][y.i] === eleccion.plantilla[s][x.i]);
function elegirOpcion(s, { e, i }, id) { eleccion.faccion[s][i] = { ...(eleccion.faccion[s][i] || {}), [e.id]: id }; }
// Tras la configuración de un bando: sus elecciones de facción (si las hay), una pantalla por
// agente, y luego el siguiente paso. La computadora elige al azar entre las que ya hacen algo.
// Tras las elecciones de facción: las tácticas de capítulo si el comando las tiene; luego, el siguiente paso
function trasFaccion(s) {
  const c = comandoPorId(eleccion.comando[s]), despues = s === 0 ? "comando1" : "despliegue";
  eleccion.tacticas[s] = [null, null];
  if (!c || !c.tacticas) return trasTacticas(s);
  if (s === 1 && eleccion.modo === "ia") {   // la computadora elige dos distintas al azar
    const ids = c.tacticas.map(t => t.id), p = ids[Math.floor(Math.random() * ids.length)];
    const resto = ids.filter(x => x !== p);
    eleccion.tacticas[1] = [p, resto[Math.floor(Math.random() * resto.length)]];
    return trasTacticas(1);
  }
  return ir("tacticas" + s);
}
// Tras las tácticas: el equipo del comando (la computadora no lleva equipo todavía); luego, el siguiente paso
function trasTacticas(s) {
  const c = comandoPorId(eleccion.comando[s]), sigue = s === 0 ? "comando1" : "despliegue";
  eleccion.equipo[s] = [];
  if (!c || (s === 1 && eleccion.modo === "ia")) return ir(sigue);
  return ir("equipo" + s);
}
function trasConfig(s) {
  eleccion.faccion[s] = {};
  const lista = porElegir(s);
  if (!lista.length) return trasFaccion(s);
  if (s === 1 && eleccion.modo === "ia") {
    for (const x of lista) {
      const libres = x.e.opciones.filter(o => !o.pendiente && !(x.e.unica && tomadas(1, x).includes(o.id)));
      if (libres.length) elegirOpcion(1, x, libres[Math.floor(Math.random() * libres.length)].id);
    }
    return trasFaccion(1);
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
      // sin "unica" (p. ej. las armas), los agentes iguales eligen juntos: una pantalla por tipo
      const clave = y => eleccion.plantilla[s][y.i], juntos = mismos(s, x);
      const deEsta = lista.filter(y => y.e === x.e && (x.e.unica || y === mismos(s, y)[0])), ya = x.e.unica ? tomadas(s, x) : [];
      const html = x.e.opciones.map(o => opcion(`op:${lista.indexOf(x)}:${o.id}`, esc(o.nombre),
        `${F.desc[o.id] || ""}${o.pendiente ? ` <em class="pant-pendiente">${F.pendiente}</em>` : ""}`,
        { activa: elegido(s, x) === o.id, deshabilitada: ya.includes(o.id) })).join("");
      return { titulo: F.titulo[x.e.id] || F.tituloGenerico,
        sub: F.sub(esc(c.agentes[clave(x)].nombre), deEsta.indexOf(juntos[0]) + 1, deEsta.length, !!x.e.unica, juntos.length), html };
    }
    case "tacticas0": case "tacticas1": {      // tácticas de capítulo: primaria y luego secundaria (distintas)
      const s = +paso.slice(-1), c = comandoPorId(eleccion.comando[s]), t = eleccion.tacticas[s], F = T.tacticas;
      const segunda = !!t[0];
      const html = c.tacticas.map(x => opcion("t:" + x.id, esc(x.nombre), esc(F.desc[x.id] || ""),
        { activa: false, deshabilitada: segunda && x.id === t[0] })).join("");
      return { titulo: segunda ? F.tituloSecundaria : F.tituloPrimaria,
        sub: segunda ? F.subSecundaria(esc(c.tacticas.find(x => x.id === t[0]).nombre)) : F.subPrimaria, html };
    }
    case "equipo0": case "equipo1": {          // equipo del comando: hasta 4 opciones
      const s = +paso.slice(-1), c = comandoPorId(eleccion.comando[s]), Q = T.equipo;
      const html = [[Q.seccionFaccion, equipoDeFaccion(c)], [Q.seccionUniversal, todoElEquipo(c).filter(e => !e.faccion)]]
        .filter(([, l]) => l.length).map(([t, l]) => `<div class="pant-grupo"><h3>${t}</h3>` + l.map(e => {
          const on = eleccion.equipo[s].includes(e.id);
          return opcion("eq:" + e.id, esc(Q.nombre[e.id]), `${esc(Q.desc[e.id])}${e.pendiente ? ` <em class="pant-pendiente">${Q.pendiente}</em>` : ""}`,
            { activa: on, deshabilitada: !on && eleccion.equipo[s].length >= MAX_EQUIPO });
        }).join("") + "</div>").join("");
      return { titulo: Q.titulo, sub: Q.sub(esc(c.nombre), eleccion.equipo[s].length, MAX_EQUIPO), html,
        principal: `<button class="pant-jugar" id="pantequipo">${eleccion.equipo[s].length ? Q.continuar : Q.sinEquipo}</button>` };
    }
    case "elegir0": case "elegir1": {          // armar el comando agente por agente
      const s = +paso.slice(-1), c = comandoPorId(eleccion.comando[s]), lista = eleccion.plantilla[s] || [];
      const v = validarComando(c, lista), comp = c.composicion || {};
      const elegidos = lista.length
        ? lista.map((k, i) => `<button class="pant-chip" data-v="rm:${i}" aria-label="${esc(I.quitar(c.agentes[k].nombre))}">${esc(c.agentes[k].nombre)} ✕</button>`).join("")
        : `<p class="pant-nota">${I.ningunoAun}</p>`;
      const disponibles = Object.entries(c.agentes).map(([k, a]) => {
        const veces = lista.filter(x => x === k).length, p = puedeAnadir(c, lista, k);
        const medio = pesoAgente(c, k) < 1 ? ` <small class="medio" title="${I.medioTitulo}">½</small>`
          : pesoAgente(c, k) > 1 ? ` <small class="medio" title="${I.dobleTitulo}">×2</small>` : "";
        return `<div class="pant-agente${veces ? " elegido" : ""}">
          <div class="pant-agente-info"><b>${esc(a.nombre)}${a.lider ? ` <small>${T.fichaDatos.lider}</small>` : ""}${medio}${veces ? ` <span class="pant-veces">×${veces}</span>` : ""}</b>
            <span>${I.statsCortas(a.move, a.apl, a.save, a.wounds)}${p.motivo === "unico" ? ` · <em>${I.soloUno}</em>` : p.motivo === "maximo" ? ` · <em>${p.grupo.min === 1 && p.grupo.max === 1 ? I.yaHayLider : I.alMaximo(p.grupo.plural || p.grupo.nombre, p.grupo.max)}</em>` : ""}</span></div>
          <button class="pant-ver" data-v="ver:${k}" aria-label="${esc(I.verFicha(a.nombre))}">👁</button>
          <button class="pant-mas" data-v="add:${k}"${p.ok ? "" : " disabled"} aria-label="${esc(I.anadir(a.nombre))}">＋</button></div>`;
      }).join("");
      const reglas = [I.reglas.selecciones(v.max), ...(comp.requiere || []).map(r => r.max === 1 && r.min === 1 ? I.reglas.unoSolo(r.nombre) : r.min === 0 ? I.reglas.maximoGrupo(r.plural || r.nombre, r.max) : I.reglas.requiere(r.nombre)),
        ...(comp.repetibles ? [I.reglas.unicos] : []), ...(comp.medio ? [I.reglas.medio] : []), ...(comp.doble ? [I.reglas.doble] : [])];
      const errores = lista.length ? v.errores.map(([t, x, y]) => I.error[t](t === "repetido" ? c.agentes[x].nombre : x, y)) : [];
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
      [0, 1].map(s => { const c = comandoPorId(eleccion.comando[s]), t = eleccion.tacticas[s];
        return c && c.tacticas && t[0] && t[1] ? `<dt>${T.tacticas.resumen(s)}</dt><dd>${esc(c.tacticas.find(x => x.id === t[0]).nombre)} · ${esc(c.tacticas.find(x => x.id === t[1]).nombre)}</dd>` : ""; }).join("") +
      `<dt>${I.rDespliegue}</dt><dd>${eleccion.despliegue === "azar" ? I.azar : I.turnos}</dd></dl>`,
      principal: `<button class="pant-jugar" id="pantjugar">${I.jugar}</button>` };
    case "listo": return { titulo: I.listoTitulo, sub: I.listoSub, html:
      `<p class="pant-nota">${I.opcionales}</p>` +
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
        return opcion("ardidT:" + n, esc(n), `${T.ardidDesc[n] ? esc(T.ardidDesc[n]) + "<br>" : ""}${usado ? E.ardidUsado : E.ardidCoste}`,
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
        // qué hace (si lo sabemos) y, para El destino es mi arma, los dados que guardó
        const desc = `${T.ardidDesc[n] ? esc(T.ardidDesc[n]) + "<br>" : ""}${usado ? E.ardidUsado : E.ardidCoste}` +
          (usado && n === ARDID.destino ? ` · ${T.destino.guardados(dadosGuardados(lado))}` : "");
        const op = opcion("ardid:" + n, esc(n), desc,
          { activa: usado, deshabilitada: !mio || (!usado && !puedeUsarArdid(tray.cp, tray.ardides || [[], []], lado, n)) });
        // Doctrina de combate: una vez usado, se elige la doctrina
        if (usado && n === ARDID.destino) {   // los dos dados: se lanzan con un botón y se ven en pantalla
          const d = dadosGuardados(lado);
          if (!d.length) return op + `<div class="pant-grupo">${opcion("destino:tirar", T.destino.lanzar, T.destino.lanzarDesc, { deshabilitada: !mio })}</div>`;
          return op + `<div class="pant-dados"><span class="eq${lado}">${T.destino.titulo} <b>${d[0]}</b></span><span class="eq${lado}"><b>${d[1]}</b></span></div>` +
            `<p class="pant-nota">${d[0] + d[1] < 9 ? T.destino.bajoNota : T.destino.altoNota}</p>`;
        }
        if (usado && n === ARDID.flexibles) {
          const c = comandoPorId(teamOf(lado) && teamOf(lado).id), prim = (tray.tacticas && tray.tacticas[lado] || [])[0];
          const ahora = tacticasDeBando(lado)[1];
          return op + (c && c.tacticas ? `<div class="pant-grupo"><h3>${T.tacticas.flexTitulo}</h3>` +
            c.tacticas.filter(x => x.id !== prim).map(x => opcion("flex:" + x.id, esc(x.nombre), "", { activa: ahora === x.id, deshabilitada: !mio })).join("") + "</div>" : "");
        }
        if (!(usado && n === ARDID.doctrina)) return op;
        return op + `<div class="pant-grupo"><h3>${T.doctrinas.titulo}</h3>` +
          DOCTRINAS.map(d => opcion("doc:" + d, esc(T.doctrinas[d]), "", { activa: doctrina(lado) === d, deshabilitada: !mio })).join("") + "</div>";
      }).join("");
      const ultimo = paso === "ardidesB";
      // El destino es mi arma ya elegido pero sin lanzar sus dos dados: no se sigue hasta lanzarlos
      const faltaLanzar = usados.includes(ARDID.destino) && !dadosGuardados(lado).length;
      return { titulo: `${E.titulo(tray.tp)} · ${E.ardidesTitulo}`,
        sub: mio ? E.ardidesSub(esc(bando(lado)), tray.cp[lado]) : E.esperaArdides(esc(TEAMNAME[lado])), html,
        principal: mio ? `<button class="pant-jugar" id="pantardidesok"${faltaLanzar ? " disabled" : ""}>${faltaLanzar ? T.destino.lanzaPrimero : ultimo ? E.aTiroteo : E.siguiente(esc(TEAMNAME[ordenArdides[1]]))}</button>` : "" };
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
  const c = contenido(), i = ORDEN.indexOf(/^(elegir|faccion|tacticas|equipo)/.test(paso) ? "plantilla" + paso.slice(-1) : paso);
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
      for (const y of mismos(s, lista[+n])) elegirOpcion(s, y, id);
      if (lista.every(y => elegido(s, y))) return trasFaccion(s);
      return render();
    }
    case "tacticas0": case "tacticas1": {      // primero la primaria, luego la secundaria
      const s = +paso.slice(-1), t = eleccion.tacticas[s], c = comandoPorId(eleccion.comando[s]), id = v.slice(2);
      if (!c.tacticas.some(x => x.id === id)) return;
      if (!t[0]) { t[0] = id; return render(); }
      if (id === t[0]) return;
      t[1] = id;
      return trasTacticas(s);
    }
    case "equipo0": case "equipo1": {
      const s = +paso.slice(-1), c = comandoPorId(eleccion.comando[s]);
      if (v.startsWith("eq:")) eleccion.equipo[s] = alternarEquipo(c, eleccion.equipo[s], v.slice(3));
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
      if (v === "destino:tirar") return lanzarDestino(ordenArdides[paso === "ardidesA" ? 0 : 1]);
      if (v.startsWith("flex:")) {          // Tácticas flexibles: la nueva secundaria
        const lado = ordenArdides[paso === "ardidesA" ? 0 : 1];
        if (!mayControl({ team: lado })) return;
        snapshot(); elegirFlexible(lado, v.slice(5));
        logLine(T.tacticas.logFlex(TEAMNAME[lado], v.slice(5)));
        renderAll(); return render();
      }
      if (v.startsWith("doc:")) {
        const lado = ordenArdides[paso === "ardidesA" ? 0 : 1];
        if (!mayControl({ team: lado })) return;
        snapshot(); elegirDoctrina(lado, v.slice(4));
        if (guerraDoctrinas(lado, v.slice(4))) logLine(T.doctrinas.guerra(TEAMNAME[lado]));
        logLine(T.doctrinas.log(TEAMNAME[lado], T.doctrinas[v.slice(4)].split(":")[0].toLowerCase()));
        renderAll(); return render();
      }
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
  tray.doctrina = [null, null]; tray.flex = [null, null]; tray.guerraPI = [null, null];
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
  idoloAncestrales(0); idoloAncestrales(1);   // Ídolo de los Ancestrales (Saurios de Lustria)
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
    if (n === ARDID.doctrina) { guerraDoctrinas(lado, null); elegirDoctrina(lado, null); }
    if (n === ARDID.flexibles) elegirFlexible(lado, null);
    logLine(T.estrategia.logDevuelto(TEAMNAME[lado], n));
    if (n === ARDID.destino) quitarDestino(lado);
  } else if (puedeUsarArdid(tray.cp, tray[clave], lado, n)) {
    usados.push(n); tray.cp[lado] -= COSTE_ARDID;
    if (n === ARDID.doctrina) { elegirDoctrina(lado, "devastadora"); if (guerraDoctrinas(lado, "devastadora")) logLine(T.doctrinas.guerra(TEAMNAME[lado])); }
    logLine(T.estrategia.logArdid(TEAMNAME[lado], n));
    // El destino es mi arma: los dos dados se lanzan después, con su botón (destino:tirar)
  }
  renderAll();
  render();
}
// Lanza los 2D6 de El destino es mi arma y los guarda para el tiroteo (se ven en la pantalla y en la caja de dados)
function lanzarDestino(lado) {
  if (!mayControl({ team: lado }) || dadosGuardados(lado).length) return;
  snapshot();
  const [x, y] = guardarDestino(lado, d6);
  showRoll([x, y], 0, lado, T.destino.titulo);
  logLine(T.destino.guarda(TEAMNAME[lado], x, y, x + y < 9));
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
async function aTiroteo() {
  cerrar();
  await ventanaInicioPI({ esDeLaIA, mayControl: s => mayControl({ team: s }) });   // Escudriñar las estrellas y Tambores de guerra (Saurios)
  renderAll();
  logLine(T.estrategia.logTiroteo(TEAMNAME[tray.ini]));
  hint(T.estrategia.tiroteo(TEAMNAME[tray.ini]));
  control.alEmpezarTiroteo();        // si la IA tiene la iniciativa, empieza ella (ia.js)
}

// Arma la partida con lo elegido y cierra las pantallas (en línea: antes, la de invitar).
function empezar() {
  ultimaEleccion = JSON.parse(JSON.stringify(eleccion)); partidaIniciada = true;   // para Reiniciar y para guardar
  control.ia = eleccion.modo === "ia" ? 1 : null;   // contra la computadora: la IA lleva el comando rival
  setOption("despliegue", eleccion.despliegue);
  setTeam(0, eleccion.comando[0] || null);
  setTeam(1, eleccion.comando[1] || null);
  // los agentes de cada bando: el comando de prueba con sus fichas reales (o fichas simples)
  // con sus elecciones de facción (5.º dato de cada agente)
  tray.tacticas = [0, 1].map(s => eleccion.tacticas[s][0] && eleccion.tacticas[s][1] ? [...eleccion.tacticas[s]] : null);
  tray.flex = [null, null]; tray.guerra = [[], []]; tray.guerraPI = [null, null];
  tray.equipoFaccion = [0, 1].map(s => separar(comandoPorId(eleccion.comando[s]), eleccion.equipo[s] || []).faccion);
  tray.equipoUniversal = [0, 1].map(s => separar(comandoPorId(eleccion.comando[s]), eleccion.equipo[s] || []).universal);
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
  partidaIniciada = false; ultimaEleccion = null;   // el menú principal: la partida anterior se abandona
  try { localStorage.removeItem(KEY_PARTIDA); } catch (e) {}
  Object.assign(eleccion, { modo: null, mapa: null, comando: [null, null], plantilla: [null, null], config: [null, null], faccion: [{}, {}], tacticas: [[null, null], [null, null]], equipo: [[], []], despliegue: null });
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

/* ---------- la partida en curso (guardado.js: recargar, Reiniciar y Salir) ---------- */
let partidaIniciada = false;
let ultimaEleccion = null;          // lo elegido en las pantallas de inicio, para Reiniciar
export const hayPartidaIniciada = () => partidaIniciada;
export const eleccionDeLaPartida = () => ultimaEleccion;
export function marcarPartida(e) { partidaIniciada = true; ultimaEleccion = e || null; }
const PASOS_GUARDABLES = ["iniciativa", "ardidesA", "ardidesB", "ardidesT", "listo"];
// La pantalla de la fase de estrategia abierta ahora (para volver a ella al recargar), o null
export function pantallaGuardable() {
  const el = pantalla();
  if (!el || el.hidden || !PASOS_GUARDABLES.includes(paso)) return null;
  return { paso, ordenArdides, ladoTiroteo, tirada };
}
export function restaurarPantalla(p) {
  const el = pantalla();
  if (!el || !p || !PASOS_GUARDABLES.includes(p.paso)) return;
  paso = p.paso; pila.length = 0;
  if (Array.isArray(p.ordenArdides)) ordenArdides = p.ordenArdides;
  if (p.ladoTiroteo === 0 || p.ladoTiroteo === 1) ladoTiroteo = p.ladoTiroteo;
  tirada = p.tirada || null;
  el.hidden = false;
  render();
}
// Reiniciar: la misma configuración, desde el principio
export function reiniciarPartida() {
  if (!ultimaEleccion) return abrirInicio();
  Object.assign(eleccion, JSON.parse(JSON.stringify(ultimaEleccion)));
  finMostrado = false;
  empezar();
  logLine(T.guardado.reiniciada);
}
// Salir: al menú principal, olvidando la partida
export function salirAlMenu() { abrirInicio(); }

// ¿Se muestra al abrir la app?
export function inicioAlAbrir() {
  try { if (localStorage.getItem(KEY_PARTIDA)) return false; } catch (e) {}   // hay una partida guardada: main.js la restaura
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
    if (b.id === "pantequipo") { const s = +paso.slice(-1); return ir(s === 0 ? "comando1" : "despliegue"); }
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
