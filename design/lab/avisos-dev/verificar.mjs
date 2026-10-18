// Banco de #636 (api.md «Avisos de desarrollo»): comprueba R1 a R3 sobre el `dist/` REAL de @grana/vue.
//
//   R1  build de producción minificado de una aplicación (Vite/esbuild y webpack 5/terser): ningún texto «[Grana»
//       ni frases de aviso, con el principal y con todas las entradas publicadas (salvo `testing`).
//   R2  desarrollo de la aplicación en el navegador (Vite con y sin preempaquetar, webpack development): los avisos salen.
//   R3  ESM sin empaquetar (importmap para vue) y UMD desde <script>: sin error (el UMD no avisa: no hay `process`).
//   R4  (Vitest ve los avisos) lo cubren las pruebas de packages/vue; aquí no se mide.
//
// Además mide lo que paga la aplicación en producción por importar TODO el principal (JS gzip del build de Vite).
//
// Uso (desde la raíz del repo, con `npm run build` hecho):
//   npm install --prefix design/lab/avisos-dev      # una vez: vite, webpack 5 y vue solo para el banco
//   node design/lab/avisos-dev/verificar.mjs [--dist <carpeta dist>]   # por defecto packages/vue/dist
// Puertos propios: 5393 y 5394 (Vite dev), 5395 (estático). Sale con código 1 si falla R1, R2 o R3.
import { spawn, execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'
import { gzipSync } from 'node:zlib'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '../../..')
const argDist = process.argv.indexOf('--dist')
const DIST = argDist > 0 ? resolve(process.argv[argDist + 1]) : join(ROOT, 'packages/vue/dist')
const OUT = join(HERE, 'out')
const PORTS = { prebundled: 5393, source: 5394, static: 5395 }
const { chromium } = createRequire(join(ROOT, 'package.json'))('playwright')

if (!existsSync(join(HERE, 'node_modules/webpack')) || !existsSync(join(HERE, 'node_modules/vite'))) {
  console.error('Falta instalar el banco: npm install --prefix design/lab/avisos-dev')
  process.exit(2)
}
if (!existsSync(join(DIST, 'grana.js'))) {
  console.error(`No hay ${join(DIST, 'grana.js')}: ejecuta npm run build.`)
  process.exit(2)
}

// ---------- @grana/vue «instalado»: copia de package.json + dist en node_modules (npm no reinstala un file: de la misma versión)
const PKG = join(HERE, 'node_modules/@grana/vue')
rmSync(PKG, { recursive: true, force: true })
mkdirSync(PKG, { recursive: true })
cpSync(join(ROOT, 'packages/vue/package.json'), join(PKG, 'package.json'))
cpSync(DIST, join(PKG, 'dist'), { recursive: true })
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })
for (const c of ['.vite', '.vite-pre', '.vite-src']) rmSync(join(HERE, 'node_modules', c), { recursive: true, force: true })

const bin = (name) => join(HERE, 'node_modules/.bin', name)
// Cada build en su proceso y sin NODE_ENV heredado: `vite build` deja NODE_ENV=production en el proceso que lo llama
const env = { ...process.env }
delete env.NODE_ENV
const sh = (cmd, args) => execFileSync(cmd, args, { cwd: HERE, env, stdio: ['ignore', 'ignore', 'inherit'] })

// ---------- Builds
sh(bin('vite'), ['build', 'app', '--outDir', '../out/vite-prod', '--emptyOutDir', '--base', './', '--logLevel', 'silent'])
sh(bin('webpack'), ['--mode', 'production', '--config', 'webpack.config.cjs'])
sh(bin('webpack'), ['--mode', 'development', '--config', 'webpack.config.cjs'])
// Todas las entradas (speech, status, combobox…), solo para R1
sh(bin('vite'), ['build', 'app-todas', '--outDir', '../out/vite-prod-todas', '--emptyOutDir', '--base', './', '--logLevel', 'silent'])
sh(bin('webpack'), ['--mode', 'production', '--config', 'webpack.config.cjs', '--env', 'todas'])
for (const m of ['production', 'development']) writeFileSync(join(OUT, `wp-${m}/index.html`), '<!doctype html><meta charset="utf-8"><div id="app"></div><script src="main.js"></script>')

