// GBtn · cierre de las «Limitaciones conocidas» del README (coco, 2026-10-18). Cuatro bloques:
//   1. altura sobre la rejilla de medio píxel con round() (espacio fraccionario × tamaños × densidades) y respaldo sin round()
//   2. contraste en oscuro (y en claro, de referencia) por color × variante × estado (reposo, hover, active, disabled)
//   3. forced-colors: borde ButtonText, foco Highlight, disabled GrayText, texto visible; hover y active de cada variante
//   4. personalidad: camino sin linear(), conteo de cuadros fuera de Chromium (solo con 1 worker) y emulación táctil
// El botón es el marcado del contrato (button.g-btn + span.g-btn__label) con el grana.css REAL de dist/, servido en una página
// propia (sin Vue ni red). Ejecutar: GRANA_PW_PORT=4209 npx playwright test tests/btn-limitaciones.spec.mjs
// VERBOSE=1 imprime las tablas de cifras.
import { test, expect } from '@playwright/test'

const COLORS = ['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']
const VARIANTS = ['solid', 'soft', 'outline', 'ghost', 'link']
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl']
const DENS = ['default', 'comfortable', 'compact']
const UNITS = { xs: 6, sm: 7, md: 9, lg: 11, xl: 13 }
const DENS_K = { default: 1, comfortable: 0.875, compact: 0.75 }
const V = !!process.env.VERBOSE

const btn = (cls, label = 'Guardar', extra = '') => `<button type="button" class="g-btn ${cls}" ${extra}><span class="g-btn__label">${label}</span></button>`
const css = '/packages/vue/dist/grana.css'

// Página propia con el CSS real. `rewrite` cambia el texto del CSS antes de servirlo (para ejercer los respaldos).
async function open(page, body, { head = '', rewrite, theme } = {}) {
  await page.route('**/__btn-lab.html', (r) => r.fulfill({
    contentType: 'text/html',
    body: `<!doctype html><html${theme ? ` data-theme="${theme}"` : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${css}"><style>
      body{margin:0;padding:24px;background:var(--g-color-surface);color:var(--g-color-text);font-family:var(--g-font-ui)}
      .row{display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start;margin-bottom:12px}${head}</style></head><body>${body}</body></html>`
  }))
  if (rewrite) {
    await page.route('**/dist/grana.css', async (r) => {
      const res = await r.fetch()
      await r.fulfill({ response: res, body: rewrite(await res.text()) })
    })
  }
  await page.goto('/__btn-lab.html')
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.g-btn')).alignItems === 'center')
}

// ============================================================ 1 · altura
const THEMES = [
  { name: 'por defecto (space-1 = 4px)', space: null },
  { name: 'space-1 = 4.5px', space: '4.5px' },
  { name: 'space-1 = 4.375px', space: '4.375px' }
]
const expectedH = (space, size, dens) => {
  const raw = space * UNITS[size] * DENS_K[dens]
  // round(nearest) a 0,5px: los empates (x,25 / x,75) suben, como en CSS
  return Math.max(24, Math.floor(raw * 2 + 0.5) / 2)
}
const matrix = () => SIZES.flatMap((s) => DENS.map((d) => ({ s, d })))

