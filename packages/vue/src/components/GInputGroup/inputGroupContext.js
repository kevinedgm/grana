// Contexto interno de GInputGroup con sus partes (dueño: bruno). Contrato: design/contracts/form.md §13.
import { computed, inject, onBeforeUnmount, unref, useId } from 'vue'
import { useFormField } from '../GForm/formContext.js'

export const inputGroupKey = Symbol('GInputGroup')

/** Contexto del GInputGroup que contiene a la parte, o null (la parte avisa y pinta solo su control nativo). */
export function useInputGroup(part) {
  const ctx = inject(inputGroupKey, null)
  if (!ctx && typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
    console.warn(`[Grana GInputGroup] ${part} fuera de un GInputGroup: se pinta solo el control nativo (sin etiqueta ni caja).`)
  }
  return ctx
}

/**
 * Lógica común de una parte que es control (GInputGroupInput, GInputGroupSelect): id, nombre accesible, descripción,
 * obligatorio heredado, estado inválido (de la parte, o de todas con un error del grupo) y registro (form.md §13).
 */
export function useInputGroupPart(component, kind, props, refs) {
  const ctx = useInputGroup(component)
  const uid = useId()
  const controlId = computed(() => props.id || `g-input-group-part-${uid}`)
  const nameId = computed(() => `${controlId.value}-name`)
  // `required` explícito en la parte gana; si no, el del grupo
  const required = computed(() => props.required ?? Boolean(unref(ctx?.required)))
  const ff = useFormField({
    id: controlId,
    name: () => props.name,
    error: () => props.error,
    required,
    trigger: kind === 'select' ? 'change' : 'blur',
    control: refs.control,
    root: () => unref(ctx?.root) || unref(refs.part)
  })
  if (ctx) {
    const off = ctx.register({
      uid,
      kind,
      el: () => unref(refs.part),
      controlId: () => controlId.value,
      principal: () => Boolean(props.principal),
      partLabel: () => props.partLabel,
      descId: () => null
    })
    onBeforeUnmount(off)
  }
  const isPrincipal = computed(() => Boolean(ctx) && unref(ctx.principalId) === controlId.value)
  const hasName = computed(() => Boolean(ctx && props.partLabel))
  // Nombre = etiqueta visible + nombre de la parte (2.5.3); la principal sin partLabel, por el <label for>
  const labelledBy = computed(() => {
    if (!ctx) return undefined
    if (props.partLabel) return `${unref(ctx.labelId)} ${nameId.value}`
    return isPrincipal.value ? undefined : unref(ctx.labelId)
  })
  const invalid = computed(() => ff.invalid.value || Boolean(unref(ctx?.groupInvalid)))
  const describedBy = (own) => [own, ctx ? unref(ctx.describedBy) : undefined].filter(Boolean).join(' ') || undefined
  return { ctx, ff, controlId, nameId, required, hasName, labelledBy, invalid, describedBy }
}
