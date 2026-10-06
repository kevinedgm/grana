// Ayudantes de las pruebas de GFileField (dueño: bruno). No es una prueba ni viaja en el paquete.
import { vi } from 'vitest'

export const LABELS = {
  add: 'Adjuntar archivo',
  addMany: 'Adjuntar archivos',
  addMore: 'Añadir más',
  change: 'Cambiar archivo',
  full: '{count} de {max}',
  readonly: 'Solo lectura',
  none: 'Sin archivos',
  status: ({ count, max, active, failed }) => [max && max > 1 ? `${count} de ${max}` : `${count} archivos`, active ? `${active} subiendo` : '', failed ? `${failed} con error` : ''].filter(Boolean).join(' · '),
  list: 'Archivos de {label}',
  drop: 'Soltar aquí · {hint}',
  dropInto: 'Soltar en {label}',
  dropRejected: '{label} no admite esto',
  dropFull: '{label} está lleno',
  remove: 'Quitar {name}',
  cancel: 'Cancelar subida de {name}',
  retry: 'Reintentar {name}',
  queued: 'En cola',
  done: 'Subido',
  error: 'Error:',
  progress: 'Subida de {name}',
  progressText: '{percent} %, {loaded} de {total}',
  uploadFailed: 'No se pudo subir',
  notAdded: 'Archivos no añadidos',
  dismiss: 'Descartar',
  reasons: { type: 'no es un tipo admitido', empty: 'está vacío', duplicate: 'ya está en la lista', size: 'pesa {size}, el máximo es {limit}', count: 'el máximo es {limit}' },
  added: 'Añadido {name}.',
  addedMany: 'Añadidos {count} archivos.',
  replaced: '{old} reemplazado por {name}.',
  rejected: 'No se añadió {name}: {reason}.',
  rejectedMany: 'No se añadieron {count} archivos: {list}.',
  uploading: (n) => (n === 1 ? 'Subiendo.' : `Subiendo ${n}.`),
  uploaded: '{name} subido.',
  uploadedMany: '{count} archivos subidos.',
  uploadError: 'No se pudo subir {name}: {message}.',
  retrying: 'Reintentando {name}.',
  removed: 'Quitado {name}. Quedan {count}.',
  canceled: 'Subida de {name} cancelada. Quedan {count}.',
  pending: (n, name) => (n === 1 ? `Espera a que termine de subir ${name}.` : `Esperan ${n} archivos por subir.`),
  failed: (n, name) => (n === 1 ? `No se pudo subir ${name}: reinténtalo o quítalo.` : `${n} archivos no se subieron.`)
}

export const file = (name, size = 10, type = 'image/png', lastModified = 1) => new File([new Uint8Array(size)], name, { type, lastModified })

/** Adaptador controlado a mano: cada llamada queda en `calls` con resolve/reject/progress y su signal. */
export function manualUploader() {
  const calls = []
  const fn = vi.fn((f, ctx) => new Promise((resolve, reject) => {
    const call = { file: f, signal: ctx.signal, progress: ctx.progress, resolve, reject }
    calls.push(call)
  }))
  fn.calls = calls
  fn.byName = (name) => calls.filter((c) => c.file.name === name).at(-1)
  return fn
}

export const flush = () => new Promise((r) => setTimeout(r, 0))
export const frame = () => new Promise((r) => setTimeout(r, 40))
/** Espera a que la región viva escriba (retardo de 50 ms) y devuelve su texto */
export const liveText = async (w) => {
  await new Promise((r) => setTimeout(r, 70))
  return w.find('.g-file-field__live').text()
}

/** Evento de arrastre o pegado con un dataTransfer/clipboardData de archivos (jsdom no construye DataTransfer) */
export function filesEvent(type, files = [], { types, target } = {}) {
  const ev = new Event(type, { bubbles: true, cancelable: true })
  const data = {
    types: ['Files'],
    items: (types || files.map((f) => f.type)).map((t) => ({ kind: 'file', type: t })),
    files,
    dropEffect: 'none'
  }
  Object.defineProperty(ev, type === 'paste' ? 'clipboardData' : 'dataTransfer', { value: data })
  if (target) target.dispatchEvent(ev)
  return ev
}

/** jsdom no tiene cajas de layout: un campo «a la vista» necesita getClientRects con algo */
export function withLayout() {
  const spy = vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function () { return this.isConnected ? [{}] : [] })
  return () => spy.mockRestore()
}
