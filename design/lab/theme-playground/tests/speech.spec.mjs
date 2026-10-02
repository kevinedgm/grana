// Captura de voz (design/contracts/speech.md §17) sobre los COMPONENTES REALES del playground (packages/vue/playground,
// sección #sec-speech, adaptador simulado de @grana/vue/testing), en Chromium, Firefox y WebKit.
// Casos: anfitrión en la capa superior con 2 canales vacíos antes de la sesión; sesión que sobrevive a GTabs, GStepper y
// un GDialog modal real; exactamente una pill visible; las g-btn__status de los GBtn vacías toda la sesión (#227);
// Mayús+F8 de ida y vuelta (F8 sola no se intercepta); pausa (pista detenida) y finalización; dictado al cursor sin mover
// el foco; convivencia con GToaster en el borde (móvil); micrófono REAL del motor con nivel > 0.
// Micrófono: Chromium con --use-fake-device-for-media-stream (getUserMedia real, tono de prueba); Firefox con las
// preferencias media.navigator.streams.fake (getUserMedia real, tono); WebKit de Playwright no tiene dispositivo falso
// ni forma de conceder el permiso: se sustituye getUserMedia por un MediaStream real de un OscillatorNode
// (createMediaStreamDestination), así Grana mide un nivel real con su AnalyserNode y su AudioWorklet (documentado).
import { test, expect, chromium, firefox } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'
const SELF = `${PAGE}?speech=self#sec-speech`

function watchConsole(page) {
  const errs = []
  page.on('pageerror', (e) => errs.push(`pageerror: ${e.message}`))
  page.on('console', (m) => {
    const t = m.text()
    if (m.type() === 'error' && !/favicon/.test(t)) errs.push(`console: ${t}`)
    else if (m.type() === 'warning' && /\[Vue warn\]|\[Grana Speech\]/.test(t)) errs.push(`warning: ${t}`)
  })
  return errs
}
// Todas las regiones vivas fuera de los dos canales del anfitrión: deben estar vacías (las g-btn__status, #227)
const otherLiveText = (page) => page.evaluate(() => [...document.querySelectorAll('[role="status"], [role="alert"], [aria-live]:not([aria-live="off"])')]
  .filter((el) => !el.classList.contains('g-speech-host__live') && !el.closest('.g-toaster') && el.closest('.g-speech-host, .g-speech-pill, .g-speech-trigger'))
  .map((el) => el.textContent).join(''))
// La pill visible: exactamente una (colocada o flotante), visible y en el visor
const visiblePills = (page) => page.evaluate(() => [...document.querySelectorAll('.g-speech-pill')].filter((p) => {
  if (p.closest('[hidden]') || p.hidden) return false
  const r = p.getBoundingClientRect()
  if (!r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight) return false
  if (p.closest('[inert]')) return false
  const modal = document.querySelector('dialog:modal:not(.g-speech-sheet)')
  if (modal && !modal.contains(p)) return false
  return true
}).map((p) => p.dataset.placement))
const ready = async (page, url = SELF) => {
  await page.goto(url)
  await page.waitForSelector('#sec-speech .g-speech-trigger')
  await page.waitForFunction(() => document.querySelector('.g-speech-host') && window.speech)
}

