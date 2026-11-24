// Motor de disparadores de ardides de tiroteo (src/game/disparadores.js) y Todo es polvo
import { beforeEach, describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OPS, buildWorld, mkOp } from '../../src/engine/world.js';
import { conectarArdides } from '../../src/ui/ardides.js';
import { activar, candidatos, limpiarSilencio, silenciar } from '../../src/game/disparadores.js';

registrarComandos();
const rubrica = mkOp('B1', 1, 'x', 'ad.combatienteRubrica', 5, 5);
const hechicero = mkOp('B2', 1, 'x', 'ad.hechiceroDestino', 6, 5);
const w = { dmgN: 3, dmgC: 4 };
const ctx = (b = rubrica, normales = 1) => ({ b, w, r: { dmg: 3, notes: [] }, normales });
let tray;
beforeEach(() => { tray = { cp: [2, 2], ardidesT: [[], []] }; conectarArdides(tray); });

describe('disparadores de ardides de tiroteo', () => {
  it('Todo es polvo se ofrece al recibir daño normal un Marine Rúbrica con PM', () => {
    const c = candidatos(tray, 'recibirDano', ctx());
    expect(c.map(x => x.d.ardid)).toEqual(['Todo es polvo']);
    expect(c[0].bando).toBe(1);
  });
  it('no se ofrece a un Hechicero, sin dados normales, sin PM, ya usado o en silencio', () => {
    expect(candidatos(tray, 'recibirDano', ctx(hechicero))).toHaveLength(0);
    expect(candidatos(tray, 'recibirDano', ctx(rubrica, 0))).toHaveLength(0);
    expect(candidatos(tray, 'antesAtaque', ctx())).toHaveLength(0);
    tray.cp = [2, 0]; expect(candidatos(tray, 'recibirDano', ctx())).toHaveLength(0);
    tray.cp = [2, 2]; silenciar(tray, 1, 'Todo es polvo');
    expect(candidatos(tray, 'recibirDano', ctx())).toHaveLength(0);
    limpiarSilencio(tray);
    expect(candidatos(tray, 'recibirDano', ctx())).toHaveLength(1);
  });
  it('activar cuesta 1 PM y solo una vez por punto de inflexión; el efecto resta 1 de daño', () => {
    const c = ctx();
    expect(activar(tray, 1, 'Todo es polvo')).toBe(true);
    expect(tray.cp).toEqual([2, 1]);
    expect(activar(tray, 1, 'Todo es polvo')).toBe(false);
    candidatos(tray, 'recibirDano', ctx());   // ya usado: no sale
    expect(candidatos(tray, 'recibirDano', ctx())).toHaveLength(0);
    // el efecto, directo
    tray.ardidesT = [[], []];
    candidatos(tray, 'recibirDano', c)[0].d.efecto(c);
    expect(c.r.dmg).toBe(2);
  });
});

describe('ardides de tiroteo del Aquelarre y su equipo de facción', () => {
  const ad = (k, id, x, y, team = 0) => mkOp(id, team, 'x', k, x, y);
  it('Plan caprichoso se ofrece al terminar la activación de un Hechicero, no de un Rúbrica', () => {
    const h = ad('ad.hechiceroDestino', 'A1', 5, 5), r = ad('ad.combatienteRubrica', 'A2', 6, 5);
    tray = { cp: [2, 2], ardidesT: [[], []] }; conectarArdides(tray);
    expect(candidatos(tray, 'finActivacion', { op: h }).map(x => x.d.ardid)).toEqual(['Plan caprichoso']);
    expect(candidatos(tray, 'finActivacion', { op: r })).toHaveLength(0);
  });
  it('Rebaño mutante solo si hay otro Tzaangor apostado a 2" o menos', () => {
    const t1 = ad('ad.combatienteTzaangor', 'A1', 5, 5), t2 = ad('ad.combatienteTzaangor', 'A2', 6, 5);
    buildWorld({ name: 'test', w: 24, h: 12, objectives: [], terrain: [], spawns: [[[1, 1]], [[23, 11]]] });
    OPS.length = 0; OPS.push(t1, t2);
    tray = { cp: [2, 2], ardidesT: [[], []], tp: 1 }; conectarArdides(tray);
    const ids = () => candidatos(tray, 'inicioActivacion', { op: t1 }).map(x => x.d.id);
    expect(ids()).toContain('rebano');
    t2.x = 20;
    expect(ids()).not.toContain('rebano');
  });
  it('Balas hechizadas y Armas faucesdaemónicas solo con el equipo elegido', async () => {
    const { armaPara } = await import('../../src/engine/dice.js');
    const { WPN } = await import('../../src/config.js');
    const r = ad('ad.combatienteRubrica', 'A1', 5, 5), e = ad('ad.combatienteRubrica', 'B1', 6, 5, 1);
    tray = { cp: [2, 2], ardidesT: [[], []], equipoFaccion: [[], []] }; conectarArdides(tray);
    expect(armaPara(WPN['ad.bolterInfierno'], r, e, 'disparo').rules).not.toContain('Devastating 1');
    tray.equipoFaccion = [['balas', 'faucesdaemonicas'], []];
    expect(armaPara(WPN['ad.bolterInfierno'], r, e, 'disparo').rules).toContain('Devastating 1');
    const p = armaPara(WPN['ad.punos'], r, e, 'combate'), c = armaPara(WPN['ad.punos'], r, e, 'contraataque');
    expect(p.atk).toBe(WPN['ad.punos'].atk + 1);
    expect(p.rules).not.toContain('Accurate 1');
    expect(c.rules).toContain('Accurate 1');
  });
  it('Túnicas arcanas: gratis, solo con daño crítico a un Hechicero y una vez por punto de inflexión', () => {
    const h = ad('ad.hechiceroDestino', 'B1', 5, 5, 1);
    tray = { cp: [0, 0], tp: 1, ardidesT: [[], []], equipoFaccion: [[], ['tunicas']] }; conectarArdides(tray);
    const c = { b: h, w: { dmgN: 3, dmgC: 4 }, r: { dmg: 4, notes: [] }, normales: 0, criticos: 1 };
    const [t] = candidatos(tray, 'recibirDano', c);
    expect(t.d.ardid).toBe('Túnicas arcanas');
    t.d.efecto(c);
    expect(c.r.dmg).toBe(3);
    expect(candidatos(tray, 'recibirDano', c).map(x => x.d.ardid)).not.toContain('Túnicas arcanas');
  });
});
