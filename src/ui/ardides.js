/**
 * Efectos de los ardides de estrategia (con nuestras palabras; los nombres, en src/i18n/nombres.js
 * y las descripciones, en src/i18n/es.js, T.ardidDesc). Un ardid usado en la fase de estrategia
 * vale todo ese punto de inflexión (tray.ardides[bando]).
 *
 * Aquelarre Disforme:
 * - Protección etérea: si disparan a uno de sus agentes, Penetración 1 pasa a Penetración en críticos 1.
 * - Hermandad de hechiceros: armas PSÍQUICAS de sus Hechiceros con Equilibrada; Incesante si hay
 *   otro Hechicero amigo a 9″ o menos.
 * - Rebaño salvaje: armas de combate de sus Tzaangor con Certera 1; también Severa si un amigo lo
 *   asiste (está en la zona de control del enemigo) o combate a 6″ o menos de un Hechicero que lo ve.
 * - El destino es mi arma: tira 2D6 y los guarda; en el tiroteo, uno puede reemplazar un dado de
 *   ataque de una secuencia (tuyo o del rival), uno por secuencia. Si sumaban menos de 9, al usar
 *   uno se descarta el otro. Los que queden se descartan al final del punto de inflexión.
 *
 * Ángeles de la Muerte:
 * - Doctrina de combate: se elige una doctrina (tray.doctrina[bando]); sus armas tienen Equilibrada
 *   al disparar a más de 6″ (devastadora), a 6″ o menos (táctica) o al combatir (asalto).
 * - Y no conocerán el miedo: sus agentes lesionados no empeoran Impactar ni Movimiento.
 * - Indomitus: si les disparan y sacan dos fallos o más en defensa, uno pasa a éxito normal.
 * - Tácticas flexibles: cambia la táctica de capítulo secundaria (pendiente: aún no hay tácticas).
 *
 * Los tres primeros del Aquelarre cambian el arma con la que se tira (ajustesArma, src/engine/dice.js): los dos
 * navegadores de una partida en línea los aplican igual. El destino pide una decisión a mitad de
 * tirada: solo fuera de línea, como la Repetición de mando.
 */
import { CTRL, WPN } from '../config.js';
import { T } from '../i18n/es.js';
import { elegirOpcion } from './tirada.js';
import { UNICAS, unicasDe } from '../game/unicas.js';
import { ajustesArma, ajustesDefensa, bloquear, clasificarAtaque, critDesde, ignoraLesion, ignoraSaturacion, reduceNormal, reglasOp } from '../engine/dice.js';
import { ignoraAturdir } from '../engine/efectos.js';
import { ajustesCoste, cargarTrabado } from '../game/acciones.js';
import { registrarDisparador } from '../game/disparadores.js';
import { comandoPorId, esArmaBolter, opcionesDe } from '../data/teams/index.js';
import { KINDS, OPS, ajustarAgente } from '../engine/world.js';
import { opGap } from '../engine/geometry.js';
import { sightAnalysis } from '../engine/sight.js';

export const ARDID = {
  proteccion: 'Protección etérea',
  destino: 'El destino es mi arma',
  hermandad: 'Hermandad de hechiceros',
  rebano: 'Rebaño salvaje',
  doctrina: 'Doctrina de combate',
  miedo: 'Y no conocerán el miedo',
  flexibles: 'Tácticas flexibles',
  indomitus: 'Indomitus',
};
export const DOCTRINAS = ['devastadora', 'tactica', 'asalto'];

// el marcador (panels.js lo presta al cargar: así no hay ciclo de módulos)
let tray = null;
export const conectarArdides = t => { tray = t; };
// el registro de la partida (panels.js lo presta, igual que el marcador)
let registro = () => {};
export const conectarRegistro = f => { registro = f; };
const logLineAr = t => registro(t);

const activo = (s, nombre) => !!(tray && tray.ardides && (tray.ardides[s] || []).includes(nombre));
const perfil = op => (op && KINDS[op.kind]) || {};
const aquelarre = op => perfil(op).comando === '3348897103';
const angeles = op => perfil(op).comando === '2272196183';
const es = (op, palabra) => (perfil(op).palabras || []).includes(palabra);
const amigos = op => OPS.filter(o => o.alive && o.deployed !== false && o.team === op.team && o.id !== op.id);
const tiene = (w, r) => w.rules.some(x => x === r || x.startsWith(r.replace(/ \d+$/, '') + ' '));

