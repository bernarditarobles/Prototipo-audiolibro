// Genera la presentación de la prueba de concepto (.pptx) a partir de los datos del repositorio.
//   NODE_PATH=<carpeta con pptxgenjs>/node_modules node presentacion/generar_presentacion.js
// Requiere pptxgenjs (npm install pptxgenjs). Opcional: APLICAR_TEMA=<ruta a apply_theme.js>.
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const RAIZ = path.resolve(__dirname, "..");
const SALIDA = path.join(__dirname, "POC_ambientacion_audiolibros.pptx");
const anot = JSON.parse(fs.readFileSync(path.join(RAIZ, "datos/mujer_alta/anotacion.json"), "utf8"));
const reg = JSON.parse(fs.readFileSync(path.join(RAIZ, "datos/mujer_alta/registro_test_minimo.json"), "utf8"));
const img = (p) => path.join(RAIZ, p);

const THEME = {
  name: "Escuchar y ver",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1A1F2B", lt1: "FFFFFF", dk2: "121826", lt2: "EEF2F5",
    accent1: "1F8A84", accent2: "D9962B", accent3: "5B6B8C", accent4: "7E57C2",
    accent5: "B5473A", accent6: "8A94A6", hlink: "1F8A84", folHlink: "5B6B8C",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
pres.title = "Escuchar y ver: prueba de concepto";
pres.author = "Bernardita Robles";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

const W = 13.333, M = 0.6;

// ---------- Layouts ----------
pres.defineSlideMaster({
  title: "PORTADA",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 2.0, w: 6.4, h: 1.6, fontSize: 44, bold: true, color: C.background1, valign: "bottom", align: "left" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 3.75, w: 6.4, h: 1.6, fontSize: 20, color: C.background2, valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENIDO",
  background: { color: C.background1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.35, w: W - 2 * M, h: 0.9, fontSize: 32, bold: true, color: C.text1, valign: "middle", align: "left" }, text: "" } },
  ],
  slideNumber: { x: W - 1.0, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6 },
});
pres.defineSlideMaster({
  title: "OSCURO",
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.35, w: W - 2 * M, h: 0.9, fontSize: 32, bold: true, color: C.background1, valign: "middle", align: "left" }, text: "" } },
  ],
  slideNumber: { x: W - 1.0, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6 },
});

const caja = (s, txt, o) => s.addText(txt, { isTextBox: true, margin: 0, fontSize: 16, color: C.text1, valign: "top", ...o });

// ---------- 1. Portada ----------
pres.addSection({ title: "Introducción" });
let s = pres.addSlide({ masterName: "PORTADA", sectionTitle: "Introducción" });
s.addText("Escuchar y ver", { placeholder: "title" });
s.addText([
  { text: "Sistema de ambientación visual reactiva para audiolibros", options: { breakLine: true } },
  { text: "Prueba de concepto y resultados · Bernardita Robles", options: { fontSize: 16, color: C.accent6 } },
], { placeholder: "body" });
s.addImage({ path: img("docs/capturas_estimulo/llamativo_terror.png"), x: 7.5, y: 2.1, w: 5.23, h: 2.94, objectName: "Estímulo de muestra" });
s.addNotes("Presento la prueba de concepto del sistema que propongo en el paper: una ambientación visual que acompaña la escucha de un audiolibro y reacciona al tono emocional de la historia. Muestro cómo funciona y qué resultados obtuve en la verificación técnica.");

