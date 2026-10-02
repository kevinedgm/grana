<script setup>
// Pill de la captura de voz (INTERNA; dueño: bruno). La pintan GSpeechPill (colocada) y GSpeechHost (flotante de respaldo).
// Contrato: design/contracts/speech.md §7 y §13.1 · Estilo: GSpeechPill.css (coco) · Marcado: design/lab/speech/estilo-banco.html
// El nivel no es reactivo (§1.2): el medidor se pinta en el DOM desde onLevel, sin renders.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { INTERNAL, SPEECH_TIMING } from '../GSpeechHost/speech.js'
import { elOf, peek, prefix, suffix, useSpeechView } from '../GSpeechHost/view.js'

defineOptions({ name: 'GSpeechPillView', inheritAttrs: false })

const props = defineProps({
  speech: { type: Object, required: true },
  placement: { type: String, default: 'placed' }
})

const api = props.speech[INTERNAL]
const S = api.state
const ui = api.ui
const v = useSpeechView(api)
const root = ref(null)
const main = ref(null)
const meter = ref(null)

const region = computed(() => (S.status === 'idle' ? peek(api, 'region') : api.t('region')))
const openPanelText = computed(() => (S.status === 'idle' ? '' : suffix(api.t('openPanel'))))
const durationText = computed(() => (v.showTime.value ? prefix(api.t('duration')) : ''))
const hotkey = computed(() => (api.opts.hotkey === false ? undefined : api.opts.hotkey))
const panelId = computed(() => (ui.hostId ? `${ui.hostId}-panel` : undefined))
const showMeter = computed(() => v.live.value && !S.activityHidden)
const toggleLabel = computed(() => (v.toggle.value ? v.toggle.value.label : peek(api, 'actions.pause')))
const finishLabel = computed(() => (v.canFinish.value ? api.t('actions.finish') : peek(api, 'actions.finish')))

function onMain() {
  if (S.panelOpen) api.closePanel()
  else api.openPanel(elOf(main.value))
}
function onToggle() {
  const tg = v.toggle.value
  if (!tg) return
  if (tg.action === 'pause') props.speech.pause()
  else props.speech.resume()
}
const onFinish = () => props.speech.finish()

// ---------- Medidor: 4 barras con --_speech-bar (0..1); movimiento reducido: data-on a ≤ reducedMotionHz ----------
let off = null
let lastPaint = 0
function paint(level, live) {
  const el = meter.value
  if (!el) return
  const bars = el.children
  const rm = ui.reducedMotion
  const t = Date.now()
  if (rm && live && t - lastPaint < 1000 / SPEECH_TIMING.reducedMotionHz) return
  lastPaint = t
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i]
    if (rm) {
      const on = live && level * bars.length > i
      if (on) b.setAttribute('data-on', '')
      else b.removeAttribute('data-on')
      b.style.setProperty('--_speech-bar', on ? '1' : '0')
    } else {
      if (b.hasAttribute('data-on')) b.removeAttribute('data-on')
      const h = live ? Math.max(0, Math.min(1, level * (0.7 + 0.6 * Math.abs(Math.sin(t / 120 + i * 1.7))))) : 0
      b.style.setProperty('--_speech-bar', h.toFixed(2))
    }
  }
}
onMounted(() => { off = props.speech.onLevel(paint) })
onBeforeUnmount(() => { if (off) off() })

defineExpose({
  root,
  focusMain: () => {
    const el = elOf(main.value)
    if (el && typeof el.focus === 'function') el.focus({ preventScroll: true })
  },
  mainEl: () => elOf(main.value)
})
</script>

<template>
  <div
    ref="root"
    :class="['g-speech-pill', `g-speech-pill--status-${v.status.value}`, { 'is-live': v.live.value, 'is-problem': v.problem.value }]"
    :data-placement="placement"
    :data-status="v.status.value"
    role="group"
    :aria-label="region"
    :hidden="v.status.value === 'idle' ? true : undefined"
  >
    <GBtn
      ref="main"
      class="g-speech-pill__main"
      variant="ghost"
      color="neutral"
      size="sm"
      :aria-expanded="String(S.panelOpen)"
      :aria-controls="panelId"
      :aria-keyshortcuts="hotkey"
      @click="onMain"
    >
      <span :class="['g-speech-pill__icon', { 'is-spinning': v.spinning.value }]" aria-hidden="true"><GIcon :name="v.icon.value" :filled="v.filled.value" /></span>
      <span class="g-speech-pill__text">{{ v.short.value }}</span>
      <span class="g-speech-pill__sr">{{ openPanelText }}</span>
      <span ref="meter" class="g-speech-meter" aria-hidden="true" :hidden="showMeter ? undefined : true"><i class="g-speech-meter__bar" /><i class="g-speech-meter__bar" /><i class="g-speech-meter__bar" /><i class="g-speech-meter__bar" /></span>
      <span class="g-speech-pill__chevron" aria-hidden="true"><GIcon name="chevron-down" /></span>
    </GBtn>
    <span class="g-speech-pill__time" role="timer" :hidden="v.showTime.value ? undefined : true"><span class="g-speech-pill__sr">{{ durationText }}</span>{{ v.time.value }}</span>
    <GBtn
      icon
      class="g-speech-pill__toggle"
      variant="ghost"
      color="neutral"
      size="sm"
      :aria-label="toggleLabel"
      :hidden="v.toggle.value ? undefined : true"
      @click="onToggle"
    ><GIcon :name="v.toggle.value ? v.toggle.value.icon : 'pause'" /></GBtn>
    <GBtn
      icon
      class="g-speech-pill__finish"
      variant="ghost"
      color="neutral"
      size="sm"
      :aria-label="finishLabel"
      :hidden="v.canFinish.value ? undefined : true"
      @click="onFinish"
    ><GIcon name="square" filled /></GBtn>
  </div>
</template>
