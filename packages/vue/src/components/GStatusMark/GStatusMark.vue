<script setup>
// GStatusMark · marca en línea, complemento de la isla de estado (dueño: bruno)
// Contrato: design/contracts/status.md «GStatusMark» (#323) · Estructura: design/lab/alert/r02/ §8 · Estilo: de coco.
// Con `for`: cápsula `button` junto al origen de una condición; existe solo mientras exista la condición, su tipo y su
// `busy` salen de ella (no son props: no se desincroniza) y abre la isla EN su condición. Sin `for`: línea de texto de
// una sección (insignia + texto + una acción opcional); no entra en la isla. Ninguna de las dos anuncia.
import { computed, inject, onMounted, ref, toRaw, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import { INTERNAL, STATUS_TYPES, statusKey } from '../GStatusIsland/status.js'

defineOptions({ name: 'GStatusMark' })

const props = defineProps({
  for: { type: [String, Number], default: undefined },
  type: { type: String, default: undefined, validator: oneOf(STATUS_TYPES) },
  typeLabel: { type: String, default: undefined },
  status: { type: Object, default: undefined }
})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
const warn = (msg) => {
  if (!isDev || warned.has(msg)) return
  warned.add(msg)
  console.warn(`[Grana Status] ${msg}`)
}
const slots = useSlots()
const injected = inject(statusKey, null)
const manager = toRaw(props.status) || injected
const api = manager && manager[INTERNAL] ? manager[INTERNAL] : null
const S = api ? api.state : null
const ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', error: 'circle-alert' }

const isLink = computed(() => props.for !== undefined && props.for !== null && props.for !== '')
if (isDev) {
  if (isLink.value && !api) warn('<GStatusMark for> sin prop `status` y sin gestor provisto (app.use(createStatus(…))): no pinta nada.')
  if (isLink.value && props.type !== undefined) warn('<GStatusMark> con `for` y `type` a la vez: con `for`, el tipo es el de la condición (se ignora `type`).')
}

// En el servidor la marca enlace no renderiza: aparece al montar
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const rec = computed(() => (isLink.value && api && mounted.value ? api.byId(props.for) || null : null))
const type = computed(() => (isLink.value ? (rec.value ? rec.value.type : 'info') : props.type || 'info'))
const busy = computed(() => Boolean(rec.value && rec.value.busy))
const prefix = computed(() => {
  const t = props.typeLabel || (S && S.opts.labels.types ? S.opts.labels.types[type.value] : undefined)
  if (!t && !isLink.value) warn(`<GStatusMark> de texto sin prefijo de tipo: pasa \`typeLabel\` o define labels.types.${type.value} en el gestor.`)
  return t ? `${t}: ` : ''
})
const classes = computed(() => ['g-status-mark', isLink.value ? 'g-status-mark--link' : 'g-status-mark--text', `g-status-mark--type-${type.value}`, { 'is-busy': busy.value }])
const mobile = computed(() => Boolean(S && S.mobile))
const scope = computed(() => (rec.value ? { condition: api.copy(rec.value), type: type.value, busy: busy.value } : {}))

const el = ref(null)
// Guarda la marca como elemento de vuelta y abre la isla en su condición con el foco en su acción. Sin anuncios.
function activate() {
  if (api && rec.value) api.openFrom(el.value, props.for)
}
</script>

<template>
  <button
    v-if="isLink && rec"
    ref="el"
    :class="classes"
    type="button"
    :data-type="type"
    :aria-expanded="mobile ? undefined : (S.open ? 'true' : 'false')"
    :aria-controls="!mobile && S.regionId ? `${S.regionId}-panel` : undefined"
    :aria-haspopup="mobile ? 'dialog' : undefined"
    :aria-busy="busy ? 'true' : undefined"
    @click="activate"
  >
    <span class="g-status-mark__badge" :data-type="type" aria-hidden="true"><GIcon :name="busy ? 'loader-circle' : ICON[type]" /></span>
    <span class="g-status-mark__text"><span v-if="prefix" class="g-status-mark__type">{{ prefix }}</span><slot v-bind="scope">{{ rec.title }}</slot></span>
  </button>
  <div v-else-if="!isLink" :class="classes" :data-type="type">
    <span class="g-status-mark__badge" :data-type="type" aria-hidden="true"><GIcon :name="ICON[type]" /></span>
    <p class="g-status-mark__text"><span v-if="prefix" class="g-status-mark__type">{{ prefix }}</span><slot :type="type" :busy="false" /></p>
    <div v-if="slots.action" class="g-status-mark__action"><slot name="action" /></div>
  </div>
</template>
