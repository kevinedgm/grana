<script setup>
// Celdas de hora, hablante, texto y acciones de una fila de GTranscript (INTERNAS; dueño: bruno). Contrato: speech.md
// §22.4 a §22.9, §29. Van en su propio componente para que marcar la fila (selección, Ctrl+A sobre cientos de filas) solo
// repinte la fila y su casilla, no estas celdas (§26). El editor nunca se repinta mientras está abierto: el textarea no está
// ligado a un valor reactivo (`editText` no cambia mientras se edita).
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { diffWords, formatTime } from './transcript.js'
import { asSuffix, withSpace } from './labels.js'

defineOptions({ name: 'GTranscriptCells', inheritAttrs: false })

const props = defineProps({
  seg: { type: Object, default: null },
  part: { type: Object, default: null },
  time: { type: String, default: '' },
  ctx: { type: Object, required: true },
  speakerCol: Boolean,
  active: { type: String, default: null },
  editing: Boolean,
  editText: { type: String, default: '' },
  orig: Boolean,
  menu: { type: String, default: null }
})

const c = props.ctx
const t = c.t
const id = () => (props.seg ? props.seg.id : props.part.id)
const confirmed = () => Boolean(props.seg) && !props.seg.failed
const failed = () => Boolean(props.seg) && props.seg.failed
const tab = (col) => (props.active === col ? 0 : -1)
const datetime = () => `PT${Math.floor(((props.seg ? props.seg.t0 : 0) || 0) / 1000)}S`

// Hablante efectivo (o el del provisional) y su presentación
const spk = () => (props.seg ? c.tx().speakerOf(props.seg) : c.tx().resolve(props.part.speaker))
const engineSpk = () => c.tx().resolve(props.seg.engineSpeaker)
const speakerChanged = () => Boolean(props.seg) && props.seg.speaker !== null && props.seg.engineSpeaker !== null && spk() !== engineSpk()
const changed = () => Boolean(props.seg) && (props.seg.corrected !== null || speakerChanged())
const uses = () => (confirmed() ? c.tx().usesOf(props.seg.id) : [])
const stale = (list) => list.some((u) => u.sources && Object.prototype.hasOwnProperty.call(u.sources, props.seg.id) && (props.seg.removed || u.sources[props.seg.id] !== c.tx().textOf(props.seg)))
const usedIn = (list) => [...new Set(list.map((u) => (u.target && u.target.label) || ''))].filter(Boolean).join(', ')

const wraps = () => c.wraps()
const ops = () => diffWords(props.seg.literal, props.seg.corrected)
const editorIds = () => ({ field: `${c.uid}-ed-${id()}`, orig: `${c.uid}-eo-${id()}`, hint: `${c.uid}-eh-${id()}` })
</script>

