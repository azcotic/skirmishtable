/**
 * Comandos con fichas reales (Fase 3b). Al arrancar, registrarComandos() añade sus perfiles a
 * las tablas que ya usa el motor: KINDS (atributos y armas de cada tipo de agente) y WPN (las
 * armas), con claves "<prefijo>.<clave>" (p. ej. "gn.visionario", "gn.pistolaBolter"). Así la
 * mesa, los dados, el protocolo en línea y las fichas los tratan como a cualquier agente.
 * Los dos navegadores de una partida en línea registran lo mismo al arrancar.
 */
import { KINDS, DEFAULT_ROSTER, ajustesAgente } from '../../engine/world.js';
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
    for (const [k, w] of Object.entries(c.armas)) WPN[`${c.prefijo}.${k}`] = { ...w, rules: [...w.rules],
      ...((c.armasPesadasAstartes || []).includes(k) ? { recargaAstartes: true } : {}) };
    for (const [k, a] of Object.entries(c.agentes))
      KINDS[`${c.prefijo}.${k}`] = { apl: a.apl, move: a.move, save: a.save, wounds: a.wounds,
        weapons: a.armas.map(w => `${c.prefijo}.${w}`), nombre: a.nombre, lider: !!a.lider, comando: c.id,
        astartes: !!a.astartes, clave: k };
  }
  ajustesAgente.push(aplicarOpciones);
}

/* ---------- Elecciones de facción ----------
 * Algunas reglas de facción piden elegir algo antes de la batalla (p. ej. los Dones de Tzeentch
 * del Aquelarre Disforme). Cada comando las declara en `elecciones`:
 *   { id, agentes: [claves de los agentes que eligen], unica: cada opción solo una vez por
 *     comando, opciones: [{ id, nombre, ...efecto }] }
 * Efectos que entiende la app: move (+″ al Movimiento); armas: { distancia | psiquicas |
 * unaPsiquica | combate: { anadir: [reglas], dmgN, sinOfuscar } }; ecos (ver reaccion.js);
 * pendiente: se puede elegir pero aún no hace nada. Las pantallas de inicio salen de aquí solas.
 * Cada agente guarda lo elegido en op.opciones = { [id de la elección]: id de la opción }.
 */
export const eleccionesDe = teamId => (comandoPorId(teamId) || {}).elecciones || [];
// las opciones elegidas por un agente, como objetos
export function opcionesDe(op) {
  const base = op && KINDS[op.kind], c = base && comandoPorId(base.comando);
  if (!c || !op.opciones) return [];
  return Object.entries(op.opciones).map(([e, o]) => {
    const el = (c.elecciones || []).find(x => x.id === e);
    return el && el.opciones.find(x => x.id === o);
  }).filter(Boolean);
}
export const tieneEfecto = (op, efecto) => opcionesDe(op).some(o => o[efecto]);
const esPsiquica = w => w.rules.includes("PSYCHIC");
// el arma `w` cambiada por la opción `d`, o null si no la toca
function armaConOpcion(w, d) {
  if (!d.armas) return null;
  const e = d.armas, cambio = (e.distancia && w.type === "R" && e.distancia)
    || (e.psiquicas && w.type === "R" && esPsiquica(w) && e.psiquicas)
    || (e.unaPsiquica && w.type === "R" && esPsiquica(w) && e.unaPsiquica)
    || (e.combate && w.type === "M" && e.combate);
  if (!cambio) return null;
  const nueva = { ...w, rules: [...w.rules] };
  // devArea: si ya tiene Devastadora x, pasa a ser con distancia ('2" Devastating x') en lugar de añadir otra
  const dv = cambio.devArea && nueva.rules.findIndex(r => /^Devastating \d+$/.test(r));
  if (cambio.devArea && dv >= 0) nueva.rules[dv] = `${cambio.devArea}" ${nueva.rules[dv]}`;
  for (const r of (cambio.devArea && dv >= 0 ? [] : cambio.anadir) || []) {
    const base = r.replace(/ \d+$/, "");
    if (!nueva.rules.some(x => x === r || x.startsWith(base + " ") || x === base)) nueva.rules.push(r);
  }
  if (cambio.dmgN) nueva.dmgN += cambio.dmgN;
  if (cambio.sinOfuscar) nueva.sinOfuscar = true;
  return nueva;
}
const sinOpcion = k => k.split("~")[0];
// Pone al agente los atributos y armas de sus opciones (op.opciones); sin ellas, los de su ficha.
// Se puede llamar las veces que haga falta: siempre parte de la ficha. Las armas cambiadas se
// registran con clave "<arma>~<opción>…" (p. ej. "ad.descargaFlujo~giro"); los dos navegadores
// de una partida en línea las crean igual.
export function aplicarOpciones(op) {
  const base = KINDS[op.kind];
  if (!base || !base.comando) return op;
  const ops = opcionesDe(op), yaUna = new Set();   // unaPsiquica: solo la primera arma psíquica
  const c = comandoPorId(base.comando), conEquipo = ops.find(d => d.equipo);
  const deFicha = conEquipo ? conEquipo.equipo.map(w => `${c.prefijo}.${w}`) : base.weapons;
  const armas = deFicha.map(k => {
    let w = WPN[k], ids = [];
    for (const d of ops) {
      if (d.armas && d.armas.unaPsiquica && yaUna.has(d.id)) continue;
      const nueva = armaConOpcion(w, d);
      if (!nueva) continue;
      if (d.armas.unaPsiquica) yaUna.add(d.id);
      w = nueva; ids.push(d.id);
    }
    if (!ids.length) return k;
    const clave = [k, ...ids].join("~");
    if (!WPN[clave]) WPN[clave] = w;
    return clave;
  });
  const enMano = op.weapon ? sinOpcion(op.weapon) : deFicha[0];
  op.weapons = armas;
  op.weapon = armas.find(k => sinOpcion(k) === enMano) || armas[0];
  op.move = base.move + ops.reduce((a, d) => a + (d.move || 0), 0);
  // un arma que da Salvación (Escudo: 4+) mejora la de su ficha
  op.save = Math.min(base.save, ...armas.map(k => (WPN[k] && WPN[k].salvacion) || 7));
  return op;
}
// el don (o null) de un agente, y si es Astartes Herejes (regla Astartes)
export const esAstartes = op => !!(KINDS[op.kind] && KINDS[op.kind].astartes);

