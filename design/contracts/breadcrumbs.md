# Contrato · GBreadcrumbs

**Dueño:** lima · **Estado:** aprobado (forma **A «Ruta líquida»** por defecto, con **la cara de B «Escalón»** como su última etapa y las **puertas de C** cuando la aplicación da `children`: decisión del usuario del 2026-10-07; el resto deriva de WAI-ARIA APG *Breadcrumb* y *Disclosure Navigation*, WCAG 2.2 y los contratos vigentes; **ninguna pregunta de producto abierta**) · **Basado en:** `design/lab/breadcrumbs/r01/` (kiwi, commit `68a6ff2`: base funcional, conceptos A, B y C, hallazgos L1 a L16; `verificar.mjs` 324/324 en los tres motores, puerto 4215).
**Tag:** `g-breadcrumbs` · **Categoría:** navegación · **Entrada del paquete:** `@grana/vue` (principal), con la salida a entrada propia ya decidida si supera el tope (§«Entrega y empaquetado»).
**Decisiones:** #490 a #503 (integradas en `DECISIONS.md` el 2026-10-07; cambios en archivos compartidos aplicados, rastro en `design/contracts/breadcrumbs.pendientes.md`; tokens en `tokens.md` §41) y **#520 a #523** (remates tras la auditoría de coco, `design/lab/breadcrumbs/auditoria.md`: medidas de diseño, teclado, «Para lima» de `estilo.md`, límite de la métrica de la fuente y excepción de `navigate` con el slot `link`).
**Componente complejo** (CLAUDE.md, «Modelos por rol»: paneles anclados sobre otros elementos y un motor de medida): **coco y bruno en Opus**.

Dice **dónde está** la página dentro de una jerarquía y deja **subir** a cualquier nivel: Inicio · Laboratorio central · Muestras · 2026 · Lote 2026-0412 · Muestra M-0007. Donde la aplicación lo sabe, deja además **moverse de lado** (del lote 0412 al 0413) sin subir y volver a bajar.

---

## Principios

- **No esconder la ruta para caber.** Mientras quepan pastillas, todos los niveles siguen en la fila, en el árbol de accesibilidad y en el Tab; se aprietan por prioridad. Cuando ni las pastillas caben, no queda un «…»: queda la acción que importa, **subir**, con la ruta entera a un toque.
- **Enlaces de verdad.** Todo destino es un `<a href>` (abrir en pestaña nueva, URL al pasar, clic central). Nada de `role="menu"` ni de `GMenu`.
- **Presenta y emite intención.** La ruta es un dato de la aplicación (`items`); el componente no navega por su cuenta más allá del `href`, no pide datos (sin `fetch`) y no conoce ningún router: emite `navigate` con el evento nativo cancelable.
- **El nombre entero vive en el DOM.** Lo recortado sigue entero en el árbol; la pista visual (motor del tooltip, modo visual) solo lo **enseña** a quien ve. Nunca `title`.
- **Una fila, un alto.** Las migas nunca se parten en dos líneas y el alto de la raíz no cambia entre etapas: la cabecera no baila al redimensionar.
- **Sin textos por defecto** (Grana es internacional): todo texto va en `labels` y en los datos.

## Qué es y qué no (frontera; L14)