test.describe('1 · GBtn altura con round() a 0,5px', () => {
  for (const th of THEMES) {
    test(`${th.name}: alto sobre la rejilla, piso de 24px, solo icono cuadrado, contenido centrado`, async ({ page }) => {
      const cells = matrix().map(({ s, d }) => `<div class="row">${btn(`g-btn--size-${s} g-btn--density-${d}`, 'Guardar', `data-k="${s}-${d}"`)}${btn(`g-btn--icon g-btn--size-${s} g-btn--density-${d}`, '<svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor"/></svg>', `data-i="${s}-${d}" aria-label="x"`)}</div>`).join('')
      await open(page, cells, { head: th.space ? `:root{--g-space-1:${th.space}}` : '' })
      const space = th.space ? parseFloat(th.space) : 4
      const m = await page.evaluate(() => [...document.querySelectorAll('[data-k]')].map((b) => {
        const i = document.querySelector(`[data-i="${b.dataset.k}"]`)
        const r = b.getBoundingClientRect(); const l = b.querySelector('.g-btn__label').getBoundingClientRect(); const ri = i.getBoundingClientRect()
        return { k: b.dataset.k, h: r.height, dy: Math.abs((l.top + l.bottom) / 2 - (r.top + r.bottom) / 2), iw: ri.width, ih: ri.height, min: getComputedStyle(b).minBlockSize }
      }))
      const rows = []
      for (const c of m) {
        const [s, d] = c.k.split('-')
        const exp = expectedH(space, s, d)
        expect(c.h, `${th.name} ${c.k}`).toBeCloseTo(exp, 2)
        expect(c.h * 2 % 1, `${c.k} múltiplo de 0,5px`).toBeCloseTo(0, 6)
        expect(c.h).toBeGreaterThanOrEqual(24)
        expect(c.iw, `${c.k} solo icono: ancho = alto`).toBeCloseTo(c.ih, 2)
        expect(c.ih, `${c.k} solo icono: alto = el del botón`).toBeCloseTo(c.h, 2)
        expect(c.dy, `${c.k} contenido centrado`).toBeLessThan(0.5)
        rows.push(`${c.k}=${c.h}`)
      }
      if (th.space === null) {
        // Sin cambio con el tema por defecto: las alturas de estilo.md (24/24/24, 28/24.5/24, 36/31.5/27, 44/38.5/33, 52/45.5/39)
        const want = { 'xs-default': 24, 'xs-comfortable': 24, 'xs-compact': 24, 'sm-default': 28, 'sm-comfortable': 24.5, 'sm-compact': 24, 'md-default': 36, 'md-comfortable': 31.5, 'md-compact': 27, 'lg-default': 44, 'lg-comfortable': 38.5, 'lg-compact': 33, 'xl-default': 52, 'xl-comfortable': 45.5, 'xl-compact': 39 }
        for (const c of m) expect(c.h, `defecto ${c.k}`).toBe(want[c.k])
      }
      if (V) console.log(`[altura ${test.info().project.name}] ${th.name}: ${rows.join(' ')}`)
    })
  }

  test('respaldo sin round(): la condición del @supports falla y el botón conserva su alto (el valor sin redondear)', async ({ page }) => {
    await open(page, `<div class="row">${btn('g-btn--size-md g-btn--density-comfortable', 'Guardar', 'id="a"')}${btn('g-btn--size-xl g-btn--density-compact', 'Guardar', 'id="b"')}</div>`, {
      head: ':root{--g-space-1:4.375px}',
      rewrite: (t) => t.replace('@supports (inline-size: round(1px,1px))', '@supports (inline-size: round-inexistente(1px,1px))')
    })
    const sup = await page.evaluate(() => CSS.supports('inline-size', 'round(1px, 1px)'))
    const h = await page.evaluate(() => ({ a: document.getElementById('a').getBoundingClientRect().height, b: document.getElementById('b').getBoundingClientRect().height }))
    const rule = await page.evaluate(() => getComputedStyle(document.getElementById('a')).getPropertyValue('--_snap').trim())
    expect(rule, 'el bloque @supports no se aplicó').toBe('')
    expect(h.a).toBeCloseTo(4.375 * 9 * 0.875, 1) // Firefox ajusta el diseño a 1/60 px
    expect(h.b).toBeCloseTo(4.375 * 13 * 0.75, 1)
    if (V) console.log(`[sin round ${test.info().project.name}] soporta round: ${sup}; md/comfortable ${h.a}, xl/compact ${h.b}`)
  })

  test('con el CSS real, --_snap se aplica solo cuando el navegador soporta round()', async ({ page }) => {
    await open(page, btn('', 'Guardar', 'id="a"'))
    const [sup, snap] = await page.evaluate(() => [CSS.supports('inline-size', 'round(1px, 1px)'), getComputedStyle(document.getElementById('a')).getPropertyValue('--_snap').trim()])
    expect(snap).toBe(sup ? '.5px' : '') // el minificador de Vite escribe 0.5px como .5px
  })
})

