/* global THREE */
/**
 * Pantalla #/encuadres: elegir a mano el encuadre del retrato 2D de cada miniatura de un comando.
 * Se hace una vez por miniatura: giras, acercas y mueves el modelo hasta que lo que queda dentro del
 * círculo es lo que quieres ver en la ficha, y lo guardas. Se guardan solo coordenadas (la
 * posición de la cámara y el punto al que mira, relativos a la figura; ver src/view3d/retratos.js)
 * en src/data/retrato-encuadres.js (lo escribe el servidor de desarrollo), listo para commit. Solo existe
 * en desarrollo: en el sitio publicado esta pantalla no se abre.
 */
import { T } from '../i18n/es.js';
import { TTS_TEAMS } from '../data/tts-teams.js';
import { comandoPorId } from '../data/teams/index.js';
import { plantillaDe } from '../view3d/units.js';
import { FOV, borrarEncuadre, encuadreAuto, encuadreDeCamara, encuadreGuardado, guardarEncuadre, ponerCamara,
  prepararEscena, texturasListas } from '../view3d/retratos.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let raiz = null, renderer = null, cam = null, controles = null, escena = null, abierto = false;
let equipo = null, nombre = null, ficha = 0;       // ficha: contador para descartar cargas viejas

const equipos = () => TTS_TEAMS.filter(t => comandoPorId(t.id) && t.models && t.models.length);
const nombres = id => { const t = TTS_TEAMS.find(x => x.id === id); return t ? [...new Set(t.models.map(m => m.name))] : []; };
const $ = id => raiz.querySelector("#" + id);
const estado = txt => { const e = $("encestado"); if (e) e.textContent = txt || ""; };

export function abrirEncuadres() {
  if (abierto) return;
  abierto = true;
  const E = T.encuadres, lista = equipos();
  equipo = lista.length ? lista[0].id : null;
  raiz = document.createElement("div");
  raiz.id = "encuadres"; raiz.setAttribute("role", "dialog"); raiz.setAttribute("aria-label", E.titulo);
  raiz.innerHTML = `
    <div class="enc-barra"><h2>${E.titulo}</h2><button class="mini" id="enccerrar">${E.cerrar}</button></div>
    <p class="enc-ayuda">${E.ayuda}</p>
    <div class="enc-cuerpo">
      <div class="enc-lista">
        <select id="encequipo" aria-label="${E.equipo}">${lista.map(t => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join("")}</select>
        <div id="enclista" class="enc-agentes"></div>
      </div>
      <div class="enc-visor">
        <div class="enc-lienzo"><canvas id="enccanvas"></canvas><div class="enc-guia" aria-hidden="true"></div></div>
        <div class="enc-acciones">
          <button class="mini enc-guardar" id="encguardar">${E.guardar}</button>
          <button class="mini" id="encauto">${E.auto}</button>
          <button class="mini" id="encborrar">${E.borrar}</button>
          <button class="mini" id="encsig">${E.siguiente}</button>
          <span class="enc-ficha" aria-label="${E.vistaFicha}"><canvas id="encmini" width="64" height="64"></canvas></span>
        </div>
        <p class="enc-estado" id="encestado" aria-live="polite"></p>
      </div>
    </div>
`;
  document.body.appendChild(raiz);
  $("enccerrar").onclick = cerrarEncuadres;
  $("encequipo").onchange = e => { equipo = e.target.value; pintarLista(); seleccionar(nombres(equipo)[0]); };
  $("encguardar").onclick = guardar;
  $("encauto").onclick = () => { if (escena) { aplicar(encuadreAuto(escena)); estado(E.autoPuesto); } };
  $("encborrar").onclick = async () => { if (!nombre) return; const ok = await borrarEncuadre(equipo, nombre); pintarLista(); estado(ok ? E.borrado : E.falloArchivo); };
  $("encsig").onclick = () => { const n = nombres(equipo), i = n.indexOf(nombre); seleccionar(n[(i + 1) % n.length]); };
  window.addEventListener("resize", ajustar);
  pintarLista();
  if (equipo) seleccionar(nombres(equipo)[0]);
}

