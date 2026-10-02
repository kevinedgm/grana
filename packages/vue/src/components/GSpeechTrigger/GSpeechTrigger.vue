<script setup>
// GSpeechTrigger · disparador de la captura de voz: dictado a un campo o conversación (dueño: bruno)
// Contrato: design/contracts/speech.md §8 y §13.1 · Estructura: design/lab/speech/r01/ · Estilo: GSpeechTrigger.css (coco)
// Hermano del campo, inmediatamente después (#212); raíz <div> con la nota en <p> (#229). No lleva la sesión: si se
// desmonta, la sesión sigue (vive en el gestor). Con otra sesión activa no crea otra: aria-disabled, descripción, anuncio
// y foco a la pill visible. En el servidor pinta su botón en idle sin leer el DOM.
import { computed, inject, onMounted, ref, toRaw, useId } from 'vue'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { oneOf } from '../../utils/oneOf.js'
import { FILLED, INTERNAL, STATE_ICON, isCapturing, isProblem, speechKey } from '../GSpeechHost/speech.js'
import { elOf, prefix } from '../GSpeechHost/view.js'

defineOptions({ name: 'GSpeechTrigger' })

const props = defineProps({
  mode: { type: String, default: 'dictation', validator: oneOf(['dictation', 'conversation']) },
  for: { type: String, default: undefined },
  targetLabel: { type: String, default: undefined },
  size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
  density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
  disabled: Boolean,
  // Gestor; por defecto, el provisto con app.use(speech)
  speech: { type: Object, default: undefined }
})

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const warn = (msg) => { if (isDev) console.warn(`[Grana Speech] ${msg}`) }
const injected = inject(speechKey, null)
const manager = toRaw(props.speech) || injected
const api = manager && manager[INTERNAL] ? manager[INTERNAL] : null
if (!api) warn('<GSpeechTrigger> sin prop `speech` y sin gestor provisto (app.use(createSpeech(…))): el botón no inicia nada.')
const S = api ? api.state : null
const ui = api ? api.ui : null
const t = (path, vars) => (api ? api.t(path, vars) : '')

const uid = useId()
const base = `g-speech-trigger-${uid}`
const busyId = `${base}-busy`
const noteId = `${base}-note`
const btn = ref(null)
const label = ref(props.targetLabel || '')
const dictation = computed(() => props.mode === 'dictation')

// Campos admitidos (§8.1): textarea e input text/search/url/tel (password no, por privacidad; email/number no admiten setRangeText)
const TYPES = ['text', 'search', 'url', 'tel']
function field(report) {
  if (!props.for) {
    if (report) warn('<GSpeechTrigger> de dictado sin `for`: necesita el id del campo.')
    return null
  }
  const el = document.getElementById(props.for)
  if (!el) {
    if (report) warn(`<GSpeechTrigger for="${props.for}">: no existe ningún elemento con ese id.`)
    return null
  }
  const ok = el.localName === 'textarea' || (el.localName === 'input' && TYPES.includes(String(el.type || 'text').toLowerCase()))
  if (!ok) {
    if (report) warn(`<GSpeechTrigger for="${props.for}">: tipo de campo no admitido (solo textarea e input text, search, url o tel).`)
    return null
  }
  return el
}
function resolveLabel(el, report) {
  if (props.targetLabel) return props.targetLabel
  const l = el && el.labels && el.labels[0]
  const text = l ? l.textContent.replace(/\s+/g, ' ').trim() : ''
  if (!text && report) warn(`<GSpeechTrigger for="${props.for}">: no se pudo resolver el nombre del campo (usa targetLabel); {target} queda vacío.`)
  return text
}

// ¿La sesión activa es la de este disparador? Por modo (+ campo en dictado), así se reconoce al volver a la pestaña o paso
const own = computed(() => Boolean(S && S.status !== 'idle' && S.mode === props.mode && (props.mode === 'conversation' || (S.target && S.target.id === props.for))))
const busy = computed(() => Boolean(S && S.status !== 'idle' && !own.value))
const status = computed(() => (own.value ? S.status : 'idle'))
const icon = computed(() => (own.value ? STATE_ICON[S.status] : 'mic'))
const filled = computed(() => own.value && FILLED.includes(S.status))
const pressed = computed(() => (dictation.value ? String(own.value && S.status !== 'completed') : undefined))
const name = computed(() => (dictation.value ? t('trigger.dictate', { target: label.value }) : undefined))
const text = computed(() => (dictation.value ? '' : own.value ? t('trigger.view') : t('trigger.conversation')))
const busyText = computed(() => (busy.value ? t('trigger.busy') : ''))

