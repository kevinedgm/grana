// GAppShell (design/contracts/app-shell.md «Verificación · Playwright»; DECISIONS.md #708 a #718) sobre el COMPONENTE REAL
// (entrada @grana/vue/app-shell por dist/app-shell.umd.js, global GranaAppShell) en el banco
// packages/vue/playground/app-shell.html: GSidebar, GPageHeader, GContainer, GStack, GSection, GAccordion sticky, la isla de
// estado y GToaster reales, sin receta de cabecera ni offset.top. Port de design/lab/app-shell/r01/verificar.mjs (kiwi).
// En Chromium, Firefox y WebKit. Un solo proceso por puerto: GRANA_PW_PORT=4212 (bruno de GAppShell).
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/app-shell.html'

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
async function open(page, { width = 1440, height = 900, motion = 'no-preference', qs = '' } = {}) {
  await page.emulateMedia({ reducedMotion: motion })
  await page.setViewportSize({ width, height })
  await page.goto(PAGE + qs)
  await page.waitForSelector('.g-app-shell')
  await page.waitForFunction(() => document.querySelector('#sb, .g-sidebar__drawer, .g-sidebar--mode-navbar'))
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(350) // is-ready del sidebar y la primera reserva sin espera
  await settle(page)
}
async function scroll(p, y) { await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y); await settle(p); await settle(p) }
// Desplaza por pasos (como la rueda): B decide con el sentido acumulado
async function wheel(p, to, step = 80) {
  await p.evaluate(async ({ to, step }) => {
    const dir = Math.sign(to - scrollY)
    while (Math.abs(to - scrollY) > 0.5) {
      const next = dir > 0 ? Math.min(to, scrollY + step) : Math.max(to, scrollY - step)
      scrollTo({ top: next, behavior: 'instant' })
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      if (Math.abs(scrollY - next) > 1) break
    }
  }, { to, step })
  await settle(p)
  await p.waitForTimeout(220)
}
const rect = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height } }, sel)
const num = (p, el, prop) => p.evaluate(({ el, prop }) => parseFloat(getComputedStyle(el === 'html' ? document.documentElement : document.querySelector(el)).getPropertyValue(prop)), { el, prop })
const topVar = (p) => num(p, '.g-app-shell', '--g-app-shell-top')
const pad = (p) => p.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingBlockStart) || 0)
const yielded = (p) => p.evaluate(() => document.querySelector('.g-app-shell').classList.contains('is-yielded'))
const overflow = (p) => p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
const near = (a, b, t = 1.5) => Math.abs(a - b) <= t
const tabToLinks = (browserName) => (browserName === 'webkit' ? 'Alt+Tab' : 'Tab') // S7: Safari no lleva el Tab a los enlaces

test.describe('GAppShell · estructura', () => {
  test('landmarks: banner, navigation «Principal», un main, contentinfo; orden del DOM; consola limpia', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page)
    expect(await page.getByRole('banner').count()).toBe(1)
    expect(await page.getByRole('navigation', { name: 'Principal' }).count()).toBe(1)
    expect(await page.getByRole('main').count()).toBe(1)
    expect(await page.getByRole('contentinfo').count()).toBe(1)
    const order = await page.evaluate(() => {
      const els = [document.querySelector('.g-app-shell__skip'), document.querySelector('.g-app-shell__header'), document.querySelector('#sb'), document.querySelector('main'), document.querySelector('.g-app-shell__footer')]
      return els.every(Boolean) && els.every((e, i) => i === 0 || els[i - 1].compareDocumentPosition(e) & 4)
    })
    expect(order).toBe(true)
    expect(errs).toEqual([])
  })

  test('enlace de salto: primer Tab, visible solo con foco; Intro lleva el foco a main sin cambiar el hash y el siguiente Tab cae en la página', async ({ page, browserName }) => {
    await open(page)
    const skip = await rect(page, '.g-app-shell__skip')
    expect(skip.bottom).toBeLessThanOrEqual(0.5) // fuera del visor sin foco
    await page.keyboard.press(tabToLinks(browserName))
    expect(await page.evaluate(() => document.activeElement.className)).toBe('g-app-shell__skip')
    await page.waitForTimeout(200)
    const on = await rect(page, '.g-app-shell__skip')
    expect(near(on.top, 0)).toBe(true)
    expect(on.height).toBeGreaterThanOrEqual(24)
    const hash = await page.evaluate(() => location.hash)
    await page.keyboard.press('Enter')
    expect(await page.evaluate(() => document.activeElement.tagName)).toBe('MAIN')
    expect(await page.evaluate(() => location.hash)).toBe(hash)
    await page.keyboard.press('Tab')
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('main')) && document.activeElement.tagName !== 'MAIN')).toBe(true)
  })
})

