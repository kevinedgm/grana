// Prototipo de la barra de campos (kiwi r01). XFieldBar compone los COMPONENTES REALES de dist/ (GCombobox, GSelect,
// GDatePicker, GInput, GBtn, GDialog). Lo que aquí es «X…» es del laboratorio; nada de esto se copia a packages/.
(function () {
  const { defineComponent, ref, computed, h, nextTick, onMounted, onBeforeUnmount, provide, reactive, createApp, watch, Comment, Fragment, Text } = Vue

  const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const icon = (name) => h('span', { class: 'xb-ic', 'aria-hidden': 'true', innerHTML: window.lucide(name) })
  const flat = (nodes) => (nodes || []).flatMap((n) => (n.type === Fragment ? flat(n.children) : [n])).filter((n) => n.type !== Comment && !(n.type === Text && !String(n.children).trim()))

  // ------------------------------------------------------------------------------------------------------------
  // XFieldBar: la primitiva. Base, A (costura, joined | segmented) y la cara desplegada de C.
  //   - Raíz: role="search" (con `search`) o role="group", con nombre (aria-label o aria-labelledby).
  //   - Cada hijo del slot es un CAMPO completo (su etiqueta, su caja, su pie): la barra lo envuelve en una celda.
  //   - Slot `action`: la acción (un GBtn type="submit" del formulario que contiene la barra).
  //   - Reparto: una línea si caben los mínimos; si no, columna. Medido por la propia raíz (ResizeObserver), sin
  //     @container (#34) ni @media. En el componente real, el mínimo de cada campo vendría del motor de GFormRow.
  // ------------------------------------------------------------------------------------------------------------
  const XFieldBar = defineComponent({
    name: 'XFieldBar',
    props: {
      concept: { type: String, default: 'A' },          // base | A
      appearance: { type: String, default: 'joined' },  // joined | segmented
      shape: { type: String, default: 'pill' },         // pill | rounded | square
      variant: { type: String, default: 'outline' },    // outline | soft | raised
      search: Boolean,
      label: String,
      mins: { type: Array, default: () => [] },         // mínimo de cada campo, en múltiplos de space (como --g-form-min)
      grow: { type: Array, default: () => [] },         // proporción de cada campo (como g-form-w-*)
      layout: { type: String, default: 'auto' }         // auto | row | column
    },
    setup(props, { slots, expose }) {
      const root = ref(null)
      const measured = ref('row')
      const active = ref(-1)
      const space = ref(4)
      let ro = null
      const actionW = ref(0)

      const minPx = (i) => (props.mins[i] || 40) * space.value
      const need = () => {
        const n = Math.max(props.mins.length, 1)
        let s = 0
        for (let i = 0; i < n; i++) s += minPx(i)
        return s + actionW.value + space.value * 4
      }
      const measure = () => {
        const el = root.value
        if (!el) return
        space.value = parseFloat(getComputedStyle(el).getPropertyValue('--g-space-1')) || 4
        // La acción: su ancho intrínseco aproximado (un GBtn con icono y texto); en columna se estira
        actionW.value = el.querySelector(':scope > .xb__action') ? space.value * 30 : 0
        const w = el.parentElement ? el.parentElement.getBoundingClientRect().width : el.getBoundingClientRect().width
        const next = w >= need() ? 'row' : 'column'
        if (next !== measured.value) measured.value = next
      }
      const layoutNow = computed(() => (props.layout === 'auto' ? measured.value : props.layout))

      onMounted(() => {
        measure()
        ro = new ResizeObserver(() => requestAnimationFrame(measure))
        ro.observe(root.value.parentElement || root.value)
      })
      onBeforeUnmount(() => ro && ro.disconnect())

      // El segmento activo: el que contiene el foco. Perder el foco tras un ciclo (el panel del campo puede tenerlo)
      const onFocusin = (e) => {
        const cell = e.target.closest && e.target.closest('.xb__cell')
        if (cell && root.value.contains(cell)) active.value = Number(cell.dataset.i)
        else if (e.target.closest && e.target.closest('.xb__action')) active.value = -1
      }
      const onFocusout = () => {
        setTimeout(() => {
          const a = document.activeElement
          if (!root.value) return
          if (a && root.value.contains(a)) return
          // Un panel abierto de un campo (popover en la capa superior) sigue siendo «dentro»
          if (root.value.querySelector(':popover-open')) return
          active.value = -1
        }, 0)
      }

      const cols = computed(() => {
        if (layoutNow.value !== 'row') return null
        const n = props.mins.length
        const out = []
        for (let i = 0; i < n; i++) {
          const g = props.grow[i] || 1
          // A: el segmento activo gana ancho (para lo que se escribe); los demás ceden, nunca por debajo de su mínimo
          const k = props.concept === 'A' && active.value === i ? 1.7 : 1
          out.push(`minmax(${minPx(i)}px, ${(g * k).toFixed(2)}fr)`)
        }
        return out.join(' ') + (slots.action ? ' auto' : '')
      })

      // El segmento entero es objetivo: pulsar su etiqueta o su relleno lleva al control del campo (la etiqueta de
      // GDatePicker es un <span>, no un <label for>). Nada que hacer si se pulsó un control o algo de su panel
      const onCellClick = (e) => {
        if (e.target.closest('label, input, button, select, textarea, a, [role=option], [role=listbox], [popover], [role=dialog]')) return
        const cell = e.currentTarget
        const ctl = cell.querySelector('input:not([type=hidden]):not([disabled]), button:not([disabled]):not([tabindex="-1"])')
        if (!ctl) return
        ctl.focus()
        if (ctl.tagName === 'BUTTON') ctl.click()
      }

      expose({ root, active })

      return () => {
        const kids = flat(slots.default ? slots.default() : [])
        const cells = kids.map((vn, i) => h('div', {
          class: ['xb__cell', { 'is-active': active.value === i, 'is-before-active': active.value === i + 1 }],
          'data-i': i,
          key: i,
          onClick: props.concept === 'A' ? onCellClick : undefined,
          // Colocación explícita: la superficie ocupa las pistas 1–2 de todas las columnas y el auto-placement las saltaría
          style: layoutNow.value === 'row' ? { gridColumn: String(i + 1) } : undefined
        }, [h('span', { class: 'xb__lens', 'aria-hidden': 'true' }), vn]))
        const nameAttrs = props.label ? { 'aria-label': props.label } : {}
        return h('div', {
          ref: root,
          class: [
            'xb', `xb--${props.concept}`, `xb--${props.appearance}`, `xb--shape-${props.shape}`, `xb--variant-${props.variant}`,
            { 'has-active': active.value >= 0, 'has-action': !!slots.action }
          ],
          role: props.search ? 'search' : 'group',
          ...nameAttrs,
          'data-layout': layoutNow.value,
          style: cols.value ? { '--xb-cols': cols.value } : undefined,
          onFocusin,
          onFocusout
        }, [
          h('span', { class: 'xb__surface', 'aria-hidden': 'true' }),
          ...cells,
          slots.action ? h('div', { class: 'xb__action' }, slots.action()) : null
        ])
      }
    }
  })

  // ------------------------------------------------------------------------------------------------------------
  // Datos de los ejemplos
  // ------------------------------------------------------------------------------------------------------------
  const CITIES = [
    { value: 'MEX', label: 'Ciudad de México', code: 'MEX', description: 'Aeropuerto Internacional Benito Juárez' },
    { value: 'CUN', label: 'Cancún', code: 'CUN', description: 'Aeropuerto Internacional de Cancún' },
    { value: 'GDL', label: 'Guadalajara', code: 'GDL', description: 'Aeropuerto Internacional Miguel Hidalgo' },
    { value: 'MTY', label: 'Monterrey', code: 'MTY', description: 'Aeropuerto Internacional Mariano Escobedo' },
    { value: 'OAX', label: 'Oaxaca', code: 'OAX', description: 'Aeropuerto Internacional Xoxocotlán' },
    { value: 'TIJ', label: 'Tijuana', code: 'TIJ', description: 'Aeropuerto Internacional Abelardo L. Rodríguez' },
    { value: 'MID', label: 'Mérida', code: 'MID', description: 'Aeropuerto Internacional Manuel Crescencio Rejón' },
    { value: 'MAD', label: 'Madrid', code: 'MAD', description: 'Adolfo Suárez Madrid-Barajas' },
    { value: 'BOG', label: 'Bogotá', code: 'BOG', description: 'Aeropuerto Internacional El Dorado' }
  ]
  const CATS = [
    { value: 'productos', label: 'Productos' },
    { value: 'servicios', label: 'Servicios' },
    { value: 'clientes', label: 'Clientes' },
    { value: 'proveedores', label: 'Proveedores' }
  ]
  const CB_LABELS = { noResults: 'Sin resultados para «{text}»', results: (n) => (n === 1 ? '1 resultado' : `${n} resultados`), close: 'Cerrar', clear: 'Limpiar' }
  const DP_LABELS = {
    prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fecha', close: 'Cerrar',
    today: 'hoy', selected: 'elegida', rangeStart: 'inicio', rangeEnd: 'fin', rangeSingle: 'inicio y fin', inRange: 'en el rango', unavailable: 'no disponible',
    announceDate: 'Fecha elegida: {date}'
  }
  const cityName = (v) => (CITIES.find((c) => c.value === v) || {}).label || ''
  const fmtDate = (iso) => (iso ? new Intl.DateTimeFormat(document.documentElement.lang || 'es', { day: 'numeric', month: 'short' }).format(new Date(iso + 'T12:00:00')) : '')

  // Estado compartido por ejemplo
  const flightState = () => reactive({ from: 'MEX', to: null, date: null, err: {}, log: '' })
  const filterState = () => reactive({ cat: 'productos', q: '', err: {}, log: '' })

  function submitFlight(s, focusFirst) {
    const err = {}
    if (!s.from) err.from = 'Elige la ciudad de origen'
    if (!s.to) err.to = 'Elige la ciudad de destino'
    else if (s.to === s.from) err.to = 'El destino no puede ser el origen'
    if (!s.date) err.date = 'Elige la fecha de salida'
    s.err = err
    const first = Object.keys(err)[0]
    if (first) { s.log = `No se buscó: ${Object.keys(err).length} dato(s) por corregir.`; nextTick(() => focusFirst(first)); return false }
    s.log = `Buscar: ${s.from} → ${s.to} · ${s.date}`
    return true
  }
  function submitFilter(s) {
    s.err = {}
    s.log = `Buscar en ${s.cat}: «${s.q}»`
    return true
  }

  // Foco al primer campo con error (lo hará GForm en el componente real)
  const focusIn = (rootEl, key) => {
    // data-k llega al control nativo (los campos pasan $attrs a su control)
    const el = rootEl && rootEl.querySelector(`[data-k="${key}"]`)
    if (el) el.focus()
  }

  // ------------------------------------------------------------------------------------------------------------
  // Ejemplos para base y A
  // ------------------------------------------------------------------------------------------------------------
  const FlightBar = defineComponent({
    props: { concept: String, appearance: String, shape: String, variant: String, layout: String, size: { type: String, default: 'md' } },
    components: { XFieldBar },
    setup(props) {
      const s = flightState()
      const formEl = ref(null)
      const bar = ref(null)
      const anchor = computed(() => (bar.value && bar.value.root) || undefined)
      const onSubmit = (e) => { e.preventDefault(); submitFlight(s, (k) => focusIn(formEl.value, k)) }
      return { s, formEl, bar, anchor, onSubmit, CITIES, CB_LABELS, DP_LABELS, props }
    },
    template: `
      <form ref="formEl" class="xf" novalidate @submit="onSubmit" data-example="vuelos">
        <XFieldBar ref="bar" :concept="concept" :appearance="appearance" :shape="shape" :variant="variant" :layout="layout"
                   search label="Buscar vuelos" :mins="[40, 40, 32]" :grow="[1.2, 1.2, 1]">
          <GCombobox data-k="from" v-model="s.from" :options="CITIES" label="Origen" name="origen" placeholder="¿Desde dónde?"
                     :labels="CB_LABELS" :error="s.err.from" :size="size" block />
          <GCombobox data-k="to" v-model="s.to" :options="CITIES" label="Destino" name="destino" placeholder="¿A dónde?"
                     :labels="CB_LABELS" :error="s.err.to" :size="size" block />
          <GDatePicker data-k="date" v-model="s.date" label="Salida" name="salida" placeholder="Agrega una fecha"
                       :labels="DP_LABELS" :error="s.err.date" :anchor="concept === 'A' ? anchor : undefined" :size="size" block />
          <template #action>
            <GBtn type="submit" :color="concept === 'base' ? 'neutral' : 'brand'" :size="size" class="xb-go">
              <span class="xb-go__in" v-html="window.lucide('search')"></span><span class="xb-go__text">Buscar</span>
            </GBtn>
          </template>
        </XFieldBar>
        <p class="xf__log" aria-live="polite">{{ s.log }}</p>
      </form>`
  })

  const FilterBar = defineComponent({
    props: { concept: String, appearance: String, shape: String, variant: String, layout: String, size: { type: String, default: 'md' } },
    components: { XFieldBar },
    setup() {
      const s = filterState()
      const onSubmit = (e) => { e.preventDefault(); submitFilter(s) }
      return { s, onSubmit, CATS }
    },
    template: `
      <form class="xf" novalidate @submit="onSubmit" data-example="filtro">
        <XFieldBar :concept="concept" :appearance="appearance" :shape="shape" :variant="variant" :layout="layout"
                   search label="Buscar en el catálogo" :mins="[32, 50]" :grow="[1, 2.4]">
          <GSelect data-k="cat" v-model="s.cat" :options="CATS" label="Categoría" name="categoria" :size="size" block />
          <GInput data-k="q" v-model="s.q" type="search" label="Buscar" name="q" placeholder="Nombre, código o descripción" :size="size" block />
          <template #action>
            <GBtn type="submit" :color="concept === 'base' ? 'neutral' : 'brand'" :size="size" class="xb-go">
              <span class="xb-go__in" v-html="window.lucide('search')"></span><span class="xb-go__text">Buscar</span>
            </GBtn>
          </template>
        </XFieldBar>
        <p class="xf__log" aria-live="polite">{{ s.log }}</p>
      </form>`
  })

  // ------------------------------------------------------------------------------------------------------------
  // B · Frase: la barra es una frase con huecos. Las palabras son la etiqueta visible de cada campo (su <label>),
  // con un calificador oculto que completa el nombre («desde, origen»): 2.5.3 se cumple (lo visible está en el nombre).
  // ------------------------------------------------------------------------------------------------------------
  const PhraseFlight = defineComponent({
    setup() {
      const s = flightState()
      const formEl = ref(null)
      const onSubmit = (e) => { e.preventDefault(); submitFlight(s, (k) => focusIn(formEl.value, k)) }
      return { s, formEl, onSubmit, CITIES, CB_LABELS, DP_LABELS }
    },
    template: `
      <form ref="formEl" class="xf" novalidate @submit="onSubmit" data-example="vuelos">
        <div class="xp" role="search" aria-label="Buscar vuelos">
          <span class="xp__slot xp__slot--from"><GCombobox data-k="from" v-model="s.from" :options="CITIES" name="origen" placeholder="origen" :labels="CB_LABELS" :error="s.err.from">
            <template #label>Vuelo desde<span class="xp__sr"> (origen)</span></template>
          </GCombobox></span>
          <span class="xp__slot xp__slot--to"><GCombobox data-k="to" v-model="s.to" :options="CITIES" name="destino" placeholder="¿a dónde?" :labels="CB_LABELS" :error="s.err.to">
            <template #label>a<span class="xp__sr"> (destino)</span></template>
          </GCombobox></span>
          <span class="xp__slot xp__slot--date"><GDatePicker data-k="date" v-model="s.date" name="salida" placeholder="¿qué día?" :labels="DP_LABELS" :error="s.err.date">
            <template #label>el<span class="xp__sr"> (salida)</span></template>
          </GDatePicker></span>
          <GBtn type="submit" color="brand" class="xp__go"><span class="xb-go__in" v-html="window.lucide('arrow-right')"></span><span>Buscar</span></GBtn>
        </div>
        <p class="xf__log" aria-live="polite">{{ s.log }}</p>
      </form>`
  })
  const PhraseFilter = defineComponent({
    setup() {
      const s = filterState()
      // En el filtro de B no hay botón: el resultado se aplica al cambiar (la tabla de abajo se actualiza)
      const result = computed(() => `Mostrando ${s.cat}${s.q ? ` que contienen «${s.q}»` : ''}.`)
      return { s, CATS, result }
    },
    template: `
      <form class="xf" novalidate @submit.prevent data-example="filtro">
        <div class="xp" role="search" aria-label="Buscar en el catálogo">
          <span class="xp__slot xp__slot--cat"><GSelect data-k="cat" v-model="s.cat" :options="CATS" name="categoria">
            <template #label>Muestra<span class="xp__sr"> (categoría)</span></template>
          </GSelect></span>
          <span class="xp__slot xp__slot--q"><GInput data-k="q" v-model="s.q" type="search" name="q" placeholder="nombre, código o descripción">
            <template #label>que contengan<span class="xp__sr"> (buscar)</span></template>
          </GInput></span>
        </div>
        <p class="xf__log" aria-live="polite">{{ result }}</p>
      </form>`
  })

  // ------------------------------------------------------------------------------------------------------------
  // C · Resumen que se abre: en reposo, la barra es su resumen (botones de divulgación por dato). Al pulsar un dato
  // se despliega en sitio la cara A y el foco va a ESE campo; al salir de la barra (foco fuera, sin paneles abiertos)
  // o con Esc, se recoge y el foco vuelve al dato. Estrecho (< space × 140): la cara desplegada va en un GDialog hoja.
  // ------------------------------------------------------------------------------------------------------------
  const XSummaryBar = defineComponent({
    name: 'XSummaryBar',
    props: { label: String, tokens: Array, editLabel: String },
    emits: ['open'],
    setup(props, { slots }) {
      const root = ref(null)
      const open = ref(false)
      const narrow = ref(false)
      const sheet = ref(false)
      const lastToken = ref(0)
      const rid = 'xs-' + Math.random().toString(36).slice(2, 8)
      let ro = null
      const measure = () => {
        const el = root.value; if (!el) return
        const sp = parseFloat(getComputedStyle(el).getPropertyValue('--g-space-1')) || 4
        const w = el.parentElement.getBoundingClientRect().width
        narrow.value = w < sp * 140
      }
      onMounted(() => { measure(); ro = new ResizeObserver(() => requestAnimationFrame(measure)); ro.observe(root.value.parentElement) })
      onBeforeUnmount(() => ro && ro.disconnect())

      const focusField = (k) => {
        const scope = sheet.value ? document.querySelector(`#${rid}-sheet`) : root.value
        if (!scope) return
        const el = scope.querySelector(`[data-k="${k}"]`)
        if (el) el.focus({ preventScroll: true })
      }
      const openAt = (i, k) => {
        lastToken.value = i
        if (narrow.value) { sheet.value = true; setTimeout(() => focusField(k), 60); return }
        open.value = true
        nextTick(() => focusField(k))
      }
      const fold = (returnFocus) => {
        open.value = false
        if (returnFocus) nextTick(() => { const b = root.value && root.value.querySelectorAll('.xs__token')[lastToken.value]; if (b) b.focus() })
      }
      // Al cerrar la hoja el foco vuelve al DATO de forma explícita: en WebKit pulsar un botón no lo enfoca y la
      // restauración nativa del <dialog> lo llevaría a <body> (hallazgo L13)
      const closeSheet = () => {
        sheet.value = false
        setTimeout(() => { const b = root.value && root.value.querySelectorAll('.xs__token')[lastToken.value]; if (b) b.focus() }, 0)
      }
      const onFocusout = () => {
        setTimeout(() => {
          if (!open.value || !root.value) return
          const a = document.activeElement
          if (a && root.value.contains(a)) return
          if (root.value.querySelector(':popover-open') || document.querySelector('dialog[open]')) return
          fold(false)
        }, 0)
      }
      const onKeydown = (e) => {
        if (e.key !== 'Escape' || !open.value) return
        // Esc primero cierra el panel del campo (lo hace el campo); solo con nada abierto recoge la barra
        if (root.value.querySelector(':popover-open') || e.defaultPrevented) return
        e.preventDefault(); fold(true)
      }
      return () => h('div', {
        ref: root, class: ['xs', { 'is-open': open.value }], role: 'search', 'aria-label': props.label,
        onFocusout, onKeydown
      }, [
        h('div', { class: 'xs__summary', inert: open.value ? '' : undefined }, [
          ...props.tokens.map((t, i) => h('button', {
            type: 'button', class: ['xs__token', `xs__token--${t.kind || 'data'}`, { 'is-empty': !t.text }],
            'aria-expanded': String(open.value || (sheet.value && lastToken.value === i)),
            'aria-controls': open.value ? `${rid}-edit` : undefined,
            'aria-label': t.name, 'data-token': t.key,
            onClick: () => openAt(i, t.key)
          }, [icon(t.icon), h('span', { class: 'xs__text' }, t.text || t.placeholder)])),
          slots.go ? h('span', { class: 'xs__go' }, slots.go()) : null
        ]),
        h('div', { class: 'xs__edit', id: `${rid}-edit`, inert: open.value ? undefined : '' }, [
          h('div', { class: 'xs__edit-in' }, slots.default ? slots.default({ narrow: false }) : [])
        ]),
        h(Grana.GDialog, {
          // Al cerrar, el foco vuelve al DATO de forma explícita: en WebKit pulsar un botón no lo enfoca y la restauración
          // de GDialog llevaría el foco a <body> (hallazgo L13). Tras su restauración (un ciclo después)
          modelValue: sheet.value, 'onUpdate:modelValue': (v) => { if (!v) closeSheet(); else sheet.value = v },
          title: props.editLabel, closeLabel: 'Cerrar', mobile: 'sheet', size: 'sm', id: `${rid}-sheet`
        }, { default: () => (sheet.value && slots.default ? slots.default({ narrow: true, close: closeSheet }) : null) })
      ])
    }
  })

  const SummaryFlight = defineComponent({
    components: { XFieldBar, XSummaryBar },
    setup() {
      const s = flightState()
      const formEl = ref(null)
      const tokens = computed(() => [
        { key: 'from', icon: 'map-pin', text: s.from ? cityName(s.from) : '', placeholder: '¿Desde dónde?', name: `Origen: ${s.from ? cityName(s.from) : 'sin elegir'}` },
        { key: 'to', icon: 'arrow-right', text: s.to ? cityName(s.to) : '', placeholder: '¿A dónde?', name: `Destino: ${s.to ? cityName(s.to) : 'sin elegir'}` },
        { key: 'date', icon: 'calendar', text: fmtDate(s.date), placeholder: 'Fecha', name: `Salida: ${s.date ? fmtDate(s.date) : 'sin elegir'}` }
      ])
      const onSubmit = (e) => { e.preventDefault(); submitFlight(s, (k) => { const t = formEl.value.querySelector(`.xs__token[data-token="${k}"]`); if (t) t.click() }) }
      return { s, formEl, tokens, onSubmit, CITIES, CB_LABELS, DP_LABELS }
    },
    template: `
      <form ref="formEl" class="xf" novalidate @submit="onSubmit" data-example="vuelos">
        <XSummaryBar label="Buscar vuelos" edit-label="Editar la búsqueda" :tokens="tokens">
          <template #default="{ narrow, close }">
            <XFieldBar concept="A" appearance="joined" shape="pill" variant="raised" :layout="narrow ? 'column' : 'auto'" label="Datos del vuelo" :mins="[40, 40, 32]" :grow="[1.2, 1.2, 1]">
              <GCombobox data-k="from" v-model="s.from" :options="CITIES" label="Origen" name="origen" :labels="CB_LABELS" :error="s.err.from" block />
              <GCombobox data-k="to" v-model="s.to" :options="CITIES" label="Destino" name="destino" placeholder="¿A dónde?" :labels="CB_LABELS" :error="s.err.to" block />
              <GDatePicker data-k="date" v-model="s.date" label="Salida" name="salida" placeholder="Agrega una fecha" :labels="DP_LABELS" :error="s.err.date" block />
              <template #action>
                <GBtn v-if="narrow" type="button" color="brand" block @click="close && close()">Listo</GBtn>
                <GBtn v-else type="submit" color="brand" class="xb-go"><span class="xb-go__in" v-html="window.lucide('search')"></span><span class="xb-go__text">Buscar</span></GBtn>
              </template>
            </XFieldBar>
          </template>
          <template #go>
            <GBtn type="submit" color="brand" class="xb-go"><span class="xb-go__in" v-html="window.lucide('search')"></span><span class="xb-go__text">Buscar</span></GBtn>
          </template>
        </XSummaryBar>
        <p class="xf__log" aria-live="polite">{{ s.log }}</p>
      </form>`
  })
  const SummaryFilter = defineComponent({
    components: { XFieldBar, XSummaryBar },
    setup() {
      const s = filterState()
      const tokens = computed(() => [
        { key: 'cat', icon: 'tag', text: (CATS.find((c) => c.value === s.cat) || {}).label, placeholder: 'Categoría', name: `Categoría: ${(CATS.find((c) => c.value === s.cat) || {}).label || 'sin elegir'}` },
        { key: 'q', icon: 'search', text: s.q ? `«${s.q}»` : '', placeholder: 'Nombre, código o descripción', name: `Buscar: ${s.q || 'vacío'}` }
      ])
      const onSubmit = (e) => { e.preventDefault(); submitFilter(s) }
      return { s, tokens, onSubmit, CATS }
    },
    template: `
      <form class="xf" novalidate @submit="onSubmit" data-example="filtro">
        <XSummaryBar label="Buscar en el catálogo" edit-label="Editar el filtro" :tokens="tokens">
          <template #default="{ narrow, close }">
            <XFieldBar concept="A" appearance="joined" shape="pill" variant="raised" :layout="narrow ? 'column' : 'auto'" label="Datos del filtro" :mins="[32, 50]" :grow="[1, 2.4]">
              <GSelect data-k="cat" v-model="s.cat" :options="CATS" label="Categoría" name="categoria" block />
              <GInput data-k="q" v-model="s.q" type="search" label="Buscar" name="q" placeholder="Nombre, código o descripción" block />
              <template #action>
                <GBtn v-if="narrow" type="button" color="brand" block @click="close && close()">Listo</GBtn>
                <GBtn v-else type="submit" color="brand" class="xb-go"><span class="xb-go__in" v-html="window.lucide('search')"></span><span class="xb-go__text">Buscar</span></GBtn>
              </template>
            </XFieldBar>
          </template>
          <template #go>
            <GBtn type="submit" color="brand" class="xb-go"><span class="xb-go__in" v-html="window.lucide('search')"></span><span class="xb-go__text">Buscar</span></GBtn>
          </template>
        </XSummaryBar>
        <p class="xf__log" aria-live="polite">{{ s.log }}</p>
      </form>`
  })

  // ------------------------------------------------------------------------------------------------------------
  const App = defineComponent({
    props: { concept: String, opts: Object },
    components: { FlightBar, FilterBar, PhraseFlight, PhraseFilter, SummaryFlight, SummaryFilter },
    template: `
      <div>
        <template v-if="concept === 'base' || concept === 'A'">
          <section class="lab-case" :class="{ 'is-hero': opts.variant === 'raised' }">
            <h2>Vuelos</h2>
            <div class="frame" :class="{ 'frame--hero': opts.variant === 'raised' }"><FlightBar :concept="concept" :appearance="opts.appearance" :shape="opts.shape" :variant="opts.variant" :layout="opts.layout" :size="opts.size" /></div>
          </section>
          <section class="lab-case">
            <h2>Filtro de catálogo</h2>
            <div class="frame"><FilterBar :concept="concept" :appearance="opts.appearance" :shape="opts.shape" :variant="opts.variant === 'raised' ? 'outline' : opts.variant" :layout="opts.layout" :size="opts.size" /></div>
          </section>
        </template>
        <template v-else-if="concept === 'B'">
          <section class="lab-case"><h2>Vuelos</h2><div class="frame"><PhraseFlight /></div></section>
          <section class="lab-case"><h2>Filtro de catálogo</h2><div class="frame"><PhraseFilter /></div></section>
        </template>
        <template v-else>
          <section class="lab-case"><h2>Vuelos</h2><div class="frame frame--hero"><SummaryFlight /></div></section>
          <section class="lab-case"><h2>Filtro de catálogo</h2><div class="frame"><SummaryFilter /></div></section>
        </template>
      </div>`
  })

  window.FieldBarLab = {
    mount(sel, concept, opts) {
      const app = createApp(App, { concept, opts })
      app.config.globalProperties.window = window
      app.use(Grana)
      if (window.GranaCombobox) app.use(GranaCombobox)
      const vm = app.mount(sel)
      window.__fb = { app, vm, ready: true }
      return app
    }
  }
})()
