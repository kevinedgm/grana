// Tipos escritos a mano de @grana/vue (dueño: bruno). Lo que los *.meta.json no pueden describir: la forma de los objetos
// que reciben las props (opciones, elementos, entradas, columnas…), los gestores (createToaster, createStatus,
// createSpeech, createTranscript) y las funciones exportadas. scripts/build-types.mjs copia este archivo a
// dist/types/shared.d.ts y cada entrada lo reexporta: `import type { ComboboxOption } from '@grana/vue/combobox'` funciona.
// Fuente de la forma: los contratos de design/contracts/ y docs/contract/api.md. Al cambiar un contrato, se cambia aquí y
// la prueba src/types.test.js lo comprueba contra los meta.json y contra lo que exporta cada entrada.
import type {
  App,
  ComponentOptionsMixin,
  DefineComponent,
  EmitsToProps,
  InjectionKey,
  PublicProps,
  Ref,
  SlotsType,
  VNode
} from 'vue'

// ---------------------------------------------------------------------------------------------------------------------
// Componente tipado
// ---------------------------------------------------------------------------------------------------------------------

/** Firma de un evento: `(payload) => void`, o sin argumentos. */
export type GranaEmits = Record<string, (...args: any[]) => void>

/** Componente de Grana: `DefineComponent` con props, eventos, slots y lo expuesto por `ref`. */
export type GranaComponent<
  P extends object,
  E extends GranaEmits = {},
  S extends Record<string, any> = {},
  X extends object = {}
> = DefineComponent<
  P,
  X,
  {},
  {},
  {},
  ComponentOptionsMixin,
  ComponentOptionsMixin,
  E,
  string,
  PublicProps,
  Readonly<P> & Readonly<EmitsToProps<E>>,
  {},
  SlotsType<S>
>

/** Alcance de un slot que no documenta el suyo. */
export type GranaSlotScope = Record<string, unknown>

/** Contenido que devuelve un slot. */
export type GranaSlotContent = VNode[] | VNode | string | null | undefined | void

/** Valor, `ref` o getter (las opciones de `useFormField`). */
export type MaybeRefOrGetter<T> = T | Ref<T> | (() => T)

/** Plugin de Vue (`app.use(x)`). */
export interface GranaPlugin {
  install(app: App): void
}

/** Textos de un componente (`labels`): sin valores por defecto; plantillas con `{marcas}` o funciones. */
export type GranaLabels = Record<string, any>

/** Categoría de color del tema (`--g-color-cat-1` a `--g-color-cat-12`). */
export type GranaCategory = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/** Paleta de color de los componentes (`color`). */
export type GranaColor = 'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'

/** Nombre de un icono de Lucide (cadena en kebab-case: `pencil`, `circle-check`). */
export type IconName = string

/** Clave de fila, opción, paso o pestaña. */
export type GranaKey = string | number

/** Datos propios de la aplicación que el componente conserva y devuelve en los slots. */
export interface GranaExtra {
  [key: string]: unknown
}

// ---------------------------------------------------------------------------------------------------------------------
// Opciones y elementos
// ---------------------------------------------------------------------------------------------------------------------

/** Opción de `GSelect` y `GInputGroupSelect` (select.md «Opciones»). */
export interface SelectOption extends GranaExtra {
  value: string | number
  label: string
  disabled?: boolean
}
/** Grupo de opciones (sin anidar). */
export interface SelectOptionGroup<O = SelectOption> extends GranaExtra {
  label: string
  options: O[]
}

/** Opción de `GRadioGroup` (radio-group.md): forma de `GSelect`, sin grupos; `value` también Boolean. */
export interface RadioOption extends GranaExtra {
  value: string | number | boolean
  label: string
  description?: string
  icon?: IconName
  disabled?: boolean
}

/** Dato con rótulo de una ficha (`GSummary`, opciones de `GCombobox`; summary.md «Datos»). */
export interface SummaryFact extends GranaExtra {
  label: string
  value?: string | number | null
  short?: string
  priority?: number
  bare?: boolean
}

/** Props de `GAvatar` que aceptan las fichas y las opciones (`size` y `label` se ignoran). */
export interface AvatarSpec {
  src?: string
  name?: string
  initials?: string
  icon?: IconName
  color?: string | number
  categories?: number
  colorKey?: string | number
  shape?: 'circle' | 'square'
}

