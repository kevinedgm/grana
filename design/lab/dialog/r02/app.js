// kiwi · dialog r02 · prototipo: «Hoy» (GDialog real anidado, para medir) y los conceptos A, B y C sobre el flujo
// real de cinco niveles. Componentes reales de dist/ (GBtn, GInput, GSelect, GDialog, GForm, GToaster) y tokens reales.
// Las clases xa-*, xb-*, xc-*, xr-* son de prototipo; el CSS definitivo es de coco y el .vue de bruno.
/* global Vue, Grana, Flow */
const { createApp, defineComponent, ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } = Vue
const { catalog, unidades, ocs, almacenes, labelOf, draft, errors, LEVELS, createFlow, commit, announce, placeLive, focusReturn, focusFirstIn, land } = Flow
const svg = (n) => window.lucide(n)
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const phone = () => matchMedia('(max-width: 520px)').matches
const token = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
// Duraciones resueltas (--g-duration-slow es un calc): se leen de una sonda con transition-duration
let probe = null
const ms = (name) => {
  if (!probe) { probe = document.createElement('i'); probe.className = 'sr'; document.body.append(probe) }
  probe.style.transitionDuration = 'var(' + name + ')'
  const v = getComputedStyle(probe).transitionDuration
  return v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000
}
const title = (l) => (l ? LEVELS[l.key].title() : '')
const waiting = (l) => (l ? LEVELS[l.key].waiting() : '')
const isModal = (d) => { try { return d.matches(':modal') } catch { return d.open } }
window.__r02 = { said: Flow.said, events: [] }
const log = (e) => window.__r02.events.push(e)

// ============================================================================================
// Contenido de cada nivel (igual en los tres conceptos). Los huecos `after-*` solo los usa C (creación en su sitio).
// ============================================================================================
const LevelBody = defineComponent({
  name: 'LevelBody',
  props: { k: String },
  emits: ['open'],
  setup(props, { emit }) {
    // from: quien abre el nivel, explícito (en WebKit un clic no enfoca el botón, #307: no basta document.activeElement)
    const open = (key, from) => emit('open', key, from ? document.getElementById(from) : null)
    const p3 = computed(() => draft.ingreso.partidas[2])
    return { draft, errors, catalog, unidades, ocs, almacenes, labelOf, open, p3, svg }
  },
  template: `
  <div class="xr-level" :data-level="k">
    <template v-if="k === 'detalle'">
      <dl class="xr-facts">
        <div><dt>Clave</dt><dd>QH-0037</dd></div>
        <div><dt>Existencia</dt><dd>48 L</dd></div>
        <div><dt>Ubicación</dt><dd>Almacén central</dd></div>
      </dl>
      <g-btn id="f-detalle-ingreso" variant="soft" @click="open('ingreso', 'f-detalle-ingreso')"><template #prepend><span v-html="svg('inbox')"></span></template>Registrar ingreso desde orden de compra</g-btn>
    </template>

    <template v-else-if="k === 'ingreso'">
      <div class="xr-grid">
        <g-select id="f-ingreso-oc" label="Orden de compra" :options="ocs" v-model="draft.ingreso.oc" />
        <g-select id="f-ingreso-almacen" label="Almacén" :options="almacenes" v-model="draft.ingreso.almacen" />
      </div>
      <h3 class="xr-h" id="xr-partidas">Partidas</h3>
      <ul class="xr-rows" aria-labelledby="xr-partidas">
        <li v-for="p in draft.ingreso.partidas" :key="p.n" class="xr-row" :class="{ 'is-pending': !p.producto }" :id="'xr-row-' + p.n">
          <span class="xr-row__n">{{ p.n }}</span>
          <span class="xr-row__main">
            <strong v-if="p.producto">{{ labelOf(catalog.productos, p.producto) }}</strong>
            <strong v-else>Producto por definir</strong>
            <small v-if="p.pendiente">En la orden: «{{ p.pendiente }}», no está en el catálogo</small>
            <small v-else>{{ p.cantidad }} {{ p.unidad === 'l' ? 'L' : p.unidad }}</small>
          </span>
          <g-btn v-if="p.n === 3" id="f-ingreso-p3" size="sm" :variant="p.producto ? 'ghost' : 'outline'" color="neutral" :aria-describedby="errors['ingreso.partidas'] ? 'e-ingreso' : undefined" @click="open('partida', 'f-ingreso-p3')">{{ p.producto ? 'Editar' : 'Completar' }}<span class="sr"> partida 3</span></g-btn>
          <div v-if="p.n === 3" class="xr-row__slot"><slot name="after-p3" /></div>
        </li>
      </ul>
      <p v-if="errors['ingreso.partidas']" id="e-ingreso" class="xr-err"><span v-html="svg('circle-alert')"></span>{{ errors['ingreso.partidas'] }}</p>
    </template>

    <template v-else-if="k === 'partida'">
      <g-select id="f-partida-producto" label="Producto" :options="catalog.productos" v-model="draft.partida.producto" placeholder="Elige un producto"
        create-label="Crear producto…" :error="errors['partida.producto']" hint="En la orden aparece como «Tris base»." @create="open('producto', 'f-partida-producto')" />
      <slot name="after-partida-producto" />
      <div class="xr-grid">
        <g-input id="f-partida-lote" label="Lote" v-model="draft.partida.lote" />
        <g-input id="f-partida-cantidad" label="Cantidad" suffix="kg" v-model="draft.partida.cantidad" :error="errors['partida.cantidad']" />
      </div>
    </template>

    <template v-else-if="k === 'producto'">
      <g-input id="f-producto-nombre" label="Nombre" v-model="draft.producto.nombre" :error="errors['producto.nombre']" />
      <g-select id="f-producto-categoria" label="Categoría" :options="catalog.categorias" v-model="draft.producto.categoria" placeholder="Elige una categoría"
        create-label="Crear categoría…" :error="errors['producto.categoria']" @create="open('categoria', 'f-producto-categoria')" />
      <slot name="after-producto-categoria" />
      <g-select id="f-producto-unidad" label="Unidad" :options="unidades" v-model="draft.producto.unidad" />
    </template>

    <template v-else-if="k === 'categoria'">
      <g-input id="f-categoria-nombre" label="Nombre" v-model="draft.categoria.nombre" :error="errors['categoria.nombre']" />
      <g-select id="f-categoria-padre" label="Categoría superior" :options="catalog.categorias" v-model="draft.categoria.padre" placeholder="Ninguna" hint="Opcional." />
    </template>
  </div>`
})

