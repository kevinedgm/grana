// GbReviews · lo que comparten las tres variantes (dueño: bruno; reviews.md «Anatomía de una opinión»). Avisos C1 (sin aviso
// si hay `summary` con `count: 0`: es el vacío), C2 (opinión sin quote, author.name, date o rating), C3, C5, C7, EC2, RV1
// (`rating` de una opinión fuera de 1..max: sin puntuación), RV2 (la suma de `distribution` no es `summary.count`: se pinta
// lo dado) y RV3 (una cita de más de 1 200 caracteres: entera). Lo único que se calcula es de vista (§27 regla 4): el
// porcentaje de cada fila de la distribución, redondeado al entero con Intl.
import { computed, ref, watch } from 'vue'
import { entries } from '../common/list.js'
import { fill, useLocale } from '../common/locale.js'
import { safeHref } from '../common/navigate.js'
import { countText } from '../common/ecommerce.js'
import { has, paragraphs } from '../common/text.js'
import { LONG_QUOTE, MAX_REVIEWS } from './props.js'

const nfCache = new Map()
const nf = (locale, o) => {
  const k = `${locale}|${JSON.stringify(o)}`
  if (!nfCache.has(k)) { let f = null; try { f = new Intl.NumberFormat(locale, o) } catch {} nfCache.set(k, f) }
  return nfCache.get(k)
}
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/
/** Una fecha ISO para `<time datetime>` en palabras con su año («12 de octubre de 2026»), sin relativas; SSR: el ISO. */
export function dateText(iso, locale) {
  if (!has(iso)) return null
  const s = iso.trim()
  const m = DATE_ONLY.exec(s)
  const d = m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : new Date(Date.parse(s))
  if (Number.isNaN(d.getTime())) return { datetime: undefined, text: s }
  if (!has(locale)) return { datetime: s, text: s }
  try { return { datetime: s, text: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', ...(m ? { timeZone: 'UTC' } : {}) }).format(d) } } catch { return { datetime: s, text: s } }
}

export function useReviews(props, emit, warn) {
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})
  const need = (key, what) => {
    if (has(L.value[key]) || typeof L.value[key] === 'function') return L.value[key]
    try { if (process.env.NODE_ENV !== 'production') warn(`C5:${key}`, `falta labels.${key} (${what}): se pinta sin ese texto (C5).`) } catch {}
    return ''
  }
  const say = (t, vars, fnArg) => (typeof t === 'function' ? String(t(fnArg === undefined ? vars : fnArg)) : has(t) ? fill(t, vars) : '')
  /** Un número en palabras: sin decimales si es entero, uno si no (Intl); SSR: tal cual. */
  const num = (n, digits) => {
    const f = has(locale.value) && nf(locale.value, digits === 1 ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : { maximumFractionDigits: 1 })
    return f ? f.format(n) : digits === 1 ? n.toFixed(1) : String(n)
  }

  // El resumen (EC2: average fuera de 0..max o sin count, sin resumen)
  const max = computed(() => (props.summary && Number.isFinite(props.summary.max) && props.summary.max > 0 ? props.summary.max : 5))
  const summary = computed(() => {
    const s = props.summary
    if (!s) return null
    const ok = typeof s === 'object' && Number.isFinite(s.average) && s.average >= 0 && s.average <= max.value && Number.isInteger(s.count) && s.count >= 0
    if (!ok) {
      try { if (process.env.NODE_ENV !== 'production') warn('EC2', 'summary con average fuera de 0..max o sin count: no se pinta la calificación (EC2).') } catch {}
      return null
    }
    return s
  })
  const metric = computed(() => {
    const s = summary.value
    if (!s) return null
    if (s.count === 0) return { empty: need('noReviews', '«Todavía sin opiniones»') }
    const maxText = num(max.value)
    return {
      label: need('average', '«Calificación media»'),
      value: num(s.average, 1),
      unit: say(need('outOf', '«de {max}»'), { max: maxText }, maxText),
      context: say(need('count', '«{count} opiniones»'), { count: countText(s.count, locale.value) }, s.count)
    }
  })

  // La distribución: todas las filas de max a 1, también las de 0 (lo malo no se esconde)
  const distribution = computed(() => {
    const s = summary.value
    if (!s || !Array.isArray(s.distribution) || !s.count) return null
    const sum = s.distribution.reduce((a, x) => a + (x && Number.isFinite(x.count) ? x.count : 0), 0)
    try { if (process.env.NODE_ENV !== 'production' && sum !== s.count) warn('RV2', `la suma de distribution (${sum}) no es summary.count (${s.count}): se pinta lo dado (RV2).`) } catch {}
    const t = need('row', '«{value} de {max}: {count} ({percent})»')
    const name = need('distribution', '«Cómo se reparten»')
    const pct = has(locale.value) && nf(locale.value, { style: 'percent', maximumFractionDigits: 0 })
    const rows = []
    for (let v = Math.round(max.value); v >= 1; v--) {
      const d = s.distribution.find((x) => x && x.value === v)
      const count = d && Number.isFinite(d.count) ? d.count : 0
      const share = s.count ? Math.round((count / s.count) * 100) / 100 : 0
      const vars = { value: num(v), max: num(max.value), count, countText: countText(count, locale.value), percent: pct ? pct.format(share) : `${Math.round(share * 100)}%` }
      rows.push({ value: v, count, text: say(t, { ...vars, count: vars.countText }, vars) })
    }
    return { name, rows, total: s.count }
  })

  // Las opiniones (C2, C3; C7 por encima de 20)
  const list = computed(() => {
    const raw = Array.isArray(props.reviews) ? props.reviews : []
    try { if (process.env.NODE_ENV !== 'production' && raw.length > MAX_REVIEWS) warn('C7', `reviews con ${raw.length} opiniones; se recomiendan hasta ${MAX_REVIEWS} por página: se pintan todas (C7).`) } catch {}
    return entries(raw, ['quote', 'date'], 'reviews', warn).flatMap((e) => {
      const { item, index } = e
      if (!item.author || !has(item.author.name) || !Number.isFinite(item.rating)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`C2:reviews:${index}`, `reviews[${index}] sin ${!Number.isFinite(item.rating) ? 'rating' : 'author.name'}: se omite (C2).`) } catch {}
        return []
      }
      try { if (process.env.NODE_ENV !== 'production' && item.quote.length > LONG_QUOTE) warn(`RV3:${index}`, `la opinión de «${item.author.name}» pasa de ${LONG_QUOTE} caracteres: se pinta entera (RV3).`) } catch {}
      let score = ''
      if (item.rating >= 1 && item.rating <= max.value) score = say(need('score', '«{value} de {max}»'), { value: num(item.rating), max: num(max.value) }, { value: num(item.rating), max: num(max.value) })
      else {
        try { if (process.env.NODE_ENV !== 'production') warn(`RV1:${index}`, `reviews[${index}].rating = ${item.rating} fuera de 1..${max.value}: no se pinta la puntuación (RV1).`) } catch {}
      }
      const verified = item.verified === true ? need('verified', '«Compra verificada»') : has(item.verified) ? item.verified : ''
      const opts = (Array.isArray(item.options) ? item.options : []).filter((o) => o && has(o.label) && has(o.value))
      const bought = opts.length ? { label: need('bought', '«Compró»'), value: opts.map((o) => `${o.label} ${o.value}`).join(' · ') } : null
      const source = item.source && typeof item.source === 'object' && has(item.source.label) ? item.source : null
      const reply = item.reply && typeof item.reply === 'object' && has(item.reply.author) && has(item.reply.quote)
        ? { label: say(need('reply', '«Respuesta de {author}»'), { author: item.reply.author }, item.reply.author), paras: paragraphs(item.reply.quote), date: dateText(item.reply.date, locale.value) }
        : null
      return [{
        ...e,
        score,
        paras: paragraphs(item.quote),
        lang: has(item.lang) ? item.lang : undefined,
        cite: (source && safeHref(source.href)) || undefined,
        date: dateText(item.date, locale.value),
        verified,
        bought,
        source,
        reply
      }]
    })
  })
  const isEmpty = computed(() => !list.value.length)
  const showEmpty = computed(() => isEmpty.value && (!summary.value || summary.value.count === 0))
  try {
    if (process.env.NODE_ENV !== 'production') {
      watch(isEmpty, (v) => { if (v && !(summary.value && summary.value.count === 0)) warn('C1', 'reviews está vacía (y no hay summary con count 0): se pinta el vacío (C1).') }, { immediate: true })
    }
  } catch {}
  const emptyTitle = computed(() => (showEmpty.value ? need('noReviews', '«Todavía sin opiniones»') : ''))

  // Página
  const localPage = ref(Number.isInteger(props.page) && props.page > 0 ? props.page : 1)
  watch(() => props.page, (v) => { if (Number.isInteger(v) && v > 0) localPage.value = v })
  const paged = computed(() => Number.isFinite(props.total) && Number.isFinite(props.pageSize) && props.pageSize > 0)
  const setPage = (v) => { localPage.value = v; emit('update:page', v) }

  const actions = computed(() => (props.action && typeof props.action === 'object' ? [props.action] : []))

  return { locale, L, metric, distribution, list, showEmpty, emptyTitle, page: localPage, paged, setPage, actions }
}
