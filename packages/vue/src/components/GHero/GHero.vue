<script>
// GHero · la apertura de un sitio (dueño: bruno)
// Contrato: design/contracts/hero.md (DECISIONS.md #725 a #729, #742, #744, #745; remates #755, #756, #759) · Estructura:
// design/lab/hero/r01/ (kiwi) · Estilo: GHero.css (coco; design/lab/hero/estilo.md). Entrada propia @grana/vue/hero (#742).
// A · La ventana (por defecto): la foto en el vano (span.g-hero__frame, #755) con el detalle fuera del marco. C · El umbral:
// tarjeta con el slot `consult` antes de las acciones. B · Vistas a elegir: placa con data-g-zone="brand" fija y radios
// nativos (data-g-key-focus); cada vista es un img ESTABLE que cambia de clase (con un nodo nuevo no hay fundido) y las no
// elegidas no piden su foto hasta el `load` (o `error`) de la principal. El vídeo es de la aplicación (slot `media`): el
// héroe llama a play()/pause() y arranca en pausa con movimiento reducido; la pausa tiene nombre constante (labels.pause en
// texto oculto, #756) y estado por aria-pressed. Puro (#444): nada al importar.
import { computed, defineComponent, getCurrentInstance, h, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import GIcon from '../GIcon/GLibIcon.js'
import { useKeyFocus } from '../../utils/keyFocus.js'

const APPEARANCES = ['window', 'views', 'threshold']
const has = (v) => typeof v === 'string' && v.trim() !== ''
const isVideo = (nodes) => {
  for (const v of nodes || []) {
    if (!v) continue
    if (v.type === 'video') return true
    if (Array.isArray(v.children) && isVideo(v.children)) return true
  }
  return false
}

export default defineComponent({
  name: 'GHero',
  props: {
    title: { type: String, default: undefined },
    eyebrow: { type: String, default: undefined },
    lead: { type: String, default: undefined },
    aside: { type: String, default: undefined },
    headingLevel: { type: Number, default: 1, validator: (v) => v === 1 || v === 2 },
    appearance: { type: String, default: 'window', validator: (v) => APPEARANCES.includes(v) },
    media: { type: Object, default: undefined },
    detail: { type: Object, default: undefined },
    frame: { type: String, default: 'arch', validator: (v) => v === 'arch' || v === 'rect' },
    look: { type: Boolean, default: true },
    views: { type: Array, default: () => [] },
    view: { type: [String, Number], default: undefined },
    paused: { type: Boolean, default: undefined },
    priority: { type: Boolean, default: undefined },
    labels: { type: Object, default: () => ({}) },
    id: { type: String, default: undefined }
  },
  emits: ['update:view', 'update:paused'],
  setup(props, { emit, slots, attrs }) {
    const uid = useId()
    const base = computed(() => props.id || `g-hero-${uid}`)
    const inst = getCurrentInstance()
    const passed = (k) => {
      const p = (inst && inst.vnode.props) || {}
      return k in p || k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`) in p
    }
    const warned = new Set()
    const warn = (key, text) => {
      try {
        if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
          warned.add(key)
          console.warn(`[Grana GHero] ${text}`)
        }
      } catch {}
    }

    // Vistas de B: de 2 a 4 (con una, se pinta como A; con cinco o más, las cuatro primeras; aviso 7)
    const list = computed(() => (Array.isArray(props.views) ? props.views.filter((v) => v && typeof v === 'object').slice(0, 4) : []))
    const mode = computed(() => {
      const a = APPEARANCES.includes(props.appearance) ? props.appearance : 'window'
      return a === 'views' && list.value.length < 2 ? 'window' : a
    })
    const isViews = computed(() => mode.value === 'views')
    const level = computed(() => (props.headingLevel === 2 ? 2 : 1))
    const prio = computed(() => (props.priority === undefined ? level.value === 1 : props.priority))

    // Vista elegida: v-model:view o interna
    const local = ref(undefined)
    const currentIndex = computed(() => {
      const want = props.view !== undefined ? props.view : local.value
      const i = list.value.findIndex((v) => v.value === want)
      return i < 0 ? 0 : i
    })
    function choose(i) {
      const v = list.value[i]
      if (!v) return
      requested.value = new Set([...requested.value, i])
      local.value = v.value
      emit('update:view', v.value)
    }
    // Carga diferida de las capas (H-L5): sin src hasta el load o error de la principal; la elegida antes, al instante
    const loaded = ref(false)
    const requested = ref(new Set())
    const onMainDone = (i) => { if (i === currentIndex.value || i === undefined) loaded.value = true }

    // ---------- Vídeo y pausa ----------
    const reduced = ref(false)
    const localPaused = ref(undefined)
    const isPaused = computed(() => (props.paused !== undefined ? props.paused : localPaused.value !== undefined ? localPaused.value : reduced.value))
    const mediaEl = ref(null)
    const videoEl = () => (mediaEl.value ? mediaEl.value.querySelector('video') : null)
    function applyVideo() {
      const v = videoEl()
      if (!v) return
      if (isPaused.value) v.pause()
      else {
        const p = v.play && v.play()
        if (p && typeof p.catch === 'function') p.catch(() => {})
      }
    }
    function toggleMotion() {
      const next = !isPaused.value
      localPaused.value = next
      emit('update:paused', next)
    }
    watch(isPaused, applyVideo, { flush: 'post' })

    const keyFocus = useKeyFocus(() => isViews.value)
    let mql = null
    const onMql = (e) => { reduced.value = e.matches }
    onMounted(() => {
      if (typeof window !== 'undefined' && window.matchMedia) {
        mql = window.matchMedia('(prefers-reduced-motion: reduce)')
        reduced.value = mql.matches
        if (mql.addEventListener) mql.addEventListener('change', onMql)
      }
      // La principal ya cargada (caché, hidratación)
      const main = mediaEl.value && mediaEl.value.querySelector('img.g-hero__img')
      if (main && main.complete && main.getAttribute('src')) loaded.value = true
      const v = videoEl()
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (v && (v.autoplay || v.hasAttribute('autoplay'))) warn('autoplay', 'el <video> del slot media lleva autoplay: el héroe llama a play() (aviso 9).')
          if (v && !has(props.labels && props.labels.pause)) warn('pause', 'vídeo sin labels.pause (aviso 10).')
          const doc = mediaEl.value && mediaEl.value.ownerDocument
          const root = inst && inst.proxy && inst.proxy.$el
          if (doc && level.value === 1) {
            const others = [...doc.querySelectorAll('h1')].filter((x) => !(root && root.contains && root.contains(x)))
            if (others.some((x) => x.closest('.g-page-header'))) warn('h1-page-header', 'un héroe y un encabezado de página no conviven (aviso 4).')
            else if (others.length) warn('h1', 'hay otro h1 en el documento (aviso 4).')
          }
          if (doc && prio.value && doc.querySelectorAll('img.g-hero__img[fetchpriority="high"]').length > 1) warn('priority', 'más de un GHero con priority (aviso 5).')
        }
      } catch {}
      applyVideo()
    })
    onBeforeUnmount(() => { if (mql && mql.removeEventListener) mql.removeEventListener('change', onMql) })

    // ---------- Avisos de props ----------
    const checkMedia = (m, what, needAlt) => {
      try {
        if (process.env.NODE_ENV !== 'production' && m && typeof m === 'object') {
          if (!(m.width > 0 && m.height > 0)) warn(`size:${what}`, `${what} sin width/height: reservan el hueco de la foto (aviso 2).`)
          if (needAlt ? !has(m.alt) : !has(m.alt) && !m.decorative) warn(`alt:${what}`, `${what} sin alt${needAlt ? '' : ' ni decorative'}: se pinta con alt="" (aviso 3).`)
        }
      } catch {}
    }
    watch(() => [props.title, props.media, props.views, props.appearance, props.detail, props.labels], () => {
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (!has(props.title)) warn('title', 'falta title (aviso 1).')
          if (mode.value !== 'views') checkMedia(props.media, 'media', false)
          const a = props.appearance
          if (a !== 'window') {
            for (const k of ['frame', 'look', 'detail']) if (passed(k)) warn(`out:${k}`, `${k} solo vale con appearance="window": se ignora (aviso 6).`)
          }
          if (a !== 'views' && passed('views')) warn('out:views', 'views solo vale con appearance="views": se ignora (aviso 6).')
          if (a !== 'threshold' && slots.consult) warn('out:consult', 'el slot consult solo vale con appearance="threshold": se ignora (aviso 6).')
          if (a === 'views') {
            const vs = Array.isArray(props.views) ? props.views : []
            const values = vs.map((v) => v && v.value)
            if (vs.length < 2 || vs.length > 4 || new Set(values).size !== values.length) warn('views', `views necesita de 2 a 4 entradas con value único (llegaron ${vs.length}; aviso 7).`)
            if (!has(props.labels && props.labels.views)) warn('labels.views', 'appearance="views" sin labels.views: el legend queda vacío (aviso 8).')
            vs.slice(0, 4).forEach((v, i) => checkMedia(v && v.media, `views[${i}].media`, true))
          }
        }
      } catch {}
    }, { immediate: true })

    // ---------- Marcado ----------
    const imgAttrs = (m, { main = false, alt = '' } = {}) => ({
      src: m.src,
      srcset: m.srcset || undefined,
      sizes: m.sizes || undefined,
      width: m.width,
      height: m.height,
      alt,
      loading: 'eager',
      fetchpriority: main && prio.value ? 'high' : undefined,
      decoding: 'async'
    })
    const altOf = (m) => (m && has(m.alt) && !m.decorative ? m.alt : '')

    return () => {
      const titleId = `${base.value}-title`
      const a = mode.value
      const L = props.labels || {}
      const textOr = (name) => {
        const s = slots[name] ? slots[name]() : null
        const v = s && s.length ? s : (has(props[name]) ? props[name] : null)
        return v ? h('p', { class: `g-hero__${name}`, dir: 'auto' }, v) : null
      }
      const actions = slots.actions ? slots.actions() : null
      const content = h('div', { class: 'g-hero__content' }, [
        textOr('eyebrow'),
        h(`h${level.value}`, { class: 'g-hero__title', id: titleId, dir: 'auto' }, props.title),
        textOr('lead'),
        a === 'threshold' && slots.consult ? h('div', { class: 'g-hero__consult' }, slots.consult()) : null,
        actions && actions.length ? h('div', { class: 'g-hero__actions' }, actions) : null,
        textOr('aside'),
        a === 'views'
          ? h('fieldset', { class: 'g-hero__views' }, [
              h('legend', { class: 'g-hero__views-legend' }, has(L.views) ? L.views : ''),
              ...list.value.map((v, i) => h('label', { key: `v-${String(v.value)}`, class: ['g-hero__view', { 'is-current': i === currentIndex.value }] }, [
                h('input', {
                  class: 'g-hero__view-input',
                  type: 'radio',
                  name: `${base.value}-view`,
                  value: String(i),
                  checked: i === currentIndex.value,
                  onChange: () => choose(i),
                  onFocus: keyFocus.onFocus,
                  onBlur: keyFocus.onBlur
                }),
                v.media && v.media.src ? h('img', { class: 'g-hero__view-thumb', src: v.media.src, alt: '', width: v.media.width, height: v.media.height, loading: 'eager', decoding: 'async' }) : null,
                h('span', { class: 'g-hero__view-label', dir: 'auto' }, v.label)
              ]))
            ])
          : null
      ])

      // Media
      const mediaSlot = slots.media ? slots.media() : null
      const video = Boolean(mediaSlot && mediaSlot.length && isVideo(mediaSlot))
      const kids = []
      let credit = null
      if (a === 'views' && !(mediaSlot && mediaSlot.length)) {
        const cur = currentIndex.value
        list.value.forEach((v, i) => {
          const m = v.media || {}
          const on = i === cur
          const go = on || loaded.value || requested.value.has(i)
          kids.push(h('img', {
            key: `l-${String(v.value)}`,
            class: on ? 'g-hero__img is-current' : 'g-hero__layer',
            src: go ? m.src : undefined,
            srcset: go ? m.srcset || undefined : undefined,
            sizes: m.sizes || undefined,
            width: m.width,
            height: m.height,
            alt: on ? altOf(m) : '',
            'aria-hidden': on ? undefined : 'true',
            loading: 'eager',
            fetchpriority: on && i === 0 && prio.value ? 'high' : (!on && go ? 'low' : undefined),
            decoding: 'async',
            onLoad: () => onMainDone(i),
            onError: () => onMainDone(i)
          }))
        })
        const cm = list.value[cur] && list.value[cur].media
        if (cm && has(cm.credit)) credit = cm.credit
      } else {
        const m = props.media || (list.value[0] && list.value[0].media)
        let main = null
        if (mediaSlot && mediaSlot.length) main = mediaSlot
        else if (m && m.src) main = h('img', { class: 'g-hero__img', ...imgAttrs(m, { main: true, alt: altOf(m) }), onLoad: () => onMainDone(), onError: () => onMainDone() })
        if (main) kids.push(a === 'window' ? h('span', { class: 'g-hero__frame' }, main) : main)
        if (a === 'window' && props.detail && props.detail.src) {
          const d = props.detail
          kids.push(h('img', { class: 'g-hero__detail', src: d.src, srcset: d.srcset || undefined, sizes: d.sizes || undefined, width: d.width, height: d.height, alt: '', 'aria-hidden': 'true', loading: 'eager', decoding: 'async' }))
        }
        if (m && has(m.credit)) credit = m.credit
      }
      if (video) {
        kids.push(h('button', { class: 'g-hero__motion', type: 'button', 'aria-pressed': isPaused.value ? 'true' : 'false', onClick: toggleMotion }, [
          h(GIcon, { name: isPaused.value ? 'play' : 'pause' }),
          h('span', { class: 'g-hero__motion-label' }, has(L.pause) ? L.pause : '')
        ]))
      }
      if (credit) kids.push(h('figcaption', { class: 'g-hero__credit', dir: 'auto' }, credit))
      const figure = h('figure', { class: 'g-hero__media', ref: mediaEl }, kids)

      const named = attrs['aria-label'] || attrs['aria-labelledby']
      const cls = [
        'g-hero',
        `g-hero--appearance-${a}`,
        a === 'window' && `g-hero--frame-${props.frame === 'rect' ? 'rect' : 'arch'}`,
        a === 'window' && props.detail && props.detail.src && 'g-hero--has-detail',
        video && 'g-hero--has-video',
        a === 'window' && props.look && 'g-hero--look',
        video && isPaused.value && 'is-paused'
      ].filter(Boolean)
      const front = a === 'threshold'
        ? h('div', { class: 'g-hero__card' }, [content])
        : a === 'views'
          ? h('div', { class: 'g-hero__plate', 'data-g-zone': 'brand' }, [content])
          : content
      return h('section', { class: cls, 'aria-labelledby': named ? undefined : titleId }, [front, figure])
    }
  }
})
</script>
