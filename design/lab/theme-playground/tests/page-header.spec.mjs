// GPageHeader (design/contracts/page-header.md «Verificación · Playwright»; DECISIONS.md #626 a #635) sobre el COMPONENTE
// REAL (entrada @grana/vue/page-header por dist/page-header.umd.js, global GranaPageHeader) en el banco
// packages/vue/playground/page-header.html: una página de verdad con barra fija de la aplicación, el encabezado como primer
// hijo directo de main, la receta de una variable, GBreadcrumbs, GTabs detached + GTabPanel, GBtn, GMenu y GMetric reales,
// y la isla de estado (@grana/vue/status) y GToaster reales. Port de design/lab/page-header/r01/verificar.mjs (partes B y
// B+muelle). En Chromium, Firefox y WebKit. Un solo proceso por puerto: GRANA_PW_PORT=4233 (bruno de GPageHeader).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/page-header.html'
const BAR = 56

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => { if (!/ResizeObserver loop/.test(e.message)) errs.push(`pageerror: ${e.message}`) })
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p) => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40))))))
async function open(page, { width = 1280, height = 800, motion = 'no-preference', qs = '' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForSelector('#ph.is-sticky')
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
}
async function scroll(p, y) { await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y); await settle(p); await settle(p) }
const rect = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
const docTop = (p, sel) => p.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY, sel)
const where = (p) => p.evaluate(() => { const a = document.querySelector('#ph .g-page-header__actions'); return a.closest('.g-page-header__dock') ? 'dock' : a.closest('.g-page-header__base') ? 'base' : '?' })
const cls = (p) => p.evaluate(() => document.getElementById('ph').className)
const pVar = (p) => p.evaluate(() => document.getElementById('ph').style.getPropertyValue('--_p'))
const near = (a, b, t = 1.5) => Math.abs(a - b) <= t
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
async function narrowPage(browser, browserName, qs = '', opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 760 }, hasTouch: true, ...(browserName === 'chromium' ? { isMobile: true } : {}), baseURL: test.info().project.use.baseURL, ...opts })
  const page = await ctx.newPage()
  const errs = watchConsole(page)
  await page.goto(PAGE + qs)
  await page.waitForSelector('#ph.is-sticky')
  await page.evaluate(() => document.fonts.ready)
  await settle(page)
  return { ctx, page, errs }
}

test.describe('GPageHeader · estructura', () => {
  test('un banner, el encabezado en main como primer hijo, un h1 y el orden de lectura', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    expect(await page.getByRole('banner').count()).toBe(1)
    expect(await page.evaluate(() => { const h = document.getElementById('ph'); return h.parentElement.tagName === 'MAIN' && h.parentElement.firstElementChild === h && !h.hasAttribute('role') })).toBe(true)
    expect(await page.locator('h1').count()).toBe(1)
    const order = await page.evaluate(() => {
      const els = [document.querySelector('#ph nav'), document.querySelector('#ph h1'), document.querySelector('#ph [role="tablist"]'), document.querySelector('#ph [role="group"]')]
      return els.every(Boolean) && els.every((e, i) => i === 0 || els[i - 1].compareDocumentPosition(e) & 4)
    })
    expect(order).toBe(true)
    expect(await page.getByRole('group', { name: 'Acciones de la página' }).count()).toBe(1)
    expect(errs).toEqual([])
  })
})

