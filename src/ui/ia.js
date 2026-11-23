/**
 * La IA en la interfaz. Por ahora, "¿Qué haría la IA?": la IA fácil (src/ai/facil.js) propone
 * una activación para el bando al que le toca y la muestra (selecciona al agente, marca su
 * blanco, destella su destino en el mapa 2D) y explica el porqué; no la ejecuta.
 * Siguiente paso: que la ejecute sola en el modo "Contra la computadora" (docs/IA.md §5).
 */
import { T } from '../i18n/es.js';
import { TEAMNAME, WPN } from '../config.js';
import { OPS } from '../engine/world.js';
import { state } from '../state.js';
import { decidirActivacion } from '../ai/facil.js';
import { turnoDeActivacion } from '../game/acciones.js';
import { refreshSight, tray, ultimoBando } from './panels.js';
import { flashOp2D, renderAll } from './board.js';
import { hint, logLine } from './dom.js';
import { queEs } from './despliegue.js';

const nombre = op => `${op.id} ${queEs(op)}`;

// El texto que explica un plan
export function explicar(plan) {
  const P = T.ia.plan, r = plan.razon || {}, op = nombre(plan.op), b = r.blanco ? nombre(r.blanco) : "";
  const arma = r.arma && WPN[r.arma] ? WPN[r.arma].name : "";
  let t;
  switch (plan.tipo) {
    case "disparar": t = P.disparar(op, b, arma, r.esperado, r.incapacitar); break;
    case "moverYDisparar": t = P.moverYDisparar(op, b, arma, r.esperado, r.incapacitar); break;
    case "cargar": t = P.cargar(op, b, r.esperado, r.incapacitar, r.recibido); break;
    case "combatir": t = P.combatir(op, b, r.esperado, r.incapacitar, r.recibido); break;
    case "objetivo": t = P.objetivo(op); break;
    case "cubrirse": t = P.cubrirse(op); break;
    default: t = P.esperar(op);
  }
  if (r.riesgo) t += T.ia.riesgo(r.riesgo.carga, r.riesgo.expuesto);
  return t;
}

// A qué bando le toca activar ahora
export const bandoEnTurno = () => turnoDeActivacion(OPS, tray.ini ?? 0, ultimoBando);

export function sugerir() {
  const bando = bandoEnTurno();
  const plan = bando === null ? null : decidirActivacion(bando);
  if (!plan) { hint(T.ia.sinPlan); return null; }
  state.sel = plan.op;
  const ataque = plan.pasos.find(p => p.blanco);
  state.target = ataque ? ataque.blanco : null;
  if (ataque && ataque.arma) plan.op.weapon = ataque.arma;
  refreshSight();
  renderAll();
  const texto = explicar(plan);
  hint(texto);
  logLine(T.ia.log(TEAMNAME[bando], texto));
  const mov = plan.pasos.find(p => p.x !== undefined);
  if (mov) flashOp2D({ ...plan.op, x: mov.x, y: mov.y });
  return plan;
}

export function wireIA() {
  const b = document.getElementById("iasugerir");
  if (b) b.onclick = () => sugerir();
}
