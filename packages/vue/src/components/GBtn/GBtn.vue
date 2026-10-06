<script setup>
// GBtn · lógica del botón (dueño: bruno)
// Contrato: design/contracts/btn.md · Estructura: design/lab/btn/r01/ · Estilo: GBtn.css (coco)
import { computed, getCurrentInstance, h, onBeforeUnmount, onMounted, ref, useAttrs, useSlots, watch } from 'vue'
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
  tooltip: { type: String, default: undefined }
})

// Declarar `click` evita que el @click del consumidor llegue al elemento nativo por $attrs
// y se dispare durante `loading` (aria-disabled no bloquea el clic nativo).
const emit = defineEmits(['click'])

const attrs = useAttrs()
const slots = useSlots()

const isLink = computed(() => Boolean(props.href))
const isInert = computed(() => props.disabled || props.loading)

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
    'is-loading': props.loading
  }
])

// Atributos que controla el componente; se aplican después de los del consumidor y ganan.
const controlled = computed(() => {
  const busy = props.loading ? 'true' : undefined
  if (isLink.value) {
    // Un enlace no tiene estado deshabilitado nativo: sin href, fuera del tabulado, rol explícito.
    return isInert.value
      ? { role: 'link', 'aria-disabled': 'true', tabindex: '-1', 'aria-busy': busy }
      : { href: props.href }
  }
  return {
    type: props.type,
    // disabled usa el atributo nativo; loading no, porque deshabilitar un botón enfocado pierde el foco.
    disabled: props.disabled || undefined,
    // Sin loading se respeta el aria-disabled del consumidor (un control enfocable que no actúa, p. ej. el disparador
    // de voz con otra sesión activa, speech.md §8.2)
    'aria-disabled': props.loading ? 'true' : attrs['aria-disabled'],
    'aria-busy': busy
  }
})

const rootBindings = computed(() => ({ ...attrs, ...controlled.value }))

// Región de estado (#257, acota #14): solo existe mientras `loadingText` tenga valor. Si la región ya existía, el texto
// se escribe al entrar en `loading`; si se monta a la vez que `loading` (los dos en el mismo cambio, o al montar con
// `loading` ya activo), se monta vacía y el texto se escribe en el ciclo siguiente (retardo de los canales, como
// utils/liveRegion.js): una región viva solo se anuncia si existe antes del cambio.
const STATUS_DELAY = 50
const statusText = ref('')
let statusTimer = null
const current = () => (props.loading && props.loadingText ? props.loadingText : '')
function writeStatus(defer) {
  clearTimeout(statusTimer)
  statusTimer = null
  if (defer && current()) statusTimer = setTimeout(() => { statusTimer = null; statusText.value = current() }, STATUS_DELAY)
  else statusText.value = current()
}
watch(() => [props.loading, props.loadingText], (_, [, oldText]) => writeStatus(!oldText))
onMounted(() => { if (current()) writeStatus(true) })
onBeforeUnmount(() => clearTimeout(statusTimer))

function onClick(event) {
  if (isInert.value) {
    // También cancela el envío de un formulario cuando type="submit" y está cargando.
    event.preventDefault()
    return
  }
  emit('click', event)
}

// Aviso solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
if (isDev && props.icon && !attrs['aria-label'] && !attrs['aria-labelledby'] && !props.tooltip) {
  console.warn('[Grana] <GBtn icon> necesita aria-label, aria-labelledby o tooltip para tener un nombre accesible.')
}

// Prop `tooltip` (#390): con un GTooltip como padre directo gana el envoltorio (más rico y explícito) y GBtn no crea el
// suyo. Solo el hijo directo: un GBtn tooltip más adentro de lo envuelto (el `append` de un GInput) conserva el suyo.
const wrapped = getCurrentInstance()?.parent?.type === GTooltip
if (isDev && wrapped && props.tooltip) {
  console.warn('[Grana] <GBtn tooltip> dentro de un <GTooltip>: gana el envoltorio y la prop `tooltip` se ignora.')
}
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
  <TooltipWrap :text="ownTooltip"><component :is="isLink ? 'a' : 'button'" v-bind="rootBindings" :class="classes" @click="onClick">
    <span v-if="slots.prepend" class="g-btn__prepend" aria-hidden="true"><slot name="prepend" /></span>
    <span class="g-btn__label"><slot /></span>
    <span v-if="slots.append" class="g-btn__append" aria-hidden="true"><slot name="append" /></span>
    <GIcon class="g-btn__loader" name="loader-circle" />
  </component></TooltipWrap>
  <span v-if="loadingText" class="g-btn__status" role="status">{{ statusText }}</span>
</template>
