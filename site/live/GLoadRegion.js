// Ficha interactiva de GLoadRegion. Controles desde GLoadRegion.meta.json.
import { h } from 'vue'
import { GBadge, GEmpty } from '@grana/vue'

const muestras = [
  { id: 'M-0412', nombre: 'Sangre · Lucía Herrera', meta: 'Recibida el 12 oct · Lote 2210-0412' },
  { id: 'M-0411', nombre: 'Orina · Tomás Rivera', meta: 'Recibida el 12 oct · Lote 2210-0411' },
  { id: 'M-0410', nombre: 'Exudado · Marta Gil', meta: 'Recibida el 11 oct · Lote 2210-0410' }
]
// La muestra del molde: los mismos campos, texto de largo típico y sin datos de personas
const molde = Array.from({ length: 3 }, (_, i) => ({ id: 's' + i, nombre: 'Tipo · Nombre Apellido', meta: 'Recibida el 0 oct · Lote 0000-0000' }))
const listaCss = 'list-style:none;margin:0;padding:0;display:grid;gap:var(--g-space-3)'

export default {
  exclude: ['keyBy', 'labelledby', 'announceError'],
  controls: ['loading', 'refresh', 'error'],
  text: ['label'],
  base: {
    label: { es: 'Muestras', en: 'Samples' },
    items: muestras,
    sample: molde,
    labels: {
      loading: 'Cargando muestras.',
      slow: 'Sigue cargando muestras…',
      loaded: ({ count, fresh }) => `${count} muestras${fresh ? `, ${fresh} nuevas` : ''}.`,
      refreshing: 'Actualizando',
      failed: 'No se pudo actualizar. Lo que ves es lo último que llegó.',
      retry: 'Reintentar'
    }
  },
  slots: [
    {
      name: 'default',
      scope: '{ items, mold, fresh, itemAttrs }',
      code: `<ul v-if="items && items.length">
  <li v-for="m in items" :key="m.id" v-bind="itemAttrs(m)">
    <strong>{{ m.nombre }}</strong>
    <g-badge v-if="fresh(m)" size="sm" variant="soft" color="accent">Nueva</g-badge>
    <span>{{ m.meta }}</span>
  </li>
</ul>
<g-empty v-else-if="items && !mold" cause="none" title="Aún no hay muestras" />`,
      render: ({ items, mold, fresh, itemAttrs }) => {
        if (items && items.length) {
          return h('ul', { style: listaCss }, items.map((m) => h('li', { key: m.id, ...itemAttrs(m), style: 'display:flex;flex-wrap:wrap;align-items:center;gap:var(--g-space-1) var(--g-space-2)' }, [
            h('strong', m.nombre),
            fresh(m) ? h(GBadge, { size: 'sm', variant: 'soft', color: 'accent' }, () => 'Nueva') : null,
            h('span', { style: 'flex-basis:100%' }, m.meta)
          ])))
        }
        if (items && !mold) return h(GEmpty, { cause: 'none', title: 'Aún no hay muestras' })
        return null
      }
    }
  ],
  cases: [
    {
      title: { es: 'Primera carga: el molde', en: 'First load: the mold' },
      why: { es: 'Sin items la región pinta la plantilla real sin tinta (sample), así la lista no salta al llegar los datos; úsalo solo si conoces la forma de la respuesta.', en: 'With no items the region paints the real template without ink (sample), so the list does not jump when data arrives; use it only if you know the response shape.' },
      props: { loading: true, items: null }
    },
    {
      title: { es: 'Refrescar sin perder lo que ves', en: 'Refresh without losing what you see' },
      why: { es: 'refresh «keep» deja lo de antes a la vista, inerte y con una píldora; si el contenido ya no sirve (otro filtro), usa «replace».', en: 'refresh “keep” leaves the old content in view, inert, with a pill; if it no longer applies (another filter), use “replace”.' },
      props: { loading: true, refresh: 'keep' }
    },
    {
      title: { es: 'Refrescar cuando lo anterior ya no sirve', en: 'Refresh when the old content no longer applies' },
      why: { es: 'replace muestra el molde de lo último conocido: evita enseñar datos de otra consulta mientras llegan los nuevos.', en: 'replace shows the mold of the last known content: it avoids showing another query’s data while the new ones arrive.' },
      props: { loading: true, refresh: 'replace' }
    },
    {
      title: { es: 'Fallo con datos conocidos', en: 'Failure with known data' },
      why: { es: 'Con contenido previo, error pone una barra de fallo con «Reintentar» y deja la lista; sin contenido, pinta tu GEmpty en el slot failed.', en: 'With prior content, error shows a failure bar with “Retry” and keeps the list; with none, paint your GEmpty in the failed slot.' },
      props: { error: true }
    },
    {
      title: { es: 'Respondió vacío', en: 'Responded empty' },
      why: { es: 'items [] es «ya sé que no hay nada» (distinto de null, que es «aún no sé»): la aplicación pinta su estado vacío.', en: 'items [] means “I know there is nothing” (unlike null, “I do not know yet”): the app paints its empty state.' },
      props: { items: [] }
    }
  ]
}