// ---------- 2. Problema y pregunta ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Introducción" });
s.addText("¿Puede una imagen acompañar un audiolibro?", { placeholder: "title" });
caja(s, [
  { text: "El problema", options: { bold: true, fontSize: 20, color: C.accent1, breakLine: true } },
  { text: "Al escuchar, el oyente construye sus propias imágenes mentales. Un estímulo visual podría reforzar la experiencia o competir con esa imaginación, y no se sabe cuál de las dos cosas pasa.", options: { breakLine: true } },
  { text: " ", options: { breakLine: true, fontSize: 8 } },
  { text: "El objetivo", options: { bold: true, fontSize: 20, color: C.accent1, breakLine: true } },
  { text: "Diseñar e implementar una ambientación visual sincronizada con la narración, con reglas derivadas de la teoría, y proponer un experimento que mida su efecto en comprensión, inmersión y fatiga visual." },
], { x: M, y: 1.6, w: 6.4, h: 4.8, paraSpaceAfter: 6 });
// Tarjetas de teoría
const teorias = [
  ["Codificación dual", "Verbal + no verbal favorece el recuerdo (Paivio)"],
  ["Aprendizaje multimedia", "Lo ajeno al contenido consume atención (Mayer)"],
  ["Transporte narrativo", "La inmersión depende de la imaginería propia (Green y Brock)"],
  ["Ambient displays", "Cambios sutiles se procesan en el trasfondo (Wisneski)"],
];
teorias.forEach(([t, d], i) => {
  const y = 1.6 + i * 1.2;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.6, y, w: 5.1, h: 1.0, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `Teoría ${i + 1}` });
  caja(s, [{ text: t, options: { bold: true, fontSize: 16, breakLine: true } }, { text: d, options: { fontSize: 14, color: C.accent3 } }], { x: 7.85, y: y + 0.12, w: 4.7, h: 0.8 });
});
s.addNotes("El paper parte de cuatro marcos: la codificación dual, la teoría del aprendizaje multimedia, el transporte narrativo y los ambient displays. De ahí salen las reglas de diseño del estímulo.");

// ---------- 3. Requisitos ----------
pres.addSection({ title: "Diseño" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Diseño" });
s.addText("Cinco requisitos para no competir con la historia", { placeholder: "title" });
const req = [
  ["R1", "Sin interacción", "No exige respuestas ni seguimiento"],
  ["R2", "Lento y sutil", "Cambios en el trasfondo de la atención"],
  ["R3", "No figurativo", "Solo color y luz difusa, sin escenas"],
  ["R4", "Coherente", "Reacciona al contenido de la historia"],
  ["R5", "Moderado", "Saturación y brillo acotados"],
];
const anchoR = (W - 2 * M - 4 * 0.3) / 5;
req.forEach(([id, t, d], i) => {
  const x = M + i * (anchoR + 0.3);
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.8, w: anchoR, h: 3.6, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `Requisito ${id}` });
  s.addShape(pres.shapes.OVAL, { x: x + (anchoR - 1.0) / 2, y: 2.15, w: 1.0, h: 1.0, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: `Círculo ${id}` });
  s.addText(id, { isTextBox: true, x: x + (anchoR - 1.0) / 2, y: 2.15, w: 1.0, h: 1.0, align: "center", valign: "middle", fontSize: 22, bold: true, color: C.background1, margin: 0 });
  s.addText([{ text: t, options: { bold: true, fontSize: 18, breakLine: true } }, { text: d, options: { fontSize: 14, color: C.accent3 } }],
    { isTextBox: true, x: x + 0.2, y: 3.4, w: anchoR - 0.4, h: 1.8, align: "center", valign: "top", color: C.text1, margin: 0, paraSpaceAfter: 6 });
});
caja(s, "El perfil mínimo cumple los cinco. El perfil llamativo rompe R2 y R5 a propósito: es la condición de contraste del experimento.", { x: M, y: 5.9, w: W - 2 * M, h: 0.8, fontSize: 16, color: C.accent3, italic: true });
s.addNotes("Estos requisitos salen de los antecedentes: Xie et al. muestran que una tarea visual exigente baja la comprensión; Mayer, que el material ajeno consume capacidad; Green y Brock, que la inmersión depende de las imágenes propias del oyente.");

