// Captura de voz · Fase 2 en el playground real (packages/vue/playground/index.html, sección #sec-speech; @grana/vue/speech
// por dist/speech.umd.js y el adaptador simulado de @grana/vue/testing con ?speech=self, sin micrófono), en Chromium,
// Firefox y WebKit (speech.md §31). Casos: revisión en la página (una parada de tabulación, teclado APG, edición en la
// celda que la otra vista refleja), inserción en dos campos de un GForm real (uno desmontado) con deshacer, «Revisar» con
// superficie y con el GDialog de respaldo (canales trasladados, Esc en el editor no lo cierra), transcript guardado sin
// sesión, copia (portapapeles real en Chromium y copia nativa limpia) y 320×640 con táctil. La compuerta de rendimiento va
// aparte: speech-f2-perf.spec.mjs.
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
// Conversación simulada con dos hablantes y al menos `n` fragmentos confirmados
async function converse(page, n = 3) {
  await page.locator('#sec-speech').scrollIntoViewIfNeeded()
  await page.evaluate(() => window.speech.start({ mode: 'conversation' }))
  await page.waitForFunction(() => /listening|speech|transcribing/.test(window.speech.state.status), null, { timeout: 15000 })
  await page.waitForFunction((k) => window.speech.state.transcript && window.speech.state.transcript.segments.length >= k, n, { timeout: 40000 })
}
const stops = (page, sel) => page.evaluate((s) => document.querySelectorAll(`${s} [role="grid"] [tabindex="0"]`).length, sel)

