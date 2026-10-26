// El formulario de GbCheckout, igual en las tres variantes salvo la forma de los pasos (dueño: bruno; checkout.md
// «Anatomía (común)»). Interno de la sección; sin CSS (#763).
//   GForm (labels.form; errors = los de los pasos hasta el actual ∪ los de la aplicación; un solo GForm para todos los pasos)
//   ├─ GErrorSummary (labels.errorSummary; con `error`, el general al final)
//   ├─ [01, 03] lo hecho: GStack as="ul" › li › GStack › GSummary layout="row" (title = el paso; facts = las respuestas, un
//   │  choice con la etiqueta de su opción; step.summary de la aplicación como subtitle) + GBtn link «Cambiar {paso}»
//   ├─ por paso, sus piezas (common/fields.js): GFormSection por grupo (`groups`, por name) › GFormLayout › GFormRow; los
//   │  campos sin grupo en una GFormSection con el título del paso (o en un GFormLayout tras los grupos); `choice` →
//   │  GRadioGroup appearance="card" (slot option: etiqueta, descripción o motivo y GPrice sm: todo el nombre del radio,
//   │  así el precio se oye al elegir); consentimientos (GFieldGroup › GCheckbox, nunca marcados); sin `fields`, el slot
//   │  step-{id} de la aplicación en una GFormSection con el título del paso (el bloque no lo lee).
//   │  · 01, 03: cada paso en un GStack gap="lg" con `hidden` salvo el actual (montados: sus datos van en el envío).
//   │  · 02: cada paso es una GFormSection mode="collapsible" (title, open = es el actual, summary = lo hecho; actions =
//   │    «Cambiar» en los hechos); los posteriores al actual, plegados dentro de un div `inert` (no se salta un paso).
//   └─ el pie (CheckoutActions.vue): el total en `status` y el botón del paso.
import { defineComponent, h } from 'vue'
import { GBtn, GErrorSummary, GForm, GFormLayout, GFormRow, GFormSection, GRadioGroup, GStack, GSummary } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import { consentGroup, fieldControl } from '../common/fields.js'
import { listText } from '../common/order.js'
import { priceSpec } from '../common/price.js'
import { has } from '../common/text.js'
import CheckoutActions from './CheckoutActions.vue'

