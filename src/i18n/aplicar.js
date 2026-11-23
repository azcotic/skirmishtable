/**
 * Pone los textos de es.js en el HTML estático. Cada elemento indica su clave:
 *   data-t="bandeja.deshacer"         -> textContent
 *   data-t-title="bandeja.deshacerTitulo" -> title
 *   data-t-aria="mesa.tablero"         -> aria-label
 * Si el texto es una función de un equipo, data-t-equipo="0|1" le pasa su nombre.
 * data-t solo va en elementos hoja: reemplaza todo su contenido.
 */
import { T } from './es.js';
import { TEAMNAME } from '../config.js';

export const buscar = (clave, raiz = T) => clave.split('.').reduce((o, k) => (o == null ? undefined : o[k]), raiz);

// El texto de una clave; falla si no existe, para que un error de tipeo no llegue a la pantalla.
export function texto(clave, arg) {
  const v = buscar(clave);
  const s = typeof v === 'function' ? v(arg) : v;
  if (typeof s !== 'string' || !s) throw new Error(`Texto sin definir en es.js: ${clave}`);
  return s;
}

const DESTINOS = [
  ['t', (e, s) => { e.textContent = s; }],
  ['tTitle', (e, s) => { e.title = s; }],
  ['tAria', (e, s) => { e.setAttribute('aria-label', s); }],
];

export function aplicarTextos(raiz = document) {
  for (const [dato, poner] of DESTINOS) {
    const attr = 'data-' + dato.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
    for (const e of raiz.querySelectorAll(`[${attr}]`)) {
      const eq = e.closest('[data-t-equipo]');
      poner(e, texto(e.dataset[dato], eq ? TEAMNAME[+eq.dataset.tEquipo] : undefined));
    }
  }
}
