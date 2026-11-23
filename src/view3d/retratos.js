/* global THREE */
/**
 * Retratos para las fichas 2D: la imagen de cada miniatura, sacada del modelo 3D que el navegador
 * ya descargó de Steam. Se renderiza una vez en un lienzo fuera de pantalla (vista 3/4, fondo
 * transparente) y la imagen se guarda SOLO en la caché de este navegador (IndexedDB); nunca se
 * sube al repo ni al sitio. Sin modelo (o sin WebGL), la ficha vuelve a mostrar su número.
 */
const TAM = 192;                       // px del retrato (se recorta en círculo al dibujarlo)
const BD = "skirmishtable.retratos", TABLA = "retratos";

const memoria = new Map();             // clave del modelo -> dataURL | null (no se pudo)
const pendientes = new Set();
const oyentes = [];
export const onRetrato = fn => oyentes.push(fn);

// clave corta del modelo (hash de su descripción), para la caché
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return "r" + (h >>> 0).toString(36) + s.length; };

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

/* ---------- el render ---------- */
function renderizar(modelo) {
  if (!window.THREE) return null;
  let r;
  try {
    const cv = document.createElement("canvas");
    cv.width = cv.height = TAM;
    r = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true });
    r.outputEncoding = THREE.sRGBEncoding;
    r.setSize(TAM, TAM, false); r.setClearColor(0x000000, 0);
    const escena = new THREE.Scene(), obj = modelo.clone();
    escena.add(obj);
    escena.add(new THREE.HemisphereLight(0xffffff, 0x666677, 1.15));
    const sol = new THREE.DirectionalLight(0xffffff, 0.85); sol.position.set(2, 4, 5); escena.add(sol);
    obj.updateMatrixWorld(true);
    const caja = new THREE.Box3().setFromObject(obj), c = caja.getCenter(new THREE.Vector3()), t = caja.getSize(new THREE.Vector3());
    // la miniatura mira a +z: cámara de frente y algo elevada, encuadrando el cuerpo entero
    const radio = Math.max(t.y, t.x, t.z) * 0.56, fov = 28;
    const cam = new THREE.PerspectiveCamera(fov, 1, radio / 50, radio * 40);
    const dist = radio / Math.sin(fov * Math.PI / 360), el = 28 * Math.PI / 180;
    c.y += t.y * 0.04;
    cam.position.set(c.x, c.y + Math.sin(el) * dist, c.z + Math.cos(el) * dist);
    cam.lookAt(c);
    r.render(escena, cam);
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
export function retratoDe(claveModelo, plantilla) {
  const k = hash(claveModelo);
  if (memoria.has(k)) return memoria.get(k);
  if (!plantilla || pendientes.has(k)) return null;
  pendientes.add(k);
  leer(k).then(guardado => {
    let url = guardado;
    if (!url) {
      url = renderizar(plantilla);
      if (url) guardar(k, url);
    }
    memoria.set(k, url || null); pendientes.delete(k);
    if (url) for (const fn of oyentes) fn();
  });
  return null;
}
