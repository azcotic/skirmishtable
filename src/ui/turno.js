/**
 * Activaciones alternas (Reglas breves): los jugadores se turnan; cada uno activa UN agente, hace
 * sus acciones y termina su activación ("Terminar activación"); entonces le toca al otro. Si un
 * bando ya no tiene agentes apostados, el otro sigue activando.
 *
 * Mientras un agente está en plena activación (ya se movió o gastó PA), ningún otro puede actuar.
 * Los agentes que no pueden actuar se pueden seleccionar para verlos, pero no moverse ni actuar.
 * Opción "Activaciones: libres" (⚙) para usar la mesa sin turnos (mesa de medir, tests e2e).
 */
import { T } from '../i18n/es.js';
import { TEAMNAME } from '../config.js';
import { KINDS, OPS } from '../engine/world.js';
import { enDespliegue } from '../engine/deploy.js';
import { turnoDeActivacion } from '../game/acciones.js';
import { options } from './options.js';
import { control, esDeLaIA } from './control.js';
// Sin importar panels.js ni despliegue.js: crearían un ciclo de módulos (board → hud → turno →
// panels → … → ops, que usa panels a medio cargar). panels.js nos presta el marcador y el
// último bando que activó con conectarTurno().
let fuente = { tray: { ini: null }, ultimo: () => null };
export const conectarTurno = f => { fuente = f; };
const despliegueActivo = () => enDespliegue(OPS);
const queEs = op => (KINDS[op.kind] && KINDS[op.kind].nombre) || op.name;

export const alternasObligatorias = () => options.activaciones !== "libres";

// el agente que está en plena activación (ya actuó y aún no terminó), o null
export const enActivacion = () => OPS.find(o => o.alive && o.ready && ((o.used && o.used.length) || o.ap < o.apl)) || null;

// a qué bando le toca activar (0, 1, o null si todos están usados)
export const bandoEnTurno = () => {
  const a = enActivacion();
  return a ? a.team : turnoDeActivacion(OPS, fuente.tray.ini ?? 0, fuente.ultimo());
};

// Por qué `op` no puede actuar ahora (texto para la pista), o null si puede.
export function porQueNoActua(op) {
  if (!op || !op.alive) return null;
  if (esDeLaIA(op.team) && !control.jugando) return T.ia.esDeLaIA;      // contra la computadora
  if (!alternasObligatorias() || despliegueActivo() || !op.ready) return null;
  const a = enActivacion();
  if (a && a !== op) return T.turno.terminaPrimero(`${a.id} ${queEs(a)}`);
  if (a) return null;
  const t = turnoDeActivacion(OPS, fuente.tray.ini ?? 0, fuente.ultimo());
  if (t !== null && op.team !== t) return T.turno.noEsTuTurno(TEAMNAME[t]);
  return null;
}
export const puedeActuar = op => !porQueNoActua(op);

// ¿Todos los agentes en la mesa están usados? Entonces toca "Fin del PI".
export const todosUsados = () => !despliegueActivo() && OPS.some(o => o.alive) && !OPS.some(o => o.alive && o.ready);

// La pista tras terminar una activación: a quién le toca ahora
export function pistaDeTurno() {
  if (!alternasObligatorias()) return null;
  const t = bandoEnTurno();
  if (t !== null && esDeLaIA(t)) return T.ia.pensando;
  return t === null ? T.turno.finPI : T.turno.siguiente(TEAMNAME[t]);
}
