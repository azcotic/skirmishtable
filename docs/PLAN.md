# Kill Team Trainer — Plan de ataque

Base: fork de [jfreal/skirmishtable](https://github.com/jfreal/skirmishtable) (licencia Unlicense: dominio público, podemos modificarlo libremente).

**Objetivo final:** una app web para aprender Kill Team y jugar contra la computadora (y más adelante contra un amigo).
**Objetivo de esta primera etapa:** que la interfaz sea cómoda en teléfono y tablet, y más simple ("streamlined").

---

## 1. Qué tiene el repo hoy (diagnóstico)

**Stack:** JavaScript sin framework + Vite. three.js r128 por CDN para el 3D. Vitest para tests del motor y Playwright para tests en navegador (ya hay un `tests/e2e/mobile.spec.js`). Multijugador P2P con `trystero`. Se despliega en GitHub Pages como un solo HTML.

**Lo que ya está muy bien resuelto (no tocamos):**

| Pieza | Dónde | Por qué nos sirve |
|---|---|---|
| Motor sin DOM | `src/engine/` | Movimiento con escalada, línea de visión, cobertura, obscurecido. Corre en Node, así que la IA y el tutorial podrán usarlo directamente. |
| Reglas como módulo | `src/rules/killteam.js` | Números de Kill Team 2024 separados del resto. |
| Mapas reales | `src/data/` | Volkus (12 Approved Ops) y Gallowdark. |
| Dados | `src/engine/dice.js`, `src/ui/dicebox.js` | Ataque, defensa, críticos, cobertura. |
| Online | `src/net/` | Base para el modo "contra un amigo" más adelante. |
| Arrastre táctil | `src/ui/input.js`, `table3d.js` | Ya hay soporte de dedo y tests de drag en móvil. |

**Lo que choca con nuestro objetivo:**

1. **La UI es de escritorio con parches.** Un header, una barra con muchos selectores (estilos de anillos, amenazas, rutas de carga…) y un panel lateral con **12 paneles apilados** (Battle tray, Ops & score, Play online, Replay, Rules, Map, Miniatures, Operative, Valid shots, Verdict, Log). En pantallas < 760px el panel simplemente cae debajo del tablero: hay que hacer scroll largo para llegar a la acción.
2. **Demasiadas opciones de laboratorio.** Selectores de estilo de anillos, intensidad de zonas, 3 rulesets (Infinity y Ashfall no nos sirven), importador de TTS, replay, tarjetas de estado.
3. **No es un juego, es una mesa de medir.** El propio README lo dice: *"the players stay in charge of legality"* y *"the battle tray, dice and actions are a light mock"*. No hay secuencia de activaciones forzada, ni APL, ni validación de cargas. Esto no afecta la etapa de UI, pero es **la pieza más grande** para el modo aprendizaje y para jugar contra la IA (ver §6).
4. **Peso en móvil.** Los modelos reales de Steam son ~50 MB y el 3D completo puede ir lento en teléfonos modestos.

---

## 2. Principios de diseño

- **El tablero es la app.** Ocupa toda la pantalla; todo lo demás aparece encima, cuando hace falta, y se va.
- **Contexto, no paneles.** Si seleccionas un agente, ves sus acciones. Si disparas, ves el veredicto y los dados. Nada más.
- **Un pulgar.** Botones de al menos 44×44 px, acciones principales en la mitad inferior de la pantalla.
- **Solo Kill Team.** Quitamos los otros rulesets de la interfaz (el código puede quedarse).
- **100% en español.** Todo texto visible (botones, ayudas, log, veredictos, tooltips) en español. Los nombres propios de equipos y agentes se quedan como en el juego (Warpcoven, Gunner…), pero las acciones y conceptos se traducen (Reposicionarse, Correr, Cargar, Disparar, Combatir, orden de trabarse / ocultarse), con la terminología oficial de GW en español. Un glosario fijo en `src/i18n/es.js` para que la traducción sea consistente.

---

## 3. Layout objetivo

### Teléfono (vertical)

```
┌─────────────────────────┐
│ PI 1 · PM 3|3 · PV 0|0 ☰│  ← barra superior compacta (battle tray resumido)
├─────────────────────────┤
│                         │
│                         │
│     TABLERO (3D/2D)     │  ← pantalla completa
│                         │
│                         │
├─────────────────────────┤
│ [Mover] [Disparar]      │  ← barra de acciones contextual (solo con agente seleccionado)
│ [Combatir] [Orden] [Fin]│  ← [Orden] alterna trabarse / ocultarse
└─────────────────────────┘
      ↑ hoja inferior deslizable: ficha del agente, veredicto, dados, log
```

### Tablet (horizontal)

Tablero a la izquierda (~70%) y un panel lateral **plegable** a la derecha con pestañas en lugar de 12 paneles apilados. Barra de acciones contextual igual que en teléfono.

### Reorganización de los 12 paneles actuales

| Panel actual | Destino |
|---|---|
| Battle tray | Barra superior compacta (PI, PM, PV) + botones en menú ☰ |
| Operative, Valid shots, Verdict | Hoja inferior contextual al seleccionar/apuntar |
| Dice box (x2) | Hoja de dados que aparece al tirar |
| Log | Pestaña dentro de la hoja inferior |
| Map, Miniatures | Pantalla de **configuración de partida** antes de jugar |
| Ops & score | Pestaña "Misión" en el menú ☰ |
| Rules | Eliminado de la UI (fijo Kill Team) |
| Play online, Replay | Ocultos por ahora (sección "Avanzado") |
| Selectores de anillos/amenazas | Valores por defecto fijos; opción en "Avanzado" |
| Importar TTS, status cards | Ocultos ("Avanzado") |

---

## 3b. Dos vistas: 3D y 2D (fichas tipo VTT)

**3D:** como hoy, con los modelos reales que el navegador descarga de Steam.

**2D:** tablero cenital con **fichas redondas con la imagen de cada miniatura**, como en un VTT de D&D (Roll20, Foundry, Owlbear Rodeo), para que cada agente se reconozca de un vistazo.

De dónde salen las imágenes (sin romper la regla de "no guardar contenido de terceros en el repo"):

1. **Generadas en el navegador a partir del modelo 3D de Steam.** Ya cargamos el modelo para el 3D; lo renderizamos una vez en un canvas fuera de pantalla (vista 3/4 o cenital, recorte circular, borde del color del equipo) y guardamos la imagen en la caché del navegador. No se sube nada al repo ni al sitio. Es la opción principal.
2. **Respaldo:** si no se han cargado los modelos, ficha con iniciales + icono del rol (líder, francotirador, pesado…) en el color del equipo.
3. **Opcional:** que el usuario suba su propia foto de la miniatura (se queda solo en su navegador).

Sobre la ficha: anillo de estado (apostado / usado), contador de heridas, marcador de orden (trabarse / ocultarse) y número del agente.

---

## 3c. Equipos iniciales

| Equipo | Estado en el repo |
|---|---|
| **Warpcoven** | Ya está en el catálogo (`src/data/tts-teams.js`), en dos versiones de modelos (la normal y la de Space Marine 2). Hay que elegir una. |
| **Angels of Death** | **No está** en el catálogo. Hay que buscar su mod en el Steam Workshop (serie Yellowscribed u otra) y añadir su id a `TEAMS` en `scripts/tts-teams.mjs`, luego `npm run tts:teams`. |

**Perfiles reales:** hoy todos los agentes usan perfiles genéricos inventados (`KINDS` en `src/engine/world.js`: leader, marksman, brawler, trooper). Para aprender necesitamos las fichas de estos dos equipos (APL, movimiento, salvación, heridas, armas con ataques/impacto/daño y reglas de arma). Se escriben a mano como **números** en `src/data/teams/warpcoven.js` y `src/data/teams/angels-of-death.js`, con descripciones en nuestras palabras; nada de copiar el texto de las cartas. Las reglas especiales de cada equipo (psíquicos del Warpcoven, etc.) quedan para la fase del motor de partida.

---

## 4. Fases de trabajo (etapa UI)

### Fase 0 — Preparación (hoy, ~2 h)
1. En GitHub: **Fork** de `jfreal/skirmishtable` a tu cuenta.
2. En tu PC:
   ```sh
   git clone https://github.com/<tu-usuario>/skirmishtable killteam
   cd killteam
   git remote add upstream https://github.com/jfreal/skirmishtable
   npm ci
   npm test          # debe pasar en verde antes de tocar nada
   npm run dev -- --host   # para abrirlo en el teléfono/tablet en la misma wifi
   ```
3. Reemplazar `CLAUDE.md` por el nuestro (en español, con este plan y las reglas de licencia).
4. Copiar `PLAN.md` a `docs/PLAN.md`.
5. Un worktree por tarea, para que Claude Code trabaje en ramas aisladas:
   ```sh
   git worktree add ../kt-limpieza -b ui/limpieza
   git worktree add ../kt-i18n -b ui/espanol
   ```
   Abrir cada carpeta en VS Code por separado; al terminar, PR hacia `main` de tu fork.
6. Abrirlo en el teléfono y la tablet y anotar la fricción real.

### Fase 1 — Limpieza + español (2–3 días)
- Crear `src/i18n/es.js` (glosario + todos los textos) y pasar `index.html` y `src/ui/*` a usarlo. Cambiar `<html lang="es">`.
- Fijar Kill Team como único ruleset visible.
- Mover a "Avanzado" (o quitar) todo lo listado arriba.
- Fijar valores por defecto sensatos para anillos y zonas de amenaza.
- Resultado: misma app, mucho menos ruido.

### Fase 2 — Nuevo esqueleto responsive (2–3 días)
- Reescribir `index.html` + `styles.css` con el layout de §3 (mobile-first, CSS Grid, breakpoints ~600px y ~1024px).
- Respetar `safe-area-inset` (notch), `100dvh` en vez de `100vh`, evitar zoom accidental.
- Crear componentes reutilizables: barra superior, barra de acciones, hoja inferior (bottom sheet), menú ☰.
- Reconectar los módulos de `src/ui/` a los nuevos contenedores (la lógica se mantiene, cambia dónde se pintan).

### Fase 3 — Flujo de partida guiado (2 días)
- Pantalla de inicio: **Aprender / Jugar vs IA (después) / Jugar con amigo (después)**.
- Configuración de partida en pasos: mapa → equipos → despliegue.
- Barra de acciones contextual con las acciones de Kill Team.

### Fase 3b — Equipos y fichas 2D (2–3 días)
- Añadir Angels of Death al catálogo; fijar la versión de Warpcoven.
- Perfiles numéricos de los dos equipos.
- Generador de fichas 2D desde el modelo 3D + respaldo con iniciales.
- Configuración de partida limitada a estos dos equipos.

### Fase 4 — Interacción táctil (1–2 días)
- Tocar para seleccionar, arrastrar para mover (ya existe; revisar), mantener pulsado para info.
- Pellizcar para zoom y dos dedos para rotar en 3D, sin conflictos con el arrastre de agentes.
- Selector de vista 3D / 2D siempre visible. En teléfono, sugerir 2D al inicio (más ligero), con el 3D a un toque.

### Fase 5 — Pruebas (continuo)
- Ampliar `tests/e2e/mobile.spec.js` con perfiles de Playwright (iPhone, Android, iPad vertical y horizontal).
- Mantener `npm test` en verde: no tocamos el motor en esta etapa.
- Opcional: convertir en PWA (instalable en el teléfono, funciona sin conexión).

---

## 5. Lo que NO hacemos ahora
- IA, tutorial interactivo, multijugador con el amigo.
- Cambios en `src/engine/` salvo que la UI lo exija.
- Nuevos mapas o equipos.

---

## 6. Lo que viene después (para tenerlo en mente)

1. **Motor de partida** (`src/game/`): secuencia de Turning Points, iniciativa, activaciones alternas, APL, órdenes, acciones legales por agente, fin de partida. Sin DOM, como el motor actual, con tests.
2. **Modo aprendizaje**: lecciones cortas en escenarios pequeños (mover, cobertura, disparar, pelear, objetivos), con explicaciones en nuestras propias palabras.
3. **IA**: primero una heurística simple (puntuar acciones legales: daño esperado, cobertura, control de objetivos), sobre el motor de partida.
4. **Contra un amigo**: reaprovechar `src/net/` (ya existe P2P).

---

## 7. Cuidado con la propiedad intelectual
Seguimos la regla del repo original: **no copiamos texto de reglas, cartas ni imágenes de Games Workshop**. Las reglas se expresan como números y explicaciones escritas por nosotros; los modelos se siguen cargando desde Steam en el navegador de cada jugador. "Kill Team" es marca de Games Workshop; este es un proyecto de fans no oficial.

---

## 8. Decisiones tomadas
- Fork propio + worktrees por tarea; desarrollo en VS Code con Claude Code.
- UI 100% en español.
- Ambas vistas: 3D (modelos de Steam) y 2D (fichas con imagen de la miniatura).
- Equipos iniciales: Angels of Death (Space Marines de Kill Team 2024) y Warpcoven.

## 9. Decisiones pendientes
- ¿Qué versión de modelos de Warpcoven: la clásica o la de Space Marine 2?
- ¿Con qué roster de cada equipo aprendemos? (sugerencia: uno fijo y pequeño para empezar).
- ¿Nombres de comandos y agentes en español oficial (Ángeles de la Muerte, Aquelarre Disforme, Tirador Intercesor) o en inglés (Angels of Death, Warpcoven, Intercessor Gunner)?
