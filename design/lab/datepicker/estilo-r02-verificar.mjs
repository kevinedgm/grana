// Verificación de coco sobre el banco de la r02 de GDatePicker (design/lab/datepicker/estilo-banco-r02.html), con el CSS
// real. Mide: análisis estático (sin literales nuevos, sin respaldos, keyframes g-datepicker-zoom-in/-out sin muelle);
// Δ 0 del escenario y de la cabecera entre días, meses y años en las tres densidades, en par de meses y con el tema de
// prueba; rejillas 3 × 4 que llenan la caja; objetivos ≥ 24 px (≥ 44 px con puntero grueso, Chromium); compacto con
// celda de 30 px y título body-sm; contraste de las marcas y textos (claro, oscuro, tema de prueba y los temas generados);
// franja que sigue (máscara en LTR y RTL, sin máscara en forced-colors); cifras del año de izquierda a derecha en RTL;
// zoom: escala de partida --g-press-scale y su inverso, press + ease-out, origen en la pieza (también RTL), reducido =
// fundido fast linear sin escala; hover solo en el estado que llega; hoja a 320 y 375 px con puntero grueso sin desborde.
// Ejecutar desde la raíz: GRANA_PW_PORT=4232 node design/lab/datepicker/estilo-r02-verificar.mjs [--engines=chromium]
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4232, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/datepicker/estilo-banco-r02.html`

let pass = 0; let fail = 0; const fails = []; const notes = []
const ok = (cond, msg) => { if (cond) pass++; else { fail++; fails.push(msg) } }

// ---------- Estático ----------
const css = await readFile(join(ROOT, 'packages/vue/src/components/GDatePicker/GDatePicker.css'), 'utf8')
const code = css.replace(/\/\*[\s\S]*?\*\//g, '')
ok(!/var\([^)]*,/.test(code.replace(/var\(--[\w-]+\)/g, '')), 'estático: ningún var() con respaldo')
ok(!/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(|oklch\(/i.test(code), 'estático: sin colores literales')
ok(!/\d+ms|\d+s\b/.test(code), 'estático: sin duraciones literales')
const lits = [...code.matchAll(/(?<![\w-])(\d*\.?\d+)px/g)].map((m) => m[1] + 'px')
ok(lits.every((l) => ['24px', '44px', '16px', '0px', '1px', '0.5px', '520px'].includes(l)), `estático: literales px permitidos (${[...new Set(lits)].join(' ')})`)
ok(/@keyframes g-datepicker-zoom-in/.test(code) && /@keyframes g-datepicker-zoom-out/.test(code), 'estático: keyframes zoom-in y zoom-out')
ok(!/ease-spring|ease-bounce/.test(code), 'estático: sin muelle ni rebote')
ok(!/@layer/.test(code), 'estático: sin @layer (lo pone el registro)')

const contrast = (a, b) => {
  const lum = ([r, g, bb]) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bb) }
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05)
}

async function measure (page) {
  return page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
    const rgb = (c, under = [255, 255, 255]) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = `rgb(${under})`; cx.fillRect(0, 0, 1, 1); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); return [...cx.getImageData(0, 0, 1, 1).data].slice(0, 3) }
    const surf = rgb(getComputedStyle(document.querySelector('#default-days .g-datepicker__surface')).backgroundColor, rgb(getComputedStyle(document.body).backgroundColor))
    const cs = (sel) => getComputedStyle(document.querySelector(sel))
    const box = (sel) => document.querySelector(sel).getBoundingClientRect()
    const ringOf = (sel) => { const m = cs(sel).boxShadow.match(/(rgba?\([^)]*\)|color\([^)]*\)|oklch\([^)]*\)|#[0-9a-f]+)/i); return m ? rgb(m[1], surf) : null }
    const out = { surf }
    for (const d of ['default', 'comfortable', 'compact']) {
      out[d] = {}
      for (const v of ['days', 'months', 'years']) {
        const id = `#${d}-${v}`
        out[d][v] = { stage: box(`${id} .g-datepicker__stage`).height, head: box(`${id} .g-datepicker__head`).height, surface: box(`${id} .g-datepicker__surface`), title: parseFloat(cs(`${id} .g-datepicker__title`).fontSize) }
      }
      out[d].cell = box(`#${d}-days .g-datepicker__day`).width
      out[d].nav = box(`#${d}-days .g-datepicker__nav`).height
      out[d].part = [...document.querySelectorAll(`#${d}-days .g-datepicker__title-part`)].map((b) => b.getBoundingClientRect()).map((r) => Math.min(r.width, r.height))
      out[d].picks = [...document.querySelectorAll(`#${d}-months .g-datepicker__pick, #${d}-years .g-datepicker__pick`)].map((b) => b.getBoundingClientRect()).map((r) => [r.width, r.height])
      const tbl = box(`#${d}-months .g-datepicker__grid--months`); const st = box(`#${d}-months .g-datepicker__stage`)
      out[d].fill = { tbl: tbl.height, stage: st.height, tw: tbl.width, sw: st.width }
      const rows = [...document.querySelectorAll(`#${d}-years .g-datepicker__grid--years tr`)].map((r) => r.getBoundingClientRect().height)
      out[d].rows = rows
      out[d].hint = box(`#${d}-years .g-datepicker__years-hint`)
      out[d].yearsTable = box(`#${d}-years .g-datepicker__grid--years`)
      out[d].yearsStage = box(`#${d}-years .g-datepicker__stage`)
    }
    out.pair = { days: box('#pair-days .g-datepicker__surface'), months: box('#pair-months .g-datepicker__surface'), daysStage: box('#pair-days .g-datepicker__stage').height, monthsStage: box('#pair-months .g-datepicker__stage').height }
    // Contraste
    const pickBg = (sel) => rgb(cs(sel).backgroundColor, surf)
    const c = {}
    c.pickText = [rgb(cs('#default-months .g-datepicker__pick:not([class*=is-])').color, surf), surf]
    const sel = '#default-months .g-datepicker__pick.is-selected'; c.selText = [rgb(cs(sel).color, pickBg(sel)), pickBg(sel)]; c.selFill = [pickBg(sel), surf]; c.selRing = [ringOf(sel), surf]
    const asel = '#accent-months .g-datepicker__pick.is-selected'; c.accentText = [rgb(cs(asel).color, pickBg(asel)), pickBg(asel)]; c.accentRing = [ringOf(asel), surf]
    c.current = [ringOf('#default-months .g-datepicker__pick.is-current'), surf]
    c.disabled = [rgb(cs('#default-months .g-datepicker__pick.is-disabled').color, surf), surf]
    const dot = document.querySelector('#range-months .g-datepicker__pick.is-in-value > .g-icon'); c.dot = [rgb(getComputedStyle(dot).color, surf), surf]
    c.hint = [rgb(cs('#default-years .g-datepicker__years-hint').color, surf), surf]
    c.slot = [rgb(cs('#default-years .g-datepicker__typed-digit:empty').borderBottomColor, surf), surf]
    c.digit = [rgb(cs('#default-years .g-datepicker__typed-digit:not(:empty)').color, surf), surf]
    c.part = [rgb(cs('#default-days .g-datepicker__title-part').color, surf), surf]
    c.chev = [rgb(getComputedStyle(document.querySelector('#default-days .g-datepicker__title-part > .g-icon')).color, surf), surf]
    c.navOff = [rgb(cs('#default-years .g-datepicker__nav[aria-disabled]').color, surf), surf]
    out.c = c
    // Punto bajo el texto, dentro del botón
    const d = dot.getBoundingClientRect(); const pb = dot.parentElement.getBoundingClientRect()
    out.dot = { inside: d.bottom <= pb.bottom && d.top >= pb.top, cx: Math.abs((d.left + d.right) / 2 - (pb.left + pb.right) / 2) }
    // Franja que sigue
    const oe = document.querySelector('#range-days td.is-open-end')
    out.openEnd = { mask: getComputedStyle(oe, '::before').maskImage || getComputedStyle(oe, '::before').webkitMaskImage, radius: getComputedStyle(oe, '::before').borderTopRightRadius, right: oe.getBoundingClientRect().right }
    out.gridRight = document.querySelector('#range-days .g-datepicker__grid').getBoundingClientRect().right
    // Cifras
    const digs = [...document.querySelectorAll('#default-years .g-datepicker__typed-digit')].map((e) => e.getBoundingClientRect().left)
    out.digitsLtr = digs.every((x, i) => i === 0 || x > digs[i - 1])
    out.digitFirst = document.querySelector('#default-years .g-datepicker__typed-digit').textContent
    // Hover: sin transición en reposo
    out.restTransition = cs('#default-months .g-datepicker__pick:not([class*=is-])').transitionDuration
    return out
  })
}

