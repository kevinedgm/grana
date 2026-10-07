// API de la entrada `@grana/vue/status` que no son componentes (dueño: bruno). status.md.
import type { InjectionKey } from 'vue'
import type { Status, StatusOptions } from '../shared.js'

/** Crea el gestor de la isla de estado; es plugin: `app.use(status)` lo provee y registra sus componentes. */
export declare function createStatus(options?: StatusOptions): Status
/** Inyecta el gestor provisto; sin gestor o fuera de `setup`, `undefined`. */
export declare function useStatus(): Status | undefined
export declare const statusKey: InjectionKey<Status>
