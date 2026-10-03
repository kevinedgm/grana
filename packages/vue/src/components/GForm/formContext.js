// Contexto del sistema de formularios y useFormField() (dueño: bruno)
// Contrato: design/contracts/form.md §1 y §2 (DECISIONS.md #157, #158). Ningún campo importa GForm: leen estas claves
// SOLO si existen; fuera de GForm cada campo resuelve los valores de siempre. La prop explícita del campo siempre gana.
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, shallowReactive, toValue, unref, useId, watch } from 'vue'

/** InjectionKey pública del contexto de GForm (para `provide` manual: pruebas, microfrontends). */
export const formKey = Symbol('GForm')
// Sub‑contextos internos
export const layoutKey = Symbol('GFormLayout') // GFormLayout, GFormRow, GFieldGroup y GInputGroup: block, density, stack, readonly, disabled
// GFormSection (form.md §2 y §3, #286, #288): { optional, register(entry) → unregister, notifyEdit() }. `optional` suprime
// «(opcional)»; `register` cuenta los errores visibles de la sección (la sección lo propaga a sus ancestros); `notifyEdit`
// marca la sección como editada (confirmación de «Quitar»)
export const sectionKey = Symbol('GFormSection')
export const fieldGroupKey = Symbol('GFieldGroup') // partes de un GFieldGroup
// GFormReveal y GFormSection addable (form.md §2 «Registro inactivo», §14, #276, #288): { active: ComputedRef<boolean>,
// fromReveal: boolean }. `active` = estado propio y el del ancestro; `fromReveal` = lo provee un GFormReveal o ya lo tenía el
// ancestro (una sección agregable hereda el del ancestro). Interna: NO se exporta desde src/index.js
export const revealKey = Symbol('GFormReveal')

export const isDev = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production'

// Iconos del mensaje (C6, icons.md): error circle-alert, advertencia triangle-alert, válido circle-check
const ICONS = { error: 'circle-alert', warning: 'triangle-alert', valid: 'circle-check' }
export const messageIcon = (type) => ICONS[type]

/** Ejecuta `fn` en el cuadro siguiente (requestAnimationFrame, o un temporizador donde no exista). */
export function nextFrame(fn) {
  if (typeof requestAnimationFrame === 'function') return requestAnimationFrame(() => fn())
  return setTimeout(fn, 16)
}

/** Unidad de espacio (--g-space-1) en px, leída del estilo calculado; 4 si no se puede medir (jsdom, SSR). */
export function spaceUnit(el) {
  if (!el || typeof getComputedStyle !== 'function') return 4
  const v = getComputedStyle(el).getPropertyValue('--g-space-1').trim()
  const n = parseFloat(v)
  if (!n) return 4
  return /rem$/.test(v) ? n * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) : n
}

/** Orden del documento entre dos elementos (para ordenar registros). */
export function byDocument(a, b) {
  if (!a || !b || a === b || typeof a.compareDocumentPosition !== 'function') return 0
  return a.compareDocumentPosition(b) & 4 /* FOLLOWING */ ? -1 : 1
}

/**
 * Petición interna «abrir antes de enfocar» (form.md §3, #287). Evento DOM que burbuja y se puede cancelar: cada
 * GFormSection collapsible lo escucha en su __panel; si está plegada, se abre sin animar y lo cancela («he cambiado:
 * espera un parche»). Nombre reservado: NO se exporta desde src/index.js.
 */
export const OPEN_REQUEST = 'g-open-request'

