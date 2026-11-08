// Ficha interactiva de GToast: es un servicio (createToaster / useToast / GToaster), no una etiqueta.
// El anfitrión crea un gestor real y monta su región GToaster; el botón lanza el aviso con las props de la ficha.
// Las props de la ficha (type, title, description, actionLabel, promise) son las opciones del aviso, no props del
// componente: el meta.json solo declara `toaster`. El código copiado (codeFor) es el uso real del servicio.
import { defineComponent, h, onBeforeUnmount } from 'vue'
import { GBtn, GToaster, createToaster } from '@grana/vue'

const en = () => typeof document !== 'undefined' && document.documentElement.lang.startsWith('en')

const LABELS = {
  es: {
    region: 'Notificaciones ({hotkey})', close: 'Cerrar notificación',
    types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error', loading: 'En curso' },
    repeated: '{count} veces', queued: '{count} más en espera', actionHint: 'Pulsa {hotkey} para {action}.'
  },
  en: {
    region: 'Notifications ({hotkey})', close: 'Close notification',
    types: { info: 'Information', success: 'Success', warning: 'Warning', error: 'Error', loading: 'In progress' },
    repeated: '{count} times', queued: '{count} more waiting', actionHint: 'Press {hotkey} to {action}.'
  }
}

// Un solo gestor y una sola región por página (Grana avisa si compiten varias): la ficha y sus casos lo comparten;
// la región la pinta el primer anfitrión montado.
let shared = null
let owner = null
let users = 0

const Host = defineComponent({
  name: 'GranaLiveToast',
  inheritAttrs: false,
  setup(_, { attrs }) {
    if (!shared) shared = createToaster({ labels: en() ? LABELS.en : LABELS.es })
    const toaster = shared
    const me = {}
    if (!owner) owner = me
    users++
    const timers = new Set()
    let runs = 0
    // Una de cada dos subidas falla: el aviso de «Subiendo…» pasa en su sitio al desenlace.
    const wait = () => new Promise((ok, fail) => {
      const failing = ++runs % 2 === 0
      const t = setTimeout(() => { timers.delete(t); failing ? fail(new Error(en() ? 'The file exceeds 10 MB.' : 'El archivo supera los 10 MB.')) : ok({ name: 'informe-octubre.pdf' }) }, 1500)
      timers.add(t)
    })
    onBeforeUnmount(() => {
      timers.forEach(clearTimeout)
      if (owner === me) owner = null
      if (--users === 0) { toaster.clear(); shared = null }
    })

    function launch() {
      const action = attrs.actionLabel
        ? { label: attrs.actionLabel, onClick: () => toaster.info(en() ? 'Restored' : 'Restaurado') }
        : undefined
      if (attrs.promise) {
        toaster.promise(wait(), {
          loading: attrs.title,
          success: (r) => ({ title: en() ? 'Report uploaded' : 'Informe subido', description: r.name }),
          error: (e) => ({ title: en() ? 'Could not upload the report' : 'No se pudo subir el informe', description: e.message })
        }).catch(() => {})
        return
      }
      toaster.show({ type: attrs.type || 'neutral', title: attrs.title, description: attrs.description, action })
    }
    return () => [
      h(GBtn, { variant: 'outline', onClick: launch }, () => (en() ? 'Show toast' : 'Mostrar aviso')),
      owner === me ? h(GToaster, { toaster }) : null
    ]
  }
})

// Código del uso real del servicio, según lo que lleve la ficha.
function codeFor(state) {
  const q = (s) => `'${String(s).replace(/'/g, "\\'")}'`
  const lines = ["import { createToaster } from '@grana/vue'", '']
  lines.push('// labels: sin valores por defecto (ver el README); aquí, abreviado', 'const toaster = createToaster({ labels })', '')
  let call
  if (state.promise) {
    call = `toaster.promise(subir(), {\n    loading: ${q(state.title)},\n    success: (r) => ({ title: ${q(en() ? 'Report uploaded' : 'Informe subido')}, description: r.nombre }),\n    error: (e) => ({ title: ${q(en() ? 'Could not upload the report' : 'No se pudo subir el informe')}, description: e.message })\n  })`
  } else {
    const opts = [`type: ${q(state.type || 'neutral')}`, `title: ${q(state.title)}`]
    if (state.description) opts.push(`description: ${q(state.description)}`)
    if (state.actionLabel) opts.push(`action: { label: ${q(state.actionLabel)}, onClick: restaurar }`)
    call = `toaster.show({\n    ${opts.join(',\n    ')}\n  })`
  }
  lines.push(`function avisar() {\n  ${call}\n}`)
  return `<script setup>\n${lines.join('\n')}\n</` + 'script>\n\n<template>\n  <g-btn @click="avisar">' + (en() ? 'Show toast' : 'Mostrar aviso') + '</g-btn>\n  <g-toaster :toaster="toaster" />\n</template>'
}

export default {
  host: Host,
  tag: 'g-toaster',
  listen: false,
  exclude: ['toaster'],
  base: {
    type: 'success',
    title: { es: 'Cambios guardados', en: 'Changes saved' }
  },
  codeFor,
  cases: [
    {
      title: { es: 'Confirmar un guardado', en: 'Confirm a save' },
      why: {
        es: 'success con solo título: confirma algo que el usuario acaba de hacer y se cierra solo. Si el resultado debe quedarse (un estado que dura), va en la página, no en un aviso.',
        en: 'success with just a title: confirms something the user just did and closes itself. If the result must stay (a lasting state), put it on the page, not in a toast.'
      },
      props: { type: 'success', title: { es: 'Cambios guardados', en: 'Changes saved' } }
    },
    {
      title: { es: 'Acción reversible con «Deshacer»', en: 'Reversible action with “Undo”' },
      why: {
        es: 'Un aviso con action no se cierra solo: así hay tiempo de deshacer. Una acción como máximo y solo texto; si borrar es irreversible, confirma antes en un diálogo.',
        en: 'A toast with action does not close itself: that leaves time to undo. One action at most, text only; if deleting is irreversible, confirm first in a dialog.'
      },
      props: {
        type: 'neutral', title: { es: 'Expediente archivado', en: 'Record archived' },
        description: { es: 'Lucía Fernández · 2026-0412', en: 'Lucía Fernández · 2026-0412' },
        actionLabel: { es: 'Deshacer', en: 'Undo' }
      }
    },
    {
      title: { es: 'Subida con desenlace en el mismo aviso', en: 'Upload with the outcome in the same toast' },
      why: {
        es: 'promise crea un aviso «cargando» que pasa en su sitio a éxito o error (una de cada dos subidas falla aquí). Para una espera larga y persistente, la isla de estado.',
        en: 'promise creates a “loading” toast that turns in place into success or error (every other upload fails here). For a long, persistent wait, use the status island.'
      },
      props: { promise: true, type: 'neutral', title: { es: 'Subiendo informe…', en: 'Uploading report…' } }
    },
    {
      title: { es: 'Fallo que no desaparece solo', en: 'Failure that does not vanish' },
      why: {
        es: 'error se anuncia con prioridad y no se cierra solo. Dile qué pasó y qué hacer; si el usuario no puede continuar sin leerlo, va junto al campo, no en un aviso.',
        en: 'error is announced with priority and does not close itself. Say what happened and what to do; if the user cannot continue without reading it, put it next to the field, not in a toast.'
      },
      props: {
        type: 'error', title: { es: 'No se pudo sincronizar', en: 'Could not sync' },
        description: { es: 'Revisa la conexión e inténtalo de nuevo.', en: 'Check your connection and try again.' }
      }
    }
  ]
}
