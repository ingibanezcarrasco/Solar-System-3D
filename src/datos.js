// Datos de referencia de cada cuerpo (valores medios redondeados, fuente: hojas de datos de NASA/NSSDC).
// El número de lunas de los planetas gigantes cambia con cada descubrimiento, por eso va como "más de".

export const ORDEN = ['sol', 'mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno', 'urano', 'neptuno', 'pluton'];

// Nombres alternativos aceptados en la URL (#saturn) y en el buscador
export const ALIAS = {
  sun: 'sol', mercury: 'mercurio', earth: 'tierra', mars: 'marte', jupiter: 'jupiter',
  saturn: 'saturno', uranus: 'urano', neptune: 'neptuno', pluto: 'pluton', luna: 'tierra', moon: 'tierra'
};

export const CUERPOS = {
  sol: {
    nombre: 'Sol', color: '#f5c454', tipo: 'Estrella enana amarilla (tipo G2V)',
    desc: 'El Sol concentra el 99.8 % de la masa del sistema solar. En su núcleo, la fusión de hidrógeno en helio libera la energía que tarda miles de años en llegar a la superficie y apenas ocho minutos en cruzar el espacio hasta la Tierra.',
    datos: [
      ['Diámetro', '1,392,700 km (109 × Tierra)'],
      ['Masa', '1.989 × 10³⁰ kg (333,000 × Tierra)'],
      ['Rotación', '≈ 25 días en el ecuador, ≈ 35 en los polos'],
      ['Temperatura superficial', '≈ 5,500 °C'],
      ['Temperatura del núcleo', '≈ 15 millones °C'],
      ['Edad', '≈ 4,600 millones de años'],
      ['Luz hasta la Tierra', '8 min 20 s']
    ],
    extra: ['Composición', 'Alrededor de 73 % hidrógeno y 25 % helio (en masa); el resto son elementos más pesados como oxígeno, carbono y hierro.'],
    distUA: null
  },
  mercurio: {
    nombre: 'Mercurio', color: '#a8a39b', tipo: 'Planeta rocoso',
    desc: 'El planeta más pequeño y el más cercano al Sol. Casi no tiene atmósfera, así que su superficie pasa de un calor abrasador de día a un frío extremo de noche. Está cubierto de cráteres, como la Luna.',
    datos: [
      ['Diámetro', '4,879 km (0.38 × Tierra)'],
      ['Masa', '3.30 × 10²³ kg (0.055 × Tierra)'],
      ['Distancia media al Sol', '57.9 M km (0.39 UA)'],
      ['Año (órbita)', '88 días terrestres'],
      ['Rotación', '58.6 días terrestres'],
      ['Inclinación del eje', '0.03°'],
      ['Temperatura', '−173 °C a 427 °C'],
      ['Lunas', 'Ninguna']
    ],
    extra: ['Dato curioso', 'Un día solar en Mercurio (de amanecer a amanecer) dura 176 días terrestres: dos de sus años.'],
    distUA: 0.39
  },
  venus: {
    nombre: 'Venus', color: '#e3c18a', tipo: 'Planeta rocoso',
    desc: 'Casi del tamaño de la Tierra, pero envuelto en una atmósfera densa de dióxido de carbono con nubes de ácido sulfúrico. El efecto invernadero lo convierte en el planeta más caliente, más que Mercurio.',
    datos: [
      ['Diámetro', '12,104 km (0.95 × Tierra)'],
      ['Masa', '4.87 × 10²⁴ kg (0.815 × Tierra)'],
      ['Distancia media al Sol', '108.2 M km (0.72 UA)'],
      ['Año (órbita)', '224.7 días terrestres'],
      ['Rotación', '243 días, en sentido contrario'],
      ['Inclinación del eje', '177.4°'],
      ['Temperatura media', '464 °C'],
      ['Presión en superficie', '≈ 92 × Tierra'],
      ['Lunas', 'Ninguna']
    ],
    extra: ['Dato curioso', 'Su día (rotación) es más largo que su año, y el Sol sale por el oeste.'],
    distUA: 0.72
  },
  tierra: {
    nombre: 'Tierra', color: '#4f86c6', tipo: 'Planeta rocoso',
    desc: 'Nuestro planeta, el único donde se conoce vida. Tiene agua líquida en la superficie, una atmósfera rica en nitrógeno y oxígeno y un campo magnético que la protege del viento solar.',
    datos: [
      ['Diámetro', '12,742 km'],
      ['Masa', '5.97 × 10²⁴ kg'],
      ['Distancia media al Sol', '149.6 M km (1 UA)'],
      ['Año (órbita)', '365.25 días'],
      ['Rotación', '23 h 56 min'],
      ['Inclinación del eje', '23.4°'],
      ['Temperatura media', '≈ 15 °C'],
      ['Lunas', '1 (la Luna)']
    ],
    extra: ['La Luna', 'Mide 3,475 km de diámetro y orbita a unos 384,400 km. Siempre nos muestra la misma cara porque gira sobre sí misma en el mismo tiempo que tarda en dar la vuelta a la Tierra.'],
    distUA: 1
  },
  marte: {
    nombre: 'Marte', color: '#c1643f', tipo: 'Planeta rocoso',
    desc: 'El planeta rojo debe su color al óxido de hierro del polvo superficial. Tiene el volcán más alto del sistema solar, el Monte Olimpo, y un cañón enorme, Valles Marineris. Hay indicios claros de que tuvo agua líquida.',
    datos: [
      ['Diámetro', '6,779 km (0.53 × Tierra)'],
      ['Masa', '6.42 × 10²³ kg (0.107 × Tierra)'],
      ['Distancia media al Sol', '227.9 M km (1.52 UA)'],
      ['Año (órbita)', '687 días terrestres'],
      ['Rotación', '24 h 37 min'],
      ['Inclinación del eje', '25.2°'],
      ['Temperatura media', '≈ −63 °C'],
      ['Lunas', '2 (Fobos y Deimos)']
    ],
    extra: ['Lunas', 'Fobos y Deimos son pequeñas e irregulares, probablemente asteroides capturados. Fobos se acerca poco a poco a Marte.'],
    distUA: 1.52
  },
  jupiter: {
    nombre: 'Júpiter', color: '#d4a373', tipo: 'Gigante gaseoso',
    desc: 'El planeta más grande: cabrían más de mil Tierras en su interior. Está formado sobre todo por hidrógeno y helio, y su Gran Mancha Roja es una tormenta más ancha que la Tierra que lleva siglos activa.',
    datos: [
      ['Diámetro', '139,820 km (11 × Tierra)'],
      ['Masa', '1.898 × 10²⁷ kg (318 × Tierra)'],
      ['Distancia media al Sol', '778.5 M km (5.20 UA)'],
      ['Año (órbita)', '11.86 años terrestres'],
      ['Rotación', '9 h 56 min'],
      ['Inclinación del eje', '3.1°'],
      ['Temperatura (nubes)', '≈ −110 °C'],
      ['Lunas', 'Más de 90']
    ],
    extra: ['Lunas galileanas', 'Ío (volcánica), Europa (océano bajo el hielo), Ganímedes (la luna más grande del sistema solar) y Calisto. Las cuatro aparecen en la escena.'],
    distUA: 5.2
  },
  saturno: {
    nombre: 'Saturno', color: '#e0c48c', tipo: 'Gigante gaseoso',
    desc: 'Famoso por su sistema de anillos, hecho de trozos de hielo y roca que van desde granos de polvo hasta bloques del tamaño de una casa. Es tan poco denso que, en teoría, flotaría en agua.',
    datos: [
      ['Diámetro', '116,460 km (9.1 × Tierra)'],
      ['Masa', '5.68 × 10²⁶ kg (95 × Tierra)'],
      ['Distancia media al Sol', '1,433.5 M km (9.58 UA)'],
      ['Año (órbita)', '29.45 años terrestres'],
      ['Rotación', '10 h 33 min'],
      ['Inclinación del eje', '26.7°'],
      ['Densidad media', '0.687 g/cm³'],
      ['Temperatura (nubes)', '≈ −140 °C'],
      ['Lunas', 'Más de 270']
    ],
    extra: ['Anillos', 'Se extienden cientos de miles de kilómetros desde el planeta, pero su grosor típico es de apenas unas decenas de metros.'],
    distUA: 9.58
  },
  urano: {
    nombre: 'Urano', color: '#9fd3d8', tipo: 'Gigante helado',
    desc: 'Gira prácticamente acostado: su eje está inclinado casi 98°, quizá por un gran impacto en su pasado. El metano de su atmósfera absorbe la luz roja y le da su tono azul verdoso pálido.',
    datos: [
      ['Diámetro', '50,724 km (4 × Tierra)'],
      ['Masa', '8.68 × 10²⁵ kg (14.5 × Tierra)'],
      ['Distancia media al Sol', '2,872.5 M km (19.2 UA)'],
      ['Año (órbita)', '84 años terrestres'],
      ['Rotación', '17 h 14 min, en sentido contrario'],
      ['Inclinación del eje', '97.8°'],
      ['Temperatura (nubes)', '≈ −195 °C'],
      ['Lunas', 'Más de 25']
    ],
    extra: ['Estaciones', 'Por su inclinación, cada polo pasa unos 42 años de luz continua y otros 42 de oscuridad.'],
    distUA: 19.2
  },
  neptuno: {
    nombre: 'Neptuno', color: '#4b70dd', tipo: 'Gigante helado',
    desc: 'El planeta más lejano del Sol. Tiene los vientos más rápidos medidos en el sistema solar, de más de 2,000 km/h. Fue el primer planeta encontrado por cálculo matemático antes de verlo con un telescopio.',
    datos: [
      ['Diámetro', '49,244 km (3.9 × Tierra)'],
      ['Masa', '1.02 × 10²⁶ kg (17 × Tierra)'],
      ['Distancia media al Sol', '4,495 M km (30.1 UA)'],
      ['Año (órbita)', '164.8 años terrestres'],
      ['Rotación', '16 h 6 min'],
      ['Inclinación del eje', '28.3°'],
      ['Temperatura (nubes)', '≈ −200 °C'],
      ['Lunas', 'Más de 15']
    ],
    extra: ['Tritón', 'Su luna mayor gira en sentido contrario a la rotación del planeta y tiene géiseres de nitrógeno.'],
    distUA: 30.1
  },
  pluton: {
    nombre: 'Plutón', color: '#c9b49a', tipo: 'Planeta enano (cinturón de Kuiper)',
    desc: 'Fue el noveno planeta hasta 2006, cuando pasó a ser planeta enano. La sonda New Horizons mostró en 2015 una gran llanura de hielo de nitrógeno con forma de corazón y montañas de hielo de agua.',
    datos: [
      ['Diámetro', '2,377 km (0.19 × Tierra)'],
      ['Masa', '1.30 × 10²² kg (0.002 × Tierra)'],
      ['Distancia media al Sol', '5,906 M km (39.5 UA)'],
      ['Año (órbita)', '248 años terrestres'],
      ['Rotación', '6.4 días, en sentido contrario'],
      ['Inclinación del eje', '122.5°'],
      ['Temperatura media', '≈ −230 °C'],
      ['Lunas', '5 (Caronte, Estigia, Nix, Cerbero e Hidra)']
    ],
    extra: ['Caronte', 'Es tan grande respecto a Plutón (la mitad de su diámetro) que ambos giran alrededor de un punto que queda fuera de Plutón.'],
    distUA: 39.5
  }
};