// El arma de `a` contra `b`, cambiada por los ardides activos (modo: "disparo" o "combate")
ajustesArma.push((w, a, b, modo) => {
  if (modo === 'contraataque') modo = 'combate';   // el defensor de un combate (solo lo distinguen las reglas de equipo)
  if (!tray || !w) return w;
  let x = null;
  const copia = () => x || (x = { ...w, rules: [...w.rules] });
  const anadir = r => { if (!tiene(x || w, r)) copia().rules.push(r); };
  if (modo === 'disparo' && b && aquelarre(b) && activo(b.team, ARDID.proteccion) && w.rules.includes('Piercing 1')) {
    const c = copia(); c.rules[c.rules.indexOf('Piercing 1')] = 'Piercing Crits 1';
  }
  if (a && aquelarre(a) && es(a, 'hechicero') && activo(a.team, ARDID.hermandad) && w.rules.includes('PSYCHIC')) {
    const otro = amigos(a).some(o => es(o, 'hechicero') && opGap(o, a) <= 9 + 1e-9);
    anadir(otro ? 'Ceaseless' : 'Balanced');
  }
  if (a && angeles(a) && tacticasDe(a).length) {   // tácticas de capítulo que cambian el arma
    const t = tacticasDe(a);
    if (modo === 'combate' && w.type === 'M' && t.includes('agresivos')) anadir('Rending');
    if (modo === 'disparo' && w.type === 'R') {
      if (t.includes('asedios')) anadir('Saturate');
      const movio = (a.used || []).some(u => u === 'reposition' || u === 'charge' || u === 'fallBack');
      if (t.includes('tiradores') && !movio && esArmaBolter(w)) anadir('Severe');
    }
  }
  if (a && angeles(a) && activo(a.team, ARDID.doctrina)) {
    const d = doctrina(a.team), lejos = b && opGap(a, b) > 6 + 1e-9;
    if ((modo === 'disparo' && b && (d === 'devastadora' ? lejos : d === 'tactica' ? !lejos : false))
      || (modo === 'combate' && d === 'asalto')) anadir('Balanced');
  }
  if (modo === 'combate' && a && aquelarre(a) && es(a, 'tzaangor') && activo(a.team, ARDID.rebano) && w.type === 'M') {
    anadir('Accurate 1');
    const asistido = b && amigos(a).some(o => aquelarre(o) && opGap(o, b) <= CTRL + 1e-9);
    const hechicero = amigos(a).some(o => es(o, 'hechicero') && opGap(o, a) <= 6 + 1e-9
      && sightAnalysis({ x: o.x, y: o.y, z: o.z || 0, team: o.team, op: o }, a).visible);
    if (asistido || hechicero) anadir('Severe');
  }
  return x || w;
});

/* ---------- Tácticas de capítulo (regla de facción de los Ángeles de la Muerte) ----------
 * tray.tacticas[bando] = [primaria, secundaria]; el ardid Tácticas flexibles cambia la secundaria
 * hasta el final del punto de inflexión (tray.flex[bando]). Los Sargentos suman la suya (Veterano
 * del Capítulo) y el Francotirador Eliminador siempre tiene Sigilosos (Capa de camuflaje). Los
 * efectos de la misma táctica no se acumulan.
 * 1 Agresivos: armas de combate con Desgarradora. 2 Duelistas: un éxito normal bloquea un crítico
 * sin resolver. 3 Resueltos: ignora los cambios de LPA. 4 Sigilosos: contra sus disparos, una
 * salvación por cobertura más o una guardada como crítico. 5 Móviles: Retroceder por 1 PA menos y
 * Cargar en zona de control. 6 Robustos: 5+ en defensa son críticos y el primer daño normal de 3 o
 * más al contraatacar baja en 1. 7 Tiradores certeros: sin Cargar, Reposicionarse ni Retroceder,
 * sus armas bólter tienen Severa. 8 Especialistas en asedios: armas a distancia con Saturación. */
