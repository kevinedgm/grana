// Las piezas de GbCart (dueño: bruno; cart.md «Anatomía de una línea», «El resumen»). Internas de la sección; sin CSS.
//   CartLines: GStack as="ul" gap="md" › por fila, la línea o su huella, en su sitio:
//     línea: GCard as="li" level="flat" orientation="horizontal" mediaPosition="start" density="compact" (03 sin media;
//       el li captura el último gesto nativo para el `change`) · media: la portada decorativa · eyebrow: maker · title: el
//       nombre (enlace con href → navigate, item = la línea; lang) · meta: la elección como viaja ({ label, value }) ·
//       cuerpo: GPrice (A · la cuenta: el unitario con labels.each y, con line.total, el total de la línea con
//       labels.forQuantity) + el motivo si no está disponible + la nota + slot `line` · actions: GNumberField (sin él si no
//       está disponible; disabled con busy) + GBtn link «Quitar» (nombre con el producto, 2.4.6).
//     huella: li (focusout y pointerleave: se va cuando foco y puntero salen) › GText body-sm «Quitaste {name}» + GBtn
//       link «Deshacer» (→ restore). Sin escucha de `restore` (CA3), sin «Deshacer»: el li recibe el foco.
//   CartSummary: GCard as="section" (title = labels.summary) › [el umbral: frase + GProgress hasta alcanzarlo] + el desglose
//     (common/totals.js; 03 solo el total y lo que falta por calcular) + lo que no entra + slot `summary` + la garantía (con
//     id) · actions: la principal solid a lo ancho y la segunda outline (la garantía en aria-describedby de la principal).
import { defineComponent, h } from 'vue'
import { GBtn, GCard, GNumberField, GProgress, GStack, GText } from '@grana/vue'
import { GPrice } from '@grana/vue/price'
import GbActions from '../common/GbActions.js'
import { checkMedia, imgAttrs } from '../common/media.js'
import { labelOf } from '../common/order.js'
import GbTotals from '../common/totals.js'
import { has } from '../common/text.js'


