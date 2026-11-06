# Escuchar y ver — ambientación visual reactiva para audiolibros

Prueba de concepto del sistema propuesto en *Escuchar y ver: diseño e implementación de un sistema de ambientación visual reactiva para audiolibros* (B. Robles). El sistema tiene dos etapas (sección IV-B):

1. **Preprocesamiento** (`preprocesamiento/`, Python), una vez por audiolibro: transcripción con Whisper con tiempos por frase → segmentación en bloques de al menos `d_min = 20 s` que cierran en final de frase → anotación afectiva con un modelo de lenguaje (valencia `v ∈ [-1, 1]`, activación `a ∈ [0, 1]`, con el segmento anterior como contexto, salida JSON validada y reanotación si no cumple formato o rango). Produce un JSON con un registro por segmento.
2. **Reproducción** (`reproductor/index.html`, JavaScript sin dependencias): reproduce el audio y dibuja un gradiente radial difuso a pantalla completa. En cada cuadro (`requestAnimationFrame`) lee la posición y la energía RMS (`AnalyserNode`), busca el segmento activo por búsqueda binaria, calcula el color objetivo con las ecuaciones (1)–(3), lo suaviza con (4) y suma la modulación por voz de (5).

Perfiles (Cuadro I) definidos en `Ambientacion.PERFILES` dentro del reproductor: `minimo`, `llamativo` y `control` (fondo neutro y estático).

## Uso

```bash
pip install -r requirements.txt
```

```bash
export ANTHROPIC_API_KEY=...
python -m preprocesamiento.pipeline narracion.mp3 -o anotacion.json --matiz-base 210 --titulo "Obra" --guardar-frases frases.json
```

`--frases frases.json` reutiliza una transcripción previa (evita volver a correr Whisper). `--solo-segmentar` genera el archivo sin llamar al modelo. Si la anotación se interrumpe, al volver a ejecutar se reanuda desde `anotacion.json.parcial`.

El reproductor se abre directamente en el navegador (`reproductor/index.html`) eligiendo el JSON, el audio, la condición, el ID del participante y el modo:

- **Experimento**: pantalla completa, sin cursor, sin controles; pausas, saltos y teclas multimedia se bloquean y quedan registrados (VI-B). Al terminar se ofrece descargar el registro de la sesión; el operador también puede descargarlo con Ctrl+Shift+L.
- **Desarrollo**: controles de audio y panel con t, segmento, H/S/L, r(t) y fps.

También acepta parámetros por URL si se sirve por HTTP: `?anotacion=…&audio=…&condicion=minimo&modo=desarrollo`.

## Verificación técnica (sección V)

```bash
python -m verificacion.analizar_registro registro_P01_minimo_*.json
```

Reporta desfase entre inicio de segmento y cambio de color (medio, mediana, p95, máximo) y fps a lo largo de la sesión, comparando el primer y el último 10 % para detectar degradación en sesiones de 60 min.

```bash
python -m verificacion.muestra_humana anotacion.json -n 40 --anotadores A1 A2 A3 -o humanos.csv
```

```bash
python -m verificacion.validar_anotacion anotacion.json humanos.csv
```

Compara la anotación del modelo con la media humana (Pearson, Spearman, error absoluto medio) y reporta el acuerdo entre humanos como referencia.

## Pruebas

```bash
python -m pytest tests
```

```bash
python ejemplos/generar_demo.py --duracion 60 -o ejemplos/demo && node tests/test_reproductor.js 45
```

La segunda corre el reproductor en Chromium (Playwright) con audio sintético y verifica ecuaciones, sincronización, fps y bloqueo de pausa.
