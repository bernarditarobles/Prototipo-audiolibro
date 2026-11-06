// Prueba del reproductor en Chromium sin interfaz.
//   python ejemplos/generar_demo.py --duracion 60 -o ejemplos/demo
//   node tests/test_reproductor.js [segundos]
// Otra obra: ANOTACION=/datos/x/anotacion.json AUDIO=/datos/x/x.mp3 CONDICION=minimo node tests/test_reproductor.js 2200
// Sirve el repositorio por HTTP, carga la obra en modo experimento y verifica:
// ecuaciones del mapeo, sincronización de los cambios de segmento, fps y bloqueo de pausa.
const http = require("http");
const fs = require("fs");
const path = require("path");
const assert = require("assert");
const { chromium } = require("playwright");

const RAIZ = path.resolve(__dirname, "..");
const SEGUNDOS = Number(process.argv[2] || 45);
const ANOTACION = process.env.ANOTACION || "/ejemplos/demo/demo.json";
const AUDIO = process.env.AUDIO || "/ejemplos/demo/demo.wav";
const CONDICION = process.env.CONDICION || "minimo";
const SALIDA = path.join(RAIZ, path.dirname(ANOTACION));
const TIPOS = { ".html": "text/html", ".json": "application/json", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".js": "text/javascript" };

const servidor = http.createServer((req, res) => {
  const p = path.join(RAIZ, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!p.startsWith(RAIZ) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  const datos = fs.readFileSync(p);
  const rango = req.headers.range && /bytes=(\d+)-(\d*)/.exec(req.headers.range);
  const tipo = TIPOS[path.extname(p)] || "application/octet-stream";
  if (rango) {
    const a = +rango[1], b = rango[2] ? +rango[2] : datos.length - 1;
    res.writeHead(206, { "Content-Type": tipo, "Content-Range": `bytes ${a}-${b}/${datos.length}`, "Accept-Ranges": "bytes", "Content-Length": b - a + 1 });
    return res.end(datos.subarray(a, b + 1));
  }
  res.writeHead(200, { "Content-Type": tipo, "Accept-Ranges": "bytes", "Content-Length": datos.length });
  res.end(datos);
});

(async () => {
  await new Promise((r) => servidor.listen(0, r));
  const puerto = servidor.address().port;
  const navegador = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const pagina = await navegador.newPage({ viewport: { width: 800, height: 450 } });
  const errores = [];
  pagina.on("pageerror", (e) => errores.push(e.message));

  const url = `http://localhost:${puerto}/reproductor/index.html?anotacion=${ANOTACION}&audio=${AUDIO}&condicion=${CONDICION}&modo=experimento&pantallaCompleta=0&participante=TEST`;
  await pagina.goto(url);

  // Ecuaciones (1)-(5) y búsqueda binaria.
  const unit = await pagina.evaluate(() => {
    const A = window.Ambientacion, p = A.PERFILES.minimo;
    const o = A.objetivo(p, 210, 1, 1), o0 = A.objetivo(p, 350, 1, 0);
    let c = { H: 0, S: 0, L: 0 };
    c = A.suavizar(c, { H: 0, S: 1, L: 1 }, p.tau, p.tau); // tras τ: 1 - e^-1
    const segs = [{ inicio: 0 }, { inicio: 20 }, { inicio: 40 }];
    return { o, o0, c, L: A.luminosidadMostrada(0.3, 0.02, 1),
      b: [A.segmentoActivo(segs, -1), A.segmentoActivo(segs, 0), A.segmentoActivo(segs, 19.9), A.segmentoActivo(segs, 20), A.segmentoActivo(segs, 99)],
      hueWrap: A.suavizar({ H: 350, S: 0, L: 0 }, { H: 10, S: 0, L: 0 }, 1e9, 1).H };
  });
  assert.deepStrictEqual(unit.o, { H: 230, S: 0.45, L: 0.35 });
  assert.ok(Math.abs(unit.o0.H - 10) < 1e-9 && unit.o0.S === 0.2 && unit.o0.L === 0.15);
  assert.ok(Math.abs(unit.c.S - (1 - Math.exp(-1))) < 1e-9);
  assert.ok(Math.abs(unit.L - 0.32) < 1e-9);
  assert.deepStrictEqual(unit.b, [-1, 0, 0, 1, 2]);
  assert.ok(Math.abs(unit.hueWrap - 10) < 1e-6, "el matiz debe tomar el camino corto");

  await pagina.click("#comenzar");
  await pagina.waitForFunction(() => document.getElementById("config").style.display === "none");
  await pagina.waitForTimeout(3000);
  // Intento de pausa: debe reanudarse sola.
  await pagina.evaluate(() => document.getElementById("audio").pause());
  await pagina.waitForTimeout(500);
  const sigue = await pagina.evaluate(() => !document.getElementById("audio").paused);
  assert.ok(sigue, "en modo experimento no se puede pausar");

  await pagina.waitForTimeout(SEGUNDOS * 1000 - 3500);
  await pagina.screenshot({ path: path.join(SALIDA, `captura_${CONDICION}.png`) });
  const reg = await pagina.evaluate(() => window.registroCompleto());
  fs.writeFileSync(path.join(SALIDA, `registro_test_${CONDICION}.json`), JSON.stringify(reg, null, 2));

  console.log(JSON.stringify(reg.resumen, null, 2));
  console.log("cambios:", reg.cambios.map((c) => `${c.segmento}@${c.desfase_s}s`).join(" "));
  console.log("eventos:", reg.eventos.map((e) => e.tipo).join(", "));
  assert.deepStrictEqual(errores, []);
  const alcanzados = await pagina.evaluate(() => sesion.doc.segmentos.filter((s) => s.inicio <= document.getElementById("audio").currentTime).length);
  assert.strictEqual(new Set(reg.cambios.map((c) => c.segmento)).size, alcanzados, "debe registrar un cambio por cada segmento alcanzado");
  assert.ok(reg.resumen.desfase_max_s < 0.1, "desfase mayor a 100 ms");
  assert.ok(reg.eventos.some((e) => e.tipo === "pausa_no_permitida"));
  await navegador.close();
  servidor.close();
  console.log("OK");
})().catch((e) => { console.error(e); process.exit(1); });
