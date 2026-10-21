<script>
// GContainer · contenedor de página (dueño: bruno)
// Contrato: design/contracts/container.md (#717, #718, #721 a #724) · Estructura: design/lab/container/r01/ (kiwi; B · Sangrado
// alineado con la medida de A como opción, C reservada) · Estilo: GContainer.css (coco; design/lab/container/estilo.md).
// Paquete principal con compuerta de peso propia (#723). Sin JS de maquetación: el ancho, el margen continuo, el sangrado y
// la medida son CSS (unidades de contenedor). El .vue solo pinta el elemento pedido y las clases de los cuatro ejes, siempre,
// también las de los valores por defecto (encargo 1 de coco), y da los avisos. `--g-container-max` va en la raíz (la lee
// la aplicación por su hoja o por `style`, que cae en la raíz con $attrs; inherits: false). Puro (#444): nada al importar.
import { defineComponent, h, onMounted, watch } from 'vue'

const WIDTHS = ['sm', 'md', 'lg', 'xl', '2xl', 'full', 'reading']
const HORIZONTALS = ['center', 'start']
const GUTTERS = ['auto', 'none', 'sm', 'md', 'lg']
const AS = ['div', 'main', 'section', 'article']
const MAIN = 'main, [role="main"]'

export default defineComponent({
  name: 'GContainer',
  // Sin validator: los valores fuera de lista los avisa el componente (avisos 1 y 4) y caen al default
  props: {
    width: { type: String, default: 'lg' },
    horizontal: { type: String, default: 'center' },
    gutter: { type: String, default: 'auto' },
    as: { type: String, default: 'div' },
    prose: Boolean
  },
  setup(props, { slots, expose }) {
    expose()
    let rootEl = null
    let bodyEl = null
    const warned = new Set()
    const warn = (key, text) => {
      try {
        if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
          warned.add(key)
          console.warn(`[Grana GContainer] ${text}`)
        }
      } catch {}
    }
    const pick = (v, list, d) => (list.includes(v) ? v : d)

    const checkProps = () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          // Avisos 1 (width) y 4 (as, gutter, horizontal): fuera de lista, el default
          for (const [name, list, d] of [['width', WIDTHS, 'lg'], ['horizontal', HORIZONTALS, 'center'], ['as', AS, 'div'], ['gutter', GUTTERS, 'auto']]) {
            if (!list.includes(props[name])) warn(`${name}:${props[name]}`, `${name}="${props[name]}" no está en ${list.join(' | ')}: se usa ${d}.`)
          }
          if (props.width === 'full' && props.horizontal !== 'center') warn('full-horizontal', `horizontal="${props.horizontal}" con width="full": no hay sobrante que repartir, no tiene efecto.`)
        }
      } catch {}
    }
    watch(() => [props.width, props.horizontal, props.gutter, props.as].join('\u0000'), checkProps, { immediate: true })

    // Aviso 3: un solo main (S10). Con as="main": otro main visible en el documento, o este dentro de otro main (GAppShell)
    const checkMain = () => {
      try {
        if (process.env.NODE_ENV !== 'production' && rootEl && pick(props.as, AS, 'div') === 'main') {
          const outer = rootEl.parentElement && rootEl.parentElement.closest(MAIN)
          const other = [...document.querySelectorAll(MAIN)].some((m) => m !== rootEl && !m.contains(rootEl) && !rootEl.contains(m) && !m.closest('[hidden]'))
          if (outer || other) warn('main', 'as="main" y ya hay otro main (en el documento o alrededor, como el del chasis g-app-shell): un solo main por página; dentro del chasis, as="div" (el defecto).')
        }
      } catch {}
    }

    // Aviso 5: una banda g-bleed / g-bleed-raw que no ocupa la columna (medido una vez al montar, contra la columna)
    const checkBleed = () => {
      try {
        if (process.env.NODE_ENV !== 'production' && bodyEl) {
          const col = bodyEl.getBoundingClientRect()
          if (col.width > 0) {
            for (const el of bodyEl.querySelectorAll('.g-bleed, .g-bleed-raw')) {
              if (el.parentElement.closest('.g-container__body') !== bodyEl) continue // es de un contenedor anidado
              const r = el.getBoundingClientRect()
              if (!r.width) continue
              const cs = getComputedStyle(el)
              // La caja de la banda sin su sangrado (los márgenes negativos son los publicados) debe ser la columna
              const start = r.left - (parseFloat(cs.marginLeft) || 0)
              const end = r.right + (parseFloat(cs.marginRight) || 0)
              if (Math.abs(start - col.left) > 1 || Math.abs(end - col.right) > 1) {
                warn('bleed', 'una banda g-bleed / g-bleed-raw no ocupa la columna (está dentro de una superficie con relleno o de una caja más estrecha): sangraría al sitio equivocado.')
                break
              }
            }
          }
        }
      } catch {}
    }

    onMounted(() => {
      checkMain()
      checkBleed()
    })
    watch(() => props.as, () => { checkMain() }, { flush: 'post' })

    return () => {
      const cls = [
        'g-container',
        `g-container--width-${pick(props.width, WIDTHS, 'lg')}`,
        `g-container--horizontal-${pick(props.horizontal, HORIZONTALS, 'center')}`,
        `g-container--gutter-${pick(props.gutter, GUTTERS, 'auto')}`
      ]
      if (props.prose) cls.push('g-container--prose')
      return h(pick(props.as, AS, 'div'), { class: cls, ref: (el) => { rootEl = el } }, [
        h('div', { class: 'g-container__body', ref: (el) => { bodyEl = el } }, slots.default ? slots.default() : undefined)
      ])
    }
  }
})
</script>
