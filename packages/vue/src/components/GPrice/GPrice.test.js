// GPrice · design/contracts/price.md «Verificación · bruno» (DECISIONS.md #768 a #779)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import GPrice from './GPrice.vue'
import GPriceScope from '../GPriceScope/GPriceScope.vue'

const L = { free: 'Gratis', onRequest: 'Precio a consultar', before: 'Antes', range: '{min} a {max}', saving: 'Ahorras {amount}', approx: 'aprox.', total: 'Total' }
const mx = (amount, x) => ({ amount, currency: 'MXN', ...x })
const sp = (t) => t.replace(/ /g, ' ')
const mounted = []
function mk(props = {}, opts = {}) {
  const w = mount(GPrice, { props: { locale: 'es-MX', labels: L, ...props }, attachTo: document.body, ...opts })
  mounted.push(w)
  return w
}
function host(template, setup = () => ({}), opts = {}) {
  const w = mount(defineComponent({ components: { GPrice, GPriceScope }, setup, template }), { attachTo: document.body, ...opts })
  mounted.push(w)
  return w
}
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
  vi.restoreAllMocks()
  document.documentElement.removeAttribute('lang')
})
const visual = (w) => w.find('.g-price__visual')
const spoken = (w) => w.find('.g-price__spoken').text()

describe('GPrice · árbol accesible', () => {
  it('raíz span con clases y data-currency; lo visible aria-hidden y la frase oculta; sin rol ni foco', () => {
    const w = mk({ value: mx(1850), lead: 'desde', unit: '/ noche', unitLabel: 'por noche' })
    expect(w.element.tagName).toBe('SPAN')
    expect(w.classes()).toEqual(['g-price', 'g-price--size-md'])
    expect(w.attributes('data-currency')).toBe('MXN')
    expect(w.attributes('role')).toBeUndefined()
    expect(w.attributes('tabindex')).toBeUndefined()
    expect(w.attributes('aria-live')).toBeUndefined()
    expect(visual(w).attributes('aria-hidden')).toBe('true')
    expect(spoken(w)).toBe('desde 1,850 pesos mexicanos por noche')
    expect(w.findAll('[tabindex], button, a, input')).toHaveLength(0)
  })
  it('partes del importe: dir=ltr, símbolo, cifra y código; lead y unidad como hermanos; sin espacios de relleno', () => {
    const w = mk({ value: mx(1850), lead: 'desde', unit: '/ noche' })
    const now = w.find('.g-price__now')
    expect(now.element.children[0].className).toBe('g-price__lead')
    expect(now.element.children[1].className).toBe('g-price__amount')
    expect(now.element.children[2].className).toBe('g-price__unit')
    const a = w.find('.g-price__amount')
    expect(a.attributes('dir')).toBe('ltr')
    expect([...a.element.children].map((c) => [c.className, c.textContent])).toEqual([['g-price__symbol', '$'], ['g-price__number', '1,850'], ['g-price__code', 'MXN']])
    expect(now.element.textContent).toBe('desde$1,850MXN/ noche')
  })
  it('negativo: g-price--negative y __minus U+2212; lectura con «-»', () => {
    const w = mk({ value: mx(-200), cents: 'always' })
    expect(w.classes()).toContain('g-price--negative')
    expect(w.find('.g-price__minus').text()).toBe('−')
    expect(spoken(w)).toBe('-200 pesos mexicanos')
  })
  it('estados de texto llano sin duplicado: Gratis, Precio a consultar; inválido vacío sin data-currency', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const f = mk({ value: mx(0), size: 'sm' })
    expect(f.classes()).toEqual(['g-price', 'g-price--size-sm', 'g-price--free'])
    expect(f.element.innerHTML).toBe('Gratis')
    const r = mk({ value: null })
    expect(r.classes()).toContain('g-price--on-request')
    expect(r.element.innerHTML).toBe('Precio a consultar')
    const i = mk({ value: { amount: 1, currency: 'pesos' } })
    expect(i.element.innerHTML).toBe('')
    expect(i.attributes('data-currency')).toBeUndefined()
  })
  it('#802: un código bien formado pero inexistente («XXZ») se pinta con su código y sin aviso; solo lo mal formado es inválido', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const x = mk({ value: { amount: 5, currency: 'xxz' } })
    expect(x.attributes('data-currency')).toBe('XXZ')
    expect(x.find('.g-price__amount').text()).toContain('XXZ')
    expect(warn).not.toHaveBeenCalled()
    const bad = mk({ value: { amount: 5, currency: 'XX1' } })
    expect(bad.element.innerHTML).toBe('')
    expect(warn.mock.calls.some((c) => String(c[0]).includes('XX1'))).toBe(true)
  })
  it('aproximado y rango', () => {
    const a = mk({ value: { amount: 105, currency: 'USD', approximate: true } })
    expect(a.classes()).toContain('g-price--approx')
    expect(a.find('.g-price__approx').text()).toBe('aprox.')
    const r = mk({ value: mx(900), max: mx(1400) })
    expect(r.classes()).toContain('g-price--range')
    const amounts = r.findAll('.g-price__now > .g-price__amount')
    expect(amounts).toHaveLength(2)
    expect(amounts[0].find('.g-price__code').exists()).toBe(false)
    expect(amounts[1].find('.g-price__code').text()).toBe('MXN')
    expect(r.find('.g-price__sep').text()).toBe('a')
    expect(spoken(r)).toBe('900 a 1,400 pesos mexicanos')
  })
})

