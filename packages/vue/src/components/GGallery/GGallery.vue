<script setup>
// GGallery · las fotos de un lugar, ordenadas por lo que se vende (dueño: bruno)
// Contrato: design/contracts/gallery.md (DECISIONS.md #730 a #735, #742, #744; remates #758, #759) · Estructura:
// design/lab/gallery/r01/ (kiwi) · Estilo: GGallery.css (coco). Entrada propia @grana/vue/gallery (#742).
// Base: cuadrícula de miniaturas-ENLACE a la foto grande (mejora progresiva, G-L2) que abren el visor con la guarda de
// #505 (#731: sin navigate). A · Recorrido por espacios (con `group`): índice de enlaces, espacios con portada y, en el
// visor, contador en el espacio e hilo. B · La tira (appearance="strip"): APG Carousel sin rotación, una parada de Tab,
// botones que anuncian, desplazamiento a mano que no anuncia y un estado con dos profundidades (index compartido con el
// visor). El visor (GGalleryViewer) va dentro de la raíz y recibe como `from` la miniatura de la foto actual (from vivo,
// #732): al cerrar, el foco vuelve a la foto que se estaba viendo. Sin autoavance, nunca (G-L5). Puro (#444).
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'
import GGalleryViewer from './GGalleryViewer.vue'
import { fill } from '../../utils/template.js'
import { otherContext } from '../../utils/link.js'
import { sectionKey } from '../../utils/sectionKey.js'
import { nextFrame } from '../GForm/formContext.js'
import { buildGroups, counted, isPhoto, langOf, numberFormat } from './gallery.js'

defineOptions({ name: 'GGallery' })

const props = defineProps({
  photos: { type: Array, default: () => [] },
  groups: { type: Array, default: undefined },
  title: { type: String, default: undefined },
  headingLevel: { type: Number, default: undefined },
  appearance: { type: String, default: 'grid' },
  eager: { type: Number, default: 4 },
  zoom: { type: Boolean, default: true },
  index: { type: Number, default: undefined },
  open: { type: Boolean, default: undefined },
  viewerZone: { type: String, default: 'brand', validator: (v) => v === 'brand' || v === 'none' },
  labels: { type: Object, default: () => ({}) },
  locale: { type: String, default: undefined },
  id: { type: String, default: undefined }
})
const emit = defineEmits(['update:index', 'update:open'])
const uid = useId()
const base = computed(() => props.id || `g-gallery-${uid}`)
const parent = inject(sectionKey, null)
const level = computed(() => ([2, 3, 4].includes(props.headingLevel) ? props.headingLevel : parent ? parent.value.next : 2))

