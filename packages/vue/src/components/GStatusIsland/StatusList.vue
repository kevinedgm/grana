<script setup>
// Lista de condiciones de la isla (interno; dueño: bruno). La pintan el panel de GStatusIsland (escritorio) y su hoja
// móvil (GDialog): mismo marcado y mismos manejadores. Contrato: design/contracts/status.md «Estructura accesible».
// Solo texto (#318): título, descripción, cuenta atrás, un enlace, detalle técnico, una acción, «Ir a…» y descartar.
import { onBeforeUpdate, onUpdated } from 'vue'
import { fill } from '../../utils/template.js'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'
import { formatRemaining } from './status.js'

defineOptions({ name: 'GStatusList' })

const props = defineProps({
  api: { type: Object, required: true }, // acceso interno del gestor
  rootId: { type: String, required: true },
  details: { type: Object, required: true }, // Set reactivo de uids con el detalle abierto (vive en la isla)
  guard: { type: Object, required: true } // guarda de foco de la isla: before() / after()
})
const emit = defineEmits(['origin', 'link'])

const S = props.api.state
const ICON = { info: 'info', success: 'circle-check', warning: 'triangle-alert', error: 'circle-alert' }
const L = () => S.opts.labels
const itemId = (c) => `${props.rootId}-i-${c.uid}`
const typeLabel = (c) => (L().types ? L().types[c.type] : undefined)
const hasDetails = (c) => Boolean(c.details && L().details)
const classes = (c) => [
  'g-status-item',
  `g-status-item--type-${c.type}`,
  { 'is-busy': c.busy, 'is-acknowledged': c.acknowledged, 'has-action': Boolean(c.action), 'has-details': hasDetails(c), 'is-dismissible': c.dismissible }
]
const left = (c) => formatRemaining(c.deadline - S.now)
function toggleDetails(c) {
  if (props.details.has(c.uid)) props.details.delete(c.uid)
  else props.details.add(c.uid)
}
// «Copiar»: solo al pulsar; si se cumple, se anuncia (cortés)
function copyDetails(c) {
  const cb = typeof navigator !== 'undefined' && navigator.clipboard
  if (!cb || typeof cb.writeText !== 'function') return
  let p
  try { p = cb.writeText(c.details) } catch { return }
  if (p && typeof p.then === 'function') p.then(() => props.api.say(L().copied, 'polite'), () => {})
}

// El foco se conserva o se recoloca tras cada parche de la lista (la isla decide a dónde)
onBeforeUpdate(() => props.guard.before())
onUpdated(() => props.guard.after())
</script>

<template>
  <ul class="g-status-island__list">
    <li
      v-for="c in api.ordered.value"
      :id="itemId(c)"
      :key="c.uid"
      :class="classes(c)"
      :data-type="c.type"
      :aria-busy="c.busy ? 'true' : undefined"
    >
      <span class="g-status-item__badge" :class="{ 'is-busy': c.busy }" :data-type="c.type" aria-hidden="true"><GIcon :name="c.busy ? 'loader-circle' : ICON[c.type]" /></span>
      <div class="g-status-item__content">
        <p :id="`${itemId(c)}-title`" class="g-status-item__title"><span v-if="typeLabel(c)" class="g-status-item__type">{{ typeLabel(c) + ': ' }}</span>{{ c.title }}</p>
        <p v-if="c.description" class="g-status-item__description">{{ c.description }}</p>
        <span v-if="c.deadline !== undefined" class="g-status-item__timer" role="timer" aria-live="off">{{ left(c) }}</span>
        <a v-if="c.link" class="g-status-item__link" :href="c.link.href" :target="c.link.target" :rel="c.link.rel" @click="emit('link', $event, c)">{{ c.link.label }}</a>
        <template v-if="hasDetails(c)">
          <GBtn class="g-status-item__details-toggle" size="sm" variant="ghost" color="neutral" :aria-expanded="details.has(c.uid) ? 'true' : 'false'" :aria-controls="`${itemId(c)}-details`" @click="toggleDetails(c)">{{ L().details }}</GBtn>
          <div :id="`${itemId(c)}-details`" class="g-status-item__details" :hidden="details.has(c.uid) ? undefined : true">
            <pre class="g-status-item__details-text" dir="ltr">{{ c.details }}</pre>
            <GBtn v-if="L().copy" class="g-status-item__copy" size="sm" variant="ghost" color="neutral" @click="copyDetails(c)">{{ L().copy }}</GBtn>
          </div>
        </template>
      </div>
      <div v-if="c.action || c.origin" class="g-status-item__actions">
        <GBtn v-if="c.action" class="g-status-item__action" size="sm" variant="outline" color="neutral" :aria-disabled="c.busy ? 'true' : undefined" @click="api.action(c.uid)">{{ c.busy && c.action.busyLabel ? c.action.busyLabel : c.action.label }}</GBtn>
        <GBtn v-if="c.origin" class="g-status-item__origin" size="sm" variant="ghost" color="neutral" @click="emit('origin', c)">{{ c.origin.label }}</GBtn>
      </div>
      <GBtn v-if="c.dismissible" class="g-status-item__dismiss" icon size="sm" variant="ghost" color="neutral" :aria-label="L().dismiss ? fill(L().dismiss, { title: c.title }) : undefined" @click="api.dismiss(c.uid)"><GIcon name="x" /></GBtn>
    </li>
  </ul>
</template>
