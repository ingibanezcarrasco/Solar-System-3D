"""Convierte a WebP la galería (static/galeria) y las texturas importadas en src/script.js.
Uso: python3 herramientas/a_webp.py   (desde la raíz del repo). Borra los originales convertidos."""
import glob, json, os, re
from PIL import Image

def convertir(ruta, calidad, maximo=None):
    im = Image.open(ruta)
    if maximo and max(im.size) > maximo:
        im.thumbnail((maximo, maximo))
    if im.mode not in ("RGB", "RGBA", "L"):
        im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
    if im.mode == "L":
        im = im.convert("RGB")
    nueva = os.path.splitext(ruta)[0] + ".webp"
    im.save(nueva, "WEBP", quality=calidad, method=6)
    antes, despues = os.path.getsize(ruta), os.path.getsize(nueva)
    os.remove(ruta)
    print(f"{ruta}: {antes//1024} KB -> {despues//1024} KB")

# Galería
for f in sorted(glob.glob("static/galeria/*/*.jpg")):
    convertir(f, 80)
g = json.load(open("static/galeria/galeria.json"))
for lista in g.values():
    for e in lista:
        e["archivo"] = re.sub(r"\.jpg$", ".webp", e["archivo"])
json.dump(g, open("static/galeria/galeria.json", "w"), ensure_ascii=False, indent=1)

# Texturas importadas
js = open("src/script.js").read()
for nombre in sorted(set(re.findall(r"from '/images/([^']+\.(?:jpg|png))'", js))):
    convertir("src/images/" + nombre, 88 if nombre.endswith(".png") else 85, 2048)
    js = js.replace(f"'/images/{nombre}'", "'/images/" + os.path.splitext(nombre)[0] + ".webp'")
open("src/script.js", "w").write(js)
