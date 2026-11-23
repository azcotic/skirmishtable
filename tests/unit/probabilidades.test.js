// Probabilidades de un ataque (src/game/probabilidades.js): casos calculados a mano y que cada
// regla mueva el resultado en la dirección correcta.
import { describe, expect, it } from 'vitest';
import { combate, danoTrasBloqueos, disparo } from '../../src/game/probabilidades.js';

const arma = (extra = {}) => ({ atk: 4, hit: 3, dmgN: 3, dmgC: 4, rules: [], ...extra });
const blanco = { save: 3, heridas: 14 };

describe('disparo', () => {
  it('caso a mano: 1 dado a 4+, 3/4, contra un defensor sin dados (Penetración 3)', () => {
    // éxito normal (4, 5): 2/6 × 3; crítico (6): 1/6 × 4  →  10/6
    const r = disparo(arma({ atk: 1, hit: 4, rules: ['Piercing 3'] }), { save: 3, heridas: 3 });
    expect(r.esperado).toBeCloseTo(10 / 6, 6);
    expect(r.incapacitar).toBeCloseTo(3 / 6, 6);   // 3 o más de daño: cualquier éxito
  });
  it('las probabilidades suman 1', () => {
    const r = disparo(arma({ rules: ['Lethal 5+', 'Rending'] }), blanco, { cubierto: true });
    const total = [...r.distribucion.values()].reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 9);
  });
  it('cada regla mueve el daño hacia donde debe', () => {
    const base = disparo(arma(), blanco).esperado;
    expect(disparo(arma(), blanco, { cubierto: true }).esperado).toBeLessThan(base);
    expect(disparo(arma(), blanco, { ofuscado: true }).esperado).toBeLessThan(base);
    expect(disparo(arma({ rules: ['Lethal 5+'] }), blanco).esperado).toBeGreaterThan(base);
    expect(disparo(arma({ rules: ['Piercing 1'] }), blanco).esperado).toBeGreaterThan(base);
    expect(disparo(arma({ rules: ['Relentless'] }), blanco).esperado).toBeGreaterThan(base);
    expect(disparo(arma({ rules: ['Balanced'] }), blanco).esperado).toBeGreaterThan(base);
    expect(disparo(arma({ rules: ['Devastating 3'] }), blanco).esperado).toBeGreaterThan(base);
    expect(disparo(arma(), blanco, { lesionado: true }).esperado).toBeLessThan(base);
    expect(disparo(arma(), blanco, { certera: 2 }).esperado).toBeGreaterThan(base);
    // Saturación: la cobertura no salva
    expect(disparo(arma({ rules: ['Saturate'] }), blanco, { cubierto: true }).esperado).toBeCloseTo(base, 9);
  });
});

describe('bloqueos', () => {
  it('el defensor reparte sus éxitos para recibir el menor daño', () => {
    expect(danoTrasBloqueos(1, 1, 2, 0, 3, 4)).toBe(3);    // dos normales bloquean el crítico; queda un normal
    expect(danoTrasBloqueos(2, 0, 0, 1, 3, 4)).toBe(3);    // un crítico bloquea un normal
    expect(danoTrasBloqueos(0, 2, 1, 1, 3, 4)).toBe(4);    // el crítico de defensa al crítico; el normal no alcanza
  });
});

describe('combate', () => {
  it('devuelve el daño en las dos direcciones', () => {
    const r = combate(arma({ atk: 5, rules: ['Lethal 5+'] }), arma(), { heridas: 14 }, { heridas: 10 });
    expect(r.alBlanco.esperado).toBeGreaterThan(r.alAtacante.esperado);
    expect(r.alBlanco.incapacitar).toBeGreaterThan(0);
  });
});
