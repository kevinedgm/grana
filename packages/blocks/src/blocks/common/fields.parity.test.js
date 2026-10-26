// Paridad del motor de campos (dueño: bruno; #941, _comun.md §32): common/fields.js (Checkout) es una COPIA del motor de
// Guest form (GbGuestForm/useGuestForm.js + GuestForm.js). Los mismos campos y consentimientos pasan por GbGuestForm01 y por
// un paso de GbCheckout02, y se compara lo que la persona recibe: el control de cada tipo (lista cerrada, G1), su nombre,
// ayuda y autocomplete, los errores como el navegador (vacío, mal formado, los de la aplicación), los consentimientos nunca
// marcados y los avisos del motor (G1, G2, G3, G7, G8). A dónde va el foco con errores es del armazón de cada sección (Guest
// form 01 enfoca su GErrorSummary; Checkout, el primer campo del paso), no del motor: no se compara aquí. Un cambio en una copia que no llega a la otra hace fallar esta prueba.
import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import { GCheckbox, GDatePicker, GForm, GInput, GSelect, GTextarea } from '@grana/vue'
import GbGuestForm01 from '../GbGuestForm/GbGuestForm01.vue'
import GbCheckout02 from '../GbCheckout/GbCheckout02.vue'
import { mountBlock } from '../bank/harness.js'
import { ORDER, ORDER_LABELS, PRICES } from '../bank/ecommerce.js'

afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const FIELDS = [
  { name: 'nombre', label: 'Nombre', autocomplete: 'given-name', required: true, row: 'n' },
  { name: 'apellidos', label: 'Apellidos', autocomplete: 'family-name', row: 'n' },
  { name: 'correo', label: 'Correo', type: 'email', autocomplete: 'email', required: true, hint: 'Ahí llega la confirmación.' },
  { name: 'tel', label: 'Teléfono', type: 'tel', why: 'Para avisarte si cambia algo.' },
  { name: 'raro', label: 'Color favorito', type: 'color' },
  { name: 'hora', label: 'Hora', type: 'select', required: true, placeholder: 'Elige', options: [{ value: 'tarde', label: 'Tarde' }, { value: 'noche', label: 'Noche' }] },
  { name: 'notas', label: 'Notas', type: 'textarea', hint: 'Lo que quieras contarnos' },
  { name: 'dia', label: 'Día', type: 'date' }
]
const CONSENTS = [
  { name: 'politica', label: 'Acepto la política', required: true, policy: 'politica' },
  { name: 'ofertas', label: 'Quiero ofertas' }
]
const LABELS = {
  required: 'Escribe {label}', invalid: 'Revisa {label}', consent: 'Marca esta casilla', back: 'Atrás', next: 'Siguiente',
  edit: 'Cambiar {step}', order: 'Tu pedido', busy: 'Enviando…',
  form: { optional: 'opcional', error: 'Error: ', warning: 'Aviso: ', valid: 'Listo: ', sectionErrors: (n) => `${n} errores` },
  errorSummary: { title: (n) => `${n} datos` },
  ...ORDER_LABELS
}
const VALUES = { nombre: 'Ana', ofertas: 'on' }