export function tacticasDeBando(s) {
  const t = tray && tray.tacticas && tray.tacticas[s];
  if (!t) return [];
  const sec = (tray.flex && tray.flex[s]) || t[1];
  return [t[0], sec].filter(Boolean);
}
export function tacticasDe(op) {
  if (!angeles(op)) return [];
  const v = opcionesDe(op).map(o => o.tactica).filter(Boolean);
  const f = perfil(op).clave === 'francotirador' ? ['sigilosos'] : [];
  return [...new Set([...tacticasDeBando(op.team), ...v, ...f])];
}
const tiene_ = (op, t) => tacticasDe(op).includes(t);
// Sigilosos: ¿el defensor tiene que elegir al recibir este disparo? (hay cobertura que guardar)
// Devuelve los ids de sus opciones ('extra', 'critico' y, si la tiene por dos vías, 'ambas') o [].
export function opcionesSigilosos(b, w, what) {
  if (!b || !angeles(b) || !w || w.type !== 'R' || !what || !what.cover || !tiene_(b, 'sigilosos')) return [];
  if (w.rules.some(r => r === 'Saturate') && !ignoraSaturacion.some(f => f(b))) return [];
  const doble = perfil(b).clave === 'francotirador' && tacticasDeBando(b.team).includes('sigilosos');
  return doble ? ['extra', 'critico', 'ambas'] : ['extra', 'critico'];
}
export const elegirTacticas = (s, p, sec) => { tray.tacticas = tray.tacticas || [null, null]; tray.tacticas[s] = [p, sec]; };
export function elegirFlexible(s, t) { tray.flex = tray.flex || [null, null]; tray.flex[s] = t; }

// Habilidades con ventana (datos del agente: habilidades). Las de "usos: batalla" se gastan una vez
// (op.habUsadas). habilidadDisponible: la de ese momento que aún puede usar, o null.
export const habilidadesDe = op => (perfil(op).habilidades || []);
export const habilidadDisponible = (op, cuando) =>
  habilidadesDe(op).find(h => h.cuando === cuando && !(h.usos === 'batalla' && (op.habUsadas || []).includes(h.id))) || null;
export function gastarHabilidad(op, id) {
  if (!(op.habUsadas || []).includes(id)) op.habUsadas = [...(op.habUsadas || []), id];
}
reglasOp.push(op => {
  if (!angeles(op)) return null;
  return { duelista: tiene_(op, 'duelistas'), robusto: tiene_(op, 'robustos'), aura: !!habilidadDisponible(op, 'danoNormal') };
});
ignoraAturdir.push(op => tiene_(op, 'resueltos'));
ignoraSaturacion.push(op => angeles(op) && perfil(op).clave === 'francotirador');   // Capa de camuflaje
ajustesCoste.push((op, accion) => accion === 'fallBack' && tiene_(op, 'moviles') ? 1 : undefined);
cargarTrabado.push(op => tiene_(op, 'moviles'));
ajustesDefensa.push((dfn, b, w, ctx) => {
  if (!b || !angeles(b) || !w || w.type !== 'R') return null;
  let { crit, norm } = dfn;
  const notas = [];
  if (tiene_(b, 'robustos')) {      // Robustos: 5+ son críticos
    const cincos = (dfn.dice || []).filter(v => v === 5 && v >= b.save).length;
    const sube = (dfn.dice || []).filter(v => v === 5).length;
    crit += sube; norm -= cincos; notas.push('robustos');
  }
  if (dfn.cover && tiene_(b, 'sigilosos')) {   // Sigilosos: la mejor de sus opciones
    const ambas = perfil(b).clave === 'francotirador' && tacticasDeBando(b.team).includes('sigilosos');
    const dano = (n, c) => bloquear(ctx.aN, ctx.aC, n, c, w.dmgN, w.dmgC).dmg;
    const todas = { extra: [norm + 1, crit], critico: [norm - 1, crit + 1], ambas: [norm, crit + 1] };
    const ids = ambas ? ['extra', 'critico', 'ambas'] : ['extra', 'critico'];
    const elegida = ctx.what && ctx.what.sigilo;
    // la que eligió el jugador (partida fuera de línea); si no, la que menos daño deja pasar
    const id = ids.includes(elegida) ? elegida : ids.sort((x, y) => dano(...todas[x]) - dano(...todas[y]))[0];
    [norm, crit] = todas[id]; notas.push('sigilosos');
  }
  return notas.length ? { norm, crit, nota: notas.join('+') } : null;
});

// Doctrina de combate: la elegida por el bando (devastadora por defecto)
export const doctrina = s => (tray && tray.doctrina && tray.doctrina[s]) || 'devastadora';
export function elegirDoctrina(s, d) { tray.doctrina = tray.doctrina || [null, null]; tray.doctrina[s] = d; }

