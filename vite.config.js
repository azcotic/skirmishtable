import { defineConfig } from 'vite';
import { inlineIntoHtml } from './scripts/inline-plugin.js';
import { guardarEncuadres } from './scripts/guardar-encuadres-plugin.js';

// The production build is one self-contained HTML file (all JS and CSS inlined), so it
// can be opened from disk, dropped on any static host, or published as a Claude artifact.
// three.js and the fonts still load from their CDNs (see index.html).
export default defineConfig({
  plugins: [inlineIntoHtml(), guardarEncuadres()],
  // servidor de desarrollo detrás de un túnel (probar desde el teléfono): Vite rechaza los
  // dominios que no conoce; estos son los de los túneles habituales
  // (el archivo de encuadres lo escribe la pantalla #/encuadres: que no recargue la página mientras se edita)
  server: { watch: { ignored: ['**/src/data/retrato-encuadres.js'] }, allowedHosts: ['.devtunnels.ms', '.trycloudflare.com', '.ngrok-free.app', '.ngrok.app', '.loca.lt'] },
  build: { target: 'es2020', outDir: 'dist', cssCodeSplit: false, modulePreload: false, assetsInlineLimit: 100000000 },
  test: { include: ['tests/unit/**/*.test.js'], environment: 'node', fsModuleCache: true },   // fsModuleCache: guarda las transformaciones entre ejecuciones
});