/** Despacha OPEN_REQUEST desde `el`. Devuelve true si alguien lo canceló (algo se abrió y hay que esperar un parche). */
export function requestOpen(el) {
  if (!el || typeof el.dispatchEvent !== 'function' || typeof CustomEvent === 'undefined') return false
  const event = new CustomEvent(OPEN_REQUEST, { bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  return event.defaultPrevented
}

/**
 * Desplaza la raíz de un campo para que se vea su etiqueta y enfoca el control sin otro desplazamiento (GOV.UK).
 * Antes despacha OPEN_REQUEST desde el control: si una sección plegada se abrió, espera un nextTick (Vue quita `inert` y
 * aplica la altura sin transición) y entonces desplaza y enfoca; si no, todo ocurre en el acto, como siempre.
 * Devuelve una Promise que se resuelve con el foco ya puesto.
 */
export function revealAndFocus(control, root) {
  if (!control) return Promise.resolve()
  const go = () => {
    const box = root || control
    if (typeof box.scrollIntoView === 'function') box.scrollIntoView({ block: 'start', behavior: 'instant' })
    if (typeof control.focus === 'function') control.focus({ preventScroll: true })
  }
  if (!requestOpen(control)) {
    go()
    return Promise.resolve()
  }
  return nextTick().then(go)
}

/**
 * Composable para campos (los de Grana y los del consumidor). Cada opción admite valor, `ref` o getter.
 * Opciones públicas: name, id, error, warning, valid, required, readonly, disabled, density, block, mark, trigger, control, root.
 * Opciones internas (campos de Grana): markRule ('both' | 'required' | 'none'), role ('field' | 'group'), register (false: no se registra).
 */
export function useFormField(options = {}) {
  const form = inject(formKey, null)
  const layout = inject(layoutKey, null)
  const section = inject(sectionKey, null)
  const reveal = inject(revealKey, null)
  const role = options.role || 'field'
  const group = role === 'group' ? null : inject(fieldGroupKey, null)
  // Dentro de un GFormReveal inactivo (when falso en él o en un ancestro) el campo sigue registrado pero no cuenta (#276)
  const inactive = computed(() => (reveal ? !unref(reveal.active) : false))
  const o = (k) => toValue(options[k])
  const uid = useId()

  const id = computed(() => o('id') || `g-field-${uid}`)
  const messageId = computed(() => `${id.value}-message`)
  const name = computed(() => o('name') || undefined)

  // Precedencia (§2): prop explícita › sub‑contexto (rejilla, grupo) › GForm › default de siempre
  const density = computed(() => o('density') ?? unref(layout?.density) ?? unref(form?.density) ?? 'default')
  const readonly = computed(() => o('readonly') ?? unref(layout?.readonly) ?? unref(form?.readonly) ?? false)
  const disabled = computed(() => o('disabled') ?? unref(layout?.disabled) ?? unref(form?.disabled) ?? false)
  const block = computed(() => o('block') ?? unref(layout?.block) ?? false)

  // Mensajes: explícito (incluida la cadena vacía) › errors/warnings de GForm, solo si el campo está revelado
  const fromForm = (kind) => (form && name.value && typeof form.visible === 'function' ? form.visible(name.value, kind) : '')
  const pick = (key, kind) => {
    const v = o(key)
    if (v !== undefined && v !== null) return String(v)
    return kind ? fromForm(kind) : ''
  }
  const errorText = computed(() => pick('error', 'error'))
  const warningText = computed(() => pick('warning', 'warning'))
  const validText = computed(() => pick('valid', null))

  const prefixFor = (type) => {
    if (!form) return undefined
    const p = unref(form.labels)?.[type]
    if (!p && isDev && typeof form.warnOnce === 'function') form.warnOnce(`label-${type}`, `falta labels.${type}: el mensaje de tipo «${type}» va sin prefijo oculto.`)
    return p || undefined
  }
  const ownMessage = computed(() => {
    const type = errorText.value ? 'error' : warningText.value ? 'warning' : validText.value ? 'valid' : null
    if (!type) return null
    const text = type === 'error' ? errorText.value : type === 'warning' ? warningText.value : validText.value
    return { type, text, prefix: prefixFor(type) }
  })
  // Las partes de un GFieldGroup no pintan texto (el mensaje es del grupo), pero conservan aria-invalid y su borde
  const message = computed(() => (group ? null : ownMessage.value))
  const invalid = computed(() => ownMessage.value?.type === 'error')
  const live = computed(() => unref(form?.live) ?? 'polite')

  // Marcas (§2, #153)
  const markRule = options.markRule || 'both'
  const markFor = (required) => {
    if (markRule === 'none') return null
    if (!form) return required ? 'required' : null // fuera de GForm: el asterisco de siempre
    if (readonly.value || disabled.value) return null // solo campos editables
    const marks = unref(form.marks) || 'optional'
    if (marks === 'required') return required ? 'required' : null
    if (required || markRule === 'required' || unref(section?.optional)) return null
    return 'optional'
  }
  const mark = computed(() => {
    if (o('mark') === false) return null
    const required = Boolean(o('required'))
    // Una parte lleva marca solo si difiere de la del grupo (la extensión opcional de un teléfono obligatorio)
    if (group && required === Boolean(unref(group.required))) return null
    return markFor(required)
  })
  const markText = computed(() => {
    if (mark.value !== 'optional') return undefined
    const t = unref(form?.labels)?.optional
    if (!t && isDev && typeof form?.warnOnce === 'function') form.warnOnce('label-optional', 'falta labels.optional: los campos opcionales van sin marca.')
    return t || undefined
  })

  // Manejadores del contexto: se fusionan PRIMERO (mergeProps(handlers, propios, attrs))
  const trigger = () => o('trigger') || 'blur'
  const names = () => [name.value, unref(group?.name)].filter(Boolean)
  const handlers = {
    onInput: () => { if (form) for (const n of names()) form.notifyInput?.(n) },
    onChange: () => {
      if (!form) return
      const ns = names()
      if (!ns.length) form.notifyChange?.(null, false)
      for (const n of ns) form.notifyChange?.(n, trigger() === 'change')
    },
    onFocusout: () => { if (form) for (const n of names()) form.notifyBlur?.(n) }
  }
  /** Para controles sin evento nativo (GSelect, GDatePicker, propios): marca sucio y, con trigger 'change', revela. */
  function notifyChange() {
    // La sección más cercana queda editada (confirmación de «Quitar» en addable, #288); también fuera de GForm
    if (section && typeof section.notifyEdit === 'function') section.notifyEdit()
    if (!form) return
    const ns = names()
    if (!ns.length) form.notifyChange?.(null, false)
    for (const n of ns) form.notifyChange?.(n, trigger() === 'change')
  }

  const el = (k) => {
    const v = toValue(options[k])
    return v && v.$el ? v.$el : v || null
  }
  const explicitError = () => {
    const v = o('error')
    return v === undefined || v === null ? undefined : String(v)
  }

  // Registro en GForm (con name) y en el GFieldGroup que lo contiene (siempre)
  if (role !== 'group' && options.register !== false) {
    const entry = {
      uid,
      role: 'field',
      inGroup: Boolean(group),
      name: () => name.value,
      names: () => (name.value ? [name.value] : []),
      control: () => el('control'),
      root: () => el('root'),
      required: () => Boolean(o('required')),
      disabled: () => disabled.value,
      inactive: () => inactive.value,
      explicitError,
      ownMessage: () => ownMessage.value,
      invalid: () => invalid.value,
      blocking(errors) {
        const e = explicitError()
        const msg = e !== undefined ? e : (name.value && errors ? errors[name.value] : '')
        return msg ? { name: name.value ?? null, message: String(msg), id: el('control')?.id || null } : null
      },
      visibleTarget: () => (invalid.value ? { control: el('control'), root: el('root') } : null)
    }
    let offForm = null
    let offSection = null
    let offGroup = null
    // En GForm y, con la misma condición y en el mismo momento, en la sección más cercana (recuento de errores, #286)
    const bind = () => {
      offForm?.()
      offSection?.()
      offForm = form && typeof form.register === 'function' && name.value ? form.register(entry) : null
      offSection = offForm && section && typeof section.register === 'function' ? section.register(entry) : null
    }
    onMounted(() => {
      bind()
      if (group && typeof group.registerPart === 'function') offGroup = group.registerPart(entry)
    })
    watch(name, (n, prev) => { if (n !== prev) bind() })
    onBeforeUnmount(() => {
      offForm?.()
      offSection?.()
      offGroup?.()
    })
  }

  return {
    id,
    messageId,
    inForm: Boolean(form),
    density,
    readonly,
    disabled,
    block,
    mark,
    markText,
    message,
    ownMessage,
    invalid,
    live,
    handlers,
    notifyChange,
    // internos
    form,
    group,
    explicitError,
    inactive
  }
}

/**
 * Campo compuesto (GFieldGroup, GInputGroup): registra sus partes, decide UN mensaje (el del grupo o el primero de
 * sus partes en orden del DOM) y se registra en GForm como un solo elemento del resumen (form.md §5 y §13).
 * Uso interno. `ff` es el resultado de useFormField({ role: 'group', … }) del propio campo.
 * @param {{ ff: object, name: () => string|undefined, required: () => boolean, root: import('vue').Ref,
 *           sortKey?: (part) => Element, fallback?: (parts) => object }} o
 */
export function useCompositeField(o) {
  const uid = useId()
  const section = inject(sectionKey, null)
  const parts = shallowReactive(new Map())
  const keyOf = o.sortKey || ((p) => p.root() || p.control())
  const sortedParts = () => [...parts.values()].sort((a, b) => byDocument(keyOf(a), keyOf(b)))
  provide(fieldGroupKey, {
    token: Symbol('part-of'),
    required: computed(() => Boolean(o.required())),
    name: computed(() => o.name()),
    registerPart(entry) {
      parts.set(entry.uid, entry)
      return () => { if (parts.get(entry.uid) === entry) parts.delete(entry.uid) }
    }
  })
  const ff = o.ff
  // Un solo mensaje (prioridad error › advertencia › válido)
  const message = computed(() => {
    const list = [ff.ownMessage.value, ...sortedParts().filter((p) => !p.disabled()).map((p) => p.ownMessage())].filter(Boolean)
    return list.find((m) => m.type === 'error') || list.find((m) => m.type === 'warning') || list.find((m) => m.type === 'valid') || null
  })
  const fallback = o.fallback || ((ps) => ps[0])

  let off = null
  let offSection = null
  onMounted(() => {
    const form = ff.form
    if (!form || typeof form.register !== 'function') return
    const enabledParts = () => sortedParts().filter((p) => !p.disabled())
    const entry = {
      uid: `group-${uid}`,
      role: 'group',
      inGroup: false,
      names: () => [o.name(), ...sortedParts().map((p) => p.name())].filter(Boolean),
      control: () => fallback(enabledParts())?.control() || null,
      root: () => unref(o.root),
      disabled: () => ff.disabled.value,
      inactive: () => Boolean(ff.inactive?.value),
      blocking(errors) {
        const ps = enabledParts()
        const own = ff.explicitError()
        const groupName = o.name()
        const ownMsg = own !== undefined ? own : (groupName && errors ? errors[groupName] : '')
        const firstInvalid = (map) => ps.find((p) => {
          const e = p.explicitError()
          return e !== undefined ? Boolean(e) : Boolean(p.name() && map && map[p.name()])
        })
        if (ownMsg) {
          const target = firstInvalid(errors) || fallback(ps)
          return { name: groupName ?? target?.name() ?? null, message: String(ownMsg), id: target?.control()?.id || null }
        }
        const p = firstInvalid(errors)
        if (!p) return null
        const e = p.explicitError()
        return { name: groupName ?? p.name() ?? null, message: String(e !== undefined ? e : errors[p.name()]), id: p.control()?.id || null }
      },
      visibleTarget() {
        const ps = enabledParts()
        const p = ps.find((x) => x.invalid())
        if (p) return { control: p.control(), root: unref(o.root) }
        const f = fallback(ps)
        if (ff.ownMessage.value?.type === 'error' && f) return { control: f.control(), root: unref(o.root) }
        return null
      }
    }
    off = form.register(entry)
    // Una pregunta también en la sección más cercana (recuento de errores, #286)
    if (section && typeof section.register === 'function') offSection = section.register(entry)
  })
  onBeforeUnmount(() => {
    off?.()
    offSection?.()
  })
  return { parts, sortedParts, message }
}
