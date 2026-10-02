<script setup>
// Panel de la captura de voz (INTERNO; dueño: bruno): diálogo no modal anclado a la pill visible, o contenido de la hoja móvil.
// Contrato: design/contracts/speech.md §6.4, §6.5, §9, §13.1 · Estilo: GSpeechHost.css (coco) · Marcado: design/lab/speech/estilo-banco.html
// Nada aquí anuncia: los anuncios van por los canales del anfitrión (§6.2). El texto confirmado no se reescribe si no cambió
// (lista con clave) y la lista se desplaza sola al final solo si ya estaba al final.
import { computed, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, watch } from 'vue'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'
import GSelect from '../GSelect/GSelect.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import GProgress from '../GProgress/GProgress.vue'
import { INTERNAL, SPEECH_TIMING, formatTime, isCapturing } from './speech.js'
import { elOf, peek, prefix, useSpeechView } from './view.js'

defineOptions({ name: 'GSpeechPanel', inheritAttrs: false })

const props = defineProps({
  speech: { type: Object, required: true },
  panelId: { type: String, required: true },
  hidden: Boolean,
  placeStyle: { type: Object, default: undefined }
})

const api = props.speech[INTERNAL]
const S = api.state
const ui = api.ui
const t = api.t
const v = useSpeechView(api)
const root = ref(null)
const title = ref(null)
const list = ref(null)
const wave = ref(null)
const confirmNo = ref(null)
const discardBtn = ref(null)
const consentBox = ref(null)

const titleId = computed(() => `${props.panelId}-title`)
const txTitleId = computed(() => `${props.panelId}-tx`)
const caps = computed(() => (S.status === 'idle' ? null : api.caps()))
const open = computed(() => !props.hidden && S.status !== 'idle')
const tt = (path, vars) => (open.value ? t(path, vars) : peek(api, path) || '')

const modeText = computed(() => {
  if (!open.value) return ''
  if (S.mode === 'dictation') return t('mode.dictation', { target: S.target ? S.target.label : '' })
  if (S.mode === 'conversation') return t('mode.conversation', { speakers: t(`expectedSpeakers.options.${S.expectedSpeakers}`) })
  return ''
})
const durationText = computed(() => (open.value && v.showTime.value ? prefix(t('duration')) : ''))

// Datos secundarios (§6.4 __sub): intento de reconexión, señal plana, pendientes
const subAttempt = computed(() => (open.value && S.status === 'reconnecting' && S.attempt ? t('attempt', { attempt: S.attempt }) : ''))
const subFlat = computed(() => (open.value && S.signal === 'flat' && S.capture === 'live' ? t('signalFlat') : ''))
const subPending = computed(() => {
  if (!open.value || !S.transcript || S.status === 'ready' || S.status === 'requesting' || S.status === 'completed') return ''
  return S.pending > 0 ? t('pending', { count: S.pending }) : t('pendingNone')
})
const hasSub = computed(() => Boolean(subAttempt.value || subFlat.value || subPending.value))

// Privacidad (§5.3): ubicación + qué pasa con el audio; «eliminado» solo con confirmación del adaptador
const privacyIcon = computed(() => (caps.value && caps.value.location === 'remote' ? 'globe' : 'lock'))
const privacyText = computed(() => {
  if (!open.value || !caps.value) return ''
  const c = caps.value
  let audio
  if (S.result && c.storesAudio !== 'none') audio = S.result.audioDeleted ? t('audio.deleted') : t('audio.notConfirmed')
  else audio = t(`audio.${c.storesAudio}`)
  return [t(`privacy.${c.location}`), audio].filter(Boolean).join(' ')
})

const showActivity = computed(() => open.value && (isCapturing(S.status) || S.status === 'reconnecting' || S.status === 'paused'))
const waveBars = computed(() => (ui.reducedMotion ? 5 : 32))

// Preparación (ready): participantes previstos, sin diarización, consentimiento
const speakerOptions = computed(() => (open.value && S.status === 'ready'
  ? [1, 2, 'many'].map((n) => ({ value: n, label: t(`expectedSpeakers.options.${n}`) }))
  : []))
const expected = computed({ get: () => S.expectedSpeakers, set: (val) => props.speech.setExpectedSpeakers(val) })
const consent = computed({ get: () => S.consent, set: (val) => props.speech.setConsent(val) })

// Error fatal y fallos no fatales
const fatal = computed(() => (open.value && v.problem.value && S.error ? v.errorText.value : null))
const issues = computed(() => (open.value ? S.issues : []))
function issueText(i) {
  const range = `${formatTime(i.t0)}–${formatTime(i.t1)}`
  return [t(`errors.${i.kind}.what`, { range, at: formatTime(i.t0) }), i.audio && i.audio !== 'none' ? t(`audioFate.${i.audio}`) : ''].filter(Boolean).join(' ')
}
const canRetry = (id) => Boolean(id) && S.issues.some((i) => i.segmentId === id && i.retryable) && !ui.retrying.includes(id)

