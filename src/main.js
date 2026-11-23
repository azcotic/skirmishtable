/**
 * Boot: registers the built-in maps, wires the UI, picks the Kill Team rules, loads the
 * default killzone and opens the 3D table.
 */
import './styles.css';
import * as world from './engine/world.js';
import * as grid from './engine/grid.js';
import * as movement from './engine/movement.js';
import * as sight from './engine/sight.js';
import { state } from './state.js';
import { renderAll } from './ui/board.js';
import { loadMap, useRuleset, wireControls } from './ui/controls.js';
import { logLine } from './ui/dom.js';
import { renderMinis } from './ui/minis.js';
import { mayControl, mayPlay, maySetUp, net, online, wireNet } from './net/sync.js';
import { diceTrays, wireDice } from './ui/dicetray.js';
import { wireDiceBox } from './ui/dicebox.js';
import { wireOps } from './ui/ops.js';
import { wireHud } from './ui/hud.js';
import { wireStatusCards } from './ui/statuscards.js';
import { wireShare } from './net/share.js';
import { wireReplay } from './net/replayer.js';
import { wireInput } from './ui/input.js';
import { wireOpMenu } from './ui/opmenu.js';
import { wireThreatPicker } from './ui/threat.js';
import { wireOptions } from './ui/options.js';
import { wireSidePanel } from './ui/sidepanel.js';
import * as table3d from './view3d/table3d.js';
import * as rules from './rules/index.js';
import { minis, onMinisChange } from './view3d/units.js';
import { TTS_TEAMS } from './data/tts-teams.js';
import { aplicarTextos } from './i18n/aplicar.js';
import { T } from './i18n/es.js';

aplicarTextos();                 // textos de index.html desde src/i18n/es.js
wireInput();
wireOpMenu();
wireHud();
wireControls();
table3d.wireViewToggle();
wireThreatPicker(() => renderAll());
wireOptions();
wireSidePanel();
onMinisChange(bases => { if (bases) { renderAll(); renderMinis(); } });   // a model measured: rings, reach and fit follow its base

/* ---------- go ---------- */
world.initMaps();
useRuleset("killteam", false);
loadMap("v1");
for (const l of T.partida.bienvenida) logLine(l);
renderAll();
renderMinis();
wireDice(side => mayPlay() && (!online() || net.seat === side));   // a dice box per side: online, roll in your own
wireDiceBox();
wireOps(side => mayControl({ team: side }), maySetUp);   // online: your own side's ops; the host sets the mission
wireStatusCards();
wireNet();                      // host or join if the address says so (#host= / #room=)
wireShare();                    // or open a shared snapshot (#game=)
wireReplay();                   // record this game; or open a replay (#replay=)
if (window.THREE && THREE.OrbitControls) table3d.setView(true);   // the 3D table is the default view

// Debug/test handle: live views of the engine modules and UI state, for the browser
// console and the Playwright tests (e.g. skirmishtable.movement.findPath(...)).
window.skirmishtable = { world, grid, movement, sight, rules, table3d, state, loadMap, useRuleset, renderAll, diceTrays, minis, teams: TTS_TEAMS };
