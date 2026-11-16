import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { CUERPOS, ORDEN, ALIAS } from './datos.js';

import bgTexture1 from '/images/1.jpg';
import bgTexture2 from '/images/2.jpg';
import bgTexture3 from '/images/3.jpg';
import bgTexture4 from '/images/4.jpg';
import sunTexture from '/images/sun.jpg';
import mercuryTexture from '/images/mercurymap.jpg';
import mercuryBump from '/images/mercurybump.jpg';
import venusTexture from '/images/venusmap.jpg';
import venusBump from '/images/venusmap.jpg';
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

// ******  ESTADO  ******
const estado = {
  velocidad: 1,      // multiplicador del tiempo (0 = pausa)
  sentido: 1,        // 1 normal, -1 invertido
  sunIntensity: 1.9
};
const VISTA_GENERAL = new THREE.Vector3(-175, 115, 5);
const SEGMENTOS = [64, 48];

// ******  ESCENA  ******
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.copy(VISTA_GENERAL);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.screenSpacePanning = false;
controls.maxDistance = 900;
controls.autoRotateSpeed = 0.4;

// Pantalla de carga: se oculta cuando terminan texturas y modelos (o a los 15 s)
const pantallaCarga = document.getElementById('cargando');
const ocultarCarga = () => pantallaCarga.classList.add('fuera');
THREE.DefaultLoadingManager.onLoad = ocultarCarga;
setTimeout(ocultarCarga, 15000);

const cubeTextureLoader = new THREE.CubeTextureLoader();
const loadTexture = new THREE.TextureLoader();
const maxAniso = renderer.capabilities.getMaxAnisotropy();
const tex = (url) => { const t = loadTexture.load(url); t.anisotropy = Math.min(8, maxAniso); return t; };

// ******  POSTPROCESO  ******
const objetivoRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, { samples: 4, type: THREE.HalfFloatType });
const composer = new EffectComposer(renderer, objetivoRender);
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
scene.background = cubeTextureLoader.load([bgTexture3, bgTexture1, bgTexture2, bgTexture2, bgTexture4, bgTexture2]);

// ******  SOL  ******
const sunSize = 697 / 40;
const sunMat = new THREE.MeshStandardMaterial({
  emissive: 0xFFF88F,
  emissiveMap: tex(sunTexture),
  emissiveIntensity: estado.sunIntensity
});
const sun = new THREE.Mesh(new THREE.SphereGeometry(sunSize, ...SEGMENTOS), sunMat);
scene.add(sun);

// Luz sin corte de distancia y caída suave: los planetas exteriores ya no quedan casi a oscuras
const pointLight = new THREE.PointLight(0xFDFFD3, 130, 0, 0.9);
scene.add(pointLight);

// ******  CREACIÓN DE PLANETAS  ******
const orbitas = [];
const lunasVisibles = [];

