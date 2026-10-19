// Isla de estado · gestor de condiciones y motor de lectura y relevo (dueño: bruno)
// Contrato: design/contracts/status.md · Patrón: docs/contract/api.md («Servicios imperativos») · DECISIONS.md #315 a #328 y
// #693 a #705 (la isla transitoria, D1 · Cápsula de relevo).
// Una condición es ESTADO con clave (`id`), no un suceso: declararla otra vez la sustituye en el mismo elemento y dura en el
// MODELO hasta que la aplicación la quita, se resuelve, la persona la descarta o su origen sale del documento. La VISTA es
// transitoria: el gestor elige qué condición ocupa el titular (cola por gravedad y llegada), mide su tiempo de lectura (el de
// GToast, #142) con pausas, la releva y decide cuándo se recoge; la región (GStatusIsland) pinta las etapas y le avisa de
// cuándo el texto ya se ve (`shown`) y de cuándo terminó de subir (`collapsed`).
// Estado puro y métodos: importar este módulo y llamar a createStatus no toca document, window ni navigator (SSR). Ningún
// temporizador corre sin una región montada y lista (`ready`).
import { computed, hasInjectionContext, inject, markRaw, reactive, watch } from 'vue'
import { fill } from '../../utils/template.js'
import { RESUME_MIN, TOAST_DURATION, parseHotkey } from '../GToast/toaster.js'

export const STATUS_TYPES = ['info', 'success', 'warning', 'error']
export const STATUS_POSITIONS = ['top-center', 'top-start', 'top-end']
// Icono de cada tipo (lista de la librería; la misma convención que GToast)
export const STATUS_ICONS = { info: 'info', success: 'circle-check', warning: 'triangle-alert', error: 'circle-alert' }
// Gravedad: orden de turno y de la lista
const SEVERITY = { error: 0, warning: 1, info: 2, success: 3 }
const POLITENESS = ['polite', 'assertive']
// Umbrales de la cuenta atrás que se anuncian y vuelven a mostrar la condición (ms; constantes neutras, tokens.md §31)
export const DEADLINE_MARKS = Object.freeze([300000, 60000, 30000])
// El titular recorta con elipsis a partir de aquí (aviso de desarrollo 10)
export const TITLE_LIMIT = 60
const CONDITION_KEYS = ['type', 'title', 'description', 'details', 'action', 'link', 'origin', 'persistent', 'dismissible', 'deadline', 'politeness', 'onRemove', 'onExpire']
const OPTION_KEYS = ['position', 'offset', 'hotkey', 'duration', 'labels']
const RETIRED_LABELS = ['acknowledge', 'summary', 'more']

// Clave de inyección y acceso interno de los componentes al gestor (no es API pública)
export const statusKey = Symbol('GStatus')
export const INTERNAL = Symbol('GStatus.internal')

const PREFIX = '[Grana Status]'
const isClient = () => typeof window !== 'undefined' && typeof document !== 'undefined'
const now = () => Date.now()
const validOffset = (v) => v === undefined || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && v.trim() !== '')
const validId = (id) => (typeof id === 'string' && id !== '') || (typeof id === 'number' && Number.isFinite(id))
const text = (v) => (typeof v === 'string' && v.trim() ? v : undefined)

