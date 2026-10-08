<script>
// GTagGroup · un conjunto de etiquetas dirigido por datos (dueño: bruno). Estilo: GTagGroup.css (coco).
// Contrato: design/contracts/tag.md · DECISIONS.md #460 a #473 (#463 API, #464 semántica, #465 teclado y foco,
// #466 A «Huella», #467 B «Racimo», #468 textos, #469 color, #470 pista visual) · api.md «Enlaces y navigate» (#505).
// Estructura: design/lab/chip/r01/ (kiwi).
// `items` con v-model:items: toda acción del usuario emite un arreglo NUEVO (los elementos que no cambian conservan su
// referencia) y, después, el evento específico. La huella es estado interno (no un item): el modelo cambia en el acto;
// la huella guarda el ancho medido ANTES del cambio (--_ghost-w) y se recoge cuando ni el foco ni un puntero con hover
// están en el grupo. El foco se mueve por programa también tras un clic (WebKit no enfoca un botón al pulsarlo).
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, provide, reactive, ref, shallowRef, useId, watch } from 'vue'
import GTag from '../GTag/GTag.vue'
import GBtn from '../GBtn/GBtn.vue'
import GAvatar from '../GAvatar/GAvatar.vue'
import GLibIcon from '../GIcon/GLibIcon.js' // undo-2 de «Deshacer» (lista de la librería)
import GAppIcon from '../GIcon/GIcon.vue' // item.icon: nombre de la aplicación (registro → librería, #202)
import { useVisualTips } from '../../utils/visualTip.js'
import { createLiveWriter } from '../../utils/liveRegion.js'
import { colorInfo, colorWarning, createCutWatcher, hasContent, isDev, present, say, tagItemKey, validCategories } from '../GTag/tagShared.js'
import { categoryOf } from '../../utils/categoryHash.js'

const LAYOUTS = ['flow', 'facets']
const SIZES = ['sm', 'md']
const LIVE = { delay: 50, clear: 5000 }

const normText = (s) => String(s).normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase()
const hasId = (it) => it && it.id !== undefined && it.id !== null && !(typeof it.id === 'string' && it.id.trim() === '')
const isToggleItem = (it) => (it.pressed === true || it.pressed === false) && !present(it.href)
const facetOf = (it) => present(it.facet)

// Proveedor por etiqueta: entrega a SU GTag el contexto interno (huella, is-plain, nombres, quitar y deshacer)
const TagItemProvider = defineComponent({
  name: 'GTagItemProvider',
  props: { ctx: { type: Object, required: true } },
  setup(p, { slots }) {
    provide(tagItemKey, () => p.ctx)
    return () => (slots.default ? slots.default() : null)
  }
})

