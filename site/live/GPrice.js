// Ficha interactiva de GPrice (entrada propia @grana/vue/price). El dato es un Money; Grana no convierte ni multiplica.
export default {
  exclude: ['max', 'compareAt', 'total', 'labels', 'value', 'cents'],
  text: ['lead', 'unit', 'unitLabel', 'compareLabel', 'locale'],
  base: {
    value: { amount: 1850, currency: 'MXN' },
    lead: { es: 'desde', en: 'from' },
    unit: { es: '/ noche', en: '/ night' },
    unitLabel: { es: 'por noche', en: 'per night' },
    locale: 'es-MX',
    labels: { saving: { es: 'Ahorras {amount}', en: 'You save {amount}' }, before: { es: 'Antes', en: 'Before' } }
  },
  imports: ["import { GPrice } from '@grana/vue/price'"],
  cases: [
    {
      title: { es: 'Tarifa de una habitación', en: 'Room rate' },
      why: { es: 'Una tarifa con unidad: unit se ve, unitLabel es lo que oye el lector. Para muchos precios en la misma moneda, GPriceScope.', en: 'A rate with a unit: unit is seen, unitLabel is what the reader hears. For many prices in one currency, GPriceScope.' },
      props: { size: 'md' }
    },
    {
      title: { es: 'Oferta contra el precio de lista', en: 'Offer against the list price' },
      why: { es: 'compareAt exige decir qué es la referencia (compareLabel); sin nombre no se pinta. El ahorro lo resta Grana.', en: 'compareAt requires saying what the reference is (compareLabel); without a name it is not drawn. Grana computes the saving.' },
      props: { size: 'lg', compareAt: { amount: 2300, currency: 'MXN' }, compareLabel: { es: 'Temporada alta', en: 'High season' } }
    },
    {
      title: { es: 'Rango de precios', en: 'Price range' },
      why: { es: 'max pinta «de a»; úsalo cuando el precio depende de una elección que aún no se hizo.', en: 'max draws “X to Y”; use it when the price depends on a choice not yet made.' },
      props: { max: { amount: 2600, currency: 'MXN' }, labels: { range: { es: '{min} a {max}', en: '{min} to {max}' } }, lead: '', unit: '', unitLabel: '' }
    },
    {
      title: { es: 'Importe con centavos fijos', en: 'Amount with fixed cents' },
      why: { es: 'cents always en una columna de importes que deben alinear; auto los muestra solo si el importe los trae (never solo existe en size xs).', en: 'cents always in a column of amounts that must align; auto shows them only when the amount has them (never only exists at size xs).' },
      props: { value: { amount: 1850, currency: 'MXN' }, cents: 'always', size: 'lg', lead: '', unit: '', unitLabel: '' }
    }
  ]
}
