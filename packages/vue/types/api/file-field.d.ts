// API de la entrada `@grana/vue/file-field` que no son componentes (dueño: bruno). file-field.md «Entrega y empaquetado».
import type { App } from 'vue'

/** Tamaño legible con `Intl` (unidades decimales; una cifra decimal por debajo de 10). */
export declare function formatFileSize(bytes: number, locale?: string): string
/** Registra `<g-file-field>` si no lo estaba. */
export declare function install(app: App): void
declare const FileField: { install(app: App): void }
export default FileField
