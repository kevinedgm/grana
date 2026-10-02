// GSpeechHost (anfitrión) y GSpeechPill (pill colocable) en jsdom: canales vivos, garantía de una pill, panel, foco y
// teclado, traslado al <dialog> modal (GDialog real), hoja móvil, borde compartido con GToaster y movimiento.
// Playwright cubre capa superior real, medidas, micrófono falso y los tres motores (design/lab/theme-playground/tests/speech.spec.mjs).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GSpeechHost from './GSpeechHost.vue'
import GSpeechPill from '../GSpeechPill/GSpeechPill.vue'
import GDialog from '../GDialog/GDialog.vue'
import GToaster from '../GToast/GToaster.vue'
import { createToaster } from '../GToast/toaster.js'
import { createSpeech } from './speech.js'
import { createSimulatedSpeechAdapter } from './simulatedAdapter.js'
import { installSpeechEnv, installTopLayer, LABELS } from './speechTestEnv.js'

let env
let restoreTopLayer
let warn
const wrappers = []
beforeEach(() => {
  restoreTopLayer = installTopLayer()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'] })
  env = installSpeechEnv()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(async () => {
  // Ningún aviso de Vue (props, Teleport, refs) en ninguna prueba
  expect(warn.mock.calls.map((c) => String(c[0])).filter((m) => m.includes('[Vue warn]'))).toEqual([])
  while (wrappers.length) {
    const { w, speech } = wrappers.pop()
    if (speech.state.status !== 'idle' && speech.state.status !== 'processing') await speech.discard()
    w.unmount()
  }
  env.restore()
  restoreTopLayer()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
  document.documentElement.style.removeProperty('--g-space-1')
})

const flush = async () => { await nextTick(); await nextTick() }
const tick = async (ms) => { await vi.advanceTimersByTimeAsync(ms); await flush() }
const key = (k, o = {}) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o })
const root = () => document.querySelector('.g-speech-host')
const live = (role) => root().querySelector(`.g-speech-host__live[role="${role}"]`)
const float = () => root().querySelector('.g-speech-host__float')
const panel = () => document.querySelector('.g-speech-panel')

async function setup({ options = {}, adapter: adapterOptions = {}, placed = false, slot, toaster } = {}) {
  const adapter = createSimulatedSpeechAdapter({ latency: 200, ...adapterOptions })
  const speech = createSpeech({ adapter, labels: LABELS, ...options })
  const App = defineComponent({
    setup() {
      return () => h('div', [
        h('header', { id: 'head' }, placed ? [h(GSpeechPill)] : []),
        h('button', { id: 'before' }, 'Antes'),
        slot ? slot() : null,
        toaster ? h(GToaster) : null,
        h(GSpeechHost)
      ])
    }
  })
  const plugins = [speech]
  if (toaster) plugins.push(toaster)
  const w = mount(App, { attachTo: document.body, global: { plugins } })
  wrappers.push({ w, speech })
  await flush()
  return { speech, adapter, w }
}
// Las regiones vivas que no son los dos canales del anfitrión (no debe haber ninguna: los GBtn sin loadingText no pintan
// g-btn__status, #257, que sustituye a la excepción #227)
const otherLive = () => [...document.querySelectorAll('[role="status"], [role="alert"], [aria-live]:not([aria-live="off"])')].filter((el) => !el.classList.contains('g-speech-host__live'))

