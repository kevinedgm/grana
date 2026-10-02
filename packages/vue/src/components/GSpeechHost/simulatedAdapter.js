// Adaptador SIMULADO de la captura de voz (dueño: bruno). Contrato: design/contracts/speech.md §4.7 (DECISIONS.md #216).
// Solo para pruebas, demos y documentación: viaja en la entrada `@grana/vue/testing`, NUNCA en el paquete principal.
// Sin red ni almacenamiento: emite el provisional palabra a palabra mientras llegan trozos con voz y el confirmado tras una
// latencia, con hablantes por guion; capacidades configurables y fallos inyectables por métodos de control.
// Sus opciones y métodos de control los fija bruno (GSpeechHost.meta.json, «testing»); no forman parte del contrato del adaptador.

const DEFAULT_SCRIPT = {
  dictation: [
    'Lorem ipsum dolor sit amet.',
    'Consectetur adipiscing elit, sed do eiusmod tempor.',
    'Ut enim ad minim veniam, quis nostrud exercitation.'
  ],
  conversation: [
    { speaker: 'A', text: 'Lorem ipsum dolor sit amet?' },
    { speaker: 'B', text: 'Consectetur adipiscing elit, sed do eiusmod tempor.' },
    { speaker: 'A', text: 'Ut enim ad minim veniam.' },
    { speaker: 'C', text: 'Quis nostrud exercitation ullamco laboris.' }
  ]
}
const fault = (kind, extra = {}) => Object.assign(new Error(kind), { kind, ...extra })
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const partialOf = (words) => words.join(' ').toLowerCase().replace(/[.,;:¿?¡!]/g, '')

/**
 * @param {object} [options]
 * @param {string} [options.id='simulated']
 * @param {'device'|'local'|'remote'} [options.location='local']
 * @param {object} [options.input={ format: 'pcm', sampleRate: 16000, channels: 1 }] pcm · encoded · self
 * @param {boolean} [options.partials=true] @param {boolean} [options.vad=false] @param {boolean} [options.diarization=true]
 * @param {boolean} [options.offlineBuffer=true] @param {'none'|'memory'|'disk'} [options.storesAudio='memory']
 * @param {number} [options.maxSpeakers=4]
 * @param {number} [options.latency=1000] ms entre el fin de un fragmento y su `final`
 * @param {number} [options.checkDelay=0] @param {number} [options.openDelay=0] demoras de check() y open()
 * @param {number} [options.retryInterval=1500] @param {number} [options.maxRetries=3] reconexión simulada
 * @param {{ dictation?: string[], conversation?: Array<{ speaker: string, text: string }> }} [options.script]
 * @param {{ speak?: number[], silence?: number }} [options.selfPattern] solo `self`: ms de voz y de silencio del micrófono simulado
 */