function createPlanet(planetName, size, position, tilt, texture, bump, ring, atmosphere, moons) {
  let material;
  if (texture instanceof THREE.Material) {
    material = texture;
  } else if (bump) {
    material = new THREE.MeshPhongMaterial({ map: tex(texture), bumpMap: tex(bump), bumpScale: 0.7 });
  } else {
    material = new THREE.MeshPhongMaterial({ map: tex(texture) });
  }

  const planet = new THREE.Mesh(new THREE.SphereGeometry(size, ...SEGMENTOS), material);
  const planet3d = new THREE.Object3D();
  const planetSystem = new THREE.Group();
  planetSystem.add(planet);
  let Atmosphere, Ring;
  planet.position.x = position;
  planet.rotation.z = tilt * Math.PI / 180;

  // órbita
  const orbitPath = new THREE.EllipseCurve(0, 0, position, position, 0, 2 * Math.PI, false, 0);
  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPath.getPoints(256));
  const orbit = new THREE.LineLoop(orbitGeometry, new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.06 }));
  orbit.rotation.x = Math.PI / 2;
  planetSystem.add(orbit);
  orbitas.push(orbit);

  // anillos
  if (ring) {
    const RingGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 128);
    const RingMat = new THREE.MeshStandardMaterial({
      map: tex(ring.texture), side: THREE.DoubleSide, transparent: true, depthWrite: false
    });
    Ring = new THREE.Mesh(RingGeo, RingMat);
    planetSystem.add(Ring);
    Ring.position.x = position;
    Ring.rotation.x = -0.5 * Math.PI;
    Ring.rotation.y = -tilt * Math.PI / 180;
  }

  // atmósfera
  if (atmosphere) {
    const atmosphereMaterial = new THREE.MeshPhongMaterial({
      map: tex(atmosphere), transparent: true, opacity: 0.4, depthTest: true, depthWrite: false
    });
    Atmosphere = new THREE.Mesh(new THREE.SphereGeometry(size + 0.1, ...SEGMENTOS), atmosphereMaterial);
    Atmosphere.rotation.z = 0.41;
    planet.add(Atmosphere);
  }

  // lunas
  if (moons) {
    moons.forEach(moon => {
      const moonMaterial = moon.bump
        ? new THREE.MeshStandardMaterial({ map: tex(moon.texture), bumpMap: tex(moon.bump), bumpScale: 0.5 })
        : new THREE.MeshStandardMaterial({ map: tex(moon.texture) });
      const moonMesh = new THREE.Mesh(new THREE.SphereGeometry(moon.size, 32, 24), moonMaterial);
      moonMesh.position.set(size * 1.5, 0, 0);
      planetSystem.add(moonMesh);
      moon.mesh = moonMesh;
      lunasVisibles.push(moonMesh);
    });
  }

  planet3d.add(planetSystem);
  scene.add(planet3d);
  return { name: planetName, planet, planet3d, Atmosphere, moons, planetSystem, Ring, size };
}

function loadObject(path, position, scale, callback) {
  new GLTFLoader().load(path, (gltf) => {
    const obj = gltf.scene;
    obj.position.set(position, 0, 0);
    obj.scale.set(scale, scale, scale);
    scene.add(obj);
    if (callback) callback(obj);
  }, undefined, (error) => console.error('Error al cargar modelo', error));
}

// ******  ASTEROIDES  ******
const asteroids = [];
function loadAsteroids(path, numberOfAsteroids, minOrbitRadius, maxOrbitRadius) {
  new GLTFLoader().load(path, (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        for (let i = 0; i < numberOfAsteroids / 12; i++) { // el paquete trae 12 asteroides
          const asteroid = child.clone();
          const orbitRadius = THREE.MathUtils.randFloat(minOrbitRadius, maxOrbitRadius);
          const angle = Math.random() * Math.PI * 2;
          asteroid.position.set(orbitRadius * Math.cos(angle), THREE.MathUtils.randFloatSpread(2), orbitRadius * Math.sin(angle));
          asteroid.scale.setScalar(THREE.MathUtils.randFloat(0.8, 1.2));
          asteroid.visible = mostrar.asteroides;
          scene.add(asteroid);
          asteroids.push(asteroid);
        }
      }
    });
  }, undefined, (error) => console.error('Error al cargar asteroides', error));
}

