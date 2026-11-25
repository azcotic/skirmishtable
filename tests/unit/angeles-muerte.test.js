// Ángeles de la Muerte: composición (un solo líder) y opciones de arma (src/data/teams)
import { describe, expect, it } from 'vitest';
import { aplicarOpciones, comandoPorId, eleccionesDe, esArmaBolter, puedeAnadir, registrarComandos, validarComando } from '../../src/data/teams/index.js';
import { mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';

registrarComandos();
const AM = '2272196183', c = comandoPorId(AM);
const con = (kind, eleccion, opcion) => { const op = mkOp('A1', 0, 'x', kind, 1, 1); op.opciones = { [eleccion]: opcion }; return aplicarOpciones(op); };

describe('Ángeles de la Muerte', () => {
  it('las configuraciones de ejemplo cumplen la composición', () => {
    for (const e of c.ejemplos) expect(validarComando(c, e.agentes).ok, e.nombre).toBe(true);
  });
  it('un solo líder', () => {
    expect(puedeAnadir(c, ['capitan'], 'sargentoAsalto')).toMatchObject({ ok: false, motivo: 'maximo' });
    const v = validarComando(c, ['capitan', 'sargentoIntercesor', 'tiradorPesado', 'francotirador', 'combatienteAsalto', 'combatienteAsalto']);
    expect(v.errores).toContainEqual(['maximo', 'Líder', 1]);
    expect(validarComando(c, ['tiradorPesado', 'francotirador', 'granaderoAsalto', 'combatienteAsalto', 'combatienteAsalto', 'tiradorIntercesor']).errores)
      .toContainEqual(['requiere', 'Líder']);
  });
  it('opciones de arma de los sargentos: una de cada categoría', () => {
    const els = eleccionesDe(AM);
    expect(els.find(e => e.id === 'armasSargentoAsalto').opciones).toHaveLength(9);
    expect(els.find(e => e.id === 'armasSargento').opciones).toHaveLength(12);
    const s = con('am.sargentoIntercesor', 'armasSargento', 'silencio+punoEnergia4');
    expect(s.weapons).toEqual(['am.silencioPesado', 'am.silencioMovil', 'am.punoEnergia4']);
    expect(WPN['am.punoEnergia4'].atk).toBe(4);
    expect(con('am.sargentoAsalto', 'armasSargentoAsalto', 'plasma+espadaSierra').weapons)
      .toEqual(['am.pistolaPlasmaN', 'am.pistolaPlasmaS', 'am.espadaSierra']);
  });
  it('el Tirador Intercesor lleva siempre el lanzagranadas auxiliar', () => {
    expect(con('am.tiradorIntercesor', 'armasTiradorIntercesor', 'auto').weapons)
      .toEqual(['am.lanzagranadasFrag', 'am.lanzagranadasPerf', 'am.rifleBolterAuto', 'am.punos']);
  });
  it('armas bólter: a distancia con "bólter" en el nombre', () => {
    expect(esArmaBolter(WPN['am.pistolaBolterPesada'])).toBe(true);
    expect(esArmaBolter(WPN['am.silencioMovil'])).toBe(true);
    expect(esArmaBolter(WPN['am.pistolaPlasmaN'])).toBe(false);
    expect(esArmaBolter(WPN['am.lanzagranadasFrag'])).toBe(false);
  });
});

describe('Astartes de los Ángeles de la Muerte', () => {
  const tirador = (kind, primera) => {
    const op = { ...mkOp('A1', 0, 'x', kind, 1, 1), ready: true, ap: 3, order: 'engage' };
    aplicarOpciones(op);
    op.used = ['shoot']; op.disparadas = [primera]; op.ap = 2;
    return op;
  };
  it('dos disparos: al menos uno con un arma bólter', async () => {
    const { puede } = await import('../../src/game/acciones.js');
    const op = tirador('am.capitan', 'am.pistolaPlasmaN');
    op.weapon = 'am.pistolaPlasmaS';
    expect(puede(op, 'shoot', [op]).motivo).toBe('sinBolter');
    const s = tirador('am.sargentoAsalto', 'am.pistolaBolterPesada');
    s.weapons = ['am.pistolaPlasmaN']; s.weapon = 'am.pistolaPlasmaN';
    expect(puede(s, 'shoot', [s]).motivo).not.toBe('sinBolter');   // (aquí no hay blanco: sinBlanco)
  });
  it('el segundo disparo con el bólter pesado cuesta 1 PA más; con otra arma, no', async () => {
    const { costeAccion } = await import('../../src/game/acciones.js');
    const op = tirador('am.tiradorPesado', 'am.bolterPesadoC');
    expect(costeAccion(op, 'shoot', 'am.bolterPesadoB')).toBe(2);
    expect(costeAccion(op, 'shoot', 'am.pistolaBolter')).toBe(1);
    op.disparadas = ['am.pistolaBolter'];
    expect(costeAccion(op, 'shoot', 'am.bolterPesadoC')).toBe(1);
  });
});
