import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { CUERPOS, ORDEN, ALIAS, CAPAS, GALAXIA } from './datos.js';
import { ROTACION, posicionUA, puntosOrbitaUA, direccionEcuatorial, uaAEscena, distanciaCompacta, fechaAJD, jdAFecha, UA_REAL } from './orbitas.js';
import { crearCielo } from './cielo.js';
import { crearGalaxia, ANIO_GALACTICO } from './galaxia.js';

import bgTexture1 from '/images/1.jpg';
import bgTexture2 from '/images/2.jpg';
import bgTexture3 from '/images/3.jpg';
import bgTexture4 from '/images/4.jpg';
import sunTexture from '/images/sun.jpg';
import mercuryTexture from '/images/mercurymap.jpg';
import mercuryBump from '/images/mercurybump.jpg';
import venusTexture from '/images/venusmap.jpg';
import venusAtmosphere from '/images/venus_atmosphere.jpg';
import earthTexture from '/images/earth_daymap.jpg';
import earthNightTexture from '/images/earth_nightmap.jpg';
import earthAtmosphere from '/images/earth_atmosphere.jpg';
import earthMoonTexture from '/images/moonmap.jpg';
import earthMoonBump from '/images/moonbump.jpg';
import marsTexture from '/images/marsmap.jpg';
import marsBump from '/images/marsbump.jpg';
import jupiterTexture from '/images/jupiter.jpg';
import ioTexture from '/images/jupiterIo.jpg';
import europaTexture from '/images/jupiterEuropa.jpg';
import ganymedeTexture from '/images/jupiterGanymede.jpg';
import callistoTexture from '/images/jupiterCallisto.jpg';
import saturnTexture from '/images/saturnmap.jpg';
import satRingTexture from '/images/saturn_ring.png';
import uranusTexture from '/images/uranus.jpg';
import uraRingTexture from '/images/uranus_ring.png';
import neptuneTexture from '/images/neptune.jpg';
import plutoTexture from '/images/plutomap.jpg';

const $ = (id) => document.getElementById(id);
const J2000 = 2451545.0;
const ARRIBA = new THREE.Vector3(0, 1, 0);

// ******  ESTADO  ******
const estado = {
  jd: fechaAJD(Date.now()),  // fecha simulada (días julianos)
  diasPorSegundo: 7,
  sentido: 1,
  escala: 0,                 // 0 compacta … 1 real (animado)
  escalaObjetivo: 0,
  modo: 'sistema',           // 'sistema' | 'galaxia'
  maPorSegundo: 10,          // millones de años por segundo (galaxia)
  aniosPorSegundo: 1         // años por segundo (hélice)
};
const mostrar = { orbitas: true, nombres: true, asteroides: true, lunas: true, constelaciones: false, ejes: false, giro: false, brillo: true };
const TAM_REAL = 0.12; // factor de tamaño de los cuerpos con distancias a escala real
const factorTam = () => THREE.MathUtils.lerp(1, TAM_REAL, estado.escala);
const VISTA_COMPACTA = new THREE.Vector3(-175, 115, 5);
const VISTA_REAL = new THREE.Vector3(-330, 240, 10);
const vistaGeneralPos = (v = new THREE.Vector3()) => v.lerpVectors(VISTA_COMPACTA, VISTA_REAL, estado.escala);
const SEGMENTOS = [64, 48];

// ******  ESCENA  ******
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.copy(VISTA_COMPACTA);

const renderer = new THREE.WebGLRenderer({ antialias: true });
const PR = Math.min(window.devicePixelRatio, 2);
renderer.setPixelRatio(PR);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = false;
controls.maxDistance = 1100;
controls.autoRotateSpeed = 0.4;

const pantallaCarga = $('cargando');
const ocultarCarga = () => pantallaCarga.classList.add('fuera');
THREE.DefaultLoadingManager.onLoad = ocultarCarga;
setTimeout(ocultarCarga, 15000);

const cubeTextureLoader = new THREE.CubeTextureLoader();
const loadTexture = new THREE.TextureLoader();
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const tex = (url) => { const t = loadTexture.load(url); t.anisotropy = Math.min(8, maxAniso); return t; };

// ******  POSTPROCESO  ******
const nuevoObjetivo = () => new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, nuevoObjetivo());
composer.setPixelRatio(PR);
composer.addPass(new RenderPass(scene, camera));
const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
outlinePass.edgeStrength = 3;
outlinePass.edgeGlow = 1;
outlinePass.visibleEdgeColor.set(0xffffff);
outlinePass.hiddenEdgeColor.set(0x190a05);
composer.addPass(outlinePass);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1, 0.4, 0.85);
bloomPass.threshold = 1;
bloomPass.radius = 0.9;
composer.addPass(bloomPass);

// ******  LUZ Y FONDO  ******
scene.add(new THREE.AmbientLight(0x222222, 6));
const fondoCubo = cubeTextureLoader.load([bgTexture3, bgTexture1, bgTexture2, bgTexture2, bgTexture4, bgTexture2]);
const fondoNegro = new THREE.Color(0x000000);
scene.background = fondoCubo;

// Luz sin corte de distancia y caída suave: los planetas exteriores no quedan a oscuras
const pointLight = new THREE.PointLight(0xFDFFD3, 130, 0, 0.9);
scene.add(pointLight);
renderer.shadowMap.enabled = true;
pointLight.castShadow = true;
pointLight.shadow.mapSize.set(2048, 2048);
pointLight.shadow.camera.near = 1;   // el rango debe cubrir todo el sistema: fuera de él three.js sombrea todo
pointLight.shadow.camera.far = 700;
pointLight.shadow.bias = -0.002;

// ******  SOL  ******
const sunSize = 697 / 40;
const sunMat = new THREE.MeshStandardMaterial({ emissive: 0xFFF88F, emissiveMap: tex(sunTexture), emissiveIntensity: 1.9 });
const solGrupo = new THREE.Group();
const solPolo = new THREE.Group();
solPolo.quaternion.setFromUnitVectors(ARRIBA, direccionEcuatorial(ROTACION.sol.ra, ROTACION.sol.dec));
const sun = new THREE.Mesh(new THREE.SphereGeometry(sunSize, ...SEGMENTOS), sunMat);
solPolo.add(sun);
solGrupo.add(solPolo);
scene.add(solGrupo);