export default defineComponent({
  name: 'GTagGroup',
  props: {
    items: { type: Array, required: true },
    label: { type: String, default: undefined },
    labelledby: { type: String, default: undefined },
    layout: { type: String, default: 'flow', validator: (v) => LAYOUTS.includes(v) },
    size: { type: String, default: 'md', validator: (v) => SIZES.includes(v) },
    categories: { type: Number, default: 0 },
    limit: { type: Number, default: undefined },
    clearable: { type: Boolean, default: false },
    // Selector CSS, elemento (o instancia con $el) o función que lo devuelve: sin tipo (un elemento no pasa `Object`)
    emptyFocus: { default: undefined },
    disabled: { type: Boolean, default: false },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['update:items', 'remove', 'restore', 'clear', 'toggle', 'navigate', 'settle'],
  setup(props, { emit, slots }) {
    const uid = useId()
    const listId = `g-tag-group-${uid}-list`
    const emptyId = `g-tag-group-${uid}-empty`
    const root = ref(null)

    // Avisos: una vez por instancia, causa y valor
    const warned = new Set()
    const warn = (key, msg) => {
      if (!isDev() || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana GTagGroup] ${msg}`)
    }
    const L = (key, vars) => {
      const t = say(props.labels, key, vars)
      if (t === undefined) warn(`labels:${key}`, `falta labels.${key}: sin texto en ese sitio (los textos los pone la aplicación, #226).`)
      return t
    }
    // Forma con faceta (removeIn, undoIn, removedIn) con caída a la base y aviso G5
    const LF = (key, vars) => {
      if (vars.facet === undefined) return L(key, vars)
      const t = say(props.labels, `${key}In`, vars)
      if (t !== undefined) return t
      warn(`labels:${key}In`, `falta labels.${key}In: en un racimo se usa la forma sin faceta (labels.${key}), que puede no ser única entre facetas.`)
      return L(key, vars)
    }

    // ---------- Modelo: con o sin v-model:items ----------
    const model = shallowRef(props.items)
    watch(() => props.items, (v) => { model.value = v })
    const commit = (next) => {
      model.value = next
      emit('update:items', next)
    }

    // ---------- Estado de la huella y de «Quitar todas» ----------
    // Huellas: { id, item, index, width, facet, dPrev, dNext (display), mPrev, mNext (modelo), seq }
    const ghosts = shallowRef([])
    const settling = reactive(new Set())
    const cleared = shallowRef(null) // { entries: [{ item, index }], extra: [item] }
    let seq = 0
    let hovering = false
    let pendingFocus = false
    const expanded = ref(false)
    const listTabindex = ref(null)

    const live = reactive({ polite: '', assertive: '' })
    const writer = createLiveWriter(live, LIVE)
    // El último gesto manda: quitar y deshacer seguidos (doble clic en la tapa) no se leen juntos
    const announce = (t) => {
      if (!t) return
      writer.dispose()
      writer.announce(t, 'polite')
    }

    // ---------- Elementos válidos (G2, G3) ----------
    const valid = computed(() => {
      const list = Array.isArray(model.value) ? model.value : []
      const seen = new Set()
      const out = []
      list.forEach((it, index) => {
        if (!it || typeof it !== 'object') return
        if (!hasId(it)) { warn('id-missing', `un item sin id se omite: la huella, el foco y el deshacer se apoyan en él (${JSON.stringify(it.label)}).`); return }
        if (seen.has(it.id)) { warn(`id-dup:${String(it.id)}`, `id repetido «${String(it.id)}»: se omite el repetido (cada id debe ser único en el grupo).`); return }
        if (!present(it.label)) { warn(`label:${String(it.id)}`, `el item «${String(it.id)}» no tiene label: se omite.`); return }
        seen.add(it.id)
        out.push({ id: it.id, item: it, index })
      })
      return out
    })

    // ---------- Lo que se pinta: vivas en el orden del modelo + huellas en su sitio ----------
    const display = computed(() => {
      const liveIds = new Set(valid.value.map((e) => e.id))
      const out = valid.value.map((e) => ({ ...e, ghost: null }))
      // Un id que vuelve mientras su huella está a la vista sustituye a la huella
      for (const g of ghosts.value) {
        if (liveIds.has(g.id)) continue
        const at = (id) => out.findIndex((e) => e.id === id)
        let pos = -1
        for (const id of g.dNext) { const i = at(id); if (i >= 0) { pos = i; break } }
        if (pos < 0) for (const id of g.dPrev) { const i = at(id); if (i >= 0) { pos = i + 1; break } }
        if (pos < 0) pos = out.length
        out.splice(pos, 0, { id: g.id, item: g.item, index: g.index, ghost: g })
      }
      return out
    })

    const facets = computed(() => props.layout === 'facets')
    const anyFacet = computed(() => display.value.some((e) => facetOf(e.item)))
    const effLimit = computed(() => {
      const n = props.limit
      if (n === undefined || n === null) return null
      if (facets.value) return null
      return Number.isInteger(n) && n >= 1 ? n : null
    })
    const categories = computed(() => (validCategories(props.categories) ? props.categories : 0))
    const allToggles = (entries) => entries.length > 0 && entries.every((e) => isToggleItem(e.item))

    // ---------- Nombres de «Quitar» y «Deshacer» (con faceta solo en un racimo) ----------
    const facetVars = (it) => {
      const f = facets.value ? facetOf(it) : undefined
      return { label: present(it.label), facet: f }
    }

    // ---------- Quitar → huella ----------
    const liEls = new Map()
    const liRef = (id) => (el) => { if (el) liEls.set(id, el); else if (liEls.get(id) && !liEls.get(id).isConnected) liEls.delete(id) }
    const liOf = (id) => {
      const el = liEls.get(id)
      if (el && el.isConnected) return el
      if (!root.value) return null
      return [...root.value.querySelectorAll('[data-id]')].find((x) => x.getAttribute('data-id') === String(id)) || null
    }
    const focusIn = (id, sel) => {
      const li = liOf(id)
      const el = li && li.querySelector(sel)
      if (el && !el.disabled) { el.focus(); return document.activeElement === el }
      return false
    }
    const afterRender = (fn) => {
      pendingFocus = true
      nextTick(() => { pendingFocus = false; fn() })
    }

    function removeItem(entry, source) {
      if (props.disabled || entry.item.disabled || !entry.item.removable) return
      const cur = Array.isArray(model.value) ? model.value : []
      const idx = cur.indexOf(entry.item)
      if (idx < 0) return
      // Ancho medido ANTES del cambio (border-box): la huella mide eso (Δ0 por construcción, #466)
      const li = liOf(entry.id)
      const tag = li && li.querySelector('.g-tag')
      const width = tag ? tag.getBoundingClientRect().width : 0
      const dIds = display.value.map((e) => e.id)
      const di = dIds.indexOf(entry.id)
      const mIds = valid.value.map((e) => e.id)
      const mi = mIds.indexOf(entry.id)
      const rec = {
        id: entry.id,
        item: entry.item,
        index: idx,
        width,
        dPrev: dIds.slice(0, di).reverse(),
        dNext: dIds.slice(di + 1),
        mPrev: mIds.slice(0, mi).reverse(),
        mNext: mIds.slice(mi + 1),
        seq: ++seq
      }
      ghosts.value = [...ghosts.value.filter((g) => g.id !== entry.id), rec]
      const next = cur.filter((_, i) => i !== idx)
      commit(next)
      emit('remove', { item: entry.item, index: idx, source })
      announce(LF('removed', facetVars(entry.item)))
      afterRender(() => { focusIn(entry.id, '.g-tag__undo') })
    }

    function undoGhost(id) {
      const rec = ghosts.value.find((g) => g.id === id)
      if (!rec || props.disabled) return
      ghosts.value = ghosts.value.filter((g) => g.id !== id)
      settling.delete(id)
      const cur = Array.isArray(model.value) ? model.value.slice() : []
      // Delante del primer elemento que le seguía al quitarlo y que aún existe; si no, detrás del anterior más cercano; si no, al final
      const at = (gid) => cur.findIndex((x) => x && x.id === gid)
      let pos = -1
      for (const gid of rec.mNext) { const i = at(gid); if (i >= 0) { pos = i; break } }
      if (pos < 0) for (const gid of rec.mPrev) { const i = at(gid); if (i >= 0) { pos = i + 1; break } }
      if (pos < 0) pos = cur.length
      cur.splice(pos, 0, rec.item)
      commit(cur)
      emit('restore', { items: [rec.item], source: 'undo' })
      announce(L('restored', { label: present(rec.item.label) }))
      afterRender(() => { focusIn(id, '.g-tag__remove') })
    }

    // ---------- Recoger las huellas (todas a la vez) cuando nadie apunta ----------
    const reduced = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let settleTimer = 0
    let settleAbort = null
    function finishSettle() {
      clearTimeout(settleTimer)
      if (settleAbort) settleAbort.abort()
      settleAbort = null
      const gone = ghosts.value.filter((g) => settling.has(g.id))
      if (!gone.length) return
      ghosts.value = ghosts.value.filter((g) => !settling.has(g.id))
      for (const g of gone) settling.delete(g.id)
      emit('settle', { items: gone.map((g) => g.item) })
    }
    const durationMs = (el) => {
      const cs = getComputedStyle(el)
      const list = (s) => String(s || '').split(',').map((x) => { const n = parseFloat(x); return Number.isNaN(n) ? 0 : /ms\s*$/.test(x) ? n : n * 1000 })
      const d = list(cs.transitionDuration)
      const dl = list(cs.transitionDelay)
      return Math.max(0, ...d.map((v, i) => v + (dl[i % dl.length] || 0)))
    }
    function maybeSettle() {
      if (!ghosts.value.length) return
      if (!root.value || !root.value.isConnected) return
      if (root.value.contains(document.activeElement)) return
      if (hovering) return
      const recs = ghosts.value.filter((g) => !settling.has(g.id))
      if (!recs.length) return
      for (const g of recs) settling.add(g.id)
      if (reduced()) { finishSettle(); return }
      nextTick(() => {
        // Sale del DOM en el transitionend de inline-size de cada huella (con un respaldo por si no hay transición)
        const tags = recs.map((g) => { const li = liOf(g.id); return li && li.querySelector('.g-tag') }).filter(Boolean)
        if (!tags.length) { finishSettle(); return }
        let left = tags.length
        if (settleAbort) settleAbort.abort()
        settleAbort = new AbortController()
        for (const tag of tags) {
          tag.addEventListener('transitionend', (e) => {
            if (e.target !== tag || e.propertyName !== 'inline-size') return
            left -= 1
            if (left <= 0) finishSettle()
          }, { signal: settleAbort.signal })
        }
        clearTimeout(settleTimer)
        settleTimer = setTimeout(finishSettle, Math.max(...tags.map(durationMs)) + 100)
      })
    }
    function expireCleared() {
      const c = cleared.value
      if (!c) return
      // Misma regla que las huellas (#466.6): ni foco ni un puntero con hover en el grupo.
      // En WebKit el mousedown sobre «Deshacer» saca el foco antes del clic; el hover lo retiene.
      if (root.value && root.value.isConnected && root.value.contains(document.activeElement)) return
      if (hovering) return
      cleared.value = null
      emit('settle', { items: [...c.entries.map((x) => x.item), ...c.extra] })
    }

    // ---------- Quitar todas / Deshacer todas ----------
    const clearables = computed(() => valid.value.filter((e) => e.item.removable && !e.item.disabled))
    function clearAll() {
      if (props.disabled) return
      const cur = Array.isArray(model.value) ? model.value : []
      const ids = new Set(clearables.value.map((e) => e.item))
      const entries = []
      const next = []
      cur.forEach((it, index) => { if (ids.has(it)) entries.push({ item: it, index }); else next.push(it) })
      if (!entries.length) return
      // Las huellas que hubiera se recogen al instante (sin animar) y entran en el settle de esta acción
      const extra = ghosts.value.map((g) => g.item)
      clearTimeout(settleTimer)
      if (settleAbort) settleAbort.abort()
      settling.clear()
      ghosts.value = []
      cleared.value = { entries, extra }
      commit(next)
      emit('clear', { items: entries.map((x) => x.item) })
      announce(L('cleared', { count: entries.length }))
      afterRender(() => { focusTool('.g-tag-group__clear') })
    }
    function undoAll() {
      const c = cleared.value
      if (!c || props.disabled) return
      cleared.value = null
      const cur = Array.isArray(model.value) ? model.value.slice() : []
      for (const x of c.entries) cur.splice(Math.min(x.index, cur.length), 0, x.item)
      commit(cur)
      emit('restore', { items: c.entries.map((x) => x.item), source: 'undo-all' })
      if (c.extra.length) emit('settle', { items: c.extra })
      announce(L('restoredAll', { count: c.entries.length }))
      afterRender(() => { focusTool('.g-tag-group__clear') })
    }
    const focusTool = (sel) => {
      const el = root.value && root.value.querySelector(`${sel}`)
      if (el && !el.disabled) el.focus()
    }

    // ---------- Alternar y navegar (eventos públicos de la GTag) ----------
    function toggleItem(entry, pressed) {
      if (props.disabled || entry.item.disabled) return
      const cur = Array.isArray(model.value) ? model.value : []
      const idx = cur.indexOf(entry.item)
      if (idx < 0) return
      const nu = { ...entry.item, pressed }
      const next = cur.slice()
      next[idx] = nu
      commit(next)
      emit('toggle', { item: nu, pressed })
    }

    // ---------- Foco cuando el control enfocado desaparece por otra causa (#465) ----------
    let snap = null
    let renderedOrder = [] // orden del último render (onBeforeUpdate ya ve el display nuevo)
    const partOf = (el) => {
      if (el.classList.contains('g-tag__remove') || el.classList.contains('g-tag__undo')) return 'cap'
      if (el.classList.contains('g-tag__body')) return 'body'
      return 'tool'
    }
    onBeforeUpdate(() => {
      snap = null
      const a = typeof document !== 'undefined' ? document.activeElement : null
      if (!root.value || !a || a === root.value || !root.value.contains(a)) return
      const li = a.closest('[data-id]')
      const order = renderedOrder
      const hit = li ? order.find((e) => String(e.id) === li.getAttribute('data-id')) : undefined
      snap = { el: a, id: hit ? hit.id : undefined, part: partOf(a), order }
    })
    const CAP = '.g-tag__remove:not(:disabled), .g-tag__undo:not(:disabled)'
    const BODY = 'a.g-tag__body[href], button.g-tag__body:not(:disabled)'
    function resolveEmptyFocus(v) {
      let t = v
      if (typeof t === 'function') t = t()
      if (typeof t === 'string') { try { t = document.querySelector(t) } catch { t = null } }
      if (t && t.$el) t = t.$el
      return t && typeof t.focus === 'function' ? t : null
    }
    function rescueFocus(s) {
      const present_ = new Set(display.value.map((e) => e.id))
      const order = s.order
      const at = s.id === undefined ? order.length : order.findIndex((e) => e.id === s.id)
      const i = at < 0 ? order.length : at
      const after = order.slice(i + 1)
      const before = order.slice(0, Math.min(i, order.length)).reverse()
      const lostFacet = s.id !== undefined && order[i] ? order[i].facet : undefined
      const cands = []
      if (lostFacet !== undefined) {
        cands.push(...after.filter((e) => e.facet === lostFacet), ...before.filter((e) => e.facet === lostFacet))
      }
      cands.push(...after, ...before)
      // También cuentan las etiquetas que aparecieron ahora (después de todas las conocidas)
      for (const e of display.value) if (!order.some((o) => o.id === e.id)) cands.push({ id: e.id })
      const want = s.part === 'body' ? [BODY, CAP] : [CAP, BODY]
      for (const c of cands) {
        if (!present_.has(c.id)) continue
        for (const sel of want) if (focusIn(c.id, sel)) return
      }
      if (props.emptyFocus !== undefined && props.emptyFocus !== null) {
        const t = resolveEmptyFocus(props.emptyFocus)
        if (t) { t.focus(); if (document.activeElement === t) return }
        warn('empty-focus', 'emptyFocus no se encuentra (o no se puede enfocar): el foco va al contenedor del grupo.')
      }
      listTabindex.value = -1
      nextTick(() => { const l = root.value && root.value.querySelector('.g-tag-group__list'); if (l) l.focus() })
    }
    onUpdated(() => {
      const s = snap
      snap = null
      if (cut) cut.refresh(root.value)
      if (!s || pendingFocus) return
      if (s.el.isConnected && root.value && root.value.contains(s.el) && !s.el.disabled) return
      const a = document.activeElement
      if (a && a !== document.body && a !== s.el && a.isConnected) return // la persona ya está en otro sitio
      rescueFocus(s)
    })

    // ---------- Escuchas: foco, puntero y toque fuera ----------
    const onFocusout = (e) => {
      if (root.value && e.relatedTarget && root.value.contains(e.relatedTarget)) return
      setTimeout(() => {
        if (!root.value || root.value.contains(document.activeElement)) return
        listTabindex.value = null
        maybeSettle()
        expireCleared()
      }, 0)
    }
    const onPointerenter = (e) => { if (e.pointerType !== 'touch') hovering = true }
    const onPointermove = (e) => { if (e.pointerType !== 'touch') hovering = true }
    const onPointerleave = () => {
      hovering = false
      maybeSettle()
      // Si el foco está dentro, no caduca (expireCleared lo comprueba); sale en el focusout
      expireCleared()
    }
    let docAbort = null
    onMounted(() => {
      docAbort = new AbortController()
      document.addEventListener('pointerdown', (e) => {
        if (!root.value || root.value.contains(e.target)) return
        hovering = false
        setTimeout(() => { maybeSettle(); expireCleared() }, 0)
      }, { capture: true, signal: docAbort.signal })
      if (cut) cut.refresh(root.value)
      if (isDev() && slots.default && hasContent(slots.default())) warn('slot', 'no tiene slot por defecto: los hijos no se pintan. Pasa las etiquetas como datos en items.')
    })
    onBeforeUnmount(() => {
      if (docAbort) docAbort.abort()
      clearTimeout(settleTimer)
      if (settleAbort) settleAbort.abort()
      writer.dispose()
      if (cut) cut.dispose()
      // Desmontar con huellas o con «Deshacer todas» pendientes emite settle (#466.10)
      const pend = [...ghosts.value.map((g) => g.item), ...(cleared.value ? [...cleared.value.entries.map((x) => x.item), ...cleared.value.extra] : [])]
      if (pend.length) emit('settle', { items: pend })
    })

    // ---------- Pista visual (#470): un nodo por control, al final de la raíz del grupo ----------
    const cut = createCutWatcher()
    const tipKey = (kind, id) => `${kind}:${typeof id}:${String(id)}`
    const tipMap = new Map() // clave → { id, kind }
    const tips = useVisualTips({
      find(key) {
        const t = tipMap.get(key)
        if (!t) return null
        const li = liOf(t.id)
        if (!li) return null
        const el = t.kind === 'b' ? li.querySelector('a.g-tag__body[href], button.g-tag__body') : t.kind === 'r' ? li.querySelector('.g-tag__remove') : li.querySelector('.g-tag__undo')
        return el ? { ctrl: el } : null
      },
      disabled: (key, ctrl) => {
        const t = tipMap.get(key)
        return Boolean(t && t.kind === 'b' && !cut.cut(ctrl.querySelector('.g-tag__text')))
      }
    })

    // ---------- Render ----------
    const ctxCache = new Map()
    return () => {
      const vis = display.value
      // ---------- Avisos ----------
      if (isDev()) {
        if (!present(props.label) && !present(props.labelledby)) warn('name', 'necesita label o labelledby: la lista se pinta sin nombre.')
        if (props.limit !== undefined && props.limit !== null && facets.value) warn('limit-facets', 'limit no se combina con layout="facets" en v1: se ignora.')
        if (facets.value && vis.length && !anyFacet.value) warn('facets-none', 'layout="facets" sin ningún item.facet: funciona como flow con lomo neutro.')
        if (!validCategories(props.categories)) warn(`categories:${String(props.categories)}`, `categories=${JSON.stringify(props.categories)} no es un entero de 0 a 12: se trata como 0.`)
        const names = new Map()
        for (const e of vis) {
          const it = e.item
          if (present(it.href) && (it.pressed === true || it.pressed === false)) warn(`href-pressed:${String(e.id)}`, `el item «${String(e.id)}» tiene href y pressed: se ignora pressed (es un enlace).`)
          const ci = colorInfo(it.color)
          if (ci.kind === 'invalid') warn(`color:${String(ci.value)}`, colorWarning(ci.value))
          const ctl = it.removable || present(it.href) || isToggleItem(it)
          if (ctl && !e.ghost) {
            const k = `${facets.value ? facetOf(it) ?? '' : ''}\u0000${normText(it.label)}`
            if (names.has(k)) warn(`dup-name:${k}`, `dos etiquetas con control se llaman «${present(it.label)}»${facets.value && facetOf(it) ? ` en la faceta «${facetOf(it)}»` : ''}: los nombres de «Quitar» no son únicos. Usa facet o textos distintos.`)
            names.set(k, true)
          }
        }
      }

      renderedOrder = vis.map((e) => ({ id: e.id, facet: facets.value ? facetOf(e.item) : undefined }))
      const lim = effLimit.value
      const md = props.size === 'md'
      const btnSize = md ? 'sm' : 'xs'
      tipMap.clear()
      const tipNodes = []

      // ---------- Una etiqueta (envuelta en su proveedor interno) ----------
      const tagOf = (e, plain) => {
        const it = e.item
        const vars = facetVars(it)
        const ghost = Boolean(e.ghost)
        const removable = Boolean(it.removable)
        // Contexto interno estable por id: solo cambian sus campos primitivos (la GTag se vuelve a pintar solo si cambian)
        let c = ctxCache.get(e.id)
        if (!c) {
          const id = e.id
          c = reactive({
            remove: (source) => { const cur = display.value.find((x) => x.id === id && !x.ghost); if (cur) removeItem(cur, source) },
            undo: () => undoGhost(id)
          })
          ctxCache.set(id, c)
        }
        c.ghost = ghost
        c.ghostW = ghost ? e.ghost.width : 0
        c.plain = plain
        c.removeName = removable && !ghost ? LF('remove', vars) : undefined
        c.undoName = ghost ? LF('undo', vars) : undefined
        const toggle = isToggleItem(it)
        const href = present(it.href)
        const leadSlot = slots.lead
          ? () => slots.lead({ item: it })
          : it.avatar
            ? () => {
              const own = typeof it.avatar === 'object' && it.avatar ? it.avatar : {}
              // #513: sin color ni categories propios, el avatar hereda las categories del grupo
              const inherit = own.color === undefined && own.categories === undefined ? { categories: categories.value } : {}
              return h(GAvatar, { ...inherit, ...own, name: present(own.name) ?? present(it.label), size: 'xs', label: undefined })
            }
            : present(it.icon) && typeof it.icon === 'string' ? () => h(GAppIcon, { name: it.icon }) : undefined
        const tagSlots = {}
        if (leadSlot) tagSlots.lead = leadSlot
        if (slots.label) tagSlots.default = () => slots.label({ item: it, index: e.index })
        const disabled = props.disabled || Boolean(it.disabled)
        // Nodos de la pista de esta etiqueta
        if (ghost) {
          const k = tipKey('u', e.id); tipMap.set(k, { id: e.id, kind: 'u' }); tipNodes.push(tips.node(k, c.undoName || ''))
        } else {
          if ((href && !disabled) || (toggle && !href)) { const k = tipKey('b', e.id); tipMap.set(k, { id: e.id, kind: 'b' }); tipNodes.push(tips.node(k, present(it.label))) }
          if (removable) { const k = tipKey('r', e.id); tipMap.set(k, { id: e.id, kind: 'r' }); tipNodes.push(tips.node(k, c.removeName || '')) }
        }
        // Clave del color en cualquier grupo: colorKey ?? facet ?? label (tag.md §«Color», #469)
        const colorKey = present(it.colorKey) ?? facetOf(it)
        const ci = colorInfo(it.color)
        return h(TagItemProvider, { key: `p:${typeof e.id}:${String(e.id)}`, ctx: c }, () => [h(GTag, {
          label: present(it.label),
          href,
          pressed: href ? null : toggle ? it.pressed : null,
          removable,
          disabled,
          size: props.size,
          color: ci.kind === 'invalid' ? undefined : it.color,
          categories: categories.value,
          colorKey,
          'onUpdate:pressed': (v) => toggleItem(e, v),
          onNavigate: (p) => emit('navigate', { event: p.event, href: p.href, item: it })
        }, tagSlots)])
      }
      const itemAttrs = (e, cls, hidden) => ({
        key: `i:${typeof e.id}:${String(e.id)}`,
        ref: liRef(e.id),
        class: [cls, { 'is-settling': settling.has(e.id) }],
        'data-id': String(e.id),
        hidden: hidden || undefined
      })

      // ---------- Contenedor ----------
      const empty = vis.length === 0
      const emptyText = empty && !cleared.value ? L('empty') : undefined
      const nameAttrs = present(props.labelledby) ? { 'aria-labelledby': props.labelledby } : { 'aria-label': present(props.label) }
      const containerCommon = {
        id: listId,
        class: 'g-tag-group__list',
        ...nameAttrs,
        tabindex: listTabindex.value === null ? undefined : String(listTabindex.value),
        'aria-describedby': emptyText ? emptyId : undefined,
        onBlur: () => { listTabindex.value = null }
      }
      let container
      if (facets.value) {
        // B «Racimo» (#467): racimos por faceta en orden de primera aparición; las sueltas, en su lugar
        const blocks = []
        const byFacet = new Map()
        for (const e of vis) {
          const f = facetOf(e.item)
          if (f === undefined) { blocks.push({ loose: e }); continue }
          let b = byFacet.get(f)
          if (!b) { b = { facet: f, entries: [] }; byFacet.set(f, b); blocks.push(b) }
          b.entries.push(e)
        }
        let n = 0
        container = h('ul', { ...containerCommon, role: 'list' }, blocks.map((b) => {
          if (b.loose) return h('li', itemAttrs(b.loose, 'g-tag-group__item', false), [tagOf(b.loose, false)])
          const fid = `g-tag-group-${uid}-f${n++}`
          const first = b.entries[0].item
          const fc = colorInfo(first.color)
          const k = fc.kind === 'cat' ? fc.k : fc.kind === 'neutral' || !categories.value ? null : categoryOf(present(first.colorKey) ?? b.facet ?? present(first.label), categories.value)
          const toggles = allToggles(b.entries)
          const values = b.entries.map((e) => h(toggles ? 'span' : 'li', itemAttrs(e, 'g-tag-group__value', false), [tagOf(e, true)]))
          return h('li', { key: `f:${b.facet}`, class: 'g-tag-group__facet', 'data-cat': k === null ? undefined : String(k) }, [
            h('span', { class: 'g-tag-group__facet-name', id: fid, dir: 'auto' }, b.facet),
            toggles
              ? h('span', { class: 'g-tag-group__values', role: 'group', 'aria-labelledby': fid }, values)
              : h('ul', { class: 'g-tag-group__values', role: 'list', 'aria-labelledby': fid }, values)
          ])
        }))
      } else {
        const toggles = allToggles(vis)
        const children = vis.map((e, i) => h(toggles ? 'span' : 'li', itemAttrs(e, 'g-tag-group__item', lim !== null && !expanded.value && i >= lim), [tagOf(e, false)]))
        container = toggles ? h('div', { ...containerCommon, role: 'group' }, children) : h('ul', { ...containerCommon, role: 'list' }, children)
      }

      // ---------- Herramientas: «Ver N más» y «Quitar todas» / «Deshacer» ----------
      const tools = []
      if (lim !== null) {
        const hiddenLive = expanded.value ? 0 : vis.slice(lim).filter((e) => !e.ghost).length
        const show = expanded.value ? vis.length > lim : hiddenLive > 0
        if (show) {
          tools.push(h(GBtn, {
            key: 'more',
            variant: 'link',
            color: 'accent',
            size: btnSize,
            class: 'g-tag-group__more',
            // #512: la divulgación sigue activa con disabled en el grupo
            'aria-expanded': expanded.value ? 'true' : 'false',
            'aria-controls': listId,
            onClick: () => { expanded.value = !expanded.value; afterRender(() => focusTool('.g-tag-group__more')) }
          }, () => (expanded.value ? L('less') : L('more', { count: hiddenLive }))))
        }
      }
      if (props.clearable) {
        const undoMode = Boolean(cleared.value)
        if (undoMode || clearables.value.length >= 2) {
          tools.push(h(GBtn, {
            key: 'clear',
            variant: 'link',
            color: 'accent',
            size: btnSize,
            class: ['g-tag-group__clear', { 'is-undo': undoMode }],
            disabled: props.disabled,
            onClick: () => (undoMode ? undoAll() : clearAll())
          }, undoMode
            ? { prepend: () => h(GLibIcon, { name: 'undo-2', class: 'g-icon--flip-rtl' }), default: () => L('undoAll', { count: cleared.value.entries.length }) }
            : { default: () => L('clearAll') }))
        }
      }

      return h('div', {
        ref: root,
        class: ['g-tag-group', `g-tag-group--layout-${props.layout}`, `g-tag-group--size-${props.size}`, { 'is-disabled': props.disabled }],
        onFocusout,
        onPointerenter,
        onPointermove,
        onPointerleave
      }, [
        container,
        emptyText ? h('p', { class: 'g-tag-group__empty', id: emptyId }, emptyText) : null,
        tools.length ? h('span', { class: 'g-tag-group__tools' }, tools) : null,
        h('span', { class: 'g-tag-group__live', role: 'status' }, live.polite),
        ...tipNodes
      ])
    }
  }
})
</script>
