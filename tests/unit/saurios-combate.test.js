// Habilidades de combate de los Saurios de Lustria (src/ui/saurios-combate.js y los ganchos del motor)
import { beforeEach, describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OBJECTIVES, OPS, mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { cerrarCombate, effSave, fightRoll, iniciarCombate, meleeKey, resolverDisparo, puedeRenacer } from '../../src/engine/dice.js';
import { veneno } from '../../src/engine/efectos.js';
import { escaladaExcede } from '../../src/engine/movement.js';
import { sinCoberturaLigera } from '../../src/engine/shots.js';
import { DISPARADORES } from '../../src/game/disparadores.js';
import { conectarArdides, conectarRegistro } from '../../src/ui/ardides.js';
import { barridoPosible, candidatosEjemplo, conectarCombateSL, guardianesPara, objetivosBarrido, trasLucha } from '../../src/ui/saurios-combate.js';

registrarComandos();
conectarArdides({ tp: 1, cp: [2, 2], ardides: [[], []], equipoFaccion: [[], []] }); conectarRegistro(() => {});
let n = 0;
const op = (kind, team, x = 5, y = 5) => { const o = mkOp('T' + (++n), team, 'x' + n, kind, x, y); OPS.push(o); return o; };
const lucha = (a, b) => ({ k: 'fight', by: a.id, at: b.id, wa: meleeKey(a), wb: meleeKey(b) });
// un generador de dados: los `previos` primeros dados son 6 (ataques) y luego salen los de `resto`
const dados = (previos, ...resto) => { let i = 0; return () => i++ < previos ? 6 : (resto.length ? resto.shift() : 6); };
const atqs = (a, b) => WPN[meleeKey(a)].atk + WPN[meleeKey(b)].atk;
beforeEach(() => { OPS.length = 0; OBJECTIVES.length = 0; });

describe('Semilla de renacimiento', () => {
  const what = () => ({ k: 'shoot', by: 'x', at: 'y', w: 'gn.bolter', acc: 0, cover: false });
  const tira = (b, v) => resolverDisparo(what(), WPN['gn.bolter'], 3, { crit: 3, norm: 0, dice: [6, 6, 6] }, b, () => v, [1, 1, 1]);
  it('solo la tienen el Combatiente y la Guardia Saurio, una vez', () => {
    expect(puedeRenacer(op('sl.combatienteSaurio', 1))).toBe(true);
    expect(puedeRenacer(op('sl.guardiaSaurio', 1))).toBe(true);
    expect(puedeRenacer(op('sl.kroxigor', 1))).toBe(false);
    expect(puedeRenacer(op('gn.combatiente', 1))).toBe(false);
    const g = op('sl.guardiaSaurio', 1); g.semillaUsada = true;
    expect(puedeRenacer(g)).toBe(false);
  });
  it('al disparar: con 4+ se queda con 1 herida; con menos, queda incapacitado', () => {
    const s = op('sl.combatienteSaurio', 1); s.wounds = 2;
    const bien = tira(s, 4);
    expect(bien.semilla).toEqual({ dado: 4, ok: true });
    expect(bien.dmg).toBe(1);                                  // 2 - 1 = 1 herida
    const mal = tira(s, 3);
    expect(mal.semilla).toEqual({ dado: 3, ok: false });
    expect(mal.dmg).toBeGreaterThanOrEqual(2);
  });
  it('no tira si el daño no lo incapacita, ni si ya la gastó', () => {
    const s = op('sl.guardiaSaurio', 1);                       // heridas de sobra: un solo éxito normal no la incapacita
    const poco = resolverDisparo(what(), WPN['gn.bolter'], 3, { crit: 0, norm: 1, dice: [4] }, s, () => 6, [1, 1, 1]);
    expect(poco.semilla).toBeNull();
    s.wounds = 1; s.semillaUsada = true;
    expect(tira(s, 6).semilla).toBeNull();
  });
  it('repetir la resolución no tira otro dado', () => {
    const s = op('sl.combatienteSaurio', 1); s.wounds = 1;
    const w = what(); let k = 0;
    const die = () => [4, 1, 1, 1][k++] || 1;
    const a = resolverDisparo(w, WPN['gn.bolter'], 3, { crit: 3, norm: 0, dice: [6] }, s, die, [1, 1, 1]);
    const b = resolverDisparo(w, WPN['gn.bolter'], 3, { crit: 3, norm: 0, dice: [6] }, s, die, [1, 1, 1]);
    expect(a.semilla.dado).toBe(4);
    expect(b.semilla.dado).toBe(4);
    expect(k).toBe(1);
  });
  it('al combatir: el golpe que lo incapacita tira 1D6 (el mismo dado compartido)', () => {
    const a = op('gn.combatiente', 0), s = op('sl.guardiaSaurio', 1, 6, 5);
    s.wounds = 1;
    const ok = fightRoll(lucha(a, s), a, s, dados(atqs(a, s), 5));
    const paso = ok.pasos.find(p => p.semilla);
    expect(paso.semilla).toEqual({ dado: 5, ok: true });
    expect(ok.b.semillaUsada).toBe(true);
    expect(s.wounds).toBe(1); expect(s.semillaUsada).toBeUndefined();   // fightRoll no cambia los agentes
    const s2 = op('sl.guardiaSaurio', 1, 6, 6); s2.wounds = 1;
    const mal = fightRoll(lucha(a, s2), a, s2, dados(atqs(a, s2), 2));
    expect(mal.pasos.find(p => p.semilla).semilla.ok).toBe(false);
    expect(mal.b.alive).toBe(false);
  });
  it('el veneno también la tira, con el dado que se le da', () => {
    const s = op('sl.guardiaSaurio', 1); s.wounds = 1;
    expect(veneno(s, 2, () => 5)).toBe(1);
    expect(s.alive).toBe(true); expect(s.wounds).toBe(1); expect(s.semillaUsada).toBe(true);
    s.wounds = 1;
    veneno(s, 2, () => 6);                                       // ya la gastó
    expect(s.alive).toBe(false);
  });
});

describe('Mordisco', () => {
  const sinGolpes = (a, b) => iniciarCombate(lucha(a, b), a, b, () => 1);   // todos fallan: nadie recibe daño
  it('con 5+ el enemigo recibe 1 de daño; con menos, no', () => {
    const a = op('sl.saurioEscamadura', 0), b = op('gn.combatiente', 1, 6, 5);
    const est = sinGolpes(a, b), antes = est.vida[1].wounds;
    cerrarCombate(est, () => 5);
    expect(est.vida[1].wounds).toBe(antes - 1);
    expect(est.pasos.at(-1)).toMatchObject({ tipo: 'mordisco', dado: 5, dmg: 1 });
    const est2 = sinGolpes(a, b);
    cerrarCombate(est2, () => 4);
    expect(est2.vida[1].wounds).toBe(antes);
    expect(est2.pasos.at(-1)).toMatchObject({ tipo: 'mordisco', dado: 4, dmg: 0 });
  });
  it('también el Combatiente Saurio; el Kroxigor y la Guardia, no', () => {
    const b = op('gn.combatiente', 1, 6, 5);
    for (const [k, muerde] of [['sl.combatienteSaurio', true], ['sl.kroxigor', false], ['sl.guardiaSaurio', false], ['gn.combatiente', false]]) {
      const a = op(k, 0), est = sinGolpes(a, b);
      cerrarCombate(est, () => 6);
      expect(est.pasos.some(p => p.tipo === 'mordisco')).toBe(muerde);
    }
  });
  it('no muerde si el enemigo ya quedó incapacitado', () => {
    const a = op('sl.saurioEscamadura', 0), b = op('gn.combatiente', 1, 6, 5), est = sinGolpes(a, b);
    est.vida[1].alive = false; est.vida[1].wounds = 0;
    cerrarCombate(est, () => 6);
    expect(est.pasos.some(p => p.tipo === 'mordisco')).toBe(false);
  });
  it('si el mordisco lo incapacita y es un Saurio con semilla, tira esa semilla', () => {
    const a = op('sl.saurioEscamadura', 0), b = op('sl.guardiaSaurio', 1, 6, 5);
    b.wounds = 1;
    const est = sinGolpes(a, b);
    cerrarCombate(est, () => 6);                                 // mordisco 6 (daño) y semilla 6 (renace)
    expect(est.vida[1]).toMatchObject({ wounds: 1, alive: true, semillaUsada: true });
    expect(est.pasos.at(-1).semilla).toEqual({ dado: 6, ok: true });
  });
  it('en fightRoll sale de la misma secuencia de dados (en línea ambos navegadores llegan a lo mismo)', () => {
    const a = op('sl.saurioEscamadura', 0), b = op('gn.combatiente', 1, 6, 5);
    const sec = () => { let i = 0; const v = [3, 2, 5, 4, 6, 1, 2, 5, 3, 6, 4, 4, 2, 6, 1, 5]; return () => v[i++ % v.length]; };
    const r1 = fightRoll(lucha(a, b), a, b, sec()), r2 = fightRoll(lucha(a, b), a, b, sec());
    expect(r1).toEqual(r2);
  });
});

describe('Cohortes ordenadas', () => {
  it('con un marcador bajo su control, Salvación 3+; sin él, la normal', () => {
    const s = op('sl.combatienteSaurio', 0, 10, 10), g = op('sl.guardiaSaurio', 0, 10, 10.5);
    expect(effSave(s)).toBe(s.save);
    OBJECTIVES.push({ x: 10, y: 10 });
    expect(effSave(s)).toBe(Math.min(3, s.save));
    expect(effSave(g)).toBe(g.save);                             // solo el Combatiente
    OBJECTIVES.length = 0; OBJECTIVES.push({ x: 30, y: 30 });
    expect(effSave(s)).toBe(s.save);
  });
  it('no lo controla si el enemigo suma más LPA ahí', () => {
    const s = op('sl.combatienteSaurio', 0, 10, 10); op('gn.combatiente', 1, 10, 11); op('gn.combatiente', 1, 11, 10);
    OBJECTIVES.push({ x: 10, y: 10 });
    expect(effSave(s)).toBe(s.save);
  });
  it('se nota en la tirada de defensa', () => {
    const s = op('sl.combatienteSaurio', 1, 10, 10);
    OBJECTIVES.push({ x: 10, y: 10 });
    const tira = () => resolverDisparo({ k: 'shoot', by: 'x', at: 'y', w: 'gn.bolter', acc: 0, cover: false }, WPN['gn.bolter'], 3, { crit: 0, norm: 3, dice: [4, 4, 4] }, s, () => 3).dfn;
    expect(tira().norm).toBe(3);                                 // un 3 vale con Salvación 3+
  });
});

describe('Inmenso', () => {
  it('el Kroxigor no tiene cobertura de terreno ligero; los demás, sí', () => {
    expect(sinCoberturaLigera.some(f => f(op('sl.kroxigor', 1)))).toBe(true);
    expect(sinCoberturaLigera.some(f => f(op('sl.combatienteSaurio', 1)))).toBe(false);
  });
  it('no escala más de 2″ en una acción', () => {
    const k = op('sl.kroxigor', 0), c = op('sl.combatienteSaurio', 0);
    const ruta = h => [[5, 5, 0, 0, 0], [6, 5, h, 0, 0], [8, 5, 0, 0, 0]];
    expect(escaladaExcede(k, ruta(2))).toBe(false);
    expect(escaladaExcede(k, ruta(3))).toBe(true);
    expect(escaladaExcede(c, ruta(3))).toBe(false);
  });
});

describe('Barrido del martillo y Ejemplo depredador', () => {
  const puentes = (luchas = []) => conectarCombateSL({ registro: () => {}, luchar: async o => { luchas.push(o); }, snapshot: () => {}, redibujar: () => {},
    esIA: () => true, enLinea: () => false });
  it('Barrido: una vez por activación, contra otro enemigo en su zona de control', async () => {
    const luchas = []; puentes(luchas);
    const k = op('sl.kroxigor', 0, 5, 5), muerto = op('gn.combatiente', 1, 6.5, 5), otro = op('gn.combatiente', 1, 5, 6.5);
    op('gn.combatiente', 1, 12, 5);
    k.activaciones = 1; muerto.alive = false;
    expect(barridoPosible(k)).toBe(true);
    expect(objetivosBarrido(k, muerto).map(o => o.id)).toEqual([otro.id]);
    await trasLucha(k, muerto);
    expect(luchas).toEqual([{ by: k.id, at: otro.id, gratis: true }]);
    expect(barridoPosible(k)).toBe(false);                       // ya lo usó en esta activación
    await trasLucha(k, muerto);
    expect(luchas).toHaveLength(1);
    k.activaciones = 2;                                          // otra activación
    expect(barridoPosible(k)).toBe(true);
  });
  it('Barrido: solo si incapacitó al enemigo, y solo el Kroxigor', async () => {
    const luchas = []; puentes(luchas);
    const k = op('sl.kroxigor', 0, 5, 5), vivo = op('gn.combatiente', 1, 6.5, 5);
    op('gn.combatiente', 1, 5, 6.5);
    await trasLucha(k, vivo);
    expect(luchas).toHaveLength(0);
    expect(barridoPosible(op('sl.combatienteSaurio', 0, 8, 8))).toBe(false);
  });
  it('Ejemplo depredador: con Estandarte, un Saurio listo a 3″ en la zona de control del mismo enemigo', async () => {
    const luchas = []; puentes(luchas);
    const l = op('sl.saurioEscamadura', 0, 5, 5), s = op('sl.combatienteSaurio', 0, 6, 6), lejos = op('sl.combatienteSaurio', 0, 5, 11),
      k = op('sl.kroxigor', 0, 5, 6.5), usado = op('sl.guardiaSaurio', 0, 6.5, 5), foe = op('gn.combatiente', 1, 6.5, 6.5);
    usado.ready = false; s.ready = true; lejos.ready = true; k.ready = true;
    expect(candidatosEjemplo(l, foe)).toEqual([]);              // sin Estandarte
    l.opciones = { armasEscamadura: 'estandarte' };
    const ids = candidatosEjemplo(l, foe).map(o => o.id);
    expect(ids).toContain(s.id);
    expect(ids).not.toContain(lejos.id);                        // a más de 3″
    expect(ids).not.toContain(k.id);                            // el Kroxigor no es Saurio
    expect(ids).not.toContain(usado.id);                        // no está listo
    await trasLucha(l, foe);
    expect(luchas).toHaveLength(1);
    expect(luchas[0]).toMatchObject({ at: foe.id, gratis: true });
    expect(l.ejemploUsado).toBe(true);
    await trasLucha(l, foe);
    expect(luchas).toHaveLength(1);                             // una vez por batalla
  });
  it('Ejemplo depredador: una lucha gratis no encadena otro Ejemplo', async () => {
    const luchas = []; puentes(luchas);
    const l = op('sl.saurioEscamadura', 0, 5, 5), s = op('sl.combatienteSaurio', 0, 6, 6), foe = op('gn.combatiente', 1, 6.5, 6.5);
    l.opciones = { armasEscamadura: 'estandarte' }; s.ready = true;
    await trasLucha(l, foe, { gratis: true });
    expect(luchas).toHaveLength(0);
  });
});

describe('Guardián inquebrantable', () => {
  it('reacciona la Guardia a 3″ de un amigo en cuya zona de control terminó la Carga, si no está ya en zona enemiga', () => {
    const g = op('sl.guardiaSaurio', 0, 5, 5), amigo = op('sl.combatienteSaurio', 0, 7, 5), e = op('gn.combatiente', 1, 8.5, 5);
    expect(guardianesPara(e).map(x => [x.g.id, x.amigo.id])).toEqual([[g.id, amigo.id]]);
    const otro = op('gn.combatiente', 1, 5, 6.5);                // la Guardia ya está en zona de control enemiga
    expect(guardianesPara(e)).toEqual([]);
    otro.alive = false;
    expect(guardianesPara(e)).toHaveLength(1);
    amigo.x = 12; e.x = 13.5;                                    // el amigo a más de 3″ de la Guardia
    expect(guardianesPara(e)).toEqual([]);
  });
  it('no vale sin un amigo en la zona de control del enemigo', () => {
    op('sl.guardiaSaurio', 0, 5, 5); op('sl.combatienteSaurio', 0, 7, 5);
    expect(guardianesPara(op('gn.combatiente', 1, 12, 5))).toEqual([]);
  });
});

describe('Escurridizos', () => {
  it('se ofrece tras un Disparo a un Eslizón que sigue en pie', () => {
    const d = DISPARADORES.find(x => x.id === 'escurridizos');
    expect(d.momento).toBe('trasAtaque');
    const sk = op('sl.combatienteEslizon', 1), t = op('gn.tirador', 0, 15, 5), w = WPN['gn.bolter'];
    expect(d.quien({ a: t, b: sk })).toBe(1);
    expect(d.condicion({ a: t, b: sk, w })).toBe(true);
    expect(d.condicion({ a: t, b: op('sl.combatienteSaurio', 1), w })).toBe(false);   // solo Eslizones
    sk.alive = false;
    expect(d.condicion({ a: t, b: sk, w })).toBe(false);          // incapacitado: no
  });
});
