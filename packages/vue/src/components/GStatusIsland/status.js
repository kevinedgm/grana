// Isla de estado · gestor de condiciones (dueño: bruno)
// Contrato: design/contracts/status.md · Patrón: docs/contract/api.md («Servicios imperativos») · DECISIONS.md #315 a #325.
// Una condición es ESTADO con clave (`id`), no un suceso: declararla otra vez la sustituye en el mismo elemento y dura
// hasta que la aplicación la quita. Estado puro y métodos: importar este módulo y llamar a createStatus no toca document,
// window ni navigator (SSR). Anuncios, foco, medidas y la cuenta atrás los aporta la región (GStatusIsland) al montarse.
import { computed, hasInjectionContext, inject, markRaw, reactive } from 'vue'
import { fill } from '../../utils/template.js'
import { parseHotkey } from '../GToast/toaster.js'

export const STATUS_TYPES = ['info', 'success', 'warning', 'error']
export const STATUS_POSITIONS = ['top-center', 'top-start', 'top-end']
// Gravedad: orden de la isla (DOM = lectura = foco)
const SEVERITY = { error: 0, warning: 1, info: 2, success: 3 }
const POLITENESS = ['polite', 'assertive']
// Umbrales de la cuenta atrás que se anuncian (ms; constantes neutras, tokens.md §31)
export const DEADLINE_MARKS = Object.freeze([300000, 60000, 30000])
// El resumen recorta con elipsis a partir de aquí (aviso de desarrollo 10)
export const TITLE_LIMIT = 60
const CONDITION_KEYS = ['type', 'title', 'description', 'details', 'action', 'link', 'origin', 'persistent', 'dismissible', 'deadline', 'politeness', 'onRemove', 'onExpire']
const OPTION_KEYS = ['position', 'offset', 'hotkey', 'autoOpen', 'labels']

// Clave de inyección y acceso interno de los componentes al gestor (no es API pública)
export const statusKey = Symbol('GStatus')
export const INTERNAL = Symbol('GStatus.internal')

const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
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

