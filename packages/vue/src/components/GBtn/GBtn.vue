<script setup>
// GBtn · lógica del botón (dueño: bruno)
// Contrato: design/contracts/btn.md · Estructura: design/lab/btn/r01/ y r02/ · Estilo: GBtn.css (coco)
import { computed, getCurrentInstance, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useSlots, watch } from 'vue'
import { createLoadPhase } from '../../utils/loadPhase.js'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GLibIcon.js'
import GTooltip from '../GTooltip/GTooltip.vue'

defineOptions({ name: 'GBtn', inheritAttrs: false })

const props = defineProps({
  color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
  variant: { type: String, default: 'solid', validator: oneOf(['solid', 'soft', 'outline', 'ghost', 'link']) },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
  block: Boolean,
  disabled: Boolean,
  loading: Boolean,
  type: { type: String, default: 'button', validator: oneOf(['button', 'submit', 'reset']) },
  href: { type: String, default: undefined },
  icon: Boolean,
  loadingText: { type: String, default: undefined },
  // Atajo de <GTooltip :text> con todo lo demás por defecto (#390, tooltip.md «Atajo GBtn tooltip»)
  tooltip: { type: String, default: undefined },
  done: Boolean, // la aplicación afirma el éxito: flanco de false a true (#1011)
  doneText: { type: String, default: undefined }
})

// Declarar `click` evita que el @click del consumidor llegue al elemento nativo por $attrs
// y se dispare durante `loading` (aria-disabled no bloquea el clic nativo).
const emit = defineEmits(['click', 'update:done'])

const attrs = useAttrs()
const slots = useSlots()

const instance = getCurrentInstance()

const isLink = computed(() => Boolean(props.href))

// Motor de carga (#1014): se crea con la primera carga. GTranscript monta cientos de GBtn y uno que nunca carga no paga
// motor, reactivo ni temporizadores. `phase` es lo único que existe en reposo.
const phase = shallowRef(null)
// Carga efectiva: de `loading` a la llegada, con la cola del mínimo (un botón que enseña el giro no actúa)
const isLoad = () => props.loading || Boolean(phase.value && phase.value.state.busy)
const isInert = computed(() => props.disabled || isLoad())

// Acuse (#1011, #1012): tiempos de percepción, no de movimiento: no siguen a los tokens ni se pausan.
const DONE_MS = 960
const LEAVE_MS = 120
const leaving = ref(false) // F3: el giro sigue mientras se funde
const marked = ref(false) // is-done
const rootEl = ref(null)
const hasMark = ref(false) // g-btn__done: nace con el primer acuse y se queda
let saying = false // la región dice doneText; con `disabled` vive más que la marca
let awaited = false // `done` llegó con carga efectiva: espera a la llegada
let doneTimer = 0
let leaveTimer = 0
// Regla 6 (`disabled` cierra el acuse): único punto que decide si la marca puede estar a la vista. El anuncio no depende de él
const markBlocked = () => props.disabled

const classes = computed(() => [
  'g-btn',
  `g-btn--color-${props.color}`,
  `g-btn--variant-${props.variant}`,
  `g-btn--size-${props.size}`,
  `g-btn--density-${props.density}`,
  props.rounded && `g-btn--rounded-${props.rounded}`,
  {
    'g-btn--block': props.block,
    'g-btn--icon': props.icon,
    'is-disabled': props.disabled,
    'is-loading': isLoad(),
    'is-shown': phase.value && phase.value.state.shown,
    'is-leaving': leaving.value,
    'is-done': marked.value && !isLink.value
  }
])

