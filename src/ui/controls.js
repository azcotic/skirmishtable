/**
 * Map loading (UI side), the map picker, tray buttons and the TTS import button.
 */
import { limpiarSilencio } from '../game/disparadores.js';
import { state } from '../state.js';
import { px } from '../engine/geometry.js';
import { FEATS } from '../engine/grid.js';
import { BH, BW, MAP, MAPS, OPS, TERRAIN, buildWorld, rosterDefs, scatterRoster } from '../engine/world.js';
import { convertGallowdark, convertVolkusBag, findVolkusBags, parseBSON } from '../import/tts.js';
import { buildStatic, renderAll, renderTray } from './board.js';
import { HINT0, hint, logEl, logLine, svg } from './dom.js';
import { T } from '../i18n/es.js';
import { reiniciarVista } from './vista2d.js';
import { PM_INICIALES, pmDelPI } from '../game/fases.js';
import { control } from './control.js';

// Qué pasa al empezar un punto de inflexión. Por defecto, reparte los PM según las reglas sin
// preguntar; inicio.js pone sus pantallas de fase de estrategia (iniciativa y ardides).
let alNuevoPI = () => { const g = pmDelPI(tray.tp, tray.ini); tray.cp[0] += g[0]; tray.cp[1] += g[1]; renderTray(); };
export const setAlNuevoPI = fn => { alNuevoPI = fn; };
import { anunciarDespliegue, modoDespliegue, prepararDespliegue } from './despliegue.js';
import { cancelMode, doUndo, reiniciarActivaciones, snapshot, tray, undoStack } from './panels.js';
import { build3DScene, setView, three, view3D } from '../view3d/table3d.js';
import { syncBases } from '../view3d/units.js';
import { RULES, RULESETS, fmtIn, setRuleset } from '../rules/index.js';
import { mayPlay, maySetUp, pump, requestUndo } from '../net/sync.js';
import { restartRecording } from '../net/replayer.js';

// online, only the host sets up the table and only the two players act
const REPLAYING = T.partida.viendoGrabacion;
const setupOnly = () => { if (maySetUp()) return false; hint(state.replay ? REPLAYING : T.partida.soloAnfitrion); return true; };
const playOnly = () => { if (mayPlay()) return false; hint(state.replay ? REPLAYING : T.partida.soloJugadores); return true; };



export function loadMap(keyOrMap) {
  buildWorld(typeof keyOrMap === "string" ? MAPS[keyOrMap] : keyOrMap, rosterDefs());   // the same operatives, fresh
  syncBases();                    // the new roster stands on its miniatures' bases
  // cómo empieza la partida (opción "Despliegue" en ⚙; ?deploy=zones|scatter en la dirección)
  const modo = modoDespliegue();
  if (modo === "azar") scatterRoster();
  else if (modo === "turnos") prepararDespliegue();
  reiniciarVista();               // mapa completo, en vertical u horizontal según la pantalla (vista2d.js)
  state.sel = null; state.target = null; state.lastShot = null; state.drag = null;
  undoStack.length = 0;
  restartRecording();             // a new table is a new game to record
  Object.assign(tray, {tp:1, cp:[PM_INICIALES, PM_INICIALES], vp:[0,0], ini:null, ardides:[[],[]]});
  cancelMode();
  buildStatic();
  renderAll();
  renderMapButtons();
  if (three) build3DScene();
  const walls = TERRAIN.filter(t => t.kind === "wall").length;
  const hatches = Math.round(TERRAIN.filter(t => t.hatch).length / 2);
  const deploy = MAP.dropEdge === "long" ? T.partida.despliegueLargo : T.partida.despliegueCorto(MAP.dropDepth || 6);
  document.getElementById("mapnote").textContent = MAP.fine
    ? T.partida.notaFina(MAP.name, BW, BH, deploy, FEATS.length - 1, MAP.source)
    : T.partida.notaMuros(MAP.name, BW, BH, deploy, walls, hatches, MAP.source);
  logLine(T.partida.zonaCargada(MAP.name, MAP.source));
  if (modo === "turnos") {
    if (view3D) setView(false);   // se despliega tocando el mapa 2D
    anunciarDespliegue();
  }
}
// Rules picker: switching rules restarts the current map (base size, climbing costs and
// movement change the routing data).
export function useRuleset(id, announce = true) {
  setRuleset(id);
  renderRuleButtons();
  if (announce) logLine(`<b>Rules:</b> ${RULES.name} — ${RULES.blurb}`);
  if (MAP) loadMap(MAP);
}
export function renderRuleButtons() {
  const box = document.getElementById("rulebtns");
  box.innerHTML = "";
  for (const r of Object.values(RULESETS)) {
    const b = document.createElement("button");
    b.className = "mini" + (RULES === r ? " active" : "");
    b.textContent = r.short;
    b.title = r.name;
    b.onclick = () => { if (RULES !== r && !setupOnly()) useRuleset(r.id); };
    box.appendChild(b);
  }
  document.getElementById("rulenote").textContent =
    `${RULES.name} · ${RULES.baseMm}mm bases · control range ${fmtIn(RULES.controlRange)}″ · ${RULES.blurb}`;
}
// Map picker: one compact row per family (Volkus 2024, Volkus 2025, Gallowdark, …)
function renderMapButtons() {
  const box = document.getElementById("mapbtns");
  box.innerHTML = "";
  const rows = new Map();
  for (const [key, m] of Object.entries(MAPS)) {
    if (!m) continue;
    const group = m.group || T.partida.importados;
    if (!rows.has(group)) {
      const row = document.createElement("div"); row.className = "maprow";
      const lab = document.createElement("span"); lab.className = "mapgroup"; lab.textContent = group;
      row.appendChild(lab); box.appendChild(row); rows.set(group, row);
    }
    const b = document.createElement("button");
    b.className = "mini" + (MAP === m ? " active" : "");
    b.textContent = m.short || m.name;
    b.title = m.name;
    b.onclick = () => { if (!setupOnly()) loadMap(key); };
    rows.get(group).appendChild(b);
  }
}
async function importTTSFile(file) {
  const buf = await file.arrayBuffer();
  let saveDoc;
  const dv = new DataView(buf);
  if (buf.byteLength > 5 && dv.getInt32(0, true) === buf.byteLength) saveDoc = parseBSON(buf);
  else saveDoc = JSON.parse(new TextDecoder().decode(buf));
  // Volkus first: a save can hold several Approved Ops layout bags — import them all
  const vbags = findVolkusBags(saveDoc);
  if (vbags.length) {
    let first = null, n = 0;
    for (const b of vbags.slice(0, 12)) {
      try {
        const key = "imp" + (n + 1);
        MAPS[key] = convertVolkusBag(b, b.Nickname || T.partida.importado(n + 1));
        n++; if (!first) first = key;
      } catch (e) {}
    }
    if (first) {
      loadMap(first);
      if (n > 1) logLine(T.partida.importVarios(n));
      return;
    }
  }
  const label = ((saveDoc && saveDoc.SaveName) || file.name || "TTS import").replace(/\.[^.]+$/, "");
  MAPS.import = convertGallowdark(saveDoc, label);
  loadMap("import");
}

