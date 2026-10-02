// Captura de audio de la captura de voz (interno; dueño: bruno). Contrato: design/contracts/speech.md §3 (DECISIONS.md #215).
// getUserMedia → AudioContext con un AnalyserNode para el nivel (independiente del motor) → entrega al adaptador en el
// formato que declara: PCM (AudioWorklet, mono, remuestreado a `sampleRate`, en trozos de `chunkMs`) o codificado
// (MediaRecorder con el primer `mimeType` admitido y `timeslice`). Grana no hace red: los trozos van al adaptador en memoria.
// Solo en el cliente y solo cuando el gestor lo pide (con GSpeechHost montado): importar el módulo no toca nada.

// Nombre del procesador del AudioWorklet (se registra una vez por AudioContext desde un Blob en memoria)
const PROCESSOR = 'g-speech-pcm'
// El procesador agrupa bloques de 128 muestras para no enviar ~375 mensajes por segundo
const WORKLET = `class P extends AudioWorkletProcessor {
  constructor() { super(); this.b = new Float32Array(2048); this.n = 0 }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0]
    if (ch) {
      for (let i = 0; i < ch.length; i++) {
        this.b[this.n++] = ch[i]
        if (this.n === this.b.length) { this.port.postMessage(this.b.slice(0)); this.n = 0 }
      }
    }
    return true
  }
}
registerProcessor('${PROCESSOR}', P)`

const AC = () => (typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : undefined)
const err = (name, message) => {
  const e = new Error(message || name)
  e.name = name
  return e
}

/**
 * Crea (y reanuda) el AudioContext DENTRO del gesto del usuario, antes de cualquier espera: WebKit/Safari solo lo deja
 * correr si se crea o reanuda en el gesto. Devuelve null si el navegador no tiene Web Audio.
 */
export function primeAudio() {
  const Ctor = AC()
  if (!Ctor) return null
  try {
    const ctx = new Ctor()
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume().catch(() => {})
    return ctx
  } catch {
    return null
  }
}

export function closeAudio(ctx) {
  if (ctx && typeof ctx.close === 'function' && ctx.state !== 'closed') ctx.close().catch(() => {})
}

/** Errores de getUserMedia (y de soporte) → [estado, kind] (speech.md §3.4) */
export function mapCaptureError(e) {
  const n = e && e.name
  if (n === 'NotAllowedError' || n === 'PermissionDeniedError') return ['denied', 'permission-denied']
  if (n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'DevicesNotFoundError') return ['unavailable', 'no-device']
  if (n === 'NotReadableError' || n === 'AbortError' || n === 'TrackStartError') return ['unavailable', 'device-busy']
  return ['unavailable', 'unsupported']
}

/** Nivel 0..1 desde el RMS del dominio temporal: dBFS entre minDb y maxDb, recortado */
export function levelFromRms(rms, minDb, maxDb) {
  if (!(rms > 0)) return 0
  const db = 20 * Math.log10(rms)
  return Math.max(0, Math.min(1, (db - minDb) / (maxDb - minDb)))
}

/** Remuestreo lineal continuo (conserva la fase entre bloques) de `from` Hz a `to` Hz */
export function createResampler(from, to) {
  const step = from / to
  let pos = 0 // posición fraccionaria en el bloque actual, relativa a su inicio
  let last = 0 // última muestra del bloque anterior (para interpolar el borde)
  return (block) => {
    if (from === to) return Float32Array.from(block)
    const out = []
    // pos puede ser negativa (entre la última muestra anterior y la primera de este bloque)
    while (pos < block.length - 1 || (pos < 0)) {
      const i = Math.floor(pos)
      const f = pos - i
      const a = i < 0 ? last : block[i]
      const b = block[i + 1]
      out.push(a + (b - a) * f)
      pos += step
    }
    pos -= block.length
    last = block[block.length - 1]
    return Float32Array.from(out)
  }
}

const toInt16 = (f32) => {
  const out = new Int16Array(f32.length)
  for (let i = 0; i < f32.length; i++) {
    const v = Math.max(-1, Math.min(1, f32[i]))
    out[i] = v < 0 ? v * 0x8000 : v * 0x7fff
  }
  return out
}

/**
 * Abre la captura. Lanza un error con `name` (los de getUserMedia, o NotSupportedError) que el gestor traduce con
 * mapCaptureError. Devuelve { track, stop() }.
 * @param {{ ctx: AudioContext|null, input: object, frameMs: number, chunkMs: number, minDb: number, maxDb: number,
 *   onFrame: (f: { level: number, flat: boolean }) => void, onChunk: (c: object) => void,
 *   onEnded: () => void, onMuted: () => void }} o
 */
