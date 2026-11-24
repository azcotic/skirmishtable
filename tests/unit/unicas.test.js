// Acciones únicas psíquicas de los Hechiceros (src/game/unicas.js, src/ui/unicas.js)
import { beforeEach, describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OPS, buildWorld, mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { armaPara, resolverDisparo, rollAttack } from '../../src/engine/dice.js';
import { alcanceUnica, efectoEn, objetivosUnica, ponerEfecto, puedeUnica, unicasDe } from '../../src/game/unicas.js';
import '../../src/ui/unicas.js';

registrarComandos();
const seq = (...v) => { let i = 0; return () => v[i++ % v.length]; };
let h, h2, e, tray;
beforeEach(() => {
  buildWorld({ name: 'test', w: 24, h: 12, objectives: [], terrain: [], spawns: [[[1, 1]], [[23, 11]]] });
  h = mkOp('A1', 0, 'h', 'ad.hechiceroDestino', 5, 5); h2 = mkOp('A2', 0, 'h2', 'ad.hechiceroTempireo', 8, 5);
  e = mkOp('B1', 1, 'e', 'ad.combatienteRubrica', 12, 5);
  OPS.length = 0; OPS.push(h, h2, e);
  tray = { tp: 1, cp: [2, 2] };
});
const siempre = () => true;

describe('acciones únicas psíquicas', () => {
  it('cada Hechicero tiene las suyas y Maestro del Immaterium suma 3″', () => {
    expect(unicasDe(h)).toEqual(['proteccionDestino', 'saboteaDestino']);
    expect(unicasDe(h2)).toEqual(['ritual', 'flujoTemporal']);
    expect(alcanceUnica(h, 'saboteaDestino')).toBe(9);
    h.opciones = { dones: 'maestro' };
    expect(alcanceUnica(h, 'saboteaDestino')).toBe(12);
    expect(alcanceUnica(h, 'proteccionDestino')).toBeNull();
  });
  it('objetivos: Sabotear solo a enemigos a 9″; Ritual solo a heridos amigos a 6″', () => {
    e.x = 25; expect(objetivosUnica(h, 'saboteaDestino', OPS, siempre)).toEqual([]);
    e.x = 12; expect(objetivosUnica(h, 'saboteaDestino', OPS, siempre).map(o => o.id)).toEqual(['B1']);
    expect(objetivosUnica(h2, 'ritual', OPS, siempre)).toEqual([]);           // nadie herido
    h.wounds = 5; expect(objetivosUnica(h2, 'ritual', OPS, siempre).map(o => o.id)).toEqual(['A1']);
  });
  it('puede: no en zona de control, sin PA, Ritual una vez por punto de inflexión, Flujo pendiente', () => {
    expect(puedeUnica(h, 'proteccionDestino', OPS, tray).ok).toBe(true);
    expect(puedeUnica(h2, 'flujoTemporal', OPS, tray).motivo).toBe('pendiente');
    h.ap = 0; expect(puedeUnica(h, 'proteccionDestino', OPS, tray).motivo).toBe('sinPA');
    h.ap = 3; e.x = 5.5; expect(puedeUnica(h, 'proteccionDestino', OPS, tray).motivo).toBe('enZonaDeControl');
    e.x = 12; tray.ritual = [1, null];
    expect(puedeUnica(h2, 'ritual', OPS, tray).motivo).toBe('yaEsePI');
    tray.ritual = [null, null]; h.vetadas = ['u:proteccionDestino'];
    expect(puedeUnica(h, 'proteccionDestino', OPS, tray).motivo).toBe('vetada');
  });
  it('los efectos duran hasta la siguiente activación del que los puso', () => {
    ponerEfecto(h, 'prender', e, OPS);
    expect(efectoEn(e, 'prender', OPS)).not.toBeNull();
    h.used = ['unica:prender']; h.ap = 2;                      // sigue activándose
    expect(efectoEn(e, 'prender', OPS)).not.toBeNull();
    h.ready = false; h.activaciones = 1; h.used = [];          // terminó: sigue hasta que empiece otra
    expect(efectoEn(e, 'prender', OPS)).not.toBeNull();
    h.ready = true; h.ap = 3; h.used = [];                     // nuevo punto de inflexión, aún sin empezar
    expect(efectoEn(e, 'prender', OPS)).not.toBeNull();
    h.used = ['reposition']; h.ap = 2;                         // empezó su siguiente activación
    expect(efectoEn(e, 'prender', OPS)).toBeNull();
    ponerEfecto(h, 'prender', e, OPS); h.alive = false;        // incapacitado
    expect(efectoEn(e, 'prender', OPS)).toBeNull();
  });
  it('Prender da Incesante a las armas del bando; el efecto repetido de un amigo reemplaza al anterior', () => {
    const w = WPN['ad.bolterInfierno'];
    expect(armaPara(w, h2, e, 'disparo').rules).not.toContain('Ceaseless');
    ponerEfecto(h, 'prender', e, OPS);
    expect(armaPara(w, h2, e, 'disparo').rules).toContain('Ceaseless');
    expect(armaPara(w, e, h2, 'disparo').rules).not.toContain('Ceaseless');
    ponerEfecto(h2, 'prender', e, OPS);
    expect(e.fx).toHaveLength(1); expect(e.fx[0].de).toBe('A2');
  });
  it('Sabotear destino: los 6 del atacante se repiten; sin el efecto, no', () => {
    expect(rollAttack(3, 3, [], seq(6, 6, 2, 5, 4), e).dice).toEqual([6, 6, 2]);
    ponerEfecto(h, 'saboteaDestino', e, OPS);
    const r = rollAttack(3, 3, [], seq(6, 6, 2, 5, 4), e);
    expect(r.dice).toEqual([5, 4, 2]);
  });
  it('Protección del destino: el defensor repite todos sus dados fallados', () => {
    const w = { ...WPN['ad.bolterInfierno'], rules: [] };
    const atk = { crit: 0, norm: 2, dice: [4, 4], notes: [] };
    ponerEfecto(h2, 'proteccionDestino', h, OPS);
    const r = resolverDisparo({ what: 1, cover: false }, w, 3, atk, h, seq(1, 1, 1, 6, 3, 2), null, false);
    // defensa 3+: tiró 1,1,1 (todos fallan) y los repite: 6, 3, 2
    expect(r.dfn.dice).toEqual([6, 3, 2]);
    expect(r.notes).toContain('proteccionDestino');
  });
});

describe('habilidades de ficha del Aquelarre', () => {
  it('Autómata hechizado: solo sin Hechicero a 9″ o menos', async () => {
    const { automataSinHechicero } = await import('../../src/ui/ardides.js');
    const r = mkOp('A3', 0, 'r', 'ad.combatienteRubrica', 5, 15 - 5);
    r.x = 5; r.y = 5; h.x = 12; h.y = 5; OPS.push(r);
    expect(automataSinHechicero(r)).toBe(false);
    h.x = 20; h2.x = 22; expect(automataSinHechicero(r)).toBe(true);
    expect(automataSinHechicero(h)).toBe(false);          // un Hechicero no es Marine Rúbrica
  });
  it('Lento y decidido: Incesante al disparar sin Cargar ni Reposicionarse', () => {
    const r = mkOp('A3', 0, 'r', 'ad.combatienteRubrica', 5, 5); OPS.push(r);
    const w = WPN['ad.bolterInfierno'];
    expect(armaPara(w, r, e, 'disparo').rules).toContain('Ceaseless');
    r.used = ['reposition'];
    expect(armaPara(w, r, e, 'disparo').rules).not.toContain('Ceaseless');
    r.reaccion = true; expect(armaPara(w, r, e, 'disparo').rules).toContain('Ceaseless');
    const t = mkOp('A4', 0, 't', 'ad.tiradorRubrica', 5, 5);
    expect(armaPara(WPN['ad.bolterInfierno'], t, e, 'disparo').rules).not.toContain('Ceaseless');
  });
  it('Estandarte del rebaño: -1 al daño normal de 3 o más a un Tzaangor cercano al Portaicono', async () => {
    const { bajaNormal } = await import('../../src/engine/dice.js');
    const p = mkOp('A3', 0, 'p', 'ad.portaiconoTzaangor', 5, 5), t = mkOp('A4', 0, 't', 'ad.combatienteTzaangor', 7, 5);
    OPS.push(p, t);
    expect(bajaNormal(t, 3)).toBe(1);
    expect(bajaNormal(t, 2)).toBe(0);                      // solo daño de 3 o más
    t.x = 15; expect(bajaNormal(t, 3)).toBe(0);            // lejos
    expect(bajaNormal(p, 4)).toBe(0);                      // el Portaicono no se protege a sí mismo
    expect(bajaNormal(h, 4)).toBe(0);                      // solo Tzaangor
  });
  it('Cuerno de la manada: acción de 0 PA, una vez por punto de inflexión', () => {
    const c = mkOp('A3', 0, 'c', 'ad.portacuernoTzaangor', 5, 5); OPS.push(c);
    expect(unicasDe(c)).toEqual(['cuerno']);
    expect(puedeUnica(c, 'cuerno', OPS, tray).ok).toBe(true);
    c.cuernoTP = 1; expect(puedeUnica(c, 'cuerno', OPS, tray).motivo).toBe('yaEsePI');
  });
});
