// Control de objetivos (src/engine/objetivos.js)
import { beforeEach, describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OBJECTIVES, OPS, buildWorld, mkOp } from '../../src/engine/world.js';
import { controlDe, controlDeTodos, enObjetivo, objetivoControladoPor, objetivosControlados } from '../../src/engine/objetivos.js';

registrarComandos();
let a, b, c;
beforeEach(() => {
  buildWorld({ name: 'test', w: 24, h: 12, objectives: [{ id: 'A', x: 10, y: 6 }, { id: 'B', x: 20, y: 6 }], terrain: [], spawns: [[[1, 1]], [[23, 11]]] });
  a = mkOp('A1', 0, 'a', 'gn.combatiente', 10, 6); b = mkOp('B1', 1, 'b', 'gn.combatiente', 20, 6); c = mkOp('B2', 1, 'c', 'gn.combatiente', 10.5, 6);
  OPS.length = 0; OPS.push(a, b, c);
});

describe('control de objetivos', () => {
  it('lo controla el bando con más LPA en su zona; con la misma, queda disputado', () => {
    expect(controlDe(OBJECTIVES[0]).controla).toBeNull();                 // a (bando 0) y c (bando 1), misma LPA
    c.alive = false;
    expect(controlDe(OBJECTIVES[0]).controla).toBe(0);
    expect(controlDe(OBJECTIVES[1]).controla).toBe(1);
    expect(objetivosControlados(0)).toBe(1);
    expect(objetivosControlados(1)).toBe(1);
  });
  it('suma la LPA: dos agentes de 2 LPA superan a uno de 3', () => {
    c.alive = true; const d = mkOp('B3', 1, 'd', 'gn.combatiente', 10, 7); OPS.push(d);
    a.apl = 3; c.apl = 2; d.apl = 2;
    expect(controlDe(OBJECTIVES[0]).apl).toEqual([3, 4]);
    expect(controlDe(OBJECTIVES[0]).controla).toBe(1);
  });
  it('un agente lejos no cuenta; uno sin desplegar tampoco', () => {
    c.alive = false; a.x = 14;
    expect(controlDe(OBJECTIVES[0]).controla).toBeNull();
    a.x = 10; a.deployed = false;
    expect(controlDe(OBJECTIVES[0]).controla).toBeNull();
  });
  it('mover: compara una jugada sin tocar la mesa', () => {
    c.alive = false; a.x = 3;
    expect(objetivosControlados(0)).toBe(0);
    expect(objetivosControlados(0, OPS, OBJECTIVES, { id: 'A1', x: 10, y: 6 })).toBe(1);
    expect(a.x).toBe(3);
  });
  it('objetivoControladoPor y enObjetivo', () => {
    c.alive = false;
    expect(objetivoControladoPor(a).id).toBe('A');
    expect(objetivoControladoPor(b).id).toBe('B');
    a.x = 3; expect(objetivoControladoPor(a)).toBeNull(); expect(enObjetivo(a)).toBeNull();
    expect(controlDeTodos().map(x => x.controla)).toEqual([null, 1]);
  });
});
