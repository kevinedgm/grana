// GCombobox · motor de prototipo (kiwi, r01). Lo comparten r01 (base funcional) y r02 (conceptos A, B, C).
// NO es el componente: es la maqueta que fija semántica, teclado, estados y anuncios. Compone el GInput real de dist/.
// Sin fetch: emite `search`, `more` y `create`; la «aplicación» (ComboLab, abajo) entrega `options`, `loading`, `total`.
(function () {
  const { defineComponent, ref, computed, watch, nextTick, onMounted, onBeforeUnmount, reactive, createApp } = Vue
  const svg = (n) => window.lucide(n)
  const fast = () => Boolean(window.__fast)
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const foldCh = (c) => c.normalize('NFD')[0].toLowerCase()
  const fold = (s) => Array.from(String(s ?? ''), foldCh).join('')
  const tokens = (q) => fold(q).split(/\s+/).filter(Boolean)
  const fmt = (s, o) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''))
  const nf = new Intl.NumberFormat('es-MX')

  /** Trozos de `text` con la coincidencia marcada (sin acentos ni mayúsculas; primera aparición de cada palabra buscada). */
  function parts(text, q) {
    text = String(text ?? '')
    const f = fold(text); const hit = new Array(text.length).fill(false)
    if (f.length === text.length) for (const t of tokens(q)) { const i = f.indexOf(t); if (i !== -1) for (let k = i; k < i + t.length; k++) hit[k] = true }
    const out = []
    for (let i = 0; i < text.length; i++) { const last = out[out.length - 1]; if (last && last.m === hit[i]) last.t += text[i]; else out.push({ t: text[i], m: hit[i] }) }
    return out
  }
  const matches = (o, toks) => { const hay = fold(`${o.label} ${o.code || ''} ${o.description || ''}`); return toks.every((t) => hay.includes(t)) }

  // ---- Región viva: una por anfitrión (body o el <dialog> modal abierto). Educada. Registro en window.__live para la verificación.
  const liveLog = (window.__live = [])
  const hosts = new WeakMap()
  function tell(from, text) {
    const host = (from && from.closest('dialog[open]')) || document.body
    let a = hosts.get(host)
    if (!a || !a.node.isConnected) {
      const node = document.createElement('div'); node.className = 'sr'; node.setAttribute('role', 'status'); node.setAttribute('aria-live', 'polite'); node.setAttribute('aria-atomic', 'true')
      host.append(node); a = { node, w: 0, c: 0 }; hosts.set(host, a)
    }
    liveLog.push({ text, host: host === document.body ? 'body' : 'dialog' })
    clearTimeout(a.w); clearTimeout(a.c); a.node.textContent = ''
    a.w = setTimeout(() => { a.node.textContent = text; a.c = setTimeout(() => { a.node.textContent = '' }, 5000) }, 50)
  }

  const LABELS = {
    clear: 'Limpiar {label}', loading: 'Buscando…', one: '1 resultado', results: '{count} resultados', partial: '{count} de {total} resultados',
    empty: 'Sin resultados para «{text}»', minChars: 'Escribe al menos {n} caracteres', more: 'Mostrar más ({count} de {total})', retry: 'Reintentar la búsqueda',
    custom: 'Usar «{text}» como texto libre', close: 'Cerrar', preview: 'Vista previa', free: 'Texto libre', previewHint: 'Recorre la lista para ver el detalle antes de elegir.'
  }

  // ---- Fila de la lista: opción o fila de acción (#57: una acción es un role="option" con aria-selected="false") ----
  const XRow = defineComponent({
    name: 'XRow',
    props: { r: Object, active: Boolean, q: String, concept: String },
    emits: ['pick', 'hover'],
    setup: () => ({ svg, parts }),
    template: `
    <li class="xc-opt" :class="{ 'is-active': active, 'xc-opt--action': r.kind === 'action' }" :id="r.id" role="option" :data-row="r.kind === 'action' ? r.action : 'option'"
        :aria-selected="r.selected ? 'true' : 'false'" :aria-disabled="r.opt && r.opt.disabled ? 'true' : undefined"
        @click="$emit('pick', r, $event.currentTarget)" @pointermove="$emit('hover', r)">
      <template v-if="r.kind === 'action'">
        <span class="xc-opt__lead xc-opt__lead--icon" aria-hidden="true" v-html="svg(r.icon)"></span>
        <span class="xc-opt__main"><span class="xc-opt__label">{{ r.label }}</span></span>
      </template>
      <template v-else>
        <span v-if="r.opt.avatar" class="xc-opt__lead" aria-hidden="true"><g-avatar :name="r.opt.avatar" :size="concept.includes('C') ? 'md' : 'sm'" /></span>
        <span v-else-if="r.opt.code" class="xc-code"><template v-for="p in parts(r.opt.code, q)"><mark v-if="p.m">{{ p.t }}</mark><template v-else>{{ p.t }}</template></template></span>
        <span class="xc-opt__main">
          <span class="xc-opt__label"><template v-for="p in parts(r.opt.label, q)"><mark v-if="p.m">{{ p.t }}</mark><template v-else>{{ p.t }}</template></template></span>
          <span v-if="concept.includes('C') && r.opt.facts" class="xc-facts"><span v-for="f in r.opt.facts" :key="f.k" class="xc-fact"><span class="xc-fact__k">{{ f.k }}</span> <template v-for="p in parts(f.v, q)"><mark v-if="p.m">{{ p.t }}</mark><template v-else>{{ p.t }}</template></template></span></span>
          <span v-else-if="r.opt.description" class="xc-opt__desc"><template v-for="p in parts(r.opt.description, q)"><mark v-if="p.m">{{ p.t }}</mark><template v-else>{{ p.t }}</template></template></span>
        </span>
        <span v-if="r.selected" class="xc-opt__check" aria-hidden="true" v-html="svg('check')"></span>
      </template>
    </li>`
  })

  // ---- Panel: estado (fuera del listbox) + listbox con grupos ----
  const XPanel = defineComponent({
    name: 'XPanel',
    components: { XRow },
    props: { id: String, blocks: Array, active: String, q: String, status: Object, busy: Boolean, concept: String, count: Number },
    emits: ['pick', 'hover'],
    setup: () => ({ svg }),
    template: `
    <div class="xc-panel" :data-count="count">
      <p v-if="status" class="xc-status" :class="'xc-status--' + status.kind" :id="id + '-status'"><span aria-hidden="true" :key="status.icon" :class="{ 'xc-spin': status.kind === 'busy' }" v-html="svg(status.icon)"></span><span>{{ status.text }}</span></p>
      <ul class="xc-list" :id="id + '-list'" role="listbox" :aria-labelledby="id + '-label'" :aria-busy="busy ? 'true' : undefined" :hidden="!blocks.length">
        <template v-for="b in blocks" :key="b.id">
          <li v-if="b.group" role="presentation" class="xc-groupwrap">
            <ul role="group" class="xc-group" :aria-labelledby="b.id">
              <li role="presentation" class="xc-group__label" :id="b.id">{{ b.group }}</li>
              <x-row v-for="r in b.rows" :key="r.id" :r="r" :active="r.id === active" :q="q" :concept="concept" @pick="(r, el) => $emit('pick', r, el)" @hover="$emit('hover', $event)" />
            </ul>
          </li>
          <x-row v-else v-for="r in b.rows" :key="r.id" :r="r" :active="r.id === active" :q="q" :concept="concept" @pick="(r, el) => $emit('pick', r, el)" @hover="$emit('hover', $event)" />
        </template>
      </ul>
    </div>`
  })

  let uid = 0
  const XCombo = defineComponent({
    name: 'XCombo',
    components: { XPanel },
    inheritAttrs: false,
    props: {
      id: String, label: String, hint: String, error: String, placeholder: String, name: String,
      required: Boolean, readonly: Boolean, disabled: Boolean, clearable: Boolean, block: Boolean,
      modelValue: { default: null }, options: { type: Array, default: () => [] }, selectedOption: { type: Object, default: null },
      remote: Boolean, loading: Boolean, total: { type: Number, default: null }, loadError: { type: String, default: '' },
      minChars: { type: Number, default: 0 }, delay: { type: Number, default: 250 }, limit: { type: Number, default: 50 },
      allowCustom: Boolean, createLabel: String, autoHighlight: { type: Boolean, default: true },
      labels: { type: Object, default: () => ({}) }, concept: { type: String, default: 'base' }, icon: { type: String, default: 'search' }
    },
    emits: ['update:modelValue', 'search', 'more', 'create', 'open', 'close'],
    setup(props, { emit }) {
      const id = props.id || `xc-${++uid}`
      const L = computed(() => ({ ...LABELS, ...props.labels }))
      const root = ref(null), pop = ref(null), dlg = ref(null), qEl = ref(null), tokenEl = ref(null)
      const narrow = ref(matchMedia('(max-width: 520px)').matches)
      const is = (k) => props.concept !== 'base' && props.concept.includes(k) // 'A', 'B', 'C' o la mezcla 'AC'
      const surface = computed(() => is('B') || narrow.value) // superficie modal con su propio campo: paleta (B) u hoja móvil (todos)
      const open = ref(false), up = ref(false), active = ref(null), auto = ref(false)
      const text = ref(''), query = ref(''), typed = ref(false), shown = ref(props.limit), focused = ref(false)
      const settledFor = ref(''), waiting = ref(false)
      let timer = 0, annTimer = 0, lastEmitted = null

      // Opciones conocidas (para pintar la elegida aunque ya no esté en `options`: búsqueda remota)
      const known = new Map()
      const each = (list, fn) => list.forEach((o) => (Array.isArray(o.options) ? o.options.forEach((x) => fn(x, o.label)) : fn(o, null)))
      const learn = () => { each(props.options, (o) => known.set(o.value, o)); if (props.selectedOption) known.set(props.selectedOption.value, props.selectedOption) }
      learn()
      const selected = computed(() => {
        void props.options; void props.selectedOption
        const v = props.modelValue
        if (v === null || v === undefined || v === '') return null
        return known.get(v) || (props.allowCustom && typeof v === 'string' ? { value: v, label: v, custom: true } : null)
      })
      text.value = selected.value ? selected.value.label : ''

      const input = () => root.value && root.value.querySelector('.g-input__field')
      const control = () => root.value && root.value.querySelector('.g-input__control')
      const cur = () => (surface.value ? query.value : text.value)
      const isTyped = () => (surface.value ? query.value !== '' : typed.value)
      const q = computed(() => (surface.value ? query.value : typed.value ? text.value : ''))
      const short = computed(() => props.minChars > 0 && q.value.trim().length > 0 && q.value.trim().length < props.minChars)
      const pending = computed(() => props.remote && (waiting.value || props.loading))

      // ---- Filas ----
      const flat = computed(() => {
        const out = []
        const toks = props.remote ? [] : tokens(q.value)
        each(props.options, (o, g) => { if (!toks.length || matches(o, toks)) out.push({ o, g }) })
        return out
      })
      const visible = computed(() => (short.value ? [] : props.remote ? flat.value : flat.value.slice(0, shown.value)))
      const totalCount = computed(() => (props.remote ? (props.total ?? flat.value.length) : flat.value.length))
      const blocks = computed(() => {
        const out = []; let k = 0
        for (const { o, g } of visible.value) {
          let b = out[out.length - 1]
          if (!b || b.group !== g) { b = { id: `${id}-grp-${out.length}`, group: g, rows: [] }; out.push(b) }
          b.rows.push({ kind: 'option', id: `${id}-opt-${k++}`, opt: o, selected: o.value === props.modelValue })
        }
        const acts = []
        const t = q.value.trim()
        if (props.loadError) acts.push({ action: 'retry', icon: 'refresh-cw', label: L.value.retry })
        else if (!short.value && visible.value.length < totalCount.value) acts.push({ action: 'more', icon: 'arrow-down', label: fmt(L.value.more, { count: nf.format(visible.value.length), total: nf.format(totalCount.value) }) })
        if (t && !short.value && props.allowCustom && !visible.value.some(({ o }) => fold(o.label) === fold(t))) acts.push({ action: 'custom', icon: 'pencil', label: fmt(L.value.custom, { text: t }) })
        if (t && !short.value && props.createLabel) acts.push({ action: 'create', icon: 'plus', label: fmt(props.createLabel, { text: t }) })
        if (acts.length) out.push({ id: `${id}-acts`, group: null, rows: acts.map((a) => ({ kind: 'action', id: `${id}-opt-${a.action}`, selected: false, ...a })) })
        return out
      })
      const nav = computed(() => blocks.value.flatMap((b) => b.rows).filter((r) => !(r.opt && r.opt.disabled)))
      const rowById = (rid) => nav.value.find((r) => r.id === rid)
      const status = computed(() => {
        if (props.loadError) return { kind: 'error', icon: 'triangle-alert', text: props.loadError }
        if (short.value) return { kind: 'hint', icon: 'search', text: fmt(L.value.minChars, { n: props.minChars }) }
        if (visible.value.length) return null
        if (pending.value) return { kind: 'busy', icon: 'loader-circle', text: L.value.loading }
        if (q.value.trim()) return { kind: 'empty', icon: 'inbox', text: fmt(L.value.empty, { text: q.value.trim() }) }
        return null
      })
      const hasPanel = computed(() => Boolean(status.value || blocks.value.length))

      // ---- Texto fantasma (concepto A): la primera coincidencia por prefijo completa el campo ----
      const ghost = computed(() => {
        if (!is('A') || surface.value || !open.value || !typed.value || pending.value || !text.value) return null
        const first = nav.value.find((r) => r.kind === 'option')
        if (!first || active.value !== first.id) return null
        if (!fold(first.opt.label).startsWith(fold(text.value)) || first.opt.label.length <= text.value.length) return null
        // `unique`: ninguna otra opción a la vista se llama igual. Con homónimos el campo completa el texto, pero Tab no elige.
        const same = nav.value.filter((r) => r.kind === 'option' && fold(r.opt.label) === fold(first.opt.label)).length
        return { row: first, rest: first.opt.label.slice(text.value.length), unique: same === 1 }
      })
      // ---- Valor como objeto (concepto C): ficha en el campo mientras no se edita ----
      const showToken = computed(() => is('C') && Boolean(selected.value) && !typed.value && !(open.value && !surface.value))
      const about = computed(() => { const s = selected.value; if (!s) return ''; return s.custom ? L.value.free : [s.code, s.description].filter(Boolean).join(', ') })

      // ---- Colocación (anchor.js en el componente real: debajo, o encima si no cabe; ancho de la caja) ----
      function place() {
        if (!open.value || surface.value || !pop.value) return
        const c = control(); const r = c.getBoundingClientRect(); const p = pop.value; const A = is('A')
        const pad = 8, gap = A ? 0 : 4, vh = window.innerHeight
        const below = vh - r.bottom - pad - gap, above = r.top - pad - gap
        const panel = p.querySelector('.xc-panel'); const natural = Math.min(panel.scrollHeight + 2, vh * 0.6, 420)
        up.value = below < Math.min(natural, 240) && above > below
        const s = p.style
        const vw = document.documentElement.clientWidth; const w = A ? r.width : Math.min(vw - 2 * pad, Math.max(r.width, 320))
        const rtl = getComputedStyle(c).direction === 'rtl'; const x = Math.min(Math.max(pad, rtl ? r.right - w : r.left), Math.max(pad, vw - pad - w))
        s.setProperty('--_x', (A ? r.left : x) + 'px'); s.setProperty('--_w', w + 'px'); s.setProperty('--_fh', r.height + 'px')
        s.setProperty('--_max', Math.max(96, up.value ? above : below) + 'px')
        if (up.value) { s.setProperty('--_top', 'auto'); s.setProperty('--_bottom', vh - (A ? r.bottom : r.top - gap) + 'px') } else { s.setProperty('--_bottom', 'auto'); s.setProperty('--_top', (A ? r.top : r.bottom + gap) + 'px') }
        measure()
      }
      /** Dónde está el <input> dentro de la caja: lo usan el texto fantasma (A) y la ficha (C), que se pintan encima de él. */
      function measure() {
        const c = control(), i = input(); if (!c || !i) return
        const cr = c.getBoundingClientRect(); const ir = i.getBoundingClientRect()
        c.style.setProperty('--_il', ir.left - cr.left - c.clientLeft + 'px'); c.style.setProperty('--_iw', ir.width + 'px')
      }
      const onMove = () => { place(); if (showToken.value) measure() }
      const mq = matchMedia('(max-width: 520px)'); const onMq = () => { if (open.value) close(); narrow.value = mq.matches }
      watch(showToken, (v) => { if (v) nextTick(measure) }, { flush: 'post' })
      onMounted(() => { measure(); if (document.fonts) document.fonts.ready.then(measure); window.addEventListener('scroll', onMove, true); window.addEventListener('resize', onMove); mq.addEventListener('change', onMq) })
      onBeforeUnmount(() => { window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove); mq.removeEventListener('change', onMq); clearTimeout(timer); clearTimeout(annTimer) })

      // ---- Búsqueda: antirrebote propio; `search` siempre lleva el texto actual ----
      function ask(now) {
        clearTimeout(timer)
        const t = cur().trim()
        if (props.minChars > 0 && t.length > 0 && t.length < props.minChars) { waiting.value = false; return }
        const go = () => { waiting.value = false; lastEmitted = t; emit('search', t) }
        if (now || !props.delay) return go()
        waiting.value = true
        timer = setTimeout(go, fast() ? 20 : props.delay)
      }
      function announce() {
        clearTimeout(annTimer)
        annTimer = setTimeout(() => {
          if (!open.value) return
          const host = surface.value ? dlg.value : root.value
          if (props.loadError) return tell(host, props.loadError)
          if (short.value || pending.value) return
          const n = visible.value.length, tot = totalCount.value
          if (!n) { if (q.value.trim()) tell(host, fmt(L.value.empty, { text: q.value.trim() })); return }
          tell(host, tot > n ? fmt(L.value.partial, { count: nf.format(n), total: nf.format(tot) }) : n === 1 ? L.value.one : fmt(L.value.results, { count: nf.format(n) }))
        }, fast() ? 30 : 600)
      }
      function settle() {
        settledFor.value = cur().trim()
        if (!open.value) return
        const first = nav.value.find((r) => r.kind === 'option')
        if (isTyped() && cur().trim() && props.autoHighlight && first) { active.value = first.id; auto.value = true } else if (!rowById(active.value)) { active.value = null; auto.value = false }
        announce()
        nextTick(place)
      }
      watch(() => props.loading, (v, was) => { if (was && !v) settle() })
      watch(() => props.loadError, (v) => { if (v) { announce(); nextTick(place) } })
      watch(() => props.options, () => { learn(); if (!props.remote) settle(); else nextTick(place) })
      watch(() => [props.modelValue, props.selectedOption], () => { learn(); if (!typed.value || !focused.value) { text.value = selected.value ? selected.value.label : ''; typed.value = false } })
      watch(active, (rid) => nextTick(() => {
        const el = rid && document.getElementById(rid); if (!el) return
        const sc = el.closest('.xc-panel'); const a = el.getBoundingClientRect(), b = sc.getBoundingClientRect() // sin scrollIntoView: la página no se mueve
        if (a.top < b.top) sc.scrollTop -= b.top - a.top + 4; else if (a.bottom > b.bottom) sc.scrollTop += a.bottom - b.bottom + 4
      }))
      watch(hasPanel, () => nextTick(place))

      // ---- Abrir y cerrar ----
      function show(seed) {
        if (props.readonly || props.disabled || open.value) return
        shown.value = props.limit; active.value = null; auto.value = false
        if (surface.value) {
          query.value = seed || ''
          open.value = true
          const from = control().getBoundingClientRect()
          dlg.value.showModal()
          nextTick(() => {
            qEl.value.focus()
            if (is('B') && !narrow.value && !reduced() && !fast()) {
              const box = dlg.value.querySelector('.xc-surface__box'); const to = box.getBoundingClientRect()
              const cs = getComputedStyle(document.documentElement)
              try {
                box.animate([{ transformOrigin: '0 0', transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: 0.4 }, { transformOrigin: '0 0', transform: 'none', opacity: 1 }],
                  { duration: parseFloat(cs.getPropertyValue('--g-duration-slow')) || 300, easing: cs.getPropertyValue('--g-ease-out').trim() || 'ease-out' })
              } catch (e) { /* sin animación */ }
            }
          })
        } else {
          open.value = true
          pop.value.showPopover()
          nextTick(() => { place(); const s = nav.value.find((r) => r.selected); if (s && !typed.value) active.value = s.id })
        }
        emit('open')
        if (props.remote) ask(true); else settle()
      }
      function close(refocus) {
        if (!open.value) return
        open.value = false; active.value = null; auto.value = false; clearTimeout(timer); waiting.value = false
        if (surface.value) { if (dlg.value.open) dlg.value.close(); query.value = ''; if (refocus !== false) nextTick(() => input() && input().focus({ preventScroll: true })) } else if (pop.value.matches(':popover-open')) pop.value.hidePopover()
        emit('close')
      }
      /** Al salir del campo: vacío borra; texto libre permitido se queda; lo demás vuelve a la opción elegida. */
      function commit() {
        const t = text.value.trim(); const s = selected.value
        if (typed.value) {
          if (!t) { if (props.modelValue !== null) emit('update:modelValue', null) } else if (props.allowCustom && (!s || s.label !== t)) { emit('update:modelValue', t) }
        }
        typed.value = false
        nextTick(() => { text.value = selected.value ? selected.value.label : '' })
      }
      function flip(fromRect) {
        if (!is('C') || !fromRect || reduced() || fast()) return
        nextTick(() => {
          const el = tokenEl.value; if (!el) return
          const to = el.getBoundingClientRect(); const cs = getComputedStyle(document.documentElement)
          try {
            el.animate([{ transformOrigin: '0 0', transform: `translate(${fromRect.left - to.left}px, ${fromRect.top - to.top}px)`, opacity: 0.5 }, { transformOrigin: '0 0', transform: 'none', opacity: 1 }],
              { duration: parseFloat(cs.getPropertyValue('--g-duration-slow')) || 300, easing: cs.getPropertyValue('--g-ease-spring').trim() || 'ease-out' })
          } catch (e) { /* sin animación */ }
        })
      }
      function pick(r, el) {
        if (!r || (r.opt && r.opt.disabled)) return
        if (r.kind === 'action') {
          if (r.action === 'retry') return ask(true)
          if (r.action === 'more') {
            const n = visible.value.length
            if (props.remote) emit('more'); else shown.value += props.limit
            const stop = watch(visible, (v) => { stop(); nextTick(() => { const next = nav.value.filter((x) => x.kind === 'option')[n]; if (next) { active.value = next.id; auto.value = false } announce() }) })
            return
          }
          const t = cur().trim()
          if (r.action === 'custom') { emit('update:modelValue', t); text.value = t; typed.value = false; close(); return }
          if (r.action === 'create') { typed.value = false; close(); text.value = selected.value ? selected.value.label : ''; emit('create', t); return } // #57: el foco ya está en el campo antes de emitir
          return
        }
        const rowEl = el || document.getElementById(r.id); const from = rowEl && !surface.value ? rowEl.querySelector('.xc-opt__main').getBoundingClientRect() : null
        known.set(r.opt.value, r.opt)
        if (r.opt.value !== props.modelValue) emit('update:modelValue', r.opt.value)
        text.value = r.opt.label; typed.value = false
        const wasSurface = surface.value
        close()
        if (!wasSurface) nextTick(() => { const i = input(); if (document.activeElement === i) i.select() }) // como al entrar: lo siguiente que se teclee reemplaza
        flip(from)
      }
      function clear() { emit('update:modelValue', null); text.value = ''; typed.value = false; close(false); nextTick(() => input().focus()) }

      // ---- Entrada ----
      function onType(v) {
        if (props.readonly || props.disabled) return
        if (surface.value && !open.value) { show(v); return }
        if (surface.value) query.value = v; else { text.value = v; typed.value = true }
        active.value = null; auto.value = false; shown.value = props.limit
        if (!open.value) show(); else if (props.remote) ask(false); else settle()
      }
      function move(d) {
        const list = nav.value; if (!list.length) return
        const i = list.findIndex((r) => r.id === active.value)
        const n = i === -1 ? (d > 0 ? 0 : list.length - 1) : Math.min(list.length - 1, Math.max(0, i + d))
        active.value = list[n].id; auto.value = false
      }
      function onKey(e) {
        if (props.readonly || props.disabled || e.isComposing) return
        const k = e.key
        if (!open.value) {
          if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); show(); if (!e.altKey) nextTick(() => { if (!active.value) move(k === 'ArrowDown' ? 1 : -1) }) } else if (surface.value && (k === 'Enter' || k === ' ')) { e.preventDefault(); show() } else if (surface.value && k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); show(k) } else if (k === 'Escape' && typed.value) { e.preventDefault(); e.stopPropagation(); typed.value = false; text.value = selected.value ? selected.value.label : ''; nextTick(() => input().select()) }
          return
        }
        if (k === 'ArrowDown') { e.preventDefault(); move(1) } else if (k === 'ArrowUp') { e.preventDefault(); if (e.altKey) close(); else move(-1) } else if (k === 'PageDown') { e.preventDefault(); move(10) } else if (k === 'PageUp') { e.preventDefault(); move(-10) } else if (k === 'Enter') {
          e.preventDefault()
          const r = rowById(active.value)
          if (r && !(auto.value && pending.value)) pick(r) // Enter nunca elige un resultado obsoleto resaltado solo
        } else if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } else if (k === 'Tab') {
          if (surface.value) return
          if (ghost.value && ghost.value.unique) pick(ghost.value.row) // A: Tab acepta lo que el propio campo muestra completado
        } else if (k === 'ArrowRight' && ghost.value && e.target.selectionStart === text.value.length) { e.preventDefault(); text.value = ghost.value.row.opt.label; auto.value = false }
      }
      function onFocus(e) { focused.value = true; if (selected.value && !typed.value) { const el = e.target; nextTick(() => el.select()) } }
      function onBlur() { focused.value = false; if (surface.value) return; close(); commit() }
      function onClick() { if (!open.value) show() }
      function onCancel() { close() }
      function onBackdrop(e) { if (e.target === dlg.value) close() }
      function toggle() { if (open.value) close(); else { input().focus(); show() } }
      const preview = computed(() => { const r = rowById(active.value); return r && r.opt ? r.opt : null })

      return { id, L, root, pop, dlg, qEl, tokenEl, surface, narrow, open, up, active, text, query, q, blocks, status, hasPanel, pending, ghost, showToken, selected, about, preview, visible,
        svg, fmt, onType, onKey, onFocus, onBlur, onClick, onCancel, onBackdrop, pick, clear, toggle, hover: (r) => { if (!(r.opt && r.opt.disabled) && active.value !== r.id) { active.value = r.id; auto.value = false } } }
    },
    template: `
    <div ref="root" class="xc" :class="[concept === 'base' ? 'xc--base' : concept.split('').map((k) => 'xc--' + k), { 'is-open': open && !surface, 'is-up': up, 'is-token': showToken, 'is-custom': selected && selected.custom }]" :data-open="open ? 'true' : 'false'">
      <g-input :id="id" :label="label" :hint="hint" :error="error" :required="required" :readonly="readonly" :disabled="disabled" :placeholder="placeholder" :block="block || undefined"
        :loading="loading && !surface" :model-value="text" @update:model-value="onType"
        role="combobox" :aria-autocomplete="surface ? undefined : 'list'" :aria-haspopup="surface ? 'dialog' : 'listbox'" :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="surface ? id + '-surface' : id + '-list'" :aria-activedescendant="!surface && open && active ? active : undefined"
        :aria-describedby="showToken && about ? id + '-about' : undefined" :inputmode="surface ? 'none' : undefined"
        autocomplete="off" autocapitalize="none" spellcheck="false" @keydown="onKey" @focus="onFocus" @blur="onBlur" @click="onClick">
        <template #prepend><span v-html="svg(icon)"></span></template>
        <template #end>
          <span v-if="ghost" class="xc-ghost" aria-hidden="true"><span class="xc-ghost__typed">{{ text }}</span><span class="xc-ghost__rest">{{ ghost.rest }}</span></span>
          <span v-if="showToken" ref="tokenEl" class="xc-token" aria-hidden="true">
            <g-avatar v-if="selected.avatar" :name="selected.avatar" size="xs" />
            <span v-else-if="selected.code" class="xc-code">{{ selected.code }}</span>
            <span v-else-if="selected.custom" class="xc-token__free" v-html="svg('pencil')"></span>
            <span class="xc-token__name">{{ selected.label }}</span>
            <span v-if="selected.custom" class="xc-token__meta">{{ L.free }}</span>
            <span v-else-if="selected.token" class="xc-token__meta">{{ selected.token }}</span>
          </span>
          <span v-if="showToken && about" class="sr" :id="id + '-about'">{{ about }}</span>
          <button v-if="clearable && selected && !readonly && !disabled" type="button" class="xc-x" :id="id + '-clear'" :aria-label="fmt(L.clear, { label })" @mousedown.prevent @click="clear"><span v-html="svg('x')"></span></button>
          <span v-if="!readonly && !disabled" class="xc-arrow" aria-hidden="true" @mousedown.prevent @click="toggle" v-html="svg(surface ? 'chevrons-up-down' : 'chevron-down')"></span>
          <input v-if="name" type="hidden" :name="name" :value="modelValue === null ? '' : modelValue">
        </template>
      </g-input>
      <div v-if="!surface" ref="pop" class="xc-pop" :class="{ 'is-empty': !hasPanel }" popover="manual" :id="id + '-pop'" @mousedown.prevent>
        <div class="xc-pop__in"><x-panel :id="id" :blocks="blocks" :active="active" :q="q" :status="status" :busy="pending" :concept="concept" :count="visible.length" @pick="pick" @hover="hover" /></div>
      </div>
      <dialog v-else ref="dlg" class="xc-surface" :class="narrow ? 'xc-surface--sheet' : 'xc-surface--palette'" :id="id + '-surface'" :aria-labelledby="id + '-surface-title'" @cancel.prevent="onCancel" @click="onBackdrop">
        <div class="xc-surface__box">
          <div class="xc-surface__head">
            <label class="xc-surface__title" :id="id + '-surface-title'" :for="id + '-q'">{{ label }}</label>
          </div>
          <div class="xc-surface__field">
            <span aria-hidden="true" v-html="svg(icon)"></span>
            <input ref="qEl" :id="id + '-q'" class="xc-surface__input" type="text" role="combobox" aria-autocomplete="list" aria-expanded="true" :aria-controls="id + '-list'" :aria-activedescendant="active || undefined"
              :value="query" :placeholder="selected ? selected.label : placeholder" autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search" @input="onType($event.target.value)" @keydown="onKey">
            <span v-if="pending" class="xc-spin" aria-hidden="true" v-html="svg('loader-circle')"></span>
            <button type="button" class="xc-x" :id="id + '-close'" :aria-label="L.close" @click="onCancel"><span v-html="svg('x')"></span></button>
          </div>
          <div class="xc-surface__body" :class="{ 'has-preview': concept.includes('B') && !narrow }">
            <x-panel :id="id" :blocks="blocks" :active="active" :q="q" :status="status" :busy="pending" :concept="concept" :count="visible.length" @pick="pick" @hover="hover" />
            <aside v-if="concept.includes('B') && !narrow" class="xb-preview" :id="id + '-preview'" :aria-label="L.preview">
              <template v-if="preview">
                <div class="xb-preview__head">
                  <g-avatar v-if="preview.avatar" :name="preview.avatar" size="lg" />
                  <span v-else-if="preview.code" class="xc-code xc-code--lg">{{ preview.code }}</span>
                  <p class="xb-preview__name">{{ preview.label }}</p>
                </div>
                <dl v-if="preview.detail" class="xb-preview__dl"><template v-for="d in preview.detail" :key="d.k"><dt>{{ d.k }}</dt><dd>{{ d.v }}</dd></template></dl>
                <p v-else-if="preview.description" class="xb-preview__text">{{ preview.description }}</p>
              </template>
              <p v-else class="xb-preview__hint">{{ L.previewHint }}</p>
            </aside>
          </div>
        </div>
      </dialog>
    </div>`
  })

  // =====================================================================================================
  // Datos de la maqueta y «servidor» simulado (la aplicación; Grana nunca hace fetch)
  // =====================================================================================================
  function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 } }
  const NOM = ['María', 'José', 'Guadalupe', 'Juan', 'Ana', 'Luis', 'Sofía', 'Carlos', 'Fernanda', 'Miguel', 'Valeria', 'Jorge', 'Camila', 'Pedro', 'Daniela', 'Andrés', 'Regina', 'Óscar', 'Ximena', 'Raúl', 'Renata', 'Iván', 'Paola', 'Héctor', 'Lucía', 'Ángel', 'Elena', 'Rubén', 'Itzel', 'Tomás']
  const APE = ['García', 'Hernández', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Jiménez', 'Reyes', 'Díaz', 'Torres', 'Gutiérrez', 'Ruiz', 'Mendoza', 'Aguilar', 'Ortiz', 'Castillo', 'Chávez', 'Núñez', 'Juárez', 'Santiago', 'Velasco', 'Zárate']
  const MED = ['Dra. Ibáñez', 'Dr. Salgado', 'Dra. Córdova', 'Dr. Lara']
  const SAN = ['O+', 'A+', 'B+', 'O−', 'AB+', 'A−']
  const patients = []
  ;(function () {
    const r = rng(7)
    const mk = (i, n, a1, a2) => {
      const age = 1 + Math.floor(r() * 92); const exp = String(1000 + i * 7).padStart(6, '0'); const d = 1 + Math.floor(r() * 27); const m = 1 + Math.floor(r() * 9)
      const last = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/2026`; const sex = r() > 0.5 ? 'F' : 'M'
      const label = `${n} ${a1} ${a2}`
      return { value: 'p' + exp, label, avatar: label, description: `Exp. ${exp} · ${age} años`, token: `Exp. ${exp} · ${age} años`,
        facts: [{ k: 'Exp.', v: exp }, { k: 'Edad', v: `${age} años` }, { k: 'Última visita', v: last }],
        detail: [{ k: 'Expediente', v: exp }, { k: 'Edad', v: `${age} años` }, { k: 'Sexo', v: sex === 'F' ? 'Femenino' : 'Masculino' }, { k: 'Última visita', v: last }, { k: 'Médico tratante', v: MED[Math.floor(r() * MED.length)] }, { k: 'Grupo sanguíneo', v: SAN[Math.floor(r() * SAN.length)] }] }
    }
    for (let i = 0; i < 2400; i++) patients.push(i < 4 ? mk(i, 'María', 'García', 'López') : mk(i, NOM[Math.floor(r() * NOM.length)], APE[Math.floor(r() * APE.length)], APE[Math.floor(r() * APE.length)]))
  })()
  const RECENT = [patients[0], patients[57], patients[123], patients[900]]

  const CIE = [
    ['Infecciosas y parasitarias (A00–B99)', [['A09', 'Diarrea y gastroenteritis de presunto origen infeccioso'], ['A90', 'Fiebre del dengue [dengue clásico]'], ['B34.9', 'Infección viral, no especificada']]],
    ['Endocrinas, nutricionales y metabólicas (E00–E89)', [['E03.9', 'Hipotiroidismo, no especificado'], ['E10.9', 'Diabetes mellitus tipo 1, sin mención de complicación'], ['E11.9', 'Diabetes mellitus tipo 2, sin mención de complicación'], ['E66.9', 'Obesidad, no especificada'], ['E78.5', 'Hiperlipidemia, no especificada']]],
    ['Trastornos mentales (F00–F99)', [['F32.9', 'Episodio depresivo, no especificado'], ['F41.1', 'Trastorno de ansiedad generalizada']]],
    ['Sistema nervioso (G00–G99)', [['G43.9', 'Migraña, no especificada'], ['G47.0', 'Trastornos del inicio y del mantenimiento del sueño [insomnios]']]],
    ['Sistema circulatorio (I00–I99)', [['I10', 'Hipertensión esencial (primaria)'], ['I20.9', 'Angina de pecho, no especificada'], ['I25.9', 'Enfermedad isquémica crónica del corazón, no especificada'], ['I50.9', 'Insuficiencia cardíaca, no especificada']]],
    ['Sistema respiratorio (J00–J99)', [['J00', 'Rinofaringitis aguda [resfriado común]'], ['J02.9', 'Faringitis aguda, no especificada'], ['J03.9', 'Amigdalitis aguda, no especificada'], ['J06.9', 'Infección aguda de las vías respiratorias superiores, no especificada'], ['J18.9', 'Neumonía, no especificada'], ['J20.9', 'Bronquitis aguda, no especificada'], ['J45.9', 'Asma, no especificada']]],
    ['Sistema digestivo (K00–K95)', [['K21.9', 'Enfermedad del reflujo gastroesofágico sin esofagitis'], ['K29.7', 'Gastritis, no especificada'], ['K30', 'Dispepsia'], ['K59.0', 'Constipación']]],
    ['Sistema osteomuscular (M00–M99)', [['M54.5', 'Lumbago no especificado'], ['M79.1', 'Mialgia']]],
    ['Sistema genitourinario (N00–N99)', [['N39.0', 'Infección de vías urinarias, sitio no especificado']]],
    ['Síntomas y signos (R00–R99)', [['R05', 'Tos'], ['R10.4', 'Otros dolores abdominales y los no especificados'], ['R50.9', 'Fiebre, no especificada'], ['R51', 'Cefalea']]]
  ]
  const dx = CIE.map(([label, list]) => ({ label, options: list.map(([code, d]) => ({ value: code, code, label: d, token: label.replace(/ \(.*/, ''), detail: [{ k: 'Código', v: code }, { k: 'Capítulo', v: label }, { k: 'Descripción', v: d }] })) }))
  const MEDS = [['Paracetamol 500 mg, tabletas', 'Analgésico · vía oral'], ['Paracetamol 100 mg/ml, solución gotas', 'Analgésico · vía oral · pediátrico'], ['Ibuprofeno 400 mg, tabletas', 'AINE · vía oral'], ['Naproxeno 250 mg, tabletas', 'AINE · vía oral'], ['Amoxicilina 500 mg, cápsulas', 'Antibiótico · vía oral'], ['Amoxicilina con ácido clavulánico 875/125 mg, tabletas', 'Antibiótico · vía oral'], ['Azitromicina 500 mg, tabletas', 'Antibiótico · vía oral'], ['Metformina 850 mg, tabletas', 'Hipoglucemiante · vía oral'], ['Losartán 50 mg, tabletas', 'Antihipertensivo · vía oral'], ['Enalapril 10 mg, tabletas', 'Antihipertensivo · vía oral'], ['Omeprazol 20 mg, cápsulas', 'Inhibidor de la bomba de protones'], ['Loratadina 10 mg, tabletas', 'Antihistamínico · vía oral'], ['Salbutamol 100 µg, aerosol', 'Broncodilatador · inhalado'], ['Atorvastatina 20 mg, tabletas', 'Hipolipemiante · vía oral'], ['Levotiroxina 100 µg, tabletas', 'Hormona tiroidea · vía oral']]
  const meds = MEDS.map(([label, description], i) => ({ value: 'm' + i, label, description, token: description, detail: [{ k: 'Presentación', v: label }, { k: 'Clase', v: description }] }))
  const CLIENTES = ['Laboratorios Alfa', 'Clínica del Valle', 'Hospital San Ángel', 'Farmacia La Paz', 'Distribuidora Médica del Sur', 'Grupo Sanatorio Oaxaca'].map((label, i) => ({ value: 'c' + i, label }))
  const big = Array.from({ length: 500 }, (_, i) => ({ value: 'b' + i, label: `Insumo ${String(i + 1).padStart(3, '0')} · ${['gasas', 'jeringas', 'guantes', 'catéteres', 'vendas'][i % 5]}` }))

  const PAGE = 20
  const server = {
    calls: 0,
    patients(q, offset) {
      server.calls++
      return new Promise((res, rej) => setTimeout(() => {
        if (window.__failNext) { window.__failNext = false; return rej(new Error('503')) }
        const toks = tokens(q)
        const all = toks.length ? patients.filter((p) => { const h = fold(p.label + ' ' + p.description); return toks.every((t) => h.includes(t)) }) : RECENT
        const f0 = fold(q)
        if (toks.length) all.sort((a, b) => Number(fold(b.label).startsWith(f0)) - Number(fold(a.label).startsWith(f0)))
        res({ items: all.slice(offset, offset + PAGE), total: all.length })
      }, window.__fast ? 30 : window.__slow ? 1800 : 380))
    }
  }

  const App = defineComponent({
    components: { XCombo },
    props: { concept: String },
    setup(props) {
      const pat = reactive({ value: null, options: [{ label: 'Recientes', options: RECENT }], loading: false, total: null, err: '', seq: 0, q: '' })
      const pat2 = reactive({ value: patients[57].value, options: [], loading: false, total: null, err: '', seq: 0, q: '' })
      function search(st, q) {
        const s = ++st.seq; st.q = q; st.loading = true; st.err = ''
        server.patients(q, 0).then((r) => { if (s !== st.seq) return; st.options = q ? r.items : [{ label: 'Recientes', options: r.items }]; st.total = q ? r.total : null; st.loading = false })
          .catch(() => { if (s !== st.seq) return; st.loading = false; st.err = 'No se pudieron cargar los resultados.' })
      }
      function more(st) {
        const s = ++st.seq; st.loading = true
        server.patients(st.q, st.options.length).then((r) => { if (s !== st.seq) return; st.options = st.options.concat(r.items); st.loading = false })
          .catch(() => { if (s !== st.seq) return; st.loading = false; st.err = 'No se pudieron cargar los resultados.' })
      }
      const m = reactive({ dx: null, med: null, cliente: null, big: null, ro: 'I10', dis: 'J00', bad: null, sel: 'a', nota: '', dlgOpen: false, clientes: CLIENTES.slice(), created: '', sent: '' })
      function create(t) { const o = { value: 'c' + m.clientes.length, label: t }; m.clientes = m.clientes.concat(o); m.cliente = o.value; m.created = t }
      function submit() { const f = document.getElementById('form'); m.sent = JSON.stringify(Object.fromEntries(new FormData(f.matches('form') ? f : f.querySelector('form')))) }
      window.__S = { pat, pat2, m, server, patients }
      return { pat, pat2, m, dx, meds, big, search, more, create, submit, patients, svg, sel: [{ value: 'a', label: 'Consulta externa' }, { value: 'b', label: 'Urgencias' }] }
    },
    template: `
    <div class="cards">
      <section class="card" id="case-paciente"><h2>1 · Paciente entre miles (resultados del servidor)</h2>
        <x-combo id="paciente" block :concept="concept" label="Paciente" hint="Nombre, apellidos o expediente" placeholder="Buscar paciente" icon="user" clearable remote :min-chars="2"
          v-model="pat.value" :options="pat.options" :loading="pat.loading" :total="pat.total" :load-error="pat.err" @search="search(pat, $event)" @more="more(pat)" />
        <p class="out">Modelo: <code id="out-paciente">{{ pat.value === null ? 'null' : pat.value }}</code></p>
      </section>
      <section class="card" id="case-dx"><h2>2 · Diagnóstico CIE-10 (lista local, grupos, código y descripción)</h2>
        <x-combo id="dx" block :concept="concept" label="Diagnóstico principal" placeholder="Código o descripción" icon="file-text" clearable required v-model="m.dx" :options="dx" />
        <p class="out">Modelo: <code id="out-dx">{{ m.dx === null ? 'null' : m.dx }}</code></p>
      </section>
      <section class="card" id="case-med"><h2>3 · Medicamento (texto libre permitido)</h2>
        <x-combo id="med" block :concept="concept" label="Medicamento" hint="Elige del cuadro básico o escribe otro" placeholder="Nombre y presentación" icon="tag" clearable allow-custom v-model="m.med" :options="meds" />
        <p class="out">Modelo: <code id="out-med">{{ m.med === null ? 'null' : m.med }}</code></p>
      </section>
      <section class="card" id="case-cliente"><h2>4 · Cliente (catálogo incompleto: fila «Agregar»)</h2>
        <x-combo id="cliente" block :concept="concept" label="Cliente" placeholder="Buscar cliente" icon="building-2" create-label="Agregar «{text}» como cliente nuevo" v-model="m.cliente" :options="m.clientes" @create="create" />
        <p class="out">Modelo: <code id="out-cliente">{{ m.cliente === null ? 'null' : m.cliente }}</code> · creado: <code id="out-created">{{ m.created }}</code></p>
      </section>
      <section class="card" id="case-form"><h2>5 · En un formulario: fila de tres, solo lectura, deshabilitado, error</h2>
        <g-form id="form" @submit="submit">
          <g-form-layout>
            <g-form-row id="row">
              <x-combo id="f-pac" name="paciente" :concept="concept" label="Paciente" icon="user" remote :min-chars="2" v-model="pat2.value" :selected-option="patients[57]" :options="pat2.options" :loading="pat2.loading" :total="pat2.total" :load-error="pat2.err" @search="search(pat2, $event)" @more="more(pat2)" />
              <g-select id="f-sel" label="Servicio" v-model="m.sel" :options="sel" />
              <g-input id="f-nota" label="Nota" v-model="m.nota" />
            </g-form-row>
            <g-form-row id="row2">
              <x-combo id="f-ro" :concept="concept" label="Diagnóstico (solo lectura)" icon="file-text" readonly v-model="m.ro" :options="dx" />
              <x-combo id="f-dis" :concept="concept" label="Diagnóstico (deshabilitado)" icon="file-text" disabled v-model="m.dis" :options="dx" />
            </g-form-row>
            <x-combo id="f-bad" :concept="concept" label="Diagnóstico de egreso" icon="file-text" required error="Elige un diagnóstico de la lista." v-model="m.bad" :options="dx" />
          </g-form-layout>
          <p><g-btn id="send" type="submit">Guardar</g-btn></p>
        </g-form>
        <p class="out">Enviado: <code id="out-sent">{{ m.sent }}</code></p>
      </section>
      <section class="card" id="case-dialog"><h2>6 · Dentro de un diálogo</h2>
        <g-btn id="d-open" variant="outline" @click="m.dlgOpen = true">Abrir diálogo</g-btn>
        <g-dialog id="dlg" v-model="m.dlgOpen" title="Receta" close-label="Cerrar">
          <x-combo id="d-med" block :concept="concept" label="Medicamento" icon="tag" allow-custom v-model="m.med" :options="meds" />
          <x-combo id="d-dx" block :concept="concept" label="Diagnóstico" icon="file-text" v-model="m.dx" :options="dx" />
        </g-dialog>
      </section>
      <section class="card" id="case-big"><h2>7 · Quinientas opciones (tope de 50 y «Mostrar más»)</h2>
        <x-combo id="big" block :concept="concept" label="Insumo" placeholder="Buscar insumo" v-model="m.big" :options="big" />
      </section>
    </div>`
  })

  window.ComboLab = {
    XCombo, parts, fold,
    mount(sel, concept) {
      const app = createApp(App, { concept })
      app.use(Grana)
      app.mount(sel)
      return app
    }
  }
})()