export default /* @__PURE__ */ defineComponent({
  name: 'GbCheckoutForm',
  props: {
    k: { type: Object, required: true },
    p: { type: Object, required: true },
    variant: { type: String, required: true },
    headingLevel: { type: Number, required: true },
    priceLocale: { type: String, default: undefined },
    slots: { type: Object, default: () => ({}) },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    // El `choice` (envío, entrega): GRadioGroup card con el precio en el nombre del radio
    const choice = (f, common, value, on) => {
      if (f.type !== 'choice') return null
      const opts = (Array.isArray(f.field.options) ? f.field.options : []).filter((o) => o && has(o.value) && has(o.label))
      const options = opts.map((o) => ({ value: o.value, label: o.label, disabled: Boolean(o.disabled) }))
      return h(GRadioGroup, { ...common, appearance: 'card', options, modelValue: value || null, 'onUpdate:modelValue': on }, {
        option: ({ option }) => {
          const o = opts.find((x) => x.value === option.value) || option
          const why = typeof o.disabled === 'string' && has(o.disabled) ? o.disabled : ''
          const words = listText([o.label, o.description, why], props.k.locale.value)
          const price = priceSpec(o.price, `${f.name}.options.price`, props.warn)
          return [words, price ? ' ' : null, price ? h(GPrice, { ...price, size: 'sm', locale: props.priceLocale }) : null]
        }
      })
    }
    const control = (f) => {
      const k = props.k
      return fieldControl(f, { value: k.valueOf(f.name), set: k.setValue, error: k.formErrors.value[f.name], slot: props.slots[`field-${f.name}`], L: k.L.value, locale: k.locale.value, custom: choice })
    }
    const rowsOf = (rows) => rows.map((r) => h(GFormRow, { key: r.key }, () => r.fields.map(control)))
    /** Las piezas de un paso (sin envoltorio). `titled`: la sección de los campos sin grupo lleva el título del paso. */
    const pieces = (s, titled) => {
      const k = props.k
      const out = []
      if (s.app) {
        const slot = props.slots[`step-${s.id}`]
        const body = () => (slot ? slot({ step: s.step, values: { ...k.fields.value.reduce((o, f) => ({ ...o, [f.name]: k.valueOf(f.name) }), {}) } }) : null)
        out.push(titled ? h(GFormSection, { key: `app:${s.id}`, id: s.groupId, title: s.step.title, description: s.step.description }, body) : h('div', { key: `app:${s.id}`, id: s.groupId }, body()))
        return out
      }
      for (const g of s.groups) out.push(h(GFormSection, { key: `g:${g.key}` , title: g.title }, () => h(GFormLayout, null, () => rowsOf(g.rows))))
      if (s.rest.length) {
        const layout = () => h(GFormLayout, null, () => rowsOf(s.rest))
        out.push(titled && !s.groups.length ? h(GFormSection, { key: 'rest', title: s.step.title, description: s.step.description }, layout) : h(GFormLayout, { key: 'rest' }, () => rowsOf(s.rest)))
      }
      if (s.consents.length) out.push(consentGroup({ key: `c:${s.id}`, list: s.consents, state: k.consentState.value, set: k.setConsent, title: k.consentsTitle.value, external: k.L.value.external, warn: props.warn, onNavigate: (e) => emit('navigate', e) }))
      return out
    }
    const done = () => {
      const k = props.k
      if (k.index.value < 1) return null
      return h(GStack, { key: 'done', as: 'ul', gap: 'sm' }, () => k.steps.value.slice(0, k.index.value).map((s, i) => {
        const x = k.summaryOf(i)
        return h('li', { key: s.id }, h(GStack, { gap: 'sm' }, () => [
          h(GSummary, { layout: 'row', title: x.title, subtitle: x.subtitle, facts: x.facts }),
          h(GBtn, { variant: 'link', size: 'sm', type: 'button', onClick: () => k.change(i) }, () => k.editName(s.step.title))
        ]))
      }))
    }
    return () => {
      const k = props.k
      const L = k.L.value
      const folded = props.variant === '02'
      const kids = [h(GErrorSummary, { key: 'summary', errors: k.summaryErrors.value, labels: L.errorSummary })]
      if (!folded) {
        kids.push(done())
        for (const s of k.steps.value) kids.push(h(GStack, { key: `p:${s.id}`, gap: 'lg', hidden: s.index === k.index.value ? undefined : true }, () => pieces(s, true)))
      } else {
        for (const s of k.steps.value) {
          const doneStep = s.index < k.index.value
          const summary = doneStep ? k.summaryOf(s.index) : null
          const section = h(GFormSection, {
            key: `f:${s.id}`,
            id: s.app ? s.groupId : undefined,
            mode: 'collapsible',
            title: s.step.title,
            description: s.step.description,
            open: s.index === k.index.value,
            summary: summary && summary.text ? summary.text : undefined,
            'onUpdate:open': (v) => { if (v && doneStep) k.change(s.index) }
          }, {
            default: () => h(GStack, { gap: 'lg' }, () => pieces(s, false)),
            actions: doneStep ? () => h(GBtn, { variant: 'link', size: 'sm', type: 'button', onClick: () => k.change(s.index) }, () => k.editName(s.step.title)) : undefined
          })
          kids.push(s.index > k.index.value ? h('div', { key: `i:${s.id}`, inert: '' }, [section]) : section)
        }
      }
      const t = props.p.order && props.p.order.totals && props.p.order.totals.total ? props.p.order.totals.total : null
      kids.push(h(CheckoutActions, { key: 'actions', k, total: t, sticky: props.variant === '03', withBack: !folded, busy: props.p.busy, priceLocale: props.priceLocale }))
      return h(GForm, {
        ref: (el) => { k.form.value = el },
        errors: k.formErrors.value,
        labels: L.form,
        headingLevel: props.headingLevel,
        onSubmit: k.onSubmit,
        onInvalid: k.onInvalid,
        onInput: k.onInput,
        onChange: k.onInput
      }, () => kids)
    }
  }
})