// Guerra según las doctrinas (Sargentos): cada uno, una vez por batalla, usa Doctrina de combate gratis
// con su doctrina (Asalto y Táctica el Sargento Intercesor de Asalto; Devastadora y Táctica el
// Sargento Intercesor). Se devuelve el PM al elegirla; d = null deshace el descuento de este PI.
const GUERRA = { sargentoAsalto: ['asalto', 'tactica'], sargentoIntercesor: ['devastadora', 'tactica'] };
export function guerraDoctrinas(s, d) {
  tray.guerra = tray.guerra || [[], []]; tray.guerraPI = tray.guerraPI || [null, null];
  const prev = tray.guerraPI[s];
  if (prev) { tray.cp[s] -= 1; tray.guerra[s] = tray.guerra[s].filter(k => k !== prev); tray.guerraPI[s] = null; }
  if (!d) return false;
  const quien = OPS.find(o => o.alive && o.deployed !== false && o.team === s && angeles(o)
    && (GUERRA[perfil(o).clave] || []).includes(d) && !tray.guerra[s].includes(o.id + ':' + d));
  if (!quien) return false;
  const k = quien.id + ':' + d;
  tray.guerra[s].push(k); tray.guerraPI[s] = k; tray.cp[s] += 1;
  return true;
}

/* ---------- Ardides de tiroteo con ventana (src/game/disparadores.js) ----------
 * Todo es polvo (Aquelarre): cuando un dado de ataque normal va a hacer daño a un MARINE RÚBRICA
 * amigo, ese dado hace 1 menos. ctx = { b: defensor, w: arma, normales: dados normales que pasan }. */
registrarDisparador({
  id: 'todoPolvo', ardid: 'Todo es polvo', momento: 'recibirDano',
  quien: ctx => ctx.b.team,
  condicion: ctx => aquelarre(ctx.b) && es(ctx.b, 'rubrica') && ctx.normales > 0 && ctx.w.dmgN > 0,
  efecto: ctx => { ctx.r.dmg = Math.max(0, ctx.r.dmg - 1); ctx.r.notes.push('todoPolvo'); },
});

// Y no conocerán el miedo
ignoraLesion.push(op => angeles(op) && activo(op.team, ARDID.miedo));

// Indomitus: dos fallos o más en la defensa -> uno pasa a éxito normal
ajustesDefensa.push((dfn, b, w) => {
  if (!b || !angeles(b) || !activo(b.team, ARDID.indomitus) || !w || w.type !== 'R') return null;
  const fallos = (dfn.dice || []).filter(v => v !== 6 && (v === 1 || v < b.save)).length;
  return fallos >= 2 ? { norm: dfn.norm + 1, nota: 'indomitus' } : null;
});

/* ---------- El destino es mi arma ---------- */
// tray.destino[bando] = { dados: [d, d], bajo: suman menos de 9 } o null
export function guardarDestino(s, die) {
  tray.destino = tray.destino || [null, null];
  const dados = [die(), die()];
  tray.destino[s] = { dados, bajo: dados[0] + dados[1] < 9 };
  return dados;
}
export function quitarDestino(s) { if (tray && tray.destino) tray.destino[s] = null; }
export const dadosGuardados = s => (tray && tray.destino && tray.destino[s] && tray.destino[s].dados) || [];
// Usa el dado guardado número g del bando s; si sumaban menos de 9, se descarta el otro
export function gastarDestino(s, g) {
  const d = tray.destino[s], v = d.dados[g];
  d.dados.splice(g, 1);
  if (d.bajo) d.dados = [];
  if (!d.dados.length) tray.destino[s] = null;
  return v;
}

/* ---------- Ardides de tiroteo del Aquelarre Disforme ---------- */
const hechicero = op => aquelarre(op) && es(op, 'hechicero');
export const ven = (a, b) => sightAnalysis({ x: a.x, y: a.y, z: a.z || 0, team: a.team, op: a }, b).visible;
const psiquicas = o => (o.weapons || []).filter(k => WPN[k] && WPN[k].type === 'R' && WPN[k].rules.includes('PSYCHIC'));

// Plan caprichoso: al terminar la activación de un Hechicero, acción libre de Correr o cambio de orden.
// La activación sigue abierta si da la acción (ctx.seguir); gratisCorrer lo leen puede() e input.js.
registrarDisparador({
  id: 'plan', ardid: 'Plan caprichoso', momento: 'finActivacion',
  quien: ctx => ctx.op.team,
  condicion: ctx => hechicero(ctx.op) && ctx.op.alive,
  efecto: async ctx => {
    const P = T.ardidesAD.plan, op = ctx.op;
    const id = await elegirOpcion({ titulo: P.titulo, quien: op.name, texto: P.texto(op.name), porDefecto: 'orden', opciones: [
      { id: 'correr', etiqueta: P.correr, detalle: P.correrDet }, { id: 'orden', etiqueta: P.orden, detalle: P.ordenDet }] });
    if (id === 'correr') { op.gratisCorrer = true; ctx.seguir = true; registro(P.logCorrer(op.name)); }
    else { op.order = op.order === 'conceal' ? 'engage' : 'conceal'; registro(P.logOrden(op.name)); }
  },
});