const warned = new Set()
const warn = (key, text) => {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana GGallery] ${text}`)
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
const strip = computed(() => props.appearance === 'strip')
const grouped = computed(() => buildGroups(list.value, props.groups, base.value))
const spaces = computed(() => (!strip.value && grouped.value ? grouped.value : null))

// Estado compartido con el visor: v-model:index y v-model:open o internos
const localIndex = ref(0)
const localOpen = ref(false)
const clamp = (i) => Math.max(0, Math.min(N.value - 1, Number.isInteger(i) ? i : 0))
const cur = computed(() => clamp(props.index !== undefined ? props.index : localIndex.value))
const isOpen = computed(() => (props.open !== undefined ? props.open : localOpen.value) && N.value > 0)
function setIndex(i) {
  const t = clamp(i)
  const prev = cur.value
  localIndex.value = t
  if (t !== prev) emit('update:index', t)
}
function setOpen(v) {
  localOpen.value = v
  emit('update:open', v)
}

const loc = ref(props.locale)
const nf = computed(() => numberFormat(loc.value))
const num = (n) => nf.value.format(n)

// ---------- Miniaturas: abrir con la guarda de #505 (sin navigate) y una activación por gesto (#661) ----------
const rootEl = ref(null)
const thumbs = ref([])
const setThumb = (i) => (el) => { if (el) thumbs.value[i] = el }
const fromEl = computed(() => thumbs.value[cur.value] || undefined)
function onThumbClick(e, i) {
  if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.defaultPrevented) return
  if (otherContext(e.currentTarget && e.currentTarget.getAttribute('target'))) return
  e.preventDefault()
  if (e.detail > 1) return // el segundo clic de un doble clic no vuelve a abrir
  if (strip.value) setAt(i)
  setIndex(i)
  setOpen(true)
}
const broken = ref(new Set())
const onThumbError = (i) => { broken.value = new Set([...broken.value, i]) }
const lazy = (i) => {
  if (strip.value && (i === cur.value || i === cur.value + 1)) return 'eager'
  return i < Math.max(0, props.eager) ? 'eager' : 'lazy'
}

// ---------- B · La tira ----------
const stripEl = ref(null)
const liveText = ref('')
let liveTimer = null
function say(text) {
  clearTimeout(liveTimer)
  liveText.value = ''
  liveTimer = setTimeout(() => { liveText.value = text }, 60)
}
const isRtl = () => Boolean(rootEl.value && getComputedStyle(rootEl.value).direction === 'rtl')
const reduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
let steering = null
let steerTimer = null
function slideOf(i) {
  const t = thumbs.value[i]
  return t ? t.closest('.g-gallery__slide') : null
}
function setAt(i, { scroll = false, focus = false, announce = false } = {}) {
  const t = clamp(i)
  if (t !== cur.value) setIndex(t)
  const s = slideOf(t)
  if (scroll && s && typeof s.scrollIntoView === 'function') {
    steering = t
    clearTimeout(steerTimer)
    steerTimer = setTimeout(() => { steering = null }, 1500)
    s.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth', block: 'nearest', inline: 'start' })
  }
  if (focus && thumbs.value[t]) thumbs.value[t].focus({ preventScroll: true })
  if (announce) say(fill(label('announce'), { position: fill(label('count'), { index: num(t + 1), total: num(N.value) }), alt: list.value[t].alt || '' }))
}
function step(d) {
  const t = cur.value + d
  if (t < 0 || t > N.value - 1) { say(label(t < 0 ? 'first' : 'last')); return }
  setAt(t, { scroll: true, announce: true })
}
function onStripKeydown(e) {
  if (e.altKey || e.ctrlKey || e.metaKey) return
  const rtl = isRtl()
  const k = e.key
  let t = null
  if (k === (rtl ? 'ArrowLeft' : 'ArrowRight')) t = cur.value + 1
  else if (k === (rtl ? 'ArrowRight' : 'ArrowLeft')) t = cur.value - 1
  else if (k === 'Home') t = 0
  else if (k === 'End') t = N.value - 1
  if (t === null) return
  e.preventDefault()
  if (t < 0 || t > N.value - 1) return
  setAt(t, { scroll: true, focus: true })
}
// El desplazamiento a mano mueve «la actual» sin anunciar; durante un desplazamiento pedido no se recalcula
let tick = 0
function syncFromScroll() {
  const el = stripEl.value
  if (!el) return
  const sr = el.getBoundingClientRect()
  const rtl = isRtl()
  const edge = rtl ? sr.right : sr.left
  if (steering !== null) {
    const s = slideOf(steering)
    const r = s && s.getBoundingClientRect()
    const max = el.scrollWidth - el.clientWidth
    if (!r || Math.abs((rtl ? r.right : r.left) - edge) < 2 || Math.abs(Math.abs(el.scrollLeft) - max) < 2) steering = null
    return
  }
  const c = slideOf(cur.value)
  if (c) {
    const r = c.getBoundingClientRect()
    if (r.left >= sr.left - 1 && r.right <= sr.right + 1 && Math.abs(el.scrollLeft) > 1) return
  }
  let best = cur.value
  let d = Infinity
  list.value.forEach((_, i) => {
    const s = slideOf(i)
    if (!s) return
    const r = s.getBoundingClientRect()
    const dd = Math.abs((rtl ? r.right : r.left) - edge)
    if (dd < d) { d = dd; best = i }
  })
  if (best !== cur.value) setIndex(best)
}
function onStripScroll() {
  cancelAnimationFrame(tick)
  tick = requestAnimationFrame(syncFromScroll)
}

// Al cerrar el visor: la miniatura (o la diapositiva) de la foto vista, a la vista (el foco ya lo devolvió GDialog)
watch(isOpen, (on, was) => {
  if (on || !was) return
  nextTick(() => nextFrame(() => {
    if (strip.value) setAt(cur.value, { scroll: true })
    const t = thumbs.value[cur.value]
    if (t && !strip.value && typeof t.scrollIntoView === 'function') t.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }))
})

onMounted(() => { loc.value = langOf(rootEl.value, props.locale) })
watch(() => props.locale, (v) => { if (v) loc.value = v })
onBeforeUnmount(() => { clearTimeout(liveTimer); clearTimeout(steerTimer); if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(tick) })

// Avisos
watch(() => [props.title, props.photos, props.appearance, props.labels], () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      if (!(typeof props.title === 'string' && props.title.trim())) warn('title', 'falta title (aviso 1).')
      if (!N.value) warn('empty', 'photos vacío: la galería no se pinta y el visor no abre (aviso 5).')
      list.value.forEach((p) => {
        if (!(p.width > 0 && p.height > 0)) warn('size', 'una foto sin width/height (aviso 2).')
        if (!(typeof p.alt === 'string' && p.alt)) warn('alt', 'una foto sin alt: se pinta con alt="" (aviso 3).')
      })
      const issues = {}
      buildGroups(list.value, props.groups, base.value, issues)
      if (issues.unknown !== undefined) warn('group-unknown', `una foto con group="${issues.unknown}" que no está en groups: va a un espacio al final (aviso 4).`)
      if (issues.duplicate !== undefined) warn('group-dup', `value repetido en groups: "${issues.duplicate}" (aviso 4).`)
      if (strip.value && (!L.value.carousel || !L.value.slide)) warn('strip-labels', 'appearance="strip" sin labels.carousel o labels.slide: sin aria-roledescription (aviso 6).')
      if (props.appearance === 'inline') warn('inline', 'appearance="inline" está reservada: se pinta como grid (aviso 8).')
      else if (!['grid', 'strip'].includes(props.appearance)) warn(`appearance:${props.appearance}`, `appearance="${props.appearance}" no es válida (grid | strip): se pinta como grid.`)
      if (props.index !== undefined && N.value && (props.index < 0 || props.index >= N.value)) warn('index', `index=${props.index} fuera de rango: se toma el más cercano (aviso 9).`)
    }
  } catch {}
}, { immediate: true })

// ---------- Marcado ----------
const titleId = computed(() => `${base.value}-title`)
const total = computed(() => counted(label('total'), N.value, { count: num(N.value) }, fill))
const groupLink = (g) => counted(L.value.groupLink, g.items.length, { group: g.label, count: num(g.items.length) }, fill) || undefined
const sub = computed(() => Math.min(level.value + 1, 6))
const slideName = (i) => fill(label('position'), { index: num(i + 1), total: num(N.value) })
const classes = computed(() => ['g-gallery', `g-gallery--appearance-${strip.value ? 'strip' : 'grid'}`, { 'g-gallery--grouped': Boolean(spaces.value) }])
const thumbAttrs = (p, i) => ({
  href: p.src,
  'aria-haspopup': 'dialog',
  class: ['g-gallery__thumb', { 'is-current': i === cur.value, 'is-broken': broken.value.has(i) }]
})
const imgAttrs = (p, i) => ({
  class: 'g-gallery__img',
  src: p.thumb || p.src,
  srcset: (p.thumb ? p.thumbSrcset : p.thumbSrcset || p.srcset) || undefined,
  sizes: (p.thumb ? p.thumbSizes : p.thumbSizes || p.sizes) || undefined,
  width: p.width,
  height: p.height,
  alt: typeof p.alt === 'string' ? p.alt : '',
  loading: lazy(i),
  decoding: 'async'
})
const keyOf = (p, i) => (p.id !== undefined && p.id !== null ? p.id : i)
</script>

<template>
  <section v-if="N" ref="rootEl" :class="classes" :aria-labelledby="titleId">
    <div class="g-gallery__head">
      <component :is="`h${level}`" :id="titleId" class="g-gallery__title" dir="auto">{{ title }}</component>
      <p class="g-gallery__total">{{ total }}</p>
      <div v-if="strip" class="g-gallery__strip-nav">
        <GBtn class="g-gallery__prev" variant="ghost" color="neutral" icon :aria-label="label('prev')" :aria-disabled="cur === 0 ? 'true' : undefined" @click="step(-1)"><GIcon name="chevron-left" class="g-icon--flip-rtl" /></GBtn>
        <p class="g-gallery__strip-count" aria-hidden="true">{{ num(cur + 1) }} / {{ num(N) }}</p>
        <GBtn class="g-gallery__next" variant="ghost" color="neutral" icon :aria-label="label('next')" :aria-disabled="cur === N - 1 ? 'true' : undefined" @click="step(1)"><GIcon name="chevron-right" class="g-icon--flip-rtl" /></GBtn>
      </div>
    </div>

    <template v-if="strip">
      <div
        ref="stripEl"
        class="g-gallery__strip"
        :aria-roledescription="L.carousel && L.slide ? L.carousel : undefined"
        :aria-labelledby="titleId"
        tabindex="-1"
        @keydown="onStripKeydown"
        @scroll.passive="onStripScroll"
      >
        <div
          v-for="(p, i) in list"
          :key="keyOf(p, i)"
          :class="['g-gallery__slide', { 'is-current': i === cur }]"
          role="group"
          :aria-roledescription="L.carousel && L.slide ? L.slide : undefined"
          :aria-label="slideName(i)"
        >
          <a :ref="setThumb(i)" v-bind="thumbAttrs(p, i)" :tabindex="i === cur ? 0 : -1" @click="onThumbClick($event, i)">
            <img v-bind="imgAttrs(p, i)" @error="onThumbError(i)">
            <GIcon v-if="broken.has(i)" name="image" />
          </a>
          <p v-if="p.caption" class="g-gallery__caption" dir="auto">{{ p.caption }}</p>
        </div>
      </div>
      <p class="g-gallery__live" aria-live="polite" aria-atomic="true">{{ liveText }}</p>
    </template>

    <template v-else-if="spaces">
      <nav class="g-gallery__index" :aria-label="label('groups')">
        <a v-for="g in spaces.list" :key="g.id" class="g-gallery__index-link" :href="`#${g.id}`" :aria-label="groupLink(g)" dir="auto">{{ g.label }} <span aria-hidden="true">{{ num(g.items.length) }}</span></a>
      </nav>
      <div v-for="g in spaces.list" :id="g.id" :key="g.id" class="g-gallery__group" role="group" :aria-labelledby="`${g.id}-title`">
        <component :is="`h${sub}`" :id="`${g.id}-title`" class="g-gallery__group-title" dir="auto">{{ g.label }}</component>
        <ul class="g-gallery__grid" role="list">
          <li v-for="i in g.items" :key="keyOf(list[i], i)" class="g-gallery__item">
            <a :ref="setThumb(i)" v-bind="thumbAttrs(list[i], i)" @click="onThumbClick($event, i)">
              <img v-bind="imgAttrs(list[i], i)" @error="onThumbError(i)">
              <GIcon v-if="broken.has(i)" name="image" />
            </a>
          </li>
        </ul>
      </div>
    </template>

    <ul v-else class="g-gallery__grid" role="list">
      <li v-for="(p, i) in list" :key="keyOf(p, i)" class="g-gallery__item">
        <a :ref="setThumb(i)" v-bind="thumbAttrs(p, i)" @click="onThumbClick($event, i)">
          <img v-bind="imgAttrs(p, i)" @error="onThumbError(i)">
          <GIcon v-if="broken.has(i)" name="image" />
        </a>
      </li>
    </ul>

    <GGalleryViewer
      :model-value="isOpen"
      :photos="list"
      :groups="groups"
      :index="cur"
      :title="title"
      :zoom="zoom"
      :zone="viewerZone"
      :from="fromEl"
      :labels="labels"
      :locale="loc"
      :id="`${base}-viewer`"
      @update:index="setIndex"
      @update:model-value="setOpen"
    />
  </section>
</template>
