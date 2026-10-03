<script setup>
// Inserción en un destino de GTranscript (INTERNA; dueño: bruno). Contrato: design/contracts/speech.md §24.3 a §24.7, §29.
// Marcado (estilo.md «Fase 2», punto 8): hijos directos de __insert en este orden: título h{headingLevel}, los tres GSelect
// (Qué, Campo, Dónde), GCheckbox «Con hablantes», un <p> rótulo y __preview (tabindex 0, role region, aria-labelledby al
// rótulo; no es región viva), el botón en un <div>, p.__result y __uses. El foco se queda en «Insertar» (WCAG 3.2.2).
// Mientras está montada, el almacén de destinos recuerda el cursor y la selección de cada campo (escuchas de documento).
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import GBtn from '../GBtn/GBtn.vue'
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import GSelect from '../GSelect/GSelect.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { TRANSCRIPT_LIMITS } from './transcript.js'

defineOptions({ name: 'GTranscriptInsert', inheritAttrs: false })

const props = defineProps({
  ctx: { type: Object, required: true },
  level: { type: Number, default: 3 }
})

const c = props.ctx
const t = c.t
const ins = c.ins
const goBtn = ref(null)
const titleId = computed(() => `${c.uid}-insert-title`)
const pvId = computed(() => `${c.uid}-pv-label`)
const clip = (s, n = TRANSCRIPT_LIMITS.quoteChars) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)

const targets = computed(() => c.store().list)
const target = computed(() => targets.value.find((x) => x.id === ins.target) || targets.value[0] || null)
const hatch = computed(() => Boolean(target.value && typeof target.value.insert === 'function'))

// Fuentes disponibles (§24.3)
const nSel = computed(() => c.selectionIds().filter((id) => { const s = c.tx().segment(id); return s && !s.removed && !s.failed }).length)
const nAll = computed(() => c.tx().segments.filter((s) => !s.removed && !s.failed).length)
const textParts = computed(() => { const sel = c.textSel(); return sel && sel.some((p) => p.text.trim()) ? sel : null })
const src = computed(() => {
  if (ins.src === 'text' && textParts.value) return 'text'
  if ((ins.src === 'segments' || ins.src === 'text') && nSel.value) return 'segments'
  return 'all'
})
// Una selección nueva activa la fuente más específica; la elección manual se respeta mientras la selección no cambie
const selSig = computed(() => c.selectionIds().join('|'))
const textSig = computed(() => (textParts.value ? textParts.value.map((p) => `${p.id}:${p.start}-${p.end}`).join('|') : ''))
watch([selSig, textSig], () => {
  ins.manual = false
  ins.src = textParts.value ? 'text' : nSel.value ? 'segments' : 'all'
}, { immediate: true })

// Dónde (§24.4)
const caret = computed(() => (target.value && !hatch.value ? c.store().caret(target.value) : null))
const canCursor = computed(() => hatch.value || Boolean(caret.value))
const canSel = computed(() => !hatch.value && Boolean(caret.value) && caret.value.end > caret.value.start)
const pos = computed(() => (ins.pos === 'cursor' && canCursor.value) || (ins.pos === 'selection' && canSel.value) ? ins.pos : 'end')

const withSpeakers = computed(() => c.conv() && src.value !== 'text' && ins.withSpk)
const source = computed(() => (src.value === 'text' ? { kind: 'text', parts: textParts.value } : src.value === 'segments' ? { kind: 'segments', ids: c.selectionIds() } : { kind: 'all' }))
const result = computed(() => (target.value
  ? c.tx().compose(source.value, { withSpeakers: withSpeakers.value, multiline: target.value.multiline !== false, speakerName: c.speakerName })
  : { text: '', ids: [] }))
const what = computed(() => (src.value === 'text' ? t('transcript.what.text') : t('transcript.what.segments', { count: result.value.ids.length })))

const whatOptions = computed(() => [
  { value: 'all', label: t('transcript.insert.all', { count: nAll.value }) },
  { value: 'segments', label: t('transcript.insert.segments', { count: nSel.value }), disabled: !nSel.value },
  { value: 'text', label: textParts.value ? t('transcript.insert.text', { text: clip(textParts.value.map((p) => p.text).join(' ')) }) : t('transcript.insert.textNone'), disabled: !textParts.value }
])
const targetOptions = computed(() => targets.value.map((x) => ({ value: x.id, label: x.label })))
const whereOptions = computed(() => {
  const out = [
    { value: 'end', label: t('transcript.insert.end') },
    { value: 'cursor', label: canCursor.value ? t('transcript.insert.cursor') : `${t('transcript.insert.cursor')} ${t('transcript.insert.unknown')}`, disabled: !canCursor.value }
  ]
  // «Sustituir la selección del campo «…»» solo con una selección conocida (la plantilla lleva el texto seleccionado)
  if (canSel.value) out.push({ value: 'selection', label: t('transcript.insert.selection', { text: clip(caret.value.value.slice(caret.value.start, caret.value.end)) }) })
  return out
})

