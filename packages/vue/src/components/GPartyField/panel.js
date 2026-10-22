// Panel anclado de la consulta (dueño: bruno). Interno de la entrada @grana/vue/booking: lo usan el panel de GPartyField
// y los paneles propios de los huecos de la frase de GBookingBar (booking-bar.md «Panel»; api.md «Paneles anclados», reglas
// 1 a 3, #358). Capa superior (`popover="manual"`), dentro del visor con margen de space × 2, arriba si abajo no cabe (lado
// estable mientras está abierto), nunca recortado; se cierra si el ancla sale del visor. Abrir lleva el foco al primer
// control; Esc cierra y devuelve el foco; Tab fuera o tocar fuera cierran SIN robar el foco (el cierre por Tab se comprueba
// tras el evento: en WebKit el foco puede irse al navegador y `relatedTarget` es null); tocar el fondo del panel no cierra.
// Una activación por gesto (#661): el segundo clic de una ráfaga y Intro o Espacio mantenidos no cambian el estado.
// Sin efectos al importar (#444): las escuchas se instalan al abrir y se retiran al cerrar.
import { nextTick, onBeforeUnmount, ref } from 'vue'
import { anchorGone, followFrame, isPhone, px, setVar, stickySide } from '../../utils/anchor.js'
import { spaceUnit } from '../GForm/formContext.js'

const FOCUSABLE = 'input:not([type="hidden"]):not(:disabled), button:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])'
export const repeatGesture = (e) => Boolean(e && ((e.type === 'click' && e.detail > 1) || (e.repeat && (e.key === 'Enter' || e.key === ' '))))

/**
 * usePanel({ panel: () => el, anchor: () => el, onOpen, onClose }) → { open, show(anchorEl?), hide(returnFocus), toggle(e) }
 */
export function useAnchoredPanel(opts) {
  const open = ref(false)
  let anchorEl = null
  let side = null
  const panel = () => opts.panel()
  const anchor = () => anchorEl || opts.anchor()

  function place(full = true) {
    const el = panel()
    const a = anchor()
    if (!el || !a || typeof window === 'undefined') return
    const unit = spaceUnit(el)
    const m = unit * 2
    const r = a.getBoundingClientRect()
    const vw = document.documentElement.clientWidth || window.innerWidth
    const vh = window.innerHeight
    if (full) el.style.setProperty('--_max', 'none')
    const w = el.offsetWidth
    const hgt = el.scrollHeight
    const below = vh - r.bottom - m
    const above = r.top - m
    const prev = side
    if (!side) side = hgt > below && above > below ? 'top' : 'bottom'
    else side = stickySide(side, { below, above, unit })
    const rtl = getComputedStyle(el).direction === 'rtl'
    const x = Math.min(Math.max(m, rtl ? r.right - w : r.left), Math.max(m, vw - m - w))
    const room = Math.max(side === 'top' ? above : below, 0)
    const y = side === 'top' ? Math.max(m, r.top - unit - Math.min(hgt, room)) : r.bottom + unit
    setVar(el, '--_x', px(x))
    setVar(el, '--_y', px(y))
    if (full || side !== prev) el.style.setProperty('--_max', px(room))
    if (el.getAttribute('data-side') !== side) el.setAttribute('data-side', side)
  }
  const follow = followFrame((scroller) => {
    if (!open.value) return
    if (!isPhone() && anchorGone(anchor(), scroller)) { hide(false); return }
    place(false)
  })
  const onScroll = (e) => {
    const t = e && e.target
    const el = panel()
    if (!open.value || (t && t.nodeType === 1 && el && el.contains(t))) return
    follow.schedule(t)
  }
  const onResize = () => { if (open.value) place() }
  function inside(node) {
    const el = panel()
    const a = anchor()
    return Boolean(node && node.nodeType === 1 && ((el && el.contains(node)) || (a && a.contains(node))))
  }
  const onOutside = (e) => { if (!inside(e.target)) hide(false) }
  const onFocusout = () => {
    // Tras el evento: dónde quedó el foco (no solo relatedTarget, que en WebKit puede ser null)
    setTimeout(() => {
      if (!open.value) return
      const active = document.activeElement
      if (!inside(active)) hide(false)
    }, 0)
  }
  const onKeydown = (e) => {
    if (e.key !== 'Escape' || e.isComposing) return
    // Esc cierra solo el panel: no llega a un GDialog que también la escuche
    e.preventDefault()
    e.stopPropagation()
    hide(true)
  }
  function listen(on) {
    const el = panel()
    const m = on ? 'addEventListener' : 'removeEventListener'
    document[m]('pointerdown', onOutside, true)
    window[m]('resize', onResize)
    window[m]('scroll', onScroll, true)
    if (el) {
      el[m]('focusout', onFocusout)
      el[m]('keydown', onKeydown)
    }
    const a = anchor()
    if (a) a[m]('focusout', onFocusout)
  }

  function show(a) {
    if (open.value) return
    if (a) anchorEl = a
    open.value = true
    side = null
    nextTick(() => {
      const el = panel()
      if (!el || !open.value) return
      if (typeof el.showPopover === 'function' && !(el.matches && safeMatches(el, ':popover-open'))) el.showPopover()
      place()
      listen(true)
      const first = el.querySelector(FOCUSABLE)
      if (first) first.focus({ preventScroll: true })
      if (opts.onOpen) opts.onOpen()
    })
  }
  function hide(returnFocus = false) {
    if (!open.value) return
    open.value = false
    listen(false)
    follow.cancel()
    side = null
    const el = panel()
    if (el && typeof el.hidePopover === 'function' && safeMatches(el, ':popover-open')) el.hidePopover()
    if (returnFocus) { const a = anchor(); if (a) a.focus({ preventScroll: true }) }
    if (opts.onClose) opts.onClose(returnFocus)
  }
  function toggle(e) {
    if (repeatGesture(e)) return
    const a = e && e.currentTarget && e.currentTarget.nodeType === 1 ? e.currentTarget : null
    if (open.value) hide(true)
    else show(a)
  }
  onBeforeUnmount(() => { if (open.value) { listen(false); follow.cancel() } })
  return { open, show, hide, toggle, place }
}

function safeMatches(el, sel) {
  try { return el.matches(sel) } catch { return false }
}