// ---------- 4. Arquitectura ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Diseño" });
s.addText("Dos etapas: analizar una vez, reproducir en vivo", { placeholder: "title" });
const etapa = (x, y, w, titulo, pasos, color) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 4.4, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: titulo });
  caja(s, titulo, { x: x + 0.3, y: y + 0.25, w: w - 0.6, h: 0.5, fontSize: 20, bold: true, color });
  pasos.forEach(([t, d], i) => {
    const yy = y + 0.95 + i * 0.85;
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: yy + 0.05, w: 0.5, h: 0.5, fill: { color }, line: { color }, objectName: `${titulo} paso ${i + 1}` });
    s.addText(String(i + 1), { isTextBox: true, x: x + 0.3, y: yy + 0.05, w: 0.5, h: 0.5, align: "center", valign: "middle", fontSize: 14, bold: true, color: C.background1, margin: 0 });
    caja(s, [{ text: t, options: { bold: true, breakLine: true } }, { text: d, options: { fontSize: 14, color: C.accent3 } }], { x: x + 1.0, y: yy, w: w - 1.3, h: 0.8, fontSize: 16 });
  });
};
etapa(M, 1.6, 5.6, "Preprocesamiento (Python)", [
  ["Transcripción", "Whisper: texto y tiempos de cada frase"],
  ["Segmentación", "Bloques de ≥ 20 s que cierran en final de frase"],
  ["Anotación afectiva", "Valencia (−1 a 1) y activación (0 a 1)"],
  ["Archivo JSON", "Un registro por segmento"],
], C.accent1);
s.addShape(pres.shapes.RIGHT_ARROW, { x: M + 5.75, y: 3.55, w: 0.75, h: 0.5, fill: { color: C.accent6 }, line: { color: C.accent6 }, objectName: "Flecha" });
etapa(M + 6.65, 1.6, 5.45, "Reproducción (navegador, 60 veces/s)", [
  ["Lectura del audio", "Posición t y energía de la voz r(t)"],
  ["Segmento activo", "Búsqueda binaria en el JSON"],
  ["Cálculo del color", "Ecuaciones 1–5, con transición gradual"],
  ["Renderizado", "Resplandor de color a pantalla completa"],
], C.accent2);
s.addNotes("Se separa en dos etapas porque tienen tiempos muy distintos: transcribir y anotar lleva minutos, y la imagen se actualiza 60 veces por segundo. Un mismo JSON sirve para las tres condiciones del experimento.");

// ---------- 5. Mapeo ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Diseño" });
s.addText("De la emoción del texto al estímulo", { placeholder: "title" });
const filas = [
  ["Activación a", "→", "saturación y luminosidad: más intenso, más vivo"],
  ["Valencia v", "→", "matiz: cálido si es agradable, frío si no"],
  ["Voz r(t)", "→", "leve modulación del brillo"],
  ["Suavizado τ", "→", "transición gradual hacia cada nuevo valor"],
];
filas.forEach(([a, f, b], i) => {
  const y = 1.7 + i * 0.95;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y, w: 2.3, h: 0.7, rectRadius: 0.1, fill: { color: i < 3 ? C.accent1 : C.accent3 }, line: { color: i < 3 ? C.accent1 : C.accent3 }, objectName: `Entrada ${a}` });
  s.addText(a, { isTextBox: true, x: M, y, w: 2.3, h: 0.7, align: "center", valign: "middle", fontSize: 16, bold: true, color: C.background1, margin: 0 });
  caja(s, f, { x: M + 2.45, y: y + 0.1, w: 0.4, h: 0.5, fontSize: 20, color: C.accent6, align: "center" });
  caja(s, b, { x: M + 3.0, y: y + 0.17, w: 3.6, h: 0.6, fontSize: 16 });
});
const tabla = [
  [{ text: "Parámetro", options: { bold: true, color: C.background1, fill: { color: C.text2 } } },
   { text: "Mínimo", options: { bold: true, color: C.background1, fill: { color: C.text2 } } },
   { text: "Llamativo", options: { bold: true, color: C.background1, fill: { color: C.text2 } } }],
  ["Saturación", "0,35 – 0,60", "0,70 – 1,00"],
  ["Luminosidad", "0,35 – 0,55", "0,45 – 0,65"],
  ["ΔH (matiz)", "100°", "130°"],
  ["τ (transición)", "6 s", "0,5 s"],
  ["k (voz)", "0,02", "0,15"],
];
s.addTable(tabla, { x: 7.5, y: 1.7, w: 5.2, colW: [1.9, 1.65, 1.65], fontSize: 14, color: C.text1, border: { type: "solid", pt: 0.75, color: HEX.lt2 }, rowH: 0.48, fill: { color: C.background1 }, objectName: "Tabla de perfiles" });
caja(s, "La activación controla saturación y luminosidad porque son las dimensiones del color con más efecto sobre la emoción (Wilms y Oberfeld, 2018). Matiz base H₀ = 355°.", { x: M, y: 5.75, w: 6.3, h: 1.2, fontSize: 14, color: C.accent3, italic: true });
s.addNotes("Los valores objetivo se calculan con las ecuaciones 1 a 3 del paper y se aproximan con el suavizado exponencial de la ecuación 4. El brillo suma la energía de la voz (ecuación 5). Con el matiz base de 355°, lo agradable se ve dorado y lo desagradable violeta.");

