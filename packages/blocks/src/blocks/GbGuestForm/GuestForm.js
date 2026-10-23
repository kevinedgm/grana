// El formulario de GbGuestForm, igual en las tres variantes (dueño: bruno; guest-form.md «Anatomía (común)»). Interno de
// la sección. Sin CSS (#763).
//   GForm (labels.form, errors = los del bloque ∪ los de la aplicación, headingLevel = sección + 1)
//   ├─ GErrorSummary (labels.errorSummary; con `error`, el general al final)
//   ├─ GFormSection por grupo (title, description; en 02 solo el actual a la vista, los demás hidden y montados)
//   │  └─ GFormLayout › GFormRow por `row` (o uno por campo) › el campo (o el slot field-{name})
//   │     · GPartyField mode="inline" al principio del primer grupo, arrancando con query.party
//   ├─ GFormLayout (campos sin grupo conocido, G5) · en 02 van con el último paso
//   ├─ GFormLayout (consentimientos) › GStack › GCheckbox (nunca marcado al empezar) + GBtn link con su política, fuera
//   │  de la etiqueta (un enlace dentro del label cambiaría la casilla) · en 02, con el último paso
//   └─ GFormActions [sticky en 03] › [«Atrás» ghost] + «Siguiente» o el envío (solid, el último)
import { defineComponent, h } from 'vue'
import { GCheckbox, GDatePicker, GErrorSummary, GForm, GFormLayout, GFormRow, GFormSection, GInput, GSelect, GStack, GTextarea } from '@grana/vue'
import { GPartyField } from '@grana/vue/booking'
import GbLink from '../common/link.js'
import GuestActions from './GuestActions.vue'
import { has } from '../common/text.js'

export default /* @__PURE__ */ defineComponent({
  name: 'GbGuestFormForm',
  props: {
    g: { type: Object, required: true },
    // Props de la sección
    p: { type: Object, required: true },
    headingLevel: { type: Number, required: true },
    variant: { type: String, required: true },
    slots: { type: Object, default: () => ({}) },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    const control = (f) => {
      const g = props.g
      const L = g.L.value
      const value = g.valueOf(f.name)
      const slot = props.slots[`field-${f.name}`]
      if (slot) return slot({ field: f.field, value, error: g.formErrors.value[f.name], id: f.id })
      const common = { key: f.key, id: f.id, name: f.name, label: f.field.label, hint: f.hint, required: Boolean(f.field.required) }
      const on = (v) => g.setValue(f.name, v)
      if (f.type === 'textarea') return h(GTextarea, { ...common, placeholder: f.field.placeholder, autocomplete: f.field.autocomplete, modelValue: value, 'onUpdate:modelValue': on })
      if (f.type === 'select') return h(GSelect, { ...common, placeholder: f.field.placeholder, options: Array.isArray(f.field.options) ? f.field.options : [], modelValue: value || null, 'onUpdate:modelValue': on })
      if (f.type === 'date') return h(GDatePicker, { ...common, placeholder: f.field.placeholder, modelValue: value || null, labels: L.datePicker, locale: g.locale.value, 'onUpdate:modelValue': on })
      return h(GInput, { ...common, type: f.type === 'text' ? undefined : f.type, autocomplete: f.field.autocomplete, placeholder: f.field.placeholder, modelValue: value, 'onUpdate:modelValue': on })
    }
    const rowsOf = (rows) => rows.map((r) => h(GFormRow, { key: r.key }, () => r.fields.map(control)))
    const party = () => {
      const g = props.g
      const p = props.p.party
      return h(GFormRow, { key: 'party' }, () => h(GPartyField, {
        id: g.partyId, mode: 'inline', label: p.label, hint: p.hint, name: p.name, rows: props.p.partyRows,
        modelValue: g.partyValue.value, labels: g.L.value.party, locale: g.locale.value, 'onUpdate:modelValue': g.setParty
      }))
    }
    const consents = (hidden) => {
      const g = props.g
      if (props.slots.consents) return h(GFormLayout, { key: 'consents', hidden }, () => props.slots.consents())
      if (!g.consents.value.length) return null
      return h(GFormLayout, { key: 'consents', hidden }, () => g.consents.value.map(({ item, key, id }) => {
        const link = item.link && has(item.link.label) && has(item.link.href) ? item.link : null
        return h(GStack, { key, gap: 'sm' }, () => [
          h(GCheckbox, { id, name: item.name, label: item.label, required: Boolean(item.required), modelValue: Boolean(g.consentState.value[item.name]), 'onUpdate:modelValue': (v) => g.setConsent(item.name, v) }),
          link ? h(GbLink, { link, external: g.L.value.external, what: 'consents.link', warn: props.warn, onNavigate: (e) => emit('navigate', e) }) : null
        ])
      }))
    }
    return () => {
      const g = props.g
      const L = g.L.value
      const stepped = props.variant === '02'
      const list = g.groups.value.list
      const rest = g.groups.value.rest
      const lastIndex = list.length - 1
      const kids = [h(GErrorSummary, { key: 'summary', errors: g.summaryErrors.value, labels: L.errorSummary })]
      list.forEach((grp, i) => {
        const shown = !stepped || i === g.index.value
        const section = h(GFormSection, { key: `g:${grp.id || i}`, title: grp.title, description: grp.description }, () => h(GFormLayout, null, () => [
          i === 0 && g.partyOn.value ? party() : null,
          ...rowsOf(grp.rows),
          // 02: lo que no tiene grupo y los consentimientos, con el último paso
          ...(stepped && i === lastIndex ? [...rowsOf(rest)] : [])
        ]))
        // 02: cada paso en un div con `hidden` (GFormSection pone su propio `hidden` sobre el de $attrs: hallazgo para
        // @grana/vue); montados siempre, así sus datos van en el envío
        kids.push(stepped ? h('div', { key: `p:${grp.id || i}`, hidden: shown ? undefined : true }, [section]) : section)
        // En 02 los consentimientos van con el último paso (montados siempre: sus datos van en el envío)
        if (stepped && i === lastIndex) kids.push(consents(g.last.value ? undefined : true))
      })
      if (!stepped && rest.length) kids.push(h(GFormLayout, { key: 'rest' }, () => rowsOf(rest)))
      if (!stepped) kids.push(consents())
      kids.push(h(GuestActions, { key: 'actions', g, action: props.p.action || {}, busy: props.p.busy, variant: props.variant }))
      return h(GForm, {
        ref: (el) => { g.form.value = el },
        errors: g.formErrors.value,
        labels: L.form,
        headingLevel: props.headingLevel,
        onSubmit: g.onSubmit,
        onInvalid: g.onInvalid,
        onInput: g.onInput,
        onChange: g.onInput
      }, () => kids)
    }
  }
})
