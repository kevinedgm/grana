// Verificación de coco del lote de correcciones de la integración real (NisaNabani), sobre los COMPONENTES REALES (dist/).
// Decisiones #560 a #564. Sin marcado inyectado: cada página monta los componentes de dist/ con Vue y los temas se generan
// con el CLI real (packages/cli/bin/grana.mjs) en una carpeta temporal.
//   H1  #564  hover del item actual de GSidebar (también con tema de activo oscuro, claro y oscuro)
//   H3  #562  contención: re-ejecuta design/lab/contencion/verificar.mjs + GInput en GFormRow y GAdaptiveLayout (A/B sin
//             contain-intrinsic-inline-size: idéntico) + GCalendar a 320 px sin desbordamiento horizontal
//   H13 #560  aviso de categoría sin token de GAvatar y GTag en navegador real (hereda de :root, de un ancestro, o no)
//   H20 #561  cambio de tema en caliente con prefers-color-scheme: dark emulado (dark true/false en las cuatro parejas)
// Ejecutar desde la raíz del repo con dist/ reconstruido:  node design/lab/integracion-real/auditoria-verificar.mjs
// Opcional: --engines=chromium  --port=4235  --verbose  --skip-contencion
import http from 'node:http'
import { readFile, mkdtemp, writeFile, rm, cp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const PORT = Number(args.port || 4235)
const DIST = 'packages/vue/dist'

const tmp = await mkdtemp(join(tmpdir(), 'grana-integ-'))
// ---- instantánea de dist/ ------------------------------------------------------------------------------------------------
// Varios agentes reconstruyen dist/ a la vez (npm run build lo vacía por pasos): se espera a que esté completo y se sirve
// una copia, para que una reconstrucción a mitad de la pasada no dé 404 en masa.
const NEED = ['grana.umd.js', 'grana.css', 'fonts.css', 'tag.umd.js']
const waitDist = async () => {
  for (let i = 0; i < 40; i++) {
    if (NEED.every((f) => existsSync(join(ROOT, 'packages/vue/dist', f)))) {
      try { await cp(join(ROOT, 'packages/vue/dist'), join(tmp, 'dist'), { recursive: true }); if (NEED.every((f) => existsSync(join(tmp, 'dist', f)))) return true } catch {}
    }
    await new Promise((r) => setTimeout(r, 5000))
  }
  return false
}
const SNAP_OK = await waitDist()

// ---- temas con el CLI real -------------------------------------------------------------------------------------------
const THEMES = {
  t0: { brand: '#24366B', accent: '#C1D324' },                         // marca oscura = activo oscuro; sin categorías
  t8: { brand: '#24366B', accent: '#C1D324', categories: 8 },          // con 8 categorías en :root
  A_false: { brand: '#B3261E', accent: '#C1D324', dark: false },
  B_false: { brand: '#0B6E4F', accent: '#C1D324', dark: false },
  A_true: { brand: '#B3261E', accent: '#C1D324', dark: true },
  B_true: { brand: '#0B6E4F', accent: '#C1D324', dark: true }
}
const css = {}
for (const [name, cfg] of Object.entries(THEMES)) {
  await writeFile(join(tmp, `${name}.json`), JSON.stringify(cfg))
  const r = spawnSync('node', [join(ROOT, 'packages/cli/bin/grana.mjs'), 'theme', join(tmp, `${name}.json`), '--out', join(tmp, `${name}.css`)], { encoding: 'utf8' })
  if (r.status !== 0) { console.error(`El CLI falló con ${name}:\n${r.stdout}${r.stderr}`); process.exit(2) }
  css[name] = await readFile(join(tmp, `${name}.css`), 'utf8')
}
// control negativo de H20: el selector de antes de #561 (especificidad 0,2,0)
css.A_true_old = css.A_true.replace(':root:where(:not([data-theme="light"]))', ':root:not([data-theme="light"])')

// ---- servidor --------------------------------------------------------------------------------------------------------
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x')
    if (u.pathname.startsWith('/__t/')) return void res.writeHead(200, { 'content-type': 'text/css' }).end(css[u.pathname.slice(5).replace(/\.css$/, '')] ?? '')
    let p = normalize(join(ROOT, decodeURIComponent(u.pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    if (p.startsWith(join(ROOT, DIST) + '/')) p = join(tmp, 'dist', p.slice(join(ROOT, DIST).length + 1))
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r, j) => { server.once('error', j); server.listen(PORT, '127.0.0.1', r) })
const BASE = `http://127.0.0.1:${PORT}`
const SCRIPTS = (extra = []) => ['node_modules/vue/dist/vue.global.prod.js', `${DIST}/grana.umd.js`, ...extra].map((s) => `<script src="/${s}"></script>`).join('')
const pageHtml = ({ themes = [], body = '', setup = '', extra = [], style = '' }) => `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="/${DIST}/fonts.css"><link rel="stylesheet" href="/${DIST}/grana.css">
${themes.map((t) => `<link rel="stylesheet" href="/__t/${t}.css">`).join('')}
<style>*{box-sizing:border-box}body{margin:0;padding:16px;background:var(--g-color-bg);color:var(--g-color-text);font-family:var(--g-font-ui)}${style}</style></head>
<body><div id="app">${body}</div>${SCRIPTS(extra)}<script>${setup}</script></body></html>`
const pages = new Map()
const serve = (id, html) => { pages.set(id, html) }
const origHandler = server.listeners('request')[0]
server.removeAllListeners('request')
server.on('request', (req, res) => {
  const u = new URL(req.url, 'http://x')
  if (u.pathname.startsWith('/__p/')) return void res.writeHead(200, { 'content-type': TYPES['.html'] }).end(pages.get(u.pathname.slice(5)) ?? '')
  origHandler(req, res)
})

let total = 0, failed = 0
const fails = []
const notes = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const note = (s) => { notes.push(s) }

// helpers que corren dentro de la página
const PAGE_LIB = `
window.__col = (s) => { const m = /^(rgba?|color)\\((.+)\\)$/.exec(String(s).trim()); if (!m) return null
  let v = m[2].replace('/', ' ').split(/[ ,]+/).filter(Boolean); if (m[1] === 'color') { if (v[0] !== 'srgb') return null; v = v.slice(1).map((x, i) => i < 3 ? +x * 255 : +x) }
  else v = v.map(Number); return { r: v[0], g: v[1], b: v[2], a: v[3] === undefined ? 1 : v[3] } }
window.__over = (top, bottom) => { const a = top.a + bottom.a * (1 - top.a); return { r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a, g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a, b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a, a } }
window.__lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4) }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b) }
window.__cr = (a, b) => { const x = __lum(a), y = __lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
window.__effBg = (el, upTo) => { const layers = []; for (let e = el; e; e = e.parentElement) { const c = __col(getComputedStyle(e).backgroundColor); if (c && c.a > 0) layers.push(c); if (e === upTo) break }
  let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = layers.length - 1; i >= 0; i--) base = __over(layers[i], base); return base }
`

// ============================================================================================================================
// H1 · GSidebar
// ============================================================================================================================
const SB_ITEMS = `[
 { label: 'Principal', items: [{ id: 'home', label: 'Inicio', href: '#home', icon: 'house' }, { id: 'inbox', label: 'Bandeja', href: '#inbox', icon: 'inbox' }, { id: 'msg', label: 'Mensajes', href: '#msg', icon: 'message-circle' }] },
 { label: 'Espacio', items: [{ id: 'proj', label: 'Proyectos', icon: 'folder', children: [{ id: 'p1', label: 'Todos', href: '#p1' }, { id: 'p2', label: 'Archivados', href: '#p2' }] }, { id: 'team', label: 'Equipo', href: '#team', icon: 'users' }] }
]`
const sbPage = (theme, extraCss) => pageHtml({
  themes: theme ? [theme] : [],
  style: `.wrap{position:relative;display:inline-flex;block-size:520px;inline-size:300px;margin:0 12px 12px 0;vertical-align:top;background:var(--g-color-surface-sunken)}${extraCss || ''}`,
  body: `<div class="wrap"><g-sidebar id="sb-exp" v-model="a" :items="items" label="Expandida" mode="expanded" contained></g-sidebar></div>
         <div class="wrap"><g-sidebar id="sb-exp2" v-model="c" :items="items" label="Hijo actual" mode="expanded" contained></g-sidebar></div>
         <div class="wrap"><g-sidebar id="sb-rail" v-model="b" :items="items" label="Riel" mode="rail" contained></g-sidebar></div>`,
  setup: `${PAGE_LIB}
    const { createApp, ref } = Vue
    createApp({ setup: () => ({ a: ref('home'), b: ref('p2'), c: ref('p2'), items: ${SB_ITEMS} }) }).use(Grana).mount('#app'); window.__ready = true`
})

const SNAP = `(sel) => { const link = document.querySelector(sel); if (!link) return null
  const ico = link.querySelector('.g-sidebar__icon'); const lab = link.querySelector('.g-sidebar__label')
  const s = (el, p) => { const c = getComputedStyle(el, p); return { bg: c.backgroundColor, color: c.color, outline: c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.outlineColor, shadow: c.boxShadow, fw: c.fontWeight, td: c.textDecorationLine, op: c.opacity, clip: c.clipPath, border: c.borderTopColor + ' ' + c.borderTopWidth, scale: c.scale } }
  const out = { link: s(link), linkB: s(link, '::before'), linkA: s(link, '::after'), label: lab ? s(lab) : null }
  if (ico) { out.ico = s(ico); out.icoB = s(ico, '::before'); out.icoA = s(ico, '::after') }
  const sb = link.closest('.g-sidebar'); const surf = __effBg(sb, sb)
  const linkBg = __over(__col(getComputedStyle(link).backgroundColor) || { r: 0, g: 0, b: 0, a: 0 }, surf)
  out.labelCR = lab ? +__cr(__col(getComputedStyle(lab).color), linkBg).toFixed(2) : null
  if (ico) { const seat = __over(__col(getComputedStyle(ico, '::before').backgroundColor) || { r: 0, g: 0, b: 0, a: 0 }, linkBg); const seatOn = +getComputedStyle(ico, '::before').opacity > 0
    out.glyphCR = seatOn ? +__cr(__col(getComputedStyle(ico).color), seat).toFixed(2) : null }
  return out }`

async function sidebarCase(browser, engine, themeName, scheme, extraCss, negative) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 700 }, colorScheme: scheme })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  const id = `sb-${themeName}-${scheme}-${extraCss ? 'x' : 'n'}-${negative ? 'neg' : 'ok'}`
  serve(id, sbPage(themeName === 'defecto' ? null : themeName, (extraCss || '') + (negative ? '.g-sidebar__link:hover:not([aria-disabled="true"]){background:var(--g-color-border);color:var(--g-color-text)}' : '')))
  await page.goto(`${BASE}/__p/${id}`)
  await page.waitForFunction(() => window.__ready)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
  const snap = (sel) => page.evaluate(`(${SNAP})(${JSON.stringify(sel)})`)
  const tag = `${engine} · ${themeName}${extraCss ? ' + slots oscuros' : ''} · ${scheme}`
  const targets = [
    ['activo de primer nivel (expandida)', '#sb-exp .g-sidebar__link[data-id="home"]'],
    ['hijo actual (expandida)', '#sb-exp2 .g-sidebar__link[data-id="p2"]'],
    ['padre representante is-rep (riel)', '#sb-rail .g-sidebar__item > .g-sidebar__link[data-id="proj"]']
  ]
  const res = { tag, rows: [] }
  for (const [name, sel] of targets) {
    const loc = page.locator(sel)
    if (!(await loc.count())) { ok(false, `${tag}: no se encuentra «${name}» (${sel})`); continue }
    const marked = await loc.evaluate((e) => e.matches('[aria-current="page"], .is-active, .is-rep'))
    ok(marked, `${tag}: «${name}» no está marcado como actual`)
    await page.mouse.move(1, 1); await page.waitForTimeout(450)
    const rest = await snap(sel)
    await loc.hover(); await page.waitForTimeout(500)
    const hov = await snap(sel)
    const same = JSON.stringify(rest) === JSON.stringify(hov)
    if (negative) { ok(!same, `${tag} [control negativo]: con la regla de antes de #564 el activo «${name}» debería cambiar en hover y no cambia (la prueba no discrimina)`) }
    else {
      const diff = Object.keys(rest).filter((k) => JSON.stringify(rest[k]) !== JSON.stringify(hov[k]))
      ok(same, `${tag}: «${name}» cambia con el puntero encima (${diff.join(', ')}): ${diff.map((k) => JSON.stringify(rest[k]) + ' → ' + JSON.stringify(hov[k])).join(' | ').slice(0, 300)}`)
      ok(hov.labelCR >= 4.5, `${tag}: «${name}» en hover, etiqueta ${hov.labelCR}:1 < 4.5`)
      if (hov.glyphCR != null) ok(hov.glyphCR >= 4.5, `${tag}: «${name}» en hover, glifo sobre asiento ${hov.glyphCR}:1 < 4.5`)
      res.rows.push({ name, labelCR: hov.labelCR, glyphCR: hov.glyphCR, seat: hov.icoB && hov.icoB.bg })
    }
  }
  if (!negative) {
    // no activo: SÍ cambia con el hover y el activo no se entera
    const act = '#sb-exp .g-sidebar__link[data-id="home"]'
    const other = '#sb-exp .g-sidebar__link[data-id="inbox"]'
    await page.mouse.move(1, 1); await page.waitForTimeout(450)
    const o0 = await snap(other); const a0 = await snap(act)
    await page.locator(other).hover(); await page.waitForTimeout(500)
    const o1 = await snap(other); const a1 = await snap(act)
    ok(o1.link.bg !== o0.link.bg, `${tag}: un item no activo no cambia de fondo con el hover (${o0.link.bg} → ${o1.link.bg})`)
    ok(o1.link.color !== o0.link.color || o1.label.color !== o0.label.color, `${tag}: un item no activo no cambia de tinta con el hover`)
    ok(o1.labelCR >= 4.5, `${tag}: item no activo en hover, etiqueta ${o1.labelCR}:1 < 4.5`)
    ok(JSON.stringify(a0) === JSON.stringify(a1), `${tag}: el activo cambia cuando el puntero está en OTRO item`)
    // rama hueca (is-branch sin is-rep): recibe hover (#616). En el riel el padre del actual es is-rep; en expandida, el padre no está marcado
    res.hoverOther = { before: o0.link.bg, after: o1.link.bg, cr: o1.labelCR }
  }
  ok(errors.length === 0, `${tag}: errores de página: ${errors.slice(0, 2).join(' | ')}`)
  await ctx.close()
  return res
}

