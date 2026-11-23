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

describe('Área, Ráfaga, Devastadora con distancia, Aturdidora, Escudo y Quemar mente', () => {
  it('Devastadora con distancia: daña al blanco y avisa del daño a los cercanos', async () => {
    const { devastadora, distanciaRegla } = await import('../../src/engine/dice.js');
    expect(devastadora(['2" Devastating 2'])).toEqual({ x: 2, dist: 2 });
    expect(devastadora(['Devastating 3'])).toEqual({ x: 3, dist: null });
    expect(distanciaRegla(['Blast 2"'], 'Blast')).toBe(2);
    expect(distanciaRegla(['Torrent 1"'], 'Torrent')).toBe(1);
    const r = disparo(arma(['2" Devastating 2']), [6, 2, 2, 2, 6, 2, 2]);
    expect(r).toMatchObject({ dev: 2, devArea: { dist: 2, dmg: 2 } });
    expect(disparo(arma(['Devastating 2']), [6, 2, 2, 2, 6, 2, 2]).devArea).toBe(null);
  });
  it('un blanco secundario no vuelve a tirar Sobrecalentamiento', () => {
    const k = arma(['Hot']);
    const r = shootRoll({ w: k, acc: 0, obsc: false, cover: false, sec: 'B1' }, tirador(k), blanco(), dados(2, 2, 2, 2, 2, 2, 2));
    expect(r.selfDmg).toBe(0);
  });
  it('Aturdidora: con un crítico, 1 LPA menos (sin acumular) hasta terminar su siguiente activación', async () => {
    const { aturdir, quitarAturdido } = await import('../../src/engine/efectos.js');
    const op = { alive: true, ready: true, apl: 3, ap: 3, used: [] };
    expect(aturdir(op, ['Stun'], 0)).toBe(false);
    expect(aturdir(op, ['Stun'], 1)).toBe(true);
    expect(op).toMatchObject({ apl: 2, ap: 2, aturdido: true });
    expect(aturdir(op, ['Stun'], 2)).toBe(false);
    expect(quitarAturdido(op)).toBe(true);
    expect(op.apl).toBe(3);
  });
  it('Quemar mente: con daño de un crítico, ficha e Impactar 1 peor (sin sumarse a lesionado)', async () => {
    const { quemarMente } = await import('../../src/engine/efectos.js');
    const { effHit } = await import('../../src/engine/dice.js');
    const a = { team: 0 }, b = { team: 1, alive: true, wounds: 14, maxW: 14 }, c = { team: 1, alive: true, wounds: 3, maxW: 14 };
    expect(quemarMente([a, b], a, b, ['Mindburn*'], { critDano: false })).toBe(false);
    expect(quemarMente([a, b], a, b, ['Mindburn*'], { critDano: true })).toBe(true);
    expect(effHit(b, { hit: 3 })).toBe(4);
    c.quemarMente = false;
    expect(effHit(c, { hit: 3 })).toBe(4);                 // lesionado
    // el mismo bando vuelve a usar el arma: la ficha anterior se retira
    expect(quemarMente([a, b, c], a, c, ['Mindburn*'], { critDano: false })).toBe(false);
    expect(b.quemarMente).toBe(false);
  });
  it('critDano: solo si algún crítico hace daño', () => {
    expect(disparo(arma(), [6, 2, 2, 2, 2, 2, 2]).critDano).toBe(true);
    expect(disparo(arma(), [6, 2, 2, 2, 6, 2, 2]).critDano).toBe(false);   // bloqueado con un crítico
  });
  it('Escudo: cada bloqueo anula dos éxitos', () => {
    const w = (rules = []) => ({ dmgN: 3, dmgC: 4, rules });
    const e = { pools: [{ crit: 1, norm: 1, w: w(['Shield*']), shock: false }, { crit: 1, norm: 2, w: w(), shock: false }],
      vida: [{ wounds: 9, alive: true }, { wounds: 9, alive: true }], turno: 0, pasos: [], fin: false };
    const ops = opcionesCombate(e);
    expect(ops).toContainEqual({ tipo: 'bloqueo', con: 'crit', contra: ['crit', 'norm'] });
    expect(ops).toContainEqual({ tipo: 'bloqueo', con: 'norm', contra: ['norm', 'norm'] });
    aplicarCombate(e, { tipo: 'bloqueo', con: 'norm', contra: ['norm', 'norm'] });
    expect(e.pools[1]).toMatchObject({ crit: 1, norm: 0 });
  });
});

describe('Terrotoxinas', () => {
  it('ficha con daño de un crítico (también Devastadora), una sola; veneno 1D3', async () => {
    const { terrotoxinas, critDanoCombate, veneno } = await import('../../src/engine/efectos.js');
    const a = { team: 0 }, b = { team: 1, alive: true, wounds: 14 };
    expect(terrotoxinas(a, b, ['Terrorchem*'], false)).toBe(false);
    expect(terrotoxinas(a, b, ['Rending'], true)).toBe(false);
    expect(terrotoxinas(a, b, ['Terrorchem*'], true)).toBe(true);
    expect(terrotoxinas(a, b, ['Terrorchem*'], true)).toBe(false);      // ya la tiene
    // el vial: 2/0, el daño de su crítico es el de Devastadora 3
    const r = disparo(arma(['Devastating 3', 'Terrorchem*'], { dmgC: 0 }), [6, 2, 2, 2, 6, 2, 2]);
    expect(r.critDano).toBe(true);
    expect(critDanoCombate([{ quien: 0, tipo: 'golpe', con: 'crit', dmg: 5 }], 0)).toBe(true);
    expect(critDanoCombate([{ quien: 0, tipo: 'golpe', con: 'norm', dmg: 3 }], 0)).toBe(false);
    expect(critDanoCombate([{ quien: 1, tipo: 'golpe', con: 'crit', dmg: 5 }], 0)).toBe(false);
    expect([1, 2, 3, 4, 5, 6].map(d => veneno({ wounds: 14, alive: true }, d))).toEqual([1, 1, 2, 2, 3, 3]);
  });
});