// ---------- 6. Obra y anotación ----------
pres.addSection({ title: "Resultados" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText("La mujer alta: el arco emocional anotado", { placeholder: "title" });
const segs = anot.segmentos;
const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
const etiquetas = segs.map((x) => mmss(x.inicio));
const ejeComun = {
  catAxisLabelFrequency: 14, catAxisLabelFontSize: 10, valAxisLabelFontSize: 10, catAxisLabelColor: HEX.accent6, valAxisLabelColor: HEX.accent6,
  catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", titleFontFace: "+mn-lt",
  valGridLine: { color: "E3E6EA", size: 0.5 }, catGridLine: { style: "none" }, showLegend: false, lineDataSymbol: "none",
  showTitle: true, titleFontSize: 14, titleColor: HEX.dk1, catAxisLineShow: false,
};
s.addChart(pres.charts.LINE, [{ name: "Valencia", labels: etiquetas, values: segs.map((x) => x.valencia) }], {
  x: M, y: 1.4, w: 8.4, h: 2.75, ...ejeComun, title: "Valencia (−1 desagradable, +1 agradable)", chartColors: [HEX.accent1], lineSize: 2,
  valAxisMinVal: -1, valAxisMaxVal: 1, valAxisMajorUnit: 0.5, objectName: "Gráfico de valencia",
});
s.addChart(pres.charts.AREA, [{ name: "Activación", labels: etiquetas, values: segs.map((x) => x.activacion) }], {
  x: M, y: 4.2, w: 8.4, h: 2.75, ...ejeComun, title: "Activación (0 calma, 1 intensidad)", chartColors: [HEX.accent2], chartColorsOpacity: 70,
  valAxisMinVal: 0, valAxisMaxVal: 1, valAxisMajorUnit: 0.5, objectName: "Gráfico de activación",
});
const stats = [["36:16", "min de audio, un narrador"], ["612", "frases transcritas por Whisper"], ["100", "segmentos de 20 a 27 s"]];
stats.forEach(([n, l], i) => {
  const y = 1.5 + i * 1.75;
  caja(s, n, { x: 9.4, y, w: 3.3, h: 0.9, fontSize: 44, bold: true, color: C.accent1 });
  caja(s, l, { x: 9.4, y: y + 0.9, w: 3.3, h: 0.6, fontSize: 14, color: C.accent3 });
});
s.addNotes("Usé La mujer alta, cuento de Alarcón grabado en LibriVox. Whisper lo transcribió en seis minutos sin GPU. Se ve el arco: arranca positivo en la conversación en el monte, cae con la muerte de Joaquina (minuto 5), y la activación tiene picos en la primera aparición de la mujer (13:34), el segundo encuentro (26:15) y el cementerio (33). La anotación la hizo Claude siguiendo la instrucción del sistema, no por API.");

// ---------- 7. Estímulo ----------
s = pres.addSlide({ masterName: "OSCURO", sectionTitle: "Resultados" });
s.addText("El mismo segmento, dos perfiles", { placeholder: "title" });
const anchoI = 4.6, altoI = anchoI * 9 / 16, x0 = 2.6, y0 = 1.75, gap = 0.3;
[["minimo", "Mínimo"], ["llamativo", "Llamativo"]].forEach(([p, nombre], c) => {
  caja(s, nombre, { x: x0 + c * (anchoI + gap), y: y0 - 0.45, w: anchoI, h: 0.4, fontSize: 18, bold: true, color: C.background1, align: "center" });
  [["calma", "Calma"], ["terror", "Terror"]].forEach(([e, n2], f) => {
    s.addImage({ path: img(`docs/capturas_estimulo/${p}_${e}.png`), x: x0 + c * (anchoI + gap), y: y0 + f * (altoI + gap), w: anchoI, h: altoI, objectName: `${nombre} ${n2}` });
  });
});
[["Calma", "v = 0,45 · a = 0,15"], ["Terror", "v = −0,85 · a = 0,85"]].forEach(([t, d], f) => {
  caja(s, [{ text: t, options: { bold: true, fontSize: 18, breakLine: true } }, { text: d, options: { fontSize: 12, color: C.accent6 } }],
    { x: M, y: y0 + f * (altoI + gap) + altoI / 2 - 0.4, w: 1.8, h: 0.9, color: C.background1 });
});
s.addNotes("En la calma la luz es dorada y tenue; en el terror, violeta y más intensa. El perfil mínimo es suave y tarda unos 6 segundos en llegar a cada nuevo color; el llamativo cambia en medio segundo y usa colores saturados, a propósito, como contraste.");

// ---------- 8. Verificación técnica ----------
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Resultados" });
s.addText("Sincronizado y fluido durante los 36 minutos", { placeholder: "title" });
const cambios = reg.cambios.filter((c) => c.reproduciendo);
const desf = cambios.map((c) => Math.abs(c.desfase_s) * 1000);
const media = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const fps = reg.fps.map((f) => f.fps);
const decimo = Math.max(1, Math.floor(fps.length / 10));
const big = [
  [`${media(desf).toFixed(1).replace(".", ",")} ms`, "desfase medio al cambiar de segmento"],
  [`${Math.max(...desf).toFixed(1).replace(".", ",")} ms`, "desfase máximo en 100 cambios"],
  [`${media(fps).toFixed(2).replace(".", ",")}`, "cuadros por segundo de media"],
  [`${media(fps.slice(0, decimo)).toFixed(1).replace(".", ",")} → ${media(fps.slice(-decimo)).toFixed(1).replace(".", ",")}`, "fps al inicio y al final: sin degradación"],
];
big.forEach(([n, l], i) => {
  const x = M + (i % 2) * 2.95, y = 1.55 + Math.floor(i / 2) * 1.7;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 2.75, h: 1.5, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: `Indicador ${i + 1}` });
  caja(s, n, { x: x + 0.2, y: y + 0.15, w: 2.35, h: 0.7, fontSize: 30, bold: true, color: C.accent1 });
  caja(s, l, { x: x + 0.2, y: y + 0.85, w: 2.35, h: 0.6, fontSize: 12, color: C.accent3 });
});
caja(s, "Sesión completa con el perfil mínimo, en modo experimento. El intento de pausa quedó bloqueado y registrado.", { x: M, y: 5.05, w: 5.7, h: 0.8, fontSize: 14, color: C.text1 });
caja(s, "Medido en Chromium sin pantalla y con renderizado por software: hay que repetirlo en el equipo del experimento.", { x: M, y: 5.85, w: 5.7, h: 0.8, fontSize: 14, color: C.accent3, italic: true });
s.addChart(pres.charts.BAR, [{ name: "Desfase (ms)", labels: cambios.map((c) => mmss(c.t_audio)), values: desf }], {
  x: 6.9, y: 1.4, w: 5.85, h: 2.7, barDir: "col", barGapWidthPct: 60, ...ejeComun, title: "Desfase de cada cambio de segmento (ms)", chartColors: [HEX.accent1],
  valAxisMinVal: 0, valAxisMaxVal: 25, valAxisMajorUnit: 10, objectName: "Gráfico de desfase",
});
// fps: promedio por cada 10 s para que el gráfico sea liviano; el mínimo se informa aparte.
const bloques = [];
for (let i = 0; i < reg.fps.length; i += 10) {
  const b = reg.fps.slice(i, i + 10);
  bloques.push({ t: b[0].t_audio, v: Math.min(...b.map((x) => x.fps)) });
}
s.addChart(pres.charts.LINE, [{ name: "fps", labels: bloques.map((b) => mmss(b.t)), values: bloques.map((b) => b.v) }], {
  x: 6.9, y: 4.2, w: 5.85, h: 2.7, ...ejeComun, catAxisLabelFrequency: 30, title: "Cuadros por segundo (mínimo de cada 10 s)", chartColors: [HEX.accent2], lineSize: 2,
  valAxisMinVal: 0, valAxisMaxVal: 65, valAxisMajorUnit: 30, objectName: "Gráfico de fps",
});
s.addNotes(`El desfase se mide entre el inicio de cada segmento y el cuadro en que cambia el color objetivo: como mucho un cuadro más la actualización de la posición del audio, despreciable frente a los 6 s de transición. En ${fps.length} segundos registrados, el mínimo fue ${Math.min(...fps).toFixed(1)} fps. La tercera verificación, comparar la anotación con humanos, queda pendiente.`);