/** Diferencias de `summaryDiff` por rótulo. */
export type SummaryDiff = Record<string, 'same' | 'diff'>

/** Ficha que recibe `summaryDiff`. */
export interface SummaryDiffItem {
  title: string
  facts?: SummaryFact[]
  [key: string]: unknown
}

/** Opción de `GCombobox` (combobox.md «Opciones»). Los campos de más llegan a los slots. */
export interface ComboboxOption extends GranaExtra {
  value: string | number
  label: string
  description?: string
  code?: string
  facts?: SummaryFact[]
  avatar?: boolean | AvatarSpec
  icon?: IconName
  disabled?: boolean
}
/** Grupo de opciones de `GCombobox` (sin anidar). */
export interface ComboboxOptionGroup extends GranaExtra {
  label: string
  options: ComboboxOption[]
}
/** `change` de `GCombobox` sin `multiple`. */
export interface ComboboxChange {
  value: string | number | null
  custom: string
  option: ComboboxOption | null
}
/** `change` de `GCombobox` con `multiple` (#421). */
export interface ComboboxMultipleChange {
  value: Array<string | number>
  custom: string[]
  options: ComboboxOption[]
  added: Array<string | number>
  removed: Array<string | number>
}

/** Elemento de `GMenu` (menu.md «Elementos»); también `actions` de `GWidget` y `menu` de `GCard`. */
export interface MenuItem extends GranaExtra {
  type?: 'item' | 'checkbox' | 'radio' | 'separator' | 'group'
  id?: GranaKey
  label?: string
  icon?: IconName | unknown
  shortcut?: string
  keyshortcuts?: string
  disabled?: boolean
  danger?: boolean
  checked?: boolean
  items?: MenuItem[]
}
/** `select` de `GMenu`. */
export interface MenuSelectEvent {
  id: GranaKey
  item: MenuItem
  type: 'item' | 'checkbox' | 'radio'
  checked?: boolean
  group?: MenuItem
  event: Event
}

/** Pestaña de `GTabs` (tabs.md «Elementos»). */
export interface TabItem extends GranaExtra {
  id: GranaKey
  label: string
  icon?: IconName | unknown
  count?: number
  countLabel?: string
  badge?: string
  badgeLabel?: string
  status?: 'loading' | 'attention'
  statusLabel?: string
  disabled?: boolean
}

/** Destino de `GSidebar` (sidebar.md «Modelo de items»). */
export interface SidebarItem extends GranaExtra {
  id?: GranaKey
  label?: string
  icon?: IconName | unknown
  href?: string
  items?: SidebarItem[]
  children?: SidebarItem[]
  disabled?: boolean
}

/** Nivel de `GBreadcrumbs` (breadcrumbs.md «Modelo de `items`»). El último es la página actual. */
export interface BreadcrumbItem extends GranaExtra {
  label: string
  href?: string
  icon?: IconName | unknown
  /** Hermanos del nivel SIGUIENTE: encienden una puerta delante de él. */
  children?: BreadcrumbChild[]
}
/** Hijo de una puerta de `GBreadcrumbs`. */
export interface BreadcrumbChild extends GranaExtra {
  label: string
  href?: string
}
/** `navigate` de `GBreadcrumbs` (#494, #505). */
export interface BreadcrumbsNavigateEvent {
  item: BreadcrumbItem | BreadcrumbChild
  index: number
  event: MouseEvent
  from: 'path' | 'up' | 'stairs' | 'door'
}

/** Paso de `GStepper` (stepper.md «Pasos»). */
export interface StepperStep extends GranaExtra {
  id?: GranaKey
  label: string
  description?: string
  state?: 'complete' | 'current' | 'pending' | 'error' | 'warning' | 'disabled' | 'optional'
  optional?: boolean
}

