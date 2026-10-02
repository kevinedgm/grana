// Entorno de pruebas de la captura de voz en jsdom (dueño: bruno). Solo lo importan los *.test.js: no se exporta ni se
// empaqueta. Simula getUserMedia, AudioContext (con AnalyserNode y AudioWorklet), MediaRecorder, Permissions API,
// wakeLock, popover y <dialog> modal, con la misma forma que el navegador.
import { vi } from 'vitest'

export function installSpeechEnv(o = {}) {
  const env = {
    level: o.level ?? 0.5, // nivel 0..1 que produce el analizador
    frozen: false, // el reloj de audio no avanza (sin fotogramas)
    error: null, // error que lanzará getUserMedia
    permission: o.permission ?? 'granted', // estado de la Permissions API (undefined: sin API)
    tracks: [],
    contexts: [],
    worklets: [],
    recorders: [],
    wakeLocks: [],
    gum: 0
  }
  class FakeTrack extends EventTarget {
    constructor() { super(); this.kind = 'audio'; this.readyState = 'live'; this.muted = false }
    stop() { this.readyState = 'ended' }
  }
  class FakeStream {
    constructor() { this.track = new FakeTrack(); env.tracks.push(this.track) }
    getAudioTracks() { return [this.track] }
    getTracks() { return [this.track] }
  }
  const node = () => ({ connect() {}, disconnect() {} })
  class FakeContext {
    constructor() {
      this.state = 'running'
      this.sampleRate = 48000
      this.destination = node()
      this._t = 0
      this.audioWorklet = { addModule: async () => {} }
      env.contexts.push(this)
    }
    get currentTime() {
      if (!env.frozen) this._t = Date.now() / 1000
      return this._t
    }
    createMediaStreamSource() { return node() }
    createGain() { return { ...node(), gain: { value: 1 } } }
    createAnalyser() {
      return {
        ...node(),
        fftSize: 1024,
        getFloatTimeDomainData(buf) {
          const amp = env.level > 0 ? 10 ** ((env.level * 50 - 60) / 20) : 0
          for (let i = 0; i < buf.length; i++) buf[i] = i % 2 ? amp : -amp
        }
      }
    }
    resume() { this.state = 'running'; return Promise.resolve() }
    close() { this.state = 'closed'; return Promise.resolve() }
  }
  // El procesador entrega 100 ms de audio a 48 kHz cada 100 ms (salvo env.autoPcm = false o captura congelada)
  class FakeWorkletNode {
    constructor() {
      this.port = { onmessage: null }
      env.worklets.push(this)
      this.iv = setInterval(() => {
        if (env.autoPcm === false || env.frozen || !this.port.onmessage) return
        const amp = env.level > 0 ? 10 ** ((env.level * 50 - 60) / 20) : 0
        this.port.onmessage({ data: new Float32Array(4800).fill(amp) })
      }, 100)
    }
    connect() {}
    disconnect() { clearInterval(this.iv) }
  }
  class FakeRecorder {
    constructor(stream, opts) { this.stream = stream; this.mimeType = opts.mimeType; this.state = 'inactive'; this.ondataavailable = null; env.recorders.push(this) }
    static isTypeSupported(t) { return (env.mimeTypes || ['audio/webm;codecs=opus']).includes(t) }
    start(timeslice) { this.timeslice = timeslice; this.state = 'recording' }
    stop() { this.state = 'inactive' }
    emit(size = 100) { this.ondataavailable && this.ondataavailable({ data: { size } }) }
  }
  const def = (obj, key, value) => Object.defineProperty(obj, key, { value, configurable: true, writable: true })
  def(navigator, 'mediaDevices', {
    getUserMedia: vi.fn(async () => {
      env.gum++
      if (env.error) throw env.error
      return new FakeStream()
    })
  })
  def(navigator, 'permissions', env.permission === undefined ? undefined : {
    query: vi.fn(async () => ({ state: env.permission, onchange: null }))
  })
  def(navigator, 'wakeLock', {
    request: vi.fn(async () => {
      const lock = { released: false, release: vi.fn(async () => { lock.released = true }) }
      env.wakeLocks.push(lock)
      return lock
    })
  })
  window.AudioContext = FakeContext
  globalThis.AudioWorkletNode = FakeWorkletNode
  globalThis.MediaRecorder = FakeRecorder
  if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:worklet'
  if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {}
  env.restore = () => {
    delete navigator.mediaDevices
    delete navigator.permissions
    delete navigator.wakeLock
    delete window.AudioContext
    delete globalThis.AudioWorkletNode
    delete globalThis.MediaRecorder
  }
  return env
}

