// Tácticas de capítulo y reglas de ficha de los Ángeles de la Muerte (src/ui/ardides.js)
import { describe, expect, it } from 'vitest';
import { aplicarOpciones, registrarComandos } from '../../src/data/teams/index.js';
import { mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { aplicarCombate, armaPara, iniciarCombate, opcionesCombate, rasgos, resolverDisparo } from '../../src/engine/dice.js';
import { aturdir } from '../../src/engine/efectos.js';
import { costeAccion } from '../../src/game/acciones.js';
import { conectarArdides, elegirFlexible, guerraDoctrinas, tacticasDe } from '../../src/ui/ardides.js';
import { OPS } from '../../src/engine/world.js';

registrarComandos();
const tray = { cp: [3, 3], ardides: [[], []], tacticas: [null, null] };
conectarArdides(tray);
const op = (kind, team = 0, x = 5, y = 5) => mkOp(team ? 'B1' : 'A1', team, 'x', kind, x, y);
const con = (...t) => { tray.tacticas = [t.length ? t : null, null]; tray.flex = [null, null]; };

describe('tácticas de capítulo', () => {
  it('primaria y secundaria; Tácticas flexibles cambia la secundaria; las repetidas no se acumulan', () => {
    const a = op('am.combatienteIntercesor');
    con('agresivos', 'duelistas');
    expect(tacticasDe(a)).toEqual(['agresivos', 'duelistas']);
    elegirFlexible(0, 'robustos');
    expect(tacticasDe(a)).toEqual(['agresivos', 'robustos']);
    elegirFlexible(0, null);
    expect(tacticasDe(a)).toEqual(['agresivos', 'duelistas']);
    expect(tacticasDe(op('gn.combatiente'))).toEqual([]);          // solo los Ángeles de la Muerte
    const s = op('am.sargentoIntercesor'); s.opciones = { veterano: 'agresivos' }; aplicarOpciones(s);
    expect(tacticasDe(s)).toEqual(['agresivos', 'duelistas']);       // Veterano: no se repite
    s.opciones = { veterano: 'moviles' }; aplicarOpciones(s);
    expect(tacticasDe(s)).toEqual(['agresivos', 'duelistas', 'moviles']);
  });
  it('el Francotirador Eliminador siempre tiene Sigilosos', () => {
    con('agresivos', 'duelistas');
    expect(tacticasDe(op('am.francotirador'))).toContain('sigilosos');
  });
  it('Agresivos: Desgarradora en combate; Asedios: Saturación; Tiradores certeros: Severa solo bólter y sin moverse', () => {
    const a = op('am.combatienteIntercesor'), foe = op('gn.combatiente', 1, 9, 5);
    con('agresivos', 'asedios');
    expect(armaPara(WPN['am.punos'], a, foe, 'combate').rules).toContain('Rending');
    expect(armaPara(WPN['am.rifleBolter'], a, foe, 'disparo').rules).toContain('Saturate');
    con('tiradores', 'agresivos');
    expect(armaPara(WPN['am.rifleBolter'], a, foe, 'disparo').rules).toContain('Severe');
    expect(armaPara(WPN['am.lanzagranadasFrag'], a, foe, 'disparo').rules).not.toContain('Severe');   // no es bólter
    a.used = ['reposition'];
    expect(armaPara(WPN['am.rifleBolter'], a, foe, 'disparo').rules).not.toContain('Severe');
  });
  it('Móviles: Retroceder cuesta 1 PA menos', () => {
    const a = op('am.combatienteIntercesor');
    con('duelistas', 'resueltos');
    expect(costeAccion(a, 'fallBack')).toBe(2);
    con('moviles', 'resueltos');
    expect(costeAccion(a, 'fallBack')).toBe(1);
  });
  it('Resueltos: Aturdidora no baja su LPA', () => {
    const a = op('am.combatienteIntercesor');
    con('moviles', 'duelistas');
    expect(aturdir(a, ['Stun'], 1)).toBe(true);
    const b = op('am.combatienteIntercesor');
    con('resueltos', 'duelistas');
    expect(aturdir(b, ['Stun'], 1)).toBe(false);
  });
  it('Duelistas: un éxito normal puede bloquear un crítico sin resolver (no contra Brutal)', () => {
    const a = op('am.combatienteIntercesor'), b = op('gn.combatiente', 1);
    con('duelistas', 'agresivos');
    const est = { rasgos: [rasgos(a), rasgos(b)], turno: 0,
      pools: [{ crit: 0, norm: 1, w: { rules: [] } }, { crit: 1, norm: 0, w: { rules: [] } }] };
    expect(opcionesCombate(est)).toContainEqual({ tipo: 'bloqueo', con: 'norm', contra: 'crit' });
    est.pools[1].w = { rules: ['Brutal'] };
    expect(opcionesCombate(est).some(o => o.tipo === 'bloqueo')).toBe(false);
  });
  it('Robustos: al contraatacar, el primer daño normal de 3 o más baja en 1; 5+ en defensa son críticos', () => {
    const a = op('gn.combatiente', 1), b = op('am.combatienteIntercesor', 0);
    con('robustos', 'agresivos');
    const est = iniciarCombate({ wa: 'gn.espadaSierra', wb: 'am.punos' }, a, b, () => 4);
    est.pools[0] = { crit: 0, norm: 2, w: { ...WPN['gn.espadaSierra'], rules: [] }, shock: false };
    est.pools[1] = { crit: 0, norm: 0, w: WPN['am.punos'], shock: false };
    est.rasgos = [{}, rasgos(b)];
    est.turno = 0;
    aplicarCombate(est, { tipo: 'golpe', con: 'norm' });
    expect(est.vida[1].wounds).toBe(b.wounds - (WPN['gn.espadaSierra'].dmgN - 1));
    aplicarCombate(est, { tipo: 'golpe', con: 'norm' });            // solo la primera vez
    expect(est.vida[1].wounds).toBe(b.wounds - (WPN['gn.espadaSierra'].dmgN - 1) - WPN['gn.espadaSierra'].dmgN);
    const tirador = op('gn.tirador', 1), w = WPN['gn.bolter'];
    const r = resolverDisparo({ k: 'shoot', w: 'gn.bolter', acc: 0, obsc: false, cover: false }, w, 3, { crit: 0, norm: 2, notes: [] }, b, undefined, [5, 5, 1]);
    expect(r.dfn.crit).toBe(2);
  });
  it('Sigilosos: con cobertura, la mejor de sus opciones', () => {
    const b = op('am.tiradorIntercesor', 1), w = WPN['gn.bolter'];
    con();
    tray.tacticas = [null, ['sigilosos', 'agresivos']];
    const what = { k: 'shoot', w: 'gn.bolter', acc: 0, obsc: false, cover: true };
    const atk = { crit: 0, norm: 3, notes: [] };
    const sin = (tray.tacticas = [null, null], resolverDisparo(what, w, 3, atk, b, undefined, [1, 1]));
    tray.tacticas = [null, ['sigilosos', 'agresivos']];
    const con2 = resolverDisparo(what, w, 3, atk, b, undefined, [1, 1]);
    expect(con2.dmg).toBeLessThan(sin.dmg);
  });
  it('Aura de hierro: el Capitán ignora el daño de un dado normal, una vez', () => {
    const cap = op('am.capitan', 1), w = WPN['gn.bolter'];
    con();
    const what = { k: 'shoot', w: 'gn.bolter', acc: 0, obsc: false, cover: false };
    const r = resolverDisparo(what, w, 3, { crit: 0, norm: 1, notes: [] }, cap, undefined, [1, 1, 1]);
    expect(r.aura).toBe(true);
    expect(r.dmg).toBe(0);
    cap.habUsadas = ['aura'];
    const r2 = resolverDisparo(what, w, 3, { crit: 0, norm: 1, notes: [] }, cap, undefined, [1, 1, 1]);
    expect(r2.aura).toBe(false);
    expect(r2.dmg).toBe(w.dmgN);
  });
  it('Guerra según las doctrinas: el Sargento usa cada doctrina gratis una vez por batalla', () => {
    OPS.splice(0, OPS.length);
    const s = op('am.sargentoAsalto', 0); s.id = 'A1'; s.deployed = true; OPS.push(s);
    tray.cp = [2, 2]; tray.guerra = [[], []]; tray.guerraPI = [null, null];
    expect(guerraDoctrinas(0, 'asalto')).toBe(true);
    expect(tray.cp[0]).toBe(3);
    expect(guerraDoctrinas(0, 'asalto')).toBe(true);              // cambiar de doctrina deshace y vuelve a aplicar
    expect(tray.cp[0]).toBe(3);
    expect(guerraDoctrinas(0, null)).toBe(false);                 // deshacer
    expect(tray.cp[0]).toBe(2);
    expect(guerraDoctrinas(0, 'devastadora')).toBe(false);        // ese Sargento no la tiene
    guerraDoctrinas(0, 'asalto'); tray.guerraPI = [null, null];   // el siguiente PI: ya la gastó
    expect(guerraDoctrinas(0, 'asalto')).toBe(false);
    expect(guerraDoctrinas(0, 'tactica')).toBe(true);
    OPS.splice(0, OPS.length);
  });
});

describe('Sigilosos: elige el jugador', () => {
  it('la opción elegida se respeta aunque no sea la mejor; sin elección, la mejor', async () => {
    const { opcionesSigilosos } = await import('../../src/ui/ardides.js');
    const b = op('am.tiradorIntercesor', 1), w = WPN['gn.bolter'];
    tray.tacticas = [null, ['sigilosos', 'agresivos']]; tray.flex = [null, null];
    const what = { k: 'shoot', w: 'gn.bolter', acc: 0, obsc: false, cover: true };
    expect(opcionesSigilosos(b, w, what)).toEqual(['extra', 'critico']);
    expect(opcionesSigilosos(b, w, { ...what, cover: false })).toEqual([]);
    expect(opcionesSigilosos(b, { ...w, rules: ['Saturate'] }, what)).toEqual([]);          // Saturación: sin cobertura
    expect(opcionesSigilosos(op('am.francotirador', 1), { ...w, rules: ['Saturate'] }, what)).toEqual(['extra', 'critico', 'ambas']);   // la Capa la ignora
    const atk = { crit: 0, norm: 3, notes: [] };
    const dmg = sigilo => resolverDisparo({ ...what, sigilo }, w, 3, atk, b, undefined, [1, 1]).dmg;
    expect(dmg('extra')).toBeLessThan(dmg('critico'));      // sin críticos del atacante, la extra es mejor
    expect(dmg(undefined)).toBe(dmg('extra'));               // por defecto, la mejor
  });
});

describe('Aura de hierro: ventana de sí o no', () => {
  it('lee su configuración de los datos y respeta la respuesta del jugador', () => {
    const cap = op('am.capitan', 1), w = WPN['gn.bolter'];
    con();
    const what = { k: 'shoot', w: 'gn.bolter', acc: 0, obsc: false, cover: false };
    const atk = { crit: 0, norm: 1, notes: [] };
    const sin = resolverDisparo({ ...what, aura: false }, w, 3, atk, cap, undefined, [1, 1, 1]);
    expect(sin.auraPosible).toBe(true);                 // la ventana se ofrece…
    expect(sin.aura).toBe(false);                       // …y con "no" el daño pasa
    expect(sin.dmg).toBe(w.dmgN);
    const si = resolverDisparo({ ...what, aura: true }, w, 3, atk, cap, undefined, [1, 1, 1]);
    expect(si.dmg).toBe(0);
    expect(op('am.sargentoAsalto', 1).kind).toBeTruthy();
  });
});
