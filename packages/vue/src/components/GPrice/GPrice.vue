<script>
// GPrice · un precio que se dice como se habla (dueño: bruno)
// Contrato: design/contracts/price.md (DECISIONS.md #768 a #779) · Estructura: design/lab/price/r01/ (kiwi) · Estilo:
// GPrice.css (coco). Base + C (la referencia nombrada, `trace`, por defecto) + A (`total`, las cifras que ruedan). Lo visible
// va en `__visual` aria-hidden y la frase en `__spoken` (texto oculto accesible); sin rol, sin foco, sin región viva (#770).
// La regla es formatPrice (utils/price.js); los datos de la moneda, utils/currency.js (llega del principal por __shared).
// Función de render (no plantilla): el tope de la entrada es 6 KiB gzip (#776) y la plantilla compilada pesa más.
import { computed, defineComponent, h, inject, onBeforeUnmount, ref, unref, watch } from 'vue'
import { oneOf } from '../../utils/oneOf.js'
import { formatPrice } from '../../utils/price.js'
import { nextFrame } from '../GForm/formContext.js'
import GIcon from '../GIcon/GLibIcon.js'
import { okLocale, onceWarner, priceScopeKey, useLocale } from './priceScope.js'

const ROLL = 'g-price-roll'
// ¿Tiene el elemento una animación g-price-roll… con duración? (estilo calculado; no consulta matchMedia ni duraciones)
const animated = (x) => {
  const cs = getComputedStyle(x)
  const durs = String(cs.animationDuration).split(',')
  return String(cs.animationName).split(',').some((name, i) => name.trim().startsWith(ROLL) && parseFloat(durs[i % durs.length]) > 0)
}
// Lote por cuadro de todos los GPrice (P-A4): una sola rAF para todos. Dentro solo se lee el DOM; una retirada cambia
// estado de Vue, que repinta al acabar el lote (microtarea), así que las lecturas no se intercalan con escrituras y la
// maquetación se calcula una vez por cuadro, no una por precio
let queue = null
const batch = (job) => {
  if (queue) return queue.push(job)
  queue = [job]
  nextFrame(() => {
    const jobs = queue
    queue = null
    jobs.forEach((j) => j())
  })
}
const span = (cls, kids) => h('span', { class: `g-price__${cls}` }, kids)
const opt = (cls, text) => (text ? span(cls, text) : null)

// Importe: signo, símbolo, cifra (o la capa que rueda) y código; los espacios entre partes los pone el CSS (#770)
const parts = (p, roll) => [opt('minus', p.minus), opt('symbol', p.symbolBefore), span('number', roll || p.number), opt('symbol', p.symbolAfter), opt('code', p.code)]
const amount = (p, mod) => p && h('span', { class: ['g-price__amount', mod && `g-price__amount--${mod}`], dir: 'ltr' }, parts(p))

