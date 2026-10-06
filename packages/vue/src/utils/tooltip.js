// Motor interno de GTooltip (dueño: bruno). design/contracts/tooltip.md (#380 a #398); forma y receta del viaje:
// design/lab/tooltip/estilo.md («Lo que el CSS espera del .vue»). Interno, no público: lo usan GTooltip y, en encargos
// aparte, GTabs, GRadioGroup y el riel de GSidebar (#392).
// Tiempos, uno solo abierto, foco por navegación, Esc en captura, puente 1.4.13, táctil con lectura, posición con
// anchor.js (#358 reglas 1 estricta y 3), viaje por relevo en un grupo y segunda etapa. Sin lecturas de document o
// window fuera de attach() (SSR).
// Caja visible (#395): el ancla es el ancestro con `data-g-tooltip-box` del elemento resuelto dentro del hijo (o él
// mismo). Puntero, pulsación, menú contextual, pulsar fuera, posición, pestaña y seguimiento van al ancla; foco, ARIA,
// aria-expanded, disabled y kind, al elemento resuelto. El motor no conoce ninguna clase de ningún componente.
import { anchorGone, followFrame, parsePlacement, placeAround, px, setVar } from './anchor.js'

// ---------- Tiempos (constantes de JS, no tokens; tooltip.md §«Tiempos», tokens.md §29.6) ----------
export const OPEN = 350
export const CLOSE = 100
export const SKIP = 600
export const NAV = 1000
export const DWELL = 700
export const LONG = 500
export const MOVE = 10
export const LINGER = 1500
export const READ_BASE = 1000
export const READ_CHAR = 50
export const READ_MAX = 6000
/** Tiempo de lectura en táctil (#385) */
export const readTime = (chars) => Math.min(READ_MAX, Math.max(LINGER, READ_BASE + READ_CHAR * chars))

const MODIFIERS = new Set(['Shift', 'Alt', 'Control', 'Meta', 'AltGraph', 'CapsLock', 'Fn'])
const NAV_KEYS = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'F6'])
/** Enfocable (#381): también `tabindex="-1"` (tabindex itinerante de una barra, APG) */
export const FOCUSABLE = 'button, a[href], input, select, textarea, summary, [tabindex]'
/** Marca de la caja visible de un control (#395; la pone cada componente, estática) */
export const BOX = '[data-g-tooltip-box]'
const GROUP = '[role="toolbar"], [role="tablist"], [role="radiogroup"], [role="menubar"], [role="group"], nav, [role="navigation"]'
// Geometría que viaja (receta TT.travel del banco de coco)
const GEOM = ['--_x', '--_y', '--_yb', '--_tooltip-ax', '--_tooltip-ay', '--_tooltip-aw', '--_tooltip-ah']
const STATES = ['data-instant', 'data-travel', 'data-dwell', 'data-touch']

const now = () => Date.now()
const is = (el, sel) => { try { return el.matches(sel) } catch { return false } }
const toPx = (v) => {
  const n = parseFloat(v)
  if (Number.isNaN(n)) return NaN
  return /r?em\s*$/.test(v) ? n * parseFloat(getComputedStyle(document.documentElement).fontSize) : n
}

// ---------- Estado compartido: uno solo abierto en el documento ----------
const state = { current: null, lastHide: -Infinity, navAt: -Infinity, blockClick: null, count: 0, ac: null }
export const _state = state

function install() {
  if (state.count++) return
  state.ac = new AbortController()
  const o = { capture: true, signal: state.ac.signal }
  // Una sola escucha de documento para todos: teclas de navegación, Esc, pulsar fuera y el clic tras la pulsación larga
  document.addEventListener('keydown', (e) => {
    // Una tecla que no navega (Intro, Espacio, letras) anula la navegación: el foco que pone la interfaz después (un
    // GDialog que se abre con Intro y enfoca su primer control) no es de la persona. Los modificadores no cuentan
    // (Mayús+Tab, Opción+Tab en WebKit)
    if (NAV_KEYS.has(e.key)) state.navAt = now()
    else if (!MODIFIERS.has(e.key)) state.navAt = -Infinity
    const c = state.current
    // Esc en captura, solo con uno abierto: cierra sin mover el foco, preventDefault sin detener (GDialog lo respeta)
    if (e.key === 'Escape' && c && !e.isComposing && !e.defaultPrevented) {
      e.preventDefault()
      c.dismiss()
    }
  }, o)
  document.addEventListener('pointerdown', (e) => {
    state.navAt = -Infinity
    const c = state.current
    if (c && !c.box.contains(e.target) && !c.node.contains(e.target)) c.hide('outside')
  }, o)
  // Tras una pulsación larga, soltar no activa: el clic que la sigue se cancela (#385)
  document.addEventListener('click', (e) => {
    const t = state.blockClick
    if (t && t.contains(e.target)) {
      e.preventDefault()
      e.stopPropagation()
      state.blockClick = null
    }
  }, o)
}
function uninstall() {
  if (--state.count) return
  state.ac.abort()
  state.ac = null
  state.current = null
}

