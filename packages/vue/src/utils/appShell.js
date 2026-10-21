// Canal interno del chasis de aplicación (dueño: bruno). app-shell.md «B · Relevo de franja» (S6) y DECISIONS.md #710.
// No es API pública: GAppShell lo provee y GPageHeader lo inyecta. Vive en el paquete principal y llega a las entradas
// `@grana/vue/app-shell` y `@grana/vue/page-header` por `__shared` (src/shared.js): dos copias serían dos claves y el
// encabezado no vería su chasis.
//   top:      Readonly<Ref<number>> · px que la cabecera ocupa arriba en su SITIO FINAL (0 sin cabecera, despegada por el
//             presupuesto o cedida en B), nunca el valor a mitad de transición.
//   notify(): el encabezado lo llama cuando cambia su is-sticky (o su is-stuck), para que el chasis recalcule su cifra.
export const appShellKey = Symbol('g-app-shell')
