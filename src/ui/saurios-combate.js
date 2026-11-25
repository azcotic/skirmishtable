/**
 * Habilidades de combate de los Saurios de Lustria (comando casero; textos en T.combateSL, src/i18n/es.js).
 * Los ardides, el equipo y las habilidades pasivas viven en src/ui/ardides.js; aquí van las que cambian una tirada
 * o encadenan acciones gratis:
 *
 * - Semilla de renacimiento (Combatiente y Guardia Saurio): una vez por batalla, al ir a quedar incapacitado tira 1D6;
 *   con 4+ se queda con 1 herida. La tira el motor con el mismo dado de la tirada (src/engine/dice.js: renaceDe), así
 *   que vale al disparar, al combatir y por Devastadora de área o veneno, también en línea.
 * - Mordisco (Saurio Escamadura y Combatiente Saurio): al terminar de luchar, si el enemigo sigue en pie, 1D6: con 5+
 *   le hace 1 de daño (trasCombate del motor; dentro de la misma tirada).
 * - Cohortes ordenadas (Combatiente Saurio): con un marcador de objetivo bajo su control, Salvación 3+.
 * - Inmenso (Kroxigor): sin cobertura de terreno ligero y sin escalar más de 2″ por acción (shots.js y movement.js).
 * - Barrido del martillo (Kroxigor) y Ejemplo depredador (Saurio Escamadura con Estandarte de guerra): tras una lucha,
 *   luchas gratis (0 PA, sin gastar la activación). panels.js llama a trasLucha al terminar cada combate.
 * - Guardián inquebrantable (Guardia Saurio): tras la Carga de un enemigo, input.js llama a guardianTrasCarga.
 * - Escurridizos (ardid de tiroteo): tras un Disparo enemigo, el Eslizón que sigue en pie se mueve hasta 2″.
 *
 * Las ventanas y movimientos libres solo ocurren fuera de línea (como el resto de las ventanas de ardides).
 */
import { CTRL } from '../config.js';
import { T } from '../i18n/es.js';
import { BH, BW, KINDS, OPS } from '../engine/world.js';
import { dist, opGap, opR } from '../engine/geometry.js';
import { ajustesSalvacion, danarVida, renaceDe, trasCombate } from '../engine/dice.js';
import { objetivoControladoPor } from '../engine/objetivos.js';
import { sinCoberturaLigera } from '../engine/shots.js';
import { limiteEscalada, opLayer, pathTotalInches, placeBlocked, planRoute, useBase } from '../engine/movement.js';
import { foesNear } from '../engine/engage.js';
import { opcionesDe } from '../data/teams/index.js';
import { registrarDisparador } from '../game/disparadores.js';
import { elegirOpcion } from './tirada.js';

const SL = '3272457903';
const perfil = op => (op && KINDS[op.kind]) || {};
const saurios = op => perfil(op).comando === SL;
const es = (op, palabra) => (perfil(op).palabras || []).includes(palabra);
const clave = op => perfil(op).clave;
const vivo = o => o.alive && o.deployed !== false;

// Lo que panels.js presta al cargar (así no hay ciclos de módulos): registro, luchar gratis, deshacer, redibujar...
const P = { registro: () => {}, luchar: async () => {}, snapshot: () => {}, redibujar: () => {}, esIA: () => false, enLinea: () => false };
export const conectarCombateSL = p => Object.assign(P, p);

/* ---------- reglas del motor ---------- */
renaceDe.push(op => saurios(op) && ['combatienteSaurio', 'guardiaSaurio'].includes(clave(op)));
ajustesSalvacion.push(op => saurios(op) && clave(op) === 'combatienteSaurio' && op.alive && objetivoControladoPor(op) ? 3 : null);
sinCoberturaLigera.push(op => saurios(op) && es(op, 'kroxigor'));
limiteEscalada.push(op => saurios(op) && es(op, 'kroxigor') ? 2 : null);

// Mordisco: el que luchó (est.ops[0]), si ambos siguen en pie, tira 1D6; con 5+ el enemigo recibe 1 de daño
export const muerde = op => saurios(op) && ['saurioEscamadura', 'combatienteSaurio'].includes(clave(op));
trasCombate.push((est, die) => {
  const [a] = est.ops;
  if (!muerde(a) || !est.vida[0].alive || !est.vida[1].alive) return;
  const dado = die(), dmg = dado >= 5 ? 1 : 0;
  const semilla = dmg ? danarVida(est, 1, 1, die) : null;
  est.pasos.push({ quien: 0, tipo: 'mordisco', dado, dmg, ...(semilla ? { semilla } : {}) });
});

