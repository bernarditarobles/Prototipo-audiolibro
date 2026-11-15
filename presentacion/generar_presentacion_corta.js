// Presentación corta (5 diapositivas) para mostrar la prueba de concepto.
//   NODE_PATH=<carpeta con pptxgenjs>/node_modules node presentacion/generar_presentacion_corta.js
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const RAIZ = path.resolve(__dirname, "..");
const SALIDA = path.join(__dirname, "Escuchar_y_ver_presentacion.pptx");
const reg = JSON.parse(fs.readFileSync(path.join(RAIZ, "datos/mujer_alta/registro_test_minimo.json"), "utf8"));
const img = (p) => path.join(RAIZ, p);

const THEME = {
  name: "Escuchar y ver",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "1B1622", lt1: "FFFFFF", dk2: "0E0B14", lt2: "F1EEF5",
    accent1: "E3A93F", accent2: "B8323A", accent3: "6B6380", accent4: "C46A9A",
    accent5: "4F8A6E", accent6: "A39CB3", hlink: "B8323A", folHlink: "6B6380",
  },
};

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "Escuchar y ver";
pres.author = "Bernardita Robles";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const W = 13.333, M = 0.6;

pres.defineSlideMaster({
  title: "OSCURO", background: { color: C.text2 },
  objects: [{ placeholder: { options: { name: "title", type: "title", x: M, y: 0.4, w: W - 2 * M, h: 1.0, fontSize: 36, bold: true, color: C.background1, align: "left", valign: "middle" }, text: "" } }],
  slideNumber: { x: W - 1.0, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6 },
});
pres.defineSlideMaster({
  title: "CLARO", background: { color: C.background1 },
  objects: [{ placeholder: { options: { name: "title", type: "title", x: M, y: 0.4, w: W - 2 * M, h: 1.0, fontSize: 36, bold: true, color: C.text1, align: "left", valign: "middle" }, text: "" } }],
  slideNumber: { x: W - 1.0, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: C.accent6 },
});
const caja = (s, t, o) => s.addText(t, { isTextBox: true, margin: 0, fontSize: 18, color: C.text1, valign: "top", ...o });

// 1. Motivación
let s = pres.addSlide({ masterName: "OSCURO" });
s.addText("Escucho audiolibros mirando una portada fija", { placeholder: "title" });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.6, y: 1.9, w: 2.6, h: 3.7, rectRadius: 0.12, fill: { color: "2A2433" }, line: { color: "3A3345" }, objectName: "Portada fija" });
caja(s, [{ text: "LA MUJER ALTA", options: { bold: true, fontSize: 18, breakLine: true } }, { text: "P. A. de Alarcón", options: { fontSize: 12, color: C.accent6 } }],
  { x: 1.85, y: 4.55, w: 2.2, h: 0.9, color: C.background1 });
caja(s, "Hoy", { x: 1.6, y: 5.75, w: 2.6, h: 0.4, fontSize: 16, color: C.accent6, align: "center" });
s.addShape(pres.shapes.RIGHT_ARROW, { x: 4.75, y: 3.5, w: 0.9, h: 0.55, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: "Flecha" });
s.addImage({ path: img("docs/capturas_estimulo/minimo_calma.png"), x: 6.2, y: 1.9, w: 3.2, h: 1.8, objectName: "Calma" });
s.addImage({ path: img("docs/capturas_estimulo/minimo_terror.png"), x: 9.55, y: 1.9, w: 3.2, h: 1.8, objectName: "Terror" });
caja(s, "Con ambientación: la luz acompaña el clima de cada momento", { x: 6.2, y: 3.85, w: 6.55, h: 0.5, fontSize: 16, color: C.accent6 });
caja(s, "¿Puede una luz que acompaña la historia sumar a la escucha, sin distraer?", { x: 6.2, y: 4.7, w: 6.55, h: 1.4, fontSize: 24, bold: true, color: C.background1 });
s.addNotes("Escucho muchos audiolibros, y muchas veces, cuando escucho sola en mi departamento, lo único que tengo enfrente es la imagen fija de la portada. Se me ocurrió un sistema que acompañe la escucha con una ambientación visual que reacciona a lo que pasa en la historia. La pregunta es si eso suma o distrae. Hay investigaciones sobre el efecto de lo visual en la escucha de relatos, pero hasta donde pude relevar, ninguna lo evaluó durante un relato completo.");

