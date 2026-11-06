# La mujer alta — Pedro Antonio de Alarcón

Obra de la prueba de concepto. Audio de LibriVox (dominio público), narrador Epachuko, 36:16 min, sección 4 de *Narraciones inquietantes*.

El MP3 no se versiona. Descargarlo en esta carpeta como `mujer_alta_128kb.mp3`:
https://archive.org/download/narraciones_inquietantes_2108_librivox/narracionesinquietantes_04_various_128kb.mp3

- `frases.json`: transcripción de Whisper `small` (612 frases con tiempos).
- `anotacion.json`: 100 segmentos (d_min = 20 s) con valencia y activación; es el archivo que carga el reproductor.
- `valores_anotacion.py`: valores asignados por segmento. La anotación la hizo Claude dentro de una sesión de Claude Code siguiendo la instrucción de `preprocesamiento/anotar.py` (no mediante la API), por lo que no es reproducible ejecutando el script; para obtener una anotación por API: `python -m preprocesamiento.pipeline --frases datos/mujer_alta/frases.json -o otra_anotacion.json`.
