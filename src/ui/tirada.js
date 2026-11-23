/**
 * Decisiones del jugador en mitad de una tirada (solo fuera de línea: en línea el otro
 * navegador vuelve a calcular la tirada y no puede saber lo que se eligió).
 * - elegirRepeticion: Repetición de mando (1 PM): qué dado fallado repetir, o no usarla.
 * - elegirCombate: en un combate, en tu turno, golpear con un dado o bloquear uno del rival.
 * Ventana (index.html, dialog#tirada) que devuelve una promesa con la elección. No importa nada de
 * la partida, así que no crea ciclos de módulos.
 */
import { T } from '../i18n/es.js';

const dlg = () => document.getElementById("tirada");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Muestra la ventana y espera a que se toque un [data-v]; Esc elige `porDefecto`.
function preguntar(html, porDefecto) {
  return new Promise(resolve => {
    const d = dlg();
    if (!d) { resolve(porDefecto); return; }
    d.innerHTML = html;
    const fin = v => { d.onclick = null; d.oncancel = null; if (d.open) d.close(); resolve(v); };
    d.onclick = ev => { const b = ev.target.closest && ev.target.closest("[data-v]"); if (b && !b.disabled) fin(JSON.parse(b.dataset.v)); };
    d.oncancel = ev => { ev.preventDefault(); fin(porDefecto); };
    if (!d.open) d.showModal();
  });
}

// dados: valores; exito: [bool] por dado. Devuelve el índice a repetir o null.
// contexto: líneas de texto con lo que hace falta saber para decidir (lo que sacó el rival, el
// daño que recibirías ahora y si repetir puede cambiarlo)
export function elegirRepeticion({ titulo, quien, dados, exito, pm, contexto = [] }) {
  const R = T.repeticion;
  const ctx = contexto.length ? `<div class="tctx">${contexto.map(l => `<p>${esc(l)}</p>`).join("")}</div>` : "";
  const caras = dados.map((v, i) => `<button class="tdado${exito[i] ? " exito" : ""}" data-v="${i}"${exito[i] ? " disabled" : ""}` +
    ` aria-label="${esc(R.dadoAria(v, exito[i]))}">${v}</button>`).join("");
  return preguntar(`<h2>${esc(titulo)}</h2><p class="tquien">${esc(quien)}</p>${ctx}
    <p>${esc(R.explica(pm))}</p><div class="tdados">${caras}</div>
    <button class="tno" data-v="null">${R.noUsar}</button>`, null);
}

// Habilidad con ventana de sí o no: un texto de pregunta y dos botones. Devuelve true (sí) o false (no / Esc).
// textos: T.habilidades[id] = { titulo, pregunta(contexto), si, no }
export function preguntarHabilidad(id, args, quien) {
  const H = T.habilidades[id], general = T.habilidades.general;
  return preguntar(`<h2>${esc(H.titulo)}</h2><p class="tquien">${esc(general.quien(quien))}</p>
    <div class="tctx"><p>${esc(H.pregunta(...args))}</p></div>
    <div class="topciones"><button class="topc" data-v="true">${esc(H.si)}</button><button class="topc" data-v="false">${esc(H.no)}</button></div>`, false);
}

// Sigilosos: elegir cómo guardar la salvación por cobertura. ids: 'extra' | 'critico' | 'ambas'.
// ataque: {crit, norm} lo que sacó el atacante. Devuelve el id elegido.
export function elegirSigilosos({ quien, atacante, ids, ataque }) {
  const S = T.sigilosos;
  const botones = ids.map(id => `<button class="topc" data-v='"${id}"'>${esc(S.opcion[id])}<small>${esc(S.desc[id])}</small></button>`).join("");
  return preguntar(`<h2>${esc(S.titulo)}</h2><p class="tquien">${esc(S.quien(quien))}</p>
    <div class="tctx"><p>${esc(S.ataque(atacante, ataque.crit, ataque.norm))}</p></div>
    <div class="topciones">${botones}</div><p class="tnota">${esc(S.nota)}</p>`, ids[0]);
}

// El destino es mi arma: elegir uno de los dados guardados y el dado de ataque que reemplaza.
// grupos: [{nombre, dados, exito: [bool]}]. Devuelve {g, grupo, i} o null (no usarlo ahora).
export function elegirDestino({ quien, guardados, grupos }) {
  const D = T.destino;
  return new Promise(resolve => {
    const d = dlg();
    if (!d) { resolve(null); return; }
    let g = 0;
    const pintar = () => {
      d.innerHTML = `<h2>${esc(D.titulo)}</h2><p class="tquien">${esc(D.quien(quien))}</p>
        <div class="tdados">${guardados.map((v, k) => `<button class="tdado guardado${k === g ? " elegido" : ""}" data-g="${k}"` +
          ` aria-label="${esc(D.guardadoAria(v))}">${v}</button>`).join("")}</div><p>${esc(D.explica)}</p>
        ${grupos.map((gr, j) => `<p class="tquien">${esc(D.dadosDe(gr.nombre))}</p><div class="tdados">${gr.dados.map((v, i) =>
          `<button class="tdado${gr.exito[i] ? " exito" : ""}" data-r='${JSON.stringify({ grupo: j, i })}'>${v}</button>`).join("")}</div>`).join("")}
        <button class="tno" data-no="1">${esc(D.noUsar)}</button>`;
    };
    const fin = v => { d.onclick = null; d.oncancel = null; if (d.open) d.close(); resolve(v); };
    pintar();
    d.onclick = ev => {
      const b = ev.target.closest && ev.target.closest("button");
      if (!b) return;
      if (b.dataset.g !== undefined) { g = +b.dataset.g; pintar(); return; }
      if (b.dataset.r) { fin({ g, ...JSON.parse(b.dataset.r) }); return; }
      if (b.dataset.no) fin(null);
    };
    d.oncancel = ev => { ev.preventDefault(); fin(null); };
    if (!d.open) d.showModal();
  });
}

// est: el combate (src/engine/dice.js); nombres/equipos de [atacante, defensor].
export function elegirCombate(est, { nombres, opciones }) {
  const C = T.combateInt, i = est.turno;
  const pool = (k) => {
    const p = est.pools[k], v = est.vida[k];
    return `<div class="tlado${k === i ? " turno" : ""}"><b>${esc(nombres[k])}</b> <span>${v.wounds} H</span>
      <div class="texitos">${C.exitos(p.crit, p.w.dmgC, p.norm, p.w.dmgN)}</div></div>`;
  };
  const etiqueta = o => o.tipo === "golpe"
    ? C.golpe(o.con, o.con === "crit" ? est.pools[i].w.dmgC : est.pools[i].w.dmgN)
    : C.bloqueo(o.con, o.contra);
  const botones = opciones.map(o => `<button class="topc ${o.tipo}" data-v='${JSON.stringify(o)}'>${esc(etiqueta(o))}</button>`).join("");
  return preguntar(`<h2>${esc(C.titulo)}</h2><p class="tquien">${esc(C.turno(nombres[i]))}</p>
    ${pool(0)}${pool(1)}<div class="topciones">${botones}</div><p class="tnota">${esc(C.nota)}</p>`,
    opciones.find(o => o.tipo === "golpe") || opciones[0]);
}