// 2. Cómo funciona
s = pres.addSlide({ masterName: "CLARO" });
s.addText("Cómo funciona", { placeholder: "title" });
const pasos = [
  ["1", "El texto", "Se transcribe el audio y se divide en fragmentos de unos 20 segundos"],
  ["2", "El tono emocional", "Cada fragmento recibe dos valores: qué tan intenso y qué tan agradable es"],
  ["3", "La luz", "La pantalla cambia de color lentamente según ese tono"],
];
pasos.forEach(([n, t, d], i) => {
  const x = M + i * 4.15;
  s.addShape(pres.shapes.OVAL, { x, y: 1.75, w: 0.7, h: 0.7, fill: { color: i === 2 ? C.accent2 : C.accent1 }, line: { color: i === 2 ? C.accent2 : C.accent1 }, objectName: `Paso ${n}` });
  s.addText(n, { isTextBox: true, x, y: 1.75, w: 0.7, h: 0.7, align: "center", valign: "middle", fontSize: 20, bold: true, color: C.background1, margin: 0 });
  caja(s, [{ text: t, options: { bold: true, fontSize: 20, breakLine: true } }, { text: d, options: { fontSize: 15, color: C.accent3 } }], { x: x + 0.9, y: 1.7, w: 2.9, h: 1.5, paraSpaceAfter: 4 });
  if (i < 2) s.addShape(pres.shapes.RIGHT_ARROW, { x: x + 3.75, y: 1.95, w: 0.35, h: 0.3, fill: { color: C.accent6 }, line: { color: C.accent6 }, objectName: `Flecha ${n}` });
});
s.addImage({ path: img("docs/capturas_estimulo/minimo_calma.png"), x: M, y: 3.6, w: 4.6, h: 2.59, objectName: "Calma" });
s.addImage({ path: img("docs/capturas_estimulo/minimo_terror.png"), x: M + 4.85, y: 3.6, w: 4.6, h: 2.59, objectName: "Terror" });
caja(s, [{ text: "Calma", options: { bold: true, breakLine: true } }, { text: "cálida y tranquila", options: { fontSize: 14, color: C.accent3 } }], { x: M, y: 6.3, w: 4.6, h: 0.7, fontSize: 16 });
caja(s, [{ text: "Tensión", options: { bold: true, breakLine: true } }, { text: "roja y más intensa", options: { fontSize: 14, color: C.accent3 } }], { x: M + 4.85, y: 6.3, w: 4.6, h: 0.7, fontSize: 16 });
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 10.35, y: 3.6, w: 2.38, h: 2.59, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "Sin imágenes" });
caja(s, [{ text: "Sin imágenes de la historia", options: { bold: true, fontSize: 16, breakLine: true } }, { text: "A propósito: cada uno imagina las escenas", options: { fontSize: 14, color: C.accent3 } }],
  { x: 10.55, y: 3.85, w: 2.0, h: 2.2, paraSpaceAfter: 6 });
s.addNotes("El sistema analiza el tono emocional de cada momento de la historia: qué tan intenso y qué tan agradable es. Con eso cambia la luz de la pantalla: ámbar y tranquila en la calma, roja e intensa en la tensión. No muestra imágenes de la historia, a propósito: la idea es acompañar el clima y dejar que cada uno imagine las escenas.");

// 3. Demo
s = pres.addSlide({ masterName: "OSCURO" });
s.addText("Demo", { placeholder: "title" });
s.addImage({ path: img("docs/capturas/demo_minimo_terror.png"), x: 2.4, y: 1.6, w: 8.53, h: 4.8, objectName: "Sistema funcionando" });
caja(s, "La mujer alta, de Pedro Antonio de Alarcón · 36 minutos · LibriVox", { x: 2.4, y: 6.55, w: 8.53, h: 0.4, fontSize: 14, color: C.accent6, align: "center" });
s.addNotes("Abrir reproductor/index.html. Elegir anotacion.json y el MP3, perfil Llamativo, modo Demostración. Saltar a 13:34 (aparece la mujer alta) y a 0:50 (la calma). Después repetir con el perfil Mínimo y ocultar el panel con la tecla E.");

