<script>
// GSummary · ficha de resumen adaptable (dueño: bruno). Estilo: GSummary.css (coco).
// Contrato: design/contracts/summary.md · DECISIONS.md #349 a #357 · Estructura: design/lab/summary/r01 y r02 (kiwi).
// Identidad + título + línea secundaria + datos con prioridad + estado. La cesión es CSS intrínseco (nada con
// display:none: lo que no cabe salta a una línea recortada y se sigue leyendo); el .vue solo CUENTA (measure.js): «+N»,
// data-clipped, data-terse, data-tight, title en lo cortado y data-enter. Esos estados se escriben en el DOM fuera del
// render (sin estado reactivo por dato). Todo es contenido de frase (span, mark): válido dentro de option, button, a y td.
// Sin eventos, sin teclado, sin textos propios.
import { Comment, Fragment, Text, computed, defineComponent, h, onBeforeUnmount, onMounted, onUpdated, useId } from 'vue'
import GAvatar from '../GAvatar/GAvatar.vue'
import GBadge from '../GBadge/GBadge.vue'
import GAppIcon from '../GIcon/GIcon.vue' // prop `icon`: nombre de la aplicación (registro más cercano → librería, #202)
import { oneOf } from '../../utils/oneOf.js'
import { parts } from '../../utils/match.js'
import { attach, detach, touch } from './measure.js'

const LAYOUTS = ['inline', 'row', 'stack']
const SIZES = ['xs', 'sm', 'md', 'lg', 'xl']
const DEFAULT_SIZE = { inline: 'xs', row: 'md', stack: 'lg' }

const isDev = () => typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

// Una cadena vacía (o solo espacios), null y undefined cuentan como ausentes; un número se convierte con String()
const present = (v) => {
  if (v === undefined || v === null || typeof v === 'boolean') return undefined
  const s = String(v).trim()
  return s === '' ? undefined : s
}
// Un slot con solo comentarios o espacios cuenta como ausente
const isEmptyNode = (v) => v.type === Comment || (v.type === Text && !String(v.children ?? '').trim()) || (v.type === Fragment && (!Array.isArray(v.children) || v.children.every(isEmptyNode)))
const slotNodes = (slot, arg) => {
  if (!slot) return null
  const nodes = slot(arg)
  return Array.isArray(nodes) && nodes.some((v) => !isEmptyNode(v)) ? nodes : null
}

// Las partes llevan `key`: la medida escribe atributos en sus elementos (title, data-clipped), que no deben pasar a
// otra parte si Vue reutiliza el elemento al cambiar el contenido
const kids = (list) => list.filter(Boolean)
const sep = (key, text = '; ') => h('span', { key, class: 'g-summary__sep' }, text)
// Coincidencia: primera aparición de cada palabra (sin acentos ni mayúsculas), con <mark>
const marked = (text, q) => (q ? parts(text, q).map((p) => (p.m ? h('mark', { class: 'g-summary__mark' }, p.t) : p.t)) : text)
const onEnterEnd = (e) => {
  if (String(e.animationName || '').startsWith('g-summary-enter') && e.target && e.target.removeAttribute) e.target.removeAttribute('data-enter')
}

