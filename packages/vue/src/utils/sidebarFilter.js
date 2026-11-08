// Clave interna del filtro del índice de GSidebar (dueño: bruno). NO es API pública. sidebar.md §«Filtro del índice»
// «Extensión y conexión», DECISIONS.md #1050: el motor viaja en la entrada `@grana/vue/sidebar-filter`, cuyo plugin hace
// `app.provide(sidebarFilterKey, createSidebarFilter)`; GSidebar lo inyecta. La entrada recibe este mismo Symbol por
// `__shared` (src/shared.js): una copia propia crearía otro y el sidebar no vería el motor.
export const sidebarFilterKey = Symbol('grana-sidebar-filter')
