// API de la entrada `@grana/vue/app-shell` que no son componentes (dueño: bruno). app-shell.md «Paquete y peso», #716.
import type { App } from 'vue'

/** Registra `<g-app-shell>` si no lo estaba. */
export declare function install(app: App): void
declare const AppShell: { install(app: App): void }
export default AppShell
