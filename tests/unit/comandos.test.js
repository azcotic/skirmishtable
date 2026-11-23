// Comandos con fichas reales (src/data/teams/): datos completos y coherentes, registro en las
// tablas del motor, modelo 3D de cada agente y reglas de arma en español.
import { describe, expect, it } from 'vitest';
import { COMANDOS, modelosPara, plantillaDefs, puedeAnadir, registrarComandos, validarComando } from '../../src/data/teams/index.js';
import { KINDS, mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { TTS_TEAMS } from '../../src/data/tts-teams.js';
import { traducirCatalogo } from '../../src/i18n/nombres.js';
import { traducirRegla } from '../../src/i18n/es.js';

registrarComandos();

describe('fichas de los comandos', () => {
  for (const c of COMANDOS) {
    it(`${c.nombre}: agentes y armas completos`, () => {
      for (const [k, a] of Object.entries(c.agentes)) {
        expect([2, 3], k).toContain(a.apl);
        expect(a.move, k).toBeGreaterThanOrEqual(5);
        expect(a.save, k).toBeGreaterThanOrEqual(2);
        expect(a.wounds, k).toBeGreaterThanOrEqual(7);
        expect(a.armas.length, k).toBeGreaterThan(0);
        for (const w of a.armas) expect(c.armas[w], `${k}: ${w}`).toBeTruthy();
      }
      for (const [k, w] of Object.entries(c.armas)) {
        expect(['R', 'M'], k).toContain(w.type);
        expect(w.atk, k).toBeGreaterThan(0);
        expect(w.hit, k).toBeGreaterThanOrEqual(2);
      }
      expect(validarComando(c, c.plantilla).ok, "plantilla").toBe(true);
      for (const e of c.ejemplos) expect(validarComando(c, e.agentes).errores, e.nombre).toEqual([]);
    });
  }

  it('se registran en KINDS y WPN, y un agente toma su perfil', () => {
    expect(KINDS['gn.visionario']).toMatchObject({ apl: 3, move: 6, save: 3, wounds: 15, nombre: 'Visionario', lider: true });
    expect(WPN['ad.canonConcentrado'].name).toBe('Cañón cosechaalmas (concentrado)');
    const op = mkOp('B3', 1, 'Tirador Marine Rúbrica', 'ad.tiradorRubrica', 1, 1);
    expect(op).toMatchObject({ move: 5, save: 2, maxW: 14, weapon: 'ad.canonConcentrado' });
  });

  it('la plantilla de cada bando: ids A1…/B1…, y fichas simples sin comando', () => {
    expect(plantillaDefs(0, '3352828814').map(d => d[0])).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6']);
    expect(plantillaDefs(1, '3348897103').length).toBe(5);
    expect(plantillaDefs(1, '3348897103')[0]).toEqual(['B1', 1, 'Hechicero del Destino', 'ad.hechiceroDestino']);
    expect(plantillaDefs(1, null).every(d => d[1] === 1)).toBe(true);
  });

  it('cada agente de la plantilla encuentra su modelo en el mod de Steam', () => {
    const equipos = traducirCatalogo(JSON.parse(JSON.stringify(TTS_TEAMS)));
    for (const [side, id] of [[0, '3352828814'], [1, '3348897103']]) {
      const team = equipos.find(t => t.id === id);
      const ops = plantillaDefs(side, id).map(([oid, s, n, k]) => ({ id: oid, team: s, name: n, kind: k }));
      const picks = modelosPara(ops, team);
      expect(Object.keys(picks).length, id).toBe(ops.length);
      for (const op of ops) expect(team.models[picks[op.id]].name.startsWith(KINDS[op.kind].nombre), op.id).toBe(true);
    }
  });
});

describe('composición del comando', () => {
  const ad = COMANDOS.find(c => c.prefijo === 'ad'), gn = COMANDOS.find(c => c.prefijo === 'gn');
  it('Aquelarre Disforme: 5 selecciones, Tzaangor a media, al menos un hechicero', () => {
    expect(validarComando(ad, ['hechiceroDestino', 'tiradorRubrica', 'portaiconoRubrica', 'combatienteRubrica']).errores).toEqual([['faltan', 1]]);
    expect(validarComando(ad, ['hechiceroDestino', 'tiradorRubrica', 'portaiconoRubrica', 'combatienteRubrica', 'combatienteTzaangor']).errores).toEqual([['faltan', 0.5]]);
    expect(validarComando(ad, ['tiradorRubrica', 'portaiconoRubrica', 'combatienteRubrica', 'combatienteRubrica', 'combatienteRubrica']).errores).toEqual([['requiere', 'Hechicero']]);
    expect(puedeAnadir(ad, ['hechiceroDestino'], 'hechiceroDestino').motivo).toBe('unico');
    expect(puedeAnadir(ad, ['hechiceroDestino', 'tiradorRubrica', 'portaiconoRubrica', 'combatienteRubrica', 'combatienteTzaangor'], 'combatienteTzaangor').ok).toBe(true);
    expect(puedeAnadir(ad, ['hechiceroDestino', 'tiradorRubrica', 'portaiconoRubrica', 'combatienteRubrica', 'combatienteTzaangor'], 'combatienteRubrica').motivo).toBe('lleno');
  });
  it('Garra Némesis: 6, con el Visionario, combatientes repetibles', () => {
    expect(validarComando(gn, ['visionario', 'combatiente', 'combatiente', 'combatiente', 'aullador', 'tirador']).ok).toBe(true);
    expect(puedeAnadir(gn, ['aullador'], 'aullador').motivo).toBe('unico');
  });
});

describe('reglas de arma en español', () => {
  it('con y sin parámetro', () => {
    expect(traducirRegla('Lethal 5+')).toBe('Letal 5+');
    expect(traducirRegla('Range 8"')).toBe('Alcance 8″');
    expect(traducirRegla('Piercing Crits 1')).toBe('Críticos de penetración 1');
    expect(traducirRegla('Heavy (Reposition only)')).toBe('Pesada (solo Reposicionarse)');
    expect(traducirRegla('Seek Light')).toBe('Buscadora (Ligero)');
    expect(traducirRegla('PSYCHIC')).toBe('Psíquica');
    expect(traducirRegla('Terrorchem*')).toBe('Terrotoxinas*');
  });
});
