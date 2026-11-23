// Acciones legales (src/game/acciones.js): cada fila de la tabla de docs/IA.md, en un tablero
// vacío (sin terreno) para que la visión no influya.
import { beforeAll, describe, expect, it } from 'vitest';
import { OPS, buildWorld } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { puede, turnoDeActivacion } from '../../src/game/acciones.js';

beforeAll(() => {
  buildWorld({ name: 'vacía', w: 24, h: 16, terrain: [], objectives: [] }, []);
  WPN.tRifle = { name: 'rifle', type: 'R', atk: 4, hit: 3, dmgN: 3, dmgC: 4, rules: [] };
  WPN.tPesada = { name: 'pesada', type: 'R', atk: 4, hit: 3, dmgN: 4, dmgC: 5, rules: ['Heavy (Reposition only)'] };
  WPN.tSilenciosa = { name: 'silenciosa', type: 'R', atk: 4, hit: 3, dmgN: 3, dmgC: 4, rules: ['Silent'] };
  WPN.tEspada = { name: 'espada', type: 'M', atk: 4, hit: 3, dmgN: 4, dmgC: 5, rules: [] };
});

const ag = (id, team, x, y, extra = {}) => ({ id, team, x, y, z: 0, alive: true, ready: true, apl: 3, ap: 3, used: [],
  order: 'engage', weapons: ['tRifle', 'tEspada'], weapon: 'tRifle', ...extra });
// el motor de disparos mira la lista global de agentes (OPS): se ponen ahí antes de preguntar
const motivo = (op, a, ops) => {
  OPS.splice(0, OPS.length, op, ...ops.filter(o => o.id !== op.id));
  const r = puede(op, a, OPS);
  return r.ok ? 'ok' : r.motivo;
};

describe('mover', () => {
  it('reposicionarse y correr: no en la zona de control de un enemigo', () => {
    const a = ag('A1', 0, 5, 5), lejos = ag('B1', 1, 15, 5), cerca = ag('B2', 1, 6.6, 5);
    expect(motivo(a, 'reposition', [a, lejos])).toBe('ok');
    expect(motivo(a, 'reposition', [a, cerca])).toBe('enZonaDeControl');
    expect(motivo(a, 'dash', [a, cerca])).toBe('enZonaDeControl');
  });
  it('retroceder: solo con un enemigo en su zona de control, cuesta 2 PA', () => {
    const a = ag('A1', 0, 5, 5), cerca = ag('B2', 1, 6.6, 5);
    expect(motivo(a, 'fallBack', [a])).toBe('sinEnemigoEnZona');
    expect(motivo(a, 'fallBack', [a, cerca])).toBe('ok');
    expect(motivo({ ...a, ap: 1 }, 'fallBack', [a, cerca])).toBe('sinPA');
  });
  it('cargar: no con orden de ocultarse ni después de moverse', () => {
    const a = ag('A1', 0, 5, 5), b = ag('B1', 1, 12, 5);
    expect(motivo(a, 'charge', [a, b])).toBe('ok');
    expect(motivo({ ...a, order: 'conceal' }, 'charge', [a, b])).toBe('ocultarse');
    expect(motivo({ ...a, used: ['dash'] }, 'charge', [a, b])).toBe('yaSeMovio');
  });
  it('cada acción una vez por activación, y nada si ya está usado', () => {
    const a = ag('A1', 0, 5, 5);
    expect(motivo({ ...a, used: ['reposition'] }, 'reposition', [a])).toBe('yaHecha');
    expect(motivo({ ...a, ready: false }, 'dash', [a])).toBe('usado');
  });
});

describe('disparar y combatir', () => {
  it('disparar: necesita un blanco válido, no estar trabado ni con orden de ocultarse', () => {
    const a = ag('A1', 0, 5, 5), b = ag('B1', 1, 15, 5), cerca = ag('B2', 1, 6.6, 5);
    expect(motivo(a, 'shoot', [a, b])).toBe('ok');
    expect(motivo(a, 'shoot', [a])).toBe('sinBlanco');
    expect(motivo(a, 'shoot', [a, cerca])).toBe('enZonaDeControl');
    expect(motivo({ ...a, order: 'conceal' }, 'shoot', [a, b])).toBe('ocultarse');
    expect(motivo({ ...a, order: 'conceal', weapon: 'tSilenciosa', weapons: ['tSilenciosa'] }, 'shoot', [a, b])).toBe('ok');
    expect(motivo({ ...a, weapon: 'tEspada' }, 'shoot', [a, b])).toBe('sinArmaDistancia');
  });
  it('arma Pesada (solo Reposicionarse): no dispara tras correr; tras reposicionarse sí', () => {
    const a = ag('A1', 0, 5, 5, { weapons: ['tPesada'], weapon: 'tPesada' }), b = ag('B1', 1, 15, 5);
    expect(motivo({ ...a, used: ['dash'] }, 'shoot', [a, b])).toBe('armaPesada');
    expect(motivo({ ...a, used: ['reposition'] }, 'shoot', [a, b])).toBe('ok');
  });
  it('combatir: solo con un enemigo en su zona de control', () => {
    const a = ag('A1', 0, 5, 5), cerca = ag('B2', 1, 6.6, 5);
    expect(motivo(a, 'fight', [a])).toBe('sinEnemigoEnZona');
    expect(motivo(a, 'fight', [a, cerca])).toBe('ok');
  });
});

describe('activaciones alternas', () => {
  it('empieza quien tiene la iniciativa y se alterna; si un bando no tiene apostados, sigue el otro', () => {
    const ops = [ag('A1', 0, 1, 1), ag('B1', 1, 9, 9), ag('B2', 1, 9, 12)];
    expect(turnoDeActivacion(ops, 1, null)).toBe(1);
    expect(turnoDeActivacion(ops, 1, 1)).toBe(0);
    ops[0].ready = false;
    // A1 está usado pero con orden de trabarse: le toca igual, para reaccionar (o pasar)
    expect(turnoDeActivacion(ops, 1, 1)).toBe(0);
    ops[0].reacciono = true;            // ya reaccionó en este punto de inflexión: sigue el rival
    expect(turnoDeActivacion(ops, 1, 1)).toBe(1);
    ops[1].ready = ops[2].ready = false;
    expect(turnoDeActivacion(ops, 1, 1)).toBe(null);
  });
});