/** `m:ss` (`h:mm:ss` desde una hora) de un resto en ms; nunca negativo. */
export function formatRemaining(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const s = String(total % 60).padStart(2, '0')
  const m = Math.floor(total / 60) % 60
  const h = Math.floor(total / 3600)
  return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`
}
/** Texto con cuenta: `label` es String con `{count}` o Function (#51). */
export const countText = (label, count) => (typeof label === 'function' ? String(label(count) ?? '') : fill(label, { count }))
/** Tiempo de lectura de un titular (#142, #696): `duration` del gestor; `'auto'` según título + descripción. */
export function readTime(duration, r) {
  if (duration === false) return Infinity
  if (typeof duration === 'number') return duration
  const n = r.title.length + (r.description ? r.description.length : 0)
  return Math.min(TOAST_DURATION.max, Math.max(TOAST_DURATION.min, TOAST_DURATION.base + TOAST_DURATION.perChar * n))
}

export function createStatus(options = {}) {
  const warned = new Set()
  const warn = (msg) => {
    try {
      if (process.env.NODE_ENV !== 'production' && !warned.has(msg)) {
        warned.add(msg)
        console.warn(`${PREFIX} ${msg}`)
      }
    } catch {}
  }

  // Estado reactivo. Vista (la escribe el motor; la región la pinta): `ready` = hay una región montada y lista (is-ready);
  // `current` = uid en el titular (0 = ninguno); `leaving` = uid que se recoge (fold → rise); `explicit` = la recogida la pidió
  // la persona (no la cancelan el puntero ni el foco); `list` = la lista abierta (en móvil, la hoja); `peek` = asomo abierto
  // por '' | 'pointer' | 'focus' | 'touch'; `hold` = pausas de la región; `markHold` = ficha de marca → id de su condición
  // (puntero o foco sobre una marca enlace); `reading` = el texto del titular ya se ve y corre (o espera) su tiempo; `ring` =
  // tramo del anillo (fracción que queda al empezar y ms del tramo); `regionId` = id de la raíz de la isla (aria-controls de
  // las marcas); `now` = reloj de la cuenta atrás (lo avanza la región, un intervalo de 1 s). `items` va en orden de llegada.
  const state = reactive({
    opts: { position: 'top-center', offset: {}, hotkey: 'Alt+F8', duration: 'auto', labels: {} },
    hotkeyKeys: parseHotkey('Alt+F8').keys,
    items: [],
    ready: false,
    current: 0,
    leaving: 0,
    explicit: false,
    list: false,
    peek: '',
    hold: { pointer: false, focus: false, touch: false, hidden: false },
    markHold: {},
    reading: false,
    ring: { seg: 0, left: 1, run: 0 },
    mobile: false,
    attached: false,
    regionId: '',
    now: 0
  })

  let uidSeq = 0
  let sinceSeq = 0
  let arrSeq = 0
  let runSeq = 0
  let region = null
  let checkedRegion = false
  const claims = new Map() // id → nº de <GStatus> montados con esa clave
  const marks = new Map() // id → Set de fichas de GStatusMark enlace ({ el(), echo() })

  // ---------- Opciones del gestor ----------
  function applyOptions(patch, initial) {
    if (!patch || typeof patch !== 'object') return
    const o = state.opts
    for (const key of Object.keys(patch)) {
      const v = patch[key]
      if (key === 'autoOpen') { try { if (process.env.NODE_ENV !== 'production') warn('autoOpen está retirada (#696).') } catch {} continue }
      if (!OPTION_KEYS.includes(key)) { try { if (process.env.NODE_ENV !== 'production') warn(`opción desconocida «${key}»: se ignora.`) } catch {} continue }
      if (key === 'position') {
        if (STATUS_POSITIONS.includes(v)) o.position = v
        else try { if (process.env.NODE_ENV !== 'production') warn(`position «${v}» no es válida (${STATUS_POSITIONS.join(', ')}): se conserva «${o.position}».`) } catch {}
      } else if (key === 'duration') {
        if (v === 'auto' || v === false) o.duration = v
        else if (typeof v === 'number' && Number.isFinite(v)) {
          try { if (process.env.NODE_ENV !== 'production' && v < TOAST_DURATION.min) warn(`duration ${v} ms es menor que 5000: se usa 5000.`) } catch {}
          o.duration = Math.max(TOAST_DURATION.min, v)
        } else try { if (process.env.NODE_ENV !== 'production') warn(`duration «${v}» no es válida: se conserva.`) } catch {}
      } else if (key === 'hotkey') {
        const parsed = parseHotkey(v)
        const mods = parsed.keys ? parsed.keys.mods : null
        const only = (...on) => mods && Object.entries(mods).every(([k, x]) => x === on.includes(k))
        if (!parsed.ok) try { if (process.env.NODE_ENV !== 'production') warn(`hotkey «${v}» no se puede interpretar (sintaxis de aria-keyshortcuts, p. ej. «Alt+F8»): se conserva.`) } catch {}
        else if (parsed.keys && parsed.keys.key === 'F6' && only()) try { if (process.env.NODE_ENV !== 'production') warn('hotkey «F6» lo usa el navegador para moverse entre la página y sus barras: se conserva el anterior.') } catch {}
        else {
          try { if (process.env.NODE_ENV !== 'production' && parsed.keys && parsed.keys.key === 'F8' && (only() || only('Shift'))) warn(`hotkey «${v}» coincide con el atajo de ${only() ? 'los avisos (GToaster)' : 'la captura de voz'}: se acepta, pero chocan si conviven.`) } catch {}
          o.hotkey = parsed.value
          state.hotkeyKeys = parsed.keys
        }
      } else if (key === 'offset') {
        if (!v || typeof v !== 'object' || !validOffset(v.top)) try { if (process.env.NODE_ENV !== 'production') warn('offset debe ser { top? } con un número (px) o una longitud CSS: se conserva.') } catch {}
        else o.offset = initial ? { ...v } : { ...o.offset, ...v }
      } else if (key === 'labels') {
        if (!v || typeof v !== 'object') try { if (process.env.NODE_ENV !== 'production') warn('labels debe ser un objeto: se conserva.') } catch {}
        else {
          const types = v.types && typeof v.types === 'object' ? { ...(o.labels.types || {}), ...v.types } : o.labels.types
          const next = { ...o.labels, ...v, ...(types ? { types } : {}) }
          for (const k of RETIRED_LABELS) {
            if (!(k in v)) continue
            delete next[k]
            try { if (process.env.NODE_ENV !== 'production') warn(`labels.${k} está retirada (#697${k === 'more' ? ': usa waiting' : ''}).`) } catch {}
          }
          o.labels = next
        }
      }
    }
  }
  applyOptions(options, true)

  // ---------- Consultas ----------
  const byId = (id) => state.items.find((r) => r.id === id)
  const byUid = (uid) => (uid ? state.items.find((r) => r.uid === uid) : undefined)
  const cur = () => byUid(state.current)
  // Lista: gravedad y, dentro, `since` más reciente primero (contador monótono: sin empates de reloj)
  const ordered = computed(() => state.items.slice().sort((a, b) => SEVERITY[a.type] - SEVERITY[b.type] || b.sinceSeq - a.sinceSeq))
  // Turno: lo que no se ha visto, por gravedad; dentro, lo relevado primero y después por orden de llegada. Lo que ya cumplió
  // su lectura y no puede recogerse (`done`) va detrás de lo que aún no se leyó.
  const queue = computed(() => state.items.filter((r) => !r.seen && r.uid !== state.current)
    .sort((a, b) => SEVERITY[a.type] - SEVERITY[b.type] || a.done - b.done || b.front - a.front || a.arr - b.arr))
  const markHeld = computed(() => Object.values(state.markHold).some((id) => {
    const r = byId(id)
    return Boolean(r && (r.uid === state.current || r.uid === state.leaving || !r.seen))
  }))
  // Pausa por la persona: nada la releva mientras dura (#702)
  const personHold = computed(() => state.list || state.hold.pointer || state.hold.focus || state.hold.touch || state.peek === 'touch' || markHeld.value)
  const paused = computed(() => {
    const r = cur()
    return personHold.value || Boolean(r && r.busy) || state.hold.hidden || state.opts.duration === false
  })
  const form = computed(() => (state.list ? 'list' : state.current || state.leaving ? 'line' : 'empty'))

  const copy = (r) => Object.freeze({
    id: r.id,
    type: r.type,
    title: r.title,
    ...(r.description ? { description: r.description } : {}),
    ...(r.details ? { details: r.details } : {}),
    ...(r.action ? { action: { ...r.action } } : {}),
    ...(r.link ? { link: { ...r.link } } : {}),
    ...(r.origin ? { origin: { ...r.origin } } : {}),
    persistent: r.persistent,
    dismissible: r.dismissible,
    ...(r.deadline !== undefined ? { deadline: r.deadline } : {}),
    politeness: r.politeness,
    seen: r.seen,
    busy: r.busy,
    since: r.since,
    updatedAt: r.updatedAt
  })
  const publicList = computed(() => Object.freeze(ordered.value.map(copy)))
  const publicState = computed(() => {
    const shown = byUid(state.current || state.leaving)
    return Object.freeze({
      form: form.value,
      peek: Boolean(state.peek) && form.value === 'line',
      paused: paused.value,
      current: shown ? shown.id : null,
      waiting: state.current ? queue.value.length : 0,
      count: state.items.length,
      mobile: state.mobile
    })
  })

  // ---------- Normalizar las opciones de una condición ----------
  // `full` (set): devuelve la declaración completa (lo que no viene queda en su valor por defecto) o `null` sin título.
  // Sin `full` (update): solo las claves presentes.
  function normalize(input, full) {
    const out = {}
    if (!input || typeof input !== 'object') {
      try { if (process.env.NODE_ENV !== 'production' && full) warn('set necesita un objeto de opciones con title: la condición no se registra.') } catch {}
      return full ? null : out
    }
    for (const key of Object.keys(input)) {
      if (key === 'actions') try { if (process.env.NODE_ENV !== 'production') warn('una condición admite una sola action (no «actions»): se ignora.') } catch {}
      else if (!CONDITION_KEYS.includes(key)) try { if (process.env.NODE_ENV !== 'production') warn(`opción de condición desconocida «${key}»: se ignora (solo texto en v0.1).`) } catch {}
    }
    const has = (k) => k in input && input[k] !== undefined
    if (has('type')) {
      if (STATUS_TYPES.includes(input.type)) out.type = input.type
      else try { if (process.env.NODE_ENV !== 'production') warn(`type «${input.type}» no es válido (${STATUS_TYPES.join(', ')}): se usa ${full ? '«info»' : 'el anterior'}.`) } catch {}
    }
    if (full && out.type === undefined) out.type = 'info'
    if ('title' in input) {
      if (typeof input.title === 'string' && input.title.trim()) out.title = input.title.trim()
      else if (!full) try { if (process.env.NODE_ENV !== 'production') warn('update con title vacío: se conserva el anterior.') } catch {}
    }
    if (full && out.title === undefined) {
      try { if (process.env.NODE_ENV !== 'production') warn('una condición necesita title: no se registra.') } catch {}
      return null
    }
    for (const k of ['description', 'details']) {
      if (k in input) {
        const v = input[k]
        if (v === undefined || v === null || v === '') out[k] = undefined
        else if (typeof v === 'string') out[k] = v
        else try { if (process.env.NODE_ENV !== 'production') warn(`${k} debe ser texto: se ignora.`) } catch {}
      } else if (full) out[k] = undefined
    }
    if ('action' in input) {
      const a = input.action
      if (a === undefined || a === null || a === false) out.action = undefined
      else if (Array.isArray(a)) { try { if (process.env.NODE_ENV !== 'production') warn('una condición admite una sola action: se ignora.') } catch {} if (full) out.action = undefined }
      else if (typeof a !== 'object' || !text(a.label) || typeof a.onClick !== 'function') { try { if (process.env.NODE_ENV !== 'production') warn('action necesita label y onClick: se ignora la acción.') } catch {} if (full) out.action = undefined }
      else out.action = { label: a.label, ...(text(a.busyLabel) ? { busyLabel: a.busyLabel } : {}), onClick: a.onClick }
    } else if (full) out.action = undefined
    if ('link' in input) {
      const l = input.link
      if (l === undefined || l === null || l === false) out.link = undefined
      else if (typeof l !== 'object' || !text(l.label) || !text(l.href)) { try { if (process.env.NODE_ENV !== 'production') warn('link necesita label y href: se ignora el enlace.') } catch {} if (full) out.link = undefined }
      else out.link = { label: l.label, href: l.href, ...(text(l.target) ? { target: l.target } : {}), ...(text(l.rel) ? { rel: l.rel } : {}), ...(typeof l.onClick === 'function' ? { onClick: l.onClick } : {}) }
    } else if (full) out.link = undefined
    if ('origin' in input) {
      const g = input.origin
      const okTarget = g && (text(g.target) || typeof g.target === 'function' || (typeof g.target === 'object' && g.target !== null))
      if (g === undefined || g === null || g === false) out.origin = undefined
      else if (typeof g !== 'object' || !text(g.label) || !okTarget) { try { if (process.env.NODE_ENV !== 'production') warn('origin necesita label y target (id, elemento o función): se ignora.') } catch {} if (full) out.origin = undefined }
      else out.origin = { label: g.label, target: typeof g.target === 'object' ? markRaw(g.target) : g.target }
    } else if (full) out.origin = undefined
    if ('persistent' in input) {
      if (input.persistent === undefined || input.persistent === null) out.persistentOpt = undefined
      else if (typeof input.persistent === 'boolean') out.persistentOpt = input.persistent
      else try { if (process.env.NODE_ENV !== 'production') warn('persistent debe ser Boolean: se ignora.') } catch {}
    } else if (full) out.persistentOpt = undefined
    if ('dismissible' in input) out.dismissible = Boolean(input.dismissible)
    else if (full) out.dismissible = false
    if ('deadline' in input) {
      const d = input.deadline
      const ms = d instanceof Date ? d.getTime() : d
      if (d === undefined || d === null) out.deadline = undefined
      else if (typeof ms === 'number' && Number.isFinite(ms)) out.deadline = ms
      else { try { if (process.env.NODE_ENV !== 'production') warn('deadline debe ser una marca de tiempo (Number) o un Date: se ignora.') } catch {} if (full) out.deadline = undefined }
    } else if (full) out.deadline = undefined
    if ('politeness' in input) {
      if (input.politeness === undefined || input.politeness === null) out.politenessOpt = undefined
      else if (POLITENESS.includes(input.politeness)) out.politenessOpt = input.politeness
      else try { if (process.env.NODE_ENV !== 'production') warn(`politeness «${input.politeness}» no es válida (polite, assertive): se ignora.`) } catch {}
    } else if (full) out.politenessOpt = undefined
    for (const k of ['onRemove', 'onExpire']) {
      if (k in input) out[k] = typeof input[k] === 'function' ? input[k] : undefined
      else if (full) out[k] = undefined
    }
    return out
  }

  // Avisos que dependen de la condición ya resuelta (falta un `labels` la primera vez que se necesita, tabla «Textos»)
  function lint(r) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        const L = state.opts.labels
        if (r.type === 'error' && r.politenessOpt === 'polite') warn('un error con politeness «polite» no interrumpe: la persona puede no oírlo a tiempo.')
        if (r.title.length > TITLE_LIMIT) warn(`title de más de ${TITLE_LIMIT} caracteres: el titular de la isla lo recorta con elipsis (el texto completo queda en su nombre accesible y en la lista).`)
        if (!(L.types && L.types[r.type])) warn(`falta labels.types.${r.type}: el tipo queda solo en el icono.`)
        if (r.dismissible && !L.dismiss) warn('falta labels.dismiss: el botón descartar queda sin nombre accesible (se dibuja igual).')
        if (r.details) {
          if (!L.details) warn('falta labels.details: el detalle técnico no se dibuja (sin conmutador no hay detalle).')
          if (!L.copy) warn('falta labels.copy: el detalle técnico va sin botón de copiar.')
          else if (!L.copied) warn('falta labels.copied: copiar el detalle no se anuncia.')
        }
        if (r.deadline !== undefined && !L.remaining) warn('falta labels.remaining: los umbrales de la cuenta atrás no se anuncian.')
      }
    } catch {}
  }

  // ---------- Anuncio (status.md «Anuncios»): `[tipo:] título[.] [descripción]`, sin nombres de botones ----------
  function announceText(r) {
    const L = state.opts.labels
    const parts = []
    const typeLabel = L.types ? L.types[r.type] : undefined
    if (typeLabel) parts.push(`${typeLabel}:`)
    parts.push(r.description && !/[.!?…]$/.test(r.title) ? `${r.title}.` : r.title)
    if (r.description) parts.push(r.description)
    return parts.join(' ')
  }
  // kind: 'appear' | 'change' | 'announce'. La región decide (tras pintar) si el foco ya lo lee.
  function emitEvent(r, kind) {
    if (region) region.event({ uid: r.uid, kind, text: announceText(r), politeness: r.politeness })
  }
  const say = (message, politeness = 'polite') => { if (region && message) region.say(message, politeness) }

  // ---------- Marcas enlace (GStatusMark for): memoria de lo pendiente, vuelta del foco y eco ----------
  const marksOf = (id) => [...(marks.get(id) || [])]
  // «Montada» = conectada y con caja (status.md «Lo que no se recoge solo»)
  const markMounted = (id) => marksOf(id).some((m) => {
    const el = m.el()
    return Boolean(el && el.isConnected && el.getClientRects().length)
  })
  // Lo que no se recoge por tiempo: la cuenta atrás y la acción sin otra vuelta visible (WCAG 2.2.1, #696)
  const sticky = (r) => r.deadline !== undefined || (Boolean(r.action) && !markMounted(r.id))
  // Un resultado que ya se leyó se retira, salvo el que tiene enlace y una marca que lo guarde (#697, motivo `read`)
  function readAway(r) {
    if (r.seen && !r.persistent && r.uid !== state.current && r.uid !== state.leaving && !(r.link && markMounted(r.id))) finish(r, 'read')
  }

  // ---------- Motor de lectura (#696) ----------
  // Un tramo de lectura de la condición del titular: `left` ms quedan; corre si no hay pausa. Al reanudar, ≥ RESUME_MIN.
  let rd = null // { uid, total, left, t0, timer, stopped, held }
  function stopRead() {
    if (rd && rd.timer) clearTimeout(rd.timer)
    rd = null
    state.reading = false
  }
  const remaining = () => (!rd ? undefined : rd.timer ? Math.max(0, rd.left - (now() - rd.t0)) : rd.left)
  function beginRead(r, left) {
    stopRead()
    const total = readTime(state.opts.duration, r)
    // Lo relevado vuelve con lo que le quedaba, nunca menos de RESUME_MIN (#696)
    rd = { uid: r.uid, total, left: left > 0 ? Math.min(total, Math.max(RESUME_MIN, left)) : total, t0: 0, timer: null, stopped: false, held: false }
    state.reading = true
    sync()
  }
  // Pone el tramo en marcha o lo para según la pausa. Escribe el tramo del anillo solo al empezar y al parar (sin escrituras por cuadro).
  function sync() {
    if (!rd || rd.held) return
    const stop = paused.value || rd.total === Infinity
    const frac = () => (rd.total === Infinity ? 1 : rd.left / rd.total)
    if (rd.timer) {
      if (!stop) return
      clearTimeout(rd.timer)
      rd.timer = null
      rd.left = Math.max(0, rd.left - (now() - rd.t0))
      rd.stopped = true
      state.ring = { seg: state.ring.seg, left: frac(), run: rd.left } // el mismo tramo, quieto donde está
      return
    }
    if (stop) {
      if (!rd.stopped) { rd.stopped = true; state.ring = { seg: state.ring.seg + 1, left: frac(), run: rd.left } }
      return
    }
    if (rd.stopped) rd.left = Math.max(rd.left, RESUME_MIN)
    rd.stopped = false
    rd.t0 = now()
    rd.timer = setTimeout(expire, rd.left)
    state.ring = { seg: state.ring.seg + 1, left: frac(), run: rd.left }
  }
  // Acabó el tiempo de la mostrada
  function expire() {
    if (!rd) return
    rd.timer = null
    rd.left = 0
    const r = cur()
    if (!r) return
    if (sticky(r)) {
      r.done = true
      const next = queue.value.find((x) => !x.done)
      if (next) { requeue(r, RESUME_MIN); show(next); return }
      // Se queda con su acción al alcance hasta que la persona la oculte o la condición cambie (aviso 14)
      rd.held = true
      state.ring = { seg: state.ring.seg + 1, left: 0, run: 0 }
      try { if (process.env.NODE_ENV !== 'production' && r.deadline === undefined) warn(`«${r.id}» tiene acción y ninguna marca enlace montada: se queda hasta que la persona la oculte; pon <GStatusMark for="${r.id}"> junto a su control.`) } catch {}
      return
    }
    r.seen = true
    r.done = false
    if (queue.value.length) { show(queue.value[0]); readAway(r); return }
    collapse(false)
  }
  // Devuelve una condición del titular a la cabeza de la cola con lo que le quedaba (mínimo al reanudar)
  function requeue(r, left) {
    r.front = true
    r.left = left
  }
  // Pone una condición en el titular; su lectura empieza cuando la región dice que el texto ya se ve (`shown`)
  function show(r) {
    stopRead()
    state.leaving = 0
    state.explicit = false
    r.front = false
    state.current = r.uid
  }
  // Recoge el titular (fold → rise): lo mostrado pasa a `seen`; la región avisa con `collapsed` al terminar de subir
  function collapse(explicit) {
    const uid = state.current || (state.list && ordered.value[0] ? ordered.value[0].uid : 0)
    const r = cur()
    stopRead()
    state.peek = ''
    state.list = false
    if (r) { r.seen = true; r.done = false }
    if (!uid || !region) { if (state.leaving && explicit) state.explicit = true; return }
    state.current = 0
    state.leaving = uid
    state.explicit = explicit
  }
  // Decide el titular tras cualquier cambio: lo primero de la cola entra si no hay nada; lo más grave releva salvo bajo la mano
  function decide() {
    if (!state.ready || state.list) return
    const q = queue.value
    const r = cur()
    if (!r) {
      if (q.length) show(q[0]) // de vacía, o cancela la recogida en curso (vuelve a grow o a drop desde donde está)
      return
    }
    if (!q.length || personHold.value || r.busy) return
    const head = q[0]
    if (SEVERITY[head.type] < SEVERITY[r.type]) { requeue(r, remaining()); show(head); return }
    // Un titular que ya cumplió su tiempo y no puede recogerse deja paso a lo que aún no se leyó
    if (rd && rd.held) { const next = q.find((x) => !x.done); if (next) { r.done = true; requeue(r, RESUME_MIN); show(next) } }
  }
  // Pausas: al parar o seguir, el tramo; al terminar la pausa de la persona, el relevo pendiente; si la persona toca la isla o
  // la marca de lo que se recoge por tiempo, la recogida se cancela (vuelve con su lectura en pausa y 1000 ms al reanudar)
  watch(paused, () => sync(), { flush: 'sync' })
  watch(personHold, (held) => {
    if (!held) { decide(); return }
    if (state.leaving && !state.explicit) {
      const r = byUid(state.leaving)
      if (r) { r.seen = false; r.left = RESUME_MIN; show(r) }
    }
  }, { flush: 'sync' })

  // ---------- Cuenta atrás ----------
  // Umbrales ya pasados al declarar el plazo: no se anuncian (ya lo dice la propia condición al aparecer)
  function resetDeadline(r) {
    r.expired = false
    r.passed = []
    if (r.deadline === undefined) return
    const left = r.deadline - now()
    r.passed = DEADLINE_MARKS.filter((m) => left <= m)
    state.now = now()
  }
  function remainingText(ms) {
    const l = state.opts.labels.remaining
    if (typeof l === 'function') return String(l(ms) ?? '')
    return l ? fill(l, { time: formatRemaining(ms) }) : ''
  }
  function tick(t = now()) {
    state.now = t
    for (const r of state.items.slice()) {
      if (r.deadline === undefined) continue
      const left = r.deadline - t
      // Varios umbrales de golpe (pestaña dormida): solo se anuncia el menor; cada umbral la vuelve a mostrar (#696)
      const crossed = DEADLINE_MARKS.filter((m) => left <= m && !r.passed.includes(m))
      if (crossed.length) {
        r.passed = r.passed.concat(crossed)
        if (left > 0) {
          say(remainingText(Math.min(...crossed)), 'polite')
          reshow(r)
        }
      }
      if (left <= 0 && !r.expired) {
        r.expired = true
        if (typeof r.onExpire === 'function') {
          try { r.onExpire(copy(r)) } catch (e) { console.error(e) }
        }
      }
    }
    decide()
  }
  // Vuelve a la cola (o, si está en el titular, empieza otra vez su tiempo)
  function reshow(r) {
    if (r.uid === state.current) { if (state.reading) beginRead(r); return }
    if (r.seen) r.arr = ++arrSeq
    r.seen = false
    r.done = false
  }

  // ---------- Aplicar un parche a un registro (en el sitio) ----------
  function apply(r, n) {
    const before = `${r.type}\u0000${r.title}\u0000${r.description || ''}`
    const prevType = r.type
    const hadDeadline = r.deadline
    for (const [k, v] of Object.entries(n)) r[k] = v
    r.persistent = r.persistentOpt !== undefined ? r.persistentOpt : r.type !== 'success'
    r.politeness = r.politenessOpt || (r.type === 'error' ? 'assertive' : 'polite')
    if (r.type !== prevType) {
      r.since = now()
      r.sinceSeq = ++sinceSeq
    }
    if (!r.action && r.busy) { r.busy = false; r.runToken = 0 }
    if ('deadline' in n && n.deadline !== hadDeadline) resetDeadline(r)
    r.updatedAt = now()
    lint(r)
    if (`${r.type}\u0000${r.title}\u0000${r.description || ''}` !== before) {
      reshow(r) // se anuncia y se vuelve a mostrar (en el titular: relevo en el sitio y su tiempo de nuevo)
      emitEvent(r, 'change')
    }
    decide()
  }

  // ---------- Retirada ----------
  function finish(r, reason) {
    const i = state.items.indexOf(r)
    if (i < 0) return false
    const snapshot = copy(r)
    state.items.splice(i, 1)
    if (r.uid === state.current) {
      stopRead()
      state.current = 0
      if (!state.list) {
        const q = queue.value
        if (q.length) show(q[0]) // relevo
        else if (region) { state.leaving = r.uid; state.explicit = false } // se recoge con su texto (la región guarda la copia, I4)
      }
    }
    if (!state.items.length && state.list) { state.list = false; state.peek = ''; state.leaving = state.leaving || r.uid }
    if (typeof r.onRemove === 'function') {
      try { r.onRemove(reason, snapshot) } catch (e) { console.error(e) }
    }
    return true
  }

  // ---------- API pública ----------
  function set(id, input) {
    if (!validId(id)) {
      try { if (process.env.NODE_ENV !== 'production') warn('una condición necesita id (String o Number): no se registra.') } catch {}
      return null
    }
    try {
      if (process.env.NODE_ENV !== 'production' && isClient() && !checkedRegion) {
        checkedRegion = true
        setTimeout(() => { if (!region) warn('set sin ninguna <GStatusIsland> montada para este gestor: las condiciones esperan hasta que se monte.') }, 0)
      }
    } catch {}
    const n = normalize(input, true)
    if (!n) return null
    const existing = byId(id)
    if (existing) {
      apply(existing, n)
      return id
    }
    const t = now()
    state.items.push({
      uid: ++uidSeq, id, ...n,
      persistent: true, politeness: 'polite',
      seen: false, busy: false, runToken: 0, arr: ++arrSeq, front: false, done: false, left: undefined,
      since: t, sinceSeq: ++sinceSeq, updatedAt: t,
      expired: false, passed: []
    })
    const r = state.items[state.items.length - 1] // el proxy reactivo
    r.persistent = r.persistentOpt !== undefined ? r.persistentOpt : r.type !== 'success'
    r.politeness = r.politenessOpt || (r.type === 'error' ? 'assertive' : 'polite')
    resetDeadline(r)
    lint(r)
    emitEvent(r, 'appear')
    decide()
    return id
  }

  function update(id, patch) {
    const r = byId(id)
    if (!r) return false
    apply(r, normalize(patch, false))
    return true
  }

  function removeAs(id, reason) {
    const r = byId(id)
    return r ? finish(r, reason) : false
  }
  const remove = (id) => removeAs(id, 'api')

  // R5 (#697): el resultado queda solo con lo que traiga `result` (sin descripción, detalle, acción, `busy` ni plazo)
  function resolve(id, result) {
    const r = byId(id)
    if (!r) return false
    if (result === undefined || result === null) return finish(r, 'api')
    const extra = typeof result === 'string' ? { title: result } : (typeof result === 'object' ? result : {})
    r.busy = false
    r.runToken = 0
    apply(r, normalize({ type: 'success', persistent: false, description: undefined, details: undefined, action: undefined, deadline: undefined, ...extra }, false))
    return true
  }

  function clear() {
    for (const r of state.items.slice()) finish(r, 'clear')
  }

  function announce(id) {
    const r = byId(id)
    if (!r) return false
    reshow(r)
    emitEvent(r, 'announce')
    decide()
    return true
  }

  // Recoge ya: lo mostrado y lo que esperaba pasa a `seen` (lo mismo que Esc, cerrar la lista, «Ir a…» y el enlace)
  function hide() {
    for (const r of state.items) { r.seen = true; r.done = false }
    collapse(true)
  }
  function acknowledge() {
    try { if (process.env.NODE_ENV !== 'production') warn('acknowledge() está retirado (#697): se hace hide().') } catch {}
    hide()
  }

  function open(id, opts) {
    if (!state.items.length) return false
    const r = id !== undefined && id !== null ? byId(id) : null
    openList()
    if (region) region.opened(r ? r.uid : null, Boolean(opts && opts.focus))
    return true
  }
  function openList() {
    if (!state.items.length || !region) return
    state.peek = ''
    // La lista se abre desde el estado actual: lo que se recogía vuelve a ser el titular (sin lectura: la lista pausa)
    if (!state.current && state.leaving && byUid(state.leaving)) state.current = state.leaving
    state.leaving = 0
    state.explicit = false
    state.list = true
  }

  // Acción y resolución en el sitio (#318, #697)
  function runAction(uid) {
    const r = byUid(uid)
    if (!r || !r.action || r.busy) return
    let out
    try { out = r.action.onClick(copy(r)) } catch (e) { console.error(e); return }
    if (!out || typeof out.then !== 'function') return
    const live = byUid(uid)
    if (!live) return // la propia acción la retiró
    const token = ++runSeq
    live.busy = true
    live.runToken = token
    if (live.action && live.action.busyLabel) say(live.action.busyLabel, 'polite')
    const mine = () => {
      const x = byUid(uid)
      return x && x.runToken === token ? x : null
    }
    out.then(
      (value) => {
        const x = mine()
        if (!x) return // retirada (o resuelta) en curso: el desenlace no la vuelve a crear
        x.busy = false
        x.runToken = 0
        try {
          if (value && typeof value === 'object') {
            if (value.type === 'success') resolve(x.id, value) // un éxito no arrastra la traza del fallo (F4)
            else update(x.id, value)
          }
        } catch (e) { console.error(e) }
        decide()
      },
      () => {
        // El gestor consume el rechazo (la promesa es suya); el reintento falló otra vez: se reanuncia y se vuelve a mostrar
        const x = mine()
        if (!x) return
        x.busy = false
        x.runToken = 0
        announce(x.id)
      }
    )
  }

  function configure(patch) {
    applyOptions(patch, false)
  }

  const status = {
    set,
    info: (id, title, o) => set(id, { ...(o || {}), type: 'info', title }),
    success: (id, title, o) => set(id, { ...(o || {}), type: 'success', title }),
    warning: (id, title, o) => set(id, { ...(o || {}), type: 'warning', title }),
    error: (id, title, o) => set(id, { ...(o || {}), type: 'error', title }),
    update,
    resolve,
    remove,
    clear,
    announce,
    hide,
    acknowledge,
    open,
    close: hide,
    has: (id) => Boolean(byId(id)),
    get: (id) => {
      const r = byId(id)
      return r ? copy(r) : undefined
    },
    configure,
    get conditions() { return publicList.value },
    get state() { return publicState.value },
    install(app) { app.provide(statusKey, status) }
  }

  // ---------- Acceso de los componentes (GStatusIsland, GStatusMark, GStatus) ----------
  // ready: la región terminó de montarse (is-ready): lo presente al cargar entra con su caída. shown(uid): el texto de esa
  // condición ya se ve (fin de grow, o relevo): empieza su tiempo. collapsed: la región terminó de subir; lo leído que no
  // debe quedarse se retira. hideShown: «Ocultar» en el asomo (la mostrada pasa a `seen`; si esperan otras, relevo; si no,
  // se recoge). openFrom: la marca abre la lista en su condición (gesto de la persona; la región guarda la marca como
  // vuelta). claim/release: <GStatus>, una clave por componente montado.
  Object.defineProperty(status, INTERNAL, {
    enumerable: false,
    configurable: true,
    value: {
      state,
      ordered,
      queue,
      paused,
      form,
      copy,
      warn,
      byId,
      byUid,
      attach(r, id) {
        if (region) return false
        region = r
        state.attached = true
        state.regionId = id || ''
        state.now = now()
        return true
      },
      detach(r) {
        if (region !== r) return
        region = null
        stopRead()
        Object.assign(state, { attached: false, regionId: '', ready: false, current: 0, leaving: 0, explicit: false, list: false, peek: '' })
        Object.assign(state.hold, { pointer: false, focus: false, touch: false, hidden: false })
      },
      ready() {
        state.ready = true
        decide()
      },
      shown(uid) {
        const r = cur()
        if (!r || r.uid !== uid || (rd && rd.uid === uid)) return
        const left = r.left
        r.left = undefined
        beginRead(r, left)
      },
      collapsed() {
        if (!state.leaving) return
        state.leaving = 0
        state.explicit = false
        Object.assign(state.hold, { pointer: false, focus: false, touch: false })
        for (const r of state.items.slice()) readAway(r)
        decide()
      },
      hold(key, on) {
        if (state.hold[key] !== Boolean(on)) state.hold[key] = Boolean(on)
      },
      setPeek(mode) {
        const m = form.value === 'line' && state.current ? mode || '' : ''
        if (state.peek !== m) state.peek = m
        try { if (process.env.NODE_ENV !== 'production' && m && !state.opts.labels.hide) warn('falta labels.hide: «Ocultar» no se dibuja.') } catch {}
      },
      setMobile(value) {
        if (state.mobile === Boolean(value)) return
        state.mobile = Boolean(value)
        if (state.list) hide() // al cruzar el umbral con la lista abierta, se cierra y se recoge
      },
      openList,
      hideShown() {
        const r = cur()
        if (!r) return
        r.seen = true
        r.done = false
        const q = queue.value
        if (q.length) { show(q[0]); readAway(r) } else collapse(true)
      },
      action: runAction,
      dismiss(uid) {
        const r = byUid(uid)
        return r ? finish(r, 'dismiss') : false
      },
      removeAs,
      tick,
      say,
      openFrom(el, id) {
        const r = byId(id)
        if (!r) return false
        if (!region) {
          try { if (process.env.NODE_ENV !== 'production') warn('GStatusMark con `for` activada sin ninguna <GStatusIsland> montada: no hay isla que abrir.') } catch {}
          return false
        }
        openList()
        region.opened(r.uid, true, el)
        return true
      },
      marksOf,
      markMounted,
      markAdd(id, m) {
        if (!marks.has(id)) marks.set(id, new Set())
        marks.get(id).add(m)
      },
      markDel(id, m) {
        const set = marks.get(id)
        if (!set) return
        set.delete(m)
        if (set.size) return
        marks.delete(id)
        const r = byId(id)
        if (r) readAway(r) // un resultado con enlace sin marca que lo guarde ya no tiene vuelta
      },
      markHold(token, id) {
        if (id === undefined || id === null) { if (token in state.markHold) delete state.markHold[token] }
        else if (state.markHold[token] !== id) state.markHold[token] = id
      },
      claim(id) {
        const n = (claims.get(id) || 0) + 1
        claims.set(id, n)
        try { if (process.env.NODE_ENV !== 'production' && n > 1) warn(`dos <GStatus> montados con el mismo id («${id}»): comparten una sola condición.`) } catch {}
        return n === 1
      },
      release(id) {
        const n = (claims.get(id) || 0) - 1
        if (n > 0) claims.set(id, n)
        else claims.delete(id)
      }
    }
  })

  // El gestor no se vuelve reactivo si se pasa como prop o se guarda en un estado (su estado ya lo es)
  return markRaw(status)
}

// Inyecta el gestor provisto con app.use(status). Sin gestor (o fuera de setup): aviso en desarrollo y undefined.
export function useStatus() {
  if (!hasInjectionContext()) {
    try { if (process.env.NODE_ENV !== 'production') console.warn(`${PREFIX} useStatus() solo funciona dentro de setup (o de app.runWithContext): devuelve undefined.`) } catch {}
    return undefined
  }
  const s = inject(statusKey, null)
  if (!s) {
    try { if (process.env.NODE_ENV !== 'production') console.warn(`${PREFIX} useStatus() sin gestor provisto: instala el tuyo con app.use(createStatus(…)). Devuelve undefined.`) } catch {}
    return undefined
  }
  return s
}
