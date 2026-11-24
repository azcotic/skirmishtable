import { describe, it, expect } from 'vitest';
import { MAX_EQUIPO, UNIVERSAL, alternarEquipo, equipoDeFaccion, puedeElegir, separar, todoElEquipo } from '../../src/game/equipo.js';
import { COMANDOS } from '../../src/data/teams/index.js';

const ang = COMANDOS.find(c => c.id === '2272196183'), aqu = COMANDOS.find(c => c.id === '3348897103');

describe('equipo del comando', () => {
  it('cada comando de prueba tiene su equipo de facción', () => {
    expect(equipoDeFaccion(ang).map(e => e.id)).toEqual(['sellos', 'relicarios', 'escudos', 'auspex']);
    expect(equipoDeFaccion(aqu).map(e => e.id)).toContain('balas');
    expect(UNIVERSAL.length).toBe(11);
  });
  it('hasta 4 opciones, sin repetir', () => {
    let e = [];
    for (const id of ['sellos', 'minas', 'escaleras', 'auspex', 'alambre']) e = alternarEquipo(ang, e, id);
    expect(e.length).toBe(MAX_EQUIPO);
    expect(e).not.toContain('alambre');
    expect(puedeElegir(ang, e, 'sellos')).toEqual({ ok: false, motivo: 'repetido' });
    expect(puedeElegir(ang, e, 'alambre')).toEqual({ ok: false, motivo: 'lleno' });
    expect(alternarEquipo(ang, e, 'minas')).not.toContain('minas');   // volver a tocar la quita
  });
  it('no deja elegir el equipo de otro comando', () => {
    expect(puedeElegir(ang, [], 'balas')).toEqual({ ok: false, motivo: 'desconocido' });
    expect(todoElEquipo(aqu).some(e => e.id === 'balas')).toBe(true);
  });
  it('separa facción y universal', () => {
    expect(separar(ang, ['sellos', 'minas'])).toEqual({ faccion: ['sellos'], universal: ['minas'] });
  });
});