describe('GPrice · C (trace) y strike', () => {
  it('trace: la referencia encima del precio, nombrada, con flecha flip-rtl y ahorro; se lee después del precio', () => {
    const w = mk({ value: mx(1850), compareAt: mx(2300), compareLabel: 'Temporada alta' })
    expect(w.classes()).toEqual(expect.arrayContaining(['g-price--has-compare', 'g-price--compare-trace']))
    const kids = [...visual(w).element.children].map((c) => c.className)
    expect(kids).toEqual(['g-price__compare', 'g-price__now'])
    const c = w.find('.g-price__compare')
    expect(c.element.tagName).toBe('SPAN')
    expect(c.find('.g-price__compare-label').text()).toBe('Temporada alta')
    expect(c.find('.g-price__amount--compare').text()).toBe('$2,300')
    expect(c.find('svg.g-price__arrow').classes()).toContain('g-icon--flip-rtl')
    expect(c.find('.g-price__saving').text()).toBe('Ahorras $450')
    expect(w.find('s').exists()).toBe(false)
    expect(spoken(w)).toBe('1,850 pesos mexicanos. Temporada alta: 2,300 pesos mexicanos. Ahorras 450 pesos mexicanos')
  })
  it('strike: <s> después del precio actual con __amount--compare, sin ahorro', () => {
    const w = mk({ value: mx(1850), compareAt: mx(2300), compareStyle: 'strike' })
    expect(w.classes()).toContain('g-price--compare-strike')
    const kids = [...visual(w).element.children].map((c) => c.tagName + '.' + c.className)
    expect(kids).toEqual(['SPAN.g-price__now', 'S.g-price__compare'])
    expect(w.find('s .g-price__amount--compare').text()).toBe('$2,300')
    expect(w.find('.g-price__saving').exists()).toBe(false)
    expect(spoken(w)).toBe('1,850 pesos mexicanos. Antes: 2,300 pesos mexicanos')
  })
  it('gratis con referencia: «Gratis» como __amount--word, la referencia y el ahorro', () => {
    const w = mk({ value: mx(0), compareAt: mx(150), compareLabel: 'Precio de lista' })
    expect(w.classes()).not.toContain('g-price--free')
    expect(w.find('.g-price__amount--word').text()).toBe('Gratis')
    expect(w.find('.g-price__saving').text()).toBe('Ahorras $150')
  })
  it('aviso 5: trace sin compareLabel usa labels.before; sin los dos, no se pinta', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ value: mx(1850), compareAt: mx(2300) })
    expect(w.find('.g-price__compare-label').text()).toBe('Antes')
    expect(warn.mock.calls.some((c) => /^\[Grana GPrice\].*sin compareLabel/.test(c[0]))).toBe(true)
    const n = mk({ value: mx(1850), compareAt: mx(2300), labels: { free: 'x' } })
    expect(n.find('.g-price__compare').exists()).toBe(false)
  })
})

