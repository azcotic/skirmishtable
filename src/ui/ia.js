/**
 * La IA en la interfaz (docs/IA.md §5).
 * - "¿Qué haría la IA?": propone una activación para el bando al que le toca y la muestra.
 * - "Contra la computadora" (pantallas de inicio): cuando le toca al bando de la IA, juega su
 *   activación sola: piensa, anuncia qué hará y por qué, fija la orden y ejecuta cada paso con
 *   una pausa (moverA, doShoot, doFight: los mismos caminos que un jugador, con registro y
 *   deshacer) y termina su activación. Si el humano ya no tiene agentes apostados, sigue.
 */
import { T } from '../i18n/es.js';
import { TEAMNAME, WPN } from '../config.js';
import { OPS } from '../engine/world.js';
import { state } from '../state.js';
import { decidirActivacion } from '../ai/facil.js';
import { doFight, doShoot, endActivation, refreshSight, snapshot } from './panels.js';
import { moverA } from './input.js';
import { iniciarReaccion, pasar, reaccionables, ventanaReaccion } from './reaccion.js';
import { mejorDisparo } from '../ai/facil.js';
import { control, esDeLaIA } from './control.js';
import { bandoEnTurno } from './turno.js';
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
  const O = T.puntosObjetivos.ia, v = r.obj;
  if (v) {
    if (v.ganan) t += O.ganar(v.ganan);
    if (v.pierden) t += O.perder(v.pierden);
    if (v.disputa) t += O.disputar;
  }
  if (r.romper) t += O.romper;
  if (plan.tipo === "esperar" && r.sostiene) t += O.sostener;
  else if (plan.tipo === "objetivo" && v && v.sostiene) t += O.sostener;
  return t;
}


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

const esperar = ms => new Promise(r => setTimeout(r, ms));
let enCurso = false;

// Juega la activación de la IA si le toca a su bando.
export async function jugarTurnoIA() {
  const bando = bandoEnTurno();
  if (enCurso || bando === null || !esDeLaIA(bando)) return;
  enCurso = true;
  control.jugando = true;
  try {
    // sin agentes apostados: solo puede reaccionar. La IA fácil reacciona disparando si tiene
    // un buen disparo desde donde está; si no, pasa.
    if (ventanaReaccion() === bando) {
      await esperar(control.pausa / 2);
      let mejor = null;
      for (const o of reaccionables(bando)) {
        const d = mejorDisparo(o, o.x, o.y);
        if (d && d.puntos >= 3 && (!mejor || d.puntos > mejor.d.puntos)) mejor = { o, d };
      }
      if (!mejor) { pasar(bando); return; }
      iniciarReaccion(mejor.o);
      mejor.o.weapon = mejor.d.arma;
      state.sel = mejor.o; state.target = mejor.d.blanco;
      refreshSight(); renderAll();
      hint(T.ia.activa(nombre(mejor.o), T.reaccion.iaDispara(nombre(mejor.d.blanco))));
      await esperar(control.pausa);
      await doShoot();
      await esperar(control.pausa);
      if (mejor.o.alive && mejor.o.ready) endActivation(mejor.o);
      return;
    }
    hint(T.ia.pensando);
    await esperar(80);                       // deja que la pista se pinte antes de pensar
    const plan = decidirActivacion(bando);
    if (!plan) return;
    const op = plan.op, texto = explicar(plan);
    state.sel = op; state.target = null;
    renderAll();
    hint(T.ia.activa(nombre(op), texto));
    logLine(T.ia.log(TEAMNAME[bando], texto));
    const mov = plan.pasos.find(p => p.x !== undefined);
    if (mov) flashOp2D({ ...op, x: mov.x, y: mov.y });
    await esperar(control.pausa);
    if (op.order !== plan.orden) {           // la orden se elige al activarse
      snapshot(); op.order = plan.orden;
      logLine(T.orden.log(op.name, op.order));
      renderAll();
      await esperar(control.pausa / 2);
    }
    for (const paso of plan.pasos) {
      if (!op.alive) break;
      if (paso.x !== undefined) {
        const ok = moverA(op, paso.x, paso.y, paso.accion);
        await esperar(control.pausa);
        if (!ok) break;
      } else if (paso.accion === "shoot" || paso.accion === "fight") {
        if (!paso.blanco.alive) break;
        if (paso.arma) op.weapon = paso.arma;
        state.sel = op; state.target = paso.blanco;
        refreshSight(); renderAll();
        await esperar(control.pausa / 2);
        await (paso.accion === "shoot" ? doShoot() : doFight());   // espera a que se resuelva (y a tus decisiones)
        await esperar(control.pausa);
      }
    }
    if (op.alive && op.ready) endActivation(op);
  } catch (e) {                // un error en su jugada: se avisa y se detiene (el botón "Jugar su turno" lo reintenta)
    console.error("IA:", e);
    logLine(T.ia.fallo(String((e && e.message) || e)));
    hint(T.ia.falloPista);
    return;
  } finally {
    control.jugando = false;
    enCurso = false;
  }
  // ¿le vuelve a tocar? (el humano no tiene agentes apostados)
  setTimeout(() => {
    const t = bandoEnTurno();
    if (t !== null && esDeLaIA(t)) jugarTurnoIA();
    else if (t !== null) hint(T.ia.tuTurno);
  }, 150);
}

// Destraba a la computadora si se quedó esperando (una ventana que no llegó, una recarga a mitad de su turno…):
// suelta los seguros de su turno y la hace jugar su activación ahora.
export function forzarTurnoIA() {
  const bando = bandoEnTurno();
  if (bando === null || !esDeLaIA(bando)) { hint(T.ia.noLeToca); return; }
  enCurso = false; control.jugando = false;
  jugarTurnoIA();
}

export function wireIA() {
  const b = document.getElementById("iasugerir");
  if (b) b.onclick = () => sugerir();
  const j = document.getElementById("iajugar");
  if (j) j.onclick = () => forzarTurnoIA();
  const siLeToca = () => setTimeout(() => { if (esDeLaIA(bandoEnTurno())) jugarTurnoIA(); }, 300);
  control.alTerminarActivacion = siLeToca;
  control.alEmpezarTiroteo = siLeToca;
}
