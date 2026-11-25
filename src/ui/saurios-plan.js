/**
 * El Gran Plan (Asterismos) y la Formación de los Saurios de Lustria (comando casero).
 * Este módulo es la interfaz que leen las demás reglas del comando.
 *
 *   asterismoActivo(bando, id): ¿tiene el bando activo ese Asterismo? id: 'itzl' | 'quetzl' | 'sotek' | 'tepok'
 *   formacion(bando): la Formación elegida: 'eterna' | 'garra' | 'acechadora', o null
 *
 * Estado (tray.saurios, se guarda, se sincroniza y se deshace con el marcador):
 *   { asterismo: [id|null, id|null],   el Asterismo elegido al armar el comando (activo desde el PI 1)
 *     formacion: [id|null, id|null],
 *     activos: [[ids], [ids]],         los Asterismos activos de cada bando
 *     eternaTP: [n|null, n|null] }     el PI en que se usó la Formación Eterna
 *
 * Asterismos: Itzl (Desgarradora en el combate de Saurios y Kroxigor), Quetzl (el primer éxito normal que daña a
 * cada Saurio o Kroxigor al luchar, por PI, daña 1 menos), Sotek (+1″ de Movimiento) y Tepok (+3″ a las acciones
 * de 1 PA de los Sacerdotes: lo lee quien implemente esas acciones). Desde el 2.º PI se evalúa la condición de los
 * que no están activos (asterismosNuevoPI); el Lector de estrellas del Sacerdote Estelar activa uno sin condición.
 * Formaciones: Eterna (recolocarse 4″ junto a un Sacerdote), Garra Solar (1D6 al terminar la activación trabado)
 * y Acechadora (Reposicionarse 2″ tras disparar). Las recolocaciones las dibuja input.js mediante `ganchos`.
 * Este módulo no toca el DOM: así corre en Node (tests).
 */
import { KINDS, DROPZONES, OPS } from '../engine/world.js';
import { TEAMNAME } from '../config.js';
import { ajustesArma, d6, reglasOp, sumaMove } from '../engine/dice.js';
import { enZonaDeControl } from '../game/acciones.js';
import { registrarDisparador } from '../game/disparadores.js';
import { opGap } from '../engine/geometry.js';
import { T } from '../i18n/es.js';
import { elegirOpcion } from './tirada.js';

export const ASTERISMOS = ['itzl', 'quetzl', 'sotek', 'tepok'];
export const FORMACIONES = ['eterna', 'garra', 'acechadora'];
const SL = '3272457903';

let tray = null;
let registro = () => {};
export const conectarPlan = t => { tray = t; };
export const conectarLogPlan = f => { registro = f; };
// lo que pone la interfaz (input.js): recolocar({ op, max, lejos, alTerminar }) pide arrastrar al agente
export const ganchos = { recolocar: null };

/* ---------- lectura (interfaz pública) ---------- */
const datos = () => (tray && tray.saurios) || null;
export const asterismoActivo = (bando, id) => !!(datos() && ((datos().activos || [])[bando] || []).includes(id));
export const formacion = bando => (datos() && (datos().formacion || [])[bando]) || null;
export const asterismoElegido = bando => (datos() && (datos().asterismo || [])[bando]) || null;
export const asterismosActivos = bando => (datos() && (datos().activos || [])[bando]) || [];

// Deja el estado del Gran Plan en el marcador (al empezar la partida). plan: [{ asterismo, formacion } | null, ...]
export function iniciarPlan(t, plan) {
  const elegidos = [0, 1].map(s => plan && plan[s] && ASTERISMOS.includes(plan[s].asterismo) && FORMACIONES.includes(plan[s].formacion) ? plan[s] : null);
  if (!elegidos[0] && !elegidos[1]) { delete t.saurios; return; }
  t.saurios = {
    asterismo: elegidos.map(e => e && e.asterismo), formacion: elegidos.map(e => e && e.formacion),
    activos: elegidos.map(e => e ? [e.asterismo] : []), eternaTP: [null, null],
  };
}
// La computadora: Asterismo y Formación al azar (rnd: () => [0,1) para los tests)
export function planAlAzar(rnd = Math.random) {
  const al = l => l[Math.floor(rnd() * l.length) % l.length];
  return { asterismo: al(ASTERISMOS), formacion: al(FORMACIONES) };
}

/* ---------- el agente y sus palabras ---------- */
const perfil = op => (op && KINDS[op.kind]) || {};
const saurios = op => perfil(op).comando === SL;
const es = (op, p) => (perfil(op).palabras || []).includes(p);
const enJuego = o => o.alive && o.deployed !== false;
const esSaurioOKroxigor = op => saurios(op) && (es(op, 'saurio') || es(op, 'kroxigor'));

