# Changelog

Todos los cambios notables de Grana se documentan en este archivo.

El formato sigue [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto adopta [Versionado Semántico](https://semver.org/lang/es/). Mientras la versión sea `0.x`, **la API puede cambiar entre versiones**.

Los números `#NNN` remiten a [`DECISIONS.md`](DECISIONS.md), el registro de decisiones con su porqué.

## [Sin publicar]

Fase C del plan de v1: seis componentes nuevos, la carga común y varias reglas compartidas. Todo en estado `candidate` (contrato, CSS, pruebas, `meta.json`, README y auditoría de coco sobre el componente real sin defectos bloqueantes). Sin versión nueva todavía: sigue siendo `0.1.0-beta.0`, sin publicar.

### Añadido

#### Componentes nuevos

- **`@grana/blocks/booking` · parte A (#860 a #877, `draft`):** entrada nueva con `Search` (La frase, La barra, La que acompaña), `Offer list` (Tarjetas, Renglones, Rejilla compacta), `Guest form` (Una página, Por pasos, Con lo pedido a la vista) y `Confirmation` (Tarjeta, Lo que sigue, Captura); la consulta (`BookingQuery`) es el hilo y todas la dicen con **`describeQuery`**, exportada desde `@grana/vue/booking` (#862). Tipos de Booking a mano (`types/booking.d.ts`) y generador de tipos por familia (`scripts/section-types.mjs`). `Testimonial.source` pasa a obligatoria en el tipo (#865).
- **`@grana/blocks/booking` · parte C (#860 a #877, `draft`):** `Booking summary` (Tarjeta, El recibo, Línea: lo pedido con la frase de la consulta, el total que da el lugar con la cuenta de `GPrice` y la garantía en la descripción de la acción principal, #871), `Menu` (Carta, Por tiempos, Platos con foto: la carta como `dl` dentro de `GText` (#863), la moneda una vez con `GPriceScope`, los avisos en `GTag` neutras y el idioma del nombre del plato, #875) y `Availability` (Calendario con precio, Próximas fechas, Calendario + resumen: `GDatePicker inline` con el precio del día pintado y oído en su nombre, `dayDescription`, y el día lleno como salida de una estancia, #870).
- **`@grana/blocks/booking` · parte B (#860 a #877, `draft`):** `Itinerary` (Lista con hora, Por días, Tabla; «ahora» y «siguiente» por la hora del lugar con `aria-current="time"`, calculados al montar y al volver a la página, sin temporizador ni SSR), `Location` (Tarjeta con mapa, Dos columnas, Puntos de encuentro; la dirección en `GText as="address"`, mapa estático con `alt` que dice el sitio), `Policies` (Avance, Todo a la vista, Tarjetas; ancla estable por política) y `Offer detail` (Espacios + ficha, Tira + pestañas, Lectura larga; un dato con su espacio lleva a sus fotos, slot `consult` en lugar de «Reservar»).
- **`@grana/blocks/ecommerce` · parte A (#909 a #926, `draft`):** entrada nueva (`dist/ecommerce.js`; *peer* `vue`, `@grana/vue`, `/price`, `/gallery`, `/tag` y `/load-region`, nunca `/booking`) con **`cartTotals`** (la aritmética del carrito en un solo sitio: enteros escalados, un redondeo por operación, impuestos incluidos dichos sin sumar, `approximate` contagiado, umbrales; avisos CT1 a CT5, #911) y las secciones `Product card` (Foto arriba, Horizontal, Compacta con acción rápida: la referencia de precio siempre nombrada, la calificación en palabras con su cuenta y una acción rápida que nunca añade sin las opciones obligatorias, #915), `Category previews` (Puertas con foto, Tira, Lista con cuenta: la cuenta en el nombre del enlace, la vacía sin enlace, #917), `Trust` (Fila, Tarjetas, Lista al pie: cada promesa enlaza a su política, #926) y `Promo` (Banda, Tarjeta con imagen, Línea: hasta qué fecha en la hora de la tienda, sin cuenta atrás; condiciones a la vista ligadas a la acción principal; «Copiar código», #925). Los tipos de más de una familia (`Photo`, `PriceSpec`, `Totals`…) pasan a `types/common.d.ts` con los mismos nombres; `TotalsLine` gana `kind`, `included` y `amount: null` (#910). Peso medido, sin tope todavía: entrada 14 059 B gzip con sus trozos, variantes de 2 321 a 3 421 B, `cartTotals` sola 1 594 B (referencia 1 024 B); Booking 36 996 B (tope 37 888) y Marketing 17 630 B no crecen por Ecommerce.

- `GSlider` (entrada propia `@grana/vue/slider`, global UMD `GranaSlider`, ≈ 11 KB gzip): valor acotado o rango de dos extremos donde el asa es el valor, una píldora con la cifra dentro; modelo `Number` o `null`, o `[inicio, fin]` con `range`; comparte fila con `GInput` en `GFormRow` (#445 a #457, #509).
- `GTag` y `GTagGroup` (entrada propia `@grana/vue/tag`, global UMD `GranaTag`, ≈ 10 KB gzip): etiquetas de un conjunto, estáticas, enlace, de alternar o quitables. Al quitar queda una **huella** del mismo ancho con «Deshacer» en el sitio y con el foco; racimos por faceta (`layout="facets"`), tope «Ver N más», «Quitar todas» y color de categoría con el mismo hash que `GAvatar` (#460 a #473, #510 a #514, #524 a #526).
- `GAccordion` y `GAccordionItem` (en el principal): secciones plegables donde el encabezado cerrado enseña la primera línea de la respuesta (`peek`) y el que tocas no se mueve; lo plegado se encuentra con Ctrl+F, se enlaza con `#id` y se imprime abierto; `exclusive`, `lazy` y encabezado pegado opcional (`sticky`) (#475 a #488, #515 a #519).
- `GBreadcrumbs` (en el principal): migas de pan cuya ruta entera se aprieta por prioridad sin esconder niveles; al final, «Subir · página»; con `children`, puertas a los hermanos (#490 a #503, #520 a #523).
- `GEmpty` (en el principal): el vacío con causa (`none`, `filtered`, `error`, `forbidden`), del tamaño de un elemento; con un filtro, dice cuántas había y ofrece quitar cada filtro con las cuentas que devuelve (#529 a #543, #547, #551 a #556).
- `GLoadRegion` (entrada propia `@grana/vue/load-region`, global UMD `GranaLoadRegion`, ≈ 4 KB gzip; su CSS va en `grana.css`): la región cuyo contenido llega tarde. En la primera carga, la plantilla de tu aplicación sin tinta como molde que recibe la tinta en su sitio; al refrescar, lo de antes sigue a la vista, inerte y marcado, y un fallo no lo borra. Nada antes de 200 ms, mínimo de 400 ms a la vista, aviso de espera larga a los 5 s sin ninguna animación en curso, un canal cortés por página con fusión y foco que vuelve por clave y nunca cae en `body`. Token nuevo `--g-color-mold` (#529 a #548, #552 a #559).

#### Carga común en `GTable`

- `GTable` adopta el motor de carga común: retraso de 200 ms, mínimo de 400 ms y espera larga de 5 s (`labels.slow`); esqueleto quieto, con el tono `--g-color-mold`; props `error` y `announceError`, evento `retry`, slot `error` y textos `failed` y `retry`; vacío y fallo por defecto con `GEmpty`; foco que vuelve por `rowKey` (#540, #548, #555, #558, #559).

#### Tema y CLI

- Token `--g-color-mold`: el tono único del marcador de carga, en el tema por defecto (claro y oscuro) y en `@grana/cli` (#538).
- `@grana/cli` deriva los colores del tema oscuro contra la superficie oscura real, teñida por los neutros del tema, y no contra la de por defecto.
- `@grana/cli` conoce las ranuras del item actual de `GSidebar` (`--g-sidebar-current*`, grupo de color): si el tema las declara, diagnostica sus pares en claro y oscuro (`sidebar-current-contrast`, informativo) y, si se heredan del claro y fallan en el oscuro, deriva el oscuro (`sidebar-current-dark`: relleno `{f}-soft`, tinta `{g}-text` o el respaldo `on-{f}-soft`) (#614).

#### Clases utilitarias (`draft`)

- 229 clases `g-*` de ajuste puntual (margen y relleno con la escala `--g-space-*`, `display` y flex/rejilla, texto por rol del tema, `g-hidden`, `g-sr-only`…), de una sola declaración y especificidad 0,1,0, en la capa nueva `grana.utilities`, la última de Grana. `@grana/vue/style.css` ya las incluye; `@grana/vue/utilities.css` (generado por `scripts/build-utilities.mjs`, 1 892 B gzip) las trae sueltas para quien usa los tokens sin los componentes y necesita los tokens (#804 a #811).
- El orden de capas completo `grana.defaults, grana.components, grana.blocks, grana.utilities` se declara al principio de cada punto de entrada de CSS de Grana (`grana.css`, `utilities.css` suelto y `components.css` de `@grana/blocks`): da igual qué hoja se cargue primero y las utilidades nunca quedan como la capa más débil (#806).

#### `GFab` (en construcción, `draft`)

- `GFab` (entrada propia `@grana/vue/fab`, global UMD `GranaFab`; su CSS va en `grana.css`): botón flotante para crear o capturar desde cualquier sitio. A · «La pila que crece» por defecto (las que caben, hasta 5, la más usada pegada al botón; si sobran, «Más acciones (N)» abre el resto agrupado; de 6 a 15 acciones no se mueve ninguna de las cuatro primeras) y C · «Acción con cola» con `main` (la principal a un toque, con su nombre, y un panel que filtra al escribir). Confirmación en la misma fila para lo peligroso, acuse en el propio botón con el ticket de `select`, se aparta del foco (WCAG 2.4.11), velo táctil y una activación por gesto (#654 a #671). Pendiente de la auditoría de coco y del README.

#### `@grana/blocks/marketing` (en construcción, `draft`; paquete privado `0.0.0`)

- Entrada nueva de la familia Marketing en `@grana/blocks` (`dist/marketing.js`, `dist/marketing.d.ts`, solo ESM; `vue`, `@grana/vue`, `@grana/vue/hero` y `@grana/vue/tag` *peer*): bloques estructurales sin CSS que componen las primitivas de `@grana/vue` y emiten intención (`navigate`, `activate`). Primera parte del lote 2: **`GbHero01`–`03`** (La ventana, Vistas, El umbral; una sola acción principal decidida por la forma, #818), **`GbFeatures01`–`03`** (Rejilla, Alternada, Lectura; la ventaja lleva a su prueba, #819) y **`GbStats01`–`03`** (Fila, Banda, Junto a un párrafo; ninguna cifra sin su origen, #820). Una sola `Props` por sección compartida por sus tres variantes, un `meta.json` por sección y tipos generados (`Gb<Sección>Props`, `GlobalComponents`) con los tipos de datos de `_comun.md` §2 (#815 a #820).
- Segunda parte (bruno B): **`GbTestimonials01`–`03`** (Tarjetas, La voz, Avance; la cita entera, en su idioma (`lang`) y con su fuente en `figure`/`blockquote`/`cite`, sin carrusel ni recorte, #821), **`GbCta01`–`03`** (Banda de marca, Tarjeta con imagen, Línea sobria; `assurance` ligada a la acción principal con `aria-describedby` y aviso A2 si hay más de una por página, #822) y **`GbFaq01`–`03`** (Acordeón, Todo a la vista, Con buscador; cada pregunta con su ancla estable `#id` que abre la respuesta, búsqueda sin mayúsculas ni diacríticos con la cuenta en el `output` de `GInput` y vacío con `GEmpty`, #823). Tipo nuevo `FaqLabels`.
- Tercera parte (bruno C): **`GbNewsletter01`–`03`** (En línea, Tarjeta, Banda de marca; un solo campo con el botón acoplado en el slot `action` de `GInput` y la promesa —qué llega y cada cuánto— como descripción del campo antes de escribir; valida con el navegador, lo enseña `GForm` y emite `submit` `{ event, email }`, #824), **`GbBlogList01`–`03`** (Rejilla, Lista con fecha, Destacada + lista; `GCard interaction="link"`, fecha en `<time datetime>` por encima del título y «Actualizado {fecha}» cuando hay `updated`, #825) y **`GbFooter01`–`03`** (Columnas, Una línea, Con suscripción; el contacto primero en un `address` con los canales que el teléfono abre, un solo `nav` de grupos y `as="div"` dentro del slot `footer` de `GAppShell`, #826). Tipos nuevos `BlockSubmit`, `DateLabel` y `FooterAs`.
- `useSectionLevel()` en `@grana/vue` (principal): nivel del encabezado que va en un sitio según las `GSection` antepasadas (`2` fuera; dentro, el de la sección + 1, tope `6`) y su profundidad, para componentes de la aplicación y bloques (#817).

#### `GSidebar`

- Prop `breakpoints` (`{ expanded?, rail? }` en px del contenedor): cortes de `mode="auto"` por instancia; por ejemplo, drawer por debajo de 1024 px sin riel con `:breakpoints="{ expanded: 1024, rail: 1024 }" mobile="drawer"` (#618).

### Cambiado

- **Regla de modalidad del foco (#450):** el anillo de foco que WebKit no marca (`data-g-key-focus`) sigue la modalidad de la última entrada: aparece con cualquier tecla que no sea un modificador y se quita con el puntero. Los radios de `GRadioGroup`, `GCard` y `GWidgetGallery` pasan a esta regla.
- **`navigate` solo con activación primaria (#505):** `GCard` (`interaction="link"`) y `GSidebar` emiten `navigate` solo con el clic principal sin Ctrl, ⌘, Mayús ni Alt (o con Intro); con modificadores o clic central el navegador abre la pestaña nueva y el evento no se emite. `GTag`, `GTagGroup` y `GBreadcrumbs` nacen con la misma regla.
- **`GSidebar`: el item actual es un asiento (#612 a #617):** la fila del actual ya no se rellena (sin superficie `inset`, contorno `border-strong` ni barra de acento): un círculo detrás del icono, **lleno** en el destino actual y **hueco** en la rama que lo contiene, con un nodo y la línea encendida hasta el hijo actual; en el riel, el padre representa al hijo actual con el asiento lleno (`is-rep`, sin `aria-current`). Lo pintan tres ranuras nuevas del tema, `--g-sidebar-current`, `--g-sidebar-on-current` y `--g-sidebar-current-edge` (por defecto `primary`, `on-primary` y `primary-text`).
- **`GSidebar`: `color` ya no pinta la píldora del navbar (#615):** la píldora es el asiento crecido y lee las ranuras `--g-sidebar-current*`; `color` solo pinta los contadores y los puntos. Sin aviso de desarrollo. Con los valores por defecto (`color="brand"`, `primary` = `brand`) no cambia nada; quien teñía la píldora con `color` pasa a `--g-sidebar-current` (y `--g-sidebar-on-current`) en el tema.
- **`GMenu`: una activación por gesto (#661, defecto L8):** un doble clic en el disparador ya no abre y vuelve a cerrar el menú; el segundo clic de una ráfaga sobre una casilla u opción no la vuelve a alternar, e Intro o Espacio mantenidos no repiten la acción. Su motor de teclado y puntero pasa a `utils/menuNav.js` (interno), compartido con `GFab`, sin otro cambio de comportamiento (#657).
- **Avisos de desarrollo (#636):** los avisos `[Grana …]` se ven por fin en el desarrollo de tu aplicación (Vite, con y sin preempaquetar, y webpack 5) y desaparecen de su build de producción. Antes no salían nunca en el navegador (la guarda comprobaba `typeof process`, que el empaquetador no define) y sus textos llegaban al JS de producción. Ahora cada aviso va escrito en su sitio con una sola forma, `try { if (process.env.NODE_ENV !== 'production') … } catch {}`; sin empaquetador (ESM directo o UMD desde un CDN) no avisa y no lanza nada. Si tu aplicación tiene muchos avisos de golpe al actualizar, son reales: siempre estuvieron ahí. Verificación: `node design/lab/avisos-dev/verificar.mjs`.

### Cambios de comportamiento en la isla de estado (`@grana/vue/status`, en construcción, `draft`)

La isla pasa a ser **transitoria** (D1 · Cápsula de relevo, #693 a #705). Quien ya la usaba verá estos cambios:

- **Cae, se lee y se recoge sola.** La cápsula cae del borde sin texto, se ensancha con su titular y se recoge pasado el tiempo de lectura de `GToast` (#142), en pausa mientras el puntero, el foco o un dedo están en ella o en la marca de lo que muestra, con la lista abierta, durante un reintento o con la pestaña oculta. La condición **sigue en el modelo**: vuelve con su `GStatusMark for` y con Alt+F8. Lo que lleva cuenta atrás, o acción sin marca montada, no se recoge por tiempo.
- **Una cada vez:** las condiciones se relevan en la misma cápsula, la más grave primero; «+N» cuenta lo que espera. Asomo al pasar el puntero, al enfocar o con un primer toque; la lista, al pulsar el titular (o con el segundo toque).
- **Nueva opción `duration`** (`'auto'`, ms ≥ 5000 o `false` para «no ocultar solo»), **método `hide()`** y, en la copia de cada condición, **`seen`** (sustituye a `acknowledged`). `state` es ahora `{ form, peek, paused, current, waiting, count, mobile }` y `form` vale `empty`, `line` o `list`.
- **`resolve(id, resultado)` limpia la descripción y el detalle técnico**, y una acción que se cumple con `{ type: 'success', … }` se aplica como `resolve`: el éxito ya no arrastra la traza del fallo.
- **Una condición con `origin` vive con su origen:** si su destino, que llegó a existir, sale del documento, se retira (motivo `origin`). Nuevo motivo `read` para un resultado ya leído (sustituye a `acknowledge`).
- **Retirados:** `autoOpen`, `acknowledge()` (avisa y hace `hide()`), `labels.acknowledge`, `labels.summary` y `labels.more` (usa `labels.waiting`). Textos nuevos: `waiting`, `listTitle` y `hide`; `close` también cierra la lista.
- **Borde compartido:** la isla publica su reserva solo mientras se ve y va detrás del FAB (`EDGE_ORDER.status` 20 → 30, #699): un FAB de arriba ya no baja cuando cae la isla.
- **CLI:** dos guardas nuevas para el cristal grafito de la isla en claro (`status-glass-ink`, `status-glass-badge`; `tokens.md` §12.1).

### Cambios de comportamiento en `GTable`

Quien ya usaba `GTable` verá estos cambios al actualizar:

- **El slot `empty` ya no es el respaldo del error.** Un fallo sin filas pinta el slot `error` o su `GEmpty cause="error"` con `labels.failed` y «Reintentar»; si tenías un `empty` que también cubría el fallo, ponle un slot `error`.
- **El botón de limpiar filtros del vacío por defecto es ahora un `GBtn` dentro de `GEmpty`**, en lugar del botón `g-filter-bar__clear`. Mismo evento `clear`; cambian el marcado y la clase.
- **Con `loading: true`, las filas de antes siguen a la vista (inertes) durante 200 ms y el esqueleto se queda al menos 400 ms**; el esqueleto ya no late y `labels.loading` se anuncia cuando el esqueleto se ve, no al empezar.
- **La región viva se vacía al empezar una carga**, para que el anuncio del fin se oiga aunque el recuento no cambie.
- **El `<table>` lleva `tabindex="-1"`** y recoge el foco durante una carga.
- **Límite conocido:** con celdas compuestas con avatar, el esqueleto mide 44 px frente a 60 de la fila y la tabla encoge mientras carga (en la tabla simple, 44 = 44); lo cerraría un molde de `GTable` desde una muestra de filas, reservado (#543, #558).

### Peso

- El paquete principal crece **+15 200 B gzip (14,8 KiB) sobre 179 506 B** en la fase (`grana.js`), por `GBreadcrumbs`, `GAccordion` y `GEmpty` con el motor de carga y la adopción de `GTable` (cada uno se midió por separado sobre un árbol distinto, así que las cifras individuales no suman la total). Está dentro del tope de +15 KiB de la valoración conjunta (#506, #550) y **el margen está agotado**: todo componente nuevo que entre al principal abre esa valoración. Lo más pesado de la fase va en entradas propias (`slider`, `tag`, `load-region`) y, importados uno a uno, los componentes del principal son puros: no los paga quien no los usa.
- **Avisos de desarrollo (#636):** la guarda en el sitio de cada aviso hace crecer el `dist/` (que conserva los textos para el desarrollo de la aplicación): `grana.js` **213 872 → 215 279 B gzip (+1 407 B)**, `grana.umd.js` 187 746 → 188 163 B (+417 B); el resto de entradas, entre +33 B (`time-field`) y +510 B (`speech`). **Lo que paga una aplicación en producción baja** (cifra informativa; aplicación mínima que importa todo el principal y lo conserva entero, con Vue incluido, JS gzip): con Vite 6.4.4 **193 695 → 190 886 B (−2 809 B)** y con webpack 5.112 + terser 5.51 **199 373 → 179 558 B (−19 815 B)**; con el principal y las otras once entradas, cero textos de aviso en los dos.

- **`GFab` (#656):** la entrada `@grana/vue/fab` pesa **10 136 B gzip** (`dist/fab.js`; `fab.umd.js` 9 248 B), dentro de su tope de **10 496 B** (#676, que sustituye al de 8 192 B; no se vuelve a subir). En el principal crecen el motor de menú extraído de `GMenu` (`utils/menuNav.js`), `EDGE_ORDER.fab` y las piezas nuevas de `__shared`: `grana.js` **215 555 → 216 016 B gzip (+461 B)**, dentro de su presupuesto de 512 B (medido sobre el árbol de antes del cambio; la base de #653, 215 279 B, ya había crecido con otros lotes).
- **Modo pasos de `GDialog` (#590):** medido en copia aislada del árbol actual (`vite build` del principal, gzip de `grana.js`) con y sin `GDialogStep`, `useDialogSteps`, el motor de pasos (`GDialog/steps.js`), el hilo, «Volver», el pie por paso y `utils/landing.js`: **212 489 → 217 230 B (+4 741 B, 4,63 KiB)**, dentro del tope de **4 864 B** (#684, que enmienda los 4 096 B de #590; 123 B de holgura). Se queda en el principal.

- **Isla de estado transitoria (#705):** la entrada `@grana/vue/status` pasa de **16 150 a 19 580 B gzip** (`dist/status.js`, gzip de Vite; `status.umd.js` 13 910 → 17 240 B), **580 B por encima del tope de 19 000 B**: queda para la valoración de lima. Minificada para producción (esbuild, sin avisos): 11 555 → 14 812 B. En el principal solo crecen `TOAST_DURATION` y `RESUME_MIN` en `__shared` y la constante de `EDGE_ORDER` (`grana.js` 217 210 → 217 240 B); `grana.css` 90 080 → 91 320 B por el CSS nuevo de coco.

- **`@grana/blocks/marketing` (#815, primer lote sin tope):** con Hero, Features y Stats (9 de las 27 variantes), `dist/marketing.js` pesa **5 891 B gzip** (26 616 B sin comprimir, `gzip -c`). Importación parcial (aplicación de prueba con Vite, `vue` y `@grana/vue*` externos): solo `GbHero01` **2 343 B gzip** y solo `GbFeatures01` **2 261 B**, sin las otras variantes. `dist/blocks.js` (Gestión) no crece. `useSectionLevel()` (#817): `grana.js` **222 437 → 222 502 B gzip (+65 B)**, dentro de su tope de 128 B.
- **`@grana/blocks/marketing` con Testimonials, CTA y FAQ:** 18 de 27 variantes, `dist/marketing.js` **9 919 B gzip** (50 249 B sin comprimir, `gzip -c`; medido en un árbol aislado con HEAD 99c1aef + esta entrega, sin las secciones de bruno C a medio hacer). Importación parcial (esbuild, `vue` y `@grana/vue*` externos): solo `GbTestimonials01` **2 442 B**, solo `GbCta01` **1 859 B**, solo `GbFaq03` **1 924 B**, sin las otras variantes. `dist/blocks.js` no crece.
- **`@grana/blocks/marketing` con Newsletter, Blog list y Footer:** las nueve secciones (27 de 27 variantes), `dist/marketing.js` **16 934 B gzip** (`gzip -c`; árbol con las nueve secciones ya presentes). Importación parcial (esbuild, `vue` y `@grana/vue*` externos): solo `GbNewsletter01` **2 432 B**, solo `GbBlogList01` **2 390 B**, solo `GbFooter01` **3 218 B**, sin las otras variantes. `dist/blocks.js` no crece.

- **`@grana/blocks/booking`, parte A (#860, primer lote sin tope; lo fija lima tras la medida):** con Search, Offer list, Guest form y Confirmation (12 de 33 variantes), `dist/booking.js` con su trozo compartido de `common/` pesa **17 058 B gzip** (`gzip -c`, `scripts/measure-entry.mjs`). Variantes solas (esbuild, `vue` y `@grana/vue*` externos, `scripts/measure-partial.mjs 4096 booking`): Search 1 719 a 1 723 B, Offer list 4 018 a 4 042 B, **Confirmation 4 480 a 4 663 B y Guest form 5 982 a 6 547 B, por encima de la referencia de 4 096 B** (vuelven a lima con la medida). `dist/marketing.js` pasa a medirse con el trozo compartido que Vite separa al haber dos familias: **17 630 B** (antes 17 453 B; +177 B por el trozo y el icono opcional de `GbLink`), dentro de su tope de 18 432 B. `dist/blocks.js` no crece.
- **`@grana/blocks/booking`, parte B:** con las once secciones en el árbol (las de la parte C aún en construcción), `dist/booking.js` con su trozo compartido pesa **35 924 B gzip** (`scripts/measure-entry.mjs`). Variantes solas (`scripts/measure-partial.mjs 4096 booking`): Policies 2 362 a 2 465 B, Itinerary 3 092 a 3 611 B, Location 3 866 a 4 260 B y Offer detail 4 023 a 4 197 B; **`GbLocation03` (4 260 B) y `GbOfferDetail02` (4 197 B) pasan la referencia de 4 096 B** (vuelven a lima). `dist/marketing.js` sigue en 17 630 B y `dist/blocks.js` no crece.
- **`describeQuery` en `@grana/vue/booking` (#862):** `dist/booking.js` **14 081 → 14 697 B gzip -9 (+616 B)**, por encima del tope de 14 336 B de #742 (falla la comprobación de `src/marketing.test.js` con el `dist/` construido): la utilidad pura repite en código lo que antes era una plantilla del resumen dentro de `GBookingBar` (formatos compartidos con `queryFormat`); vuelve a lima.
- **`@grana/blocks/booking`, parte C:** con Booking summary, Menu y Availability, las once secciones (33 variantes) dejan `dist/booking.js` con su trozo compartido en **35 942 B gzip**; la parte C suma **+8 076 B** (A y C solas en un árbol aislado: 17 058 → 25 134 B). Variantes solas (`scripts/measure-partial.mjs 4096 booking`): Booking summary 3 865 a 4 050 B, Menu 2 650 a 2 833 B, Availability 01 y 02 3 879 a 3 900 B y **Availability 03 4 576 B, por encima de la referencia de 4 096 B** (vuelve a lima). `dist/marketing.js` (17 630 B) y `dist/blocks.js` no crecen.
- **Clases utilitarias (#810):** `dist/grana.css` **100 163 → 101 724 B gzip (+1 561 B, 1,52 KiB)**, dentro del tope de +3 072 B (medida de `gzip -9` sobre el `dist/grana.css` de antes y sobre el de después; sin el `@import` de `utilities.css` y con la declaración de orden nueva, 100 180 B: las utilidades solas suman +1 544 B y la declaración de orden +17 B). Entrada nueva de `exports`: `./utilities.css` → `dist/utilities.css` (9 953 B sin comprimir, **1 892 B gzip**). No afecta a `grana.js` ni al UMD.

## [0.1.0-beta.0] - fecha por fijar al publicar

Primera beta. Todos los componentes están en estado `candidate` (contrato, CSS, pruebas, `meta.json`, README y auditoría del componente real sin defectos bloqueantes, en Chromium, Firefox y WebKit). La verificación en entorno real (lectores de pantalla, Safari real, móvil real, `forced-colors` real, zoom real) sigue pendiente: ver [`PENDIENTES.md`](PENDIENTES.md).

### Añadido

#### Paquetes y entradas

- `@grana/vue`: componentes Vue 3, un plugin (`app.use(Grana)`), una hoja de CSS única (`@grana/vue/style.css`) y una fuente opcional (`@grana/vue/fonts.css`, Instrument Sans). Exige Vue `^3.5.0`; `lucide-static` es dependencia par opcional.
- `@grana/cli`: motor de tema (`grana theme`, `grana check`), plugin de Vite (`@grana/cli/vite`) y uso programático (`buildTheme`). Sin dependencias; Node ≥ 22.
- Entradas propias, fuera del paquete principal para que solo las pague quien las usa (#238, #328, #337, #367, #415): `@grana/vue/speech` (global UMD `GranaSpeech`), `@grana/vue/status` (`GranaStatus`), `@grana/vue/combobox` (`GranaCombobox`), `@grana/vue/file-field` (`GranaFileField`) y `@grana/vue/time-field` (`GranaTimeField`).
- `@grana/vue/testing` (`GranaTesting`): `createSimulatedSpeechAdapter` y `createSimulatedUploader`, adaptadores sin red para probar tu aplicación (#216, #367).

#### Tema y tokens

- Contrato de tokens ([`docs/contract/tokens.md`](docs/contract/tokens.md)) y contrato de API compartida ([`docs/contract/api.md`](docs/contract/api.md)).
- Tema por defecto neutro (`brand` `#1F1F1F`, `accent` `#0B63CE`, Instrument Sans), en la capa `grana.defaults`; el tema del usuario va sin capa y siempre gana.
- Claves del tema: `brand`, `accent`, `primary`, `radius`, `shape`, `space`, `font`, `fontDisplay`, `fontSize`, `typeScale`, `neutrals`, `neutralsHue`, `semanticCollision`, `categories`, `dark`, `name`, `overrides` (#107).
- Derivación de paleta en OKLCH con contraste garantizado: `strong`, `soft`, `text`, `on`; neutros teñidos; colisión de semánticos con la marca; categorías `--g-color-cat-1` a `cat-N`; `tokens.json` con el origen y el contraste de cada token (`--doc`) (#93).
- Tema oscuro por defecto: sigue al sistema y se fuerza con `data-theme="dark"` o `"light"` en cualquier elemento, anidable; el CLI deriva y valida los dos esquemas (#79 a #81).
- Mínimos de accesibilidad que ningún tema puede bajar y que el CLI valida: área táctil ≥ 24 px (≥ 44 px táctil), texto ≥ 12 px, contraste de texto ≥ 4.5:1 y de controles ≥ 3:1, foco siempre visible.
- Tokens de movimiento `--g-ease-spring` y `--g-ease-bounce`, `--g-duration-slow`, y un patrón único de `prefers-reduced-motion` (#299 a #305, #280).

#### Iconos

- `GIcon` público con Lucide como única fuente: `1em`, `currentColor`, decorativo o con `label`, `flip-rtl`; registro por aplicación con `createIcons` y validación estricta por forma; la lista de la librería es API pública. Convención «dato → nombre; plantilla → slot» en `GTabs`, `GMenu`, `GSidebar`, `GRadioGroup` y `GCombobox` (#85 a #87, #197 a #206, [`docs/contract/icons.md`](docs/contract/icons.md)).

#### Componentes: acciones y navegación

- `GBtn` (botón o enlace con `href`, estado de carga con región viva externa), `GMenu`, `GTabs` y `GTabPanel`, `GSidebar` (expandida, riel, navbar inferior y drawer), `GPagination`, `GStepper`, `GHelper` y `GHelperScope`.
- `GTooltip`: pestaña que viaja entre los controles de un grupo, segunda etapa con `detail`, pulsación larga en táctil, atajo `<GBtn tooltip>` (#380 a #399). Modo visual del motor para la pista de solo icono de `GTabs`, `GRadioGroup` y el riel de `GSidebar` (#433 a #437).
- Paneles anclados estables: cuatro reglas comunes (lado con histéresis, `--_max` fijo, cierre sin devolver el foco, puntero quieto que no desplaza la lista) en `GSelect`, `GMenu`, `GDatePicker`, `GHelper`, el editor de `GFilterBar` y `GCombobox` (#358).

#### Componentes: campos y formularios

- Campos: `GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GCheckboxGroup`, `GRadioGroup` (cinco apariencias: `list`, `inline`, `segmented`, `chip`, `card`), `GSwitch`, `GDatePicker`, `GNumberField` (#309 a #314).
- `GCombobox`: búsqueda en catálogo con resultados de tu aplicación, sin `fetch`; «el campo se abre» por defecto, paleta con vista previa (`appearance="palette"`), valor como objeto y texto libre; con `multiple`, la frase, la receta (`selection="list"`) y la cesta, tope `max`, un oculto por valor y Ctrl/⌘+Z (#329 a #338, #417 a #430).
- `GTimeField` («La hora dicha»: se escribe como se dice y vuelve en palabras, 12 o 24 h, `step`, arcos que cruzan la medianoche) (#400 a #416).
- `GFileField` («Línea de adjuntos»: subida al añadir con el adaptador de tu aplicación, el envío se bloquea con pendientes o fallidos, la página entera responde al arrastre) (#366 a #379).
- Sistema de formularios: `GForm`, `GFormSection` (fija, `collapsible` y `addable`), `GFormLayout`, `GFormRow`, `GFormReveal` (campos condicionales con `when`), `GInputGroup` y sus partes, `GFieldGroup`, `GFormActions`, `GErrorSummary` y el composable `useFormField` (#274 a #292, #283).
- Personalidad de los campos: sacudida única al enviar un campo rechazado y mensaje que sale del campo (#299 a #305).

#### Componentes: datos

- `GTable` (columnas compuestas, celdas por slot, filtros por columna), `GFilterBar`, `GDataList`, `GCalendar` (Día, Semana, Mes y Timeline), `GMetric`, `GProgress`, `GBadge`.
- `GSummary`: ficha de resumen adaptable con prioridad líquida, y `summaryDiff` para distinguir homónimos en una lista (#349 a #357).
- `GAvatar` (imagen, iniciales o icono; color por categoría del tema con hash estable) y `GAvatarMotion` (#293 a #298).

#### Componentes: superficies y composición

- `GSurface`, `GCard` (compone `GSurface`; acción principal por enlace estirado), `GDialog` (nace desde su disparador; enfoca al abrir `[autofocus]`, el primer control o el cierre), `GDivider`, `GAdaptiveLayout` (layout automático por necesidades de tamaño, con pistas `g-adapt-*` en el hijo) (#339 a #348, #359 a #365, #292, #299 a #305).
- Paneles: `GWidget`, `GWidgetGrid`, `GWidgetGallery`, `GWidgetConfig`.

#### Componentes: avisos y estado

- `GToast` (`createToaster`, `useToast`, `GToaster`): servicio imperativo con región viva única, traslado al modal y borde compartido.
- Isla de estado (`createStatus`, `useStatus`, `GStatusIsland`, `GStatusMark`, `GStatus`): aviso persistente que cambia de forma; atajo `Alt+F8`; orden de borde voz → isla → avisos (#315 a #328).

#### Captura de voz

- Fase 1 (`createSpeech`, `useSpeech`, `GSpeechHost`, `GSpeechPill`, `GSpeechTrigger`): 13 estados, adaptador de tu aplicación (sin red en Grana), dictado al cursor con deshacer propio, panel, hoja móvil y traslado al modal (#207 a #238).
- Fase 2 (`GTranscript`, `createTranscript`, `useSpeechTarget`, «Revisar»): rejilla de revisión con edición en la celda, hablantes y roles, destinos ligados al modelo del formulario con vista previa y deshacer (#241 a #264).

#### Paquete, tipos e integración continua

- Tipos de TypeScript incluidos: los `.d.ts` se generan desde los `meta.json` de cada componente y viajan en el paquete (campo `types` por entrada), sin escribirlos a mano (#443).
- Paquete solo ESM (`"type": "module"`), con `exports` por entrada y sin build CommonJS; los UMD quedan solo para usar la librería con `<script>` desde una CDN (#442).
- Importación parcial sin arrastrar el resto: los componentes están marcados como puros y `sideEffects` cubre solo el CSS, de modo que importar solo `GBtn` pasó de 66,4 KB a ≈ 10,9 KB gzip con Rollup; importar toda la librería añade ≈ 155 KB gzip (#444).
- Integración continua en `.github/`: `ci.yml` (vitest, build, `check-icons`, compuertas del `dist/` y un subconjunto de Playwright en Chromium; `npm audit` informativo), `e2e-full.yml` (pasada completa en Chromium, Firefox y WebKit, nocturna y manual) y Dependabot semanal para npm y Actions.
- `LICENSE` (MIT) dentro de los dos tarballs y aviso de la fuente Instrument Sans (SIL OFL 1.1, con su copyright) en `THIRD-PARTY-NOTICES.md` de `@grana/vue`.

#### Accesibilidad y verificación

- Contraste de lo marcado: todo control seleccionable relleno con una familia de color lleva contorno `{familia}-text` para llegar a 3:1 contra la superficie; formas de familia sin par en `{familia}-text` (#431 a #440).
- Foco visible del radio en WebKit mediante el atributo interno `data-g-key-focus` (#441, WCAG 2.4.7).
- Pruebas: 2792 unitarias en `@grana/vue` y 141 en `@grana/cli`; pasada completa de navegador en Chromium, Firefox y WebKit con 1380 pruebas que pasan y 57 omitidas por diseño. Auditorías por componente en `design/lab/<nombre>/auditoria.md`.

### Limitaciones conocidas

- La API puede cambiar entre betas.
- Sin verificar en entorno real: lectores de pantalla, Safari real, táctil y móvil reales, `forced-colors` real, zoom real al 200 y 400 %, IME y teclado virtual.
- Sin matriz de versiones mínimas de navegador y sin prueba de SSR con Nuxt ni de hidratación real.
- La hoja de CSS es única y no se parte por componente.
- Dark Color Presence (presencia del color en el tema oscuro) está investigada pero no adoptada.
- Lo aplazado, con su origen y su dueño, está en [`PENDIENTES.md`](PENDIENTES.md).

[Sin publicar]: https://github.com/kevinedgm/grana/commits/main