// Tierra: día/noche
const earthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    dayTexture: { value: tex(earthTexture) },
    nightTexture: { value: tex(earthNightTexture) },
    sunPosition: { value: new THREE.Vector3(0, 0, 0) }
  },
  vertexShader: `
    varying vec3 vNormal; varying vec2 vUv; varying vec3 vSunDirection;
    uniform vec3 sunPosition;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(mat3(modelMatrix) * normal);
      vSunDirection = normalize(sunPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D dayTexture; uniform sampler2D nightTexture;
    varying vec3 vNormal; varying vec2 vUv; varying vec3 vSunDirection;
    void main() {
      float intensity = smoothstep(-0.1, 0.35, dot(normalize(vNormal), vSunDirection));
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv) * 0.35;
      gl_FragColor = mix(nightColor, dayColor, intensity);
    }`
});

// ******  PLANETAS  ******
// Radios en unidades de la escena (artísticos, como el proyecto original); el resto es real.
const DEF = {
  mercurio: { radio: 2.4, distCam: 13, mapa: mercuryTexture, relieve: mercuryBump },
  venus:    { radio: 6.1, distCam: 26, mapa: venusTexture, relieve: venusTexture, atm: venusAtmosphere },
  tierra:   { radio: 6.4, distCam: 34, material: earthMaterial, atm: earthAtmosphere },
  marte:    { radio: 3.4, distCam: 20, mapa: marsTexture, relieve: marsBump },
  jupiter:  { radio: 17.25, distCam: 90, mapa: jupiterTexture },
  saturno:  { radio: 14.5, distCam: 88, mapa: saturnTexture, anillo: { int: 1.24, ext: 2.27, tex: satRingTexture } },
  urano:    { radio: 6.25, distCam: 32, mapa: uranusTexture, anillo: { int: 1.64, ext: 2.0, tex: uraRingTexture } },
  neptuno:  { radio: 6, distCam: 26, mapa: neptuneTexture },
  pluton:   { radio: 1, distCam: 7, mapa: plutoTexture }
};

// Lunas: radio de órbita en la escena (artístico) y periodo real en días
const LUNAS = {
  tierra: [{ nombre: 'Luna', tam: 1.6, r: 10, P: 27.32166, mapa: earthMoonTexture, relieve: earthMoonBump, ecliptica: 5.14 }],
  marte: [
    { nombre: 'Fobos', modelo: '/images/mars/phobos.glb', escala: 0.1, r: 5, P: 0.31891 },
    { nombre: 'Deimos', modelo: '/images/mars/deimos.glb', escala: 0.1, r: 9, P: 1.26244 }
  ],
  jupiter: [
    { nombre: 'Ío', tam: 1.6, r: 20, P: 1.769138, mapa: ioTexture },
    { nombre: 'Europa', tam: 1.4, r: 24, P: 3.551181, mapa: europaTexture },
    { nombre: 'Ganímedes', tam: 2, r: 28, P: 7.154553, mapa: ganymedeTexture },
    { nombre: 'Calisto', tam: 1.7, r: 32, P: 16.689018, mapa: callistoTexture }
  ]
};

const lunasMallas = [];
const ejes = [];

function crearCuerpo(clave) {
  const d = DEF[clave], rot = ROTACION[clave];
  const material = d.material || new THREE.MeshPhongMaterial(
    d.relieve ? { map: tex(d.mapa), bumpMap: tex(d.relieve), bumpScale: 0.7 } : { map: tex(d.mapa) });

  const grupo = new THREE.Group();     // se mueve por la órbita
  const polo = new THREE.Group();      // orientado según el eje de rotación real (no gira)
  polo.quaternion.setFromUnitVectors(ARRIBA, direccionEcuatorial(rot.ra, rot.dec));
  grupo.add(polo);
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(d.radio, ...SEGMENTOS), material);
  mesh.scale.y = 1 - rot.achat;        // achatamiento real de los polos
  mesh.castShadow = mesh.receiveShadow = true;
  polo.add(mesh);

  let atm = null, anillo = null;
  if (d.atm) {
    atm = new THREE.Mesh(new THREE.SphereGeometry(d.radio + 0.1, ...SEGMENTOS),
      new THREE.MeshPhongMaterial({ map: tex(d.atm), transparent: true, opacity: 0.4, depthWrite: false }));
    atm.receiveShadow = true;
    mesh.add(atm);
  }
  if (d.anillo) {
    anillo = new THREE.Mesh(new THREE.RingGeometry(d.radio * d.anillo.int, d.radio * d.anillo.ext, 128),
      new THREE.MeshStandardMaterial({ map: tex(d.anillo.tex), side: THREE.DoubleSide, transparent: true, depthWrite: false }));
    anillo.rotation.x = -Math.PI / 2;  // en el plano del ecuador
    anillo.receiveShadow = true;
    polo.add(anillo);
  }
  const eje = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -d.radio * 1.7, 0), new THREE.Vector3(0, d.radio * 1.7, 0)]),
    new THREE.LineBasicMaterial({ color: CUERPOS[clave].color }));
  eje.visible = false;
  polo.add(eje);
  ejes.push(eje);

  const lunas = (LUNAS[clave] || []).map(l => {
    let contenedor = polo; // las lunas de Marte y Júpiter orbitan en el plano del ecuador
    if (l.ecliptica != null) { // la Luna orbita cerca de la eclíptica
      contenedor = new THREE.Group();
      contenedor.rotation.x = THREE.MathUtils.degToRad(l.ecliptica);
      grupo.add(contenedor);
    }
    const luna = { ...l, mesh: null, fase: Math.random() * Math.PI * 2 };
    if (l.modelo) {
      new GLTFLoader().load(l.modelo, (gltf) => {
        luna.mesh = gltf.scene;
        luna.mesh.scale.setScalar(l.escala);
        luna.mesh.visible = mostrar.lunas;
        contenedor.add(luna.mesh);
        lunasMallas.push(luna.mesh);
      });
    } else {
      const m = new THREE.Mesh(new THREE.SphereGeometry(l.tam, 32, 24),
        new THREE.MeshStandardMaterial(l.relieve ? { map: tex(l.mapa), bumpMap: tex(l.relieve), bumpScale: 0.5 } : { map: tex(l.mapa) }));
      m.castShadow = m.receiveShadow = true;
      contenedor.add(m);
      luna.mesh = m;
      lunasMallas.push(m);
    }
    return luna;
  });

  scene.add(grupo);
  return { clave, grupo, polo, mesh, atm, anillo, lunas, radio: d.radio, distCam: d.distCam, ua: new THREE.Vector3() };
}

