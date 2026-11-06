"""Transcripción y sincronización (sección IV-B1).

Whisper transcribe el audio y devuelve, para cada frase, su texto y sus tiempos
de inicio y fin. Esos tiempos permiten saber qué se narra en cada momento.
"""

from __future__ import annotations

import json
from pathlib import Path


def transcribir(ruta_audio: str | Path, modelo: str = "medium", idioma: str = "es") -> list[dict]:
    """Devuelve una lista de frases {inicio, fin, texto} en segundos."""
    try:
        import whisper  # openai-whisper
    except ImportError as e:  # pragma: no cover - depende del entorno
        raise SystemExit(
            "Falta el paquete openai-whisper. Instálalo con: pip install openai-whisper "
            "(requiere ffmpeg en el sistema)."
        ) from e

    m = whisper.load_model(modelo)
    resultado = m.transcribe(str(ruta_audio), language=idioma, verbose=False)
    return [
        {"inicio": round(s["start"], 3), "fin": round(s["end"], 3), "texto": s["text"].strip()}
        for s in resultado["segments"]
        if s["text"].strip()
    ]


def guardar_frases(frases: list[dict], ruta: str | Path) -> None:
    Path(ruta).write_text(json.dumps(frases, ensure_ascii=False, indent=2), encoding="utf-8")


def cargar_frases(ruta: str | Path) -> list[dict]:
    return json.loads(Path(ruta).read_text(encoding="utf-8"))
