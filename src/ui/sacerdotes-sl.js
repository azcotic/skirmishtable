/**
 * Sacerdotes y equipo de los Saurios de Lustria que actúan sobre las tiradas o al empezar el punto de inflexión
 * (las acciones únicas con objetivo están en src/game/unicas.js; los textos, en T.unicasSL).
 *
 * - Presagio celeste: el Eslizón elegido tiene Equilibrada en sus armas a distancia hasta el final de su siguiente
 *   activación (op.presagioAct = activaciones terminadas al recibirlo).
 * - Velo celeste (efecto 'veloCeleste', src/game/unicas.js) y Escudriñar las estrellas (op.estrellas = { tp, n }):
 *   el agente conserva dados de defensa como éxitos normales sin tirarlos. Nunca más de 2 conservados en un disparo:
 *   la cobertura y Emboscada en la jungla ya cuentan.
 * - Escudriñar las estrellas y Tambores de guerra: una vez por batalla, al inicio del punto de inflexión
 *   (ventanaInicioPI, la llama inicio.js antes del tiroteo; la computadora decide sola).
 * - Tambores de guerra: +1″ a la distancia de Cargar de los agentes del bando hasta el final del punto de inflexión.
 */
import { T } from '../i18n/es.js';
import { ajustesArma, ajustesDefensa, bonoCarga, d6 } from '../engine/dice.js';
import { KINDS, OPS } from '../engine/world.js';
import { opGap } from '../engine/geometry.js';
import { efectoEn } from '../game/unicas.js';
import { ARDID, ven } from './ardides.js';
import { elegirOpcion } from './tirada.js';
import { rollFor } from '../net/roll.js';

const SL = '3272457903';
let tray = null, registro = () => {};
export const conectarSacerdotes = (t, log) => { tray = t; if (log) registro = log; };

const perfil = op => (op && KINDS[op.kind]) || {};
const saurios = op => perfil(op).comando === SL;
const es = (op, palabra) => (perfil(op).palabras || []).includes(palabra);
export const MAX_CONSERVADOS = 2;
const equipo = (s, id) => !!(tray && tray.equipoFaccion && (tray.equipoFaccion[s] || []).includes(id));
const nombreBando = s => ['Ash', 'Slate'][s];

/* ---------- Presagio celeste ---------- */
export const darPresagio = t => { t.presagioAct = t.activaciones || 0; };
export const presagioVale = a => !!a && a.presagioAct != null && a.presagioAct === (a.activaciones || 0);
ajustesArma.push((w, a) => {
  if (!w || w.type !== 'R' || !presagioVale(a) || w.rules.includes('Balanced')) return w;
  return { ...w, rules: [...w.rules, 'Balanced'] };
});

/* ---------- dados de defensa conservados ---------- */
// Escudriñar las estrellas: solo vale la primera vez que le disparan en ese punto de inflexión.
// Se recuerda cuál fue ese disparo (por su objeto `what`, que no cambia mientras se resuelve) para poder recalcularlo.
const primerDisparo = new Map();
function estrellasPara(b, what) {
  const e = b.estrellas;
  if (!e || !tray || e.tp !== tray.tp || !e.n) return 0;
  const k = b.id + ':' + tray.tp;
  if (!primerDisparo.has(k)) primerDisparo.set(k, what);
  return primerDisparo.get(k) === what ? e.n : 0;
}
// dados que ya conserva sin tirar: cobertura y Emboscada en la jungla
const yaConserva = (dfn, b) => (dfn.cover ? 1 : 0)
  + (dfn.cover && saurios(b) && es(b, 'eslizon') && !!tray && !!tray.ardides && (tray.ardides[b.team] || []).includes(ARDID.emboscada) ? 1 : 0);
export const conservaDe = (dfn, b, deseo) => Math.min(deseo, Math.max(0, MAX_CONSERVADOS - yaConserva(dfn, b)));
ajustesDefensa.push((dfn, b, w, ctx) => {
  if (!b || !w || w.type !== 'R' || !ctx || !ctx.what) return null;
  let deseo = 0; const notas = [];
  if (efectoEn(b, 'veloCeleste', OPS)) { deseo += 1; notas.push('veloCeleste'); }
  const est = estrellasPara(b, ctx.what);
  if (est) { deseo += est; notas.push('estrellas'); }
  const k = conservaDe(dfn, b, deseo);
  return k ? { norm: dfn.norm + k, nota: notas.join('+') } : null;
});