function guest(extra = {}) {
  return mountBlock(GbGuestForm01, {
    props: { title: 'Tus datos', fields: FIELDS, consents: CONSENTS, values: VALUES, action: { label: 'Confirmar' }, labels: LABELS, locale: 'es', onSubmit: () => {}, ...extra },
    attachTo: document.body
  })
}
function checkout(extra = {}) {
  const steps = [{ id: 'datos', title: 'Tus datos', fields: FIELDS, consents: CONSENTS, action: 'Confirmar' }, { id: 'fin', title: 'Fin', action: 'Pedir', fields: [] }]
  return mountBlock(GbCheckout02, {
    props: { title: 'Finalizar compra', steps, order: ORDER, prices: PRICES, values: VALUES, labels: LABELS, locale: 'es', onSubmit: (e) => e.preventDefault(), ...extra },
    slots: { order: () => 'pedido' },
    attachTo: document.body
  })
}
/** Una prop o, si el componente la pasa por $attrs al control nativo, el atributo. */
const get = (c, k) => (c.props()[k] !== undefined ? c.props()[k] : c.vm.$attrs[k])
const KINDS = [['input', GInput], ['textarea', GTextarea], ['select', GSelect], ['date', GDatePicker]]
/** Lo que recibe la persona de cada campo, por name. */
function controls(w) {
  const out = {}
  for (const [kind, C] of KINDS) {
    for (const c of w.findAllComponents(C)) {
      const n = get(c, 'name')
      if (!FIELDS.some((f) => f.name === n)) continue
      out[n] = { kind, label: get(c, 'label'), required: get(c, 'required'), hint: get(c, 'hint') ?? null, type: get(c, 'type') ?? null, autocomplete: get(c, 'autocomplete') ?? null, value: get(c, 'modelValue') ?? null }
    }
  }
  return out
}
const consents = (w) => w.findAllComponents(GCheckbox).filter((c) => CONSENTS.some((x) => x.name === get(c, 'name'))).map((c) => ({ name: get(c, 'name'), required: get(c, 'required'), checked: get(c, 'modelValue') }))
/** Los errores que el bloque da a GForm (por name). */
const errorsOf = (w) => ({ ...(w.findComponent(GForm).props('errors') || {}) })
const codes = (warnings) => [...new Set(warnings.map((t) => (t.match(/\((G\d)\)/) || [])[1]).filter(Boolean))].sort()
const settle = async () => { await flushPromises(); await nextTick(); await flushPromises() }
const send = async (w) => { await w.find('form').trigger('submit'); await settle() }
const type = async (w, name, value) => { const el = w.find(`[name="${name}"]`); el.element.value = value; await el.trigger('input') }

describe('Paridad del motor de campos: common/fields.js (Checkout) ≡ Guest form (#941)', () => {
  it('el mismo control por tipo (G1: fuera de lista → text), con el mismo nombre, ayuda, autocomplete y valor inicial', () => {
    const a = guest()
    const b = checkout()
    const ca = controls(a.w)
    expect(Object.keys(ca).sort()).toEqual(FIELDS.map((f) => f.name).sort())
    expect(controls(b.w)).toEqual(ca)
    expect(ca.raro.kind).toBe('input')
    expect(ca.nombre.value).toBe('Ana')
  })
  it('los consentimientos nunca llegan marcados (G3), con el mismo nombre y obligatoriedad', () => {
    const a = guest()
    const b = checkout()
    expect(consents(a.w)).toEqual([{ name: 'politica', required: true, checked: false }, { name: 'ofertas', required: false, checked: false }])
    expect(consents(b.w)).toEqual(consents(a.w))
  })
  it('los mismos avisos del motor: G1 (tipo fuera de lista), G2 (tel sin autocomplete), G3 (consentimiento en values), G7 (sin consents), G8 (policy sin linkLabel)', () => {
    const a = guest()
    const b = checkout()
    const engine = (ws) => codes(ws).filter((c) => ['G1', 'G2', 'G3', 'G7', 'G8'].includes(c))
    expect(engine(a.warnings)).toEqual(['G1', 'G2', 'G3', 'G7', 'G8'])
    expect(engine(b.warnings)).toEqual(engine(a.warnings))
  })
  it('los errores como el navegador: vacío con required, mal formado del ValidityState, el consentimiento obligatorio', async () => {
    const a = guest()
    await type(a.w, 'correo', 'no-es-correo')
    await send(a.w)
    const errA = errorsOf(a.w)
    a.w.unmount()
    const b = checkout()
    await type(b.w, 'correo', 'no-es-correo')
    await send(b.w)
    const errB = errorsOf(b.w)
    expect(errA.correo).toBe('Revisa Correo')
    expect(errA.hora).toBe('Escribe Hora')
    expect(errA.apellidos).toBeUndefined()
    expect(errA.politica).toBe('Marca esta casilla')
    expect(errB).toEqual(errA)
  })
  it('los errores de la aplicación ganan a los del navegador', async () => {
    const errors = { nombre: 'Ese nombre no coincide con tu reserva' }
    const a = guest({ errors })
    const b = checkout({ errors })
    await settle()
    await send(a.w)
    await send(b.w)
    expect(errorsOf(a.w).nombre).toBe(errors.nombre)
    expect(errorsOf(b.w)).toEqual(errorsOf(a.w))
  })
})
