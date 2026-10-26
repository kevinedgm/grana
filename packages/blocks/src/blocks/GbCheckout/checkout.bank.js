// Banco único de GbCheckout (dueño: bruno; checkout.md «Banco», _comun.md §7 y §33). Barro y Agave: «Contacto» (correo y
// teléfono con autocomplete y el porqué), «Envío» (la dirección en un grupo, código postal y ciudad en una fila, el estado
// en un select, y la forma de envío como choice con su precio: Estándar $99, Exprés $249, Recoger en el taller gratis y
// una deshabilitada con su motivo), «Pago» (sin fields: el slot step-pago con una pasarela SIMULADA, sin campos ni datos
// reales; Grana nunca toca un número de tarjeta, EC6) y «Revisión» (las condiciones, obligatorias, con el ancla de la
// política de devoluciones). El pedido es el común (bank/ecommerce.js). Estados para el playground y el spec: `busy`, los
// errores del servidor en el código postal y el error general. Sin errores a propósito: con él, ninguna variante avisa.
import { h } from 'vue'
import { GText } from '@grana/vue'
import { LOCALE, ORDER, ORDER_LABELS, PRICES, mxn } from '../bank/ecommerce.js'

const ESTADOS = ['Oaxaca', 'Chiapas', 'Ciudad de México', 'Puebla', 'Veracruz'].map((x) => ({ value: x, label: x }))

export const STEPS = [
  {
    id: 'contacto',
    title: 'Contacto',
    description: 'Te escribimos solo por tu pedido.',
    fields: [
      { name: 'email', label: 'Correo electrónico', type: 'email', autocomplete: 'email', required: true },
      { name: 'tel', label: 'Teléfono', type: 'tel', autocomplete: 'tel', why: 'Para avisarte si el transportista no te encuentra.' }
    ],
    action: 'Continuar al envío'
  },
  {
    id: 'envio',
    title: 'Envío',
    fields: [
      { name: 'calle', label: 'Calle y número', autocomplete: 'address-line1', required: true },
      { name: 'colonia', label: 'Colonia', autocomplete: 'address-line2' },
      { name: 'cp', label: 'Código postal', autocomplete: 'postal-code', required: true, row: 'cp' },
      { name: 'ciudad', label: 'Ciudad', autocomplete: 'address-level2', required: true, row: 'cp' },
      { name: 'estado', label: 'Estado', type: 'select', autocomplete: 'address-level1', required: true, options: ESTADOS },
      {
        name: 'forma', label: 'Forma de envío', type: 'choice', required: true,
        options: [
          { value: 'estandar', label: 'Estándar', description: 'de 3 a 5 días', price: { value: mxn(99) } },
          { value: 'expres', label: 'Exprés', description: 'de 1 a 2 días', price: { value: mxn(249) } },
          { value: 'taller', label: 'Recoger en el taller', description: 'Teotitlán del Valle', price: { value: mxn(0) } },
          { value: 'mismo-dia', label: 'El mismo día', price: { value: mxn(180) }, disabled: 'No llega a tu código postal' }
        ]
      }
    ],
    groups: [{ id: 'direccion', title: 'Dirección', fields: ['calle', 'colonia', 'cp', 'ciudad', 'estado'] }],
    action: 'Continuar al pago'
  },
  { id: 'pago', title: 'Pago', description: 'Lo cobra la pasarela de la tienda.', action: 'Revisar el pedido' },
  {
    id: 'revision',
    title: 'Revisión',
    consents: [{ name: 'condiciones', label: 'Acepto las condiciones de venta', required: true, policy: 'devoluciones', linkLabel: 'Leer la política de devoluciones' }],
    action: 'Confirmar pedido'
  }
]

export const LABELS = {
  required: 'Escribe {label}',
  invalid: 'Revisa {label}',
  choose: 'Elige {label}',
  consent: 'Marca esta casilla para continuar',
  consents: 'Antes de confirmar',
  back: 'Atrás',
  edit: (step) => `Cambiar ${step}`,
  busy: 'Enviando…',
  form: { optional: 'opcional', error: 'Error: ', warning: 'Aviso: ', valid: 'Listo: ', sectionErrors: (n) => `${n} ${n === 1 ? 'error' : 'errores'}` },
  errorSummary: { title: (n) => (n === 1 ? 'Hay 1 dato por revisar' : `Hay ${n} datos por revisar`) },
  stepper: { complete: 'hecho', current: 'paso actual', pending: 'pendiente', error: 'con error', warning: 'con aviso', disabled: 'no disponible', optional: 'opcional', progress: 'Paso {current} de {total}', showAll: 'Ver todos los pasos', hideAll: 'Ocultar los pasos' },
  ...ORDER_LABELS,
  order: 'Tu pedido'
}

export const props = {
  title: 'Finalizar compra',
  steps: STEPS,
  order: ORDER,
  prices: PRICES,
  locale: LOCALE,
  labels: LABELS,
  // Nadie más pide el pedido (CK2): el playground y el spec escuchan `submit`
  onSubmit: () => {}
}

// La pasarela SIMULADA del banco: un texto, ningún campo (el pago real es el componente de la pasarela de la tienda)
export const slots = {
  'step-pago': () => h(GText, { size: 'body-sm' }, () => 'Aquí va la pasarela de la tienda (simulada en el banco, sin datos).')
}

export const states = {
  ocupado: { busy: true },
  servidor: { step: 'envio', values: { email: 'ana@example.com', calle: 'Macedonio Alcalá 202', cp: '68000', ciudad: 'Oaxaca de Juárez', estado: 'Oaxaca', forma: 'estandar' }, errors: { cp: 'Ese código postal no existe en Oaxaca' } },
  general: { error: 'No pudimos guardar tus datos. Vuelve a intentarlo.' }
}

/** Lo que hace la aplicación (playground y spec): deja avanzar cada paso (sin preventDefault) y anota el envío. */
export function app(view, events, n) {
  return { onSubmit: (p) => { events.push(['submit', n, p.step, p.final]) } }
}