// Estructura interna aproximada (modelos actuales): [nombre, radio exterior como fracción del radio total, color]
export const CAPAS = {
  sol: [['Núcleo (fusión nuclear)', 0.25, '#fff1a8'], ['Zona radiativa', 0.70, '#ffc861'], ['Zona convectiva', 1, '#ff8a3d']],
  mercurio: [['Núcleo metálico', 0.83, '#c98b55'], ['Manto rocoso', 0.985, '#8c7a6b'], ['Corteza', 1, '#bdb6ad']],
  venus: [['Núcleo de hierro', 0.5, '#d49a5a'], ['Manto rocoso', 0.99, '#a1675a'], ['Corteza', 1, '#d9b98a']],
  tierra: [['Núcleo interno (sólido)', 0.19, '#ffd27a'], ['Núcleo externo (líquido)', 0.55, '#f09a3e'], ['Manto', 0.995, '#c0533a'], ['Corteza', 1, '#6f8fb5']],
  marte: [['Núcleo líquido', 0.54, '#c97a47'], ['Manto', 0.985, '#9a4e33'], ['Corteza', 1, '#d0805a']],
  jupiter: [['Núcleo difuso (roca y hielo)', 0.3, '#8a6a4a'], ['Hidrógeno metálico líquido', 0.8, '#b98d5e'], ['Hidrógeno y helio moleculares', 1, '#e2c49b']],
  saturno: [['Núcleo difuso (roca y hielo)', 0.3, '#8a6a4a'], ['Hidrógeno metálico líquido', 0.5, '#c2a172'], ['Hidrógeno y helio moleculares', 1, '#ecd7a6']],
  urano: [['Núcleo rocoso', 0.2, '#6d6a5c'], ['Manto de hielos (agua, amoníaco, metano)', 0.75, '#5fa8b4'], ['Atmósfera de hidrógeno y helio', 1, '#b4e2e6']],
  neptuno: [['Núcleo rocoso', 0.25, '#6d6a5c'], ['Manto de hielos (agua, amoníaco, metano)', 0.8, '#3f6fc0'], ['Atmósfera de hidrógeno y helio', 1, '#7da0ec']],
  pluton: [['Núcleo rocoso', 0.72, '#8a7765'], ['Océano de agua (probable)', 0.8, '#3d6d9c'], ['Corteza de hielo', 1, '#d8c8b2']]
};

