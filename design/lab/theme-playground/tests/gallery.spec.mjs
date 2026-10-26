// GGallery y GGalleryViewer (design/contracts/gallery.md «Verificación · Playwright»; #730 a #735, #758) y la enmienda de
// GDialog (bare, from vivo, Esc consumida por un descendiente: dialog.md «Visor a pantalla completa», #732, #108) sobre los
// COMPONENTES REALES (dist/gallery.umd.js) en packages/vue/playground/gallery.html. Chromium, Firefox y WebKit. GRANA_PW_PORT=4242.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/gallery.html'
function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon|no-existe|404/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana /.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const settle = (p, ms = 60) => p.evaluate((ms) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, ms)))), ms)
async function open(page, qs = '', { width = 1280, height = 800 } = {}) {
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForSelector('.g-gallery, #ver')
  await settle(page)
}
const viewer = (p) => p.locator('dialog.g-gallery-viewer')
const active = (p) => p.evaluate(() => { const a = document.activeElement; return a ? a.className + '|' + (a.getAttribute('href') || '') : '' })
async function openAt(page, i) {
  await page.locator('.g-gallery__thumb').nth(i).click()
  await expect(viewer(page)).toHaveAttribute('open', '')
  await settle(page)
}

test('miniaturas-enlace: abre el visor con clic, foco en «Foto siguiente», nombre del diálogo, zona de marca', async ({ page }) => {
  const errs = watchConsole(page)
  await open(page)
  expect(await page.locator('a.g-gallery__thumb[aria-haspopup="dialog"]').count()).toBe(6)
  await openAt(page, 0)
  await expect(page.getByRole('dialog', { name: 'Habitación Jardín, galería' })).toBeVisible()
  expect(await active(page)).toContain('g-gallery-viewer__next')
  await expect(viewer(page)).toHaveAttribute('data-g-zone', 'brand')
  expect(await page.locator('dialog.g-gallery-viewer .g-dialog__header').count()).toBe(0)
  expect(errs).toEqual([])
})

test('Tab queda atrapado dentro del visor', async ({ page, browserName }) => {
  await open(page)
  await openAt(page, 0)
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    // Dentro del visor, o en la interfaz del navegador (el <dialog> modal deja salir a ella; nunca a la página)
    const where = await page.evaluate(() => { const a = document.activeElement; return !a || a === document.body ? 'chrome' : a.closest('dialog.g-gallery-viewer') ? 'dialog' : 'page' })
    expect(where, `Tab ${i + 1}`).not.toBe('page')
  }
})

test('el foco vuelve a la miniatura de la foto VISTA (abrí la 1.ª, vi hasta la 3.ª); la página no se desplazó', async ({ page }) => {
  await open(page)
  const y0 = await page.evaluate(() => scrollY)
  await openAt(page, 0)
  await page.keyboard.press('ArrowRight'); await settle(page)
  await page.keyboard.press('ArrowRight'); await settle(page)
  await page.mouse.wheel(0, 600); await settle(page)
  expect(await page.evaluate(() => scrollY)).toBe(y0)
  await page.keyboard.press('Escape'); await settle(page, 400)
  await expect(viewer(page)).not.toHaveAttribute('open', '')
  const href = await page.evaluate(() => document.activeElement.getAttribute('href'))
  const third = await page.locator('.g-gallery__thumb').nth(2).getAttribute('href')
  expect(href).toBe(third)
})

test('Esc escalonado (consumida por el escenario): ampliada, la primera Esc solo reduce; la segunda cierra (#108 en los tres motores)', async ({ page }) => {
  await open(page)
  await openAt(page, 1)
  await page.keyboard.press('+'); await settle(page)
  await expect(page.locator('.g-gallery-viewer__stage')).toHaveClass(/is-zoomed/)
  await page.keyboard.press('Escape'); await settle(page, 200)
  await expect(viewer(page)).toHaveAttribute('open', '')
  await expect(page.locator('.g-gallery-viewer__stage')).not.toHaveClass(/is-zoomed/)
  await page.keyboard.press('Escape'); await settle(page, 400)
  await expect(viewer(page)).not.toHaveAttribute('open', '')
})