// Atributos que controla el componente; se aplican después de los del consumidor y ganan.
const controlled = computed(() => {
  const busy = isLoad() ? 'true' : undefined
  if (isLink.value) {
    // Un enlace no tiene estado deshabilitado nativo: sin href, fuera del tabulado, rol explícito.
    return isInert.value
      ? { role: 'link', 'aria-disabled': 'true', tabindex: '-1', 'aria-busy': busy }
      : { href: props.href }
  }
  return {
    type: props.type,
    // disabled usa el atributo nativo; la carga no, porque deshabilitar un botón enfocado pierde el foco.
    disabled: props.disabled || undefined,
    // Sin loading se respeta el aria-disabled del consumidor (un control enfocable que no actúa, p. ej. el disparador
    // de voz con otra sesión activa, speech.md §8.2)
    'aria-disabled': busy || attrs['aria-disabled'],
    'aria-busy': busy
  }
})

const rootBindings = computed(() => ({ ...attrs, ...controlled.value }))

// Región de estado (#257, acota #14, #1014): existe mientras `loadingText` o `doneText` tengan valor. `loadingText` se escribe
// con la carga a la vista y `doneText` con el acuse. Una región viva solo se anuncia si existe antes del cambio: con `defer` se
// vacía y el texto llega en el ciclo siguiente (retardo de los canales, como utils/liveRegion.js), lo que además vuelve a
// anunciar un mismo texto repetido.
const STATUS_DELAY = 50
const statusText = ref('')
let statusTimer = 0
const current = () => (saying ? props.doneText : phase.value && phase.value.state.shown && props.loadingText) || ''
function writeStatus(defer) {
  clearTimeout(statusTimer)
  statusTimer = 0
  if (defer && current()) {
    statusText.value = ''
    statusTimer = setTimeout(() => { statusTimer = 0; statusText.value = current() }, STATUS_DELAY)
  } else statusText.value = current()
}

function startAck() {
  if (isLink.value) {
    try { if (process.env.NODE_ENV !== 'production') console.warn('[Grana] <GBtn done> con href: lo que navega no vuelve, done se ignora.') } catch {}
    return
  }
  try { if (process.env.NODE_ENV !== 'production' && !props.doneText) console.warn('[Grana] <GBtn done> sin doneText: la marca se ve, pero no se anuncia a los lectores de pantalla.') } catch {}
  saying = true
  writeStatus(true)
  clearTimeout(doneTimer)
  doneTimer = setTimeout(closeAck, DONE_MS)
  if (markBlocked()) emit('update:done', false)
  else marked.value = hasMark.value = true
}
/** Quita la marca. `update:done` no sale si la aplicación ya puso `done` en false, aunque sea en este mismo ciclo. */
function dropMark() {
  if (!marked.value) return
  marked.value = false
  if (props.done) emit('update:done', false)
}
/** Retira marca y anuncio. */
function closeAck() {
  clearTimeout(doneTimer)
  doneTimer = 0
  saying = false
  writeStatus()
  dropMark()
}
/** Flanco de `done`: con carga efectiva, en cualquier orden, espera a la llegada. */
function affirm() {
  if (isLoad()) awaited = true
  else startAck()
}
function onArrive({ seen }) {
  if (seen) {
    leaving.value = true
    leaveTimer = setTimeout(() => { leaving.value = false }, LEAVE_MS)
  }
  writeStatus()
  if (awaited) {
    awaited = false
    startAck()
  }
}
function startLoad(entry) {
  if (!phase.value) phase.value = createLoadPhase({ onShow: writeStatus, onArrive, slow: false })
  phase.value.start(entry)
}

// Montar en carga: ya a la vista desde el primer render, también en el servidor, y sin temporizadores hasta onMounted
if (props.loading) startLoad({ arm: false, shown: true })

