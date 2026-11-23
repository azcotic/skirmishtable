/**
 * La partida sobrevive a recargar la página: se guarda sola en este navegador (localStorage) cada
 * vez que algo cambia y se restaura al abrir la app. Más el menú ⚙: Reiniciar partida (la misma
 * configuración, desde el principio) y Salir (al menú principal, olvidando la partida).
 *
 * Se guarda lo que hace falta para seguir jugando: la mesa (mapa, agentes con todo lo que llevan),
 * el marcador (PI, PM, PV, ardides, tácticas…), las miniaturas elegidas, la misión, quién lleva la
 * computadora y, si estabas en una pantalla de la fase de estrategia, cuál. No se guarda en línea
 * ni al ver una grabación. Es la misma máquina, así que no pasa por los limpiadores de la red.
 */
import { T } from '../i18n/es.js';
import { state } from '../state.js';
import { MAP, MAPS, OPS, ajustarAgente } from '../engine/world.js';
import { RULES } from '../rules/index.js';
import { control } from './control.js';
import { tray } from './panels.js';
import { loadMap } from './controls.js';
import { opsState, setOpsState } from './ops.js';
import { renderAll } from './board.js';
import { renderMinis } from './minis.js';
import { hint } from './dom.js';
import { minis, setMinisSides, syncBases } from '../view3d/units.js';
import { leaveGame, online } from '../net/sync.js';
import { KEY_PARTIDA, eleccionDeLaPartida, hayPartidaIniciada, marcarPartida, pantallaGuardable,
  reiniciarPartida, restaurarPantalla, salirAlMenu } from './inicio.js';

const V = 1;
let timer = null;

// Se llama tras cada cambio de la mesa (net/sync.js, pump): guarda una vez que se calma
export function programarGuardado() {
  if (!hayPartidaIniciada()) return;
  clearTimeout(timer);
  timer = setTimeout(guardarAhora, 300);
}

export function guardarAhora() {
  timer = null;
  if (!hayPartidaIniciada() || online() || state.replay) return;
  try {
    const mapa = Object.keys(MAPS).find(k => MAPS[k] === MAP) || null;
    if (!mapa) return;
    localStorage.setItem(KEY_PARTIDA, JSON.stringify({
      v: V, at: Date.now(), rules: RULES.id, map: mapa, mapDef: /^imp/.test(mapa) ? MAPS[mapa] : undefined,
      ops: OPS, tray, minis: minis.sides, mission: opsState, ia: control.ia,
      eleccion: eleccionDeLaPartida(), pantalla: pantallaGuardable(),
    }));
  } catch (e) { /* ventana privada o sin espacio: simplemente no se recuerda */ }
}

// Al abrir la app: vuelve la partida guardada. true si se restauró.
export function restaurarPartida() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY_PARTIDA)); } catch (e) { return false; }
  if (!s || s.v !== V || !Array.isArray(s.ops) || !s.ops.length || typeof s.map !== "string" || s.rules !== RULES.id) return false;
  try {
    if (/^imp/.test(s.map)) { if (!s.mapDef) return false; MAPS[s.map] = s.mapDef; }
    if (!MAPS[s.map]) return false;
    if (s.minis && Array.isArray(s.minis.sides || s.minis)) setMinisSides(s.minis);
    loadMap(s.map);                                     // la mesa y el terreno; lo demás se pone encima
    OPS.splice(0, OPS.length, ...s.ops.map(o => ajustarAgente(o)));
    Object.assign(tray, s.tray);
    if (s.mission) setOpsState(s.mission);
    control.ia = s.ia === 0 || s.ia === 1 ? s.ia : null;
    marcarPartida(s.eleccion || null);
    syncBases();
    state.sel = null; state.target = null; state.lastShot = null;
    renderMinis(); renderAll();
    if (s.pantalla) restaurarPantalla(s.pantalla);
    hint(T.guardado.restaurada);
    return true;
  } catch (e) {
    console.warn("SkirmishTable: no se pudo restaurar la partida guardada", e);
    try { localStorage.removeItem(KEY_PARTIDA); } catch (e2) {}
    return false;
  }
}
export function olvidarPartida() { try { localStorage.removeItem(KEY_PARTIDA); } catch (e) {} }

// Botones del menú ⚙: Reiniciar partida y Salir al menú principal
export function wireMenuPartida() {
  const dlg = document.getElementById("options"), re = document.getElementById("reiniciarpartida"), sa = document.getElementById("salirpartida");
  if (!dlg || !re || !sa) return;
  const mostrar = () => { re.hidden = online() || !hayPartidaIniciada(); sa.hidden = !hayPartidaIniciada() && !online(); };
  document.getElementById("optionsbtn").addEventListener("click", mostrar);
  re.onclick = () => {
    if (!confirm(T.guardado.confirmarReiniciar)) return;
    dlg.close(); reiniciarPartida();
  };
  sa.onclick = () => {
    if (!confirm(T.guardado.confirmarSalir)) return;
    dlg.close();
    if (online()) leaveGame();
    salirAlMenu();
  };
}
