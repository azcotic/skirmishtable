// Integridad de los textos de la interfaz (src/i18n/es.js): nada vacío ni indefinido, sin
// voseo, y toda clave que usa index.html existe.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { G, REGLAS_ARMA, T, num, pl, pulg } from '../../src/i18n/es.js';
import { buscar, texto } from '../../src/i18n/aplicar.js';

// [ruta, valor] de cada hoja de T; las funciones se prueban con argumentos de ejemplo
function hojas(obj, pre = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? hojas(v, pre + k + '.') : [[pre + k, v]]);
}
// juegos de argumentos genéricos: se usa el primero que produce un texto limpio
const EJEMPLOS = [['Ash', 3, 2.5, 1], [3, 2.5, 1, 1], ['Ash', 'Slate', 3, 1], ['A1', true, 3, 1]];
const limpio = s => typeof s === 'string' && s.length > 0 && !/undefined|NaN|\[object/.test(s);
function probar(f) {
  let ultimo;
  for (const e of EJEMPLOS) { try { ultimo = f(...e.slice(0, f.length || 1)); if (limpio(ultimo)) return ultimo; } catch (err) { ultimo = `undefined (lanzó: ${err})`; } }
  return ultimo;
}
// funciones que reciben listas u otros tipos: sus argumentos de ejemplo
const ARGS = {
  'orden.boton': ['engage'],
  'disparo.secundarios': ['area', ['B1', 'B2']],
  'disparo.devArea': [4, 2, ['B1', 'A2']],
  'combateInt.bloqueo': ['crit', ['crit', 'norm']],
  'orden.botonFijo': ['conceal'],
  'orden.titulo': ['engage'],
  'orden.log': ['A1', 'conceal'],
  'orden.ayuda': ['A1', 'engage'],
  'estrategia.logIni': ['Ash', 1, 2, 'Ash', 'Slate'],
  'ficha.reglas': [['Ceaseless', 'Lethal']],
  'mover.contra': [['B1', 'B2']],
  'mover.incluye': [['trepando 2″']],
  'mover.enZona': ['A1', ['B1']],
  'mover.cargo': ['A1', ['B1', 'B2']],
  'mover.etiqueta': ['reposition', 4, 6],
  'mover.etiquetaDoble': ['reposition', 6, 'dash', 2, 3],
  'mover.log': ['A1', 'dash', 3, 3, ''],
  'mover.logDoble': ['A1', 'reposition', 6, 'dash', 2, ''],
  'mover.soltar': ['A1', 'charge', 'medida exacta', 1, true],
  'disparo.log': ['A1', 'B1', 'Bólter', '6 4', '3', true, 3, ['Accurate 1', 'cover save banked']],
  'combate.log': ['A1', 'B1', '6 4', '5 2', 2, 0],
  'repeticion.ctxAtaque': [2, 6, 1, 5, 'Campeón', 5, true],
  'repeticion.ctxDefensa': ['Aullador', 2, 5, 1, 4, 0, 9, 5, 4],
  'repeticion.ctxCombate': [2, 5, 1, 4, 14, 'Campeón', 1, 5, 0, 4, 10],
  'hud.aria': ['A1', 'Vekk', 'Apostado', 10, 14],
  'hud.hizo': [['reposition', 'shoot']],
  'operaciones.puntos': ['Ash', 2, 0, 3, 5],
  'ia.plan.disparar': ['A3 Tirador', 'B4 Portaicono', 'Rifle', 7.7, 0.11],
  'ia.plan.moverYDisparar': ['A3 Tirador', 'B4 Portaicono', 'Rifle', 7.7, 0.11],
  'ia.plan.cargar': ['A5 Aullador', 'B6 Campeón', 9.1, 0.4, 3.2],
  'ia.plan.combatir': ['A5 Aullador', 'B6 Campeón', 9.1, 0.4, 3.2],
  'terreno.trepar': [2, 0, ['Reposicionarse', 'Cargar']],
  'partida.notaFina': ['Volkus AO 1', 30, 22, 'despliegue', 40, ''],
  'partida.notaMuros': ['Gallowdark', 30, 22, 'despliegue', 12, 2, 'fuente'],
};
// algunos textos son varias líneas (un array): se comprueban juntas
const unir = s => Array.isArray(s) ? s.join(' ') : s;
const valor = (v, ruta) => unir(typeof v !== 'function' ? v
  : ARGS[ruta] ? v(...ARGS[ruta]) : probar(v));

// conjugaciones de voseo que no deben aparecer nunca (el usuario lo considera inaceptable)
const VOSEO = /\b(vos|sos|tenés|querés|podés|sabés|hacé|tocá|arrastrá|seleccioná|elegí|ingresá|buscá|agregá|revisá|probá|mirá|dale|che)\b/i;

describe('es.js', () => {
  const todas = hojas(T);

  it('cada texto es un string no vacío, sin espacios al final ni dobles, ni "undefined"', () => {
    for (const [ruta, v] of todas) {
      const s = valor(v, ruta);
      expect(typeof s, ruta).toBe('string');
      expect(s.length, ruta).toBeGreaterThan(0);
      expect(s, ruta).toBe(s.trimEnd());            // un espacio inicial sí: hay fragmentos que se pegan a otra frase
      expect(s, ruta).not.toMatch(/\S  \S/);
      expect(s, ruta).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it('no hay voseo', () => {
    for (const [ruta, v] of todas) expect(valor(v, ruta), ruta).not.toMatch(VOSEO);
    for (const [k, g] of Object.entries(G)) expect(JSON.stringify(g), k).not.toMatch(VOSEO);
  });

  it('cada término del glosario tiene su forma en español e inglés', () => {
    for (const [k, g] of Object.entries(G)) {
      expect(g.es, k).toBeTruthy();
      expect(g.en, k).toBeTruthy();
    }
    expect(Object.values(REGLAS_ARMA).every(Boolean)).toBe(true);
  });

  it('formatea pulgadas con coma decimal y plurales', () => {
    expect(num(3)).toBe('3');
    expect(num(2.5)).toBe('2,5');
    expect(pulg(1.04)).toBe('1″');
    expect(pl(1, 'agente', 'agentes')).toBe('1 agente');
    expect(pl(4, 'agente', 'agentes')).toBe('4 agentes');
  });

  it('texto() falla con una clave inexistente', () => {
    expect(() => texto('app.noExiste')).toThrow(/app\.noExiste/);
    expect(buscar('app.opciones')).toBe('Opciones');
  });
});

describe('index.html', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');

  it('está declarado en español', () => {
    expect(html).toMatch(/<html lang="es">/);
  });

  it('cada clave data-t / data-t-title / data-t-aria existe en es.js', () => {
    const claves = [...html.matchAll(/data-t(?:-title|-aria)?="([^"]+)"/g)].map(m => m[1]);
    expect(claves.length).toBeGreaterThan(30);
    for (const c of claves) expect(() => texto(c, 'Ash'), c).not.toThrow();
  });
});
