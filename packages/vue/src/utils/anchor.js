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
