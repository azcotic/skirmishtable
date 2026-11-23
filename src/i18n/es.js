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
  },
  acciones: {
    titulo: 'Acciones',
    deseleccionarTitulo: 'Quitar la selección',
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
    descargarSteamTitulo: 'Descarga a este navegador los escaneos y texturas exactos de Tabletop Simulator desde el CDN de Steam Workshop. Este sitio no los aloja.',
    nota3d: 'Arrastra un agente para moverlo · arrastra la mesa para girarla, usa la rueda para acercar y WASD para desplazarte · la regla está en el mapa 2D.',
    sinModelos: mb => `Terreno en bloques: este sitio no aloja los modelos de TTS. Descárgalos directamente de Steam (${mb} MB, una sola vez).`,
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
    nombre: { reposition: G.reposicionarse.es, dash: G.correr.es, charge: G.cargar.es },
    verbo: { reposition: G.reposicionarse.verbo, dash: G.correr.verbo, charge: G.cargar.verbo },
    motivo: {
      occupied: 'ocupado',
      blocked: 'bloqueado',
      chargeNoFoe: `una carga debe terminar en la ${G.zonaControl.es} de un enemigo`,
      engagedAfterMove: `${G.zonaControl.es} enemiga: no puedes ${G.cargar.es} después de moverte`,
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
        'obscured: crits downgraded, one success discarded': 'ofuscado: los críticos pasan a normales y se descarta un éxito',
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
  },

  combate: {
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
    ardidesSub: (equipo, pm) => `${equipo} tiene ${pm} ${PM}. Cada ardid cuesta 1 ${PM} y se usa una vez por punto de inflexión. Su efecto está en la ficha del comando.`,
    esperaArdides: equipo => `Turno de ${equipo}: espera a que elija sus ardides.`,
    sinArdides: 'Este bando no tiene comando elegido: no hay ardides que mostrar.',
    ardidCoste: `Usar por 1 ${PM}`,
    ardidUsado: `Usado (−1 ${PM}) · toca para devolverlo`,
    logArdid: (equipo, n) => `<b>${equipo}</b> usa el ardid <b>${n}</b> (−1 ${PM}).`,
    logDevuelto: (equipo, n) => `<b>${equipo}</b> devuelve el ardid <b>${n}</b> (+1 ${PM}).`,
    siguiente: equipo => `Listo · turno de ${equipo}`,
    aTiroteo: 'Listo · a la fase de tiroteo',
    tiroteo: equipo => `Fase de tiroteo: empieza ${equipo}, que tiene la iniciativa. Activa a un agente.`,
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
    comandoDesc: n => `${n} modelos · se descargan de Steam a este navegador`,
    fichasSimples: 'Fichas simples',
    fichasSimplesDesc: 'Sin modelos 3D: fichas de colores. Carga más rápido.',
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
    ver: 'Ver ficha',
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
