// Captura de voz · datos de presentación compartidos por la pill (colocada y flotante), el panel y el disparador
// (interno; dueño: bruno). Contrato: design/contracts/speech.md §2.1, §6.4, §7.3, §9.
import { computed } from 'vue'
import { FILLED, STATE_ICON, formatTime, isCapturing, isProblem } from './speech.js'

// Lectura de un texto sin aviso (para atributos de botones ocultos: GBtn icon necesita aria-label al montarse)
export function peek(api, path) {
  let v = api.opts.labels
  for (const p of path.split('.')) {
    if (v === null || v === undefined || typeof v !== 'object') return undefined
    v = v[p]
  }
  return typeof v === 'string' ? v : undefined
}

// Un sufijo oculto se separa con coma del texto visible («Grabando, abrir panel») salvo que ya traiga puntuación
export const suffix = (text) => (!text ? '' : /^[\s,.;:·–—-]/.test(text) ? text : `, ${text}`)
// Elemento raíz de un componente: GBtn tiene dos raíces (botón y región de estado), así que su $el es el ancla de texto
export function elOf(c) {
  let n = c && c.$el
  while (n && n.nodeType !== 1) n = n.nextSibling
  return n || null
}
// Un prefijo oculto («Duración:») va seguido de un espacio
export const prefix = (text) => (!text ? '' : /\s$/.test(text) ? text : `${text} `)

export function useSpeechView(api) {
  const S = api.state
  const t = api.t
  const status = computed(() => S.status)
  // Captura viva: también en reconnecting con captura (is-live, §14)
  const live = computed(() => S.capture === 'live' && (isCapturing(S.status) || S.status === 'reconnecting'))
  const problem = computed(() => isProblem(S.status))
  const icon = computed(() => STATE_ICON[S.status])
  const filled = computed(() => FILLED.includes(S.status))
  const spinning = computed(() => S.status === 'processing')
  const captured = computed(() => S.duration > 0 || Boolean(S.transcript && S.transcript.segments.length))
  const recoverable = computed(() => !S.error || S.error.recoverable !== false)
  const short = computed(() => {
    if (S.status === 'idle') return ''
    if (S.status === 'reconnecting' && live.value) return t('states.reconnecting.shortLive')
    return t(`states.${S.status}.short`)
  })
  const errorText = computed(() => (problem.value && S.error ? api.composeError(S.error) : null))
  const long = computed(() => {
    const st = S.status
    if (st === 'idle') return ''
    if (problem.value && errorText.value && errorText.value.title) return errorText.value.title
    if (st === 'requesting' && S.permission === 'granted') return t('states.requesting.longGranted')
    if (st === 'reconnecting' && live.value) return t('states.reconnecting.longLive')
    return t(`states.${st}.long`)
  })
  // Duración: oculta en requesting y ready (y sin sesión); esencial, «Ocultar actividad» no la quita (§7.3)
  const showTime = computed(() => !['idle', 'requesting', 'ready'].includes(S.status))
  const time = computed(() => formatTime(S.duration))
  const datetime = computed(() => `PT${Math.floor(S.duration / 1000)}S`)
  // Alternar: el mismo botón cambia de nombre e icono (§7.3)
  const toggle = computed(() => {
    if (live.value) return { action: 'pause', label: t('actions.pause'), icon: 'pause' }
    if (S.status === 'paused' || (problem.value && recoverable.value && captured.value)) return { action: 'resume', label: t('actions.resume'), icon: 'mic' }
    if (problem.value && recoverable.value) return { action: 'resume', label: t('actions.retry'), icon: 'rotate-ccw' }
    return null
  })
  const canFinish = computed(() => isCapturing(S.status) || S.status === 'paused' || S.status === 'reconnecting' || (problem.value && captured.value))
  return { S, status, live, problem, icon, filled, spinning, captured, recoverable, short, long, errorText, showTime, time, datetime, toggle, canFinish }
}
