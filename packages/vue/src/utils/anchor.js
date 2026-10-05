// Posicionamiento anclado (interno; dueño: bruno). Extraído de GMenu (DECISIONS.md #102): sin dependencias.
// Todas las funciones son puras: reciben el rectángulo del ancla (coordenadas de visor), el tamaño del elemento
// y el visor, y devuelven coordenadas físicas { x, y } para `left`/`top` de un elemento `position: fixed`.
// `left`/`right` como lado son lógicos (inicio/fin de línea): en RTL se reflejan.

const clamp = (v, min, max) => Math.min(Math.max(min, v), max)

/** Visor actual (ancho y alto en px) */
export const viewport = () => ({ width: window.innerWidth, height: window.innerHeight })

/**
 * Lista principal de GMenu: debajo o encima del ancla, alineada al inicio o al final, con el alto que quepa.
 * Devuelve { x, y, room } (room: alto disponible en el lado elegido).
 */
export function placeBlock(a, { width, naturalHeight, vw, vh, align = 'start', side = 'auto', rtl = false, pad = 8, gap = 4 }) {
  const atEnd = align === 'end'
  const left = (rtl ? !atEnd : atEnd) ? a.right - width : a.left
  const x = Math.min(Math.max(pad, left), vw - pad - width)
  const below = vh - a.bottom - pad - gap
  const above = a.top - pad - gap
  const preferTop = side === 'top' || (side === 'auto' && naturalHeight > below && above > below)
  if (!preferTop) return { x, y: a.bottom + gap, room: below }
  return { x, y: a.top - gap - Math.min(naturalHeight, above), room: above }
}

/**
 * Submenú de GMenu: al final de línea del elemento padre (al inicio si no cabe), desplazado para no salir del visor.
 * Devuelve { x, y, room }.
 */
export function placeSubmenu(a, { width, naturalHeight, vw, vh, rtl = false, pad = 8, overlap = 4, lift = 6 }) {
  let x = rtl ? a.left - width + overlap : a.right - overlap
  if (!rtl && x + width > vw - pad) x = Math.max(pad, a.left - width + overlap)
  if (rtl && x < pad) x = Math.min(vw - pad - width, a.right - overlap)
  const room = vh - 2 * pad
  const hh = Math.min(naturalHeight, room)
  let y = a.top - lift
  if (y + hh > vh - pad) y = vh - pad - hh
  return { x, y, room }
}

// ---------- Panel estable al desplazar la página (reporte del usuario sobre GCombobox, c4b087d) ----------
// Mismas reglas en GCombobox, GSelect, GMenu, GDatePicker, GHelper y el editor de GFilterBar:
//  1. el lado se decide AL ABRIR y se conserva: solo cambia si el actual deja de ser útil (menos de space × 40) y el otro
//     ofrece claramente más (al menos space × 12 más), nunca en cada cuadro;
//  2. el alto disponible (--_max) se fija al abrir, al cambiar el contenido, en resize y al cambiar de lado; durante el
//     desplazamiento solo se escribe la posición, una vez por cuadro (followFrame) y solo si cambia (setVar);
//  3. si el ancla sale del visor (o de su contenedor con desplazamiento), el panel se cierra (anchorGone);
//  4. el puntero nunca desplaza la lista y solo activa con movimiento real (GSelect, GMenu y GCombobox, cada uno en su
//     manejador de puntero).
export const SIDE_MIN_SPACES = 40
export const SIDE_FLIP_SPACES = 12

/**
 * Histéresis del lado vertical ('bottom' | 'top'). `below` y `above`: alto disponible en cada lado (px); `unit`: space
 * en px. Devuelve el lado que se conserva o, si el actual dejó de ser útil y el otro ofrece claramente más, el otro.
 */
export function stickySide(side, { below, above, unit }) {
  const top = side === 'top'
  const cur = top ? above : below
  const other = top ? below : above
  if (cur >= unit * SIDE_MIN_SPACES || other < cur + unit * SIDE_FLIP_SPACES) return side
  return top ? 'bottom' : 'top'
}

/** Umbral del visor móvil (literal de #42 y #56): por debajo, GSelect y GDatePicker son hoja y no siguen a su ancla */
export const PHONE_QUERY = '(max-width: 520px)'
export const isPhone = () => typeof matchMedia === 'function' && matchMedia(PHONE_QUERY).matches

/**
 * Regla 3: el ancla salió de la vista, del visor o del contenedor con desplazamiento (`scroller`, el destino del evento
 * scroll) que la contiene. Entonces el panel se cierra, sin devolver el foco (devolverlo desplazaría la página).
 * Comparación estricta: un ancla sin caja (0 × 0 en el origen) no cuenta como fuera.
 */
