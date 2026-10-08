<script>
// GEmpty · el vacío con causa (dueño: bruno). Contrato: design/contracts/empty.md (DECISIONS.md #529, #530, #537, #542,
// #543) · Estilo: GEmpty.css (coco) · Estructura: design/lab/empty-skeleton/r01/ (kiwi).
// A «el primer hueco»: un elemento en el sitio del primero que llegará (dentro de una GLoadRegion, del alto de un
// elemento: lee --_load-slot de la región). B «la salida con cuentas» (cause="filtered" con filters): cuántas había, qué
// filtro quitar y cuántas vuelven con cada uno, de más a menos. Contenido de flujo: sin role, sin tabindex, sin región
// viva propia; lo anuncia quien lo contiene (GLoadRegion por su título, #533; GTable por labels.results, #265).
// Dentro de una GLoadRegion se registra por inyección (loadRegionKey, compartida por __shared) y, al desmontarse con el
// foco dentro, avisa a la región para que lo recoja (#534). Sin fetch: la aplicación sabe la causa y las cuentas.
import { defineComponent, h, ref, computed, inject, watch, onMounted, onBeforeUnmount } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { loadRegionKey } from '../../utils/loadPhase.js'
import GBtn from '../GBtn/GBtn.vue'
import GIcon from '../GIcon/GLibIcon.js'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const CAUSES = ['none', 'filtered', 'error', 'forbidden']
// Iconos propios por causa (icons.md v0.9): `none` sin icono (el hueco vacío donde irá el primero)
const ICON = { filtered: 'search', error: 'circle-alert', forbidden: 'lock' }

const validLocale = (l) => {
  if (!l) return false
  try { return Intl.NumberFormat.supportedLocalesOf([l]).length > 0 } catch { return false }
}