// Tierra: día/noche
const earthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    dayTexture: { value: tex(earthTexture) },
    nightTexture: { value: tex(earthNightTexture) },
    sunPosition: { value: sun.position }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;
    uniform vec3 sunPosition;
    void main() {
      vUv = uv;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vNormal = normalize(modelMatrix * vec4(normal, 0.0)).xyz;
      vSunDirection = normalize(sunPosition - worldPosition.xyz);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vSunDirection;
    void main() {
      float intensity = smoothstep(-0.1, 0.35, dot(vNormal, vSunDirection));
      vec4 dayColor = texture2D(dayTexture, vUv);
      vec4 nightColor = texture2D(nightTexture, vUv) * 0.35;
      gl_FragColor = mix(nightColor, dayColor, intensity);
    }
  `
});

// ******  LUNAS  ******
const earthMoon = [{ size: 1.6, texture: earthMoonTexture, bump: earthMoonBump, orbitSpeed: 0.001, orbitRadius: 10 }];
const marsMoons = [
  { modelPath: '/images/mars/phobos.glb', scale: 0.1, orbitRadius: 5, orbitSpeed: 0.002, position: 100, mesh: null },
  { modelPath: '/images/mars/deimos.glb', scale: 0.1, orbitRadius: 9, orbitSpeed: 0.0005, position: 120, mesh: null }
];
const jupiterMoons = [
  { size: 1.6, texture: ioTexture, orbitRadius: 20, orbitSpeed: 0.0005 },
  { size: 1.4, texture: europaTexture, orbitRadius: 24, orbitSpeed: 0.00025 },
  { size: 2, texture: ganymedeTexture, orbitRadius: 28, orbitSpeed: 0.000125 },
  { size: 1.7, texture: callistoTexture, orbitRadius: 32, orbitSpeed: 0.00006 }
];

// ******  PLANETAS  ******
const mercury = createPlanet('Mercury', 2.4, 40, 0, mercuryTexture, mercuryBump);
const venus = createPlanet('Venus', 6.1, 65, 3, venusTexture, venusBump, null, venusAtmosphere);
const earth = createPlanet('Earth', 6.4, 90, 23, earthMaterial, null, null, earthAtmosphere, earthMoon);
const mars = createPlanet('Mars', 3.4, 115, 25, marsTexture, marsBump);
marsMoons.forEach(moon => {
  loadObject(moon.modelPath, moon.position, moon.scale, (loadedModel) => {
    moon.mesh = loadedModel;
    mars.planetSystem.add(moon.mesh);
    moon.mesh.visible = mostrar.lunas;
    lunasVisibles.push(moon.mesh);
  });
});
const jupiter = createPlanet('Jupiter', 69 / 4, 200, 3, jupiterTexture, null, null, null, jupiterMoons);
const saturn = createPlanet('Saturn', 58 / 4, 270, 26, saturnTexture, null, { innerRadius: 18, outerRadius: 29, texture: satRingTexture });
const uranus = createPlanet('Uranus', 25 / 4, 320, 82, uranusTexture, null, { innerRadius: 6, outerRadius: 8, texture: uraRingTexture });
const neptune = createPlanet('Neptune', 24 / 4, 340, 28, neptuneTexture);
const pluto = createPlanet('Pluto', 1, 350, 57, plutoTexture);

// Cada cuerpo con su malla, la distancia de cámara al enfocarlo y su velocidad (orbital, rotación)
const SISTEMA = {
  sol:      { mesh: sun,            radio: sunSize, distCam: 75 },
  mercurio: { obj: mercury, radio: 2.4,  distCam: 13, orb: 0.004,   rot: 0.001 },
  venus:    { obj: venus,   radio: 6.1,  distCam: 26, orb: 0.0006,  rot: 0.0005 },
  tierra:   { obj: earth,   radio: 6.4,  distCam: 32, orb: 0.001,   rot: 0.005 },
  marte:    { obj: mars,    radio: 3.4,  distCam: 18, orb: 0.0007,  rot: 0.01 },
  jupiter:  { obj: jupiter, radio: 17.25, distCam: 80, orb: 0.0003, rot: 0.005 },
  saturno:  { obj: saturn,  radio: 14.5, distCam: 78, orb: 0.0002,  rot: 0.01 },
  urano:    { obj: uranus,  radio: 6.25, distCam: 28, orb: 0.0001,  rot: 0.005 },
  neptuno:  { obj: neptune, radio: 6,    distCam: 26, orb: 0.00008, rot: 0.005 },
  pluton:   { obj: pluto,   radio: 1,    distCam: 7,  orb: 0.00006, rot: 0.001 }
};
for (const k of ORDEN) if (SISTEMA[k].obj) SISTEMA[k].mesh = SISTEMA[k].obj.planet;

// Posición inicial: longitud media aproximada de hoy (elementos J2000 de baja precisión).
// Así los planetas no arrancan alineados y su orden alrededor del Sol se parece al real.
const LONGITUD_MEDIA = { // [grados en J2000, grados por día]
  mercurio: [252.25, 4.09233], venus: [181.98, 1.60213], tierra: [100.46, 0.98561],
  marte: [355.45, 0.52403], jupiter: [34.40, 0.08309], saturno: [49.94, 0.03346],
  urano: [313.23, 0.01173], neptuno: [304.88, 0.00598], pluton: [238.93, 0.00397]
};
const diasJ2000 = (Date.now() - Date.UTC(2000, 0, 1, 12)) / 86400000;
for (const [k, [l0, n]] of Object.entries(LONGITUD_MEDIA)) {
  SISTEMA[k].obj.planet3d.rotation.y = THREE.MathUtils.degToRad((l0 + n * diasJ2000) % 360);
}

// Mallas que se pueden pulsar → clave del cuerpo
const mallaACuerpo = new Map();
for (const k of ORDEN) {
  const s = SISTEMA[k];
  mallaACuerpo.set(s.mesh, k);
  if (s.obj?.Atmosphere) mallaACuerpo.set(s.obj.Atmosphere, k);
}
const raycastTargets = [...mallaACuerpo.keys()];

// ******  SOMBRAS  ******
renderer.shadowMap.enabled = true;
pointLight.castShadow = true;
// El rango de la sombra debe cubrir todo el sistema: fuera de él three.js pinta todo como sombreado
pointLight.shadow.mapSize.set(2048, 2048);
pointLight.shadow.camera.near = sunSize;
pointLight.shadow.camera.far = 420;
pointLight.shadow.bias = -0.002;
for (const k of ORDEN.slice(1)) {
  SISTEMA[k].mesh.castShadow = true;
  SISTEMA[k].mesh.receiveShadow = true;
}
earth.moons.forEach(m => { m.mesh.castShadow = m.mesh.receiveShadow = true; });
jupiter.moons.forEach(m => { m.mesh.castShadow = m.mesh.receiveShadow = true; });
saturn.Ring.receiveShadow = true;

// ******  ENFOQUE Y CÁMARA  ******
let enfocado = null;         // clave del cuerpo enfocado
let volando = false;         // cámara en transición hacia el cuerpo
let volviendo = false;       // cámara volviendo a la vista general
const desplazamiento = new THREE.Vector3(); // cámara - cuerpo, al terminar el vuelo
const posCuerpo = new THREE.Vector3();
const posPrevia = new THREE.Vector3();
const tmp = new THREE.Vector3();
const ARRIBA = new THREE.Vector3(0, 1, 0);

function posicionDe(clave, destino) {
  return SISTEMA[clave].mesh.getWorldPosition(destino);
}

function enfocar(clave, { actualizarHash = true } = {}) {
  if (!SISTEMA[clave]) return;
  enfocado = clave;
  volando = true;
  volviendo = false;
  const s = SISTEMA[clave];
  posicionDe(clave, posCuerpo);
  posPrevia.copy(posCuerpo);

  // Encuadre: desde un lado y algo por encima, con el lado iluminado a la vista
  let dir;
  if (clave === 'sol') {
    dir = camera.position.clone().sub(posCuerpo).normalize();
  } else {
    const haciaSol = posCuerpo.clone().negate().normalize();
    const lado = new THREE.Vector3().crossVectors(ARRIBA, haciaSol).normalize();
    dir = haciaSol.multiplyScalar(0.55).add(lado.multiplyScalar(0.8)).add(ARRIBA.clone().multiplyScalar(0.35)).normalize();
  }
  desplazamiento.copy(dir).multiplyScalar(s.distCam * (window.innerWidth < 860 ? 1.5 : 1));
  controls.minDistance = s.radio * 1.4;
  controls.autoRotate = false;

  mostrarFicha(clave);
  marcarActivo(clave);
  if (actualizarHash) history.replaceState(null, '', '#' + clave);
}

function vistaGeneral() {
  enfocado = null;
  volando = false;
  volviendo = true;
  controls.minDistance = 0;
  controls.autoRotate = mostrar.giro;
  ocultarFicha();
  marcarActivo(null);
  history.replaceState(null, '', location.pathname + location.search);
}

function actualizarCamara() {
  if (enfocado) {
    posicionDe(enfocado, posCuerpo);
    const delta = tmp.copy(posCuerpo).sub(posPrevia);
    posPrevia.copy(posCuerpo);
    if (volando) {
      const destino = posCuerpo.clone().add(desplazamiento);
      camera.position.add(delta).lerp(destino, 0.06);
      controls.target.add(delta).lerp(posCuerpo, 0.12);
      if (camera.position.distanceTo(destino) < 0.3) volando = false;
    } else {
      // Sigue al cuerpo en su órbita sin quitar el control al usuario
      camera.position.add(delta);
      controls.target.copy(posCuerpo);
    }
  } else if (volviendo) {
    camera.position.lerp(VISTA_GENERAL, 0.05);
    controls.target.lerp(tmp.set(0, 0, 0), 0.08);
    if (camera.position.distanceTo(VISTA_GENERAL) < 1) volviendo = false;
  }
}

// ******  INTERACCIÓN CON EL RATÓN / TOQUE  ******
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(9, 9); // fuera de pantalla hasta que se mueva
let inicioToque = null;
let hayRaton = false;

function aCoordenadas(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') { hayRaton = true; aCoordenadas(e); }
});
renderer.domElement.addEventListener('pointerleave', () => mouse.set(9, 9));
renderer.domElement.addEventListener('pointerdown', (e) => { inicioToque = { x: e.clientX, y: e.clientY }; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!inicioToque) return;
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
const capaEtiquetas = document.getElementById('etiquetas');
const etiquetas = {};
for (const k of ORDEN) {
  const el = document.createElement('div');
  el.className = 'etiqueta';
  el.textContent = CUERPOS[k].nombre;
  el.addEventListener('click', () => enfocar(k));
  capaEtiquetas.appendChild(el);
  etiquetas[k] = el;
}
const ocupados = [];
function actualizarEtiquetas() {
  if (!mostrar.nombres) return;
  const w = window.innerWidth, h = window.innerHeight;
  ocupados.length = 0;
  for (const k of ORDEN) {
    const el = etiquetas[k];
    if (k === enfocado) { el.style.display = 'none'; continue; }
    posicionDe(k, tmp);
    tmp.y += SISTEMA[k].radio * 1.15;
    tmp.project(camera);
    if (tmp.z > 1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1) { el.style.display = 'none'; continue; }
    const x = (tmp.x + 1) / 2 * w, y = (1 - tmp.y) / 2 * h;
    // Si choca con una etiqueta ya colocada (de un cuerpo más interior), se oculta
    const ancho = el.offsetWidth || 60;
    if (ocupados.some(o => Math.abs(o.x - x) < (o.ancho + ancho) / 2 + 4 && Math.abs(o.y - y) < 18)) { el.style.display = 'none'; continue; }
    ocupados.push({ x, y, ancho });
    el.style.display = '';
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, calc(-100% - 8px))`;
  }
}

