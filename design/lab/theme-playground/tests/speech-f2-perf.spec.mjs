// Captura de voz · Fase 2 · COMPUERTA DE RENDIMIENTO (speech.md §26, §31): en el playground real, 320 fragmentos, cada tecla
// de §22.11 (incluida Ctrl+A) con Event Timing < 100 ms en Chromium; 1000 fragmentos < 200 ms (informativo); Firefox y
// WebKit informativos. Además: una sola parada y ninguna región role="status" de GBtn en la rejilla (#257).
// El reloj de Event Timing no es fiable con otros navegadores ejecutándose a la vez: la compuerta se EXIGE solo con un worker
// (GRANA_PW_PORT=4206 npx playwright test tests/speech-f2-perf.spec.mjs --workers=1); con varios, se registra.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const SELF = `${PAGE}?speech=self#sec-speech`
function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana Speech\]|\[Grana\]/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
const ready = async (page, url = SELF) => {
  await page.goto(url)
  await page.waitForSelector('#sec-speech .g-speech-trigger')
  await page.waitForFunction(() => document.querySelector('.g-speech-host') && window.speech && document.querySelector('#sp-saved .g-transcript__row'))
}

test.describe('captura de voz F2 · rendimiento', () => {
  test('COMPUERTA DE RENDIMIENTO: 320 fragmentos, cada tecla de §22.11 con Event Timing < 100 ms (Chromium); sin role=status de GBtn', async ({ page, browserName }) => {
    test.setTimeout(120000)
    const errs = watchConsole(page)
    await ready(page)
    const measure = async (n) => {
      await page.locator(`#sp-long-${n}`).click()
      await page.waitForFunction((k) => document.querySelectorAll('#sp-saved .g-transcript__row').length === k, n)
      const regions = await page.evaluate(() => ({
        btnStatus: document.querySelectorAll('#sp-saved .g-btn__status').length,
        status: document.querySelectorAll('#sp-saved [role="grid"] [role="status"], #sp-saved [role="grid"] [role="alert"]').length,
        stops: document.querySelectorAll('#sp-saved [role="grid"] [tabindex="0"]').length
      }))
      expect(regions).toEqual({ btnStatus: 0, status: 0, stops: 1 })
      await page.evaluate(() => {
        window.__evt = []
        window.__po && window.__po.disconnect()
        window.__po = new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'keydown' || e.name === 'keyup' || e.name === 'keypress') window.__evt.push({ name: e.name, d: e.duration, t: e.startTime }) })
        try { window.__po.observe({ type: 'event', durationThreshold: 16, buffered: false }) } catch { window.__po = null }
      })
      await page.locator('#sp-saved [role="grid"] [tabindex="0"]').focus()
      const keys = ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowLeft', 'End', 'Home', 'PageDown', 'PageDown', 'PageUp', 'ControlOrMeta+End', 'ControlOrMeta+Home', 'Shift+Space', 'Shift+ArrowDown', 'Space', 'ControlOrMeta+a', 'ControlOrMeta+a', 'ArrowDown', 'Delete', 'ControlOrMeta+z', 'ControlOrMeta+Shift+z', 'ControlOrMeta+z', 'F2', 'Escape', 'Enter', 'Escape']
      const wall = []
      for (const k of keys) {
        const t0 = Date.now()
        const p0 = await page.evaluate(() => performance.now())
        await page.keyboard.press(k)
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))))
        await page.waitForTimeout(60)
        const ms = await page.evaluate((p) => Math.max(0, ...window.__evt.filter((e) => e.t >= p).map((e) => Math.round(e.d))), p0)
        wall.push([k, Date.now() - t0, ms])
      }
      await page.waitForTimeout(400)
      const evt = await page.evaluate(() => window.__evt)
      expect(await page.evaluate(() => document.querySelectorAll('#sp-saved [role="grid"] [tabindex="0"]').length)).toBe(1)
      return { maxEvent: evt.length ? Math.max(...evt.map((e) => e.d)) : 0, events: evt.length, wall }
    }
    const r320 = await measure(320)
    console.log(`[${browserName}] 320 fragmentos: Event Timing máx ${r320.maxEvent} ms (${r320.events} eventos ≥ 16 ms); tecla hasta el pintado máx ${Math.max(...r320.wall.map((w) => w[1]))} ms; por tecla [tecla, ms reloj, Event Timing]`, JSON.stringify(r320.wall))
    const gate = browserName === 'chromium' && test.info().config.workers === 1
    test.info().annotations.push({ type: 'rendimiento', description: `${browserName} 320: ${r320.maxEvent} ms${gate ? ' (exigido)' : ' (registrado: varios workers)'}` })
    if (gate) expect(r320.maxEvent).toBeLessThan(100)
    const r1000 = await measure(1000)
    console.log(`[${browserName}] 1000 fragmentos (informativo): Event Timing máx ${r1000.maxEvent} ms; tecla hasta el pintado máx ${Math.max(...r1000.wall.map((w) => w[1]))} ms`)
    if (gate) expect.soft(r1000.maxEvent).toBeLessThan(200)
    expect(errs).toEqual([])
  })
})