/* ---------- textos del registro ---------- */
export const textoSemilla = (op, s) => s ? ` ${T.combateSL.semilla(op.name, s.dado, s.ok)}` : '';
// Mordisco y Semilla de renacimiento de los pasos de un combate (a: quien luchó, b: su rival)
export function textoPasos(pasos, a, b) {
  let t = '';
  for (const p of pasos || []) {
    if (p.tipo === 'mordisco') t += ` ${T.combateSL.mordisco(a.name, b.name, p.dado, p.dmg)}`;
    if (p.semilla) t += textoSemilla(p.tipo === 'mordisco' || p.quien === 0 ? b : a, p.semilla);
  }
  return t;
}

/* ---------- Barrido del martillo y Ejemplo depredador ---------- */
const enemigosEnZona = op => OPS.filter(o => vivo(o) && o.team !== op.team && opGap(op, o) <= CTRL + 1e-9);
const hoy = a => a.activaciones || 0;
export const barridoPosible = a => !!a && a.alive && saurios(a) && es(a, 'kroxigor') && a.barridoAct !== hoy(a);
export const objetivosBarrido = (a, b) => enemigosEnZona(a).filter(o => o.id !== b.id);
export const tieneEstandarte = op => opcionesDe(op).some(o => o.id === 'estandarte');
export const ejemploPosible = (a, b) => !!a && a.alive && !!b && b.alive && saurios(a) && clave(a) === 'saurioEscamadura'
  && tieneEstandarte(a) && !a.ejemploUsado;
export const candidatosEjemplo = (a, b) => !ejemploPosible(a, b) ? [] : OPS.filter(o => vivo(o) && o.id !== a.id && o.team === a.team
  && o.ready && saurios(o) && es(o, 'saurio') && opGap(o, a) <= 3 + 1e-9 && opGap(o, b) <= CTRL + 1e-9);

const opcionesDe_ = lista => lista.map(o => ({ id: o.id, etiqueta: o.name, detalle: `${o.wounds}/${o.maxW} H` }));
// elige uno de la lista: la computadora, el más herido; una persona, en una ventana (null: ninguno)
async function elegir(dueno, lista, ventana) {
  if (!lista.length) return null;
  if (P.esIA(dueno.team)) return lista.reduce((m, o) => o.wounds < m.wounds ? o : m, lista[0]);
  const id = await elegirOpcion({ titulo: ventana.titulo, quien: dueno.name, texto: ventana.texto, porDefecto: 'no',
    opciones: [...opcionesDe_(lista), { id: 'no', etiqueta: ventana.no }] });
  return lista.find(o => o.id === id) || null;
}

// Tras un combate de `a` contra `b` (a: quien luchó; gratis: era una lucha gratis, que no encadena más Ejemplos)
export async function trasLucha(a, b, { gratis = false } = {}) {
  if (P.enLinea() || !a || !b) return;
  if (!b.alive && barridoPosible(a)) {
    const B = T.combateSL.barrido;
    const otro = await elegir(a, objetivosBarrido(a, b), { titulo: B.titulo, texto: B.texto(a.name), no: B.no });
    if (otro) {
      a.barridoAct = hoy(a);
      P.registro(B.log(a.name, otro.name));
      await P.luchar({ by: a.id, at: otro.id, gratis: true });
    }
  }
  if (!gratis && ejemploPosible(a, b)) {
    const E = T.combateSL.ejemplo;
    const s = await elegir(a, candidatosEjemplo(a, b), { titulo: E.titulo, texto: E.texto(a.name, b.name), no: E.no });
    if (s) {
      a.ejemploUsado = true;
      P.registro(E.log(a.name, s.name, b.name));
      await P.luchar({ by: s.id, at: b.id, gratis: true });
    }
  }
}

