<script setup>
// Botón de un evento (pieza interna de GCalendar; dueño: bruno). Lo usan Día, Semana, Timeline, Mes y la agenda móvil.
import { computed, inject } from 'vue'
import { CALENDAR_KEY } from './context.js'

const props = defineProps({
  seg: { type: Object, required: true },
  resourceId: { type: String, required: true },
  small: Boolean,
  selected: Boolean,
  conflict: Boolean,
  tabStop: Boolean,
  natural: Boolean,
  dataKey: { type: String, required: true }
})

const ctx = inject(CALENDAR_KEY)
const ev = computed(() => props.seg.ev)
const resource = computed(() => ctx.resourceOf(props.resourceId))
const status = computed(() => (props.seg.open ? 'active' : ev.value.status))
const name = computed(() => ctx.eventName(ev.value, resource.value, props.seg))
const timeText = computed(() => {
  if (ev.value.allDay) return ''
  const start = ctx.time(props.seg.start)
  return props.seg.open ? start : `${start}–${ctx.time(props.seg.end)}`
})
const scope = computed(() => ({
  event: ev.value.raw,
  resource: resource.value ? resource.value.raw : null,
  segment: { start: props.seg.start, end: props.seg.end, continuesBefore: props.seg.continuesBefore, continuesAfter: props.seg.continuesAfter, open: props.seg.open }
}))

// Los slots del consumidor viven en GCalendar; aquí se pintan tal cual (sin controles interactivos dentro del botón).
const SlotRender = (p) => (p.fn ? p.fn(p.scope) : null)
</script>

<template>
  <button
    class="g-calendar__event"
    :class="{
      'g-calendar__event--sm': small,
      'g-calendar__event--open': seg.open,
      'is-selected': selected,
      'is-conflict': conflict
    }"
    type="button"
    :data-id="ev.id"
    :data-key="dataKey"
    :data-resource="resourceId"
    :data-color="ev.color"
    :data-type="ev.type"
    :data-status="status"
    :tabindex="natural ? undefined : tabStop ? 0 : -1"
    :aria-label="name"
  >
    <SlotRender v-if="ctx.slots.event" :fn="ctx.slots.event" :scope="scope" />
    <template v-else>
      <SlotRender v-if="ctx.slots['event-content']" :fn="ctx.slots['event-content']" :scope="scope" />
      <template v-else>
        <span class="g-calendar__event-title">{{ ev.title }}</span>
        <span v-if="timeText" class="g-calendar__event-time">{{ timeText }}</span>
      </template>
    </template>
  </button>
</template>
