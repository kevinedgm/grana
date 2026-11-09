// Auditoría de coco sobre el sitio CALCADO real (#1052 a #1072): build + `vitepress preview` en GRANA_SITE_PORT (4246).
//   cd site && npm run docs:build && npx vitepress preview . --port 4246
//   GRANA_SITE_PORT=4246 node design/lab/sitio/auditoria-verificar.mjs [--engines=chromium,firefox,webkit] [--verbose]
// Mide, sobre los componentes reales del marco (GNavBar, GSidebar appearance="index", GPageIndex list/fold y GCombobox
// command), con el tema por defecto y con un tema distinto (caracol-purpura del CLI, sin capa, inyectado después de
// la hoja del sitio), en claro y en oscuro:
//   0 · estático: layers.css con las cinco capas en orden; grana-site.css sin .VP*, sin color literal, sin respaldo.
//   1 · contraste: enlaces y actual de la barra (≥ 4,5), la luz P1 y el foco (anillo ≥ 3:1); índice: items, código,
//       título de grupo (≥ 4,5) y marca del actual (≥ 3:1); «En esta página»: enlaces (≥ 4,5) y marcador (≥ 3:1);
//       búsqueda: opción, opción activa (fondo distinto), pistas (≥ 4,5).
//   2 · foco visible en barra, título de grupo, filtro, «En esta página» y campo de búsqueda; Esc devuelve el foco.
//   3 · táctil (Chromium y WebKit, 375 y 390): barra, búsqueda, «Menú», plegado, pantalla de menú y cajón a ±12 px
//       (24 px) y lo de la banda a ±21 px (44 px).
//   4 · RTL (dir="rtl" emulado): sin desplazamiento horizontal; la marca del índice y el marcador en el lado inicial.
//   5 · movimiento reducido: luz, marca, marcador, chevron y búsqueda sin desplazamiento ni giro.
//   6 · forced-colors (Chromium): actual de la barra, marca, marcador y opción activa visibles sin color propio.
//   7 · SSR = hidratado a 1280 y 375 (banda, índice, columna, h1; Δ ≤ 1 px).
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const PORT = Number(process.env.GRANA_SITE_PORT) || 4246
const BASE = `http://localhost:${PORT}/grana/`
const PAGE = 'components/combobox.html'
const THEMES = { defecto: '', 'caracol-purpura': await readFile(ROOT + 'design/lab/tema-oscuro/dark-color-presence/generated/caracol-purpura.css', 'utf8') }
let total = 0, failed = 0
const fails = [], notes = new Set(), per = {}
const ok = (cond, msg, eng) => { total++; per[eng] = per[eng] || [0, 0]; per[eng][0]++; if (!cond) { failed++; per[eng][1]++; fails.push(msg) } }
const note = (s) => notes.add(s)
const fmt = (n) => Math.round(n * 100) / 100

/* ---------- 0 · Estático ---------- */
{
  const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '')
  const layers = strip(await readFile(ROOT + 'site/.vitepress/theme/layers.css', 'utf8'))
  ok(/@layer vitepress, grana\.defaults, grana\.components, grana\.blocks, grana\.utilities;/.test(layers), 'layers.css: orden de capas', 'estático')
  const site = strip(await readFile(ROOT + 'site/.vitepress/theme/grana-site.css', 'utf8'))
  ok(!/\.VP[A-Z]/.test(site), 'grana-site.css: selectores .VP*', 'estático')
  // el bloque «Tema del sitio» es el tema de la aplicación (sin capa): ahí un valor es un valor (velo 0,6, H7/#1066)
  const lits = [...site.matchAll(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|hwb|color-mix)\(/g)].filter((m) => !/--g-surface-backdrop:\s*$/.test(site.slice(Math.max(0, m.index - 40), m.index)))
  ok(!lits.length, 'grana-site.css: color literal fuera del tema del sitio: ' + lits.map((m) => site.slice(m.index - 30, m.index + 20)).join(' | '), 'estático')
  ok(!/var\(\s*--[\w-]+\s*,/.test(site), 'grana-site.css: var() con respaldo', 'estático')
  for (const f of ['GNavBar/GNavBar.css', 'GPageIndex/GPageIndex.css', 'GSidebar/GSidebar.css', 'GCombobox/GCombobox.css']) {
    const css = strip(await readFile(ROOT + 'packages/vue/src/components/' + f, 'utf8'))
    ok(!/var\(\s*--[\w-]+\s*,/.test(css), `${f}: var() con respaldo`, 'estático')
    ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|hwb)\(/.test(css), `${f}: color literal`, 'estático')
    ok(/prefers-reduced-motion/.test(css) && /forced-colors/.test(css), `${f}: sin rama de movimiento reducido o forced-colors`, 'estático')
  }
}

