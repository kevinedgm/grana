<script>
// GHelperScope · contexto de posición para los GHelper flotantes (dueño: bruno)
// Contrato: design/contracts/helper.md · Estilo: GHelperScope.css (coco). Sin aspecto ni semántica propia.
import { defineComponent, h } from 'vue'

export default defineComponent({
  name: 'GHelperScope',
  props: {
    as: { type: String, default: 'div' }
  },
  setup(props, { slots }) {
    return () => h(props.as, { class: 'g-helper-scope' }, slots.default ? slots.default() : undefined)
  }
})
</script>