test.describe('captura de voz F2 · playground', () => {
  test('revisión en la página: una parada, teclado APG, edición en la celda (la vista del panel la refleja), sin g-btn__status', async ({ page }) => {
    test.setTimeout(90000)
    const errs = watchConsole(page)
    await ready(page)
    await converse(page, 3)
    const grid = page.locator('#sp-review [role="grid"]')
    await expect(grid).toHaveAttribute('aria-labelledby', 'sp-rv-title')
    expect(await stops(page, '#sp-review')).toBe(1)
    // Tab entra en la rejilla por su única parada
    await page.locator('#sp-review .g-transcript__bar .g-btn').last().focus()
    await page.keyboard.press('Tab')
    let focused = await page.evaluate(() => document.activeElement.closest('[role="grid"]') && document.activeElement.dataset.focus)
    expect(focused).toBe('text')
    await page.keyboard.press('ArrowLeft')
    focused = await page.evaluate(() => document.activeElement.dataset.focus)
    expect(focused).toBe('speaker')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await expect(page.locator('#sp-review textarea.g-transcript__field')).toBeFocused()
    await page.keyboard.press('ControlOrMeta+a')
    await page.keyboard.type('Texto corregido en la página.')
    await page.keyboard.press('Enter')
    const id = await page.evaluate(() => window.speech.state.transcript.segments.find((s) => s.corrected).id)
    expect(await page.evaluate(() => document.activeElement.dataset.focus)).toBe('text')
    // La otra vista (panel compacto) comparte el modelo
    await page.evaluate(() => window.speech.openPanel())
    await expect(page.locator('.g-speech-panel .g-transcript[data-compact]')).toBeVisible()
    const panelText = await page.evaluate((x) => [...document.querySelectorAll('.g-speech-panel .g-transcript__row')].find((r) => r.dataset.id === x).querySelector('.g-transcript__text').textContent, id)
    expect(panelText).toBe('Texto corregido en la página.')
    // Ningún role="status" de GBtn en las vistas (#257)
    const regions = await page.evaluate(() => ({
      btn: document.querySelectorAll('.g-transcript .g-btn__status').length,
      // Dentro de la sesión (página y panel) las vistas usan los canales del anfitrión: ninguna región propia
      status: [...document.querySelectorAll('#sp-review [role="status"], #sp-review [role="alert"], .g-speech-panel .g-transcript [role="status"]')].length
    }))
    expect(regions).toEqual({ btn: 0, status: 0 })
    expect(await stops(page, '#sp-review')).toBe(1)
    await page.evaluate(() => window.speech.discard())
    expect(errs).toEqual([])
  })

  test('inserción en dos campos de un GForm real (uno desmontado), «Usado en» y deshacer; «Revisar» lleva el foco al título', async ({ page }) => {
    test.setTimeout(90000)
    const errs = watchConsole(page)
    await ready(page)
    await converse(page, 2)
    await page.evaluate(() => window.speech.pause())
    const ins = page.locator('#sp-review .g-transcript__insert')
    await expect(ins.locator('.g-transcript__preview')).toHaveAttribute('role', 'region')
    // Campo: Plan (su pestaña está desmontada)
    await expect(page.locator('#sp-f-plan')).toHaveCount(0)
    await ins.locator('.g-select').nth(1).locator('button').first().click()
    await page.locator('#sp-review-target-opt-1').click() // Plan
    const go = ins.locator('.g-btn', { hasText: 'Insertar en Plan' })
    await go.focus()
    await page.keyboard.press('Enter') // con teclado: WebKit no enfoca un botón al pulsarlo con el ratón
    await expect(go).toBeFocused()
    const plan = await page.evaluate(() => window.spForm.plan)
    expect(plan).toMatch(/^Hablante A: /)
    await expect(page.locator('#sp-review .g-transcript__flag--used').first()).toHaveText('Usado en Plan')
    // Motivo (montado) al final, con su separador
    await ins.locator('.g-select').nth(1).locator('button').first().click()
    await page.locator('#sp-review-target-opt-0').click() // Motivo
    await ins.locator('.g-btn', { hasText: 'Insertar en Motivo' }).click()
    await expect(page.locator('#sp-f-motivo')).toHaveValue(/^Lumbalgia\. \nHablante A: |^Lumbalgia\.\s*Hablante A: /)
    // La pestaña Plan, al montarse, trae el valor por su v-model
    await page.locator('#sp-form-tabs [role="tab"]', { hasText: 'Plan' }).click()
    await expect(page.locator('#sp-f-plan')).toHaveValue(plan)
    // #262: ninguna casilla de la vista (filas, «Seleccionar todo», «Con hablantes») pinta región de mensaje
    expect(await page.locator('#sp-review .g-checkbox').count()).toBeGreaterThan(2)
    await expect(page.locator('#sp-review .g-checkbox__message')).toHaveCount(0)
    await expect(page.locator('#sp-review [role="grid"] [aria-live]')).toHaveCount(0)
    // #263: «Deshacer inserción» (resultado y usos) lleva flip-rtl en su undo-2
    const undoIcons = ins.locator('.g-btn', { hasText: 'Deshacer inserción' }).locator('svg:not(.g-btn__loader)')
    expect(await undoIcons.count()).toBeGreaterThan(0)
    expect(await undoIcons.evaluateAll((l) => l.every((s) => s.classList.contains('g-icon--flip-rtl')))).toBe(true)
    // Deshacer la última de Motivo
    await ins.locator('.g-transcript__result .g-btn', { hasText: 'Deshacer inserción' }).click()
    expect(await page.evaluate(() => window.spForm.motivo)).toBe('Lumbalgia. ')
    expect(await page.evaluate(() => window.speech.state.transcript.derived.filter((d) => d.kind === 'insert').length)).toBe(1)
    // «Revisar» del panel: cierra el panel y lleva el foco al título de la revisión
    await page.evaluate(() => window.speech.openPanel())
    await page.locator('.g-speech-panel__controls .g-btn', { hasText: 'Revisar' }).click()
    await expect(page.locator('#sp-rv-title')).toBeFocused()
    expect(await page.evaluate(() => window.speech.state.panelOpen)).toBe(false)
    await page.evaluate(() => window.speech.discard())
    expect(errs).toEqual([])
  })

  test('sin revisión en la página: «Revisar» abre el GDialog de respaldo (canales dentro, foco al título); Esc en el editor no lo cierra; Esc en la rejilla sí', async ({ page }) => {
    test.setTimeout(90000)
    const errs = watchConsole(page)
    await ready(page)
    await page.locator('#sp-page-review').uncheck()
    await converse(page, 2)
    await page.evaluate(() => window.speech.openPanel())
    await page.locator('.g-speech-panel__controls .g-btn', { hasText: 'Revisar' }).click()
    const dlg = page.locator('dialog.g-speech-review[open]')
    await expect(dlg).toBeVisible()
    await expect(dlg.locator('.g-dialog__title')).toBeFocused()
    expect(await page.evaluate(() => Boolean(document.querySelector('dialog.g-speech-review .g-speech-host__live')))).toBe(true)
    expect(await dlg.evaluate((d) => d.classList.contains('g-dialog--size-lg') && d.classList.contains('g-dialog--mobile-fullscreen'))).toBe(true)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await dlg.locator('[role="grid"] [tabindex="0"]').focus()
    await page.keyboard.press('Enter')
    await expect(dlg.locator('textarea.g-transcript__field')).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dlg).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('dialog.g-speech-review[open]')).toHaveCount(0)
    await page.waitForFunction(() => document.querySelector('.g-speech-host').parentElement === document.body)
    expect(await page.evaluate(() => window.speech.state.status)).not.toBe('idle')
    await page.evaluate(() => window.speech.discard())
    expect(errs).toEqual([])
  })

  test('transcript guardado sin sesión: tres modos y su región propia', async ({ page }) => {
    const errs = watchConsole(page)
    await ready(page)
    const saved = page.locator('#sp-saved')
    await expect(saved).toHaveAttribute('data-mode', 'edit')
    expect(await saved.locator('.g-transcript__live[role="status"]').count()).toBe(1)
    await expect(saved.locator('.g-transcript__row').nth(1)).toHaveClass(/is-corrected/)
    await expect(saved.locator('.g-transcript__row').last().locator('.g-transcript__flag--used')).toHaveText('Usado en Plan')
    await expect(saved.locator('.g-transcript__speaker').first()).toContainText('Profesional (A)')
    await page.locator('#sp-saved-mode').selectOption('select')
    await expect(page.locator('#sp-saved')).toHaveAttribute('data-mode', 'select')
    await page.locator('#sp-saved-mode').selectOption('read')
    await expect(page.locator('#sp-saved ol.g-transcript__list')).toHaveAttribute('tabindex', '0')
    expect(errs).toEqual([])
  })

  test('copia: Ctrl+C sin texto copia la selección y la copia nativa de un texto seleccionado sale limpia', async ({ page, browserName, context }) => {
    test.skip(browserName !== 'chromium', 'portapapeles real solo en Chromium (permisos)')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const errs = watchConsole(page)
    await ready(page)
    const saved = page.locator('#sp-saved')
    await saved.locator('[role="grid"] [tabindex="0"]').focus()
    await page.keyboard.press('Shift+Space')
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('ControlOrMeta+c')
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('Buenos días, ¿cómo ha seguido?\nMejor, el dolor bajó bastante desde el martes.')
    // Selección de texto nativa sobre dos filas: sin horas, marcas ni prefijos ocultos
    await page.evaluate(() => {
      const t = [...document.querySelectorAll('#sp-saved .g-transcript__text')]
      const r = document.createRange()
      r.setStart(t[3].firstChild, 0)
      r.setEnd(t[4].firstChild, 4)
      getSelection().removeAllRanges()
      getSelection().addRange(r)
    })
    await page.keyboard.press('ControlOrMeta+c')
    // Una cita: tal cual, sin horas ni nombres; dos hablantes distintos → dos líneas
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe('¿Ha vuelto a tener molestias con la luz?\nSolo')
    expect(errs).toEqual([])
  })

  test('320×640 con táctil: sin desbordamiento, filas apiladas (data-narrow), «Más» real y objetivos ≥ 44px', async ({ browser, browserName }) => {
    const context = await browser.newContext({ viewport: { width: 320, height: 640 }, hasTouch: browserName !== 'firefox', isMobile: browserName === 'chromium' })
    const page = await context.newPage()
    const errs = watchConsole(page)
    await ready(page)
    const saved = page.locator('#sp-saved')
    await saved.scrollIntoViewIfNeeded()
    await expect(saved).toHaveAttribute('data-narrow', '')
    const m = await page.evaluate(() => {
      const g = document.querySelector('#sp-saved')
      const row = g.querySelector('.g-transcript__row')
      const text = row.querySelector('.g-transcript__cell--text').getBoundingClientRect()
      const time = row.querySelector('.g-transcript__cell--time').getBoundingClientRect()
      const coarse = matchMedia('(pointer: coarse)').matches
      const targets = [...g.querySelectorAll('.g-transcript__row .g-btn, .g-transcript__bar .g-btn')].map((b) => {
        const r = b.getBoundingClientRect()
        const a = getComputedStyle(b, '::after')
        return Math.max(r.height, parseFloat(a.height) || 0)
      })
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        viewOverflow: g.scrollWidth - g.clientWidth,
        stacked: text.top >= time.bottom - 1,
        textWide: text.width > g.getBoundingClientRect().width * 0.8,
        more: Boolean(g.querySelector('.g-transcript__more')),
        coarse,
        minTarget: Math.min(...targets)
      }
    })
    expect(m.overflow).toBeLessThanOrEqual(0)
    expect(m.viewOverflow).toBeLessThanOrEqual(0)
    expect(m.stacked).toBe(true)
    expect(m.textWide).toBe(true)
    expect(m.more).toBe(true)
    expect(m.minTarget).toBeGreaterThanOrEqual(m.coarse ? 44 : 24)
    await saved.locator('.g-transcript__more').click()
    const menu = page.locator('ul.g-menu__list[role="menu"]')
    await expect(menu).toBeVisible()
    const box = await menu.boundingBox()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(320)
    expect(await menu.locator('[role^="menuitem"]').count()).toBe(4)
    expect(errs).toEqual([])
    await context.close()
  })
})
