"""Validez de la anotación (sección V y VIII-B).

Compara la valencia y la activación asignadas por el modelo con las de
anotadores humanos en una muestra de segmentos.

Entrada humana: CSV con columnas  id,anotador,valencia,activacion
(una fila por segmento y anotador; valencia en [-1, 1], activación en [0, 1]).

    python -m verificacion.validar_anotacion anotacion.json humanos.csv

Reporta, por dimensión: correlación de Pearson y de Spearman entre el modelo y la
media humana, error absoluto medio, y como referencia el acuerdo entre humanos
(correlación media de cada anotador con la media de los demás).
"""

from __future__ import annotations

import argparse
import csv
import json
import math
from collections import defaultdict
from pathlib import Path


def pearson(x: list[float], y: list[float]) -> float:
    n = len(x)
    if n < 3:
        return float("nan")
    mx, my = sum(x) / n, sum(y) / n
    sxy = sum((a - mx) * (b - my) for a, b in zip(x, y))
    sx = math.sqrt(sum((a - mx) ** 2 for a in x))
    sy = math.sqrt(sum((b - my) ** 2 for b in y))
    return sxy / (sx * sy) if sx and sy else float("nan")


def rangos(v: list[float]) -> list[float]:
    orden = sorted(range(len(v)), key=lambda i: v[i])
    r = [0.0] * len(v)
    i = 0
    while i < len(orden):
        j = i
        while j + 1 < len(orden) and v[orden[j + 1]] == v[orden[i]]:
            j += 1
        for k in range(i, j + 1):
            r[orden[k]] = (i + j) / 2 + 1
        i = j + 1
    return r


def spearman(x: list[float], y: list[float]) -> float:
    return pearson(rangos(x), rangos(y))


def comparar(modelo: dict[int, dict], humanos: dict[int, dict[str, dict]]) -> dict:
    ids = sorted(i for i in humanos if i in modelo)
    out: dict = {"segmentos_comparados": len(ids), "anotadores": sorted({a for h in humanos.values() for a in h})}
    for dim in ("valencia", "activacion"):
        m = [modelo[i][dim] for i in ids]
        h = [sum(x[dim] for x in humanos[i].values()) / len(humanos[i]) for i in ids]
        acuerdo = []
        for anot in out["anotadores"]:
            sub = [i for i in ids if anot in humanos[i] and len(humanos[i]) > 1]
            if len(sub) >= 3:
                propio = [humanos[i][anot][dim] for i in sub]
                resto = [sum(x[dim] for a, x in humanos[i].items() if a != anot) / (len(humanos[i]) - 1) for i in sub]
                acuerdo.append(pearson(propio, resto))
        acuerdo = [a for a in acuerdo if not math.isnan(a)]
        out[dim] = {
            "pearson_modelo_vs_humanos": round(pearson(m, h), 3),
            "spearman_modelo_vs_humanos": round(spearman(m, h), 3),
            "error_absoluto_medio": round(sum(abs(a - b) for a, b in zip(m, h)) / len(ids), 3) if ids else None,
            "acuerdo_entre_humanos_pearson": round(sum(acuerdo) / len(acuerdo), 3) if acuerdo else None,
        }
    return out


def cargar_humanos(ruta: Path) -> dict[int, dict[str, dict]]:
    h: dict[int, dict[str, dict]] = defaultdict(dict)
    with ruta.open(encoding="utf-8") as f:
        for fila in csv.DictReader(f):
            if not fila["valencia"].strip() or not fila["activacion"].strip():
                continue  # fila aún sin completar
            h[int(fila["id"])][fila["anotador"]] = {"valencia": float(fila["valencia"]), "activacion": float(fila["activacion"])}
    return h


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("anotacion", help="JSON producido por el preprocesamiento.")
    p.add_argument("humanos", help="CSV id,anotador,valencia,activacion.")
    a = p.parse_args(argv)
    doc = json.loads(Path(a.anotacion).read_text(encoding="utf-8"))
    modelo = {s["id"]: s for s in doc["segmentos"]}
    print(json.dumps(comparar(modelo, cargar_humanos(Path(a.humanos))), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
