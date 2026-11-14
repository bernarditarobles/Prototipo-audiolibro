"""Compara la anotación del modelo con las respuestas de los lectores (escala 1 a 5).

    python -m verificacion.analizar_lectores datos/mujer_alta/anotacion.json datos/mujer_alta/validacion/muestra.json respuestas/*

Cada respuesta puede ser:
  - una planilla_lectores.xlsx completada (el nombre se lee de la celda B1 o del nombre del archivo), o
  - un .txt con las líneas que el lector mandó por WhatsApp ("1) A2 I4"); el nombre es el del archivo.

La escala se convierte al rango del modelo: valencia = (A - 3) / 2, activación = (I - 1) / 4.
Escribe además un CSV id,anotador,valencia,activacion junto a las respuestas.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path

from .validar_anotacion import comparar


def leer_txt(ruta: Path) -> dict[int, tuple[int, int]]:
    out = {}
    for linea in ruta.read_text(encoding="utf-8").splitlines():
        m = re.search(r"(\d+)\s*[).:-]?\s*A\s*([1-5])\D+I\s*([1-5])", linea, re.I)
        if m:
            out[int(m.group(1))] = (int(m.group(2)), int(m.group(3)))
    return out


def leer_xlsx(ruta: Path) -> tuple[str, dict[int, tuple[int, int]]]:
    from openpyxl import load_workbook

    ws = load_workbook(ruta, data_only=True).active
    nombre = str(ws["B1"].value or "").strip() or ruta.stem
    out = {}
    for fila in ws.iter_rows(values_only=True):
        if isinstance(fila[0], (int, float)) and fila[2] not in (None, "") and fila[3] not in (None, ""):
            out[int(fila[0])] = (int(fila[2]), int(fila[3]))
    return nombre, out


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("anotacion")
    p.add_argument("muestra")
    p.add_argument("respuestas", nargs="+")
    a = p.parse_args(argv)

    ids = json.loads(Path(a.muestra).read_text(encoding="utf-8"))
    modelo = {s["id"]: s for s in json.loads(Path(a.anotacion).read_text(encoding="utf-8"))["segmentos"]}
    humanos: dict[int, dict[str, dict]] = {}
    filas = []
    for r in map(Path, a.respuestas):
        nombre, resp = leer_xlsx(r) if r.suffix.lower() == ".xlsx" else (r.stem, leer_txt(r))
        faltan = [k for k in range(1, len(ids) + 1) if k not in resp]
        print(f"{nombre}: {len(resp)} respuestas" + (f" (faltan {faltan})" if faltan else ""))
        for k, (ag, it) in resp.items():
            if 1 <= k <= len(ids):
                sid = ids[k - 1]
                v, act = (ag - 3) / 2, (it - 1) / 4
                humanos.setdefault(sid, {})[nombre] = {"valencia": v, "activacion": act}
                filas.append([sid, nombre, v, act])

    destino = Path(a.respuestas[0]).parent / "respuestas_lectores.csv"
    with destino.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "anotador", "valencia", "activacion"])
        w.writerows(filas)
    print(json.dumps(comparar(modelo, humanos), ensure_ascii=False, indent=2))
    print(f"CSV: {destino}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