// ******  INTERFAZ  ******
const $ = (id) => document.getElementById(id);
const mostrar = { orbitas: true, nombres: true, asteroides: true, lunas: true, giro: false, brillo: true };

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
  const c = k ? CUERPOS[k] : null;
  $('distValor').textContent = c ? (c.distUA === null ? '0' : c.distUA.toLocaleString('es-MX')) : '—';
  $('distUnidad').textContent = c ? 'UA' : '';
}

// Ficha
function mostrarFicha(k) {
  const c = CUERPOS[k];
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
  $('ficha').hidden = false;
  ajustarVista();
  $('ficha').querySelector('.ficha-cuerpo').scrollTop = 0;
}
function ocultarFicha() { $('ficha').hidden = true; ajustarVista(); }

// En pantallas angostas la ficha ocupa la mitad de abajo: se recorre la imagen hacia arriba
function ajustarVista() {
  const w = window.innerWidth, h = window.innerHeight;
  if (w < 860 && !$('ficha').hidden) camera.setViewOffset(w, h, 0, h * 0.18, w, h);
  else camera.clearViewOffset();
}
$('fichaCerrar').addEventListener('click', vistaGeneral);
$('fichaVolver').addEventListener('click', vistaGeneral);
$('btnVista').addEventListener('click', vistaGeneral);

