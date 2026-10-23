// GbTrust · lo que comparten las tres variantes (dueño: bruno; trust.md «Anatomía de una promesa», avisos C1 a C3, C5 a C7 y
// PR1). Cada promesa con su prueba: su `action` o, con `policy` y sin `action`, el ancla `#{policy}` de GbPolicies con el
// texto `labels.policy` (#926: cada promesa lleva a su letra pequeña). Sin ninguna de las dos, sin enlace (PR1, una vez).
import { computed } from 'vue'
import { useItems } from '../common/list.js'
import { fill } from '../common/locale.js'
import { has } from '../common/text.js'
import { MAX_ITEMS } from './props.js'

export function useTrust(props, warn) {
  const L = computed(() => props.labels || {})
  const list = useItems(() => props.items, { required: ['title'], what: 'items', range: [1, MAX_ITEMS], warn })
  const rows = computed(() => list.value.map((e) => {
    const it = e.item
    let proof = null
    if (it.action && typeof it.action === 'object' && has(it.action.label)) proof = { action: it.action }
    else if (has(it.policy)) {
      const t = L.value.policy
      const label = typeof t === 'function' ? String(t(it.title)) : has(t) ? fill(t, { title: it.title }) : ''
      if (label) proof = { link: { label, href: `#${it.policy}` } }
      else {
        try { if (process.env.NODE_ENV !== 'production') warn('C5:policy', 'hay una promesa con policy y falta labels.policy («Ver la política»): se pinta sin enlace (C5).') } catch {}
      }
    } else {
      try { if (process.env.NODE_ENV !== 'production') warn('PR1', 'una promesa sin action ni policy se pinta sin su prueba; conviene enlazar la política que la sostiene (PR1).') } catch {}
    }
    return { key: e.key, item: it, icon: has(it.icon) ? it.icon : '', proof }
  }))
  return { rows }
}
