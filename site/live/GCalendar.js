// Ficha interactiva de GCalendar. Los controles salen de GCalendar.meta.json.
const E = (es, en) => ({ es, en })
const at = (dia, hm) => `2026-10-${dia}T${hm}`
const tz = 'America/Mexico_City'

// El calendario no trae textos: los pone la aplicación. Las funciones se escriben una vez como texto:
// el mismo texto se ejecuta en la ficha y se copia en el código, sin dependencias ocultas.
const fnSrc = (en) => {
  const loc = en ? 'en-US' : 'es-MX'
  return {
    moreEvents: '(n) => `+${n}`',
    outOfRange: en ? '(n, a, b) => `${n} appointment(s) outside the visible hours (${a}–${b})`' : '(n, a, b) => `${n} cita(s) fuera del horario visible (${a}–${b})`',
    unavailable: en ? "(a, b, motivo) => `Unavailable from ${a} to ${b}${motivo ? ', ' + motivo : ''}`" : "(a, b, motivo) => `No disponible de ${a} a ${b}${motivo ? ', ' + motivo : ''}`",
    createEvent: en ? "(r, d, h) => `Create appointment with ${r ? r.title : ''} on ${d} at ${h}`" : "(r, d, h) => `Crear cita con ${r ? r.title : ''} el ${d} a las ${h}`",
    monthDay: `(d, n) => new Intl.DateTimeFormat('${loc}', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long' }).format(d) + \`, \${n}\``,
    eventName: "(e, r, a, b, st) => `${e.title}, ${a}${b ? ' – ' + b : ''}${r ? ', ' + r.title : ''}${st ? ', ' + st : ''}`",
    openEnded: en ? '(a) => `from ${a}, no end time`' : '(a) => `desde las ${a}, sin hora final`'
  }
}
const textLabels = (en) => {
  const t = (a, b) => (en ? b : a)
  return {
    calendar: t('Agenda del consultorio', 'Clinic schedule'), previous: t('Anterior', 'Previous'), next: t('Siguiente', 'Next'), today: t('Hoy', 'Today'),
    views: t('Vista', 'View'), day: t('Día', 'Day'), week: t('Semana', 'Week'), month: t('Mes', 'Month'), timeline: t('Línea', 'Timeline'),
    resources: t('Recursos', 'Resources'), allDay: t('Todo el día', 'All day'), now: t('ahora', 'now'), noEvents: t('No hay citas en este periodo.', 'No appointments in this period.'),
    loading: t('Cargando', 'Loading'), retry: t('Reintentar', 'Retry'), close: t('Cerrar', 'Close'),
    tooManyResources: t('Demasiados recursos para columnas: usa la vista Línea.', 'Too many resources for columns: use the Timeline view.'),
    conflict: {
      overlap: t('Se traslapa con otra cita', 'Overlaps another appointment'), blockedTime: t('El horario está bloqueado', 'The time is blocked'),
      outsideAvailability: t('Fuera del horario de atención', 'Outside office hours'), invalidDuration: t('Duración no válida', 'Invalid duration'),
      resourceConflict: t('Conflicto con otro recurso', 'Conflict with another resource')
    }
  }
}
const resourceStatus = (en) => ({
  busyUntil: en ? '(h) => `Busy until ${h}`' : '(h) => `Ocupado hasta ${h}`',
  available: en ? "'Available'" : "'Disponible'",
  availableNext: en ? '(h) => `Available · next appointment ${h}`' : '(h) => `Disponible · siguiente cita ${h}`',
  blocked: en ? "'Blocked'" : "'Bloqueado'",
  activeEvent: en ? "'Busy · appointment in progress'" : "'Ocupado · cita en curso'"
})
const textosEs = {
  calendar: 'Agenda del consultorio',
  previous: 'Anterior',
  next: 'Siguiente',
  today: 'Hoy',
  views: 'Vista',
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
  timeline: 'Línea',
  resources: 'Recursos',
  allDay: 'Todo el día',
  now: 'ahora',
  noEvents: 'No hay citas en este periodo.',
  loading: 'Cargando',
  retry: 'Reintentar',
  close: 'Cerrar',
  tooManyResources: 'Demasiados recursos para columnas: usa la vista Línea.',
  moreEvents: (n) => `+${n}`,
  outOfRange: (n, a, b) => `${n} cita(s) fuera del horario visible (${a}–${b})`,
  unavailable: (a, b, motivo) => `No disponible de ${a} a ${b}${motivo ? ', ' + motivo : ''}`,
  createEvent: (r, d, h) => `Crear cita con ${r ? r.title : ''} el ${d} a las ${h}`,
  monthDay: (d, n) => new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long' }).format(d) + `, ${n}`,
  eventName: (e, r, a, b, st) => `${e.title}, ${a}${b ? ' – ' + b : ''}${r ? ', ' + r.title : ''}${st ? ', ' + st : ''}`,
  openEnded: (a) => `desde las ${a}, sin hora final`,
  conflict: {
    overlap: 'Se traslapa con otra cita',
    blockedTime: 'El horario está bloqueado',
    outsideAvailability: 'Fuera del horario de atención',
    invalidDuration: 'Duración no válida',
    resourceConflict: 'Conflicto con otro recurso'
  },
  resourceStatus: {
    busyUntil: (h) => `Ocupado hasta ${h}`,
    available: 'Disponible',
    availableNext: (h) => `Disponible · siguiente cita ${h}`,
    blocked: 'Bloqueado',
    activeEvent: 'Ocupado · cita en curso'
  }
}
const textosEn = {
  calendar: 'Clinic schedule',
  previous: 'Previous',
  next: 'Next',
  today: 'Today',
  views: 'View',
  day: 'Day',
  week: 'Week',
  month: 'Month',
  timeline: 'Timeline',
  resources: 'Resources',
  allDay: 'All day',
  now: 'now',
  noEvents: 'No appointments in this period.',
  loading: 'Loading',
  retry: 'Retry',
  close: 'Close',
  tooManyResources: 'Too many resources for columns: use the Timeline view.',
  moreEvents: (n) => `+${n}`,
  outOfRange: (n, a, b) => `${n} appointment(s) outside the visible hours (${a}–${b})`,
  unavailable: (a, b, motivo) => `Unavailable from ${a} to ${b}${motivo ? ', ' + motivo : ''}`,
  createEvent: (r, d, h) => `Create appointment with ${r ? r.title : ''} on ${d} at ${h}`,
  monthDay: (d, n) => new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'long', day: 'numeric', month: 'long' }).format(d) + `, ${n}`,
  eventName: (e, r, a, b, st) => `${e.title}, ${a}${b ? ' – ' + b : ''}${r ? ', ' + r.title : ''}${st ? ', ' + st : ''}`,
  openEnded: (a) => `from ${a}, no end time`,
  conflict: {
    overlap: 'Overlaps another appointment',
    blockedTime: 'The time is blocked',
    outsideAvailability: 'Outside office hours',
    invalidDuration: 'Invalid duration',
    resourceConflict: 'Conflict with another resource'
  },
  resourceStatus: {
    busyUntil: (h) => `Busy until ${h}`,
    available: 'Available',
    availableNext: (h) => `Available · next appointment ${h}`,
    blocked: 'Blocked',
    activeEvent: 'Busy · appointment in progress'
  }
}
const lit = (v, i = '') => `{\n${Object.entries(v).map(([k, x]) => `${i}  ${k}: ${typeof x === 'object' ? lit(x, i + '  ') : `'${String(x).replace(/'/g, "\\'")}'`}`).join(',\n')}\n${i}}`
const labelsCode = (en) => {
  const f = fnSrc(en)
  const rs = resourceStatus(en)
  const base = textLabels(en)
  const conflict = base.conflict
  const { conflict: _c, ...plain } = base
  const plainLines = Object.entries(plain).map(([k, v]) => `  ${k}: '${v.replace(/'/g, "\\'")}'`)
  const fnLines = Object.entries(f).map(([k, v]) => `  ${k}: ${v}`)
  return `{\n${[...plainLines, ...fnLines].join(',\n')},\n  conflict: ${lit(conflict, '  ')},\n  resourceStatus: {\n${Object.entries(rs).map(([k, v]) => `    ${k}: ${v}`).join(',\n')}\n  }\n}`
}

