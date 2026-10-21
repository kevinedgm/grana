// Verificación de coco sobre el banco de GHero (design/lab/hero/estilo-banco.html), con el CSS real de GHero.css de src/
// en la capa grana.components. Mide: análisis estático (literales, respaldos, tokens, curvas); las tres apariencias a 1440,
// 390, 320 y 320×256 (zoom 400 %) en LTR y RTL (sin desplazamiento horizontal, título entre title-lg y el tope, el texto
// nunca toca la foto, A 4:5 con el detalle mordiendo la esquina, labios ≤ la mitad de la foto, acción sin desplazar a
// 390×844 en A y C); contraste del texto contra su fondo real en el tema por defecto, tres temas del CLI (terracota, añil,
// pálida) y cuatro generados, claro y oscuro; la placa de B en la zona; el cambio de vista sin vacío; el foco de teclado
// en las vistas (con data-g-key-focus); H-L14 (pausa sobre «cielo» y «noche»); la mirada (solo con marco, soporte y sin
// reducido); movimiento reducido; forced-colors (Chromium); consola limpia.
// Ejecutar desde la raíz del repo (requiere dist/):  GRANA_PW_PORT=4241 node design/lab/hero/estilo-verificar.mjs
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
const BASE = `http://127.0.0.1:${server.address().port}/design/lab/hero/estilo-banco.html`

let total = 0, failed = 0
const fails = [], notes = []
const ok = (cond, msg, info = '') => { total++; if (!cond) { failed++; fails.push(msg + (info !== '' ? ' · ' + info : '')) } else if (V) console.log('ok   ' + msg + (info !== '' ? ' · ' + info : '')) }
const note = (s) => { notes.push(s); if (V) console.log('nota ' + s) }

/* ---------- 0 · Análisis estático ---------- */
{
  const raw = await readFile(join(ROOT, 'packages/vue/src/components/GHero/GHero.css'), 'utf8')
  const css = raw.replace(/\/\*[\s\S]*?\*\//g, '')
  ok(!/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color|color-mix)\(/.test(css), 'estático: sin color literal')
  ok(!/var\(\s*--[\w-]+\s*,/.test(css), 'estático: var() sin respaldo')
  ok(!/@layer/.test(css) && !/!important/.test(css), 'estático: sin @layer ni !important')
  const vars = [...new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]))]
  ok(vars.every((v) => v.startsWith('--g-') || v.startsWith('--_')), 'estático: solo --g-* y --_*')
  const allowed = /^--g-(color-(bg|surface|surface-sunken|text|text-muted|border|border-strong|border-control|focus)|focus-(width|offset)|border-width|radius-(xs|sm|md|lg|xl|pill)|shadow-[12]|text-(title-lg-size|display-weight|display-tracking|title-sm-(size|line)|body-(size|line)|body-sm-(size|line)|caption-(size|line|weight|tracking))|hero-title-max|font-(display|ui)|space-\d+|duration-(fast|slow|press)|ease-(out|standard)|press-scale|text-action-weight)$/
  const extra = vars.filter((v) => v.startsWith('--g-') && !allowed.test(v))
  ok(!extra.length, 'estático: solo tokens de §51 (+ title-sm del bajo, press-scale y ease-standard de la pausa, action-weight de la vista: nota a lima)', extra.join(','))
  ok(!/ease-(spring|bounce)/.test(css), 'estático: sin --g-ease-spring ni --g-ease-bounce (#728)')
  const kf = [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
  ok(kf.every((k) => k.startsWith('g-hero')), 'estático: keyframes con prefijo g-hero', kf.join(','))
  const lens = [...css.matchAll(/(?<![\w-])(\d*\.?\d+)(px|rem|em|vh|vw|svh|dvh|ms|s|ch|cqi)(?![\w-])/g)].map((m) => m[1] + m[2])
  const okLens = ['24px', '44px', '1px', '7.5cqi', '4cqi', '12cqi', '16cqi', '64svh', '68svh', '0s']
  ok(lens.every((l) => okLens.includes(l)), 'estático: literales de medida solo los de la cabecera', [...new Set(lens)].join(','))
  ok(/clamp\(var\(--g-text-title-lg-size\), 7\.5cqi, var\(--g-hero-title-max\)\)/.test(css) && /line-height: 1\.08/.test(css), 'estático: regla del título de #727')
  ok(/animation-timeline: view\(\)/.test(css) && /@supports \(animation-timeline: view\(\)\)/.test(css), 'estático: la mirada con view() dentro de @supports (§29.8)')
  const defaults = await readFile(join(ROOT, 'packages/vue/src/styles/defaults.css'), 'utf8')
  ok(/--g-hero-title-max: calc\(var\(--g-text-display-size\) \* 1\.5625\)/.test(defaults), 'defaults: --g-hero-title-max = display × typeScale² (1,25²)')
}