test.describe('GAppShell · reserva del sidebar por CSS (#712)', () => {
  const cases = [
    ['expandida', '?mode=expanded', 264],
    ['riel', '?mode=rail', 64],
    ['flotante', '?mode=expanded&variant=floating', 288],
    ['drawer', '?mode=drawer', 0]
  ]
  for (const [name, qs, track] of cases) {
    test(`${name}: el marco empieza en ${track}`, async ({ page }) => {
      await open(page, { qs })
      const f = await rect(page, '.g-app-shell__frame')
      expect(near(f.left, track)).toBe(true)
      expect(near(f.width, 1440 - track)).toBe(true)
      expect(await overflow(page)).toBe(false)
    })
  }

  test('riel superpuesto: al expandir, la pista sigue en 64 y la expansión fija sigue en 0 con el alto del visor tras desplazar (S2)', async ({ page }) => {
    await open(page, { qs: '?mode=rail&overlay=1' })
    await page.locator('#sb .g-sidebar__toggle').click()
    await page.waitForTimeout(400)
    expect(await page.evaluate(() => document.getElementById('sb').classList.contains('g-sidebar--overlay'))).toBe(true)
    expect(near((await rect(page, '.g-app-shell__frame')).left, 64)).toBe(true)
    expect(near((await rect(page, '#sb')).width, 264)).toBe(true)
    await page.evaluate(() => scrollTo({ top: 1200, behavior: 'instant' }))
    await settle(page)
    const sb = await rect(page, '#sb')
    expect(near(sb.top, 0)).toBe(true)
    expect(near(sb.height, 900)).toBe(true)
  })

  test('navbar a 390: pista 0, el marco reserva la barra abajo y la publica en el registro con order 5', async ({ page }) => {
    await open(page, { width: 390, height: 760 })
    expect(await page.evaluate(() => document.querySelector('.g-app-shell > .g-sidebar--mode-navbar') !== null)).toBe(true)
    const f = await rect(page, '.g-app-shell__frame')
    expect(near(f.left, 0)).toBe(true)
    const padEnd = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.g-app-shell__frame')).paddingBlockEnd))
    expect(padEnd).toBeGreaterThan(40)
    expect(await page.evaluate(() => window.shell.edge.edgeReserve('bottom'))).toBeCloseTo(padEnd, 1)
    expect(await page.evaluate(() => window.shell.edge.edgeReserve('bottom', { before: window.shell.edge.EDGE_ORDER.appShell }))).toBe(0)
    await scroll(page, 99999)
    const foot = await rect(page, '.g-app-shell__footer')
    const bar = await rect(page, '.g-sidebar--mode-navbar')
    expect(foot.bottom).toBeLessThanOrEqual(bar.top + 1)
    expect(await overflow(page)).toBe(false)
  })

  test('RTL: el sidebar al final y la página a su izquierda', async ({ page }) => {
    await open(page, { qs: '?mode=expanded&dir=rtl' })
    const sb = await rect(page, '#sb')
    const f = await rect(page, '.g-app-shell__frame')
    expect(near(sb.right, 1440)).toBe(true)
    expect(near(f.left, 0)).toBe(true)
    expect(near(f.right, 1440 - 264)).toBe(true)
  })
})