// ============================================================ 2 y 3 · colores por estado
const probeSrc = () => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1
  const ctx = cv.getContext('2d', { willReadFrequently: true })
  const rgba = (s) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = s; ctx.fillRect(0, 0, 1, 1); const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (t, b) => { const a = t[3]; return [t[0] * a + b[0] * (1 - a), t[1] * a + b[1] * (1 - a), t[2] * a + b[2] * (1 - a), 1] }
  const lum = (k) => { const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(k[0]) + 0.7152 * f(k[1]) + 0.0722 * f(k[2]) }
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
  const surface = over(rgba(getComputedStyle(document.body).backgroundColor), [255, 255, 255, 1])
  window.__read = (el) => {
    const cs = getComputedStyle(el)
    const bg = over(rgba(cs.backgroundColor), surface)
    const fg = over(rgba(cs.color), bg)
    const bw = parseFloat(cs.borderTopWidth)
    const bd = bw > 0 ? over(rgba(cs.borderTopColor), surface) : null
    const bdOnBg = bw > 0 ? over(rgba(cs.borderTopColor), bg) : null
    return {
      text: ratio(fg, bg),
      // forma = fondo contra la superficie; borde = borde contra la superficie (si es visible)
      fill: ratio(bg, surface),
      border: bd && rgba(cs.borderTopColor)[3] > 0 ? ratio(bd, surface) : 0,
      borderAlpha: rgba(cs.borderTopColor)[3],
      bdOnBg: bdOnBg ? ratio(bdOnBg, bg) : 0,
      raw: { color: cs.color, bg: cs.backgroundColor, border: cs.borderTopColor }
    }
  }
}

const settle = (page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))))

async function gridPage(page, theme) {
  const rows = COLORS.map((c) => `<div class="row">${VARIANTS.map((v) => btn(`g-btn--color-${c} g-btn--variant-${v}`, 'Guardar', `data-c="${c}" data-v="${v}"`)).join('')}${VARIANTS.map((v) => btn(`g-btn--color-${c} g-btn--variant-${v}`, 'Guardar', `data-c="${c}" data-v="${v}" data-dis disabled`)).join('')}</div>`).join('')
  await open(page, rows, { theme })
  await page.evaluate(probeSrc)
}

async function readStates(page) {
  const out = []
  for (const c of COLORS) for (const v of VARIANTS) {
    const b = page.locator(`[data-c="${c}"][data-v="${v}"]:not([data-dis])`)
    await page.mouse.move(0, 0); await settle(page)
    const rest = await b.evaluate((el) => window.__read(el))
    await b.hover(); await settle(page)
    const hover = await b.evaluate((el) => window.__read(el))
    await page.mouse.down(); await settle(page)
    const active = await b.evaluate((el) => window.__read(el))
    await page.mouse.up(); await page.mouse.move(0, 0); await settle(page)
    const disabled = await page.locator(`[data-c="${c}"][data-v="${v}"][data-dis]`).evaluate((el) => window.__read(el))
    out.push({ c, v, rest, hover, active, disabled })
  }
  return out
}

// Hallazgos conocidos del tema por defecto (se listan aquí y en auditoria.md; no se ocultan: el resto de combinaciones sí se exige)
const KNOWN = {
  // 'esquema|color|variante|estado|métrica': 'motivo'
}