// ESM sin empaquetar: el dist tal cual + vue.esm-browser por importmap
const U = join(OUT, 'unbundled')
cpSync(DIST, join(U, 'grana'), { recursive: true })
cpSync(join(HERE, 'node_modules/vue/dist/vue.esm-browser.js'), join(U, 'vue.js'))
cpSync(join(HERE, 'app/run.js'), join(U, 'run.js'))
writeFileSync(join(U, 'index.html'), `<!doctype html><meta charset="utf-8"><div id="app"></div>
<script type="importmap">{ "imports": { "vue": "./vue.js" } }</script>
<script type="module">
import { createApp, h } from 'vue'
import * as Grana from './grana/grana.js'
import { run } from './run.js'
run(createApp, h, Grana)
</script>`)

// UMD desde <script>, como desde un CDN
const M = join(OUT, 'umd')
mkdirSync(M, { recursive: true })
cpSync(join(DIST, 'grana.umd.js'), join(M, 'grana.umd.js'))
cpSync(join(HERE, 'node_modules/vue/dist/vue.global.js'), join(M, 'vue.global.js'))
writeFileSync(join(M, 'run.js'), readFileSync(join(HERE, 'app/run.js'), 'utf8').replace('export function run', 'window.run = function run'))
writeFileSync(join(M, 'index.html'), `<!doctype html><meta charset="utf-8"><div id="app"></div>
<script src="vue.global.js"></script><script src="grana.umd.js"></script><script src="run.js"></script>
<script>run(Vue.createApp, Vue.h, window.Grana)</script>`)

// ---------- R1: textos en producción
const jsOf = (dir) => readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(dir, f)))
const PHRASES = ['[Grana', 'necesita `closeLabel`', 'necesita caption', 'falta labels.', 'se ignora', 'debe ser', 'no existe']
const left = (dir) => { const t = jsOf(dir).map(String).join('\n'); return PHRASES.filter((p) => t.includes(p)) }
const gz = (dir) => jsOf(dir).reduce((s, b) => s + gzipSync(b).length, 0)
// Además, todos los textos que el código fuente escribe DENTRO de la guarda (fragmentos de ≥ 24 caracteres): ninguno
// puede quedar en el JS de producción de la aplicación
const rootReq = createRequire(join(ROOT, 'package.json'))
const { parse: parseSfc, babelParse } = rootReq('vue/compiler-sfc')
const guardedTexts = (() => {
  const SRC = join(ROOT, 'packages/vue/src')
  const set = new Set()
  const walk = (n, fn, anc = []) => {
    if (!n || typeof n.type !== 'string') return
    fn(n, anc)
    for (const k of Object.keys(n)) {
      if (k === 'loc' || k.endsWith('Comments') || k === 'extra') continue
      const v = n[k]
      if (Array.isArray(v)) v.forEach((c) => walk(c, fn, [...anc, n]))
      else if (v && typeof v.type === 'string') walk(v, fn, [...anc, n])
    }
  }
  const isG = (n) => n && n.type === 'BinaryExpression' && n.left.type === 'MemberExpression' && n.left.property.name === 'NODE_ENV' && n.right.value === 'production'
  const head = (n) => (n.type === 'LogicalExpression' && n.operator === '&&' ? head(n.left) : n)
  for (const f of readdirSync(SRC, { recursive: true }).filter((f) => /\.(js|vue)$/.test(f) && !f.endsWith('.test.js'))) {
    const code = readFileSync(join(SRC, f), 'utf8')
    const parts = f.endsWith('.vue') ? (() => { const { descriptor: d } = parseSfc(code); return [d.script, d.scriptSetup].filter(Boolean).map((b) => b.content) })() : [code]
    for (const c of parts) {
      walk(babelParse(c, { sourceType: 'module', plugins: ['jsx'] }).program, (n, anc) => {
        const v = n.type === 'StringLiteral' ? n.value : n.type === 'TemplateElement' ? n.value.cooked : null
        if (!v || v.trim().length < 24) return
        const chain = [...anc, n]
        if (chain.some((a, i) => a.type === 'IfStatement' && isG(head(a.test)) && chain[i + 1] === a.consequent)) set.add(v.trim())
      })
    }
  }
  return [...set]
})()
const leftGuarded = (dir) => { const t = jsOf(dir).map(String).join('\n'); return guardedTexts.filter((x) => t.includes(x) || t.includes(JSON.stringify(x).slice(1, -1))) }
const prod = { vite: left(join(OUT, 'vite-prod')), webpack: left(join(OUT, 'wp-production')), viteAll: left(join(OUT, 'vite-prod-todas')), webpackAll: left(join(OUT, 'wp-todas-production')) }