test.describe('GAppShell · la cifra de la cabecera (#713)', () => {
  test('banda 56, --g-page-header-top 56, scroll-padding 104 con el zócalo pegado; el zócalo se pega en 56', async ({ page }) => {
    await open(page)
    expect((await rect(page, '.g-app-shell__header')).height).toBeCloseTo(56, 0)
    expect(await topVar(page)).toBeCloseTo(56, 0)
    expect(await num(page, 'main', '--g-page-header-top')).toBeCloseTo(56, 0)
    expect(await pad(page)).toBeCloseTo(104, 0)
    expect(await page.evaluate(() => window.shell.edge.edgeReserve('top'))).toBeCloseTo(56, 0)
    await scroll(page, 1600)
    expect(await page.evaluate(() => document.getElementById('ph').classList.contains('is-stuck'))).toBe(true)
    expect((await rect(page, '#ph .g-page-header__base')).top).toBeCloseTo(56, 0)
    expect((await rect(page, '.g-app-shell__header')).top).toBeCloseTo(0, 0)
  })

  test('sin zócalo que se pegue (sticky: false) o sin GPageHeader: scroll-padding 56', async ({ page }) => {
    await open(page, { qs: '?phsticky=0' })
    expect(await pad(page)).toBeCloseTo(56, 0)
    await open(page, { qs: '?ph=0' })
    expect(await pad(page)).toBeCloseTo(56, 0)
  })

  test('sin cabecera: cifra 0, scroll-padding 48 (solo el zócalo) y nada publicado arriba', async ({ page }) => {
    await open(page, { qs: '?nohead=1' })
    expect(await page.locator('.g-app-shell__header').count()).toBe(0)
    expect(await topVar(page)).toBe(0)
    expect(await pad(page)).toBeCloseTo(48, 0)
    expect(await page.evaluate(() => window.shell.edge.edgeReserve('top', { before: window.shell.edge.EDGE_ORDER.speech }))).toBe(0)
  })

  test('--g-app-shell-header 72 en :root: banda 72, --g-page-header-top 72, scroll-padding 120, sin aviso', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { qs: '?hh=72' })
    expect((await rect(page, '.g-app-shell__header')).height).toBeCloseTo(72, 0)
    expect(await num(page, 'main', '--g-page-header-top')).toBeCloseTo(72, 0)
    expect(await pad(page)).toBeCloseTo(120, 0)
    expect(errs).toEqual([])
  })

  for (const [w, h, stuck] of [[1440, 900, true], [800, 430, true], [800, 400, false], [320, 256, false]]) {
    test(`presupuesto del cuarto a ${w}×${h}: la cabecera ${stuck ? 'sigue pegada' : 'se despega'}; sin desplazamiento horizontal`, async ({ page }) => {
      await open(page, { width: w, height: h, qs: '?mode=drawer' })
      expect(await topVar(page)).toBeCloseTo(stuck ? 56 : 0, 0)
      if (!stuck) {
        expect(await pad(page)).toBeCloseTo(48, 0)
        expect(await page.evaluate(() => window.shell.edge.edgeReserve('top', { before: window.shell.edge.EDGE_ORDER.speech }))).toBe(0)
        await scroll(page, 600)
        expect((await rect(page, '.g-app-shell__header')).bottom).toBeLessThanOrEqual(1) // se fue con la página
      }
      const stuckTop = (await topVar(page)) + 48
      expect(stuckTop).toBeLessThanOrEqual(h * 0.25 + 48 + 0.5)
      expect(await overflow(page)).toBe(false)
    })
  }
})

