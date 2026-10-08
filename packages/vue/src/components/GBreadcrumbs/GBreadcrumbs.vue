<script>
// GBreadcrumbs · migas de pan (dueño: bruno). Contrato: design/contracts/breadcrumbs.md (#490 a #503; #505 en api.md)
// Estructura: design/lab/breadcrumbs/r01/ (kiwi) · Estilo: GBreadcrumbs.css (coco; lo que espera del .vue en
// design/lab/breadcrumbs/estilo.md). Forma A «Ruta líquida» + la cara de B como última etapa + las puertas de C con datos.
// Etapas (liquid → root-icon → shrink → step) elegidas POR LOTES sobre una lista de medida inerte (sin ids ni slots): solo
// el ancho del nav decide (observeSize, cuadro siguiente), además de `items` y la carga de fuentes; el DOM real solo cambia
// si cambia la etapa. data-clipped, is-ready, is-entering y la copia saliente se escriben fuera del estado de la fila.
// Paneles (escalera y puertas): popover="manual" dentro del nav, placeBlock + reglas de «Paneles anclados» (#358).
// Pistas: motor del tooltip en modo visual (utils/visualTip.js, #433, #496). Sin lecturas de document/window fuera de los
// ganchos de montaje y de los manejadores (SSR).
import { computed, defineComponent, h, mergeProps, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, useId, watch } from 'vue'
import GIcon from '../GIcon/GLibIcon.js'
import GAppIcon from '../GIcon/GIcon.vue'
import { anchorGone, followFrame, placeBlock, px, setVar, stickySide } from '../../utils/anchor.js'
import { observeSize } from '../../utils/sizeObserver.js'
import { fill } from '../../utils/template.js'
import { useVisualTips } from '../../utils/visualTip.js'
import { nextFrame, spaceUnit } from '../GForm/formContext.js'

const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const B = 'g-breadcrumbs'
const str = (v) => typeof v === 'string' && v !== ''
// Identidad de un nivel para la regla de subir o bajar (L13): su href y, sin él, su label
const idOf = (l) => (l.href ? `h:${l.href}` : `t:${l.label}`)
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
// #505: solo clic primario sin modificadores (Intro en un enlace llega como clic con button 0)
const primary = (e) => e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey
// Papel de cada nivel (clases is-root · is-mid · is-parent · is-current)
const roles = (i, n) => (i === n - 1 ? ['is-current'] : i === 0 ? (n === 2 ? ['is-root', 'is-parent'] : ['is-root']) : i === n - 2 ? ['is-parent'] : ['is-mid'])
const linksOf = (panel) => [...panel.querySelectorAll(`.${B}__link[href]`)]
const indexIn = (el) => (el && el.parentElement ? [...el.parentElement.children].indexOf(el) : -1)

