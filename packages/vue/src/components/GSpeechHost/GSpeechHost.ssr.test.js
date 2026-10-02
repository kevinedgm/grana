// @vitest-environment node
// SSR (speech.md §16): importar @grana/vue y crear el gestor no toca document, window, navigator, matchMedia ni
// AudioContext; en el servidor GSpeechHost no pinta nada, GSpeechPill pinta su raíz oculta y GSpeechTrigger su botón en
// idle; los métodos devuelven false sin efectos. Dos aplicaciones con dos gestores no comparten estado.
import { describe, it, expect, vi } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

const LABELS = { region: 'Grabación de voz', trigger: { dictate: 'Dictar en {target}', conversation: 'Grabar conversación' } }

describe('captura de voz · SSR (entorno node)', () => {
  it('no hay DOM en este entorno', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
  })

  it('importar el paquete y crear el gestor no toca el DOM; los métodos devuelven false sin temporizadores', async () => {
    // Cualquier acceso a navigator, AudioContext o matchMedia rompe la prueba
    const touched = []
    const prev = {}
    for (const k of ['navigator', 'AudioContext', 'matchMedia']) {
      prev[k] = Object.getOwnPropertyDescriptor(globalThis, k)
      Object.defineProperty(globalThis, k, { configurable: true, get() { touched.push(k); return undefined } })
    }
    const { createSpeech } = await import('../../index.js')
    const { createSimulatedSpeechAdapter } = await import('../../testing.js')
    const timer = vi.spyOn(globalThis, 'setTimeout')
    const interval = vi.spyOn(globalThis, 'setInterval')
    const s = createSpeech({ adapter: createSimulatedSpeechAdapter(), labels: LABELS })
    for (const m of ['prepare', 'begin', 'pause', 'resume', 'finish', 'discard', 'close', 'cancel', 'openPanel', 'retrySegment', 'insertPending', 'undoDictation']) {
      await expect(s[m]()).resolves.toBe(false)
    }
    await expect(s.start({ mode: 'conversation' })).resolves.toBe(false)
    await expect(s.start({ mode: 'dictation', target: { id: 'x' } })).resolves.toBe(false)
    expect(s.state.status).toBe('idle')
    expect(timer).not.toHaveBeenCalled()
    expect(interval).not.toHaveBeenCalled()
    expect(touched).toEqual([])
    for (const k of Object.keys(prev)) {
      if (prev[k]) Object.defineProperty(globalThis, k, prev[k])
      else delete globalThis[k]
    }
    timer.mockRestore()
    interval.mockRestore()
  })

  it('renderToString con dos apps y dos gestores: sin marcado del anfitrión, pill oculta, botón del disparador en idle', async () => {
    const { createSpeech, GSpeechHost, GSpeechPill, GSpeechTrigger } = await import('../../index.js')
    const { createSimulatedSpeechAdapter } = await import('../../testing.js')
    const render = async (label) => {
      const speech = createSpeech({ adapter: createSimulatedSpeechAdapter(), labels: LABELS })
      const app = createSSRApp({ render: () => h('main', [h('header', [h(GSpeechPill)]), h(GSpeechTrigger, { for: 'obs', targetLabel: label }), h(GSpeechTrigger, { mode: 'conversation' }), h(GSpeechHost)]) })
      app.use(speech)
      return { html: await renderToString(app), speech }
    }
    const a = await render('Observaciones')
    const b = await render('Plan')
    expect(a.speech).not.toBe(b.speech)
    for (const { html } of [a, b]) {
      expect(html).not.toContain('g-speech-host')
      expect(html).not.toContain('popover')
      expect(html).toMatch(/<div class="g-speech-pill[^"]*"[^>]*hidden/)
      expect(html).toContain('g-speech-trigger g-speech-trigger--mode-dictation')
      expect(html).toContain('data-status="idle"')
      expect(html).toContain('aria-pressed="false"')
      expect(html).toContain('Grabar conversación')
    }
    expect(a.html).toContain('aria-label="Dictar en Observaciones"')
    expect(b.html).toContain('aria-label="Dictar en Plan"')
  })
})