export async function openCapture(o) {
  const { input, frameMs, chunkMs, minDb, maxDb, onFrame, onChunk, onEnded, onMuted } = o
  let ctx = o.ctx
  const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined
  if (!md || typeof md.getUserMedia !== 'function') throw err('NotSupportedError', 'sin mediaDevices (contexto no seguro)')
  if (!ctx) ctx = primeAudio()
  if (!ctx) throw err('NotSupportedError', 'sin AudioContext')
  // Antes de abrir el micrófono: el formato codificado necesita un mimeType admitido
  let mimeType = null
  if (input.format === 'encoded') {
    const MR = typeof MediaRecorder !== 'undefined' ? MediaRecorder : undefined
    mimeType = MR ? input.mimeTypes.find((t) => { try { return MR.isTypeSupported(t) } catch { return false } }) : undefined
    if (!mimeType) { closeAudio(ctx); throw err('NotSupportedError', 'ningún mimeType admitido') }
  }
  if (input.format === 'pcm' && !(ctx.audioWorklet && typeof ctx.audioWorklet.addModule === 'function')) {
    closeAudio(ctx)
    throw err('NotSupportedError', 'sin AudioWorklet')
  }

  let stream
  try {
    stream = await md.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })
  } catch (e) {
    closeAudio(ctx)
    throw e
  }
  const track = stream.getAudioTracks ? stream.getAudioTracks()[0] : null
  if (!track) {
    stream.getTracks().forEach((t) => t.stop())
    closeAudio(ctx)
    throw err('NotFoundError', 'sin pista de audio')
  }

  const parts = { interval: null, worklet: null, recorder: null, url: null, nodes: [] }
  let stopped = false
  const handleEnded = () => { if (!stopped) onEnded() }
  const handleMute = () => { if (!stopped) onMuted() }
  function stop() {
    if (stopped) return
    stopped = true
    clearInterval(parts.interval)
    track.removeEventListener('ended', handleEnded)
    track.removeEventListener('mute', handleMute)
    if (parts.worklet) { try { parts.worklet.port.onmessage = null; parts.worklet.disconnect() } catch { /* ya desconectado */ } }
    if (parts.recorder && parts.recorder.state !== 'inactive') { try { parts.recorder.stop() } catch { /* sin efecto */ } }
    parts.nodes.forEach((n) => { try { n.disconnect() } catch { /* ya desconectado */ } })
    stream.getTracks().forEach((t) => t.stop())
    closeAudio(ctx)
    if (parts.url && typeof URL !== 'undefined' && URL.revokeObjectURL) URL.revokeObjectURL(parts.url)
  }

  try {
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      // En WebKit sin gesto puede no resolver: no se espera para siempre (el vigilante detecta la falta de fotogramas)
      await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 500))])
    }
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 1024
    // Silencio hacia la salida: algunos motores (WebKit) no procesan nodos que no llegan al destino
    const mute = ctx.createGain()
    mute.gain.value = 0
    source.connect(analyser)
    analyser.connect(mute)
    mute.connect(ctx.destination)
    parts.nodes.push(source, analyser, mute)

    if (input.format === 'pcm') {
      if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
        parts.url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }))
      }
      await ctx.audioWorklet.addModule(parts.url)
      const node = new AudioWorkletNode(ctx, PROCESSOR, { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1, channelCountMode: 'explicit' })
      parts.worklet = node
      source.connect(node)
      node.connect(mute)
      const rate = input.sampleRate
      const resample = createResampler(ctx.sampleRate, rate)
      const per = Math.max(1, Math.round((rate * input.chunkMs) / 1000))
      let buf = new Float32Array(per)
      let n = 0
      node.port.onmessage = (ev) => {
        if (stopped) return
        const out = resample(ev.data)
        for (let i = 0; i < out.length; i++) {
          buf[n++] = out[i]
          if (n === per) {
            onChunk({ format: 'pcm', data: input.sampleFormat === 's16' ? toInt16(buf) : buf, durationMs: (per / rate) * 1000 })
            buf = new Float32Array(per)
            n = 0
          }
        }
      }
    } else if (input.format === 'encoded') {
      const rec = new MediaRecorder(stream, { mimeType })
      parts.recorder = rec
      rec.ondataavailable = (ev) => { if (ev.data && ev.data.size > 0) onChunk({ format: 'encoded', mimeType, data: ev.data }) }
      rec.start(input.timeslice)
    }
  } catch (e) {
    stop()
    throw err('NotSupportedError', e && e.message)
  }

  track.addEventListener('ended', handleEnded)
  track.addEventListener('mute', handleMute)

  // Fotogramas: solo si el contexto corre, la pista está viva y no silenciada y el reloj de audio avanza
  const data = new Float32Array(1024)
  let lastTime = -1
  parts.interval = setInterval(() => {
    if (stopped || ctx.state !== 'running' || track.readyState !== 'live' || track.muted) return
    if (typeof ctx.currentTime === 'number') {
      if (ctx.currentTime === lastTime) return
      lastTime = ctx.currentTime
    }
    const analyserNode = parts.nodes[1]
    analyserNode.getFloatTimeDomainData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
    const rms = Math.sqrt(sum / data.length)
    onFrame({ level: levelFromRms(rms, minDb, maxDb), flat: rms === 0 })
  }, frameMs)

  return { track, stop }
}
