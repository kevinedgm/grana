<script>
// GFab · botón flotante con acciones (dueño: bruno)
// Contrato: design/contracts/fab.md (DECISIONS.md #654 a #671) · Estructura: design/lab/fab/r01/ (kiwi) · Estilo: GFab.css
// (coco; lo que espera del .vue en design/lab/fab/estilo.md «Para bruno»). Sin <style>, sin textos propios (#226).
// A · «La pila que crece» por defecto y C · «Acción con cola» con `main` (#654). Botón de menú de APG con el motor de GMenu
// (utils/menuNav.js, #657): foco itinerante, ↑ ↓ Inicio Fin, la letra, M1 y una activación por gesto (#661).
// Entrada propia `@grana/vue/fab` (#656): todo lo que importa de fuera de su carpeta llega de `__shared` (src/shared.js).
import { computed, defineComponent, h, mergeProps, nextTick, onBeforeUnmount, onMounted, reactive, ref, useId, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GBtn from '../GBtn/GBtn.vue'
import GTooltip from '../GTooltip/GTooltip.vue'
import GLibIcon from '../GIcon/GLibIcon.js'
import GAppIcon from '../GIcon/GIcon.vue'
import { createHighlight, createPointer, createTypeahead, focusItem, repeatGesture, stepTo } from '../../utils/menuNav.js'
import { EDGE_ORDER, clearEdgeReserve, edgeReserve, setEdgeReserve } from '../../utils/edgeReserve.js'
import { createTopModal } from '../../utils/topModal.js'
import { acquirePageLive, announcePage } from '../../utils/liveRegion.js'
import { anchorGone, followFrame, px, setVar } from '../../utils/anchor.js'
import { observeSize } from '../../utils/sizeObserver.js'
import { nextFrame, spaceUnit } from '../GForm/formContext.js'
import { transitionMs } from '../../utils/motion.js'
import { fold } from '../../utils/match.js'
import { fill } from '../../utils/template.js'

// Constantes de diseño de la política y del sitio (fab.md «A · Política auto», «Panel», «Posición»; tokens.md §47: no son
// tokens), en unidades de --g-space-1: tope de la pila, del FAB a su lista, píldora de una línea (p; 44px con pointer:
// coarse), separación (g), margen al borde, ancho del panel, umbral de estrecho (el de GDialog), alto mínimo del panel y
// sitio para que el panel de la cola vaya encima de la pila
const MAX_STACK = 5
const GAP = 3
const PILL = 10
const SEP = 2
const EDGE = 4
const PANEL_W = 80
const NARROW = 130
const PANEL_MIN = 20
const COVER = 40
// Anillo de la ventana del velo, sumado aquí antes de redondear hacia fuera (#668; pregunta 10 de coco a lima en
// design/lab/fab/estilo.md): de 0 a 1 espacio por lado; si lima lo cambia, es este número
const HOLE_RING = 1
const RECEIPT_MS = 4000 // la constante de GDocumentPreview (tokens.md §29.6)
const GUIDE = 15 // más de 15: aviso, nunca recorte (#665)
const BADGE = { busy: 'loader-circle', done: 'check', failed: 'circle-alert' }

const shown = (el) => { try { return el.matches(':popover-open') } catch { return false } }
const show = (el) => { if (el && el.showPopover && !shown(el)) el.showPopover() }
const hide = (el) => { if (el && el.hidePopover && shown(el)) el.hidePopover() }
const MI = '[role="menuitem"]'
const menuItems = (ul) => (ul ? [...ul.querySelectorAll(MI)].filter((b) => !b.closest('[hidden]')) : [])
const labelOf = (b) => b.querySelector('.g-fab__label')?.textContent || ''
const lenPx = (v) => (typeof v === 'number' ? v : /px$/.test(String(v || '').trim()) ? parseFloat(v) : 0)
const blank = (v) => v === undefined || v === null || v === ''
// Campo con teclado en pantalla (pointer: coarse): texto editable, no de solo lectura ni deshabilitado
const editable = (t) => !t.readOnly && !t.disabled && (t.isContentEditable || t.localName === 'textarea' || (t.localName === 'input' && !/^(checkbox|radio|button|submit|reset|range|color|file|image|hidden)$/.test(t.type)))
const deco = (cls, kids) => h('span', { class: cls, 'aria-hidden': 'true' }, kids)
const lib = (name) => h(GLibIcon, { name })
const appIcon = (n) => (typeof n === 'string' && n ? [h(GAppIcon, { name: n })] : [])
const mi = (p, kids) => h('button', { type: 'button', role: 'menuitem', tabindex: '-1', ...p }, kids)

export default defineComponent({
  name: 'GFab',
  inheritAttrs: false,
  props: {
    items: { type: Array, default: () => [] },
    modelValue: { type: Boolean, default: undefined },
    label: { type: String, default: undefined },
    main: { type: [String, Number], default: undefined },
    appearance: { type: String, default: 'auto', validator: oneOf(['auto', 'panel', 'arc']) },
    position: { type: String, default: 'bottom-end', validator: oneOf(['bottom-end', 'bottom-start', 'bottom-center', 'top-end', 'top-start', 'top-center']) },
    anchor: { type: String, default: 'viewport', validator: oneOf(['viewport', 'container']) },
    offset: { type: Object, default: () => ({}) },
    closeOnSelect: { type: String, default: 'auto', validator: oneOf(['auto', 'never']) },
    labels: { type: Object, default: () => ({}) },
    id: { type: String, default: undefined }
  },
  emits: ['select', 'update:modelValue', 'open', 'closed'],
  setup(props, { emit, slots, attrs }) {
    const rid = props.id || `g-fab-${useId()}`
    const warned = new Set()
    const warn = (n, msg) => {
      try {
        if (process.env.NODE_ENV !== 'production' && !warned.has(n)) {
          warned.add(n)
          console.warn(`[Grana GFab] aviso ${n}: ${msg}`)
        }
      } catch {}
    }
    const L = (key, vars) => {
      const v = props.labels[key]
      return typeof v === 'function' ? String(v(vars || {})) : fill(v, vars)
    }
    // Aviso 11: falta un texto que hace falta (la salida de cada caso, en fab.md «Textos»)
    const need = (key) => { try { if (process.env.NODE_ENV !== 'production') warn(`11 ${key}`, `falta labels.${key}.`) } catch {} }

    // ---------- Datos (#665: nunca lanza ni descarta en silencio) ----------
    // Clave interna por elemento, no por `id` (los repetidos no comparten foco ni acuse, #663): id + aparición
    const model = computed(() => {
      const raw = props.items
      const out = []
      if (!Array.isArray(raw)) {
        try { if (process.env.NODE_ENV !== 'production') warn(1, '`items` no es un arreglo; no se pinta nada.') } catch {}
        return out
      }
      const seen = new Map()
      raw.forEach((r, i) => {
        if (!r || typeof r.label !== 'string' || !r.label.trim()) {
          try { if (process.env.NODE_ENV !== 'production') warn(3, `el elemento ${i} no tiene \`label\` y no se pinta.`) } catch {}
          return
        }
        if (blank(r.id)) {
          try { if (process.env.NODE_ENV !== 'production') warn(4, `«${r.label}» no tiene \`id\` y no se pinta.`) } catch {}
          return
        }
        const n = seen.get(r.id) || 0
        seen.set(r.id, n + 1)
        const danger = Boolean(r.danger)
        try {
          if (process.env.NODE_ENV !== 'production') {
            if (n) warn(5, `\`id\` repetido «${r.id}»: se pintan los dos.`)
            if (danger && r.confirm === undefined) warn(6, `«${r.label}» es peligrosa sin \`confirm\`: pregunta su \`label\`.`)
            if (!danger && (r.confirm !== undefined || r.confirmLabel !== undefined)) warn(7, `«${r.label}»: \`confirm\` sin \`danger\` se ignora.`)
          }
        } catch {}
        out.push({ key: `${typeof r.id}:${r.id}:${n}`, n: out.length, raw: r, id: r.id, label: r.label, danger, ask: danger && r.confirm !== false ? (typeof r.confirm === 'string' && r.confirm.trim() ? r.confirm : r.label) : '' })
      })
      try { if (process.env.NODE_ENV !== 'production' && out.length > GUIDE) warn(14, `${out.length} acciones (más de ${GUIDE}): se pintan todas; valora una página de acciones.`) } catch {}
      return out
    })
    const byKey = (key) => model.value.find((x) => x.key === key)
    // C: la principal, un `id` pintable que no es peligrosa (y con labels.moreShort si hay cola)
    const mainIt = computed(() => {
      const m = props.main
      if (blank(m)) return null
      const it = model.value.find((x) => x.id === m)
      if (!it) { try { if (process.env.NODE_ENV !== 'production') warn(8, `\`main\` «${m}» no es una acción pintable: forma A.`) } catch {} return null }
      if (it.danger) { try { if (process.env.NODE_ENV !== 'production') warn(9, `\`main\` «${m}» es peligrosa: forma A.`) } catch {} return null }
      if (model.value.length > 1 && !props.labels.moreShort) { need('moreShort'); return null }
      return it
    })
    const rest = computed(() => model.value.filter((x) => x !== mainIt.value))
    // none · single · main (C) · auto (A) · panel
    const kind = computed(() => {
      const n = model.value.length
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (n > 1 && !props.label) warn(2, 'falta `label`: el FAB queda sin nombre.')
          if (props.appearance === 'arc') warn(10, '`appearance="arc"` está reservado: se comporta como `auto`.')
        }
      } catch {}
      return !n ? 'none' : mainIt.value ? (rest.value.length ? 'main' : 'single') : n === 1 ? 'single' : props.appearance === 'panel' ? 'panel' : 'auto'
    })
    const isMenu = () => /^(auto|panel|main)$/.test(kind.value)
    // C filtra al escribir solo con sus cuatro textos (#658); sin ellos, salta por letra
    const filters = computed(() => kind.value === 'main' && ['findHint', 'matches', 'matchesOne', 'none'].every((x) => props.labels[x] || need(x)))
    // Sin labels.cancel, las peligrosas que confirman quedan aria-disabled (fallo seguro, #662)
    const noCancel = computed(() => model.value.some((x) => x.ask) && !props.labels.cancel && !need('cancel'))

    // ---------- Estado ----------
    const local = ref(false)
    const isOpen = computed(() => (props.modelValue === undefined ? local.value : props.modelValue))
    const phase = ref('closed') // closed · opening (dos cuadros, sin transición) · open · closing
    const shape = ref('stack') // A: stack · panel
    const k = ref(MAX_STACK)
    const sub = ref(false)
    const subPhase = ref('closed')
    const armed = ref(null) // { key, first }: par de confirmación; first = «Cancelar» primero en el DOM
    const find = ref('')
    const tried = ref('') // lo escrito sin coincidencias (no amplía lo escrito)
    const tucked = ref(false)
    const pub = ref(false) // publica y lee reservas de borde
    const acks = reactive(new Map()) // clave → { state: busy | failed, text, seq }
    const receipt = ref(null) // { text }: «hecha» durante RECEIPT_MS
    const rootEl = ref(null)
    const listEl = ref(null)
    const subEl = ref(null)
    const scrimEl = ref(null)
    const idle = () => phase.value === 'closed' || phase.value === 'closing'
    const outUp = computed(() => props.position.startsWith('bottom'))
    const edge = computed(() => (outUp.value ? 'bottom' : 'top'))
    const listShape = computed(() => (kind.value === 'auto' ? shape.value : 'panel'))
    const tail = computed(() => kind.value === 'auto' && shape.value === 'stack' && rest.value.length > k.value)
    const overflow = computed(() => (tail.value ? rest.value.slice(k.value - 1) : []))
    const hits = (q) => rest.value.filter((it) => fold(it.label).includes(fold(q)) || fold(it.raw.description || '').includes(fold(q)))
    const visible = computed(() => (find.value ? hits(find.value) : rest.value))

    // ---------- Geometría ----------
    const S = () => spaceUnit(rootEl.value)
    const coarse = () => Boolean(rootEl.value.classList.contains('is-coarse') || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches))
    const rtl = () => getComputedStyle(rootEl.value).direction === 'rtl'
    const trig = () => document.getElementById(`${rid}-trigger`)
    // Caja natural del elemento, sin el desplazamiento de «se aparta» que pueda estar en curso
    const box = (el) => {
      const r = el.getBoundingClientRect()
      const [dx = 0, dy = 0] = String(getComputedStyle(rootEl.value).translate).split(' ').map((v) => parseFloat(v) || 0)
      return { left: r.left - dx, top: r.top - dy, right: r.right - dx, bottom: r.bottom - dy, width: r.width, height: r.height }
    }
    // `anchor="container"`: el antecesor posicionado; sin uno de la aplicación, el visor sin reservas (aviso 15)
    const container = () => {
      const p = props.anchor === 'container' && rootEl.value.offsetParent
      return p && p !== document.body && p !== document.documentElement ? p : null
    }
    const bounds = () => {
      const s = S()
      const d = document.documentElement
      let [l, t, r, b] = [0, 0, d.clientWidth || innerWidth, d.clientHeight || innerHeight]
      let w = r
      const c = container()
      if (c) {
        const cr = c.getBoundingClientRect()
        const cl = cr.left + c.clientLeft
        const ct = cr.top + c.clientTop
        w = c.clientWidth
        l = Math.max(l, cl)
        t = Math.max(t, ct)
        r = Math.min(r, cl + w)
        b = Math.min(b, ct + c.clientHeight)
      } else if (pub.value) {
        // El lado hacia el que crece, con sus reservas (zócalo, isla, voz…) y su `offset`
        const o = props.offset || {}
        if (outUp.value) t += edgeReserve('top') + lenPx(o.top)
        else b -= edgeReserve('bottom') + lenPx(o.bottom)
      }
      const p = s * EDGE
      return { left: l + p, top: t + p, right: r - p, bottom: b - p, width: r - l - 2 * p, narrow: w < s * NARROW }
    }
    // H: del FAB (más space × 3), o de `from`, al margen seguro del lado hacia el que crece
    const room = (from = box(rootEl.value), b = bounds()) => (outUp.value ? from.top - b.top : b.bottom - from.bottom) - S() * GAP
    // k₀ = min(n, 5, ⌊(H + g) / (p + g)⌋) (#665, #670)
    const estimate = () => {
      const s = S()
      const g = s * SEP
      return Math.max(0, Math.min(rest.value.length, MAX_STACK, Math.floor((room() + g) / ((coarse() ? 44 : Math.max(24, s * PILL)) + g))))
    }
    const decide = (kk) => {
      k.value = kk
      const n = rest.value.length
      shape.value = n <= kk || (kk >= 2 && (props.labels.more || need('more'))) ? 'stack' : 'panel'
    }
    // Ajuste con lo medido (#670): baja k de uno en uno mientras la pila medida no quepa en H; nunca lo sube
    let fitting = false
    const fit = async () => {
      if (fitting) return
      fitting = true
      while (listShape.value === 'stack' && listEl.value && k.value > 1 && listEl.value.getBoundingClientRect().height > room() + 0.5) {
        decide(Math.min(k.value, rest.value.length) - 1)
        await nextTick()
      }
      fitting = false
    }

    const setPx = (el, name, v) => setVar(el, name, px(v))
    // x de una lista de ancho w alineada con el FAB (o centrada), dentro de los márgenes
    const xOf = (f, w, b) => {
      const p = props.position
      const right = p.endsWith('end') !== rtl()
      return Math.min(Math.max(p.endsWith('center') ? f.left + f.width / 2 - w / 2 : right ? f.right - w : f.left, b.left), b.right - w)
    }
    const placePanel = (ul, from, full) => {
      const b = bounds()
      const s = S()
      const w = b.narrow ? b.width : Math.min(s * PANEL_W, b.width)
      setPx(ul, '--_w', w)
      if (full) setPx(ul, '--_max', Math.max(s * PANEL_MIN, room(from, b)))
      const hh = ul.offsetHeight
      const x = b.narrow ? b.left : xOf(box(rootEl.value), w, b)
      setPx(ul, '--_x', x)
      setPx(ul, '--_y', outUp.value ? from.top - s * GAP - hh : from.bottom + s * GAP)
      return x
    }
    // Colocación: `full` (al abrir, al cambiar el contenido, al redimensionar) fija también --_max; al desplazar, solo la posición
    const place = (full = true) => {
      const ul = listEl.value
      if (!ul || phase.value === 'closed') return
      const f = box(rootEl.value)
      const s = S()
      if (listShape.value === 'stack') {
        const r = ul.getBoundingClientRect()
        const x = xOf(f, r.width, bounds())
        const y = outUp.value ? f.top - s * GAP - r.height : f.bottom + s * GAP
        setPx(ul, '--_x', x)
        setPx(ul, '--_y', y)
        // Cada píldora sale del centro del FAB (vector de su centro al del FAB), la más cercana primero
        const lis = [...ul.children]
        if (outUp.value) lis.reverse()
        lis.forEach((li, i) => {
          setPx(li, '--_fx', f.left + f.width / 2 - (x + li.offsetLeft + li.offsetWidth / 2))
          setPx(li, '--_fy', f.top + f.height / 2 - (y + li.offsetTop + li.offsetHeight / 2))
          setVar(li, '--_i', String(Math.min(i, 4)))
        })
      } else if (kind.value === 'main') {
        // C: el panel nace de la cola (transformación de contenedor, --_clip-from)
        const t = box(trig())
        const x = placePanel(ul, t, full)
        const w = ul.offsetWidth - t.width
        const hh = Math.max(ul.offsetHeight - t.height, 0)
        const left = Math.min(Math.max(t.left - x, 0), Math.max(w, 0))
        setVar(ul, '--_clip-from', `inset(${px(outUp.value ? hh : 0)} ${px(Math.max(w - left, 0))} ${px(outUp.value ? 0 : hh)} ${px(left)} round var(--g-radius-pill))`)
      } else placePanel(ul, f, full)
      const su = subEl.value
      if (sub.value && su) {
        // Panel de la cola de A: encima de la pila si hay sitio; si no, la cubre entera (--_minh, #671)
        const st = ul.getBoundingClientRect()
        const cover = room(st) + s * GAP < s * COVER
        if (cover) setPx(su, '--_minh', st.height)
        else su.style.removeProperty('--_minh')
        placePanel(su, cover ? f : st, full)
      }
      const sc = scrimEl.value
      if (shown(sc)) {
        // Velo (#668): ventana = disparador contraído + anillo, en px enteros del visor redondeados hacia fuera
        const g = s * HOLE_RING
        const x = Math.floor(f.left - g)
        const y = Math.floor(f.top - g)
        setPx(sc, '--_hole-x', x)
        setPx(sc, '--_hole-y', y)
        setPx(sc, '--_hole-w', Math.ceil(f.right + g) - x)
        setPx(sc, '--_hole-h', Math.ceil(f.bottom + g) - y)
      }
    }

    // ---------- Foco ----------
    const lists = () => [listEl.value, subEl.value].filter(Boolean)
    const all = () => lists().flatMap((ul) => [...ul.querySelectorAll(MI)])
    const inLists = (el) => lists().some((ul) => ul.contains(el))
    // Dentro de su lista (fija): sin desplazar la página ni un contenedor; bajo la cabecera pegada de C
    const nearest = (el) => {
      const ul = el.closest('ul.g-fab__list')
      if (!ul || ul.scrollHeight <= ul.clientHeight) return
      const r = el.getBoundingClientRect()
      const s = ul.getBoundingClientRect()
      const head = ul.querySelector(':scope > .g-fab__find')
      const top = s.top + ul.clientTop + (head ? head.offsetHeight : 0)
      const bottom = s.bottom - ul.clientTop
      if (r.top < top) ul.scrollTop -= top - r.top
      else if (r.bottom > bottom) ul.scrollTop += r.bottom - bottom
    }
    const focus = (el, byPointer) => focusItem(el, all(), byPointer, nearest)
    const itemByKey = (key) => all().find((b) => key && b.dataset.key === key && b.classList.contains('g-fab__item'))
    // La primera por frecuencia (pila: la más cercana al FAB, la última del DOM si sube) o la más lejana
    const focusAt = (at) => {
      const els = menuItems(listEl.value)
      focus(els[(at === 'far') === (listShape.value === 'stack' && outUp.value) ? 0 : els.length - 1])
    }

    // ---------- Abrir y cerrar ----------
    let pending = 'first'
    let hideT = null
    let subT = null
    let listening = false
    let offSize = null
    let tm = null
    const ptr = createPointer()
    const typeahead = createTypeahead(labelOf)
    const highlight = createHighlight()
    const request = (v) => {
      if (props.modelValue === undefined) local.value = v
      emit('update:modelValue', v)
    }
    const requestOpen = (at, e) => {
      pending = at
      // Posición del clic: si la lista aparece bajo el puntero quieto, no le quita el foco a la primera (M1)
      if (e && e.detail > 0) ptr.at = { x: e.clientX, y: e.clientY }
      request(true)
    }
    // Lo síncrono del cierre: nada de la lista queda en el Tab (L7)
    const hush = () => {
      for (const b of all()) b.tabIndex = -1
      if (listEl.value) listEl.value.inert = true
    }
    const close = (back) => {
      if (idle()) return
      hush()
      if (back) trig()?.focus({ preventScroll: true })
      request(false)
      doClose()
    }
    const later = (fn, ms) => (ms > 0 ? setTimeout(fn, ms) : fn())
    const doOpen = async () => {
      if (!idle() || !rootEl.value) return
      tm = tm || createTopModal({ ignore: (d) => d.contains(rootEl.value), onChange: (top) => { if (top) close(false) } })
      tm.scan()
      if (!isMenu() || tm.top()) {
        try { if (process.env.NODE_ENV !== 'production') warn(12, '`modelValue` es true sin nada que abrir: no se abre.') } catch {}
        return
      }
      clearTimeout(hideT)
      tucked.value = false
      const ul = listEl.value
      if (phase.value === 'closing') {
        // Volver a abrir durante la salida: directo a open, desde donde esté
        ul.inert = false
        phase.value = 'open'
      } else {
        phase.value = 'opening'
        armed.value = null
        find.value = tried.value = ''
        if (kind.value === 'auto') decide(estimate())
        await nextTick()
        if (phase.value !== 'opening') return
        ul.inert = false
        if (coarse()) show(scrimEl.value)
        show(ul)
        // Escucha ya: un desplazamiento durante la apertura también mueve la lista con el FAB
        listen()
        await fit()
        if (phase.value !== 'opening') return
        place()
        emit('open')
        nextFrame(() => nextFrame(() => { if (phase.value === 'opening') phase.value = 'open' }))
      }
      listen()
      focusAt(pending)
      pending = 'first'
    }
    const doClose = async () => {
      if (idle()) return
      phase.value = 'closing'
      armed.value = null
      find.value = tried.value = ''
      closeSub()
      unlisten()
      hush()
      const ul = listEl.value
      await nextTick()
      hideT = later(() => {
        if (phase.value !== 'closing') return
        for (const el of [ul, subEl.value, scrimEl.value]) hide(el)
        phase.value = 'closed'
        emit('closed')
      }, Math.max(transitionMs(ul), transitionMs(scrimEl.value), ...[...ul.children].map(transitionMs)))
    }
    watch(isOpen, (v) => (v ? doOpen() : doClose()))

    const openSub = async () => {
      if (!overflow.value.length) return
      clearTimeout(subT)
      sub.value = true
      subPhase.value = 'opening'
      await nextTick()
      if (!sub.value) return
      show(subEl.value)
      place()
      focus(menuItems(subEl.value)[0])
      nextFrame(() => nextFrame(() => { if (subPhase.value === 'opening') subPhase.value = 'open' }))
    }
    function closeSub(back) {
      if (!sub.value) return
      sub.value = false
      const ul = subEl.value
      for (const b of ul.querySelectorAll(MI)) b.tabIndex = -1
      if (back) focus(document.getElementById(`${rid}-tail`))
      subPhase.value = 'closing'
      nextTick(() => { subT = later(() => { if (!sub.value && subPhase.value === 'closing') { hide(ul); subPhase.value = 'closed' } }, transitionMs(ul)) })
    }

    // ---------- Escuchas mientras está abierto ----------
    const onOutside = (e) => { if (!rootEl.value.contains(e.target)) close(false) }
    // Esc con el foco perdido en body (WebKit no enfoca el botón al pulsarlo)
    const onDocKey = (e) => {
      if (e.key === 'Escape' && !e.repeat && (e.target === document.body || e.target === document.documentElement)) { e.preventDefault(); close(true) }
    }
    const refit = async () => {
      if (idle()) return
      const had = inLists(document.activeElement)
      await fit()
      place()
      if (had && !inLists(document.activeElement)) focusAt()
    }
    const onResize = followFrame(async () => {
      if (idle()) return
      if (kind.value === 'auto' && shape.value === 'stack') {
        const k0 = estimate()
        if (k0 < Math.min(k.value, rest.value.length)) { decide(k0); await nextTick() }
      }
      refit()
    })
    // anchor="container": la lista sigue al FAB al desplazar (solo la posición) y se cierra sin devolver el foco si sale
    const onScroll = followFrame((scroller) => {
      if (idle()) return
      if (anchorGone(rootEl.value, scroller)) close(false)
      else place(false)
    })
    const resized = () => onResize.schedule()
    const scrolled = (e) => { if (props.anchor === 'container' && !rootEl.value.contains(e.target)) onScroll.schedule(e.target) }
    // La pila abierta cambia de alto (un fallo que añade su motivo, una etiqueta que se parte): k baja y la lista se recoloca
    const onStackSize = () => { if (listShape.value === 'stack') refit() }
    const listen = () => {
      if (listening) return
      listening = true
      document.addEventListener('pointerdown', onOutside, true)
      document.addEventListener('keydown', onDocKey)
      addEventListener('resize', resized)
      addEventListener('scroll', scrolled, true)
      tm.observe()
      offSize = observeSize(listEl.value, onStackSize)
    }
    function unlisten() {
      if (!listening) return
      listening = false
      document.removeEventListener('pointerdown', onOutside, true)
      document.removeEventListener('keydown', onDocKey)
      removeEventListener('resize', resized)
      removeEventListener('scroll', scrolled, true)
      onResize.cancel()
      onScroll.cancel()
      tm.disconnect()
      offSize()
    }

    // ---------- Acuse: el ticket de #643 en `select` (#663) ----------
    const owners = new Map() // clave → ticket vigente
    let seq = 0
    let receiptT = null
    // La insignia muestra en curso › fallo › hecho; el texto, el más reciente de ese nivel
    const ack = computed(() => {
      let best = null
      for (const a of acks.values()) if (!best || a.state < best.state || (a.state === best.state && a.seq > best.seq)) best = a
      return best || (receipt.value && { state: 'done', text: receipt.value.text })
    })
    const ticket = (it) => {
      const tok = {}
      owners.set(it.key, tok)
      let settled = false
      const live = (end) => {
        if (settled || owners.get(it.key) !== tok) {
          try { if (process.env.NODE_ENV !== 'production') warn(13, 'un método del ticket de `select` llegó fuera de tiempo: se ignora.') } catch {}
          return false
        }
        if (end) { settled = true; owners.delete(it.key) }
        return true
      }
      const say = (state, text) => {
        const t = blank(text) ? L(state) : String(text)
        if (t) announcePage(t)
        else need(state)
        return t
      }
      const set = (state, text) => acks.set(it.key, { state, text: say(state, text), seq: ++seq })
      const T = {
        busy: (text) => { if (live()) set('busy', text) },
        done: (text) => {
          if (!live(1)) return
          acks.delete(it.key)
          clearTimeout(receiptT)
          receipt.value = { text: say('done', text) }
          receiptT = setTimeout(() => { receipt.value = null }, RECEIPT_MS)
        },
        failed: (text) => { if (live(1)) set('failed', text) },
        cancel: () => { if (live(1)) acks.delete(it.key) },
        waitUntil: (p) => {
          T.busy()
          Promise.resolve(p).then(
            (v) => (typeof v === 'string' || v === true ? T.done(v === true ? undefined : v) : v && typeof v === 'object' ? T.done(v.message) : T.cancel()),
            (err) => T.failed(err && err.message)
          )
        }
      }
      return T
    }

    // ---------- Activar ----------
    const select = (it, e, inList) => {
      const retry = acks.get(it.key)?.state === 'failed'
      if (retry) acks.delete(it.key)
      emit('select', { id: it.id, item: it.raw, event: e, retry, ...ticket(it) })
      if (!inList) {
        // La principal de C con el panel abierto: se cierra y el foco se queda en ella
        if (!idle()) { hush(); request(false); doClose() }
      } else if (props.closeOnSelect === 'never' || e.defaultPrevented) {
        nextTick(() => { if (!inLists(document.activeElement)) focus(itemByKey(it.key)) })
      } else {
        const a = document.activeElement
        close(!a || a === document.body || inLists(a))
      }
    }
    const disarm = (back) => {
      const key = armed.value?.key
      if (!key) return
      armed.value = null
      nextTick(() => {
        const b = itemByKey(key)
        if (b) b.parentElement.style.removeProperty('--_armed-w')
        place(false)
        if (back) focus(b)
      })
    }
    const onClick = (e) => {
      const b = e.target.closest(MI)
      if (!b || repeatGesture(e) || phase.value === 'closing') return
      const cl = b.classList
      if (cl.contains('g-fab__item--more')) { if (sub.value) closeSub(true); else openSub(); return }
      if (cl.contains('g-fab__cancel')) { disarm(true); return }
      const it = byKey(b.dataset.key)
      if (!it) return
      if (cl.contains('g-fab__confirm-action')) { b.closest('li').style.removeProperty('--_armed-w'); armed.value = null; select(it, e, true); return }
      if (b.getAttribute('aria-disabled') === 'true') return
      if (!it.ask) { select(it, e, true); return }
      // Confirmación en el sitio (#662): «Cancelar» bajo el punto de la pulsación; con teclado, al inicio lógico
      const r = b.getBoundingClientRect()
      // La fila se parte sin mover nada más: el li conserva su ancho mientras dura el par (más estrecho, la pila se movería);
      // el dato va en la variable y el CSS lo aplica como min-inline-size (#677)
      setPx(b.parentElement, '--_armed-w', r.width)
      armed.value = { key: it.key, first: !(e.detail > 0) || (e.clientX < r.left + r.width / 2) !== rtl() }
      nextTick(() => { place(false); focus(rootEl.value.querySelector('.g-fab__cancel')) })
    }
    // Se aparta (#664): el primer toque o clic sobre el FAB apartado solo lo devuelve
    let swallow = false
    const onRootDown = () => {
      swallow = tucked.value
      tucked.value = false
    }
    // Un clic que no cuenta: el que devuelve el FAB apartado o el segundo de una ráfaga (#661)
    const skip = (e) => {
      const s = swallow && e.detail > 0
      swallow = false
      return s || repeatGesture(e)
    }
    const onTrig = (e) => {
      if (skip(e)) return
      if (idle()) requestOpen('first', e)
      else close(true)
    }
    const onTrigKey = (e) => {
      if (repeatGesture(e)) { e.preventDefault(); return }
      const toward = outUp.value ? 'ArrowUp' : 'ArrowDown'
      if (/^Arrow(Up|Down)$/.test(e.key)) {
        e.preventDefault()
        const at = e.key === toward ? 'first' : 'far'
        if (idle()) requestOpen(at)
        else focusAt(at)
      } else if (e.key === 'Escape' && !idle()) { e.preventDefault(); e.stopPropagation(); close(true) }
    }
    const onMain = (it) => (e) => {
      const st = acks.get(it.key)?.state
      if (!skip(e) && st !== 'busy' && (!it.raw.disabled || st === 'failed')) select(it, e)
    }
    const onMainKey = (e) => { if (repeatGesture(e)) e.preventDefault() }

    // ---------- Teclado de las listas ----------
    // C · buscar al escribir (#658): filtra sin campo; sin coincidencias no amplía, no vacía ni mueve el foco
    const count = (n) => (n === 1 ? L('matchesOne') : L('matches', { count: n }))
    const type = async (q) => {
      if (q && !hits(q).length) {
        tried.value = q
        announcePage(`${L('none')} ${q}`)
        return
      }
      find.value = q
      tried.value = ''
      if (q) announcePage(count(visible.value.length))
      await nextTick()
      place()
      const els = menuItems(listEl.value)
      if (q) focus(els.find((b) => fold(labelOf(b)).startsWith(fold(q))) || els[0])
    }
    const onKey = (e) => {
      const ul = e.currentTarget
      const el = e.target.closest(MI)
      if (!el) return
      if (repeatGesture(e) || (e.repeat && e.key === 'Escape')) { e.preventDefault(); return }
      const key = e.key
      const isSub = ul === subEl.value
      const R = rtl()
      const list = menuItems(ul)
      const i = list.indexOf(el)
      const to = stepTo(key, list, i)
      const lr = /^Arrow(Left|Right)$/.test(key)
      const fwd = (key === 'ArrowRight') !== R
      if (to || (lr && el.closest('.g-fab__confirm'))) {
        e.preventDefault()
        e.stopPropagation()
        focus(to || (fwd ? el.nextElementSibling : el.previousElementSibling))
      } else if (lr && fwd && el.id === `${rid}-tail`) {
        e.preventDefault()
        openSub()
      } else if ((lr && !fwd && isSub) || key === 'Escape') {
        // Esc, un paso por pulsación y sin llegar a un ancestro: par → lo escrito → panel de la cola → cerrar
        e.preventDefault()
        e.stopPropagation()
        if (lr || (!armed.value && !find.value && !tried.value && isSub)) closeSub(true)
        else if (armed.value) disarm(true)
        else if (find.value || tried.value) type('')
        else close(true)
      } else if (key === 'Tab') {
        // Cierra y el Tab sigue su curso desde el disparador
        close(false)
        trig().focus({ preventScroll: true })
      } else if (filters.value && !isSub) {
        if (key === 'Backspace' && (find.value || tried.value)) { e.preventDefault(); type(find.value.slice(0, -1)) }
        else if (key.length === 1 && key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.isComposing) { e.preventDefault(); type(find.value + key) }
      } else {
        const hit = typeahead.key(e, list, i)
        if (hit) { e.preventDefault(); focus(hit) }
      }
    }
    // M1: el puntero (ratón o lápiz) que se mueve sobre un elemento habilitado le pasa el foco; el quieto no hace nada
    const onPointer = (e) => {
      if (ptr.moved(e) === false) return
      const b = e.target.closest(MI)
      if (b && !b.closest('.g-fab__confirm') && b.getAttribute('aria-disabled') !== 'true' && document.activeElement !== b) focus(b, true)
    }
    // Resaltado que viaja en los paneles (motor compartido); el foco que sale del par lo deshace (sin temporizador)
    let hlQ = false
    const paintHl = () => {
      hlQ = false
      if (idle()) return
      const a = document.activeElement
      for (const ul of lists()) if (ul.classList.contains('g-fab__list--panel')) highlight(ul, ul.contains(a) ? a.closest('.g-fab__item') : null)
    }
    const queueHl = () => { if (!hlQ) { hlQ = true; queueMicrotask(paintHl) } }
    const onFocusIn = (e) => {
      if (armed.value && !e.target.closest('.g-fab__confirm')) disarm()
      queueHl()
    }

    // Si `items` cambia con la lista abierta: se rehace la forma (sin subir k) y el foco sigue a su elemento
    watch(model, async (list) => {
      const keys = new Set(list.map((x) => x.key))
      for (const m of [acks, owners]) for (const key of [...m.keys()]) if (!keys.has(key)) m.delete(key)
      if (idle()) return
      if (!isMenu()) { close(); return }
      const key = document.activeElement?.closest?.('.g-fab__item')?.dataset.key
      if (kind.value === 'auto') decide(Math.min(k.value, estimate()))
      await nextTick()
      await fit()
      place()
      const el = itemByKey(key)
      if (el) focus(el)
      else focusAt()
    })

    // ---------- Se aparta (#664, WCAG 2.4.11) ----------
    const onDocFocus = (e) => {
      const root = rootEl.value
      const t = e.target
      let tuck = false
      if (root && phase.value === 'closed' && t && t.nodeType === 1 && !root.contains(t)) {
        const a = t.getBoundingClientRect()
        const f = box(root)
        tuck = (a.width > 0 && a.left < f.right && a.right > f.left && a.top < f.bottom && a.bottom > f.top) || (coarse() && editable(t))
      }
      tucked.value = tuck
    }
    const onDocBlur = (e) => { if (!e.relatedTarget) tucked.value = false }

    // ---------- Bordes compartidos (#659) ----------
    const owner = {}
    const reserve = computed(() => (pub.value ? edgeReserve(edge.value, { before: EDGE_ORDER.fab }) : 0))
    const publish = () => {
      const r = rootEl.value
      if (pub.value && r && r.offsetHeight) setEdgeReserve(owner, edge.value, r.offsetHeight + S() * EDGE, { order: EDGE_ORDER.fab })
      else clearEdgeReserve(owner)
    }
    let offRoot = null
    let releaseLive = null
    const mountRoot = () => {
      const el = rootEl.value
      if (offRoot) offRoot()
      offRoot = null
      pub.value = Boolean(el && props.anchor === 'viewport' && !el.closest('dialog'))
      publish()
      if (!el) return
      try { if (process.env.NODE_ENV !== 'production' && props.anchor === 'container' && !container()) warn(15, '`anchor="container"` sin antecesor posicionado: como `viewport`, sin reservas.') } catch {}
      offRoot = observeSize(el, publish)
    }
    watch([rootEl, () => props.anchor, () => props.position], mountRoot, { flush: 'post' })
    onMounted(() => {
      releaseLive = acquirePageLive()
      document.addEventListener('focusin', onDocFocus)
      document.addEventListener('focusout', onDocBlur)
      mountRoot()
      if (isOpen.value) doOpen()
    })
    onBeforeUnmount(() => {
      unlisten()
      if (offRoot) offRoot()
      clearEdgeReserve(owner)
      releaseLive()
      document.removeEventListener('focusin', onDocFocus)
      document.removeEventListener('focusout', onDocBlur)
      for (const t of [hideT, subT, receiptT]) clearTimeout(t)
      typeahead.stop()
    })

    // ---------- Marcado ----------
    const itemEl = (it, inPanel) => {
      if (armed.value?.key === it.key) {
        // Par de confirmación (#662, #671): dos hijos directos, sin g-fab__item, en el mismo li
        const c = mi({ class: 'g-fab__cancel', key: 'c' }, props.labels.cancel)
        const ok = mi({ class: 'g-fab__confirm-action', 'data-key': it.key, key: 'ok' }, it.raw.confirmLabel || it.label)
        return h('div', { class: 'g-fab__confirm', role: 'group', 'aria-label': it.ask }, armed.value.first ? [c, ok] : [ok, c])
      }
      const r = it.raw
      const a = acks.get(it.key)
      const st = a && a.state
      const reason = st ? a.text : typeof r.disabled === 'string' ? r.disabled : ''
      const did = r.description && `${rid}-d${it.n}`
      const wid = reason && `${rid}-r${it.n}`
      return mi({
        class: ['g-fab__item', it.danger && 'g-fab__item--danger'],
        'data-key': it.key,
        'data-ack': st || undefined,
        'aria-disabled': st === 'busy' || (it.ask && noCancel.value) || (r.disabled && st !== 'failed') ? 'true' : undefined,
        'aria-describedby': [did, wid].filter(Boolean).join(' ') || undefined
      }, [
        deco('g-fab__icon', appIcon(r.icon)),
        h('span', { class: 'g-fab__label' }, it.label),
        did && h('span', { id: did, class: ['g-fab__desc', !inPanel && 'g-fab__sr'] }, r.description),
        wid && h('span', { id: wid, class: 'g-fab__reason' }, reason),
        it.danger && deco('g-fab__mark', [lib('triangle-alert')])
      ])
    }
    const panelRows = (list, withFind, tag) => {
      const q = find.value
      const t = tried.value
      const out = withFind
        ? [h('li', { class: ['g-fab__find', t && 'is-empty-result'], role: 'none', 'aria-hidden': 'true', key: 'find' },
            t ? [h('span', L('none')), h('span', { class: 'g-fab__find-query' }, t)]
              : q ? [h('span', { class: 'g-fab__find-query' }, q), h('span', { class: 'g-fab__find-count' }, count(visible.value.length))]
                : [h('span', L('findHint'))])]
        : []
      const vis = withFind && q && new Set(visible.value)
      const row = (it) => h('li', { role: 'none', key: it.key, hidden: (vis && !vis.has(it)) || undefined }, [itemEl(it, true)])
      // Sin grupo primero; los grupos por primera aparición
      const groups = new Map()
      for (const it of list) {
        const g = it.raw.group
        if (!g) out.push(row(it))
        else groups.set(g, [...(groups.get(g) || []), it])
      }
      let gi = 0
      for (const [name, its] of groups) {
        const gid = `${rid}-${tag}g${gi++}`
        out.push(h('li', { role: 'none', key: `g:${name}`, hidden: (vis && !its.some((x) => vis.has(x))) || undefined }, [
          h('div', { class: 'g-fab__group-title', id: gid, role: 'presentation' }, name),
          h('ul', { role: 'group', 'aria-labelledby': gid }, its.map(row))
        ]))
      }
      return out
    }
    const listProps = (ref, id, cls, st, labelledby) => ({
      ref,
      id: `${rid}-${id}`,
      class: ['g-fab__list', `g-fab__list--${cls}`],
      role: 'menu',
      popover: 'manual',
      tabindex: '-1',
      'aria-labelledby': `${rid}-${labelledby}`,
      'data-state': st,
      'data-appearance': cls,
      inert: st === 'closing' || undefined,
      onKeydown: onKey,
      onClick,
      onPointermove: onPointer,
      onFocusin: onFocusIn,
      onFocusout: queueHl
    })

    return () => {
      const kd = kind.value
      if (kd === 'none') return null
      const ph = phase.value
      const on = !idle()
      const a = ack.value
      const badge = deco('g-fab__badge', a ? [lib(BADGE[a.state])] : [])
      const glyphs = (icon) => [deco('g-fab__glyph g-fab__glyph--rest', icon), deco('g-fab__glyph g-fab__glyph--open', [lib('x')])]
      const menuAttrs = { id: `${rid}-trigger`, 'aria-haspopup': 'menu', 'aria-expanded': String(on), 'aria-controls': `${rid}-menu`, onClick: onTrig, onKeydown: onTrigKey }
      const fab = { size: 'xl', rounded: 'pill' }
      const tip = (text, detail, btn) => h(GTooltip, { text: text || '', detail: detail || undefined }, () => [btn])
      const actor = mainIt.value || (kd === 'single' && model.value[0])
      let head
      if (actor) {
        // La acción a un toque (C o single): data-ack en su GBtn (#669); deshabilitada o en curso, aria-disabled con su motivo
        const st = acks.get(actor.key)?.state
        const r = actor.raw
        const off = st === 'busy' || (r.disabled && st !== 'failed')
        const own = { ...fab, 'data-ack': st, 'aria-disabled': off ? 'true' : undefined, onClick: onMain(actor), onKeydown: onMainKey }
        const detail = (a && a.text) || (off && typeof r.disabled === 'string' && r.disabled)
        head = mainIt.value
          ? h('div', { class: 'g-fab__main-group', role: 'group', 'aria-label': props.label }, [
              tip(actor.label, detail, h(GBtn, { ...own, id: `${rid}-main`, class: 'g-fab__main' }, {
                prepend: r.icon ? () => appIcon(r.icon) : undefined,
                default: () => [actor.label, badge]
              })),
              kd === 'main' && tip(props.labels.moreShort, '', h(GBtn, { ...fab, ...menuAttrs, icon: true }, () => glyphs([lib('ellipsis-vertical')])))
            ])
          : tip(actor.label, detail, h(GBtn, { ...own, id: `${rid}-trigger`, icon: true }, () => [deco('g-fab__glyph', appIcon(r.icon)), badge]))
      } else {
        head = tip(props.label, a && a.text, h(GBtn, { ...fab, ...menuAttrs, icon: true }, () => [
          ...glyphs(slots['trigger-icon'] ? slots['trigger-icon']({ open: on }) : [lib('plus')]),
          badge
        ]))
      }
      const children = [head]
      if (kd !== 'single') {
        const ls = listShape.value
        let rows = []
        if (ph !== 'closed') {
          if (ls === 'stack') {
            rows = (tail.value ? rest.value.slice(0, k.value - 1) : rest.value).map((it) => h('li', { role: 'none', key: it.key }, [itemEl(it, false)]))
            if (tail.value) {
              rows.push(h('li', { role: 'none', key: 'more' }, [mi({
                id: `${rid}-tail`,
                class: ['g-fab__item', 'g-fab__item--more', sub.value && 'is-expanded'],
                'aria-haspopup': 'menu',
                'aria-expanded': String(sub.value),
                'aria-controls': `${rid}-more`
              }, [deco('g-fab__icon', [lib('ellipsis-vertical')]), h('span', { class: 'g-fab__label' }, L('more', { count: overflow.value.length }))])]))
            }
            // El orden nace del FAB: si la pila sube, la más usada es la última del DOM (#660)
            if (outUp.value) rows.reverse()
          } else rows = panelRows(rest.value, filters.value, 'm')
        }
        children.push(h('ul', listProps(listEl, 'menu', ls, ph, 'trigger'), rows))
        const sp = subPhase.value
        if (kd === 'auto') children.push(h('ul', listProps(subEl, 'more', 'panel', sp, 'tail'), sub.value || sp === 'closing' ? panelRows(overflow.value, false, 's') : []))
        // Velo táctil (#668): cuatro piezas; tocarlo cierra sin activar lo de debajo y devuelve el foco al FAB (al soltar: WebKit
        // no siempre manda el clic de un toque cuyo pointerdown se canceló; el velo sigue ahí hasta acabar la salida)
        children.push(h('div', { ref: scrimEl, class: 'g-fab__scrim', popover: 'manual', 'aria-hidden': 'true', onPointerdown: (e) => e.preventDefault(), onPointerup: () => close(true), onClick: () => close(true) }, [
          h('span', { class: 'g-fab__scrim-part' })
        ]))
      }
      const off = (props.offset || {})[edge.value]
      return h('div', mergeProps(attrs, {
        ref: rootEl,
        id: rid,
        class: ['g-fab', tucked.value && 'is-tucked'],
        'data-position': props.position,
        'data-anchor': props.anchor,
        'data-appearance': kd === 'auto' ? shape.value : kd,
        'data-state': ph,
        'data-ack': a ? a.state : undefined,
        style: {
          '--_reserve': pub.value ? `${reserve.value}px` : undefined,
          '--_offset': blank(off) ? undefined : typeof off === 'number' ? `${off}px` : off
        },
        onPointerdownCapture: onRootDown
      }), children)
    }
  }
})
</script>