// ============================================================================================================================
// H13 · aviso de categoría sin token
// ============================================================================================================================
const catPage = (themes, body, setupExtra = '', inline = '') => pageHtml({
  themes, extra: [`${DIST}/tag.umd.js`],
  body, style: inline,
  setup: `${PAGE_LIB} window.__warns = []; const w = console.warn; console.warn = (...a) => { window.__warns.push(a.map(String).join(' ')); w.apply(console, a) }
    ${setupExtra}`
})
// Vite reemplaza process.env.NODE_ENV en desarrollo; un <script> suelto no: se simula lo que hace el empaquetador
const DEV = () => { window.process = { env: { NODE_ENV: 'development' } } }

async function categoryCases(browser, engine) {
  const mkPage = async (init) => {
    const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } })
    const page = await ctx.newPage()
    if (init) await page.addInitScript(init)
    return { ctx, page }
  }
  const open = async (page, id, html) => { serve(id, html); await page.goto(`${BASE}/__p/${id}`); await page.waitForFunction(() => window.__ready); await page.waitForTimeout(150) }
  const warns = (page) => page.evaluate(() => window.__warns.filter((m) => m.includes('--g-color-cat-')))
  const mountApp = (tpl, data = '{}') => `const { createApp, reactive, nextTick } = Vue; const st = reactive(${data}); window.st = st
    const app = createApp({ setup: () => ({ st }) , template: ${JSON.stringify(tpl)} }); app.use(Grana); app.use(GranaTag); app.mount('#app'); window.__ready = true`

  // S1 · tema sin categorías (t0): avisa una vez por número, Avatar y Tag comparten
  {
    const { ctx, page } = await mkPage(DEV)
    const tpl = `<div>
      <g-avatar name="Ana Pérez" :categories="8"></g-avatar><g-avatar name="Luis Gómez" :categories="8"></g-avatar><g-avatar name="Marta Ruiz" :categories="8"></g-avatar>
      <g-avatar name="Fijo A" :color="3"></g-avatar><g-avatar name="Fijo B" :color="3"></g-avatar>
      <g-tag label="Fijo tag" :color="3"></g-tag><g-tag label="Cinco" :color="5"></g-tag><g-tag label="Cinco bis" :color="5"></g-tag>
      <g-tag label="Hash tag" :categories="8"></g-tag>
      <g-avatar name="Neutro"></g-avatar><g-tag label="Neutral" color="neutral"></g-tag></div>`
    await open(page, `cat1-${engine}`, catPage(['t0'], '', mountApp(tpl)))
    const w = await warns(page)
    const cats = await page.evaluate(() => [...new Set([...document.querySelectorAll('.g-avatar[data-cat], .g-tag[data-cat]')].map((e) => e.dataset.cat))].sort((a, b) => a - b))
    const ks = w.map((m) => Number(/categoría (\d+)/.exec(m)[1]))
    ok(w.length > 0, `${engine} cat S1: ningún aviso en un tema sin categorías (data-cat pintados: ${cats})`)
    ok(new Set(ks).size === ks.length, `${engine} cat S1: avisos repetidos por número: ${ks}`)
    ok(JSON.stringify([...ks].sort((a, b) => a - b)) === JSON.stringify(cats.map(Number)), `${engine} cat S1: los avisos (${[...ks].sort((a, b) => a - b)}) no coinciden con las categorías pintadas (${cats})`)
    ok(w.some((m) => m.startsWith('[Grana GAvatar]') && /categoría 3\b/.test(m)) !== w.some((m) => m.startsWith('[Grana GTag]') && /categoría 3\b/.test(m)), `${engine} cat S1: la categoría 3 (Avatar y Tag) debe avisar UNA vez en total, no una por componente`)
    ok(w.some((m) => m.startsWith('[Grana GTag]') && /categoría 5\b/.test(m)), `${engine} cat S1: GTag color=5 no avisa`)
    ok(w.every((m) => /se queda neutro\. Añade `categories: N` \(N ≥ \d+\) a grana\.config\.json y vuelve a ejecutar «grana theme»\.$/.test(m)), `${engine} cat S1: el texto del aviso no es el de #560: ${w[0]}`)
    const neutral = await page.evaluate(() => { const a = document.querySelector('.g-avatar[data-cat]'); return a ? getComputedStyle(a).backgroundColor : null })
    note(`${engine} S1: ${w.length} avisos para ${cats.length} categorías pintadas (${[...ks].sort((a, b) => a - b)}); ejemplo: ${w[0]}`)
    await ctx.close()
  }
  // S2 · tema con 8 categorías en :root: no avisa
  {
    const { ctx, page } = await mkPage(DEV)
    const tpl = `<div><g-avatar name="Ana Pérez" :categories="8"></g-avatar><g-avatar name="Fijo" :color="8"></g-avatar><g-avatar name="Fijo 1" :color="1"></g-avatar>
      <g-tag label="Tag 8" :color="8"></g-tag><g-tag label="Hash" :categories="8"></g-tag></div>`
    await open(page, `cat2-${engine}`, catPage(['t8'], '', mountApp(tpl)))
    const w = await warns(page)
    ok(w.length === 0, `${engine} cat S2: avisa aunque el tema define las 8 categorías en :root: ${w.join(' | ')}`)
    const painted = await page.evaluate(() => [...document.querySelectorAll('.g-avatar[data-cat], .g-tag[data-cat]')].every((e) => { const bg = getComputedStyle(e).backgroundColor; return bg && bg !== 'rgba(0, 0, 0, 0)' }))
    ok(painted, `${engine} cat S2: con el token heredado alguna ficha no se pinta`)
    await ctx.close()
  }
  // S3 · token definido solo en un ancestro: lo hereda quien está dentro; quien está fuera avisa
  {
    const { ctx, page } = await mkPage(DEV)
    const tpl = `<div><div id="in" style="--g-color-cat-8:#336699"><g-avatar name="Dentro" :color="8"></g-avatar></div><div id="out"><g-avatar name="Fuera" :color="8"></g-avatar><g-avatar name="Fuera 2" :color="8"></g-avatar></div></div>`
    await open(page, `cat3-${engine}`, catPage(['t0'], '', mountApp(tpl)))
    const w = await warns(page)
    ok(w.length === 1, `${engine} cat S3: debe avisar solo por el avatar de fuera (1), avisa ${w.length}: ${w.join(' | ')}`)
    await ctx.close()
  }
  // S4 · actualización: al cambiar la categoría pedida (onUpdated) avisa por la nueva; la repetida no
  {
    const { ctx, page } = await mkPage(DEV)
    const tpl = `<div><g-avatar name="Cambia" :color="st.k"></g-avatar><g-tag label="Cambia" :color="st.k"></g-tag></div>`
    await open(page, `cat4-${engine}`, catPage(['t0'], '', mountApp(tpl, '{ k: null }')))
    ok((await warns(page)).length === 0, `${engine} cat S4: avisa con color vacío (neutro)`)
    await page.evaluate(async () => { st.k = 6; await Vue.nextTick() })
    const w1 = await warns(page)
    await page.evaluate(async () => { st.k = 6; await Vue.nextTick(); st.k = 7; await Vue.nextTick(); st.k = 6; await Vue.nextTick() })
    const w2 = await warns(page)
    ok(w1.length === 1 && /categoría 6\b/.test(w1[0]), `${engine} cat S4: tras k=6 se esperaba 1 aviso de la 6 y hay ${w1.length}`)
    ok(w2.length === 2 && /categoría 7\b/.test(w2[1]), `${engine} cat S4: tras volver 6→7→6 se esperaban 2 avisos (6 y 7) y hay ${w2.length}`)
    await ctx.close()
  }
  // S5 · control: sin `process` (UMD suelto, sin empaquetador) no avisa; lo mismo que el resto de avisos de desarrollo
  {
    const { ctx, page } = await mkPage(null)
    const tpl = `<div><g-avatar name="Ana" :color="4"></g-avatar><g-tag label="T" :color="4"></g-tag></div>`
    await open(page, `cat5-${engine}`, catPage(['t0'], '', mountApp(tpl)))
    const w = await warns(page)
    ok(w.length === 0, `${engine} cat S5: con UMD suelto (sin process) avisa: ${w.join(' | ')}`)
    await ctx.close()
  }
}