describe('GSpeechHost · raíz y canales', () => {
  it('existe antes de la primera sesión: raíz popover abierta en body con 2 canales vacíos; la flotante y el panel ocultos', async () => {
    await setup()
    const r = root()
    expect(r.parentElement).toBe(document.body)
    expect(r.getAttribute('popover')).toBe('manual')
    expect(r.hasAttribute('data-popover-open')).toBe(true)
    expect(r.dataset.edge).toBe('top')
    expect(r.dataset.align).toBe('center')
    const lives = r.querySelectorAll('.g-speech-host__live')
    expect(lives).toHaveLength(2)
    expect(live('status').getAttribute('aria-live')).toBe('polite')
    expect(live('status').getAttribute('aria-atomic')).toBe('true')
    expect(live('alert').getAttribute('aria-atomic')).toBe('true')
    expect([...lives].every((l) => l.textContent === '')).toBe(true)
    expect(float().hidden).toBe(true)
    expect(panel().hidden).toBe(true)
    expect(r.querySelector('dialog.g-speech-sheet')).not.toBeNull()
    expect(panel().getAttribute('role')).toBe('dialog')
    expect(panel().getAttribute('aria-modal')).toBeNull()
  })

  it('los dos canales son las únicas regiones vivas: ningún g-btn__status en toda la sesión (#257)', async () => {
    const { speech } = await setup({ adapter: { script: { conversation: [{ speaker: 'A', text: 'Texto confidencial uno.' }] } } })
    const snapshots = []
    const snap = () => snapshots.push(otherLive().map((el) => el.textContent).join(''))
    snap()
    await speech.start({ mode: 'conversation' })
    await speech.openPanel()
    await tick(400)
    snap()
    expect(live('status').textContent).toBe('Grabando conversación.')
    env.level = 0.6
    await tick(900)
    snap()
    env.level = 0.01
    await tick(1500)
    snap()
    await speech.pause()
    await tick(400)
    snap()
    const p = speech.finish()
    await tick(2000)
    await p
    snap()
    expect(document.querySelectorAll('.g-speech-host .g-btn, .g-speech-pill .g-btn').length).toBeGreaterThan(3)
    expect(document.querySelectorAll('.g-btn__status')).toHaveLength(0) // #257: sin loadingText no hay región
    expect(otherLive()).toHaveLength(0)
    expect(snapshots.every((s) => s === '')).toBe(true)
    expect(live('status').textContent + live('alert').textContent).not.toMatch(/confidencial/i)
  })

  it('un error va por el canal enérgico con el texto compuesto', async () => {
    const { speech } = await setup()
    env.error = Object.assign(new Error('x'), { name: 'NotFoundError' })
    await speech.start({ mode: 'conversation' })
    await tick(100)
    expect(live('alert').textContent).toBe('Micrófono no disponible. No se encontró ningún micrófono. No se grabó nada. Conecta uno y pulsa Reintentar.')
  })

  it('dos GSpeechHost del mismo gestor: el segundo no pinta nada y avisa', async () => {
    const adapter = createSimulatedSpeechAdapter()
    const speech = createSpeech({ adapter, labels: LABELS })
    const w = mount(defineComponent({ setup: () => () => h('div', [h(GSpeechHost), h(GSpeechHost)]) }), { attachTo: document.body, global: { plugins: [speech] } })
    wrappers.push({ w, speech })
    await flush()
    expect(document.querySelectorAll('.g-speech-host')).toHaveLength(1)
    expect(warn.mock.calls.some((c) => String(c[0]).includes('dos <GSpeechHost>'))).toBe(true)
  })

  it('sin gestor: no pinta nada y avisa', async () => {
    const w = mount(GSpeechHost, { attachTo: document.body })
    await flush()
    expect(document.querySelector('.g-speech-host')).toBeNull()
    expect(warn.mock.calls.some((c) => String(c[0]).includes('<GSpeechHost> sin prop'))).toBe(true)
    w.unmount()
  })

  it('al desmontar el anfitrión con la captura viva, la captura se detiene (sin indicador no hay micrófono)', async () => {
    const { speech, w } = await setup()
    await speech.start({ mode: 'conversation' })
    expect(env.tracks[0].readyState).toBe('live')
    w.unmount()
    wrappers.pop()
    expect(env.tracks[0].readyState).toBe('ended')
    expect(speech.state.status).toBe('paused')
    await expect(speech.resume()).resolves.toBe(false)
    await speech.discard()
  })
})

