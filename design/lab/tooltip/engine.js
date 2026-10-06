// Motor del tooltip para los prototipos de kiwi (r01 base y r02 conceptos). NO es el componente: es la maqueta de su
// comportamiento, con el posicionamiento REAL de Grana (packages/vue/src/utils/anchor.js, sin copiarlo).
// Expone: TIMING, attach(trigger, tip, opt), resolveKind(el, text, ownIds), makeXTooltip(Vue) y log (sucesos para la verificación).
import { placeAround, parsePlacement, anchorGone, followFrame, setVar, px, viewport } from '../../../packages/vue/src/utils/anchor.js'

// Constantes de comportamiento (ms). Base r01, declaracion.md §4. No son tokens (como HOVER_MS de GMenu, #308).
export const TIMING = {
  open: 350,    // reposo del puntero antes de abrir (el mismo que la pista de GSidebar)
  close: 100,   // gracia al salir del control o del tooltip
  skip: 600,    // ventana de grupo: si otro se cerró hace menos, el siguiente abre sin espera y sin entrada
  nav: 1000,    // un foco cuenta como «por navegación» si una tecla de navegación ocurrió hace menos de esto
  long: 500,    // pulsación larga en táctil
  linger: 1500, // en táctil, lo que queda visible al soltar
  move: 10      // px que cancelan la pulsación larga
}
const NAV = new Set(['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown', 'F6'])
export const FOCUSABLE = 'button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'
export const log = []
const now = () => performance.now()
const state = { current: null, lastHide: -1e9, navAt: -1e9, blockClick: null }
export const _state = state

const toPx = (v) => {
  const n = parseFloat(v)
  if (Number.isNaN(n)) return 4
  return /rem\s*$/.test(v) ? n * parseFloat(getComputedStyle(document.documentElement).fontSize) : n
}
export const unitOf = (el) => toPx(getComputedStyle(el).getPropertyValue('--g-space-1'))
const matches = (el, sel) => { try { return el.matches(sel) } catch { return false } }

let installed = false
function install() {
  if (installed) return
  installed = true
  // Una sola escucha de documento para Esc, navegación y clic fuera (no una por instancia)
  document.addEventListener('keydown', (e) => {
    if (NAV.has(e.key)) state.navAt = now()
    if (e.key === 'Escape' && !e.isComposing && state.current && !e.defaultPrevented) {
      // Convención de Grana: un descendiente que ya trató Esc lo cancela (GDialog lo respeta y no se cierra)
      e.preventDefault()
      state.current.dismiss()
    }
  }, true)
  document.addEventListener('pointerdown', (e) => {
    state.navAt = -1e9
    const c = state.current
    if (c && !c.trigger.contains(e.target) && !c.owns(e.target)) c.hide('outside')
  }, true)
  // Tras una pulsación larga, el clic que la sigue no activa el control (la persona preguntó «qué es», no «hazlo»)
  document.addEventListener('click', (e) => {
    const t = state.blockClick
    if (t && t.contains(e.target)) { e.preventDefault(); e.stopPropagation(); state.blockClick = null; log.push({ t: now(), type: 'click-blocked' }) }
  }, true)
}

// Visual por defecto: el propio nodo role="tooltip" en la capa superior, con placeAround de anchor.js
export const ownVisual = {
  show(inst) { const tip = inst.tip; if (!matches(tip, ':popover-open')) tip.showPopover(); this.place(inst) },
  hide(inst) { const tip = inst.tip; if (matches(tip, ':popover-open')) tip.hidePopover() },
  place(inst, keep) {
    const { tip, trigger, opt } = inst
    const u = unitOf(trigger)
    const pad = u * 2
    const gap = u * (opt.gap ?? 2)
    const { width: vw, height: vh } = viewport()
    const want = opt.placement || 'top'
    const placement = keep && inst.side ? `${inst.side}-${parsePlacement(want).align}` : want
    const a = trigger.getBoundingClientRect()
    const r = placeAround(a, { width: tip.offsetWidth, height: tip.offsetHeight, vw, vh, placement, rtl: getComputedStyle(trigger).direction === 'rtl', pad, gap })
    setVar(tip, '--_x', px(r.x))
    setVar(tip, '--_y', px(r.y))
    setVar(tip, '--_gap', px(gap))
    // Centro del control en coordenadas del tooltip (para la pestaña de A y la marca de una flecha futura)
    setVar(tip, '--_ax', px(a.left + a.width / 2 - r.x))
    setVar(tip, '--_ay', px(a.top + a.height / 2 - r.y))
    setVar(tip, '--_aw', px(a.width))
    setVar(tip, '--_ah', px(a.height))
    if (keep !== 'scroll' || r.side !== inst.side) { inst.side = r.side; tip.setAttribute('data-side', r.side) }
  },
  owns(inst, node) { return !!node && inst.tip.contains(node) }
}