// 4. Evaluación y lo comprobado
s = pres.addSlide({ masterName: "CLARO" });
s.addText("¿Suma o distrae? Cómo se evaluaría", { placeholder: "title" });
const grupos = [
  ["Sin efecto", "pantalla fija", "control", "5A5A5A"],
  ["Efecto suave", "el que propongo", "minimo", null],
  ["Efecto intenso", "para comparar", "llamativo", null],
];
grupos.forEach(([t, d, archivo, gris], i) => {
  const x = M + i * 2.75;
  if (gris) s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 1.75, w: 2.5, h: 1.41, rectRadius: 0.08, fill: { color: gris }, line: { color: gris }, objectName: t });
  else s.addImage({ path: img(`docs/capturas_estimulo/${archivo}_terror.png`), x, y: 1.75, w: 2.5, h: 1.41, objectName: t });
  caja(s, [{ text: t, options: { bold: true, breakLine: true } }, { text: d, options: { fontSize: 14, color: C.accent3 } }], { x, y: 3.3, w: 2.5, h: 0.8, fontSize: 17 });
});
caja(s, [
  { text: "Tres grupos de personas, cada una escucha el cuento completo en una sola condición.", options: { breakLine: true } },
  { text: "Se compara: comprensión · inmersión · cansancio visual.", options: { bold: true } },
], { x: M, y: 4.4, w: 8.0, h: 1.2, fontSize: 17, paraSpaceAfter: 6 });
caja(s, "Experimento propuesto, todavía no realizado.", { x: M, y: 5.6, w: 8.0, h: 0.5, fontSize: 14, italic: true, color: C.accent3 });
// Lo comprobado
const cambios = reg.cambios.filter((c) => c.reproduciendo).map((c) => Math.abs(c.desfase_s) * 1000);
const fps = reg.fps.map((f) => f.fps);
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.15, y: 1.75, w: 3.58, h: 4.6, rectRadius: 0.12, fill: { color: C.background2 }, line: { color: C.background2 }, objectName: "Lo comprobado" });
caja(s, "Lo que ya comprobé", { x: 9.4, y: 1.95, w: 3.1, h: 0.5, fontSize: 18, bold: true });
caja(s, `${Math.round(Math.max(...cambios))} ms`, { x: 9.4, y: 2.55, w: 3.1, h: 0.8, fontSize: 40, bold: true, color: C.accent2 });
caja(s, "de demora máxima entre el cambio de escena y el cambio de color", { x: 9.4, y: 3.35, w: 3.1, h: 0.8, fontSize: 13, color: C.accent3 });
caja(s, `${Math.round(fps.reduce((a, b) => a + b, 0) / fps.length)} fps`, { x: 9.4, y: 4.3, w: 3.1, h: 0.8, fontSize: 40, bold: true, color: C.accent2 });
caja(s, "estables durante los 36 minutos del cuento, sin cortes", { x: 9.4, y: 5.1, w: 3.1, h: 0.8, fontSize: 13, color: C.accent3 });
s.addNotes("El desafío es qué tan suave o intenso tiene que ser el efecto para acompañar sin distraer. Por eso propongo un experimento con tres grupos: uno escucha sin efectos, otro con el efecto suave y otro con uno intenso, y se comparan la comprensión, la inmersión y el cansancio visual. Lo que ya pude verificar es que el sistema funciona: con un cuento completo de 36 minutos, el color cambia como máximo 20 milésimas de segundo después de cada escena y la animación se mantiene fluida todo el tiempo.");

// 5. A futuro
s = pres.addSlide({ masterName: "CLARO" });
s.addText("A futuro: una app de audiolibros con ambientación", { placeholder: "title" });
s.addImage({ path: img("presentacion/maqueta_tv.png"), x: M, y: 1.45, w: 8.5, h: 5.22, objectName: "Maqueta: TV y celular" });
const futuro = [
  ["Del celular a la TV", "Se elige el audiolibro en el celular y la ambientación se ve en la TV."],
  ["Catálogo ya analizado", "El análisis se hace una sola vez por libro; la app solo reproduce."],
  ["Integrable en apps existentes", "Por ejemplo, en plataformas de audiolibros como Spotify."],
];
futuro.forEach(([t, d], i) => {
  const y = 1.75 + i * 1.6;
  s.addShape(pres.shapes.OVAL, { x: 9.35, y: y + 0.05, w: 0.42, h: 0.42, fill: { color: i === 0 ? C.accent2 : C.accent1 }, line: { color: i === 0 ? C.accent2 : C.accent1 }, objectName: `Futuro ${i + 1}` });
  caja(s, [{ text: t, options: { bold: true, fontSize: 17, breakLine: true } }, { text: d, options: { fontSize: 14, color: C.accent3 } }], { x: 9.95, y, w: 2.8, h: 1.45, paraSpaceAfter: 4 });
});
caja(s, "Maqueta ilustrativa, no implementada.", { x: M, y: 6.85, w: 8.5, h: 0.35, fontSize: 11, italic: true, color: C.accent6 });
s.addNotes("A futuro, esto podría ser una app de audiolibros: desde el celular elegís el libro y la ambientación se ve en la tele, como la luz de la habitación mientras escuchás. Tendría un catálogo de relatos ya analizados, porque el análisis se hace una sola vez por libro y después solo se reproduce, y podría integrarse en plataformas de audiolibros que ya existen.");

(async () => {
  await pres.writeFile({ fileName: SALIDA });
  if (process.env.APLICAR_TEMA) {
    const { applyTheme } = require(process.env.APLICAR_TEMA);
    await applyTheme(SALIDA, THEME);
  }
  console.log("Escrito", SALIDA);
})();
