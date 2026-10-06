// Adaptador de subida SIMULADO de GFileField (dueño: bruno). Contrato: design/contracts/file-field.md «Entrega y empaquetado»
// (#367, #369). Solo para pruebas, demos y documentación: viaja en la entrada `@grana/vue/testing`, NUNCA en el paquete
// principal ni en `@grana/vue/file-field`. Sin red: progreso por pasos con temporizadores, fallo al primer intento, fallo
// siempre, lento, sin conexión y AbortError al cancelar (el de kiwi, design/lab/file-field/engine.js). Sus opciones y
// controles los fija bruno (GFileField.meta.json, «testing»); no forman parte del contrato del adaptador. Sin dependencias.

const toTest = (v) => {
  if (!v) return () => false
  if (typeof v === 'function') return v
  if (v instanceof RegExp) return (name) => { v.lastIndex = 0; return v.test(name) }
  return () => true
}
const abortError = () => {
  try {
    return new DOMException('The upload was aborted.', 'AbortError')
  } catch {
    return Object.assign(new Error('The upload was aborted.'), { name: 'AbortError' })
  }
}

/**
 * @param {object} [options]
 * @param {number} [options.interval=120] ms entre pasos de progreso (se divide por `speed`)
 * @param {number} [options.steps=12] pasos hasta el 100 %
 * @param {number} [options.slowSteps=40] pasos de un archivo «lento»
 * @param {number} [options.speed=1] multiplicador de velocidad
 * @param {RegExp|Function|boolean} [options.failOnce=/falla|fail/i] nombre que falla al PRIMER intento (al llegar a `failAt`)
 * @param {RegExp|Function|boolean} [options.failAlways=/servidor|server/i] nombre que falla SIEMPRE (al 20 %)
 * @param {RegExp|Function|boolean} [options.slow=/lento|slow/i] nombre que sube con `slowSteps`
 * @param {RegExp|Function|boolean} [options.noValue=false] nombre que resuelve sin value (el campo lo pasa a error)
 * @param {number} [options.failAt=0.45] fracción a la que falla `failOnce`
 * @param {string} [options.failMessage] mensaje del fallo al primer intento
 * @param {string} [options.serverMessage] mensaje del fallo de `failAlways`
 * @param {string} [options.offlineMessage] mensaje sin conexión
 * @param {boolean} [options.offline=false] sin conexión: cada subida (y las que estén en curso) rechaza con offlineMessage
 * @param {(file: File, n: number) => string|number} [options.value] value que resuelve (por defecto `srv-<n>`)
 * @param {(file: File) => string|null} [options.url] url que resuelve (por defecto ninguna)
 * @returns {Function} el adaptador `(file, { signal, progress }) => Promise<{ value, url? }>` con controles:
 *   setOffline(bool), setSpeed(n), stats() → { calls, active, done, failed, aborted }, attempts(name) → n, reset()
 */
export function createSimulatedUploader(options = {}) {
  const cfg = {
    interval: 120,
    steps: 12,
    slowSteps: 40,
    speed: 1,
    failOnce: /falla|fail/i,
    failAlways: /servidor|server/i,
    slow: /lento|slow/i,
    noValue: false,
    failAt: 0.45,
    failMessage: 'Simulated: connection lost',
    serverMessage: 'Simulated: rejected by the server',
    offlineMessage: 'Simulated: offline',
    offline: false,
    value: (file, n) => `srv-${n}`,
    url: () => null,
    ...options
  }
  const failOnce = toTest(cfg.failOnce)
  const failAlways = toTest(cfg.failAlways)
  const slow = toTest(cfg.slow)
  const noValue = toTest(cfg.noValue)
  const attempts = new Map()
  const running = new Set()
  const stats = { calls: 0, active: 0, done: 0, failed: 0, aborted: 0 }
  let seq = 0

  function upload(file, { signal, progress } = {}) {
    stats.calls++
    const name = String(file && file.name)
    const attempt = (attempts.get(name) || 0) + 1
    attempts.set(name, attempt)
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) {
        stats.aborted++
        return reject(abortError())
      }
      const total = (file && file.size) || 1
      const steps = Math.max(1, slow(name, file) ? cfg.slowSteps : cfg.steps)
      const failsAt = failAlways(name, file) ? 0.2 : failOnce(name, file) && attempt === 1 ? cfg.failAt : null
      let i = 0
      let timer = null
      stats.active++
      const job = { fail: null }
      const finish = (fn, kind) => {
        clearTimeout(timer)
        running.delete(job)
        stats.active--
        if (kind) stats[kind]++
        if (signal) signal.removeEventListener('abort', onAbort)
        fn()
      }
      const onAbort = () => finish(() => reject(abortError()), 'aborted')
      job.fail = (message) => finish(() => reject({ message }), 'failed')
      running.add(job)
      if (signal) signal.addEventListener('abort', onAbort, { once: true })
      const tick = () => {
        if (cfg.offline) return job.fail(cfg.offlineMessage)
        i++
        const frac = Math.min(1, i / steps)
        if (typeof progress === 'function') progress(Math.round(total * frac), total)
        if (failsAt !== null && frac >= failsAt) return job.fail(failAlways(name, file) ? cfg.serverMessage : cfg.failMessage)
        if (frac >= 1) {
          const n = ++seq
          return finish(() => resolve(noValue(name, file) ? { value: null } : { value: cfg.value(file, n), url: cfg.url(file) ?? undefined }), 'done')
        }
        timer = setTimeout(tick, cfg.interval / (cfg.speed || 1))
      }
      timer = setTimeout(tick, cfg.interval / (cfg.speed || 1))
    })
  }
  /** Sin conexión: rechaza lo que esté en curso y cada subida nueva. */
  upload.setOffline = (on) => {
    cfg.offline = Boolean(on)
    if (cfg.offline) for (const job of [...running]) job.fail(cfg.offlineMessage)
  }
  upload.setSpeed = (n) => { cfg.speed = Number(n) > 0 ? Number(n) : 1 }
  upload.stats = () => ({ ...stats })
  upload.attempts = (name) => attempts.get(name) || 0
  upload.reset = () => {
    attempts.clear()
    stats.calls = stats.done = stats.failed = stats.aborted = 0
    cfg.offline = false
  }
  return upload
}
