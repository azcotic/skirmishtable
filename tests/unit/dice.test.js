// La tirada real (src/engine/dice.js) y los blancos (src/game/acciones.js): cada regla de arma con
// dados fijos, para saber exactamente qué tiene que salir. Los dados se dan en orden: ataque,
// (repeticiones), defensa y, al final, el de Sobrecalentamiento.
import { describe, expect, it } from 'vitest';
import { WPN } from '../../src/config.js';
import { aplicarCombate, clasificarAtaque, opcionesCombate, rollAttack, shootRoll } from '../../src/engine/dice.js';
import { agotada, blancoValidoCon, buscadoraAplica } from '../../src/game/acciones.js';

// un dado que devuelve estos valores en orden, y falla si se le piden más
const dados = (...v) => { let i = 0; return () => { if (i >= v.length) throw new Error('se pidieron más dados'); return v[i++]; }; };
// un arma a distancia de prueba (4 ataques, 3+, 3/4) registrada en WPN
let n = 0;
const arma = (rules = [], extra = {}) => {
  const k = `prueba.${n++}`;
  WPN[k] = { name: k, type: 'R', atk: 4, hit: 3, dmgN: 3, dmgC: 4, rules, ...extra };
  return k;
};
const tirador = k => ({ weapons: [k], wounds: 14, maxW: 14 });
const blanco = (save = 3) => ({ save, wounds: 14, maxW: 14 });
const disparo = (k, d, { cover = false, save = 3 } = {}) =>
  shootRoll({ w: k, acc: 0, obsc: false, cover }, tirador(k), blanco(save), dados(...d));

describe('reglas que cambian los resultados del ataque', () => {
  it('Letal 5+: los 5 también son críticos', () => {
    expect(clasificarAtaque([5, 3, 2], 3, ['Lethal 5+'])).toMatchObject({ crit: 1, norm: 1 });
  });
  it('Castigadora: con un crítico, un fallo pasa a normal', () => {
    expect(clasificarAtaque([6, 2, 1], 3, ['Punishing'])).toMatchObject({ crit: 1, norm: 1 });
    expect(clasificarAtaque([4, 2, 1], 3, ['Punishing'])).toMatchObject({ crit: 0, norm: 1 });
  });
  it('Desgarradora: con un crítico, un normal pasa a crítico', () => {
    expect(clasificarAtaque([6, 4], 3, ['Rending'])).toMatchObject({ crit: 2, norm: 0 });
    expect(clasificarAtaque([5, 4], 3, ['Rending'])).toMatchObject({ crit: 0, norm: 2 });
  });
  it('Severa: sin críticos, un normal pasa a crítico; con críticos, nada', () => {
    expect(clasificarAtaque([4, 3, 2], 3, ['Severe'])).toMatchObject({ crit: 1, norm: 1 });
    expect(clasificarAtaque([6, 4], 3, ['Severe'])).toMatchObject({ crit: 1, norm: 1 });
  });
  it('Severa no activa Castigadora ni Desgarradora', () => {
    expect(clasificarAtaque([4, 3, 2], 3, ['Severe', 'Punishing', 'Rending'])).toMatchObject({ crit: 1, norm: 1 });
  });
  it('Severa sí activa Penetración en críticos', () => {
    const r = disparo(arma(['Severe', 'Piercing Crits 1']), [4, 2, 2, 2, 2, 2]);
    expect(r.dfn.dice).toHaveLength(2);
  });
});

describe('repeticiones del arma', () => {
  it('Implacable: repite todos los fallos', () => {
    const r = rollAttack(3, 3, ['Relentless'], dados(1, 2, 5, 6, 4));
    expect(r.dice).toEqual([6, 4, 5]);
    expect(r.rerolled).toEqual([0, 1]);
  });
  it('Incesante: repite los fallos de un mismo resultado (el más repetido)', () => {
    const r = rollAttack(3, 3, ['Ceaseless'], dados(2, 2, 1, 5, 6));
    expect(r.dice).toEqual([5, 6, 1]);
    expect(r).toMatchObject({ crit: 1, norm: 1 });
  });
  it('Equilibrada: repite un solo fallo', () => {
    const r = rollAttack(3, 3, ['Balanced'], dados(1, 2, 4, 6));
    expect(r.dice).toEqual([6, 2, 4]);
    expect(r.rerolled).toEqual([0]);
  });
});

