// Captura de voz · Fase 2 · destinos de inserción (dueño: bruno)
// Contrato: design/contracts/speech.md §24 · DECISIONS.md #248.
// Un destino se liga al MODELO del formulario (get/set), no al DOM: funciona con el campo desmontado. `insert` es la vía de
// escape para destinos que no son texto plano. El almacén guarda el registro, el cursor y la selección recordados de cada
// campo (`field`) y el deshacer de cada inserción: solo la última inserción de cada destino, y solo si el destino no cambió
// después (regla del deshacer del dictado F1, #222). Las inserciones NO entran en el historial de la revisión (§21.5).
// Estado puro hasta que una vista con inserción pide las escuchas de documento (attach/detach); en el servidor, nada.
import { markRaw, readonly, ref, shallowReactive } from 'vue'
import { TX } from './transcript.js'

const POSITIONS = ['end', 'cursor', 'selection']

/** Valida un destino (§24.1). Devuelve un mensaje de aviso o null. */
export function invalidTarget(t) {
  if (!t || typeof t !== 'object') return 'un destino debe ser un objeto { id, label, get, set } o { id, label, insert }: se rechaza.'
  if (typeof t.id !== 'string' || !t.id) return 'destino sin id: se rechaza.'
  if (typeof t.label !== 'string' || !t.label) return `destino «${t.id}» sin label: se rechaza.`
  const io = typeof t.get === 'function' && typeof t.set === 'function'
  if (!io && typeof t.insert !== 'function') return `destino «${t.id}» sin get + set ni insert: se rechaza.`
  return null
}

