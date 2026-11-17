// Cielo desde un lugar de la Tierra: estrellas, constelaciones, Sol, Luna y planetas en su posición
// real (altura y acimut) para una latitud, longitud y hora. Todo se calcula en el navegador.
//
// Marco local de la escena: +Y = cenit, −Z = norte, +X = este (mirando al norte, el este queda a la derecha).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { posicionUA } from './orbitas.js';
import { crearCielo } from './cielo.js';

const rad = THREE.MathUtils.degToRad, deg = THREE.MathUtils.radToDeg;
const EPS = rad(23.43928);
const J2000 = 2451545.0;

// (AR, Dec) en grados → vector ecuatorial J2000 (X = punto vernal, Z = polo norte celeste)
const ecuatorial = (ra, dec, v) => v.set(Math.cos(rad(dec)) * Math.cos(rad(ra)), Math.cos(rad(dec)) * Math.sin(rad(ra)), Math.sin(rad(dec)));
// Eclíptico (x, y, z) → ecuatorial
const eclAEcu = (x, y, z, v) => v.set(x, y * Math.cos(EPS) - z * Math.sin(EPS), y * Math.sin(EPS) + z * Math.cos(EPS));

// Tiempo sidéreo medio de Greenwich (grados)
const gmst = (jd) => ((280.46061837 + 360.98564736629 * (jd - J2000)) % 360 + 360) % 360;

// Luna: fórmula abreviada (error < ~0.5°), longitud y latitud eclípticas de la fecha
function lunaEcliptica(jd) {
  const d = jd - J2000, s = (g) => Math.sin(rad(g));
  const L = 218.316 + 13.176396 * d, Mm = 134.963 + 13.064993 * d, F = 93.272 + 13.229350 * d;
  const D = 297.850 + 12.190749 * d, Ms = 357.529 + 0.98560028 * d;
  const lon = L + 6.289 * s(Mm) + 1.274 * s(2 * D - Mm) + 0.658 * s(2 * D) + 0.214 * s(2 * Mm) - 0.186 * s(Ms) - 0.114 * s(2 * F)
    - 1.397 * (d / 36525); // precesión aproximada para pasar al equinoccio J2000
  const lat = 5.128 * s(F) + 0.281 * s(Mm + F) + 0.278 * s(Mm - F) + 0.173 * s(2 * D - F);
  return [lon, lat];
}

const PLANETAS = [ // clave, nombre, color, tamaño en pantalla (según el brillo típico)
  ['mercurio', 'Mercurio', 0xd9cfc0, 0.016], ['venus', 'Venus', 0xfff4d6, 0.03], ['marte', 'Marte', 0xff9a6a, 0.019],
  ['jupiter', 'Júpiter', 0xffe9c4, 0.026], ['saturno', 'Saturno', 0xf3dda0, 0.019],
  ['urano', 'Urano', 0xbfeaf0, 0.009, true], ['neptuno', 'Neptuno', 0x9fb6ff, 0.008, true]
];

const RUMBOS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
export const rumbo = (az) => RUMBOS[Math.round(((az % 360) + 360) % 360 / 22.5) % 16];

// Colores del cielo según la altura del Sol: [altura, cénit, horizonte, opacidad de las estrellas, suelo]
const TONOS = [
  [-18, 0x000000, 0x05070d, 1.0, 0x050706],
  [-12, 0x040915, 0x0f1729, 0.85, 0x070a09],
  [-6, 0x0b1834, 0x33324d, 0.45, 0x0b100d],
  [0, 0x1c3b74, 0xd99a68, 0.18, 0x141c16],
  [6, 0x2c5cab, 0x9ec3e6, 0.1, 0x1b2619],
  [90, 0x2a5cb0, 0xa8cbec, 0.1, 0x1d2a1c]
];

