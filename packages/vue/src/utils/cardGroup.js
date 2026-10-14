// Contexto de GCardGroup (interno; dueño: bruno). design/contracts/card-group.md «Tarjetas hijas», DECISIONS.md #605.
// Solo la clave: vive en el paquete principal porque la lee GCard (que sigue en `@grana/vue`) y llega a la entrada
// `@grana/vue/card-group` por `__shared` (#610). Una copia en la entrada crearía otro Symbol y la tarjeta no vería su grupo.
// No se exporta como API pública.
export const cardGroupKey = Symbol('g-card-group')
