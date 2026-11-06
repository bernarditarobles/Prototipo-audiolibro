"""Etapa de preprocesamiento completa (sección IV-B1).

Se ejecuta una sola vez por audiolibro y produce el archivo JSON de anotación
afectiva que consume el reproductor:

    python -m preprocesamiento.pipeline audio.mp3 -o anotacion.json --matiz-base 210

Pasos: transcripción (Whisper) → segmentación (d_min) → anotación afectiva (LLM).
Con --frases se puede saltar la transcripción reutilizando un JSON de frases.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

from .anotar import MODELO_POR_DEFECTO, AnotadorClaude, anotar_segmentos
from .segmentar import D_MIN_POR_DEFECTO, segmentar
from .transcribir import cargar_frases, guardar_frases, transcribir

VERSION_FORMATO = 1


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Preprocesamiento de un audiolibro para la ambientación visual reactiva.")
    p.add_argument("audio", nargs="?", help="Archivo de audio de la narración (mp3, wav, ogg...).")
    p.add_argument("-o", "--salida", required=True, help="Ruta del JSON de anotación a generar.")
    p.add_argument("--frases", help="JSON de frases ya transcritas ({inicio, fin, texto}); omite Whisper.")
    p.add_argument("--guardar-frases", help="Guarda la transcripción de Whisper en esta ruta.")
    p.add_argument("--modelo-whisper", default="medium")
    p.add_argument("--idioma", default="es")
    p.add_argument("--d-min", type=float, default=D_MIN_POR_DEFECTO, help="Duración mínima de segmento en s (por defecto 20).")
    p.add_argument("--matiz-base", type=float, default=210.0, help="Matiz base H0 de la obra, en grados (0-360).")
    p.add_argument("--titulo", default="")
    p.add_argument("--modelo-llm", default=MODELO_POR_DEFECTO)
    p.add_argument("--esfuerzo", choices=["low", "medium", "high", "xhigh", "max"], default=None)
    p.add_argument("--solo-segmentar", action="store_true", help="No anota; deja valencia=0 y activación=0 (útil para pruebas).")
    a = p.parse_args(argv)

    if a.frases:
        frases = cargar_frases(a.frases)
    elif a.audio:
        print(f"Transcribiendo {a.audio} con Whisper ({a.modelo_whisper})...", file=sys.stderr)
        frases = transcribir(a.audio, a.modelo_whisper, a.idioma)
        if a.guardar_frases:
            guardar_frases(frases, a.guardar_frases)
    else:
        p.error("indica un archivo de audio o --frases")

    segmentos = segmentar(frases, a.d_min)
    print(f"{len(frases)} frases → {len(segmentos)} segmentos (d_min = {a.d_min} s)", file=sys.stderr)

    salida = Path(a.salida)
    if a.solo_segmentar:
        anotados = [{**s, "valencia": 0.0, "activacion": 0.0} for s in segmentos]
        modelo = None
    else:
        parcial = salida.with_suffix(salida.suffix + ".parcial")
        anotador = AnotadorClaude(a.modelo_llm, a.esfuerzo)
        print(f"Anotando con {a.modelo_llm}...", file=sys.stderr)
        anotados = anotar_segmentos(segmentos, anotador, ruta_parcial=parcial)
        modelo = a.modelo_llm
        if parcial.exists():
            parcial.unlink()

    documento = {
        "version": VERSION_FORMATO,
        "titulo": a.titulo,
        "audio": Path(a.audio).name if a.audio else None,
        "matiz_base": a.matiz_base % 360,
        "d_min": a.d_min,
        "modelo_anotacion": modelo,
        "generado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "segmentos": anotados,
    }
    salida.write_text(json.dumps(documento, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Escrito {salida}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