describe('disparo completo', () => {
  it('Certera 1: un éxito normal sin tirarlo (solo se tiran 3 dados)', () => {
    const r = disparo(arma(['Accurate 1']), [2, 2, 2, 2, 2, 2]);
    expect(r.atk.dice).toHaveLength(3);
    expect(r).toMatchObject({ atkN: 1, atkC: 0, dmg: 3 });
  });
  it('Penetración 1: el defensor tira un dado menos', () => {
    const r = disparo(arma(['Piercing 1']), [4, 4, 4, 4, 2, 2]);
    expect(r.dfn.dice).toHaveLength(2);
    expect(r.dmg).toBe(12);
  });
  it('Penetración en críticos 1: solo si hay algún crítico', () => {
    expect(disparo(arma(['Piercing Crits 1']), [6, 2, 2, 2, 2, 2]).dfn.dice).toHaveLength(2);
    expect(disparo(arma(['Piercing Crits 1']), [4, 2, 2, 2, 2, 2, 2]).dfn.dice).toHaveLength(3);
  });
  it('Devastadora 2: cada crítico hace 2 de daño aunque luego se bloquee', () => {
    const r = disparo(arma(['Devastating 2']), [6, 2, 2, 2, 6, 2, 2]);
    expect(r).toMatchObject({ dev: 2, dmg: 2 });
  });
  it('Saturación: el blanco a cubierto no guarda la salvación por cobertura', () => {
    const sin = disparo(arma(), [4, 4, 2, 2, 2, 2], { cover: true });
    expect(sin.dfn.dice).toHaveLength(2);
    expect(sin.dmg).toBe(3);                       // un éxito bloqueado por la cobertura
    const con = disparo(arma(['Saturate']), [4, 4, 2, 2, 2, 2, 2], { cover: true });
    expect(con.dfn.dice).toHaveLength(3);
    expect(con).toMatchObject({ cover: false, dmg: 6 });
  });
  it('Sobrecalentamiento: si el dado sale menos que Impactar, el tirador recibe el doble', () => {
    expect(disparo(arma(['Hot']), [2, 2, 2, 2, 2, 2, 2, 2]).selfDmg).toBe(4);
    expect(disparo(arma(['Hot']), [2, 2, 2, 2, 2, 2, 2, 4]).selfDmg).toBe(0);
  });
});

describe('blancos y usos', () => {
  const tiro = (kind, extra = {}) => ({ kind, range: 5, sight: { hardCover: false }, ...extra });
  it('Alcance 8″: más lejos no es un blanco válido', () => {
    const w = WPN[arma(['Range 8"'])];
    expect(blancoValidoCon(w, tiro('clear', { range: 8 }))).toBe(true);
    expect(blancoValidoCon(w, tiro('clear', { range: 9 }))).toBe(false);
  });
  it('Buscadora: el oculto a cubierto es blanco; Buscadora (Ligero), solo con cobertura ligera', () => {
    const seek = WPN[arma(['Seek'])], ligero = WPN[arma(['Seek Light'])], nada = WPN[arma()];
    expect(buscadoraAplica(seek, tiro('concealed', { sight: { hardCover: true } }))).toBe(true);
    expect(buscadoraAplica(ligero, tiro('concealed', { sight: { hardCover: false } }))).toBe(true);
    expect(buscadoraAplica(ligero, tiro('concealed', { sight: { hardCover: true } }))).toBe(false);
    expect(buscadoraAplica(nada, tiro('concealed'))).toBe(false);
  });
  it('Limitada 1: agotada tras un uso', () => {
    const k = arma(['Limited 1']);
    expect(agotada({ usos: {} }, k)).toBe(false);
    expect(agotada({ usos: { [k]: 1 } }, k)).toBe(true);
  });
});

describe('combate', () => {
  const w = (rules = []) => ({ dmgN: 3, dmgC: 4, rules });
  const est = (rA, rB, poolA, poolB) => ({
    pools: [{ ...poolA, w: w(rA), shock: false }, { ...poolB, w: w(rB), shock: false }],
    vida: [{ wounds: 14, alive: true }, { wounds: 14, alive: true }], turno: 0, pasos: [], fin: false,
  });
  it('Brutal: contra él solo se bloquea con críticos', () => {
    const e = est([], [], { crit: 0, norm: 1 }, { crit: 0, norm: 1 });
    expect(opcionesCombate(e).some(o => o.tipo === 'bloqueo')).toBe(true);
    const b = est([], ['Brutal'], { crit: 0, norm: 1 }, { crit: 0, norm: 1 });
    expect(opcionesCombate(b).some(o => o.tipo === 'bloqueo')).toBe(false);
  });
  it('Choque: el primer golpe crítico descarta un éxito normal del rival (solo el primero)', () => {
    const e = est(['Shock'], [], { crit: 2, norm: 0 }, { crit: 1, norm: 2 });
    aplicarCombate(e, { tipo: 'golpe', con: 'crit' });
    expect(e.pools[1]).toMatchObject({ norm: 1, crit: 1 });
    e.turno = 0;
    aplicarCombate(e, { tipo: 'golpe', con: 'crit' });
    expect(e.pools[1]).toMatchObject({ norm: 1, crit: 1 });
  });
  it('Choque sin normales del rival: descarta un crítico', () => {
    const e = est(['Shock'], [], { crit: 1, norm: 0 }, { crit: 1, norm: 0 });
    aplicarCombate(e, { tipo: 'golpe', con: 'crit' });
    expect(e.pools[1].crit).toBe(0);
  });
});
