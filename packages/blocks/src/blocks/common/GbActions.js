// Acciones de un bloque → GBtn (dueño: bruno; _comun.md §3, §4, avisos C5, C6 y C8). Interno del paquete: no se exporta.
// Jerarquía por posición: como mucho dos; la primera con `variants[0]` (la principal, `solid` salvo que la sección diga
// otra cosa) y la segunda con `variants[1]` (`link` en el héroe, `outline` en el resto). Con `href`: enlace con
// `navigate` (guarda de #505); con `external`: target="_blank" rel="noopener", marca `external-link` decorativa en
// `append`, nombre «{label}, {labels.external}» en el control y sin `navigate` (#574); sin `href`: botón con `activate`.
import { defineComponent, h } from 'vue'
import { GBtn, GIcon } from '@grana/vue'
import { entries } from './list.js'
import { emitNavigate, isUnsafeHref, safeHref } from './navigate.js'
import { has } from './text.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbActions',
  props: {
    actions: { type: Array, default: () => [] },
    variants: { type: Array, default: () => ['solid', 'outline'] },
    size: { type: String, default: 'md' },
    external: { type: String, default: undefined },
    // id del texto que describe la acción principal (`assurance` de CTA, cta.md): aria-describedby solo en la primera
    describedby: { type: String, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate', 'activate'],
  setup(props, { emit }) {
    return () => {
      const all = Array.isArray(props.actions) ? props.actions : []
      const warn = props.warn
      try { if (process.env.NODE_ENV !== 'production' && all.length > 2) warn('C8', `${all.length} actions: se pintan las dos primeras (C8).`) } catch {}
      return entries(all.slice(0, 2), ['label'], 'actions', warn).map(({ item, key, index }) => {
        const variant = props.variants[index] || props.variants[props.variants.length - 1]
        const icon = has(item.icon) ? () => h(GIcon, { name: item.icon }) : undefined
        const common = { key, variant, size: props.size, 'aria-describedby': index === 0 ? props.describedby : undefined }
        if (item.href !== undefined && item.href !== null && item.href !== '') {
          const href = safeHref(item.href)
          if (!href) {
            try { if (process.env.NODE_ENV !== 'production' && isUnsafeHref(item.href)) warn(`C6:${key}`, `la acción «${item.label}» tiene un href javascript:; se ignora el enlace (C6).`) } catch {}
            return h(GBtn, { ...common, disabled: true }, { prepend: icon, default: () => item.label })
          }
          if (item.external) {
            const label = has(props.external) ? props.external : undefined
            try { if (process.env.NODE_ENV !== 'production' && !label) warn('C5:external', 'hay una acción externa y falta labels.external («se abre en otra pestaña»): la marca queda decorativa (C5).') } catch {}
            // El hueco `append` de GBtn es decorativo (aria-hidden): el nombre «Instagram, se abre en otra pestaña» va en
            // el control (aria-label, que empieza por el texto visible, 2.5.3) y la marca queda decorativa
            return h(GBtn, { ...common, href, target: '_blank', rel: 'noopener', 'aria-label': label ? `${item.label}, ${label}` : undefined }, {
              prepend: icon,
              default: () => item.label,
              append: () => h(GIcon, { name: 'external-link' })
            })
          }
          return h(GBtn, { ...common, href, onClick: (event) => emitNavigate(emit, event, href, item, false) }, { prepend: icon, default: () => item.label })
        }
        return h(GBtn, { ...common, onClick: (event) => emit('activate', { event, item }) }, { prepend: icon, default: () => item.label })
      })
    }
  }
})
