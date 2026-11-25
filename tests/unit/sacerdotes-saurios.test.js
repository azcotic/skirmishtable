// Sacerdotes, Emboscador y Tambores de guerra de los Saurios de Lustria
// (src/game/unicas.js, src/ui/sacerdotes-sl.js, src/engine/deploy.js)
import { beforeEach, describe, expect, it } from 'vitest';
import { comandoPorId, registrarComandos } from '../../src/data/teams/index.js';
import { OPS, buildWorld, mkOp } from '../../src/engine/world.js';
import { WPN } from '../../src/config.js';
import { armaPara, effMove, resolverDisparo } from '../../src/engine/dice.js';
import { RULES } from '../../src/rules/index.js';
import { UNICAS, alcanceUnica, efectoEn, objetivosUnica, ponerEfecto, puedeUnica, unicasDe } from '../../src/game/unicas.js';
import { ARDID, conectarArdides, conectarRegistro } from '../../src/ui/ardides.js';
import { conectarSacerdotes, darPresagio, escudrinar, puedeTambores, tocarTambores, ventanaInicioPI } from '../../src/ui/sacerdotes-sl.js';
import { dentroDeEmboscada, distanciaAZona } from '../../src/engine/deploy.js';
import { equipoDeFaccion } from '../../src/game/equipo.js';
import '../../src/ui/unicas.js';

registrarComandos();
const tray = { tp: 2, cp: [2, 2], ardides: [[], []], equipoFaccion: [[], []] };
conectarArdides(tray); conectarRegistro(() => {});
const logs = [];
conectarSacerdotes(tray, t => logs.push(t));
const siempre = () => true;
const op = (id, team, kind, x, y) => mkOp(id, team, id, kind, x, y);
const w = WPN['gn.bolter'];
const what = () => ({ k: 'shoot', by: 'B1', at: 'A1', w: 'gn.bolter', acc: 0 });
// los dados de defensa sacan 1 (ninguno vale): solo cuentan los conservados
const tira = (b, wh, cover = false) => resolverDisparo(Object.assign(wh, { cover }), w, 3, { crit: 0, norm: 3, dice: [4, 4, 4] }, b, () => 1).dfn;
let est, sac, sau, esl, foe;
beforeEach(() => {
  buildWorld({ name: 'test', w: 24, h: 12, objectives: [], terrain: [], spawns: [[[1, 1]], [[23, 11]]] });
  tray.tp = 2; tray.ardides = [[], []]; tray.equipoFaccion = [[], []];
  for (const k of ['luz', 'tambores', 'tamboresUsado', 'estrellasUsado']) delete tray[k];
  est = op('A3', 0, 'sl.sacerdoteEstelar', 5, 5); sac = op('A2', 0, 'sl.sacerdoteEslizon', 5, 8);
  sau = op('A1', 0, 'sl.combatienteSaurio', 8, 5); esl = op('A4', 0, 'sl.camaleon', 6, 5);
  foe = op('B1', 1, 'gn.tirador', 20, 5);
  OPS.length = 0; OPS.push(est, sac, sau, esl, foe);
});

