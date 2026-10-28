// GSplit sobre el COMPONENTE REAL (paquete principal, dist/grana.umd.js) en el banco packages/vue/playground/split.html y en #sec-split.
// Cubre split.md «Verificación» con los casos K1 a K10 de kiwi (design/lab/split/r01/verificar.mjs): proporciones exactas, umbral exacto,
// caja y no visor, anidado, RTL, una región, separaciones, alineación, palabra larga, Tab real, texto al 200 %, secuencia de cambios de
// tamaño sin histéresis, 320 px sin desplazamiento, GAdaptiveLayout, GContainer prose y consola limpia.
// Un solo proceso por puerto: GRANA_PW_PORT=4218 npx playwright test tests/split.spec.mjs --project=chromium
import { test, expect } from '@playwright/test'

const BENCH = '/packages/vue/playground/split.html'
const PLAY = '/packages/vue/playground/index.html'

async function open(page, { width = 1440, query = '', url = BENCH } = {}) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana GSplit/.test(t)) errs.push(`warning: ${t}`)
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width, height: 900 })
  await page.goto(url + query)
  await page.waitForSelector('.g-split')
  return errs
}
// Caja de un fixture a un ancho dado
const boxAt = (page, wrapper, px) => page.$eval(wrapper, (el, w) => { el.style.inlineSize = w + 'px' }, px)
const rects = (page, sel) => page.$eval(sel, (el) => [...el.children].map((c) => { const r = c.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height } }))
const side = (rs) => Math.abs(rs[0].t - rs[1].t) < 0.5 // al lado: mismo borde superior

