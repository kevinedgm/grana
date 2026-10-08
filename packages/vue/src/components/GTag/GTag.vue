<script>
// GTag · un elemento de un conjunto que clasifica o resume una elección (dueño: bruno). Estilo: GTag.css (coco).
// Contrato: design/contracts/tag.md · DECISIONS.md #460 a #473 (#462 API, #464 semántica, #465 teclado, #469 color,
// #470 pista visual) y api.md «Enlaces y navigate» (#505) · Estructura: design/lab/chip/r01/ (kiwi).
// Cuatro cuerpos (§«Semántica por caso»): estática <span>, enlace <a href> (deshabilitado: role="link" aria-disabled sin
// href), alternar <button aria-pressed> y huella (solo en un GTagGroup). «Quitar» es un <button> HERMANO del cuerpo.
// Una GTag suelta quitable solo emite `remove`: sin huella ni anuncio (la aplicación la quita y decide el foco). Dentro de
// un GTagGroup, la huella, `is-plain`, los nombres y el encaminamiento de «Quitar»/Supr llegan por la clave interna
// tagItemKey (sin API pública, #463).
import { computed, defineComponent, h, inject, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'
import GIcon from '../GIcon/GLibIcon.js' // iconos propios (x, check, undo-2): SOLO la lista de la librería (icons.md §4)
import { useVisualTips } from '../../utils/visualTip.js'
import { categoryOf } from '../../utils/categoryHash.js'
import { INTERACTIVE, colorInfo, colorWarning, createCutWatcher, hasContent, isDev, present, say, tagItemKey, validCategories } from './tagShared.js'

const SIZES = ['sm', 'md']
// Atributos del enlace (van al <a> solo con href)
const LINK_ATTRS = new Set(['target', 'rel', 'download', 'hreflang', 'referrerpolicy', 'referrerPolicy'])
const isA11yAttr = (k) => k === 'role' || /^aria[-A-Z]/.test(k) || k.toLowerCase() === 'tabindex'
const isDescribedBy = (k) => k === 'aria-describedby' || k === 'ariaDescribedby'
// api.md «Enlaces y navigate» (#505): solo activación primaria sin modificadores (Intro llega como clic con button 0)
const primary = (e) => !e.defaultPrevented && (e.button === 0 || e.button === undefined) && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey

export default defineComponent({
  name: 'GTag',
  inheritAttrs: false,
  props: {
    label: { type: String, required: true },
    href: { type: String, default: undefined },
    // default null: ausente = no alterna (sin él, Vue convertiría el Boolean ausente en false y toda etiqueta alternaría)
    pressed: { type: Boolean, default: null },
    removable: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    size: { type: String, default: 'md', validator: (v) => SIZES.includes(v) },
    // 'neutral' o una categoría 1..12 (número o cadena numérica); lo demás se ignora con el aviso 3 (como GAvatar)
    color: { type: [String, Number], default: undefined },
    categories: { type: Number, default: 0 },
    colorKey: { type: [String, Number], default: undefined },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['update:pressed', 'remove', 'navigate'],
  setup(props, { attrs, emit, slots }) {
    const groupCtx = inject(tagItemKey, null)
    const inGroup = Boolean(groupCtx)
    const ctx = () => (groupCtx ? groupCtx() : null)

    // Avisos: una vez por instancia, causa y valor
    const warned = new Set()
    const warn = (key, msg) => {
      if (!isDev() || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana GTag] ${msg}`)
    }

    const root = ref(null)
    const label = computed(() => present(props.label))
    const href = computed(() => present(props.href))
    // Estado del alternado: con o sin v-model:pressed (sin él, guarda el suyo y lo sincroniza cuando cambia la prop)
    const local = ref(props.pressed)
    watch(() => props.pressed, (v) => { local.value = v })
    const pressedNow = computed(() => (inGroup ? props.pressed : local.value))
    const isToggle = computed(() => !href.value && (pressedNow.value === true || pressedNow.value === false))
    const isPressed = computed(() => isToggle.value && pressedNow.value === true)

    const categories = computed(() => (validCategories(props.categories) ? props.categories : 0))
    const cat = computed(() => {
      const c = colorInfo(props.color)
      if (c.kind === 'cat') return c.k
      if (c.kind === 'neutral' || categories.value === 0) return null
      return categoryOf(present(props.colorKey) ?? label.value, categories.value)
    })

    const removeName = computed(() => {
      const c = ctx()
      if (c) return c.removeName
      return say(props.labels, 'remove', { label: label.value })
    })

    // ---------- Quitar (botón o Supr/Retroceso) ----------
    const doRemove = (source, event) => {
      if (props.disabled || !props.removable) return
      const c = ctx()
      if (c) c.remove(source, event)
      else emit('remove', { event, source })
    }
    const onKey = (e) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (!props.removable || props.disabled) return
      e.preventDefault()
      doRemove('key', e)
    }
    const onToggle = () => {
      if (props.disabled) return
      const next = !pressedNow.value
      if (!inGroup) local.value = next
      emit('update:pressed', next)
    }
    const onLinkClick = (e) => {
      if (props.disabled) return
      if (!primary(e)) return
      emit('navigate', { event: e, href: href.value })
    }

    // ---------- Pista visual (#470): solo en una GTag suelta; en un grupo la pinta GTagGroup al final de su raíz ----------
    const cut = inGroup ? null : createCutWatcher()
    const bodyCtrl = () => (root.value ? root.value.querySelector(':scope > a.g-tag__body[href], :scope > button.g-tag__body') : null)
    const tips = inGroup ? null : useVisualTips({
      as: 'span',
      find(key) {
        if (!root.value) return null
        const el = key === 'body' ? bodyCtrl() : root.value.querySelector(':scope > .g-tag__remove')
        return el ? { ctrl: el } : null
      },
      disabled: (key, ctrl) => key === 'body' && !cut.cut(ctrl.querySelector('.g-tag__text'))
    })
    const refreshCut = () => { if (cut) cut.refresh(root.value) }

    const checkSlot = () => {
      if (!isDev() || !root.value) return
      const text = root.value.querySelector('.g-tag__text')
      if (text && text.querySelector(INTERACTIVE)) warn('slot', `«${label.value}»: el slot por defecto lleva contenido interactivo (a, button, input…), que no cabe en una etiqueta. Usa href (enlace), pressed (alternar) o un GBtn aparte.`)
    }
    onMounted(() => { refreshCut(); checkSlot() })
    onUpdated(refreshCut)
    onBeforeUnmount(() => { if (cut) cut.dispose() })

    return () => {
      const c = ctx()
      // Aviso 8: sin label no se pinta
      if (!label.value) {
        warn('label', 'label es obligatoria y no puede estar vacía: es el texto, la base de los nombres de «Quitar» y la clave del color. La etiqueta no se pinta.')
        return null
      }

      // ---------- Avisos de las props (en un grupo los da GTagGroup como G8) ----------
      if (isDev() && !inGroup) {
        if (href.value && (props.pressed === true || props.pressed === false)) warn('href-pressed', `«${label.value}»: href y pressed a la vez; navegar y cambiar un estado son dos intenciones. Se ignora pressed (es un enlace).`)
        const ci = colorInfo(props.color)
        if (ci.kind === 'invalid') warn(`color:${String(ci.value)}`, colorWarning(ci.value))
        if (!validCategories(props.categories)) warn(`categories:${String(props.categories)}`, `categories=${JSON.stringify(props.categories)} no es un entero de 0 a 12: se trata como 0 (sin color derivado). Pon el mismo número que la entrada categories del tema.`)
        if (props.removable && !present(removeName.value)) warn('remove', `«${label.value}» es removable sin labels.remove: «Quitar» queda sin nombre accesible. Pasa :labels="{ remove: 'Quitar {label}' }".`)
      }

      // ---------- Reparto de atributos (aviso 1 y 7) ----------
      const own = {}
      const link = {}
      let describedBy
      for (const [k, v] of Object.entries(attrs)) {
        if (isDescribedBy(k)) { describedBy = v; continue }
        if (isA11yAttr(k)) {
          warn(`attr:${k}`, `ignora el atributo «${k}»: el nombre lo da el texto (label); el rol y el foco los decide la etiqueta (href, pressed, removable).`)
          continue
        }
        if (k === 'onClick') {
          warn('onClick', 'no enlaza una escucha de clic: usa navigate (enlace), update:pressed (alternar) o remove (quitar); para otra acción, un GBtn size="sm".')
          continue
        }
        if (LINK_ATTRS.has(k)) { if (href.value) link[k] = v; continue }
        own[k] = v
      }

      const ghost = Boolean(c && c.ghost)
      const toggle = isToggle.value
      const disabled = props.disabled

      // ---------- Piezas del cuerpo: marca (alternar), hueco y texto ----------
      const check = toggle ? h('span', { class: 'g-tag__check', 'aria-hidden': 'true' }, [h(GIcon, { name: 'check' })]) : null
      const leadNodes = slots.lead ? slots.lead() : null
      const lead = leadNodes && hasContent(leadNodes) ? h('span', { class: 'g-tag__lead', 'aria-hidden': 'true' }, leadNodes) : null
      const textNodes = slots.default ? slots.default() : null
      const text = h('span', { class: 'g-tag__text', dir: 'auto' }, textNodes && hasContent(textNodes) ? textNodes : label.value)

      let body
      let removeBtn = null
      if (ghost) {
        // Huella (#466): el cuerpo sale del árbol (aria-hidden) y la tapa es «Deshacer» con su nombre en texto oculto
        body = h('span', { class: 'g-tag__body', 'aria-hidden': 'true' }, [check, lead, text].filter(Boolean))
        removeBtn = h('button', {
          type: 'button',
          class: 'g-tag__undo',
          disabled: disabled || undefined,
          onClick: (e) => c.undo(e)
        }, [h(GIcon, { name: 'undo-2', class: 'g-icon--flip-rtl' }), h('span', { class: 'g-tag__sr' }, c.undoName || '')])
      } else {
        if (href.value) {
          body = disabled
            ? h('a', { class: 'g-tag__body', role: 'link', 'aria-disabled': 'true', 'aria-describedby': describedBy, onKeydown: onKey }, [lead, text].filter(Boolean))
            : h('a', { ...link, class: 'g-tag__body', href: href.value, 'aria-describedby': describedBy, onClick: onLinkClick, onKeydown: onKey }, [lead, text].filter(Boolean))
        } else if (toggle) {
          body = h('button', {
            type: 'button',
            class: 'g-tag__body',
            'aria-pressed': isPressed.value ? 'true' : 'false',
            'aria-describedby': describedBy,
            disabled: disabled || undefined,
            onClick: onToggle,
            onKeydown: onKey
          }, [check, lead, text].filter(Boolean))
        } else {
          body = h('span', { class: 'g-tag__body' }, [lead, text].filter(Boolean))
        }
        if (props.removable) {
          removeBtn = h('button', {
            type: 'button',
            class: 'g-tag__remove',
            'aria-keyshortcuts': 'Delete Backspace',
            disabled: disabled || undefined,
            onClick: (e) => doRemove('button', e),
            onKeydown: onKey
          }, [h(GIcon, { name: 'x' }), h('span', { class: 'g-tag__sr' }, removeName.value || '')])
        }
      }

      // Nodos de la pista (al final de la raíz, como <span>): cuerpo interactivo y «Quitar»
      const tipNodes = []
      if (tips && !ghost) {
        if ((href.value && !disabled) || toggle) tipNodes.push(tips.node('body', label.value))
        if (props.removable) tipNodes.push(tips.node('remove', removeName.value || ''))
      }

      const style = ghost && c.ghostW ? [own.style, { '--_ghost-w': `${c.ghostW}px` }] : own.style
      return h('span', {
        ...own,
        ref: root,
        class: [
          'g-tag',
          `g-tag--size-${props.size}`,
          {
            'is-removable': props.removable,
            'is-toggle': toggle,
            'is-pressed': isPressed.value,
            'is-link': Boolean(href.value),
            'is-disabled': disabled,
            'is-ghost': ghost,
            'is-plain': Boolean(c && c.plain)
          },
          own.class
        ],
        ...(style === undefined ? {} : { style }),
        'data-cat': cat.value === null ? undefined : String(cat.value)
      }, [body, removeBtn, ...tipNodes].filter(Boolean))
    }
  }
})
</script>
