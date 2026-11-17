# Catálogo de componentes · @grana/vue 1.0.0

> **Generado, no se edita a mano.** Fuente: los `meta.json` vía `dist/catalog.json` (`build-catalog.mjs`, #1082).
> Regenerar tras `npm run build`: `node packages/vue/scripts/build-catalog-md.mjs`.

## Cómo usarlo

- Es la lista de lo que **ya existe** como API pública: piezas, props (tipo, valores y por defecto), `v-model`, eventos, slots, métodos, propiedades CSS públicas y claves de `labels`.
- Para buscar una pieza: `grep -n "^### GBtn " docs/contract/catalogo.md` y lee hasta el siguiente `###`. Para buscar un nombre de prop o evento en todas: `grep -n "\`nombre\`" docs/contract/catalogo.md`.
- Antes de contratar una prop, un evento o un token nuevo, comprueba aquí si ya existe con otro nombre o en otra pieza, y reutiliza su nombre y sus valores.
- Lo que no está aquí no es API. El contrato completo y el porqué siguen en `design/contracts/` y `DECISIONS.md`.

## Resumen

90 piezas (87 stable, 3 draft), 24 entradas, 177 tokens, 73 iconos, 229 clases utilitarias.

## Entradas

- `@grana/vue` (default): GAccordion, GAccordionItem, GAdaptiveLayout, GAvatar, GAvatarMotion, GBadge, GBreadcrumbs, GBtn, GCalendar, GCard, GCheckbox, GCheckboxGroup, GContainer, GDataList, GDatePicker, GDialog, GDialogStep, GDivider, GEmpty, GErrorSummary, GFieldGroup, GFilterBar, GForm, GFormActions, GFormLayout, GFormReveal, GFormRow, GFormSection, GHelper, GHelperScope, GIcon, GInput, GInputGroup, GInputGroupInput, GInputGroupSelect, GInputGroupText, GMenu, GMetric, GNumberField, GPagination, GProgress, GRadioGroup, GSection, GSelect, GSidebar, GSplit, GStack, GStepper, GSummary, GSurface, GSwitch, GTabPanel, GTable, GTabs, GText, GTextarea, GToaster, GTooltip, GWidget, GWidgetConfig, GWidgetGallery, GWidgetGrid
- `@grana/vue/speech` (manager): GSpeechHost, GSpeechPill, GSpeechTrigger, GTranscript
- `@grana/vue/status` (manager): GStatus, GStatusIsland, GStatusMark
- `@grana/vue/combobox` (default): GCombobox
- `@grana/vue/file-field` (default): GFileField
- `@grana/vue/time-field` (default): GTimeField
- `@grana/vue/slider` (default): GSlider
- `@grana/vue/testing` (sin registro): 
- `@grana/vue/tag` (default): GTag, GTagGroup
- `@grana/vue/load-region` (default): GLoadRegion
- `@grana/vue/card-group` (default): GCardGroup
- `@grana/vue/page-header` (default): GPageHeader
- `@grana/vue/fab` (default): GFab
- `@grana/vue/form-fold` (default): GFormFold
- `@grana/vue/app-shell` (default): GAppShell
- `@grana/vue/hero` (default): GHero
- `@grana/vue/gallery` (default): GGallery, GGalleryViewer
- `@grana/vue/booking` (default): GBookingBar, GPartyField
- `@grana/vue/price` (default): GPrice, GPriceScope
- `@grana/vue/page-index` (default): GPageIndex
- `@grana/vue/sidebar-filter` (default): 
- `@grana/vue/sidebar-index` (default): 
- `@grana/vue/page-index-list` (default): 
- `@grana/vue/nav-bar` (default): GNavBar

## Piezas

### GAccordion · `<g-accordion>` · stable · `@grana/vue`

Grupo de secciones plegables de contenido (preguntas frecuentes, detalles, ajustes que se aplican al momento). Forma A «Avance» (#475): sin cajas, el encabezado cerrado enseña una línea de la respuesta que no se mueve al abrir; el encabezado que toca el usuario no se mueve (Δ0); lo plegado se encuentra (hidden="until-found"), se enlaza (#id) y se imprime. Encabezado pegado opcional (sticky). APG Accordion: hN > button por elemento, Tab por todos los encabezados y flechas opcionales.
(desde 1.0.0)

**Props**
- `modelValue`: `Array<string | number> | null` = `null`. v-model: arreglo de los value abiertos, en orden del documento (no de apertura). Controlado y no controlado (estado local que parte de la prop y la sigue; sin v-model parte de []). null/undefined = [] sin aviso; otro valor que no es arreglo = [v] con aviso 1. Los valores sin elemento montado se conservan al final, en su orden (abrir con exclusive los quita).
- `exclusive`: `boolean` = `false`. Uno a la vez: el modelo tiene 0 o 1 valores y el abierto se puede cerrar. Con más de un valor en el modelo se abre solo el primero en orden del documento, sin emitir (aviso 2).
- `headingLevel`: `2 | 3 | 4 | 5 | 6` = `3`. Nivel por defecto de los encabezados de sus elementos (el del elemento gana).
- `arrows`: `boolean` = `true`. ↓/↑ (sin vuelta) e Inicio/Fin entre los encabezados de este grupo (APG, opcional; #481). Sin Alt, Ctrl ni ⌘; nunca dentro de un panel ni en un grupo anidado.
- `sticky`: `boolean` = `false`. El encabezado de un elemento abierto se queda pegado arriba mientras se lee su contenido (#484), a --g-accordion-sticky-top del borde del contenedor de desplazamiento. Cerrar desde el encabezado pegado es instantáneo y no lo mueve.
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`Array<string | number>`): Cada vez que cambia lo abierto por el usuario (clic, Intro, Espacio, clic en el avance), por la búsqueda de la página (beforematch), por un #id y por OPEN_REQUEST. Copia nueva en orden del documento. No cuando el cambio llega desde modelValue.
**Slots**
- `default`: Los GAccordionItem (directos o dentro de v-for/<template>; un envoltorio de la aplicación entre medias funciona, pero el CSS de separadores puede no alcanzarlo).
**Propiedades CSS públicas**
- `--g-accordion-sticky-top`: Propiedad pública de entrada (no es del tema, #484): alto de la cabecera fija de la aplicación. La pone la aplicación en :root, un contenedor o el grupo; vale 0 dentro de .g-dialog__body (GAccordion.css). Da también el scroll-margin-block-start del botón de todo elemento.

### GAccordionItem · `<g-accordion-item>` · stable · `@grana/vue`

Elemento de GAccordion; suelto (sin grupo), sección plegable de una pieza con v-model:open (APG Disclosure con encabezado). hN > button con título y meta dentro, avance (A) debajo en la misma celda que el contenido, acciones fuera del hN. Contenido montado siempre (salvo lazy), plegado y asentado con hidden="until-found".
(desde 1.0.0)

**Props**
- `value`: `string | number | null` = `null`. Identidad en el modelo del grupo; sin ella, el id efectivo (aviso 10 en un grupo con v-model si tampoco hay id). Dos elementos con el mismo value se abren y cierran juntos (aviso 3).
- `id`: `string | null` = `null`. id de la raíz (ancla #id, #482) y base de los internos: {id}-toggle, {id}-content, {id}-peek. Sin él, uno generado con useId(). Repetido en el documento: aviso 9.
- `title`: `string | null` = `null`. Texto del botón (o slot title). Nombre del botón = title + meta.
- `meta`: `string | null` = `null`. Dato corto no interactivo dentro del botón, parte del nombre (o slot meta): «3 activas», «Disponible tras tu primera cita».
- `peek`: `string | null` = `null`. A «Avance» (#483): una línea debajo del encabezado cerrado (la primera de la respuesta o el estado del grupo; o slot peek). aria-describedby del botón solo cerrado; clic en él (cerrado, sin selección de texto) abre como el botón.
- `disabled`: `boolean` = `false`. aria-disabled (sin disabled nativo): enfocable, las flechas lo alcanzan, no abre ni cierra por clic, teclado ni avance. La búsqueda de la página, un #id y OPEN_REQUEST sí lo abren.
- `lazy`: `boolean` = `false`. El contenido se monta al abrir por primera vez (por cualquier vía) y no se desmonta al cerrar. Sin abrir no se encuentra, no se imprime, un #id de dentro no existe y no recibe OPEN_REQUEST.
- `headingLevel`: `2 | 3 | 4 | 5 | 6 | null` = `null`. Por defecto el del grupo; suelto, 3.
- `open`: `boolean` = `false`. Solo suelto: v-model:open, controlado y no controlado (estado local que parte de la prop y la sigue). Dentro de un grupo se ignora (aviso 5).
**v-model**: `v-model:open` → `open`
**Eventos**
- `update:open` (`boolean`): Solo suelto, en los mismos casos que update:modelValue del grupo (usuario, beforematch, #id, OPEN_REQUEST). Dentro de un grupo no se emite.
**Slots**
- `title`: Título dentro del botón (sin interactivos, aviso 6).
- `meta`: Dato corto dentro del botón (sin interactivos, aviso 6).
- `peek`: Avance de A, debajo del encabezado y fuera del botón: texto en línea; la aplicación garantiza una línea con sentido (sin interactivos, aviso 7).
- `actions`: Acciones en la fila del encabezado, fuera del hN («Restablecer»): GBtn u otros controles.
- `default`: Lo que se pliega.

### GAdaptiveLayout · `<g-adaptive-layout>` · stable · `@grana/vue`

Contenedor sin superficie que reparte a sus hijos directos en líneas contiguas, en orden del DOM, según lo que cada uno necesita (etiqueta, dominio, opciones, chrome) y el ancho disponible; los campos cortos conservan su ancho y los nodos nunca se mueven.
(desde 1.0.0)

**Props**
- `horizontal`: `'start' | 'center' | 'end'` = `"start"`. Lógico (#359): coloca la línea que no se llena; en RTL, start es la derecha
- `vertical`: `'top' | 'center' | 'bottom'` = `"top"`
- `gap`: `'none' | 'sm' | 'md' | 'lg'` = `"md"`. Factor 0 · 0,5 · 1 · 2 sobre las separaciones de formulario × densidad (#360)
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Por defecto la del sub-contexto de distribución, la de GForm o default; se re-provee a los campos
**Slots**
- `default`: Hijos directos en orden del DOM: campos, contenido genérico, avatar, GSummary, tablas y otro GAdaptiveLayout (grupo); las pistas van en el propio hijo
**Métodos**
- `refresh(): void`: Programa una nueva medida en el siguiente cuadro (cambios que el navegador no notifica: CSSOM, adoptedStyleSheets)

### GAppShell · `<g-app-shell>` · stable · `@grana/vue/app-shell`

Chasis de aplicación: reparte el visor entre cabecera, navegación (GSidebar), región principal y pie con sus puntos de referencia y su enlace de salto, reserva el sitio de la navegación leyendo su forma por CSS y escribe una sola vez la cifra de la cabecera para todo lo que se pega debajo. A · Cortina por defecto; B · Relevo de franja con header="relay".
(desde 1.0.0)

**Props**
- `header`: `'pinned' | 'relay' | 'pinned-wide'` = `"pinned"`. Comportamiento de la cabecera al desplazar. relay = B · Relevo de franja: cede el borde al zócalo pegado de GPageHeader al bajar y vuelve al subir, sin zócalo pegado o con el foco en la cabecera. Fuera de lista: aviso 9 y pinned. pinned-wide (#1055) = pegada con el visor ≥ 60rem y en el flujo por debajo (la cifra vale 0); no se combina con relay.
- `headerZone`: `'none' | 'brand'` = `"none"`. Zona de marca de la banda de cabecera: brand pone data-g-zone="brand" en el header, nunca en la raíz. Fuera de lista o sin slot header: aviso 8 y none.
- `labels`: `{ skip?: string }` = `{}`. { skip }: texto del enlace «Saltar al contenido». Obligatorio (aviso 1); vacío o solo espacios cuenta como ausente. Sin valores por defecto (#226).
- `id`: `string | null` = `null`. Base de ids (en la raíz): {id}-main es el destino del salto. Sin id, uno generado SSR-seguro.
**Slots**
- `header`: Marca, buscador, cuenta, el botón de menú del drawer. Dentro de la banda de alto fijo (más alto: aviso 6, declarar --g-app-shell-header en :root). Sin GPageHeader aquí
- `nav`: Un GSidebar, hijo directo de la raíz (un envoltorio: aviso 4; contained: aviso 5)
- `default`: La página (GContainer, GPageHeader, GStack…) dentro del main único del chasis; ningún main dentro (aviso 3)
- `footer`: Pie de la aplicación, fuera de main (contentinfo)
**Claves de `labels`**: `skip`

### GAvatar · `<g-avatar>` · stable · `@grana/vue`

La cara de una persona o de una entidad en una caja cuadrada de lado fijo: imagen, iniciales o icono, sin que la caja cambie al pasar de uno a otro. Decorativo por defecto; con label, imagen con nombre. Nunca interactivo: sin slots ni eventos. La presencia es una GBadge anclada.
(desde 1.0.0)

**Props**
- `src`: `string | null` = `null`. URL de la imagen. Se apila sobre el respaldo, invisible hasta load; si falla, se quita y queda el respaldo. Cambiarla vuelve a «cargando».
- `name`: `string | null` = `null`. Nombre de la persona o entidad: SOLO deriva iniciales y es la clave del color sin colorKey. No es el nombre accesible.
- `initials`: `string | null` = `null`. 1 o 2 grafemas tal cual (sin mayúsculas forzadas; admiten emoji). Máximo 2, 1 en xs/sm o con escritura ancha.
- `icon`: `string | null` = `null`. Nombre de Lucide elegido como dato (registro de la aplicación → librería). Un nombre que no resuelve cuenta como ausente (aviso 6).
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`. Lado = space × 5, 6, 8, 10, 16. Decide también el número de letras y el rol tipográfico.
- `shape`: `'circle' | 'square'` = `"circle"`. circle = persona; square = entidad. No lee --g-radius-shape.
- `color`: `'neutral' | GranaCategory | '${GranaCategory}' | null` = `null`. 'neutral' (gana a categories) o una categoría fija 1..12 (número o cadena numérica). Cualquier otro valor, semánticos incluidos, se ignora (aviso 3).
- `categories`: `0 | GranaCategory` = `0`. Cuántas categorías declara el tema (categories: N). Con n > 0 y sin color, la categoría se deriva de colorKey ?? name (FNV-1a UTF-8 + fmix32, mod n + 1). Fuera de 0..12 o no entero: 0 (aviso 4).
- `colorKey`: `string | number | null` = `null`. Clave estable del color (un id): el color no cambia al renombrar y dos homónimos pueden diferir.
- `label`: `string | null` = `null`. Sin valor, decorativo (aria-hidden). Con valor, role="img" + aria-label en la raíz. La <img> lleva siempre alt="".

### GAvatarMotion · `<g-avatar-motion>` · stable · `@grana/vue`

Avatar ilustrado que responde a estados semánticos (idle, thinking, success, error…): el consumidor dice qué ocurre y el avatar elige la coreografía. Decorativo por defecto; no es un icono.
(desde 1.0.0)

**Props**
- `state`: `'idle' | 'hover' | 'attention' | 'open' | 'thinking' | 'working' | 'success' | 'warning' | 'error'` = `"idle"`
- `idleLoop`: `boolean` = `false`
- `size`: `'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`
- `label`: `string | null` = `null`
**v-model**: `v-model:state` → `state`
**Eventos**
- `done` (`'success' | 'warning' | 'error'`): Termina una coreografía finita (o su pose, con movimiento reducido)
- `update:state` (`'idle'`): Tras done (efecto solo con v-model:state)

### GBadge · `<g-badge>` · stable · `@grana/vue`

Insignia no interactiva: texto, texto con figura de estado, icono, solo icono, solo figura y contador con tope; anclada a otro elemento; variantes solid, soft, outline y glass (liquid glass).
(desde 1.0.0)

**Props**
- `variant`: `'solid' | 'soft' | 'outline' | 'glass'` = `"soft"`
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"neutral"`
- `size`: `'sm' | 'md' | 'lg'` = `"md"`
- `count`: `number | null` = `null`
- `max`: `number` = `99`
- `showZero`: `boolean` = `false`
- `shape`: `'circle' | 'square' | 'diamond' | 'triangle' | null` = `null`
- `label`: `string | null` = `null`
- `placement`: `'top-end' | 'top-start' | 'bottom-end' | 'bottom-start'` = `"top-end"`
**Slots**
- `default`: Texto de la insignia (una línea, sin interactivos)
- `icon`: Icono decorativo (aria-hidden), delante del texto o solo
- `anchor`: Elemento destino: convierte la raíz en el envoltorio g-badge-anchor; la insignia va en una esquina

### GBookingBar · `<g-booking-bar>` · stable · `@grana/vue/booking`

Consulta de disponibilidad (estancia, mesa o recorrido) que emite una intención y no hace la reserva: A · La frase (por defecto, la plantilla de la aplicación con huecos), la barra (una fila que, si no cabe, pasa a resumen + hoja) y B · El muelle opcional. Valida al enviar, dice lo que falta y distingue la noche agotada del día de salida.
(desde 1.0.0)

**Props**
- `kind`: `'stay' | 'table' | 'tour'` = `"stay"`. stay = llegada + salida (noches en la frase) + grupo; table = fecha + turno + grupo; tour = recorrido + fecha + grupo.
- `modelValue`: `BookingQuery | null` = `null`. La consulta (v-model): stay { from, to, party }; table { date, time, party }; tour { tour, date, party }. Fechas ISO sin zona. Las noches se derivan. Forma inválida: vacío y aviso 4.
- `appearance`: `'phrase' | 'bar'` = `"phrase"`. phrase (A) o bar. Sin labels.phrase o sin un marcador del kind, se pinta bar (aviso 6). guided reservado (aviso 9).
- `dock`: `boolean` = `false`. B · El muelle: aparece cuando la consulta sale del visor por arriba (alto de contrato, EDGE_ORDER.bookingDock, cola del documento #757).
- `title`: `string` = `null` (obligatoria). Título (nombre del search). Obligatorio (aviso 1).
- `headingLevel`: `2 | 3 | 4 | null` = `null`. Nivel del título; sin él, el de GSection o 2.
- `partyRows`: `PartyRow[]` = `null` (obligatoria). Filas de GPartyField (aviso 2).
- `min`: `string | null` = `null`. Fecha mínima ISO.
- `max`: `string | null` = `null`. Fecha máxima ISO.
- `disabledDates`: `((iso: string, query: BookingQuery) => boolean)` = `null`. (iso, query) => boolean: día no disponible (recibe la consulta).
- `disabledNights`: `((iso: string, query: BookingQuery) => boolean)` = `null`. Solo stay: (iso, query) => boolean, la noche que empieza iso está agotada (#739). Una noche agotada dentro: error con la fecha; salir un día agotado es válido.
- `minNights`: `number` = `1`. Solo stay: noches mínimas.
- `maxNights`: `number | null` = `null`. Solo stay: noches máximas.
- `times`: `BookingTime[] | ((date: string | null) => BookingTime[])` = `null`. table: [{ value: 'HH:mm', label?, disabled? (Boolean o motivo) }] o (date) => Array; los llenos, deshabilitados con el sufijo de texto (aviso 3 sin ellos).
- `tours`: `BookingTour[]` = `null`. tour: [{ value, label, description?, disabled? }] (aviso 3 sin ellos).
- `quickDays`: `number` = `0`. En la frase, el hueco de fecha ofrece n días desde hoy (o min) con Intl.RelativeTimeFormat y «Otro día» (labels.otherDay) que abre el calendario.
- `names`: `{ from?: string; to?: string; nights?: string; date?: string; time?: string; tour?: string; party?: string }` = `{}`. { from?, to?, nights?, date?, time?, tour?, party? }: nombre de cada oculto (siempre presentes); el grupo, {party}[{key}].
- `pending`: `boolean` = `false`. La aplicación consulta: GBtn loading con loadingText = labels.pending. No bloquea la edición.
- `disabled`: `boolean` = `false`. Todo deshabilitado (campos, huecos, acción, muelle).
- `locale`: `string | null` = `null`. BCP 47; sin él, el lang del ancestro.
- `labels`: `GranaLabels` = `{}`. Textos sin valores por defecto (#226; aviso 7): phrase, fields.{from|to|nights|date|time|tour|party}, empty.*, nights (contado), checkout, noDates, noDate, noTime, noTour, separator, summaryTitle, change, submit, pending, close, done, otherDay, full, decrement, increment, errors.{dates|night|nights|date|time|tour}, missing (contado, {count} {list})., datePicker (textos que se pasan tal cual a los GDatePicker internos: prev, next, dialog, close…; #761).
- `id`: `string | null` = `null`. Base de los id; generado si no se da.
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`BookingQuery`): Cambia la consulta
- `submit` (`BookingSubmitEvent`): Envío válido (acción, Intro, muelle u hoja), síncrono en el gesto. Sin action, el envío nativo se cancela; con action, va salvo preventDefault()

### GBreadcrumbs · `<g-breadcrumbs>` · stable · `@grana/vue`

Migas de pan: dicen dónde está la página en una jerarquía y dejan subir a cualquier nivel. Forma A «Ruta líquida» (todos los niveles en una fila que se aprieta por prioridad; un nombre recortado se vuelve pastilla y el actual es la pastilla de acento), con la cara de B «Escalón» como última etapa («Subir · página» con la ruta entera como escalera) y las puertas de C cuando la aplicación da children (el separador abre los hermanos del nivel siguiente). Enlaces de verdad (<a href>) con navigate cancelable y slot link para un router; pistas del motor del tooltip en modo visual sobre lo recortado.
(desde 1.0.0)

**Props**
- `items`: `BreadcrumbItem[]` = `null` (obligatoria). Niveles de la raíz a la página actual: { label, href?, icon?, children? }. Sin href el nivel es texto (span, sin foco). icon: nombre de Lucide (registro de la aplicación → librería, #202); con slot icon manda el slot. children en el nivel i − 1 enciende una puerta delante del nivel i con los hermanos { label, href? }; en el último nivel no se pinta. El último nivel es siempre la página actual (aria-current="page"). Clave = índice; identidad para el movimiento = href o, sin él, label. Un nivel o un hijo sin label se ignora (aviso). Vacío o no arreglo: no se pinta nada.
- `labels`: `GranaLabels` = `{}`. Sin valores por defecto. nav (aria-label del nav; un aria-labelledby en los atributos lo sustituye), up («Subir a {label}», con dos o más niveles), path («Ruta hasta {label}», con dos o más niveles), children («Otras páginas en {label}», si hay puertas). Cada uno, cadena con {label} o función ({ label }) => String; up y path deben contener {label} (2.5.3).
**Eventos**
- `navigate` (`BreadcrumbsNavigateEvent`): Activación primaria de un destino con página (clic con el botón 0 sin Ctrl, ⌘, Mayús ni Alt, o Intro; #505). item es el nivel, o el hijo si from es 'door'; index es la posición en items del nivel destino (con 'door', la del nivel delante del cual está la puerta); event es el evento nativo, cancelable (preventDefault deja la navegación a un router); from: 'path' (la fila), 'up' («Subir»), 'stairs' (la escalera) o 'door' (una puerta). Desde un panel, el panel se cierra y el foco vuelve a su disparador antes de emitir. Con el slot link se emite aunque el router ya haya cancelado (event.defaultPrevented verdadero).
**Slots**
- `link`: Sustituye el <a> de cada destino con página (fila, «Subir», escalera y puertas), p. ej. RouterLink o NuxtLink. Un solo enfocable con v-bind="attrs" (href, class, aria-current, aria-label en «Subir», onClick que emite navigate y cierra el panel) y <component :is="content" /> como único contenido. Los niveles sin href no pasan por el slot.
- `icon`: Icono de un nivel dentro de g-breadcrumbs__icon (aria-hidden, decorativo); sustituye al GIcon por nombre de item.icon (#202). Solo en los niveles con icon.
**Claves de `labels`**: `nav`, `up`, `path`, `children`

### GBtn · `<g-btn>` · stable · `@grana/vue`

Botón de acción; se renderiza como enlace si recibe href.
(desde 1.0.0)

**Props**
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`
- `variant`: `'solid' | 'soft' | 'outline' | 'ghost' | 'link'` = `"solid"`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `block`: `boolean` = `false`
- `disabled`: `boolean` = `false`
- `loading`: `boolean` = `false`
- `type`: `'button' | 'submit' | 'reset'` = `"button"`
- `href`: `string | null` = `null`
- `icon`: `boolean` = `false`
- `loadingText`: `string | null` = `null`
- `tooltip`: `string | null` = `null`. Atajo de <GTooltip :text> con todo lo demás por defecto (#390). Envuelto por un GTooltip como hijo directo, gana el envoltorio y avisa en desarrollo
- `done`: `boolean` = `false`. v-model:done. La aplicación afirma el éxito: dispara el acuse en su flanco de false a true (#1011). Con carga efectiva espera a la llegada; se ignora con href
- `doneText`: `string | null` = `null`. Se anuncia en g-btn__status durante el acuse; no se ve
**v-model**: `v-model:done` → `done`
**Eventos**
- `click` (`MouseEvent`): Activación con puntero o teclado, nunca con disabled o carga efectiva (loading y su cola del mínimo)
- `update:done` (`boolean`): Siempre false: al retirarse el acuse por tiempo, clic, loading o disabled, y al montar con done. No sale si la aplicación ya lo puso en false, ni al desmontar
**Slots**
- `default`: Etiqueta, o el icono si icon
- `prepend`: Icono decorativo antes de la etiqueta
- `append`: Icono decorativo después de la etiqueta

### GCalendar · `<g-calendar>` · stable · `@grana/vue`

Calendario y planificador genérico de uno o varios recursos: Día, Semana, Mes y Timeline. Representa y manipula tiempo; emite solicitudes, no muta.
(desde 1.0.0)

**Props**
- `events`: `CalendarEvent[]` = `[]`
- `resources`: `Array<{ id: GranaKey; label?: string; [key: string]: unknown }> | null` = `null`
- `availability`: `Array<Record<string, unknown>>` = `[]`
- `blocks`: `Array<Record<string, unknown>>` = `[]`
- `view`: `'day' | 'week' | 'month' | 'timeline'` = `"week"`
- `date`: `Date | string | null` = `null`
- `selectedEventId`: `string | number | null` = `null`
- `timezone`: `string | null` = `null`
- `locale`: `string | null` = `null`
- `weekStartsOn`: `number` = `1`
- `hour12`: `boolean` = `false`
- `startHour`: `number` = `7`
- `endHour`: `number` = `22`
- `gridInterval`: `number` = `30`
- `snapInterval`: `number` = `5`
- `density`: `'compact' | 'comfortable' | 'spacious'` = `"comfortable"`
- `editable`: `boolean` = `false`
- `draggable`: `boolean | null` = `null`
- `resizable`: `boolean | null` = `null`
- `readonly`: `boolean` = `false`
- `disabled`: `boolean` = `false`
- `loading`: `boolean` = `false`
- `error`: `string | null` = `null`
- `showNowIndicator`: `boolean` = `true`
- `now`: `Date | string | null` = `null`
- `refreshInterval`: `number` = `60000`
- `monthMaxVisibleEvents`: `number` = `3`
- `detectConflicts`: `boolean` = `true`
- `labels`: `GranaLabels` = `{}`
- `label`: `string | null` = `null`
- `id`: `string | null` = `null`
**v-model**: `v-model:view` → `view`, `v-model:date` → `date`, `v-model:selectedEventId` → `selectedEventId`
**Eventos**
- `update:view` (`string`): Cambia la vista
- `update:date` (`Date`): Navega; Date en la medianoche del día, en la zona del calendario
- `update:selectedEventId` (`string | null`): Se selecciona o se deselecciona un evento
- `range-change` (`{ start: Date; end: Date; view: string; timezone: string }`): Cambia el rango visible (también al montar); end es exclusivo
- `create-request` (`{ resourceId: any; start: any; end?: any; timezone: any; source: any }`): Clic o arrastre en un hueco, o el botón de teclado
- `event-move-request` (`{ event: any; resourceId: any; previousStart: any; previousEnd: any; newStart: any; newEnd: any; newResourceId: any; conflicts: any }`): Se suelta un evento arrastrado o Alt+flecha
- `event-resize-request` (`{ event: any; resourceId: any; previousEnd: any; newEnd: any; conflicts: any }`): Se suelta el tirador o Shift+flecha
- `event-click` (`{ event: any; resourceId: any }`): Clic, toque o Enter sobre un evento
- `event-double-click` (`{ event: any; resourceId: any }`): Doble clic
- `conflict` (`{ type: any; event: any; conflicts: any }`): Una solicitud tiene conflictos (además de la solicitud)
- `block-conflict` (`{ block: any; impactedEvents: any }`): Un bloqueo recibido cubre eventos existentes
- `resource-click` (`{ resourceId: any }`): Clic sobre un recurso
- `date-click` (`{ date: any }`): Clic sobre un día del Mes
- `time-click` (`{ resourceId: any; start: any }`): Clic sobre una hora vacía
- `more-events-click` (`{ date: any; hidden: any }`): Clic en +N
- `retry`: Botón de reintento del estado de error
**Slots**
- `resource`: Cabecera de un recurso. Alcance: { resource }
- `event`: Sustituye todo el contenido del evento. Alcance: { event, resource, segment }. Sin interactivos
- `event-content`: Contenido interior del evento. Alcance: { event, resource, segment }. Sin interactivos
- `day-header`: Encabezado de un día. Alcance: { date }
- `month-day`: Contenido adicional de una celda del Mes. Alcance: { date, events }
- `all-day-event`: Evento de día completo. Alcance: { event }
- `detail`: Detalle del evento seleccionado. Alcance: { event, resource, close }
- `toolbar-end`: Contenido extra al final de la barra
- `empty`: Estado vacío

### GCard · `<g-card>` · stable · `@grana/vue`

Superficie de contenido contenida (compone GSurface) con regiones opcionales por slots y props de atajo; acción principal por enlace estirado dentro del título (link, button, toggle o select), menú de acciones con GMenu, estado de contenido, vacío, esqueleto derivado de las regiones y adaptación medida por su propio ancho.
(desde 1.0.0)

**Props**
- `as`: `'article' | 'li' | 'div' | 'section'` = `"article"`
- `level`: `'flat' | 'outlined' | 'raised' | 'inset'` = `"outlined"`
- `padding`: `'xs' | 'sm' | 'md' | 'lg'` = `"md"`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `color`: `'brand' | 'accent' | 'neutral'` = `"brand"`
- `orientation`: `'vertical' | 'horizontal' | 'auto'` = `"vertical"`
- `mediaPosition`: `'top' | 'start' | 'end' | 'background' | 'inline'` = `"top"`
- `eyebrow`: `string | null` = `null`
- `title`: `string | null` = `null`
- `subtitle`: `string | null` = `null`
- `description`: `string | null` = `null`
- `headingLevel`: `2 | 3 | 4 | 5 | 6` = `3`
- `titleLines`: `1 | 2 | 3 | 4 | 'none'` = `2`
- `descriptionLines`: `1 | 2 | 3 | 4 | 'none'` = `"none"`
- `expandable`: `boolean` = `false`
- `badge`: `string | number | null` = `null`
- `badgeColor`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"neutral"`
- `meta`: `CardMeta[]` = `[]`. [{ label, value, priority?: "high" | "low" }]; los de priority "low" no se renderizan con density="compact"
- `menu`: `MenuItem[]` = `[]`. items de GMenu (menu.md)
- `status`: `'info' | 'success' | 'warning' | 'error' | null` = `null`
- `statusText`: `string | null` = `null`. Obligatorio con status
- `retryable`: `boolean` = `false`. Solo con status="error"
- `empty`: `boolean` = `false`
- `loading`: `boolean` = `false`
- `skeleton`: `Record<string, boolean | number> | null` = `null`. { media, lead, eyebrow, subtitle, badge, menu: Boolean; descriptionLines: 0-6; meta, actions: Number; footer: Boolean }
- `disabled`: `boolean` = `false`
- `interaction`: `'auto' | 'none' | 'link' | 'button' | 'toggle' | 'select'` = `"auto"`. auto = link con href, none sin href
- `href`: `string | null` = `null`
- `target`: `string | null` = `null`
- `rel`: `string | null` = `null`. Con target="_blank" y sin rel: "noopener noreferrer"
- `current`: `boolean` = `false`. Solo con enlace: aria-current="true"
- `modelValue`: `boolean | unknown[] | string | number` = `false`. checkbox/toggle sin value: Boolean; checkbox con value: Array; radio: valor elegido (modelValue === value)
- `selectable`: `boolean` = `false`. Casilla explícita antes del título en una tarjeta link o button
- `selectType`: `'checkbox' | 'radio'` = `"checkbox"`
- `name`: `string | null` = `null`
- `value`: `string | number | null` = `null`
- `labels`: `GranaLabels` = `{}`. Ver labels; sin valores por defecto
- `id`: `string | null` = `null`. Generado si falta
**v-model**: `v-model` → `modelValue`
**Eventos**
- `navigate` (`{ event: any; href: any }`): interaction="link": el usuario activa el enlace principal; event.preventDefault() (síncrono) evita la navegación (router). No se emite con disabled ni loading, ni sin activación primaria (#505: con Ctrl/⌘/Mayús/Alt, botón central o ya cancelado; el navegador abre la pestaña nueva)
- `activate` (`{ event: any }`): interaction="button": el usuario activa el botón principal
- `update:modelValue` (`boolean | unknown[] | string | number`): El usuario marca o desmarca (select, toggle, selectable); nunca con disabled ni loading
- `action` (`{ id: GranaKey; checked?: boolean }`): El usuario elige un elemento del menú (GMenu)
- `retry` (`{ event: any }`): El usuario pulsa «Reintentar» (status="error" + retryable)
- `expand` (`{ expanded: any; region: 'description' | 'more' }`): Se despliega o pliega la descripción recortada o la región more
**Slots**
- `media`: Imagen, vídeo, mapa, gráfico; decorativa (aria-hidden) salvo que el contenido lleve role="img"
- `lead`: Icono o avatar del consumidor (decorativo)
- `eyebrow`: Categoría con contenido rico
- `title`: Título con contenido rico (sustituye a title); la tarjeta lo envuelve con la principal
- `subtitle`: Subtítulo con contenido rico
- `description`: Descripción con contenido rico
- `badge`: Sustituye al badge
- `default`: Contenido libre (GMetric, GProgress, GDataList, gráfico con role="img")
- `status`: Sustituye al icono y al texto del aviso (mantiene el rol)
- `empty`: Estado vacío; sustituye a labels.empty y al slot default
- `meta`: Metadata con estructura propia (sustituye a la lista de meta)
- `more`: Región secundaria que se pliega en narrow (con labels.more y labels.less)
- `actions`: Acciones (GBtn); anclado al fondo
- `footer`: Pie a sangre con línea fina
- `loading`: Esqueleto propio: sustituye solo el cuerpo del esqueleto; decorativo
**Métodos**
- `readonly size: string`: Tamaño resuelto de la tarjeta (solo lectura)
- `readonly layout: string`: Disposición resuelta de la tarjeta (solo lectura)
**Claves de `labels`**: `menu`, `loading`, `loaded`, `expand`, `collapse`, `more`, `less`, `retry`, `empty`

### GCardGroup · `<g-card-group>` · stable · `@grana/vue/card-group`

Fila de tarjetas de métrica que filtran la región de debajo (casi siempre una GTable). Coordina las GCard hijas: exclusividad (o varias con multiple), una sola parada de Tab (role="toolbar", foco itinerante) y la cifra en la descripción del botón. Siempre se puede soltar. Con el slot panel, A «Lengüeta»: las tarjetas se apoyan en el marco de la región y un puente une la pulsada al marco.
(desde 1.0.0)

**Props**
- `modelValue`: `string | number | null | Array<string | number>` = `null`. v-model. Sin multiple: el value de la tarjeta pulsada o null. Con multiple: arreglo de value ([] sin ninguna, nunca null), en el orden de las tarjetas en el DOM y con los valores desconocidos conservados al final. Igualdad ===. Un tipo distinto al modo avisa (G7).
- `multiple`: `boolean` = `false`. Varias tarjetas pulsadas a la vez (un filtro in con varios valores).
- `label`: `string | null` = `null`. Nombre de la barra (aria-label de g-card-group__strip, role="toolbar"). Uno de label/labelledby es obligatorio (G1).
- `labelledby`: `string | null` = `null`. Id de un elemento visible que nombra la barra (aria-labelledby).
- `controls`: `string | null` = `null`. Id de la región que se filtra: aria-controls en cada botón gestionado. Sin él y con el slot panel, el id del panel (ID-panel). Un id que no existe tras montar avisa (G9).
- `id`: `string | null` = `null`. Id de la raíz (generado si falta). El panel es ID-panel.
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`string | number | null | Array<string | number>`): La persona alterna una tarjeta gestionada (clic, toque, Espacio, Intro). Las flechas no emiten; una tarjeta disabled o loading no emite
- `change` (`{ value: string | number; pressed: boolean }`): El mismo gesto, después de update:modelValue: value de la tarjeta alternada y su estado nuevo. No cancelable. Un cambio de modelValue desde fuera no lo emite
**Slots**
- `default`: Las GCard (gestionadas: con value e interaction auto o toggle; el resto, estáticas y fuera de la parada). Dentro de la barra
- `panel`: La región que se filtra (la GTable con su GFilterBar) y nada más; activa la lengüeta. Alcance: { filtered }

### GCheckbox · `<g-checkbox>` · stable · `@grana/vue`

Casilla de verificación con tres estructuras (default, card, chip), estado mixto, ayuda y error.
(desde 1.0.0)

**Props**
- `modelValue`: `boolean | unknown[]` = `false`
- `value`: `string | number | null` = `null`
- `indeterminate`: `boolean` = `false`
- `layout`: `'default' | 'card' | 'chip'` = `"default"`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`
- `disabled`: `boolean` = `false`
- `readonly`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `required`: `boolean` = `false`. #270: aria-required="true" en el <input>, nunca el atributo nativo required (Chromium expone una casilla obligatoria sin marcar como inválida antes de interactuar). Marca según la convención de GForm. Con field: false se ignora
- `mark`: `boolean | null` = `null`. false quita la marca de la convención de GForm (C3)
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`. Advertencia: no bloquea ni pone aria-invalid (C5)
- `valid`: `string | null` = `null`. Mensaje de válido útil (C5)
- `field`: `boolean` = `true`. #262. false = control suelto dentro de otro componente (filas de GTranscript): sin región g-checkbox__message ni aria-live, sin contexto de GForm (no se registra ni hereda density, readonly, disabled, errores ni marcas), sin required; error, warning, valid, required y mark se ignoran con aviso en desarrollo. Se lee al crear la casilla
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`, `v-model:indeterminate` → `indeterminate`
**Eventos**
- `update:modelValue` (`boolean | unknown[]`): El usuario alterna la casilla (no con readonly)
- `update:indeterminate` (`false`): El usuario activa una casilla indeterminada
**Slots**
- `label`: Etiqueta con contenido rico (sustituye a label)
- `hint`: Ayuda o descripción con contenido rico (sustituye a hint)
- `error`: Mensaje de error con contenido rico; solo se muestra con error (en la región __message)
- `icon`: Icono decorativo de la tarjeta (solo layout card)
- `meta`: Dato destacado de la tarjeta, parte del nombre accesible (solo layout card)

### GCheckboxGroup · `<g-checkbox-group>` · stable · `@grana/vue`

Grupo de casillas con modelo de arreglo, casilla maestra derivada de las hijas y conteo en región viva.
(desde 1.0.0)

**Props**
- `modelValue`: `Array<string | number | boolean>` = `[]`
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`. Advertencia: no bloquea ni pone aria-invalid (C5)
- `valid`: `string | null` = `null`. Mensaje de válido útil (C5)
- `required`: `boolean` = `false`. Marca de la pregunta en el legend (C3)
- `mark`: `boolean | null` = `null`. false quita la marca de la convención de GForm (C3)
- `name`: `string | null` = `null`. Clave del grupo en errors y name por defecto de sus casillas (C11)
- `selectAll`: `boolean` = `false`
- `selectAllLabel`: `string | null` = `null`
- `countText`: `(...args: any[]) => any | null` = `null`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`
- `layout`: `'default' | 'card' | 'chip'` = `"default"`
- `disabled`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`unknown[]`): El usuario alterna una hija o la maestra
**Slots**
- `default`: Las casillas hijas (GCheckbox con value)
- `label`: Título del grupo con contenido rico (sustituye a label)
- `hint`: Ayuda del grupo con contenido rico
- `error`: Mensaje de error con contenido rico; solo se muestra con error (en la región __message)

### GCombobox · `<g-combobox>` · stable · `@grana/vue/combobox`

Campo para elegir una opción de un catálogo grande escribiendo (paciente entre miles, diagnóstico CIE-10, medicamento). APG «Combobox with list autocomplete» sobre GInput. A · el campo se abre (appearance="field"): campo y lista son una sola forma y la primera coincidencia por prefijo se completa como texto fantasma. B · paleta con vista previa (appearance="palette"; con el visor ≤ 520px, siempre, como hoja): un GDialog real con su propio campo y la ficha de la opción activa. C · el valor es un objeto: en reposo el campo enseña la ficha de lo elegido y distingue el texto libre. Sin fetch: emite search, more y create; la aplicación entrega options, loading, total, loadError y selectedOption.
(desde 1.0.0)

**Props**
- `modelValue`: `string | number | null | Array<string | number>` = `"null"`. El value de la opción elegida (===). Nunca cambia de tipo: el texto libre va en custom (#331). Con multiple (#420): Array en orden de elección, nunca null (null/undefined/'' = []; otro no arreglo = [v] con aviso 14; repetidos una vez); cada emisión es un arreglo nuevo
- `custom`: `string | string[]` = `"''"`. v-model:custom. El texto libre cuando el valor no es una opción; solo actúa con allowCustom. Con modelValue a la vez gana modelValue (aviso). Con multiple: textos libres recortados, sin repetir (sin acentos ni mayúsculas), conviven con los valores; se pintan, leen y envían después de los valores
- `options`: `Array<ComboboxOption | ComboboxOptionGroup>` = `"[]"`. Opciones { value, label, description?, code?, facts?, avatar?, icon?, disabled? } y grupos { label, options } sin anidar. Campos de más llegan a los slots
- `selectedOption`: `ComboboxOption | null` = `"null"`. La opción de modelValue cuando no está en options (búsqueda remota); si su value no es modelValue, se ignora y avisa
- `appearance`: `'field' | 'palette' | 'command'` = `"field"`. field = A (la lista es el interior del campo abierto). palette = B (superficie modal con vista previa). Con el visor ≤ 520px siempre la superficie (hoja, sin vista previa). Cambiarla con la lista abierta la cierra. command (#1056) = superficie de búsqueda sin campo en la página ni valor: se abre con open() y elegir emite select y cierra
- `filter`: `boolean | ((option: ComboboxOption, query: string) => boolean)` = `"true"`. true: filtro propio (todas las palabras, sin acentos ni mayúsculas, sobre label, code, description y valores de facts). Función (option, query) => Boolean. false: filtra la aplicación; solo entonces abrir emite search(''), «Mostrar más» emite more, total cuenta y existe la búsqueda pendiente (#332)
- `loading`: `boolean` = `"false"`. Indicador de GInput y aria-busy en el listbox; no vacía la lista ni bloquea
- `total`: `number | null` = `"null"`. Con filter: false, resultados en el servidor; si es mayor que las opciones entregadas aparece «Mostrar más»
- `loadError`: `string` = `"undefined"`. Error de carga: en el panel, con fila «Reintentar» y anuncio; no marca el campo inválido
- `minChars`: `number` = `"0"`. Con 1 a minChars − 1 caracteres no se emite search ni se pinta lista: labels.minChars
- `delay`: `number` = `"250"`. Antirrebote de search al escribir (ms); 0 lo desactiva. Abrir (sin escribir) y «Reintentar» emiten sin esperar
- `limit`: `number` = `"50"`. Filas pintadas con filtro local y cuántas añade «Mostrar más»
- `allowCustom`: `boolean` = `"false"`
- `customName`: `string` = `"undefined"`. name de un segundo oculto con el texto libre
- `creatable`: `boolean` = `"false"`. Fila «Agregar «texto»…» (con labels.create): emite create; no cambia el valor
- `clearable`: `boolean` = `"false"`. Botón de limpiar con valor (con labels.clear); ausente en solo lectura y deshabilitado
- `labels`: `GranaLabels` = `"{}"`. Sin valores por defecto (#226): ver labels
- `name`: `string` = `"undefined"`. Va al oculto del value y registra el campo en GForm; el <input> visible no lleva name
- `label`: `string` = `"undefined"`
- `hint`: `string` = `"undefined"`
- `error`: `string` = `"undefined"`
- `warning`: `string` = `"undefined"`
- `valid`: `string` = `"undefined"`
- `required`: `boolean` = `"false"`. Marca y aria-required="true"; nunca required nativo (#334)
- `mark`: `boolean` = `"undefined"`
- `readonly`: `boolean` = `"undefined → false"`. readonly nativo + aria-readonly; enfocable, no abre, sin limpiar ni flecha, se envía (#266)
- `disabled`: `boolean` = `"undefined → false"`. Nativo en el visible y en los ocultos (no se envía)
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `variant`: `'outline' | 'soft'` = `"outline"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"undefined → contexto o default"`
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"undefined"`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill'` = `"undefined"`
- `block`: `boolean` = `"undefined → false"`
- `id`: `string` = `"generado"`
- `multiple`: `boolean` = `"false"`. Fase 2 (#338, #417). Se lee al montar: cambiarlo después no tiene efecto (aviso 13); para cambiar de modo, la key
- `selectedOptions`: `ComboboxOption[]` = `"[]"`. Con multiple: las opciones de los value elegidos que no están en options (búsqueda remota); las que no son de modelValue se ignoran
- `selection`: `'inline' | 'list'` = `"inline"`. Con multiple: dónde viven los elegidos en reposo. inline = A, la frase; list = B, la receta (slot interno below de GInput, N5). Con palette decide igual el reposo (#426)
- `numbered`: `boolean` = `"false"`. Numera los renglones de la receta y de la cesta (cuenta solo los vivos; se lee). Sin renglones (inline + field), aviso 15
- `max`: `number` = `"undefined (sin límite)"`. Entero ≥ 1, con multiple (#422): lleno = is-full, no elegidas aria-disabled pero recorribles, estado g-combobox__status--max y anuncio labels.max; más elegidos que max se pintan y envían enteros (aviso 16)
**v-model**: `v-model` → `modelValue`, `v-model:custom` → `custom`
**Eventos**
- `update:modelValue` (`string | number | null | Array<string | number>`): Se elige una opción distinta; se limpia; al salir con el texto vacío; al confirmar un texto libre (null). Solo si cambia
- `update:custom` (`string | string[]`): Se confirma un texto libre; se elige una opción, se limpia o se vacía (''). Solo si cambia
- `change` (`ComboboxChange | ComboboxMultipleChange`): Una vez por cambio confirmado, después de los update:*; option es la opción elegida o null. Con multiple (#421): una vez por gesto (marcar, desmarcar, texto libre, Retroceso, «Quitar», «Quitar todas», Ctrl/⌘+Z, «Deshacer»); added/removed son elementos { value, custom, option }; options alineado con value (null si no se conoce)
- `search` (`string`): Al escribir tras delay (también con filtro local, informativo); al abrir sin escribir con filter: false; con «Reintentar»
- `more` (`string`): «Mostrar más» con filter: false
- `create` (`string`): Fila «Agregar «texto»…»; el foco ya volvió al campo
- `open`: El panel o la superficie pasan a verse
- `close`: Dejan de verse, por el motivo que sea
- `select` (`{ option: any; event: any }`): Solo en command (#1056): Intro sobre la activa o clic en una opción; event es el keydown o click nativo. Después la superficie se cierra (siempre). Sin update:modelValue, update:custom ni change
**Slots**
- `label`: El de GInput
- `hint`: El de GInput
- `error`: El de GInput (mensaje del campo)
- `prepend`: Icono decorativo del campo; coco lo oculta mientras hay ficha
- `option`: Contenido de una fila de opción (dentro del li role=option; sin interactivos; debe conservar el texto que distingue)
- `lead`: Hueco inicial de una opción en fila, ficha y vista previa: pasa al slot lead de la GSummary (decorativo); manda sobre avatar/icon
- `value`: Contenido de la ficha en reposo (aria-hidden, una línea); por defecto, GSummary inline · con multiple no aplica (aviso 15)
- `preview`: Ficha de la opción activa en la paleta; por defecto, GSummary stack; nunca la única fuente del dato que distingue (#335) · con multiple en palette no se pinta: la cesta ocupa su sitio (aviso 15)
- `empty`: Estado sin resultados (el anuncio sigue usando labels.noResults)
- `load-error`: Estado de error de carga (la fila «Reintentar» y el anuncio se conservan)
- `chosen`: Con multiple: contenido de un renglón de la receta (B) y de la cesta (C); option null con texto libre. Por defecto, GSummary row de dos líneas. Sin multiple, aviso 15
- `hints`: Solo en command: pie de la superficie con las teclas (texto visible, sin interactivos); oculto en la hoja móvil
**Métodos**
- `open(): void`: Solo en command (#1056): abre la superficie con el foco en la búsqueda y la última búsqueda seleccionada; abierta, no hace nada; en otra appearance, aviso 19 y no abre
**Claves de `labels`**: `clear`, `close`, `loading`, `noResults`, `minChars`, `results`, `partial`, `more`, `retry`, `useCustom`, `custom`, `create`, `preview`, `previewEmpty`, `surfaceTitle`, `selected`, `about`, `customItem`, `added`, `removed`, `restored`, `clearedAll`, `restoredAll`, `armed`, `already`, `max`, `ofMax`, `chosen`, `rest`, `showAll`, `showLess`, `done`, `remove`, `undo`, `trace`, `fresh`, `basketEmpty`

### GContainer · `<g-container>` · stable · `@grana/vue`

Contenedor de página: pone los límites en línea del contenido (ancho máximo, centrado, margen fluido y elemento) midiendo su sitio y no el visor. Un descendiente con g-bleed llega al borde de la caja con su contenido alineado a la columna; width="reading" y prose limitan la línea a la medida de lectura.
(desde 1.0.0)

**Props**
- `width`: `'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | 'reading'` = `"lg"`. Ancho máximo de la columna: space × 160 · 192 · 256 · 320 · 384; full sin máximo (la caja menos el margen); reading = 66ch de la fuente de la columna. --g-container-max en la raíz gana. Fuera de lista: aviso 1 y lg.
- `horizontal`: `'center' | 'start'` = `"center"`. center reparte el sobrante; start deja el margen al inicio lógico y el sobrante al final. Con width="full" no tiene efecto (aviso 2).
- `gutter`: `'auto' | 'none' | 'sm' | 'md' | 'lg'` = `"auto"`. Margen lateral fluido (clamp con cqi de la caja y el área segura). auto = md arriba y 0 anidado (dentro de otro contenedor, de GSurface o de GDialog). Uno explícito siempre gana. Fuera de lista: aviso 4 y auto.
- `as`: `'div' | 'main' | 'section' | 'article'` = `"div"`. Elemento de la raíz; no añade roles ni nombres (los aria-* van a la raíz por $attrs). main solo sin GAppShell (aviso 3). Fuera de lista: aviso 4 y div.
- `prose`: `boolean` = `false`. A · Medida: la prosa de la columna (p, listas, blockquote, h1–h6, figcaption, address) se queda en 66ch alineada al inicio; excluye lo de dentro de un componente de Grana, de una tabla y de .g-wide.
**Slots**
- `default`: El contenido de la página, en flujo normal dentro de la columna (.g-container__body). Bandas con g-bleed / g-bleed-raw y excepciones de prose con g-wide

### GDataList · `<g-data-list>` · stable · `@grana/vue`

Primitiva de widget: lista compacta de pares etiqueta–valor, con muestras de color decorativas opcionales.
(desde 1.0.0)

**Props**
- `rows`: `unknown[]` = `[]`
- `label`: `string | null` = `null`
- `swatches`: `boolean` = `false`

### GDatePicker · `<g-datepicker>` · stable · `@grana/vue`

Selector de una fecha o de un rango (valor ISO YYYY-MM-DD): un mes por defecto (dos con months="auto" si caben, o months=2), salto a mes y año desde el título (A · Zoom de escala), campo(s) con popover u hoja inferior en móvil, o solo la superficie en línea. Franja de rango continua que sigue fuera de lo visible, proximidad ± N días, superficie compacta con density, teclado APG y textos por labels.
(alias `GDatepicker`; desde 1.0.0)

**Props**
- `modelValue`: `string | DateRange | null` = `null`
- `mode`: `'single' | 'range'` = `"single"`
- `inline`: `boolean` = `false`
- `open`: `boolean` = `false`
- `min`: `string | null` = `null`
- `max`: `string | null` = `null`
- `disabledDates`: `((date: Date) => boolean) | null` = `null`
- `dayDescription`: `((iso: string) => string | null | undefined)` = `null`. (iso) => String (#778): se añade al aria-label del día tras los sufijos de estado (p. ej. formatPrice(...).spoken); vacío o no texto no añade nada. Con el slot day, la raíz lleva g-datepicker--day-content
- `disabledNights`: `((iso: string) => boolean) | null` = `null`. Solo range (#739): (iso) => boolean, la noche que empieza iso está agotada. Un día con la noche agotada no es inicio; un fin vale si ninguna noche entre medias está agotada; salir un día agotado es válido; sin inicio pendiente, un día agotado cuya noche anterior no lo está es «solo salida» (is-checkout-only + labels.checkoutOnly).
- `minNights`: `number | null` = `null`. Solo range (#739): noches mínimas (entero ≥ 1); un fin con menos no es elegible.
- `maxNights`: `number | null` = `null`. Solo range (#739): noches máximas (entero ≥ minNights); un fin con más no es elegible; la proximidad no la supera.
- `months`: `'auto' | 1 | 2` = `1`. #1021: un mes por defecto; `auto` mide y pone dos si caben
- `locale`: `string | null` = `null`
- `firstDay`: `number | null` = `null`
- `labels`: `GranaLabels` = `{}`. checkoutOnly (#739): sufijo del nombre del día «solo salida» (recomendado con disabledNights). r02 (#1025): chooseMonth, chooseYear (sufijo de los botones del título: «noviembre, elegir mes»), prevYear, nextYear (flechas en la vista de meses) y prevYears, nextYears (flechas en la vista de años) son requeridas (aviso de desarrollo único con las que falten, con o sin inline); viewMonths ({year}) y viewYears ({from}, {to}) nombran las rejillas de meses y años y anuncian el cambio de año o de página; typeYear es la pista visible de la vista de años; current y hasValue son sufijos del nombre de un mes o un año («…, actual», «…, contiene lo elegido»).
- `proximity`: `unknown[]` = `[]`
- `summary`: `boolean` = `true`
- `closeOnSelect`: `boolean | null` = `null`
- `anchor`: `string | Element | null` = `null`
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`
- `variant`: `'outline' | 'soft'` = `"outline"`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. El campo y la superficie, también con inline (#1022); sin valor: la región (density.md §1). Sin valor en la lógica: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `block`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `disabled`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `readonly`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`. Advertencia: no bloquea ni pone aria-invalid (C5)
- `valid`: `string | null` = `null`. Mensaje de válido útil (C5)
- `placeholder`: `string | null` = `null`
- `required`: `boolean` = `false`
- `mark`: `boolean | null` = `null`. false quita la marca de la convención de GForm (C3)
- `name`: `string | null` = `null`
- `id`: `string | null` = `null`
- `split`: `boolean` = `false`
- `labelStart`: `string | null` = `null`
- `labelEnd`: `string | null` = `null`
- `placeholderStart`: `string | null` = `null`
- `placeholderEnd`: `string | null` = `null`
- `output`: `string | null` = `null`. Valor calculado por la aplicación (C14, #180): <output> tras la fecha dentro de la caja; solo en modo campo (no inline, no split); no se envía
**v-model**: `v-model` → `modelValue`, `v-model:open` → `open`
**Eventos**
- `update:modelValue` (`string | DateRange | null`): El valor completo cambia: elegir en single, completar un rango, ampliar con proximidad, limpiar (null). Un inicio pendiente NO lo emite
- `change` (`string | DateRange | null`): Igual que update:modelValue
- `start` (`{ date: any }`): Solo range: se elige el inicio (pendiente)
- `navigate` (`{ month: any }`): Cambia el mes visible (botones, teclado, deslizamiento); también al bajar desde la vista de meses con otro primer mes (r02). Recorrer meses o años sin bajar no emite
- `update:open` (`boolean`): El popover se abre o se cierra
- `open`: El popover se abre
- `close`: El popover se cierra, por el motivo que sea
**Slots**
- `label`: Etiqueta con contenido rico (sustituye a label)
- `hint`: Ayuda con contenido rico
- `error`: Mensaje de error con contenido rico; solo se muestra con error (en la región __message)
- `trigger`: Sustituye al campo por el botón de la aplicación. Alcance: { id, expanded, controls, toggle, open, close, value, text }. La aplicación pone aria-haspopup, aria-expanded, aria-controls y llama a toggle
- `summary`: Sustituye al resumen. Alcance: { start, end, pending, days }
- `day`: Contenido tras el número del día. Alcance: { date, day, selected, inRange, disabled, outside }. No cambia el nombre accesible ni el tamaño
- `icon`: Icono del campo (sustituye al calendario dibujado); decorativo
**Métodos**
- `open(): void`: Abre el calendario
- `close(): void`: Cierra el calendario
- `focus(): void`: Enfoca el campo

### GDialog · `<g-dialog>` · stable · `@grana/vue`

Diálogo modal genérico con carcasa exterior y superficie inset interior: simple, con pie, secciones, scroll, confirmación, formulario, pantalla completa y adaptativo.
(desde 1.0.0)

**Props**
- `modelValue`: `boolean` = `false`
- `title`: `string | null` = `null`
- `description`: `string | null` = `null`
- `size`: `'sm' | 'md' | 'lg'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `inset`: `boolean` = `true`
- `fullscreen`: `boolean` = `false`
- `bare`: `boolean` = `false`. Visor a pantalla completa (#732): sin encabezado (ni título, descripción, icono ni cierre propio), sin inset ni relleno de carcasa; el slot por defecto llena la carcasa. Nombre por aria-label/aria-labelledby o, si no, title como aria-label. El cierre es del contenido (close() del alcance). footer y tabs se ignoran (aviso 7). Pensado con fullscreen.
- `placement`: `'center' | 'end'` = `"center"`
- `mobile`: `'sheet' | 'full-width' | 'fullscreen'` = `"sheet"`
- `role`: `'dialog' | 'alertdialog'` = `"dialog"`
- `closeLabel`: `string | null` = `null`
- `closeOnBackdrop`: `boolean` = `true`
- `loading`: `boolean` = `false`
- `id`: `string | null` = `null`
- `from`: `string | HTMLElement | null` = `null`. A quién vuelve el foco al cerrar y origen de D1 (#583). Vivo (#732): si cambia con el diálogo abierto, al cerrar se resuelve otra vez y el foco va al valor vigente (si ya no es usable, el retorno nativo); el origen de D1 sigue siendo el de la apertura.
- `steps`: `unknown[] | null` = `null`
- `labels`: `GranaLabels` = `"{}"`
**v-model**: `v-model` → `modelValue`, `v-model:steps` → `steps`
**Eventos**
- `update:modelValue` (`boolean`): El usuario cierra y nadie impidió el dismiss (siempre false); también ante un cierre nativo con el prop en true
- `dismiss` (`DialogDismissEvent`): Esc (no con la tecla repetida), clic en el fondo (solo sin is-stacked) o botón de cierre; reason: escape | backdrop | close. Cancelable; depth: cuántos pasos hay en el historial en modo pasos (1 sin pasos)
- `open`: El diálogo ya se muestra
- `closed`: El diálogo ya se cerró, por el motivo que sea
- `step` (`DialogStepEvent`): El diálogo cambia de paso (dialog.md §B, #584): from (paso de antes o null), to, direction forward | back, reason push | back | escape | trail y result (lo que devuelve el nivel al volver)
- `update:steps` (`string[]`): El historial de pasos cambia desde dentro del diálogo (push, back, Esc, rastro); con v-model:steps o sin él
**Slots**
- `default`: Cuerpo. Alcance: { close, push, back, backTo, steps } (los cuatro últimos, del modo pasos; dialog.md §«Niveles anidados» B)
- `footer`: Acciones. Alcance: { close, push, back, backTo, steps }. Solo se renderiza si existe; en modo pasos no se usa (el pie es el del paso actual)
- `title`: Título con contenido rico (sustituye a title)
- `description`: Descripción con contenido rico (sustituye a description)
- `header`: Sustituye título y descripción. Alcance: { titleId, descriptionId }
- `icon`: Icono decorativo antes del título (aria-hidden)
- `tabs`: Cabecera de pestañas fija (GTabs con detached; DECISIONS.md #119), a sangre, entre el encabezado y el cuerpo; no se desplaza. Con el slot, role="region" y tabindex pasan del cuerpo a los tabpanel (GTabPanel)

### GDialogStep · `<g-dialog-step>` · stable · `@grana/vue`

Un paso de GDialog con historial (niveles anidados, concepto B «El hilo»): se declara como hijo del diálogo; su panel solo existe mientras el paso está en el historial (los de debajo siguen montados, ocultos e inertes). El encabezado, el nombre del diálogo y el pie son los del paso actual.
(desde 1.0.0)

**Props**
- `name`: `string` = `null` (obligatoria). Único entre los pasos del diálogo (aviso si se repite). Es lo que lleva el historial `steps`
- `title`: `string | null` = `null`. Nombre del paso: h2 del encabezado, nombre del panel y del hilo. Sin él, aviso
- `description`: `string | null` = `null`. Propósito (adónde va su resultado): descripción del diálogo mientras es el actual
- `summary`: `string | null` = `null`. Lo que el paso espera o lleva, en corto: se lee en el hilo tras el título (texto oculto accesible); no se pinta
**Slots**
- `default`: Contenido del paso, en su panel (g-dialog__step) dentro de g-dialog__body. Alcance: { close, push, back, backTo, steps }
- `footer`: Acciones del paso: GDialog lo pinta en g-dialog__footer cuando el paso es el actual. Alcance: { close, push, back, backTo, steps }

### GDivider · `<g-divider>` · stable · `@grana/vue`

Línea de separación entre grupos de contenido del consumidor: horizontal (<hr>) o vertical (separator en una fila flex o grid), con texto centrado opcional, inset heredado de la anfitriona, énfasis sutil o fuerte (≥ 3:1) y modo decorativo; nunca enfocable.
(desde 1.0.0)

**Props**
- `orientation`: `'horizontal' | 'vertical'` = `"horizontal"`
- `label`: `string | null` = `null`. Solo horizontal; el slot label gana. En vertical se ignora y avisa
- `inset`: `'none' | 'both' | 'start'` = `"none"`. start solo horizontal; en vertical se aplica both (clase efectiva) y avisa. La cantidad es --g-divider-inset
- `emphasis`: `'subtle' | 'strong'` = `"subtle"`
- `decorative`: `boolean` = `false`. aria-hidden sin rol; con texto no cambia nada
**Slots**
- `label`: Texto entre las dos líneas (contenido de frase, sin nada interactivo); dentro de g-divider__label; solo horizontal

### GEmpty · `<g-empty>` · stable · `@grana/vue`

El vacío con causa: lo que una región enseña cuando no tiene nada que enseñar, diciendo por qué y cómo salir. A «el primer hueco» (un elemento en el sitio y del tamaño del primero que llegará; dentro de una GLoadRegion lee su --_load-slot) y B «la salida con cuentas» (cause="filtered" con filters: cuántas había, qué filtro quitar y cuántas vuelven, de más a menos).
(desde 1.0.0)

**Props**
- `cause`: `'none' | 'filtered' | 'error' | 'forbidden'` = `null` (obligatoria). Elige el icono propio, el modificador g-empty--cause-* y, con filtered, la salida. No cambia el texto
- `title`: `string` = `null` (obligatoria). El nombre del vacío y lo que se anuncia dentro de una GLoadRegion (#533). p sin headingLevel; hN con él
- `description`: `string | null` = `null`. La causa o el paso siguiente; el slot por defecto la sustituye
- `headingLevel`: `2 | 3 | 4 | 5 | 6 | null` = `null`. Sin valor, el título es un párrafo
- `filters`: `EmptyFilter[]` = `[]`. Solo con cause="filtered": { key, label, count? }; count = cuántos vuelven quitando solo ese filtro (lo calcula la aplicación)
- `total`: `number | null` = `null`. Solo con cause="filtered": cuántos había antes de los filtros (la traza)
- `locale`: `string | null` = `null`. prop › lang del ancestro más cercano › navigator.language (al montar); Intl.ListFormat y Intl.NumberFormat
- `labels`: `EmptyLabels` = `{}`. relax {label}, returns {count}, clear, before {total} {filters}; sin valores por defecto
**Eventos**
- `relax` (`string | number`): Pulsa «Quitar «…»» de un filtro de la salida (la key del filtro)
- `clear`: Pulsa «Quitar todos»
**Slots**
- `default`: Descripción rica; sustituye a description
- `icon`: Sustituye al icono propio (un GIcon de la aplicación, p. ej. inbox para none); decorativo, dentro del hueco aria-hidden. Alcance: { cause }
- `actions`: Acciones (GBtn): crear, importar, reintentar, pedir acceso; con la salida, van después de ella. Alcance: { cause }
**Claves de `labels`**: `relax`, `returns`, `clear`, `before`

### GErrorSummary · `<g-error-summary>` · stable · `@grana/vue`

Resumen de errores con un enlace por pregunta y foco al aparecer (patrón GOV.UK).
(desde 1.0.0)

**Props**
- `errors`: `FormError[] | null` = `null`. [{ name?, id?, message }]; sin valor dentro de GForm
- `headingLevel`: `2 | 3 | 4 | 5 | 6 | null` = `null`. Por defecto el de GForm (3)
- `labels`: `{ title?: string | ((count: number) => string) }` = `"{}"`. title: String con {count} o Function(count)
**Eventos**
- `navigate` (`{ name: any; id: any; event: any; preventDefault(): void }`): Antes de llevar al campo; cancelable. Sin cancelar: nextTick, abre sin animar la GFormSection plegada que contiene el control (OPEN_REQUEST interno, también fuera de GForm; #287), desplaza y enfoca

### GFab · `<g-fab>` · stable · `@grana/vue/fab`

Botón flotante con acciones: un círculo con icono en un borde del visor (o de un contenedor) para crear o capturar desde cualquier sitio. Botón de menú de APG con el motor de GMenu. A · «La pila que crece» por defecto (las que caben, ≤ 5, como píldoras pegadas al botón; si sobran, la más lejana es «Más acciones (N)» y abre el resto agrupado) y C · «Acción con cola» con main (la principal a un toque, con su etiqueta, y una cola que abre un panel donde escribir filtra). Confirmación en el sitio para lo peligroso, acuse en el propio botón con el ticket de select, se aparta del foco (2.4.11), velo táctil, una activación por gesto.
(desde 1.0.0)

**Props**
- `items`: `FabItem[]` = `[]`. Acciones: { id, label, icon?, description?, group?, disabled?, danger?, confirm?, confirmLabel? }. El orden del arreglo es el de frecuencia: la primera, la más cercana al FAB. Sin label o sin id no se pinta (avisos 3 y 4); un id repetido se pinta (aviso 5); más de 15 se pintan todas (aviso 14).
- `modelValue`: `boolean | null` = `null`. Abierto. Con valor, controlado (emite update:modelValue y no cambia por su cuenta); sin valor, guarda su estado y emite igual. true con una sola acción, sin acciones o bajo un modal no abre (aviso 12).
- `label`: `string | null` = `null`. Nombre del FAB (A) o del grupo principal + cola (C). Obligatorio salvo con una sola acción (aviso 2).
- `main`: `GranaKey` = `null`. id de la acción principal: activa C. Se ignora (forma A) si no es pintable, si es peligrosa o sin labels.moreShort (avisos 8, 9 y 11).
- `appearance`: `'auto' | 'panel'` = `"auto"`. auto: política de A (pila, pila con cola o panel según el sitio, con alturas medidas); panel: siempre panel. arc está reservado (B): avisa (aviso 10) y se comporta como auto. Con main no cuenta.
- `position`: `'bottom-end' | 'bottom-start' | 'bottom-center' | 'top-end' | 'top-start' | 'top-center'` = `"bottom-end"`. Borde y alineación lógicos (start/end siguen a dir). Abajo la lista sube; arriba baja.
- `anchor`: `'viewport' | 'container'` = `"viewport"`. viewport: fijo al visor, publica y lee reservas de borde (EDGE_ORDER.fab); container: absoluto en el antecesor posicionado, sin reservas (sin uno de la aplicación, aviso 15).
- `offset`: `{ top?: string | number; bottom?: string | number }` = `{}`. { top?, bottom? } longitudes CSS (o px en número): se suman al margen seguro de su borde (--_offset); el del lado contrario limita el alto de la lista.
- `closeOnSelect`: `'auto' | 'never'` = `"auto"`. auto cierra al elegir (event.preventDefault() en select lo mantiene abierto esa vez); never no cierra.
- `labels`: `FabLabels` = `{}`. Textos, sin valores por defecto (#226): more ({count}), moreShort, cancel, findHint, matches ({count}), matchesOne, none, busy, done, failed. Los de {count} admiten una función ({ count }) => string. Los que faltan: aviso 11 y la salida de fab.md «Textos».
- `id`: `string | null` = `null`. Base de los ids (raíz, {id}-trigger, {id}-main, {id}-menu, {id}-tail, {id}-more); generado y SSR-seguro sin ella.
**v-model**: `v-model` → `modelValue`
**Eventos**
- `select` (`FabSelectEvent`): Se activa una acción (también la principal de C, la de single y la confirmación de una peligrosa); nunca una deshabilitada o en curso, la cola ni «Cancelar». Síncrono en el gesto; el ticket de #643 da el acuse en el FAB. event.preventDefault() mantiene la lista abierta esa vez
- `update:modelValue` (`boolean`): Se abre o cierra por una vía del usuario (con o sin v-model)
- `open`: La lista ya se muestra
- `closed`: La lista ya se ocultó
**Slots**
- `trigger-icon`: Icono del FAB contraído en A (sustituye a plus; decorativo, dentro de g-fab__glyph--rest). En C no se usa.
**Claves de `labels`**: `more`, `moreShort`, `cancel`, `findHint`, `matches`, `matchesOne`, `none`, `busy`, `done`, `failed`

### GFieldGroup · `<g-field-group>` · stable · `@grana/vue`

Una pregunta compuesta cuyas partes necesitan su propia etiqueta (contacto de emergencia, fecha en Día · Mes · Año): fieldset + legend, partes en una GFormRow compuesta y un solo mensaje. Va siempre en su propia fila.
(desde 1.0.0)

**Props**
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `name`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`
- `valid`: `string | null` = `null`
- `required`: `boolean` = `false`
- `keep`: `boolean` = `false`. r02: las partes nunca se parten en líneas (pasa a la GFormRow compuesta)
- `disabled`: `boolean | null` = `null`. Sin valor: hereda del contexto (false fuera de GForm)
- `readonly`: `boolean | null` = `null`. Sin valor: hereda del contexto
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`
- `id`: `string | null` = `null`
**Slots**
- `label`: Texto rico del legend
- `hint`: Ayuda rica
- `default`: Partes (campos de Grana o propios con useFormField)

### GFileField · `<g-file-field>` · stable · `@grana/vue/file-field`

Campo para adjuntar archivos a un formulario, concepto A «Línea de adjuntos»: la caja mide lo que la de GInput y los archivos son fichas dentro de ella (GSummary inline xs con un GProgress como capa, «Reintentar» y «Quitar» al lado); el control es el <input type="file"> real y lleva siempre los File de la lista. Elegir, arrastrar (la página entera despierta los campos alcanzables) y pegar. Sin red: la subida es un adaptador de la aplicación (uploader) y empieza al añadir; con subidas pendientes o fallidas el campo bloquea el envío de GForm por sí mismo (error propio, solo al enviar). Sin uploader, los binarios van en el envío nativo.
(desde 1.0.0)

**Props**
- `modelValue`: `FileEntry[] | null` = `null`. Entradas { key, name, size, type, state, value, url, error, file } (#368). Sin v-model el campo guarda la lista y la emite igual. Conciliación por key
- `accept`: `string | null` = `null`. Atributo nativo y comprobación propia en las tres vías (extensión sin mayúsculas y MIME; sin MIME, solo extensión)
- `multiple`: `boolean` = `false`. Cada gesto suma; sin él, el nuevo reemplaza (labels.replaced)
- `max`: `number | null` = `null`. Entero ≥ 1, solo con multiple (sin él, aviso 3). Cuentan los guardados
- `maxSize`: `number | null` = `null`. Bytes, > 0
- `uploader`: `FileUploader | null` = `null`. (file, { signal, progress }) => Promise<{ value, url? }>. Sin él, envío nativo
- `concurrency`: `number` = `2`. Entero ≥ 1 (si no, aviso 3 y 2)
- `locale`: `string | null` = `null`. prop › lang del ancestro › navigator.language (al montar); antes de montar (SSR), en-US
- `labels`: `GranaLabels` = `{}`. Ver labels
- `name`: `string | null` = `null`. Registra el campo en GForm y nombra lo que se envía
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`. Texto de la aplicación (formatFileSize para el límite)
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`
- `valid`: `string | null` = `null`
- `required`: `boolean` = `false`. aria-required y marca; nunca required nativo
- `mark`: `boolean | null` = `null`
- `readonly`: `boolean | null` = `null`. Contexto de GForm si no se da
- `disabled`: `boolean | null` = `null`. Contexto de GForm si no se da
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `variant`: `'outline' | 'soft'` = `"outline"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `block`: `boolean | null` = `null`
- `id`: `string | null` = `null`. Generado si no se da
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`FileEntry[]`): Cambia la lista o el state/value/url/error de una entrada; nunca por progreso
- `change` (`FileFieldChange`): Una vez por gesto que cambia qué archivos hay, después de update:modelValue
- `reject` (`FileFieldReject`): Un gesto con archivos rechazados
**Slots**
- `label`: Como GInput (dentro del <label>)
- `hint`: Dentro de ID-hint; la copia junto a la cara repite el slot
- `error`: Mensaje de error del campo, tras el prefijo oculto
**Métodos**
- `add(files: FileList | File[]) → { added: Entry[], rejected: [{ file, name, reason }] }`: Añadir con la validación, el aviso, los anuncios y los eventos (via api); nada en solo lectura ni deshabilitado
- `open()`: input.click() si no está lleno, en solo lectura ni deshabilitado (dentro de un gesto)
- `focus()`: Enfoca el control
**Claves de `labels`**: `add`, `addMany`, `addMore`, `change`, `readonly`, `none`, `list`, `drop`, `dropInto`, `dropRejected`, `dropFull`, `remove`, `cancel`, `retry`, `queued`, `done`, `error`, `progress`, `progressText`, `uploadFailed`, `notAdded`, `dismiss`, `reasons.type`, `reasons.empty`, `reasons.duplicate`, `reasons.size`, `reasons.count`, `added`, `uploaded`, `retrying`, `replaced`, `rejected`, `uploadError`, `full`, `status`, `addedMany`, `uploadedMany`, `uploading`, `rejectedMany`, `removed`, `canceled`, `pending`, `failed`

### GFilterBar · `<g-filter-bar>` · stable · `@grana/vue`

Filtros no fijos al estilo Stripe: chips sugeridos, «Agregar filtro», editor de regla + valor (popover o hoja) y chips aplicados; produce filters como datos (Y entre filtros, O dentro de una lista).
(desde 1.0.0)

**Props**
- `fields`: `FilterField[]` = `[]`
- `filters`: `Filter[]` = `[]`
- `count`: `number | null` = `null`
- `labels`: `GranaLabels` = `{}`
**v-model**: `v-model:filters` → `filters`
**Eventos**
- `update:filters` (`Filter[]`): Aplicar, quitar o limpiar

### GForm · `<g-form>` · stable · `@grana/vue`

Formulario con contexto: decide cuándo se ven los errores que calcula la aplicación, envía, resume y mantiene el estado sucio. No valida ni guarda.
(desde 1.0.0)

**Props**
- `errors`: `Record<string, string | null | undefined>` = `"{}"`. { [name]: String }, calculados por la aplicación
- `warnings`: `Record<string, string | null | undefined>` = `"{}"`. Como errors, sin bloquear
- `showErrorsOn`: `'blur' | 'submit'` = `"blur"`
- `marks`: `'optional' | 'required'` = `"optional"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `readonly`: `boolean` = `false`
- `disabled`: `boolean` = `false`
- `headingLevel`: `2 | 3 | 4 | 5 | 6` = `3`
- `dirty`: `boolean` = `false`. v-model:dirty
- `labels`: `GranaLabels` = `"{}"`. sectionErrors: String con {count} o Function (count) => String, estado de errores de una GFormSection collapsible plegada (#286)
**v-model**: `v-model:dirty` → `dirty`
**Eventos**
- `submit` (`FormSubmitEvent`): Envío sin errores que bloqueen, o con un submitter formnovalidate
- `invalid` (`FormInvalidEvent`): Envío con errores (orden del DOM; generales al final con id null)
- `reset` (`{ event: any }`): Evento reset nativo (cancelado; estado limpio)
- `update:dirty` (`boolean`): Primera interacción (true) y reset (false)
**Slots**
- `default`: Resumen, secciones, rejillas y pie
**Métodos**
- `showErrors(): Promise<FormError[]>`: Revela todos, abre las GFormSection plegadas con error que bloquea y mueve el foco sin emitir invalid (errores del servidor). Promise con la lista
- `focusFirstError(): Promise<boolean>`: Enfoca el primer control con error visible, abriendo antes la sección plegada que lo contiene (#287)
- `resetState(): void`: Limpia editados, revelados y dirty sin tocar valores

### GFormActions · `<g-form-actions>` · stable · `@grana/vue`

Pie de acciones con jerarquía (primaria al final), región de estado y, opcionalmente, fijo sin tapar el foco.
(desde 1.0.0)

**Props**
- `sticky`: `boolean` = `false`
- `status`: `string | null` = `null`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Por defecto la de GForm o default
**Slots**
- `status`: Estado rico (role=status)
- `default`: Botones GBtn: secundarias antes, primaria la última

### GFormFold · `<g-form-fold>` · stable · `@grana/vue/form-fold`

Crear lo que falta en su sitio (niveles anidados, concepto C «En su sitio»): un pliegue bajo el campo (o la fila) que lo pide, con su título, su propósito y su propio confirmar. Es un formulario propio sin <form>: sus campos no viajan en el envío de fuera y, abierto, bloquea ese envío con «Termina o cancela …».
(desde 1.0.0)

**Props**
- `open`: `boolean` = `false`. v-model:open. Lo pone a true la aplicación (normalmente en el `create` del campo); el pliegue emite update:open(false) al cancelar o al cerrar con resultado. Cerrar desde fuera no mueve el foco salvo que estuviera dentro
- `title`: `string | null` = `null`. Nombre del pliegue y de su error pendiente. Sin él, aviso
- `description`: `string | null` = `null`. Propósito: adónde va su resultado
- `headingLevel`: `2 | 3 | 4 | 5 | 6 | null` = `null`. Sin valor: el del pliegue padre + 1; si no hay, el headingLevel del GForm de fuera; si no, 3 (máximo 6)
- `for`: `string | null` = `null`. id del control que recibe el valor: destino por defecto del foco y de la llegada al cerrar con resultado, y el de vuelta si `from` no sirve
- `from`: `LevelTarget` = `null`. El disparador (id o elemento). Sin él, document.activeElement al abrir si está fuera del pliegue y no es body
- `errors`: `Record<string, string | null | undefined>` = `"{}"`. Errores del pliegue, name → mensaje (semántica de GForm; el pliegue no valida)
- `warnings`: `Record<string, string | null | undefined>` = `"{}"`. Advertencias del pliegue, como GForm
- `labels`: `FormFoldLabels` = `"{}"`. { pending }: String con {title} o Function (title) => String. El error que bloquea el envío de fuera mientras está abierto
**v-model**: `v-model:open` → `open`
**Eventos**
- `update:open` (`boolean`): Al cancelar o al cerrar con resultado (siempre false)
- `confirm` (`{ close(options?: LevelReturn): void }`): Se pidió confirmar (confirm() o Enter en un campo de texto de una línea del pliegue) y no hay errores que bloqueen
- `invalid` (`{ errors: FormError[] }`): Se pidió confirmar con errores: los revela, marca is-rejected en los campos y enfoca el primero
- `cancel` (`{ reason: 'escape' | 'cancel' }`): Esc con el foco dentro (recoge solo este pliegue) o cancel()
**Slots**
- `default`: Campos del pliegue en una pila (GFormRow, GFieldGroup, GInputGroup y otros GFormFold). Nunca GFormSection ni GForm. Alcance: { confirm, close, cancel }
- `actions`: Botones del pliegue (type="button"): Cancelar con cancel(), Crear y elegir con confirm(). Alcance: { confirm, close, cancel }
**Métodos**
- `confirm(): void`: Revela los campos del pliegue y emite confirm o invalid
- `close(options?: LevelReturn): void`: Cierra con resultado: close({ focus, announce }) → foco a focus › for › from, llegada (data-g-landed) y anuncio en el canal de página
- `cancel(): void`: Cierra sin resultado: cancel (reason 'cancel') + update:open(false); foco a from › for

### GFormLayout · `<g-form-layout>` · stable · `@grana/vue`

Pila vertical de filas de un formulario (sustituye a GFormGrid, r02): cada hijo directo ocupa el ancho entero; no mide. Provee block, densidad y stack a sus filas y campos.
(desde 1.0.0)

**Props**
- `stack`: `boolean` = `false`. Cada GFormRow interior pone un campo por línea, salvo keep (drawers)
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Por defecto la de GForm o default
**Slots**
- `default`: Filas (GFormRow), campos sueltos, GFieldGroup, GCheckboxGroup, casillas, interruptores

### GFormReveal · `<g-form-reveal>` · stable · `@grana/vue`

Bloque condicional de un formulario (Fase 3): campos que existen solo si una respuesta lo pide. Va justo después de su pregunta; cerrado, sus campos salen de FormData, de Tab, de la validación nativa, de los errores y del resumen, pero conservan lo escrito (WCAG 3.3.7).
(desde 1.0.0)

**Props**
- `when`: `boolean` = `false`. El bloque aplica. Lo calcula la aplicación con su modelo (:when="factura === 'si'"). Activo = when y todos sus GFormReveal ancestros activos
**Slots**
- `default`: Campos condicionados en una pila (cada hijo ocupa el ancho entero): campos sueltos, GFormRow, GFieldGroup, GInputGroup, GCheckbox/GCheckboxGroup, GRadioGroup, GSwitch, GTextarea, campos propios (useFormField) y GFormReveal anidados justo después de su pregunta. Nunca GFormSection

### GFormRow · `<g-form-row>` · stable · `@grana/vue`

Fila de campos que van juntos: mide su ancho propio y los reparte en líneas contiguas en orden del DOM (menos líneas, la más holgada) que siempre llenan el ancho, con tres pistas compartidas por línea (etiqueta · caja · pie).
(desde 1.0.0)

**Props**
- `keep`: `boolean` = `false`. La fila nunca se parte; si no caben los mínimos, ceden
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Por defecto la del contexto o default
**Slots**
- `default`: Campos (GInput, GTextarea, GSelect, GDatePicker no inline ni split, GInputGroup, campos propios con tres hijos) con clase g-form-w-xs|sm|md|lg

### GFormSection · `<g-form-section>` · stable · `@grana/vue`

Sección de un formulario (una idea): fija, plegable (collapsible: hN > button, sus datos siguen en el envío) o agregable (addable: el usuario decide incluirla; «Quitar» descarta), con el encabezado arriba o al lado por su ancho propio y línea opcional con la sección anterior; sin tarjeta ni punto de referencia.
(desde 1.0.0)

**Props**
- `title`: `string | null` = `null`
- `description`: `string | null` = `null`
- `headingLevel`: `2 | 3 | 4 | 5 | 6 | null` = `null`. Por defecto el de GForm (3)
- `optional`: `boolean` = `false`. Insignia labels.sectionOptional de GForm (fuera del botón en collapsible; no se pinta en addable) y sin «(opcional)» en sus campos
- `mode`: `'static' | 'collapsible' | 'addable'` = `"static"`. Estructural: se espera fijo (aviso 8 si cambia)
- `open`: `boolean` = `false`. v-model:open; solo collapsible; controlado y no controlado (estado local que parte de la prop y la sigue)
- `added`: `boolean` = `false`. v-model:added; solo addable; controlado y no controlado. true por programa no mueve el foco y hace que quitar pida confirmación; false por programa descarta
- `summary`: `string | null` = `null`. Solo collapsible y solo plegada: texto de la aplicación en la línea de estado (el slot gana)
- `headerPlacement`: `'top' | 'auto'` = `"top"`. auto: al lado con ancho propio ≥ space × 200 (ResizeObserver compartido); SSR y antes de medir, arriba
- `divider`: `boolean` = `false`. GDivider decorative subtle sin inset, primer hijo, dentro del hueco que precede a la sección; la primera sección no lo dibuja (CSS)
- `labels`: `GranaLabels` = `"{}"`. Solo addable; textos completos, sin valores por defecto. Sin add no hay «Agregar …»; sin remove no hay «Quitar …»; sin removeTitle, removeConfirm o removeCancel quita sin confirmar
**v-model**: `v-model:open` → `open`, `v-model:added` → `added`
**Eventos**
- `update:open` (`boolean`): collapsible: el botón abre o pliega, y también al abrirse para llevar a un campo (envío, showErrors(), enlace del resumen, focusFirstError())
- `update:added` (`boolean`): addable: «Agregar …» (true) o quitar (false, tras confirmar si hubo diálogo). false ES «el usuario quitó la sección»: la aplicación vacía su modelo
**Slots**
- `lead`: Icono decorativo antes del título (normalmente un GIcon; #203). En g-form-section__lead (aria-hidden): en static/addable inmediatamente antes del hN; en collapsible dentro del botón, después del chevron
- `title`: Título rico (dentro del hN; en collapsible dentro del botón)
- `description`: Descripción rica (en addable sin agregar, debajo de «Agregar …» y unida a él por aria-describedby)
- `summary`: Texto de estado de la aplicación en __summary-text (solo collapsible plegada); admite GIcon o GBadge, nada interactivo
- `actions`: Acciones secundarias de la sección, visibles abierta y plegada (en addable, antes de «Quitar …»)
- `help`: Ayuda contextual (GHelper)
- `default`: Un GFormLayout con los campos (#283), o contenido que no son campos

### GGallery · `<g-gallery>` · stable · `@grana/vue/gallery`

Las fotos de un lugar ordenadas por lo que se vende, con miniaturas-enlace (mejora progresiva) que abren un visor a pantalla completa que devuelve a la foto vista. A · Recorrido por espacios (con group: índice, espacios con portada, contador e hilo en el visor) y B · La tira (appearance="strip": alturas iguales con la proporción real, un estado con dos profundidades). Sin autoavance.
(desde 1.0.0)

**Props**
- `photos`: `GalleryPhoto[]` = `[]`. Fotos [{ src, thumb?, srcset?, sizes?, thumbSrcset?, thumbSizes?, width, height, alt, caption?, group?, id? }]: width/height (aviso 2) y alt (aviso 3) obligatorios; vacío: no se pinta (aviso 5).
- `groups`: `GalleryGroup[]` = `null`. Espacios [{ value, label, id? }] (A): orden, etiqueta y ancla enlazable (sin id, {id}-g-{n}); sin ella, de photo.group en orden de aparición. Un group fuera de la lista va al final (aviso 4).
- `title`: `string` = `null` (obligatoria). Título (nombre de la región y del visor). Obligatorio (aviso 1).
- `headingLevel`: `2 | 3 | 4 | null` = `null`. Nivel del título; sin él, el de GSection (sectionKey) o 2. Los espacios, un nivel por debajo (tope h6).
- `appearance`: `'grid' | 'strip'` = `"grid"`. grid (base; A con grupos) o strip (B). inline reservado: aviso 8 y grid.
- `eager`: `number` = `4`. Miniaturas (en orden del DOM) sin loading=lazy; en B la actual y la siguiente nunca difieren.
- `zoom`: `boolean` = `true`. Zoom del visor (botón, +/-, doble clic); el pellizco del sistema sigue.
- `index`: `number | null` = `null`. Foto actual (v-model:index), también la de la tira; fuera de rango, la más cercana (aviso 9).
- `open`: `boolean | null` = `null`. Visor abierto (v-model:open).
- `viewerZone`: `'brand' | 'none'` = `"brand"`. Tono del visor (#733): zona de marca o la página; inverse reservado.
- `labels`: `GalleryLabels` = `{}`. Textos sin valores por defecto (#226; aviso 7 la primera vez que falta uno): total ({count}; contado: String o Function (count, vars)), count ({index} de {total}), groupCount ({group} · {index} de {total}), position (B), announce ({position}. {alt}.), first, last, prev, next, close, zoom (nombre constante), viewer ({title}, galería), groups, groupLink ({group}, {count}; contado), broken ({alt}), carousel y slide (aria-roledescription de B).
- `locale`: `string | null` = `null`. BCP 47 de las cifras; sin él, el lang del ancestro.
- `id`: `string | null` = `null`. Base de los id; generado si no se da.
**v-model**: `v-model:index` → `index`, `v-model:open` → `open`
**Eventos**
- `update:index` (`number`): Cambia la foto actual (tira, visor o miniatura)
- `update:open` (`boolean`): Se abre o se cierra el visor

### GGalleryViewer · `<g-gallery-viewer>` · stable · `@grana/vue/gallery`

Visor a pantalla completa (GDialog fullscreen bare, #732) de las fotos: controles fuera de la foto, anuncio de cada foto, teclado, gesto (pasar y cerrar), zoom ×2 del tamaño contenido con recorrido nativo y Esc escalonado; devuelve el foco a `from`. Suelto (desde un botón) o dentro de GGallery.
(desde 1.0.0)

**Props**
- `modelValue`: `boolean` = `false`. Abierto (v-model). Con photos vacío no abre.
- `photos`: `GalleryPhoto[]` = `[]`. Fotos [{ src, thumb?, srcset?, sizes?, thumbSrcset?, thumbSizes?, width, height, alt, caption?, group?, id? }]: width/height (aviso 2) y alt (aviso 3) obligatorios; vacío: no se pinta (aviso 5).
- `groups`: `GalleryGroup[]` = `null`. Espacios [{ value, label, id? }] (A): orden, etiqueta y ancla enlazable (sin id, {id}-g-{n}); sin ella, de photo.group en orden de aparición. Un group fuera de la lista va al final (aviso 4).
- `index`: `number | null` = `null`. Foto actual (v-model:index).
- `title`: `string` = `null` (obligatoria). Nombre del visor (labels.viewer con {title}) y repetición visual (aria-hidden). Obligatorio (aviso 1).
- `zoom`: `boolean` = `true`. Zoom (botón con nombre constante y aria-pressed, +/-, doble clic).
- `zone`: `'brand' | 'none'` = `"brand"`. data-g-zone="brand" en el <dialog> (#733) o la página.
- `from`: `string | HTMLElement | null` = `null`. A quién vuelve el foco al cerrar (selector o elemento); vivo: se resuelve al cerrar (#732).
- `labels`: `GalleryLabels` = `{}`. Textos sin valores por defecto (#226; aviso 7 la primera vez que falta uno): total ({count}; contado: String o Function (count, vars)), count ({index} de {total}), groupCount ({group} · {index} de {total}), position (B), announce ({position}. {alt}.), first, last, prev, next, close, zoom (nombre constante), viewer ({title}, galería), groups, groupLink ({group}, {count}; contado), broken ({alt}), carousel y slide (aria-roledescription de B).
- `locale`: `string | null` = `null`. BCP 47 de las cifras; sin él, el lang del ancestro.
- `id`: `string | null` = `null`. Base de los id; generado si no se da.
**v-model**: `v-model` → `modelValue`, `v-model:index` → `index`
**Eventos**
- `update:modelValue` (`boolean`): Se cierra (botón cerrar, Esc, deslizar hacia abajo); dismiss cancelable de GDialog
- `update:index` (`number`): Cambia la foto (flechas, botones, gesto, hilo, Inicio/Fin, Av Pág/Re Pág)
**Métodos**
- `(index: number) => void`: Lleva el visor a una foto
- `() => void`
- `() => void`

### GHelper · `<g-helper>` · stable · `@grana/vue`

Ayuda contextual anclada a una región: disparador en línea o flotante (placement × attach × offset) que abre un contenido agnóstico como popover no modal o, si no cabe, como hoja (GDialog).
(desde 1.0.0)

**Props**
- `mode`: `'inline' | 'float'` = `"inline"`
- `placement`: `'top-start' | 'top' | 'top-end' | 'right-start' | 'right' | 'right-end' | 'bottom-end' | 'bottom' | 'bottom-start' | 'left-end' | 'left' | 'left-start'` = `"bottom-end"`
- `attach`: `'inside' | 'edge' | 'outside'` = `"inside"`
- `offset`: `number` = `2`
- `contentPlacement`: `'top-start' | 'top' | 'top-end' | 'right-start' | 'right' | 'right-end' | 'bottom-end' | 'bottom' | 'bottom-start' | 'left-end' | 'left' | 'left-start' | null` = `null`
- `open`: `boolean | null` = `null`
- `disabled`: `boolean` = `false`
- `adaptive`: `boolean` = `true`
- `ariaLabel`: `string | null` = `null`
- `contentLabel`: `string | null` = `null`
- `closeLabel`: `string | null` = `null`
- `id`: `string | null` = `null`
**v-model**: `v-model:open` → `open`
**Eventos**
- `update:open` (`boolean`): El usuario abre o cierra (botón, Esc, clic fuera, foco que sale, cierre de la hoja)
- `toggle` (`{ open: boolean; presentation: 'popover' | 'sheet' }`): Tras abrir o cerrar; presentation: popover | sheet
**Slots**
- `trigger`: Contenido del botón (icono, texto, avatar); sin controles. Alcance: { open }
- `content`: Contenido agnóstico. Alcance: { close, presentation }
- `default`: Alias de content (content gana)

### GHelperScope · `<g-helper-scope>` · stable · `@grana/vue`

Contenedor sin aspecto propio que fija el contexto de posición de los GHelper flotantes.
(desde 1.0.0)

**Props**
- `as`: `string` = `"div"`
**Slots**
- `default`: Contenido de la región

### GHero · `<g-hero>` · stable · `@grana/vue/hero`

Apertura de un sitio (hotel, restaurante, tour): título, promesa, acción y la foto que vende, con el contraste del texto garantizado por construcción (el texto nunca toca la foto o vive en una placa opaca), una sola foto prioritaria y nada que se mueva solo sin poder pararse. A · La ventana (por defecto), C · El umbral (consulta en la tarjeta) y B · Vistas a elegir.
(desde 1.0.0)

**Props**
- `title`: `string` = `null` (obligatoria). Título (h1 o h2). Obligatorio (aviso 1); nombra la región.
- `eyebrow`: `string | null` = `null`. Antetítulo (dir="auto"). El slot eyebrow lo sustituye.
- `lead`: `string | null` = `null`. Bajada (dir="auto"). El slot lead la sustituye.
- `aside`: `string | null` = `null`. Dato al pie del contenido (dir="auto"). El slot aside lo sustituye.
- `headingLevel`: `1 | 2` = `1`. Nivel del título; el tamaño no lo sigue (#196). Con 1, aviso 4 si hay otro h1 en el documento.
- `appearance`: `'window' | 'views' | 'threshold'` = `"window"`. A · La ventana (vano de arco con detalle), B · Vistas a elegir (placa de la zona de marca y 2 a 4 vistas), C · El umbral (tarjeta con el slot consult). views con menos de 2 vistas se pinta como window.
- `media`: `HeroMedia` = `null`. Foto principal { src, srcset?, sizes?, width, height, alt?, decorative?, credit? }: width y height obligatorios (aviso 2); alt o decorative (aviso 3). img con loading=eager, decoding=async y fetchpriority=high con priority.
- `detail`: `HeroDetail` = `null`. Solo window: segunda ventana decorativa { src, srcset?, sizes?, width, height } (alt="", aria-hidden), fuera del marco, sin fetchpriority.
- `frame`: `'arch' | 'rect'` = `"arch"`. Solo window: forma del vano (arco o rectángulo con el radio de tarjeta).
- `look`: `boolean` = `true`. Solo window: la mirada (§29.8), la foto se desplaza ≤ 3 % dentro del marco con el desplazamiento; CSS sin JS, quieta sin soporte o con movimiento reducido.
- `views`: `HeroView[]` = `[]`. Solo views: 2 a 4 { value, label, media } (media con alt obligatorio). Cada vista es un img estable que cambia de clase; las no elegidas sin src hasta el load de la principal.
- `view`: `string | number | null` = `null`. Vista elegida (v-model:view); sin valor, la primera.
- `paused`: `boolean | null` = `null`. Solo con un <video> en el slot media (v-model:paused). Sin valor: true con movimiento reducido, si no false.
- `priority`: `boolean | null` = `null`. fetchpriority=high en la foto principal. Por defecto true con headingLevel 1 y false con 2. Dos héroes con priority: aviso 5.
- `labels`: `HeroLabels` = `{}`. { views, pause } sin valores por defecto (#226): views = legend de las vistas (aviso 8); pause = nombre constante del botón de pausa, en texto oculto (aviso 10). resume retirado (#756): se ignora.
- `id`: `string | null` = `null`. Base de los id (título {id}-title, name de los radios); generado si no se da.
**v-model**: `v-model:view` → `view`, `v-model:paused` → `paused`
**Eventos**
- `update:view` (`string | number`): La persona elige una vista (radio de B): el value de la vista
- `update:paused` (`boolean`): La persona pulsa la pausa del vídeo: true en pausa
**Slots**
- `actions`: Acciones (GBtn size="lg"); en div.g-hero__actions
- `consult`: Solo threshold: la consulta (GBookingBar) entre la bajada y las acciones; fuera de C se ignora (aviso 6)
- `media`: Sustituye a la foto: un <video muted playsinline loop poster width height> sin autoplay (aviso 9); el héroe llama a play()/pause() y pinta la pausa. En A va dentro del marco
- `eyebrow`: Sustituye al texto de eyebrow (sin interactivos)
- `lead`: Sustituye al texto de lead (sin interactivos)
- `aside`: Sustituye al texto de aside (sin interactivos)

### GIcon · `<g-icon>` · stable · `@grana/vue`

Icono de Lucide en línea: 1em y currentColor, decorativo por defecto o imagen con nombre con label; nunca enfocable. Dibuja la lista de la librería o los iconos que la aplicación registra con createIcons (cadenas de lucide-static, solo Lucide).
(desde 1.0.0)

**Props**
- `name`: `string` = `null` (obligatoria). Nombre canónico de Lucide (minúsculas con guiones). Resolución: registro más cercano → lista de la librería → nada y aviso
- `label`: `string | null` = `null`. Sin valor o vacío: decorativo (aria-hidden). Con valor: role="img" + aria-label
- `filled`: `boolean` = `false`. Rellena con currentColor (figuras de estado)
- `flipRtl`: `boolean` = `false`. Clase g-icon--flip-rtl: espejo horizontal solo con dirección efectiva RTL (iconos direccionales); nunca automático

### GInput · `<g-input>` · stable · `@grana/vue`

Campo de texto de una línea con etiqueta, ayuda, error, iconos y contador.
(desde 1.0.0)

**Props**
- `modelValue`: `string` = `""`
- `variant`: `'outline' | 'soft'` = `"outline"`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | null` = `null`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `block`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `disabled`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `readonly`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `loading`: `boolean` = `false`
- `type`: `'text' | 'email' | 'password' | 'search' | 'tel' | 'url'` = `"text"`
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`. Advertencia: no bloquea ni pone aria-invalid (C5)
- `valid`: `string | null` = `null`. Mensaje de válido útil (C5)
- `required`: `boolean` = `false`
- `mark`: `boolean | null` = `null`. false quita la marca de la convención de GForm (C3)
- `prefix`: `string | null` = `null`. Texto visible antes del valor ($) (C13)
- `suffix`: `string | null` = `null`. Texto visible después del valor (kg, %) (C13)
- `prefixLabel`: `string | null` = `null`. Expansión accesible del prefijo
- `suffixLabel`: `string | null` = `null`. Expansión accesible del sufijo (kilogramos)
- `output`: `string | null` = `null`. Valor calculado por la aplicación (C14, #180): <output> al final de la caja, tras el sufijo; siempre presente con la prop; en aria-describedby solo con texto; no se envía
- `counter`: `boolean` = `false`
- `showPasswordLabel`: `string | null` = `null`
- `hidePasswordLabel`: `string | null` = `null`
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`string`): El usuario cambia el valor
**Slots**
- `label`: Etiqueta con contenido rico (sustituye a label)
- `prepend`: Icono decorativo antes del texto
- `append`: Icono decorativo después del texto
- `hint`: Ayuda con contenido rico (sustituye a hint)
- `error`: Mensaje de error con contenido rico; solo se muestra con error (en la región __message)
- `action`: Botón de acción acoplado al final de la caja. Slot con alcance: { size, density, disabled }; el consumidor pone un GBtn

### GInputGroup · `<g-input-group>` · stable · `@grana/vue`

Campo fusionado: un dato en varias partes que se lee como uno (teléfono país + número, valor + unidad, moneda + importe, serie + folio, rango). Una caja, una etiqueta, un mensaje; cada parte con foco y nombre propios.
(desde 1.0.0)

**Props**
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `name`: `string | null` = `null`. Clave del grupo en errors/warnings (las partes tienen la suya)
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`
- `valid`: `string | null` = `null`
- `required`: `boolean` = `false`. Marca de la etiqueta y required por defecto de cada parte
- `mark`: `boolean | null` = `null`
- `readonly`: `boolean | null` = `null`. Sin valor: hereda del contexto
- `disabled`: `boolean | null` = `null`. Sin valor: hereda del contexto
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `variant`: `'outline' | 'soft'` = `"outline"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`
- `block`: `boolean | null` = `null`. Dentro de GFormLayout/GFormRow, true
- `id`: `string | null` = `null`
**Slots**
- `label`: Etiqueta rica
- `hint`: Ayuda rica
- `default`: Partes: GInputGroupInput, GInputGroupSelect, GInputGroupText

### GInputGroupInput · `<g-input-group-input>` · stable · `@grana/vue`

Parte de GInputGroup.
(desde 1.0.0)

**Props**
- `modelValue`: `string` = `""`
- `name`: `string | null` = `null`
- `partLabel`: `string | null` = `null`
- `principal`: `boolean` = `false`
- `required`: `boolean | null` = `null`. Sin valor: el del grupo
- `error`: `string | null` = `null`
- `type`: `'text' | 'tel' | 'email' | 'url' | 'search'` = `"text"`
- `chars`: `number | null` = `null`. Ancho fijo en caracteres (--_input-group-chars)
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`string`): input

### GInputGroupSelect · `<g-input-group-select>` · stable · `@grana/vue`

Parte de GInputGroup.
(desde 1.0.0)

**Props**
- `modelValue`: `string | number` = `""`
- `name`: `string | null` = `null`
- `partLabel`: `string | null` = `null`
- `principal`: `boolean` = `false`
- `required`: `boolean | null` = `null`
- `error`: `string | null` = `null`
- `options`: `Array<SelectOption | SelectOptionGroup>` = `[]`. [{ value, label, disabled? }] o grupos { label, options } (<optgroup>)
- `placeholder`: `string | null` = `null`. Primera opción vacía (disabled si la parte es obligatoria)
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`string`): change del <select> nativo

### GInputGroupText · `<g-input-group-text>` · stable · `@grana/vue`

Parte de GInputGroup.
(desde 1.0.0)

**Props**
- `text`: `string | null` = `null`
- `label`: `string | null` = `null`. Expansión accesible: el texto visible pasa a aria-hidden
- `decorative`: `boolean` = `false`
- `id`: `string | null` = `null`
**Slots**
- `default`: Texto visible

### GLoadRegion · `<g-load-region>` · stable · `@grana/vue/load-region`

Región cuyo contenido llega tarde: envuelve la plantilla de la aplicación y decide cuándo se ve la espera (200 ms), cuánto se queda (400 ms), qué se anuncia (canal cortés de página), qué pasa con el foco y que la página no se mueva. A «Molde» (la plantilla real sin tinta; la tinta llega a su sitio) y B «Lo último conocido» (al refrescar, nada se borra; lo nuevo, marcado; si falla, lo conocido se queda).
(desde 1.0.0)

**Props**
- `loading`: `boolean` = `false`. aria-busy en la raíz desde el inicio; fases del motor (200/400/5000 ms)
- `items`: `unknown[] | Record<string, unknown> | null` = `null`. null = aún no se sabe (primera carga: molde); [] = respondió vacío. Se sustituye, no se muta. Lo pintado cambia solo al terminar la carga
- `sample`: `unknown[] | Record<string, unknown> | null` = `null`. Muestra del molde de la primera carga: los mismos campos que un elemento real, del tamaño de una respuesta típica
- `keyBy`: `string | ((item: any) => string | number)` = `"id"`. Nombre de campo o (item) => clave: data-g-key, foco por clave, lo nuevo
- `refresh`: `'keep' | 'replace'` = `"keep"`. keep (B): lo de antes a la vista, inerte, con filo y píldora; replace: molde de lo último conocido
- `error`: `boolean | string` = `false`. Se aplica al terminar la carga; con contenido conocido, barra de fallo (texto = la cadena o labels.failed); sin él, la aplicación pinta su GEmpty cause="error"
- `announceError`: `boolean` = `true`. false: el fallo lo anuncia otro (la isla de estado)
- `label`: `string | null` = `null`. Nombre del role="group"
- `labelledby`: `string | null` = `null`. Id del nombre del role="group" (normalmente el encabezado de la sección)
- `labels`: `LoadRegionLabels` = `{}`. loading, slow, loaded {count} {fresh}, refreshing, failed, retry; sin valores por defecto
**Eventos**
- `retry`: Pulsa «Reintentar» en la barra de fallo (o retry() del slot failed)
**Slots**
- `default`: La plantilla de la aplicación (y su GEmpty con v-if). Alcance: { items, mold, fresh, itemAttrs }
- `failed`: Sustituye el interior de la barra de fallo (p. ej. una GStatusMark de la isla). Alcance: { retry, text }
**Claves de `labels`**: `loading`, `slow`, `loaded`, `refreshing`, `failed`, `retry`

### GMenu · `<g-menu>` · stable · `@grana/vue`

Menú de acciones anclado a un botón de menú (patrón Menu Button y Menu de APG): acciones, separadores, grupos, casillas, opciones, submenús y elementos peligrosos. Contenido por arreglo de items; presenta y emite intención (select); las marcas son iconos de Lucide.
(desde 1.0.0)

**Props**
- `modelValue`: `boolean` = `false`
- `items`: `MenuItem[]` = `[]`. Un elemento con icon cadena (nombre de Lucide) y sin slot icon dibuja GIcon en g-menu__icon (registro de la aplicación → librería; #202); con slot icon, manda el slot; otro valor de icon es dato opaco para el slot. Campos lang (idioma de la etiqueta, en cualquier elemento, con dir="auto" en el texto) y hreflang (idioma del destino, solo con href; sin él, E2), #743: un valor que Intl.getCanonicalLocales rechaza se ignora y avisa (E8). current: true o 'page' → aria-current="page"; 'location' → aria-current="location" (sección actual de la página, la pone GPageIndex, #1039); otro valor se trata como true y avisa (E10)
- `label`: `string | null` = `null`
- `align`: `'start' | 'end'` = `"start"`
- `side`: `'auto' | 'bottom' | 'top'` = `"auto"`
- `closeOnSelect`: `'auto' | 'always' | 'never'` = `"auto"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `labels`: `MenuLabels` = `{}`. Textos de los elementos-enlace (menu.md «Elementos-enlace», sin valores por defecto, #226): external, newTab, destExternal, destNewTab, opened, openedLive, copied, copiedLive; openedLive y copiedLive admiten {label} o una función ({ label, item }) => string
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `select` (`MenuSelectEvent`): El usuario activa un elemento (no un padre de submenú ni uno deshabilitado); event.preventDefault() impide el cierre
- `navigate` (`MenuNavigateEvent`): Un elemento-enlace se activa con clic primario, Intro o Espacio sin modificadores y sin target de otro contexto (#505 con #574); nunca select. event.preventDefault() deja la navegación al router y no impide el cierre
- `update:modelValue` (`boolean`): El menú se abre o cierra por una vía de usuario
- `open`: La lista ya se muestra
- `closed`: La lista ya se ocultó
**Slots**
- `trigger`: El disparador (obligatorio). Alcance { open, attrs }: se enlaza con v-bind="attrs". El id es del menú ({id}-trigger; para elegirlo, la prop id): con un id propio, aviso de desarrollo (#305)
- `icon`: Icono de un elemento (decorativo); sustituye al GIcon por nombre de item.icon. Alcance { item }
- `item`: Contenido de un elemento, conservando el texto como nombre accesible. Alcance { item, active, checked }

### GMetric · `<g-metric>` · stable · `@grana/vue`

Primitiva de widget: valor con etiqueta, unidad, tendencia (texto, no solo flecha ni color) y contexto.
(desde 1.0.0)

**Props**
- `label`: `string | null` = `null`
- `value`: `string | number | null` = `null`
- `unit`: `string | null` = `null`
- `trend`: `string | null` = `null`
- `direction`: `'up' | 'down' | 'flat'` = `"flat"`
- `trendColor`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"neutral"`
- `context`: `string | null` = `null`
- `size`: `'sm' | 'md' | 'lg'` = `"md"`

### GNavBar · `<g-nav-bar>` · stable · `@grana/vue/nav-bar`

Barra superior de navegación de un sitio: los enlaces a sus secciones con la actual marcada por la ruta (aria-current="page", de la prop current, nunca de location) y el sitio para las acciones globales de la aplicación (búsqueda, idioma, tema). Lista de enlaces (APG Disclosure Navigation), sin flechas ni roles de menú. Por debajo de 80rem las acciones van en «…» (disclosure con popover="auto") y por debajo de 48rem todo va en una pantalla de menú con hamburguesa; todo está en el HTML del servidor y el CSS enseña lo que toca. P1 · una sola luz bajo el puntero (#957). Vive en el slot header de GAppShell.
(desde 1.0.0)

**Props**
- `items`: `Array<{ id: string; label: string; href: string; activeMatch?: string; external?: boolean; target?: string; rel?: string; lang?: string; hreflang?: string; [key: string]: unknown }>` = `[]`. Enlaces { id, label, href, activeMatch?, external?, target?, rel?, lang?, hreflang? } en el orden de la barra. Sin id, label o href se ignora (aviso 1); id repetido, gana el primero (aviso 2); activeMatch es una cadena de RegExp sin banderas que se prueba contra current y se compila una vez por cambio de items (si no compila, aviso 3 y href === current). external: target="_blank", rel="noreferrer", icono arrow-up-right y labels.newTab oculto; nunca es actual ni emite navigate. Cualquier otro campo llega a navigate.
- `current`: `string | null` = `null`. La ruta actual de la aplicación. La actual es el primer item que casa (activeMatch o href === current); sin current, ninguno. Al cambiar se cierran «…» y la pantalla.
- `label`: `string` = `null` (obligatoria). Nombre del <nav> (y del de la pantalla). Aviso 4 sin él.
- `labels`: `{ more?: string; menu?: string; newTab?: string }` = `{}`. Textos, sin valores por defecto (#226): more (botón «…»), menu (hamburguesa), newTab (texto oculto de un externo). Aviso 6 sin more o menu; aviso 5 con un externo y sin newTab.
- `id`: `string | null` = `null`. id de la raíz y prefijo de {id}-more-btn, {id}-more, {id}-toggle y {id}-screen; generado SSR-seguro sin valor.
**Eventos**
- `navigate` (`{ item: any; event: any }`): Clic primario o Intro en un enlace interno (barra o pantalla), sin modificadores, sin defaultPrevented y sin target de otro contexto (#505, #574). Cancelable de forma síncrona; elegir cierra «…» y la pantalla también si se cancela. Un externo no lo emite
**Slots**
- `brand`: Marca de la aplicación (enlace a la portada). Se oculta por CSS con un GSidebar expandido o en riel en el chasis
- `search`: Disparador de búsqueda de la aplicación (receta del README); sigue en la barra en estrecho
- `actions`: Acciones globales (idioma, tema). Se pinta tres veces; en bar, GNavBar pone un separador decorativo antes de cada nodo de primer nivel

### GNumberField · `<g-number-field>` · stable · `@grana/vue`

Campo para un número que se escribe (edad, peso, temperatura, cantidad): texto con forma de número en el formato del idioma, modelo Number o null, valor canónico en el envío y −/+ opcionales. Compone GInput.
(desde 1.0.0)

**Props**
- `modelValue`: `number | null` = `null`. Nunca cadena; undefined = null; NaN/±Infinity = null con aviso
- `min`: `number | null` = `null`. Limita los pasos y deshabilita −; aria-valuemin; no limita lo escrito (#157); decide si se acepta «-»
- `max`: `number | null` = `null`. Limita los pasos y deshabilita +; aria-valuemax; no limita lo escrito
- `step`: `number` = `1`. > 0; rejilla contada desde min (o 0), aritmética exacta
- `precision`: `number | null` = `null`. Entero ≥ 0: redondea el modelo en el acto y el texto al salir; 0 = entero (inputmode numeric)
- `currency`: `string | null` = `null`. Código ISO 4217 (#777): deriva precision (la explícita gana), el símbolo en su lado (con el código si es ambiguo) y su nombre en la descripción; cambiar la precisión efectiva emite el modelo redondeado sin change; pegar con símbolo, código o nombre de esa moneda se interpreta. Sin locale en SSR, sin afijo hasta montar
- `locale`: `string | null` = `null`. prop › lang del ancestro más cercano › navigator.language; leído al montar
- `grouping`: `boolean` = `true`. Miles al salir con la regla del idioma
- `prefix`: `string | null` = `null`
- `suffix`: `string | null` = `null`. Unidad fija (P1: pegada al número)
- `prefixLabel`: `string | null` = `null`
- `suffixLabel`: `string | null` = `null`
- `steppers`: `boolean` = `false`. −/+ solo con decrementLabel e incrementLabel; ausentes en readonly
- `decrementLabel`: `string | null` = `null`
- `incrementLabel`: `string | null` = `null`
- `name`: `string | null` = `null`. Al <input type=hidden> con el valor canónico; registra el campo en GForm; el visible no lleva name
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`
- `valid`: `string | null` = `null`
- `output`: `string | null` = `null`
- `required`: `boolean` = `false`. aria-required y la marca de GForm; nunca required nativo (#311)
- `mark`: `boolean | null` = `null`
- `readonly`: `boolean | null` = `null`. readonly nativo y aria-readonly; sin pasos ni −/+; se envía
- `disabled`: `boolean | null` = `null`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `variant`: `'outline' | 'soft'` = `"outline"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | null` = `null`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `block`: `boolean | null` = `null`
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`number | null`): Cada cambio del número (no del texto): al escribir, al pegar, en cada paso (también al repetir) y al redondear por precision
- `change` (`number | null`): Valor confirmado: al salir o con Enter si difiere del último confirmado, y una vez por gesto de paso (al soltar −/+, keyup de la tecla de paso, click sin puntero). Declarado: no llega al change nativo. Un cambio desde la aplicación no lo emite
**Slots**
- `label`: Etiqueta con contenido rico (como GInput)
- `hint`: Ayuda con contenido rico
- `error`: Error con contenido rico
- `prepend`: Icono decorativo antes del prefijo

### GPageHeader · `<g-page-header>` · stable · `@grana/vue/page-header`

Encabezado de página: dónde estoy (ruta), qué es (hN, antetítulo, descripción, estado), qué puedo hacer (acciones), cómo va (contenido) y qué secciones tiene (pestañas). B · Zócalo: las pestañas y las acciones viven en la última fila; al desplazar, el encabezado entero se hunde hasta que solo asoma el zócalo, con un título compacto ligado al desplazamiento. En estrecho y pegado, las mismas acciones bajan a un muelle en la zona del pulgar.
(desde 1.0.0)

**Props**
- `title`: `string` = `null` (obligatoria). Texto del hN, del título compacto (aria-hidden) y del enlace del muelle. Vacío o solo espacios cuenta como ausente (aviso 1). El slot title sustituye el contenido del hN, nunca el de las copias.
- `headingLevel`: `1 | 2 | 3` = `1`. Nivel del encabezado (h1 por defecto; 2 o 3 en una vista anidada). Fuera de lista: aviso 3 y se usa 1. En vivo cambia la etiqueta y conserva el id.
- `eyebrow`: `string | null` = `null`. Antetítulo, antes del hN (el slot eyebrow lo sustituye).
- `description`: `string | null` = `null`. Párrafo bajo el título (el slot description lo sustituye).
- `sticky`: `boolean` = `true`. Pegado de serie cuando hay zócalo (#628). false: el encabezado se va con la página, sin muelle; en vivo, las acciones vuelven al zócalo (con la regla del foco) y se retiran las reservas.
- `zone`: `'none' | 'brand'` = `"none"`. Zona de marca: brand pone data-g-zone="brand" en la raíz (Z2; nunca un envoltorio). Fuera de lista: aviso 10 y none; con data-theme en la misma raíz, aviso 10.
- `labels`: `{ actions?: string }` = `"{}"`. { actions }: nombre del grupo de acciones (role="group"). Sin valores por defecto (#226); obligatorio si hay acciones (aviso 4).
- `id`: `string | null` = `null`. Base de ids (generada, SSR-segura, si falta): {id}-title es el hN y el destino del enlace del muelle. Si se da, va también en la raíz.
**Slots**
- `trail`: La ruta (GBreadcrumbs). Primer hijo de la raíz
- `eyebrow`: Antetítulo en línea (sustituye a la prop)
- `title`: Contenido en línea del hN (p. ej. un código con <bdi>); nunca elementos interactivos. Las copias usan la prop title
- `description`: Descripción (sustituye a la prop)
- `meta`: Estado de la página: GBadge, GTag, GSummary, texto
- `default`: Contenido (GMetric, GAdaptiveLayout); no va al zócalo
- `tabs`: Un GTabs con detached (los GTabPanel van en el cuerpo de la página, #118; con paneles integrados, aviso 9)
- `actions`: GBtn y GMenu, en el grupo role="group" del zócalo; en estrecho y pegado, los mismos nodos se mudan al muelle. Lo que depende de docked cambia props, no instancias. Alcance: { narrow, docked }
**Métodos**
- `focus(options?: FocusOptions): void`: Enfoca el hN (tabindex="-1"), pasando options a HTMLElement.focus. Dónde llevar el foco al cambiar de ruta; cuándo, lo decide la aplicación
**Claves de `labels`**: `actions`

### GPageIndex · `<g-page-index>` · stable · `@grana/vue/page-index`

Índice de las secciones de la página que se está leyendo, con la sección actual siguiendo la lectura (aria-current="location"). Forma relay: un botón de menú cuyo texto dice dónde estás («En esta página · API») y despliega las secciones como un GMenu de elementos-enlace; al elegir, el navegador sigue el #id y el foco va a la sección. El relevo del texto se funde y se desplaza un paso en el sentido de la lectura; el ancho no cambia nunca (pila de etiquetas, sin medir). Forma list (#1054, extensión @grana/vue/page-index-list): columna «En esta página» con nav nombrado por su título, enlaces con level 2 y 3 (un 3 cuelga del 2 anterior), marcador sobre la línea guía, desplazamiento propio y PI-P1 (la columna trae la actual a la vista sin mover nunca la página; se detiene con el puntero o el foco dentro); con fold, botón + panel (disclosure) con «Volver arriba». PI-L5: la instancia list sin cajas no lee ni emite.
(desde 1.0.0)

**Props**
- `items`: `Array<{ id: string; label: string; href?: string; level?: 2 | 3; [key: string]: unknown }>` = `[]`. Secciones { id, label, href?, level? } en el orden del documento; id es el del elemento destino; href por defecto #id. level 2 | 3 (sin valor, 2) vale en list: un 3 cuelga del 2 anterior y un 3 sin 2 previo va a la raíz; otro valor cuenta como 2 (aviso 9); en relay los 3 no se pintan ni se leen. Sin id o sin label se ignora (aviso 1); id repetido, gana el primero (aviso 2). Cualquier otro campo se conserva y llega a navigate.
- `modelValue`: `string | null` = `null`. id de la sección actual (v-model opcional). Con track, la lectura lo corrige en el siguiente desplazamiento; un id sin item cuenta como ninguno.
- `track`: `boolean` = `true`. Línea de lectura (api.md «Lugar actual», #1039). false: la actual es solo modelValue.
- `scroller`: `string | Element | null` = `null`. Selector o elemento que se desplaza; sin valor, el documento. Se resuelve al montar; no encontrado, aviso 3 y el documento.
- `appearance`: `'relay' | 'list'` = `"relay"`. Forma. relay (botón de menú en un zócalo) o list (columna de enlaces; necesita la extensión @grana/vue/page-index-list: sin ella, aviso 7 y relay). line y rail reservados (#1038); fuera de lista, aviso 4.
- `fold`: `boolean` = `false`. Solo con list: forma plegada (botón de texto + panel, APG Disclosure) con «Volver arriba» (labels.top). Con relay, aviso 8 y se ignora.
- `label`: `string` = `null` (obligatoria). Nombre del <nav> y texto fijo del disparador (aviso 5 sin él).
- `align`: `'start' | 'end'` = `"end"`. Alineación de la lista (de GMenu) en relay; con fold, el borde del botón con el que se alinea el panel.
- `labels`: `GranaLabels` = `{}`. Textos de GMenu, tal cual y sin valores por defecto (#1049): findHint, matches, matchesOne, none (buscar al escribir, #797) y opened/openedLive, copied/copiedLive (pestaña nueva y copiar el enlace a la sección; sin una pareja, ese gesto queda en el del navegador y GMenu avisa E6). Con list y fold: top («Volver arriba», obligatorio; aviso 10).
- `id`: `string | null` = `null`. id de la raíz y prefijo de los de GMenu ({id}-trigger, {id}-list); generado SSR-seguro sin valor.
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`string | null`): La sección actual cambia por la lectura o por elegir una (no cuando cambia modelValue desde fuera)
- `navigate` (`{ item: any; event: any }`): Se elige una sección con clic primario o Intro/Espacio sin modificadores (guarda de #505 con #574). preventDefault() síncrono: Grana no cambia la actual ni mueve el foco (router o desplazamiento propio)
**Métodos**
- `refresh(): void`: Vuelve a leer la actual en el siguiente cuadro (contenido que crece sin desplazamiento). Con una elegida sostenida (#1048) no hace nada

### GPagination · `<g-pagination>` · stable · `@grana/vue`

Paginación de una colección: primera, última, la actual y sus vecinas con elipsis; forma compacta («Página N de M») cuando no caben los botones; con pageSizes, selector de filas por página (radios nativos) que conserva la fila ancla.
(desde 1.0.0)

**Props**
- `page`: `number` = `1`
- `total`: `number` = `0`
- `pageSize`: `number` = `10`. v-model:pageSize (#593). Sin v-model, la paginación guarda el tamaño elegido (espejo)
- `pageSizes`: `number[]` = `null`. Enteros ≥ 1: se ordenan y se depuran (aviso); un pageSize fuera de la lista se añade (aviso). Sin pageSizes no hay selector (#593)
- `siblings`: `number` = `1`
- `responsive`: `'auto' | 'full' | 'compact'` = `"auto"`
- `labels`: `GranaLabels` = `{}`
**v-model**: `v-model:page` → `page`, `v-model:pageSize` → `pageSize`
**Eventos**
- `update:pageSize` (`number`): El usuario elige un tamaño en el selector; siempre antes que update:page, en el mismo manejador (#593, #594)
- `update:page` (`number`): El usuario cambia de página; tras update:pageSize, en el mismo ciclo y solo si la página cambia (página = ⌊índice del ancla ÷ tamaño nuevo⌋ + 1)
**Claves de `labels`**: `nav`, `previous`, `next`, `page`, `range`, `compact`, `pageSize`

### GPartyField · `<g-party-field>` · stable · `@grana/vue/booking`

Personas por tipo (adultos, niños, habitaciones; claves de la aplicación) con el resumen en palabras en el disparador y un panel de contadores (GNumberField steppers), o las filas a la vista (inline). Campo de Grana: etiqueta, mensajes, contexto de GForm y ocultos {name}[{key}].
(desde 1.0.0)

**Props**
- `modelValue`: `Record<string, number>` = `{}`. { [key]: Number }, completado con default/min de cada fila. Un valor que excede un max dependiente se corrige y se emite.
- `rows`: `PartyRow[]` = `null` (obligatoria). [{ key, label, hint?, min? (0), max? (Number o (value) => Number), default?, unit? (String con {count} o (count) => String), decrementLabel, incrementLabel }] (avisos 1 y 3).
- `mode`: `'popover' | 'inline'` = `"popover"`. popover: disparador + panel en la capa superior; inline: filas a la vista en un role=group (dentro de un modal).
- `label`: `string | null` = `null`. Etiqueta (obligatoria salvo aria-label/aria-labelledby o slot trigger; aviso 2).
- `hint`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`
- `valid`: `string | null` = `null`
- `name`: `string | null` = `null`. Ocultos {name}[{key}] por fila (también con disabled) y registro en GForm.
- `disabled`: `boolean | null` = `null`
- `readonly`: `boolean | null` = `null`. El disparador es enfocable y no abre; en inline, contadores en solo lectura.
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `variant`: `'outline' | 'soft'` = `"outline"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `block`: `boolean | null` = `null`
- `labels`: `{ done?: string; separator?: string }` = `{}`. { done, separator } sin valores por defecto (aviso 3).
- `locale`: `string | null` = `null`
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`Record<string, number>`): Cambia un contador o se corrige un valor por un max dependiente
- `open`: El panel se abre
- `close`: El panel se cierra (Esc, Tab fuera, tocar fuera, «Listo»)
**Slots**
- `trigger`: Sustituye al disparador (la frase de GBookingBar); la raíz lleva g-party-field--trigger y no se pintan label, hint ni mensaje
- `label`: Etiqueta del campo
**Métodos**
- `() => void`
- `() => void`
- `() => void`

### GPrice · `<g-price>` · stable · `@grana/vue/price`

Un precio que se dice como se habla y que nunca miente sobre su moneda: lo visible es corto («$1,850 MXN / noche») y lo que oye el lector es la frase completa con el nombre de la moneda («desde 1,850 pesos mexicanos por noche»). El código ISO aparece solo si el símbolo es ambiguo; la referencia se nombra en vez de tacharse (C, por defecto); el total de lo pedido aparece con total (A) y sus cifras ruedan. Sin rol, sin foco y sin región viva.
(desde 1.0.0)

**Props**
- `value`: `Money | Money[] | null` = `null`. Money { amount, currency, approximate? } o Money[] (alternativas; solo dentro de un GPriceScope se elige). null = «a consultar» (labels.onRequest).
- `max`: `Money | Money[] | null` = `null`. Extremo superior de un rango, en la moneda del importe («$900 a $1,400 MXN»; plantilla labels.range, nunca formatRange).
- `compareAt`: `Money | Money[] | null` = `null`. Precio de referencia, en la moneda del importe.
- `compareLabel`: `string | null` = `null`. Qué es la referencia («Temporada alta»). Obligatoria con trace (aviso 5; respaldo labels.before; sin los dos, la referencia no se pinta).
- `compareStyle`: `'trace' | 'strike'` = `"trace"`. trace (C): sin tachar, encima del precio, nombrada, con flecha y ahorro; strike: <s> después del precio, sin ahorro.
- `lead`: `string | null` = `null`. Texto previo («desde»); se ve y se lee.
- `unit`: `string | null` = `null`. Unidad visible («/ noche»).
- `unitLabel`: `string | null` = `null`. Unidad leída («por noche»); sin ella, unit (#166).
- `total`: `PriceTotal | null` = `null`. A · La cuenta: { value: Money | Money[], label } de la aplicación (Grana no multiplica). Arriba y en grande; al cambiar el importe, solo ruedan las cifras que cambian.
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`. Rol tipográfico de la cifra: xs (día del calendario), sm (carta), md (tarjeta), lg (total del carrito), xl (plan). El secundario nunca baja de caption (12px).
- `display`: `'auto' | 'symbol' | 'code' | 'none'` = `"auto"`. auto: símbolo y, si es de varias monedas y la región no la declara, el código; symbol: nunca el código; code: el código de Intl; none: solo la cifra.
- `cents`: `'auto' | 'always' | 'never'` = `"auto"`. auto: decimales de la moneda sin «,00» en los enteros; always: siempre; never: enteros (solo con size xs, aviso 3).
- `locale`: `string | null` = `null`. BCP 47. Si falta: el de su GPriceScope › el lang del ancestro (al montar) › navigator.language. Sin locale antes de montar (SSR), la forma canónica «1850 MXN».
- `labels`: `PriceLabels` = `{}`. PriceLabels de la aplicación (sin valores por defecto, #226), fusionados sobre los de su GPriceScope: free, onRequest, before, range, saving, approx, total.

### GPriceScope · `<g-price-scope>` · stable · `@grana/vue/price`

B · La moneda se dice una vez: una región que declara su moneda con una leyenda con sello; dentro, un precio de esa moneda no lleva código y solo lo extranjero lo conserva. Con view, la aplicación cambia todos los precios de la región a la vez (sus alternativas, marcadas «aprox.»). Hereda locale y labels a sus GPrice. Sin rol, sin nombre, sin región viva.
(desde 1.0.0)

**Props**
- `currency`: `string` = `null` (obligatoria). Moneda de la región (ISO 4217). Obligatoria (aviso 10).
- `view`: `string | null` = `null`. Moneda de la vista (la elige la aplicación con su control, fuera de las tarjetas); sin valor, currency.
- `legend`: `boolean` = `true`. Pinta la leyenda con labels.legend. false: la aplicación promete que la moneda está dicha en otro sitio visible (los códigos se omiten igual).
- `taxes`: `string | null` = `null`. Texto de impuestos de la aplicación («IVA incluido»), tras la leyenda.
- `locale`: `string | null` = `null`. BCP 47; lo heredan los precios de dentro (útil en SSR).
- `labels`: `PriceLabels & { legend?: string }` = `{}`. PriceLabels + legend («Precios en {name} ({code})»); los demás los heredan los GPrice de dentro.
- `as`: `'div' | 'section' | 'aside'` = `"div"`. Elemento de la región.
**Slots**
- `default`: Contenido de la aplicación (carta, lista, carrito) con sus GPrice

### GProgress · `<g-progress>` · stable · `@grana/vue`

Primitiva de widget: barra de progreso (role progressbar) con nombre, valor y texto propios.
(desde 1.0.0)

**Props**
- `value`: `number` = `0`
- `max`: `number` = `100`
- `label`: `string | null` = `null`
- `valueText`: `string | null` = `null`
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`
- `size`: `'sm' | 'md'` = `"md"`
- `showValue`: `boolean` = `true`
- `showLabel`: `boolean` = `true`. Con false la etiqueta no se pinta pero sigue siendo el nombre accesible (aria-label, sigue obligatoria); con showLabel y showValue a false no hay g-progress__row (barra sola). widget.md, DECISIONS.md #375 (la ficha de GFileField)

### GRadioGroup · `<g-radio-group>` · stable · `@grana/vue`

Una pregunta con una sola respuesta, con radios nativos de name común y cinco apariencias (list, inline, segmented, chip, card) que cambian la forma, no la semántica.
(desde 1.0.0)

**Props**
- `modelValue`: `string | number | boolean | null` = `null`. value de la opción elegida con su tipo original, comparado con ===. null/undefined = sin selección (fuera de FormData). type [String, Number, Boolean] con String antes de Boolean y default null: '' no se vuelve true y la prop ausente no se vuelve false
- `options`: `RadioOption[]` = `[]`. { value, label, description?, icon?, disabled? } (forma de GSelect, sin grupos). value String/Number/Boolean único por === y por String(value); label obligatorio. Las inválidas y los grupos se ignoran con aviso; los ids siguen el índice tras descartarlas
- `appearance`: `'list' | 'inline' | 'segmented' | 'chip' | 'card'` = `"list"`. Fija la raíz (#268): inline y segmented → <div role=radiogroup> de tres hijos, admitidos en una GFormRow con más hijos; list, chip y card → <fieldset role=radiogroup> + <legend>, fila propia
- `labelMode`: `'full' | 'icon'` = `"full"`. icon solo en segmented y chip y sin slot option: is-icon-only en cada opción con icono; la etiqueta queda como texto oculto accesible (nombre del radio). Fuera de eso cuenta como full y avisa · Pista de solo icono (#435): motor de GTooltip en modo visual; un nodo g-tooltip aria-hidden sin role ni id por opción is-icon-only, al final de __options (nunca dentro de la <label> ni hijo de la raíz); data-g-tooltip en el radio y data-g-tooltip-box en la __option (la pestaña mide el segmento o el chip); grupo = radiogroup (viaja con puntero y flechas); abajo en línea, derecha lógica con is-stacked; opción disabled sin pista (límite conocido: usar readonly); pulsación larga muestra y no elige. El nombre accesible no cambia
- `name`: `string | null` = `null`. name común de los radios y clave en errors/warnings de GForm y en FormData. Sin él se genera uno estable (useId); dentro de un <form> avisa
- `label`: `string | null` = `null`. <span> (inline/segmented) o <legend> (list/chip/card) con id ID-label; aria-labelledby de la raíz
- `hint`: `string | null` = `null`. Ayuda en el pie (ID-hint), en el aria-describedby de la raíz
- `error`: `string | null` = `null`. Mensaje de error (C4); aria-invalid solo en la raíz
- `warning`: `string | null` = `null`. No bloquea ni pone aria-invalid (C5)
- `valid`: `string | null` = `null`. Mensaje de válido (C5)
- `required`: `boolean` = `false`. aria-required en la raíz y marca según la convención de GForm; nunca required nativo en los radios (#269)
- `mark`: `boolean | null` = `null`. false quita la marca; markRule both (un grupo de radios sí lleva «(opcional)»)
- `readonly`: `boolean | null` = `null`. aria-readonly en la raíz; radios habilitados, enfocables y en FormData; cancela el keydown de las cuatro flechas y el click (#272). Hereda de GForm/GFormLayout
- `disabled`: `boolean | null` = `null`. fieldset: disabled nativo del <fieldset>; div: disabled en cada radio. Fuera del Tab y de FormData. Hereda del contexto
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Prop › contexto › default
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`. Relleno de la elegida; el error usa siempre danger
- `field`: `boolean` = `true`. #262. false = control suelto dentro de otro componente: sin __message ni aria-live, sin contexto de GForm (ni registro ni herencia de density, readonly, disabled, errores ni marcas); error, warning, valid, required y mark se ignoran con aviso; el pie solo existe con hint. Se lee al crear el grupo
- `id`: `string | null` = `null`. De la raíz; derivan ID-label, ID-hint, ID-message y por opción ID-i, ID-i-label, ID-i-description
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`string | number | boolean`): El usuario elige otra opción (change nativo del radio). Nunca con readonly ni disabled, ni al cambiar modelValue desde fuera. change, focusin, focusout y keydown no se declaran: suben del radio a la raíz por $attrs (manejadores del contexto y propios primero, C8)
**Slots**
- `label`: Etiqueta del grupo con contenido rico (dentro de ID-label; nada interactivo)
- `hint`: Ayuda con contenido rico (dentro de ID-hint)
- `error`: Mensaje de error con contenido rico; solo con error visible, tras icono y prefijo
- `option`: Contenido de una opción: sustituye a icono, etiqueta y descripción dentro de ID-i-label (todo es el nombre del radio); el <input> lo pone el componente; nada interactivo. Con él, labelMode=icon no tiene efecto (aviso)
- `icon`: Icono de una opción (manda sobre option.icon, #202); solo en opciones con icon con valor; dentro de __icon aria-hidden

### GSection · `<g-section>` · stable · `@grana/vue`

Región de página con encabezado (h2 a h4), descripción y acciones: el nivel lo pone el documento por anidación y el tamaño del título la profundidad; sin superficie, plegado ni pegado. Región con nombre solo con landmark.
(desde 1.0.0)

**Props**
- `title`: `string | null` = `null`. Texto del encabezado; obligatoria salvo con el slot title (sin ninguno, aviso 1).
- `description`: `string | null` = `null`
- `headingLevel`: `2 | 3 | 4 | null` = `null`. Automático por defecto: 2 en la primera, +1 por cada GSection antepasada, tope 4. Fijado, gana y las de dentro cuentan desde él. Cambia la etiqueta, no el tamaño. Fuera de lista: aviso 3 y automático.
- `landmark`: `boolean` = `false`. aria-labelledby al título: la section pasa a ser region con nombre.
- `labels`: `{ actions?: string }` = `"{}"`. { actions }: nombre del grupo de acciones. Sin valores por defecto (#226); obligatorio si hay slot actions (aviso 2).
- `id`: `string | null` = `null`. Base de ids ({id}-title) e id de la raíz; generado (SSR-seguro) si falta.
**Slots**
- `title`: Contenido en línea del hN; nunca elementos interactivos
- `description`: Texto; sustituye a la prop
- `actions`: GBtn y GMenu, al final de la fila del título; bajan solas con poco ancho
- `default`: Contenido de la sección (el cuerpo, pila md)
**Claves de `labels`**: `actions`

### GSelect · `<g-select>` · stable · `@grana/vue`

Selector de una opción con lista propia (combobox de solo selección): grupos, opciones deshabilitadas, teclado completo con typeahead, hoja inferior en móvil.
(desde 1.0.0)

**Props**
- `modelValue`: `string | number | null` = `null`
- `options`: `Array<SelectOption | SelectOptionGroup>` = `[]`
- `variant`: `'outline' | 'soft'` = `"outline"`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | null` = `null`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `block`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `disabled`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `readonly`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `loading`: `boolean` = `false`
- `placeholder`: `string | null` = `null`
- `clearable`: `boolean` = `false`
- `clearLabel`: `string | null` = `null`
- `emptyText`: `string | null` = `null`
- `createLabel`: `string | null` = `null`
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`. Advertencia: no bloquea ni pone aria-invalid (C5)
- `valid`: `string | null` = `null`. Mensaje de válido útil (C5)
- `required`: `boolean` = `false`
- `mark`: `boolean | null` = `null`. false quita la marca de la convención de GForm (C3)
- `name`: `string | null` = `null`
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`string | number | null`): El usuario elige una opción distinta o borra con clearable (null)
- `open`: La lista se abre
- `close`: La lista se cierra, por el motivo que sea
- `create`: El usuario activa la fila «Agregar nuevo…» (createLabel). No cambia el valor; el foco ya volvió al selector
**Slots**
- `label`: Etiqueta con contenido rico (sustituye a label)
- `hint`: Ayuda con contenido rico
- `error`: Mensaje de error con contenido rico; solo se muestra con error (en la región __message)
- `option`: Contenido de una opción. Alcance: { option, selected, active }. Sin interactivos
- `value`: Contenido del valor mostrado. Alcance: { option }. Solo con una opción elegida
- `empty`: Contenido de la lista vacía (sustituye a emptyText)
- `prepend`: Icono decorativo antes del valor, dentro del botón (aria-hidden). Lo sustituye el icono de la opción elegida
- `icon`: Icono decorativo de una opción y del valor mostrado. Alcance: { option }. Solo se pinta si devuelve contenido; no se usa si se usan los slots option o value

### GSidebar · `<g-sidebar>` · stable · `@grana/vue`

Navegación lateral que se transforma con un solo sistema: expandida, riel de iconos, navbar inferior con píldora activa y drawer. Items por arreglo (grupos, un nivel de hijos), destino actual por modelValue, adaptación por el ancho del contenedor y movimiento con transiciones. En el riel, cada item de primer nivel (padres incluidos), la búsqueda y contraer/expandir llevan la pista del motor de GTooltip en modo visual (#436, sustituye g-sidebar__tip): nodos g-tooltip aria-hidden al final de la raíz, activos solo en rail, a la derecha lógica, que viajan dentro del <nav>; la del padre se cierra al abrir su panel; la pulsación larga muestra y no navega ni abre el panel.
(desde 1.0.0)

**Props**
- `items`: `SidebarItem[]` = `[]`. Un item de primer nivel con icon cadena (nombre de Lucide) y sin slot icon dibuja GIcon en g-sidebar__icon (registro de la aplicación → librería; #202); con slot icon, manda el slot; otro valor de icon es dato opaco para el slot; los hijos no llevan icono. Campos del filtro y del código (#1035, #1036): code (1 a 3 caracteres, solo primer nivel: se pinta en el asiento con data-code y va al principio del nombre accesible; C1 con icon, C2 > 3, C3 en un hijo), keywords (arreglo de cadenas: alias, otro idioma, slug; F4) y filterable: false (en un grupo o un item: nunca se oculta ni se cuenta). Grupo { label, items, id?, collapsible?, collapsed? } (#1061): collapsible pliega el grupo (botón de APG Disclosure + g-sidebar__group-body con hidden="until-found" al asentar); id obligatorio con collapsible (sin él, A3 y no se pliega); collapsed es el estado inicial sin closedGroups. En appearance="index" icon y el slot icon se ignoran (A2) y code va al final de la fila (g-sidebar__code) con su texto oculto después de la etiqueta («GCombobox, 24»). collapsible y collapsed solo actúan con @grana/vue/sidebar-index (#1069); sin ella, el grupo es fijo y abierto (collapsed se ignora, A5)
- `appearance`: `'default' | 'index'` = `"default"`. index (#1060): piel del índice de documentación; solo expandida y drawer (auto: expandida ≥ breakpoints.expanded, drawer por debajo; rail → expandida y navbar → drawer con A1), sin botón de contraer (collapsed, overlay, variant y barCount no actúan), sin asiento ni iconos (A2), número al final, la marca del actual que viaja (g-sidebar__mark, #1062) y cabecera como la banda. Fuera de lista: default (A4). Necesita la extensión @grana/vue/sidebar-index (#1069); sin ella, se pinta default (A5)
- `closedGroups`: `GranaKey[]` = `null`. id de los grupos plegables cerrados (#1061). Sin la prop, el estado es interno y nace de collapsed de cada grupo nuevo; con ella, manda el arreglo (v-model:closedGroups para controlar o persistir). Un id que no es de un grupo plegable válido se ignora. La ruta abre el grupo del actual al montar (emite tras montar) y al cambiar modelValue. Necesita la extensión @grana/vue/sidebar-index (#1069); sin ella, se ignora y update:closedGroups no se emite (A5)
- `modelValue`: `string | number | null` = `null`
- `label`: `string | null` = `null`
- `mode`: `'auto' | 'expanded' | 'rail' | 'navbar' | 'drawer'` = `"auto"`
- `mobile`: `'navbar' | 'drawer'` = `"navbar"`
- `collapsed`: `boolean` = `false`
- `open`: `boolean` = `false`
- `container`: `string | Element | null` = `null`
- `breakpoints`: `{ expanded?: number; rail?: number } | null` = `null`. Cortes de mode="auto" en px de ancho del contenedor: { expanded?, rail? }. null o {} = space × 240 / space × 150; una clave sola conserva la otra; un valor no numérico, no finito o negativo, o una clave desconocida, se ignora con aviso (B1); rail > expanded se recorta a expanded (aviso B2 solo si se dieron las dos); rail = expanded = sin riel; solo actúa con mode="auto" y su cambio decide al momento (#618)
- `contained`: `boolean` = `false`
- `variant`: `'fixed' | 'floating'` = `"fixed"`
- `overlay`: `boolean` = `false`
- `barCount`: `3 | 4 | 5` = `4`
- `search`: `boolean` = `false`
- `filter`: `boolean` = `false`. Filtro del índice en la cabecera (sidebar.md §«Filtro del índice», #1035). Necesita la extensión @grana/vue/sidebar-filter (app.use(SidebarFilter), #1050); sin ella actúa como false (sin campo; search vuelve a actuar), query se ignora, update:query no se emite y avisa F5. Con ella: campo type=search que oculta con hidden lo que no coincide (sin desmontar), recuento visible y anunciado (cortés, 600 ms), Intro activa el primer destino, ↓ a la lista, Esc vacía sin propagar; en el riel, un botón (g-sidebar__search con is-filtering); en el navbar, en el drawer. Con filter y la extensión, search no actúa (F1); con el slot search, manda el slot (F2)
- `query`: `string` = `""`. Texto del filtro, con v-model:query (#1035)
- `filterKeyshortcuts`: `string | null` = `null`. Valor de aria-keyshortcuts del campo (p. ej. '/ Control+K Meta+K'); el componente no escucha atajos globales: la aplicación llama a focusFilter()
- `closeOnNavigate`: `boolean` = `true`
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`. Relleno de los contadores y puntos (--g-color-{color} y on-) en todos los formatos. No pinta el item actual ni la píldora del navbar: los dos leen las ranuras --g-sidebar-current* (#615)
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `labels`: `GranaLabels` = `{}`. Textos sin valor por defecto. Con filter (#1035): filter (nombre del campo y del botón del riel), filterPlaceholder, filterHint (atajo visible, decorativo), filterCount (función (shown, total) => texto), filterNone (función (query) => texto) y filterClear (nombre del botón de vaciar); sin los requeridos, F3. groupCurrent (recomendado con grupos collapsible, #1061): texto oculto en el botón de un grupo plegado con la página actual dentro
**v-model**: `v-model:closedGroups` → `closedGroups`, `v-model` → `modelValue`, `v-model:collapsed` → `collapsed`, `v-model:open` → `open`, `v-model:query` → `query`
**Eventos**
- `navigate` (`{ item: any; event: any }`): El usuario elige un destino; event es el evento nativo (preventDefault cancela update:modelValue y el cierre del drawer). En un enlace, solo con activación primaria (#505): con Ctrl/⌘/Mayús/Alt, botón central o ya cancelado no se emite ni cambia el actual
- `update:modelValue` (`GranaKey`): Tras navigate no cancelado
- `update:collapsed` (`boolean`): El usuario contrae o expande con el botón
- `update:open` (`boolean`): El drawer se abre o se cierra
- `mode-change` (`{ mode: any; overlay: any }`): El formato resuelto cambia (y al montar)
- `search`: El usuario activa el disparador de búsqueda
- `update:query` (`string`): El texto del filtro cambia (escribir, vaciar con Esc o con el botón); #1035
- `update:closedGroups` (`GranaKey[]`): El usuario pliega o despliega un grupo (clic, Intro, Espacio), beforematch abre uno (Ctrl+F) o la ruta abre el del actual (#1061). El filtro no lo emite. Sin @grana/vue/sidebar-index, nunca (#1069)
**Slots**
- `logo`: Identidad en la cabecera. Alcance: { collapsed }
- `header`: Contenido extra bajo el logo. Alcance: { collapsed }
- `search`: Sustituye al disparador de búsqueda. Alcance: { collapsed }
- `icon`: Icono de un item (decorativo); sustituye al GIcon por nombre de item.icon. Alcance: { item }
- `item`: Contenido de un item (sustituye a icono + etiqueta). Alcance: { item, active, collapsed, level }; conserva el texto de la etiqueta
- `user`: Área de usuario al pie. Alcance: { collapsed }; el nombre accesible del riel lo da la aplicación
- `toggle-icon`: Icono del botón de contraer/expandir. Alcance: { collapsed }
- `search-icon`: Icono del disparador de búsqueda. Alcance: { collapsed }
- `more-icon`: Icono del botón «Más» del navbar
**Métodos**
- `open(): void`: Abre el drawer
- `close(): void`: Cierra el drawer
- `toggle(): void`: Contrae o expande
- `focus(): void`: Enfoca el primer item
- `focusFilter(): void`: Expandida: enfoca el campo del filtro y selecciona su texto. Riel: expande (update:collapsed false) y enfoca el campo. Drawer o navbar: abre el drawer (update:open true) y enfoca el campo. Sin filter, nada (#1035). Sin la extensión @grana/vue/sidebar-filter no hace nada y avisa F5 (#1050)

### GSlider · `<g-slider>` · stable · `@grana/vue/slider`

Deslizador de un valor acotado donde manda la posición relativa (volumen, intensidad del dolor, una edad aproximada) o de un rango de dos extremos (precio mínimo y máximo). Forma B «El valor es el asa»: la cifra vive dentro de la píldora que se arrastra. Modelo Number o null («sin elegir») o, con range, [inicio, fin]; nunca una cadena.
(desde 1.0.0)

**Props**
- `modelValue`: `number | null | [number, number]` = `null`. Número finito o null («sin elegir»); con range, [inicio, fin]. undefined = null; NaN/±Infinity o un arreglo sin range = null con aviso; con range, null/undefined se dibuja como el recorrido entero sin emitir, mal formado o desordenado con aviso. Fuera de la rejilla o de [min, max] se conserva (#157). Cada emisión es un número, null o un arreglo nuevo; nunca una cadena
- `range`: `boolean` = `false`. Dos asas; explícita (no se deduce del modelo)
- `min`: `number` = `0`. La rejilla cuenta desde min; min ≥ max deja el control sin recorrido (aviso)
- `max`: `number` = `100`. Un max fuera de la rejilla no se alcanza: el último punto es el mayor ≤ max
- `step`: `number` = `1`. > 0 (validador); otro valor avisa y se usa 1; decimales sin error de coma flotante
- `bigStep`: `number | null` = `null`. Mayús+flecha, Re Pág, Av Pág; múltiplo positivo de step; sin valor (o no múltiplo, con aviso), una décima del recorrido en pasos enteros; con snap="marks", dos marcas
- `minGap`: `number` = `0`. Distancia mínima entre las asas de un rango; negativo o mayor que el recorrido avisa y se usa 0; sin range se ignora
- `marks`: `boolean | Array<number | { value: number; label?: string }>` = `false`. true: una raya por punto (≤ 25) o por paso grande; arreglo de Number | { value, label? }: rayas y nombres pulsables bajo el riel (aria-hidden); fuera de [min, max] o repetidos avisan
- `snap`: `'step' | 'marks'` = `"step"`. marks: las marcas son la rejilla (requiere marks en arreglo; si no, avisa y usa step)
- `locale`: `string | null` = `null`. prop › lang del ancestro más cercano › navigator.language (al montar); inválido avisa. Sin locale, SSR y primer render escriben el canónico
- `format`: `Intl.NumberFormatOptions` = `null`. Opciones de Intl.NumberFormat (moneda, unidad, decimales); un porcentaje es { style: 'unit', unit: 'percent' }; style 'percent' con max > 1 avisa; lo que Intl rechaza avisa y se usa {}; con style 'currency' y sin valueText, aria-valuetext dice el nombre de la moneda y sin decimales en los enteros («800 pesos mexicanos», #779)
- `valueText`: `((value: number) => string)` = `null`. (value: number) => string: el texto de la píldora y aria-valuetext a la vez; si no da una cadena no vacía, avisa y se usa el texto por defecto
- `labels`: `{ start?: string; end?: string; empty?: string }` = `{}`. { start?, end?, empty? }: nombres de las asas de un rango (aviso sin ellos) y el texto de «sin elegir» (aviso sin él con valor null). Sin textos propios (#226)
- `name`: `string | null` = `null`. Va a los ocultos (uno por asa, mismo name, orden inicio, fin) y registra el campo en GForm; el nativo no lleva name
- `label`: `string | null` = `null`. Valor único: <label for>; rango: span con id que nombra el grupo (pulsarlo enfoca el inicio)
- `hint`: `string | null` = `null`. Ayuda (aria-describedby)
- `error`: `string | null` = `null`. Mensaje de error (form.md C4)
- `warning`: `string | null` = `null`. Advertencia (form.md C5)
- `valid`: `string | null` = `null`. Mensaje de válido (form.md C5)
- `required`: `boolean` = `false`. Marca según GForm; sin aria-required (no admitido en slider) ni required nativo
- `mark`: `boolean | null` = `null`. false: sin marca de obligatorio u opcional (form.md §2)
- `readonly`: `boolean | null` = `null`. aria-readonly en cada nativo; enfocable; nada cambia el valor; se envía
- `disabled`: `boolean | null` = `null`. disabled en cada nativo y en los ocultos (no se envía)
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. El alto del área es el de la caja de GInput md con la misma densidad; sin valor, contexto o default
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`. Familia de la píldora y del tramo; brand lee el rol primary
- `id`: `string | null` = `null`. id del primer nativo (el del inicio en un rango); el fin lleva id-end. Generado si falta
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`number | null | [number, number]`): Cada cambio del valor: cada paso de teclado (también al repetir), cada movimiento de puntero que cambia de punto, cada confirmación de la cifra tecleada, cada ajuste del lector. Un arreglo nuevo con range. Un cambio desde la aplicación no emite
- `change` (`number | null | [number, number]`): Una vez por gesto que cambió el valor (#448): keyup de la tecla, pointerup/pointercancel/lostpointercapture, la confirmación de la cifra, cada ajuste del lector y la pérdida del foco con un gesto abierto. Sin cambio, ninguno. Los input/change del nativo no burbujean
**Slots**
- `label`: Etiqueta con contenido rico (dentro del <label for> o del span con id en un rango), sin interactivos
- `hint`: Ayuda con contenido rico (conserva ID-hint)
- `error`: Error con contenido rico, dentro de la región g-slider__message

### GSpeechHost · `<g-speech-host>` · stable · `@grana/vue/speech`

Captura de voz y transcripción como servicio por aplicación: la aplicación crea su gestor (createSpeech, también plugin de Vue) con un adaptador del motor (Grana no hace red), monta UN <GSpeechHost /> y coloca disparadores (GSpeechTrigger) y, si quiere, una pill (GSpeechPill). El anfitrión pinta los dos únicos canales que anuncian (presentes desde el montaje), la pill flotante de respaldo (garantía de una pill visible y operable), el panel no modal anclado a la pill visible y la hoja móvil; se traslada al <dialog> modal superior; Mayús+F8 va y vuelve. Sin anfitrión montado no se abre el micrófono.
(desde 1.0.0)

**Props**
- `speech`: `Speech | null` = `null`
**Claves de `labels`**: `region`, `openPanel`, `closePanel`, `duration`, `actions.start`, `actions.cancel`, `actions.pause`, `actions.resume`, `actions.retry`, `actions.finish`, `actions.discard`, `actions.discardAsk`, `actions.discardConfirm`, `actions.closeSession`, `actions.dismiss`, `actions.retrySegment`, `actions.hideActivity`, `states.<status>.short`, `states.<status>.long`, `states.requesting.longGranted`, `states.reconnecting.shortLive`, `states.reconnecting.longLive`, `mode.dictation`, `mode.conversation`, `expectedSpeakers.label`, `expectedSpeakers.options.1`, `expectedSpeakers.options.2`, `expectedSpeakers.options.many`, `noDiarization`, `consent.label`, `consent.required`, `speaker`, `unassigned`, `attempt`, `signalFlat`, `pending`, `pendingNone`, `progress`, `privacy.device`, `privacy.local`, `privacy.remote`, `audio.none`, `audio.memory`, `audio.disk`, `audio.deleted`, `audio.notConfirmed`, `transcript.title`, `transcript.empty`, `transcript.partialFlag`, `transcript.partialPrefix`, `transcript.failed`, `transcript.failedLost`, `announce.requesting`, `announce.ready`, `announce.startDictation`, `announce.startConversation`, `announce.resumed`, `announce.paused`, `announce.processing`, `announce.completedDictation`, `announce.completedConversation`, `announce.reconnecting`, `announce.reconnectingHeld`, `announce.restored`, `announce.restoredHeld`, `announce.inserted`, `announce.undone`, `announce.undoFailed`, `announce.discarded`, `announce.discardedUnconfirmed`, `announce.closed`, `announce.signalFlat`, `announce.segmentFailed`, `announce.busy`, `announce.consentRequired`, `errors.<kind>.title`, `errors.<kind>.what`, `errors.<kind>.fix`, `capture.continues`, `capture.paused`, `capture.stopped`, `capture.none`, `audioFate.processing`, `audioFate.kept`, `audioFate.lost`, `kept`, `speakerRole`, `actions.review`, `actions.reviewCompleted`, `actions.discardAskUsed`, `review.title`, `review.close`

### GSpeechPill · `<g-speech-pill>` · stable · `@grana/vue/speech`

Pill colocable de la captura de voz (cabecera, barra de herramientas). Opcional y una por gestor: sin ella solo existe la flotante de GSpeechHost. Muestra el estado con icono y texto, la duración, alternar (pausar/reanudar/reintentar) y finalizar; su botón principal abre el panel. El anfitrión garantiza exactamente una pill visible y operable: esta si se ve (≥ 95 %), no es inerte y está dentro del modal superior si lo hay; si no, la flotante.
(desde 1.0.0)

**Props**
- `speech`: `Speech | null` = `null`

### GSpeechTrigger · `<g-speech-trigger>` · stable · `@grana/vue/speech`

Disparador de la captura de voz, hermano del campo e inmediatamente después de él: dictado a un textarea o input (botón conmutable de solo icono, con su nota bajo el campo: provisional, «Insertar», «Deshacer dictado») o conversación (botón con texto que prepara la sesión y abre el panel). No lleva la sesión: si se desmonta, la sesión sigue en el gestor y al volver se reconoce por modo y campo. Con otra sesión activa no crea otra: aria-disabled, descripción, anuncio y foco a la pill visible.
(desde 1.0.0)

**Props**
- `mode`: `'dictation' | 'conversation'` = `"dictation"`
- `for`: `string | null` = `null`
- `targetLabel`: `string | null` = `null`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `disabled`: `boolean` = `false`
- `speech`: `Speech | null` = `null`

### GSplit · `<g-split>` · stable · `@grana/vue`

Dos regiones lado a lado con una proporción cuando caben y una debajo de otra cuando no, en el orden del DOM y solo con CSS. El umbral lo fija el ancho mínimo del lado estrecho (collapse), que sigue al texto, y decide por su caja, no por el visor.
(desde 1.0.0)

**Props**
- `as`: `'div' | 'section' | 'article' | 'aside' | 'header' | 'footer' | 'form'` = `"div"`. Etiqueta de la raíz (lista cerrada). Fuera de lista: aviso 1 y se pinta div. Las regiones son div sin rol: la semántica la pone el contenido.
- `ratio`: `'1:1' | '3:2' | '2:1' | '2:3' | '1:2'` = `"3:2"`. Proporción start:end al lado. Fuera de lista: aviso 1 y 3:2.
- `collapse`: `'sm' | 'md' | 'lg'` = `"md"`. Ancho mínimo del lado estrecho (no un punto de corte): max(space × 64 · 80 · 96, cuerpo × 16 · 20 · 24). Fuera de lista: aviso 1 y md.
- `gap`: `'none' | 'sm' | 'md' | 'lg'` = `"md"`. Separación, la misma en los dos ejes (vocabulario de GStack): space × 6 × 0 · 0,5 · 1 · 2. Entra en el umbral. Fuera de lista: aviso 1 y md.
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`. Multiplica la separación 1 · 0,875 · 0,75. No se hereda de ningún contexto. Fuera de lista: aviso 1 y default.
- `align`: `'start' | 'stretch'` = `"start"`. Alineación de bloque de las dos regiones al lado; apiladas no actúa. Fuera de lista: aviso 1 y start.
**Slots**
- `start`: Lo que se lee primero: al inicio en línea al lado, arriba al apilar. Vacío (v-if falso, comentarios, blancos) no pinta región.
- `end`: Lo que se lee después. Vacío no pinta región; entonces la otra ocupa todo el ancho.

### GStack · `<g-stack>` · stable · `@grana/vue`

Pila de un eje con la escala de separación de Grana (sm, md, lg como relación sobre la base de página), sin superficie y sin poder romper el reflujo: en línea siempre se parte y es la única fuente de aire entre sus hijos.
(desde 1.0.0)

**Props**
- `as`: `string` = `"div"`. Etiqueta HTML no interactiva (div, section, article, aside, nav, header, footer, ul, ol, form, fieldset…). Con a, button, input, select, textarea, summary, label o main, aviso 1 (se pinta igual).
- `orientation`: `'vertical' | 'horizontal'` = `"vertical"`
- `gap`: `'none' | 'sm' | 'md' | 'lg'` = `"md"`. Factor 0 · 0,5 · 1 · 2 sobre la base de página space × 6; la misma separación en los dos ejes.
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `horizontal`: `'start' | 'center' | 'end' | null` = `null`. Eje en línea, lógico. En vertical, el ancho de los hijos (sin valor, estirar); en horizontal, dónde va la fila.
- `vertical`: `'top' | 'center' | 'bottom' | null` = `null`. Eje de bloque; solo en horizontal. En vertical no actúa (aviso 3).
- `divided`: `boolean` = `false`. Línea entre hijos visibles; solo en vertical (en horizontal, aviso 3 y no se pinta).
**Slots**
- `default`: Los hijos, en el orden del DOM; sin envoltorio por hijo

### GStatus · `<g-status>` · draft · `@grana/vue/status`

Condición declarativa de la isla de estado, sin pintura: mientras está montado, su condición existe (set al montar, update al cambiar una prop, remove al desmontar). En el servidor no hace nada.
(desde 0.1.0)

**Props**
- `id`: `string | number` = `null` (obligatoria)
- `type`: `'info' | 'success' | 'warning' | 'error'` = `"info"`
- `title`: `string` = `null` (obligatoria)
- `description`: `string` = `null`
- `details`: `string` = `null`
- `action`: `StatusConditionOptions['action']` = `null`
- `link`: `StatusConditionOptions['link']` = `null`
- `origin`: `StatusConditionOptions['origin']` = `null`
- `persistent`: `boolean` = `"type !== 'success'"`
- `dismissible`: `boolean` = `false`
- `deadline`: `number | Date` = `null`
- `politeness`: `'polite' | 'assertive'` = `null`
- `status`: `Status` = `"el gestor inyectado"`
**Eventos**
- `remove` (`StatusRemoveReason`): La condición se retiró por una vía distinta de su propio desmontaje (dismiss, read, api, clear, origin): la aplicación apaga su v-if
- `expire`: deadline llegó a cero

### GStatusIsland · `<g-status-island>` · draft · `@grana/vue/status`

Isla de estado transitoria (D1 · Cápsula de relevo, #693 a #705): una cápsula en el borde superior del visor, fuera del flujo, que dice lo que está pasando y tiene estado (sin conexión, sesión por caducar, el servidor falló al guardar, un resultado que vuelve a su origen) y se va: cae del borde sin texto, se ensancha con su titular, se lee con el tiempo de GToast (en pausa mientras se usa) y se recoge subiendo. La memoria de lo pendiente vive en el modelo, en la marca junto a su control (GStatusMark) y en Alt+F8. Servicio con clave (createStatus, también plugin de Vue): declarar dos veces la misma clave sustituye la condición en el mismo elemento. Relevo por gravedad y llegada en la misma cápsula («+N»), asomo por puntero, foco o toque, lista (hoja móvil con GDialog real en estrecho), par propio de canales vivos, nunca toma el foco ni mueve nada de la página, toda transición parte del estado actual, traslado al <dialog> modal superior y borde compartido voz → zócalo → FAB → isla → avisos.
(desde 0.1.0)

**Props**
- `status`: `Status` = `"el gestor inyectado (statusKey)"`
**Claves de `labels`**: `region`, `waiting`, `listTitle`, `hide`, `close`, `types.info`, `types.success`, `types.warning`, `types.error`, `dismiss`, `details`, `copy`, `copied`, `remaining`, `sheetTitle`

### GStatusMark · `<g-status-mark>` · draft · `@grana/vue/status`

Marca en línea, complemento de la isla de estado y memoria de lo pendiente (#323, #700). Con `for`: cápsula `button` junto al origen de una condición; existe mientras la condición esté en el modelo (también vista), su tipo y su `busy` se derivan de ella, abre la lista en su condición con el foco en su acción, pausa la lectura de lo mostrado mientras el puntero o el foco están sobre ella, y recibe el eco (`is-echo`, una vez) cuando la isla se recoge si se ve. Sin `for`: línea de texto de una sección (insignia + texto + una acción opcional) que no entra en la isla. Ninguna anuncia.
(desde 0.1.0)

**Props**
- `for`: `string | number | null` = `null`
- `type`: `'info' | 'success' | 'warning' | 'error'` = `"info"`. solo sin `for`
- `typeLabel`: `string` = `"labels.types[type] del gestor"`
- `status`: `Status` = `"el gestor inyectado"`
**Slots**
- `default`: Texto corto. Con `for`: alcance { condition, type, busy }; sin slot, el título de la condición
- `action`: Solo sin `for`: una acción opcional, fuera del `p`

### GStepper · `<g-stepper>` · stable · `@grana/vue`

Indicador de avance por pasos discretos: horizontal y vertical, indicadores de número, punto, icono, segmento y línea, estados (hecho, actual, pendiente, error, advertencia, bloqueado, opcional), navegación opcional y adaptación por el ancho del contenedor según los anchos naturales medidos: completo, sin descripciones, solo el actual con texto y compacto «Paso N de M» (DECISIONS.md #151).
(desde 1.0.0)

**Props**
- `steps`: `StepperStep[]` = `[]`
- `modelValue`: `string | number | null` = `null`
- `orientation`: `'horizontal' | 'vertical'` = `"horizontal"`
- `indicator`: `'number' | 'dot' | 'icon' | 'segment' | 'line'` = `"number"`
- `navigation`: `'none' | 'back' | 'free'` = `"none"`
- `responsive`: `'auto' | 'never' | 'compact'` = `"auto"`
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`
- `size`: `'sm' | 'md' | 'lg'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `disabled`: `boolean` = `false`
- `expandAll`: `boolean` = `false`
- `labels`: `GranaLabels` = `{}`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`GranaKey`): El usuario activa un paso navegable y nadie impidió select
- `select` (`{ id: any; index: any; preventDefault(): void }`): El usuario activa un paso navegable. Cancelable
**Slots**
- `content`: Contenido asociado a un paso (solo vertical). Alcance: { step, index, state }
- `icon`: Icono del paso con indicator="icon" (Lucide, decorativo). Alcance: { step, index, state }
- `label`: Etiqueta con contenido rico. Alcance: { step, index, state }
- `description`: Descripción con contenido rico. Alcance: { step, index, state }
**Claves de `labels`**: `complete`, `current`, `pending`, `error`, `warning`, `disabled`, `optional`, `progress`, `showAll`, `hideAll`

### GSummary · `<g-summary>` · stable · `@grana/vue`

Ficha de resumen adaptable de una entidad (persona, paciente, diagnóstico, cliente, producto): identidad + título + línea secundaria + datos con prioridad + estado, que se adapta al ancho de su propio contenedor y al texto real (A · prioridad líquida): la corriente de datos se bebe por el final, antes de soltar un dato calla los rótulos que se explican solos, «+N» dice cuántos no se ven, lo que vuelve a caber entra; entre homónimos, lo único pesa y lo compartido se apaga (el contraste de B, summaryDiff). Ceder no es ocultar: todo sigue en el árbol de accesibilidad. Contenido de frase (span), sin eventos ni teclado; va en el paquete principal y las entradas secundarias la reciben por __shared.
(desde 1.0.0)

**Props**
- `title`: `string | null` = `null`. Nombre de la entidad. Sin title (y sin loading) la ficha está vacía: pinta placeholder atenuado, o nada con aviso.
- `subtitle`: `string | null` = `null`. Línea secundaria. En inline y en row con lines 2, si hay datos solo la recibe el lector; sin datos ocupa esa línea con elipsis. En row con lines ≥ 3 o 0, y en stack, se ve siempre bajo el título.
- `code`: `string | null` = `null`. Identificador corto («E11.9») que va antes del título y no cede. Con code ningún dato ancla.
- `avatar`: `boolean | AvatarSpec` = `false`. true = GAvatar con name = title; objeto = props de GAvatar (src, name, initials, icon, color, categories, colorKey, shape). size y label del objeto se ignoran: el lado es el de la ficha y la identidad es decorativa.
- `icon`: `string | null` = `null`. Nombre de Lucide (GIcon público: registro de la aplicación → librería) en el hueco inicial, si no hay avatar. Precedencia: slot lead › avatar › icon.
- `facts`: `SummaryFact[]` = `"[]"`. Datos [{ label, value, short?, priority?, bare? }]. label es obligatorio y es la clave (único); value ya formateado (vacío, null o undefined: se omite); short se ve en lugar de label; priority menor = más importante (sin ella, después de los que la declaran, por orden del arreglo); bare = el valor se explica solo y su rótulo puede callarse antes de soltar un dato (salvo en el identificador). El arreglo no se muta.
- `status`: `{ label: string; color?: GranaColor } | null` = `null`. { label, color? }: GBadge size sm con color (neutral por defecto). Para otra cosa, slot status. En inline solo lo recibe el lector.
- `layout`: `'inline' | 'row' | 'stack'` = `"row"`. inline = una línea con la tipografía del anfitrión (Δ0 de alto); row = cabecera + corriente de datos en lines líneas; stack = vista completa en rejilla de pares, no cede ni recorta. panel y auto están reservados (el validador los rechaza).
- `lines`: `number` = `2`. Solo en row: líneas totales (título + lo demás). 2 = título y una línea de datos (alto constante en cualquier ancho); ≥ 3 = la secundaria si existe y el resto de datos, identificador y datos fluyen juntos (g-summary--multi); 0 = sin límite (g-summary--free). 1, negativos o no enteros: aviso y 2. Fuera de row se ignora con aviso.
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"según layout (inline xs, row md, stack lg)"`. Lado de la identidad (space × 5/6/8/10/16) y escala del título. En inline solo fija la identidad.
- `keep`: `'identifier' | 'title'` = `"identifier"`. Qué conserva al final la ficha inline (#681): identifier = el identificador gana al título (#351); title = el título no cede su suelo, el valor del identificador cede con elipsis hasta 0 (sigue en el texto accesible) y el título cede lo último. Raíz con g-summary--keep-title. Sin efecto en row y stack (se ignora sin aviso). Para un valor ya elegido (el campo de GCombobox).
- `diff`: `SummaryDiff | null` = `null`. { [label]: 'same' | 'diff' } (lo calcula summaryDiff en el anfitrión de la lista): is-diff pesa, is-same se apaga; el identificador nunca se apaga. Otra clave se ignora con aviso. No cambia la cesión.
- `highlight`: `string | null` = `null`. Texto buscado: marca con <mark> la primera aparición de cada palabra (sin acentos ni mayúsculas) en title, code, subtitle y los valores (no en los rótulos). Peso y subrayado, no color.
- `group`: `boolean` = `false`. Ficha suelta: role="group" + aria-labelledby al título (id de useId). Nunca dentro de un anfitrión interactivo ni de un contenedor aria-hidden.
- `loading`: `boolean` = `false`. aria-busy="true" y formas decorativas del alto del layout (Δ0 al llegar los datos); no pinta contenido ni mide. El anuncio es del anfitrión.
- `placeholder`: `string | null` = `null`. Texto atenuado cuando no hay title («Sin paciente»).
**Slots**
- `lead`: Identidad propia (sustituye a avatar e icon), dentro de g-summary__lead (aria-hidden); decorativo, sin interactivos. Un hijo directo .g-avatar manda su caja.
- `status`: Estado propio (sustituye a la GBadge de status), dentro de g-summary__status; texto real, sin interactivos, una línea.
- `action`: Acción al pie, solo en stack (dentro de g-summary__action). En inline y row no se pinta y avisa. Nunca dentro de un anfitrión interactivo.

### GSurface · `<g-surface>` · stable · `@grana/vue`

Superficie visual genérica, sin rol ni estructura: niveles flat, outlined, raised, floating e inset; la inset da un paso de tono respecto a su superficie padre y toma su radio concéntrico. Con zone="brand" abre una zona de marca: la superficie se pinta con la marca y sus descendientes reciben el grupo de color de la zona.
(desde 1.0.0)

**Props**
- `level`: `'flat' | 'outlined' | 'raised' | 'floating' | 'inset'` = `"outlined"`
- `tone`: `'surface' | 'sunken'` = `"surface"`
- `padding`: `'none' | 'xs' | 'sm' | 'md' | 'lg'` = `"md"`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `as`: `string` = `"div"`
- `zone`: `'none' | 'brand'` = `"none"`
**Slots**
- `default`: Contenido libre

### GSwitch · `<g-switch>` · stable · `@grana/vue`

Interruptor de efecto inmediato con marca de estado en el pulgar, ayuda, error, iconos on/off y carga sin bloqueo.
(desde 1.0.0)

**Props**
- `modelValue`: `boolean` = `false`
- `labelPosition`: `'end' | 'start'` = `"end"`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"brand"`
- `disabled`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `readonly`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `loading`: `boolean` = `false`
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`. Advertencia: no bloquea ni pone aria-invalid (C5)
- `valid`: `string | null` = `null`. Mensaje de válido útil (C5)
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`boolean`): El usuario alterna el interruptor (no con readonly)
**Slots**
- `label`: Etiqueta con contenido rico (sustituye a label)
- `hint`: Ayuda con contenido rico (sustituye a hint)
- `error`: Mensaje de error con contenido rico; solo se muestra con error (en la región __message)
- `icon-on`: Icono del pulgar encendido (decorativo, aria-hidden)
- `icon-off`: Icono del pulgar apagado (decorativo, aria-hidden)

### GTabPanel · `<g-tab-panel>` · stable · `@grana/vue`

Panel suelto para GTabs con detached, enlazado por id
(desde 1.0.0)

**Props**
- `tabs`: `string` = `null` (obligatoria)
- `value`: `string | number` = `null` (obligatoria)
- `active`: `boolean` = `false`
- `lazy`: `boolean` = `false`
- `busy`: `boolean` = `false`
**Slots**
- `default`: Contenido

### GTable · `<g-table>` · stable · `@grana/vue`

Tabla de datos con columnas compuestas (varios campos en una columna), celdas ricas por slot, filtros por columna con reglas (GFilterBar), orden, selección, paginación (GPagination) y acciones por fila; en contenedores estrechos se convierte en tarjetas sin cambiar de DOM.
(desde 1.0.0)

**Props**
- `columns`: `TableColumn[]` = `[]`
- `rows`: `Array<Record<string, any>>` = `[]`
- `rowKey`: `string` = `"id"`
- `caption`: `string | null` = `null`
- `sort`: `TableSort | null` = `null`
- `sortMode`: `'local' | 'external'` = `"local"`
- `selectable`: `boolean` = `false`
- `selected`: `GranaKey[]` = `[]`
- `filters`: `Filter[]` = `[]`. Un cambio de filtros anuncia labels.results por la región de la tabla venga de su barra o de la prop (tarjetas, búsqueda propia, URL), una sola vez y nunca en la carga inicial; con loading, al terminar la carga; con filterMode 'external', cuando llegan las filas o el total nuevos (enmienda de #265)
- `filterMode`: `'local' | 'external'` = `"local"`
- `page`: `number` = `1`
- `pageSize`: `number | null` = `null`. v-model:pageSize. Con pageSizes y sin pageSize, el menor de la lista (#592)
- `pageSizes`: `number[]` = `null`. Tamaños del selector «Filas por página» del pie (enteros ≥ 1, ordenados y sin repetir). El pie se acopla al borde inferior y el cambio de tamaño sujeta la fila ancla (#592 a #596); necesita labels.pagination.pageSize y labels.range
- `total`: `number | null` = `null`
- `responsive`: `'auto' | 'table' | 'cards'` = `"auto"`
- `appearance`: `'lines' | 'surface'` = `"lines"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `maxHeight`: `string | null` = `null`
- `loading`: `boolean` = `false`. aria-busy y filas esqueleto con el motor común (#540): retraso de 200 ms (filas de antes inertes o esqueleto invisible), mínimo de 400 ms, espera larga a los 5 s; anuncia labels.loading al verse y, al terminar, labels.results (o labels.failed con error)
- `loadingRows`: `number` = `3`. Filas esqueleto de la primera carga; al refrescar, tantas como había a la vista (tope pageSize)
- `error`: `boolean` = `false`. Se aplica al terminar la carga (enmienda de #327, #540): con filas, se quedan con la barra de fallo; sin filas, el slot error o GEmpty cause="error"
- `announceError`: `boolean` = `true`. false: el fallo lo anuncia otro (la isla de estado); la región no anuncia nada al terminar
- `rowHref`: `(row: Record<string, any>) => string | null | undefined` = `null`. (row) => href: la puerta de la fila es un <a href> en el título (A, #598). navigate solo con clic primario sin modificadores ni defaultPrevented (#505, #574). Con el slot detail, solo alimenta href del alcance
- `activatable`: `boolean` = `false`. Sin href, la puerta es un <button> que emite activate (#597). Se ignora con el slot detail (aviso)
- `lastOpened`: `GranaKey | null` = `null`. v-model:lastOpened. El rastro: la fila lleva is-last-opened y se ilumina (is-here) al montar a la vista o cuando el foco vuelve a su puerta desde fuera (#598)
- `expanded`: `GranaKey[]` = `[]`. v-model:expanded (claves) de las fichas desplegadas con el slot detail; se depura al cambiar las filas con un solo update:expanded (#599)
- `rowStatus`: `(row: Record<string, any>) => { status: 'info' | 'success' | 'warning' | 'error'; text: string; key?: string } | null | undefined` = `null`. (row) => { status: 'info'|'success'|'warning'|'error', text, key? } | null: data-status en la fila, lomo y etiqueta GBadge junto al título o en la celda de key; describe la puerta (#600). Sustituye a rowClass
- `labels`: `GranaLabels` = `{}`. Ver labels; sin valores por defecto
**v-model**: `v-model:sort` → `sort`, `v-model:selected` → `selected`, `v-model:filters` → `filters`, `v-model:page` → `page`, `v-model:pageSize` → `pageSize`, `v-model:lastOpened` → `lastOpened`, `v-model:expanded` → `expanded`
**Eventos**
- `update:sort` (`TableSort`): El usuario ordena
- `update:selected` (`GranaKey[]`): Cambia la selección
- `update:filters` (`Filter[]`): Aplicar, quitar o limpiar filtros
- `update:page` (`number`): Cambia de página (o vuelve a 1 al filtrar)
- `update:pageSize` (`number`): Elige un tamaño en el pie; se emite antes de update:page, en el mismo manejador (#592)
- `navigate` (`{ row: Record<string, any>; key: GranaKey; href: string; event: MouseEvent }`): Clic primario sin modificadores (o Intro) en la puerta-enlace; preventDefault en el evento para navegar con el router (#598)
- `activate` (`{ row: Record<string, any>; key: GranaKey; event: MouseEvent }`): Activa la puerta-botón (activatable sin href, #597)
- `update:lastOpened` (`GranaKey`): Tras navigate o activate, también si la aplicación cancela la navegación (#598)
- `update:expanded` (`GranaKey[]`): Se despliega o pliega una ficha, o se depuran claves que ya no están a la vista (#599)
- `retry`: Pulsa «Reintentar» del fallo (barra o vacío de error por defecto; #540)
**Slots**
- `cell-{key}`: Celda rica. Alcance: { row, value, column }
- `leading-{key}`: Inicio de una columna compuesta (avatar, icono). Alcance: { row }
- `row-actions`: Acciones de la fila. Alcance: { row }
- `detail`: Ficha desplegada debajo de la fila (B, #599); su presencia activa el despliegue. Alcance: { row, key, href, close } (href = rowHref(row) o null; close() pliega y devuelve el foco a la puerta)
- `empty`: Estado vacío propio (recomendado GEmpty); sin él, GEmpty por defecto (none con labels.empty, filtered con labels.emptyFiltered y «Limpiar filtros»). Alcance: { filtered, clear }
- `error`: Fallo sin filas que enseñar (enmienda de #327, #540); sin él, GEmpty cause="error" con labels.failed y «Reintentar». Alcance: { retry }
- `toolbar`: Acciones extra en la barra
**Claves de `labels`**: `selectAll`, `selectRow`, `rowActions`, `actionsHeader`, `selectedCount`, `sortBy`, `ascending`, `descending`, `sorted`, `loading`, `empty`, `emptyFiltered`, `clearFilters`, `results`, `slow`, `range`, `failed`, `retry`, `detail`, `filters`, `pagination`

### GTabs · `<g-tabs>` · stable · `@grana/vue`

Navegación entre vistas del mismo nivel (patrón Tabs de APG): cuatro apariencias (underline, pill, segmented, contained) por dos orientaciones, marca deslizante, activación automática o manual, desbordamiento por scroll, botones de borde o menú «Más», solo icono según el espacio, contador, insignia y estados, paneles integrados, perezosos o separados (GTabPanel).
(desde 1.0.0)

**Props**
- `items`: `TabItem[]` = `[]`
- `modelValue`: `string | number | null` = `null`
- `appearance`: `'underline' | 'pill' | 'segmented' | 'contained'` = `"underline"`
- `orientation`: `'horizontal' | 'vertical'` = `"horizontal"`
- `color`: `'brand' | 'accent' | 'neutral'` = `"brand"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `align`: `'start' | 'center' | 'distribute' | 'fill'` = `"start"`
- `activation`: `'auto' | 'manual'` = `"auto"`
- `overflow`: `'scroll' | 'arrows' | 'more'` = `"scroll"`
- `labelMode`: `'full' | 'icon' | 'auto'` = `"full"`. Una pestaña «tiene icono» con slot icon e item.icon con valor, o sin slot e item.icon cadena (#202) · Pista de solo icono (#434): motor de GTooltip en modo visual (utils/visualTip.js); un nodo g-tooltip aria-hidden sin role ni id por pestaña renderizada con icono (icon o auto) y uno para «Más», al final de g-tabs__header fuera del tablist; data-g-tooltip en la pestaña; activa solo con is-icon-only (la activa con etiqueta en auto reducido no); grupo = tablist (viaja con puntero, flechas y Tab); abajo en horizontal, derecha lógica en vertical; «Más» con el menú abierto no abre; pulsación larga muestra y no activa (sin change). El nombre accesible no cambia
- `snap`: `boolean` = `false`
- `lazy`: `boolean` = `false`
- `responsive`: `'auto' | 'never'` = `"auto"`
- `detached`: `boolean` = `false`
- `disabled`: `boolean` = `false`
- `label`: `string | null` = `null`
- `labelledby`: `string | null` = `null`
- `labels`: `GranaLabels` = `{}`
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`GranaKey`): El usuario activa una pestaña y nadie impidió change
- `change` (`{ id: GranaKey; index: number; source: 'keyboard' | 'pointer' | 'menu'; preventDefault(): void }`): El usuario activa una pestaña; cancelable: con preventDefault() no cambian ni el valor, ni la marca, ni el foco
**Slots**
- `panel-{id}`: Contenido del panel de esa pestaña. Alcance: { item, active }
- `panel`: Contenido genérico de panel (si no hay panel-{id}). Alcance: { item, active }
- `icon`: Icono de la pestaña (valor item.icon); sustituye al GIcon por nombre. Alcance: { item, index, active }; decorativo
- `label`: Etiqueta con contenido rico, sin interactivos. Alcance: { item, index, active }; el nombre accesible sigue saliendo de item.label
- `empty`: Vacío (sin pestañas): se renderiza en lugar de la cabecera
**Claves de `labels`**: `more`, `menu`, `loading`, `loaded`

### GTag · `<g-tag>` · stable · `@grana/vue/tag`

Un elemento de un conjunto que clasifica o resume una elección: se lee, se quita, se alterna (aria-pressed) o se sigue (enlace). Neutro o de categoría, nunca semántico (para el estado de otra cosa, GBadge). No es un campo: no se envía ni se registra en GForm. Suelta, una etiqueta quitable solo emite remove; la huella y el foco los da GTagGroup.
(desde 1.0.0)

**Props**
- `label`: `string` = `null` (obligatoria). Texto de la etiqueta (salvo slot), base de los nombres de «Quitar» y clave del color sin colorKey. Vacía o solo espacios: no se pinta (aviso 8).
- `href`: `string | null` = `null`. Con valor, el cuerpo es un <a href>. Gana a pressed (aviso 2). Deshabilitado: role="link" aria-disabled="true" sin href.
- `pressed`: `boolean | null` = `null`. v-model:pressed. null = no alterna; true/false = botón de alternar (aria-pressed, marca check). Funciona con o sin v-model.
- `removable`: `boolean` = `false`. Añade «Quitar» (botón hermano del cuerpo, tapa entera, aria-keyshortcuts="Delete Backspace"). Necesita labels.remove (aviso 5).
- `disabled`: `boolean` = `false`. Deshabilita el cuerpo interactivo y «Quitar»; no emite.
- `size`: `'sm' | 'md'` = `"md"`. Altura: sm = space × 6 (caption), md = space × 8 (body-sm).
- `color`: `'neutral' | GranaCategory | '${GranaCategory}' | null` = `null`. 'neutral' (gana a categories) o una categoría fija 1..12 (número o cadena numérica). Otro valor, semánticos incluidos, se ignora (aviso 3).
- `categories`: `0 | GranaCategory` = `0`. Categorías del tema. Con n > 0 y sin color, la categoría se deriva de colorKey ?? label con el hash de GAvatar. Fuera de 0..12 o no entero: 0 (aviso 4).
- `colorKey`: `string | number | null` = `null`. Clave estable del color (como GAvatar).
- `labels`: `TagLabels` = `{}`. { remove } con {label}; cadena con marcadores o función. Sin valores por defecto (#226).
**v-model**: `v-model:pressed` → `pressed`
**Eventos**
- `update:pressed` (`boolean`): La persona alterna (clic, Espacio, Intro). No con disabled.
- `remove` (`{ event: Event; source: 'button' | 'key' }`): «Quitar» o Supr/Retroceso sobre un control de la etiqueta. Suelta no se quita sola ni deja huella: la aplicación la quita y decide el foco.
- `navigate` (`{ event: MouseEvent; href: string }`): Activación del enlace, SOLO primaria sin modificadores (#505): clic con button 0 sin Ctrl/⌘/Mayús/Alt ni defaultPrevented, o Intro. event.preventDefault() (síncrono) evita la navegación (router).
**Slots**
- `default`: Sustituye el texto visible dentro de g-tag__text (contenido de frase no interactivo, aviso 6). label sigue siendo obligatoria.
- `lead`: Icono (<GIcon>) o <GAvatar size="xs"> antes del texto; hueco decorativo (aria-hidden).
**Claves de `labels`**: `remove`

### GTagGroup · `<g-tag-group>` · stable · `@grana/vue/tag`

Conjunto de etiquetas dirigido por datos (v-model:items): A «Huella» (quitar deja una huella del mismo ancho con «Deshacer» en el sitio y con el foco; nada se mueve hasta que puntero y foco salen del grupo; el modelo cambia en el acto), B «Racimo» (layout="facets": el nombre de la faceta una vez y un lomo de color), tope con «Ver N más», «Quitar todas» con deshacer y el foco que nunca se pierde.
(desde 1.0.0)

**Props**
- `items`: `TagItem[]` = `null` (obligatoria). v-model:items. TagItem[]: { id (obligatorio y único), label (obligatorio), href?, pressed?, removable?, disabled?, color?, colorKey?, facet?, icon?, avatar? } y campos propios. Toda acción emite un arreglo nuevo (referencias conservadas; el alternado, objeto nuevo). Funciona con o sin v-model.
- `label`: `string | null` = `null`. Nombre del grupo (aria-label del contenedor). Uno de label/labelledby es obligatorio (aviso G1).
- `labelledby`: `string | null` = `null`. Id de un elemento visible que nombra el grupo (aria-labelledby del contenedor).
- `layout`: `'flow' | 'facets'` = `"flow"`. facets = B «Racimo» (#467): racimos por item.facet en orden de primera aparición; sueltas sin faceta en su lugar.
- `size`: `'sm' | 'md'` = `"md"`. Se aplica a todas las etiquetas (y a las herramientas: GBtn sm con md, xs con sm).
- `categories`: `0 | GranaCategory` = `0`. Categorías del tema; se aplica a todas (un item.color gana). Clave del color: colorKey ?? facet ?? label. Inválido: 0 (aviso G8).
- `limit`: `number | null` = `null`. Muestra las primeras N (las huellas cuentan) y «Ver N más» (APG Disclosure). Se ignora con layout="facets" (aviso G6).
- `clearable`: `boolean` = `false`. «Quitar todas» con ≥ 2 etiquetas quitables y habilitadas; el mismo botón pasa a «Deshacer» hasta que el foco sale del grupo.
- `emptyFocus`: `TagEmptyFocus` = `null`. A dónde va el foco si el grupo se queda sin controles: selector CSS, elemento (o instancia con $el) o función que lo devuelve. Sin él (o si no se encuentra, aviso G10), el contenedor con tabindex="-1".
- `disabled`: `boolean` = `false`. Deshabilita los controles de las etiquetas (cuerpos, «Quitar», «Deshacer») y «Quitar todas». «Ver N más» sigue activo (#512): deshabilitar no esconde etiquetas sin forma de leerlas.
- `labels`: `TagGroupLabels` = `{}`. Textos (cadena con marcadores o función), sin valores por defecto (#226): ver labels.
**v-model**: `v-model:items` → `items`
**Eventos**
- `update:items` (`TagItem[]`): Quitar, deshacer, quitar todas, deshacer todas, alternar. Siempre antes del evento específico.
- `remove` (`{ item: TagItem; index: number; source: 'button' | 'key' }`): La persona quita una etiqueta (deja huella). index en items.
- `restore` (`{ items: TagItem[]; source: 'undo' | 'undo-all' }`): «Deshacer» de una huella o de «Quitar todas».
- `clear` (`{ items: TagItem[] }`): «Quitar todas».
- `toggle` (`{ item: TagItem; pressed: boolean }`): La persona alterna; item es el objeto nuevo.
- `navigate` (`{ event: MouseEvent; href: string; item: TagItem }`): Como GTag: solo activación primaria sin modificadores (#505); preventDefault() para un router.
- `settle` (`{ items: TagItem[] }`): Lo quitado deja de poder deshacerse: las huellas se recogen, el «Deshacer» de «Quitar todas» se va (con las huellas que recogió), o el grupo se desmonta con algo pendiente.
**Slots**
- `label`: Texto visible de cada etiqueta (no interactivo).
- `lead`: Hueco inicial de cada etiqueta; con el slot manda el slot (sobre item.avatar e item.icon).
**Claves de `labels`**: `remove`, `removeIn`, `removed`, `removedIn`, `undo`, `undoIn`, `restored`, `more`, `less`, `clearAll`, `cleared`, `undoAll`, `restoredAll`, `empty`

### GText · `<g-text>` · stable · `@grana/vue`

Texto suelto con la tipografía del tema (rol y color) y una pausa por tamaño entre sus bloques nativos, sin aire hacia fuera: la cita y su pie, la garantía bajo una llamada a la acción, el legal de un boletín. Sin contenido no se pinta.
(desde 1.0.0)

**Props**
- `as`: `'p' | 'div' | 'span' | 'small' | 'blockquote' | 'figure' | 'figcaption' | 'address'` = `"p"`. Etiqueta de la raíz (lista cerrada; sin encabezados, listas ni controles). Fuera de lista: aviso 1 y se pinta p. p, span o small con bloques dentro es HTML no válido: usar div.
- `size`: `'body' | 'body-sm' | 'caption'` = `"body"`. Rol tipográfico del tema (--g-text-{rol}-size, -line, -tracking) y pausa entre bloques: space × 3 · 2,5 · 2. Fuera de lista: aviso 1 y body.
- `tone`: `'default' | 'muted'` = `"default"`. default = --g-color-text, muted = --g-color-text-muted, siempre explícitos. Fuera de lista: aviso 1 y default.
**Slots**
- `default`: Texto, fraseo y bloques nativos (p, ul, ol, dl, blockquote, figure, figcaption, address, pre, div). Sin contenido, el componente no deja elemento.

### GTextarea · `<g-textarea>` · stable · `@grana/vue`

Campo de texto de varias líneas con etiqueta, ayuda, error, contador con aviso hablado discreto, filas fijas o autosize.
(desde 1.0.0)

**Props**
- `modelValue`: `string` = `""`
- `variant`: `'outline' | 'soft'` = `"outline"`
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | null` = `null`
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`
- `block`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `disabled`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `readonly`: `boolean | null` = `null`. Sin valor: prop explícita › contexto de GForm › default de siempre (form.md §2)
- `loading`: `boolean` = `false`
- `rows`: `number` = `3`
- `autosize`: `boolean` = `false`
- `maxRows`: `number | null` = `null`
- `resize`: `'none' | 'vertical'` = `"vertical"`
- `label`: `string | null` = `null`
- `hint`: `string | null` = `null`
- `error`: `string | null` = `null`
- `warning`: `string | null` = `null`. Advertencia: no bloquea ni pone aria-invalid (C5)
- `valid`: `string | null` = `null`. Mensaje de válido útil (C5)
- `required`: `boolean` = `false`
- `mark`: `boolean | null` = `null`. false quita la marca de la convención de GForm (C3)
- `counter`: `boolean` = `false`
- `counterText`: `(...args: any[]) => any | null` = `null`
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`string`): El usuario cambia el valor (evento input nativo)
**Slots**
- `label`: Etiqueta con contenido rico (sustituye a label)
- `hint`: Ayuda con contenido rico (sustituye a hint)
- `error`: Mensaje de error con contenido rico; solo se muestra con error (en la región __message)

### GTimeField · `<g-time-field>` · stable · `@grana/vue/time-field`

Campo para una hora del reloj (cita, toma, inicio de turno) que se escribe como se dice («930», «9h30», «9 noche»), vuelve en palabras pegadas al número y ofrece la otra lectura cuando puede ser de mañana o de noche. Modelo «HH:mm[:ss]» o null (hora de pared, sin fecha ni zona). Compone GInput.
(desde 1.0.0)

**Props**
- `modelValue`: `string | null` = `null`. «HH:mm» o «HH:mm:ss» (24 h, cero delante); undefined y '' = null; otro formato = null con aviso; segundos sin seconds se ignoran con aviso. Emite siempre «HH:mm[:ss]» o null
- `min`: `string | null` = `null`. Limita los pasos; aria-valuemin solo con min ≤ max; min > max = arco que cruza la medianoche (sin aviso)
- `max`: `string | null` = `null`. Limita los pasos; aria-valuemax solo con min ≤ max
- `step`: `number` = `1`. Minutos (entero ≥ 1); rejilla desde min; no redondea lo escrito
- `seconds`: `boolean` = `false`. Canónico, formato y aria-value* con segundos
- `locale`: `string | null` = `null`. prop › lang del ancestro › navigator.language; inválido avisa
- `hourCycle`: `'h12' | 'h23' | null` = `null`. h12 | h23; sin valor, el del idioma
- `labels`: `GranaLabels` = `{}`. { invalid }: mensaje del error propio; sin él bloquea con un espacio y avisa
- `prefix`: `string | null` = `null`. Como GInput: texto antes del valor
- `suffix`: `string | null` = `null`. Como GInput; el sufijo dice la zona (#411)
- `prefixLabel`: `string | null` = `null`. Como GInput: nombre accesible del prefijo
- `suffixLabel`: `string | null` = `null`. Como GInput: nombre accesible del sufijo
- `name`: `string | null` = `null`. Va al <input type=hidden> canónico; el visible no lleva name
- `label`: `string | null` = `null`. Pasa a GInput
- `hint`: `string | null` = `null`. Pasa a GInput
- `error`: `string | null` = `null`. Pasa a GInput
- `warning`: `string | null` = `null`. Pasa a GInput
- `valid`: `string | null` = `null`. Pasa a GInput
- `output`: `string | null` = `null`. Pasa a GInput
- `required`: `boolean` = `false`. aria-required (nunca required nativo)
- `mark`: `boolean | null` = `null`. Como GInput
- `readonly`: `boolean | null` = `null`. readonly + aria-readonly; sin pasos ni botones; se envía
- `disabled`: `boolean | null` = `null`. disabled en el campo, los botones y el oculto
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` = `"md"`. xs | sm | md | lg | xl
- `variant`: `'outline' | 'soft'` = `"outline"`. outline | soft
- `density`: `'default' | 'comfortable' | 'compact' | null` = `null`. default | comfortable | compact (contexto)
- `color`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | null` = `null`. Color del foco, como GInput
- `rounded`: `'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill' | null` = `null`. Como GInput
- `block`: `boolean | null` = `null`. Como GInput
- `id`: `string | null` = `null`. Generado si falta
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`string | null`): Cada cambio de la hora (no del texto): al escribir («930»: 09:00, null, 09:30), pegar, cada paso, a. m./p. m. y las lecturas
- `change` (`string | null`): Hora confirmada: al salir o con Enter si cambió; una vez por gesto de paso (keyup); una vez por activación de a. m./p. m. o de una lectura
**Slots**
- `label`: Etiqueta con contenido rico (como GInput)
- `hint`: Ayuda con contenido rico
- `error`: Error con contenido rico
- `prepend`: Icono decorativo antes del prefijo

### GToaster · `<g-toaster>` · stable · `@grana/vue`

Avisos breves y no modales como servicio imperativo: la aplicación crea su gestor (createToaster, también plugin de Vue), lo usa con useToast() y monta una región <GToaster />. Región viva única y permanente (dos canales vivos fuera de la lista), nunca roba el foco (F8 va y vuelve, Esc cierra el aviso enfocado sin cerrar el diálogo anfitrión), tiempo pausable con resto conservado, cola FIFO con el error adelantado, deduplicación por id y por contenido, promesa, traslado al <dialog> modal superior y SSR sin DOM.
(desde 1.0.0)

**Props**
- `toaster`: `Toaster | null` = `null`
**Claves de `labels`**: `region`, `close`, `types.info`, `types.success`, `types.warning`, `types.error`, `types.loading`, `repeated`, `queued`, `actionHint`

### GTooltip · `<g-tooltip>` · stable · `@grana/vue`

Nombre visible, descripción breve y atajo de un control enfocable: aparece con el puntero (350 ms), con el foco por navegación y con la pulsación larga en táctil. Forma A «pestaña que viaja» (la etiqueta cuelga del control por una pestaña de su tamaño y acompaña de un control al siguiente en un grupo) con segunda etapa para detail. Envoltorio de un único hijo sin elementos añadidos; su nodo role="tooltip" persistente (popover="manual") va detrás del control.
(desde 1.0.0)

**Props**
- `text`: `string` = `null` (obligatoria). Nombre o descripción según kind; vacío: no se activa (aviso)
- `detail`: `string | null` = `null`. Segunda etapa (#389); siempre aria-describedby → ID-detail
- `kind`: `'auto' | 'label' | 'description'` = `"auto"`
- `placement`: `'top-start' | 'top' | 'top-end' | 'right-start' | 'right' | 'right-end' | 'bottom-end' | 'bottom' | 'bottom-start' | 'left-end' | 'left' | 'left-start' | null` = `null`. Sin valor: bottom; right en un grupo vertical (aria-orientation="vertical"). left/right lógicos
- `shortcut`: `string | null` = `null`. Texto visible del atajo (<kbd> aria-hidden)
- `keyshortcuts`: `string | null` = `null`. aria-keyshortcuts del control
- `disabled`: `boolean` = `false`. No abre; conserva las referencias ARIA
- `id`: `string | null` = `null`. Generado con useId (estable en SSR); el nombre es ID-name y el detalle ID-detail
**Slots**
- `default`: Un único hijo: el control (elemento o componente). Se clona con aria-labelledby/aria-describedby (añadido), aria-keyshortcuts y data-g-tooltip en su elemento enfocable

### GTranscript · `<g-transcript>` · stable · `@grana/vue/speech`

Vista de revisión de un transcript de la captura de voz (Fase 2): rejilla de datos de APG con una fila por fragmento y una sola parada de tabulación, edición en la celda, selección, hablantes y roles, original y cambios, historial de deshacer/rehacer compartido y la inserción en destinos ligados al modelo del formulario. Modos editable, solo selección, solo lectura (lista simple) y compacto (panel del anfitrión).
(desde 1.0.0)

**Props**
- `transcript`: `Transcript | null` = `null`
- `editable`: `boolean` = `true`
- `selectable`: `boolean` = `true`
- `selected`: `string[]` = `[]`
- `compact`: `boolean` = `false`
- `copy`: `boolean` = `true`
- `targets`: `SpeechTarget[] | null` = `null`
- `roles`: `SpeechRole[] | null` = `null`
- `diarization`: `boolean | null` = `null`
- `speakerColors`: `number | null` = `null`
- `labelledby`: `string | null` = `null`
- `label`: `string | null` = `null`
- `headingLevel`: `2 | 3 | 4 | 5 | 6` = `3`
- `maxHeight`: `string | null` = `null`
- `labels`: `GranaLabels` = `{}`
- `speech`: `object | null` = `null`
**v-model**: `v-model:selected` → `selected`
**Eventos**
- `update:selected` (`string[]`): Cambia la selección
- `change` (`{ kind: string; ids: string[] }`): Tras una operación iniciada en esta vista; kind: edit, revert, remove, restore, assignSpeaker, assignNewSpeaker, addSpeaker, setRole, mergeSpeakers, unmerge, undo, redo. Sin texto
- `insert` (`TranscriptDerived`): Tras insertar en un destino
- `undo-insert` (`TranscriptDerived`): Tras deshacer una inserción
- `copy` (`{ count: any; withSpeakers: any; withTimes: any }`): Tras copiar al portapapeles. Sin texto
**Métodos**
- `focus()`: A la celda activa (solo lectura: a la lista; vacía: al elemento de labelledby si es enfocable o a la raíz)
- `undo()`: Como el botón Deshacer de la barra (anuncio y la fila a la vista; el foco no se mueve)
- `redo()`: Como el botón Rehacer
**Claves de `labels`**: `speaker`, `speakerRole`, `unassigned`, `transcript.empty`, `transcript.partialFlag`, `transcript.partialPrefix`, `transcript.failed`, `transcript.cols.*`, `transcript.row.select`, `transcript.row.actions`, `transcript.row.changeSpeaker`, `transcript.flags.*`, `transcript.diff.*`, `transcript.editor.*`, `transcript.menu.*`, `transcript.bar.*`, `transcript.history.*`, `transcript.keyboard`, `transcript.noDiarization`, `transcript.newer`, `transcript.speakers.*`, `transcript.insert.*`, `transcript.what.*`, `transcript.announce.*`

### GWidget · `<g-widget>` · stable · `@grana/vue`

Carcasa de un widget de panel: encabezado, cuerpo por nivel (s/m/l según su propio ancho) y pie, con estados populated, loading, empty, error, stale y disabled que no cambian el espacio, menú de acciones propio e integración con GWidgetGrid.
(desde 1.0.0)

**Props**
- `title`: `string | null` = `null`
- `eyebrow`: `string | null` = `null`
- `description`: `string | null` = `null`
- `headingLevel`: `2 | 3 | 4 | 5 | 6` = `3`
- `state`: `'populated' | 'loading' | 'empty' | 'error' | 'stale' | 'disabled'` = `"populated"`
- `level`: `'auto' | 's' | 'm' | 'l'` = `"auto"`
- `badge`: `string | number | null` = `null`
- `badgeColor`: `'brand' | 'accent' | 'neutral' | 'success' | 'warning' | 'danger' | 'info'` = `"neutral"`
- `actions`: `MenuItem[]` = `[]`
- `href`: `string | null` = `null`
- `drilldownLabel`: `string | null` = `null`
- `updatedText`: `string | null` = `null`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `headless`: `boolean` = `false`
- `labels`: `GranaLabels` = `{}`
- `id`: `string | null` = `null`
**Eventos**
- `action` (`{ id: any; checked?: any }`): El usuario elige un elemento del menú (checked en una casilla u opción)
- `retry`: Pulsa «Reintentar» en el estado error
- `drilldown` (`{ event: any }`): Pide el detalle (sin href, o con href y preventDefault)
**Slots**
- `icon`: Icono decorativo del encabezado
- `eyebrow`: Categoría rica
- `title`: Título rico
- `badge`: Sustituye al badge
- `actions`: Sustituye al menú
- `compact`: Contenido del nivel s
- `default`: Contenido del nivel m y respaldo
- `detail`: Contenido del nivel l
- `empty`: Estado vacío
- `error`: Estado de error; alcance { level, retry }
- `loading`: Esqueleto propio
- `footer`: Pie propio
**Métodos**
- `focusMenu(): void`: Enfoca el botón del menú de acciones
- `readonly level: string`: Nivel resuelto (solo lectura)
- `readonly shape: string`: Forma resuelta (solo lectura)

### GWidgetConfig · `<g-widget-config>` · stable · `@grana/vue`

Carcasa del panel de configuración de un widget: hoja lateral con vista previa en vivo, pestañas (APG), resumen de errores, Restablecer, Cancelar y Aplicar, y confirmación de descarte en el pie. El contenido de las pestañas y la validación los pone la aplicación.
(desde 1.0.0)

**Props**
- `modelValue`: `boolean` = `false`
- `title`: `string | null` = `null`
- `description`: `string | null` = `null`
- `tabs`: `unknown[]` = `[]`
- `tab`: `string | null` = `null`
- `errors`: `unknown[]` = `[]`
- `dirty`: `boolean` = `false`
- `resettable`: `boolean` = `false`
- `applying`: `boolean` = `false`
- `size`: `'sm' | 'md' | 'lg'` = `"sm"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `labels`: `GranaLabels` = `{}`
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`, `v-model:tab` → `tab`
**Eventos**
- `update:modelValue` (`boolean`): El usuario cierra (sin cambios, o tras Descartar)
- `update:tab` (`GranaKey`): Cambia la pestaña activa
- `apply`: Pulsa Aplicar (o Enter en un campo); la aplicación valida y cierra
- `reset`: Pulsa Restablecer
- `cancel`: El usuario cierra sin aplicar
- `open`: Como en GDialog
- `closed`: Como en GDialog
**Slots**
- `tab-<id>`: Contenido de la pestaña <id>. Alcance { errors }; permanece montado
- `default`: Contenido sin pestañas (una o ninguna). Alcance { errors }
- `preview`: Vista previa en vivo (aria-hidden e inert)
- `footer-start`: Acciones extra a la izquierda del pie
**Métodos**
- `announce(text: string): void`: Anuncia un texto por la región viva del panel

### GWidgetGallery · `<g-widget-gallery>` · stable · `@grana/vue`

Galería para añadir widgets a un panel: hoja lateral (GDialog placement=end) con búsqueda, categorías, contador, tarjetas con vista previa por slot, tamaño inicial y marca de los ya añadidos. Emite add; no crea widgets ni guarda el layout.
(desde 1.0.0)

**Props**
- `modelValue`: `boolean` = `false`
- `items`: `unknown[]` = `[]`
- `added`: `object` = `{}`
- `sizes`: `unknown[] | null` = `null`
- `categories`: `unknown[] | null` = `null`
- `title`: `string | null` = `null`
- `description`: `string | null` = `null`
- `size`: `'sm' | 'md' | 'lg'` = `"sm"`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
- `labels`: `GranaLabels` = `{}`
- `id`: `string | null` = `null`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`boolean`): El usuario cierra la hoja
- `add` (`{ id: any; size: any }`): Pulsa Añadir (no se emite para un único ya añadido)
- `search` (`{ query: any; category: any; count: any }`): Cambia el filtro
- `open`: Como en GDialog
- `closed`: Como en GDialog
**Slots**
- `preview`: Vista previa de la tarjeta. Alcance { item, size }; el componente la hace aria-hidden e inert
- `card`: Sustituye el contenido de la tarjeta. Alcance { item, added, size }
- `empty`: Estado vacío. Alcance { query }
- `footer`: Pie de la hoja. Alcance { close }
**Métodos**
- `announce(text: string): void`: Anuncia un texto por la región viva de la galería

### GWidgetGrid · `<g-widget-grid>` · stable · `@grana/vue`

Rejilla de widgets con columnas por su propio ancho, layout ordenado [{id,w,h}], reordenar y redimensionar con puntero y teclado (alternativa sin arrastre desde el menú de cada widget) y anuncios para lectores de pantalla.
(desde 1.0.0)

**Props**
- `modelValue`: `unknown[]` = `[]`
- `label`: `string | null` = `null`
- `editable`: `boolean` = `false`
- `columns`: `1 | 2 | 3 | 4 | null` = `null`
- `maxColumns`: `1 | 2 | 3 | 4` = `4`
- `maxRows`: `1 | 2 | 3 | 4 | 5 | 6` = `4`
- `presets`: `unknown[]` = `"s,m,l,wide,tall"`
- `labels`: `GranaLabels` = `{}`
- `density`: `'default' | 'comfortable' | 'compact'` = `"default"`
**v-model**: `v-model` → `modelValue`
**Eventos**
- `update:modelValue` (`Array<Record<string, any>>`): Al confirmar un movimiento o tamaño
- `change` (`{ layout: Array<Record<string, any>>; reason: 'move' | 'resize'; id: GranaKey }`): Junto al anterior; reason: move | resize
- `remove-request` (`{ id: any }`): El usuario pide quitar un widget; lo decide la aplicación
**Slots**
- `item`: Widget de cada celda; alcance { id, index, count, editing }
- `empty`: Contenido sin widgets
**Métodos**
- `focusMenu(id: GranaKey): void`: Enfoca el menú del widget id
- `focusHandle(id: GranaKey, what?: string): void`: Enfoca el asa de mover o redimensionar del widget id

## Tokens del tema

`--g-border-width`, `--g-calendar-grid-color`, `--g-calendar-now-color`, `--g-calendar-unavailable-color`, `--g-card-hover`, `--g-card-on-scrim`, `--g-card-pressed`, `--g-card-scrim`, `--g-card-selected`, `--g-color-accent`, `--g-color-accent-soft`, `--g-color-accent-strong`, `--g-color-accent-text`, `--g-color-active`, `--g-color-bg`, `--g-color-border`, `--g-color-border-control`, `--g-color-border-strong`, `--g-color-brand`, `--g-color-brand-soft`, `--g-color-brand-strong`, `--g-color-brand-text`, `--g-color-brand-zone`, `--g-color-danger`, `--g-color-danger-soft`, `--g-color-danger-strong`, `--g-color-danger-text`, `--g-color-focus`, `--g-color-info`, `--g-color-info-soft`, `--g-color-info-strong`, `--g-color-info-text`, `--g-color-link`, `--g-color-mold`, `--g-color-neutral`, `--g-color-neutral-soft`, `--g-color-neutral-strong`, `--g-color-neutral-text`, `--g-color-on-accent`, `--g-color-on-accent-soft`, `--g-color-on-brand`, `--g-color-on-brand-accent`, `--g-color-on-brand-accent-veil`, `--g-color-on-brand-danger`, `--g-color-on-brand-info`, `--g-color-on-brand-muted`, `--g-color-on-brand-soft`, `--g-color-on-brand-success`, `--g-color-on-brand-veil`, `--g-color-on-brand-warning`, `--g-color-on-brand-zone`, `--g-color-on-danger`, `--g-color-on-danger-soft`, `--g-color-on-info`, `--g-color-on-info-soft`, `--g-color-on-neutral`, `--g-color-on-neutral-soft`, `--g-color-on-primary`, `--g-color-on-primary-soft`, `--g-color-on-success`, `--g-color-on-success-soft`, `--g-color-on-warning`, `--g-color-on-warning-soft`, `--g-color-primary`, `--g-color-primary-soft`, `--g-color-primary-strong`, `--g-color-primary-text`, `--g-color-selection`, `--g-color-success`, `--g-color-success-soft`, `--g-color-success-strong`, `--g-color-success-text`, `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-warning`, `--g-color-warning-soft`, `--g-color-warning-strong`, `--g-color-warning-text`, `--g-color-zone-edge`, `--g-divider-inset`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-duration-spin`, `--g-ease-bounce`, `--g-ease-out`, `--g-ease-spring`, `--g-ease-standard`, `--g-focus-offset`, `--g-focus-width`, `--g-font-display`, `--g-font-title`, `--g-font-ui`, `--g-form-column-gap`, `--g-form-gap`, `--g-form-section-gap`, `--g-glass-edge`, `--g-glass-filter`, `--g-glass-opacity`, `--g-glass-sheen`, `--g-glass-tint`, `--g-hero-title-max`, `--g-press-scale`, `--g-radius-lg`, `--g-radius-md`, `--g-radius-none`, `--g-radius-pill`, `--g-radius-shape`, `--g-radius-sm`, `--g-radius-xl`, `--g-radius-xs`, `--g-shadow-1`, `--g-shadow-2`, `--g-shadow-3`, `--g-sidebar-bar`, `--g-sidebar-current`, `--g-sidebar-current-edge`, `--g-sidebar-group-title-weight`, `--g-sidebar-on-current`, `--g-sidebar-rail`, `--g-sidebar-width`, `--g-space-1`, `--g-space-12`, `--g-space-16`, `--g-space-2`, `--g-space-3`, `--g-space-4`, `--g-space-5`, `--g-space-6`, `--g-space-8`, `--g-surface-backdrop`, `--g-surface-gap`, `--g-surface-inset`, `--g-surface-radius`, `--g-surface-radius-inset`, `--g-surface-shell`, `--g-tabs-band`, `--g-tabs-mark-comfortable`, `--g-tabs-mark-compact`, `--g-tabs-mark-default`, `--g-tabs-panel`, `--g-tabs-thumb`, `--g-tabs-track`, `--g-text-action-weight`, `--g-text-body-line`, `--g-text-body-size`, `--g-text-body-sm-line`, `--g-text-body-sm-size`, `--g-text-body-sm-tracking`, `--g-text-body-sm-weight`, `--g-text-body-tracking`, `--g-text-body-weight`, `--g-text-caption-line`, `--g-text-caption-size`, `--g-text-caption-tracking`, `--g-text-caption-weight`, `--g-text-display-line`, `--g-text-display-size`, `--g-text-display-tracking`, `--g-text-display-weight`, `--g-text-title-lg-line`, `--g-text-title-lg-size`, `--g-text-title-lg-tracking`, `--g-text-title-lg-weight`, `--g-text-title-line`, `--g-text-title-size`, `--g-text-title-sm-line`, `--g-text-title-sm-size`, `--g-text-title-sm-tracking`, `--g-text-title-sm-weight`, `--g-text-title-tracking`, `--g-text-title-weight`, `--g-widget-gap`, `--g-widget-row`

## Iconos de la librería (Lucide)

`arrow-down`, `arrow-right`, `arrow-up`, `arrow-up-right`, `audio-lines`, `calendar`, `captions`, `check`, `chevron-down`, `chevron-left`, `chevron-right`, `chevrons-up-down`, `circle`, `circle-alert`, `circle-check`, `circle-pause`, `circle-question-mark`, `copy`, `diamond`, `download`, `ellipsis`, `ellipsis-vertical`, `external-link`, `file-exclamation-point`, `file-lock`, `file-pen-line`, `file-question-mark`, `file-text`, `git-compare`, `globe`, `grip-vertical`, `image`, `info`, `link`, `loader-circle`, `lock`, `mail`, `maximize-2`, `menu`, `merge`, `mic`, `mic-off`, `minimize-2`, `minus`, `move-diagonal-2`, `panel-left`, `pause`, `pencil`, `play`, `plus`, `printer`, `redo-2`, `refresh-cw`, `rotate-ccw`, `rotate-cw`, `search`, `share-2`, `shield-question-mark`, `split`, `square`, `text-cursor-input`, `trash`, `triangle`, `triangle-alert`, `undo-2`, `unplug`, `user`, `user-plus`, `users`, `wifi-off`, `x`, `zoom-in`, `zoom-out`

## Clases utilitarias

- margen: `g-m-0` `g-m-1` `g-m-2` `g-m-3` `g-m-4` `g-m-5` `g-m-6` `g-m-8` `g-m-12` `g-m-16` `g-m-auto` `g-mx-0` `g-mx-1` `g-mx-2` `g-mx-3` `g-mx-4` `g-mx-5` `g-mx-6` `g-mx-8` `g-mx-12` `g-mx-16` `g-mx-auto` `g-my-0` `g-my-1` `g-my-2` `g-my-3` `g-my-4` `g-my-5` `g-my-6` `g-my-8` `g-my-12` `g-my-16` `g-my-auto` `g-mt-0` `g-mt-1` `g-mt-2` `g-mt-3` `g-mt-4` `g-mt-5` `g-mt-6` `g-mt-8` `g-mt-12` `g-mt-16` `g-mt-auto` `g-mb-0` `g-mb-1` `g-mb-2` `g-mb-3` `g-mb-4` `g-mb-5` `g-mb-6` `g-mb-8` `g-mb-12` `g-mb-16` `g-mb-auto` `g-ms-0` `g-ms-1` `g-ms-2` `g-ms-3` `g-ms-4` `g-ms-5` `g-ms-6` `g-ms-8` `g-ms-12` `g-ms-16` `g-ms-auto` `g-me-0` `g-me-1` `g-me-2` `g-me-3` `g-me-4` `g-me-5` `g-me-6` `g-me-8` `g-me-12` `g-me-16` `g-me-auto`
- relleno: `g-p-0` `g-p-1` `g-p-2` `g-p-3` `g-p-4` `g-p-5` `g-p-6` `g-p-8` `g-p-12` `g-p-16` `g-px-0` `g-px-1` `g-px-2` `g-px-3` `g-px-4` `g-px-5` `g-px-6` `g-px-8` `g-px-12` `g-px-16` `g-py-0` `g-py-1` `g-py-2` `g-py-3` `g-py-4` `g-py-5` `g-py-6` `g-py-8` `g-py-12` `g-py-16` `g-pt-0` `g-pt-1` `g-pt-2` `g-pt-3` `g-pt-4` `g-pt-5` `g-pt-6` `g-pt-8` `g-pt-12` `g-pt-16` `g-pb-0` `g-pb-1` `g-pb-2` `g-pb-3` `g-pb-4` `g-pb-5` `g-pb-6` `g-pb-8` `g-pb-12` `g-pb-16` `g-ps-0` `g-ps-1` `g-ps-2` `g-ps-3` `g-ps-4` `g-ps-5` `g-ps-6` `g-ps-8` `g-ps-12` `g-ps-16` `g-pe-0` `g-pe-1` `g-pe-2` `g-pe-3` `g-pe-4` `g-pe-5` `g-pe-6` `g-pe-8` `g-pe-12` `g-pe-16`
- separación: `g-gap-0` `g-gap-1` `g-gap-2` `g-gap-3` `g-gap-4` `g-gap-5` `g-gap-6` `g-gap-8` `g-gap-12` `g-gap-16` `g-gap-x-0` `g-gap-x-1` `g-gap-x-2` `g-gap-x-3` `g-gap-x-4` `g-gap-x-5` `g-gap-x-6` `g-gap-x-8` `g-gap-x-12` `g-gap-x-16` `g-gap-y-0` `g-gap-y-1` `g-gap-y-2` `g-gap-y-3` `g-gap-y-4` `g-gap-y-5` `g-gap-y-6` `g-gap-y-8` `g-gap-y-12` `g-gap-y-16`
- disposición: `g-block` `g-inline` `g-inline-block` `g-flex` `g-inline-flex` `g-grid` `g-hidden` `g-flex-row` `g-flex-col` `g-flex-wrap` `g-items-start` `g-items-center` `g-items-end` `g-items-stretch` `g-items-baseline` `g-justify-start` `g-justify-center` `g-justify-end` `g-justify-between` `g-justify-around` `g-justify-evenly` `g-self-start` `g-self-center` `g-self-end` `g-self-stretch` `g-grow` `g-shrink-0` `g-w-full` `g-h-full` `g-min-w-0`
- texto: `g-text-caption` `g-text-body-sm` `g-text-body` `g-text-title-sm` `g-text-title` `g-text-title-lg` `g-text-muted` `g-text-subtle` `g-text-start` `g-text-center` `g-text-end` `g-truncate` `g-font-ui` `g-font-title`
- forma: `g-radius-none` `g-radius-xs` `g-radius-sm` `g-radius-md` `g-radius-lg` `g-radius-xl` `g-radius-pill`
- accesibilidad: `g-sr-only`
