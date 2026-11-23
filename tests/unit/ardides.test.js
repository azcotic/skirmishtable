// Ardides de estrategia del Aquelarre Disforme (src/ui/ardides.js): cambian el arma con que se tira
import { describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { armaPara, iniciarCombate } from '../../src/engine/dice.js';
import { ARDID, conectarArdides, dadosGuardados, gastarDestino, guardarDestino } from '../../src/ui/ardides.js';

registrarComandos();
const tray = { ardides: [[], []] };
conectarArdides(tray);
const op = (kind, team) => mkOp(team ? 'B1' : 'A1', team, 'x', kind, 5, 5);
const dados = (...v) => { let i = 0; return () => v[i++]; };

describe('ardides del Aquelarre Disforme', () => {
  it('Protección etérea: Penetración 1 pasa a Penetración en críticos 1 al disparar a un agente suyo', () => {
    const rifle = { ...WPN['gn.riflePlasmaN'] };                 // Piercing 1
    const rubrica = op('ad.combatienteRubrica', 1), tirador = op('gn.tirador', 0);
    expect(armaPara(rifle, tirador, rubrica, 'disparo').rules).toContain('Piercing 1');
    tray.ardides = [[], [ARDID.proteccion]];
    const w = armaPara(rifle, tirador, rubrica, 'disparo');
    expect(w.rules).toContain('Piercing Crits 1');
    expect(w.rules).not.toContain('Piercing 1');
    expect(rifle.rules).toContain('Piercing 1');                    // el arma original no cambia
  });
  it('Hermandad de hechiceros: armas psíquicas con Equilibrada (sin otro hechicero cerca)', () => {
    tray.ardides = [[ARDID.hermandad], []];
    const h = op('ad.hechiceroDestino', 0);
    expect(armaPara(WPN['ad.proyectilCondenacion'], h, null, 'disparo').rules).toContain('Balanced');
    expect(armaPara(WPN['ad.pistolaBolterInfierno'], h, null, 'disparo').rules).not.toContain('Balanced');
  });
  it('Rebaño salvaje: Certera 1 en combate (1 dado menos tirado, un normal seguro)', () => {
    tray.ardides = [[ARDID.rebano], []];
    const tz = op('ad.combatienteTzaangor', 0), enemigo = op('gn.combatiente', 1);
    const est = iniciarCombate({ wa: 'ad.armasTzaangor', wb: 'gn.espadaSierra' }, tz, enemigo, dados(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1));
    expect(est.wa.rules).toContain('Accurate 1');
    expect(est.ra.dice.length).toBe(WPN['ad.armasTzaangor'].atk - 1);
    expect(est.pools[0].norm).toBe(1);
  });
  it('El destino es mi arma: guarda 2D6; si suman menos de 9, usar uno descarta el otro', () => {
    tray.destino = [null, null];
    expect(guardarDestino(0, dados(3, 4))).toEqual([3, 4]);
    expect(gastarDestino(0, 1)).toBe(4);
    expect(dadosGuardados(0)).toEqual([]);
    guardarDestino(0, dados(5, 6));
    expect(gastarDestino(0, 0)).toBe(5);
    expect(dadosGuardados(0)).toEqual([6]);
  });
});