// ---------- 9. Demo ----------
s = pres.addSlide({ masterName: "OSCURO", sectionTitle: "Resultados" });
s.addText("Demo en vivo", { placeholder: "title" });
s.addImage({ path: img("docs/capturas/llamativo_terror.png"), x: 6.0, y: 1.5, w: 6.73, h: 3.79, objectName: "Panel explicativo" });
const pasosDemo = [
  "Perfil llamativo, modo desarrollo",
  "Saltar a 13:34: primera aparición de la mujer alta",
  "Volver a 0:50: la calma en el monte",
  "Repetir con el perfil mínimo",
];
pasosDemo.forEach((t, i) => {
  const y = 1.6 + i * 0.95;
  s.addShape(pres.shapes.OVAL, { x: M, y, w: 0.6, h: 0.6, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: `Demo paso ${i + 1}` });
  s.addText(String(i + 1), { isTextBox: true, x: M, y, w: 0.6, h: 0.6, align: "center", valign: "middle", fontSize: 16, bold: true, color: C.background1, margin: 0 });
  caja(s, t, { x: M + 0.85, y: y + 0.08, w: 4.4, h: 0.8, fontSize: 16, color: C.background1 });
});
caja(s, "El panel (frase narrada, línea de tiempo y color de cada segmento) solo aparece en modo desarrollo; los participantes ven únicamente la luz de color.", { x: 6.0, y: 5.5, w: 6.73, h: 0.9, fontSize: 14, color: C.accent6, italic: true });
s.addNotes("Abrir reproductor/index.html en Chrome, cargar datos/mujer_alta/anotacion.json y el MP3, elegir perfil llamativo y modo desarrollo. Con un clic en la línea de tiempo se salta a cada momento. La tecla E oculta el panel.");