test.describe('captura de voz · playground', () => {
  test('anfitrión en la capa superior con 2 canales vacíos antes de la sesión; la pill colocada existe oculta', async ({ page }) => {
    const errs = watchConsole(page)
    await ready(page)
    const host = await page.evaluate(() => {
      const r = document.querySelector('.g-speech-host')
      return {
        open: r.matches(':popover-open'),
        lives: [...r.querySelectorAll('.g-speech-host__live')].map((l) => [l.getAttribute('role'), l.getAttribute('aria-live'), l.textContent]),
        floatHidden: r.querySelector('.g-speech-host__float').hidden,
        panelHidden: r.querySelector('.g-speech-panel').hidden,
        placedHidden: document.querySelector('#pg-speech-pill, .pg-bar .g-speech-pill') ? document.querySelector('.pg-bar .g-speech-pill').hidden : null
      }
    })
    expect(host.open).toBe(true)
    expect(host.lives).toEqual([['status', 'polite', ''], ['alert', null, '']])
    expect(host.floatHidden).toBe(true)
    expect(host.panelHidden).toBe(true)
    expect(host.placedHidden).toBe(true)
    expect(errs).toEqual([])
  })

  test('la sesión sobrevive a GTabs, GStepper y un GDialog modal; una sola pill visible; las regiones de GBtn siguen vacías', async ({ page }) => {
    const errs = watchConsole(page)
    await ready(page)
    const conv = page.locator('#speech-tabs .g-speech-trigger--mode-conversation .g-speech-trigger__btn')
    await conv.click()
    await expect(page.locator('.g-speech-panel')).toBeVisible()
    await expect(page.locator('.g-speech-panel__title')).toBeFocused()
    await page.locator('.g-speech-panel__controls .g-btn', { hasText: 'Empezar a grabar' }).click()
    await page.waitForFunction(() => /listening|speech|transcribing/.test(window.speech.state.status))
    const id = await page.evaluate(() => window.speech.state.sessionId)
    expect(await otherLiveText(page)).toBe('')
    // la pill colocada de la cabecera (sticky) es la visible; la flotante, oculta
    expect(await visiblePills(page)).toEqual(['placed'])
    await page.keyboard.press('Escape')
    // GTabs: cambia de pestaña (el disparador de «Motivo» se desmonta)
    await page.locator('#speech-tabs [role="tab"]', { hasText: 'Plan' }).click()
    await page.locator('#speech-tabs [role="tab"]', { hasText: 'Resumen' }).click()
    await page.waitForTimeout(2500)
    expect(await page.evaluate(() => window.speech.state.sessionId)).toBe(id)
    expect(await otherLiveText(page)).toBe('')
    // GStepper: avanza un paso
    await page.locator('#sec-stepper').scrollIntoViewIfNeeded()
    const next = page.locator('#sec-stepper .g-btn', { hasText: 'Siguiente' }).first()
    if (await next.count()) await next.click()
    expect(await page.evaluate(() => window.speech.state.sessionId)).toBe(id)
    // GDialog modal real: la raíz se traslada; la flotante aparece DENTRO del modal y es operable
    await page.locator('#sec-speech').scrollIntoViewIfNeeded()
    await page.locator('#sp-dialog').click()
    await page.waitForFunction(() => document.querySelector('dialog.g-dialog[open] .g-speech-host'))
    expect(await visiblePills(page)).toEqual(['floating'])
    const hit = await page.evaluate(() => {
      const main = document.querySelector('dialog.g-dialog[open] .g-speech-host__float .g-speech-pill__main')
      const r = main.getBoundingClientRect()
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return Boolean(el && main.contains(el))
    })
    expect(hit).toBe(true)
    await page.locator('dialog.g-dialog[open] .g-speech-host__float .g-speech-pill__main').click()
    await expect(page.locator('dialog.g-dialog[open] .g-speech-panel')).toBeVisible()
    await expect(page.locator('.g-speech-panel__title')).toBeFocused()
    await page.keyboard.press('Escape') // cierra el panel, NO el diálogo
    await expect(page.locator('.g-speech-panel')).toBeHidden()
    await expect(page.locator('dialog.g-dialog[open]')).toHaveCount(1)
    expect(await page.evaluate(() => window.speech.state.sessionId)).toBe(id)
    await page.locator('dialog.g-dialog[open] .g-dialog__footer .g-btn', { hasText: 'Cerrar' }).click()
    await page.waitForFunction(() => document.querySelector('.g-speech-host').parentElement === document.body)
    expect(await page.evaluate(() => document.querySelector('.g-speech-host').matches(':popover-open'))).toBe(true)
    expect(await page.evaluate(() => window.speech.state.sessionId)).toBe(id)
    expect(await otherLiveText(page)).toBe('')
    // anuncios: el inicio una vez; nada transcrito en los canales
    await page.evaluate(() => window.speech.discard())
    expect(errs).toEqual([])
  })

  test('Mayús+F8 va a la pill visible y vuelve; F8 sola no se intercepta; pausa y finalización desde la pill', async ({ page }) => {
    const errs = watchConsole(page)
    await ready(page)
    await page.locator('#sp-obs').focus()
    await page.keyboard.press('Shift+F8')
    expect(await page.evaluate(() => document.activeElement.id)).toBe('sp-obs') // sin sesión no se intercepta
    await page.locator('#speech-demo .g-speech-trigger__btn').first().click()
    await page.waitForFunction(() => /listening|speech|transcribing/.test(window.speech.state.status))
    await page.locator('#sp-obs').focus()
    await page.keyboard.press('Shift+F8')
    expect(await page.evaluate(() => document.activeElement.classList.contains('g-speech-pill__main'))).toBe(true)
    await page.keyboard.press('Shift+F8')
    expect(await page.evaluate(() => document.activeElement.id)).toBe('sp-obs')
    const prevented = await page.evaluate(() => {
      const ev = new KeyboardEvent('keydown', { key: 'F8', bubbles: true, cancelable: true })
      document.activeElement.dispatchEvent(ev)
      return ev.defaultPrevented
    })
    expect(prevented).toBe(false)
    // Pausar (el mismo botón pasa a Reanudar) y Finalizar
    const pill = page.locator('.pg-bar .g-speech-pill')
    await pill.locator('.g-speech-pill__toggle').click()
    await page.waitForFunction(() => window.speech.state.status === 'paused')
    await expect(pill.locator('.g-speech-pill__toggle')).toHaveAttribute('aria-label', 'Reanudar')
    await expect(pill.locator('.g-speech-pill__text')).toHaveText('En pausa')
    await pill.locator('.g-speech-pill__finish').click()
    await page.waitForFunction(() => ['completed', 'idle'].includes(window.speech.state.status), null, { timeout: 15000 })
    expect(await otherLiveText(page)).toBe('')
    expect(errs).toEqual([])
  })

  test('dictado al cursor: el confirmado entra en el campo sin mover el foco; el provisional va en la nota', async ({ page }) => {
    const errs = watchConsole(page)
    await ready(page)
    const before = await page.inputValue('#sp-obs')
    const trigger = page.locator('#speech-demo .g-speech-trigger__btn').first()
    // Con el teclado: en WebKit (como en Safari de macOS) un clic no enfoca los botones
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(trigger).toHaveAttribute('aria-pressed', 'true')
    await expect(trigger).toBeFocused()
    await page.waitForFunction(() => document.querySelector('#speech-demo .g-speech-trigger__note.is-partial:not([hidden])'), null, { timeout: 15000 })
    expect(await page.inputValue('#sp-obs')).toBe(before) // el provisional no toca el valor
    await page.waitForFunction((b) => document.getElementById('sp-obs').value !== b, before, { timeout: 20000 })
    const after = await page.inputValue('#sp-obs')
    expect(after.startsWith(before.trimEnd())).toBe(true)
    expect(after).toContain('Refiere dolor lumbar')
    await expect(trigger).toBeFocused()
    await page.keyboard.press('Enter') // finaliza
    await page.waitForFunction(() => window.speech.state.status === 'idle', null, { timeout: 20000 })
    await expect(page.locator('#speech-demo .g-speech-trigger__note .g-speech-trigger__note-action')).toHaveText('Deshacer dictado')
    await page.locator('#speech-demo .g-speech-trigger__note-action').click()
    expect(await page.inputValue('#sp-obs')).toBe(before)
    expect(await page.evaluate(() => document.activeElement.id)).toBe('sp-obs')
    expect(errs).toEqual([])
  })

  test('móvil: la pill flotante abajo al centro y un aviso de GToaster encima de ella (reserva del borde); la pill no se mueve', async ({ page }) => {
    const errs = watchConsole(page)
    await page.setViewportSize({ width: 360, height: 720 })
    await ready(page)
    await page.evaluate(() => window.speech.start({ mode: 'conversation' }))
    await page.waitForFunction(() => /listening|speech|transcribing/.test(window.speech.state.status))
    // La cabecera del playground es fija (sticky): se suelta para que, al desplazar, la pill colocada salga del visor
    // y la visible sea la flotante del anfitrión
    await page.evaluate(() => { document.querySelector('.pg-bar').style.position = 'static'; window.scrollTo(0, document.body.scrollHeight) })
    await page.waitForTimeout(500)
    const pills = await visiblePills(page)
    expect(pills).toEqual(['floating'])
    const root = await page.evaluate(() => ({ mobile: document.querySelector('.g-speech-host').hasAttribute('data-mobile'), edge: document.querySelector('.g-speech-host').dataset.edge }))
    expect(root).toEqual({ mobile: true, edge: 'bottom' })
    {
      const pillBefore = await page.evaluate(() => document.querySelector('.g-speech-host__float').getBoundingClientRect().top)
      await page.evaluate(() => window.toaster.success('Borrador guardado'))
      await page.waitForSelector('.g-toast[data-state="visible"]')
      await page.waitForTimeout(500)
      const m = await page.evaluate(() => {
        const f = document.querySelector('.g-speech-host__float').getBoundingClientRect()
        const t = document.querySelector('.g-toast').getBoundingClientRect()
        return { pillTop: f.top, toastBottom: t.bottom, offset: document.querySelector('.g-toaster').style.getPropertyValue('--_toaster-offset-bottom') }
      })
      expect(m.offset).toMatch(/^calc\(/)
      expect(m.toastBottom).toBeLessThanOrEqual(m.pillTop)
      expect(m.pillTop).toBe(pillBefore)
    }
    await page.evaluate(() => window.speech.discard())
    expect(errs).toEqual([])
  })
})

// ---------- Micrófono REAL del motor: nivel > 0 por el AnalyserNode y PCM por el AudioWorklet ----------
async function micCheck(page) {
  await ready(page, `${PAGE}#sec-speech`)
  await page.evaluate(() => {
    window.__levels = []
    window.speech.onLevel((v, live) => { if (live) window.__levels.push(v) })
  })
  await page.locator('#speech-demo .g-speech-trigger__btn').first().click()
  await page.waitForFunction(() => /listening|speech|transcribing/.test(window.speech.state.status), null, { timeout: 15000 })
  await page.waitForTimeout(2500)
  const r = await page.evaluate(() => ({
    status: window.speech.state.status,
    max: Math.max(0, ...window.__levels),
    frames: window.__levels.length,
    pushed: window.spAdapter.log.pushed.slice(0, 3),
    capture: window.speech.state.capture
  }))
  // pausa = pistas detenidas
  await page.locator('.pg-bar .g-speech-pill .g-speech-pill__toggle').click()
  await page.waitForFunction(() => window.speech.state.status === 'paused')
  await page.evaluate(() => window.speech.discard())
  return r
}

test.describe('captura de voz · micrófono real del motor', () => {
  test('nivel > 0 y trozos PCM de 16 kHz y 300 ms', async ({ browserName, page }) => {
    test.setTimeout(90_000)
    let ctx = null
    let browser = null
    let p = page
    if (browserName === 'chromium') {
      browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'] })
      ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL, permissions: ['microphone'] })
      p = await ctx.newPage()
    } else if (browserName === 'firefox') {
      browser = await firefox.launch({ firefoxUserPrefs: { 'media.navigator.streams.fake': true, 'media.navigator.permission.disabled': true, 'media.autoplay.default': 0 } })
      ctx = await browser.newContext({ baseURL: test.info().project.use.baseURL })
      p = await ctx.newPage()
    } else {
      // WebKit: sin dispositivo falso; getUserMedia devuelve el MediaStream real de un oscilador (tono de 440 Hz)
      await p.addInitScript(() => {
        // En el prototipo: en este WebKit una asignación en la instancia no sustituye al método
        Object.defineProperty(MediaDevices.prototype, 'getUserMedia', {
          configurable: true,
          writable: true,
          value: async () => {
            const ac = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ac.createOscillator()
            const gain = ac.createGain()
            gain.gain.value = 0.3
            const dest = ac.createMediaStreamDestination()
            osc.connect(gain).connect(dest)
            osc.start()
            if (ac.state === 'suspended') await ac.resume().catch(() => {})
            return dest.stream
          }
        })
        // La Permissions API de este WebKit responde «denied» al micrófono (no hay forma de concederlo): sin el sustituto,
        // Grana detecta el permiso denegado sin abrir nada, que es justo lo que pide el contrato (§3.5)
        const query = Permissions.prototype.query
        Object.defineProperty(Permissions.prototype, 'query', {
          configurable: true,
          writable: true,
          value(d) { return d && d.name === 'microphone' ? Promise.resolve({ state: 'prompt', onchange: null }) : query.call(this, d) }
        })
      })
    }
    const errs = watchConsole(p)
    const r = await micCheck(p)
    expect(r.capture).toBe('live')
    expect(r.status).toMatch(/listening|speech|transcribing/)
    expect(r.frames).toBeGreaterThan(10)
    expect(r.max).toBeGreaterThan(0)
    expect(r.pushed.length).toBeGreaterThan(0)
    expect(r.pushed[0]).toMatchObject({ format: 'pcm', size: 4800 })
    expect(r.pushed[0].t1 - r.pushed[0].t0).toBe(300)
    expect(errs).toEqual([])
    if (browser) await browser.close()
  })
})
