<script>
// GAvatar · la cara de una persona o de una entidad en una caja de lado fijo (dueño: bruno). Estilo: GAvatar.css (coco).
// Contrato: design/contracts/avatar.md · DECISIONS.md #293 a #297 · Estructura: design/lab/avatar/r01/ (kiwi).
// Contenido, por orden: imagen (src, mientras no falle) > initials > icon > iniciales de name > icono `user`. El respaldo
// (iniciales o icono) existe SIEMPRE y va primero; la <img alt=""> se apila encima, última hija, solo con src y sin fallo.
// Decorativo por defecto (aria-hidden); con `label`, role="img" + aria-label. Nunca interactivo: sin slots ni eventos;
// role/aria-*/tabindex y escuchas del consumidor no llegan a la raíz (aviso 5).
import { Comment, Fragment, Text, computed, defineComponent, h, inject, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, watch } from 'vue'
import GIcon from '../GIcon/GLibIcon.js'       // icono propio (`user`): SOLO la lista de la librería (icons.md §4, #200)
import GAppIcon from '../GIcon/GIcon.vue'      // prop `icon`: nombre de la aplicación (registro más cercano → librería, #296)
import { iconsKey, lookupLibrary, lookupRegistry } from '../GIcon/registry.js'
import { categoryOf } from '../../utils/categoryHash.js'
import { warnMissingCategory } from '../../utils/categoryToken.js'

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl']
const SHAPES = ['circle', 'square']
const SEMANTIC = new Set(['brand', 'primary', 'accent', 'success', 'warning', 'danger', 'info', 'error'])

// Avisos de desarrollo (avatar.md «Avisos»): una vez por causa y valor
const warned = new Set()
const warnOnce = (key, msg) => {
  try {
    if (process.env.NODE_ENV !== 'production' && !warned.has(key)) {
      warned.add(key)
      console.warn(`[Grana GAvatar] ${msg}`)
    }
  } catch {}
}

// Una cadena vacía (o solo espacios) cuenta como ausente; un número se convierte con String()
const present = (v) => {
  if (v === undefined || v === null || v === false) return undefined
  const s = String(v).trim()
  return s === '' ? undefined : s
}

// ---------- Iniciales (avatar.md «Iniciales») ----------
const LETTER = /^[\p{L}\p{N}]/u
const WIDE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
const SPACE = /^\s+$/u
let segmenter
/** Grafemas con Intl.Segmenter; sin él, puntos de código */
const graphemes = (s) => {
  if (segmenter === undefined) {
    segmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null
  }
  return segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s)
}
// Mayúscula sin configuración regional (SSR estable), solo si sigue siendo un grafema («ß» no pasa a «SS»)
const upper = (g) => {
  const u = g.toUpperCase()
  return graphemes(u).length === 1 ? u : g
}
/** Iniciales derivadas de `name`: primera y última palabra con letra o número; una sola en xs/sm o con escritura ancha */
function deriveInitials(name, max) {
  const picks = []
  for (const word of name.normalize('NFC').trim().split(/\s+/u)) {
    const g = graphemes(word).find((x) => LETTER.test(x))
    if (g) picks.push(g)
  }
  if (!picks.length) return ''
  let chosen = picks.length === 1 ? picks : [picks[0], picks[picks.length - 1]]
  if (max === 1 || chosen.some((g) => WIDE.test(g))) chosen = chosen.slice(0, 1)
  return chosen.map(upper).join('')
}
/** `initials` explícitas: NFC, recorte y sin grafemas de espacio; tal cual (sin mayúsculas). `cut`: superan el máximo absoluto */
function explicitInitials(raw, small) {
  const gs = graphemes(raw.normalize('NFC').trim()).filter((g) => !SPACE.test(g))
  if (!gs.length) return { text: '', cut: false }
  const absMax = gs.slice(0, 2).some((g) => WIDE.test(g)) ? 1 : 2
  return { text: gs.slice(0, small ? 1 : absMax).join(''), cut: gs.length > absMax }
}