const SISTEMA = { sol: { clave: 'sol', grupo: solGrupo, polo: solPolo, mesh: sun, radio: sunSize, distCam: 75, lunas: [], ua: new THREE.Vector3() } };
const PLANETAS = ORDEN.slice(1);
for (const k of PLANETAS) SISTEMA[k] = crearCuerpo(k);

const mallaACuerpo = new Map();
for (const k of ORDEN) {
  mallaACuerpo.set(SISTEMA[k].mesh, k);
  if (SISTEMA[k].atm) mallaACuerpo.set(SISTEMA[k].atm, k);
}
const raycastTargets = [...mallaACuerpo.keys()];

// ******  ÓRBITAS REALES  ******
const orbitas = {};
for (const k of PLANETAS) {
  const ua = puntosOrbitaUA(k, estado.jd, 720);
  const arr = new Float32Array(ua.length * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  const linea = new THREE.LineLoop(geo, new THREE.LineBasicMaterial({ color: CUERPOS[k].color, transparent: true, opacity: 0.22 }));
  linea.frustumCulled = false;
  scene.add(linea);
  orbitas[k] = { ua, arr, geo, linea };
}
const vtmp = new THREE.Vector3();
function actualizarOrbitas() {
  for (const k of PLANETAS) {
    const o = orbitas[k];
    o.ua.forEach((p, i) => { uaAEscena(p, estado.escala, vtmp); o.arr[i * 3] = vtmp.x; o.arr[i * 3 + 1] = vtmp.y; o.arr[i * 3 + 2] = vtmp.z; });
    o.geo.attributes.position.needsUpdate = true;
  }
}
actualizarOrbitas();

// ******  ASTEROIDES  ******
// Cinturón principal (2.2–3.3 UA) y cinturón de Kuiper (39.5–50 UA); giran según la 3.ª ley de Kepler.
const asteroides = [];
function cargarAsteroides(path, cantidad, aMin, aMax) {
  new GLTFLoader().load(path, (gltf) => {
    gltf.scene.traverse((child) => {
      if (!child.isMesh) return;
      for (let i = 0; i < cantidad / 12; i++) { // el paquete trae 12 asteroides
        const m = child.clone();
        const a = THREE.MathUtils.randFloat(aMin, aMax);
        m.visible = mostrar.asteroides;
        scene.add(m);
        asteroides.push({ m, a, dc: distanciaCompacta(a), escala: THREE.MathUtils.randFloat(0.8, 1.2), fase: Math.random() * Math.PI * 2,
          y: THREE.MathUtils.randFloatSpread(2), periodo: 365.25 * Math.pow(a, 1.5) });
      }
    });
    actualizarAsteroides();
  });
}
function actualizarAsteroides() {
  const f = THREE.MathUtils.lerp(1, 0.3, estado.escala), dias = estado.jd - J2000;
  for (const s of asteroides) {
    const ang = s.fase + 2 * Math.PI * dias / s.periodo;
    const r = THREE.MathUtils.lerp(s.dc, s.a * UA_REAL, estado.escala);
    s.m.position.set(r * Math.cos(ang), s.y * f, -r * Math.sin(ang));
    s.m.scale.setScalar(s.escala * f);
  }
}

// ******  POSICIONES  ******
const posTierraUA = new THREE.Vector3();
const pasoGiro = (dDias, periodo, tope) => { const p = 2 * Math.PI * dDias / periodo; return Math.sign(p) * Math.min(Math.abs(p), tope); };
function actualizarPosiciones(dDias) {
  const f = factorTam();
  solGrupo.scale.setScalar(f);
  for (const k of PLANETAS) {
    const c = SISTEMA[k];
    posicionUA(k, estado.jd, c.ua);
    uaAEscena(c.ua, estado.escala, c.grupo.position);
    c.grupo.scale.setScalar(f);
    // Rotación proporcional al tiempo simulado, con tope para que no se vuelva un borrón
    c.mesh.rotation.y += pasoGiro(dDias, ROTACION[k].periodo, 0.08);
    if (c.atm) c.atm.rotation.y += pasoGiro(dDias, ROTACION[k].periodo * 5, 0.01);
    for (const l of c.lunas) {
      if (!l.mesh) continue;
      const ang = l.fase + 2 * Math.PI * (estado.jd - J2000) / l.P;
      l.mesh.position.set(l.r * Math.cos(ang), 0, -l.r * Math.sin(ang));
      l.mesh.rotation.y = ang + Math.PI / 2; // rotación sincrónica: siempre la misma cara hacia el planeta
    }
  }
  sun.rotation.y += pasoGiro(dDias, ROTACION.sol.periodo, 0.03);
  posTierraUA.copy(SISTEMA.tierra.ua);
}

// ******  CIELO REAL (constelaciones)  ******
let cielo = null;
fetch('cielo.json').then(r => r.json()).then(datos => {
  cielo = crearCielo(datos, PR);
  cielo.grupo.visible = mostrar.constelaciones;
  scene.add(cielo.grupo);
}).catch(e => console.error('No se pudo cargar el cielo', e));

// ******  GALERÍA HISTÓRICA  ******
let GALERIA = {};
fetch('galeria/galeria.json').then(r => r.json()).then(g => { GALERIA = g; if (enfocado) pintarGaleria(enfocado); })
  .catch(e => console.error('No se pudo cargar la galería', e));

// ******  ENFOQUE Y CÁMARA  ******
let enfocado = null, volando = false, volviendo = false;
const desplazamiento = new THREE.Vector3(), posCuerpo = new THREE.Vector3(), posPrevia = new THREE.Vector3(), tmp = new THREE.Vector3();
let factorPrevio = 1;
const posicionDe = (clave, destino) => SISTEMA[clave].mesh.getWorldPosition(destino);

function enfocar(clave, { actualizarHash = true } = {}) {
  if (!SISTEMA[clave]) return;
  if (estado.modo !== 'sistema') salirGalaxia({ sinVista: true });
  enfocado = clave; volando = true; volviendo = false;
  const s = SISTEMA[clave];
  posicionDe(clave, posCuerpo);
  posPrevia.copy(posCuerpo);
  let dir;
  if (clave === 'sol') dir = camera.position.clone().sub(posCuerpo).normalize();
  else {
    // Encuadre desde un lado y algo por encima, con el lado iluminado a la vista
    const haciaSol = posCuerpo.clone().negate().normalize();
    const lado = new THREE.Vector3().crossVectors(ARRIBA, haciaSol).normalize();
    const alto = DEF[clave].anillo ? 0.9 : 0.35; // más altura en los planetas con anillos para verlos abiertos
    dir = haciaSol.multiplyScalar(0.55).add(lado.multiplyScalar(0.8)).add(ARRIBA.clone().multiplyScalar(alto)).normalize();
  }
  const f = factorTam();
  desplazamiento.copy(dir).multiplyScalar(s.distCam * f * (window.innerWidth < 860 ? 1.5 : 1));
  controls.minDistance = s.radio * 1.3 * f;
  controls.autoRotate = false;
  mostrarFicha(clave);
  marcarActivo(clave);
  for (const k of PLANETAS) orbitas[k].linea.material.opacity = k === clave ? 0.7 : 0.22;
  if (actualizarHash) history.replaceState(null, '', '#' + clave);
}

function vistaGeneral() {
  enfocado = null; volando = false; volviendo = true;
  controls.minDistance = 0;
  controls.autoRotate = mostrar.giro;
  ocultarFicha();
  marcarActivo(null);
  for (const k of PLANETAS) orbitas[k].linea.material.opacity = 0.22;
  history.replaceState(null, '', location.pathname + location.search);
}

function actualizarCamara() {
  const f = factorTam();
  if (enfocado) {
    posicionDe(enfocado, posCuerpo);
    const delta = tmp.copy(posCuerpo).sub(posPrevia);
    posPrevia.copy(posCuerpo);
    if (f !== factorPrevio) { // cambió la escala: se conserva el encuadre
      desplazamiento.multiplyScalar(f / factorPrevio);
      camera.position.sub(controls.target).multiplyScalar(f / factorPrevio).add(controls.target);
      controls.minDistance = SISTEMA[enfocado].radio * 1.3 * f;
    }
    if (volando) {
      const destino = posCuerpo.clone().add(desplazamiento);
      camera.position.add(delta).lerp(destino, 0.06);
      controls.target.add(delta).lerp(posCuerpo, 0.12);
      if (camera.position.distanceTo(destino) < 0.05 + 0.3 * f) volando = false;
    } else {
      camera.position.add(delta);
      controls.target.copy(posCuerpo);
    }
  } else if (volviendo) {
    const destino = vistaGeneralPos(tmp);
    camera.position.lerp(destino, 0.05);
    controls.target.lerp(new THREE.Vector3(), 0.08);
    if (camera.position.distanceTo(destino) < 1) volviendo = false;
  }
  factorPrevio = f;
}

// ******  RATÓN / TOQUE  ******
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(9, 9);
let inicioToque = null, hayRaton = false;
const aCoordenadas = (e) => { mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1; };
renderer.domElement.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { hayRaton = true; aCoordenadas(e); } });
renderer.domElement.addEventListener('pointerleave', () => mouse.set(9, 9));
renderer.domElement.addEventListener('pointerdown', (e) => { inicioToque = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!inicioToque || estado.modo !== 'sistema') { inicioToque = null; return; }
  const movido = Math.hypot(e.clientX - inicioToque.x, e.clientY - inicioToque.y);
  inicioToque = null;
  if (movido > 6) return; // fue un arrastre, no un clic
  aCoordenadas(e);
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(raycastTargets)[0];
  if (hit) enfocar(mallaACuerpo.get(hit.object));
  if (!hayRaton) mouse.set(9, 9);
});

