// Adaptadores REALES de la captura de voz, solo para el playground (dueño: bruno; no viajan en ningún paquete).
// Grana no trae motor: define la interfaz (design/contracts/speech.md §4, DECISIONS.md #216) y la aplicación la implementa.
// Aquí hay dos ejemplos de «aplicación»:
//   · createWhisperAdapter  → Whisper EN ESTE DISPOSITIVO con transformers.js (ONNX + WASM/WebGPU). Sin red salvo la descarga
//                             del modelo la primera vez (queda en la caché del navegador). location: 'device'. Es la vía que
//                             pide el brief (procesamiento local, sin proveedores).
//   · createWebSpeechAdapter → SpeechRecognition del navegador. En Chrome el audio SALE a los servidores de Google:
//                             location: 'remote', y por eso exige allowRemote: true (#208). Solo para comparar.
// Ambos se eligen desde la URL del playground: ?speech=whisper · ?speech=web (ver index.html).
;(function () {
  const fault = (kind, extra = {}) => Object.assign(new Error(kind), { kind, ...extra })
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

  // ---------------------------------------------------------------------------------------------------------------
  // Whisper en el dispositivo
  // ---------------------------------------------------------------------------------------------------------------
  const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/dist/transformers.min.js'
  const RATE = 16000

  /**
   * @param {object} [o]
   * @param {string} [o.model='onnx-community/whisper-base'] modelo de Hugging Face en formato ONNX (whisper-tiny es más ligero y peor en español)
   * @param {string|object} [o.dtype] cuantización; por defecto q8 en WASM y { encoder fp32, decoder q4 } en WebGPU (q8 en WebGPU da texto basura)
   * @param {'webgpu'|'wasm'} [o.device] por defecto WebGPU si existe
   * @param {number} [o.maxSegmentMs=15000] tope de audio por fragmento (Whisper admite 30 s)
   * @param {number} [o.minVoiceMs=400] menos voz que esto en un fragmento se descarta (evita alucinaciones en silencio)
   * @param {number} [o.silenceMs=700] silencio que cierra el fragmento en curso
   * @param {(info: { stage: string, progress?: number, file?: string }) => void} [o.onProgress] descarga y carga del modelo
   */
  function createWhisperAdapter(o = {}) {
    const cfg = { model: 'onnx-community/whisper-base', dtype: null, device: null, maxSegmentMs: 15000, minVoiceMs: 400, silenceMs: 700, onProgress: null }
    for (const k of Object.keys(o)) if (o[k] !== undefined) cfg[k] = o[k]
    let pipe = null
    let loading = null
    let device = 'wasm'

    async function load() {
      if (pipe) return pipe
      if (!loading) {
        loading = (async () => {
          const lib = await import(/* @vite-ignore */ TRANSFORMERS_URL)
          lib.env.allowLocalModels = false
          device = cfg.device || ('gpu' in navigator && navigator.gpu ? 'webgpu' : 'wasm')
          const dtypeFor = (dev) => cfg.dtype || (dev === 'webgpu' ? { encoder_model: 'fp32', decoder_model_merged: 'q4' } : 'q8')
          const progress_callback = (p) => {
            if (!cfg.onProgress) return
            if (p.status === 'progress') cfg.onProgress({ stage: 'download', progress: p.progress, file: p.file })
            else if (p.status === 'ready') cfg.onProgress({ stage: 'ready' })
            else cfg.onProgress({ stage: p.status, file: p.file })
          }
          try {
            pipe = await lib.pipeline('automatic-speech-recognition', cfg.model, { dtype: dtypeFor(device), device, progress_callback })
          } catch (e) {
            if (device === 'webgpu') {
              device = 'wasm'
              pipe = await lib.pipeline('automatic-speech-recognition', cfg.model, { dtype: dtypeFor(device), device, progress_callback })
            } else throw e
          }
          return pipe
        })().catch((e) => { loading = null; throw e })
      }
      return loading
    }

    const adapter = {
      id: 'whisper-device',
      capabilities: {
        location: 'device',
        input: { format: 'pcm', sampleRate: RATE, channels: 1, sampleFormat: 'f32', chunkMs: 300 },
        partials: false,
        vad: false,
        diarization: false,
        offlineBuffer: false,
        storesAudio: 'memory'
      },
      /** Carga el modelo SIN abrir el micrófono: Grana muestra «preparando» hasta que resuelve */
      async check() {
        try { await load() } catch (e) { console.error('[whisper] no se pudo cargar el modelo', e); throw fault('service-unavailable') }
      },
      async open(ctx) {
        let asr
        try { asr = await load() } catch (e) { throw fault('service-unavailable') }
        return createWhisperSession(ctx, asr, cfg)
      },
      get device() { return device },
      get model() { return cfg.model }
    }
    return adapter
  }

  function createWhisperSession(ctx, asr, cfg) {
    let closed = false
    let idc = 0
    let cur = null // { id, parts: Float32Array[], t0, t1, voiceMs, silenceMs }
    let pending = 0
    let queue = Promise.resolve()
    const emit = (type, payload) => { if (!closed) ctx.emit(type, payload) }
    const emitPending = () => emit('pending', { count: pending })
    const lang = ctx.language || 'es'

    function concat(parts) {
      let n = 0
      for (const p of parts) n += p.length
      const out = new Float32Array(n)
      let k = 0
      for (const p of parts) { out.set(p, k); k += p.length }
      return out
    }
    function flush() {
      if (!cur) return
      const seg = cur
      cur = null
      if (seg.voiceMs < cfg.minVoiceMs) return
      const audio = concat(seg.parts)
      pending++
      emitPending()
      queue = queue.then(async () => {
        if (closed) return
        try {
          const out = await asr(audio, { language: lang, task: 'transcribe', return_timestamps: false, max_new_tokens: 128 })
          const text = String(out && out.text ? out.text : '').trim()
          if (text && !/^[\s.,…¡!¿?-]*$/.test(text)) emit('final', { id: seg.id, text, speaker: null, t0: seg.t0, t1: seg.t1 })
        } catch (e) {
          console.error('[whisper] fallo al transcribir', e)
          emit('error', { kind: 'processing-failed', fatal: false, segment: { id: seg.id, t0: seg.t0, t1: seg.t1 }, audio: 'lost', retryable: false })
        } finally {
          pending--
          emitPending()
        }
      })
    }

    const engine = {
      push(chunk) {
        if (closed || chunk.format !== 'pcm') return
        const dur = chunk.t1 - chunk.t0
        const data = chunk.data instanceof Float32Array ? chunk.data : Float32Array.from(chunk.data, (v) => v / 32768)
        if (!cur) {
          if (!chunk.voice) return // silencio inicial: no abre fragmento
          cur = { id: `wh-${++idc}`, parts: [], t0: chunk.t0, t1: chunk.t1, voiceMs: 0, silenceMs: 0 }
        }
        cur.parts.push(data)
        cur.t1 = chunk.t1
        if (chunk.voice) { cur.voiceMs += dur; cur.silenceMs = 0 } else cur.silenceMs += dur
        if (cur.silenceMs >= cfg.silenceMs || cur.t1 - cur.t0 >= cfg.maxSegmentMs) flush()
      },
      pause() { flush() },
      resume() {},
      async finish() {
        flush()
        await queue
        closed = true
        cur = null
        return { audioDeleted: true }
      },
      async abort() {
        closed = true
        cur = null
        return { audioDeleted: true }
      }
    }
    if (ctx.signal && typeof ctx.signal.addEventListener === 'function') ctx.signal.addEventListener('abort', () => { closed = true; cur = null })
    return engine
  }

  // ---------------------------------------------------------------------------------------------------------------
  // SpeechRecognition del navegador (remoto en Chrome)
  // ---------------------------------------------------------------------------------------------------------------
  function createWebSpeechAdapter(o = {}) {
    const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
    const cfg = { id: 'web-speech', ...o }
    return {
      id: cfg.id,
      capabilities: {
        location: 'remote',
        input: { format: 'self' }, // el reconocedor captura por su cuenta; el adaptador emite level y capture
        partials: true,
        vad: false,
        diarization: false,
        offlineBuffer: false,
        storesAudio: 'none'
      },
      async check() {
        if (!SR) throw fault('service-unavailable')
      },
      async open(ctx) {
        if (!SR) throw fault('service-unavailable')
        // Nivel real del micrófono para la onda (el reconocedor no lo da): AnalyserNode propio
        let stream
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (e) {
          const name = e && e.name
          if (name === 'NotAllowedError' || name === 'SecurityError') throw fault('permission-denied')
          if (name === 'NotFoundError') throw fault('no-device')
          if (name === 'NotReadableError') throw fault('device-busy')
          throw fault('unsupported')
        }
        return createWebSpeechSession(ctx, SR, stream)
      }
    }
  }

  function createWebSpeechSession(ctx, SR, stream) {
    let closed = false
    let active = false
    let idc = 0
    let cur = null
    let t0 = now()
    const elapsed = () => Math.round(now() - t0)
    const emit = (type, payload) => { if (!closed) ctx.emit(type, payload) }

    const ac = new (window.AudioContext || window.webkitAudioContext)()
    const src = ac.createMediaStreamSource(stream)
    const an = ac.createAnalyser()
    an.fftSize = 1024
    src.connect(an)
    const buf = new Float32Array(an.fftSize)
    const levelTimer = setInterval(() => {
      if (closed) return
      an.getFloatTimeDomainData(buf)
      let s = 0
      for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i]
      const rms = Math.sqrt(s / buf.length)
      const db = 20 * Math.log10(rms || 1e-8)
      emit('level', { value: Math.min(1, Math.max(0, (db + 60) / 50)) })
    }, 100)
    stream.getAudioTracks().forEach((tr) => {
      tr.addEventListener('ended', () => emit('capture', { state: 'ended' }))
      tr.addEventListener('mute', () => emit('capture', { state: 'muted' }))
    })

    let rec = null
    let segStart = 0
    function start() {
      if (closed || active) return
      rec = new SR()
      rec.continuous = true
      rec.interimResults = true
      rec.lang = ctx.language || 'es'
      rec.onresult = (ev) => {
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i]
          const text = String(r[0].transcript || '').trim()
          if (!cur) { cur = { id: `ws-${++idc}` }; segStart = elapsed() }
          if (r.isFinal) {
            if (text) emit('final', { id: cur.id, text, speaker: null, t0: segStart, t1: elapsed(), confidence: r[0].confidence })
            cur = null
          } else if (text) emit('partial', { id: cur.id, text: text.toLowerCase(), speaker: null })
        }
      }
      rec.onerror = (ev) => {
        if (closed) return
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') emit('error', { kind: 'service-unavailable', fatal: true, audio: 'none' })
        else if (ev.error === 'network') emit('error', { kind: 'service-unavailable', fatal: true, audio: 'none' })
        // 'no-speech' y 'aborted' son normales: onend reinicia
      }
      rec.onend = () => {
        active = false
        if (!closed && wanted) setTimeout(start, 150) // Chrome corta tras unos segundos de silencio: se reanuda
      }
      try { rec.start(); active = true } catch (e) { active = false }
    }
    let wanted = true
    function stop() {
      wanted = false
      if (rec) { try { rec.stop() } catch (e) {} }
    }
    function shutdown() {
      closed = true
      stop()
      clearInterval(levelTimer)
      stream.getTracks().forEach((t) => t.stop())
      ac.close().catch(() => {})
    }

    const engine = {
      push() {},
      pause() { stop(); cur = null },
      resume() { wanted = true; start() },
      async finish() {
        stop()
        await new Promise((r) => setTimeout(r, 400)) // deja llegar el último final
        shutdown()
        return { audioDeleted: true }
      },
      async abort() { shutdown(); return { audioDeleted: true } }
    }
    if (ctx.signal && typeof ctx.signal.addEventListener === 'function') ctx.signal.addEventListener('abort', shutdown)
    setTimeout(() => { emit('capture', { state: 'live' }); start() }, 0)
    return engine
  }

  window.PlaygroundSpeechAdapters = { createWhisperAdapter, createWebSpeechAdapter }
})()
