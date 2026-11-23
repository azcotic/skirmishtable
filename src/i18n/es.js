/**
 * Todos los textos visibles de la interfaz, en español neutro con tuteo.
 *
 * - G: glosario de términos del juego. Fuente: las Reglas breves (Lite Rules) y las reglas
 *   de equipo oficiales de GW en español (02/10/2024). `en` guarda el término inglés para el
 *   modo aprendizaje (las cartas y la comunidad usan inglés). `provisional: true` = no aparece
 *   en esos documentos; confirmar cuando tengamos la fuente.
 * - T: textos por zona de la interfaz. Texto fijo = string; texto con datos = función.
 *
 * Solo términos sueltos: nunca copiar aquí texto de reglas (ver CLAUDE.md).
 * Ojo: "Cargar" es la acción Charge; para archivos o modelos usa "Descargar" o "Abrir".
 *
 * Módulo puro (sin DOM ni imports) para poder usarlo desde Vitest y Playwright.
 */

/* ---------- formato ---------- */
// Pulgadas: a un decimal con coma (2,5″); sin ",0" cuando redondea a entero (1,04 -> 1).
export const num = v => {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',');
};
export const pulg = v => `${num(v)}″`;
export const pl = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/* ---------- glosario ---------- */
export const G = {
  // partida
  agente:          { es: 'agente', plural: 'agentes', en: 'operative' },
  comando:         { es: 'comando', plural: 'comandos', en: 'kill team' },
  zonaAniquilacion:{ es: 'zona de aniquilación', en: 'killzone' },
  zonaDescenso:    { es: 'zona de descenso', en: 'drop zone' },
  puntoInflexion:  { es: 'punto de inflexión', plural: 'puntos de inflexión', abrev: 'PI', en: 'Turning Point' },
  iniciativa:      { es: 'iniciativa', en: 'initiative' },
  faseEstrategia:  { es: 'fase de estrategia', en: 'Strategy phase' },
  faseTiroteo:     { es: 'fase de tiroteo', en: 'Firefight phase' },
  pm:              { es: 'puntos de mando', abrev: 'PM', en: 'Command Points (CP)' },
  pa:              { es: 'puntos de acción', abrev: 'PA', en: 'Action Points (AP)' },
  lpa:             { es: 'límite de puntos de acción', abrev: 'LPA', en: 'APL' },
  pv:              { es: 'puntos de victoria', abrev: 'PV', en: 'Victory Points (VP)', provisional: true },
  ardid:           { es: 'ardid', plural: 'ardides', en: 'ploy' },
  ardidEstrategico:{ es: 'ardid estratégico', plural: 'ardides de estrategia', en: 'strategy ploy' },
  ardidTiroteo:    { es: 'ardid de tiroteo', plural: 'ardides de tiroteo', en: 'firefight ploy' },
  gambito:         { es: 'gambito estratégico', en: 'strategic gambit' },
  repeticionMando: { es: 'Repetición de mando', en: 'Command Re-roll' },
  equipoFaccion:   { es: 'equipo de facción', en: 'faction equipment' },
  reglasFaccion:   { es: 'reglas de facción', en: 'faction rules' },
  tacticaCapitulo: { es: 'táctica de capítulo', plural: 'tácticas de capítulo', en: 'chapter tactic' },
  opCritica:       { es: 'operación crítica', en: 'Crit Op', provisional: true },
  opTactica:       { es: 'operación táctica', en: 'Tac Op', provisional: true },
  opEliminacion:   { es: 'operación de eliminación', en: 'Kill Op', provisional: true },

  // órdenes y estado del agente
  trabarse:        { es: 'Trabarse', orden: 'orden de trabarse', en: 'Engage' },
  ocultarse:       { es: 'Ocultarse', orden: 'orden de ocultarse', en: 'Conceal' },
  apostado:        { es: 'apostado', en: 'ready' },
  usado:           { es: 'usado', en: 'expended' },
  activo:          { es: 'agente activo', en: 'active operative' },
  herido:          { es: 'herido', en: 'wounded' },        // menos heridas que al inicio
  lesionado:       { es: 'lesionado', en: 'injured' },     // menos de la mitad
  incapacitado:    { es: 'incapacitado', en: 'incapacitated' },

  // acciones (`verbo` = tercera persona, para el registro)
  reposicionarse:  { es: 'Reposicionarse', verbo: 'se reposiciona', en: 'Reposition' },
  correr:          { es: 'Correr', verbo: 'corre', en: 'Dash' },
  retroceder:      { es: 'Retroceder', verbo: 'retrocede', en: 'Fall Back' },
  cargar:          { es: 'Cargar', verbo: 'carga', en: 'Charge' },
  disparar:        { es: 'Disparar', verbo: 'dispara a', en: 'Shoot' },
  combatir:        { es: 'Combatir', verbo: 'combate contra', en: 'Fight' },
  reaccionar:      { es: 'Reaccionar', en: 'Counteract' },
  guardia:         { es: 'Ponerse en guardia', en: 'Guard' },
  recogerMarcador: { es: 'Recoger marcador', en: 'Pick Up Marker' },
  colocarMarcador: { es: 'Colocar marcador', en: 'Place Marker' },

  // distancia, visión y terreno
  zonaControl:     { es: 'zona de control', en: 'control range' },
  blancoValido:    { es: 'blanco válido', plural: 'blancos válidos', en: 'valid target' },
  visible:         { es: 'visible', en: 'visible' },
  aCubierto:       { es: 'a cubierto', en: 'in cover' },
  cobertura:       { es: 'cobertura', en: 'cover' },
  terrenoInterpuesto: { es: 'terreno interpuesto', en: 'intervening terrain' },
  ofuscado:        { es: 'ofuscado', en: 'obscured' },
  aventajado:      { es: 'terreno aventajado', en: 'Vantage terrain' },
  terrenoLigero:   { es: 'terreno ligero', en: 'Light terrain' },
  terrenoPesado:   { es: 'terreno pesado', en: 'Heavy terrain', provisional: true },
  trepar:          { es: 'trepar', en: 'climb' },

  // dados y combate
  exitoNormal:     { es: 'éxito normal', en: 'normal success' },
  exitoCritico:    { es: 'éxito crítico', en: 'critical success' },
  golpe:           { es: 'Golpe', en: 'Strike' },
  bloqueo:         { es: 'Bloqueo', en: 'Block' },
  dadosAtaque:     { es: 'dados de ataque', en: 'attack dice' },
  dadosDefensa:    { es: 'dados de defensa', en: 'defence dice' },

  // atributos de la ficha de datos
  movimiento:      { es: 'Movimiento', en: 'Move' },
  salvacion:       { es: 'Salvación', en: 'Save' },
  heridas:         { es: 'Heridas', en: 'Wounds' },
  ataques:         { es: 'Ataques', abrev: 'ATAQ.', en: 'Attacks' },
  impactar:        { es: 'Impactar', abrev: 'IMP.', en: 'Hit' },
  dano:            { es: 'Daño', abrev: 'DAÑO', en: 'Damage' },
  reglasArma:      { es: 'reglas de armas', en: 'weapon rules' },
};

