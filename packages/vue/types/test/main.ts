// Uso correcto y erróneo de los tipos (src/types.test.js los comprueba con vue-tsc). Cada `@ts-expect-error` es un uso
// erróneo que DEBE fallar: si los tipos dejaran de detectarlo, vue-tsc avisaría de una directiva sin error.
import { createApp, h, ref } from 'vue'
import Grana, {
  GBtn, GForm, GIcon, GInput, GSelect, GTable,
  createIcons, createToaster, formKey, summaryDiff, useFormField, useToast
} from '@grana/vue'
import type { GBtnProps, SelectOption, Toaster } from '@grana/vue'
import Combobox, { GCombobox } from '@grana/vue/combobox'
import type { ComboboxChange, ComboboxOption } from '@grana/vue/combobox'
import FileField, { GFileField, formatFileSize } from '@grana/vue/file-field'
import type { FileEntry, FileUploader } from '@grana/vue/file-field'
import TimeField, { GTimeField } from '@grana/vue/time-field'
import { createSpeech, createTranscript, useSpeech, useSpeechTarget, GTranscript } from '@grana/vue/speech'
import { createStatus, useStatus, GStatusIsland } from '@grana/vue/status'
import { createSimulatedSpeechAdapter, createSimulatedUploader } from '@grana/vue/testing'
import App from './App.vue'
// GTag + GTagGroup (tag.md, #462, #463)
import Tag, { GTag, GTagGroup } from '@grana/vue/tag'
import type { TagItem, TagGroupLabels } from '@grana/vue/tag'

const toaster: Toaster = createToaster({ position: 'bottom-end', limit: 3 })
const status = createStatus({ position: 'top-center' })
const speech = createSpeech({ adapter: createSimulatedSpeechAdapter({ location: 'local' }) })
createApp(App).use(Grana).use(Combobox).use(FileField).use(TimeField).use(Tag).use(toaster).use(status).use(speech).use(createIcons([]))

toaster.success('Guardado', { description: 'Listo' })
toaster.show({ title: 'Hola', type: 'info', duration: 'auto' })
status.set('red', { type: 'error', title: 'Sin conexión' })
const n: number = status.conditions.length
const sizeText: string = formatFileSize(2048, 'es')
const diff = summaryDiff([{ title: 'Ana', facts: [{ label: 'Edad', value: '30' }] }])
const t = createTranscript()
const step = t.undo()
const uploader: FileUploader = createSimulatedUploader({ speed: 2 })
uploader.length
createSimulatedUploader().setOffline(true)

const option: ComboboxOption = { value: 'p1', label: 'María', facts: [{ label: 'Exp.', value: '001' }], extra: 1 }
const select: SelectOption[] = [{ value: 'mx', label: 'México' }]
const entry: FileEntry = { key: 'a', name: 'a.pdf', size: 1, type: 'application/pdf', state: 'done', value: 'srv-1', url: null, error: null }
const props: GBtnProps = { variant: 'soft', size: 'lg' }

h(GBtn, { variant: 'outline', onClick: (e: MouseEvent) => e.clientX })
h(GCombobox, { options: [option], modelValue: 'p1', 'onUpdate:modelValue': (v) => v })
h(GFileField, { modelValue: [entry], uploader })
h(GTimeField, { modelValue: '09:30' })
h(GTable, { columns: [{ key: 'name', label: 'Nombre', sortable: true }], rows: [] })
h(GSelect, { options: select })

const form = ref<InstanceType<typeof GForm> | null>(null)
form.value?.showErrors()
const ok: Promise<boolean> | undefined = form.value?.focusFirstError()
const file = ref<InstanceType<typeof GFileField> | null>(null)
file.value?.add([])

