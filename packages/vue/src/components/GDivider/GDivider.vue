<script>
// GDivider · línea de separación entre grupos de contenido del consumidor (dueño: bruno)
// Contrato: design/contracts/divider.md (DECISIONS.md, decisiones 190 y 191) · Estructura: design/lab/divider/r01/ · Estilo: GDivider.css (coco)
// Semántica por caso: <hr> (horizontal), <div role="separator" aria-orientation="vertical"> (vertical),
// <div> + <span> sin rol (con texto, solo horizontal); `decorative` = aria-hidden sin rol. Nunca enfocable.
// Sin estado, sin eventos, sin densidad ni márgenes propios: la cantidad del inset es --g-divider-inset (la hereda de la anfitriona).
// Función de render: el texto se lee del slot `label` dentro del render, como pide Vue.
import { Comment, Fragment, Text, defineComponent, h, onMounted, onUpdated, ref, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

// Un slot cuenta como contenido solo si devuelve algo (no comentarios ni texto vacío)
const isEmptyNode = (v) => v.type === Comment || (v.type === Text && !String(v.children ?? '').trim()) || (v.type === Fragment && (!Array.isArray(v.children) || v.children.every(isEmptyNode)))
const nodes = (slot) => (slot ? slot().filter((v) => !isEmptyNode(v)) : [])

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

// Aviso 2: padres que solo admiten sus propios hijos (WAI-ARIA list, menu…)
const LIST_TAGS = ['UL', 'OL', 'MENU']
const LIST_ROLES = ['list', 'menu', 'menubar', 'listbox', 'tablist']
// Aviso 5: contenido interactivo dentro del texto
const INTERACTIVE = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]'

export default defineComponent({
  name: 'GDivider',
  props: {
    orientation: { type: String, default: 'horizontal', validator: oneOf(['horizontal', 'vertical']) },
    label: { type: String, default: undefined },
    inset: { type: String, default: 'none', validator: oneOf(['none', 'both', 'start']) },
    emphasis: { type: String, default: 'subtle', validator: oneOf(['subtle', 'strong']) },
    decorative: Boolean
  },
  setup(props, { slots, attrs }) {
    const root = ref(null)
    const warned = new Set()
    const warn = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana GDivider] ${msg}`)
    }

    // ---------- Avisos que miran el DOM (al montar, al cambiar la orientación y, el 5, al actualizar) ----------
    const checkParent = () => {
      const el = root.value
      if (!isDev || !el || typeof getComputedStyle !== 'function') return
      const direct = el.parentElement
      if (direct) {
        const role = (direct.getAttribute('role') || '').trim().toLowerCase()
        if (LIST_TAGS.includes(direct.tagName) || LIST_ROLES.includes(role)) {
          warn('list', 'un divider no puede ser hijo de una lista o un menú: parte la lista en dos y pon el divider entre ellas (en GMenu, usa su separador).')
        }
      }
      if (props.orientation !== 'vertical') return
      // El primer ancestro que no sea display: contents es el que da (o no) el alto de la fila
      let p = direct
      while (p && getComputedStyle(p).display === 'contents') p = p.parentElement
      if (!p) return
      const cs = getComputedStyle(p)
      const display = cs.display
      const dir = cs.flexDirection || 'row'
      const row = (display === 'flex' || display === 'inline-flex') && (dir === 'row' || dir === 'row-reverse')
      const grid = display === 'grid' || display === 'inline-grid'
      if (!row && !grid) {
        warn('parent', `vertical necesita un padre flex en fila o grid para tomar su alto (padre: display ${display || 'desconocido'}${display === 'flex' || display === 'inline-flex' ? `, flex-direction ${dir}` : ''}).`)
      }
    }
    const checkLabel = () => {
      const el = root.value
      if (!isDev || !el || typeof el.querySelector !== 'function') return
      const label = el.querySelector('.g-divider__label')
      if (label && label.querySelector(INTERACTIVE)) warn('interactive', 'el texto del divider no admite contenido interactivo.')
    }
    onMounted(() => { checkParent(); checkLabel() })
    onUpdated(checkLabel)
    watch(() => props.orientation, checkParent, { flush: 'post' })

    return () => {
      const vertical = props.orientation === 'vertical'
      const labelSlot = nodes(slots.label)
      const labelProp = typeof props.label === 'string' && props.label.trim() ? props.label : ''
      const hasLabel = labelSlot.length > 0 || labelProp !== ''
      const labeled = hasLabel && !vertical
      // Clase de inset con el valor efectivo: start solo existe en horizontal
      const inset = vertical && props.inset === 'start' ? 'both' : props.inset

      if (isDev) {
        if (hasLabel && vertical) warn('label-vertical', 'label solo en horizontal; en vertical se ignora.')
        if (vertical && props.inset === 'start') warn('inset-start', 'inset="start" solo en horizontal; en vertical se usa both.')
        if (attrs.tabindex !== undefined || attrs.tabIndex !== undefined) warn('tabindex', 'GDivider no es enfocable (un separador enfocable es un splitter).')
        if (nodes(slots.default).length) warn('default-slot', 'usa label o el slot label: el slot por defecto no se pinta.')
      }

      const cls = ['g-divider', `g-divider--orientation-${props.orientation}`, labeled && 'g-divider--labeled', `g-divider--inset-${inset}`, `g-divider--emphasis-${props.emphasis}`]

      // Con texto: la raíz no tiene rol (separator tiene hijos presentacionales); las líneas son ::before/::after
      if (labeled) return h('div', { ref: root, class: cls }, [h('span', { class: 'g-divider__label' }, labelSlot.length ? labelSlot : labelProp)])
      if (!vertical) return h('hr', { ref: root, class: cls, 'aria-hidden': props.decorative ? 'true' : undefined })
      return h('div', props.decorative
        ? { ref: root, class: cls, 'aria-hidden': 'true' }
        : { ref: root, class: cls, role: 'separator', 'aria-orientation': 'vertical' })
    }
  }
})
</script>
