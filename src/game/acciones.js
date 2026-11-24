/**
 * Motor de partida (sin DOM): qué acciones puede hacer un agente en su activación.
 * Fuente: Reglas breves de Kill Team (2024), con nuestras palabras. Es la base de la IA
 * (docs/IA.md) y del modo aprendizaje ("no puedes Cargar con orden de ocultarse").
 *
 * Identificadores de acción (los mismos que op.used): reposition, dash, fallBack, charge,
 * shoot, fight. Cada consulta devuelve {ok, motivo}; motivo es un código que la interfaz
 * traduce (src/i18n/es.js, T.reglas.motivo).
 *
 * `ops` debe ser la lista de agentes de la partida (OPS de src/engine/world.js): el motor de
 * disparos (shotsFrom) consulta esa misma lista para buscar blancos válidos.
 *
 * Simplificación: la zona de control se mide solo por distancia (1″ entre peanas); la regla
 * pide además que el enemigo sea visible. La Reacción y las reglas de arma que cambian lo que
 * se puede hacer (salvo Silenciosa y Pesada) quedan para después.
 */
import { CTRL, WPN } from '../config.js';
import { opGap } from '../engine/geometry.js';
import { SHOT_KINDS, shotsFrom } from '../engine/shots.js';
import { regla } from '../engine/dice.js';
import { esArmaBolter } from '../data/teams/index.js';
import { KINDS } from '../engine/world.js';

// Reglas de arma que deciden si se puede disparar a un blanco:
// Alcance x (como mucho x″ entre peanas) y Buscadora (un blanco con orden de ocultarse no
// puede usar el terreno para estar a cubierto: se le puede disparar, conserva su salvación;
// Buscadora (Ligero), solo si su cobertura es ligera).
export const alcanceArma = w => { const v = regla(w && w.rules, "Range"); return typeof v === "number" ? v : Infinity; };
export const buscadoraAplica = (w, sh) => !!w && sh.kind === "concealed"
  && (regla(w.rules, "Seek") === true || ((w.rules || []).includes("Seek Light") && !sh.sight.hardCover));
export const blancoValidoCon = (w, sh) => (SHOT_KINDS[sh.kind].valid || buscadoraAplica(w, sh)) && sh.range <= alcanceArma(w) + 1e-9;
// Limitada x: usos por batalla de cada arma (op.usos)
export const agotada = (op, k) => { const v = regla(WPN[k] && WPN[k].rules, "Limited"); return typeof v === "number" && ((op.usos || {})[k] || 0) >= v; };

export const COSTE = { reposition: 1, dash: 1, fallBack: 2, charge: 1, shoot: 1, fight: 1 };
export const ACCIONES = Object.keys(COSTE);

// Astartes (Aquelarre Disforme): un Astartes Herejes puede Disparar dos veces o Combatir dos veces
// en su activación (no las dos cosas dos veces). Si dispara dos veces con un arma pesada (cañón
// cosechaalmas, lanzallamas disforme), el segundo disparo cuesta 1 PA más. No puede usar la misma
// arma PSÍQUICA a distancia dos veces en una activación. Además puede reaccionar con cualquier orden.
// Ángeles de la Muerte (astartesBolter): si dispara dos veces, al menos un disparo con un arma
// bólter; y el segundo cuesta 1 PA más solo si los dos son con la misma arma pesada (rifle bólter
// de francotirador, bólter pesado; sus modos cuentan como la misma arma).
export const esAstartes = op => !!(op && KINDS[op.kind] && KINDS[op.kind].astartes);
const conBolter = op => !!(op && KINDS[op.kind] && KINDS[op.kind].astartesBolter);
const armaBase = w => w ? w.name.replace(/ (.*)$/, "") : "";
const primerDisparo = op => WPN[(op.disparadas || [])[0]];
const veces = (op, a) => (op.used || []).filter(x => x === a).length;
const sinDon = k => (k || "").split("~")[0];
// Lo que cuesta la acción ahora (con el arma en mano, o `wk`)
// Reglas que cambian lo que cuesta una acción (p. ej. Móviles): (op, accion, coste) => coste nuevo | undefined
export const ajustesCoste = [];
// Reglas que dejan Cargar estando en la zona de control de un enemigo: (op) => true
export const cargarTrabado = [];
export function costeAccion(op, accion, wk = op && op.weapon) {
  const w = WPN[wk];
  for (const f of ajustesCoste) { const c = f(op, accion, COSTE[accion]); if (c !== undefined) return c; }
  if (accion === "shoot" && esAstartes(op) && veces(op, "shoot") >= 1 && w && w.recargaAstartes
    && (!conBolter(op) || armaBase(primerDisparo(op)) === armaBase(w))) return COSTE.shoot + 1;
  return COSTE[accion];
}
// ¿Ya hizo esta acción todas las veces que puede en esta activación?
function yaHecha(op, accion) {
  const n = veces(op, accion);
  if (!n) return false;
  if (op.reaccion || !esAstartes(op) || (accion !== "shoot" && accion !== "fight")) return true;
  const otra = accion === "shoot" ? "fight" : "shoot";
  return n >= 2 || veces(op, otra) >= 2;
}
const MOVIMIENTOS = ["reposition", "dash", "fallBack", "charge"];