/** Columna de `GTable` (table.md «Columnas»). */
export interface TableColumn extends GranaExtra {
  key: string
  label?: string
  title?: string
  subtitle?: string
  leading?: string
  primary?: boolean
  align?: 'start' | 'end'
  sortable?: boolean
  sortBy?: string
}
/** Orden de `GTable` (`v-model:sort`). */
export interface TableSort {
  key: string
  direction: 'ascending' | 'descending'
}
/** Filtro aplicado de `GTable` y `GFilterBar` (`v-model:filters`). */
export interface Filter extends GranaExtra {
  key: string
  op: string
  value: unknown
}
/** Campo filtrable de `GFilterBar`. */
export interface FilterField extends GranaExtra {
  key: string
  label: string
  type?: 'text' | 'number' | 'date' | 'enum'
  options?: Array<string | number | { value: string | number; label: string }>
}

/** Dato de `GCard` (`meta`). */
export interface CardMeta extends GranaExtra {
  label: string
  value: string | number
  priority?: 'high' | 'low'
}

/** Error de `GErrorSummary` y de `invalid` de `GForm`. */
export interface FormError {
  name?: string
  id?: string | null
  message: string
}

/** Rango de `GDatePicker` (ISO `yyyy-mm-dd`). */
export interface DateRange {
  start: string | null
  end: string | null
}

/** Evento de `GCalendar` (calendar.md): campos propios de la aplicación permitidos. */
export interface CalendarEvent extends GranaExtra {
  id: GranaKey
  title?: string
  start: string | Date
  end?: string | Date
  resourceId?: GranaKey
}

// ---------------------------------------------------------------------------------------------------------------------
// Campo de archivos (file-field.md)
// ---------------------------------------------------------------------------------------------------------------------

export type FileEntryState = 'ready' | 'queued' | 'uploading' | 'done' | 'error'

/** Entrada del modelo de `GFileField` (#368). Una entrada sin `file` es un archivo ya guardado (`done`). */
export interface FileEntry {
  key: string
  name: string
  size: number
  type: string
  state: FileEntryState
  value: unknown
  url: string | null
  error: string | null
  file?: File | null
}

/** Adaptador de subida de la aplicación: Grana no hace red. */
export type FileUploader = (
  file: File,
  context: { signal: AbortSignal; progress: (fraction: number) => void }
) => Promise<{ value: unknown; url?: string | null }>

export type FileRejectReason = 'type' | 'empty' | 'size' | 'duplicate' | 'count'
export type FileChangeVia = 'picker' | 'drop' | 'paste' | 'api' | 'remove' | 'cancel'

export interface FileFieldChange {
  added: FileEntry[]
  removed: FileEntry[]
  via: FileChangeVia
}
export interface FileFieldReject {
  items: Array<{ file: File; name: string; reason: FileRejectReason }>
  via: FileChangeVia
}
export interface FileFieldAddResult {
  added: FileEntry[]
  rejected: Array<{ file: File; name: string; reason: FileRejectReason }>
}

/** Adaptador simulado de `@grana/vue/testing`: el adaptador más sus controles. */
export interface SimulatedUploader extends FileUploader {
  setOffline(value: boolean): void
  setSpeed(value: number): void
  stats(): { calls: number; active: number; done: number; failed: number; aborted: number }
  attempts(name: string): number
  reset(): void
}
export type NameTest = RegExp | ((name: string) => boolean) | boolean
export interface SimulatedUploaderOptions {
  interval?: number
  steps?: number
  slowSteps?: number
  speed?: number
  failOnce?: NameTest
  failAlways?: NameTest
  slow?: NameTest
  noValue?: NameTest
  failAt?: number
  failMessage?: string
  serverMessage?: string
  offlineMessage?: string
  offline?: boolean
  value?: (file: File, n: number) => string | number
  url?: (file: File) => string | null
}

// ---------------------------------------------------------------------------------------------------------------------
// Formularios (form.md §2)
// ---------------------------------------------------------------------------------------------------------------------

export type FormDensity = 'default' | 'comfortable' | 'compact'

export interface FormFieldOptions {
  name?: MaybeRefOrGetter<string | undefined>
  id?: MaybeRefOrGetter<string | undefined>
  error?: MaybeRefOrGetter<string | null | undefined>
  warning?: MaybeRefOrGetter<string | null | undefined>
  valid?: MaybeRefOrGetter<string | null | undefined>
  required?: MaybeRefOrGetter<boolean | undefined>
  readonly?: MaybeRefOrGetter<boolean | undefined>
  disabled?: MaybeRefOrGetter<boolean | undefined>
  density?: MaybeRefOrGetter<FormDensity | undefined>
  block?: MaybeRefOrGetter<boolean | undefined>
  mark?: MaybeRefOrGetter<string | null | undefined>
  trigger?: 'blur' | 'change'
  control?: Ref<HTMLElement | null | undefined>
  root?: Ref<HTMLElement | null | undefined>
}

