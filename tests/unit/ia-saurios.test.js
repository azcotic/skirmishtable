// La IA juega contra y con los Saurios de Lustria sin lanzar errores (planes de todos los agentes)
import { beforeEach, describe, expect, it } from 'vitest';
import { registrarComandos } from '../../src/data/teams/index.js';
import { OPS, buildWorld, mkOp } from '../../src/engine/world.js';
import { decidirActivacion } from '../../src/ai/facil.js';
import '../../src/ui/ardides.js';

registrarComandos();
const SL = ['saurioEscamadura', 'kroxigor', 'combatienteSaurio', 'guardiaSaurio', 'camaleon', 'combatienteEslizon', 'sacerdoteEslizon', 'sacerdoteEstelar'];
const AM = ['capitan', 'sargentoIntercesor', 'tiradorIntercesor', 'combatienteIntercesor'];
beforeEach(() => {
  buildWorld({ name: 'test', w: 24, h: 18, objectives: [{ id: 'A', x: 12, y: 9 }], terrain: [], spawns: [[[2, 9]], [[22, 9]]] });
  OPS.length = 0;
  SL.forEach((k, i) => OPS.push(mkOp('A' + (i + 1), 0, k, 'sl.' + k, 5 + (i % 3), 4 + i)));
  AM.forEach((k, i) => OPS.push(mkOp('B' + (i + 1), 1, k, 'am.' + k, 17 + (i % 2), 6 + i * 2)));
  OPS.forEach(o => { o.ready = true; o.deployed = true; });
});

describe('la IA con los Saurios', () => {
  it('decide una activación para cada bando, con cualquier agente de los Saurios, sin errores', () => {
    for (let n = 0; n < 2; n++) for (const team of [0, 1]) {
      const p = decidirActivacion(team);
      expect(p).toBeTruthy();
      expect(p.op.team).toBe(team);
    }
  }, 60000);
  it('el Camaleón oculto no estorba a la IA rival al juzgar disparos', () => {
    const cam = OPS.find(o => o.kind === 'sl.camaleon'); cam.order = 'conceal'; cam.x = 12; cam.y = 9;
    expect(() => decidirActivacion(1)).not.toThrow();
  });
});