export default defineComponent({
  name: 'GSummary',
  props: {
    title: { type: String, default: undefined },
    subtitle: { type: String, default: undefined },
    code: { type: String, default: undefined },
    avatar: { type: [Boolean, Object], default: false },
    icon: { type: String, default: undefined },
    facts: { type: Array, default: () => [] },
    status: { type: Object, default: undefined },
    layout: { type: String, default: 'row', validator: oneOf(LAYOUTS) },
    lines: { type: Number, default: 2 },
    size: { type: String, default: undefined, validator: oneOf(SIZES) },
    diff: { type: Object, default: undefined },
    highlight: { type: String, default: undefined },
    group: Boolean,
    loading: Boolean,
    placeholder: { type: String, default: undefined }
  },
  setup(props, { slots }) {
    const titleId = `${useId()}-title`
    const root = { el: null }
    let rec = null

    // Avisos de desarrollo: una vez por instancia y motivo
    const warned = new Set()
    const warn = (key, msg) => {
      if (!isDev() || warned.has(key)) return
      warned.add(key)
      console.warn(`[Grana GSummary] ${msg}`)
    }

    const layout = computed(() => (LAYOUTS.includes(props.layout) ? props.layout : 'row'))
    // Líneas totales en `row` (título + lo demás): 0 = sin límite; 1, negativos y no enteros no valen (se usa 2)
    const lines = computed(() => {
      if (layout.value !== 'row') {
        if (props.lines !== 2) warn('lines-layout', `lines solo actúa con layout="row": con layout="${layout.value}" se ignora.`)
        return 2
      }
      if (!Number.isInteger(props.lines) || props.lines === 1 || props.lines < 0) {
        warn('lines', `lines debe ser 0 (sin límite) o un entero mayor o igual que 2 (recibió ${props.lines}): se usa 2. Una sola línea es layout="inline".`)
        return 2
      }
      return props.lines
    })
    const multi = computed(() => layout.value === 'row' && (lines.value === 0 || lines.value >= 3))

    // Datos en orden de prioridad (los que la declaran, antes; empates por el orden del arreglo), sin mutar la prop
    const facts = computed(() => {
      const list = []
      const seen = new Set()
      ;(Array.isArray(props.facts) ? props.facts : []).forEach((f, i) => {
        if (!f || typeof f !== 'object') return
        const label = present(f.label)
        if (!label) return warn('fact-label', 'un dato de facts no tiene label: se omite. El rótulo es obligatorio (y es la clave del dato).')
        const value = present(f.value)
        if (value === undefined) return
        if (seen.has(label)) warn(`fact-dup:${label}`, `dos datos de facts comparten el label «${label}»: se pintan los dos, pero diff es ambiguo.`)
        seen.add(label)
        const p = typeof f.priority === 'number' && !Number.isNaN(f.priority) ? f.priority : Infinity
        list.push({ label, shown: present(f.short) ?? label, value, bare: f.bare === true, p, i })
      })
      return list.sort((a, b) => (a.p === b.p ? a.i - b.i : a.p < b.p ? -1 : 1))
    })
    const diff = computed(() => {
      const out = {}
      if (!props.diff || typeof props.diff !== 'object') return out
      for (const [k, v] of Object.entries(props.diff)) {
        if (v === 'same' || v === 'diff') out[k] = v
        else if (v != null) warn(`diff:${k}`, `diff['${k}'] vale «${v}»: solo se admiten 'same' y 'diff'. Se ignora esa clave.`)
      }
      return out
    })

    // ---------- Medida (cliente): ni con loading ni en stack, que no recorta ----------
    const measurable = () => !props.loading && layout.value !== 'stack'
    const start = () => {
      rec = attach(root.el, {
        multi: multi.value,
        onZero: () => warn('zero', 'mide 0 de ancho: la ficha no aporta ancho a su anfitrión (contain: inline-size). Dale sitio: min en la columna de GTable, min-inline-size o flex: 1 en una fila flex.')
      })
    }
    onMounted(() => { if (root.el && measurable()) start() })
    onUpdated(() => {
      if (!root.el) return
      if (!measurable()) {
        if (rec) { detach(rec, true); rec = null }
      } else if (!rec) start()
      else { rec.multi = multi.value; touch(rec) }
    })
    onBeforeUnmount(() => { if (rec) { detach(rec, false); rec = null } })

    return () => {
      const L = layout.value
      const S = SIZES.includes(props.size) ? props.size : DEFAULT_SIZE[L]
      const n = lines.value
      const title = present(props.title)
      const subtitle = present(props.subtitle)
      const empty = !title && !props.loading
      const attrs = {
        ref: (el) => { root.el = el },
        class: ['g-summary', `g-summary--layout-${L}`, `g-summary--size-${S}`, { 'g-summary--multi': multi.value, 'g-summary--free': L === 'row' && n === 0, 'is-loading': props.loading, 'is-empty': empty }]
      }
      const leadSlot = slotNodes(slots.lead, { size: S })
      const hasLead = !!(leadSlot || props.avatar || present(props.icon))
      const lead = (inner) => h('span', { class: 'g-summary__lead', 'aria-hidden': 'true' }, inner)

      // ---------- Carga: formas decorativas del alto del layout; sin contenido ni medida ----------
      if (props.loading) {
        if (L === 'row') attrs.style = { '--_lines': n === 0 ? 1 : n - 1 }
        attrs['aria-busy'] = 'true'
        return h('span', attrs, kids([
          hasLead ? lead(h('span', { class: 'g-summary__bone' })) : null,
          h('span', { class: 'g-summary__body', 'aria-hidden': 'true' }, kids([
            h('span', { class: 'g-summary__head' }, h('span', { class: 'g-summary__bone' })),
            L !== 'inline' ? h('span', { class: 'g-summary__data' }, h('span', { class: 'g-summary__bone' })) : null
          ]))
        ]))
      }

      const actionSlot = slotNodes(slots.action)
      if (actionSlot && L !== 'stack') warn('action', `el slot action solo se pinta con layout="stack": en "${L}" el anfitrión es lo accionable.`)
      if (props.group && !title) warn('group', 'group necesita title: es el nombre del grupo (aria-labelledby).')

      // Hueco inicial: slot lead › avatar › icon. La identidad es decorativa (el título ya nombra)
      let leadNode = null
      if (leadSlot) leadNode = lead(leadSlot)
      else if (props.avatar) {
        const own = typeof props.avatar === 'object' ? props.avatar : {}
        leadNode = lead(h(GAvatar, { ...own, name: present(own.name) ?? title, size: S, label: undefined }))
      } else if (present(props.icon)) leadNode = lead(h(GAppIcon, { name: props.icon }))

      // ---------- Vacío: el marcador en el sitio del título, o nada (con aviso) ----------
      if (empty) {
        const placeholder = present(props.placeholder)
        if (!placeholder) {
          warn('empty', 'no tiene title, placeholder ni loading: la ficha está vacía y no pinta nada.')
          return h('span', attrs)
        }
        return h('span', attrs, kids([
          leadNode,
          h('span', { class: 'g-summary__body' }, h('span', { class: 'g-summary__head' }, h('span', { class: 'g-summary__name' }, h('span', { class: 'g-summary__title', dir: 'auto' }, placeholder))))
        ]))
      }

      if (props.group) { attrs.role = 'group'; attrs['aria-labelledby'] = titleId }
      attrs.onAnimationend = onEnterEnd
      attrs.onAnimationcancel = onEnterEnd

      const q = present(props.highlight)
      const code = present(props.code)
      const all = facts.value
      // Identificador: `code` si lo hay; si no, el dato de mayor prioridad
      const anchor = code ? null : all[0]
      const rest = anchor ? all.slice(1) : all
      // Líneas de datos: en `row`, las totales menos la cabecera y, con varias, menos la línea secundaria
      if (L === 'row') attrs.style = { '--_lines': n === 0 ? 1 : Math.max(1, n - 1 - (multi.value && subtitle ? 1 : 0)) }

      const d = diff.value
      const fact = (f, isAnchor) => h('span', { key: `${f.label}\u0000${f.i}`, class: ['g-summary__fact', { 'is-anchor': isAnchor, 'is-bare': f.bare }, d[f.label] ? `is-${d[f.label]}` : null] }, [
        h('span', { class: 'g-summary__fact-label', dir: 'auto' }, f.shown),
        ' ',
        h('span', { class: 'g-summary__fact-value', dir: 'auto' }, marked(f.value, q)),
        sep('fs')
      ])

      const statusSlot = slotNodes(slots.status)
      const statusLabel = props.status ? present(props.status.label) : undefined
      if (props.status && !statusLabel && !statusSlot) warn('status', 'status necesita label (o el slot status): no se pinta.')
      const status = statusSlot || (statusLabel ? h(GBadge, { color: present(props.status.color) ?? 'neutral', size: 'sm' }, () => statusLabel) : null)

      return h('span', attrs, kids([
        leadNode,
        h('span', { class: 'g-summary__body' }, kids([
          h('span', { key: 'h', class: 'g-summary__head' }, kids([
            h('span', { key: 'n', class: 'g-summary__name' }, [
              ...(code ? [h('span', { key: 'c', class: 'g-summary__code', dir: 'auto' }, marked(code, q)), sep('cs', ' ')] : []),
              h('span', { key: 't', class: 'g-summary__title', id: titleId, dir: 'auto' }, marked(title, q)),
              sep('ts')
            ]),
            status ? h('span', { key: 'st', class: 'g-summary__status' }, [status, sep('ss')]) : null
          ])),
          ...(subtitle ? [h('span', { key: 's', class: 'g-summary__subtitle', dir: 'auto' }, marked(subtitle, q)), sep('sub')] : []),
          all.length
            ? h('span', { key: 'd', class: 'g-summary__data' }, kids([
              h('span', { class: 'g-summary__flow' }, kids([
                anchor ? fact(anchor, true) : null,
                rest.length ? h('span', { class: 'g-summary__facts' }, rest.map((f) => fact(f, false))) : null
              ])),
              // «+N»: decorativa (el lector ya recibe todos los datos). La cifra y `hidden` los escribe la medida
              rest.length && L !== 'stack' ? h('span', { class: 'g-summary__more', 'aria-hidden': 'true', hidden: true }) : null
            ]))
            : null
        ])),
        actionSlot && L === 'stack' ? h('span', { class: 'g-summary__action' }, actionSlot) : null
      ]))
    }
  }
})
</script>
