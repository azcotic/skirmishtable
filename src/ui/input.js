/**
 * Pointer input: drag-to-move planner, clicks, targeting and order toggles. The 2D
 * board and the 3D table share it: each view turns pointer positions into board
 * inches (setBoardPicker) and hands token presses to armDrag / clickOp.
 */
import { state } from '../state.js';
import { CTRL, S } from '../config.js';
import { dist, opGap, opR } from '../engine/geometry.js';
import { chopIncrements, clampPath, nearestFree, opLayer, placeBlocked, planRoute, useBase } from '../engine/movement.js';
import { C_WALL, G, GRES, LEVELS, layerZ, onLayer, ptFree } from '../engine/grid.js';
import { foesNear } from '../engine/engage.js';
import { BH, BW, MAP, OPS } from '../engine/world.js';
import { RULES, fmtIn, moveSpec } from '../rules/index.js';
import { renderAll, renderOverlay } from './board.js';
import { HINT0, hint, logLine, svg } from './dom.js';
import { T } from '../i18n/es.js';
import { lienzo } from './dom.js';
import { colocarEn, despliegueActivo } from './despliegue.js';
import { porQueNoActua } from './turno.js';
import { cancelMode, defaultMoveType, refreshSight, registrarMovimiento, snapshot, toggleOrder } from './panels.js';
import { mayControl } from '../net/sync.js';
import { cancelMarker, placeMarkerAt } from './ops.js';
import { openOpMenu } from './opmenu.js';
import { effMove } from '../engine/dice.js';
import { tieneEfecto } from '../data/teams/index.js';
import { puede } from '../game/acciones.js';
import { accionesHooks } from './acciones.js';
import { ganchos } from './saurios-plan.js';

/* ---------- Recolocación libre (Formaciones Eterna y Acechadora de los Saurios de Lustria) ----------
 * state.recolocar = { id, max, lejos }: el agente se arrastra hasta max pulgadas, sin gastar PA ni contar como
 * acción, y si lejos, debe quedar a más de esas pulgadas de los enemigos. Se gasta al soltarlo; Esc la omite. */
ganchos.recolocar = ({ op, max, lejos }) => {
  state.recolocar = { id: op.id, max, lejos };
  state.sel = op; state.target = null;
  hint(T.saurios.pista(op.name, max, lejos));
  renderAll();
};
function planLibre(d, gx, gy, gl) {
  const op = d.op, R = opR(op), rc = state.recolocar;
  d.libre = true;
  const raw = planRoute(op, gx, gy, 0, -1, rc.max, false, gl);
  if (!raw) { d.path = null; d.goal = [gx, gy]; d.total = 0; d.valid = false; d.why = "blocked"; d.foes = []; renderOverlay(); return; }
  const c = clampPath(raw, rc.max), end = c.path[c.path.length - 1];
  d.path = c.path; d.total = c.total; d.goal = [end[0], end[1]]; d.clamped = c.clamped; d.partial = !!raw.partial;
  d.goalLayer = end[4] || 0; d.goalZ = layerZ(d.goalLayer);
  d.p1 = {type: "reposition", allow: rc.max, climb: false}; d.p2 = null;
  d.primAllow = rc.max; d.secondary = null; d.secAllow = 0; d.autoCharge = false;
  d.foes = foesNear(end[0], end[1], op.team, op.id, R, d.goalZ);
  const aqui = {...op, x: end[0], y: end[1]};
  d.why = placeBlocked(end[0], end[1], op.id, d.goalLayer) ? "occupied"
    : d.foes.length ? "libreEnZona"
    : rc.lejos && OPS.some(o => o.alive && o.team !== op.team && o.deployed !== false && opGap(aqui, o) <= rc.lejos + 1e-9) ? "libreCerca"
    : null;
  d.valid = !d.why;
  renderOverlay();
}
function aterrizarLibre(d) {
  snapshot();
  d.op.x = d.goal[0]; d.op.y = d.goal[1]; d.op.z = d.goalZ || 0;
  state.recolocar = null;
  logLine(T.saurios.recoloca(d.op.name, d.total));
  hint(HINT0);
  renderAll();
}

/* ---------- Vuelo inmaterial (don de Tzeentch) ----------
 * Una vez por punto de inflexión, al Reposicionarse o Cargar, el agente puede volar: en vez de
 * caminar, se levanta y se coloca en línea recta a no más de su Movimiento (también al Cargar:
 * sin las 2″ extra), sin importar el terreno. Tiene que caber donde aterriza y, salvo que cargue,
 * no puede terminar en la zona de control de un enemigo. En Gallowdark (combate en espacios
 * cerrados) no puede volar a través de muros.
 * state.volar = id del agente que va a volar en su próximo arrastre (botón 🪽).
 */
