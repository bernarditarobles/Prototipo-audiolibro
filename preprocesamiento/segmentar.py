"""Segmentación (sección IV-B1).

Agrupa frases consecutivas en segmentos de duración mínima d_min: un segmento
se cierra en el primer final de frase posterior a ese umbral, de modo que cada
segmento conserva oraciones completas y el valor objetivo del estímulo cambia,
como máximo, una vez cada d_min segundos (R2).
"""

from __future__ import annotations

from typing import Iterable

D_MIN_POR_DEFECTO = 20.0


def segmentar(frases: Iterable[dict], d_min: float = D_MIN_POR_DEFECTO) -> list[dict]:
    """Recibe frases {inicio, fin, texto} ordenadas y devuelve segmentos.

    Cada segmento: {id, inicio, fin, texto}. El último segmento puede durar
    menos que d_min si la narración termina antes del umbral; en ese caso se
    une al segmento anterior para no producir un cambio de color tardío y breve.
    """
    if d_min <= 0:
        raise ValueError("d_min debe ser positivo")

    segmentos: list[dict] = []
    actual: list[dict] = []

    for frase in frases:
        texto = frase["texto"].strip()
        if not texto:
            continue
        actual.append({"inicio": float(frase["inicio"]), "fin": float(frase["fin"]), "texto": texto})
        if actual[-1]["fin"] - actual[0]["inicio"] >= d_min:
            segmentos.append(_cerrar(actual))
            actual = []

    if actual:
        resto = _cerrar(actual)
        if segmentos and resto["fin"] - resto["inicio"] < d_min:
            previo = segmentos.pop()
            resto = {
                "inicio": previo["inicio"],
                "fin": resto["fin"],
                "texto": previo["texto"] + " " + resto["texto"],
            }
        segmentos.append(resto)

    for i, s in enumerate(segmentos):
        s["id"] = i
    return [{"id": s["id"], "inicio": s["inicio"], "fin": s["fin"], "texto": s["texto"]} for s in segmentos]


def _cerrar(frases: list[dict]) -> dict:
    return {
        "inicio": round(frases[0]["inicio"], 3),
        "fin": round(frases[-1]["fin"], 3),
        "texto": " ".join(f["texto"] for f in frases),
    }