/* ---------- condiciones de los Asterismos (funciones puras sobre una lista de agentes) ---------- */
const enZona = (o, dz) => !!dz && o.x >= dz.x && o.x <= dz.x + dz.w && o.y >= dz.y && o.y <= dz.y + dz.h;
export function condicionAsterismo(id, s, ops = OPS, zonas = DROPZONES) {
  const mios = ops.filter(o => o.team === s), rivales = ops.filter(o => o.team !== s);
  const bajasRivales = rivales.some(o => !o.alive && o.deployed !== false);
  switch (id) {
    case 'itzl': return bajasRivales;
    case 'quetzl': {
      const dz = zonas.find(d => d.team === s);
      return !!dz && !rivales.some(o => enJuego(o) && enZona(o, dz));
    }
    case 'sotek': {
      const lider = mios.find(o => perfil(o).lider);
      return bajasRivales || (!!lider && (!lider.alive && lider.deployed !== false || (enJuego(lider) && enZonaDeControl(lider, ops).length > 0)));
    }
    case 'tepok': return mios.some(o => enJuego(o) && saurios(o) && es(o, 'sacerdote') && enZonaDeControl(o, ops).length === 0);
  }
  return false;
}

/* ---------- inicio de cada punto de inflexión ---------- */
const nombreEquipo = s => TEAMNAME[s];
const nombreAst = id => T.saurios.asterismo[id].nombre;
const inactivos = s => ASTERISMOS.filter(id => !asterismoActivo(s, id));
const activarAst = (s, id) => { const d = datos(); if (!d.activos[s].includes(id)) d.activos[s].push(id); };
// Desde el 2.º PI: se activan los Asterismos cuya condición se cumple (sin perder los anteriores). Devuelve [{ s, id }].
export function asterismosNuevoPI(ops = OPS, zonas = DROPZONES) {
  const d = datos(), nuevos = [];
  if (!d || tray.tp < 2) return nuevos;
  for (const s of [0, 1]) {
    if (!d.asterismo[s]) continue;
    for (const id of inactivos(s)) if (condicionAsterismo(id, s, ops, zonas)) { activarAst(s, id); nuevos.push({ s, id }); registro(T.saurios.activa(nombreEquipo(s), nombreAst(id))); }
  }
  return nuevos;
}
// Lector de estrellas: el Sacerdote Estelar vivo que aún no lo usó, de ese bando
const lector = (s, ops = OPS) => ops.find(o => o.team === s && enJuego(o) && saurios(o) && perfil(o).clave === 'sacerdoteEstelar' && !(o.habUsadas || []).includes('lector')) || null;
export const lectorDisponible = (s, ops = OPS) => !!datos() && !!datos().asterismo[s] && tray.tp >= 2 && !!lector(s, ops) && inactivos(s).length > 0;
export function usarLector(s, id, ops = OPS) {
  const l = lector(s, ops);
  if (!l || !inactivos(s).includes(id)) return false;
  l.habUsadas = [...(l.habUsadas || []), 'lector'];
  activarAst(s, id);
  registro(T.saurios.lector.log(l.name, nombreAst(id)));
  return true;
}
// Todo lo del inicio del punto de inflexión: evalúa los Asterismos y ofrece el Lector de estrellas.
// { esIA(bando), controla(bando) } los pone la interfaz; la computadora lo usa si tiene alguno por activar.
export async function inicioPuntoDeInflexion({ esIA = () => false, controla = () => true } = {}, ops = OPS, zonas = DROPZONES) {
  if (!datos()) return;
  asterismosNuevoPI(ops, zonas);
  for (const s of [0, 1]) {
    if (!lectorDisponible(s, ops)) continue;
    if (esIA(s)) { const l = inactivos(s); usarLector(s, l[Math.floor(Math.random() * l.length)], ops); continue; }
    if (!controla(s)) continue;
    const L = T.saurios.lector, quien = lector(s, ops).name;
    const id = await elegirOpcion({ titulo: L.titulo, quien, texto: L.texto(quien), porDefecto: null,
      opciones: [...inactivos(s).map(a => ({ id: a, etiqueta: nombreAst(a), detalle: T.saurios.asterismo[a].desc })), { id: '', etiqueta: L.no }] });
    if (id) usarLector(s, id, ops);
  }
}

