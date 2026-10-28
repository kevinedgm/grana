// coco · GSplit: la regla con un tema distinto del por defecto (space 5 px y cuerpo de 17 px): cambian los umbrales, no la regla.
//   GRANA_PW_PORT=4219 node design/lab/split/estilo-tema.mjs
// Umbral esperado = max(5 × k, 17 × k / 4) × (a + b) / min(a, b) + 5 × 6 × factor. Además: GSplit.css sin literales ni respaldos.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' }
const srv = http.createServer(async (q, r) => { try { const p = normalize(join(ROOT, decodeURIComponent(new URL(q.url, 'http://x').pathname))); const d = await readFile(p); r.writeHead(200, { 'content-type': T[extname(p)] || 'application/octet-stream' }).end(d) } catch { r.writeHead(404).end() } })
const PORT = Number(process.env.GRANA_PW_PORT || 4219)
await new Promise((r) => srv.listen(PORT, '127.0.0.1', r))
const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
let total = 0; const fails = []
const ok = (c, m) => { total++; if (!c) fails.push(m) }

const css = await readFile(ROOT + 'packages/vue/src/components/GSplit/GSplit.css', 'utf8')
const code = css.replace(/\/\*[\s\S]*?\*\//g, '')
ok(!/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(|oklch\(/.test(code), 'sin colores literales')
ok(!/var\([^)]*,/.test(code), 'sin valores de respaldo en var()')
ok(!/@media|@container|!important|container-type|\bcqi\b/.test(code), 'sin consultas, contención ni !important')
ok((code.match(/\b\d+(\.\d+)?(px|rem|em|ch|vw|vh)\b/g) || []).length === 0, 'sin medidas literales')
ok(/^@layer grana\.defaults, grana\.components, grana\.blocks, grana\.utilities;/.test(css), 'primera línea: las cuatro capas')

const RATIO = { '1-1': [1, 1], '3-2': [3, 2], '2-1': [2, 1], '2-3': [2, 3], '1-2': [1, 2] }
const K = { sm: 64, md: 80, lg: 96 }
const GF = { none: 0, sm: 0.5, md: 1, lg: 2 }
for (const b of ['chromium', 'firefox', 'webkit']) {
  const br = await pw[b].launch()
  const p = await (await br.newContext({ viewport: { width: 1600, height: 800 } })).newPage()
  await p.goto(`http://127.0.0.1:${PORT}/packages/vue/dist/grana.css`)
  await p.setContent('<!doctype html><html><head></head><body></body></html>')
  await p.addStyleTag({ url: `http://127.0.0.1:${PORT}/packages/vue/src/components/GSplit/GSplit.css` })
  await p.addStyleTag({ content: ':root{--g-space-1:5px;--g-text-body-size:17px} body{margin:0;font-size:17px}' })
  for (const [r, [a, bb]] of Object.entries(RATIO)) for (const c of Object.keys(K)) for (const g of ['md', 'lg']) {
    const t = Math.max(5 * K[c], 17 * K[c] / 4) * (a + bb) / Math.min(a, bb) + 30 * GF[g]
    const side = await p.evaluate(({ r, c, g, w }) => {
      document.body.innerHTML = `<div style="inline-size:${w}px"><div class="g-split g-split--ratio-${r} g-split--collapse-${c} g-split--gap-${g}"><div class="g-split__region g-split__region--start">a</div><div class="g-split__region g-split__region--end">b</div></div></div>`
      const [x, y] = [...document.querySelectorAll('.g-split__region')].map((e) => e.getBoundingClientRect())
      return Math.abs(x.top - y.top) < 1
    }, { r, c, g, w: Math.ceil(t) - 1 })
    const side2 = await p.evaluate(({ r, c, g, w }) => {
      document.body.innerHTML = `<div style="inline-size:${w}px"><div class="g-split g-split--ratio-${r} g-split--collapse-${c} g-split--gap-${g}"><div class="g-split__region g-split__region--start">a</div><div class="g-split__region g-split__region--end">b</div></div></div>`
      const [x, y] = [...document.querySelectorAll('.g-split__region')].map((e) => e.getBoundingClientRect())
      return Math.abs(x.top - y.top) < 1
    }, { r, c, g, w: Math.ceil(t) })
    ok(!side && side2, `${b} ${r} ${c} ${g}: umbral ${t} (apila a ${Math.ceil(t) - 1}: ${!side}, al lado a ${Math.ceil(t)}: ${side2})`)
  }
  await br.close()
}
srv.close()
console.log(`${total - fails.length}/${total} pasan`)
for (const f of fails) console.log('FALLO ' + f)
process.exit(fails.length ? 1 : 0)
