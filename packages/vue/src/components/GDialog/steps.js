// Motor de pasos de GDialog (interno; dueño: bruno). NO es API pública: la API son las props `steps`/`labels`, el evento
// `step`, `push`/`back`/`backTo` en el alcance de los slots y en `useDialogSteps()`, y `GDialogStep`.
// Contrato: design/contracts/dialog.md §«Niveles anidados» (base y B), DECISIONS.md #581 a #586; prototipo de
// comportamiento: design/lab/dialog/r02/ (concepto B). Debe llamarse dentro del setup de GDialog.
//
// Los pasos se DECLARAN como hijos (GDialogStep, siempre instanciados mientras el contenido del diálogo está montado; su
// panel solo existe mientras el paso está en el historial) y se registran aquí en orden de declaración. El historial es un
// arreglo de nombres (el último es el actual), con o sin `v-model:steps`.
import { computed, nextTick, onBeforeUnmount, provide, ref, shallowReactive, watch } from 'vue'
import { dialogStepsKey } from './dialogContext.js'
import { firstFocusable, focusChain, land, resolveTarget, usable } from '../../utils/landing.js'
import { acquirePageLive, announcePage } from '../../utils/liveRegion.js'
import { fill } from '../../utils/template.js'

// Lo que nunca recibe el foco al entrar en un nivel (base 3): Volver, el cierre y los botones del hilo
export const STEP_SKIP = '.g-dialog__close, .g-dialog__back, .g-dialog__trail-step'

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
const firstTime = (v) => {
  const t = String(v || '').split(',')[0].trim()
  const n = parseFloat(t)
  if (!Number.isFinite(n)) return 0
  return /ms$/.test(t) ? n : n * 1000
}

/** Pinta un slot de otro componente (el `footer` del paso actual) en el sitio de GDialog. */
export const StepSlot = (p) => (typeof p.render === 'function' ? p.render(p.scope) : null)
StepSlot.props = ['render', 'scope']

/** ¿El slot por defecto declara algún GDialogStep? (solo para avisos en desarrollo, antes de montar el contenido) */
export function declaresSteps(slot, scope) {
  if (typeof slot !== 'function') return false
  let nodes
  try { nodes = slot(scope) } catch { return false }
  const walk = (list) => {
    for (const n of [].concat(list || [])) {
      if (!n || typeof n !== 'object') continue
      if (n.type && n.type.name === 'GDialogStep') return true
      if (Array.isArray(n.children) && walk(n.children)) return true
    }
    return false
  }
  return walk(nodes)
}

/**
 * @param {{ props, emit, dialog, body, inset, rootId, rendered, isOpen: () => boolean, close: () => void,
 *           requestClose: (reason: string) => void, measure: () => void, warnOnce: (key: string, msg: string) => void }} o
 */
