/**
 * Saurios de Lustria: comando casero (homebrew) hecho por la comunidad, basado en los Seraphon
 * de Age of Sigmar. No es un comando oficial de Kill Team: sus perfiles son de diseño propio.
 * Por ahora solo datos: atributos y armas de cada agente, como números, y la composición del
 * comando. Sin habilidades ni reglas de facción. Las reglas de arma van con su nombre canónico
 * en inglés (ver garra-nemesis.js).
 * Los modelos 3D vienen del catálogo de Steam (src/data/tts-teams.js, id "3272457903": Malkavichs Model Updates (Age of Sigmar 4.0)).
 */
const R = (name, atk, hit, dmgN, dmgC, rules = []) => ({ name, type: "R", atk, hit, dmgN, dmgC, rules });
const M = (name, atk, hit, dmgN, dmgC, rules = []) => ({ name, type: "M", atk, hit, dmgN, dmgC, rules });

export default {
  id: "3272457903",        // id en el catálogo (src/data/tts-teams.js): Malkavichs Model Updates (Age of Sigmar 4.0)
  nombre: "Saurios de Lustria",
  prefijo: "sl",
  armas: {
    jabalinaEstelar:  R("Jabalina estelar", 4, 3, 3, 4, ['Range 6"', "Limited 1"]),
    espadaCelestita:  M("Espada de celestita", 5, 3, 4, 6, ["Brutal"]),
    rayoAstral:       R("Rayo astral", 4, 3, 3, 5, ['Range 8"']),
    dagaObsidiana:    M("Daga de obsidiana", 3, 4, 2, 4),
    lanzaCelestita:   M("Lanza de celestita", 5, 3, 4, 5, ["Balanced"]),
    mazaCelestita:    M("Maza de celestita", 4, 3, 4, 6, ["Brutal"]),
    alabarda:         M("Alabarda de celestita", 4, 3, 4, 5, ["Lethal 5+"]),
    martilloLunar:    M("Martillo lunar", 5, 3, 5, 7, ["Brutal", "Stun"]),
    escupedardos:     R("Escupedardos", 4, 4, 3, 4),
    jabalinas:        R("Jabalinas", 4, 4, 3, 4, ['Range 8"', "Silent"]),
    daga:             M("Daga", 3, 5, 2, 3),
    cerbatana:        R("Cerbatana venenosa", 5, 3, 2, 4, ['Range 8"', "Silent", "Lethal 5+"]),
    dagaCamaleon:     M("Daga", 3, 4, 2, 3),
    baculoDistancia:  R("Báculo celestial", 4, 3, 3, 4),
    baculoCuerpo:     M("Báculo celestial", 3, 4, 2, 3),
  },
  // Elección de equipo (no de reglas): el arma con que se elige al agente, como la hoja de equipo
  elecciones: [{
    id: "armasEscamadura", agentes: ["saurioEscamadura"],
    opciones: [
      { id: "jabalina",  nombre: "Jabalina estelar y espada de celestita", equipo: ["jabalinaEstelar", "espadaCelestita"] },
      { id: "estandarte", nombre: "Estandarte de guerra y espada de celestita", equipo: ["espadaCelestita"] },
    ],
  }, {
    id: "armasCombatienteSaurio", agentes: ["combatienteSaurio"],
    opciones: [
      { id: "lanza", nombre: "Lanza de celestita", equipo: ["lanzaCelestita"] },
      { id: "maza",  nombre: "Maza de celestita",  equipo: ["mazaCelestita"] },
    ],
  }, {
    id: "armasCombatienteEslizon", agentes: ["combatienteEslizon"],
    opciones: [
      { id: "escupedardos", nombre: "Escupedardos", equipo: ["escupedardos", "daga"] },
      { id: "jabalinas",    nombre: "Jabalinas",    equipo: ["jabalinas", "daga"] },
    ],
  }],
  // peana (mm): Eslizones 28, Saurios 32 y Kroxigor 40; manda sobre la que mide la app en la miniatura
  agentes: {
    saurioEscamadura:   { nombre: "Saurio Escamadura", lider: true, palabras: ["saurio"], peana: 32, apl: 3, move: 6, save: 4, wounds: 14, armas: ["jabalinaEstelar", "espadaCelestita"] },
    sacerdoteEstelar:   { nombre: "Sacerdote Estelar Eslizón", lider: true, palabras: ["eslizon", "sacerdote"], peana: 28, apl: 3, move: 7, save: 5, wounds: 10, armas: ["rayoAstral", "dagaObsidiana"] },
    combatienteSaurio:  { nombre: "Combatiente Saurio", palabras: ["saurio"], peana: 32, apl: 2, move: 6, save: 4, wounds: 12, armas: ["lanzaCelestita"] },
    guardiaSaurio:      { nombre: "Guardia Saurio", palabras: ["saurio"], peana: 32, apl: 2, move: 6, save: 3, wounds: 12, armas: ["alabarda"] },
    kroxigor:           { nombre: "Kroxigor", palabras: ["kroxigor"], peana: 40, apl: 2, move: 6, save: 4, wounds: 18, armas: ["martilloLunar"] },
    combatienteEslizon: { nombre: "Combatiente Eslizón", palabras: ["eslizon"], peana: 28, apl: 2, move: 7, save: 5, wounds: 7, armas: ["escupedardos", "daga"] },
    camaleon:           { nombre: "Eslizón Camaleón", palabras: ["eslizon"], peana: 28, apl: 2, move: 7, save: 5, wounds: 8, armas: ["cerbatana", "dagaCamaleon"] },
    sacerdoteEslizon:   { nombre: "Sacerdote Eslizón", palabras: ["eslizon", "sacerdote"], peana: 28, apl: 2, move: 7, save: 5, wounds: 8, armas: ["baculoDistancia", "baculoCuerpo"] },
  },
  // composición: 1 líder y 6 selecciones más (7 en total, contando al líder). Cada Eslizón cuenta
  // como media selección y cada Kroxigor como dos (como máximo 2). Hasta 10 Eslizones además del líder.
  // Salvo los Combatientes y los Kroxigor, cada agente una sola vez.
  composicion: {
    selecciones: 7,
    medio: ["sacerdoteEstelar", "combatienteEslizon", "camaleon", "sacerdoteEslizon"],
    doble: ["kroxigor"],
    requiere: [
      { claves: ["saurioEscamadura", "sacerdoteEstelar"], min: 1, max: 1, nombre: "Líder" },
      { claves: ["kroxigor"], min: 0, max: 2, nombre: "Kroxigor" },
      { claves: ["combatienteEslizon", "camaleon", "sacerdoteEslizon"], min: 0, max: 10, nombre: "Eslizón", plural: "Eslizones" },
    ],
    repetibles: ["combatienteSaurio", "kroxigor", "combatienteEslizon"],
  },
  // comando de prueba: la lista A (asalto equilibrado)
  plantilla: ["saurioEscamadura", "kroxigor", "combatienteSaurio", "combatienteSaurio", "camaleon",
    "combatienteEslizon", "combatienteEslizon", "combatienteEslizon"],
  // los tres tipos de comando de ejemplo (pantallas de inicio); todos cumplen la composición
  ejemplos: [
    { nombre: "Asalto equilibrado", desc: "Un Kroxigor y dos Combatientes Saurio al frente, con un Camaleón y tres Eslizones de apoyo.",
      agentes: ["saurioEscamadura", "kroxigor", "combatienteSaurio", "combatienteSaurio", "camaleon",
        "combatienteEslizon", "combatienteEslizon", "combatienteEslizon"] },
    { nombre: "Doble Kroxigor", desc: "Dos Kroxigor como martillo, con un Camaleón, un Sacerdote y dos Eslizones.",
      agentes: ["saurioEscamadura", "kroxigor", "kroxigor", "camaleon", "sacerdoteEslizon",
        "combatienteEslizon", "combatienteEslizon"] },
    { nombre: "Enjambre de Eslizones", desc: "Diez Eslizones rápidos (cada uno cuenta como media selección) y una Guardia Saurio de escolta.",
      agentes: ["saurioEscamadura", "guardiaSaurio", "camaleon", "sacerdoteEslizon",
        "combatienteEslizon", "combatienteEslizon", "combatienteEslizon", "combatienteEslizon",
        "combatienteEslizon", "combatienteEslizon", "combatienteEslizon", "combatienteEslizon"] },
  ],
};