/**
 * Engancha el comportamiento a un control. `tip`: nodo role="tooltip" persistente (hermano del control).
 * opt: { placement, gap (unidades de space), visual, disabled(): bool, linger(inst): ms, onDwell }
 */
export function attach(trigger, tip, opt = {}) {
  install()
  const visual = opt.visual || ownVisual
  const reasons = new Set()
  let openT = 0, closeT = 0, longT = 0, lingerT = 0, dwellT = 0
  let suppressed = false, longFired = false, start = null
  const inst = { trigger, tip, opt, open: false, side: null, reasons, visual }

  const canShow = () => {
    if (opt.disabled && opt.disabled()) return false
    if (trigger.getAttribute('aria-expanded') === 'true') return false // su menú o panel está abierto: no lo tapa
    if (matches(trigger, ':disabled')) return false
    return true
  }
  const follow = followFrame((scroller) => {
    if (!inst.open) return
    if (anchorGone(trigger, scroller)) { hide('gone'); return }
    visual.place(inst, 'scroll')
  })
  const onScroll = (e) => { const t = e && e.target; if (t && t.nodeType === 1 && inst.owns(t)) return; follow.schedule(t) }
  const onResize = () => visual.place(inst, true)
  const listen = () => { window.addEventListener('scroll', onScroll, true); window.addEventListener('resize', onResize) }
  const unlisten = () => { window.removeEventListener('scroll', onScroll, true); window.removeEventListener('resize', onResize); follow.cancel() }

  function show(reason) {
    clearTimeout(openT); clearTimeout(closeT)
    if (inst.open || !canShow()) return
    const prev = state.current
    const switching = !!(prev && prev !== inst)
    const instant = switching || now() - state.lastHide < TIMING.skip
    if (switching) prev.hide('switch')
    inst.open = true
    state.current = inst
    tip.toggleAttribute('data-instant', instant)
    visual.show(inst, { instant, from: switching ? prev : null })
    listen()
    log.push({ t: now(), type: 'show', id: tip.id, instant, reason, switching })
    if (opt.onShow) opt.onShow(inst)
  }
  function hide(why) {
    clearTimeout(openT); clearTimeout(closeT); clearTimeout(lingerT); clearTimeout(dwellT)
    reasons.clear()
    if (!inst.open) return
    inst.open = false
    if (state.current === inst) state.current = null
    state.lastHide = now()
    visual.hide(inst, { switching: why === 'switch' })
    unlisten()
    tip.removeAttribute('data-dwell')
    log.push({ t: now(), type: 'hide', id: tip.id, why })
  }
  const scheduleClose = () => {
    if (reasons.size) return
    clearTimeout(closeT)
    closeT = setTimeout(() => { if (!reasons.size) hide('leave') }, TIMING.close)
  }
  const armDwell = () => {
    if (!opt.onDwell) return
    clearTimeout(dwellT)
    dwellT = setTimeout(() => { if (inst.open) opt.onDwell(inst) }, opt.dwell ?? 700)
  }
  inst.show = show
  inst.hide = hide
  inst.dismiss = () => { hide('escape'); suppressed = true }
  inst.owns = (node) => visual.owns(inst, node)
  // El puntero que cruza al tooltip (o a la superficie del concepto) lo mantiene abierto (WCAG 1.4.13, «hoverable»)
  inst.tipEnter = () => { if (inst.open) { reasons.add('hover'); clearTimeout(closeT) } }
  inst.tipLeave = (related) => { if (related && trigger.contains(related)) return; reasons.delete('hover'); scheduleClose() }

  const mouse = (e) => e.pointerType !== 'touch'
  trigger.addEventListener('pointerenter', (e) => {
    if (!mouse(e)) return
    reasons.add('hover')
    clearTimeout(closeT)
    if (suppressed || inst.open) return
    const cur = state.current
    const quick = (cur && cur !== inst) || now() - state.lastHide < TIMING.skip
    clearTimeout(openT)
    openT = setTimeout(() => { show('hover'); armDwell() }, quick ? 0 : TIMING.open)
  })
  trigger.addEventListener('pointermove', (e) => {
    if (mouse(e)) { if (inst.open && !tip.hasAttribute('data-dwell')) armDwell(); return }
    if (start && Math.hypot(e.clientX - start[0], e.clientY - start[1]) > TIMING.move) { clearTimeout(longT); start = null }
  })
  trigger.addEventListener('pointerleave', (e) => {
    if (!mouse(e)) return
    suppressed = false
    clearTimeout(openT)
    reasons.delete('hover')
    if (e.relatedTarget && inst.owns(e.relatedTarget)) { reasons.add('hover'); return }
    scheduleClose()
  })
  tip.addEventListener('pointerenter', (e) => { if (mouse(e)) inst.tipEnter() })
  tip.addEventListener('pointerleave', (e) => { if (mouse(e)) inst.tipLeave(e.relatedTarget) })

  trigger.addEventListener('focus', () => {
    // Solo el foco que llega navegando (Tab, flechas…) abre; el foco por clic o por programa (un diálogo que enfoca su
    // cierre al abrirse con Intro) no: así un Esc no se gasta en cerrar un tooltip que nadie pidió.
    if (now() - state.navAt < TIMING.nav && matches(trigger, ':focus-visible')) {
      reasons.add('focus')
      if (!suppressed) { show('focus'); armDwell() }
    }
  })
  trigger.addEventListener('blur', () => {
    reasons.delete('focus')
    suppressed = false
    if (!reasons.size) hide('blur')
  })

  trigger.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') {
      // Pulsar es usar: el nombre ya no hace falta y taparía lo que el control abre
      if (e.button === 0) { hide('press'); suppressed = true }
      return
    }
    longFired = false
    start = [e.clientX, e.clientY]
    clearTimeout(longT)
    clearTimeout(lingerT)
    longT = setTimeout(() => {
      longFired = true
      state.blockClick = trigger
      reasons.add('touch')
      show('touch')
      if (opt.onDwell) opt.onDwell(inst) // en táctil se pidió explícitamente: todo de una vez
    }, TIMING.long)
  })
  const endTouch = (e) => {
    if (e.pointerType !== 'touch') return
    clearTimeout(longT)
    start = null
    if (longFired) {
      const ms = opt.linger ? opt.linger(inst) : TIMING.linger
      clearTimeout(lingerT)
      lingerT = setTimeout(() => { reasons.delete('touch'); if (!reasons.size) hide('linger') }, ms)
      setTimeout(() => { if (state.blockClick === trigger) state.blockClick = null }, 400)
    }
  }
  trigger.addEventListener('pointerup', endTouch)
  trigger.addEventListener('pointercancel', endTouch)
  trigger.addEventListener('contextmenu', (e) => { if (start || longFired) e.preventDefault() })

  inst.destroy = () => { hide('destroy') }
  return inst
}

