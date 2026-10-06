// GCombobox · Fase 2 (`multiple`) · motor de prototipo (kiwi, r03). NO es el componente: fija semántica, teclado, modelo,
// anuncios y los tres conceptos de «dónde viven los elegidos» (A frase · B receta · C cesta) y la referencia convencional
// (base: fichas con × dentro de la caja). Compone el GInput real de dist/ (slots internos `field` y `end`, #309) y pinta
// opciones, renglones y cesta con el GSummary real (#356). Sin fetch: el catálogo lo entrega la «aplicación» (abajo).
(function () {
  const { defineComponent, ref, computed, watch, nextTick, onMounted, onBeforeUnmount, reactive, createApp } = Vue
  const svg = (n) => window.lucide(n)
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const foldCh = (c) => c.normalize('NFD')[0].toLowerCase()
  const fold = (s) => Array.from(String(s ?? ''), foldCh).join('')
  const tokens = (q) => fold(q).split(/\s+/).filter(Boolean)
  const fill = (s, o) => (typeof s === 'function' ? s(o) : String(s || '').replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? '')))
  const nf = new Intl.NumberFormat('es-MX')
  const lf = new Intl.ListFormat('es', { type: 'conjunction' })
  const haystack = (o) => fold([o.label, o.code, o.description, ...(o.facts || []).map((f) => f.value)].filter(Boolean).join(' '))
  const canvas = document.createElement('canvas').getContext('2d')
  const liveLog = (window.__live = [])
  // Movimiento con la API de animaciones, leyendo los tokens del tema: así solo se anima lo que cambia por un gesto
  // (nada al montar ni al abrir: #336), y con movimiento reducido no se anima nada.
  function tok(el, name) { return getComputedStyle(el).getPropertyValue(name).trim() }
  let slowMs = null
  function slow(el) { if (slowMs === null) { const pr = document.createElement('span'); pr.style.transitionDuration = 'var(--g-duration-slow)'; el.append(pr); slowMs = parseFloat(getComputedStyle(pr).transitionDuration) * 1000; pr.remove() } return slowMs }
  function animate(el, frames, ease) { if (!el || reduced() || !el.animate) return; el.animate(frames, { duration: slow(el), easing: tok(el, ease) || 'ease-out' }) }
  const PAGE = 10 // filas de Av Pág (constante de JS, como en la Fase 1)
  const LEDGER_CAP = 6 // B: renglones visibles en reposo antes de «Ver los N» (constante de diseño; para lima)
  const PIN_CAP = 12 // A (grupo «Elegidas») y C (cesta): filas antes de «Ver las N» (constante de diseño; para lima)

  const BASE_LABELS = {
    selected: (n) => (n === 1 ? '1 seleccionada' : `${nf.format(n)} seleccionadas`),
    added: 'Se agregó {label}', removed: 'Se quitó {label}', restored: 'Se restauró {label}', clearedAll: 'Se quitaron todas',
    armed: 'Pulsa Retroceso otra vez para quitar {label}', max: 'Máximo {max}: quita una para elegir otra',
    remove: 'Quitar {label}', undo: 'Deshacer', tomb: '{label} quitada', fresh: 'Nueva', more: '{count} más',
    useCustom: 'Usar «{text}» como texto libre', custom: 'Texto libre', clear: 'Quitar todas', chosen: 'Elegidas',
    noResults: 'Sin resultados para «{text}»', done: 'Listo', close: 'Cerrar', showAll: 'Ver las {count}', showLess: 'Ver menos',
    basketEmpty: 'Aún no hay ninguna. Las que marques aparecen aquí.', showMore: 'Mostrar más ({shown} de {total})',
    ofMax: '{count} de {max}', already: '{label} ya está elegida'
  }

  // ---------------------------------------------------------------------------------------------------------------
  // Panel: lista con selección múltiple (la comparten el popover de `field` y la superficie)
  // ---------------------------------------------------------------------------------------------------------------
  const XPanel = defineComponent({
    name: 'XPanel',
    props: { id: String, view: Object, active: String, q: String, isSel: Function, maxed: Boolean, L: Object, surface: Boolean },
    emits: ['pick', 'hover'],
    setup() { return { svg, fill } },
    template: `
    <div class="xm-panel" :class="{ 'xm-panel--surface': surface }" @mousedown.prevent>
      <p v-if="view.status" class="xm-status" :class="'xm-status--' + view.status.kind" :id="id + '-status'"><span v-html="svg(view.status.icon)"></span><span>{{ view.status.text }}</span></p>
      <ul class="xm-list" role="listbox" :id="id + '-list'" aria-multiselectable="true" :aria-labelledby="id + '-label'" :hidden="!view.rows.length">
        <li v-for="b in view.blocks" :key="b.id" role="presentation" class="xm-groupwrap" :class="{ 'is-chosen': b.chosen }">
          <ul class="xm-group" role="group" :aria-labelledby="b.id">
            <li class="xm-group__label" :id="b.id" role="presentation"><span>{{ b.label }}</span><span v-if="b.tally" class="xm-group__tally"><span class="xm-num" :key="b.tally">{{ b.tally }}</span></span></li>
            <li v-for="r in b.rows" :key="r.id" :id="r.id" role="option" class="xm-opt" :class="{ 'is-active': active === r.id, 'is-custom': r.custom }"
              :aria-selected="isSel(r) ? 'true' : 'false'" :aria-disabled="r.opt.disabled || (maxed && !isSel(r)) ? 'true' : undefined"
              @click="$emit('pick', r)" @pointermove="$emit('hover', r)">
              <span class="xm-box" aria-hidden="true"><span v-html="svg('check')"></span></span>
              <g-summary layout="row" :lines="2" :size="surface ? 'md' : 'md'" :title="r.opt.label" :code="r.opt.code" :subtitle="r.custom ? L.custom : (r.opt.facts ? undefined : r.opt.description)"
                :facts="r.opt.facts" :avatar="r.opt.avatar ? true : undefined" :icon="r.custom ? 'pencil' : r.opt.icon" :highlight="q || undefined" :diff="r.diff" />
            </li>
            <li v-if="b.more" :id="b.more.id" role="option" aria-selected="false" class="xm-opt xm-opt--action" :class="{ 'is-active': active === b.more.id }" @click="$emit('pick', b.more)" @pointermove="$emit('hover', b.more)">
              <span class="xm-opt__lead" aria-hidden="true" v-html="svg('list')"></span><span class="xm-opt__label">{{ b.more.opt.label }}</span>
            </li>
          </ul>
        </li>
        <li v-for="r in view.actions" :key="r.id" :id="r.id" role="option" aria-selected="false" class="xm-opt xm-opt--action" :class="{ 'is-active': active === r.id }"
          :aria-disabled="r.off ? 'true' : undefined" @click="$emit('pick', r)" @pointermove="$emit('hover', r)">
          <span class="xm-opt__lead" aria-hidden="true" v-html="svg(r.icon)"></span><span class="xm-opt__label">{{ r.text }}</span>
        </li>
      </ul>
    </div>`
  })

  // ---------------------------------------------------------------------------------------------------------------
  // Renglones: la receta de B (debajo de la caja) y la cesta de C (en la superficie). Cada uno con «Quitar»; quitar
  // deja un rastro con «Deshacer» en el mismo sitio (Δ0) hasta la siguiente pasada.
  // ---------------------------------------------------------------------------------------------------------------
  const XRows = defineComponent({
    name: 'XRows',
    props: { id: String, rows: Array, editable: Boolean, armed: String, L: Object, numbered: Boolean, cap: Number, expanded: Boolean, label: String },
    emits: ['remove', 'undo', 'toggle'],
    setup(props) {
      const shown = computed(() => props.rows.filter((r, i) => props.expanded || !props.cap || i < props.cap || r.fresh || r.tomb))
      const live = computed(() => props.rows.filter((r) => !r.tomb).length)
      const nOf = (r) => props.rows.filter((x) => !x.tomb).indexOf(r) + 1
      const diffs = computed(() => { const v = shown.value.filter((r) => !r.tomb); const d = window.Grana.summaryDiff(v.map((r) => ({ title: r.item.opt.label, facts: r.item.opt.facts || [] }))); const m = {}; v.forEach((r, n) => { m[r.key] = d[n] || undefined }); return m })
      return { svg, fill, shown, live, nOf, diffs }
    },
    template: `
    <div class="xm-rows">
      <ul class="xm-rows__list" :id="id + '-rows'" :aria-label="label">
        <li v-for="r in shown" :key="r.key" class="xm-row" :class="{ 'is-tomb': r.tomb, 'is-fresh': r.fresh && !r.tomb, 'is-armed': armed === r.key, 'is-entering': r.entering, 'is-leaving': r.leaving, 'is-arriving': r.arriving, 'is-custom': r.item.custom }"
          :data-key="r.key" :style="r.travel">
          <div class="xm-row__in">
            <template v-if="!r.tomb">
              <span v-if="numbered" class="xm-row__n" aria-hidden="true">{{ nOf(r) }}</span>
              <g-summary layout="row" :lines="2" size="md" :title="r.item.opt.label" :code="r.item.opt.code" :subtitle="r.item.custom ? L.custom : (r.item.opt.facts ? undefined : r.item.opt.description)"
                :facts="r.item.opt.facts" :avatar="r.item.opt.avatar ? true : undefined" :icon="r.item.custom ? 'pencil' : r.item.opt.icon" :diff="diffs[r.key]" />
              <span v-if="r.fresh" class="xm-row__fresh">{{ L.fresh }}</span>
              <button v-if="editable" type="button" class="xm-iconbtn xm-row__x" :aria-label="fill(L.remove, { label: r.item.opt.label })" @click="$emit('remove', r)"><span v-html="svg('x')"></span></button>
            </template>
            <template v-else>
              <span class="xm-row__tomb" :id="id + '-t-' + r.uid">{{ fill(L.tomb, { label: r.item.opt.label }) }}</span>
              <button type="button" class="xm-textbtn xm-row__undo" :aria-describedby="id + '-t-' + r.uid" @click="$emit('undo', r)"><span v-html="svg('undo-2')"></span>{{ L.undo }}</button>
            </template>
          </div>
        </li>
      </ul>
      <button v-if="cap && live > cap" type="button" class="xm-textbtn xm-rows__all" :aria-expanded="expanded ? 'true' : 'false'" :aria-controls="id + '-rows'" @click="$emit('toggle')">
        <span v-html="svg(expanded ? 'chevron-down' : 'list')"></span>{{ expanded ? L.showLess : fill(L.showAll, { count: live }) }}</button>
    </div>`
  })

  // ---------------------------------------------------------------------------------------------------------------
  // El campo
  // ---------------------------------------------------------------------------------------------------------------
  let uid = 0
  const XMulti = defineComponent({
    name: 'XMulti',
    components: { XPanel, XRows },
    inheritAttrs: false,
    props: {
      id: String, concept: { type: String, default: 'A' }, label: String, hint: String, error: String, placeholder: String, icon: { type: String, default: 'search' },
      name: String, customName: String, options: { type: Array, default: () => [] }, selectedOptions: { type: Array, default: () => [] },
      modelValue: { type: Array, default: () => [] }, custom: { type: Array, default: () => [] }, max: Number, allowCustom: Boolean, clearable: Boolean,
      readonly: Boolean, disabled: Boolean, required: Boolean, block: Boolean, limit: { type: Number, default: 50 }, numbered: Boolean, labels: { type: Object, default: () => ({}) }
    },
    emits: ['update:modelValue', 'update:custom', 'change', 'open', 'close', 'search'],
    setup(props, { emit, attrs }) {
      const id = props.id || `xm${++uid}`
      const L = computed(() => ({ ...BASE_LABELS, ...props.labels }))
      const root = ref(null), pop = ref(null), dlg = ref(null), sIn = ref(null), live = ref(null), live2 = ref(null), cell = ref(null)
      let inputEl = null
      const text = ref(''), open = ref(false), surfaceOpen = ref(false), active = ref(null), auto = ref(false), up = ref(false), focused = ref(false)
      const armed = ref(null), pinned = ref([]), shownLimit = ref(props.limit), pinAll = ref(false), narrow = ref(false), expanded = ref(false), composing = ref(false)
      const sentence = ref({ parts: [], hidden: 0 })
      let lastRemoved = null, lastTypedAt = 0, leftComponent = true, ro = null, mq = null
      const editable = computed(() => !props.readonly && !props.disabled)
      const surfaceMode = computed(() => narrow.value || props.concept === 'C')
      const shape = computed(() => (props.concept === 'base' ? 'panel' : 'field')) // A y B: «el campo se abre» (identidad A, #329)

      // ---- Opciones conocidas y elegidas (el componente no guarda copia del modelo: pinta las props)
      const known = reactive(new Map())
      const flat = computed(() => {
        const out = []; let i = 0
        for (const o of props.options) {
          if (o && Array.isArray(o.options)) for (const x of o.options) out.push({ opt: x, g: o.label, i: i++ })
          else if (o) out.push({ opt: o, g: null, i: i++ })
        }
        return out
      })
      watch([flat, () => props.selectedOptions], () => { for (const r of flat.value) known.set(r.opt.value, r.opt); for (const o of props.selectedOptions) known.set(o.value, o) }, { immediate: true })
      const keyV = (v) => 'v:' + String(v), keyC = (t) => 'c:' + t
      const chosen = computed(() => [
        ...props.modelValue.map((v) => ({ key: keyV(v), value: v, custom: false, opt: known.get(v) || { value: v, label: String(v) } })),
        ...props.custom.map((t) => ({ key: keyC(t), text: t, custom: true, opt: { label: t } }))
      ])
      const count = computed(() => chosen.value.length)
      const maxed = computed(() => Boolean(props.max) && count.value >= props.max)
      const short = (c) => (c.custom ? c.text : (c.opt.code || c.opt.label))
      const full = (c) => (c.custom ? `${c.text} (${L.value.custom})` : (c.opt.code ? `${c.opt.code} ${c.opt.label}` : c.opt.label))
      const about = computed(() => (count.value ? `${fill(L.value.selected, count.value)}: ${lf.format(chosen.value.map(full))}` : ''))
      const tally = computed(() => (props.max ? fill(L.value.ofMax, { count: nf.format(count.value), max: nf.format(props.max) }) : fill(L.value.selected, count.value)))
      const isSel = (r) => (r.custom ? props.custom.includes(r.text) : props.modelValue.includes(r.opt.value))

      // ---- Región viva (educada): la del componente o, con la superficie abierta, la de dentro del diálogo
      let liveT = 0
      function say(t) {
        const node = surfaceOpen.value ? live2.value : live.value
        if (!node) return
        liveLog.push({ id, text: t, where: surfaceOpen.value ? 'surface' : 'field' })
        clearTimeout(liveT); node.textContent = ''
        liveT = setTimeout(() => { node.textContent = t }, 40)
      }

      // ---- Vista de la lista: se ordena al abrir y al cambiar el texto; marcar o desmarcar NO reordena (puntero quieto, #358)
      const query = computed(() => text.value.trim())
      const usePinned = computed(() => props.concept === 'A' || narrow.value) // A: «Elegidas» arriba; en la hoja, todos
      function snapshot() { pinned.value = usePinned.value && !query.value ? chosen.value.map((c) => ({ ...c })) : []; shownLimit.value = props.limit; pinAll.value = false }
      const view = computed(() => {
        const q = query.value, toks = tokens(q), blocks = [], rows = [], actions = []
        const pinKeys = new Set(pinned.value.map((p) => p.key))
        if (pinned.value.length) {
          const b = { id: `${id}-g-chosen`, label: L.value.chosen, tally: props.max ? fill(L.value.ofMax, { count: nf.format(count.value), max: nf.format(props.max) }) : nf.format(count.value), chosen: true, rows: [] }
          pinned.value.forEach((p, n) => { if (!pinAll.value && n >= PIN_CAP) return; const r = p.custom ? { id: `${id}-p${n}`, custom: true, text: p.text, opt: { label: p.text } } : { id: `${id}-o${flat.value.findIndex((x) => x.opt.value === p.value)}x${n}`, opt: p.opt }; b.rows.push(r); rows.push(r) })
          blocks.push(b)
          if (!pinAll.value && pinned.value.length > PIN_CAP) { const r = { id: `${id}-pins`, kind: 'pins', pin: true, icon: 'list', opt: { label: fill(L.value.showAll, { count: nf.format(pinned.value.length) }) } }; b.more = r; rows.push(r) }
        }
        let shown = 0, total = 0, cur = null
        for (const r of flat.value) {
          if (pinKeys.has(keyV(r.opt.value))) continue
          if (toks.length && !toks.every((t) => haystack(r.opt).includes(t))) continue
          total++
          if (shown >= shownLimit.value) continue
          shown++
          if (!cur || cur.g !== r.g) { cur = { id: `${id}-g${blocks.length}`, label: r.g, g: r.g, rows: [] }; blocks.push(cur) }
          const row = { id: `${id}-o${r.i}`, opt: r.opt }
          cur.rows.push(row); rows.push(row)
        }
        for (const b of blocks) if (!b.label && !b.chosen) b.label = ''
        if (total > shown) actions.push({ id: `${id}-more`, kind: 'more', icon: 'chevron-down', text: fill(L.value.showMore, { shown: nf.format(shown), total: nf.format(total) }) })
        if (props.allowCustom && q && !flat.value.some((r) => fold(r.opt.label) === fold(q)) && !props.custom.some((t) => fold(t) === fold(q)))
          actions.push({ id: `${id}-custom`, kind: 'custom', icon: 'pencil', text: fill(L.value.useCustom, { text: q }), off: maxed.value })
        // Contraste entre homónimos (#354): solo entre las filas a la vista
        const dif = window.Grana.summaryDiff(rows.map((r) => ({ title: r.opt.label, facts: r.opt.facts || [] })))
        rows.forEach((r, n) => { r.diff = dif[n] || undefined })
        let status = null
        if (maxed.value) status = { kind: 'max', icon: 'circle-alert', text: fill(L.value.max, { max: nf.format(props.max) }) }
        else if (q && !shown) status = { kind: 'empty', icon: 'search', text: fill(L.value.noResults, { text: q }) }
        return { blocks: blocks.filter((b) => b.rows.length), rows, actions, nav: [...rows, ...actions], status }
      })
      const hasPanel = computed(() => view.value.nav.length > 0 || Boolean(view.value.status))
      const navRow = (rid) => view.value.nav.find((r) => r.id === rid)
      const usable = (r) => r && !(r.opt && r.opt.disabled) // tope alcanzado: navegable, no elegible (se dice por qué)
      function move(delta) {
        const nav = view.value.nav.filter(usable); if (!nav.length) return
        let i = nav.findIndex((r) => r.id === active.value)
        i = i === -1 ? (delta > 0 ? 0 : nav.length - 1) : Math.max(0, Math.min(nav.length - 1, i + delta))
        active.value = nav[i].id; auto.value = false; reveal()
      }
      function reveal() { nextTick(() => { const el = active.value && document.getElementById(active.value); const sc = el && el.closest('.xm-panel'); if (!el || !sc) return; const a = el.getBoundingClientRect(), b = sc.getBoundingClientRect(); if (a.top < b.top) sc.scrollTop -= b.top - a.top; else if (a.bottom > b.bottom) sc.scrollTop += a.bottom - b.bottom }) }

      // ---- Texto fantasma (identidad A, #333): solo en la forma `field`, por prefijo, con el cursor al final
      const ghost = computed(() => {
        if (shape.value !== 'field' || surfaceMode.value || !open.value || !query.value || composing.value || !auto.value) return null
        const first = view.value.rows[0]; if (!first || active.value !== first.id || first.custom) return null
        const lab = first.opt.label, t = text.value
        if (fold(lab).startsWith(fold(t)) && lab.length > t.length) return { typed: t, rest: lab.slice(t.length) }
        return null
      })

      // ---- Cambios del modelo (uno por gesto) y anuncios
      function emitModel(nextV, nextC, added, removed) {
        if (nextV !== props.modelValue) emit('update:modelValue', nextV)
        if (nextC !== props.custom) emit('update:custom', nextC)
        emit('change', { value: nextV, custom: nextC, options: nextV.map((v) => known.get(v)).filter(Boolean), added, removed })
      }
      function add(r) {
        if (r.custom ? props.custom.includes(r.text) : props.modelValue.includes(r.opt.value)) return
        if (maxed.value) { say(fill(L.value.max, { max: nf.format(props.max) })); return false }
        const item = r.custom ? { key: keyC(r.text), text: r.text, custom: true, opt: { label: r.text } } : { key: keyV(r.opt.value), value: r.opt.value, custom: false, opt: r.opt }
        ledgerAdd(item, r)
        if (r.custom) emitModel(props.modelValue, [...props.custom, r.text], [item], [])
        else emitModel([...props.modelValue, r.opt.value], props.custom, [item], [])
        nextTick(() => { say(`${fill(L.value.added, { label: item.opt.label })}. ${fill(L.value.selected, count.value)}.`) })
        return true
      }
      function removeItem(item, quiet) {
        const idx = item.custom ? props.custom.indexOf(item.text) : props.modelValue.indexOf(item.value)
        if (idx === -1) return
        ledgerRemove(item)
        if (item.custom) emitModel(props.modelValue, props.custom.filter((t) => t !== item.text), [], [item])
        else emitModel(props.modelValue.filter((v) => v !== item.value), props.custom, [], [item])
        lastRemoved = { items: [{ item, idx }], at: performance.now() }
        armed.value = null
        nextTick(() => { if (!quiet) say(`${fill(L.value.removed, { label: item.opt.label })}. ${fill(L.value.selected, count.value)}.`) })
      }
      function clearAll() {
        if (!count.value) return
        const items = chosen.value.map((c, n) => ({ item: c, idx: c.custom ? props.custom.indexOf(c.text) : props.modelValue.indexOf(c.value) }))
        items.forEach((x) => ledgerRemove(x.item))
        emitModel([], [], [], items.map((x) => x.item))
        lastRemoved = { items, at: performance.now() }
        nextTick(() => say(L.value.clearedAll))
        inputEl && inputEl.focus()
      }
      function undo() {
        if (!lastRemoved) return false
        let v = props.modelValue.slice(), c = props.custom.slice()
        const back = []
        for (const { item, idx } of lastRemoved.items) {
          if (item.custom) { if (!c.includes(item.text)) { c.splice(Math.min(idx, c.length), 0, item.text); back.push(item) } }
          else if (!v.includes(item.value)) { if (props.max && v.length + c.length >= props.max) continue; v.splice(Math.min(idx, v.length), 0, item.value); back.push(item) }
        }
        lastRemoved = null
        if (!back.length) return false
        back.forEach((it) => ledgerRestore(it))
        emitModel(v, c, back, [])
        nextTick(() => { say(`${fill(L.value.restored, { label: lf.format(back.map((b) => b.opt.label)) })}. ${fill(L.value.selected, count.value)}.`) })
        return back
      }
      function toggle(r) {
        if (r.kind === 'pins') { pinAll.value = true; nextTick(() => { const nr = view.value.rows[PIN_CAP]; if (nr) { active.value = nr.id; auto.value = false; reveal() } }); return }
        if (r.kind === 'more') { shownLimit.value += props.limit; const first = view.value.rows.length; nextTick(() => { const nr = view.value.rows[first]; if (nr) { active.value = nr.id; auto.value = false; reveal() } }); return }
        if (r.kind === 'custom') { if (r.off) { say(fill(L.value.max, { max: nf.format(props.max) })); return } add({ custom: true, text: query.value }); selectText(); return }
        if (r.opt.disabled) return
        if (isSel(r)) { const it = r.custom ? { key: keyC(r.text), text: r.text, custom: true, opt: { label: r.text } } : chosen.value.find((c) => !c.custom && c.value === r.opt.value); if (it) removeItem(it) }
        else add(r)
        active.value = r.id; auto.value = false
        selectText()
        nextTick(() => { const b = document.getElementById(r.id); if (b && b.getAttribute('aria-selected') === 'true') animate(b.querySelector('.xm-box > span'), [{ transform: 'scale(.4)' }, { transform: 'none' }], '--g-ease-bounce') })
      }
      // Tras elegir, el texto queda seleccionado: lo siguiente que se teclea lo reemplaza (regla de la Fase 1), y la lista sigue
      function selectText() { const el = surfaceOpen.value ? sIn.value : inputEl; if (el && el.value) nextTick(() => el.select()) }

      // ---- B y C: renglones con rastro. Una «pasada» empieza al volver al campo desde fuera.
      const ledger = ref([]) // { key, item, tomb, fresh, uid, entering, leaving, arriving, travel }
      let rowUid = 0
      function ledgerSync() {
        const map = new Map(chosen.value.map((c) => [c.key, c]))
        ledger.value = ledger.value.filter((r) => r.tomb || map.has(r.key))
        for (const r of ledger.value) if (map.has(r.key)) { r.item = map.get(r.key); r.tomb = false }
        const have = new Set(ledger.value.map((r) => r.key))
        for (const c of chosen.value) if (!have.has(c.key)) ledger.value.push({ key: c.key, item: c, uid: ++rowUid })
      }
      function ledgerAdd(item, fromRow) {
        const anim = !reduced()
        const ex = ledger.value.find((r) => r.key === item.key)
        if (ex) { ex.tomb = false; ex.item = item; return }
        const row = reactive({ key: item.key, item, uid: ++rowUid, fresh: props.concept === 'B', entering: anim && props.concept === 'B' })
        ledger.value.push(row)
        if (props.concept === 'C' && surfaceOpen.value && anim && fromRow) travel(row, fromRow)
        if (row.entering) setTimeout(() => { row.entering = false }, 600)
      }
      function ledgerRemove(item) { const r = ledger.value.find((x) => x.key === item.key); if (r) r.tomb = true }
      function ledgerRestore(item) { const r = ledger.value.find((x) => x.key === item.key); if (r) { r.tomb = false; r.item = item } else ledger.value.push({ key: item.key, item, uid: ++rowUid }) }
      function newPass() {
        const tombs = ledger.value.filter((r) => r.tomb)
        ledger.value.forEach((r) => { r.fresh = false })
        if (!tombs.length) return ledgerSync()
        if (reduced()) { ledger.value = ledger.value.filter((r) => !r.tomb); return }
        tombs.forEach((r) => { r.leaving = true })
        setTimeout(() => { ledger.value = ledger.value.filter((r) => !r.leaving) }, 420)
      }
      watch(chosen, () => { if (!ledger.value.length && chosen.value.length) ledgerSync() }, { immediate: true })
      watch(() => [props.modelValue, props.custom], () => { if (!focused.value && !surfaceOpen.value) ledgerSync() })
      // C: el elegido viaja de su fila a la cesta (vector de la Fase 1, «la ficha llega»)
      function travel(row, fromRow) {
        const src = document.getElementById(fromRow.id); if (!src) return
        const a = src.querySelector('.g-summary__title') || src
        const ar = a.getBoundingClientRect()
        nextTick(() => {
          const el = dlg.value && dlg.value.querySelector(`.xm-row[data-key="${CSS.escape(row.key)}"] .g-summary__title`); if (!el) return
          const br = el.getBoundingClientRect()
          row.travel = { '--_tx': `${ar.left - br.left}px`, '--_ty': `${ar.top - br.top}px` }
          row.arriving = true
          setTimeout(() => { row.arriving = false; row.travel = null }, 700)
        })
      }
      function rowRemove(r) {
        removeItem(r.item)
        nextTick(() => nextTick(() => { const el = (surfaceOpen.value ? dlg.value : root.value).querySelector(`.xm-row[data-key="${CSS.escape(r.key)}"] .xm-row__undo`); el && el.focus() }))
      }
      function rowUndo(r) {
        if (!lastRemoved || !lastRemoved.items.some((x) => x.item.key === r.key)) { lastRemoved = { items: [{ item: r.item, idx: Infinity }], at: performance.now() } }
        else lastRemoved.items = lastRemoved.items.filter((x) => x.item.key === r.key)
        undo()
        nextTick(() => nextTick(() => { const el = (surfaceOpen.value ? dlg.value : root.value).querySelector(`.xm-row[data-key="${CSS.escape(r.key)}"] .xm-row__x`); el && el.focus() }))
      }

      // ---- Frase de A y C: la lista elegida como texto, que cede por el final («y 3 más») sin cambiar el alto (Δ0)
      function fit() {
        const c = cell.value, items = chosen.value
        if (!c || !inputEl || props.concept === 'B' || props.concept === 'base' || !items.length) { sentence.value = { parts: [], hidden: 0 }; return }
        const cs = getComputedStyle(inputEl); canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
        const W = c.clientWidth * (focused.value || open.value ? 0.55 : 1) - (focused.value || open.value ? 0 : parseFloat(cs.fontSize) * 1.2)
        const n = items.length
        const ai = armed.value ? items.findIndex((x) => x.key === armed.value) : -1
        let pick = null
        for (let k = n; k >= 1; k--) {
          let vis = items.slice(0, k)
          if (ai >= k) vis = items.slice(0, k - 1).concat(items[ai])
          const words = vis.map(short); if (k < n) words.push(fill(L.value.more, { count: nf.format(n - k) }))
          const w = canvas.measureText(lf.format(words)).width + (vis.some((x) => x.custom) ? parseFloat(cs.fontSize) : 0)
          pick = { vis, hidden: n - k, words }
          if (w <= W) break
        }
        let ei = 0
        const parts = lf.formatToParts(pick.words).map((p) => {
          if (p.type !== 'element') return { lit: true, t: p.value }
          const item = pick.vis[ei++]
          return item ? { t: p.value, item, armed: item.key === armed.value } : { t: p.value, more: true }
        })
        sentence.value = { parts, hidden: pick.hidden }
      }
      watch([chosen, focused, open, armed, () => props.concept], () => nextTick(fit))

      // ---- Colocación del popover (forma A «el campo se abre»; base: panel separado)
      function place() {
        const p = pop.value, box = root.value && root.value.querySelector('.g-input__control'); if (!p || !box) return
        const r = box.getBoundingClientRect(), vh = innerHeight
        const below = vh - r.bottom, above = r.top
        const natural = Math.min(p.scrollHeight, 360)
        if (!open.value || p.dataset.side === undefined) up.value = below < Math.min(240, natural) && above > below
        p.dataset.side = up.value ? 'up' : 'down'
        const field = shape.value === 'field'
        p.style.setProperty('--_x', `${r.left}px`); p.style.setProperty('--_w', `${r.width}px`); p.style.setProperty('--_fh', `${r.height}px`)
        if (up.value) { p.style.setProperty('--_top', 'auto'); p.style.setProperty('--_bottom', `${vh - (field ? r.bottom : r.top - 4)}px`); p.style.setProperty('--_max', `${(field ? r.bottom : r.top - 4) - 8}px`) }
        else { p.style.setProperty('--_bottom', 'auto'); p.style.setProperty('--_top', `${field ? r.top : r.bottom + 4}px`); p.style.setProperty('--_max', `${vh - (field ? r.top : r.bottom + 4) - 8}px`) }
      }
      let raf = 0
      const follow = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place) }

      // ---- Abrir y cerrar
      function openList() {
        if (!editable.value) return
        if (surfaceMode.value) return openSurface('')
        if (!open.value) { snapshot(); open.value = true; delete pop.value.dataset.side; emit('open'); nextTick(() => { try { pop.value.showPopover() } catch (e) {} place() }) }
      }
      function closeList() {
        if (!open.value) return
        open.value = false; active.value = null; auto.value = false; pinned.value = []
        try { pop.value.hidePopover() } catch (e) {}
        emit('close')
      }
      function openSurface(initial) {
        if (!editable.value || surfaceOpen.value) return
        text.value = initial || ''; snapshot(); surfaceOpen.value = true; armed.value = null; emit('open')
        if (props.concept === 'C') ledger.value.forEach((r) => { r.fresh = false })
        nextTick(() => { dlg.value.showModal(); const s = sIn.value; s.focus(); s.setSelectionRange(s.value.length, s.value.length); if (initial) { auto.value = true; const f = view.value.rows[0]; active.value = f ? f.id : null } })
      }
      function closeSurface() {
        if (!surfaceOpen.value) return
        surfaceOpen.value = false; active.value = null; text.value = ''; pinned.value = []
        dlg.value.close(); emit('close')
        ledger.value = ledger.value.filter((r) => !r.tomb); ledger.value.forEach((r) => { r.fresh = false })
        nextTick(() => inputEl && inputEl.focus())
      }

      // ---- Entrada de texto
      function onInput(e) {
        text.value = e.target.value; lastTypedAt = performance.now(); armed.value = null
        if (!editable.value) return
        if (surfaceMode.value && !surfaceOpen.value) { const t = text.value; text.value = ''; e.target.value = ''; return openSurface(t) }
        snapshot()
        if (!surfaceOpen.value && !open.value) openList()
        emit('search', query.value)
        auto.value = true
        nextTick(() => { const f = view.value.rows.find(usable) || view.value.actions[0]; active.value = query.value && f ? f.id : null; if (!query.value) auto.value = false; reveal() })
      }
      function onKey(e) {
        if (e.isComposing || composing.value) return
        const k = e.key, inSurface = surfaceOpen.value
        if (k !== 'Backspace') armed.value = null
        if (!editable.value) return
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (k === 'z' || k === 'Z')) {
          if (lastRemoved && lastRemoved.at > lastTypedAt) { e.preventDefault(); undo() }
          return
        }
        // Disparador de la superficie (C y móvil): abre con Intro, Espacio, flechas; la primera tecla se conserva (onInput)
        if (surfaceMode.value && !inSurface) {
          if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(k)) { e.preventDefault(); openSurface('') }
          else if (k === 'Backspace') backspace(e)
          return
        }
        const isOpen = inSurface || open.value
        switch (k) {
          case 'ArrowDown': case 'ArrowUp':
            e.preventDefault()
            if (e.altKey) { if (k === 'ArrowUp' && open.value) closeList(); else if (!isOpen) openList(); return }
            if (!isOpen) { openList(); nextTick(() => move(k === 'ArrowDown' ? 1 : -1)) } else move(k === 'ArrowDown' ? 1 : -1)
            return
          case 'PageDown': case 'PageUp': if (isOpen) { e.preventDefault(); move(k === 'PageDown' ? PAGE : -PAGE) } return
          case 'ArrowRight': {
            const el = e.target
            if (ghost.value && el.selectionStart === el.value.length) { e.preventDefault(); const g = ghost.value; text.value = g.typed + g.rest; el.value = text.value; auto.value = false; nextTick(() => el.setSelectionRange(el.value.length, el.value.length)) }
            return
          }
          case 'Enter':
            if (!isOpen) return // nativo: envío implícito
            e.preventDefault()
            if (active.value) {
              const r = navRow(active.value); if (!r) return
              // Intro sobre una opción YA elegida que quedó activa sola (no la movió la persona) no la quita: escribir el
              // nombre de algo que ya está para «agregarlo» nunca lo borra. Quitar con Intro exige activarla con flechas o puntero
              if (auto.value && r.opt && !r.kind && isSel(r)) { say(fill(L.value.already, { label: r.opt.label })); selectText(); return }
              toggle(r)
            }
            return
          case 'Escape':
            if (inSurface) { e.preventDefault(); e.stopPropagation(); closeSurface(); return } // un nivel: no cierra un GDialog anfitrión
            if (open.value) { e.preventDefault(); e.stopPropagation(); closeList(); return }
            if (text.value) { e.preventDefault(); e.stopPropagation(); text.value = ''; e.target.value = '' }
            return
          case 'Tab': if (open.value) closeList(); return // Tab nunca elige en `multiple`
          case 'Backspace': backspace(e); return
        }
      }
      // Retroceso con el campo vacío: la primera pulsación MARCA la última elegida (y lo dice), la segunda la quita.
      // La repetición automática (tecla sostenida para borrar el texto) nunca quita nada.
      function backspace(e) {
        const el = e.target
        if (el.value !== '' || el.selectionStart !== 0 || el.selectionEnd !== 0) return
        if (e.repeat || !count.value) return
        e.preventDefault()
        const last = chosen.value[chosen.value.length - 1]
        if (armed.value === last.key) { removeItem(last); return }
        armed.value = last.key
        say(fill(L.value.armed, { label: last.opt.label }))
      }

      // ---- Foco y puntero
      function onFocus() {
        focused.value = true
        if (leftComponent && props.concept === 'B') newPass()
        leftComponent = false
        nextTick(fit)
      }
      function onBlur() {
        focused.value = false
        if (surfaceOpen.value) return
        closeList(); text.value = ''; armed.value = null; if (inputEl) inputEl.value = '' // el texto a medio escribir se descarta: nunca se agrega al pasar
      }
      function onFocusOut(e) { const to = e.relatedTarget; if (!to || !(root.value.contains(to) || (dlg.value && dlg.value.contains(to)))) leftComponent = true }
      function onBoxDown(e) {
        if (!editable.value) return
        if (e.target.closest('button')) return
        if (surfaceMode.value) { e.preventDefault(); inputEl.focus(); openSurface(''); return }
        if (e.target !== inputEl) { e.preventDefault(); inputEl.focus() }
        if (open.value) closeList(); else openList()
      }
      function onRootDown(e) { if (e.target.closest('.g-input__control')) onBoxDown(e) }
      function onDocDown(e) { if (!open.value) return; if (root.value.contains(e.target)) return; closeList() }
      function onBackdrop(e) { if (e.target === dlg.value) closeSurface() }
      function hover(r) { if (active.value !== r.id) { active.value = r.id; auto.value = false } }
      function pick(r) {
        if (r.opt && r.opt.disabled) return
        if (r.opt && !r.kind && maxed.value && !isSel(r)) { say(fill(L.value.max, { max: nf.format(props.max) })); return }
        toggle(r)
        if (!surfaceOpen.value) inputEl && inputEl.focus()
      }
      function arrow() { if (!editable.value) return; inputEl.focus(); if (surfaceMode.value) return openSurface(''); open.value ? closeList() : openList() }

      // ---- Atributos del <input> visible (patrón APG; los de GInput llegan por `bind`, sin `name` ni `required`)
      function inputAttrs(bind) {
        const { required: _r, name: _n, ...b } = bind
        const desc = [about.value ? `${id}-about` : null, b['aria-describedby'], props.concept === 'B' && props.hint ? `${id}-hint` : null, props.concept === 'B' && props.error ? `${id}-msg` : null].filter(Boolean).join(' ') || undefined
        const sm = surfaceMode.value
        return {
          ...b, ...attrs, type: 'text', role: 'combobox', 'aria-autocomplete': sm ? undefined : 'list', 'aria-haspopup': sm ? 'dialog' : 'listbox',
          'aria-expanded': (sm ? surfaceOpen.value : open.value && hasPanel.value) ? 'true' : 'false', 'aria-controls': sm ? `${id}-surface` : `${id}-list`,
          'aria-activedescendant': !sm && open.value && active.value ? active.value : undefined, 'aria-describedby': desc, 'aria-required': props.required ? 'true' : undefined,
          'aria-invalid': props.error ? 'true' : undefined, inputmode: sm ? 'none' : undefined, readonly: props.readonly || undefined, disabled: props.disabled || undefined,
          autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', placeholder: count.value && props.concept !== 'B' ? undefined : props.placeholder
        }
      }
      const setInput = (setControl) => (el) => { if (el && el !== inputEl) { inputEl = el; setControl(el) } }

      onMounted(() => {
        mq = matchMedia('(max-width: 520px)'); narrow.value = mq.matches
        mq.addEventListener('change', (e) => { narrow.value = e.matches; closeList(); closeSurface() })
        document.addEventListener('pointerdown', onDocDown, true)
        addEventListener('scroll', follow, true); addEventListener('resize', follow)
        ro = new ResizeObserver(() => fit()); cell.value && ro.observe(cell.value)
        document.fonts && document.fonts.ready.then(fit)
        nextTick(fit)
      })
      onBeforeUnmount(() => { document.removeEventListener('pointerdown', onDocDown, true); removeEventListener('scroll', follow, true); removeEventListener('resize', follow); ro && ro.disconnect() })
      watch(view, () => { if (open.value) nextTick(place) })
      // Las cifras ruedan cuando cambia el recuento por un gesto (decorativo: el número exacto lo dice la región viva)
      watch(count, () => nextTick(() => nextTick(() => { for (const host of [root.value, dlg.value]) if (host) host.querySelectorAll('.xm-num').forEach((n) => animate(n, [{ transform: 'translateY(60%)', opacity: 0 }, { transform: 'none', opacity: 1 }], '--g-ease-spring')) })))

      const api = { id, get state() { return { text: text.value, open: open.value, surfaceOpen: surfaceOpen.value, armed: armed.value, count: count.value } } }
      ;(window.__xm = window.__xm || {})[id] = api

      return {
        id, L, root, pop, dlg, sIn, live, live2, cell, text, open, surfaceOpen, active, up, focused, armed, narrow, expanded, composing, sentence, ledger,
        editable, surfaceMode, shape, chosen, count, maxed, about, tally, view, hasPanel, ghost, isSel, svg, fill, nf,
        inputAttrs, setInput, onInput, onKey, onFocus, onBlur, onFocusOut, onRootDown, onBackdrop, hover, pick, arrow, clearAll, removeItem, rowRemove, rowUndo,
        closeSurface, onSKey: onKey, onSInput: onInput, short
      }
    },
    template: `
    <div ref="root" class="xm" :class="['xm--' + concept, { 'is-open': open, 'is-up': up, 'is-focus': focused, 'is-surface': surfaceMode, 'is-filled': count > 0, 'is-block': block }]" @focusout="onFocusOut" @mousedown="onRootDown">
      <g-input :id="id" :label="label" :hint="concept === 'B' ? undefined : hint" :error="concept === 'B' ? undefined : error" :required="required" :readonly="readonly" :disabled="disabled" :block="block || undefined">
        <template #prepend><span v-html="svg(icon)"></span></template>
        <template #field="{ bind, setControl }">
          <span ref="cell" class="xm-cell">
            <template v-if="concept === 'base'">
              <span v-for="c in chosen" :key="c.key" class="xm-chip" :class="{ 'is-armed': armed === c.key, 'is-custom': c.custom }">
                <span v-if="c.custom" class="xm-chip__icon" aria-hidden="true" v-html="svg('pencil')"></span><span class="xm-chip__t">{{ short(c) }}</span>
                <button v-if="editable" type="button" class="xm-chip__x" :aria-label="fill(L.remove, { label: c.opt.label })" @click="removeItem(c)"><span v-html="svg('x')"></span></button>
              </span>
            </template>
            <span v-else-if="sentence.parts.length" class="xm-sentence" aria-hidden="true">
              <template v-for="(p, i) in sentence.parts" :key="i">
                <span v-if="p.lit" class="xm-s-lit">{{ p.t }}</span>
                <span v-else-if="p.more" class="xm-s-more"><span class="xm-num" :key="sentence.hidden">{{ p.t }}</span></span>
                <span v-else class="xm-s-item" :class="{ 'is-custom': p.item.custom, 'is-armed': p.armed, 'is-first': i === 0 }"><span v-if="p.item.custom" class="xm-s-icon" v-html="svg('pencil')"></span>{{ p.t }}</span>
              </template>
            </span>
            <span class="xm-inwrap">
              <input v-bind="inputAttrs(bind)" :ref="setInput(setControl)" class="g-input__field xm-field" :value="surfaceOpen ? '' : text"
                @input="onInput" @keydown="onKey" @focus="onFocus" @blur="onBlur" @compositionstart="composing = true" @compositionend="composing = false">
              <span v-if="ghost" class="xm-ghost" aria-hidden="true"><span class="xm-ghost__typed">{{ ghost.typed }}</span><span class="xm-ghost__rest">{{ ghost.rest }}</span></span>
            </span>
            <span v-if="about" class="sr" :id="id + '-about'">{{ about }}</span>
            <template v-if="name"><input v-for="v in modelValue" :key="'h' + v" type="hidden" :name="name" :value="v" :disabled="disabled || undefined"></template>
            <template v-if="customName"><input v-for="t in custom" :key="'hc' + t" type="hidden" :name="customName" :value="t" :disabled="disabled || undefined"></template>
          </span>
        </template>
        <template #end>
          <button v-if="clearable && count && editable" type="button" class="xm-iconbtn xm-clear" :id="id + '-clear'" :aria-labelledby="id + '-clear-t ' + id + '-label'" @mousedown.stop.prevent @click="clearAll">
            <span class="sr" :id="id + '-clear-t'">{{ L.clear }}</span><span v-html="svg('x')"></span></button>
          <span v-if="editable" class="xm-arrow" aria-hidden="true" @mousedown.stop.prevent @click="arrow" v-html="svg(surfaceMode ? 'chevrons-up-down' : 'chevron-down')"></span>
        </template>
      </g-input>
      <div v-if="concept === 'B'" class="xm-below">
        <p v-if="hint" class="xm-hint" :id="id + '-hint'">{{ hint }}</p>
        <p v-if="error" class="xm-msg" :id="id + '-msg'"><span v-html="svg('circle-alert')"></span>{{ error }}</p>
        <x-rows v-if="ledger.length" :id="id" :rows="ledger" :editable="editable" :armed="armed" :L="L" :numbered="numbered" :cap="${LEDGER_CAP}" :expanded="expanded" :label="label"
          @remove="rowRemove" @undo="rowUndo" @toggle="expanded = !expanded" />
      </div>
      <div ref="live" class="sr xm-live" role="status" aria-live="polite" aria-atomic="true"></div>
      <div v-if="!surfaceMode" ref="pop" class="xm-pop" :class="['xm-pop--' + shape, { 'is-empty': !hasPanel, 'is-up': up }]" popover="manual" :id="id + '-pop'" @mousedown.prevent>
        <div class="xm-pop__in">
          <x-panel v-if="open" :id="id" :view="view" :active="active" :q="text.trim()" :is-sel="isSel" :maxed="maxed" :L="L" @pick="pick" @hover="hover" />
        </div>
      </div>
      <dialog v-else ref="dlg" class="xm-surface" :class="narrow ? 'xm-surface--sheet' : 'xm-surface--palette'" :id="id + '-surface'" :aria-labelledby="id + '-stitle'" @cancel.prevent="closeSurface" @click="onBackdrop">
        <div class="xm-surface__box" v-if="surfaceOpen">
          <div class="xm-surface__head"><h2 class="xm-surface__title" :id="id + '-stitle'">{{ label }}</h2>
            <button type="button" class="xm-iconbtn xm-surface__close" :aria-label="L.close" @click="closeSurface"><span v-html="svg('x')"></span></button></div>
          <div class="xm-surface__field"><span aria-hidden="true" v-html="svg('search')"></span>
            <input ref="sIn" class="xm-surface__input" type="text" role="combobox" aria-autocomplete="list" aria-expanded="true" :aria-controls="id + '-list'"
              :aria-activedescendant="active || undefined" :aria-labelledby="id + '-stitle'" :aria-describedby="about ? id + '-about2' : undefined" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search"
              :value="text" @input="onSInput" @keydown="onSKey" @compositionstart="composing = true" @compositionend="composing = false">
            <span v-if="about" class="sr" :id="id + '-about2'">{{ about }}</span>
          </div>
          <div class="xm-surface__body" :class="{ 'has-basket': concept === 'C' && !narrow }">
            <x-panel :id="id" :view="view" :active="active" :q="text.trim()" :is-sel="isSel" :maxed="maxed" :L="L" surface @pick="pick" @hover="hover" />
            <section v-if="concept === 'C' && !narrow" class="xm-basket" :aria-labelledby="id + '-btitle'">
              <h3 class="xm-basket__title" :id="id + '-btitle'">{{ L.chosen }} <span class="xm-basket__tally"><span class="xm-num" :key="count">{{ tally }}</span></span></h3>
              <p v-if="!ledger.length" class="xm-basket__empty">{{ L.basketEmpty }}</p>
              <x-rows v-else :id="id + '-b'" :rows="ledger" :editable="editable" :armed="armed" :L="L" :numbered="numbered" :label="L.chosen" :cap="${PIN_CAP}" :expanded="expanded" @remove="rowRemove" @undo="rowUndo" @toggle="expanded = !expanded" />
            </section>
          </div>
          <div class="xm-surface__foot"><span class="xm-surface__tally" aria-hidden="true">{{ tally }}</span>
            <button type="button" class="xm-done" @click="closeSurface">{{ L.done }}</button></div>
          <div ref="live2" class="sr" role="status" aria-live="polite" aria-atomic="true"></div>
        </div>
      </dialog>
    </div>`
  })

  // =====================================================================================================
  // Datos de la maqueta (la aplicación entrega el catálogo; Grana nunca hace fetch)
  // =====================================================================================================
  const A = (cat, list) => ({ label: cat, options: list.map(([label, description, value]) => ({ value: value || fold(label).replace(/[^a-z0-9]+/g, '-'), label, description})) })
  const ALLERGENS = [
    A('Medicamentos', [['Penicilina', 'Antibiótico betalactámico'], ['Amoxicilina', 'Antibiótico betalactámico'], ['Cefalosporinas', 'Antibiótico betalactámico'], ['Sulfonamidas', 'Antibiótico (sulfas)'], ['Ácido acetilsalicílico', 'AINE · aspirina'], ['Ibuprofeno', 'AINE'], ['Naproxeno', 'AINE'], ['Metamizol', 'Analgésico'], ['Codeína', 'Opioide'], ['Morfina', 'Opioide'], ['Lidocaína', 'Anestésico local'], ['Carbamazepina', 'Anticonvulsivo'], ['Fenitoína', 'Anticonvulsivo'], ['Alopurinol', 'Antigotoso'], ['Vancomicina', 'Antibiótico glucopéptido'], ['Ciprofloxacino', 'Antibiótico quinolona'], ['Medios de contraste yodados', 'Imagen']]),
    A('Alimentos', [['Huevo', 'Alimento'], ['Leche de vaca', 'Alimento'], ['Cacahuate', 'Alimento'], ['Nueces', 'Alimento'], ['Mariscos', 'Alimento · crustáceos y moluscos'], ['Pescado', 'Alimento'], ['Trigo', 'Alimento'], ['Soya', 'Alimento'], ['Ajonjolí', 'Alimento'], ['Fresa', 'Alimento'], ['Kiwi', 'Alimento']]),
    A('Ambientales', [['Polen de pasto', 'Estacional'], ['Ácaros del polvo', 'Perenne'], ['Pelo de gato', 'Animal'], ['Pelo de perro', 'Animal'], ['Picadura de abeja', 'Himenópteros'], ['Picadura de avispa', 'Himenópteros'], ['Moho', 'Perenne']]),
    A('Materiales', [['Látex', 'Guantes, sondas'], ['Níquel', 'Metal'], ['Clorhexidina', 'Antiséptico'], ['Yodopovidona', 'Antiséptico'], ['Esparadrapo', 'Adhesivo']])
  ]
  const CIE = [
    ['Endocrinas (E00–E89)', [['E03.9', 'Hipotiroidismo, no especificado'], ['E10.9', 'Diabetes mellitus tipo 1, sin complicación'], ['E11.9', 'Diabetes mellitus tipo 2, sin complicación'], ['E66.9', 'Obesidad, no especificada'], ['E78.5', 'Hiperlipidemia, no especificada']]],
    ['Circulatorio (I00–I99)', [['I10', 'Hipertensión esencial (primaria)'], ['I20.9', 'Angina de pecho, no especificada'], ['I25.9', 'Enfermedad isquémica crónica del corazón'], ['I50.9', 'Insuficiencia cardíaca, no especificada']]],
    ['Respiratorio (J00–J99)', [['J00', 'Rinofaringitis aguda [resfriado común]'], ['J02.9', 'Faringitis aguda, no especificada'], ['J18.9', 'Neumonía, no especificada'], ['J20.9', 'Bronquitis aguda, no especificada'], ['J45.9', 'Asma, no especificada']]],
    ['Digestivo (K00–K95)', [['K21.9', 'Reflujo gastroesofágico sin esofagitis'], ['K29.7', 'Gastritis, no especificada'], ['K30', 'Dispepsia'], ['K59.0', 'Constipación']]],
    ['Síntomas y signos (R00–R99)', [['R05', 'Tos'], ['R50.9', 'Fiebre, no especificada'], ['R51', 'Cefalea']]]
  ]
  const DX = CIE.map(([label, list]) => ({ label, options: list.map(([code, d]) => ({ value: code, code, label: d })) }))
  const P = (label, area, ext, value) => ({ value, label, avatar: true, facts: [{ label: 'Área', value: area, priority: 1 }, { label: 'Ext.', value: ext, short: 'Ext.' }] })
  const PEOPLE = [P('Ana López Ruiz', 'Urgencias', '2104', 'u1'), P('Ana López Ruiz', 'Pediatría', '3310', 'u2'), P('Luis Hernández Cruz', 'Urgencias', '2108', 'u3'), P('Sofía Martínez Díaz', 'Laboratorio', '4402', 'u4'),
    P('Carlos Gómez Reyes', 'Imagenología', '4510', 'u5'), P('Valeria Torres Ortiz', 'Enfermería', '2201', 'u6'), P('Jorge Ramírez Flores', 'Trabajo social', '1107', 'u7'), P('Regina Chávez Núñez', 'Farmacia', '1302', 'u8'),
    P('Iván Juárez Velasco', 'Urgencias', '2112', 'u9'), P('Paola Santiago Zárate', 'Admisión', '1001', 'u10'), P('Héctor Aguilar Mendoza', 'Quirófano', '5101', 'u11'), P('Lucía Castillo Ruiz', 'Pediatría', '3302', 'u12')]
  const TAGS = ['Urgente', 'Seguimiento', 'Interconsulta', 'Laboratorio', 'Imagen', 'Referencia', 'Contrarreferencia', 'Alta voluntaria', 'Crónico', 'Embarazo', 'Pediátrico', 'Geriátrico'].map((label, i) => ({ value: 't' + i, label }))
  const BIG = Array.from({ length: 500 }, (_, i) => ({ value: 'b' + i, label: `Insumo ${String(i + 1).padStart(3, '0')} · ${['gasas', 'jeringas', 'guantes', 'catéteres', 'vendas'][i % 5]}` }))
  const SERVICIOS = [{ value: 'urg', label: 'Urgencias' }, { value: 'ce', label: 'Consulta externa' }, { value: 'hosp', label: 'Hospitalización' }, { value: 'qx', label: 'Quirófano' }]
  const COMBO_LABELS = { close: 'Cerrar', clear: 'Limpiar', loading: 'Buscando…', noResults: 'Sin resultados para «{text}»', results: (n) => (n === 1 ? '1 resultado' : `${n} resultados`), more: 'Mostrar más ({shown} de {total})', retry: 'Reintentar' }

  const App = defineComponent({
    components: { XMulti },
    props: { concept: String },
    setup() {
      const m = reactive({ alg: ['penicilina', 'latex'], algC: [], dx: ['E11.9'], resp: [], tags: ['t0', 't1'], tagsRo: ['t2', 't4', 't8'], tagsDis: ['t3'], serv: 'urg', folio: 'R-2026-0418', notas: '', big: BIG.slice(0, 40).map((o) => o.value), dlg: false, dlgAlg: ['huevo'], sent: '', changes: [] })
      function onChange(which, e) { m.changes.unshift({ which, added: e.added.map((x) => x.opt.label), removed: e.removed.map((x) => x.opt.label), n: e.value.length + e.custom.length }); m.changes.splice(6) }
      function submit(ev) { const f = document.getElementById('form'); const fd = new FormData(f.tagName === 'FORM' ? f : f.querySelector('form')); const o = {}; for (const [k, v] of fd) (o[k] = o[k] || []).push(v); m.sent = JSON.stringify(o) }
      window.__M = m
      const LF = { selected: (n) => (n === 1 ? '1 seleccionado' : `${nf.format(n)} seleccionados`), tomb: '{label} quitado', chosen: 'Elegidos', clear: 'Quitar todos', clearedAll: 'Se quitaron todos', max: 'Máximo {max}: quita uno para elegir otro', basketEmpty: 'Aún no hay ninguno. Los que marques aparecen aquí.', fresh: 'Nuevo', showAll: 'Ver los {count}', already: '{label} ya está elegido' }
      return { m, ALLERGENS, DX, PEOPLE, TAGS, BIG, SERVICIOS, COMBO_LABELS, LF, onChange, submit, svg }
    },
    template: `
    <div class="cards">
      <section class="card" id="case-alg"><h2>1 · Alergias (catálogo agrupado, texto libre permitido)</h2>
        <x-multi id="alg" block :concept="concept" label="Alergias" hint="Medicamento, alimento, ambiental o material. Si no está, escríbela." placeholder="Buscar alergia" icon="circle-alert"
          clearable allow-custom name="alergias" custom-name="alergias_libre" v-model="m.alg" v-model:custom="m.algC" :options="ALLERGENS" @change="onChange('alg', $event)" />
        <p class="out">Modelo: <code id="out-alg">{{ JSON.stringify(m.alg) }}</code> · texto libre: <code id="out-algC">{{ JSON.stringify(m.algC) }}</code></p>
        <ol class="out changes" id="out-changes"><li v-for="(c, i) in m.changes" :key="i">change · {{ c.which }} · +{{ c.added.join(', ') || '—' }} · −{{ c.removed.join(', ') || '—' }} · {{ c.n }}</li></ol>
      </section>
      <section class="card" id="case-dx"><h2>2 · Diagnósticos secundarios (CIE-10, código, máximo 3)</h2>
        <x-multi id="dx" block :concept="concept" label="Diagnósticos secundarios" hint="Hasta 3, en orden de importancia" placeholder="Código o descripción" icon="file-text" :max="3" numbered
          :labels="{ selected: (n) => n === 1 ? '1 diagnóstico' : n + ' diagnósticos', tomb: '{label} quitado', chosen: 'Elegidos', max: 'Máximo {max} diagnósticos: quita uno para elegir otro', basketEmpty: 'Aún no hay ninguno.', fresh: 'Nuevo', showAll: 'Ver los {count}', clear: 'Quitar todos', already: '{label} ya está elegido' }"
          name="dx" v-model="m.dx" :options="DX" @change="onChange('dx', $event)" />
        <p class="out">Modelo: <code id="out-dx">{{ JSON.stringify(m.dx) }}</code></p>
      </section>
      <section class="card" id="case-resp"><h2>3 · Responsables (personas, dos «Ana López Ruiz»)</h2>
        <x-multi id="resp" block :concept="concept" label="Responsables" placeholder="Nombre o área" icon="users" :labels="LF" v-model="m.resp" :options="PEOPLE" @change="onChange('resp', $event)" />
        <p class="out">Modelo: <code id="out-resp">{{ JSON.stringify(m.resp) }}</code></p>
      </section>
      <section class="card" id="case-form"><h2>4 · En un formulario: fila con GInput y el GCombobox real (una opción); solo lectura y deshabilitado</h2>
        <g-form id="form" @submit="submit">
          <g-form-layout>
            <g-form-row id="row">
              <g-input id="f-folio" label="Folio" v-model="m.folio" />
              <x-multi id="f-tags" :concept="concept" label="Etiquetas" placeholder="Agregar etiqueta" icon="tag" name="etiquetas" :labels="{ selected: (n) => n === 1 ? '1 etiqueta' : n + ' etiquetas', tomb: '{label} quitada' }" v-model="m.tags" :options="TAGS" />
              <g-combobox id="f-serv" label="Servicio" name="servicio" v-model="m.serv" :options="SERVICIOS" :labels="COMBO_LABELS" />
            </g-form-row>
            <g-input id="f-notas" label="Notas" hint="La línea de debajo: ¿se mueve al elegir etiquetas?" v-model="m.notas" />
            <g-form-row id="row2">
              <x-multi id="f-ro" :concept="concept" label="Etiquetas (solo lectura)" icon="tag" readonly name="ro" v-model="m.tagsRo" :options="TAGS" />
              <x-multi id="f-dis" :concept="concept" label="Etiquetas (deshabilitado)" icon="tag" disabled name="dis" v-model="m.tagsDis" :options="TAGS" />
            </g-form-row>
          </g-form-layout>
          <p><g-btn id="send" type="submit">Guardar</g-btn></p>
        </g-form>
        <p class="out">Enviado (FormData): <code id="out-sent">{{ m.sent }}</code></p>
      </section>
      <section class="card" id="case-big"><h2>5 · Muchos: 500 insumos y 40 elegidos</h2>
        <x-multi id="big" block :concept="concept" label="Insumos del carro" placeholder="Buscar insumo" icon="list" :labels="LF" v-model="m.big" :options="BIG" />
      </section>
      <section class="card" id="case-dialog"><h2>6 · Dentro de un diálogo</h2>
        <g-btn id="d-open" variant="outline" @click="m.dlg = true">Abrir diálogo</g-btn>
        <g-dialog id="dlg" v-model="m.dlg" title="Antecedentes" close-label="Cerrar">
          <x-multi id="d-alg" block :concept="concept" label="Alergias" placeholder="Buscar alergia" icon="circle-alert" v-model="m.dlgAlg" :options="ALLERGENS" />
        </g-dialog>
      </section>
    </div>`
  })

  window.MultiLab = {
    XMulti, fold,
    mount(sel, concept) { const app = createApp(App, { concept }); app.use(Grana); if (window.GranaCombobox) app.use(GranaCombobox); app.mount(sel); return app }
  }
})()