// ******  ETIQUETAS  ******
function crearCapa(contenedor) {
  const mapa = new Map(), p = new THREE.Vector3();
  return {
    pintar(items, cam, evitarSolapes = true) {
      const w = window.innerWidth, h = window.innerHeight, ocupados = [], vivos = new Set();
      for (const it of items) {
        let el = mapa.get(it.id);
        if (!el) {
          el = document.createElement('div');
          el.className = 'etiqueta' + (it.tipo ? ' ' + it.tipo : '');
          el.textContent = it.nombre;
          if (it.click) el.addEventListener('click', it.click);
          contenedor.appendChild(el);
          mapa.set(it.id, el);
        }
        vivos.add(it.id);
        p.copy(it.pos).project(cam);
        if (p.z > 1 || Math.abs(p.x) > 1.1 || Math.abs(p.y) > 1.1) { el.style.display = 'none'; continue; }
        const x = (p.x + 1) / 2 * w, y = (1 - p.y) / 2 * h;
        if (!el._ancho) { el.style.display = ''; el._ancho = el.offsetWidth || 60; }
        // Si choca con una etiqueta ya colocada, se oculta
        if (evitarSolapes && ocupados.some(o => Math.abs(o.x - x) < (o.a + el._ancho) / 2 + 4 && Math.abs(o.y - y) < 18)) { el.style.display = 'none'; continue; }
        ocupados.push({ x, y, a: el._ancho });
        el.style.display = '';
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, calc(-100% - 8px))`;
      }
      for (const [id, el] of mapa) if (!vivos.has(id)) el.style.display = 'none';
    },
    ocultar() { for (const el of mapa.values()) el.style.display = 'none'; }
  };
}
const capaEtiquetas = crearCapa($('etiquetas'));
const capaConst = crearCapa($('capaConst'));
const capaGal = crearCapa($('etiquetas'));
const itemsPlanetas = ORDEN.map(k => ({ id: k, nombre: CUERPOS[k].nombre, pos: new THREE.Vector3(), click: () => enfocar(k) }));
let itemsConst = null;

function actualizarEtiquetas() {
  if (estado.modo === 'galaxia') {
    capaEtiquetas.ocultar(); capaConst.ocultar();
    capaGal.pintar(galaxia.etiquetas().map(e => ({ ...e, id: 'g-' + e.nombre })), galaxia.camara(), false);
    return;
  }
  capaGal.ocultar();
  if (mostrar.nombres) {
    const visibles = itemsPlanetas.filter(it => it.id !== enfocado);
    for (const it of visibles) { posicionDe(it.id, it.pos); it.pos.y += SISTEMA[it.id].radio * 1.15 * factorTam(); }
    capaEtiquetas.pintar(visibles, camera);
  } else capaEtiquetas.ocultar();
  if (mostrar.constelaciones && cielo) {
    if (!itemsConst) itemsConst = cielo.nombres.map((n, i) => ({ id: 'c' + i, nombre: n.nombre, dir: n.dir, pos: new THREE.Vector3() }));
    for (const it of itemsConst) it.pos.copy(it.dir).multiplyScalar(cielo.RADIO).add(camera.position);
    capaConst.pintar(itemsConst, camera);
  } else capaConst.ocultar();
}

// ******  INTERFAZ  ******
const fmtFecha = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtNum = (n, d = 2) => n.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

// Índice de objetos
const indice = $('indice');
for (const k of ORDEN) {
  const li = document.createElement('li');
  li.dataset.k = k;
  li.innerHTML = `<span class="punto" style="background:${CUERPOS[k].color}"></span>${CUERPOS[k].nombre}<small>${CUERPOS[k].tipo.split(' (')[0]}</small>`;
  li.addEventListener('click', () => { enfocar(k); if (window.innerWidth < 860) plegarPanel(true); });
  indice.appendChild(li);
}
function marcarActivo(k) {
  indice.querySelectorAll('li').forEach(li => li.classList.toggle('activo', li.dataset.k === k));
  $('navNombre').textContent = k ? CUERPOS[k].nombre : 'Sistema solar';
  actualizarVivo(true);
}

// Ficha
function llenarFicha(c) {
  $('fichaMini').textContent = c.nombre;
  $('fichaNombre').textContent = c.nombre;
  $('fichaTipo').textContent = c.tipo;
  $('fichaDesc').textContent = c.desc;
  const dl = $('fichaDatos');
  dl.replaceChildren();
  for (const [t, v] of c.datos) {
    const dt = document.createElement('dt'); dt.textContent = t;
    const dd = document.createElement('dd'); dd.textContent = v;
    dl.append(dt, dd);
  }
  const extra = $('fichaExtra');
  extra.replaceChildren();
  if (c.extra) {
    const div = document.createElement('div'); div.className = 'extra';
    const h = document.createElement('h3'); h.textContent = c.extra[0];
    const p = document.createElement('p'); p.textContent = c.extra[1];
    div.append(h, p); extra.append(div);
  }
}
function mostrarFicha(k) {
  llenarFicha(CUERPOS[k]);
  pintarCapas(k);
  pintarGaleria(k);
  $('fichaVolver').textContent = '← Volver a la vista general';
  $('ficha').hidden = false;
  $('ficha').querySelector('.ficha-cuerpo').scrollTop = 0;
  ajustarVista();
}
function ocultarFicha() { $('ficha').hidden = true; ajustarVista(); }

function pintarCapas(k) {
  const cont = $('fichaCapas');
  cont.replaceChildren();
  const capas = CAPAS[k];
  if (!capas) return;
  const h = document.createElement('h3'); h.textContent = 'Estructura interna';
  const cuerpo = document.createElement('div'); cuerpo.className = 'capas-cuerpo';
  // Corte: círculos concéntricos a escala de radio
  let svg = '<svg viewBox="-64 -64 128 128" role="img" aria-label="Corte de la estructura interna">';
  for (const [, f, color] of [...capas].reverse()) svg += `<circle r="${(f * 60).toFixed(1)}" fill="${color}" stroke="rgba(0,0,0,.35)" stroke-width="0.6"/>`;
  svg += '</svg>';
  cuerpo.innerHTML = svg;
  const ul = document.createElement('ul');
  for (const [nombre, , color] of capas) {
    const li = document.createElement('li');
    const i = document.createElement('i'); i.style.background = color;
    li.append(i, nombre);
    ul.append(li);
  }
  cuerpo.append(ul);
  const nota = document.createElement('p'); nota.className = 'nota'; nota.textContent = 'Proporciones aproximadas según los modelos actuales.';
  cont.append(h, cuerpo, nota);
}

function pintarGaleria(k) {
  const cont = $('fichaGaleria');
  cont.replaceChildren();
  const fotos = GALERIA[k];
  if (!fotos || !fotos.length) return;
  const h = document.createElement('h3'); h.textContent = 'Cómo lo hemos visto a lo largo de la historia';
  const p = document.createElement('p'); p.textContent = 'De los primeros telescopios a las sondas espaciales. Toca una imagen para ampliarla.';
  const grid = document.createElement('div'); grid.className = 'linea-tiempo';
  fotos.forEach((f, i) => {
    const b = document.createElement('button');
    const img = document.createElement('img'); img.src = f.archivo; img.alt = f.titulo; img.loading = 'lazy';
    const s = document.createElement('span');
    const anio = document.createElement('b'); anio.textContent = f.anio;
    s.append(anio, f.titulo);
    b.append(img, s);
    b.addEventListener('click', () => abrirVisor(k, i));
    grid.append(b);
  });
  cont.append(h, p, grid);
}

// Visor de fotos
let visorLista = [], visorI = 0;
function abrirVisor(k, i) { visorLista = GALERIA[k]; visorI = i; pintarVisor(); $('visor').hidden = false; }
function pintarVisor() {
  const f = visorLista[visorI];
  $('visorImg').src = f.archivo; $('visorImg').alt = f.titulo;
  $('visorAnio').textContent = f.anio;
  $('visorTitulo').textContent = f.titulo;
  $('visorDesc').textContent = f.desc;
  const cred = $('visorCredito');
  cred.replaceChildren(`${f.autor || 'Autor desconocido'} · `);
  const lic = document.createElement(f.licenciaUrl ? 'a' : 'span');
  lic.textContent = f.licencia || 'Licencia en la fuente';
  if (f.licenciaUrl) { lic.href = f.licenciaUrl; lic.target = '_blank'; lic.rel = 'noopener'; }
  const fuente = document.createElement('a'); fuente.href = f.fuente; fuente.target = '_blank'; fuente.rel = 'noopener'; fuente.textContent = 'Wikimedia Commons';
  cred.append(lic, ' · ', fuente);
}
const moverVisor = (p) => { visorI = (visorI + p + visorLista.length) % visorLista.length; pintarVisor(); };
$('visorCerrar').addEventListener('click', () => { $('visor').hidden = true; });
$('visorAnt').addEventListener('click', () => moverVisor(-1));
$('visorSig').addEventListener('click', () => moverVisor(1));
$('visor').addEventListener('click', (e) => { if (e.target.id === 'visor') $('visor').hidden = true; });

// Datos en vivo (según la fecha simulada)
let ultimoVivo = 0;
function actualizarVivo(forzar = false) {
  const ahora = performance.now();
  if (!forzar && ahora - ultimoVivo < 200) return;
  ultimoVivo = ahora;
  const enGalaxia = estado.modo === 'galaxia';
  $('fechaSup').textContent = enGalaxia ? textoGalaxiaCorto() : fmtFecha.format(new Date(jdAFecha(estado.jd)));
  $('fechaEtiqueta').textContent = enGalaxia ? 'Tiempo' : 'Fecha';
  const fecha = new Date(jdAFecha(estado.jd));
  $('avisoFecha').hidden = fecha.getUTCFullYear() >= 1800 && fecha.getUTCFullYear() <= 2050;
  if (document.activeElement !== $('fechaInput') && !Number.isNaN(fecha.getTime())) $('fechaInput').value = fecha.toISOString().slice(0, 10);
  const vivo = $('fichaVivo');
  if (enGalaxia) {
    $('distValor').textContent = '26,000'; $('distUnidad').textContent = 'a. l. del centro';
    $('tiempoGalTexto').textContent = textoGalaxia();
    if (galaxia.vista() === 'helice') {
      const a = galaxia.helice.anios();
      vivo.innerHTML = `<div><small>AÑOS SIMULADOS</small><b>${fmtNum(a, 1)}</b></div><div><small>EL SOL AVANZÓ</small><b>${fmtNum(a * 48.4, 0)} UA</b></div>`;
    } else {
      const t = galaxia.tiempo();
      vivo.innerHTML = `<div><small>VUELTAS DEL SOL</small><b>${fmtNum(t / ANIO_GALACTICO, 3)}</b></div><div><small>RECORRIDO</small><b>${fmtNum(Math.abs(t) * 767, 0)} años luz</b></div>`;
    }
    return;
  }
  if (!enfocado) { $('distValor').textContent = '—'; $('distUnidad').textContent = ''; vivo.replaceChildren(); return; }
  const c = SISTEMA[enfocado], r = c.ua.length();
  $('distValor').textContent = enfocado === 'sol' ? '0' : fmtNum(r);
  $('distUnidad').textContent = 'UA';
  const filas = [];
  if (enfocado !== 'sol') filas.push(['DISTANCIA AL SOL', `${fmtNum(r)} UA`], ['EN KILÓMETROS', `${fmtNum(r * 149.598, 1)} M km`]);
  if (enfocado !== 'tierra') {
    const dT = tmp.copy(c.ua).sub(posTierraUA).length(), min = dT * 8.317;
    filas.push(['DISTANCIA A LA TIERRA', `${fmtNum(dT)} UA`], ['LA LUZ TARDA', min < 60 ? `${fmtNum(min, 1)} min` : `${fmtNum(min / 60, 1)} h`]);
  }
  vivo.innerHTML = filas.map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('');
}

$('fichaCerrar').addEventListener('click', () => { if (estado.modo === 'galaxia') ocultarFicha(); else vistaGeneral(); });
$('fichaVolver').addEventListener('click', () => { if (estado.modo === 'galaxia') salirGalaxia(); else vistaGeneral(); });
$('btnVista').addEventListener('click', vistaGeneral);

// Navegador anterior / siguiente
const VISTAS_GAL = [['galaxia', 'La galaxia'], ['sol', 'El Sol en su brazo'], ['helice', 'Hélice de los planetas']];
function mover(paso) {
  if (estado.modo === 'galaxia') {
    const i = VISTAS_GAL.findIndex(([v]) => v === galaxia.vista());
    ponerVistaGal(VISTAS_GAL[(i + paso + 3) % 3][0]);
    return;
  }
  const i = enfocado ? ORDEN.indexOf(enfocado) : (paso > 0 ? -1 : ORDEN.length);
  enfocar(ORDEN[(i + paso + ORDEN.length) % ORDEN.length]);
}
$('anterior').addEventListener('click', () => mover(-1));
$('siguiente').addEventListener('click', () => mover(1));

// Ocultar la interfaz para ver y mover libremente
function alternarInterfaz(forzar) {
  const oculto = document.body.classList.toggle('sin-interfaz', forzar);
  $('btnUI').title = oculto ? 'Mostrar la interfaz (H)' : 'Ocultar la interfaz (H)';
  $('btnUI').setAttribute('aria-label', $('btnUI').title);
  sugerencias.hidden = true;
}
$('btnUI').addEventListener('click', () => alternarInterfaz());

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (!$('visor').hidden) {
    if (e.key === 'Escape') $('visor').hidden = true;
    else if (e.key === 'ArrowRight') moverVisor(1);
    else if (e.key === 'ArrowLeft') moverVisor(-1);
    return;
  }
  if (e.key === 'h' || e.key === 'H') alternarInterfaz();
  else if (e.key === 'ArrowRight') mover(1);
  else if (e.key === 'ArrowLeft') mover(-1);
  else if (e.key === 'Escape') {
    if (document.body.classList.contains('sin-interfaz')) alternarInterfaz(false);
    else if (estado.modo === 'galaxia') salirGalaxia();
    else vistaGeneral();
  }
  else if (e.key === ' ' && estado.modo === 'sistema') { e.preventDefault(); ponerVelocidad(estado.diasPorSegundo === 0 ? 7 : 0); }
});

// Tiempo
const TEXTO_VEL = { 0: 'En pausa', 0.0416667: '1 hora / s', 1: '1 día / s', 7: '1 semana / s', 30.4375: '1 mes / s', 365.25: '1 año / s', 3652.5: '10 años / s' };
function ponerVelocidad(v) {
  estado.diasPorSegundo = v;
  $('velocidades').querySelectorAll('button').forEach(b => { const bv = Number(b.dataset.v); if (bv >= 0) b.classList.toggle('activo', bv === v); });
  $('velTexto').textContent = (TEXTO_VEL[v] || `${v} días / s`) + (estado.sentido < 0 && v ? ' ⇄' : '');
}
$('velocidades').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  const v = Number(b.dataset.v);
  if (v < 0) { estado.sentido *= -1; b.classList.toggle('activo', estado.sentido < 0); ponerVelocidad(estado.diasPorSegundo); }
  else ponerVelocidad(v);
});
$('btnHoy').addEventListener('click', () => { estado.jd = fechaAJD(Date.now()); actualizarVivo(true); });
$('fechaInput').addEventListener('change', (e) => {
  const ms = Date.parse(e.target.value + 'T12:00:00Z');
  if (!Number.isNaN(ms)) { estado.jd = fechaAJD(ms); actualizarVivo(true); }
});

// Escala de distancias
$('escalas').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  estado.escalaObjetivo = Number(b.dataset.e);
  $('escalas').querySelectorAll('button').forEach(x => x.classList.toggle('activo', x === b));
  $('notaEscala').textContent = estado.escalaObjetivo
    ? 'Distancias a escala: 1 UA = 11.5 unidades. Los cuerpos están agrandados para poder verlos (a escala real serían puntos invisibles).'
    : 'Órbitas con su forma, inclinación y orientación reales; distancias acortadas para que todo quepa.';
  if (!enfocado) volviendo = true;
});

// Brillo del Sol
$('solBrillo').addEventListener('input', (e) => {
  sunMat.emissiveIntensity = Number(e.target.value);
  $('solTexto').textContent = Number(e.target.value).toFixed(1);
});

// Interruptores de la escena
function aplicarMostrar() {
  for (const k of PLANETAS) orbitas[k].linea.visible = mostrar.orbitas;
  asteroides.forEach(a => { a.m.visible = mostrar.asteroides; });
  lunasMallas.forEach(m => { m.visible = mostrar.lunas; });
  ejes.forEach(e => { e.visible = mostrar.ejes; });
  if (cielo) cielo.grupo.visible = mostrar.constelaciones;
  scene.background = mostrar.constelaciones ? fondoNegro : fondoCubo;
  controls.autoRotate = mostrar.giro && !enfocado;
  bloomPass.enabled = mostrar.brillo;
}
document.querySelectorAll('#secSistema .toggle').forEach(b => {
  b.addEventListener('click', () => {
    mostrar[b.dataset.t] = !mostrar[b.dataset.t];
    b.classList.toggle('activo', mostrar[b.dataset.t]);
    aplicarMostrar();
  });
});

// Plegar panel izquierdo
function plegarPanel(plegar) {
  $('panelIzq').classList.toggle('plegado', plegar);
  $('plegar').classList.toggle('plegado', plegar);
  $('plegar').textContent = plegar ? '›' : '‹';
}
$('plegar').addEventListener('click', () => plegarPanel(!$('panelIzq').classList.contains('plegado')));
if (window.innerWidth < 860) plegarPanel(true);

// Buscador
const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const buscador = $('buscar'), sugerencias = $('sugerencias');
let seleccion = 0;
function coincidencias(q) {
  q = normalizar(q);
  if (!q) return [];
  const alias = Object.entries(ALIAS).filter(([a]) => a.startsWith(q)).map(([, k]) => k);
  const propios = ORDEN.filter(k => normalizar(CUERPOS[k].nombre).includes(q) || k.startsWith(q));
  const gal = ['via lactea', 'galaxia', 'milky way'].some(n => n.startsWith(q)) ? ['galaxia'] : [];
  return [...new Set([...propios, ...alias, ...gal])];
}
const nombreDe = (k) => k === 'galaxia' ? 'Vía Láctea' : CUERPOS[k].nombre;
const tipoDe = (k) => k === 'galaxia' ? 'Galaxia' : CUERPOS[k].tipo.split(' (')[0];
function pintarSugerencias() {
  const lista = coincidencias(buscador.value);
  sugerencias.replaceChildren();
  lista.forEach((k, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${nombreDe(k)}</span><small>${tipoDe(k)}</small>`;
    li.classList.toggle('sel', i === seleccion);
    li.addEventListener('mousedown', (e) => { e.preventDefault(); elegir(k); });
    sugerencias.appendChild(li);
  });
  sugerencias.hidden = lista.length === 0;
}
function elegir(k) {
  if (k === 'galaxia') entrarGalaxia(); else enfocar(k);
  buscador.value = ''; sugerencias.hidden = true; buscador.blur();
}
buscador.addEventListener('input', () => { seleccion = 0; pintarSugerencias(); });
buscador.addEventListener('blur', () => { sugerencias.hidden = true; });
buscador.addEventListener('keydown', (e) => {
  const lista = coincidencias(buscador.value);
  if (e.key === 'ArrowDown') { seleccion = Math.min(seleccion + 1, lista.length - 1); pintarSugerencias(); e.preventDefault(); }
  else if (e.key === 'ArrowUp') { seleccion = Math.max(seleccion - 1, 0); pintarSugerencias(); e.preventDefault(); }
  else if (e.key === 'Enter' && lista.length) elegir(lista[seleccion] ?? lista[0]);
  else if (e.key === 'Escape') { buscador.value = ''; sugerencias.hidden = true; buscador.blur(); }
});

