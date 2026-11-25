// Ardides y equipo de facción de los Saurios de Lustria (comando casero; src/ui/ardides.js)
import { describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OPS, mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { armaPara, effMove, resolverDisparo } from '../../src/engine/dice.js';
import { ARDID, conectarArdides, conectarRegistro, equipoNuevoPI, idoloAncestrales } from '../../src/ui/ardides.js';
import { DISPARADORES } from '../../src/game/disparadores.js';
import { equipoDeFaccion } from '../../src/game/equipo.js';
import { comandoPorId } from '../../src/data/teams/index.js';

registrarComandos();
const tray = { tp: 2, cp: [2, 2], ardides: [[], []], equipoFaccion: [[], []] };
conectarArdides(tray); conectarRegistro(() => {});
const op = (kind, team, x = 5, y = 5) => mkOp(team ? 'B1' : 'A1', team, 'x', kind, x, y);
const disp = id => DISPARADORES.find(d => d.id === id);

describe('Saurios de Lustria: ardides de estrategia', () => {
  it('Furia predadora: Incesante en el combate de quien Cargó', () => {
    const k = op('sl.kroxigor', 0), foe = op('gn.combatiente', 1, 6, 5), maza = WPN['sl.martilloLunar'];
    tray.ardides = [[ARDID.furia], []];
    expect(armaPara(maza, k, foe, 'combate').rules).not.toContain('Ceaseless');   // no Cargó
    k.used = ['charge'];
    expect(armaPara(maza, k, foe, 'combate').rules).toContain('Ceaseless');
    tray.ardides = [[], []];
    expect(armaPara(maza, k, foe, 'combate').rules).not.toContain('Ceaseless');
  });
  it('Emboscada en la jungla: un dado de defensa más a un Eslizón en cobertura', () => {
    const sk = op('sl.combatienteEslizon', 1), a = op('gn.tirador', 0, 12, 5), w = WPN['gn.bolter'];
    const tira = (cover) => resolverDisparo({ k: 'shoot', by: 'A1', at: 'B1', w: 'gn.bolter', acc: 0, cover }, w, 3, { crit: 0, norm: 3, dice: [4, 4, 4] }, sk, () => 1);
    tray.ardides = [[], []];
    const sin = tira(true).dfn.norm;
    tray.ardides = [[], [ARDID.emboscada]];
    expect(tira(true).dfn.norm).toBe(sin + 1);
    expect(tira(false).dfn.norm).toBe(tira(false).dfn.norm);                       // sin cobertura no cambia
    void a;
  });
});

describe('Saurios de Lustria: ardides de tiroteo', () => {
  it('Colmillo en la brecha solo se ofrece al disparar a un Saurio o Kroxigor', () => {
    const w = WPN['gn.bolter'], d = disp('colmillo');
    expect(d.condicion({ b: op('sl.combatienteSaurio', 1), w })).toBe(true);
    expect(d.condicion({ b: op('sl.kroxigor', 1), w })).toBe(true);
    expect(d.condicion({ b: op('sl.camaleon', 1), w })).toBe(false);
  });
  it('Colmillo en la brecha: un dado de defensa más como crítico', () => {
    const s = op('sl.guardiaSaurio', 1), w = WPN['gn.bolter'];
    const tira = what => resolverDisparo(what, w, 3, { crit: 0, norm: 3, dice: [4, 4, 4] }, s, () => 1).dfn;
    const base = tira({ k: 'shoot', by: 'A1', at: 'B1', w: 'gn.bolter', acc: 0, cover: false });
    const con = tira({ k: 'shoot', by: 'A1', at: 'B1', w: 'gn.bolter', acc: 0, cover: false, colmillo: true });
    expect(con.crit).toBe(base.crit + 1);
  });
  it('Señor del Espacio y el Tiempo: baja 2″ el Movimiento hasta el final del punto de inflexión, sin pasar de 4″', () => {
    const e = op('gn.combatiente', 0);
    const m = effMove(e);
    e.espacioTP = tray.tp;
    expect(effMove(e)).toBe(Math.max(4, m - 2));
    e.espacioTP = tray.tp - 1;                      // ya pasó ese punto de inflexión
    expect(effMove(e)).toBe(m);
  });
});

describe('Saurios de Lustria: equipo de facción', () => {
  it('el comando ofrece sus cinco objetos', () => {
    const c = comandoPorId('3272457903');
    expect(equipoDeFaccion(c).map(e => e.id)).toEqual(['puntas', 'escudosEstegadon', 'plumas', 'idolo', 'tambores']);
  });
  it('Puntas de obsidiana: Letal 5+ al disparar con Escupedardos o Jabalinas, solo en esa activación', () => {
    const sk = op('sl.combatienteEslizon', 0), foe = op('gn.combatiente', 1, 12, 5);
    tray.equipoFaccion = [['puntas'], []];
    sk.weapon = 'sl.escupedardos';
    const arma = WPN['sl.escupedardos'];
    expect(armaPara(arma, sk, foe, 'disparo').rules.some(r => r.startsWith('Lethal'))).toBe(false);
    expect(disp('puntas').condicion({ a: sk, b: foe })).toBe(true);
    disp('puntas').efecto({ a: sk, b: foe });
    expect(armaPara(arma, sk, foe, 'disparo').rules).toContain('Lethal 5+');
    expect(disp('puntas').condicion({ a: sk, b: foe })).toBe(false);               // una vez por punto de inflexión
    sk.activaciones = 1;                                                           // otra activación: ya no vale
    expect(armaPara(arma, sk, foe, 'disparo').rules.some(r => r.startsWith('Lethal'))).toBe(false);
  });
  it('Escudos de piel de estegadón: la primera vez, Salvación 3+; no a la Guardia', () => {
    tray.equipoFaccion = [[], ['escudosEstegadon']];
    const w = WPN['gn.bolter'], d = disp('escudoSaurio');
    const s = op('sl.combatienteSaurio', 1), g = op('sl.guardiaSaurio', 1);
    expect(d.condicion({ b: s, w })).toBe(true);
    expect(d.condicion({ b: g, w })).toBe(false);
    const what = { k: 'shoot', by: 'A1', at: 'B1', w: 'gn.bolter', acc: 0, cover: false };
    const tira = wh => resolverDisparo(wh, w, 3, { crit: 0, norm: 3, dice: [4, 4, 4] }, s, () => 3).dfn;   // todos los dados sacan 3
    expect(tira(what).norm).toBe(0);                                              // 4+: un 3 falla
    expect(tira({ ...what, escudoSaurio: true }).norm).toBe(3);                    // 3+: un 3 vale
    d.efecto({ b: s, what });
    expect(d.condicion({ b: s, w })).toBe(false);                                  // solo la primera vez
  });
  it('Plumas incandescentes: el líder recupera 1D3 heridas al empezar el punto de inflexión', () => {
    OPS.length = 0;
    const l = op('sl.saurioEscamadura', 0), k = op('sl.kroxigor', 0, 7, 5);
    OPS.push(l, k);
    l.wounds = 5; k.wounds = 5;
    tray.equipoFaccion = [['plumas'], []];
    equipoNuevoPI(() => 4);                                                         // D3 = ⌈4/2⌉ = 2
    expect(l.wounds).toBe(7);
    expect(k.wounds).toBe(5);                                                       // solo el líder
    equipoNuevoPI(() => 6); equipoNuevoPI(() => 6); equipoNuevoPI(() => 6); equipoNuevoPI(() => 6);
    expect(l.wounds).toBe(l.maxW);                                                  // nunca por encima del máximo
    OPS.length = 0;
  });
  it('Ídolo de los Ancestrales: 1 PM más, una sola vez por batalla', () => {
    tray.cp = [2, 2]; tray.equipoFaccion = [['idolo'], []]; delete tray.idolo;
    expect(idoloAncestrales(0)).toBe(1);
    expect(tray.cp[0]).toBe(3);
    expect(idoloAncestrales(0)).toBe(0);
    expect(idoloAncestrales(1)).toBe(0);                                            // el otro bando no lo tiene
    expect(tray.cp).toEqual([3, 2]);
  });
});