test('zoom ×2 del tamaño contenido (#758): foto vertical en visor ancho, sin franjas recorribles; recálculo al redimensionar', async ({ page }) => {
  await open(page, '', { width: 1280, height: 800 })
  await openAt(page, 4) // baño 1067×1600
  // relleno de la img en reposo (G-A1/G-A3): la caja ×2 se mide sobre el contenido, no sobre todo el escenario
  const pad = await page.evaluate(() => { const c = getComputedStyle(document.querySelector('.g-gallery-viewer__img')); return { x: parseFloat(c.paddingLeft) + parseFloat(c.paddingRight), y: parseFloat(c.paddingTop) + parseFloat(c.paddingBottom) } })
  await page.keyboard.press('+'); await settle(page, 120)
  const z = () => page.evaluate(() => { const s = document.querySelector('.g-gallery-viewer__stage'); return { w: parseFloat(s.style.getPropertyValue('--_zoom-w')), h: parseFloat(s.style.getPropertyValue('--_zoom-h')), sw: s.clientWidth, sh: s.clientHeight, scw: s.scrollWidth } })
  const a = await z()
  const k = Math.min((a.sw - pad.x) / 1067, (a.sh - pad.y) / 1600)
  expect(Math.abs(a.w - Math.round(1067 * k * 2))).toBeLessThanOrEqual(1)
  expect(Math.abs(a.h - Math.round(1600 * k * 2))).toBeLessThanOrEqual(1)
  expect(a.scw).toBeLessThanOrEqual(Math.max(a.sw, a.w) + 1)
  await page.setViewportSize({ width: 900, height: 700 }); await settle(page, 150)
  const b = await z()
  const k2 = Math.min((b.sw - pad.x) / 1067, (b.sh - pad.y) / 1600)
  expect(Math.abs(b.h - Math.round(1600 * k2 * 2))).toBeLessThanOrEqual(1)
  expect(b.h).not.toBe(a.h)
})

test('gesto con puntero: arrastrar a la izquierda pasa de foto; hacia abajo cierra', async ({ page }) => {
  await open(page)
  await openAt(page, 0)
  const s = await page.locator('.g-gallery-viewer__stage').boundingBox()
  const cx = s.x + s.width / 2
  const cy = s.y + s.height / 2
  await page.mouse.move(cx, cy); await page.mouse.down()
  await page.mouse.move(cx - s.width * 0.1, cy, { steps: 4 })
  await expect(page.locator('.g-gallery-viewer__stage')).toHaveClass(/is-dragging/)
  await page.mouse.move(cx - s.width * 0.3, cy, { steps: 4 }); await page.mouse.up(); await settle(page)
  expect(await page.locator('.g-gallery-viewer__count').textContent()).toBe('Habitación · 2 de 4')
  await page.mouse.move(cx, s.y + 20); await page.mouse.down()
  await page.mouse.move(cx, s.y + 20 + s.height * 0.4, { steps: 6 }); await page.mouse.up(); await settle(page, 400)
  await expect(viewer(page)).not.toHaveAttribute('open', '')
})

test('movimiento reducido: la foto no se desplaza al llegar (sin translate)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await openAt(page, 0)
  await page.keyboard.press('ArrowRight')
  const tr = await page.evaluate(() => getComputedStyle(document.querySelector('.g-gallery-viewer__img')).translate)
  expect(['none', '0px', '0px 0px']).toContain(tr)
})

test('sin autoavance: el visor y la tira no cambian solos', async ({ page }) => {
  await open(page, '?c=strip')
  const a = await page.locator('.g-gallery__strip-count').textContent()
  await page.waitForTimeout(1500)
  expect(await page.locator('.g-gallery__strip-count').textContent()).toBe(a)
})

for (const c of ['grid', 'strip']) {
  test(`${c}: sin desplazamiento horizontal a 1440, 390, 320 y 320×256 (LTR y RTL)`, async ({ page }) => {
    for (const dir of ['ltr', 'rtl']) for (const [w, h] of [[1440, 900], [390, 844], [320, 640], [320, 256]]) {
      await open(page, `?c=${c}&dir=${dir}`, { width: w, height: h })
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1), `${dir} ${w}×${h}`).toBe(false)
    }
  })
}

test('B: una parada de Tab en la tira, flechas mueven la actual y los botones anuncian', async ({ page }) => {
  await open(page, '?c=strip')
  await page.locator('#before a').focus()
  await page.keyboard.press('Tab') // ‹ (deshabilitado pero enfocable)
  await page.keyboard.press('Tab') // ›
  await page.keyboard.press('Tab') // la diapositiva actual
  expect(await active(page)).toContain('g-gallery__thumb')
  await page.keyboard.press('ArrowRight'); await settle(page, 300)
  expect(await page.locator('.g-gallery__strip-count').textContent()).toContain('2 / 6')
  await page.keyboard.press('Tab')
  const out = await page.evaluate(() => Boolean(document.activeElement.closest('.g-gallery__strip')))
  expect(out).toBe(false)
  await page.locator('.g-gallery__next').click(); await settle(page, 200)
  await expect(page.locator('.g-gallery__live')).toHaveText(/3 de 6\./)
})