// Acciones del pie de cada nivel. secondary = bajar un nivel sin resultado (en el nivel 1, cerrar).
const PRIMARY = { ingreso: 'Registrar ingreso', partida: 'Guardar partida', producto: 'Crear y elegir', categoria: 'Crear y elegir' }
const LevelActions = defineComponent({
  name: 'LevelActions',
  props: { k: String, depth: Number, secondary: String },
  emits: ['back', 'confirm'],
  setup() { return { PRIMARY } },
  template: `
  <div class="xr-actions">
    <g-btn :id="'a-' + k + '-back'" variant="ghost" color="neutral" @click="$emit('back')">{{ secondary || (depth > 1 ? 'Cancelar' : 'Cerrar') }}</g-btn>
    <g-btn v-if="PRIMARY[k]" :id="'a-' + k + '-ok'" @click="$emit('confirm')">{{ PRIMARY[k] }}</g-btn>
  </div>`
})

// Reglas comunes de Esc para los tres conceptos (base §4): una pulsación baja un nivel; la repetición de tecla se ignora;
// un descendiente que ya trató Esc (lista de GSelect abierta, aviso, pliegue de C) lo cancela y no es para el diálogo.
function escFor(handler) {
  return (event) => {
    if (event.key !== 'Escape' || event.isComposing) return
    if (event.defaultPrevented) return
    event.preventDefault()
    if (event.repeat) { log('esc-repeat-ignored'); return }
    handler()
  }
}
// Clic en el fondo: empieza y termina fuera de la carcasa
function outside(dlg, event) {
  if (event.target !== dlg) return false
  const r = dlg.getBoundingClientRect()
  return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom
}