export const puedeVolar = op => !!op && op.alive && op.ready && !op.volo && tieneEfecto(op, "vuelo")
  && mayControl(op) && !porQueNoActua(op) && (puede(op, "reposition", OPS).ok || puede(op, "charge", OPS).ok);
accionesHooks.volar = () => puedeVolar(state.sel);
accionesHooks.volando = () => !!state.sel && state.volar === state.sel.id;
// ¿Cruza la línea recta algún muro? Solo en mapas de espacios cerrados (Gallowdark)
function cruzaMuro(x1, y1, x2, y2) {
  if (!G || !MAP || MAP.group !== "Gallowdark") return false;
  const n = Math.ceil(dist(x1, y1, x2, y2) / (GRES / 2));
  for (let s = 1; s < n; s++) {
    const x = x1 + (x2 - x1) * s / n, y = y1 + (y2 - y1) * s / n;
    const i = Math.floor(x / GRES), j = Math.floor(y / GRES);
    if (i >= 0 && j >= 0 && i < G.nx && j < G.ny && G.cls[j * G.nx + i] === C_WALL) return true;
  }
  return false;
}
function planVuelo(d, gx, gy, gl, charging) {
  const op = d.op, R = opR(op), max = op.reaccion ? Math.min(2, effMove(op)) : effMove(op);
  const tipo = charging ? "charge" : "reposition";
  let ex = gx, ey = gy;
  const lejos = dist(op.x, op.y, ex, ey);
  if (lejos > max) {                                // más lejos que su Movimiento: hasta donde llega
    ex = op.x + (ex - op.x) * max / lejos; ey = op.y + (ey - op.y) * max / lejos;
    const s = nearestFree(ex, ey, op.id, gl);
    if (s) [ex, ey] = s;
  }
  const total = dist(op.x, op.y, ex, ey);
  d.path = [[op.x, op.y, 0, 0, opLayer(op)], [ex, ey, 0, 0, gl]];
  d.total = total; d.goal = [ex, ey]; d.clamped = lejos > max; d.partial = false;
  d.goalLayer = gl; d.goalZ = layerZ(gl);
  d.p1 = { type: tipo, allow: max, climb: false }; d.p2 = null;
  d.primAllow = max; d.secondary = null; d.secAllow = 0; d.autoCharge = false; d.vuelo = true;
  d.foes = foesNear(ex, ey, op.team, op.id, R, d.goalZ);
  d.why = !puede(op, tipo, OPS).ok ? "vueloNoPuede"
    : total > max + 1e-6 ? "vueloLejos"
    : placeBlocked(ex, ey, op.id, gl) ? "occupied"
    : cruzaMuro(op.x, op.y, ex, ey) ? "vueloMuro"
    : charging && !d.foes.length ? "chargeNoFoe"
    : !charging && d.foes.length ? "vueloEnZona"
    : null;
  d.valid = !d.why;
  renderOverlay();
}
export function wireVuelo() {
  const b = document.getElementById("volarsel");
  if (!b) return;
  b.onclick = () => {
    if (!puedeVolar(state.sel)) return;
    state.volar = state.volar === state.sel.id ? null : state.sel.id;
    hint(state.volar ? T.mover.vueloPista(effMove(state.sel)) : T.mover.vueloCancelado);
    renderAll();
  };
}

function svgPoint(ev) {
  const pt = new DOMPoint(ev.clientX, ev.clientY);
  const p = pt.matrixTransform((lienzo.g || svg).getScreenCTM().inverse());   // con el giro y el zoom del mapa 2D
  return [p.x / S, p.y / S];
}
// screen -> board inches for the active view (null = off the board)
let pickBoard = svgPoint;
export function setBoardPicker(fn) { pickBoard = fn || svgPoint; }

// Double-click an operative to flip its order (Conceal <-> Engage). Detected
// manually by oid + timestamp: the first click re-renders the tokens, so the
// browser's native dblclick never fires on the replaced node.
let lastTokenClick = {oid: null, t: 0};

const measuring = () => T.mover.medida(RULES.increment);

