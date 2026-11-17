// Órbitas reales con los elementos keplerianos de JPL ("Keplerian Elements for Approximate
// Positions of the Major Planets", E. M. Standish, tabla 1, válida 1800–2050).
// Cada elemento: [valor en J2000, cambio por siglo juliano].
//   a (UA), e, I (°), L longitud media (°), w̄ longitud del perihelio (°), Ω nodo ascendente (°)
import * as THREE from 'three';

export const ELEMENTOS = {
  mercurio: { a: [0.38709927, 0.00000037], e: [0.20563593, 0.00001906], I: [7.00497902, -0.00594749], L: [252.25032350, 149472.67411175], wb: [77.45779628, 0.16047689], O: [48.33076593, -0.12534081] },
  venus:    { a: [0.72333566, 0.00000390], e: [0.00677672, -0.00004107], I: [3.39467605, -0.00078890], L: [181.97909950, 58517.81538729], wb: [131.60246718, 0.00268329], O: [76.67984255, -0.27769418] },
  tierra:   { a: [1.00000261, 0.00000562], e: [0.01671123, -0.00004392], I: [-0.00001531, -0.01294668], L: [100.46457166, 35999.37244981], wb: [102.93768193, 0.32327364], O: [0, 0] },
  marte:    { a: [1.52371034, 0.00001847], e: [0.09339410, 0.00007882], I: [1.84969142, -0.00813131], L: [-4.55343205, 19140.30268499], wb: [-23.94362959, 0.44441088], O: [49.55953891, -0.29257343] },
  jupiter:  { a: [5.20288700, -0.00011607], e: [0.04838624, -0.00013253], I: [1.30439695, -0.00183714], L: [34.39644051, 3034.74612775], wb: [14.72847983, 0.21252668], O: [100.47390909, 0.20469106] },
  saturno:  { a: [9.53667594, -0.00125060], e: [0.05386179, -0.00050991], I: [2.48599187, 0.00193609], L: [49.95424423, 1222.49362201], wb: [92.59887831, -0.41897216], O: [113.66242448, -0.28867794] },
  urano:    { a: [19.18916464, -0.00196176], e: [0.04725744, -0.00004397], I: [0.77263783, -0.00242939], L: [313.23810451, 428.48202785], wb: [170.95427630, 0.40805281], O: [74.01692503, 0.04240589] },
  neptuno:  { a: [30.06992276, 0.00026291], e: [0.00859048, 0.00005105], I: [1.77004347, 0.00035372], L: [-55.12002969, 218.45945325], wb: [44.96476227, -0.32241464], O: [131.78422574, -0.00508664] },
  pluton:   { a: [39.48211675, -0.00031596], e: [0.24882730, 0.00005170], I: [17.14001206, 0.00004818], L: [238.92903833, 145.20780515], wb: [224.06891629, -0.04062942], O: [110.30393684, -0.01183482] }
};

// Polo norte de rotación (IAU, ascensión recta y declinación en °), periodo de rotación en días
// (negativo = retrógrado) y achatamiento (1 - radio polar / radio ecuatorial).
export const ROTACION = {
  sol:      { ra: 286.13, dec: 63.87, periodo: 25.38, achat: 0 },
  mercurio: { ra: 281.01, dec: 61.41, periodo: 58.646, achat: 0 },
  venus:    { ra: 272.76, dec: 67.16, periodo: -243.025, achat: 0 },
  tierra:   { ra: 0, dec: 90, periodo: 0.99727, achat: 0.00335 },
  marte:    { ra: 317.68, dec: 52.89, periodo: 1.02596, achat: 0.00589 },
  jupiter:  { ra: 268.06, dec: 64.50, periodo: 0.41354, achat: 0.06487 },
  saturno:  { ra: 40.59, dec: 83.54, periodo: 0.44401, achat: 0.09796 },
  urano:    { ra: 257.31, dec: -15.18, periodo: -0.71833, achat: 0.02293 },
  neptuno:  { ra: 299.36, dec: 43.46, periodo: 0.67125, achat: 0.01708 },
  pluton:   { ra: 132.99, dec: -6.16, periodo: -6.3872, achat: 0 }
};

