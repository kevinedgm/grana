<script setup>
// GGalleryViewer · visor a pantalla completa de las fotos de un lugar (dueño: bruno)
// Contrato: design/contracts/gallery.md (DECISIONS.md #730 a #735, #742, #744; remates #758, #759) · Estructura:
// design/lab/gallery/r01/ (kiwi) · Estilo: GGallery.css (coco). Va sobre GDialog fullscreen bare (#732): el modal (apilado,
// Esc repetida, foco inicial #292, foco devuelto a `from`, página inmóvil) es el de GDialog; aquí, los controles fuera de la
// foto, el anuncio, el teclado, el gesto (umbrales de JS de §29.6), el zoom ×2 del tamaño contenido (#758: --_zoom-w/-h) y
// la llegada desde el lado del gesto (is-arriving + data-direction en el mismo cuadro que cambia la foto). Esc escalonado:
// con la foto ampliada, la primera Esc solo reduce (preventDefault; GDialog respeta defaultPrevented). Puro (#444).
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useAttrs, useId, watch } from 'vue'
import GDialog from '../GDialog/GDialog.vue'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { fill } from '../../utils/template.js'
import { observeSize } from '../../utils/sizeObserver.js'
import { nextFrame } from '../GForm/formContext.js'
import { buildGroups, isPhoto, langOf, numberFormat } from './gallery.js'

defineOptions({ name: 'GGalleryViewer', inheritAttrs: false })

const props = defineProps({
  modelValue: Boolean,
  photos: { type: Array, default: () => [] },
  groups: { type: Array, default: undefined },
  index: { type: Number, default: undefined },
  title: { type: String, default: undefined },
  zoom: { type: Boolean, default: true },
  zone: { type: String, default: 'brand', validator: (v) => v === 'brand' || v === 'none' },
  from: { type: [String, typeof HTMLElement === 'undefined' ? Object : HTMLElement], default: undefined },
  labels: { type: Object, default: () => ({}) },
  locale: { type: String, default: undefined },
  id: { type: String, default: undefined }
})
const emit = defineEmits(['update:modelValue', 'update:index'])
const attrs = useAttrs()
const uid = useId()
const base = computed(() => props.id || `g-gallery-viewer-${uid}`)

// Umbrales del gesto y zoom (§29.6; constantes de JS, #734)
const SWIPE_RATIO = 0.18
const FLICK_PX = 40
const FLICK_MS = 250
const CLOSE_RATIO = 0.22
const ZOOM = 2