// ---------- Servidores
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' }
const statik = http.createServer((q, r) => {
  const f = join(OUT, decodeURIComponent(q.url.split('?')[0]))
  try { r.setHeader('content-type', types[f.slice(f.lastIndexOf('.'))] || 'application/octet-stream'); r.end(readFileSync(f)) } catch { r.statusCode = 404; r.end() }
}).listen(PORTS.static)
const viteDev = (port, prebundle) => new Promise((ok, ko) => {
  const code = `import { createServer } from 'vite'
const s = await createServer({ root: 'app', configFile: false, logLevel: 'silent', server: { port: ${port}, strictPort: true },
  cacheDir: '../node_modules/.vite-${prebundle ? 'pre' : 'src'}',
  optimizeDeps: ${prebundle ? "{ include: ['vue', '@grana/vue'], force: true }" : "{ exclude: ['@grana/vue'] }"} })
await s.listen(); console.log('ready')`
  const p = spawn(process.execPath, ['--input-type=module', '-e', code], { cwd: HERE, env, stdio: ['ignore', 'pipe', 'inherit'] })
  p.stdout.on('data', (d) => { if (String(d).includes('ready')) ok(p) })
  p.on('exit', (c) => ko(new Error(`vite dev ${port} salió con ${c}`)))
})
const servers = [await viteDev(PORTS.prebundled, true), await viteDev(PORTS.source, false)]

// ---------- Navegador
const browser = await chromium.launch()
const visit = async (url) => {
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(url)
  // Vite dev puede recargar una vez al optimizar dependencias: se espera de nuevo si el contexto se destruye
  for (let i = 0; ; i++) {
    try { await page.waitForFunction(() => document.title === 'done', null, { timeout: 30000 }); break } catch (e) {
      if (i < 2 && /context|navigat/i.test(e.message)) continue
      errors.push('sin terminar'); break
    }
  }
  const out = (await page.evaluate(() => window.__out || [])) || []
  await page.close()
  const thrown = out.filter((m) => m.startsWith('THROW')).map((m) => m.slice(6))
  return { warns: out.filter((m) => !m.startsWith('THROW')), errors: [...errors, ...thrown] }
}
const S = `http://localhost:${PORTS.static}`
const runs = {
  viteDevPre: await visit(`http://localhost:${PORTS.prebundled}/`),
  viteDevSrc: await visit(`http://localhost:${PORTS.source}/`),
  viteProd: await visit(`${S}/vite-prod/index.html`),
  wpDev: await visit(`${S}/wp-development/index.html`),
  wpProd: await visit(`${S}/wp-production/index.html`),
  unbundled: await visit(`${S}/unbundled/index.html`),
  umd: await visit(`${S}/umd/index.html`)
}
await browser.close()
statik.close()
servers.forEach((p) => p.kill())

