// Motor del sistema de formularios (interno; dueño: bruno). NO es API pública.
// Contrato: design/contracts/form.md §1 y §2 (registro, «castigar tarde, premiar pronto», error propio, registro inactivo,
// rechazo al enviar) y §15 (#588: GFormFold es un formulario propio sin <form> que usa ESTE motor, no una copia).
// Lo usan GForm (con resumen, estado sucio, envío y pie fijo, que siguen en GForm.vue) y GFormFold (entrada propia
// `@grana/vue/form-fold`, que lo recibe por `__shared`).
//
//   const engine = createFormEngine({ errors: () => props.errors, warnings: …, showErrorsOn: …, root: () => el, warnOnce, onDirty })
//   engine.register(entry) → unregister      engine.revealAll() → Promise<list>      engine.focusAfter(list)
//   engine.context                          // las funciones del contexto `formKey` que leen los campos
//
// Debe llamarse dentro de un setup (usa watch, onMounted y onBeforeUnmount).
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowReactive, shallowRef, watch } from 'vue'
import { byDocument, nextFrame, requestOpen, revealAndFocus } from './formContext.js'

/**
 * @param {{ errors: () => object, warnings: () => object, showErrorsOn: () => string, root: () => Element|null,
 *           warnOnce: (key: string, msg: string) => void, onDirty?: () => void }} o
 */