test.describe('2 · GBtn contraste por estado, claro y oscuro (tema por defecto)', () => {
  test.beforeEach(({ browserName }) => { test.skip(browserName === 'webkit' && false, '') })
  for (const scheme of ['light', 'dark']) {
    test(`${scheme}: texto ≥ 4,5:1; borde de outline y relleno de solid ≥ 3:1 en reposo, hover y active`, async ({ page }) => {
      await gridPage(page, scheme)
      const data = await readStates(page)
      const fails = []; const lines = []
      const min = { text: 99, outline: 99, solid: 99, soft: 99, softBorderHover: 99, disabledText: 99 }
      const chk = (cond, key, msg) => { if (!cond && !KNOWN[`${scheme}|${key}`]) fails.push(`${scheme} ${key}: ${msg}`) }
      for (const { c, v, rest, hover, active, disabled } of data) {
        for (const [st, r] of [['reposo', rest], ['hover', hover], ['active', active]]) {
          const key = `${c}|${v}|${st}`
          chk(r.text >= 4.5, `${key}|texto`, `texto ${r.text.toFixed(2)}`)
          min.text = Math.min(min.text, r.text)
          if (v === 'outline') { chk(r.border >= 3, `${key}|borde`, `borde ${r.border.toFixed(2)}`); min.outline = Math.min(min.outline, r.border) }
          if (v === 'solid') { chk(r.fill >= 3, `${key}|forma`, `relleno ${r.fill.toFixed(2)}`); min.solid = Math.min(min.solid, r.fill) }
          if (v === 'soft') min.soft = Math.min(min.soft, Math.max(r.fill, r.border))
          if (v === 'soft' && st !== 'reposo') min.softBorderHover = Math.min(min.softBorderHover, r.border)
        }
        min.disabledText = Math.min(min.disabledText, disabled.text)
        lines.push(`${c} ${v}: texto ${rest.text.toFixed(2)}/${hover.text.toFixed(2)}/${active.text.toFixed(2)} (reposo/hover/active) · forma ${Math.max(rest.fill, rest.border).toFixed(2)}/${Math.max(hover.fill, hover.border).toFixed(2)}/${Math.max(active.fill, active.border).toFixed(2)} · disabled texto ${disabled.text.toFixed(2)} forma ${disabled.fill.toFixed(2)}`)
      }
      if (V) { console.log(`[contraste ${scheme} ${test.info().project.name}] mínimos ${JSON.stringify(Object.fromEntries(Object.entries(min).map(([k, x]) => [k, +x.toFixed(2)])))}`); console.log(lines.join('\n')) }
      expect(fails, fails.join('\n')).toEqual([])
    })
  }

  test('hover y active reasignan lo que dice el CSS (soft: borde 30 %; solid: strong; outline/ghost: soft; link: sin cambio)', async ({ page }) => {
    await gridPage(page, 'dark')
    const data = await readStates(page)
    const get = (c, v) => data.find((d) => d.c === c && d.v === v)
    for (const c of COLORS) {
      expect(get(c, 'solid').hover.raw.bg, `${c} solid hover cambia el fondo`).not.toBe(get(c, 'solid').rest.raw.bg)
      expect(get(c, 'solid').active.raw.bg).toBe(get(c, 'solid').hover.raw.bg)
      expect(get(c, 'soft').hover.raw.bg, `${c} soft hover: el fondo no cambia (cambia el borde)`).toBe(get(c, 'soft').rest.raw.bg)
      expect(get(c, 'soft').hover.borderAlpha, `${c} soft hover: borde visible`).toBeGreaterThan(0.2)
      expect(get(c, 'soft').rest.borderAlpha).toBe(0)
      expect(get(c, 'outline').hover.raw.bg, `${c} outline hover: aparece el fondo soft`).not.toBe('rgba(0, 0, 0, 0)')
      expect(get(c, 'ghost').hover.raw.bg, `${c} ghost hover: aparece el fondo soft`).not.toBe('rgba(0, 0, 0, 0)')
      expect(get(c, 'link').hover.raw.bg).toBe('rgba(0, 0, 0, 0)')
      expect(get(c, 'link').hover.raw.color).toBe(get(c, 'link').rest.raw.color)
    }
  })
})