export interface FormFieldMessage {
  type: 'error' | 'warning' | 'valid'
  text: string
  prefix: string
}

/** Lo que devuelve `useFormField` (contractual; los internos no se tipan). */
export interface FormField {
  readonly id: Readonly<Ref<string>>
  readonly messageId: Readonly<Ref<string>>
  readonly inForm: boolean
  readonly density: Readonly<Ref<FormDensity>>
  readonly readonly: Readonly<Ref<boolean>>
  readonly disabled: Readonly<Ref<boolean>>
  readonly block: Readonly<Ref<boolean>>
  readonly mark: Readonly<Ref<'required' | 'optional' | null>>
  readonly markText: Readonly<Ref<string>>
  readonly message: Readonly<Ref<FormFieldMessage | null>>
  readonly invalid: Readonly<Ref<boolean>>
  readonly live: Readonly<Ref<'polite' | 'off'>>
  readonly handlers: {
    onInput: (event: Event) => void
    onChange: (event: Event) => void
    onFocusout: (event: FocusEvent) => void
  }
  notifyChange(): void
}

/** `submit` de `GForm`. */
export interface FormSubmitEvent {
  event: SubmitEvent | Event
  data: FormData
  submitter: HTMLElement | null
  novalidate: boolean
}
/** `invalid` de `GForm`. */
export interface FormInvalidEvent {
  event: Event
  errors: Array<{ name: string; message: string; id: string | null }>
}

// ---------------------------------------------------------------------------------------------------------------------
// Avisos (toast.md, servicio imperativo)
// ---------------------------------------------------------------------------------------------------------------------

export type ToastType = 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'loading'
export type ToasterPosition = 'top-start' | 'top-center' | 'top-end' | 'bottom-start' | 'bottom-center' | 'bottom-end'
export type ToastId = string | number
export type ToastDismissReason = 'timeout' | 'close' | 'escape' | 'swipe' | 'action' | 'api' | 'clear'

export interface ToastOptions {
  id?: ToastId
  type?: ToastType
  title: string
  description?: string
  action?: { label: string; onClick(toast: Toast): void }
  duration?: 'auto' | number
  politeness?: 'polite' | 'assertive'
  onDismiss?: (reason: ToastDismissReason, toast: Toast) => void
}
/** Aviso publicado (copia congelada). */
export interface Toast {
  readonly id: ToastId
  readonly type: ToastType
  readonly title: string
  readonly description?: string
  readonly action?: { label: string; onClick(toast: Toast): void }
  readonly politeness: 'polite' | 'assertive'
  readonly duration: number
  readonly count: number
  readonly state: string
  readonly createdAt: number
}
export interface ToasterOptions {
  position?: ToasterPosition
  limit?: number
  mobileLimit?: number
  duration?: 'auto' | number
  autoClose?: boolean
  hotkey?: string | false
  swipe?: boolean
  offset?: { top?: number | string; bottom?: number | string }
  labels?: GranaLabels
}
export interface Toaster extends GranaPlugin {
  show(options: ToastOptions): ToastId | null
  info(title: string, options?: Omit<ToastOptions, 'title' | 'type'>): ToastId | null
  success(title: string, options?: Omit<ToastOptions, 'title' | 'type'>): ToastId | null
  warning(title: string, options?: Omit<ToastOptions, 'title' | 'type'>): ToastId | null
  error(title: string, options?: Omit<ToastOptions, 'title' | 'type'>): ToastId | null
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string | Omit<ToastOptions, 'type'>
      success: string | Omit<ToastOptions, 'type'> | ((value: T) => string | Omit<ToastOptions, 'type'>)
      error: string | Omit<ToastOptions, 'type'> | ((reason: unknown) => string | Omit<ToastOptions, 'type'>)
    },
    options?: Omit<ToastOptions, 'title' | 'type'>
  ): Promise<T>
  update(id: ToastId, patch: Partial<ToastOptions>): boolean
  dismiss(id?: ToastId): void
  clear(): void
  configure(patch: ToasterOptions): void
  readonly toasts: readonly Toast[]
}