export const enemigos = (op, ops) => ops.filter(o => o.alive && o.team !== op.team);
// enemigos dentro de su zona de control
export const enZonaDeControl = (op, ops) => enemigos(op, ops).filter(o => opGap(op, o) <= CTRL + 1e-9);

const armas = op => (op.weapons || []).map(k => WPN[k]).filter(Boolean);
const tieneRegla = (w, nombre) => w.rules.some(r => r === nombre || r.startsWith(nombre + " "));

// ¿Puede `op` hacer `accion` ahora? -> {ok: true} o {ok: false, motivo}
export function puede(op, accion, ops) {
  const no = motivo => ({ ok: false, motivo });
  if (!op || !op.alive) return no("fuera");
  if (!op.ready) return no("usado");
  if (!(accion in COSTE)) return no("desconocida");
  // Plan caprichoso: una acción libre de Correr, aunque otra acción lo impidiera (no en zona de control)
  if (accion === "dash" && op.gratisCorrer && enZonaDeControl(op, ops).length === 0) return { ok: true };
  if (yaHecha(op, accion)) return no("yaHecha");
  if ((op.ap ?? op.apl) < costeAccion(op, accion)) return no("sinPA");
  const usado = a => (op.used || []).includes(a);
  const trabado = enZonaDeControl(op, ops).length > 0;
  // un arma Pesada: si ya disparó con ella, no se mueve (salvo el movimiento que la regla permita)
  const pesadaUsada = usado("shoot") && armas(op).some(w => w === WPN[op.weapon] && tieneRegla(w, "Heavy"));
  switch (accion) {
    case "reposition":
      if (trabado) return no("enZonaDeControl");
      if (usado("charge") || usado("fallBack")) return no("yaCargoORetrocedio");
      if (pesadaUsada && !tieneRegla(WPN[op.weapon], "Heavy (Reposition only)")) return no("armaPesada");
      return { ok: true };
    case "dash":
      if (trabado) return no("enZonaDeControl");
      if (usado("charge")) return no("yaCargo");
      if (pesadaUsada && !tieneRegla(WPN[op.weapon], "Heavy (Dash only)")) return no("armaPesada");
      return { ok: true };
    case "fallBack":
      if (!trabado) return no("sinEnemigoEnZona");
      if (usado("reposition") || usado("charge")) return no("yaSeMovio");
      if (pesadaUsada) return no("armaPesada");
      return { ok: true };
    case "charge":
      if (op.order === "conceal") return no("ocultarse");
      if (trabado && !cargarTrabado.some(f => f(op))) return no("yaEnZona");
      if (usado("reposition") || usado("dash") || usado("fallBack")) return no("yaSeMovio");
      if (pesadaUsada) return no("armaPesada");
      return { ok: true };
    case "shoot": {
      const w = WPN[op.weapon];
      if (!w || w.type !== "R") return no("sinArmaDistancia");
      if (trabado) return no("enZonaDeControl");
      if (op.order === "conceal" && !tieneRegla(w, "Silent")) return no("ocultarse");
      // Pesada: no dispara si ya se movió en esta activación (salvo el movimiento permitido)
      if (tieneRegla(w, "Heavy")) {
        const permitido = tieneRegla(w, "Heavy (Reposition only)") ? "reposition" : tieneRegla(w, "Heavy (Dash only)") ? "dash" : null;
        if (MOVIMIENTOS.some(m => usado(m) && m !== permitido)) return no("armaPesada");
      }
      if (agotada(op, op.weapon)) return no("armaAgotada");
      if (tieneRegla(w, "PSYCHIC") && (op.disparadas || []).includes(sinDon(op.weapon))) return no("psiquicaRepetida");
      if ((op.vetadas || []).includes(op.weapon)) return no("psiquicaRepetida");   // Cábala psíquica: la usa otro agente
      if (conBolter(op) && !op.reaccion && veces(op, "shoot") === 1 && primerDisparo(op)
        && !esArmaBolter(primerDisparo(op)) && !esArmaBolter(w)) return no("sinBolter");
      const todos = shotsFrom({ x: op.x, y: op.y, z: op.z || 0, team: op.team, op });
      if (!todos.some(s => blancoValidoCon(w, s))) {
        // hay blancos válidos, pero ninguno al alcance del arma
        if (todos.some(s => SHOT_KINDS[s.kind].valid || buscadoraAplica(w, s))) return no("fueraDeAlcance");
        return no("sinBlanco");
      }
      return { ok: true };
    }
    case "fight":
      if (!trabado) return no("sinEnemigoEnZona");
      if (!armas(op).some(w => w.type === "M")) return no("sinArmaCombate");
      return { ok: true };
  }
  return no("desconocida");
}

