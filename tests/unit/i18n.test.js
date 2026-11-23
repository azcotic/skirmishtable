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
const EJEMPLOS = ['Ash', 3, 2.5, 1];
const valor = v => typeof v === 'function' ? v(...EJEMPLOS.slice(0, v.length || 1)) : v;

// conjugaciones de voseo que no deben aparecer nunca (el usuario lo considera inaceptable)
const VOSEO = /\b(vos|sos|tenés|querés|podés|sabés|hacé|tocá|arrastrá|seleccioná|elegí|ingresá|buscá|agregá|revisá|probá|mirá|dale|che)\b/i;

describe('es.js', () => {
  const todas = hojas(T);

  it('cada texto es un string no vacío, sin espacios sobrantes ni "undefined"', () => {
    for (const [ruta, v] of todas) {
      const s = valor(v);
      expect(typeof s, ruta).toBe('string');
      expect(s.length, ruta).toBeGreaterThan(0);
      expect(s, ruta).toBe(s.trim());
      expect(s, ruta).not.toMatch(/undefined|NaN|\[object/);
    }
  });

  it('no hay voseo', () => {
    for (const [ruta, v] of todas) expect(valor(v), ruta).not.toMatch(VOSEO);
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