/* ---------- movimientos libres: Guardián inquebrantable y Escurridizos ---------- */
const rutaValida = (op, x, y, max, carga, gl) => {
  const p = planRoute(op, x, y, 0, -1, max, carga, gl);   // hi < 0: sin escalar
  return !!p && !p.partial && pathTotalInches(p) <= max + 1e-9;
};
// Puntos candidatos alrededor de `centro` (a los radios dados), libres para la base de `op`
function puntosEn(op, centro, radios, pasos = 36) {
  const R = opR(op), gl = opLayer(op), out = [];
  for (const r of radios) for (let k = 0; k < pasos; k++) {
    const ang = 2 * Math.PI * k / pasos, x = centro.x + r * Math.cos(ang), y = centro.y + r * Math.sin(ang);
    if (x < R || y < R || x > BW - R || y > BH - R || placeBlocked(x, y, op.id, gl)) continue;
    out.push({ x, y });
  }
  return out;
}
// El primer punto (en el orden dado) al que `op` llega en `max` pulgadas; null si ninguno
function primerPunto(op, pts, max, carga) {
  const gl = opLayer(op);
  useBase(opR(op));
  let n = 0;
  for (const p of pts) {
    if (n++ > 24) break;                       // no revisar rutas sin fin
    if (rutaValida(op, p.x, p.y, max, carga, gl)) return p;
  }
  return null;
}
// Guardián inquebrantable: dónde puede terminar la Guardia `g` una Carga de hasta 3″ contra `e` (en su zona de control)
export function puntoDeCarga(g, e, max = 3) {
  const rho = opR(g) + opR(e) + CTRL, z = e.z || 0;
  const pts = puntosEn(g, e, [rho * 0.92, rho * 0.8], 48).filter(p => dist(p.x, p.y, g.x, g.y) <= max + opR(g) + 1e-9
    && foesNear(p.x, p.y, g.team, g.id, opR(g), z).some(o => o.id === e.id))
    .sort((p, q) => dist(p.x, p.y, g.x, g.y) - dist(q.x, q.y, g.x, g.y));
  return primerPunto(g, pts, max, true);
}
// Las Guardias enemigas del que acaba de Cargar que pueden reaccionar: [{ g, amigo }]
export function guardianesPara(e) {
  if (!e || !e.alive) return [];
  const out = [];
  for (const g of OPS) {
    if (!vivo(g) || g.team === e.team || !saurios(g) || clave(g) !== 'guardiaSaurio') continue;
    if (foesNear(g.x, g.y, g.team, g.id, opR(g), g.z || 0).length) continue;     // ya está en zona de control enemiga
    const amigo = OPS.find(o => vivo(o) && o.team === g.team && o.id !== g.id && opGap(o, e) <= CTRL + 1e-9 && opGap(o, g) <= 3 + 1e-9);
    if (amigo) out.push({ g, amigo });
  }
  return out;
}
export async function guardianTrasCarga(e) {
  if (P.enLinea()) return;
  const G = T.combateSL.guardian;
  for (const { g, amigo } of guardianesPara(e)) {
    if (!g.alive || !e.alive || foesNear(g.x, g.y, g.team, g.id, opR(g), g.z || 0).length) continue;
    const si = P.esIA(g.team) || await elegirOpcion({ titulo: G.titulo, quien: g.name, texto: G.texto(g.name, e.name, amigo.name), porDefecto: 'no',
      opciones: [{ id: 'si', etiqueta: G.si }, { id: 'no', etiqueta: G.no }] }) === 'si';
    if (!si) continue;
    const p = puntoDeCarga(g, e);
    if (!p) { P.registro(G.sinLugar(g.name, e.name)); continue; }
    P.snapshot();
    g.x = p.x; g.y = p.y;
    if (g.order === 'conceal') g.order = 'engage';          // como toda Carga, termina con orden de trabarse
    P.registro(G.log(g.name, e.name));
    P.redibujar();
  }
}

// Escurridizos: el Eslizón `b` (que sigue en pie) se mueve hasta 2″ sin terminar en zona de control enemiga.
// modo: 'lejos' (el punto más alejado del tirador) o 'cerca'. Devuelve { x, y } o null.
export function puntoEscurridizo(b, tirador, modo = 'lejos', max = 2) {
  const z = b.z || 0, signo = modo === 'lejos' ? -1 : 1;
  const pts = puntosEn(b, b, [max, max * 0.75, max * 0.5, max * 0.25], 24)
    .filter(p => !foesNear(p.x, p.y, b.team, b.id, opR(b), z).length)
    .sort((p, q) => signo * (dist(p.x, p.y, tirador.x, tirador.y) - dist(q.x, q.y, tirador.x, tirador.y)));
  return primerPunto(b, pts, max, false);
}
registrarDisparador({
  id: 'escurridizos', ardid: 'Escurridizos', momento: 'trasAtaque',
  quien: ctx => ctx.b.team,
  condicion: ctx => !!ctx.b && ctx.b.alive && saurios(ctx.b) && es(ctx.b, 'eslizon') && ctx.a.team !== ctx.b.team,
  efecto: async ctx => {
    const E = T.combateSL.escurridizos, { a, b } = ctx;
    const lejos = puntoEscurridizo(b, a, 'lejos'), cerca = puntoEscurridizo(b, a, 'cerca');
    if (!lejos && !cerca) { P.registro(E.sinLugar(b.name)); return; }
    const opciones = [lejos && { id: 'lejos', etiqueta: E.alejarse, detalle: E.alejarseDet }, cerca && { id: 'cerca', etiqueta: E.acercarse, detalle: E.acercarseDet },
      { id: 'no', etiqueta: E.no }].filter(Boolean);
    const id = await elegirOpcion({ titulo: E.titulo, quien: b.name, texto: E.texto(b.name), porDefecto: 'no', opciones });
    const p = id === 'lejos' ? lejos : id === 'cerca' ? cerca : null;
    if (!p) return;
    P.snapshot();
    b.x = p.x; b.y = p.y;
    P.registro(E.log(b.name, p.x, p.y));
    P.redibujar();
  },
});
