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
    armaEscudo:           M("Arma y escudo de Tzaangor", 4, 4, 3, 4, ["Shield*"]),
    armasTzaangor:        M("Armas de Tzaangor", 4, 4, 4, 5, ["Balanced"]),
  },
  agentes: {
    hechiceroDestino:   { nombre: "Hechicero del Destino", lider: true, apl: 3, move: 6, save: 3, wounds: 14, armas: ["proyectilCondenacion", "pistolaBolterInfierno", "bastonPsicofuerza"] },
    hechiceroTempireo:  { nombre: "Hechicero Tempíreo", lider: true, apl: 3, move: 6, save: 3, wounds: 14, armas: ["descargaFlujo", "pistolaBolterInfierno", "bastonPsicofuerza"] },
    hechiceroFuego:     { nombre: "Hechicero del Fuego Disforme", lider: true, apl: 3, move: 6, save: 3, wounds: 14, armas: ["tormentaFuego", "quemarMente", "pistolaBolterInfierno", "bastonPsicofuerza"] },
    tiradorRubrica:     { nombre: "Tirador Marine Rúbrica", apl: 3, move: 5, save: 2, wounds: 14, armas: ["canonConcentrado", "canonBarrido", "punos"] },
    portaiconoRubrica:  { nombre: "Portaicono Marine Rúbrica", apl: 3, move: 5, save: 2, wounds: 14, armas: ["bolterInfierno", "punos"] },
    combatienteRubrica: { nombre: "Combatiente Marine Rúbrica", apl: 3, move: 5, save: 2, wounds: 14, armas: ["bolterInfierno", "punos"] },
    campeonTzaangor:    { nombre: "Campeón Tzaangor", apl: 2, move: 6, save: 5, wounds: 10, armas: ["granHacha"] },
    portacuernoTzaangor: { nombre: "Portacuerno Tzaangor", apl: 2, move: 6, save: 5, wounds: 9, armas: ["daga"] },
    portaiconoTzaangor: { nombre: "Portaicono Tzaangor", apl: 2, move: 6, save: 5, wounds: 9, armas: ["daga"] },
    combatienteTzaangor: { nombre: "Combatiente Tzaangor", apl: 2, move: 6, save: 5, wounds: 9, armas: ["armasTzaangor"] },
  },
  // comando de prueba: dos hechiceros, tres Marines Rúbrica y un campeón Tzaangor
  plantilla: ["hechiceroDestino", "hechiceroFuego", "tiradorRubrica", "portaiconoRubrica", "combatienteRubrica", "campeonTzaangor"],
};
