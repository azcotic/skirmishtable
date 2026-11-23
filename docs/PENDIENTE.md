# Pendiente

Lo que falta, por prioridad. Actualizado el 23/11/2026. El plan general está en `PLAN.md`.

## 1. Ángeles de la Muerte (Angels of Death): el equipo base

Pasa a ser el equipo principal de la app.

**Modelos 3D**
- [ ] Elegir el mod de Steam. Candidatos (todos traen los 9 tipos de agente):
  - `3357527933` "KT24 - Angels of Death": el más usado (~970 suscriptores). El Capitán viene como paquete de Unity, no como OBJ.
  - `3421573143` "Lamenters AoD Angels of Death Kill Team": todo en OBJ, con 2 o más variantes de cada agente. Esquema de color de los Lamenters.
  - `3353230106` "FS Angels of Death": todo en paquetes de Unity.
- [ ] `scripts/tts-teams.mjs`: aceptar nombres con el formato `{14/14} Nombre` y `E {14/14} Nombre`. Añadir el id elegido y regenerar `src/data/tts-teams.js` (`npm run tts:teams`).
- [ ] Nombres en español de los agentes en `src/i18n/nombres.js`.

**Datos del equipo** (`src/data/teams/angeles-muerte.js`)
- [ ] Fichas de datos de los 9 agentes: atributos y armas. Faltan las fotos de las fichas.
- [ ] Composición, según la hoja del equipo:
  - 1 líder: Sargento Intercesor de Asalto, Sargento Intercesor o Capitán Marine Espacial.
  - 5 agentes de la lista: Granadero Intercesor de Asalto, Combatiente Intercesor de Asalto, Francotirador Eliminador, Tirador Intercesor Pesado, Tirador Intercesor y Combatiente Intercesor.
  - Cada agente solo una vez, salvo los combatientes.
- [ ] Opciones de arma como elecciones de facción:
  - Sargentos: una opción de cada categoría.
  - Tirador Intercesor: lanzagranadas auxiliar más un rifle bólter.
  - Combatiente Intercesor: rifle bólter automático, rifle bólter o rifle bólter silencio, cada uno con puños.
- [ ] La etiqueta "arma bólter": cualquier arma a distancia con "bólter" en el nombre. Algunas reglas del equipo la usan.
- [ ] Reglas de facción y ardides. Faltan las fotos.
- [ ] Tres configuraciones de ejemplo.

## 2. Reglas generales

- [ ] Efectos de los ardides: se eligen y cuestan PM, pero no hacen nada.
- [ ] Ponerse en guardia, acciones psíquicas y acciones de misión.
- [ ] Misiones: operación crítica y táctica, y marcadores de objetivo. Hoy solo puntúa sola la operación de bajas.
- [ ] Vuelo inmaterial: no impedir atravesar una escotilla abierta.
- [ ] Apéndice mutante y Maestro del Immaterium: se pueden elegir pero no tienen efecto (dependen de misiones y acciones psíquicas).
- [ ] Opciones de arma con límite por comando (por ejemplo, una pistola de llamas disformes en el Aquelarre Disforme).
- [ ] El modelo 3D según el arma elegida.

## 3. IA

- [ ] Usar ardides, Retroceder, el doble disparo y combate de los Astartes, y el vuelo.
- [ ] Contar los blancos secundarios de Área y Ráfaga al elegir a quién disparar.
- [ ] Pensar sin congelar la pantalla (1 a 3 s hoy), con opción de un botón "Siguiente" para ir a su ritmo.

## 4. Partida en línea

- [ ] Sincronizar las pantallas de inicio: comando, configuración y elecciones de facción.
- [ ] Sincronizar la fase de estrategia (iniciativa, ardides) y el último bando que activó.
- [ ] Decisiones a mitad de tirada en línea (Repetición de mando, golpear o bloquear).
- [ ] Textos de red y de repeticiones que siguen en inglés.

## 5. Interfaz

- [ ] Fichas 2D con la imagen de cada miniatura, generadas desde el modelo 3D.
- [ ] Modo aprendizaje.

## 6. Tests y entrega

- [ ] Ejecutar una vez la suite completa (`npm test`) y los tests de navegador (`npm run test:e2e`).
- [ ] Traer `origin/main`, abrir el PR de la rama `ui/esqueleto`.

## 7. Garra Némesis (en pausa, prioridad baja)

- [ ] Reglas de facción y ardides. Faltan las fotos.
- [ ] Confirmar la composición. Hoy son 6 agentes con el Visionario obligatorio y solo el Combatiente repetible; está puesta de memoria, sin la hoja.
- [ ] Opciones de arma como elecciones de facción.
- [ ] Acción Envenenar objetivo del Siembramiedos (necesita marcadores de objetivo).
- [ ] Fichas del resto de los agentes revisadas contra la hoja (solo se revisó la del Siembramiedos).
