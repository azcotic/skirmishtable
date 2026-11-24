// Motor de disparadores de ardides de tiroteo (src/game/disparadores.js) y Todo es polvo
import { beforeEach, describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { mkOp } from '../../src/engine/world.js';
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