// Popover y <dialog> modal de jsdom (no los implementa): mismo contrato que en GToaster.test.js
const origMatches = HTMLElement.prototype.matches
export function installTopLayer() {
  HTMLElement.prototype.showPopover = function () { this.setAttribute('data-popover-open', '') }
  HTMLElement.prototype.hidePopover = function () { this.removeAttribute('data-popover-open') }
  HTMLElement.prototype.matches = function (sel) {
    if (sel === ':popover-open') return this.hasAttribute('data-popover-open')
    if (sel === ':modal') return this.hasAttribute('open') && this.hasAttribute('data-modal')
    return origMatches.call(this, sel)
  }
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('data-modal', ''); this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function () {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    this.removeAttribute('data-modal')
    this.dispatchEvent(new Event('close'))
  }
  return () => { HTMLElement.prototype.matches = origMatches }
}

// Textos completos de ejemplo (la aplicación los pone; Grana no trae valores por defecto)
export const LABELS = {
  region: 'Grabación de voz',
  openPanel: 'abrir panel',
  closePanel: 'Cerrar panel',
  duration: 'Duración:',
  actions: {
    start: 'Empezar a grabar', cancel: 'Cancelar', pause: 'Pausar', resume: 'Reanudar', retry: 'Reintentar', finish: 'Finalizar',
    discard: 'Descartar', discardConfirm: 'Sí, descartar', closeSession: 'Cerrar sesión', dismiss: 'Cerrar', retrySegment: 'Reintentar fragmento',
    hideActivity: 'Ocultar actividad', discardAsk: '¿Descartar la grabación?'
  },
  states: {
    requesting: { short: 'Pidiendo permiso', long: 'Esperando el permiso del micrófono', longGranted: 'Activando el micrófono' },
    ready: { short: 'Listo', long: 'Listo para grabar' },
    listening: { short: 'Grabando', long: 'Grabando' },
    speech: { short: 'Voz detectada', long: 'Grabando · voz detectada' },
    transcribing: { short: 'Transcribiendo', long: 'Grabando · transcribiendo' },
    paused: { short: 'En pausa', long: 'En pausa. El micrófono no está capturando' },
    processing: { short: 'Procesando', long: 'Procesando el audio pendiente' },
    reconnecting: { short: 'Reconectando', long: 'Reconectando. La grabación está en pausa', shortLive: 'Reconectando · grabando', longLive: 'Reconectando. La grabación continúa' },
    denied: { short: 'Permiso denegado', long: 'Permiso denegado' },
    unavailable: { short: 'Sin micrófono', long: 'Micrófono no disponible' },
    error: { short: 'Error', long: 'Error en la grabación' },
    completed: { short: 'Lista', long: 'Transcripción lista' }
  },
  mode: { dictation: 'Dictado en «{target}»', conversation: 'Conversación · {speakers}' },
  expectedSpeakers: { label: 'Participantes previstos', options: { 1: '1 participante', 2: '2 participantes', many: 'Varios' } },
  noDiarization: 'El motor no distingue hablantes.',
  consent: { label: 'He avisado a los participantes', required: 'Marca la casilla para empezar.' },
  speaker: 'Hablante {letter}',
  unassigned: 'Sin asignar',
  attempt: 'Intento {attempt}',
  signalFlat: 'No llega sonido del micrófono.',
  pending: (n) => (n === 1 ? '1 fragmento pendiente' : `${n} fragmentos pendientes`),
  pendingNone: 'Todo transcrito',
  progress: 'Procesando el audio pendiente',
  privacy: { device: 'En este dispositivo.', local: 'En el servicio local.', remote: 'En un servicio externo.' },
  audio: { none: 'El audio no se guarda.', memory: 'Audio temporal en memoria.', disk: 'Audio temporal cifrado.', deleted: 'Audio temporal eliminado.', notConfirmed: 'El motor no confirmó la eliminación del audio temporal.' },
  transcript: { title: 'Transcripción', empty: 'Todavía no hay texto.', partialFlag: 'provisional', partialPrefix: 'Texto provisional:', failed: 'No se pudo transcribir', failedLost: 'El audio de este fragmento se perdió.' },
  trigger: { dictate: 'Dictar en {target}', conversation: 'Grabar conversación', view: 'Ver grabación', busy: 'Hay una grabación en curso. Mayús+F8 para ir a ella.' },
  note: { partialPrefix: 'Texto provisional:', notInserted: '{count} fragmentos sin insertar.', insert: 'Insertar', inserted: 'Dictado insertado.', undo: 'Deshacer dictado' },
  announce: {
    requesting: 'Esperando el permiso del micrófono.', ready: 'Listo para grabar.', startDictation: 'Grabando. Dictado en {target}.',
    startConversation: 'Grabando conversación.', resumed: 'Grabando de nuevo.', paused: 'En pausa. El micrófono no está capturando.',
    processing: 'Procesando el audio pendiente.', completedDictation: 'Dictado terminado en {target}.',
    completedConversation: 'Transcripción lista: {count} fragmentos, {time}.', reconnecting: 'Reconectando. La grabación continúa.',
    reconnectingHeld: 'Reconectando. La grabación está en pausa.', restored: 'Servicio restablecido.', restoredHeld: 'Servicio restablecido. Pulsa Reanudar.',
    inserted: 'Texto añadido a {target}.', undone: 'Inserción deshecha.', undoFailed: 'No se puede deshacer: el campo cambió.',
    discarded: 'Grabación descartada.', discardedUnconfirmed: 'Grabación descartada. El motor no confirmó la eliminación del audio.',
    closed: 'Sesión cerrada.', signalFlat: 'No llega sonido del micrófono.', segmentFailed: 'No se pudo transcribir un fragmento.',
    busy: 'Ya hay una grabación en curso.', consentRequired: 'Marca la casilla de aviso para empezar.'
  },
  errors: {
    'permission-denied': { title: 'Permiso del micrófono denegado', what: 'El navegador no permite usar el micrófono.', fix: 'Permite el micrófono y pulsa Reintentar.' },
    'no-device': { title: 'Micrófono no disponible', what: 'No se encontró ningún micrófono.', fix: 'Conecta uno y pulsa Reintentar.' },
    'device-busy': { title: 'Micrófono ocupado', what: 'Otra aplicación usa el micrófono.', fix: 'Ciérrala y pulsa Reintentar.' },
    'device-disconnected': { title: 'Micrófono desconectado', what: 'Se desconectó a los {at}.', fix: 'Conéctalo y pulsa Reanudar.' },
    interrupted: { title: 'Grabación interrumpida', what: 'La captura se interrumpió a los {at}.', fix: 'Pulsa Reanudar.' },
    'service-unavailable': { title: 'Servicio no disponible', what: 'El servicio no responde.', fix: 'Pulsa Reintentar.' },
    'processing-failed': { title: 'Fragmento sin transcribir', what: 'No se pudo transcribir el fragmento {range}.', fix: '' },
    'storage-full': { title: 'Sin espacio', what: 'No queda espacio; la captura se detuvo a los {at}.', fix: 'Libera espacio.' },
    'remote-not-allowed': { title: 'Motor no permitido', what: 'El motor procesa fuera.', fix: 'No se activó el micrófono.' },
    unsupported: { title: 'No compatible', what: 'Este navegador no permite capturar audio.', fix: '' }
  },
  capture: { continues: 'La grabación continúa.', paused: 'La grabación está en pausa.', stopped: 'La grabación se detuvo.', none: 'No se grabó nada.' },
  audioFate: { processing: 'El audio se sigue transcribiendo.', kept: 'El audio afectado se guarda.', lost: 'El audio afectado se perdió.' },
  kept: 'Lo transcrito se conserva.'
}
