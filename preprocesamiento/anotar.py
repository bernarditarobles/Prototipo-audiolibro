"""Anotación afectiva (sección IV-B1 y V).

Un modelo de lenguaje recibe el texto de cada segmento junto con el del
segmento anterior y devuelve una valencia v ∈ [-1, 1] y una activación
a ∈ [0, 1] (modelo circumplejo de Russell). La respuesta se pide en JSON y se
valida antes de escribirse: si no cumple el formato o los rangos, el segmento
se vuelve a anotar.
"""

from __future__ import annotations

import json
import math
import sys
import time
from pathlib import Path
from typing import Callable, Optional

from pydantic import BaseModel, ValidationError

MODELO_POR_DEFECTO = "claude-opus-5-5"
MAX_INTENTOS = 4

INSTRUCCION = """Eres un anotador del tono emocional de textos narrativos en español.
Recibirás un fragmento de un audiolibro de ficción (SEGMENTO ACTUAL) y, como contexto,
el fragmento inmediatamente anterior (SEGMENTO ANTERIOR). Valora solo el SEGMENTO ACTUAL,
usando el anterior únicamente para entender la escena.

Usa las dos dimensiones del modelo circumplejo del afecto:

- valencia: cuán agradable (positivo) o desagradable (negativo) es el contenido emocional
  de la escena. Número real entre -1 y 1. -1 = muy desagradable (horror, duelo, crueldad),
  0 = neutro, 1 = muy agradable (alegría, ternura, alivio).
- activacion: intensidad o nivel de excitación de la escena, independiente de si es agradable.
  Número real entre 0 y 1. 0 = muy calmo (descripción pausada, reposo), 1 = muy intenso
  (persecución, pelea, pánico, euforia).

Considera que el tono puede expresarse de forma indirecta (ironía, tensión que se construye
de a poco). No valores la calidad literaria. Responde únicamente con el JSON solicitado."""


class Afecto(BaseModel):
    valencia: float
    activacion: float


class AnotacionInvalida(ValueError):
    pass


def validar(valencia: float, activacion: float) -> tuple[float, float]:
    """Verifica tipos y rangos. Lanza AnotacionInvalida si no cumplen."""
    for nombre, x in (("valencia", valencia), ("activacion", activacion)):
        if not isinstance(x, (int, float)) or isinstance(x, bool) or not math.isfinite(x):
            raise AnotacionInvalida(f"{nombre} no es un número finito: {x!r}")
    if not -1.0 <= valencia <= 1.0:
        raise AnotacionInvalida(f"valencia fuera de [-1, 1]: {valencia}")
    if not 0.0 <= activacion <= 1.0:
        raise AnotacionInvalida(f"activacion fuera de [0, 1]: {activacion}")
    return float(valencia), float(activacion)


def construir_mensaje(texto: str, texto_anterior: Optional[str]) -> str:
    anterior = texto_anterior if texto_anterior else "(no hay; es el comienzo del relato)"
    return f"SEGMENTO ANTERIOR:\n{anterior}\n\nSEGMENTO ACTUAL:\n{texto}"


class AnotadorClaude:
    """Anota un segmento llamando a la API de Claude con salida estructurada."""

    def __init__(self, modelo: str = MODELO_POR_DEFECTO, esfuerzo: Optional[str] = None, cliente=None):
        if cliente is None:
            import anthropic

            cliente = anthropic.Anthropic()
        self.cliente = cliente
        self.modelo = modelo
        self.esfuerzo = esfuerzo

    def __call__(self, texto: str, texto_anterior: Optional[str]) -> tuple[float, float]:
        kwargs = {}
        if self.esfuerzo:
            kwargs["output_config"] = {"effort": self.esfuerzo}
        respuesta = self.cliente.messages.parse(
            model=self.modelo,
            max_tokens=16000,
            system=INSTRUCCION,
            messages=[{"role": "user", "content": construir_mensaje(texto, texto_anterior)}],
            output_format=Afecto,
            **kwargs,
        )
        if respuesta.stop_reason == "refusal":
            raise AnotacionInvalida("el modelo rechazó la solicitud")
        if respuesta.stop_reason == "max_tokens":
            raise AnotacionInvalida("respuesta truncada (max_tokens)")
        salida = respuesta.parsed_output
        if salida is None:
            raise AnotacionInvalida("la respuesta no contiene JSON válido")
        return validar(salida.valencia, salida.activacion)


def anotar_segmentos(
    segmentos: list[dict],
    anotador: Callable[[str, Optional[str]], tuple[float, float]],
    ruta_parcial: Optional[Path] = None,
    max_intentos: int = MAX_INTENTOS,
    espera_base: float = 2.0,
    log=sys.stderr,
) -> list[dict]:
    """Anota cada segmento con valencia y activación.

    Si se da `ruta_parcial`, el progreso se guarda tras cada segmento y se
    reanuda desde allí si el proceso se interrumpe.
    """
    hechos: dict[int, dict] = {}
    if ruta_parcial and ruta_parcial.exists():
        for s in json.loads(ruta_parcial.read_text(encoding="utf-8")):
            hechos[s["id"]] = s

    resultado = []
    for i, seg in enumerate(segmentos):
        previo = hechos.get(seg["id"])
        if previo and previo.get("texto") == seg["texto"]:
            resultado.append(previo)
            continue

        texto_anterior = segmentos[i - 1]["texto"] if i > 0 else None
        ultimo_error: Optional[Exception] = None
        for intento in range(1, max_intentos + 1):
            try:
                v, a = anotador(seg["texto"], texto_anterior)
                break
            except (AnotacionInvalida, ValidationError, json.JSONDecodeError) as e:
                ultimo_error = e
                print(f"  segmento {seg['id']}: intento {intento} inválido ({e}); se vuelve a anotar", file=log)
                time.sleep(espera_base * (intento - 1))
        else:
            raise RuntimeError(f"No se pudo anotar el segmento {seg['id']} tras {max_intentos} intentos: {ultimo_error}")

        anotado = {**seg, "valencia": round(v, 4), "activacion": round(a, 4)}
        resultado.append(anotado)
        hechos[seg["id"]] = anotado
        print(f"  segmento {seg['id'] + 1}/{len(segmentos)}: v={v:+.2f} a={a:.2f}", file=log)
        if ruta_parcial:
            ruta_parcial.write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")

    return resultado
