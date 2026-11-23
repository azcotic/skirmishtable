# Pendiente

Lo que falta, por prioridad. Actualizado el 23/11/2026. El plan general está en `PLAN.md`.

## 1. Ángeles de la Muerte (Angels of Death): el equipo base

Pasa a ser el equipo principal de la app. Modelos: los azules (Ultramarines, mod `2272196183`).

- [x] Fichas de los 9 agentes (`src/data/teams/angeles-muerte.js`), revisadas contra las fichas.
- [x] Composición: exactamente un líder y 5 agentes; cada uno una vez salvo los combatientes.
- [x] Opciones de arma de los Sargentos, el Tirador Intercesor y el Combatiente Intercesor.
- [x] Arma bólter y regla Astartes (dos Disparar con al menos un arma bólter; +1 PA con la misma arma pesada).
- [x] Ardides de estrategia: Doctrina de combate, Y no conocerán el miedo e Indomitus.
- [x] Tácticas de capítulo (primaria y secundaria, las 8) y Tácticas flexibles. Veterano del Capítulo de los Sargentos.
- [x] Reglas de ficha: Aura de hierro (se aplica sola con el primer dado normal), Guerra según las doctrinas, Capa de camuflaje.
- [ ] Reglas de ficha sin efecto aún: Líder heroico (Capitán), Granadero (faltan las granadas del equipo universal) y la acción Óptica del Francotirador.
- [ ] Móviles: la acción Cargar ya se permite en zona de control, pero la ruta no sale de esa zona (movimiento).
- [x] Sigilosos y Aura de hierro preguntan al jugador (fuera de línea y contra la computadora); en línea se aplican solas. Las habilidades con ventana se declaran en los datos del agente (`habilidades`, ver `habilidadesDe` en `src/ui/ardides.js`).
- [ ] Ardides de tiroteo. Faltan las fotos.
- [ ] Color del capítulo: que cada jugador elija el color, girando el tono azul de las texturas.
- [ ] Validar en el teléfono que los modelos azules se vean bien.

## 2. Reglas generales

- [x] Ardides de estrategia del Aquelarre Disforme: descripción y efecto.
- [ ] Ardides de tiroteo: el botón se muestra; se eligen y cuestan PM, pero aún no tienen efecto.
- [ ] Ponerse en guardia, acciones psíquicas y acciones de misión.
- [ ] Misiones: operación crítica y táctica, y puntos por objetivos. Hoy solo puntúa sola la operación de bajas.
- [ ] Vuelo inmaterial: no impedir atravesar una escotilla abierta.
- [ ] Apéndice mutante y Maestro del Immaterium: se pueden elegir pero no tienen efecto (dependen de misiones y acciones psíquicas).
- [ ] Opciones de arma con límite por comando (por ejemplo, una pistola de llamas disformes en el Aquelarre Disforme).
- [ ] El modelo 3D según el arma elegida.
- [ ] `tests/unit/link.test.js` falla desde antes de estos cambios (ida y vuelta de un enlace de partida).

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

- [ ] Elegir el encuadre de cada miniatura en `http://localhost:5173/#/encuadres` (solo con el servidor de desarrollo; guarda en `src/data/retrato-encuadres.js`) y subir el archivo. Falta hacerlo con los 3 comandos.
- [x] Fichas 2D con la imagen de cada miniatura, generadas desde el modelo 3D (`src/view3d/retratos.js`; falta verlas en pantalla con modelos reales y en el teléfono).
- [ ] Modo aprendizaje.

- [ ] Al recargar en mitad del turno de la computadora, esta no retoma sola su jugada (el resto de la partida sí se conserva).

## 6. Tests y entrega

- [ ] Ejecutar una vez la suite completa (`npm test`) y los tests de navegador (`npm run test:e2e`).
- [ ] Traer `origin/main`, abrir el PR de la rama `ui/esqueleto`.

## 7. Garra Némesis (en pausa, prioridad baja)

- [ ] Reglas de facción y ardides. Faltan las fotos.
- [ ] Confirmar la composición. Hoy son 6 agentes con el Visionario obligatorio y solo el Combatiente repetible; está puesta de memoria, sin la hoja.
- [ ] Opciones de arma como elecciones de facción.
- [ ] Acción Envenenar objetivo del Siembramiedos (necesita marcadores de objetivo).
- [ ] Fichas del resto de los agentes revisadas contra la hoja (solo se revisó la del Siembramiedos).
