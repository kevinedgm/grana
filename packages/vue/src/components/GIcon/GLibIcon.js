// Icono propio de un componente de Grana (dueño: bruno). INTERNO: no se exporta ni se registra.
// Contrato: docs/contract/icons.md v0.2 §5.4: los iconos propios de los componentes (la `x` de GDialog, el `check` de
// GCheckbox…) se buscan SOLO en la lista de la librería; el registro de la aplicación (createIcons) nunca se consulta,
// así la aplicación no puede cambiarlos por accidente. Siempre decorativo (aria-hidden): el significado lo lleva el
// texto o el nombre accesible del control. Los componentes lo importan con el nombre local `GIcon`.
import { defineComponent } from 'vue'
import { lookupLibrary } from './registry.js'
import { renderSvg, warnOnce } from './render.js'

export default defineComponent({
  name: 'GIcon',
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    filled: Boolean
  },
  setup(props, { attrs }) {
    return () => {
      const paths = lookupLibrary(props.name)
      if (!paths) {
        warnOnce(`lib:${props.name}`, `un componente pide el icono «${props.name}», que no está en la lista de la librería: añádelo a docs/contract/icons.md §4 y a scripts/icons.json.`)
        return null
      }
      return renderSvg(paths, { filled: props.filled, attrs })
    }
  }
})