// La orden (trabarse u ocultarse) se elige al empezar la activación, antes de la primera acción;
// mientras no haya hecho ninguna se puede volver a cambiar. Después queda fijada hasta su
// próxima activación.
export function puedeCambiarOrden(op) {
  if (!op || !op.alive) return { ok: false, motivo: "fuera" };
  if (!op.ready) return { ok: false, motivo: "usado" };
  // Ecos de la Disformidad: reaccionando con ese don, aún puede cambiar su orden antes de actuar
  if (op.reaccion && op.ecosActivo && !(op.used && op.used.length)) return { ok: true };
  if ((op.used && op.used.length) || (op.ap ?? op.apl) < op.apl) return { ok: false, motivo: "ordenFijada" };
  return { ok: true };
}

// Todas las acciones con su coste y si se pueden ahora (para la IA y para la interfaz).
export function accionesLegales(op, ops) {
  return ACCIONES.map(a => ({ accion: a, coste: costeAccion(op, a), ...puede(op, a, ops) }));
}

// A quién le toca activar: se alterna, empezando por quien tiene la iniciativa; si un bando no
// tiene agentes apostados, el otro sigue. ultimo = el bando que activó por última vez (o null
// al empezar la fase de tiroteo). Devuelve 0, 1 o null si el punto de inflexión terminó.
// Reaccionar: un agente usado, con orden de trabarse (un Astartes, con cualquiera), que no
// reaccionó en este punto de inflexión.
export const puedeReaccionar = o => o.alive && !o.ready && o.deployed !== false
  && (o.order === "engage" || esAstartes(o)) && !o.reacciono;

export function turnoDeActivacion(ops, ini, ultimo = null) {
  const apostados = s => ops.some(o => o.alive && o.team === s && o.ready);
  const quiere = ultimo === null ? (ini === 1 ? 1 : 0) : 1 - ultimo;
  if (apostados(quiere)) return quiere;
  // sin apostados, pero el rival sí: le toca igual si puede reaccionar (o pasar)
  if (apostados(1 - quiere) && ops.some(o => o.team === quiere && puedeReaccionar(o))) return quiere;
  if (apostados(1 - quiere)) return 1 - quiere;
  return null;
}