export default {
  // Las solicitudes de mover, redimensionar y crear las decide la aplicación; la ficha no las escucha para no fingir un guardado.
  exclude: ['id', 'label', 'resources', 'availability', 'blocks', 'events', 'labels', 'timezone', 'locale', 'now', 'selectedEventId', 'refreshInterval', 'draggable', 'resizable', 'editable', 'startHour', 'endHour', 'gridInterval', 'snapInterval', 'weekStartsOn', 'monthMaxVisibleEvents', 'error'],
  listen: false,
  block: true,
  model: { prop: 'date', value: '2026-10-14T12:00', var: 'fecha' },
  base: {
    events: [
      { id: 1, resourceId: 'ruiz', title: 'Consulta · Ana Torres', start: at(12, '09:00'), end: at(12, '09:45'), color: 'accent' },
      { id: 2, resourceId: 'ruiz', title: 'Revisión de estudios', start: at(13, '11:00'), end: at(13, '12:00'), color: 'success', status: 'tentative' },
      { id: 3, resourceId: 'ruiz', title: 'Consulta · Luis Peña', start: at(14, '09:30'), end: at(14, '10:30'), color: 'info' },
      { id: 4, resourceId: 'ruiz', title: 'Junta clínica', start: at(15, '13:00'), end: at(15, '14:30'), color: 'warning' },
      { id: 5, resourceId: 'ruiz', title: 'Consulta · Iris Cano', start: at(16, '10:00'), end: at(16, '10:30'), color: 'accent' }
    ],
    resources: [{ id: 'ruiz', title: 'Dra. Ruiz', subtitle: 'Consultorio 3' }],
    availability: [{ resourceId: 'ruiz', startTime: '09:00', endTime: '18:00', slotDuration: 30 }],
    blocks: [{ id: 'b1', resourceId: 'ruiz', start: at(14, '14:00'), end: at(14, '15:00'), reason: 'Comida' }],
    timezone: tz,
    locale: E('es-MX', 'en-US'),
    now: at(14, '10:10'),
    startHour: 8,
    endHour: 19,
    labels: { es: textosEs, en: textosEn }
  },
  code: { labels: ':labels="textos"' },
  script: {
    es: `// Los textos son de la aplicación: Grana no trae ninguno.\nconst textos = ${labelsCode(false)}`,
    en: `// The texts belong to the app: Grana ships none.\nconst textos = ${labelsCode(true)}`
  },
  cases: [
    {
      title: E('Agenda semanal de un consultorio', 'Weekly schedule of a clinic'),
      why: E('week con horario de atención y bloqueos: es la vista de trabajo diaria de quien atiende; con muchos recursos usa timeline.', 'week with office hours and blocks: the daily working view for whoever attends; with many resources use timeline.'),
      props: { view: 'week' }
    },
    {
      title: E('Vista de un solo día', 'Single-day view'),
      why: E('day cuando la persona planea una jornada hora por hora; para ver la carga del mes usa month.', 'day when planning one day hour by hour; to see the month load use month.'),
      props: { view: 'day', density: 'compact' }
    },
    {
      title: E('Panorama del mes', 'Month overview'),
      why: E('month resume cada día con sus citas y «+N más»; sirve para elegir una fecha, no para ajustar horas.', 'month sums up each day with its appointments and «+N more»; it helps pick a date, not adjust hours.'),
      props: { view: 'month' }
    },
    {
      title: E('Agenda en carga', 'Schedule loading'),
      why: E('loading mientras llegan las citas: la rejilla se mantiene y no salta al terminar.', 'loading while appointments arrive: the grid stays put and does not jump when done.'),
      props: { view: 'week', loading: true }
    },
    {
      title: E('Agenda de solo lectura', 'Read-only schedule'),
      why: E('readonly para una vista compartida: se puede mirar y abrir una cita, no moverla ni crear.', 'readonly for a shared view: appointments can be seen and opened, not moved or created.'),
      props: { view: 'week', readonly: true }
    }
  ]
}
