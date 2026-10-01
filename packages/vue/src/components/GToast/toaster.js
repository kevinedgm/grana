// GToast · gestor de avisos (dueño: bruno)
// Contrato: design/contracts/toast.md · Patrón: docs/contract/api.md («Servicios imperativos») · DECISIONS.md #138 a #147.
// Estado puro y métodos: importar este módulo y llamar a createToaster no toca document, window, navigator ni matchMedia (SSR).
// Los temporizadores solo corren con una región (GToaster) montada; la región aporta el DOM (canales vivos, foco, medidas).
import { computed, hasInjectionContext, inject, markRaw, reactive } from 'vue'
import { fill } from '../../utils/template.js'

// Constantes de comportamiento (no de tema). Duración 'auto' = clamp(min, base + perChar × caracteres, max) ms.
export const TOAST_DURATION = Object.freeze({ min: 5000, base: 2000, perChar: 60, max: 12000 })
// Al reanudar tras una pausa se conserva el resto, con este mínimo (ms)
export const RESUME_MIN = 1000
// Anuncio: se vacía el canal y se escribe pasado `delay`; se vacía otra vez pasado `clear` (ms)
export const ANNOUNCE = Object.freeze({ delay: 50, clear: 5000 })
// Deslizar: cierra con más de un tercio del ancho, o con más de 0,5 px/ms si se desplazó al menos un 10 % del ancho
export const SWIPE = Object.freeze({ distance: 1 / 3, velocity: 0.5, minDistance: 0.1 })
// Avisos de textos largos (no se recortan)
export const TEXT_LIMITS = Object.freeze({ title: 60, description: 140 })
// Móvil: visor de ancho menor que --g-space-1 × 130 (el umbral de hoja de GDialog, #103)
export const MOBILE_SPACES = 130

export const TYPES = ['neutral', 'info', 'success', 'warning', 'error', 'loading']
export const POSITIONS = ['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-end']
const POLITENESS = ['polite', 'assertive']
const TOAST_KEYS = ['id', 'type', 'title', 'description', 'action', 'duration', 'politeness', 'onDismiss']
const OPTION_KEYS = ['position', 'limit', 'mobileLimit', 'duration', 'autoClose', 'hotkey', 'swipe', 'offset', 'labels']
const MODIFIERS = { alt: 'Alt', control: 'Control', ctrl: 'Control', shift: 'Shift', meta: 'Meta' }

// Clave de inyección (InjectionKey) y acceso interno de GToaster al gestor (no es API pública)
export const toasterKey = Symbol('GToaster')
export const INTERNAL = Symbol('GToaster.internal')

const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const PREFIX = '[Grana GToaster]'
const isClient = () => typeof window !== 'undefined' && typeof document !== 'undefined'

// Gestores con región montada (aviso de regiones vivas que compiten)
const mounted = new Set()

// ---------- Atajo (sintaxis de aria-keyshortcuts) ----------
export function parseHotkey(value) {
  if (value === false) return { ok: true, value: false, keys: null }
  if (typeof value !== 'string' || !value.trim()) return { ok: false }
  const parts = value.split('+').map((p) => p.trim())
  if (parts.some((p) => !p)) return { ok: false }
  const key = parts.pop()
  const mods = { Alt: false, Control: false, Shift: false, Meta: false }
  for (const p of parts) {
    const m = MODIFIERS[p.toLowerCase()]
    if (!m || mods[m]) return { ok: false }
    mods[m] = true
  }
  if (MODIFIERS[key.toLowerCase()]) return { ok: false }
  return { ok: true, value, keys: { key, mods } }
}
export function matchesHotkey(event, keys) {
  if (!keys) return false
  const k = keys.key
  const same = k.length === 1 ? String(event.key).toLowerCase() === k.toLowerCase() : event.key === k
  return same && event.altKey === keys.mods.Alt && event.ctrlKey === keys.mods.Control &&
    event.shiftKey === keys.mods.Shift && event.metaKey === keys.mods.Meta
}

const validDuration = (d) => d === 'auto' || (typeof d === 'number' && d > 0 && (d === Infinity || Number.isFinite(d)))
const validLimit = (n) => Number.isInteger(n) && n >= 1
const validOffset = (v) => v === undefined || (typeof v === 'number' && Number.isFinite(v)) || (typeof v === 'string' && v.trim() !== '')
const now = () => Date.now()

