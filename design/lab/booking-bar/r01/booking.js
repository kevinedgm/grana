// Prototipo de kiwi (r01) de la consulta de reserva (propuesta GBookingBar) y del campo de grupo (propuesta GPartyField).
// NO es el .vue de bruno: es un banco para decidir estructura. Usa los componentes REALES de dist/ (GDatePicker, GNumberField,
// GTimeField, GSelect, GRadioGroup, GBtn) con Vue global y los tokens reales del tema por defecto. La barra, el campo de grupo,
// el popover genérico, la frase, el muelle y el conserje son del prototipo (booking.css: solo tokens).
// ?c=base|A|B|C  &t=hotel|restaurante|tour  &dir=rtl  &theme=dark  &state=disabled  &w=<px>  &today=YYYY-MM-DD
;(function () {
  const { createApp, ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount, defineComponent } = Vue
  const Q = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(Q.get('c')) ? Q.get('c') : 'base'
  const TPL = ['hotel', 'restaurante', 'tour'].includes(Q.get('t')) ? Q.get('t') : 'hotel'
  const DISABLED = Q.get('state') === 'disabled'
  if (Q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  if (Q.get('theme') === 'dark') document.documentElement.dataset.theme = 'dark'
  const LOCALE = 'es-MX'
  const TODAY = Q.get('today') || '2026-11-02'

  // ---------- fechas (ISO sin zona, como GDatePicker) ----------
  const toDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
  const toIso = (dt) => dt.toISOString().slice(0, 10)
  const addDays = (iso, n) => { const d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return toIso(d) }
  const diff = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000)
  const fShort = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
  const fLong = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  const fDay = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', timeZone: 'UTC' })
  const short = (iso) => fShort.format(toDate(iso)).replace(/\./g, '')
  const long = (iso) => fLong.format(toDate(iso))
  const range = (a, b) => {
    const A = toDate(a), B = toDate(b)
    if (A.getUTCMonth() === B.getUTCMonth()) return `${fDay.format(A)}–${short(b).replace(/^\S+\s/, '')}`
    return `${short(a).replace(/^\S+\s/, '')} – ${short(b).replace(/^\S+\s/, '')}`
  }
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`
  const time12 = (hm) => hm
  const uidN = { n: 0 }
  const uid = (p) => `${p}-${++uidN.n}`

  // ---------- Textos de la aplicación (Grana no trae textos por defecto, #226) ----------
  const DP_LABELS = {
    prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fechas', close: 'Cerrar', today: 'hoy', selected: 'elegida',
    rangeStart: 'llegada', rangeEnd: 'salida', rangeSingle: 'llegada y salida', inRange: 'en tu estancia', unavailable: 'sin disponibilidad',
    done: 'Listo', announceStart: 'Llegada {date}. Elige la salida.', announceEnd: 'Del {start} al {end}.', announceDate: '{date}.'
  }

  // ---------- Plantillas: el contenido lo pone la aplicación ----------
  const TOURS = [
    { value: 'hierve', label: 'Hierve el Agua y Mitla', description: 'Día completo · martes, jueves y sábado', days: [2, 4, 6] },
    { value: 'monte-alban', label: 'Monte Albán al amanecer', description: 'Medio día · todos los días', days: [0, 1, 2, 3, 4, 5, 6] },
    { value: 'mezcal', label: 'Ruta del mezcal', description: 'Día completo · viernes y domingo', days: [0, 5] },
  ]
  const SLOTS = ['13:30', '14:00', '14:30', '15:00', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30']
  const FULL = ['14:00', '20:30']
  const SOLD_OUT = [addDays(TODAY, 4), addDays(TODAY, 5), addDays(TODAY, 11)]
  const T = {
    hotel: { name: 'Casa Cantera', kicker: 'Hotel boutique · Centro de Oaxaca', photo: 'patio', title: 'Consulta disponibilidad', cta: 'Ver disponibilidad', offers: ['Suite Cantera', 'Habitación Patio', 'Estudio Azotea', 'Suite Jardín'], offerPhotos: ['habitacion', 'patio', 'cielo', 'monte-alban'] },
    restaurante: { name: 'Comal de Jalatlaco', kicker: 'Cocina oaxaqueña de temporada', photo: 'mole', title: 'Reserva una mesa', cta: 'Pedir mesa', offers: ['Menú de temporada', 'Mole negro', 'Barra de mezcal', 'Desayuno de domingo'], offerPhotos: ['mole', 'mercado', 'mezcal', 'patio'] },
    tour: { name: 'Rutas del Valle', kicker: 'Recorridos con guía local desde Oaxaca', photo: 'hierve', title: 'Consulta una fecha', cta: 'Consultar fecha', offers: ['Hierve el Agua y Mitla', 'Monte Albán al amanecer', 'Ruta del mezcal', 'Mercados del valle'], offerPhotos: ['hierve', 'monte-alban', 'mezcal', 'mercado'] },
  }

  // ---------- Estado único (lo que la aplicación tendría con v-model) ----------
  const S = reactive({
    hotel: { start: null, nights: null, adults: 2, children: 0, rooms: 1 },
    restaurante: { date: null, time: null, party: 2 },
    tour: { tour: null, date: null, adults: 2, children: 0 },
  })
  const errors = reactive({})
  const status = ref('idle') // idle | sending | sent
  const intents = []

  const hotelRange = computed({
    get: () => (S.hotel.start && S.hotel.nights ? { start: S.hotel.start, end: addDays(S.hotel.start, S.hotel.nights) } : null),
    set: (v) => { if (!v) { S.hotel.start = null; S.hotel.nights = null } else { S.hotel.start = v.start; S.hotel.nights = Math.max(1, diff(v.start, v.end)) } },
  })
  const tourOf = (v) => TOURS.find((t) => t.value === v)

  // Resúmenes legibles (lo que dice la barra en estrecho, el muelle y el conserje)
  const partyText = (t) => {
    if (t === 'restaurante') return S.restaurante.party ? plural(S.restaurante.party, 'persona', 'personas') : null
    const m = S[t]
    if (!m.adults) return null
    const p = [plural(m.adults, 'adulto', 'adultos')]
    if (m.children) p.push(plural(m.children, 'niño', 'niños'))
    if (t === 'hotel') p.push(plural(m.rooms || 1, 'habitación', 'habitaciones'))
    return p.join(' · ')
  }
  const whenText = (t) => {
    if (t === 'hotel') return hotelRange.value ? `${range(hotelRange.value.start, hotelRange.value.end)} · ${plural(S.hotel.nights, 'noche', 'noches')}` : null
    if (t === 'restaurante') return S.restaurante.date ? `${dayWord(S.restaurante.date)}${S.restaurante.time ? ' · ' + time12(S.restaurante.time) : ''}` : null
    return S.tour.date ? short(S.tour.date) : null
  }
  const dayWord = (iso) => (iso === TODAY ? 'hoy' : iso === addDays(TODAY, 1) ? 'mañana' : short(iso))
  const summary = (t) => [t === 'tour' && S.tour.tour ? tourOf(S.tour.tour).label : null, whenText(t), partyText(t)].filter(Boolean).join(' · ')
  // Con huecos: lo que falta se nombra («Sin fechas»), para que el resumen no parezca completo
  const summaryOpen = (t) => [t === 'tour' ? (S.tour.tour ? tourOf(S.tour.tour).label : 'Sin recorrido') : null, whenText(t) || (t === 'hotel' ? 'Sin fechas' : 'Sin fecha'), partyText(t) || 'Sin personas'].filter(Boolean).join(' · ')

  // Validación al enviar (WCAG 3.3.1, 3.3.3): mensajes que dicen qué hacer
  const validate = (t) => {
    Object.keys(errors).forEach((k) => delete errors[k])
    if (t === 'hotel') {
      if (!S.hotel.start) errors.dates = 'Elige las fechas de llegada y salida.'
      else if (!S.hotel.nights) errors.dates = 'Elige cuántas noches te quedas.'
      else {
        // Una noche agotada dentro de la estancia (la salida sí puede caer en un día agotado: esa noche no se duerme)
        const bad = Array.from({ length: S.hotel.nights }, (_, i) => addDays(S.hotel.start, i)).find((d) => SOLD_OUT.includes(d))
        if (bad) errors.dates = `No quedan habitaciones la noche del ${long(bad)}. Prueba otras fechas.`
      }
      if (!S.hotel.adults) errors.party = 'Indica al menos un adulto.'
    } else if (t === 'restaurante') {
      if (!S.restaurante.party) errors.party = 'Indica para cuántas personas.'
      if (!S.restaurante.date) errors.date = 'Elige el día.'
      if (!S.restaurante.time) errors.time = 'Elige la hora.'
    } else {
      if (!S.tour.tour) errors.tour = 'Elige el recorrido.'
      if (!S.tour.date) errors.date = 'Elige la fecha.'
      if (!S.tour.adults) errors.party = 'Indica al menos un adulto.'
    }
    return Object.keys(errors).length
  }
  // Objeto de intención: lo único que emite el componente (submit). La aplicación arma el enlace a su motor o a WhatsApp.
  const intent = (t) => {
    if (t === 'hotel') return { template: 'hotel', from: S.hotel.start, to: hotelRange.value.end, nights: S.hotel.nights, guests: { adults: S.hotel.adults, children: S.hotel.children }, rooms: S.hotel.rooms }
    if (t === 'restaurante') return { template: 'restaurante', date: S.restaurante.date, time: S.restaurante.time, guests: { adults: S.restaurante.party, children: 0 } }
    return { template: 'tour', tour: S.tour.tour, date: S.tour.date, guests: { adults: S.tour.adults, children: S.tour.children } }
  }

  // Región viva única de la página (en Grana: el canal cortés de liveRegion.js)
  const live = ref('')
  const announce = (msg) => { live.value = ''; requestAnimationFrame(() => requestAnimationFrame(() => { live.value = msg })) }

  const send = (t) => {
    status.value = 'idle'
    const n = validate(t)
    if (n) { announce(n === 1 ? 'Falta un dato: ' + Object.values(errors)[0] : `Faltan ${n} datos. ${Object.values(errors).join(' ')}`); return false }
    status.value = 'sending'
    const it = intent(t)
    setTimeout(() => { status.value = 'sent'; intents.push(it); announce(`Consulta lista: ${summary(t)}.`) }, 400)
    return true
  }
  const focusFirstInvalid = (root) => nextTick(() => {
    const el = root && root.querySelector('[aria-invalid="true"], [data-invalid]')
    if (!el) return
    // Si lo marcado es un grupo (radiogroup), el foco va a su opción elegida o a la primera
    const target = el.matches('button, input, select, textarea, [tabindex]') ? el : el.querySelector('input:checked, input:not([type=hidden]), button')
    ;(target || el).focus()
  })

  // ---------- Icono Lucide decorativo ----------
  const LabIcon = defineComponent({ props: { n: String }, template: '<span class="bk-ico" aria-hidden="true" v-html="svg"></span>', computed: { svg () { return window.lucide(this.n) } } })

  // ---------- Popover no modal genérico (APG: disclosure que abre un diálogo no modal) ----------
  // Abre con clic, Enter o Espacio; lleva el foco dentro; Esc cierra y devuelve el foco; salir con Tab o tocar fuera cierra sin robarlo.
  const LabPop = defineComponent({
    components: { LabIcon },
    props: { name: String, labelId: String, look: { type: String, default: 'box' }, invalid: Boolean, describedby: String, disabled: Boolean, icon: String },
    emits: ['close'],
    setup (props, { emit, expose }) {
      const open = ref(false), root = ref(null), btn = ref(null), panel = ref(null), dx = ref(0)
      const id = uid('pop')
      // Capa superior (popover="manual") colocada respecto al disparador: no la recorta ningún contenedor (como los paneles de Grana, #358)
      const place = () => {
        const p = panel.value, b = btn.value
        if (!p || !b || !open.value) return
        const r = b.getBoundingClientRect(), vw = document.documentElement.clientWidth, vh = window.innerHeight, m = 8
        if (r.bottom < 0 || r.top > vh) { close(false); return }
        p.style.maxBlockSize = ''
        const w = p.offsetWidth, h = p.offsetHeight
        const rtl = getComputedStyle(b).direction === 'rtl'
        let x = rtl ? r.right - w : r.left
        x = Math.max(m, Math.min(x, vw - m - w))
        const below = vh - r.bottom - m, above = r.top - m
        let y
        if (h <= below || below >= above) { y = r.bottom + 4; if (h > below) p.style.maxBlockSize = below - 4 + 'px' } else { y = Math.max(m, r.top - 4 - Math.min(h, above)); if (h > above) p.style.maxBlockSize = above - 4 + 'px' }
        p.style.setProperty('--_x', Math.round(x) + 'px'); p.style.setProperty('--_y', Math.round(y) + 'px')
      }
      const onMove = () => place()
      const show = async () => {
        open.value = true
        await nextTick()
        panel.value.showPopover(); place()
        window.addEventListener('scroll', onMove, true); window.addEventListener('resize', onMove)
        const f = panel.value.querySelector('input:not([type=hidden]):not([disabled]), button:not([disabled]), [tabindex="0"]')
        f && f.focus()
      }
      const close = (focus = true) => {
        if (!open.value) return
        open.value = false
        window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove)
        try { panel.value.hidePopover() } catch {}
        emit('close')
        if (focus) nextTick(() => btn.value && btn.value.focus())
      }
      const toggle = () => (open.value ? close() : show())
      const onKey = (e) => { if (e.key === 'Escape' && open.value) { e.stopPropagation(); e.preventDefault(); close(true) } }
      // Salir con Tab cierra. relatedTarget no basta: en WebKit el Tab salta los botones y el foco puede irse al navegador (null)
      let pressedAt = -1e9 // un toque dentro del panel (en una zona no enfocable) no lo cierra
      const onOut = (e) => {
        if (e.relatedTarget && root.value && !root.value.contains(e.relatedTarget)) { close(false); return }
        setTimeout(() => { if (open.value && performance.now() - pressedAt > 500 && root.value && !root.value.contains(document.activeElement)) close(false) }, 0)
      }
      const onDoc = (e) => {
        if (root.value && root.value.contains(e.target)) { pressedAt = performance.now(); return }
        if (open.value) close(false)
      }
      onMounted(() => document.addEventListener('pointerdown', onDoc, true))
      onBeforeUnmount(() => { document.removeEventListener('pointerdown', onDoc, true); window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove) })
      expose({ close, show, btn })
      return { open, root, btn, panel, dx, id, toggle, close, onKey, onOut }
    },
    template: `
<span ref="root" class="bk-pop" :class="'bk-pop--' + look" @keydown="onKey" @focusout="onOut">
  <button ref="btn" type="button" class="bk-trigger" :class="['bk-trigger--' + look, { 'is-open': open }]" :disabled="disabled"
    aria-haspopup="dialog" :aria-expanded="String(open)" :aria-controls="id" :aria-labelledby="labelId + ' ' + id + '-v'"
    :aria-describedby="describedby || null" :aria-invalid="invalid ? 'true' : null" @click="toggle">
    <lab-icon v-if="icon" :n="icon" />
    <span :id="id + '-v'" class="bk-trigger__value" dir="auto"><slot name="value" /></span>
    <lab-icon n="chevron-down" class="bk-trigger__chev" />
  </button>
  <div ref="panel" :id="id" class="bk-panel" role="dialog" :aria-label="name" popover="manual">
    <slot :close="close" />
  </div>
</span>`
  })

  // ---------- Campo de grupo (propuesta GPartyField): cantidades por tipo con − n + ----------
  // mode: field (caja + popover) · inline (filas a la vista, para la hoja) · blank (hueco de la frase)
  const LabParty = defineComponent({
    components: { LabPop },
    props: { t: String, mode: { type: String, default: 'field' }, label: { type: String, default: 'Huéspedes' }, error: String, disabled: Boolean },
    setup (props) {
      const lid = uid('party-l'), eid = uid('party-e')
      const m = computed(() => S[props.t])
      const rows = computed(() => {
        const r = [
          { key: 'adults', label: 'Adultos', hint: '13 años o más', min: 1, max: 12, dec: 'Quitar un adulto', inc: 'Añadir un adulto' },
          { key: 'children', label: 'Niños', hint: 'De 0 a 12 años', min: 0, max: 6, dec: 'Quitar un niño', inc: 'Añadir un niño' },
        ]
        if (props.t === 'hotel') r.push({ key: 'rooms', label: 'Habitaciones', hint: 'Hasta una por adulto', min: 1, max: Math.max(1, m.value.adults || 1), dec: 'Quitar una habitación', inc: 'Añadir una habitación' })
        return r
      })
      // Regla del grupo: nunca más habitaciones que adultos (la cifra se corrige y se dice en la ayuda)
      watch(() => m.value.adults, (a) => { if (props.t === 'hotel' && a && m.value.rooms > a) m.value.rooms = a })
      const text = computed(() => partyText(props.t))
      const set = (k, v) => { m.value[k] = v }
      return { lid, eid, m, rows, text, set }
    },
    template: `
<component :is="mode === 'blank' ? 'span' : 'div'" class="bk-f bk-f--party" :class="'bk-f--' + mode">
  <template v-if="mode === 'inline'">
    <fieldset class="bk-group" :aria-describedby="error ? eid : null">
      <legend class="bk-label">{{ label }}</legend>
      <div class="bk-rows">
        <g-number-field v-for="r in rows" :key="r.key" :label="r.label" :hint="r.hint" :min="r.min" :max="r.max" steppers
          :decrement-label="r.dec" :increment-label="r.inc" :model-value="m[r.key]" @update:model-value="set(r.key, $event)" :disabled="disabled" />
      </div>
    </fieldset>
    <p v-if="error" :id="eid" class="bk-msg">{{ error }}</p>
  </template>
  <template v-else>
    <span :id="lid" :class="mode === 'blank' ? 'bk-sr' : 'bk-label'">{{ label }}</span>
    <lab-pop :name="label" :label-id="lid" :look="mode === 'blank' ? 'blank' : 'box'" :icon="mode === 'blank' ? null : 'users'" :invalid="!!error" :describedby="error ? eid : null" :disabled="disabled">
      <template #value>{{ text || (mode === 'blank' ? '¿cuántos?' : 'Elige') }}</template>
      <template #default="{ close }">
        <div class="bk-rows">
          <g-number-field v-for="r in rows" :key="r.key" :label="r.label" :hint="r.hint" :min="r.min" :max="r.max" steppers
            :decrement-label="r.dec" :increment-label="r.inc" :model-value="m[r.key]" @update:model-value="set(r.key, $event)" />
        </div>
        <div class="bk-panel__foot"><g-btn size="sm" variant="soft" color="neutral" @click="close()">Listo</g-btn></div>
      </template>
    </lab-pop>
    <p v-if="error && mode !== 'blank'" :id="eid" class="bk-msg">{{ error }}</p>
    <span v-else-if="error" :id="eid" class="bk-sr">{{ error }}</span>
  </template>
</component>`
  })

  // ---------- Base: la barra funcional (propuesta GBookingBar) ----------
  const LabBar = defineComponent({
    components: { LabParty, LabIcon },
    props: { t: String },
    setup (props, { expose }) {
      const form = ref(null), row = ref(null), sheet = ref(null), sumBtn = ref(null)
      const hid = uid('bar-h'), sid = uid('bar-s'), shid = uid('sheet-h'), deid = uid('dates-e')
      const compact = ref(false), sheetOpen = ref(false)
      let need = 0, ro = null
      const tpl = computed(() => T[props.t])
      const measure = () => {
        const f = form.value
        if (!f) return
        if (!compact.value && row.value) {
          if (row.value.scrollWidth > row.value.clientWidth + 1) { need = row.value.scrollWidth; compact.value = true }
        } else if (compact.value && need && f.clientWidth >= need + 2) { compact.value = false; nextTick(measure) }
      }
      // El cambio de forma va fuera de la llamada del observador (si no, WebKit avisa «ResizeObserver loop»)
      let raf = 0
      onMounted(() => { ro = new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure) }); ro.observe(form.value); nextTick(measure) })
      onBeforeUnmount(() => ro && ro.disconnect())
      const openSheet = () => { sheetOpen.value = true; nextTick(() => { sheet.value.showModal(); const f = sheet.value.querySelector('.bk-sheet__body button:not([disabled]), .bk-sheet__body input:not([type=hidden])'); f && f.focus() }) }
      const closeSheet = () => { if (sheet.value && sheet.value.open) sheet.value.close() }
      const onSheetClose = () => { sheetOpen.value = false; const b = document.querySelector('[data-bk-return]') || sumBtn.value; nextTick(() => { b && b.focus(); document.querySelectorAll('[data-bk-return]').forEach((x) => x.removeAttribute('data-bk-return')) }) }
      const submit = () => {
        const ok = send(props.t)
        if (!ok) {
          if (compact.value && !sheetOpen.value) { openSheet(); nextTick(() => focusFirstInvalid(sheet.value)) } else focusFirstInvalid(sheetOpen.value ? sheet.value : form.value)
          return
        }
        closeSheet()
      }
      const restDate = computed({ get: () => S.restaurante.date, set: (v) => { S.restaurante.date = v } })
      const tourDays = computed(() => (S.tour.tour ? tourOf(S.tour.tour).days : null))
      const dateDisabledTour = (iso) => !!tourDays.value && !tourDays.value.includes(toDate(iso).getUTCDay())
      const soldOut = (iso) => SOLD_OUT.includes(iso)
      const slotOptions = SLOTS.map((s) => ({ value: s, label: FULL.includes(s) ? `${s} · lleno` : s, disabled: FULL.includes(s) }))
      expose({ openSheet, submit, sumBtn })
      return { form, row, sheet, sumBtn, hid, sid, shid, deid, compact, sheetOpen, tpl, openSheet, closeSheet, onSheetClose, submit, S, errors, status, summary, summaryOpen, hotelRange, restDate, TOURS, dateDisabledTour, soldOut, slotOptions, DP_LABELS, TODAY, DISABLED, addDays }
    },
    template: `
<form ref="form" class="bk-bar" role="search" :aria-labelledby="hid" novalidate @submit.prevent="submit" :data-compact="compact ? '' : null">
  <h2 :id="hid" class="bk-bar__title">{{ tpl.title }}</h2>
  <!-- Ocultos: el estado viaja también como envío nativo (la aplicación pone action/method hacia su motor) -->
  <template v-if="t === 'hotel'"><input type="hidden" name="from" :value="S.hotel.start || ''"><input type="hidden" name="to" :value="hotelRange ? hotelRange.end : ''"><input type="hidden" name="adults" :value="S.hotel.adults || ''"><input type="hidden" name="children" :value="S.hotel.children || 0"><input type="hidden" name="rooms" :value="S.hotel.rooms || 1"></template>
  <template v-else-if="t === 'restaurante'"><input type="hidden" name="date" :value="S.restaurante.date || ''"><input type="hidden" name="time" :value="S.restaurante.time || ''"><input type="hidden" name="party" :value="S.restaurante.party || ''"></template>
  <template v-else><input type="hidden" name="tour" :value="S.tour.tour || ''"><input type="hidden" name="date" :value="S.tour.date || ''"><input type="hidden" name="adults" :value="S.tour.adults || ''"><input type="hidden" name="children" :value="S.tour.children || 0"></template>

  <div v-if="!compact" ref="row" class="bk-row">
    <template v-if="t === 'hotel'">
      <div class="bk-f bk-f--dates"><g-date-picker mode="range" split label-start="Llegada" label-end="Salida" placeholder-start="Elige" placeholder-end="Elige"
        v-model="hotelRange" :min="TODAY" :disabled-dates="soldOut" :labels="DP_LABELS" :error="errors.dates" :disabled="DISABLED" block /></div>
      <lab-party t="hotel" :error="errors.party" :disabled="DISABLED" />
    </template>
    <template v-else-if="t === 'restaurante'">
      <div class="bk-f bk-f--date"><g-date-picker label="Día" placeholder="Elige" v-model="restDate" :min="TODAY" :labels="DP_LABELS" :error="errors.date" :disabled="DISABLED" block /></div>
      <div class="bk-f bk-f--time"><g-time-field label="Hora" v-model="S.restaurante.time" min="13:30" max="21:30" :step="30" :labels="{ invalid: 'Escribe una hora, por ejemplo 20:30' }" :error="errors.time" :disabled="DISABLED" /></div>
      <div class="bk-f bk-f--count"><g-number-field label="Personas" v-model="S.restaurante.party" :min="1" :max="12" steppers decrement-label="Quitar una persona" increment-label="Añadir una persona" :error="errors.party" :disabled="DISABLED" /></div>
    </template>
    <template v-else>
      <div class="bk-f bk-f--tour"><g-select label="Recorrido" placeholder="Elige" v-model="S.tour.tour" :options="TOURS.map(o => ({ value: o.value, label: o.label }))" :error="errors.tour" :disabled="DISABLED" block /></div>
      <div class="bk-f bk-f--date"><g-date-picker label="Fecha" placeholder="Elige" v-model="S.tour.date" :min="TODAY" :disabled-dates="dateDisabledTour" :labels="DP_LABELS" :error="errors.date" :disabled="DISABLED" block /></div>
      <lab-party t="tour" label="Personas" :error="errors.party" :disabled="DISABLED" />
    </template>
    <div class="bk-f bk-f--submit"><g-btn type="submit" size="md" :loading="status === 'sending'" loading-text="Consultando disponibilidad" :disabled="DISABLED" :aria-describedby="sid">{{ tpl.cta }}</g-btn></div>
  </div>

  <!-- Estrecho: la barra no se parte en dos filas; se vuelve un resumen que abre la hoja -->
  <div v-else class="bk-compact">
    <button ref="sumBtn" type="button" class="bk-compact__sum" aria-haspopup="dialog" :aria-expanded="String(sheetOpen)" :aria-describedby="Object.keys(errors).length ? deid : null" @click="openSheet" :disabled="DISABLED">
      <lab-icon n="calendar" />
      <span class="bk-compact__text"><span class="bk-compact__k">Tu consulta</span><span class="bk-compact__v" dir="auto">{{ summaryOpen(t) }}</span></span>
      <span class="bk-compact__edit">Cambiar</span>
    </button>
    <g-btn type="submit" :loading="status === 'sending'" loading-text="Consultando disponibilidad" :disabled="DISABLED" block>{{ tpl.cta }}</g-btn>
    <p v-if="Object.keys(errors).length && !sheetOpen" :id="deid" class="bk-msg">{{ Object.values(errors).join(' ') }}</p>
  </div>

  <p :id="sid" class="bk-summary" :class="{ 'bk-sr': compact }">{{ summaryOpen(t) }}</p>

  <dialog ref="sheet" class="bk-sheet" :aria-labelledby="shid" @close="onSheetClose">
    <template v-if="sheetOpen">
      <div class="bk-sheet__head"><h2 :id="shid" class="bk-sheet__title">{{ tpl.title }}</h2>
        <g-btn icon variant="ghost" color="neutral" aria-label="Cerrar" @click="closeSheet"><lab-icon n="x" /></g-btn></div>
      <div class="bk-sheet__body">
        <template v-if="t === 'hotel'">
          <div class="bk-group" role="group" aria-labelledby="bk-sheet-dates" :aria-describedby="errors.dates ? deid + '-s' : null" tabindex="-1" :data-invalid="errors.dates ? '' : null">
            <span id="bk-sheet-dates" class="bk-label">Fechas</span>
            <g-date-picker inline mode="range" v-model="hotelRange" :min="TODAY" :disabled-dates="soldOut" :labels="DP_LABELS" months="1" />
            <p v-if="errors.dates" :id="deid + '-s'" class="bk-msg">{{ errors.dates }}</p>
          </div>
          <lab-party t="hotel" mode="inline" :error="errors.party" />
        </template>
        <template v-else-if="t === 'restaurante'">
          <div class="bk-group" role="group" aria-labelledby="bk-sheet-date" :aria-describedby="errors.date ? deid + '-s' : null" tabindex="-1" :data-invalid="errors.date ? '' : null">
            <span id="bk-sheet-date" class="bk-label">Día</span>
            <g-date-picker inline v-model="restDate" :min="TODAY" :labels="DP_LABELS" months="1" />
            <p v-if="errors.date" :id="deid + '-s'" class="bk-msg">{{ errors.date }}</p>
          </div>
          <g-radio-group label="Hora" appearance="chip" v-model="S.restaurante.time" :options="slotOptions" :error="errors.time" />
          <g-number-field label="Personas" v-model="S.restaurante.party" :min="1" :max="12" steppers decrement-label="Quitar una persona" increment-label="Añadir una persona" :error="errors.party" />
        </template>
        <template v-else>
          <g-radio-group label="Recorrido" v-model="S.tour.tour" :options="TOURS" :error="errors.tour" />
          <div class="bk-group" role="group" aria-labelledby="bk-sheet-date" :aria-describedby="errors.date ? deid + '-s' : null" tabindex="-1" :data-invalid="errors.date ? '' : null">
            <span id="bk-sheet-date" class="bk-label">Fecha</span>
            <g-date-picker inline v-model="S.tour.date" :min="TODAY" :disabled-dates="dateDisabledTour" :labels="DP_LABELS" months="1" />
            <p v-if="errors.date" :id="deid + '-s'" class="bk-msg">{{ errors.date }}</p>
          </div>
          <lab-party t="tour" mode="inline" label="Personas" :error="errors.party" />
        </template>
      </div>
      <div class="bk-sheet__foot"><p class="bk-summary" aria-hidden="true">{{ summaryOpen(t) }}</p>
        <g-btn type="submit" block :loading="status === 'sending'" loading-text="Consultando disponibilidad">{{ tpl.cta }}</g-btn></div>
    </template>
  </dialog>
</form>`
  })

  // ---------- A · La frase: la consulta se escribe como se dice ----------
  const LabSentence = defineComponent({
    components: { LabPop, LabParty, LabIcon },
    props: { t: String },
    setup (props) {
      const form = ref(null)
      const hid = uid('s-h')
      const L = { date: uid('l-date'), nights: uid('l-nights'), time: uid('l-time'), tour: uid('l-tour'), when: uid('l-when'), party: uid('l-party') }
      const E = { dates: uid('e-dates'), date: uid('e-date'), time: uid('e-time'), tour: uid('e-tour') }
      const tpl = computed(() => T[props.t])
      const nights = computed({ get: () => S.hotel.nights, set: (v) => { S.hotel.nights = v } })
      const startIso = computed({ get: () => S.hotel.start, set: (v) => { S.hotel.start = v } })
      const restDay = computed({ get: () => (S.restaurante.date === TODAY || S.restaurante.date === addDays(TODAY, 1) ? S.restaurante.date : S.restaurante.date ? 'otro' : null), set: (v) => { if (v === 'otro') { otherDay.value = true; if (S.restaurante.date === TODAY || S.restaurante.date === addDays(TODAY, 1)) S.restaurante.date = null } else { otherDay.value = false; S.restaurante.date = v } } })
      const otherDay = ref(false)
      const dayOptions = [{ value: TODAY, label: 'Hoy' }, { value: addDays(TODAY, 1), label: 'Mañana' }, { value: 'otro', label: 'Otro día' }]
      const slotOptions = SLOTS.map((s) => ({ value: s, label: FULL.includes(s) ? `${s} · lleno` : s, disabled: FULL.includes(s) }))
      const tourDays = computed(() => (S.tour.tour ? tourOf(S.tour.tour).days : null))
      const dateDisabledTour = (iso) => !!tourDays.value && !tourDays.value.includes(toDate(iso).getUTCDay())
      const soldOut = (iso) => SOLD_OUT.includes(iso)
      const submit = () => { if (!send(props.t)) focusFirstInvalid(form.value) }
      const errList = computed(() => Object.values(errors))
      return { form, hid, L, E, tpl, S, errors, status, nights, startIso, restDay, otherDay, dayOptions, slotOptions, TOURS, tourOf, dateDisabledTour, soldOut, submit, errList, short, long, addDays, dayWord, plural, hotelRange, DP_LABELS, TODAY, DISABLED }
    },
    template: `
<form ref="form" class="bk-sentence-form" role="search" :aria-labelledby="hid" novalidate @submit.prevent="submit">
  <h2 :id="hid" class="bk-bar__title">{{ tpl.title }}</h2>
  <p class="bk-sentence">
    <template v-if="t === 'hotel'">
      Llego el
      <span :id="L.date" class="bk-sr">Llegada</span>
      <g-date-picker v-model="startIso" :min="TODAY" :disabled-dates="soldOut" :labels="DP_LABELS" :disabled="DISABLED">
        <template #trigger="{ id, expanded, controls, toggle, text }">
          <button type="button" :id="id" class="bk-trigger bk-trigger--blank" aria-haspopup="dialog" :aria-expanded="String(expanded)" :aria-controls="controls"
            :aria-labelledby="L.date + ' ' + id + '-v'" :aria-invalid="errors.dates && !S.hotel.start ? 'true' : null" :aria-describedby="errors.dates && !S.hotel.start ? E.dates : null" :disabled="DISABLED" @click="toggle">
            <span :id="id + '-v'" class="bk-trigger__value" dir="auto">{{ S.hotel.start ? short(S.hotel.start) : '¿qué día?' }}</span><lab-icon n="chevron-down" class="bk-trigger__chev" /></button>
        </template>
      </g-date-picker>,
      me quedo
      <span :id="L.nights" class="bk-sr">Noches</span>
      <lab-pop name="Noches" :label-id="L.nights" look="blank" :invalid="!!(errors.dates && S.hotel.start)" :describedby="errors.dates && S.hotel.start ? E.dates : null" :disabled="DISABLED">
        <template #value>{{ nights ? plural(nights, 'noche', 'noches') : '¿cuántas noches?' }}</template>
        <template #default="{ close }">
          <g-number-field label="Noches" :hint="S.hotel.start && nights ? 'Salida: ' + long(addDays(S.hotel.start, nights)) : 'De 1 a 30'" v-model="nights" :min="1" :max="30" steppers decrement-label="Una noche menos" increment-label="Una noche más" />
          <div class="bk-panel__foot"><g-btn size="sm" variant="soft" color="neutral" @click="close()">Listo</g-btn></div>
        </template>
      </lab-pop>
      y somos
      <lab-party t="hotel" mode="blank" label="Huéspedes" :error="errors.party" :disabled="DISABLED" />.
    </template>
    <template v-else-if="t === 'restaurante'">
      Mesa para
      <span :id="L.party" class="bk-sr">Personas</span>
      <lab-pop name="Personas" :label-id="L.party" look="blank" :invalid="!!errors.party" :disabled="DISABLED">
        <template #value>{{ S.restaurante.party ? plural(S.restaurante.party, 'persona', 'personas') : '¿cuántos?' }}</template>
        <template #default="{ close }">
          <g-number-field label="Personas" hint="Para más de 12, escríbenos" v-model="S.restaurante.party" :min="1" :max="12" steppers decrement-label="Quitar una persona" increment-label="Añadir una persona" />
          <div class="bk-panel__foot"><g-btn size="sm" variant="soft" color="neutral" @click="close()">Listo</g-btn></div>
        </template>
      </lab-pop>
      <span :id="L.when" class="bk-sr">Día</span>
      <lab-pop name="Día" :label-id="L.when" look="blank" :invalid="!!errors.date" :describedby="errors.date ? E.date : null" :disabled="DISABLED">
        <template #value>{{ S.restaurante.date ? dayWord(S.restaurante.date) : '¿qué día?' }}</template>
        <template #default="{ close }">
          <g-radio-group label="Día" appearance="chip" v-model="restDay" :options="dayOptions" />
          <g-date-picker v-if="otherDay || restDay === 'otro'" inline v-model="S.restaurante.date" :min="TODAY" :labels="DP_LABELS" months="1" />
          <div class="bk-panel__foot"><g-btn size="sm" variant="soft" color="neutral" @click="close()">Listo</g-btn></div>
        </template>
      </lab-pop>
      a las
      <span :id="L.time" class="bk-sr">Hora</span>
      <lab-pop name="Hora" :label-id="L.time" look="blank" :invalid="!!errors.time" :describedby="errors.time ? E.time : null" :disabled="DISABLED">
        <template #value>{{ S.restaurante.time || '¿qué hora?' }}</template>
        <template #default="{ close }">
          <g-radio-group label="Hora" hint="Las horas llenas no se pueden elegir" appearance="chip" v-model="S.restaurante.time" :options="slotOptions" />
          <div class="bk-panel__foot"><g-btn size="sm" variant="soft" color="neutral" @click="close()">Listo</g-btn></div>
        </template>
      </lab-pop>.
    </template>
    <template v-else>
      Quiero ir a
      <span :id="L.tour" class="bk-sr">Recorrido</span>
      <lab-pop name="Recorrido" :label-id="L.tour" look="blank" :invalid="!!errors.tour" :describedby="errors.tour ? E.tour : null" :disabled="DISABLED">
        <template #value>{{ S.tour.tour ? tourOf(S.tour.tour).label : '¿qué recorrido?' }}</template>
        <template #default="{ close }">
          <g-radio-group label="Recorrido" v-model="S.tour.tour" :options="TOURS" />
          <div class="bk-panel__foot"><g-btn size="sm" variant="soft" color="neutral" @click="close()">Listo</g-btn></div>
        </template>
      </lab-pop>
      el
      <span :id="L.date" class="bk-sr">Fecha</span>
      <g-date-picker v-model="S.tour.date" :min="TODAY" :disabled-dates="dateDisabledTour" :labels="DP_LABELS" :disabled="DISABLED">
        <template #trigger="{ id, expanded, controls, toggle }">
          <button type="button" :id="id" class="bk-trigger bk-trigger--blank" aria-haspopup="dialog" :aria-expanded="String(expanded)" :aria-controls="controls"
            :aria-labelledby="L.date + ' ' + id + '-v'" :aria-invalid="errors.date ? 'true' : null" :aria-describedby="errors.date ? E.date : null" :disabled="DISABLED" @click="toggle">
            <span :id="id + '-v'" class="bk-trigger__value" dir="auto">{{ S.tour.date ? short(S.tour.date) : '¿qué día?' }}</span><lab-icon n="chevron-down" class="bk-trigger__chev" /></button>
        </template>
      </g-date-picker>
      y somos
      <lab-party t="tour" mode="blank" label="Personas" :error="errors.party" :disabled="DISABLED" />.
    </template>
  </p>
  <p v-if="t === 'hotel' && S.hotel.start && nights" class="bk-sentence__aside">Salida el {{ long(addDays(S.hotel.start, nights)) }}.</p>
  <ul v-if="errList.length" class="bk-errors">
    <li v-if="errors.dates" :id="E.dates" class="bk-msg">{{ errors.dates }}</li>
    <li v-if="errors.date" :id="E.date" class="bk-msg">{{ errors.date }}</li>
    <li v-if="errors.time" :id="E.time" class="bk-msg">{{ errors.time }}</li>
    <li v-if="errors.tour" :id="E.tour" class="bk-msg">{{ errors.tour }}</li>
    <li v-if="errors.party" class="bk-msg">{{ errors.party }}</li>
  </ul>
  <div class="bk-sentence__cta"><g-btn type="submit" size="lg" :loading="status === 'sending'" loading-text="Consultando disponibilidad" :disabled="DISABLED">{{ tpl.cta }}</g-btn></div>
</form>`
  })

  // ---------- C · El conserje: una pregunta a la vez; lo respondido queda como renglón que se puede cambiar ----------
  const LabConcierge = defineComponent({
    components: { LabIcon },
    props: { t: String },
    setup (props) {
      const form = ref(null), hid = uid('c-h')
      const editing = ref(null)
      const tpl = computed(() => T[props.t])
      const otherDay = ref(false)
      const qs = computed(() => {
        if (props.t === 'hotel') return [
          { key: 'dates', q: '¿Cuándo llegas y cuándo te vas?', short: 'Fechas', done: () => !!hotelRange.value, answer: () => whenText('hotel') },
          { key: 'party', q: '¿Quiénes vienen?', short: 'Huéspedes', done: () => confirmed.party, answer: () => partyText('hotel') },
        ]
        if (props.t === 'restaurante') return [
          { key: 'party', q: '¿Para cuántas personas?', short: 'Personas', done: () => confirmed.party, answer: () => partyText('restaurante') },
          { key: 'date', q: '¿Qué día?', short: 'Día', done: () => !!S.restaurante.date && confirmed.date, answer: () => dayWord(S.restaurante.date) },
          { key: 'time', q: '¿A qué hora?', short: 'Hora', done: () => !!S.restaurante.time && confirmed.time, answer: () => S.restaurante.time },
        ]
        return [
          { key: 'tour', q: '¿Qué recorrido te interesa?', short: 'Recorrido', done: () => !!S.tour.tour && confirmed.tour, answer: () => tourOf(S.tour.tour).label },
          { key: 'date', q: '¿Qué día?', short: 'Fecha', done: () => !!S.tour.date && confirmed.date, answer: () => short(S.tour.date) },
          { key: 'party', q: '¿Quiénes vienen?', short: 'Personas', done: () => confirmed.party, answer: () => partyText('tour') },
        ]
      })
      const confirmed = reactive({ party: false, date: false, time: false, tour: false, dates: false })
      // La pregunta que se ve: la que se edita o la primera sin responder; las anteriores son renglones
      const current = computed(() => { if (editing.value != null) return editing.value; const i = qs.value.findIndex((q) => !q.done()); return i === -1 ? qs.value.length : i })
      const shown = computed(() => qs.value.slice(0, Math.max(current.value + 1, qs.value.filter((q) => q.done()).length)))
      const commit = (key, extra) => {
        if (key in confirmed) confirmed[key] = true
        editing.value = null
        nextTick(() => {
          const i = current.value
          const ans = qs.value.find((q) => q.key === key).answer()
          if (i < qs.value.length) {
            const hEl = form.value.querySelector(`[data-q="${qs.value[i].key}"] .bk-q__title`)
            hEl && hEl.focus()
            announce(`${ans}. Siguiente: ${qs.value[i].q}`)
          } else {
            const f = form.value.querySelector('.bk-final__title'); f && f.focus()
            announce(`${ans}. Listo: ${summary(props.t)}.`)
          }
        })
      }
      const edit = (i) => { editing.value = i; nextTick(() => { const hEl = form.value.querySelector(`[data-q="${qs.value[i].key}"] .bk-q__title`); hEl && hEl.focus() }) }
      const days = [0, 1, 2, 3, 4, 5].map((n) => addDays(TODAY, n))
      const tourDays = computed(() => (S.tour.tour ? tourOf(S.tour.tour).days : null))
      const dateDisabledTour = (iso) => !!tourDays.value && !tourDays.value.includes(toDate(iso).getUTCDay())
      const soldOut = (iso) => SOLD_OUT.includes(iso)
      const onRange = (v) => { hotelRange.value = v; if (v) commit('dates') }
      const pickTourDate = (v) => { S.tour.date = v; if (v) commit('date') }
      const pickDate = (v) => { S.restaurante.date = v; commit('date') }
      const submit = () => { if (!send(props.t)) { const i = qs.value.findIndex((q) => !q.done()); if (i > -1) edit(i) } }
      return { form, hid, tpl, qs, shown, current, editing, commit, edit, confirmed, S, days, dayWord, short, otherDay, TOURS, FULL, SLOTS, tourOf, dateDisabledTour, soldOut, onRange, pickTourDate, pickDate, submit, summary, status, hotelRange, DP_LABELS, TODAY, DISABLED, errors }
    },
    template: `
<form ref="form" class="bk-concierge" role="search" :aria-labelledby="hid" novalidate @submit.prevent="submit">
  <h2 :id="hid" class="bk-bar__title">{{ tpl.title }}</h2>
  <p class="bk-concierge__intro">{{ qs.length === 2 ? 'Dos preguntas' : 'Tres preguntas' }}. Puedes cambiar cada respuesta.</p>
  <ol class="bk-steps">
    <li v-for="(q, i) in shown" :key="q.key" class="bk-step" :data-q="q.key">
      <div v-if="i !== current && q.done()" class="bk-answer">
        <span class="bk-answer__k">{{ q.short }}</span><span class="bk-answer__v" dir="auto">{{ q.answer() }}</span>
        <g-btn size="sm" variant="ghost" color="neutral" :aria-label="'Cambiar ' + q.short.toLowerCase()" @click="edit(i)" :disabled="DISABLED">Cambiar</g-btn>
      </div>
      <div v-else class="bk-q">
        <h3 class="bk-q__title" tabindex="-1">{{ q.q }}</h3>
        <!-- Hotel -->
        <template v-if="q.key === 'dates'">
          <g-date-picker inline mode="range" :model-value="hotelRange" @update:model-value="onRange" :min="TODAY" :disabled-dates="soldOut" :labels="DP_LABELS" months="1" :disabled="DISABLED" />
        </template>
        <template v-else-if="q.key === 'party' && t !== 'restaurante'">
          <div class="bk-rows">
            <g-number-field label="Adultos" hint="13 años o más" v-model="S[t].adults" :min="1" :max="12" steppers decrement-label="Quitar un adulto" increment-label="Añadir un adulto" />
            <g-number-field label="Niños" hint="De 0 a 12 años" v-model="S[t].children" :min="0" :max="6" steppers decrement-label="Quitar un niño" increment-label="Añadir un niño" />
            <g-number-field v-if="t === 'hotel'" label="Habitaciones" hint="Hasta una por adulto" v-model="S.hotel.rooms" :min="1" :max="S.hotel.adults || 1" steppers decrement-label="Quitar una habitación" increment-label="Añadir una habitación" />
          </div>
          <div><g-btn variant="soft" color="neutral" @click="commit('party')" :disabled="DISABLED">Listo</g-btn></div>
        </template>
        <!-- Restaurante: respuestas como botones; elegir es responder -->
        <template v-else-if="q.key === 'party'">
          <div class="bk-chips" role="group" :aria-label="q.q">
            <button v-for="n in 8" :key="n" type="button" class="bk-chip" :aria-pressed="String(S.restaurante.party === n && confirmed.party)" @click="S.restaurante.party = n; commit('party')" :disabled="DISABLED">{{ n }}</button>
          </div>
        </template>
        <template v-else-if="q.key === 'date' && t === 'restaurante'">
          <div class="bk-chips" role="group" :aria-label="q.q">
            <button v-for="d in days" :key="d" type="button" class="bk-chip" :aria-pressed="String(S.restaurante.date === d && confirmed.date)" @click="pickDate(d)" :disabled="DISABLED">{{ dayWord(d) }}</button>
            <button type="button" class="bk-chip" :aria-expanded="String(otherDay)" @click="otherDay = !otherDay">Otro día</button>
          </div>
          <g-date-picker v-if="otherDay" inline :model-value="S.restaurante.date" @update:model-value="pickDate" :min="TODAY" :labels="DP_LABELS" months="1" />
        </template>
        <template v-else-if="q.key === 'time'">
          <div class="bk-chips" role="group" :aria-label="q.q">
            <button v-for="s in SLOTS" :key="s" type="button" class="bk-chip" :aria-pressed="String(S.restaurante.time === s && confirmed.time)" :disabled="FULL.includes(s) || DISABLED" @click="S.restaurante.time = s; commit('time')">{{ s }}<span v-if="FULL.includes(s)" class="bk-chip__note"> · lleno</span></button>
          </div>
        </template>
        <!-- Tour -->
        <template v-else-if="q.key === 'tour'">
          <div class="bk-chips bk-chips--cards" role="group" :aria-label="q.q">
            <button v-for="o in TOURS" :key="o.value" type="button" class="bk-chip bk-chip--card" :aria-pressed="String(S.tour.tour === o.value && confirmed.tour)" @click="S.tour.tour = o.value; commit('tour')" :disabled="DISABLED">
              <span class="bk-chip__title">{{ o.label }}</span><span class="bk-chip__desc">{{ o.description }}</span></button>
          </div>
        </template>
        <template v-else-if="q.key === 'date'">
          <g-date-picker inline :model-value="S.tour.date" @update:model-value="pickTourDate" :min="TODAY" :disabled-dates="dateDisabledTour" :labels="DP_LABELS" months="1" />
        </template>
      </div>
    </li>
    <li v-if="current >= qs.length" class="bk-step bk-final">
      <p class="bk-final__title" dir="auto" tabindex="-1">{{ summary(t) }}</p>
      <g-btn type="submit" size="lg" block :loading="status === 'sending'" loading-text="Consultando disponibilidad" :disabled="DISABLED">{{ tpl.cta }}</g-btn>
    </li>
  </ol>
</form>`
  })

  // ---------- B · El muelle: la consulta acompaña mientras se lee la página ----------
  const LabDock = defineComponent({
    components: { LabIcon },
    props: { t: String, bar: Object, visible: Boolean },
    setup (props) {
      const tpl = computed(() => T[props.t])
      const edit = (e) => { e.currentTarget.setAttribute('data-bk-return', ''); props.bar.openSheet() }
      const go = (e) => { e.currentTarget.closest('.bk-dock').querySelector('.bk-dock__sum').setAttribute('data-bk-return', ''); props.bar.submit() }
      return { tpl, edit, go, summary, summaryOpen, status, DISABLED }
    },
    template: `
<div class="bk-dock" :class="{ 'is-shown': visible }" :inert="!visible || null" :aria-hidden="visible ? null : 'true'" data-dock>
  <button type="button" class="bk-dock__sum" aria-haspopup="dialog" @click="edit" :disabled="DISABLED">
    <lab-icon n="calendar" />
    <span class="bk-compact__text"><span class="bk-compact__k">Tu consulta</span><span class="bk-compact__v" dir="auto">{{ summaryOpen(t) }}</span></span>
    <span class="bk-compact__edit">Cambiar</span>
  </button>
  <g-btn class="bk-dock__cta" :loading="status === 'sending'" loading-text="Consultando disponibilidad" @click="go" :disabled="DISABLED">{{ tpl.cta }}</g-btn>
</div>`
  })

  // ---------- Página de la aplicación (marketing) ----------
  const app = createApp({
    components: { LabBar, LabSentence, LabConcierge, LabDock, LabIcon },
    setup () {
      const bar = ref(null), dockOn = ref(false), dockH = ref(0)
      const tpl = T[TPL]
      const link = (k, v) => { const u = new URLSearchParams(Q); u.set(k, v); return '?' + u }
      let io = null
      onMounted(() => {
        if (C === 'B') {
          const target = document.querySelector('.bk-bar')
          io = new IntersectionObserver(([e]) => { dockOn.value = !e.isIntersecting && e.boundingClientRect.top < 0 }, { threshold: 0 })
          io.observe(target)
        }
        window.__bk.ready = true
      })
      watch(dockOn, (v) => nextTick(() => {
        const d = document.querySelector('[data-dock]')
        // 2.4.11: lo enfocado nunca queda bajo el muelle
        document.documentElement.style.setProperty('--bk-dock-h', v && d ? d.getBoundingClientRect().height + 'px' : '0px')
      }))
      const offerCta = (name) => {
        const w = whenText(TPL)
        return w ? `Reservar ${name} · ${w.split(' · ')[0]}` : `Ver ${name}`
      }
      const lastIntent = computed(() => (status.value === 'sent' ? JSON.stringify(intents[intents.length - 1], null, 1) : ''))
      const heroBg = { backgroundImage: 'url("' + window.foto(tpl.photo, 21, 9) + '")' }
      return { heroBg, C, TPL, tpl, link, bar, dockOn, live, foto: window.foto, fotoAlt: window.fotoAlt, offerCta, lastIntent, status, W: Q.get('w') }
    },
    template: `
<div class="bk-lab" aria-label="Laboratorio">
  <nav class="bk-lab__nav" aria-label="Conceptos">
    <a v-for="c in ['base','A','B','C']" :href="link('c', c)" :aria-current="c === C ? 'true' : null">{{ { base: 'Base', A: 'A · La frase', B: 'B · El muelle', C: 'C · El conserje' }[c] }}</a>
    <span class="bk-lab__sep" aria-hidden="true"></span>
    <a v-for="t in ['hotel','restaurante','tour']" :href="link('t', t)" :aria-current="t === TPL ? 'true' : null">{{ t }}</a>
  </nav>
</div>
<div class="bk-stage" :style="W ? { maxInlineSize: W + 'px' } : null">
  <header class="bk-site"><span class="bk-site__brand">{{ tpl.name }}</span></header>
  <main id="main" class="bk-page">
    <section class="bk-hero" aria-labelledby="bk-h1">
      <div class="bk-hero__photo" :style="heroBg" aria-hidden="true"></div>
      <div class="bk-hero__text">
        <p class="bk-hero__kicker">{{ tpl.kicker }}</p>
        <h1 id="bk-h1" class="bk-hero__title">{{ tpl.name }}</h1>
      </div>
      <div class="bk-hero__booking" :class="'bk-hero__booking--' + C">
        <lab-sentence v-if="C === 'A'" :t="TPL" />
        <lab-concierge v-else-if="C === 'C'" :t="TPL" />
        <lab-bar v-else ref="bar" :t="TPL" />
      </div>
    </section>
    <section class="bk-offers" aria-labelledby="bk-offers-h">
      <h2 id="bk-offers-h" class="bk-offers__title">{{ TPL === 'hotel' ? 'Habitaciones' : TPL === 'restaurante' ? 'La carta' : 'Recorridos' }}</h2>
      <div class="bk-offers__grid">
        <article v-for="(o, i) in tpl.offers" :key="o" class="bk-offer">
          <img class="bk-offer__img" :src="foto(tpl.offerPhotos[i], 3, 2)" :alt="fotoAlt(tpl.offerPhotos[i])" width="600" height="400">
          <h3 class="bk-offer__title">{{ o }}</h3>
          <p class="bk-offer__desc">Texto de la aplicación: descripción breve de la oferta, lo que incluye y para quién es.</p>
          <g-btn variant="outline" color="neutral" size="sm">{{ C === 'B' ? offerCta(o) : 'Ver ' + o }}</g-btn>
        </article>
      </div>
    </section>
    <section class="bk-more" aria-label="Más contenido">
      <p v-for="n in 6" :key="n">Contenido de la aplicación para que la página desplace: historia del lugar, ubicación, preguntas frecuentes. Párrafo {{ n }}.</p>
    </section>
  </main>
  <lab-dock v-if="C === 'B' && bar" :t="TPL" :bar="bar" :visible="dockOn" />
</div>
<div class="bk-sr" aria-live="polite" aria-atomic="true" data-live>{{ live }}</div>
<pre class="bk-readout" aria-hidden="true" data-intent>{{ lastIntent }}</pre>`
  })
  app.use(Grana.default || Grana)
  if (window.GranaTimeField) app.use(GranaTimeField.default || GranaTimeField)
  window.__bk = { ready: false, S, errors, intents, status, C, TPL, TODAY, addDays }
  app.mount('#app')
})()