// pointerdown on a token: arm a drag (it activates once the pointer moves a little)
export function armDrag(op, ev, from3d = false) {
  if (!op || !op.alive || state.mode === "ruler" || state.mode === "target" || despliegueActivo()) return false;
  if (state.recolocar && state.recolocar.id !== op.id) state.recolocar = null;
  state.drag = {op, sx: op.x, sy: op.y, cx0: ev.clientX, cy0: ev.clientY, pid: ev.pointerId, from3d,
                goal: null, path: null, total: 0, valid: false, active: false};
  return true;
}

// Candidate plans: the available move actions in either order. A climb is only legal
// while the inches being spent belong to a move the ruleset lets climb, wherever that
// move sits in the plan — so if a climb won't fit with the main move first, the planner
// tries the secondary move first and saves the main move for the climb (arriving at
// the wall early burns the spare inches as "wait").
function plansFor(op, type = state.moveType) {
  const M = RULES.moves, used = t => op.used.includes(t);
  // reaccionando, no mueve más de 2″ (Reglas breves)
  const phase = (type, spec) => ({type, allow: op.reaccion ? Math.min(2, spec.allow(op)) : spec.allow(op), climb: spec.climb});
  const prim = phase("reposition", M.primary), sec = phase("dash", M.secondary);
  const plan = (p1, p2) => {
    const cap = p1.allow + (p2 ? p2.allow : 0);
    let lo = 0, hi = -1;                              // the climbing window, in inches from the start
    if (p1.climb && (!p2 || p2.climb)) hi = cap;
    else if (p1.climb) hi = p1.allow;
    else if (p2 && p2.climb) { lo = p1.allow; hi = cap; }
    return {p1, p2, lo, hi, cap};
  };
  // reaccionando: una sola acción, sin encadenar un segundo movimiento
  if (op.reaccion) {
    const spec = type === "dash" ? M.secondary : type === "charge" && M.charge ? M.charge : M.primary;
    return [plan(phase(type === "fallBack" ? "reposition" : type, spec), null)];
  }
  const primAvail = !used("reposition") && !used("charge"), secAvail = !used("dash");
  if (type === "charge" && M.charge) return [plan(phase("charge", M.charge), null)];
  // Retroceder: el movimiento del agente (2 PA); puede salir de la zona de control donde empieza
  if (type === "fallBack") return [plan(phase("fallBack", M.primary), null)];
  if (type === "dash") return primAvail ? [plan(sec, prim)] : [plan(sec, null)];
  return secAvail ? [plan(prim, sec), plan(sec, prim)] : [plan(prim, null)];
}

// A Charge can't share an activation with another move (and isn't repeated).
const mayCharge = op => !!RULES.moves.charge && !["reposition", "dash", "charge"].some(t => op.used.includes(t));