// Agentes por comando cuando el comando no dice nada
export const TAM_COMANDO = 6;

/* ---------- composición del comando ---------- */
const comp = c => c.composicion || { selecciones: TAM_COMANDO };
// cuánto cuenta un agente: 1 selección, o ½ (p. ej. los Tzaangor del Aquelarre Disforme)
export const pesoAgente = (c, k) => (comp(c).medio || []).includes(k) ? 0.5 : 1;
export const seleccionesMax = c => comp(c).selecciones;
export const selecciones = (c, claves) => claves.reduce((a, k) => a + pesoAgente(c, k), 0);
const repetible = (c, k) => !comp(c).repetibles || comp(c).repetibles.includes(k);

// ¿Se puede añadir el agente `k` a `claves`? {ok, motivo: "lleno" | "unico" | null}
export function puedeAnadir(c, claves, k) {
  if (selecciones(c, claves) + pesoAgente(c, k) > seleccionesMax(c) + 1e-9) return { ok: false, motivo: "lleno" };
  if (!repetible(c, k) && claves.includes(k)) return { ok: false, motivo: "unico" };
  return { ok: true, motivo: null };
}
// ¿Cumple el comando sus reglas? Los problemas van como códigos (los textos, en es.js):
// ["faltan", n] · ["sobran", n] · ["requiere", nombre] · ["repetido", clave]
export function validarComando(c, claves) {
  const errores = [], usadas = selecciones(c, claves), max = seleccionesMax(c);
  if (usadas < max - 1e-9) errores.push(["faltan", max - usadas]);
  if (usadas > max + 1e-9) errores.push(["sobran", usadas - max]);
  for (const r of comp(c).requiere || [])
    if (claves.filter(k => r.claves.includes(k)).length < r.min) errores.push(["requiere", r.nombre]);
  for (const k of new Set(claves))
    if (!repetible(c, k) && claves.filter(x => x === k).length > 1) errores.push(["repetido", k]);
  return { ok: !errores.length, errores, usadas, max };
}

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
// por el del agente ("Tirador Marine Rúbrica (Cañón cosechaalmas)" para el Tirador Marine Rúbrica);
// si ya se usaron todos los de ese agente (dos combatientes y un solo modelo), se repite uno.
export function modelosPara(ops, team) {
  const usados = new Set(), picks = {};
  if (!team || !team.models) return picks;
  for (const op of ops) {
    const nombre = KINDS[op.kind] && KINDS[op.kind].nombre;
    if (!nombre) continue;
    const suyo = m => m.name === nombre || m.name.startsWith(nombre + " (");
    let i = team.models.findIndex((m, j) => !usados.has(j) && suyo(m));
    if (i < 0) i = team.models.findIndex(suyo);
    if (i >= 0) { usados.add(i); picks[op.id] = i; }
  }
  return picks;
}
