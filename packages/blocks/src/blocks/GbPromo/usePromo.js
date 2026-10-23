// GbPromo · lo que comparten las tres variantes (dueño: bruno; promo.md «Piezas», avisos C2, C5, C8, EC7 y PM1).
//   - La fecha (#925): `until` en `<time datetime>` con Intl (día de la semana, día y mes) dentro de `labels.until`. Una
//     fecha y hora SIN zona es la hora de la tienda: se dice su día tal cual, sin pasar por la zona del teléfono; con zona
//     (Z, ±hh:mm), en `timeZone`. Nunca una cuenta atrás ni un temporizador (2.2.2): nada de setInterval/setTimeout.
//   - El código: su valor con translate="no" y «Copiar código» (`activate { event, item: code }`, síncrono en el gesto).
//   - Las condiciones a la vista, con `id` ligado a la acción principal (aria-describedby, patrón de `assurance`, #838).
// EC7 (`until` ya pasado) se comprueba al montar, con la hora de la tienda.
import { computed, onMounted, useId } from 'vue'
import { useLocale } from '../common/locale.js'
import { has } from '../common/text.js'

const ISO = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/i

/** Ahora en la hora de `timeZone` como «AAAA-MM-DDTHH:mm» (para comparar con una fecha sin zona). */
function wallNow(timeZone) {
  const o = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }
  let parts
  try { parts = new Intl.DateTimeFormat('en-US', has(timeZone) ? { ...o, timeZone } : o).formatToParts(new Date()) } catch { parts = new Intl.DateTimeFormat('en-US', o).formatToParts(new Date()) }
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

export function usePromo(props, warn) {
  const uid = useId()
  const locale = useLocale(props)
  const L = computed(() => props.labels || {})

  const date = computed(() => {
    if (!has(props.until)) return null
    const s = props.until.trim()
    const m = ISO.exec(s)
    if (!m) {
      try { if (process.env.NODE_ENV !== 'production') warn('PM1', `until «${s}» no es ISO: no se pinta la fecha (PM1).`) } catch {}
      return null
    }
    let text = m[1]
    if (locale.value) {
      const o = { weekday: 'long', day: 'numeric', month: 'long' }
      // Sin zona: el día escrito por la tienda (en UTC, el mismo en cualquier zona). Con zona: en la de la tienda
      const d = m[3] ? new Date(Date.parse(s)) : new Date(`${m[1]}T00:00:00Z`)
      const tz = m[3] ? (has(props.timeZone) ? props.timeZone : undefined) : 'UTC'
      try { text = new Intl.DateTimeFormat(locale.value, tz ? { ...o, timeZone: tz } : o).format(d) } catch {
        try { text = new Intl.DateTimeFormat(locale.value, o).format(d) } catch {}
      }
    }
    const t = L.value.until
    let before = ''
    let after = ''
    if (typeof t === 'function') {
      const phrase = String(t(text))
      const i = phrase.indexOf(text)
      if (i >= 0) { before = phrase.slice(0, i); after = phrase.slice(i + text.length) } else text = phrase
    } else if (has(t)) {
      const i = t.indexOf('{date}')
      if (i >= 0) { before = t.slice(0, i); after = t.slice(i + 6) } else before = `${t} `
    } else {
      try { if (process.env.NODE_ENV !== 'production') warn('C5:until', 'hay until y falta labels.until («Hasta el {date}»): la fecha va sin frase (C5).') } catch {}
    }
    return { datetime: s, text, before, after }
  })

  const code = computed(() => {
    const c = props.code
    if (!c || typeof c !== 'object') return null
    if (!has(c.value) || !has(c.label)) {
      try { if (process.env.NODE_ENV !== 'production') warn('C2:code', `code sin ${has(c.value) ? 'label' : 'value'}: no se pinta (C2).`) } catch {}
      return null
    }
    const copy = has(L.value.copy) ? L.value.copy : ''
    try { if (process.env.NODE_ENV !== 'production' && !copy) warn('C5:copy', 'hay code y falta labels.copy («Copiar código»): el código va sin botón (C5).') } catch {}
    return { code: c, copy }
  })

  const termsId = computed(() => (has(props.terms) ? `${uid}-terms` : undefined))
  const actions = computed(() => {
    const list = Array.isArray(props.actions) ? props.actions : []
    try { if (process.env.NODE_ENV !== 'production' && !list.length) warn('C2:actions', 'actions está vacía: la oferta se pinta sin acción (C2).') } catch {}
    return list
  })

  // EC7: una oferta ya vencida se pinta igual (la aplicación decide quitarla); solo en el navegador, al montar
  onMounted(() => {
    try {
      if (process.env.NODE_ENV !== 'production' && date.value) {
        const m = ISO.exec(date.value.datetime)
        const past = m[3] ? Date.parse(date.value.datetime) < Date.now() : `${m[1]}T${m[2] || '23:59'}` < wallNow(props.timeZone)
        if (past) warn('EC7', `until «${date.value.datetime}» ya pasó: la oferta se pinta igual (EC7).`)
      }
    } catch {}
  })

  return { locale, date, code, termsId, actions }
}
