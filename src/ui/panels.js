/**
 * Side panels (operative card, verdict, tray), actions (shoot, fight, undo) and UI state.
 */
import { state } from '../state.js';
import { CTRL, TEAMCOL_LT, WPN } from '../config.js';
import { effHit, fightRoll, isInjured, meleeKey, shootRoll } from '../engine/dice.js';
import { opGap, opR } from '../engine/geometry.js';
import { nearestFree, opLayer, useBase } from '../engine/movement.js';
import { SHOT_KINDS, cannotShoot, judgeShot, shotsFrom } from '../engine/shots.js';
import { KINDS, OPS } from '../engine/world.js';
import { SHOT_COL, renderAll } from './board.js';
import { HINT0, fmtDice, hint, logLine } from './dom.js';
import { RULES, fmtIn, moveSpec } from '../rules/index.js';
import { mayControl, online } from '../net/sync.js';
import { showRoll } from './dicetray.js';
import { fairNote, rollFor } from '../net/roll.js';
import { renderMinis } from './minis.js';
import { T, pulg } from '../i18n/es.js';
import { renderAcciones } from './acciones.js';
import { accionesLegales, puede } from '../game/acciones.js';

/* ---------- state / undo / log ---------- */
// ini: bando con la iniciativa (null antes de decidirla); ardides: los usados en este PI
export let tray = {tp:1, cp:[2,2], vp:[0,0], ini:null, ardides:[[],[]]};
export const undoStack = [];
// other modules' state that undo restores too ({get, set}; the ops & score panel)
export const undoExtras = [];
// Where each operative stood when its activation began, for "Undo activation". Every
// snapshot (taken before each change) refreshes the operatives that haven't acted yet,
// so the entry freezes the moment one starts acting. Local to this browser.
const actStart = new Map();
const untouched = o => o.ready && !o.used.length && o.ap === o.apl;
// An order change costs no AP, so it can be the first thing an activation does: the record
// taken before it (same turning point, same spot, different order) must not be refreshed.
const orderChanged = o => {
  const st = actStart.get(o.id);
  return !!st && !!RULES.orders && st.tp === tray.tp && st.order !== o.order && st.x === o.x && st.y === o.y && st.z === (o.z || 0);
};
export function snapshot() {
  for (const o of OPS) if (o.alive && untouched(o) && !orderChanged(o)) actStart.set(o.id, {tp: tray.tp, x: o.x, y: o.y, z: o.z || 0, order: o.order});
  undoStack.push(JSON.stringify({ops:OPS, tray, extras: undoExtras.map(x => x.get())}));
  if (undoStack.length > 40) undoStack.shift();
}
export function doUndo() {
  const s = undoStack.pop();
  if (!s) { hint(online() ? T.deshacer.nadaEnLinea : T.deshacer.nada); return false; }
  const o = JSON.parse(s); OPS.splice(0, OPS.length, ...o.ops); Object.assign(tray, o.tray);
  if (o.extras) undoExtras.forEach((x, i) => { if (o.extras[i] !== undefined) x.set(o.extras[i]); });
  if (state.sel) state.sel = OPS.find(x => x.id === state.sel.id) || null;
  state.target = null; state.lastShot = null; cancelMode();
  logLine(T.deshacer.hecho);
  renderAll(); renderMinis();             // the roster may have changed (Miniatures panel)
  return true;
}

