// Clave interna de la forma `list` de GPageIndex (dueño: bruno). NO es API pública. page-index.md «Extensión
// `@grana/vue/page-index-list`», DECISIONS.md #1054: la forma viaja en la extensión, cuyo plugin hace
// `app.provide(pageIndexListKey, GPageIndexList)`; GPageIndex (entrada `@grana/vue/page-index`) la inyecta. Las dos
// entradas reciben este mismo Symbol por `__shared` (src/shared.js): una copia crearía otro y el índice no vería su forma.
export const pageIndexListKey = Symbol('grana-page-index-list')