test.describe('GAppShell · S1: enfocar lo pegado no desplaza la página (#715)', () => {
  for (const [name, sel] of [['el botón de contraer', '#sb .g-sidebar__toggle'], ['un enlace del sidebar', '#sb .g-sidebar__link'], ['un botón de la cabecera', '#hdr-search'], ['la acción del zócalo', '#ph-pub'], ['la segunda acción del zócalo', '#ph-hist']]) {
    test(`${name}: Δ0 de scrollY con la página en 1200`, async ({ page }) => {
      await open(page, { qs: '?mode=expanded' })
      await scroll(page, 1200)
      const y0 = await page.evaluate(() => scrollY)
      await page.evaluate((sel) => document.querySelector(sel).focus(), sel)
      await settle(page)
      expect(await page.evaluate(() => scrollY)).toBe(y0)
    })
  }
})

test.describe('GAppShell · A · Cortina (#709)', () => {
  // Posiciones del borde de la página durante el cambio, cuadro a cuadro
  async function track(page, action, ms = 420) {
    return page.evaluate(async ({ action, ms }) => {
      const frame = document.querySelector('.g-app-shell__frame')
      const sb = document.querySelector('#sb')
      const out = []
      const t0 = performance.now()
      document.querySelector('#sb .g-sidebar__toggle').click()
      if (action === 'interrupt') setTimeout(() => document.querySelector('#sb .g-sidebar__toggle').click(), 80)
      await new Promise((resolve) => {
        const step = () => {
          const t = performance.now() - t0
          out.push({ t, left: Math.round(frame.getBoundingClientRect().left), sb: Math.round(sb.getBoundingClientRect().width) })
          if (t < ms) requestAnimationFrame(step)
          else resolve()
        }
        requestAnimationFrame(step)
      })
      return out
    }, { action, ms })
  }
  const distinct = (xs) => [...new Set(xs.map((x) => x.left))]

  test('contraer: la página se ensancha al instante (dos posiciones) y el riel se encoge encima; Δ0 del párrafo y el foco en el botón', async ({ page }) => {
    await open(page, { qs: '?mode=expanded' })
    await page.locator('#sb .g-sidebar__toggle').focus()
    const p0 = await rect(page, '#anchor')
    const out = await track(page, 'collapse')
    expect(distinct(out)).toEqual([64])
    expect(out.some((s) => s.sb > 64)).toBe(true) // el riel aún se encogía encima de la página
    const p1 = await rect(page, '#anchor')
    expect(near(p1.top, p0.top, 0.5)).toBe(true)
    expect(near(p1.height, p0.height, 0.5)).toBe(true)
    expect(await page.evaluate(() => document.activeElement.classList.contains('g-sidebar__toggle'))).toBe(true)
  })

  test('expandir: a mitad la página sigue en 64 y el sidebar crece encima; se aparta una sola vez, a ≈ --g-duration-slow', async ({ page }) => {
    await open(page, { qs: '?mode=rail' })
    const out = await track(page, 'expand', 520)
    const mid = out.filter((s) => s.t < 190) // antes de --g-duration-slow (240 ms) con margen para el primer cuadro
    expect(mid.length).toBeGreaterThan(0)
    expect(mid.every((s) => s.left === 64)).toBe(true)
    expect(mid.some((s) => s.sb > 64 && s.sb < 264)).toBe(true)
    expect(distinct(out)).toEqual([64, 264])
    const moved = out.find((s) => s.left === 264)
    expect(moved.t).toBeGreaterThanOrEqual(200)
  })

  test('interrumpir a 80 ms: la página no salta', async ({ page }) => {
    await open(page, { qs: '?mode=rail' })
    const out = await track(page, 'interrupt', 520)
    expect(distinct(out)).toEqual([64])
  })

  test('movimiento reducido: sin espera', async ({ page }) => {
    await open(page, { qs: '?mode=rail', motion: 'reduce' })
    const out = await track(page, 'expand', 160)
    expect(out.filter((s) => s.t > 60).every((s) => s.left === 264)).toBe(true)
  })
})

