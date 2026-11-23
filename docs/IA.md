# IA para jugar contra la computadora — borrador

> Estado: **borrador para discutir**. Nada de esto está implementado salvo lo marcado como "ya existe".
> Las reglas se describen con nuestras palabras a partir de las Reglas breves de Kill Team (2024); no se copia
> texto de reglas.

## 1. Objetivo

Un rival "fácil" que juegue **legalmente** y con **intención clara**, para que aprender sea entretenido:

- Busca **incapacitar** agentes enemigos cuando puede.
- Si hay una **misión** (objetivos que puntúan), la prioriza sobre matar cuando le da más puntos.
- No se suicida: si no puede hacer nada útil, se **oculta a cubierto**.
- Es predecible a propósito (para aprender), con un poco de azar para no ser idéntico cada partida.

La IA **no** necesita ser buena; necesita no romper las reglas y que sus decisiones se entiendan. Por eso
cada decisión deja una línea en el registro con el **porqué** ("dispara a B2: 70 % de incapacitarlo").

## 2. Primero: el motor de partida (`src/game/`)

La IA no puede decidir si el juego no sabe **qué está permitido**. Hoy la app es una "mesa de medir": los
jugadores deciden la legalidad. Hay que escribir, sin DOM y con tests, las reglas del turno.

### Ya existe

| Pieza | Dónde | Sirve para |
|---|---|---|
| Fase de estrategia: iniciativa, PM, ardides | `src/game/fases.js` | turnos y recursos |
| Despliegue por turnos | `src/engine/deploy.js` | colocar agentes |
| Rutas con escalada, coste en pulgadas | `src/engine/movement.js` (`planRoute`, `findPath`) | adónde puede llegar un agente |
| Visión, cobertura, ofuscación, blanco válido | `src/engine/shots.js` (`judgeShot`, `shotsFrom`, `cannotShoot`) | a quién puede disparar |
| Zona de control, enfrentamientos | `src/engine/engage.js` (`foesNear`, `engagements`) | combate, cargas |
| Amenazas: dónde te pueden cargar o disparar sin cobertura | `src/engine/threat.js` (`threatMap`, `threatsAt`) | elegir posiciones seguras |
| Tiradas de disparo y combate | `src/engine/dice.js` (`shootRoll`, `fightRoll`) | resolver ataques |

### Falta (la lista de "qué se puede y qué no")

Una función central:

```js
// src/game/acciones.js
accionesLegales(partida, agente)  // -> [{ tipo, coste, ...parámetros }]
aplicar(partida, accion)          // -> nueva partida (o cambios), con registro
```

Reglas que debe respetar (resumen propio de las Reglas breves):

| Acción | PA | Se puede si… | No se puede si… |
|---|---|---|---|
| **Reposicionarse** | 1 | mueve hasta su Movimiento | está en la zona de control de un enemigo; ya cargó o retrocedió en esta activación |
| **Correr** | 1 | mueve hasta 3″, sin trepar | está en zona de control enemiga; ya cargó en esta activación |
| **Retroceder** | 2 | hay un enemigo en su zona de control; puede atravesar zonas de control pero no terminar en una | ya se reposicionó o cargó en esta activación |
| **Cargar** | 1 | mueve Movimiento + 2″ y **debe** terminar en la zona de control de un enemigo | tiene orden de ocultarse; ya está en zona de control enemiga; ya se reposicionó, corrió o retrocedió |
| **Disparar** | 1 | hay un blanco válido sin aliados en su zona de control | está en zona de control enemiga; tiene orden de ocultarse (salvo armas Silenciosas) |
| **Combatir** | 1 | hay un enemigo en su zona de control | — |
| **Reaccionar** | 0 (acción de 1 PA gratis) | sus agentes están todos usados y el rival aún activa; el agente tiene orden de trabarse; una vez por PI; mueve como mucho 2″ | — |

Y además:

- No gastar más PA que el **LPA** del agente en una activación.
- Por defecto, **cada acción una vez por activación**.
- Al activarse, el agente elige **orden** (trabarse u ocultarse); las órdenes cambian lo que puede hacer.
- Activaciones **alternas**, empezando por quien tiene la iniciativa; el PI termina cuando todos están usados.
- Lesionado (menos de la mitad de heridas): −2″ de Movimiento y peor Impactar (ya existe en `dice.js`).

Esto, además de la IA, sirve para **el modo aprendizaje** (avisar "no puedes Cargar con orden de ocultarse")
y para dejar de depender de que los jugadores juzguen la legalidad.

## 3. Cómo decide la IA fácil: puntuar acciones legales

Arquitectura de "utilidad" (utility AI), sencilla y fácil de depurar:

1. **¿Qué agente activo?** Para cada agente propio apostado, calcula su **mejor plan de activación** y su
   puntuación. Activa el de puntuación más alta.