// En pantallas angostas la ficha ocupa la mitad de abajo: se recorre la imagen hacia arriba
function ajustarVista() {
  const w = window.innerWidth, h = window.innerHeight;
  document.body.classList.toggle('con-ficha', !$('ficha').hidden);
  if (w < 860 && !$('ficha').hidden && estado.modo === 'sistema') camera.setViewOffset(w, h, 0, h * 0.18, w, h);
  else camera.clearViewOffset();
}

// ******  VÍA LÁCTEA  ******
const galaxia = crearGalaxia(renderer);
const composerGal = new EffectComposer(renderer, nuevoObjetivo());
composerGal.setPixelRatio(PR);
const passGal = new RenderPass(galaxia.escena(), galaxia.camara());
composerGal.addPass(passGal);
composerGal.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.7, 0.6, 0.15));

function textoGalaxia() {
  if (galaxia.vista() === 'helice') return `${fmtNum(galaxia.helice.anios(), 1)} años`;
  const t = galaxia.tiempo();
  if (Math.abs(t) < 0.05) return 'Hoy';
  return `${t > 0 ? 'Dentro de' : 'Hace'} ${fmtNum(Math.abs(t), Math.abs(t) < 10 ? 1 : 0)} millones de años`;
}

function textoGalaxiaCorto() {
  if (galaxia.vista() === 'helice') return `${fmtNum(galaxia.helice.anios(), 1)} años`;
  const t = galaxia.tiempo();
  return Math.abs(t) < 0.05 ? 'Hoy' : `${t > 0 ? '+' : '−'}${fmtNum(Math.abs(t), Math.abs(t) < 10 ? 1 : 0)} Ma`;
}