// Cábala psíquica: al activarse un Hechicero, toma prestada un arma psíquica a distancia de otro
// Hechicero a 9″ o menos y visible, hasta el final de su activación. Ese otro no puede usarla en
// todo el punto de inflexión, ni se puede elegir un arma que ya usó en él.
const libre = (o, clave) => !(o.psiPI || []).includes(clave) && !(o.vetadas || []).includes(clave);
const opcionesCabala = op => amigos(op).filter(o => hechicero(o) && opGap(o, op) <= 9 + 1e-9 && ven(op, o))
  .flatMap(o => [...psiquicas(o).filter(k => libre(o, k)).map(k => ({ o, k })),
    ...(KINDS[o.kind].unicas || []).filter(u => UNICAS[u] && !UNICAS[u].pendiente && libre(o, 'u:' + u)).map(u => ({ o, u }))]);
registrarDisparador({
  id: 'cabala', ardid: 'Cábala psíquica', momento: 'inicioActivacion',
  quien: ctx => ctx.op.team,
  condicion: ctx => hechicero(ctx.op) && opcionesCabala(ctx.op).length > 0,
  efecto: async ctx => {
    const C = T.ardidesAD.cabala, op = ctx.op, ops = opcionesCabala(op);
    const id = await elegirOpcion({ titulo: C.titulo, quien: op.name, texto: C.texto(op.name), porDefecto: null,
      opciones: ops.map(({ o, k, u }) => u
        ? ({ id: o.id + '|u:' + u, etiqueta: `${o.name} · ${T.unicas[u].nombre}`, detalle: T.unicas.acc })
        : ({ id: o.id + '|' + k, etiqueta: `${o.name} · ${WPN[k].name}`, detalle: `${WPN[k].atk}A ${WPN[k].hit}+ ${WPN[k].dmgN}/${WPN[k].dmgC}` })) });
    const e = ops.find(({ o, k, u }) => o.id + '|' + (u ? 'u:' + u : k) === id);
    if (!e) return;
    if (e.u) {
      op.unicasPrestadas = [...(op.unicasPrestadas || []), e.u];
      e.o.vetadas = [...(e.o.vetadas || []), 'u:' + e.u];
      registro(C.log(op.name, e.o.name, T.unicas[e.u].nombre));
      return;
    }
    if (!op.weapons.includes(e.k)) { op.weapons = [...op.weapons, e.k]; op.prestadas = [...(op.prestadas || []), e.k]; }
    e.o.vetadas = [...(e.o.vetadas || []), e.k];
    registro(C.log(op.name, e.o.name, WPN[e.k].name));
  },
});
// al terminar la activación, el arma prestada vuelve (el otro agente sigue sin poder usarla)
export function quitarPrestadas(op) {
  delete op.unicasPrestadas;
  if (!op.prestadas || !op.prestadas.length) return;
  op.weapons = op.weapons.filter(k => !op.prestadas.includes(k));
  if (!op.weapons.includes(op.weapon)) op.weapon = op.weapons[0];
  delete op.prestadas;
}

// Rebaño mutante: al activar un Tzaangor, otro Tzaangor apostado a 2″ o menos y visible se activa a
// la vez (comparten `grupo`; src/ui/turno.js deja actuar a los dos).
const opcionesRebano = op => amigos(op).filter(o => aquelarre(o) && es(o, 'tzaangor') && o.ready && !o.grupo
  && !(o.used && o.used.length) && opGap(o, op) <= 2 + 1e-9 && ven(op, o));
registrarDisparador({
  id: 'rebano', ardid: 'Rebaño mutante', momento: 'inicioActivacion',
  quien: ctx => ctx.op.team,
  condicion: ctx => aquelarre(ctx.op) && es(ctx.op, 'tzaangor') && !ctx.op.grupo && opcionesRebano(ctx.op).length > 0,
  efecto: async ctx => {
    const R = T.ardidesAD.rebano, op = ctx.op, ops = opcionesRebano(op);
    const id = await elegirOpcion({ titulo: R.titulo, quien: op.name, texto: R.texto(op.name), porDefecto: null,
      opciones: ops.map(o => ({ id: o.id, etiqueta: o.name })) });
    const otro = ops.find(o => o.id === id);
    if (!otro) return;
    op.grupo = otro.grupo = `r${tray.tp}-${op.id}`;
    registro(R.log(op.name, otro.name));
  },
});

