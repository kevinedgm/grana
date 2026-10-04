<script>
// GCard · tarjeta de contenido con regiones (dueño: bruno)
// Contrato: design/contracts/card.md · Estructura: design/lab/card/r01/ · Estilo: GCard.css (coco; marcado de design/lab/card/estilo-banco.html)
// La raíz ES una GSurface (DECISIONS.md #126). Nunca la tarjeta entera es un control: la acción principal es un <a>, <button>
// o <label> real dentro del título cuyo ::after cubre la tarjeta («enlace estirado», #127); el resto de controles va por encima.
// Presenta y emite intención: `modelValue` es el estado y la tarjeta no lo cambia sin emitir. Mide su propio ancho (#130).
import { Comment, Fragment, Text, computed, defineComponent, h, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, useAttrs, useId, useSlots, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import GSurface from '../GSurface/GSurface.vue'
import GIcon from '../GIcon/GLibIcon.js'
import GMenu from '../GMenu/GMenu.vue'
import GBadge from '../GBadge/GBadge.vue'
import GBtn from '../GBtn/GBtn.vue'

// Avisos solo en desarrollo. `process` puede no existir (UMD en navegador): se comprueba antes de leerlo.
const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const DEPTH = Symbol('g-card-depth')
const TAGS = ['article', 'li', 'div', 'section']
const INTERACTIVE = ['a', 'button', 'input', 'select', 'textarea', 'summary', 'label']
const STATUS_ICON = { error: 'circle-alert', warning: 'triangle-alert', success: 'circle-check', info: 'info' }
const SKELETON_KEYS = ['media', 'lead', 'eyebrow', 'subtitle', 'badge', 'descriptionLines', 'meta', 'actions', 'footer', 'menu']
// Umbrales de tamaño en múltiplos de --g-space-1 (constantes de diseño, sin token: card.md «Adaptación»)
const WIDE = 130
const MEDIUM = 80
const linesOk = (v) => v === 'none' || [1, 2, 3, 4].includes(Number(v))

const isEmptyNode = (v) => v.type === Comment || (v.type === Text && !String(v.children ?? '').trim()) || (v.type === Fragment && (!Array.isArray(v.children) || v.children.every(isEmptyNode)))
const flat = (list) => list.flatMap((v) => (v && v.type === Fragment && Array.isArray(v.children) ? flat(v.children) : [v]))
const nodes = (slot, scope) => (slot ? flat([].concat(slot(scope) ?? [])).filter((v) => v && !isEmptyNode(v)) : [])
const cls = (...v) => v.filter(Boolean)
const raf = (f) => (typeof requestAnimationFrame === 'function' ? requestAnimationFrame(f) : setTimeout(f, 16))
const caf = (id) => (typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame(id) : clearTimeout(id))

export default defineComponent({
  name: 'GCard',
  inheritAttrs: false,
  props: {
    as: { type: String, default: 'article', validator: oneOf(TAGS) },
    level: { type: String, default: 'outlined', validator: oneOf(['flat', 'outlined', 'raised', 'inset']) },
    padding: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg']) },
    rounded: { type: String, default: undefined, validator: oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', 'pill']) },
    density: { type: String, default: 'default', validator: oneOf(['default', 'comfortable', 'compact']) },
    color: { type: String, default: 'brand', validator: oneOf(['brand', 'accent', 'neutral']) },
    orientation: { type: String, default: 'vertical', validator: oneOf(['vertical', 'horizontal', 'auto']) },
    mediaPosition: { type: String, default: 'top', validator: oneOf(['top', 'start', 'end', 'background', 'inline']) },
    eyebrow: { type: String, default: undefined },
    title: { type: String, default: undefined },
    subtitle: { type: String, default: undefined },
    description: { type: String, default: undefined },
    headingLevel: { type: Number, default: 3, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
    titleLines: { type: [Number, String], default: 2, validator: linesOk },
    descriptionLines: { type: [Number, String], default: 'none', validator: linesOk },
    expandable: Boolean,
    badge: { type: [String, Number], default: undefined },
    badgeColor: { type: String, default: 'neutral', validator: oneOf(['brand', 'accent', 'neutral', 'success', 'warning', 'danger', 'info']) },
    meta: { type: Array, default: () => [] },
    menu: { type: Array, default: () => [] },
    status: { type: String, default: undefined, validator: oneOf(['info', 'success', 'warning', 'error']) },
    statusText: { type: String, default: undefined },
    retryable: Boolean,
    empty: Boolean,
    loading: Boolean,
    skeleton: { type: Object, default: undefined },
    disabled: Boolean,
    interaction: { type: String, default: 'auto', validator: oneOf(['auto', 'none', 'link', 'button', 'toggle', 'select']) },
    href: { type: String, default: undefined },
    target: { type: String, default: undefined },
    rel: { type: String, default: undefined },
    current: Boolean,
    modelValue: { type: [Boolean, Array, String, Number], default: false },
    selectable: Boolean,
    selectType: { type: String, default: 'checkbox', validator: oneOf(['checkbox', 'radio']) },
    name: { type: String, default: undefined },
    value: { type: [String, Number], default: undefined },
    labels: { type: Object, default: () => ({}) },
    id: { type: String, default: undefined }
  },
  // Todos declarados: si no, un `navigate`/`activate` del consumidor llegaría por $attrs a la raíz (card.md «Eventos»).
  emits: ['navigate', 'activate', 'update:modelValue', 'action', 'retry', 'expand'],
  setup(props, { emit, expose }) {
    const attrs = useAttrs()
    const slots = useSlots()
    const uid = useId()
    const rootId = computed(() => props.id || `g-card-${uid}`)
    const titleId = computed(() => `${rootId.value}-title`)
    const descId = computed(() => `${rootId.value}-desc`)
    const moreId = computed(() => `${rootId.value}-more`)
    const inputId = computed(() => `${rootId.value}-input`)
    const L = computed(() => props.labels || {})

    // Tarjeta dentro de tarjeta dentro de tarjeta: aviso (card.md «Jerarquía de superficies»)
    const depth = inject(DEPTH, 0)
    provide(DEPTH, depth + 1)

    const warned = new Set()
    const warnOnce = (key, msg) => {
      if (!isDev || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana] <GCard> ${msg}`)
    }

    // ---------- Acción principal y selección ----------
    const interaction = computed(() => {
      const i = props.interaction
      if (i === 'auto') return props.href ? 'link' : 'none'
      if (i === 'link' && !props.href) return 'none'
      return i
    })
    const hasPrimary = computed(() => ['link', 'button', 'toggle', 'select'].includes(interaction.value))
    const isSelect = computed(() => interaction.value === 'select')
    // La casilla explícita solo existe si la principal no es ya la selección (select) ni un alternar (toggle)
    const hasBox = computed(() => isSelect.value || (props.selectable && interaction.value !== 'toggle'))
    const isRadio = computed(() => props.selectType === 'radio')
    const selected = computed(() => {
      const mv = props.modelValue
      if (interaction.value === 'toggle') return mv === true
      if (!hasBox.value) return false
      if (isRadio.value) return props.value !== undefined && mv === props.value
      if (props.value !== undefined) return Array.isArray(mv) && mv.includes(props.value)
      return mv === true
    })
    const isCurrent = computed(() => props.current && interaction.value === 'link')
    const inert = computed(() => props.disabled || props.loading)

    const inputEl = ref(null)
    const sync = () => { if (inputEl.value) inputEl.value.checked = selected.value }
    // El <input> nativo cambia solo; el modelo lo decide la aplicación: tras emitir se vuelve a alinear con `modelValue`
    const onChange = (e) => {
      if (inert.value) { nextTick(sync); return }
      const t = e.target
      if (isRadio.value) {
        if (t.checked) emit('update:modelValue', props.value)
      } else if (props.value !== undefined) {
        const list = Array.isArray(props.modelValue) ? props.modelValue : []
        emit('update:modelValue', t.checked ? [...list.filter((v) => v !== props.value), props.value] : list.filter((v) => v !== props.value))
      } else {
        emit('update:modelValue', t.checked)
      }
      nextTick(sync)
    }
    const onLink = (event) => {
      if (inert.value) { event.preventDefault(); return }
      // El evento nativo es cancelable: event.preventDefault() (síncrono) evita la navegación y deja paso a un router (#70)
      emit('navigate', { event, href: props.href })
    }
    const onButton = (event) => {
      if (inert.value) return
      if (interaction.value === 'toggle') emit('update:modelValue', !selected.value)
      else emit('activate', { event })
    }

    // ---------- Menú de acciones (GMenu, #129) ----------
    const menuOpen = ref(false)
    const hasMenu = computed(() => props.menu.length > 0 && !props.loading)
    watch([hasMenu, () => props.disabled], ([m, d]) => { if (!m || d) menuOpen.value = false })
    const onSelect = (e) => emit('action', e.checked === undefined ? { id: e.id } : { id: e.id, checked: e.checked })

    // ---------- Medición del propio ancho (data-size, data-layout) ----------
    const rootRef = ref(null)
    const el = () => {
      const r = rootRef.value
      const node = r && (r.$el ?? r)
      return typeof Element !== 'undefined' && node instanceof Element ? node : null
    }
    const width = ref(0)
    const unit = ref(4)
    const measureUnit = (root) => {
      if (typeof getComputedStyle === 'undefined') return
      const v = getComputedStyle(root).getPropertyValue('--g-space-1').trim()
      const n = parseFloat(v)
      if (!n) return
      unit.value = v.endsWith('rem') ? n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) : n
    }
    // Sin medición (SSR, antes de montar) se renderiza como medium/column (card.md)
    const size = computed(() => {
      const w = width.value
      if (!w) return 'medium'
      return w >= unit.value * WIDE ? 'wide' : w >= unit.value * MEDIUM ? 'medium' : 'narrow'
    })
    const layout = computed(() => {
      if (props.orientation === 'vertical') return 'column'
      if (props.orientation === 'horizontal') return size.value === 'narrow' ? 'column' : 'row'
      return size.value === 'wide' ? 'row' : 'column'
    })

    // ---------- Recorte real de la descripción («Mostrar más» solo si hay recorte) ----------
    const expanded = ref(false)
    const clipped = ref(false)
    const canExpand = computed(() => props.expandable && props.descriptionLines !== 'none')
    const checkClamp = () => {
      const root = el()
      if (!root || !canExpand.value) { clipped.value = false; return }
      const d = root.querySelector('.g-card__description')
      if (!d) { clipped.value = false; return }
      // Se mide con el recorte puesto: con is-expanded el CSS lo anula
      const was = root.classList.contains('is-expanded')
      if (was) root.classList.remove('is-expanded')
      clipped.value = d.scrollHeight > d.clientHeight + 1
      if (was) root.classList.add('is-expanded')
    }
    const measure = () => {
      const root = el()
      if (!root) return
      measureUnit(root)
      width.value = root.getBoundingClientRect().width
      checkClamp()
    }
    let ro = null
    let frame = 0
    onMounted(() => {
      measure()
      if (typeof ResizeObserver !== 'undefined' && el()) {
        // Se aplaza al siguiente cuadro: cambiar el layout dentro de la observación provocaría un bucle de ResizeObserver
        ro = new ResizeObserver(() => { caf(frame); frame = raf(measure) })
        ro.observe(el())
      }
      if (props.loading) liveText.value = L.value.loading ?? ''
    })
    onBeforeUnmount(() => { ro?.disconnect(); caf(frame) })
    watch(() => [props.description, props.descriptionLines, props.expandable, props.loading], () => nextTick(checkClamp))

    // ---------- C1 · la luz sigue al puntero (card.md «Personalidad», #303) ----------
    // `--_pointer-x/y` en px desde la caja de borde de la raíz; el halo es CSS de coco. Solo punteros `mouse`/`pen`, solo en
    // tarjetas interactivas sin `disabled`/`loading` y solo mientras se cumpla POINTER_MQ: sin ella (táctil, movimiento
    // reducido) no hay escuchas. Una escritura por cuadro y solo si cambia; se escribe en el DOM, sin pasar por el render.
    // Al salir el puntero no se borran (el halo se va con el hover); se retiran al quitar las escuchas.
    const POINTER_MQ = '(hover: hover) and (prefers-reduced-motion: no-preference)'
    const pointerMq = ref(false)
    let mql = null
    const onMq = (e) => { pointerMq.value = e.matches }
    let ptrFrame = 0
    let ptrEvent = null
    let ptrNode = null
    let ptrLast = ''
    const writePointer = () => {
      ptrFrame = 0
      const node = ptrNode
      const e = ptrEvent
      if (!node || !e) return
      const r = node.getBoundingClientRect()
      const x = `${Math.round((e.clientX - r.left) * 100) / 100}px`
      const y = `${Math.round((e.clientY - r.top) * 100) / 100}px`
      if (x + ' ' + y === ptrLast) return
      ptrLast = x + ' ' + y
      node.style.setProperty('--_pointer-x', x)
      node.style.setProperty('--_pointer-y', y)
    }
    const onPointer = (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      ptrEvent = { clientX: e.clientX, clientY: e.clientY }
      if (!ptrFrame) ptrFrame = raf(writePointer)
    }
    const detachPointer = () => {
      if (ptrFrame) { caf(ptrFrame); ptrFrame = 0 }
      const node = ptrNode
      ptrNode = null
      ptrEvent = null
      ptrLast = ''
      if (!node) return
      node.removeEventListener('pointerenter', onPointer)
      node.removeEventListener('pointermove', onPointer)
      node.style.removeProperty('--_pointer-x')
      node.style.removeProperty('--_pointer-y')
    }
    const attachPointer = (node) => {
      if (ptrNode === node) return
      detachPointer()
      if (!node) return
      ptrNode = node
      node.addEventListener('pointerenter', onPointer)
      node.addEventListener('pointermove', onPointer)
    }
    const pointerOn = computed(() => pointerMq.value && hasPrimary.value && !props.disabled && !props.loading)
    onMounted(() => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
      mql = window.matchMedia(POINTER_MQ)
      pointerMq.value = Boolean(mql.matches)
      if (mql.addEventListener) mql.addEventListener('change', onMq)
      else if (mql.addListener) mql.addListener(onMq)
    })
    // Tras el render (`post`): el nodo raíz cambia si cambia `as`, y entonces se vuelve a enganchar
    watch([pointerOn, () => props.as], ([on]) => attachPointer(on ? el() : null), { flush: 'post' })
    onBeforeUnmount(() => {
      detachPointer()
      if (mql) {
        if (mql.removeEventListener) mql.removeEventListener('change', onMq)
        else if (mql.removeListener) mql.removeListener(onMq)
        mql = null
      }
    })

    const toggleExpand = () => {
      expanded.value = !expanded.value
      emit('expand', { expanded: expanded.value, region: 'description' })
      if (!expanded.value) nextTick(checkClamp)
    }

    // ---------- Región plegable «more» (solo en narrow) ----------
    const moreOpen = ref(false)
    const canFold = computed(() => Boolean(L.value.more && L.value.less))
    const toggleMore = () => {
      moreOpen.value = !moreOpen.value
      emit('expand', { expanded: moreOpen.value, region: 'more' })
    }

    // ---------- Anuncios: región role="status" presente desde el montaje ----------
    const liveText = ref('')
    watch(() => props.loading, (v, old) => {
      liveText.value = v ? (L.value.loading ?? '') : (old && L.value.loaded ? L.value.loaded : '')
    })
    // role="alert" solo cuando el error APARECE (al montar con él, role="status")
    const errorLive = ref(false)
    watch(() => props.status, (v, old) => { errorLive.value = v === 'error' && old !== 'error' })

    const state = computed(() => (props.loading ? 'loading' : props.disabled ? 'disabled' : props.empty ? 'empty' : props.status || 'default'))

    // ---------- Avisos de desarrollo (una vez cada uno) ----------
    const devChecks = (hasMedia) => {
      if (!isDev) return
      const l = L.value
      if (INTERACTIVE.includes(String(props.as).toLowerCase())) warnOnce('as', `no es un control: as="${props.as}" no está previsto (la acción principal va dentro del título). Se usa article.`)
      if (!props.loading && !props.title && !slots.title && !attrs['aria-label'] && !attrs['aria-labelledby']) warnOnce('title', 'necesita title (o el slot title, aria-label o aria-labelledby): es su nombre accesible.')
      if (props.interaction === 'link' && !props.href) warnOnce('link', 'interaction="link" necesita href; se trata como "none".')
      if (props.href && !['link', 'auto'].includes(props.interaction)) warnOnce('href', `href con interaction="${props.interaction}": navegar y seleccionar con toda la tarjeta son excluyentes (usa selectable para la casilla explícita).`)
      if (props.selectable && ['select', 'toggle'].includes(props.interaction)) warnOnce('selectable', `selectable es redundante con interaction="${props.interaction}".`)
      if (props.current && interaction.value !== 'link') warnOnce('current', 'current solo tiene sentido con un enlace (href).')
      if (hasBox.value && isRadio.value && !props.name) warnOnce('name', 'selectType="radio" necesita name (el grupo nativo de radios).')
      if (props.status && !props.statusText && !slots.status) warnOnce('statusText', 'status necesita statusText (el icono es decorativo).')
      if (props.menu.length && !l.menu) warnOnce('l-menu', 'con menu necesita labels.menu (nombre del botón de menú).')
      if (props.loading && !l.loading) warnOnce('l-loading', 'con loading necesita labels.loading (anuncio de carga).')
      if (props.expandable && (!l.expand || !l.collapse)) warnOnce('l-expand', 'con expandable necesita labels.expand y labels.collapse.')
      if (slots.more && !canFold.value) warnOnce('l-more', 'con el slot more necesita labels.more y labels.less; sin ellos la región no se pliega.')
      if (props.retryable && props.status === 'error' && !l.retry) warnOnce('l-retry', 'con retryable necesita labels.retry.')
      if (props.empty && !slots.empty && !l.empty) warnOnce('l-empty', 'con empty necesita el slot empty o labels.empty.')
      if (depth >= 2) warnOnce('depth', 'tarjeta dentro de tarjeta dentro de tarjeta: usa una región inset o una lista.')
      if (props.meta.some((m) => !m || m.label == null || m.label === '' || m.value == null || m.value === '')) warnOnce('meta', 'ignora elementos de meta sin label o value.')
      if (hasMedia && ['start', 'end'].includes(props.mediaPosition) && props.orientation === 'vertical') warnOnce('media', `mediaPosition="${props.mediaPosition}" con orientation="vertical" se pinta arriba (usa auto u horizontal).`)
      if (props.skeleton) {
        const unknown = Object.keys(props.skeleton).filter((k) => !SKELETON_KEYS.includes(k))
        if (unknown.length) warnOnce('skeleton', `skeleton no conoce: ${unknown.join(', ')}.`)
      }
    }
    const checkActions = (list) => {
      if (!isDev) return
      for (const v of list) {
        if (v.type !== GBtn) continue
        const p = v.props || {}
        const icon = p.icon === '' || p.icon === true
        if (icon && !p['aria-label'] && !p['aria-labelledby'] && !p.ariaLabel) warnOnce('icon-btn', 'un GBtn de solo icono en actions necesita aria-label.')
      }
    }

    // ---------- Render ----------
    const scope = () => ({ size: size.value, layout: layout.value })
    const metaItems = computed(() => props.meta.filter((m) => m && m.label != null && m.label !== '' && m.value != null && m.value !== '')
      .filter((m) => !(props.density === 'compact' && m.priority === 'low')))
    const hasDescription = () => Boolean(props.description || slots.description)
    const hasTitle = () => Boolean(props.title || slots.title)

    const renderMedia = (media, inline) => {
      // Decorativa por defecto (aria-hidden); informativa si el consumidor la marca con role="img" y nombre
      const informative = !props.loading && media.some((v) => v.props && v.props.role === 'img')
      return h('div', { class: cls('g-card__media', inline && 'g-card__media--inline'), 'aria-hidden': informative ? undefined : 'true' }, props.loading ? [] : media)
    }

    const renderPrimary = (content) => {
      const it = interaction.value
      const describedby = hasDescription() ? descId.value : undefined
      if (it === 'link') {
        // Deshabilitado: sin href, role="link" + aria-disabled (no enfocable y se sigue leyendo; como GBtn y GSidebar)
        if (props.disabled) return h('a', { class: 'g-card__primary', role: 'link', 'aria-disabled': 'true', 'aria-describedby': describedby }, content)
        const rel = props.rel ?? (props.target === '_blank' ? 'noopener noreferrer' : undefined)
        return h('a', { class: 'g-card__primary', href: props.href, target: props.target, rel, 'aria-describedby': describedby, 'aria-current': isCurrent.value ? 'true' : undefined, onClick: onLink }, content)
      }
      if (it === 'button' || it === 'toggle') {
        return h('button', {
          type: 'button',
          class: 'g-card__primary',
          disabled: props.disabled || undefined,
          'aria-pressed': it === 'toggle' ? String(selected.value) : undefined,
          'aria-describedby': describedby,
          onClick: onButton
        }, content)
      }
      if (it === 'select') return h('label', { class: 'g-card__primary', for: inputId.value }, content)
      return content
    }

    const renderSelectBox = () => {
      if (hasBox.value) {
        const type = isRadio.value ? 'radio' : 'checkbox'
        return h('span', { class: 'g-card__selectbox', 'data-type': type }, [
          h('input', {
            ref: inputEl,
            class: 'g-card__select',
            id: inputId.value,
            type,
            name: props.name,
            value: props.value !== undefined ? String(props.value) : undefined,
            checked: selected.value,
            disabled: props.disabled || undefined,
            // Con select, el título es su <label>; con la casilla explícita, el nombre es el título
            'aria-labelledby': !isSelect.value && hasTitle() ? titleId.value : undefined,
            'aria-describedby': isSelect.value && hasDescription() ? descId.value : undefined,
            onChange
          }),
          h('span', { class: 'g-card__tick', 'aria-hidden': 'true' }, [isRadio.value ? h(GIcon, { name: 'circle', filled: true }) : h(GIcon, { name: 'check' })])
        ])
      }
      if (interaction.value === 'toggle') return h('span', { class: 'g-card__tick g-card__tick--static', 'aria-hidden': 'true' }, [h(GIcon, { name: 'check' })])
      return null
    }

    const renderHeader = () => {
      const sc = scope()
      const lead = nodes(slots.lead, sc)
      const eyebrow = slots.eyebrow ? nodes(slots.eyebrow) : props.eyebrow
      const subtitle = slots.subtitle ? nodes(slots.subtitle) : props.subtitle
      const Tag = `h${props.headingLevel}`
      const title = hasTitle()
        ? h(Tag, { class: 'g-card__title', id: titleId.value, 'data-lines': String(props.titleLines) }, [renderPrimary(slots.title ? slots.title() : props.title)])
        : (isSelect.value ? h('span', { class: 'g-card__title' }, [renderPrimary([])]) : null)
      const hasEyebrow = Array.isArray(eyebrow) ? eyebrow.length : eyebrow
      const hasSubtitle = Array.isArray(subtitle) ? subtitle.length : subtitle
      const titles = hasEyebrow || title || hasSubtitle
        ? h('div', { class: 'g-card__titles' }, [
            hasEyebrow ? h('p', { class: 'g-card__eyebrow' }, eyebrow) : null,
            title,
            hasSubtitle ? h('p', { class: 'g-card__subtitle' }, subtitle) : null
          ])
        : null
      const badge = slots.badge
        ? nodes(slots.badge, { state: state.value })
        : (props.badge !== undefined && props.badge !== null && props.badge !== ''
            ? [h(GBadge, { size: 'sm', variant: 'soft', color: props.badgeColor }, () => String(props.badge))]
            : [])
      const current = isCurrent.value ? h('span', { class: 'g-card__current', 'aria-hidden': 'true' }, [h(GIcon, { name: 'chevron-right' })]) : null
      const menu = hasMenu.value
        ? h(GMenu, {
            id: `${rootId.value}-menu`,
            modelValue: menuOpen.value,
            'onUpdate:modelValue': (open) => { menuOpen.value = open && !props.disabled },
            items: props.menu,
            align: 'end',
            density: props.density,
            onSelect
          }, {
            // Nombre: labels.menu + título («Acciones de Ingresos»), con aria-labelledby que se incluye a sí mismo
            trigger: ({ attrs: t }) => h('button', {
              ...t,
              type: 'button',
              class: 'g-card__menu',
              disabled: props.disabled || undefined,
              'aria-label': L.value.menu,
              'aria-labelledby': hasTitle() ? `${t.id} ${titleId.value}` : undefined
            }, [h(GIcon, { name: 'ellipsis-vertical' })])
          })
        : null
      const aside = badge.length || current || menu ? h('div', { class: 'g-card__aside' }, [...badge, current, menu]) : null
      const box = renderSelectBox()
      if (!box && !lead.length && !titles && !aside) return null
      return h('div', { class: 'g-card__header' }, [
        box,
        lead.length ? h('span', { class: 'g-card__lead', 'aria-hidden': 'true' }, lead) : null,
        titles,
        aside
      ])
    }

    const renderStatus = () => {
      if (!props.status) return null
      const retry = props.status === 'error' && props.retryable && L.value.retry
        ? h(GBtn, { variant: 'outline', onClick: (event) => emit('retry', { event }) }, () => L.value.retry)
        : null
      const inner = slots.status
        ? nodes(slots.status, { status: props.status })
        : [h(GIcon, { name: STATUS_ICON[props.status] }), props.statusText ? h('span', props.statusText) : null]
      return h('div', { class: 'g-card__status', role: errorLive.value ? 'alert' : 'status' }, [...inner, retry])
    }

    const renderEmpty = () => {
      if (!props.empty) return null
      const c = nodes(slots.empty, { size: size.value })
      if (c.length) return h('div', { class: 'g-card__empty' }, c)
      return L.value.empty ? h('div', { class: 'g-card__empty' }, [h('span', L.value.empty)]) : null
    }

    const renderContent = (media) => {
      const parts = []
      if (media) parts.push(media)
      if (hasDescription()) {
        parts.push(h('p', { class: 'g-card__description', id: descId.value, 'data-lines': String(props.descriptionLines) }, slots.description ? slots.description() : props.description))
        if (canExpand.value && (clipped.value || expanded.value)) {
          parts.push(h('button', {
            type: 'button',
            class: 'g-card__expand',
            'aria-expanded': String(expanded.value),
            'aria-controls': descId.value,
            onClick: toggleExpand
          }, [expanded.value ? L.value.collapse : L.value.expand, h(GIcon, { name: 'chevron-down' })]))
        }
      }
      const st = renderStatus()
      if (st) parts.push(st)
      const em = renderEmpty()
      if (em) parts.push(em)
      if (!props.empty) parts.push(...nodes(slots.default, { size: size.value, layout: layout.value, state: state.value, selected: selected.value }))
      return parts.length ? h('div', { class: 'g-card__content', inert: props.disabled ? '' : undefined }, parts) : null
    }

    const renderMeta = () => {
      if (slots.meta) return nodes(slots.meta)
      const items = metaItems.value
      if (!items.length) return []
      return [h('dl', { class: 'g-card__meta' }, items.map((m, i) => h('div', { key: i, class: cls('g-card__meta-item', m.priority === 'low' && 'g-card__meta-item--low') }, [
        h('dt', String(m.label)),
        h('dd', String(m.value))
      ])))]
    }

    const renderMore = () => {
      const c = nodes(slots.more, { size: size.value })
      if (!c.length) return []
      const fold = size.value === 'narrow' && canFold.value
      return [
        h('div', { class: 'g-card__more', id: moreId.value, hidden: fold && !moreOpen.value ? '' : undefined, inert: props.disabled ? '' : undefined }, c),
        fold
          ? h('button', { type: 'button', class: 'g-card__more-toggle', 'aria-expanded': String(moreOpen.value), 'aria-controls': moreId.value, onClick: toggleMore }, [moreOpen.value ? L.value.less : L.value.more, h(GIcon, { name: 'chevron-down' })])
          : null
      ]
    }

    // ---------- Esqueleto sin datos (#132): derivado de las regiones declaradas, precisado por `skeleton` ----------
    const skeletonPlan = (hasMedia) => {
      const sk = props.skeleton && typeof props.skeleton === 'object' ? props.skeleton : {}
      const pick = (k, d) => (k in sk ? sk[k] : d)
      const n = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)))
      const descDefault = hasDescription() ? (props.descriptionLines === 'none' ? 2 : Number(props.descriptionLines)) : 0
      const actionsDefault = slots.actions ? nodes(slots.actions, scope()).length || 1 : 0
      const plan = {
        media: Boolean(pick('media', hasMedia)),
        lead: Boolean(pick('lead', Boolean(slots.lead))),
        eyebrow: Boolean(pick('eyebrow', Boolean(props.eyebrow || slots.eyebrow))),
        subtitle: Boolean(pick('subtitle', Boolean(props.subtitle || slots.subtitle))),
        badge: Boolean(pick('badge', (props.badge !== undefined && props.badge !== null && props.badge !== '') || Boolean(slots.badge))),
        menu: Boolean(pick('menu', props.menu.length > 0)),
        descriptionLines: n(pick('descriptionLines', descDefault), 6),
        meta: n(pick('meta', slots.meta ? 2 : metaItems.value.length), 12),
        actions: n(pick('actions', actionsDefault), 6),
        footer: Boolean(pick('footer', Boolean(slots.footer)))
      }
      // Sin nada declarado: forma mínima (título + dos líneas)
      if (!props.skeleton && !Object.entries(plan).some(([, v]) => v)) plan.descriptionLines = 2
      return plan
    }
    const sk = (mod, style) => h('span', { class: cls('g-card__sk', mod), style })
    const space = (k) => `calc(var(--g-space-1) * ${k})`
    const renderSkeleton = (hasMedia, bleedMedia) => {
      const plan = skeletonPlan(hasMedia)
      const media = plan.media ? h('div', { class: cls('g-card__media', props.mediaPosition === 'inline' && 'g-card__media--inline'), 'aria-hidden': 'true' }) : null
      const footer = plan.footer ? h('div', { class: 'g-card__footer', 'aria-hidden': 'true' }, [sk('g-card__sk--footer', { '--_sk-w': space(35), inlineSize: space(35) })]) : null
      const body = slots.loading
        ? nodes(slots.loading, scope())
        : (() => {
            const aside = plan.badge || plan.menu
              ? h('div', { class: 'g-card__aside' }, [
                  plan.badge ? sk('', { '--_sk-w': space(14), inlineSize: space(14) }) : null,
                  plan.menu ? sk('g-card__sk--btn g-card__sk--circle', { '--_sk-w': 'var(--_btn)', '--_sk-line': 'var(--_btn)', inlineSize: 'var(--_btn)' }) : null
                ])
              : null
            const header = h('div', { class: 'g-card__header' }, [
              plan.lead ? h('span', { class: 'g-card__lead' }) : null,
              h('div', { class: 'g-card__titles' }, [
                plan.eyebrow ? h('p', { class: 'g-card__eyebrow' }, [sk('g-card__sk--eyebrow', { '--_sk-w': '30%' })]) : null,
                h('p', { class: 'g-card__title' }, [sk('g-card__sk--title', { '--_sk-w': '62%' })]),
                plan.subtitle ? h('p', { class: 'g-card__subtitle' }, [sk('', { '--_sk-w': '40%' })]) : null
              ]),
              aside
            ])
            const nd = plan.descriptionLines
            const inlineMedia = media && props.mediaPosition === 'inline' ? media : null
            const content = nd || inlineMedia
              ? h('div', { class: 'g-card__content' }, [
                  inlineMedia,
                  nd ? h('p', { class: 'g-card__description' }, Array.from({ length: nd }, (_, i) => sk('', { '--_sk-w': i === nd - 1 && nd > 1 ? '60%' : '100%' }))) : null
                ])
              : null
            const meta = plan.meta
              ? h('dl', { class: 'g-card__meta' }, Array.from({ length: plan.meta }, () => h('div', [sk('g-card__sk--meta', { '--_sk-w': space(22), inlineSize: space(22) })])))
              : null
            const actions = plan.actions ? h('div', { class: 'g-card__actions' }, Array.from({ length: plan.actions }, () => sk('g-card__sk--btn'))) : null
            return [h('div', { class: 'g-card__stack' }, [header, content, meta]), actions]
          })()
      return {
        media: bleedMedia && media && props.mediaPosition !== 'inline' ? media : null,
        main: h('div', { class: 'g-card__main' }, [
          h('div', { class: 'g-card__skeleton', 'aria-hidden': 'true', inert: '' }, body),
          footer
        ])
      }
    }

    expose({ size, layout })

    return () => {
      const sc = scope()
      const media = nodes(slots.media, sc)
      const hasMedia = media.length > 0
      const pos = props.mediaPosition
      devChecks(hasMedia)
      const tag = TAGS.includes(props.as) ? props.as : 'article'

      let children
      if (props.loading) {
        const s = renderSkeleton(hasMedia, true)
        children = [s.media, s.media && pos === 'background' ? h('div', { class: 'g-card__scrim', 'aria-hidden': 'true' }) : null, s.main]
      } else {
        const actions = nodes(slots.actions, sc)
        checkActions(actions)
        const footer = nodes(slots.footer, { size: size.value })
        const bleed = hasMedia && pos !== 'inline' ? renderMedia(media, false) : null
        const inlineMedia = hasMedia && pos === 'inline' ? renderMedia(media, true) : null
        children = [
          bleed,
          bleed && pos === 'background' ? h('div', { class: 'g-card__scrim', 'aria-hidden': 'true' }) : null,
          h('div', { class: 'g-card__main' }, [
            h('div', { class: 'g-card__body' }, [
              h('div', { class: 'g-card__stack' }, [renderHeader(), renderContent(inlineMedia), ...renderMeta(), ...renderMore()]),
              actions.length ? h('div', { class: 'g-card__actions', inert: props.disabled ? '' : undefined }, actions) : null
            ]),
            footer.length ? h('div', { class: 'g-card__footer', inert: props.disabled ? '' : undefined }, footer) : null
          ])
        ]
      }
      children.push(h('div', { class: 'g-card__live', role: 'status' }, liveText.value))

      const { class: klass, 'aria-labelledby': consumerLabelledby, ...rest } = attrs
      // La raíz se nombra por el título solo si es un article sin principal propia (el control ya da el nombre; card.md «ARIA»)
      const labelledby = consumerLabelledby ?? (tag === 'article' && !hasPrimary.value && !props.loading && hasTitle() && !attrs['aria-label'] ? titleId.value : undefined)
      return h(GSurface, {
        ...rest,
        ref: rootRef,
        as: tag,
        level: props.level,
        padding: props.padding,
        density: props.density,
        rounded: props.rounded,
        id: rootId.value,
        class: cls(
          'g-card',
          `g-card--orientation-${props.orientation}`,
          `g-card--color-${props.color}`,
          hasMedia && `g-card--media-${pos}`,
          `g-card--interaction-${interaction.value}`,
          `g-card--size-${size.value}`,
          `g-card--layout-${layout.value}`,
          props.status && `g-card--status-${props.status}`,
          props.status && 'has-status',
          hasPrimary.value && 'is-interactive',
          selected.value && 'is-selected',
          isCurrent.value && 'is-current',
          props.disabled && 'is-disabled',
          props.loading && 'is-loading',
          props.empty && 'is-empty',
          expanded.value && 'is-expanded',
          klass
        ),
        'data-size': size.value,
        'data-layout': layout.value,
        'aria-labelledby': labelledby,
        'aria-busy': props.loading ? 'true' : undefined
      }, { default: () => children })
    }
  }
})
</script>