// ---------------------------------------------------------------------------------------------------------------------
// Iconos (icons.md)
// ---------------------------------------------------------------------------------------------------------------------

/** Registro de iconos de la aplicación (`createIcons`). */
export type IconsPlugin = GranaPlugin

// ---------------------------------------------------------------------------------------------------------------------
// Isla de estado (status.md)
// ---------------------------------------------------------------------------------------------------------------------

export type StatusType = 'info' | 'success' | 'warning' | 'error'
export type StatusId = string | number
export type StatusRemoveReason = 'dismiss' | 'acknowledge' | 'api' | 'clear' | 'unmount'

export interface StatusConditionOptions {
  type?: StatusType
  title: string
  description?: string
  details?: string
  action?: { label: string; busyLabel?: string; onClick(condition: StatusCondition): unknown }
  link?: { label: string; href: string; target?: string; rel?: string; onClick?(event: MouseEvent, condition: StatusCondition): void }
  origin?: { label: string; target: string | Element | (() => Element | null) }
  persistent?: boolean
  dismissible?: boolean
  deadline?: number | Date
  politeness?: 'polite' | 'assertive'
  onRemove?: (reason: StatusRemoveReason, condition: StatusCondition) => void
  onExpire?: (condition: StatusCondition) => void
}
/** Condición publicada (copia congelada). */
export interface StatusCondition {
  readonly id: StatusId
  readonly type: StatusType
  readonly title: string
  readonly description?: string
  readonly details?: string
  readonly action?: StatusConditionOptions['action']
  readonly link?: StatusConditionOptions['link']
  readonly origin?: StatusConditionOptions['origin']
  readonly persistent: boolean
  readonly dismissible: boolean
  readonly deadline?: number | Date
  readonly politeness: 'polite' | 'assertive'
  readonly acknowledged: boolean
  readonly busy: boolean
  readonly since: number
  readonly updatedAt: number
}
export interface StatusOptions {
  position?: 'top-center' | 'top-start' | 'top-end'
  offset?: { top?: number | string }
  hotkey?: string | false
  autoOpen?: boolean
  labels?: GranaLabels
}
export interface Status extends GranaPlugin {
  set(id: StatusId, options: StatusConditionOptions): StatusId | null
  info(id: StatusId, title: string, options?: Omit<StatusConditionOptions, 'title' | 'type'>): StatusId | null
  success(id: StatusId, title: string, options?: Omit<StatusConditionOptions, 'title' | 'type'>): StatusId | null
  warning(id: StatusId, title: string, options?: Omit<StatusConditionOptions, 'title' | 'type'>): StatusId | null
  error(id: StatusId, title: string, options?: Omit<StatusConditionOptions, 'title' | 'type'>): StatusId | null
  update(id: StatusId, patch: Partial<StatusConditionOptions>): boolean
  resolve(id: StatusId, result?: unknown): boolean
  remove(id: StatusId): boolean
  clear(): void
  announce(id: StatusId): boolean
  acknowledge(): void
  open(id?: StatusId, options?: { focus?: boolean }): boolean
  close(): void
  has(id: StatusId): boolean
  get(id: StatusId): StatusCondition | undefined
  configure(patch: StatusOptions): void
  readonly conditions: readonly StatusCondition[]
  readonly state: { readonly form: string; readonly count: number; readonly mobile: boolean }
}

// ---------------------------------------------------------------------------------------------------------------------
// Captura de voz (speech.md §1 a §4, §20 a §32)
// ---------------------------------------------------------------------------------------------------------------------

export type SpeechStatus =
  | 'idle' | 'requesting' | 'ready' | 'listening' | 'speech' | 'transcribing' | 'paused'
  | 'processing' | 'reconnecting' | 'denied' | 'unavailable' | 'error' | 'completed'
export type SpeechMode = 'dictation' | 'conversation'
export type ExpectedSpeakers = 1 | 2 | 'many'
export type SpeechErrorKind =
  | 'permission-denied' | 'no-device' | 'device-busy' | 'device-disconnected' | 'interrupted'
  | 'service-unavailable' | 'processing-failed' | 'storage-full' | 'remote-not-allowed' | 'unsupported'