test.describe('3 · GBtn forced-colors', () => {
  test('borde ButtonText, foco Highlight, disabled GrayText, texto visible; hover y active de las cuatro variantes', async ({ page, browserName }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await gridPage(page)
    const active = await page.evaluate(() => matchMedia('(forced-colors: active)').matches)
    test.skip(!active, `${browserName} no emula forced-colors: active`)
    const sys = await page.evaluate(() => {
      const r = {}
      for (const k of ['ButtonText', 'Highlight', 'GrayText', 'ButtonFace', 'Canvas']) { const d = document.createElement('i'); d.style.color = k; document.body.append(d); r[k] = getComputedStyle(d).color; d.remove() }
      return r
    })
    const reads = []
    for (const c of COLORS) for (const v of VARIANTS) {
      const b = page.locator(`[data-c="${c}"][data-v="${v}"]:not([data-dis])`)
      const snap = () => b.evaluate((el) => { const cs = getComputedStyle(el); return { color: cs.color, bg: cs.backgroundColor, bd: cs.borderTopColor, bw: cs.borderTopWidth, outline: cs.outlineColor, outlineStyle: cs.outlineStyle } })
      await page.mouse.move(0, 0); await settle(page)
      const rest = await snap()
      await b.hover(); await settle(page)
      const hover = await snap()
      await page.mouse.down(); await settle(page)
      const act = await snap()
      await page.mouse.up(); await page.mouse.move(0, 0); await settle(page)
      const dis = await page.locator(`[data-c="${c}"][data-v="${v}"][data-dis]`).evaluate((el) => { const cs = getComputedStyle(el); return { color: cs.color, bd: cs.borderTopColor, bg: cs.backgroundColor } })
      reads.push({ c, v, rest, hover, act, dis })
    }
    const fails = []
    for (const { c, v, rest, hover, act, dis } of reads) {
      for (const [st, r] of [['reposo', rest], ['hover', hover], ['active', act]]) {
        // Reposo: ButtonText. Hover y active: Highlight (regla propia; antes Chromium lo ponía solo y Firefox dejaba el color del tema).
        // El enlace no lleva caja en ningún estado: Canvas
        const okBd = v === 'link' ? [sys.Canvas] : [st === 'reposo' ? sys.ButtonText : sys.Highlight]
        if (!okBd.includes(r.bd)) fails.push(`${c} ${v} ${st}: borde ${r.bd} no es ninguno de ${okBd.join(' | ')}`)
        if (browserName === 'chromium' && r.color === sys.Canvas) fails.push(`${c} ${v} ${st}: texto del color del lienzo`)
        // texto visible: el sistema fuerza color y fondo; el texto nunca puede igualar el fondo opaco del botón
        if (r.color === r.bg) fails.push(`${c} ${v} ${st}: texto = fondo (${r.color})`)
      }
      if (dis.color !== sys.GrayText) fails.push(`${c} ${v} disabled: texto ${dis.color} ≠ GrayText ${sys.GrayText}`)
      if (dis.bd !== (v === 'link' ? sys.Canvas : sys.GrayText)) fails.push(`${c} ${v} disabled: borde ${dis.bd}`)
    }
    // Foco con teclado
    await page.mouse.move(0, 0)
    const b0 = page.locator('[data-c="brand"][data-v="solid"]:not([data-dis])')
    await page.mouse.click(2, 2); await page.keyboard.press('Tab')
    const focus = await b0.evaluate((el) => { const cs = getComputedStyle(el); return { oc: cs.outlineColor, os: cs.outlineStyle, ow: cs.outlineWidth, vis: el.matches(':focus-visible') } })
    // WebKit no pasa por Tab a los botones (preferencia de Safari): el foco con teclado se mide en Chromium y Firefox
    if (browserName !== 'webkit') {
      if (!focus.vis) fails.push('el botón no quedó con :focus-visible')
      if (focus.oc !== sys.Highlight) fails.push(`foco: outline ${focus.oc} ≠ Highlight ${sys.Highlight}`)
      if (focus.os === 'none') fails.push('foco sin contorno')
    }
    if (V) console.log(`[forced-colors ${test.info().project.name}] sys ${JSON.stringify(sys)} foco ${JSON.stringify(focus)} ejemplo solid ${JSON.stringify(reads[0].rest)} / ghost hover ${JSON.stringify(reads[3].hover)} / link act ${JSON.stringify(reads[4].act)} / outline hover ${JSON.stringify(reads[2].hover)} / soft hover ${JSON.stringify(reads[1].hover)}`)
    expect(fails, fails.slice(0, 12).join('\n')).toEqual([])
  })
})

