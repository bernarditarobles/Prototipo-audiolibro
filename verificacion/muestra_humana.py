"""Genera una planilla CSV para que anotadores humanos valoren una muestra de segmentos.

    python -m verificacion.muestra_humana anotacion.json -n 40 --anotadores A1 A2 A3 -o humanos.csv

La planilla no incluye los valores del modelo, para no sesgar a los anotadores.
Cada anotador completa las columnas valencia ([-1, 1]) y activacion ([0, 1]).
"""

from __future__ import annotations

import argparse
import csv
import json
import random
from pathlib import Path


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("anotacion")
    p.add_argument("-n", type=int, default=40)
    p.add_argument("--anotadores", nargs="+", required=True)
    p.add_argument("--semilla", type=int, default=1)
    p.add_argument("-o", "--salida", required=True)
    a = p.parse_args(argv)

    segs = json.loads(Path(a.anotacion).read_text(encoding="utf-8"))["segmentos"]
    muestra = sorted(random.Random(a.semilla).sample(segs, min(a.n, len(segs))), key=lambda s: s["id"])
    previo = {s["id"]: s["texto"] for s in segs}
    with open(a.salida, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["id", "anotador", "valencia", "activacion", "texto_anterior", "texto"])
        for anot in a.anotadores:
            for s in muestra:
                w.writerow([s["id"], anot, "", "", previo.get(s["id"] - 1, ""), s["texto"]])
    print(f"Escrito {a.salida}: {len(muestra)} segmentos × {len(a.anotadores)} anotadores")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