export default defineComponent({
  name: 'GPrice',
  props: {
    value: { type: [Object, Array], default: null },
    max: { type: [Object, Array], default: null },
    compareAt: { type: [Object, Array], default: null },
    compareLabel: { type: String, default: undefined },
    compareStyle: { type: String, default: 'trace', validator: oneOf(['trace', 'strike']) },
    lead: { type: String, default: undefined },
    unit: { type: String, default: undefined },
    unitLabel: { type: String, default: undefined },
    total: { type: Object, default: null },
    size: { type: String, default: 'md', validator: oneOf(['xs', 'sm', 'md', 'lg', 'xl']) },
    display: { type: String, default: 'auto', validator: oneOf(['auto', 'symbol', 'code', 'none']) },
    cents: { type: String, default: 'auto', validator: oneOf(['auto', 'always', 'never']) },
    locale: { type: String, default: undefined },
    labels: { type: Object, default: () => ({}) }
  },
  setup(props) {
    // Avisos: una vez por instancia y motivo (también los de formatPrice, que recibe este ayudante)
    const warnOnce = onceWarner('GPrice')
    const scope = inject(priceScopeKey, null)
    const rootEl = ref(null)
    // Idioma: la prop › el de su GPriceScope › el lang del ancestro (al montar) › navigator.language (#775)
    const { locale, mounted } = useLocale(() => [props.locale, unref(scope?.locale)], rootEl)
    watch(() => props.locale, (l) => {
      if (l && !okLocale(l)) {
        try { if (process.env.NODE_ENV !== 'production') warnOnce('locale', `locale «${l}» que Intl rechaza: se ignora.`) } catch {}
      }
    }, { immediate: true })

    const labels = computed(() => ({ ...unref(scope?.labels), ...props.labels }))
    const fmt = computed(() => {
      let cents = props.cents
      if (cents === 'never' && props.size !== 'xs') {
        try { if (process.env.NODE_ENV !== 'production') warnOnce('cents', 'cents="never" solo con size="xs": se usa "auto".') } catch {}
        cents = 'auto'
      }
      const view = unref(scope?.view)
      // La región omite el código solo si dice su moneda (leyenda con texto, o legend: false); display ≠ auto la ignora
      return formatPrice(props.value, {
        ...props,
        locale: locale.value || undefined,
        cents,
        labels: labels.value,
        view,
        scopeCurrency: props.display === 'auto' && unref(scope?.declared) ? view : undefined
      }, { warn: warnOnce, canonical: locale.value === null })
    })

    // ---------- A · cifras que ruedan (la P2 de GNumberField; price.md «A · La cuenta») ----------
    const roll = ref(null) // { dir, chars: [{ ch, old }] }
    const totalEl = ref(null)
    let token = 0
    let pending = 0
    const clear = () => {
      token++
      pending = 0
      roll.value = null
    }
    // Firma del total: lo que debe ser igual para rodar (idioma, moneda, signo, símbolos, código), la cifra y el importe
    const sig = computed(() => {
      const t = fmt.value.parts.total?.amount
      if (!t) return null
      const v = props.total.value
      const m = (Array.isArray(v) ? v : [v]).find((x) => String(x?.currency).toUpperCase() === t.currency)
      return { key: [locale.value, t.currency, t.minus, t.symbolBefore, t.symbolAfter, t.code].join('|'), number: t.number, amount: m.amount }
    })
    watch(sig, (n, o) => {
      // Un repintado del padre con el mismo total (objetos nuevos, mismos datos) no toca la capa en curso
      if (n && o && n.key === o.key && n.number === o.number && n.amount === o.amount) return
      const had = roll.value
      clear()
      if (!mounted.value || !n || !o || had || n.key !== o.key || n.number === o.number) return
      // Comparación alineada a la derecha del texto viejo y el nuevo (incluidos separadores). Los caracteres cambiados
      // contiguos comparten ranura (P-A4): todas ruedan igual, así que se ve lo mismo con un tercio de los nodos y de las
      // capas animadas; los que no tenían viejo (el total creció) van en su propia ranura, sin __roll-old
      const a = [...o.number]
      const b = [...n.number]
      const chars = []
      b.forEach((ch, i) => {
        const old = a[a.length - b.length + i] ?? ''
        const last = chars.at(-1)
        if (last && ch !== old && last.ch !== last.old && !last.old === !old) {
          last.ch += ch
          last.old += old
        } else chars.push({ ch, old })
      })
      roll.value = { dir: n.amount >= o.amount ? 'up' : 'down', chars }
      const t = token
      // En el cuadro siguiente, en el lote común de todos los GPrice (una lectura de maquetación por cuadro, sin escribir
      // entre lecturas): si el total desborda su caja o ningún slot tiene animación calculada (reducido, sin CSS, jsdom),
      // la capa se retira en el acto
      batch(() => {
        const el = totalEl.value
        if (t !== token || !el) return
        if (el.clientWidth && el.scrollWidth > el.clientWidth + 1) return clear()
        pending = 0
        // Una consulta por clase de capa (la nueva y la vieja llevan la misma regla en todos los slots)
        for (const cls of ['new', 'old']) {
          const list = el.querySelectorAll(`.g-price__roll-${cls}`)
          if (list.length && animated(list[0])) pending += list.length
        }
        if (!pending) clear()
      })
    })
    const onRollEnd = (e) => {
      if (roll.value && String(e.animationName).startsWith(ROLL) && --pending <= 0) clear()
    }
    onBeforeUnmount(clear)

    return () => {
      const f = fmt.value
      const P = f.parts
      const c = P.compare
      const root = (kids, data) => h('span', {
        ref: rootEl,
        'data-currency': data && f.currency,
        class: ['g-price', `g-price--size-${props.size}`, {
          'g-price--free': f.state === 'free' && !c,
          'g-price--on-request': f.state === 'onRequest',
          'g-price--has-compare': c,
          [`g-price--compare-${c?.style}`]: c,
          'g-price--has-total': P.total,
          'g-price--range': P.range,
          'g-price--approx': P.approx,
          'g-price--negative': P.amount?.minus
        }]
      }, kids)
      // Estados de texto llano («Gratis», «Precio a consultar»): se leen tal cual, sin duplicar; inválido: vacío
      if (f.state === 'onRequest' || (f.state === 'free' && !c)) return root(f.text)
      if (f.state === 'invalid') return root()
      const r = P.range
      const T = P.total
      const rolling = roll.value
      return root([
        h('span', { class: 'g-price__visual', 'aria-hidden': 'true' }, [
          T && span('total', [
            opt('total-label', T.label),
            h('span', {
              ref: totalEl,
              class: ['g-price__total-amount', { 'is-rolling': rolling }],
              dir: 'ltr',
              'data-direction': rolling?.dir,
              onAnimationend: onRollEnd,
              onAnimationcancel: onRollEnd
            }, parts(T.amount, rolling?.chars.map((x) => (x.ch === x.old ? x.ch
              : span('roll-slot', [span('roll-new', x.ch), opt('roll-old', x.old)]))))),
            opt('total-unit', T.unit)
          ]),
          c?.style === 'trace' && span('compare', [
            span('compare-label', c.label),
            amount(c.amount, 'compare'),
            h(GIcon, { name: 'arrow-right', class: 'g-price__arrow g-icon--flip-rtl' }),
            opt('saving', P.saving?.text)
          ]),
          span('now', [
            opt('lead', P.lead),
            opt('approx', P.approx),
            opt('sep', r?.before),
            f.state === 'free' ? h('span', { class: 'g-price__amount g-price__amount--word' }, labels.value.free) : amount(P.amount),
            opt('sep', r?.between),
            r && amount(r.max),
            opt('sep', r?.after),
            opt('unit', P.unit)
          ]),
          c?.style === 'strike' && h('s', { class: 'g-price__compare' }, [amount(c.amount, 'compare')])
        ]),
        span('spoken', f.spoken)
      ], true)
    }
  }
})
</script>
