// Auditoría de coco (paso 5) de GTable con el lote de integración #592 a #602 (#650) sobre el COMPONENTE REAL
// (dist/grana.umd.js + dist/grana.css, banco packages/vue/playground/table-rows.html de bruno y una página propia para lo
// que el banco no cubre: `activatable`, `appearance="surface"` y tarjetas con estado).
// Mide en cada tema (por defecto claro/oscuro y los diez generados de dark-color-presence, claro y oscuro):
//   · la puerta (A): texto ≥ 4,5:1, flecha ≥ 3:1 (reposo, hover, rastro), anillo en la celda ≥ 3:1, área ≥ 24px
//   · el despliegue (B): chevron ≥ 3:1, texto de la ficha ≥ 4,5:1, el foco de dentro no se recorta
//   · el estado: lomo ≥ 3:1 con su forma por valor, etiqueta (texto ≥ 4,5:1, icono ≥ 3:1), filo de la causa ≥ 3:1
//   · «aquí estabas» y la fila seleccionada: título y subtítulo ≥ 4,5:1 sobre accent-soft / primary-soft / surface-sunken
//   · filas por página: cifra marcada (borde ≥ 3:1, texto ≥ 4,5:1), pie acoplado (sticky, surface, borde y sombra)
// y, en los tres motores: guarda de modificadores y doble clic, aria-expanded/aria-controls, montaje y desmontaje de la
// ficha, Esc, RTL (lomo a la derecha, flecha y chevron espejados), movimiento reducido; forced-colors en Chromium.
// Estático: GTable.css y la parte nueva de GPagination.css solo con var(--g-*) / var(--_*), sin respaldo ni literales.
// Ejecutar desde la raíz del repo con dist/ reconstruido: node design/lab/table/auditoria-rows-verificar.mjs
// Opcional: --engines=chromium   --verbose (tabla de contraste)   --themes=all|few
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')

/* ---------- Servidor propio (raíz del repo) + página de auditoría servida en memoria ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const AUDIT_HTML = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>GTable · auditoría de coco</title>
<link rel="stylesheet" href="/packages/vue/dist/fonts.css"><link rel="stylesheet" href="/packages/vue/dist/grana.css">
<style>body{margin:0;padding:16px;background:var(--g-color-bg);color:var(--g-color-text);font-family:var(--g-font-ui)} section{margin-block-end:32px}</style>
</head><body><main id="app">
<section id="s-act"><g-table id="tb-act" :columns="cols" :rows="rows" row-key="id" caption="Activables" :labels="labels" activatable :row-status="st" @activate="log('activate', $event.key)"></g-table></section>
<section id="s-surf"><g-table id="tb-surf" appearance="surface" :columns="cols" :rows="rows" row-key="id" caption="Superficie" :labels="labels" :row-status="st" v-model:expanded="exp">
  <template #detail="{ row }"><div class="ficha"><span>{{ row.product }}</span> <a href="#x" class="abrir">Abrir ficha</a></div></template></g-table></section>
<section id="s-cards" style="max-inline-size:360px"><g-table id="tb-cards" responsive="cards" :columns="cols" :rows="rows" row-key="id" caption="Tarjetas" :labels="labels" :row-status="st" :row-href="(r) => '#' + r.id" selectable></g-table></section>
</main>
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script src="/packages/vue/dist/grana.umd.js"></script>
<script src="/packages/vue/playground/lucide-icons.js"></script>
<script>
const rows = Array.from({ length: 6 }, (_, i) => ({ id: 'LT-' + (i + 1), code: 'LT-' + (i + 1), product: ['Kit PCR', 'Agar', 'Etanol 70 %'][i % 3], place: 'Anaquel ' + (i + 1), expiry: [-3, 12, 200, 40, -9, 5][i] }))
const st = (r) => r.expiry < 0 ? { status: 'error', text: 'Caducado', key: 'expiry' } : r.expiry <= 15 ? { status: 'warning', text: 'Caduca pronto' } : r.id === 'LT-4' ? { status: 'info', text: 'Revisión' } : r.id === 'LT-3' ? { status: 'success', text: 'Validado' } : null
const app = Vue.createApp({ setup() {
  const events = Vue.ref([]); const exp = Vue.ref([])
  window.__au = { events, exp, ready: true }
  return { rows, st, exp, log: (...e) => events.value.push(e),
    cols: [{ key: 'lote', label: 'Lote', title: 'code', subtitle: 'product' }, { key: 'place', label: 'Ubicación' }, { key: 'expiry', label: 'Días', align: 'end' }],
    labels: { results: '{count}', loading: 'Cargando', detail: 'Lote {title}', selectAll: 'Todos', selectRow: 'Seleccionar {title}', selectedCount: '{count}', empty: 'Nada' } }
} })
app.use(Grana).use(Grana.createIcons(Object.values(window.LUCIDE_STATIC))).mount('#app')
</script></body></html>`
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x')
    if (url.pathname === '/__audit.html') return res.writeHead(200, { 'content-type': TYPES['.html'] }).end(AUDIT_HTML)
    const p = normalize(join(ROOT, decodeURIComponent(url.pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const ORIGIN = `http://127.0.0.1:${server.address().port}`
const BENCH = ORIGIN + '/packages/vue/playground/table-rows.html'

/* ---------- Temas ---------- */
const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify']
const genCss = Object.fromEntries(await Promise.all(GEN.map(async (n) => [n, await readFile(join(ROOT, `design/lab/tema-oscuro/dark-color-presence/generated/${n}.css`), 'utf8')])))
const THEMES_ALL = [{ name: 'defecto', css: '' }, ...GEN.map((n) => ({ name: n, css: genCss[n] }))].flatMap((t) => [{ ...t, dark: false }, { ...t, dark: true }])
const THEMES_FEW = THEMES_ALL.filter((t) => ['defecto', 'caracol-purpura'].includes(t.name))

