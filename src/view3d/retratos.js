/* global THREE */
/**
 * Retratos para las fichas 2D: la imagen de cada miniatura, sacada del modelo 3D que el navegador
 * ya descargó de Steam. Se renderiza una vez en un lienzo fuera de pantalla (fondo transparente) y
 * la imagen se guarda SOLO en la caché de este navegador (IndexedDB); nunca se sube al repo ni al
 * sitio. Sin modelo (o sin WebGL), la ficha vuelve a mostrar su número.
 *
 * El encuadre de cada miniatura (desde dónde se mira) lo elige una persona en la pantalla
 * #/encuadres (src/ui/encuadres.js, solo con el servidor de desarrollo) y se guarda como
 * coordenadas en src/data/retrato-encuadres.js, que se sube al repo: la posición de la cámara y el
 * punto al que mira, relativos a la figura (en alturas de la figura). Son solo números. Mientras
 * una miniatura no tenga encuadre guardado, se usa uno automático aproximado.
 */
import { ENCUADRES } from '../data/retrato-encuadres.js';

export const TAM = 192;                // px del retrato (se recorta en círculo al dibujarlo)
export const FOV = 20;                 // grados; el mismo en el editor, para que se vea igual
const BD = "skirmishtable.retratos3", TABLA = "retratos";
const sesion = {};                     // lo guardado en esta sesión del editor (el archivo se lee al cargar)

const memoria = new Map();             // clave del modelo + encuadre -> dataURL | null (no se pudo)
const pendientes = new Set();
const oyentes = [];
export const onRetrato = fn => oyentes.push(fn);

// clave corta (hash de una descripción), para la caché
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "r" + (h >>> 0).toString(36) + s.length; };