| Componente | Relación | Regla |
| --- | --- | --- |
| `GSidebar` | Comparte el contrato de enlaces (`href` + `navigate` cancelable, #70) | La barra lateral dice **la sección**; las migas, **la profundidad**. Conviven (receta: barra lateral + migas en la cabecera) |
| `GStepper` | Una fila de elementos conectados | El stepper es un **proceso** (orden temporal, estado de cada paso); las migas, un **lugar**. Ni círculos, ni conectores de progreso, ni estados de paso |
| `GMenu` | Lista anclada a un disparador | **No se usa**: `GMenu` es de **acciones**; la escalera y las puertas son **enlaces** (APG *Disclosure Navigation*) |
| `GPagination` | `nav` + lista, `aria-current="page"`, `labels.nav` obligatorio | Mismo patrón de textos y de nombre del `nav` |
| `GSummary` | Cesión por prioridad sin `@container`, medida por lotes | Mismo lenguaje de cesión (#352); las migas no usan «+N» |
| `GTabs` | Fila horizontal | Las pestañas cambian de panel en la misma página; las migas cambian de página |
| `GTooltip` | Nombre entero de lo recortado | Las migas son un cliente más del **modo visual** del motor (#433, #496) |

**Lo que no hace** (base de kiwi, punto 15): no mueve el foco al navegar (llevarlo al `h1` de la página nueva es de la aplicación), no genera datos estructurados (`BreadcrumbList` es SEO de la aplicación), no tiene `title`, no tiene separador configurable.

## Forma elegida y qué lo hace distinto (#491; decisión del usuario del 2026-10-07)

**A · Ruta líquida, por defecto.** Los niveles no esperan a desaparecer: cada uno puede **comprimirse a una pastilla** con sus primeras letras; el actual es la pastilla de acento («estás aquí»), el único color de la fila. Al estrechar, la fila **se bebe por el medio** (pesos de `flex-shrink` y mínimos en CSS); la raíz queda entera o en su icono, nunca a medias; el actual se acorta el último. La miga que recibe el **foco por teclado se despliega en su sitio** con su nombre entero. Al navegar dentro de una aplicación de una sola página, **la ruta se extiende y se recoge**: la miga nueva sale de detrás de la anterior con `--g-ease-spring`; al subir, la última se recoge hacia la anterior.

**La cara de B «Escalón», como última etapa de A** (no es un modo que elija la aplicación). Cuando ni las pastillas caben, la fila se convierte en **«Subir · página»**: una pastilla `arrow-up` con el nombre del padre que lleva al antepasado más cercano con página, y el nombre de la página como divulgación que abre **la ruta entera como una escalera vertical**. Sustituye al «+N» de la base: «+N» **no existe** en `GBreadcrumbs`.

**C · Puertas, cuando la aplicación da `children`.** El separador entre dos niveles se convierte en **botón** que abre los hermanos del nivel siguiente, con el de la ruta marcado. Sin datos, el separador sigue siendo decorativo: la capacidad se enciende sola, sin prop.

**Qué lo hace distinto.** Unas migas que **no esconden la ruta para caber**: se aprietan nivel a nivel por prioridad (a 560px, seis de seis niveles visibles y alcanzables, donde un framework deja tres y «…»), la miga que recibe el foco se abre en su sitio, la ruta **crece y encoge a la vista** al navegar, y cuando ya no queda sitio no dejan una adivinanza sino **la acción que la gente hace, subir**, con la ruta entera como escalera. Donde la aplicación lo sabe, los separadores son **puertas al nivel de al lado**. Todo con enlaces de verdad, el nombre entero siempre en el árbol y 44px en táctil.

## Uso

```html
<GBreadcrumbs
  :items="[
    { label: 'Inicio', href: '/', icon: 'house' },
    { label: 'Laboratorio central', href: '/lab' },
    { label: 'Muestras', href: '/lab/muestras' },
    { label: '2026', children: lotesDe2026 },             // sin página: texto; sus hijos encienden una puerta
    { label: 'Lote 2026-0412', href: '/lab/lotes/0412' },
    { label: 'Muestra M-0007', href: '/lab/muestras/m-0007' }
  ]"
  :labels="{
    nav: 'Ruta de navegación',
    up: 'Subir a {label}',
    path: 'Ruta hasta {label}',
    children: 'Otras páginas en {label}'
  }"
  @navigate="({ item, event }) => { event.preventDefault(); router.push(item.href) }"
/>
```

Con `RouterLink` o `NuxtLink` (precarga, clase activa), el slot `link` (§«Enlaces»).

## Entrega y empaquetado (#490)

- **Paquete principal `@grana/vue`**, exportado y registrado por `install`; CSS en `grana.css` (`GBreadcrumbs.css`, de coco). Estimación de kiwi: ≈ 4 a 5 KB gzip (A + cara de B + puertas; sin «+N»).
- **Tope:** el principal crece **≤ 8 KB gzip** (criterio de #328, #337, #380), medido por bruno en el mismo árbol y anotado en `GBreadcrumbs.meta.json`.
- **Si lo supera, la salida ya está decidida** (lección de #317 → #328 y #415: decidir antes de construir para que bruno no se detenga): **entrada propia `@grana/vue/breadcrumbs`** (global UMD `GranaBreadcrumbs`), que exporta `GBreadcrumbs` y, por defecto, un plugin que lo registra; lo compartido (`GIcon`, `GLibIcon`, `utils/anchor.js`, `utils/tooltip.js`, `utils/visualTip.js`, `utils/sizeObserver.js`, `utils/template.js`) llega por `__shared` (#240) sin duplicarse; el CSS sigue en `grana.css`. bruno la aplica sin volver a lima, la declara en `exports`, `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js` (#442, #443) y avisa a lima para enmendar `api.md` y #490 con la cifra.
- **Compuertas** (las dos ramas): `grep -q "g-breadcrumbs__door" packages/vue/dist/grana.css` y `grep -q "g-breadcrumbs__stairs" packages/vue/dist/grana.css`. Solo con entrada propia, además: `! grep -q "GBreadcrumbs" packages/vue/dist/grana.js` y `test -f packages/vue/dist/breadcrumbs.js`.
- Componente puro (#444): `defineComponent(` y `oneOf(` sin efectos en el nivel superior del módulo.

## Props (#493)

| Prop | Tipo | Valores | Default | Obligatoria |
| --- | --- | --- | --- | --- |
| `items` | Array | niveles (§«Modelo de `items`»), de la raíz a la página actual | — | **sí** |
| `labels` | Object | §«Textos (`labels`)» | `{}` (función) | no |

Nada más. **No existen** (L2): `to`, `router`, `separator`, `maxItems`, `itemsBefore`, `itemsAfter` (la cesión es intrínseca, sin umbrales), `size`, `density` (hereda `body-sm`; reservado), `modelValue` (la ruta es dato de la aplicación), `id` (los ids internos salen de `useId()`, estables en SSR).

**Atributos:** `class`, `style`, `id`, `data-*` y `aria-*` van a la raíz `nav`. Un `aria-labelledby` en los atributos (un encabezado visible) sustituye a `labels.nav` y quita su aviso.

### Modelo de `items`

```js
{ label, href?, icon?, children? }      // un nivel; el último es la página actual
children: [{ label, href? }]            // hermanos del nivel SIGUIENTE (los muestra la puerta que hay delante de él)
```

- **`label`** (String, no vacío): texto visible y nombre accesible. Un nivel sin `label` **se ignora** y avisa (aviso 3).
- **`href`** (String): con `href` el nivel es un `<a>`; sin `href` es **texto** (`span`, sin foco, sin subrayado ni cursor de enlace): una agrupación sin página, como «2026».
- **`icon`** (String): **nombre** de Lucide, decorativo (convención «dato → nombre» de #202, `api.md` «Iconos en los componentes»; resolución de la aplicación: registro → lista de la librería). Pensado para la raíz (`house`, que registra la aplicación: no está en la lista de la librería); vale en cualquier nivel. Con slot `icon`, manda el slot; un `icon` que no es cadena es dato opaco para el slot.
- **`children`** (Array): en el nivel *i − 1*, enciende una **puerta** delante del nivel *i* (§«Puertas»). Cada hijo `{ label, href? }`; sin `label` se ignora (aviso 8); sin `href` es texto en la lista; sus `icon` y `children` se ignoran (sin aviso). En el **último nivel** no se pinta (aviso 7; reservado, #503).
- **El último nivel es siempre la página actual** (`aria-current="page"`). La ruta que no incluye la página queda reservada (L10, #503).
- Cualquier otro campo se conserva y llega a los slots.
- **Clave de cada nivel:** su **índice** (sin `id` obligatorio). La **identidad** de un nivel para la regla de movimiento (§«Movimiento») es su `href` y, sin `href`, su `label`.
- `items` vacío o no arreglo: **no se pinta nada** (ningún `nav` vacío en el árbol) y avisa (aviso 2).

### Textos (`labels`)

Ninguno tiene valor por defecto. Cada uno es una **cadena** con el marcador `{label}` (`utils/template.js`, `fill`) o una **función** `({ label }) => String`.

| Clave | Uso | `{label}` es | Requerido |
| --- | --- | --- | --- |
| `nav` | Nombre del `nav` (`aria-label`) | — | **Siempre** (salvo `aria-labelledby` en los atributos) |
| `up` | Nombre del enlace «Subir» de la última etapa («Subir a {label}») | el nivel al que sube | Con **dos o más niveles** (la última etapa puede llegar en cualquier ancho) |
| `path` | Nombre de la divulgación de la página («Ruta hasta {label}») | la página actual | Con dos o más niveles |
| `children` | Nombre de cada puerta («Otras páginas en {label}») | el nivel cuyos hijos abre (el *i − 1*) | Si hay al menos una puerta |

- **2.5.3 (etiqueta en el nombre):** el texto visible de «Subir» es el nombre del padre y el de la divulgación es el nombre de la página; por eso `up` y `path` **deben contener `{label}`** (aviso 6 si una cadena no lo trae; con función, es responsabilidad de la aplicación). La puerta no tiene texto visible.
- **`more` no es una clave:** «+N» no existe (#491). Queda libre por si algún día vuelve (#503).
- Con varias migas en la misma página, la aplicación les da `nav` distintos (APG).

## Estructura accesible (#492)

### Etapas de fila (`liquid`, `root-icon`, `shrink`)

```
nav.g-breadcrumbs  aria-label="{labels.nav}"  data-stage="liquid"                         ← punto de referencia navigation
├─ ol.g-breadcrumbs__list                                                                  ← una fila, nunca se parte
│  ├─ li.__item.is-root        > a.__link[href] > span.__icon[aria-hidden] (GIcon) + span.__label[dir=auto]
│  ├─ li.__item.is-mid         > svg.__sep (chevron-right, flip-rtl, aria-hidden) + a.__link[href] > span.__label
│  ├─ li.__item.is-mid         > svg.__sep + span.__link.__link--text > span.__label     (nivel sin página: no es enlace ni parada de Tab)
│  ├─ li.__item.is-mid         > button.__door[aria-expanded][aria-controls][aria-label="{labels.children}"] > svg (chevron-right, flip-rtl)
│  │                            + ul.__panel[popover=manual][id] > li > a.__link[href] | a.__link[aria-current="true"] (+ svg.__here check) | span.__link--text
│  │                            + a.__link[href] > span.__label                            (puerta en lugar del separador)
│  ├─ li.__item.is-parent      > svg.__sep + a.__link[href] > span.__label
│  └─ li.__item.is-current     > svg.__sep + a.__link[href][aria-current="page"] > span.__label   (span[aria-current="page"] sin href)
└─ div.g-tooltip[popover=manual][aria-hidden=true] ×N                                      ← pistas del modo visual (#433, #496), fuera del ol
```

### Última etapa (`step`, la cara de B)

```
nav.g-breadcrumbs  aria-label="{labels.nav}"  data-stage="step"
├─ div.g-breadcrumbs__face
│  ├─ a.__up[href][aria-label="{labels.up}"] > svg (arrow-up, aria-hidden) + span.__label[dir=auto]     ← al antepasado más cercano con página
│  └─ button.__toggle[aria-expanded][aria-controls][aria-label="{labels.path}"] > span.__label[dir=auto] + svg.__chevron (chevron-down, aria-hidden)
├─ ol.g-breadcrumbs__stairs[popover=manual][id]
│  └─ li.__stair[style=--_depth:i] > a.__link[href] | span.__link--text | (último) a/span[aria-current="page"]
└─ div.g-tooltip ×N
```

### Reglas

1. **`nav` con nombre** (`labels.nav` o `aria-labelledby`), aviso 1 si falta. Un solo punto de referencia por instancia.
2. **`ol` de `li`, un nivel por `li`** (APG): el lector dice «lista, 6 elementos». Los **separadores no son `li` ni texto**: un `svg` Lucide `aria-hidden` **dentro** del `li`, delante del enlace (nada de `›`, `/` ni `content:` en CSS, #85). `list-style: none` en Safari puede quitar la semántica de lista dentro de un `nav`: bruno **no** pone `role="list"` de entrada; queda pendiente de la comprobación con VoiceOver (§«No verificado»), y si se pierde, se añade.
3. **`aria-current="page"` una sola vez, en el último nivel**, sea `a` o `span`; en la escalera, en su escalón. Se distingue por peso y color de texto, no solo por color (1.4.1); en `forced-colors`, subrayado.
4. **En una puerta**, el hijo que coincide con el nivel de la ruta lleva **`aria-current="true"`** («el de esta ruta») y el `check` decorativo; nunca `page`, que es solo del último nivel de la fila (también cuando la puerta precede al último). Coincidencia: mismo `href` si los dos lo tienen; si no, mismo `label`. Si ninguno coincide, nada se marca.
5. **Cada nombre lleva `dir="auto"`** (L11, #282, #353): niveles, «Subir», la divulgación, la escalera, las puertas y las pistas.
6. **Sin `title`** en ningún elemento (#113).
7. **Las listas de los paneles no llevan rol ni nombre propios:** son la lista de enlaces de una divulgación (APG *Disclosure Navigation*), dentro del mismo `nav`. Cerradas, `popover` cerrado: fuera del árbol.
8. **Lista de medida** (si bruno la usa, #495): `ol.g-breadcrumbs__measure` con `aria-hidden="true"`, `inert`, **sin ids**, sin slots de la aplicación; nunca en el Tab ni en el árbol.

## Enlaces, `navigate` y slot `link` (#494)

- **Por defecto, `<a href>`.** Al activarlo con un **clic primario sin modificadores** (botón 0, sin Ctrl, ⌘, Mayús ni Alt) o con Intro, el componente emite **`navigate`** con el evento nativo **cancelable**: `event.preventDefault()` deja la navegación a un router, como `GSidebar` (#70). Con modificadores o clic central **no emite** (abrir en pestaña nueva es del navegador; si la aplicación cancelara, rompería ese gesto) y no cierra paneles.
- **Origen** del destino en el payload: `from` = `path` (la fila), `up` («Subir»), `stairs` (la escalera) o `door` (una puerta).
- **Desde un panel**, el panel se cierra y el foco vuelve a su disparador **antes** de emitir (como el drawer de `GSidebar`): el foco nunca queda en el `body` si la aplicación cancela y actualiza `items`. Llevarlo después al `h1` de la página nueva es de la aplicación.
- **Un nivel sin `href` no emite nada** (no es interactivo).
- **Slot `link`** (para `RouterLink`/`NuxtLink`), **uno para todos los `<a>` del componente** (fila, «Subir», escalera y puertas). Alcance `{ item, index, current, from, attrs, content }`:
  - `attrs`: lo que el elemento debe recibir con `v-bind="attrs"`: `href`, `class` (las de §«Clases»), `aria-current` cuando toca, `aria-label` en «Subir», `onClick` (emite `navigate` y cierra el panel) y lo que necesite el motor de la pista.
  - `content`: un **componente** sin props que pinta el interior que corresponde (hueco de icono + `__label` con `dir="auto"`; en «Subir», `arrow-up` + nombre del padre; en una puerta, el `check` del de la ruta). La aplicación lo pinta con `<component :is="content" />`.
  - **Reglas:** un solo elemento enfocable, que recibe `v-bind="attrs"` y lleva `content` como único contenido; nada visible añadido (la medida no ve el slot: la lista de medida pinta el `<a>` por defecto con las mismas clases). Con el slot, la navegación la hace el elemento (el `RouterLink` navega en su propio `onClick`); `navigate` se sigue emitiendo, con `event.defaultPrevented` ya verdadero si el router lo canceló. **Es la única excepción a la guarda de `defaultPrevented` de `api.md` «Enlaces y `navigate`» (#523):** sin el slot, un clic ya cancelado antes de llegar al componente no emite; con el slot, sí, porque el router siempre llega primero y cancelaría todos los clics. Los modificadores y el botón central siguen sin emitir en ambos casos. Si el elemento del slot no aplica `attrs`, aviso 9.
  - Los niveles **sin `href`** nunca pasan por el slot.

```html
<GBreadcrumbs :items="ruta" :labels="textos">
  <template #link="{ item, attrs, content }">
    <RouterLink :to="item.href" v-bind="attrs"><component :is="content" /></RouterLink>
  </template>
</GBreadcrumbs>
```

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `link` | Sustituye el elemento `<a>` de cada destino (router) | `{ item, index, current, from, attrs, content }` | Un solo enfocable con `v-bind="attrs"` y `<component :is="content" />` como contenido (§«Enlaces») |
| `icon` | Icono de un nivel; **sustituye** al `GIcon` por nombre de `item.icon` (#202) | `{ item, index }` | Dentro de `g-breadcrumbs__icon` (`aria-hidden`); decorativo; un `GIcon` con `label` avisa (aviso de `GIcon`) |

Sin slot por defecto ni slot de separador (#493).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ item, index, event, from }` | Activación primaria de un destino (§«Enlaces»). `item` es el nivel, o el **hijo** si `from === 'door'`; `index` es la posición en `items` del nivel destino (con `door`, la del nivel delante del cual está la puerta: el hijo ocuparía ese lugar); `event` es el evento nativo, cancelable |

Declarado en `emits` (lección del CLAUDE.md). Los demás eventos nativos llegan a la raíz por `$attrs`. Sin `update:*`: no hay estado que la aplicación controle.

## Cesión: las etapas de A (#495)

**Una fila siempre.** El componente elige entre **cuatro etapas**, en este orden, la primera que cabe:

| Etapa (`data-stage`) | Qué cambia | Cuándo existe |
| --- | --- | --- |
| `liquid` | Todos los niveles en la fila; se comprimen en CSS por prioridad | Siempre |
| `root-icon` | La raíz pasa a **solo su icono** (el nombre sigue en el árbol con el patrón de texto oculto accesible) | Si la raíz tiene `icon` |
| `shrink` | El actual también se acorta (hasta su suelo) | Siempre |
| `step` | La cara de B: «Subir · página» (§«Última etapa») | Con dos o más niveles |

**Compresión en `liquid` (CSS de coco, contrato de pesos):** cada `li` es `flex: 0 1 auto` con un peso de `flex-shrink` y un mínimo por papel: **en medio `100000`** (ceden casi todo antes que nadie), **padre `30`**, **actual `0`** (`1` en `shrink`), **raíz `flex: none`** (entera o, en `root-icon`, su icono; nunca a medias). Mínimo de una pastilla (en medio y padre): icono si lo tiene + **`3ch`** de nombre + relleno; suelo del actual en `shrink`: **`8ch`** de nombre (o su ancho natural si es menor). Tope de nombre de cualquier nivel salvo el actual: **`20ch`** con elipsis (un nombre largo es pastilla también a 1100px). Con `pointer: coarse`, cada destino ≥ 44 × 44px (la pastilla crece hasta ese mínimo). Con un solo nivel, el actual se acorta sin suelo.

**Cómo se decide (bruno):**

1. **Por lotes**, como `GSummary` (#352): prueba las etapas en orden sobre una lista de medida (`__measure`, regla 8 de §«Estructura») o con anchos en caché; una etapa **cabe** si la suma de los anchos de sus `li` (ya en sus mínimos) ≤ ancho de la lista + 0,5px. **El DOM real solo cambia si cambia la etapa.** La etapa `step` no se mide: es la que queda.
2. **Solo el ancho** del `nav` decide (observador compartido `utils/sizeObserver.js`, `observeSize`); la medida corre **en el cuadro siguiente** al aviso del observador (medir dentro del callback provoca «ResizeObserver loop» en WebKit, medido por kiwi). Se vuelve a medir al cambiar `items` y al cargar fuentes (`document.fonts.ready` y `loadingdone`: la fuente cambia los anchos sin cambiar el del `nav`).
3. **`data-clipped`** en cada `li` cuyo nombre está recortado (`scrollWidth > clientWidth + 1`), medido por lotes tras cada cambio de etapa, de ancho o de foco dentro de la fila (el despliegue por foco cambia los anchos de las vecinas). Solo cambia el fondo de la pastilla (coco): nunca el tamaño, así que no hay bucle de medida.
4. **Al cambiar de etapa:** se cierra lo abierto (sin devolver el foco, salvo lo que sigue) y **el foco se conserva por nivel**: si estaba en el enlace del nivel *i*, pasa al elemento del mismo nivel en la etapa nueva (en `step`, «Subir» si es ese nivel; si no, la divulgación); si estaba en la divulgación o en la escalera y se vuelve a una fila, pasa al enlace de ese nivel (la divulgación, al actual; si el actual no tiene `href`, al último enlace de la fila); si estaba en una puerta y la etapa nueva es `step`, a la divulgación. `focus({ preventScroll: true })`.
5. **Primer pintado sin medir (SSR, L9, punto 16 de kiwi):** se pinta `liquid`; la lista **recorta** su desbordamiento en línea hasta que la raíz tenga `is-ready` (después, nada desborda). A lo resuelve casi entero en CSS.
6. **Cambiar de etapa nunca se anima** (#500).
7. **Alto Δ0 entre etapas** (requisito para coco): la fila y la cara miden lo mismo de alto, con puntero fino y con `pointer: coarse`.

## El foco despliega; la pista visual (#496)

- **Despliegue por teclado (A):** el `li` cuyo enlace tiene `:focus-visible` toma peso `1` y su nombre pierde el tope (`max-inline-size: none`), de modo que se ve **entero o casi** (#521: con peso `1` frente al `30` del padre, Flexbox reparte el déficit en proporción a peso × base, así que el padre no llega a su mínimo antes de que la miga desplegada ceda algo; medido 97,5 % del nombre a 560px y la pista visual completa el resto cuando ni desplegado cabe) y las vecinas se aprietan. Un peso `0` lo dejaría siempre entero pero haría desbordar la fila cuando de verdad no cabe. **En CSS** (`.g-breadcrumbs__item:has(> .g-breadcrumbs__link:focus-visible)`), sin clase de JS; se pliega al irse el foco. **Sin transición de tamaño** (instantáneo: es frecuente, #500). Con el **puntero**, nada se despliega (la fila se movería bajo él): la pista da el nombre.
- **Pista visual** (modo visual del motor del tooltip, `tooltip.md` §«Modo visual», #433; **enmienda** aplicada en `tooltip.md` §«Modo visual»): `GBreadcrumbs` es el primer cliente cuyo nombre está **visible pero recortado** (no oculto). Un nodo `g-tooltip` (`aria-hidden`, sin rol, id ni referencias) **por destino que pueda recortarse**: cada nivel de la fila, «Subir» y la divulgación; y **uno por puerta**. Al final de la raíz `nav`, **nunca dentro del `ol`** (que solo admite `li`).
  - **Texto:** el `label` del nivel (en «Subir» y la divulgación, el nombre visible, no el `aria-label`); en una puerta, su nombre (`labels.children` resuelto), como el `aria-label` del botón de contraer de `GSidebar` (#436).
  - **`disabled()`** verdadero mientras el nombre cabe entero: activa solo con `data-clipped` o con la raíz en solo icono; la puerta, siempre activa (es un control de solo icono: la pista **ayuda a descubrirla**, #498). Se mide al pedirlo (lectura síncrona: con el foco por teclado, el despliegue ya se aplicó y la pista solo sale si **ni desplegado** cabe).
  - **Comportamiento del motor sin excepciones:** `OPEN` 350 ms con puntero, al instante con foco por navegación, no con clic ni foco por programa; Esc la cierra sin mover el foco; **grupo `nav`**: viaja entre niveles y puertas (#388); lado `bottom`; pulsación larga en táctil muestra el nombre y **soltar no activa** (#385); se cierra al abrirse un panel (`check()` al cambiar `aria-expanded`).
  - Ningún nodo en los enlaces de los paneles (allí el nombre se parte en líneas y no se recorta).
- **Nivel sin página recortado** (texto, no enfocable): la pista sale con el puntero; el teclado no llega (límite conocido; el nombre entero está en el árbol).

## Última etapa: la cara de B (#497)

- **«Subir»** = `a.g-breadcrumbs__up` al **antepasado más cercano con `href`** (normalmente el padre), con `arrow-up` (no `chevron-left`: subir en la jerarquía no es «atrás» en el historial) y el nombre de ese nivel visible y recortable; nombre accesible `labels.up` con `{label}` = ese nivel. Emite `navigate` con `from: 'up'`. Si ningún antepasado tiene `href`, no se pinta.
- **La divulgación** = `button.g-breadcrumbs__toggle` con el **nombre de la página** visible (recortable) y `chevron-down`; nombre `labels.path` con `{label}` = la página. Controla `ol.g-breadcrumbs__stairs`. **Es la pastilla de acento** (#521): `accent-soft` / `on-accent-soft` y `--g-text-action-weight`, como el actual de la fila («estás aquí»), no un botón transparente; al pasar, marco interior `on-accent-soft`; ningún token nuevo.
- **La escalera:** todos los niveles en orden, uno por `li.__stair`, cada uno más adentro (`--_depth` = índice; sangría `space × 4` por nivel), una guía en L de borde entre escalones (estructura, como las guías de un árbol; no es un icono), el actual marcado (`aria-current="page"` y barra `accent-text`, como la barra activa de `GSidebar`, #228). Los nombres **se parten en líneas** (no se recortan). Niveles sin página, texto. **Sin puertas en la escalera** (reservado, #503).
- **Dos paradas de Tab**, a cualquier ancho; la cara no cede (solo recorta los dos nombres).
- **Teclado:** §«Teclado».

## Puertas (C) (#498)

- **Dónde:** delante del nivel *i* (1 ≤ *i* ≤ último) cuando el nivel *i − 1* trae `children` no vacío, **en las etapas de fila**. La puerta **sustituye** al separador decorativo en ese `li`. En `step` no hay puertas.
- **Qué es:** `button.g-breadcrumbs__door` (`type="button"`, `aria-expanded`, `aria-controls`, `aria-label` = `labels.children` con `{label}` = el nivel *i − 1*) con `chevron-right` (`flip-rtl`). Controla `ul.g-breadcrumbs__panel` con los hijos como **enlaces** (texto si no tienen `href`), en el orden de la aplicación; el de la ruta con `aria-current="true"` y `check` (§«Estructura», regla 4). Elegir uno emite `navigate` con `from: 'door'`.
- **Cuesta Tab** (una parada por puerta): por eso solo existe con datos.
- **Aspecto en reposo: decisión estética de coco** (la «duda menor» de kiwi se le delega), en su banco, con estas condiciones que no se negocian:
  1. **Teclado:** es parada de Tab con anillo de foco visible y nombre; al llegar con Tab, la pista visual la nombra (#496).
  2. **Puntero:** al pasar, se distingue del separador decorativo (estado hover propio, `cursor: pointer`) y la pista la nombra a los 350 ms.
  3. **3:1 como control** (WCAG 1.4.11): el chevron (y el contorno o fondo si coco le da forma) contra lo adyacente, en claro, oscuro y un tema distinto. Kiwi midió 5,00:1 con `text-muted`.
  4. Si en reposo puerta y separador se ven iguales, coco lo justifica en `estilo.md` y lo mide en la auditoría (descubrimiento por puntero y teclado).
- **En reposo, como quedó (decisión de coco, registrada en #521 con el §41):** la **puerta entornada**: el mismo chevron en un **hueco redondo `neutral-soft`** de `max(24px, space × 6, 1em + space × 2)` (`max(44px, 1em + space × 2)` con `pointer: coarse`; #520), en `text-muted`, con `cursor: pointer`; al pasar, marco interior `border-control` y chevron en `text`. Se distingue del separador decorativo por forma (hueco), tono (`text-muted` frente a `text-subtle`) y cursor. Medido ≥ 6,49:1 en reposo y ≥ 3,43:1 de marco al pasar (mínimo en 28 configuraciones).
- **Abierta:** el chevron gira hacia abajo (90°; −90° sobre el espejo en RTL) y la puerta toma `accent-soft` / `on-accent-soft` (§«Movimiento»).
- Con `pointer: coarse` cada puerta suma 44px a la fila: la fila cede antes; es el precio aceptado.

## Paneles (escalera y puertas) (#499)

- **Capa superior:** `popover="manual"` (las migas viven en cabeceras con `overflow: hidden`), dentro del `nav` (así vive en el mismo `<dialog>` modal y no queda inerte).
- **Colocación:** debajo del disparador, alineado a su inicio y, si no cabe, a su final (`placeBlock` de `utils/anchor.js`, `align`); arriba si abajo no cabe. **Reglas de `api.md` «Paneles anclados» (#358):** (1) lado con histéresis, (2) `--_max` fijo durante el desplazamiento (lista con desplazamiento propio si no cabe), (3) **si el ancla sale del visor o de su contenedor con desplazamiento, se cierra sin devolver el foco** (`anchorGone`); no hay hoja móvil, así que rige siempre; (4) se cumple sin más: no hay opción activa ni el puntero mueve el foco. Ancho: constante de coco desde `space`, acotado al visor.
- **Uno abierto a la vez** en la instancia; abrir otro cierra el anterior.
- **Se cierra:** con Esc (devuelve el foco al disparador), al pulsar el disparador otra vez, al pulsar fuera (sin mover el foco), cuando **el foco sale** del disparador y del panel (el foco sigue su curso), al **cambiar de etapa** (§«Cesión», punto 4), al salir el ancla (regla 3) y al elegir un destino (§«Enlaces»).
- **Esc** cierra el panel con `preventDefault()` y `stopPropagation()`: **no** llega a un `GDialog` ancestro (como `GMenu`).
- **Abrir no mueve el foco** (APG *Disclosure*): se queda en el disparador. ↓ lo lleva dentro.

## Teclado

| Tecla | Dónde | Acción |
| --- | --- | --- |
| Tab / Mayús+Tab | Fila | Recorre los enlaces y las puertas en el orden del documento (el nivel sin página no es parada) |
| Intro | Enlace | Navega (nativo) y emite `navigate` |
| Intro / Espacio | Puerta, divulgación | Abre o cierra; el foco se queda en el botón |
| ↓ | Puerta | Abre (si está cerrada) y pone el foco en **el hijo de la ruta** (o en el primero si ninguno coincide) |
| ↓ | Divulgación | Abre (si está cerrada) y pone el foco en **el primer escalón** con enlace |
| ↑ / ↓ | Dentro del panel | Enlace anterior / siguiente (circular) |
| Inicio / Fin | Dentro del panel | Primer / último enlace |
| Esc | Disparador o panel | Cierra y devuelve el foco al disparador; si solo hay pista abierta, la cierra (motor) |
| Tab | Dentro del panel | **Recorre los enlaces del panel** en el orden del documento y, **desde el último**, sale y cierra (APG *Disclosure Navigation*; #520). |

En los paneles, el orden del DOM es el del Tab: el panel va **inmediatamente después** de su disparador (la puerta, dentro de su `li`; la escalera, después de la cara).

## Movimiento (#500)

| Qué | Duración y curva | Con `prefers-reduced-motion: reduce` |
| --- | --- | --- |
| **Bajar un nivel** (la ruta se extiende): el nivel nuevo sale de detrás del anterior | `translate` desde `space × 3` hacia el inicio (reflejado en RTL) con **`--g-duration-slow` + `--g-ease-spring`**; opacidad con `--g-duration-press` + `--g-ease-out` | Sin desplazamiento; aparece en su sitio (como mucho, fundido `--g-duration-fast`) |
| **Subir un nivel** (la ruta se recoge): el último se recoge hacia el anterior y desaparece | `translate` hacia el anterior y opacidad con **`--g-duration-press` + `--g-ease-out`** (salida más corta que la entrada, #152) | Desaparece sin desplazarse (sin copia saliente) |
| **Escalera** que se abre | Cada escalón entra desde su sangría (`space × 2`) con `--g-duration-slow` + `--g-ease-out`, con retardo `--g-duration-fast × min(i, 4) / 4` (acotado: la escalera entera nunca tarda más de `slow + fast`); el chevron de la divulgación gira 180° con `--g-duration-press` + `--g-ease-out` | Aparece entera; el chevron cambia sin girar |
| **Puerta** que se abre | El chevron gira 90° (−90° en RTL) con `--g-duration-press` + `--g-ease-out`; fondo con `--g-duration-fast` + `--g-ease-out` | Sin giro; el color, con fundido |
| Panel (aparecer / cerrar) | Como los popovers de Grana: entrada `--g-duration-press` + `--g-ease-out`, salida `--g-duration-fast` (en Firefox y WebKit, cierre en el acto, #394) | Fundido |
| Pastilla que cambia (`data-clipped`, actual que pasa a otro nivel) | Color y fondo con `--g-duration-fast` + **`--g-ease-out`** (#521) | Igual |
| Despliegue por foco | **Sin transición** de tamaño | Igual |
| Cambio de etapa | **Nunca** se anima | Igual |

- **`--g-ease-spring` (quinto uso, §29.1):** solo el `translate` del nivel que llega, que es un **desplazamiento que llega** desde un elemento de origen (el nivel anterior), como la ficha de `GCombobox` (#336); la opacidad va con `--g-ease-out` y nada del componente «nace» con el muelle. Rebase con el valor por defecto: 3,8 % de `space × 3` (≈ 0,5px). Lo aprobó el usuario con A («al navegar, la ruta se extiende y se recoge con `--g-ease-spring`»). Dentro de `@supports (transition-timing-function: linear(0, 1))` (§29.1). Sin `--g-ease-bounce`.
- **Regla de subir o bajar (L13):** con `is-ready` y en una etapa de fila, al cambiar `items` se comparan identidades (`href` o, sin él, `label`): si los nuevos son **los anteriores más uno al final**, el último entra (`is-entering`); si son **los anteriores sin el último**, el que se fue sale (`is-leaving`); **cualquier otro cambio, sin animación**. Nunca al montar ni en `step`.
- **El que sale ya no está en `items`:** bruno lo conserva como **copia saliente** al final de la lista (`li.is-leaving`, `aria-hidden="true"`, `inert`, sin ids, fuera del Tab y de la medida) hasta `animationend`/`animationcancel`, con un respaldo de tiempo (`--g-duration-press` + margen, `utils/motion.js`). El nuevo último lleva `aria-current="page"` desde el primer cuadro.
- **Keyframes** (§29.4: reacción única a un suceso, nunca al montar) con prefijo `g-breadcrumbs-`: `g-breadcrumbs-enter…`, `g-breadcrumbs-leave…`, `g-breadcrumbs-stair…`. Las demás, transiciones.

## Tokens consumidos (#501)

**Ningún token nuevo** (`tokens.md` §17.6: ningún existente se queda corto; registro en `tokens.md` §41). Previstos (coco elige y mide; puede usar otros existentes justificándolo en `estilo.md`):

- Texto: `--g-font-ui`, `--g-text-body-sm-{size|line|weight|tracking}` (todo el componente), `--g-text-action-weight` (actual, pastilla de acento, «Subir», escalón actual, hijo de la ruta); `--g-color-text` (actual, hover), `--g-color-text-muted` (niveles, nivel sin página, puerta en reposo; ≥ 4.5:1), `--g-color-text-subtle` (separador decorativo).
- A: `--g-color-accent-soft` / `--g-color-on-accent-soft` (actual), `--g-color-neutral-soft` + `--g-color-text` u `--g-color-on-neutral-soft` (pastilla recortada), `--g-radius-pill`.
- B: `--g-color-neutral-soft` / `--g-color-on-neutral-soft` («Subir»), `--g-color-neutral-strong` / `--g-color-on-neutral` (hover), `--g-color-accent-text` (barra del escalón actual), `--g-color-border-strong` (guía en L), `--g-radius-xs` (codo de la guía).
- C: `--g-color-accent-soft` / `--g-color-on-accent-soft` (puerta abierta), `--g-color-accent-text` (`check` del hijo de la ruta), `--g-radius-sm`.
- Paneles: `--g-color-surface`, `--g-color-border`, `--g-radius-md`, `--g-shadow-2`, `--g-color-neutral-soft` (hover de un enlace).
- Comunes: `--g-space-1` (todas las medidas), `--g-border-width`, `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-spring`. La pista usa los tokens de `GTooltip` (§36 de `tokens.md`), sin CSS propio.

**No son tokens** (registro en `tokens.md` §41):

- **Literales de unidad** (amplían §7, #187, como `7ch`/`4ch` de `GSummary`): **`20ch`** (tope de nombre de un nivel), **`3ch`** (nombre mínimo de una pastilla), **`8ch`** (suelo del actual en `shrink`).
- **Constantes de diseño:** pesos de `flex-shrink` **`100000` · `30` · `1` · `0`** (en medio, padre, actual en `shrink`, actual); sangría de la escalera **`space × 4`** por nivel; anchos de los paneles (coco, desde `space`); y las **medidas de la tabla «Medidas» de `estilo.md`** (#520, #521), todas derivadas de `--g-space-1` y de la línea de texto, ninguna es token:
  - **Alto de la fila y de la cara de B (Δ0): `--_bc-h` = `max(24px, space × 7, body-sm-line)`** (`max(44px, space × 7, body-sm-line)` con `pointer: coarse`). La línea de texto entra para que crezca con el texto al 200 % (WCAG 1.4.4); sin cambio con el tema por defecto (28), el propio (35) ni el de la auditoría a texto normal (24).
  - **Puerta: `--_bc-door` = `max(24px, space × 6, 1em + space × 2)`** (`max(44px, 1em + space × 2)` con `pointer: coarse`), redonda, con `space × 0.5` a cada lado; el `1em` hace que el chevron (de `1em`) quepa siempre. La raíz en solo icono es un círculo de `--_bc-h`.
  - Márgenes del separador y de la puerta `space × 0.5`; relleno en línea de una pastilla `space × 2`; icono–nombre `space × 1`; anchos de los paneles `space × 48` a `min(space × 80, 100vw − space × 4)` (puerta) y `space × 56` a `min(space × 90, 100vw − space × 4)` (escalera); relleno del panel `space × 1` y de la escalera `space × 2`; enlace de un panel `max(24px, space × 8)` (44 con puntero grueso); guía en L a `space × (4·d − 2)` del inicio con brazo `space × 1.5`; entrada de un panel `space × 1` hacia el disparador (la de `GHelper`).
  - **Lista de medida con `overflow: clip`** (`.g-breadcrumbs__measure`): sus niveles en sus mínimos desbordan cuando ni la última etapa probada cabe, y ese desbordamiento invisible ensanchaba la página (458px de ancho a 320px, WCAG 1.4.10); el recorte no cambia lo que mide bruno.
- **Constantes de coreografía** (amplían §29.6): **`--g-space-1 × 3`** (desplazamiento del nivel que llega o se va, reflejado en RTL), **`--g-space-1 × 2`** (entrada de un escalón), retardo **`--g-duration-fast × min(i, 4) / 4`**, giros **`90°`** (puerta) y **`180°`** (divulgación).
- `24px` / `44px` (§7) como suelo de cada destino.
- **Datos del `.vue` al CSS** (amplían §29.5): `data-stage`, `data-clipped`, `is-ready`, `is-entering`, `is-leaving`, `--_depth`, `--_x`/`--_y`/`--_max` de los paneles, `data-side` del panel.

## Clases y datos (contrato bruno ↔ coco)

| Clase o dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-breadcrumbs` | `nav` raíz | Siempre |
| `is-ready` | Raíz | Tras la primera medida (antes: la lista recorta su desbordamiento; ninguna transición) |
| `data-stage` | Raíz | `liquid` · `root-icon` · `shrink` · `step` |
| `g-breadcrumbs__list` | `ol` de la fila | Etapas de fila |
| `g-breadcrumbs__measure` | `ol` de medida (`aria-hidden`, `inert`) | Si bruno mide con lista |
| `g-breadcrumbs__item` | `li` de un nivel | Etapas de fila |
| `is-root` · `is-mid` · `is-parent` · `is-current` | `li` | Papel del nivel (primero · en medio · penúltimo · último). Con un nivel, solo `is-current`; con dos, la raíz es también el padre: lleva `is-root` e `is-parent`, y en la compresión manda `is-root` (`flex: none`) |
| `is-icon` | `li.is-root` | Etapa `root-icon` con `icon` en la raíz |
| `data-clipped` | `li` | Nombre recortado (medido) |
| `is-entering` · `is-leaving` | `li` | Movimiento de subir o bajar (§«Movimiento») |
| `g-breadcrumbs__link` | `a` o `span` de un destino (fila, paneles) | Siempre |
| `g-breadcrumbs__link--text` | `span` de un nivel o hijo sin `href` | Sin página |
| `g-breadcrumbs__icon` | Hueco del icono (`aria-hidden`) | Con `icon` o slot `icon` |
| `g-breadcrumbs__label` | `span[dir=auto]` del nombre | Siempre (fila, cara, paneles) |
| `g-breadcrumbs__sep` | `svg` separador | Entre niveles sin puerta |
| `g-breadcrumbs__door` | `button` puerta | Con `children` en el nivel anterior |
| `g-breadcrumbs__panel` | `ul` de una puerta (`popover`) | Con puerta |
| `g-breadcrumbs__here` | `svg` `check` del hijo de la ruta | En el panel de una puerta |
| `g-breadcrumbs__face` | Cara de B | `step` |
| `g-breadcrumbs__up` | `a` «Subir» | `step`, con antepasado con página |
| `g-breadcrumbs__toggle` | `button` de la página | `step` |
| `g-breadcrumbs__chevron` | `svg` `chevron-down` de la divulgación | `step` |
| `g-breadcrumbs__stairs` | `ol` escalera (`popover`) | `step` |
| `g-breadcrumbs__stair` · `is-current` · `--_depth` | `li` escalón | `step` |
| `aria-expanded="true"` | Puerta, divulgación | Panel abierto (gancho del CSS; sin clase `is-open`) |
| `:popover-open`, `data-side` | Panel | Abierto (`top` · `bottom`) |
| `--_x`, `--_y`, `--_max` (en línea) | Panel | Posición y alto máximo (#358) |
| `g-tooltip` (`aria-hidden`, sin rol) | Pistas | Modo visual (#433, #496) |

CSS de coco que seleccione hijos por estructura dentro de la raíz ignora `.g-tooltip` con `:where()` (#383), aunque los nodos van fuera del `ol`.

## RTL

La fila sigue el orden lógico; los chevrons de separador y puerta llevan `flip-rtl` (`scale: -1 1` bajo `:dir(rtl)`); la puerta abierta gira −90° sobre el espejo; `arrow-up` y `chevron-down` no se espejan; la entrada y salida de un nivel se reflejan; la escalera sangra hacia el inicio lógico. Funciona en un bloque `dir="rtl"` dentro de una página LTR. Cada nombre con `dir="auto"`.

## SSR

Se renderiza la etapa `liquid` con todos los niveles, las pistas cerradas y los ids de `useId()`; ninguna lectura de `document`/`window` ni escucha fuera de `onMounted`; los paneles, cerrados. `is-ready` solo en el cliente.

## Avisos de desarrollo (`[Grana GBreadcrumbs]`, una vez por instancia y motivo)

Con `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`; sin el texto del usuario en el mensaje.

1. Falta `labels.nav` y no hay `aria-labelledby` en los atributos.
2. `items` vacío o no es un arreglo: no se pinta nada.
3. Un nivel sin `label` (o vacío): se ignora.
4. Con dos o más niveles, falta `labels.up` o `labels.path` (la última etapa puede llegar en cualquier ancho).
5. Hay al menos una puerta y falta `labels.children`.
6. `labels.up` o `labels.path` en cadena sin `{label}` (el nombre no contendría el texto visible, 2.5.3); `labels.children` en cadena sin `{label}` con más de una puerta (todas se llamarían igual).
7. `children` en el último nivel: no se pinta (reservado).
8. Un hijo de `children` sin `label`: se ignora.
9. El elemento del slot `link` no recibió `attrs` (falta `g-breadcrumbs__link` o el `href` en el elemento pintado).

## Accesibilidad y mínimos (no son tema)

- Destinos ≥ 24 × 24px con puntero fino (también la raíz en solo icono y las puertas); **≥ 44 × 44px con `pointer: coarse`** (enlaces, puertas, «Subir», divulgación y enlaces de los paneles).
- Texto `body-sm` (14px con el tema por defecto), nunca < 12px.
- Contraste ≥ 4.5:1 en todo texto (niveles, pastillas, actual en `on-accent-soft` sobre `accent-soft`, «Subir», escalera, paneles); ≥ 3:1 en la puerta como control y en la guía y la barra de la escalera si transmiten estado (la barra repite `aria-current` y el peso: no es la única señal).
- Foco siempre visible (`--g-color-focus`); el despliegue por foco nunca tapa el anillo.
- 1.4.10: nada se pierde a 320px CSS (la cara de B conserva la ruta entera a un toque); 1.4.13: la pista es la del motor.
- `forced-colors`: actual subrayado; puerta, «Subir» y divulgación con borde `ButtonText`; pastillas legibles sin fondo.
- Zoom al 200 % y texto grande: la fila pasa antes a `step`; ninguna pieza se recorta sin pista.

## Resolución de hallazgos de kiwi (r01)

| # | Resolución |
| --- | --- |
| L1 | `GBreadcrumbs`, navegación, contrato propio; principal con salida a entrada propia decidida (#490); complejo: coco y bruno en Opus |
| L2 | Props `items` y `labels`; `labels` = `nav`, `up`, `path`, `children` (sin `more`: «+N» no existe en la forma elegida); sin `id`, `to`, `router`, `separator`, umbrales, `size` ni `density` (#493) |
| L3 | Modelo `{ label, href?, icon?, children? }`; clave = índice; identidad para el movimiento = `href` o `label`; nivel sin `label`, ignorado con aviso (#493) |
| L4 | `navigate` `{ item, index, event, from }`, cancelable, solo clic primario sin modificadores; slot `link` único para todos los `<a>`, con `attrs` y `content` (#494) |
| L5 | Iconos de la librería ya existentes: `chevron-right` (separador y puerta, `flip-rtl`), `arrow-up`, `chevron-down`, `check`; sin `ellipsis`. Fila nueva en `icons.md` §4 (pendiente compartido) |
| L6 | Ningún token nuevo; constantes listadas en §«Tokens» (#501) |
| L7 | Cliente del modo visual con nombre **visible recortado**: enmienda de `tooltip.md` §«Modo visual»; también en las puertas (#496) |
| L8 | Paneles en la capa superior con #358 (1–3; la 4 se cumple sola), uno abierto, Esc sin llegar al `GDialog` (#499) |
| L9 | Medida por lotes, siguiente cuadro, fuentes, foco por nivel, primer pintado recortado (#495) |
| L10 | `aria-current="page"` siempre en el último; la ruta sin la página, reservada (#503) |
| L11 | `dir="auto"` en cada nombre; chevrons con `flip-rtl` |
| L12 | Personalidad registrada (#491) y movimiento (#500), con el quinto uso de `--g-ease-spring` acotado al `translate` |
| L13 | Regla de subir o bajar por identidad, copia saliente inerte (#500) |
| L14 | Fronteras en §«Qué es y qué no» |
| L15 | Reservas en §«Fuera de v1» (#503) |
| L16 | Pruebas en §«Verificación» |

Del resto de la base de kiwi: los puntos 9 a 11 («+N» y su orden de cesión) **no aplican** a la forma elegida; el 12 (truncado con pista), el 13 (móvil), el 14 (RTL) y el 16 (primer pintado) quedan contratados arriba.

## Límites conocidos (para el README)

- Una pastilla de 3 letras no se lee sin pasar por encima o tabular (el precio de no esconder).
- Un nivel **sin página** recortado no es enfocable: con teclado no se ve su nombre entero (sí en el árbol, con el puntero y, en `step`, en la escalera).
- Las puertas casi duplican las paradas de Tab; con `pointer: coarse` la fila cede antes.
- En `step`, ver la ruta cuesta un toque.
- Las pastillas comparten lenguaje con `GBadge` y los chips: coco debe distinguirlas (son enlaces).
- Con el slot `link`, `navigate` llega con `event.defaultPrevented` ya verdadero si el router canceló en su propio manejador (la excepción de #523 a la guarda común de `api.md`).
- **La etapa a un ancho dado depende de la métrica de la fuente** (#522): con una fuente del sistema distinta (o una de la aplicación que cargue tarde) la misma ruta puede estar en `liquid` en un motor y en `root-icon` en otro al mismo ancho (medido: Georgia a 480px, `liquid` en Chromium y `root-icon` en Firefox y WebKit). El **orden** de las etapas, el alto Δ0 y que nada salga del `nav` no dependen de ello; sí lo hace *a qué ancho* ocurre cada cambio. Una aplicación no debe fijar anchos de cabecera esperando una etapa concreta.

## Verificación (cómo se da por hecho)

### bruno (vitest + jsdom)

Props y validación; anatomía (`nav` con `aria-label`, `ol` > `li` uno por nivel, separador `aria-hidden` dentro del `li`, `span` sin página, `aria-current="page"` solo en el último, `dir="auto"` en cada nombre); avisos 1 a 9; `labels` con cadena y con función; `navigate` con su payload y `from` en los cuatro orígenes, cancelable, **no** emitido con Ctrl/⌘/Mayús/Alt; slot `link` (`attrs`, `content`, `RouterLink` simulado que navega en su propio `onClick`) y slot `icon` frente a `icon` por nombre (#202); puertas solo con `children` (no en el último), `aria-expanded`/`aria-controls`, `aria-current="true"` por `href` y por `label`; cara de B (antepasado con página, sin «Subir» si no hay) forzando la etapa; regla de L13 (entra, sale, cualquier otro cambio sin clase; nada al montar; copia saliente inerte y sin ids); SSR con `renderToString` sin globals; desmontaje sin escuchas ni observadores; `meta.json` y `src/types.test.js` (#443).

### Playwright (Chromium, Firefox, WebKit; `design/lab/theme-playground/`, **puerto propio**)

Trasladar `design/lab/breadcrumbs/r01/verificar.mjs` (A, B, C y A + B) al componente real en `tests/breadcrumbs.spec.mjs` y `tests/personalidad-breadcrumbs.spec.mjs`: etapas por ancho (1100, 720, 560, 480, 400, 320, 260, 240) en LTR y RTL sin desbordar el `nav`; **seis de seis** niveles en el árbol y en el Tab a 560 y 400px; `step` en el ancho estrecho y vuelta a la fila al ensanchar **conservando el foco**; **alto Δ0** de la raíz entre etapas (fino y `coarse`); despliegue por teclado y pista solo si ni desplegado cabe; pista a los 350 ms solo en lo recortado y en la raíz en solo icono, nunca en lo que cabe; pista de la puerta; puertas (↓ al hijo de la ruta, ↑/↓/Inicio/Fin, Esc vuelve, Tab sale y cierra, pulsar fuera cierra sin mover el foco, uno abierto a la vez); escalera (↓ al primero, actual con `aria-current`, sangría hacia el inicio lógico); `navigate` cancelado sin cambio de URL y Ctrl/⌘+clic sin evento; dentro de un `GDialog`, Esc cierra el panel y no el diálogo; `pointer: coarse` a 390px: objetivos ≥ 44 × 44; RTL (chevron `scale -1 1`, puerta −90°); bajar y subir con animación y movimiento reducido sin ella; recarga de fuente que cambia la etapa; consola limpia. **Ampliar `tests/panel-estable.spec.mjs`** con la escalera y una puerta (vaivén de ±20px sin cambio de lado; cierre al salir del visor). `tests/key-focus.spec.mjs` no aplica (los enlaces y botones ya marcan `:focus-visible`).

### coco (CSS y auditoría)

Banco con las etapas, la puerta en reposo (decisión y medida de §«Puertas»), pastillas frente a `GBadge`; contraste en claro, oscuro y un tema distinto; `forced-colors`; zoom al 200 % y 400 %; RTL; Δ0 de alto; movimiento y reducido; constantes en `design/lab/breadcrumbs/estilo.md`. Auditoría sobre el componente real en `design/lab/breadcrumbs/auditoria.md` con verificación propia en los tres motores.

### No verificado (entorno real)

Lector de pantalla real (VoiceOver, NVDA, TalkBack): la lista dentro del `nav` con `list-style: none` en Safari, «página actual» en el último enlace, la escalera y las puertas con `aria-current="true"`; táctil real (pulsación larga del motor sobre lo recortado); `forced-colors` real; IME y nombres muy largos en CJK; `RouterLink` y `NuxtLink` reales en el slot.

## Fuera de v1 (reservado) (#503)

- **«+N»** y `labels.more` (la forma elegida no lo usa).
- **La ruta sin la página** (`current: false` en el último o prop global, L10): si un producto lo pide.
- **`children` cargados al abrir** (evento de petición + estado de carga, sin `fetch`) y búsqueda dentro de una puerta larga.
- **Puerta al final** (los hijos de la página actual, «bajar») y **puertas en la escalera**.
- `density` / `size`; exponer la etapa (`stage`) como evento o slot.
- **Personalidad aplazada: el chevron que «se asoma»** (#521): al pasar por una puerta, el chevron gira un tercio hacia abajo anunciando que abre un panel y no navega. Necesitaría una constante de coreografía nueva (§29.6, #187) y decisión; reserva para la segunda tanda de personalidad (`PENDIENTES.md`). No se implementa.
- **Nunca:** separador configurable, prop `to`/router propio, `role="menu"` para los niveles, `title`, partir la fila en dos líneas.

## Encargos

### coco (Opus) · `GBreadcrumbs.css` y `defaults.css` (si hiciera falta algo; no se espera)

1. Fila con los pesos y mínimos de §«Cesión»; tope `20ch`; pastillas (`data-clipped`) y actual de acento; raíz en solo icono con el patrón de texto oculto; despliegue por `:has(> .g-breadcrumbs__link:focus-visible)` sin transición de tamaño; recorte de la lista hasta `is-ready`.
2. Cara de B con el **mismo alto** que la fila (Δ0, fino y `coarse`); escalera con sangría, guía en L y barra `accent-text`.
3. Puerta: aspecto en reposo **decidido en el banco** con las cuatro condiciones de §«Puertas»; abierta con giro y `accent-soft`.
4. Paneles en la capa superior (`display` solo bajo `:popover-open`), anchos desde `space`.
5. Movimiento de §«Movimiento» (keyframes `g-breadcrumbs-…`, `@supports` para el muelle, patrón único de reducido, nada al montar); objetivos 24/44px; `forced-colors`.
6. `design/lab/breadcrumbs/estilo.md` con las constantes, las medidas de contraste y lo que el CSS espera del `.vue`; después, la auditoría.

### bruno (Opus) · `GBreadcrumbs.vue`, pruebas, `meta.json`, registro

1. Componente con las etapas y la medida por lotes de §«Cesión» (`observeSize`, siguiente cuadro, fuentes, foco por nivel, `data-clipped`).
2. Cara de B, puertas y paneles (`placeBlock`, `stickySide`, `followFrame`, `setVar`, `anchorGone`), teclado, Esc sin llegar al diálogo, uno abierto.
3. Pistas con `useVisualTips` (`utils/visualTip.js`): un nodo por nivel, «Subir», divulgación y puerta; `disabled()` por medida; `check()` al abrir un panel.
4. `navigate` con la guarda de modificadores; slot `link` con `attrs` y `content`; slot `icon`.
5. Movimiento de subir o bajar (regla de L13, copia saliente).
6. `GBreadcrumbs.meta.json` completo (#443): props, `labels` con sus claves, `navigate` con su payload, slots `link` e `icon` con su alcance; forma de `items` y `children` en `packages/vue/types/` (`overrides.mjs` o `shared.d.ts`).
7. Registro en `src/index.js` y `components.css`; **medir el peso** y aplicar §«Entrega» (principal o entrada propia, sin volver a lima); compuertas; playground (`#sec-breadcrumbs`) con A en varios anchos, puertas, RTL y una SPA simulada que baja y sube.
8. Pruebas de §«Verificación»; lo que no cuadre con el contrato, a lima sin parche.

### mora-docs · `GBreadcrumbs/README.md` (tras la auditoría)

Desde `GBreadcrumbs.meta.json` y este contrato: forma y etapas, `labels`, router con `navigate` o con el slot `link`, puertas con `children`, fronteras con `GSidebar` y `GStepper`, límites conocidos.

## Dudas para el usuario

Ninguna. La «duda menor» de kiwi (¿la puerta se distingue del separador en reposo?) queda **delegada a coco** con condiciones (#498).
