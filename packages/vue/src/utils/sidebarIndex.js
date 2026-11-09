// Clave interna de la apariencia `index`, los grupos plegables y la marca de GSidebar (dueño: bruno). NO es API pública.
// sidebar.md §«Apariencia `index`» «Extensión y conexión», DECISIONS.md #1069: el motor viaja en `@grana/vue/sidebar-index`,
// cuyo plugin hace `app.provide(sidebarIndexKey, createSidebarIndex)`; GSidebar lo inyecta. La entrada recibe este mismo
// Symbol por `__shared` (src/shared.js).
export const sidebarIndexKey = Symbol('grana-sidebar-index')