export interface SpeechError {
  kind: SpeechErrorKind
  capture: 'continues' | 'paused' | 'stopped' | 'none'
  audio: 'none' | 'processing' | 'kept' | 'lost'
  recoverable: boolean
  at: number
  segment?: { id: string; t0: number; t1: number }
}
export interface SpeechIssue {
  kind: SpeechErrorKind
  segmentId: string
  t0: number
  t1: number
  audio: 'none' | 'processing' | 'kept' | 'lost'
  retryable: boolean
}

export type SpeechInput =
  | { format: 'pcm'; sampleRate: number; channels: 1; sampleFormat?: 'f32' | 's16'; chunkMs?: number }
  | { format: 'encoded'; mimeTypes: string[]; timeslice: number }
  | { format: 'self' }

export interface SpeechCapabilities {
  location: 'device' | 'local' | 'remote'
  input: SpeechInput
  partials: boolean
  vad: boolean
  diarization: boolean
  maxSpeakers?: number
  offlineBuffer: boolean
  storesAudio: 'none' | 'memory' | 'disk'
}
export interface SpeechChunk {
  seq: number
  t0: number
  t1: number
  format: 'pcm' | 'encoded'
  mimeType?: string
  data: Float32Array | Int16Array | Blob
  voice: boolean
}
/** Sesión del motor que devuelve `adapter.open()` (§4.3). */
export interface SpeechEngineSession {
  push(chunk: SpeechChunk): unknown
  pause(): unknown
  resume(): unknown
  reconnect?(): Promise<unknown>
  finish(): Promise<{ audioDeleted: boolean }>
  abort(): Promise<{ audioDeleted: boolean }>
  retrySegment?(segmentId: string): unknown
}
/** Interfaz del adaptador que implementa la aplicación (§4.1). Grana no hace red. */
export interface SpeechAdapter {
  readonly id: string
  readonly capabilities: SpeechCapabilities
  check?(): Promise<void>
  open(context: {
    mode: SpeechMode
    expectedSpeakers: ExpectedSpeakers
    language?: string
    signal: AbortSignal
    emit(type: string, payload: object): void
  }): Promise<SpeechEngineSession>
}

export interface SpeechRole {
  id: string
  label: string
}

/** Destino de inserción (§24): ligado al modelo, o `insert` como vía de escape. */
export type SpeechTarget =
  | { id: string; label: string; get(): string; set(value: string): void; field?: string; multiline?: boolean }
  | { id: string; label: string; insert(text: string): unknown }

export interface SpeechOptions {
  adapter: SpeechAdapter
  allowRemote?: boolean
  requireConsent?: boolean
  language?: string
  expectedSpeakers?: ExpectedSpeakers
  hotkey?: string | false
  position?: ToasterPosition
  offset?: { top?: number | string; bottom?: number | string }
  guardUnload?: boolean
  wakeLock?: boolean
  labels?: GranaLabels
  roles?: SpeechRole[]
  speakerColors?: number
  onComplete?: (transcript: TranscriptData) => void
  onDiscard?: (result: { audioDeleted: boolean }) => void
  onError?: (error: SpeechError) => void
}

export interface SpeechState {
  readonly status: SpeechStatus
  readonly sessionId: string | null
  readonly mode: SpeechMode | null
  readonly target: { id: string; label: string } | null
  readonly permission: 'prompt' | 'granted' | 'denied' | 'unknown'
  readonly capture: 'off' | 'live' | 'held'
  readonly voice: 'silence' | 'speech'
  readonly signal: 'ok' | 'flat'
  readonly duration: number
  readonly pending: number
  readonly engine: 'ok' | 'lost' | 'retrying'
  readonly attempt: number
  readonly error: SpeechError | null
  readonly issues: readonly SpeechIssue[]
  readonly transcript: Transcript | null
  readonly result: { audioDeleted: boolean } | null
  readonly consent: boolean
  readonly expectedSpeakers: ExpectedSpeakers
  readonly panelOpen: boolean
  readonly activityHidden: boolean
}