// ============================================================================================
// HOY · GDialog real anidado cinco veces (como lo haría hoy una aplicación). Solo para medir.
// ============================================================================================
const Today = defineComponent({
  name: 'Today',
  setup() {
    const hoy = reactive([false, false, false, false, false])
    const subs = reactive({ ingreso: 0, partida: 0, producto: 0, categoria: 0 })
    const inval = reactive({ ingreso: 0, partida: 0, producto: 0, categoria: 0 })
    const v = reactive({ ref: '', lote: '', nombre: 'Tris base', cat: '' })
    const toaster = Grana.useToast ? Grana.useToast() : null
    const toast = () => (window.__toaster.info('Categoría guardada en borrador'))
    window.__r02.today = { hoy, subs, inval }
    return { hoy, subs, inval, v, toast, svg }
  },
  template: `
  <div class="xr-today">
    <g-btn id="hoy-open" @click="hoy[0] = true">Abrir detalle de producto (GDialog real)</g-btn>
    <g-dialog v-model="hoy[0]" title="Ácido clorhídrico 37 %" description="Detalle de producto" close-label="Cerrar" id="hoy-d1">
      <p>Existencia 48 L · Almacén central</p>
      <g-btn id="hoy-b1" variant="soft" @click="hoy[1] = true">Registrar ingreso desde orden de compra</g-btn>
      <g-dialog v-model="hoy[1]" title="Ingreso desde orden de compra" close-label="Cerrar" id="hoy-d2">
        <g-form id="hoy-f2" aria-label="Ingreso" @submit="subs.ingreso++" @invalid="inval.ingreso++">
          <g-input id="hoy-ref" name="ref" label="Factura del proveedor" required v-model="v.ref" />
          <g-btn id="hoy-b2" variant="outline" color="neutral" @click="hoy[2] = true">Completar partida 3</g-btn>
          <g-dialog v-model="hoy[2]" title="Partida 3" close-label="Cerrar" id="hoy-d3">
            <g-form id="hoy-f3" aria-label="Partida" @submit="subs.partida++" @invalid="inval.partida++">
              <g-input id="hoy-lote" name="lote" label="Lote" required v-model="v.lote" />
              <g-btn id="hoy-b3" variant="outline" color="neutral" @click="hoy[3] = true">Crear producto…</g-btn>
              <g-dialog v-model="hoy[3]" title="Producto nuevo" close-label="Cerrar" id="hoy-d4">
                <g-form id="hoy-f4" aria-label="Producto" @submit="subs.producto++" @invalid="inval.producto++">
                  <g-input id="hoy-nombre" name="nombre" label="Nombre" required v-model="v.nombre" />
                  <g-btn id="hoy-b4" variant="outline" color="neutral" @click="hoy[4] = true">Crear categoría…</g-btn>
                  <g-dialog v-model="hoy[4]" title="Categoría nueva" close-label="Cerrar" id="hoy-d5">
                    <g-form id="hoy-f5" aria-label="Categoría" @submit="subs.categoria++; hoy[4] = false" @invalid="inval.categoria++">
                      <g-input id="hoy-cat" name="cat" label="Nombre" v-model="v.cat" />
                      <div class="xr-actions">
                        <g-btn id="hoy-toast" variant="ghost" color="neutral" @click="toast">Mostrar un aviso</g-btn>
                        <g-btn id="hoy-save5" type="submit">Crear categoría</g-btn>
                      </div>
                    </g-form>
                  </g-dialog>
                </g-form>
              </g-dialog>
            </g-form>
          </g-dialog>
        </g-form>
      </g-dialog>
    </g-dialog>
  </div>`
})

