<script setup>
import { ref } from 'vue'

const vista = ref('week')
const fecha = ref('2026-10-14T12:00')
const ahora = '2026-10-14T10:10'
const registro = ref('Arrastra una cita, cambia su duración o haz clic en un hueco.')
const at = (dia, hm) => `2026-10-${dia}T${hm}`
const recursos = [{ id: 'ruiz', title: 'Dra. Ruiz', subtitle: 'Consultorio 3' }]
const citas = ref([
  { id: 1, resourceId: 'ruiz', title: 'Consulta · Ana Torres', start: at(12, '09:00'), end: at(12, '09:45'), color: 'accent' },
  { id: 2, resourceId: 'ruiz', title: 'Revisión de estudios', start: at(13, '11:00'), end: at(13, '12:00'), color: 'success', status: 'tentative' },
  { id: 3, resourceId: 'ruiz', title: 'Consulta · Luis Peña', start: at(14, '09:30'), end: at(14, '10:30'), color: 'info' },
  { id: 4, resourceId: 'ruiz', title: 'Junta clínica', start: at(15, '13:00'), end: at(15, '14:30'), color: 'warning' },
  { id: 5, resourceId: 'ruiz', title: 'Consulta · Iris Cano', start: at(16, '10:00'), end: at(16, '10:30'), color: 'accent' }
])
const disponibilidad = [{ resourceId: 'ruiz', startTime: '09:00', endTime: '18:00', slotDuration: 30 }]
const bloqueos = [{ id: 'b1', resourceId: 'ruiz', start: at(14, '14:00'), end: at(14, '15:00'), reason: 'Comida' }]

const tz = 'America/Mexico_City'
const hm = (d) => new Intl.DateTimeFormat('es-MX', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
const textos = {
  calendar: 'Agenda del consultorio', previous: 'Anterior', next: 'Siguiente', today: 'Hoy', views: 'Vista', day: 'Día', week: 'Semana', month: 'Mes', timeline: 'Línea',
  resources: 'Recursos', allDay: 'Todo el día', now: 'ahora', noEvents: 'No hay citas en este periodo.', loading: 'Cargando', retry: 'Reintentar', close: 'Cerrar',
  tooManyResources: 'Demasiados recursos para columnas: usa la vista Línea.',
  moreEvents: (n) => `+${n} más`,
  outOfRange: (n, a, b) => `${n} cita(s) fuera del horario visible (${a}–${b})`,
  unavailable: (a, b, motivo) => `No disponible de ${a} a ${b}${motivo ? ', ' + motivo : ''}`,
  createEvent: (r, d, t) => `Crear cita con ${r ? r.title : ''} el ${d} a las ${t}`,
  monthDay: (d, n) => new Intl.DateTimeFormat('es-MX', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(d) + `, ${n} cita(s)`,
  eventName: (e, r, a, b, st) => `${e.title}, ${a}${b ? ' a ' + b : ''}${r ? ', ' + r.title : ''}${st ? ', ' + st : ''}`,
  openEnded: (a) => `desde las ${a}, sin hora final`,
  conflict: { overlap: 'Se traslapa con otra cita', blockedTime: 'El horario está bloqueado', outsideAvailability: 'Fuera del horario de atención', invalidDuration: 'Duración no válida', resourceConflict: 'Conflicto con otro recurso' },
  resourceStatus: { busyUntil: (h) => `Ocupado hasta ${h}`, available: 'Disponible', availableNext: (h) => `Disponible · siguiente cita ${h}`, blocked: 'Bloqueado', activeEvent: 'Ocupado · cita en curso' }
}

// El calendario emite solicitudes; la aplicación decide. Aquí se rechaza lo que cae en un bloqueo.
function mover({ event, newStart, newEnd, conflicts }) {
  if (conflicts.some((c) => c.type === 'blockedTime')) return (registro.value = `«${event.title}» no se movió: el horario está bloqueado.`)
  Object.assign(event, { start: newStart, end: newEnd })
  registro.value = `«${event.title}» ahora es de ${hm(newStart)} a ${hm(newEnd)}.`
}
function redimensionar({ event, newEnd }) {
  event.end = newEnd
  registro.value = `«${event.title}» termina a las ${hm(newEnd)}.`
}
function crear({ resourceId, start, end }) {
  const fin = end || new Date(start.getTime() + 30 * 60000)
  citas.value.push({ id: Date.now(), resourceId, title: 'Nueva cita', start, end: fin, color: 'brand' })
  registro.value = `Cita nueva de ${hm(start)} a ${hm(fin)}.`
}
</script>

<template>
  <div class="demo">
    <div class="marco">
      <g-calendar v-model:view="vista" v-model:date="fecha" :events="citas" :resources="recursos" :availability="disponibilidad" :blocks="bloqueos"
                  :timezone="tz" locale="es-MX" :now="ahora" :start-hour="8" :end-hour="19" :labels="textos" editable
                  @event-move-request="mover" @event-resize-request="redimensionar" @create-request="crear"></g-calendar>
    </div>
    <p role="status">{{ registro }}</p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.demo p { margin: 0; }
.marco { max-block-size: calc(var(--g-space-1) * 150); overflow: auto; }
</style>