let total = 0, failed = 0
const fails = []
const ok = (cond, msg) => { total++; if (!cond) { failed++; fails.push(msg) } }
const table = []
const mins = {}
const track = (key, v) => { if (typeof v === 'number' && (mins[key] == null || v < mins[key].v)) mins[key] = { v, at: track.at } }

/* ---------- En la página: utilidades de color (se inyectan una vez) ---------- */
const HELPERS = () => {
  const parse = (s) => {
    let m = s && s.match(/rgba?\(([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1] }
    m = s && s.match(/color\(srgb ([^)]+)\)/)
    if (m) { const p = m[1].split(/[\s/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1] }
    return [0, 0, 0, 0]
  }
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1] }
  const bgOf = (el) => {
    const layers = []
    for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break } }
    let base = parse(getComputedStyle(document.documentElement).backgroundColor)
    if (base[3] < 1) base = [255, 255, 255, 1]
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base)
    return base
  }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2) }
  const fg = (el, bgEl = el) => { const bg = bgOf(bgEl); return ratio(over(parse(getComputedStyle(el).color), bg), bg) }
  const col = (s, bgEl) => { const bg = bgOf(bgEl); return ratio(over(parse(s), bg), bg) }
  window.__c = { parse, over, bgOf, ratio, fg, col }
}

async function load(page, url, theme, extra = {}) {
  await page.goto(url)
  await page.waitForFunction(() => (window.__tb && window.__tb.ready) || (window.__au && window.__au.ready))
  await page.waitForFunction(() => document.querySelector('tbody tr.g-table__row'))
  if (theme.css) await page.addStyleTag({ content: theme.css })
  await page.evaluate(({ dark, dir }) => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    if (dir) document.documentElement.dir = dir
  }, { dark: theme.dark, dir: extra.dir })
  await page.evaluate(HELPERS)
  await page.evaluate(() => document.fonts.ready)
  // Tras cambiar de tema, las transiciones de color (duration-fast) deben terminar antes de medir
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  await page.waitForTimeout(350)
}
const settle = (page, ms = 450) => page.waitForTimeout(ms)
// WebKit (preferencia por defecto de Safari) solo lleva Tab a los campos; Alt+Tab recorre también enlaces y botones
let K = { tab: 'Tab', back: 'Shift+Tab' }
const tag = (theme) => `${theme.name}${theme.dark ? ' oscuro' : ' claro'}`