describe('GPrice · A (total) y cifras que ruedan', () => {
  const total = (amount) => ({ value: mx(amount), label: 'por 2 noches' })
  it('el total arriba, el precio actual como contexto; la frase empieza por el total', () => {
    const w = mk({ value: mx(1850), lead: 'desde', unit: '/ noche', unitLabel: 'por noche', total: total(3700) })
    expect(w.classes()).toContain('g-price--has-total')
    expect([...visual(w).element.children].map((c) => c.className)).toEqual(['g-price__total', 'g-price__now'])
    const t = w.find('.g-price__total')
    expect(t.find('.g-price__total-label').text()).toBe('Total')
    expect(t.find('.g-price__total-amount').attributes('dir')).toBe('ltr')
    expect(t.find('.g-price__total-amount .g-price__number').text()).toBe('3,700')
    expect(t.find('.g-price__total-unit').text()).toBe('por 2 noches')
    expect(spoken(w)).toBe('Total por 2 noches: 3,700 pesos mexicanos. desde 1,850 pesos mexicanos por noche')
  })
  it('sin capa en el primer render; al cambiar el importe tras montar: slots alineados a la derecha y data-direction', async () => {
    const w = mk({ value: mx(1850), total: total(3700) })
    expect(w.find('.is-rolling').exists()).toBe(false)
    // jsdom: sin animación calculada; se simula una para que la capa no se retire en el acto
    const gcs = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => (el.classList?.contains('g-price__roll-new') ? { animationName: 'g-price-roll-up-new', animationDuration: '0.15s' } : gcs(el)))
    await w.setProps({ total: total(5950) })
    const amt = w.find('.g-price__total-amount')
    expect(amt.classes()).toContain('is-rolling')
    expect(amt.attributes('data-direction')).toBe('up')
    const slots = amt.findAll('.g-price__roll-slot')
    // «3,700» → «5,950»: cambian 3→5 y 70→95 (la coma y el último 0 quedan como texto; los contiguos comparten ranura)
    expect(slots.map((s) => [s.find('.g-price__roll-new').text(), s.find('.g-price__roll-old').text()])).toEqual([['5', '3'], ['95', '70']])
    expect(amt.find('.g-price__number').element.textContent.startsWith('5')).toBe(true)
    expect(spoken(w)).toContain('5,950 pesos mexicanos')
    await new Promise((r) => setTimeout(r, 40))
    expect(amt.classes()).toContain('is-rolling')
    // Retirada por animationend g-price-roll… (una animación calculada por slot)
    for (let i = 0; i < 2; i++) amt.element.dispatchEvent(Object.assign(new Event('animationend', { bubbles: true }), { animationName: 'g-price-roll-up-new' }))
    await nextTick()
    expect(w.find('.is-rolling').exists()).toBe(false)
    expect(w.find('.g-price__total-amount .g-price__number').text()).toBe('5,950')
  })
  it('bajar: data-direction down; un nombre de animación ajeno no retira la capa', async () => {
    const gcs = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => (el.classList?.contains('g-price__roll-new') ? { animationName: 'g-price-roll-down-new', animationDuration: '150ms' } : gcs(el)))
    const w = mk({ value: mx(1850), total: total(5950) })
    await w.setProps({ total: total(3700) })
    const amt = w.find('.g-price__total-amount')
    expect(amt.attributes('data-direction')).toBe('down')
    amt.element.dispatchEvent(Object.assign(new Event('animationend', { bubbles: true }), { animationName: 'g-reject-shake' }))
    await nextTick()
    expect(amt.classes()).toContain('is-rolling')
  })
  it('sin animación calculada (movimiento reducido, sin CSS): la capa se retira en el acto', async () => {
    const w = mk({ value: mx(1850), total: total(3700) })
    await w.setProps({ total: total(5950) })
    expect(w.find('.is-rolling').exists()).toBe(true)
    await new Promise((r) => setTimeout(r, 40))
    expect(w.find('.is-rolling').exists()).toBe(false)
    expect(w.find('.g-price__roll-slot').exists()).toBe(false)
  })
  it('no rueda: con una capa presente (la retira y no apila), al cambiar la moneda, con el mismo texto', async () => {
    const gcs = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => (el.classList?.contains('g-price__roll-new') ? { animationName: 'g-price-roll-up-new', animationDuration: '150ms' } : gcs(el)))
    const w = mk({ value: mx(1850), total: total(3700) })
    await w.setProps({ total: total(5950) })
    expect(w.find('.is-rolling').exists()).toBe(true)
    await w.setProps({ total: total(8200) })
    expect(w.find('.is-rolling').exists()).toBe(false)
    expect(w.find('.g-price__total-amount .g-price__number').text()).toBe('8,200')
    const u = mk({ value: [mx(1850), { amount: 105, currency: 'USD' }], total: { value: [mx(3700), { amount: 210, currency: 'USD' }], label: 'x' } })
    await u.setProps({ total: { value: [mx(3700), { amount: 211, currency: 'USD' }], label: 'x' } })
    expect(u.find('.is-rolling').exists()).toBe(false)
  })
  it('el total crece: lo que no tenía viejo va en su ranura sin __roll-old; los cambiados contiguos comparten ranura', async () => {
    const gcs = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => (el.classList?.contains('g-price__roll-new') ? { animationName: 'g-price-roll-up-new', animationDuration: '150ms' } : gcs(el)))
    const w = mk({ value: mx(950), total: total(950) })
    await w.setProps({ total: total(1250) })
    // «950» → «1,250»: «1,» entra sin viejo, 9→2 rueda, «50» queda como texto
    const slots = w.findAll('.g-price__roll-slot')
    expect(slots.map((s) => [s.find('.g-price__roll-new').text(), s.find('.g-price__roll-old').exists() ? s.find('.g-price__roll-old').text() : null])).toEqual([['1,', null], ['2', '9']])
    const num = w.find('.g-price__total-amount .g-price__number').element.cloneNode(true)
    num.querySelectorAll('.g-price__roll-old').forEach((x) => x.remove())
    expect(num.textContent).toBe('1,250')
  })
  it('un repintado del padre con el mismo total (objetos nuevos) no retira la capa en curso', async () => {
    const gcs = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => (el.classList?.contains('g-price__roll-new') ? { animationName: 'g-price-roll-up-new', animationDuration: '150ms' } : gcs(el)))
    const w = mk({ value: mx(1850), total: total(3700) })
    await w.setProps({ total: total(5950) })
    await new Promise((r) => setTimeout(r, 40))
    await w.setProps({ value: mx(1850), total: total(5950) })
    expect(w.find('.is-rolling').exists()).toBe(true)
  })
  it('rendimiento (P-A4): todos los GPrice que cambian a la vez se miden en un solo cuadro', async () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    const n = ref(2)
    const w = host('<div><g-price v-for="i in 5" :key="i" :value="mx(1850 + i)" :total="{ value: mx((1850 + i) * n), label: \'x\' }" locale="es-MX" :labels="L" /></div>', () => ({ n, mx, L }))
    await nextTick()
    const before = raf.mock.calls.length
    n.value = 3
    await nextTick()
    expect(w.findAll('.is-rolling').length).toBe(5)
    expect(raf.mock.calls.length - before).toBe(1)
    await new Promise((r) => setTimeout(r, 40))
    expect(w.findAll('.is-rolling').length).toBe(0)
  })
})

