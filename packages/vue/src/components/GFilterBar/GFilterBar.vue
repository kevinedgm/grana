<script>
// GFilterBar · filtros por campo con reglas, al estilo Stripe (dueño: bruno)
// Contrato: design/contracts/filter-bar.md · Estilo: GFilterBar.css (coco) · Estructura: design/lab/table/r02/.
// Chips sugeridos y «Agregar filtro» (GMenu) abren un editor de regla + valor: popover no modal en la capa superior
// (posición con utils/anchor.js) o, por debajo de space × 130, hoja con GDialog (como GHelper, DECISIONS.md #103).
// Produce `filters` ({ key, op, value }); Y entre filtros, O dentro de un enum. El motor vive en utils/filters.js.
import { defineComponent, h, ref, computed, nextTick, onBeforeUnmount, useId } from 'vue'
import { OPS, parseValue, summarize } from '../../utils/filters.js'
import { placeAround, viewport } from '../../utils/anchor.js'
import { fill } from '../../utils/template.js'
import GIcon from '../GIcon/GIcon.vue'
import GMenu from '../GMenu/GMenu.vue'
import GBtn from '../GBtn/GBtn.vue'
import GDialog from '../GDialog/GDialog.vue'

const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'
const SHEET_UNITS = 130
const toPx = (value) => {
  const n = parseFloat(value)
  if (Number.isNaN(n)) return NaN
  if (/rem\s*$|em\s*$/.test(value)) return n * parseFloat(getComputedStyle(document.documentElement).fontSize)
  return n
}
const locale = () => (typeof document !== 'undefined' && document.documentElement.lang) || undefined