/* ---------- combat ---------- */
function doShoot() {
  if (!state.sel || !state.target) return;
  const w = WPN[state.sel.weapon];
  if (w.type !== "R") { logLine(T.disparo.armaDeCombate); return; }
  const no = cannotShoot(selEye());
  if (no) { logLine(T.disparo.noPuedeLog(state.sel.name, noShootWhy(no))); return; }
  refreshSight();                        // judge it as things stand now, not when targeted
  const shot = state.lastShot;
  if (!shot || !SHOT_KINDS[shot.kind].valid) {
    logLine(T.disparo.noValido(state.target.name, shot ? shotWhy(shot) : T.disparo.sinBlanco));
    renderAll(); return;
  }
  // what is rolled for: the shot as this table judges it, fixed before the dice are known
  const what = {k: "shoot", by: state.sel.id, at: state.target.id, w: state.sel.weapon,
                acc: Math.min(shot.accurate, w.atk), obsc: !!shot.obscured, cover: !!shot.save};
  const why = rollFor(what, (die, done, n, cancel) => {
    // the dice arrive a moment after the click: judge again what they are for
    const a = OPS.find(o => o.id === what.by), b = OPS.find(o => o.id === what.at);
    if (!a || !b || !a.alive || !b.alive || a.ap < 1 || a.weapon !== what.w) {
      cancel();
      logLine(T.disparo.yaNo(a ? a.name : what.by));
      renderAll(); return;
    }
    snapshot();
    const r = shootRoll(what, a, b, die);
    showRoll(r.atk.dice, r.hit, a.team, T.disparo.tiradaAtq(a.name));
    showRoll(r.dfn.dice, b.save, b.team, T.disparo.tiradaDef(b.name, r.dfn.cover));
    b.wounds = Math.max(0, b.wounds - r.dmg);
    a.ap -= 1; a.used.push("shoot");
    let line = T.disparo.log(a.name, b.name, r.w.name, fmtDice(r.atk.dice), fmtDice(r.dfn.dice), r.dfn.cover, r.dmg, r.notes);
    if (b.wounds === 0) { b.alive = false; line += T.heridas.incapacitado; }
    else if (isInjured(b)) line += T.heridas.lesionado;
    logLine(line + fairNote(n), r.dmg > 0);
    rolled(n, done);
  });
  if (why) hint(T.disparo.aunNo(why));
}
// a roll's result is in: send it (online), and online a shared roll can't be undone
function rolled(n, done) {
  done();
  if (n != null) undoStack.length = 0;
  cancelMode(); renderAll();
}
function doFight() {
  if (!state.sel || !state.target) return;
  const gap = opGap(state.sel, state.target);
  if (gap > CTRL) { logLine(T.combate.fueraDeZona(CTRL)); return; }
  const what = {k: "fight", by: state.sel.id, at: state.target.id, wa: meleeKey(state.sel),
                wb: state.target.weapons.find(k => WPN[k].type === "M") || "knife"};
  const why = rollFor(what, (die, done, n, cancel) => {
    const a = OPS.find(o => o.id === what.by), b = OPS.find(o => o.id === what.at);
    if (!a || !b || !a.alive || !b.alive || a.ap < 1 || opGap(a, b) > CTRL) {
      cancel();
      logLine(T.combate.yaNo(a ? a.name : what.by));
      renderAll(); return;
    }
    snapshot();
    const r = fightRoll(what, a, b, die);
    showRoll(r.ra.dice, r.hitA, a.team, T.combate.tiradaAtq(a.name));
    showRoll(r.rb.dice, r.hitB, b.team, T.combate.tiradaDef(b.name));
    Object.assign(a, r.a); Object.assign(b, r.b);
    a.ap -= 1; a.used.push("fight");
    let line = T.combate.log(a.name, b.name, fmtDice(r.ra.dice), fmtDice(r.rb.dice), a.wounds, b.wounds);
    if (!b.alive) line += T.combate.cae(b.name);
    if (!a.alive) line += T.combate.cae(a.name);
    logLine(line + fairNote(n), true);
    rolled(n, done);
  });
  if (why) hint(T.combate.aunNo(why));
}
// The ruleset's move actions as buttons: ① main move, ② secondary move, and its charge.
function moveButtons(repoUsed, dashUsed, chargeUsed) {
  const M = RULES.moves, op = state.sel, out = [];
  const btn = (t, spec, used, prefix, title, extraCls = "") =>
    `<button id="mv-${t}" class="${state.moveType === t ? "active" : ""} ${used ? "used" : ""} ${extraCls}" title="${title}">` +
    `${used ? "✓ " + T.mover.nombre[t] : `${prefix}${T.mover.nombre[t]} ${pulg(spec.allow(op))}`}</button>`;
  out.push(btn("reposition", M.primary, repoUsed, "① ", T.ficha.movTitulo(M.primary.allow(op), M.primary.climb)));
  out.push(btn("dash", M.secondary, dashUsed, "② ", T.ficha.movTitulo(M.secondary.allow(op), M.secondary.climb)));
  if (M.charge) {
    const restricted = !chargeUsed && (repoUsed || dashUsed);
    out.push(btn("charge", M.charge, chargeUsed, "", restricted
      ? T.ficha.cargaRestringida
      : T.ficha.cargaTitulo(M.charge.allow(op)), restricted ? "restricted" : ""));
  }
  return out.join("\n      ");
}
// Hand-applied damage (ploys, falls, house rules), logged the way TTS players' wound
// counters log it: "[12/15] Blademaster took damage".
export function adjustWounds(op, d) {
  if (!op || !op.alive) return;
  snapshot();
  op.wounds = Math.max(0, Math.min(op.maxW, op.wounds + d));
  let line = T.heridas.log(op.name, op.wounds, op.maxW, d < 0);
  if (op.wounds === 0) { op.alive = false; line += T.heridas.incapacitado; }
  else if (d < 0 && isInjured(op) && !isInjured({ ...op, wounds: op.wounds - d })) line += T.heridas.lesionado;
  logLine(line, d < 0);
  renderAll();
}
function woundClass(op) { const f = op.wounds / op.maxW; return f <= 0.25 ? "crit" : f < 0.5 ? "hurt" : ""; }
export function defaultMoveType(op) {
  const slot1Used = op.used.includes("reposition") || op.used.includes("charge");
  if (!slot1Used) return "reposition";
  if (!op.used.includes("dash")) return "dash";
  return "reposition";
}
export function renderCard() {
  const c = document.getElementById("opcard");
  if (!state.sel || !state.sel.alive) { c.innerHTML = `<span class="hint">${T.ficha.vacia}</span>`; renderAcciones(); return; }
  const inj = isInjured(state.sel);
  const meleeFoes = OPS.filter(o => o.alive && o.team !== state.sel.team && opGap(state.sel, o) <= CTRL);
  const repoUsed = state.sel.used.includes("reposition"), dashUsed = state.sel.used.includes("dash"), chargeUsed = state.sel.used.includes("charge");
  const slot1Used = repoUsed || chargeUsed;
  c.innerHTML = `
    <div class="opname" style="color:${TEAMCOL_LT[state.sel.team]}">${state.sel.id} · ${state.sel.name} ${KINDS[state.sel.kind] && KINDS[state.sel.kind].comando ? (KINDS[state.sel.kind].lider ? `<span class="tag">${T.fichaDatos.lider}</span>` : "") : `<span class="tag">${T.tipos[state.sel.kind] || state.sel.kind}</span>`}
      ${inj ? `<span class="tag warn">${T.ficha.lesionado}</span>` : ''} ${state.sel.ready ? '' : `<span class="tag">${T.ficha.usado}</span>`}</div>
    <div class="stats">
      <div><div class="v">${state.sel.apl}</div><div class="k">${T.ficha.stat.lpa}</div></div>
      <div><div class="v">${pulg(RULES.moves.primary.allow(state.sel))}</div><div class="k">${T.ficha.stat.mov}</div></div>
      <div><div class="v">${state.sel.save}+</div><div class="k">${T.ficha.stat.salv}</div></div>
      <div><div class="v">${state.sel.wounds}/${state.sel.maxW}</div><div class="k">${T.ficha.stat.heridas}</div></div>
      <div><div class="v">${state.sel.ap}</div><div class="k">${T.ficha.stat.pa}</div></div>
      <div><div class="v" title="${T.ficha.dosMovimientos(T.mover.nombre.reposition, RULES.moves.charge ? T.mover.nombre.charge : null, T.mover.nombre.dash)}">${slot1Used?"○":"●"}${dashUsed?"○":"●"}</div><div class="k">${T.ficha.stat.movs}</div></div>
    </div>
    <div class="woundbar"><i class="${woundClass(state.sel)}" style="width:${100*state.sel.wounds/state.sel.maxW}%"></i></div>
    <div class="btnrow woundbtns">
      <button class="mini" id="wdn" title="${T.ficha.menosHeridaTitulo}">${T.ficha.menosHerida}</button>
      <button class="mini" id="wup" title="${T.ficha.masHeridaTitulo}" ${state.sel.wounds >= state.sel.maxW ? "disabled" : ""}>${T.ficha.masHerida}</button>
    </div>
    <div class="btnrow">
      ${RULES.orders ? `<button id="ordbtn">${T.orden.boton(state.sel.order)}</button>` : ""}
      <button id="endact">${T.ficha.terminar}</button>
    </div>
    <div class="weapons">${state.sel.weapons.map(k => {
      const w = WPN[k];
      return `<label><input type="radio" name="wpn" value="${k}" ${state.sel.weapon===k?"checked":""}>
        <span class="wname">${w.type==="R"?"⌖":"⚔"} ${w.name}</span>
        <span class="wstat">${w.atk}A ${effHit(state.sel,w)}+ ${w.dmgN}/${w.dmgC}${w.rules.length?" · "+T.ficha.reglas(w.rules):""}</span></label>`;
    }).join("")}</div>
    <div class="btnrow">${moveButtons(repoUsed, dashUsed, chargeUsed)}</div>
    <div class="btnrow">
      <button id="tgtbtn" class="${state.mode==='target'?'active':''}">${T.ficha.apuntarBoton}</button>
      <button id="shootbtn" ${(!state.target || !state.lastShot || !SHOT_KINDS[state.lastShot.kind].valid || cannotShoot(selEye()) || WPN[state.sel.weapon].type!=="R") ? "disabled" : ""}>${T.ficha.disparar}</button>
      <button id="fightbtn" ${meleeFoes.length ? "" : "disabled"}>${T.ficha.combatir}</button>
    </div>`;
  if (RULES.orders) c.querySelector("#ordbtn").onclick = () => { snapshot(); state.sel.order = state.sel.order === "conceal" ? "engage" : "conceal"; refreshSight(); renderAll(); };
  c.querySelector("#endact").onclick = () => endActivation(state.sel);
  c.querySelectorAll("input[name=wpn]").forEach(r => r.onchange = () => { state.sel.weapon = r.value; refreshSight(); renderAll(); });
  c.querySelector("#wdn").onclick = () => adjustWounds(state.sel, -1);
  c.querySelector("#wup").onclick = () => adjustWounds(state.sel, +1);
  for (const t of ["reposition", "dash", "charge"]) {
    if (!moveSpec(t)) continue;
    c.querySelector("#mv-" + t).onclick = () => {
      state.moveType = t;
      const label = T.mover.nombre[t];
      const r = state.sel ? puede(state.sel, t, OPS) : { ok: true };
      if (state.sel && state.sel.used.includes(t))
        hint(T.mover.yaUsado(label));
      else if (!r.ok)                           // las reglas no lo permiten: se explica (la mesa no lo impide)
        hint(T.reglas.noPuede(label, T.reglas.motivo[r.motivo] || r.motivo));
      else
        hint(T.mover.elegido(label, state.sel && state.sel.name, allowance()));
      renderCard();
    };
  }
  c.querySelector("#tgtbtn").onclick = () => { state.mode = state.mode === "target" ? null : "target";
    hint(state.mode === "target" ? T.seleccion.apuntando : HINT0); renderAll(); };
  c.querySelector("#shootbtn").onclick = doShoot;
  if (!mayControl(state.sel))    // online: look at the other side's operatives, don't act for them
    c.querySelectorAll("button:not(#tgtbtn), input").forEach(b => { b.disabled = true; });
  c.querySelector("#fightbtn").onclick = () => {
    if (!state.target || opGap(state.sel, state.target) > CTRL) {
      state.target = meleeFoes[0]; refreshSight();
    }
    doFight();
  };
  // lo que las reglas no permiten ahora (src/game/acciones.js): atenuado y con el motivo
  const legal = Object.fromEntries(accionesLegales(state.sel, OPS).map(a => [a.accion, a]));
  for (const [id, a] of [["mv-reposition", "reposition"], ["mv-dash", "dash"], ["mv-charge", "charge"], ["shootbtn", "shoot"], ["fightbtn", "fight"]]) {
    const b = c.querySelector("#" + id), r = legal[a];
    if (!b || !r || r.ok || r.motivo === "yaHecha") continue;   // lo ya hecho lleva su ✓
    b.classList.add("restricted");
    b.title = T.reglas.noPuede(T.reglas.accion[a], T.reglas.motivo[r.motivo] || r.motivo);
  }
  renderAcciones();               // la barra de acciones refleja estos botones
}
export function renderVerdict() {
  const v = document.getElementById("verdict");
  if (!state.sel || !state.target || !state.lastShot || !state.target.alive) {
    v.innerHTML = `<span class="hint">${T.veredicto.ayuda}</span>`; return;
  }
  const shot = state.lastShot, s = shot.sight, c = s.coverBy, o = s.obscBy;
  let big, cls, why = [];
  const V = T.veredicto;
  big = V.grande[shot.kind];
  if (shot.kind === "engaged") { cls = "v-novis";
    why.push(V.aliadoCerca(shot.engagedBy.name, CTRL)); }
  else if (shot.kind === "hidden") { cls = "v-novis"; why.push(V.sinLinea); }
  else {
    if (shot.kind === "obscured") { cls = "v-obsc";
      why.push(V.ofuscado(o.id, RULES.obscure.fromShooter, RULES.obscure.fromTarget));
      if (c) why.push(V.tambienCubierto(c.id, shot.vantage)); }
    else if (shot.kind === "concealed") { cls = "v-novis";
      why.push(V.oculto(c.id, s.hardCover)); }
    else if (shot.kind === "cover") { cls = "v-cover";
      why.push(shot.vantage ? V.cubiertoAventajado(c.id) : V.cubierto(c.id, RULES.cover.range)); }
    else { cls = "v-valid"; why.push(V.limpio); }
    if (shot.accurate) why.push(V.certera(shot.accurate));
    if (RULES.orders && state.target.order === "conceal" && !c && shot.kind === "clear") why.push(V.ocultoSinCobertura);
    if (RULES.cover.voidWithin > 0 && s.gap <= RULES.cover.voidWithin) why.push(V.muyCerca(RULES.cover.voidWithin));
  }
  why.push(V.distancia(s.gap));
  const no = cannotShoot(selEye());
  const head = no ? `<div class="why">${V.noPuede(state.sel.name, noShootWhy(no))}</div>` : "";
  v.innerHTML = `${head}<div class="big ${cls}">${big}</div><div class="why">${state.sel.name} → ${state.target.name} · ${why.join(" · ")}</div>`;
}
// the selected operative as a shooter, where it stands
const selEye = () => ({x: state.sel.x, y: state.sel.y, team: state.sel.team, op: state.sel});
// why an operative can't take a Shoot action at all
const noShootWhy = n => n.why === "conceal" ? T.disparo.noPuede.conceal : T.disparo.noPuede.engaged(n.by.name);
// one short reason per judgement, for the valid-shots list and the log
function shotWhy(s) {
  const c = s.sight.coverBy, o = s.sight.obscBy, P = T.disparo.porque;
  if (s.kind === "clear") return P.clear;
  if (s.kind === "cover") return s.vantage ? P.coverVantage(c.id) : P.cover(c.id, RULES.cover.range, s.accurate);
  if (s.kind === "obscured") return P.obscured(o.id, c && c.id);
  if (s.kind === "concealed") return P.concealed(c.id);
  if (s.kind === "engaged") return P.engaged(s.engagedBy.name);
  return P.hidden;
}

