# CLAUDE.md

## Qué es este proyecto

Fork de [jfreal/skirmishtable](https://github.com/jfreal/skirmishtable) convertido en una app para
**aprender a jugar Kill Team (2024)** y, más adelante, jugar contra la computadora y contra un amigo.

El plan completo está en `docs/PLAN.md`. Léelo antes de empezar una tarea.

**Etapa actual:** interfaz cómoda en teléfono y tablet, simplificada y 100% en español.
No tocamos `src/engine/` salvo que la interfaz lo exija.

## Reglas de la interfaz

- **Todo texto visible en español.** Nada de cadenas sueltas en el código: van en `src/i18n/es.js`.
  Los nombres de comandos, agentes y armas van **siempre en español oficial**, tal como aparecen en
  las reglas de equipo de GW en español (`src/i18n/nombres.js`); las acciones y conceptos se traducen
  según el glosario de ese archivo.
- **Terminología oficial de GW en español.** El glosario (`G` en `src/i18n/es.js`) sigue las Reglas
  breves y las reglas de equipo oficiales en español (PDF gratuitos de warhammer-community.com):
  agente, comando, zona de aniquilación, orden de trabarse / ocultarse, apostado / usado, Combatir,
  lesionado, PM, PA, LPA. No inventar traducciones de términos del juego: buscarlos ahí. Solo se usan
  los términos; nunca se copia texto de reglas.
- **Mobile-first.** Diseñar primero para teléfono vertical (~390 px), después tablet (~768–1024 px),
  después escritorio. Botones de al menos 44×44 px. Respetar `env(safe-area-inset-*)` y usar `100dvh`.
- **El tablero ocupa la pantalla.** Lo demás va en barra superior, barra de acciones contextual,
  hoja inferior o menú ☰ (ver §3 del plan).
- **Solo Kill Team.** Los rulesets Infinity y Ashfall no se muestran.
- **Dos vistas:** 3D con modelos de Steam y 2D con fichas circulares con la imagen de cada miniatura
  (estilo VTT). Las imágenes se generan en el navegador desde el modelo 3D (ver §3b del plan).
- **Comandos de prueba:** Garra Némesis (Nemesis Claw, Night Lords) y Aquelarre Disforme (Warpcoven),
  los dos ya están en el catálogo de mods de Steam. Ángeles de la Muerte queda para más adelante.

## Licencia y contenido de terceros (heredado del original, obligatorio)

El código es dominio público (Unlicense). **Nunca subir contenido de terceros** al repo, a su
historial ni al sitio publicado: modelos, texturas, escaneos, imágenes de cartas o fichas, mapas,
PDFs, **texto de reglas**, partidas guardadas de TTS, capturas que los muestren, fuentes o iconos con
licencia que exija aviso.

- Los recursos de terceros llegan al jugador de una sola forma: su navegador los descarga del origen
  (CDN de Steam, imgur) a partir de los catálogos de enlaces en `src/data/tts-*.js`.
- Las fichas 2D generadas desde los modelos se guardan **solo en la caché del navegador**.
- Las reglas y perfiles de agentes se escriben como números y explicaciones con nuestras palabras.
- Copias locales solo en carpetas ignoradas por git (`cache/`, `public/models/`,
  `public/meshpack.json`). Revisar `git status` antes de cada commit.
- "Kill Team", "Warpcoven", "Nemesis Claw", "Angels of Death", "Volkus" y similares son marcas de Games Workshop;
  usarlas solo para decir con qué funciona la app. Proyecto de fans no oficial.

## Flujo de git

- Trabajamos en **nuestro fork**. `upstream` apunta al repo original, solo para traer mejoras.
- Una rama y un worktree por tarea (`git worktree add ../kt-<tarea> -b <tipo>/<tarea>`).
- Por defecto, nada de commits directos a `main`: PR desde la rama a `main` del fork.
- **Excepción:** cuando el usuario pida explícitamente subir o fusionar a `main`, se puede hacer
  directamente (merge de la rama en `main` y `git push origin main`), sin PR. Antes: `git fetch origin`,
  merge de `origin/main` en la rama y `npm test` en verde. Nunca con `--force`.
- Commits pequeños y descriptivos. Antes del PR: `git fetch origin`, merge de `origin/main`,
  `npm test` en verde y, si tocaste la interfaz, `npm run test:e2e`.

## Comandos

```sh
npm ci                  # instalar dependencias bloqueadas (usar ci, no install)
npm run dev -- --host   # servidor de desarrollo, accesible desde el teléfono en la misma red
npm test                # tests del motor (Vitest)
npm run build           # build de producción -> dist/
npm run test:e2e        # Playwright contra el build (incluye perfiles de móvil)
npm run tts:teams       # regenerar el catálogo de equipos de Steam
```

## Notas del repo

- `README.md` y `docs/ARCHITECTURE.md` explican el motor en detalle.
- El motor (`src/engine/`) no importa nada de la interfaz y corre en Node.
- Es un prototipo: priorizar que funcione sobre el pulido.