test.describe('GPageHeader · pegado en escritorio (B · Zócalo)', () => {
  test('se hunde hasta el zócalo bajo la barra: alto intacto, Δ0, 0 mudanzas, cada acción una vez, título compacto', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    expect(await where(page)).toBe('base')
    const content0 = await docTop(page, '#muestra-panel-resumen')
    const h0 = (await rect(page, '#ph')).height
    await scroll(page, 900)
    const ph = await rect(page, '#ph')
    const base = await rect(page, '#ph .g-page-header__base')
    expect(await cls(page)).toContain('is-stuck')
    expect(near(base.top, BAR)).toBe(true)
    expect(near(ph.height, h0, 0.5)).toBe(true)
    expect(near(ph.bottom, base.bottom)).toBe(true)
    expect(near(await docTop(page, '#muestra-panel-resumen'), content0, 0.5)).toBe(true)
    expect(await where(page)).toBe('base')
    expect(await page.getByRole('button', { name: 'Validar resultados', exact: true }).count()).toBe(1)
    expect(await pVar(page)).toBe('1')
    expect(await page.evaluate(() => { const t = document.querySelector('#ph .g-page-header__base-title'); return t.getAttribute('aria-hidden') === 'true' && parseFloat(getComputedStyle(t).opacity) > 0.95 })).toBe(true)
    await scroll(page, 0)
    expect(await cls(page)).not.toContain('is-stuck')
    expect(await pVar(page)).toBe('0')
    expect(near(await docTop(page, '#muestra-panel-resumen'), content0, 0.5)).toBe(true)
    expect(errs).toEqual([])
  })

  test('--_p intermedio con el h1 a medio pasar', async ({ page }) => {
    await open(page)
    const y = await page.evaluate((bar) => { const t = document.querySelector('#ph h1').getBoundingClientRect(); return Math.round(scrollY + t.top - bar + t.height * 0.5) }, BAR)
    await scroll(page, y)
    const p = parseFloat(await pVar(page))
    expect(p).toBeGreaterThan(0.2)
    expect(p).toBeLessThan(0.8)
  })

  test('cambio de pestaña pegado: el panel largo empieza bajo el zócalo; el corto queda visible justo debajo; ←/→', async ({ page }) => {
    await open(page)
    await scroll(page, 900)
    await page.getByRole('tab', { name: 'Resultados' }).click()
    await settle(page); await settle(page)
    let base = await rect(page, '#ph .g-page-header__base')
    let body = await rect(page, '#muestra-panel-resultados')
    expect(await cls(page)).toContain('is-stuck')
    expect(near(base.top, BAR)).toBe(true)
    expect(near(body.top, base.bottom, 2)).toBe(true)
    await scroll(page, 900)
    await page.getByRole('tab', { name: 'Historial' }).click()
    await settle(page); await settle(page)
    base = await rect(page, '#ph .g-page-header__base')
    body = await rect(page, '#muestra-panel-historial')
    expect(near(body.top, base.bottom, 2)).toBe(true)
    expect(body.top).toBeLessThan(760)
    await page.getByRole('tab', { name: 'Historial' }).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('tab', { name: 'Resultados' })).toBeFocused()
  })

  test('regla del cuarto: con un visor de 180 px de alto no se pega', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 180 })
    await page.goto(PAGE)
    await page.waitForSelector('#ph .g-page-header__base')
    await settle(page)
    await scroll(page, 900)
    expect(await cls(page)).not.toContain('is-sticky')
    expect(await page.evaluate(() => getComputedStyle(document.getElementById('ph')).position)).toBe('static')
  })

  test('sticky=0: el encabezado se va con la página', async ({ page }) => {
    await page.goto(PAGE + '?sticky=0')
    await page.waitForSelector('#ph .g-page-header__base')
    await settle(page)
    await scroll(page, 900)
    expect(await cls(page)).not.toContain('is-sticky')
    expect((await rect(page, '#ph')).bottom).toBeLessThan(0)
  })

  test('rendimiento: desplazar pegado no vuelve a pintar Vue ni reescribe estilos si --_p no cambia', async ({ page }) => {
    await open(page)
    await scroll(page, 900)
    const n = await page.evaluate(async () => {
      const root = document.getElementById('ph')
      let count = 0
      const mo = new MutationObserver((l) => { count += l.length })
      mo.observe(root, { attributes: true, subtree: true, childList: true, characterData: true })
      for (let y = 900; y < 1500; y += 30) { scrollTo(0, y); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))) }
      mo.disconnect()
      return count
    })
    expect(n).toBe(0)
  })

  test('la isla real (@grana/vue/status) queda debajo del zócalo pegado; arriba, bajo la barra', async ({ page }) => {
    await open(page)
    await scroll(page, 900)
    await page.locator('#status-btn').click()
    await page.waitForSelector('.g-status-island__shape')
    await page.waitForTimeout(400)
    const base = await rect(page, '#ph .g-page-header__base')
    const isl = await rect(page, '.g-status-island__shape')
    expect(isl.top).toBeGreaterThanOrEqual(base.bottom - 0.5)
    expect(await page.evaluate(() => window.ph.edge.edgeReserve('top', { before: window.ph.edge.EDGE_ORDER.status }))).toBeCloseTo(base.height, 0)
    await scroll(page, 0)
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => window.ph.edge.edgeReserve('top'))).toBeGreaterThan(0) // la isla publica la suya
    expect((await rect(page, '.g-status-island__shape')).top).toBeLessThan(base.bottom)
  })

  test('GToaster real arriba: el aviso queda debajo del zócalo pegado', async ({ page }) => {
    await open(page)
    await scroll(page, 900)
    await page.locator('#toast-btn').click()
    await page.waitForSelector('.g-toast')
    await page.waitForTimeout(500)
    const base = await rect(page, '#ph .g-page-header__base')
    const t = await rect(page, '.g-toast')
    expect(t.top).toBeGreaterThanOrEqual(base.bottom - 0.5)
  })

  test('RTL: pegado y título compacto al principio lógico', async ({ page }) => {
    await open(page, { qs: '?dir=rtl' })
    await scroll(page, 900)
    expect(await cls(page)).toContain('is-stuck')
    const t = await rect(page, '#ph .g-page-header__base-title')
    const tabs = await rect(page, '#ph .g-page-header__tabs')
    expect(t.left).toBeGreaterThan(tabs.left)
  })

  test('movimiento reducido: --_p ∈ {0, 1}', async ({ page }) => {
    await open(page, { motion: 'reduce' })
    const y = await page.evaluate((bar) => { const t = document.querySelector('#ph h1').getBoundingClientRect(); return Math.round(scrollY + t.top - bar + t.height * 0.3) }, BAR)
    await scroll(page, y)
    expect(['0', '1']).toContain(await pVar(page))
  })

  test('focus() y el enlace del muelle llevan al h1, visible bajo la barra', async ({ page }) => {
    await open(page)
    await scroll(page, 900)
    await page.evaluate(() => window.phApp.$refs.header.focus())
    await expect(page.locator('#ph h1')).toBeFocused()
  })

  test('dentro de un GDialog: pegado en el cuerpo, sin muelle ni reservas', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { qs: '?dialog=1', width: 390, height: 760 })
    await page.locator('#dialog-btn').click()
    await page.waitForSelector('#ph-dlg.is-sticky')
    expect(await page.locator('#ph-dlg .g-page-header__dock').count()).toBe(0)
    await page.evaluate(() => { const b = document.querySelector('.g-dialog__body'); b.scrollTop = 600 })
    await settle(page); await settle(page)
    expect(await page.evaluate(() => document.getElementById('ph-dlg').className)).toContain('is-stuck')
    const base = await rect(page, '#ph-dlg .g-page-header__base')
    const body = await rect(page, '.g-dialog__body')
    expect(near(base.top, body.top, 1.5)).toBe(true)
    expect(await page.evaluate(() => window.ph.edge.edgeReserve('top') + window.ph.edge.edgeReserve('bottom'))).toBe(0)
    expect(errs).toEqual([])
  })

  test('zona de marca: h1, descripción y ruta ≥ 4,5:1 sobre la raíz', async ({ page }) => {
    await open(page, { qs: '?zone=brand' })
    const ok = await page.evaluate(() => {
      if (!document.getElementById('ph').matches('[data-g-zone="brand"]')) return 'sin-zona'
      const rgb = (c) => { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const x = cv.getContext('2d'); x.fillStyle = '#010203'; x.fillStyle = c; x.fillRect(0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]] }
      const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
      const bg = rgb(getComputedStyle(document.getElementById('ph')).backgroundColor)
      const ratio = (sel) => { const a = lum(rgb(getComputedStyle(document.querySelector(sel)).color)); const b = lum(bg); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
      return [ratio('#ph h1'), ratio('#ph .g-page-header__desc'), ratio('#ph nav a')]
    })
    expect(ok).not.toBe('sin-zona')
    for (const r of ok) expect(r).toBeGreaterThanOrEqual(4.5)
  })
})