// Which layer a drag at (gx, gy) is aiming for: `hint` when the view knows (the 3D table
// picks the surface under the pointer: an upper floor or the table), else the layer the
// operative stands on if its base fits there, else the highest that fits. up (Shift on
// the 2D map, where a floor hides the ground under it) = the highest that fits.
function goalLayer(op, gx, gy, hint, up) {
  if (hint !== undefined && hint !== null) return hint;
  const fits = [0, ...LEVELS.map(L => L.l)].filter(l => onLayer(l, () => ptFree(gx, gy)));
  const here = opLayer(op), top = fits.reduce((a, l) => layerZ(l) > layerZ(a) ? l : a, fits[0] ?? here);
  return up ? top : fits.includes(here) ? here : top;
}
// re-plan the active drag towards board point (x, y) (on layer hint, if the view says)
function planDrag(x, y, hint, up) {
  const d = state.drag, R = opR(d.op);
  useBase(R);                                       // route, fit and collide this operative's own base
  let gx = Math.min(BW - R, Math.max(R, x));
  let gy = Math.min(BH - R, Math.max(R, y));
  const gl = goalLayer(d.op, gx, gy, hint, up);
  // pointing into terrain or another base: land pressed up against it instead
  const snap = nearestFree(gx, gy, d.op.id, gl), free = !!snap;
  if (snap) [gx, gy] = snap;
  // Engagement range: a normal move can't go within control range of an enemy (planRoute
  // routes round it), so dragging there turns the move into a Charge (Move + 2″, 1AP) when
  // one is allowed. A Charge may enter one enemy's control range, then has to stay in it.
  const intoFoes = foesNear(gx, gy, d.op.team, d.op.id, R, layerZ(gl)).length > 0;
  const retroceso = state.moveType === "fallBack";
  const charging = !retroceso && (state.moveType === "charge" || (intoFoes && mayCharge(d.op)));
  d.autoCharge = charging && state.moveType !== "charge";
  if (state.recolocar && state.recolocar.id === d.op.id) return planLibre(d, gx, gy, gl);   // Formación de los Saurios
  // Vuelo inmaterial: en línea recta, sin rodear el terreno (solo Reposicionarse o Cargar)
  if (state.volar === d.op.id && puedeVolar(d.op) && !retroceso && (charging || state.moveType !== "dash")) {
    return planVuelo(d, gx, gy, gl, charging);
  }
  const plans = plansFor(d.op, charging ? "charge" : state.moveType);
  let bestPlan = null;
  if (free) for (const pl of plans) {
    const raw = planRoute(d.op, gx, gy, pl.lo, pl.hi, pl.cap, pl.p1.type === "charge", gl);
    if (!raw) continue;
    if (pl.p2) raw.split = pl.p1.allow;             // each move action gets its own free drop
    const c = clampPath(raw, pl.cap);
    const end = c.path[c.path.length - 1];
    const reach = !c.clamped && !raw.partial;
    const gapd = dist(end[0], end[1], gx, gy);
    if (!bestPlan
        || (reach && !bestPlan.reach)
        || (reach === bestPlan.reach && (reach ? c.total < bestPlan.c.total - 1e-9 : gapd < bestPlan.gapd - 1e-9)))
      bestPlan = {pl, c, reach, gapd, partial: !!raw.partial};
  }
  if (bestPlan) {
    const {pl, c, partial} = bestPlan;
    const end = c.path[c.path.length - 1];
    d.path = c.path; d.total = c.total; d.goal = [end[0], end[1]]; d.clamped = c.clamped; d.partial = partial;
    d.goalLayer = end[4] || 0; d.goalZ = layerZ(d.goalLayer);
    d.p1 = pl.p1; d.p2 = pl.p2;
    d.primAllow = pl.p1.allow;
    d.secondary = pl.p2 ? pl.p2.type : null;
    d.secAllow = pl.p2 ? pl.p2.allow : 0;
    d.foes = foesNear(end[0], end[1], d.op.team, d.op.id, R, d.goalZ);
    d.why = placeBlocked(end[0], end[1], d.op.id, d.goalLayer) ? "occupied"
      : charging && !d.foes.length ? "chargeNoFoe"
      : retroceso && (d.foes.length || intoFoes) ? "fallBackEnZona"
      : !charging && (d.foes.length || intoFoes) && RULES.moves.charge ? "engagedAfterMove"
      : null;
    d.valid = !d.why;
  } else {
    d.path = null; d.goal = [gx, gy]; d.total = 0; d.clamped = false; d.valid = false; d.partial = false;
    d.goalLayer = gl; d.goalZ = layerZ(gl);
    d.foes = []; d.why = "blocked";
    d.p1 = plans[0].p1; d.p2 = plans[0].p2;
    d.primAllow = plans[0].p1.allow; d.secondary = null; d.secAllow = 0;
  }
  renderOverlay();
}

// Mover un agente sin arrastrarlo (la IA): planifica la ruta a (x, y) como un arrastre y la
// aplica igual (PA, registro, deshacer). tipo: reposition, dash o charge. true si se movió.
export function moverA(op, x, y, tipo) {
  state.sel = op; state.moveType = tipo;
  state.drag = { op, sx: op.x, sy: op.y, cx0: 0, cy0: 0, pid: -1, from3d: false,
                 goal: null, path: null, total: 0, valid: false, active: true };
  planDrag(x, y, 0, false);
  const d = state.drag;
  state.drag = null;
  if (!d || !d.valid || !d.path) { renderAll(); return false; }
  landDrag(d);
  return true;
}