/* ---------- Equipo de facción del Aquelarre Disforme ----------
 * tray.equipoFaccion[bando] = ids elegidos al armar el comando: 'balas', 'faucesdaemonicas', 'tunicas'
 * ('pergaminos' queda pendiente: depende de los Dones de Tzeentch).
 * Balas hechizadas: bólteres infierno, pistolas bólter infierno y pistolas automáticas, Devastadora 1.
 * Armas faucesdaemónicas: armas de combate de los Marines Rúbrica, +1 Ataque; al contraatacar, Certera 1.
 * Túnicas arcanas: una vez por PI y agente, un dado de ataque que va a hacer daño crítico a un
 * Hechicero hace daño normal. */
const equipo = (s, id) => !!(tray && tray.equipoFaccion && (tray.equipoFaccion[s] || []).includes(id));
const BALAS = ['Bólter infierno', 'Pistola bólter infierno', 'Pistola automática'];
ajustesArma.push((w, a, b, modo) => {
  if (!w || !a || !aquelarre(a)) return w;
  if (modo === 'disparo' && w.type === 'R' && BALAS.includes(w.name) && equipo(a.team, 'balas') && !tiene(w, 'Devastating'))
    return { ...w, rules: [...w.rules, 'Devastating 1'] };
  if ((modo === 'combate' || modo === 'contraataque') && w.type === 'M' && es(a, 'rubrica') && equipo(a.team, 'faucesdaemonicas')) {
    const x = { ...w, rules: [...w.rules], atk: w.atk + 1 };
    if (modo === 'contraataque' && !tiene(x, 'Accurate')) x.rules.push('Accurate 1');
    return x;
  }
  return w;
});
registrarDisparador({
  id: 'tunicas', ardid: 'Túnicas arcanas', momento: 'recibirDano', gratis: true,
  quien: ctx => ctx.b.team,
  condicion: ctx => hechicero(ctx.b) && equipo(ctx.b.team, 'tunicas') && ctx.b.tunicaTP !== tray.tp && (ctx.criticos || 0) > 0 && ctx.w.dmgC > ctx.w.dmgN,
  efecto: ctx => {
    ctx.b.tunicaTP = tray.tp;
    ctx.r.dmg = Math.max(0, ctx.r.dmg - (ctx.w.dmgC - ctx.w.dmgN)); ctx.r.notes.push('tunicas');
    registro(T.ardidesAD.tunicas.log(ctx.b.name));
  },
});

/* ---------- Habilidades de ficha del Aquelarre Disforme ----------
 * Autómata hechizado (Marines Rúbrica): al activarse, su LPA baja 1 hasta el final de la activación,
 * salvo que haya un Hechicero amigo a 9″ o menos (panels.js, iniciarActivacion).
 * Lento y decidido (Combatiente Rúbrica): al disparar sin haber Cargado ni Reposicionado en la
 * activación, o al reaccionar, sus armas a distancia tienen Incesante.
 * Estandarte del rebaño (Portaicono Tzaangor): un dado de ataque normal de 3 o más contra un
 * Tzaangor amigo a 3″ o menos de él y visible para él hace 1 menos. */
export const automataSinHechicero = op => aquelarre(op) && es(op, 'rubrica')
  && !amigos(op).some(o => hechicero(o) && opGap(o, op) <= 9 + 1e-9);
ajustesArma.push((w, a, b, modo) => {
  if (modo !== 'disparo' || !w || w.type !== 'R' || !a || !aquelarre(a) || perfil(a).clave !== 'combatienteRubrica') return w;
  const movio = (a.used || []).some(u => u === 'reposition' || u === 'charge');
  if ((movio && !a.reaccion) || tiene(w, 'Ceaseless')) return w;
  return { ...w, rules: [...w.rules, 'Ceaseless'] };
});
reduceNormal.push(b => !!b && aquelarre(b) && es(b, 'tzaangor')
  && amigos(b).some(o => aquelarre(o) && perfil(o).clave === 'portaiconoTzaangor' && opGap(o, b) <= 3 + 1e-9 && ven(o, b)) ? 1 : 0);