export function setupLike() {
  const field = useFormField({ name: 'email', trigger: 'blur' })
  const invalid: boolean = field.invalid.value
  useSpeechTarget({ id: 'notes', label: 'Notas', get: () => '', set: () => {} })
  const s = useSpeech(); s?.start({ mode: 'dictation', target: { id: 'notes' } })
  const st = useStatus(); st?.info('x', 'Título')
  const ts = useToast(); ts?.dismiss()
  return { invalid, formKey, GInput, GTranscript, GStatusIsland }
}

// ---- Usos erróneos: cada uno debe ser un error de tipos ----
// @ts-expect-error posición fuera de la lista
createToaster({ position: 'middle' })
// @ts-expect-error aviso sin título
toaster.show({ type: 'info' })
// @ts-expect-error tipo de condición fuera de la lista
status.set('x', { type: 'fatal', title: 'x' })
// @ts-expect-error el tamaño es un número
formatFileSize('12')
// @ts-expect-error una opción necesita label
const badOption: ComboboxOption = { value: 1 }
// @ts-expect-error variant fuera de la lista de GBtn
h(GBtn, { variant: 'nope' })
// @ts-expect-error el evento click recibe un MouseEvent
h(GBtn, { onClick: (e: string) => e })
// @ts-expect-error GForm no expone submitNow
form.value?.submitNow()
// @ts-expect-error estado de entrada fuera de la lista
const badEntry: FileEntry = { ...entry, state: 'sent' }
// @ts-expect-error la captura necesita un adaptador
createSpeech({})
// @ts-expect-error createSimulatedUploader devuelve un adaptador, no una promesa
createSimulatedUploader().then
// @ts-expect-error useFormField: trigger fuera de la lista
useFormField({ trigger: 'input' })
// @ts-expect-error GIcon necesita name
h(GIcon, {})
// @ts-expect-error props de GBtn: size fuera de la lista
const badProps: GBtnProps = { size: 'huge' }

export { n, sizeText, diff, step, props, ok, badOption, badEntry, badProps }

// ---- GTag + GTagGroup ----
const tagItems: TagItem[] = [
  { id: 'pen', label: 'Penicilina', removable: true, facet: 'Alergias', avatar: { initials: 'P' }, extra: 1 },
  { id: 2, label: 'Solo pendientes', pressed: true, color: 3 },
  { id: 3, label: 'Vue', href: '/temas/vue', icon: 'tag', color: 'neutral' }
]
const tagLabels: TagGroupLabels = {
  remove: 'Quitar {label}',
  removeIn: ({ label, facet }) => `Quitar ${label} de ${facet}`,
  more: ({ count }) => `Ver ${count} más`,
  empty: 'Sin etiquetas'
}
h(GTagGroup, {
  items: tagItems,
  label: 'Alergias',
  layout: 'facets',
  labels: tagLabels,
  emptyFocus: () => document.body,
  'onUpdate:items': (v: TagItem[]) => v.length,
  onRemove: (p) => p.item.label + p.index + p.source,
  onRestore: (p) => p.items.length + p.source,
  onToggle: (p) => p.pressed && p.item.id,
  onNavigate: (p) => { p.event.preventDefault(); return p.href + p.item.label },
  onSettle: (p) => p.items.map((i) => i.id)
})
h(GTag, { label: 'Látex', removable: true, labels: { remove: ({ label }) => `Quitar ${label}` }, pressed: null, color: '12', onRemove: (p) => p.source, onNavigate: (p) => p.href, 'onUpdate:pressed': (v: boolean) => v })
// @ts-expect-error un TagItem necesita id
const badTag: TagItem = { label: 'Sin id' }
// @ts-expect-error layout fuera de la lista
h(GTagGroup, { items: [], label: 'X', layout: 'grid' })
// @ts-expect-error la fuente de remove es 'button' o 'key'
h(GTagGroup, { items: [], label: 'X', onRemove: (p: { source: 'mouse' }) => p })
// @ts-expect-error color semántico: no es una categoría
h(GTag, { label: 'X', color: 'danger' })
// @ts-expect-error size fuera de la lista
h(GTag, { label: 'X', size: 'lg' })

export { tagItems, badTag }
