// Fase de estrategia (src/game/fases.js): iniciativa, puntos de mando y ardides.
import { describe, expect, it } from 'vitest';
import { pmDelPI, puedeUsarArdid, quienDecide, tirarD6 } from '../../src/game/fases.js';

describe('iniciativa', () => {
  it('decide quien saca más', () => {
    expect(quienDecide([5, 2], null)).toBe(0);
    expect(quienDecide([1, 6], 0)).toBe(1);
  });
  it('empate: decide quien no tiene la iniciativa; en el primer PI, se vuelve a tirar', () => {
    expect(quienDecide([4, 4], 0)).toBe(1);
    expect(quienDecide([4, 4], 1)).toBe(0);
    expect(quienDecide([4, 4], null)).toBe(null);
  });
  it('un D6 da de 1 a 6', () => {
    expect(tirarD6(() => 0)).toBe(1);
    expect(tirarD6(() => 0.999)).toBe(6);
  });
});

describe('puntos de mando', () => {
  it('primer PI: 1 cada uno; después, 1 a quien tiene la iniciativa y 2 al otro', () => {
    expect(pmDelPI(1, 0)).toEqual([1, 1]);
    expect(pmDelPI(2, 0)).toEqual([1, 2]);
    expect(pmDelPI(3, 1)).toEqual([2, 1]);
  });
});

describe('ardides', () => {
  it('cuestan 1 PM y se usan una vez por punto de inflexión', () => {
    expect(puedeUsarArdid([1, 0], [[], []], 0, 'La caza negra')).toBe(true);
    expect(puedeUsarArdid([1, 0], [[], []], 1, 'La caza negra')).toBe(false);          // sin PM
    expect(puedeUsarArdid([3, 0], [['La caza negra'], []], 0, 'La caza negra')).toBe(false);   // ya usado
  });
});