<template>
    <div class="g-transcript__cell g-transcript__cell--time" role="rowheader" :tabindex="tab('time')" data-focus="time"><time :datetime="datetime()">{{ time }}</time></div>
    <div
      v-if="speakerCol"
      class="g-transcript__cell g-transcript__cell--speaker"
      role="gridcell"
      :tabindex="confirmed() && c.editable() ? undefined : tab('speaker')"
      :data-focus="confirmed() && c.editable() ? undefined : 'speaker'"
    >
      <template v-if="!failed()">
        <GBtn
          v-if="confirmed() && c.editable()"
          class="g-transcript__speaker"
          size="sm"
          variant="ghost"
          color="neutral"
          aria-haspopup="menu"
          :aria-expanded="menu === 'speaker' ? 'true' : 'false'"
          :aria-controls="menu === 'speaker' ? c.listId : undefined"
          :id="menu === 'speaker' ? c.triggerId : undefined"
          :tabindex="tab('speaker')"
          data-focus="speaker"
          @click="c.openMenu(id(), 'speaker')"
        >
          <span :class="['g-transcript__mark', { 'is-unassigned': !spk() }]" :data-cat="c.cat(spk())" aria-hidden="true">{{ spk() ? c.tx().letter(spk()) : '' }}</span>{{ c.speakerLabel(spk()) }}<span class="g-transcript__sr">{{ asSuffix(t('transcript.row.changeSpeaker')) }}</span>
        </GBtn>
        <span v-else class="g-transcript__speaker"><span :class="['g-transcript__mark', { 'is-unassigned': !spk() }]" :data-cat="c.cat(spk())" aria-hidden="true">{{ spk() ? c.tx().letter(spk()) : '' }}</span>{{ c.speakerLabel(spk()) }}</span>
      </template>
    </div>
    <div
      class="g-transcript__cell g-transcript__cell--text"
      role="gridcell"
      :tabindex="editing ? -1 : tab('text')"
      :data-focus="editing ? undefined : 'text'"
    >
      <div v-if="editing" class="g-transcript__editor" role="group" :aria-label="t('transcript.editor.group', { time })">
        <textarea
          :id="editorIds().field"
          class="g-transcript__field"
          rows="2"
          :value="editText"
          :aria-label="t('transcript.editor.field', { time })"
          :aria-describedby="`${editorIds().orig} ${editorIds().hint}`"
          :tabindex="active === 'text' ? 0 : -1"
          data-focus="text"
        />
        <p :id="editorIds().orig" class="g-transcript__editor-orig">{{ withSpace(t('transcript.diff.original')) }}{{ seg.literal }}</p>
        <p :id="editorIds().hint" class="g-transcript__editor-hint">{{ t('transcript.editor.hint') }}</p>
        <div class="g-transcript__editor-actions">
          <GBtn size="sm" data-editor="save" @click="c.save(id())">{{ t('transcript.editor.save') }}</GBtn>
          <GBtn size="sm" variant="outline" color="neutral" data-editor="cancel" @click="c.cancel(id())">{{ t('transcript.editor.cancel') }}</GBtn>
        </div>
      </div>
      <template v-else-if="failed()">
        <span class="g-transcript__flags"><span class="g-transcript__flag g-transcript__flag--failed"><GIcon name="triangle-alert" />{{ t('transcript.failed', { range: `${formatTime(seg.t0)}–${formatTime(seg.t1)}` }) }}</span></span>
      </template>
      <template v-else-if="!seg">
        <span class="g-transcript__text"><span class="g-transcript__sr">{{ withSpace(t('transcript.partialPrefix')) }}</span>{{ part.text }}</span>
        <span class="g-transcript__flags"><span class="g-transcript__flag g-transcript__flag--partial">{{ t('transcript.partialFlag') }}</span></span>
      </template>
      <template v-else>
        <span class="g-transcript__text">{{ c.tx().textOf(seg) }}</span>
        <span class="g-transcript__flags"><span v-if="seg.corrected !== null" class="g-transcript__flag g-transcript__flag--corrected"><GIcon name="pencil" />{{ t('transcript.flags.corrected') }}</span><span v-if="speakerChanged()" class="g-transcript__flag g-transcript__flag--speaker"><GIcon name="users" />{{ t('transcript.flags.speaker', { speaker: c.speakerLabel(engineSpk()) }) }}</span><span v-if="seg.removed" class="g-transcript__flag g-transcript__flag--removed"><GIcon name="trash" />{{ t('transcript.flags.removed') }}</span><template v-for="list in [uses()]" :key="'u'"><span v-if="list.length" class="g-transcript__flag g-transcript__flag--used"><GIcon name="text-cursor-input" />{{ t('transcript.flags.used', { targets: usedIn(list) }) }}</span><span v-if="list.length && stale(list)" class="g-transcript__flag g-transcript__flag--stale"><GIcon name="triangle-alert" />{{ t('transcript.flags.stale') }}</span></template></span>
        <div v-if="orig && changed()" class="g-transcript__orig">
          <p v-if="seg.corrected !== null">{{ withSpace(t('transcript.diff.original')) }}{{ seg.literal }}</p>
          <p v-if="seg.corrected !== null">{{ withSpace(t('transcript.diff.changes')) }}<span class="g-transcript__diff"><template v-for="(o, i) in ops()" :key="i">{{ i ? ' ' : '' }}<del v-if="o.t === 'del'"><span class="g-transcript__sr">{{ wraps().del[0] }}</span>{{ o.text }}<span class="g-transcript__sr">{{ wraps().del[1] }}</span></del><ins v-else-if="o.t === 'ins'"><span class="g-transcript__sr">{{ wraps().ins[0] }}</span>{{ o.text }}<span class="g-transcript__sr">{{ wraps().ins[1] }}</span></ins><template v-else>{{ o.text }}</template></template></span></p>
          <p v-if="speakerChanged()">{{ t('transcript.diff.originalSpeaker', { speaker: c.speakerLabel(engineSpk()) }) }}</p>
        </div>
      </template>
    </div>
    <div
      class="g-transcript__cell g-transcript__cell--actions"
      role="gridcell"
      :tabindex="confirmed() ? undefined : tab('actions')"
      :data-focus="confirmed() ? undefined : 'actions'"
    >
      <GBtn
        v-if="confirmed()"
        icon
        class="g-transcript__actions"
        size="sm"
        variant="ghost"
        color="neutral"
        aria-haspopup="menu"
        :aria-expanded="menu === 'actions' ? 'true' : 'false'"
        :aria-controls="menu === 'actions' ? c.listId : undefined"
        :id="menu === 'actions' ? c.triggerId : undefined"
        :aria-label="t('transcript.row.actions', { time })"
        :tabindex="tab('actions')"
        data-focus="actions"
        @click="c.openMenu(id(), 'actions')"
      ><GIcon name="ellipsis-vertical" /></GBtn>
    </div>
</template>