/* ---------- Contraste por tema (Chromium, todos los temas; otros motores, dos temas) ---------- */
async function contrastPass(page, theme, eng) {
  const T = `${eng} · ${tag(theme)}`
  track.at = T
  // --- A: la puerta, la flecha, el anillo, el rastro y el estado ---
  await load(page, BENCH + '?c=A', theme)
  await page.evaluate(() => document.querySelector('#tb').scrollIntoView({ block: 'start' }))
  const rowSel = (i) => `#tb tbody tr.g-table__row:nth-child(${i + 1} of .g-table__row)`
  const a = await page.evaluate(() => {
    const C = window.__c
    const rows = [...document.querySelectorAll('#tb tbody tr.g-table__row')]
    const out = { title: 99, sub: 99, spine: 99, spineStyles: {}, spineW: 99, badgeText: 99, badgeIcon: 99, badgeBg: 99, cause: 99 }
    for (const tr of rows) {
      const door = tr.querySelector('.g-table__door')
      out.title = Math.min(out.title, C.fg(door))
      const sub = tr.querySelector('.g-table__subtitle'); if (sub) out.sub = Math.min(out.sub, C.fg(sub))
      if (tr.dataset.status) {
        const td = tr.querySelector('td'); const cs = getComputedStyle(td)
        const ltr = getComputedStyle(document.documentElement).direction !== 'rtl'
        const c = ltr ? cs.borderLeftColor : cs.borderRightColor
        out.spine = Math.min(out.spine, C.col(c, td))
        out.spineStyles[tr.dataset.status] = ltr ? cs.borderLeftStyle : cs.borderRightStyle
        out.spineW = Math.min(out.spineW, parseFloat(ltr ? cs.borderLeftWidth : cs.borderRightWidth))
        const b = tr.querySelector('.g-badge')
        if (b) {
          out.badgeText = Math.min(out.badgeText, C.fg(b.querySelector('.g-badge__text') || b))
          const ic = b.querySelector('.g-badge__icon'); if (ic) out.badgeIcon = Math.min(out.badgeIcon, C.fg(ic))
          out.badgeBg = Math.min(out.badgeBg, C.col(getComputedStyle(b).backgroundColor, b.closest('td')))
        }
        const cause = tr.querySelector('td.g-table__cell--cause')
        if (cause) { const sh = getComputedStyle(cause).boxShadow; const m = sh.match(/(rgba?\([^)]+\)|color\([^)]+\))/); out.cause = Math.min(out.cause, m ? C.col(m[1], cause) : 0) }
      }
    }
    // Área de la puerta: la celda principal entera
    const td = rows[0].querySelector('td.g-table__cell--primary'); const r = td.getBoundingClientRect()
    const hit = document.elementFromPoint(r.right - 3, r.bottom - 3)
    out.area = { w: r.width, h: r.height, hit: !!(hit && hit.closest('.g-table__door')) }
    return out
  })
  for (const [k, v] of Object.entries({ title: a.title, sub: a.sub })) { ok(v >= 4.5, `${T}: A ${k} ${v} < 4,5`); track(`A.${k}`, v) }
  ok(a.spine >= 3, `${T}: lomo ${a.spine} < 3`); track('lomo', a.spine)
  ok(a.spineW >= 3, `${T}: lomo de ${a.spineW}px (< 3px: la forma doble no se distingue)`)
  ok(a.spineStyles.error === 'solid' && a.spineStyles.warning === 'dashed' && a.spineStyles.info === 'dotted', `${T}: formas del lomo ${JSON.stringify(a.spineStyles)}`)
  ok(a.badgeText >= 4.5, `${T}: etiqueta texto ${a.badgeText} < 4,5`); track('etiqueta.texto', a.badgeText)
  ok(a.badgeIcon >= 3, `${T}: etiqueta icono ${a.badgeIcon} < 3`); track('etiqueta.icono', a.badgeIcon)
  track('etiqueta.fondo-vs-fila (informativo)', a.badgeBg)
  ok(a.cause >= 3, `${T}: filo de la causa ${a.cause} < 3`); track('causa.filo', a.cause)
  ok(a.area.h >= 24 && a.area.w >= 24 && a.area.hit, `${T}: área de la puerta ${JSON.stringify(a.area)}`)

  // Hover: la celda principal pasa a surface-sunken; flecha y textos sobre ella
  const pc = await page.locator(`${rowSel(2)} td.g-table__cell--primary`).boundingBox()
  await page.mouse.move(pc.x + pc.width - 10, pc.y + pc.height / 2)
  await settle(page, 300)
  const h = await page.evaluate((s) => {
    const C = window.__c; const tr = document.querySelector(s)
    const arrow = tr.querySelector('.g-table__door-arrow'); const door = tr.querySelector('.g-table__door'); const sub = tr.querySelector('.g-table__subtitle')
    const other = tr.querySelector('td:nth-child(3)')
    return { arrow: C.fg(arrow), op: +getComputedStyle(arrow).opacity, title: C.fg(door), sub: C.fg(sub), deco: getComputedStyle(door).textDecorationLine,
      cellBg: getComputedStyle(tr.querySelector('td.g-table__cell--primary')).backgroundColor, otherBg: getComputedStyle(other).backgroundColor }
  }, rowSel(2))
  ok(h.op === 1 && h.arrow >= 3, `${T}: flecha en hover ${h.arrow} (opacidad ${h.op})`); track('A.flecha.hover', h.arrow)
  ok(h.title >= 4.5 && h.sub >= 4.5, `${T}: A hover título ${h.title} / subtítulo ${h.sub}`); track('A.subtítulo.hover', h.sub)
  ok(h.deco.includes('underline'), `${T}: la puerta no se subraya en hover`)
  ok(h.cellBg !== h.otherBg, `${T}: el hover debería ir solo a la celda principal (${h.cellBg} / ${h.otherBg})`)
  await page.mouse.move(2, 2)

  // Foco de teclado: el anillo rodea la celda
  await page.locator(`${rowSel(0)} .g-table__select input`).focus()
  await page.keyboard.press(K.tab)
  const f = await page.evaluate((s) => {
    const C = window.__c; const tr = document.querySelector(s); const td = tr.querySelector('td.g-table__cell--primary'); const cs = getComputedStyle(td)
    const door = tr.querySelector('.g-table__door')
    return { active: document.activeElement === door, style: cs.outlineStyle, w: parseFloat(cs.outlineWidth), ring: C.col(cs.outlineColor, td), doorOutline: getComputedStyle(door).outlineStyle }
  }, rowSel(0))
  ok(f.active && f.style === 'solid' && f.w >= 2 && f.ring >= 3 && f.doorOutline === 'none', `${T}: anillo de la puerta en la celda ${JSON.stringify(f)}`); track('A.anillo', f.ring)

  // «Aquí estabas» (accent-soft) quieto con movimiento reducido: título y subtítulo encima
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const here = await page.evaluate((s) => {
    const C = window.__c; const tr = document.querySelector(s)
    tr.classList.add('is-here')
    const td = tr.querySelector('td.g-table__cell--primary')
    const r = { title: C.fg(tr.querySelector('.g-table__door'), td), sub: C.fg(tr.querySelector('.g-table__subtitle'), td), anim: getComputedStyle(td).animationName }
    tr.classList.remove('is-here')
    return r
  }, rowSel(3))
  ok(here.title >= 4.5 && here.sub >= 4.5 && here.anim === 'none', `${T}: «aquí estabas» ${JSON.stringify(here)}`); track('is-here.subtítulo', here.sub)
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  // Selección: título y subtítulo sobre primary-soft
  await page.locator(`${rowSel(4)} .g-table__select input`).check()
  const sel = await page.evaluate((s) => { const C = window.__c; const tr = document.querySelector(s); return { title: C.fg(tr.querySelector('.g-table__door')), sub: C.fg(tr.querySelector('.g-table__subtitle')) } }, rowSel(4))
  ok(sel.title >= 4.5 && sel.sub >= 4.5, `${T}: fila seleccionada ${JSON.stringify(sel)}`); track('seleccionada.subtítulo', sel.sub)

  // --- B: chevron, ficha, foco de dentro ---
  await load(page, BENCH + '?c=B', theme)
  await page.evaluate(() => document.querySelector('#tb').scrollIntoView({ block: 'start' }))
  const chev0 = await page.evaluate(() => window.__c.fg(document.querySelector('#tb .g-table__door-chevron')))
  ok(chev0 >= 3, `${T}: chevron cerrado ${chev0} < 3`); track('B.chevron', chev0)
  await page.locator(`${rowSel(1)} .g-table__door`).click()
  await settle(page, 700)
  const b = await page.evaluate((s) => {
    const C = window.__c; const tr = document.querySelector(s); const det = tr.nextElementSibling
    const body = det.querySelector('.g-table__detail-body')
    const txt = det.querySelector('.ficha span')
    return { chev: C.fg(tr.querySelector('.g-table__door-chevron')), text: C.fg(txt), bodyBg: getComputedStyle(body).backgroundColor }
  }, rowSel(1))
  ok(b.chev >= 3 && b.text >= 4.5, `${T}: B abierto ${JSON.stringify(b)}`); track('B.ficha.texto', b.text)
  // El anillo del enlace de dentro no se recorta (la ficha tiene overflow: hidden)
  await page.locator(`${rowSel(1)} + .g-table__detail .abrir`).focus()
  await page.keyboard.press(K.back); await page.keyboard.press(K.tab)
  const clip = await page.evaluate((s) => {
    const a = document.querySelector(`${s} + .g-table__detail .abrir`); const body = a.closest('.g-table__detail-body')
    const cs = getComputedStyle(a); const ext = parseFloat(cs.outlineWidth) + Math.max(0, parseFloat(cs.outlineOffset))
    const r = a.getBoundingClientRect(); const c = body.getBoundingClientRect()
    return { active: document.activeElement === a, style: cs.outlineStyle, inside: r.left - ext >= c.left - 0.5 && r.right + ext <= c.right + 0.5 && r.top - ext >= c.top - 0.5 && r.bottom + ext <= c.bottom + 0.5 }
  }, rowSel(1))
  ok(clip.active && clip.style !== 'none' && clip.inside, `${T}: foco dentro de la ficha recortado ${JSON.stringify(clip)}`)
  // B: hover de fila entera (surface-sunken) con el subtítulo encima
  const rc = await page.locator(`${rowSel(4)} td:nth-child(3)`).boundingBox()
  await page.mouse.move(rc.x + 5, rc.y + rc.height / 2)
  await settle(page, 250)
  const bh = await page.evaluate((s) => { const C = window.__c; const tr = document.querySelector(s); return { sub: C.fg(tr.querySelector('.g-table__subtitle')), cur: getComputedStyle(tr).cursor } }, rowSel(4))
  ok(bh.sub >= 4.5 && bh.cur === 'pointer', `${T}: B hover ${JSON.stringify(bh)}`); track('B.subtítulo.hover', bh.sub)
  await page.mouse.move(2, 2)

  // --- Filas por página: cifras y pie acoplado ---
  await load(page, BENCH + '?c=size', theme)
  const sz = await page.evaluate(() => {
    const C = window.__c
    const checked = document.querySelector('#tb .g-pagination__size-input:checked + .g-pagination__size-text')
    const other = document.querySelector('#tb .g-pagination__size-input:not(:checked) + .g-pagination__size-text')
    const track = document.querySelector('#tb .g-pagination__sizes')
    return { on: C.fg(checked), off: C.fg(other), edge: C.col(getComputedStyle(checked).borderTopColor, track) }
  })
  ok(sz.on >= 4.5 && sz.off >= 4.5 && sz.edge >= 3, `${T}: selector de filas ${JSON.stringify(sz)}`); track('tamaño.borde-marcada', sz.edge); track('tamaño.cifra-sin-marcar', sz.off)
  table.push([T, a.title, a.sub, h.arrow, f.ring, a.spine, a.badgeText, a.badgeIcon, a.cause, here.sub, sel.sub, chev0, b.text, bh.sub, sz.edge, sz.off])
}