// En la página: color normalizado (canvas), fondo efectivo, contraste WCAG
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
  const { vw = 1440, vh = 900, ...ctx } = opts
  const context = await b.newContext({ viewport: { width: vw, height: vh }, ...ctx })
  const p = await context.newPage()
  const errs = []
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/fonts\.css|404/.test(m.text())) errs.push(m.text()) })
  p.on('pageerror', (e) => errs.push(String(e)))
  await p.goto(BASE + qs.replace(/^&/, '?'))
  await p.waitForFunction(() => window.__hero && window.__hero.ready)
  await p.evaluate(() => document.fonts.ready)
  await p.evaluate(HELPERS)
  await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 150)))))
  p.__errs = errs; p.__ctx = context
  return p
}
const R = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }, sel)
const inter = (a, b) => a && b && a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5
const overflowX = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const px = (p, sel, prop) => p.evaluate(([s, pr]) => parseFloat(getComputedStyle(document.querySelector(s))[pr]), [sel, prop])
const varPx = (p, name) => p.evaluate((n) => { const d = document.createElement('div'); d.style.inlineSize = `var(${n})`; document.body.appendChild(d); const w = d.getBoundingClientRect().width; d.remove(); return w }, name)

const APPS = ['window', 'views', 'threshold']
const TEMAS = [['', ''], ['&tema=terracota', 'terracota'], ['&tema=anil', 'añil'], ['&tema=palida', 'pálida'], ['&theme=stripe', 'stripe'], ['&theme=apple', 'apple'], ['&theme=spotify', 'spotify'], ['&theme=lustre', 'lustre']]