/* ---------- efectos de los Asterismos ---------- */
// Itzl: Desgarradora en las armas de combate de Saurios y Kroxigor
ajustesArma.push((w, a, b, modo) => {
  if (!w || !a || w.type !== 'M' || (modo !== 'combate' && modo !== 'contraataque') || !esSaurioOKroxigor(a)
    || !asterismoActivo(a.team, 'itzl') || w.rules.some(r => r === 'Rending')) return w;
  return { ...w, rules: [...w.rules, 'Rending'] };
});
// Sotek: +1″ al Movimiento de sus agentes
sumaMove.push(op => op && asterismoActivo(op.team, 'sotek') ? 1 : 0);
// Quetzl: lo lee el combate (rasgos): el primer éxito normal que daña, por agente y punto de inflexión, baja 1
reglasOp.push(op => {
  if (!op || !esSaurioOKroxigor(op) || !asterismoActivo(op.team, 'quetzl') || !tray || op.quetzlTP === tray.tp) return null;
  return { quetzl: true, gastarQuetzl: o => { o.quetzlTP = tray.tp; registro(T.saurios.quetzl(o.name)); } };
});

/* ---------- Formaciones ---------- */
// Garra Solar: al terminar la activación de un Saurio o Kroxigor en zona de control enemiga. Devuelve
// { dado, blanco } (blanco: el enemigo dañado) o null si no se aplica. El daño va al enemigo con menos heridas.
export function garraSolar(op, dado = d6, ops = OPS) {
  if (!op || !op.alive || op.reaccion || !esSaurioOKroxigor(op) || formacion(op.team) !== 'garra') return null;
  const foes = enZonaDeControl(op, ops);
  if (!foes.length) return null;
  const v = dado();
  const blanco = v >= 4 ? foes.slice().sort((x, y) => x.wounds - y.wounds)[0] : null;
  if (blanco) { blanco.wounds = Math.max(0, blanco.wounds - 1); if (blanco.wounds === 0) blanco.alive = false; }
  registro(T.saurios.garra(op.name, v, blanco && blanco.name) + (blanco && !blanco.alive ? T.heridas.incapacitado : ''));
  return { dado: v, blanco };
}

// Eterna: los Eslizones a 6″ o menos de un Sacerdote (distinto de ellos) que pueden recolocarse
export const eslizonesEterna = (s, ops = OPS) => {
  const sacerdotes = ops.filter(o => o.team === s && enJuego(o) && saurios(o) && es(o, 'sacerdote'));
  return ops.filter(o => o.team === s && enJuego(o) && saurios(o) && es(o, 'eslizon') && sacerdotes.some(p => p.id !== o.id && opGap(p, o) <= 6 + 1e-9));
};
export const eternaLista = (s, ops = OPS) => !!datos() && formacion(s) === 'eterna' && datos().eternaTP[s] !== tray.tp && eslizonesEterna(s, ops).length > 0;
registrarDisparador({
  id: 'eterna', ardid: 'Formación Eterna', momento: 'inicioActivacion', gratis: true,
  quien: ctx => ctx.op.team,
  condicion: ctx => !ctx.op.reaccion && !!ganchos.recolocar && eternaLista(ctx.op.team),
  efecto: async ctx => {
    const s = ctx.op.team, E = T.saurios.eterna, lista = eslizonesEterna(s);
    const id = lista.length === 1 ? lista[0].id : await elegirOpcion({ titulo: E.titulo, quien: nombreEquipo(s), texto: E.texto, porDefecto: null,
      opciones: lista.map(o => ({ id: o.id, etiqueta: o.name })) });
    const op = lista.find(o => o.id === id);
    if (!op) return;
    datos().eternaTP[s] = tray.tp;
    registro(E.log(op.name, 4));
    ganchos.recolocar({ op, max: 4, lejos: 3 });
  },
});

// Acechadora: al terminar un Eslizón una acción de Disparar fuera de la zona de control enemiga (la llama panels.js)
export const acechadoraAplica = (op, ops = OPS) => !!op && op.alive && saurios(op) && es(op, 'eslizon') && formacion(op.team) === 'acechadora'
  && enZonaDeControl(op, ops).length === 0;
export async function acechadora(op, ops = OPS) {
  if (!acechadoraAplica(op, ops) || !ganchos.recolocar) return false;
  const A = T.saurios.acechadora;
  const si = await elegirOpcion({ titulo: A.titulo, quien: op.name, texto: A.texto(op.name), porDefecto: false,
    opciones: [{ id: true, etiqueta: A.si }, { id: false, etiqueta: A.no }] });
  if (si !== true) return false;
  ganchos.recolocar({ op, max: 2, lejos: null });
  return true;
}
