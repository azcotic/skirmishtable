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

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function abrirFicha(op) {
  const dlg = document.getElementById("ficha");
  if (!dlg || !op) return;
  const t = teamOf(op.team), F = T.fichaDatos;
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
        <p>${esc(op.name)} · ${esc(TEAMNAME[op.team])}${t ? " · " + esc(t.name) : ""}</p></div>
      <button class="mini icono" data-cerrar="1" aria-label="${F.cerrar}">✕</button>
    </div>
    <div class="fstats">${stats.map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join("")}</div>
    <table class="farmas"><thead><tr><th>${F.nombre}</th><th>${G.ataques.abrev}</th><th>${G.impactar.abrev}</th><th>${G.dano.abrev}</th><th>${F.reglasArmas}</th></tr></thead>
      <tbody>${armas}</tbody></table>
    <p class="fnota">${F.provisional}</p>
    <button class="ffin" data-cerrar="1">${F.cerrar}</button>`;
  if (!dlg.open) dlg.showModal();
}

export function wireFicha() {
  const dlg = document.getElementById("ficha");
  if (!dlg) return;
  dlg.addEventListener("click", ev => {
    // ✕, "Cerrar" o tocar fuera de la ficha (el fondo del diálogo) la cierran
    if (ev.target === dlg || ev.target.closest("[data-cerrar]")) dlg.close();
  });
}