test.describe('GAppShell · B · Relevo de franja (header="relay", #710)', () => {
  test('cede al bajar con el zócalo pegado (zócalo en 0, lo pegado suma 48) y vuelve al subir 160 en dos pasos', async ({ page }) => {
    const errs = watchConsole(page)
    await open(page, { qs: '?header=relay&mode=expanded' })
    await wheel(page, 1600)
    expect(await yielded(page)).toBe(true)
    expect((await rect(page, '.g-app-shell__header')).bottom).toBeLessThanOrEqual(0.5)
    expect((await rect(page, '#ph .g-page-header__base')).top).toBeCloseTo(0, 0)
    expect(await page.evaluate(() => document.getElementById('ph').classList.contains('is-stuck'))).toBe(true)
    expect(await pad(page)).toBeCloseTo(48, 0)
    expect(await page.evaluate(() => window.shell.edge.edgeReserve('top', { before: window.shell.edge.EDGE_ORDER.speech }))).toBe(0)
    await wheel(page, 1520)
    await wheel(page, 1440)
    expect(await yielded(page)).toBe(false)
    expect((await rect(page, '.g-app-shell__header')).top).toBeCloseTo(0, 0)
    expect((await rect(page, '#ph .g-page-header__base')).top).toBeCloseTo(56, 0)
    expect(await page.evaluate(() => window.shell.edge.edgeReserve('top', { before: window.shell.edge.EDGE_ORDER.speech }))).toBeCloseTo(56, 0)
    expect(errs).toEqual([])
  })

  test('vuelve al volver arriba (el zócalo deja de estar pegado): nunca sin franja', async ({ page }) => {
    await open(page, { qs: '?header=relay&mode=expanded' })
    await wheel(page, 1600)
    expect(await yielded(page)).toBe(true)
    await scroll(page, 0)
    await page.waitForTimeout(200)
    expect(await yielded(page)).toBe(false)
    expect((await rect(page, '.g-app-shell__header')).top).toBeCloseTo(0, 0)
  })

  test('el foco que entra en la cabecera cedida la devuelve sin desplazar la página (.focus() y Mayús+Tab)', async ({ page, browserName }) => {
    await open(page, { qs: '?header=relay&mode=expanded' })
    await wheel(page, 1600)
    expect(await yielded(page)).toBe(true)
    const y0 = await page.evaluate(() => scrollY)
    await page.evaluate(() => document.getElementById('hdr-search').focus())
    await settle(page)
    expect(await yielded(page)).toBe(false)
    expect(await page.evaluate(() => scrollY)).toBe(y0)
    expect((await rect(page, '#hdr-search')).top).toBeGreaterThanOrEqual(0)
    // Mayús+Tab desde el primer enlace del sidebar vuelve a la cabecera
    await page.evaluate(() => document.querySelector('#sb .g-sidebar__toggle').blur())
    await page.evaluate(() => document.activeElement.blur())
    await wheel(page, 2000)
    expect(await yielded(page)).toBe(true)
    const y1 = await page.evaluate(() => scrollY)
    await page.evaluate(() => document.querySelector('#sb .g-sidebar__toggle').focus())
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Shift+Tab' : 'Shift+Tab') // S7: Safari no lleva el Tab a los botones
    await settle(page)
    expect(await page.evaluate(() => Boolean(document.activeElement.closest('.g-app-shell__header')))).toBe(true)
    expect(await yielded(page)).toBe(false)
    expect(await page.evaluate(() => scrollY)).toBe(y1)
  })

  test('sin GPageHeader, o con la cabecera despegada por el presupuesto, no cede', async ({ page }) => {
    await open(page, { qs: '?header=relay&ph=0&mode=expanded' })
    await wheel(page, 1600)
    expect(await yielded(page)).toBe(false)
    await open(page, { width: 800, height: 400, qs: '?header=relay&mode=drawer' })
    await wheel(page, 1600)
    expect(await yielded(page)).toBe(false)
  })

  test('movimiento reducido: la banda no se desliza (sin cuadros intermedios)', async ({ page }) => {
    await open(page, { qs: '?header=relay&mode=expanded', motion: 'reduce' })
    await wheel(page, 1500)
    await page.evaluate(() => scrollTo({ top: scrollY - 100, behavior: 'instant' })) // vuelve
    await settle(page)
    const samples = await page.evaluate(async () => {
      scrollTo({ top: scrollY + 200, behavior: 'instant' }) // cede
      const out = []
      for (let i = 0; i < 8; i++) { await new Promise((r) => requestAnimationFrame(r)); out.push(Math.round(parseFloat(getComputedStyle(document.querySelector('.g-app-shell')).getPropertyValue('--g-app-shell-top')))) }
      return out
    })
    expect(samples.every((v) => v === 0 || v === 56)).toBe(true)
  })
})