// ============================================================================================================================
// H20 · cambio de tema en caliente
// ============================================================================================================================
const PROBE = `(() => { const c = getComputedStyle(document.documentElement); return { brand: c.getPropertyValue('--g-color-brand').trim(), bg: c.getPropertyValue('--g-color-bg').trim(), text: c.getPropertyValue('--g-color-text').trim(), scheme: c.colorScheme } })()`

async function hotSwapCases(browser, engine) {
  const readVars = async (page, first, second, attr, hot) => {
    serve('hot', pageHtml({ themes: [], body: '<p>tema</p>', setup: 'window.__ready = true' }))
    await page.goto(`${BASE}/__p/hot`)
    await page.waitForFunction(() => window.__ready)
    await page.evaluate((a) => { if (a) document.documentElement.setAttribute('data-theme', a) }, attr)
    // cada tema se añade como <style> con el contenido del CLI; el segundo llega «en caliente» después de renderizar
    const add = async (name) => page.evaluate(async (u) => { const t = await (await fetch(u)).text(); const s = document.createElement('style'); s.dataset.t = u; s.textContent = t; document.head.appendChild(s) }, `${BASE}/__t/${name}.css`)
    if (first) await add(first)
    if (hot && second) { await page.waitForTimeout(80); await add(second) }
    else if (second) await add(second)
    await page.waitForTimeout(60)
    return page.evaluate(PROBE)
  }
  const residue = new Set()
  const pairs = [['A_false', 'B_false'], ['A_true', 'B_true'], ['A_true', 'B_false'], ['A_false', 'B_true']]
  for (const scheme of ['dark', 'light']) {
    const ctx = await browser.newContext({ viewport: { width: 600, height: 400 }, colorScheme: scheme })
    const page = await ctx.newPage()
    for (const attr of [null, 'dark', 'light']) {
      for (const [A, B] of pairs) {
        const tag = `${engine} · ${A} → ${B} · sistema ${scheme}${attr ? ` · data-theme="${attr}"` : ''}`
        const onlyA = await readVars(page, A, null, attr, false)
        const onlyB = await readVars(page, B, null, attr, false)
        const both = await readVars(page, A, B, attr, true)
        ok(onlyA.brand !== onlyB.brand, `${tag}: A y B dan la misma marca solos (${onlyA.brand}); la prueba no discrimina`)
        // Con `data-theme="dark"` explícito y un B `dark: false` (que no emite bloque `[data-theme="dark"]`), los tokens oscuros de A
        // que B no redeclara siguen vigentes: es herencia de la cascada, no del orden. Se compara todo salvo el fondo y se anota.
        const partial = attr === 'dark' && B.endsWith('_false')
        const keys = partial ? ['brand', 'text', 'scheme'] : ['brand', 'bg', 'text', 'scheme']
        ok(keys.every((k) => both[k] === onlyB[k]),
          `${tag}: tras cargar B gana ${both.brand === onlyA.brand ? 'A' : '¿?'}: ${JSON.stringify(both)} ≠ B solo ${JSON.stringify(onlyB)}`)
        if (partial && both.bg !== onlyB.bg) residue.add(`${A} → ${B} con data-theme="dark": --g-color-bg se queda en ${both.bg} (de A) en vez de ${onlyB.bg}`)
        if (args.verbose) console.log(tag, onlyA.brand, onlyB.brand, both.brand)
      }
    }
    // control negativo: el selector de antes de #561 (0,2,0) deja ganar al primero con el sistema en oscuro
    if (scheme === 'dark') {
      const old = await readVars(page, 'A_true_old', 'B_false', null, true)
      const onlyB = await readVars(page, 'B_false', null, null, false)
      ok(old.brand !== onlyB.brand, `${engine} [control negativo H20]: con el selector de antes de #561 el segundo tema también gana (la prueba no discrimina)`)
    }
    await ctx.close()
  }
  for (const r of residue) note(`${engine} H20 (observación, no es fallo): ${r}`)
}