export function createToaster(options = {}) {
  const warned = new Set()
  const warn = (msg) => {
    if (isDev() && !warned.has(msg)) {
      warned.add(msg)
      console.warn(`${PREFIX} ${msg}`)
    }
  }

  const state = reactive({
    opts: { position: 'bottom-end', limit: 3, mobileLimit: 1, duration: 'auto', autoClose: true, hotkey: 'F8', swipe: true, offset: {}, labels: {} },
    hotkeyKeys: parseHotkey('F8').keys,
    items: [], // registros en orden de llegada
    queue: [], // uids en cola (FIFO con el error adelantado)
    paused: { hover: false, focus: false, hidden: false, press: false },
    mobile: false,
    attached: false
  })

  let seq = 0
  let uidSeq = 0
  let revealSeq = 0
  let region = null
  let checkedRegion = false
  const timers = new Map() // uid -> { handle, startedAt }

  // ---------- Opciones del gestor ----------
  function applyOptions(patch, initial) {
    if (!patch || typeof patch !== 'object') return
    const o = state.opts
    for (const key of Object.keys(patch)) {
      const v = patch[key]
      if (!OPTION_KEYS.includes(key)) { warn(`opción desconocida «${key}»: se ignora.`); continue }
      if (key === 'position') {
        if (POSITIONS.includes(v)) o.position = v
        else warn(`position «${v}» no es válida (${POSITIONS.join(', ')}): se conserva «${o.position}».`)
      } else if (key === 'limit' || key === 'mobileLimit') {
        if (validLimit(v)) o[key] = v
        else warn(`${key} debe ser un entero mayor o igual que 1: se conserva ${o[key]}.`)
      } else if (key === 'duration') {
        if (validDuration(v)) o.duration = v
        else warn(`duration «${v}» no es válida ('auto', milisegundos > 0 o Infinity): se conserva.`)
      } else if (key === 'autoClose' || key === 'swipe') {
        if (typeof v === 'boolean') o[key] = v
        else warn(`${key} debe ser Boolean: se conserva.`)
      } else if (key === 'hotkey') {
        const parsed = parseHotkey(v)
        if (!parsed.ok) warn(`hotkey «${v}» no se puede interpretar (sintaxis de aria-keyshortcuts, p. ej. «F8» o «Alt+Shift+N»): se conserva.`)
        else if (parsed.keys && parsed.keys.key === 'F6' && !Object.values(parsed.keys.mods).some(Boolean)) warn('hotkey «F6» lo usa el navegador para moverse entre la página y sus barras: se conserva el anterior.')
        else { o.hotkey = parsed.value; state.hotkeyKeys = parsed.keys }
      } else if (key === 'offset') {
        if (!v || typeof v !== 'object' || !validOffset(v.top) || !validOffset(v.bottom)) warn('offset debe ser { top?, bottom? } con números (px) o longitudes CSS: se conserva.')
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
  const limit = () => (state.mobile ? state.opts.mobileLimit : state.opts.limit)
  const live = () => state.items.filter((r) => r.state !== 'leaving')
  const visible = () => state.items.filter((r) => r.state === 'visible')
  const byId = (id) => state.items.find((r) => r.id === id && r.state !== 'leaving')
  const byUid = (uid) => state.items.find((r) => r.uid === uid)
  const isPaused = () => Object.values(state.paused).some(Boolean)
  const forced = (r) => r.type === 'error' || r.type === 'loading' || Boolean(r.action)

  function resolveDuration(r) {
    if (!state.opts.autoClose || forced(r)) return Infinity
    const d = r.durationOpt !== undefined ? r.durationOpt : state.opts.duration
    if (d === 'auto') {
      const n = r.title.length + (r.description ? r.description.length : 0)
      return Math.min(TOAST_DURATION.max, Math.max(TOAST_DURATION.min, TOAST_DURATION.base + TOAST_DURATION.perChar * n))
    }
    return d
  }
  const resolvePoliteness = (r) => r.politenessOpt || (r.type === 'error' ? 'assertive' : 'polite')

  const copy = (r) => Object.freeze({
    id: r.id,
    type: r.type,
    title: r.title,
    ...(r.description ? { description: r.description } : {}),
    ...(r.action ? { action: { label: r.action.label, onClick: r.action.onClick } } : {}),
    politeness: r.politeness,
    duration: r.duration,
    count: r.count,
    state: r.state,
    createdAt: r.createdAt
  })
  const publicList = computed(() => Object.freeze(state.items.map(copy)))

  // ---------- Normalizar las opciones de un aviso ----------
  // Devuelve el parche validado; `null` si no hay título (solo al crear).
  function normalize(input, creating) {
    const out = {}
    if (!input || typeof input !== 'object') {
      if (creating) warn('show necesita un objeto de opciones con title: el aviso no se muestra.')
      return creating ? null : out
    }
    for (const key of Object.keys(input)) {
      if (key === 'actions') warn('un aviso admite una sola action (no «actions»): se ignora.')
      else if (!TOAST_KEYS.includes(key)) warn(`opción de aviso desconocida «${key}»: se ignora (solo texto en v0.1).`)
    }
    if ('id' in input && input.id !== undefined && input.id !== null) out.id = input.id
    if ('type' in input && input.type !== undefined) {
      if (TYPES.includes(input.type)) out.type = input.type
      else warn(`type «${input.type}» no es válido (${TYPES.join(', ')}): se usa ${creating ? '«neutral»' : 'el anterior'}.`)
    }
    if ('title' in input) {
      if (typeof input.title === 'string' && input.title.trim()) out.title = input.title.trim()
      else if (!creating) warn('update con title vacío: se conserva el anterior.')
    }
    if (creating && out.title === undefined) {
      warn('un aviso necesita title: no se muestra.')
      return null
    }
    if ('description' in input) {
      if (input.description === undefined || input.description === null || input.description === '') out.description = undefined
      else if (typeof input.description === 'string') out.description = input.description
      else warn('description debe ser texto: se ignora.')
    }
    if ('action' in input) {
      const a = input.action
      if (a === undefined || a === null || a === false) out.action = undefined
      else if (Array.isArray(a)) warn('un aviso admite una sola action: se ignora.')
      else if (typeof a !== 'object' || typeof a.label !== 'string' || !a.label.trim()) warn('action necesita label: se ignora la acción.')
      else out.action = { label: a.label, onClick: typeof a.onClick === 'function' ? a.onClick : undefined }
    }
    if ('duration' in input && input.duration !== undefined) {
      if (validDuration(input.duration)) out.durationOpt = input.duration
      else warn(`duration «${input.duration}» no es válida ('auto', milisegundos > 0 o Infinity): se ignora.`)
    }
    if ('politeness' in input && input.politeness !== undefined) {
      if (POLITENESS.includes(input.politeness)) out.politenessOpt = input.politeness
      else warn(`politeness «${input.politeness}» no es válida (polite, assertive): se ignora.`)
    }
    if ('onDismiss' in input) out.onDismiss = typeof input.onDismiss === 'function' ? input.onDismiss : undefined
    return out
  }

  // Avisos que dependen del aviso ya resuelto
  function lint(r) {
    if (typeof r.durationOpt === 'number' && forced(r)) warn(`duration en un aviso que no se cierra solo (${r.action ? 'con action' : r.type}): se ignora.`)
    if (r.type === 'error' && r.politenessOpt === 'polite') warn('un error con politeness «polite» no interrumpe: el usuario puede no oírlo a tiempo.')
    if (r.title.length > TEXT_LIMITS.title) warn(`title de más de ${TEXT_LIMITS.title} caracteres: un aviso no es para textos largos (no se recorta).`)
    if (r.description && r.description.length > TEXT_LIMITS.description) warn(`description de más de ${TEXT_LIMITS.description} caracteres: un aviso no es para textos largos (no se recorta).`)
    const L = state.opts.labels
    if (r.type !== 'neutral' && !(L.types && L.types[r.type])) warn(`falta labels.types.${r.type}: el tipo queda solo en el icono.`)
    if (r.action && state.opts.hotkey !== false && !L.actionHint) warn('falta labels.actionHint: el anuncio de un aviso con acción va sin pista.')
  }

  // ---------- Anuncio ----------
  function announceText(r) {
    const L = state.opts.labels
    const parts = []
    const typeLabel = r.type !== 'neutral' && L.types ? L.types[r.type] : undefined
    if (typeLabel) parts.push(`${typeLabel}:`)
    parts.push(/[.!?]$/.test(r.title) ? r.title : `${r.title}.`)
    if (r.description) parts.push(r.description)
    if (r.count > 1 && L.repeated) parts.push(fill(L.repeated, { count: r.count }))
    if (r.action && L.actionHint && state.opts.hotkey !== false) parts.push(fill(L.actionHint, { action: r.action.label, hotkey: state.opts.hotkey }))
    return parts.join(' ')
  }
  function announce(r) {
    if (region && r.state === 'visible') region.announce(announceText(r), r.politeness)
  }

  // ---------- Temporizadores ----------
  function stopTimer(r, keepRest) {
    const t = timers.get(r.uid)
    if (!t) return
    clearTimeout(t.handle)
    timers.delete(r.uid)
    if (keepRest && Number.isFinite(r.remaining)) r.remaining = Math.max(0, r.remaining - (now() - t.startedAt))
  }
  function startTimer(r) {
    stopTimer(r, false)
    if (!region || isPaused() || r.state !== 'visible' || !Number.isFinite(r.remaining)) return
    const uid = r.uid
    timers.set(uid, { startedAt: now(), handle: setTimeout(() => { timers.delete(uid); close(r.id, 'timeout', uid) }, r.remaining) })
  }
  function pauseAll() { visible().forEach((r) => stopTimer(r, true)) }
  function resumeAll() {
    visible().forEach((r) => {
      if (Number.isFinite(r.remaining) && !timers.has(r.uid)) {
        r.remaining = Math.max(r.remaining, RESUME_MIN)
        startTimer(r)
      }
    })
  }
  function restart(r) {
    r.duration = resolveDuration(r)
    r.remaining = r.duration
    if (r.state === 'visible') startTimer(r)
  }

  // ---------- Cola ----------
  function enqueue(r, front) {
    r.state = 'queued'
    if (front) state.queue.unshift(r.uid)
    else if (r.type === 'error') {
      // El error se adelanta: delante del primero que no es error (los errores, entre sí, en orden de llegada)
      const i = state.queue.findIndex((u) => byUid(u)?.type !== 'error')
      state.queue.splice(i < 0 ? state.queue.length : i, 0, r.uid)
    } else state.queue.push(r.uid)
    if (state.queue.length && !state.opts.labels.queued) warn('falta labels.queued: no se dibuja el texto de cola.')
  }
  function reveal(r) {
    r.state = 'visible'
    r.revealSeq = ++revealSeq
    if (r.remaining === undefined) r.remaining = r.duration
    startTimer(r)
    announce(r)
  }
  function promote() {
    while (visible().length < limit() && state.queue.length) {
      const r = byUid(state.queue.shift())
      if (r && r.state === 'queued') reveal(r)
    }
  }
  // Si el límite baja (móvil), se quedan visibles los errores y, después, los más recientes; los sobrantes
  // vuelven al principio de la cola conservando su resto, en su orden y con los errores delante (contrato, #150)
  function demote() {
    const isErr = (r) => (r.type === 'error' ? 1 : 0)
    const keepFirst = visible().sort((a, b) => isErr(b) - isErr(a) || b.revealSeq - a.revealSeq)
    const extra = keepFirst.slice(limit()).sort((a, b) => isErr(b) - isErr(a) || a.revealSeq - b.revealSeq)
    for (let i = extra.length - 1; i >= 0; i--) {
      stopTimer(extra[i], true)
      enqueue(extra[i], true)
    }
  }
  function rebalance() {
    demote()
    promote()
  }

  function removeRecord(r) {
    stopTimer(r, false)
    const qi = state.queue.indexOf(r.uid)
    if (qi >= 0) state.queue.splice(qi, 1)
    const i = state.items.indexOf(r)
    if (i >= 0) state.items.splice(i, 1)
  }
  function fireDismiss(r, reason) {
    if (r.dismissed) return
    r.dismissed = true
    if (typeof r.onDismiss === 'function') r.onDismiss(reason, copy(r))
  }

  // Cierra un aviso (visible o en cola) con su motivo. `uid` asegura que es el mismo registro (temporizador, promesa).
  function close(id, reason, uid) {
    const r = uid !== undefined ? byUid(uid) : byId(id)
    if (!r || r.state === 'leaving') return false
    stopTimer(r, false)
    if (r.state === 'queued') {
      removeRecord(r)
      fireDismiss(r, reason)
      return true
    }
    if (region) region.beforeLeave(r, reason)
    r.state = 'leaving'
    promote()
    if (region) region.leave(r)
    else removeRecord(r)
    fireDismiss(r, reason)
    return true
  }

  // ---------- API pública ----------
  function show(input) {
    if (isDev() && isClient() && !checkedRegion) {
      checkedRegion = true
      setTimeout(() => { if (!region) warn('show sin ninguna <GToaster> montada para este gestor: los avisos esperan hasta que se monte.') }, 0)
    }
    const n = normalize(input, true)
    if (!n) return null
    if (n.id !== undefined && byId(n.id)) {
      update(n.id, input)
      return n.id
    }
    const type = n.type || 'neutral'
    const description = n.description
    if (n.id === undefined) {
      const same = live().find((r) => r.type === type && r.title === n.title && (r.description || undefined) === description)
      if (same) {
        same.count += 1
        if ('action' in n) same.action = n.action
        if ('onDismiss' in n) same.onDismiss = n.onDismiss
        if (!state.opts.labels.repeated) warn('falta labels.repeated: el contador se dibuja sin nombre accesible propio.')
        restart(same)
        announce(same)
        return same.id
      }
    }
    const r = {
      uid: ++uidSeq,
      id: n.id !== undefined ? n.id : `toast-${++seq}`,
      type,
      title: n.title,
      description,
      action: n.action,
      durationOpt: n.durationOpt,
      politenessOpt: n.politenessOpt,
      onDismiss: n.onDismiss,
      politeness: 'polite',
      duration: Infinity,
      remaining: undefined,
      count: 1,
      state: 'queued',
      createdAt: now(),
      revealSeq: 0,
      dismissed: false
    }
    r.politeness = resolvePoliteness(r)
    r.duration = resolveDuration(r)
    lint(r)
    state.items.push(r)
    const rec = state.items[state.items.length - 1] // el proxy reactivo
    if (visible().length < limit()) reveal(rec)
    else enqueue(rec)
    return rec.id
  }

  function update(id, patch) {
    const r = byId(id)
    if (!r) return false
    const n = normalize(patch, false)
    delete n.id
    const before = `${r.type}\u0000${r.title}\u0000${r.description || ''}`
    for (const [k, v] of Object.entries(n)) r[k] = v
    r.politeness = resolvePoliteness(r)
    lint(r)
    restart(r)
    if (`${r.type}\u0000${r.title}\u0000${r.description || ''}` !== before) announce(r)
    return true
  }

  function dismiss(id) {
    if (id === undefined || id === null) {
      // Primero la cola (para que cerrar los visibles no promueva a los que también se cierran)
      state.items.filter((r) => r.state === 'queued').forEach((r) => close(r.id, 'api', r.uid))
      state.items.filter((r) => r.state === 'visible').forEach((r) => close(r.id, 'api', r.uid))
      return
    }
    close(id, 'api')
  }

  function clear() {
    const all = state.items.slice()
    if (region) region.beforeClear()
    all.forEach((r) => stopTimer(r, false))
    state.items.splice(0, state.items.length)
    state.queue.splice(0, state.queue.length)
    all.forEach((r) => fireDismiss(r, 'clear'))
  }

  function configure(patch) {
    const wasAuto = state.opts.autoClose
    applyOptions(patch, false)
    const autoChanged = wasAuto !== state.opts.autoClose
    for (const r of live()) {
      const d = resolveDuration(r)
      if (autoChanged || !Number.isFinite(r.duration) || !Number.isFinite(d)) {
        r.duration = d
        r.remaining = d
      } else r.duration = d
      if (r.state === 'visible') {
        if (Number.isFinite(r.remaining)) { if (!timers.has(r.uid) || autoChanged) startTimer(r) } else stopTimer(r, false)
      }
    }
    rebalance()
  }

  const norm = (m, v) => {
    const x = typeof m === 'function' ? m(v) : m
    if (typeof x === 'string') return { title: x }
    if (x && typeof x === 'object') {
      const { type, ...rest } = x
      return rest
    }
    return null
  }
  function promise(p, messages, opts) {
    messages = messages && typeof messages === 'object' ? messages : {}
    if (!p || typeof p.then !== 'function') {
      warn('promise necesita una promesa.')
      return p
    }
    const loading = norm(messages.loading)
    if (!loading) {
      warn('promise necesita el mensaje loading.')
      return p
    }
    // La duración de `options` es para el desenlace correcto (el aviso en carga no se cierra solo)
    const { duration, ...rest } = opts || {}
    const id = show({ ...rest, ...loading, type: 'loading' })
    if (id === null) return p
    const rec = byId(id)
    const uid = rec ? rec.uid : undefined
    const settle = (kind, value) => {
      const r = byUid(uid)
      if (!r || r.state === 'leaving') return // el usuario ya lo cerró: el desenlace no lo vuelve a mostrar
      const m = messages[kind] === undefined ? null : norm(messages[kind], value)
      if (!m) {
        close(r.id, 'api', uid)
        return
      }
      const base = { description: undefined, action: undefined }
      if (kind === 'success' && duration !== undefined) base.duration = duration
      update(r.id, { ...base, ...m, type: kind })
    }
    p.then((v) => { try { settle('success', v) } catch (e) { console.error(e) } }, (e) => { try { settle('error', e) } catch (err) { console.error(err) } })
    return p
  }

  const toaster = {
    show,
    info: (title, o) => show({ ...(o || {}), type: 'info', title }),
    success: (title, o) => show({ ...(o || {}), type: 'success', title }),
    warning: (title, o) => show({ ...(o || {}), type: 'warning', title }),
    error: (title, o) => show({ ...(o || {}), type: 'error', title }),
    promise,
    update,
    dismiss,
    clear,
    configure,
    get toasts() { return publicList.value },
    install(app) { app.provide(toasterKey, toaster) }
  }

  // ---------- Acceso de la región (GToaster) ----------
  Object.defineProperty(toaster, INTERNAL, {
    enumerable: false,
    configurable: true,
    value: {
      state,
      announceText,
      attach(r) {
        if (region) return false
        rebalance() // sin región: no anuncia ni arranca temporizadores
        region = r
        state.attached = true
        mounted.add(toaster)
        if (mounted.size > 1) warn('hay regiones de varios gestores montadas a la vez: sus regiones vivas compiten.')
        visible().sort((a, b) => a.revealSeq - b.revealSeq).forEach((v) => {
          if (Number.isFinite(v.remaining)) startTimer(v)
          announce(v)
        })
        return true
      },
      detach(r) {
        if (region !== r) return
        pauseAll()
        state.items.filter((x) => x.state === 'leaving').forEach(removeRecord)
        region = null
        state.attached = false
        mounted.delete(toaster)
      },
      isAttachedTo: (r) => region === r,
      setPause(key, value) {
        if (state.paused[key] === Boolean(value)) return
        const was = isPaused()
        state.paused[key] = Boolean(value)
        const is = isPaused()
        if (is && !was) pauseAll()
        else if (!is && was) resumeAll()
      },
      setMobile(value) {
        if (state.mobile === Boolean(value)) return
        state.mobile = Boolean(value)
        rebalance()
      },
      close: (uid, reason) => {
        const r = byUid(uid)
        return r ? close(r.id, reason, uid) : false
      },
      action(uid) {
        const r = byUid(uid)
        if (!r || r.state !== 'visible') return
        const a = r.action
        try {
          if (a && typeof a.onClick === 'function') a.onClick(copy(r))
        } finally {
          close(r.id, 'action', uid)
        }
      },
      remove(uid) {
        const r = byUid(uid)
        if (r && r.state === 'leaving') removeRecord(r)
      },
      warn
    }
  })

  // El gestor no se vuelve reactivo si se pasa como prop o se guarda en un estado (su estado ya lo es)
  return markRaw(toaster)
}

// Inyecta el gestor provisto con app.use(toaster). Sin gestor (o fuera de setup): aviso en desarrollo y undefined.
export function useToast() {
  if (!hasInjectionContext()) {
    if (isDev()) console.warn(`${PREFIX} useToast() solo funciona dentro de setup (o de app.runWithContext): devuelve undefined.`)
    return undefined
  }
  const t = inject(toasterKey, null)
  if (!t) {
    if (isDev()) console.warn(`${PREFIX} useToast() sin gestor provisto: instala el tuyo con app.use(createToaster(…)). Devuelve undefined.`)
    return undefined
  }
  return t
}