export function createSimulatedSpeechAdapter(options = {}) {
  const cfg = {
    id: 'simulated',
    location: 'local',
    input: { format: 'pcm', sampleRate: 16000, channels: 1 },
    partials: true,
    vad: false,
    diarization: true,
    offlineBuffer: true,
    storesAudio: 'memory',
    maxSpeakers: 4,
    latency: 1000,
    checkDelay: 0,
    openDelay: 0,
    retryInterval: 1500,
    maxRetries: 3,
    selfPattern: { speak: [2400, 3000, 2000], silence: 1200 },
    ...options,
    script: { ...DEFAULT_SCRIPT, ...(options.script || {}) }
  }
  const control = {
    down: false, // servicio caído: check/open/reconnect rechazan
    failNext: null, // el siguiente fragmento falla (no fatal)
    finishError: null, // finish() rechaza con este kind
    confirmDeletion: true, // finish()/abort() devuelven audioDeleted
    cursor: { dictation: 0, conversation: 0 }
  }
  let current = null // sesión del motor en curso (para los métodos de control)
  const log = { opened: 0, checks: 0, pushed: [], aborted: 0, finished: 0, paused: 0, resumed: 0, retried: [] }

  const adapter = {
    get id() { return cfg.id },
    get capabilities() {
      return {
        location: cfg.location,
        input: cfg.input,
        partials: cfg.partials,
        vad: cfg.vad,
        diarization: cfg.diarization,
        maxSpeakers: cfg.maxSpeakers,
        offlineBuffer: cfg.offlineBuffer,
        storesAudio: cfg.storesAudio
      }
    },
    async check() {
      log.checks++
      if (cfg.checkDelay) await wait(cfg.checkDelay)
      if (control.down) throw fault('service-unavailable')
    },
    async open(ctx) {
      log.opened++
      if (cfg.openDelay) await wait(cfg.openDelay)
      if (control.down) throw fault('service-unavailable')
      current = createEngine(ctx)
      return current.engine
    },

    // ---------- Control (solo simulación) ----------
    /** Cambia capacidades (se aplican a la siguiente sesión, como en un adaptador real) */
    setCapabilities(patch) { Object.assign(cfg, patch || {}) },
    /** Servicio caído (`true`): check/open/reconnect rechazan y, con una sesión abierta, se pierde la conexión y se reintenta */
    setServiceDown(v) {
      control.down = Boolean(v)
      if (current && control.down) current.goOffline()
      if (current && !control.down) current.goOnline()
    },
    goOffline() { if (current) current.goOffline() },
    goOnline() { if (current) current.goOnline() },
    /** El siguiente fragmento confirmado falla (no fatal). `retryable` por defecto: con offlineBuffer */
    failNextSegment(o = {}) { control.failNext = { retryable: o.retryable ?? cfg.offlineBuffer } },
    /** Sin espacio para el audio temporal (fatal) */
    storageFull() { if (current) current.emit('error', { kind: 'storage-full', fatal: true, audio: current.pendingCount() ? 'processing' : 'none' }) },
    /** finish() rechaza con `{ kind, audio }` (null: vuelve a funcionar) */
    failFinish(kind = 'processing-failed') { control.finishError = kind },
    /** finish()/abort() confirman (o no) la eliminación del audio temporal */
    confirmDeletion(v) { control.confirmDeletion = Boolean(v) },
    /** Emite un evento cualquiera en la sesión en curso (pruebas de eventos) */
    emit(type, payload) { if (current) current.emit(type, payload) },
    /** Solo `self`: micrófono simulado desconectado, silenciado o congelado (sin eventos level) */
    endCapture() { if (current) current.selfEvent('ended') },
    muteCapture() { if (current) current.selfEvent('muted') },
    freezeCapture(v = true) { if (current) current.freeze(Boolean(v)) },
    /** Registro de llamadas (pruebas): open, check, trozos recibidos, abort, finish, pause, resume, reintentos */
    get log() { return log },
    get session() { return current ? current.engine : null }
  }

  function createEngine(ctx) {
    const conv = ctx.mode === 'conversation'
    let idc = 0
    let cur = null
    let pending = 0
    let online = true
    let closed = false
    let attempts = 0
    let retryTimer = null
    let selfTimer = null
    let frozen = false
    const timers = new Set()
    const buffered = []
    const failed = new Map() // id → fragmento guardado para reintentar
    const emit = (type, payload) => { if (!closed) ctx.emit(type, payload) }
    const emitPending = () => emit('pending', { count: pending + buffered.length })
    const later = (fn, ms) => {
      const h = setTimeout(() => { timers.delete(h); fn() }, ms)
      timers.add(h)
    }
    function deliver(seg) {
      pending++
      emitPending()
      later(() => {
        if (closed) return
        pending--
        if (!online) {
          buffered.push(seg)
          emitPending()
          return
        }
        if (control.failNext) {
          const { retryable } = control.failNext
          control.failNext = null
          if (retryable) failed.set(seg.id, seg)
          emit('error', { kind: 'processing-failed', fatal: false, segment: { id: seg.id, t0: seg.t0, t1: seg.t1 }, audio: retryable ? 'kept' : 'lost', retryable })
        } else {
          emit('final', { id: seg.id, text: seg.text, speaker: conv && cfg.diarization ? seg.speaker : null, t0: seg.t0, t1: seg.t1 })
        }
        emitPending()
      }, cfg.latency)
    }
    function closeCurrent() {
      if (!cur) return
      const seg = cur
      cur = null
      deliver(seg)
    }
    function voiced(t0, t1) {
      if (!cur) {
        const i = control.cursor[ctx.mode]++
        const list = conv ? cfg.script.conversation : cfg.script.dictation
        const src = list[i % list.length]
        const text = typeof src === 'string' ? src : src.text
        cur = { id: `sim-${++idc}`, text, speaker: typeof src === 'string' ? null : src.speaker, t0, t1, words: text.split(' '), n: 0 }
      }
      cur.n = Math.min(cur.n + 1, cur.words.length)
      cur.t1 = t1
      if (cfg.partials) emit('partial', { id: cur.id, text: partialOf(cur.words.slice(0, cur.n)), speaker: conv && cfg.diarization ? cur.speaker : null })
    }
    function goOnline() {
      clearInterval(retryTimer)
      retryTimer = null
      if (online || closed) return
      online = true
      attempts = 0
      emit('connection', { state: 'restored' })
      buffered.splice(0).forEach(deliver)
      emitPending()
    }
    function goOffline() {
      if (!online || closed) return
      online = false
      attempts = 0
      emit('connection', { state: 'lost' })
      clearInterval(retryTimer)
      retryTimer = setInterval(() => {
        if (closed) { clearInterval(retryTimer); return }
        if (!control.down) { goOnline(); return }
        attempts++
        emit('connection', { state: 'retrying', attempt: attempts })
        if (attempts >= cfg.maxRetries) {
          clearInterval(retryTimer)
          retryTimer = null
          emit('error', { kind: 'service-unavailable', fatal: true, audio: buffered.length || cfg.offlineBuffer ? 'kept' : 'none' })
        }
      }, cfg.retryInterval)
    }
    // `self`: el adaptador captura (micrófono simulado con voz y silencio alternos)
    let selfT = 0
    function selfStart() {
      clearInterval(selfTimer)
      if (closed || cfg.input.format !== 'self') return
      later(() => {
        if (closed) return
        emit('capture', { state: 'live' })
        let phaseEnd = Date.now() + 400
        let speaking = false
        let k = 0
        let n = 0
        selfTimer = setInterval(() => {
          if (closed || frozen) return
          const t = Date.now()
          if (t > phaseEnd) {
            speaking = !speaking
            const p = cfg.selfPattern
            phaseEnd = t + (speaking ? p.speak[k++ % p.speak.length] : p.silence)
            if (!speaking) closeCurrent()
          }
          n++
          const value = speaking ? 0.45 + 0.3 * Math.abs(Math.sin(n / 2)) : 0.04
          emit('level', { value })
          selfT += 100
          if (speaking && n % 3 === 0) voiced(selfT - 300, selfT)
        }, 100)
      }, 50)
    }
    function selfStop() {
      clearInterval(selfTimer)
      selfTimer = null
    }
    function shutdown() {
      closed = true
      clearInterval(retryTimer)
      selfStop()
      timers.forEach((h) => clearTimeout(h))
      timers.clear()
      if (current && current.engine === engine) current = null
    }

    const engine = {
      push(chunk) {
        if (closed) return
        log.pushed.push({ seq: chunk.seq, t0: chunk.t0, t1: chunk.t1, format: chunk.format, voice: chunk.voice, mimeType: chunk.mimeType, size: chunk.data ? (chunk.data.length ?? chunk.data.size) : 0 })
        if (chunk.voice) voiced(chunk.t0, chunk.t1)
        else closeCurrent()
      },
      pause() { log.paused++; closeCurrent(); selfStop() },
      resume() { log.resumed++; selfStart() },
      async reconnect() {
        if (control.down) throw fault('service-unavailable')
        goOnline()
      },
      async finish() {
        log.finished++
        closeCurrent()
        selfStop()
        while (pending > 0 || buffered.length) {
          if (!online) throw fault(control.finishError || 'service-unavailable', { audio: buffered.length ? 'kept' : 'none' })
          await wait(50)
        }
        if (control.finishError) {
          const kind = control.finishError
          throw fault(kind, { audio: 'kept' })
        }
        shutdown()
        return { audioDeleted: control.confirmDeletion }
      },
      async abort() {
        log.aborted++
        shutdown()
        buffered.length = 0
        return { audioDeleted: control.confirmDeletion }
      },
      retrySegment(id) {
        const seg = failed.get(id)
        if (!seg || closed) return
        failed.delete(id)
        log.retried.push(id)
        deliver(seg)
      }
    }
    if (ctx.signal && typeof ctx.signal.addEventListener === 'function') ctx.signal.addEventListener('abort', shutdown)
    selfStart()
    return {
      engine,
      emit: (type, payload) => ctx.emit(type, payload),
      goOffline,
      goOnline,
      pendingCount: () => pending + buffered.length,
      selfEvent(state) { selfStop(); emit('capture', { state }) },
      freeze(v) { frozen = v }
    }
  }

  return adapter
}