/** Nombre accesible aproximado del control, sin contar el propio tooltip (`ownIds`) */
export function nameOf(el, ownIds = []) {
  const lb = (el.getAttribute('aria-labelledby') || '').split(/\s+/).filter((id) => id && !ownIds.includes(id))
  if (lb.length) return lb.map((id) => document.getElementById(id)?.textContent || '').join(' ')
  const al = el.getAttribute('aria-label')
  if (al && al.trim()) return al
  const walk = (n) => (n.nodeType === 3 ? n.data : n.nodeType === 1 && n.getAttribute('aria-hidden') !== 'true' && !n.hidden && n.getAttribute('role') !== 'tooltip' ? [...n.childNodes].map(walk).join('') : '')
  return walk(el)
}
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLocaleLowerCase()
/** kind="auto": sin nombre o con el mismo texto → label; con otro nombre → description */
export function resolveKind(el, text, ownIds) {
  const n = norm(nameOf(el, ownIds))
  return !n || n === norm(text) ? 'label' : 'description'
}

/** Envoltorio de prototipo (XTooltip ≈ GTooltip): un solo hijo, el tooltip como hermano persistente. */
export function makeXTooltip(Vue, extra = {}) {
  const { defineComponent, h, ref, onMounted, onBeforeUnmount, cloneVNode, Comment, useId, inject, watch } = Vue
  return defineComponent({
    name: 'XTooltip',
    props: {
      text: { type: String, required: true },
      kind: { type: String, default: 'auto' },
      placement: { type: String, default: 'top' },
      shortcut: String,
      keyshortcuts: String,
      detail: String,
      disabled: Boolean
    },
    setup(props, { slots }) {
      const id = 'tt-' + useId()
      const trig = ref(null)
      const tipEl = ref(null)
      // Provisional antes de medir: «label» (así GBtn icon no avisa por falta de nombre); al montar se resuelve.
      const kind = ref(props.kind === 'auto' ? 'label' : props.kind)
      const concept = inject('xt-concept', null)
      let inst = null
      const el = () => {
        const v = trig.value
        // Un componente con raíz de fragmento (GBtn lleva su región viva al lado) tiene $el de texto: se busca el elemento
        let e = v && (v.$el || v)
        while (e && e.nodeType !== 1) e = e.nextSibling
        if (!e) return null
        return matches(e, FOCUSABLE) ? e : e.querySelector(FOCUSABLE) || e
      }
      onMounted(() => {
        const t = el()
        if (!t) return
        if (matches(t, ':disabled')) console.warn('[lab] XTooltip: control disabled nativo: su tooltip no se mostrará (no recibe foco). Si el motivo importa, usa aria-disabled.')
        else if (!matches(t, FOCUSABLE)) console.warn('[lab] XTooltip: el hijo no es enfocable; con teclado no se vería (usa GHelper o texto visible).')
        if (props.kind === 'auto') kind.value = resolveKind(t, props.text, [id, id + '-name', id + '-detail'])
        const base = { placement: props.placement, disabled: () => props.disabled }
        inst = attach(t, tipEl.value, concept ? concept.options(base, { props, id }) : base)
        t.__xt = inst
      })
      watch(() => props.text, () => { const t = el(); if (t && props.kind === 'auto') kind.value = resolveKind(t, props.text, [id, id + '-name', id + '-detail']) }, { flush: 'post' })
      onBeforeUnmount(() => inst && inst.destroy())
      return () => {
        const kids = (slots.default ? slots.default() : []).filter((v) => v.type !== Comment)
        if (kids.length !== 1) console.warn('[lab] XTooltip necesita exactamente un hijo (el control).')
        const child = kids[0]
        const p = { ref: trig }
        // Se referencia el SPAN del texto, no la raíz: lo oculto referenciado entra entero en el nombre, y el atajo
        // (aria-hidden) se colaría («DeshacerCtrl Z»). El atajo va en aria-keyshortcuts.
        const nameId = id + '-name'
        if (kind.value === 'label') p['aria-labelledby'] = nameId
        const desc = [child && child.props && child.props['aria-describedby']]
        if (kind.value === 'description') desc.push(nameId)
        if (props.detail) desc.push(id + '-detail')
        const d = desc.filter(Boolean).join(' ')
        if (d) p['aria-describedby'] = d
        if (props.keyshortcuts) p['aria-keyshortcuts'] = props.keyshortcuts
        const body = concept && concept.render ? concept.render(h, { props, id, nameId }) : [
          h('span', { class: 'xt__text', id: id + '-name' }, props.text),
          props.shortcut ? h('kbd', { class: 'xt__kbd', 'aria-hidden': 'true' }, props.shortcut) : null,
          props.detail ? h('span', { class: 'xt__detail', id: id + '-detail' }, props.detail) : null
        ]
        return [
          child ? cloneVNode(child, p, true) : null,
          h('div', { ref: tipEl, id, role: 'tooltip', popover: 'manual', class: ['xt', concept && concept.cls], 'data-kind': kind.value }, body)
        ]
      }
    },
    ...extra
  })
}

/** Barra de herramientas de APG para la maqueta: una sola parada de Tab y flechas, Inicio y Fin (tabindex móvil) */
export function roving(bar, orientation = 'horizontal') {
  const items = () => [...bar.querySelectorAll('button:not(:disabled), [href]')]
  const set = (cur) => items().forEach((b) => b.setAttribute('tabindex', b === cur ? '0' : '-1'))
  set(items()[0])
  bar.addEventListener('focusin', (e) => { if (items().includes(e.target)) set(e.target) })
  bar.addEventListener('keydown', (e) => {
    const list = items()
    const i = list.indexOf(document.activeElement)
    if (i < 0) return
    const rtl = getComputedStyle(bar).direction === 'rtl'
    const next = orientation === 'vertical' ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight'
    const prev = orientation === 'vertical' ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft'
    let j = -1
    if (e.key === next) j = (i + 1) % list.length
    else if (e.key === prev) j = (i - 1 + list.length) % list.length
    else if (e.key === 'Home') j = 0
    else if (e.key === 'End') j = list.length - 1
    if (j < 0) return
    e.preventDefault()
    list[j].focus()
  })
}
