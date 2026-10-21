// Prototipo de kiwi (r01) de moneda y precio: precio de solo lectura (propuesta GPrice + utilidad formatPrice) y campo de moneda
// (propuesta: GNumberField con `currency`). NO es el .vue de bruno: es un banco para decidir estructura y forma.
// Usa los componentes REALES de dist/ (GCard, GBadge, GDatePicker, GNumberField, GSelect, GRadioGroup, GFormLayout, GFormRow) con Vue
// global y los tokens reales del tema por defecto. XPrice, XPriceScope y XMoneyField son del prototipo (price.css: solo tokens).
// ?c=base|A|B|C   &lang=es-MX|en-US   &theme=dark   &dir=rtl   &w=<px> (ancho del escenario)
;(function () {
  const { createApp, ref, reactive, computed, watch, inject, provide, defineComponent, h, nextTick, onMounted } = Vue
  const Q = new URLSearchParams(location.search)
  const C = ['base', 'A', 'B', 'C'].includes(Q.get('c')) ? Q.get('c') : 'base'
  const LANG = ['es-MX', 'en-US'].includes(Q.get('lang')) ? Q.get('lang') : 'es-MX'
  document.documentElement.lang = LANG
  if (Q.get('theme') === 'dark') document.documentElement.dataset.theme = 'dark'
  if (Q.get('dir') === 'rtl') document.documentElement.dir = 'rtl'
  const W = Number(Q.get('w')) || 0

  // ====================================================================================================================
  // Motor propuesto: formatPrice (utilidad pura; la usarían GPrice, el slot `day` de GDatePicker, GSlider `format` y la app)
  // ====================================================================================================================

  // Símbolos compartidos por varias monedas (P-L4). En Grana sería una tabla generada en el build desde Intl/CLDR y vigilada por una
  // prueba; aquí se calcula al vuelo para medir cuánto cuesta (window.__pr.ambiguityMs) y comprobar que la tabla sale de los datos.
  let SHARED = null
  const sharedSymbols = () => {
    if (SHARED) return SHARED
    const t0 = performance.now()
    const map = new Map()
    let list = []
    try { list = Intl.supportedValuesOf('currency') } catch { list = ['USD', 'MXN', 'CAD', 'JPY', 'CNY', 'GBP', 'EUR'] }
    for (const c of list) {
      try {
        const s = new Intl.NumberFormat('en', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' }).formatToParts(1).find((p) => p.type === 'currency').value
        if (/^[A-Z]{3}$/.test(s)) continue
        map.set(s, (map.get(s) || 0) + 1)
      } catch {}
    }
    SHARED = new Set([...map].filter(([, n]) => n > 1).map(([s]) => s))
    window.__pr.ambiguityMs = Math.round((performance.now() - t0) * 10) / 10
    window.__pr.shared = [...SHARED]
    return SHARED
  }

  const digitsOf = (currency, locale) => { try { return new Intl.NumberFormat(locale, { style: 'currency', currency }).resolvedOptions().maximumFractionDigits } catch { return 2 } }
  const isInt = (n, d) => Math.round(n * 10 ** d) % 10 ** d === 0
  // Resta sin error de coma flotante: enteros escalados a los decimales de la moneda
  const sub = (a, b, d) => (Math.round(a * 10 ** d) - Math.round(b * 10 ** d)) / 10 ** d

  // Partes visibles de un importe: { before, number, after, code, minus }
  //  display: 'auto' (símbolo; + código si el símbolo es compartido y la región no lo dice ya) | 'symbol' | 'code' | 'none' (solo cifra)
  //  cents: 'auto' (sin ,00 si es entero) | 'always' | 'never' (redondea a enteros: solo para piezas diminutas, xs)
  function visualParts (money, { locale, display = 'auto', cents = 'auto', scopeCurrency = null } = {}) {
    const { amount, currency } = money
    const d = digitsOf(currency, locale)
    const opts = { style: 'currency', currency, currencyDisplay: display === 'code' ? 'code' : 'symbol' }
    if (cents === 'never') { opts.maximumFractionDigits = 0; opts.minimumFractionDigits = 0 } else if (cents === 'auto' && isInt(amount, d)) opts.trailingZeroDisplay = 'stripIfInteger'
    const parts = new Intl.NumberFormat(locale, opts).formatToParts(amount)
    const ci = parts.findIndex((p) => p.type === 'currency')
    const ni = parts.findIndex((p) => p.type === 'integer')
    const sym = ci >= 0 ? parts[ci].value : ''
    const inScope = scopeCurrency && scopeCurrency === currency
    const hideSymbol = display === 'none'
    let before = '', after = '', number = ''
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      if (p.type === 'minusSign' && i < ci) { before = '\u2212' + before; continue }
      if (p.type === 'currency') { if (hideSymbol) continue; if (i < ni) before += p.value; else after += p.value; continue }
      if (p.type === 'literal' && (parts[i - 1]?.type === 'currency' || parts[i + 1]?.type === 'currency')) { if (hideSymbol) continue; if (i < ni) before += p.value; else after = p.value + after; continue }
      number += p.value
    }
    before = before.replace(/[‎‏]/g, ''); after = after.replace(/[‎‏]/g, '')
    // Código explícito: solo si el símbolo es compartido (P-L4) y la región no declara ya esta moneda (B)
    const ambiguous = display === 'auto' && sharedSymbols().has(sym)
    const code = ambiguous && !inScope ? currency : ''
    return { before, number: number.replace(/[‎‏]/g, ''), after, code, symbol: sym, ambiguous, digits: d }
  }
  const visualText = (vp) => (vp.before + vp.number + vp.after + (vp.code ? ' ' + vp.code : '')).trim()

  // Lectura: siempre con el nombre de la moneda (el lector nunca dice «dólar» por un «$» de pesos) y sin ,00 en enteros
  function spoken (money, locale, { cents = 'auto' } = {}) {
    const d = digitsOf(money.currency, locale)
    const opts = { style: 'currency', currency: money.currency, currencyDisplay: 'name' }
    if (cents === 'never') { opts.maximumFractionDigits = 0; opts.minimumFractionDigits = 0 } else if (isInt(money.amount, d)) opts.trailingZeroDisplay = 'stripIfInteger'
    return new Intl.NumberFormat(locale, opts).format(money.amount).replace(/[‎‏]/g, '')
  }
  const plainNumber = (n, money, locale) => {
    const d = digitsOf(money.currency, locale)
    return new Intl.NumberFormat(locale, { minimumFractionDigits: isInt(n, d) ? 0 : d, maximumFractionDigits: d }).format(n)
  }
  const fill = (tpl, o) => tpl.replace(/\{(\w+)\}/g, (_, k) => (o[k] ?? ''))

  // Textos de la aplicación (Grana no trae textos por defecto, #226)
  const L = {
    'es-MX': { free: 'Gratis', onRequest: 'Precio a consultar', before: 'Antes', range: '{min} a {max}', saving: 'Ahorras {amount}', approx: 'aprox.', total: 'Total', legend: 'Precios en {name} ({code})', taxes: 'IVA incluido', view: 'Ver precios en', perNight: 'por noche', perNightShort: '/ noche', perPerson: 'por persona', each: 'c/u', eachLabel: 'cada uno', from: 'desde', nights: (n) => `por ${n} ${n === 1 ? 'noche' : 'noches'}`, compareSeason: 'Temporada alta', calendarLegend: 'Precio por noche en {name}' },
    'en-US': { free: 'Free', onRequest: 'Price on request', before: 'Was', range: '{min} to {max}', saving: 'You save {amount}', approx: 'approx.', total: 'Total', legend: 'Prices in {name} ({code})', taxes: 'VAT included', view: 'Show prices in', perNight: 'per night', perNightShort: '/ night', perPerson: 'per person', each: 'ea.', eachLabel: 'each', from: 'from', nights: (n) => `for ${n} ${n === 1 ? 'night' : 'nights'}`, compareSeason: 'High season', calendarLegend: 'Nightly price in {name}' }
  }[LANG]
  const currencyName = (code, locale, plural = true) => {
    try {
      if (plural) return new Intl.NumberFormat(locale, { style: 'currency', currency: code, currencyDisplay: 'name' }).formatToParts(2).find((p) => p.type === 'currency').value
      return new Intl.DisplayNames([locale], { type: 'currency' }).of(code)
    } catch { return code }
  }

  window.__pr = { ready: false, C, LANG, sharedSymbols, visualParts, visualText, spoken, digitsOf, currencyName }

  // ====================================================================================================================
  // XPriceScope (concepto B · «La moneda se dice una vez»): región de precios con su leyenda y, si la app lo da, la moneda de la vista
  // ====================================================================================================================
  const scopeKey = Symbol('price-scope')
  const XPriceScope = defineComponent({
    props: { currency: String, view: String, legend: { type: Boolean, default: true }, taxes: String, as: { type: String, default: 'div' } },
    setup (props, { slots }) {
      const id = 'pscope-' + Math.random().toString(36).slice(2, 7)
      const shown = computed(() => props.view || props.currency)
      provide(scopeKey, { currency: shown })
      return () => h(props.as, { class: 'xps', 'data-currency': shown.value }, [
        props.legend ? h('p', { class: 'xps__legend', id }, [
          h('span', { class: 'xps__seal', 'aria-hidden': 'true' }, shown.value),
          h('span', { class: 'xps__legend-text' }, fill(L.legend, { name: currencyName(shown.value, LANG), code: shown.value }) + (props.taxes ? ' · ' + props.taxes : ''))
        ]) : null,
        slots.default?.()
      ])
    }
  })

  // ====================================================================================================================
  // XPrice: base funcional + conceptos A (la cuenta), B (la moneda se dice una vez) y C (el antes y el ahora)
  // ====================================================================================================================
  // value: Money | Money[] (alternativas por moneda, la app las calcula; B elige la de la vista) | null («a consultar»)
  // compareAt: Money (precio de referencia)   max: Money (rango)   lead: «desde»   unit + unitLabel: «/ noche» + «por noche»
  // total: { value: Money, label: 'por 2 noches' } (A)   compareLabel: qué es la referencia (C; «Temporada alta»)
  const pick = (v, cur) => (Array.isArray(v) ? (v.find((m) => m.currency === cur) || v[0]) : v)
  const XPrice = defineComponent({
    props: {
      value: [Object, Array], compareAt: [Object, Array], max: [Object, Array], lead: String, unit: String, unitLabel: String,
      total: Object, compareLabel: String, size: { type: String, default: 'md' }, display: { type: String, default: 'auto' },
      cents: { type: String, default: 'auto' }, concept: { type: String, default: C }, locale: String
    },
    setup (props) {
      const scope = inject(scopeKey, null)
      const loc = computed(() => props.locale || LANG)
      const scopeCur = computed(() => (props.concept === 'B' && scope ? scope.currency.value : null))
      const val = computed(() => pick(props.value, scopeCur.value))
      const cmp = computed(() => pick(props.compareAt, val.value?.currency))
      const mx = computed(() => pick(props.max, val.value?.currency))
      const tot = computed(() => (props.total ? { ...props.total, value: pick(props.total.value, val.value?.currency) } : null))
      const o = computed(() => ({ locale: loc.value, display: props.display, cents: props.cents, scopeCurrency: scopeCur.value }))
      const amountNode = (m, cls = 'xp__amount', hideCode = false) => {
        const vp = visualParts(m, o.value)
        return h('span', { class: cls, dir: 'ltr' }, [
          vp.before ? h('span', { class: 'xp__sym' }, vp.before) : null,
          h('span', { class: 'xp__num' }, vp.number),
          vp.after ? h('span', { class: 'xp__sym' }, vp.after) : null,
          vp.code && !hideCode ? h('span', { class: 'xp__code' }, ' ' + vp.code) : null
        ])
      }
      return () => {
        const m = val.value
        const kids = []
        const say = []
        const isFree = m && m.amount === 0
        // Sin valor: «a consultar» (texto de la app; se lee tal cual, sin duplicar)
        if (!m) return h('span', { class: ['xp', 'xp--' + props.size, 'xp--on-request'] }, L.onRequest)
        if (isFree && !cmp.value) return h('span', { class: ['xp', 'xp--' + props.size, 'xp--free'] }, L.free)
        if (props.lead) { kids.push(h('span', { class: 'xp__lead' }, props.lead + ' ')); say.push(props.lead) }
        const approx = m.approximate ? L.approx + ' ' : ''
        if (approx) kids.push(h('span', { class: 'xp__approx' }, L.approx + ' '))
        // Importe (o rango)
        if (mx.value) {
          const minVp = visualParts(m, { ...o.value, display: 'symbol' })
          kids.push(h('span', { class: 'xp__amount', dir: 'ltr' }, [h('span', { class: 'xp__num' }, visualText(minVp))]))
          kids.push(h('span', { class: 'xp__sep' }, ' ' + fill(L.range, { min: '', max: '' }).trim() + ' '))
          kids.push(amountNode(mx.value))
          say.push(approx + fill(L.range, { min: plainNumber(m.amount, m, loc.value), max: spoken(mx.value, loc.value, o.value) }))
        } else if (isFree) {
          kids.push(h('span', { class: 'xp__amount xp__amount--word' }, L.free)); say.push(L.free)
        } else {
          kids.push(amountNode(m)); say.push(approx + spoken(m, loc.value, o.value))
        }
        if (props.unit) { kids.push(h('span', { class: 'xp__unit' }, ' ' + props.unit)); say.push(props.unitLabel || props.unit) }
        let sentence = say.join(' ')
        // Referencia: base = tachado visible + lectura; C = «antes → ahora» sin tachado, con lo que ahorras y qué es la referencia
        let ref = null
        if (cmp.value) {
          const saving = sub(cmp.value.amount, m.amount, digitsOf(m.currency, loc.value))
          const refLabel = props.compareLabel || L.before
          if (props.concept === 'C') {
            const savingM = { amount: saving, currency: m.currency }
            ref = h('span', { class: 'xp__trace' }, [
              h('span', { class: 'xp__was' }, [h('span', { class: 'xp__was-label' }, refLabel + ' '), amountNode(cmp.value, 'xp__amount xp__amount--was', true)]),
              h('span', { class: 'xp__arrow', innerHTML: window.lucide('arrow-right') }),
              saving > 0 ? h('span', { class: 'xp__saving' }, fill(L.saving, { amount: visualText(visualParts(savingM, { ...o.value, scopeCurrency: m.currency })) })) : null
            ])
            sentence += `. ${refLabel}: ${spoken(cmp.value, loc.value, o.value)}` + (saving > 0 ? `. ${fill(L.saving, { amount: spoken(savingM, loc.value, o.value) })}` : '')
          } else {
            ref = h('s', { class: 'xp__compare' }, [amountNode(cmp.value, 'xp__amount xp__amount--compare', true)])
            sentence += `. ${refLabel}: ${spoken(cmp.value, loc.value, o.value)}`
          }
        }
        // A · La cuenta: el total de lo que la persona pidió, que da la app (las noches no cuestan todas igual)
        let totalNode = null
        if (tot.value && props.concept === 'A') {
          totalNode = h('span', { class: 'xp__total' }, [
            h('span', { class: 'xp__total-label' }, L.total + ' '),
            h(XRoll, { text: visualText(visualParts(tot.value.value, o.value)), key: 'roll' }),
            h('span', { class: 'xp__total-unit' }, ' ' + tot.value.label)
          ])
          sentence = `${L.total} ${tot.value.label}: ${spoken(tot.value.value, loc.value, o.value)}. ` + sentence
        }
        const visual = h('span', { class: 'xp__visual', 'aria-hidden': 'true' }, props.concept === 'C' && ref
          ? [ref, h('span', { class: 'xp__now' }, kids)]
          : props.concept === 'A' && totalNode ? [totalNode, h('span', { class: 'xp__now xp__now--unit' }, kids), ref] : [h('span', { class: 'xp__now' }, kids), ref])
        return h('span', { class: ['xp', 'xp--' + props.size, 'xp--' + props.concept, cmp.value ? 'xp--has-compare' : '', tot.value && props.concept === 'A' ? 'xp--has-total' : ''], 'data-currency': m.currency }, [
          visual,
          h('span', { class: 'xp__spoken' }, sentence)
        ])
      }
    }
  })

  // Cifras que ruedan (la P2 de GNumberField reutilizada): solo las posiciones que cambian, alineadas a la derecha; con movimiento
  // reducido no se crea la capa (medido en verificar.mjs). El texto ya es el nuevo desde el primer cuadro.
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  const XRoll = defineComponent({
    props: { text: String },
    setup (props) {
      const prev = ref(props.text)
      const slots = ref(null)
      const dir = ref('up')
      watch(() => props.text, (n, o) => {
        if (reduced() || n === o) { slots.value = null; prev.value = n; return }
        const a = [...o], b = [...n]
        const out = []
        for (let i = 1; i <= b.length; i++) {
          const nc = b[b.length - i], oc = a[a.length - i]
          out.unshift(nc === oc ? { t: nc } : { t: nc, old: oc ?? '', ch: true })
        }
        const num = (s) => Number(s.replace(/[^\d.,-]/g, '').replace(/,/g, ''))
        dir.value = num(n) >= num(o) ? 'up' : 'down'
        slots.value = out
        prev.value = n
        window.__pr.rolls = (window.__pr.rolls || 0) + 1
      })
      const done = (e) => { if (e.animationName.startsWith('xp-roll')) slots.value = null }
      return () => h('span', { class: ['xp__amount', 'xp__roll'], dir: 'ltr', 'data-direction': dir.value, onAnimationend: done, onAnimationcancel: done },
        slots.value ? slots.value.map((s) => (s.ch ? h('span', { class: 'xp__roll-slot' }, [h('span', { class: 'xp__roll-new' }, s.t), s.old ? h('span', { class: 'xp__roll-old' }, s.old) : null]) : s.t)) : props.text)
    }
  })

  // ====================================================================================================================
  // XMoneyField: la propuesta de `GNumberField currency` montada con el GNumberField REAL (solo deriva props; no hay motor nuevo)
  // ====================================================================================================================
  function currencyFieldProps (currency, locale) {
    const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(1234.5)
    const ci = parts.findIndex((p) => p.type === 'currency'), ni = parts.findIndex((p) => p.type === 'integer')
    const sym = parts[ci].value.replace(/[‎‏]/g, '')
    const vp = visualParts({ amount: 1, currency }, { locale })
    const visible = vp.ambiguous ? `${sym} ${currency}`.trim() : sym
    const name = currencyName(currency, locale)
    const side = ci < ni ? 'prefix' : 'suffix'
    const precision = digitsOf(currency, locale)
    return { side, visible, name, precision }
  }
  const XMoneyField = defineComponent({
    props: { modelValue: Number, currency: String, label: String, hint: String, name: String, min: Number, max: Number, locale: String, error: String },
    emits: ['update:modelValue'],
    setup (props, { emit }) {
      const cp = computed(() => currencyFieldProps(props.currency, props.locale || LANG))
      const NF = Vue.resolveComponent('GNumberField')
      return () => h(NF, {
        modelValue: props.modelValue, 'onUpdate:modelValue': (v) => emit('update:modelValue', v),
        label: props.label, hint: props.hint, name: props.name, min: props.min, max: props.max, error: props.error,
        locale: props.locale || LANG, precision: cp.value.precision, grouping: true, block: true,
        // El símbolo es texto de la caja (P1: pegado al número); la lectura lleva el nombre: «pesos mexicanos»
        [cp.value.side]: cp.value.visible, [cp.value.side + 'Label']: cp.value.name
      })
    }
  })

  // ====================================================================================================================
  // Datos de las escenas
  // ====================================================================================================================
  const mxn = (amount, extra) => ({ amount, currency: 'MXN', ...extra })
  const usd = (amount, extra) => ({ amount, currency: 'USD', ...extra })
  const RATE = 17.6 // solo para fabricar alternativas «aprox.» de la escena B: la conversión es de la app, nunca de Grana
  const alt = (amount) => [mxn(amount), usd(Math.round((amount / RATE) * 100) / 100, { approximate: true })]
  // Tarifas por noche distintas (viernes y sábado más caros): el total no es unidad × noches (por eso lo da la app en A)
  const NIGHTLY = [1850, 1850, 2250, 2250, 1850, 1850, 1850]
  const ROOMS = [
    { id: 'patio', eyebrow: 'Habitación', title: 'Patio de los naranjos', meta: '2 personas · cama queen · 24 m²', from: 1850, nightly: NIGHTLY, compare: 2300 },
    { id: 'terraza', eyebrow: 'Suite', title: 'Terraza con vista a Santo Domingo', meta: '3 personas · cama king · 38 m²', from: 2900, nightly: NIGHTLY.map((n) => n + 1050) },
    { id: 'tour', eyebrow: 'Recorrido', title: 'Hierve el Agua y Mitla', meta: 'Día completo · salida 8:00 · guía bilingüe', usdOnly: 95, perPerson: true }
  ]
  const MENU = [
    { name: 'Tlayuda de tasajo', desc: 'Asiento, quesillo, frijol y tasajo de la plaza', price: 185 },
    { name: 'Mole negro con pollo', desc: 'Receta de la casa, arroz y tortillas a mano', price: 240 },
    { name: 'Agua de chilacayota', desc: 'Jarra para la mesa', price: 0, free: true },
    { name: 'Mezcal espadín (copa)', desc: 'Pregunta por la selección de la semana', price: 95.5 },
    { name: 'Menú de temporada', desc: 'Cambia cada semana', price: null }
  ]

  const app = createApp({
    components: { XPrice, XPriceScope, XMoneyField },
    setup () {
      const nights = ref(2)
      const view = ref('MXN')
      const fieldAmount = ref(1850)
      const fieldCurrency = ref('MXN')
      const fieldAmountJp = ref(null)
      const fieldDe = ref(1850)
      const TODAY = new Date().toISOString().slice(0, 10)
      const dayRange = ref(null)
      const totalFor = (r) => {
        const sum = r.nightly.slice(0, nights.value).reduce((a, b) => a + b, 0)
        return { value: alt(sum), label: L.nights(nights.value) }
      }
      const dayPrice = (iso) => {
        const d = new Date(iso + 'T00:00:00Z').getUTCDay()
        return (d === 5 || d === 6) ? 2250 : 1850
      }
      const CART = computed(() => [
        { k: 'Patio de los naranjos · 2 noches', v: mxn(3700) },
        { k: 'Recorrido Hierve el Agua · 2 personas', v: usd(190) },
        { k: 'Desayuno oaxaqueño · 2', v: mxn(0) },
        { k: 'Descuento de temporada', v: mxn(-200) }
      ])
      const currencies = [{ value: 'MXN', label: 'MXN · peso mexicano' }, { value: 'USD', label: 'USD · dólar estadounidense' }, { value: 'JPY', label: 'JPY · yen japonés' }, { value: 'EUR', label: 'EUR · euro' }]
      const viewOptions = [{ value: 'MXN', label: 'MXN' }, { value: 'USD', label: 'USD (aprox.)' }]
      onMounted(() => nextTick(() => { window.__pr.ready = true }))
      Object.assign(window.__pr, { nights, view, fieldAmount, fieldCurrency, fieldAmountJp })
      return { TODAY, C, L, LANG, W, ROOMS, MENU, CART, nights, view, viewOptions, fieldAmount, fieldCurrency, fieldAmountJp, fieldDe, currencies, dayRange, totalFor, dayPrice, mxn, usd, alt, lucide: window.lucide }
    },
    template: `
<header class="pr-top">
  <h1>Moneda y precio · r01</h1>
  <nav aria-label="Conceptos" class="pr-nav">
    <a v-for="k in ['base','A','B','C']" :key="k" :href="'?c='+k+(LANG!=='es-MX'?'&lang='+LANG:'')" :aria-current="C===k?'page':undefined">{{ k==='base'?'Base':k }}</a>
    <span class="pr-nav__sep" aria-hidden="true"></span>
    <a :href="'?c='+C+'&lang='+(LANG==='es-MX'?'en-US':'es-MX')" lang="en">{{ LANG==='es-MX' ? 'English page' : 'Página en español' }}</a>
  </nav>
  <p class="pr-intro" v-if="C==='base'">Base funcional: lo visible es corto y la lectura completa («desde 1,850 pesos mexicanos por noche»). El código aparece solo si el símbolo es de varias monedas.</p>
  <p class="pr-intro" v-else-if="C==='A'">A · La cuenta: la tarjeta dice lo que te va a costar lo que pediste. Cambia las noches: el total lo da la aplicación (viernes y sábado cuestan más) y sus cifras ruedan.</p>
  <p class="pr-intro" v-else-if="C==='B'">B · La moneda se dice una vez: la región declara su moneda con una leyenda; dentro, el símbolo basta y solo lo extranjero lleva código. La app puede dar la moneda de la vista.</p>
  <p class="pr-intro" v-else>C · El antes y el ahora: el precio de referencia no se tacha; se dice qué es («Temporada alta»), cuánto ahorras y se lee igual que se ve.</p>
</header>

<main class="pr-stage" :style="W ? { maxInlineSize: W + 'px' } : null">

  <section class="pr-sec" aria-labelledby="h-cards">
    <h2 id="h-cards">Tarjetas de oferta (hotel y recorrido)</h2>
    <div class="pr-controls" v-if="C==='A'" data-nights>
      <g-number-field label="Noches" v-model="nights" :min="1" :max="7" steppers decrement-label="Una noche menos" increment-label="Una noche más" size="sm" />
    </div>
    <div class="pr-controls" v-if="C==='B'" data-view>
      <g-radio-group label="Ver precios en" appearance="segmented" v-model="view" :options="viewOptions" size="sm" />
    </div>
    <component :is="C==='B' ? 'x-price-scope' : 'div'" v-bind="C==='B' ? { currency: 'MXN', view, taxes: L.taxes } : {}">
      <ul class="pr-cards">
        <li v-for="r in ROOMS" :key="r.id">
          <g-card as="article" level="outlined" :eyebrow="r.eyebrow" :title="r.title" :description="r.meta" interaction="link" :href="'#'+r.id" :data-room="r.id" @navigate="(e)=>e.event && e.event.preventDefault()">
            <div class="pr-card-price">
              <x-price v-if="r.usdOnly" :value="usd(r.usdOnly)" :unit="L.perPerson" :unit-label="L.perPerson" size="md" />
              <x-price v-else :value="C==='B' ? alt(r.from) : mxn(r.from)" :lead="L.from" :unit="L.perNightShort" :unit-label="L.perNight"
                :compare-at="r.compare ? mxn(r.compare) : null" :compare-label="C==='C' ? L.compareSeason : null"
                :total="C==='A' ? totalFor(r) : null" size="md" />
            </div>
          </g-card>
        </li>
      </ul>
    </component>
  </section>

  <section class="pr-sec" aria-labelledby="h-menu">
    <h2 id="h-menu">Carta del restaurante</h2>
    <component :is="C==='B' ? 'x-price-scope' : 'div'" v-bind="C==='B' ? { currency: 'MXN', taxes: L.taxes } : {}">
      <dl class="pr-menu">
        <div class="pr-menu__row" v-for="d in MENU" :key="d.name">
          <dt class="pr-menu__name">{{ d.name }}</dt>
          <dd class="pr-menu__desc">{{ d.desc }}</dd>
          <dd class="pr-menu__price"><x-price :value="d.price===null ? null : mxn(d.price)" size="sm" /></dd>
        </div>
      </dl>
    </component>
  </section>

  <section class="pr-sec" aria-labelledby="h-cart">
    <h2 id="h-cart">Pie de carrito (monedas mezcladas)</h2>
    <component :is="C==='B' ? 'x-price-scope' : 'div'" v-bind="C==='B' ? { currency: 'MXN', legend: true } : {}">
      <dl class="pr-cart">
        <div class="pr-cart__row" v-for="l in CART" :key="l.k"><dt>{{ l.k }}</dt><dd><x-price :value="l.v" size="sm" cents="always" /></dd></div>
        <div class="pr-cart__row pr-cart__row--total"><dt>Total en pesos</dt><dd><x-price :value="mxn(3500)" size="lg" cents="always" /></dd></div>
        <div class="pr-cart__row pr-cart__row--total"><dt>Total en dólares</dt><dd><x-price :value="usd(190)" size="lg" cents="always" /></dd></div>
      </dl>
    </component>
  </section>

  <section class="pr-sec" aria-labelledby="h-cal">
    <h2 id="h-cal">Precio por noche en el calendario (slot <code>day</code> de GDatePicker)</h2>
    <p class="pr-note" id="cal-legend">{{ L.calendarLegend.replace('{name}', 'pesos mexicanos') }}</p>
    <div class="pr-cal" data-cal>
      <g-date-picker inline mode="range" v-model="dayRange" :min="TODAY" months="1" :labels="{ prev: 'Mes anterior', next: 'Mes siguiente', dialog: 'Elegir fechas', today: 'hoy', rangeStart: 'llegada', rangeEnd: 'salida', inRange: 'en tu estancia', selected: 'elegida', unavailable: 'sin disponibilidad' }">
        <template #day="{ date, disabled, outside }">
          <x-price v-if="!disabled && !outside" :value="mxn(dayPrice(date))" size="xs" display="none" cents="never" concept="base" />
        </template>
      </g-date-picker>
    </div>
  </section>

  <section class="pr-sec" aria-labelledby="h-edge">
    <h2 id="h-edge">Casos límite</h2>
    <ul class="pr-edge">
      <li data-case="range"><span class="pr-edge__k">Rango</span> <x-price :value="mxn(900)" :max="mxn(1400)" :unit="L.perPerson" :unit-label="L.perPerson" /></li>
      <li data-case="free"><span class="pr-edge__k">Gratis</span> <x-price :value="mxn(0)" /></li>
      <li data-case="free-compare"><span class="pr-edge__k">Gratis con referencia</span> <x-price :value="mxn(0)" :compare-at="mxn(150)" /></li>
      <li data-case="on-request"><span class="pr-edge__k">A consultar</span> <x-price :value="null" /></li>
      <li data-case="each"><span class="pr-edge__k">Unidad</span> <x-price :value="mxn(45)" :unit="L.each" :unit-label="L.eachLabel" /></li>
      <li data-case="negative"><span class="pr-edge__k">Descuento</span> <x-price :value="mxn(-200)" cents="always" /></li>
      <li data-case="jpy"><span class="pr-edge__k">JPY (0 decimales)</span> <x-price :value="{ amount: 12800, currency: 'JPY' }" /></li>
      <li data-case="kwd"><span class="pr-edge__k">KWD (3 decimales)</span> <x-price :value="{ amount: 12.125, currency: 'KWD' }" /></li>
      <li data-case="en-mxn"><span class="pr-edge__k">MXN en una página en inglés</span> <x-price :value="mxn(1850)" locale="en-US" lang="en-US" /></li>
      <li data-case="eur-de"><span class="pr-edge__k">EUR en alemán</span> <x-price :value="{ amount: 1850, currency: 'EUR' }" locale="de-DE" lang="de-DE" /></li>
      <li data-case="ar" lang="ar-EG" dir="rtl"><span class="pr-edge__k">جنيه مصري</span> <x-price :value="{ amount: 1850, currency: 'EGP' }" locale="ar-EG" /></li>
      <li data-case="approx"><span class="pr-edge__k">Aproximado</span> <x-price :value="usd(105, { approximate: true })" /></li>
    </ul>
  </section>

  <section class="pr-sec" aria-labelledby="h-field">
    <h2 id="h-field">Campo de moneda (propuesta: <code>GNumberField currency</code>, montada sobre el GNumberField real)</h2>
    <g-form-layout>
      <g-form-row>
        <g-select label="Moneda" v-model="fieldCurrency" :options="currencies" name="moneda" data-field-currency />
        <div data-field="main"><x-money-field label="Precio por noche" hint="Sin impuestos" v-model="fieldAmount" :currency="fieldCurrency" name="precio" :min="0" /></div>
      </g-form-row>
      <g-form-row>
        <div data-field="jpy"><x-money-field label="Precio en yenes" v-model="fieldAmountJp" currency="JPY" name="precio_jpy" /></div>
        <div data-field="de" lang="de-DE"><x-money-field label="Preis pro Nacht" v-model="fieldDe" currency="EUR" locale="de-DE" name="preis" /></div>
      </g-form-row>
    </g-form-layout>
    <p class="pr-note">Modelo: <output data-model>{{ JSON.stringify({ amount: fieldAmount, currency: fieldCurrency }) }}</output></p>
  </section>
</main>
<div class="pr-live" aria-live="polite" data-live></div>`
  })
  app.use(Grana.default || Grana)
  app.mount('#app')
})()
