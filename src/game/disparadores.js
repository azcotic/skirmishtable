/**
 * Motor de disparadores de ardides de tiroteo (sin DOM).
 *
 * Cada ardid se declara como datos: su momento, su condición y su efecto. Al llegar el momento, la
 * interfaz pregunta `candidatos(...)` y muestra una ventana con los que se pueden usar: el bando
 * tiene PM, no usó ya ese ardid en este punto de inflexión y no pidió "No avisar".
 *
 * Momentos: inicioActivacion, antesAtaque, trasAtaque, antesDefensa, recibirDano, combatir,
 * moverCargar, finActivacion.
 *
 * El silencio ("No avisar hasta el próximo punto de inflexión") se guarda por bando y por ardid en
 * tray.silencio[bando] y se borra al empezar el siguiente punto de inflexión.
 */
import { puedeUsarArdid } from './fases.js';

export const MOMENTOS = ['inicioActivacion', 'antesAtaque', 'trasAtaque', 'antesDefensa', 'recibirDano', 'combatir', 'moverCargar', 'finActivacion'];

// La lista de disparadores: se llena desde src/ui/ardides.js con registrarDisparador.
// { id, ardid (nombre oficial), momento, quien(ctx) -> bando, condicion(ctx) -> bool,
//   efecto(ctx) -> void | texto del registro }
export const DISPARADORES = [];
export function registrarDisparador(d) {
  if (!MOMENTOS.includes(d.momento)) throw new Error(`Momento desconocido: ${d.momento}`);
  DISPARADORES.push(d);
  return d;
}

export const silenciado = (tray, s, ardid) => !!(tray.silencio && (tray.silencio[s] || []).includes(ardid));
export function silenciar(tray, s, ardid) {
  tray.silencio = tray.silencio || [[], []];
  if (!tray.silencio[s].includes(ardid)) tray.silencio[s].push(ardid);
}
export const limpiarSilencio = tray => { tray.silencio = [[], []]; };

// Los ardides que se pueden ofrecer ahora, agrupados en una sola ventana: [{ d, bando }]
// gratis: reglas de equipo, sin PM ni registro de ardid usado; su condicion decide cuándo están disponibles.
export function candidatos(tray, momento, ctx) {
  const usados = tray.ardidesT || [[], []];
  return DISPARADORES.filter(d => d.momento === momento).map(d => ({ d, bando: d.quien(ctx) }))
    .filter(({ d, bando }) => (bando === 0 || bando === 1)
      && (d.gratis || puedeUsarArdid(tray.cp, usados, bando, d.ardid))
      && !silenciado(tray, bando, d.ardid)
      && d.condicion(ctx));
}

// Activa un ardid: −1 PM y queda usado este punto de inflexión. Devuelve false si no se podía.
export function activar(tray, bando, ardid, gratis = false) {
  if (gratis) return true;
  tray.ardidesT = tray.ardidesT || [[], []];
  if (!puedeUsarArdid(tray.cp, tray.ardidesT, bando, ardid)) return false;
  tray.ardidesT[bando].push(ardid);
  tray.cp[bando] -= 1;
  return true;
}