// ============================================================================================
// A · LA BARAJA. Cada nivel es un <dialog> modal de verdad (pila nativa, APG); los de abajo quedan a la vista como
// lomos de una baraja con su título y lo que esperan; un solo fondo; el clic en un lomo vuelve a ese nivel.
// ============================================================================================
const ConceptA = defineComponent({
  name: 'ConceptA',
  components: { LevelBody, LevelActions },
  setup() {
    const flow = createFlow()
    const els = new Map()
    const reg = (id, el) => { if (el) els.set(id, el); else els.delete(id) }
    const live = computed(() => flow.stack.filter((l) => !l.leaving))
    const depthOf = (l) => live.value.indexOf(l)
    const below = (l) => live.value.length - 1 - live.value.indexOf(l)
    window.__r02.flow = flow

    // Los <dialog> de abajo miden lo que les falta para acabar donde acaba el de arriba (baraja alineada abajo)
    let ro = null
    function fitDeck() {
      const top = live.value[live.value.length - 1]
      const topEl = top && els.get(top.id)
      for (const l of live.value) {
        const el = els.get(l.id)
        if (!el) continue
        if (l === top || phone()) { el.style.removeProperty('--_deck-h'); continue }
        const h = topEl ? Math.max(0, topEl.getBoundingClientRect().bottom - el.offsetTop) : 0
        el.style.setProperty('--_deck-h', Math.round(h) + 'px')
      }
    }
    function observeTop() {
      ro?.disconnect()
      const top = live.value[live.value.length - 1]
      const el = top && els.get(top.id)
      if (el && typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(fitDeck); ro.observe(el) }
      fitDeck()
    }
    addEventListener('resize', fitDeck)
    onBeforeUnmount(() => { ro?.disconnect(); removeEventListener('resize', fitDeck) })

    async function open(key, from) {
      flow.push(key, from)
      log('push:' + key)
      await nextTick()
      const top = flow.top()
      const el = els.get(top.id)
      el.showModal()
      placeLive()
      observeTop()
      // Foco inicial (#292): primer control del contenido, sin Volver ni cerrar
      focusFirstIn(el, '.g-dialog__close, .xa-back')
    }
    // Baja un nivel. result: lo que devolvió commit(); sin él, el foco vuelve a quien abrió el nivel.
    function leave(result) {
      const top = live.value[live.value.length - 1]
      if (!top) return
      const el = els.get(top.id)
      top.leaving = true
      el?.close()
      placeLive()
      const parentEl = live.value.length ? els.get(live.value[live.value.length - 1].id) : null
      const how = focusReturn(result && result.focus, top.opener, parentEl)
      log('pop:' + top.key + ':' + how)
      if (result && result.focus) land(result.focus)
      if (result && result.said) announce(result.said)
      observeTop()
      setTimeout(() => { const i = flow.stack.indexOf(top); if (i >= 0) flow.stack.splice(i, 1); if (!live.value.length) flow.closeAll() }, reduced() ? ms('--g-duration-fast') : ms('--g-duration-slow'))
    }
    const back = () => leave(null)
    function confirm(key) {
      const r = commit(key)
      if (!r.ok) { document.getElementById(r.focus)?.focus(); return }
      leave(r)
    }
    function popTo(i) { while (live.value.length - 1 > i) leave(null) }
    // Clic en el fondo del superior: si cae sobre un lomo, se vuelve a ese nivel; en el nivel 1, cierra (como hoy);
    // desde el nivel 2, el fondo no descarta nada (base §5)
    let downOut = false
    function onDown(e, l) { downOut = outside(els.get(l.id), e) }
    function onClick(e, l) {
      const el = els.get(l.id)
      if (!downOut || !outside(el, e)) return
      downOut = false
      for (const other of live.value) {
        if (other === l) continue
        const spine = els.get(other.id)?.querySelector('.xa-spine')
        const r = spine?.getBoundingClientRect()
        if (r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { log('spine:' + other.key); popTo(depthOf(other)); return }
      }
      if (depthOf(l) === 0) back()
      else log('backdrop-ignored')
    }
    const onKey = escFor(() => back())
    return { flow, live, reg, open, back, confirm, onDown, onClick, onKey, depthOf, below, title, waiting, LEVELS, svg }
  },
  template: `
  <div>
    <g-btn id="opener" @click="open('detalle', $event.currentTarget)">Abrir detalle de producto</g-btn>
    <dialog v-for="l in flow.stack" :key="l.id" :ref="(el) => reg(l.id, el)"
      class="g-dialog g-dialog--size-md g-dialog--density-default g-dialog--inset g-dialog--placement-center g-dialog--mobile-sheet xa-card"
      :class="{ 'is-below': !l.leaving && below(l) > 0, 'is-base': depthOf(l) === 0, 'is-leaving': l.leaving }"
      :style="{ '--_i': Math.max(0, depthOf(l)), '--_below': Math.max(0, below(l)) }"
      :data-level="l.key" :aria-labelledby="'xa-t-' + l.id" :aria-describedby="'xa-d-' + l.id"
      @keydown="onKey" @cancel.prevent @pointerdown="onDown($event, l)" @click="onClick($event, l)">
      <div class="xa-spine" aria-hidden="true">
        <span class="xa-spine__n">{{ depthOf(l) + 1 }}</span>
        <span class="xa-spine__t">{{ title(l) }}</span>
        <span class="xa-spine__w">{{ waiting(l) }}</span>
      </div>
      <div class="g-dialog__header">
        <button v-if="depthOf(l) > 0" class="g-dialog__close xa-back" type="button" :aria-label="'Volver a ' + title(live[depthOf(l) - 1])" @click="back"><span v-html="svg('chevron-left')"></span></button>
        <div class="g-dialog__titles">
          <h2 class="g-dialog__title" :id="'xa-t-' + l.id">{{ title(l) }}</h2>
          <p class="g-dialog__description" :id="'xa-d-' + l.id">{{ LEVELS[l.key].purpose }}</p>
        </div>
        <button v-if="depthOf(l) === 0" class="g-dialog__close" type="button" aria-label="Cerrar" @click="back"><span v-html="svg('x')"></span></button>
      </div>
      <div class="g-dialog__inset">
        <div class="g-dialog__body"><level-body :k="l.key" @open="open" /></div>
        <div class="g-dialog__footer" v-if="l.key !== 'detalle'"><level-actions :k="l.key" :depth="depthOf(l) + 1" @back="back" @confirm="confirm(l.key)" /></div>
      </div>
    </dialog>
  </div>`
})

// ============================================================================================
// B · EL HILO. Un solo <dialog> (una capa, un fondo, una trampa de foco). Cada nivel es un paso con historial: el
// hilo arriba dice de dónde vienes y qué espera cada nivel; Volver devuelve el resultado al paso de abajo.
// ============================================================================================
const ConceptB = defineComponent({
  name: 'ConceptB',
  components: { LevelBody, LevelActions },
  setup() {
    const flow = createFlow()
    const dlg = ref(null)
    const inset = ref(null)
    const stage = ref(null)
    const entering = ref(0)
    const dir = ref('forward')
    let maxSheet = 0
    window.__r02.flow = flow
    const last = computed(() => flow.stack.length - 1)
    const parent = computed(() => flow.stack[flow.stack.length - 2] || null)
    const top = computed(() => flow.stack[flow.stack.length - 1] || null)

    // El alto de la carcasa se transforma de un paso al otro; el borde superior queda fijo (D2) y, en la hoja,
    // la hoja no encoge mientras dura el recorrido (su borde superior no baja y vuelve a subir)
    async function morph(change) {
      const box = inset.value
      const h0 = box ? box.getBoundingClientRect().height : 0
      change()
      await nextTick()
      const el = dlg.value
      if (el && phone()) {
        maxSheet = Math.max(maxSheet, el.getBoundingClientRect().height)
        el.style.minBlockSize = Math.round(maxSheet) + 'px'
      }
      if (!box || !h0 || reduced()) return
      const h1 = inset.value.getBoundingClientRect().height
      if (Math.abs(h1 - h0) < 1) return
      inset.value.animate([{ blockSize: h0 + 'px' }, { blockSize: h1 + 'px' }], { duration: ms('--g-duration-slow'), easing: token('--g-ease-out') })
    }
    function pin() {
      const el = dlg.value
      if (!el || phone()) return
      el.classList.remove('is-pinned')
      const t = el.offsetTop
      el.style.setProperty('--_pin-top', t + 'px')
      el.classList.add('is-pinned')
    }
    async function enter() {
      entering.value = top.value ? top.value.id : 0
      await nextTick()
      const panel = stage.value?.querySelector('.xb-panel:not([hidden])')
      focusFirstIn(panel)
    }
    async function start(ev) {
      flow.push('detalle', ev && ev.currentTarget)
      log('push:detalle')
      await nextTick()
      dlg.value.showModal()
      placeLive()
      maxSheet = 0
      dlg.value.style.removeProperty('min-block-size')
      await enter()
      requestAnimationFrame(pin)
    }
    async function open(key, from) {
      dir.value = 'forward'
      await morph(() => { flow.push(key, from) })
      log('push:' + key)
      await enter()
    }
    async function leave(result) {
      if (flow.stack.length <= 1) return closeAll()
      dir.value = 'back'
      let gone = null
      await morph(() => { gone = flow.pop() })
      entering.value = top.value.id
      await nextTick()
      const panel = stage.value?.querySelector('.xb-panel:not([hidden])')
      const how = focusReturn(result && result.focus, gone.opener, panel)
      log('pop:' + gone.key + ':' + how)
      if (result && result.focus) land(result.focus)
      if (result && result.said) announce(result.said)
    }
    async function popTo(i) { while (flow.stack.length - 1 > i) await leave(null) }
    function closeAll() {
      const el = dlg.value
      el?.close()
      el?.classList.remove('is-pinned')
      log('close')
      const opener = flow.stack[0]?.opener
      setTimeout(() => { flow.closeAll(); if (el) el.style.removeProperty('min-block-size') }, ms('--g-duration-fast'))
      focusReturn(null, opener, null)
      placeLive()
    }
    const back = () => leave(null)
    function confirm(key) {
      const r = commit(key)
      if (!r.ok) { document.getElementById(r.focus)?.focus(); return }
      leave(r)
    }
    let downOut = false
    const onDown = (e) => { downOut = outside(dlg.value, e) }
    const onClick = (e) => {
      if (!downOut || !outside(dlg.value, e)) return
      downOut = false
      if (flow.stack.length === 1) closeAll()
      else log('backdrop-ignored')
    }
    const onKey = escFor(() => back())
    addEventListener('resize', () => requestAnimationFrame(pin))
    return { flow, dlg, inset, stage, entering, dir, last, parent, top, start, open, back, confirm, popTo, closeAll, onDown, onClick, onKey, title, waiting, LEVELS, svg }
  },
  template: `
  <div>
    <g-btn id="opener" @click="start">Abrir detalle de producto</g-btn>
    <dialog ref="dlg" class="g-dialog g-dialog--size-md g-dialog--density-default g-dialog--inset g-dialog--placement-center g-dialog--mobile-sheet xb"
      :data-dir="dir" :aria-labelledby="top ? 'xb-t-' + top.id : undefined" :aria-describedby="top ? 'xb-d-' + top.id : undefined"
      @keydown="onKey" @cancel.prevent @pointerdown="onDown" @click="onClick">
      <template v-if="top">
        <div class="g-dialog__header">
          <button v-if="parent" class="g-dialog__close xb-back" type="button" :aria-label="'Volver a ' + title(parent)" @click="back"><span v-html="svg('chevron-left')"></span></button>
          <div class="g-dialog__titles">
            <h2 class="g-dialog__title xb-title" :id="'xb-t-' + top.id" :key="top.id">{{ title(top) }}</h2>
            <p class="g-dialog__description" :id="'xb-d-' + top.id">{{ LEVELS[top.key].purpose }}</p>
          </div>
          <button class="g-dialog__close" type="button" aria-label="Cerrar" @click="closeAll"><span v-html="svg('x')"></span></button>
        </div>
        <nav v-if="flow.stack.length > 1" class="xb-trail" aria-label="Recorrido">
          <ol>
            <li v-for="(l, i) in flow.stack" :key="l.id" :class="{ 'is-current': i === last, 'is-parent': i === last - 1 }">
              <button v-if="i < last" type="button" class="xb-crumb" :id="'xb-crumb-' + i" @click="popTo(i)">
                <span class="xb-crumb__n" aria-hidden="true">{{ i + 1 }}</span>
                <span class="xb-crumb__t">{{ title(l) }}</span>
                <span class="sr">, {{ waiting(l) }}</span>
              </button>
              <span v-else class="xb-crumb is-current" aria-current="step">
                <span class="xb-crumb__n" aria-hidden="true">{{ i + 1 }}</span>
                <span class="xb-crumb__t">{{ title(l) }}</span>
              </span>
            </li>
          </ol>
        </nav>
        <div class="g-dialog__inset" ref="inset">
          <div class="g-dialog__body xb-stage" ref="stage">
            <section v-for="(l, i) in flow.stack" :key="l.id" class="xb-panel" :class="{ 'is-entering': entering === l.id }"
              role="group" :aria-labelledby="'xb-t-' + l.id" :hidden="i !== last" :inert="i !== last">
              <level-body :k="l.key" @open="open" />
            </section>
          </div>
          <div class="g-dialog__footer" v-if="top.key !== 'detalle'">
            <level-actions :k="top.key" :depth="flow.stack.length" @back="back" @confirm="confirm(top.key)" />
          </div>
        </div>
      </template>
    </dialog>
  </div>`
})

// ============================================================================================
// C · EN SU SITIO. Un nivel nuevo solo cuando cambia la tarea (Detalle → Ingreso, dos diálogos). Lo que falta
// (partida, producto, categoría) se crea donde se echa en falta: el campo se abre en un pliegue con su propio
// «Crear y elegir», sin tapar lo que se estaba llenando.
// ============================================================================================
const XcFold = defineComponent({
  name: 'XcFold',
  props: { k: String, depth: Number },
  emits: ['back', 'confirm'],
  setup(props, { emit }) {
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.isComposing || e.defaultPrevented) return
      e.preventDefault()
      if (e.repeat) { log('esc-repeat-ignored'); return }
      emit('back')
    }
    const intro = { partida: 'Para la partida 3 de este ingreso', producto: 'Se elegirá en Producto de la partida 3', categoria: 'Se elegirá en Categoría del producto nuevo' }
    return { onKey, title: (k) => LEVELS[k].title(), intro, PRIMARY }
  },
  template: `
  <div class="xc-fold" :data-level="k" :style="{ '--_d': depth }" role="group" :aria-labelledby="'xc-t-' + k" :aria-describedby="'xc-i-' + k" @keydown="onKey">
    <div class="xc-fold__in">
      <div class="xc-fold__head">
        <h3 class="xc-fold__title" :id="'xc-t-' + k">{{ title(k) }}</h3>
        <p class="xc-fold__intro" :id="'xc-i-' + k">{{ intro[k] }}</p>
      </div>
      <slot />
      <div class="xr-actions xc-fold__actions">
        <g-btn :id="'a-' + k + '-back'" size="sm" variant="ghost" color="neutral" @click="$emit('back')">Cancelar</g-btn>
        <g-btn :id="'a-' + k + '-ok'" size="sm" @click="$emit('confirm')">{{ PRIMARY[k] }}</g-btn>
      </div>
    </div>
  </div>`
})
const ConceptC = defineComponent({
  name: 'ConceptC',
  components: { LevelBody, LevelActions, XcFold },
  setup() {
    const flow = createFlow()
    const els = new Map()
    const reg = (key, el) => { if (el) els.set(key, el); else els.delete(key) }
    const DIALOGS = ['detalle', 'ingreso']
    window.__r02.flow = flow
    const has = (k) => flow.stack.some((l) => l.key === k && !l.leaving)
    const dialogs = computed(() => flow.stack.filter((l) => DIALOGS.includes(l.key)))
    const depthOf = (k) => flow.stack.findIndex((l) => l.key === k)
    async function open(key, from) {
      if (has(key)) return
      flow.push(key, from)
      log('push:' + key)
      await nextTick()
      if (DIALOGS.includes(key)) {
        const el = els.get(key)
        el.showModal()
        placeLive()
        focusFirstIn(el, '.g-dialog__close')
        // D2 (#301): el borde superior queda fijo; los pliegues crecen hacia abajo
        requestAnimationFrame(() => { if (phone()) return; el.classList.remove('is-pinned'); el.style.setProperty('--_pin-top', el.offsetTop + 'px'); el.classList.add('is-pinned') })
      } else {
        const fold = document.querySelector('.xc-fold[data-level="' + key + '"]')
        focusFirstIn(fold)
        if (!reduced()) fold?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        else fold?.scrollIntoView({ block: 'nearest' })
      }
    }
    // Bajar un nivel en C: si es un pliegue, se recoge en el campo; si es un diálogo, se cierra
    function leave(result, key) {
      const k = key || flow.top()?.key
      const i = flow.stack.findIndex((l) => l.key === k)
      if (i < 0) return
      // Recoger un pliegue recoge también los que lleva dentro
      const gone = flow.stack[i]
      const inner = flow.stack.slice(i + 1).map((l) => l.key)
      if (DIALOGS.includes(k)) { els.get(k)?.close(); placeLive() }
      flow.stack.splice(i)
      const parentRoot = flow.stack.length ? (els.get(flow.top().key) || document.querySelector('.xc-fold[data-level="' + flow.top().key + '"]')) : null
      nextTick(() => {
        const how = focusReturn(result && result.focus, gone.opener, parentRoot)
        log('pop:' + k + (inner.length ? '+' + inner.join('+') : '') + ':' + how)
        if (result && result.focus) land(result.focus)
        if (result && result.said) announce(result.said)
        if (!flow.stack.length) flow.closeAll()
      })
    }
    function confirm(key) {
      const r = commit(key)
      if (!r.ok) { document.getElementById(r.focus)?.focus(); return }
      leave(r, key)
    }
    let downOut = false
    const onDown = (e, k) => { downOut = outside(els.get(k), e) }
    const onClick = (e, k) => {
      if (!downOut || !outside(els.get(k), e)) return
      downOut = false
      if (flow.stack.length === 1) leave(null)
      else log('backdrop-ignored')
    }
    // Esc en un diálogo de C: si hay pliegues abiertos, los atiende el pliegue (lo cancela antes); aquí, bajar un nivel
    const onKey = (k) => escFor(() => leave(null, flow.top()?.key))
    return { flow, reg, dialogs, has, depthOf, open, leave, confirm, onDown, onClick, onKey, title, LEVELS, svg }
  },
  template: `
  <div>
    <g-btn id="opener" @click="open('detalle', $event.currentTarget)">Abrir detalle de producto</g-btn>
    <dialog v-for="l in dialogs" :key="l.id" :ref="(el) => reg(l.key, el)"
      class="g-dialog g-dialog--inset g-dialog--placement-center g-dialog--mobile-sheet xc-card"
      :class="[l.key === 'ingreso' ? 'g-dialog--size-lg' : 'g-dialog--size-md', { 'is-base': l.key === 'detalle', 'is-below': l.key === 'detalle' && has('ingreso') }]"
      :data-level="l.key" :aria-labelledby="'xc-dt-' + l.key"
      @keydown="onKey(l.key)($event)" @cancel.prevent @pointerdown="onDown($event, l.key)" @click="onClick($event, l.key)">
      <div class="g-dialog__header">
        <button v-if="l.key === 'ingreso'" class="g-dialog__close xa-back" type="button" aria-label="Volver a Ácido clorhídrico 37 %" @click="leave(null, 'ingreso')"><span v-html="svg('chevron-left')"></span></button>
        <div class="g-dialog__titles">
          <h2 class="g-dialog__title" :id="'xc-dt-' + l.key">{{ title(l) }}</h2>
          <p class="g-dialog__description">{{ LEVELS[l.key].purpose }}</p>
        </div>
        <button v-if="l.key === 'detalle'" class="g-dialog__close" type="button" aria-label="Cerrar" @click="leave(null, 'detalle')"><span v-html="svg('x')"></span></button>
      </div>
      <div class="g-dialog__inset">
        <div class="g-dialog__body">
          <level-body :k="l.key" @open="open">
            <template #after-p3>
              <xc-fold v-if="has('partida')" k="partida" :depth="1" @back="leave(null, 'partida')" @confirm="confirm('partida')">
                <level-body k="partida" @open="open">
                  <template #after-partida-producto>
                    <xc-fold v-if="has('producto')" k="producto" :depth="2" @back="leave(null, 'producto')" @confirm="confirm('producto')">
                      <level-body k="producto" @open="open">
                        <template #after-producto-categoria>
                          <xc-fold v-if="has('categoria')" k="categoria" :depth="3" @back="leave(null, 'categoria')" @confirm="confirm('categoria')">
                            <level-body k="categoria" @open="open" />
                          </xc-fold>
                        </template>
                      </level-body>
                    </xc-fold>
                  </template>
                </level-body>
              </xc-fold>
            </template>
          </level-body>
        </div>
        <div class="g-dialog__footer" v-if="l.key === 'ingreso'"><level-actions k="ingreso" :depth="2" @back="leave(null, 'ingreso')" @confirm="confirm('ingreso')" /></div>
      </div>
    </dialog>
  </div>`
})

