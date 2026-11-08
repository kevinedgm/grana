// Ficha interactiva de GFileField. Los controles salen de GFileField.meta.json.
import { GFileField, formatFileSize } from '@grana/vue/file-field'
import { createSimulatedUploader } from '@grana/vue/testing'

const E = (es, en) => ({ es, en })
void GFileField

// El campo no trae textos. `labelsSrc` repite el literal como texto para el código copiado.
const PLURAL = "const plural = (n, uno, varios) => (n === 1 ? uno : varios.replace('{n}', n))"
const labelsSrc = {
  es: `{
  add: 'Adjuntar archivo', addMany: 'Adjuntar archivos', addMore: 'Añadir más', change: 'Cambiar archivo',
  full: (count, max) => \`\${count} de \${max}\`, readonly: 'Solo lectura', none: 'Sin archivos',
  status: ({ count, max, active, failed }) => [
    max && max > 1 ? \`\${count} de \${max}\` : plural(count, '1 archivo', '{n} archivos'),
    active ? \`\${active} subiendo\` : '', failed ? plural(failed, '1 con error', '{n} con error') : ''
  ].filter(Boolean).join(' · '),
  list: 'Archivos de {label}', drop: 'Soltar aquí · {hint}', dropInto: 'Soltar en {label}',
  dropRejected: '{label} no admite estos archivos', dropFull: '{label} está lleno',
  remove: 'Quitar {name}', cancel: 'Cancelar subida de {name}', retry: 'Reintentar {name}',
  queued: 'En cola', done: 'Subido', error: 'Error:', progress: 'Subida de {name}', progressText: '{percent} %, {loaded} de {total}',
  uploadFailed: 'No se pudo subir', notAdded: 'Archivos no añadidos', dismiss: 'Descartar',
  reasons: { type: 'no es un tipo admitido', empty: 'está vacío', duplicate: 'ya está en la lista', size: 'pesa {size}, el máximo es {limit}', count: 'ya hay {limit}, el máximo' },
  added: 'Añadido {name}.', addedMany: (n) => \`Añadidos \${n} archivos.\`, replaced: '{old} reemplazado por {name}.',
  rejected: 'No se añadió {name}: {reason}.', rejectedMany: 'No se añadieron {count} archivos: {list}.',
  uploading: (n) => (n === 1 ? 'Subiendo.' : \`Subiendo \${n}.\`), uploaded: '{name} subido.', uploadedMany: (n) => \`\${n} archivos subidos.\`,
  uploadError: 'No se pudo subir {name}: {message}.', retrying: 'Reintentando {name}.',
  removed: (n, name) => \`Quitado \${name}. \` + (n ? plural(n, 'Queda 1 archivo.', 'Quedan {n} archivos.') : 'Sin archivos.'),
  canceled: (n, name) => \`Subida de \${name} cancelada. \` + (n ? plural(n, 'Queda 1 archivo.', 'Quedan {n} archivos.') : 'Sin archivos.'),
  pending: (n, name) => (n === 1 ? \`Espera a que termine de subir \${name}.\` : \`Esperan \${n} archivos por subir.\`),
  failed: (n, name) => (n === 1 ? \`No se pudo subir \${name}: reinténtalo o quítalo.\` : \`\${n} archivos no se subieron: reinténtalos o quítalos.\`)
}`,
  en: `{
  add: 'Attach file', addMany: 'Attach files', addMore: 'Add more', change: 'Change file',
  full: (count, max) => \`\${count} of \${max}\`, readonly: 'Read only', none: 'No files',
  status: ({ count, max, active, failed }) => [
    max && max > 1 ? \`\${count} of \${max}\` : plural(count, '1 file', '{n} files'),
    active ? \`\${active} uploading\` : '', failed ? plural(failed, '1 failed', '{n} failed') : ''
  ].filter(Boolean).join(' · '),
  list: 'Files of {label}', drop: 'Drop here · {hint}', dropInto: 'Drop into {label}',
  dropRejected: '{label} does not accept these files', dropFull: '{label} is full',
  remove: 'Remove {name}', cancel: 'Cancel upload of {name}', retry: 'Retry {name}',
  queued: 'Queued', done: 'Uploaded', error: 'Error:', progress: 'Upload of {name}', progressText: '{percent} %, {loaded} of {total}',
  uploadFailed: 'Could not upload', notAdded: 'Files not added', dismiss: 'Dismiss',
  reasons: { type: 'is not an accepted type', empty: 'is empty', duplicate: 'is already in the list', size: 'is {size}, the maximum is {limit}', count: 'there are already {limit}, the maximum' },
  added: 'Added {name}.', addedMany: (n) => \`Added \${n} files.\`, replaced: '{old} replaced by {name}.',
  rejected: 'Did not add {name}: {reason}.', rejectedMany: 'Did not add {count} files: {list}.',
  uploading: (n) => (n === 1 ? 'Uploading.' : \`Uploading \${n}.\`), uploaded: '{name} uploaded.', uploadedMany: (n) => \`\${n} files uploaded.\`,
  uploadError: 'Could not upload {name}: {message}.', retrying: 'Retrying {name}.',
  removed: (n, name) => \`Removed \${name}. \` + (n ? plural(n, '1 file left.', '{n} files left.') : 'No files.'),
  canceled: (n, name) => \`Upload of \${name} canceled. \` + (n ? plural(n, '1 file left.', '{n} files left.') : 'No files.'),
  pending: (n, name) => (n === 1 ? \`Wait for \${name} to finish uploading.\` : \`\${n} files are waiting to upload.\`),
  failed: (n, name) => (n === 1 ? \`Could not upload \${name}: retry or remove it.\` : \`\${n} files did not upload: retry or remove them.\`)
}`
}
const plural = (n, uno, varios) => (n === 1 ? uno : varios.replace('{n}', n))
const textosEs = {
  add: 'Adjuntar archivo', addMany: 'Adjuntar archivos', addMore: 'Añadir más', change: 'Cambiar archivo',
  full: (count, max) => `${count} de ${max}`, readonly: 'Solo lectura', none: 'Sin archivos',
  status: ({ count, max, active, failed }) => [
    max && max > 1 ? `${count} de ${max}` : plural(count, '1 archivo', '{n} archivos'),
    active ? `${active} subiendo` : '', failed ? plural(failed, '1 con error', '{n} con error') : ''
  ].filter(Boolean).join(' · '),
  list: 'Archivos de {label}', drop: 'Soltar aquí · {hint}', dropInto: 'Soltar en {label}',
  dropRejected: '{label} no admite estos archivos', dropFull: '{label} está lleno',
  remove: 'Quitar {name}', cancel: 'Cancelar subida de {name}', retry: 'Reintentar {name}',
  queued: 'En cola', done: 'Subido', error: 'Error:', progress: 'Subida de {name}', progressText: '{percent} %, {loaded} de {total}',
  uploadFailed: 'No se pudo subir', notAdded: 'Archivos no añadidos', dismiss: 'Descartar',
  reasons: { type: 'no es un tipo admitido', empty: 'está vacío', duplicate: 'ya está en la lista', size: 'pesa {size}, el máximo es {limit}', count: 'ya hay {limit}, el máximo' },
  added: 'Añadido {name}.', addedMany: (n) => `Añadidos ${n} archivos.`, replaced: '{old} reemplazado por {name}.',
  rejected: 'No se añadió {name}: {reason}.', rejectedMany: 'No se añadieron {count} archivos: {list}.',
  uploading: (n) => (n === 1 ? 'Subiendo.' : `Subiendo ${n}.`), uploaded: '{name} subido.', uploadedMany: (n) => `${n} archivos subidos.`,
  uploadError: 'No se pudo subir {name}: {message}.', retrying: 'Reintentando {name}.',
  removed: (n, name) => `Quitado ${name}. ` + (n ? plural(n, 'Queda 1 archivo.', 'Quedan {n} archivos.') : 'Sin archivos.'),
  canceled: (n, name) => `Subida de ${name} cancelada. ` + (n ? plural(n, 'Queda 1 archivo.', 'Quedan {n} archivos.') : 'Sin archivos.'),
  pending: (n, name) => (n === 1 ? `Espera a que termine de subir ${name}.` : `Esperan ${n} archivos por subir.`),
  failed: (n, name) => (n === 1 ? `No se pudo subir ${name}: reinténtalo o quítalo.` : `${n} archivos no se subieron: reinténtalos o quítalos.`)
}
const textosEn = {
  add: 'Attach file', addMany: 'Attach files', addMore: 'Add more', change: 'Change file',
  full: (count, max) => `${count} of ${max}`, readonly: 'Read only', none: 'No files',
  status: ({ count, max, active, failed }) => [
    max && max > 1 ? `${count} of ${max}` : plural(count, '1 file', '{n} files'),
    active ? `${active} uploading` : '', failed ? plural(failed, '1 failed', '{n} failed') : ''
  ].filter(Boolean).join(' · '),
  list: 'Files of {label}', drop: 'Drop here · {hint}', dropInto: 'Drop into {label}',
  dropRejected: '{label} does not accept these files', dropFull: '{label} is full',
  remove: 'Remove {name}', cancel: 'Cancel upload of {name}', retry: 'Retry {name}',
  queued: 'Queued', done: 'Uploaded', error: 'Error:', progress: 'Upload of {name}', progressText: '{percent} %, {loaded} of {total}',
  uploadFailed: 'Could not upload', notAdded: 'Files not added', dismiss: 'Dismiss',
  reasons: { type: 'is not an accepted type', empty: 'is empty', duplicate: 'is already in the list', size: 'is {size}, the maximum is {limit}', count: 'there are already {limit}, the maximum' },
  added: 'Added {name}.', addedMany: (n) => `Added ${n} files.`, replaced: '{old} replaced by {name}.',
  rejected: 'Did not add {name}: {reason}.', rejectedMany: 'Did not add {count} files: {list}.',
  uploading: (n) => (n === 1 ? 'Uploading.' : `Uploading ${n}.`), uploaded: '{name} uploaded.', uploadedMany: (n) => `${n} files uploaded.`,
  uploadError: 'Could not upload {name}: {message}.', retrying: 'Retrying {name}.',
  removed: (n, name) => `Removed ${name}. ` + (n ? plural(n, '1 file left.', '{n} files left.') : 'No files.'),
  canceled: (n, name) => `Upload of ${name} canceled. ` + (n ? plural(n, '1 file left.', '{n} files left.') : 'No files.'),
  pending: (n, name) => (n === 1 ? `Wait for ${name} to finish uploading.` : `${n} files are waiting to upload.`),
  failed: (n, name) => (n === 1 ? `Could not upload ${name}: retry or remove it.` : `${n} files did not upload: retry or remove them.`)
}

