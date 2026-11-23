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
import { ajustesArma, ajustesDefensa, ignoraLesion } from '../engine/dice.js';
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

// Doctrina de combate: la elegida por el bando (devastadora por defecto)
export const doctrina = s => (tray && tray.doctrina && tray.doctrina[s]) || 'devastadora';
export function elegirDoctrina(s, d) { tray.doctrina = tray.doctrina || [null, null]; tray.doctrina[s] = d; }

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