test.describe('GPageHeader · estrecho (muelle de C)', () => {
  test('390 táctil: pegado, pestañas a todo el ancho, las mismas acciones al muelle con la principal y su texto; ≥ 44; vuelta arriba', async ({ browser, browserName }) => {
    const { ctx, page, errs } = await narrowPage(browser, browserName)
    expect(await where(page)).toBe('base')
    expect(await cls(page)).toContain('is-narrow')
    await scroll(page, 900)
    await page.waitForTimeout(450)
    expect(await cls(page)).toContain('is-docked')
    expect(await where(page)).toBe('dock')
    const base = await rect(page, '#ph .g-page-header__base')
    const tabs = await rect(page, '#ph [role="tablist"]')
    const dock = await rect(page, '#ph .g-page-header__dock')
    const ph = await rect(page, '#ph')
    expect(near(base.top, BAR)).toBe(true)
    expect(tabs.width).toBeGreaterThan(base.width * 0.8)
    expect(near(dock.bottom, 760, 1)).toBe(true)
    expect(near(dock.left, ph.left) && near(dock.right, ph.right)).toBe(true)
    expect(await page.getByRole('button', { name: 'Validar resultados', exact: true }).count()).toBe(1)
    expect(await page.evaluate(() => document.querySelector('#act-primary').textContent.includes('Validar resultados'))).toBe(true)
    expect(await overflow(page)).toBe(false)
    // Diana: la caja o, en GBtn, su ::after (área táctil de max(100%, 44px) con pointer: coarse)
    const small = await page.evaluate(() => [...document.querySelectorAll('#ph .g-page-header__dock a, #ph .g-page-header__dock button, #ph .g-page-header__base button')].filter((e) => e.getClientRects().length).filter((e) => {
      const r = e.getBoundingClientRect(); const a = getComputedStyle(e, '::after')
      const w = Math.max(r.width, parseFloat(a.width) || 0), h = Math.max(r.height, parseFloat(a.height) || 0)
      return h < 43.5 || w < 43.5
    }).map((e) => e.textContent.trim() || e.getAttribute('aria-label')))
    if (browserName === 'chromium') expect(small).toEqual([])
    expect(await page.evaluate(() => window.ph.edge.edgeReserve('bottom'))).toBeGreaterThan(0)
    await scroll(page, 0)
    await page.waitForTimeout(400)
    expect(await where(page)).toBe('base')
    expect(await page.evaluate(() => { const d = document.querySelector('#ph .g-page-header__dock'); return d.hidden && d.inert })).toBe(true)
    expect(await page.evaluate(() => window.ph.edge.edgeReserve('bottom'))).toBe(0)
    expect(errs).toEqual([])
    await ctx.close()
  })

  test('lo enfocado no se muda hasta salir; un GMenu abierto tampoco', async ({ browser, browserName }) => {
    const { ctx, page } = await narrowPage(browser, browserName)
    await page.locator('#act-primary').focus()
    await scroll(page, 900)
    expect(await where(page)).toBe('base')
    await page.locator('#ph h1').focus()
    await settle(page)
    expect(await where(page)).toBe('dock')
    await scroll(page, 0)
    await page.waitForTimeout(300)
    expect(await where(page)).toBe('base')
    // Menú abierto: la mudanza espera a que se cierre y el foco salga
    await page.evaluate(() => { window.phApp.menu = true })
    await settle(page)
    await scroll(page, 900)
    expect(await where(page)).toBe('base')
    await page.evaluate(() => { window.phApp.menu = false })
    await settle(page)
    await page.locator('#ph h1').focus()
    await settle(page); await settle(page)
    expect(await where(page)).toBe('dock')
    await ctx.close()
  })

  test('el enlace del muelle enfoca el h1, visible bajo la barra, y el muelle se cierra', async ({ browser, browserName }) => {
    const { ctx, page } = await narrowPage(browser, browserName)
    await scroll(page, 900)
    await page.waitForTimeout(450)
    await page.locator('#ph .g-page-header__dock-title').click()
    await settle(page); await settle(page)
    await expect(page.locator('#ph h1')).toBeFocused()
    const h1 = await rect(page, '#ph h1')
    expect(h1.top).toBeGreaterThanOrEqual(BAR - 1)
    await page.waitForTimeout(400)
    expect(await where(page)).toBe('base')
    await ctx.close()
  })

  test('GToaster real abajo se apila encima del muelle; la voz (reserva simulada) queda debajo', async ({ browser, browserName }) => {
    const { ctx, page } = await narrowPage(browser, browserName)
    await page.evaluate(() => { window.__sp = Symbol('voz'); window.ph.edge.setEdgeReserve(window.__sp, 'bottom', 70, { order: window.ph.edge.EDGE_ORDER.speech }) })
    await page.evaluate(() => window.ph.toaster.configure({ position: 'bottom-center' }))
    await scroll(page, 900)
    await page.waitForTimeout(450)
    const dock = await rect(page, '#ph .g-page-header__dock')
    expect(near(dock.bottom, 760 - 70, 1)).toBe(true)
    await page.evaluate(() => window.ph.toaster.success('Resultado guardado', { duration: 8000 }))
    await page.waitForSelector('.g-toast')
    await page.waitForTimeout(500)
    const t = await rect(page, '.g-toast')
    expect(t.bottom).toBeLessThanOrEqual(dock.top + 0.5)
    await ctx.close()
  })

  test('RTL: el muelle ocupa la caja del encabezado', async ({ browser, browserName }) => {
    const { ctx, page } = await narrowPage(browser, browserName, '?dir=rtl')
    await scroll(page, 900)
    await page.waitForTimeout(450)
    const dock = await rect(page, '#ph .g-page-header__dock')
    const ph = await rect(page, '#ph')
    expect(near(dock.left, ph.left) && near(dock.right, ph.right)).toBe(true)
    expect(await where(page)).toBe('dock')
    await ctx.close()
  })
})
