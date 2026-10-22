// Verificación de coco sobre el banco de GGallery (design/lab/gallery/estilo-banco.html), con el CSS real de GGallery.css y
// GDialog.css (g-dialog--bare) de src/ en la capa grana.components. Mide: análisis estático; la cuadrícula, los espacios
// (portada que manda, banda de una foto, índice) y la tira (alturas iguales con la proporción real, la siguiente asoma, foco
// sin recortar) a 1440, 390, 320 y 320×256 en LTR y RTL; el visor (zona por defecto y none, contraste de barra, pie, hilo y
// controles en el tema por defecto, tres temas del CLI y cuatro generados, claro y oscuro; ningún control encima de la
// foto; llegada space × 6 espejada en RTL; arrastre sin transición; ampliada ×2 con desplazamiento nativo; foto rota; página
// inmóvil; dianas de 44px con puntero grueso; movimiento reducido; forced-colors en Chromium); consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4241 node design/lab/gallery/estilo-verificar.mjs
// Opcional: --engines=chromium,firefox,webkit  --verbose
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const pw = await import(new URL('../theme-playground/node_modules/playwright/index.mjs', import.meta.url))
const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]))
const ENGINES = (args.engines || 'chromium,firefox,webkit').split(',')
const V = !!args.verbose
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const server = http.createServer(async (req, res) => {
  try {
    const p = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)))
    if (!p.startsWith(ROOT)) throw new Error('fuera')
    res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(await readFile(p))
  } catch { if (!res.headersSent) res.writeHead(404).end() }
})
await new Promise((r) => server.listen(Number(process.env.GRANA_PW_PORT) || 4241, '127.0.0.1', r))
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/gallery/estilo-banco.html`

let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg, info = '') => { total++; if (!cond) { failed++; fails.push(msg + (info !== '' ? ' · ' + info : '')) } else if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
const note = (s) => { notes.push(s); if (V) console.log('nota ' + s) }

/* ---------- 0 · Análisis estático ---------- */
for (const [file, okLens] of [['GGallery/GGallery.css', ['24px', '44px', '1px', '62svh', '88cqi', '50svh', '0s']], ['GDialog/GDialog.css', null]]) {
  const raw = await readFile(join(ROOT, 'packages/vue/src/components', file), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), `estático ${file}: sin color literal`)
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), `estático ${file}: var() sin respaldo`)
  ok(!/@layer/.test(css) && !/!important/.test(css), `estático ${file}: sin @layer ni !important`)
  if (okLens) {
    const vars = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
    ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'estático: solo --g-* y --_*')
    const allowed = /^--g-(color-(bg|surface|surface-sunken|mold|text|text-muted|text-subtle|border|border-strong|border-control|focus)|focus-(width|offset)|border-width|radius-(md|shape)|text-(title-sm-(size|line|tracking|weight)|body-(size|line)|body-sm-(size|line|weight)|caption-(size|line)|action-weight)|font-ui|space-\d+|duration-(fast|press)|ease-(out|standard))$/
    const extra = vars.filter((v) => v.startsWith('--g-') && !allowed.test(v))
    ok(!extra.length, 'estático: solo tokens de §52 (+ text-subtle de «sin vuelta» y ease-standard de los cambios de color: nota a lima)', extra.join(','))
    ok(!/ease-(spring|bounce)/.test(css), 'estático: sin muelle ni rebote (#734)')
    const lens = [...css.matchAll(/(?<![\w-])(\d*\.?\d+)(px|rem|em|vh|vw|svh|dvh|ms|s|ch|cqi)(?![\w-])/g)].map((m) => m[1] + m[2])
    ok(lens.every((l) => okLens.includes(l)), 'estático: literales de medida solo los de la cabecera', [...new Set(lens)].join(','))
    ok(/overscroll-behavior: contain/.test(css) && /touch-action: pan-y pinch-zoom/.test(css), 'estático: escenario con overscroll contain y pellizco del sistema')
  } else {
    ok(/\.g-dialog--bare \{\s*padding: 0;/.test(css) && /\.g-dialog\.g-dialog--bare > \.g-dialog__body \{[^}]*padding: 0;/.test(css), 'estático GDialog: bare sin relleno de carcasa ni de cuerpo (#732)')
  }
}

const HELPERS = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const cx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05) }
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = rgba(getComputedStyle(e).backgroundColor); if (c[3] > 0.99) return c } return [255, 255, 255, 1] }
  window.__c = { rgba, ratio, bgOf, text: (el) => ratio(rgba(getComputedStyle(el).color), bgOf(el)) }
}
async function open (b, qs = '', opts = {}) {
  const { vw = 1280, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/fonts\.css|404|ERR_INVALID_URL|Failed to load/.test(m.text())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs.replace(/^&/, '?'))
  await p.waitForFunction(() => window.__gal && window.__gal.ready)
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(HELPERS)
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200)))))
  p.__errs = errs; p.__ctx = context
  return p
}
const R = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }, sel)
const overflowX = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const TEMAS = [['', 'defecto'], ['&tema=terracota', 'terracota'], ['&tema=anil', 'añil'], ['&tema=palida', 'pálida'], ['&theme=stripe', 'stripe'], ['&theme=github', 'github'], ['&theme=spotify', 'spotify'], ['&theme=caracol-purpura', 'caracol']]

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  const O = async (qs, opts) => { const p = await open(b, qs, opts); p.__eng = eng; return p }
  const close = async (p, label) => { ok(p.__errs.length === 0, `${eng} consola limpia (${label})`, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
  const E = (m) => `${eng} ${m}`

  /* ---------- 1 · Galería en la página ---------- */
  for (const [qs, lab] of [['?a=grid', 'A espacios'], ['?a=grid&grouped=0', 'base'], ['?a=strip', 'B tira']]) {
    for (const dir of ['ltr', 'rtl']) {
      for (const [vw, vh] of [[1440, 900], [390, 844], [320, 640], [320, 256]]) {
        const p = await O(`${qs}${dir === 'rtl' ? '&dir=rtl' : ''}`, { vw, vh })
        const L = `${lab} ${dir} ${vw}×${vh}`
        ok(!(await overflowX(p)), E(`${L}: sin desplazamiento horizontal`))
        const th = await p.evaluate(() => [...document.querySelectorAll('.g-gallery__thumb')].slice(0, 3).map((t) => { const cs = getComputedStyle(t, '::after'); return cs.boxShadow }))
        ok(th.every((s) => /inset/.test(s)), E(`${L}: miniaturas con su borde (::after)`))
        if (lab === 'A espacios') {
          const g = await p.evaluate(() => { const items = [...document.querySelectorAll('.g-gallery__group')[0].querySelectorAll('.g-gallery__item')].map((i) => i.getBoundingClientRect()); const only = document.querySelectorAll('.g-gallery__group')[2].querySelector('.g-gallery__item').getBoundingClientRect(); const grid = document.querySelectorAll('.g-gallery__group')[2].querySelector('.g-gallery__grid').getBoundingClientRect(); return { first: items[0], other: items[1], only, grid } })
          ok(g.first.width > g.other.width * 1.8 && g.first.height > g.other.height * 1.8, E(`${L}: la portada de un espacio de 4 manda (2 × 2)`), `${g.first.width.toFixed(0)}×${g.first.height.toFixed(0)} vs ${g.other.width.toFixed(0)}`)
          ok(Math.abs(g.only.width - g.grid.width) < 1 && g.only.height <= vh * 0.5 + 1, E(`${L}: espacio de una foto = banda ancha ≤ 50svh`))
          const idx = await p.evaluate(() => { const a = document.querySelector('.g-gallery__index-link'); const r = a.getBoundingClientRect(); return { h: r.height, c: __c.text(a), n: __c.text(a.querySelector('[aria-hidden]')), bc: __c.ratio(__c.rgba(getComputedStyle(a).borderTopColor), __c.bgOf(a)) } })
          ok(idx.h >= 24 && idx.c >= 4.5 && idx.n >= 4.5 && idx.bc >= 3, E(`${L}: enlace del índice ≥ 24px, texto y cifra ≥ 4.5:1, borde ≥ 3:1`), JSON.stringify(idx))
        }
        if (lab === 'B tira') {
          const s = await p.evaluate(() => { const strip = document.querySelector('.g-gallery__strip'); const sr = strip.getBoundingClientRect(); return [...document.querySelectorAll('.g-gallery__slide .g-gallery__img')].slice(0, 6).map((i) => { const r = i.getBoundingClientRect(); return { w: r.width, h: r.height, ar: i.width / i.height, sw: sr.width } }) })
          const h0 = s[0].h
          ok(s.every((x) => Math.abs(x.h - h0) < 1), E(`${L}: alturas iguales en la tira`), s.map((x) => x.h.toFixed(0)).join(','))
          ok(s.every((x) => Math.abs(x.w / x.h - x.ar) < 0.02 || x.w >= x.sw * 0.88 - 2), E(`${L}: cada foto con su proporción real (o recortada al 88 % de la tira)`), s.map((x) => (x.w / x.h).toFixed(2) + '/' + x.ar.toFixed(2)).join(' '))
          const peek = await p.evaluate(() => { const st = document.querySelector('.g-gallery__strip').getBoundingClientRect(); const s2 = document.querySelectorAll('.g-gallery__slide')[1].getBoundingClientRect(); return s2.left < st.right && s2.right > st.left })
          ok(peek, E(`${L}: la siguiente asoma`))
          await p.focus('.g-gallery__slide.is-current .g-gallery__thumb')
          await p.keyboard.press('ArrowRight'); await p.waitForTimeout(500)
          await p.keyboard.press(dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'); await p.waitForTimeout(500)
          const f = await p.evaluate(() => { const a = document.activeElement; const r = a.getBoundingClientRect(); const s = document.querySelector('.g-gallery__strip').getBoundingClientRect(); const cs = getComputedStyle(a); const o = parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset); return { cls: a.className, inside: r.left - o >= s.left - 0.5 && r.right + o <= s.right + 0.5 && r.top - o >= s.top - 0.5, st: cs.outlineStyle } })
          ok(/g-gallery__thumb/.test(f.cls) && f.st === 'solid' && f.inside, E(`${L}: el anillo de la diapositiva del borde no se recorta`), JSON.stringify(f))
          const cap = await p.evaluate(() => [__c.text(document.querySelector('.g-gallery__slide.is-current .g-gallery__caption')), __c.text(document.querySelectorAll('.g-gallery__slide')[1].querySelector('.g-gallery__caption'))])
          ok(cap.every((c) => c >= 4.5), E(`${L}: pies ≥ 4.5:1`), cap.map((c) => c.toFixed(2)).join('/'))
        }
        await close(p, L)
      }
    }
  }

  /* ---------- 2 · Visor: contraste en temas, claro y oscuro, zona y none ---------- */
  for (const [t, tn] of TEMAS) {
    for (const dark of [false, true]) {
      for (const zone of ['brand', 'none']) {
        if (zone === 'none' && t && !/terracota|anil/.test(t)) continue
        const p = await O(`?open=4${t}${dark ? '&dark=1' : ''}${zone === 'none' ? '&zone=none' : ''}`)
        const L = `visor ${tn} ${dark ? 'oscuro' : 'claro'} zona=${zone}`
        const m = await p.evaluate(() => {
          const d = document.getElementById('viewer'); const cs = getComputedStyle(d)
          const bg = __c.rgba(cs.backgroundColor)
          const want = __c.rgba(cs.getPropertyValue('--g-color-bg'))
          const txt = ['.g-gallery-viewer__title', '.g-gallery-viewer__count', '.g-gallery-viewer__caption'].map((s) => __c.text(d.querySelector(s)))
          const cur = d.querySelector('.g-gallery-viewer__thread-item[aria-current]'); const other = d.querySelector('.g-gallery-viewer__thread-item:not([aria-current])')
          const btns = [...d.querySelectorAll('.g-gallery-viewer__bar .g-btn, .g-gallery-viewer__nav .g-btn')].map((x) => __c.text(x))
          return { bg, want, txt, cur: __c.text(cur), curB: __c.ratio(__c.rgba(getComputedStyle(cur).borderTopColor), bg), other: __c.text(other), btns, zone: d.getAttribute('data-g-zone'), brand: __c.rgba(cs.getPropertyValue('--g-color-brand-zone')) }
        })
        ok(m.bg.join() === m.want.join() && m.bg[3] === 1, E(`${L}: fondo opaco = --g-color-bg del visor`))
        if (zone === 'brand') ok(m.bg.slice(0, 3).join() === m.brand.slice(0, 3).join(), E(`${L}: el visor es la marca (cuarto oscuro con el tema por defecto)`), m.bg.join())
        ok(m.txt.every((c) => c >= 4.5), E(`${L}: título, contador y pie ≥ 4.5:1`), m.txt.map((c) => c.toFixed(2)).join('/'))
        ok(m.cur >= 4.5 && m.other >= 4.5 && m.curB >= 3, E(`${L}: hilo: textos ≥ 4.5:1 y el trazo del actual ≥ 3:1`), [m.cur, m.other, m.curB].map((c) => c.toFixed(2)).join('/'))
        ok(m.btns.every((c) => c >= 4.5), E(`${L}: iconos de los controles ≥ 4.5:1`), m.btns.map((c) => c.toFixed(2)).join('/'))
        await close(p, L)
      }
    }
  }

  /* ---------- 3 · Visor: geometría, movimiento, zoom, rota ---------- */
  for (const dir of ['ltr', 'rtl']) {
    for (const [vw, vh] of [[1280, 800], [390, 844], [320, 256]]) {
      const p = await O(`?open=4${dir === 'rtl' ? '&dir=rtl' : ''}`, { vw, vh })
      const L = `visor ${dir} ${vw}×${vh}`
      const g = await p.evaluate(() => {
        const st = document.querySelector('.g-gallery-viewer__stage').getBoundingClientRect()
        const ctl = [...document.querySelectorAll('#viewer .g-btn, .g-gallery-viewer__thread-item')].map((c) => c.getBoundingClientRect())
        const d = document.getElementById('viewer').getBoundingClientRect()
        return { st, over: ctl.filter((c) => c.top < st.bottom - 0.5 && c.bottom > st.top + 0.5).length, d, sw: document.querySelector('#viewer .g-dialog__body').scrollWidth > document.querySelector('#viewer .g-dialog__body').clientWidth + 1, html: getComputedStyle(document.documentElement).overflow }
      })
      ok(g.over === 0, E(`${L}: ningún control encima de la foto`))
      ok(Math.abs(g.d.width - vw) < 1 && Math.abs(g.d.height - vh) < 1 && g.st.height > 40, E(`${L}: el visor llena el visor y la foto tiene sitio`), `${g.d.width}×${g.d.height} escenario ${g.st.height.toFixed(0)}`)
      ok(!g.sw && g.html === 'hidden', E(`${L}: sin desborde horizontal; la página debajo no se desplaza`))
      // llegada
      const arr = await p.evaluate(() => { const i = document.querySelector('.g-gallery-viewer__img'); i.classList.add('is-arriving'); i.dataset.direction = 'next'; const a = new DOMMatrix(getComputedStyle(i).transform).m41 || parseFloat(getComputedStyle(i).translate) || 0; const op = getComputedStyle(i).opacity; i.dataset.direction = 'prev'; const b = parseFloat(getComputedStyle(i).translate) || 0; i.classList.remove('is-arriving'); delete i.dataset.direction; const tr = getComputedStyle(i).transitionDuration; return { a: parseFloat(getComputedStyle(i).translate) , next: a, prev: b, op, tr } })
      const space6 = await p.evaluate(() => 6 * parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-space-1')))
      const sgn = dir === 'rtl' ? -1 : 1
      ok(Math.abs(arr.next - sgn * space6) < 0.5 && Math.abs(arr.prev + sgn * space6) < 0.5 && arr.op === '0', E(`${L}: llegada desde el lado del gesto, space × 6 (espejada en RTL), desde transparente`), JSON.stringify(arr))
      ok(/0\.16s/.test(arr.tr), E(`${L}: la llegada dura --g-duration-press`), arr.tr)
      // arrastre
      const dr = await p.evaluate(async () => { __viewer.dragging.value = true; __viewer.dx.value = -50; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); const i = document.querySelector('.g-gallery-viewer__img'); const t = parseFloat(getComputedStyle(i).translate); const tr = getComputedStyle(i).transitionProperty; __viewer.dx.value = 0; __viewer.dragging.value = false; return { t, tr } })
      ok(Math.abs(dr.t + 50) < 0.5 && dr.tr === 'none', E(`${L}: la foto sigue al dedo sin transición`), JSON.stringify(dr))
      // zoom
      await p.click('.g-gallery-viewer__zoom')
      await p.waitForTimeout(100)
      const z = await p.evaluate(() => {
        const s = document.querySelector('.g-gallery-viewer__stage'); const im = s.querySelector('img'); const r = im.getBoundingClientRect(); const sr = s.getBoundingClientRect()
        const k = Math.min(s.clientWidth / im.width, s.clientHeight / im.height)
        return { w: r.width, h: r.height, ew: im.width * k * 2, eh: im.height * k * 2, sw: s.scrollWidth, sh: s.scrollHeight, cw: s.clientWidth, ch: s.clientHeight, cx: (r.left + r.width / 2) - (sr.left + s.clientWidth / 2), cy: (r.top + r.height / 2) - (sr.top + s.clientHeight / 2), cur: getComputedStyle(s).cursor }
      })
      ok(Math.abs(z.w - z.ew) < 1.5 && Math.abs(z.h - z.eh) < 1.5 && z.cur === 'zoom-out', E(`${L}: ampliada = foto contenida × 2`), JSON.stringify(z))
      ok(z.sw <= Math.max(z.cw, z.w) + 1 && z.sh <= Math.max(z.ch, z.h) + 1, E(`${L}: sin franjas vacías recorribles (#758)`), JSON.stringify(z))
      ok((z.w >= z.cw - 1 || Math.abs(z.cx) < 1.5) && (z.h >= z.ch - 1 || Math.abs(z.cy) < 1.5), E(`${L}: centrada en el eje que no llena`), JSON.stringify(z))
      await close(p, L)
    }
  }
  {
    const p = await O('?open=6&broken=6')
    const br = await p.evaluate(() => ({ vis: getComputedStyle(document.querySelector('.g-gallery-viewer__img')).visibility, c: __c.text(document.querySelector('.g-gallery-viewer__broken')), th: getComputedStyle(document.querySelector('.g-gallery__thumb.is-broken .g-gallery__img')).visibility }))
    ok(br.vis === 'hidden' && br.th === 'hidden' && br.c >= 4.5, E('rota: el aviso con el alt sustituye a la foto (≥ 4.5:1) y la miniatura enseña su hueco'), JSON.stringify(br))
    await close(p, 'rota')
    const r = await O('?open=4', { reducedMotion: 'reduce' })
    const rm = await r.evaluate(() => { const i = document.querySelector('.g-gallery-viewer__img'); i.classList.add('is-arriving'); i.dataset.direction = 'next'; const t = getComputedStyle(i).translate; i.classList.remove('is-arriving'); return { t, tr: getComputedStyle(i).transitionProperty, d: getComputedStyle(i).transitionDuration } })
    ok(rm.t === 'none' && rm.tr === 'opacity' && /0\.12s/.test(rm.d), E('reducido: la foto no se desplaza; fundido de --g-duration-fast'), JSON.stringify(rm))
    await close(r, 'reducido')
    const c = await O('?open=4', { vw: 390, vh: 844, hasTouch: true, isMobile: eng !== 'firefox' })
    const coarse = await c.evaluate(() => matchMedia('(pointer: coarse)').matches)
    if (coarse) {
      const sz = await c.evaluate(() => [...document.querySelectorAll('#viewer .g-btn, .g-gallery-viewer__thread-item')].map((x) => { const r = x.getBoundingClientRect(); return Math.min(r.width, r.height) }))
      ok(sz.every((s) => s >= 44 - 0.5), E('puntero grueso: controles del visor ≥ 44px'), sz.map((s) => s.toFixed(0)).join(','))
    } else note(`${eng}: sin emulación de puntero grueso (Firefox no admite isMobile); dianas de 44px medidas en Chromium y WebKit`)
    await close(c, 'grueso')
  }
  if (eng === 'chromium') {
    const p = await O('?open=4', { forcedColors: 'active' })
    const f = await p.evaluate(() => ({ cur: getComputedStyle(document.querySelector('.g-gallery-viewer__thread-item[aria-current]')).borderTopColor, out: getComputedStyle(document.getElementById('viewer')).outlineStyle }))
    ok(f.out === 'solid' && !/rgba\(0, 0, 0, 0\)/.test(f.cur), E('forced-colors: borde real del visor y espacio actual con Highlight'), JSON.stringify(f))
    await close(p, 'forzados')
  }
  await b.close()
}
server.close()
console.log(`\nGGallery · estilo: ${total - failed}/${total}`)
if (notes.length) console.log('Notas:\n  ' + [...new Set(notes)].join('\n  '))
if (fails.length) { console.log('Fallos:\n  ' + fails.join('\n  ')); process.exitCode = 1 }
