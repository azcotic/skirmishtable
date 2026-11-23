// Reglas de facción: elecciones (Dones de Tzeentch) y Astartes (src/data/teams, src/game/acciones.js)
import { describe, expect, it } from 'vitest';
import { aplicarOpciones, eleccionesDe, registrarComandos } from '../../src/data/teams/index.js';
import { mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { costeAccion, esAstartes, puedeReaccionar } from '../../src/game/acciones.js';

registrarComandos();
const conOpcion = (kind, don) => { const op = mkOp('A1', 0, 'x', kind, 1, 1); op.opciones = { dones: don }; return aplicarOpciones(op); };

describe('elecciones de facción', () => {
  it('el Aquelarre Disforme declara sus dones; la Garra Némesis, ninguna elección', () => {
    expect(eleccionesDe('3348897103').map(e => e.id)).toEqual(['dones', 'armasTirador', 'armasCampeon', 'armasTzaangor']);
    expect(eleccionesDe('3352828814')).toEqual([]);
  });
  it('Caminante temporal: +1″; Hinchazón disforme: +1 al daño normal en combate', () => {
    expect(conOpcion('ad.hechiceroDestino', 'caminante').move).toBe(7);
    const h = conOpcion('ad.hechiceroDestino', 'hinchazon');
    expect(WPN[h.weapons[2]].dmgN).toBe(WPN['ad.bastonPsicofuerza'].dmgN + 1);
  });
  it('Bombardeo astral: Devastadora 1 solo en la primera arma psíquica', () => {
    const h = conOpcion('ad.hechiceroFuego', 'bombardeo');
    expect(WPN[h.weapons[0]].rules).toContain('Devastating 1');
    expect(h.weapons[1]).toBe('ad.quemarMente');
  });
  it('sin opciones, vuelve a su ficha', () => {
    const h = conOpcion('ad.hechiceroDestino', 'caminante');
    h.opciones = undefined; aplicarOpciones(h);
    expect(h.move).toBe(6);
  });
});

describe('Astartes', () => {
  it('Marines Rúbrica sí, Tzaangor no; el segundo disparo con el cañón cuesta 1 PA más', () => {
    const t = mkOp('A1', 0, 'x', 'ad.tiradorRubrica', 1, 1);
    expect(esAstartes(t)).toBe(true);
    expect(esAstartes(mkOp('A2', 0, 'x', 'ad.combatienteTzaangor', 1, 1))).toBe(false);
    expect(costeAccion(t, 'shoot')).toBe(1);
    t.used = ['shoot'];
    expect(costeAccion(t, 'shoot')).toBe(2);
  });
  it('reacciona con cualquier orden', () => {
    const t = { ...mkOp('A1', 0, 'x', 'ad.tiradorRubrica', 1, 1), ready: false, order: 'conceal' };
    expect(puedeReaccionar(t)).toBe(true);
  });
});

describe('opciones de arma', () => {
  const con = (kind, eleccion, opcion) => { const op = mkOp('A1', 0, 'x', kind, 1, 1); op.opciones = { [eleccion]: opcion }; return aplicarOpciones(op); };
  it('el Combatiente Tzaangor con arma y escudo: Salvación 4+', () => {
    const t = con('ad.combatienteTzaangor', 'armasTzaangor', 'escudoTz');
    expect(t.weapons).toEqual(['ad.armaEscudo']);
    expect(t.save).toBe(4);
    expect(con('ad.combatienteTzaangor', 'armasTzaangor', 'pistolaEspada').weapons).toEqual(['ad.pistolaAutomatica', 'ad.espadaSierra']);
    expect(con('ad.combatienteTzaangor', 'armasTzaangor', 'armasTz').save).toBe(5);
  });
  it('Bombardeo astral convierte la Devastadora del Proyectil en Devastadora a 2″', () => {
    const op = mkOp('A1', 0, 'x', 'ad.hechiceroDestino', 1, 1); op.opciones = { dones: 'bombardeo' }; aplicarOpciones(op);
    expect(WPN[op.weapons[0]].rules).toContain('2" Devastating 2');
    expect(WPN[op.weapons[0]].rules).not.toContain('Devastating 1');
  });
});