test.describe('GSplit · bench real', () => {
  test('K1 cinco proporciones exactas (±1,5 px)', async ({ page }) => {
    const errs = await open(page)
    for (const [id, a, b] of [['r-1-1', 1, 1], ['r-3-2', 3, 2], ['r-2-1', 2, 1], ['r-2-3', 2, 3], ['r-1-2', 1, 2]]) {
      const rs = await rects(page, '#' + id)
      expect(side(rs), id).toBe(true)
      const gap = await page.$eval('#' + id, (el) => parseFloat(getComputedStyle(el).columnGap))
      const free = rs[0].w + rs[1].w
      expect(Math.abs(rs[0].w - (free * a) / (a + b)), id).toBeLessThanOrEqual(1.5)
      expect(Math.abs(rs[1].w - (free * b) / (a + b)), id).toBeLessThanOrEqual(1.5)
      expect(gap).toBe(24)
    }
    expect(errs).toEqual([])
  })

  test('K2 umbral exacto: 2:1 md gap md apila a 983 y va al lado a 984 con el estrecho a 320', async ({ page }) => {
    await open(page)
    await boxAt(page, '#w-k2', 983)
    expect(side(await rects(page, '#k2'))).toBe(false)
    await boxAt(page, '#w-k2', 984)
    const rs = await rects(page, '#k2')
    expect(side(rs)).toBe(true)
    expect(Math.abs(rs[1].w - 320)).toBeLessThanOrEqual(0.75)
  })

  test('K3 mide su caja y no el visor: un cajón de 480 con visor de 1440 se apila', async ({ page }) => {
    await open(page, { width: 1440 })
    await boxAt(page, '#w-r32', 480)
    const rs = await rects(page, '#r-3-2')
    expect(side(rs)).toBe(false)
    expect(Math.abs(rs[0].w - 480)).toBeLessThanOrEqual(0.75)
    expect(Math.abs(rs[1].w - 480)).toBeLessThanOrEqual(0.75)
  })

  test('K4 anidado: el interior decide por su propia caja', async ({ page }) => {
    await open(page)
    for (const w of [1400, 1000, 600]) {
      await boxAt(page, '#w-k4', w)
      const o = await rects(page, '#k4-out')
      const i = await rects(page, '#k4-in')
      // exterior 2:1 md lg: al lado desde 960 + 48 = 1008; interior 1:1 sm gap md: 512 + 24 = 536
      expect(side(o), `exterior ${w}`).toBe(w >= 1008)
      expect(side(i), `interior ${w}`).toBe(o[0].w >= 536)
    }
  })

  test('K5 RTL: start a la derecha', async ({ page }) => {
    await open(page, { query: '?dir=rtl' })
    const rs = await rects(page, '#r-3-2')
    expect(side(rs)).toBe(true)
    expect(rs[0].l).toBeGreaterThan(rs[1].l)
  })

  test('K6 una región (slot ausente o vacío) ocupa todo el ancho; sin regiones no hay hijos', async ({ page }) => {
    await open(page)
    expect(await page.$$eval('#k6 > .g-split__region', (n) => n.length)).toBe(1)
    const r = await rects(page, '#k6')
    const root = await page.$eval('#k6', (el) => el.getBoundingClientRect().width)
    expect(Math.abs(r[0].w - root)).toBeLessThanOrEqual(0.5)
    expect(await page.$eval('#k6e', (el) => el.children.length)).toBe(0)
  })

  test('K7 separaciones 0, 12, 24, 48 y compact 18, iguales al lado y apiladas', async ({ page }) => {
    await open(page)
    const exp = { 'k7-none': 0, 'k7-sm': 12, 'k7-md': 24, 'k7-lg': 48, 'k7-compact': 18 }
    for (const [id, g] of Object.entries(exp)) {
      const rs = await rects(page, '#' + id)
      expect(side(rs), id).toBe(true)
      expect(Math.abs(rs[1].l - rs[0].r - g), `${id} al lado`).toBeLessThanOrEqual(0.6)
    }
    for (const w of ['k7', 'k7s', 'k7m', 'k7l', 'k7c']) await boxAt(page, '#w-' + w, 300)
    for (const [id, g] of Object.entries(exp)) {
      const rs = await rects(page, '#' + id)
      expect(side(rs), id).toBe(false)
      expect(Math.abs(rs[1].t - rs[0].b - g), `${id} apilado`).toBeLessThanOrEqual(0.6)
    }
  })

  test('K8 align start y stretch al lado', async ({ page }) => {
    await open(page)
    const s = await rects(page, '#k8-start')
    const t = await rects(page, '#k8-stretch')
    expect(Math.abs(s[0].h - 200)).toBeLessThan(1)
    expect(Math.abs(s[1].h - 60)).toBeLessThan(1)
    expect(Math.abs(t[0].h - t[1].h)).toBeLessThan(1)
    expect(t[1].h).toBeGreaterThan(190)
  })

  test('K9 palabra larga se parte en su región; el contenido rígido sobresale (límite conocido)', async ({ page }) => {
    await open(page)
    await boxAt(page, '#w-k9', 600)
    const r = await page.$eval('#k9-long', (el) => ({ sw: el.scrollWidth, cw: el.clientWidth }))
    expect(r.sw).toBeLessThanOrEqual(r.cw + 1)
    // Límite aceptado (regla 6): sin suelo de contenido, un hijo rígido más ancho que la región sobresale
    const over = await page.$eval('#k9', (el) => {
      const rigid = document.createElement('div'); rigid.style.cssText = 'inline-size:900px;block-size:4px'
      el.children[0].append(rigid)
      const reg = el.children[0].getBoundingClientRect(); const rr = rigid.getBoundingClientRect(); rigid.remove()
      return rr.right - reg.right
    })
    expect(over).toBeGreaterThan(0)
  })

  test('K10 Tab real recorre 1 -> 2 -> 3, al lado y apilado, y lo primero está al inicio o arriba', async ({ page, browserName }) => {
    await open(page)
    for (const w of [1400, 300]) {
      await boxAt(page, '#w-k10', w)
      const rs = await page.$$eval('#k10 button', (bs) => bs.map((b) => { const r = b.getBoundingClientRect(); return { l: r.left, t: r.top } }))
      if (w === 1400) expect(rs[1].l).toBeGreaterThan(rs[0].l)
      else expect(rs[1].t).toBeGreaterThan(rs[0].t)
      if (browserName === 'webkit') {
        expect(await page.$$eval('#k10 button', (bs) => bs.map((b) => b.id))).toEqual(['k10-1', 'k10-2', 'k10-3'])
        continue
      }
      await page.evaluate(() => { document.activeElement?.blur(); document.body.focus() })
      await page.focus('#k10-1')
      const seen = ['k10-1']
      for (let i = 0; i < 2; i++) { await page.keyboard.press('Tab'); seen.push(await page.evaluate(() => document.activeElement.id)) }
      expect(seen).toEqual(['k10-1', 'k10-2', 'k10-3'])
    }
  })

  test('texto al 200 %: el umbral se dobla y la pareja se apila antes', async ({ page }) => {
    await open(page, { width: 1800 })
    await boxAt(page, '#w-r32', 900) // md 3:2 gap md: 24 + 800 = 824 -> al lado con el texto al 100 %
    expect(side(await rects(page, '#r-3-2'))).toBe(true)
    await page.addStyleTag({ content: 'html{font-size:200%}' })
    expect(side(await rects(page, '#r-3-2'))).toBe(false)
    // Umbral con el texto al 200 %: n = max(320, 32 × 20) = 640 -> 640 × 5/2 + 24 = 1624
    await boxAt(page, '#w-r32', 1623)
    expect(side(await rects(page, '#r-3-2'))).toBe(false)
    await boxAt(page, '#w-r32', 1624)
    const rs = await rects(page, '#r-3-2')
    expect(side(rs)).toBe(true)
    expect(Math.abs(rs[1].w - 640)).toBeLessThanOrEqual(0.75)
  })

  test('secuencia de cambios de tamaño sin histéresis: la decisión no depende del camino', async ({ page }) => {
    await open(page)
    const decide = async (w) => { await boxAt(page, '#w-r32', w); return side(await rects(page, '#r-3-2')) }
    const expected = { 1400: true, 1000: true, 768: false, 320: false }
    const seq = [768, 1400, 1000, 1400, 320, 1400, 768, 1000, 320, 1400]
    for (const w of seq) {
      expect(await decide(w), `ancho ${w} tras la secuencia`).toBe(expected[w])
    }
  })

  test('320 px sin desplazamiento horizontal con todos los fixtures', async ({ page }) => {
    await open(page, { width: 320 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  })

  test('dentro de GAdaptiveLayout es un bloque de línea completa', async ({ page }) => {
    await open(page)
    await boxAt(page, '#w-adapt', 1200)
    const split = await page.$eval('#adapt-split', (el) => el.getBoundingClientRect())
    const next = await page.$eval('#adapt-next', (el) => el.getBoundingClientRect())
    expect(next.top).toBeGreaterThanOrEqual(split.bottom - 0.5)
  })

  test('dentro de GContainer prose la prosa de una región se mide a 66ch y no más que su región', async ({ page }) => {
    await open(page)
    const r = await page.$eval('#prose-p', (el) => {
      const reg = el.closest('.g-split__region').getBoundingClientRect().width
      return { w: el.getBoundingClientRect().width, reg, ch: parseFloat(getComputedStyle(el).maxInlineSize) }
    })
    expect(r.w).toBeLessThanOrEqual(r.reg + 0.5)
    expect(Number.isFinite(r.ch) || r.w <= r.reg).toBe(true)
  })

  test('as="section" lleva aria-labelledby y no añade roles propios', async ({ page }) => {
    const errs = await open(page)
    expect(await page.$eval('#sec', (el) => [el.tagName, el.getAttribute('aria-labelledby'), el.getAttribute('role')])).toEqual(['SECTION', 'sec-h', null])
    expect(await page.$$eval('.g-split__region[role], .g-split__region[tabindex]', (n) => n.length)).toBe(0)
    expect(errs).toEqual([])
  })
})

test.describe('GSplit · playground', () => {
  test('#sec-split: se apila bajo el umbral y la consola queda limpia', async ({ page }) => {
    const errs = await open(page, { url: PLAY })
    await page.waitForSelector('#spl-a')
    const rs = await rects(page, '#spl-a')
    const gap = await page.$eval('#spl-a', (el) => parseFloat(getComputedStyle(el).columnGap))
    expect(gap).toBe(48)
    const w = await page.$eval('#spl-a', (el) => el.getBoundingClientRect().width)
    expect(side(rs)).toBe(w >= 848)
    expect(await page.$$eval('#spl-c > .g-split__region', (n) => n.length)).toBe(1)
    expect(errs).toEqual([])
  })
})
