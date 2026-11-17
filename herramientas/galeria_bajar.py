"""Descarga las imágenes de galeria_lista.py desde Wikimedia Commons, las convierte a JPEG
(máx. 1280 px) y escribe galeria.json con créditos y licencia. Uso: galeria_bajar.py <carpeta_salida>"""
import sys, json, os, io, re, time, html, urllib.request, urllib.parse, urllib.error
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from galeria_lista import LISTA

UA = {"User-Agent": "solar-system-viewer/1.0 (educational; contact via repo)"}
API = "https://commons.wikimedia.org/w/api.php"
SALIDA = sys.argv[1]

def pedir(url, intentos=6):
    for i in range(intentos):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or i == intentos - 1: raise
        except urllib.error.URLError:
            if i == intentos - 1: raise
        time.sleep(8 * (i + 1))

def texto(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    return re.sub(r"\s+", " ", html.unescape(s)).strip()

ESTANDAR = [250, 330, 500, 960, 1280]
def info(titulo, ancho=1280):
    q = dict(action="query", titles=titulo, prop="imageinfo", iiprop="url|size|extmetadata", iiurlwidth=ancho, format="json",
             iiextmetadatafilter="LicenseShortName|LicenseUrl|Artist|Credit")
    d = json.loads(pedir(API + "?" + urllib.parse.urlencode(q)))
    p = next(iter(d["query"]["pages"].values()))
    if "imageinfo" not in p: raise SystemExit(f"No existe: {titulo}")
    return p["imageinfo"][0]

salida = {}
for clave, items in LISTA.items():
    os.makedirs(os.path.join(SALIDA, clave), exist_ok=True)
    salida[clave] = []
    for n, (titulo, anio, nombre, desc) in enumerate(items, 1):
        ii = info(titulo)
        if ii["width"] <= 1280:  # solo se aceptan miniaturas de tamaño estándar
            ancho = max([w for w in ESTANDAR if w < ii["width"]] or [250])
            ii = info(titulo, ancho)
        m = ii.get("extmetadata", {})
        url = ii["thumburl"]
        archivo = f"{clave}/{n:02d}.webp"
        ruta = os.path.join(SALIDA, archivo)
        if os.path.exists(ruta):
            img = Image.open(ruta)
            salida[clave].append(None)  # se rellena abajo
        else:
            img = Image.open(io.BytesIO(pedir(url)))
            salida[clave].append(None)
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA"); fondo = Image.new("RGB", img.size, (0, 0, 0)); fondo.paste(img, mask=img.split()[-1]); img = fondo
        else:
            img = img.convert("RGB")
        if not os.path.exists(ruta):
            img.thumbnail((1280, 1280))
            img.save(ruta, "WEBP", quality=80, method=6)
            time.sleep(5)
        autor = texto(m.get("Artist", {}).get("value"))[:160]
        salida[clave][-1] = ({
            "archivo": "galeria/" + archivo, "anio": anio, "titulo": nombre, "desc": desc,
            "autor": autor, "licencia": texto(m.get("LicenseShortName", {}).get("value")),
            "licenciaUrl": m.get("LicenseUrl", {}).get("value", ""), "fuente": ii["descriptionurl"],
            "ancho": img.width, "alto": img.height
        })
        print(f"{archivo} {img.width}x{img.height} | {salida[clave][-1]['licencia']} | {autor[:50]}", flush=True)
        time.sleep(2)

with open(os.path.join(SALIDA, "galeria.json"), "w", encoding="utf-8") as f:
    json.dump(salida, f, ensure_ascii=False, indent=1)
print("listo")
