/**
 * Aquelarre Disforme (Warpcoven): perfiles de sus agentes y armas, como números.
 * Fuente: reglas de equipo de GW en español e inglés (02/10/2024). Solo datos; nunca texto de
 * reglas. Las reglas de arma van con su nombre canónico en inglés (ver garra-nemesis.js).
 */
const R = (name, atk, hit, dmgN, dmgC, rules = []) => ({ name, type: "R", atk, hit, dmgN, dmgC, rules });
const M = (name, atk, hit, dmgN, dmgC, rules = []) => ({ name, type: "M", atk, hit, dmgN, dmgC, rules });

export default {
  id: "3348897103",
  ids: ["3348897103", "3352921015"],   // también la versión con modelos de Space Marine 2
  nombre: "Aquelarre Disforme",
  prefijo: "ad",
  armas: {
    proyectilCondenacion: R("Proyectil de condenación", 4, 3, 4, 4, ["PSYCHIC", "Devastating 2", "Lethal 5+"]),
    descargaFlujo:        R("Descarga de flujo", 4, 3, 3, 4, ["PSYCHIC", 'Blast 2"', "Rending"]),
    tormentaFuego:        R("Tormenta de fuego", 5, 4, 2, 3, ["PSYCHIC", "Saturate", "Seek Light", 'Torrent 2"']),
    quemarMente:          R("Quemar mente", 5, 4, 1, 1, ["PSYCHIC", "Lethal 5+", "Saturate", "Seek", "Mindburn*"]),
    pistolaBolterInfierno: R("Pistola bólter infierno", 4, 3, 3, 4, ['Range 8"', "Piercing 1"]),
    pistolaLlamas:        R("Pistola de llamas disformes", 4, 2, 3, 3, ['Range 6"', "Piercing 1", 'Torrent 1"']),
    canonConcentrado:     R("Cañón cosechaalmas (concentrado)", 5, 3, 4, 5, ["Piercing 1"]),
    canonBarrido:         R("Cañón cosechaalmas (barrido)", 4, 3, 4, 5, ["Piercing 1", 'Torrent 1"']),
    lanzallamasDisforme:  R("Lanzallamas disforme", 4, 2, 4, 4, ['Range 8"', "Saturate", "Piercing 1", 'Torrent 2"']),
    bolterInfierno:       R("Bólter infierno", 4, 3, 3, 4, ["Piercing 1"]),
    pistolaAutomatica:    R("Pistola automática", 4, 4, 2, 3),
    bastonPsicofuerza:    M("Bastón de psicofuerza", 4, 3, 4, 6, ["PSYCHIC", "Shock"]),
    khopesh:              M("Khopesh prosperiano", 5, 3, 4, 6, ["Lethal 5+"]),
    punos:                M("Puños", 3, 3, 3, 4),
    granHacha:            M("Gran hacha", 4, 3, 4, 5, ["Brutal", "Lethal 5+"]),
    espadon:              M("Espadón", 4, 3, 4, 5, ["Lethal 5+", "Rending"]),
    daga:                 M("Daga", 4, 4, 3, 5),
    espadaSierra:         M("Espada sierra", 4, 4, 4, 5),
    armaEscudo:           { ...M("Arma y escudo de Tzaangor", 4, 4, 3, 4, ["Shield*"]), salvacion: 4 },   // Escudo: Salvación 4+
    armasTzaangor:        M("Armas de Tzaangor", 4, 4, 4, 5, ["Balanced"]),
  },
  // Astartes (regla de facción): el segundo disparo de la activación con estas armas cuesta 1 PA más
  armasPesadasAstartes: ["canonConcentrado", "canonBarrido", "lanzallamasDisforme"],
  // Elecciones de facción (ver src/data/teams/index.js): Dones de Tzeentch, cada hechicero
  // elige uno, distinto, para la batalla.
  elecciones: [{
    id: "dones",
    agentes: ["hechiceroDestino", "hechiceroTempireo", "hechiceroFuego"],
    unica: true,
    opciones: [
    { id: "vision",    nombre: "Visión incorpórea",      armas: { distancia: { anadir: ["Saturate"], sinOfuscar: true } } },
    { id: "caminante", nombre: "Caminante temporal",     move: 1 },
    { id: "ecos",      nombre: "Ecos de la Disformidad", ecos: true },
    { id: "hinchazon", nombre: "Hinchazón disforme",     armas: { combate: { dmgN: 1 } } },
    { id: "apendice",  nombre: "Apéndice mutante",       apendice: true, pendiente: true }   /* sin efecto hasta que haya acciones de misión y de marcadores */,
    { id: "vuelo",     nombre: "Vuelo inmaterial",       vuelo: true },
    { id: "giro",      nombre: "Giro del destino",       armas: { psiquicas: { anadir: ["Piercing Crits 1"] } } },
    { id: "bombardeo", nombre: "Bombardeo astral",       armas: { unaPsiquica: { anadir: ["Devastating 1"], devArea: 2 } } },
    { id: "maestro",   nombre: "Maestro del Immaterium", distanciaPsiquica: 3, pendiente: true }   /* sin efecto hasta que haya acciones únicas psíquicas */,
    ],
  }, {
    // opciones de arma de la hoja de equipo (equipo: las armas que lleva en lugar de las de su ficha)
    id: "armasTirador", agentes: ["tiradorRubrica"],
    opciones: [
      { id: "canon",        nombre: "Cañón cosechaalmas",   equipo: ["canonConcentrado", "canonBarrido", "punos"] },
      { id: "lanzallamasD", nombre: "Lanzallamas disforme", equipo: ["lanzallamasDisforme", "punos"] },
    ],
  }, {
    id: "armasCampeon", agentes: ["campeonTzaangor"],
    opciones: [
      { id: "granHacha", nombre: "Gran hacha", equipo: ["granHacha"] },
      { id: "espadon",   nombre: "Espadón",    equipo: ["espadon"] },
    ],
  }, {
    id: "armasTzaangor", agentes: ["combatienteTzaangor"],
    opciones: [
      { id: "armasTz",       nombre: "Armas de Tzaangor",                  equipo: ["armasTzaangor"] },
      { id: "escudoTz",      nombre: "Arma y escudo de Tzaangor",          equipo: ["armaEscudo"] },
      { id: "pistolaEspada", nombre: "Pistola automática y espada sierra", equipo: ["pistolaAutomatica", "espadaSierra"] },
    ],
  }],
  agentes: {
    hechiceroDestino:   { nombre: "Hechicero del Destino", lider: true, astartes: true, palabras: ["hechicero"], apl: 3, move: 6, save: 3, wounds: 14, armas: ["proyectilCondenacion", "pistolaBolterInfierno", "bastonPsicofuerza"] },
    hechiceroTempireo:  { nombre: "Hechicero Tempíreo", lider: true, astartes: true, palabras: ["hechicero"], apl: 3, move: 6, save: 3, wounds: 14, armas: ["descargaFlujo", "pistolaBolterInfierno", "bastonPsicofuerza"] },
    hechiceroFuego:     { nombre: "Hechicero del Fuego Disforme", lider: true, astartes: true, palabras: ["hechicero"], apl: 3, move: 6, save: 3, wounds: 14, armas: ["tormentaFuego", "quemarMente", "pistolaBolterInfierno", "bastonPsicofuerza"] },
    tiradorRubrica:     { nombre: "Tirador Marine Rúbrica", palabras: ["rubrica"], astartes: true, apl: 3, move: 5, save: 2, wounds: 14, armas: ["canonConcentrado", "canonBarrido", "punos"] },
    portaiconoRubrica:  { nombre: "Portaicono Marine Rúbrica", palabras: ["rubrica"], astartes: true, apl: 3, move: 5, save: 2, wounds: 14, armas: ["bolterInfierno", "punos"] },
    combatienteRubrica: { nombre: "Combatiente Marine Rúbrica", palabras: ["rubrica"], astartes: true, apl: 3, move: 5, save: 2, wounds: 14, armas: ["bolterInfierno", "punos"] },
    campeonTzaangor:    { nombre: "Campeón Tzaangor", palabras: ["tzaangor"], apl: 2, move: 6, save: 5, wounds: 10, armas: ["granHacha"] },
    portacuernoTzaangor: { nombre: "Portacuerno Tzaangor", palabras: ["tzaangor"], apl: 2, move: 6, save: 5, wounds: 9, armas: ["daga"] },
    portaiconoTzaangor: { nombre: "Portaicono Tzaangor", palabras: ["tzaangor"], apl: 2, move: 6, save: 5, wounds: 9, armas: ["daga"] },
    combatienteTzaangor: { nombre: "Combatiente Tzaangor", palabras: ["tzaangor"], apl: 2, move: 6, save: 5, wounds: 9, armas: ["armasTzaangor"] },
  },
  // composición (hoja de equipo, revisión más reciente): 5 selecciones; cada Tzaangor cuenta como
  // media selección; al menos un hechicero; cada agente una sola vez salvo los combatientes
  composicion: {
    selecciones: 5,
    medio: ["campeonTzaangor", "portacuernoTzaangor", "portaiconoTzaangor", "combatienteTzaangor"],
    requiere: [{ claves: ["hechiceroDestino", "hechiceroTempireo", "hechiceroFuego"], min: 1, nombre: "Hechicero" }],
    repetibles: ["combatienteRubrica", "combatienteTzaangor"],
  },
  // comando de prueba: dos hechiceros y tres Marines Rúbrica
  plantilla: ["hechiceroDestino", "hechiceroFuego", "tiradorRubrica", "portaiconoRubrica", "combatienteRubrica"],
  // configuraciones de ejemplo (pantallas de inicio); todas cumplen la composición
  ejemplos: [
    { nombre: "Aquelarre", desc: "Dos hechiceros con escolta de Marines Rúbrica y un par de Tzaangor.",
      agentes: ["hechiceroDestino", "hechiceroFuego", "tiradorRubrica", "portaiconoRubrica", "campeonTzaangor", "combatienteTzaangor"] },
    { nombre: "Muro Rúbrica", desc: "Lentos pero muy resistentes (2+): avanzar y aguantar.",
      agentes: ["hechiceroTempireo", "tiradorRubrica", "portaiconoRubrica", "combatienteRubrica", "combatienteRubrica"] },
    { nombre: "Horda Tzaangor", desc: "Ocho Tzaangor rápidos (cada uno cuenta como media selección) y un hechicero.",
      agentes: ["hechiceroDestino", "campeonTzaangor", "portacuernoTzaangor", "portaiconoTzaangor",
        "combatienteTzaangor", "combatienteTzaangor", "combatienteTzaangor", "combatienteTzaangor", "combatienteTzaangor"] },
  ],
};