// pointerup after an active drag: land the operative and log the move
function landDrag(d) {
  if (!d.valid || !d.path || !d.goal) {
    hint(d.why && d.why !== "blocked" && d.why !== "occupied"
      ? T.mover.sinLlegada(T.mover.motivo[d.why])
      : T.mover.sinLlegadaBloqueado);
    renderAll(); return;
  }
  if (d.libre) return aterrizarLibre(d);
  const chained = d.total > d.primAllow + 1e-9 && d.p2;
  const repeat = d.op.used.includes(d.p1.type) || (chained && d.op.used.includes(d.p2.type));
  const vert = chopIncrements(d.path).filter(st => st.climb);
  snapshot();
  registrarMovimiento(d.op, chained ? [d.p1.type, d.p2.type] : [d.p1.type]);
  d.op.x = d.goal[0]; d.op.y = d.goal[1]; d.op.z = d.goalZ || 0;
  const charged = d.p1.type === "charge";
  if (charged && RULES.orders && d.op.order === "conceal") {   // only an operative on Engage may charge
    d.op.order = "engage";
    logLine(T.orden.pasaATrabarse(d.op.name));
  }
  const libre = d.p1.type === "dash" && d.op.gratisCorrer && !chained;   // Plan caprichoso
  if (libre) delete d.op.gratisCorrer; else d.op.ap -= d.p1.type === "fallBack" || chained ? 2 : 1;   // Retroceder cuesta 2 PA
  if (d.vuelo) { d.op.volo = true; state.volar = null; logLine(T.mover.vuela(d.op.name)); }
  d.op.used.push(d.p1.type);
  if (chained) d.op.used.push(d.p2.type);
  const TM = T.mover;
  const climbNote = vert.length ? TM.incluye(vert.map(st => st.kind === "up"
      ? TM.trepaSube(st.climb, st.level.name, st.up)
      : st.kind === "drop" ? TM.trepaBaja(st.climb, st.level.name, st.down)
      : TM.trepaCruza(st.climb, st.up, st.down))) : "";
  const notas = climbNote + (repeat ? TM.repetida : "");
  logLine(chained
    ? TM.logDoble(d.op.name, d.p1.type, d.primAllow, d.p2.type, d.total - d.primAllow, notas)
    : TM.log(d.op.name, d.p1.type, d.total, d.primAllow, notas));
  const enemies = OPS.filter(o => o.alive && o.team !== d.op.team && opGap(d.op, o) <= CTRL + 1e-9);
  if (enemies.length) logLine(TM.enZona(d.op.name, enemies.map(e => e.name)));
  // auto-advance to the other movement of the activation: main move ①, then secondary ②
  const M = RULES.moves;
  const slot1Used = d.op.used.includes("reposition") || d.op.used.includes("charge");
  if (charged) {
    state.moveType = "reposition";
    hint(TM.cargo(d.op.name, enemies.map(e => e.name)));
  } else if (state.moveType !== "dash" && !d.op.used.includes("dash")) {
    state.moveType = "dash";
    hint(TM.quedaMov2(d.op.name, M.secondary.allow(d.op)));
  } else if (state.moveType === "dash" && !slot1Used) {
    state.moveType = "reposition";
    hint(TM.quedaMov1(d.op.name, M.primary.allow(d.op)));
  } else {
    hint(TM.ambosUsados(d.op.name));
  }
  renderAll();
}

// a click (or tap) on a token: order flip on double-click, targeting, or selection
export function clickOp(oid, sinDoble = false) {
  const now = performance.now();
  if (!sinDoble && lastTokenClick.oid === oid && now - lastTokenClick.t < 400) {
    lastTokenClick = {oid: null, t: 0};
    if (RULES.orders) toggleOrder(oid);
    return;
  }
  lastTokenClick = {oid, t: now};
  const o = OPS.find(z => z.id === oid);
  if (!o || !o.alive) return;
  if (state.sel && o.team !== state.sel.team && (state.mode === "target" || state.mode === null)) {
    state.target = o; refreshSight(); renderAll();
    if (state.mode === "target") hint(T.seleccion.evaluado);
    return;
  }
  state.sel = o; state.target = null; state.lastShot = null; state.moveType = defaultMoveType(o); cancelMode();
  hint(T.seleccion.elegido(o.name, !!RULES.orders));
  renderAll();
}

// Open an operative's right-click menu. A long press arms a drag first: drop it.
export function opMenuAt(op, ev) {
  if (!op) return;
  if (state.drag && !state.drag.active) state.drag = null;
  openOpMenu(op, ev.clientX, ev.clientY);
}