// ============================================================================================================================
// H3 · contención: GInput en GFormRow y GAdaptiveLayout; GCalendar a 320 px
// ============================================================================================================================
const contPage = () => pageHtml({
  style: '.host{margin-block-end:16px;outline:1px dashed var(--g-color-border-strong)}.fit{display:grid;justify-items:center;inline-size:fit-content}',
  body: `<div class="host" id="row900" style="inline-size:900px"><g-form><g-form-layout><g-form-row>
      <g-input label="Nombre completo del paciente" name="n"></g-input><g-input label="Apellidos" name="a"></g-input><g-input label="Correo" name="c"></g-input>
    </g-form-row><g-form-row><g-input label="Documento" name="d"></g-input><g-input-action label="Buscar paciente" name="b"></g-input-action></g-form-row></g-form-layout></g-form></div>
    <div class="host" id="row360" style="inline-size:360px"><g-form><g-form-layout><g-form-row>
      <g-input label="Nombre completo del paciente" name="n2"></g-input><g-input label="Apellidos" name="a2"></g-input></g-form-row></g-form-layout></g-form></div>
    <div class="host" id="ad900" style="inline-size:900px"><g-adaptive-layout>
      <g-input label="Nombre completo del paciente"></g-input><g-input label="Apellidos"></g-input><g-input label="Correo electrónico"></g-input><g-input-action label="Buscar"></g-input-action><g-input label="Ciudad" class="g-adapt-short"></g-input></g-adaptive-layout></div>
    <div class="host" id="ad360" style="inline-size:360px"><g-adaptive-layout>
      <g-input label="Nombre completo del paciente"></g-input><g-input label="Apellidos"></g-input><g-input-action label="Buscar"></g-input-action></g-adaptive-layout></div>
    <div class="host fit" id="fit"><g-input label="Nombre completo del paciente"></g-input></div>`,
  setup: `const { createApp, h } = Vue
    const app = createApp({}); app.use(Grana)
    app.component('input-action', { inheritAttrs: false, render() { return h(Grana.GInput, this.$attrs, { action: () => h(Grana.GBtn, null, () => 'Buscar') }) } })
    app.mount('#app'); window.__ready = true`
})
const RECTS = `(sel) => [...document.querySelector(sel).querySelectorAll('*')].map((e) => { const r = e.getBoundingClientRect(); return [e.className && e.className.baseVal === undefined ? String(e.className).slice(0, 40) : e.tagName, +r.left.toFixed(1), +r.top.toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1)] })`