// ---------- Nombre accesible aproximado (kind="auto", #382) ----------
const ids = (el, attr) => (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean)
function textOf(n, root) {
  if (n.nodeType === 3) return n.data
  if (n.nodeType !== 1) return ''
  if (n !== root && (n.hidden || n.getAttribute('aria-hidden') === 'true' || is(n, '.g-tooltip, [role="tooltip"]'))) return ''
  const label = n.getAttribute('aria-label')
  if (n !== root && label && label.trim()) return label
  if (n.localName === 'img') return n.getAttribute('alt') || ''
  return [...n.childNodes].map((c) => textOf(c, root)).join(' ')
}
/** Nombre del control sin contar el propio tooltip (`own`: sus ids) */
export function nameOf(el, own = []) {
  const doc = el.ownerDocument
  const lb = ids(el, 'aria-labelledby').filter((id) => !own.includes(id))
  if (lb.length) return lb.map((id) => { const t = doc.getElementById(id); return t ? textOf(t, t) : '' }).join(' ')
  const label = el.getAttribute('aria-label')
  if (label && label.trim()) return label
  if (el.labels && el.labels.length) return [...el.labels].map((l) => textOf(l, l)).join(' ')
  if (/^(input|select|textarea)$/.test(el.localName)) return el.localName === 'input' && /^(button|submit|reset)$/.test(el.type) ? el.value : ''
  return textOf(el, el)
}
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase()
/** auto: sin nombre o el mismo texto → label; otro nombre → description */
export const resolveKind = (el, text, own) => {
  const n = norm(nameOf(el, own))
  return !n || n === norm(text) ? 'label' : 'description'
}

/** Primer elemento del hijo: desde su primer nodo (`start`) hasta `end` (fragmento). `null` si no hay. */
export function firstElement(start, end) {
  let e = start
  while (e && e.nodeType !== 1) {
    if (e === end) return null
    e = e.nextSibling
  }
  return !e || (end && e === end) ? null : e
}

/**
 * Elemento resuelto del hijo (#381): desde el primer nodo del hijo (`start`), su primer elemento antes de `end`
 * (fragmento) y, si no es enfocable, su primer descendiente enfocable. `null` si no hay.
 */
export function resolveTarget(start, end) {
  const e = firstElement(start, end)
  if (!e) return null
  return is(e, FOCUSABLE) ? e : e.querySelector(FOCUSABLE)
}

/**
 * Ancla del tooltip (#395): el ancestro más cercano del elemento resuelto (`target`, él incluido) con
 * `data-g-tooltip-box`, si está dentro del primer elemento del hijo (`first`) o es él; si no, el propio `target`.
 * Una marca fuera del hijo (la caja de otro componente que lo contiene) se ignora.
 */
export function resolveBox(target, first) {
  if (!target) return null
  const b = target.closest(BOX)
  return b && first && (b === first || first.contains(b)) ? b : target
}

/**
 * Engancha el comportamiento a un control (`ctrl`, el elemento resuelto) y su nodo `role="tooltip"` (`node`, hermano).
 * opt: { box: Element (ancla, #395; por defecto ctrl), placement(): string|undefined, detail(): bool, disabled(): bool,
 * chars(): number }
 * Devuelve { show, hide, check, destroy } (show/hide para pruebas y para los clientes internos).
 */
