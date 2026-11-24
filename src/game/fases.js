/**
 * Motor de partida (sin DOM): la fase de estrategia de cada punto de inflexión.
 * Fuente: Reglas breves de Kill Team (2024), en nuestras palabras.
 *
 * - Iniciativa: cada jugador tira 1D6; quien saca más decide quién tiene la iniciativa.
 *   Empate: decide el jugador que NO tiene la iniciativa en ese momento; en el primer punto
 *   de inflexión nadie la tiene, así que se vuelve a tirar.
 * - Puntos de mando: se empieza la batalla con 2 PM. En el primer punto de inflexión cada
 *   jugador gana 1 PM; en los siguientes, quien tiene la iniciativa gana 1 y el otro 2.
 * - Ardides de estrategia: cuestan 1 PM y cada uno se usa como mucho una vez por punto de
 *   inflexión.
 *
 * Es el comienzo de src/game/: la IA (docs/IA.md) consultará estas mismas reglas.
 */

export const PM_INICIALES = 2;
export const COSTE_ARDID = 1;
export const PUNTOS_DE_INFLEXION = 4;

// Quién decide la iniciativa tras la tirada: 0, 1, o null si hay que volver a tirar.
// dados = [D6 del bando 0, D6 del bando 1]; ini = quién tiene la iniciativa ahora (o null).
export function quienDecide(dados, ini) {
  const [a, b] = dados;
  if (a > b) return 0;
  if (b > a) return 1;
  return ini === 0 || ini === 1 ? 1 - ini : null;
}

// PM que gana cada bando al empezar el punto de inflexión `tp` (1–4), con la iniciativa en `ini`.
export function pmDelPI(tp, ini) {
  if (tp <= 1) return [1, 1];
  return ini === 0 ? [1, 2] : ini === 1 ? [2, 1] : [1, 1];
}

// ¿Puede el bando s usar este ardid ahora? (tiene PM y no lo usó en este punto de inflexión)
export function puedeUsarArdid(cp, usados, s, nombre, coste = COSTE_ARDID) {
  return cp[s] >= coste && !(usados[s] || []).includes(nombre);
}

export const tirarD6 = (rng = Math.random) => 1 + Math.floor(rng() * 6);
