// Nombres propios en español oficial (src/i18n/nombres.js), incluidas las variantes con que
// los mods de Steam nombran a los agentes.
import { describe, expect, it } from 'vitest';
import { nombreES, traducirCatalogo } from '../../src/i18n/nombres.js';
import { TTS_TEAMS } from '../../src/data/tts-teams.js';

describe('nombreES', () => {
  it('comandos, agentes y armas de las dos fichas de prueba', () => {
    expect(nombreES('Warpcoven')).toBe('Aquelarre Disforme');
    expect(nombreES('Angels of Death')).toBe('Ángeles de la Muerte');
    expect(nombreES('Sorcerer of Warpfire')).toBe('Hechicero del Fuego Disforme');
    expect(nombreES('Eliminator Sniper')).toBe('Francotirador Eliminador');
    expect(nombreES('Stalker bolt rifle')).toBe('Rifle bólter silencio');
  });

  it('las variantes de los mods de Steam', () => {
    expect(nombreES('Rubric Gunner (Warpflamer)')).toBe('Tirador Marine Rúbrica (Lanzallamas disforme)');
    expect(nombreES('Rubric Gunner (Soulreaper Cannon)')).toBe('Tirador Marine Rúbrica (Cañón cosechaalmas)');
    expect(nombreES('Tzaangor Horn Blower')).toBe('Portacuerno Tzaangor');
    expect(nombreES('Tzaangor Warrior (Autopistol & Chainsword)')).toBe('Combatiente Tzaangor (Pistola automática y espada sierra)');
    expect(nombreES('Tzaangor Warrior (Blade & Shield)')).toBe('Combatiente Tzaangor (Arma y escudo)');
    expect(nombreES('Warpcoven (Space Marine 2 Models)')).toBe('Aquelarre Disforme (modelos de Space Marine 2)');
  });

  it('lo desconocido queda igual', () => {
    expect(nombreES('Kommando Boss Nob')).toBe('Kommando Boss Nob');
    expect(nombreES('')).toBe('');
  });

  it('todo el Aquelarre Disforme del catálogo queda en español', () => {
    const copia = JSON.parse(JSON.stringify(TTS_TEAMS.filter(t => /^Warpcoven/.test(t.name))));
    expect(copia.length).toBeGreaterThan(0);
    for (const t of traducirCatalogo(copia)) {
      expect(t.name).toMatch(/^Aquelarre Disforme/);
      for (const m of t.models) expect(m.name, m.name).not.toMatch(/Sorcerer|Rubric|Horn|Icon|Warrior|Champion|Gunner/);
    }
  });
});