export default defineComponent({
  name: 'GFilterBar',
  props: {
    fields: { type: Array, default: () => [] },
    filters: { type: Array, default: () => [] },
    count: { type: Number, default: undefined },
    labels: { type: Object, default: () => ({}) }
  },
  emits: ['update:filters'],
  setup(props, { emit }) {
    const uid = useId()
    const root = ref(null)
    const editorEl = ref(null)
    const addBtn = ref(null)
    const menuOpen = ref(false)
    const live = ref('')
    // Editor: { key, presentation: 'popover' | 'sheet' } + borrador
    const editing = ref(null)
    const draftOp = ref('')
    const draftRaw = ref('')
    const draftError = ref('')
    let anchorEl = null

    if (isDev) {
      const missing = ['group', 'add', 'clear', 'filterBy', 'edit', 'remove', 'apply', 'cancel', 'required', 'ops'].filter((k) => !props.labels[k])
      if (missing.length) console.warn(`[Grana] <GFilterBar> faltan textos en labels (${missing.join(', ')}).`)
    }

    const filterable = computed(() => props.fields.filter((f) => f.filter && OPS[f.filter.type]))
    const fieldOf = (key) => filterable.value.find((f) => f.key === key)
    const applied = computed(() => props.filters.filter((f) => fieldOf(f.key)))
    const isApplied = (key) => applied.value.some((f) => f.key === key)
    const summaryOf = (f) => summarize(fieldOf(f.key), f, props.labels, locale())
    const announce = (filters) => {
      if (props.labels.results && props.count !== undefined) nextTick(() => { live.value = fill(props.labels.results, { count: props.count }) })
      return filters
    }
    const commit = (filters) => emit('update:filters', announce(filters))

    // ---------- Editor ----------
    const spaceUnit = () => (root.value ? toPx(getComputedStyle(root.value).getPropertyValue('--g-space-1')) : NaN)
    const focusBack = (key) => nextTick(() => {
      const chip = key && root.value?.querySelector(`[data-key="${key}"] .g-filter-bar__edit`)
      const anchorAlive = anchorEl && anchorEl.isConnected ? anchorEl : null
      ;(chip || anchorAlive || addBtn.value)?.focus?.()
    })
    const outside = (e) => {
      if (!editing.value || editing.value.presentation !== 'popover') return
      if (editorEl.value?.contains(e.target) || anchorEl?.contains?.(e.target)) return
      closeEditor(false)
    }
    const stopListening = () => document.removeEventListener('pointerdown', outside, true)
    const placeEditor = () => {
      const el = editorEl.value
      if (!el || !anchorEl) return
      const { width: vw, height: vh } = viewport()
      const space = spaceUnit()
      const pad = Number.isNaN(space) ? 8 : space * 2
      const r = placeAround(anchorEl.getBoundingClientRect(), { width: el.offsetWidth, height: el.offsetHeight, vw, vh, placement: 'bottom-start', pad, gap: pad })
      el.style.setProperty('--_x', `${r.x}px`)
      el.style.setProperty('--_y', `${r.y}px`)
      el.style.setProperty('--_max', `${Math.max(0, r.room)}px`)
    }
    const focusFirst = () => {
      const scope = editing.value?.presentation === 'sheet' ? document.getElementById(`${uid}-sheet`) : editorEl.value
      scope?.querySelector('select, input')?.focus()
    }

    function openEditor(key, anchor) {
      const field = fieldOf(key)
      if (!field) return
      const cur = props.filters.find((f) => f.key === key)
      const type = field.filter.type
      anchorEl = anchor
      draftOp.value = cur ? cur.op : OPS[type][0]
      draftRaw.value = cur ? (Array.isArray(cur.value) ? cur.value.map(String) : String(cur.value)) : type === 'enum' ? [] : draftOp.value === 'between' ? ['', ''] : ''
      draftError.value = ''
      const space = spaceUnit()
      const sheet = !Number.isNaN(space) && viewport().width < space * SHEET_UNITS
      editing.value = { key, presentation: sheet ? 'sheet' : 'popover' }
      nextTick(() => {
        if (!sheet) {
          const el = editorEl.value
          if (el && typeof el.showPopover === 'function' && !el.matches?.(':popover-open')) el.showPopover()
          placeEditor()
          document.addEventListener('pointerdown', outside, true)
        }
        nextTick(focusFirst)
      })
    }
    function closeEditor(returnFocus = true, key = editing.value?.key) {
      const el = editorEl.value
      if (el && typeof el.hidePopover === 'function' && el.matches?.(':popover-open')) el.hidePopover()
      stopListening()
      editing.value = null
      if (returnFocus) focusBack(key)
    }
    onBeforeUnmount(stopListening)

    const setOp = (op) => {
      draftOp.value = op
      draftError.value = ''
      const type = fieldOf(editing.value.key).filter.type
      if (type !== 'enum') draftRaw.value = op === 'between' ? ['', ''] : ''
    }
    function apply() {
      const key = editing.value.key
      const field = fieldOf(key)
      const r = parseValue(field.filter.type, draftOp.value, draftRaw.value)
      if (r.error) { draftError.value = r.error === 'range' ? props.labels.range || props.labels.required : props.labels.required; return }
      const next = props.filters.filter((f) => f.key !== key)
      const i = props.filters.findIndex((f) => f.key === key)
      const filter = { key, op: draftOp.value, value: r.value }
      if (i < 0) next.push(filter)
      else next.splice(i, 0, filter)
      closeEditor(false)
      commit(next)
      focusBack(key)
    }
    const onEditorKeydown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeEditor(true) }
      if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox') { e.preventDefault(); apply() }
    }

    // ---------- Quitar y limpiar ----------
    function remove(key) {
      const i = applied.value.findIndex((f) => f.key === key)
      commit(props.filters.filter((f) => f.key !== key))
      nextTick(() => {
        const chips = root.value?.querySelectorAll('.g-filter-bar__edit') || []
        ;(chips[Math.min(i, chips.length - 1)] || addBtn.value)?.focus?.()
      })
    }
    function clear() {
      commit([])
      nextTick(() => addBtn.value?.focus())
    }

    // ---------- Render ----------
    const editorBody = () => {
      const field = fieldOf(editing.value.key)
      const type = field.filter.type
      const L = props.labels
      const ops = OPS[type]
      const id = (s) => `${uid}-${s}`
      const input = (name, value, onInput, typeAttr) => h('input', {
        id: id(name), class: 'g-filter-bar__input',
        type: typeAttr, value, inputmode: typeAttr === 'number' ? 'decimal' : undefined,
        'aria-invalid': draftError.value ? 'true' : undefined,
        'aria-describedby': draftError.value ? id('error') : undefined,
        onInput: (e) => { onInput(e.target.value); draftError.value = '' }
      })
      const inputType = type === 'date' && draftOp.value !== 'last' ? 'date' : type === 'number' || draftOp.value === 'last' ? 'number' : 'text'
      let value
      if (type === 'enum') {
        value = h('fieldset', { class: 'g-filter-bar__value' }, [
          h('legend', { class: 'g-filter-bar__sr' }, field.label),
          ...(field.filter.options || []).map((o) => {
            const v = typeof o === 'object' ? o.value : o
            const t = typeof o === 'object' ? o.label : o
            return h('label', [h('input', {
              type: 'checkbox', value: v, checked: draftRaw.value.includes(String(v)) || draftRaw.value.includes(v),
              onChange: (e) => {
                const set = new Set(draftRaw.value)
                e.target.checked ? set.add(v) : (set.delete(v), set.delete(String(v)))
                draftRaw.value = [...set]
                draftError.value = ''
              }
            }), ' ', t])
          })
        ])
      } else if (draftOp.value === 'between') {
        value = h('div', { class: 'g-filter-bar__value g-filter-bar__range' }, [
          h('label', { class: 'g-filter-bar__sr', for: id('from') }, L.from),
          input('from', draftRaw.value[0], (v) => { draftRaw.value = [v, draftRaw.value[1]] }, inputType),
          h('label', { class: 'g-filter-bar__sr', for: id('to') }, L.to),
          input('to', draftRaw.value[1], (v) => { draftRaw.value = [draftRaw.value[0], v] }, inputType)
        ])
      } else {
        value = h('div', { class: 'g-filter-bar__value' }, [
          h('label', { class: 'g-filter-bar__sr', for: id('value') }, draftOp.value === 'last' ? fill(L.days, { n: '' }).trim() || L.value : L.value),
          input('value', draftRaw.value, (v) => { draftRaw.value = v }, inputType)
        ])
      }
      return [
        ops.length > 1 ? h('label', { class: 'g-filter-bar__sr', for: id('rule') }, L.rule) : null,
        ops.length > 1 ? h('select', { id: id('rule'), class: 'g-filter-bar__rule', value: draftOp.value, onChange: (e) => setOp(e.target.value) },
          ops.map((op) => h('option', { value: op, selected: op === draftOp.value }, (L.ops || {})[op] || op))) : null,
        value,
        h('p', { id: id('error'), class: 'g-filter-bar__error', 'aria-live': 'assertive' }, draftError.value)
      ]
    }
    const editorActions = () => [
      h(GBtn, { variant: 'ghost', size: 'sm', onClick: () => closeEditor(true) }, () => props.labels.cancel),
      h(GBtn, { size: 'sm', onClick: apply }, () => props.labels.apply)
    ]

    return () => {
      const L = props.labels
      const kids = []
      applied.value.forEach((f) => {
        const s = summaryOf(f)
        const field = fieldOf(f.key)
        const rest = s.slice(field.label.length)
        kids.push(h('span', { class: 'g-filter-bar__chip', key: `c-${f.key}`, 'data-key': f.key }, [
          h('button', { type: 'button', class: 'g-filter-bar__edit', 'aria-haspopup': 'dialog', 'aria-label': fill(L.edit, { summary: s }) || undefined, onClick: (e) => openEditor(f.key, e.currentTarget) },
            [h('b', field.label), rest]),
          h('button', { type: 'button', class: 'g-filter-bar__remove', 'aria-label': fill(L.remove, { summary: s }) || undefined, onClick: () => remove(f.key) }, [h(GIcon, { name: 'x' })])
        ]))
      })
      filterable.value.filter((f) => f.filter.suggest && !isApplied(f.key)).forEach((f) => {
        kids.push(h('button', { type: 'button', class: 'g-filter-bar__suggest', key: `s-${f.key}`, 'aria-haspopup': 'dialog', onClick: (e) => openEditor(f.key, e.currentTarget) },
          [h(GIcon, { name: 'plus' }), f.label]))
      })
      const addable = filterable.value.filter((f) => !isApplied(f.key))
      if (addable.length) {
        kids.push(h(GMenu, {
          key: 'add',
          modelValue: menuOpen.value,
          'onUpdate:modelValue': (v) => { menuOpen.value = v },
          items: addable.map((f) => ({ id: f.key, label: f.label })),
          label: L.add,
          onSelect: (e) => { const key = e.id; setTimeout(() => openEditor(key, addBtn.value), 0) }
        }, {
          trigger: ({ attrs }) => h('button', { ...attrs, ref: addBtn, type: 'button', class: 'g-filter-bar__add' }, [h(GIcon, { name: 'plus' }), L.add])
        }))
      }
      if (applied.value.length) kids.push(h('button', { type: 'button', class: 'g-filter-bar__clear', key: 'clear', onClick: clear }, L.clear))
      if (props.count !== undefined) kids.push(h('span', { class: 'g-filter-bar__count', key: 'count' }, L.results ? fill(L.results, { count: props.count }) : String(props.count)))
      kids.push(h('p', { class: 'g-filter-bar__sr', 'aria-live': 'polite', key: 'live' }, live.value))

      const ed = editing.value
      const title = ed ? fill(L.filterBy, { label: fieldOf(ed.key)?.label }) : L.group
      kids.push(h('div', {
        key: 'editor', ref: editorEl, class: 'g-filter-bar__editor', role: 'dialog', popover: 'manual',
        'aria-labelledby': `${uid}-title`, onKeydown: onEditorKeydown
      }, ed && ed.presentation === 'popover'
        ? [h('h3', { id: `${uid}-title`, class: 'g-filter-bar__editor-title' }, title), ...editorBody(), h('div', { class: 'g-filter-bar__actions' }, editorActions())]
        : []))
      kids.push(h(GDialog, {
        key: 'sheet', id: `${uid}-sheet`, modelValue: Boolean(ed && ed.presentation === 'sheet'),
        title, closeLabel: L.cancel, mobile: 'sheet', size: 'sm',
        'onUpdate:modelValue': (v) => { if (!v) closeEditor(true) }
      }, {
        default: () => (ed && ed.presentation === 'sheet' ? h('div', { onKeydown: onEditorKeydown, class: 'g-filter-bar__sheet' }, editorBody()) : null),
        footer: () => (ed && ed.presentation === 'sheet' ? editorActions() : null)
      }))
      return h('div', { ref: root, class: 'g-filter-bar', role: 'group', 'aria-label': L.group }, kids)
    }
  }
})
</script>
