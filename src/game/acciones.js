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

export const COSTE = { reposition: 1, dash: 1, fallBack: 2, charge: 1, shoot: 1, fight: 1 };
export const ACCIONES = Object.keys(COSTE);
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
  if ((op.ap ?? op.apl) < COSTE[accion]) return no("sinPA");
  if ((op.used || []).includes(accion)) return no("yaHecha");
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
      if (trabado) return no("yaEnZona");
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
      const blancos = shotsFrom({ x: op.x, y: op.y, z: op.z || 0, team: op.team, op }).filter(s => SHOT_KINDS[s.kind].valid);
      if (!blancos.length) return no("sinBlanco");
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
  if ((op.used && op.used.length) || (op.ap ?? op.apl) < op.apl) return { ok: false, motivo: "ordenFijada" };
  return { ok: true };
}

// Todas las acciones con su coste y si se pueden ahora (para la IA y para la interfaz).
export function accionesLegales(op, ops) {
  return ACCIONES.map(a => ({ accion: a, coste: COSTE[a], ...puede(op, a, ops) }));
}

// A quién le toca activar: se alterna, empezando por quien tiene la iniciativa; si un bando no
// tiene agentes apostados, el otro sigue. ultimo = el bando que activó por última vez (o null
// al empezar la fase de tiroteo). Devuelve 0, 1 o null si el punto de inflexión terminó.
export function turnoDeActivacion(ops, ini, ultimo = null) {
  const apostados = s => ops.some(o => o.alive && o.team === s && o.ready);
  const quiere = ultimo === null ? (ini === 1 ? 1 : 0) : 1 - ultimo;
  if (apostados(quiere)) return quiere;
  if (apostados(1 - quiere)) return 1 - quiere;
  return null;
}
