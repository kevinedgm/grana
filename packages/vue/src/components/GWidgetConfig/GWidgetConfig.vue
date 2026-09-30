<script setup>
// GWidgetConfig · carcasa del panel de configuración de un widget (dueño: bruno)
// Contrato: design/contracts/widget-config.md · Estructura: design/lab/widget/r02/ · Estilo: GWidgetConfig.css (coco)
// Se construye sobre GDialog (hoja lateral). Los campos de cada pestaña son de la aplicación, que también valida.
import { computed, nextTick, ref, useAttrs, useId, useSlots, watch } from 'vue'
import GDialog from '../GDialog/GDialog.vue'
import { oneOf } from '../../utils/oneOf.js'
import { fill } from '../../utils/template.js'

defineOptions({ name: 'GWidgetConfig', inheritAttrs: false })

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: undefined },
  description: { type: String, default: undefined },
  tabs: { type: Array, default: () => [] },
  tab: { type: String, default: undefined },
  errors: { type: Array, default: () => [] },
  dirty: Boolean,
  resettable: Boolean,
  applying: Boolean,
  size: { type: String, default: 'sm', validator: oneOf(['sm', 'md', 'lg']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  labels: { type: Object, default: () => ({}) },
  id: { type: String, default: undefined }
})
const emit = defineEmits(['update:modelValue', 'update:tab', 'apply', 'reset', 'cancel', 'open', 'closed'])

const attrs = useAttrs()
const slots = useSlots()
const uid = useId()
const rootId = computed(() => props.id || `g-widget-config-${uid}`)
const formId = computed(() => `${rootId.value}-form`)
const L = computed(() => props.labels || {})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warned = new Set()
const warnOnce = (key, msg) => {
  if (!isDev || warned.has(key)) return
  warned.add(key)
  console.warn(`[Grana] <GWidgetConfig> ${msg}`)
}
if (!props.title && !attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('title', 'necesita `title` (nombre accesible de la hoja).')
for (const key of ['apply', 'cancel', 'close']) {
  if (!props.labels?.[key]) warnOnce(`label-${key}`, `necesita labels.${key} (sin valor por defecto: los textos los pone la aplicación).`)
}
if (props.resettable && !props.labels?.reset) warnOnce('reset', 'con `resettable` necesita labels.reset; sin él no se muestra el botón.')

// ---------- Pestañas ----------
const tabList = computed(() => (props.tabs || []).filter((t) => t && t.id !== undefined && t.label))
const showTabs = computed(() => tabList.value.length > 1)
if (tabList.value.length > 1 && !props.labels?.tabs) warnOnce('tabs', 'con dos o más pestañas necesita labels.tabs (nombre de la lista de pestañas).')

const active = ref(props.tab ?? tabList.value[0]?.id)
watch(() => props.tab, (v) => { if (v !== undefined) active.value = v })
const currentTab = computed(() => (tabList.value.some((t) => t.id === active.value) ? active.value : tabList.value[0]?.id))
function selectTab(id, focus = false) {
  if (id !== active.value) {
    active.value = id
    emit('update:tab', id)
  }
  if (focus) nextTick(() => document.getElementById(tabId(id))?.focus())
}
const tabId = (id) => `${rootId.value}-t-${id}`
const panelId = (id) => `${rootId.value}-p-${id}`
function onTabKeydown(event, index) {
  const last = tabList.value.length - 1
  const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: last }[event.key]
  if (target === undefined) return
  event.preventDefault()
  const i = (target + last + 1) % (last + 1)
  selectTab(tabList.value[i].id, true)
}

// ---------- Errores ----------
const errorList = computed(() => (props.errors || []).filter((e) => e && e.message))
const errorsOf = (tabIdValue) => errorList.value.filter((e) => e.tab === tabIdValue)
const summaryEl = ref(null)
let wantSummaryFocus = false
function focusSummary() {
  if (wantSummaryFocus && errorList.value.length && summaryEl.value) {
    wantSummaryFocus = false
    summaryEl.value.focus()
  }
}
watch(errorList, () => nextTick(focusSummary), { flush: 'post' })
function goToError(error) {
  if (error.tab !== undefined && tabList.value.some((t) => t.id === error.tab)) selectTab(error.tab)
  if (error.field) nextTick(() => document.getElementById(error.field)?.focus())
}

// ---------- Cerrar, descartar y aplicar ----------
const confirming = ref(false)
const cancelBtn = ref(null)
const keepBtn = ref(null)
watch(() => props.modelValue, (open) => {
  confirming.value = false
  if (!open) return
  // Al abrir, siempre la primera pestaña (o la del primer error); si la aplicación controla `tab`, se le pide el cambio
  const first = errorList.value[0]?.tab ?? tabList.value[0]?.id
  active.value = first
  if (props.tab !== undefined && props.tab !== first && first !== undefined) emit('update:tab', first)
}, { flush: 'pre' })