describe('GSpeechHost · garantía de una pill visible y operable (§6.3)', () => {
  it('sin pill colocada: la flotante aparece con la sesión y lleva el marcado de §7.2', async () => {
    const { speech } = await setup()
    await speech.start({ mode: 'conversation' })
    await flush()
    expect(float().hidden).toBe(false)
    const pill = float().querySelector('.g-speech-pill')
    expect(pill.dataset.placement).toBe('floating')
    expect(pill.getAttribute('role')).toBe('group')
    expect(pill.getAttribute('aria-label')).toBe('Grabación de voz')
    expect(pill.classList.contains('is-live')).toBe(true)
    const main = pill.querySelector('.g-speech-pill__main')
    expect(main.getAttribute('aria-expanded')).toBe('false')
    expect(main.getAttribute('aria-controls')).toBe(panel().id)
    expect(main.getAttribute('aria-keyshortcuts')).toBe('Shift+F8')
    expect(main.textContent).toMatch(/^(Grabando|Voz detectada|Transcribiendo), abrir panel$/)
    expect(pill.querySelector('.g-speech-pill__time').getAttribute('role')).toBe('timer')
    expect(pill.querySelector('.g-speech-pill__toggle').getAttribute('aria-label')).toBe('Pausar')
    expect(pill.querySelector('.g-speech-pill__finish').hidden).toBe(false)
    expect(pill.querySelectorAll('.g-speech-meter__bar')).toHaveLength(4)
    await tick(500)
    const bar = pill.querySelector('.g-speech-meter__bar')
    expect(Number(bar.style.getPropertyValue('--_speech-bar'))).toBeGreaterThan(0)
  })

  it('pill colocada visible → la flotante se oculta; fuera del visor (o inerte) → la flotante', async () => {
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList && this.classList.contains('g-speech-pill') && this.dataset.placement === 'placed') return { left: 10, top: 10, right: 210, bottom: 44, width: 200, height: 34 }
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
    })
    const { speech } = await setup({ placed: true })
    const placed = document.querySelector('#head .g-speech-pill')
    expect(placed.hidden).toBe(true) // en idle existe oculta
    await speech.start({ mode: 'conversation' })
    await flush()
    expect(placed.hidden).toBe(false)
    expect(float().hidden).toBe(true)
    // inerte → flotante
    document.getElementById('head').setAttribute('inert', '')
    await speech.pause()
    await flush()
    expect(float().hidden).toBe(false)
    document.getElementById('head').removeAttribute('inert')
    // fuera del visor → flotante
    rect.mockImplementation(function () {
      if (this.classList && this.classList.contains('g-speech-pill') && this.dataset.placement === 'placed') return { left: 10, top: -100, right: 210, bottom: -66, width: 200, height: 34 }
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
    })
    window.dispatchEvent(new Event('resize'))
    await flush()
    expect(float().hidden).toBe(false)
  })

  it('una sola GSpeechPill por gestor: la segunda no pinta nada y avisa', async () => {
    const adapter = createSimulatedSpeechAdapter()
    const speech = createSpeech({ adapter, labels: LABELS })
    const w = mount(defineComponent({ setup: () => () => h('div', [h(GSpeechPill), h(GSpeechPill), h(GSpeechHost)]) }), { attachTo: document.body, global: { plugins: [speech] } })
    wrappers.push({ w, speech })
    await flush()
    expect(document.querySelectorAll('.g-speech-pill[data-placement="placed"]')).toHaveLength(1)
    expect(warn.mock.calls.some((c) => String(c[0]).includes('dos <GSpeechPill>'))).toBe(true)
  })

  it('alternar cambia de nombre e icono: Pausar → Reanudar (pausa) → Reintentar (error sin captura)', async () => {
    const { speech } = await setup()
    await speech.start({ mode: 'conversation' })
    await tick(300)
    const toggle = () => float().querySelector('.g-speech-pill__toggle')
    expect(toggle().getAttribute('aria-label')).toBe('Pausar')
    toggle().click()
    await flush()
    expect(speech.state.status).toBe('paused')
    expect(toggle().getAttribute('aria-label')).toBe('Reanudar')
    expect(float().querySelector('.g-speech-pill__time').hidden).toBe(false)
    await speech.discard()
    env.error = Object.assign(new Error('x'), { name: 'NotReadableError' })
    await speech.start({ mode: 'conversation' })
    await flush()
    expect(toggle().getAttribute('aria-label')).toBe('Reintentar')
    expect(float().querySelector('.g-speech-pill__finish').hidden).toBe(true)
    expect(float().querySelector('.g-speech-pill').classList.contains('is-problem')).toBe(true)
  })
})

