/**
 * Equipo del comando (sin DOM): el catálogo y las reglas de la elección.
 * Cada jugador elige hasta 4 opciones de equipo, mezclando universal y de facción, y no puede repetir
 * ninguna. Las opciones sin efecto implementado todavía llevan `pendiente: true` (se pueden elegir, la
 * pantalla avisa de que aún no hacen nada). Los textos están en src/i18n/es.js (T.equipo).
 */
export const MAX_EQUIPO = 4;

// Universal (todos los comandos). `cant`: cuántos elementos trae la opción.
export const UNIVERSAL = [
  { id: 'deposito', pendiente: true },
  { id: 'alambre', pendiente: true },
  { id: 'comunicaciones', pendiente: true },
  { id: 'minas', pendiente: true },
  { id: 'barricadasLigeras', cant: 2, pendiente: true },
  { id: 'barricadaPesada', pendiente: true },
  { id: 'barricadaPortatil', pendiente: true },
  { id: 'escaleras', cant: 2, pendiente: true },
  { id: 'granadasEspeciales', cant: 2, pendiente: true },
  { id: 'granadasExplosivas', cant: 2, pendiente: true },
  { id: 'cargaDemolicion', pendiente: true },
];

// De facción, por id del comando (src/data/teams)
const FACCION = {
  '3348897103': [{ id: 'balas' }, { id: 'faucesdaemonicas' }, { id: 'tunicas' }, { id: 'pergaminos' }],   // Aquelarre Disforme
  '3272457903': [{ id: 'puntas' }, { id: 'escudosEstegadon' }, { id: 'plumas' }, { id: 'idolo' }, { id: 'tambores', pendiente: true }],   // Saurios de Lustria
  '2272196183': [{ id: 'sellos' }, { id: 'relicarios' }, { id: 'escudos' }, { id: 'auspex' }],                              // Ángeles de la Muerte
};

export const equipoDeFaccion = comando => (comando && FACCION[comando.id]) || [];
export const todoElEquipo = comando => [...equipoDeFaccion(comando).map(e => ({ ...e, faccion: true })), ...UNIVERSAL];
export const esDeFaccion = (comando, id) => equipoDeFaccion(comando).some(e => e.id === id);

// ¿Se puede añadir `id` a lo ya elegido? -> { ok: true } o { ok: false, motivo }
export function puedeElegir(comando, elegidos, id) {
  if (elegidos.includes(id)) return { ok: false, motivo: 'repetido' };
  if (!todoElEquipo(comando).some(e => e.id === id)) return { ok: false, motivo: 'desconocido' };
  if (elegidos.length >= MAX_EQUIPO) return { ok: false, motivo: 'lleno' };
  return { ok: true };
}
// Alterna una opción (la quita si ya estaba). Devuelve la lista nueva.
export function alternarEquipo(comando, elegidos, id) {
  if (elegidos.includes(id)) return elegidos.filter(x => x !== id);
  return puedeElegir(comando, elegidos, id).ok ? [...elegidos, id] : elegidos;
}
// Lo que se guarda en tray.equipoFaccion: las opciones de facción elegidas (los efectos de ardides.js las leen)
// y, aparte, en tray.equipoUniversal, las universales.
export const separar = (comando, elegidos) => ({
  faccion: elegidos.filter(id => esDeFaccion(comando, id)),
  universal: elegidos.filter(id => !esDeFaccion(comando, id)),
});
