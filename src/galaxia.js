// Vía Láctea: modelo simplificado (barra central, 4 brazos espirales logarítmicos con inclinación
// de ~12°, Sol en el Brazo de Orión a ~26,000 años luz del centro). 1 unidad = 100 años luz.
// Incluye la vista "hélice": cómo avanzan el Sol y los planetas mientras orbitan el centro galáctico.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const K = Math.tan(THREE.MathUtils.degToRad(12)); // inclinación de los brazos
const R_INICIO = 90;      // radio donde nacen los brazos (extremos de la barra)
const R_MAX = 520;        // borde del disco (~52,000 años luz)
const R_SOL = 260;        // 26,000 años luz
const ANG_SOL = Math.PI;  // el Sol queda en −X
const R_PERSEO = 326;     // ~10 kpc a la altura del Sol
const PSI = ANG_SOL - Math.PI - Math.log(R_PERSEO / R_INICIO) / K;
export const ANIO_GALACTICO = 230; // millones de años por vuelta del Sol
const PATRON = 0.85;              // los brazos giran algo más lento que el Sol (aprox.)

const BRAZOS = [ // fase, estrellas, nombre (en el orden en que quedan hacia el centro desde el Sol)
  { fase: 0, n: 32000, mayor: true, nombre: 'Brazo de Escudo-Centauro' },
  { fase: Math.PI / 2, n: 14000, mayor: false, nombre: 'Brazo de Norma (y Exterior)' },
  { fase: Math.PI, n: 32000, mayor: true, nombre: 'Brazo de Perseo' },
  { fase: 3 * Math.PI / 2, n: 14000, mayor: false, nombre: 'Brazo de Sagitario-Carina' }
];

const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const radioBrazo = (fase, theta) => R_INICIO * Math.exp(K * (theta - fase - PSI));

