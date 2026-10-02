// Captura de voz · gestor de la aplicación (dueño: bruno)
// Contrato: design/contracts/speech.md (Fase 1) · Patrón: docs/contract/api.md («Servicios imperativos») · DECISIONS.md #207 a #229.
// Estado puro y métodos: importar este módulo y llamar a createSpeech no toca document, window, navigator, matchMedia ni
// AudioContext (SSR). La captura, los temporizadores y las escuchas de sesión existen solo con un GSpeechHost montado para
// este gestor y una sesión iniciada; sin anfitrión no se abre el micrófono (#212), también en producción.
import { hasInjectionContext, inject, markRaw, reactive, readonly } from 'vue'
import { fill } from '../../utils/template.js'
import { POSITIONS, parseHotkey } from '../GToast/toaster.js'
import { closeAudio, mapCaptureError, openCapture, primeAudio } from './capture.js'

// Constantes de comportamiento (speech.md §3.7; no son tema). Valores del prototipo de kiwi: cambiarlas es de lima.
export const SPEECH_TIMING = Object.freeze({
  frameMs: 100,
  chunkMs: 300,
  watchdogMs: 1500,
  watchdogTickMs: 250,
  flatMs: 2500,
  voiceThreshold: 0.12,
  voiceHoldMs: 450,
  announceGroupMs: 300,
  insertAnnounceMs: 2500,
  autoCloseMs: 1500,
  reducedMotionHz: 4,
  levelMinDb: -60,
  levelMaxDb: -10
})
// Separación entre dos anuncios corteses de la cola (la del prototipo de kiwi; no figura en §3.7: pendiente de lima)
export const POLITE_GAP_MS = 900

export const STATUSES = Object.freeze(['idle', 'requesting', 'ready', 'listening', 'speech', 'transcribing', 'paused', 'processing', 'reconnecting', 'denied', 'unavailable', 'error', 'completed'])
const CAPTURE = ['listening', 'speech', 'transcribing']
export const isCapturing = (s) => CAPTURE.includes(s)
export const isProblem = (s) => s === 'denied' || s === 'unavailable' || s === 'error'

// Transiciones legales (speech.md §2.2). Quedarse en el mismo estado no es transición.
export const TRANSITIONS = Object.freeze({
  idle: ['requesting', 'ready', 'denied', 'error'],
  requesting: [...CAPTURE, 'denied', 'unavailable', 'error', 'idle'],
  ready: ['requesting', 'denied', 'unavailable', 'error', 'idle'],
  listening: ['speech', 'transcribing', 'paused', 'processing', 'reconnecting', 'denied', 'unavailable', 'error', 'idle'],
  speech: ['listening', 'transcribing', 'paused', 'processing', 'reconnecting', 'denied', 'unavailable', 'error', 'idle'],
  transcribing: ['listening', 'speech', 'paused', 'processing', 'reconnecting', 'denied', 'unavailable', 'error', 'idle'],
  paused: ['requesting', 'processing', 'reconnecting', 'error', 'idle'],
  processing: ['completed', 'error'],
  reconnecting: [...CAPTURE, 'paused', 'processing', 'denied', 'unavailable', 'error', 'idle'],
  denied: ['requesting', 'ready', 'processing', 'idle'],
  unavailable: ['requesting', 'processing', 'idle'],
  error: ['requesting', 'processing', 'idle'],
  completed: ['idle']
})

// Icono Lucide de cada estado (speech.md §2.1); `circle` va relleno
export const STATE_ICON = Object.freeze({
  idle: 'mic', requesting: 'shield-question-mark', ready: 'mic', listening: 'circle', speech: 'audio-lines', transcribing: 'captions',
  paused: 'circle-pause', processing: 'loader-circle', reconnecting: 'refresh-cw', denied: 'mic-off', unavailable: 'unplug',
  error: 'circle-alert', completed: 'circle-check'
})
export const FILLED = Object.freeze(['listening'])

export const ERROR_KINDS = Object.freeze(['permission-denied', 'no-device', 'device-busy', 'device-disconnected', 'interrupted', 'service-unavailable', 'processing-failed', 'storage-full', 'remote-not-allowed', 'unsupported'])
// Estado y recuperabilidad por tipo de error (speech.md §4.5)
const KIND_STATUS = { 'permission-denied': 'denied', 'no-device': 'unavailable', 'device-busy': 'unavailable', 'device-disconnected': 'unavailable', unsupported: 'unavailable' }
const RECOVERABLE = { unsupported: false, 'remote-not-allowed': false }
const CAPTURE_FATE = ['continues', 'paused', 'stopped', 'none']
const AUDIO_FATE = ['none', 'processing', 'kept', 'lost']

const LOCATIONS = ['device', 'local', 'remote']
const STORES = ['none', 'memory', 'disk']
const EXPECTED = [1, 2, 'many']
const OPTION_KEYS = ['adapter', 'allowRemote', 'requireConsent', 'language', 'expectedSpeakers', 'hotkey', 'position', 'offset', 'guardUnload', 'wakeLock', 'labels', 'onComplete', 'onDiscard', 'onError']
const BOOLEAN_OPTIONS = ['allowRemote', 'requireConsent', 'guardUnload', 'wakeLock']
const CALLBACKS = ['onComplete', 'onDiscard', 'onError']
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// Clave de inyección (InjectionKey) y acceso interno de las piezas al gestor (no es API pública)
export const speechKey = Symbol('GSpeech')
export const INTERNAL = Symbol('GSpeech.internal')

const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const PREFIX = '[Grana Speech]'
const isClient = () => typeof window !== 'undefined' && typeof document !== 'undefined'
const now = () => Date.now()

// mm:ss (h:mm:ss desde una hora)
export function formatTime(ms) {
  const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

const validOffset = (v) => v === undefined || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && v.trim() !== '')

/** Capacidades del adaptador normalizadas (speech.md §4.2); null si no son válidas. */
export function normalizeCapabilities(c) {
  if (!c || typeof c !== 'object') return null
  if (!LOCATIONS.includes(c.location)) return null
  const i = c.input
  if (!i || typeof i !== 'object') return null
  let input
  if (i.format === 'pcm') {
    if (!(typeof i.sampleRate === 'number' && i.sampleRate > 0)) return null
    if (i.channels !== undefined && i.channels !== 1) return null
    if (i.sampleFormat !== undefined && i.sampleFormat !== 'f32' && i.sampleFormat !== 's16') return null
    if (i.chunkMs !== undefined && !(typeof i.chunkMs === 'number' && i.chunkMs > 0)) return null
    input = { format: 'pcm', sampleRate: i.sampleRate, channels: 1, sampleFormat: i.sampleFormat || 'f32', chunkMs: i.chunkMs || SPEECH_TIMING.chunkMs }
  } else if (i.format === 'encoded') {
    if (!Array.isArray(i.mimeTypes) || !i.mimeTypes.length || i.mimeTypes.some((t) => typeof t !== 'string' || !t)) return null
    if (!(typeof i.timeslice === 'number' && i.timeslice > 0)) return null
    input = { format: 'encoded', mimeTypes: [...i.mimeTypes], timeslice: i.timeslice }
  } else if (i.format === 'self') input = { format: 'self' }
  else return null
  for (const k of ['partials', 'vad', 'diarization', 'offlineBuffer']) if (c[k] !== undefined && typeof c[k] !== 'boolean') return null
  if (c.storesAudio !== undefined && !STORES.includes(c.storesAudio)) return null
  if (c.maxSpeakers !== undefined && !(Number.isInteger(c.maxSpeakers) && c.maxSpeakers > 0)) return null
  return Object.freeze({
    location: c.location,
    input: Object.freeze(input),
    partials: Boolean(c.partials),
    vad: Boolean(c.vad),
    diarization: Boolean(c.diarization),
    ...(c.maxSpeakers !== undefined ? { maxSpeakers: c.maxSpeakers } : {}),
    offlineBuffer: Boolean(c.offlineBuffer),
    storesAudio: c.storesAudio || 'none'
  })
}