// ============================================================================================
const params = new URLSearchParams(location.search)
const C0 = ['hoy', 'A', 'B', 'C'].includes(params.get('c')) ? params.get('c') : 'A'
if (params.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
const toaster = Grana.createToaster({ position: 'top-center', labels: { region: 'Notificaciones ({hotkey})', close: 'Cerrar notificación', types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error', loading: 'En curso' }, repeated: '{count} veces', queued: '{count} más en espera', actionHint: 'Pulsa {hotkey} para {action}.' } })
window.__toaster = toaster
const NAMES = { hoy: 'Hoy (GDialog real)', A: 'A · La baraja', B: 'B · El hilo', C: 'C · En su sitio' }
const app = createApp({
  components: { Today, ConceptA, ConceptB, ConceptC },
  setup() {
    const c = ref(C0)
    watch(c, (v) => { const u = new URL(location.href); u.searchParams.set('c', v); history.replaceState(null, '', u) })
    return { c, NAMES }
  },
  template: `
  <header class="sh-bar">
    <span class="sh-brand">GDialog · r02 · niveles anidados</span>
    <fieldset class="sh-pick"><legend class="sr">Concepto</legend>
      <label v-for="(n, k) in NAMES" :key="k"><input type="radio" name="c" :value="k" v-model="c" :id="'pick-' + k">{{ k === 'hoy' ? 'Hoy' : k }}<span class="sr">: {{ n }}</span></label>
    </fieldset>
  </header>
  <main>
    <h1>{{ NAMES[c] }}</h1>
    <p class="lead" v-if="c === 'hoy'">El componente real, anidado cinco veces como lo haría hoy una aplicación: cada nivel es un GDialog dentro del anterior y cada formulario dentro del de abajo. Sirve para medir lo que falla.</p>
    <p class="lead" v-else-if="c === 'A'">Cada nivel es un diálogo modal de verdad. Los de abajo no desaparecen: quedan como lomos de una baraja con su título y lo que esperan. Un solo fondo. Pulsar un lomo vuelve a ese nivel.</p>
    <p class="lead" v-else-if="c === 'B'">Un solo diálogo con historial de pasos. El hilo de arriba dice de dónde vienes y qué espera cada nivel; al crear algo, el paso se recoge y el valor aterriza en el campo que lo pidió.</p>
    <p class="lead" v-else>Un nivel nuevo solo cuando cambia la tarea. Lo que falta se crea donde se echa en falta: el campo se abre en un pliegue con su propio «Crear y elegir», sin tapar lo que se estaba llenando.</p>
    <section class="card">
      <h2>Flujo real · inventarios</h2>
      <p class="muted">Detalle de producto → Ingreso desde orden de compra → Partida 3 → Producto nuevo («Tris base» no existe) → Categoría nueva.</p>
      <today v-if="c === 'hoy'" />
      <concept-a v-else-if="c === 'A'" />
      <concept-b v-else-if="c === 'B'" />
      <concept-c v-else />
    </section>
  </main>
  <g-toaster></g-toaster>`
})
app.use(Grana)
app.use(toaster)
app.mount('#app')