// Resultado y usos (§24.6)
const uses = computed(() => c.tx().derived.filter((d) => d.kind === 'insert'))
const last = computed(() => (ins.last && uses.value.some((d) => d.id === ins.last.useId) ? ins.last : null))
const undoable = (use) => c.store().undoable(use)
const lastUse = computed(() => (last.value ? uses.value.find((d) => d.id === last.value.useId) : null))
const useWhat = (d) => t('transcript.what.segments', { count: (d.sourceSegmentIds || []).length })

const elOf = (comp) => { let n = comp && comp.$el; while (n && n.nodeType !== 1) n = n.nextSibling; return n || null }
function go() {
  if (!result.value.text || !target.value) { if (!result.value.text) c.say(t('transcript.insert.nothing')); return }
  c.insert(target.value.id, source.value, { position: pos.value, withSpeakers: withSpeakers.value, what: what.value })
}
async function undo(useId) {
  await c.undoInsert(useId)
  await nextTick()
  // El botón que se pulsó puede haber desaparecido: el foco no se pierde, pasa a «Insertar en …»
  if (!document.activeElement || document.activeElement === document.body) { const el = elOf(goBtn.value); if (el) el.focus() }
}

let off = null
onMounted(() => { off = c.store().attach() })
onBeforeUnmount(() => { if (off) off() })
</script>

<template>
  <section class="g-transcript__insert" :aria-labelledby="titleId">
    <component :is="`h${level}`" :id="titleId">{{ t('transcript.insert.title') }}</component>
    <GSelect :id="`${c.uid}-what`" :model-value="src" :label="t('transcript.insert.what')" :options="whatOptions" @update:model-value="ins.src = $event; ins.manual = true" />
    <GSelect :id="`${c.uid}-target`" :model-value="target ? target.id : null" :label="t('transcript.insert.target')" :options="targetOptions" @update:model-value="ins.target = $event" />
    <GSelect :id="`${c.uid}-where`" :model-value="pos" :label="t('transcript.insert.where')" :options="whereOptions" @update:model-value="ins.pos = $event" />
    <GCheckbox v-if="c.conv() && src !== 'text'" :field="false" :id="`${c.uid}-with-speakers`" :model-value="ins.withSpk" :label="t('transcript.insert.withSpeakers')" @update:model-value="ins.withSpk = $event" />
    <p :id="pvId">{{ t('transcript.insert.preview') }}</p>
    <div class="g-transcript__preview" tabindex="0" role="region" :aria-labelledby="pvId">{{ result.text || t('transcript.insert.nothing') }}</div>
    <div>
      <GBtn ref="goBtn" size="md" :aria-disabled="result.text ? undefined : 'true'" @click="go"><template #prepend><GIcon name="text-cursor-input" /></template>{{ t('transcript.insert.go', { target: target ? target.label : '' }) }}</GBtn>
    </div>
    <p v-if="last" class="g-transcript__result">
      <GIcon name="circle-check" /><span>{{ t('transcript.insert.done', { target: last.label, what: last.what }) }}</span>
      <GBtn v-if="lastUse && undoable(lastUse)" size="sm" variant="outline" color="neutral" @click="undo(last.useId)"><template #prepend><GIcon name="undo-2" /></template>{{ t('transcript.insert.undo') }}</GBtn>
    </p>
    <details v-if="uses.length" class="g-transcript__uses">
      <summary>{{ t('transcript.insert.uses', { count: uses.length }) }}</summary>
      <ul>
        <li v-for="d in uses" :key="d.id">
          <span>{{ t('transcript.insert.use', { target: d.target ? d.target.label : '', what: useWhat(d), time: d.at }) }}</span>
          <GBtn v-if="undoable(d)" size="sm" variant="outline" color="neutral" @click="undo(d.id)"><template #prepend><GIcon name="undo-2" /></template>{{ t('transcript.insert.undo') }}</GBtn>
        </li>
      </ul>
    </details>
  </section>
</template>
