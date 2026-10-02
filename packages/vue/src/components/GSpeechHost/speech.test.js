// Gestor de la captura de voz (createSpeech) en jsdom con el adaptador simulado y una captura simulada (speechTestEnv.js).
// Contrato: design/contracts/speech.md §1 a §5, §9, §10, §15 y §17. Playwright cubre la captura real en los tres motores
// (design/lab/theme-playground/tests/speech.spec.mjs).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createApp, defineComponent, h } from 'vue'
import { createSpeech, useSpeech, speechKey, INTERNAL, SPEECH_TIMING, TRANSITIONS, STATUSES, STATE_ICON, formatTime, normalizeCapabilities } from './speech.js'
import { createSimulatedSpeechAdapter } from './simulatedAdapter.js'
import { installSpeechEnv, LABELS } from './speechTestEnv.js'

let env
let warn
const managers = []
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
  env = installSpeechEnv()
  warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(async () => {
  // Cada gestor deja de tener sesión (y sus escuchas de ventana) antes de la siguiente prueba
  for (const s of managers.splice(0)) {
    if (s.state.status === 'completed') await s.close()
    else if (s.state.status !== 'idle' && s.state.status !== 'processing') await s.discard()
  }
  env.restore()
  vi.useRealTimers()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

const tick = (ms) => vi.advanceTimersByTimeAsync(ms)
const warnings = () => warn.mock.calls.map((c) => String(c[0]))
// Gestor con un anfitrión de mentira (lo que aporta GSpeechHost: canales y foco)
function setup(options = {}, adapterOptions = {}) {
  const adapter = createSimulatedSpeechAdapter({ latency: 400, ...adapterOptions })
  const speech = createSpeech({ adapter, labels: LABELS, ...options })
  const said = []
  const host = { id: 'h', write: (text, p) => said.push({ p, text }), focusPill: vi.fn() }
  speech[INTERNAL].attachHost(host)
  managers.push(speech)
  return { speech, adapter, said, host, api: speech[INTERNAL] }
}
function field(type = 'textarea', value = '') {
  const el = document.createElement(type === 'textarea' ? 'textarea' : 'input')
  if (type !== 'textarea') el.type = type
  el.id = 'obs'
  el.value = value
  document.body.append(el)
  return el
}

describe('createSpeech · API y constantes', () => {
  it('SPEECH_TIMING tiene los valores del contrato (§3.7)', () => {
    expect(SPEECH_TIMING).toMatchObject({ frameMs: 100, chunkMs: 300, watchdogMs: 1500, watchdogTickMs: 250, flatMs: 2500, voiceThreshold: 0.12, voiceHoldMs: 450, announceGroupMs: 300, insertAnnounceMs: 2500, autoCloseMs: 1500, reducedMotionHz: 4, levelMinDb: -60, levelMaxDb: -10 })
    expect(Object.isFrozen(SPEECH_TIMING)).toBe(true)
  })

  it('los 13 estados con su icono y la tabla de transiciones legales de §2.2', () => {
    expect(STATUSES).toHaveLength(13)
    expect(STATE_ICON).toEqual({ idle: 'mic', requesting: 'shield-question-mark', ready: 'mic', listening: 'circle', speech: 'audio-lines', transcribing: 'captions', paused: 'circle-pause', processing: 'loader-circle', reconnecting: 'refresh-cw', denied: 'mic-off', unavailable: 'unplug', error: 'circle-alert', completed: 'circle-check' })
    const C = ['listening', 'speech', 'transcribing']
    const others = (s) => C.filter((x) => x !== s)
    expect(TRANSITIONS).toEqual({
      idle: ['requesting', 'ready', 'denied', 'error'],
      requesting: [...C, 'denied', 'unavailable', 'error', 'idle'],
      ready: ['requesting', 'denied', 'unavailable', 'error', 'idle'],
      listening: [...others('listening'), 'paused', 'processing', 'reconnecting', 'denied', 'unavailable', 'error', 'idle'],
      speech: [...others('speech'), 'paused', 'processing', 'reconnecting', 'denied', 'unavailable', 'error', 'idle'],
      transcribing: [...others('transcribing'), 'paused', 'processing', 'reconnecting', 'denied', 'unavailable', 'error', 'idle'],
      paused: ['requesting', 'processing', 'reconnecting', 'error', 'idle'],
      processing: ['completed', 'error'],
      reconnecting: [...C, 'paused', 'processing', 'denied', 'unavailable', 'error', 'idle'],
      denied: ['requesting', 'ready', 'processing', 'idle'],
      unavailable: ['requesting', 'processing', 'idle'],
      error: ['requesting', 'processing', 'idle'],
      completed: ['idle']
    })
  })

  it('estado de solo lectura con todas las facetas de §1.3; los métodos devuelven promesas que nunca rechazan', async () => {
    const speech = createSpeech({ adapter: createSimulatedSpeechAdapter(), labels: LABELS }) // sin anfitrión
    expect(Object.keys(speech.state).sort()).toEqual(['activityHidden', 'attempt', 'capture', 'consent', 'duration', 'engine', 'error', 'expectedSpeakers', 'issues', 'mode', 'panelOpen', 'pending', 'permission', 'result', 'sessionId', 'signal', 'status', 'target', 'transcript', 'voice'].sort())
    speech.state.status = 'listening'
    expect(speech.state.status).toBe('idle')
    for (const m of ['prepare', 'begin', 'pause', 'resume', 'finish', 'discard', 'close', 'cancel', 'openPanel', 'closePanel', 'setConsent', 'setExpectedSpeakers', 'retrySegment', 'insertPending', 'undoDictation']) {
      const p = speech[m]()
      expect(p, m).toBeInstanceOf(Promise)
      await expect(p).resolves.toBe(false)
    }
    await expect(speech.start({})).resolves.toBe(false)
  })

  it('formatTime: mm:ss y h:mm:ss desde una hora', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(42_900)).toBe('00:42')
    expect(formatTime(3_725_000)).toBe('1:02:05')
  })

  it('app.use provee el gestor; useSpeech sin gestor avisa y devuelve undefined', () => {
    const { speech } = setup()
    let got
    const App = defineComponent({ setup() { got = useSpeech(); return () => h('p') } })
    const el = document.createElement('div')
    createApp(App).use(speech).mount(el)
    expect(got).toBe(speech)
    let none = 'x'
    createApp(defineComponent({ setup() { none = useSpeech(); return () => h('p') } })).mount(document.createElement('div'))
    expect(none).toBeUndefined()
    expect(warnings().some((w) => w.includes('useSpeech() sin gestor'))).toBe(true)
    expect(typeof speechKey).toBe('symbol')
  })
})

