// GContainer (design/contracts/container.md «Verificación · Playwright»; DECISIONS.md #717, #718, #721 a #724) sobre el
// COMPONENTE REAL (paquete principal, dist/grana.umd.js) en el banco packages/vue/playground/container.html, sin chasis
// (dentro de GAppShell lo mide app-shell.spec.mjs). Port de design/lab/container/r01/verificar.mjs (kiwi). En Chromium,
// Firefox y WebKit. Un solo proceso por puerto: GRANA_PW_PORT=4212.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/container.html'
const MAX = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536, full: Infinity } // space × 160 · 192 · 256 · 320 · 384 con space 4
const md = (box) => Math.min(48, Math.max(16, box * 0.04)) // clamp(space-4, 4cqi, space-12)

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 30)))))
async function open(page, qs = '', { width = 1440, height = 900 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForSelector('#c-main')
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
}
const rect = (p, sel) => p.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width } }, sel)
const col = (p, id = '#c-main') => rect(p, `${id} > .g-container__body`)
const insets = (p, id = '#c-main') => p.evaluate((id) => { const cs = getComputedStyle(document.querySelector(`${id} > .g-container__body`)); return [parseFloat(cs.getPropertyValue('--g-container-inset-start')), parseFloat(cs.getPropertyValue('--g-container-inset-end'))] }, id)
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const near = (a, b, t = 1) => Math.abs(a - b) <= t

test.describe('GContainer · anchos y margen (base)', () => {
  for (const width of Object.keys(MAX)) {
    test(`width="${width}" en seis visores: columna = min(caja − 2 × margen, máximo), centrada; publicados = reales; sin desbordar`, async ({ page }) => {
      const errs = watchConsole(page)
      await open(page, `?width=${width}`)
      for (const vw of [320, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width: vw, height: 800 })
        await settle(page)
        const box = await rect(page, '#c-main')
        const c = await col(page)
        const want = Math.min(box.width - 2 * md(box.width), MAX[width])
        expect(near(c.width, want), `${width} @${vw}: ${c.width} ≈ ${want}`).toBe(true)
        expect(near(c.left - box.left, box.right - c.right)).toBe(true)
        const [s, e] = await insets(page)
        expect(near(s, c.left - box.left)).toBe(true)
        expect(near(e, box.right - c.right)).toBe(true)
        expect(await overflow(page)).toBe(false)
      }
      expect(errs).toEqual([])
    })
  }

  test('width="reading": la columna es 66ch de su fuente, nunca más que la caja', async ({ page }) => {
    await open(page, '?width=reading')
    const ch66 = await page.evaluate(() => { const s = document.createElement('span'); s.style.cssText = 'display:inline-block;inline-size:66ch'; document.querySelector('#c-main > .g-container__body').appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w })
    expect(near((await col(page)).width, ch66)).toBe(true)
    await page.setViewportSize({ width: 320, height: 640 })
    await settle(page)
    expect(near((await col(page)).width, 320 - 2 * 16)).toBe(true)
  })

  test('margen continuo: md crece 4 px por cada 100 px de caja entre 500 y 1100 (sin escalones)', async ({ page }) => {
    await open(page, '?width=full')
    const g = []
    for (let w = 500; w <= 1100; w += 100) {
      await page.evaluate((w) => { document.getElementById('box').style.inlineSize = `${w}px` }, w)
      await settle(page)
      g.push((await insets(page))[0])
    }
    for (let i = 1; i < g.length; i++) expect(near(g[i] - g[i - 1], 4, 0.1)).toBe(true)
  })

  test('gutter sm y lg con su clamp; none = 0', async ({ page }) => {
    for (const [gutter, fn] of [['sm', (b) => Math.min(24, Math.max(12, b * 0.02))], ['lg', (b) => Math.min(64, Math.max(24, b * 0.06))], ['none', () => 0]]) {
      await open(page, `?width=full&gutter=${gutter}`)
      for (const vw of [390, 1440]) {
        await page.setViewportSize({ width: vw, height: 800 })
        await settle(page)
        const box = await rect(page, '#c-main')
        expect(near((await insets(page))[0], fn(box.width))).toBe(true)
      }
    }
  })

  test('anidado sin margen acumulado; dentro de GSurface empieza en su relleno', async ({ page }) => {
    await open(page)
    const outer = await col(page)
    const nested = await col(page, '#c-nested')
    expect(near(nested.left, outer.left)).toBe(true) // horizontal="start" y auto anidado = 0
    expect(near(nested.width, 640)).toBe(true)
    const surf = await page.evaluate(() => { const s = document.getElementById('surf'); const r = s.getBoundingClientRect(); const cs = getComputedStyle(s); return { left: r.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft), right: r.right - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingRight) } })
    const inner = await col(page, '#c-surf')
    expect(near(inner.left, surf.left)).toBe(true)
    expect(near(inner.right, surf.right)).toBe(true)
  })

  for (const dir of ['ltr', 'rtl']) {
    test(`horizontal="start" (${dir}): el margen al inicio lógico y el sobrante al final; publicados`, async ({ page }) => {
      await open(page, `?width=md&horizontal=start&dir=${dir}`)
      const box = await rect(page, '#c-main')
      const c = await col(page)
      const g = md(box.width)
      const [s, e] = await insets(page)
      if (dir === 'ltr') {
        expect(near(c.left - box.left, g)).toBe(true)
        expect(near(s, g)).toBe(true)
        expect(near(e, box.right - c.right)).toBe(true)
      } else {
        expect(near(box.right - c.right, g)).toBe(true)
        expect(near(s, g)).toBe(true)
        expect(near(e, c.left - box.left)).toBe(true)
      }
    })
  }
})