function entrarGalaxia() {
  estado.modo = 'galaxia';
  controls.enabled = false;
  galaxia.controlesActivos(true);
  $('secSistema').hidden = true; $('secGalaxia').hidden = false;
  $('marca').textContent = 'VÍA LÁCTEA';
  outlinePass.selectedObjects = [];
  llenarFicha(GALAXIA);
  $('fichaCapas').replaceChildren(); $('fichaGaleria').replaceChildren();
  $('fichaVolver').textContent = '← Volver al sistema solar';
  $('ficha').hidden = false;
  $('ficha').querySelector('.ficha-cuerpo').scrollTop = 0;
  ajustarVista();
  ponerVistaGal('galaxia');
  history.replaceState(null, '', '#via-lactea');
}
function salirGalaxia({ sinVista = false } = {}) {
  estado.modo = 'sistema';
  galaxia.controlesActivos(false);
  controls.enabled = true;
  $('secSistema').hidden = false; $('secGalaxia').hidden = true;
  $('marca').textContent = 'SISTEMA SOLAR';
  ocultarFicha();
  if (!sinVista) vistaGeneral();
  actualizarVivo(true);
}
function ponerVistaGal(v) {
  galaxia.ponerVista(v);
  $('vistasGal').querySelectorAll('button').forEach(b => b.classList.toggle('activo', b.dataset.g === v));
  $('tiempoGal').hidden = v === 'helice';
  $('tiempoHelice').hidden = v !== 'helice';
  $('navNombre').textContent = VISTAS_GAL.find(([x]) => x === v)[1];
  actualizarVivo(true);
}
$('btnGalaxia').addEventListener('click', entrarGalaxia);
$('btnVolverSistema').addEventListener('click', () => salirGalaxia());
$('vistasGal').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) ponerVistaGal(b.dataset.g); });
function rejillaVel(id, alElegir) {
  $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $(id).querySelectorAll('button').forEach(x => x.classList.toggle('activo', x === b));
    alElegir(Number(b.dataset.v));
  });
}
rejillaVel('velGal', (v) => { estado.maPorSegundo = v; $('velGalTexto').textContent = v ? `${v} Ma / s` : 'En pausa'; });
rejillaVel('velHel', (v) => { estado.aniosPorSegundo = v; $('velHelTexto').textContent = v ? `${v === 0.25 ? '¼' : v} ${v === 1 ? 'año' : 'años'} / s` : 'En pausa'; });
$('velReal').addEventListener('click', () => {
  const on = !$('velReal').classList.contains('activo');
  $('velReal').classList.toggle('activo', on);
  galaxia.helice.ponerVelocidadReal(on);
  $('notaHelice').textContent = on
    ? 'Velocidad real: en un año el Sol avanza unas 48 UA, más que la distancia a Neptuno. Por eso las hélices se ven casi como líneas rectas.'
    : 'Velocidad del Sol reducida 30 veces para que se vean las vueltas. Con la velocidad real (≈ 230 km/s, unas 48 UA por año) las hélices quedan casi rectas.';
});

