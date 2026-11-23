// Despliegue por turnos (src/engine/deploy.js): de quién es el turno, la zona de descenso y
// los agentes que se pisan.
import { describe, expect, it } from 'vitest';
import { chocaConAgente, dentroDeZona, desplegar, enDespliegue, porDesplegar, retirarParaDesplegar, turnoDespliegue } from '../../src/engine/deploy.js';

const op = (id, team, extra = {}) => ({ id, team, x: 0, y: 0, apl: 3, ap: 3, alive: true, ready: true, used: [], order: 'engage', ...extra });
const equipo = (team, n) => Array.from({ length: n }, (_, i) => op((team ? 'B' : 'A') + (i + 1), team));

describe('turnoDespliegue', () => {
  it('alterna de uno en uno, empezando por quien tiene la iniciativa', () => {
    const ops = [...equipo(0, 3), ...equipo(1, 3)];
    retirarParaDesplegar(ops);
    const orden = [];
    for (let t; (t = turnoDespliegue(ops, 1)) !== null;) {
      orden.push(t);
      desplegar(porDesplegar(ops, t)[0], 1, 1);
    }
    expect(orden).toEqual([1, 0, 1, 0, 1, 0]);
    expect(enDespliegue(ops)).toBe(false);
  });

  it('si un bando ya terminó, el otro despliega lo que le queda', () => {
    const ops = [...equipo(0, 1), ...equipo(1, 3)];
    retirarParaDesplegar(ops);
    const orden = [];
    for (let t; (t = turnoDespliegue(ops)) !== null;) { orden.push(t); desplegar(porDesplegar(ops, t)[0], 1, 1); }
    expect(orden).toEqual([0, 1, 1, 1]);
  });

  it('nadie por desplegar: null', () => {
    expect(turnoDespliegue([...equipo(0, 2), ...equipo(1, 2)])).toBe(null);
  });
});

describe('colocar', () => {
  const dz = { team: 0, x: 0, y: 0, w: 6, h: 22 };   // borde corto, 6″ de fondo
  it('la peana completa dentro de la zona de descenso', () => {
    const a = op('A1', 0);
    expect(dentroDeZona(a, 3, 10, dz)).toBe(true);
    expect(dentroDeZona(a, 5.8, 10, dz)).toBe(false);    // la peana asoma fuera
    expect(dentroDeZona(a, 0.2, 10, dz)).toBe(false);    // se sale de la mesa
  });
  it('no pisa a otro agente', () => {
    const a = op('A1', 0, { x: 3, y: 10 }), b = op('A2', 0);
    expect(chocaConAgente(b, 3.5, 10, [a, b])).toBe(true);
    expect(chocaConAgente(b, 5, 10, [a, b])).toBe(false);
  });
  it('desplegar lo deja en la mesa, apostado y con orden de ocultarse', () => {
    const a = op('A1', 0);
    retirarParaDesplegar([a]);
    expect(a.alive).toBe(false);
    desplegar(a, 2.345, 7);
    expect(a).toMatchObject({ x: 2.35, y: 7, alive: true, ready: true, order: 'conceal' });
    expect('deployed' in a).toBe(false);
  });
});
