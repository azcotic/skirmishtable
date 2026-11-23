/**
 * Comandos con fichas reales (Fase 3b). Al arrancar, registrarComandos() añade sus perfiles a
 * las tablas que ya usa el motor: KINDS (atributos y armas de cada tipo de agente) y WPN (las
 * armas), con claves "<prefijo>.<clave>" (p. ej. "gn.visionario", "gn.pistolaBolter"). Así la
 * mesa, los dados, el protocolo en línea y las fichas los tratan como a cualquier agente.
 * Los dos navegadores de una partida en línea registran lo mismo al arrancar.
 */
import { KINDS, DEFAULT_ROSTER } from '../../engine/world.js';
import { WPN } from '../../config.js';
import garraNemesis from './garra-nemesis.js';
import aquelarreDisforme from './aquelarre-disforme.js';

export const COMANDOS = [garraNemesis, aquelarreDisforme];
export const comandoPorId = id => COMANDOS.find(c => c.id === id || (c.ids || []).includes(id)) || null;

let registrado = false;
export function registrarComandos() {
  if (registrado) return;
  registrado = true;
  for (const c of COMANDOS) {
    for (const [k, w] of Object.entries(c.armas)) WPN[`${c.prefijo}.${k}`] = { ...w, rules: [...w.rules] };
    for (const [k, a] of Object.entries(c.agentes))
      KINDS[`${c.prefijo}.${k}`] = { apl: a.apl, move: a.move, save: a.save, wounds: a.wounds,
        weapons: a.armas.map(w => `${c.prefijo}.${w}`), nombre: a.nombre, lider: !!a.lider, comando: c.id };
  }
}

// Agentes por comando (por ahora; las reglas de composición de cada comando vendrán después)
export const TAM_COMANDO = 6;

// Las definiciones [id, bando, nombre, tipo] de los agentes de un bando: los elegidos (claves de
// agente) o la plantilla de prueba; sin comando (fichas simples), los genéricos de siempre.
export function plantillaDefs(side, teamId, claves = null) {
  const c = comandoPorId(teamId);
  if (!c) return DEFAULT_ROSTER.filter(d => d[1] === side);
  const letra = side === 0 ? "A" : "B";
  const lista = (claves && claves.length ? claves : c.plantilla).filter(k => c.agentes[k]);
  return lista.map((k, i) => [letra + (i + 1), side, c.agentes[k].nombre, `${c.prefijo}.${k}`]);
}

// Un agente de muestra (para ver su ficha antes de elegirlo): como uno de la mesa, sin colocar.
export function agenteDeMuestra(side, teamId, clave) {
  const c = comandoPorId(teamId), k = c && `${c.prefijo}.${clave}`, p = k && KINDS[k];
  if (!p) return null;
  return { id: "＋", team: side, name: p.nombre, kind: k, apl: p.apl, ap: p.apl, move: p.move, save: p.save,
    wounds: p.wounds, maxW: p.wounds, weapons: [...p.weapons], weapon: p.weapons[0], alive: true, ready: true,
    deployed: false, used: [], order: "conceal" };
}

// El índice del modelo 3D de cada agente: el primer modelo libre del mod cuyo nombre empieza
// por el del agente ("Tirador Marine Rúbrica (Cañón cosechaalmas)" para el Tirador Marine Rúbrica).
export function modelosPara(ops, team) {
  const usados = new Set(), picks = {};
  if (!team || !team.models) return picks;
  for (const op of ops) {
    const nombre = KINDS[op.kind] && KINDS[op.kind].nombre;
    if (!nombre) continue;
    const i = team.models.findIndex((m, j) => !usados.has(j) && (m.name === nombre || m.name.startsWith(nombre + " (")));
    if (i >= 0) { usados.add(i); picks[op.id] = i; }
  }
  return picks;
}