/* ---------- Ardides de tiroteo de los Ángeles de la Muerte ----------
 * Ajustar doctrina: durante la activación de un Ángel (al empezar o al terminar), si usaste Doctrina de
 *   combate este punto de inflexión, cambias la doctrina elegida.
 * Fisiología transhumana: al disparar a un Ángel amigo, tras tirar la defensa, un éxito normal se guarda
 *   como crítico (ctx.what.fisiologia; lo lee el ajuste de defensa de abajo).
 * Asalto de choque: al combatir un Ángel que Cargó en esta activación, su arma tiene Choque y su primer
 *   golpe de la secuencia hace 1 más (hasta 7).
 * Ira de venganza: al reaccionar un Ángel, una acción de 1 PA más, gratis y distinta (con Relicarios del
 *   capítulo y orden de trabarse, cuesta 0 PM).
 * Equipo de facción (tray.equipoFaccion[bando]): 'sellos', 'relicarios', 'escudos', 'auspex'. */
const ADOC = { devastadora: 'Devastadora', tactica: 'Táctica', asalto: 'Asalto' };
for (const momento of ['inicioActivacion', 'finActivacion']) registrarDisparador({
  id: 'ajustar-' + momento, ardid: 'Ajustar doctrina', momento,
  quien: ctx => ctx.op.team,
  condicion: ctx => angeles(ctx.op) && ctx.op.alive && activo(ctx.op.team, ARDID.doctrina),
  efecto: async ctx => {
    const A = T.ardidesAM.ajustar, s = ctx.op.team;
    const id = await elegirOpcion({ titulo: A.titulo, quien: ctx.op.name, texto: A.texto(ADOC[doctrina(s)]), porDefecto: null,
      opciones: DOCTRINAS.filter(d => d !== doctrina(s)).map(d => ({ id: d, etiqueta: ADOC[d] })) });
    if (!id) return;
    elegirDoctrina(s, id);
    registro(A.log(ctx.op.name, ADOC[id]));
  },
});
registrarDisparador({
  id: 'fisiologia', ardid: 'Fisiología transhumana', momento: 'trasDefensa',
  quien: ctx => ctx.b.team,
  condicion: ctx => angeles(ctx.b) && ctx.w.type === 'R' && ctx.r.dfn.norm > 0,
  efecto: ctx => { ctx.what.fisiologia = true; },
});
ajustesDefensa.push((dfn, b, w, ctx) => ctx && ctx.what && ctx.what.fisiologia && angeles(b) && dfn.norm > 0
  ? { norm: dfn.norm - 1, crit: dfn.crit + 1, nota: 'fisiologia' } : null);
registrarDisparador({
  id: 'choque', ardid: 'Asalto de choque', momento: 'combatir',
  quien: ctx => ctx.a.team,
  condicion: ctx => angeles(ctx.a) && (ctx.a.used || []).includes('charge') && !ctx.a.reaccion,
  efecto: ctx => {
    const p = ctx.est.pools[0];
    if (!tiene(p.w, 'Shock')) { p.w = { ...p.w, rules: [...p.w.rules, 'Shock'] }; ctx.est.wa = p.w; }
    p.plus1 = true;
  },
});
registrarDisparador({
  id: 'ira', ardid: 'Ira de venganza', momento: 'reaccion',
  quien: ctx => ctx.op.team,
  coste: ctx => equipo(ctx.op.team, 'relicarios') && ctx.op.order === 'engage' ? 0 : 1,
  condicion: ctx => angeles(ctx.op),
  efecto: ctx => { ctx.op.ap += 1; ctx.op.iraTP = tray.tp; registro(T.ardidesAM.ira(ctx.op.name)); },
});

