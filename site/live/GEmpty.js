// Ficha interactiva de GEmpty. filters y total solo valen con cause="filtered": el anfitrión no los pasa en las demás causas.
import { h } from 'vue'
import { GEmpty } from '@grana/vue'

function Host(props) {
  if (props.cause === 'filtered') return h(GEmpty, props)
  const { filters: _f, total: _t, ...rest } = props
  return h(GEmpty, rest)
}

// Código completo de cada causa: filters, total y labels solo cuando la causa es filtered.
function codeFor(state) {
  const q = (s) => String(s).replace(/"/g, '&quot;')
  const attrs = [`cause="${state.cause}"`, `title="${q(state.title)}"`]
  if (state.description) attrs.push(`description="${q(state.description)}"`)
  attrs.push(`locale="${state.locale}"`)
  if (state.cause !== 'filtered') return `<g-empty\n  ${attrs.join('\n  ')}\n/>`
  const lit = (v) => JSON.stringify(v, null, 2).replace(/"([A-Za-z_]+)":/g, '$1:').replace(/"/g, "'")
  return `<script setup>\nconst filters = ${lit(state.filters)}\nconst labels = ${lit(state.labels)}\n</` + `script>\n\n<template>\n  <g-empty\n    ${attrs.join('\n    ')}\n    :filters="filters"\n    :total="${state.total}"\n    :labels="labels"\n  />\n</template>`
}

export default {
  exclude: ['filters', 'total', 'labels', 'headingLevel', 'locale'],
  text: ['title', 'description'],
  base: {
    cause: 'none',
    title: { es: 'Sin muestras todavía', en: 'No samples yet' },
    description: { es: 'Las muestras que registres aparecerán aquí.', en: 'Samples you register will appear here.' },
    filters: [
      { key: 'urgentes', label: { es: 'Urgentes', en: 'Urgent' }, count: 2 },
      { key: 'cerradas', label: { es: 'Cerradas', en: 'Closed' }, count: 1 }
    ],
    total: 6,
    locale: 'es-MX',
    labels: {
      relax: { es: 'Quitar «{label}»', en: 'Remove “{label}”' },
      returns: { es: '{count} vuelven', en: '{count} return' },
      clear: { es: 'Quitar todos', en: 'Clear all' },
      before: { es: 'Antes había {total}; con {filters}, ninguna.', en: 'There were {total}; with {filters}, none.' }
    }
  },
  codeFor,
  host: Host,
  ignore: ['relax', 'clear'],
  cases: [
    {
      title: { es: 'Primer uso', en: 'First use' },
      why: { es: 'cause none: aún no hay nada; di qué aparecerá y ofrece la acción que lo crea. No lo uses cuando hay filtros activos.', en: 'cause none: nothing yet; say what will appear and offer the action that creates it. Do not use it when filters are active.' },
      props: { cause: 'none' }
    },
    {
      title: { es: 'Filtros que lo vaciaron', en: 'Filters that emptied it' },
      why: { es: 'cause filtered dice cuántas había, qué filtro quitar y cuántas vuelven con cada uno; el foco lo devuelve tu aplicación al título.', en: 'cause filtered says how many there were, which filter to remove and how many return with each; your app returns focus to the heading.' },
      props: { cause: 'filtered', title: { es: 'Ninguna muestra con estos filtros', en: 'No sample with these filters' }, description: '' }
    },
    {
      title: { es: 'Falló la carga', en: 'Loading failed' },
      why: { es: 'cause error con un texto que dice qué falló; ofrece reintentar en el slot actions. No lo uses para «sin resultados».', en: 'cause error with text saying what failed; offer retry in the actions slot. Do not use it for “no results”.' },
      props: { cause: 'error', title: { es: 'No pudimos cargar las muestras', en: 'We could not load the samples' }, description: { es: 'Revisa tu conexión e inténtalo de nuevo.', en: 'Check your connection and try again.' } }
    },
    {
      title: { es: 'Sin permiso', en: 'No permission' },
      why: { es: 'cause forbidden: el contenido existe pero esta persona no puede verlo; di a quién pedir acceso.', en: 'cause forbidden: the content exists but this person cannot see it; say whom to ask for access.' },
      props: { cause: 'forbidden', title: { es: 'No tienes acceso a las muestras', en: 'You do not have access to the samples' }, description: { es: 'Pide acceso a la persona que administra el laboratorio.', en: 'Ask the person who manages the lab for access.' } }
    }
  ]
}