function brilloCanvas(color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, '#fff'); gr.addColorStop(0.18, color); gr.addColorStop(0.45, color.replace('1)', '0.25)')); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function crearCieloLocal(renderer, datos, { pr = 1, texLuna = null } = {}) {
  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.5, 5000);
  const controles = new OrbitControls(camara, renderer.domElement);
  controles.enableZoom = false; controles.enablePan = false;
  controles.enableDamping = true; controles.dampingFactor = 0.1;
  controles.rotateSpeed = -0.3; // se "arrastra el cielo" en lugar de girar alrededor de un objeto
  controles.minPolarAngle = Math.PI / 2 - 0.3; // se puede mirar un poco por debajo del horizonte
  controles.maxPolarAngle = Math.PI - 0.001;
  controles.enabled = false;

  // Bóveda: degradado según la altura del Sol
  const domo = new THREE.Mesh(new THREE.SphereGeometry(1900, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { cenit: { value: new THREE.Color() }, horizonte: { value: new THREE.Color() }, solDir: { value: new THREE.Vector3(0, -1, 0) }, halo: { value: 0 } },
    vertexShader: 'varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform vec3 cenit, horizonte, solDir; uniform float halo; varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = mix(horizonte, cenit, pow(clamp(d.y, 0.0, 1.0), 0.45));
        float s = max(dot(d, solDir), 0.0);
        c += halo * vec3(1.0, 0.86, 0.62) * (pow(s, 10.0) * 0.35 + pow(s, 300.0) * 1.2);
        gl_FragColor = vec4(c, 1.0);
      }`
  }));
  domo.renderOrder = -10;
  escena.add(domo);

  // Cielo fijo a las estrellas (marco ecuatorial): gira con la hora y la latitud
  const cielo = new THREE.Group();
  cielo.matrixAutoUpdate = false;
  escena.add(cielo);
  const estrellas = crearCielo(datos, pr, ecuatorial, 1.35);
  estrellas.grupo.renderOrder = -5;
  cielo.add(estrellas.grupo);
  const RADIO = estrellas.RADIO;

  // Eclíptica (el camino del Sol y, más o menos, de la Luna y los planetas)
  const pe = [], v = new THREE.Vector3();
  for (let i = 0; i <= 360; i += 2) { eclAEcu(Math.cos(rad(i)), Math.sin(rad(i)), 0, v).multiplyScalar(RADIO * 0.998); pe.push(v.x, v.y, v.z); }
  const ecliptica = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pe, 3)),
    new THREE.LineDashedMaterial({ color: 0xffc56b, transparent: true, opacity: 0.35, dashSize: 14, gapSize: 10, depthWrite: false }));
  ecliptica.computeLineDistances();
  ecliptica.visible = false;
  cielo.add(ecliptica);

  // Sol
  const sol = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloCanvas('rgba(255,236,170,1)'), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sol.scale.setScalar(RADIO * 0.09);
  escena.add(sol);

  // Luna: esfera iluminada desde la dirección del Sol, así la fase sale sola. Va agrandada ×2.5.
  const luzSol = new THREE.DirectionalLight(0xffffff, 3.2);
  escena.add(luzSol, luzSol.target);
  escena.add(new THREE.AmbientLight(0x404858, 0.25)); // luz cenicienta
  const luna = new THREE.Mesh(new THREE.SphereGeometry(RADIO * Math.tan(rad(0.26)) * 3.5, 48, 32),
    new THREE.MeshStandardMaterial({ map: texLuna, color: texLuna ? 0xffffff : 0xcfcfcf, roughness: 1, metalness: 0 }));
  escena.add(luna);

  // Planetas: puntos brillantes de tamaño fijo en pantalla
  const planetas = PLANETAS.map(([clave, nombre, color, tam, telescopio]) => {
    const css = `rgba(${(color >> 16) & 255},${(color >> 8) & 255},${color & 255},1)`;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloCanvas(css), sizeAttenuation: false, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    s.scale.setScalar(tam * 1.6);
    escena.add(s);
    return { clave, nombre, s, telescopio: !!telescopio };
  });

  // Suelo: tapa todo lo que queda bajo el horizonte
  const suelo = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 12, 0, Math.PI * 2, Math.PI / 2 + 0.0005, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x070a08, side: THREE.BackSide, transparent: true, depthTest: false, depthWrite: false }));
  suelo.renderOrder = 10;
  escena.add(suelo);
  const pc = [];
  for (let i = 0; i <= 128; i++) { const a = i / 128 * Math.PI * 2; pc.push(Math.cos(a) * 1790, 0, Math.sin(a) * 1790); }
  const horizonte = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pc, 3)),
    new THREE.LineBasicMaterial({ color: 0x6d8a77, transparent: true, opacity: 0.6, depthTest: false }));
  horizonte.renderOrder = 11;
  escena.add(horizonte);

  // Estado
  let lat = 19.43, lon = -99.13;
  const M = new THREE.Matrix4();
  const dirSol = new THREE.Vector3(), dirLuna = new THREE.Vector3(), tierra = new THREE.Vector3(), p = new THREE.Vector3();
  const info = { solAlt: 0, iluminacion: 0, creciente: true };
  const objetos = []; // { clave, nombre, dir (local), alt, az, telescopio }

  // Matriz ecuatorial → local para un tiempo sidéreo local y una latitud
  function matrizLocal(lstDeg) {
    const L = rad(lstDeg), f = rad(lat), sL = Math.sin(L), cL = Math.cos(L), sf = Math.sin(f), cf = Math.cos(f);
    M.set(
      -sL, cL, 0, 0,
      cf * cL, cf * sL, sf, 0,
      sf * cL, sf * sL, -cf, 0,
      0, 0, 0, 1);
  }
  const altAz = (d) => [deg(Math.asin(THREE.MathUtils.clamp(d.y, -1, 1))), (deg(Math.atan2(d.x, -d.z)) + 360) % 360];

  // Vector ecuatorial geocéntrico de un planeta (desde la posición heliocéntrica de la escena)
  function geocentrico(clave, jd, destino) {
    posicionUA(clave, jd, p).sub(tierra);           // escena: (x, z_ecl, −y_ecl)
    return eclAEcu(p.x, -p.z, p.y, destino).normalize();
  }

  // Mirar hacia una dirección (animado)
  const mirada = new THREE.Vector3(0, 0.35, -1).normalize(), objetivoMirada = new THREE.Vector3();
  let girando = false;
  function aplicarMirada() { camara.position.copy(mirada).multiplyScalar(-1); controles.target.set(0, 0, 0); camara.lookAt(0, 0, 0); }
  aplicarMirada();

  function tono(h) {
    let i = 0;
    while (i < TONOS.length - 2 && h > TONOS[i + 1][0]) i++;
    const [h0, c0, z0, o0, s0] = TONOS[i], [h1, c1, z1, o1, s1] = TONOS[i + 1];
    const t = THREE.MathUtils.clamp((h - h0) / (h1 - h0), 0, 1);
    const mezcla = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), t);
    return { cenit: mezcla(c0, c1), horizonte: mezcla(z0, z1), estrellas: THREE.MathUtils.lerp(o0, o1, t), suelo: mezcla(s0, s1) };
  }

  function actualizar(jd) {
    matrizLocal(gmst(jd) + lon);
    cielo.matrix.copy(M);
    cielo.matrixWorldNeedsUpdate = true;
    posicionUA('tierra', jd, tierra);
    objetos.length = 0;
    const agregar = (clave, nombre, ecu, obj, extra = {}) => {
      const d = ecu.clone().applyMatrix4(M).normalize();
      if (clave === 'luna') { // paralaje: vista desde la superficie, la Luna aparece ~0.95° más baja
        const [a0] = altAz(d), corr = rad(0.95 * Math.cos(rad(a0)));
        const horiz = new THREE.Vector3(d.x, 0, d.z).normalize();
        const alt = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) - corr;
        d.copy(horiz.multiplyScalar(Math.cos(alt))).setY(Math.sin(alt));
      }
      const [alt, az] = altAz(d);
      if (obj) obj.position.copy(d).multiplyScalar(RADIO * 0.97);
      objetos.push({ clave, nombre, dir: d, alt, az, ...extra });
      return d;
    };
    // Sol (dirección opuesta a la Tierra vista desde el Sol)
    eclAEcu(-tierra.x, tierra.z, -tierra.y, dirSol).normalize();
    const dSol = agregar('sol', 'Sol', dirSol, sol);
    // Luna
    const [lL, bL] = lunaEcliptica(jd);
    eclAEcu(Math.cos(rad(bL)) * Math.cos(rad(lL)), Math.cos(rad(bL)) * Math.sin(rad(lL)), Math.sin(rad(bL)), dirLuna);
    const elong = dirLuna.angleTo(dirSol);
    info.iluminacion = (1 - Math.cos(elong)) / 2;
    const lonSol = deg(Math.atan2(tierra.z, -tierra.x)); // longitud eclíptica del Sol
    info.creciente = ((lL - lonSol) % 360 + 360) % 360 < 180;
    const dLuna = agregar('luna', 'Luna', dirLuna, luna, { iluminacion: info.iluminacion });
    luna.lookAt(0, 0, 0); luna.rotateY(-Math.PI / 2);
    // La luz llega desde el Sol hacia la Luna
    luzSol.position.copy(dLuna).multiplyScalar(RADIO * 0.97).addScaledVector(dSol, 500);
    luzSol.target.position.copy(luna.position);
    // Planetas
    for (const pl of planetas) {
      const e = geocentrico(pl.clave, jd, new THREE.Vector3());
      agregar(pl.clave, pl.nombre, e, pl.s, { telescopio: pl.telescopio });
    }
    // Colores del cielo
    info.solAlt = altAz(dSol)[0];
    const t = tono(info.solAlt);
    domo.material.uniforms.cenit.value.copy(t.cenit);
    domo.material.uniforms.horizonte.value.copy(t.horizonte);
    domo.material.uniforms.solDir.value.copy(dSol);
    domo.material.uniforms.halo.value = THREE.MathUtils.clamp((info.solAlt + 10) / 12, 0, 1);
    estrellas.estrellas.material.uniforms.opacidad.value = t.estrellas;
    estrellas.lineas.material.opacity = 0.28 * Math.max(t.estrellas, 0.35);
    suelo.material.color.copy(t.suelo);
    // Los planetas débiles se pierden de día
    for (const pl of planetas) pl.s.material.opacity = THREE.MathUtils.clamp(t.estrellas * 1.6, pl.clave === 'venus' ? 0.5 : 0.15, 1);
  }

  function animar() {
    if (girando) {
      mirada.lerp(objetivoMirada, 0.08).normalize();
      if (mirada.angleTo(objetivoMirada) < 0.002) girando = false;
      aplicarMirada();
    } else {
      controles.update();
      mirada.copy(camara.position).multiplyScalar(-1).normalize();
    }
  }

  function mirar(clave) {
    const o = objetos.find(x => x.clave === clave);
    if (!o) return;
    objetivoMirada.copy(o.dir);
    if (o.alt < 5) { objetivoMirada.y = Math.sin(rad(8)); objetivoMirada.normalize(); } // bajo el horizonte: mirar hacia ese rumbo
    girando = true;
  }

  function mirarRumbo(azGrados, altGrados = 30) {
    const a = rad(azGrados), h = rad(altGrados);
    objetivoMirada.set(Math.cos(h) * Math.sin(a), Math.sin(h), -Math.cos(h) * Math.cos(a));
    girando = true;
  }

  // Etiquetas (posiciones en el mundo)
  const CARDINALES = [['N', 0], ['NE', 45], ['E', 90], ['SE', 135], ['S', 180], ['SO', 225], ['O', 270], ['NO', 315]];
  function etiquetas() {
    const lista = [];
    for (const o of objetos) {
      if (o.alt < -0.5) continue;
      const pos = o.dir.clone().multiplyScalar(RADIO * 0.97);
      lista.push({ id: 'l-' + o.clave, nombre: o.nombre, pos, tipo: o.clave === 'sol' ? 'sol' : 'planeta' });
    }
    for (const [n, az] of CARDINALES) {
      const a = rad(az);
      lista.push({ id: 'card-' + n, nombre: n, pos: new THREE.Vector3(Math.sin(a) * 1700, 6, -Math.cos(a) * 1700), tipo: 'cardinal' });
    }
    return lista;
  }
  function etiquetasConstelaciones() {
    const lista = [];
    estrellas.nombres.forEach((n, i) => {
      const d = n.dir.clone().applyMatrix4(M);
      if (d.y < 0.02) return;
      lista.push({ id: 'lc' + i, nombre: n.nombre, pos: d.multiplyScalar(RADIO) });
    });
    return lista;
  }

  return {
    escena, camara, controles, actualizar, animar, mirar, mirarRumbo, etiquetas, etiquetasConstelaciones, info,
    objetos: () => objetos,
    ponerUbicacion(la, lo) { lat = la; lon = lo; },
    ubicacion: () => ({ lat, lon }),
    mostrar({ constelaciones, ecliptica: ecl }) {
      if (constelaciones !== undefined) estrellas.lineas.visible = constelaciones;
      if (ecl !== undefined) ecliptica.visible = ecl;
    },
    zoom(factor) { camara.fov = THREE.MathUtils.clamp(camara.fov * factor, 15, 100); camara.updateProjectionMatrix(); },
    redimensionar(w, h) { camara.aspect = w / h; camara.updateProjectionMatrix(); }
  };
}