export function cerrarEncuadres() {
  if (!abierto) return;
  abierto = false; ficha++;
  window.removeEventListener("resize", ajustar);
  try { if (controles) controles.dispose(); } catch (e) {}
  try { if (renderer) { renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); } } catch (e) {}
  renderer = cam = controles = escena = null;
  if (raiz) raiz.remove();
  raiz = null;
  if (/^#\/?encuadres/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
}

function pintarLista() {
  const E = T.encuadres;
  $("enclista").innerHTML = nombres(equipo).map(n => {
    const ok = !!encuadreGuardado(equipo, n);
    return `<button class="enc-ag${n === nombre ? " ahora" : ""}${ok ? " hecho" : ""}" data-n="${esc(n)}">${ok ? "✓ " : ""}${esc(n)}</button>`;
  }).join("") || `<p>${E.sinModelos}</p>`;
  for (const b of $("enclista").querySelectorAll("button")) b.onclick = () => seleccionar(b.dataset.n);
}

// el lienzo cuadrado ocupa lo que cabe; el círculo guía es lo que saldrá en la ficha
function ajustar() {
  if (!renderer) return;
  const cont = $("enccanvas").parentElement, lado = Math.max(200, Math.min(cont.clientWidth, Math.round(window.innerHeight * 0.58), 560));
  cont.style.width = cont.style.height = lado + "px";
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(lado, lado, false);
}

async function seleccionar(n) {
  const E = T.encuadres, mia = ++ficha;
  nombre = n; pintarLista();
  escena = null;
  const t = TTS_TEAMS.find(x => x.id === equipo), modelo = t && t.models.find(m => m.name === n);
  if (!modelo) return;
  estado(E.cargando);
  let plantilla;
  for (let i = 0; i < 300; i++) {                    // la plantilla llega cuando se descargó el modelo
    plantilla = plantillaDe(modelo);
    if (plantilla !== undefined || mia !== ficha) break;
    await new Promise(r => setTimeout(r, 400));
  }
  if (mia !== ficha) return;
  if (!plantilla) { estado(E.fallo); return; }
  for (let i = 0; i < 100 && !texturasListas(plantilla) && mia === ficha; i++) await new Promise(r => setTimeout(r, 400));
  if (mia !== ficha) return;
  if (!window.THREE || !THREE.OrbitControls) { estado(E.sin3d); return; }
  const nueva = prepararEscena(plantilla);
  if (!nueva) { estado(E.fallo); return; }
  escena = nueva;
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ canvas: $("enccanvas"), alpha: true, antialias: true });
    renderer.outputEncoding = THREE.sRGBEncoding; renderer.setClearColor(0x000000, 0);
    cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    controles = new THREE.OrbitControls(cam, $("enccanvas"));
    controles.enableDamping = false; controles.screenSpacePanning = true;
    ajustar();
    requestAnimationFrame(bucle);
  }
  aplicar(encuadreGuardado(equipo, n) || encuadreAuto(escena));
  estado(encuadreGuardado(equipo, n) ? E.yaGuardado : E.sinGuardar);
}

function aplicar(enc) {
  const objetivo = ponerCamara(cam, escena, enc);
  controles.target.copy(objetivo);
  controles.minDistance = escena.alto * 0.15; controles.maxDistance = escena.alto * 4;
  controles.update();
}

function bucle() {
  if (!abierto || !renderer) return;
  if (escena) {
    controles.update();
    renderer.render(escena.escena, cam);
    const m = $("encmini").getContext("2d");           // la ficha, a su tamaño real
    m.clearRect(0, 0, 64, 64); m.drawImage($("enccanvas"), 0, 0, 64, 64);
  }
  requestAnimationFrame(bucle);
}

async function guardar() {
  if (!escena || !nombre) return;
  const n = nombre, ok = await guardarEncuadre(equipo, n, encuadreDeCamara(cam, controles.target, escena));
  pintarLista();
  estado(ok ? T.encuadres.guardado(n) : T.encuadres.falloArchivo);
}

