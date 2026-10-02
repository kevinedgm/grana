// Verificación de coco sobre el banco r02 (design/lab/form/estilo-banco.html): la prueba obligatoria de distribución de
// form.md §12 en Chromium, Firefox y WebKit, más contraste, táctil, forced-colors, prefers-contrast, RTL y pie fijo.
// Ejecutar desde la raíz del repo: node design/lab/form/estilo-verificar.mjs   (usa el Playwright de design/lab/theme-playground)
// Opcional: --engines=chromium,firefox   --quick (solo distribución)
import http from 'node:http'
import { readFile } from 'node:fs/promises'
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
    const body = await readFile(p)
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/form/estilo-banco.html`

const WIDTHS = ['1280', '960', '720', '480', '360', '320']
const STATES = [[false, false], [true, false], [false, true], [true, true]]
const report = {}
let total = 0, failed = 0
const ok = (engine, cond, msg) => { total++; (report[engine] ??= { pass: 0, fail: [] }); if (cond) report[engine].pass++; else { failed++; report[engine].fail.push(msg) } }

/* Geometría (en la página): mismo borde, cajas en la misma línea, sin solapes ni desborde, orden = DOM, etiquetas sin recortar */
const geom = () => {
  const out = []; const T = 1
  const rtl = getComputedStyle(document.documentElement).direction === 'rtl'
  const S = (r) => (rtl ? -r.right : r.left), E = (r) => (rtl ? -r.left : r.right)
  const BOX = ':scope > .g-input__row, :scope > .g-select__control, :scope > .g-textarea__control, :scope > .g-datepicker__field, :scope > .g-input-group__box'
  const name = (el) => el.dataset.field || el.className.split(' ')[0]
  const frames = [...document.querySelectorAll('[data-frame]')]
  for (const fr of frames) {
    fr.querySelectorAll('.g-form-layout').forEach((lay) => {
      const R = E(lay.getBoundingClientRect())
      for (const c of lay.children) { const d = R - E(c.getBoundingClientRect()); if (Math.abs(d) > T) out.push(`hijo de layout a ${Math.round(d)}px del borde: ${name(c)}`) }
    })
    fr.querySelectorAll('.g-form-row').forEach((row) => {
      const R = E(row.getBoundingClientRect())
      const kids = [...row.children]
      const lines = new Map()
      for (const c of kids) { const k = c.dataset.line ?? String(Math.round(c.getBoundingClientRect().top)); if (!lines.has(k)) lines.set(k, []); lines.get(k).push(c) }
      let prevBottom = -Infinity, domIdx = -1
      ;[...lines.values()].sort((a, b) => a[0].getBoundingClientRect().top - b[0].getBoundingClientRect().top).forEach((ks) => {
        const end = Math.max(...ks.map((k) => E(k.getBoundingClientRect())))
        if (Math.abs(end - R) > T) out.push(`línea que no llega al borde (${Math.round(R - end)}px): ${ks.map(name).join('|')}`)
        const tops = ks.map((k) => k.querySelector(BOX)?.getBoundingClientRect().top).filter((x) => x !== undefined)
        if (tops.length > 1 && Math.max(...tops) - Math.min(...tops) > T) out.push(`cajas desalineadas (${(Math.max(...tops) - Math.min(...tops)).toFixed(1)}px): ${ks.map(name).join('|')}`)
        const sorted = [...ks].sort((a, b) => S(a.getBoundingClientRect()) - S(b.getBoundingClientRect()))
        sorted.forEach((k) => { const i = kids.indexOf(k); if (i < domIdx) out.push(`orden visual ≠ DOM: ${name(k)}`); domIdx = i })
        sorted.slice(1).forEach((k, i) => { if (S(k.getBoundingClientRect()) < E(sorted[i].getBoundingClientRect()) - T) out.push(`solape: ${name(sorted[i])} / ${name(k)}`) })
        const top = Math.min(...ks.map((k) => k.getBoundingClientRect().top)); if (top < prevBottom - T) out.push(`líneas superpuestas: ${ks.map(name).join('|')}`)
        prevBottom = Math.max(...ks.map((k) => k.getBoundingClientRect().bottom))
        // la caja de un hijo nunca sale de su celda
        ks.forEach((k) => { const b = k.querySelector(BOX); if (b && E(b.getBoundingClientRect()) > E(k.getBoundingClientRect()) + T) out.push(`caja más ancha que su celda: ${name(k)}`) })
      })
    })
    if (fr.scrollWidth > fr.clientWidth + 1) out.push(`desborde en el marco de ${fr.querySelector('form')?.id}`)
    const FR = fr.getBoundingClientRect()
    fr.querySelectorAll('.g-input__row, .g-select__control, .g-textarea__control, .g-datepicker__field, .g-input-group__box, .g-input-group__part').forEach((b) => { const r = b.getBoundingClientRect(); if (r.right > FR.right + 1 || r.left < FR.left - 1) out.push(`caja fuera del marco: ${b.closest('[data-field]')?.dataset.field}`) })
    fr.querySelectorAll('.g-input__label, .g-select__label, .g-textarea__label, .g-datepicker__label, .g-input-group__label, .g-field-group__label').forEach((l) => {
      const cs = getComputedStyle(l)
      if (l.scrollWidth > l.clientWidth + 1 || l.scrollHeight > l.clientHeight + 1) out.push(`etiqueta recortada: ${l.textContent}`)
      if (cs.textOverflow === 'ellipsis' || (cs.webkitLineClamp && cs.webkitLineClamp !== 'none')) out.push(`etiqueta con elipsis o límite de líneas: ${l.textContent}`)
    })
  }
  if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`desborde de página ${document.documentElement.scrollWidth - window.innerWidth}px`)
  return out
}

async function openPage(browser, vw, query = '', ctxOpts = {}) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: 900 }, ...ctxOpts })
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push(String(e)))
  await page.goto(BASE + query)
  await page.evaluate(() => document.fonts.ready)
  await page.evaluate(() => window.__banco.ready())
  return { ctx, page, errs }
}
const settle = (page) => page.evaluate(() => window.__banco.ready())

async function distribution(engine, browser, query = '', label = '', ctxOpts = {}) {
  // 1) contenedor a cada ancho × cuatro estados
  const { ctx, page, errs } = await openPage(browser, 1440, query, ctxOpts)
  for (const w of WIDTHS) {
    for (const [st, lg] of STATES) {
      await page.evaluate(([w, st, lg]) => { window.__banco.setWidth(w); window.__banco.setState(st); window.__banco.setLong(lg) }, [w, st, lg])
      await settle(page)
      const g = await page.evaluate(geom)
      ok(engine, g.length === 0, `${label}contenedor ${w} mensajes=${st} largas=${lg}: ${g.slice(0, 5).join(' · ')}`)
    }
  }
  // líneas esperadas (§12.5)
  if (!query.includes('density') && !query.includes('test')) {
    for (const [w, n] of [['1280', 1], ['960', 1], ['720', 2], ['360', 3]]) {
      await page.evaluate((w) => { window.__banco.setState(false); window.__banco.setLong(false); window.__banco.setWidth(w) }, w); await settle(page)
      const lines = await page.evaluate(() => document.querySelector('[aria-label="Signos vitales"]').dataset.lines)
      ok(engine, +lines === n, `${label}signos vitales a ${w}: ${lines} líneas (esperado ${n})`)
    }
    await page.evaluate(() => window.__banco.setWidth('360')); await settle(page)
    const addr = await page.evaluate(() => ['fa-calle', 'fa-ext', 'fa-int'].map((id) => document.querySelector(`[data-field="${id}"]`).dataset.line))
    ok(engine, addr[0] !== addr[1] && addr[1] === addr[2], `${label}dirección a 360: Calle sola y Ext.·Int. juntos (líneas ${addr})`)
  }
  ok(engine, errs.length === 0, `${label}consola (contenedor): ${errs.join(' | ')}`)
  await ctx.close()
  // 2) ventana a cada ancho con contenedor libre × cuatro estados
  for (const vw of WIDTHS.map(Number)) {
    const { ctx, page, errs } = await openPage(browser, vw, query, ctxOpts)
    for (const [st, lg] of STATES) {
      await page.evaluate(([st, lg]) => { window.__banco.setState(st); window.__banco.setLong(lg) }, [st, lg]); await settle(page)
      const g = await page.evaluate(geom)
      ok(engine, g.length === 0, `${label}ventana ${vw} mensajes=${st} largas=${lg}: ${g.slice(0, 5).join(' · ')}`)
    }
    ok(engine, errs.length === 0, `${label}consola (ventana ${vw}): ${errs.join(' | ')}`)
    await ctx.close()
  }
}

/* ---------- contraste (Chromium): colores computados resueltos por canvas, alfa compuesto sobre los ancestros ---------- */
const measure = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1] }
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0) { stack.push(c); if (c[3] >= 1) break } } let acc = [255, 255, 255, 1]; for (const c of stack.reverse()) acc = over(c, acc); return acc }
  const L = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]) }
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const q = (s) => document.querySelector(s)
  const fg = (el, prop = 'color', pseudo) => rgba(getComputedStyle(el, pseudo).getPropertyValue(prop))
  const text = (s, bgSel) => { const el = q(s); if (!el) return null; const b = bgOf(bgSel ? q(bgSel) : el); return ratio(over(fg(el), b), b) }
  const border = (s, outsideSel) => { const el = q(s); if (!el) return null; const out = bgOf(outsideSel ? q(outsideSel) : el.parentElement); return ratio(over(fg(el, 'border-top-color'), out), out) }
  const r = {}
  const T = (k, v, min) => { r[k] = { v: v && +v.toFixed(2), min } }
  T('etiqueta', text('[data-field="fs-nombre"] .g-input__label'), 4.5)
  T('«(opcional)»', text('[data-field="fs-ext"] .g-input__optional'), 4.5)
  T('ayuda', text('[data-field="fs-correo"] .g-input__hint'), 4.5)
  T('mensaje error', text('.states .g-input.is-invalid .g-input__message'), 4.5)
  T('mensaje advertencia', text('.states .g-input.is-warning .g-input__message'), 4.5)
  T('mensaje válido', text('.states .g-input.is-valid .g-input__message'), 4.5)
  T('sufijo (kg) en reposo', text('[data-field="fm-peso"] .g-input__suffix', '[data-field="fm-peso"] .g-input__control'), 4.5)
  T('output (valor calculado)', text('#out-in-output', '[data-field="out-in"] .g-input__control'), 4.5)
  T('output en fecha', text('#fm-nac-output', '#fm-nac'), 4.5)
  T('IG texto «mmHg»', text('[data-field="fm-pa"] .g-input-group__part--text:has(+ .g-input-group__text-label)', '[data-field="fm-pa"] .g-input-group__box'), 4.5)
  T('IG valor escrito', text('#fj-ro-n', '[data-field="fj-ro"] .g-input-group__box'), 4.5)
  T('solo lectura: valor GInput', text('#ro-in', '[data-field="ro-in"] .g-input__control'), 4.5)
  T('solo lectura: sufijo', text('[data-field="ro-in"] .g-input__suffix', '[data-field="ro-in"] .g-input__control'), 4.5)
  { const el = q('#ro-ph'); const b = bgOf(q('[data-field="ro-ph"] .g-input__control')); T('solo lectura: marcador', ratio(over(fg(el, 'color', '::placeholder'), b), b), 4.5) }
  T('solo lectura: valor GSelect', text('[data-field="ro-se"] .g-select__value', '[data-field="ro-se"] .g-select__control'), 4.5)
  T('solo lectura: fecha', text('#ro-dp-value', '#ro-dp'), 4.5)
  T('solo lectura: output de fecha', text('#ro-dp-output', '#ro-dp'), 4.5)
  T('solo lectura: GTextarea', text('#ro-ta', '[data-field="ro-ta"] .g-textarea__control'), 4.5)
  T('solo lectura: IG valor', text('#ro-ig-s', '[data-field="ro-ig"] .g-input-group__box'), 4.5)
  T('solo lectura: IG «mmHg»', text('[data-field="ro-ig"] .g-input-group__part--text:has(+ .g-input-group__text-label)', '[data-field="ro-ig"] .g-input-group__box'), 4.5)
  T('solo lectura: IG selector como texto', text('#fj-ro-p', '[data-field="fj-ro"] .g-input-group__box'), 4.5)
  T('borde de caja en reposo', border('[data-field="fs-nombre"] .g-input__control', '[data-field="fs-nombre"]'), 3)
  T('borde IG en reposo', border('[data-field="fs-tel"] .g-input-group__box', '[data-field="fs-tel"]'), 3)
  T('borde solo lectura (fuera)', border('[data-field="ro-in"] .g-input__control', '[data-field="ro-in"]'), 3)
  { const c = q('[data-field="ro-in"] .g-input__control'); const b = bgOf(c); T('borde solo lectura (sobre su relleno)', ratio(over(fg(c, 'border-top-color'), b), b), 3) }
  { const c = q('[data-field="ro-ig"] .g-input-group__box'); const b = bgOf(c); T('borde IG solo lectura (sobre su relleno)', ratio(over(fg(c, 'border-top-color'), b), b), 3) }
  T('borde error', border('.states .g-input.is-invalid .g-input__control', '.states'), 3)
  T('borde advertencia', border('.states .g-input.is-warning .g-input__control', '.states'), 3)
  T('borde válido', border('.states .g-input.is-valid .g-input__control', '.states'), 3)
  { const p = q('.states .g-input-group__part.is-invalid'); const b = bgOf(p); T('marca de la parte inválida', ratio(over(fg(p, 'background-color', '::after'), b), b), 3) }
  { const i = q('[data-field="fs-tel"] .g-input-group__select-icon'); const b = bgOf(i.parentElement); T('chevron-down del selector', ratio(over(fg(i), b), b), 3) }
  { const g = q('[data-field="fs-tel"]'); const b = bgOf(q('#fs-tel-num')); T('anillo de foco por parte', ratio(over(rgba(getComputedStyle(g).getPropertyValue('--_focus')), b), b), 3) }
  // L8: el relleno de solo lectura no es más oscuro que la superficie en oscuro (no un pozo); en claro, no más claro
  const fill = bgOf(q('[data-field="ro-in"] .g-input__control')), surf = bgOf(q('[data-field="fs-nombre"] .g-input__control'))
  r.L8 = { fill: L(fill).toFixed(4), surface: L(surf).toFixed(4), dark: document.documentElement.dataset.theme === 'dark' || matchMedia('(prefers-color-scheme: dark)').matches }
  return r
}

async function contrast(browser) {
  const out = {}
  for (const theme of ['', 'spotify', 'lustre']) {
    for (const dark of [false, true]) {
      const qs = '?state=1' + (theme ? '&theme=' + theme : '') + (dark ? '&dark=1' : '')
      const { ctx, page } = await openPage(browser, 1440, qs, { colorScheme: dark ? 'dark' : 'light' })
      await page.waitForTimeout(150)
      const r = await page.evaluate(measure)
      const key = (theme || 'defecto') + (dark ? ' oscuro' : ' claro')
      out[key] = r
      for (const [k, v] of Object.entries(r)) {
        if (k === 'L8') {
          const f = +v.fill, s = +v.surface
          ok('chromium', dark ? f >= s : f <= s, `${key}: L8 relleno de solo lectura ${dark ? 'más oscuro' : 'más claro'} que la superficie (${v.fill} vs ${v.surface})`)
          continue
        }
        ok('chromium', v.v != null && v.v >= v.min, `${key}: ${k} ${v.v} < ${v.min}`)
      }
      await ctx.close()
    }
  }
  return out
}

async function extras(browser) {
  const R = {}
  // táctil: pointer coarse en Chromium
  {
    const { ctx, page } = await openPage(browser, 400, '?w=360&density=compact', { hasTouch: true, isMobile: true })
    const m = await page.evaluate(() => ({
      coarse: matchMedia('(pointer: coarse)').matches,
      input: document.querySelector('[data-field="fs-nombre"] .g-input__control').getBoundingClientRect().height,
      select: document.querySelector('[data-field="fm-sexo"] .g-select__control').getBoundingClientRect().height,
      date: document.querySelector('#fm-nac').getBoundingClientRect().height,
      igBox: document.querySelector('[data-field="fs-tel"] .g-input-group__box').getBoundingClientRect().height,
      igParts: Math.min(...[...document.querySelectorAll('.g-input-group__part--input, .g-input-group__part--select')].filter((p) => !p.closest('.is-disabled')).map((p) => p.getBoundingClientRect().width)),
      btn: Math.min(...[...document.querySelectorAll('.g-form-actions .g-btn')].map((b) => { const a = getComputedStyle(b, '::after'); return Math.max(b.getBoundingClientRect().height, parseFloat(a.blockSize || a.height) || 0) }))
    }))
    R.tactil = m
    ok('chromium', m.coarse && m.input >= 44 && m.select >= 44 && m.date >= 44 && m.igBox >= 44 && m.igParts >= 44 && m.btn >= 44, `táctil (compacto, 360): ${JSON.stringify(m)}`)
    await ctx.close()
  }
  // forced-colors y prefers-contrast
  {
    const { ctx, page } = await openPage(browser, 1280, '?state=1')
    await page.emulateMedia({ forcedColors: 'active' })
    await page.focus('#fs-tel-pais'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab')
    const f = await page.evaluate(() => {
      const part = document.getElementById('fs-tel-pais').closest('.g-input-group__part')
      const inv = document.querySelector('.g-input-group__part.is-invalid')
      return {
        ringPart: getComputedStyle(part).outlineStyle, ringBox: getComputedStyle(part.parentElement).outlineStyle,
        roDashed: getComputedStyle(document.querySelector('[data-field="ro-in"] .g-input__control')).borderTopStyle,
        roIgDashed: getComputedStyle(document.querySelector('[data-field="ro-ig"] .g-input-group__box')).borderTopStyle,
        invalidMark: getComputedStyle(inv, '::after').backgroundColor,
        warnDashed: getComputedStyle(document.querySelector('.states .g-input.is-warning .g-input__control')).borderTopStyle,
        divider: getComputedStyle(document.querySelector('[data-field="fs-tel"] .g-input-group__part--input')).borderInlineStartStyle
      }
    })
    R.forced = f
    ok('chromium', f.ringPart === 'solid' && f.ringBox !== 'solid' && f.roDashed === 'dashed' && f.roIgDashed === 'dashed' && !/rgba\(0, 0, 0, 0\)|transparent/.test(f.invalidMark) && f.warnDashed === 'dashed' && f.divider === 'solid', `forced-colors: ${JSON.stringify(f)}`)
    await page.emulateMedia({ forcedColors: 'none', contrast: 'more' })
    await page.mouse.move(0, 0); await page.waitForTimeout(400)
    const pc = await page.evaluate(() => [getComputedStyle(document.querySelector('[data-field="fs-tel"] .g-input-group__part--input')).borderInlineStartColor, getComputedStyle(document.querySelector('[data-field="fs-nombre"] .g-input__control')).borderTopColor])
    R.prefersContrast = pc
    ok('chromium', pc[0] === pc[1], `prefers-contrast: more → línea entre partes = borde de control (${pc})`)
    await ctx.close()
  }
  // pie apilado
  {
    const { ctx, page } = await openPage(browser, 1280)
    const h = await page.evaluate(() => [...document.querySelectorAll('[data-actions-frame]')].map((f) => ({ fw: f.dataset.actionsFrame, h: f.querySelector('.g-form-actions').getBoundingClientRect().height, stacked: f.querySelector('.g-form-actions').hasAttribute('data-stacked'), primaryTop: (() => { const bs = [...f.querySelectorAll('.g-btn')]; const p = f.querySelector('.g-btn--variant-solid'); return bs.every((b) => b === p || b.getBoundingClientRect().top > p.getBoundingClientRect().top) })(), primaryFull: (() => { const p = f.querySelector('.g-btn--variant-solid'); return Math.abs(p.getBoundingClientRect().width - p.parentElement.getBoundingClientRect().width) < 1 })() })))
    R.pie = h
    ok('chromium', h.filter((x) => x.stacked).length === 2 && h.filter((x) => x.stacked).every((x) => x.primaryTop && x.primaryFull) && h[0].h < 177, `pie apilado: ${JSON.stringify(h)}`)
    await ctx.close()
  }
  return R
}

/* 2.4.11: Tab por el formulario mediano sin que el pie fijo tape el foco (con el respaldo JS del banco) */
async function sticky(engine, browser) {
  for (const vw of [1280, 320]) {
    const { ctx, page } = await openPage(browser, vw)
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#fm').getBoundingClientRect().top + scrollY - 40))
    await page.focus('#fm-nombre')
    let hidden = [], seen = 0
    for (let i = 0; i < 40; i++) {
      const r = await page.evaluate(() => new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(() => {
        const a = document.activeElement; if (!a || !a.closest('#fm')) return res(null)
        const bar = document.querySelector('#fm .g-form-actions--sticky'); if (a.closest('.g-form-actions')) return res({ id: 'pie', under: false })
        res({ id: a.id || a.name, under: a.getBoundingClientRect().bottom > bar.getBoundingClientRect().top + 0.5 })
      }))))
      if (!r) break
      seen++; if (r.under) hidden.push(r.id)
      await page.keyboard.press('Tab')
    }
    ok(engine, hidden.length === 0 && seen > 10, `pie fijo ${vw}: ${seen} paradas, tapados: ${hidden.join(',')}`)
    await ctx.close()
  }
}

const summary = {}
for (const engine of ENGINES) {
  const browser = await pw[engine].launch()
  await distribution(engine, browser)
  if (!args.quick) {
    await distribution(engine, browser, '?rtl=1', 'RTL · ')
    await sticky(engine, browser)
    if (engine === 'chromium') {
      await distribution(engine, browser, '?density=comfortable', 'comfortable · ')
      await distribution(engine, browser, '?density=compact', 'compact · ')
      await distribution(engine, browser, '?density=compact', 'táctil compacto · ', { hasTouch: true, isMobile: true })
      await distribution(engine, browser, '?test=1', 'tema de prueba · ')
      await distribution(engine, browser, '?theme=spotify&dark=1', 'spotify oscuro · ', { colorScheme: 'dark' })
      summary.contraste = await contrast(browser)
      summary.extras = await extras(browser)
    }
  }
  await browser.close()
}
server.close()
for (const [e, r] of Object.entries(report)) {
  console.log(`\n${e}: ${r.pass}/${r.pass + r.fail.length} OK`)
  for (const f of r.fail.slice(0, 40)) console.log('  ✗ ' + f)
}
if (args.json || args.verbose) console.log(JSON.stringify(summary, null, 1))
else if (summary.contraste) {
  const keys = Object.keys(Object.values(summary.contraste)[0]).filter((k) => k !== 'L8')
  console.log('\nContraste (mínimo de cada medida en los seis temas/modos):')
  for (const k of keys) { const vals = Object.entries(summary.contraste).map(([t, r]) => [t, r[k].v]); const min = vals.reduce((a, b) => (b[1] < a[1] ? b : a)); console.log(`  ${k}: ${Object.values(summary.contraste).map((r) => r[k].v).join(' / ')}  (mín ${min[1]} en ${min[0]})`) }
  console.log('  L8 (luminancia relleno / superficie): ' + Object.entries(summary.contraste).map(([t, r]) => `${t} ${r.L8.fill}/${r.L8.surface}`).join(' · '))
  console.log('\nExtras: ' + JSON.stringify(summary.extras))
}
console.log(`\nTotal: ${total - failed}/${total} OK`)
process.exit(failed ? 1 : 0)
