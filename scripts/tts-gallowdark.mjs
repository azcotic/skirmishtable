// Gallowdark Approved Ops 1-2 on the 3D table: reads the "Gallowdark Approved Ops 2024" bag
// of the KT24 Killzone Mod (Steam Workshop 3573927734) and writes
//   - src/data/gallowdark-layouts.js : where every wall, pillar, hatchway and objective sits
//     (TTS position, rotation, scale), as numbers only;
//   - src/data/tts-sources.js        : the Steam CDN links of the models those layouts use.
//     Only NEW entries are added (or the ones this script owns are refreshed); the Volkus
//     entries are never rewritten, so no public/models/manifest.json is needed.
// Bounds of the Unity bundles are measured here from the downloaded bundle (held in memory,
// never saved) and only the numbers are kept.
// The mod's "Gallowdark 01" / "Galloqdark 02" (sic) bags are AO 1 / AO 2: the script checks
// their walls against src/data/gallowdark.js and stops if they don't line up.
// Usage: npm run tts:gallowdark [-- path/to/3573927734.bson]
//        (no path: cache/3573927734.bson if there, else fetched through the Steam API)
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseBSON } from '../src/import/tts.js';
import { readBundle } from '../src/import/unity.js';
import { GDMAPS } from '../src/data/gallowdark.js';
import { TTS_SOURCES } from '../src/data/tts-sources.js';

const MOD = '3573927734';
const API = 'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/';
const CDN = 'cdn.steamusercontent.com';
const cdn = u => u && u.replace(/^https?:\/\/[^/]*steamusercontent[^/]*\//, `https://${CDN}/`);
const key = u => { const p = (u || '').split('/').filter(Boolean); return p.length ? p[p.length - 1].slice(-16) : null; };
const CACHE = new URL('../cache/', import.meta.url);

// bag nickname in the mod (typo included) -> our map id
const BAGS = { gd1: /^Gallowdark 01$/, gd2: /^Galloqdark 02$/ };
const MAT_KEY = '06EC984208223D38', GUIDE_KEY = '9C8BD76749A0A723';
const MAT_GD = MAT_KEY + '-GD';   // the same mat mesh as Volkus' with the Gallowdark floor art
const NAMES = { EC00294AE66CBCAD: 'Gallowdark Pillar', AE21CE4CC1FD3B30: 'Gallowdark Wall', CDA7868C53598FB4: 'Gallowdark Hatchway' };
const FRAME = 270;   // TTS (x, z) -> board (X = z + 13.23, Y = x + 11.34): the frame convertGallowdark() uses

async function loadSave(path) {
  if (path) return readFileSync(path);
  const cached = new URL(`${MOD}.bson`, CACHE);
  if (existsSync(cached)) return readFileSync(cached);
  const r = await fetch(API, { method: 'POST', body: new URLSearchParams({ itemcount: '1', 'publishedfileids[0]': MOD }) });
  const d = (await r.json()).response.publishedfiledetails[0];
  if (!d.file_url) throw new Error(`Workshop ${MOD} has no downloadable file (result ${d.result})`);
  const buf = Buffer.from(await (await fetch(d.file_url)).arrayBuffer());
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(cached, buf);
  return buf;
}
// total size of a CDN file from a 4-byte range request (throws if the link is dead)
async function probe(url) {
  const r = await fetch(url, { headers: { Range: 'bytes=0-3' } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  await r.arrayBuffer();
  return +((r.headers.get('content-range') || '').split('/')[1] || r.headers.get('content-length'));
}
async function boundsOfBundle(url) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const parts = readBundle(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) for (let i = 0; i < p.pos.length; i += 3) for (let a = 0; a < 3; a++) {
    lo[a] = Math.min(lo[a], p.pos[i + a]); hi[a] = Math.max(hi[a], p.pos[i + a]);
  }
  if (!parts.length) throw new Error(`${url}: no meshes in the bundle`);
  return [lo.map(v => +v.toFixed(4)), hi.map(v => +v.toFixed(4))];
}

const buf = await loadSave(process.argv[2]);
const save = parseBSON(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length));
const bags = {};
(function find(o) {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) { o.forEach(find); return; }
  if (o.Name === 'Bag' && (o.ContainedObjects || []).length >= 30)   // some names also appear as empty bags
    for (const [id, re] of Object.entries(BAGS)) if (re.test(o.Nickname || '')) bags[id] = o;
  for (const k in o) if (k !== 'LuaScript') find(o[k]);
})(save);
for (const id of Object.keys(BAGS)) if (!bags[id]) throw new Error(`bag for ${id} not found in the save`);