2. **Planes candidatos** por agente (secuencias de acciones legales que caben en su LPA). Para empezar,
   un catálogo corto en lugar de buscar todas las combinaciones:
   - **Disparar** desde donde está (si puede).
   - **Moverse y disparar**: a varias posiciones alcanzables (muestras en una rejilla) y disparar desde la mejor.
   - **Cargar y combatir**.
   - **Ir a un objetivo** (y quedarse a cubierto cerca).
   - **Ponerse a cubierto**: moverse a cobertura y ocultarse.
   - **Retroceder** si está trabado y pierde el combate.
3. **Puntuación** de cada plan = suma ponderada de:

| Término | Cómo se calcula | Peso inicial |
|---|---|---|
| Daño esperado | probabilidad de cada resultado de dados × daño (normal/crítico), con cobertura y ofuscación de `judgeShot` | alto |
| Probabilidad de incapacitar | P(daño ≥ heridas que le quedan al blanco) | muy alto |
| Rematar | bonus si el blanco está lesionado | medio |
| Objetivos | PV que ganaría controlando un objetivo (si hay misión) | **mayor que matar** si hay misión |
| Riesgo | cuántos enemigos no activados podrían cargarle o dispararle sin cobertura en su destino (`threatsAt`) | negativo |
| Cobertura | termina a cubierto / con orden de ocultarse sin poder hacer otra cosa | pequeño |
| Azar | ruido aleatorio pequeño (solo en "fácil") | pequeño |

4. **Explicación**: el plan elegido guarda sus 2–3 términos más grandes para escribir el porqué en el registro.

### Probabilidades de dados (sin simular)

Con `n` dados de ataque, Impactar `h` (6 siempre crítico, 1 siempre fallo) y la salvación del blanco, el
daño esperado se calcula exacto recorriendo las combinaciones de éxitos normales/críticos (son pocos dados).
Si se complica con reglas de arma, se puede aproximar con 500 simulaciones rápidas usando `rollAttack` /
`rollDefence` con un `die` determinista.

### Fase de estrategia y otras decisiones

- **Iniciativa**: si gana la tirada, la toma si tiene un agente que puede disparar o cargar primero; si no, la cede.
- **Ardides** (fácil): no usa ardides, o usa uno fijo por comando cuando tiene PM de sobra. Más adelante, una
  tabla por ardid de "cuándo conviene".
- **Repetición de mando**: repite el dado de ataque fallado más valioso si le quedan PM.
- **Despliegue**: reparte a cubierto dentro de su zona, los de corto alcance más adelante y los
  francotiradores donde vean más mesa.
- **Reaccionar**: si puede disparar a un blanco válido, lo hace.

## 4. Niveles

| Nivel | Qué cambia |
|---|---|
| **Fácil** (primero) | catálogo corto de planes, ruido aleatorio, no usa ardides |
| Normal | más posiciones candidatas; considera la respuesta del rival (amenazas) con más peso; usa ardides con reglas simples |
| Difícil | busca un paso adelante (qué hará el rival después), coordina agentes (fuego concentrado) |

## 5. Integración en la app

- La IA controla un bando (normalmente Slate). Las pantallas de inicio ganan la opción **"Contra la computadora"**.
- Cuando le toca a la IA, la app calcula el plan, lo **muestra** (resalta al agente y su destino) y lo aplica
  con las mismas funciones que usa un jugador (`snapshot`, registro, deshacer), con una pausa para que se vea.
- El cálculo puede ir en un Web Worker si tarda (el motor no usa DOM, así que se puede).
- En línea no aplica (dos humanos).

## 6. Pruebas

- **Motor de partida**: tests de cada fila de la tabla de acciones (puede/no puede), sin navegador.
- **IA**: escenarios pequeños con respuesta esperada ("con un enemigo lesionado a tiro, le dispara"; "con
  orden de ocultarse en cobertura y nada a tiro, no se mueve al descubierto").
- **Partidas IA contra IA** sin navegador: que terminen los 4 PI sin acciones ilegales ni errores.

## 7. Orden de trabajo propuesto

1. **Fase 3b primero**: perfiles reales de Garra Némesis y Aquelarre Disforme (atributos y armas). Sin ellos,
   la IA decidiría con números inventados.
2. `src/game/acciones.js`: acciones legales y activaciones alternas, con tests (también útil para aprender).
3. Probabilidades de daño (`src/game/probabilidades.js`), con tests.
4. IA fácil: elegir agente y plan, explicar el porqué (`src/ai/facil.js`).
5. Integración: opción "Contra la computadora", turnos de la IA animados.
6. Misiones: objetivos que puntúan en la puntuación de la IA.

## 8. Preguntas abiertas

- ¿La IA juega con Slate siempre o eliges tú qué bando controla?
- ¿Cuánto debe esperar entre acciones para que se entienda (1 s, o un botón "siguiente")?
- ¿Mostrar el porqué de cada decisión siempre, o solo en el modo aprendizaje?
- ¿Qué misión usamos primero? (Las Reglas breves permiten jugar sin misión; para empezar, "incapacitar"
  y controlar los objetivos del mapa.)
