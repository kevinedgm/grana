<script setup>
// GBtn · lógica del botón (dueño: bruno)
// Contrato: design/contracts/btn.md · Estructura: design/lab/btn/r01/ · Estilo: GBtn.css (coco)
import { computed, useAttrs, useSlots } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'

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
  loadingText: { type: String, default: undefined }
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
    'aria-disabled': props.loading ? 'true' : undefined,
    'aria-busy': busy
  }
})

const rootBindings = computed(() => ({ ...attrs, ...controlled.value }))

const statusText = computed(() => (props.loading && props.loadingText ? props.loadingText : ''))

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
if (isDev && props.icon && !attrs['aria-label'] && !attrs['aria-labelledby']) {
  console.warn('[Grana] <GBtn icon> necesita aria-label o aria-labelledby para tener un nombre accesible.')
}
</script>

<template>
  <component :is="isLink ? 'a' : 'button'" v-bind="rootBindings" :class="classes" @click="onClick">
    <span v-if="slots.prepend" class="g-btn__prepend" aria-hidden="true"><slot name="prepend" /></span>
    <span class="g-btn__label"><slot /></span>
    <span v-if="slots.append" class="g-btn__append" aria-hidden="true"><slot name="append" /></span>
    <GIcon class="g-btn__loader" name="loader-circle" />
  </component>
  <span class="g-btn__status" role="status">{{ statusText }}</span>
</template>