describe('reglas de seguridad (también en producción)', () => {
  it('sin GSpeechHost montado no se abre el micrófono: el método devuelve false y avisa (§15.4)', async () => {
    const adapter = createSimulatedSpeechAdapter()
    const speech = createSpeech({ adapter, labels: LABELS })
    field()
    await expect(speech.start({ mode: 'dictation', target: { id: 'obs' } })).resolves.toBe(false)
    await expect(speech.prepare()).resolves.toBe(false)
    expect(env.gum).toBe(0)
    expect(adapter.log.opened).toBe(0)
    expect(adapter.log.checks).toBe(0)
    expect(speech.state.status).toBe('idle')
    expect(warnings().some((w) => w.includes('sin un <GSpeechHost> montado'))).toBe(true)
  })

  it('sin adapter (o sin open/capabilities): aviso y ningún método inicia sesión', async () => {
    const speech = createSpeech({ labels: LABELS })
    speech[INTERNAL].attachHost({ id: 'h', write() {}, focusPill() {} })
    await expect(speech.prepare()).resolves.toBe(false)
    createSpeech({ adapter: { id: 'x' } })
    expect(warnings().filter((w) => w.includes('adapter')).length).toBeGreaterThanOrEqual(2)
  })

  it("location: 'remote' sin allowRemote → error remote-not-allowed, no recuperable, sin getUserMedia ni open", async () => {
    const { speech, adapter, said } = setup({}, { location: 'remote' })
    field()
    await expect(speech.start({ mode: 'dictation', target: { id: 'obs', label: 'Obs' } })).resolves.toBe(false)
    expect(speech.state.status).toBe('error')
    expect(speech.state.error).toMatchObject({ kind: 'remote-not-allowed', recoverable: false, capture: 'none', audio: 'none' })
    expect(env.gum).toBe(0)
    expect(adapter.log.opened).toBe(0)
    expect(warnings().some((w) => w.includes("location: 'remote'"))).toBe(true)
    await tick(10)
    expect(said.at(-1)).toMatchObject({ p: 'assertive' })
    expect(said.at(-1).text).toContain('Motor no permitido.')
    // no recuperable: reanudar se rechaza
    await expect(speech.resume()).resolves.toBe(false)
    await speech.discard()
    // con allowRemote sí se abre
    speech.configure({ allowRemote: true })
    await expect(speech.start({ mode: 'dictation', target: { id: 'obs', label: 'Obs' } })).resolves.toBe(true)
    expect(adapter.log.opened).toBe(1)
  })

  it('capacidades no válidas → error unsupported sin abrir el micrófono y con aviso', async () => {
    const { speech, adapter } = setup({}, { input: { format: 'pcm' } })
    await speech.prepare()
    expect(speech.state.status).toBe('error')
    expect(speech.state.error).toMatchObject({ kind: 'unsupported', recoverable: false })
    expect(env.gum).toBe(0)
    expect(adapter.log.checks).toBe(0)
    expect(normalizeCapabilities({ location: 'local', input: { format: 'encoded', mimeTypes: [], timeslice: 100 } })).toBeNull()
    expect(normalizeCapabilities({ location: 'local', input: { format: 'self' }, storesAudio: 'cloud' })).toBeNull()
    expect(normalizeCapabilities({ location: 'local', input: { format: 'pcm', sampleRate: 16000 } })).toMatchObject({ input: { chunkMs: 300, sampleFormat: 'f32', channels: 1 }, storesAudio: 'none', partials: false })
  })
})

