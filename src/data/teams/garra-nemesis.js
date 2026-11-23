/**
 * Garra Némesis (Nemesis Claw, Night Lords): perfiles de sus agentes y armas, como números.
 * Fuente: reglas de equipo de GW en español e inglés (02/10/2024). Solo datos (atributos,
 * ATAQ./IMP./DAÑO y el nombre de cada regla de arma); nunca texto de reglas.
 * Las reglas de arma van con su nombre canónico en inglés (lo que entiende el motor); la
 * interfaz las muestra en español (src/i18n/es.js, REGLAS_ARMA).
 */
const R = (name, atk, hit, dmgN, dmgC, rules = []) => ({ name, type: "R", atk, hit, dmgN, dmgC, rules });
const M = (name, atk, hit, dmgN, dmgC, rules = []) => ({ name, type: "M", atk, hit, dmgN, dmgC, rules });

export default {
  id: "3352828814",                 // id del mod en el catálogo de Steam (src/data/tts-teams.js)
  nombre: "Garra Némesis",
  prefijo: "gn",
  armas: {
    pistolaBolter:    R("Pistola bólter", 4, 3, 3, 4, ['Range 8"']),
    pistolaPlasmaN:   R("Pistola de plasma (normal)", 4, 3, 3, 5, ['Range 8"', "Piercing 1"]),
    pistolaPlasmaS:   R("Pistola de plasma (sobrecarga)", 4, 3, 4, 5, ['Range 8"', "Hot", "Lethal 5+", "Piercing 1"]),
    mirillaCorto:     R("Pistola bólter con mirilla (corto alcance)", 4, 3, 3, 4, ['Range 8"', "Lethal 5+"]),
    mirillaLargo:     R("Pistola bólter con mirilla (largo alcance)", 4, 3, 3, 4),
    vialTerrotoxinas: R("Vial de terrotoxinas", 5, 3, 2, 0, ['Range 6"', 'Blast 2"', "Devastating 3", "Limited 1", "Saturate", "Terrorchem*"]),
    lanzallamas:      R("Lanzallamas", 4, 2, 3, 3, ['Range 8"', "Saturate", 'Torrent 2"']),
    rifleFusion:      R("Rifle de fusión", 4, 3, 6, 3, ['Range 6"', "Devastating 4", "Piercing 2"]),
    riflePlasmaN:     R("Rifle de plasma (normal)", 4, 3, 4, 6, ["Piercing 1"]),
    riflePlasmaS:     R("Rifle de plasma (sobrecarga)", 4, 3, 5, 6, ["Hot", "Lethal 5+", "Piercing 1"]),
    bolterPesadoC:    R("Bólter pesado (concentrado)", 5, 3, 4, 5, ["Heavy (Reposition only)", "Piercing Crits 1"]),
    bolterPesadoB:    R("Bólter pesado (barrido)", 4, 3, 4, 5, ["Heavy (Reposition only)", "Piercing Crits 1", 'Torrent 1"']),
    lanzamisilesF:    R("Lanzamisiles (frag)", 4, 3, 3, 5, ['Blast 2"', "Heavy (Reposition only)"]),
    lanzamisilesP:    R("Lanzamisiles (perforante)", 4, 3, 5, 7, ["Heavy (Reposition only)", "Piercing 1"]),
    bolter:           R("Bólter", 4, 3, 3, 4),
    cuchillaSierra:   M("Cuchilla sierra de Nostramo", 5, 3, 4, 5, ["Rending"]),
    filoContaminado:  M("Filo contaminado", 5, 3, 3, 5, ["Terrorchem*"]),
    archaSierra:      M("Archa sierra de Nostramo", 5, 3, 4, 6, ["Rending"]),
    punoEnergia:      M("Puño de energía", 5, 4, 5, 7, ["Brutal"]),
    mazaEnergia:      M("Maza de energía", 5, 3, 4, 6, ["Shock"]),
    armaEnergia:      M("Arma de energía", 5, 3, 4, 6, ["Lethal 5+"]),
    garrasRelampago:  M("Garras relámpago", 5, 3, 4, 5, ["Ceaseless", "Lethal 5+"]),
    espadaSierra:     M("Espada sierra", 5, 3, 4, 5),
    punos:            M("Puños", 4, 3, 3, 4),
  },
  // apl, move (″), save (+), wounds; armas: claves de arriba (la primera es la que lleva en mano)
  agentes: {
    visionario:    { nombre: "Visionario", lider: true, apl: 3, move: 6, save: 3, wounds: 15, armas: ["pistolaBolter", "armaEnergia"] },
    siembramiedos: { nombre: "Siembramiedos", apl: 3, move: 6, save: 3, wounds: 14, armas: ["mirillaCorto", "mirillaLargo", "vialTerrotoxinas", "filoContaminado"] },
    tirador:       { nombre: "Tirador", apl: 3, move: 6, save: 3, wounds: 14, armas: ["riflePlasmaN", "riflePlasmaS", "pistolaBolter", "punos"] },
    tiradorPesado: { nombre: "Tirador pesado", apl: 3, move: 6, save: 3, wounds: 14, armas: ["bolterPesadoC", "bolterPesadoB", "pistolaBolter", "punos"] },
    aullador:      { nombre: "Aullador", apl: 3, move: 6, save: 3, wounds: 14, armas: ["garrasRelampago"] },
    robapieles:    { nombre: "Robapieles", apl: 3, move: 6, save: 3, wounds: 14, armas: ["pistolaBolter", "archaSierra"] },
    ventrilokar:   { nombre: "Ventrilokar", apl: 3, move: 6, save: 3, wounds: 14, armas: ["pistolaBolter", "espadaSierra"] },
    combatiente:   { nombre: "Combatiente", apl: 3, move: 6, save: 3, wounds: 14, armas: ["pistolaBolter", "espadaSierra"] },
  },
  // composición: 6 agentes, el Visionario y 5 más; cada uno una sola vez salvo el Combatiente
  composicion: {
    selecciones: 6,
    requiere: [{ claves: ["visionario"], min: 1, nombre: "Visionario" }],
    repetibles: ["combatiente"],
  },
  // el comando de prueba: el Visionario y 5 agentes de la lista (cada uno una vez)
  plantilla: ["visionario", "siembramiedos", "tirador", "tiradorPesado", "aullador", "robapieles"],
  // configuraciones de ejemplo (pantallas de inicio); todas cumplen la composición
  ejemplos: [
    { nombre: "Equilibrada", desc: "Un poco de todo: disparo, combate y control.",
      agentes: ["visionario", "siembramiedos", "tirador", "tiradorPesado", "aullador", "robapieles"] },
    { nombre: "Asalto", desc: "Cargar y despedazar: agentes de combate cuerpo a cuerpo.",
      agentes: ["visionario", "aullador", "robapieles", "ventrilokar", "combatiente", "combatiente"] },
    { nombre: "Fuego de apoyo", desc: "Disparar desde lejos y cubrirse.",
      agentes: ["visionario", "tirador", "tiradorPesado", "siembramiedos", "combatiente", "ventrilokar"] },
  ],
};