export function attach(ctrl, node, opt = {}) {
  // Ancla (caja visible): solo si contiene al elemento resuelto; si no, el propio elemento
  const box = opt.box && opt.box.contains(ctrl) ? opt.box : ctrl
  install()
  const ac = new AbortController()
  const on = (t, type, fn, o) => t.addEventListener(type, fn, { ...o, signal: ac.signal })
  const reasons = new Set()
  let open = false
  let suppressed = false
  let openT = 0, closeT = 0, dwellT = 0, longT = 0, lingerT = 0, travelT = 0, endTravel = null
  let start = null
  let longFired = false

  const set = (a, v) => (v ? node.setAttribute(a, '') : node.removeAttribute(a))
  const detail = () => Boolean(opt.detail && opt.detail())
  const groupEl = () => (ctrl.parentElement && ctrl.parentElement.closest(GROUP)) || node.parentElement
  const vertical = () => {
    const g = ctrl.parentElement && ctrl.parentElement.closest(GROUP)
    return Boolean(g && g.getAttribute('aria-orientation') === 'vertical')
  }
  const wanted = () => (opt.placement && opt.placement()) || (vertical() ? 'right' : 'bottom')
  const unit = () => { const u = toPx(getComputedStyle(node).getPropertyValue('--g-space-1')); return Number.isNaN(u) ? 4 : u }
  const canShow = () => !(opt.disabled && opt.disabled()) && ctrl.getAttribute('aria-expanded') !== 'true' && !is(ctrl, ':disabled') && ctrl.isConnected

  // Colocación (estilo.md 1): data-side y --_tooltip-aw/-ah ANTES de medir; placeAround con gap = space × 1,5 (largo de
  // la pestaña) y pad = space × 2; si el lado resultante es otro, ese data-side y se mide de nuevo. ax/ay físicos.
  // `lock`: el lado se conserva (regla 1 estricta: desplazamiento, resize y segunda etapa). `side`: lado pedido.
  function place(lock, side) {
    const a = box.getBoundingClientRect()
    const u = unit()
    const de = document.documentElement
    const vw = de.clientWidth || window.innerWidth
    const vh = de.clientHeight || window.innerHeight
    const { side: s, align } = parsePlacement(wanted())
    let cur = side || s
    const o = { vw, vh, rtl: getComputedStyle(ctrl).direction === 'rtl', pad: u * 2, gap: u * 1.5 }
    const measure = (only) => {
      node.setAttribute('data-side', cur)
      setVar(node, '--_tooltip-aw', px(a.width))
      setVar(node, '--_tooltip-ah', px(a.height))
      return placeAround(a, { ...o, width: node.offsetWidth, height: node.offsetHeight, placement: `${cur}-${align}`, only })
    }
    let r = measure(Boolean(lock))
    if (r.side !== cur) { cur = r.side; r = measure(true) }
    setVar(node, '--_x', px(r.x))
    setVar(node, '--_y', px(r.y))
    setVar(node, '--_yb', px(vh - r.y - node.offsetHeight))
    setVar(node, '--_tooltip-ax', px(a.left - r.x))
    setVar(node, '--_tooltip-ay', px(a.top - r.y))
    return cur
  }
  const geom = () => ({ vars: GEOM.map((k) => node.style.getPropertyValue(k)), w: node.getBoundingClientRect().width, side: node.getAttribute('data-side') })
  const writeGeom = (g) => { GEOM.forEach((k, i) => setVar(node, k, g.vars[i])); node.style.inlineSize = px(g.w) }

  // El estado abierto lo lleva el motor (`open`); el navegador solo muestra u oculta la capa superior
  const showNode = () => { try { node.showPopover() } catch { /* ya abierto, desconectado o sin popover */ } }
  const hideNode = () => { try { node.hidePopover() } catch { /* ya cerrado o sin popover */ } }
  const stopTravel = () => {
    clearTimeout(travelT)
    if (endTravel) node.removeEventListener('transitionend', endTravel)
    endTravel = null
    node.removeAttribute('data-travel')
    node.style.removeProperty('inline-size')
  }
  const pressMs = () => {
    const d = getComputedStyle(node).getPropertyValue('--g-duration-press').trim()
    const n = parseFloat(d)
    return Number.isNaN(n) ? 0 : /ms$/.test(d) ? n : n * 1000
  }

  // Seguimiento al desplazar: una vez por cuadro, sin cambiar de lado; fuera del visor o de su contenedor, cierra (#358)
  const follow = followFrame((scroller) => {
    if (!open) return
    if (anchorGone(box, scroller)) { hide('gone'); return }
    place(true, node.getAttribute('data-side'))
  })
  let live = null
  const listen = () => {
    if (live) return
    live = new AbortController()
    const o = { capture: true, passive: true, signal: live.signal }
    window.addEventListener('scroll', (e) => { const t = e.target; if (t && t.nodeType === 1 && node.contains(t)) return; follow.schedule(t) }, o)
    window.addEventListener('resize', () => { if (open) place(true, node.getAttribute('data-side')) }, { signal: live.signal })
  }
  const unlisten = () => { if (live) { live.abort(); live = null } follow.cancel() }

  function show(reason) {
    clearTimeout(openT)
    clearTimeout(closeT)
    if (open || !canShow()) return
    const prev = state.current && state.current !== inst && state.current.isOpen() ? state.current : null
    clearTimeout(lingerT)
    stopTravel()
    for (const a of STATES) node.removeAttribute(a)
    const touch = reason === 'touch'
    if (touch) { set('data-touch', true); if (detail()) set('data-dwell', true) }
    open = true
    if (prev) {
      // Relevo (#388): el entrante abre sin entrada, en su sitio y con el lado del saliente; si es el mismo grupo y el
      // mismo lado, salta a la geometría del saliente y transiciona a la suya (receta TT.travel, estilo.md 3)
      const g0 = prev.geom()
      const same = prev.group() === groupEl()
      set('data-instant', true)
      showNode()
      const side = place(false, same && !touch ? g0.side : undefined)
      if (same && !touch && side === g0.side && g0.w > 0) {
        const g1 = geom()
        writeGeom(g0)
        void getComputedStyle(node).translate
        void node.offsetWidth
        set('data-instant', false)
        set('data-travel', true)
        writeGeom(g1)
        endTravel = (e) => { if (e.target === node && e.propertyName === 'translate') stopTravel() }
        node.addEventListener('transitionend', endTravel)
        travelT = setTimeout(stopTravel, pressMs() + 80)
      }
      prev.hide('switch')
    } else {
      set('data-instant', now() - state.lastHide < SKIP)
      showNode()
      place(false)
    }
    state.current = inst
    listen()
  }

  function hide(why) {
    clearTimeout(openT)
    clearTimeout(closeT)
    clearTimeout(dwellT)
    clearTimeout(lingerT)
    clearTimeout(longT)
    reasons.clear()
    if (!open) return
    open = false
    if (state.current === inst) state.current = null
    state.lastHide = now()
    unlisten()
    stopTravel()
    // El saliente de un relevo se oculta sin salida (data-instant), para que nunca haya dos etiquetas visibles
    set('data-instant', why === 'switch')
    hideNode()
  }
  const scheduleClose = (ms = CLOSE) => {
    if (reasons.size) return
    clearTimeout(closeT)
    closeT = setTimeout(() => { if (!reasons.size) hide('leave') }, ms)
  }

  // Segunda etapa (#389): tras DWELL quieto; el ancho en el acto y una recolocación conservando el lado
  const armDwell = () => {
    clearTimeout(dwellT)
    if (!detail() || node.hasAttribute('data-dwell')) return
    dwellT = setTimeout(() => {
      if (!open || state.current !== inst) return
      node.style.removeProperty('inline-size')
      set('data-dwell', true)
      place(true, node.getAttribute('data-side'))
    }, DWELL)
  }

  const inst = {
    ctrl,
    box,
    node,
    isOpen: () => open,
    geom,
    group: groupEl,
    show: (reason = 'api') => { show(reason); if (open) armDwell() },
    hide,
    dismiss() { hide('escape'); suppressed = true },
    // El control cambió (aria-expanded, disabled): si ya no puede mostrarse, cierra
    check() { if (open && !canShow()) hide('state') },
    destroy() {
      hide('destroy')
      if (state.blockClick === box) state.blockClick = null
      ac.abort()
      uninstall()
    }
  }

  const mouse = (e) => e.pointerType !== 'touch'
  // El más interno gana el puntero (#395): otro control con su propio tooltip dentro de la caja (o su nodo) no cuenta
  // para este (ni abre ni lo mantiene). Los botones propios de la caja (contraseña, borrar, −/+) no llevan marca: cuentan.
  const foreign = (t) => {
    if (box === ctrl || !t || t.nodeType !== 1 || t === box) return false
    const f = t.closest('[data-g-tooltip], .g-tooltip')
    return Boolean(f && f !== ctrl && f !== node && f !== box && box.contains(f) && !f.contains(ctrl))
  }
  // pointerover (con burbuja) llega antes que pointerenter y dice sobre qué está el puntero dentro de la caja
  let inBox = false
  let overForeign = false
  let hovering = false
  const enter = () => {
    hovering = true
    reasons.add('hover')
    clearTimeout(closeT)
    if (suppressed || open) return
    const c = state.current
    clearTimeout(openT)
    if ((c && c !== inst && c.isOpen()) || now() - state.lastHide < SKIP) inst.show('hover')
    else openT = setTimeout(() => inst.show('hover'), OPEN)
  }
  const leave = (rel) => {
    hovering = false
    clearTimeout(openT)
    reasons.delete('hover')
    if (rel && node.contains(rel)) { reasons.add('tip'); return }
    scheduleClose()
  }
  on(box, 'pointerover', (e) => {
    if (!mouse(e)) return
    overForeign = foreign(e.target)
    if (!inBox) return
    if (overForeign && hovering) leave(null)
    else if (!overForeign && !hovering) enter()
  })
  on(box, 'pointerenter', (e) => {
    if (!mouse(e)) return
    inBox = true
    if (!overForeign) enter()
  })
  on(box, 'pointermove', (e) => {
    if (mouse(e)) { if (open && !foreign(e.target)) armDwell(); return }
    if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > MOVE) { clearTimeout(longT); start = null }
  })
  on(box, 'pointerleave', (e) => {
    if (!mouse(e)) return
    inBox = false
    overForeign = false
    suppressed = false
    if (hovering) leave(e.relatedTarget)
    else clearTimeout(openT)
  })
  // El puntero que cruza a la etiqueta (la pestaña es el puente) la mantiene abierta (1.4.13)
  on(node, 'pointerenter', (e) => { if (mouse(e) && open) { reasons.add('tip'); clearTimeout(closeT) } })
  on(node, 'pointermove', (e) => { if (mouse(e) && open) armDwell() })
  on(node, 'pointerleave', (e) => {
    if (!mouse(e)) return
    reasons.delete('tip')
    const rel = e.relatedTarget
    if (rel && rel.nodeType === 1 && box.contains(rel) && !foreign(rel)) return
    scheduleClose()
  })

  // Solo el foco que la persona mueve abre (#384): :focus-visible y tecla de navegación hace menos de NAV sin puntero
  on(ctrl, 'focus', () => {
    if (now() - state.navAt >= NAV || !is(ctrl, ':focus-visible')) return
    reasons.add('focus')
    if (!suppressed) inst.show('focus')
  })
  // Cierra al perder el foco (salvo puntero encima); un cuadro de gracia para que el siguiente control tome el relevo
  on(ctrl, 'blur', () => {
    reasons.delete('focus')
    suppressed = false
    scheduleClose(0)
  })

  on(box, 'pointerdown', (e) => {
    if (foreign(e.target)) return
    if (mouse(e)) {
      // Pulsar es usar: se va y no vuelve hasta salir y entrar
      if (e.button === 0) { hide('press'); suppressed = true }
      return
    }
    if (open) hide('press')
    longFired = false
    start = [e.clientX, e.clientY]
    clearTimeout(longT)
    longT = setTimeout(() => {
      longFired = true
      state.blockClick = box
      reasons.add('touch')
      show('touch')
    }, LONG)
  })
  const endTouch = (e) => {
    if (mouse(e)) return
    clearTimeout(longT)
    start = null
    if (!longFired) return
    longFired = false
    clearTimeout(lingerT)
    lingerT = setTimeout(() => { reasons.delete('touch'); if (!reasons.size) hide('linger') }, readTime(opt.chars ? opt.chars() : 0))
    setTimeout(() => { if (state.blockClick === box) state.blockClick = null }, 400)
  }
  on(box, 'pointerup', endTouch)
  on(box, 'pointercancel', endTouch)
  // El menú contextual del sistema se cancela solo durante la pulsación
  on(box, 'contextmenu', (e) => { if (foreign(e.target)) return; if (start || longFired || (open && node.hasAttribute('data-touch'))) e.preventDefault() })

  return inst
}
