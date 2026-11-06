"""Genera un audio sintético y una anotación de prueba para probar el reproductor
sin Whisper ni API: un tono modulado como "voz" y segmentos con valencia y
activación variadas.

    python ejemplos/generar_demo.py --duracion 180 -o ejemplos/demo
"""

from __future__ import annotations

import argparse
import json
import math
import random
import struct
import wave
from pathlib import Path


def main(argv=None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--duracion", type=float, default=180.0)
    p.add_argument("--d-seg", type=float, default=20.0)
    p.add_argument("-o", "--dir", default="ejemplos/demo")
    a = p.parse_args(argv)

    d = Path(a.dir)
    d.mkdir(parents=True, exist_ok=True)
    sr = 16000
    rnd = random.Random(7)
    with wave.open(str(d / "demo.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        marcos = bytearray()
        for n in range(int(a.duracion * sr)):
            t = n / sr
            env = max(0.0, math.sin(2 * math.pi * 1.7 * t)) * (0.5 + 0.5 * math.sin(2 * math.pi * 0.11 * t))
            x = 0.3 * env * math.sin(2 * math.pi * 180 * t)
            marcos += struct.pack("<h", int(max(-1, min(1, x)) * 32767))
        w.writeframes(bytes(marcos))

    segs, t, i = [], 0.0, 0
    while t < a.duracion:
        fin = min(a.duracion, t + a.d_seg)
        segs.append({
            "id": i, "inicio": round(t, 3), "fin": round(fin, 3), "texto": f"Segmento de prueba {i}.",
            "valencia": round(rnd.uniform(-1, 1), 3), "activacion": round(rnd.uniform(0, 1), 3),
        })
        t, i = fin, i + 1
    doc = {"version": 1, "titulo": "Demo sintética", "audio": "demo.wav", "matiz_base": 210, "d_min": a.d_seg,
           "modelo_anotacion": None, "segmentos": segs}
    (d / "demo.json").write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Escritos {d / 'demo.wav'} y {d / 'demo.json'} ({len(segs)} segmentos)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
