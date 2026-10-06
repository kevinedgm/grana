// Conceptos A, B y C del tooltip (kiwi r02) sobre el MISMO motor de la base (../engine.js) y anchor.js real.
// Lo que cambia por concepto es solo el «visual» (dónde y cómo se pinta) y, en C, la segunda etapa; la semántica
// (role="tooltip" persistente por control, aria-labelledby/aria-describedby al texto, aria-keyshortcuts), los
// retrasos, el grupo, Esc, el puente del puntero, el foco por navegación y el táctil son los de r01.
import { placeAround, parsePlacement, setVar, px, viewport } from '../../../../packages/vue/src/utils/anchor.js'
import { ownVisual, unitOf, _state, TIMING, roving } from '../engine.js'

const rtlOf = (el) => getComputedStyle(el).direction === 'rtl'
const isOpen = (el) => { try { return el.matches(':popover-open') } catch { return false } }
const parts = (inst) => ({
  name: inst.tip.querySelector('.xt__text')?.textContent || '',
  kbd: inst.tip.querySelector('.xt__kbd')?.textContent || '',
  detail: inst.tip.querySelector('.xt__detail')?.textContent || ''
})
// Coloca `el` junto a `rect` con placeAround (anchor.js); devuelve el resultado
function placeEl(el, rect, { placement, gap, keepSide, rtl, unit }) {
  const { width: vw, height: vh } = viewport()
  const want = keepSide ? `${keepSide}-${parsePlacement(placement).align}` : placement
  const r = placeAround(rect, { width: el.offsetWidth, height: el.offsetHeight, vw, vh, placement: want, rtl, pad: unit * 2, gap })
  setVar(el, '--_x', px(r.x))
  setVar(el, '--_y', px(r.y))
  setVar(el, '--_yb', px(vh - r.y - el.offsetHeight))
  el.setAttribute('data-side', r.side)
  return r
}
// Las superficies compartidas (A y B) avisan al motor cuando el puntero entra o sale de ellas (WCAG 1.4.13)
function hoverable(el) {
  el.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') _state.current?.tipEnter() })
  el.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') _state.current?.tipLeave(e.relatedTarget) })
}
function fillInto(el, inst) {
  const p = parts(inst)
  el.querySelector('[data-p=name]').textContent = p.name
  const k = el.querySelector('[data-p=kbd]')
  k.textContent = p.kbd
  k.hidden = !p.kbd
  const d = el.querySelector('[data-p=detail]')
  if (d) { d.textContent = p.detail; d.hidden = !p.detail }
}

// ---------------------------------------------------------------- A · Pestaña que viaja
// Una etiqueta unida al control por una pestaña que mide lo que mide el control. En un grupo hay UNA sola etiqueta
// que viaja de un control al siguiente (posición y ancho), en vez de desaparecer y aparecer en otro sitio.
function tagGeometry(el, trigger, r) {
  const a = trigger.getBoundingClientRect()
  setVar(el, '--_ax', px(a.left - r.x))
  setVar(el, '--_ay', px(a.top - r.y))
  setVar(el, '--_aw', px(a.width))
  setVar(el, '--_ah', px(a.height))
}
export function tagVisual(tag, orientation) {
  let active = null
  let side = null
  const placement = orientation === 'vertical' ? 'right' : 'bottom'
  hoverable(tag)
  const v = {
    show(inst, { instant }) {
      const open = isOpen(tag)
      const travel = open && active && active !== inst
      const w0 = open ? tag.getBoundingClientRect().width : 0
      fillInto(tag, inst)
      tag.toggleAttribute('data-instant', !!instant && !travel)
      tag.toggleAttribute('data-travel', !!travel)
      if (!open) tag.showPopover()
      // Ancho: se mide el natural y se anima desde el anterior (el texto no salta de línea mientras viaja)
      tag.style.removeProperty('inline-size')
      const w1 = tag.offsetWidth
      if (travel) { tag.style.inlineSize = px(w0); tag.offsetWidth; tag.style.inlineSize = px(w1) }
      active = inst
      v.place(inst, travel ? 'keep' : false)
            tag.dispatchEvent(new CustomEvent('xt-visual', { detail: travel ? 'travel' : 'appear' }))
    },
    hide(inst, { switching }) {
      if (switching) { setTimeout(() => { if (active === inst && !inst.open) v.hide(inst, {}) }, 0); return }
      if (active !== inst) return
      active = null
      side = null
      tag.removeAttribute('data-travel')
      if (isOpen(tag)) tag.hidePopover()
      tag.dispatchEvent(new CustomEvent('xt-visual', { detail: 'hide' }))
    },
    place(inst, keep) {
      if (!active) return
      const t = inst.trigger
      const u = unitOf(t)
      const r = placeEl(tag, t.getBoundingClientRect(), { placement, gap: u * 1.5, keepSide: keep ? side : null, rtl: rtlOf(t), unit: u })
      side = r.side
      tagGeometry(tag, t, r)
    },
    owns(inst, node) { return !!node && (tag.contains(node) || inst.tip.contains(node)) }
  }
  return v
}
// A fuera de un grupo: el propio nodo del control, con la misma pestaña
export const tagOwnVisual = {
  ...ownVisual,
  place(inst, keep) {
    ownVisual.place(inst, keep)
    const tip = inst.tip
    const r = { x: parseFloat(tip.style.getPropertyValue('--_x')), y: parseFloat(tip.style.getPropertyValue('--_y')) }
    tagGeometry(tip, inst.trigger, r)
  }
}