// ---------- Dos letras si caben, una si no (avatar.md, #1078) ----------
// Se mide lo que se pinta: ancho de __initials con dos letras frente a la cuerda (circle: 2·√(r² − (cap/2)²) − 2, cap =
// 0,72·font-size; square: lado − 2). Estado compartido creado al usarse (#444): avatares medibles vivos, un lote por tarea
// (todas las lecturas antes de escribir, #964) y un solo escucha de document.fonts que se quita con el último.
const live = new Set()
let queue = null
let readyHooked = false
const remeasure = () => live.forEach(schedule)
function schedule(m) {
  if (!queue) { queue = new Set(); nextTick(flush) }
  queue.add(m)
}
async function flush() {
  const list = [...queue].filter((m) => live.has(m))
  queue = null
  // Sondeo: dos letras y sin data-mono; nextTick es una microtarea, así que nada se pinta entre el sondeo y el resultado
  list.forEach((m) => { m.mono.value = false })
  await nextTick()
  const fits = list.map((m) => {
    const el = m.root.value
    const t = el && el.querySelector(':scope > .g-avatar__initials')
    const side = t ? el.getBoundingClientRect().width : 0
    const w = side && t.getBoundingClientRect().width
    if (!w) return null
    const r = side / 2
    const cap = 0.72 * (parseFloat(getComputedStyle(t).fontSize) || 0)
    return w <= (m.props.shape === 'square' ? side : 2 * Math.sqrt(r * r - cap * cap / 4)) - 2
  })
  list.forEach((m, i) => { if (fits[i] === null) m.box(); else m.mono.value = !fits[i] })
}
function join(m) {
  const f = document.fonts
  if (!f) return live.add(m)
  if (!live.size) f.addEventListener('loadingdone', remeasure)
  live.add(m)
  if (f.status === 'loading' && !readyHooked) {
    readyHooked = true
    f.ready.then(() => { readyHooked = false; remeasure() })
  }
}
function leave(m) {
  if (live.delete(m) && !live.size && document.fonts) document.fonts.removeEventListener('loadingdone', remeasure)
}

// ---------- Color (avatar.md «Hash», #294): FNV-1a 32 bits sobre UTF-8 + fmix32, mod n + 1 ----------
// Una sola copia, compartida con GTag y GTagGroup (#469): utils/categoryHash.js (categoryOf)

// Atributos que no llegan a la raíz (aviso 5): romperían el contrato decorativo / con nombre o harían de un <span> un control
const isA11yAttr = (k) => k === 'role' || /^aria[-A-Z]/.test(k) || k.toLowerCase() === 'tabindex'
const isListener = (k) => /^on[A-Z]/.test(k)
// Contenido real en el slot por defecto (aviso 7): ni comentarios ni solo espacios
const hasContent = (nodes) => (nodes || []).some((n) => {
  if (n == null || typeof n === 'boolean' || n.type === Comment) return false
  if (typeof n === 'string') return n.trim() !== ''
  if (n.type === Text) return String(n.children).trim() !== ''
  if (n.type === Fragment) return hasContent(n.children)
  return true
})

