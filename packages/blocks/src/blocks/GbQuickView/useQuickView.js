// GbQuickView · lo que comparten las tres variantes (dueño: bruno; quick-view.md «Piezas»): la superficie abierta
// (v-model:open, con o sin v-model), el id del diálogo (el `id` de la aplicación o uno propio: su título nombra la tarjeta de
// la portada en 03), el panel de E4 (common/ProductPanel.js) y la ficha completa (GbLink `labels.full` con `product.href`,
// `navigate` con item = product). Tras «Añadir» el bloque no cierra solo: cierra la aplicación con `open = false`.
// Avisos: los del panel (con este prefijo), C5 (`close`, `full`) y QV1 (abierto sin `from` ni un disparador enfocado).
import { computed, h, onMounted, ref, useAttrs, useId, watch } from 'vue'
import GbLink from '../common/link.js'
import { useProductPanel } from '../common/ProductPanel.js'
import { has } from '../common/text.js'

export function useQuickView(props, emit, warn) {
  const d = useProductPanel(props, emit, warn)
  const attrs = useAttrs()
  const uid = useId()
  const dialogId = computed(() => (has(attrs.id) ? attrs.id : `gb-quick-view-${uid}`))

  const local = ref(Boolean(props.open))
  watch(() => props.open, (v) => { if (v !== undefined) local.value = Boolean(v) })
  const isOpen = computed(() => (props.open !== undefined ? Boolean(props.open) : local.value))
  const setOpen = (v) => {
    local.value = v
    emit('update:open', v)
  }

  const close = computed(() => d.need('close', 'nombre del botón de cerrar'))
  const photos = computed(() => (Array.isArray(d.p.value.photos) ? d.p.value.photos.filter((x) => x && has(x.src)) : []))

  // QV1: abrir sin `from` y sin un disparador enfocado (el foco volvería a donde GDialog decida); una vez por instancia
  const check = (on) => {
    try {
      if (process.env.NODE_ENV !== 'production' && on && !props.from && typeof document !== 'undefined' && (!document.activeElement || document.activeElement === document.body)) {
        warn('QV1', 'open sin from y sin un disparador enfocado: al cerrar, el foco vuelve a donde GDialog decida; pasa el disparador de open { event } (event.currentTarget) como from (QV1).')
      }
    } catch {}
  }
  onMounted(() => check(isOpen.value))
  watch(isOpen, (on) => check(on))

  /** La ficha completa (con `product.href`), al final del panel. */
  const full = () => {
    const p = d.p.value
    if (!has(p.href)) return null
    const label = d.need('full', '«Ver la ficha completa»')
    if (!label) return null
    return h(GbLink, { link: { label, href: p.href, external: Boolean(p.external) }, item: props.product, external: d.L.value.external, what: 'product.href', warn, onNavigate: (x) => emit('navigate', x) })
  }

  return { d, dialogId, isOpen, setOpen, close, photos, full }
}