// ---------------------------------------------------------------- B · La barra habla
// El grupo tiene UNA leyenda fija pegada a su borde: el texto siempre está en el mismo sitio y una marca en su borde
// señala el control. Nunca tapa la barra. Variante «reservada»: la línea vive en el flujo y no tapa nada.
export function legendVisual(legend, groupEl, orientation, reserved) {
  let active = null
  let side = null
  // En B el grupo entero habla: el puntero en la leyenda o en cualquier punto de la barra (su relleno) la mantiene
  hoverable(legend)
  hoverable(groupEl)
  const placement = orientation === 'vertical' ? 'right-start' : 'bottom-start'
  const marker = (inst) => {
    const a = inst.trigger.getBoundingClientRect()
    const L = legend.getBoundingClientRect()
    // Relativo al borde de relleno de la leyenda (su bloque contenedor), no al de borde
    setVar(legend, '--_mx', px(a.left - L.left - legend.clientLeft))
    setVar(legend, '--_mw', px(a.width))
    setVar(legend, '--_my', px(a.top - L.top - legend.clientTop))
    setVar(legend, '--_mh', px(a.height))
  }
  const v = {
    show(inst, { instant }) {
      const open = reserved || isOpen(legend)
      const swap = open && active && active !== inst
      fillInto(legend, inst)
      legend.toggleAttribute('data-active', true)
      legend.toggleAttribute('data-instant', !!instant && !swap)
      legend.toggleAttribute('data-swap', !!swap)
      if (!reserved && !isOpen(legend)) { legend.showPopover(); active = inst; v.place(inst, false) }
      active = inst
      marker(inst)
      legend.dispatchEvent(new CustomEvent('xt-visual', { detail: swap ? 'swap' : 'appear' }))
    },
    hide(inst, { switching }) {
      if (switching) { setTimeout(() => { if (active === inst && !inst.open) v.hide(inst, {}) }, 0); return }
      if (active !== inst) return
      active = null
      side = null
      legend.removeAttribute('data-active')
      legend.removeAttribute('data-swap')
      if (!reserved && isOpen(legend)) legend.hidePopover()
      legend.dispatchEvent(new CustomEvent('xt-visual', { detail: 'hide' }))
    },
    place(inst, keep) {
      if (!active) return
      if (!reserved) {
        const u = unitOf(groupEl)
        const g = groupEl.getBoundingClientRect()
        // La leyenda mide lo que mide el grupo en su eje (ancho de la barra, alto del riel): la marca siempre cae dentro
        if (orientation !== 'vertical') setVar(legend, '--_minw', px(g.width))
        else setVar(legend, '--_minh', px(g.height))
        const r = placeEl(legend, g, { placement, gap: u, keepSide: keep ? side : null, rtl: rtlOf(groupEl), unit: u })
        side = r.side
      }
      marker(inst)
    },
    owns(inst, node) { return !!node && (legend.contains(node) || groupEl.contains(node) || inst.tip.contains(node)) }
  }
  return v
}

// ---------------------------------------------------------------- C · Pista en dos tiempos
// Primero el nombre (pequeño, rápido de leer); si el puntero se queda quieto o el foco se mantiene, crece hacia fuera
// del control con la descripción y el atajo. En táctil, todo de una vez y visible el tiempo que pide su texto.
export const readingMs = (inst) => {
  const p = parts(inst)
  const chars = (p.name + ' ' + p.detail + ' ' + p.kbd).trim().length
  return Math.min(6000, Math.max(TIMING.linger, 1000 + 50 * chars))
}
export const twoStageVisual = {
  ...ownVisual,
  place(inst, keep) {
    ownVisual.place(inst, keep)
    const tip = inst.tip
    const { height: vh } = viewport()
    setVar(tip, '--_yb', px(vh - parseFloat(tip.style.getPropertyValue('--_y')) - tip.offsetHeight))
  }
}
export function dwellC(inst) {
  const tip = inst.tip
  if (tip.hasAttribute('data-dwell') || !tip.querySelector('.cc-more')) return
  tip.setAttribute('data-dwell', '')
  // El ancho final se aplica ya (x una vez); el alto crece hacia fuera del control (top: ancla abajo; bottom: ancla arriba)
  twoStageVisual.place(inst, true)
  const done = () => { if (inst.open) twoStageVisual.place(inst, true) }
  tip.addEventListener('transitionend', done, { once: true })
  setTimeout(done, 300)
  tip.dispatchEvent(new CustomEvent('xt-visual', { detail: 'grow' }))
}

