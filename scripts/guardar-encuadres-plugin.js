/**
 * Solo en desarrollo (servidor de Vite, nunca en el build): recibe los encuadres de las fichas 2D
 * que se eligen en la pantalla #/encuadres y los escribe en src/data/retrato-encuadres.js, listos
 * para commit. Solo acepta peticiones desde esta misma máquina y valida que sean solo números.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ARCHIVO = fileURLToPath(new URL('../src/data/retrato-encuadres.js', import.meta.url));
const num3 = v => Array.isArray(v) && v.length === 3 && v.every(n => typeof n === 'number' && Number.isFinite(n) && Math.abs(n) < 1000);
const clave = s => typeof s === 'string' && s.length > 0 && s.length < 80;

// El JSON con los vectores en una sola línea: { "p": [1, 2, 3], "t": [1, 2, 3] }
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

export function guardarEncuadres() {
  return {
    name: 'guardar-encuadres',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__encuadres', (req, res) => {
        const ip = req.socket.remoteAddress || '';
        if (req.method !== 'POST' || !/^(::1|127\.0\.0\.1|::ffff:127\.0\.0\.1)$/.test(ip)) { res.statusCode = 403; return res.end('no'); }
        let cuerpo = '';
        req.on('data', c => { cuerpo += c; if (cuerpo.length > 1e6) req.destroy(); });
        req.on('end', () => {
          try {
            const datos = JSON.parse(cuerpo), limpio = {};
            for (const [c, agentes] of Object.entries(datos)) {
              if (!clave(c) || typeof agentes !== 'object' || !agentes) throw new Error('comando');
              limpio[c] = {};
              for (const [n, e] of Object.entries(agentes)) {
                if (!clave(n) || !e || !num3(e.p) || !num3(e.t)) throw new Error('agente');
                if (e.g !== undefined && !(typeof e.g === 'number' && Number.isFinite(e.g) && Math.abs(e.g) <= 720)) throw new Error('frente');
                limpio[c][n] = e.g === undefined ? { p: e.p, t: e.t } : { p: e.p, t: e.t, g: e.g };
              }
            }
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
              `export const ENCUADRES = ${aTexto(limpio)};`,
              '',
            ].join('\n'));
            res.end('ok');
          } catch (e) { res.statusCode = 400; res.end('mal'); }
        });
      });
    },
  };
}