// The valid-shots summary: every enemy from the selected operative (or its landing spot
// while dragging), valid targets first. Rewritten only when the text changes.
const SHOT_ORDER = ["clear", "cover", "obscured", "engaged", "concealed", "hidden"];
export function renderShots(eye) {
  const box = document.getElementById("shots");
  if (!box) return;
  let html;
  if (!eye) html = state.drag && state.drag.active
    ? `<span class="hint">${T.blancos.sinLlegada}</span>`
    : `<span class="hint">${T.blancos.ayuda}</span>`;
  else {
    const list = [...shotsFrom(eye)].sort((p, q) => SHOT_ORDER.indexOf(p.kind) - SHOT_ORDER.indexOf(q.kind) || p.range - q.range);
    const valid = list.filter(s => SHOT_KINDS[s.kind].valid).length, no = cannotShoot(eye);
    html = `<div class="shothead">${T.blancos.cabecera(eye.op.name, eye.landing, valid, list.length)}` +
      `${no ? T.blancos.noPuede(noShootWhy(no)) : ""}</div><ul class="shotlist">` +
      list.map(s => `<li data-shot="${s.kind}" data-oid="${s.target.id}"><i style="background:${SHOT_COL[s.kind]}"></i>` +
        `<b>${s.target.id} ${s.target.name}</b> <span class="k-${s.kind}">${T.disparo.tipo[s.kind]}</span>` +
        `${s.kind === "hidden" ? "" : ` · ${pulg(s.range)}`}<span class="why"> — ${shotWhy(s)}</span></li>`).join("") + "</ul>";
  }
  if (box._html !== html) { box.innerHTML = html; box._html = html; }
}