/** Contexto que lee XTooltip (inject 'xt-concept'). `group`: { visual } o null. */
export function conceptFor(c, group) {
  if (c === '0') return { cls: 'x0', options: (base) => base }
  if (c === 'A') return {
    cls: 'ca',
    options: (base) => ({ ...base, placement: group?.orientation === 'vertical' ? 'right' : 'bottom', gap: 1.5, visual: group ? group.visual : tagOwnVisual }),
    render: (h, { props, id }) => [
      h('span', { class: 'ca__tab', 'aria-hidden': 'true' }),
      h('span', { class: 'ca__body' }, [
        h('span', { class: 'xt__text', id: id + '-name' }, props.text),
        props.shortcut ? h('kbd', { class: 'xt__kbd', 'aria-hidden': 'true' }, props.shortcut) : null,
        props.detail ? h('span', { class: 'xt__detail', id: id + '-detail' }, props.detail) : null
      ])
    ]
  }
  if (c === 'B') return {
    cls: 'cb-own',
    options: (base) => ({ ...base, placement: 'bottom-start', gap: 1, visual: group ? group.visual : ownVisual })
  }
  if (c === 'C') return {
    cls: 'cc',
    options: (base) => ({ ...base, visual: twoStageVisual, onDwell: dwellC, dwell: 700, linger: readingMs }),
    render: (h, { props, id }) => [
      h('span', { class: 'xt__text', id: id + '-name' }, props.text),
      (props.detail || props.shortcut) ? h('span', { class: 'cc-more' }, [h('span', { class: 'cc-more__in' }, [
        props.detail ? h('span', { class: 'xt__detail', id: id + '-detail' }, props.detail) : null,
        props.shortcut ? h('kbd', { class: 'xt__kbd', 'aria-hidden': 'true' }, props.shortcut) : null
      ])]) : null
    ]
  }
  return null
}

/** Grupo de prototipo (XTipGroup): una barra o un riel; en A y B lleva la superficie compartida (aria-hidden). */
export function makeXTipGroup(Vue) {
  const { defineComponent, h, ref, provide, onMounted } = Vue
  return defineComponent({
    name: 'XTipGroup',
    inheritAttrs: false,
    props: { concept: String, orientation: { type: String, default: 'horizontal' }, label: String, reserved: Boolean },
    setup(props, { slots, attrs }) {
      const root = ref(null)
      const shared = ref(null)
      const group = { orientation: props.orientation, visual: null }
      // El visual se crea al montar (necesita los nodos); XTooltip lo lee en su propio onMounted, que ocurre antes:
      // por eso se pasa un intermediario que delega en el visual real.
      const lazy = {
        show: (...a) => group.real.show(...a), hide: (...a) => group.real.hide(...a),
        place: (...a) => group.real.place(...a), owns: (...a) => group.real.owns(...a)
      }
      if (props.concept === 'A' || props.concept === 'B') group.visual = lazy
      provide('xt-concept', conceptFor(props.concept, group.visual ? group : null))
      onMounted(() => {
        roving(root.value, props.orientation)
        if (props.concept === 'A') group.real = tagVisual(shared.value, props.orientation)
        if (props.concept === 'B') group.real = legendVisual(shared.value, root.value, props.orientation, props.reserved)
      })
      const sharedNode = () => {
        if (props.concept === 'A') return h('div', { ref: shared, class: 'ca-tag', popover: 'manual', 'aria-hidden': 'true', 'data-orientation': props.orientation }, [
          h('span', { class: 'ca__tab' }),
          h('span', { class: 'ca__body' }, [h('span', { 'data-p': 'name', class: 'xt__text' }), h('kbd', { 'data-p': 'kbd', class: 'xt__kbd' }), h('span', { 'data-p': 'detail', class: 'xt__detail' })])
        ])
        if (props.concept === 'B') return h('div', { ref: shared, class: ['cb-legend', props.reserved && 'is-reserved'], popover: props.reserved ? undefined : 'manual', 'aria-hidden': 'true', 'data-orientation': props.orientation }, [
          h('span', { class: 'cb__marker' }),
          h('span', { class: 'cb__line' }, [h('span', { 'data-p': 'name', class: 'cb__name' }), h('kbd', { 'data-p': 'kbd', class: 'xt__kbd' })]),
          h('span', { 'data-p': 'detail', class: 'cb__detail' }),
          props.reserved ? h('span', { class: 'cb__idle' }, 'Pasa por un botón o recórrelo con Tab') : null
        ])
        return null
      }
      return () => {
        const bar = h('div', { ...attrs, ref: root, class: ['x-group', `x-group--${props.orientation}`], role: 'toolbar', 'aria-label': props.label, 'aria-orientation': props.orientation === 'vertical' ? 'vertical' : undefined }, slots.default && slots.default())
        return props.concept === 'B' && props.reserved ? h('div', { class: 'x-group-wrap' }, [bar, sharedNode()]) : [bar, sharedNode()]
      }
    }
  })
}