export const CartLines = /* @__PURE__ */ defineComponent({
  name: 'GbCartLines',
  props: {
    c: { type: Object, required: true },
    media: { type: Boolean, default: true },
    headingLevel: { type: Number, required: true },
    priceLocale: { type: String, default: undefined },
    lineSlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate'],
  setup(props, { emit }) {
    const line = (x) => {
      const c = props.c
      const L = c.L.value
      const l = x.line
      const p = l.product
      const name = p.name
      const slots = {}
      const pic = props.media && Array.isArray(p.photos) && p.photos[0] && has(p.photos[0].src) ? p.photos[0] : null
      if (pic) { checkMedia({ ...pic, decorative: true }, 'lines.product.photos[0]', props.warn); slots.media = () => h('img', imgAttrs({ ...pic, decorative: true })) }
      if (has(p.lang)) slots.title = () => h('span', { lang: p.lang }, name)
      // A · la cuenta (price.md): el unitario y, si la aplicación lo dio, el total de la línea (rueda cuando cambia)
      const full = l.total && L.forQuantity !== undefined && has(L.each) && has(L.eachLabel)
      const price = h(GPrice, {
        value: l.unitPrice,
        compareAt: l.compareAt,
        compareLabel: l.compareLabel,
        unit: full ? L.each : undefined,
        unitLabel: full ? L.eachLabel : undefined,
        total: full ? { value: l.total, label: labelOf(L.forQuantity, 'count', c.quantityOf(x)) } : undefined,
        size: 'sm',
        locale: props.priceLocale
      })
      slots.default = () => [
        price,
        !x.available.ok && x.available.reason ? h(GText, { size: 'body-sm' }, () => x.available.reason) : null,
        has(l.note) ? h(GText, { size: 'body-sm', tone: 'muted' }, () => l.note) : null,
        props.lineSlot ? props.lineSlot({ line: l }) : null
      ]
      const removeName = labelOf(L.remove, 'name', name)
      const removeText = has(L.removeText) ? L.removeText : removeName
      slots.actions = () => [
        x.available.ok ? h(GNumberField, {
          id: `${x.id}-q`,
          label: labelOf(L.quantity, 'name', name),
          modelValue: c.quantityOf(x),
          min: x.min,
          max: x.max,
          step: 1,
          precision: 0,
          steppers: true,
          decrementLabel: L.decrement,
          incrementLabel: L.increment,
          locale: props.priceLocale || c.locale.value,
          size: 'sm',
          disabled: x.busy,
          'onUpdate:modelValue': (v) => c.setTyped(x, v),
          onChange: (q) => c.onChange(x, q)
        }) : null,
        h(GBtn, { id: `${x.id}-r`, variant: 'link', size: 'sm', disabled: x.busy, 'aria-label': removeName && removeName !== removeText ? removeName : undefined, onClick: (event) => c.remove(x, event) }, () => removeText)
      ]
      const meta = (Array.isArray(l.options) ? l.options : []).filter((o) => o && has(o.label) && has(o.value)).map((o) => ({ label: o.label, value: o.value }))
      return h(GCard, {
        key: x.key,
        as: 'li',
        level: 'flat',
        orientation: 'horizontal',
        mediaPosition: 'start',
        density: 'compact',
        eyebrow: has(p.maker) ? p.maker : undefined,
        title: name,
        titleLines: 'none', // el nombre del producto entero (EC-B1)
        meta,
        headingLevel: props.headingLevel,
        interaction: has(p.href) && !p.external ? 'link' : undefined,
        href: has(p.href) && !p.external ? p.href : undefined,
        onNavigate: (e) => emit('navigate', { ...e, item: l })
      }, slots)
    }
    const trace = (t) => {
      const c = props.c
      const L = c.L.value
      const text = labelOf(L.removed, 'name', t.line.product.name)
      const undo = c.undoable.value
      return h('li', { key: `t:${t.key}`, id: undo ? undefined : t.id, tabindex: undo ? undefined : '-1', onFocusout: (e) => c.leave(t, e), onPointerleave: (e) => c.leave(t, e) }, h(GStack, { orientation: 'horizontal', gap: 'sm', vertical: 'center' }, () => [
        h(GText, { size: 'body-sm' }, () => text),
        undo ? h(GBtn, { id: t.id, variant: 'link', size: 'sm', onClick: (event) => c.restore(t, event) }, () => L.undo) : null
      ]))
    }
    return () => h(GStack, { as: 'ul', gap: 'md' }, () => props.c.rows.value.map((r) => (r.type === 'line' ? line(r.x) : trace(r.t))))
  }
})

export const CartSummary = /* @__PURE__ */ defineComponent({
  name: 'GbCartSummary',
  props: {
    c: { type: Object, required: true },
    // 'full' (01, 02) o 'total' (03: solo el total y lo que falta por calcular)
    form: { type: String, default: 'full' },
    assurance: { type: String, default: undefined },
    headingLevel: { type: Number, required: true },
    priceLocale: { type: String, default: undefined },
    summarySlot: { type: Function, default: undefined },
    actionsSlot: { type: Function, default: undefined },
    warn: { type: Function, required: true }
  },
  emits: ['navigate', 'activate'],
  setup(props, { emit }) {
    return () => {
      const c = props.c
      const L = c.L.value
      const g = c.goal.value
      const t = c.totals.value
      const body = () => [
        g ? h(GText, { size: 'body-sm' }, () => g.text) : null,
        g && !g.goal.reached ? h(GProgress, { value: g.goal.value.amount, max: g.goal.target.amount, label: g.text, showLabel: false, showValue: false }) : null,
        h(GbTotals, { totals: t, labels: L, form: props.form, locale: props.priceLocale, warn: props.warn }),
        c.excluded.value ? h(GText, { size: 'body-sm' }, () => c.excluded.value) : null,
        props.summarySlot ? props.summarySlot({ totals: props.c.totals.value }) : null,
        c.assuranceId.value ? h(GText, { id: c.assuranceId.value, size: 'body-sm', tone: 'muted' }, () => props.assurance) : null
      ]
      const actions = () => (props.actionsSlot
        ? props.actionsSlot({ describedby: c.assuranceId.value })
        : h(GbActions, { actions: c.actions.value, variants: ['solid', 'outline'], block: true, external: L.external, describedby: c.assuranceId.value, warn: props.warn, onNavigate: (e) => emit('navigate', e), onActivate: (e) => emit('activate', e) }))
      return h(GCard, { as: 'section', title: L.summary, headingLevel: props.headingLevel }, { default: () => h(GStack, { gap: 'md' }, body), actions })
    }
  }
})