async function zoomRead (page, id) {
  return page.evaluate((id) => {
    const v = document.querySelector(`#${id} .g-datepicker__view`)
    const z = v.dataset.zoom; delete v.dataset.zoom; void v.offsetWidth; v.dataset.zoom = z
    const a = v.getAnimations()[0]
    if (!a) return null
    a.pause(); a.currentTime = 0
    const cs = getComputedStyle(v)
    const m = new DOMMatrix(cs.transform === 'none' ? undefined : cs.transform)
    const t = a.effect.getComputedTiming()
    return { name: a.animationName, scale: m.a, opacity: Number(cs.opacity), origin: cs.transformOrigin, w: v.offsetWidth, h: v.offsetHeight, dur: t.duration, ease: cs.animationTimingFunction }
  }, id)
}

const SCHEMES = [['default', ''], ['dark', '?dark'], ['prueba', '?prueba'], ['rtl', '?dir=rtl']]
const THEMES = ['amazon', 'apple', 'caracol-purpura', 'github', 'grana', 'linear', 'lustre', 'medium', 'notion', 'spotify', 'stripe']
for (const t of THEMES) { SCHEMES.push([t, `?theme=${t}`]); SCHEMES.push([`${t}-dark`, `?theme=${t}&dark`]) }

for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  for (const [name, qs] of SCHEMES) {
    const full = engine === 'chromium' || ['default', 'dark', 'prueba', 'rtl'].includes(name)
    if (!full && engine !== 'chromium') continue
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1200 } })
    const page = await ctx.newPage()
    const errs = []; page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
    await page.goto(BASE + qs); await page.waitForTimeout(150)
    const m = await measure(page)
    const tag = `${engine}/${name}`
    ok(errs.length === 0, `${tag}: consola limpia (${errs.join(' | ')})`)
    const space = name === 'prueba' ? 5 : 4
    for (const d of ['default', 'comfortable', 'compact']) {
      const v = m[d]
      ok(Math.abs(v.days.stage - v.months.stage) < 0.5 && Math.abs(v.days.stage - v.years.stage) < 0.5, `${tag} ${d}: Δ 0 del escenario (${v.days.stage} · ${v.months.stage} · ${v.years.stage})`)
      ok(Math.abs(v.days.head - v.months.head) < 0.5 && Math.abs(v.days.head - v.years.head) < 0.5, `${tag} ${d}: cabecera de alto constante (${v.days.head} · ${v.months.head} · ${v.years.head})`)
      ok(Math.abs(v.days.surface.height - v.months.surface.height) < 0.5 && Math.abs(v.days.surface.width - v.months.surface.width) < 0.5 && Math.abs(v.days.surface.width - v.years.surface.width) < 0.5, `${tag} ${d}: Δ 0 de la superficie (${v.days.surface.width}×${v.days.surface.height} · ${v.months.surface.width}×${v.months.surface.height} · ${v.years.surface.width}×${v.years.surface.height})`)
      ok(Math.abs(v.fill.tbl - v.fill.stage) < 1 && Math.abs(v.fill.tw - v.fill.sw) < 1, `${tag} ${d}: la rejilla de meses llena el escenario (${v.fill.tbl}/${v.fill.stage})`)
      ok(Math.max(...v.rows) - Math.min(...v.rows) < 1, `${tag} ${d}: cuatro filas iguales en años (${v.rows.map((x) => x.toFixed(1))})`)
      ok(v.hint.bottom <= v.yearsStage.bottom + 0.5, `${tag} ${d}: la pista queda dentro del escenario`)
      ok(v.picks.every(([w, h]) => w >= 24 && h >= 24), `${tag} ${d}: meses y años ≥ 24 px (mín ${Math.min(...v.picks.flat()).toFixed(1)})`)
      ok(v.nav >= 24 && v.part.every((x) => x >= 24), `${tag} ${d}: flechas y título ≥ 24 px`)
      const dd = { default: 1, comfortable: 0.875, compact: 0.75 }[d]
      ok(Math.abs(v.cell - Math.max(24, Math.round(space * 10 * dd * 2) / 2)) < 0.5, `${tag} ${d}: celda = max(24, space × 10 × d) (${v.cell})`)
    }
    ok(m.compact.days.title < m.default.days.title && m.compact.days.title >= 12, `${tag}: título un escalón abajo en compacto (${m.default.days.title} → ${m.compact.days.title})`)
    if (name === 'default') notes.push(`${engine}: mes default ${m.default.days.surface.width.toFixed(1)} px, comfortable ${m.comfortable.days.surface.width.toFixed(1)} px, compact ${m.compact.days.surface.width.toFixed(1)} px; escenario ${m.default.days.stage}/${m.compact.days.stage} px; filas de años ${m.default.rows[0].toFixed(1)}/${m.compact.rows[0].toFixed(1)} px`)
    ok(Math.abs(m.pair.days.width - m.pair.months.width) < 0.5 && Math.abs(m.pair.days.height - m.pair.months.height) < 0.5, `${tag}: par de meses, Δ 0 al pasar a meses (${m.pair.days.width}×${m.pair.days.height} · ${m.pair.months.width}×${m.pair.months.height})`)
    // Contraste
    const C = m.c; const r = (k) => contrast(...C[k])
    const min = { pickText: 4.5, selText: 4.5, accentText: 4.5, disabled: 4.5, hint: 4.5, digit: 4.5, part: 4.5, selRing: 3, accentRing: 3, current: 3, dot: 3, slot: 3, chev: 3, navOff: 3 }
    for (const [k, lim] of Object.entries(min)) ok(C[k][0] && r(k) >= lim, `${tag}: contraste ${k} ${C[k][0] ? r(k).toFixed(2) : 'sin color'} ≥ ${lim}`)
    // Marca elegida: el relleno o su trazo llegan a 3:1
    ok(Math.max(r('selFill'), r('selRing')) >= 3, `${tag}: elegido distinguible (relleno ${r('selFill').toFixed(2)}, trazo ${r('selRing').toFixed(2)})`)
    if (name === 'default' && engine === 'chromium') notes.push(`contraste por defecto: ${Object.keys(min).map((k) => `${k} ${r(k).toFixed(2)}`).join(', ')}`)
    ok(m.dot.inside && m.dot.cx < 1, `${tag}: punto del valor centrado bajo el texto y dentro`)
    ok(/gradient/.test(m.openEnd.mask || ''), `${tag}: franja que sigue con desvanecido (${m.openEnd.mask})`)
    ok(m.openEnd.radius === '0px', `${tag}: franja que sigue sin redondear`)
    ok(m.digitsLtr && m.digitFirst === '1', `${tag}: cifras del año de izquierda a derecha`)
    ok(m.restTransition === '0s', `${tag}: sin transición en reposo (una sola luz)`)
    // Zoom
    const zi = await zoomRead(page, 'zoom-in'); const zo = await zoomRead(page, 'zoom-out')
    const ps = name === 'prueba' ? 0.94 : 0.97
    ok(zi && Math.abs(zi.scale - ps) < 0.002 && zi.opacity === 0 && zi.name === 'g-datepicker-zoom-in', `${tag}: zoom-in parte de ${ps} y opacidad 0 (${zi && zi.scale})`)
    ok(zo && Math.abs(zo.scale - (2 - ps)) < 0.002 && zo.opacity === 0, `${tag}: zoom-out parte de ${2 - ps} (${zo && zo.scale})`)
    ok(zi && zi.dur === 160 && /cubic-bezier\(0\.23, 1, 0\.32, 1\)/.test(zi.ease), `${tag}: press + ease-out (${zi && zi.dur} ${zi && zi.ease})`)
    if (zi) {
      const [ox] = zi.origin.split(' ').map(parseFloat)
      const want = name === 'rtl' ? zi.w * (1 - 0.83333) : zi.w * 0.83333
      ok(Math.abs(ox - want) < 1, `${tag}: origen x en la pieza (${ox.toFixed(1)} ≈ ${want.toFixed(1)})`)
    }
    if (name === 'rtl') {
      const oe = await page.evaluate(() => { const td = document.querySelector('#range-days td.is-open-end'); return getComputedStyle(td, '::before').maskImage || getComputedStyle(td, '::before').webkitMaskImage })
      ok(/to left|270deg/.test(oe), `${tag}: el desvanecido mira al borde en RTL (${oe})`)
    }
    await ctx.close()
  }
  // Panel anclado (sin hoja): un mes = siete celdas + relleno + borde
  for (const d of ['default', 'compact']) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); const page = await ctx.newPage()
    await page.goto(BASE + '?sheet'); await page.waitForTimeout(100)
    const w = await page.evaluate((d) => { const r = document.getElementById('sheet-root'); r.className = `g-datepicker g-datepicker--density-${d}`; const p = document.getElementById('sheet'); p.showPopover(); return { w: p.getBoundingClientRect().width, cell: p.querySelector('.g-datepicker__day').getBoundingClientRect().width, sw: p.scrollWidth, cw: p.clientWidth } }, d)
    const dd = d === 'compact' ? 0.75 : 1
    const want = 7 * w.cell + 2 * 24 * dd + 2
    ok(Math.abs(w.w - want) < 1 && w.sw <= w.cw, `${engine}/panel ${d}: ancho ${w.w} ≈ ${want} sin desborde`)
    notes.push(`${engine}: panel de un mes ${d} ${w.w} px`)
    await ctx.close()
  }
  // Reducido
  {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' }); const page = await ctx.newPage()
    await page.goto(BASE); await page.waitForTimeout(100)
    const zi = await zoomRead(page, 'zoom-in'); const zo = await zoomRead(page, 'zoom-out')
    ok(zi && zi.scale === 1 && zi.opacity === 0 && zi.dur === 120 && /linear/.test(zi.ease), `${engine}/reducido: solo fundido fast linear (${JSON.stringify(zi)})`)
    ok(zo && zo.scale === 1 && zo.dur === 120, `${engine}/reducido: subir también sin escala`)
    await ctx.close()
  }
  // forced-colors (Chromium)
  if (engine === 'chromium') {
    const ctx = await browser.newContext({ forcedColors: 'active' }); const page = await ctx.newPage()
    await page.goto(BASE); await page.waitForTimeout(100)
    const f = await page.evaluate(() => {
      const td = document.querySelector('#range-days td.is-open-end'); const cur = document.querySelector('#default-months .g-datepicker__pick.is-current')
      const sel = document.querySelector('#default-months .g-datepicker__pick.is-selected')
      return { mask: getComputedStyle(td, '::before').maskImage, curBorder: getComputedStyle(cur).borderTopWidth, selBorder: getComputedStyle(sel).borderTopWidth, band: getComputedStyle(td, '::before').borderTopWidth }
    })
    ok(f.mask === 'none' && f.band !== '0px', `chromium/forced-colors: franja que sigue con bordes y sin máscara (${JSON.stringify(f)})`)
    ok(f.curBorder !== '0px' && f.selBorder !== '0px', 'chromium/forced-colors: actual y elegido con borde')
    await ctx.close()
  }
  // Puntero grueso y hoja (Chromium: isMobile da pointer: coarse)
  if (engine === 'chromium') {
    for (const w of [320, 375]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: 760 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const page = await ctx.newPage()
      await page.goto(BASE + '?sheet'); await page.waitForTimeout(100)
      await page.evaluate(() => document.getElementById('sheet').showPopover()); await page.waitForTimeout(400)
      const s = await page.evaluate(() => {
        const pop = document.getElementById('sheet'); const g = pop.querySelector('.g-datepicker__grid'); const sf = pop.querySelector('.g-datepicker__surface')
        const coarse = matchMedia('(pointer: coarse)').matches
        return { coarse, sw: pop.scrollWidth, cw: pop.clientWidth, gw: g.getBoundingClientRect().width, gl: g.getBoundingClientRect().left, gr: g.getBoundingClientRect().right, pw: pop.getBoundingClientRect().width, pad: getComputedStyle(sf).paddingLeft, cell: pop.querySelector('.g-datepicker__day').getBoundingClientRect().width, nav: pop.querySelector('.g-datepicker__nav').getBoundingClientRect().height, part: pop.querySelector('.g-datepicker__title-part').getBoundingClientRect().height}
      })
      ok(s.coarse, `chromium/${w}: puntero grueso emulado`)
      ok(s.sw <= s.cw && s.gl >= 0 && s.gr <= w + 0.5, `chromium/${w}: hoja sin desborde (scroll ${s.sw}/${s.cw}, rejilla ${s.gl.toFixed(1)}–${s.gr.toFixed(1)})`)
      ok(s.cell >= 44 && s.nav >= 44 && s.part >= 44, `chromium/${w}: celda, flechas y título 44 px (${s.cell}, ${s.nav}, ${s.part})`)
      notes.push(`hoja ${w} px táctil: relleno lateral ${s.pad}, celda ${s.cell}`)
      await ctx.close()
    }
  }
  if (engine === 'chromium') {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1200 }, isMobile: true, hasTouch: true }); const page = await ctx.newPage()
    await page.goto(BASE); await page.waitForTimeout(100)
    const s = await page.evaluate(() => ({
      cell: document.querySelector('#compact-days .g-datepicker__day').getBoundingClientRect().width,
      picks: [...document.querySelectorAll('#compact-months .g-datepicker__pick, #compact-years .g-datepicker__pick')].map((b) => b.getBoundingClientRect()).map((r) => Math.min(r.width, r.height)),
      parts: [...document.querySelectorAll('#compact-days .g-datepicker__title-part, #compact-days .g-datepicker__nav')].map((b) => b.getBoundingClientRect().height),
      stage: ['days', 'months', 'years'].map((v) => document.querySelector(`#compact-${v} .g-datepicker__stage`).getBoundingClientRect().height)
    }))
    ok(s.cell >= 44 && s.picks.every((x) => x >= 44) && s.parts.every((x) => x >= 44), `chromium/táctil: compacto a 44 px (celda ${s.cell}, mín. pieza ${Math.min(...s.picks).toFixed(1)})`)
    ok(Math.max(...s.stage) - Math.min(...s.stage) < 0.5, `chromium/táctil: Δ 0 del escenario compacto (${s.stage})`)
    await ctx.close()
  }
  await browser.close()
}
server.close()
for (const n of notes) console.log('·', n)
for (const f of fails) console.log('✗', f)
console.log(`${pass}/${pass + fail}`)
process.exit(fail ? 1 : 0)