const lib = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const parse = (s) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const bgOf = (el, skipSelf) => { const L = []; for (let n = skipSelf ? el.parentElement : el; n && !(L.length && L[L.length - 1][3] >= 1); n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) L.push(c) } let b = getComputedStyle(document.documentElement).colorScheme === 'dark' ? [0, 0, 0, 1] : [255, 255, 255, 1]; for (let i = L.length - 1; i >= 0; i--) b = over(L[i], b); return b }
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const text = (el) => { const bg = bgOf(el); return cr(over(parse(getComputedStyle(el).color), bg), bg) }
  // una forma pintada (marca, marcador) contra lo que tiene debajo
  const shape = (el, under) => { const bg = bgOf(under || el.parentElement); return cr(over(parse(getComputedStyle(el).backgroundColor), bg), bg) }
  const ring = (el) => { const s = getComputedStyle(el); if (s.outlineStyle === 'none' || parseFloat(s.outlineWidth) < 2) return 0; const bg = bgOf(el, true); return cr(over(parse(s.outlineColor), bg), bg) }
  const visible = (e) => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[hidden], [inert]')
  window.L = { parse, bgOf, cr, text, shape, ring, visible }
}

const frameBoxes = () => {
  const r = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height].map((v) => Math.round(v * 10) / 10) }
  const out = {}
  for (const [k, s] of Object.entries({ banda: '.g-app-shell__header', barra: '.g-nav-bar__list', marca: '.g-nav-bar__brand', busqueda: '.site-search', indice: '.g-sidebar--appearance-index', local: '.site-local', h1: 'main h1', enEstaPagina: '.site-aside .g-page-index' })) {
    const e = [...document.querySelectorAll(s)].find((x) => x.getClientRects().length); if (e) out[k] = r(e)
  }
  return { boxes: out, h: document.documentElement.scrollWidth - document.documentElement.clientWidth }
}

async function open(browser, { w = 1280, h = 900, scheme = 'light', theme = '', reduced = 'no-preference', touch = false, js = true } = {}) {
  // «Sin JS» = el HTML del servidor con su CSS y sin los módulos de la aplicación (se cortan los .js): así la medida
  // se toma con el mismo evaluate en los tres motores (Firefox no evalúa nada con javaScriptEnabled: false)
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: reduced, hasTouch: touch, isMobile: touch && browser.browserType().name() !== 'firefox' })
  if (!js) await ctx.route(/\.m?js(\?|$)/, (r) => r.abort())
  if (theme) await ctx.addInitScript((css) => { addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.id = 'audit-theme'; s.textContent = css; document.head.append(s) }) }, theme)
  const p = await ctx.newPage()
  const problems = []
  p.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/^\[JavaScript Warning:/.test(m.text())) problems.push(m.text()) })
  p.on('pageerror', (e) => problems.push(e.message))
  await p.goto(BASE + PAGE, { waitUntil: js ? 'networkidle' : 'load' })
  await p.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 3000))])).catch(() => {})
  await p.waitForTimeout(500)
  if (args.progress) console.error('· abierto', browser.browserType().name(), w, scheme, theme ? 'tema' : 'defecto', reduced, touch ? 'táctil' : '', js ? '' : 'sin JS')
  if (js) await p.evaluate(lib)
  return { ctx, p, problems }
}