function createTranscript(mode, expectedSpeakers, seq) {
  return {
    id: `speech-${now().toString(36)}-${seq}`,
    mode,
    createdAt: new Date().toISOString(),
    expectedSpeakers,
    speakers: [],
    segments: [],
    partial: null,
    derived: [],
    // Copia sin `partial` (speech.md §1.4)
    toJSON() {
      return {
        id: this.id,
        mode: this.mode,
        createdAt: this.createdAt,
        expectedSpeakers: this.expectedSpeakers,
        speakers: this.speakers.map((s) => ({ id: s.id })),
        segments: this.segments.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1, literal: s.literal, engineSpeaker: s.engineSpeaker, corrected: s.corrected, speaker: s.speaker, removed: s.removed, failed: s.failed })),
        derived: [...this.derived]
      }
    }
  }
}

export function createSpeech(options = {}) {
  const warned = new Set()
  const warn = (msg) => {
    if (isDev() && !warned.has(msg)) {
      warned.add(msg)
      console.warn(`${PREFIX} ${msg}`)
    }
  }

  // ---------- Opciones ----------
  const opts = reactive({
    adapter: null,
    allowRemote: false,
    requireConsent: false,
    language: undefined,
    expectedSpeakers: 'many',
    hotkey: 'Shift+F8',
    hotkeyKeys: parseHotkey('Shift+F8').keys,
    position: 'top-center',
    offset: {},
    guardUnload: true,
    wakeLock: true,
    labels: {},
    onComplete: undefined,
    onDiscard: undefined,
    onError: undefined
  })

  const state = reactive({
    status: 'idle',
    sessionId: null,
    mode: null,
    target: null,
    permission: 'unknown',
    capture: 'off',
    voice: 'silence',
    signal: 'ok',
    duration: 0,
    pending: 0,
    engine: 'ok',
    attempt: 0,
    error: null,
    issues: [],
    transcript: null,
    result: null,
    consent: false,
    expectedSpeakers: 'many',
    panelOpen: false,
    activityHidden: false
  })

  // Estado interno de las piezas (anfitrión, pill, disparadores): no es API
  const ui = reactive({
    hostAttached: false,
    hostId: null,
    pillAttached: false,
    pillEl: null,
    confirmDiscard: false,
    consentError: false,
    procTotal: 0,
    notInserted: [], // ids de fragmentos del dictado sin insertar (en orden)
    undo: {}, // id de campo → true si hay registro de deshacer válido
    retrying: [], // ids de fragmentos fallidos con reintento en curso
    opener: null,
    returnFocus: true,
    starter: null,
    reducedMotion: false
  })

  function applyOptions(patch, initial) {
    if (!patch || typeof patch !== 'object') return
    for (const key of Object.keys(patch)) {
      const v = patch[key]
      if (!OPTION_KEYS.includes(key)) { warn(`opción desconocida «${key}»: se ignora.`); continue }
      if (key === 'adapter') {
        if (!initial && state.status !== 'idle') { warn('adapter cambiado con una sesión abierta: se ignora (solo se cambia en idle).'); continue }
        if (!v || typeof v !== 'object' || typeof v.open !== 'function' || !v.capabilities) { warn('adapter necesita open() y capabilities (speech.md §4): ningún método iniciará sesión.'); opts.adapter = null; continue }
        opts.adapter = markRaw(v)
      } else if (BOOLEAN_OPTIONS.includes(key)) {
        if (typeof v === 'boolean') opts[key] = v
        else warn(`${key} debe ser Boolean: se conserva ${opts[key]}.`)
      } else if (key === 'language') {
        if (v === undefined || (typeof v === 'string' && v.trim())) opts.language = v
        else warn('language debe ser una etiqueta BCP 47 (p. ej. «es»): se conserva.')
      } else if (key === 'expectedSpeakers') {
        if (EXPECTED.includes(v)) opts.expectedSpeakers = v
        else warn(`expectedSpeakers «${v}» no es válido (1, 2, 'many'): se conserva «${opts.expectedSpeakers}».`)
      } else if (key === 'hotkey') {
        const parsed = parseHotkey(v)
        const bare = parsed.keys && !Object.values(parsed.keys.mods).some(Boolean)
        if (!parsed.ok) warn(`hotkey «${v}» no se puede interpretar (sintaxis de aria-keyshortcuts, p. ej. «Shift+F8»): se conserva.`)
        else if (bare && parsed.keys.key === 'F6') warn('hotkey «F6» lo usa el navegador para moverse entre la página y sus barras: se conserva el anterior.')
        else {
          if (bare && parsed.keys.key === 'F8') warn('hotkey «F8» es el atajo de los avisos (GToaster): se acepta, pero los dos servicios chocarán.')
          opts.hotkey = parsed.value
          opts.hotkeyKeys = parsed.keys
        }
      } else if (key === 'position') {
        if (POSITIONS.includes(v)) opts.position = v
        else warn(`position «${v}» no es válida (${POSITIONS.join(', ')}): se conserva «${opts.position}».`)
      } else if (key === 'offset') {
        if (!v || typeof v !== 'object' || !validOffset(v.top) || !validOffset(v.bottom)) warn('offset debe ser { top?, bottom? } con números (px) o longitudes CSS: se conserva.')
        else opts.offset = initial ? { ...v } : { ...opts.offset, ...v }
      } else if (key === 'labels') {
        if (!v || typeof v !== 'object') warn('labels debe ser un objeto: se conserva.')
        else opts.labels = initial ? { ...v } : { ...opts.labels, ...v }
      } else if (CALLBACKS.includes(key)) {
        if (v === undefined || typeof v === 'function') opts[key] = v
        else warn(`${key} debe ser una función: se ignora.`)
      }
    }
  }
  applyOptions(options, true)
  if (!('adapter' in (options || {}))) warn('createSpeech sin adapter: ningún método iniciará sesión (la aplicación aporta el motor, speech.md §4).')

  // ---------- Textos (sin valores por defecto; aviso la primera vez que falta uno, §9) ----------
  function raw(path) {
    let v = opts.labels
    for (const p of path.split('.')) {
      if (v === null || v === undefined || typeof v !== 'object') return undefined
      v = v[p]
    }
    return v
  }
  function t(path, vars, { optional = false } = {}) {
    const v = raw(path)
    if (typeof v === 'function') {
      try { return String(v(vars && vars.count) ?? '') } catch { return '' }
    }
    if (typeof v === 'string') return fill(v, vars)
    if (!optional) warn(`falta labels.${path}: el texto queda vacío.`)
    return ''
  }

  // ---------- Sesión (no reactiva) ----------
  let session = null
  let seq = 0
  let host = null
  const levels = new Set()
  let lastFrame = 0
  let voiceUntil = 0
  let flatSince = null
  let watchdog = null
  let wake = null
  let chunkVoice = false
  let autoClose = null
  let inserting = false
  const undoLogs = {} // id de campo → registro de inserciones del último dictado

  const captured = () => state.duration > 0 || Boolean(state.transcript && state.transcript.segments.length)
  const isLive = () => state.capture === 'live'
  const caps = () => (session && session.caps) || normalizeCapabilities(opts.adapter && opts.adapter.capabilities)

  // ---------- Anuncios (§10): cola cortés con separación, cambios de estado agrupados, enérgico que vacía la cola ----------
  const ann = { queue: [], busy: false, gap: null, timers: {} }
  const write = (text, politeness) => { if (host && text) host.write(text, politeness) }
  function pump() {
    if (ann.busy || !ann.queue.length) return
    ann.busy = true
    write(ann.queue.shift(), 'polite')
    ann.gap = setTimeout(() => { ann.busy = false; pump() }, POLITE_GAP_MS)
  }
  function polite(text) {
    if (!text || !host) return
    if (ann.queue[ann.queue.length - 1] === text) return
    ann.queue.push(text)
    pump()
  }
  function assertive(text) {
    if (!text) return
    ann.queue = []
    for (const k of Object.keys(ann.timers)) clearTimeout(ann.timers[k])
    write(text, 'assertive')
  }
  function later(key, text, ms) {
    clearTimeout(ann.timers[key])
    if (!text) return
    ann.timers[key] = setTimeout(() => polite(text), ms)
  }
  const cancelLater = (key) => clearTimeout(ann.timers[key])
  function resetAnnouncer() {
    clearTimeout(ann.gap)
    for (const k of Object.keys(ann.timers)) clearTimeout(ann.timers[k])
    ann.queue = []
    ann.busy = false
  }

  // Texto compuesto de un error: «title. what capture.<c> audioFate.<a> [kept] fix» (§9.3)
  function composeError(e) {
    if (!e) return { title: '', text: '' }
    const vars = { at: formatTime(e.at), range: e.segment ? `${formatTime(e.segment.t0)}–${formatTime(e.segment.t1)}` : '' }
    const title = t(`errors.${e.kind}.title`, vars)
    const parts = [
      t(`errors.${e.kind}.what`, vars),
      e.capture ? t(`capture.${e.capture}`) : '',
      e.audio && e.audio !== 'none' ? t(`audioFate.${e.audio}`) : '',
      state.transcript && state.transcript.segments.some((s) => !s.failed) ? t('kept') : '',
      t(`errors.${e.kind}.fix`, vars, { optional: true })
    ].filter(Boolean)
    return { title, text: parts.join(' ') }
  }
  const sentence = (s) => (!s || /[.!?…]$/.test(s) ? s : `${s}.`)

  function announceTransition(prev, next, why) {
    if (isCapturing(prev) && isCapturing(next)) return // escuchando ⇄ voz ⇄ transcribiendo: nunca
    if (isProblem(next)) {
      const { title, text } = composeError(state.error)
      assertive([sentence(title), text].filter(Boolean).join(' '))
      return
    }
    let text = ''
    const target = state.target ? state.target.label : ''
    switch (next) {
      case 'requesting': if (state.permission === 'prompt') text = t('announce.requesting'); break
      case 'ready': text = t('announce.ready'); break
      case 'listening': case 'speech': case 'transcribing':
        text = prev === 'reconnecting' ? t('announce.restored')
          : why === 'resume' ? t('announce.resumed')
            : state.mode === 'dictation' ? t('announce.startDictation', { target }) : t('announce.startConversation')
        break
      case 'paused': text = why === 'restored-held' ? t('announce.restoredHeld') : t('announce.paused'); break
      case 'processing': text = t('announce.processing'); break
      case 'reconnecting': text = isLive() ? t('announce.reconnecting') : t('announce.reconnectingHeld'); break
      case 'completed': {
        cancelLater('insert')
        if (state.mode === 'dictation') text = t('announce.completedDictation', { target })
        else {
          const count = state.transcript ? state.transcript.segments.filter((s) => !s.failed).length : 0
          text = t('announce.completedConversation', { count, time: formatTime(state.duration) })
        }
        break
      }
      case 'idle': text = why === 'close' ? t('announce.closed') : ''; break
    }
    // Agrupados: gana el último cambio (uno sin texto también cancela el anterior pendiente)
    later('state', text, SPEECH_TIMING.announceGroupMs)
  }

  // ---------- Máquina de estados ----------
  function go(next, why) {
    const prev = state.status
    if (prev === next) return true
    if (!TRANSITIONS[prev] || !TRANSITIONS[prev].includes(next)) {
      warn(`transición no válida: ${prev} → ${next} (se rechaza).`)
      return false
    }
    state.status = next
    if (prev === 'idle') attachSessionListeners()
    if (next === 'idle') detachSessionListeners()
    announceTransition(prev, next, why)
    return true
  }
  const refuse = (next) => {
    warn(`transición no válida: ${state.status} → ${next} (se rechaza).`)
    return false
  }
  const liveStatus = () => (state.voice === 'speech' ? 'speech' : state.pending > 0 ? 'transcribing' : 'listening')
  function refreshLive() {
    if (isCapturing(state.status)) {
      const n = liveStatus()
      if (n !== state.status) go(n)
    }
  }

  // Sin anfitrión no hay micrófono (#212): también en producción. En el servidor, sin efectos.
  function canStart() {
    if (!isClient()) return false
    if (!opts.adapter) { warn('no hay adapter válido: no se inicia la sesión.'); return false }
    if (!ui.hostAttached) { warn('intento de iniciar sin un <GSpeechHost> montado para este gestor: no se abre el micrófono.'); return false }
    return true
  }

  function newSession(mode, target) {
    clearTimeout(autoClose)
    const adapter = opts.adapter
    const c = normalizeCapabilities(adapter.capabilities)
    const expected = mode === 'dictation' ? 1 : opts.expectedSpeakers
    session = {
      adapter,
      caps: c,
      allowRemote: opts.allowRemote,
      engine: null,
      finished: false,
      op: 0,
      seq: 0,
      audioT: 0,
      controller: typeof AbortController !== 'undefined' ? new AbortController() : null,
      flatAnnounced: false,
      selfWait: null,
      dict: null,
      permStatus: null
    }
    const tx = createTranscript(mode, expected, ++seq)
    Object.assign(state, {
      sessionId: tx.id, mode, target, capture: 'off', voice: 'silence', signal: 'ok', duration: 0, pending: 0, engine: 'ok',
      attempt: 0, error: null, issues: [], transcript: tx, result: null, consent: false, expectedSpeakers: expected, panelOpen: false
    })
    Object.assign(ui, { confirmDiscard: false, consentError: false, procTotal: 0, notInserted: [], retrying: [] })
    if (mode === 'dictation' && target) {
      const el = document.getElementById(target.id)
      session.dict = { pos: el ? el.selectionStart : null, selEnd: el ? el.selectionEnd : null, first: true, log: [] }
      delete undoLogs[target.id]
      delete ui.undo[target.id]
    }
    return session
  }
  // Fin de la sesión: estado limpio (la sesión ya pasó o va a pasar a idle)
  function endSession() {
    const s = session
    clearTimeout(autoClose)
    stopCapture()
    if (s && s.selfWait) { s.selfWait(false); s.selfWait = null }
    if (s && s.permStatus) { try { s.permStatus.onchange = null } catch { /* sin efecto */ } }
    session = null
    Object.assign(state, {
      sessionId: null, mode: null, target: null, capture: 'off', voice: 'silence', signal: 'ok', duration: 0, pending: 0,
      engine: 'ok', attempt: 0, error: null, issues: [], transcript: null, consent: false, panelOpen: false
    })
    Object.assign(ui, { confirmDiscard: false, consentError: false, procTotal: 0, notInserted: [], retrying: [] })
  }

  // Comprobaciones comunes al empezar: capacidades válidas y ubicación permitida, sin abrir el micrófono
  function preflight(s) {
    if (!s.caps) {
      warn(`el adaptador «${s.adapter.id ?? '?'}» declara capacidades no válidas (speech.md §4.2): la sesión pasa a error «unsupported» sin abrir el micrófono.`)
      fail('error', { kind: 'unsupported', capture: 'none', audio: 'none', recoverable: false })
      return false
    }
    if (s.caps.location === 'remote' && !s.allowRemote) {
      warn('el adaptador procesa fuera (location: \'remote\') y la aplicación no pasó allowRemote: true: no se abre el micrófono.')
      fail('error', { kind: 'remote-not-allowed', capture: 'none', audio: 'none', recoverable: false })
      return false
    }
    return true
  }

  // ---------- Permisos (§3.5) ----------
  async function queryPermission(s) {
    // Con input 'self' el adaptador captura (envoltorio nativo): el permiso del navegador no es de Grana
    if (s.caps && s.caps.input.format === 'self') return state.permission
    const perms = typeof navigator !== 'undefined' ? navigator.permissions : undefined
    if (!perms || typeof perms.query !== 'function') return state.permission
    try {
      const st = await perms.query({ name: 'microphone' })
      if (session !== s) return st.state
      state.permission = st.state
      if (!s.permStatus) {
        s.permStatus = st
        st.onchange = () => {
          if (session !== s) return
          state.permission = st.state
          if (st.state === 'denied' && isLive()) fail('denied', { kind: 'permission-denied', capture: 'stopped' })
        }
      }
      return st.state
    } catch {
      return state.permission
    }
  }

  // ---------- Errores (§4.5) ----------
  function fail(status, err) {
    const s = session
    const wasLive = isLive()
    stopCapture()
    state.capture = 'off'
    if (wasLive && s && s.engine) safe(() => s.engine.pause())
    const kind = ERROR_KINDS.includes(err.kind) ? err.kind : 'service-unavailable'
    const e = {
      kind,
      capture: CAPTURE_FATE.includes(err.capture) ? err.capture : wasLive ? 'stopped' : captured() ? 'paused' : 'none',
      audio: AUDIO_FATE.includes(err.audio) ? err.audio : state.pending > 0 ? 'processing' : 'none',
      recoverable: typeof err.recoverable === 'boolean' ? err.recoverable : RECOVERABLE[kind] ?? true,
      at: state.duration,
      ...(err.segment ? { segment: { id: err.segment.id, t0: err.segment.t0, t1: err.segment.t1 } } : {})
    }
    state.error = e
    let target = status
    if (state.status !== target && !TRANSITIONS[state.status].includes(target) && TRANSITIONS[state.status].includes('error')) target = 'error'
    if (s && s.selfWait) { s.selfWait(false); s.selfWait = null }
    const moved = go(target)
    callback('onError', { ...e, ...(e.segment ? { segment: { ...e.segment } } : {}) })
    return moved
  }
  function callback(name, arg) {
    const fn = opts[name]
    if (typeof fn !== 'function') return
    try { fn(arg) } catch (e) { console.error(e) }
  }
  function safe(fn) {
    try {
      const r = fn()
      if (r && typeof r.then === 'function') r.then(null, () => {})
    } catch { /* el adaptador falló: no rompe la captura */ }
  }
  const kindOf = (e, fallback) => (e && ERROR_KINDS.includes(e.kind) ? e.kind : fallback)

  // ---------- Captura (§3) ----------
  function emitLevel(level, live) {
    for (const cb of levels) {
      try { cb(level, live) } catch (e) { console.error(e) }
    }
  }
  function stopCapture() {
    clearInterval(watchdog)
    watchdog = null
    const s = session
    if (s && s.cap) {
      s.cap.stop()
      s.cap = null
    }
    if (state.capture === 'live') state.capture = 'off'
    if (state.voice !== 'silence') state.voice = 'silence'
    flatSince = null
    emitLevel(0, false)
    releaseWake()
  }
  function onFrame({ level, flat }) {
    if (!isLive()) return
    const tNow = now()
    lastFrame = tNow
    state.duration += SPEECH_TIMING.frameMs
    const c = session && session.caps
    if (c && !c.vad) {
      if (level > SPEECH_TIMING.voiceThreshold) voiceUntil = tNow + SPEECH_TIMING.voiceHoldMs
      const v = tNow < voiceUntil ? 'speech' : 'silence'
      if (state.voice !== v) state.voice = v
    }
    if (state.voice === 'speech') chunkVoice = true
    if (flat) {
      if (flatSince === null) flatSince = tNow
      if (tNow - flatSince > SPEECH_TIMING.flatMs && state.signal !== 'flat') {
        state.signal = 'flat'
        if (session && !session.flatAnnounced) {
          session.flatAnnounced = true
          polite(t('announce.signalFlat'))
        }
      }
    } else {
      flatSince = null
      if (state.signal === 'flat') state.signal = 'ok'
    }
    emitLevel(level, true)
    refreshLive()
  }
  function onChunk(c) {
    const s = session
    if (!s || !isLive()) return
    const t0 = s.audioT
    const t1 = typeof c.durationMs === 'number' ? t0 + c.durationMs : Math.max(t0, state.duration)
    s.audioT = t1
    const chunk = { seq: ++s.seq, t0, t1, format: c.format, ...(c.mimeType ? { mimeType: c.mimeType } : {}), data: c.data, voice: chunkVoice }
    chunkVoice = state.voice === 'speech'
    push(s, chunk)
  }
  function push(s, chunk) {
    const eng = s.engine
    if (!eng || typeof eng.push !== 'function') return
    const onFail = () => {
      if (session !== s) return
      warn('push del adaptador lanzó o rechazó: el tramo queda como fallo no fatal con el audio perdido (la captura sigue).')
      const last = state.issues[state.issues.length - 1]
      if (last && last.kind === 'processing-failed' && last.segmentId === null && last.t1 === chunk.t0) last.t1 = chunk.t1
      else state.issues.push({ kind: 'processing-failed', segmentId: null, t0: chunk.t0, t1: chunk.t1, audio: 'lost', retryable: false })
    }
    try {
      const r = eng.push(chunk)
      if (r && typeof r.then === 'function') r.then(null, onFail)
    } catch {
      onFail()
    }
  }
  function startWatchdog(s) {
    clearInterval(watchdog)
    lastFrame = now()
    watchdog = setInterval(() => {
      if (session !== s || !isLive()) return
      if (now() - lastFrame > SPEECH_TIMING.watchdogMs) {
        if (s.caps.input.format === 'self') warn('adaptador con input.format \'self\' sin eventos level: el vigilante interrumpe la captura.')
        fail('error', { kind: 'interrupted', capture: 'stopped' })
      }
    }, SPEECH_TIMING.watchdogTickMs)
  }
  function goLive(s, why, fresh) {
    state.capture = 'live'
    state.error = null
    state.signal = 'ok'
    flatSince = null
    chunkVoice = false
    voiceUntil = 0
    s.audioT = Math.max(s.audioT, state.duration)
    // Antes de volver a entregar trozos tras una pausa o un fallo (§4.3); con `self`, ya se llamó al pedir la captura
    if (!fresh && s.caps.input.format !== 'self' && s.engine && typeof s.engine.resume === 'function') safe(() => s.engine.resume())
    startWatchdog(s)
    go(liveStatus(), why)
    requestWake()
  }

  // Pide el micrófono (y el motor si hace falta) y pasa a captura. `primed`: AudioContext creado en el gesto.
  async function acquire(why, primed) {
    const s = session
    const op = ++s.op
    const mine = () => session === s && s.op === op
    const drop = () => closeAudio(primed)
    const perm = await queryPermission(s)
    if (!mine()) { drop(); return false }
    const capturedBefore = captured()
    if (perm === 'denied') {
      drop()
      if (!TRANSITIONS[state.status].includes('denied')) go('requesting')
      fail('denied', { kind: 'permission-denied', capture: capturedBefore ? 'stopped' : 'none' })
      return false
    }
    if (state.status !== 'requesting' && !go('requesting')) { drop(); return false }
    // Motor primero: si no abre, el micrófono no se abre (§4.1)
    const fresh = !s.engine
    s.fresh = fresh
    if (!s.engine) {
      try {
        const eng = await s.adapter.open({
          mode: state.mode,
          expectedSpeakers: state.expectedSpeakers,
          ...(opts.language ? { language: opts.language } : {}),
          signal: s.controller ? s.controller.signal : undefined,
          emit: (type, payload) => onEngine(s, type, payload)
        })
        if (!mine() || state.status !== 'requesting') {
          if (eng && typeof eng.abort === 'function') safe(() => eng.abort())
          drop()
          return false
        }
        if (!eng || typeof eng !== 'object') throw { kind: 'service-unavailable' }
        s.engine = markRaw(eng)
      } catch (e) {
        drop()
        if (!mine()) return false
        fail('error', { kind: kindOf(e, 'service-unavailable'), capture: capturedBefore ? 'stopped' : 'none', audio: e && e.audio })
        return false
      }
    } else if (state.engine !== 'ok' && typeof s.engine.reconnect === 'function') {
      try {
        await s.engine.reconnect()
        if (!mine()) { drop(); return false }
        state.engine = 'ok'
        state.attempt = 0
      } catch (e) {
        drop()
        if (!mine()) return false
        fail('error', { kind: kindOf(e, 'service-unavailable'), capture: capturedBefore ? 'stopped' : 'none', audio: e && e.audio })
        return false
      }
    }
    // Adaptador que captura por sí mismo: la sesión no pasa a captura hasta `capture { state: 'live' }` (§3.3)
    if (s.caps.input.format === 'self') {
      drop()
      if (!fresh && typeof s.engine.resume === 'function') safe(() => s.engine.resume())
      if (s.selfLive) {
        // El adaptador ya dijo `capture: live` mientras abría
        s.selfLive = false
        goLive(s, why, fresh)
        return true
      }
      let hint = null
      const result = await new Promise((resolve) => {
        s.selfWait = resolve
        if (isDev()) hint = setTimeout(() => { if (s.selfWait === resolve) warn('adaptador con input.format \'self\' sin capture { state: \'live\' }: la sesión no pasa a captura.') }, SPEECH_TIMING.watchdogMs * 2)
      })
      clearTimeout(hint)
      return result
    }
    let cap
    try {
      cap = await openCapture({
        ctx: primed,
        input: s.caps.input,
        frameMs: SPEECH_TIMING.frameMs,
        minDb: SPEECH_TIMING.levelMinDb,
        maxDb: SPEECH_TIMING.levelMaxDb,
        onFrame,
        onChunk,
        onEnded: () => { if (session === s) fail('unavailable', { kind: 'device-disconnected', capture: 'stopped' }) },
        onMuted: () => { if (session === s) fail('error', { kind: 'interrupted', capture: 'stopped' }) }
      })
    } catch (e) {
      if (!mine()) return false
      const [st, kind] = mapCaptureError(e)
      if (kind === 'permission-denied') state.permission = 'denied'
      fail(st, { kind, capture: capturedBefore ? 'stopped' : 'none' })
      return false
    }
    if (!mine() || state.status !== 'requesting') { cap.stop(); return false }
    s.cap = cap
    state.permission = 'granted'
    goLive(s, why, fresh)
    return true
  }

  // ---------- Pantalla encendida y salida (§3.6) ----------
  function requestWake() {
    if (!opts.wakeLock || state.mode !== 'conversation' || !isLive() || wake) return
    const wl = typeof navigator !== 'undefined' ? navigator.wakeLock : undefined
    if (!wl || typeof wl.request !== 'function') return
    wake = 'pending'
    wl.request('screen').then((lock) => {
      if (wake === 'pending' && isLive()) wake = lock
      else { wake = wake === 'pending' ? null : wake; lock.release().catch(() => {}) }
    }, () => { if (wake === 'pending') wake = null })
  }
  function releaseWake() {
    const w = wake
    wake = null
    if (w && w !== 'pending' && typeof w.release === 'function') w.release().catch(() => {})
  }
  const onVisibility = () => { if (document.visibilityState === 'visible') requestWake() }
  const onBeforeUnload = (event) => {
    if (!opts.guardUnload || state.status === 'idle') return
    event.preventDefault()
    event.returnValue = ''
  }
  let sessionListeners = false
  function attachSessionListeners() {
    if (sessionListeners || !isClient()) return
    sessionListeners = true
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibility)
  }
  function detachSessionListeners() {
    if (!sessionListeners) return
    sessionListeners = false
    window.removeEventListener('beforeunload', onBeforeUnload)
    document.removeEventListener('visibilitychange', onVisibility)
  }

  // ---------- Eventos del adaptador (§4.4) ----------
  function ensureSpeaker(tx, id) {
    if (id !== null && id !== undefined && id !== '' && !tx.speakers.some((s) => s.id === String(id))) tx.speakers.push({ id: String(id) })
  }
  function onEngine(s, type, p) {
    if (session !== s || s.finished) {
      warn(`evento «${type}» del adaptador después de finish/abort (o de otra sesión): se ignora.`)
      return
    }
    const tx = state.transcript
    p = p && typeof p === 'object' ? p : {}
    switch (type) {
      case 'partial': {
        if (p.id === undefined || p.id === null) return
        tx.partial = { id: String(p.id), text: String(p.text ?? ''), speaker: p.speaker === undefined || p.speaker === null ? null : String(p.speaker) }
        return
      }
      case 'final': {
        if (p.id === undefined || p.id === null) return
        const id = String(p.id)
        const speaker = p.speaker === undefined || p.speaker === null ? null : String(p.speaker)
        let seg = tx.segments.find((x) => x.id === id)
        if (seg && !seg.failed) {
          warn(`final repetido para el fragmento «${id}»: el literal confirmado no se sobrescribe.`)
          return
        }
        if (seg) {
          seg.literal = String(p.text ?? '')
          seg.engineSpeaker = speaker
          seg.failed = false
          state.issues = state.issues.filter((i) => i.segmentId !== id)
          ui.retrying = ui.retrying.filter((r) => r !== id)
        } else {
          seg = { id, t0: Number(p.t0) || 0, t1: Number(p.t1) || 0, literal: String(p.text ?? ''), engineSpeaker: speaker, corrected: null, speaker: null, removed: false, failed: false }
          let i = tx.segments.length
          while (i > 0 && tx.segments[i - 1].t0 > seg.t0) i--
          tx.segments.splice(i, 0, seg)
        }
        ensureSpeaker(tx, speaker)
        if (tx.partial && tx.partial.id === id) tx.partial = null
        if (state.mode === 'dictation') insertDictation(tx.segments.find((x) => x.id === id))
        refreshLive()
        return
      }
      case 'pending': {
        const n = Math.max(0, Math.floor(Number(p.count) || 0))
        state.pending = n
        if (state.status === 'processing') ui.procTotal = Math.max(ui.procTotal, n)
        refreshLive()
        return
      }
      case 'voice': {
        if (!s.caps.vad || !isLive()) return
        state.voice = p.speech ? 'speech' : 'silence'
        if (p.speech) chunkVoice = true
        refreshLive()
        return
      }
      case 'connection': {
        if (p.state === 'lost') {
          state.engine = 'lost'
          state.attempt = 0
          if (!s.caps.offlineBuffer && isLive()) {
            stopCapture()
            safe(() => s.engine && s.engine.pause())
            state.capture = 'held'
          }
          if (isCapturing(state.status) || state.status === 'paused') go('reconnecting')
        } else if (p.state === 'retrying') {
          state.engine = 'retrying'
          if (p.attempt !== undefined) state.attempt = Number(p.attempt) || 0
        } else if (p.state === 'restored') {
          state.engine = 'ok'
          state.attempt = 0
          if (state.status === 'reconnecting') {
            if (isLive()) go(liveStatus())
            else {
              state.capture = 'off'
              go('paused', 'restored-held')
            }
          } else if (state.capture === 'held') state.capture = 'off'
        }
        return
      }
      case 'error': {
        const kind = ERROR_KINDS.includes(p.kind) ? p.kind : 'processing-failed'
        if (!p.fatal) {
          const seg = p.segment && p.segment.id !== undefined ? { id: String(p.segment.id), t0: Number(p.segment.t0) || 0, t1: Number(p.segment.t1) || 0 } : null
          if (seg && !tx.segments.some((x) => x.id === seg.id)) {
            let i = tx.segments.length
            while (i > 0 && tx.segments[i - 1].t0 > seg.t0) i--
            tx.segments.splice(i, 0, { ...seg, literal: '', engineSpeaker: null, corrected: null, speaker: null, removed: false, failed: true })
          } else if (seg) {
            const x = tx.segments.find((y) => y.id === seg.id)
            if (x.failed || !x.literal) x.failed = true
          }
          if (seg && tx.partial && tx.partial.id === seg.id) tx.partial = null
          if (seg) ui.retrying = ui.retrying.filter((r) => r !== seg.id)
          const issue = {
            kind,
            segmentId: seg ? seg.id : null,
            t0: seg ? seg.t0 : state.duration,
            t1: seg ? seg.t1 : state.duration,
            audio: AUDIO_FATE.includes(p.audio) ? p.audio : 'lost',
            retryable: Boolean(p.retryable) && Boolean(seg) && typeof s.engine.retrySegment === 'function'
          }
          state.issues = [...state.issues.filter((i) => !(seg && i.segmentId === seg.id)), issue]
          polite(t('announce.segmentFailed'))
          callback('onError', { ...issue })
          return
        }
        if (kind === 'service-unavailable') state.engine = 'lost'
        fail(KIND_STATUS[kind] || 'error', { kind, capture: isLive() ? 'stopped' : captured() ? 'paused' : 'none', audio: p.audio, ...(p.segment ? { segment: p.segment } : {}) })
        return
      }
      case 'speakers':
        return // reservado para la Fase 2 (se ignora sin aviso)
      case 'level': {
        if (s.caps.input.format !== 'self') return
        const v = Math.max(0, Math.min(1, Number(p.value) || 0))
        onFrame({ level: v, flat: Number(p.value) === 0 })
        return
      }
      case 'capture': {
        if (s.caps.input.format !== 'self') return
        if (p.state === 'live') {
          if (state.status === 'requesting' && s.selfWait) {
            const done = s.selfWait
            s.selfWait = null
            goLive(s, s.lastWhy, s.fresh)
            done(true)
          } else if (state.status === 'requesting') s.selfLive = true
        } else if (p.state === 'ended') fail('unavailable', { kind: 'device-disconnected', capture: 'stopped' })
        else if (p.state === 'muted') fail('error', { kind: 'interrupted', capture: 'stopped' })
        return
      }
      default:
        warn(`evento desconocido del adaptador «${type}»: se ignora.`)
    }
  }

  // ---------- Dictado al cursor con deshacer propio (§8.3 a §8.5) ----------
  function dispatchInput(el) {
    inserting = true
    try { el.dispatchEvent(new Event('input', { bubbles: true })) } finally { inserting = false }
  }
  function doInsert(el, text, { atEnd = false } = {}) {
    const d = session.dict
    const focused = document.activeElement === el
    const len = el.value.length
    let start
    let end
    if (focused) {
      start = el.selectionStart ?? len
      end = el.selectionEnd ?? start
    } else if (atEnd) {
      start = len
      end = len
    } else {
      start = Math.min(d.pos ?? len, len)
      end = d.first ? Math.max(start, Math.min(d.selEnd ?? start, len)) : start
    }
    const before = el.value.slice(0, start)
    const ins = (before && !/\s$/.test(before) ? ' ' : '') + text
    const replaced = el.value.slice(start, end)
    el.setRangeText(ins, start, end, focused ? 'end' : 'preserve')
    dispatchInput(el)
    d.pos = start + ins.length
    d.first = false
    d.log.push({ start, ins, replaced })
    undoLogs[el.id] = d.log
    ui.undo[el.id] = true
    ensureUndoListener()
    later('insert', t('announce.inserted', { target: state.target ? state.target.label : '' }), SPEECH_TIMING.insertAnnounceMs)
  }
  function insertDictation(seg) {
    if (!seg || seg.failed || !state.target || !session || !session.dict) return
    const el = document.getElementById(state.target.id)
    // Campo desmontado: no se inserta a ciegas y todos los siguientes esperan, para conservar el orden (§8.4)
    if (!el || !el.isConnected || ui.notInserted.length) {
      ui.notInserted.push(seg.id)
      return
    }
    doInsert(el, seg.literal)
  }
  function scheduleAutoClose() {
    clearTimeout(autoClose)
    const s = session
    autoClose = setTimeout(() => { if (session === s && state.status === 'completed' && !ui.notInserted.length) close('auto') }, SPEECH_TIMING.autoCloseMs)
  }
  let undoListener = false
  function onDocInput(event) {
    if (inserting) return
    const id = event.target && event.target.id
    if (id && undoLogs[id]) {
      delete undoLogs[id]
      delete ui.undo[id]
      if (!Object.keys(undoLogs).length) removeUndoListener()
    }
  }
  function ensureUndoListener() {
    if (undoListener || !isClient() || !ui.hostAttached) return
    undoListener = true
    document.addEventListener('input', onDocInput, true)
  }
  function removeUndoListener() {
    if (!undoListener) return
    undoListener = false
    document.removeEventListener('input', onDocInput, true)
  }
  function forgetUndo(id) {
    delete undoLogs[id]
    delete ui.undo[id]
    if (!Object.keys(undoLogs).length) removeUndoListener()
  }

  // ---------- API pública ----------
  async function prepare(o = {}) {
    if (!canStart()) return false
    if (state.status !== 'idle' || session) return refuse('ready')
    const s = newSession('conversation', null)
    if (o && o.expectedSpeakers !== undefined) {
      if (EXPECTED.includes(o.expectedSpeakers)) state.expectedSpeakers = o.expectedSpeakers
      else warn(`expectedSpeakers «${o.expectedSpeakers}» no es válido (1, 2, 'many'): se usa «${state.expectedSpeakers}».`)
    }
    if (!preflight(s)) return false
    const op = ++s.op
    const perm = await queryPermission(s)
    if (session !== s || s.op !== op) return false
    if (perm === 'denied') {
      fail('denied', { kind: 'permission-denied', capture: 'none' })
      return false
    }
    if (typeof s.adapter.check === 'function') {
      try {
        await s.adapter.check()
      } catch (e) {
        if (session !== s || s.op !== op) return false
        fail('error', { kind: kindOf(e, 'service-unavailable'), capture: 'none', audio: 'none' })
        return false
      }
      if (session !== s || s.op !== op) return false
    }
    return go('ready')
  }

  async function start(o = {}) {
    const mode = o && o.mode
    if (mode !== 'dictation' && mode !== 'conversation') { warn(`start necesita mode 'dictation' o 'conversation' (recibió «${mode}»).`); return false }
    if (mode === 'conversation') {
      // El AudioContext se crea ya, dentro del gesto (WebKit), aunque se espere a prepare()
      const c = canStart() && !opts.requireConsent ? normalizeCapabilities(opts.adapter.capabilities) : null
      const primed = c && c.input.format !== 'self' && state.status === 'idle' && !session ? primeAudio() : null
      if (!(await prepare(o))) { closeAudio(primed); return false }
      if (opts.requireConsent) return true
      return begin(primed)
    }
    const tg = o.target
    if (!tg || typeof tg.id !== 'string' || !tg.id) { warn('start({ mode: \'dictation\' }) necesita target: { id, label? }.'); return false }
    if (!canStart()) return false
    if (state.status !== 'idle' || session) return refuse('requesting')
    const s = newSession('dictation', { id: tg.id, label: typeof tg.label === 'string' ? tg.label : '' })
    if (!preflight(s)) return false
    s.lastWhy = 'start'
    return acquire('start', s.caps.input.format === 'self' ? null : primeAudio())
  }

  async function begin(primed) {
    if (!isClient() || !session) { closeAudio(primed); return false }
    if (state.status !== 'ready') { closeAudio(primed); return refuse('requesting') }
    if (opts.requireConsent && state.consent !== true) {
      warn('begin() con requireConsent y sin consentimiento: no se empieza a grabar.')
      ui.consentError = true
      if (!state.panelOpen) polite(t('announce.consentRequired'))
      return false
    }
    session.lastWhy = 'start'
    return acquire('start', primed || (session.caps.input.format === 'self' ? null : primeAudio()))
  }

  async function pause() {
    if (!isClient() || !session) return false
    const st = state.status
    if (!(isCapturing(st) || (st === 'reconnecting' && isLive()))) return refuse('paused')
    const s = session
    s.op++
    stopCapture()
    state.capture = 'off'
    if (s.engine) safe(() => s.engine.pause())
    return go('paused')
  }

  async function resume() {
    if (!isClient() || !session) return false
    const st = state.status
    if (st !== 'paused' && !isProblem(st)) return refuse('requesting')
    if (isProblem(st) && state.error && state.error.recoverable === false) return refuse('requesting')
    if (!ui.hostAttached) { warn('intento de reanudar sin un <GSpeechHost> montado: no se abre el micrófono.'); return false }
    const why = captured() ? 'resume' : 'start'
    session.lastWhy = why
    return acquire(why, session.caps.input.format === 'self' ? null : primeAudio())
  }

  async function finish() {
    if (!isClient() || !session) return false
    const st = state.status
    const ok = isCapturing(st) || st === 'paused' || st === 'reconnecting' || (isProblem(st) && captured())
    if (!ok || !session.engine) return refuse('processing')
    const s = session
    s.op++
    if (s.selfWait) { s.selfWait(false); s.selfWait = null }
    const wasLive = isLive()
    stopCapture()
    state.capture = 'off'
    // Paso 1 · captura detenida; paso 2 · procesar lo pendiente sin cerrar ni descartar
    ui.procTotal = Math.max(1, state.pending + (state.transcript.partial ? 1 : 0))
    ui.confirmDiscard = false
    if (!go('processing')) return false
    let res
    try {
      // Paso 3 y 4 · el motor cierra el provisional y resuelve cuando no queda nada pendiente
      res = await s.engine.finish()
    } catch (e) {
      if (session !== s || state.status !== 'processing') return false
      fail('error', { kind: kindOf(e, 'processing-failed'), capture: 'stopped', audio: e && AUDIO_FATE.includes(e.audio) ? e.audio : 'kept', recoverable: true })
      return false
    }
    if (session !== s || state.status !== 'processing') return false
    s.finished = true
    state.pending = 0
    if (state.transcript) state.transcript.partial = null
    state.result = { audioDeleted: deletion(s, res) }
    // Paso 5 · completada; paso 6 · revisión (el dictado se cierra solo si todo se insertó)
    const moved = go('completed')
    if (moved && state.mode === 'dictation' && !ui.notInserted.length) scheduleAutoClose()
    return moved
  }
  function deletion(s, res) {
    const v = res && typeof res === 'object' ? res.audioDeleted : undefined
    if (s.caps.storesAudio !== 'none') {
      if (typeof v !== 'boolean') warn('finish()/abort() del adaptador no devolvió { audioDeleted: Boolean } con storesAudio distinto de \'none\'.')
      else if (!v) warn('el adaptador no confirmó la eliminación del audio temporal (audioDeleted: false).')
    }
    return v === true
  }

  async function discard(internal) {
    if (!isClient() || !session) return false
    const st = state.status
    if (st === 'idle' || st === 'processing') return refuse('idle')
    const silent = Boolean(internal && internal.silent)
    const s = session
    s.op++
    if (s.discarding) return false
    s.discarding = true
    if (s.controller) { try { s.controller.abort() } catch { /* sin efecto */ } }
    const engine = !s.finished ? s.engine : null
    const prevResult = state.result
    const field = state.target && state.mode === 'dictation' ? state.target.id : null
    s.finished = true
    // Primero la verdad: la captura se detiene y la sesión deja de existir; luego se espera la confirmación del borrado
    endSession()
    go('idle')
    if (field) forgetUndo(field)
    let res = prevResult
    if (engine && typeof engine.abort === 'function') {
      try { res = await engine.abort() } catch { res = null }
      res = { audioDeleted: deletion(s, res) }
    }
    const audioDeleted = Boolean(res && res.audioDeleted)
    state.result = { audioDeleted }
    // Sin audio guardado (storesAudio 'none' o el motor no llegó a abrirse) no hay nada que confirmar
    const confirmed = audioDeleted || !engine && !prevResult || (s.caps && s.caps.storesAudio === 'none')
    if (!silent) polite(confirmed ? t('announce.discarded') : t('announce.discardedUnconfirmed'))
    callback('onDiscard', { audioDeleted })
    return true
  }

  async function close(reason) {
    if (!isClient() || !session) return false
    if (state.status !== 'completed') return refuse('idle')
    const json = state.transcript ? state.transcript.toJSON() : null
    endSession()
    go('idle', reason === 'auto' ? null : 'close')
    callback('onComplete', json)
    return true
  }

  async function cancel() {
    if (!isClient() || !session) return false
    const st = state.status
    if (st !== 'ready' && st !== 'requesting') return refuse('idle')
    const s = session
    s.op++
    if (s.controller) { try { s.controller.abort() } catch { /* sin efecto */ } }
    if (s.engine && typeof s.engine.abort === 'function') safe(() => s.engine.abort())
    s.finished = true
    endSession()
    return go('idle')
  }

  async function openPanel(opener) {
    if (!isClient() || state.status === 'idle') return false
    ui.opener = opener && opener.nodeType === 1 ? opener : (document.activeElement && document.activeElement !== document.body ? document.activeElement : null)
    state.panelOpen = true
    return true
  }
  async function closePanel(o) {
    if (!state.panelOpen) return false
    ui.returnFocus = !(o && o.focus === false)
    ui.confirmDiscard = false
    state.panelOpen = false
    return true
  }

  async function setConsent(v) {
    if (state.status !== 'ready') { warn('setConsent fuera de ready: se ignora.'); return false }
    state.consent = Boolean(v)
    if (state.consent) ui.consentError = false
    return true
  }
  async function setExpectedSpeakers(v) {
    if (state.status !== 'ready') { warn('setExpectedSpeakers fuera de ready: se ignora.'); return false }
    if (!EXPECTED.includes(v)) { warn(`expectedSpeakers «${v}» no es válido (1, 2, 'many').`); return false }
    state.expectedSpeakers = v
    if (state.transcript) state.transcript.expectedSpeakers = v
    return true
  }

  async function retrySegment(segmentId) {
    const s = session
    const id = String(segmentId)
    if (!s || !s.engine || s.finished || typeof s.engine.retrySegment !== 'function') return false
    const issue = state.issues.find((i) => i.segmentId === id && i.retryable)
    if (!issue || ui.retrying.includes(id)) return false
    ui.retrying.push(id)
    try {
      const r = s.engine.retrySegment(id)
      if (r && typeof r.then === 'function') await r
    } catch {
      ui.retrying = ui.retrying.filter((x) => x !== id)
      return false
    }
    return true
  }

  async function insertPending(fieldId) {
    if (!isClient() || !session || !session.dict || !state.target || state.target.id !== fieldId || !ui.notInserted.length) return false
    const el = document.getElementById(fieldId)
    if (!el || !el.isConnected) return false
    const ids = ui.notInserted.splice(0)
    const focused = document.activeElement === el
    for (const id of ids) {
      const seg = state.transcript.segments.find((x) => x.id === id)
      if (seg && !seg.failed) doInsert(el, seg.literal, { atEnd: !focused })
    }
    if (state.status === 'completed' && state.mode === 'dictation') scheduleAutoClose()
    return true
  }

  async function undoDictation(fieldId) {
    if (!isClient()) return false
    const log = undoLogs[fieldId]
    const el = document.getElementById(fieldId)
    if (!log || !log.length || !el) {
      if (log) forgetUndo(fieldId)
      return false
    }
    // Se comprueba sobre una copia, en orden inverso: si el campo cambió, no se toca nada
    let value = el.value
    for (let i = log.length - 1; i >= 0; i--) {
      const e = log[i]
      if (value.slice(e.start, e.start + e.ins.length) !== e.ins) {
        forgetUndo(fieldId)
        polite(t('announce.undoFailed'))
        return false
      }
      value = value.slice(0, e.start) + e.replaced + value.slice(e.start + e.ins.length)
    }
    for (let i = log.length - 1; i >= 0; i--) {
      const e = log[i]
      el.setRangeText(e.replaced, e.start, e.start + e.ins.length, 'preserve')
    }
    dispatchInput(el)
    forgetUndo(fieldId)
    cancelLater('insert')
    polite(t('announce.undone'))
    if (typeof el.focus === 'function') el.focus()
    return true
  }

  function onLevel(callback) {
    if (typeof callback !== 'function') return () => {}
    levels.add(callback)
    return () => levels.delete(callback)
  }

  function configure(patch) {
    applyOptions(patch, false)
  }

  const publicState = readonly(state)
  const speech = {
    get state() { return publicState },
    get capabilities() { return caps() },
    prepare,
    start,
    begin: () => begin(),
    setConsent,
    setExpectedSpeakers,
    pause,
    resume,
    finish,
    discard: () => discard(),
    close: () => close(),
    cancel,
    openPanel: () => openPanel(),
    closePanel: () => closePanel(),
    retrySegment,
    insertPending,
    undoDictation,
    onLevel,
    configure,
    install(app) { app.provide(speechKey, speech) }
  }

  // ---------- Acceso de las piezas (GSpeechHost, GSpeechPill, GSpeechTrigger) ----------
  Object.defineProperty(speech, INTERNAL, {
    enumerable: false,
    configurable: true,
    value: {
      state,
      ui,
      opts,
      t,
      warn,
      captured,
      isLive,
      composeError,
      polite,
      openPanel,
      closePanel,
      discard,
      close,
      caps,
      forgetUndo,
      setActivityHidden(v) { state.activityHidden = Boolean(v) },
      setConsentError(v) { ui.consentError = Boolean(v) },
      attachHost(h) {
        if (host) return false
        host = h
        ui.hostAttached = true
        ui.hostId = h.id
        return true
      },
      detachHost(h) {
        if (host !== h) return
        // Sin indicador no hay micrófono: si el anfitrión se desmonta con la captura viva, se detiene
        if (isLive() || state.capture === 'held') {
          const s = session
          stopCapture()
          state.capture = 'off'
          if (s && s.engine) safe(() => s.engine.pause())
          if (isCapturing(state.status) || state.status === 'reconnecting') go('paused')
        }
        resetAnnouncer()
        removeUndoListener()
        host = null
        ui.hostAttached = false
        ui.hostId = null
      },
      isHost: (h) => host === h,
      attachPill() {
        if (ui.pillAttached) return false
        ui.pillAttached = true
        return true
      },
      detachPill() {
        ui.pillAttached = false
        ui.pillEl = null
      },
      setPillEl(el) { ui.pillEl = el ? markRaw(el) : null },
      setStarter(el) { ui.starter = el ? markRaw(el) : null },
      focusPill() { if (host) host.focusPill() }
    }
  })

  // El gestor no se vuelve reactivo si se pasa como prop o se guarda en un estado (su estado ya lo es)
  return markRaw(speech)
}

// Inyecta el gestor provisto con app.use(speech). Sin gestor (o fuera de setup): aviso en desarrollo y undefined.
export function useSpeech() {
  if (!hasInjectionContext()) {
    if (isDev()) console.warn(`${PREFIX} useSpeech() solo funciona dentro de setup (o de app.runWithContext): devuelve undefined.`)
    return undefined
  }
  const s = inject(speechKey, null)
  if (!s) {
    if (isDev()) console.warn(`${PREFIX} useSpeech() sin gestor provisto: instala el tuyo con app.use(createSpeech(…)). Devuelve undefined.`)
    return undefined
  }
  return s
}
