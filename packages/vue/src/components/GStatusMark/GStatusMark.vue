<script setup>
// GStatusMark · marca en línea, complemento de la isla de estado (dueño: bruno)
// Contrato: design/contracts/status.md «GStatusMark» (#323, #700) · Estructura: design/lab/alert/r02/ §8 y r04/ · Estilo: de coco.
// Con `for`: cápsula `button` junto al origen de una condición, la MEMORIA de lo pendiente cuando la isla se recoge; existe
// solo mientras exista la condición (también vista), su tipo y su `busy` salen de ella (no son props: no se desincroniza),
// abre la lista EN su condición, pausa la lectura de lo mostrado mientras el puntero o el foco están sobre ella y recibe el
// eco (`is-echo`, una vez) cuando la isla se recoge, solo si se ve. Sin `for`: línea de texto de una sección (insignia +
// texto + una acción opcional); no entra en la isla. Ninguna de las dos anuncia.
import { computed, inject, onBeforeUnmount, onMounted, ref, toRaw, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import { INTERNAL, STATUS_ICONS as ICON, STATUS_TYPES, statusKey } from '../GStatusIsland/status.js'

defineOptions({ name: 'GStatusMark' })

const props = defineProps({
  for: { type: [String, Number], default: undefined },
  type: { type: String, default: undefined, validator: oneOf(STATUS_TYPES) },
  typeLabel: { type: String, default: undefined },
  status: { type: Object, default: undefined }
})

const warned = new Set()
const warn = (msg) => {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(msg)) {
      warned.add(msg)
      console.warn(`[Grana Status] ${msg}`)
    }
  } catch {}
}
const slots = useSlots()
const injected = inject(statusKey, null)
const manager = toRaw(props.status) || injected
const api = manager && manager[INTERNAL] ? manager[INTERNAL] : null
const S = api ? api.state : null

const isLink = computed(() => props.for !== undefined && props.for !== null && props.for !== '')
try {
  if (process.env.NODE_ENV !== 'production') {
    if (isLink.value && !api) warn('<GStatusMark for> sin prop `status` y sin gestor provisto (app.use(createStatus(…))): no pinta nada.')
    if (isLink.value && props.type !== undefined) warn('<GStatusMark> con `for` y `type` a la vez: con `for`, el tipo es el de la condición (se ignora `type`).')
  }
} catch {}

// En el servidor la marca enlace no renderiza: aparece al montar
const mounted = ref(false)
const rec = computed(() => (isLink.value && api && mounted.value ? api.byId(props.for) || null : null))
const type = computed(() => (isLink.value ? (rec.value ? rec.value.type : 'info') : props.type || 'info'))
const busy = computed(() => Boolean(rec.value && rec.value.busy))
const prefix = computed(() => {
  const t = props.typeLabel || (S && S.opts.labels.types ? S.opts.labels.types[type.value] : undefined)
  try { if (process.env.NODE_ENV !== 'production' && !t && !isLink.value) warn(`<GStatusMark> de texto sin prefijo de tipo: pasa \`typeLabel\` o define labels.types.${type.value} en el gestor.`) } catch {}
  return t ? `${t}: ` : ''
})
const echoing = ref(false)
const classes = computed(() => ['g-status-mark', isLink.value ? 'g-status-mark--link' : 'g-status-mark--text', `g-status-mark--type-${type.value}`, { 'is-busy': busy.value, 'is-echo': echoing.value }])
const mobile = computed(() => Boolean(S && S.mobile))
const scope = computed(() => (rec.value ? { condition: api.copy(rec.value), type: type.value, busy: busy.value } : {}))

const el = ref(null)
// Guarda la marca como elemento de vuelta y abre la lista en su condición con el foco en su acción. Sin anuncios.
function activate() {
  if (api && rec.value) api.openFrom(el.value, props.for)
}

// ---------- Registro en el gestor: vuelta del foco, «montada» (lo que no se recoge solo) y eco ----------
const raf = (cb) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(cb) : setTimeout(cb, 16))
let echoFrame = 0
// El eco: una vez; se quita al terminar su animación o, si no hay ninguna (movimiento reducido, sin CSS), en el cuadro siguiente
const entry = {
  el: () => el.value,
  echo() {
    echoing.value = true
    echoFrame = raf(() => {
      const node = el.value
      let running = false
      try { running = node.getAnimations().some((a) => a.playState === 'running') } catch { running = false }
      if (!running) echoing.value = false
    })
  }
}
function onEchoEnd(event) {
  if (event.target === el.value) echoing.value = false
}
const token = `mark-${useId()}`
let registered
function register(id) {
  if (!api) return
  if (registered !== undefined) { api.markDel(registered, entry); api.markHold(token, null) }
  registered = id
  if (id !== undefined) api.markAdd(id, entry)
}
onMounted(() => {
  mounted.value = true
  if (isLink.value) register(props.for)
})
watch(() => (isLink.value ? props.for : undefined), (id) => { if (mounted.value) register(id) })
onBeforeUnmount(() => {
  register(undefined)
  if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(echoFrame)
})
// Puntero o foco sobre la marca de una condición mostrada o en espera: la lectura queda en pausa (#696)
let over = false
let focused = false
const syncHold = () => { if (api) api.markHold(token, over || focused ? props.for : null) }
const onEnter = (e) => { if (e.pointerType !== 'touch') { over = true; syncHold() } }
const onLeave = () => { over = false; syncHold() }
const onFocusin = () => { focused = true; syncHold() }
const onFocusout = () => { focused = false; syncHold() }
// La condición se fue con el puntero encima: sin pointerleave, la pausa se suelta aquí
watch(rec, (r) => { if (!r && (over || focused)) { over = false; focused = false; syncHold() } })
</script>

<template>
  <button
    v-if="isLink && rec"
    ref="el"
    :class="classes"
    type="button"
    :data-type="type"
    :aria-expanded="mobile ? undefined : (S.list ? 'true' : 'false')"
    :aria-controls="!mobile && S.regionId ? `${S.regionId}-panel` : undefined"
    :aria-haspopup="mobile ? 'dialog' : undefined"
    :aria-busy="busy ? 'true' : undefined"
    @click="activate"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @focusin="onFocusin"
    @focusout="onFocusout"
    @animationend="onEchoEnd"
    @animationcancel="onEchoEnd"
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
