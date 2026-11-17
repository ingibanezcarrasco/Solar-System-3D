// Cielo real: estrellas hasta magnitud 6 (las visibles a simple vista), líneas y nombres de las
// 88 constelaciones. Datos de d3-celestial (BSD-3-Clause, Olaf Frohn), en static/cielo.json.
import * as THREE from 'three';
import { direccionEcuatorial } from './orbitas.js';

const RADIO = 1500; // la esfera sigue a la cámara: las estrellas quedan "en el infinito"

// Color aproximado de una estrella según su índice de color B−V
const TABLA_BV = [[-0.4, [0.62, 0.70, 1.0]], [0.0, [0.80, 0.85, 1.0]], [0.4, [0.98, 0.97, 1.0]], [0.6, [1.0, 0.95, 0.90]],
  [0.9, [1.0, 0.88, 0.76]], [1.3, [1.0, 0.78, 0.58]], [1.7, [1.0, 0.66, 0.42]], [2.2, [1.0, 0.55, 0.32]]];
function colorBV(bv) {
  if (bv <= TABLA_BV[0][0]) return TABLA_BV[0][1];
  for (let i = 1; i < TABLA_BV.length; i++) {
    const [b1, c1] = TABLA_BV[i];
    if (bv <= b1) {
      const [b0, c0] = TABLA_BV[i - 1], t = (bv - b0) / (b1 - b0);
      return c0.map((c, j) => c + (c1[j] - c) * t);
    }
  }
  return TABLA_BV[TABLA_BV.length - 1][1];
}

export function crearCielo(datos, pixelRatio) {
  const grupo = new THREE.Group();
  grupo.renderOrder = -1;
  const v = new THREE.Vector3();

  // Estrellas
  const n = datos.estrellas.length;
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), tam = new Float32Array(n);
  datos.estrellas.forEach(([ra, dec, mag, bv], i) => {
    direccionEcuatorial(ra, dec, v).multiplyScalar(RADIO);
    pos.set([v.x, v.y, v.z], i * 3);
    const brillo = THREE.MathUtils.clamp(1.35 - (mag + 1.5) * 0.11, 0.4, 1.4);
    col.set(colorBV(bv).map(c => c * brillo), i * 3);
    tam[i] = THREE.MathUtils.clamp(6.5 - mag * 0.8, 2, 8.5) * pixelRatio;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('tam', new THREE.BufferAttribute(tam, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float tam; varying vec3 vColor;
      void main() { vColor = color; gl_PointSize = tam; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec3 vColor;
      void main() { float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vColor * a, a); }`,
    vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
  });
  const estrellas = new THREE.Points(geo, mat);
  estrellas.frustumCulled = false;
  grupo.add(estrellas);

  // Líneas de las constelaciones
  const seg = [];
  for (const tramo of datos.lineas) {
    for (let i = 1; i < tramo.length; i++) {
      for (const [ra, dec] of [tramo[i - 1], tramo[i]]) {
        direccionEcuatorial(ra, dec, v).multiplyScalar(RADIO * 0.999);
        seg.push(v.x, v.y, v.z);
      }
    }
  }
  const geoL = new THREE.BufferGeometry();
  geoL.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
  const lineas = new THREE.LineSegments(geoL, new THREE.LineBasicMaterial({ color: 0x6f9fd8, transparent: true, opacity: 0.28, depthWrite: false }));
  lineas.frustumCulled = false;
  grupo.add(lineas);

  // Puntos de anclaje para los nombres (direcciones unitarias)
  const nombres = datos.nombres.map(([nombre, ra, dec, rango]) => ({
    nombre: nombre.replace(/\u2005/g, ' '), rango, dir: direccionEcuatorial(ra, dec, new THREE.Vector3())
  }));

  return { grupo, estrellas, lineas, nombres, RADIO };
}