describe('Sacerdotes: acciones únicas', () => {
  it('cada Sacerdote tiene las suyas', () => {
    expect(unicasDe(est)).toEqual(['luzChotec', 'presagioCeleste']);
    expect(unicasDe(sac)).toEqual(['veloCeleste']);
  });
  it('Luz de Chotec: solo Saurios y Kroxigor heridos a 6″ o menos', () => {
    expect(objetivosUnica(est, 'luzChotec', OPS, siempre)).toEqual([]);          // nadie herido
    sau.wounds = 5; esl.wounds = 3;
    expect(objetivosUnica(est, 'luzChotec', OPS, siempre).map(o => o.id)).toEqual(['A1']);   // el Eslizón no
    sau.x = 15; expect(objetivosUnica(est, 'luzChotec', OPS, siempre)).toEqual([]);          // lejos
  });
  it('Luz de Chotec: una vez por punto de inflexión para el comando, no en zona de control', () => {
    expect(puedeUnica(est, 'luzChotec', OPS, tray).ok).toBe(true);
    tray.luz = [2, null];
    expect(puedeUnica(est, 'luzChotec', OPS, tray).motivo).toBe('yaEsePI');
    tray.tp = 3; expect(puedeUnica(est, 'luzChotec', OPS, tray).ok).toBe(true);
    foe.x = 5.5; foe.y = 5.5; expect(puedeUnica(est, 'luzChotec', OPS, tray).motivo).toBe('enZonaDeControl');
  });
  it('Presagio celeste: solo a Eslizones', () => {
    expect(objetivosUnica(est, 'presagioCeleste', OPS, siempre).map(o => o.id).sort()).toEqual(['A2', 'A4']);
  });
  it('Presagio celeste: Equilibrada a distancia hasta el final de su siguiente activación', () => {
    const arma = WPN[esl.weapon];
    expect(arma.type).toBe('R');
    expect(armaPara(arma, esl, foe, 'disparo').rules).not.toContain('Balanced');
    darPresagio(esl);
    expect(armaPara(arma, esl, foe, 'disparo').rules).toContain('Balanced');
    expect(armaPara({ ...arma, type: 'M' }, esl, foe, 'combate').rules).not.toContain('Balanced');   // solo a distancia
    esl.activaciones = 1;                                                                         // ya terminó esa activación
    expect(armaPara(arma, esl, foe, 'disparo').rules).not.toContain('Balanced');
  });
  it('Tepok: las tres acciones de Sacerdote usan la distancia que suma el Asterismo', () => {
    expect(alcanceUnica(est, 'luzChotec')).toBe(6);
    expect(alcanceUnica(sac, 'veloCeleste')).toBe(6);
    expect(UNICAS.luzChotec.sacerdote && UNICAS.presagioCeleste.sacerdote && UNICAS.veloCeleste.sacerdote).toBe(true);
  });
});

describe('Velo celeste y Escudriñar las estrellas: dados de defensa conservados', () => {
  it('Velo celeste: un dado de defensa más como éxito normal; dura hasta la siguiente activación del Sacerdote', () => {
    const base = tira(sau, what()).norm;
    ponerEfecto(sac, 'veloCeleste', sau, OPS);
    expect(efectoEn(sau, 'veloCeleste', OPS)).not.toBeNull();
    expect(tira(sau, what()).norm).toBe(base + 1);
    sac.activaciones = 1; sac.used = ['reposition']; sac.ap = 1;                // empieza otra activación: se acaba
    expect(tira(sau, what()).norm).toBe(base);
  });
  it('varios Sacerdotes pueden dar su propio Velo', () => {
    const sac2 = op('A5', 0, 'sl.sacerdoteEslizon', 7, 8); OPS.push(sac2);
    ponerEfecto(sac, 'veloCeleste', sau, OPS); ponerEfecto(sac2, 'veloCeleste', esl, OPS);
    expect(efectoEn(sau, 'veloCeleste', OPS)).not.toBeNull();
    expect(efectoEn(esl, 'veloCeleste', OPS)).not.toBeNull();
  });
  it('tope de 2: cobertura + Velo = 2; con Emboscada en la jungla sigue en 2', () => {
    expect(tira(esl, what(), true).norm).toBe(1);                              // solo la cobertura
    ponerEfecto(sac, 'veloCeleste', esl, OPS);
    expect(tira(esl, what(), true).norm).toBe(2);
    tray.ardides = [[ARDID.emboscada], []];                                    // Emboscada ya da el segundo
    expect(tira(esl, what(), true).norm).toBe(2);                              // el Velo ya no añade
  });
  it('Velo y estrellas juntos no pasan de 2 dados conservados', () => {
    ponerEfecto(sac, 'veloCeleste', sau, OPS);
    sau.estrellas = { tp: 2, n: 4 };
    expect(tira(sau, what()).norm).toBe(2);
  });
  it('solo valen contra disparos, no contra armas de combate', () => {
    ponerEfecto(sac, 'veloCeleste', sau, OPS);
    expect(tira(sau, what()).norm).toBe(1);
    expect(resolverDisparo({ ...what(), cover: false }, { ...w, type: 'M' }, 3, { crit: 0, norm: 3, dice: [4] }, sau, () => 1).dfn.norm).toBe(0);
  });
  it('Escudriñar las estrellas: un éxito por cada 4+ y solo vale el primer disparo del punto de inflexión', async () => {
    const r = await escudrinar(0, { tirada: [4, 3, 6] });
    expect(r.dados).toEqual([4, 3, 6]);
    expect(r.exitos).toBe(2);
    expect(r.repartidos.length).toBe(2);
    const t = OPS.find(o => o.id === r.repartidos[0]);
    const w1 = what(), w2 = what();
    const con = tira(t, w1).norm;
    expect(con).toBe(Math.min(2, t.estrellas.n));
    expect(con).toBeGreaterThan(0);
    expect(tira(t, w1).norm).toBe(con);                  // recalcular el mismo disparo da lo mismo
    expect(tira(t, w2).norm).toBe(0);                    // el segundo disparo ya no
  });
  it('Escudriñar las estrellas: una vez por batalla; máximo 4 dados; nunca más de 2 por agente', async () => {
    let tiradas = 0;
    est.id = 'A9';                                       // número 9: máximo 4 dados
    const r = await escudrinar(0, { die: () => { tiradas++; return 5; }, elegir: async () => 'A1' });
    expect(tiradas).toBe(4);
    expect(r.exitos).toBe(4);
    expect(sau.estrellas.n).toBe(2);                     // tope de 2
    expect(await escudrinar(0, { tirada: [6] })).toBeNull();
  });
  it('Escudriñar: elegir a quien no es válido pierde el éxito', async () => {
    const r = await escudrinar(0, { tirada: [6], elegir: async () => 'B1' });
    expect(r.repartidos).toEqual([]);
  });
});