$('heliceGal').addEventListener('click', () => {
  const on = !$('heliceGal').classList.contains('activo');
  $('heliceGal').classList.toggle('activo', on);
  $('notaHeliceGal').hidden = !on;
  galaxia.mostrarEstela(on);
});

// Enlaces directos: #saturno, #saturn, #via-lactea…
function leerHash() {
  const h = normalizar(decodeURIComponent(location.hash.slice(1)));
  if (['via-lactea', 'galaxia', 'milky-way'].includes(h)) { if (estado.modo !== 'galaxia') entrarGalaxia(); return; }
  const k = CUERPOS[h] ? h : ALIAS[h];
  if (k) enfocar(k, { actualizarHash: false });
}
window.addEventListener('hashchange', leerHash);

// ******  ANIMACIÓN  ******
let ultimo = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const ahora = performance.now();
  const dtReal = Math.min(ahora - ultimo, 100);
  ultimo = ahora;

  if (estado.modo === 'galaxia') {
    galaxia.actualizar(dtReal, estado.maPorSegundo, estado.aniosPorSegundo);
    passGal.scene = galaxia.escena();
    passGal.camera = galaxia.camara();
    actualizarEtiquetas();
    actualizarVivo();
    composerGal.render();
    return;
  }

  const dDias = dtReal / 1000 * estado.diasPorSegundo * estado.sentido;
  estado.jd += dDias;

  const cambiandoEscala = estado.escala !== estado.escalaObjetivo;
  if (cambiandoEscala) {
    const paso = dtReal / 900;
    estado.escala = estado.escalaObjetivo > estado.escala ? Math.min(estado.escalaObjetivo, estado.escala + paso) : Math.max(estado.escalaObjetivo, estado.escala - paso);
    actualizarOrbitas();
    camera.near = THREE.MathUtils.lerp(0.1, 0.01, estado.escala);
    camera.updateProjectionMatrix();
  }
  actualizarPosiciones(dDias);
  if (dDias !== 0 || cambiandoEscala) actualizarAsteroides();

  // Contorno al pasar el ratón
  outlinePass.selectedObjects = [];
  if (hayRaton && mouse.x < 2) {
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(raycastTargets)[0];
    if (hit) { outlinePass.selectedObjects = [SISTEMA[mallaACuerpo.get(hit.object)].mesh]; renderer.domElement.style.cursor = 'pointer'; }
    else renderer.domElement.style.cursor = '';
  }

  actualizarCamara();
  controls.update();
  if (cielo) cielo.grupo.position.copy(camera.position);
  actualizarEtiquetas();
  actualizarVivo();
  composer.render();
}

cargarAsteroides('/asteroids/asteroidPack.glb', 1000, 2.2, 3.3);
cargarAsteroides('/asteroids/asteroidPack.glb', 3000, 39.5, 50);
ponerVelocidad(estado.diasPorSegundo);
aplicarMostrar();
actualizarPosiciones(0);
leerHash();
actualizarVivo(true);
animate();

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  ajustarVista();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  composerGal.setSize(w, h);
  outlinePass.setSize(w, h);
  galaxia.redimensionar(w, h);
});