const warned = new Set()
const warn = (key, text) => {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana GGalleryViewer] ${text}`)
    }
  } catch {}
}
const L = computed(() => props.labels || {})
const label = (k) => {
  const v = L.value[k]
  if (v === undefined || v === null || v === '') {
    try { if (process.env.NODE_ENV !== 'production') warn(`labels.${k}`, `falta labels.${k} (aviso 7).`) } catch {}
    return ''
  }
  return v
}

const list = computed(() => (Array.isArray(props.photos) ? props.photos.filter(isPhoto) : []))
const N = computed(() => list.value.length)
const grouped = computed(() => buildGroups(list.value, props.groups, base.value))

// Foto actual: v-model:index o interna; fuera de rango, la más cercana (aviso 9)
const local = ref(0)
const clamp = (i) => Math.max(0, Math.min(N.value - 1, Number.isInteger(i) ? i : 0))
const cur = computed(() => clamp(props.index !== undefined ? props.index : local.value))
watch(() => [props.index, N.value], () => {
  try { if (process.env.NODE_ENV !== 'production' && props.index !== undefined && N.value && (props.index < 0 || props.index >= N.value)) warn('index', `index=${props.index} fuera de rango: se toma el más cercano (aviso 9).`) } catch {}
}, { immediate: true })
const photo = computed(() => list.value[cur.value] || null)

const loc = ref(props.locale)
const nf = computed(() => numberFormat(loc.value))
const num = (n) => nf.value.format(n)

const position = computed(() => {
  const g = grouped.value
  if (g) {
    const gi = g.of[cur.value]
    const grp = g.list[gi]
    if (grp) return fill(label('groupCount'), { group: grp.label, index: num(grp.items.indexOf(cur.value) + 1), total: num(grp.items.length) })
  }
  return fill(label('count'), { index: num(cur.value + 1), total: num(N.value) })
})
const altOf = (p) => (p && typeof p.alt === 'string' ? p.alt : '')

// ---------- Anuncio (región viva cortés y atómica, vacía desde el montaje) ----------
const live = ref('')
let liveTimer = null
function say(text) {
  clearTimeout(liveTimer)
  live.value = ''
  liveTimer = setTimeout(() => { live.value = text }, 60)
}
const describe = () => fill(label('announce'), { position: position.value, alt: altOf(photo.value) })

// ---------- Cambio de foto y llegada ----------
const arriving = ref(false)
const direction = ref('next')
const broken = ref(false)
const imgEl = ref(null)
const stageEl = ref(null)
function show(i, dir = 0, announce = true) {
  const t = clamp(i)
  if (t === cur.value) return
  setZoom(false)
  broken.value = false
  local.value = t
  emit('update:index', t)
  if (dir) {
    direction.value = dir > 0 ? 'next' : 'prev'
    arriving.value = true
    nextTick(() => {
      // El punto de partida (sin transición) se calcula antes de quitar la clase en el cuadro siguiente
      if (imgEl.value) void imgEl.value.offsetWidth
      nextFrame(() => { arriving.value = false })
    })
  }
  if (announce) {
    const last = dir > 0 && t === N.value - 1 && L.value.last ? ` ${L.value.last}` : ''
    const first = dir < 0 && t === 0 && L.value.first ? ` ${L.value.first}` : ''
    nextTick(() => say(describe() + last + first))
  }
  preload()
}
function go(d) {
  const t = cur.value + d
  if (t < 0 || t > N.value - 1) { say(label(t < 0 ? 'first' : 'last')); return }
  show(t, d)
}
function preload() {
  const next = list.value[cur.value + 1]
  if (next && typeof Image !== 'undefined') { const im = new Image(); im.decoding = 'async'; im.src = next.src }
}
function jumpGroup(gi) {
  const g = grouped.value
  if (!g || !g.list[gi]) return
  const t = g.list[gi].items[0]
  if (t !== cur.value) show(t, Math.sign(t - cur.value))
}

// ---------- Zoom ×2 del tamaño contenido (#758) ----------
const zoomed = ref(false)
const zoomBox = ref(null) // { w, h } px enteros
let stopObs = null
function measureZoom() {
  const s = stageEl.value
  const p = photo.value
  if (!s || !p || !(p.width > 0 && p.height > 0)) { zoomBox.value = null; return }
  // La foto en reposo se pinta dentro del relleno de la img (G-A1): se mide la caja de contenido, no todo el escenario
  let padX = 0
  let padY = 0
  const im = imgEl.value
  if (im && typeof getComputedStyle === 'function') {
    const cs = getComputedStyle(im)
    padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
    padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0)
  }
  const sw = s.clientWidth - padX
  const sh = s.clientHeight - padY
  if (!(sw > 0) || !(sh > 0)) { zoomBox.value = null; return }
  const k = Math.min(sw / p.width, sh / p.height)
  const next = { w: Math.round(p.width * k * ZOOM), h: Math.round(p.height * k * ZOOM) }
  if (!zoomBox.value || zoomBox.value.w !== next.w || zoomBox.value.h !== next.h) zoomBox.value = next
}
function setZoom(on, fx = 0.5, fy = 0.5) {
  if (on && !props.zoom) return
  if (on === zoomed.value) return
  zoomed.value = on
  if (stopObs) { stopObs(); stopObs = null }
  if (!on) { zoomBox.value = null; return }
  measureZoom()
  if (stageEl.value) stopObs = observeSize(stageEl.value, measureZoom)
  // El punto del zoom: con scrollLeft/scrollTop del escenario tras ampliar (no hay --_zoom-x/-y, #758)
  nextTick(() => nextFrame(() => {
    const s = stageEl.value
    if (!s) return
    const rtl = getComputedStyle(s).direction === 'rtl'
    const maxX = s.scrollWidth - s.clientWidth
    s.scrollLeft = rtl ? -maxX * (1 - fx) : maxX * fx
    s.scrollTop = (s.scrollHeight - s.clientHeight) * fy
  }))
}
const stageStyle = computed(() => {
  const s = {}
  if (drag.value) { s['--_drag-x'] = `${drag.value.x}px`; s['--_drag-y'] = `${drag.value.y}px` }
  if (zoomed.value && zoomBox.value) { s['--_zoom-w'] = `${zoomBox.value.w}px`; s['--_zoom-h'] = `${zoomBox.value.h}px` }
  return s
})

// ---------- Gesto (G-L10): pasa con ≥ 18 % o 40 px en < 250 ms; abajo ≥ 22 % cierra; doble clic amplía ----------
const drag = ref(null)
let p0 = null
const reduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isRtl = () => { const s = stageEl.value; return Boolean(s && getComputedStyle(s).direction === 'rtl') }
function onPointerdown(e) {
  if (zoomed.value || e.button > 0 || N.value === 0) return
  p0 = { x: e.clientX, y: e.clientY, id: e.pointerId, t: Date.now() }
  try { e.currentTarget.setPointerCapture(e.pointerId) } catch {}
}
function onPointermove(e) {
  if (!p0 || e.pointerId !== p0.id || reduced()) return
  const dx = e.clientX - p0.x
  const dy = e.clientY - p0.y
  drag.value = Math.abs(dx) >= Math.abs(dy) ? { x: dx, y: 0 } : { x: 0, y: Math.max(0, dy) }
}
function onPointerup(e, close) {
  if (!p0 || e.pointerId !== p0.id) return
  const dx = e.clientX - p0.x
  const dy = e.clientY - p0.y
  const s = stageEl.value
  const w = s ? s.clientWidth : 0
  const hgt = s ? s.clientHeight : 0
  const fast = Date.now() - p0.t < FLICK_MS
  p0 = null
  drag.value = null
  if (Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) >= w * SWIPE_RATIO || (fast && Math.abs(dx) >= FLICK_PX))) go((dx < 0) !== isRtl() ? 1 : -1)
  else if (dy > Math.abs(dx) && dy >= hgt * CLOSE_RATIO) close()
}
function onPointercancel() {
  p0 = null
  drag.value = null
}
function onDblclick(e) {
  if (!props.zoom) return
  const r = imgEl.value ? imgEl.value.getBoundingClientRect() : null
  const fx = r && r.width ? Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) : 0.5
  const fy = r && r.height ? Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) : 0.5
  setZoom(!zoomed.value, fx, fy)
}

// ---------- Teclado (gallery.md «Teclado») ----------
function onKeydown(e) {
  if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return
  const k = e.key
  // Esc escalonado: ampliada, la primera solo reduce (la repetición la ignora GDialog, #565)
  if (k === 'Escape') {
    if (zoomed.value) { e.preventDefault(); if (!e.repeat) setZoom(false) }
    return
  }
  const rtl = isRtl()
  const fwd = rtl ? 'ArrowLeft' : 'ArrowRight'
  const back = rtl ? 'ArrowRight' : 'ArrowLeft'
  if (zoomed.value && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(k)) {
    // Ampliada, las flechas recorren la foto (desplazamiento del escenario)
    const s = stageEl.value
    if (!s) return
    e.preventDefault()
    const step = Math.max(40, Math.round(Math.min(s.clientWidth, s.clientHeight) * 0.1))
    const dx = k === 'ArrowLeft' ? -step : k === 'ArrowRight' ? step : 0
    const dy = k === 'ArrowUp' ? -step : k === 'ArrowDown' ? step : 0
    s.scrollBy({ left: dx, top: dy })
    return
  }
  const g = grouped.value
  if (k === fwd) { e.preventDefault(); go(1) }
  else if (k === back) { e.preventDefault(); go(-1) }
  else if (k === 'Home') { e.preventDefault(); if (cur.value !== 0) show(0, -1) }
  else if (k === 'End') { e.preventDefault(); if (cur.value !== N.value - 1) show(N.value - 1, 1) }
  else if (g && (k === 'PageDown' || k === 'PageUp')) {
    e.preventDefault()
    jumpGroup(g.of[cur.value] + (k === 'PageDown' ? 1 : -1))
  } else if ((k === '+' || k === '=') && props.zoom) { e.preventDefault(); setZoom(true) }
  else if (k === '-' && props.zoom) { e.preventDefault(); setZoom(false) }
}

// ---------- Hilo: el espacio actual a la vista dentro del hilo ----------
const threadEl = ref(null)
watch(() => (grouped.value ? grouped.value.of[cur.value] : -1), () => nextTick(() => {
  const t = threadEl.value
  const b = t && t.querySelector('[aria-current="true"]')
  if (!t || !b || typeof b.getBoundingClientRect !== 'function') return
  const br = b.getBoundingClientRect()
  const tr = t.getBoundingClientRect()
  if (br.left < tr.left) t.scrollBy({ left: br.left - tr.left })
  else if (br.right > tr.right) t.scrollBy({ left: br.right - tr.right })
}))

// ---------- Abrir y cerrar ----------
const isOpen = computed(() => props.modelValue && N.value > 0)
watch(isOpen, (on) => {
  if (on) {
    broken.value = false
    arriving.value = false
    say(describe())
    preload()
  } else {
    setZoom(false)
    drag.value = null
  }
}, { flush: 'post' })
watch(() => photo.value && photo.value.src, () => { broken.value = false })

const dialogEl = ref(null)
onMounted(() => {
  loc.value = langOf(dialogEl.value && dialogEl.value.$el && dialogEl.value.$el.parentElement, props.locale)
  if (isOpen.value) { say(describe()); preload() }
})
watch(() => props.locale, (v) => { if (v) loc.value = v })
onBeforeUnmount(() => { clearTimeout(liveTimer); if (stopObs) stopObs() })

// Avisos (una vez por instancia y motivo)
watch(() => [props.title, props.photos], () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      if (!(typeof props.title === 'string' && props.title.trim())) warn('title', 'falta title (aviso 1).')
      if (!N.value) warn('empty', 'photos vacío: el visor no abre (aviso 5).')
      list.value.forEach((p) => {
        if (!(p.width > 0 && p.height > 0)) warn('size', 'una foto sin width/height (aviso 2).')
        if (!(typeof p.alt === 'string' && p.alt)) warn('alt', 'una foto sin alt (aviso 3).')
      })
      const issues = {}
      buildGroups(list.value, props.groups, base.value, issues)
      if (issues.unknown !== undefined) warn('group-unknown', `una foto con group="${issues.unknown}" que no está en groups: va al final (aviso 4).`)
      if (issues.duplicate !== undefined) warn('group-dup', `value repetido en groups: "${issues.duplicate}" (aviso 4).`)
    }
  } catch {}
}, { immediate: true })

const single = computed(() => N.value === 1)
const viewerName = computed(() => fill(label('viewer'), { title: props.title || '' }))
const rootAttrs = computed(() => ({ ...attrs, class: ['g-gallery-viewer', attrs.class], 'data-g-zone': props.zone === 'none' ? undefined : 'brand', 'aria-label': attrs['aria-label'] || viewerName.value || undefined }))
const onDialog = (v) => { if (!v) emit('update:modelValue', false) }

defineExpose({ show: (i) => show(i, Math.sign(i - cur.value)), zoomIn: () => setZoom(true), zoomOut: () => setZoom(false) })
</script>

<template>
  <GDialog
    ref="dialogEl"
    v-bind="rootAttrs"
    :model-value="isOpen"
    fullscreen
    bare
    :from="from"
    :close-on-backdrop="false"
    @update:model-value="onDialog"
    @keydown="onKeydown"
  >
    <template #default="{ close }">
      <div class="g-gallery-viewer__bar">
        <p class="g-gallery-viewer__title" aria-hidden="true" dir="auto">{{ title }}</p>
        <p class="g-gallery-viewer__count" aria-hidden="true" dir="auto">{{ position }}</p>
        <GBtn v-if="zoom" class="g-gallery-viewer__zoom" variant="ghost" color="neutral" icon :aria-label="label('zoom')" :aria-pressed="zoomed ? 'true' : 'false'" @click="setZoom(!zoomed)"><GIcon :name="zoomed ? 'zoom-out' : 'zoom-in'" /></GBtn>
        <GBtn class="g-gallery-viewer__close" variant="ghost" color="neutral" icon :aria-label="label('close')" :autofocus="single || undefined" @click="close"><GIcon name="x" /></GBtn>
      </div>
      <div
        ref="stageEl"
        :class="['g-gallery-viewer__stage', { 'is-zoomed': zoomed, 'is-dragging': Boolean(drag) }]"
        :style="stageStyle"
        @pointerdown="onPointerdown"
        @pointermove="onPointermove"
        @pointerup="onPointerup($event, close)"
        @pointercancel="onPointercancel"
        @dblclick="onDblclick"
        @dragstart.prevent
      >
        <img
          v-if="photo"
          ref="imgEl"
          :class="['g-gallery-viewer__img', { 'is-arriving': arriving }]"
          :data-direction="arriving ? direction : undefined"
          :src="photo.src"
          :srcset="photo.srcset || undefined"
          :sizes="photo.sizes || undefined"
          :width="photo.width"
          :height="photo.height"
          :alt="altOf(photo)"
          decoding="async"
          @error="broken = true"
        >
        <p v-if="broken" class="g-gallery-viewer__broken" dir="auto">{{ fill(label('broken'), { alt: altOf(photo) }) }}</p>
      </div>
      <p class="g-gallery-viewer__caption" aria-hidden="true" dir="auto">{{ photo && photo.caption }}</p>
      <div v-if="!single" class="g-gallery-viewer__nav">
        <GBtn class="g-gallery-viewer__prev" variant="outline" color="neutral" icon :aria-label="label('prev')" :aria-disabled="cur === 0 ? 'true' : undefined" @click="go(-1)"><GIcon name="chevron-left" class="g-icon--flip-rtl" /></GBtn>
        <GBtn class="g-gallery-viewer__next" variant="outline" color="neutral" icon autofocus :aria-label="label('next')" :aria-disabled="cur === N - 1 ? 'true' : undefined" @click="go(1)"><GIcon name="chevron-right" class="g-icon--flip-rtl" /></GBtn>
      </div>
      <nav v-if="grouped" ref="threadEl" class="g-gallery-viewer__thread" :aria-label="label('groups')" tabindex="-1">
        <button
          v-for="(g, gi) in grouped.list"
          :key="g.id"
          class="g-gallery-viewer__thread-item"
          type="button"
          dir="auto"
          :aria-current="grouped.of[cur] === gi ? 'true' : undefined"
          @click="jumpGroup(gi)"
        >{{ g.label }}</button>
      </nav>
      <p class="g-gallery-viewer__live" aria-live="polite" aria-atomic="true">{{ live }}</p>
    </template>
  </GDialog>
</template>