// Sellos de pureza (una vez por PI para el comando): con 2 o más fallos entre los dados de ataque de un
// Ángel, descarta uno y guarda otro como éxito normal. Cambia `dice` en el lugar; true si lo usó.
export function aplicarSellos(op, dice, hit, rules) {
  if (!tray || !angeles(op) || !equipo(op.team, 'sellos') || (tray.sellos && tray.sellos[op.team] === tray.tp)) return false;
  const cd = critDesde(rules), exito = v => v !== 1 && (v >= cd || v >= hit);
  const fallos = dice.map((v, i) => exito(v) ? -1 : i).filter(i => i >= 0);
  if (fallos.length < 2) return false;
  dice[fallos[0]] = hit; dice.splice(fallos[1], 1);
  tray.sellos = tray.sellos || [null, null]; tray.sellos[op.team] = tray.tp;
  registro(T.ardidesAM.sellos(op.name));
  return true;
}
// Escudos decorativos (una vez por PI): tras tirar el rival sus dados en un combate de un Ángel, sin
// repeticiones aún, sus dados menores que 6 no pueden guardarse como críticos (Letal, Desgarradora, Severa).
registrarDisparador({
  id: 'escudos', ardid: 'Escudos decorativos', momento: 'trasAtaqueCombate', gratis: true,
  quien: ctx => ctx.angel.team,
  condicion: ctx => angeles(ctx.angel) && equipo(ctx.angel.team, 'escudos') && !(tray.escudos && tray.escudos[ctx.angel.team] === tray.tp),
  efecto: ctx => {
    tray.escudos = tray.escudos || [null, null]; tray.escudos[ctx.angel.team] = tray.tp;
    const r = 1 - ctx.k, L = ctx.lados[r];
    const w2 = { ...L[4], rules: L[4].rules.filter(x => !/^Lethal\b|^Rending$|^Severe$/.test(x)) };
    L[4] = w2; ctx.est.pools[r].w = w2; if (r === 0) ctx.est.wa = w2; else ctx.est.wb = w2;
    Object.assign(L[2], clasificarAtaque(L[2].dice, L[3], w2.rules));
    ctx.est.pools[r].crit = L[2].crit; ctx.est.pools[r].norm = L[2].norm + (ctx.est.acc[r] || 0);
    registro(T.ardidesAM.escudos(ctx.angel.name));
  },
});
// Auspex (una vez por PI): al elegir blanco con una acción de Disparar, hasta el final de la activación
// los enemigos a 8″ o menos de ese agente no pueden estar ofuscados.
registrarDisparador({
  id: 'auspex', ardid: 'Auspex', momento: 'elegirBlanco', gratis: true,
  quien: ctx => ctx.a.team,
  condicion: ctx => angeles(ctx.a) && equipo(ctx.a.team, 'auspex') && !(tray.auspex && tray.auspex[ctx.a.team] === tray.tp)
    && !!ctx.shot.obscured && opGap(ctx.a, ctx.b) <= 8 + 1e-9,
  efecto: ctx => {
    tray.auspex = tray.auspex || [null, null]; tray.auspex[ctx.a.team] = tray.tp;
    ctx.a.auspexTP = tray.tp; ctx.a.auspexAct = ctx.a.activaciones || 0;
    registro(T.ardidesAM.auspex(ctx.a.name));
  },
});
export const auspexVale = (a, b) => !!a && a.auspexTP === (tray && tray.tp) && a.auspexAct === (a.activaciones || 0) && opGap(a, b) <= 8 + 1e-9;

/* ---------- Pergaminos de hechicería (equipo de facción del Aquelarre) ----------
 * Una vez por batalla, al activarse o reaccionar un Hechicero amigo: cambia su Don de Tzeentch por otro
 * que no tenga ningún Hechicero amigo; lo conserva hasta el final de la batalla. tray.pergaminos[bando] = true. */
for (const momento of ['inicioActivacion', 'reaccion']) registrarDisparador({
  id: 'pergaminos-' + momento, ardid: 'Pergaminos de hechicería', momento, gratis: true,
  quien: ctx => ctx.op.team,
  condicion: ctx => hechicero(ctx.op) && ctx.op.alive && equipo(ctx.op.team, 'pergaminos') && !(tray.pergaminos && tray.pergaminos[ctx.op.team])
    && donesLibres(ctx.op).length > 0,
  efecto: async ctx => {
    const P = T.pergaminos, op = ctx.op, libres = donesLibres(op);
    const id = await elegirOpcion({ titulo: P.titulo, quien: op.name, texto: P.texto, porDefecto: null,
      opciones: libres.map(d => ({ id: d.id, etiqueta: d.nombre })) });
    if (!id) return;
    tray.pergaminos = tray.pergaminos || [false, false]; tray.pergaminos[op.team] = true;
    op.opciones = { ...op.opciones, dones: id };
    ajustarAgente(op);
    registro(P.log(op.name, libres.find(d => d.id === id).nombre));
  },
});
// los Dones que puede tomar `op`: distintos del suyo y de los de otros Hechiceros amigos, y con efecto en la app
function donesLibres(op) {
  const el = (KINDS[op.kind] && comandoDe(op) || {}).elecciones || [];
  const dones = (el.find(e => e.id === 'dones') || { opciones: [] }).opciones;
  const tomados = new Set(OPS.filter(o => o.team === op.team && o.alive && o.opciones).map(o => o.opciones.dones));
  return dones.filter(d => !d.pendiente && !tomados.has(d.id));
}
const comandoDe = op => comandoPorId(perfil(op).comando);