/* ---------- interaction ---------- */
export function allowance() {
  if (!state.sel) return 0;
  const spec = moveSpec(state.moveType) || RULES.moves.primary;
  return spec.allow(state.sel);
}
// el bando que activó por última vez en este punto de inflexión (para saber a quién le toca)
export let ultimoBando = null;
export const reiniciarActivaciones = () => { ultimoBando = null; };
// Mark an operative expended: its activation is over for this turning point.
export function endActivation(op) {
  if (!op || !op.alive || !op.ready || !mayControl(op)) return;
  ultimoBando = op.team;
  snapshot(); op.ready = false; op.ap = op.apl; op.used = [];
  if (state.sel === op) state.moveType = "reposition";
  logLine(T.activacion.termina(op.name)); cancelMode(); renderAll();
}
// Something to undo: the operative has acted, or is expended.
export const canUndoActivation = op => !!op && op.alive && (!untouched(op) || orderChanged(op));
// Put an operative back as it was when its activation began: where it stood, its order,
// ready with full AP. Wounds stay as they are (they may come from the other side).
export function undoActivation(op) {
  if (!canUndoActivation(op) || !mayControl(op)) return;
  const st = actStart.get(op.id), here = st && st.tp === tray.tp;
  snapshot();
  if (here) { op.x = st.x; op.y = st.y; op.z = st.z; if (RULES.orders) op.order = st.order; }
  op.ready = true; op.ap = op.apl; op.used = [];
  if (state.sel === op) state.moveType = "reposition";
  logLine(T.activacion.deshecha(op.name, here));
  cancelMode(); refreshSight(); renderAll();
}
// Take an operative off the table as incapacitated (down = true), or put it back (with at
// least 1 wound) if that was a mistake: where it was, or the nearest spot within 3" where its
// base fits (someone may have moved in meanwhile); if there's none it stays down.
export function setIncapacitated(op, down) {
  if (!op || op.alive !== down || !mayControl(op)) return;
  let spot = null;
  if (!down) {
    useBase(opR(op));
    spot = nearestFree(op.x, op.y, op.id, opLayer(op), 3);
    if (!spot) { logLine(T.activacion.sinEspacio(op.name)); return; }
  }
  snapshot();
  op.alive = !down;
  if (down) {
    if (state.sel === op) state.sel = null;
    if (state.target === op) state.target = null;
    logLine(T.activacion.fuera(op.name), true);
  } else {
    const moved = Math.hypot(spot[0] - op.x, spot[1] - op.y) > 1e-6;
    op.x = spot[0]; op.y = spot[1];
    op.wounds = Math.max(1, op.wounds);
    logLine(T.activacion.vuelve(op.name, op.wounds, moved));
  }
  cancelMode(); refreshSight(); renderAll();
}
export function cancelMode() { state.mode = null; state.drag = null; state.rulerPts = []; hint(HINT0); }
// Judge the shot at the chosen target from where the selected operative stands.
export function refreshSight() {
  state.lastShot = state.sel && state.target && state.target.alive
    ? judgeShot(selEye(), state.target) : null;
}
export function toggleOrder(oid) {
  const o = OPS.find(z => z.id === oid);
  if (!o || !o.alive || !mayControl(o)) return;
  snapshot();
  o.order = o.order === "conceal" ? "engage" : "conceal";
  refreshSight();
  logLine(T.orden.log(o.name, o.order));
  hint(T.orden.ayuda(o.name, o.order));
  renderAll();
}