function crearDisco(pixelRatio) {
  const pos = [], col = [], tam = [];
  const add = (x, y, z, c, s) => { pos.push(x, y, z); col.push(...c); tam.push(s * pixelRatio); };
  const azul = [0.62, 0.74, 1.0], blanco = [0.9, 0.9, 1.0], rosa = [1.0, 0.42, 0.62], amarillo = [1.0, 0.82, 0.56], naranja = [1.0, 0.7, 0.45];

  // Brazos
  for (const b of BRAZOS) {
    const tMax = Math.log(R_MAX / R_INICIO) / K;
    for (let i = 0; i < b.n; i++) {
      const u = Math.pow(Math.random(), 0.8) * tMax;
      const th = b.fase + PSI + u;
      const r = radioBrazo(b.fase, th);
      const ancho = (b.mayor ? 3.5 : 2.8) + r * 0.022;
      const rr = r + gauss() * ancho, tt = th + gauss() * 0.04;
      const c = Math.random() < 0.05 ? rosa : (Math.random() < 0.6 ? azul : blanco);
      const f = 0.7 + Math.random() * 0.3;
      add(rr * Math.cos(tt), gauss() * 2.5, -rr * Math.sin(tt), c.map(x => x * f), 1.4 + Math.random() * 1.8);
    }
  }
  // Disco de fondo (exponencial)
  for (let i = 0; i < 22000; i++) {
    const r = -Math.log(1 - Math.random() * 0.995) * 120;
    if (r > R_MAX) continue;
    const t = Math.random() * Math.PI * 2, f = 0.12 + Math.random() * 0.18;
    add(r * Math.cos(t), gauss() * 3.5, -r * Math.sin(t), blanco.map(x => x * f), 0.8 + Math.random());
  }
  // Barra central (orientada como los extremos de los brazos mayores)
  const cb = Math.cos(PSI), sb = Math.sin(PSI);
  for (let i = 0; i < 16000; i++) {
    const a = gauss() * 48, b = gauss() * 14, y = gauss() * 9;
    const x = a * cb - b * sb, z = -(a * sb + b * cb);
    const f = 0.5 + Math.random() * 0.5;
    add(x, y, z, (Math.random() < 0.5 ? amarillo : naranja).map(v => v * f), 1 + Math.random() * 1.5);
  }
  // Bulbo
  for (let i = 0; i < 22000; i++) {
    const r = Math.abs(gauss()) * 26, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    const f = 0.55 + Math.random() * 0.45;
    add(r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * 0.6, r * Math.sin(p) * Math.sin(t), amarillo.map(v => v * f), 1 + Math.random() * 1.5);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setAttribute('tam', new THREE.Float32BufferAttribute(tam, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float tam; varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(tam * 320.0 / -mv.z, 0.6, 9.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.05, d) * 0.75; gl_FragColor = vec4(vColor * a, a); }`,
    vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const puntos = new THREE.Points(geo, mat);
  puntos.frustumCulled = false;
  return puntos;
}

function brillo(color, tamano) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.15, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  s.scale.setScalar(tamano);
  return s;
}

export function crearGalaxia(renderer) {
  const pr = Math.min(window.devicePixelRatio, 2);
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x000000);
  const camara = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 6000);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.maxDistance = 2500;
  controles.enabled = false;

  // Fondo de estrellas lejanas
  const fondo = new THREE.BufferGeometry(), fp = [];
  for (let i = 0; i < 4000; i++) { const v = new THREE.Vector3(gauss(), gauss(), gauss()).normalize().multiplyScalar(4000); fp.push(v.x, v.y, v.z); }
  fondo.setAttribute('position', new THREE.Float32BufferAttribute(fp, 3));
  escena.add(new THREE.Points(fondo, new THREE.PointsMaterial({ color: 0x8890a0, size: 1.2 * pr, sizeAttenuation: false })));

  // Disco (gira como patrón)
  const disco = new THREE.Group();
  disco.add(crearDisco(pr));
  const nucleo = brillo('rgba(255,200,140,0.55)', 80);
  disco.add(nucleo);
  escena.add(disco);

  // Anclas para las etiquetas de los brazos (en el marco del disco)
  const anclas = BRAZOS.map(b => {
    const th = ANG_SOL + 0.55;
    let r = radioBrazo(b.fase, th);
    while (r < 150) r *= Math.exp(K * 2 * Math.PI);
    const o = new THREE.Object3D(); o.position.set(r * Math.cos(th), 0, -r * Math.sin(th));
    disco.add(o);
    return { nombre: b.nombre, obj: o };
  });
  const centro = new THREE.Object3D(); disco.add(centro);
  anclas.push({ nombre: 'Centro galáctico · Sagitario A*', obj: centro });

  // Sol y su órbita
  const sol = new THREE.Group();
  const solBrillo = brillo('rgba(255,230,120,1)', 22);
  sol.add(solBrillo);
  escena.add(sol);
  const orbita = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, R_SOL, R_SOL).getPoints(256).map(p => new THREE.Vector3(p.x, 0, p.y))),
    new THREE.LineDashedMaterial({ color: 0xffd36b, transparent: true, opacity: 0.45, dashSize: 6, gapSize: 5 })
  );
  orbita.computeLineDistances();
  escena.add(orbita);
  const brazoOrion = new THREE.Object3D(); disco.add(brazoOrion);

  // Posición del Sol: gira en sentido horario visto desde el norte galáctico.
  // Oscilación vertical: amplitud ~250 años luz, periodo ~70 millones de años (valores aproximados).
  function posicionSol(t, destino) {
    const ang = ANG_SOL - (2 * Math.PI / ANIO_GALACTICO) * t;
    return destino.set(R_SOL * Math.cos(ang), 2.5 * Math.sin(2 * Math.PI * t / 70 + 0.26), -R_SOL * Math.sin(ang));
  }

  // ---------- Vista hélice ----------
  const helice = crearHelice(renderer, pr);

  let tiempo = 0;           // millones de años desde hoy
  let vista = 'galaxia';    // 'galaxia' | 'sol' | 'helice'
  const objetivo = new THREE.Vector3(), tmp = new THREE.Vector3();
  let volando = false, destinoCam = new THREE.Vector3(), destinoObj = new THREE.Vector3(), siguiendo = false;
  const previo = new THREE.Vector3();

  function ponerVista(v) {
    vista = v;
    controles.enabled = v !== 'helice';
    helice.controles.enabled = v === 'helice';
    if (v === 'galaxia') {
      siguiendo = false; volando = true;
      destinoCam.set(0, 760, 360); destinoObj.set(0, 0, 0);
      controles.minDistance = 20;
    } else if (v === 'sol') {
      posicionSol(tiempo, tmp);
      siguiendo = true; volando = true;
      destinoObj.copy(tmp);
      destinoCam.copy(tmp).add(new THREE.Vector3(tmp.x * 0.12 + 30, 38, tmp.z * 0.12 + 50));
      controles.minDistance = 3;
      previo.copy(tmp);
    }
  }

  function actualizar(dtReal, millonesPorSegundo, aniosPorSegundo) {
    if (vista === 'helice') { helice.actualizar(dtReal, aniosPorSegundo); return; }
    tiempo += dtReal / 1000 * millonesPorSegundo;
    disco.rotation.y = -(2 * Math.PI / ANIO_GALACTICO) * PATRON * tiempo;
    posicionSol(tiempo, sol.position);
    const delta = tmp.copy(sol.position).sub(previo);
    previo.copy(sol.position);
    if (volando) {
      if (siguiendo) { destinoCam.add(delta); destinoObj.add(delta); }
      camara.position.lerp(destinoCam, 0.06);
      controles.target.lerp(destinoObj, 0.1);
      if (camara.position.distanceTo(destinoCam) < 1) volando = false;
    } else if (siguiendo) {
      camara.position.add(delta);
      controles.target.copy(sol.position);
    }
    controles.update();
  }

  function etiquetas() {
    if (vista === 'helice') return helice.etiquetas();
    const lista = anclas.map(a => ({ nombre: a.nombre, pos: a.obj.getWorldPosition(new THREE.Vector3()), tipo: 'brazo' }));
    lista.push({ nombre: 'Sol · estás aquí', pos: sol.position.clone(), tipo: 'sol' });
    return lista;
  }

  camara.position.set(0, 760, 360);
  previo.copy(posicionSol(0, sol.position));

  return {
    escena: () => vista === 'helice' ? helice.escena : escena,
    camara: () => vista === 'helice' ? helice.camara : camara,
    controlesActivos: (on) => { controles.enabled = on && vista !== 'helice'; helice.controles.enabled = on && vista === 'helice'; },
    ponerVista, actualizar, etiquetas,
    tiempo: () => tiempo,
    reiniciar: () => { tiempo = 0; helice.reiniciar(); },
    vista: () => vista,
    redimensionar(w, h) {
      for (const c of [camara, helice.camara]) { c.aspect = w / h; c.updateProjectionMatrix(); }
    },
    helice
  };
}

// El Sol avanza ~230 km/s alrededor del centro galáctico mientras los planetas lo orbitan: cada
// planeta traza una hélice. El plano de las órbitas está inclinado ~60° respecto al plano galáctico.
function crearHelice(renderer, pr) {
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(0x000000);
  const camara = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 5000);
  camara.position.set(-70, 45, 95);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableDamping = true; controles.dampingFactor = 0.08; controles.enabled = false;

  const PLANETAS = [ // nombre, a (UA), periodo (años), color
    ['Mercurio', 0.387, 0.2408, 0xb8b0a5], ['Venus', 0.723, 0.6152, 0xe8c78e], ['Tierra', 1, 1, 0x5b93d6], ['Marte', 1.524, 1.8808, 0xd0703f],
    ['Júpiter', 5.203, 11.862, 0xd8ad7c], ['Saturno', 9.537, 29.457, 0xe6cd92], ['Urano', 19.19, 84.02, 0xa6dbe0], ['Neptuno', 30.07, 164.8, 0x5a7ee6]
  ];
  const ESCALA = 6; // radio = 6·√a (comprimido para que se vean juntos)
  const V_REAL = 48.4 * ESCALA; // 230 km/s ≈ 48.4 UA por año (con 1 UA = ESCALA unidades)
  const N = 1800;

  const plano = new THREE.Group();
  plano.rotation.z = THREE.MathUtils.degToRad(60); // inclinación respecto al plano galáctico
  escena.add(plano);
  const rejilla = new THREE.GridHelper(400, 40, 0x223044, 0x162030);
  rejilla.material.transparent = true; rejilla.material.opacity = 0.5;
  escena.add(rejilla);
  const flecha = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(45, 0, 0), 30, 0xffd36b, 6, 3);
  escena.add(flecha);
  const sol = brillo('rgba(255,225,120,1)', 9);
  escena.add(sol);

  const cuerpos = PLANETAS.map(([nombre, a, periodo, color]) => {
    const r = ESCALA * Math.sqrt(a);
    const m = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.6, Math.min(1.6, r * 0.05)), 16, 12), new THREE.MeshBasicMaterial({ color }));
    escena.add(m);
    const buf = new Float32Array(N * 3);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(buf, 3)); g.setDrawRange(0, 0);
    const linea = new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }));
    linea.frustumCulled = false;
    escena.add(linea);
    return { nombre, r, periodo, m, buf, g, linea, cuenta: 0, fase: Math.random() * Math.PI * 2 };
  });

  let anios = 0, xSol = 0, velocidadReal = false;
  const v = new THREE.Vector3();

  function posPlaneta(c, t, destino) {
    const ang = c.fase + 2 * Math.PI * t / c.periodo;
    destino.set(c.r * Math.cos(ang), 0, -c.r * Math.sin(ang));
    destino.applyEuler(plano.rotation);
    return destino;
  }

  function actualizar(dtReal, aniosPorSegundo) {
    const dt = dtReal / 1000 * aniosPorSegundo;
    const vel = velocidadReal ? V_REAL : V_REAL / 30;
    const pasos = Math.min(24, Math.max(1, Math.ceil(dt / 0.01)));
    for (let p = 1; p <= pasos; p++) {
      const t = anios + dt * p / pasos, x = xSol + vel * dt * p / pasos;
      for (const c of cuerpos) {
        // Solo se agrega punto si el planeta avanzó lo suficiente en su órbita
        const ultimo = c.cuenta ? c.buf[(c.cuenta - 1) * 3] : -Infinity;
        posPlaneta(c, t, v); v.x += x;
        if (c.cuenta && Math.abs(v.x - ultimo) < 0.02 && p < pasos) continue;
        if (c.cuenta === N) { c.buf.copyWithin(0, 3); c.cuenta--; }
        c.buf.set([v.x, v.y, v.z], c.cuenta * 3); c.cuenta++;
      }
    }
    anios += dt; xSol += vel * dt;
    // El Sol queda en el origen: todo lo demás se desplaza hacia atrás
    for (const c of cuerpos) {
      c.g.attributes.position.needsUpdate = true; c.g.setDrawRange(0, c.cuenta);
      c.linea.position.x = -xSol;
      posPlaneta(c, anios, c.m.position);
    }
    rejilla.position.x = -(xSol % 10);
    controles.update();
  }

  function reiniciar() {
    anios = 0; xSol = 0;
    for (const c of cuerpos) { c.cuenta = 0; c.g.setDrawRange(0, 0); }
  }

  return {
    escena, camara, controles, actualizar, reiniciar,
    ponerVelocidadReal(b) { velocidadReal = b; reiniciar(); },
    anios: () => anios,
    etiquetas: () => [{ nombre: 'Sol', pos: new THREE.Vector3(0, 0, 0), tipo: 'sol' },
      { nombre: 'Dirección del movimiento', pos: new THREE.Vector3(80, 0, 0), tipo: 'brazo' },
      ...cuerpos.slice(2, 3).concat(cuerpos.slice(4)).map(c => ({ nombre: c.nombre, pos: c.m.position.clone(), tipo: 'planeta' }))]
  };
}