export function createTargetStore({ warn = () => {} } = {}) {
  const list = shallowReactive([])
  const version = ref(0) // cambia con cada inserción, deshacer o cursor recordado: las vistas recalculan
  const logs = new Map() // id del uso → { targetId, before, after, handle }
  const latest = new Map() // id del destino → id de su última inserción (la única que se puede deshacer)
  const mem = new Map() // id del destino → { start, end, value } (cursor y selección recordados de su campo)
  const bump = () => { version.value++ }

  function register(target) {
    const why = invalidTarget(target)
    if (why) { warn(why); return () => {} }
    const t = markRaw(target)
    const i = list.findIndex((x) => x.id === t.id)
    if (i >= 0) {
      warn(`dos destinos con el id «${t.id}»: el último que se registra sustituye al anterior.`)
      list.splice(i, 1, t)
    } else list.push(t)
    return () => {
      const k = list.indexOf(t)
      if (k >= 0) list.splice(k, 1)
    }
  }
  // Sustituye el registro completo (prop `targets` de GTranscript suelto)
  function replace(targets) {
    const next = []
    for (const t of Array.isArray(targets) ? targets : []) {
      const why = invalidTarget(t)
      if (why) { warn(why); continue }
      const i = next.findIndex((x) => x.id === t.id)
      if (i >= 0) { warn(`dos destinos con el id «${t.id}»: el último sustituye al anterior.`); next.splice(i, 1, markRaw(t)) } else next.push(markRaw(t))
    }
    list.splice(0, list.length, ...next)
  }
  const get = (id) => list.find((t) => t.id === id)
  const valueOf = (t) => {
    try { return String(t.get() ?? '') } catch { return '' }
  }

  // Cursor o selección conocidos y vigentes del campo de un destino (null si no se conocen o el valor cambió desde entonces)
  function caret(t) {
    if (!t || !t.field) return null
    version.value // dependencia: el recuerdo cambia con las escuchas
    const m = mem.get(t.id)
    if (!m) return null
    if (typeof t.insert === 'function') return m
    return m.value === valueOf(t) ? m : null
  }
  function remember(el) {
    if (!el || !el.id || typeof el.selectionStart !== 'number') return
    for (const t of list) {
      if (t.field !== el.id) continue
      const prev = mem.get(t.id)
      const next = { start: el.selectionStart, end: el.selectionEnd, value: String(el.value ?? '') }
      if (!prev || prev.start !== next.start || prev.end !== next.end || prev.value !== next.value) {
        mem.set(t.id, next)
        bump()
      }
    }
  }

  // Escuchas de documento solo mientras haya una inserción montada (§24.4)
  const EVENTS = ['select', 'keyup', 'mouseup', 'input', 'focusout']
  const onDoc = (e) => remember(e.target)
  let users = 0
  function attach() {
    if (typeof document === 'undefined') return () => {}
    if (users++ === 0) for (const ev of EVENTS) document.addEventListener(ev, onDoc, true)
    let done = false
    return () => {
      if (done) return
      done = true
      if (--users === 0) for (const ev of EVENTS) document.removeEventListener(ev, onDoc, true)
    }
  }

  /**
   * Inserta `text` en el destino. position: 'end' | 'cursor' | 'selection'. Devuelve la entrada de `derived` o null.
   * `sourceIds` y `sources` describen los fragmentos usados (marca «Usado en» y «Cambió después de insertarlo»).
   */
  function insert(tx, targetId, raw, { position = 'end', sourceIds = [], sources = {} } = {}) {
    const t = get(targetId)
    if (!t || !tx || !tx[TX] || !raw) return null
    if (!POSITIONS.includes(position)) position = 'end'
    let handle = null
    let before = null
    let after = null
    if (typeof t.insert === 'function') {
      // Vía de escape: el destino resuelve su cursor o selección; Grana no calcula separadores
      if (position === 'selection') position = 'cursor'
      try { handle = t.insert(raw, { position }) } catch (e) { warn(`insert del destino «${t.id}» lanzó un error: ${e && e.message ? e.message : e}`); return null }
      if (!handle || typeof handle.undo !== 'function') handle = { undo: () => false }
    } else {
      before = valueOf(t)
      const ml = t.multiline !== false
      const text = ml ? raw : raw.replace(/\s*\n\s*/g, ' ')
      let start = before.length
      let end = before.length
      const m = caret(t)
      if (position !== 'end') {
        if (!m) position = 'end'
        else if (position === 'selection') { start = m.start; end = m.end } else { start = m.end; end = m.end }
      }
      const a = before.slice(0, start)
      const b = before.slice(end)
      let pre = ''
      let post = ''
      if (position === 'end') { if (a && !/\s$/.test(a)) pre = ml ? '\n' : ' ' } else {
        // Un espacio a cada lado si hace falta (no delante de un signo de cierre ni detrás de uno de apertura)
        if (a && !/[\s([{¿¡«“]$/.test(a)) pre = ' '
        if (b && !/^[\s.,;:!?)\]}»”…]/.test(b)) post = ' '
      }
      after = a + pre + text + post + b
      try { t.set(after) } catch (e) { warn(`set del destino «${t.id}» lanzó un error: ${e && e.message ? e.message : e}`); return null }
      if (m) { const c = (a + pre + text).length; mem.set(t.id, { start: c, end: c, value: after }) }
    }
    const use = tx[TX].recordUse({ target: { id: t.id, label: t.label }, position, sourceSegmentIds: [...sourceIds], text: raw, sources: { ...sources } })
    logs.set(use.id, { targetId: t.id, before, after, handle })
    latest.set(t.id, use.id)
    bump()
    return use
  }

  // ¿Se puede deshacer este uso? Solo la última inserción de su destino y con su registro (de esta sesión de la página)
  const undoable = (use) => {
    version.value
    return Boolean(use && use.target && latest.get(use.target.id) === use.id && logs.has(use.id))
  }

  /** Deshace un uso. Devuelve { ok, label } (ok false si el destino cambió o no se puede). */
  function undo(tx, useId) {
    const rec = logs.get(useId)
    const use = tx && tx.derived ? tx.derived.find((d) => d.id === useId) : null
    const label = (use && use.target && use.target.label) || (rec && get(rec.targetId) && get(rec.targetId).label) || ''
    if (!rec || latest.get(rec.targetId) !== useId) return { ok: false, label }
    const t = get(rec.targetId)
    let ok = false
    if (rec.handle) {
      try { ok = rec.handle.undo() !== false } catch { ok = false }
    } else if (t && typeof t.get === 'function' && valueOf(t) === rec.after) {
      try { t.set(rec.before); ok = true } catch { ok = false }
    }
    // El destino cambió (o la vía de escape no pudo): no se toca nada
    if (!ok) return { ok: false, label }
    logs.delete(useId)
    latest.delete(rec.targetId)
    if (rec.before !== null && t && t.field) { const m = mem.get(t.id); if (m) mem.set(t.id, { ...m, value: rec.before }) }
    // El uso anterior del mismo destino vuelve a poder deshacerse si el destino quedó como él lo dejó
    const prev = [...tx.derived].reverse().find((d) => d.kind === 'insert' && d.target && d.target.id === rec.targetId && d.id !== useId && logs.has(d.id) && logs.get(d.id).after === rec.before)
    if (prev) latest.set(rec.targetId, prev.id)
    tx[TX].dropUse(useId)
    bump()
    return { ok: true, label }
  }

  return {
    list,
    version,
    register,
    replace,
    get,
    caret,
    remember,
    attach,
    insert,
    undo,
    undoable,
    // Vista pública del registro del gestor (speech.targets): register y list de solo lectura
    public: Object.freeze({
      register,
      get list() { return readonly(list) }
    })
  }
}