for (const eng of ENGINES) {
  const b = await pw[eng].launch()
  const O = async (qs, opts) => { const p = await open(b, qs, opts); p.__eng = eng; return p }
  const close = async (p, label) => { ok(p.__errs.length === 0, `${eng} consola limpia (${label})`, p.__errs.slice(0, 2).join(' | ')); await p.__ctx.close() }
  const E = (m) => `${eng} ${m}`

  /* ---------- 1 · Geometría por apariencia y ancho ---------- */
  for (const a of APPS) {
    for (const dir of ['ltr', 'rtl']) {
      for (const [vw, vh] of [[1440, 900], [390, 844], [320, 640], [320, 256]]) {
        const p = await O(`?a=${a}${dir === 'rtl' ? '&dir=rtl' : ''}`, { vw, vh })
        const L = `${a} ${dir} ${vw}×${vh}`
        ok(!(await overflowX(p)), E(`${L}: sin desplazamiento horizontal`))
        const fs = await px(p, '.g-hero__title', 'fontSize')
        const lo = await varPx(p, '--g-text-title-lg-size'), hi = await varPx(p, '--g-hero-title-max')
        const box = (await R(p, '.g-hero')).w
        ok(fs >= lo - 0.5 && fs <= hi + 0.5 && Math.abs(fs - Math.min(hi, Math.max(lo, box * 0.075))) < 0.6, E(`${L}: título = clamp(title-lg, 7.5cqi, tope)`), `${fs.toFixed(1)} [${lo.toFixed(1)}, ${hi.toFixed(1)}]`)
        const photo = a === 'window' ? await R(p, '.g-hero__frame') : await R(p, '.g-hero__media')
        for (const s of ['.g-hero__title', '.g-hero__lead', '.g-hero__eyebrow', '.g-hero__actions', '.g-hero__aside']) {
          const t = await R(p, s)
          if (a === 'window') ok(!inter(t, photo) && !inter(t, await R(p, '.g-hero__detail')), E(`${L}: ${s} no toca la foto`))
          else {
            // B y C: el texto vive en la placa o la tarjeta, opaca, que va encima de la foto
            const host = await R(p, a === 'views' ? '.g-hero__plate' : '.g-hero__card')
            ok(t.t >= host.t - 0.5 && t.b <= host.b + 0.5, E(`${L}: ${s} dentro de la placa o tarjeta opaca`))
          }
        }
        if (a === 'window') {
          ok(Math.abs(photo.w / photo.h - 0.8) < 0.01, E(`${L}: vano 4:5`), (photo.w / photo.h).toFixed(3))
          const d = await R(p, '.g-hero__detail')
          const bite = await varPx(p, '--g-space-12')
          const startOut = dir === 'rtl' ? d.r - photo.r : photo.l - d.l
          ok(Math.abs(startOut - bite) < 1 && Math.abs(d.b - photo.b - bite) < 1 && inter(d, photo), E(`${L}: el detalle muerde la esquina de inicio y asoma space × 12`), `${startOut.toFixed(1)} ${(d.b - photo.b).toFixed(1)}`)
          ok(Math.abs(d.w - photo.w * 0.4) < 1, E(`${L}: detalle = 40 % del vano`))
          ok(photo.h <= vh * 0.8 + 1, E(`${L}: vano ≤ 80svh`), `${photo.h.toFixed(0)}`)
          const wall = await px(p, '.g-hero__detail', 'outlineWidth')
          ok(Math.abs(wall - (await varPx(p, '--g-space-2'))) < 0.5, E(`${L}: muro = space × 2`))
        } else {
          const host = await R(p, a === 'views' ? '.g-hero__plate' : '.g-hero__card')
          const lip = photo.b - host.t
          ok(lip > 0 && lip <= photo.h / 2, E(`${L}: el labio muerde la foto sin pasar de la mitad`), `${lip.toFixed(1)}/${photo.h.toFixed(1)}`)
          const topHit = await p.evaluate(() => { const h = document.querySelector(window.__hero && '.g-hero__plate, .g-hero__card'); const r = h.getBoundingClientRect(); const e = document.elementFromPoint(r.left + 8, r.top + 4); return !!(e && h.contains(e)) })
          ok(topHit, E(`${L}: la placa o tarjeta queda encima de la foto`))
        }
        if (vw === 390 && vh === 844 && a !== 'views') {
          const pr = await R(p, '#primary')
          if (a === 'window') ok(pr.b <= 844, E(`${L}: la acción principal se ve sin desplazar`), pr.b.toFixed(0))
          else (pr.b <= 844 ? ok(true, E(`${L}: acción principal sin desplazar (con la consulta)`)) : note(`${eng} C 390×844 con una consulta de 3 líneas: la acción queda en ${pr.b.toFixed(0)} px (bajo el pliegue); sin consulta, ver siguiente medida`))
          if (a === 'threshold') {
            const q = await O('?a=threshold&consult=0', { vw, vh })
            const pr2 = await R(q, '#primary')
            ok(pr2.b <= 844, E(`C 390×844 sin consulta: acción sin desplazar`), pr2.b.toFixed(0))
            await close(q, 'C sin consulta')
          }
        }
        await close(p, L)
      }
    }
  }

  /* ---------- 2 · Contraste del texto en temas, claro y oscuro ---------- */
  for (const [t, tn] of TEMAS) {
    for (const dark of [false, true]) {
      for (const a of APPS) {
        const p = await O(`?a=${a}${t}${dark ? '&dark=1' : ''}`, { vw: 1280, vh: 900 })
        const L = `${a} ${tn || 'defecto'} ${dark ? 'oscuro' : 'claro'}`
        for (const s of ['.g-hero__title', '.g-hero__lead', '.g-hero__eyebrow', '.g-hero__aside', '.g-hero__credit']) {
          const r = await p.evaluate((s) => __c.text(document.querySelector(s)), s)
          ok(r >= 4.5, E(`${L}: ${s} ≥ 4.5:1`), r.toFixed(2))
        }
        if (a === 'views') {
          const zone = await p.evaluate(() => { const pl = document.querySelector('.g-hero__plate'); const cs = getComputedStyle(pl); return { bg: __c.rgba(cs.backgroundColor), want: __c.rgba(cs.getPropertyValue('--g-color-brand-zone')) } })
          ok(zone.bg.slice(0, 3).join() === zone.want.slice(0, 3).join() && zone.bg[3] === 1, E(`${L}: la placa es la marca opaca (zona)`), zone.bg.join(','))
          const v = await p.evaluate(() => { const l = document.querySelector('.g-hero__view'); const bc = __c.rgba(getComputedStyle(l).borderTopColor); return __c.ratio(bc, __c.bgOf(l)) })
          ok(v >= 3, E(`${L}: borde de la vista ≥ 3:1 sobre la placa`), v.toFixed(2))
          const lab = await p.evaluate(() => __c.text(document.querySelector('.g-hero__view-label')))
          ok(lab >= 4.5, E(`${L}: nombre de la vista ≥ 4.5:1`), lab.toFixed(2))
        }
        // el arco y la tarjeta siguen al radio del tema
        if (a === 'window') {
          const rr = await p.evaluate(() => { const f = document.querySelector('.g-hero__frame'); return [parseFloat(getComputedStyle(f).borderBottomRightRadius), parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g-radius-lg')) || 0] })
          ok(Math.abs(rr[0] - rr[1]) < 0.5, E(`${L}: la base del arco sigue a --g-radius-lg del tema`), rr.join('/'))
        }
        await close(p, L)
      }
    }
  }

  /* ---------- 3 · B: cambio de vista sin vacío, foco de teclado, reducido ---------- */
  {
    const p = await O('?a=views', { vw: 1280, vh: 900 })
    await p.click('.g-hero__view:nth-of-type(2)')
    await p.waitForTimeout(20)
    const mid = await p.evaluate(() => {
      const imgs = [...document.querySelectorAll('.g-hero__media > img')]
      const cur = imgs.find((i) => i.classList.contains('g-hero__img'))
      const an = cur.getAnimations().find((x) => x.transitionProperty === 'opacity')
      if (!an) return null
      const d = an.effect.getComputedTiming().duration
      an.pause(); an.currentTime = d / 2
      const old = imgs.filter((i) => i !== cur).map((i) => parseFloat(getComputedStyle(i).opacity))
      return { d, cur: parseFloat(getComputedStyle(cur).opacity), maxOld: Math.max(...old), z: getComputedStyle(cur).zIndex }
    })
    ok(mid && mid.cur > 0 && mid.cur < 1 && mid.maxOld === 1 && mid.z === '1', E('B: a mitad del fundido la vista nueva va encima y la anterior sigue entera (nunca el vacío)'), JSON.stringify(mid))
    ok(mid && Math.abs(mid.d - 240) < 1, E('B: fundido de --g-duration-slow (240 ms)'), mid && mid.d)
    // foco de teclado: Tab hasta las vistas, luego →
    await p.evaluate(() => document.querySelector('.g-hero__view-input:checked').focus())
    await p.keyboard.press('ArrowRight')
    await p.waitForTimeout(50)
    const ring = await p.evaluate(() => { const l = document.activeElement.closest('.g-hero__view'); const cs = getComputedStyle(l); return { s: cs.outlineStyle, w: parseFloat(cs.outlineWidth), c: __c.ratio(__c.rgba(cs.outlineColor), __c.bgOf(l)) } })
    ok(ring.s === 'solid' && ring.w >= 2 && ring.c >= 3, E('B: anillo de foco en la vista tras → (≥ 2px, ≥ 3:1 sobre la placa)'), JSON.stringify(ring))
    await close(p, 'B vistas')
    const r = await O('?a=views', { vw: 1280, vh: 900, reducedMotion: 'reduce' })
    await r.click('.g-hero__view:nth-of-type(3)')
    const d = await r.evaluate(() => { const cur = document.querySelector('.g-hero__media > .g-hero__img'); const an = cur.getAnimations().find((x) => x.transitionProperty === 'opacity'); return an ? an.effect.getComputedTiming().duration : 0 })
    ok(d <= 121, E('B reducido: fundido de --g-duration-fast'), d)
    await close(r, 'B reducido')
  }

  /* ---------- 4 · H-L14: la pausa sobre «cielo» y «noche» ---------- */
  for (const [photo, colors] of [['cielo', ['#FBFAF7', '#F1ECE2', '#FFFFFF', '#E9E2D3']], ['noche', ['#0E1116', '#1A1F29', '#0A0C10']], ['papel-picado', ['#FFFFFF', '#111111', '#FF2D55', '#FFCC00', '#34C759', '#007AFF', '#AF52DE']]]) {
    for (const [t, tn] of [['', 'defecto'], ['&dark=1', 'oscuro'], ['&tema=terracota', 'terracota'], ['&tema=anil', 'añil']]) {
      for (const a of APPS) {
        const p = await O(`?a=${a}&video=1&photo=${photo}${t}`, { vw: 1280, vh: 900 })
        const m = await p.evaluate((cols) => {
          const b = document.querySelector('.g-hero__motion'); const cs = getComputedStyle(b)
          const fill = __c.rgba(cs.backgroundColor), ring = __c.rgba(cs.borderTopColor)
          const worst = Math.min(...cols.map((c) => Math.max(__c.ratio(fill, __c.rgba(c)), __c.ratio(ring, __c.rgba(c)))))
          const r = b.getBoundingClientRect()
          return { worst, w: r.width, h: r.height, icon: __c.ratio(__c.rgba(cs.color), fill) }
        }, colors)
        ok(m.worst >= 3, E(`H-L14 ${a} ${photo} ${tn}: el borde de la pausa ≥ 3:1 sobre la foto (relleno o tinta)`), m.worst.toFixed(2))
        ok(m.w >= 44 && m.h >= 44 && m.icon >= 4.5, E(`H-L14 ${a} ${photo} ${tn}: pausa 44px con icono ≥ 4.5:1`))
        const mr = await R(p, '.g-hero__motion'), ph = a === 'window' ? await R(p, '.g-hero__frame') : await R(p, '.g-hero__media')
        ok(mr.l >= ph.l - 0.5 && mr.r <= ph.r + 0.5 && mr.t >= ph.t - 0.5 && mr.b <= ph.b + 0.5, E(`${a} ${photo}: la pausa está en la esquina de la foto, fuera del texto`))
        if (photo === 'cielo' && tn === 'defecto') {
          // Modalidad de teclado y foco (WebKit no lleva el Tab a los botones por defecto)
          await p.keyboard.press('Shift')
          await p.focus('.g-hero__motion')
          const f = await p.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { o: cs.outlineStyle, sh: cs.boxShadow, cls: document.activeElement.className } })
          ok(f.cls === 'g-hero__motion' && f.o === 'solid' && /,/.test(f.sh), E(`${a}: foco de la pausa con anillo y halo de surface`), JSON.stringify(f).slice(0, 120))
        }
        await close(p, `pausa ${a} ${photo} ${tn}`)
      }
    }
  }

  /* ---------- 5 · La mirada ---------- */
  {
    const sup = await (async () => { const p = await O('', { vw: 1280, vh: 900 }); const s = await p.evaluate(() => CSS.supports('animation-timeline: view()')); await close(p, 'soporte'); return s })()
    const anims = async (qs, opts = {}) => { const p = await O(qs, { vw: 1280, vh: 600, ...opts }); const n = await p.evaluate(() => { const i = document.querySelector('.g-hero__media .g-hero__img'); return i.getAnimations().filter((a) => a.animationName === 'g-hero-look').length }); return [p, n] }
    let [p, n] = await anims('')
    if (sup) {
      ok(n === 1, E('mirada: activa con marco (H-C1), soporte y sin reducido'))
      const before = await p.evaluate(() => { const f = document.querySelector('.g-hero__frame').getBoundingClientRect(); const i = document.querySelector('.g-hero__img').getBoundingClientRect(); const t = document.querySelector('.g-hero__title').getBoundingClientRect(); return { f: f.top, i: i.top - f.top, t: t.top } })
      await p.evaluate(() => window.scrollBy(0, 200)); await p.waitForTimeout(150)
      const after = await p.evaluate(() => { const f = document.querySelector('.g-hero__frame').getBoundingClientRect(); const i = document.querySelector('.g-hero__img').getBoundingClientRect(); const t = document.querySelector('.g-hero__title').getBoundingClientRect(); return { f: f.top, i: i.top - f.top, t: t.top, fh: f.height } })
      const frameMoved = (before.f - after.f) - (before.t - after.t)
      ok(Math.abs(frameMoved) < 0.5, E('mirada: el marco se mueve con el texto (quieto respecto a la página)'), frameMoved.toFixed(2))
      ok(Math.abs(after.i - before.i) > 0.5 && Math.abs(after.i - before.i) <= after.fh * 0.06 + 0.5, E('mirada: la foto se mueve dentro del vano, ≤ 2 × 3 % del alto'), (after.i - before.i).toFixed(2))
      const clipOk = await p.evaluate(() => getComputedStyle(document.querySelector('.g-hero__frame')).overflow)
      ok(/clip|hidden/.test(clipOk), E('mirada: el marco recorta'))
    } else { ok(n === 0, E('mirada: sin soporte de view(), quieta')); note(`${eng}: sin animation-timeline (la mirada queda quieta, como dice el contrato)`) }
    await close(p, 'mirada')
    for (const [qs, opts, lab] of [['&wrap=0', {}, 'sin marco (contrato sin H-C1)'], ['&look=0', {}, 'look=false'], ['', { reducedMotion: 'reduce' }, 'reducido'], ['&video=1', {}, 'con vídeo']]) {
      [p, n] = await anims(qs, opts)
      ok(n === 0, E(`mirada: quieta ${lab}`))
      await close(p, `mirada ${lab}`)
    }
  }

  /* ---------- 6 · Colores forzados (Chromium) y zona alrededor ---------- */
  if (eng === 'chromium') {
    for (const a of ['views', 'threshold']) {
      const p = await O(`?a=${a}`, { vw: 1280, vh: 900, forcedColors: 'active' })
      const bw = await p.evaluate((a) => { const e = document.querySelector(a === 'views' ? '.g-hero__plate' : '.g-hero__card'); const cs = getComputedStyle(e); return [cs.borderTopStyle, cs.borderTopColor] }, a)
      ok(bw[0] === 'solid' && !/rgba\(0, 0, 0, 0\)/.test(bw[1]), E(`forced-colors ${a}: placa o tarjeta con borde real`), bw.join(' '))
      await close(p, `forzados ${a}`)
    }
  }
  {
    const p = await O('?a=window&zone=1', { vw: 1280, vh: 900 })
    for (const s of ['.g-hero__title', '.g-hero__lead', '.g-hero__aside']) {
      const r = await p.evaluate((s) => __c.text(document.querySelector(s)), s)
      ok(r >= 4.5, E(`A dentro de una zona de marca: ${s} ≥ 4.5:1`), r.toFixed(2))
    }
    const wall = await p.evaluate(() => { const d = document.querySelector('.g-hero__detail'); return __c.rgba(getComputedStyle(d).outlineColor).join() === __c.bgOf(d.parentElement).join() })
    ok(wall, E('A en zona: el muro es el color del fondo que lo rodea'))
    await close(p, 'zona')
  }
  await b.close()
}
server.close()
console.log(`\nGHero · estilo: ${total - failed}/${total}`)
if (notes.length) console.log('Notas:\n  ' + [...new Set(notes)].join('\n  '))
if (fails.length) { console.log('Fallos:\n  ' + fails.join('\n  ')); process.exitCode = 1 }
