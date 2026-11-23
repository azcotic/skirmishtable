// Operación de bajas: grado de bajas según los agentes enemigos al empezar (src/game/killop.js)
import { describe, expect, it } from 'vitest';
import { bonoFinal, faltanParaGrado, gradoDeBajas } from '../../src/game/killop.js';

describe('grado de bajas', () => {
  it('con 8 enemigos: 2 bajas grado 1, 3 bajas grado 2', () => {
    expect(gradoDeBajas(8, 1)).toBe(0);
    expect(gradoDeBajas(8, 2)).toBe(1);
    expect(gradoDeBajas(8, 3)).toBe(2);
    expect(gradoDeBajas(8, 8)).toBe(5);
    expect(faltanParaGrado(8, 3)).toBe(2);
    expect(faltanParaGrado(8, 8)).toBe(null);
  });
  it('5 y 14 enemigos, y fuera de la tabla', () => {
    expect(gradoDeBajas(5, 3)).toBe(3);
    expect(gradoDeBajas(14, 11)).toBe(4);
    expect(gradoDeBajas(3, 3)).toBe(3);     // se usa la fila de 5
  });
  it('el punto extra del final', () => {
    expect(bonoFinal([3, 2])).toEqual([1, 0]);
    expect(bonoFinal([2, 2])).toEqual([0, 0]);
  });
});
