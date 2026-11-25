// El Gran Plan (Asterismos) y la Formación de los Saurios de Lustria (src/ui/saurios-plan.js)
import { describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { aplicarCombate, armaPara, effMove, iniciarCombate } from '../../src/engine/dice.js';
import { conectarArdides, conectarRegistro } from '../../src/ui/ardides.js';
import { DISPARADORES } from '../../src/game/disparadores.js';
import { cleanTray } from '../../src/net/protocol.js';
import { ASTERISMOS, FORMACIONES, acechadoraAplica, asterismoActivo, asterismosNuevoPI, condicionAsterismo, eternaLista,
  formacion, garraSolar, inicioPuntoDeInflexion, iniciarPlan, lectorDisponible, planAlAzar, usarLector } from '../../src/ui/saurios-plan.js';

registrarComandos();
const tray = { tp: 1, cp: [2, 2], ardides: [[], []], equipoFaccion: [[], []] };
const registro = [];
conectarArdides(tray); conectarRegistro(t => registro.push(t));
let n = 0;
const op = (kind, team, x = 5, y = 5) => mkOp('X' + (++n), team, 'x' + n, kind, x, y);
const ZONAS = [{ team: 0, x: 0, y: 0, w: 6, h: 6 }, { team: 1, x: 20, y: 20, w: 6, h: 6 }];
const plan = (a = 'itzl', f = 'garra') => iniciarPlan(tray, [{ asterismo: a, formacion: f }, null]);
const base = { tp: 1, cp: [0, 0], vp: [0, 0] };

describe('Gran Plan: estado', () => {
  it('sin plan, nada está activo', () => {
    iniciarPlan(tray, [null, null]);
    expect(tray.saurios).toBeUndefined();
    expect(asterismoActivo(0, 'itzl')).toBe(false);
    expect(formacion(0)).toBe(null);
  });
  it('el Asterismo elegido está activo desde el principio y la Formación se lee por bando', () => {
    plan('sotek', 'acechadora');
    expect(asterismoActivo(0, 'sotek')).toBe(true);
    expect(asterismoActivo(0, 'itzl')).toBe(false);
    expect(asterismoActivo(1, 'sotek')).toBe(false);
    expect(formacion(0)).toBe('acechadora');
    expect(formacion(1)).toBe(null);
  });
  it('la computadora elige uno válido al azar', () => {
    for (const r of [0, 0.5, 0.99]) { const p = planAlAzar(() => r); expect(ASTERISMOS).toContain(p.asterismo); expect(FORMACIONES).toContain(p.formacion); }
  });
  it('rechaza elecciones inválidas', () => {
    iniciarPlan(tray, [{ asterismo: 'nada', formacion: 'garra' }, { asterismo: 'itzl', formacion: 'x' }]);
    expect(tray.saurios).toBeUndefined();
  });
});

describe('Asterismos: condiciones', () => {
  it('Itzl: algún enemigo incapacitado', () => {
    const mio = op('sl.kroxigor', 0), foe = op('gn.combatiente', 1);
    expect(condicionAsterismo('itzl', 0, [mio, foe], ZONAS)).toBe(false);
    foe.alive = false;
    expect(condicionAsterismo('itzl', 0, [mio, foe], ZONAS)).toBe(true);
    expect(condicionAsterismo('itzl', 1, [mio, foe], ZONAS)).toBe(false);
  });
  it('Quetzl: ningún enemigo en tu zona de despliegue', () => {
    const mio = op('sl.kroxigor', 0, 10, 10), foe = op('gn.combatiente', 1, 3, 3);
    expect(condicionAsterismo('quetzl', 0, [mio, foe], ZONAS)).toBe(false);
    foe.x = 12; foe.y = 12;
    expect(condicionAsterismo('quetzl', 0, [mio, foe], ZONAS)).toBe(true);
    foe.x = 3; foe.y = 3; foe.alive = false;
    expect(condicionAsterismo('quetzl', 0, [mio, foe], ZONAS)).toBe(true);   // un caído no cuenta
  });
  it('Sotek: líder o enemigo incapacitado, o líder en zona de control', () => {
    const lider = op('sl.saurioEscamadura', 0, 10, 10), foe = op('gn.combatiente', 1, 20, 20);
    expect(condicionAsterismo('sotek', 0, [lider, foe], ZONAS)).toBe(false);
    foe.x = 11; foe.y = 10;
    expect(condicionAsterismo('sotek', 0, [lider, foe], ZONAS)).toBe(true);    // trabado
    foe.x = 20; foe.y = 20; foe.alive = false;
    expect(condicionAsterismo('sotek', 0, [lider, foe], ZONAS)).toBe(true);    // enemigo caído
    foe.alive = true; lider.alive = false;
    expect(condicionAsterismo('sotek', 0, [lider, foe], ZONAS)).toBe(true);    // líder caído
  });
  it('Tepok: un Sacerdote en juego y fuera de zona de control', () => {
    const sac = op('sl.sacerdoteEstelar', 0, 10, 10), foe = op('gn.combatiente', 1, 20, 20);
    expect(condicionAsterismo('tepok', 0, [sac, foe], ZONAS)).toBe(true);
    foe.x = 11; foe.y = 10;
    expect(condicionAsterismo('tepok', 0, [sac, foe], ZONAS)).toBe(false);
    expect(condicionAsterismo('tepok', 0, [op('sl.kroxigor', 0), foe], ZONAS)).toBe(false);   // no hay Sacerdote
  });
});

describe('Asterismos: inicio del punto de inflexión', () => {
  it('desde el 2.º PI se activan los que cumplen su condición, sin perder los anteriores', () => {
    plan('itzl');
    const sac = op('sl.sacerdoteEstelar', 0, 10, 10), foe = op('gn.combatiente', 1, 20, 20);
    tray.tp = 1;
    expect(asterismosNuevoPI([sac, foe], ZONAS)).toEqual([]);               // el PI 1 no evalúa
    tray.tp = 2;
    expect(asterismosNuevoPI([sac, foe], ZONAS)).toEqual([{ s: 0, id: 'quetzl' }, { s: 0, id: 'tepok' }]);
    expect(asterismoActivo(0, 'itzl')).toBe(true);
    expect(asterismoActivo(0, 'quetzl')).toBe(true);
    expect(asterismoActivo(0, 'tepok')).toBe(true);
    expect(asterismoActivo(0, 'sotek')).toBe(false);
    expect(registro.some(t => t.includes('Quetzl'))).toBe(true);
    foe.alive = false;
    tray.tp = 3;
    expect(asterismosNuevoPI([sac, foe], ZONAS).map(x => x.id).sort()).toEqual(['sotek']);   // itzl ya estaba
  });
  it('Lector de estrellas: una vez por batalla, un Asterismo sin cumplir su condición', () => {
    plan('itzl'); tray.tp = 2;
    const sac = op('sl.sacerdoteEstelar', 0, 10, 10);
    expect(lectorDisponible(0, [sac])).toBe(true);
    expect(usarLector(0, 'itzl', [sac])).toBe(false);                       // ya estaba activo
    expect(usarLector(0, 'sotek', [sac])).toBe(true);
    expect(asterismoActivo(0, 'sotek')).toBe(true);
    expect(lectorDisponible(0, [sac])).toBe(false);                         // gastado
    expect(usarLector(0, 'tepok', [sac])).toBe(false);
  });
  it('Lector de estrellas: no hay en el PI 1, ni sin Sacerdote Estelar vivo', () => {
    plan('itzl'); tray.tp = 1;
    const sac = op('sl.sacerdoteEstelar', 0, 10, 10);
    expect(lectorDisponible(0, [sac])).toBe(false);
    tray.tp = 2;
    sac.alive = false;
    expect(lectorDisponible(0, [sac])).toBe(false);
    expect(lectorDisponible(0, [op('sl.sacerdoteEslizon', 0)])).toBe(false);
  });
  it('la computadora usa el Lector si tiene alguno por activar', async () => {
    iniciarPlan(tray, [null, { asterismo: 'itzl', formacion: 'garra' }]); tray.tp = 2;
    const sac = op('sl.sacerdoteEstelar', 1, 10, 10);
    await inicioPuntoDeInflexion({ esIA: () => true }, [sac], ZONAS);
    expect(sac.habUsadas).toContain('lector');
    expect(tray.saurios.activos[1].length).toBeGreaterThan(1);
  });
});

describe('Asterismos: efectos', () => {
  it('Itzl: Desgarradora en las armas de combate de Saurios y Kroxigor, no en las de distancia', () => {
    const k = op('sl.kroxigor', 0), foe = op('gn.combatiente', 1);
    const maza = WPN['sl.martilloLunar'];
    plan('sotek');
    expect(armaPara(maza, k, foe, 'combate').rules).not.toContain('Rending');
    plan('itzl');
    expect(armaPara(maza, k, foe, 'combate').rules).toContain('Rending');
    expect(armaPara(maza, k, foe, 'contraataque').rules).toContain('Rending');
    expect(armaPara(WPN['sl.rayoAstral'], k, foe, 'disparo').rules).not.toContain('Rending');
    expect(armaPara(maza, foe, k, 'combate').rules).not.toContain('Rending');
  });
  it('Sotek: +1″ al Movimiento de sus agentes', () => {
    const e = op('sl.combatienteEslizon', 0), rival = op('sl.combatienteEslizon', 1);
    plan('itzl');
    const m = effMove(e);
    plan('sotek');
    expect(effMove(e)).toBe(m + 1);
    expect(effMove(rival)).toBe(m);                                         // el otro bando, no
  });
  it('Quetzl: el primer éxito normal que daña a cada Saurio baja 1, por punto de inflexión', () => {
    plan('quetzl'); tray.tp = 2;
    const s = op('sl.combatienteSaurio', 0), foe = op('gn.combatiente', 1);
    const wa = foe.weapons.find(k => WPN[k].type === 'M'), wb = s.weapons.find(k => WPN[k].type === 'M');
    const est = iniciarCombate({ wa, wb }, foe, s, () => 1);
    est.pools[0].norm = 2; est.pools[0].crit = 0; est.pools[1].norm = 0; est.pools[1].crit = 0;
    const dmg = WPN[wa].dmgN, w0 = s.wounds;
    aplicarCombate(est, { tipo: 'golpe', con: 'norm' });
    expect(w0 - est.vida[1].wounds).toBe(dmg - 1);                          // el primero baja 1
    est.turno = 0;
    aplicarCombate(est, { tipo: 'golpe', con: 'norm' });
    expect(w0 - est.vida[1].wounds).toBe(dmg - 1 + dmg);                    // el segundo, completo
    expect(s.quetzlTP).toBe(2);
    expect(iniciarCombate({ wa, wb }, foe, s, () => 1).rasgos[1].quetzl).toBeUndefined();   // ya no hay en este PI
    tray.tp = 3;                                                            // y en el siguiente, sí
    expect(iniciarCombate({ wa, wb }, foe, s, () => 1).rasgos[1].quetzl).toBe(true);
  });
  it('Quetzl no protege a un Eslizón ni existe sin el Asterismo', () => {
    const e = op('sl.combatienteEslizon', 0), foe = op('gn.combatiente', 1);
    const wa = foe.weapons.find(k => WPN[k].type === 'M'), wb = e.weapons.find(k => WPN[k].type === 'M');
    plan('quetzl'); tray.tp = 2;
    expect(iniciarCombate({ wa, wb }, foe, e, () => 1).rasgos[1].quetzl).toBeUndefined();
    const s = op('sl.kroxigor', 0);
    plan('itzl');
    expect(iniciarCombate({ wa, wb: s.weapons.find(k => WPN[k].type === 'M') }, foe, s, () => 1).rasgos[1].quetzl).toBeUndefined();
  });
});

describe('Formaciones', () => {
  it('Garra Solar: con 4+ inflige 1 de daño a un enemigo en su zona de control', () => {
    plan('itzl', 'garra');
    const k = op('sl.kroxigor', 0, 10, 10), foe = op('gn.combatiente', 1, 11, 10), lejos = op('gn.combatiente', 1, 20, 20);
    const w0 = foe.wounds;
    expect(garraSolar(k, () => 3, [k, foe, lejos]).blanco).toBe(null);
    expect(foe.wounds).toBe(w0);
    expect(garraSolar(k, () => 4, [k, foe, lejos]).blanco).toBe(foe);
    expect(foe.wounds).toBe(w0 - 1);
    expect(lejos.wounds).toBe(lejos.maxW);
  });
  it('Garra Solar: incapacita al enemigo con 1 herida; no sirve fuera de zona de control, con otra Formación ni a un Eslizón', () => {
    plan('itzl', 'garra');
    const k = op('sl.kroxigor', 0, 10, 10), foe = op('gn.combatiente', 1, 11, 10);
    foe.wounds = 1;
    garraSolar(k, () => 6, [k, foe]);
    expect(foe.alive).toBe(false);
    const solo = op('sl.kroxigor', 0, 10, 10);
    expect(garraSolar(solo, () => 6, [solo, op('gn.combatiente', 1, 20, 20)])).toBe(null);
    const e = op('sl.combatienteEslizon', 0, 10, 10);
    expect(garraSolar(e, () => 6, [e, op('gn.combatiente', 1, 11, 10)])).toBe(null);
    plan('itzl', 'eterna');
    expect(garraSolar(k, () => 6, [k, op('gn.combatiente', 1, 11, 10)])).toBe(null);
  });
  it('Acechadora: un Eslizón que no está en zona de control enemiga', () => {
    plan('itzl', 'acechadora');
    const e = op('sl.combatienteEslizon', 0, 10, 10), foe = op('gn.combatiente', 1, 20, 20);
    expect(acechadoraAplica(e, [e, foe])).toBe(true);
    foe.x = 11; foe.y = 10;
    expect(acechadoraAplica(e, [e, foe])).toBe(false);
    expect(acechadoraAplica(op('sl.kroxigor', 0), [])).toBe(false);
    plan('itzl', 'garra');
    foe.x = 20; foe.y = 20;
    expect(acechadoraAplica(e, [e, foe])).toBe(false);
  });
  it('Eterna: un Eslizón a 6″ o menos de un Sacerdote, una vez por punto de inflexión', () => {
    plan('itzl', 'eterna'); tray.tp = 2;
    const sac = op('sl.sacerdoteEstelar', 0, 10, 10), e = op('sl.combatienteEslizon', 0, 14, 10);
    expect(eternaLista(0, [sac, e])).toBe(true);
    e.x = 20;
    expect(eternaLista(0, [sac, e])).toBe(false);
    e.x = 14;
    tray.saurios.eternaTP[0] = 2;
    expect(eternaLista(0, [sac, e])).toBe(false);
    tray.tp = 3;
    expect(eternaLista(0, [sac, e])).toBe(true);
    expect(eternaLista(0, [sac])).toBe(false);                              // el Sacerdote no se cuenta a sí mismo
    expect(DISPARADORES.some(d => d.id === 'eterna' && d.gratis)).toBe(true);
  });
});

describe('Gran Plan: red y Deshacer', () => {
  it('cleanTray conserva el plan válido y limpia lo demás', () => {
    plan('quetzl', 'eterna');
    tray.saurios.eternaTP = [3, null];
    const out = cleanTray({ tp: 2, cp: [1, 1], vp: [0, 0], saurios: JSON.parse(JSON.stringify(tray.saurios)) }, base);
    expect(out.saurios).toEqual({ asterismo: ['quetzl', null], formacion: ['eterna', null], activos: [['quetzl'], []], eternaTP: [3, null] });
    const malo = cleanTray({ tp: 2, cp: [1, 1], vp: [0, 0], saurios: { asterismo: ['<x>', 5], formacion: 'si', activos: [['itzl', 'itzl', 'zzz'], 7], eternaTP: [-1, 'a'] } }, base);
    expect(malo.saurios).toEqual({ asterismo: [null, null], formacion: [null, null], activos: [['itzl'], []], eternaTP: [null, null] });
    expect(cleanTray({ tp: 2, cp: [1, 1], vp: [0, 0] }, base).saurios).toBeUndefined();
  });
  it('Deshacer (la copia JSON del marcador) vuelve a los Asterismos de antes', () => {
    plan('tepok', 'garra'); tray.tp = 2;
    const antes = JSON.stringify(tray);                                     // lo que guarda snapshot()
    asterismosNuevoPI([op('sl.kroxigor', 0, 10, 10), op('gn.combatiente', 1, 20, 20)], ZONAS);
    usarLector(0, 'itzl', [{ ...op('sl.sacerdoteEstelar', 0), id: 'L' }]);
    expect(asterismoActivo(0, 'itzl')).toBe(true);
    delete tray.saurios; Object.assign(tray, JSON.parse(antes));            // lo que hace doUndo()
    expect(asterismoActivo(0, 'itzl')).toBe(false);
    expect(asterismoActivo(0, 'tepok')).toBe(true);
    expect(formacion(0)).toBe('garra');
  });
});