// Nota (§8.6): provisional, fragmentos sin insertar con «Insertar» o «Dictado insertado» con «Deshacer dictado»
const note = computed(() => {
  if (!dictation.value || !S) return null
  if (own.value && ui.notInserted.length) return { kind: 'notInserted', text: t('note.notInserted', { count: ui.notInserted.length }), action: t('note.insert') }
  if (own.value && S.transcript && S.transcript.partial && S.transcript.partial.text) return { kind: 'partial', text: S.transcript.partial.text }
  if (props.for && ui.undo[props.for] && (!own.value || S.status === 'completed')) return { kind: 'inserted', text: t('note.inserted'), action: t('note.undo') }
  return null
})
const notePrefix = computed(() => (note.value && note.value.kind === 'partial' ? prefix(t('note.partialPrefix')) : ''))

const btnEl = () => elOf(btn.value)
async function press() {
  if (!api || props.disabled) return
  if (busy.value) {
    api.polite(t('announce.busy'))
    api.focusPill()
    return
  }
  const el = btnEl()
  if (!dictation.value) {
    if (own.value) { api.openPanel(el); return }
    api.setStarter(el)
    const ok = await manager.prepare()
    if (ok && S.status === 'ready') api.openPanel(el)
    return
  }
  if (!own.value) {
    const f = field(true)
    if (!f) return
    label.value = resolveLabel(f, true)
    api.setStarter(el)
    manager.start({ mode: 'dictation', target: { id: props.for, label: label.value } })
    return
  }
  const st = S.status
  if (st === 'requesting') manager.cancel()
  else if (isCapturing(st) || st === 'paused' || st === 'reconnecting') manager.finish()
  else if (isProblem(st)) manager.resume()
  else if (st === 'processing' || st === 'completed') api.openPanel(el)
}
function noteAction() {
  if (!note.value || !props.for) return
  if (note.value.kind === 'notInserted') manager.insertPending(props.for)
  else if (note.value.kind === 'inserted') manager.undoDictation(props.for)
}

onMounted(() => {
  if (!dictation.value) return
  if (!props.for) { warn('<GSpeechTrigger> de dictado sin `for`: necesita el id del campo.'); return }
  if (!props.targetLabel) label.value = resolveLabel(field(false), false)
})
</script>

<template>
  <div :class="['g-speech-trigger', `g-speech-trigger--mode-${mode}`, { 'is-busy': busy }]" :data-status="status">
    <GBtn
      v-if="dictation"
      ref="btn"
      icon
      class="g-speech-trigger__btn"
      variant="ghost"
      color="neutral"
      :size="size"
      :density="density"
      :disabled="disabled"
      :aria-label="name"
      :aria-pressed="pressed"
      :aria-disabled="busy ? 'true' : undefined"
      :aria-describedby="busy ? busyId : undefined"
      @click="press"
    ><GIcon :name="icon" :filled="filled" /></GBtn>
    <GBtn
      v-else
      ref="btn"
      class="g-speech-trigger__btn"
      variant="outline"
      color="neutral"
      :size="size"
      :density="density"
      :disabled="disabled"
      :aria-disabled="busy ? 'true' : undefined"
      :aria-describedby="busy ? busyId : undefined"
      @click="press"
    ><template #prepend><GIcon :name="icon" :filled="filled" /></template>{{ text }}</GBtn>
    <span :id="busyId" class="g-speech-trigger__busy" :hidden="busy ? undefined : true">{{ busyText }}</span>
    <p v-if="dictation" :id="noteId" :class="['g-speech-trigger__note', { 'is-partial': note && note.kind === 'partial' }]" :hidden="note ? undefined : true">
      <template v-if="note">
        <span v-if="note.kind === 'partial'" class="g-speech-trigger__sr">{{ notePrefix }}</span>
        <span class="g-speech-trigger__note-text">{{ note.text }}</span>
        <GBtn v-if="note.action" class="g-speech-trigger__note-action" size="sm" variant="outline" color="neutral" @click="noteAction">{{ note.action }}</GBtn>
      </template>
    </p>
  </div>
</template>
