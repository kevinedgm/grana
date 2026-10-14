// Claves de contexto de GDialog para los niveles anidados (interno; dueño: bruno). Contrato: design/contracts/dialog.md
// §«Niveles anidados» (B, pasos; C, pliegues) y form.md §15 (DECISIONS.md #584, #588). Solo `useDialogSteps` es API pública.
import { inject } from 'vue'

/**
 * Pasos de un GDialog (interna): la provee GDialog para sus GDialogStep y para `useDialogSteps()`.
 * { rootId, registerStep(record) → off, isStep(name), history (ComputedRef<string[]>), current, depth, push, back, backTo,
 *   isEntering(name), stepTitleId(name), stepDescId(name), scope }
 */
export const dialogStepsKey = Symbol('GDialogSteps')

/**
 * Pliegues abiertos dentro de un GDialog (interna; base 5 de dialog.md: con uno abierto el fondo no cierra). La provee
 * GDialog: { register() → off }. Un GFormFold abierto se registra en el diálogo más cercano; llega a la entrada
 * `@grana/vue/form-fold` por `__shared` (una copia crearía otro Symbol).
 */
export const dialogFoldKey = Symbol('GDialogFolds')

/** El motor completo (interno, para GDialogStep). */
export const useDialogStepsApi = () => inject(dialogStepsKey, null)

/**
 * Pasos del GDialog más cercano (dialog.md §B, #584): `{ steps, current, depth, push, back, backTo }` (`steps`, `current`
 * y `depth`, refs de solo lectura). Dentro del contenido de un GDialog; fuera, `null`.
 */
export function useDialogSteps() {
  const api = inject(dialogStepsKey, null)
  if (!api) return null
  return { steps: api.history, current: api.current, depth: api.depth, push: api.push, back: api.back, backTo: api.backTo }
}
