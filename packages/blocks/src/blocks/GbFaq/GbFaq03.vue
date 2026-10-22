<script setup>
// GbFaq03 · Con buscador (dueño: bruno). Contrato: design/contracts/blocks/faq.md «Buscador» · Común: _comun.md · Sin
// CSS (#763). GSection › GInput type="search" (label = labels.search, output = la cuenta) + el GAccordion de 01 con las
// que coinciden; sin coincidencias, GEmpty cause="filtered" con la búsqueda como su único filtro.
// - Coincide lo escrito sin mayúsculas ni diacríticos, en la pregunta o en la respuesta. Las que no coinciden no se
//   pintan (fuera del orden de lectura); las abiertas siguen abiertas (value estable) y ninguna se abre sola.
// - La cuenta la dice el `output` de GInput (su región cortés) SEARCH_MS después de la última tecla; nada con el campo
//   vacío. Es la única voz: el bloque no tiene región propia (#792).
// - El `clear` de GEmpty vacía el campo y le devuelve el foco. Sin envío: el campo no está en un form.
import { computed, onBeforeUnmount, ref, useId, watch } from 'vue'
import { GAccordion, GAccordionItem, GEmpty, GInput, GSection, GText, useSectionLevel } from '@grana/vue'
import { has } from '../common/text.js'
import { useWarn } from '../common/warn.js'
import { SEARCH_MS, emits as sectionEmits, props as sectionProps } from './props.js'
import { fold, useFaq } from './useFaq.js'

defineOptions({ name: 'GbFaq03' })
const props = defineProps(sectionProps)
defineEmits(sectionEmits)
const warn = useWarn('GbFaq03')
const { level } = useSectionLevel()
const inner = computed(() => Math.min(Math.min(level.value, 4) + 1, 6))
const rows = useFaq(props, warn)
const inputId = `${useId()}-search`

const query = ref('')
const needle = computed(() => fold(query.value.trim()))
const shown = computed(() => (needle.value ? rows.value.filter((r) => r.hay.includes(needle.value)) : rows.value))

const L = computed(() => props.labels || {})
const searchLabel = computed(() => {
  try { if (process.env.NODE_ENV !== 'production' && !has(L.value.search)) warn('C5:search', 'falta labels.search: el campo de búsqueda queda sin nombre (C5).') } catch {}
  return has(L.value.search) ? L.value.search : ''
})
const noneTitle = computed(() => {
  try { if (process.env.NODE_ENV !== 'production' && !has(L.value.none)) warn('C5:none', 'falta labels.none: el vacío de la búsqueda queda sin título (C5).') } catch {}
  return has(L.value.none) ? L.value.none : ''
})

/** «{count} de {total} preguntas»: String con {count}/{total} o función (#51). */
function matchesText(count, total) {
  const t = L.value.matches
  if (typeof t === 'function') return String(t({ count, total }))
  if (typeof t === 'string' && t.trim()) return t.replace(/\{count\}/g, String(count)).replace(/\{total\}/g, String(total))
  try { if (process.env.NODE_ENV !== 'production') warn('C5:matches', 'falta labels.matches: la cuenta de la búsqueda no se dice (C5).') } catch {}
  return ''
}

// La cuenta, SEARCH_MS después de la última tecla; vacía con el campo vacío
const said = ref('')
let timer = null
watch(query, (v) => {
  clearTimeout(timer)
  if (!v.trim()) { said.value = ''; return }
  timer = setTimeout(() => { said.value = matchesText(shown.value.length, rows.value.length) }, SEARCH_MS)
})
onBeforeUnmount(() => clearTimeout(timer))

function clear() {
  query.value = ''
  const el = typeof document !== 'undefined' ? document.getElementById(inputId) : null
  if (el) el.focus()
}
</script>

<template>
  <GSection v-if="rows.length" :title="title" :description="description" data-gb="faq-03">
    <template v-if="$slots.description" #description><slot name="description" /></template>
    <GInput :id="inputId" v-model="query" type="search" :label="searchLabel" :output="said" autocomplete="off" />
    <GAccordion v-if="shown.length" :heading-level="inner">
      <GAccordionItem v-for="r in shown" :id="r.anchor" :key="r.key" :value="r.key" :title="r.item.question" :peek="r.peek">
        <GText as="div"><slot name="answer" :item="r.item"><p v-for="(p, i) in r.paras" :key="i">{{ p }}</p></slot></GText>
      </GAccordionItem>
    </GAccordion>
    <GEmpty v-else cause="filtered" :title="noneTitle" :filters="[{ key: 'search', label: query.trim() }]" :labels="{ clear: labels.clear }" @clear="clear" />
  </GSection>
</template>