for (const name of ENGINES) {
  const browser = await pw[name].launch()
  const T = (s) => `${name} · ${s}`
  const OK = (c, m) => ok(c, T(m), name)
  // Foco por teclado: se enfoca el anterior y se pulsa Tab (en WebKit, Opción+Tab, que también recorre los enlaces,
  // como Safari con «Pulsar Tab para resaltar cada elemento»)
  const TAB = name === 'webkit' ? 'Alt+Tab' : 'Tab'
  const kbFocus = async (p, loc) => { await loc.focus(); await p.keyboard.press('Shift+' + TAB); await p.keyboard.press(TAB) }

  /* ---------- 1 y 2 · contraste y foco, dos temas × claro/oscuro ---------- */
  for (const [tname, tcss] of Object.entries(THEMES)) for (const scheme of ['light', 'dark']) {
    const t = `${tname} ${scheme === 'light' ? 'claro' : 'oscuro'}`
    const { ctx, p, problems } = await open(browser, { scheme, theme: tcss })
    if (tcss) OK(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--g-radius-md').trim() === '18px'), `${t}: el tema no se aplicó`)
    // Barra
    const bar = await p.evaluate(() => {
      const links = [...document.querySelectorAll('.g-nav-bar__list .g-nav-bar__link')].filter(L.visible)
      const cur = links.find((a) => a.getAttribute('aria-current'))
      return { n: links.length, min: Math.min(...links.map(L.text)), cur: cur ? L.text(cur) : null, h: Math.min(...links.map((a) => a.getBoundingClientRect().height)) }
    })
    OK(bar.n >= 2 && bar.min >= 4.5, `${t}: enlaces de la barra ${fmt(bar.min)} (${bar.n})`)
    OK(bar.cur === null || bar.cur >= 4.5, `${t}: actual de la barra ${fmt(bar.cur)}`)
    OK(bar.h >= 24, `${t}: enlace de la barra mide ${bar.h} px`)
    // P1: la luz bajo el puntero, dentro del enlace
    const link = p.locator('.g-nav-bar__list .g-nav-bar__link:not([aria-current])').first()
    await link.hover(); await p.waitForTimeout(350)
    const lit = await p.evaluate(() => {
      const hl = document.querySelector('.g-nav-bar__highlight'); if (!hl) return null
      const a = [...document.querySelectorAll('.g-nav-bar__list .g-nav-bar__link')].find((x) => x.matches(':hover'))
      const r = hl.getBoundingClientRect(), b = a.getBoundingClientRect()
      return { op: +getComputedStyle(hl).opacity, dx: Math.abs(r.left - b.left), dw: Math.abs(r.width - b.width), inY: r.top >= b.top - 1 && r.bottom <= b.bottom + 1, text: L.text(a) }
    })
    OK(lit && lit.op > 0 && lit.dx <= 1 && lit.dw <= 1 && lit.inY, `${t}: P1 la luz no cubre el enlace ${JSON.stringify(lit)}`)
    OK(lit && lit.text >= 4.5, `${t}: enlace bajo la luz ${fmt(lit && lit.text)}`)
    await p.mouse.move(5, 600)
    // Foco de la barra
    await kbFocus(p, p.locator('.g-nav-bar__list .g-nav-bar__link').first())
    const fr = await p.evaluate(() => ({ cls: document.activeElement.className, ring: L.ring(document.activeElement) }))
    OK(/g-nav-bar__link/.test(fr.cls) && fr.ring >= 3, `${t}: anillo de la barra ${fmt(fr.ring)} (${fr.cls})`)
    // Índice
    const idx = await p.evaluate(() => {
      const root = document.querySelector('.g-sidebar--appearance-index')
      const links = [...root.querySelectorAll('.g-sidebar__link')].filter(L.visible).slice(0, 40)
      const titles = [...root.querySelectorAll('.g-sidebar__group-title')].filter(L.visible)
      const codes = [...root.querySelectorAll('.g-sidebar__code')].filter(L.visible).slice(0, 40)
      const cur = root.querySelector('.g-sidebar__link[aria-current="page"]')
      const mark = root.querySelector('.g-sidebar__mark')
      return {
        links: Math.min(...links.map(L.text)), titles: titles.length ? Math.min(...titles.map(L.text)) : 99, codes: codes.length ? Math.min(...codes.map(L.text)) : 99,
        cur: cur ? L.text(cur) : 0, mark: mark && L.visible(mark) ? L.shape(mark, cur || root) : 0, nLinks: links.length,
        hTitle: titles.length ? Math.min(...titles.map((e) => e.getBoundingClientRect().height)) : 99, hLink: Math.min(...links.map((e) => e.getBoundingClientRect().height))
      }
    })
    OK(idx.nLinks > 5 && idx.links >= 4.5, `${t}: items del índice ${fmt(idx.links)}`)
    OK(idx.titles >= 4.5, `${t}: títulos de grupo ${fmt(idx.titles)}`)
    OK(idx.codes >= 4.5, `${t}: código del item ${fmt(idx.codes)}`)
    OK(idx.cur >= 4.5, `${t}: item actual ${fmt(idx.cur)}`)
    OK(idx.mark >= 3, `${t}: marca del actual ${fmt(idx.mark)}`)
    OK(idx.hTitle >= 24 && idx.hLink >= 24, `${t}: alto de título ${idx.hTitle} / item ${idx.hLink}`)
    // Foco: título de grupo y filtro
    await kbFocus(p, p.locator('.g-sidebar--appearance-index .g-sidebar__group-title').nth(1))
    const gt = await p.evaluate(() => ({ cls: document.activeElement.className + '', ring: L.ring(document.activeElement) }))
    OK(/g-sidebar__group-title/.test(gt.cls) && gt.ring >= 3, `${t}: anillo del título de grupo ${fmt(gt.ring)} (${gt.cls})`)
    await p.locator('.g-sidebar__filter-input').focus()
    const fin = await p.evaluate(() => { const e = document.activeElement; const box = e.closest('.g-sidebar__filter-box'); return Math.max(L.ring(e), box ? L.ring(box) : 0, (() => { const s = getComputedStyle(box || e); return parseFloat(s.borderTopWidth) >= 1 ? L.cr(L.parse(s.borderTopColor), L.bgOf(box || e, true)) : 0 })()) })
    OK(fin >= 3, `${t}: foco del filtro ${fmt(fin)}`)
    // En esta página (columna)
    const pi = await p.evaluate(() => {
      const root = document.querySelector('.site-aside .g-page-index'); if (!root) return null
      const links = [...root.querySelectorAll('.g-page-index__link')].filter(L.visible)
      const m = root.querySelector('.g-page-index__marker')
      const cur = root.querySelector('.g-page-index__link[aria-current]')
      return { links: Math.min(...links.map(L.text)), n: links.length, mark: m && L.visible(m) && +getComputedStyle(m).opacity > 0 ? L.shape(m) : null, cur: cur ? L.text(cur) : null }
    })
    OK(pi && pi.n > 1 && pi.links >= 4.5, `${t}: enlaces de «En esta página» ${fmt(pi && pi.links)}`)
    OK(!pi || pi.mark === null || pi.mark >= 3, `${t}: marcador ${fmt(pi && pi.mark)}`)
    if (pi && pi.mark === null) note('PI · el marcador de «En esta página» no se pinta hasta el primer desplazamiento (lugar actual por línea de lectura, #1048): medido tras desplazar en la sección 1b')
    await kbFocus(p, p.locator('.site-aside .g-page-index__link').nth(1))
    const pf = await p.evaluate(() => ({ cls: document.activeElement.className + '', ring: L.ring(document.activeElement) }))
    OK(/g-page-index__link/.test(pf.cls) && pf.ring >= 3, `${t}: anillo de «En esta página» ${fmt(pf.ring)} (${pf.cls})`)
    // 1b · marcador tras desplazar (con el puntero sobre el contenido, no sobre el índice)
    await p.mouse.move(700, 500); await p.mouse.wheel(0, 900); await p.waitForTimeout(700)
    const mk = await p.evaluate(() => { const m = document.querySelector('.site-aside .g-page-index__marker'); return m && +getComputedStyle(m).opacity > 0 ? L.shape(m) : null })
    OK(mk !== null && mk >= 3, `${t}: marcador tras desplazar ${fmt(mk)}`)
    await p.evaluate(() => scrollTo(0, 0))
    // Búsqueda
    await p.locator('.site-search').click()
    await p.keyboard.type('combo', { delay: 30 })
    // el índice de búsqueda (≈ 3 MB por idioma) se carga con la primera búsqueda
    await p.waitForSelector('#site-search-surface .g-combobox__option', { timeout: 30000 }).catch(() => {})
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250)
    const cmd = await p.evaluate(() => {
      const root = document.getElementById('site-search-surface')
      const input = document.activeElement
      const opts = [...root.querySelectorAll('.g-combobox__option')].filter(L.visible)
      const ad = input && input.getAttribute('aria-activedescendant')
      const act = (ad && document.getElementById(ad)) || opts.find((o) => o.getAttribute('aria-selected') === 'true')
      const rest = opts.find((o) => o !== act)
      const txt = (o) => Math.min(...[...o.querySelectorAll('*')].filter((x) => x.childNodes.length && [...x.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map(L.text).concat(L.text(o)))
      const hints = [...document.querySelectorAll('.g-combobox__hints span')].filter(L.visible)
      return {
        open: !!root && root.open, inInput: input && input.tagName === 'INPUT', ring: input ? Math.max(L.ring(input), (() => { const b = input.closest('.g-combobox__search'); if (!b) return 0; const s = getComputedStyle(b); return s.boxShadow !== 'none' ? L.cr(L.parse(s.borderTopColor), L.bgOf(b, true)) : 0 })()) : 0,
        n: opts.length, rest: rest ? txt(rest) : 99, act: act ? txt(act) : 0,
        diff: act && rest ? getComputedStyle(act).backgroundColor !== getComputedStyle(rest).backgroundColor || getComputedStyle(act).boxShadow !== getComputedStyle(rest).boxShadow || getComputedStyle(act).outlineStyle !== getComputedStyle(rest).outlineStyle : null,
        hints: hints.length ? Math.min(...hints.map(L.text)) : 99
      }
    })
    OK(cmd.open && cmd.inInput, `${t}: la búsqueda no abre con el foco en el campo`)
    OK(cmd.n >= 2, `${t}: la búsqueda no da resultados (${cmd.n})`)
    OK(cmd.rest >= 4.5 && cmd.act >= 4.5, `${t}: opción ${fmt(cmd.rest)} / activa ${fmt(cmd.act)}`)
    OK(cmd.diff !== false, `${t}: la opción activa no se distingue de las demás`)
    OK(cmd.hints >= 4.5, `${t}: pistas ${fmt(cmd.hints)}`)
    OK(cmd.ring >= 3, `${t}: foco del campo de búsqueda (borde y anillo por dentro de __search) ${fmt(cmd.ring)}`)
    await p.keyboard.press('Escape'); await p.waitForTimeout(400)
    OK(await p.evaluate(() => document.activeElement && document.activeElement.classList.contains('site-search')), `${t}: Esc no devuelve el foco al disparador de la búsqueda`)
    OK(!problems.length, `${t}: consola ${problems.slice(0, 2).join(' | ')}`)
    if (args.verbose) console.log(T(t), JSON.stringify({ bar, idx, pi, mk, cmd }))
    await ctx.close()
  }

  /* ---------- 3 · táctil ---------- */
  if (name !== 'firefox') for (const w of [375, 390]) for (const [tname, tcss] of Object.entries(THEMES)) {
    const { ctx, p } = await open(browser, { w, h: 800, touch: true, theme: tcss })
    const probe = (sels, d) => p.evaluate(([sels, d]) => sels.flatMap((s) => [...document.querySelectorAll(s)]).filter((e) => L.visible(e) && !e.closest('[aria-hidden="true"]')).map((e) => {
      e.scrollIntoView({ block: 'center', inline: 'nearest' })
      const r = e.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      const own = (x, y) => { const h = document.elementFromPoint(x, y); return !!h && (e.contains(h) || h.contains(e) && h !== document.body) }
      return { s: ((e.className && e.className.baseVal === undefined ? e.className : '') + '').split(' ')[0] || e.tagName, ok: [[cx - d, cy], [cx + d, cy], [cx, cy - d], [cx, cy + d]].every(([x, y]) => own(x, y)) }
    }).filter((x) => !x.ok).map((x) => x.s), [sels, d])
    let bad = await probe(['.g-app-shell__header .g-nav-bar__toggle', '.g-app-shell__header .site-search'], 21)
    OK(!bad.length, `táctil ${w} ${tname}: banda a 44 px: ${[...new Set(bad)]}`)
    bad = await probe(['.site-local__menu', '.site-local .g-page-index__fold, .site-local .g-page-index__trigger'], 12)
    OK(!bad.length, `táctil ${w} ${tname}: barra local a 24 px: ${[...new Set(bad)]}`)
    // pantalla de menú
    await p.evaluate(() => scrollTo(0, 0))
    await p.locator('.g-nav-bar__toggle').first().tap(); await p.waitForTimeout(400)
    const scr = await p.evaluate(() => { const s = document.querySelector('.g-nav-bar__screen'); return !!s && L.visible(s) })
    OK(scr, `táctil ${w} ${tname}: la pantalla de menú no abre`)
    bad = await probe(['.g-nav-bar__screen .g-nav-bar__screen-link', '.g-nav-bar__screen .site-langs a'], 12)
    OK(!bad.length, `táctil ${w} ${tname}: pantalla de menú a 24 px: ${[...new Set(bad)]}`)
    const scrCr = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.g-nav-bar__screen .g-nav-bar__screen-link')].filter(L.visible).map(L.text)))
    OK(scrCr >= 4.5, `táctil ${w} ${tname}: contraste de la pantalla de menú ${fmt(scrCr)}`)
    await p.locator('.g-nav-bar__toggle').first().tap(); await p.waitForTimeout(400)
    // cajón
    await p.evaluate(() => scrollTo(0, 0))
    await p.locator('.site-local__menu').tap(); await p.waitForTimeout(600)
    const dr = await p.evaluate(() => { const d = document.querySelector('.g-sidebar__drawer'); return !!d && L.visible(d) })
    OK(dr, `táctil ${w} ${tname}: el cajón no abre`)
    bad = await probe(['.g-sidebar__drawer .g-sidebar__link', '.g-sidebar__drawer .g-sidebar__group-title'], 12)
    OK(!bad.length, `táctil ${w} ${tname}: cajón a 24 px: ${[...new Set(bad)].slice(0, 4)}`)
    const drCr = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.g-sidebar__drawer .g-sidebar__link')].filter(L.visible).slice(0, 30).map(L.text)))
    OK(drCr >= 4.5, `táctil ${w} ${tname}: contraste del cajón ${fmt(drCr)}`)
    await ctx.close()
  }

  /* ---------- 4 · RTL ---------- */
  {
    const { ctx, p } = await open(browser, {})
    await p.evaluate(() => document.documentElement.setAttribute('dir', 'rtl')); await p.waitForTimeout(500)
    await p.mouse.move(640, 500)
    const r = await p.evaluate(() => {
      const h = document.documentElement.scrollWidth - document.documentElement.clientWidth
      const mark = document.querySelector('.g-sidebar__mark'), cur = document.querySelector('.g-sidebar--appearance-index .g-sidebar__link[aria-current="page"]')
      const mr = mark && mark.getBoundingClientRect(), cr = cur && cur.getBoundingClientRect()
      const nav = document.querySelector('.g-sidebar--appearance-index .g-sidebar__nav').getBoundingClientRect()
      return { h, markSide: mr && cr ? (mr.left + mr.width / 2 > nav.left + nav.width / 2 ? 'end-físico' : 'start-físico') : null }
    })
    OK(r.h <= 0, `RTL: desplazamiento horizontal ${r.h}`)
    OK(r.markSide === 'end-físico', `RTL: la marca del índice no pasa al lado inicial (derecha) (${r.markSide})`)
    await p.mouse.move(640, 500); await p.mouse.wheel(0, 900); await p.waitForTimeout(700)
    const m = await p.evaluate(() => { const m = document.querySelector('.site-aside .g-page-index__marker'), l = document.querySelector('.site-aside .g-page-index__body, .site-aside .g-page-index__list'); if (!m || !l) return null; const a = m.getBoundingClientRect(), b = l.getBoundingClientRect(); return a.left + a.width / 2 > b.left + b.width / 2 })
    OK(m === true, `RTL: el marcador de «En esta página» no pasa al lado inicial (${m})`)
    const link = p.locator('.g-nav-bar__list .g-nav-bar__link').nth(1)
    await link.hover(); await p.waitForTimeout(350)
    const lit = await p.evaluate(() => { const hl = document.querySelector('.g-nav-bar__highlight'); const a = [...document.querySelectorAll('.g-nav-bar__list .g-nav-bar__link')].find((x) => x.matches(':hover')); if (!hl || !a) return null; return Math.abs(hl.getBoundingClientRect().left - a.getBoundingClientRect().left) })
    OK(lit !== null && lit <= 1, `RTL: la luz de la barra no queda bajo el enlace (Δ ${lit})`)
    await ctx.close()
  }

  /* ---------- 5 · movimiento reducido ---------- */
  {
    const { ctx, p } = await open(browser, { reduced: 'reduce' })
    await p.locator('.g-nav-bar__list .g-nav-bar__link').nth(1).hover(); await p.waitForTimeout(200)
    const tr = await p.evaluate(() => {
      const q = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e) : null }
      const moving = (s) => !!s && s.transitionProperty.split(',').some((x, i) => /translate|transform|inline-size|width|rotate|inset|top|block-size/.test(x) && parseFloat(s.transitionDuration.split(',')[i] || s.transitionDuration) > 0.011)
      return { luz: moving(q('.g-nav-bar__highlight')), marca: moving(q('.g-sidebar__mark')), marcador: moving(q('.site-aside .g-page-index__marker')), chevron: moving(q('.g-sidebar--appearance-index .g-sidebar__group-title > .g-sidebar__chevron > svg')), grupo: moving(q('.g-sidebar--appearance-index .g-sidebar__group')) }
    })
    for (const [k, v] of Object.entries(tr)) OK(!v, `reducido: ${k} sigue con desplazamiento o giro`)
    await p.locator('.site-search').click(); await p.waitForTimeout(150)
    const cm = await p.evaluate(() => { const els = [...document.querySelectorAll('#site-search-surface, #site-search-surface *')].filter((e) => e.getClientRects().length).slice(0, 200); return els.filter((e) => { const s = getComputedStyle(e); return (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.011) || s.transitionProperty.split(',').some((x, i) => /translate|transform|scale/.test(x) && parseFloat(s.transitionDuration.split(',')[i] || s.transitionDuration) > 0.011) }).map((e) => e.className + '') })
    OK(!cm.length, `reducido: la búsqueda se mueve (${cm.slice(0, 3)})`)
    await ctx.close()
  }

  /* ---------- 6 · forced-colors (solo Chromium lo emula) ---------- */
  if (name === 'chromium') {
    const { ctx, p } = await open(browser, {})
    await p.emulateMedia({ forcedColors: 'active' }); await p.waitForTimeout(300)
    await p.mouse.move(700, 500); await p.mouse.wheel(0, 900); await p.waitForTimeout(700)
    const fc = await p.evaluate(() => {
      const paint = (e) => { if (!e || !L.visible(e)) return false; const s = getComputedStyle(e); return (L.parse(s.backgroundColor)[3] > 0 && s.forcedColorAdjust === 'none') || (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || ['Top', 'Left', 'Right', 'Bottom'].some((k) => s['border' + k + 'Style'] !== 'none' && parseFloat(s['border' + k + 'Width']) > 0) || L.parse(s.backgroundColor)[3] > 0 }
      const cur = document.querySelector('.g-nav-bar__list .g-nav-bar__link[aria-current]')
      const cs = cur && getComputedStyle(cur)
      return {
        barra: !cur || cs.textDecorationLine !== 'none' || paint(cur) || paint(cur.querySelector('*')) || parseInt(cs.fontWeight) >= 600,
        marca: paint(document.querySelector('.g-sidebar__mark')),
        marcador: paint(document.querySelector('.site-aside .g-page-index__marker')),
        banda: getComputedStyle(document.querySelector('.g-app-shell__header')).borderBottomStyle !== 'none' || getComputedStyle(document.querySelector('.g-nav-bar')).borderBottomStyle !== 'none'
      }
    })
    for (const [k, v] of Object.entries(fc)) OK(v, `forced-colors: ${k} sin señal propia`)
    await p.evaluate(() => scrollTo(0, 0))
    await p.locator('.site-search').click(); await p.keyboard.type('combo')
    await p.waitForSelector('#site-search-surface .g-combobox__option', { timeout: 30000 }).catch(() => {})
    await p.keyboard.press('ArrowDown'); await p.waitForTimeout(250)
    const act = await p.evaluate(() => { const ad = document.activeElement.getAttribute('aria-activedescendant'); const o = ad && document.getElementById(ad); if (!o) return null; const s = getComputedStyle(o); return s.outlineStyle !== 'none' || L.parse(s.backgroundColor)[3] > 0 || ['Top', 'Left'].some((k) => s['border' + k + 'Style'] !== 'none') || s.forcedColorAdjust === 'none' })
    OK(act === true, `forced-colors: la opción activa de la búsqueda sin señal (${act})`)
    await ctx.close()
  }

  /* ---------- 7 · SSR = hidratado ---------- */
  for (const w of [1280, 375]) {
    const a = await open(browser, { w })
    const post = await a.p.evaluate(frameBoxes); await a.ctx.close()
    const b = await open(browser, { w, js: false })
    const pre = await b.p.evaluate(frameBoxes); await b.ctx.close()
    OK(pre.h <= 0 && post.h <= 0, `SSR ${w}: desplazamiento horizontal ${pre.h} / ${post.h}`)
    for (const k of new Set([...Object.keys(pre.boxes), ...Object.keys(post.boxes)])) {
      const x = pre.boxes[k], y = post.boxes[k]
      if (!x || !y) { OK(false, `SSR ${w}: «${k}» ${x ? 'desaparece' : 'aparece'} al hidratar`); continue }
      const d = Math.max(...x.map((v, i) => Math.abs(v - y[i])))
      OK(d <= 1, `SSR ${w}: «${k}» se mueve ${fmt(d)} px (${x} → ${y})`)
    }
  }
  await browser.close()
}

console.log(`\n${total - failed}/${total} comprobaciones`)
for (const [k, [n, f]] of Object.entries(per)) console.log(`  ${k}: ${n - f}/${n}`)
if (notes.size) console.log('\nNotas:\n- ' + [...notes].join('\n- '))
if (fails.length) { console.log('\nFallos:\n- ' + fails.join('\n- ')); process.exitCode = 1 }
