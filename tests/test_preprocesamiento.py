import io
import json
from types import SimpleNamespace

import pytest

from preprocesamiento.anotar import Afecto, AnotacionInvalida, AnotadorClaude, anotar_segmentos, validar
from preprocesamiento.segmentar import segmentar
from verificacion.analizar_registro import analizar
from verificacion.validar_anotacion import comparar, spearman


def frases(n, dur=7.0):
    return [{"inicio": i * dur, "fin": (i + 1) * dur - 0.5, "texto": f"Frase {i}."} for i in range(n)]


def test_segmentos_respetan_dmin_y_frases_completas():
    segs = segmentar(frases(20), d_min=20)
    for s in segs:
        assert s["fin"] - s["inicio"] >= 20
    assert " ".join(s["texto"] for s in segs) == " ".join(f"Frase {i}." for i in range(20))
    assert [s["id"] for s in segs] == list(range(len(segs)))


def test_ultimo_segmento_corto_se_une_al_anterior():
    segs = segmentar(frases(10), d_min=20)  # 70 s: 3 frases por segmento → resto de 1 frase
    assert segs[-1]["fin"] - segs[-1]["inicio"] >= 20
    assert segs[-1]["texto"].endswith("Frase 9.")


def test_narracion_mas_corta_que_dmin():
    segs = segmentar(frases(2), d_min=20)
    assert len(segs) == 1


def test_validar_rangos():
    assert validar(-1, 0) == (-1.0, 0.0)
    for v, a in [(1.2, 0.5), (0, -0.1), (float("nan"), 0.5), (0, 1.01)]:
        with pytest.raises(AnotacionInvalida):
            validar(v, a)


def test_anotar_reintenta_y_usa_contexto(tmp_path):
    segs = segmentar(frases(9), d_min=20)
    llamadas = []
    respuestas = iter([AnotacionInvalida("x"), (0.5, 2.0), (0.4, 0.6), (-0.3, 0.2), (0.0, 0.1)])

    def anotador(texto, anterior):
        llamadas.append(anterior)
        r = next(respuestas)
        if isinstance(r, Exception):
            raise r
        return validar(*r)

    parcial = tmp_path / "p.json"
    out = anotar_segmentos(segs, anotador, ruta_parcial=parcial, espera_base=0, log=io.StringIO())
    assert [s["valencia"] for s in out] == [0.4, -0.3, 0.0]
    assert llamadas[0] is None and llamadas[-1] == segs[1]["texto"]
    # Reanudación: no vuelve a llamar al anotador.
    out2 = anotar_segmentos(segs, lambda *_: pytest.fail("no debía llamar"), ruta_parcial=parcial, log=io.StringIO())
    assert out2 == out


def test_anotador_claude_con_cliente_simulado():
    class Mensajes:
        def parse(self, **kw):
            assert kw["output_format"] is Afecto
            assert "SEGMENTO ACTUAL" in kw["messages"][0]["content"]
            return SimpleNamespace(stop_reason="end_turn", parsed_output=Afecto(valencia=-0.5, activacion=0.8))

    an = AnotadorClaude(cliente=SimpleNamespace(messages=Mensajes()))
    assert an("texto", None) == (-0.5, 0.8)

    class Rechazo:
        def parse(self, **kw):
            return SimpleNamespace(stop_reason="refusal", parsed_output=None)

    with pytest.raises(AnotacionInvalida):
        AnotadorClaude(cliente=SimpleNamespace(messages=Rechazo()))("t", None)


def test_comparar_con_humanos():
    modelo = {i: {"valencia": i / 10 - 0.5, "activacion": i / 10} for i in range(10)}
    humanos = {i: {"A": {"valencia": i / 10 - 0.45, "activacion": i / 10}, "B": {"valencia": i / 10 - 0.55, "activacion": i / 11}} for i in range(10)}
    r = comparar(modelo, humanos)
    assert r["valencia"]["pearson_modelo_vs_humanos"] == pytest.approx(1.0)
    assert r["activacion"]["acuerdo_entre_humanos_pearson"] == pytest.approx(1.0)
    assert spearman([1, 2, 2, 3], [1, 2, 2, 3]) == pytest.approx(1.0)


def test_analizar_registro():
    reg = {
        "condicion": "minimo",
        "cambios": [{"desfase_s": 0.01, "reproduciendo": True}, {"desfase_s": 0.02, "reproduciendo": True}, {"desfase_s": 5, "reproduciendo": False}],
        "fps": [{"fps": 60, "cuadros_lentos": 0}] * 20 + [{"fps": 50, "cuadros_lentos": 3}],
        "eventos": [{"tipo": "pausa_no_permitida"}],
    }
    r = analizar(reg)
    assert r["sincronizacion"]["desfase_max_ms"] == 20
    assert r["fluidez"]["segundos_bajo_umbral"] == 1
    assert r["eventos_bloqueados"] == 1