/* ---------- Comportamiento, RTL, movimiento reducido y colores forzados ---------- */
async function behaviourPass(page, eng) {
  const T = eng
  const theme = { name: 'caracol-purpura', css: genCss['caracol-purpura'], dark: false }
  const rowSel = (i) => `#tb tbody tr.g-table__row:nth-child(${i + 1} of .g-table__row)`
  const evs = (n) => page.evaluate((n) => window.__tb.events.value.filter((e) => e[0] === n).length, n)
  // A: guarda de #505 (Ctrl/⌘/Mayús/Alt y doble clic no emiten)
  await load(page, BENCH + '?c=A', theme)
  await page.evaluate(() => document.querySelector('#tb').scrollIntoView({ block: 'start' }))
  const door = page.locator(`${rowSel(1)} .g-table__door`)
  await page.evaluate(() => { document.querySelectorAll('#tb .g-table__door').forEach((d) => d.addEventListener('click', (e) => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) e.preventDefault() })) })
  for (const m of ['Control', 'Meta', 'Shift', 'Alt']) await door.click({ modifiers: [m] })
  ok(await evs('navigate') === 0, `${T}: un clic con modificador emitió navigate`)
  await page.evaluate(() => { document.querySelectorAll('#tb .g-table__door').forEach((d) => d.addEventListener('click', (e) => { if (e.detail > 1) e.preventDefault() })) })
  await door.dblclick()
  const afterDbl = await evs('navigate')
  ok(afterDbl === 1, `${T}: doble clic en la puerta emitió navigate ${afterDbl} veces (esperado 1: solo el primer clic)`)
  await page.evaluate(() => { const d = document.querySelector('#dlg'); if (d.open) d.close() })

  // B: aria-expanded / aria-controls, montaje y desmontaje tras la animación, Esc
  await load(page, BENCH + '?c=B', theme)
  await page.evaluate(() => document.querySelector('#tb').scrollIntoView({ block: 'start' }))
  const root = await page.evaluate(() => [...document.querySelector('#tb').classList])
  ok(root.includes('has-detail') && !root.includes('has-door') && root.includes('has-row-status'), `${T}: clases de la raíz B ${root}`)
  const d1 = page.locator(`${rowSel(2)} .g-table__door`)
  const s0 = await page.evaluate((s) => { const d = document.querySelector(`${s} .g-table__door`); return { exp: d.getAttribute('aria-expanded'), ctl: d.getAttribute('aria-controls'), det: !!document.querySelector(`${s} + .g-table__detail`) } }, rowSel(2))
  ok(s0.exp === 'false' && s0.ctl === null && !s0.det, `${T}: B cerrado ${JSON.stringify(s0)}`)
  await d1.click()
  await settle(page, 80)
  const s1 = await page.evaluate((s) => { const d = document.querySelector(`${s} .g-table__door`); const id = d.getAttribute('aria-controls'); const t = id && document.getElementById(id); return { exp: d.getAttribute('aria-expanded'), ok: !!t && t.classList.contains('g-table__detail-body') && t.getAttribute('role') === 'group' && !!t.getAttribute('aria-label'), rot: getComputedStyle(document.querySelector(`${s} .g-table__door-chevron`)).rotate } }, rowSel(2))
  ok(s1.exp === 'true' && s1.ok, `${T}: B abierto ${JSON.stringify(s1)}`)
  await settle(page, 700)
  const rot = await page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .g-table__door-chevron`)).rotate, rowSel(2))
  ok(rot === '90deg', `${T}: chevron abierto gira ${rot}`)
  // Esc dentro de la ficha: pliega, foco a la puerta, desmonta al terminar
  await page.locator(`${rowSel(2)} + .g-table__detail .baja`).focus()
  await page.keyboard.press('Escape')
  const s2 = await page.evaluate((s) => ({ exp: document.querySelector(`${s} .g-table__door`).getAttribute('aria-expanded'), focus: document.activeElement === document.querySelector(`${s} .g-table__door`), still: !!document.querySelector(`${s} + .g-table__detail`) }), rowSel(2))
  ok(s2.exp === 'false' && s2.focus && s2.still, `${T}: Esc ${JSON.stringify(s2)} (la ficha sigue montada mientras se pliega)`)
  await page.waitForFunction((s) => !document.querySelector(`${s} + .g-table__detail`), rowSel(2), { timeout: 3000 }).catch(() => {})
  ok(!(await page.evaluate((s) => !!document.querySelector(`${s} + .g-table__detail`), rowSel(2))), `${T}: la ficha no se desmonta al terminar de plegar`)
  // Movimiento reducido: sin transición en chevron, ficha y flecha; desmonta igual
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await d1.click()
  const rm = await page.evaluate((s) => {
    const body = document.querySelector(`${s} + .g-table__detail .g-table__detail-body`)
    const ch = document.querySelector(`${s} .g-table__door-chevron`)
    const dur = (el) => getComputedStyle(el).transitionDuration.split(',').map(parseFloat).reduce((a, b) => Math.max(a, b), 0)
    return { body: dur(body), chev: dur(ch), rows: getComputedStyle(body).gridTemplateRows }
  }, rowSel(2))
  ok(rm.body === 0 && rm.chev === 0, `${T}: movimiento reducido B ${JSON.stringify(rm)}`)
  await d1.click()
  await page.waitForFunction((s) => !document.querySelector(`${s} + .g-table__detail`), rowSel(2), { timeout: 2000 }).catch(() => {})
  ok(!(await page.evaluate((s) => !!document.querySelector(`${s} + .g-table__detail`), rowSel(2))), `${T}: con movimiento reducido la ficha no se desmonta`)
  await load(page, BENCH + '?c=A', theme)
  const rmA = await page.evaluate(() => { const a = document.querySelector('#tb .g-table__door-arrow'); const cs = getComputedStyle(a); return { dur: cs.transitionDuration, tr: cs.translate } })
  ok(/^0s(, 0s)*$/.test(rmA.dur) && (rmA.tr === 'none' || rmA.tr === '0px' || rmA.tr === '0px 0px'), `${T}: movimiento reducido flecha ${JSON.stringify(rmA)}`)
  await page.emulateMedia({ reducedMotion: 'no-preference' })

  // RTL: lomo a la derecha, flecha y chevron espejados, chevron abierto a −90°
  await load(page, BENCH + '?c=A&dir=rtl', theme, { dir: 'rtl' })
  const rtlA = await page.evaluate(() => {
    const tr = document.querySelector('#tb tbody tr.g-table__row[data-status]'); const td = tr.querySelector('td'); const cs = getComputedStyle(td)
    const ic = document.querySelector('#tb .g-table__door-arrow .g-icon'); const a = document.querySelector('#tb .g-table__door-arrow')
    const dr = tr.querySelector('.g-table__door').getBoundingClientRect(); const ar = tr.querySelector('.g-table__door-arrow').getBoundingClientRect()
    return { right: parseFloat(cs.borderRightWidth), left: parseFloat(cs.borderLeftWidth), style: cs.borderRightStyle, flip: getComputedStyle(ic).transform + ' ' + getComputedStyle(ic).scale, rest: getComputedStyle(a).translate, arrowLeftOfDoor: ar.right <= dr.left + 1 }
  })
  ok(rtlA.right >= 3 && rtlA.left < rtlA.right && rtlA.style !== 'none', `${T}: RTL lomo ${JSON.stringify(rtlA)}`)
  ok(/-1/.test(rtlA.flip) && rtlA.arrowLeftOfDoor && !/^-/.test(rtlA.rest), `${T}: RTL flecha ${JSON.stringify(rtlA)}`)
  await load(page, BENCH + '?c=B&dir=rtl', theme, { dir: 'rtl' })
  await page.locator(`${rowSel(1)} .g-table__door`).click()
  await settle(page, 700)
  const rtlB = await page.evaluate((s) => getComputedStyle(document.querySelector(`${s} .g-table__door-chevron`)).rotate, rowSel(1))
  ok(rtlB === '-90deg', `${T}: RTL chevron abierto ${rtlB}`)

  // Pie acoplado: stuck con fondo surface, filo border y sombra; al final, suelto
  await load(page, BENCH + '?c=size', theme)
  await page.evaluate(() => { window.__tb.size.value = 100 })
  await settle(page, 300)
  await page.evaluate(() => { const t = document.querySelector('#tb tbody tr.g-table__row:nth-child(20)'); t.scrollIntoView({ block: 'center' }) })
  await settle(page, 400)
  const dk = await page.evaluate(() => {
    const nav = document.querySelector('#tb .g-pagination'); const cs = getComputedStyle(nav); const root = getComputedStyle(document.documentElement)
    const probe = document.createElement('i'); document.body.append(probe)
    probe.style.color = 'var(--g-color-surface)'; const surf = getComputedStyle(probe).color
    probe.style.color = 'var(--g-color-border)'; const border = getComputedStyle(probe).color; probe.remove()
    const r = nav.getBoundingClientRect()
    const tb = document.querySelector('#tb')
    const dock = tb.style.getPropertyValue('--_dock-size')
    const sm = getComputedStyle(document.querySelector('#tb .g-table__scroll input')).scrollMarginBottom
    return { cls: [...nav.classList], pos: cs.position, bg: cs.backgroundColor, surf, top: cs.borderTopColor, border, shadow: cs.boxShadow, atBottom: Math.abs(r.bottom - innerHeight) <= 1, dock, sm }
  })
  ok(dk.cls.includes('g-pagination--dock') && dk.cls.includes('is-stuck') && dk.pos === 'sticky' && dk.atBottom, `${T}: pie acoplado ${JSON.stringify(dk)}`)
  ok(dk.bg === dk.surf && dk.top === dk.border && dk.shadow !== 'none', `${T}: pie acoplado pinta ${JSON.stringify({ bg: dk.bg, surf: dk.surf, top: dk.top, border: dk.border, shadow: dk.shadow })}`)
  ok(dk.dock && parseFloat(dk.sm) === parseFloat(dk.dock), `${T}: scroll-margin ${dk.sm} ≠ --_dock-size ${dk.dock}`)
  // (scrollIntoView sobre un elemento sticky mide su posición pegada: se baja hasta dejar la última fila a media vista)
  await page.evaluate(() => { const last = [...document.querySelectorAll('#tb tbody tr.g-table__row')].at(-1); scrollBy(0, last.getBoundingClientRect().bottom - innerHeight / 2) })
  await settle(page, 400)
  const free = await page.evaluate(() => { const nav = document.querySelector('#tb .g-pagination'); return { stuck: nav.classList.contains('is-stuck'), top: getComputedStyle(nav).borderTopColor } })
  ok(!free.stuck && /, 0\)$|transparent/.test(free.top), `${T}: al final el pie se suelta ${JSON.stringify(free)}`)

  // Página propia: activatable (botón), superficie con estado y ficha, tarjetas con estado
  await load(page, ORIGIN + '/__audit.html', theme)
  const act = await page.evaluate(() => {
    const tb = document.querySelector('#tb-act'); const d = tb.querySelector('.g-table__door')
    return { cls: [...tb.classList], tag: d.tagName, type: d.getAttribute('type'), inTitle: d.parentElement.classList.contains('g-table__title'), arrow: !!tb.querySelector('.g-table__door-arrow'), desc: !!d.getAttribute('aria-describedby') }
  })
  ok(act.cls.includes('has-door') && act.tag === 'BUTTON' && act.type === 'button' && act.inTitle && !act.arrow && act.desc, `${T}: activatable ${JSON.stringify(act)}`)
  await page.locator('#tb-act tbody tr.g-table__row >> nth=1').locator('.g-table__door').click()
  ok(await page.evaluate(() => window.__au.events.value.filter((e) => e[0] === 'activate').length) === 1, `${T}: activatable no emite activate`)
  await page.locator('#tb-act tbody tr.g-table__row >> nth=2').locator('.g-table__door').focus()
  await page.keyboard.press(K.back); await page.keyboard.press(K.tab)
  const actRing = await page.evaluate(() => { const td = document.activeElement.closest('td'); if (!td) return { active: document.activeElement.outerHTML.slice(0, 80) }; const cs = getComputedStyle(td); return { cls: td.className, style: cs.outlineStyle, ring: window.__c.col(cs.outlineColor, td) } })
  ok(actRing.style === 'solid' && actRing.ring >= 3 && /primary/.test(actRing.cls), `${T}: anillo de activatable ${JSON.stringify(actRing)}`)
  const surf = await page.evaluate(() => {
    const tb = document.querySelector('#tb-surf'); const rows = [...tb.querySelectorAll('tbody tr.g-table__row')]
    const x = (tr) => tr.querySelector('td:nth-child(2)').getBoundingClientRect().left
    const xs = rows.map(x); const spine = rows.filter((r) => r.dataset.status).map((r) => parseFloat(getComputedStyle(r.querySelector('td')).borderLeftWidth))
    const content = rows.map((r) => r.querySelector('.g-table__composite').getBoundingClientRect().left)
    return { cols: Math.max(...xs) - Math.min(...xs), content: Math.max(...content) - Math.min(...content), spine: Math.min(...spine) }
  })
  ok(surf.cols <= 0.5 && surf.content <= 0.5 && surf.spine >= 3, `${T}: superficie con estado: columnas/contenido se mueven ${JSON.stringify(surf)}`)
  await page.locator('#tb-surf tbody tr.g-table__row >> nth=0').locator('.g-table__door').click()
  await settle(page, 700)
  // La ficha cuelga de su fila: separada de ella por la misma junta que las filas (border-spacing + borde) y más lejos de la siguiente
  const surfDet = await page.evaluate(() => {
    const det = document.querySelector('#tb-surf .g-table__detail'); const tr = det.previousElementSibling; const next = det.nextElementSibling
    const a = tr.getBoundingClientRect(), b = det.querySelector('.g-table__detail-body').getBoundingClientRect(), c = next.getBoundingClientRect()
    const sp = parseFloat(getComputedStyle(det.closest('table')).borderSpacing.split(' ').at(-1)); const bw = parseFloat(getComputedStyle(tr.querySelector('td')).borderBottomWidth)
    return { gap: +(b.top - a.bottom).toFixed(1), joint: sp + bw, toNext: +(c.top - b.bottom).toFixed(1), spine: getComputedStyle(det.querySelector('td')).borderLeftStyle }
  })
  ok(surfDet.gap <= surfDet.joint + 0.5 && surfDet.toNext > surfDet.gap && surfDet.spine !== 'none', `${T}: superficie, ficha junto a su fila ${JSON.stringify(surfDet)}`)
  const cards = await page.evaluate(() => {
    const tb = document.querySelector('#tb-cards'); const tr = tb.querySelector('tbody tr.g-table__row[data-status]'); const cs = getComputedStyle(tr)
    const all = [...tb.querySelectorAll('tbody tr.g-table__row')]
    const sec = document.querySelector('#s-cards')
    return { mode: tb.classList.contains('g-table--mode-cards'), spine: parseFloat(cs.borderLeftWidth), style: cs.borderLeftStyle,
      over: all.some((r) => r.scrollWidth > r.clientWidth + 1) || sec.scrollWidth > sec.clientWidth + 1,
      content: Math.max(...all.map((r) => r.querySelector('.g-table__door').getBoundingClientRect().left)) - Math.min(...all.map((r) => r.querySelector('.g-table__door').getBoundingClientRect().left)) }
  })
  ok(cards.mode && cards.spine >= 3 && cards.style !== 'none' && !cards.over && cards.content <= 0.5, `${T}: tarjetas con estado ${JSON.stringify(cards)}`)
}

/* ---------- Colores forzados (Chromium) ---------- */
async function forcedPass(page) {
  const T = 'chromium forced-colors'
  const theme = { name: 'defecto', css: '', dark: false }
  await page.emulateMedia({ forcedColors: 'active' })
  await load(page, BENCH + '?c=A', theme)
  await page.evaluate(() => document.querySelector('#tb').scrollIntoView({ block: 'start' }))
  const fc = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#tb tbody tr.g-table__row')]
    const withS = rows.find((r) => r.dataset.status === 'warning'); const without = rows.find((r) => !r.dataset.status)
    const a = getComputedStyle(withS.querySelector('td')), b = getComputedStyle(without.querySelector('td'))
    const cause = rows.find((r) => r.querySelector('td.g-table__cell--cause')).querySelector('td.g-table__cell--cause')
    return { sStyle: a.borderLeftStyle, sColor: a.borderLeftColor, nColor: b.borderLeftColor, canvas: getComputedStyle(document.body).backgroundColor, cause: getComputedStyle(cause).outlineStyle }
  })
  ok(fc.sStyle === 'dashed' && fc.sColor !== fc.nColor && fc.nColor === fc.canvas && fc.cause !== 'none', `${T}: lomo y causa ${JSON.stringify(fc)}`)
  await page.locator('#tb tbody tr.g-table__row >> nth=0').locator('.g-table__select input').focus()
  await page.keyboard.press(K.tab)
  const ring = await page.evaluate(() => { const td = document.activeElement.closest('td'); const cs = getComputedStyle(td); return { style: cs.outlineStyle, color: cs.outlineColor, bg: getComputedStyle(document.body).backgroundColor } })
  ok(ring.style === 'solid' && ring.color !== ring.bg, `${T}: anillo de la puerta ${JSON.stringify(ring)}`)
  const here = await page.evaluate(() => { const tr = document.querySelectorAll('#tb tbody tr.g-table__row')[3]; tr.classList.add('is-here'); const s = getComputedStyle(tr.querySelector('td')).outlineStyle; tr.classList.remove('is-here'); return s })
  ok(here === 'dashed', `${T}: «aquí estabas» ${here}`)
  await load(page, BENCH + '?c=B', theme)
  await page.locator('#tb tbody tr.g-table__row >> nth=0').locator('.g-table__door').click()
  await settle(page, 700)
  const det = await page.evaluate(() => getComputedStyle(document.querySelector('#tb .g-table__detail-body')).outlineStyle)
  ok(det === 'solid', `${T}: ficha sin contorno (${det})`)
  await load(page, BENCH + '?c=size', theme)
  await page.evaluate(() => { window.__tb.size.value = 100 })
  await settle(page, 300)
  await page.evaluate(() => document.querySelector('#tb tbody tr.g-table__row:nth-child(20)').scrollIntoView({ block: 'center' }))
  await settle(page, 400)
  const dk = await page.evaluate(() => { const n = document.querySelector('#tb .g-pagination'); const on = document.querySelector('#tb .g-pagination__size-input:checked + .g-pagination__size-text'); return { stuck: n.classList.contains('is-stuck'), top: getComputedStyle(n).borderTopColor, on: getComputedStyle(on).backgroundColor, canvas: getComputedStyle(document.body).backgroundColor } })
  ok(dk.stuck && dk.top !== dk.canvas && dk.on !== dk.canvas, `${T}: pie acoplado y cifra marcada ${JSON.stringify(dk)}`)
  await page.emulateMedia({ forcedColors: 'none' })
}

/* ---------- Estático: solo tokens ---------- */
async function staticPass() {
  // Sin comentarios ni bloques del patrón de texto oculto (los únicos con 1px permitido)
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/[^{}]*\{[^{}]*clip-path:\s*inset\(50%\)[^{}]*\}/g, '')
  const css = strip(await readFile(join(ROOT, 'packages/vue/src/components/GTable/GTable.css'), 'utf8'))
  const pag = strip(await readFile(join(ROOT, 'packages/vue/src/components/GPagination/GPagination.css'), 'utf8'))
  // #682: la condición de @supports (round(1px, 1px)) y el paso --_snap: 0.5px no son medidas de diseño
  for (const [name, src] of [['GTable.css', css], ['GPagination.css', pag.replace(/@supports \(inline-size: round\(1px, 1px\)\)/g, '').replace(/--_snap: 0\.5px;/g, '')]]) {
    const hex = src.match(/#[0-9a-fA-F]{3,8}\b/g) || []
    const fns = src.match(/\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/g) || []
    const px = (src.match(/\b\d*\.?\d+px\b/g) || []).filter((v) => v !== '24px' && v !== '44px' && v !== '1px' && v !== '0px')
    const onePx = (src.match(/\b1px\b/g) || []).length
    const fallback = src.match(/var\(--[\w-]+\s*,/g) || []
    const foreign = (src.match(/var\((--[\w-]+)/g) || []).map((v) => v.slice(4)).filter((v) => !/^--(g-|_)/.test(v))
    const named = src.match(/:\s*(?:[^;{}]*\s)?(white|black|red|blue|green|gray|grey)\b/g) || []
    ok(!hex.length && !fns.length && !fallback.length && !foreign.length && !named.length, `${name}: literales ${JSON.stringify({ hex, fns, fallback, foreign, named })}`)
    ok(!px.length, `${name}: medidas literales ${JSON.stringify(px)}`)
    ok(onePx === 0, `${name}: 1px fuera del patrón de texto oculto (${onePx})`)
  }
  // El .vue sin <style>
  const vue = await readFile(join(ROOT, 'packages/vue/src/components/GTable/GTable.vue'), 'utf8')
  ok(!/<style/.test(vue), 'GTable.vue lleva <style>')
}

/* ---------- Ejecución ---------- */
await staticPass()
for (const eng of ENGINES) {
  K = eng === 'webkit' ? { tab: 'Alt+Tab', back: 'Alt+Shift+Tab' } : { tab: 'Tab', back: 'Shift+Tab' }
  const browser = await pw[eng].launch()
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } })
  const page = await ctx.newPage()
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(e.message) })
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errs.push(m.text()) })
  const themes = eng === 'chromium' && args.themes !== 'few' ? THEMES_ALL : THEMES_FEW
  for (const t of themes) await contrastPass(page, t, eng)
  await behaviourPass(page, eng)
  if (eng === 'chromium') await forcedPass(page)
  ok(!errs.length, `${eng}: consola ${JSON.stringify(errs.slice(0, 3))}`)
  await browser.close()
}
server.close()

if (args.verbose) {
  console.log('tema | título | subtít. | flecha hover | anillo | lomo | etiqueta txt | etiqueta icono | filo causa | aquí-estabas sub | selec. sub | chevron | ficha txt | B hover sub | borde cifra | cifra off')
  for (const r of table) console.log(r.join(' | '))
}
console.log('Mínimos:')
for (const [k, { v, at }] of Object.entries(mins)) console.log(`  ${k}: ${v} (${at})`)
console.log(fails.length ? 'Fallos:\n  ' + fails.join('\n  ') : 'Sin fallos')
console.log(`${total - failed}/${total}`)
process.exit(failed ? 1 : 0)