export function createFormEngine(o) {
  const warnOnce = o.warnOnce || (() => {})
  const errorsOf = () => o.errors() || {}
  const warningsOf = () => o.warnings() || {}
  const markDirty = () => { if (typeof o.onDirty === 'function') o.onDirty() }

  // ---------- Registro ----------
  const entries = shallowReactive(new Map()) // uid → registro (campos con name, grupos, pendientes de un GFormFold)
  function register(entry) {
    try {
      if (process.env.NODE_ENV !== 'production' && !entry.inGroup) {
        for (const n of entry.names()) {
          for (const other of entries.values()) {
            if (other !== entry && !other.inGroup && other.names().includes(n)) warnOnce(`dup-${n}`, `dos campos registrados con el mismo name («${n}»).`)
          }
        }
      }
    } catch {}
    entries.set(entry.uid, entry)
    return () => {
      if (entries.get(entry.uid) !== entry) return
      entries.delete(entry.uid)
      rejected.delete(entry.uid) // al desmontarse, sale del conjunto de rechazados (#304)
    }
  }
  const sorted = () => [...entries.values()].sort((a, b) => byDocument(a.root() || a.control(), b.root() || b.control()))

  // ---------- Registro inactivo (GFormReveal, form.md §2, #276) ----------
  // Un registro dentro de un bloque inactivo sigue registrado (sus nombres siguen cubiertos: no son errores generales) pero
  // no cuenta. Un nombre es inactivo si lo tiene algún registro inactivo y ninguno activo (un name repetido entre ramas ya
  // avisa; así el activo no pierde su mensaje).
  const isInactiveEntry = (e) => Boolean(e.inactive && e.inactive())
  const inactiveNames = computed(() => {
    const off = new Set()
    const on = new Set()
    for (const e of entries.values()) for (const n of e.names()) (isInactiveEntry(e) ? off : on).add(n)
    for (const n of on) off.delete(n)
    return off
  })
  const isInactive = (n) => Boolean(n) && inactiveNames.value.has(n)

  // ---------- Momento de los errores («castigar tarde, premiar pronto», #157) ----------
  const edited = reactive(new Set())
  const shownErr = reactive(new Set())
  const shownWarn = reactive(new Set())
  const live = ref('polite')

  const textOf = (map, n) => (map && map[n] ? String(map[n]) : '')
  function prune() {
    for (const n of [...shownErr]) if (!textOf(errorsOf(), n)) shownErr.delete(n)
    for (const n of [...shownWarn]) if (!textOf(warningsOf(), n)) shownWarn.delete(n)
  }
  // Corregido = oculto: el próximo error de ese campo espera al siguiente blur o envío
  watch(errorsOf, prune, { deep: true })
  watch(warningsOf, prune, { deep: true })

  function reveal(n) {
    shownErr.add(n)
    shownWarn.add(n)
    // La aplicación puede calcular el error en su propia escucha (que va después): se poda en el tick siguiente
    nextTick(prune)
  }
  function visible(n, kind) {
    if (isInactive(n)) return ''
    if (kind === 'warning') return shownWarn.has(n) ? textOf(warningsOf(), n) : ''
    return shownErr.has(n) ? textOf(errorsOf(), n) : ''
  }
  const isShown = (n) => !isInactive(n) && (shownErr.has(n) || shownWarn.has(n))

  // ---------- Error propio del componente (form.md §2, #372, #409; GFileField, GTimeField, GFormFold) ----------
  // Nombres con el error propio REVELADO. Entran en revealAll() (envío y showErrors()) y, solo los registros con
  // ownReveal 'blur' (GTimeField), también por la salida del campo habiendo editado (revealOnBlur, con showErrorsOn y #326);
  // nunca por change ni notifyChange. Salen cuando su ownError() pasa a '' (como un error corregido, #162: el siguiente espera
  // a otra salida o a otro envío), al pasar a inactivos y con reset/resetState()
  const ownShown = reactive(new Set())
  const ownVisible = (n) => Boolean(n) && !isInactive(n) && ownShown.has(n)
  const hasOwn = (e) => typeof e.ownError === 'function'
  const ownOnBlur = (e) => hasOwn(e) && typeof e.ownReveal === 'function' && e.ownReveal() === 'blur'
  function revealOwnBlur(n) {
    for (const e of entries.values()) {
      if (!ownOnBlur(e) || isInactiveEntry(e) || !e.names().includes(n)) continue
      if (e.ownError()) ownShown.add(n)
    }
  }
  watch(
    () => {
      const gone = []
      for (const e of entries.values()) {
        if (!hasOwn(e) || e.ownError()) continue
        for (const n of e.names()) if (ownShown.has(n)) gone.push(n)
      }
      return gone.join('\u0000')
    },
    (gone) => { if (gone) for (const n of gone.split('\u0000')) ownShown.delete(n) }
  )

  function notifyInput(n) {
    if (n && !isInactive(n)) edited.add(n)
  }
  // El revelado por blur nunca mueve lo que se está pulsando (form.md «Momento de los errores», #326; WCAG 2.5.2): con el
  // foco dentro del formulario, desde un `pointerdown` (documento, captura: ocurre antes del blur que provoca) hasta que la
  // pulsación termina, los revelados por blur quedan pendientes y se aplican una tarea después de `pointerup` (ya pasó el
  // `click`). Si ese clic envía, rige el envío (revela todos) y lo pendiente queda absorbido. El teclado no cambia.
  let press = null // pulsación en curso: { id } (pointerId)
  const deferred = new Set()
  let deferTimer = null
  function flushDeferred() {
    deferTimer = null
    const names = [...deferred]
    deferred.clear()
    for (const n of names) if (!isInactive(n) && o.showErrorsOn() === 'blur' && edited.has(n)) revealOnBlur(n)
  }
  function endPress(event) {
    if (!press) return
    if (event && event.pointerId !== undefined && press.id !== undefined && event.pointerId !== press.id) return
    press = null
    document.removeEventListener('pointerup', endPress, true)
    document.removeEventListener('pointercancel', endPress, true)
    clearTimeout(deferTimer)
    deferTimer = setTimeout(flushDeferred, 0)
  }
  function onDocPointerdown(event) {
    if (press) endPress() // una pulsación anterior que no terminó (puntero perdido)
    const f = o.root()
    if (!f || !f.contains(document.activeElement)) return
    press = { id: event.pointerId }
    document.addEventListener('pointerup', endPress, true)
    document.addEventListener('pointercancel', endPress, true)
  }
  onMounted(() => document.addEventListener('pointerdown', onDocPointerdown, true))

  // Revelado por la fila «Sale del campo habiendo editado»: errors/warnings y el error propio con ownReveal 'blur' (#409)
  function revealOnBlur(n) {
    reveal(n)
    revealOwnBlur(n)
  }
  function notifyBlur(n) {
    if (!n || isInactive(n) || o.showErrorsOn() !== 'blur' || !edited.has(n)) return
    if (press) deferred.add(n)
    else revealOnBlur(n)
  }
  function notifyChange(n, revealNow) {
    markDirty()
    if (!n || isInactive(n)) return
    edited.add(n)
    if (revealNow && o.showErrorsOn() === 'blur') reveal(n)
  }

  // ---------- Errores que bloquean ----------
  function blocking() {
    const items = []
    const covered = new Set()
    const errors = errorsOf()
    for (const e of sorted()) {
      for (const n of e.names()) covered.add(n)
      if (e.inGroup || e.disabled() || isInactiveEntry(e)) continue
      const b = e.blocking(errors)
      if (b) items.push({ key: e.uid, ...b, entry: e })
    }
    for (const [k, v] of Object.entries(errors)) {
      if (v && !covered.has(k)) items.push({ key: `general:${k}`, name: k, message: String(v), id: null, entry: null })
    }
    return items
  }

  // Resumen: los errores que bloquearon el último envío o showErrors(), al día (al corregir, el elemento sale)
  const snapshot = shallowRef(null)
  const summaryItems = computed(() => {
    const keys = snapshot.value
    if (!keys) return []
    return blocking().filter((i) => keys.has(i.key)).map((i) => ({ key: i.key, name: i.name, id: i.id, message: i.message, root: i.entry ? () => i.entry.root() : null }))
  })
  let summaryApi = null

  // Al pasar a inactivo: sin editar ni revelar (el valor se conserva) y fuera de la instantánea del resumen, en silencio
  // (como al corregir, #162). Al volver a activo no se hace nada: el resumen los recupera en el siguiente envío o showErrors()
  watch(
    () => {
      const uids = []
      for (const e of entries.values()) if (isInactiveEntry(e)) uids.push(e.uid)
      return { names: [...inactiveNames.value], uids }
    },
    ({ names, uids }, prev) => {
      const before = new Set(prev ? prev.names : [])
      for (const n of names) {
        if (before.has(n)) continue
        edited.delete(n)
        shownErr.delete(n)
        shownWarn.delete(n)
        ownShown.delete(n)
      }
      const keys = snapshot.value
      if (keys && uids.some((u) => keys.has(u))) snapshot.value = new Set([...keys].filter((k) => !uids.includes(k)))
    }
  )
  function registerSummary(api) {
    try { if (process.env.NODE_ENV !== 'production' && summaryApi) warnOnce('summaries', 'más de un GErrorSummary en el mismo formulario.') } catch {}
    summaryApi = api
    return () => { if (summaryApi === api) summaryApi = null }
  }

  // Revela todos: los mensajes que aparecen por este envío se escriben con la región viva en `off` (#164)
  async function revealAll() {
    live.value = 'off'
    for (const e of entries.values()) {
      if (isInactiveEntry(e)) continue
      for (const n of e.names()) { shownErr.add(n); shownWarn.add(n) }
      // El error propio se revela solo si existe ahora (#372)
      if (hasOwn(e) && e.ownError()) for (const n of e.names()) ownShown.add(n)
    }
    for (const k of Object.keys(errorsOf())) if (!isInactive(k)) shownErr.add(k)
    await nextTick() // la aplicación recalcula `errors`
    prune()
    const list = blocking()
    snapshot.value = new Set(list.map((i) => i.key))
    await nextTick() // mensajes y resumen escritos
    nextFrame(() => { live.value = 'polite' })
    return list
  }

  // Enfoca el primer control con error visible; abre antes la sección plegada que lo contiene (#287). Promise<boolean>
  async function focusFirstError() {
    for (const e of sorted()) {
      if (e.inGroup || e.disabled() || isInactiveEntry(e)) continue
      const t = e.visibleTarget()
      if (t && t.control) {
        await revealAndFocus(t.control, t.root)
        return true
      }
    }
    return false
  }
  // Abre todas las GFormSection collapsible plegadas que contienen un error que bloquea (form.md §1 paso 4, §3, #287):
  // la petición sale del control (o la raíz) de cada registro; los errores generales no tienen campo. true si se abrió algo
  function openFor(list) {
    let opened = false
    for (const i of list) {
      const e = i.entry
      if (!e) continue
      if (requestOpen(e.control() || e.root())) opened = true
    }
    return opened
  }
  // Mueve el foco al resumen o al primer inválido. Si una sección se abrió, espera un parche (sin `inert`, abierta sin
  // transición) y devuelve una Promise; si no, todo ocurre en el acto, como siempre
  function focusAfter(list, { summary = true } = {}) {
    if (!list.length) return undefined
    const go = () => {
      if (summary && summaryApi) {
        summaryApi.focus()
        return undefined
      }
      const first = list.find((i) => i.id)
      if (!first) return undefined
      const control = typeof document !== 'undefined' ? document.getElementById(first.id) : null
      return revealAndFocus(control || first.entry?.control(), first.entry?.root())
    }
    return openFor(list) ? nextTick().then(go) : go()
  }

  /** Vacía el estado de los mensajes (no el estado sucio, que es de GForm). */
  function clearState() {
    edited.clear()
    shownErr.clear()
    shownWarn.clear()
    ownShown.clear()
    snapshot.value = null
  }

  // ---------- Rechazo al enviar (form.md §2 «Rechazo al enviar», input.md «Personalidad» I2, #304) ----------
  // Conjunto de claves de registro rechazadas. Solo lo llenan un envío con errores (no `formnovalidate`) y showErrors():
  // se vacía y se llena en el cuadro siguiente, para que una sacudida anterior se reinicie. Lo vacían, clave a clave, el fin
  // de la sacudida (endRejected desde el campo), su siguiente input/change y su desregistro. Nunca por cambios de `errors`.
  const rejected = reactive(new Set())
  let rejectRun = 0
  function reject(list) {
    rejected.clear()
    const run = ++rejectRun
    const keys = list.filter((i) => i.entry).map((i) => i.entry.uid) // los errores generales no tienen campo
    if (!keys.length) return
    nextFrame(() => {
      if (run !== rejectRun) return // un envío posterior ya se encarga
      for (const k of keys) if (entries.has(k)) rejected.add(k)
    })
  }
  const isRejected = (key) => rejected.has(key)
  function endRejected(key) {
    rejected.delete(key)
  }

  /** Registros con controles que el FormData de fuera no debe llevar (GFormFold abierto, #588). */
  function excluded() {
    const out = []
    for (const e of entries.values()) {
      if (typeof e.excludeFromData !== 'function') continue
      const el = e.excludeFromData()
      if (el) out.push(el)
    }
    return out
  }

  onBeforeUnmount(() => {
    summaryApi = null
    rejectRun++ // un cuadro pendiente ya no marca nada
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', onDocPointerdown, true)
      document.removeEventListener('pointerup', endPress, true)
      document.removeEventListener('pointercancel', endPress, true)
    }
    clearTimeout(deferTimer)
    press = null
    deferred.clear()
  })

  return {
    entries,
    live,
    register,
    blocking,
    revealAll,
    focusFirstError,
    focusAfter,
    reject,
    clearState,
    excluded,
    hasSummary: () => Boolean(summaryApi),
    // Funciones del contexto que leen los campos (formKey)
    context: {
      live,
      register,
      notifyInput,
      notifyBlur,
      notifyChange,
      isShown,
      visible,
      ownVisible,
      isRejected,
      endRejected,
      registerSummary,
      summaryItems,
      warnOnce
    }
  }
}