// ---------- 10. Pendiente y próximos pasos ----------
pres.addSection({ title: "Cierre" });
s = pres.addSlide({ masterName: "CONTENIDO", sectionTitle: "Cierre" });
s.addText("Qué falta y qué sigue", { placeholder: "title" });
const col = (x, titulo, items, color) => {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.6, w: 5.8, h: 3.6, rectRadius: 0.15, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: titulo });
  caja(s, titulo, { x: x + 0.35, y: 1.85, w: 5.1, h: 0.5, fontSize: 20, bold: true, color });
  caja(s, items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1 } })), { x: x + 0.35, y: 2.55, w: 5.1, h: 2.5, fontSize: 16, paraSpaceAfter: 10 });
};
col(M, "Limitaciones de la prueba", [
  "La anotación no se comparó todavía con anotadores humanos",
  "Fue hecha por Claude en sesión, no por la API",
  "La medición se hizo sin pantalla física",
  "La paleta (dorado–violeta) es una decisión de diseño, sin respaldo empírico",
], C.accent5);
col(M + 6.3, "Próximos pasos", [
  "Validar la anotación con 2 o 3 lectores humanos",
  "Repetir la verificación en el equipo del experimento",
  "Experimento entre sujetos: control, mínimo y llamativo",
  "Medir comprensión, inmersión (TS-SF) y fatiga visual",
], C.accent1);
caja(s, "El sistema funciona de punta a punta: falta comprobar que el color acompaña la emoción que perciben las personas.", { x: M, y: 5.6, w: W - 2 * M, h: 0.8, fontSize: 18, italic: true, color: C.accent3 });
s.addNotes("Lo más importante pendiente es validar la anotación, porque todo el estímulo depende de esos valores. Las herramientas ya están: planilla y análisis de correlación. Después, el experimento que propongo en el paper.");

(async () => {
  await pres.writeFile({ fileName: SALIDA });
  if (process.env.APLICAR_TEMA) {
    const { applyTheme } = require(process.env.APLICAR_TEMA);
    await applyTheme(SALIDA, THEME);
  }
  console.log("Escrito", SALIDA);
})();