// Wiring: event listeners and button handlers (called once from main.js).
export function wireControls() {

  /* ---------- tray buttons ---------- */
  document.getElementById("endtp").onclick = () => {
    if (playOnly()) return;
    snapshot();
    if (tray.tp >= 4) { logLine(T.partida.finBatalla); control.alFinBatalla("pi"); return; }
    tray.tp += 1; tray.ardides = [[], []]; tray.ardidesT = [[], []]; limpiarSilencio(tray); tray.destino = [null, null]; reiniciarActivaciones();
    OPS.forEach(o => { o.ready = true; o.ap = o.apl; o.used = []; o.disparadas = []; delete o.reacciono; delete o.reaccion; delete o.volo; delete o.psiPI; delete o.vetadas; delete o.grupo; delete o.gratisCorrer; delete o.tunicaTP; if (o.aplBase) { o.apl = o.aplBase; o.ap = o.apl; delete o.aplBase; } if (o.cuerno) { o.move -= 1; delete o.cuerno; } });
    logLine(T.partida.nuevoPI(tray.tp));
    renderAll();
    alNuevoPI();                  // fase de estrategia: iniciativa, PM y ardides (inicio.js)
  };
  document.getElementById("undo").onclick = () => { if (!playOnly() && !requestUndo()) doUndo(); };
  document.getElementById("reset").onclick = () => { if (setupOnly()) return; logEl.innerHTML = ""; loadMap(MAP); };
  document.getElementById("rulerbtn").onclick = () => {
    if (view3D && state.mode !== "ruler") setView(false);   // the ruler lives on the 2D map
    state.mode = state.mode === "ruler" ? null : "ruler"; state.rulerPts = [];
    hint(state.mode === "ruler" ? T.partida.regla : HINT0);
    renderAll();
  };
  for (const [id, team, key] of [["cpa",0,"cp"],["cpb",1,"cp"],["vpa",0,"vp"],["vpb",1,"vp"]]) {
    document.getElementById(id).style.cursor = "pointer";
    document.getElementById(id).title = T.partida.contadorTitulo;
    document.getElementById(id).onclick = ev => {
      if (playOnly()) return;
      tray[key][team] = Math.max(0, tray[key][team] + (ev.shiftKey ? -1 : 1)); renderTray(); pump();
    };
  }
  document.getElementById("importbtn").onclick = () => { if (!setupOnly()) document.getElementById("importfile").click(); };
  document.getElementById("importfile").addEventListener("change", async ev => {
    const f = ev.target.files && ev.target.files[0];
    if (!f) return;
    try { await importTTSFile(f); }
    catch (e) {
      logLine(T.partida.importFallo(String(e && e.message || e)));
      hint(T.partida.importNoLeido);
    }
    ev.target.value = "";
  });
}