test.describe('GContainer · B · Sangrado alineado (#722)', () => {
  for (const [vw, dir] of [[390, 'ltr'], [1440, 'ltr'], [1440, 'rtl']]) {
    test(`a ${vw} (${dir}): bandas, banda profunda y g-bleed-raw llegan al borde de la caja; su contenido sigue en la columna`, async ({ page }) => {
      await open(page, `?dir=${dir}`, { width: vw })
      const box = await rect(page, '#c-main')
      const c = await col(page)
      for (const sel of ['#band', '#raw', '#deep', '#scroller']) {
        const b = await rect(page, sel)
        expect(near(b.left, box.left), `${sel} izquierda`).toBe(true)
        expect(near(b.right, box.right), `${sel} derecha`).toBe(true)
      }
      for (const sel of ['#band-p', '#deep-p']) {
        const t = await rect(page, sel)
        expect(near(t.left, c.left), `${sel}`).toBe(true)
        expect(near(t.right, c.right), `${sel}`).toBe(true)
      }
      // Publicado en un descendiente profundo = el real
      const deep = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('deep-p')).getPropertyValue('--g-container-inset-start')))
      expect(near(deep, dir === 'ltr' ? c.left - box.left : box.right - c.right)).toBe(true)
      expect(await overflow(page)).toBe(false)
    })
  }

  test('el desplazable ancho arranca alineado con el texto y termina alineado con el final de la columna', async ({ page, browserName }) => {
    await open(page, '', { width: 390 })
    const c = await col(page)
    expect(near((await rect(page, '#cell-1')).left, c.left)).toBe(true)
    await page.evaluate(() => { const s = document.getElementById('scroller'); s.scrollLeft = s.scrollWidth })
    await settle(page)
    const last = await rect(page, '#cell-16')
    expect(near(last.right, c.right, browserName === 'webkit' ? 1.5 : 1)).toBe(true) // WebKit desplaza a píxel entero
  })
})

test.describe('GContainer · A · Medida (prose)', () => {
  test('la prosa de la columna en 66ch y al inicio; la de una tabla, g-wide y un componente de Grana, fuera', async ({ page }) => {
    await open(page, '?width=xl&prose=1')
    const c = await col(page)
    const ch66 = await page.evaluate(() => { const s = document.createElement('span'); s.style.cssText = 'display:inline-block;inline-size:66ch'; document.querySelector('#c-main > .g-container__body').appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w })
    for (const sel of ['#p1', '#ul1', '#h2']) {
      const r = await rect(page, sel)
      expect(near(r.width, ch66), `${sel} en la medida`).toBe(true)
      expect(near(r.left, c.left)).toBe(true)
    }
    expect((await rect(page, '#wide-p')).width).toBeGreaterThan(ch66 + 10)
    expect((await rect(page, '#tbl-p')).width).toBeGreaterThan(0)
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('tbl-p')).maxInlineSize)).toBe('none')
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('surf-p')).maxInlineSize)).toBe('none')
  })

  test('sin prose, la prosa usa la columna entera', async ({ page }) => {
    await open(page, '?width=xl')
    expect(near((await rect(page, '#p1')).width, (await col(page)).width)).toBe(true)
  })
})

test.describe('GContainer · --g-container-max, intrínseco, pegado y reflujo', () => {
  test('--g-container-max en la raíz gana a width (también a full) y no pasa a un anidado', async ({ page }) => {
    for (const w of ['lg', 'full']) {
      await open(page, `?width=${w}&max=600`)
      const box = await rect(page, '#c-main')
      const c = await col(page)
      expect(near(c.width, 600)).toBe(true)
      expect(near(c.left - box.left, box.right - c.right)).toBe(true)
      expect(await page.evaluate(() => getComputedStyle(document.getElementById('c-nested')).getPropertyValue('--g-container-max').trim())).toBe('0px')
    }
  })

  test('contención en línea (#562): en un padre que se ajusta mide su máximo, nunca 0', async ({ page }) => {
    await open(page)
    expect(near((await rect(page, '#c-intr')).width, 640)).toBe(true)
    const ch66 = await page.evaluate(() => { const s = document.createElement('span'); s.style.cssText = 'display:inline-block;inline-size:66ch'; document.getElementById('c-intr-reading').appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w })
    expect(near((await rect(page, '#c-intr-reading')).width, ch66, 2)).toBe(true)
  })

  test('no atrapa lo fijo ni corta el pegado (#724): GPageHeader real se pega a toda la página; un fijo dentro sigue en el visor', async ({ page }) => {
    await open(page, '?ph=1', { width: 1280, height: 800 })
    await page.evaluate(() => scrollTo({ top: 1200, behavior: 'instant' }))
    await settle(page)
    await settle(page)
    expect(await page.evaluate(() => document.getElementById('ph').classList.contains('is-stuck'))).toBe(true)
    expect(near((await rect(page, '#ph .g-page-header__base')).top, 0)).toBe(true)
    expect(near((await rect(page, '#fixed')).bottom, 800)).toBe(true)
  })

  test('320 × 256: una URL larga se parte dentro de la columna; sin desplazamiento horizontal', async ({ page }) => {
    await open(page, '', { width: 320, height: 256 })
    const c = await col(page)
    const u = await rect(page, '#url')
    expect(u.right).toBeLessThanOrEqual(c.right + 0.5)
    expect(await overflow(page)).toBe(false)
  })
})