describe('Tambores de guerra', () => {
  it('el catálogo ya no lo marca pendiente', () => {
    const t = equipoDeFaccion(comandoPorId('3272457903')).find(e => e.id === 'tambores');
    expect(t.pendiente).toBeFalsy();
  });
  it('una vez por batalla: +1″ a la distancia de Cargar hasta el final del punto de inflexión', () => {
    tray.equipoFaccion = [['tambores'], []];
    const carga = o => RULES.moves.charge.allow(o);
    const base = carga(sau);
    expect(base).toBe(effMove(sau) + 2);
    expect(puedeTambores(0)).toBe(true);
    expect(tocarTambores(0)).toBe(true);
    expect(carga(sau)).toBe(base + 1);
    expect(carga(foe)).toBe(effMove(foe) + 2);           // el otro bando no
    expect(puedeTambores(0)).toBe(false);
    expect(tocarTambores(0)).toBe(false);
    tray.tp = 3; expect(carga(sau)).toBe(base);          // el siguiente punto de inflexión ya no
  });
  it('sin el equipo no se puede', () => { expect(puedeTambores(0)).toBe(false); });
  it('ventana de inicio: la computadora escudriña y usa los Tambores en el 2.º punto de inflexión; el jugador decide', async () => {
    tray.equipoFaccion = [['tambores'], []];
    tray.tp = 1;
    await ventanaInicioPI({ esDeLaIA: s => s === 0, mayControl: () => false }, { die: () => 6 });
    expect(tray.tambores).toBeUndefined();               // en el 1.º no
    expect(tray.estrellasUsado[0]).toBe(true);           // pero escudriña
    tray.tp = 2;
    await ventanaInicioPI({ esDeLaIA: s => s === 0, mayControl: () => false }, { die: () => 6 });
    expect(tray.tambores[0]).toBe(2);
    tray.tambores = null; tray.tamboresUsado = [false, false]; tray.tp = 3;      // jugador: primero que no, luego que sí
    await ventanaInicioPI({ esDeLaIA: () => false, mayControl: () => true }, { preguntar: async () => 'no' });
    expect(tray.tambores).toBeNull();
    await ventanaInicioPI({ esDeLaIA: () => false, mayControl: () => true }, { preguntar: async () => 'si' });
    expect(tray.tambores[0]).toBe(3);
  });
});

describe('Emboscador: despliegue', () => {
  const dz = { x: 0, y: 30, w: 44, h: 6 };               // zona enemiga: franja inferior
  const c = mkOp('A4', 0, 'c', 'sl.camaleon', 0, 0);
  it('a más de 6″ de la zona enemiga y dentro de la mesa', () => {
    expect(distanciaAZona(10, 20, dz)).toBe(10);
    expect(dentroDeEmboscada(c, 10, 18, dz, 44, 36)).toBe(true);
    expect(dentroDeEmboscada(c, 10, 25, dz, 44, 36)).toBe(false);   // a 5″
    expect(dentroDeEmboscada(c, 10, 24, dz, 44, 36)).toBe(false);   // justo a 6″: no es "más de 6″"
    expect(dentroDeEmboscada(c, -1, 10, dz, 44, 36)).toBe(false);   // fuera de la mesa
  });
});