export default defineComponent({
  name: 'GAvatar',
  inheritAttrs: false,
  props: {
    src: { type: String, default: undefined },
    name: { type: String, default: undefined },
    initials: { type: String, default: undefined },
    icon: { type: String, default: undefined },
    size: { type: String, default: 'md', validator: (v) => SIZES.includes(v) },
    shape: { type: String, default: 'circle', validator: (v) => SHAPES.includes(v) },
    // 'neutral' o una categoría 1..12 (número o cadena numérica); lo demás se ignora con el aviso 3 (sin validator: el
    // contrato pide ignorarlo y explicar por qué, no el aviso genérico de Vue)
    color: { type: [String, Number], default: undefined },
    // Cuántas categorías declara el tema (categories: N); fuera de 0..12 o no entero → 0 con el aviso 4
    categories: { type: Number, default: 0 },
    colorKey: { type: [String, Number], default: undefined },
    label: { type: String, default: undefined }
  },
  emits: [],
  setup(props, { attrs, slots }) {
    const registry = inject(iconsKey, null)
    const root = ref(null)
    // La <img> se busca en la raíz (no con un ref de plantilla: al cambiar src la <img> anterior se desmonta DESPUÉS de montar
    // la nueva y su ref la dejaría en null)
    const imgEl = () => (root.value ? root.value.querySelector(':scope > .g-avatar__img') : null)

    const label = computed(() => present(props.label))
    const src = computed(() => present(props.src))
    const small = computed(() => props.size === 'xs' || props.size === 'sm')

    // Respaldo (siempre en el DOM): initials > icon > iniciales de name > `user`
    const content = computed(() => {
      const out = { cutInitials: null, missingIcon: null }
      const ini = present(props.initials)
      if (ini) {
        const r = explicitInitials(ini, small.value)
        if (r.cut) out.cutInitials = ini
        if (r.text) return { ...out, kind: 'initials', text: r.text }
      }
      const icon = present(props.icon)
      if (icon) {
        if ((lookupRegistry(registry, icon) ?? lookupLibrary(icon)) !== undefined) return { ...out, kind: 'icon', name: icon, app: true }
        out.missingIcon = icon
      }
      const name = present(props.name)
      if (name) {
        const text = deriveInitials(name, small.value ? 1 : 2)
        if (text) return { ...out, kind: 'initials', text }
      }
      return { ...out, kind: 'icon', name: 'user', app: false }
    })

    // Dos letras medibles (md, lg, xl): sus grafemas; si no, null y no se mide. La clave de cadena es la única fuente del
    // watch (un arreglo nuevo en cada render mediría en cada render del padre)
    const pair = computed(() => {
      const c = content.value
      const gs = c.kind === 'initials' && !small.value ? graphemes(c.text) : []
      return gs.length === 2 ? gs : null
    })
    const fitKey = computed(() => (pair.value ? `${pair.value.join('')}|${props.size}|${props.shape}` : ''))
    const mono = ref(false)
    let ro = null
    const unbox = () => { if (ro) { ro.disconnect(); ro = null } }
    // Medida 0 (antecesor oculto): no decide; un ResizeObserver de un solo uso vuelve a medir cuando haya caja
    const m = {
      root, mono, props,
      box() {
        if (ro || typeof ResizeObserver !== 'function' || !root.value) return
        ro = new ResizeObserver((e) => { if (e[0].contentRect.width) { unbox(); schedule(m) } })
        ro.observe(root.value)
      }
    }
    const sync = () => {
      if (fitKey.value) { join(m); schedule(m) } else { mono.value = false; unbox(); leave(m) }
    }
    onMounted(sync)
    watch(fitKey, sync, { flush: 'post' })
    onBeforeUnmount(() => { unbox(); leave(m) })

    // Color: 'neutral' gana; k fijo; si no, derivado de colorKey ?? name con `categories`; si no, neutro
    const colorInfo = computed(() => {
      const c = props.color
      if (c === undefined || c === null || c === '') return { kind: 'none' }
      if (c === 'neutral') return { kind: 'neutral' }
      const n = typeof c === 'number' ? c : /^\s*\d+\s*$/.test(c) ? Number(c) : NaN
      if (Number.isInteger(n) && n >= 1 && n <= 12) return { kind: 'cat', k: n }
      return { kind: 'invalid', value: c }
    })
    const categories = computed(() => {
      const n = props.categories
      return Number.isInteger(n) && n >= 0 && n <= 12 ? n : 0
    })
    const cat = computed(() => {
      const c = colorInfo.value
      if (c.kind === 'cat') return c.k
      if (c.kind === 'neutral' || categories.value === 0) return null
      const key = present(props.colorKey) ?? present(props.name)
      return key === undefined ? null : categoryOf(key, categories.value)
    })

    // Imagen: cargando → cargada (load) / fallida (error: se quita la <img>). Cambiar src vuelve a «cargando».
    const status = ref(src.value ? 'loading' : null)
    // Imagen ya en caché al montar o tras hidratar (la `load` pudo ocurrir antes): complete + naturalWidth; si está completa
    // sin tamaño natural, decode() distingue una imagen rota (rechaza) de un SVG sin tamaño intrínseco (resuelve)
    const probe = () => {
      const el = imgEl()
      const want = src.value
      if (!el || !want || status.value !== 'loading' || !el.complete) return
      if (el.naturalWidth > 0) { status.value = 'loaded'; return }
      if (typeof el.decode !== 'function') return
      const settle = (next) => () => { if (src.value === want && status.value === 'loading') status.value = next }
      el.decode().then(settle('loaded'), settle('failed'))
    }
    watch(src, (v) => {
      status.value = v ? 'loading' : null
      if (v) nextTick(probe)
    })
    onMounted(() => {
      probe()
      try { if (process.env.NODE_ENV !== 'production') warnMissingCategory(root.value, cat.value, 'GAvatar') } catch {}
      // Aviso 1: un label dentro de un antecesor aria-hidden no llega al árbol de accesibilidad
      const el = root.value
      try {
        if (process.env.NODE_ENV !== 'production' && label.value && el && el.parentElement && el.parentElement.closest('[aria-hidden="true"]')) {
          warnOnce(`label-hidden:${label.value}`, `<GAvatar label="${label.value}"> está dentro de un elemento aria-hidden (el hueco de un componente es decorativo): el nombre no llega. Pon el nombre en el control que lo envuelve (su texto o aria-label) o en el texto vecino, y deja el avatar sin label.`)
        }
      } catch {}
    })
    onUpdated(() => { try { if (process.env.NODE_ENV !== 'production') warnMissingCategory(root.value, cat.value, 'GAvatar') } catch {} })
    const onLoad = (want) => () => { if (src.value === want) status.value = 'loaded' }
    const onError = (want) => () => { if (src.value === want) status.value = 'failed' }

    return () => {
      const c = content.value
      const col = colorInfo.value
      try {
        if (process.env.NODE_ENV !== 'production') {
          if (c.cutInitials) warnOnce(`initials:${c.cutInitials}`, `initials="${c.cutInitials}" tiene más grafemas que el máximo (2, o 1 con escritura ancha): se cortan.`)
          if (c.missingIcon) warnOnce(`icon:${c.missingIcon}`, `no conoce el icono «${c.missingIcon}»: no está en la lista de la librería ni en el registro de la aplicación; se usa el respaldo (iniciales de name o el icono user). Regístralo importando su cadena de lucide-static: app.use(createIcons([…])).`)
          if (col.kind === 'invalid') {
            const v = String(col.value)
            warnOnce(`color:${v}`, SEMANTIC.has(v)
              ? `color="${v}" se ignora: un avatar no lleva color semántico (un avatar de ese color diría un estado, no una identidad). Usa 'neutral' o una categoría de 1 a 12.`
              : `color="${v}" se ignora: acepta 'neutral' o una categoría de 1 a 12 (número o cadena numérica).`)
          }
          const n = props.categories
          if (!(Number.isInteger(n) && n >= 0 && n <= 12)) warnOnce(`categories:${String(n)}`, `categories=${JSON.stringify(n)} no es un entero de 0 a 12: se trata como 0 (sin color derivado). Pon el mismo número que la entrada categories del tema.`)
          if (slots.default && hasContent(slots.default())) warnOnce('slot', 'no tiene slots: el contenido del slot por defecto no se pinta. Usa src, initials, icon o label.')
        }
      } catch {}

      const own = {}
      for (const [k, v] of Object.entries(attrs)) {
        if (isA11yAttr(k)) {
          try { if (process.env.NODE_ENV !== 'production') warnOnce(`attr:${k}`, `ignora el atributo «${k}»: para un nombre usa la prop label; si el avatar abre algo, envuélvelo en un <button> con su nombre y deja el avatar sin label.`) } catch {}
          continue
        }
        if (isListener(k)) {
          try { if (process.env.NODE_ENV !== 'production') warnOnce(`on:${k}`, `no enlaza la escucha «${k}»: un avatar nunca es interactivo (un <span> con clic no tiene rol ni teclado). Envuélvelo en un <button> con su nombre (o usa label si solo necesita un nombre).`) } catch {}
          continue
        }
        own[k] = v
      }

      const fallback = c.kind === 'initials'
        ? h('span', { class: 'g-avatar__initials', dir: 'auto', translate: 'no' }, mono.value && pair.value ? pair.value[0] : c.text)
        : h(c.app ? GAppIcon : GIcon, { name: c.name, class: 'g-avatar__icon' })
      const s = src.value
      const st = s ? status.value : null
      const img = s && st !== 'failed'
        ? h('img', { key: s, class: 'g-avatar__img', src: s, alt: '', loading: 'lazy', decoding: 'async', draggable: 'false', onLoad: onLoad(s), onError: onError(s) })
        : null
      const named = label.value
      return h('span', {
        ...own,
        ref: root,
        class: [
          'g-avatar',
          `g-avatar--size-${props.size}`,
          `g-avatar--shape-${props.shape}`,
          `g-avatar--content-${c.kind}`,
          { 'is-loading': st === 'loading', 'is-loaded': st === 'loaded', 'is-failed': st === 'failed' },
          own.class
        ],
        'data-cat': cat.value === null ? undefined : String(cat.value),
        // Solo cuando la medida redujo a una letra; el atributo es del componente (gana a uno de la aplicación)
        'data-mono': mono.value ? 'one' : undefined,
        'aria-hidden': named ? undefined : 'true',
        role: named ? 'img' : undefined,
        'aria-label': named || undefined
      }, [fallback, img])
    }
  }
})
</script>
