<script>
// GSplit · dos regiones con proporción que se apilan por su caja (dueño: bruno)
// Contrato: design/contracts/split.md (DECISIONS.md #946 a #951) · Estilo: GSplit.css (coco)
// Puro (#444): sin estado, medidas ni eventos. La región vacía se decide en el propio render (sin onMounted), así que SSR y cliente coinciden.
// lang/dir/id/aria-* llegan a la raíz por $attrs (herencia por defecto).
import { defineComponent, h, onBeforeUpdate, Comment, Text, Fragment } from 'vue'

const AS = ['div', 'section', 'article', 'aside', 'header', 'footer', 'form']
const RATIOS = ['1:1', '3:2', '2:1', '2:3', '1:2']
const COLLAPSES = ['sm', 'md', 'lg']
const GAPS = ['none', 'sm', 'md', 'lg']
const DENSITIES = ['default', 'comfortable', 'compact']
const ALIGNS = ['start', 'stretch']

// Vacío: solo comentarios (v-if falso), texto en blanco o fragmentos vacíos
const empty = (nodes) => !nodes || nodes.every((n) => (typeof n === 'string' ? !n.trim() : n.type === Comment || (n.type === Text ? !String(n.children).trim() : n.type === Fragment && empty(n.children))))
const pick = (v, list, d) => (list.includes(v) ? v : d)

export default defineComponent({
  name: 'GSplit',
  // Sin validator: los valores fuera de lista los avisa el componente (aviso 1) y caen al default
  props: {
    as: { type: String, default: 'div' },
    ratio: { type: String, default: '3:2' },
    collapse: { type: String, default: 'md' },
    gap: { type: String, default: 'md' },
    density: { type: String, default: 'default' },
    align: { type: String, default: 'start' }
  },
  setup(props, { slots }) {
    const warned = new Set()
    const check = () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          for (const [name, list] of [['as', AS], ['ratio', RATIOS], ['collapse', COLLAPSES], ['gap', GAPS], ['density', DENSITIES], ['align', ALIGNS]]) {
            const key = `${name}:${props[name]}`
            if (!list.includes(props[name]) && !warned.has(key)) {
              warned.add(key)
              console.warn(`[Grana GSplit] ${name}="${props[name]}" no es válido (${list.join(', ')}); se usa el default.`)
            }
          }
        }
      } catch {}
    }
    check()
    onBeforeUpdate(check)
    return () => {
      let start = slots.start && slots.start()
      const end = slots.end && slots.end()
      const rest = slots.default && slots.default()
      if (!empty(rest)) {
        // Lo que llega por default no se pierde: va al final de start (o como start)
        start = empty(start) ? rest : [...start, ...rest]
        try {
          if (process.env.NODE_ENV !== 'production' && !warned.has('default')) {
            warned.add('default')
            console.warn('[Grana GSplit] el slot default no existe; se pinta al final de start. Usar #start y #end.')
          }
        } catch {}
      }
      const regions = []
      if (!empty(start)) regions.push(h('div', { key: 'start', class: 'g-split__region g-split__region--start' }, start))
      if (!empty(end)) regions.push(h('div', { key: 'end', class: 'g-split__region g-split__region--end' }, end))
      const cls = ['g-split', `g-split--ratio-${pick(props.ratio, RATIOS, '3:2').replace(':', '-')}`, `g-split--collapse-${pick(props.collapse, COLLAPSES, 'md')}`, `g-split--gap-${pick(props.gap, GAPS, 'md')}`, `g-split--density-${pick(props.density, DENSITIES, 'default')}`, `g-split--align-${pick(props.align, ALIGNS, 'start')}`]
      return h(pick(props.as, AS, 'div'), { class: cls }, regions)
    }
  }
})
</script>