// layout rows: [key, posX, posZ, rotY, scaleX, posY, rotX, rotZ, scaleY, scaleZ] (Volkus' format)
const r4 = v => +(+v).toFixed(4);
const layouts = {}, used = {};
for (const [id, bag] of Object.entries(bags)) {
  const items = [];
  for (const o of bag.ContainedObjects) {
    const t = o.Transform, cm = o.CustomMesh, ca = o.CustomAssetbundle;
    let k = key(cm && cm.MeshURL) || key(ca && ca.AssetbundleURL);
    if (!k || !t || k === GUIDE_KEY) continue;       // guides: our own drop-zone tint is drawn instead
    if (k === MAT_KEY) { k = MAT_GD; used[k] = { name: 'matObjSurface', tex: cdn(cm.DiffuseURL) }; }
    else if (ca && ca.AssetbundleURL) used[k] = { name: NAMES[k] || o.Nickname || '', bundle: cdn(ca.AssetbundleURL), material: ca.MaterialIndex };
    else if (!TTS_SOURCES[k]) { console.log(`${id}: skipping ${k} (${o.Name}): not in the catalogue`); continue; }
    items.push([k, r4(t.posX), r4(t.posZ), r4(t.rotY || 0), r4(t.scaleX ?? 1), r4(t.posY || 0), r4(t.rotX || 0), r4(t.rotZ || 0), r4(t.scaleY ?? 1), r4(t.scaleZ ?? 1)]);
  }
  layouts[id] = { name: GDMAPS[id].name, nick: bag.Nickname, items };
}

// the pieces must sit on the walls of src/data/gallowdark.js (measured from the AO saves)
for (const [id, L] of Object.entries(layouts)) {
  const walls = GDMAPS[id].terrain.filter(t => !t.hatch && Math.max(t.w, t.h) > 1.85).map(t => [t.x + t.w / 2, t.y + t.h / 2]);
  const pcs = L.items.filter(it => used[it[0]] && used[it[0]].bundle).map(it => [it[2] + 13.23, it[1] + 11.34]);
  const hit = walls.filter(w => pcs.some(p => Math.hypot(p[0] - w[0], p[1] - w[1]) < 0.45)).length;
  console.log(`${id} <- "${L.nick}": ${L.items.length} objects, ${hit}/${walls.length} measured walls have a piece within 0.45"`);
  if (hit < walls.length * 0.85) throw new Error(`${id}: the bag does not match gallowdark.js; check the bag names`);
}

// catalogue entries for the models the layouts use (dead links are dropped, with their placements)
const entries = {};
for (const [k, u] of Object.entries(used)) {
  try {
    if (k === MAT_GD) {
      const base = TTS_SOURCES[MAT_KEY];
      entries[k] = { name: u.name, material: base.material, bounds: base.bounds, obj: base.obj, bytes: base.bytes, tex: u.tex, texBytes: await probe(u.tex) };
    } else {
      entries[k] = { name: u.name, material: u.material ?? 2, bounds: await boundsOfBundle(u.bundle), bundle: u.bundle, bytes: await probe(u.bundle) };
    }
    console.log('link ok', k, u.name);
  } catch (e) {
    console.log('DEAD', k, e.message);
    delete entries[k];
    for (const L of Object.values(layouts)) L.items = L.items.filter(it => it[0] !== k);
  }
}

// insert / refresh only our entries in tts-sources.js
const srcUrl = new URL('../src/data/tts-sources.js', import.meta.url);
let src = readFileSync(srcUrl, 'utf8');
for (const [k, e] of Object.entries(entries)) {
  const line = ` ${JSON.stringify(k)}: ${JSON.stringify(e)},`;
  const re = new RegExp(`^ ${JSON.stringify(k)}: .*$`, 'm');
  src = re.test(src) ? src.replace(re, () => line) : src.replace(/\n};\s*$/, () => `\n${line}\n};\n`);
}
writeFileSync(srcUrl, src);

writeFileSync(new URL('../src/data/gallowdark-layouts.js', import.meta.url), `/**
 * GENERATED by scripts/tts-gallowdark.mjs — do not edit. Gallowdark Approved Ops 1-2 as the
 * KT24 Killzone Mod (Steam Workshop ${MOD}) places them, for the 3D table: [key, posX, posZ, rotY,
 * scaleX, posY, rotX, rotZ, scaleY, scaleZ] per object. Numbers and Steam model keys only
 * (the models' links are in tts-sources.js). \`frame\` turns the TTS axes into the board's.
 */
export const GALLOWDARK_LAYOUTS = ${JSON.stringify(Object.fromEntries(Object.entries(layouts).map(([id, L]) => [id, { ...L, frame: FRAME }])))};
`);
console.log(`wrote gallowdark-layouts.js (${Object.values(layouts).map(L => L.items.length).join(' + ')} objects) and ${Object.keys(entries).length} catalogue entries`);