function closeNow() {
  confirming.value = false
  emit('cancel')
  emit('update:modelValue', false)
}
function askClose() {
  if (!props.dirty) { closeNow(); return }
  confirming.value = true
  nextTick(() => keepBtn.value?.focus())
}
function onDismiss(event) {
  event.preventDefault()
  askClose()
}
function keepEditing() {
  confirming.value = false
  nextTick(() => cancelBtn.value?.focus())
}
function onSubmit() {
  if (props.applying) return
  wantSummaryFocus = true
  emit('apply')
  nextTick(() => nextTick(focusSummary))
}
function onReset() {
  emit('reset')
}

// ---------- Anuncios ----------
const live = ref('')
const announce = (text) => {
  live.value = ''
  nextTick(() => { live.value = text ?? '' })
}
defineExpose({ announce })

const classes = computed(() => ['g-widget-config', `g-widget-config--density-${props.density}`, { 'is-applying': props.applying }])
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
    :loading="applying"
    placement="end"
    :close-label="L.close"
    @dismiss="onDismiss"
    @update:model-value="emit('update:modelValue', $event)"
    @open="emit('open')"
    @closed="emit('closed')"
  >
    <form :id="formId" class="g-widget-config__form" novalidate @submit.prevent="onSubmit">
      <div class="g-widget-config__sr" role="status" aria-live="polite">{{ live }}</div>

      <div v-if="slots.preview" class="g-widget-config__preview" aria-hidden="true" inert="">
        <slot name="preview" />
      </div>

      <div v-if="errorList.length" ref="summaryEl" class="g-widget-config__summary" role="alert" tabindex="-1">
        <b>{{ fill(L.errorSummary, { count: errorList.length }) }}</b>
        <ul>
          <li v-for="(e, i) in errorList" :key="i">
            <a :href="e.field ? `#${e.field}` : '#'" @click.prevent="goToError(e)">{{ e.message }}</a>
          </li>
        </ul>
      </div>

      <template v-if="showTabs">
        <div class="g-widget-config__tabs" role="tablist" :aria-label="L.tabs">
          <button
            v-for="(t, i) in tabList"
            :id="tabId(t.id)"
            :key="t.id"
            role="tab"
            type="button"
            :aria-controls="panelId(t.id)"
            :aria-selected="currentTab === t.id ? 'true' : 'false'"
            :tabindex="currentTab === t.id ? 0 : -1"
            :autofocus="i === 0 ? true : undefined"
            @click="selectTab(t.id)"
            @keydown="onTabKeydown($event, i)"
          >{{ t.label }}<span v-if="errorsOf(t.id).length" class="g-widget-config__mark">{{ fill(L.errorCount, { count: errorsOf(t.id).length }) }}</span></button>
        </div>
        <div
          v-for="t in tabList"
          :id="panelId(t.id)"
          :key="t.id"
          class="g-widget-config__panel"
          role="tabpanel"
          :aria-labelledby="tabId(t.id)"
          tabindex="0"
          :hidden="currentTab !== t.id ? true : undefined"
        >
          <slot :name="`tab-${t.id}`" :errors="errorsOf(t.id)" />
        </div>
      </template>
      <template v-else>
        <slot name="default" :errors="errorList">
          <slot v-if="tabList[0]" :name="`tab-${tabList[0].id}`" :errors="errorsOf(tabList[0].id)" />
        </slot>
      </template>
    </form>

    <template #footer>
      <button v-if="resettable && L.reset" class="g-widget-config__btn g-widget-config__btn--reset" type="button" @click="onReset">{{ L.reset }}</button>
      <slot name="footer-start" />
      <span v-if="confirming" class="g-widget-config__confirm" role="alert">
        <span>{{ L.discardTitle }}</span>
        <button ref="keepBtn" class="g-widget-config__btn" type="button" @click="keepEditing">{{ L.keepEditing }}</button>
        <button class="g-widget-config__btn" type="button" @click="closeNow">{{ L.discard }}</button>
      </span>
      <template v-else>
        <button ref="cancelBtn" class="g-widget-config__btn" type="button" @click="askClose">{{ L.cancel }}</button>
        <button
          class="g-widget-config__btn g-widget-config__btn--primary"
          type="submit"
          :form="formId"
          :aria-disabled="applying ? 'true' : undefined"
        >{{ L.apply }}</button>
      </template>
    </template>
  </GDialog>
</template>