const OBLICUIDAD = THREE.MathUtils.degToRad(23.43928);
const rad = THREE.MathUtils.degToRad;

export const fechaAJD = (ms) => ms / 86400000 + 2440587.5;
export const jdAFecha = (jd) => (jd - 2440587.5) * 86400000;

function elementos(clave, jd) {
  const T = (jd - 2451545.0) / 36525;
  const el = ELEMENTOS[clave], v = (k) => el[k][0] + el[k][1] * T;
  return { a: v('a'), e: v('e'), I: rad(v('I')), L: v('L'), wb: v('wb'), O: v('O') };
}

function resolverKepler(M, e) {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

// Coordenadas eclípticas heliocéntricas (UA) → ejes de la escena (Y arriba = polo norte de la eclíptica)
function aEscena(x, y, z, destino) {
  return destino.set(x, z, -y);
}

function posicionDesdeE(el, E, destino) {
  const w = rad(el.wb - el.O), O = rad(el.O);
  const xp = el.a * (Math.cos(E) - el.e), yp = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(el.I), sI = Math.sin(el.I);
  const x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  const y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  const z = (sw * sI) * xp + (cw * sI) * yp;
  return aEscena(x, y, z, destino);
}

// Posición heliocéntrica en UA (ejes de la escena) para una fecha juliana
export function posicionUA(clave, jd, destino = new THREE.Vector3()) {
  const el = elementos(clave, jd);
  let M = rad(((el.L - el.wb) % 360 + 540) % 360 - 180);
  return posicionDesdeE(el, resolverKepler(M, el.e), destino);
}

// Puntos de la elipse completa (UA, ejes de la escena)
export function puntosOrbitaUA(clave, jd, n = 512) {
  const el = elementos(clave, jd), pts = [];
  for (let i = 0; i < n; i++) pts.push(posicionDesdeE(el, (i / n) * Math.PI * 2, new THREE.Vector3()));
  return pts;
}

// Vector unitario (ejes de la escena) desde ascensión recta y declinación ecuatoriales (°)
export function direccionEcuatorial(raGrados, decGrados, destino = new THREE.Vector3()) {
  const ra = rad(raGrados), dec = rad(decGrados);
  const x = Math.cos(dec) * Math.cos(ra), y = Math.cos(dec) * Math.sin(ra), z = Math.sin(dec);
  const ye = y * Math.cos(OBLICUIDAD) + z * Math.sin(OBLICUIDAD);
  const ze = -y * Math.sin(OBLICUIDAD) + z * Math.cos(OBLICUIDAD);
  return aEscena(x, ye, ze, destino);
}

// Distancias de la escena. Modo compacto: los planetas quedan en las distancias artísticas de
// siempre, pero la forma, inclinación y orientación de cada órbita son las reales.
// Modo real: distancias proporcionales (1 UA = 11.5 unidades).
const ANCLAS = [[0, 0], [0.387, 40], [0.723, 65], [1, 90], [1.524, 115], [5.203, 200], [9.537, 270], [19.19, 320], [30.07, 340], [39.48, 350]];
export const UA_REAL = 11.5;

export function distanciaCompacta(r) {
  for (let i = 1; i < ANCLAS.length; i++) {
    const [r0, d0] = ANCLAS[i - 1], [r1, d1] = ANCLAS[i];
    if (r <= r1) return d0 + (r - r0) / (r1 - r0) * (d1 - d0);
  }
  const [r0, d0] = ANCLAS[ANCLAS.length - 1];
  return d0 + (r - r0) * 1.2;
}

// Convierte un vector en UA a la escena mezclando ambos modos (t = 0 compacto, 1 real)
export function uaAEscena(v, t, destino) {
  const r = v.length();
  if (r === 0) return destino.set(0, 0, 0);
  const d = THREE.MathUtils.lerp(distanciaCompacta(r), r * UA_REAL, t);
  return destino.copy(v).multiplyScalar(d / r);
}
