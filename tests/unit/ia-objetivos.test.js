// La IA fácil y los objetivos: ocupar, no abandonar, disputar y atacar a quien sostiene un objetivo
import { beforeEach, describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OBJECTIVES, OPS, buildWorld, mkOp } from '../../src/engine/world.js';
import { PESOS, planesDe, valorObjetivos, valorRomper } from '../../src/ai/facil.js';

registrarComandos();
const sinAzar = () => 0.5;
const mejor = op => planesDe(op, sinAzar).reduce((m, p) => (!m || p.puntos > m.puntos ? p : m), null);
const dest = p => p.pasos.find(s => s.x !== undefined);
let a, b;
beforeEach(() => {
  // mesa vacía de 24×16 con un objetivo en el centro
  buildWorld({ name: 'test', w: 24, h: 16, objectives: [{ id: 'A', x: 12, y: 8 }], terrain: [], spawns: [[[1, 1]], [[23, 15]]] });
  a = mkOp('A1', 0, 'a', 'gn.combatiente', 8.5, 8); b = mkOp('B1', 1, 'b', 'gn.combatiente', 22, 15);
  OPS.length = 0; OPS.push(a, b);
});

describe('IA y objetivos: ocupar', () => {
  it('valora ocupar un objetivo vacío (gana uno) más que quedarse atrás', () => {
    const v = valorObjetivos(a, 12, 8);
    expect(v.ganan).toBe(1);
    expect(v.puntos).toBeGreaterThan(0);
    expect(valorObjetivos(a, 8.5, 8).puntos).toBe(0);
    const p = mejor(a);
    expect(p.tipo).not.toBe('esperar');
    expect(p.razon.obj.ganan).toBe(1);
  });
  it('un objetivo disputado también se prefiere: pasa a controlarlo', () => {
    const c = mkOp('B2', 1, 'c', 'gn.combatiente', 12, 9); OPS.push(c);   // el enemigo ya está en el objetivo, misma LPA
    expect(OBJECTIVES.length).toBe(1);
    const v = valorObjetivos(a, 12, 7);
    expect(v.ganan).toBe(0);                    // empate: queda disputado, aún no lo controla...
    a.apl = 3; c.apl = 2;
    expect(valorObjetivos(a, 12, 7).ganan).toBe(1);   // ...con más LPA sí
    expect(valorObjetivos(a, 12, 7).disputa).toBe(1); // y el enemigo lo pierde
  });
  it('romper el control del rival (empate) vale puntos aunque no gane el objetivo', () => {
    const c = mkOp('B2', 1, 'c', 'gn.combatiente', 12, 9); OPS.push(c);
    const antes = valorObjetivos(a, 8.5, 8).puntos;
    // enemigo solo en el objetivo; yo llego con la misma LPA: lo disputo
    c.x = 12.5; c.y = 8;
    const v = valorObjetivos(a, 12, 7.5);
    expect(v.ganan).toBe(0);
    expect(v.disputa).toBe(1);
    expect(v.puntos).toBeGreaterThan(antes);
  });
});

describe('IA y objetivos: no abandonar', () => {
  it('no deja el objetivo que sostiene solo', () => {
    a.x = 12; a.y = 8;
    const v = valorObjetivos(a, 8, 8);
    expect(v.pierden).toBe(1);
    expect(v.puntos).toBeLessThan(0);
    const p = mejor(a);
    expect(dest(p) && dest(p).x < 10).toBeFalsy();    // no se aleja
    expect(['esperar', 'objetivo', 'disparar']).toContain(p.tipo);
  });
  it('si otro aliado lo sostiene, moverse no cuesta el objetivo', () => {
    a.x = 12; a.y = 8;
    const c = mkOp('A2', 0, 'c', 'gn.combatiente', 12, 7.5); OPS.push(c);
    expect(valorObjetivos(a, 8, 8).pierden).toBe(0);
  });
  it('prefiere quedarse oculto dentro del objetivo que ya controla', () => {
    a.x = 12; a.y = 8;
    const p = mejor(a);
    expect(p.tipo).toBe('esperar');
    expect(p.razon.sostiene).toBe(true);
    const fuera = planesDe({ ...a, x: 8.5 }, sinAzar).find(x => x.tipo === 'esperar');
    expect(p.puntos - PESOS.sostener).toBeCloseTo(fuera.puntos, 5);
  });
});

describe('IA y objetivos: atacar a quien lo sostiene', () => {
  it('romper vale más contra un enemigo que sostiene un objetivo', () => {
    const c = mkOp('B2', 1, 'c', 'gn.combatiente', 12, 8); OPS.push(c);
    expect(valorRomper(a, c)).toBe(1);        // sacarlo deja el objetivo libre/mío
    expect(valorRomper(a, b)).toBe(0);        // b está lejos de todo objetivo
  });
  it('dispara al enemigo del objetivo antes que a uno equivalente fuera de él', () => {
    // dos enemigos iguales a la misma distancia: solo uno sostiene el objetivo
    a.x = 12; a.y = 3; a.order = 'engage';
    b.x = 12; b.y = 8;                                   // sobre el objetivo
    const c = mkOp('B2', 1, 'c', 'gn.combatiente', 12, 13);   // fuera, misma distancia
    OPS.push(c);
    const disp = planesDe(a, sinAzar).filter(p => p.tipo === 'disparar');
    expect(disp.length).toBeGreaterThan(0);
    const mejorDisp = disp.reduce((m, p) => (p.puntos > m.puntos ? p : m));
    expect(mejorDisp.razon.blanco.id).toBe('B1');
    expect(mejorDisp.razon.romper).toBe(1);
  });
});

describe('PV por objetivos en la red', () => {
  it('cleanMission limpia el campo pvObj', async () => {
    const { cleanMission } = await import('../../src/net/protocol.js');
    const cat = { sets: [{ crit: [], tac: [] }], tokens: [] };
    expect(cleanMission({ pvObj: [[1, 2, 99, 'x'], null] }, cat).pvObj).toEqual([[1, 2, 0, 0], [0, 0, 0, 0]]);
    expect(cleanMission({}, cat).pvObj).toEqual([[0, 0, 0, 0], [0, 0, 0, 0]]);
  });
});
