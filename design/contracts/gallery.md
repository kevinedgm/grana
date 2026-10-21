# Contrato · GGallery y GGalleryViewer (galería con visor)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #730 a #735, #742, #744 y #745, 2026-10-21; enmienda de `dialog.md` «Visor a pantalla completa» (#732); `tokens.md` §29.6 y §52; `api.md` «Paquete, entradas y tipos», «Zona de marca», «Enlaces y `navigate`» y «Contenedor con desplazamiento») · **Basado en:** `design/lab/gallery/r01/` (kiwi, commit b32b79a: `brief.md`, `declaracion.md` con 20 decisiones de base, conceptos A/B/C, rúbrica y hallazgos G-L1 a G-L10, `index.html`, `gallery.css`, `gallery.js`, `verificar.mjs` 434/434 en Chromium, Firefox y WebKit) y el inventario `design/lab/marketing/r01/`
**Tags:** `g-gallery`, `g-gallery-viewer` · **Categoría:** marketing · **Paquete:** entrada propia **`@grana/vue/gallery`** (#742)

**Componente complejo** (compone `GDialog` y `GBtn`; teclado compuesto propio —visor, tira, hilo—; abre una capa sobre la página; gesto y estado compartido): **coco y bruno en Opus** (regla de `CLAUDE.md`).

## Promesa

Muestra las fotos de un lugar (habitación, carta, recorrido) **ordenadas por lo que se vende** y abre un visor a pantalla completa que **devuelve a la persona a la foto que estaba viendo**, **reduce antes de cerrar**, deja **la foto seguir al dedo** y **nunca pone un control encima de la foto**. Grana no pide nada: las URL las pide el navegador.

**Forma (decisión del usuario del 2026-10-21, #730):** «Galería: A “Recorrido por espacios” por defecto; B “La tira” como apariencia; C reservada.»

- **Base:** cuadrícula de miniaturas-enlace a la foto grande; visor modal (`GGalleryViewer`, sobre `GDialog`) con anuncio, teclado, gesto, zoom, foco devuelto a la foto vista.
- **A · Recorrido por espacios (por defecto cuando las fotos traen `group`):** índice de espacios con su recuento, cada espacio con su título y una portada que manda; en el visor el contador habla en el espacio («Baño · 1 de 2») y un **hilo de espacios** salta de uno a otro. Sin `group`, la galería es la base: no hay que elegir nada.
- **B · La tira (`appearance="strip"`):** la foto grande ya en la página, en una tira de alturas iguales con la proporción real; abrir el visor y cerrarlo deja la tira en la foto vista.
- **C · Se abre en su sitio: reservada** (`appearance="inline"`, «Fuera de v1»).

---

## Principios

1. **Datos de la aplicación, sin `fetch`:** cada foto trae su `src`, `alt`, `width` y `height`; el componente no pide nada.
2. **El visor es un `GDialog`** (#732): no se reescribe el modal (apilado, Esc repetida, fondo único, foco inicial #292, `topModal`).
3. **Controles fuera de la foto:** barra arriba y navegación abajo, sobre el fondo del visor; el contraste no depende de la imagen.
4. **Sin autoavance, nunca** (G-L5; WCAG 2.2.2): no existe `autoplay` ni rotación, tampoco en la tira.
5. **Mejora progresiva:** sin JS, cada miniatura es un enlace a la foto grande.

## Qué lo hace distinto (#735)

Una galería que **responde a la pregunta real** del huésped («¿cómo es el baño?») en un toque, porque se ordena por espacios, tiempos de la carta o etapas del tour; cuyo contador dice **dónde estás** («Terraza · 2 de 2») y no qué número llevas; un visor que **te devuelve a la foto que estabas mirando** (no a la que abrió), **reduce antes de cerrar** con Esc, deja la foto **seguir al dedo** y no tapa nunca la foto con un botón; y, en la tira, **un estado con dos profundidades**: ampliar y volver no te devuelve al principio, y la foto vertical del baño se ve vertical.

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| Fotos de un lugar con visor | **`GGallery`** | `GDocumentPreview` (documentos con páginas y acciones) |
| Abrir el visor desde un botón («Ver 10 fotos» en una `GCard`) | **`GGalleryViewer`** suelto con `from` = el botón | Una `GGallery` oculta |
| Una tarjeta con foto | `GCard` (y, si abre fotos, un botón con `GGalleryViewer`) | La media de `GCard` como control |
| Una galería de PDF | `GDocumentPreview` | `GGallery` |
| Pestañas de categorías | No: el índice de A **salta** (todo está en la página) | `GTabs` |
| La foto grande con su texto y precio al lado | Receta de oferta (`GCard` + `GGalleryViewer`) ahora; C reservada | — |

## Uso

```vue
<GGallery
  title="Habitación Jardín"
  :photos="fotos"            /* [{ src, thumb, width, height, alt, caption, group: 'bano' }] */
  :groups="[{ value: 'hab', label: 'Habitación' }, { value: 'bano', label: 'Baño', id: 'fotos-bano' }]"
  :labels="labels"
/>

<!-- Visor suelto desde una tarjeta -->
<GBtn ref="ver" @click="abierto = true">Ver 10 fotos</GBtn>
<GGalleryViewer v-model="abierto" v-model:index="i" :photos="fotos" title="Suite Jardín" :from="ver" :labels="labels" />
```

## Anatomía

```
section.g-gallery.g-gallery--appearance-{grid|strip}[.g-gallery--grouped]  aria-labelledby="{id}-title"
├─ div.g-gallery__head
│  ├─ h{n}.g-gallery__title#{id}-title           ← nivel por GSection (sectionKey) o headingLevel
│  ├─ p.g-gallery__total                          ← labels.total («10 fotos»)
│  └─ (B) div.g-gallery__strip-nav                ← «‹ 3 / 10 ›»: botones prev/next + p.__strip-count aria-hidden
├─ (A) nav.g-gallery__index  aria-label=labels.groups
│  └─ a.g-gallery__index-link href="#{groupId}"   ← nombre labels.groupLink («Baño, 2 fotos»)
├─ (base) ul.g-gallery__grid role=list > li.g-gallery__item > a.g-gallery__thumb
├─ (A) div.g-gallery__group#{groupId} role=group aria-labelledby > h{n+1}.g-gallery__group-title + ul.g-gallery__grid …
├─ (B) div.g-gallery__strip  aria-roledescription=labels.carousel aria-labelledby="{id}-title" tabindex="-1"
│  └─ div.g-gallery__slide role=group aria-roledescription=labels.slide aria-label=labels.position
│     ├─ a.g-gallery__thumb (tabindex itinerante)
│     └─ p.g-gallery__caption
├─ p.g-gallery__live  aria-live=polite aria-atomic=true   ← solo B (botones ‹ ›); vacía desde el montaje
└─ GGalleryViewer                                           ← dentro de la raíz, sin Teleport

a.g-gallery__thumb  href=<foto grande>  aria-haspopup="dialog"
└─ img.g-gallery__img  alt  width height  loading=lazy|eager  decoding=async

GGalleryViewer = GDialog fullscreen bare  class="g-gallery-viewer"  aria-label=labels.viewer  data-g-zone="brand"
├─ div.g-gallery-viewer__bar
│  ├─ p.__title aria-hidden          ← repetición visual del título
│  ├─ p.__count aria-hidden          ← «3 de 10» / «Baño · 1 de 2»
│  ├─ GBtn.__zoom aria-pressed       ← nombre constante labels.zoom
│  └─ GBtn.__close                   ← labels.close; llama a close() del alcance de GDialog
├─ div.g-gallery-viewer__stage       ← la foto; gesto; doble clic amplía; desplazable al ampliar
│  ├─ img.__img alt
│  └─ p.__broken                     ← labels.broken con el alt
├─ p.__caption aria-hidden
├─ div.__nav > GBtn.__prev aria-disabled · GBtn.__next autofocus aria-disabled
├─ (A) nav.__thread aria-label=labels.groups > button.__thread-item aria-current
└─ p.__live aria-live=polite aria-atomic=true
```

## Props de `GGallery` (#731)

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `photos` | Array | ver «Datos de foto» | `[]` | propia |
| `groups` | Array | `[{ value, label, id? }]` | sin valor (se derivan de `photo.group`) | propia |
| `title` | String | texto | — (**obligatoria**; aviso 1) | propia |
| `headingLevel` | Number | `2` `3` `4` | por `GSection` (`sectionKey`, #720) o `2` | propia (como `GSection`) |
| `appearance` | String | `grid` `strip` | `grid` | compartida (`appearance`; `inline` reservado) |
| `eager` | Number | entero ≥ 0 | `4` | propia (G-L7) |
| `zoom` | Boolean | | `true` | propia |
| `index` | Number | foto actual (`v-model:index`) | `0` | propia |
| `open` | Boolean | visor abierto (`v-model:open`) | `false` | propia |
| `viewerZone` | String | `brand` `none` | `brand` | propia (#733; `inverse` reservado) |
| `labels` | Object | ver «Textos» | `{}` | compartida (sin valores por defecto, #226) |
| `locale` | String | BCP 47 | `lang` del ancestro (como `GNumberField`) | compartida (cifras de los contadores) |
| `id` | String | | generado | propia |

## Props de `GGalleryViewer` (#731)

`modelValue` (Boolean, abierto), `photos`, `groups`, `index` (`v-model:index`), `title` (obligatoria: nombre del diálogo y repetición visual), `zoom`, `zone` (`brand` | `none`, nombre de `api.md` «Zona de marca»: va en su raíz, el `<dialog>`), `from` (String | HTMLElement: a quién vuelve el foco al cerrar; `GGallery` lo mantiene vivo, ver «Foco»), `labels`, `locale`, `id`. Eventos `update:modelValue`, `update:index`. `GGallery` lo usa por dentro con las mismas props; la aplicación lo usa suelto.

### Reglas de props

- **`appearance`:** `grid` es la base y, si alguna foto trae `group`, **A** (`g-gallery--grouped`): índice, espacios e hilo. Con `grid` sin grupos, cuadrícula plana. `strip` es B (los grupos no forman espacios en la tira, pero el visor sigue hablando en el espacio y lleva el hilo). `inline` avisa (reservado) y se pinta como `grid`.
- **`groups`:** fija el orden y la etiqueta de los espacios; sin ella, los espacios salen de `photo.group` en el orden de su primera aparición, con la etiqueta = el propio valor. `id` opcional da el **ancla enlazable** del espacio (`#fotos-bano` en una campaña); sin él, `{id}-g-{n}`. Una foto con un `group` que no está en `groups`: aviso 4 y va a un espacio al final con su valor como etiqueta.
- **`eager`:** cuántas miniaturas (en orden del DOM) se cargan sin `loading="lazy"`; el resto difiere. En B, la actual y la siguiente nunca difieren.
- **`index` y `open`:** con `v-model`, la aplicación los controla (abrir el visor en la foto 3 desde fuera); sin él, internos. En B, `index` es también la foto actual de la tira (un estado, dos profundidades).
- **`viewerZone`/`zone`:** ver «Tono del visor».
- **`zoom=false`:** sin botón, sin `+`/`-`, sin doble clic; el pellizco del sistema sigue.
- **Resto de atributos:** a la raíz `section` (en `GGalleryViewer`, al `<dialog>`).

## Datos de foto (G-L7)

| Campo | Tipo | Regla |
| --- | --- | --- |
| `src` | String | Foto grande (obligatorio) |
| `thumb` | String | Miniatura; sin ella, `src` |
| `srcset`, `sizes` | String | De la grande |
| `thumbSrcset`, `thumbSizes` | String | De la miniatura |
| `width`, `height` | Number | **Obligatorios** (reservan el hueco, CLS 0; aviso 2) |
| `alt` | String | **Obligatorio** (aviso 3; sin él, la foto se pinta con `alt=""` y no entra en el visor el anuncio de su texto) |
| `caption` | String | Pie visible (`dir="auto"`); no se repite en el nombre del enlace |
| `group` | String \| Number | Espacio (A) |
| `id` | String \| Number | Clave estable (sin ella, el índice) |

## Miniatura (G-L2: enlace)

- **`<a href="{src}" aria-haspopup="dialog">`** con la `img` dentro (nombre = su `alt`). El rol «enlace» es veraz: lleva a la foto. Se elige frente a `button` por la mejora progresiva (sin JS, abre la foto) y por «abrir en pestaña», «guardar» y «compartir» con clic modificado.
- **Abre el visor** con clic primario sin modificadores, sin `defaultPrevented` y sin `target` (la guarda de `api.md` «Enlaces y `navigate`», #505, aplicada a abrir en lugar de navegar; Grana llama a `preventDefault()` en ese caso), o con Intro. Con Ctrl, ⌘, Mayús, Alt o botón central, el navegador hace lo suyo. No emite `navigate` (no navega).
- Una activación por gesto (#661): el doble clic sobre una miniatura abre una vez.
- Hover solo con `hover: hover`: borde doble `border-strong`, sin `transform`.

## Visor a pantalla completa (sobre `GDialog`, #732)

- **`GDialog fullscreen bare`** (enmienda de `dialog.md`, «Visor a pantalla completa»): sin encabezado, sin relleno ni inset; el contenido llena la carcasa. El visor pone sus propios controles; el cierre llama a `close()` del alcance del slot (emite `dismiss` con `reason: 'close'`, cancelable como siempre).
- **Nombre:** `aria-label` = `labels.viewer` con `{title}` («Habitación Jardín, galería»). El título visual y el contador van `aria-hidden` (los dice el nombre y la región viva).
- **Foco inicial:** «Foto siguiente» (`autofocus`, orden de #292); con una sola foto, sin flechas y foco en «Cerrar». Intro y Espacio siguen avanzando.
- **Foco al cerrar:** a la miniatura **de la foto que se estaba viendo** (abrí la 3, vi hasta la 4: vuelvo a la 4), traída a la vista con `block: 'nearest'`. Se hace con el **`from` vivo** de la enmienda (#732): `GGallery` pasa como `from` la miniatura de la foto actual y lo actualiza en cada cambio. En B, la diapositiva actual. `GGalleryViewer` suelto: su `from`.
- **Anuncio:** `p.__live` cortés y atómica, vacía desde el montaje: al abrir y en cada cambio, `labels.announce` con `{position}` (el texto de `count` o de `groupCount`) y `{alt}` («3 de 10. Lámparas de barro junto a la cama.»); en los extremos, `labels.first` / `labels.last` («Última foto.»). Grana no añade puntuación.
- **Sin vuelta:** en la última, «siguiente» lleva `aria-disabled="true"` y **sigue enfocable** (un `disabled` real perdería el foco); igual «anterior» en la primera. Inicio/Fin saltan a propósito.
- **Página debajo inmóvil:** con el visor abierto la página no se desplaza: lo hace ya `GDialog` (`html:has(.g-dialog[open])`, límite «Navegadores» de `dialog.md`); el escenario añade `overscroll-behavior: contain` para que el desplazamiento de la foto ampliada no se encadene.
- **Error de imagen:** `p.__broken` con `labels.broken` y `{alt}` en lugar de un hueco mudo; la miniatura lleva `is-broken`.
- **Objetivos:** controles `GBtn md` (36 px) y 44 px con `pointer: coarse`; nunca < 24 px.
- **Tono del visor (#733):** la raíz del visor lleva `data-g-zone="brand"` con `zone`/`viewerZone="brand"` (por defecto: pares garantizados por el CLI y el «cuarto oscuro» con el tema por defecto, `brand` #1F1F1F). Con una marca de color (terracota, añil) el visor se tiñe: si la aplicación prefiere un visor claro, `none` (la página). Un neutro oscuro propio exige el ámbito `inverse`, **reservado** en `api.md` «Zona de marca»: cuando exista, será un valor más de esta prop, no un componente nuevo.

## Teclado (visor)

| Tecla | Acción |
| --- | --- |
| ← / → (espejo en RTL) | Anterior / siguiente; **con la foto ampliada**, recorren la foto (desplazamiento nativo) |
| Inicio / Fin | Primera / última |
| Av Pág / Re Pág | (A) Primera foto del espacio siguiente / anterior |
| `+` / `-` | Amplía / reduce (con `zoom`) |
| Esc | **Escalonado:** con la foto ampliada, la primera Esc **solo reduce** (el escenario la consume con `preventDefault()` y `GDialog` respeta `defaultPrevented`: ya contratado, sin enmienda); si no, cierra y devuelve el foco. Esc con `event.repeat`, ignorada (#565) |
| Tab | Cicla por cerrar, ampliar, anterior, siguiente y el hilo (A) sin salir |

## Gesto y zoom (G-L10)

- **Deslizar en horizontal** pasa de foto si recorre ≥ **18 %** del ancho del escenario, o ≥ **40 px** en < **250 ms**; la foto **sigue al dedo** mientras se arrastra (`--_drag-x`). **Deslizar hacia abajo** ≥ **22 %** del alto cierra (vía `close()`). Doble toque o doble clic amplía en el punto. Constantes de coreografía de **JS** (§29.6), no tokens.
- **Todo gesto tiene equivalente** de un puntero (botones) y de teclado (2.5.1, 2.5.7). `touch-action: pan-y pinch-zoom` en el escenario: el pellizco del sistema sigue.
- **Zoom ×2** centrado en el punto, recorrido con desplazamiento nativo (dedo, rueda, flechas). Sin zoom continuo propio. El botón tiene **nombre constante** `labels.zoom` y estado por `aria-pressed` (icono `zoom-in` → `zoom-out`), la misma corrección que `GDocumentPreview` (#646) frente al prototipo, que cambiaba el nombre.

## A · Recorrido por espacios

- **Índice:** `nav.g-gallery__index` con `aria-label` = `labels.groups` y **enlaces** a cada espacio (no pestañas); nombre `labels.groupLink` con `{group}` y `{count}` (String o Function para el plural); el número visible va `aria-hidden`.
- **Espacio:** `div role="group" aria-labelledby` a su `h{n+1}` (un nivel bajo el título de la galería; tope `h6`). Portada que manda: dos columnas; con cuatro fotos o más, dos filas (coco). Un espacio de una sola foto, banda ancha.
- **Visor:** el contador es `labels.groupCount` con `{group}`, `{index}` y `{total}` del espacio («Baño · 1 de 2»); **hilo** `nav.__thread` (`aria-label` = `labels.groups`) con un `button` por espacio, `aria-current="true"` en el actual; si no cabe, se desplaza dentro en una sola línea (`tabindex="-1"` en el contenedor, #570) y trae el actual a la vista.
- **Sin `group` en ninguna foto:** base (sin índice ni hilo).

## B · La tira

- APG *Carousel* **sin rotación**: región con `aria-roledescription` = `labels.carousel` y nombre = el título; cada foto `role="group"` con `aria-roledescription` = `labels.slide` y `aria-label` = `labels.position` (`{index}`, `{total}`). Sin `labels.carousel`/`labels.slide`, aviso 6 y sin `aria-roledescription` (mejor ninguno que uno en otro idioma).
- **Una sola parada de Tab** (tabindex itinerante en el enlace de la diapositiva actual); ←/→/Inicio/Fin la mueven y llevan el foco; el contenedor lleva `tabindex="-1"` (#570).
- **Alturas iguales con la proporción real** de cada foto (no recorta a cuadrado); la siguiente asoma.
- Botones ‹ › (`labels.prev`/`labels.next`) y «3 / 10» (`aria-hidden`) junto al título; **los botones anuncian** en `p.g-gallery__live`; **el desplazamiento a mano no anuncia**.
- Desplazamiento nativo con `scroll-snap` dentro de la tira; la página nunca desplaza en horizontal. La «actual» se recalcula al terminar el desplazamiento (no durante el suave propio).
- **Un estado, dos profundidades:** abrir el visor desde la tira y cerrarlo deja la tira en la foto vista (sincronía por `index`).

## Movimiento (G-L9; `tokens.md` §29)

- Foto que llega desde el lado del gesto: `translate` de `space × 6` + opacidad, **`--g-duration-press` + `--g-ease-out`**; interrumpible (clases sobre el mismo `img`, cada cambio parte del estado actual; ráfagas sin cola). Sin animación de apertura propia (la de `GDialog` en pantalla completa). Nada al montar.
- **Movimiento reducido:** la foto no se desplaza ni sigue al dedo; fundido de `--g-duration-fast`.
- **Sin `--g-ease-spring` ni `--g-ease-bounce`** (no es un uso nuevo de §29.1).

## Estados

| Estado | Galería | Visor |
| --- | --- | --- |
| Carga | Hueco reservado con `--g-color-mold` (#538) | Hueco con `mold`; precarga solo la vecina siguiente |
| Foco | Anillo `focus` en la miniatura | Anillo en el control (en la zona, el de la zona) |
| Primera / última | — | `aria-disabled`, enfocables; anuncio de extremo |
| Ampliada | — | `is-zoomed`, `aria-pressed=true`, recorrido nativo; Esc reduce |
| Arrastrando | — | `is-dragging`, la foto sigue al dedo |
| Error | `is-broken` en la miniatura | Aviso con el `alt` |
| Una foto | `labels.total` con 1 | Sin flechas; foco en cerrar |
| Vacía | No se pinta (aviso 5) | No abre |
| RTL | Orden espejado | Flechas e iconos espejados (`flip-rtl`) |
| Colores forzados | Borde `CanvasText` | Borde real; espacio actual con `Highlight` |

## Textos (`labels`; G-L6)

Marcadores con `fill` (`utils/template.js`); cifras con `Intl.NumberFormat(locale)`. Los **contados** admiten String con marcador o **Function** (plural del idioma). Sin valores por defecto (#226): falta una clave → aviso 7 la primera vez que se necesita; los botones con icono se dibujan igual (la salida es obligatoria).

| Clave | Uso |
| --- | --- |
| `total` | «10 fotos» (`{count}`; contado) |
| `count` | Contador del visor («{index} de {total}») |
| `groupCount` | Contador en un espacio (A: «{group} · {index} de {total}») |
| `position` | Nombre de la diapositiva en B («{index} de {total}») |
| `announce` | Anuncio del visor y de los botones de B («{position}. {alt}.») |
| `first`, `last` | Anuncio de extremo |
| `prev`, `next`, `close`, `zoom` | Nombres de los botones (nombre constante en `zoom`) |
| `viewer` | Nombre del visor («{title}, galería») |
| `groups` | Nombre del índice y del hilo («Espacios») |
| `groupLink` | Enlace del índice («{group}, {count} fotos»; contado) |
| `broken` | «No se pudo cargar esta foto: {alt}» |
| `carousel`, `slide` | `aria-roledescription` de la tira (B) |

## Avisos de desarrollo (`[Grana GGallery]` / `[Grana GGalleryViewer]`, una vez por instancia y motivo; guarda de #653)

1. Sin `title`.
2. Foto sin `width`/`height`.
3. Foto sin `alt`.
4. `group` que no está en `groups`; `value` repetido en `groups`.
5. `photos` vacío (no se pinta; el visor no abre).
6. `strip` sin `labels.carousel` o `labels.slide`.
7. Falta una clave de `labels` al necesitarla.
8. `appearance="inline"` (reservado).
9. `index` fuera de rango (se toma el más cercano).

## Tokens consumidos (`tokens.md` §52; ninguno nuevo)

`--g-color-surface`, `--g-color-surface-sunken`, `--g-color-bg`, `--g-color-mold`, `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-strong`, `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-*`, `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-title-sm-*` (título de la barra del visor, si coco lo elige), `--g-text-action-weight`, `--g-font-ui`, `--g-space-*`, `--g-duration-fast`, `--g-duration-press`, `--g-ease-out`. Dentro del visor (zona de marca), todo lo del grupo de color que lee está en `tokens.md` §44.5.

## Clases y datos (contrato bruno ↔ coco)

| Clase / dato | Dónde | Cuándo |
| --- | --- | --- |
| `g-gallery`, `--appearance-{grid\|strip}`, `--grouped` | Raíz | Siempre; con grupos |
| `__head`, `__title`, `__total`, `__strip-nav`, `__strip-count` | Cabecera | Según apariencia |
| `__index`, `__index-link`, `__group`, `__group-title` | A | Con grupos |
| `__grid`, `__item`, `__thumb`, `__img`, `is-broken`, `is-current` | Miniaturas | `is-current` en la de la foto actual |
| `__strip`, `__slide`, `__caption`, `__live` | B | Solo `strip` |
| `g-gallery-viewer` (en el `<dialog>`), `__bar`, `__title`, `__count`, `__zoom`, `__close`, `__stage`, `__img`, `__broken`, `__caption`, `__nav`, `__prev`, `__next`, `__thread`, `__thread-item`, `__live` | Visor | Siempre / A |
| `is-zoomed`, `is-dragging`, `is-arriving`, `data-direction` (`next` \| `prev`) | Visor | Estado |
| `--_drag-x`, `--_drag-y` (px), `--_zoom-x`, `--_zoom-y` (px, punto del zoom) | Visor | Datos del `.vue` al CSS (§29.5) |

## Peso y paquete (#742)

- **Entrada propia `@grana/vue/gallery`** (global UMD `GranaGallery`): exporta `GGallery`, `GGalleryViewer` y un plugin que registra los dos. **Tope: 12 KiB (12 288 B) gzip.** Llegan por `__shared` (#240, sin copias): `GDialog`, `GBtn`, `GLibIcon`, `sectionKey`, `utils/template.js`, `utils/liveRegion.js` (`createLiveWriter`), `utils/keyFocus.js` si lo usa, `utils/oneOf.js`. CSS en `grana.css`.
- Cuatro registros de #443; compuertas (`grep -q "g-gallery-viewer__stage"` en `grana.css`; `! grep -q "GGallery"` en `grana.js`; `test -f dist/gallery.js`).

## `meta.json` y tipos (#443)

Las dos piezas con props, eventos (`update:index`, `update:open` / `update:modelValue`), slots (ninguno en v1: el texto llega por datos) y la forma de `photos`/`groups`/`labels` en `overrides.mjs`.

## Verificación (bruno; base: `design/lab/gallery/r01/verificar.mjs`)

- **vitest:** enlaces con `href` y `aria-haspopup`; guarda de modificadores; `eager`; grupos derivados y fijados, anclas; `GDialog` con `fullscreen bare` y `aria-label`; foco inicial; anuncios con `announce`, extremos; sin vuelta; Esc escalonado (consumida por el escenario); `from` vivo hacia la miniatura de la foto actual; teclado (RTL, Inicio/Fin, Av Pág/Re Pág en A, `+`/`-`); tira con tabindex itinerante y contenedor `tabindex="-1"`; sincronía tira ↔ visor; avisos 1 a 9; SSR.
- **Playwright (tres motores):** Tab atrapado; foco devuelto a la foto vista; gesto con puntero (pasar y cerrar); movimiento reducido; contraste del visor dentro de la zona; sin autoavance; sin desplazamiento horizontal a 1440, 390, 320 y 320×256; controles ≥ 44 px con `pointer: coarse`; la página no se desplaza con el visor abierto; `forced-colors` (Chromium).

## Fuera de v1 (reservado con nombre)

- **C · Se abre en su sitio** (`appearance="inline"`, labels `fullscreen`, `closeDetail`, slot de detalle).
- `autoplay` **no existe** (G-L5): no se reserva.
- Tono `inverse` del visor (cuando exista el ámbito, #733).

## Límites conocidos (para el README)

- Sin JS, el enlace abre la foto (no hay visor).
- Lector real (región viva, `aria-roledescription`, `aria-haspopup` en un enlace), gesto táctil real, fotos reales y `forced-colors` en Firefox/WebKit: no verificados en la ronda.

## Resolución de hallazgos de kiwi (G-L1 a G-L10)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| G-L1 | Nombre y entrada | `GGallery` + `GGalleryViewer` exportable; `@grana/vue/gallery`, tope 12 KiB (#731, #742) |
| G-L2 | Enlace o botón | **Enlace** con `aria-haspopup="dialog"` y la guarda de #505 (#731) |
| G-L3 | Visor sobre `GDialog` | **Enmienda** de `GDialog`: `bare` y `from` vivo; el Esc escalonado ya cabe en el contrato (descendiente que consume Esc) (#732) |
| G-L4 | Tono del visor | Zona de marca por defecto; `none` como opción; `inverse` reservado (#733) |
| G-L5 | Sin autoavance | Por contrato; no existe la prop (#731) |
| G-L6 | Textos | Tabla «Textos», sin valores por defecto (#731) |
| G-L7 | Datos de foto | Tabla «Datos de foto»; `eager` 4 (#731) |
| G-L8 | Iconos | `chevron-left`, `chevron-right`, `x`, `zoom-in`, `zoom-out`, `image` ya en la lista; **ninguno nuevo** (`maximize-2` era de C, reservada) (#744) |
| G-L9 | Movimiento | `press` + `ease-out`; reducido `fast` (#734) |
| G-L10 | Umbrales del gesto | Constantes de JS en §29.6 (#734) |

## Encargos

- **coco (Opus):** `GGallery.css` (cuadrícula, portada de A, índice, tira de B, visor: barra, escenario con `overscroll-behavior: contain`, navegación, hilo; llegada y arrastre; reducido; forzados; dentro de la zona); auditoría con temas de marca de color (G-L4).
- **bruno (Opus):** `GGallery.vue` y `GGalleryViewer.vue` sobre `GDialog` con la enmienda #732 (que hace él en `GDialog.vue`), gesto, zoom, `from` vivo, tira, anuncios; pruebas; `meta.json`; entrada `@grana/vue/gallery`; compuertas; playground y spec.
