<script setup>
// GWidgetGallery · galería para añadir widgets a un panel (dueño: bruno)
// Contrato: design/contracts/widget-gallery.md · Estructura: design/lab/widget/r02/ · Estilo: GWidgetGallery.css (coco)
// Se construye sobre GDialog (hoja lateral). No crea widgets ni guarda el layout: emite `add`.
import { computed, nextTick, reactive, ref, useAttrs, useId, useSlots, watch } from 'vue'
import GDialog from '../GDialog/GDialog.vue'
import { oneOf } from '../../utils/oneOf.js'
import GIcon from '../GIcon/GIcon.vue'
import { fill } from '../../utils/template.js'

defineOptions({ name: 'GWidgetGallery', inheritAttrs: false })

const props = defineProps({
  modelValue: Boolean,
  items: { type: Array, default: () => [] },
  added: { type: Object, default: () => ({}) },
  sizes: { type: Array, default: undefined },
  categories: { type: Array, default: undefined },
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  size: { type: String, default: 'sm', validator: oneOf(['sm', 'md', 'lg']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  labels: { type: Object, default: () => ({}) },
  id: { type: String, default: undefined }
})
const emit = defineEmits(['update:modelValue', 'add', 'search', 'open', 'closed'])

const attrs = useAttrs()
const slots = useSlots()
const uid = useId()
const rootId = computed(() => props.id || `g-widget-gallery-${uid}`)
const L = computed(() => props.labels || {})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
const warnOnce = (key, msg) => {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana] <GWidgetGallery> ${msg}`)
}
if (!props.title && !attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('title', 'necesita `title` (nombre accesible de la hoja).')
for (const key of ['search', 'add', 'results', 'close']) {
  if (!props.labels?.[key]) warnOnce(`label-${key}`, `necesita labels.${key} (sin valor por defecto: los textos los pone la aplicación).`)
}

// ---------- Datos ----------
const validItems = computed(() => {
  const seen = new Set()
  const out = []
  for (const it of props.items || []) {
    if (!it || it.id === undefined || it.id === null || !it.title) {
      warnOnce('item', 'ignora un elemento de `items` sin `id` o sin `title`.')
      continue
    }
    if (seen.has(it.id)) {
      warnOnce('dup', `hay más de un elemento con el mismo id («${it.id}»); se usa el primero.`)
      continue
    }
    seen.add(it.id)
    out.push(it)
  }
  return out
})
const categoryList = computed(() => {
  if (props.categories) return props.categories.filter((c) => c && c.id !== undefined)
  const ids = [...new Set(validItems.value.map((i) => i.category).filter(Boolean))]
  return ids.map((id) => ({ id, label: id }))
})
const sizeLabel = (id) => props.sizes?.find((s) => s.id === id)?.label ?? String(id)
const sizesOf = (item) => {
  const catalog = (props.sizes || []).map((s) => s.id)
  const list = Array.isArray(item.sizes) ? item.sizes : catalog
  return list.filter((id) => !catalog.length || catalog.includes(id))
}

// ---------- Filtro ----------
const query = ref('')
const category = ref('all')
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const catLabel = (item) => categoryList.value.find((c) => c.id === item.category)?.label ?? item.category ?? ''
const filtered = computed(() => {
  const q = norm(query.value.trim())
  return validItems.value.filter((it) => {
    if (category.value !== 'all' && it.category !== category.value) return false
    if (!q) return true
    return norm(`${it.title} ${it.description ?? ''} ${catLabel(it)}`).includes(q)
  })
})
watch([query, category], () => {
  emit('search', { query: query.value, category: category.value, count: filtered.value.length })
}, { flush: 'post' })

// Tamaño elegido por tarjeta
const chosen = reactive({})
const sizeOf = (item) => {
  const list = sizesOf(item)
  return chosen[item.id] && list.includes(chosen[item.id]) ? chosen[item.id] : list[0]
}

// ---------- Anuncios (dentro de la hoja: fuera de un diálogo modal el resto de la página es inerte) ----------
const live = ref('')
const announce = (text) => {
  live.value = ''
  nextTick(() => { live.value = text ?? '' })
}

const count = (item) => Number(props.added?.[item.id]) || 0
const isBlocked = (item) => Boolean(item.unique) && count(item) > 0

function onAdd(item) {
  if (isBlocked(item)) {
    if (L.value.alreadyAdded) announce(fill(L.value.alreadyAdded, { title: item.title }))
    return
  }
  emit('add', { id: item.id, size: sizeOf(item) })
  if (L.value.addedToPanel) announce(fill(L.value.addedToPanel, { title: item.title }))
}

defineExpose({ announce })

const classes = computed(() => ['g-widget-gallery', `g-widget-gallery--density-${props.density}`])
const cardId = (item, part) => `${rootId.value}-${String(item.id)}-${part}`
</script>

<template>
  <GDialog
    v-bind="attrs"
    :id="rootId"
    :class="classes"
    :model-value="modelValue"
    :title="title"
    :description="description"
    :size="size"
    :density="density"
    placement="end"
    :close-label="L.close"
    @update:model-value="emit('update:modelValue', $event)"
    @open="emit('open')"
    @closed="emit('closed')"
  >
    <div class="g-widget-gallery__search">
      <label :for="`${rootId}-q`">{{ L.search }}</label>
      <input :id="`${rootId}-q`" v-model="query" type="search" autocomplete="off" autofocus :aria-controls="`${rootId}-list`">
    </div>

    <fieldset v-if="categoryList.length" class="g-widget-gallery__cats">
      <legend class="g-widget-gallery__sr">{{ L.categories }}</legend>
      <label class="g-widget-gallery__cat">
        <input type="radio" :name="`${rootId}-cat`" value="all" :checked="category === 'all'" @change="category = 'all'">
        <span><GIcon class="g-widget-gallery__cat-mark" name="check" />{{ L.all }}</span>
      </label>
      <label v-for="c in categoryList" :key="c.id" class="g-widget-gallery__cat">
        <input type="radio" :name="`${rootId}-cat`" :value="c.id" :checked="category === c.id" @change="category = c.id">
        <span><GIcon class="g-widget-gallery__cat-mark" name="check" />{{ c.label }}</span>
      </label>
    </fieldset>

    <p class="g-widget-gallery__status" role="status">{{ fill(L.results, { count: filtered.length }) }}</p>

    <ul :id="`${rootId}-list`" class="g-widget-gallery__list" :aria-label="L.list">
      <li v-for="item in filtered" :key="item.id">
        <article
          class="g-widget-gallery__card"
          :class="{ 'is-added': count(item) > 0 }"
          :aria-labelledby="cardId(item, 't')"
          :aria-describedby="cardId(item, 'd')"
        >
          <slot name="card" :item="item" :added="count(item)" :size="sizeOf(item)">
            <div>
              <span v-if="item.category" class="g-widget-gallery__category">{{ catLabel(item) }}</span>
              <span v-if="count(item) > 0" class="g-widget-gallery__tag">{{ item.unique ? L.added : fill(L.addedCount, { count: count(item) }) }}</span>
            </div>
            <h3 :id="cardId(item, 't')">{{ item.title }}</h3>
            <p :id="cardId(item, 'd')">{{ item.description }}</p>
            <div v-if="slots.preview" class="g-widget-gallery__preview" aria-hidden="true" inert="">
              <slot name="preview" :item="item" :size="sizeOf(item)" />
            </div>
          </slot>
          <div class="g-widget-gallery__row">
            <template v-if="sizesOf(item).length > 1">
              <label :for="cardId(item, 's')">{{ L.size }}</label>
              <select :id="cardId(item, 's')" :value="sizeOf(item)" @change="chosen[item.id] = $event.target.value">
                <option v-for="s in sizesOf(item)" :key="s" :value="s">{{ sizeLabel(s) }}</option>
              </select>
            </template>
            <button
              class="g-widget-gallery__btn g-widget-gallery__btn--primary"
              type="button"
              :aria-describedby="cardId(item, 'd')"
              :aria-disabled="isBlocked(item) ? 'true' : undefined"
              @click="onAdd(item)"
            >{{ isBlocked(item) ? L.addedShort : L.add }}<span class="g-widget-gallery__sr"> {{ item.title }}</span></button>
          </div>
        </article>
      </li>
    </ul>

    <p v-if="!filtered.length" class="g-widget-gallery__empty">
      <slot name="empty" :query="query">{{ L.empty }}</slot>
    </p>
    <div class="g-widget-gallery__sr" role="status" aria-live="polite">{{ live }}</div>

    <template v-if="L.close || slots.footer" #footer="{ close }">
      <slot name="footer" :close="close">
        <button v-if="L.close" class="g-widget-gallery__btn" type="button" @click="close">{{ L.close }}</button>
      </slot>
    </template>
  </GDialog>
</template>
