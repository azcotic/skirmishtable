/**
 * Solo en desarrollo (servidor de Vite, nunca en el build): lee y escribe los encuadres de las fichas 2D
 * que se eligen en la pantalla #/encuadres, en src/data/retrato-encuadres.js, listos para commit.
 *
 *   GET  /__encuadres  -> el contenido ACTUAL del archivo (JSON).
 *   POST /__encuadres  -> { comando, nombre, enc } guarda UN encuadre ({ p, t, g? }), o lo borra si enc es null.
 *
 * Cada guardado se combina con lo que hay en el archivo en ese momento (nunca con lo que cree la página,
 * que puede estar desactualizada), y antes de escribir se copia el archivo a cache/encuadres/ (fuera de
 * git; se conservan las últimas 40). Solo acepta peticiones de esta misma máquina o de la red local
 * y valida que sean solo números.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizePath } from 'vite';

const ARCHIVO = fileURLToPath(new URL('../src/data/retrato-encuadres.js', import.meta.url));
const COPIAS = fileURLToPath(new URL('../cache/encuadres/', import.meta.url));
const num3 = v => Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 1000);
const clave = s => typeof s === 'string' && s.length > 0 && s.length < 80;
// esta máquina y las redes locales (el servidor se abre con --host para probar desde el teléfono)
const LOCAL = /^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1|(::ffff:)?(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|fe80:|f[cd][0-9a-f]{2}:)/i;

// El JSON con los vectores en una sola línea: { "p": [1, 2, 3], "t": [1, 2, 3], "g": 90 }
function aTexto(datos) {
  const lineas = ['{'];
  const cs = Object.keys(datos);
  cs.forEach((c, i) => {
    lineas.push(` ${JSON.stringify(c)}: {`);
    const ns = Object.keys(datos[c]);
    ns.forEach((n, j) => {
      const e = datos[c][n];
      lineas.push(`  ${JSON.stringify(n)}: { "p": ${JSON.stringify(e.p)}, "t": ${JSON.stringify(e.t)}${e.g === undefined ? '' : `, "g": ${e.g}`} }${j < ns.length - 1 ? ',' : ''}`);
    });
    lineas.push(` }${i < cs.length - 1 ? ',' : ''}`);
  });
  lineas.push('}');
  return lineas.join('\n');
}

// Lo que dice el archivo ahora (lanza si no se entiende: mejor no escribir que perder datos)
function leerArchivo() {
  const t = readFileSync(ARCHIVO, 'utf8'), i = t.indexOf('export const ENCUADRES =');
  if (i < 0) throw new Error('formato');
  return JSON.parse(t.slice(t.indexOf('{', i)).replace(/;\s*$/, ''));
}

function respaldar() {
  mkdirSync(COPIAS, { recursive: true });
  copyFileSync(ARCHIVO, `${COPIAS}retrato-encuadres-${Date.now()}.js`);
  const viejas = readdirSync(COPIAS).filter(f => f.endsWith('.js')).sort();
  for (const f of viejas.slice(0, Math.max(0, viejas.length - 40))) { try { unlinkSync(COPIAS + f); } catch (e) { /* no pasa nada */ } }
}

function escribirArchivo(datos) {
  writeFileSync(ARCHIVO, [
    '/**',
    ' * Encuadres de los retratos 2D (src/view3d/retratos.js), elegidos a mano en la pantalla',
    ' * #/encuadres (src/ui/encuadres.js, solo con el servidor de desarrollo): por comando y agente, la',
    ' * posición de la cámara `p` y el punto al que mira `t`, relativos a la figura (en alturas de la',
    ' * figura), y `g`, el frente de la miniatura en grados (0 = +z, 90 = +x; la mesa 3D la gira para que',
    ' * mire hacia donde apunta su línea de visión). Solo números: ningún contenido de terceros. Lo escribe',
    ' * esa pantalla al guardar.',
    ' * Clave: id del mod en el catálogo de Steam y nombre del agente.',
    ' */',
    `export const ENCUADRES = ${aTexto(datos)};`,
    '',
  ].join('\n'));
}

export function guardarEncuadres() {
  return {
    name: 'guardar-encuadres',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__encuadres', (req, res) => {
        const ip = req.socket.remoteAddress || '';
        if (!LOCAL.test(ip)) { console.warn(`[encuadres] petición rechazada desde ${ip}`); res.statusCode = 403; return res.end('no'); }
        if (req.method === 'GET') {
          try { res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); return res.end(JSON.stringify(leerArchivo())); }
          catch (e) { res.statusCode = 500; return res.end('mal'); }
        }
        if (req.method !== 'POST') { res.statusCode = 405; return res.end('no'); }
        let cuerpo = '';
        req.on('data', c => { cuerpo += c; if (cuerpo.length > 1e5) req.destroy(); });
        req.on('end', () => {
          try {
            const { comando, nombre, enc } = JSON.parse(cuerpo);
            if (!clave(comando) || !clave(nombre)) throw new Error('claves');
            if (enc !== null && !(enc && num3(enc.p) && num3(enc.t) && (enc.g === undefined || (typeof enc.g === 'number' && Number.isFinite(enc.g) && Math.abs(enc.g) <= 720)))) throw new Error('encuadre');
            const datos = leerArchivo();
            if (enc === null) { if (datos[comando]) { delete datos[comando][nombre]; if (!Object.keys(datos[comando]).length) delete datos[comando]; } }
            else (datos[comando] = datos[comando] || {})[nombre] = enc.g === undefined ? { p: enc.p, t: enc.t } : { p: enc.p, t: enc.t, g: enc.g };
            respaldar();
            escribirArchivo(datos);
            // el servidor no vigila este archivo (para no recargar la página mientras se edita): se le avisa a mano
            // de que cambió, o serviría la copia vieja al recargar
            for (const m of server.moduleGraph.getModulesByFile(normalizePath(ARCHIVO)) || []) server.moduleGraph.invalidateModule(m);
            console.log(`[encuadres] ${enc === null ? 'borrado' : 'guardado'}: ${nombre}`);
            res.end('ok');
          } catch (e) { console.warn('[encuadres] no se guardó:', e.message); res.statusCode = 400; res.end('mal'); }
        });
      });
    },
  };
}
