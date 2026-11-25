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
  // palabras clave y reglas propias de un comando (el * remite a su ficha)
  'PSYCHIC': 'Psíquica', 'Terrorchem*': 'Terrotoxinas*', 'Mindburn*': 'Quemar mente*', 'Shield*': 'Escudo*',
};
// Una regla de arma en español, con su parámetro: 'Range 8"' -> 'Alcance 8″',
// 'Heavy (Reposition only)' -> 'Pesada (solo Reposicionarse)', 'Seek Light' -> 'Buscadora (Ligero)'.
const CLAVES_REGLAS = Object.keys(REGLAS_ARMA).sort((a, b) => b.length - a.length);
export function traducirRegla(r) {
  const s = String(r).trim();
  if (REGLAS_ARMA[s]) return REGLAS_ARMA[s];
  const dv = /^(\d+(?:\.\d+)?)" Devastating (\d+)$/.exec(s);   // Devastadora con distancia
  if (dv) return `${num(+dv[1])}″ ${REGLAS_ARMA.Devastating} ${dv[2]}`;
  const k = CLAVES_REGLAS.find(c => s.startsWith(c + ' '));
  if (!k) return s;
  let resto = s.slice(k.length + 1).replace(/"/g, '″')
    .replace('(Reposition only)', `(solo ${G.reposicionarse.es})`).replace('(Dash only)', `(solo ${G.correr.es})`);
  if (k === 'Seek' && resto === 'Light') resto = '(Ligero)';
  return `${REGLAS_ARMA[k]} ${resto}`;
}

const PI = G.puntoInflexion.abrev, PM = G.pm.abrev, PV = G.pv.abrev, PA_ = G.pa.abrev;

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

  // pestañas de la hoja inferior (teléfono/tablet) y barra de acciones
  hoja: {
    titulo: 'Secciones',
    agente: 'Agente',
    partida: 'Partida',
    mision: 'Misión',
    registro: 'Registro',
    mas: 'Más',
    cerrar: 'Cerrar',
    info: 'Información del agente',
  },
  acciones: {
    titulo: 'Acciones',
    deseleccionarTitulo: 'Quitar la selección',
    paEtiqueta: 'PA',
    paTitulo: (libres, lpa) => `Puntos de acción libres en esta activación: ${libres} de ${lpa}. Cada acción gasta 1 (algunas, más).`,
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
    reiniciarZoom: 'Ver el mapa completo',
    descargarSteam: 'Descargar de Steam',
    descargarSteamMb: mb => `Descargar de Steam (${mb} MB)`,
    descargarSteamTitulo: 'Descarga a este navegador los escaneos y texturas exactos de Tabletop Simulator desde el CDN de Steam Workshop. Solo baja lo del mapa en pantalla y lo que ya está en este navegador no se vuelve a descargar. Este sitio no los aloja.',
    nota3d: 'Arrastra un agente para moverlo · arrastra la mesa para girarla, usa la rueda para acercar y WASD para desplazarte · la regla está en el mapa 2D.',
    sinModelos: mb => `Terreno en bloques: este sitio no aloja los modelos de TTS. Descarga solo lo de este mapa directamente de Steam (${mb} MB que faltan, una sola vez).`,
    cargando: (pct, mb) => `Descargando los modelos y texturas de TTS… ${pct} % de ${mb} MB`,
    falloDescarga: n => `${n === 1 ? 'Falló 1 descarga' : `Fallaron ${n} descargas`} de Steam: se muestran bloques en su lugar. Revisa la conexión o algún bloqueador de anuncios o contenido en cdn.steamusercontent.com.`,
    reintentar: 'Reintentar',
    sin3d: 'Las bibliotecas 3D no cargaron aquí: se usa el mapa 2D.',
  },

  anillos: {
    titulo: 'Estilos de anillo de peana para probar: para los agentes apostados y para el activo (seleccionado o en plena activación)',
    apostado: 'Apostado',
    activo: 'Activo',
  },

  amenazas: {
    titulo: 'Mientras arrastras: hasta dónde podrían llegar a tu miniatura los enemigos que aún no se han activado',
    nombre: 'Amenazas',
    estilo: 'Estilo',
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
    nueva: 'Nueva partida',
    nuevaTitulo: 'Vuelve a las pantallas de inicio: modo, zona de aniquilación, comandos y despliegue',
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
    avanzado: 'Avanzado',
    importar: 'Importar de Tabletop Simulator',
  },

  zona: {
    version: 'versión 28 · arrastre táctil corregido',
    versionTitulo: 'Qué versión de la app es esta',
    importar: 'Importar mapa de TTS…',
    importarTitulo: 'Abre una partida guardada de Tabletop Simulator (.json) o un WorkshopUpload (BSON) con un mapa de Gallowdark',
  },

  // ficha del agente seleccionado (panel Agente)
  ficha: {
    vacia: 'Nada seleccionado.',
    apuntar: 'Apuntar',
    usado: G.usado.es,
    lesionado: G.lesionado.es,
    aturdido: 'aturdido',
    quemarMente: 'quemar mente',
    terrotoxinas: 'terrotoxinas',
    stat: { lpa: G.lpa.abrev, mov: 'Mov.', salv: 'Salv.', heridas: G.heridas.es, pa: `${G.pa.abrev} libres`, movs: 'Movs.' },
    dosMovimientos: (prim, carga, sec) => `Dos movimientos por activación: ① ${prim}${carga ? ` (o ${carga})` : ''} y ② ${sec}`,
    menosHerida: '−1 H',
    menosHeridaTitulo: 'Recibe 1 de daño (queda en el registro)',
    masHerida: '+1 H',
    masHeridaTitulo: 'Recupera 1 herida (queda en el registro)',
    terminar: 'Terminar activación',
    apuntarBoton: 'Apuntar ⌖',
    disparar: `${G.disparar.es} 1 ${G.pa.abrev}`,
    combatir: `${G.combatir.es} 1 ${G.pa.abrev}`,
    movTitulo: (pulgadas, trepa) => `1 ${G.pa.abrev} · mueve hasta ${pulg(pulgadas)} · ${trepa ? 'puede trepar' : 'no puede trepar'}`,
    cargaTitulo: pulgadas => `1 ${G.pa.abrev} · mueve hasta ${pulg(pulgadas)}; debe terminar en la ${G.zonaControl.es} de un enemigo`,
    cargaRestringida: `No puedes ${G.cargar.es} en una activación en la que ya te moviste`,
    retrocederTitulo: pulgadas => `2 ${G.pa.abrev} · mueve hasta ${pulg(pulgadas)}: puede salir de la ${G.zonaControl.es} de los enemigos, pero no terminar en ninguna`,
    reglas: reglas => reglas.map(traducirRegla).join(', '),
  },

  orden: {
    // 💀 trabarse (activo: dispara, carga, combate) · 🕵️ ocultarse (a salvo a cubierto)
    icono: { engage: '💀', conceal: '🕵️' },
    nombre: { engage: G.trabarse.es, conceal: G.ocultarse.es },
    // el botón muestra la orden actual y qué hará al tocarlo
    boton: orden => `<span class="oico">${T.orden.icono[orden]}</span><b>${T.orden.nombre[orden]}</b>` +
      `<small>cambiar a ${T.orden.icono[orden === 'conceal' ? 'engage' : 'conceal']} ${T.orden.nombre[orden === 'conceal' ? 'engage' : 'conceal'].toLowerCase()}</small>`,
    botonFijo: orden => `<span class="oico">${T.orden.icono[orden]}</span><b>${T.orden.nombre[orden]}</b><small>orden fijada</small>`,
    titulo: orden => `Orden actual: ${T.orden.nombre[orden].toLowerCase()}. Tócalo para cambiarla a ${T.orden.nombre[orden === 'conceal' ? 'engage' : 'conceal'].toLowerCase()}. Se elige al empezar la activación: puedes cambiarla hasta que el agente haga su primera acción.`,
    fijada: 'La orden se elige al empezar la activación: este agente ya hizo una acción, así que su orden queda fijada hasta su próxima activación. Si te equivocaste, deshaz su última acción (doble toque en Reposicionarse/Correr o Deshacer) y vuelve a elegirla.',
    eligeAntes: n => `${n} tiene orden de ocultarse 🕵️: con ella no puede disparar ni cargar. Si quieres hacerlo, cámbiala a 💀 trabarse ANTES de moverlo; después de su primera acción queda fijada.`,
    log: (n, orden) => `<b>${n}</b> pasa a orden de ${orden === 'conceal' ? 'ocultarse 🕵️' : 'trabarse 💀'}.`,
    ayuda: (n, orden) => (orden === 'conceal'
      ? `${n} tiene ahora orden de ocultarse 🕵️: a salvo a cubierto, pero no puede ${G.disparar.es} ni ${G.cargar.es}.`
      : `${n} tiene ahora orden de trabarse 💀: puede ${G.disparar.es}, ${G.cargar.es} y combatir.`) +
      ' Puedes volver a cambiarla mientras no haga ninguna acción.',
    pasaATrabarse: n => `<b>${n}</b> pasa a orden de trabarse 💀 para cargar.`,
  },

  // movimiento: botones, etiqueta del arrastre, pistas y registro
  mover: {
    nombre: { reposition: G.reposicionarse.es, dash: G.correr.es, charge: G.cargar.es, fallBack: G.retroceder.es },
    volarTitulo: `Volar (Vuelo inmaterial): el próximo ${G.reposicionarse.es.toLowerCase()} o ${G.cargar.es.toLowerCase()} va en línea recta, sin importar el terreno. Una vez por punto de inflexión.`,
    vueloPista: m => `Vuelo inmaterial: arrastra al agente; vuela en línea recta hasta ${pulg(m)}, sin importar el terreno. Toca 🪽 otra vez para cancelar.`,
    vueloCancelado: 'Vuelo cancelado: se mueve caminando.',
    vuela: n => `<b>${n}</b> vuela (Vuelo inmaterial).`,
    verbo: { reposition: G.reposicionarse.verbo, dash: G.correr.verbo, charge: G.cargar.verbo, fallBack: G.retroceder.verbo },
    motivo: {
      occupied: 'ocupado',
      blocked: 'bloqueado',
      chargeNoFoe: `una carga debe terminar en la ${G.zonaControl.es} de un enemigo`,
      engagedAfterMove: `${G.zonaControl.es} enemiga: no puedes ${G.cargar.es} después de moverte`,
      fallBackEnZona: `al ${G.retroceder.es.toLowerCase()} no puede terminar en la ${G.zonaControl.es} de un enemigo`,
      vueloNoPuede: `ahora no puede ${G.reposicionarse.es.toLowerCase()} ni ${G.cargar.es.toLowerCase()}`,
      vueloLejos: 'volando no llega tan lejos (como mucho su Movimiento)',
      vueloMuro: 'no puede volar a través de un muro',
      libreEnZona: `no puede terminar en la ${G.zonaControl.es} de un enemigo`,
      libreCerca: 'debe quedar a más de 3″ de los enemigos',
      escaladaMax: 'este agente no puede escalar más de 2″ en una misma acción (Inmenso)',
      vueloEnZona: `volando sin ${G.cargar.es.toLowerCase()} no puede terminar en la ${G.zonaControl.es} de un enemigo`,
    },
    bloqueado: 'bloqueado',
    // etiqueta junto al fantasma mientras arrastras
    etiqueta: (tipo, recorrido, permitido) => `${T.mover.nombre[tipo]} ${pulg(recorrido)} / ${pulg(permitido)}`,
    etiquetaDoble: (t1, a1, t2, a2, max2) => `${T.mover.nombre[t1]} ${pulg(a1)} + ${T.mover.nombre[t2]} ${pulg(a2)}/${pulg(max2)}`,
    alPiso: (z, nivel) => ` ▲${pulg(z)} ${nivel}`,
    aLaMesa: ' ▼ mesa',
    parcial: ' (lo más cerca posible)',
    maximo: ' (máx.)',
    contra: nombres => ` → ${nombres.join(', ')}`,
    // tramos de trepar sobre el mapa 2D
    tramoSube: up => `▲${pulg(up)} al piso superior`,
    tramoBaja: (caida, cuenta) => `▼ bajada de ${pulg(caida)} (cuentan ${pulg(cuenta)})`,
    tramoCruza: (up, down) => `▲${pulg(up)} sube ▼${pulg(down)} baja`,
    tramoTotal: (costo, espera) => ` + cruce = ${pulg(costo)}${espera ? ` (incl. ${pulg(espera)} de espera)` : ''}`,
    // registro
    trepaSube: (h, nivel, up) => `trepando ${pulg(h)} al piso superior de ${nivel} (${pulg(up)})`,
    trepaBaja: (h, nivel, down) => `bajando ${pulg(h)} de ${nivel} (cuentan ${pulg(down)})`,
    trepaCruza: (h, up, down) => `trepando ${pulg(h)} de terreno (${pulg(up)} de subida, ${pulg(down)} de bajada)`,
    incluye: partes => `, incluye ${partes.join(', luego ')}`,
    repetida: ' <span class="crit">— acción de movimiento repetida; lo deciden los jugadores</span>',
    log: (n, tipo, recorrido, permitido, notas) => `<b>${n}</b> ${T.mover.verbo[tipo]} ${pulg(recorrido)} (${pulg(permitido)} permitidas)${notas}.`,
    logDoble: (n, t1, a1, t2, a2, notas) => `<b>${n}</b> ${T.mover.verbo[t1]} ${pulg(a1)} y luego ${T.mover.verbo[t2]} ${pulg(a2)} (2 ${G.pa.abrev})${notas}.`,
    enZona: (n, enemigos) => `${n} queda en la ${G.zonaControl.es} de ${enemigos.join(', ')}.`,
    // pistas
    sinLlegada: motivo => `No puedes terminar ahí: ${motivo}. Movimiento cancelado.`,
    sinLlegadaBloqueado: 'No puedes terminar ahí: está bloqueado o no se alcanza. Movimiento cancelado.',
    cargo: (n, enemigos) => `${n} cargó contra ${enemigos.join(', ')}: ¡a ${G.combatir.es}!`,
    quedaMov2: (n, pulgadas) => `${n}: aún le queda el movimiento ②; arrastra de nuevo para ${G.correr.es} ${pulg(pulgadas)}.`,
    quedaMov1: (n, pulgadas) => `${n}: aún le queda el movimiento ①; arrastra de nuevo para ${G.reposicionarse.es} ${pulg(pulgadas)}.`,
    ambosUsados: n => `${n}: ya usó los dos movimientos de esta activación.`,
    medida: inc => inc > 0 ? `medida en tramos de ${pulg(inc)}` : 'medida exacta',
    soltar: (n, tipo, medida, carga, shift) => `${n}: suelta para ${T.mover.nombre[tipo]}; ruta ${medida}.` +
      (carga ? ` Si terminas a ${pulg(carga)} o menos de un enemigo, se convierte en ${G.cargar.es}.` : '') +
      (shift ? ' Mantén Mayús para trepar a un piso superior.' : ''),
    deOtro: n => `${n} es del otro jugador.`,
    cancelado: 'Movimiento cancelado.',
    deshecho: accion => `${accion} deshecho: el agente vuelve a donde estaba y recupera el PA.`,
    noDeshacer: accion => `Solo se puede deshacer ${accion} si fue lo último que hizo el agente (sin otra acción después).`,
    yaUsado: accion => `Ya usaste ${accion} en esta activación: arrastrar de nuevo lo repetiría (lo deciden los jugadores).`,
    elegido: (accion, n, pulgadas) => `${accion} elegido: arrastra a ${n || 'un agente'} para moverlo (hasta ${pulg(pulgadas)}).`,
  },

  seleccion: {
    elegido: (n, ordenes) => `${n} seleccionado: arrástralo para moverlo o toca Apuntar para ver la línea de visión${ordenes ? '; tócalo dos veces para cambiar su orden' : ''}.`,
    apuntando: 'Toca un agente enemigo para evaluar la línea de visión.',
    evaluado: `El panel Veredicto explica la decisión. ${G.disparar.es} si te convencen las probabilidades.`,
  },

  // tipos de disparo (clave = kind del motor, src/engine/shots.js)
  disparo: {
    tipo: {
      clear: 'Disparo limpio', cover: G.aCubierto.es[0].toUpperCase() + G.aCubierto.es.slice(1), obscured: 'Ofuscado',
      concealed: 'No es blanco válido (ocultarse + cobertura)', engaged: 'No es blanco válido (en combate con un aliado)',
      hidden: 'No visible',
    },
    etiqueta: { clear: 'LIMPIO', cover: 'CUBIERTO', obscured: 'OFUSCADO', concealed: 'OCULTO', engaged: 'EN COMBATE', hidden: 'SIN LDV' },
    eligeBlanco: 'Primero toca Apuntar y luego al enemigo al que quieres disparar.',
    // por qué EL TIRADOR no puede disparar (no el blanco)
    noPuede: { conceal: 'el tirador tiene orden de ocultarse 🕵️ (para disparar necesita orden de trabarse 💀, que se elige al empezar su activación)',
      engaged: n => `el tirador está en la ${G.zonaControl.es} de ${n}` },
    // motivo corto, para la lista de blancos y el registro
    porque: {
      clear: 'sin cobertura ni ofuscación',
      coverVantage: id => `con orden de ocultarse tras ${id}, visto desde terreno aventajado`,
      cover: (id, rango, certera) => `${id} a ${pulg(rango)} o menos de él${certera ? `; Certera ${certera} desde terreno aventajado` : ''}`,
      obscured: (id, cubre) => `terreno pesado ${id} en medio${cubre ? `; además a cubierto (${cubre})` : ''}`,
      concealed: id => `tiene orden de ocultarse 🕵️ y está a cubierto (${id})`,
      engaged: n => `en combate con ${n}`,
      hidden: 'todas las líneas están bloqueadas por muros o terreno pesado',
    },
    sinBlanco: 'sin blanco',
    armaDeCombate: `El arma seleccionada es de combate: usa ${G.combatir.es}.`,
    noPuedeLog: (n, motivo) => `<b>${n}</b> no puede ${G.disparar.es}: ${motivo}.`,
    noValido: (n, motivo) => `<b>${n}</b> no es un ${G.blancoValido.es}: ${motivo}.`,
    yaNo: n => `El disparo de <b>${n}</b> ya no es posible: no se tira.`,
    aunNo: motivo => `Aún no puedes disparar: ${motivo}.`,
    tiradaAtq: n => `${n} dispara`,
    tiradaDef: (n, cobertura) => `${n} salva${cobertura ? ' (+cobertura)' : ''}`,
    log: (a, b, arma, atq, def, cobertura, dano, notas) =>
      `<b>${a}</b> dispara a <b>${b}</b> con ${arma} — <span class="dice">atq [${atq}] def [${def}${cobertura ? ' +cobertura' : ''}]</span> → ` +
      `<b>${dano} de daño</b>${notas.length ? ` <span class='dice'>(${notas.map(T.disparo.nota).join('; ')})</span>` : ''}`,
    // notas que devuelve el motor (src/engine/dice.js): textos o códigos "regla:valor"
    nota: s => {
      if (/^Accurate (\d+)$/.test(s)) return s.replace(/^Accurate/, 'Certera');
      const [k, v] = String(s).split(':');
      return ({
        obscured: 'ofuscado: los críticos pasan a normales y se descarta un éxito',
        'cover save banked': 'salvación por cobertura guardada',
        severe: 'Severa: un normal pasa a crítico', punishing: 'Castigadora: un fallo pasa a normal',
        rending: 'Desgarradora: un normal pasa a crítico', relentless: 'Implacable: repite los fallos',
        ceaseless: 'Incesante: repite un resultado fallado', balanced: 'Equilibrada: repite un fallo',
        saturate: 'Saturación: sin salvación por cobertura',
        devastating: `Devastadora: ${v} de daño inmediato`, piercing: `Penetración: ${v} ${v === '1' ? 'dado' : 'dados'} de defensa menos`,
        hot: `Sobrecalentamiento: ${v} de daño al tirador`,
      })[k] || s;
    },
    fueraDeAlcance: (n, arma, alc, dist) => `<b>${n}</b> está fuera del alcance de ${arma}: ${pulg(dist)} (Alcance ${pulg(alc)}).`,
    agotada: arma => `${arma} ya no se puede usar: su regla Limitada no le deja más usos en esta batalla.`,
    sobrecalentado: (n, d) => ` — <b>${n}</b> se sobrecalienta: ${d} de daño`,
    secundarios: (tipo, nombres) => `${tipo === 'area' ? 'Área' : 'Ráfaga'}: el disparo también alcanza a ${nombres.join(', ')}.`,
    secundario: '↳',
    devArea: (dmg, d, nombres) => ` — Devastadora a ${pulg(d)}: ${dmg} de daño también a ${nombres.join(', ')}`,
    cae: ' (cae)',
    aturdido: n => ` — <b>${n}</b> queda aturdido: 1 LPA menos hasta el final de su siguiente activación`,
    recuperaLPA: n => `<b>${n}</b> ya no está aturdido: recupera su LPA.`,
    quemaMente: n => ` — <b>${n}</b> recibe una ficha de Quemar mente: Impactar 1 peor hasta el final de su siguiente activación`,
    sinQuemarMente: n => `<b>${n}</b> pierde su ficha de Quemar mente.`,
    terrotoxinas: n => ` — <b>${n}</b> recibe una ficha de Terrotoxinas: cada vez que se active recibirá 1D3 de daño`,
    veneno: (n, d) => `☠ Veneno de terrotoxinas: <b>${n}</b> se activa y recibe ${d} de daño.`,
  },

  combate: {
    eligeBlanco: 'Primero toca Apuntar y luego al enemigo con el que quieres combatir.',
    fueraDeZona: rango => `El blanco no está en la ${G.zonaControl.es} (${pulg(rango)}).`,
    yaNo: n => `El combate de <b>${n}</b> ya no es posible: no se tira.`,
    aunNo: motivo => `Aún no puedes combatir: ${motivo}.`,
    tiradaAtq: n => `${n} combate`,
    tiradaDef: n => `${n} contraataca`,
    log: (a, b, dadosA, dadosB, hA, hB) =>
      `<b>${a}</b> combate contra <b>${b}</b> — <span class="dice">${a} [${dadosA}] vs ${b} [${dadosB}]</span> → ${a} ${hA} H, ${b} ${hB} H`,
    cae: n => ` — <b>¡${n} cae!</b>`,
  },

  heridas: {
    log: (n, h, max, dano) => `[${h}/${max}] <b>${n}</b> ${dano ? 'recibió daño' : 'se recuperó'}`,
    incapacitado: ' — <b>¡incapacitado!</b>',
    lesionado: ` — ${G.lesionado.es}`,
  },

  activacion: {
    termina: n => `<b>${n}</b> termina su activación.`,
    deshecha: (n, volvio) => `Se deshizo la activación de <b>${n}</b>${volvio ? '; vuelve a donde empezó' : ''} y queda apostado de nuevo.`,
    sinEspacio: n => `No hay espacio para devolver a <b>${n}</b> a donde estaba: despeja el lugar primero.`,
    fuera: n => `<b>${n}</b> queda incapacitado y sale de la mesa.`,
    vuelve: (n, h, movido) => `<b>${n}</b> vuelve a la mesa (${h} H)${movido ? '; se movió a un lado porque su lugar estaba ocupado' : ''}.`,
  },

  deshacer: {
    nada: 'No hay nada que deshacer.',
    nadaEnLinea: 'No hay nada que deshacer. En línea, una tirada compartida no se puede deshacer.',
    hecho: 'Se deshizo la última acción.',
  },

  blancos: {
    ayuda: 'Selecciona o arrastra un agente para ver a qué puede disparar.',
    sinLlegada: 'No hay dónde terminar el movimiento: no hay disparos que mostrar.',
    cabecera: (n, llegada, validos, total) => `${n}${llegada ? ' en el punto de llegada' : ''} · <b>${validos}</b> ${validos === 1 ? G.blancoValido.es : G.blancoValido.plural} de ${total}`,
    noPuede: motivo => ` · <b>no puede ${G.disparar.es}</b>: ${motivo}`,
  },

  veredicto: {
    ayuda: 'Selecciona un agente, toca Apuntar y luego toca un enemigo.',
    grande: {
      engaged: 'NO ES BLANCO VÁLIDO: EN COMBATE', hidden: 'NO VISIBLE', obscured: 'VÁLIDO: OFUSCADO',
      concealed: 'NO ES BLANCO VÁLIDO', cover: 'VÁLIDO: A CUBIERTO', clear: 'BLANCO VÁLIDO',
    },
    aliadoCerca: (n, rango) => `el aliado ${n} está a ${pulg(rango)} o menos de él`,
    sinLinea: 'no hay línea de visión despejada: el terreno la bloquea',
    ofuscado: (id, desdeTirador, desdeBlanco) => `el terreno pesado ${id} cruza una línea de cobertura a más de ${pulg(desdeTirador)} del tirador y ${pulg(desdeBlanco)} del blanco → se descarta un éxito y los críticos cuentan como normales`,
    tambienCubierto: (id, aventajado) => `además a cubierto tras ${id}${aventajado ? ' (orden de ocultarse, visto desde terreno aventajado)' : ''} → salvación por cobertura`,
    oculto: (id, pesado) => `el blanco tiene orden de ocultarse 🕵️ y está a cubierto tras ${id}${pesado ? ' (pesado)' : ''}: un agente oculto solo es blanco válido si no está a cubierto`,
    cubiertoAventajado: id => `orden de ocultarse, pero el disparo baja desde terreno aventajado por encima de la cobertura ligera (${id}) → salvación por cobertura`,
    cubierto: (id, rango) => `${id} se interpone a ${pulg(rango)} o menos del blanco → salvación por cobertura`,
    limpio: 'disparo limpio: sin cobertura ni ofuscación',
    certera: n => `desde terreno aventajado: Certera ${n}`,
    ocultoSinCobertura: 'el blanco tiene orden de ocultarse 🕵️ pero no está a cubierto: sí es un blanco válido',
    muyCerca: rango => `a ${pulg(rango)} o menos: sin cobertura ni ofuscación`,
    distancia: d => `distancia ${num(Math.max(0, d))}″ entre peanas`,
    buscadora: arma => `${arma} es Buscadora: el blanco oculto no puede usar el terreno para estar a cubierto, así que sí puedes dispararle (conserva su salvación por cobertura)`,
    fueraAlcance: (arma, alc) => `⚠ fuera del alcance de ${arma} (Alcance ${pulg(alc)})`,
    noPuede: (n, motivo) => `<b>${n} no puede ${G.disparar.es}</b>: ${motivo}`,
  },

  // tooltips y rótulos del mapa 2D
  terreno: {
    trepar: (up, down, acciones) => `${pulg(up)} de subida + ${pulg(down)} de bajada + lo que cruza (solo ${acciones.join('/')})`,
    zonaDescenso: equipo => `ZONA DE DESCENSO ${equipo.toUpperCase()}`,
    escalon: 'Escalón de tiro · plataforma de terreno aventajado (insignificante, expuesta): no bloquea el movimiento ni la visión',
    escotilla: 'Marco de escotilla · la abertura entre los tramos es un punto de acceso abierto',
    mampara: z => `Mampara · ${pulg(z)} de alto · bloquea la visión y el movimiento · demasiado alta para trepar`,
    muro: (z, trepar) => `Muro de ruina · ${pulg(z)} de alto · bloquea la visión · trepar: ${trepar}`,
    pesado: (z, trepar) => `Terreno pesado · ${pulg(z)} de alto · bloquea la visión, ofusca a distancia, da cobertura · trepar: ${trepar}`,
    ligero: (z, trepar) => `Terreno ligero · ${pulg(z)} de alto · da cobertura, no bloquea la visión · trepar: ${trepar}`,
    pisoSuperior: acciones => `Piso superior · debajo hay suelo libre y los agentes pueden trepar a él (${acciones}: la altura, ` +
      'mínimo 2″; bajar es gratis hasta 2″ por acción). Mantén Mayús al arrastrar para apuntar al piso, o señálalo en la mesa 3D. ' +
      'Arriba es terreno aventajado; la visión se sigue evaluando sobre el plano de la mesa.',
    objetivo: lpa => `${lpa} ${G.lpa.abrev}`,
  },

  // fase de estrategia de cada punto de inflexión (src/ui/inicio.js, src/game/fases.js)
  estrategia: {
    titulo: tp => `${G.puntoInflexion.es[0].toUpperCase() + G.puntoInflexion.es.slice(1)} ${tp}`,
    iniTitulo: 'Iniciativa',
    iniSoloSub: 'En solitario eliges tú. Quien tiene la iniciativa activa primero a sus agentes y elige primero sus ardides.',
    iniOpDesc: 'Tiene la iniciativa en este punto de inflexión',
    tirarSub: 'Cada jugador tira 1D6: quien saque más decide quién tiene la iniciativa.',
    tirar: 'Tirar los dados',
    empate: 'Empate: vuelvan a tirar.',
    decide: equipo => `Decide ${equipo}: ¿quién tiene la iniciativa?`,
    esperaDecision: equipo => `Decide ${equipo}. Espera su elección.`,
    logIni: (equipo, g0, g1, e0, e1) => `<b>Iniciativa: ${equipo}.</b> ${PM}: +${g0} ${e0}, +${g1} ${e1}.`,
    logDados: (e0, d0, e1, d1) => `Tirada de iniciativa: ${e0} ${d0}, ${e1} ${d1}.`,
    ardidesTitulo: 'Ardides de estrategia',
    ardidesSub: (equipo, pm) => `${equipo} tiene ${pm} ${PM}. Cada ardid cuesta 1 ${PM} y se usa una vez por punto de inflexión; su efecto dura todo el punto de inflexión.`,
    esperaArdides: equipo => `Turno de ${equipo}: espera a que elija sus ardides.`,
    sinArdides: 'Este bando no tiene comando elegido: no hay ardides que mostrar.',
    ardidCoste: `Usar por 1 ${PM}`,
    ardidUsado: `Usado (−1 ${PM}) · toca para devolverlo`,
    logArdid: (equipo, n) => `<b>${equipo}</b> usa el ardid <b>${n}</b> (−1 ${PM}).`,
    logDevuelto: (equipo, n) => `<b>${equipo}</b> devuelve el ardid <b>${n}</b> (+1 ${PM}).`,
    siguiente: equipo => `Listo · turno de ${equipo}`,
    aTiroteo: 'Listo · a la fase de tiroteo',
    tiroteo: equipo => `Fase de tiroteo: empieza ${equipo}, que tiene la iniciativa. Activa a un agente.`,
    tiroteoTitulo: 'Ardides de tiroteo',
    tiroteoSub: (equipo, pm) => `${equipo} tiene ${pm} ${PM}. Úsalos en el momento que indica la ficha del comando; cada uno cuesta 1 ${PM} y se usa una vez por punto de inflexión. Por ahora solo descuentan los ${PM}: su efecto se aplica a mano.`,
    repeticionNota: `Repetición de mando (1 ${PM}) no está en la lista: se ofrece sola al tirar los dados, sin límite de usos.`,
    volverMesa: 'Volver a la mesa',
    verOtro: equipo => `Ver los de ${equipo}`,
    botonTiroteo: 'Ardides',
    botonTiroteoTitulo: 'Ardides de tiroteo de tu comando (1 PM, una vez por punto de inflexión)',
    logTiroteo: equipo => `<b>Fase de tiroteo.</b> Empieza ${equipo}.`,
  },

  // fin de la batalla (src/ui/inicio.js)
  fin: {
    titulo: 'Fin de la batalla',
    trasPI: tp => `Terminó el ${G.puntoInflexion.es} ${tp}.`,
    aniquilado: equipo => `Solo quedan agentes de ${equipo} en la mesa.`,
    logAniquilado: '<b>Un comando se quedó sin agentes: fin de la batalla.</b>',
    gana: (equipo, ia) => ia ? `Gana la computadora (${equipo})` : `Gana ${equipo}`,
    empate: 'Empate',
    computadora: 'computadora',
    enPie: (n, total) => `${n} de ${total} en pie`,
    bajas: n => `${n} ${n === 1 ? 'enemigo incapacitado' : 'enemigos incapacitados'}`,
    notaPV: `Los ${PV} se anotan a mano en la pestaña Misión, hasta que las misiones puntúen solas.`,
    nueva: 'Nueva partida',
    verMesa: 'Ver la mesa',
  },

  // pantallas de inicio de partida (src/ui/inicio.js)
  inicio: {
    atras: 'Volver',
    modoTitulo: '¿Cómo quieres jugar?',
    modoSub: 'Kill Team (2024) · Reglas breves',
    contraIA: 'Contra la computadora',
    contraIADesc: 'Tú llevas un comando y la IA (fácil) el rival. Explica cada jugada que hace.',
    rivalTituloIA: 'Elige el comando de la computadora',
    rivalSubIA: 'La IA lo despliega y lo activa por su cuenta.',
    solo: 'En solitario',
    soloDesc: 'Mueves los dos comandos en este dispositivo. Ideal para aprender las reglas.',
    linea: 'Con un amigo',
    lineaDesc: 'En línea: creas la partida y le envías un enlace.',
    aprender: 'Aprender a jugar',
    aprenderDesc: 'Lecciones cortas: mover, cobertura, disparar y combatir.',
    pronto: 'Próximamente',
    mapaTitulo: 'Elige la zona de aniquilación',
    mapaSub: 'El tablero de 30″ × 22″ y su terreno.',
    comandoTitulo: 'Elige tu comando',
    comandoSub: 'Los agentes que vas a llevar a la batalla.',
    rivalTitulo: 'Elige el comando rival',
    rivalSub: 'También los mueves tú.',
    rivalSubLinea: 'Tu amigo podrá cambiarlo desde la pestaña Partida.',
    // la descripción de cada comando (por su id) y cuántos agentes lleva
    comandoTexto: {
      '3352828814': 'Asesinos sigilosos de los Night Lords: siembran el miedo y golpean desde las sombras.',
      '3348897103': 'Hechiceros de Tzeentch con Marines de Rúbrica y Tzaangor: poder psíquico y mucho aguante.',
      '2272196183': 'Marines Espaciales versátiles: disparan o combaten dos veces y adaptan su doctrina.',
      '3272457903': 'Comando casero de los Seraphon: Saurios y Kroxigor al frente, con Eslizones de apoyo.',
    },
    comandoAgentes: n => `${n} ${n === 1 ? 'agente' : 'agentes'}`,
    comandoDesc: (id, n) => `${T.inicio.comandoTexto[id] || ''} · ${T.inicio.comandoAgentes(n)}`,
    fichasSimples: 'Fichas simples',
    fichasSimplesDesc: 'Sin modelos 3D: fichas de colores. Carga más rápido.',
    configTitulo: 'Elige la configuración de tu comando',
    configTituloRival: 'Elige la configuración del rival',
    propia: 'Elige tú mismo',
    propiaDesc: n => `Arma el comando agente por agente (${n} selecciones) y mira la ficha de cada uno.`,
    armarTitulo: 'Arma tu comando',
    cuenta: (n, max) => `${num(n)} de ${max} selecciones`,
    ningunoAun: 'Aún no elegiste ningún agente: añádelos desde la lista.',
    disponibles: 'Agentes disponibles',
    statsCortas: (mov, lpa, salv, h) => `${pulg(mov)} · LPA ${lpa} · ${salv}+ · ${h} H`,
    verFicha: n => `Ver la ficha de ${n}`,
    anadir: n => `Añadir ${n}`,
    quitar: n => `Quitar ${n}`,
    medioTitulo: 'Cuenta como media selección',
    dobleTitulo: 'Cuenta como dos selecciones',
    soloUno: 'solo uno por comando',
    yaHayLider: 'ya elegiste el líder',
    alMaximo: (plural, max) => `ya tienes el máximo (${max} ${plural.toLowerCase()})`,
    reglasTitulo: 'Reglas del comando',
    reglas: {
      selecciones: n => `${n} selecciones en total.`,
      requiere: nombre => `Al menos un ${nombre}.`,
      unoSolo: nombre => `Exactamente un ${nombre.toLowerCase()} (elige uno de los marcados como ${nombre.toLowerCase()}).`,
      unicos: 'Cada agente solo una vez, salvo los combatientes.',
      medio: 'Los marcados con ½ cuentan como media selección: dos de ellos ocupan una.',
      doble: 'Los marcados con ×2 cuentan como dos selecciones.',
      maximoGrupo: (plural, max) => `Como máximo ${max} ${plural.toLowerCase()}.`,
    },
    error: {
      faltan: n => n === 0.5 ? 'Falta media selección.' : `${n === 1 ? 'Falta' : 'Faltan'} ${num(n)} ${n === 1 ? 'selección' : 'selecciones'}.`,
      sobran: n => n === 0.5 ? 'Sobra media selección.' : `${n === 1 ? 'Sobra' : 'Sobran'} ${num(n)} ${n === 1 ? 'selección' : 'selecciones'}.`,
      requiere: nombre => `Necesitas al menos un ${nombre}.`,
      repetido: nombre => `${nombre} solo puede ir una vez.`,
      maximo: (nombre, max) => `Solo puede haber ${max === 1 ? 'un' : max} ${nombre.toLowerCase()}${max === 1 ? '' : 'es'}.`,
    },
    listoArmar: (n, ok) => ok ? `Listo · ${n} ${n === 1 ? 'agente' : 'agentes'}` : 'Completa el comando',
    despliegueTitulo: '¿Cómo se despliega?',
    despliegueSub: 'Antes del primer punto de inflexión.',
    turnos: 'Por turnos',
    turnosDesc: 'Como en las reglas: los jugadores colocan a sus agentes uno a uno en su zona de descenso.',
    azar: 'Al azar',
    azarDesc: 'Los agentes aparecen repartidos por la mesa para empezar ya.',
    resumenTitulo: 'Todo listo',
    rModo: 'Modo', rMapa: 'Zona', rComando: 'Tu comando', rRival: 'Rival', rDespliegue: 'Despliegue',
    jugar: '¡A jugar!',
    listoTitulo: 'Todo desplegado',
    listoSub: 'Revisa tu despliegue. Al continuar empieza el punto de inflexión 1.',
    opcionales: 'Pasos opcionales antes de la batalla',
    equipoT: 'Equipo',
    equipoD: 'Elige el equipo de facción de cada comando: granadas, munición especial…',
    opsT: 'Operaciones',
    opsD: 'Elige la operación táctica de cada jugador y revisa la operación crítica de la misión.',
    empezar: 'Empezar el punto de inflexión 1',
    deshacerUltimo: 'Deshacer la última colocación',
    invitarTitulo: 'Invita a tu amigo',
    invitarSub: 'Envíale este enlace. Cuando lo abra, verá la misma mesa y moverá su comando.',
    copiar: 'Copiar enlace',
    copiado: '¡Enlace copiado!',
    irMesa: 'Ir a la mesa',
  },

  // Repetición de mando (ardid de tiroteo) y combate con decisiones (src/ui/tirada.js)
  repeticion: {
    ataque: 'Repetición de mando · ataque',
    defensa: 'Repetición de mando · defensa',
    combate: 'Repetición de mando · combate',
    explica: pm => `Puedes repetir uno de tus dados fallados por 1 ${PM} (tienes ${pm}). Toca el dado que quieres repetir.`,
    nombre: 'Repetición de mando',
    noUsar: 'No usar',
    noAvisar: 'No avisar hasta el próximo punto de inflexión',
    exitos: (c, dc, n, dn) => `${c} ${c === 1 ? 'crítico' : 'críticos'} (${dc} de daño) y ${n} ${n === 1 ? 'normal' : 'normales'} (${dn})`,
    ctxAtaque: (c, dc, n, dn, blanco, salv, cubierto) => [
      `Tus éxitos: ${T.repeticion.exitos(c, dc, n, dn)}.`,
      `${blanco} se defiende con 3 dados a ${salv}+${cubierto ? ', a cubierto (guarda 1 éxito sin tirarlo)' : ', sin cobertura'}.`],
    ctxDefensa: (atacante, c, dc, n, dn, dev, ahora, siN, siC) => [
      `${atacante} logró ${T.repeticion.exitos(c, dc, n, dn)}${dev ? `, más ${dev} de daño de Devastadora` : ''}.`,
      `Con tu defensa actual recibes ${ahora} de daño.`,
      siC === ahora ? 'Aunque saques un 6 recibirías lo mismo: repetir no sirve.'
        : siN === ahora ? `Solo un 6 cambia algo: recibirías ${siC}.`
        : `Si repites y sacas un éxito, recibirías ${siN} (con un 6: ${siC}).`],
    ctxCombate: (c, dc, n, dn, h, rival, rc, rdc, rn, rdn, rh) => [
      `Tus éxitos: ${T.repeticion.exitos(c, dc, n, dn)}. Te quedan ${h} heridas.`,
      `${rival}: ${T.repeticion.exitos(rc, rdc, rn, rdn)}. Le quedan ${rh} heridas.`],
    dadoAria: (v, ok) => `${v}${ok ? ', éxito' : ', fallo: repetir'}`,
    log: (equipo, antes, despues) => `<b>${equipo}</b> usa Repetición de mando (−1 ${PM}): repite un ${antes} y saca un ${despues}.`,
  },
  combateInt: {
    titulo: 'Combate',
    turno: n => `Turno de ${n}: elige qué hacer con uno de tus éxitos.`,
    exitos: (c, dc, n, dn) => `${c} ${c === 1 ? 'crítico' : 'críticos'} (${dc} daño) · ${n} ${n === 1 ? 'normal' : 'normales'} (${dn} daño)`,
    golpe: (con, d) => `💥 Golpear con un ${con === 'crit' ? 'crítico' : 'normal'} (${d} de daño)`,
    bloqueo: (con, contra) => {
      const uno = c => c === 'crit' ? 'crítico' : 'normal';
      const suyos = Array.isArray(contra)
        ? (contra[0] === contra[1] ? `sus 2 ${contra[0] === 'crit' ? 'críticos' : 'normales'}` : `su crítico y su normal`)
        : `su ${uno(contra)}`;
      return `🛡 Bloquear ${suyos} con tu ${uno(con)}${Array.isArray(contra) ? ' (Escudo)' : ''}`;
    },
    nota: 'Se turnan, empezando por el atacante. Un normal bloquea un normal; un crítico bloquea cualquiera (contra un arma Brutal solo se bloquea con críticos).',
  },

  // Reaccionar (src/ui/reaccion.js)
  reaccion: {
    boton: `${G.reaccionar.es}`,
    titulo: `Hace gratis una acción de 1 ${G.pa.abrev} (moviendo como mucho 2″). Una vez por punto de inflexión.`,
    pasar: 'Pasar',
    pista: equipo => `Turno de ${equipo}: todos sus agentes están usados. Puede ${G.reaccionar.es.toLowerCase()} con un agente con orden de trabarse (o un Astartes con cualquier orden: una acción gratis de 1 ${G.pa.abrev}) o pasar.`,
    empieza: n => `${n} reacciona: haz una acción de 1 ${G.pa.abrev} (moviendo como mucho 2″) y termina su activación.`,
    log: n => `<b>${n}</b> reacciona.`,
    ecos: n => `Ecos de la Disformidad: ${n} puede cambiar su orden y hacer dos acciones distintas de 1 ${G.pa.abrev} (una vez por batalla).`,
    pasa: equipo => `<b>${equipo}</b> pasa (no reacciona).`,
    iaDispara: b => `reacciona y dispara a ${b}.`,
  },

  // Qué hace cada ardid, con nuestras palabras (por su nombre oficial: src/i18n/nombres.js).
  // Los que no están aquí se muestran sin descripción.
  ardidDesc: {
    'Protección etérea': 'Si disparan a uno de tus agentes, las armas con Penetración 1 tienen en su lugar Penetración en críticos 1.',
    'El destino es mi arma': 'Tira 2D6 y guárdalos. En el tiroteo de este PI, puedes poner uno en lugar de un dado de ataque recién tirado (tuyo o del rival), uno por secuencia; no se puede repetir. Si sumaban menos de 9, al usar uno se descarta el otro.',
    'Hermandad de hechiceros': 'Las armas psíquicas de tus Hechiceros tienen Equilibrada, o Incesante si hay otro Hechicero amigo a 9″ o menos.',
    'Rebaño salvaje': 'Las armas de combate de tus Tzaangor tienen Certera 1; y también Severa si un amigo los asiste o combaten a 6″ o menos de un Hechicero amigo que los vea.',
    'Doctrina de combate': 'Elige una doctrina: tus agentes tienen Equilibrada al disparar a más de 6″ (devastadora), a 6″ o menos (táctica) o al combatir (asalto).',
    'Y no conocerán el miedo': 'Tus agentes lesionados no empeoran sus atributos ni los de sus armas.',
    'Tácticas flexibles': 'Cambia tu táctica de capítulo secundaria hasta el final del punto de inflexión. (Aún no tiene efecto en la app: faltan las tácticas de capítulo.)',
    'Ajustar doctrina': 'Durante la activación de un Ángel de la Muerte amigo, antes o después de una acción: si usaste Doctrina de combate este punto de inflexión, cambias la doctrina elegida.',
    'Fisiología transhumana': 'Cuando disparan a un Ángel de la Muerte amigo, al tirar la defensa: guardas uno de tus éxitos normales como éxito crítico.',
    'Asalto de choque': 'Cuando un Ángel de la Muerte amigo combate en una activación en la que Cargó, al empezar a resolver los dados de ataque: su arma de combate tiene Choque y el primer golpe de la secuencia hace 1 de daño más (hasta 7).',
    'Ira de venganza': 'Cuando un Ángel de la Muerte amigo reacciona: hace una acción de 1 PA más, gratis, distinta de la primera.',
    'Plan caprichoso': 'Al terminar la activación de un Hechicero amigo: hace una acción libre de Correr (aunque otra acción lo impidiera), o le cambias la orden.',
    'Cábala psíquica': 'Al activarse un Hechicero amigo: elige a otro Hechicero amigo a 9″ o menos y visible, y una de sus armas psíquicas a distancia. El primero la tiene hasta el final de su activación; el otro no puede usarla en este punto de inflexión.',
    'Rebaño mutante': 'Al activar un Tzaangor: elige a otro Tzaangor amigo apostado, a 2″ o menos y visible, para que se active a la vez. Sus acciones van una tras otra, en cualquier orden.',
    'Todo es polvo': 'Cuando un dado de ataque normal va a hacer daño a uno de tus Marines Rúbrica, ese dado hace 1 de daño menos.',
    'Indomitus': 'Si disparan a uno de tus agentes y sacas dos fallos o más en defensa, uno cuenta como éxito normal.',
    'Emboscada en la jungla': 'Si disparan a uno de tus Eslizones que está en cobertura, puedes conservar un dado de defensa más como éxito normal sin tirarlo (nunca más de 2 dados conservados en un disparo).',
    'Furia predadora': 'Las armas de combate de tus Saurios y Kroxigor que hayan Cargado en esa activación tienen Incesante.',
    'Escurridizos': 'Cuando termina un Disparo enemigo contra un Eslizón tuyo que no queda incapacitado, ese Eslizón se mueve hasta 2″ sin terminar en la zona de control de un enemigo.',
    'Formación Eterna': 'Una vez por punto de inflexión, un Eslizón tuyo a 6″ o menos de un Sacerdote tuyo puede recolocarse hasta 4″, a más de 3″ de los enemigos.',
    'Colmillo en la brecha': 'Cuando disparan a un Saurio o Kroxigor tuyo, conservas un dado de defensa como éxito crítico sin tirarlo (nunca más de 2 dados conservados en un disparo).',
    'Señor del Espacio y el Tiempo': 'Cuando un agente enemigo visible a 6″ o menos de un Sacerdote tuyo empieza su activación, su Movimiento baja 2″ hasta el final del punto de inflexión (nunca por debajo de 4″).',
  },
  // ventana de ardides de tiroteo (src/ui/tirada.js, ofrecerArdides; motor en src/game/disparadores.js)
  ventanaArdid: {
    titulo: 'Ardid de tiroteo disponible',
    pm: (equipo, pm, coste = 1) => `${equipo} tiene ${pm} ${PM}. Activarlo cuesta ${coste} ${PM}.`,
    activar: coste => `Activar (−${coste} PM)`,
    usar: 'Usar (sin coste)',
    pmEquipo: equipo => `${equipo}: regla de equipo de facción, no cuesta PM.`,
    noActivar: 'No activar',
    noAvisar: 'No avisar hasta el próximo punto de inflexión',
    nota: 'Si no lo activas ahora, el ardid sigue disponible; el botón «Ardides» de la barra sirve de respaldo.',
    log: (equipo, n, coste = 1) => `<b>${equipo}</b> usa el ardid <b>${n}</b> (−${coste} ${PM}).`,
    logEquipo: (equipo, n) => `<b>${equipo}</b> usa <b>${n}</b> (equipo de facción).`,
    todoPolvo: equipo => `${equipo}: Todo es polvo reduce en 1 el daño de ese dado.`,
  },
  // Reglas de facción de los Saurios de Lustria: Formación y Gran Plan (Asterismos); src/ui/saurios-plan.js
  saurios: {
    tituloAsterismo: 'Gran Plan: tu Asterismo',
    subAsterismo: 'El que elijas está activo desde el primer punto de inflexión. Los demás se activan solos, desde el 2.º punto de inflexión, cuando se cumple su condición.',
    tituloFormacion: 'Formación',
    subFormacion: a => `Asterismo: ${a}. Elige una Formación; vale toda la batalla.`,
    resumenPlan: s => `Gran Plan (${s === 0 ? 'tú' : 'rival'})`,
    resumenFormacion: s => `Formación (${s === 0 ? 'tú' : 'rival'})`,
    asterismo: {
      itzl: { nombre: 'Itzl · Hambre',
        desc: 'Las armas de combate de tus Saurios y Kroxigor tienen Desgarradora.',
        cond: 'Se activa si tu comando incapacitó a algún enemigo.' },
      quetzl: { nombre: 'Quetzl · Escudo',
        desc: 'En cada punto de inflexión, el primer éxito normal que daña a cada Saurio y Kroxigor tuyo en una acción de Combatir inflige 1 de daño menos.',
        cond: 'Se activa si no hay enemigos en tu zona de despliegue.' },
      sotek: { nombre: 'Sotek · Velocidad',
        desc: '+1″ al Movimiento de tus agentes.',
        cond: 'Se activa si tu líder o algún agente enemigo fue incapacitado, o si tu líder está en la zona de control de un enemigo.' },
      tepok: { nombre: 'Tepok · Sabiduría',
        desc: 'Las acciones de 1 PA de tus Sacerdotes llegan 3″ más lejos.',
        cond: 'Se activa si tienes un Sacerdote en juego y fuera de la zona de control enemiga.' },
    },
    formacion: {
      eterna: { nombre: 'Formación Eterna',
        desc: 'Una vez por punto de inflexión, un Eslizón tuyo a 6″ o menos de un Sacerdote tuyo puede recolocarse hasta 4″, y debe quedar a más de 3″ de los enemigos.' },
      garra: { nombre: 'Formación Garra Solar',
        desc: 'Cuando termina la activación de un Saurio o Kroxigor tuyo en la zona de control de un enemigo, tira 1D6: con 4+, inflige 1 de daño a un enemigo en su zona de control.' },
      acechadora: { nombre: 'Formación Acechadora',
        desc: 'Cuando un Eslizón tuyo termina una acción de Disparar y no está en la zona de control de un enemigo, puede Reposicionarse gratis hasta 2″.' },
    },
    activa: (equipo, nombre) => `Gran Plan: ${equipo} activa el Asterismo ${nombre}.`,
    inicial: (equipo, nombre, formacion) => `${equipo}: Gran Plan con el Asterismo ${nombre} y ${formacion}.`,
    quetzl: n => `Asterismo Quetzl: el primer éxito normal que daña a ${n} inflige 1 de daño menos.`,
    garra: (n, d, blanco) => d >= 4
      ? `Garra Solar: ${n} tira ${d} y le inflige 1 de daño a ${blanco}.`
      : `Garra Solar: ${n} tira ${d}; no pasa nada.`,
    lector: { titulo: 'Lector de estrellas', texto: n => `${n} puede activar un Asterismo sin cumplir su condición (una vez por batalla). Elige cuál.`,
      no: 'No usarlo ahora', log: (n, a) => `${n} lee las estrellas: se activa el Asterismo ${a}.` },
    eterna: { titulo: 'Formación Eterna', texto: 'Elige al Eslizón que se recoloca hasta 4″ (a más de 3″ de los enemigos).',
      log: (n, m) => `Formación Eterna: ${n} puede recolocarse hasta ${m}″.` },
    acechadora: { titulo: 'Formación Acechadora', texto: n => `${n} puede Reposicionarse gratis hasta 2″.`,
      si: 'Reposicionarse', no: 'No' },
    pista: (n, max, lejos) => `${n}: arrástralo hasta ${max}″${lejos ? `; debe quedar a más de ${lejos}″ de los enemigos` : ''}. Esc para omitirlo.`,
    recoloca: (n, d) => `${n} se recoloca ${d.toFixed(1)}″ (Formación).`,
    ficha: 'Gran Plan',
    fichaFormacion: 'Formación',
    fichaActivos: a => a.length ? `Asterismos activos: ${a.join(' · ')}` : 'Sin Asterismos activos',
  },
  // ardides y equipo de facción de los Saurios de Lustria (src/ui/ardides.js)
  ardidesSL: {
    puntas: n => `Puntas de obsidiana: el arma de ${n} tiene Letal 5+ en esta acción.`,
    escudoSaurio: n => `Escudos de piel de estegadón: la Salvación de ${n} es 3+ en este disparo.`,
    plumas: (n, c) => `Plumas incandescentes: ${n} recupera ${c} ${c === 1 ? 'herida' : 'heridas'}.`,
    idolo: s => `Ídolo de los Ancestrales: ${s} gana 1 PM más.`,
    espacio: n => `Señor del Espacio y el Tiempo: el Movimiento de ${n} baja 2″ hasta el final del punto de inflexión.`,
    colmillo: n => `Colmillo en la brecha: ${n} conserva un dado de defensa como éxito crítico.`,
  },
  // habilidades de combate de los Saurios de Lustria (src/ui/saurios-combate.js y src/engine/dice.js)
  combateSL: {
    semilla: (n, dado, ok) => `Semilla de renacimiento: ${n} iba a quedar incapacitado y tira 1D6: ${dado}. ${ok ? 'Se queda con 1 herida.' : 'No lo logra.'}`,
    semillaVeneno: (n, vivo) => `Semilla de renacimiento: ${n} ${vivo ? 'sobrevive con 1 herida.' : 'no se salva.'}`,
    mordisco: (n, b, dado, dmg) => `Mordisco: ${n} tira 1D6 contra ${b}: ${dado}. ${dmg ? 'Le inflige 1 de daño.' : 'No le hace daño.'}`,
    barrido: {
      titulo: 'Barrido del martillo',
      texto: n => `${n} incapacitó a un enemigo. Puede luchar de inmediato, sin gastar PA, contra otro enemigo en su zona de control (una vez por activación).`,
      no: 'No luchar más',
      log: (n, b) => `Barrido del martillo: ${n} lucha gratis contra ${b}.`,
    },
    ejemplo: {
      titulo: 'Ejemplo depredador',
      texto: (n, b) => `${n} acaba de luchar contra ${b}. Un Saurio amigo listo, a 3″ o menos y en la zona de control de ese enemigo, puede luchar ahora gratis (una vez por batalla). No cuenta como su activación y sigue listo.`,
      no: 'No usarlo',
      log: (n, s, b) => `Ejemplo depredador: ${s} lucha gratis contra ${b} (por ${n}).`,
    },
    guardian: {
      titulo: 'Guardián inquebrantable',
      texto: (g, e, amigo) => `${e} terminó una Carga en la zona de control de ${amigo}. ${g} puede Cargar gratis (hasta 3″) contra él, y debe terminar en su zona de control.`,
      si: 'Cargar',
      no: 'No reaccionar',
      log: (g, e) => `Guardián inquebrantable: ${g} Carga gratis contra ${e}.`,
      sinLugar: (g, e) => `Guardián inquebrantable: ${g} no encuentra dónde terminar a 3″ o menos en la zona de control de ${e}.`,
    },
    escurridizos: {
      titulo: 'Escurridizos',
      texto: n => `El Disparo terminó y ${n} sigue en pie. Puede moverse de inmediato hasta 2″, sin terminar en la zona de control de un enemigo.`,
      alejarse: 'Alejarse del tirador',
      alejarseDet: 'El punto más lejano del tirador a 2″ o menos.',
      acercarse: 'Moverse hacia el tirador',
      acercarseDet: 'El punto más cercano al tirador a 2″ o menos.',
      no: 'Quedarse donde está',
      log: (n, x, y) => `Escurridizos: ${n} se mueve hasta (${x.toFixed(1)}, ${y.toFixed(1)}).`,
      sinLugar: n => `Escurridizos: ${n} no encuentra un punto libre a 2″ o menos fuera de la zona de control enemiga.`,
    },
  },
  // ardides y equipo de facción de los Ángeles de la Muerte (src/ui/ardides.js)
  ardidesAM: {
    ajustar: { titulo: 'Ajustar doctrina', texto: d => `Tu doctrina de combate es ${d}. Elige la nueva.`, log: (n, d) => `${n}: la doctrina de combate pasa a ser ${d}.` },
    ira: n => `${n} reacciona con Ira de venganza: tiene una acción de 1 PA más, distinta de la primera.`,
    sellos: n => `Sellos de pureza: ${n} descarta un fallo y guarda otro como éxito normal.`,
    escudos: n => `Escudos decorativos: los dados del rival que combate con ${n} no pueden guardarse como críticos si son menores que 6.`,
    auspex: n => `Auspex: hasta el final de su activación, los enemigos a 8″ o menos de ${n} no pueden estar ofuscados.`,
  },
  // habilidades de ficha del Aquelarre Disforme (src/ui/ardides.js)
  habilidadesAD: {
    automata: n => `Autómata hechizado: ${n} no tiene un Hechicero a 9″ o menos y resta 1 a su LPA en esta activación.`,
  },
  // acciones únicas psíquicas de los Hechiceros (reglas en src/game/unicas.js)
  unicas: {
    acc: 'Acción única psíquica',
    cuerno: { nombre: 'Cuerno de la manada', desc: 'Suma 1″ al Movimiento de los Tzaangor amigos hasta el siguiente punto de inflexión.' },
    logCuerno: n => `${n} toca el cuerno: los Tzaangor amigos tienen +1″ de Movimiento hasta el siguiente punto de inflexión.`,
    sinObjetivos: 'No hay a quién dirigirla: falta un agente a distancia y visible.',
    motivo: {
      pendiente: 'Aún no está en la app: necesita marcadores en la mesa.',
      usado: 'Este agente ya terminó su activación.',
      sinPA: 'No le quedan PA.',
      enZonaDeControl: 'No puede hacerla en la zona de control de un enemigo.',
      vetada: 'Otro agente la tiene prestada por Cábala psíquica en este punto de inflexión.',
      yaEsePI: 'Tu comando ya la hizo en este punto de inflexión.',
    },
    proteccionDestino: { nombre: 'Protección del destino',
      desc: 'Psíquica. Elige un agente amigo visible. Hasta el inicio de la siguiente activación de este agente, quien dispare a ese agente verá cómo repites los dados de defensa que quieras.' },
    saboteaDestino: { nombre: 'Sabotear destino',
      desc: 'Psíquica. Elige un enemigo a 9″ o menos y visible. Hasta el inicio de la siguiente activación de este agente, cuando ese enemigo dispare, combata o contraataque, debe repetir los dados de ataque que saquen 6, y su LPA cuenta 1 menos para controlar un marcador.' },
    ritual: { nombre: 'Ritual de reconstitución',
      desc: 'Psíquica. Elige un agente amigo a 6″ o menos y visible: recupera hasta 2D3 heridas perdidas. Una vez por punto de inflexión para todo tu comando.' },
    prender: { nombre: 'Prender',
      desc: 'Psíquica. Elige un enemigo visible. Hasta el inicio de la siguiente activación de este agente, las armas de tus agentes tienen Incesante al disparar, combatir o contraatacar contra él.' },
    flujoTemporal: { nombre: 'Flujo temporal',
      desc: 'Psíquica. Coloca un marcador junto a un agente amigo a 6″ o menos; al final de su siguiente activación vuelve a aparecer junto al marcador. (Pendiente: faltan los marcadores en la mesa.)' },
    log: {
      proteccionDestino: (a, b) => `${a} protege a ${b}: repetirá sus dados de defensa fallados.`,
      saboteaDestino: (a, b) => `${a} sabotea a ${b}: repetirá sus dados de ataque que saquen 6.`,
      prender: (a, b) => `${a} prende a ${b}: las armas de su comando tienen Incesante contra él.`,
    },
    logRitual: (a, b, total, curadas) => `${a} hace el Ritual de reconstitución sobre ${b}: 2D3 = ${total}; recupera ${curadas} ${curadas === 1 ? 'herida' : 'heridas'}.`,
  },
  // acciones únicas y habilidades de los Sacerdotes de los Saurios de Lustria (src/ui/sacerdotes-sl.js, panels.js)
  unicasSL: {
    luzChotec: { nombre: 'Luz de Chotec',
      desc: 'Elige un Saurio o Kroxigor amigo visible a 6″ o menos: recupera 1D3 heridas perdidas. Una vez por punto de inflexión para todo tu comando.' },
    presagioCeleste: { nombre: 'Presagio celeste',
      desc: 'Elige un Eslizón amigo visible a 6″ o menos: sus armas a distancia tienen Equilibrada hasta el final de su siguiente activación.' },
    veloCeleste: { nombre: 'Velo celeste',
      desc: 'Elige un agente amigo visible a 6″ o menos. Hasta el inicio de la siguiente activación de este Sacerdote, cada vez que un enemigo le dispare, conserva un dado de defensa como éxito normal sin tirarlo (nunca más de 2 dados conservados en un disparo).' },
    log: {
      presagioCeleste: (a, b) => `${a} lee un presagio para ${b}: sus armas a distancia tienen Equilibrada hasta el final de su siguiente activación.`,
      veloCeleste: (a, b) => `${a} cubre a ${b} con un velo celeste: conservará un dado de defensa al recibir disparos.`,
    },
    logLuz: (a, b, total, curadas) => `${a} invoca la Luz de Chotec sobre ${b}: 1D3 = ${total}; recupera ${curadas} ${curadas === 1 ? 'herida' : 'heridas'}.`,
    estrellas: {
      titulo: 'Escudriñar las estrellas',
      texto: n => `${n} puede escudriñar las estrellas (una vez por batalla). ¿Lo haces ahora, al empezar este punto de inflexión?`,
      si: 'Sí, tirar los dados', no: 'No, esperar a otro punto de inflexión',
      tirada: (n, dados, exitos) => `${n} escudriña las estrellas: ${[].concat(dados).join(', ')} (4+ son éxito). ${exitos} ${exitos === 1 ? 'dado de defensa conservado' : 'dados de defensa conservados'}.`,
      quien: (k, n) => `Éxito ${k} de ${n}`,
      elige: 'Elige al agente amigo visible que conservará un dado de defensa como éxito normal la primera vez que le disparen en este punto de inflexión.',
      log: (n, b) => `${n} guarda un dado de defensa para ${b} (la primera vez que le disparen en este punto de inflexión).`,
    },
    tambores: {
      titulo: 'Tambores de guerra',
      texto: 'Tu comando puede tocar los Tambores de guerra (una vez por batalla): las acciones de Cargar de tus agentes llegan 1″ más lejos hasta el final de este punto de inflexión. ¿Los usas ahora?',
      si: 'Sí, tocar los tambores', no: 'No, esperar a otro punto de inflexión',
      log: n => `${n} toca los Tambores de guerra: +1″ a la distancia de Cargar hasta el final de este punto de inflexión.`,
    },
    emboscador: { lejos: `El Emboscador debe quedar a más de 6″ de la ${G.zonaDescenso.es} enemiga (o dentro de la tuya).`, log: (n, id) => `<b>${n}</b> (${id}) se despliega como Emboscador, con orden de ocultarse.` },
  },
  // ardides de tiroteo del Aquelarre Disforme (efectos en src/ui/ardides.js)
  ardidesAD: {
    tunicas: { log: n => `${n}: Túnicas arcanas cambia un daño crítico por daño normal.` },
    plan: { titulo: 'Plan caprichoso', texto: n => `${n} termina su activación: ¿qué haces?`,
      correr: 'Acción libre de Correr', correrDet: 'La activación sigue abierta: haz el movimiento y termínala.',
      orden: 'Cambiar su orden', ordenDet: 'Pasa de trabarse a ocultarse, o al revés.',
      logCorrer: n => `${n} puede hacer una acción libre de Correr.`, logOrden: n => `${n} cambia su orden.` },
    cabala: { titulo: 'Cábala psíquica', texto: n => `${n} empieza su activación. Elige a otro Hechicero (a 9″ o menos y visible) y el arma psíquica que le prestará.`,
      log: (n, otro, arma) => `${n} tiene ${arma} de ${otro} hasta el final de su activación; ${otro} no puede usarla en este punto de inflexión.` },
    rebano: { titulo: 'Rebaño mutante', texto: n => `${n} empieza su activación. Elige a otro Tzaangor apostado (a 2″ o menos y visible) para activarlo a la vez.`,
      log: (n, otro) => `${n} y ${otro} se activan al mismo tiempo: sus acciones van una tras otra, en cualquier orden.` },
  },
  // habilidades que preguntan al jugador (src/ui/ardides.js, habilidadesDe; ventana en tirada.js)
  habilidades: {
    general: { quien: n => `Habilidad de ${n}` },
    aura: {
      titulo: 'Aura de hierro',
      pregunta: (atacante, dano) => `${atacante} te va a infligir ${dano} de daño con un dado de ataque normal. ¿Quieres ignorar ese daño? Solo puedes hacerlo una vez por batalla.`,
      si: 'Sí, ignorar el daño',
      no: 'No, guardarla para después',
    },
  },
  // lista de unidades de la columna derecha (src/ui/lista.js)
  lista: {
    titulo: n => `Unidades de ${n}`,
    cambiarTitulo: 'Ver las unidades del otro bando',
    tocar: n => `Seleccionar a ${n}`,
    usado: 'usado',
    fuera: 'fuera de combate',
  },
  // la partida guardada, Reiniciar y Salir (src/ui/guardado.js, menú ⚙)
  guardado: {
    reiniciar: '↻ Reiniciar partida',
    reiniciarTitulo: 'Empieza otra vez con el mismo comando, mapa y configuración',
    salir: '⏏ Salir al menú principal',
    salirTitulo: 'Abandona esta partida y vuelve al menú principal',
    confirmarReiniciar: '¿Reiniciar la partida? Se pierde el avance y se empieza de nuevo con la misma configuración.',
    confirmarSalir: '¿Salir al menú principal? Se pierde la partida en curso.',
    reiniciada: '<b>Partida reiniciada</b> con la misma configuración.',
    restaurada: 'Se recuperó tu partida tal como la dejaste.',
  },
  // pantalla #/encuadres: elegir el encuadre del retrato 2D de cada miniatura (src/ui/encuadres.js)
  encuadres: {
    titulo: 'Encuadres de las fichas 2D',
    botonTitulo: 'Encuadres de las fichas 2D (solo en desarrollo)',
    cerrar: 'Cerrar',
    ayuda: 'Elige un agente de la lista. Arrastra para girar, usa la rueda (o pellizca) para acercar y arrastra con el botón derecho (o con dos dedos) para mover. Lo que quede dentro del círculo es lo que saldrá en la ficha. Se hace una sola vez por miniatura y se guarda en el archivo del proyecto, listo para commit. Si un agente puede repetirse en el comando (por ejemplo, dos Kroxigor), cada figura tiene su propio encuadre: aparecen como «Kroxigor · 1», «Kroxigor · 2»…',
    equipo: 'Comando',
    ejeTitulo: 'Subir o bajar el encuadre (el eje vertical), sin cambiar el zoom ni el giro',
    subir: 'Subir el encuadre',
    bajar: 'Bajar el encuadre',
    ejeXTitulo: 'Mover el encuadre a la izquierda o a la derecha (el eje horizontal), sin cambiar el zoom ni el giro',
    izquierda: 'Mover el encuadre a la izquierda',
    derecha: 'Mover el encuadre a la derecha',
    vistaArriba: 'La miniatura vista desde arriba, con la flecha de su frente',
    frente: 'Frente de la miniatura',
    frenteMenos: 'Girar el frente 15° a la izquierda',
    frenteMas: 'Girar el frente 15° a la derecha',
    frenteAuto: 'Detectar',
    frenteAutoTitulo: 'Probar con el frente que parece tener (por dónde pesan la mochila y la capa)',
    frenteAyuda: 'La flecha naranja sobre la peana marca hacia dónde mira la miniatura. Gírala hasta que apunte a su frente. Así, en la mesa 3D, la miniatura mira hacia donde apunta su línea de visión (su blanco, o el centro de la mesa), y el encuadre automático parte de ese lado.',
    frentePuesto: 'Frente girado (el encuadre no se movió). Se guarda con el botón "Guardar encuadre".',
    guardar: 'Guardar encuadre',
    auto: 'Encuadre automático',
    borrar: 'Borrar el guardado',
    siguiente: 'Siguiente ›',
    vistaFicha: 'Así se verá la ficha en el mapa',
    sinModelos: 'Este comando no tiene modelos.',
    cargando: 'Descargando el modelo de Steam…',
    fallo: 'No se pudo cargar este modelo (revisa la conexión).',
    sin3d: 'Las bibliotecas 3D no cargaron aquí.',
    yaGuardado: 'Ya tiene un encuadre guardado; puedes cambiarlo.',
    sinGuardar: 'Sin encuadre guardado: este es el automático. Muévelo y guárdalo.',
    autoPuesto: 'Encuadre automático puesto (aún no se guardó).',
    borrado: 'Guardado borrado: vuelve a usarse el automático.',
    guardado: n => `Guardado el encuadre de ${n} en src/data/retrato-encuadres.js.`,
    sinArchivo: 'No se pudo leer el archivo de encuadres (¿el servidor de desarrollo está corriendo en este equipo?). Lo que guardes no se escribirá.',
    falloArchivo: 'No se pudo escribir el archivo (¿está corriendo el servidor de desarrollo en este equipo?).',
  },
  sigilosos: {
    titulo: 'Sigilosos: elige tu cobertura',
    quien: n => `Defiende ${n}`,
    ataque: (n, crit, norm) => `${n} sacó ${crit} ${crit === 1 ? 'crítico' : 'críticos'} y ${norm} ${norm === 1 ? 'normal' : 'normales'}.`,
    opcion: { extra: 'Una cobertura más', critico: 'Cobertura como crítico', ambas: 'Las dos' },
    desc: {
      extra: 'Guardas una salvación por cobertura adicional (éxito normal).',
      critico: 'Tu salvación por cobertura cuenta como éxito crítico.',
      ambas: 'Una cobertura adicional y la guardada como crítico (Francotirador con la táctica Sigilosos).',
    },
    nota: 'Si no eliges, se toma la primera opción.',
  },
  tacticas: {
    tituloPrimaria: 'Táctica de capítulo primaria',
    tituloSecundaria: 'Táctica de capítulo secundaria',
    subPrimaria: 'Tus agentes la tienen durante toda la batalla. Después eliges la secundaria.',
    subSecundaria: p => `Primaria: ${p}. Elige una secundaria distinta.`,
    resumen: s => `Tácticas (${s === 0 ? 'tú' : 'rival'})`,
    flexTitulo: 'Nueva táctica secundaria (hasta el final del punto de inflexión)',
    logFlex: (equipo, id) => `${equipo} cambia su táctica secundaria hasta el final del punto de inflexión (${id}).`,
    ficha: 'Tácticas de capítulo',
    desc: {
      agresivos: 'Las armas de combate de tus agentes tienen Desgarradora.',
      duelistas: 'Al combatir o contraatacar, cada éxito normal puede bloquear un éxito crítico sin resolver (salvo contra armas Brutales).',
      resueltos: 'Tus agentes ignoran cualquier cambio a su LPA.',
      sigilosos: 'Al dispararles, si pueden guardar una salvación por cobertura, guardan otra adicional o, en su lugar, una como éxito crítico.',
      moviles: `Retroceder cuesta 1 ${G.pa.abrev} menos y pueden Cargar estando en la ${G.zonaControl.es} de un enemigo.`,
      robustos: 'Los 5+ en sus dados de defensa son éxitos críticos; al contraatacar, la primera vez que un dado normal les inflige 3 o más de daño, baja en 1.',
      tiradores: 'Si no hicieron Cargar, Reposicionarse ni Retroceder en la activación, sus armas bólter tienen Severa.',
      asedios: 'Las armas a distancia de tus agentes tienen Saturación.',
    },
  },
  doctrinas: {
    guerra: equipo => `${equipo}: Guerra según las doctrinas — el Sargento usa la doctrina gratis (0 PM).`,
    titulo: 'Doctrina elegida',
    devastadora: 'Devastadora: disparar a más de 6″',
    tactica: 'Táctica: disparar a 6″ o menos',
    asalto: 'Asalto: combatir',
    log: (equipo, d) => `${equipo} elige la doctrina ${d}.`,
  },
  destino: {
    titulo: 'El destino es mi arma',
    quien: equipo => `${equipo}: tus dados guardados`,
    guardadoAria: v => `Dado guardado: ${v}`,
    explica: 'Elige uno de tus dados guardados (arriba) y toca el dado de ataque que quieres reemplazar. Uno por secuencia; el que pongas no se puede repetir.',
    dadosDe: n => `Dados de ataque de ${n}`,
    noUsar: 'No usarlo ahora',
    lanzar: '🎲 Lanzar los dos dados',
    lanzarDesc: 'Tira 2D6 y se guardan para el tiroteo de este punto de inflexión.',
    lanzaPrimero: 'Lanza los dos dados para continuar',
    bajoNota: 'Suman menos de 9: al usar uno, el otro se descarta.',
    altoNota: 'Suman 9 o más: podrás usar los dos, uno por secuencia.',
    guarda: (equipo, x, y, bajo) => `<b>${equipo}</b> guarda ${x} y ${y} con El destino es mi arma${bajo ? ' (suman menos de 9: al usar uno se descarta el otro)' : ''}.`,
    guardados: dados => dados.length ? `guardados: ${[].concat(dados).join(' y ')}` : 'sin dados guardados',
    log: (equipo, antes, v, n) => `<b>${equipo}</b> usa El destino es mi arma: el ${antes} de ${n} pasa a ser un ${v}.`,
  },

  pergaminos: { titulo: 'Pergaminos de hechicería', texto: 'Cambia el Don de Tzeentch de este Hechicero por otro que no tenga ningún Hechicero amigo. Lo conserva hasta el final de la batalla. Solo una vez por batalla.', log: (n, d) => `Pergaminos de hechicería: ${n} recibe el don ${d}.` },
  // Elección de equipo del comando (src/game/equipo.js, pantalla de inicio)
  equipo: {
    titulo: 'Elige el equipo del comando',
    sub: (n, usados, max) => `${n}: hasta ${max} opciones, mezclando las de facción y las universales. No se puede repetir ninguna. Llevas ${usados} de ${max}.`,
    seccionFaccion: 'Equipo de facción', seccionUniversal: 'Equipo universal',
    pendiente: '(aún no tiene efecto en la app)',
    continuar: 'Continuar', sinEquipo: 'Seguir sin equipo',
    nombre: {
      balas: 'Balas hechizadas', faucesdaemonicas: 'Armas faucesdaemónicas', tunicas: 'Túnicas arcanas', pergaminos: 'Pergaminos de hechicería',
      sellos: 'Sellos de pureza', relicarios: 'Relicarios del capítulo', escudos: 'Escudos decorativos', auspex: 'Auspex',
      puntas: 'Puntas de obsidiana', escudosEstegadon: 'Escudos de piel de estegadón', plumas: 'Plumas incandescentes', idolo: 'Ídolo de los Ancestrales', tambores: 'Tambores de guerra',
      deposito: 'Depósito de munición', alambre: 'Alambre de púas', comunicaciones: 'Aparato de comunicaciones', minas: 'Minas',
      barricadasLigeras: '2 barricadas ligeras', barricadaPesada: 'Barricada pesada', barricadaPortatil: 'Barricada portátil', escaleras: '2 escaleras',
      granadasEspeciales: 'Granadas especiales', granadasExplosivas: 'Granadas explosivas', cargaDemolicion: 'Carga de demolición',
    },
    desc: {
      balas: 'Los bólteres infierno, pistolas bólter infierno y pistolas automáticas ganan Devastadora 1.',
      faucesdaemonicas: 'Las armas de combate de los Marines Rúbrica tienen +1 Ataque; al contraatacar, Certera 1.',
      tunicas: 'Una vez por punto de inflexión y agente, un dado que iba a hacer daño crítico a un Hechicero hace daño normal.',
      pergaminos: 'Mejoras para los Hechiceros.',
      sellos: 'Una vez por punto de inflexión, con 2 o más fallos al atacar, descarta uno y guarda otro como éxito normal.',
      relicarios: 'Ira de venganza cuesta 0 PM si el agente tiene orden de trabarse.',
      escudos: 'Una vez por punto de inflexión, al combatir, los dados del rival menores que 6 no pueden guardarse como críticos.',
      auspex: 'Una vez por punto de inflexión, al disparar a un blanco ofuscado a 8″ o menos, deja de estarlo esa activación.',
      puntas: 'Una vez por punto de inflexión, cuando un Eslizón dispara con Escupedardos o Jabalinas, esa arma tiene Letal 5+ en esa acción.',
      escudosEstegadon: 'La primera vez en la batalla que disparan a cada Saurio (salvo la Guardia Saurio), su Salvación es 3+ en ese disparo.',
      plumas: 'Al empezar cada punto de inflexión, tu líder recupera 1D3 heridas.',
      idolo: 'Una vez por batalla, en la fase de estrategia, ganas 1 PM más (se aplica al empezar la batalla).',
      tambores: 'Una vez por batalla, al inicio de un punto de inflexión, suma 1″ a la distancia de Cargar de tus agentes hasta el final de ese punto de inflexión.',
      deposito: 'Un marcador en tu territorio: un agente que lo controla puede, sin gastar PA, repetir un dado de ataque al disparar hasta el siguiente punto de inflexión.',
      alambre: 'Terreno expuesto y obstructor que se despliega en tu territorio y frena a quien lo cruce.',
      comunicaciones: 'Un marcador en tu territorio: quien lo controla suma 3″ al alcance de sus reglas de apoyo sobre agentes amigos.',
      minas: 'Un marcador en tu territorio: la primera vez que entra en la zona de control de un agente, explota (1D3+3 de daño).',
      barricadasLigeras: 'Dos barricadas ligeras dentro de tu territorio.',
      barricadaPesada: 'Una barricada pesada cerca de tu zona de descenso.',
      barricadaPortatil: 'Una barricada portátil que da cobertura y mejora la salvación; los agentes pueden moverla.',
      escaleras: 'Dos escaleras que facilitan trepar un muro.',
      granadasEspeciales: 'Dos granadas a elegir entre humo y aturdidoras; cada una es una acción única, y el comando solo las usa tantas veces como las elegidas.',
      granadasExplosivas: 'Dos granadas a elegir entre frag y perforantes; cada una es un arma a distancia, y el comando solo las usa tantas veces como las elegidas.',
      cargaDemolicion: 'Una vez por batalla, una acción de Brecha cuesta 1 PA menos.',
    },
  },
  // Elecciones de facción (src/data/teams: `elecciones`): pantallas de inicio y ficha.
  // Las opciones se resumen con nuestras palabras, por su id.
  faccion: {
    titulo: { veterano: 'Veterano del Capítulo: elige una táctica adicional', dones: 'Elige un Don de Tzeentch', armasTirador: 'Elige su arma', armasCampeon: 'Elige su arma', armasTzaangor: 'Elige sus armas',
      armasSargentoAsalto: 'Elige sus armas', armasSargento: 'Elige sus armas', armasTiradorIntercesor: 'Elige su rifle bólter', armasCombatienteIntercesor: 'Elige su arma' },
    tituloGenerico: 'Regla de facción: elige',
    sub: (n, i, total, unica, cuantos = 1) => `Para ${cuantos > 1 ? `los ${cuantos} ${n}` : n}${total > 1 ? ` (${i} de ${total})` : ''}.${unica && total > 1 ? ' Cada opción solo puede elegirla un agente.' : ''}`,
    pendiente: '(aún no tiene efecto en la app)',
    desc: {
      vision: 'Sus armas a distancia ganan Saturación y sus blancos no cuentan como ofuscados.',
      caminante: '+1″ a su Movimiento.',
      ecos: `Una vez por batalla, al reaccionar, puede cambiar su orden y hacer otra acción de 1 ${G.pa.abrev} gratis, distinta de la primera.`,
      hinchazon: '+1 al daño normal de sus armas de combate.',
      apendice: `Un enemigo en su zona de control no le impide recoger marcadores ni hacer acciones de misión; y una vez por activación, recoger, colocar un marcador o una acción de misión le cuesta 1 ${G.pa.abrev} menos.`,
      vuelo: 'Una vez por punto de inflexión, al cargar o reposicionarse, puede volar: se levanta y se coloca a la distancia de su Movimiento, sin importar el terreno.',
      giro: 'Sus armas psíquicas a distancia ganan Perforante en críticos 1.',
      bombardeo: 'Una de sus armas psíquicas a distancia gana Devastadora 1; el Proyectil de condenación, que ya la tiene, pasa a Devastadora a 2″ (también daña a quien esté cerca del blanco).',
      canon: 'Dos modos de disparo (concentrado y barrido) y puños.',
      lanzallamasD: 'Ráfaga 2″, Saturación y Penetración 1, a corto alcance; y puños.',
      granHacha: 'Brutal y Letal 5+.',
      espadon: 'Letal 5+ y Desgarradora.',
      armasTz: 'Equilibrada.',
      escudoTz: 'Escudo: Salvación 4+ y cada bloqueo en combate anula dos éxitos.',
      pistolaEspada: 'Una pistola para disparar y una espada sierra.',
      maestro: '+3″ a los requisitos de distancia de sus acciones psíquicas que tengan uno (en Flujo temporal, solo al del primer efecto; Flujo temporal aún no está en la app).',
      agresivos: 'Solo para este agente: sus armas de combate tienen Desgarradora.',
      duelistas: 'Solo para este agente: cada éxito normal puede bloquear un crítico sin resolver al combatir.',
      resueltos: 'Solo para este agente: ignora cualquier cambio a su LPA.',
      sigilosos: 'Solo para este agente: al dispararle, cobertura adicional o una guardada como crítico.',
      moviles: `Solo para este agente: Retroceder cuesta 1 ${G.pa.abrev} menos y puede Cargar en zona de control.`,
      robustos: 'Solo para este agente: 5+ en defensa son críticos y rebaja el primer daño normal de 3 o más al contraatacar.',
      tiradores: 'Solo para este agente: sin moverse, sus armas bólter tienen Severa.',
      asedios: 'Solo para este agente: sus armas a distancia tienen Saturación.',
    },
  },

  // activaciones alternas (src/ui/turno.js)
  turno: {
    noEsTuTurno: equipo => `Turno de ${equipo}: las activaciones se alternan, activa uno de sus agentes.`,
    terminaPrimero: n => `${n} está en plena activación: termínala antes de activar otro agente.`,
    siguiente: equipo => `Turno de ${equipo}: elige uno de sus agentes y actívalo. Al acabar, toca "Terminar activación".`,
    finPI: `Todos los agentes están usados: toca "Fin del ${PI}".`,
    sinPA: n => `${n} no tiene más ${PA_}: toca "Terminar activación" para pasar el turno.`,
  },

  // la IA (src/ai/facil.js, src/ui/ia.js)
  ia: {
    esDeLaIA: 'Este agente lo lleva la computadora: espera a que juegue su activación.',
    pensando: 'Turno de la computadora: está pensando su jugada…',
    activa: (n, texto) => `Turno de la computadora · ${n}: ${texto}`,
    tuTurno: 'Te toca: elige uno de tus agentes y actívalo.',
    boton: '¿Qué haría la IA?',
    botonTitulo: 'La IA fácil propone una activación para el bando al que le toca (no la ejecuta)',
    sinPlan: 'La IA no encuentra ningún agente apostado que activar.',
    log: (equipo, texto) => `<b>IA (${equipo}):</b> ${texto}`,
    pct: p => `${Math.round(p * 100)} %`,
    plan: {
      disparar: (op, b, arma, e, p) => `${op} dispara a ${b} con ${arma}: ${num(e)} de daño esperado, ${Math.round(p * 100)} % de incapacitarlo.`,
      moverYDisparar: (op, b, arma, e, p) => `${op} se reposiciona y dispara a ${b} con ${arma}: ${num(e)} de daño esperado, ${Math.round(p * 100)} % de incapacitarlo.`,
      cargar: (op, b, e, p, rec) => `${op} carga contra ${b} y combate: ${num(e)} de daño esperado (${Math.round(p * 100)} % de incapacitarlo); recibiría unos ${num(rec)}.`,
      combatir: (op, b, e, p, rec) => `${op} combate contra ${b}: ${num(e)} de daño esperado (${Math.round(p * 100)} % de incapacitarlo); recibiría unos ${num(rec)}.`,
      objetivo: op => `${op} va a controlar un objetivo, con orden de ocultarse.`,
      cubrirse: op => `${op} se reposiciona a un lugar más seguro, con orden de ocultarse.`,
      esperar: op => `${op} no tiene nada útil que hacer: se queda oculto y termina su activación.`,
    },
    riesgo: (carga, expuesto) => carga || expuesto ? ` Allí ${carga} ${carga === 1 ? 'enemigo podría' : 'enemigos podrían'} cargarle y ${expuesto} dispararle sin cobertura.` : ' Allí no corre peligro inmediato.',
  },

  // PV por controlar objetivos al terminar cada PI (src/ui/ops.js) y su razón en la IA (src/ai/facil.js)
  puntosObjetivos: {
    log: (bando, pi, objetivos) => objetivos.length
      ? `Fin del PI ${pi}: <b>${bando}</b> gana ${objetivos.length} ${G.pv.abrev} por controlar ${objetivos.length === 1 ? 'el objetivo' : 'los objetivos'} ${objetivos.join(', ')}.`
      : `Fin del PI ${pi}: <b>${bando}</b> no controla ningún objetivo (no gana ${G.pv.abrev}).`,
    resumen: (a, pa, b, pb) => `${G.pv.abrev} por controlar objetivos (ya incluidos en el total): ${a} ${pa} · ${b} ${pb}. Se apuntan solos al terminar cada PI; un objetivo disputado no puntúa.`,
    ia: {
      ganar: n => ` Pasaría a controlar ${n} ${n === 1 ? 'objetivo' : 'objetivos'} más.`,
      perder: n => ` Dejaría de controlar ${n} ${n === 1 ? 'objetivo' : 'objetivos'}.`,
      disputar: ' Disputa un objetivo que controla el enemigo.',
      sostener: ' Se queda oculto sosteniendo el objetivo.',
      romper: ' El blanco sostiene un objetivo: sacarlo de allí lo deja sin control.',
    },
  },

  // por qué una acción no está permitida (src/game/acciones.js)
  reglas: {
    accion: { reposition: G.reposicionarse.es, dash: G.correr.es, fallBack: G.retroceder.es, charge: G.cargar.es,
      shoot: G.disparar.es, fight: G.combatir.es },
    noPuede: (accion, motivo) => `Según las reglas no puede ${accion}: ${motivo}.`,
    motivo: {
      fuera: 'está fuera de la mesa',
      usado: 'ya está usado en este punto de inflexión',
      desconocida: 'acción desconocida',
      sinPA: `no le quedan ${G.pa.abrev} suficientes`,
      sinPAExtra: `el segundo disparo con un arma pesada cuesta 1 ${G.pa.abrev} más (2 en total) y no le quedan suficientes`,
      yaHecha: 'ya hizo esa acción en esta activación',
      enZonaDeControl: `está en la ${G.zonaControl.es} de un enemigo`,
      yaCargoORetrocedio: `ya usó ${G.cargar.es} o ${G.retroceder.es} en esta activación`,
      yaCargo: `ya usó ${G.cargar.es} en esta activación`,
      armaPesada: 'su arma Pesada no se lo permite',
      sinEnemigoEnZona: `no hay ningún enemigo en su ${G.zonaControl.es}`,
      yaSeMovio: 'ya se movió en esta activación',
      ocultarse: 'tu agente tiene orden de ocultarse 🕵️ (con esa orden no puede disparar ni cargar; la orden se elige al empezar su activación: si ya actuó, deshaz su última acción para volver a elegirla)',
      yaEnZona: `ya está en la ${G.zonaControl.es} de un enemigo`,
      sinArmaDistancia: 'el arma elegida no es a distancia',
      sinBlanco: `no hay ningún ${G.blancoValido.es}`,
      sinArmaCombate: 'no tiene armas de combate',
      ordenFijada: 'la orden se elige al empezar la activación y ya hizo una acción',
      psiquicaRepetida: 'ya disparó con esa arma psíquica en esta activación (regla Astartes: elige otra)',
      sinBolter: 'el primer disparo no fue con un arma bólter: el segundo tiene que serlo (regla Astartes)',
      fueraDeAlcance: 'ningún blanco válido está al alcance de su arma',
      armaAgotada: 'su arma Limitada ya no tiene usos en esta batalla',
    },
  },

  // tipos genéricos de agente (fichas simples, sin comando elegido; src/engine/world.js KINDS)
  tipos: { leader: 'Líder', marksman: 'Francotirador', brawler: 'Asaltante', trooper: 'Soldado' },

  // ficha de datos completa de un agente (src/ui/ficha.js)
  fichaDatos: {
    nombre: 'Nombre',
    reglasArmas: 'Reglas',
    distancia: 'a distancia',
    combate: 'de combate',
    cerrar: 'Cerrar',
    provisional: 'Ficha provisional: atributos y armas de prueba (fichas simples, sin comando).',
    oficial: 'Atributos y armas de la ficha oficial del comando. Las reglas con * y las habilidades del agente están en su ficha.',
    lider: 'Líder',
    astartes: 'Astartes',
    astartesDesc: `En su activación puede Disparar dos veces o Combatir dos veces (el segundo disparo con un cañón cosechaalmas o un lanzallamas disforme cuesta 1 ${G.pa.abrev} más; no repite arma psíquica). Puede reaccionar con cualquier orden.`,
    astartesBolterDesc: `En su activación puede Disparar dos veces o Combatir dos veces. Si dispara dos veces, al menos una con un arma bólter; si las dos son con el rifle bólter de francotirador o con el bólter pesado, la segunda cuesta 1 ${G.pa.abrev} más. Puede reaccionar con cualquier orden.`,
    ver: 'Ver ficha',
    noImplementada: '(aún sin efecto en la app)',
    // reglas propias de cada ficha, por "<id del comando>:<clave del agente>": [nombre, texto con nuestras palabras, ¿falta implementarla?]
    reglasAgente: {
      '3272457903:saurioEscamadura': [
        ['Sangre fría', 'Ignora todos los efectos de estar lesionado: ni empeora Impactar ni baja su Movimiento.'],
        ['Orden primordial', 'Las armas de combate de los Saurios y Kroxigor amigos a 3″ o menos de él tienen Equilibrada (6″ con el Estandarte de guerra).'],
        ['Mordisco', 'Después de que luche, si el enemigo no quedó incapacitado, tira 1D6: con 5+, le inflige 1 de daño.'],
        ['Ejemplo depredador', 'Con el Estandarte de guerra, una vez por batalla, tras luchar, un Saurio amigo listo a 3″ o menos y en la zona de control del mismo enemigo lucha gratis (0 PA).'],
      ],
      '3272457903:sacerdoteEstelar': [
        ['Sangre fría', 'Ignora todos los efectos de estar lesionado: ni empeora Impactar ni baja su Movimiento.'],
        ['Lector de estrellas', 'Una vez por batalla, al inicio de un punto de inflexión, activa un Asterismo sin cumplir su condición.'],
        ['Escudriñar las estrellas', 'Una vez por batalla, al inicio de un punto de inflexión, tira tantos D6 como su número (máx. 4); por cada 4+, un aliado visible conserva un dado de defensa como normal.'],
        ['Luz de Chotec (1 PA)', 'Un Saurio o Kroxigor amigo visible a 6″ o menos recupera 1D3 heridas; una vez por punto de inflexión para el comando.'],
        ['Presagio celeste (1 PA)', 'Un Eslizón amigo visible a 6″ o menos tiene Equilibrada en sus armas a distancia hasta el final de su siguiente activación.'],
      ],
      '3272457903:combatienteSaurio': [
        ['Sangre fría', 'Ignora todos los efectos de estar lesionado: ni empeora Impactar ni baja su Movimiento.'],
        ['Escudo de escamas', 'Al combatir, sus éxitos normales pueden bloquear éxitos críticos.'],
        ['Mordisco', 'Igual que el del Saurio Escamadura.'],
        ['Cohortes ordenadas', 'Mientras controla un marcador de objetivo, su Salvación es 3+.'],
        ['Semilla de renacimiento', 'Una vez por batalla, cuando iba a quedar incapacitado, tira 1D6: con 4+, se queda con 1 herida.'],
      ],
      '3272457903:guardiaSaurio': [
        ['Sangre fría', 'Ignora todos los efectos de estar lesionado: ni empeora Impactar ni baja su Movimiento.'],
        ['Guardián inquebrantable', 'Cuando un enemigo termina una Carga en la zona de control de un amigo a 3″ o menos, carga gratis (hasta 3″) contra él.'],
        ['Protectores abnegados', 'A 3″ o menos de tu líder, ambos suman 1 a su Salvación contra disparos de enemigos a 6″ o menos (nunca por encima de 2+).'],
        ['Semilla de renacimiento', 'Una vez por batalla, cuando iba a quedar incapacitado, tira 1D6: con 4+, se queda con 1 herida.'],
      ],
      '3272457903:kroxigor': [
        ['Sangre fría', 'Ignora todos los efectos de estar lesionado: ni empeora Impactar ni baja su Movimiento.'],
        ['Barrido del martillo', 'Una vez por activación, al incapacitar a un enemigo luchando, lucha gratis contra otro enemigo en su zona de control.'],
        ['Inmenso', 'No obtiene cobertura de terreno ligero y no puede escalar más de 2″ en una acción.'],
      ],
      '3272457903:combatienteEslizon': [
        ['Sangre fría', 'Ignora todos los efectos de estar lesionado: ni empeora Impactar ni baja su Movimiento.'],
        ['Ágil', 'Retroceder le cuesta 1 PA menos.'],
      ],
      '3272457903:camaleon': [
        ['Sangre fría', 'Ignora todos los efectos de estar lesionado: ni empeora Impactar ni baja su Movimiento.'],
        ['Emboscador', 'En el despliegue, puede ir a cualquier punto de la zona de aniquilación a más de 6″ de la zona de despliegue enemiga, con orden de ocultarse.'],
        ['Camuflaje cromático', 'Con orden de ocultarse cuenta como en cobertura frente a enemigos a más de 6″, aunque no haya terreno.'],
      ],
      '3272457903:sacerdoteEslizon': [
        ['Sangre fría', 'Ignora todos los efectos de estar lesionado: ni empeora Impactar ni baja su Movimiento.'],
        ['Velo celeste (1 PA)', 'Un amigo visible a 6″ o menos conserva un dado de defensa como normal al recibir disparos, hasta su siguiente activación (nunca más de 2 conservados).'],
      ],
      '2272196183:capitan': [
        ['Líder heroico', `Una vez por punto de inflexión: usar un ardid de tiroteo gratis, o usar Doctrina de combate o Ajustar doctrina sin gastar PM, si está en la zona de aniquilación y fuera de la zona de control enemiga.`, 'pendiente'],
        ['Aura de hierro', 'Una vez por batalla, cuando un dado de ataque le inflige daño normal, puede ignorarlo: la app te pregunta en ese momento (en línea o contra la computadora se aplica sola con el primero).'],
      ],
      '2272196183:sargentoAsalto': [
        ['Guerra según las doctrinas', 'Una vez por batalla cada una: Doctrina de combate con Asalto o con Táctica le cuesta 0 PM.'],
        ['Veterano del Capítulo', 'Al elegir agentes, elige una táctica de capítulo adicional solo para este agente.'],
      ],
      '2272196183:sargentoIntercesor': [
        ['Guerra según las doctrinas', 'Una vez por batalla cada una: Doctrina de combate con Devastadora o con Táctica le cuesta 0 PM.'],
        ['Veterano del Capítulo', 'Al elegir agentes, elige una táctica de capítulo adicional solo para este agente.'],
      ],
      '2272196183:granaderoAsalto': [
        ['Granadero', 'Puede usar granadas frag y perforantes del equipo universal sin gastar sus usos limitados, con +1 a Impactar.', 'pendiente'],
      ],
      '2272196183:francotirador': [
        ['Capa de camuflaje', 'Al dispararle ignora Saturación; siempre tiene la táctica Sigilosos (si ya la tenías, usa sus dos opciones).'],
        ['Óptica (1 PA)', 'Hasta el inicio de su siguiente activación, al disparar los enemigos no pueden estar ofuscados. No puede hacerla en la zona de control enemiga.', 'pendiente'],
      ],
    },
  },

  // estado de un agente (marcador flotante y menú)
  estado: { ready: 'Apostado', active: 'Activándose', spent: 'Usado', dead: 'Incapacitado', ajeno: 'No es tuyo', reserva: 'Por desplegar' },

  // paso de despliegue antes de jugar (src/ui/despliegue.js)
  despliegue: {
    empieza: equipo => `<b>Despliegue.</b> Los jugadores se alternan para colocar a sus agentes, uno a uno, empezando por ${equipo}. Cada agente va completamente dentro de su ${G.zonaDescenso.es}, con orden de ocultarse.`,
    toca: (equipo, n, id) => `Despliegue · turno de ${equipo}: toca dentro de su ${G.zonaDescenso.es} para colocar a ${n} (${id}).`,
    detalle: (mov, salv, h) => `${pulg(mov)} · ${salv}+ · ${h} H`,
    esperando: equipo => `Despliegue · turno de ${equipo}: espera a que coloque un agente.`,
    fueraDeZona: equipo => `Fuera de la ${G.zonaDescenso.es} de ${equipo}: la peana debe quedar completamente dentro.`,
    noCabe: `No cabe ahí: el terreno lo impide. Toca otro punto de la ${G.zonaDescenso.es}.`,
    ocupado: 'Ahí ya hay un agente.',
    log: (n, id) => `<b>${n}</b> (${id}) desplegado.`,
    termina: `<b>Despliegue terminado.</b> Comienza el ${G.puntoInflexion.es} 1.`,
    terminaPista: 'Despliegue terminado: ya puedes activar a tus agentes.',
    elegirTitulo: n => `Colocar a ${n} ahora`,
    verFicha: 'mantén pulsado (o doble clic) para ver su ficha',
    restoAzar: 'Resto al azar',
    restoAzarTitulo: `Coloca al azar, dentro de su ${G.zonaDescenso.es}, a todos los agentes que faltan`,
    restoLog: n => `${n} ${n === 1 ? 'agente desplegado' : 'agentes desplegados'} al azar en su ${G.zonaDescenso.es}.`,
  },

  // marcador flotante sobre la mesa y hoja de puntuación (hud.js)
  hud: {
    aria: (id, n, estado, h, max) => `${id} ${n}, ${estado}${h != null ? `, ${h}/${max} heridas` : ''}`,
    quedan: n => `${n} por activar`,
    stat: { lpa: G.lpa.abrev, mov: 'Mov.', salv: 'Salv.', heridas: G.heridas.es },
    notaOcultarse: `🕵️ Ocultarse: no puede ${G.disparar.es} ni ${G.cargar.es}; a salvo a cubierto`,
    notaTrabarse: `💀 Trabarse: puede ${G.disparar.es}, ${G.cargar.es} y combatir`,
    notaLesionado: mov => `Lesionado (menos de la mitad de sus heridas): mueve ${pulg(mov)} y empeora su Impactar`,
    hizo: acciones => `Ya hizo: ${acciones.map(a => T.mover.nombre[a] || ({ shoot: G.disparar.es, fight: G.combatir.es })[a] || a).join(', ')}`,
    hojaTitulo: `Hoja de puntuación: ${PV} de operaciones crítica, táctica y de eliminación por punto de inflexión, y ${PM}`,
    pm: n => `${n} ${PM}`,
    pi: n => `${PI} ${n}`,
    gastar: `Gastar 1 ${PM}`,
    ganar: `Ganar 1 ${PM}`,
    bajas: n => `✕ ${n} ${n === 1 ? 'baja' : 'bajas'}`,
    bajasTitulo: 'Agentes enemigos incapacitados (los cuenta la operación de eliminación)',
    hoja: 'Hoja de puntuación',
    cerrar: 'Cerrar',
    hojaNota: `${PV} de eliminación según la carta de la operación de eliminación; el contador ✕ de arriba son los agentes enemigos caídos hasta ahora.`,
    logPM: (equipo, gana, quedan) => `<b>${equipo}</b> ${gana ? 'gana' : 'gasta'} 1 ${PM} (le quedan ${quedan}).`,
  },

  // menú del agente (clic derecho o pulsación larga)
  menu: {
    usado: 'Marcar como usado',
    deshacer: 'Deshacer activación',
    incapacitar: '✕ Marcar incapacitado',
    volver: 'Volver a la mesa',
  },

  // zonas de amenaza al arrastrar (threat.js)
  amenaza: {
    estilos: { bands: 'Bandas', outlines: 'Contornos', warn: 'Solo aviso', off: 'No' },
    intensidad: { faint: 'Suave', soft: 'Media', bold: 'Intensa' },
    rutas: { flow: 'Trazos en movimiento', comet: 'Cometas', arrow: 'Flechas', line: 'Líneas rectas' },
    leyenda: (carga, cerca) => [carga && `rojo: ${carga}`, cerca && `franjas ámbar: ${cerca}`].filter(Boolean).join('\n') +
      '\nSolo enemigos que aún no se han activado en este punto de inflexión. Las zonas son para el centro de la peana de tu miniatura.',
    alcanceCarga: control => `Alcance de ${G.cargar.es} (movimiento de ${G.cargar.es} y luego a ${pulg(control)} o menos)`,
    sinCobertura: (correr, vacio) => `Sin cobertura (${G.reposicionarse.es}${correr ? `, más ${G.correr.es} con ${G.lpa.abrev} 3+` : ''}, y luego dispara desde ${pulg(vacio)} o menos)`,
    etiqueta: (carga, cerca) => {
      const partes = [];
      if (carga) partes.push(`${G.cargar.es}: ${carga}`);
      if (cerca) partes.push(`Sin cobertura: ${cerca}`);
      return partes.length ? '⚠ ' + partes.join(' · ') : '';
    },
  },

  opciones: {
    activaciones: { label: 'Activaciones', help: 'Alternas: como en las reglas, cada jugador activa un agente y termina su activación antes de que el otro active uno. Libres: puedes mover cualquier agente en cualquier momento (mesa de medir).',
      alternas: 'Alternas', libres: 'Libres' },
    despliegue: { label: 'Despliegue', help: 'Al empezar o reiniciar una partida. Por turnos: los jugadores colocan a sus agentes uno a uno en su zona de descenso, como en las reglas (en solitario los colocas tú todos). Al azar: los agentes aparecen repartidos por la mesa.',
      turnos: 'Por turnos', azar: 'Al azar' },
    panSpeed: { label: 'Velocidad del teclado', help: 'Qué tan rápido mueven W A S D la vista de la mesa 3D.' },
    cardLayout: { label: 'Tarjetas de estado', help: 'Fichas: una pestaña pequeña por tarjeta en el borde de la mesa; toca una para leerla. Cajón: una pestaña por bando que abre todas sus tarjetas.',
      chips: 'Fichas', drawer: 'Cajón' },
    idle: { label: 'Animación en reposo', help: 'Las miniaturas de la mesa 3D respiran y cambian un poco el peso mientras están quietas.',
      on: 'Sí', off: 'No' },
  },

  // panel de operaciones y puntuación (ops.js)
  operaciones: {
    cols: ['Crít.', 'Tác.', 'Elim.'],
    colNombre: ['crítica', 'táctica', 'de eliminación'],
    temporada: 'Temporada',
    critica: 'Op. crítica',
    robar: 'Robar',
    robarTitulo: 'Roba una operación crítica al azar',
    tactica: 'Op. táctica',
    primaria: 'Primaria',
    primariaTitulo: 'Los PV de la operación primaria cuentan otra vez al final (la mitad, redondeando hacia arriba)',
    eliminacion: 'Op. de eliminación',
    puntosGrado: (bando, g, pv, bono) => `<b>${bando}</b> termina con grado de bajas ${g}` +
      `${bono ? ', el más alto' : ''}: +${pv} PV`,
    gradoCorto: g => `Grado ${g}`,
    iniciativa: 'Cartas de iniciativa',
    equipo: 'Equipo',
    marcadores: n => `Marcadores (${n})`,
    marcadorTitulo: n => `${n}: luego toca la mesa`,
    quitar: 'Quitar',
    nota: 'Las cartas y fichas se descargan del Killzone Mod a este navegador; este sitio no las aloja.',
    ampliar: t => `${t}: toca para ampliar`,
    cerrarCarta: ' · toca para cerrar',
    noDisponible: 'carta no disponible',
    colocado: n => `Marcador <b>${n}</b> colocado.`,
    criticaLog: n => `Op. crítica: <b>${n}</b>.`,
    robada: n => `Op. crítica robada: <b>${n}</b>.`,
    tacticaLog: (equipo, n) => `<b>${equipo}</b> op. táctica: <b>${n}</b>.`,
    puntos: (equipo, tp, col, v, total) => `<b>${equipo}</b> ${PI}${tp} op. ${T.operaciones.colNombre[col]}: ${v} ${PV} (total ${total}).`,
    colocar: n => `Toca la mesa para colocar ${n}. Esc para cancelar.`,
    quienEdita: cualquiera => `Tarjetas de estado: ${cualquiera ? 'cualquier jugador puede editar ambos bandos' : 'cada jugador edita su propio bando'}.`,
  },

  // caja de dados (dicebox.js)
  dados: {
    caja: equipo => `Caja de dados de ${equipo}`,
    cerrarAviso: 'Cerrar el resultado y las cajas de dados',
    poner: n => `Pon ${n} dados en el tapete`,
    unoMas: 'Un dado más',
    lanzar: 'Lanzar',
    lanzarTitulo: 'Lanza por mí los dados sueltos (o los seleccionados)',
    objetivoTitulo: 'El valor que hay que sacar para impactar o salvar',
    a: 'a',
    sonidoTitulo: 'Sonido de los dados',
    ocultar: 'Ocultar la caja de dados',
    fieltro: 'agarra los dados, agítalos y suéltalos en la caja',
    soltarAqui: 'Suelta los dados aquí para tirarlos',
    noOcurrio: motivo => `La tirada no se hizo: ${motivo}.`,
    aunNo: motivo => `Aún no puedes tirar: ${motivo}.`,
    sonido: si => `Sonido: ${si ? 'sí' : 'no'}`,
    resumen: (crit, norm, fallos, repetidos) =>
      `<b>${crit}</b> ${crit === 1 ? 'crítico' : 'críticos'} · <b>${norm}</b> ${norm === 1 ? 'éxito' : 'éxitos'} · ${fallos} ${fallos === 1 ? 'fallo' : 'fallos'}` +
      (repetidos ? ` · ${repetidos} ${repetidos === 1 ? 'repetido' : 'repetidos'}` : ''),
    otroTira: 'Aquí tira el otro jugador.',
    elegir: 'Elige cuántos; luego agarra, agita y suelta los dados en la caja.',
  },

  // tarjetas de estado en los bordes de la mesa (statuscards.js)
  tarjetas: {
    encabezado: 'Encabezado',
    principal: 'Texto principal',
    pequeno: 'Texto pequeño',
    guardar: 'Guardar',
    cancelar: 'Cancelar',
    quitar: 'Quitar',
    quitarTitulo: 'Quita esta tarjeta',
    editar: 'Editar',
    editarTitulo: 'Edita esta tarjeta',
    soloEdita: equipo => `Solo el jugador de ${equipo} edita estas tarjetas`,
    plegar: 'Vuelve a plegarla en una pestaña',
    cerrar: 'Cerrar',
    cambiadaPor: equipo => `cambiada por ${equipo}`,
    agregar: '+ tarjeta',
    agregarTitulo: equipo => `Agrega una tarjeta de estado para ${equipo}`,
    quienTitulo: 'Quién puede editar las tarjetas de estado (eres el anfitrión)',
    ambos: 'ambos editan todo',
    propio: 'cada uno lo suyo',
    pestanaTitulo: equipo => `Tarjetas de estado de ${equipo}`,
    pestana: n => n ? `${n} ${n === 1 ? 'tarjeta' : 'tarjetas'}` : 'tarjetas',
    logCambio: (equipo, nueva, texto, extra) => `<b>${equipo}</b>: tarjeta de estado ${nueva ? 'agregada' : 'cambiada'}: <b>${texto}</b>${extra ? ` — ${extra}` : ''}.`,
    logQuitada: (equipo, texto) => `<b>${equipo}</b>: tarjeta de estado quitada: <b>${texto}</b>.`,
  },

  // panel de miniaturas (minis.js)
  miniaturas: {
    maximo: n => `Un bando tiene como máximo ${n} agentes.`,
    sinEspacio: equipo => `No queda espacio en la zona de descenso de ${equipo}.`,
    minimo: 'Cada bando conserva al menos un agente.',
    seUne: (n, id, equipo) => `<b>${n}</b> (${id}) se une a ${equipo}.`,
    agenteGenerico: 'Agente',
    comandoAria: equipo => `Comando de ${equipo}`,
    fichasSimples: 'Fichas simples',
    peana: mm => ` · peana de ${mm} mm, medida del modelo`,
    modeloAria: id => `Modelo de ${id}`,
    quitarTitulo: n => `Saca a ${n} de la lista`,
    quitarAria: id => `Quitar ${id}`,
    agregar: (n, max) => `Agregar (${n}/${max})`,
    agregarTitulo: (n, h, equipo) => `Agrega un ${n} (${h} H) a ${equipo}`,
    heridas: h => `${h} H`,
    agente: '+ Agente',
    nota: 'Los modelos se descargan de los mods de comandos de Steam Workshop a este navegador; este sitio no los aloja.',
  },

  captura: {
    guardada: (archivo, es3d) => `Se guardó ${archivo}: una imagen ${es3d ? 'de la mesa 3D' : 'del mapa 2D'} tal como está ahora.`,
  },

  // bandeja, mapas e importación (controls.js)
  partida: {
    viendoGrabacion: 'Estás viendo una grabación: sal de ella para jugar.',
    soloAnfitrion: 'En línea, solo el anfitrión cambia el mapa o las reglas, o reinicia.',
    soloJugadores: 'Estás mirando: solo los dos jugadores pueden hacer eso.',
    finBatalla: `<b>La batalla termina después del ${G.puntoInflexion.es} 4.</b> ¡Cuenten sus ${PV}!`,
    nuevoPI: n => `<b>${G.puntoInflexion.es[0].toUpperCase() + G.puntoInflexion.es.slice(1)} ${n}.</b> Todos los agentes quedan apostados.`,
    regla: 'Regla: toca dos puntos para medir. Esc para salir.',
    contadorTitulo: 'toca para +1 · Mayús + clic para −1',
    importFallo: msg => `<span class="crit">Falló la importación:</span> ${msg}`,
    importNoLeido: 'No se pudo leer ese archivo como partida guardada de Tabletop Simulator.',
    importVarios: n => `Se importaron <b>${n}</b> despliegues de Volkus de esta partida: están todos en la lista de zonas de aniquilación.`,
    importados: 'Importados',
    importado: n => `Importado ${n}`,
    zonaCargada: (nombre, fuente) => `<b>Zona de aniquilación cargada:</b> ${nombre}${fuente ? ` <span class="dice">(${fuente})</span>` : ''}.`,
    despliegueLargo: 'despliegue por el borde largo, zonas de 3″',
    despliegueCorto: fondo => `despliegue por el borde corto, zonas de ${pulg(fondo)}`,
    notaFina: (nombre, ancho, alto, despliegue, piezas, fuente) => `${nombre} · ${ancho}″×${alto}″ · ${despliegue} · ${piezas} piezas de terreno, con la huella trazada de los escaneos de TTS a 0,1″: ` +
      'las peanas caben en cualquier puerta, hueco o rincón donde realmente quepan; el rayado azul es un piso superior bajo el que puedes estar o al que puedes trepar (Mayús + arrastrar)' +
      (fuente ? ` · ${fuente}` : ''),
    notaMuros: (nombre, ancho, alto, despliegue, muros, escotillas, fuente) => `${nombre} · ${ancho}″×${alto}″ · ${despliegue} · ${muros} tramos de muro` +
      (escotillas ? ` · ${escotillas} escotillas (los tramos más claros son puntos de acceso abiertos)` : '') + (fuente ? ` · ${fuente}` : ''),
    bienvenida: [
      'Volkus Approved Ops, mapa 1: la huella de cada pieza está trazada de los escaneos de Tabletop Simulator a 0,1″, así que puertas, huecos y el suelo bajo los pisos superiores son espacio real. Arrastra un agente a un rincón y se queda ahí si cabe su peana de 28 mm. Los doce despliegues de Volkus Approved Ops (2024 y 2025) ya vienen incluidos; elige uno en la lista de zonas de aniquilación.',
      'Reglas: Kill Team (2024).',
      'Prueba: arrastra un agente en la mesa 3D; trepa los muros y entra en los rincones donde cabe. Arrastra la mesa vacía para girarla; Cenital la mira desde arriba.',
    ],
  },
};
