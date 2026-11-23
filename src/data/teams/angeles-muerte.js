/**
 * Ángeles de la Muerte (Angels of Death): perfiles de sus agentes y armas, como números.
 * Fuente: reglas de equipo de GW en español (hoja del comando y fichas de datos). Solo datos;
 * nunca texto de reglas. Las reglas de arma van con su nombre canónico en inglés (ver garra-nemesis.js).
 *
 * Los 9 agentes revisados contra sus fichas de datos. Las reglas propias de cada ficha (Líder
 * heroico, Granadero, Capa de camuflaje, Óptica…) y las de facción están en docs/PENDIENTE.md.
 */
const R = (name, atk, hit, dmgN, dmgC, rules = []) => ({ name, type: "R", atk, hit, dmgN, dmgC, rules });
const M = (name, atk, hit, dmgN, dmgC, rules = []) => ({ name, type: "M", atk, hit, dmgN, dmgC, rules });

// combinaciones de arma a distancia y de combate (una opción de cada categoría)
const combinar = (distancia, combate) => distancia.flatMap(([d, nd]) => combate.map(([c, nc]) =>
  ({ id: `${d}+${c}`, nombre: `${nd} y ${nc.charAt(0).toLowerCase()}${nc.slice(1)}`, equipo: [d, c] })));
const COMBATE_SARGENTO = [["armaEnergia", "Arma de energía"], ["espadaSierra", "Espada sierra"],
  ["martilloTrueno", "Martillo de trueno"], ["punoEnergia", "Puño de energía"]];
// el Sargento Intercesor: las mismas armas de combate con 4 ataques en lugar de 5
const COMBATE_INTERCESOR = COMBATE_SARGENTO.map(([k, n]) => [k + "4", n]);

// Tácticas de capítulo (regla de facción): se elige una primaria y una secundaria para el comando.
// ids solo con letras (viajan en las partidas en línea); sus efectos están en src/ui/ardides.js.
export const TACTICAS = [
  { id: "agresivos",  nombre: "Agresivos" },
  { id: "duelistas",  nombre: "Duelistas" },
  { id: "resueltos",  nombre: "Resueltos" },
  { id: "sigilosos",  nombre: "Sigilosos" },
  { id: "moviles",    nombre: "Móviles" },
  { id: "robustos",   nombre: "Robustos" },
  { id: "tiradores",  nombre: "Tiradores certeros" },
  { id: "asedios",    nombre: "Especialistas en asedios" },
];