async function contentionCases(browser, engine) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  serve('cont', contPage())
  await page.goto(`${BASE}/__p/cont`)
  await page.waitForFunction(() => window.__ready)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)
  const hosts = ['#row900', '#row360', '#ad900', '#ad360']
  const withRule = {}
  for (const h of hosts) withRule[h] = await page.evaluate(`(${RECTS})(${JSON.stringify(h)})`)
  const fitWith = await page.evaluate(`(${RECTS})('#fit')`)
  await page.addStyleTag({ content: '.g-input, .g-input--has-action { contain-intrinsic-inline-size: none !important }' })
  await page.waitForTimeout(600)
  for (const h of hosts) {
    const without = await page.evaluate(`(${RECTS})(${JSON.stringify(h)})`)
    const a = JSON.stringify(withRule[h]), b = JSON.stringify(without)
    ok(withRule[h].length > 10, `${engine} contención ${h}: demasiado pocos nodos (${withRule[h].length})`)
    ok(a === b, `${engine} contención ${h}: contain-intrinsic-inline-size cambia la geometría (${withRule[h].filter((r, i) => JSON.stringify(r) !== JSON.stringify(without[i])).length} nodos distintos)`)
  }
  const fitWithout = await page.evaluate(`(${RECTS})('#fit')`)
  const w = (rs) => rs.find((r) => /g-input/.test(r[0]))[3]
  ok(w(fitWith) > 200 && w(fitWithout) < 5, `${engine} contención #fit (control): con la regla ${w(fitWith)} px y sin ella ${w(fitWithout)} px (debe ser ≈ 240 y ≈ 0: la regla es la que sostiene el ancho en un padre que se ajusta)`)
  ok(errors.length === 0, `${engine} contención: errores de consola: ${errors.slice(0, 2).join(' | ')}`)
  note(`${engine} contención: GInput en padre que se ajusta ${w(fitWith)} px con la regla / ${w(fitWithout)} px sin ella`)
  await ctx.close()

  // GCalendar a 320 px
  for (const view of ['month', 'week', 'day']) {
    const c2 = await browser.newContext({ viewport: { width: 320, height: 800 } })
    const p2 = await c2.newPage()
    const errs = []
    p2.on('pageerror', (e) => errs.push(String(e)))
    const id = `cal-${view}-${engine}`
    serve(id, pageHtml({
      style: 'body{padding:0}.fit{display:grid;justify-items:center;inline-size:fit-content}',
      body: `<div id="blk"><g-calendar :events="[]" view="${view}" label="Agenda"></g-calendar></div><div class="fit" id="fit"><g-calendar :events="[]" view="${view}" label="Agenda"></g-calendar></div>`,
      setup: `Vue.createApp({}).use(Grana).mount('#app'); window.__ready = true`
    }))
    await p2.goto(`${BASE}/__p/${id}`)
    await p2.waitForFunction(() => window.__ready)
    await p2.evaluate(() => document.fonts.ready)
    await p2.waitForTimeout(500)
    const m = await p2.evaluate(() => {
      const de = document.documentElement
      const out = { doc: [de.scrollWidth, de.clientWidth], cals: [] }
      for (const sel of ['#blk', '#fit']) { const c = document.querySelector(sel + ' .g-calendar'); const r = c.getBoundingClientRect()
        const wide = [...c.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > de.clientWidth + 0.5 && !e.closest('[class*="scroll"]') }).slice(0, 3).map((e) => e.className)
        out.cals.push({ sel, left: +r.left.toFixed(1), right: +r.right.toFixed(1), w: +r.width.toFixed(1), sw: c.scrollWidth, cw: c.clientWidth, wide }) }
      return out
    })
    ok(m.doc[0] <= m.doc[1], `${engine} GCalendar ${view} a 320 px: la página desborda en horizontal (${m.doc[0]} > ${m.doc[1]})`)
    for (const c of m.cals) {
      ok(c.right <= 320.5 && c.left >= -0.5, `${engine} GCalendar ${view} a 320 px (${c.sel}): fuera del visor [${c.left}, ${c.right}]`)
      ok(c.sw <= c.cw + 1, `${engine} GCalendar ${view} a 320 px (${c.sel}): scrollWidth ${c.sw} > clientWidth ${c.cw}`)
      ok(c.wide.length === 0, `${engine} GCalendar ${view} a 320 px (${c.sel}): nodos fuera del visor: ${c.wide.join(', ')}`)
    }
    ok(errs.length === 0, `${engine} GCalendar ${view}: errores: ${errs.slice(0, 2).join(' | ')}`)
    if (args.verbose) console.log(engine, 'GCalendar', view, JSON.stringify(m))
    note(`${engine} GCalendar ${view} @320: bloque ${m.cals[0].w} px, padre que se ajusta ${m.cals[1].w} px, documento ${m.doc[0]}/${m.doc[1]}`)
    await c2.close()
  }
}