export interface Speech extends GranaPlugin {
  prepare(options?: { expectedSpeakers?: ExpectedSpeakers }): Promise<boolean>
  start(options: { mode: SpeechMode; target?: { id: string; label?: string } }): Promise<boolean>
  begin(): Promise<boolean>
  setConsent(value: boolean): Promise<boolean>
  setExpectedSpeakers(value: ExpectedSpeakers): Promise<boolean>
  pause(): Promise<boolean>
  resume(): Promise<boolean>
  finish(): Promise<boolean>
  discard(): Promise<boolean>
  close(): Promise<boolean>
  cancel(): Promise<boolean>
  openPanel(): Promise<boolean>
  closePanel(): Promise<boolean>
  retrySegment(segmentId: string): Promise<boolean>
  insertPending(fieldId: string): Promise<boolean>
  undoDictation(fieldId: string): Promise<boolean>
  review(): Promise<boolean>
  onLevel(callback: (level: number, live: boolean) => void): () => void
  configure(patch: Partial<SpeechOptions>): void
  readonly state: SpeechState
  readonly capabilities: SpeechCapabilities | null
  readonly targets: {
    register(target: SpeechTarget): () => void
    readonly list: readonly SpeechTarget[]
  }
}

/** Adaptador simulado de `@grana/vue/testing` (speech.md §4.7): el adaptador más sus controles. */
export interface SimulatedSpeechAdapter extends SpeechAdapter {
  setCapabilities(patch: Partial<SpeechCapabilities>): void
  setServiceDown(value: boolean): void
  goOffline(): void
  goOnline(): void
  failNextSegment(options?: { retryable?: boolean }): void
  storageFull(): void
  failFinish(kind?: SpeechErrorKind): void
  confirmDeletion(value: boolean): void
  emit(type: string, payload: object): void
  endCapture(): void
  muteCapture(): void
  freezeCapture(value?: boolean): void
  readonly log: readonly unknown[]
  readonly session: SpeechEngineSession | null
}
export interface SimulatedSpeechAdapterOptions {
  id?: string
  location?: 'device' | 'local' | 'remote'
  input?: SpeechInput
  partials?: boolean
  vad?: boolean
  diarization?: boolean
  offlineBuffer?: boolean
  storesAudio?: 'none' | 'memory' | 'disk'
  maxSpeakers?: number
  latency?: number
  checkDelay?: number
  openDelay?: number
  retryInterval?: number
  maxRetries?: number
  script?: { dictation?: string[]; conversation?: Array<{ speaker: string; text: string }> }
  selfPattern?: { speak?: number[]; silence?: number }
}

// ---------------------------------------------------------------------------------------------------------------------
// Transcript (speech.md §1.4 y §21)
// ---------------------------------------------------------------------------------------------------------------------

export interface TranscriptSpeaker {
  id: string
  role: string | null
  mergedInto: string | null
  origin: 'engine' | 'user'
}
export interface TranscriptSegment {
  id: string
  t0: number
  t1: number
  literal: string
  engineSpeaker: string | null
  corrected: string | null
  speaker: string | null
  removed: boolean
  failed: boolean
}
export interface TranscriptDerived {
  id: string
  kind: string
  at: string
  [key: string]: unknown
}
/** Datos serializables (`toJSON()`, `onComplete`, `createTranscript(data)`). */
export interface TranscriptData {
  id: string
  mode: SpeechMode
  createdAt: string
  expectedSpeakers: ExpectedSpeakers
  speakers: TranscriptSpeaker[]
  segments: TranscriptSegment[]
  derived: TranscriptDerived[]
}
export interface TranscriptStep {
  kind: string
  ids: string[]
  t0: number
}
export interface Transcript {
  readonly id: string
  readonly mode: SpeechMode
  readonly createdAt: string
  readonly expectedSpeakers: ExpectedSpeakers
  readonly speakers: readonly TranscriptSpeaker[]
  readonly segments: readonly TranscriptSegment[]
  readonly partial: { id: string; text: string; speaker: string | null } | null
  readonly derived: readonly TranscriptDerived[]
  segment(id: string): TranscriptSegment | undefined
  textOf(segment: TranscriptSegment | string): string
  speakerOf(segment: TranscriptSegment | string): string | null
  resolve(speakerId: string): string
  letter(speakerId: string): string
  visibleSpeakers(): TranscriptSpeaker[]
  usesOf(segmentId: string): TranscriptDerived[]
  compose(
    source: unknown,
    options?: { withSpeakers?: boolean; withTimes?: boolean; multiline?: boolean; speakerName?: (speakerId: string) => string }
  ): { text: string; ids: string[] }
  readonly canUndo: boolean
  readonly canRedo: boolean
  readonly nextUndo: TranscriptStep | null
  readonly nextRedo: TranscriptStep | null
  onChange(callback: (change: { source: 'user' | 'engine' | 'app'; kind: string; ids: string[] }) => void): () => void
  toJSON(): TranscriptData
  edit(id: string, text: string): 'edited' | 'emptied' | false
  revert(id: string): boolean
  remove(ids: string | string[]): boolean
  restore(ids: string | string[]): boolean
  assignSpeaker(ids: string | string[], speakerId: string | null): boolean
  assignNewSpeaker(ids: string | string[]): string | false
  addSpeaker(): string
  setRole(speakerId: string, roleId: string | null): boolean
  mergeSpeakers(fromId: string, intoId: string): boolean
  unmerge(speakerId: string): boolean
  undo(): TranscriptStep | null
  redo(): TranscriptStep | null
  addDerived(entry: { kind: string; [key: string]: unknown }): TranscriptDerived | false
  removeDerived(id: string): boolean
}