// Wiring: event listeners and button handlers (called once from main.js).
export function wireInput() {
  svg.addEventListener("pointermove", ev => {
    if (state.mode === "ruler" && state.rulerPts.length === 1) renderOverlay(svgPoint(ev));
  });
  /* drag to move — Pointer Events, so mouse, touch and pen all work: pointerdown on a
     token arms a drag; moving past a small threshold activates it; the path auto-routes
     around terrain; pointerup lands the operative. Token groups set touch-action:none
     so the browser doesn't turn the gesture into a page scroll. */
  svg.addEventListener("pointerdown", ev => {
    if (!ev.isPrimary || ev.button !== 0) return;
    const gEl = ev.target.closest && ev.target.closest("[data-oid]");
    if (!gEl) return;
    if (armDrag(OPS.find(o => o.id === gEl.getAttribute("data-oid")), ev)) ev.preventDefault();
  });
  // Chrome ignores touch-action on SVG shapes, so a finger on a token would scroll the page
  // (and cancel the drag). Once a token has armed a drag, stop the touch from panning.
  for (const type of ["touchstart", "touchmove"]) svg.addEventListener(type, ev => {
    if (state.drag && !state.drag.from3d && ev.cancelable) ev.preventDefault();
  }, {passive: false});
  window.addEventListener("pointermove", ev => {
    const d = state.drag;
    if (!d || ev.pointerId !== d.pid) return;
    if (!d.active) {
      if (Math.hypot(ev.clientX - d.cx0, ev.clientY - d.cy0) < 6) return;
      if (!mayControl(d.op)) {     // online: not yours to move; letting go still counts as a tap
        hint(T.mover.deOtro(d.op.name)); return;
      }
      const noActua = state.recolocar && state.recolocar.id === d.op.id ? null : porQueNoActua(d.op);   // activaciones alternas: no es su turno, u otro está activándose
      if (noActua) { hint(noActua); return; }
      d.active = true;
      if (state.sel !== d.op) { state.sel = d.op; state.target = null; state.lastShot = null; state.moveType = defaultMoveType(d.op); }
      hint(T.mover.soltar(d.op.name, moveSpec(state.moveType) ? state.moveType : "reposition", measuring(), RULES.moves.charge ? CTRL : 0, LEVELS.length && !d.from3d));
      renderAll();
    }
    const p = pickBoard(ev);
    if (p) planDrag(p[0], p[1], p[2], ev.shiftKey);
  });
  window.addEventListener("pointerup", ev => {
    const d = state.drag;
    if (!d || ev.pointerId !== d.pid) return;
    state.drag = null;
    if (!d.active) {
      // un toque. Con ratón, el clic del mapa 2D se encarga. En pantallas táctiles (y con lápiz) el
      // navegador no manda el clic: arriba se cancela touchstart para que la página no se desplace
      // mientras arrastras, y eso también lo anula. Así que el toque se resuelve aquí, y si el clic
      // llega de todos modos se ignora para no contarlo dos veces.
      // Con ratón también: si la ficha se redibuja entre apretar y soltar, el clic llega sin saber cuál era y no selecciona.
      if (d.from3d) clickOp(d.op.id);
      else {
        clickOp(d.op.id);
        state.suppressClick = true; setTimeout(() => { state.suppressClick = false; }, 400);
      }
      return;
    }
    state.suppressClick = true; setTimeout(() => { state.suppressClick = false; }, 0);
    landDrag(d);
  });
  // a cancelled touch (system gesture, notification shade) abandons the move cleanly
  window.addEventListener("pointercancel", ev => {
    if (!state.drag || ev.pointerId !== state.drag.pid) return;
    const wasActive = state.drag.active;
    state.drag = null;
    if (wasActive) { hint(T.mover.cancelado); renderAll(); }
  });
  svg.addEventListener("click", ev => {
    if (state.suppressClick) return;
    const [x, y] = svgPoint(ev);
    if (state.mode === "marker" && placeMarkerAt(x, y)) return;
    if (state.mode === "ruler") {
      if (state.rulerPts.length >= 2) state.rulerPts = [];
      state.rulerPts.push([x, y]);
      renderOverlay([x, y]);
      return;
    }
    const oid = ev.target.closest && ev.target.closest("[data-oid]") ? ev.target.closest("[data-oid]").getAttribute("data-oid") : null;
    if (!oid && despliegueActivo() && colocarEn(x, y)) return;   // despliegue: tocar la zona coloca un agente
    if (oid) clickOp(oid);
  });
  // right-click (or long-press) a token: its menu (opmenu.js)
  svg.addEventListener("contextmenu", ev => {
    const gEl = ev.target.closest && ev.target.closest("[data-oid]");
    if (!gEl) return;
    ev.preventDefault();
    opMenuAt(OPS.find(o => o.id === gEl.getAttribute("data-oid")), ev);
  });
  document.addEventListener("keydown", ev => {
    if (ev.key === "Escape") { state.recolocar = null; cancelMarker(); cancelMode(); renderAll(); }
  });
}
