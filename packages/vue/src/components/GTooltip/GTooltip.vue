<script>
// GTooltip · nombre o descripción breve de un control (dueño: bruno)
// Contrato: design/contracts/tooltip.md (#380 a #398) · Estructura: design/lab/tooltip/r01/ y r02/ (kiwi) ·
// Estilo: GTooltip.css (coco; lo que espera del .vue en design/lab/tooltip/estilo.md) · Motor: utils/tooltip.js.
// Envoltorio de un único hijo sin elementos añadidos: clona el control con sus referencias ARIA y renderiza justo detrás
// su nodo role="tooltip" persistente (popover="manual"). Sin <style>, sin textos propios.
import { Comment, Fragment, Text, cloneVNode, computed, defineComponent, h, onBeforeUnmount, onMounted, onUpdated, ref, useId, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { attach, firstElement, resolveBox, resolveKind, resolveTarget } from '../../utils/tooltip.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const PLACEMENTS = ['top-start', 'top', 'top-end', 'right-start', 'right', 'right-end', 'bottom-end', 'bottom', 'bottom-start', 'left-end', 'left', 'left-start']
// #394: su caja visible es la parte y la parte fija su propio aria-labelledby; no se admiten como hijo
const NOT_ADMITTED = ['GInputGroupInput', 'GInputGroupSelect']

// Hijos reales del slot: sin comentarios ni espacios, con los fragmentos aplanados
function flatten(list, out = []) {
  for (const v of list || []) {
    if (!v || v.type === Comment) continue
    if (v.type === Fragment) flatten(v.children, out)
    else if (v.type === Text && !String(v.children).trim()) continue
    else out.push(v)
  }
  return out
}

export default defineComponent({
  name: 'GTooltip',
  props: {
    text: { type: String, required: true },
    detail: { type: String, default: undefined },
    kind: { type: String, default: 'auto', validator: oneOf(['auto', 'label', 'description']) },
    placement: { type: String, default: undefined, validator: oneOf(PLACEMENTS) },
    shortcut: { type: String, default: undefined },
    keyshortcuts: { type: String, default: undefined },
    disabled: Boolean,
    id: { type: String, default: undefined }
  },
  setup(props, { slots }) {
    const uid = useId()
    const baseId = computed(() => props.id || `g-tooltip-${uid}`)
    const nameId = computed(() => `${baseId.value}-name`)
    const detailId = computed(() => `${baseId.value}-detail`)
    const hasText = computed(() => Boolean(props.text && props.text.trim()))
    // kind="auto": «label» hasta medir el DOM (SSR y primer render); al montar se corrige si el control ya tiene nombre
    const measured = ref('label')
    const kind = computed(() => (props.kind === 'auto' ? measured.value : props.kind))
    // false si el hijo resultó no tener elemento enfocable: sin referencias, sin nodo y sin escuchas
    const usable = ref(true)
    const node = ref(null)
    let child = null
    let el = null
    let box = null
    let inst = null
    let mo = null

    const warned = new Set()
    const warn = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana GTooltip] ${msg}`)
    }
    if (isDev) {
      watch(hasText, (v) => { if (!v) warn('text', '`text` vacío o ausente: el tooltip no se activa.') }, { immediate: true })
      watch(() => [props.shortcut, props.keyshortcuts], ([s, k]) => { if (s && !k) warn('keys', '`shortcut` sin `keyshortcuts`: el atajo no llega a la tecnología de apoyo (aria-keyshortcuts).') }, { immediate: true })
    }

    const own = () => [baseId.value, nameId.value, detailId.value]
    const measure = () => { if (el && props.kind === 'auto') measured.value = resolveKind(el, props.text, own()) }

    function detach() {
      if (inst) inst.destroy()
      if (mo) mo.disconnect()
      inst = null
      mo = null
      el = null
      box = null
    }
    // Resuelve el elemento del hijo y engancha el motor; se repite si el hijo cambia
    function sync() {
      if (!child || !hasText.value) { detach(); return }
      const start = child.el
      const end = child.anchor || (child.component && child.component.subTree && child.component.subTree.anchor) || node.value
      const target = start ? resolveTarget(start, end, own()) : null
      // Ancla (#395): la caja visible marcada más cercana del elemento resuelto dentro del hijo; si no, él mismo
      const anchor = target ? resolveBox(target, firstElement(start, end)) : null
      if (target && target === el && anchor === box && inst) return
      detach()
      if (!target || target === node.value) {
        if (start) { warn('focusable', 'el hijo no tiene un elemento enfocable: el tooltip va en el control (no se activa).'); usable.value = false }
        return
      }
      usable.value = true
      if (!node.value) return // se renderiza en el ciclo siguiente (onUpdated)
      el = target
      box = anchor
      if (target.disabled === true) warn('disabled', 'el control tiene `disabled` nativo y no recibe foco: el tooltip no se mostrará. Usa aria-disabled si el motivo importa.')
      if (target.hasAttribute('title')) warn('title', 'el control trae `title`: dos pistas para lo mismo (quita `title`).')
      measure()
      inst = attach(target, node.value, {
        box: anchor,
        placement: () => props.placement,
        detail: () => Boolean(props.detail),
        disabled: () => props.disabled,
        chars: () => (props.text || '').length + (props.detail || '').length + (props.detail ? (props.shortcut || '').length : 0)
      })
      if (typeof MutationObserver !== 'undefined') {
        // Nombre del control (kind="auto") y estado (aria-expanded, disabled) que cambian dentro del hijo
        mo = new MutationObserver(() => { measure(); if (inst) inst.check() })
        mo.observe(target, { attributes: true, attributeFilter: ['aria-expanded', 'disabled', 'aria-label', 'aria-labelledby'], childList: true, subtree: true, characterData: true })
      }
    }

    onMounted(sync)
    onUpdated(sync)
    watch(() => props.text, measure, { flush: 'post' })
    watch(() => props.disabled, (d) => { if (d && inst) inst.hide('disabled') })
    onBeforeUnmount(detach)

    const renderNode = () => {
      const kbd = props.shortcut ? h('kbd', { class: 'g-tooltip__kbd', 'aria-hidden': 'true' }, props.shortcut) : null
      const text = h('span', { class: 'g-tooltip__text', id: nameId.value }, props.text)
      // Con detail, el atajo pasa a la segunda etapa (#389)
      const body = props.detail
        ? [text, h('span', { class: 'g-tooltip__more' }, [h('span', { class: 'g-tooltip__more-in' }, [h('span', { class: 'g-tooltip__detail', id: detailId.value }, props.detail), kbd])])]
        : [text, kbd]
      return h('div', { ref: node, id: baseId.value, class: ['g-tooltip', props.detail && 'g-tooltip--detail'], role: 'tooltip', popover: 'manual' }, [
        h('span', { class: 'g-tooltip__tab', 'aria-hidden': 'true' }),
        h('span', { class: 'g-tooltip__body' }, body)
      ])
    }

    return () => {
      const kids = flatten(slots.default ? slots.default() : [])
      child = null
      if (kids.length !== 1) {
        warn('one', 'necesita exactamente un hijo: el control.')
        return kids
      }
      const vnode = kids[0]
      if (vnode.type === Text) {
        warn('focusable', 'el hijo no tiene un elemento enfocable: el tooltip va en el control (no se activa).')
        return vnode
      }
      if (vnode.type && NOT_ADMITTED.includes(vnode.type.name || vnode.type.__name)) {
        warn('part', `${vnode.type.name || vnode.type.__name} no se admite como hijo: no se activa. Usa el \`hint\` del grupo.`)
        return vnode
      }
      if (!hasText.value || !usable.value) {
        child = vnode
        return vnode
      }
      const p = vnode.props || {}
      const extra = { 'data-g-tooltip': '' }
      if (kind.value === 'label') extra['aria-labelledby'] = nameId.value
      // aria-describedby se añade a la del hijo, nunca la reemplaza
      const desc = [p['aria-describedby'] || p.ariaDescribedby, kind.value === 'description' && nameId.value, props.detail && detailId.value].filter(Boolean).join(' ')
      if (desc) extra['aria-describedby'] = desc
      if (props.keyshortcuts) extra['aria-keyshortcuts'] = props.keyshortcuts
      child = cloneVNode(vnode, extra, true)
      return [child, renderNode()]
    }
  }
})
</script>
