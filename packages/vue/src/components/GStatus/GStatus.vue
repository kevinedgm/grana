<script setup>
// GStatus · condición declarativa de la isla de estado, sin pintura (dueño: bruno)
// Contrato: design/contracts/status.md «GStatus» (#318). Mientras está montado, su condición existe: `set` al montar,
// `update` al cambiar una prop, `remove` al desmontar (motivo `unmount`). Si la persona la retira con el componente aún
// montado (descartar, «Entendido»), no se vuelve a registrar hasta que se monte de nuevo: avisa con `remove`.
// En el servidor no hace nada.
import { inject, onBeforeUnmount, onMounted, toRaw, watch } from 'vue'
import { INTERNAL, statusKey } from '../GStatusIsland/status.js'

defineOptions({ name: 'GStatus' })

const props = defineProps({
  id: { type: [String, Number], required: true },
  type: { type: String, default: undefined },
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  details: { type: String, default: undefined },
  action: { type: Object, default: undefined },
  link: { type: Object, default: undefined },
  origin: { type: Object, default: undefined },
  // Sin valor (no `false`): el modelo decide el suyo (persistent depende del tipo)
  persistent: { type: Boolean, default: undefined },
  dismissible: { type: Boolean, default: undefined },
  deadline: { type: [Number, Date], default: undefined },
  politeness: { type: String, default: undefined },
  status: { type: Object, default: undefined }
})
// Declarados: si no, la escucha del consumidor iría a $attrs
const emit = defineEmits(['remove', 'expire'])

const KEYS = ['type', 'title', 'description', 'details', 'action', 'link', 'origin', 'persistent', 'dismissible', 'deadline', 'politeness']
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const injected = inject(statusKey, null)
const manager = toRaw(props.status) || injected
const api = manager && manager[INTERNAL] ? manager[INTERNAL] : null
if (!api && isDev) console.warn('[Grana Status] <GStatus> sin prop `status` y sin gestor provisto (app.use(createStatus(…))): no registra nada.')

let registered = false
let claimed
function register() {
  const options = {
    onRemove: (reason) => {
      registered = false
      if (reason !== 'unmount') emit('remove', reason)
    },
    onExpire: () => emit('expire')
  }
  for (const k of KEYS) if (props[k] !== undefined) options[k] = props[k]
  registered = manager.set(props.id, options) !== null
}
onMounted(() => {
  if (!api) return
  claimed = props.id
  api.claim(claimed)
  register()
})
for (const k of KEYS) {
  watch(() => props[k], (v) => { if (registered) manager.update(props.id, { [k]: v }) })
}
// Otra clave es otra condición: la anterior se retira y se declara la nueva
watch(() => props.id, (id, old) => {
  if (!api || claimed === undefined) return
  if (registered) api.removeAs(old, 'unmount')
  api.release(old)
  claimed = id
  api.claim(id)
  register()
})
onBeforeUnmount(() => {
  if (!api || claimed === undefined) return
  if (registered) api.removeAs(claimed, 'unmount')
  api.release(claimed)
})
</script>

<template><!-- sin pintura --></template>
