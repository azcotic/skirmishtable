/**
 * Quién controla cada bando y avisos entre módulos de la partida. No importa nada, a propósito:
 * lo pueden importar turno.js, panels.js, despliegue.js, inicio.js e ia.js sin crear ciclos de
 * módulos (un ciclo dejaba la app sin cargar).
 *
 *   ia:       el bando que lleva la computadora (0, 1) o null (dos humanos)
 *   jugando:  la IA está ejecutando su activación (sus acciones pasan los controles de turno)
 *   pausa:    ms entre los pasos de la IA, para que se vean
 *   alTerminarActivacion / alEmpezarTiroteo / alCambiarDespliegue: los pone ia.js
 */
export const control = {
  ia: null,
  jugando: false,
  pausa: 900,
  alTerminarActivacion: () => {},
  alEmpezarTiroteo: () => {},
  alCambiarDespliegue: () => {},
};
export const esDeLaIA = team => control.ia !== null && team === control.ia;