// ============================================================ 4 · personalidad
test.describe('4 · GBtn personalidad', () => {
  test('(a) sin linear(): la transición base queda con --g-duration-press + --g-ease-out y los colores siguen transicionando', async ({ page }) => {
    await open(page, `<div class="row">${btn('g-btn--color-accent g-btn--variant-solid', 'Guardar', 'id="b"')}</div>`, {
      rewrite: (t) => t.replaceAll('@supports (transition-timing-function: linear(0,1)', '@supports (transition-timing-function: linear-inexistente(0,1)')
    })
    const r = await page.evaluate(async () => {
      const b = document.getElementById('b'); const cs = getComputedStyle(b)
      const tok = (n) => { const p = document.createElement('i'); p.style.transitionDuration = `var(--g-duration-${n})`; document.body.append(p); const d = getComputedStyle(p).transitionDuration; p.remove(); return d }
      const ease = (() => { const p = document.createElement('i'); p.style.transitionTimingFunction = 'var(--g-ease-out)'; document.body.append(p); const d = getComputedStyle(p).transitionTimingFunction; p.remove(); return d })()
      const props = cs.transitionProperty.split(',').map((x) => x.trim()); const durs = cs.transitionDuration.split(',').map((x) => x.trim()); const fns = cs.transitionTimingFunction.split(/,(?![^(]*\))/).map((x) => x.trim())
      const i = props.indexOf('transform')
      const sup = CSS.supports('transition-timing-function', 'linear(0, 1)')
      // los colores siguen transicionando: se fuerza un cambio de color y se mira la animación real
      b.style.setProperty('--_bg', 'rgb(1, 2, 3)')
      void b.offsetWidth
      const colorAnims = b.getAnimations().filter((a) => a.transitionProperty === 'background-color').map((a) => a.effect.getComputedTiming().duration)
      return { props, tDur: durs[i], tFn: fns[i], press: tok('press'), slow: tok('slow'), ease, sup, colorAnims, n: props.length }
    })
    expect(r.sup, 'el navegador sí soporta linear(): la prueba reescribe la condición').toBe(true)
    expect(r.props).toEqual(['background-color', 'border-color', 'color', 'transform'])
    expect(r.tDur).toBe(r.press)
    expect(r.tDur).not.toBe(r.slow)
    expect(r.tFn).toBe(r.ease)
    expect(r.colorAnims.length, 'transición de color presente').toBeGreaterThan(0)
    expect(r.colorAnims[0]).toBeCloseTo(120, 0)
    if (V) console.log(`[sin linear ${test.info().project.name}] transform ${r.tDur} ${r.tFn} (press ${r.press}, slow ${r.slow}); color ${r.colorAnims}ms`)
  })

  test('(a) con linear() (CSS real): la base usa --g-duration-slow + --g-ease-bounce', async ({ page }) => {
    await open(page, btn('', 'Guardar', 'id="b"'))
    const r = await page.evaluate(() => {
      const cs = getComputedStyle(document.getElementById('b'))
      const props = cs.transitionProperty.split(',').map((x) => x.trim()); const i = props.indexOf('transform')
      return { d: cs.transitionDuration.split(',')[i].trim(), f: cs.transitionTimingFunction.slice(cs.transitionTimingFunction.lastIndexOf('linear(')).slice(0, 7) }
    })
    expect(r.d).toBe('0.24s')
    expect(r.f).toBe('linear(')
  })

  test('(b) conteo de cuadros reales al soltar (rAF + getComputedStyle), solo con un worker', async ({ page, browserName }, testInfo) => {
    test.skip(browserName === 'chromium' ? false : testInfo.config.workers !== 1, 'fuera de Chromium el conteo en tiempo real solo se exige con --workers=1')
    await open(page, `<div style="padding:40px">${btn('g-btn--color-accent g-btn--variant-solid', 'Guardar', 'id="b"')}</div>`)
    const box = await page.locator('#b').boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(300)
    const h = page.evaluate(() => new Promise((res) => {
      const b = document.getElementById('b'); const xs = []; const t0 = performance.now()
      ;(function f() { const m = getComputedStyle(b).transform; xs.push(m === 'none' ? 1 : +m.slice(m.indexOf('(') + 1).split(',')[0]); if (performance.now() - t0 < 320) requestAnimationFrame(f); else res(xs) })()
    }))
    await page.waitForTimeout(16)
    await page.mouse.up()
    const xs = await h
    const distinct = new Set(xs.map((x) => x.toFixed(4))).size
    const over = xs.filter((x) => x > 1.0005).length
    if (V || true) console.log(`[cuadros ${testInfo.project.name}] ${xs.length} cuadros en 320ms, ${distinct} valores de escala distintos, ${over} por encima de 1`)
    expect(distinct, 'valores de escala distintos durante la vuelta').toBeGreaterThanOrEqual(6)
    expect(xs.at(-1)).toBe(1)
  })

  test('(c) puntero grueso emulado: área táctil de 44px y el toque fuera de la caja visible activa el botón', async ({ browser, browserName }) => {
    const ctx = await browser.newContext({ hasTouch: true, ...(browserName === 'firefox' ? {} : { isMobile: true }), viewport: { width: 400, height: 700 } })
    const page = await ctx.newPage()
    await open(page, `<div style="padding:60px 40px"><div class="row">${btn('g-btn--size-xs', 'OK', 'id="xs"')}${btn('g-btn--size-md', 'Guardar', 'id="md"')}${btn('g-btn--icon g-btn--size-sm', '<svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"/></svg>', 'id="ic" aria-label="x"')}</div></div>`)
    const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches)
    test.skip(!coarse, `${browserName} no emula pointer: coarse (queda pendiente de dispositivo real)`)
    const r = await page.evaluate(() => {
      window.__n = {}
      for (const id of ['xs', 'md', 'ic']) document.getElementById(id).addEventListener('click', () => { window.__n[id] = (window.__n[id] || 0) + 1 })
      return ['xs', 'md', 'ic'].map((id) => { const el = document.getElementById(id); const a = getComputedStyle(el, '::after'); const b = el.getBoundingClientRect(); return { id, w: parseFloat(a.width), h: parseFloat(a.height), bh: b.height, bw: b.width } })
    })
    for (const x of r) { expect(x.w, `${x.id} ancho del área`).toBeGreaterThanOrEqual(44); expect(x.h, `${x.id} alto del área`).toBeGreaterThanOrEqual(44) }
    // toque centrado y toque a 9px por encima de la caja de xs (24px de alto → el área de 44px llega a 10px fuera)
    const xs = await page.locator('#xs').boundingBox()
    await page.touchscreen.tap(xs.x + xs.width / 2, xs.y + xs.height / 2)
    await page.touchscreen.tap(xs.x + xs.width / 2, xs.y - 9)
    const n = await page.evaluate(() => window.__n.xs)
    expect(n, 'dos toques (centro y 9px fuera) activan xs').toBe(2)
    if (V) console.log(`[táctil ${test.info().project.name}] áreas ${JSON.stringify(r)} toques en xs ${n}`)
    await ctx.close()
  })
})
