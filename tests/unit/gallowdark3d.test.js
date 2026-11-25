// Gallowdark AO 1-2 on the 3D table: the layouts (src/data/gallowdark-layouts.js), their model
// links (src/data/tts-sources.js) and how they join the maps. Links and numbers only: no
// third-party files are read here, and the network isn't used.
import { describe, it, expect, beforeAll } from 'vitest';
import * as world from '../../src/engine/world.js';
import { GALLOWDARK_LAYOUTS } from '../../src/data/gallowdark-layouts.js';
import { GDMAPS } from '../../src/data/gallowdark.js';
import { TTS_SOURCES } from '../../src/data/tts-sources.js';
import { gallowdarkModels3d } from '../../src/import/tts.js';

beforeAll(() => world.initMaps());

const CDN = /^https:\/\/cdn\.steamusercontent\.com\/ugc\/\d+\/[0-9A-F]{40}\/$/;
const MAT_GD = '06EC984208223D38-GD';

describe('Gallowdark layouts', () => {
  it('cover AO 1 and AO 2, each with its walls, hatchways and three objectives', () => {
    expect(Object.keys(GALLOWDARK_LAYOUTS)).toEqual(['gd1', 'gd2']);
    for (const L of Object.values(GALLOWDARK_LAYOUTS)) {
      const count = k => L.items.filter(r => r[0] === k).length;
      expect(L.frame).toBe(270);
      expect(L.items.length).toBeGreaterThan(40);
      expect(count('2AA481BF3BB82CD4')).toBe(3);          // objective markers
      expect(count(MAT_GD)).toBe(1);                      // the floor art
      expect(count('CDA7868C53598FB4')).toBeGreaterThanOrEqual(9);   // hatchways
      expect(count('EC00294AE66CBCAD') + count('AE21CE4CC1FD3B30')).toBeGreaterThan(30);
    }
  });

  it('rows are the ten TTS numbers, and every model has a link in the catalogue', () => {
    for (const L of Object.values(GALLOWDARK_LAYOUTS)) for (const row of L.items) {
      expect(row).toHaveLength(10);
      expect(typeof row[0]).toBe('string');
      for (const v of row.slice(1)) expect(Number.isFinite(v)).toBe(true);
      expect(TTS_SOURCES[row[0]], row[0]).toBeTruthy();
    }
  });

  it('catalogue entries: Steam CDN links, sizes and bounds', () => {
    const keys = new Set(Object.values(GALLOWDARK_LAYOUTS).flatMap(L => L.items.map(r => r[0])));
    for (const k of keys) {
      const e = TTS_SOURCES[k];
      expect(CDN.test(e.obj || e.bundle), k).toBe(true);
      expect(e.bytes).toBeGreaterThan(0);
      expect(e.bounds).toHaveLength(2);
      for (let a = 0; a < 3; a++) expect(e.bounds[1][a]).toBeGreaterThan(e.bounds[0][a] - 1e-9);
    }
    // the Gallowdark floor is the Volkus mat mesh with its own texture
    expect(TTS_SOURCES[MAT_GD].obj).toBe(TTS_SOURCES['06EC984208223D38'].obj);
    expect(TTS_SOURCES[MAT_GD].tex).toMatch(CDN);
    expect(TTS_SOURCES[MAT_GD].tex).not.toBe(TTS_SOURCES['06EC984208223D38'].tex);
  });

  it('sit on the measured walls of gallowdark.js, through the frame the importer uses', () => {
    for (const [id, L] of Object.entries(GALLOWDARK_LAYOUTS)) {
      const walls = GDMAPS[id].terrain.filter(t => !t.hatch && Math.max(t.w, t.h) > 1.85).map(t => [t.x + t.w / 2, t.y + t.h / 2]);
      const pieces = L.items.filter(r => TTS_SOURCES[r[0]].bundle).map(r => [r[2] + 13.23, r[1] + 11.34]);
      const hit = walls.filter(w => pieces.some(p => Math.hypot(p[0] - w[0], p[1] - w[1]) < 0.45)).length;
      expect(hit / walls.length).toBeGreaterThan(0.9);
    }
  });
});

describe('Gallowdark maps with models', () => {
  it('gallowdarkModels3d keeps position, Euler rotation and scale per object', () => {
    const out = gallowdarkModels3d({ frame: 270, items: [['K', 1, 2, 90, -1, 0.98, 3, 4, 1, 1]] });
    expect(out.frame).toBe(270);
    expect(out.models3d).toEqual([{ k: 'K', p: [1, 0.98, 2], r: [3, 90, 4], s: [-1, 1, 1], tint: null }]);
  });

  it('gd1 and gd2 get their 3D models while their walls stay exactly as measured', () => {
    for (const id of ['gd1', 'gd2']) {
      const map = world.MAPS[id];
      expect(map.models3d).toHaveLength(GALLOWDARK_LAYOUTS[id].items.length);
      expect(map.frame).toBe(270);
      expect(map.ground3d).toBe(true);
      expect(map.fine).toBeUndefined();
      world.buildWorld(map);
      expect(world.TERRAIN.filter(t => t.kind === 'wall')).toHaveLength(49);
      expect(world.OBJECTIVES).toHaveLength(3);
    }
  });
});
