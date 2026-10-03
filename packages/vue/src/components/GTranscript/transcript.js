// Captura de voz · Fase 2 · modelo del transcript (dueño: bruno)
// Contrato: design/contracts/speech.md §1.4, §21, §26.4, §30 · DECISIONS.md #242, #243, #245, #247.
// Estado puro: crear un transcript no toca document, window ni navigator (SSR). Tres capas: literal (solo el motor),
// corregido (solo las operaciones del usuario, con historial) y derivado (datos: usos `insert` y los de la aplicación).
// Se lee reactivamente (plantillas, computed, watch); se escribe solo con las operaciones. En desarrollo, la instancia y
// sus datos son de solo lectura (escribir directamente avisa). Nada de lo que avisa o notifica lleva texto transcrito.
import { markRaw, reactive, readonly } from 'vue'

// Constantes de comportamiento (§26.4; no son tema). Valores del prototipo de kiwi: cambiarlas es de lima con evidencia.
export const TRANSCRIPT_LIMITS = Object.freeze({
  history: 200,
  followMargin: 32,
  pageRows: 10,
  selectionDebounce: 80,
  quoteChars: 60,
  diffCells: 40000
})

// Acceso interno (gestor y vista): eventos del motor, usos por inserción, avisos. No es API.
export const TX = Symbol('GTranscript.internal')
export const USER_PREFIX = 'user-'
export const isTranscript = (x) => Boolean(x && typeof x === 'object' && x[TX])

const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const PREFIX = '[Grana Speech]'
const MODES = ['dictation', 'conversation']
const EXPECTED = [1, 2, 'many']
const TOP_KEYS = ['id', 'mode', 'createdAt', 'expectedSpeakers', 'speakers', 'segments', 'partial', 'derived']
const SEG_KEYS = ['id', 't0', 't1', 'literal', 'engineSpeaker', 'corrected', 'speaker', 'removed', 'failed']
const SPK_KEYS = ['id', 'role', 'mergedInto', 'origin']
const ORIGINS = ['engine', 'user']

// mm:ss (h:mm:ss desde una hora)
export function formatTime(ms) {
  const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

// Letra por posición: A…Z, luego AA, AB… (estable: unir, separar o añadir no reletra a nadie)
export function letterAt(i) {
  if (!(i >= 0)) return ''
  let n = i
  let out = ''
  do {
    out = String.fromCharCode(65 + (n % 26)) + out
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return out
}

/**
 * Diferencia por palabras (literal → corregido; subsecuencia común más larga sobre palabras separadas por blancos).
 * Devuelve [{ t: 'eq' | 'del' | 'ins', text }]. Por encima de TRANSCRIPT_LIMITS.diffCells (producto de palabras), un solo
 * `del` del literal y un `ins` del corregido: el cálculo no bloquea la página (§22.9).
 */
export function diffWords(a, b) {
  const A = String(a ?? '').split(/\s+/).filter(Boolean)
  const B = String(b ?? '').split(/\s+/).filter(Boolean)
  const n = A.length
  const m = B.length
  if (n * m > TRANSCRIPT_LIMITS.diffCells) {
    return [n ? { t: 'del', text: A.join(' ') } : null, m ? { t: 'ins', text: B.join(' ') } : null].filter(Boolean)
  }
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ops = []
  const push = (t, w) => {
    const last = ops[ops.length - 1]
    if (last && last.t === t) last.w.push(w)
    else ops.push({ t, w: [w] })
  }
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) { push('eq', A[i]); i++; j++ } else if (dp[i + 1][j] >= dp[i][j + 1]) push('del', A[i++])
    else push('ins', B[j++])
  }
  while (i < n) push('del', A[i++])
  while (j < m) push('ins', B[j++])
  return ops.map((o) => ({ t: o.t, text: o.w.join(' ') }))
}

const optId = (v) => (v === undefined || v === null || v === '' ? null : String(v))
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const clone = (v) => (v === null || typeof v !== 'object' ? v : Array.isArray(v) ? v.map(clone) : Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])))
let created = 0

/**
 * Modelo de transcript (§21). Sin `data`, vacío (conversación, 'many'). Con `data` (lo que devolvió toJSON() en la F1 o la
 * F2) lo carga sin conversión: los campos que faltan toman su valor inicial y el historial empieza vacío (§21.9).
 */