// ---------- Resultado
const KNOWN = ['closeLabel', 'GTable> necesita caption']
const sees = (r) => KNOWN.every((k) => r.warns.some((w) => w.includes(k)))
const rows = [
  ['R1', 'Vite producción: textos de aviso en el JS', prod.vite.length === 0, prod.vite.join(', ') || 'ninguno'],
  ['R1', 'webpack 5 producción: textos de aviso en el JS', prod.webpack.length === 0, prod.webpack.join(', ') || 'ninguno'],
  ['R1', 'Vite producción, todas las entradas: textos de aviso', prod.viteAll.length === 0, prod.viteAll.join(', ') || 'ninguno'],
  ['R1', 'webpack 5 producción, todas las entradas: textos', prod.webpackAll.length === 0, prod.webpackAll.join(', ') || 'ninguno'],
  ['R1', `Vite, todas: textos guardados en el fuente (${guardedTexts.length})`, (prod.viteAllG = leftGuarded(join(OUT, 'vite-prod-todas'))).length === 0, prod.viteAllG.length ? `${prod.viteAllG.length}: «${prod.viteAllG[0].slice(0, 60)}»…` : 'ninguno'],
  ['R1', `webpack 5, todas: textos guardados en el fuente (${guardedTexts.length})`, (prod.wpAllG = leftGuarded(join(OUT, 'wp-todas-production'))).length === 0, prod.wpAllG.length ? `${prod.wpAllG.length}: «${prod.wpAllG[0].slice(0, 60)}»…` : 'ninguno'],
  ['R1', 'Vite producción en el navegador: avisos emitidos', runs.viteProd.warns.length === 0 && !runs.viteProd.errors.length, `${runs.viteProd.warns.length}${runs.viteProd.errors.length ? ' · error: ' + runs.viteProd.errors.join('; ') : ''}`],
  ['R1', 'webpack 5 producción en el navegador: avisos emitidos', runs.wpProd.warns.length === 0 && !runs.wpProd.errors.length, `${runs.wpProd.warns.length}${runs.wpProd.errors.length ? ' · error: ' + runs.wpProd.errors.join('; ') : ''}`],
  ['R2', 'Vite dev, dependencia preempaquetada', sees(runs.viteDevPre) && !runs.viteDevPre.errors.length, `${runs.viteDevPre.warns.length} avisos${runs.viteDevPre.errors.length ? ' · error: ' + runs.viteDevPre.errors.join('; ') : ''}`],
  ['R2', 'Vite dev, sin preempaquetar (exclude)', sees(runs.viteDevSrc) && !runs.viteDevSrc.errors.length, `${runs.viteDevSrc.warns.length} avisos${runs.viteDevSrc.errors.length ? ' · error: ' + runs.viteDevSrc.errors.join('; ') : ''}`],
  ['R2', 'webpack 5 development', sees(runs.wpDev) && !runs.wpDev.errors.length, `${runs.wpDev.warns.length} avisos${runs.wpDev.errors.length ? ' · error: ' + runs.wpDev.errors.join('; ') : ''}`],
  ['R3', 'ESM sin empaquetar (importmap): sin error', !runs.unbundled.errors.length, `${runs.unbundled.warns.length} avisos${runs.unbundled.errors.length ? ' · error: ' + runs.unbundled.errors.join('; ') : ''}`],
  ['R3', 'UMD desde <script>: sin error', !runs.umd.errors.length, `${runs.umd.warns.length} avisos${runs.umd.errors.length ? ' · error: ' + runs.umd.errors.join('; ') : ''}`]
]
console.log(`dist: ${DIST}`)
for (const [r, label, ok, detail] of rows) console.log(`${ok ? 'pasa' : 'FALLA'}  ${r}  ${label.padEnd(52)} ${detail}`)
console.log(`Peso en producción (todo el principal + vue, JS gzip): Vite ${gz(join(OUT, 'vite-prod'))} B · webpack ${gz(join(OUT, 'wp-production'))} B`)
const failed = rows.filter((x) => !x[2]).length
console.log(failed ? `${failed} comprobaciones fallan` : `${rows.length}/${rows.length} comprobaciones pasan`)
process.exit(failed ? 1 : 0)
