"""Verificación técnica a partir del registro que descarga el reproductor (sección V).

- Sincronización: desfase entre el inicio de cada segmento y el cuadro en que el
  reproductor cambia de color objetivo.
- Fluidez: cuadros por segundo a lo largo de la sesión, comparando el inicio con
  el final para detectar degradación en el tiempo.

    python -m verificacion.analizar_registro registro_P01_minimo_....json
"""

from __future__ import annotations

import argparse
import json
import statistics as st
from pathlib import Path


def analizar(registro: dict, umbral_fps: float = 55.0) -> dict:
    cambios = [c for c in registro.get("cambios", []) if c.get("reproduciendo")]
    desf_ms = [abs(c["desfase_s"]) * 1000 for c in cambios]
    fps = [f["fps"] for f in registro.get("fps", [])]

    res: dict = {"condicion": registro.get("condicion"), "participante": registro.get("participante")}
    if desf_ms:
        orden = sorted(desf_ms)
        res["sincronizacion"] = {
            "cambios": len(desf_ms),
            "desfase_medio_ms": round(st.mean(desf_ms), 1),
            "desfase_mediana_ms": round(st.median(desf_ms), 1),
            "desfase_p95_ms": round(orden[min(len(orden) - 1, int(0.95 * len(orden)))], 1),
            "desfase_max_ms": round(max(desf_ms), 1),
        }
    if fps:
        decimo = max(1, len(fps) // 10)
        res["fluidez"] = {
            "segundos": len(fps),
            "fps_medio": round(st.mean(fps), 2),
            "fps_minimo": round(min(fps), 2),
            "fps_p5": round(sorted(fps)[int(0.05 * (len(fps) - 1))], 2),
            "segundos_bajo_umbral": sum(f < umbral_fps for f in fps),
            "fps_medio_primer_10pct": round(st.mean(fps[:decimo]), 2),
            "fps_medio_ultimo_10pct": round(st.mean(fps[-decimo:]), 2),
            "cuadros_lentos_total": sum(f.get("cuadros_lentos", 0) for f in registro["fps"]),
        }
    eventos = registro.get("eventos", [])
    res["eventos_bloqueados"] = sum(e["tipo"] in ("pausa_no_permitida", "intento_salto", "accion_multimedia_bloqueada") for e in eventos)
    return res


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("registros", nargs="+")
    p.add_argument("--umbral-fps", type=float, default=55.0)
    a = p.parse_args(argv)
    for ruta in a.registros:
        print(f"== {ruta}")
        print(json.dumps(analizar(json.loads(Path(ruta).read_text(encoding="utf-8")), a.umbral_fps), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
