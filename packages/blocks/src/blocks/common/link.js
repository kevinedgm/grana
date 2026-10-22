// Un `NavLink` de bloque → GBtn (dueño: bruno; _comun.md §2 `NavLink`, §3, §4, avisos C5 y C6; footer.md, newsletter.md).
// Interno del paquete: no se exporta. `variant="link"` salvo que la sección diga otra cosa.
// - `navigate` `{ event, href, item }` (guarda de #505) solo para los enlaces internos: nunca con `external` (#574) ni con
//   los esquemas que abre el sistema (`tel:`, `mailto:`, `sms:`): ahí el navegador hace lo suyo.
// - `external`: target="_blank" rel="noopener", marca `external-link` decorativa en `append` (el hueco es aria-hidden) y el
//   nombre «{label}, {labels.external}» en el control (empieza por el texto visible, 2.5.3); sin labels.external, C5.
// - `current` → aria-current="page"; `lang` (idioma del texto, 3.1.2) y `hreflang` (idioma del destino) llegan al <a>.
// - C6: un href `javascript:` deja un GBtn deshabilitado sin enlace (norma del lote).
import { defineComponent, h } from 'vue'
import { GBtn, GIcon } from '@grana/vue'
import { emitNavigate, isUnsafeHref, safeHref } from './navigate.js'
import { has } from './text.js'

/** Esquemas que no navegan dentro de la aplicación: no emiten `navigate`. */
export const systemHref = (href) => typeof href === 'string' && /^\s*(tel|mailto|sms):/i.test(href)

export default /* @__PURE__ */ defineComponent({
  name: 'GbLink',
  props: {
    link: { type: Object, required: true },
    // Lo que se emite como `item` (por defecto, el propio enlace)
    item: { type: Object, default: undefined },
    variant: { type: String, default: 'link' },
    size: { type: String, default: 'md' },
    external: { type: String, default: undefined },
    what: { type: String, default: 'link' },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit, slots }) {
    return () => {
      const link = props.link
      const warn = props.warn
      const item = props.item || link
      const content = slots.default ? slots.default : () => link.label
      const common = {
        variant: props.variant,
        size: props.size,
        lang: has(link.lang) ? link.lang : undefined
      }
      const href = safeHref(link.href)
      if (!href) {
        try { if (process.env.NODE_ENV !== 'production' && isUnsafeHref(link.href)) warn(`C6:${props.what}`, `${props.what} («${link.label}») tiene un href javascript:; se ignora el enlace (C6).`) } catch {}
        return h(GBtn, { ...common, disabled: true }, { default: content })
      }
      const a = {
        ...common,
        href,
        hreflang: has(link.hreflang) ? link.hreflang : undefined,
        'aria-current': link.current ? 'page' : undefined
      }
      if (link.external) {
        const label = has(props.external) ? props.external : undefined
        try { if (process.env.NODE_ENV !== 'production' && !label) warn('C5:external', 'hay un enlace externo y falta labels.external («se abre en otra pestaña»): la marca queda decorativa (C5).') } catch {}
        return h(GBtn, { ...a, target: '_blank', rel: 'noopener', 'aria-label': label ? `${link.label}, ${label}` : undefined }, {
          default: content,
          append: () => h(GIcon, { name: 'external-link' })
        })
      }
      if (systemHref(href)) return h(GBtn, a, { default: content })
      return h(GBtn, { ...a, onClick: (event) => emitNavigate(emit, event, href, item, false) }, { default: content })
    }
  }
})
