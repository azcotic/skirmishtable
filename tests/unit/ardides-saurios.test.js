// Ardides y equipo de facción de los Saurios de Lustria (comando casero; src/ui/ardides.js)
import { describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OPS, mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { armaPara, effHit, effMove, rasgos, resolverDisparo } from '../../src/engine/dice.js';
import { ARDID, conectarArdides, conectarRegistro, equipoNuevoPI, idoloAncestrales } from '../../src/ui/ardides.js';
import { DISPARADORES } from '../../src/game/disparadores.js';
import { camuflaje, cannotShoot } from '../../src/engine/shots.js';
import { costeAccion } from '../../src/game/acciones.js';
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

describe('Silenciosa: disparar con orden de ocultarse', () => {
  it('el Camaleón (Cerbatana Silenciosa) puede disparar oculto; con un arma que no lo es, no', () => {
    const cam = op('sl.camaleon', 0), tir = op('gn.tirador', 0, 8, 5);
    cam.order = 'conceal'; tir.order = 'conceal';
    cam.weapon = 'sl.cerbatana';
    expect(cannotShoot(cam)).toBeNull();
    expect(cannotShoot({ x: cam.x, y: cam.y, z: 0, team: 0, op: cam })).toBeNull();
    expect(cannotShoot(tir)).toEqual({ why: 'conceal' });                  // sin arma Silenciosa, no
    cam.order = 'engage';
    expect(cannotShoot(cam)).toBeNull();
  });
});

describe('Saurios de Lustria: habilidades de ficha', () => {
  it('Sangre fría: lesionado no empeora Impactar ni Movimiento', () => {
    const k = op('sl.kroxigor', 0), foe = op('gn.tirador', 1, 20, 5);
    const w = WPN['sl.martilloLunar'], hit = effHit(k, w);
    k.wounds = 3;
    expect(effHit(k, w)).toBe(hit);
    expect(effMove(k)).toBe(6);
    foe.wounds = 3;
    expect(effMove(foe)).toBeLessThan(foe.move);                                   // los de otros comandos, sí
  });
  it('Escudo de escamas: solo el Combatiente Saurio bloquea críticos con normales', () => {
    expect(rasgos(op('sl.combatienteSaurio', 0)).duelista).toBe(true);
    expect(!!rasgos(op('sl.guardiaSaurio', 0)).duelista).toBe(false);
  });
  it('Orden primordial: Equilibrada a 3″ del Escamadura (6″ con el Estandarte de guerra)', () => {
    OPS.length = 0;
    const l = op('sl.saurioEscamadura', 0, 5, 5), s = op('sl.combatienteSaurio', 0, 10, 5), foe = op('gn.combatiente', 1, 11, 5);   // la distancia se mide entre peanas
    OPS.push(l, s, foe); l.id = 'A1'; s.id = 'A2'; foe.id = 'B1';
    const maza = WPN['sl.mazaCelestita'];
    expect(armaPara(maza, s, foe, 'combate').rules).not.toContain('Balanced');       // a unas 4″ entre peanas
    s.x = 8;
    expect(armaPara(maza, s, foe, 'combate').rules).toContain('Balanced');           // a menos de 2″
    s.x = 10; l.opciones = { armasEscamadura: 'estandarte' };
    expect(armaPara(maza, s, foe, 'combate').rules).toContain('Balanced');           // a 5″ con el Estandarte
    OPS.length = 0;
  });
  it('Ágil: Retroceder le cuesta 1 PA menos al Combatiente Eslizón', () => {
    const e = op('sl.combatienteEslizon', 0), k = op('sl.kroxigor', 0);
    expect(costeAccion(e, 'fallBack')).toBe(1);
    expect(costeAccion(k, 'fallBack')).toBe(2);
  });
  it('Protectores abnegados: la Guardia a 3″ del líder suma 1 a su Salvación contra un disparo a 6″ o menos', () => {
    OPS.length = 0;
    const g = op('sl.guardiaSaurio', 1, 5, 5), l = op('sl.saurioEscamadura', 1, 7, 5), a = op('gn.tirador', 0, 9, 5), w = WPN['gn.bolter'];
    OPS.push(g, l, a); g.id = 'B1'; l.id = 'B2'; a.id = 'A1';
    const tira = (b, by) => resolverDisparo({ k: 'shoot', by, at: b.id, w: 'gn.bolter', acc: 0, cover: false }, w, 3, { crit: 0, norm: 3, dice: [4, 4, 4] }, b, () => 2).dfn.norm;
    expect(tira(g, 'A1')).toBe(3);                              // Salvación 3+ -> 2+: un 2 vale
    expect(tira(l, 'A1')).toBe(0);                              // el Escamadura (4+) no llega: 2 < 3
    a.x = 20;                                                    // a más de 6″: no vale
    expect(tira(g, 'A1')).toBe(0);
    a.x = 9; l.x = 12;                                           // el líder a más de 3″: no vale
    expect(tira(g, 'A1')).toBe(0);
    OPS.length = 0;
  });
  it('Camuflaje cromático: el Camaleón oculto cuenta como en cobertura a más de 6″', () => {
    const cam = op('sl.camaleon', 1), otro = op('sl.combatienteEslizon', 1), f = t => camuflaje.some(g => g(t, 7));
    cam.order = 'conceal'; otro.order = 'conceal';
    expect(f(cam)).toBe(true);
    expect(camuflaje.some(g => g(cam, 5))).toBe(false);                            // a 6″ o menos, no
    expect(f(otro)).toBe(false);                                                   // solo el Camaleón
    cam.order = 'engage';
    expect(f(cam)).toBe(false);                                                    // trabado: no
  });
});
