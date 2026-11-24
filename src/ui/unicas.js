/**
 * Efectos de las acciones únicas psíquicas del Aquelarre Disforme sobre las tiradas
 * (reglas y números en src/game/unicas.js; la acción se realiza desde la ficha, panels.js).
 */
import { ajustesArma, repiteDefensa, repiteSeises } from '../engine/dice.js';
import { OPS } from '../engine/world.js';
import { efectoEn } from '../game/unicas.js';

repiteDefensa.push(b => !!efectoEn(b, 'proteccionDestino', OPS));   // Protección del destino
repiteSeises.push(a => !!efectoEn(a, 'saboteaDestino', OPS));       // Sabotear destino

// Prender: las armas de los agentes del bando que lo puso, contra el enemigo marcado, tienen Incesante
ajustesArma.push((w, a, b) => {
  if (!w || !a || !b) return w;
  const fx = efectoEn(b, 'prender', OPS);
  if (!fx) return w;
  const dueno = OPS.find(o => o.id === fx.de);
  if (!dueno || dueno.team !== a.team || w.rules.includes('Ceaseless')) return w;
  return { ...w, rules: [...w.rules, 'Ceaseless'] };
});