// Progreso del procesamiento final (§2.3)
const progress = computed(() => {
  if (S.status !== 'processing') return null
  const total = Math.max(1, ui.procTotal)
  return Math.round(((total - Math.min(total, S.pending)) / total) * 100)
})

// Acciones según estado (§6.4)
const recoverable = computed(() => v.recoverable.value)

// Transcript
const segments = computed(() => (open.value && S.transcript ? S.transcript.segments : []))
const partial = computed(() => (open.value && S.transcript ? S.transcript.partial : null))
const isConversation = computed(() => S.mode === 'conversation')
function speakerLabel(id) {
  if (!id) return t('unassigned')
  // Letra neutra por orden de aparición (A, B, C…); un hablante que aún no tiene confirmado toma la siguiente
  const known = S.transcript ? S.transcript.speakers : []
  let i = known.findIndex((s) => s.id === id)
  if (i < 0) i = known.length
  const letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[i] || String(i + 1)
  return t('speaker', { letter })
}
const partialTime = computed(() => {
  const segs = segments.value
  return formatTime(segs.length ? segs[segs.length - 1].t1 : 0)
})
const datetime = (ms) => `PT${Math.floor((ms || 0) / 1000)}S`

// Acciones
const close = () => api.closePanel()
const begin = () => {
  if (api.opts.requireConsent && !S.consent) {
    api.setConsentError(true)
    const host = elOf(consentBox.value)
    const box = host && (host.localName === 'input' ? host : host.querySelector('input'))
    if (box) box.focus()
    return
  }
  props.speech.begin()
}
const cancel = () => { api.closePanel(); props.speech.cancel() }
const pause = () => props.speech.pause()
const resume = () => props.speech.resume()
const finish = () => props.speech.finish()
async function askDiscard() {
  ui.confirmDiscard = true
  await nextTick()
  const el = elOf(confirmNo.value)
  if (el) el.focus()
}
async function cancelDiscard() {
  ui.confirmDiscard = false
  await nextTick()
  const el = elOf(discardBtn.value)
  if (el) el.focus()
}
const confirmDiscard = () => { api.closePanel({ focus: false }); api.discard() }
const dismiss = () => { api.closePanel({ focus: false }); api.discard({ silent: true }) }
const closeSession = () => { api.closePanel({ focus: false }); api.close() }
const toggleActivity = () => api.setActivityHidden(!S.activityHidden)
const retry = (id) => props.speech.retrySegment(id)

// Esc en el panel: cierra el panel, nunca detiene ni descarta; no llega a GDialog (#143)
function onKeydown(event) {
  if (event.key !== 'Escape' || event.isComposing) return
  event.preventDefault()
  event.stopPropagation()
  api.closePanel()
}

// ---------- Onda: historial del nivel (32 barras) o 5 segmentos con movimiento reducido (≤ reducedMotionHz) ----------
const history = new Array(32).fill(0)
let lastPaint = 0
function paint(level, live) {
  const el = wave.value
  if (!el || props.hidden) return
  const bars = el.children
  const now = Date.now()
  if (ui.reducedMotion) {
    if (live && now - lastPaint < 1000 / SPEECH_TIMING.reducedMotionHz) return
    lastPaint = now
    for (let i = 0; i < bars.length; i++) {
      const on = live && level * bars.length > i + 0.3
      if (on) bars[i].setAttribute('data-on', '')
      else bars[i].removeAttribute('data-on')
      bars[i].style.removeProperty('--_speech-bar')
    }
    return
  }
  history.push(live ? level : 0)
  history.shift()
  for (let i = 0; i < bars.length; i++) {
    bars[i].removeAttribute('data-on')
    bars[i].style.setProperty('--_speech-bar', history[i].toFixed(2))
  }
}
let off = null
onMounted(() => { off = props.speech.onLevel(paint) })

// ---------- Desplazamiento de la lista: al final solo si ya estaba al final ----------
let atBottom = true
onBeforeUpdate(() => {
  const el = list.value
  atBottom = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 24
})
onUpdated(() => {
  const el = list.value
  if (el && atBottom) el.scrollTop = el.scrollHeight
})
// El consentimiento marcado quita el error
watch(() => S.consent, (c) => { if (c) api.setConsentError(false) })
onBeforeUnmount(() => { if (off) off() })

