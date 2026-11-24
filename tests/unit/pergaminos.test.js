// Pergaminos de hechicería (equipo de facción del Aquelarre, src/ui/ardides.js)
import { beforeEach, describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OPS, mkOp, ajustarAgente } from '../../src/engine/world.js';
import { conectarArdides } from '../../src/ui/ardides.js';
import { candidatos } from '../../src/game/disparadores.js';

registrarComandos();
let tray, h1, h2;
beforeEach(() => {
  tray = { tp: 1, cp: [2, 2], ardidesT: [[], []], ardides: [[], []], equipoFaccion: [['pergaminos'], []] };
  conectarArdides(tray);
  h1 = mkOp('H1', 0, 'h1', 'ad.hechiceroDestino', 5, 5); h2 = mkOp('H2', 0, 'h2', 'ad.hechiceroFuego', 30, 5);
  h1.opciones = { dones: 'caminante' }; h2.opciones = { dones: 'giro' };
  ajustarAgente(h1); ajustarAgente(h2);
  OPS.length = 0; OPS.push(h1, h2);
});
const nombres = (m, ctx) => candidatos(tray, m, ctx).map(x => x.d.ardid);

describe('Pergaminos de hechicería', () => {
  it('se ofrece a un Hechicero al activarse o reaccionar, sin coste en PM', () => {
    expect(nombres('inicioActivacion', { op: h1 })).toEqual(['Pergaminos de hechicería']);
    expect(nombres('reaccion', { op: h2 })).toEqual(['Pergaminos de hechicería']);
    expect(candidatos(tray, 'inicioActivacion', { op: h1 })[0].d.gratis).toBe(true);
  });
  it('solo con el equipo elegido y una vez por batalla', () => {
    tray.equipoFaccion = [[], []];
    expect(nombres('inicioActivacion', { op: h1 })).toEqual([]);
    tray.equipoFaccion = [['pergaminos'], []]; tray.pergaminos = [true, false];
    expect(nombres('inicioActivacion', { op: h1 })).toEqual([]);
  });
  it('cambiar el Don recalcula movimiento y armas', () => {
    const mov = h1.move;
    h1.opciones = { dones: 'vision' }; ajustarAgente(h1);
    expect(h1.move).toBe(mov - 1);   // ya no tiene Caminante temporal
  });
});
