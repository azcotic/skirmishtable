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
import { CTRL } from '../config.js';
import { ajustesArma, ajustesDefensa, bloquear, ignoraLesion, ignoraSaturacion, reglasOp } from '../engine/dice.js';
import { ignoraAturdir } from '../engine/efectos.js';
import { ajustesCoste, cargarTrabado } from '../game/acciones.js';
import { esArmaBolter, opcionesDe } from '../data/teams/index.js';
import { KINDS, OPS } from '../engine/world.js';
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

const activo = (s, nombre) => !!(tray && tray.ardides && (tray.ardides[s] || []).includes(nombre));
const perfil = op => (op && KINDS[op.kind]) || {};
const aquelarre = op => perfil(op).comando === '3348897103';
const angeles = op => perfil(op).comando === '2272196183';
const es = (op, palabra) => (perfil(op).palabras || []).includes(palabra);
const amigos = op => OPS.filter(o => o.alive && o.deployed !== false && o.team === op.team && o.id !== op.id);
const tiene = (w, r) => w.rules.some(x => x === r || x.startsWith(r.replace(/ \d+$/, '') + ' '));

// El arma de `a` contra `b`, cambiada por los ardides activos (modo: "disparo" o "combate")
ajustesArma.push((w, a, b, modo) => {
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
export const elegirTacticas = (s, p, sec) => { tray.tacticas = tray.tacticas || [null, null]; tray.tacticas[s] = [p, sec]; };
export function elegirFlexible(s, t) { tray.flex = tray.flex || [null, null]; tray.flex[s] = t; }

reglasOp.push(op => {
  if (!angeles(op)) return null;
  return { duelista: tiene_(op, 'duelistas'), robusto: tiene_(op, 'robustos'), aura: perfil(op).clave === 'capitan' && !op.auraUsada };
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
    const opts = [[norm + 1, crit], [norm - 1, crit + 1]];
    if (ambas) opts.push([norm, crit + 1]);
    opts.sort((x, y) => dano(x[0], x[1]) - dano(y[0], y[1]));
    [norm, crit] = opts[0]; notas.push('sigilosos');
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
