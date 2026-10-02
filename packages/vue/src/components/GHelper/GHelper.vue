<script>
// GHelper · ayuda contextual anclada a una región (dueño: bruno)
// Contrato: design/contracts/helper.md · Estructura: design/lab/helper/r01/ · Estilo: GHelper.css (coco).
// El disparador se coloca con CSS (placement × attach × offset) respecto al ancestro posicionado más cercano.
// El contenido es un diálogo no modal en la capa superior (popover="manual"), justo después del botón en el DOM;
// si no cabe (o el visor es más estrecho que el umbral de hoja), se abre en GDialog como hoja (DECISIONS.md #101 a #103).
import { defineComponent, h, ref, computed, watch, nextTick, onBeforeUnmount, useId } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { placeAround, parsePlacement, viewport } from '../../utils/anchor.js'
import GIcon from '../GIcon/GLibIcon.js'
import GDialog from '../GDialog/GDialog.vue'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const PLACEMENTS = ['top-start', 'top', 'top-end', 'right-start', 'right', 'right-end', 'bottom-end', 'bottom', 'bottom-start', 'left-end', 'left', 'left-start']
// Espacio mínimo del visor para un popover: space × 130 (520px con space 4), el mismo umbral en que GDialog
// pasa a hoja. Por debajo, o si ninguna posición cabe, el contenido se abre como hoja (DECISIONS.md #103).
const COMFORT_UNITS = 130

// Un solo helper abierto a la vez: el que se abre cierra al anterior
let current = null

const toPx = (value) => {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return NaN
  if (/rem\s*$|em\s*$/.test(value)) return n * parseFloat(getComputedStyle(document.documentElement).fontSize)
  return n
}

