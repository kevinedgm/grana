<script setup>
// GDialogStep · un paso de GDialog con historial (dueño: bruno)
// Contrato: design/contracts/dialog.md §«Niveles anidados» B (DECISIONS.md #584, #585) · Estructura: design/lab/dialog/r02/
// (kiwi, concepto B) · Estilo: GDialog.css (coco; el panel es g-dialog__step).
// Se declara como hijo de GDialog. Siempre se registra en el diálogo (nombre, título, descripción, resumen y su slot
// `footer`, que pinta GDialog en su pie cuando el paso es el actual); su panel solo existe mientras el paso está en el
// historial (base 6: los de debajo siguen montados, hidden + inert; el que sale del historial se desmonta). Sin eventos
// propios: el diálogo emite `step`.
import { computed, onBeforeUnmount, ref, useAttrs, useSlots, watch } from 'vue'
import { useDialogStepsApi } from '../GDialog/dialogContext.js'

defineOptions({ name: 'GDialogStep', inheritAttrs: false })

const props = defineProps({
  name: { type: String, required: true },
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  summary: { type: String, default: undefined }
})

const attrs = useAttrs()
const slots = useSlots()
const api = useDialogStepsApi()
const panel = ref(null)

try {
  if (process.env.NODE_ENV !== 'production') {
    if (!api) console.warn('[Grana GDialogStep] va fuera de un GDialog: no pinta nada.')
    else if (!props.title) console.warn(`[Grana GDialog] el paso «${props.name}» no tiene \`title\`: es el nombre del paso, del panel y del hilo.`)
  }
} catch {}

const rec = {
  name: props.name,
  title: () => props.title,
  description: () => props.description,
  summary: () => props.summary,
  slots,
  el: () => panel.value
}
let off = api ? api.registerStep(rec) : null
watch(() => props.name, (n) => {
  if (!api) return
  off?.()
  rec.name = n
  off = api.registerStep(rec)
})
onBeforeUnmount(() => off?.())

const inHistory = computed(() => Boolean(api) && api.inHistory(props.name))
const isCurrent = computed(() => Boolean(api) && api.isCurrent(props.name))
const classes = computed(() => ['g-dialog__step', { 'is-current': isCurrent.value, 'is-entering': Boolean(api) && api.isEntering(props.name) }])
const scope = computed(() => (api && api.scope ? api.scope.value : {}))
</script>

<template>
  <section
    v-if="inHistory"
    v-bind="attrs"
    ref="panel"
    :class="classes"
    role="group"
    :aria-labelledby="api.stepTitleId(name)"
    :hidden="!isCurrent"
    :inert="isCurrent ? undefined : ''"
  >
    <slot v-bind="scope" />
  </section>
</template>
