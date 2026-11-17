"""Genera static/cielo.json a partir de los datos de d3-celestial (BSD-3-Clause, Olaf Frohn).
Uso: descargar https://registry.npmjs.org/d3-celestial/-/d3-celestial-0.7.35.tgz, descomprimir y
     python3 herramientas/generar_cielo.py <carpeta package/data> static/cielo.json"""
import json, sys

D, destino = sys.argv[1], sys.argv[2]
estrellas = []
for f in json.load(open(f"{D}/stars.6.json"))["features"]:
    ra, dec = f["geometry"]["coordinates"]; p = f["properties"]
    try: bv = float(p.get("bv") or 0.6)
    except ValueError: bv = 0.6
    estrellas.append([round(ra % 360, 3), round(dec, 3), round(p["mag"], 2), round(bv, 2)])
lineas = [[[round(a % 360, 3), round(b, 3)] for a, b in tramo]
          for f in json.load(open(f"{D}/constellations.lines.json"))["features"] for tramo in f["geometry"]["coordinates"]]
nombres = []
for f in json.load(open(f"{D}/constellations.json"))["features"]:
    ra, dec = f["geometry"]["coordinates"]
    nombres.append([f["properties"].get("es") or f["properties"]["name"], round(ra % 360, 2), round(dec, 2), int(f["properties"]["rank"])])
json.dump({"fuente": "d3-celestial 0.7.35 (BSD-3-Clause, Olaf Frohn): catálogo Yale/Hipparcos hasta magnitud 6, líneas y nombres de las 88 constelaciones",
           "estrellas": estrellas, "lineas": lineas, "nombres": nombres}, open(destino, "w"), ensure_ascii=False, separators=(",", ":"))
print(len(estrellas), "estrellas,", len(lineas), "trazos,", len(nombres), "nombres")