export default defineComponent({
  name: 'GHelper',
  props: {
    mode: { type: String, default: 'inline', validator: oneOf(['inline', 'float']) },
    placement: { type: String, default: 'bottom-end', validator: oneOf(PLACEMENTS) },
    attach: { type: String, default: 'inside', validator: oneOf(['inside', 'edge', 'outside']) },
    offset: { type: Number, default: 2, validator: (v) => Number.isFinite(v) && v >= 0 },
    contentPlacement: { type: String, default: undefined, validator: oneOf(PLACEMENTS) },
    open: { type: Boolean, default: undefined },
    disabled: Boolean,
    adaptive: { type: Boolean, default: true },
    ariaLabel: { type: String, default: undefined },
    contentLabel: { type: String, default: undefined },
    closeLabel: { type: String, default: undefined },
    id: { type: String, default: undefined }
  },
  emits: ['update:open', 'toggle'],
  setup(props, { emit, slots }) {
    const uid = useId()
    const baseId = computed(() => props.id || `g-helper-${uid}`)
    const contentId = computed(() => `${baseId.value}-content`)
    const sheetId = computed(() => `${baseId.value}-sheet`)

    const root = ref(null)
    const button = ref(null)
    const content = ref(null)
    const internal = ref(false)
    const presentation = ref('popover')
    const usedSide = ref(null)
    const controlled = computed(() => props.open !== undefined)
    const isOpen = computed(() => (controlled.value ? props.open : internal.value))

    // ---- Avisos de desarrollo ----
    if (isDev) {
      if (!props.ariaLabel && !slots.trigger) console.warn('[Grana] <GHelper> necesita ariaLabel: el disparador por defecto no tiene texto visible.')
      if (!props.contentLabel) console.warn('[Grana] <GHelper> necesita contentLabel: nombre del contenido (y título de la hoja).')
      if (props.adaptive && !props.closeLabel) console.warn('[Grana] <GHelper> con adaptive necesita closeLabel para el botón de cierre de la hoja.')
    }

    const setOpen = (value) => {
      if (value === isOpen.value) return
      if (!controlled.value) internal.value = value
      emit('update:open', value)
    }
    const close = (focusTrigger = false) => {
      if (!isOpen.value) return
      setOpen(false)
      if (focusTrigger) nextTick(() => button.value && button.value.focus())
    }

    // ---- Posición del contenido (popover) ----
    const spaceUnit = () => (root.value ? toPx(getComputedStyle(root.value).getPropertyValue('--g-space-1')) : NaN)
    const place = () => {
      const el = content.value
      const trigger = button.value
      if (!el || !trigger) return true
      const { width: vw, height: vh } = viewport()
      const space = spaceUnit()
      const pad = Number.isNaN(space) ? 8 : space * 2
      const r = placeAround(trigger.getBoundingClientRect(), {
        width: el.offsetWidth,
        height: el.offsetHeight,
        vw,
        vh,
        placement: props.contentPlacement || props.placement,
        rtl: getComputedStyle(trigger).direction === 'rtl',
        pad,
        gap: pad
      })
      el.style.setProperty('--_x', `${r.x}px`)
      el.style.setProperty('--_y', `${r.y}px`)
      el.style.setProperty('--_max', `${Math.max(0, r.room)}px`)
      usedSide.value = r.side
      el.setAttribute('data-side', r.side)
      const comfortable = Number.isNaN(space) || vw >= space * COMFORT_UNITS
      return r.fits && comfortable
    }

    // ---- Escuchas mientras el popover está abierto ----
    let listening = false
    const onOutside = (e) => {
      const t = e.target
      if (root.value?.contains(t) || content.value?.contains(t)) return
      close(false)
    }
    // Esc cierra aunque el foco no esté dentro: Safari y Firefox en macOS no enfocan un botón al hacer clic, así que el keydown
    // del elemento raíz no llega (verificado con Playwright en WebKit). Escucha de documento solo mientras está abierto.
    const onDocKeydown = (e) => {
      if (e.key === 'Escape' && isOpen.value && presentation.value === 'popover') {
        e.preventDefault()
        e.stopPropagation()
        close(true)
      }
    }
    const onReposition = () => { if (isOpen.value && presentation.value === 'popover') place() }
    const listen = () => {
      if (listening) return
      listening = true
      document.addEventListener('pointerdown', onOutside, true)
      document.addEventListener('keydown', onDocKeydown, true)
      window.addEventListener('resize', onReposition)
      window.addEventListener('scroll', onReposition, true)
    }
    const unlisten = () => {
      if (!listening) return
      listening = false
      document.removeEventListener('pointerdown', onOutside, true)
      document.removeEventListener('keydown', onDocKeydown, true)
      window.removeEventListener('resize', onReposition)
      window.removeEventListener('scroll', onReposition, true)
    }

    const showPopover = () => {
      const el = content.value
      if (el && typeof el.showPopover === 'function' && !el.matches?.(':popover-open')) el.showPopover()
    }
    const hidePopover = () => {
      const el = content.value
      if (el && typeof el.hidePopover === 'function' && el.matches?.(':popover-open')) el.hidePopover()
    }

    const self = { close: () => close(false) }
    const doOpen = async () => {
      if (current && current !== self) current.close()
      current = self
      presentation.value = 'popover'
      await nextTick()
      showPopover()
      const fits = place()
      if (!fits && props.adaptive) {
        hidePopover()
        presentation.value = 'sheet'
      } else {
        listen()
      }
      emit('toggle', { open: true, presentation: presentation.value })
    }
    const doClose = () => {
      unlisten()
      hidePopover()
      if (current === self) current = null
      emit('toggle', { open: false, presentation: presentation.value })
    }

    watch(isOpen, (v) => (v ? doOpen() : doClose()))
    watch(() => props.disabled, (d) => { if (d) close(false) })
    onBeforeUnmount(() => {
      unlisten()
      if (current === self) current = null
    })
    // Montado ya abierto (controlado): abre tras montar
    if (props.open) nextTick(doOpen)

    // ---- Teclado y foco ----
    const onKeydown = (e) => {
      if (e.key === 'Escape' && isOpen.value && presentation.value === 'popover') {
        e.preventDefault()
        e.stopPropagation()
        close(true)
      }
    }
    const onFocusout = (e) => {
      if (!isOpen.value || presentation.value !== 'popover') return
      const next = e.relatedTarget
      if (next && !root.value?.contains(next)) close(false)
    }

    const contentScope = () => ({ close: () => close(true), presentation: presentation.value })
    const renderContent = () => (slots.content ? slots.content(contentScope()) : slots.default ? slots.default(contentScope()) : null)

    return () => {
      const { side, align } = parsePlacement(props.placement)
      const classes = ['g-helper', `g-helper--${props.mode}`]
      if (props.mode === 'float') classes.push(`g-helper--side-${side}`, `g-helper--align-${align}`, `g-helper--attach-${props.attach}`)
      if (isOpen.value) classes.push('is-open')
      if (props.disabled) classes.push('is-disabled')

      const sheet = presentation.value === 'sheet'
      const custom = Boolean(slots.trigger)
      const trigger = h('button', {
        ref: button,
        type: 'button',
        class: ['g-helper__trigger', custom ? 'g-helper__trigger--custom' : 'g-helper__trigger--default'],
        'aria-label': props.ariaLabel,
        'aria-expanded': String(Boolean(isOpen.value)),
        'aria-controls': sheet ? sheetId.value : contentId.value,
        'aria-haspopup': 'dialog',
        disabled: props.disabled,
        onClick: () => setOpen(!isOpen.value)
      }, custom ? slots.trigger({ open: Boolean(isOpen.value) }) : [h(GIcon, { name: 'circle-help' })])

      const popover = h('div', {
        ref: content,
        id: contentId.value,
        class: 'g-helper__content',
        role: 'dialog',
        'aria-label': props.contentLabel,
        popover: 'manual',
        tabindex: '-1'
      }, isOpen.value && !sheet ? renderContent() : null)

      const kids = [trigger, popover]
      if (props.adaptive) {
        kids.push(h(GDialog, {
          id: sheetId.value,
          modelValue: Boolean(isOpen.value) && sheet,
          title: props.contentLabel,
          closeLabel: props.closeLabel,
          mobile: 'sheet',
          size: 'sm',
          'onUpdate:modelValue': (v) => { if (!v) setOpen(false) }
        }, { default: () => (sheet ? renderContent() : null) }))
      }

      return h('span', {
        ref: root,
        class: classes,
        style: { '--_offset': props.offset },
        onKeydown,
        onFocusout
      }, kids)
    }
  }
})
</script>