// ============================================================================================================================
// ejecución
// ============================================================================================================================
if (!SNAP_OK) { console.error('dist/ no está completo tras 200 s (falta grana.umd.js, grana.css, fonts.css o tag.umd.js): reconstruir (npm run build) y repetir'); process.exit(2) }

// la lista de «quién lleva el cambio» que se imprime al final
const distHas = {
  hoverExcluyeActivo: /g-sidebar__link:hover:not\(\[aria-disabled=("?)true\1\],\[aria-current=("?)page\2\],\.is-active/.test(await readFile(join(tmp, 'dist', 'grana.css'), 'utf8')),
  avisoCategoria: (await readFile(join(tmp, 'dist', 'grana.umd.js'), 'utf8')).includes('no define'),
  tagUmd: true
}
ok(distHas.hoverExcluyeActivo, 'dist/grana.css no lleva el hover con :not([aria-current="page"], .is-active) de #564')
ok(distHas.avisoCategoria, 'dist/grana.umd.js no lleva el aviso de categoría de #560')
ok((await readFile(join(tmp, 'dist', 'grana.css'), 'utf8')).includes('contain-intrinsic-inline-size'), 'dist/grana.css no lleva contain-intrinsic-inline-size de #562')
ok(css.A_false.includes(':root:where(:not([data-theme="dark"]))') && css.A_true.includes(':root:where(:not([data-theme="light"]))'), 'el CLI no emite los selectores con :where() de #561')

const sbReports = []
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  for (const scheme of ['light', 'dark']) {
    for (const theme of ['defecto', 't0']) sbReports.push(await sidebarCase(browser, engine, theme, scheme, null, false))
    sbReports.push(await sidebarCase(browser, engine, 't0', scheme, ':root{--g-sidebar-current:#0E1530;--g-sidebar-on-current:#FFFFFF;--g-sidebar-current-edge:#8FA3E8}', false))
  }
  await sidebarCase(browser, engine, 't0', 'light', null, true) // control negativo
  await categoryCases(browser, engine)
  await hotSwapCases(browser, engine)
  await contentionCases(browser, engine)
  await browser.close()
}

if (!args['skip-contencion']) {
  const r = spawnSync('node', [join(ROOT, 'design/lab/contencion/verificar.mjs'), `--engines=${ENGINES.join(',')}`], { encoding: 'utf8', cwd: ROOT })
  const m = /contención: (\d+)\/(\d+)/.exec(r.stdout)
  ok(!!m && r.status === 0, `design/lab/contencion/verificar.mjs falla (salida ${r.status}): ${(r.stdout + r.stderr).slice(-600)}`)
  if (m) { total += Number(m[2]) - 1; failed += Number(m[2]) - Number(m[1]); note(`design/lab/contencion/verificar.mjs: ${m[1]}/${m[2]}`) }
}

server.close()
await rm(tmp, { recursive: true, force: true })
if (args.verbose) for (const r of sbReports) { console.log(r.tag, JSON.stringify(r.rows), JSON.stringify(r.hoverOther)) }
for (const n of notes) console.log('  · ' + n)
console.log(`\nintegración real (#560 a #564): ${total - failed}/${total}`)
if (failed) { for (const f of fails) console.log(' ✗ ' + f); process.exit(1) }