// ---------------------------------------------------------------------------------------------------------------------
// Claves de inyección
// ---------------------------------------------------------------------------------------------------------------------

export type ToasterKey = InjectionKey<Toaster>
export type StatusKey = InjectionKey<Status>
export type SpeechKey = InjectionKey<Speech>

// ---------------------------------------------------------------------------------------------------------------------
// GTag + GTagGroup (design/contracts/tag.md, #462, #463, #468)
// ---------------------------------------------------------------------------------------------------------------------

/** Texto de `labels`: cadena con `{marcas}` o función que recibe las mismas variables. */
export type TagText<V extends object = {}> = string | ((vars: V) => string)

/** Textos de `GTag` (sin valores por defecto, #226). */
export interface TagLabels {
  remove?: TagText<{ label: string }>
}

/** Textos de `GTagGroup` (tag.md §«Textos», #468). */
export interface TagGroupLabels {
  remove?: TagText<{ label: string }>
  removeIn?: TagText<{ label: string; facet: string }>
  removed?: TagText<{ label: string }>
  removedIn?: TagText<{ label: string; facet: string }>
  undo?: TagText<{ label: string }>
  undoIn?: TagText<{ label: string; facet: string }>
  restored?: TagText<{ label: string }>
  more?: TagText<{ count: number }>
  less?: TagText
  clearAll?: TagText
  cleared?: TagText<{ count: number }>
  undoAll?: TagText<{ count: number }>
  restoredAll?: TagText<{ count: number }>
  empty?: TagText
}

/** Etiqueta de `GTagGroup` (tag.md «TagItem»). Los campos de más se conservan y llegan a los eventos y slots. */
export interface TagItem extends GranaExtra {
  /** Obligatorio y único en el grupo: la huella, el foco y el deshacer se apoyan en él. */
  id: GranaKey
  label: string
  href?: string
  /** Presente (`true`/`false`) = etiqueta de alternar. */
  pressed?: boolean
  removable?: boolean
  disabled?: boolean
  color?: 'neutral' | GranaCategory | `${GranaCategory}`
  colorKey?: string | number
  /** Nombre visible de la faceta: agrupa con `layout="facets"` y es parte de la clave del color. */
  facet?: string
  /** Nombre de Lucide (registro de la aplicación → librería). */
  icon?: IconName
  /** `true` = `GAvatar` con `name = label`; objeto = sus props (`size` y `label` se ignoran). Gana a `icon`. */
  avatar?: boolean | AvatarSpec
}

/** A dónde va el foco si el grupo se queda sin controles (`GTagGroup.emptyFocus`). */
export type TagEmptyFocusTarget = string | Element | { $el: Element } | null | undefined
export type TagEmptyFocus = TagEmptyFocusTarget | (() => TagEmptyFocusTarget)