describe('GSpeechHost · panel, foco y teclado (§6.4, §11)', () => {
  it('abrir el panel lleva el foco a su título; Esc lo cierra con preventDefault sin propagarse y devuelve el foco a la pill', async () => {
    const { speech } = await setup()
    await speech.start({ mode: 'conversation' })
    await flush()
    const main = float().querySelector('.g-speech-pill__main')
    main.focus()
    main.click()
    await flush()
    expect(speech.state.panelOpen).toBe(true)
    expect(panel().hidden).toBe(false)
    expect(document.activeElement).toBe(panel().querySelector('.g-speech-panel__title'))
    expect(main.getAttribute('aria-expanded')).toBe('true')
    const outer = vi.fn()
    document.addEventListener('keydown', outer)
    const ev = key('Escape')
    document.activeElement.dispatchEvent(ev)
    await flush()
    expect(ev.defaultPrevented).toBe(true)
    expect(outer).not.toHaveBeenCalled()
    document.removeEventListener('keydown', outer)
    expect(speech.state.panelOpen).toBe(false)
    expect(speech.state.status).toMatch(/listening|speech|transcribing/) // Esc nunca detiene
    expect(document.activeElement).toBe(main)
  })

  it('marcado del panel: estado, privacidad siempre visible, controles de captura, transcript vacío como <p>', async () => {
    const { speech } = await setup()
    await speech.start({ mode: 'conversation' })
    await speech.openPanel()
    await flush()
    const p = panel()
    expect(p.classList.contains('g-surface--level-floating')).toBe(true)
    expect(p.dataset.status).toMatch(/listening|speech|transcribing/)
    expect(p.classList.contains('is-live')).toBe(true)
    expect(p.getAttribute('aria-labelledby')).toBe(p.querySelector('h2').id)
    expect(p.querySelector('.g-speech-panel__title').getAttribute('tabindex')).toBe('-1')
    expect(p.querySelector('.g-speech-panel__mode').textContent).toBe('Conversación · Varios')
    expect(p.querySelector('.g-speech-panel__privacy').textContent).toBe('En el servicio local. Audio temporal en memoria.')
    expect(p.querySelector('.g-speech-panel__privacy > .g-icon')).not.toBeNull()
    expect(p.querySelector('.g-speech-panel__time .g-speech-panel__sr').textContent).toBe('Duración: ')
    expect([...p.querySelectorAll('.g-speech-panel__controls > .g-btn')].map((b) => b.textContent.trim())).toEqual(['Pausar', 'Finalizar', 'Descartar'])
    expect(p.querySelector('.g-speech-panel__transcript > p').textContent).toBe('Todavía no hay texto.')
    expect(p.querySelectorAll('.g-speech-wave__bar')).toHaveLength(32)
    expect(p.querySelector('.g-speech-panel__activity .g-btn').getAttribute('aria-pressed')).toBe('false')
  })

  it('transcript: provisional al final (cursiva de coco, prefijo oculto), confirmado en su sitio, hablantes A, B…', async () => {
    const { speech, adapter } = await setup()
    await speech.start({ mode: 'conversation' })
    await speech.openPanel()
    adapter.emit('final', { id: 'a', text: 'Hola.', speaker: 'SPK_7', t0: 0, t1: 1000 })
    adapter.emit('partial', { id: 'b', text: 'qué tal', speaker: 'SPK_9' })
    await flush()
    const list = panel().querySelector('ol.g-speech-transcript')
    expect(list.getAttribute('tabindex')).toBe('0')
    const items = list.querySelectorAll('li')
    expect(items).toHaveLength(2)
    expect(items[0].querySelector('.g-speech-segment__speaker').textContent).toBe('Hablante A')
    expect(items[1].classList.contains('is-partial')).toBe(true)
    expect(items[1].querySelector('.g-speech-segment__flag').textContent).toBe('provisional')
    expect(items[1].querySelector('.g-speech-segment__sr').textContent).toBe('Texto provisional: ')
    expect(items[1].querySelector('.g-speech-segment__speaker').textContent).toBe('Hablante B')
    const first = items[0]
    adapter.emit('final', { id: 'b', text: 'Qué tal.', speaker: 'SPK_9', t0: 1000, t1: 2000 })
    await flush()
    const after = list.querySelectorAll('li')
    expect(after).toHaveLength(2)
    expect(after[0]).toBe(first) // el confirmado no se rehace
    expect(after[1].classList.contains('is-partial')).toBe(false)
    expect(after[1].querySelector('.g-speech-segment__text').textContent).toBe('Qué tal.')
  })

  it('«Ocultar actividad» (aria-pressed) oculta onda y medidor y deja estado y duración', async () => {
    const { speech } = await setup()
    await speech.start({ mode: 'conversation' })
    await speech.openPanel()
    await flush()
    const btn = panel().querySelector('.g-speech-panel__activity .g-btn')
    btn.click()
    await flush()
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    expect(panel().querySelector('.g-speech-wave').hidden).toBe(true)
    expect(float().querySelector('.g-speech-meter').hidden).toBe(true)
    expect(float().querySelector('.g-speech-pill__time').hidden).toBe(false)
    expect(panel().querySelector('.g-speech-panel__time').hidden).toBe(false)
  })

  it('descartar desde el panel pide confirmación en línea con el foco en «Cancelar»; cancelar vuelve a «Descartar»', async () => {
    const { speech } = await setup()
    await speech.start({ mode: 'conversation' })
    await speech.openPanel()
    await flush()
    const discard = [...panel().querySelectorAll('.g-speech-panel__controls .g-btn')].find((b) => b.textContent.trim() === 'Descartar')
    discard.click()
    await flush()
    const confirm = panel().querySelector('.g-speech-panel__confirm')
    expect(confirm).not.toBeNull()
    expect(document.activeElement.textContent.trim()).toBe('Cancelar')
    document.activeElement.click()
    await flush()
    expect(panel().querySelector('.g-speech-panel__confirm')).toBeNull()
    expect(document.activeElement.textContent.trim()).toBe('Descartar')
    document.activeElement.click()
    await flush()
    const yes = [...panel().querySelectorAll('.g-speech-panel__confirm .g-btn')].find((b) => b.textContent.trim() === 'Sí, descartar')
    expect(yes.classList.contains('g-btn--color-danger')).toBe(true)
    yes.click()
    await flush()
    expect(speech.state.status).toBe('idle')
  })

  it('procesando: GProgress determinado y sin acciones de cierre ni descarte', async () => {
    const { speech } = await setup({ adapter: { latency: 1500 } })
    await speech.start({ mode: 'conversation' })
    env.level = 0.6
    await tick(700)
    await speech.openPanel()
    const p = speech.finish()
    await flush()
    expect(panel().querySelector('.g-speech-panel__progress [role="progressbar"]')).not.toBeNull()
    expect(panel().querySelector('.g-speech-panel__controls')).toBeNull()
    expect(panel().querySelector('.g-speech-panel__status-icon').classList.contains('is-spinning')).toBe(true)
    await tick(3000)
    await p
    expect(speech.state.status).toBe('completed')
    expect([...panel().querySelectorAll('.g-speech-panel__controls .g-btn')].map((b) => b.textContent.trim())).toEqual(['Cerrar sesión', 'Descartar'])
    expect(panel().querySelector('.g-speech-panel__privacy').textContent).toContain('Audio temporal eliminado.')
  })

  it('si un cambio de estado retira el botón enfocado («Empezar a grabar»), el foco pasa al título del panel, no a body', async () => {
    const { speech } = await setup()
    await speech.prepare()
    await speech.openPanel()
    await flush()
    const start = [...panel().querySelectorAll('.g-speech-panel__controls .g-btn')].find((b) => b.textContent.trim() === 'Empezar a grabar')
    start.focus()
    start.click()
    await tick(10)
    expect(speech.state.status).toMatch(/listening|speech|transcribing/)
    expect(document.activeElement).toBe(panel().querySelector('.g-speech-panel__title'))
  })

  it('cierre ligero: un pointerdown fuera cierra el panel sin mover el foco', async () => {
    const { speech } = await setup()
    await speech.start({ mode: 'conversation' })
    await speech.openPanel()
    await flush()
    const before = document.getElementById('before')
    before.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await flush()
    expect(speech.state.panelOpen).toBe(false)
    expect(document.activeElement).toBe(panel().querySelector('.g-speech-panel__title'))
  })

  it('Mayús+F8 va a la pill y vuelve; F8 sola y sin sesión no se interceptan; IME no', async () => {
    const { speech } = await setup()
    const before = document.getElementById('before')
    before.focus()
    let ev = key('F8', { shiftKey: true })
    before.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false) // sin sesión
    await speech.start({ mode: 'conversation' })
    await flush()
    ev = key('F8')
    before.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false) // F8 es de GToaster
    ev = key('F8', { shiftKey: true, isComposing: true })
    before.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    ev = key('F8', { shiftKey: true })
    before.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    const main = float().querySelector('.g-speech-pill__main')
    expect(document.activeElement).toBe(main)
    ev = key('F8', { shiftKey: true })
    main.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    expect(document.activeElement).toBe(before)
  })

  it('al cerrar la sesión con el foco en la pill, el foco va al disparador o a donde estaba antes del atajo', async () => {
    const { speech } = await setup()
    const before = document.getElementById('before')
    before.focus()
    await speech.start({ mode: 'conversation' })
    await flush()
    before.dispatchEvent(key('F8', { shiftKey: true }))
    expect(document.activeElement.classList.contains('g-speech-pill__main')).toBe(true)
    float().querySelector('.g-speech-pill__finish').click()
    await tick(2000)
    expect(speech.state.status).toBe('completed')
    await speech.close()
    await flush()
    expect(document.activeElement).toBe(before)
  })
})