export function createStatus(options = {}) {
  const warned = new Set()
  const warn = (msg) => {
    if (isDev() && !warned.has(msg)) {
      warned.add(msg)
      console.warn(`${PREFIX} ${msg}`)
    }
  }

  const state = reactive({
    opts: { position: 'top-center', offset: {}, hotkey: 'Alt+F8', autoOpen: true, labels: {} },
    hotkeyKeys: parseHotkey('Alt+F8').keys,
    items: [], // registros en orden de llegada (la isla usa `ordered`)
    open: false, // la abrió la persona o un error (en móvil: la hoja)
    mobile: false,
    attached: false,
    regionId: '', // id de la raíz de la isla montada (aria-controls de las marcas)
    now: 0 // reloj de la cuenta atrás (lo avanza la región, un intervalo de 1 s)
  })

  let uidSeq = 0
  let sinceSeq = 0
  let runSeq = 0
  let region = null
  let checkedRegion = false
  const claims = new Map() // id → nº de <GStatus> montados con esa clave

  // ---------- Opciones del gestor ----------
  function applyOptions(patch, initial) {
    if (!patch || typeof patch !== 'object') return
    const o = state.opts
    for (const key of Object.keys(patch)) {
      const v = patch[key]
      if (!OPTION_KEYS.includes(key)) { warn(`opción desconocida «${key}»: se ignora.`); continue }
      if (key === 'position') {
        if (STATUS_POSITIONS.includes(v)) o.position = v
        else warn(`position «${v}» no es válida (${STATUS_POSITIONS.join(', ')}): se conserva «${o.position}».`)
      } else if (key === 'autoOpen') {
        if (typeof v === 'boolean') o.autoOpen = v
        else warn('autoOpen debe ser Boolean: se conserva.')
      } else if (key === 'hotkey') {
        const parsed = parseHotkey(v)
        const mods = parsed.keys ? parsed.keys.mods : null
        const only = (...on) => mods && Object.entries(mods).every(([k, x]) => x === on.includes(k))
        if (!parsed.ok) warn(`hotkey «${v}» no se puede interpretar (sintaxis de aria-keyshortcuts, p. ej. «Alt+F8»): se conserva.`)
        else if (parsed.keys && parsed.keys.key === 'F6' && only()) warn('hotkey «F6» lo usa el navegador para moverse entre la página y sus barras: se conserva el anterior.')
        else {
          if (parsed.keys && parsed.keys.key === 'F8' && (only() || only('Shift'))) warn(`hotkey «${v}» coincide con el atajo de ${only() ? 'los avisos (GToaster)' : 'la captura de voz'}: se acepta, pero chocan si conviven.`)
          o.hotkey = parsed.value
          state.hotkeyKeys = parsed.keys
        }
      } else if (key === 'offset') {
        if (!v || typeof v !== 'object' || !validOffset(v.top)) warn('offset debe ser { top? } con un número (px) o una longitud CSS: se conserva.')
        else o.offset = initial ? { ...v } : { ...o.offset, ...v }
      } else if (key === 'labels') {
        if (!v || typeof v !== 'object') warn('labels debe ser un objeto: se conserva.')
        else {
          const types = v.types && typeof v.types === 'object' ? { ...(o.labels.types || {}), ...v.types } : o.labels.types
          o.labels = { ...o.labels, ...v, ...(types ? { types } : {}) }
        }
      }
    }
  }
  applyOptions(options, true)

  // ---------- Consultas ----------
  const byId = (id) => state.items.find((r) => r.id === id)
  const byUid = (uid) => state.items.find((r) => r.uid === uid)
  // Orden de la isla: gravedad y, dentro, `since` más reciente primero (contador monótono: sin empates de reloj)
  const ordered = computed(() => state.items.slice().sort((a, b) => SEVERITY[a.type] - SEVERITY[b.type] || b.sinceSeq - a.sinceSeq))
  const form = computed(() => {
    if (!state.items.length) return 'empty'
    if (state.open) return 'open'
    return state.items.every((r) => r.acknowledged) ? 'dot' : 'compact'
  })

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
    acknowledged: r.acknowledged,
    busy: r.busy,
    since: r.since,
    updatedAt: r.updatedAt
  })
  const publicList = computed(() => Object.freeze(ordered.value.map(copy)))
  const publicState = computed(() => Object.freeze({ form: form.value, count: state.items.length, mobile: state.mobile }))

  // ---------- Normalizar las opciones de una condición ----------
  // `full` (set): devuelve la declaración completa (lo que no viene queda en su valor por defecto) o `null` sin título.
  // Sin `full` (update): solo las claves presentes.
  function normalize(input, full) {
    const out = {}
    if (!input || typeof input !== 'object') {
      if (full) warn('set necesita un objeto de opciones con title: la condición no se registra.')
      return full ? null : out
    }
    for (const key of Object.keys(input)) {
      if (key === 'actions') warn('una condición admite una sola action (no «actions»): se ignora.')
      else if (!CONDITION_KEYS.includes(key)) warn(`opción de condición desconocida «${key}»: se ignora (solo texto en v0.1).`)
    }
    const has = (k) => k in input && input[k] !== undefined
    if (has('type')) {
      if (STATUS_TYPES.includes(input.type)) out.type = input.type
      else warn(`type «${input.type}» no es válido (${STATUS_TYPES.join(', ')}): se usa ${full ? '«info»' : 'el anterior'}.`)
    }
    if (full && out.type === undefined) out.type = 'info'
    if ('title' in input) {
      if (typeof input.title === 'string' && input.title.trim()) out.title = input.title.trim()
      else if (!full) warn('update con title vacío: se conserva el anterior.')
    }
    if (full && out.title === undefined) {
      warn('una condición necesita title: no se registra.')
      return null
    }
    for (const k of ['description', 'details']) {
      if (k in input) {
        const v = input[k]
        if (v === undefined || v === null || v === '') out[k] = undefined
        else if (typeof v === 'string') out[k] = v
        else warn(`${k} debe ser texto: se ignora.`)
      } else if (full) out[k] = undefined
    }
    if ('action' in input) {
      const a = input.action
      if (a === undefined || a === null || a === false) out.action = undefined
      else if (Array.isArray(a)) { warn('una condición admite una sola action: se ignora.'); if (full) out.action = undefined }
      else if (typeof a !== 'object' || !text(a.label) || typeof a.onClick !== 'function') { warn('action necesita label y onClick: se ignora la acción.'); if (full) out.action = undefined }
      else out.action = { label: a.label, ...(text(a.busyLabel) ? { busyLabel: a.busyLabel } : {}), onClick: a.onClick }
    } else if (full) out.action = undefined
    if ('link' in input) {
      const l = input.link
      if (l === undefined || l === null || l === false) out.link = undefined
      else if (typeof l !== 'object' || !text(l.label) || !text(l.href)) { warn('link necesita label y href: se ignora el enlace.'); if (full) out.link = undefined }
      else out.link = { label: l.label, href: l.href, ...(text(l.target) ? { target: l.target } : {}), ...(text(l.rel) ? { rel: l.rel } : {}), ...(typeof l.onClick === 'function' ? { onClick: l.onClick } : {}) }
    } else if (full) out.link = undefined
    if ('origin' in input) {
      const g = input.origin
      const okTarget = g && (text(g.target) || typeof g.target === 'function' || (typeof g.target === 'object' && g.target !== null))
      if (g === undefined || g === null || g === false) out.origin = undefined
      else if (typeof g !== 'object' || !text(g.label) || !okTarget) { warn('origin necesita label y target (id, elemento o función): se ignora.'); if (full) out.origin = undefined }
      else out.origin = { label: g.label, target: typeof g.target === 'object' ? markRaw(g.target) : g.target }
    } else if (full) out.origin = undefined
    if ('persistent' in input) {
      if (input.persistent === undefined || input.persistent === null) out.persistentOpt = undefined
      else if (typeof input.persistent === 'boolean') out.persistentOpt = input.persistent
      else warn('persistent debe ser Boolean: se ignora.')
    } else if (full) out.persistentOpt = undefined
    if ('dismissible' in input) out.dismissible = Boolean(input.dismissible)
    else if (full) out.dismissible = false
    if ('deadline' in input) {
      const d = input.deadline
      const ms = d instanceof Date ? d.getTime() : d
      if (d === undefined || d === null) out.deadline = undefined
      else if (typeof ms === 'number' && Number.isFinite(ms)) out.deadline = ms
      else { warn('deadline debe ser una marca de tiempo (Number) o un Date: se ignora.'); if (full) out.deadline = undefined }
    } else if (full) out.deadline = undefined
    if ('politeness' in input) {
      if (input.politeness === undefined || input.politeness === null) out.politenessOpt = undefined
      else if (POLITENESS.includes(input.politeness)) out.politenessOpt = input.politeness
      else warn(`politeness «${input.politeness}» no es válida (polite, assertive): se ignora.`)
    } else if (full) out.politenessOpt = undefined
    for (const k of ['onRemove', 'onExpire']) {
      if (k in input) out[k] = typeof input[k] === 'function' ? input[k] : undefined
      else if (full) out[k] = undefined
    }
    return out
  }

  // Avisos que dependen de la condición ya resuelta (falta un `labels` la primera vez que se necesita, tabla «Textos»)
  function lint(r) {
    const L = state.opts.labels
    if (r.type === 'error' && r.politenessOpt === 'polite') warn('un error con politeness «polite» no interrumpe: la persona puede no oírlo a tiempo.')
    if (r.title.length > TITLE_LIMIT) warn(`title de más de ${TITLE_LIMIT} caracteres: el resumen de la isla lo recorta con elipsis (el texto completo queda en el panel).`)
    if (!(L.types && L.types[r.type])) warn(`falta labels.types.${r.type}: el tipo queda solo en el icono.`)
    if (r.dismissible && !L.dismiss) warn('falta labels.dismiss: el botón descartar queda sin nombre accesible (se dibuja igual).')
    if (r.details) {
      if (!L.details) warn('falta labels.details: el detalle técnico no se dibuja (sin conmutador no hay detalle).')
      if (!L.copy) warn('falta labels.copy: el detalle técnico va sin botón de copiar.')
      else if (!L.copied) warn('falta labels.copied: copiar el detalle no se anuncia.')
    }
    if (r.deadline !== undefined && !L.remaining) warn('falta labels.remaining: los umbrales de la cuenta atrás no se anuncian.')
    if (state.items.length > 1 && !L.more) warn('falta labels.more: «+N» queda sin texto para lectores de pantalla.')
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
  // kind: 'appear' | 'change' | 'announce'. La región decide (tras pintar) si anuncia, abre o da el toque.
  function emitEvent(r, kind, extra = {}) {
    if (region) region.event({ uid: r.uid, kind, text: announceText(r), politeness: r.politeness, error: r.type === 'error', ...extra })
  }
  const say = (message, politeness = 'polite') => { if (region && message) region.say(message, politeness) }

  // ---------- Cuenta atrás ----------
  // Umbrales ya pasados al declarar el plazo: no se anuncian (ya lo dice la propia condición al aparecer)
  function resetDeadline(r) {
    r.expired = false
    r.marks = []
    if (r.deadline === undefined) return
    const left = r.deadline - now()
    r.marks = DEADLINE_MARKS.filter((m) => left <= m)
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
      // Varios umbrales de golpe (pestaña dormida): solo se anuncia el menor
      const crossed = DEADLINE_MARKS.filter((m) => left <= m && !r.marks.includes(m))
      if (crossed.length) {
        r.marks = r.marks.concat(crossed)
        if (left > 0) say(remainingText(Math.min(...crossed)), 'polite')
      }
      if (left <= 0 && !r.expired) {
        r.expired = true
        if (typeof r.onExpire === 'function') {
          try { r.onExpire(copy(r)) } catch (e) { console.error(e) }
        }
      }
    }
  }

  // ---------- Aplicar un parche a un registro (en el sitio) ----------
  function apply(r, n) {
    const before = `${r.type}\u0000${r.title}\u0000${r.description || ''}`
    const prevType = r.type
    const hadDeadline = r.deadline
    for (const [k, v] of Object.entries(n)) r[k] = v
    r.persistent = r.persistentOpt !== undefined ? r.persistentOpt : r.type !== 'success'
    r.politeness = r.politenessOpt || (r.type === 'error' ? 'assertive' : 'polite')
    const typeChanged = r.type !== prevType
    if (typeChanged) {
      r.acknowledged = false
      r.since = now()
      r.sinceSeq = ++sinceSeq
    }
    if (!r.action && r.busy) { r.busy = false; r.runToken = 0 }
    if ('deadline' in n && n.deadline !== hadDeadline) resetDeadline(r)
    r.updatedAt = now()
    lint(r)
    if (`${r.type}\u0000${r.title}\u0000${r.description || ''}` !== before) emitEvent(r, 'change', { typeChanged, toError: typeChanged && r.type === 'error' })
  }

  // ---------- Retirada ----------
  function finish(r, reason) {
    const i = state.items.indexOf(r)
    if (i < 0) return false
    const snapshot = copy(r)
    state.items.splice(i, 1)
    if (!state.items.length) state.open = false
    if (typeof r.onRemove === 'function') {
      try { r.onRemove(reason, snapshot) } catch (e) { console.error(e) }
    }
    return true
  }

  // ---------- API pública ----------
  function set(id, input) {
    if (!validId(id)) {
      warn('una condición necesita id (String o Number): no se registra.')
      return null
    }
    if (isDev() && isClient() && !checkedRegion) {
      checkedRegion = true
      setTimeout(() => { if (!region) warn('set sin ninguna <GStatusIsland> montada para este gestor: las condiciones esperan hasta que se monte.') }, 0)
    }
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
      acknowledged: false, busy: false, runToken: 0,
      since: t, sinceSeq: ++sinceSeq, updatedAt: t,
      expired: false, marks: []
    })
    const r = state.items[state.items.length - 1] // el proxy reactivo
    r.persistent = r.persistentOpt !== undefined ? r.persistentOpt : r.type !== 'success'
    r.politeness = r.politenessOpt || (r.type === 'error' ? 'assertive' : 'polite')
    resetDeadline(r)
    lint(r)
    emitEvent(r, 'appear', { toError: r.type === 'error', countBefore: state.items.length - 1 })
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

  function resolve(id, result) {
    const r = byId(id)
    if (!r) return false
    if (result === undefined || result === null) return finish(r, 'api')
    const extra = typeof result === 'string' ? { title: result } : (typeof result === 'object' ? result : {})
    r.busy = false
    r.runToken = 0
    apply(r, normalize({ type: 'success', persistent: false, action: undefined, deadline: undefined, ...extra }, false))
    return true
  }

  function clear() {
    for (const r of state.items.slice()) finish(r, 'clear')
  }

  function announce(id) {
    const r = byId(id)
    if (!r) return false
    r.acknowledged = false
    emitEvent(r, 'announce', { toError: r.type === 'error' })
    return true
  }

  function acknowledge() {
    state.open = false
    for (const r of state.items.slice()) {
      if (r.persistent) r.acknowledged = true
      else finish(r, 'acknowledge')
    }
  }

  function open(id, opts) {
    if (!state.items.length) return false
    const r = id !== undefined && id !== null ? byId(id) : null
    state.open = true
    if (region) region.opened(r ? r.uid : null, Boolean(opts && opts.focus))
    return true
  }
  function close() {
    state.open = false
  }

  // Acción y resolución en el sitio (#318)
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
        try { if (value && typeof value === 'object') update(x.id, value) } catch (e) { console.error(e) }
      },
      () => {
        // El gestor consume el rechazo (la promesa es suya); el reintento falló otra vez: se reanuncia
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
    acknowledge,
    open,
    close,
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
  Object.defineProperty(status, INTERNAL, {
    enumerable: false,
    configurable: true,
    value: {
      state,
      ordered,
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
        state.attached = false
        state.regionId = ''
      },
      setMobile(value) {
        if (state.mobile === Boolean(value)) return
        state.mobile = Boolean(value)
        state.open = false // al cruzar el umbral con la isla abierta, se repliega
      },
      setOpen(value) { state.open = Boolean(value) && state.items.length > 0 },
      action: runAction,
      dismiss(uid) {
        const r = byUid(uid)
        return r ? finish(r, 'dismiss') : false
      },
      removeAs,
      tick,
      say,
      // La marca abre la isla en su condición (gesto de la persona): la región guarda la marca como vuelta
      openFrom(el, id) {
        const r = byId(id)
        if (!r) return false
        if (!region) {
          warn('GStatusMark con `for` activada sin ninguna <GStatusIsland> montada: no hay isla que abrir.')
          return false
        }
        state.open = true
        region.opened(r.uid, true, el)
        return true
      },
      // <GStatus>: una clave, un componente montado
      claim(id) {
        const n = (claims.get(id) || 0) + 1
        claims.set(id, n)
        if (n > 1) warn(`dos <GStatus> montados con el mismo id («${id}»): comparten una sola condición.`)
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
    if (isDev()) console.warn(`${PREFIX} useStatus() solo funciona dentro de setup (o de app.runWithContext): devuelve undefined.`)
    return undefined
  }
  const s = inject(statusKey, null)
  if (!s) {
    if (isDev()) console.warn(`${PREFIX} useStatus() sin gestor provisto: instala el tuyo con app.use(createStatus(…)). Devuelve undefined.`)
    return undefined
  }
  return s
}
