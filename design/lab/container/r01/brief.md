# Brief — contenedor de página (`GContainer`, nombre de trabajo), r01: base funcional y tres conceptos

> kiwi, 2026-10-14. Origen: propuesta del usuario (`nn-container`, primitiva estructural de tres niveles: *Page Layout* → *Container* → primitivas de distribución y componentes). Componente nuevo: base funcional (HTML, WCAG 2.2) **y** tres conceptos divergentes (A/B/C) con los tokens reales del tema por defecto (`packages/vue/dist/grana.css`). Prototipo: `index.html?c=base|A|B|C`.

## Para qué

Poner los **límites** del contenido de una página: cuánto ancho ocupa, dónde se centra, cuánto aire deja contra el borde y qué elemento es (`main`, `section`, `article`). No reparte, no apila ni hace columnas. Lo usa quien monta una página de una aplicación administrativa: formulario, configuración, detalle con tabla, tablero; en escritorio con barra lateral, en tableta y en teléfono, con zoom y con lector de pantalla.

## El problema de lo que hay (en Grana y fuera)

- **Grana no tiene nada que fije el ancho de la página.** Cada página de prueba (`ph.css`, el playground) escribe su `max-inline-size: 64rem` y su `padding: 24px`; NisaNabani igual. Los componentes miden **su propia caja** (#130, `GCard`, `GPageHeader`, `GSidebar`), pero nadie pone esa caja.
- **El contenedor de los frameworks es una caja con `max-width` y `padding` por punto de corte del visor.** Tres fallos conocidos:
  1. **Mide el visor, no su sitio.** Con una barra lateral de 264 px, el punto de corte «lg» del visor dice que hay 1024 px y hay 760. El relleno y el ancho saltan en puntos que no tienen que ver con el contenido.
  2. **El ancho completo rompe la caja.** Para una banda de borde a borde hay que cerrar el contenedor, abrir otro de ancho completo y volver a abrir el primero («emparedado»), o usar `100vw` (que mete la banda bajo la barra lateral y crea desplazamiento horizontal por la barra de desplazamiento). El emparedado además corta el pegado de un encabezado `sticky` en el primer tramo.
  3. **El relleno se acumula.** Un contenedor dentro de otro, o dentro de una superficie con relleno propio (`GSurface`, `GCard`, `GDialog`), suma su relleno y la columna se estrecha sin que nadie lo pida.
- **La API típica se contradice:** `size` + `fluid` + `width` + `centered` admite combinaciones sin sentido (`size="md" fluid`, `centered` sin límite, `width` que pisa a `size`).

## Qué es esta ronda

1. **Base funcional** (forma convencional a propósito, con neutros del tema): raíz con el elemento pedido, ancho máximo por escala o ancho completo, relleno fluido medido sobre **su propia caja** (unidades de contenedor, sin JS ni puntos de corte del visor), anidado sin relleno acumulado, semántica (`main` único), RTL, zoom al 400 %. Las bandas de ancho completo, por composición (el emparedado), para medir su coste.
2. **Tres conceptos**, cada uno con una premisa distinta: **A · Medida** (el ancho lo decide lo que se lee: la prosa se queda en su medida de caracteres y lo ancho usa toda la columna), **B · Sangrado alineado** (no hay «modo ancho completo»: un hijo pide llegar al borde y su contenido sigue alineado con la columna), **C · Medida a la mano** (el lector ajusta el ancho de lectura con un asa en el margen, WCAG 1.4.8).
3. **Comparativa, recomendación y una pregunta de elección.**

## Solapes revisados antes de proponer

| Pieza | Qué comparte | Decisión |
| --- | --- | --- |
| `GAdaptiveLayout` (#339 a #365) | «Layout» | **Frontera:** `GAdaptiveLayout` **reparte** hijos en líneas por sus necesidades; el contenedor **no reparte**: da la caja dentro de la que se reparte. Va dentro, nunca al revés |
| `GFormLayout` + `GFormRow` (#171, #361) | Ancho de un formulario | Las filas **siempre llenan el ancho** (#171): el contenedor (`width="sm"`) es lo que da al formulario su ancho máximo. Sin cambio en el formulario |
| `GSurface` (+ `zone="brand"`, #620 a #625) | Relleno, fondo | El contenedor **no tiene superficie** (sin fondo, borde, radio, sombra ni `padding` de bloque). La zona de marca va con el atributo público `data-g-zone="brand"` en la raíz o en una banda (api.md §«Zona de marca»): **sin prop `zone` propia**. Dentro de una superficie, el contenedor no añade margen lateral (anidado) |
| `GPageHeader` (#626 a #635) | Ancho del encabezado, banda de marca, pegado | Va **dentro** del contenedor, primer hijo. Su relleno lateral propio (`space × 6`) se suma al margen del contenedor: hallazgo para lima (L4). El pegado necesita que su padre sea largo: el emparedado lo rompe, B no |
| `GDivider` (`--g-divider-inset`, #191 a #195) | «Inset» | Otra cosa: acorta una línea dentro de una anfitriona. El contenedor **no** lo redefine. Una línea de borde a borde de la página es un `GDivider` con el sangrado de B |
| `GCard` (`--g-surface-padding`, #131) | Regiones «a sangre» | **Precedente directo** de B: la tarjeta publica su relleno resuelto para que la media sangre; el contenedor publica su margen resuelto para que una banda sangre |
| `GSidebar` (`--g-sidebar-width`, `-rail`) | Ancho disponible | La aplicación reserva el sitio de la barra; el contenedor **mide su caja**, así que se adapta al expandir o plegar la barra sin saber que existe |
| `edgeReserve.js` | Bordes de la pantalla | Nada: el contenedor es estático y no ocupa bordes del visor |
| Tokens (`tokens.md` §4, §7, §13, §19, §22, §45) | Espaciado, anchos | **No hay tokens de ancho ni puntos de corte.** Los márgenes salen de `--g-space-*`; los anchos, de múltiplos de `space` (como los umbrales de #130 y §13) y de `ch` para la medida de lectura. **Ningún token del tema nuevo** (L2) |
| Stack, Grid, Flex | Distribución | **No existen** en Grana. Fuera de esta ronda; siguiente paso anotado en la declaración |
