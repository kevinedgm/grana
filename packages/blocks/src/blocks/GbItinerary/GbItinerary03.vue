<script setup>
// GbItinerary03 · Tabla (dueño: bruno). Contrato: design/contracts/blocks/itinerary.md · Común: _comun.md §15 · Sin CSS
// (#763). GSection › por día una GTable (caption = label y la fecha en palabras, columnas hora/parada/lugar con
// labels.time/stop/place, una fila por parada, responsive="auto": tarjetas en estrecho). Inicio y fin en <time>; «ahora» y
// «siguiente» en texto en la celda de la parada, y aria-current="time" en el nombre de la parada en curso (GTable no
// tiene atributos por fila). Ignora `media` y `Stop.description` (la tabla es la vista breve). Sin línea dibujada (§23).
import { computed } from 'vue'
import { GSection, GTable } from '@grana/vue'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { emits as sectionEmits, props as sectionProps } from './props.js'
import { useItinerary } from './useItinerary.js'

defineOptions({ name: 'GbItinerary03' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const warn = useWarn('GbItinerary03')
const { days, markOf, badge } = useItinerary(props, warn, '03')
const L = computed(() => props.labels || {})
const columns = computed(() => {
  const need = ['time', 'stop', 'place'].filter((k) => !has(L.value[k]))
  try { if (process.env.NODE_ENV !== 'production' && need.length) warn('C5:columns', `faltan labels.${need.join(', labels.')} (cabeceras de la tabla): se pintan sin ellas (C5).`) } catch {}
  // `min` en unidades de space (table.md «Columnas»): la hora es corta y el nombre de la parada pide más; la suma (88)
  // fija el paso a tarjetas por debajo de ≈ 352 px de contenedor (el teléfono)
  return [
    { key: 'time', label: L.value.time || '', min: 16 },
    { key: 'title', label: L.value.stop || '', primary: true, min: 40 },
    { key: 'place', label: L.value.place || '', min: 32 }
  ]
})
const caption = (d) => [d.day.label, d.date ? d.date.text : ''].filter(Boolean).join(' · ')
const rows = (d) => d.stops.map((s) => ({ id: s.key, time: s.time, until: s.until, title: s.stop.title, place: has(s.stop.place) ? s.stop.place : '', mark: markOf(d.key, s.key) }))
</script>

<template>
  <GSection v-if="days.length" :title="title" :description="description" data-gb="itinerary-03">
    <GTable v-for="d in days" :key="d.key" :caption="caption(d)" :columns="columns" :rows="rows(d)" responsive="auto">
      <!-- La hora de inicio y, si la hay, la de fin, como el antetítulo de 01 (BK-B4: sin el fin no se sabe cuánto dura) -->
      <template #cell-time="{ row }"><template v-for="(t, i) in [row.time, row.until]" :key="i"><template v-if="t"><template v-if="i">–</template><time v-if="t.datetime" :datetime="t.datetime">{{ t.text }}</time><template v-else>{{ t.text }}</template></template></template></template>
      <template #cell-title="{ row }"><span :aria-current="row.mark === 'now' ? 'time' : undefined">{{ row.title }}</span><template v-if="badge(row.mark)">{{ ' · ' }}{{ badge(row.mark) }}</template></template>
    </GTable>
  </GSection>
</template>