describe('GSpeechHost · modal, hoja móvil y borde compartido (§6.6, §6.7)', () => {
  it('con un GDialog modal: la raíz se traslada a él (mismos nodos), la flotante aparece dentro y Esc del panel no cierra el diálogo; vuelve a body', async () => {
    const open = ref(false)
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.dataset && this.dataset.placement === 'placed') return { left: 10, top: 10, right: 210, bottom: 44, width: 200, height: 34 }
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 }
    })
    const { speech } = await setup({ placed: true, slot: () => h(GDialog, { modelValue: open.value, 'onUpdate:modelValue': (v) => { open.value = v }, title: 'Derivación', closeLabel: 'Cerrar' }, { default: () => h('p', 'Contenido') }) })
    await speech.start({ mode: 'conversation' })
    await flush()
    expect(float().hidden).toBe(true)
    const r = root()
    const channel = live('status')
    open.value = true
    await flush()
    await flush()
    const dlg = document.querySelector('dialog.g-dialog')
    expect(dlg.hasAttribute('open')).toBe(true)
    expect(root().parentElement).toBe(dlg)
    expect(root()).toBe(r)
    expect(live('status')).toBe(channel) // los canales siguen existiendo
    expect(r.hasAttribute('data-popover-open')).toBe(true)
    expect(float().hidden).toBe(false) // la colocada queda fuera del modal
    await speech.openPanel()
    await flush()
    const ev = key('Escape')
    panel().querySelector('.g-speech-panel__title').dispatchEvent(ev)
    await flush()
    expect(ev.defaultPrevented).toBe(true)
    expect(open.value).toBe(true)
    expect(dlg.hasAttribute('open')).toBe(true)
    open.value = false
    await flush()
    await flush()
    expect(root().parentElement).toBe(document.body)
    rect.mockRestore()
  })

  it('móvil (visor < space × 130): data-mobile, borde inferior centrado; el panel va en la hoja modal, Esc/cancel la cierra; la hoja no traslada la raíz', async () => {
    document.documentElement.style.setProperty('--g-space-1', '4px')
    const w0 = window.innerWidth
    window.innerWidth = 400
    const { speech } = await setup({ options: { position: 'top-end' } })
    window.dispatchEvent(new Event('resize'))
    await flush()
    const r = root()
    expect(r.hasAttribute('data-mobile')).toBe(true)
    expect(r.dataset.edge).toBe('bottom')
    expect(r.dataset.align).toBe('center')
    await speech.start({ mode: 'conversation' })
    await speech.openPanel()
    await flush()
    await flush()
    const sheet = r.querySelector('dialog.g-speech-sheet')
    expect(sheet.hasAttribute('open')).toBe(true)
    expect(sheet.contains(panel())).toBe(true)
    expect(root().parentElement).toBe(document.body) // su propia hoja no la traslada
    expect(document.activeElement).toBe(panel().querySelector('.g-speech-panel__title'))
    const cancel = new Event('cancel', { cancelable: true })
    sheet.dispatchEvent(cancel)
    await flush()
    await flush()
    expect(cancel.defaultPrevented).toBe(true)
    expect(speech.state.panelOpen).toBe(false)
    expect(sheet.hasAttribute('open')).toBe(false)
    window.innerWidth = w0
  })

  it('borde compartido con GToaster: en móvil la reserva de la pill flotante se suma a --_toaster-offset-bottom (GToast.css no cambia)', async () => {
    document.documentElement.style.setProperty('--g-space-1', '4px')
    const w0 = window.innerWidth
    window.innerWidth = 400
    const oh = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      return this.classList && this.classList.contains('g-speech-host__float') ? 38 : 0
    })
    const toaster = createToaster({ labels: { region: 'Avisos', close: 'Cerrar' }, offset: { bottom: 10 } })
    const { speech } = await setup({ toaster })
    window.dispatchEvent(new Event('resize'))
    await flush()
    const tr = document.querySelector('.g-toaster')
    expect(tr.style.getPropertyValue('--_toaster-offset-bottom')).toBe('10px')
    await speech.start({ mode: 'conversation' })
    await flush()
    await flush()
    expect(tr.dataset.edge).toBe('bottom')
    expect(tr.style.getPropertyValue('--_toaster-offset-bottom')).toBe('calc(10px + 46px)') // 38 + space × 2
    await speech.discard()
    await flush()
    await flush()
    expect(tr.style.getPropertyValue('--_toaster-offset-bottom')).toBe('10px')
    oh.mockRestore()
    window.innerWidth = w0
  })

  it('sin --g-space-1 medible (jsdom): la reserva de la pill flotante es solo su alto, sin margen inventado', async () => {
    const w0 = window.innerWidth
    window.innerWidth = 400 // sin unidad medible no es móvil, aunque el visor sea estrecho
    const oh = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function () {
      return this.classList && this.classList.contains('g-speech-host__float') ? 38 : 0
    })
    const toaster = createToaster({ labels: { region: 'Avisos', close: 'Cerrar' }, offset: { bottom: 10 } })
    const { speech } = await setup({ toaster, options: { position: 'bottom-center' } })
    window.dispatchEvent(new Event('resize'))
    await flush()
    expect(root().hasAttribute('data-mobile')).toBe(false) // unidad 0: no es móvil, igual que GToaster y GDialog
    await speech.start({ mode: 'conversation' })
    await flush()
    await flush()
    const tr = document.querySelector('.g-toaster')
    expect(tr.dataset.edge).toBe('bottom')
    expect(tr.style.getPropertyValue('--_toaster-offset-bottom')).toBe('calc(10px + 38px)') // 38 + 0 × margen, no 38 + 4 × 2
    oh.mockRestore()
    window.innerWidth = w0
  })

  it('movimiento reducido: data-reduced-motion en la raíz y onda de 5 segmentos con data-on', async () => {
    window.matchMedia = vi.fn((q) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {} }))
    const { speech } = await setup()
    await speech.start({ mode: 'conversation' })
    await speech.openPanel()
    await flush()
    expect(root().hasAttribute('data-reduced-motion')).toBe(true)
    const bars = panel().querySelectorAll('.g-speech-wave__bar')
    expect(bars).toHaveLength(5)
    env.level = 0.9
    await tick(600)
    expect([...bars].some((b) => b.hasAttribute('data-on'))).toBe(true)
    delete window.matchMedia
  })

  it('offset: --_speech-offset-* en línea en la raíz', async () => {
    await setup({ options: { offset: { top: 56, bottom: '2rem' } } })
    expect(root().style.getPropertyValue('--_speech-offset-top')).toBe('56px')
    expect(root().style.getPropertyValue('--_speech-offset-bottom')).toBe('2rem')
  })
})