export default {
  id: "2272196183",                 // modelos azules (Ultramarines) del catálogo de Steam
  nombre: "Ángeles de la Muerte",
  prefijo: "am",
  armas: {
    // fichas del Capitán y del Sargento Intercesor de Asalto
    pistolaBolterPesada: R("Pistola bólter pesada", 4, 3, 3, 4, ['Range 8"', "Piercing Crits 1"]),
    pistolaPlasmaN:      R("Pistola de plasma (normal)", 4, 3, 3, 5, ['Range 8"', "Piercing 1"]),
    pistolaPlasmaS:      R("Pistola de plasma (sobrecarga)", 4, 3, 4, 5, ['Range 8"', "Lethal 5+", "Piercing 1", "Hot"]),
    pistolaLanzallamas:  R("Pistola lanzallamas", 4, 2, 3, 3, ['Range 6"', 'Torrent 1"', "Saturate"]),
    armaEnergia:         M("Arma de energía", 5, 3, 4, 6, ["Lethal 5+"]),
    espadaSierra:        M("Espada sierra", 5, 3, 4, 5),
    martilloTrueno:      M("Martillo de trueno", 5, 4, 5, 6, ["Stun", "Shock"]),
    punoEnergia:         M("Puño de energía", 5, 4, 5, 7, ["Brutal"]),
    punoEnergiaCapitan:  M("Puño de energía", 5, 3, 5, 7, ["Brutal"]),   // el del Capitán impacta a 3+
    // Sargento Intercesor, Tirador Intercesor y Tirador Intercesor Pesado
    rifleBolter:         R("Rifle bólter", 4, 3, 3, 4, ["Piercing Crits 1"]),
    rifleBolterAuto:     R("Rifle bólter automático", 4, 3, 3, 4, ['Torrent 1"']),
    silencioPesado:      R("Rifle bólter silencio (pesado)", 4, 3, 3, 5, ["Piercing Crits 1", "Lethal 5+", "Heavy (Dash only)"]),
    silencioMovil:       R("Rifle bólter silencio (móvil)", 4, 3, 3, 4),
    armaEnergia4:        M("Arma de energía", 4, 3, 4, 6, ["Lethal 5+"]),
    espadaSierra4:       M("Espada sierra", 4, 3, 4, 5),
    martilloTrueno4:     M("Martillo de trueno", 4, 4, 5, 6, ["Stun", "Shock"]),
    punoEnergia4:        M("Puño de energía", 4, 4, 5, 7, ["Brutal"]),
    punos:               M("Puños", 4, 3, 3, 4),
    lanzagranadasFrag:   R("Lanzagranadas auxiliar (frag)", 4, 3, 2, 4, ['Blast 2"']),
    lanzagranadasPerf:   R("Lanzagranadas auxiliar (perforante)", 4, 3, 4, 5, ["Piercing 1"]),
    bolterPesadoC:       R("Bólter pesado (concentrado)", 5, 3, 4, 5, ["Piercing Crits 1"]),
    bolterPesadoB:       R("Bólter pesado (barrido)", 4, 3, 4, 5, ["Piercing Crits 1", 'Torrent 1"']),
    pistolaBolter:       R("Pistola bólter", 4, 3, 3, 4, ['Range 8"']),
    // Francotirador Eliminador
    francoEjecutor:      R("Rifle bólter de francotirador (ejecutor)", 4, 2, 3, 4, ["Seek Light", "Heavy (Dash only)", "Saturate", "Silent"]),
    francoHiperfrag:     R("Rifle bólter de francotirador (hiperfrag)", 4, 2, 2, 4, ['Blast 1"', "Heavy (Dash only)", "Silent"]),
    francoMortis:        R("Rifle bólter de francotirador (mortis)", 4, 2, 3, 3, ["Devastating 3", "Piercing 1", "Heavy (Dash only)", "Silent"]),
  },
  // Astartes (regla de facción): dos Disparar (al menos uno con un arma bólter) o dos Combatir;
  // con estas armas, el segundo disparo con la misma cuesta 1 PA más
  astartesBolter: true,
  armasPesadasAstartes: ["francoEjecutor", "francoHiperfrag", "francoMortis", "bolterPesadoC", "bolterPesadoB"],
  tacticas: TACTICAS,
  // Opciones de arma de la hoja del comando (equipo: las armas que lleva en lugar de las de su ficha)
  elecciones: [{
    // Veterano del Capítulo (Sargentos): una táctica de capítulo adicional solo para este agente
    id: "veterano", agentes: ["sargentoAsalto", "sargentoIntercesor"],
    opciones: TACTICAS.map(t => ({ id: t.id, nombre: t.nombre, tactica: t.id })),
  }, {
    id: "armasSargentoAsalto", agentes: ["sargentoAsalto"],
    opciones: [
      ...combinar([["pistolaBolterPesada", "Pistola bólter pesada"], ["pistolaLanzallamas", "Pistola lanzallamas"]], COMBATE_SARGENTO),
      { id: "plasma+espadaSierra", nombre: "Pistola de plasma y espada sierra", equipo: ["pistolaPlasmaN", "pistolaPlasmaS", "espadaSierra"] },
    ],
  }, {
    id: "armasSargento", agentes: ["sargentoIntercesor"],
    opciones: combinar([["rifleBolterAuto", "Rifle bólter automático"], ["rifleBolter", "Rifle bólter"],
      ["silencio", "Rifle bólter silencio"]], COMBATE_INTERCESOR)
      .map(o => ({ ...o, equipo: o.equipo.flatMap(k => k === "silencio" ? ["silencioPesado", "silencioMovil"] : [k]) })),
  }, {
    id: "armasTiradorIntercesor", agentes: ["tiradorIntercesor"],
    opciones: [
      { id: "auto",     nombre: "Rifle bólter automático", equipo: ["lanzagranadasFrag", "lanzagranadasPerf", "rifleBolterAuto", "punos"] },
      { id: "bolter",   nombre: "Rifle bólter",            equipo: ["lanzagranadasFrag", "lanzagranadasPerf", "rifleBolter", "punos"] },
      { id: "silencio", nombre: "Rifle bólter silencio",   equipo: ["lanzagranadasFrag", "lanzagranadasPerf", "silencioPesado", "silencioMovil", "punos"] },
    ],
  }, {
    id: "armasCombatienteIntercesor", agentes: ["combatienteIntercesor"],
    opciones: [
      { id: "auto",     nombre: "Rifle bólter automático y puños", equipo: ["rifleBolterAuto", "punos"] },
      { id: "bolter",   nombre: "Rifle bólter y puños",            equipo: ["rifleBolter", "punos"] },
      { id: "silencio", nombre: "Rifle bólter silencio y puños",   equipo: ["silencioPesado", "silencioMovil", "punos"] },
    ],
  }],
  // apl, move (″), save (+), wounds; armas: claves de arriba (la primera es la que lleva en mano)
  agentes: {
    // habilidades: reglas que preguntan al jugador en una ventana (ver src/ui/ardides.js, habilidadesDe).
    //   id: clave del texto en T.habilidades · cuando: momento en que se ofrece (danoNormal: un dado de
    //   ataque normal va a hacerle daño) · ventana: tipo de pregunta (siNo) · usos: "batalla" = una vez
    capitan:               { nombre: "Capitán Marine Espacial", lider: true, astartes: true, apl: 3, move: 6, save: 3, wounds: 15, armas: ["pistolaPlasmaN", "pistolaPlasmaS", "punoEnergiaCapitan"],
      habilidades: [{ id: "aura", cuando: "danoNormal", ventana: "siNo", usos: "batalla" }] },
    sargentoAsalto:        { nombre: "Sargento Intercesor de Asalto", lider: true, astartes: true, apl: 3, move: 6, save: 3, wounds: 15, armas: ["pistolaBolterPesada", "espadaSierra"] },
    tiradorPesado:         { nombre: "Tirador Intercesor Pesado", astartes: true, apl: 3, move: 5, save: 3, wounds: 18, armas: ["bolterPesadoC", "bolterPesadoB", "pistolaBolter", "punos"] },
    tiradorIntercesor:     { nombre: "Tirador Intercesor", astartes: true, apl: 3, move: 6, save: 3, wounds: 14, armas: ["lanzagranadasFrag", "lanzagranadasPerf", "rifleBolter", "punos"] },
    sargentoIntercesor:    { nombre: "Sargento Intercesor", lider: true, astartes: true, apl: 3, move: 6, save: 3, wounds: 15, armas: ["rifleBolter", "espadaSierra4"] },
    // Granadero: también usa granadas frag y perforantes del equipo universal, con +1 a Impactar (pendiente)
    granaderoAsalto:       { nombre: "Granadero Intercesor de Asalto", astartes: true, apl: 3, move: 6, save: 3, wounds: 14, armas: ["pistolaBolterPesada", "espadaSierra"] },
    combatienteAsalto:     { nombre: "Combatiente Intercesor de Asalto", astartes: true, apl: 3, move: 6, save: 3, wounds: 14, armas: ["pistolaBolterPesada", "espadaSierra"] },
    // Capa de camuflaje y la acción Óptica: pendientes (ver docs/PENDIENTE.md)
    francotirador:         { nombre: "Francotirador Eliminador", astartes: true, apl: 3, move: 7, save: 3, wounds: 12, armas: ["francoEjecutor", "francoHiperfrag", "francoMortis", "pistolaBolter", "punos"] },
    combatienteIntercesor: { nombre: "Combatiente Intercesor", astartes: true, apl: 3, move: 6, save: 3, wounds: 14, armas: ["rifleBolter", "punos"] },
  },
  // composición (hoja del comando): 1 líder y 5 agentes de la lista; cada uno una sola vez salvo
  // los combatientes
  composicion: {
    selecciones: 6,
    requiere: [{ claves: ["sargentoAsalto", "sargentoIntercesor", "capitan"], min: 1, max: 1, nombre: "Líder" }],
    repetibles: ["combatienteAsalto", "combatienteIntercesor"],
  },
  plantilla: ["sargentoIntercesor", "tiradorIntercesor", "combatienteIntercesor", "combatienteIntercesor", "tiradorPesado", "francotirador"],
  ejemplos: [
    { nombre: "Línea de bólteres", desc: "Disparar desde la cobertura con rifles bólter y apoyo pesado.",
      agentes: ["sargentoIntercesor", "tiradorIntercesor", "combatienteIntercesor", "combatienteIntercesor", "tiradorPesado", "francotirador"] },
    { nombre: "Asalto", desc: "Avanzar rápido y trabarse en combate con los Intercesores de Asalto.",
      agentes: ["sargentoAsalto", "granaderoAsalto", "combatienteAsalto", "combatienteAsalto", "combatienteAsalto", "tiradorIntercesor"] },
    { nombre: "Capitán", desc: "El Capitán al frente de un comando mixto.",
      agentes: ["capitan", "granaderoAsalto", "combatienteAsalto", "tiradorIntercesor", "tiradorPesado", "francotirador"] },
  ],
};
