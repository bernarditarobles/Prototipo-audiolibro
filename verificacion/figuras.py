"""Figuras para el paper (formato IEEE, una columna = 3,5 in).

    python -m verificacion.figuras datos/mujer_alta/anotacion.json datos/mujer_alta/registro_test_minimo.json -o docs/figuras

Genera:
  anotacion.pdf      valencia y activación por segmento a lo largo de la obra.
  verificacion.pdf   desfase de cada cambio de segmento y fps por segundo durante la sesión.
  estimulo.pdf       (con --capturas DIR) cuadrícula de capturas {minimo,llamativo}_{calma,terror}.png.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

TINTA = "#1d2b3a"
SERIE = "#2a5b8c"
GRIS = "#9aa3ad"
plt.rcParams.update({
    "font.size": 8, "axes.titlesize": 8, "axes.labelsize": 8, "xtick.labelsize": 7, "ytick.labelsize": 7,
    "axes.edgecolor": GRIS, "axes.labelcolor": TINTA, "xtick.color": TINTA, "ytick.color": TINTA,
    "axes.spines.top": False, "axes.spines.right": False, "pdf.fonttype": 42, "font.family": "DejaVu Sans",
})

# Momentos del relato marcados en la figura de anotación (inicio en segundos, etiqueta).
EVENTOS = [(320, "muerte de\nJoaquina"), (814, "1.ª aparición"), (1575, "2.º encuentro"), (1978, "cementerio")]


def escalon(segs, clave):
    xs, ys = [], []
    for i, s in enumerate(segs):
        fin = segs[i + 1]["inicio"] if i + 1 < len(segs) else s["fin"]
        xs += [s["inicio"] / 60, fin / 60]
        ys += [s[clave], s[clave]]
    return xs, ys


def figura_anotacion(doc: dict, salida: Path) -> None:
    segs = doc["segmentos"]
    fig, (av, aa) = plt.subplots(2, 1, figsize=(3.5, 2.6), sharex=True, gridspec_kw={"hspace": 0.18})
    x, y = escalon(segs, "valencia")
    av.axhline(0, color=GRIS, lw=0.6)
    av.plot(x, y, color=SERIE, lw=1.2)
    av.set_ylim(-1.05, 1.05)
    av.set_yticks([-1, 0, 1])
    av.set_ylabel("Valencia $v$")
    x, y = escalon(segs, "activacion")
    aa.fill_between(x, y, color=SERIE, alpha=0.25, lw=0)
    aa.plot(x, y, color=SERIE, lw=1.2)
    aa.set_ylim(0, 1.05)
    aa.set_yticks([0, 0.5, 1])
    aa.set_ylabel("Activación $a$")
    aa.set_xlabel("Tiempo (min)")
    aa.set_xlim(0, segs[-1]["fin"] / 60)
    for i, (t, etiqueta) in enumerate(EVENTOS):
        for ax in (av, aa):
            ax.axvline(t / 60, color=GRIS, lw=0.6, ls=(0, (2, 2)))
        av.text(t / 60 + 0.3, 1.0 if i % 2 == 0 else 0.55, etiqueta, fontsize=6, color=TINTA, va="top", ha="left", linespacing=0.9)
    for ax in (av, aa):
        ax.grid(axis="y", color="#e3e6ea", lw=0.5)
        ax.set_axisbelow(True)
    fig.align_ylabels()
    fig.savefig(salida / "anotacion.pdf", bbox_inches="tight")
    fig.savefig(salida / "anotacion.png", bbox_inches="tight", dpi=300)
    plt.close(fig)


def figura_verificacion(reg: dict, salida: Path) -> None:
    cambios = [c for c in reg["cambios"] if c["reproduciendo"]]
    fps = reg["fps"]
    fig, (ad, af) = plt.subplots(2, 1, figsize=(3.5, 2.4), sharex=True, gridspec_kw={"hspace": 0.2})
    ad.vlines([c["t_audio"] / 60 for c in cambios], 0, [abs(c["desfase_s"]) * 1000 for c in cambios], color=SERIE, lw=0.8)
    ad.plot([c["t_audio"] / 60 for c in cambios], [abs(c["desfase_s"]) * 1000 for c in cambios], "o", color=SERIE, ms=2.2)
    ad.set_ylabel("Desfase (ms)")
    ad.set_ylim(0, max(25, max(abs(c["desfase_s"]) * 1000 for c in cambios) * 1.15))
    af.plot([f["t_audio"] / 60 for f in fps], [f["fps"] for f in fps], color=SERIE, lw=0.6)
    af.set_ylim(0, 65)
    af.set_yticks([0, 30, 60])
    af.set_ylabel("Cuadros/s")
    af.set_xlabel("Tiempo de reproducción (min)")
    af.set_xlim(0, (reg["resumen"].get("duracion_audio_s") or fps[-1]["t_audio"]) / 60)
    for ax in (ad, af):
        ax.grid(axis="y", color="#e3e6ea", lw=0.5)
        ax.set_axisbelow(True)
    fig.align_ylabels()
    fig.savefig(salida / "verificacion.pdf", bbox_inches="tight")
    fig.savefig(salida / "verificacion.png", bbox_inches="tight", dpi=300)
    plt.close(fig)


def figura_estimulo(capturas: Path, salida: Path) -> None:
    fig, ejes = plt.subplots(2, 2, figsize=(3.5, 2.2), gridspec_kw={"wspace": 0.04, "hspace": 0.04})
    for f, (escena, nombre_f) in enumerate([("calma", "Calma"), ("terror", "Terror")]):
        for c, (perfil, nombre_c) in enumerate([("minimo", "Mínimo"), ("llamativo", "Llamativo")]):
            ax = ejes[f][c]
            ax.imshow(plt.imread(capturas / f"{perfil}_{escena}.png"))
            ax.set_xticks([]); ax.set_yticks([])
            for lado in ax.spines.values():
                lado.set_visible(False)
            if f == 0:
                ax.set_title(nombre_c, pad=3)
            if c == 0:
                ax.set_ylabel(nombre_f)
    fig.savefig(salida / "estimulo.pdf", bbox_inches="tight", dpi=200)
    fig.savefig(salida / "estimulo.png", bbox_inches="tight", dpi=200)
    plt.close(fig)


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("anotacion")
    p.add_argument("registro")
    p.add_argument("-o", "--salida", default="docs/figuras")
    p.add_argument("--capturas", help="Carpeta con las capturas del estímulo para la Fig. de estímulo.")
    a = p.parse_args(argv)
    salida = Path(a.salida)
    salida.mkdir(parents=True, exist_ok=True)
    figura_anotacion(json.loads(Path(a.anotacion).read_text(encoding="utf-8")), salida)
    figura_verificacion(json.loads(Path(a.registro).read_text(encoding="utf-8")), salida)
    if a.capturas:
        figura_estimulo(Path(a.capturas), salida)
    print(f"Figuras en {salida}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
