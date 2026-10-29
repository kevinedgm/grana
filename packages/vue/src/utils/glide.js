// «Una sola luz» (interno; dueño: bruno). api.md «Una sola luz», DECISIONS #957 a #963; ronda design/lab/hover-glide/r01/.
// Una capa por lista que se desliza al destino bajo el PUNTERO (no al foco): GSidebar y GTable. La luz es presentación:
// no toca el foco, ni aria-*, ni tabindex, ni emite eventos. Sin efectos al importar (#444): las escuchas de documento
// (pointerup, pointercancel, scroll) existen solo mientras el puntero está dentro o pulsado; destroy() lo quita todo.
// Datos: has-highlight e is-highlight-instant (dos cuadros) en el anfitrión; --_highlight-x/-y/-w/-h (px FÍSICOS respecto
// de la caja de relleno del anfitrión más su scroll, también en RTL) en la CAPA, el primer hijo del anfitrión (#962).
// Por qué en la capa: una propiedad personalizada escrita en el anfitrión se hereda y obliga a recalcular el estilo de
// todo su árbol en cada movimiento; con 500 filas eso eran tareas de 50 a 84 ms (medido, glide-perf.spec.mjs; #963 pide
// 0). El CSS de coco solo las lee en la regla de la capa, así que se resuelven igual. Coco pinta posición, color y radio.
import { setVar } from './anchor.js'
import { observeSize } from './sizeObserver.js'
import { nextFrame } from '../components/GForm/formContext.js'

// Solo ratón y lápiz: con el toque no pasa nada, también en híbridos (regla 3; por tipo de puntero, no por @media)
const aimed = (e) => e.pointerType === 'mouse' || e.pointerType === 'pen'
const DOC = { capture: true, passive: true }

/** `is-highlight-instant` en `host` durante dos cuadros (la última llamada manda). También lo usa M1 de GMenu (menuNav.js) */
export function flashInstant(host) {
  const turn = (host._glideTurn = (host._glideTurn || 0) + 1)
  host.classList.add('is-highlight-instant')
  nextFrame(() => nextFrame(() => { if (host._glideTurn === turn) host.classList.remove('is-highlight-instant') }))
}

/**
 * Coloca la luz de `host` sobre la caja de `el` (null la apaga). La primera colocación (sin `has-highlight`) y toda
 * colocación con `instant` llevan `is-highlight-instant` durante dos cuadros: aparece donde está, sin viajar.
 * Dos lecturas de caja; escribe cada medida solo si cambia, en `layer` o, sin ella, en `host`.
 */
export function placeHighlight(host, el, { instant, layer } = {}) {
  const cl = host.classList
  const first = !cl.contains('has-highlight')
  if (!el) {
    if (!first) cl.remove('has-highlight')
    return
  }
  if (first || instant) flashInstant(host)
  const b = el.getBoundingClientRect()
  const o = host.getBoundingClientRect()
  const v = { x: b.left - o.left - host.clientLeft + host.scrollLeft, y: b.top - o.top - host.clientTop + host.scrollTop, w: b.width, h: b.height }
  for (const k in v) setVar(layer || host, `--_highlight-${k}`, `${Math.round(v[k])}px`)
  if (first) cl.add('has-highlight')
}

/**
 * Sesión del puntero de una lista (#958). `target`: selector del destino (o función que lo da); `accept(el)`: si
 * ese destino se ilumina (un deshabilitado, lo inerte o lo ajeno apagan: nunca «el más cercano»); `box(el)`: la caja que
 * se mide (por defecto, el propio destino); `off()`: la forma no lleva luz ahora (nada se registra). Las medidas van en
 * la capa, el primer hijo del anfitrión (ver arriba). Un pointermove delegado y un cuadro por anfitrión: en movimiento el
 * destino lo da el evento (ninguna prueba de impacto) y solo tras un scroll o un cambio de tamaño con el puntero quieto
 * hay un elementFromPoint; dos lecturas de caja cuando cambia el destino, ninguna si no.
 */
export function createPointerGlide(host, { target, accept = () => true, box = (el) => el, off = () => false } = {}) {
  let pt = null // última posición del puntero dentro (cliente)
  let node = null // destino del último evento del puntero
  let cur = null
  let inside = false
  let pressed = false
  let frame = false
  let still = false
  const doc = host.ownerDocument

  const put = (el, instant) => {
    if (el && el === cur && !instant) return // misma caja: nada que leer
    cur = el
    placeHighlight(host, el && box(el), { instant, layer: host.firstElementChild })
  }
  const find = () => {
    if (!pt || off()) return null
    const n = node && node.isConnected ? node : doc.elementFromPoint(pt.x, pt.y)
    const el = n && host.contains(n) && n.closest(typeof target === 'function' ? target() : target)
    return el && host.contains(el) && accept(el) ? el : null
  }
  const run = () => {
    if (!frame) return // cancelado
    frame = false
    const s = still
    still = false
    if (pressed && cur) { if (s) put(cur.isConnected ? cur : null, true); return } // pulsado: se queda en lo pulsado
    if (s) node = null // con el puntero quieto, lo que hay debajo lo dice la prueba de impacto
    put(find(), s)
  }
  const schedule = (s) => {
    if (s) still = true
    if (!frame) { frame = true; nextFrame(run) }
  }
  const dark = () => { frame = still = false; put(null) }

  const onUp = () => {
    if (!pressed) return
    pressed = false
    if (inside) schedule()
    else { dark(); docAt(false) }
  }
  // Desplazar con el puntero quieto: pasa AL INSTANTE a lo que queda debajo (también el scroll de la página)
  const onScroll = () => { if (pt || pressed) schedule(true) }
  const docs = { pointerup: onUp, pointercancel: onUp, scroll: onScroll }
  // Añadir dos veces la misma escucha no la duplica, y quitar una que no está no hace nada
  const docAt = (on) => { for (const k in docs) doc[on ? 'addEventListener' : 'removeEventListener'](k, docs[k], DOC) }
  const enter = (e) => {
    pt = { x: e.clientX, y: e.clientY }
    node = e.target
    if (!inside) { inside = true; docAt(true) }
  }
  const own = {
    pointermove(e) {
      if (!aimed(e)) return
      enter(e)
      if (!pressed) schedule()
    },
    pointerleave(e) {
      if (!aimed(e)) return
      inside = false
      pt = node = null
      if (pressed) return // pulsado: lo pulsado sigue iluminado hasta soltar
      dark()
      docAt(false)
    },
    pointerdown(e) {
      if (!aimed(e)) return
      enter(e)
      // Un movimiento aún sin colocar (o ninguno): lo pulsado se ilumina ya, antes de fijarse
      if (frame || !cur) { frame = true; run() }
      pressed = true
    }
  }
  for (const k in own) host.addEventListener(k, own[k])
  // Cambio de tamaño (submenú, contraer, desplegar): se recoloca sin viajar; apagada, no se enciende sola
  const unobserve = observeSize(host, () => { if (cur) schedule(true) })

  // clear(): cambio de filas sin gesto, se apaga y vuelve con el siguiente movimiento
  return {
    clear() {
      pt = node = null
      dark()
    },
    destroy() {
      frame = false
      for (const k in own) host.removeEventListener(k, own[k])
      docAt(false)
      unobserve()
      cur = pt = node = null
    }
  }
}
