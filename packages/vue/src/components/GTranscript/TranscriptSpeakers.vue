<script setup>
// Gestor de hablantes de GTranscript (INTERNO; dueño: bruno). Contrato: design/contracts/speech.md §23.3 a §23.6, §29.
// Marcado (estilo.md «Fase 2», punto 7): título h{headingLevel} hijo directo; ayuda en un <p> hijo directo; <ul> de
// li.__speaker-row con span.__speaker (marca + etiqueta), un <span> sin clase con el recuento o «Unido a …», los GSelect y
// los botones; «Añadir hablante» en un <div> propio al final. El contenido solo existe abierto (disclosure «Hablantes»).
import { computed, reactive, ref } from 'vue'
import GBtn from '../GBtn/GBtn.vue'
import GSelect from '../GSelect/GSelect.vue'
import GIcon from '../GIcon/GLibIcon.js'

defineOptions({ name: 'GTranscriptSpeakers', inheritAttrs: false })

const props = defineProps({
  ctx: { type: Object, required: true },
  open: Boolean,
  level: { type: Number, default: 3 }
})

const c = props.ctx
const t = c.t
const title = ref(null)
const titleId = computed(() => `${c.uid}-speakers-title`)

// Hablantes con algo que mostrar: los visibles (no unidos) y los unidos que tienen fragmentos propios
const list = computed(() => {
  if (!props.open) return []
  const tx = c.tx()
  const visible = new Set(tx.visibleSpeakers().map((s) => s.id))
  const own = new Set()
  for (const s of tx.segments) { if (s.engineSpeaker) own.add(s.engineSpeaker); if (s.speaker) own.add(s.speaker) }
  return tx.speakers.filter((s) => visible.has(s.id) || (s.mergedInto && own.has(s.id)))
})
const active = computed(() => list.value.filter((s) => !s.mergedInto))
function count(id) {
  let n = 0
  for (const s of c.tx().segments) if (!s.failed && c.tx().speakerOf(s) === id) n++
  return n
}
const neutral = (id) => t('speaker', { letter: c.tx().letter(id) })
const roleOptions = computed(() => [{ value: '', label: t('transcript.speakers.noRole') }, ...c.roles().map((r) => ({ value: r.id, label: r.label }))])
const others = (id) => active.value.filter((s) => s.id !== id).map((s) => ({ value: s.id, label: c.speakerLabel(s.id) }))
// Destino de «Unir con» elegido por hablante (por defecto, el primero de los demás)
const into = reactive({})
const mergeTarget = (id) => {
  const opts = others(id)
  return opts.some((o) => o.value === into[id]) ? into[id] : (opts[0] ? opts[0].value : null)
}

defineExpose({ focusTitle: () => { if (title.value) title.value.focus() } })
</script>

<template>
  <section :id="`${c.uid}-speakers`" class="g-transcript__speakers" :aria-labelledby="titleId" :hidden="open ? undefined : true">
    <template v-if="open">
      <component :is="`h${level}`" :id="titleId" ref="title" tabindex="-1">{{ t('transcript.speakers.title') }}</component>
      <p>{{ t('transcript.speakers.help') }}</p>
      <ul>
        <li v-for="sp in list" :key="sp.id" class="g-transcript__speaker-row">
          <span class="g-transcript__speaker"><span class="g-transcript__mark" :data-cat="c.cat(sp.id)" aria-hidden="true">{{ c.tx().letter(sp.id) }}</span>{{ sp.mergedInto ? neutral(sp.id) : c.speakerLabel(sp.id) }}</span>
          <template v-if="sp.mergedInto">
            <span>{{ t('transcript.speakers.mergedInto', { speaker: c.speakerLabel(c.tx().resolve(sp.id)) }) }}</span>
            <GBtn size="sm" variant="outline" color="neutral" @click="c.unmerge(sp.id)"><template #prepend><GIcon name="split" /></template>{{ t('transcript.speakers.unmerge') }}</GBtn>
          </template>
          <template v-else>
            <span>{{ t('transcript.speakers.count', { count: count(sp.id) }) }}</span>
            <GSelect
              v-if="c.roles().length"
              :id="`${c.uid}-role-${sp.id}`"
              :model-value="sp.role ?? ''"
              :label="t('transcript.speakers.role', { speaker: neutral(sp.id) })"
              :options="roleOptions"
              @update:model-value="c.setRole(sp.id, $event)"
            />
            <template v-if="others(sp.id).length">
              <GSelect
                :id="`${c.uid}-merge-${sp.id}`"
                :model-value="mergeTarget(sp.id)"
                :label="t('transcript.speakers.mergeWith', { speaker: neutral(sp.id) })"
                :options="others(sp.id)"
                @update:model-value="into[sp.id] = $event"
              />
              <GBtn size="sm" variant="outline" color="neutral" @click="c.merge(sp.id, mergeTarget(sp.id))"><template #prepend><GIcon name="merge" /></template>{{ t('transcript.speakers.merge') }}</GBtn>
            </template>
          </template>
        </li>
      </ul>
      <div><GBtn size="sm" variant="outline" color="neutral" @click="c.addSpeaker()"><template #prepend><GIcon name="user-plus" /></template>{{ t('transcript.speakers.add') }}</GBtn></div>
    </template>
  </section>
</template>
