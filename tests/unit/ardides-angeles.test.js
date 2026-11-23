// Ardides de estrategia de los Ángeles de la Muerte (src/ui/ardides.js)
import { describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { armaPara, effHit, effMove, resolverDisparo } from '../../src/engine/dice.js';
import { ARDID, conectarArdides, elegirDoctrina } from '../../src/ui/ardides.js';

registrarComandos();
const tray = { ardides: [[], []] };
conectarArdides(tray);
const op = (kind, team, x = 5, y = 5) => mkOp(team ? 'B1' : 'A1', team, 'x', kind, x, y);

describe('ardides de los Ángeles de la Muerte', () => {
  it('Doctrina de combate: Equilibrada según la distancia o al combatir', () => {
    const am = op('am.combatienteIntercesor', 0, 5, 5), cerca = op('gn.combatiente', 1, 9, 5), lejos = op('gn.combatiente', 1, 20, 5);
    const rifle = WPN['am.rifleBolter'], punos = WPN['am.punos'];
    tray.ardides = [[ARDID.doctrina], []];
    elegirDoctrina(0, 'devastadora');
    expect(armaPara(rifle, am, lejos, 'disparo').rules).toContain('Balanced');
    expect(armaPara(rifle, am, cerca, 'disparo').rules).not.toContain('Balanced');
    elegirDoctrina(0, 'tactica');
    expect(armaPara(rifle, am, cerca, 'disparo').rules).toContain('Balanced');
    expect(armaPara(rifle, am, lejos, 'disparo').rules).not.toContain('Balanced');
    elegirDoctrina(0, 'asalto');
    expect(armaPara(punos, am, cerca, 'combate').rules).toContain('Balanced');
    expect(armaPara(rifle, am, cerca, 'disparo').rules).not.toContain('Balanced');
  });
  it('Y no conocerán el miedo: un lesionado no empeora Impactar ni Movimiento', () => {
    const am = op('am.tiradorIntercesor', 0);
    am.wounds = 3;
    tray.ardides = [[], []];
    expect(effHit(am, WPN['am.rifleBolter'])).toBe(4);
    expect(effMove(am)).toBe(4);
    tray.ardides = [[ARDID.miedo], []];
    expect(effHit(am, WPN['am.rifleBolter'])).toBe(3);
    expect(effMove(am)).toBe(6);
  });
  it('Indomitus: con dos fallos en defensa, uno pasa a éxito normal', () => {
    const am = op('am.tiradorIntercesor', 1), rival = op('gn.tirador', 0);
    const w = WPN['gn.bolter'], what = { k: 'shoot', w: 'gn.bolter', acc: 0, obsc: false, cover: false };
    const atk = { crit: 0, norm: 3, notes: [] };
    tray.ardides = [[], []];
    const sin = resolverDisparo(what, w, 3, atk, am, undefined, [1, 2, 4]);
    tray.ardides = [[], [ARDID.indomitus]];
    const con = resolverDisparo(what, w, 3, atk, am, undefined, [1, 2, 4]);
    expect(con.dfn.norm).toBe(sin.dfn.norm + 1);
    expect(con.dmg).toBe(sin.dmg - w.dmgN);
    // un solo fallo: nada
    const uno = resolverDisparo(what, w, 3, atk, am, undefined, [1, 4, 5]);
    expect(uno.dfn.norm).toBe(2);
  });
});
