// GbProductOverview · el texto largo de la ficha (dueño: bruno; product-overview.md «El texto largo»): la descripción en
// párrafos (o el slot `description`), la ficha técnica (`facts` en un `dl`, #863) y los apartados (`ProductSection`, con
// `section.id` como ancla e id de pestaña; repetido o con espacios, el índice). Lo comparten las tres variantes (01 y 02 en
// GAccordion, 03 en GTabs). Avisos C5 de `labels.details` y `labels.facts`; PO1 (sin fotos, sin galería).
import { computed } from 'vue'
import { has, paragraphs } from '../common/text.js'

const anchorOk = (id) => typeof id === 'string' && /^[^\s#]+$/.test(id)

export function useOverviewText(d, slots, warn) {
  const p = d.p
  const photos = computed(() => {
    const list = Array.isArray(p.value.photos) ? p.value.photos.filter((x) => x && has(x.src)) : []
    try { if (process.env.NODE_ENV !== 'production' && !list.length) warn('PO1', 'product.photos vacío: sin galería; el panel sigue (PO1).') } catch {}
    return list
  })
  const photosTitle = computed(() => (photos.value.length ? d.need('photos', 'título de la galería') : ''))
  const groups = computed(() => (Array.isArray(p.value.groups) ? p.value.groups.filter((g) => g && g.value !== undefined && g.value !== null) : []))
  const description = computed(() => paragraphs(p.value.description))
  const facts = computed(() => (Array.isArray(p.value.facts) ? p.value.facts : []).filter((f) => f && has(f.label) && has(f.value)))
  const sections = computed(() => {
    const seen = new Set()
    return (Array.isArray(p.value.sections) ? p.value.sections : []).filter((s) => s && has(s.title)).map((s, i) => {
      let id = anchorOk(s.id) && !seen.has(s.id) ? s.id : undefined
      if (id) seen.add(id)
      return { key: id || `s${i}`, id, section: s, paras: paragraphs(s.body), items: Array.isArray(s.items) ? s.items.filter(has) : [] }
    })
  })
  /** Los apartados del texto largo en orden: descripción, ficha y uno por `sections`. */
  const parts = computed(() => {
    const out = []
    if (description.value.length || (slots && slots.description)) out.push({ key: 'details', kind: 'details', title: d.need('details', 'nombre de la descripción') })
    if (facts.value.length) out.push({ key: 'facts', kind: 'facts', title: d.need('facts', 'nombre de la ficha técnica') })
    for (const s of sections.value) out.push({ key: s.key, kind: 'section', id: s.id, title: s.section.title, s })
    return out
  })
  return { photos, photosTitle, groups, description, facts, sections, parts }
}
