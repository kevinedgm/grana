// GbOfferDetail · lo que comparten las tres variantes (dueño: bruno; offer-detail.md «Piezas», avisos C4 a C7, K1 a K5 y
// D1 a D3). La ficha enseña lo que dice (#869): un dato con `group` (un espacio de `offer.groups` con `id`) lleva a las
// fotos de ese espacio (el ancla `#{id}` del recorrido de GGallery en 01 y 03; en la tira de 02, abre el visor en la
// primera foto del espacio). Con consulta, la línea «Para {query}» con describeQuery y el precio con la cuenta (#773);
// sin ella, la tarifa sola. Lo no disponible lo dice en palabras y no se puede reservar (§15 regla 7).
import { computed, ref } from 'vue'
import { availability, checkRegion, fill, priceSpec, useLocale, useQueryLine } from '../common/booking.js'
import { has, paragraphs } from '../common/text.js'
import { MAX_FACTS } from './props.js'

/** Un id que sirve de ancla o de id de pestaña: sin espacios ni `#`. */
const anchorOk = (id) => typeof id === 'string' && /^[^\s#]+$/.test(id)

export function useOfferDetail(props, emit, warn, { slots } = {}) {
  const locale = useLocale(props)
  const query = useQueryLine(props, warn, { locale })
  const L = computed(() => props.labels || {})
  const o = computed(() => (props.offer && typeof props.offer === 'object' ? props.offer : {}))
  const sep = computed(() => (L.value.query && typeof L.value.query.separator === 'string' ? L.value.query.separator : ' '))
  const line = computed(() => (query.value ? [query.value.line, query.value.checkout].filter(Boolean).join(sep.value) : ''))

  // C5 de los títulos obligatorios
  const need = (key, what) => {
    if (has(L.value[key])) return L.value[key]
    try { if (process.env.NODE_ENV !== 'production') warn(`C5:${key}`, `falta labels.${key} (${what}): se pinta sin ese texto (C5).`) } catch {}
    return ''
  }
  try {
    if (process.env.NODE_ENV !== 'production' && (o.value.id === undefined || o.value.id === null || o.value.id === '')) warn('K5', 'offer sin id (obligatorio para book): se emite tal cual (K5).')
  } catch {}

  const photos = computed(() => {
    const list = Array.isArray(o.value.photos) ? o.value.photos.filter((p) => p && has(p.src)) : []
    try { if (process.env.NODE_ENV !== 'production' && !list.length) warn('D2', 'offer.photos vacío: sin galería; la ficha sigue (D2).') } catch {}
    return list
  })
  const photosTitle = computed(() => (photos.value.length ? need('photos', 'título de la galería') : ''))
  const groups = computed(() => (Array.isArray(o.value.groups) ? o.value.groups.filter((g) => g && g.value !== undefined && g.value !== null) : []))

  /** «Ver {group}» de un espacio (String con {group} o función). */
  const showLabel = (label) => {
    const t = L.value.showPhotos
    return typeof t === 'function' ? String(t(label)) : has(t) ? fill(t, { group: label }) : ''
  }
  const facts = computed(() => {
    const list = (Array.isArray(o.value.facts) ? o.value.facts : []).filter((f) => f && has(f.label) && has(f.value))
    try { if (process.env.NODE_ENV !== 'production' && list.length > MAX_FACTS) warn('C7:facts', `offer.facts con ${list.length} datos; se recomiendan hasta ${MAX_FACTS} (C7).`) } catch {}
    return list.map((f, i) => {
      let show = null
      if (f.group !== undefined && f.group !== null && f.group !== '') {
        const g = groups.value.find((x) => x.value === f.group)
        const first = photos.value.findIndex((p) => p.group === f.group)
        if (!g || !anchorOk(g.id) || first < 0) {
          try { if (process.env.NODE_ENV !== 'production') warn(`D1:${i}`, `offer.facts[${i}].group «${String(f.group)}» no está en offer.groups con un id válido (o no tiene fotos): sin enlace (D1).`) } catch {}
        } else {
          const label = showLabel(g.label)
          if (!label) {
            try { if (process.env.NODE_ENV !== 'production') warn('C5:showPhotos', 'hay datos con group y falta labels.showPhotos («Ver {group}»): sin enlace (C5).') } catch {}
          } else show = { href: `#${g.id}`, label, index: first }
        }
      }
      return { key: i, label: f.label, value: f.value, show }
    })
  })
  const perks = computed(() => {
    const list = Array.isArray(o.value.perks) ? o.value.perks.filter(has) : []
    return { list, label: list.length ? need('perks', 'nombre de la lista de lo que incluye') : '' }
  })
  const available = computed(() => availability(o.value, L.value, 'offer', warn))
  const price = computed(() => {
    const p = priceSpec(o.value.price, 'offer.price', warn)
    if (p && !query.value) delete p.total // la cuenta solo responde a una consulta
    return p
  })
  const region = computed(() => checkRegion(props.prices, Boolean(price.value), warn))
  const bookLabel = computed(() => (slots && slots.consult) || !available.value.ok ? '' : need('book', '«Reservar esta suite»'))

  // Texto largo: descripción y apartados (D3: id repetido usa el índice)
  const description = computed(() => paragraphs(o.value.description))
  const sections = computed(() => {
    const seen = new Set()
    return (Array.isArray(o.value.sections) ? o.value.sections : []).filter((s) => s && has(s.title)).map((s, i) => {
      let id = anchorOk(s.id) ? s.id : undefined
      if (id && seen.has(id)) {
        try { if (process.env.NODE_ENV !== 'production') warn(`D3:${id}`, `offer.sections: id «${id}» repetido; se usa el índice (D3).`) } catch {}
        id = undefined
      }
      if (id) seen.add(id)
      const paras = paragraphs(s.body)
      return { key: id || `s${i}`, id, section: s, paras, items: Array.isArray(s.items) ? s.items.filter(has) : [] }
    })
  })

  const book = (event) => { if (available.value.ok) emit('book', { event, offer: o.value, query: query.value ? query.value.query : null }) }

  // 02: el visor de la tira, abierto desde un dato en la primera foto de su espacio
  const index = ref(0)
  const open = ref(false)
  const showGroup = (fact) => { index.value = fact.show.index; open.value = true }

  return { locale, L, o, line, need, photos, photosTitle, groups, facts, perks, available, price, region, bookLabel, description, sections, book, index, open, showGroup }
}