test('B: un index que cambia desde fuera trae su diapositiva a la vista desplazando solo la tira; ni la página, ni el foco, ni anuncio (#937)', async ({ page }) => {
  const errs = watchConsole(page)
  await open(page, '?c=strip', { width: 390, height: 700 })
  await page.evaluate(() => { document.body.style.paddingBlockEnd = '1200px'; window.scrollTo(0, 120) })
  await settle(page)
  const before = await page.evaluate(() => ({ y: window.scrollY, active: document.activeElement === document.body ? 'body' : document.activeElement.className }))
  await page.evaluate(() => { window.galState.index.value = 4 })
  await page.waitForFunction(() => { const s = document.querySelector('.g-gallery__strip'); const c = s.querySelector('.g-gallery__slide.is-current'); const sr = s.getBoundingClientRect(); const r = c.getBoundingClientRect(); return r.left >= sr.left - 1 && r.right <= sr.right + 1 && s.scrollLeft > 0 }, null, { timeout: 3000 })
  await settle(page, 400)
  const after = await page.evaluate(() => {
    const s = document.querySelector('.g-gallery__strip')
    const slides = [...s.querySelectorAll('.g-gallery__slide')]
    return {
      y: window.scrollY,
      active: document.activeElement === document.body ? 'body' : document.activeElement.className,
      current: slides.findIndex((x) => x.classList.contains('is-current')),
      tab: slides.findIndex((x) => x.querySelector('.g-gallery__thumb').getAttribute('tabindex') === '0'),
      count: document.querySelector('.g-gallery__strip-count').textContent.trim(),
      live: document.querySelector('.g-gallery__live').textContent.trim(),
      index: window.galState.index.value
    }
  })
  expect(after.y).toBe(before.y)
  expect(after.active).toBe(before.active)
  expect(after.current).toBe(4)
  expect(after.tab).toBe(4)
  expect(after.count).toBe('5 / 6')
  expect(after.live).toBe('')
  expect(after.index).toBe(4)
  expect(errs).toEqual([])
})

test('controles del visor ≥ 44 px con puntero grueso', async ({ browser, browserName }) => {
  test.skip(browserName === 'firefox', 'Firefox no emula isMobile/hasTouch')
  const ctx = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
  const page = await ctx.newPage()
  await page.goto(PAGE)
  await page.waitForSelector('.g-gallery')
  await page.locator('.g-gallery__thumb').first().tap()
  await expect(page.locator('dialog.g-gallery-viewer')).toHaveAttribute('open', '')
  await page.waitForTimeout(600) // sin la animación de entrada de GDialog (escala) en medio
  for (const sel of ['.g-gallery-viewer__zoom', '.g-gallery-viewer__close', '.g-gallery-viewer__prev', '.g-gallery-viewer__next']) {
    const b = await page.locator(sel).boundingBox()
    expect(Math.round(b.width), sel).toBeGreaterThanOrEqual(44)
    expect(Math.round(b.height), sel).toBeGreaterThanOrEqual(44)
  }
  await ctx.close()
})

test('foto rota: is-broken en la miniatura y aviso con el alt en el visor', async ({ page }) => {
  await open(page, '?broken=1&flat=1')
  await settle(page, 300)
  await expect(page.locator('.g-gallery__thumb').nth(2)).toHaveClass(/is-broken/)
  await openAt(page, 2)
  await expect(page.locator('.g-gallery-viewer__broken')).toHaveText(/No se pudo cargar esta foto: /)
})

test('visor suelto: el foco vuelve al botón que lo abrió', async ({ page }) => {
  await open(page, '?solo=1')
  await page.locator('#ver').click()
  await expect(viewer(page)).toHaveAttribute('open', '')
  await page.keyboard.press('Escape'); await settle(page, 400)
  expect(await page.evaluate(() => document.activeElement.id)).toBe('ver')
})

test('forced-colors: borde real en miniaturas y el visor', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'forced-colors solo se emula en Chromium')
  await page.emulateMedia({ forcedColors: 'active' })
  await open(page)
  await openAt(page, 0)
  const o = await page.evaluate(() => getComputedStyle(document.querySelector('dialog.g-gallery-viewer')).outlineStyle)
  expect(o).toBe('solid')
})
