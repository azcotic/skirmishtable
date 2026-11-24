// Ardides de tiroteo y equipo de facción de los Ángeles de la Muerte (src/ui/ardides.js)
import { beforeEach, describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OPS, mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { aplicarCombate, iniciarCombate, resolverDisparo } from '../../src/engine/dice.js';
import { ARDID, aplicarSellos, conectarArdides, doctrina, elegirDoctrina } from '../../src/ui/ardides.js';
import { candidatos, costeDe } from '../../src/game/disparadores.js';

registrarComandos();
let tray, am, am2, en;
const nombres = (m, ctx) => candidatos(tray, m, ctx).map(x => x.d.ardid);
beforeEach(() => {
  tray = { tp: 1, cp: [2, 2], ardidesT: [[], []], ardides: [[], []], equipoFaccion: [[], []] };
  conectarArdides(tray);
  am = mkOp('A1', 0, 'a', 'am.combatienteIntercesor', 5, 5); am2 = mkOp('A2', 0, 'a2', 'am.tiradorIntercesor', 6, 5);
  en = mkOp('B1', 1, 'e', 'gn.combatiente', 9, 5);
  OPS.length = 0; OPS.push(am, am2, en);
});

describe('ardides de tiroteo de los Ángeles de la Muerte', () => {
  it('Ajustar doctrina solo si usaste Doctrina de combate, al empezar o terminar la activación', () => {
    expect(nombres('inicioActivacion', { op: am })).toEqual([]);
    tray.ardides = [[ARDID.doctrina], []];
    expect(nombres('inicioActivacion', { op: am })).toEqual(['Ajustar doctrina']);
    expect(nombres('finActivacion', { op: am })).toEqual(['Ajustar doctrina']);
    expect(nombres('finActivacion', { op: en })).toEqual([]);
    elegirDoctrina(0, 'tactica'); expect(doctrina(0)).toBe('tactica');
  });
  it('Fisiología transhumana: un éxito normal de la defensa pasa a crítico', () => {
    const w = { ...WPN['am.rifleBolter'], rules: [] };
    const atk = { crit: 0, norm: 3, dice: [4, 4, 4], notes: [] };
    const dados = (...v) => { let i = 0; return () => v[i++]; };
    const sin = resolverDisparo({ cover: false }, w, 3, atk, am, dados(3, 3, 1), null, false);
    expect(sin.dfn.crit).toBe(0);
    const con = resolverDisparo({ cover: false, fisiologia: true }, w, 3, atk, am, dados(3, 3, 1), null, false);
    expect(con.dfn.crit).toBe(1); expect(con.dfn.norm).toBe(sin.dfn.norm - 1);
    const ctx = { a: en, b: am, w, r: sin, what: {} };
    expect(nombres('trasDefensa', ctx)).toEqual(['Fisiología transhumana']);
    expect(nombres('trasDefensa', { ...ctx, b: en })).toEqual([]);
  });
  it('Asalto de choque: solo tras Cargar; Choque y +1 de daño al primer golpe (hasta 7)', () => {
    const est = iniciarCombate({ wa: 'am.punos', wb: 'knife' }, am, en, () => 4);
    expect(nombres('combatir', { a: am, b: en, est })).toEqual([]);
    am.used = ['charge'];
    const [c] = candidatos(tray, 'combatir', { a: am, b: en, est });
    expect(c.d.ardid).toBe('Asalto de choque');
    c.d.efecto({ a: am, b: en, est });
    expect(est.pools[0].w.rules).toContain('Shock');
    est.pools[0].norm = 3; est.pools[0].crit = 0; est.pools[1].norm = 0; est.pools[1].crit = 0; est.fin = false;
    const antes = en.wounds, dn = est.pools[0].w.dmgN;
    aplicarCombate(est, { tipo: 'golpe', con: 'norm' });
    expect(est.vida[1].wounds).toBe(antes - Math.min(7, dn + 1));
    aplicarCombate(est, { tipo: 'golpe', con: 'norm' });
    expect(est.vida[1].wounds).toBe(antes - Math.min(7, dn + 1) - dn);   // solo el primero
  });
  it('Ira de venganza: al reaccionar; cuesta 0 PM con Relicarios y orden de trabarse', () => {
    expect(nombres('reaccion', { op: am })).toEqual(['Ira de venganza']);
    const [c] = candidatos(tray, 'reaccion', { op: am });
    expect(costeDe(c.d, { op: am })).toBe(1);
    tray.equipoFaccion = [['relicarios'], []];
    am.order = 'conceal'; expect(costeDe(c.d, { op: am })).toBe(1);
    am.order = 'engage'; expect(costeDe(c.d, { op: am })).toBe(0);
    tray.cp = [0, 0];
    expect(nombres('reaccion', { op: am })).toEqual(['Ira de venganza']);   // sin PM, pero a 0 PM sí
    am.order = 'conceal'; expect(nombres('reaccion', { op: am })).toEqual([]);
    c.d.efecto({ op: am }); expect(am.ap).toBe(4);
  });
  it('Sellos de pureza: con 2 fallos, descarta uno y guarda otro como normal; una vez por punto de inflexión', () => {
    tray.equipoFaccion = [['sellos'], []];
    const dice = [1, 2, 5, 6];
    expect(aplicarSellos(am, dice, 3, [])).toBe(true);
    expect(dice).toEqual([3, 5, 6]);
    expect(aplicarSellos(am, [1, 2], 3, [])).toBe(false);           // ya lo usó
    tray.tp = 2; expect(aplicarSellos(am, [1, 2], 3, [])).toBe(true);
    tray.tp = 3; expect(aplicarSellos(am, [1, 5], 3, [])).toBe(false); // un solo fallo
    expect(aplicarSellos(en, [1, 2], 3, [])).toBe(false);           // solo Ángeles
  });
  it('Escudos decorativos y Auspex: solo con el equipo, una vez por punto de inflexión', () => {
    const est = iniciarCombate({ wa: 'am.punos', wb: 'knife' }, am, en, () => 5);
    const lados = [[0, am, est.ra, est.hitA, est.wa], [1, en, est.rb, est.hitB, est.wb]];
    expect(nombres('trasAtaqueCombate', { angel: am, k: 0, a: am, b: en, est, lados })).toEqual([]);
    tray.equipoFaccion = [['escudos', 'auspex'], []];
    const [c] = candidatos(tray, 'trasAtaqueCombate', { angel: am, k: 0, a: am, b: en, est, lados });
    c.d.efecto({ angel: am, k: 0, a: am, b: en, est, lados });
    expect(candidatos(tray, 'trasAtaqueCombate', { angel: am, k: 0, a: am, b: en, est, lados })).toHaveLength(0);
    expect(nombres('elegirBlanco', { a: am, b: en, shot: { obscured: false } })).toEqual([]);
    expect(nombres('elegirBlanco', { a: am, b: en, shot: { obscured: true } })).toEqual(['Auspex']);
  });
});