// Reglas de arma: clave = nombre inglés (como en los datos), valor = nombre oficial en español.
export const REGLAS_ARMA = {
  'Accurate': 'Certera', 'Balanced': 'Equilibrada', 'Blast': 'Área', 'Brutal': 'Brutal',
  'Ceaseless': 'Incesante', 'Devastating': 'Devastadora', 'Heavy': 'Pesada', 'Hot': 'Sobrecalentamiento',
  'Lethal': 'Letal', 'Limited': 'Limitada', 'Piercing': 'Penetración', 'Piercing Crits': 'Críticos de penetración',
  'Punishing': 'Castigadora', 'Range': 'Alcance', 'Relentless': 'Implacable', 'Rending': 'Desgarradora',
  'Saturate': 'Saturación', 'Seek': 'Buscadora', 'Severe': 'Severa', 'Shock': 'Choque',
  'Silent': 'Silenciosa', 'Stun': 'Aturdidora', 'Torrent': 'Ráfaga',
};

const PI = G.puntoInflexion.abrev, PM = G.pm.abrev, PV = G.pv.abrev;

/* ---------- textos de la interfaz ---------- */
export const T = {
  app: {
    mostrarPanel: 'Mostrar panel',
    ocultarPanel: 'Ocultar panel',
    panelTitulo: 'Pliega el panel lateral para que el tablero ocupe toda la pantalla (se recuerda en este navegador)',
    opciones: 'Opciones',
    opcionesTitulo: 'Ajustes, guardados en este navegador',
    hecho: 'Hecho',
  },

  ayuda: {
    inicio: 'Arrastra un agente para moverlo: la app busca la ruta rodeando o trepando el terreno y calcula su costo según las reglas. Toca un agente para seleccionarlo.',
  },

  vista: {
    mesa3d: 'Mesa 3D',
    mesa3dTitulo: 'La mesa en 3D, con el terreno escaneado de TTS cuando está disponible. Arrastra los agentes para moverlos; arrastra la mesa para girarla.',
    mapa2d: 'Mapa 2D',
    mapa2dTitulo: 'Mapa cenital con la regla de medir y las sombras de la línea de visión',
    cenital: 'Cenital',
    cenitalTitulo: 'Mira la mesa desde arriba (vuelve a tocar para la vista inclinada)',
    descargarSteam: 'Descargar de Steam',
    descargarSteamTitulo: 'Descarga a este navegador los escaneos y texturas exactos de Tabletop Simulator desde el CDN de Steam Workshop. Este sitio no los aloja.',
  },

  anillos: {
    titulo: 'Estilos de anillo de peana para probar: para los agentes apostados y para el activo (seleccionado o en plena activación)',
    apostado: 'Apostado',
    activo: 'Activo',
  },

  amenazas: {
    titulo: 'Mientras arrastras: hasta dónde podrían llegar a tu miniatura los enemigos que aún no se han activado',
    nombre: 'Amenazas',
    zonas: 'Zonas',
    zonasTitulo: 'Intensidad del color de las zonas de amenaza',
    rutas: 'Rutas de carga',
    rutasTitulo: 'Cómo se dibuja la ruta por la que cada enemigo podría cargar contra el punto donde aterrizas, del enemigo hacia ti',
    leyendaCarga: 'carga',
    leyendaSinCobertura: 'sin cobertura',
  },

  mesa: {
    tablero: 'Mesa de juego vista desde arriba, 30 por 22 pulgadas',
    agentes: 'Agentes: toca uno para encontrarlo en la mesa',
    tarjetas: equipo => `Tarjetas de estado de ${equipo}`,
    cajaDados: equipo => `Caja de dados de ${equipo}`,
  },

  bandeja: {
    titulo: 'Marcador',
    puntoInflexion: 'Punto de inflexión',
    pm: equipo => `${PM} · ${equipo}`,
    pv: equipo => `${PV} · ${equipo}`,
    finPI: `Fin del ${PI}`,
    finPITitulo: 'Prepara todos los agentes y pasa al siguiente punto de inflexión',
    deshacer: 'Deshacer',
    deshacerTitulo: 'Deshace la última acción confirmada',
    reiniciar: 'Reiniciar',
    regla: 'Regla',
    reglaTitulo: 'Medición libre: toca dos puntos',
  },

  paneles: {
    operaciones: 'Operaciones y puntuación',
    enLinea: 'Jugar en línea',
    grabacion: 'Grabación',
    reglas: 'Reglas',
    zona: 'Zona de aniquilación',
    miniaturas: 'Miniaturas',
    agente: 'Agente',
    blancos: 'Blancos válidos',
    veredicto: 'Veredicto',
    registro: 'Registro',
  },

  zona: {
    version: 'versión 28 · arrastre táctil corregido',
    versionTitulo: 'Qué versión de la app es esta',
    importar: 'Importar mapa de TTS…',
    importarTitulo: 'Abre una partida guardada de Tabletop Simulator (.json) o un WorkshopUpload (BSON) con un mapa de Gallowdark',
  },

  ficha: {
    vacia: 'Nada seleccionado.',
    apuntar: 'Apuntar',
  },

  blancos: {
    ayuda: 'Selecciona o arrastra un agente para ver a qué puede disparar.',
  },

  veredicto: {
    ayuda: 'Selecciona un agente, toca Apuntar y luego toca un enemigo.',
  },
};
