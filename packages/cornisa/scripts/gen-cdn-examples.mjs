// Genera examples/cdn/01..04 con los hashes SRI reales de dist/sri.json. Ejecutar tras `npm run build`.
import { readFileSync, writeFileSync } from 'node:fs';
const sri = JSON.parse(readFileSync('dist/sri.json', 'utf8'));
const V = sri.version, H = sri.files;
const head = (title) => `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>cornisa · ${title}</title>
<link rel="stylesheet" href="ejemplos.css">
<script src="cdn-config.js"></script>`;
const nav = `<nav><a href="index.html">← Índice</a></nav>`;
const demoButtons = `<div class="acciones">
    <button type="button" id="b-aviso">Aviso breve</button>
    <button type="button" id="b-progreso">Subida con progreso</button>
    <button type="button" id="b-deshacer">Archivar (con Deshacer)</button>
  </div>`;
const demoJs = `
    const island = Cornisa.createIsland({ labels: { close: 'Cerrar', more: (n) => \`Mostrar la siguiente (\${n} en espera)\` } });
    document.getElementById('b-aviso').onclick = () => island.show({ title: 'Cambios guardados', intent: 'success' });
    document.getElementById('b-progreso').onclick = async () => {
      const h = island.show({ title: 'Subiendo informe.pdf', progress: 0, duration: 'persistent' });
      for (let p = 10; p <= 100; p += 10) { await new Promise((r) => setTimeout(r, 200)); h.update({ progress: p }); }
      h.update({ title: 'Informe subido', intent: 'success', progress: null, duration: 5000 });
    };
    document.getElementById('b-deshacer').onclick = () => island.show({ title: 'Conversación archivada', duration: 'persistent',
      actions: [{ label: 'Deshacer', onSelect: (h) => { h.dismiss('undo'); island.show({ title: 'Archivado deshecho', intent: 'success' }); } }] });
    window.island = island;`;

/* 01 · script clásico con SRI */
writeFileSync('examples/cdn/01-script-clasico.html', `${head('script clásico (CDN)')}
<!-- 1) CSS desde el CDN con SRI; si falla, la copia local -->
<link rel="stylesheet" id="cornisa-css"
      href="https://cdn.jsdelivr.net/npm/cornisa@${V}/dist/cornisa.min.css"
      integrity="${H['cornisa.min.css']}" crossorigin="anonymous"
      onerror="cornisaCssFallback(this)">
</head>
<body>
<header><strong>cornisa</strong> · 01 · script clásico</header>
<main>
  ${nav}
  <h1>Script clásico desde CDN</h1>
  <p><span id="origen">Cargando…</span></p>
<pre>&lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cornisa@${V}/dist/cornisa.min.css"
      integrity="${H['cornisa.min.css']}" crossorigin="anonymous"&gt;
&lt;script src="https://cdn.jsdelivr.net/npm/cornisa@${V}/dist/cornisa.iife.min.js"
        integrity="${H['cornisa.iife.min.js']}" crossorigin="anonymous"&gt;&lt;/script&gt;
&lt;script&gt;
  const island = Cornisa.createIsland();
  island.show({ title: 'Cambios guardados', intent: 'success' });
&lt;/script&gt;</pre>
  ${demoButtons}
</main>
<!-- 2) JS desde el CDN con SRI; si falla (hoy: 404), carga la copia local y continúa -->
<script>
  (function () {
    function start(origin) { window.cornisaOrigin(origin); init(); }
    function init() {${demoJs}
      window.ready = true;
    }
    var s = document.createElement('script');
    s.src = CORNISA_CDN.base + 'cornisa.iife.min.js';
    s.integrity = '${H['cornisa.iife.min.js']}';
    s.crossOrigin = 'anonymous';
    s.onload = function () { start('cdn'); };
    s.onerror = function () {
      var l = document.createElement('script');
      l.src = CORNISA_CDN.local + 'cornisa.iife.min.js';
      l.onload = function () { start('local'); };
      document.head.appendChild(l);
    };
    document.head.appendChild(s);
  })();
</script>
</body>
</html>
`);

/* 02 · módulo ESM */
writeFileSync('examples/cdn/02-modulo-esm.html', `${head('módulo ESM (CDN)')}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cornisa@${V}/dist/cornisa.min.css" crossorigin="anonymous"
      onerror="cornisaCssFallback(this)">
</head>
<body>
<header><strong>cornisa</strong> · 02 · módulo ESM</header>
<main>
  ${nav}
  <h1>Módulo ESM desde CDN</h1>
  <p><span id="origen">Cargando…</span></p>
<pre>&lt;script type="module"&gt;
  import { createIsland } from 'https://cdn.jsdelivr.net/npm/cornisa@${V}/dist/cornisa.esm.min.js';
  const island = createIsland();
  island.show({ title: 'Cambios guardados', intent: 'success' });
&lt;/script&gt;</pre>
  ${demoButtons}
</main>
<script type="module">
  let Cornisa, origin = 'cdn';
  try { Cornisa = await import(CORNISA_CDN.base + 'cornisa.esm.min.js'); }
  catch {
    try { Cornisa = await import(CORNISA_CDN.local + 'cornisa.esm.min.js'); origin = 'local'; }
    catch { Cornisa = await window.cornisaClassicFallback(); origin = 'local-script'; }   // p. ej. abierto como file://
  }
  window.cornisaOrigin(origin);${demoJs}
  window.ready = true;
</script>
</body>
</html>
`);

/* 03 · import map */
writeFileSync('examples/cdn/03-import-map.html', `${head('import map (CDN)')}
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/cornisa@${V}/dist/cornisa.min.css" crossorigin="anonymous"
      onerror="cornisaCssFallback(this)">
<script type="importmap">
{ "imports": {
    "cornisa": "https://cdn.jsdelivr.net/npm/cornisa@${V}/dist/cornisa.esm.min.js",
    "cornisa-local": "../../dist/cornisa.esm.min.js"
} }
</script>
</head>
<body>
<header><strong>cornisa</strong> · 03 · import map</header>
<main>
  ${nav}
  <h1>Import map: <code>import … from "cornisa"</code></h1>
  <p><span id="origen">Cargando…</span></p>
<pre>&lt;script type="importmap"&gt;
{ "imports": { "cornisa": "https://cdn.jsdelivr.net/npm/cornisa@${V}/dist/cornisa.esm.min.js" } }
&lt;/script&gt;
&lt;script type="module"&gt;
  import { createIsland } from 'cornisa';
  createIsland().show({ title: 'Cambios guardados', intent: 'success' });
&lt;/script&gt;</pre>
  <p>Import maps: Chrome/Edge ≥ 89, Firefox ≥ 108, Safari ≥ 16.4 (más exigente que el suelo de la librería).</p>
  ${demoButtons}
</main>
<script type="module">
  let Cornisa, origin = 'cdn';
  try { Cornisa = await import('cornisa'); }
  catch {
    try { Cornisa = await import('cornisa-local'); origin = 'local'; }
    catch { Cornisa = await window.cornisaClassicFallback(); origin = 'local-script'; }   // p. ej. abierto como file://
  }
  window.cornisaOrigin(origin);${demoJs}
  window.ready = true;
</script>
</body>
</html>
`);
console.log('ejemplos 01–03 generados para', V);
