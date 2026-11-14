"""Planilla para que lectores valoren una muestra de fragmentos (validación de la anotación).

    python -m verificacion.planilla_lectores datos/mujer_alta/anotacion.json -n 15 -o datos/mujer_alta/validacion

Genera:
  planilla_lectores.xlsx   una fila por fragmento, con listas desplegables del 1 al 5.
  mensaje_whatsapp.txt     los mismos fragmentos como texto, para responder por mensaje.
  muestra.json             ids de los segmentos elegidos (para el análisis).

La muestra es aleatoria y estratificada por activación (un fragmento por estrato), para que
cubra escenas calmas e intensas. Los fragmentos se presentan en el orden del relato y sin
los valores del modelo. Se excluyen el primero y el último segmento, que contienen los
anuncios de LibriVox.
"""

from __future__ import annotations

import argparse
import json
import random
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.datavalidation import DataValidation

INSTRUCCIONES = [
    "Vas a leer {n} fragmentos de un cuento del siglo XIX, en el orden en que aparecen. No hace falta conocer la historia.",
    "Para cada fragmento, marcá dos números del 1 al 5 según lo que transmite la escena (no si te gusta cómo está escrito):",
    "AGRADABLE: 1 = muy desagradable (miedo, tristeza, asco) · 3 = neutro · 5 = muy agradable (alegría, calma placentera).",
    "INTENSIDAD: 1 = muy calmo, tranquilo · 3 = medio · 5 = muy intenso, agitado (persecución, pánico, euforia).",
    "No hay respuestas correctas: anotá tu primera impresión. Son unos 15 minutos.",
]


def elegir(segmentos: list[dict], n: int, semilla: int) -> list[dict]:
    candidatos = sorted(segmentos[1:-1], key=lambda s: s["activacion"])
    rnd = random.Random(semilla)
    estratos = [candidatos[i * len(candidatos) // n:(i + 1) * len(candidatos) // n] for i in range(n)]
    return sorted((rnd.choice(e) for e in estratos), key=lambda s: s["id"])


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("anotacion")
    p.add_argument("-n", type=int, default=15)
    p.add_argument("--semilla", type=int, default=7)
    p.add_argument("-o", "--salida", required=True)
    a = p.parse_args(argv)

    salida = Path(a.salida)
    salida.mkdir(parents=True, exist_ok=True)
    segs = json.loads(Path(a.anotacion).read_text(encoding="utf-8"))["segmentos"]
    muestra = elegir(segs, a.n, a.semilla)
    (salida / "muestra.json").write_text(json.dumps([s["id"] for s in muestra]), encoding="utf-8")

    # Excel
    wb = Workbook()
    ws = wb.active
    ws.title = "Fragmentos"
    ws["A1"] = "Tu nombre:"
    ws["A1"].font = Font(bold=True)
    ws["B1"].fill = PatternFill("solid", fgColor="FFF4CC")
    for i, linea in enumerate(INSTRUCCIONES, start=2):
        ws.cell(row=i, column=1, value=linea.format(n=len(muestra)))
        ws.merge_cells(start_row=i, start_column=1, end_row=i, end_column=4)
        ws.cell(row=i, column=1).alignment = Alignment(wrap_text=True, vertical="top")
        ws.row_dimensions[i].height = 32
    fila0 = len(INSTRUCCIONES) + 3
    for c, t in enumerate(["N.º", "Fragmento", "AGRADABLE (1-5)", "INTENSIDAD (1-5)"], start=1):
        celda = ws.cell(row=fila0, column=c, value=t)
        celda.font = Font(bold=True, color="FFFFFF")
        celda.fill = PatternFill("solid", fgColor="1F8A84")
        celda.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    dv = DataValidation(type="list", formula1='"1,2,3,4,5"', allow_blank=True, showDropDown=False)
    ws.add_data_validation(dv)
    for k, s in enumerate(muestra, start=1):
        r = fila0 + k
        ws.cell(row=r, column=1, value=k).alignment = Alignment(horizontal="center", vertical="top")
        ws.cell(row=r, column=2, value=s["texto"]).alignment = Alignment(wrap_text=True, vertical="top")
        for c in (3, 4):
            ws.cell(row=r, column=c).fill = PatternFill("solid", fgColor="FFF4CC")
            ws.cell(row=r, column=c).alignment = Alignment(horizontal="center", vertical="center")
            dv.add(ws.cell(row=r, column=c))
        ws.row_dimensions[r].height = max(60, 15 * (len(s["texto"]) // 70 + 1))
    ws.column_dimensions["A"].width = 6
    ws.column_dimensions["B"].width = 80
    ws.column_dimensions["C"].width = 14
    ws.column_dimensions["D"].width = 14
    wb.save(salida / "planilla_lectores.xlsx")

    # WhatsApp
    partes = ["*Ayuda para mi tesis (15 min)*", ""] + [l.format(n=len(muestra)).replace("AGRADABLE", "*A* (agradable)").replace("INTENSIDAD", "*I* (intensidad)") for l in INSTRUCCIONES]
    partes += ["", "Respondé así, una línea por fragmento:", "1) A2 I4", "2) A3 I1", "..."]
    for k, s in enumerate(muestra, start=1):
        partes += ["", f"*{k})* {s['texto']}"]
    (salida / "mensaje_whatsapp.txt").write_text("\n".join(partes) + "\n", encoding="utf-8")

    print(f"Muestra de {len(muestra)} segmentos: {[s['id'] for s in muestra]}")
    print(f"Escritos en {salida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