const uploader = createSimulatedUploader({ interval: 140, steps: 12 })
const hintOf = (en) => (en ? `PDF or image · up to ${formatFileSize(5_000_000, 'en-US')} · maximum 4` : `PDF o imagen · hasta ${formatFileSize(5_000_000, 'es-MX')} · máximo 4`)

export default {
  // uploader, labels y los límites son del adaptador y del idioma de la aplicación; name lo pide GForm para bloquear el envío.
  exclude: ['id', 'name', 'warning', 'valid', 'uploader', 'labels', 'locale', 'accept', 'maxSize', 'max', 'concurrency', 'multiple'],
  ignore: ['reject'],
  model: { value: [{ key: 'doc-118', name: 'Receta médica.pdf', size: 220000, type: 'application/pdf', value: 'doc-118' }], var: 'estudios' },
  text: ['label', 'hint', 'error'],
  imports: ["import { GFileField } from '@grana/vue/file-field'", "import { createSimulatedUploader } from '@grana/vue/testing'"],
  block: true,
  base: {
    label: E('Estudios del expediente', 'Record studies'),
    hint: E(hintOf(false), hintOf(true)),
    locale: E('es-MX', 'en-US'),
    multiple: true,
    max: 4,
    accept: '.pdf,image/*',
    maxSize: 5000000,
    uploader,
    labels: { es: textosEs, en: textosEn }
  },
  code: { uploader: ':uploader="uploader"', labels: ':labels="textos"' },
  script: {
    es: `// Sin red: el adaptador simulado sube por pasos. En tu aplicación, aquí va tu cliente HTTP.\nconst uploader = createSimulatedUploader({ interval: 140, steps: 12 })\n${PLURAL}\nconst textos = ${labelsSrc.es}`,
    en: `// No network: the simulated adapter uploads in steps. In your app, your HTTP client goes here.\nconst uploader = createSimulatedUploader({ interval: 140, steps: 12 })\n${PLURAL}\nconst textos = ${labelsSrc.en}`
  },
  cases: [
    {
      title: E('Varios estudios con límites', 'Several studies with limits'),
      why: E('multiple con max, max-size y accept: el campo rechaza lo que no cabe y explica por qué; los límites no sustituyen a la validación del servidor.', 'multiple with max, max-size and accept: the field rejects what does not fit and says why; limits do not replace server validation.'),
      props: {}
    },
    {
      title: E('Un solo documento', 'A single document'),
      why: E('sin multiple, elegir otro archivo reemplaza el actual; úsalo para un documento único, como una identificación.', 'without multiple, choosing another file replaces the current one; use it for a single document, such as an ID.'),
      props: { multiple: false, max: '', label: E('Identificación oficial', 'Official ID'), hint: E('Una sola imagen o PDF.', 'A single image or PDF.'), required: true }
    },
    {
      title: E('Adjunto obligatorio con error', 'Required attachment with an error'),
      why: E('required y error al enviar sin archivos; con pendientes o fallidos el envío se bloquea en GForm.', 'required and error on submit without files; with pending or failed uploads the submit is blocked in GForm.'),
      props: { required: true, error: E('Adjunta al menos un estudio.', 'Attach at least one study.') }
    },
    {
      title: E('Lista de solo lectura', 'Read-only list'),
      why: E('readonly muestra lo adjuntado sin permitir añadir ni quitar; úsalo en expedientes cerrados.', 'readonly shows what is attached without allowing add or remove; use it in closed records.'),
      props: { readonly: true }
    }
  ]
}
