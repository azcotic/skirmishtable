/**
 * Nombres propios en español oficial: comandos, agentes y armas de los comandos de prueba
 * (Garra Némesis y Aquelarre Disforme; también Ángeles de la Muerte, para más adelante),
 * tal como aparecen en sus reglas de equipo de GW en español (02/10/2024).
 * Solo nombres (son marcas de GW que usamos para decir con qué funciona la app); nunca
 * texto de reglas.
 *
 * El catálogo de Steam (src/data/tts-teams.js, generado) trae los nombres de los mods en
 * inglés y con variantes ("Rubric Gunner (Warpflamer)", "Tzaangor Horn Blower"…):
 * nombreES() los pasa al nombre oficial y traducirCatalogo() lo aplica al arrancar.
 */

export const COMANDOS = {
  'Angels of Death': 'Ángeles de la Muerte',
  'Warpcoven': 'Aquelarre Disforme',
  'Nemesis Claw': 'Garra Némesis',
};

export const AGENTES = {
  // Ángeles de la Muerte
  'Space Marine Captain': 'Capitán Marine Espacial',
  'Assault Intercessor Sergeant': 'Sargento Intercesor de Asalto',
  'Intercessor Sergeant': 'Sargento Intercesor',
  'Assault Intercessor Grenadier': 'Granadero Intercesor de Asalto',
  'Assault Intercessor Warrior': 'Combatiente Intercesor de Asalto',
  'Eliminator Sniper': 'Francotirador Eliminador',
  'Heavy Intercessor Gunner': 'Tirador Intercesor Pesado',
  'Intercessor Gunner': 'Tirador Intercesor',
  'Intercessor Warrior': 'Combatiente Intercesor',
  // Aquelarre Disforme
  'Sorcerer of Destiny': 'Hechicero del Destino',
  'Sorcerer of Tempyrion': 'Hechicero Tempíreo',
  'Sorcerer of Warpfire': 'Hechicero del Fuego Disforme',
  'Rubric Marine Gunner': 'Tirador Marine Rúbrica',
  'Rubric Marine Icon Bearer': 'Portaicono Marine Rúbrica',
  'Rubric Marine Warrior': 'Combatiente Marine Rúbrica',
  'Tzaangor Champion': 'Campeón Tzaangor',
  'Tzaangor Horn Bearer': 'Portacuerno Tzaangor',
  'Tzaangor Icon Bearer': 'Portaicono Tzaangor',
  'Tzaangor Warrior': 'Combatiente Tzaangor',
  // Garra Némesis
  'Visionary': 'Visionario',
  'Fearmonger': 'Siembramiedos',
  'Gunner': 'Tirador',
  'Heavy Gunner': 'Tirador pesado',
  'Screecher': 'Aullador',
  'Skinthief': 'Robapieles',
  'Ventrilokar': 'Ventrilokar',
  'Night Lord Warrior': 'Combatiente',
};

// variantes con que los mods de Steam nombran a los mismos agentes
const ALIAS = {
  'Rubric Gunner': 'Rubric Marine Gunner',
  'Rubric Icon Bearer': 'Rubric Marine Icon Bearer',
  'Tzaangor Horn Blower': 'Tzaangor Horn Bearer',
};

export const ARMAS = {
  // Ángeles de la Muerte
  'Bolt rifle': 'Rifle bólter',
  'Auto bolt rifle': 'Rifle bólter automático',
  'Stalker bolt rifle': 'Rifle bólter silencio',
  'Heavy bolt pistol': 'Pistola bólter pesada',
  'Hand flamer': 'Pistola lanzallamas',
  'Plasma pistol': 'Pistola de plasma',
  'Auxiliary grenade launcher': 'Lanzagranadas auxiliar',
  'Chainsword': 'Espada sierra',
  'Power fist': 'Puño de energía',
  'Power weapon': 'Arma de energía',
  'Thunder hammer': 'Martillo de trueno',
  'Fists': 'Puños',
  // Aquelarre Disforme
  'Inferno bolt pistol': 'Pistola bólter infierno',
  'Prosperine khopesh': 'Khopesh prosperiano',
  'Warpflame pistol': 'Pistola de llamas disformes',
  'Warpflamer': 'Lanzallamas disforme',
  'Soulreaper cannon': 'Cañón cosechaalmas',
  'Greataxe': 'Gran hacha',
  'Greatblade': 'Espadón',
  'Tzaangor blades': 'Armas de Tzaangor',
  'Tzaangor blade & shield': 'Arma y escudo de Tzaangor',
  'Autopistol': 'Pistola automática',
  // Garra Némesis
  'Bolt pistol': 'Pistola bólter',
  'Boltgun': 'Bólter',
  'Power maul': 'Maza de energía',
  'Nostraman chainblade': 'Cuchilla sierra de Nostramo',
  'Flamer': 'Lanzallamas',
  'Meltagun': 'Rifle de fusión',
  'Plasma gun': 'Rifle de plasma',
  'Heavy bolter': 'Bólter pesado',
  'Missile launcher': 'Lanzamisiles',
  // como las abrevian los mods entre paréntesis
  'Blades': 'Armas',
  'Blade & Shield': 'Arma y escudo',
};

// detalles entre paréntesis en los nombres de los mods que no son armas
const DETALLES = {
  'Space Marine 2 Models': 'modelos de Space Marine 2',
};

const buscar = (tabla, s) => {
  const k = Object.keys(tabla).find(x => x.toLowerCase() === s.trim().toLowerCase());
  return k ? tabla[k] : null;
};
const unaArma = s => buscar(ARMAS, s) || s.trim();

// "Rubric Gunner (Warpflamer)" -> "Tirador Marine Rúbrica (Lanzallamas disforme)".
// Lo que no reconoce lo devuelve igual.
export function nombreES(en) {
  if (typeof en !== 'string' || !en) return en;
  const directo = buscar(COMANDOS, en) || buscar(AGENTES, ALIAS[en.trim()] || en) || buscar(ARMAS, en);
  if (directo) return directo;
  const m = /^(.*?)\s*\((.+)\)\s*$/.exec(en);
  if (!m) return en;
  const base = nombreES(m[1]);
  const detalle = buscar(DETALLES, m[2]) || buscar(ARMAS, m[2]) || m[2].split(/\s*&\s*/).map(unaArma)
    .map((s, i) => i ? s.toLowerCase() : s).join(' y ');
  return `${base} (${detalle})`;
}

// Pasa a español, una sola vez al arrancar, los nombres del catálogo de equipos de Steam.
// Se cambia en el lugar: el resto de la app compara nombres del mismo catálogo.
export function traducirCatalogo(equipos) {
  for (const t of equipos) {
    t.name = nombreES(t.name);
    for (const m of t.models || []) m.name = nombreES(m.name);
  }
  return equipos;
}