export function anchorGone(el, scroller) {
  if (!el || typeof window === 'undefined') return false
  const r = el.getBoundingClientRect()
  const vh = window.innerHeight
  const vw = document.documentElement.clientWidth || window.innerWidth
  if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) return true
  if (!scroller || scroller.nodeType !== 1 || scroller === document.documentElement || scroller === document.body || !scroller.contains(el)) return false
  const c = scroller.getBoundingClientRect()
  return r.bottom < c.top || r.top > c.bottom || r.right < c.left || r.left > c.right
}

/** px con dos decimales: la misma posición da la misma cadena (setVar no reescribe) */
export const px = (n) => `${Math.round(n * 100) / 100}px`

/** Variable CSS en línea, solo si cambia (style.setProperty: no pasa por el render ni por el atributo style) */
export function setVar(el, name, value) {
  if (el.style.getPropertyValue(name) === value) return false
  el.style.setProperty(name, value)
  return true
}

/**
 * Seguimiento al desplazar: `schedule(arg)` ejecuta `fn(arg)` como mucho una vez por cuadro (los eventos del mismo cuadro
 * se agrupan; vale el primero); `cancel()` lo anula al cerrar.
 */
export function followFrame(fn) {
  let id = 0
  let timer = false
  return {
    schedule(arg) {
      if (id) return
      const run = () => { id = 0; fn(arg) }
      timer = typeof requestAnimationFrame !== 'function'
      id = timer ? setTimeout(run, 16) : requestAnimationFrame(run)
    },
    cancel() {
      if (!id) return
      if (timer) clearTimeout(id)
      else cancelAnimationFrame(id)
      id = 0
    }
  }
}

const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }
const ORDER = ['top', 'right', 'bottom', 'left']

/** Separa un placement (`top-end`, `left`…) en { side, align } */
export const parsePlacement = (placement) => {
  const [side, align = 'center'] = String(placement).split('-')
  return { side, align }
}

// Coordenadas de un lado concreto (sin comprobar si cabe)
function candidate(a, width, height, side, align, rtl, gap) {
  const physical = rtl ? { left: 'right', right: 'left' }[side] || side : side
  if (side === 'top' || side === 'bottom') {
    const al = rtl && align !== 'center' ? (align === 'start' ? 'end' : 'start') : align
    const y = side === 'top' ? a.top - gap - height : a.bottom + gap
    const x = al === 'start' ? a.left : al === 'end' ? a.right - width : a.left + a.width / 2 - width / 2
    return { x, y }
  }
  const x = physical === 'left' ? a.left - gap - width : a.right + gap
  const y = align === 'start' ? a.top : align === 'end' ? a.bottom - height : a.top + a.height / 2 - height / 2
  return { x, y }
}

/**
 * Contenido flotante (GHelper): prueba el lado pedido, el opuesto y los perpendiculares; en el primero que cabe
 * entero en el visor (con margen `pad`), lo desplaza sobre el eje secundario hasta quedar dentro.
 * Devuelve { x, y, side, room, fits }. Si ningún lado cabe, `fits` es false y se devuelve el pedido ajustado al visor.
 */
export function placeAround(a, { width, height, vw, vh, placement = 'bottom', rtl = false, pad = 8, gap = 8 }) {
  const { side, align } = parsePlacement(placement)
  const order = [side, OPPOSITE[side], ...ORDER.filter((s) => s !== side && s !== OPPOSITE[side])]
  const roomOf = (s, c) => (s === 'top' ? a.top - gap - pad : s === 'bottom' ? vh - a.bottom - gap - pad : vh - 2 * pad)
  const tooBig = width > vw - 2 * pad || height > vh - 2 * pad
  if (!tooBig) {
    for (const s of order) {
      const c = candidate(a, width, height, s, align, rtl, gap)
      const vertical = s === 'top' || s === 'bottom'
      const fitsMain = vertical ? c.y >= pad && c.y + height <= vh - pad : c.x >= pad && c.x + width <= vw - pad
      if (!fitsMain) continue
      return {
        x: clamp(c.x, pad, vw - pad - width),
        y: clamp(c.y, pad, vh - pad - height),
        side: s,
        room: roomOf(s, c),
        fits: true
      }
    }
  }
  const c = candidate(a, width, height, side, align, rtl, gap)
  return {
    x: clamp(c.x, pad, Math.max(pad, vw - pad - width)),
    y: clamp(c.y, pad, Math.max(pad, vh - pad - height)),
    side,
    room: vh - 2 * pad,
    fits: false
  }
}
