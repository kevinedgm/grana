<script>
// GSurface · superficie visual genérica (dueño: bruno)
// Contrato: design/contracts/surface.md · Estilo: GSurface.css (coco) · Estructura: design/lab/surface/r01/.
// Un solo elemento sin rol ni estructura; la profundidad (inset relativa al padre, radio concéntrico) la resuelve el CSS.
// Zona de marca (surface.md §«Zona de marca», tokens.md §44, DECISIONS.md #620 a #625): `zone="brand"` pone
// `data-g-zone="brand"` y `g-surface--zone-brand` en la raíz; el bloque de la zona de defaults.css hace el resto.
import { defineComponent, h, onBeforeUpdate } from 'vue'
import { oneOf } from '../../utils/oneOf.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const INTERACTIVE = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'label']
const ZONES = ['none', 'brand']

export default defineComponent({
  name: 'GSurface',
  props: {
    level: { type: String, default: 'outlined', validator: oneOf(['flat', 'outlined', 'raised', 'floating', 'inset']) },
    tone: { type: String, default: 'surface', validator: oneOf(['surface', 'sunken']) },
    padding: { type: String, default: 'md', validator: oneOf(['none', 'xs', 'sm', 'md', 'lg']) },
    rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    as: { type: String, default: 'div' },
    // Sin validator: un valor desconocido (también `inverse`, reservado) cae en el aviso W1 y se queda sin zona
    zone: { type: String, default: 'none' }
  },
  setup(props, { slots, attrs }) {
    if (isDev && INTERACTIVE.includes(String(props.as).toLowerCase())) {
      console.warn(`[Grana] <GSurface> no es interactiva: as="${props.as}" no está previsto. Usa un control dentro de la superficie.`)
    }
    // Avisos W1 a W3 de la zona: una vez por instancia y valor
    const warned = new Set()
    const once = (key, text) => {
      if (warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana GSurface] ${text}`)
    }
    const checkZone = () => {
      if (!isDev) return
      const zone = props.zone
      if (!ZONES.includes(zone)) {
        once(`w1:${zone}`, `zone="${zone}" no es válido: \`zone\` admite none y brand; inverse está reservado. Se renderiza sin zona.`)
        return
      }
      if (zone !== 'brand') return
      const theme = attrs['data-theme']
      if (theme !== undefined && theme !== null && theme !== false) {
        once(`w2:${theme}`, `La zona y data-theme="${theme}" no van en el mismo elemento: pon data-theme en un ancestro o en un descendiente (el tema del CLI ganaría a la zona en ese elemento).`)
      }
      if (props.tone === 'sunken') once('w3:sunken', 'Con zone="brand", el fondo es la marca: tone="sunken" se ignora.')
    }
    checkZone()
    onBeforeUpdate(checkZone)
    return () => {
      const brand = props.zone === 'brand'
      const classes = [
        'g-surface',
        `g-surface--level-${props.level}`,
        // Con la zona, tone se ignora (W3): el fondo es la marca
        `g-surface--tone-${brand ? 'surface' : props.tone}`,
        `g-surface--padding-${props.padding}`,
        `g-surface--density-${props.density}`
      ]
      if (props.rounded) classes.push(`g-surface--rounded-${props.rounded}`)
      if (brand) classes.push('g-surface--zone-brand')
      return h(props.as, { class: classes, 'data-g-zone': brand ? 'brand' : undefined }, slots.default ? slots.default() : undefined)
    }
  }
})
</script>