// Datos de la Vía Láctea para la ficha
export const GALAXIA = {
  nombre: 'Vía Láctea', tipo: 'Galaxia espiral barrada',
  desc: 'Nuestra galaxia es un disco de cientos de miles de millones de estrellas con una barra central y brazos espirales. El Sol está en el Brazo de Orión, una rama menor entre los brazos de Sagitario y Perseo, y tarda unos 230 millones de años en dar una vuelta al centro.',
  datos: [
    ['Diámetro del disco', '≈ 100,000 años luz'],
    ['Estrellas', 'Entre 100,000 y 400,000 millones'],
    ['Edad', '≈ 13,600 millones de años'],
    ['Distancia del Sol al centro', '≈ 26,000 años luz'],
    ['Velocidad del Sol', '≈ 230 km/s (828,000 km/h)'],
    ['Año galáctico', '≈ 230 millones de años'],
    ['Vueltas del Sol desde que nació', '≈ 20'],
    ['Agujero negro central', 'Sagitario A*, ≈ 4 millones de masas solares'],
    ['Plano del sistema solar', 'Inclinado ≈ 60° respecto al de la galaxia']
  ],
  extra: ['Sobre el modelo', 'La forma es una simplificación de los mapas actuales: desde dentro de la galaxia no podemos fotografiarla completa, así que su estructura se reconstruye midiendo distancias y velocidades de estrellas y nubes de gas.']
};
