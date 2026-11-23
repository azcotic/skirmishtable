/**
 * Operación de bajas (Kill Op): el grado de bajas de cada bando y sus puntos de victoria.
 * Puro: sin DOM, corre en Node.
 *
 * Cada bando empieza sin grado. Según cuántos agentes enemigos había al empezar la batalla,
 * hace falta incapacitar cierto número para llegar a cada grado (1 a 5):
 *   - cada grado nuevo vale 1 PV;
 *   - al final del 4.º punto de inflexión, el bando con el grado más alto suma 1 PV más.
 */

// fila: agentes enemigos al empezar (5 a 14); columnas: bajas necesarias para los grados 1 a 5
const TABLA = {
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 4, 5, 6],
  7: [1, 3, 4, 6, 7],
  8: [2, 3, 5, 6, 8],
  9: [2, 4, 5, 7, 9],
  10: [2, 4, 6, 8, 10],
  11: [2, 4, 7, 9, 11],
  12: [2, 5, 7, 10, 12],
  13: [3, 5, 8, 10, 13],
  14: [3, 6, 8, 11, 14],
};
export const GRADO_MAX = 5;

// las bajas necesarias para cada grado (fuera de la tabla, se usa la fila más cercana)
export const umbrales = inicial => TABLA[Math.max(5, Math.min(14, inicial | 0))];

// el grado de bajas alcanzado con `bajas` enemigos incapacitados de `inicial`
export const gradoDeBajas = (inicial, bajas) => umbrales(inicial).filter(u => bajas >= u).length;

// cuántas bajas faltan para el siguiente grado (null si ya está en el máximo)
export function faltanParaGrado(inicial, bajas) {
  const sig = umbrales(inicial).find(u => bajas < u);
  return sig === undefined ? null : sig - bajas;
}

// el punto extra del final: [0|1, 0|1] según quién tenga el grado más alto
export const bonoFinal = grados => grados[0] > grados[1] ? [1, 0] : grados[1] > grados[0] ? [0, 1] : [0, 0];