/* ---------- encuadres guardados ---------- */
// El encuadre guardado de un agente (el de esta sesión del editor si lo hay, si no el del archivo); o null
export function encuadreGuardado(comando, nombre) {
  const e = (sesion[comando] || {})[nombre] !== undefined ? sesion[comando][nombre] : (ENCUADRES[comando] || {})[nombre];
  return e && Array.isArray(e.p) && Array.isArray(e.t) && e.p.length === 3 && e.t.length === 3 ? e : null;
}
// Guarda el encuadre en memoria y en el archivo del proyecto (solo el servidor de desarrollo lo escribe).
// Devuelve una promesa: true si quedó escrito en el archivo.
// El frente de una miniatura en grados (0 = +z, que es lo que se supone si no se fijó): la mesa 3D la gira
// para que ese lado mire hacia donde apunta su línea de visión
export function frenteDe(comando, nombre) {
  const e = encuadreGuardado(comando, nombre);
  return e && Number.isFinite(e.g) ? e.g : 0;
}
export function guardarEncuadre(comando, nombre, enc) {
  (sesion[comando] = sesion[comando] || {})[nombre] = { p: enc.p.map(redondear), t: enc.t.map(redondear), ...(Number.isFinite(enc.g) ? { g: redondear(enc.g) } : {}) };
  return escribirArchivo();
}
export function borrarEncuadre(comando, nombre) {
  (sesion[comando] = sesion[comando] || {})[nombre] = null;   // null: borrado en esta sesión
  return escribirArchivo();
}
// Todos los encuadres (el archivo con lo de esta sesión encima), sin los borrados
function todos() {
  const out = JSON.parse(JSON.stringify(ENCUADRES));
  for (const c of Object.keys(sesion)) for (const [n, e] of Object.entries(sesion[c])) {
    if (e) (out[c] = out[c] || {})[n] = e; else if (out[c]) delete out[c][n];
  }
  for (const c of Object.keys(out)) if (!Object.keys(out[c]).length) delete out[c];
  return out;
}
async function escribirArchivo() {
  try {
    const r = await fetch("/__encuadres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(todos()) });
    return r.ok;
  } catch (e) { return false; }
}
const redondear = n => Math.round(n * 1000) / 1000;

/* ---------- caché del navegador ---------- */
let bd = null;
function abrir() {
  return bd || (bd = new Promise(ok => {
    try {
      const rq = indexedDB.open(BD, 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore(TABLA);
      rq.onsuccess = () => ok(rq.result);
      rq.onerror = () => ok(null);
    } catch (e) { ok(null); }
  }));
}
async function leer(k) {
  const db = await abrir(); if (!db) return null;
  return new Promise(ok => { try { const r = db.transaction(TABLA).objectStore(TABLA).get(k); r.onsuccess = () => ok(r.result || null); r.onerror = () => ok(null); } catch (e) { ok(null); } });
}
async function guardar(k, v) {
  const db = await abrir(); if (!db) return;
  try { db.transaction(TABLA, "readwrite").objectStore(TABLA).put(v, k); } catch (e) {}
}

/* ---------- la escena de un retrato (la usan el render y el editor) ---------- */
// Caja de la figura: los vértices de todas las piezas, sin el 1 % más extremo de cada eje (piezas
// sueltas) y sin lo que queda por debajo de la base. mira: hacia dónde parece mirar (la mochila y
// la capa pesan por detrás); med: el centro, ajeno a las piezas sueltas.
function cajaRobusta(obj, base) {
  const xs = [], ys = [], zs = [], v = new THREE.Vector3();
  obj.traverse(m => {
    const p = m.isMesh && m.geometry && m.geometry.attributes.position;
    if (!p) return;
    const paso = Math.max(1, Math.floor(p.count / 6000));
    for (let i = 0; i < p.count; i += paso) {
      v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld);
      if (v.y < base) continue;
      xs.push(v.x); ys.push(v.y); zs.push(v.z);
    }
  });
  if (xs.length < 20) return null;
  let y0 = Infinity, y1 = -Infinity; for (const y of ys) { if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const n = xs.length;
  let sx = 0, sz = 0, k = 0, ax = Infinity, bx = -Infinity, az = Infinity, bz = -Infinity;
  for (let i = 0; i < n; i++) {
    const h = (ys[i] - y0) / ((y1 - y0) || 1);
    if (h < 0.45 || h > 0.8) continue;
    sx += xs[i]; sz += zs[i]; k++;
    ax = Math.min(ax, xs[i]); bx = Math.max(bx, xs[i]); az = Math.min(az, zs[i]); bz = Math.max(bz, zs[i]);
  }
  let mira = [0, 1];
  if (k > 20) {
    const dx = sx / k - (ax + bx) / 2, dz = sz / k - (az + bz) / 2, L = Math.hypot(dx, dz), ancho = Math.max(bx - ax, bz - az) || 1;
    if (L > 0.03 * ancho) mira = [-dx / L, -dz / L];
  }
  const q = (a, f) => { a.sort((x, y) => x - y); return a[Math.min(a.length - 1, Math.max(0, Math.floor(a.length * f)))]; };
  const med = { x: q(xs, 0.5), z: q(zs, 0.5) };
  return { mira, med, min: { x: q(xs, 0.01), y: q(ys, 0.005), z: q(zs, 0.01) }, max: { x: q(xs, 0.99), y: q(ys, 0.995), z: q(zs, 0.99) } };
}
// por debajo de esta altura (sobre el fondo de la figura) está la peana
export const baseDe = plantilla => plantilla.userData && plantilla.userData.diameter
  ? plantilla.userData.bottom + plantilla.userData.diameter * 0.06 : -Infinity;
// ¿Ya llegaron todas las texturas del modelo? (se cargan después que la geometría)
export function texturasListas(obj) {
  let ok = true;
  obj.traverse(m => {
    if (!m.isMesh) return;
    for (const mat of [].concat(m.material)) if (mat && mat.map && !mat.map.image) ok = false;
  });
  return ok;
}
// La escena de una miniatura: su copia, con luces, y la medida de la figura. null si no se puede.
export function prepararEscena(plantilla) {
  const escena = new THREE.Scene(), obj = plantilla.clone();
  escena.add(obj);
  escena.add(new THREE.HemisphereLight(0xffffff, 0x666677, 1.15));
  const sol = new THREE.DirectionalLight(0xffffff, 0.85); sol.position.set(2, 4, 5); escena.add(sol);
  obj.updateMatrixWorld(true);
  const f = cajaRobusta(obj, baseDe(plantilla));
  if (!f) return null;
  const alto = f.max.y - f.min.y;
  // el origen de las coordenadas del encuadre: bajo la figura, en su centro
  return { escena, obj, f, alto, origen: new THREE.Vector3(f.med.x, f.min.y, f.med.z) };
}
// Hacia dónde parece mirar la figura, en grados (0 = +z): por dónde pesan la mochila y la capa
export function frenteAuto(esc) {
  const g = Math.round(Math.atan2(esc.f.mira[0], esc.f.mira[1]) * 180 / Math.PI);
  return (g + 360) % 360;
}
// Encuadre automático (cámara de frente a donde mira la figura, algo elevada, busto): { p, t }.
// g: el frente en grados, si se conoce; si no, el que parece tener.
export function encuadreAuto(esc, g) {
  const { f, alto, origen } = esc, ancho = Math.max(f.max.x - f.min.x, f.max.z - f.min.z);
  const mira = Number.isFinite(g) ? [Math.sin(g * Math.PI / 180), Math.cos(g * Math.PI / 180)] : f.mira;
  const foco = new THREE.Vector3(f.med.x, f.max.y - alto * 0.34, f.med.z);
  const radio = Math.max(alto * 0.4, ancho * 0.34), dist = radio / Math.sin(FOV * Math.PI / 360), el = 20 * Math.PI / 180;
  const pos = new THREE.Vector3(foco.x + mira[0] * Math.cos(el) * dist, foco.y + Math.sin(el) * dist, foco.z + mira[1] * Math.cos(el) * dist);
  return { p: pos.sub(origen).divideScalar(alto).toArray(), t: foco.sub(origen).divideScalar(alto).toArray() };
}
// Pone la cámara según el encuadre { p, t } (relativo a la figura)
export function ponerCamara(cam, esc, enc) {
  const p = new THREE.Vector3(...enc.p).multiplyScalar(esc.alto).add(esc.origen);
  const t = new THREE.Vector3(...enc.t).multiplyScalar(esc.alto).add(esc.origen);
  cam.position.copy(p);
  cam.near = esc.alto / 100; cam.far = esc.alto * 60; cam.updateProjectionMatrix();
  cam.lookAt(t);
  return t;
}
// El encuadre que tiene ahora una cámara que mira a `objetivo`
export function encuadreDeCamara(cam, objetivo, esc) {
  return {
    p: cam.position.clone().sub(esc.origen).divideScalar(esc.alto).toArray(),
    t: objetivo.clone().sub(esc.origen).divideScalar(esc.alto).toArray(),
  };
}

/* ---------- el render ---------- */
export function renderizar(plantilla, enc) {
  if (!window.THREE) return null;
  let r;
  try {
    const esc = prepararEscena(plantilla);
    if (!esc) return null;
    const cv = document.createElement("canvas");
    cv.width = cv.height = TAM;
    r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.outputEncoding = THREE.sRGBEncoding;
    r.setSize(TAM, TAM, false); r.setClearColor(0x000000, 0);
    const cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    ponerCamara(cam, esc, enc || encuadreAuto(esc));
    r.render(esc.escena, cam);
    const url = cv.toDataURL("image/png");
    r.dispose(); if (r.forceContextLoss) r.forceContextLoss();
    return url;
  } catch (e) {
    try { r && r.dispose(); } catch (e2) {}
    return null;
  }
}

// El retrato de un modelo cargado: la imagen (dataURL) si ya está; si no, null y se genera en
// segundo plano (primero se mira la caché del navegador) avisando a los oyentes cuando llega.
// donde: { comando, nombre } para buscar el encuadre guardado de ese agente.
export function retratoDe(claveModelo, plantilla, donde) {
  const enc = donde ? encuadreGuardado(donde.comando, donde.nombre) : null;
  const k = hash(claveModelo + (enc ? "|" + JSON.stringify(enc) : ""));
  if (memoria.has(k)) return memoria.get(k);
  if (!plantilla || pendientes.has(k)) return null;
  pendientes.add(k);
  leer(k).then(async guardado => {
    let url = guardado;
    if (!url) {
      // espera a las texturas (hasta 40 s); sin ellas el retrato saldría gris o vacío
      for (let i = 0; i < 100 && !texturasListas(plantilla); i++) await new Promise(r => setTimeout(r, 400));
      url = texturasListas(plantilla) ? renderizar(plantilla, enc) : null;
      if (url) guardar(k, url);
    }
    memoria.set(k, url || null); pendientes.delete(k);
    if (url) for (const fn of oyentes) fn();
  });
  return null;
}
