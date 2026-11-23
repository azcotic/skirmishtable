// Tests e2e sin reconstruir de más: compila dist/ solo si algo del código es más nuevo que
// el último build (o con --build), y luego pasa el resto de los argumentos a Playwright.
//   node scripts/e2e.mjs                    todo
//   node scripts/e2e.mjs --project=mobile   un grupo (ver projects en playwright.config.js)
//   node scripts/e2e.mjs --last-failed      solo los que fallaron la última vez
//   node scripts/e2e.mjs --build ...        fuerza el build
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const forzar = args.includes('--build');
const resto = args.filter(a => a !== '--build');

// lo más reciente modificado entre lo que entra en el build
const FUENTES = ['src', 'public', 'index.html', 'vite.config.js', 'package-lock.json', 'scripts/inline-plugin.js'];
function masReciente(ruta) {
  if (!existsSync(ruta)) return 0;
  const st = statSync(ruta);
  if (!st.isDirectory()) return st.mtimeMs;
  let m = st.mtimeMs;   // cuenta archivos borrados o renombrados dentro
  for (const e of readdirSync(ruta)) m = Math.max(m, masReciente(join(ruta, e)));
  return m;
}

const salida = 'dist/index.html';
const hecho = existsSync(salida) ? statSync(salida).mtimeMs : 0;
const cambio = Math.max(...FUENTES.map(masReciente));
if (forzar || cambio > hecho) {
  console.log(forzar ? 'Build forzado…' : 'Hay cambios desde el último build: compilando dist/…');
  execSync('npm run build', { stdio: 'inherit' });
} else {
  console.log('dist/ está al día: se omite el build (usa --build para forzarlo).');
}

const r = spawnSync('npx', ['playwright', 'test', ...resto], { stdio: 'inherit', shell: true });
process.exit(r.status ?? 1);