// Navegador anterior / siguiente
function mover(paso) {
  const i = enfocado ? ORDEN.indexOf(enfocado) : (paso > 0 ? -1 : ORDEN.length);
  enfocar(ORDEN[(i + paso + ORDEN.length) % ORDEN.length]);
}
$('anterior').addEventListener('click', () => mover(-1));
$('siguiente').addEventListener('click', () => mover(1));
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight') mover(1);
  else if (e.key === 'ArrowLeft') mover(-1);
  else if (e.key === 'Escape') vistaGeneral();
  else if (e.key === ' ') { e.preventDefault(); ponerVelocidad(estado.velocidad === 0 ? 1 : 0); }
});

// Tiempo
const botonesVel = $('velocidades');
function ponerVelocidad(v) {
  estado.velocidad = v;
  botonesVel.querySelectorAll('button').forEach(b => {
    const bv = Number(b.dataset.v);
    if (bv >= 0) b.classList.toggle('activo', bv === v);
  });
  $('velTexto').textContent = v === 0 ? 'En pausa' : `${v}x${estado.sentido < 0 ? ' ⇄' : ''}`;
}
botonesVel.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  const v = Number(b.dataset.v);
  if (v < 0) {
    estado.sentido *= -1;
    b.classList.toggle('activo', estado.sentido < 0);
    ponerVelocidad(estado.velocidad);
  } else ponerVelocidad(v);
});