export default defineComponent({
  name: 'GBreadcrumbs',
  inheritAttrs: false,
  props: {
    items: { type: Array, required: true },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['navigate'],
  setup(props, { emit, slots, attrs }) {
    const base = useId()
    const root = ref(null)
    const measureEl = ref(null)
    const mounted = ref(false)
    const ready = ref(false)
    const stage = ref('liquid')
    const openKey = ref(null)
    const entering = ref(null)
    const leaving = ref(null)
    let alive = true

    // ---------- Modelo ----------
    const model = computed(() => {
      const list = Array.isArray(props.items) ? props.items : []
      const bad = { level: false, child: false, last: false }
      const levels = []
      list.forEach((item, src) => {
        if (!item || !str(item.label)) { bad.level = true; return }
        levels.push({ item, src, label: item.label, href: str(item.href) ? item.href : null, icon: item.icon, kids: Array.isArray(item.children) ? item.children : [] })
      })
      levels.forEach((l, i) => {
        const last = i === levels.length - 1
        if (last && l.kids.length) bad.last = true
        l.children = last ? [] : l.kids.filter((c) => {
          const ok = Boolean(c) && str(c.label)
          if (!ok) bad.child = true
          return ok
        }).map((c) => ({ item: c, label: c.label, href: str(c.href) ? c.href : null }))
      })
      return { levels, bad }
    })
    const upIndex = computed(() => {
      const ls = model.value.levels
      for (let i = ls.length - 2; i >= 0; i--) if (ls[i].href) return i
      return -1
    })
    // Con slot `icon` manda el slot (y un icon que no es cadena es dato para él); sin slot, solo un nombre (#202)
    const hasIcon = (l) => str(l.icon) || Boolean(slots.icon && l.icon != null && l.icon !== false && l.icon !== '')
    const text = (key, label) => {
      const v = (props.labels || {})[key]
      return typeof v === 'function' ? String(v({ label }) ?? '') : fill(v, { label })
    }

    // ---------- Avisos de desarrollo (una vez por instancia y motivo; sin el texto de la aplicación) ----------
    const warned = new Set()
    const warn = (k, msg) => {
      if (!isDev() || warned.has(k)) return
      warned.add(k)
      console.warn(`[Grana GBreadcrumbs] ${msg}`)
    }
    function check() {
      const { levels, bad } = model.value
      const L = props.labels || {}
      if (bad.level) warn('label', 'un nivel sin label (o vacío) se ignora.')
      if (!levels.length) { warn('items', 'items está vacío o no es un arreglo: no se pinta nada.'); return }
      if (!L.nav && !attrs['aria-labelledby']) warn('nav', 'falta labels.nav (nombre del nav) y no hay aria-labelledby.')
      if (levels.length >= 2 && (!L.up || !L.path)) warn('up-path', 'con dos o más niveles necesita labels.up y labels.path (la última etapa puede llegar en cualquier ancho).')
      const doors = levels.filter((l) => l.children.length).length
      if (doors && !L.children) warn('children', 'hay al menos una puerta (children) y falta labels.children.')
      const noMark = (v) => typeof v === 'string' && !v.includes('{label}')
      if (noMark(L.up) || noMark(L.path)) warn('mark', 'labels.up y labels.path deben contener {label}: el nombre debe incluir el texto visible (WCAG 2.5.3).')
      if (doors > 1 && noMark(L.children)) warn('mark-children', 'labels.children sin {label}: con varias puertas todas se llamarían igual.')
      if (bad.last) warn('last-children', 'children en el último nivel no se pinta (reservado).')
      if (bad.child) warn('child', 'un hijo de children sin label se ignora.')
    }
    function checkSlot() {
      const r = root.value
      if (!isDev() || !slots.link || !r) return
      const ls = model.value.levels
      const lis = r.querySelector(`:scope > .${B}__list`)?.children || []
      let bad = [...lis].some((li, i) => ls[i] && ls[i].href && !li.classList.contains('is-leaving') && !li.querySelector(`:scope > .${B}__link[href]`))
      if (stage.value === 'step' && upIndex.value >= 0 && !r.querySelector(`:scope > .${B}__face > .${B}__up[href]`)) bad = true
      if (bad) warn('slot', 'el elemento del slot link no recibió attrs (v-bind="attrs"): falta g-breadcrumbs__link o el href.')
    }

    // ---------- Pistas (modo visual del motor del tooltip, #496) ----------
    const tips = useVisualTips({
      find(key) {
        const r = root.value
        if (!r) return null
        let el = null
        if (key === 'up') el = r.querySelector(`:scope > .${B}__face > .${B}__up`)
        else if (key === 'toggle') el = r.querySelector(`:scope > .${B}__face > .${B}__toggle`)
        else {
          const li = r.querySelector(`:scope > .${B}__list`)?.children[Number(key.slice(1))]
          el = li && li.querySelector(key[0] === 'd' ? `:scope > .${B}__door` : `:scope > .${B}__link`)
        }
        return el ? { ctrl: el } : null
      },
      // Activa solo si el nombre está recortado (o la raíz va en solo icono); la puerta, siempre (#498). Lectura síncrona:
      // con el foco por teclado el despliegue ya se aplicó
      disabled(key, ctrl) {
        if (key[0] === 'd') return false
        if (ctrl.parentElement && ctrl.parentElement.classList.contains('is-icon')) return false
        const lab = ctrl.querySelector(`.${B}__label`)
        return !lab || lab.scrollWidth <= lab.clientWidth + 1
      },
      placement: () => 'bottom'
    })

    // ---------- Paneles: escalera y puertas (#499; reglas de «Paneles anclados», #358) ----------
    let cur = null // { key, trigger, panel, side, dx, dy }
    let listening = false
    function place(full) {
      const c = cur
      if (!c) return
      const a = c.trigger.getBoundingClientRect()
      const u = spaceUnit(root.value)
      const pad = u * 2
      const gap = u
      const vw = document.documentElement.clientWidth || window.innerWidth
      const vh = window.innerHeight
      const rooms = { below: vh - a.bottom - pad - gap, above: a.top - pad - gap }
      if (!full) {
        // Durante el desplazamiento: solo la posición (lado, alto y --_max se conservan) salvo cambio de lado útil
        if (stickySide(c.side, { ...rooms, unit: u }) !== c.side) { place(true); return }
        setVar(c.panel, '--_x', px(a.left + c.dx))
        setVar(c.panel, '--_y', px((c.side === 'top' ? a.top : a.bottom) + c.dy))
        return
      }
      const p = c.panel
      const scroll = p.scrollTop
      p.style.setProperty('--_max', '9999px')
      const width = p.offsetWidth
      const natural = p.scrollHeight
      const side = c.side ? stickySide(c.side, { ...rooms, unit: u }) : (natural > rooms.below && rooms.above > rooms.below ? 'top' : 'bottom')
      const rtl = getComputedStyle(c.trigger).direction === 'rtl'
      const start = rtl ? a.right - width : a.left
      const align = start >= pad && start + width <= vw - pad ? 'start' : 'end'
      const r = placeBlock(a, { width, naturalHeight: natural, vw, vh, align, side, rtl, pad, gap })
      c.side = side
      c.dx = r.x - a.left
      c.dy = r.y - (side === 'top' ? a.top : a.bottom)
      p.setAttribute('data-side', side)
      p.style.setProperty('--_max', px(Math.max(0, r.room)))
      setVar(p, '--_x', px(r.x))
      setVar(p, '--_y', px(r.y))
      p.scrollTop = scroll
    }
    const follow = followFrame((scroller) => {
      if (!cur) return
      if (anchorGone(cur.trigger, scroller)) { close(false); return }
      place(false)
    })
    const onDocDown = (e) => {
      if (cur && !cur.panel.contains(e.target) && !cur.trigger.contains(e.target)) close(false)
    }
    // Esc cierra el panel y no llega a un GDialog ancestro (como GMenu); si el motor ya cerró una pista, no
    const onDocKey = (e) => {
      if (e.key !== 'Escape' || !cur || e.isComposing || e.defaultPrevented) return
      e.preventDefault()
      e.stopPropagation()
      close(true)
    }
    const onScroll = (e) => {
      const t = e && e.target
      if (!cur || (t && t.nodeType === 1 && cur.panel.contains(t))) return
      follow.schedule(t)
    }
    const onResize = () => { if (cur) place(true) }
    function listen() {
      if (listening) return
      listening = true
      document.addEventListener('pointerdown', onDocDown, true)
      document.addEventListener('keydown', onDocKey, true)
      window.addEventListener('scroll', onScroll, { capture: true, passive: true })
      window.addEventListener('resize', onResize)
    }
    function unlisten() {
      if (!listening) return
      listening = false
      document.removeEventListener('pointerdown', onDocDown, true)
      document.removeEventListener('keydown', onDocKey, true)
      window.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onResize)
      follow.cancel()
    }
    function open(key, trigger) {
      close(false)
      const panel = key === 'stairs' ? root.value && root.value.querySelector(`:scope > .${B}__stairs`) : trigger.nextElementSibling
      if (!panel) return
      cur = { key, trigger, panel, side: null, dx: 0, dy: 0 }
      openKey.value = key
      trigger.setAttribute('aria-expanded', 'true')
      tips.check()
      // El lado de entrada (data-side) va antes de showPopover: se estima con el alto previsto (un enlace por elemento)
      const a = trigger.getBoundingClientRect()
      const u = spaceUnit(root.value)
      const below = window.innerHeight - a.bottom - u * 3
      const guess = panel.children.length * Math.max(24, u * 8) + u * 4
      panel.setAttribute('data-side', guess > below && a.top - u * 3 > below ? 'top' : 'bottom')
      setVar(panel, '--_x', px(a.left))
      setVar(panel, '--_y', px(a.bottom + u))
      try { panel.showPopover() } catch { /* sin popover o ya abierto */ }
      place(true)
      listen()
    }
    function close(back) {
      const c = cur
      if (!c) return
      cur = null
      openKey.value = null
      unlisten()
      c.trigger.setAttribute('aria-expanded', 'false')
      try { c.panel.hidePopover() } catch { /* ya cerrado o desconectado */ }
      if (back && c.trigger.isConnected) c.trigger.focus()
    }
    const toggle = (key, e) => (cur && cur.key === key ? close(false) : open(key, e.currentTarget))
    // ↓ en el disparador: abre (si está cerrado) y entra; en una puerta, al hijo de la ruta o al primero
    function triggerKey(key, e) {
      if (e.key !== 'ArrowDown' || e.altKey || e.ctrlKey || e.metaKey) return
      e.preventDefault()
      if (!cur || cur.key !== key) open(key, e.currentTarget)
      if (!cur) return
      const here = key === 'stairs' ? null : cur.panel.querySelector(`.${B}__link[href][aria-current="true"]`)
      const to = here || linksOf(cur.panel)[0]
      if (to) to.focus()
    }
    function panelKey(e) {
      const ls = linksOf(e.currentTarget)
      const k = ls.indexOf(document.activeElement)
      if (k < 0) return
      const to = { ArrowDown: ls[(k + 1) % ls.length], ArrowUp: ls[(k - 1 + ls.length) % ls.length], Home: ls[0], End: ls[ls.length - 1] }[e.key]
      if (!to) return
      e.preventDefault()
      to.focus()
    }

    // ---------- Navegar (#494, #505) ----------
    function go(e, item, index, from) {
      if (!primary(e)) return
      // Con el slot (RouterLink) el router ya canceló en su propio onClick: navigate se emite igual (#494)
      if (!slots.link && e.defaultPrevented) return
      // Desde un panel: se cierra y el foco vuelve al disparador ANTES de emitir
      if (from === 'door' || from === 'stairs') close(true)
      emit('navigate', { item, index, event: e, from })
    }

    // ---------- Etapas: medida por lotes (#495) ----------
    function choose() {
      const ol = measureEl.value
      const ls = model.value.levels
      const n = ls.length
      if (!ol || !n) return stage.value
      const icon = n > 1 && hasIcon(ls[0])
      const tries = icon ? ['liquid', 'root-icon', 'shrink'] : ['liquid', 'shrink']
      const first = ol.firstElementChild
      for (const st of tries) {
        ol.setAttribute('data-stage', st)
        if (first) first.classList.toggle('is-icon', icon && st !== 'liquid')
        const w = ol.getBoundingClientRect().width
        let sum = 0
        for (const li of ol.children) sum += li.getBoundingClientRect().width
        if (sum <= w + 0.5) return st
      }
      return n >= 2 ? 'step' : 'shrink'
    }
    // data-clipped: nombre recortado (lee todo y escribe después); solo cambia el fondo, nunca el tamaño
    function markClipped() {
      const ol = root.value && root.value.querySelector(`:scope > .${B}__list`)
      if (!ol) return
      const lis = [...ol.children]
      const on = lis.map((li) => {
        if (li.classList.contains('is-leaving') || li.classList.contains('is-icon')) return false
        const lab = li.querySelector(`:scope > .${B}__link .${B}__label`)
        return Boolean(lab) && lab.scrollWidth > lab.clientWidth + 1
      })
      lis.forEach((li, i) => { if (li.hasAttribute('data-clipped') !== on[i]) li.toggleAttribute('data-clipped', on[i]) })
    }
    // Foco por nivel al cambiar de etapa (punto 4)
    function focusKey() {
      const r = root.value
      const a = typeof document !== 'undefined' ? document.activeElement : null
      if (!r || !a || a === r || !r.contains(a)) return null
      if (a.closest(`.${B}__toggle`)) return { kind: 'toggle' }
      if (a.closest(`.${B}__up`)) return { kind: 'link', i: upIndex.value }
      const stair = a.closest(`.${B}__stair`)
      if (stair) return { kind: 'stairs', i: indexIn(stair) }
      const li = a.closest(`.${B}__item`)
      if (!li) return null
      return { kind: a.closest(`.${B}__door, .${B}__panel`) ? 'door' : 'link', i: indexIn(li) }
    }
    function restoreFocus(k, st) {
      const r = root.value
      if (!k || !r) return
      let el = null
      if (st === 'step') {
        const up = r.querySelector(`:scope > .${B}__face > .${B}__up`)
        el = k.kind === 'link' && up && k.i === upIndex.value ? up : r.querySelector(`:scope > .${B}__face > .${B}__toggle`)
      } else {
        const lis = [...(r.querySelector(`:scope > .${B}__list`)?.children || [])]
        if (k.kind === 'door') el = lis[k.i] && lis[k.i].querySelector(`:scope > .${B}__door`)
        const i = k.kind === 'toggle' ? model.value.levels.length - 1 : k.i
        if (!el) el = lis[i] && lis[i].querySelector(`:scope > .${B}__link[href]`)
        if (!el) el = lis.map((li) => li.querySelector(`:scope > .${B}__link[href]`)).filter(Boolean).pop()
      }
      if (el) el.focus({ preventScroll: true })
    }
    let firstDone = false
    function measure() {
      if (!alive || !mounted.value || !root.value) return
      const st = choose()
      if (st !== stage.value) {
        const k = focusKey()
        close(false)
        if (st === 'step') { entering.value = null; leaving.value = null }
        stage.value = st
        nextTick(() => { restoreFocus(k, st); markClipped() })
      } else markClipped()
      if (!firstDone) {
        firstDone = true
        nextTick(() => nextFrame(() => { if (alive) ready.value = true }))
      }
    }

    // Solo el ancho del nav decide; el observador compartido ya avisa en el cuadro siguiente
    let stopSize = null
    let lastW = -1
    function observe(el) {
      if (stopSize) stopSize()
      stopSize = null
      lastW = -1
      if (!el) return
      stopSize = observeSize(el, () => {
        const w = el.getBoundingClientRect().width
        if (Math.abs(w - lastW) < 0.01) return
        lastW = w
        measure()
      })
    }
    watch(root, (el) => { if (mounted.value) observe(el) }, { flush: 'post' })
    watch(model, () => measure(), { flush: 'post' })
    const onFonts = () => nextFrame(measure)

    // ---------- Subir o bajar (L13, #500): entra el último o sale una copia inerte ----------
    let token = 0
    let lastLevels = []
    let enterT = 0
    let leaveT = 0
    const durMs = (name, fb) => {
      const el = root.value
      if (!el || typeof getComputedStyle !== 'function') return fb
      const v = getComputedStyle(el).getPropertyValue(name).trim()
      const n = parseFloat(v)
      return Number.isFinite(n) ? (/ms$/.test(v) ? n : n * 1000) : fb
    }
    const endEnter = (t) => { if (entering.value && entering.value.t === t) entering.value = null }
    const endLeave = (t) => { if (leaving.value && leaving.value.t === t) leaving.value = null }
    function runEnter(t) {
      const li = root.value && root.value.querySelector(`:scope > .${B}__list > .is-entering`)
      if (!li) { endEnter(t); return }
      clearTimeout(enterT)
      enterT = setTimeout(() => endEnter(t), durMs('--g-duration-slow', 400) + 400)
      const anims = typeof li.getAnimations === 'function' ? li.getAnimations() : null
      if (!anims) return
      if (!anims.length) { endEnter(t); return }
      Promise.allSettled(anims.map((a) => a.finished)).then(() => endEnter(t))
    }
    function runLeave(t) {
      const li = root.value && root.value.querySelector(`:scope > .${B}__list > .is-leaving`)
      if (!li) { endLeave(t); return }
      clearTimeout(leaveT)
      leaveT = setTimeout(() => endLeave(t), durMs('--g-duration-press', 200) + 400)
      const anims = typeof li.getAnimations === 'function' ? li.getAnimations() : null
      if (anims && !anims.length) endLeave(t)
    }
    watch(() => model.value.levels.map(idOf).join('\u0000'), () => {
      const now = model.value.levels
      const prev = lastLevels
      lastLevels = now
      entering.value = null
      leaving.value = null
      if (!ready.value || stage.value === 'step') return
      const same = (k) => { for (let i = 0; i < k; i++) if (idOf(now[i]) !== idOf(prev[i])) return false; return true }
      if (now.length === prev.length + 1 && same(prev.length)) {
        const t = ++token
        entering.value = { id: idOf(now[now.length - 1]), t }
        nextTick(() => runEnter(t))
      } else if (now.length === prev.length - 1 && now.length && same(now.length) && !reduced()) {
        const t = ++token
        const gone = prev[prev.length - 1]
        leaving.value = { level: gone, door: prev[prev.length - 2].children.length > 0, t }
        nextTick(() => runLeave(t))
      }
    })

    // ---------- Montaje ----------
    onMounted(() => {
      lastLevels = model.value.levels
      mounted.value = true
      nextTick(() => {
        measure()
        observe(root.value)
        checkSlot()
      })
      if (typeof document !== 'undefined' && document.fonts) {
        if (document.fonts.ready) document.fonts.ready.then(() => { if (alive) measure() })
        if (typeof document.fonts.addEventListener === 'function') document.fonts.addEventListener('loadingdone', onFonts)
      }
    })
    onUpdated(() => { markClipped(); checkSlot() })
    onBeforeUnmount(() => {
      alive = false
      close(false)
      unlisten()
      if (stopSize) stopSize()
      stopSize = null
      clearTimeout(enterT)
      clearTimeout(leaveT)
      if (typeof document !== 'undefined' && document.fonts && typeof document.fonts.removeEventListener === 'function') document.fonts.removeEventListener('loadingdone', onFonts)
    })

    // ---------- Render ----------
    const label = (t) => h('span', { class: `${B}__label`, dir: 'auto' }, t)
    const iconHole = (l) => (hasIcon(l)
      ? h('span', { class: `${B}__icon`, 'aria-hidden': 'true' }, slots.icon ? slots.icon({ item: l.item, index: l.src }) : [h(GAppIcon, { name: l.icon })])
      : null)
    const sep = () => h(GIcon, { name: 'chevron-right', class: `${B}__sep g-icon--flip-rtl` })
    const chev = () => h(GIcon, { name: 'chevron-right', class: 'g-icon--flip-rtl' })
    const levelInner = (l) => [iconHole(l), label(l.label)]
    const textCls = [`${B}__link`, `${B}__link--text`]

    // `content` del slot link: un componente estable por destino que lee el modelo (reactivo), así se actualiza solo
    const contents = new Map()
    const contentFor = (key, inner) => {
      let c = contents.get(key)
      if (!c) {
        const holder = { inner }
        c = { holder, comp: () => holder.inner() }
        contents.set(key, c)
      }
      c.holder.inner = inner
      return c.comp
    }
    // Un destino con página: <a href> por defecto o el elemento del slot link con attrs + content
    function dest(s) {
      const a = { href: s.href, class: s.cls, 'aria-current': s.current, 'aria-label': s.name, onClick: s.onClick }
      if (slots.link) return slots.link({ item: s.item, index: s.index, current: s.current === 'page', from: s.from, attrs: a, content: contentFor(s.key, s.inner) })
      return h('a', a, s.inner())
    }
    const lvl = (i) => model.value.levels[i]
    function levelDest(l, i, from, current) {
      if (!l.href) return h('span', { class: textCls, 'aria-current': current ? 'page' : undefined }, levelInner(l))
      return dest({
        item: l.item, index: l.src, from, href: l.href, cls: `${B}__link`, current: current ? 'page' : undefined, key: `${from}${i}`,
        inner: () => (lvl(i) ? levelInner(lvl(i)) : null),
        onClick: (e) => go(e, l.item, l.src, from)
      })
    }
    // Hijo de la ruta en una puerta: mismo href si los dos lo tienen; si no, mismo label (regla 4)
    const match = (c, l) => (c.href && l.href ? c.href === l.href : c.label === l.label)
    function childDest(prev, l, i, j) {
      const c = prev.children[j]
      const here = match(c, l)
      const inner = (cc, hh) => [label(cc.label), hh ? h(GIcon, { name: 'check', class: `${B}__here` }) : null]
      if (!c.href) return h('span', { class: textCls, 'aria-current': here ? 'true' : undefined }, inner(c, here))
      return dest({
        item: c.item, index: l.src, from: 'door', href: c.href, cls: `${B}__link`, current: here ? 'true' : undefined, key: `door${i}.${j}`,
        inner: () => {
          const p = lvl(i - 1)
          const cc = p && p.children[j]
          return cc && lvl(i) ? inner(cc, match(cc, lvl(i))) : null
        },
        onClick: (e) => go(e, c.item, l.src, 'door')
      })
    }
    function door(prev, l, i) {
      const key = `d${i}`
      const id = `${base}-door-${i}`
      return [
        h('button', {
          type: 'button',
          class: `${B}__door`,
          'aria-expanded': openKey.value === key ? 'true' : 'false',
          'aria-controls': id,
          'aria-label': text('children', prev.label),
          onClick: (e) => toggle(key, e),
          onKeydown: (e) => triggerKey(key, e)
        }, [chev()]),
        h('ul', { id, class: `${B}__panel`, popover: 'manual', onKeydown: panelKey }, prev.children.map((c, j) => h('li', { key: j }, [childDest(prev, l, i, j)])))
      ]
    }
    function row() {
      const ls = model.value.levels
      const n = ls.length
      const icon = (stage.value === 'root-icon' || stage.value === 'shrink') && n > 1 && hasIcon(ls[0])
      const en = entering.value
      const out = ls.map((l, i) => h('li', {
        key: i,
        class: [`${B}__item`, ...roles(i, n), i === 0 && icon && 'is-icon', i === n - 1 && en && en.id === idOf(l) && 'is-entering']
      }, [i > 0 ? (ls[i - 1].children.length ? door(ls[i - 1], l, i) : sep()) : null, levelDest(l, i, 'path', i === n - 1)]))
      const lv = leaving.value
      if (lv) {
        const t = lv.t
        const end = (e) => { if (e.target === e.currentTarget && String(e.animationName).startsWith('g-breadcrumbs-leave')) endLeave(t) }
        out.push(h('li', { key: `leave${t}`, class: [`${B}__item`, 'is-current', 'is-leaving'], 'aria-hidden': 'true', inert: true, onAnimationend: end, onAnimationcancel: end }, [
          lv.door ? h('button', { type: 'button', class: `${B}__door`, tabindex: '-1' }, [chev()]) : sep(),
          h(lv.level.href ? 'a' : 'span', { class: lv.level.href ? `${B}__link` : textCls, href: lv.level.href || undefined }, levelInner(lv.level))
        ]))
      }
      return h('ol', { key: 'list', class: `${B}__list` }, out)
    }
    // Lista de medida (#495, regla 8): aria-hidden, inert, sin ids ni slots; data-stage e is-icon los escribe choose()
    function measureList() {
      const ls = model.value.levels
      const n = ls.length
      return h('ol', { key: 'measure', ref: measureEl, class: `${B}__measure`, 'aria-hidden': 'true', inert: true }, ls.map((l, i) => h('li', { key: i, class: [`${B}__item`, ...roles(i, n)] }, [
        i > 0 ? (ls[i - 1].children.length ? h('button', { type: 'button', class: `${B}__door`, tabindex: '-1' }, [chev()]) : sep()) : null,
        h(l.href ? 'a' : 'span', { class: l.href ? `${B}__link` : textCls, href: l.href || undefined, tabindex: l.href ? '-1' : undefined }, [hasIcon(l) ? h('span', { class: `${B}__icon` }) : null, label(l.label)])
      ])))
    }
    function face() {
      const ls = model.value.levels
      const n = ls.length
      const now = ls[n - 1]
      const ui = upIndex.value
      const sid = `${base}-stairs`
      const kids = []
      if (ui >= 0) {
        const u = ls[ui]
        kids.push(dest({
          item: u.item, index: u.src, from: 'up', href: u.href, cls: `${B}__up`, name: text('up', u.label), key: 'up',
          inner: () => { const k = upIndex.value; const uu = lvl(k); return uu ? [h(GIcon, { name: 'arrow-up' }), label(uu.label)] : null },
          onClick: (e) => go(e, u.item, u.src, 'up')
        }))
      }
      kids.push(h('button', {
        type: 'button',
        class: `${B}__toggle`,
        'aria-expanded': openKey.value === 'stairs' ? 'true' : 'false',
        'aria-controls': sid,
        'aria-label': text('path', now.label),
        onClick: (e) => toggle('stairs', e),
        onKeydown: (e) => triggerKey('stairs', e)
      }, [label(now.label), h(GIcon, { name: 'chevron-down', class: `${B}__chevron` })]))
      return [
        h('div', { key: 'face', class: `${B}__face` }, kids),
        h('ol', { key: 'stairs', id: sid, class: `${B}__stairs`, popover: 'manual', onKeydown: panelKey }, ls.map((l, i) => h('li', {
          key: i,
          class: [`${B}__stair`, i === n - 1 && 'is-current'],
          style: { '--_depth': i }
        }, [levelDest(l, i, 'stairs', i === n - 1)])))
      ]
    }
    // Un nodo por destino que pueda recortarse (fila: cada nivel y cada puerta; cara: «Subir» y la divulgación), al final
    function tipNodes() {
      const ls = model.value.levels
      if (stage.value === 'step') {
        const out = []
        if (upIndex.value >= 0) out.push(tips.node('up', ls[upIndex.value].label))
        out.push(tips.node('toggle', ls[ls.length - 1].label))
        return out
      }
      const out = []
      ls.forEach((l, i) => {
        if (i > 0 && ls[i - 1].children.length) out.push(tips.node(`d${i}`, text('children', ls[i - 1].label)))
        out.push(tips.node(`l${i}`, l.label))
      })
      return out
    }
    const onFocusChange = (e) => {
      if (e.type === 'focusout' && cur) {
        const to = e.relatedTarget
        if (to && !cur.panel.contains(to) && !cur.trigger.contains(to)) close(false)
      }
      nextFrame(markClipped)
    }

    return () => {
      if (isDev()) check()
      const ls = model.value.levels
      if (!ls.length) return null
      const labelledby = attrs['aria-labelledby']
      const navProps = mergeProps({
        ref: root,
        class: [B, ready.value && 'is-ready'],
        'data-stage': stage.value,
        'aria-label': labelledby ? undefined : text('nav') || undefined,
        onFocusin: onFocusChange,
        onFocusout: onFocusChange
      }, attrs)
      const kids = stage.value === 'step' && ls.length >= 2 ? face() : [row()]
      if (mounted.value) kids.push(measureList())
      return h('nav', navProps, [...kids, ...tipNodes()])
    }
  }
})
</script>
