import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Browser smoke tests against the production build (`npm run test:e2e` builds first, only
// when the source changed: scripts/e2e.mjs).
// First run: `npx playwright install chromium`. PW_CHROMIUM_PATH points at an existing
// Chromium instead (CI images, sandboxes).

// Un puerto por carpeta: cada worktree levanta su propio `vite preview`, así dos worktrees
// corriendo e2e a la vez no se reutilizan el servidor (y el build) del otro. E2E_PORT lo fija.
const dir = fileURLToPath(new URL('.', import.meta.url));
const hash = [...dir].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const PORT = Number(process.env.E2E_PORT) || 4173 + (hash % 500);
const URL_BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 180_000,   // software-rendered WebGL (CI, sandboxes) draws the full-res models slowly
  // En local, 2 navegadores a la vez: con el valor por defecto (la mitad de los núcleos) cada
  // uno dibuja WebGL por software y, en un disco lento, page.goto agota los 180 s. E2E_WORKERS lo cambia.
  workers: Number(process.env.E2E_WORKERS) || (process.env.CI ? undefined : 2),
  use: {
    baseURL: URL_BASE,
    viewport: { width: 1440, height: 1000 },
    // the side panel starts folded; the tests drive its buttons, so open it (src/ui/sidepanel.js)
    storageState: { cookies: [], origins: [{ origin: URL_BASE, localStorage: [{ name: 'skirmishtable.sidebar', value: 'open' }] }] },
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  // Grupos que se pueden correr por separado: npm run test:e2e:<grupo>
  projects: [
    { name: 'core',    testMatch: 'app.spec.js' },                                   // tablero, movimiento, menús, mapas
    { name: 'mobile',  testMatch: 'mobile.spec.js' },                                // dedo en 3D y 2D, teléfono
    { name: 'net',     testMatch: /(online|fairdice|share|replay)\.spec\.js/ },      // en línea, dados justos, enlaces, grabación
    { name: 'picture', testMatch: 'picture.spec.js' },                               // captura PNG de la mesa
  ],
  webServer: { command: `npx vite preview --port ${PORT} --strictPort`, url: URL_BASE, reuseExistingServer: !process.env.CI },
});