watch(() => props.done, (on) => {
  if (on) return affirm()
  awaited = false
  if (marked.value) closeAck() // sin marca puede quedar el anuncio de `disabled`: ese sigue
})
watch(() => props.loading, (on) => {
  if (!on) return phase.value.stop()
  closeAck()
  clearTimeout(leaveTimer)
  leaving.value = false
  startLoad()
})
watch(markBlocked, (blocked) => { if (blocked) dropMark() })
watch(() => [props.loadingText, props.doneText], (_, [oldLoading, oldDone]) => writeStatus(!oldLoading && !oldDone))
onMounted(() => {
  if (phase.value) phase.value.arm()
  if (current()) writeStatus(true)
  // Un montaje no es un suceso (#299 (4)): reposo, y el modelo vuelve a false para que la próxima afirmación sea un flanco
  if (props.done && !isLink.value) emit('update:done', false)
})
onBeforeUnmount(() => {
  clearTimeout(statusTimer)
  clearTimeout(doneTimer)
  clearTimeout(leaveTimer)
  if (phase.value) phase.value.dispose()
})

// Trazo del acuse: el icono de Lucide no se toca (#1014)
const traceMark = (vnode) => vnode.el.querySelector('path').setAttribute('pathLength', '1')

function onClick(event) {
  if (isInert.value) {
    // También cancela el envío de un formulario cuando type="submit" y está cargando.
    event.preventDefault()
    return
  }
  // Un clic retira el acuse antes de actuar, síncrono y en este orden: conserva la activación del usuario
  const closing = marked.value
  if (closing) closeAck()
  emit('click', event)
  // Una acción síncrona que vuelve a afirmar es un acuse nuevo, y Vue no entrega a la prop el false intermedio. Sin nadie que
  // escuche `update:done`, `done` sigue en true y no hay flanco
  if (closing && instance.vnode.props?.['onUpdate:done']) {
    nextTick(() => {
      if (!props.done || instance.isUnmounted) return
      // Quitar y poner `is-done` sin recálculo de estilo en medio no reinicia el trazo: un reflujo, solo en la reafirmación
      void rootEl.value?.offsetWidth
      affirm()
    })
  }
}

// Aviso solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
try {
  if (process.env.NODE_ENV !== 'production' && props.icon && !attrs['aria-label'] && !attrs['aria-labelledby'] && !props.tooltip) {
    console.warn('[Grana] <GBtn icon> necesita aria-label, aria-labelledby o tooltip para tener un nombre accesible.')
  }
} catch {}

// Prop `tooltip` (#390): con un GTooltip como padre directo gana el envoltorio (más rico y explícito) y GBtn no crea el
// suyo. Solo el hijo directo: un GBtn tooltip más adentro de lo envuelto (el `append` de un GInput) conserva el suyo.
const wrapped = instance?.parent?.type === GTooltip
try {
  if (process.env.NODE_ENV !== 'production' && wrapped && props.tooltip) {
    console.warn('[Grana] <GBtn tooltip> dentro de un <GTooltip>: gana el envoltorio y la prop `tooltip` se ignora.')
  }
} catch {}
const ownTooltip = computed(() => (wrapped ? undefined : props.tooltip))
// Envuelve el botón en un GTooltip solo con `tooltip`; si no, lo deja tal cual (estructura: botón, nodo, estado)
const TooltipWrap = (p, { slots: s }) => {
  if (p.text) return h(GTooltip, { text: p.text }, s)
  const k = s.default()
  return k.length === 1 ? k[0] : k // sin fragmento añadido: el DOM de GBtn sin tooltip no cambia
}
TooltipWrap.props = ['text']
</script>

<template>
  <TooltipWrap :text="ownTooltip"><component :is="isLink ? 'a' : 'button'" ref="rootEl" v-bind="rootBindings" :class="classes" @click="onClick">
    <span v-if="slots.prepend" class="g-btn__prepend" aria-hidden="true"><slot name="prepend" /></span>
    <span class="g-btn__label"><slot /></span>
    <span v-if="slots.append" class="g-btn__append" aria-hidden="true"><slot name="append" /></span>
    <GIcon class="g-btn__loader" name="loader-circle" />
    <GIcon v-if="hasMark" class="g-btn__done" name="check" @vue:mounted="traceMark" />
  </component></TooltipWrap>
  <span v-if="loadingText || (doneText && !href)" class="g-btn__status" role="status">{{ statusText }}</span>
</template>