describe('GPrice · idioma, región y avisos', () => {
  it('locale: la prop › la región › el lang del ancestro (al montar)', async () => {
    const w = host('<div lang="en-US"><g-price :value="v" :labels="L" /></div>', () => ({ v: mx(1850), L }))
    await nextTick()
    expect(w.find('.g-price__spoken').text()).toBe('1,850 Mexican pesos')
    const s = host('<div lang="en-US"><g-price-scope currency="MXN" locale="de-DE" :labels="{ legend: \'Preise in {name}\' }"><g-price :value="v" /></g-price-scope></div>', () => ({ v: { amount: 1850, currency: 'EUR' } }))
    expect(sp(s.find('.g-price__now').text())).toBe('1.850 €')
  })
  it('herencia de labels desde la región (el GPrice los fusiona encima)', () => {
    const w = host('<g-price-scope currency="MXN" :labels="{ ...L, legend: \'Precios en {name} ({code})\' }" locale="es-MX"><g-price :value="null" /><g-price :value="null" :labels="{ onRequest: \'Consultar\' }" /></g-price-scope>', () => ({ L }))
    const p = w.findAll('.g-price')
    expect(p[0].text()).toBe('Precio a consultar')
    expect(p[1].text()).toBe('Consultar')
  })
  it('región: con leyenda omite el código; legend:false también; sin labels.legend lo conserva; display≠auto ignora la omisión', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const code = (tpl) => host(tpl, () => ({ v: mx(1850) })).find('.g-price__code').exists()
    expect(code('<g-price-scope currency="MXN" locale="es-MX" :labels="{ legend: \'Precios en {name}\' }"><g-price :value="v" /></g-price-scope>')).toBe(false)
    expect(code('<g-price-scope currency="MXN" locale="es-MX" :legend="false"><g-price :value="v" /></g-price-scope>')).toBe(false)
    expect(code('<g-price-scope currency="MXN" locale="es-MX"><g-price :value="v" /></g-price-scope>')).toBe(true)
    expect(host('<g-price-scope currency="MXN" locale="es-MX" :legend="false"><g-price :value="v" display="code" /></g-price-scope>', () => ({ v: mx(1850) })).find('.g-price__symbol').text()).toMatch(/^MXN/)
  })
  it('B · view cambia todas las alternativas de la región a la vez', async () => {
    const view = ref('MXN')
    const v = [mx(1850), { amount: 105.11, currency: 'USD', approximate: true }]
    const w = host('<g-price-scope currency="MXN" :view="view" locale="es-MX" :labels="{ approx: \'aprox.\', legend: \'Precios en {name} ({code})\' }"><g-price :value="v" /><g-price :value="v" /></g-price-scope>', () => ({ view, v }))
    expect(w.findAll('.g-price').map((p) => p.attributes('data-currency'))).toEqual(['MXN', 'MXN'])
    view.value = 'USD'
    await nextTick()
    expect(w.findAll('.g-price').map((p) => p.attributes('data-currency'))).toEqual(['USD', 'USD'])
    expect(w.find('.g-price__approx').text()).toBe('aprox.')
    expect(w.find('.g-price-scope').attributes('data-currency')).toBe('USD')
  })
  it('avisos con el prefijo de GPrice, una vez por instancia y motivo (también los de formatPrice)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const w = mk({ value: mx(1), cents: 'never', locale: 'xx-invalid-123456789', labels: {} })
    await w.setProps({ value: mx(2) })
    await w.setProps({ value: mx(0) })
    const m = warn.mock.calls.map((c) => c[0])
    expect(m.every((x) => x.startsWith('[Grana GPrice]'))).toBe(true)
    expect(m.filter((x) => /cents="never"/.test(x))).toHaveLength(1)
    expect(m.filter((x) => /locale «xx-invalid/.test(x))).toHaveLength(1)
    expect(m.some((x) => /labels\.free/.test(x))).toBe(true)
    mk({ value: [mx(1), { amount: 1, currency: 'USD' }] })
    expect(warn.mock.calls.some((c) => /fuera de un GPriceScope/.test(c[0]))).toBe(true)
  })
  it('no lleva región viva: cambiar value cambia la frase en silencio', async () => {
    const w = mk({ value: mx(1) })
    await w.setProps({ value: mx(2) })
    expect(w.find('[aria-live], [role="status"]').exists()).toBe(false)
    expect(spoken(w)).toBe('2 pesos mexicanos')
  })
  it('cumple el render de una función: h(GPrice) sin locale monta y reformatea con navigator.language', async () => {
    const w = mount(defineComponent({ render: () => h(GPrice, { value: mx(1850), labels: L }) }), { attachTo: document.body })
    mounted.push(w)
    await nextTick()
    expect(w.find('.g-price__number').text()).not.toBe('1850')
  })
})