test.describe('GAppShell · bordes compartidos con la isla y los avisos, sin offset.top (#714)', () => {
  test('la isla real queda bajo la banda arriba y bajo el zócalo pegado al desplazar', async ({ page }) => {
    await open(page, { qs: '?mode=expanded' })
    await page.locator('#status-btn').click()
    await page.waitForSelector('.g-status-island__shape')
    await page.waitForTimeout(500)
    expect((await rect(page, '.g-status-island__shape')).top).toBeGreaterThanOrEqual(56 - 0.5)
    await scroll(page, 1600)
    await page.evaluate(() => window.shell.status.warning('red', 'Sin conexión con el analizador 2'))
    await page.waitForTimeout(500)
    const base = await rect(page, '#ph .g-page-header__base')
    const isl = await rect(page, '.g-status-island__shape')
    if (isl) expect(isl.top).toBeGreaterThanOrEqual(base.bottom - 0.5)
    expect(await page.evaluate(() => window.shell.edge.edgeReserve('top', { before: window.shell.edge.EDGE_ORDER.status }))).toBeCloseTo(56 + base.height, 0)
  })

  test('GToaster real arriba: el aviso queda bajo la banda (y bajo el zócalo pegado)', async ({ page }) => {
    await open(page, { qs: '?mode=expanded' })
    await page.locator('#toast-btn').click()
    await page.waitForSelector('.g-toast')
    await page.waitForTimeout(500)
    expect((await rect(page, '.g-toast')).top).toBeGreaterThanOrEqual(56 - 0.5)
    await scroll(page, 1600)
    await page.evaluate(() => window.shell.toaster.success('Otro aviso', { duration: 8000 }))
    await page.waitForTimeout(500)
    const base = await rect(page, '#ph .g-page-header__base')
    const tops = await page.evaluate(() => [...document.querySelectorAll('.g-toast')].map((t) => t.getBoundingClientRect().top))
    expect(Math.min(...tops)).toBeGreaterThanOrEqual(base.bottom - 0.5)
  })
})

test.describe('GAppShell · GContainer dentro', () => {
  test('la caja del contenedor es el marco: una banda g-bleed llega a su borde (nunca bajo el sidebar) y su texto sigue en la columna', async ({ page }) => {
    await open(page, { qs: '?mode=expanded' })
    const f = await rect(page, '.g-app-shell__frame')
    const band = await rect(page, '#band')
    const col = await rect(page, '#ct > .g-container__body')
    expect(near(band.left, f.left)).toBe(true)
    expect(near(band.right, f.right)).toBe(true)
    expect(near((await rect(page, '#band-p')).left, col.left)).toBe(true)
  })
})

test.describe('GAppShell · colores forzados (Chromium)', () => {
  test('la banda y el pie se separan con un borde real', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Firefox y WebKit no emulan forced-colors')
    await page.emulateMedia({ forcedColors: 'active' })
    await open(page)
    const w = await page.evaluate(() => [parseFloat(getComputedStyle(document.querySelector('.g-app-shell__header')).borderBlockEndWidth), parseFloat(getComputedStyle(document.querySelector('.g-app-shell__footer')).borderBlockStartWidth)])
    expect(w[0]).toBeGreaterThan(0)
    expect(w[1]).toBeGreaterThan(0)
  })
})
