/**
 * La ficha de datos completa de un agente, en una ventana (index.html, dialog#ficha):
 * nombre y modelo, atributos (Movimiento, LPA, Salvación, Heridas) y sus armas con ATAQ.,
 * IMP., DAÑO y reglas de armas. Se abre con doble toque sobre un agente en la barra del
 * despliegue (despliegue.js); sirve para cualquier otro lugar que quiera mostrarla.
 *
 * Por ahora los atributos y armas son los genéricos de prueba (src/engine/world.js KINDS y
 * src/config.js WPN): la ficha lo avisa. Con la Fase 3b mostrará la ficha oficial del comando.
 */
import { G, T, pulg } from '../i18n/es.js';
import { TEAMCOL, TEAMCOL_LT, TEAMNAME, WPN } from '../config.js';
import { effHit } from '../engine/dice.js';
import { RULES } from '../rules/index.js';
import { teamOf } from '../view3d/units.js';
import { queEs } from './despliegue.js';
import { KINDS } from '../engine/world.js';
import { state } from '../state.js';
import { comandoPorId, opcionesDe } from '../data/teams/index.js';
import { tacticasDe } from './ardides.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Las tácticas de capítulo que tiene el agente (solo comandos que las tienen)
function tacticasLinea(op, perfil) {
  const c = perfil.comando && comandoPorId(perfil.comando);
  if (!c || !c.tacticas) return '';
  const t = tacticasDe(op);
  if (!t.length) return '';
  return `<p class="fregla"><b>${T.tacticas.ficha}</b> · ${t.map(id => esc(c.tacticas.find(x => x.id === id).nombre)).join(' · ')}</p>`;
}
export function abrirFicha(op) {
  const dlg = document.getElementById("ficha");
  if (!dlg || !op) return;
  const t = teamOf(op.team), F = T.fichaDatos, perfil = KINDS[op.kind] || {};
  const stats = [
    [G.movimiento.es, pulg(RULES.moves.primary.allow(op))],
    [G.lpa.abrev, op.apl],
    [G.salvacion.es, `${op.save}+`],
    [G.heridas.es, op.deployed === false ? `${op.maxW}` : `${op.alive ? op.wounds : 0}/${op.maxW}`],
  ];
  const armas = (op.weapons || []).map(k => WPN[k]).filter(Boolean).map(w => `<tr>
      <td class="fnombre"><span aria-hidden="true">${w.type === "R" ? "⌖" : "⚔"}</span> ${esc(w.name)}<small>${w.type === "R" ? F.distancia : F.combate}</small></td>
      <td>${w.atk}</td><td>${effHit(op, w)}+</td><td>${w.dmgN}/${w.dmgC}</td>
      <td class="freglas">${w.rules.length ? esc(T.ficha.reglas(w.rules)) : "—"}</td></tr>`).join("");
  dlg.style.setProperty("--eq", TEAMCOL[op.team]);
  dlg.style.setProperty("--eqlt", TEAMCOL_LT[op.team]);
  dlg.innerHTML = `
    <div class="fcab">
      <span class="fid">${esc(op.id)}</span>
      <div class="ftit"><h2 id="fichatitulo">${esc(queEs(op))}</h2>
        <p>${perfil.lider ? `<span class="flider">${F.lider}</span> ` : ""}${esc(TEAMNAME[op.team])}${t ? " · " + esc(t.name) : ""}</p></div>
      <button class="mini icono" data-cerrar="1" aria-label="${F.cerrar}">✕</button>
    </div>
    <div class="fstats">${stats.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join("")}</div>
    <table class="farmas"><thead><tr><th>${F.nombre}</th><th>${G.ataques.abrev}</th><th>${G.impactar.abrev}</th><th>${G.dano.abrev}</th><th>${F.reglasArmas}</th></tr></thead>
      <tbody>${armas}</tbody></table>
    ${opcionesDe(op).map(d => `<p class="fregla"><b>${esc(d.nombre)}</b> · ${T.faccion.desc[d.id] || ""}${d.pendiente ? ` <em>${T.faccion.pendiente}</em>` : ""}</p>`).join("")}
    ${tacticasLinea(op, perfil)}
    ${(F.reglasAgente[perfil.comando + ':' + perfil.clave] || []).map(r => `<p class="fregla"><b>${esc(r[0])}</b> · ${esc(r[1])}${r[2] ? ` <em>${F.noImplementada}</em>` : ''}</p>`).join('')}
    ${perfil.astartes ? `<p class="fregla"><b>${F.astartes}</b> · ${perfil.astartesBolter ? F.astartesBolterDesc : F.astartesDesc}</p>` : ""}
    <p class="fnota">${perfil.comando ? F.oficial : F.provisional}</p>
    <button class="ffin" data-cerrar="1">${F.cerrar}</button>`;
  tocadaDesdeQueAbrio = false;
  if (!dlg.open) dlg.showModal();
}
// Al soltar una pulsación larga el navegador genera un clic sobre el fondo de la ficha recién
// abierta: solo cierra un toque que haya empezado después de abrirla.
let tocadaDesdeQueAbrio = false;

export function wireFicha() {
  const dlg = document.getElementById("ficha");
  if (!dlg) return;
  // "Ver ficha" en las acciones del agente seleccionado (panels.js lo pinta; aquí se atiende para
  // no importar ficha.js desde panels.js, que crearía un ciclo de módulos)
  document.addEventListener("click", ev => {
    if (ev.target.closest && ev.target.closest("#verficha, .verficha") && state.sel) abrirFicha(state.sel);
  });
  dlg.addEventListener("pointerdown", () => { tocadaDesdeQueAbrio = true; });
  dlg.addEventListener("click", ev => {
    if (!tocadaDesdeQueAbrio) return;
    // ✕, "Cerrar" o tocar fuera de la ficha (el fondo del diálogo) la cierran
    if (ev.target === dlg || ev.target.closest("[data-cerrar]")) dlg.close();
  });
}