export function createTranscript(data) {
  const warned = new Set()
  const warn = (msg) => {
    if (isDev() && !warned.has(msg)) {
      warned.add(msg)
      console.warn(`${PREFIX} ${msg}`)
    }
  }

  // ---------- Carga ----------
  if (data !== undefined && (data === null || typeof data !== 'object' || Array.isArray(data))) warn('createTranscript(data) espera el objeto que devolvió toJSON(): se crea un transcript vacío.')
  const src = data && typeof data === 'object' && !Array.isArray(data) ? data : {}
  for (const k of Object.keys(src)) if (!TOP_KEYS.includes(k)) warn(`createTranscript: campo desconocido «${k}» (se ignora; los datos propios de la aplicación van en derived con su kind).`)
  let mode = src.mode === undefined ? 'conversation' : src.mode
  if (!MODES.includes(mode)) { warn(`createTranscript: mode «${mode}» no es válido: se usa 'conversation'.`); mode = 'conversation' }
  let expected = src.expectedSpeakers === undefined ? 'many' : src.expectedSpeakers
  if (!EXPECTED.includes(expected)) { warn('createTranscript: expectedSpeakers no es válido (1, 2, \'many\'): se usa \'many\'.'); expected = 'many' }

  const speakers = []
  for (const x of Array.isArray(src.speakers) ? src.speakers : []) {
    if (!x || typeof x !== 'object' || optId(x.id) === null) { warn('createTranscript: hablante sin id: se ignora.'); continue }
    for (const k of Object.keys(x)) if (!SPK_KEYS.includes(k)) warn(`createTranscript: campo desconocido «${k}» en un hablante (se ignora).`)
    const id = String(x.id)
    if (speakers.some((s) => s.id === id)) { warn(`createTranscript: hablante repetido «${id}»: se conserva el primero.`); continue }
    speakers.push({ id, role: optId(x.role), mergedInto: optId(x.mergedInto), origin: ORIGINS.includes(x.origin) ? x.origin : 'engine' })
  }
  const segments = []
  const seen = new Set()
  for (const x of Array.isArray(src.segments) ? src.segments : []) {
    if (!x || typeof x !== 'object' || optId(x.id) === null) { warn('createTranscript: fragmento sin id: se ignora.'); continue }
    for (const k of Object.keys(x)) if (!SEG_KEYS.includes(k)) warn(`createTranscript: campo desconocido «${k}» en un fragmento (se ignora).`)
    const id = String(x.id)
    if (seen.has(id)) { warn(`createTranscript: fragmento repetido «${id}»: se conserva el primero.`); continue }
    seen.add(id)
    segments.push({
      id,
      t0: num(x.t0),
      t1: num(x.t1),
      literal: x.literal === undefined || x.literal === null ? '' : String(x.literal),
      engineSpeaker: optId(x.engineSpeaker),
      corrected: x.corrected === undefined || x.corrected === null ? null : String(x.corrected),
      speaker: optId(x.speaker),
      removed: Boolean(x.removed),
      failed: Boolean(x.failed)
    })
  }
  // Orden por t0, estable
  segments.forEach((s, i) => { s._i = i })
  segments.sort((a, b) => a.t0 - b.t0 || a._i - b._i)
  segments.forEach((s) => { delete s._i })
  // Hablantes referidos y ausentes: se añaden (origin 'engine')
  for (const s of segments) {
    for (const id of [s.engineSpeaker, s.speaker]) if (id !== null && !speakers.some((x) => x.id === id)) speakers.push({ id, role: null, mergedInto: null, origin: 'engine' })
  }
  // mergedInto roto (inexistente o en ciclo) → null
  for (const sp of speakers) {
    if (sp.mergedInto === null) continue
    if (!speakers.some((x) => x.id === sp.mergedInto) || sp.mergedInto === sp.id) { warn(`createTranscript: mergedInto de «${sp.id}» apunta a un hablante inexistente: pasa a null.`); sp.mergedInto = null; continue }
    let x = sp.mergedInto
    for (let k = 0; k <= speakers.length && x !== null; k++) {
      if (x === sp.id) { warn(`createTranscript: mergedInto de «${sp.id}» forma un ciclo: pasa a null.`); sp.mergedInto = null; break }
      const next = speakers.find((y) => y.id === x)
      x = next ? next.mergedInto : null
    }
  }
  const derived = []
  for (const d of Array.isArray(src.derived) ? src.derived : []) {
    if (!d || typeof d !== 'object') continue
    derived.push(clone(d))
  }

  const st = reactive({
    id: src.id === undefined || src.id === null || src.id === '' ? `transcript-${Date.now().toString(36)}-${++created}` : String(src.id),
    mode,
    createdAt: typeof src.createdAt === 'string' && src.createdAt ? src.createdAt : new Date().toISOString(),
    expectedSpeakers: expected,
    speakers,
    segments,
    partial: null,
    derived,
    hv: 0 // versión del historial (canUndo, nextUndo… reactivos)
  })
  const index = new Map()
  st.segments.forEach((s) => index.set(s.id, s))
  let derivedSeq = derived.length
  for (const d of st.derived) if (d.id === undefined || d.id === null || d.id === '') d.id = nextDerivedId()
  const view = isDev() ? readonly(st) : st
  const ro = (o) => (o && isDev() ? readonly(o) : o)

  function nextDerivedId() {
    let id
    do id = `d-${++derivedSeq}`
    while (st.derived.some((d) => d.id === id))
    return id
  }

  // ---------- Lectura ----------
  const segment = (id) => ro(index.get(String(id)))
  const speakerById = (id) => (id === null || id === undefined ? undefined : st.speakers.find((s) => s.id === id))
  function resolve(id) {
    let x = optId(id)
    for (let k = 0; k <= st.speakers.length && x !== null; k++) {
      const sp = speakerById(x)
      if (!sp || !sp.mergedInto) return x
      x = sp.mergedInto
    }
    return x
  }
  const segOf = (s) => (typeof s === 'string' ? index.get(s) : s)
  const textOf = (s) => {
    const x = segOf(s)
    return x ? (x.corrected ?? x.literal ?? '') : ''
  }
  function speakerOf(s) {
    const x = segOf(s)
    if (!x) return null
    return resolve(x.speaker ?? x.engineSpeaker)
  }
  // Un hablante que aún no tiene confirmado (el del provisional) toma la siguiente letra, la que tendrá al confirmarse
  const letter = (id) => {
    if (id === null || id === undefined) return ''
    const i = st.speakers.findIndex((s) => s.id === id)
    return letterAt(i < 0 ? st.speakers.length : i)
  }
  function visibleSpeakers() {
    const used = new Set()
    for (const s of st.segments) if (!s.failed) { const k = speakerOf(s); if (k) used.add(k) }
    if (st.partial) { const k = resolve(st.partial.speaker); if (k) used.add(k) }
    return st.speakers.filter((sp) => !sp.mergedInto && (used.has(sp.id) || sp.origin === 'user')).map(ro)
  }
  const usesOf = (segId) => st.derived.filter((d) => d.kind === 'insert' && Array.isArray(d.sourceSegmentIds) && d.sourceSegmentIds.includes(String(segId))).map(ro)

  // ---------- Composición (§21.7) ----------
  function compose(source, options = {}) {
    const o = { withSpeakers: false, withTimes: false, multiline: true, ...options }
    const s = source && typeof source === 'object' ? source : { kind: 'all' }
    if (o.withSpeakers && typeof o.speakerName !== 'function') { warn('compose con withSpeakers necesita speakerName (los textos son de la vista): sin nombres.'); o.withSpeakers = false }
    let items
    if (s.kind === 'text') {
      // Una cita: tal cual, sin hablantes ni horas
      o.withSpeakers = false
      o.withTimes = false
      items = (Array.isArray(s.parts) ? s.parts : []).map((p) => ({ seg: index.get(String(p && p.id)), text: String((p && p.text) ?? '') }))
        .filter((x) => x.seg && !x.seg.removed && !x.seg.failed && x.text.trim())
    } else {
      const set = s.kind === 'segments' ? new Set((Array.isArray(s.ids) ? s.ids : []).map(String)) : null
      items = st.segments.filter((x) => (!set || set.has(x.id)) && !x.removed && !x.failed).map((seg) => ({ seg, text: textOf(seg) }))
    }
    const turns = []
    for (const it of items) {
      const spk = st.mode === 'conversation' ? speakerOf(it.seg) : null
      const last = turns[turns.length - 1]
      const text = it.text.trim()
      if (!text) continue
      if (last && last.spk === spk) last.texts.push(text)
      else turns.push({ spk, t0: it.seg.t0, texts: [text] })
    }
    const lines = turns.map((t) => (o.withTimes ? `[${formatTime(t.t0)}] ` : '') + (o.withSpeakers && t.spk ? `${o.speakerName(t.spk)}: ` : '') + t.texts.join(' '))
    const text = lines.join(st.mode === 'conversation' ? '\n' : ' ')
    return { text: o.multiline === false ? text.replace(/\s*\n\s*/g, ' ') : text, ids: [...new Set(items.map((x) => x.seg.id))] }
  }

  // ---------- Observación (§21.10) ----------
  const subs = new Set()
  function notify(source, kind, ids) {
    const payload = { source, kind, ids: [...(ids || [])] }
    for (const cb of [...subs]) {
      try { cb({ ...payload, ids: [...payload.ids] }) } catch (e) { warn(`una función de onChange lanzó un error: ${e && e.message ? e.message : e}`) }
    }
  }
  function onChange(callback) {
    if (typeof callback !== 'function') return () => {}
    subs.add(callback)
    return () => subs.delete(callback)
  }

  // ---------- Historial (§21.5): instantáneas de los campos del usuario ----------
  const past = []
  const future = []
  const snap = (ids) => ids.map((id) => { const s = index.get(id); return { id, corrected: s.corrected, speaker: s.speaker, removed: s.removed } })
  const spSnap = () => st.speakers.map((s, i) => ({ id: s.id, role: s.role, mergedInto: s.mergedInto, origin: s.origin, at: i }))
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
  function applySnap(list) {
    for (const x of list) {
      const s = index.get(x.id)
      if (s) { s.corrected = x.corrected; s.speaker = x.speaker; s.removed = x.removed }
    }
  }
  // Hablantes: se restauran rol y unión; los que creó la operación se quitan; los que llegaron del motor después se quedan
  function applySpk(target, other) {
    const keep = new Set(target.map((s) => s.id))
    for (const s of other) {
      if (keep.has(s.id)) continue
      const i = st.speakers.findIndex((x) => x.id === s.id)
      if (i >= 0) st.speakers.splice(i, 1)
    }
    for (const s of target) {
      const cur = speakerById(s.id)
      if (cur) { cur.role = s.role; cur.mergedInto = s.mergedInto } else st.speakers.splice(Math.min(s.at, st.speakers.length), 0, { id: s.id, role: s.role, mergedInto: s.mergedInto, origin: s.origin })
    }
  }
  const descriptor = (e) => (e ? { kind: e.kind, ids: [...e.ids], t0: e.t0 } : null)
  function commit(kind, ids, mutate, { speakers = false, t0 = null, op } = {}) {
    const before = snap(ids)
    const sb = speakers ? spSnap() : null
    if (mutate() === false) return false
    const after = snap(ids)
    const sa = speakers ? spSnap() : null
    if (same(before, after) && same(sb, sa)) return false
    past.push({ kind, ids: [...ids], before, after, sb, sa, t0 })
    if (past.length > TRANSCRIPT_LIMITS.history) past.shift()
    future.length = 0
    st.hv++
    notify('user', op, ids)
    return true
  }

  // ---------- Operaciones del usuario (§21.4): nunca lanzan ----------
  const asIds = (ids) => (Array.isArray(ids) ? ids : ids === undefined || ids === null ? [] : [ids]).map(String)
  function known(ids, op) {
    const missing = ids.find((id) => !index.has(id))
    if (missing !== undefined) { warn(`${op}: no existe el fragmento «${missing}» (devuelve false).`); return false }
    return true
  }
  function knownSpeaker(id, op) {
    if (speakerById(id)) return true
    warn(`${op}: no existe el hablante «${id}» (devuelve false).`)
    return false
  }
  let userSeq = 0
  for (const s of st.speakers) {
    const m = new RegExp(`^${USER_PREFIX}(\\d+)$`).exec(s.id)
    if (m) userSeq = Math.max(userSeq, Number(m[1]))
  }
  function addUser() {
    let id
    do id = `${USER_PREFIX}${++userSeq}`
    while (speakerById(id))
    st.speakers.push({ id, role: null, mergedInto: null, origin: 'user' })
    return id
  }

  function edit(id, text) {
    id = String(id)
    if (!known([id], 'edit')) return false
    const s = index.get(id)
    if (s.failed || s.removed) { warn(`edit: el fragmento «${id}» está ${s.failed ? 'fallido' : 'eliminado (primero restore)'}: no se edita.`); return false }
    const norm = String(text ?? '').replace(/\s+/g, ' ').trim()
    if (!norm) return commit('remove', [id], () => { s.removed = true }, { t0: s.t0, op: 'edit' }) ? 'emptied' : false
    return commit('edit', [id], () => { s.corrected = norm === s.literal ? null : norm }, { t0: s.t0, op: 'edit' }) ? 'edited' : false
  }
  function revert(id) {
    id = String(id)
    if (!known([id], 'revert')) return false
    const s = index.get(id)
    if (s.failed) return false
    return commit('revert', [id], () => { s.corrected = null; s.speaker = null }, { t0: s.t0, op: 'revert' })
  }
  function setRemoved(ids, value, op) {
    ids = asIds(ids)
    if (!ids.length || !known(ids, op)) return false
    const list = ids.filter((i) => !index.get(i).failed)
    if (!list.length) return false
    return commit(value ? 'remove' : 'restore', list, () => { for (const i of list) index.get(i).removed = value }, { t0: index.get(list[0]).t0, op })
  }
  function assignSpeaker(ids, speakerId) {
    ids = asIds(ids)
    if (!ids.length || !known(ids, 'assignSpeaker')) return false
    const target = optId(speakerId)
    if (target !== null && !knownSpeaker(target, 'assignSpeaker')) return false
    const list = ids.filter((i) => !index.get(i).failed)
    if (!list.length) return false
    return commit('speaker', list, () => {
      const to = target === null ? null : resolve(target)
      for (const i of list) {
        const s = index.get(i)
        s.speaker = to === null || to === resolve(s.engineSpeaker) ? null : to
      }
    }, { t0: index.get(list[0]).t0, op: 'assignSpeaker' })
  }
  function assignNewSpeaker(ids) {
    ids = asIds(ids)
    if (!ids.length || !known(ids, 'assignNewSpeaker')) return false
    const list = ids.filter((i) => !index.get(i).failed)
    if (!list.length) return false
    let created = null
    const ok = commit('speaker', list, () => {
      created = addUser()
      for (const i of list) index.get(i).speaker = created
    }, { speakers: true, t0: index.get(list[0]).t0, op: 'assignNewSpeaker' })
    return ok ? created : false
  }
  function addSpeaker() {
    let id = null
    commit('addSpeaker', [], () => { id = addUser() }, { speakers: true, op: 'addSpeaker' })
    return id
  }
  function setRole(speakerId, roleId) {
    const id = optId(speakerId)
    if (id === null || !knownSpeaker(id, 'setRole')) return false
    const role = optId(roleId)
    return commit('role', [], () => { speakerById(id).role = role }, { speakers: true, op: 'setRole' })
  }
  function mergeSpeakers(fromId, intoId) {
    const from = optId(fromId)
    const into = optId(intoId)
    if (from === null || into === null || !knownSpeaker(from, 'mergeSpeakers') || !knownSpeaker(into, 'mergeSpeakers')) return false
    const to = resolve(into)
    if (from === into || to === from) { warn('mergeSpeakers: un hablante no se une consigo mismo ni en ciclo (devuelve false).'); return false }
    const ids = st.segments.filter((s) => s.speaker === from).map((s) => s.id)
    return commit('merge', ids, () => {
      speakerById(from).mergedInto = to
      for (const sp of st.speakers) if (sp.mergedInto === from) sp.mergedInto = to
      for (const i of ids) {
        const s = index.get(i)
        s.speaker = to === resolve(s.engineSpeaker) ? null : to
      }
    }, { speakers: true, op: 'mergeSpeakers' })
  }
  function unmerge(speakerId) {
    const id = optId(speakerId)
    if (id === null || !knownSpeaker(id, 'unmerge')) return false
    const sp = speakerById(id)
    if (!sp.mergedInto) return false
    return commit('unmerge', [], () => { sp.mergedInto = null }, { speakers: true, op: 'unmerge' })
  }
  function undo() {
    const e = past.pop()
    if (!e) return null
    applySnap(e.before)
    if (e.sb) applySpk(e.sb, e.sa)
    future.push(e)
    st.hv++
    notify('user', 'undo', e.ids)
    return descriptor(e)
  }
  function redo() {
    const e = future.pop()
    if (!e) return null
    applySnap(e.after)
    if (e.sa) applySpk(e.sa, e.sb)
    past.push(e)
    st.hv++
    notify('user', 'redo', e.ids)
    return descriptor(e)
  }

  // ---------- Capa derivada (§21.6) ----------
  function addDerived(entry) {
    if (!entry || typeof entry !== 'object' || typeof entry.kind !== 'string' || !entry.kind) { warn('addDerived necesita un objeto con kind (devuelve false).'); return false }
    if (entry.kind === 'insert') { warn('addDerived: kind \'insert\' está reservado a las inserciones de Grana (devuelve false).'); return false }
    const copy = clone(entry)
    if (copy.id === undefined || copy.id === null || copy.id === '' || st.derived.some((d) => d.id === copy.id)) copy.id = nextDerivedId()
    if (!copy.at) copy.at = new Date().toISOString()
    if (!copy.createdBy) copy.createdBy = 'app'
    st.derived.push(copy)
    notify('app', 'addDerived', [])
    return ro(st.derived[st.derived.length - 1])
  }
  function removeDerived(id) {
    const i = st.derived.findIndex((d) => d.id === id)
    if (i < 0) { warn(`removeDerived: no existe la entrada «${id}» (devuelve false).`); return false }
    if (st.derived[i].kind === 'insert') { warn('removeDerived: un uso \'insert\' solo se quita deshaciendo su inserción (devuelve false).'); return false }
    st.derived.splice(i, 1)
    notify('app', 'removeDerived', [])
    return true
  }

  // ---------- Eventos del motor (internos; §21.8) ----------
  function ensureEngineSpeaker(id) {
    if (id === null || speakerById(id)) return
    if (id.startsWith(USER_PREFIX)) warn(`el adaptador usa el id de hablante «${id}», con el prefijo reservado «${USER_PREFIX}» de los hablantes que crea quien revisa (§4.4).`)
    st.speakers.push({ id, role: null, mergedInto: null, origin: 'engine' })
  }
  function insertSorted(seg) {
    let i = st.segments.length
    while (i > 0 && st.segments[i - 1].t0 > seg.t0) i--
    st.segments.splice(i, 0, seg)
    const proxy = st.segments[i]
    index.set(seg.id, proxy)
    return proxy
  }
  const engine = {
    warn,
    // Provisional (uno solo; nunca en toJSON ni en onChange)
    partial(p) {
      if (!p || p.id === undefined || p.id === null) return
      const speaker = optId(p.speaker)
      if (speaker !== null && speaker.startsWith(USER_PREFIX)) warn(`el adaptador usa el id de hablante «${speaker}», con el prefijo reservado «${USER_PREFIX}» (§4.4).`)
      st.partial = { id: String(p.id), text: String(p.text ?? ''), speaker }
    },
    clearPartial() { st.partial = null },
    // Confirmado: mismo id que su provisional; un final de un fallido lo rellena; uno repetido se ignora (devuelve null)
    final(p) {
      if (!p || p.id === undefined || p.id === null) return null
      const id = String(p.id)
      const speaker = optId(p.speaker)
      let seg = index.get(id)
      if (seg && !seg.failed) { warn(`final repetido para el fragmento «${id}»: el literal confirmado no se sobrescribe.`); return null }
      if (seg) {
        seg.literal = String(p.text ?? '')
        seg.engineSpeaker = speaker
        seg.failed = false
      } else {
        seg = insertSorted({ id, t0: num(p.t0), t1: num(p.t1), literal: String(p.text ?? ''), engineSpeaker: speaker, corrected: null, speaker: null, removed: false, failed: false })
      }
      ensureEngineSpeaker(speaker)
      if (st.partial && st.partial.id === id) st.partial = null
      notify('engine', 'final', [id])
      return seg
    },
    // Fallo no fatal de un fragmento (sin texto)
    failed(segInfo) {
      if (!segInfo || segInfo.id === undefined || segInfo.id === null) return
      const id = String(segInfo.id)
      const cur = index.get(id)
      if (!cur) insertSorted({ id, t0: num(segInfo.t0), t1: num(segInfo.t1), literal: '', engineSpeaker: null, corrected: null, speaker: null, removed: false, failed: true })
      else if (cur.failed || !cur.literal) cur.failed = true
      if (st.partial && st.partial.id === id) st.partial = null
      notify('engine', 'failed', [id])
    },
    // Diarización revisada por el motor: solo la capa literal (engineSpeaker) y el provisional (#247)
    relabel(map) {
      if (!map || typeof map !== 'object') return []
      const pairs = []
      for (const [from, to] of Object.entries(map)) {
        const a = optId(from)
        const b = optId(to)
        if (a === null || b === null) continue
        const userTarget = speakerById(b) && speakerById(b).origin === 'user'
        if (a.startsWith(USER_PREFIX) || b.startsWith(USER_PREFIX) || userTarget) { warn('relabel del motor con un hablante del usuario (prefijo «user-»): se ignora ese par.'); continue }
        pairs.push([a, b])
      }
      if (!pairs.length) return []
      const m = new Map(pairs)
      const ids = []
      const used = new Set()
      for (const s of st.segments) {
        if (s.engineSpeaker !== null && m.has(s.engineSpeaker)) { s.engineSpeaker = m.get(s.engineSpeaker); used.add(s.engineSpeaker); ids.push(s.id) }
      }
      if (st.partial && st.partial.speaker !== null && m.has(st.partial.speaker)) { st.partial.speaker = m.get(st.partial.speaker); used.add(st.partial.speaker) }
      for (const b of used) ensureEngineSpeaker(b)
      notify('engine', 'relabel', ids)
      return ids
    },
    setExpectedSpeakers(v) { if (EXPECTED.includes(v)) st.expectedSpeakers = v },
    // Uso por inserción (Grana; kind 'insert' reservado) y su retirada al deshacer la inserción
    recordUse(entry) {
      const d = { id: nextDerivedId(), kind: 'insert', createdBy: 'user', at: new Date().toISOString(), ...clone(entry) }
      d.kind = 'insert'
      st.derived.push(d)
      notify('user', 'insert', d.sourceSegmentIds || [])
      return st.derived[st.derived.length - 1]
    },
    dropUse(id) {
      const i = st.derived.findIndex((d) => d.id === id && d.kind === 'insert')
      if (i < 0) return false
      const [d] = st.derived.splice(i, 1)
      notify('user', 'undo-insert', d.sourceSegmentIds || [])
      return true
    },
    hasPartialOrSegments: () => Boolean(st.partial) || st.segments.length > 0
  }

  // ---------- Copia sin provisional ni historial (§1.4) ----------
  function toJSON() {
    return {
      id: st.id,
      mode: st.mode,
      createdAt: st.createdAt,
      expectedSpeakers: st.expectedSpeakers,
      speakers: st.speakers.map((s) => ({ id: s.id, role: s.role, mergedInto: s.mergedInto, origin: s.origin })),
      segments: st.segments.map((s) => ({ id: s.id, t0: s.t0, t1: s.t1, literal: s.literal, engineSpeaker: s.engineSpeaker, corrected: s.corrected, speaker: s.speaker, removed: s.removed, failed: s.failed })),
      derived: st.derived.map((d) => clone(d))
    }
  }

  // ---------- Instancia: datos de solo lectura (getters) y operaciones ----------
  const instance = {}
  const field = (key) => ({
    enumerable: true,
    get: () => view[key],
    set: () => warn(`escribir «${key}» directamente no está soportado: usa las operaciones del modelo (§21.4).`)
  })
  Object.defineProperties(instance, {
    id: field('id'),
    mode: field('mode'),
    createdAt: field('createdAt'),
    expectedSpeakers: field('expectedSpeakers'),
    speakers: field('speakers'),
    segments: field('segments'),
    partial: field('partial'),
    derived: field('derived'),
    canUndo: { get: () => (st.hv, past.length > 0) },
    canRedo: { get: () => (st.hv, future.length > 0) },
    nextUndo: { get: () => (st.hv, descriptor(past[past.length - 1])) },
    nextRedo: { get: () => (st.hv, descriptor(future[future.length - 1])) }
  })
  const methods = { segment, textOf, speakerOf, resolve, letter, visibleSpeakers, usesOf, compose, onChange, edit, revert, remove: (ids) => setRemoved(ids, true, 'remove'), restore: (ids) => setRemoved(ids, false, 'restore'), assignSpeaker, assignNewSpeaker, addSpeaker, setRole, mergeSpeakers, unmerge, undo, redo, addDerived, removeDerived, toJSON }
  for (const [k, fn] of Object.entries(methods)) Object.defineProperty(instance, k, { value: fn, enumerable: false })
  Object.defineProperty(instance, TX, { value: engine, enumerable: false })
  // La instancia no se vuelve reactiva al guardarla en un estado: su estado interno ya lo es
  markRaw(instance)
  // En desarrollo se congela la forma: añadir claves a la instancia no tiene efecto
  if (isDev()) Object.preventExtensions(instance)
  return instance
}
