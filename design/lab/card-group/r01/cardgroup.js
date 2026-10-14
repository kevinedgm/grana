// Prototipo de kiwi (r01) del grupo de tarjetas que filtran. NO es el .vue de bruno: es un banco para decidir estructura.
// Usa los componentes reales de dist/ (GCard, GMetric, GTable con su GFilterBar) con Vue global. El grupo del prototipo
// (LabCardGroup) coordina las GCard hijas: estado único o múltiple, una parada de Tab con flechas, descripción con la cifra
// y aria-controls hacia la tabla. Los conceptos A, B y C cambian la forma; la semántica y el teclado son los de la base.
// Iconos: los de los propios componentes (Lucide por GLibIcon); el prototipo no dibuja iconos propios.
;(function () {
  const { h, ref, computed, nextTick, onMounted, onUpdated, onBeforeUnmount, defineComponent, reactive, watch } = Vue
  const { GCard, GMetric } = Grana

  const Q = new URLSearchParams(location.search)
  if (Q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  if (Q.get('theme') === 'dark') document.documentElement.dataset.theme = 'dark'

  // ---------------- Datos: 24 facturas (el caso real: bandeja de cobranza) ----------------
  const NOMBRES = ['Ana Torres', 'Luis Pérez', 'Marta Ruiz', 'Diego Sanz', 'Sofía León', 'Raúl Gil', 'Elena Vidal', 'Hugo Mora', 'Paula Ríos', 'Iván Soto', 'Nora Cruz', 'Óscar Peña']
  const ESTADOS = ['pendiente', 'pendiente', 'pagada', 'vencida', 'pagada', 'pendiente', 'pagada', 'en disputa', 'pagada', 'vencida', 'pendiente', 'pagada',
    'pendiente', 'pagada', 'vencida', 'pagada', 'pendiente', 'pagada', 'en disputa', 'pendiente', 'pagada', 'vencida', 'pendiente', 'pagada']
  const ROWS = ESTADOS.map((estado, i) => ({
    id: `F-${String(1041 + i)}`, folio: `F-${1041 + i}`, cliente: NOMBRES[i % NOMBRES.length], correo: `${NOMBRES[i % NOMBRES.length].split(' ')[0].toLowerCase()}@correo.mx`,
    estado, total: 1200 + ((i * 3779) % 14000)
  }))
  const count = (e) => ROWS.filter((r) => r.estado === e).length
  // Cada tarjeta: valor (el del filtro), título, cifra y tendencia (texto, nunca solo color: GMetric)
  const ITEMS = [
    { value: 'pendiente', title: 'Pendientes', count: count('pendiente'), trend: '+2', direction: 'up', trendColor: 'neutral', context: 'desde ayer', word: ['pendiente', 'pendientes'] },
    { value: 'vencida', title: 'Vencidas', count: count('vencida'), trend: '+1', direction: 'up', trendColor: 'danger', context: 'desde ayer', word: ['vencida', 'vencidas'] },
    { value: 'pagada', title: 'Pagadas', count: count('pagada'), trend: '+3', direction: 'up', trendColor: 'success', context: 'esta semana', word: ['pagada', 'pagadas'] },
    { value: 'en disputa', title: 'En disputa', count: count('en disputa'), trend: '0', direction: 'flat', trendColor: 'neutral', context: 'sin cambios', word: ['en disputa', 'en disputa'] }
  ]
  const TOTAL = ROWS.length
  const fmt = (n) => new Intl.NumberFormat(document.documentElement.lang || 'es').format(n)
  const pct = (n) => new Intl.NumberFormat(document.documentElement.lang || 'es', { style: 'percent', maximumFractionDigits: 0 }).format(n / TOTAL)

  const COLUMNS = [
    { key: 'cliente', label: 'Cliente', title: 'cliente', subtitle: 'correo', filter: { type: 'text' } },
    { key: 'folio', label: 'Folio', min: 18 },
    { key: 'estado', label: 'Estado', min: 20, filter: { type: 'enum', options: ['pendiente', 'vencida', 'pagada', 'en disputa'] } },
    { key: 'total', label: 'Total', align: 'end', min: 18, format: (v) => `$${v.toLocaleString('es-MX')}`, filter: { type: 'number', unit: '$' } }
  ]
  const TABLE_LABELS = {
    loading: 'Cargando facturas…', empty: 'Sin facturas todavía.', emptyFiltered: 'Ninguna factura cumple estos filtros.', clearFilters: 'Limpiar filtros', results: '{count} facturas',
    slow: 'Sigue cargando…', failed: 'No se pudieron cargar.', retry: 'Reintentar', actionsHeader: 'Acciones',
    filters: { group: 'Filtros de facturas', add: 'Agregar filtro', clear: 'Limpiar filtros', filterBy: 'Filtrar por {label}', edit: 'Editar filtro: {summary}', remove: 'Quitar filtro: {summary}', apply: 'Aplicar', cancel: 'Cancelar', required: 'Indica un valor para aplicar el filtro.', range: '«Desde» debe ser menor o igual que «hasta».', rule: 'Regla', value: 'Valor', from: 'Desde', to: 'Hasta', and: 'y', days: '{n} días', results: '{count} facturas', ops: { contains: 'contiene', is: 'es', starts: 'empieza por', gt: 'mayor que', lt: 'menor que', eq: 'igual a', between: 'entre', after: 'después de', before: 'antes de', last: 'últimos', in: 'es cualquiera de' } },
    pagination: { nav: 'Paginación de facturas', previous: 'Página anterior', next: 'Página siguiente', page: 'Página {page}', range: '{from}–{to} de {total}', compact: 'Página {page} de {pages}' }
  }
  const CARD_LABELS = { menu: 'Acciones de', loading: 'Cargando', loaded: 'Cargado' }

  // ---------------- La receta: v-model del grupo <-> filters de la tabla (una sola verdad) ----------------
  // El grupo no conoce la tabla. La aplicación traduce: el valor elegido es el filtro { key, op: 'in', value: [..] }
  // y la tarjeta pulsada se LEE de los filtros (si la persona quita el chip en la barra, la tarjeta se suelta sola).
  // HALLAZGO (L3): GTable solo anuncia el recuento cuando el filtro cambia desde SU barra (onFilters); un cambio de la prop
  // `filters` desde fuera (la tarjeta) es silencioso. Aquí se EMULA lo que se propone (la tabla anuncia también el cambio
  // externo) con una región del laboratorio que copia el recuento visible de la propia tabla. No es API del grupo.
  function announce(tableId) {
    nextTick(() => setTimeout(() => {
      const out = document.getElementById(`${tableId}-lab-live`)
      const n = document.querySelector(`#${tableId} .g-filter-bar__count`)
      if (!out || !n) return
      out.textContent = ''
      setTimeout(() => { out.textContent = n.textContent.trim() }, 50)
    }, 0))
  }
  function bridgeFilters(state, key, multiple, tableId) {
    return computed({
      get() {
        const f = state.filters.find((x) => x.key === key && x.op === 'in')
        const vals = f ? f.value : []
        const known = vals.filter((v) => ITEMS.some((it) => it.value === v))
        if (multiple) return known
        return known.length === 1 && vals.length === 1 ? known[0] : null
      },
      set(v) {
        const rest = state.filters.filter((x) => x.key !== key)
        const vals = multiple ? v : v == null ? [] : [v]
        state.filters = vals.length ? [...rest, { key, op: 'in', value: [...vals] }] : rest
        if (tableId) announce(tableId)
      }
    })
  }

  let uid = 0
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches

  // ---------------- LabCardGroup: base, A (lengüeta) y B (el todo y sus partes) ----------------
  const LabCardGroup = defineComponent({
    name: 'LabCardGroup',
    props: {
      items: { type: Array, required: true },
      modelValue: { default: null },
      multiple: Boolean,
      concept: { type: String, default: 'base' },
      label: String,
      controls: String,
      total: Number,
      unit: { type: String, default: 'Facturas' }
    },
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      const id = `lab-cg-${++uid}`
      const root = ref(null)
      const strip = ref(null)
      const last = ref(-1)
      const bridges = reactive({ list: [] })
      const isOn = (v) => (props.multiple ? (props.modelValue || []).includes(v) : props.modelValue === v)
      const anyOn = computed(() => props.items.some((it) => isOn(it.value)))
      const onCount = computed(() => props.items.filter((it) => isOn(it.value)).reduce((s, it) => s + it.count, 0))

      function set(v, on) {
        if (props.multiple) {
          const cur = new Set(props.modelValue || [])
          on ? cur.add(v) : cur.delete(v)
          emit('update:modelValue', props.items.map((i) => i.value).filter((x) => cur.has(x)))
        } else emit('update:modelValue', on ? v : null)
      }
      const buttons = () => (strip.value ? [...strip.value.querySelectorAll('.g-card__primary')] : [])
      // Parada única: con el foco dentro, la enfocada; si no, la pulsada; si no, la última enfocada; si no, la primera
      function sync() {
        const bs = buttons()
        if (!bs.length) return
        let cur = bs.indexOf(document.activeElement)
        if (cur < 0) cur = props.items.findIndex((it) => isOn(it.value))
        if (cur < 0) cur = last.value >= 0 && last.value < bs.length ? last.value : 0
        bs.forEach((b, i) => {
          b.tabIndex = i === cur ? 0 : -1
          if (props.controls) b.setAttribute('aria-controls', props.controls)
          b.setAttribute('aria-describedby', `${id}-m-${i}`)
        })
        if (props.concept === 'A') place()
      }
      // A: un puente por tarjeta pulsada, medido en la caja de la tira (px físicos: offsetLeft vale en LTR y RTL)
      function place() {
        const s = strip.value
        if (!s) return
        const cards = [...s.querySelectorAll('.g-card')]
        const next = props.items.map((it, i) => (isOn(it.value) && cards[i] ? { k: props.multiple ? it.value : 'one', x: cards[i].offsetLeft, w: cards[i].offsetWidth } : null)).filter(Boolean)
        // Solo si cambió: escribir siempre volvería a pintar y onUpdated volvería a medir (bucle)
        if (JSON.stringify(next) !== JSON.stringify(bridges.list)) bridges.list = next
      }
      function onKey(e) {
        const bs = buttons()
        const i = bs.indexOf(e.target)
        if (i < 0) return
        const rtl = getComputedStyle(strip.value).direction === 'rtl'
        let n
        switch (e.key) {
          case 'ArrowRight': n = rtl ? i - 1 : i + 1; break
          case 'ArrowLeft': n = rtl ? i + 1 : i - 1; break
          case 'ArrowDown': n = i + 1; break
          case 'ArrowUp': n = i - 1; break
          case 'Home': n = 0; break
          case 'End': n = bs.length - 1; break
          default: return
        }
        e.preventDefault()
        n = Math.max(0, Math.min(bs.length - 1, n)) // sin vuelta: Inicio y Fin ya llevan a los extremos
        bs.forEach((b, k) => { b.tabIndex = k === n ? 0 : -1 })
        bs[n].focus()
        // La tarjeta entera, no el botón: el botón estirado solo mide el título (WebKit dejaba la tarjeta a medias, medido)
        bs[n].closest('.g-card').scrollIntoView({ block: 'nearest', inline: 'nearest' })
        last.value = n
      }
      function onFocusIn(e) { const i = buttons().indexOf(e.target); if (i >= 0) last.value = i }
      let ro
      onMounted(() => { sync(); ro = new ResizeObserver(() => props.concept === 'A' && place()); ro.observe(strip.value) })
      onUpdated(() => nextTick(sync))
      onBeforeUnmount(() => ro && ro.disconnect())
      watch(() => props.modelValue, () => nextTick(sync), { deep: true })

      const metric = (it, i) => h('div', { id: `${id}-m-${i}`, class: 'lab-cg__metric' }, [
        h(GMetric, { label: props.unit, value: fmt(it.count), trend: it.trend, direction: it.direction, trendColor: it.trendColor, context: it.context, size: props.concept === 'B' ? 'sm' : 'md' }),
        props.concept === 'B' ? h('p', { class: 'lab-cg__share' }, `${pct(it.count)} del total`) : null
      ])

      return () => {
        const cards = props.items.map((it, i) => h(GCard, {
          key: it.value, as: 'div', interaction: 'toggle', title: it.title, headingLevel: 3, density: 'compact',
          modelValue: isOn(it.value), 'onUpdate:modelValue': (on) => set(it.value, on), labels: CARD_LABELS,
          class: ['lab-cg__card', anyOn.value && !isOn(it.value) && 'is-out'],
          style: props.concept === 'B' ? { '--lab-share': it.count } : undefined,
          'data-value': it.value
        }, { default: () => metric(it, i) }))

        const toolbar = h('div', {
          ref: strip, role: 'toolbar', 'aria-label': props.label, class: ['lab-cg__strip', anyOn.value && 'is-filtered'],
          // A desplaza la tira: Firefox hace enfocable un contenedor con scroll (una parada de más). La tira no es una parada
          tabindex: props.concept === 'A' ? -1 : undefined,
          onKeydown: onKey, onFocusin: onFocusIn, onFocusout: () => nextTick(sync)
        }, [
          ...cards,
          ...(props.concept === 'A'
            ? bridges.list.map((b) => h('span', { key: 'br-' + b.k, class: 'lab-a__bridge', 'aria-hidden': 'true', 'data-for': b.k, style: { left: b.x + 'px', width: b.w + 'px' } }))
            : [])
        ])

        const kids = [toolbar]
        if (props.concept === 'B') {
          kids.push(h('p', { class: 'lab-b__sum', 'aria-hidden': 'true' }, anyOn.value
            ? [h('strong', fmt(onCount.value)), ` de ${fmt(props.total)} facturas · ${pct(onCount.value)}`]
            : [h('strong', fmt(props.total)), ' facturas en total']))
        }
        if (slots.panel) kids.push(h('div', { class: ['lab-cg__panel', anyOn.value && 'is-filtered'] }, slots.panel()))
        if (props.controls) kids.push(h('p', { id: `${props.controls}-lab-live`, class: 'lab-sr', 'aria-live': 'polite' }))
        return h('div', { ref: root, class: ['lab-cg', `lab-cg--${props.concept}`, props.multiple && 'is-multiple'], 'data-concept': props.concept }, kids)
      }
    }
  })

  // ---------------- C · La frase: sin tarjetas; cifras que se pulsan dentro de una frase ----------------
  const LabSentence = defineComponent({
    name: 'LabSentence',
    props: { items: Array, modelValue: { default: null }, label: String, controls: String, total: Number },
    emits: ['update:modelValue'],
    setup(props, { emit, slots }) {
      const id = `lab-c-${++uid}`
      const bar = ref(null)
      const last = ref(-1)
      const isOn = (v) => props.modelValue === v
      const on = computed(() => props.items.find((it) => isOn(it.value)))
      const buttons = () => (bar.value ? [...bar.value.querySelectorAll('.lab-c__fig')] : [])
      function sync() {
        const bs = buttons()
        let cur = bs.indexOf(document.activeElement)
        if (cur < 0) cur = props.items.findIndex((it) => isOn(it.value))
        if (cur < 0) cur = last.value >= 0 ? last.value : 0
        bs.forEach((b, i) => { b.tabIndex = i === cur ? 0 : -1 })
      }
      function onKey(e) {
        const bs = buttons()
        const i = bs.indexOf(e.target)
        if (i < 0) return
        const rtl = getComputedStyle(bar.value).direction === 'rtl'
        const map = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1, ArrowDown: 1, ArrowUp: -1 }
        let n = e.key === 'Home' ? 0 : e.key === 'End' ? bs.length - 1 : e.key in map ? i + map[e.key] : null
        if (n === null) return
        e.preventDefault()
        n = Math.max(0, Math.min(bs.length - 1, n))
        bs.forEach((b, k) => { b.tabIndex = k === n ? 0 : -1 })
        bs[n].focus()
        last.value = n
      }
      onMounted(sync)
      onUpdated(() => nextTick(sync))
      return () => {
        const figs = []
        props.items.forEach((it, i) => {
          if (i) figs.push(h('span', { class: 'lab-c__sep', 'aria-hidden': 'true' }, i === props.items.length - 1 ? ' y ' : ', '))
          figs.push(h('button', {
            type: 'button', class: ['lab-c__fig', isOn(it.value) && 'is-on', on.value && !isOn(it.value) && 'is-out'], 'aria-pressed': String(isOn(it.value)),
            'aria-controls': props.controls, 'data-value': it.value,
            onClick: () => emit('update:modelValue', isOn(it.value) ? null : it.value)
          }, [h('span', { class: 'lab-c__num' }, fmt(it.count)), ' ', h('span', { class: 'lab-c__word' }, it.count === 1 ? it.word[0] : it.word[1])]))
        })
        return h('div', { class: ['lab-c', on.value && 'is-filtered'] }, [
          // Lo que cambia (la cola) va DESPUÉS de las cifras: pulsar nunca desplaza una cifra bajo el puntero
          h('p', { class: 'lab-c__line' }, [
            h('span', { class: 'lab-c__lead' }, [h('strong', fmt(props.total)), ' facturas: ']),
            h('span', { ref: bar, role: 'toolbar', 'aria-label': props.label, class: 'lab-c__bar', onKeydown: onKey, onFocusout: () => nextTick(sync) }, figs),
            '. ',
            h('span', { class: 'lab-c__tail' }, on.value ? `Se ven solo las ${fmt(on.value.count)} ${on.value.count === 1 ? on.value.word[0] : on.value.word[1]}.` : 'Se ven todas.')
          ]),
          slots.panel ? h('div', { class: ['lab-cg__panel', on.value && 'is-filtered'] }, slots.panel()) : null,
          props.controls ? h('p', { id: `${props.controls}-lab-live`, class: 'lab-sr', 'aria-live': 'polite' }) : null
        ])
      }
    }
  })

  // ---------------- La página ----------------
  const app = Vue.createApp({
    setup() {
      const mk = (table, multiple = false) => {
        const s = reactive({ filters: [] })
        s.model = bridgeFilters(s, 'estado', multiple, table)
        return s
      }
      const st = reactive({ base: mk('t-base'), multi: mk('t-multi', true), A: mk('t-A'), B: mk('t-B'), C: mk('t-C') })
      window.__lab = st
      onMounted(() => nextTick(() => { window.__ready = true }))
      return { st, ITEMS, COLUMNS, ROWS, TABLE_LABELS, TOTAL }
    }
  })
  app.use(Grana.default)
  app.component('lab-card-group', LabCardGroup)
  app.component('lab-sentence', LabSentence)
  app.mount('#app')
})()
