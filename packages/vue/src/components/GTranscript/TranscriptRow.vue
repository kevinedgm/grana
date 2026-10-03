<script setup>
// Fila de GTranscript (INTERNA; dueño: bruno). Contrato: design/contracts/speech.md §22.4 a §22.9, §29.
// Marcado: design/lab/speech/estilo.md «Fase 2» y estilo-banco-f2.html. Una fila por fragmento (o el provisional).
// Rendimiento (§26): cada fila es su componente y solo se repinta si cambia lo que muestra (sus props son primitivas y el
// fragmento es un objeto reactivo estable); el foco itinerante llega como `active` (la columna activa o null), así que mover
// el foco repinta dos filas. Las celdas de hora, hablante, texto y acciones van en TranscriptCells: marcar la fila solo
// repinta su raíz y su casilla.
import GCheckbox from '../GCheckbox/GCheckbox.vue'
import TranscriptCells from './TranscriptCells.vue'

defineOptions({ name: 'GTranscriptRow', inheritAttrs: false })

const props = defineProps({
  seg: { type: Object, default: null },
  part: { type: Object, default: null },
  time: { type: String, default: '' },
  ctx: { type: Object, required: true },
  select: Boolean,
  speakerCol: Boolean,
  active: { type: String, default: null },
  selected: Boolean,
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

// Hablante efectivo (o el del provisional) y su presentación
const spk = () => (props.seg ? c.tx().speakerOf(props.seg) : c.tx().resolve(props.part.speaker))
const engineSpk = () => c.tx().resolve(props.seg.engineSpeaker)
const speakerChanged = () => Boolean(props.seg) && props.seg.speaker !== null && props.seg.engineSpeaker !== null && spk() !== engineSpk()
const uses = () => (confirmed() ? c.tx().usesOf(props.seg.id) : [])
const stale = (list) => list.some((u) => u.sources && Object.prototype.hasOwnProperty.call(u.sources, props.seg.id) && (props.seg.removed || u.sources[props.seg.id] !== c.tx().textOf(props.seg)))

function rowClass(list) {
  const s = props.seg
  return [
    'g-transcript__row',
    {
      'is-partial': !s,
      'is-failed': failed(),
      'is-corrected': Boolean(s) && s.corrected !== null,
      'is-speaker-changed': speakerChanged(),
      'is-removed': Boolean(s) && s.removed,
      'is-selected': props.selected && c.selectable() && confirmed(),
      'is-editing': props.editing,
      'is-stale': confirmed() && list.length > 0 && stale(list)
    }
  ]
}
</script>

<template>
  <div
    :class="rowClass(uses())"
    role="row"
    :aria-selected="c.selectable() && confirmed() ? String(selected) : undefined"
    :data-id="id()"
  >
    <div
      v-if="select"
      class="g-transcript__cell g-transcript__cell--select"
      role="gridcell"
      :tabindex="confirmed() ? undefined : tab('select')"
      :data-focus="confirmed() ? undefined : 'select'"
    >
      <GCheckbox
        v-if="confirmed()"
        :model-value="selected"
        :aria-label="t('transcript.row.select', { time })"
        :tabindex="tab('select')"
        data-focus="select"
        @click="c.checkClick(id(), $event)"
        @update:model-value="c.check(id(), $event)"
      />
    </div>
    <TranscriptCells
      :seg="seg"
      :part="part"
      :time="time"
      :ctx="ctx"
      :speaker-col="speakerCol"
      :active="active === 'select' ? null : active"
      :editing="editing"
      :edit-text="editText"
      :orig="orig"
      :menu="menu"
    />
  </div>
</template>