defineExpose({
  root,
  focusTitle: () => { if (title.value) title.value.focus({ preventScroll: true }) }
})
</script>

<template>
  <div
    ref="root"
    :id="panelId"
    :class="['g-speech-panel', 'g-surface', 'g-surface--level-floating', { 'is-live': v.live.value, 'is-problem': v.problem.value }]"
    :data-status="v.status.value"
    role="dialog"
    :aria-labelledby="titleId"
    :hidden="open ? undefined : true"
    :style="placeStyle"
    @keydown="onKeydown"
  >
    <div class="g-speech-panel__head">
      <h2 :id="titleId" ref="title" class="g-speech-panel__title" tabindex="-1">{{ tt('region') }}</h2>
      <p class="g-speech-panel__mode">{{ modeText }}</p>
      <GBtn icon class="g-speech-panel__close" variant="ghost" color="neutral" size="sm" :aria-label="tt('closePanel')" @click="close"><GIcon name="x" /></GBtn>
    </div>
    <div class="g-speech-panel__status">
      <span :class="['g-speech-panel__status-icon', { 'is-spinning': v.spinning.value }]" aria-hidden="true"><GIcon :name="v.icon.value" :filled="v.filled.value" /></span>
      <span class="g-speech-panel__status-text">{{ open ? v.long.value : '' }}</span>
      <span class="g-speech-panel__time" role="timer" :hidden="v.showTime.value ? undefined : true"><span class="g-speech-panel__sr">{{ durationText }}</span>{{ v.time.value }}</span>
    </div>
    <div v-if="hasSub" class="g-speech-panel__sub">
      <p v-if="subAttempt">{{ subAttempt }}</p>
      <p v-if="subFlat" class="is-warning">{{ subFlat }}</p>
      <p v-if="subPending">{{ subPending }}</p>
    </div>
    <div class="g-speech-panel__privacy"><GIcon :name="privacyIcon" /><p>{{ privacyText }}</p></div>
    <div v-if="showActivity" class="g-speech-panel__activity">
      <span ref="wave" class="g-speech-wave" aria-hidden="true" :hidden="S.activityHidden ? true : undefined"><i v-for="n in waveBars" :key="`${waveBars}-${n}`" class="g-speech-wave__bar" /></span>
      <GBtn size="sm" variant="ghost" color="neutral" :aria-pressed="String(S.activityHidden)" @click="toggleActivity">{{ t('actions.hideActivity') }}</GBtn>
    </div>
    <div v-if="open && S.status === 'ready'" class="g-speech-panel__setup">
      <GSelect :id="`${panelId}-speakers`" v-model="expected" :label="t('expectedSpeakers.label')" :options="speakerOptions" />
      <p v-if="caps && !caps.diarization">{{ t('noDiarization') }}</p>
      <GCheckbox
        v-if="api.opts.requireConsent"
        :id="`${panelId}-consent`"
        ref="consentBox"
        v-model="consent"
        :label="t('consent.label')"
        :error="ui.consentError && !S.consent ? t('consent.required') : undefined"
      />
    </div>
    <div v-if="fatal || issues.length" class="g-speech-panel__error">
      <div v-if="fatal">
        <p><GIcon name="circle-alert" />{{ fatal.title }}</p>
        <p v-if="fatal.text">{{ fatal.text }}</p>
      </div>
      <div v-for="i in issues" :key="`${i.segmentId}-${i.t0}`" class="g-speech-panel__issue">
        <GIcon name="triangle-alert" /><span>{{ issueText(i) }}</span>
        <GBtn v-if="canRetry(i.segmentId)" size="sm" variant="outline" color="neutral" @click="retry(i.segmentId)">{{ t('actions.retrySegment') }}</GBtn>
      </div>
    </div>
    <div v-if="progress !== null" class="g-speech-panel__progress"><GProgress :value="progress" :label="t('progress')" color="neutral" /></div>
    <div v-if="open && ui.confirmDiscard" class="g-speech-panel__confirm">
      <p>{{ t('actions.discardAsk') }}</p>
      <GBtn ref="confirmNo" size="md" variant="outline" color="neutral" @click="cancelDiscard">{{ t('actions.cancel') }}</GBtn>
      <GBtn size="md" variant="solid" color="danger" @click="confirmDiscard">{{ t('actions.discardConfirm') }}</GBtn>
    </div>
    <div v-else-if="open && S.status !== 'processing'" class="g-speech-panel__controls">
      <template v-if="S.status === 'requesting'">
        <GBtn size="md" variant="outline" color="neutral" @click="cancel">{{ t('actions.cancel') }}</GBtn>
      </template>
      <template v-else-if="S.status === 'ready'">
        <GBtn size="md" @click="begin"><template #prepend><GIcon name="mic" /></template>{{ t('actions.start') }}</GBtn>
        <GBtn size="md" variant="outline" color="neutral" @click="cancel">{{ t('actions.cancel') }}</GBtn>
      </template>
      <template v-else-if="S.status === 'completed'">
        <GBtn size="md" @click="closeSession"><template #prepend><GIcon name="circle-check" /></template>{{ t('actions.closeSession') }}</GBtn>
        <GBtn ref="discardBtn" size="md" variant="ghost" color="neutral" @click="askDiscard">{{ t('actions.discard') }}</GBtn>
      </template>
      <template v-else-if="v.problem.value">
        <template v-if="recoverable">
          <GBtn v-if="v.captured.value" size="md" @click="resume"><template #prepend><GIcon name="mic" /></template>{{ t('actions.resume') }}</GBtn>
          <GBtn v-else size="md" @click="resume"><template #prepend><GIcon name="rotate-ccw" /></template>{{ t('actions.retry') }}</GBtn>
        </template>
        <template v-if="v.captured.value">
          <GBtn size="md" variant="outline" color="neutral" @click="finish"><template #prepend><GIcon name="square" filled /></template>{{ t('actions.finish') }}</GBtn>
          <GBtn ref="discardBtn" size="md" variant="ghost" color="neutral" @click="askDiscard">{{ t('actions.discard') }}</GBtn>
        </template>
        <GBtn v-else size="md" variant="ghost" color="neutral" @click="dismiss">{{ t('actions.dismiss') }}</GBtn>
      </template>
      <template v-else>
        <GBtn v-if="S.status === 'paused'" size="md" variant="outline" color="neutral" @click="resume"><template #prepend><GIcon name="mic" /></template>{{ t('actions.resume') }}</GBtn>
        <GBtn v-else-if="v.live.value" size="md" variant="outline" color="neutral" @click="pause"><template #prepend><GIcon name="pause" /></template>{{ t('actions.pause') }}</GBtn>
        <GBtn size="md" @click="finish"><template #prepend><GIcon name="square" filled /></template>{{ t('actions.finish') }}</GBtn>
        <GBtn ref="discardBtn" size="md" variant="ghost" color="neutral" @click="askDiscard">{{ t('actions.discard') }}</GBtn>
      </template>
    </div>
    <section class="g-speech-panel__transcript">
      <h3 :id="txTitleId">{{ tt('transcript.title') }}</h3>
      <p v-if="!segments.length && !partial">{{ tt('transcript.empty') }}</p>
      <ol v-else ref="list" class="g-speech-transcript" :aria-labelledby="txTitleId" tabindex="0">
        <li v-for="s in segments" :key="s.id" :class="['g-speech-segment', { 'is-failed': s.failed }]">
          <template v-if="s.failed">
            <div class="g-speech-segment__meta">
              <time class="g-speech-segment__time" :datetime="datetime(s.t0)">{{ formatTime(s.t0) }}–{{ formatTime(s.t1) }}</time>
              <span class="g-speech-segment__flag"><GIcon name="triangle-alert" />{{ t('transcript.failed') }}</span>
            </div>
            <GBtn v-if="canRetry(s.id)" size="sm" variant="outline" color="neutral" @click="retry(s.id)">{{ t('actions.retrySegment') }}</GBtn>
            <p v-else-if="!ui.retrying.includes(s.id)" class="g-speech-segment__text">{{ t('transcript.failedLost') }}</p>
          </template>
          <template v-else>
            <div class="g-speech-segment__meta">
              <time class="g-speech-segment__time" :datetime="datetime(s.t0)">{{ formatTime(s.t0) }}</time>
              <span v-if="isConversation" class="g-speech-segment__speaker">{{ speakerLabel(s.engineSpeaker) }}</span>
            </div>
            <p class="g-speech-segment__text">{{ s.literal }}</p>
          </template>
        </li>
        <li v-if="partial" :key="`partial-${partial.id}`" class="g-speech-segment is-partial">
          <div class="g-speech-segment__meta">
            <time class="g-speech-segment__time" :datetime="datetime(segments.length ? segments[segments.length - 1].t1 : 0)">{{ partialTime }}</time>
            <span v-if="isConversation" class="g-speech-segment__speaker">{{ speakerLabel(partial.speaker) }}</span>
            <span class="g-speech-segment__flag">{{ t('transcript.partialFlag') }}</span>
          </div>
          <p class="g-speech-segment__text"><span class="g-speech-segment__sr">{{ prefix(t('transcript.partialPrefix')) }}</span>{{ partial.text }}</p>
        </li>
      </ol>
    </section>
  </div>
</template>
