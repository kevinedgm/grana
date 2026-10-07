// API de la entrada `@grana/vue` que no son componentes (dueño: bruno). Los componentes los genera
// scripts/build-types.mjs desde los *.meta.json; este fragmento se copia a dist/types/api/grana.d.ts.
import type { App, InjectionKey } from 'vue'
import type { FormField, FormFieldOptions, IconsPlugin, SummaryDiff, SummaryDiffItem, Toaster, ToasterOptions } from '../shared.js'

/** Composable para campos (los de Grana y los propios) dentro de `GForm` (form.md §2). */
export declare function useFormField(options?: FormFieldOptions): FormField
/** Clave del contexto de `GForm`, para `provide` manual. */
export declare const formKey: InjectionKey<unknown>

/** Crea el gestor de avisos de la aplicación; es plugin (`app.use(toaster)`). */
export declare function createToaster(options?: ToasterOptions): Toaster
/** Inyecta el gestor provisto; sin gestor o fuera de `setup`, `undefined` (y aviso en desarrollo). */
export declare function useToast(): Toaster | undefined
export declare const toasterKey: InjectionKey<Toaster>

/** Registro de iconos de la aplicación con cadenas SVG de `lucide-static` (icons.md §5). */
export declare function createIcons(icons: string[]): IconsPlugin
export declare const iconsKey: InjectionKey<unknown>

/** Contraste entre homónimos de una lista de fichas (summary.md, #354): `null` si la ficha no tiene homónimos. */
export declare function summaryDiff(list: SummaryDiffItem[]): Array<SummaryDiff | null>

/** Registra todos los componentes del paquete principal. */
export declare function install(app: App): void

/** @internal Piezas que comparten las entradas secundarias. No es API pública: puede cambiar sin aviso. */
export declare const __shared: Record<string, Record<string, unknown>>

declare const Grana: { install(app: App): void }
export default Grana