export function createDialogSteps(o) {
  const warnOnce = o.warnOnce
  // ---------- Registro de los pasos declarados ----------
  const registry = shallowReactive(new Map()) // name → { name, order, title(), description(), summary(), slots, el() }
  let seq = 0
  function registerStep(rec) {
    try { if (process.env.NODE_ENV !== 'production' && registry.has(rec.name) && registry.get(rec.name) !== rec) warnOnce(`step-dup-${rec.name}`, `dos GDialogStep con el mismo name («${rec.name}»): el nombre debe ser único entre los pasos del diálogo.`) } catch {}
    rec.order = ++seq
    registry.set(rec.name, rec)
    return () => { if (registry.get(rec.name) === rec) registry.delete(rec.name) }
  }
  const active = computed(() => registry.size > 0)
  const declared = computed(() => [...registry.values()].sort((a, b) => a.order - b.order).map((r) => r.name))

  // ---------- Historial ----------
  const internal = ref([])
  const controlled = () => Array.isArray(o.props.steps)
  const raw = () => (controlled() ? o.props.steps : internal.value) || []
  const history = computed(() => {
    if (!active.value) return []
    const out = []
    for (const n of raw()) if (registry.has(n) && !out.includes(n)) out.push(n)
    // Sin historial (o vacío) con el diálogo abierto: el primer paso declarado
    if (!out.length && declared.value.length) out.push(declared.value[0])
    return out
  })
  const current = computed(() => history.value[history.value.length - 1] ?? null)
  const depth = computed(() => history.value.length)
  const record = (name) => (name == null ? null : registry.get(name) || null)
  const currentRecord = computed(() => record(current.value))
  const parentName = computed(() => (history.value.length > 1 ? history.value[history.value.length - 2] : null))

  // Avisos del historial (aviso 2): un nombre que no es de ningún paso o repetido, mirados con el contenido ya montado
  watch(() => [active.value && o.rendered.value, raw().join('\u0000'), declared.value.join('\u0000')], ([on]) => {
    if (!on) return
    const seen = new Set()
    for (const n of raw()) {
      if (!registry.has(n)) try { if (process.env.NODE_ENV !== 'production') warnOnce(`steps-unknown-${n}`, `el historial \`steps\` nombra «${n}», que no es de ningún GDialogStep: se ignora.`) } catch {}
      else if (seen.has(n)) try { if (process.env.NODE_ENV !== 'production') warnOnce(`steps-repeat-${n}`, `«${n}» está repetido en el historial \`steps\`: el mismo paso no se abre dos veces (un paso recursivo está reservado).`) } catch {}
      seen.add(n)
    }
  }, { flush: 'post' })

  function setHistory(next) {
    if (!controlled()) internal.value = next
    o.emit('update:steps', next)
  }

  // ---------- Estado de la transición entre pasos ----------
  const entering = ref(null) // nombre del paso que entra
  const direction = ref(null) // 'forward' | 'back'
  let enterTimer = null
  const froms = new Map() // paso → elemento que lo abrió (base 2)
  const scrolls = new Map() // paso → scrollTop del cuerpo al dejarlo debajo (base 6)
  let busy = false

  // El disparador de un paso puede estar en el PIE del paso de abajo, que se vuelve a montar al cambiar de paso (clave por
  // paso en GDialog.vue, H1): si el elemento guardado ya no está en el documento, se busca el de su mismo `id` en el diálogo.
  const reattach = (el) => {
    if (!el || el.isConnected || !el.id || typeof document === 'undefined') return el
    const d = o.dialog.value
    const again = document.getElementById(el.id)
    return again && d && d.contains(again) ? again : el
  }
  const panelOf = (name) => {
    const r = record(name)
    const el = r && typeof r.el === 'function' ? r.el() : null
    return el || null
  }

  function endEntering(name) {
    if (name !== undefined && entering.value !== name) return
    clearTimeout(enterTimer)
    enterTimer = null
    entering.value = null
    direction.value = null
  }
  // Alto de la carcasa entre pasos (#586, #592; protocolo acordado con coco en GDialog.css «Alto entre pasos»): se mide el
  // alto del <dialog> antes (h0) y, con el paso nuevo pintado, después (h1); si |h1 - h0| >= 0,5 se escriben en línea
  // --_step-from-h / --_step-to-h (px), se fuerza el reflujo y se añade is-resizing. La animación (g-dialog-resize,
  // --g-duration-slow + --g-ease-out) es del CSS y el borde superior sigue fijo por D2. Se escribe directamente en el
  // elemento (el reflujo debe ocurrir antes de la clase) y se refleja en `resize` para que el render de Vue no lo borre.
  // Sin animación (movimiento reducido: animationName 'none') se limpia en el acto. Se retira con el animationend de
  // g-dialog-resize o con el respaldo por tiempo.
  const resize = ref(null) // { from, to } en px, o null
  let resizeTimer = null
  function endResize() {
    clearTimeout(resizeTimer)
    resizeTimer = null
    const d = o.dialog.value
    if (d) {
      d.classList.remove('is-resizing')
      d.style.removeProperty('--_step-from-h')
      d.style.removeProperty('--_step-to-h')
    }
    resize.value = null
  }
  function startResize(d, h0, h1) {
    endResize()
    if (!d || Math.abs(h1 - h0) < 0.5) return
    const from = `${Math.round(h0 * 10) / 10}px`
    const to = `${Math.round(h1 * 10) / 10}px`
    d.style.setProperty('--_step-from-h', from)
    d.style.setProperty('--_step-to-h', to)
    void d.offsetWidth // reflujo: la animación parte del alto de origen
    d.classList.add('is-resizing')
    resize.value = { from, to }
    if (typeof getComputedStyle !== 'function') return
    const cs = getComputedStyle(d)
    if (cs.animationName === 'none') return endResize()
    resizeTimer = setTimeout(endResize, firstTime(cs.animationDuration) + 50)
  }
  /** animationend/animationcancel que suben al <dialog>: el panel (g-dialog-step…) y la carcasa (g-dialog-resize). */
  function onAnimationEnd(event) {
    const n = typeof event.animationName === 'string' ? event.animationName : ''
    if (n.startsWith('g-dialog-resize')) { if (event.target === o.dialog.value) endResize() }
    else if (n.startsWith('g-dialog-step') && event.target && event.target.classList && event.target.classList.contains('g-dialog__step')) endEntering()
  }

  /**
   * Cambio de paso: guarda el desplazamiento del que se deja, cambia el historial, y con el paso nuevo ya pintado anima el
   * alto, restaura el desplazamiento, pone el foco (base 3, 4 y 7), aterriza, anuncia y emite `step`.
   */
  async function change(next, info) {
    const prev = current.value
    const to = next[next.length - 1]
    const b = o.body.value
    if (b && prev) scrolls.set(prev, b.scrollTop)
    const dlg = o.dialog.value
    const h0 = dlg ? dlg.getBoundingClientRect().height : 0
    clearTimeout(enterTimer)
    entering.value = to
    direction.value = info.direction
    busy = true
    setHistory(next)
    await nextTick()
    busy = false
    if (current.value !== to) {
      // La aplicación no aceptó el cambio (`steps` controlado sin actualizar): nada que pintar
      endEntering()
      return
    }
    const panel = panelOf(to)
    if (b) b.scrollTop = info.direction === 'back' ? scrolls.get(to) || 0 : 0
    for (const n of [...scrolls.keys()]) if (!history.value.includes(n) || n === to) scrolls.delete(n)
    for (const n of [...froms.keys()]) if (!history.value.includes(n)) froms.delete(n)
    const ms = panel && typeof getComputedStyle === 'function' ? firstTime(getComputedStyle(panel).animationDuration) : 0
    enterTimer = setTimeout(() => endEntering(to), ms + 50)
    if (dlg) {
      // Sin is-resizing de un cambio anterior; --_sheet-hold al día; entonces h1 (protocolo de coco)
      dlg.classList.remove('is-resizing')
      updateHold()
      startResize(dlg, h0, dlg.getBoundingClientRect().height)
    }
    // Foco (base 3 al ir más hondo; base 7 con resultado, base 4 sin él al bajar)
    let focused = null
    if (info.direction === 'forward') {
      focused = focusChain([], panel, STEP_SKIP)
    } else {
      focused = focusChain([info.focus, reattach(info.opener)].filter(Boolean), panel, STEP_SKIP)
    }
    if (!focused && o.dialog.value && !o.dialog.value.contains(document.activeElement)) o.dialog.value.focus({ preventScroll: true })
    // Llegada y anuncio (base 7): solo al bajar con resultado
    if (info.focus) {
      const t = resolveTarget(info.focus)
      if (t && usable(t)) land(t)
    }
    if (info.announce) announcePage(info.announce)
    o.measure()
    o.emit('step', { from: prev, to, direction: info.direction, reason: info.reason, result: info.result })
  }

  // ---------- push / back / backTo ----------
  function push(name, { from } = {}) {
    if (!o.isOpen()) {
      try { if (process.env.NODE_ENV !== 'production') warnOnce('push-closed', '`push` con el diálogo cerrado no hace nada: abrir es `modelValue` (para abrir en un paso hondo, pon `steps` antes de abrir).') } catch {}
      return
    }
    if (!registry.has(name)) {
      try { if (process.env.NODE_ENV !== 'production') warnOnce(`push-unknown-${name}`, `\`push('${name}')\`: no hay ningún GDialogStep con ese name.`) } catch {}
      return
    }
    if (history.value.includes(name)) {
      try { if (process.env.NODE_ENV !== 'production') warnOnce(`push-repeat-${name}`, `\`push('${name}')\`: el paso ya está en el historial (el mismo paso no se abre dos veces).`) } catch {}
      return
    }
    const d = o.dialog.value
    const a = typeof document !== 'undefined' ? document.activeElement : null
    froms.set(name, resolveTarget(from) || (a && d && d.contains(a) && a !== d ? a : null))
    return change([...history.value, name], { direction: 'forward', reason: 'push' })
  }
  function backWith(reason, { result, focus, announce } = {}) {
    const hs = history.value
    if (hs.length <= 1) {
      // Con un solo paso, bajar = cerrar el recorrido (dismiss `close`, cancelable)
      if (reason !== 'escape') o.close()
      return undefined
    }
    const gone = hs[hs.length - 1]
    return change(hs.slice(0, -1), { direction: 'back', reason, result, focus, announce, opener: froms.get(gone) })
  }
  function back(options = {}) {
    return backWith('back', options || {})
  }
  function backToWith(reason, name, { focus, announce } = {}) {
    const hs = history.value
    const i = hs.indexOf(name)
    if (i < 0 || i === hs.length - 1) return undefined
    const above = hs[i + 1]
    return change(hs.slice(0, i + 1), { direction: 'back', reason, focus, announce, opener: froms.get(above) })
  }
  function backTo(name, options = {}) {
    return backToWith('back', name, options || {})
  }
  /** Salto desde el hilo (reason 'trail'). */
  const trailTo = (name) => backToWith('trail', name)
  /** Esc: con más de un paso baja uno (sin dismiss). true si la trató. */
  function escape() {
    if (!active.value || history.value.length <= 1) return false
    if (!busy) backWith('escape')
    return true
  }

  // Un cambio de `steps` desde fuera (la aplicación), sin pasar por push/back: si el foco estaba en el panel que se oculta,
  // va al orden de #292 del paso actual (nunca a body)
  watch(current, (to, from) => {
    if (busy || to === from || !to || !o.isOpen()) return
    const a = typeof document !== 'undefined' ? document.activeElement : null
    if (a && a !== document.body && usable(a)) return
    nextTick(() => {
      const d = o.dialog.value
      const act = document.activeElement
      if (d && (!act || act === document.body || act === d || !usable(act))) focusChain([], panelOf(to), STEP_SKIP)
      o.measure()
      updateHold()
    })
  }, { flush: 'post' })

  // ---------- Hoja móvil: no encoge durante un recorrido (#586, L11) ----------
  const hold = ref(null) // px del alto máximo alcanzado, o null
  function clearHold() {
    hold.value = null
    const d = o.dialog.value
    if (d) { d.style.removeProperty('--_sheet-hold'); d.classList.remove('has-sheet-hold') }
  }
  function updateHold() {
    const d = o.dialog.value
    if (!active.value || !d || !d.open) return
    const hgt = Math.round(d.getBoundingClientRect().height)
    if (!hgt) return
    if (hold.value === null || hgt > hold.value) {
      hold.value = hgt
      d.style.setProperty('--_sheet-hold', `${hgt}px`)
      d.classList.add('has-sheet-hold')
    }
  }
  /** El visor cambió de alto: se vuelve a medir desde cero. */
  function remeasureHold() {
    if (hold.value === null) return
    clearHold()
    nextTick(updateHold)
  }

  // ---------- Canal de página (base 7): mientras haya pasos montados ----------
  let releaseLive = null
  watch(active, (on) => {
    if (on && !releaseLive) releaseLive = acquirePageLive()
    else if (!on && releaseLive) { releaseLive(); releaseLive = null }
  }, { immediate: true })

  /** Tras `closed`: el historial interno vuelve al primer paso; se olvidan disparadores, desplazamientos y la hoja. */
  function reset() {
    if (!controlled()) internal.value = []
    froms.clear()
    scrolls.clear()
    clearHold()
    endEntering()
    endResize()
  }
  /** Al abrir: la hoja vuelve a medirse desde cero. */
  function onOpen() {
    clearHold()
  }

  onBeforeUnmount(() => {
    clearTimeout(enterTimer)
    clearTimeout(resizeTimer)
    if (releaseLive) { releaseLive(); releaseLive = null }
  })

  // ---------- Encabezado, hilo y «Volver» ----------
  const stepTitleId = (name) => `${o.rootId.value}-step-${name}-title`
  const stepDescId = (name) => `${o.rootId.value}-step-${name}-desc`
  const titleOf = (name) => {
    const r = record(name)
    return r ? r.title() || '' : ''
  }
  const backLabel = computed(() => {
    const p = parentName.value
    if (!p) return ''
    const v = o.props.labels && o.props.labels.back
    if (typeof v === 'function') return String(v(titleOf(p)) ?? '')
    return fill(v, { title: titleOf(p) })
  })
  const trailLabel = computed(() => (o.props.labels && typeof o.props.labels.trail === 'string' ? o.props.labels.trail : undefined))
  const trail = computed(() => {
    const hs = history.value
    const last = hs.length - 1
    return hs.map((name, i) => {
      const r = record(name)
      const summary = r && r.summary ? r.summary() : ''
      return { name, number: i + 1, title: titleOf(name), summary: summary || '', current: i === last, parent: i === last - 1 }
    })
  })
  // Aviso 3: más de un paso sin labels.back o sin labels.trail
  watch(() => history.value.length > 1, (many) => {
    if (!many) return
    const l = o.props.labels || {}
    try { if (process.env.NODE_ENV !== 'production' && !l.back) warnOnce('labels-back', 'más de un paso sin `labels.back`: no se pinta «Volver» (Esc y el hilo siguen bajando).') } catch {}
    try { if (process.env.NODE_ENV !== 'production' && !l.trail) warnOnce('labels-trail', 'más de un paso sin `labels.trail`: el hilo (`nav`) queda sin nombre.') } catch {}
  })

  const api = {
    rootId: o.rootId,
    registerStep,
    history,
    current,
    depth,
    push,
    back,
    backTo,
    inHistory: (name) => history.value.includes(name),
    isCurrent: (name) => current.value === name,
    isEntering: (name) => entering.value === name,
    endEntering,
    stepTitleId,
    stepDescId,
    scope: null // lo pone GDialog (necesita su `close`)
  }
  provide(dialogStepsKey, api)

  return {
    api,
    active,
    history,
    current,
    currentRecord,
    depth,
    direction,
    hold,
    resize,
    onAnimationEnd,
    push,
    back,
    backTo,
    trailTo,
    escape,
    reset,
    onOpen,
    updateHold,
    remeasureHold,
    stepTitleId,
    stepDescId,
    backLabel,
    trailLabel,
    trail,
    isBusy: () => busy,
    firstFocusable: (root) => firstFocusable(root, STEP_SKIP)
  }
}