// Brillo del Sol
$('solBrillo').addEventListener('input', (e) => {
  estado.sunIntensity = Number(e.target.value);
  sunMat.emissiveIntensity = estado.sunIntensity;
  $('solTexto').textContent = estado.sunIntensity.toFixed(1);
});

// Interruptores de la escena
function aplicarMostrar() {
  orbitas.forEach(o => { o.visible = mostrar.orbitas; });
  asteroids.forEach(a => { a.visible = mostrar.asteroides; });
  lunasVisibles.forEach(m => { m.visible = mostrar.lunas; });
  capaEtiquetas.classList.toggle('ocultas', !mostrar.nombres);
  controls.autoRotate = mostrar.giro && !enfocado;
  bloomPass.enabled = mostrar.brillo;
}
document.querySelectorAll('.toggle').forEach(b => {
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
const buscador = $('buscar');
const sugerencias = $('sugerencias');
let seleccion = 0;
function coincidencias(q) {
  q = normalizar(q);
  if (!q) return [];
  const alias = Object.entries(ALIAS).filter(([a]) => a.startsWith(q)).map(([, k]) => k);
  const propios = ORDEN.filter(k => normalizar(CUERPOS[k].nombre).includes(q) || k.startsWith(q));
  return [...new Set([...propios, ...alias])];
}
function pintarSugerencias() {
  const lista = coincidencias(buscador.value);
  sugerencias.replaceChildren();
  lista.forEach((k, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${CUERPOS[k].nombre}</span><small>${CUERPOS[k].tipo.split(' (')[0]}</small>`;
    li.classList.toggle('sel', i === seleccion);
    li.addEventListener('mousedown', (e) => { e.preventDefault(); elegir(k); });
    sugerencias.appendChild(li);
  });
  sugerencias.hidden = lista.length === 0;
  return lista;
}
function elegir(k) {
  enfocar(k);
  buscador.value = '';
  sugerencias.hidden = true;
  buscador.blur();
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

// Enlaces directos: #saturno, #saturn, #tierra…
function leerHash() {
  const h = normalizar(decodeURIComponent(location.hash.slice(1)));
  const k = CUERPOS[h] ? h : ALIAS[h];
  if (k) enfocar(k, { actualizarHash: false });
}
window.addEventListener('hashchange', leerHash);

// ******  ANIMACIÓN  ******
let tiempoSim = 0; // milisegundos simulados (para las lunas)
let ultimo = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const ahora = performance.now();
  const dtReal = Math.min(ahora - ultimo, 100);
  ultimo = ahora;
  const f = (dtReal / 16.67) * estado.velocidad * estado.sentido; // pasos de "frame" a 60 fps
  tiempoSim += dtReal * estado.velocidad * estado.sentido;

  sun.rotateY(0.001 * f);
  for (const k of ORDEN.slice(1)) {
    const s = SISTEMA[k];
    s.obj.planet.rotateY(s.rot * f);
    s.obj.planet3d.rotateY(s.orb * f);
  }
  venus.Atmosphere.rotateY(0.0005 * f);
  earth.Atmosphere.rotateY(0.001 * f);

  // Luna de la Tierra
  earth.moons.forEach(moon => {
    const a = tiempoSim * moon.orbitSpeed;
    const inclinacion = 5 * Math.PI / 180;
    moon.mesh.position.set(
      earth.planet.position.x + moon.orbitRadius * Math.cos(a),
      moon.orbitRadius * Math.sin(a) * Math.sin(inclinacion),
      earth.planet.position.z + moon.orbitRadius * Math.sin(a) * Math.cos(inclinacion)
    );
    moon.mesh.rotateY(0.01 * f);
  });
  // Lunas de Marte
  marsMoons.forEach(moon => {
    if (!moon.mesh) return;
    const a = tiempoSim * moon.orbitSpeed;
    moon.mesh.position.set(
      mars.planet.position.x + moon.orbitRadius * Math.cos(a),
      moon.orbitRadius * Math.sin(a),
      mars.planet.position.z + moon.orbitRadius * Math.sin(a)
    );
    moon.mesh.rotateY(0.001 * f);
  });
  // Lunas de Júpiter
  jupiter.moons.forEach(moon => {
    const a = tiempoSim * moon.orbitSpeed;
    moon.mesh.position.set(
      jupiter.planet.position.x + moon.orbitRadius * Math.cos(a),
      moon.orbitRadius * Math.sin(a),
      jupiter.planet.position.z + moon.orbitRadius * Math.sin(a)
    );
    moon.mesh.rotateY(0.01 * f);
  });

  // Asteroides
  const ang = 0.0001 * f, c = Math.cos(ang), sn = Math.sin(ang);
  for (const a of asteroids) {
    a.rotation.y += 0.0001 * f;
    const x = a.position.x, z = a.position.z;
    a.position.x = x * c + z * sn;
    a.position.z = z * c - x * sn;
  }

  // Contorno al pasar el ratón
  outlinePass.selectedObjects = [];
  if (hayRaton && mouse.x < 2) {
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(raycastTargets)[0];
    if (hit) {
      const k = mallaACuerpo.get(hit.object);
      outlinePass.selectedObjects = [SISTEMA[k].mesh];
      renderer.domElement.style.cursor = 'pointer';
    } else renderer.domElement.style.cursor = '';
  }

  actualizarCamara();
  controls.update();
  actualizarEtiquetas();
  composer.render();
}

loadAsteroids('/asteroids/asteroidPack.glb', 1000, 130, 160);
loadAsteroids('/asteroids/asteroidPack.glb', 3000, 352, 370);
aplicarMostrar();
leerHash();
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  ajustarVista();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  outlinePass.setSize(window.innerWidth, window.innerHeight);
});