/* ---------- Escudriñar las estrellas ---------- */
export const sacerdoteEstelar = s => OPS.find(o => o.alive && o.deployed !== false && o.team === s && saurios(o) && perfil(o).clave === 'sacerdoteEstelar') || null;
export const dadosEscudrinar = op => Math.min(4, parseInt(String(op.id).replace(/\D/g, ''), 10) || 1);
export const puedeEscudrinar = s => !!tray && !!sacerdoteEstelar(s) && !(tray.estrellasUsado && tray.estrellasUsado[s]);
// Los agentes amigos visibles para quien escudriña
export const visiblesAmigos = op => OPS.filter(o => o.alive && o.deployed !== false && o.team === op.team && o.id !== op.id && ven(op, o));
// Da `k` dados conservados a `t` (hasta el tope de 2) durante este punto de inflexión
export function darEstrellas(t, k) {
  const e = t.estrellas && t.estrellas.tp === tray.tp ? t.estrellas : { tp: tray.tp, n: 0 };
  t.estrellas = { tp: tray.tp, n: Math.min(MAX_CONSERVADOS, e.n + k) };
  primerDisparo.delete(t.id + ':' + tray.tp);   // un reparto nuevo vuelve a contar desde el primer disparo
}
// la computadora reparte los éxitos entre los agentes más expuestos al enemigo
const masExpuestos = lista => {
  const d = o => Math.min(99, ...OPS.filter(e => e.alive && e.deployed !== false && e.team !== o.team).map(e => opGap(o, e)));
  return [...lista].sort((a, b) => d(a) - d(b));
};
// Tira los dados (o usa `tirada`) y reparte los éxitos. `elegir(k, n, candidatos)` devuelve el id del agente.
export async function escudrinar(s, { die = d6, elegir = null, tirada = null } = {}) {
  const op = sacerdoteEstelar(s);
  if (!op || !puedeEscudrinar(s)) return null;
  tray.estrellasUsado = tray.estrellasUsado || [false, false];
  tray.estrellasUsado[s] = true;
  const dados = tirada || Array.from({ length: dadosEscudrinar(op) }, () => die());
  const exitos = dados.filter(v => v >= 4).length;
  registro(T.unicasSL.estrellas.tirada(op.name, dados, exitos));
  const repartidos = [], cand = visiblesAmigos(op);
  for (let k = 1; k <= exitos; k++) {
    const libres = cand.filter(o => !o.estrellas || o.estrellas.tp !== tray.tp || o.estrellas.n < MAX_CONSERVADOS);
    if (!libres.length) break;
    const id = elegir ? await elegir(k, exitos, libres) : masExpuestos(libres)[0].id;
    const t = libres.find(o => o.id === id);
    if (!t) continue;
    darEstrellas(t, 1); repartidos.push(t.id);
    registro(T.unicasSL.estrellas.log(op.name, t.name));
  }
  return { dados, exitos, repartidos };
}

/* ---------- Tambores de guerra ---------- */
export const puedeTambores = s => !!tray && equipo(s, 'tambores') && !(tray.tamboresUsado && tray.tamboresUsado[s]);
export function tocarTambores(s) {
  if (!puedeTambores(s)) return false;
  tray.tamboresUsado = tray.tamboresUsado || [false, false]; tray.tamboresUsado[s] = true;
  tray.tambores = tray.tambores || [null, null]; tray.tambores[s] = tray.tp;
  registro(T.unicasSL.tambores.log(nombreBando(s)));
  return true;
}
bonoCarga.push(op => tray && tray.tambores && tray.tambores[op.team] === tray.tp ? 1 : 0);

/* ---------- ventana al inicio del punto de inflexión ---------- */
// control: { esDeLaIA(s), mayControl(s) }. Los jugadores eligen; la computadora usa los Tambores en el 2.º punto de
// inflexión y escudriña en cuanto puede.
export async function ventanaInicioPI(control, { preguntar = elegirOpcion, die = d6 } = {}) {
  if (!tray) return;
  const siNo = (tx, quien, texto) => preguntar({ titulo: tx.titulo, quien, texto, porDefecto: 'no',
    opciones: [{ id: 'si', etiqueta: tx.si }, { id: 'no', etiqueta: tx.no }] });
  for (const s of [0, 1]) {
    if (puedeEscudrinar(s)) {
      const op = sacerdoteEstelar(s), tx = T.unicasSL.estrellas;
      if (control.esDeLaIA(s)) await escudrinar(s, { die });
      else if (control.mayControl(s) && visiblesAmigos(op).length && await siNo(tx, op.name, tx.texto(op.name)) === 'si') {
        const dados = await new Promise(res => {
          const why = rollFor({ k: 'estrellas', by: op.id, tp: tray.tp }, (d, done) => { const v = Array.from({ length: dadosEscudrinar(op) }, () => d()); done(); res(v); });
          if (why) res(null);
        });
        if (dados) await escudrinar(s, { tirada: dados, elegir: (k, n, cand) => preguntar({ titulo: tx.titulo, quien: tx.quien(k, n), texto: tx.elige, porDefecto: cand[0].id,
          opciones: cand.map(o => ({ id: o.id, etiqueta: `${o.id} ${o.name}`, detalle: `${o.wounds}/${o.maxW} H` })) }) });
      }
    }
    if (puedeTambores(s)) {
      const tx = T.unicasSL.tambores;
      if (control.esDeLaIA(s)) { if (tray.tp === 2) tocarTambores(s); }
      else if (control.mayControl(s) && await siNo(tx, nombreBando(s), tx.texto) === 'si') tocarTambores(s);
    }
  }
}