export default defineComponent({
  name: 'GEmpty',
  props: {
    cause: { type: String, required: true, validator: oneOf(CAUSES) },
    title: { type: String, required: true },
    description: { type: String, default: undefined },
    headingLevel: { type: Number, default: undefined, validator: (v) => Number.isInteger(v) && v >= 2 && v <= 6 },
    filters: { type: Array, default: () => [] },
    total: { type: Number, default: undefined, validator: (v) => v >= 0 },
    locale: { type: String, default: undefined },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['relax', 'clear'],
  setup(props, { emit, slots }) {
    const root = ref(null)
    const warned = new Set()
    const warn = (id, msg) => {
      if (!isDev || warned.has(id)) return
      warned.add(id)
      console.warn(`[Grana] <GEmpty> ${msg}`)
    }

    // ---------- Idioma: prop › lang del ancestro más cercano › navigator.language (al montar; como GNumberField, #310) ----------
    const domLang = ref(null)
    const mounted = ref(false)
    const locale = computed(() => {
      if (validLocale(props.locale)) return props.locale
      if (!mounted.value) return undefined
      const nav = typeof navigator !== 'undefined' ? navigator.language : undefined
      for (const c of [domLang.value, nav]) if (validLocale(c)) return c
      return undefined
    })
    const num = (n) => { try { return new Intl.NumberFormat(locale.value).format(n) } catch { return String(n) } }

    // ---------- La salida (B): solo con cause="filtered" y filtros ----------
    const isFiltered = computed(() => props.cause === 'filtered')
    const exit = computed(() => isFiltered.value && Array.isArray(props.filters) && props.filters.length > 0)
    // Un botón por filtro que devuelve algo, de más a menos (estable ante empates: sort es estable)
    const relaxing = computed(() => (exit.value
      ? props.filters.filter((f) => f && typeof f.count === 'number' && f.count > 0).slice().sort((a, b) => b.count - a.count)
      : []))
    const showClear = computed(() => exit.value && (props.filters.length > 1 || relaxing.value.length === 0))

    // Texto con marcadores: String con {clave} o Function con un objeto (#51). `rich` envuelve cada valor en <bdi>
    // (los nombres de filtro y las cifras aíslan su dirección, #282) cuando el texto es una plantilla.
    const label = (key, vars, rich = {}) => {
      const t = props.labels[key]
      if (typeof t === 'function') return t(vars)
      if (typeof t !== 'string') return ''
      const out = []
      let last = 0
      t.replace(/\{(\w+)\}/g, (m, k, at) => {
        if (at > last) out.push(t.slice(last, at))
        if (rich[k] !== undefined) out.push(rich[k])
        else out.push(vars[k] === undefined || vars[k] === null ? m : String(vars[k]))
        last = at + m.length
        return m
      })
      if (last < t.length) out.push(t.slice(last))
      return out.every((x) => typeof x === 'string') ? out.join('') : out
    }
    const listParts = (names) => {
      try {
        const lf = new Intl.ListFormat(locale.value, { type: 'conjunction' })
        return lf.formatToParts(names).map((p) => (p.type === 'element' ? h('bdi', null, p.value) : p.value))
      } catch {
        return [names.join(', ')]
      }
    }
    const listText = (names) => {
      try { return new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(names) } catch { return names.join(', ') }
    }

    // ---------- Avisos de desarrollo (una vez cada uno, sin contenido de la aplicación) ----------
    const checkWarnings = () => {
      const hasFilters = Array.isArray(props.filters) && props.filters.length > 0
      if (!isFiltered.value && (hasFilters || props.total !== undefined)) {
        warn('not-filtered', 'filters y total solo se usan con cause="filtered": se ignoran.')
      }
      if (exit.value) {
        if (relaxing.value.length && !props.labels.relax) warn('relax', 'la salida ofrece filtros sueltos sin labels.relax (texto del botón «Quitar «{label}»»).')
        if (props.filters.some((f) => f && typeof f.count === 'number') && !props.labels.returns) warn('returns', 'hay filtros con count sin labels.returns (cuántas vuelven, para el lector).')
        if (!props.labels.clear) warn('clear', 'la salida con filters necesita labels.clear («Quitar todos»).')
        if (props.total !== undefined && !props.labels.before) warn('before', 'con total, define labels.before (la traza «Antes había {total}…»).')
      }
      if (isFiltered.value && !hasFilters && !slots.actions) warn('no-exit', 'cause="filtered" sin filters ni slot actions: un vacío por filtro sin salida.')
    }
    watch(() => [props.cause, props.filters, props.total, props.labels], checkWarnings, { immediate: true, deep: true })

    // ---------- Registro en la región que carga (#533, #534) ----------
    const region = inject(loadRegionKey, null)
    const entry = { get title() { return props.title }, get cause() { return props.cause } }
    onMounted(() => {
      mounted.value = true
      domLang.value = root.value?.parentElement?.closest('[lang]')?.getAttribute('lang') || null
      if (region) region.registerEmpty(entry)
    })
    onBeforeUnmount(() => {
      if (!region) return
      const a = typeof document !== 'undefined' ? document.activeElement : null
      region.unregisterEmpty(entry, Boolean(a && root.value && root.value.contains(a)))
    })

    // ---------- Render ----------
    const relaxBtn = (f) => {
      const count = num(f.count)
      const visible = label('relax', { label: f.label }, { label: h('bdi', null, f.label) })
      const sr = typeof props.labels.returns === 'function' ? props.labels.returns({ count: f.count }) : label('returns', { count })
      return h(GBtn, {
        key: `relax-${f.key}`, class: 'g-empty__relax', size: 'sm', variant: 'outline',
        onClick: () => emit('relax', f.key)
      }, () => [
        visible,
        h('span', { class: 'g-empty__count', 'aria-hidden': 'true' }, count),
        sr ? h('span', { class: 'g-empty__sr' }, [' ', sr]) : null
      ])
    }

    return () => {
      const cause = props.cause
      const iconName = ICON[cause]
      const Title = props.headingLevel ? `h${props.headingLevel}` : 'p'
      const names = exit.value ? props.filters.map((f) => String(f?.label ?? '')) : []
      const trace = exit.value && props.total !== undefined && props.labels.before
        ? (typeof props.labels.before === 'function'
            ? props.labels.before({ total: props.total, filters: listText(names) })
            : label('before', { total: num(props.total) }, { filters: listParts(names) }))
        : null
      const actions = []
      if (exit.value) {
        for (const f of relaxing.value) actions.push(relaxBtn(f))
        if (showClear.value) {
          actions.push(h(GBtn, {
            key: 'clear', size: 'sm', variant: relaxing.value.length ? 'ghost' : 'outline',
            onClick: () => emit('clear')
          }, () => label('clear', {})))
        }
      }
      const own = slots.actions ? slots.actions({ cause }) : null
      return h('div', { ref: root, class: ['g-empty', `g-empty--cause-${cause}`, { 'is-exit': exit.value }] }, [
        h('span', { class: 'g-empty__icon', 'aria-hidden': 'true' },
          slots.icon ? slots.icon({ cause }) : iconName ? [h(GIcon, { name: iconName })] : []),
        h('div', { class: 'g-empty__text' }, [
          h(Title, { class: 'g-empty__title', dir: 'auto' }, props.title),
          slots.default
            ? h('div', { class: 'g-empty__description', dir: 'auto' }, slots.default())
            : props.description ? h('p', { class: 'g-empty__description', dir: 'auto' }, props.description) : null,
          trace ? h('p', { class: 'g-empty__trace' }, trace) : null
        ]),
        actions.length || own ? h('div', { class: 'g-empty__actions' }, [...actions, own]) : null
      ])
    }
  }
})
</script>