describe('estados y captura', () => {
  it('dictado: idle → requesting → listening, con el anuncio de inicio una vez y la espera del permiso solo si el navegador pregunta', async () => {
    env.permission = 'prompt'
    const { speech, said } = setup()
    field()
    const seen = []
    const stop = vi.fn()
    const p = speech.start({ mode: 'dictation', target: { id: 'obs', label: 'Observaciones' } })
    seen.push(speech.state.status)
    await expect(p).resolves.toBe(true)
    expect(speech.state).toMatchObject({ status: 'listening', mode: 'dictation', capture: 'live', permission: 'granted', expectedSpeakers: 1 })
    expect(speech.state.target).toEqual({ id: 'obs', label: 'Observaciones' })
    expect(speech.state.sessionId).toMatch(/^speech-/)
    await tick(400)
    const texts = said.map((s) => s.text)
    expect(texts).toEqual(['Grabando. Dictado en Observaciones.'])
    stop()
    // con permiso ya concedido no se anuncia la espera
    await speech.discard()
    said.length = 0
    env.permission = 'granted'
    await speech.start({ mode: 'dictation', target: { id: 'obs', label: 'Observaciones' } })
    await tick(2000)
    expect(said.map((s) => s.text)).toEqual(['Grabación descartada.', 'Grabando. Dictado en Observaciones.'])
    expect(seen).toEqual(['idle'])
  })

  it('conversación: prepare() comprueba permiso y servicio SIN abrir el micrófono → ready; begin() abre', async () => {
    const { speech, adapter } = setup()
    await expect(speech.prepare({ expectedSpeakers: 2 })).resolves.toBe(true)
    expect(speech.state).toMatchObject({ status: 'ready', mode: 'conversation', capture: 'off', expectedSpeakers: 2 })
    expect(env.gum).toBe(0)
    expect(adapter.log.checks).toBe(1)
    expect(adapter.log.opened).toBe(0)
    await expect(speech.setExpectedSpeakers('many')).resolves.toBe(true)
    await expect(speech.begin()).resolves.toBe(true)
    expect(speech.state.status).toBe('listening')
    expect(env.gum).toBe(1)
    expect(adapter.log.opened).toBe(1)
    await expect(speech.setConsent(true)).resolves.toBe(false)
  })

  it('servicio caído en prepare → error service-unavailable sin micrófono', async () => {
    const { speech, adapter } = setup()
    adapter.setServiceDown(true)
    await expect(speech.prepare()).resolves.toBe(false)
    expect(speech.state.status).toBe('error')
    expect(speech.state.error).toMatchObject({ kind: 'service-unavailable', capture: 'none', recoverable: true })
    expect(env.gum).toBe(0)
  })

  it('requireConsent: begin() se rechaza sin la casilla; con setConsent(true) empieza', async () => {
    const { speech, said } = setup({ requireConsent: true })
    await expect(speech.start({ mode: 'conversation' })).resolves.toBe(true)
    expect(speech.state.status).toBe('ready')
    await expect(speech.begin()).resolves.toBe(false)
    expect(speech.state.status).toBe('ready')
    await tick(10)
    expect(said.map((s) => s.text)).toContain('Marca la casilla de aviso para empezar.')
    await speech.setConsent(true)
    await expect(speech.begin()).resolves.toBe(true)
    expect(speech.state.status).toBe('listening')
  })

  it('nivel real por onLevel (no reactivo), voz por energía y estados de captura derivados sin anunciarse', async () => {
    const { speech, said } = setup()
    const levels = []
    const off = speech.onLevel((v, live) => levels.push([v, live]))
    await speech.start({ mode: 'conversation' })
    env.level = 0.5
    await tick(1000)
    expect(levels.length).toBeGreaterThanOrEqual(9)
    expect(levels.at(-1)[0]).toBeCloseTo(0.5, 2)
    expect(levels.at(-1)[1]).toBe(true)
    expect(speech.state.voice).toBe('speech')
    expect(['speech', 'transcribing']).toContain(speech.state.status)
    expect(speech.state.duration).toBeGreaterThanOrEqual(900)
    env.level = 0.01
    await tick(2000)
    expect(speech.state.voice).toBe('silence')
    expect(['listening', 'transcribing']).toContain(speech.state.status)
    // solo el inicio se anunció
    expect(said.map((s) => s.text)).toEqual(['Grabando conversación.'])
    off()
    const n = levels.length
    await tick(500)
    expect(levels.length).toBe(n)
  })

  it('pausa = pistas detenidas; reanudar vuelve a pedir el micrófono (requesting) y anuncia la reanudación', async () => {
    const { speech, adapter, said } = setup()
    await speech.start({ mode: 'conversation' })
    await tick(500)
    const track = env.tracks[0]
    await expect(speech.pause()).resolves.toBe(true)
    expect(track.readyState).toBe('ended')
    expect(speech.state).toMatchObject({ status: 'paused', capture: 'off' })
    expect(adapter.log.paused).toBe(1)
    const d = speech.state.duration
    await tick(1000)
    expect(speech.state.duration).toBe(d) // sin pausas en la duración
    const p = speech.resume()
    expect(speech.state.status).toBe('paused')
    await p
    expect(speech.state.status).toBe('listening')
    expect(env.gum).toBe(2)
    expect(adapter.log.resumed).toBe(1)
    await tick(2000)
    expect(said.map((s) => s.text)).toEqual(['Grabando conversación.', 'En pausa. El micrófono no está capturando.', 'Grabando de nuevo.'])
  })

  it('vigilante: con la captura congelada pasa a error interrupted en menos de 2,5 s (y deja de decir «Grabando»)', async () => {
    const { speech, said } = setup()
    await speech.start({ mode: 'conversation' })
    await tick(500)
    env.frozen = true
    await tick(1500)
    expect(speech.state.status).toMatch(/listening|speech|transcribing/)
    await tick(500) // 2 s desde la congelación
    expect(speech.state.status).toBe('error')
    expect(speech.state.error).toMatchObject({ kind: 'interrupted', capture: 'stopped', recoverable: true })
    expect(speech.state.capture).toBe('off')
    await tick(10)
    const last = said.at(-1)
    expect(last.p).toBe('assertive')
    expect(last.text).toContain('Grabación interrumpida.')
    expect(last.text).toContain('La grabación se detuvo.')
  })

  it('señal plana: más de 2,5 s de ceros → signal flat sin cambiar de estado, aviso cortés una vez; vuelve a ok', async () => {
    const { speech, said } = setup()
    await speech.start({ mode: 'conversation' })
    env.level = 0
    await tick(2800)
    expect(speech.state.signal).toBe('flat')
    expect(speech.state.status).toBe('listening')
    await tick(3000)
    expect(said.filter((s) => s.text === 'No llega sonido del micrófono.')).toHaveLength(1)
    env.level = 0.3
    await tick(200)
    expect(speech.state.signal).toBe('ok')
  })

  it('pista ended → unavailable device-disconnected; mute → error interrupted', async () => {
    const { speech } = setup()
    await speech.start({ mode: 'conversation' })
    await tick(300)
    env.tracks[0].readyState = 'ended'
    env.tracks[0].dispatchEvent(new Event('ended'))
    expect(speech.state.status).toBe('unavailable')
    expect(speech.state.error).toMatchObject({ kind: 'device-disconnected', capture: 'stopped' })
    await speech.resume()
    expect(speech.state.status).toMatch(/listening|speech|transcribing/)
    env.tracks[1].muted = true
    env.tracks[1].dispatchEvent(new Event('mute'))
    expect(speech.state.status).toBe('error')
    expect(speech.state.error.kind).toBe('interrupted')
  })

  it.each([
    ['NotAllowedError', 'denied', 'permission-denied'],
    ['NotFoundError', 'unavailable', 'no-device'],
    ['OverconstrainedError', 'unavailable', 'no-device'],
    ['NotReadableError', 'unavailable', 'device-busy'],
    ['AbortError', 'unavailable', 'device-busy'],
    ['SecurityError', 'unavailable', 'unsupported']
  ])('getUserMedia %s → %s (%s)', async (name, status, kind) => {
    const { speech } = setup()
    env.error = Object.assign(new Error(name), { name })
    await expect(speech.start({ mode: 'conversation' })).resolves.toBe(false)
    expect(speech.state.status).toBe(status)
    expect(speech.state.error.kind).toBe(kind)
    expect(speech.state.error.capture).toBe('none')
    expect(speech.state.capture).toBe('off')
  })

  it('sin navigator.mediaDevices (contexto no seguro) → unavailable unsupported, no recuperable', async () => {
    const { speech } = setup()
    delete navigator.mediaDevices
    await speech.start({ mode: 'conversation' })
    expect(speech.state.status).toBe('unavailable')
    expect(speech.state.error).toMatchObject({ kind: 'unsupported', recoverable: false })
  })

  it('permiso ya denegado (Permissions API): denied sin abrir nada', async () => {
    env.permission = 'denied'
    const { speech, adapter } = setup()
    field()
    await speech.start({ mode: 'dictation', target: { id: 'obs', label: 'Obs' } })
    expect(speech.state.status).toBe('denied')
    expect(speech.state.permission).toBe('denied')
    expect(env.gum).toBe(0)
    expect(adapter.log.opened).toBe(0)
  })

  it('PCM: trozos a la sampleRate pedida y de chunkMs, Float32Array (f32) o Int16Array (s16), sin esperar a push', async () => {
    env.autoPcm = false
    const { speech, adapter } = setup({}, { input: { format: 'pcm', sampleRate: 16000, channels: 1, chunkMs: 300 } })
    await speech.start({ mode: 'conversation' })
    const node = env.worklets[0]
    expect(node).toBeTruthy()
    // 48 kHz → 16 kHz: 300 ms = 4800 muestras a la salida = 14 400 a la entrada
    for (let i = 0; i < 8; i++) node.port.onmessage({ data: new Float32Array(2048).fill(0.1) })
    expect(adapter.log.pushed.length).toBe(1)
    const c = adapter.log.pushed[0]
    expect(c).toMatchObject({ seq: 1, t0: 0, t1: 300, format: 'pcm', size: 4800 })
    await speech.discard()
    adapter.setCapabilities({ input: { format: 'pcm', sampleRate: 16000, channels: 1, sampleFormat: 's16', chunkMs: 100 } })
    const got = []
    const eng = { push: (ch) => got.push(ch), pause() {}, resume() {}, finish: async () => ({ audioDeleted: true }), abort: async () => ({ audioDeleted: true }) }
    const open = adapter.open
    adapter.open = async () => eng
    await speech.start({ mode: 'conversation' })
    for (let i = 0; i < 3; i++) env.worklets.at(-1).port.onmessage({ data: new Float32Array(2048).fill(0.5) })
    expect(got[0].data).toBeInstanceOf(Int16Array)
    expect(got[0].data.length).toBe(1600)
    adapter.open = open
  })

  it('codificado: primer mimeType admitido y timeslice; sin ninguno → unavailable unsupported', async () => {
    const { speech, adapter } = setup({}, { input: { format: 'encoded', mimeTypes: ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus'], timeslice: 250 } })
    await speech.start({ mode: 'conversation' })
    const rec = env.recorders[0]
    expect(rec.mimeType).toBe('audio/webm;codecs=opus')
    expect(rec.timeslice).toBe(250)
    await tick(300)
    rec.emit(512)
    expect(adapter.log.pushed[0]).toMatchObject({ format: 'encoded', mimeType: 'audio/webm;codecs=opus', size: 512 })
    await speech.discard()
    env.mimeTypes = []
    await speech.start({ mode: 'conversation' })
    expect(speech.state.status).toBe('unavailable')
    expect(speech.state.error.kind).toBe('unsupported')
    expect(env.gum).toBe(1) // no se abrió el micrófono la segunda vez
  })

  it("input 'self': la sesión no pasa a captura hasta capture { state: 'live' }; level alimenta el vigilante", async () => {
    const { speech, adapter } = setup({}, { input: { format: 'self' } })
    const p = speech.start({ mode: 'conversation' })
    await tick(20)
    expect(speech.state.status).toBe('requesting')
    await tick(60)
    await expect(p).resolves.toBe(true)
    expect(speech.state.status).toMatch(/listening|speech|transcribing/)
    expect(env.gum).toBe(0) // Grana no captura
    await tick(1000)
    expect(speech.state.duration).toBeGreaterThan(800)
    adapter.freezeCapture(true)
    await tick(2000)
    expect(speech.state.status).toBe('error')
    expect(speech.state.error.kind).toBe('interrupted')
    expect(warnings().some((w) => w.includes("'self' sin eventos level"))).toBe(true)
  })
})

describe('adaptador (eventos §4.4) y errores tipados (§4.5)', () => {
  it('partial → final con el mismo id lo sustituye en su sitio; pending → transcribing', async () => {
    const { speech, adapter } = setup()
    await speech.start({ mode: 'conversation' })
    adapter.emit('partial', { id: 's1', text: 'hola', speaker: 'A' })
    expect(speech.state.transcript.partial).toEqual({ id: 's1', text: 'hola', speaker: 'A' })
    adapter.emit('pending', { count: 1 })
    expect(speech.state.pending).toBe(1)
    env.level = 0.01
    await tick(600)
    expect(speech.state.status).toBe('transcribing')
    adapter.emit('final', { id: 's1', text: 'Hola.', speaker: 'A', t0: 0, t1: 900 })
    adapter.emit('pending', { count: 0 })
    expect(speech.state.transcript.partial).toBeNull()
    expect(speech.state.transcript.segments).toEqual([{ id: 's1', t0: 0, t1: 900, literal: 'Hola.', engineSpeaker: 'A', corrected: null, speaker: null, removed: false, failed: false }])
    expect(speech.state.transcript.speakers).toEqual([{ id: 'A' }])
    expect(speech.state.status).toBe('listening')
    // el literal no se sobrescribe
    adapter.emit('final', { id: 's1', text: 'Otro', t0: 0, t1: 900 })
    expect(speech.state.transcript.segments[0].literal).toBe('Hola.')
  })

  it('el simulado emite provisional palabra a palabra y el confirmado tras la latencia, con hablantes', async () => {
    const { speech } = setup({}, { script: { conversation: [{ speaker: 'A', text: 'Uno dos tres.' }] } })
    await speech.start({ mode: 'conversation' })
    env.level = 0.6
    await tick(700)
    expect(speech.state.transcript.partial.text).toMatch(/^uno/)
    env.level = 0.01
    await tick(1500)
    const seg = speech.state.transcript.segments[0]
    expect(seg.literal).toBe('Uno dos tres.')
    expect(seg.engineSpeaker).toBe('A')
  })

  it('conexión perdida CON offlineBuffer: reconnecting con captura viva; restablecida → captura', async () => {
    const { speech, adapter, said } = setup({}, { offlineBuffer: true })
    await speech.start({ mode: 'conversation' })
    adapter.goOffline()
    expect(speech.state).toMatchObject({ status: 'reconnecting', capture: 'live', engine: 'lost' })
    expect(env.tracks[0].readyState).toBe('live')
    await tick(400)
    expect(said.at(-1).text).toBe('Reconectando. La grabación continúa.')
    adapter.goOnline()
    expect(speech.state.status).toMatch(/listening|speech|transcribing/)
    expect(speech.state.engine).toBe('ok')
  })

  it('conexión perdida SIN offlineBuffer: captura retenida (pistas detenidas); restablecida → paused, sin reanudar sola', async () => {
    const { speech, adapter, said } = setup({}, { offlineBuffer: false, storesAudio: 'none' })
    await speech.start({ mode: 'conversation' })
    adapter.goOffline()
    expect(speech.state).toMatchObject({ status: 'reconnecting', capture: 'held' })
    expect(env.tracks[0].readyState).toBe('ended')
    adapter.goOnline()
    expect(speech.state).toMatchObject({ status: 'paused', capture: 'off' })
    await tick(2000)
    expect(speech.state.status).toBe('paused')
    expect(said.map((s) => s.text)).toContain('Servicio restablecido. Pulsa Reanudar.')
  })

  it('reconexión fallida tras los reintentos → error service-unavailable fatal con las cuatro respuestas', async () => {
    const { speech, adapter, said } = setup({}, { retryInterval: 500, maxRetries: 2 })
    await speech.start({ mode: 'conversation' })
    adapter.setServiceDown(true)
    await tick(600)
    expect(speech.state).toMatchObject({ status: 'reconnecting', engine: 'retrying', attempt: 1 })
    await tick(600)
    expect(speech.state.status).toBe('error')
    expect(speech.state.error).toMatchObject({ kind: 'service-unavailable', capture: 'stopped', audio: 'kept', recoverable: true })
    await tick(10)
    const t = said.at(-1).text
    expect(t).toBe('Servicio no disponible. El servicio no responde. La grabación se detuvo. El audio afectado se guarda. Pulsa Reintentar.')
  })

  it('error no fatal → issues y fragmento fallido con «Reintentar fragmento»; el reintento lo rellena', async () => {
    const { speech, adapter, said } = setup({ onError: vi.fn() }, { latency: 100, script: { conversation: [{ speaker: 'A', text: 'Uno.' }] } })
    await speech.start({ mode: 'conversation' })
    adapter.failNextSegment({ retryable: true })
    env.level = 0.6
    await tick(400)
    env.level = 0.01
    await tick(1500)
    expect(speech.state.status).toMatch(/listening|transcribing/)
    expect(speech.state.issues).toHaveLength(1)
    const issue = speech.state.issues[0]
    expect(issue).toMatchObject({ kind: 'processing-failed', audio: 'kept', retryable: true })
    const seg = speech.state.transcript.segments.find((s) => s.id === issue.segmentId)
    expect(seg.failed).toBe(true)
    expect(said.map((s) => s.text)).toContain('No se pudo transcribir un fragmento.')
    await expect(speech.retrySegment(issue.segmentId)).resolves.toBe(true)
    await tick(200)
    expect(seg.failed).toBe(false)
    expect(seg.literal).toBe('Uno.')
    expect(speech.state.issues).toHaveLength(0)
  })

  it('storage-full fatal → error con la captura detenida; onError recibe una copia sin contenido', async () => {
    const onError = vi.fn()
    const { speech, adapter } = setup({ onError })
    await speech.start({ mode: 'conversation' })
    adapter.emit('final', { id: 'x', text: 'Secreto', t0: 0, t1: 100 })
    adapter.storageFull()
    expect(speech.state.status).toBe('error')
    expect(speech.state.error).toMatchObject({ kind: 'storage-full', capture: 'stopped' })
    expect(env.tracks[0].readyState).toBe('ended')
    const arg = onError.mock.calls.at(-1)[0]
    expect(arg).toEqual(speech.state.error)
    expect(arg).not.toBe(speech.state.error)
    expect(JSON.stringify(arg)).not.toContain('Secreto')
  })

  it('push que lanza: fallo no fatal processing-failed con el audio perdido; la captura sigue y avisa', async () => {
    env.autoPcm = false
    const { speech, adapter } = setup()
    await speech.start({ mode: 'conversation' })
    adapter.session.push = () => { throw new Error('x') }
    const node = env.worklets[0]
    for (let i = 0; i < 16; i++) node.port.onmessage({ data: new Float32Array(2048) })
    expect(speech.state.issues).toHaveLength(1) // tramos seguidos se unen
    expect(speech.state.issues[0]).toMatchObject({ kind: 'processing-failed', audio: 'lost', segmentId: null, t0: 0, t1: 600 })
    expect(speech.state.status).toMatch(/listening|speech|transcribing/)
    expect(warnings().some((w) => w.includes('push del adaptador'))).toBe(true)
  })

  it('eventos desconocidos o posteriores a finish/abort se ignoran con aviso', async () => {
    const { speech, adapter } = setup()
    await speech.start({ mode: 'conversation' })
    adapter.emit('nuevo', {})
    expect(warnings().some((w) => w.includes('evento desconocido'))).toBe(true)
    const ctxEmit = adapter.emit
    const engineSession = adapter.session
    await speech.discard()
    expect(engineSession).toBeTruthy()
    ctxEmit('final', { id: 'z', text: 'tarde' })
  })
})

describe('finalización en 6 pasos (§2.3) y descarte', () => {
  it('conversación: captura detenida → processing (sin descartar) → completed sin provisional → espera a close() → onComplete(toJSON)', async () => {
    const onComplete = vi.fn()
    const { speech, said } = setup({ onComplete }, { latency: 300 })
    await speech.start({ mode: 'conversation' })
    env.level = 0.6
    await tick(600)
    expect(speech.state.transcript.partial).not.toBeNull()
    const track = env.tracks[0]
    const p = speech.finish()
    expect(speech.state.status).toBe('processing')
    expect(speech.state.capture).toBe('off')
    expect(track.readyState).toBe('ended')
    await expect(speech.discard()).resolves.toBe(false)
    await expect(speech.close()).resolves.toBe(false)
    await tick(500)
    await expect(p).resolves.toBe(true)
    expect(speech.state.status).toBe('completed')
    expect(speech.state.transcript.partial).toBeNull()
    expect(speech.state.result).toEqual({ audioDeleted: true })
    await tick(5000)
    expect(speech.state.status).toBe('completed') // la conversación no se cierra sola
    await expect(speech.close()).resolves.toBe(true)
    expect(speech.state.status).toBe('idle')
    const json = onComplete.mock.calls[0][0]
    expect(json).not.toHaveProperty('partial')
    expect(json.segments).toHaveLength(1)
    expect(json).toMatchObject({ mode: 'conversation', derived: [] })
    await tick(400)
    const texts = said.map((s) => s.text)
    expect(texts).toContain('Procesando el audio pendiente.')
    expect(texts.some((x) => x.startsWith('Transcripción lista: 1 fragmentos'))).toBe(true)
    expect(texts.at(-1)).toBe('Sesión cerrada.')
  })

  it('finish rechazada → error processing-failed (recuperable); «Finalizar» vuelve a intentarlo', async () => {
    const { speech, adapter } = setup()
    await speech.start({ mode: 'conversation' })
    await tick(300)
    adapter.failFinish('processing-failed')
    let p = speech.finish()
    await tick(2000)
    await expect(p).resolves.toBe(false)
    expect(speech.state.status).toBe('error')
    expect(speech.state.error).toMatchObject({ kind: 'processing-failed', capture: 'stopped', audio: 'kept', recoverable: true })
    adapter.failFinish(null)
    p = speech.finish()
    await tick(2000)
    await expect(p).resolves.toBe(true)
    expect(speech.state.status).toBe('completed')
  })

  it('audioDeleted no confirmado: resultado false, aviso de desarrollo y anuncio de descarte sin afirmar la eliminación', async () => {
    const onDiscard = vi.fn()
    const { speech, adapter, said } = setup({ onDiscard })
    adapter.confirmDeletion(false)
    await speech.start({ mode: 'conversation' })
    await tick(2000)
    await expect(speech.discard()).resolves.toBe(true)
    expect(speech.state.status).toBe('idle')
    expect(speech.state.result).toEqual({ audioDeleted: false })
    expect(onDiscard).toHaveBeenCalledWith({ audioDeleted: false })
    expect(warnings().some((w) => w.includes('no confirmó la eliminación'))).toBe(true)
    await tick(1000)
    expect(said.at(-1).text).toBe('Grabación descartada. El motor no confirmó la eliminación del audio.')
    adapter.confirmDeletion(true)
    await speech.start({ mode: 'conversation' })
    await speech.discard()
    await tick(1000)
    expect(said.at(-1).text).toBe('Grabación descartada.')
  })

  it('cancel() desde ready y requesting vuelve a idle; discard() con la captura viva detiene la pista primero', async () => {
    const { speech } = setup()
    await speech.prepare()
    await expect(speech.cancel()).resolves.toBe(true)
    expect(speech.state.status).toBe('idle')
    await speech.start({ mode: 'conversation' })
    const track = env.tracks[0]
    const p = speech.discard()
    expect(speech.state.status).toBe('idle')
    expect(track.readyState).toBe('ended')
    await p
  })

  it('transiciones ilegales: el método devuelve false, el estado no cambia y el aviso nombra los dos estados', async () => {
    const { speech } = setup()
    await expect(speech.pause()).resolves.toBe(false)
    await speech.start({ mode: 'conversation' })
    const st = speech.state.status
    await expect(speech.close()).resolves.toBe(false)
    await expect(speech.begin()).resolves.toBe(false)
    await expect(speech.cancel()).resolves.toBe(false)
    expect(speech.state.status).toBe(st)
    expect(warnings().some((w) => w.includes(`transición no válida: ${st} → idle`))).toBe(true)
    expect(warnings().some((w) => w.includes(`transición no válida: ${st} → requesting`))).toBe(true)
  })
})

describe('opciones (§1.1) y avisos (§15)', () => {
  it('hotkey: F6 se rechaza, F8 se acepta con aviso, false desactiva; position y opciones desconocidas avisan', () => {
    const { speech, api } = setup()
    speech.configure({ hotkey: 'F6' })
    expect(api.opts.hotkey).toBe('Shift+F8')
    speech.configure({ hotkey: 'F8' })
    expect(api.opts.hotkey).toBe('F8')
    speech.configure({ hotkey: false })
    expect(api.opts.hotkey).toBe(false)
    speech.configure({ position: 'middle', otra: 1, expectedSpeakers: 3, offset: { top: 56 }, labels: { region: 'Voz' } })
    expect(api.opts.position).toBe('top-center')
    expect(api.opts.offset).toEqual({ top: 56 })
    expect(api.opts.labels.region).toBe('Voz')
    expect(api.opts.labels.actions).toEqual(LABELS.actions) // fusión superficial por clave
    const w = warnings().join('\n')
    expect(w).toContain('«F6»')
    expect(w).toContain('«F8» es el atajo de los avisos')
    expect(w).toContain('position «middle»')
    expect(w).toContain('opción desconocida «otra»')
    expect(w).toContain('expectedSpeakers «3»')
  })

  it('adapter cambiado fuera de idle: aviso y se ignora', async () => {
    const { speech, adapter, api } = setup()
    await speech.start({ mode: 'conversation' })
    speech.configure({ adapter: createSimulatedSpeechAdapter() })
    expect(api.opts.adapter).toBe(adapter)
    expect(warnings().some((w) => w.includes('adapter cambiado con una sesión abierta'))).toBe(true)
  })

  it('una label función recibe solo count y su resultado pasa por fill: completedConversation puede usar {time} (#237)', async () => {
    const fn = vi.fn((n) => (n === 1 ? 'Lista: 1 fragmento en {time} ({count}).' : `Lista: ${n} fragmentos en {time}.`))
    const { speech, said } = setup({ labels: { ...LABELS, announce: { ...LABELS.announce, completedConversation: fn } } }, { latency: 300 })
    await speech.start({ mode: 'conversation' })
    env.level = 0.6
    await tick(600)
    const p = speech.finish()
    await tick(500)
    await expect(p).resolves.toBe(true)
    await tick(3000)
    expect(fn).toHaveBeenCalledWith(1)
    expect(fn.mock.calls.every((c) => c.length === 1)).toBe(true)
    const done = said.map((s) => s.text).find((x) => x.startsWith('Lista:'))
    expect(done).toMatch(/^Lista: 1 fragmento en \d+:\d{2} \(1\)\.$/)
    expect(done).toContain(formatTime(speech.state.duration))
  })

  it('falta un texto: aviso la primera vez que se necesita y el texto queda vacío', async () => {
    const adapter = createSimulatedSpeechAdapter()
    const speech = createSpeech({ adapter, labels: {} })
    speech[INTERNAL].attachHost({ id: 'h', write() {}, focusPill() {} })
    managers.push(speech)
    await speech.start({ mode: 'conversation' })
    await tick(400)
    expect(warnings().filter((w) => w.includes('falta labels.announce.startConversation'))).toHaveLength(1)
  })

  it('wakeLock solo durante la captura de una conversación (y se libera al pausar); guardUnload con sesión', async () => {
    const { speech } = setup()
    field()
    await speech.start({ mode: 'dictation', target: { id: 'obs', label: 'O' } })
    expect(navigator.wakeLock.request).not.toHaveBeenCalled()
    let ev = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(true)
    await speech.discard()
    ev = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(ev)
    expect(ev.defaultPrevented).toBe(false)
    await speech.start({ mode: 'conversation' })
    await tick(0)
    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen')
    await speech.pause()
    await tick(0)
    expect(env.wakeLocks[0].released).toBe(true)
  })

  it('nada transcrito llega a los canales ni a los avisos de desarrollo', async () => {
    const { speech, said, adapter } = setup({}, { latency: 100, script: { conversation: [{ speaker: 'A', text: 'Dato confidencial.' }] } })
    await speech.start({ mode: 'conversation' })
    env.level = 0.6
    await tick(800)
    env.level = 0.01
    await tick(800)
    adapter.storageFull()
    const p = speech.finish()
    await tick(3000)
    await p
    const all = said.map((s) => s.text).join(' ') + warnings().join(' ')
    expect(all).not.toMatch(/confidencial/i)
  })
})
