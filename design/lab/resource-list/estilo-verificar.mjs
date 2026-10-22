// Verificación de coco sobre el banco de GResourceList (design/lab/resource-list/estilo-banco.html): CSS real del block
// (packages/blocks/src/components.css → layer(grana.blocks)) y de las enmiendas de la v1 en dist/grana.css (#787, #789,
// #790, #797), con GPageHeader, GTable, GMenu, GTag, GInput, GBtn y GEmpty reales de dist/.
// Mide: análisis estático del CSS del block y del registro; geometría (alineación Δ0 del h1 con acciones, facetas, frase y
// tabla; distancia descripción → acción igual que la base, #786; facetas en una fila en estrecho; dianas ≥ 24 / ≥ 44 con
// puntero grueso; barra de la tabla de alto constante en reposo, con selección y armada; recuento a cero oculto pero en el
// árbol; sin desplazamiento horizontal a 360 y 390); foco visible; la palabra nueva (fundido solo tras elegir en el hueco,
// nada al montar, nada con movimiento reducido); RTL; colores forzados (Chromium); contraste en el tema por defecto y los
// once generados (claro y oscuro); enmiendas de GMenu (motivo, par armado, fila de búsqueda) y de la pila de GFab (pista y
// juntarse) sobre marcado estático; GPageHeader con pestañas sin cambios; consola limpia.
// Ejecutar desde la raíz del repo (requiere packages/vue/dist):  GRANA_PW_PORT=4209 node design/lab/resource-list/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --themes=all|base  --verbose  --shots (capturas en estilo-capturas/)
import http from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4209, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/resource-list/estilo-banco.html`
const SHOTS = join(ROOT, 'design/lab/resource-list/estilo-capturas')
if (args.shots) await mkdir(SHOTS, { recursive: true })

const GEN = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
let total = 0, failed = 0
const fails = [], notes = [], tally = {}
const ok = (cond, msg, scope = 'estático') => { total++; tally[scope] = tally[scope] || [0, 0]; tally[scope][1]++; if (cond) tally[scope][0]++; else { failed++; fails.push(`[${scope}] ${msg}`) } if (args.verbose) console.log(cond ? 'ok   ' : 'FALLA', `[${scope}]`, msg) }
const note = (s) => notes.push(s)

/* ---------- 0 · Análisis estático ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/blocks/src/blocks/GResourceList/GResourceList.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), 'block: sin colores literales')
  const named = [...css.matchAll(/(?:color|background(?:-color)?|outline[\w-]*|border[\w-]*)\s*:[^;]*\b(CanvasText|Canvas|Highlight|ButtonText|ButtonFace|GrayText|LinkText|red|blue|black|white)\b/g)].map((m) => m[1])
  ok(named.every((w) => ['ButtonText', 'Highlight'].includes(w)) && /@media \(forced-colors: active\) \{[\s\S]*ButtonText/.test(css), 'block: colores del sistema solo dentro de forced-colors: ' + named)
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'block: sin var() con respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'block: sin @layer propio ni !important')
  const vars = [...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1])
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'block: solo var(--g-*) y var(--_*)')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  const defined = new Set([...defaults.matchAll(/(--g-[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
  const missing = [...new Set(vars.filter((v) => v.startsWith('--g-') && !defined.has(v)))]
  ok(!missing.length, 'block: todos los tokens existen en defaults.css ' + missing)
  const allowed = ['--g-color-text', '--g-color-text-muted', '--g-color-border-control', '--g-color-neutral-soft', '--g-color-focus']
  const colors = [...new Set(vars.filter((v) => v.startsWith('--g-color')))]
  ok(colors.every((v) => allowed.includes(v)), 'block: tokens de color solo los de §55: ' + colors.filter((v) => !allowed.includes(v)))
  const own = new Set([...css.matchAll(/(--_[\w-]+)\s*:/g)].map((m) => m[1]))
  ok(![...new Set(vars.filter((v) => v.startsWith('--_') && !own.has(v)))].length, 'block: solo lee alias que declara')
  const px = [...css.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
  ok(px.every((p) => ['44px', '24px', '1px', '-1px'].includes(p)), 'block: medidas literales permitidas (24, 44, texto oculto) ' + px)
  ok(!/\d(?:rem|em|ch|vh|vw|ms|s)\b/.test(css.replace(/inset\(50%\)/, '')), 'block: sin rem/em/ch/vh/vw/ms literales')
  const rootRules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].filter(([, sel]) => /^\s*\.g-resource-list(\.is-narrow)?\s*$/.test(sel))
  ok(rootRules.length && rootRules.every(([, , b]) => !/\b(transform|translate|scale|rotate|filter|backdrop-filter|perspective|contain|container-type|will-change)\s*:/.test(b)), 'block: la raíz no lleva propiedades-trampa (regla 7 de «Pegado» de GPageHeader)')
  const structural = [...css.replace(/\{[^}]*\}/g, '{}').matchAll(/>\s*(\*|:[\w-]+(?:\([^)]*\)*)?)/g)].map((m) => m[1]).filter((x) => !/^:not\(:where\(\.g-tooltip\)\)/.test(x))
  ok(!structural.length, 'block: selectores de hijos excluyen .g-tooltip (#383) ' + structural)
  ok(!/\.g-(table|menu|tag|page-header|input|btn|empty|dialog)__/.test(css), 'block: no estiliza piezas internas de lo que compone')
  ok(/@media \(prefers-reduced-motion: reduce\)/.test(css) && /@media \(forced-colors: active\)/.test(css) && /@media \(pointer: coarse\)/.test(css), 'block: reducido, forzados y táctil presentes')
  ok(/@media \(prefers-reduced-motion: no-preference\) \{\s*\.g-resource-list__blank-text\.is-entering \{\s*animation: g-resource-list-word var\(--g-duration-fast\) var\(--g-ease-out\)/.test(css), 'block: el fundido de la palabra (is-entering) solo con no-preference, fast + ease-out')
  const reg = (await readFile(join(ROOT, 'packages/blocks/src/components.css'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '').trim()
  ok(/^@layer grana\.defaults, grana\.components, grana\.blocks;\s*@import url\("\.\/blocks\/GResourceList\/GResourceList\.css"\) layer\(grana\.blocks\);$/.test(reg), 'registro: declaración de capas primero e import en layer(grana.blocks)')
  // Enmiendas de la v1: el CSS nuevo no trae respaldos ni literales
  for (const [f, re] of [['GMenu', /\/\* Motivo de no disponible[\s\S]*?(?=\/\* Peligroso)|\/\* -{10} Buscar al escribir[\s\S]*?(?=\/\* -{10} Grupo)/g], ['GTable', /\/\* Recuento a cero[\s\S]*?(?=\/\* Controles que)/g], ['GFab', /\/\* Pila que filtra[\s\S]*?(?=\/\* -{10} Peligrosas)/g], ['GPageHeader', /\/\* Sin pestañas \(#787 b\)[\s\S]*?(?=\.g-page-header__actions \{)/g]]) {
    const src = (await readFile(join(ROOT, `packages/vue/src/components/${f}/${f}.css`), 'utf8'))
    const blocks = [...src.matchAll(re)].map((m) => m[0].replace(/\/\*[\s\S]*?\*\//g, '')).join('\n')
    ok(blocks.length > 50, `${f}: bloque de la enmienda presente`)
    ok(!/var\(\s*--[\w-]+\s*,/.test(blocks) && !/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(blocks), `${f}: enmienda sin respaldos ni colores literales`)
    const p2 = [...blocks.matchAll(/(-?\d*\.?\d+)px/g)].map((m) => m[0])
    ok(p2.every((p) => ['44px', '24px', '1px', '-1px'].includes(p)), `${f}: enmienda sin medidas literales ${p2}`)
  }
}

/* ---------- Utilidades del navegador ---------- */
const LIB = `
window.__c = (() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = s; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (f, b) => [0, 1, 2].map((i) => f[i] * f[3] + b[i] * (1 - f[3])).concat(1)
  const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const bgOf = (el) => { const stack = []; for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c[3] > 0) stack.push(c); if (c[3] >= 1) break } let acc = rgba(getComputedStyle(document.body).backgroundColor); if (acc[3] < 1) acc = [255, 255, 255, 1]; for (const c of stack.reverse()) acc = over(c, acc); return acc }
  const tok = (name) => { const p = document.createElement('i'); p.style.color = 'var(' + name + ')'; document.body.appendChild(p); const c = rgba(getComputedStyle(p).color); p.remove(); return c }
  const pair = (fg, bg) => cr(over(fg, bg), bg)
  const txt = (el, bgEl) => { const b = bgOf(bgEl || el); return pair(rgba(getComputedStyle(el).color), b) }
  return { rgba, over, cr, bgOf, tok, pair, txt }
})()`

async function open (browser, q = '', vp = { width: 1280, height: 860 }, extra = {}) {
  const ctx = await browser.newContext({ viewport: vp, ...extra })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/favicon|downloadable font|Layout was forced before the page was fully loaded/.test(m.text())) errs.push(m.text().slice(0, 200)) })
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(BASE + (q ? '?' + q : ''), { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__rl && window.__rl.ready, null, { timeout: 90000 })
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(LIB)
  await page.waitForTimeout(250)
  return { ctx, page, errs }
}
const PHONE = (w = 390) => [{ width: w, height: 844 }, { hasTouch: true, isMobile: true }]

// Geometría de la pantalla del block
const geo = (page) => page.evaluate(() => {
  const r = (el) => el && el.getBoundingClientRect()
  const rtl = document.documentElement.dir === 'rtl'
  const edge = (el) => { const b = r(el); return b ? (rtl ? b.right : b.left) : null }
  const h1 = document.querySelector('h1')
  const range = document.createRange(); const ph = document.querySelector('.g-resource-list__phrase')
  let phraseStart = null
  if (ph) { const t = [...ph.childNodes].find((n) => n.nodeType === 3 && n.textContent.trim()); const a0 = t.textContent.search(/\S/); const w0 = t.textContent.slice(a0).search(/\s|$/); range.setStart(t, a0); range.setEnd(t, a0 + w0); const b = range.getBoundingClientRect(); phraseStart = rtl ? r(ph).right : b.left } // en RTL, la caja: el texto del banco es latino y el bidi lo reordena
  const h1Range = document.createRange(); h1Range.selectNodeContents(h1); const hb = h1Range.getClientRects()[0]
  const tags = [...document.querySelectorAll('.g-resource-list__facets > .g-tag')]
  const bar = document.querySelector('.g-table__bar')
  const actionsFirst = document.querySelector('.g-page-header__actions-home .g-btn')
  const desc = document.querySelector('.g-page-header__desc')
  const solid = [...document.querySelectorAll('.g-btn--variant-solid')].filter((b) => b.offsetParent && !b.classList.contains('g-btn--color-danger'))
  return {
    h1: rtl ? hb.right : hb.left,
    h1Box: edge(h1),
    actions: edge(actionsFirst),
    descToAction: actionsFirst && desc ? r(actionsFirst).top - r(desc).bottom : null,
    facets: edge(tags[0]),
    facetRows: new Set(tags.map((t) => Math.round(r(t).top))).size,
    phrase: phraseStart,
    search: edge(document.querySelector('.g-resource-list__search')),
    table: edge(document.querySelector('.g-table')),
    bar: bar ? { h: r(bar).height, top: r(bar).top, rows: new Set([...bar.querySelectorAll('.g-btn, .g-resource-list__total, .g-table__count:not(.is-empty), label')].filter((e) => e.offsetParent).map((e) => Math.round(r(e).top))).size } : null,
    firstRowTop: r(document.querySelector('.g-table__row, .g-table tbody tr'))?.top ?? null,
    blanks: [...document.querySelectorAll('.g-resource-list__blank')].map((b) => ({ h: r(b).height, w: r(b).width })),
    tags: tags.map((t) => { const body = t.querySelector('.g-tag__body') || t; const a = getComputedStyle(body, '::after'); return { h: r(body).height, hit: Math.max(r(body).height, parseFloat(a.height) || 0) } }),
    solidBrand: solid.length,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    count: (() => { const c = document.querySelector('.g-table__count'); if (!c) return null; const b = r(c); return { role: c.getAttribute('role'), empty: c.classList.contains('is-empty'), w: b.width, h: b.height, text: c.textContent.trim(), clip: getComputedStyle(c).clipPath, display: getComputedStyle(c).display } })(),
    narrow: document.querySelector('.g-resource-list')?.classList.contains('is-narrow'),
    h1Count: document.querySelectorAll('h1').length,
    labelled: document.querySelector('.g-table__table, table')?.getAttribute('aria-labelledby'),
    h1Id: h1.id
  }
})

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  const S = engine
  const allErrs = []
  const track = (o) => { allErrs.push(...o.errs.map((e) => `${engine}: ${e}`)); return o }

  /* ---------- 1 · Escritorio, tema por defecto ---------- */
  {
    const { ctx, page, errs } = track(await open(browser))
    const g = await geo(page)
    ok(g.h1Count === 1 && g.labelled === g.h1Id, `un h1 y la tabla nombrada por él (${g.labelled} / ${g.h1Id})`, S)
    ok(!g.narrow, 'escritorio: sin is-narrow a 1280', S)
    const d = (a, b) => Math.abs(a - b)
    ok(d(g.actions, g.h1Box) <= 0.5, `#787 b: acción principal alineada con el h1 sin pestañas (Δ ${d(g.actions, g.h1Box).toFixed(2)})`, S)
    ok(d(g.facets, g.h1Box) <= 0.5 && d(g.table, g.h1Box) <= 0.5 && d(g.phrase, g.h1) <= 1, `Δ0: h1 ${g.h1Box} · facetas ${g.facets} · frase ${g.phrase?.toFixed(1)} (tinta) · tabla ${g.table}`, S)
    ok(g.solidBrand === 1, `una sola acción sólida de marca a la vista (${g.solidBrand})`, S)
    ok(g.facetRows === 1, 'escritorio: facetas en una fila', S)
    ok(g.blanks.length === 4 && g.blanks.every((b) => b.h >= 24), `huecos ≥ 24 px (${g.blanks.map((b) => b.h.toFixed(1))})`, S)
    ok(g.tags.every((t) => t.hit >= 24), 'facetas ≥ 24 px', S)
    ok(!g.overflow, 'sin desplazamiento horizontal a 1280', S)
    ok(g.count && g.count.role === 'status' && g.count.empty && g.count.w <= 1 && /^(0\b|$)/.test(g.count.text) && g.count.display !== 'none', `#789: recuento a cero montado, vacío y oculto con el patrón (w ${g.count?.w})`, S)
    const rest = g
    // Base: GPageHeader solo con los mismos props
    const base = await open(browser, 'view=base'); track(base)
    const gb = await geo(base.page)
    ok(d(gb.descToAction, g.descToAction) <= 1, `#786: descripción → acción igual que la base (block ${g.descToAction.toFixed(1)} · base ${gb.descToAction.toFixed(1)})`, S)
    await base.ctx.close()
    // Selección y armado: la barra no cambia de alto y la primera fila no se mueve
    for (const st of ['selected', 'armed']) {
      const o = track(await open(browser, 'state=' + st))
      const gs = await geo(o.page)
      ok(d(gs.bar.h, rest.bar.h) <= 0.5 && d(gs.firstRowTop, rest.firstRowTop) <= 0.5, `#789: barra de alto constante en «${st}» (Δ alto ${d(gs.bar.h, rest.bar.h).toFixed(2)}, Δ fila ${d(gs.firstRowTop, rest.firstRowTop).toFixed(2)})`, S)
      ok(gs.count && !gs.count.empty && gs.count.text === '2 seleccionadas' && gs.count.w > 1, `«${st}»: el recuento se ve con selección`, S)
      if (args.shots && engine === 'chromium') await o.page.locator('.g-table__bar').screenshot({ path: join(SHOTS, `barra-${st}.png`) })
      await o.ctx.close()
    }
    // Foco visible en un hueco (teclado)
    // Modalidad de teclado y luego el foco en el hueco (WebKit no lleva Tab a los botones por defecto en macOS)
    await page.keyboard.press('Tab')
    await page.evaluate(() => document.querySelector('[data-blank="estado"]').focus())
    const f = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return { w: parseFloat(s.outlineWidth), style: s.outlineStyle, c: window.__c.pair(window.__c.rgba(s.outlineColor), window.__c.bgOf(document.activeElement.parentElement)) } })
    ok(f.w >= 2 && f.style === 'solid' && f.c >= 3, `foco del hueco: contorno ${f.w}px ${f.style}, ${f.c.toFixed(2)}:1`, S)
    // La palabra nueva: nada al montar; fundido al elegir en el hueco
    const mountAnims = await page.evaluate(() => document.getAnimations().filter((a) => a.effect?.target?.classList?.contains('g-resource-list__blank-text')).length)
    ok(mountAnims === 0, `nada se anima al montar (${mountAnims})`, S)
    // Un observador recoge las animaciones de la palabra en el mismo cuadro en que entra (la transición dura fast)
    const watchWord = (p, id) => p.evaluate((id) => { window.__an = null; const host = document.querySelector(`[data-blank="${id}"]`); const mo = new MutationObserver(() => { mo.disconnect(); requestAnimationFrame(() => { const t = host.querySelector('.g-resource-list__blank-text'); window.__an = t.getAnimations().map((a) => a.transitionProperty || a.animationName) }) }); mo.observe(host, { childList: true, subtree: true }) }, id)
    await page.locator('[data-blank="estado"]').click()
    await watchWord(page, 'estado')
    await page.getByRole('menuitemradio', { name: 'Destilando' }).click()
    const fade = await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => { const t = document.querySelector('[data-blank="estado"] .g-resource-list__blank-text'); res({ an: window.__an || [], focus: document.activeElement === t.parentElement, text: t.textContent }) })))
    ok(fade.text === 'destilando' && fade.focus, `elegir devuelve el foco al hueco, que dice la palabra nueva («${fade.text}»)`, S)
    ok(fade.an.includes('g-resource-list-word'), `la palabra nueva entra con fundido (${fade.an})`, S)
    // Pulsar una faceta cambia la palabra de su hueco sin fundido (no es el gesto en el hueco)
    await watchWord(page, 'estado')
    await page.locator('[data-facet="fermentando"] button').first().click()
    const fac = await page.evaluate(() => new Promise((res) => setTimeout(() => res({ an: window.__an, text: document.querySelector('[data-blank="estado"] .g-resource-list__blank-text').textContent }), 200)))
    ok(fac.text === 'fermentando' && Array.isArray(fac.an) && !fac.an.length, `faceta → la palabra del hueco cambia sin fundido («${fac.text}», ${fac.an})`, S)
    if (args.shots && engine === 'chromium') { await page.mouse.move(0, 0); await page.screenshot({ path: join(SHOTS, 'escritorio.png') }) }
    // Facetas de alternar tras pulsar: el hueco dice el valor (sin fundido: no tiene el foco)
    await ctx.close()
    // Movimiento reducido
    const red = track(await open(browser, '', undefined, { reducedMotion: 'reduce' }))
    await red.page.locator('[data-blank="agave"]').click()
    await watchWord(red.page, 'agave')
    await red.page.getByRole('menuitemradio', { name: 'Tobalá' }).click()
    const an2 = await red.page.evaluate(() => new Promise((res) => requestAnimationFrame(() => res(window.__an === null ? -1 : window.__an.length))))
    ok(an2 === 0, `movimiento reducido: la palabra aparece sin fundido (${an2})`, S)
    await red.ctx.close()
    // Con pestañas: las acciones siguen al final del zócalo (sin cambio para quien tiene pestañas)
    const tb = track(await open(browser, 'tabs=1'))
    const t = await tb.page.evaluate(() => { const a = document.querySelector('.g-page-header__actions-home').getBoundingClientRect(); const h = document.querySelector('.g-page-header').getBoundingClientRect(); return h.right - a.right })
    ok(Math.abs(t - 24) <= 0.5, `con pestañas las acciones siguen al final (a ${t.toFixed(1)} px del borde = inset)`, S)
    await tb.ctx.close()
  }

  /* ---------- 2 · Teléfono (390 y 360, puntero grueso) ---------- */
  for (const w of [390, 360]) {
    const o = track(await open(browser, '', ...PHONE(w)))
    const g = await geo(o.page)
    const d = (a, b) => Math.abs(a - b)
    ok(g.narrow, `${w}: is-narrow`, S)
    ok(d(g.actions, g.h1Box) <= 0.5 && d(g.facets, g.h1Box) <= 0.5 && d(g.table, g.h1Box) <= 0.5 && d(g.phrase, g.h1) <= 1 && d(g.search, g.h1Box) <= 0.5, `${w}: Δ0 de h1, acción, facetas, frase, búsqueda y tabla (${[g.h1Box, g.actions, g.facets, g.phrase?.toFixed(1), g.search, g.table].join(' / ')})`, S)
    ok(g.facetRows === 1, `${w}: facetas en una fila (plegadas en su hueco)`, S)
    ok(g.blanks.every((b) => b.h >= 44), `${w}: huecos ≥ 44 px con puntero grueso (${g.blanks.map((b) => b.h.toFixed(1))})`, S)
    ok(g.tags.every((t) => t.hit >= 44), `${w}: facetas ≥ 44 px de diana`, S)
    ok(!g.overflow, `${w}: sin desplazamiento horizontal`, S)
    const base = track(await open(browser, 'view=base', ...PHONE(w)))
    const gb = await geo(base.page)
    ok(d(gb.descToAction, g.descToAction) <= 1, `${w}: #786 descripción → acción igual que la base (${g.descToAction.toFixed(1)} / ${gb.descToAction.toFixed(1)})`, S)
    await base.ctx.close()
    for (const [st, q] of [['selected', 'state=selected'], ['armed', 'state=armed'], ['selected sin iconos', 'state=selected&bulkicons=0']]) {
      const s = track(await open(browser, q, ...PHONE(w)))
      const gs = await geo(s.page)
      const same = d(gs.bar.h, g.bar.h) <= 0.5 && d(gs.firstRowTop, g.firstRowTop) <= 0.5
      if (st === 'selected sin iconos') note(`${engine} ${w}px: con texto en «Dar de baja» y «Quitar selección» la barra pasa de ${g.bar.h.toFixed(0)} a ${gs.bar.h.toFixed(0)} px (${gs.bar.rows} líneas): ${same ? 'cabe' : 'NO cabe → solo icono (salida del contrato)'}`)
      // Hallazgo H1 (para lima): en tarjetas la barra de GTable ya lleva «Seleccionar las tinas de esta página»; con
      // selección se suma el recuento visible y la barra pasa a dos líneas aunque las masivas sean de solo icono. No se
      // arregla desde el block (no estiliza .g-table__*): se mide y se anota
      else note(`${engine} ${w}px «${st}» (masivas de solo icono): barra ${g.bar.h.toFixed(0)} → ${gs.bar.h.toFixed(0)} px, primera fila Δ ${d(gs.firstRowTop, g.firstRowTop).toFixed(1)} px: ${same ? 'alto constante' : 'NO constante (H1)'}`)
      ok(!gs.overflow, `${w} «${st}»: sin desplazamiento horizontal`, S)
      if (args.shots && engine === 'chromium' && w === 360 && st === 'armed') await s.page.screenshot({ path: join(SHOTS, 'telefono-360-armada.png') })
      await s.ctx.close()
    }
    if (args.shots && engine === 'chromium' && w === 390) await o.page.screenshot({ path: join(SHOTS, 'telefono-390.png') })
    await o.ctx.close()
  }

  /* ---------- 3 · RTL ---------- */
  {
    const o = track(await open(browser, 'rtl=1'))
    const g = await geo(o.page)
    const d = (a, b) => Math.abs(a - b)
    ok(d(g.actions, g.h1Box) <= 0.5 && d(g.facets, g.h1Box) <= 0.5 && d(g.table, g.h1Box) <= 0.5 && d(g.phrase, g.h1Box) <= 1, `RTL: Δ0 en el borde derecho (${[g.h1Box, g.actions, g.facets, g.phrase?.toFixed(1), g.table].join(' / ')})`, S)
    ok(!g.overflow, 'RTL: sin desplazamiento horizontal', S)
    await o.ctx.close()
  }

  /* ---------- 4 · Enmiendas de GMenu (marcado estático) ---------- */
  {
    const o = track(await open(browser, 'view=menu'))
    const m = await o.page.evaluate(() => {
      const r = (s) => document.querySelector(s).getBoundingClientRect()
      const lab = (id) => document.querySelector(`#${id} .g-menu__label`).getBoundingClientRect()
      const rea = (id) => { const e = document.querySelector(`#${id} .g-menu__reason`); const b = e.getBoundingClientRect(); return { left: b.left + parseFloat(getComputedStyle(e).paddingInlineStart), top: b.top } }
      const rr = document.querySelector('#mr-plain .g-menu__reason')
      const C = window.__c
      const surface = C.tok('--g-color-surface'), sunken = C.tok('--g-color-surface-sunken')
      const okBtn = document.getElementById('ma-ok'), cancel = document.getElementById('ma-cancel')
      return {
        iconItem: { dx: Math.abs(rea('mr-edit').left - lab('mr-edit').left), below: rea('mr-edit').top >= lab('mr-edit').bottom - 1 },
        plainItem: { dx: Math.abs(rea('mr-plain').left - lab('mr-plain').left), below: rea('mr-plain').top >= lab('mr-plain').bottom - 1 },
        reasonDeco: getComputedStyle(rr).textDecorationLine,
        reasonC: [C.pair(C.rgba(getComputedStyle(rr).color), surface), C.pair(C.rgba(getComputedStyle(rr).color), sunken)],
        armedW: [r('#ma-li').width, document.querySelector('#ma-edit').closest('li').getBoundingClientRect().width],
        armedH: [r('#ma-ok').height, r('#ma-cancel').height, r('#ma-edit').height],
        okC: C.pair(C.rgba(getComputedStyle(okBtn).color), C.rgba(getComputedStyle(okBtn).backgroundColor)),
        okEdge: C.pair(C.rgba(getComputedStyle(okBtn).borderTopColor), surface),
        cancelEdge: C.pair(C.rgba(getComputedStyle(cancel).borderTopColor), surface),
        find: { h: r('#mf-find').height, item: r('#mf-1').height, pos: getComputedStyle(document.getElementById('mf-find')).position, c: C.pair(C.rgba(getComputedStyle(document.getElementById('mf-find')).color), surface), q: C.pair(C.rgba(getComputedStyle(document.querySelector('.g-menu__find-query')).color), sunken) },
        hidden: [...document.querySelectorAll('#m-find li[hidden]')].every((li) => getComputedStyle(li).display === 'none')
      }
    })
    ok(m.iconItem.below && m.iconItem.dx <= 0.5 && m.plainItem.below && m.plainItem.dx <= 0.5, `#790: motivo en la segunda línea, en la columna de la etiqueta (Δ ${m.iconItem.dx.toFixed(2)} / ${m.plainItem.dx.toFixed(2)})`, S)
    ok(m.reasonDeco === 'none', '#790: el motivo no se tacha', S)
    ok(m.reasonC.every((c) => c >= 4.5), `#790: motivo ≥ 4,5:1 sobre surface y surface-sunken (${m.reasonC.map((c) => c.toFixed(2))})`, S)
    ok(Math.abs(m.armedW[0] - m.armedW[1]) <= 0.5, `#790: la fila armada conserva el ancho (${m.armedW.map((x) => x.toFixed(1))})`, S)
    ok(Math.abs(m.armedH[0] - m.armedH[2]) <= 0.5 && Math.abs(m.armedH[1] - m.armedH[2]) <= 0.5, `#790: el par mide lo que la fila, en una línea (${m.armedH.map((x) => x.toFixed(1))})`, S)
    ok(m.okC >= 4.5 && m.okEdge >= 3 && m.cancelEdge >= 3, `#790: confirmar ${m.okC.toFixed(2)}:1, contornos ${m.okEdge.toFixed(2)} / ${m.cancelEdge.toFixed(2)}:1`, S)
    ok(Math.abs(m.find.h - m.find.item) <= 0.5 && m.find.pos === 'sticky', `#797: fila de búsqueda pegada y del alto de un elemento (${m.find.h.toFixed(1)} / ${m.find.item.toFixed(1)})`, S)
    ok(m.find.c >= 4.5 && m.find.q >= 4.5, `#797: pista ${m.find.c.toFixed(2)}:1, lo escrito ${m.find.q.toFixed(2)}:1`, S)
    ok(m.hidden, '#797: lo que no coincide no se pinta', S)
    if (args.shots && engine === 'chromium') await o.page.screenshot({ path: join(SHOTS, 'menu-enmiendas.png'), clip: { x: 0, y: 70, width: 980, height: 260 } })
    await o.ctx.close()
  }

  /* ---------- 5 · Pila de GFab (marcado estático) ---------- */
  {
    const o = track(await open(browser, 'view=fab', { width: 600, height: 600 }))
    const fb = await o.page.evaluate(() => {
      const list = document.getElementById('fab-list')
      const lis = [...list.children].filter((li) => getComputedStyle(li).display !== 'none')
      const find = document.getElementById('fab-find')
      const C = window.__c
      const cs = getComputedStyle(find)
      list.classList.add('is-gathering')
      const li = document.querySelector('#f4').parentElement
      li.classList.add('is-shifted'); li.style.setProperty('--_shift', '-40px')
      const shifted = getComputedStyle(li).translate
      const shiftedT = getComputedStyle(li).transitionDuration
      li.classList.remove('is-shifted')
      const t = getComputedStyle(li)
      return { farthest: lis[0] === find, n: lis.length, c: C.pair(C.rgba(cs.color), C.tok('--g-color-surface')), edge: C.pair(C.rgba(cs.borderTopColor), C.tok('--g-color-bg')), shifted, shiftedT, dur: t.transitionDuration, delay: t.transitionDelay, prop: t.transitionProperty }
    })
    ok(fb.farthest && fb.n === 3, `#797: la pista va en la píldora más alejada del FAB y solo quedan las que coinciden (${fb.n})`, S)
    ok(fb.c >= 4.5 && fb.edge >= 3, `#797: pista de la pila ${fb.c.toFixed(2)}:1, contorno ${fb.edge.toFixed(2)}:1`, S)
    ok(/-40px/.test(fb.shifted) && /^0s/.test(fb.shiftedT), `#797: is-shifted parte del sitio de antes sin transición (${fb.shifted}, ${fb.shiftedT})`, S)
    ok(fb.prop.includes('translate') && /0\.12s/.test(fb.dur) && /^0s(, 0s)*$/.test(fb.delay), `#797: se juntan en fast + ease-out sin escalonado (${fb.prop} ${fb.dur} ${fb.delay})`, S)
    await o.ctx.close()
    const r = track(await open(browser, 'view=fab', { width: 600, height: 600 }, { reducedMotion: 'reduce' }))
    const tr = await r.page.evaluate(() => { const li = document.querySelector('#f4').parentElement; li.classList.add('is-shifted'); li.style.setProperty('--_shift', '-40px'); return getComputedStyle(li).translate })
    ok(tr === 'none', `#797: con movimiento reducido no se desplazan (${tr})`, S)
    await r.ctx.close()
  }

  /* ---------- 6 · Contraste en los temas (claro y oscuro) ---------- */
  const themes = engine !== 'chromium' || args.themes === 'base' ? [''] : ['', ...GEN]
  for (const th of themes) for (const dark of [false, true]) {
    const q = [th && 'theme=' + th, dark && 'dark=1'].filter(Boolean).join('&')
    const o = track(await open(browser, q))
    const c = await o.page.evaluate(() => {
      const C = window.__c
      const ph = document.querySelector('.g-resource-list__phrase')
      const bg = C.bgOf(ph)
      const blank = document.querySelector('.g-resource-list__blank:not(.is-set)')
      const set = document.querySelector('.g-resource-list__blank.is-set')
      const text = blank.querySelector('.g-resource-list__blank-text')
      const soft = C.over(C.tok('--g-color-neutral-soft'), bg)
      const total = document.querySelector('.g-resource-list__total')
      return {
        fixed: C.txt(ph), blank: C.txt(blank), set: C.txt(set),
        hover: C.pair(C.rgba(getComputedStyle(blank).color), soft),
        line: C.pair(C.rgba(getComputedStyle(text).textDecorationColor), bg),
        chev: C.pair(C.rgba(getComputedStyle(blank.querySelector('.g-resource-list__blank-chev')).color), bg),
        focus: C.pair(C.tok('--g-color-focus'), bg),
        total: C.txt(total),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      }
    })
    const name = (th || 'por defecto') + (dark ? ' oscuro' : ' claro')
    ok(c.fixed >= 4.5 && c.blank >= 4.5 && c.set >= 4.5 && c.hover >= 4.5 && c.total >= 4.5, `${name}: texto ≥ 4,5:1 (frase ${c.fixed.toFixed(2)}, hueco ${c.blank.toFixed(2)}, con valor ${c.set.toFixed(2)}, al pasar ${c.hover.toFixed(2)}, total ${c.total.toFixed(2)})`, S + ' · temas')
    ok(c.line >= 3 && c.chev >= 3 && c.focus >= 3, `${name}: raya ${c.line.toFixed(2)}, chevron ${c.chev.toFixed(2)}, foco ${c.focus.toFixed(2)} (≥ 3:1)`, S + ' · temas')
    if (args.shots && engine === 'chromium' && !th && dark) await o.page.screenshot({ path: join(SHOTS, 'escritorio-oscuro.png') })
    await o.ctx.close()
    if (engine === 'chromium' && (th === '' || th === 'grana')) {
      const mm = track(await open(browser, ['view=menu', q].filter(Boolean).join('&')))
      const m = await mm.page.evaluate(() => { const C = window.__c; const s = C.tok('--g-color-surface'), k = C.tok('--g-color-surface-sunken'); const rr = document.querySelector('.g-menu__reason'); const okb = document.getElementById('ma-ok'); return [C.pair(C.rgba(getComputedStyle(rr).color), s), C.pair(C.rgba(getComputedStyle(rr).color), k), C.pair(C.rgba(getComputedStyle(okb).color), C.rgba(getComputedStyle(okb).backgroundColor)), C.pair(C.rgba(getComputedStyle(okb).borderTopColor), s), C.pair(C.rgba(getComputedStyle(document.getElementById('mf-find')).color), s)] })
      ok(m[0] >= 4.5 && m[1] >= 4.5 && m[2] >= 4.5 && m[3] >= 3 && m[4] >= 4.5, `${name}: GMenu motivo ${m[0].toFixed(2)}/${m[1].toFixed(2)}, confirmar ${m[2].toFixed(2)}, contorno ${m[3].toFixed(2)}, pista ${m[4].toFixed(2)}`, S + ' · temas')
      await mm.ctx.close()
    }
  }

  /* ---------- 7 · Colores forzados (solo Chromium emula forced-colors) ---------- */
  if (engine === 'chromium') {
    const o = track(await open(browser, '', undefined, { forcedColors: 'active' }))
    await o.page.keyboard.press('Tab')
    await o.page.evaluate(() => document.querySelector('[data-blank="estado"]').focus())
    const fc = await o.page.evaluate(() => { const b = document.activeElement; const t = b.querySelector('.g-resource-list__blank-text'); return { line: getComputedStyle(t).textDecorationLine, style: getComputedStyle(t).textDecorationStyle, outline: getComputedStyle(b).outlineStyle, w: parseFloat(getComputedStyle(b).outlineWidth), chev: !!b.querySelector('.g-resource-list__blank-chev svg') } })
    ok(fc.line === 'underline' && fc.outline === 'solid' && fc.w >= 2 && fc.chev, `forced-colors: raya (${fc.line} ${fc.style}), chevron y foco visibles (${fc.w}px)`, S)
    await o.ctx.close()
  }

  ok(!allErrs.length, 'consola limpia ' + allErrs.slice(0, 3).join(' | '), S)
  await browser.close()
}

server.close()
console.log(`\nResultado: ${total - failed}/${total}`)
for (const [k, [a, b]] of Object.entries(tally)) console.log(`  ${k}: ${a}/${b}`)
if (fails.length) { console.log('\nFallos:'); fails.forEach((f) => console.log('  - ' + f)) }
if (notes.length) { console.log('\nNotas:'); notes.forEach((n) => console.log('  · ' + n)) }
process.exit(failed ? 1 : 0)
