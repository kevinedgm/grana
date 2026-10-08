# Contrato · GAccordion + GAccordionItem

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #475 a #488, integradas el 2026-10-07; cambios en archivos compartidos aplicados, rastro en `design/contracts/accordion.pendientes.md`; tokens en `tokens.md` §40) · hecho y `candidate` (auditoría de coco, `design/lab/accordion/auditoria.md`); remates del contrato tras la auditoría en #515 a #519 (2026-10-08, «Remates tras la auditoría» al final) · **Basado en:** `design/lab/accordion/r01/` (kiwi, commit 5f90973: `brief.md`, `declaracion.md` con hallazgos L1 a L14, `accordion.js`, `verificar.mjs` 184/184 en Chromium, Firefox y WebKit, puerto 4214)
**Tags:** `g-accordion`, `g-accordion-item` · **Categoría:** contenido (divulgación) · **Paquete:** `@grana/vue` (principal; #476)

Un grupo de **secciones plegables de contenido** (preguntas frecuentes, paneles de detalles, ajustes que se aplican al momento) y su elemento, que también se usa **suelto** como sección plegable de una pieza (APG *Disclosure* con encabezado). No es una sección de formulario: plegar **preguntas de un formulario** es `GFormSection mode="collapsible"` (`form.md` §3).

**Forma (decisión del usuario del 2026-10-07, #475):** **A «Avance»** por defecto (el encabezado cerrado enseña la primera línea de la respuesta o el estado de los ajustes; al abrir esa línea no se mueve y el resto se desenrolla) **+ el encabezado pegado de B como opción** (`sticky`, solo con la prop). **B «Hilo»** completo y **C «Índice»** quedan **reservados** (`layout="thread"`, `layout="index"`).

---

## Principios

- **APG primero.** `hN > button[aria-expanded][aria-controls]`; sin `<details>` (kiwi r01 §2, medido en los tres motores). Tab pasa por todos los encabezados; las flechas son un atajo opcional, no *roving*.
- **Lo plegado sigue en la página.** El contenido está montado siempre (salvo `lazy`), y plegado y asentado es `hidden="until-found"`: Ctrl+F, un `#id` de dentro y un `#:~:text=` lo encuentran y lo abren; la impresión lo saca entero.
- **El encabezado que tocas no se mueve** (Δ0): rasgo de la pieza, no opción.
- **Grana presenta y emite intención.** El grupo no sabe qué hay dentro; la aplicación decide qué está abierto con `v-model` y escribe el avance. Sin `fetch`, sin textos por defecto (no hay `labels`: el componente no tiene textos propios).
- **Sin tokens del tema nuevos.** Una sola **propiedad pública de entrada** (`--g-accordion-sticky-top`, no es del tema; #484).
- **Iconos solo Lucide** por el `GIcon` interno (`chevron-right`, ya en la lista de la librería; `icons.md`).

## Cuándo usarlo (frontera)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Preguntas frecuentes, detalles secundarios, ajustes agrupados que se aplican al momento | **`GAccordion`** con `GAccordionItem` | `GTabs` (solo un panel en la página), `<details>` a mano |
| Una sola sección plegable suelta («Ver condiciones») | **`GAccordionItem`** sin grupo, con `v-model:open` | `GCard expandable` (eso divulga una parte de una tarjeta, sin encabezado propio) |
| Plegar **preguntas de un formulario** (sus datos se envían, su estado de errores se ve plegada) | **`GFormSection mode="collapsible"`** (`form.md` §3) | `GAccordion` dentro de `GForm` con campos (avisa, #486) |
| Campos que dependen de una respuesta | `GFormReveal` (`form.md` §14) | `GAccordion` |
| Navegar entre vistas hermanas donde solo se ve una | `GTabs` | `GAccordion exclusive` como pestañas verticales |
| Submenú de navegación | `GSidebar` | `GAccordion` en una barra lateral |
| Muchas preguntas cortas en columnas (índice) | Reservado: `layout="index"` (C, #475) | — |

---

## `GAccordion` (grupo)

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Array | arreglo de `value` (String \| Number) | `undefined` (no controlado: estado local que parte de `[]`) | propia (#478) |
| `exclusive` | Boolean | | `false` | propia: uno a la vez (#478) |
| `headingLevel` | Number | 2 a 6 | `3` | propia (como `GCard`, `GWidget`, `GForm`) |
| `arrows` | Boolean | | `true` | propia: ↓/↑/Inicio/Fin entre encabezados (APG, opcional; #481) |
| `sticky` | Boolean | | `false` | propia: el encabezado de un elemento abierto se queda arriba mientras se lee su contenido (de B; #484) |

**No existen en v0.1** (no se declaran en `meta.json`): `layout` (reservado: `list` sería el actual, `index` = C, `thread` = B; #475), `labels` (no hay textos propios), `disabled` de grupo, `density`, `variant`, `color`, `multiple` (lo contrario de `exclusive`, ya es el defecto).

### Reglas de props

- **`modelValue`** (#478): arreglo de los `value` abiertos, **en orden del documento** (no de apertura: el modelo no depende de la historia). `null`/`undefined` cuentan como `[]` sin aviso; otro valor que no es arreglo, como `[v]` con aviso 1. **Controlado y no controlado** como `GFormSection`: estado local que parte de la prop y la sigue; sin `v-model`, el grupo funciona solo. Para abrir algo al principio sin escuchar, `:model-value="['envio']"`.
- **Valores sin elemento** (un `value` del modelo que ningún elemento montado tiene): **se conservan** al final, en su orden, porque el elemento puede montarse después (lista asíncrona, `v-if`). Abrir con `exclusive` los quita (el modelo pasa a `[v]`).
- **`exclusive`** (#478): el modelo tiene longitud 0 o 1; **todo cerrado es válido** (el abierto se puede cerrar; nunca `aria-disabled` en el abierto). Si el modelo llega con más de un valor, se abre **solo el primero en orden del documento**, aviso 2, **sin emitir** (emitir en respuesta a una prop puede crear un bucle; la aplicación corrige su modelo). Lo mismo si `exclusive` pasa a `true` con varios abiertos.
- **`headingLevel`**: nivel por defecto de los encabezados de sus elementos (el del elemento gana).
- **`sticky`**: ver «`sticky`: el encabezado que acompaña» (#484).
- **Anidar grupos**: un `GAccordion` dentro del panel de un elemento es otro grupo con su propio modelo, sus flechas y su `exclusive`. Un `GAccordionItem` pertenece al **`GAccordion` más cercano por encima sin un elemento entre medias**: cada elemento vuelve a proveer la clave del grupo como `null` a su contenido, así un elemento suelto dentro del panel de otro no se une al grupo exterior.

### Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `Array` (copia nueva, orden del documento) | Cada vez que cambia lo abierto por el usuario (clic, Intro, Espacio, clic en el avance), por la búsqueda de la página (`beforematch`), por un `#id` y por una petición de abrir (`OPEN_REQUEST`). **No** cuando el cambio llega desde `modelValue`. |

### Slots

| Slot | Props | Contenido |
| --- | --- | --- |
| por defecto | — | Los `GAccordionItem` (directos o dentro de `v-for`/`<template>`; un envoltorio de la aplicación entre medias funciona, pero el CSS de separadores de coco puede no alcanzarlo: receta del README) |

### Estructura

```html
<div class="g-accordion [g-accordion--exclusive] [g-accordion--sticky]">   <!-- sin rol: APG no lo pone al conjunto -->
  <!-- GAccordionItem … -->
</div>
```

Atributos y escuchas no declarados van a la raíz.

---

## `GAccordionItem` (elemento; suelto = sección plegable)

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `value` | String \| Number | | `undefined` (= el `id` efectivo) | propia: identidad en el modelo del grupo |
| `id` | String | | `undefined` (generado con `useId()`) | propia: ancla del elemento (`#id`, #482) y base de los `id` internos |
| `title` | String | | `undefined` | propia: texto del botón (o slot `title`) |
| `meta` | String | | `undefined` | propia: dato corto **dentro** del botón, forma parte del nombre (o slot `meta`) |
| `peek` | String | | `undefined` | propia, A «Avance» (#483): la primera línea de la respuesta o el estado del grupo (o slot `peek`) |
| `disabled` | Boolean | | `false` | propia: `aria-disabled`, enfocable, no cambia (#481) |
| `lazy` | Boolean | | `false` | propia: el contenido se monta al abrir por primera vez y no se desmonta (#480) |
| `headingLevel` | Number | 2 a 6 | `undefined` (el del grupo; suelto, `3`) | propia |
| `open` | Boolean | | `false` | propia: **solo suelto**, `v-model:open` (controlado y no controlado, como `GFormSection`). Dentro de un grupo se ignora (aviso 5) |

**No existen en v0.1:** `icon` y slot `lead` (icono al inicio del título; **`lead` reservado** con la forma de `GFormSection`: dentro del botón, decorativo), `variant`, `color`, `size`, `density`, `summary` (es `peek`), `description`, `index`/`num` (de C, reservado).

### Reglas de props

- **Nombre del botón** = `title` (o slot `title`) + `meta` (o slot `meta`), en ese orden, dentro del botón. Sin ninguno de los dos: aviso 4 (un botón sin nombre).
- **`meta`** es texto corto **no interactivo** («Disponible tras tu primera cita», «3 activas»): explica, por ejemplo, por qué un elemento está deshabilitado. Algo interactivo en `title` o `meta` avisa (aviso 6): los hijos de un botón son presentacionales.
- **`value`**: dentro de un grupo con `v-model`, un elemento sin `value` ni `id` usa el id generado, que la aplicación no conoce (aviso 10). Dos elementos del mismo grupo con el mismo `value` se abren y cierran juntos (aviso 3 del grupo).
- **`id`**: el `id` de la raíz del elemento. Los internos derivan de él: `{id}-toggle`, `{id}-content`, `{id}-peek`. Un `id` repetido en el documento avisa (aviso 9).
- **`open`** (suelto): estado local que parte de la prop y la sigue; emite `update:open` en los mismos casos que el grupo emite `update:modelValue`.
- **`disabled` y abierto a la vez** (el modelo lo incluye): se pinta abierto y no se puede cerrar desde el botón; la aplicación lo cierra con el modelo.

### Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:open` | `Boolean` | **Solo suelto**, en los mismos casos que `update:modelValue` del grupo. Dentro de un grupo no se emite (un solo origen: el modelo del grupo). |

### Slots

| Slot | Props | Dónde | Contenido |
| --- | --- | --- | --- |
| `title` | `{ open }` | Dentro del botón | Texto del título (sin interactivos) |
| `meta` | `{ open }` | Dentro del botón | Dato corto (sin interactivos) |
| `peek` | `{ open }` | Debajo del encabezado, fuera del botón | Avance de A: texto en línea; con slot, la aplicación garantiza una línea con sentido (sin interactivos, aviso 7) |
| `actions` | `{ open }` | En la fila del encabezado, **fuera** del `hN` | Acciones del grupo («Restablecer»): `GBtn` u otros controles; nunca dentro del botón |
| por defecto | — | Contenido | Lo que se pliega |

### Estructura accesible (#477)

```html
<div class="g-accordion-item [is-open] [is-animating] [is-instant] [is-ready] [is-disabled] [is-standalone]
            [has-peek] [has-actions]" id="ID">
  <h3 class="g-accordion-item__heading">                       <!-- headingLevel; siempre hay encabezado -->
    <button type="button" class="g-accordion-item__toggle" id="ID-toggle"
            aria-expanded="false" aria-controls="ID-content"
            [aria-disabled="true"] [aria-describedby="ID-peek"]>  <!-- describedby solo cerrado y con avance -->
      <span class="g-accordion-item__title" dir="auto">…</span>
      <span class="g-accordion-item__meta" dir="auto">…</span>   <!-- solo con meta -->
      <span class="g-accordion-item__chevron" aria-hidden="true"><!-- GLibIcon chevron-right --></span>
    </button>
  </h3>
  <div class="g-accordion-item__actions">…</div>               <!-- solo con slot actions -->
  <div class="g-accordion-item__peek" id="ID-peek" dir="auto">…</div>   <!-- solo con peek; misma celda que el panel -->
  <div class="g-accordion-item__panel" [inert]>                <!-- rejilla 0fr → 1fr; inert SOLO mientras se cierra -->
    <div class="g-accordion-item__content" id="ID-content"
         [role="region" aria-labelledby="ID-toggle"]           <!-- regla de APG, abajo -->
         [hidden="until-found"]>                               <!-- plegado y asentado -->
      <div class="g-accordion-item__body">…</div>              <!-- slot; vacío hasta el primer abrir si lazy -->
    </div>
  </div>
</div>
```

- **`hN > button`** (APG *Accordion*; suelto, APG *Disclosure* con encabezado). Nada interactivo dentro del botón. `aria-expanded` siempre (`"true"`/`"false"`), `aria-controls` → `__content`.
- **`role="region"` con `aria-labelledby` → botón** en `__content` (no en el panel animado), **automático**: en un grupo con `exclusive` o con **≤ 6** elementos; sin rol con 7 o más que pueden estar abiertos a la vez (proliferación de regiones, APG). Suelto: siempre región. Sin prop para forzarlo (L6).
- **Avance** (`__peek`): `aria-describedby` del botón **solo cerrado** (abierto, el avance no se ve y el contenido ya está). Elemento `div` (admite el contenido en bloque de un slot sin romper la hidratación), `dir="auto"`. Visualmente una línea con puntos suspensivos; el lector recibe el texto entero (el recorte es solo de pintura).
- **Chevron** al **final** del botón en A (el ojo empieza por la pregunta), `chevron-right`: gira a abajo abierto y se espeja en RTL (#71), decorativo.
- **`__actions`** en la misma fila que el encabezado, después del `hN` en el DOM (orden de lectura: título → acciones → contenido).
- **SSR:** se pinta según el modelo: plegado con `hidden="until-found"` desde el primer HTML (la búsqueda funciona antes de hidratar), abierto sin él; sin `inert`, sin `is-ready`, sin leer el fragmento. **Atención (bruno):** Vue trata `hidden` como atributo booleano; hay que escribirlo como atributo (`^hidden`/`.attr`) y **comprobar con `renderToString`** que sale `hidden="until-found"` y no `hidden` a secas. Si el servidor lo serializa como booleano, el `.vue` lo corrige al montar (`setAttribute('hidden', 'until-found')` en los plegados) y el límite («antes de hidratar, lo plegado no se encuentra») va al README.

---

## Plegado, búsqueda, anclas e impresión (#480, #482)

### Estados del panel

| Estado | `is-open` | `__panel` | `__content` |
| --- | --- | --- | --- |
| Abierto (y abriéndose) | sí | sin `inert` | sin `hidden` (sale en el **mismo parche** que entra `is-open`) |
| Cerrándose (`is-animating`) | no | **`inert`** (no se enfoca lo que se va) | sin `hidden` |
| Plegado y asentado | no | sin `inert` | **`hidden="until-found"`** |

- **Sin `visibility: hidden` en el panel** (difiere de `GFormSection` hoy): con un antepasado `visibility: hidden`, `#:~:text=` no encuentra el texto aunque el contenido sea `until-found` (medido por kiwi). Regla para coco.
- **`beforematch`** en `__content` (la página encontró texto: Ctrl+F, `#:~:text=`, un `#id` de dentro; el navegador ya quitó `hidden`): el elemento se abre **en el acto** (`is-instant`), sin compensación Δ0, y emite. En `exclusive`, los otros se cierran también **sin animar** (si el de encima se cerrara animando, la coincidencia se movería bajo el resaltado). Criterio: la coincidencia queda a la vista en los tres motores.
- **Navegador sin `until-found`:** el atributo cae en `hidden` normal (plegado, no encontrable); todo lo demás funciona igual.

### Abrir antes de enfocar (`OPEN_REQUEST`, #287)

`__panel` escucha el evento interno `g-open-request` (constante `OPEN_REQUEST`, la de `GFormSection`). Si el elemento está plegado: abre con `is-instant` en el mismo parche, emite y llama a `preventDefault()`; quien la despachó espera un `nextTick` y enfoca. No detiene la propagación (los anidados se abren todos). **En `exclusive`, dentro del mismo tick solo se atiende la primera petición** que llega al grupo (aunque su elemento ya estuviera abierto); las siguientes no abren ni se cancelan. Así `GForm`, que despacha una petición por cada error y enfoca el primero, no cierra el elemento que contiene el foco al abrir el siguiente.

### Contenido montado y `lazy`

Contenido **montado siempre** (búsqueda, anclas, impresión, estado de lo que hay dentro), como `GFormReveal`. **`lazy`**: se monta al abrir por primera vez (por cualquier vía) y **no se desmonta** al cerrar (kiwi midió 1 montaje tras abrir-cerrar-abrir). Límites (README): lo `lazy` sin abrir no se encuentra, no se imprime, un `#id` de dentro no existe y no recibe `OPEN_REQUEST`.

### Foco

- **Abrir no mueve el foco.**
- **Plegar con el foco dentro** (solo puede pasar por programa: modelo, `exclusive` desde otro sitio): el foco va al botón del elemento **antes** de aplicar `inert`, con `preventScroll` (nunca a `<body>`, 2.4.3).

### `#id` del elemento (#482)

- Al montar y en `hashchange`, si el fragmento (decodificado) es el `id` de un elemento: lo abre **sin animar** (sin Δ0) y lo trae a la vista con el encabezado arriba (`scrollIntoView({ block: 'start' })`, que respeta el `scroll-padding` de la aplicación, #515). **No mueve el foco** (la navegación a fragmento ya fija el punto de partida de Tab). Un `#id` de **dentro** lo resuelve el navegador por `beforematch`.
- **Reaplicado en `load`** (#519): si el elemento se montó durante la carga (`document.readyState !== 'complete'`), se trae a la vista **otra vez** en `load` y, si las fuentes aún no han cargado, una vez más al resolverse `document.fonts.ready` **solo si la persona no ha desplazado** (`scrollY` igual). Como hace el navegador con un fragmento: lo que se pinta encima (una imagen sin tamaño, la fuente) lo mueve, y el grupo no participa del anclaje de desplazamiento (`overflow-anchor: none`). Medido con una imagen de 200 px que llega 700 ms tarde: el botón queda a 47,7 / 47,7 / 48,3 px de una cabecera de 48 px.
- El componente **lee** el fragmento, nunca lo escribe; para tener el estado en la URL, la aplicación usa `v-model`.
- **Una sola escucha de `hashchange`** compartida por todos los elementos, que se pone con el primer elemento montado y se quita con el último (sin efectos en el nivel superior del módulo, #444).

### Impresión (L13; CSS de coco, sin API)

Todo abierto: rejilla a `1fr`, `__content[hidden]` con `content-visibility: visible` (Chromium y WebKit no imprimen un `until-found`; Firefox sí), sin chevron, avance ni acciones, encabezado sin pegar y `break-after: avoid`. No se tocan el estado ni el modelo. Lo `lazy` sin abrir no sale.

---

## Teclado, deshabilitado y Δ0 (#481)

### Teclado

| Tecla | Con el foco en un encabezado del grupo | Efecto |
| --- | --- | --- |
| Tab / Mayús+Tab | Cualquiera | Pasa por **todos** los encabezados y por lo enfocable de los abiertos (no es *roving*). Lo plegado y asentado no está en el orden (`hidden`); lo que se cierra, tampoco (`inert`) |
| Intro / Espacio | Encabezado | Abre o cierra (el botón) |
| ↓ / ↑ | Encabezado de **este** grupo (`arrows`) | Al encabezado siguiente / anterior, **sin vuelta** al otro extremo; incluye los deshabilitados |
| Inicio / Fin | Ídem | Primer / último encabezado del grupo |

Las flechas solo actúan con el foco **en un botón de un elemento de este grupo** (nunca dentro de un panel, nunca en un grupo anidado: lo resuelve el grupo más cercano) y sin Alt/Ctrl/⌘. Las flechas no cambian en RTL (eje de bloque). Un elemento suelto no tiene flechas.

### Deshabilitado

`aria-disabled="true"` (sin `disabled` nativo): sigue enfocable y las flechas lo alcanzan (se puede leer el `meta` que explica por qué), no abre ni cierra por clic, teclado ni avance; `is-disabled`; título en `text-subtle` (≥ 4,5:1 medido por coco). La búsqueda de la página (`beforematch`), un `#id` y `OPEN_REQUEST` **sí** lo abren: el contenido existe y quien llega de fuera debe verlo; el botón sigue deshabilitado.

### Δ0: el encabezado que tocas no se mueve (L7)

Comportamiento del componente, no opcional, en grupo y suelto:

1. Cuando el usuario cambia un elemento (clic en el botón o en el avance, Intro, Espacio), el componente mide el borde superior del **encabezado tocado** antes del cambio y, en cada cuadro mientras dura el movimiento (duración calculada del panel con el cambio aplicado + 80 ms), desplaza **su contenedor de desplazamiento** lo que se haya movido (≥ 0,5 px), en el mismo cuadro, antes de pintar. Criterio: **≤ 1 px por cuadro** en los tres motores (kiwi: 0,5 px Chromium y Firefox, 0,9 px WebKit; sin compensar, 336 px).
2. **Contenedor de desplazamiento y cadena** (#519): el antepasado desplazable más cercano en el eje de bloque o, sin él, `document.scrollingElement`. Si ese contenedor **no puede desplazarse más** en el sentido que hace falta (está en su tope), o un antepasado se movió por su propio anclaje al encogerse el de dentro, la compensación **sigue con el siguiente contenedor hacia fuera** hasta el documento, recalculando lo que falta tras cada uno. Medido con el contenedor arriba del todo y el documento compensando 360 px: Δ ≤ 0,92 px en los tres motores.
3. El grupo (y el elemento suelto) llevan **`overflow-anchor: none`** para que el navegador no compense dos veces (coco).
4. **Se cancela** si el usuario desplaza durante el movimiento (`wheel`, `touchstart`, teclas de desplazamiento): no se pelea con quien desplaza.
5. **Sin compensación** cuando el cambio no lo tocó el usuario: `modelValue` desde la aplicación, `beforematch`, `#id`, `OPEN_REQUEST`.
6. **Cerrar con el principio del elemento por encima de la vista** (solo puede ocurrir con `sticky`): cierre **instantáneo** y el encabezado se queda donde estaba (#484).
7. **Límite** (README, como `form.md` §14): sin página debajo para conservar el desplazamiento, el navegador lo recorta.
8. **Límite aceptado: un desplazamiento ajeno dentro de la ventana** (#519, hallazgo 6 de la auditoría). Durante la ventana (duración + 80 ms, ≈ 320 ms) la compensación deshace un desplazamiento que **no** llegue por rueda, toque ni teclas de desplazamiento: **arrastrar la barra de desplazamiento** (no emite `wheel`) o un `scrollTo` de la aplicación justo después del clic. No se corrige en v0.1: es corto y raro, y cancelar por `pointerdown` no es fiable entre motores (la barra no siempre emite eventos de puntero en el elemento). Mejora opcional para bruno si alguien lo reporta: cancelar cuando la posición observada no es la que dejó la propia compensación. Va a los límites del README.

La compensación es una función del motor compartido (`keepInPlace`, «Motor de plegado compartido»), la usa solo el acordeón en esta entrega.

---

## Personalidad: A «Avance» (#475, #483; decisión del usuario del 2026-10-07)

### A1 · Un encabezado cerrado no es mudo

- Con `peek` (o slot `peek`), debajo de la pregunta va **una línea** con la primera línea de la respuesta (preguntas frecuentes) o el estado del grupo (ajustes: «Correo y push · resumen semanal»), con puntos suspensivos, en `text-muted`. La escribe **la aplicación** (no hay `peek="auto"`: leer el primer párrafo del slot rompe el SSR y es frágil, L12). Receta del README: el mismo texto que el primer párrafo de la respuesta, para la continuidad.
- **Clic en el avance** (cerrado): abre como el botón (puntero; el teclado ya tiene el botón; sin rol ni `tabindex` en el avance). No abre si el clic termina una selección de texto (`getSelection()` no colapsada). Abierto, el avance no se ve ni recibe clics. Deshabilitado, no abre.
- En ajustes, el avance **sigue al estado** (la aplicación lo recalcula; kiwi midió que cambia al tocar el interruptor de dentro).

### A2 · La línea que no se mueve

- El avance ocupa **la misma celda** que el panel y la misma tipografía que el primer párrafo del contenido (`body`). Al abrir: el contenido nace en esa celda, la primera línea ya está entera antes de la mitad del fundido, el avance se funde **encima** (mismo texto, mismo sitio; solo se van los puntos suspensivos) y el resto se desenrolla debajo; el color del contenido pasa de `text-muted` a `text` durante la altura. Al cerrar, **la línea no desaparece** (#518): el avance vuelve **en el acto**, por debajo del contenido que se funde (fundido cruzado), en vez de esperar a que el panel casi se haya ido (a mitad del plegado la respuesta de una línea quedaba al 35 %).
- **Criterio:** la línea del avance y la primera línea del contenido, **Δ ≤ 1 px** durante toda la apertura y el cierre en los tres motores; primera línea entera antes de la mitad del fundido (kiwi: 30–49 ms); **presencia de la línea ≥ 0,9 al abrir y ≥ 0,6 al plegar** en todos los cuadros (coco midió 0,92 a 0,97 en los dos sentidos; #518).
- El primer hijo de `__body` no lleva margen superior (coco; con la regla de nodos hermanos de `GTooltip`, #383: el selector ignora `.g-tooltip`).

### Movimiento

- **Altura:** rejilla `0fr → 1fr` en `--g-duration-slow` con `--g-ease-out` (#278, #280), sin medir alturas. **Avance:** opacidad en `--g-duration-fast` lineal con retrasos derivados de `fast`/`slow`. **Color del contenido:** `--g-duration-slow` lineal. **Chevron:** giro en `--g-duration-fast` con `--g-ease-out`, como `GFormSection` (mismo disparador).
- **Chevron al pasar el puntero** (con `(hover: hover)`): se asoma `--g-space-1 × 0.5` hacia el lado al que va (abajo cerrado, arriba abierto) en `--g-duration-fast` con `--g-ease-out`, y toma `text`; es la constante de coreografía existente de §29.6 (tope de `GNumberField`, #313), **sin valor nuevo** (#518). Con movimiento reducido, solo el color.
- **Sin muelle ni rebote** en A (#299: nunca en paneles ni desplazamientos de bloques).
- **`is-ready`** tras el primer pintado (no se anima lo que ya viene abierto, plan 012); **`is-instant`** para abrir por búsqueda, `#id` u `OPEN_REQUEST` y para el cierre instantáneo de `sticky` (se retira tras dos cuadros).
- **Movimiento reducido** (patrón único, #299): sin altura que se mueva ni giro; **solo fundido** del contenido (`--g-duration-fast`) y del avance; asienta plegado igual (`until-found` al terminar).
- Nada supera 240 ms (#71).

## `sticky`: el encabezado que acompaña (de B; #484)

- Con **`sticky`** en el grupo, el encabezado (`__heading`) de un elemento **abierto** se queda pegado arriba mientras se lee su contenido (`position: sticky` dentro de su elemento; deja de pegarse al terminar el elemento). Solo con la prop; sin ella, nunca.
- **Distancia de pegado: `--g-accordion-sticky-top`** (propiedad pública de entrada; longitud; la aplicación la pone en `:root`, en un contenedor o en el grupo; **no es del tema**). El encabezado y las acciones se pegan a esa distancia del borde superior del contenedor de desplazamiento. **Es solo eso** (#515): el componente no la usa para ningún `scroll-margin`.
- **La cabecera fija de la aplicación se cuenta una sola vez, y es de la aplicación** (#515, enmienda de #484): Tab, un `#id`, `scrollIntoView` y la búsqueda de la página respetan el `scroll-padding-block-start` del contenedor de desplazamiento y **suman** el `scroll-margin` del elemento; si el componente también lo pusiera, la cabecera se contaría dos veces (medido: `#f-pago` a 96 px con una cabecera de 48, y 48 px de hueco sobre `#p2-deep`). Por eso **ni el botón ni la raíz del elemento llevan `scroll-margin-block-start`** (con o sin `sticky`), y la aplicación pone **una vez** el alto de su cabecera con la misma variable en las dos propiedades. Receta del README: `:root { --app-header: 56px; --g-accordion-sticky-top: var(--app-header); scroll-padding-block-start: var(--app-header); }`; sin `sticky`, basta el `scroll-padding` (como para cualquier ancla de la aplicación). Dentro de un contenedor propio con desplazamiento, las dos en ese contenedor. Sin esa receta, un `#id` o el foco pueden quedar bajo la cabecera de la aplicación: es su cabecera.
- **Cerrar desde el encabezado pegado** (el principio del elemento ya está por encima de la vista): cierre **instantáneo**, el encabezado no se mueve (Δ ≤ 1 px) y lo siguiente aparece debajo: cerrar no te manda al final de lo que leías.
- **Foco no tapado (WCAG 2.4.11):** con `sticky`, lo enfocable del contenido de un abierto (y un `#id` de dentro, en **todos** los elementos del grupo `sticky`, no solo en el abierto: el destino llega antes de que el `.vue` abra el elemento por `beforematch`) lleva `scroll-margin-block-start: var(--_head-size)`: el alto del encabezado pegado propio (px, que el `.vue` escribe en el elemento abierto con el `ResizeObserver` compartido, escrituras en rAF y solo si cambian, #173; el CSS pone antes una estimación de una línea de título). Sumado al `scroll-padding` de la aplicación, el control queda justo bajo el encabezado pegado. Criterio: con Mayús+Tab hacia arriba dentro de un abierto, el control enfocado queda entero a la vista en los tres motores.
- **Receta de `focusin` (2.4.11 en WebKit, #517):** WebKit **no** desplaza un control que ya asoma por debajo del encabezado pegado (Chromium y Firefox sí, con el `scroll-margin`). El `.vue` lo resuelve en el grupo `sticky`: `focusin` en el contenido de un abierto de **este** grupo → si `target.top < encabezado.bottom`, `target.scrollIntoView({ block: 'nearest' })` (WebKit sí respeta `scroll-margin` y `scroll-padding` ahí). Medido en los tres motores: de 83,7 a 95,7 px con el encabezado acabando en 96 px.
- **Dentro de un contenedor de desplazamiento que no es el documento** (#517): `position: sticky` se pega al borde del **relleno** de su contenedor. El `.vue` escribe en la raíz del grupo `sticky` el dato **`--_scroll-pad`** (px: `padding-block-start` calculado del contenedor de desplazamiento, el mismo antepasado que usa `keepInPlace`; `0` o sin escribir si es el documento; al montar y al abrir un elemento; rAF y solo si cambia, #173) y el CSS lo resta de la distancia de pegado (`sticky-top − --_scroll-pad`), así el encabezado se pega al borde del contenedor y el texto no pasa por encima en la franja del relleno (medido en `GDialog`: 0 px). **Dentro de `.g-dialog__body`, `GAccordion.css` pone `--g-accordion-sticky-top` a 0**: el cuerpo es otro contenedor de desplazamiento y la cabecera fija de la aplicación no lo tapa. Si el diálogo tiene su propia cabecera dentro del cuerpo, la aplicación vuelve a ponerla (sobre el grupo, que está más cerca que el cuerpo).
- **`sticky` anidado** (un grupo `sticky` dentro del contenido de otro `sticky`): **límite**, no soportado en v0.1. Los dos se pegan a la misma distancia y el de dentro tapa al de fuera; si hace falta, que el de dentro sume el `--_head-size` del de fuera es una ronda futura (#517). Receta: no anidar grupos `sticky`.
- **Fondo del encabezado pegado:** opaco, del color de la superficie que lo contiene (alias local `--_sticky-bg` de coco: `--g-color-bg` por defecto y un mapa de anfitrionas de Grana —`GCard`, `GSurface`, `GDialog`— con su token de superficie). Dentro de un contenedor de la aplicación con otro fondo, la aplicación pone el `background` de `.g-accordion-item__heading` con su CSS (receta del README; límite conocido).
- Impresión: sin pegar.

## Qué lo hace distinto

1. **El encabezado que tocas no se mueve**: en «uno a la vez», al cerrar desde abajo y al cerrar desde el encabezado pegado, el resto se acomoda alrededor del dedo; ni los frameworks ni el anclaje del navegador lo hacen (336 px medidos). Sirve a quien toca en móvil: el segundo toque cae donde miraba.
2. **Lo plegado se encuentra, se enlaza y se imprime**: Ctrl+F, un `#id` de dentro, un `#:~:text=` de un buscador y la impresión llegan al contenido plegado en los tres motores.
3. **La línea que no se mueve (A)**: la respuesta empieza a leerse cerrada y sigue en el mismo sitio al abrir; en ajustes, el estado se ve sin abrir nada.
4. **El encabezado que acompaña (`sticky`)**: se sabe en qué sección se está mientras se lee una respuesta larga, y cerrarla no obliga a volver a subir.

Nada de esto toca la accesibilidad: el marcado es el de APG, el movimiento cae a fundido con `prefers-reduced-motion` y el orden del documento manda.

---

## Motor de plegado compartido (`utils/collapse.js`, interno; #486)

bruno lo **saca de `GFormSection`** sin cambiar su comportamiento y lo usa en `GAccordionItem`. Ni se exporta desde `src/index.js` ni es API. Lo que debe exponer (las firmas exactas son de bruno; el comportamiento, no):

| Pieza | Qué hace | La usa |
| --- | --- | --- |
| `useCollapse({ open, panel, toggle, onSettle?, manualReady? })` | Composable con `animating`, `ready`, `instant` (refs) | Ambos |
| `start()` | Al cambiar `open`: `animating = true` y, tras `nextTick`, temporizador de respaldo = `transitionMs(panel)` + 50 ms que, si la transición de `grid-template-rows` del panel sigue corriendo (`getAnimations()`), espera otros 50 ms | Ambos |
| `onTransitionend(event)` | Asienta si la diana es el panel y la propiedad es `grid-template-rows` | Ambos |
| `onSettle(open)` (opción) | Gancho al asentar: el acordeón pone `hidden="until-found"` si quedó plegado; `GFormSection` vuelve a montar el cuerpo descartado (`pendingRemount`) | Ambos |
| `openInstant()` | Cancela temporizador y animación, `instant = true` en el mismo parche, lo retira tras dos cuadros | Ambos (`OPEN_REQUEST`, `beforematch`, `#id`) |
| `focusOut()` | Si el foco está dentro del panel, al `toggle` con `preventScroll` (antes de `inert`/`hidden`) | Ambos |
| `ready` / `markReady()` | Sin `manualReady`, `ready = true` tras el primer pintado (dos cuadros); con `manualReady`, lo pone quien llama (`GFormSection` lo pone tras su primera medida, #289) | Ambos |
| `keepInPlace(el, getMs)` (exportación aparte) | La compensación Δ0 de «Teclado, deshabilitado y Δ0» | Acordeón |
| `OPEN_REQUEST` | Sigue en `formContext.js`; `collapse.js` lo importa de ahí (o se mueve a `collapse.js` y `formContext.js` lo reexporta con el mismo valor `'g-open-request'`) | Ambos |

**Criterio de la extracción:** `GFormSection.test.js`, `GFormReveal.test.js`, `tests/form-section*.spec.mjs`, `tests/form-reveal.spec.mjs` y `tests/form-distribution.spec.mjs` en verde **sin tocarlos**; el CSS de `GFormSection` no cambia. `GFormReveal` puede adoptar el motor más adelante para su altura (L3 de kiwi); no entra en esta entrega. El paso de `GFormSection` a `until-found` es aparte y tiene su propia condición (#487).

## Dentro de `GForm` (L11; #486)

Un acordeón dentro de un `GForm` funciona (`OPEN_REQUEST` abre lo que haga falta). Si el elemento está dentro de un `GForm` (inyecta `formKey`) y su contenido tiene un control de formulario (`input` que no es `hidden`, `select`, `textarea`), **aviso 8** una vez: «para plegar campos de un formulario, usa `GFormSection mode="collapsible"`; aquí no cuentan en el estado de errores por sección». Se comprueba al montar y al montarse por primera vez un contenido `lazy`. No cambia el comportamiento ni toca `useFormField`.

---

## Clases y datos (contrato bruno ↔ coco)

| Clase / dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-accordion` | Raíz del grupo | Siempre |
| `g-accordion--exclusive` | Raíz del grupo | `exclusive` |
| `g-accordion--sticky` | Raíz del grupo | `sticky` |
| `g-accordion-item` | Raíz del elemento | Siempre |
| `is-open` | Raíz del elemento | Abierto (en el acto, también mientras abre) |
| `is-animating` | Raíz del elemento | Del cambio al `transitionend` del panel o al respaldo |
| `is-ready` | Raíz del elemento | Tras el primer pintado (cliente) |
| `is-instant` | Raíz del elemento | Apertura por búsqueda, `#id` u `OPEN_REQUEST`; cierre instantáneo de `sticky`; dos cuadros |
| `is-disabled` | Raíz del elemento | `disabled` |
| `is-standalone` | Raíz del elemento | Sin grupo |
| `has-peek` | Raíz del elemento | Con `peek` o slot `peek` |
| `has-actions` | Raíz del elemento | Con slot `actions` |
| `--_head-size` (px, en línea) | Raíz del elemento | Abierto en un grupo `sticky`: alto del encabezado (2.4.11); **medido con el tamaño de maquetación**, sin transformaciones (hallazgo 1 de la auditoría, pendiente de bruno) |
| `--_scroll-pad` (px, en línea) | Raíz del grupo | Grupo `sticky`: `padding-block-start` del contenedor de desplazamiento (#517) |
| `__heading`, `__toggle`, `__title`, `__meta`, `__chevron`, `__actions`, `__peek`, `__panel`, `__content`, `__body` | Ver «Estructura accesible» | |

Convención: modificadores de prop `--{prop}` (`api.md`), estados `is-*`/`has-*`. **Reservadas** (no se emiten): `g-accordion--layout-{list|index|thread}`, `__num` (C), `__rail`, `__rail-fill`, `__node` (B), `__lead` (slot reservado).

## Geometría y estilo (lo que coco debe respetar)

- **Botón ≥ 44 px de alto en todos los punteros** (es la diana principal de la pieza; kiwi L19); texto ≥ 12 px (`meta` en `body-sm`); título y `meta` ≥ 4,5:1, chevron ≥ 3:1; foco visible con `--g-focus-width` **hacia dentro** (no lo recorta un contenedor).
- `__content` con `overflow: hidden` solo mientras anima; asentado abierto, `overflow: visible` (no recorta anillos de foco ni sombras de dentro).
- **A:** título en `title-sm`, separador de 1 px (`--g-color-border`) entre elementos, avance en `body` `text-muted` con `line-clamp: 1`, chevron al final.
- A 320 px, sin desplazamiento horizontal (título que se parte con `overflow-wrap: break-word` —no `anywhere`, que rebaja el mínimo intrínseco y parte «Disponi-ble»—; las acciones ocupan como mucho un tercio de la fila). **Acciones** (#518): se quedan en la línea del título también a anchos estrechos (a 320 px caben dos acciones y un título de palabras normales). Si una aplicación necesita que bajen de línea, sería una clase `is-actions-below` medida por el `.vue`, como `GFormSection` (#289): ronda futura, sin API hoy. **Límite:** un control de acción **más alto que la línea del título** (`GBtn sm` de 35 px frente a 32 px) queda por debajo del centro la mitad del exceso (1,5 px medidos).
- **RTL:** propiedades lógicas; chevron espejado (gira a −90° abierto); `dir="auto"` en título, `meta` y avance.
- **`forced-colors`:** separadores y chevron en colores del sistema; el foco del sistema manda.
- CSS que selecciona hijos de la aplicación en `__body` ignora `.g-tooltip` (`:not(:where(.g-tooltip))`, #383).

## Tokens (#485)

**Ningún token del tema nuevo** (registro en `tokens.md` §40). Consumidos:

| Token | Para qué |
| --- | --- |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Título y contenido; avance, `meta` y chevron; deshabilitado |
| `--g-color-border` | Separadores entre elementos |
| `--g-color-bg` (y el de la superficie anfitriona) | Fondo del encabezado pegado (`--_sticky-bg`) |
| `--g-color-focus`, `--g-focus-width` | Anillo del botón |
| Hover del botón | Un token existente de coco (p. ej. `--g-color-neutral-soft`), sin token nuevo |
| `--g-space-*` | Rellenos, separaciones, ancho de lectura |
| `--g-radius-xs` | Anillo del botón |
| `--g-text-title-sm-*`, `--g-font-title` | Título (A) |
| `--g-text-body-*`, `--g-text-body-sm-*`, `--g-font-ui` | Avance y contenido; `meta` |
| `--g-border-width` | Separadores |
| `--g-duration-slow`, `--g-duration-fast`, `--g-ease-out` | Altura y color; fundidos y giro |

**Propiedad pública de entrada (no es del tema): `--g-accordion-sticky-top`** (#484, enmienda #515: solo distancia de pegado, ya no `scroll-margin`). La pone la aplicación; `GAccordion.css` la registra con `@property` (`syntax: '<length>'`, **`inherits: true`** para que valga ponerla una vez en `:root`, `initial-value: 0px`), así el componente la lee sin respaldo. No va en `defaults.css` ni en `tokens.json`; excepción documentada en `levels.test.js`, como `--g-form-min` y `--g-form-actions-size`. Registro en `tokens.md` §40.

**No son tokens** (alias y constantes): `--_sticky-bg`, `--_head-size`, `--_scroll-pad` (§29.5), la inclinación del chevron `--g-space-1 × 0.5` (§29.6, constante existente, #518), los retrasos del fundido del avance (derivados de `fast`/`slow`), el umbral de 6 regiones (APG), los 80 ms y 50 ms de respaldo (JS), el giro de 90°.

## Iconos

`chevron-right` (GLibIcon interno; ya en la lista de la librería). Nada nuevo en la lista. Fila en la tabla de `icons.md` §4. B reservado usaría `plus`/`minus` (también en la lista).

---

## Avisos de desarrollo

Una vez por instancia, con `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`.

**`[Grana GAccordion]`**

1. `modelValue` que no es arreglo (ni `null`/`undefined`): se trata como `[v]`.
2. `exclusive` con más de un valor abierto: solo se abre el primero en orden del documento (sin emitir).
3. Dos elementos del grupo con el mismo `value`.

**`[Grana GAccordionItem]`**

4. Sin `title`, slot `title`, `meta` ni slot `meta`: el botón no tiene nombre.
5. `open` u `onUpdate:open` dentro de un grupo: se ignora (el estado es el `v-model` del grupo).
6. Algo interactivo (`a[href]`, `button`, `input`, `select`, `textarea`, `[tabindex]`, `[contenteditable]`) en `title` o `meta`, comprobado al pintarse: los hijos de un botón no se pueden usar.
7. Algo interactivo en el avance: es la descripción del botón y abre al clic.
8. Dentro de un `GForm` con controles de formulario en su contenido (#486).
9. Su `id` está repetido en el documento (el ancla y `aria-controls` irían a otro).
10. En un grupo con `v-model`, sin `value` ni `id`: el modelo usará un id generado que la aplicación no conoce.

Ninguno cambia el comportamiento.

## Paquete y peso (#476)

**Paquete principal `@grana/vue`**: `GAccordion` y `GAccordionItem` se exportan desde `src/index.js` y se registran en el plugin; `GAccordion.css` y `GAccordionItem.css` (o uno solo, decisión de coco) en `components.css`. Estimación: 3 a 4 KB gzip (el motor compartido ya está en el principal por `GFormSection`). **Compuerta:** bruno mide el incremento sobre `dist/grana.js` (gzip -9); si supera **8 KB** (#238, #328, #337, #380, #415), el acordeón pasa a **entrada propia `@grana/vue/accordion`** (global UMD `GranaAccordion`, nombre reservado) con `collapse.js` por `__shared`, y lima lo registra como enmienda de #476. El peso medido va en los `meta.json`.

**Tipos (#443):** todo lo público de este contrato consta en `GAccordion.meta.json` y `GAccordionItem.meta.json`: props con tipo, valores (`headingLevel` 2 a 6) y default; eventos con su carga (`update:modelValue: Array<string | number>`, `update:open: boolean`); slots con sus props (`{ open: boolean }` en `title`, `meta`, `peek`, `actions`). Sin métodos expuestos. `value` es `string | number` (va en `types/overrides.mjs` si el JSON no lo expresa).

---

## Resolución de hallazgos de kiwi (r01, L1 a L14)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Nombres y reparto | `GAccordion` + `GAccordionItem`; suelto = sección plegable; sin `GDisclosure` | #476 |
| L2 | API del grupo | `v-model`, `exclusive`, `headingLevel`, `arrows`, `sticky`; `layout` reservado; sin `labels` | #478, #484 |
| L3 | API del elemento | `value`, `id`, `title`, `meta`, `peek`, slots `title`/`meta`/`peek`/`actions`, `disabled`, `lazy`, `headingLevel`, `v-model:open` (suelto); `lead` reservado | #479 |
| L4 | Motor compartido | `utils/collapse.js` interno con lo que debe exponer; extracción sin cambio de `GFormSection` | #486 |
| L5 | `until-found` y `visibility` | El acordeón sin `visibility: hidden`; #291 reabierto con condición para `GFormSection` | #480, #487 |
| L6 | Regla de `region` | Automática (≤ 6 o `exclusive`; suelto, siempre), sin prop | #477 |
| L7 | Δ0 | Del componente, no opcional; cancelable por el usuario; sin compensar lo que no tocó el usuario | #481 |
| L8 | `sticky` bajo cabecera fija | Propiedad pública de entrada `--g-accordion-sticky-top` (`@property`, hereda, 0px), solo distancia de pegado; la cabecera de la aplicación es de su `scroll-padding` (receta) | #484, #515 |
| L9 | Tokens | Ninguno del tema nuevo; el tramo de B, cuando entre, en `brand-text` por #439 (forma de familia sin par), no en `brand` | #485, #475 |
| L10 | Iconos | `chevron-right`; nada nuevo | #485 |
| L11 | Dentro de `GForm` | Aviso 9 por DOM, sin tocar `useFormField` | #486 |
| L12 | Avance automático | No; lo pasa la aplicación; receta | #483 |
| L13 | Impresión | `@media print` de coco, sin API | #480 |
| L14 | Personalidad | A + `sticky`; Δ0 y «lo plegado se encuentra» como rasgos | #475 |

## Fuera de v0.1 (reservado con nombre)

- **B «Hilo»** como `layout="thread"`: eje, nudo (`plus`/`minus`) y tramo. Si entra: el tramo es una forma de familia sin par → **`brand-text`** (#439); su llegada con `--g-ease-spring` sería un **uso nuevo** de la curva (#299 lo exige como decisión; el prototipo además dura `slow × 2` = 480 ms, por encima del máximo de 240 ms, #71), y se decide con su contrato.
- **C «Índice»** como `layout="index"`: columnas, numeración, FLIP de las vecinas. Si entra: el FLIP con `--g-ease-spring` es un desplazamiento de bloques, que #299 excluye; necesita decisión propia (y del usuario, por identidad). Solo si un centro de ayuda real lo pide.
- Slot **`lead`** del elemento (icono al inicio del título, como `GFormSection`).
- `GSummary` dentro del avance (ajustes): ronda futura.

## Límites conocidos (para el README)

- Lo `lazy` sin abrir no se encuentra, no se imprime y un `#id` de dentro no existe.
- Sin página debajo, cerrar al final recorta el desplazamiento (Δ0 no puede compensarlo).
- Navegador sin `hidden="until-found"`: lo plegado no se encuentra (cae en `hidden`).
- Si el servidor serializa `hidden` como booleano (ver «Estructura accesible», SSR): antes de hidratar, lo plegado no se encuentra.
- Encabezado pegado dentro de un contenedor de la aplicación con fondo propio: la aplicación pone el fondo.
- La cabecera fija de la aplicación es de su `scroll-padding-block-start` (#515): sin él, un `#id` o el foco pueden quedar bajo ella. La receta pone la misma variable en `--g-accordion-sticky-top` y en `scroll-padding-block-start`.
- Un estilo de elemento de la aplicación sin capa (`h3 { margin: 28px 0 }`) gana al `margin: 0` del encabezado del componente (#4; se resuelve con una capa anterior, `api.md` «Estilos de elemento de la aplicación», #516): el encabezado baja ese margen dentro de su elemento y se pega más abajo.
- `sticky` anidado no soportado (#517); no anidar grupos `sticky`.
- Un desplazamiento ajeno (arrastrar la barra, un `scrollTo` de la aplicación) en los ≈ 320 ms posteriores a un clic se deshace por Δ0 (#519).
- Acciones con un control más alto que la línea del título quedan bajo el centro la mitad del exceso (#518).
- La línea que se despega del encabezado pegado solo existe donde hay consultas `scroll-state` (Chromium); en los demás, fondo opaco sin línea.
- Ajustes con avance distinto del contenido: al abrir, el avance y el primer renglón coinciden en el sitio durante el fundido y, al plegar, el avance asoma por debajo del contenido que se va; con el mismo texto no se nota.
- Avance duplicado para el lector en modo exploración (lo lee como descripción del botón y como texto), igual que el resumen de `GFormSection`; sin verificar con lector real.

---

## Remates tras la auditoría de coco (2026-10-08; #515 a #519)

Auditoría: `design/lab/accordion/auditoria.md` (1602/1602 en los tres motores, `candidate`). Lo decidido, y a quién le toca:

| Hallazgo | Decisión | Le toca |
| --- | --- | --- |
| 2 · receta que suma la cabecera dos veces | **(b)** (#515): el componente solo suma lo suyo; la cabecera de la aplicación es de su `scroll-padding` | coco: quitar `scroll-margin-block-start: var(--g-accordion-sticky-top)` del botón (`.g-accordion-item__toggle`) y de la raíz `.g-accordion-item` (el del hallazgo 5), y dejar en el contenido `var(--_head-size)` a secas; el verificador mide `#id` y foco con `?pad=1` y sin él (sin él, 0 px es lo esperado). bruno: ajustar el comentario de `bringIntoView` y sus specs a la receta con `scroll-padding` |
| 3 · estilo de elemento sin capa | Regla general en `api.md` (#516) | mora-docs: receta en el README |
| 5 · `#id` al cargar bajo la cabecera | Resuelto por #515: el `scroll-padding` de la aplicación vale para la navegación nativa y para `scrollIntoView`; el `scroll-margin` de la raíz que añadió coco se retira | coco (ver arriba) |
| 6 · Δ0 y desplazamiento ajeno | Límite aceptado (#519) | mora-docs: README |
| 1 · `--_head-size` corto en `GDialog` | Medir el tamaño de maquetación (`offsetHeight` o `parseFloat(getComputedStyle(hd).height)`), no `getBoundingClientRect`, que incluye la escala de entrada del diálogo (#299) | bruno (`PENDIENTES.md`) |
| «Para lima» 1 a 7 de `estilo.md` | Registrados en este contrato (#517, #518) | — |
| Δ0 en cadena y `#id` en `load` | Registrados (#519) | — |

---

## Verificación (cómo se da por hecho)

**Criterio de hecho:** las medidas de kiwi (`design/lab/accordion/r01/verificar.mjs`, partes `base`, `A` y el pegado y cierre de `B`) reproducidas **sobre el componente real** en Chromium, Firefox y WebKit.

### bruno (vitest + jsdom)

- **Estructura:** `hN` del nivel (grupo, elemento, suelto), `button[type=button]` con `aria-expanded`, `aria-controls` → `__content`, `id` derivados, `region` + `aria-labelledby` con 6 elementos y sin ellos con 7, con `exclusive` y suelto; `aria-describedby` → avance solo cerrado; chevron `aria-hidden`; `dir="auto"`; acciones fuera del `hN`.
- **Modelo:** controlado y no controlado; orden del documento (abrir 3 y luego 1 → `[1, 3]`); valores sin elemento conservados al final; `exclusive` (abrir otro sustituye; cerrar el abierto → `[]`; modelo con dos → solo el primero, sin emitir, aviso 2); no emite cuando el cambio llega del modelo; `v-model:open` suelto; `open` dentro de grupo ignorado con aviso 5; anidados independientes (un suelto dentro de un panel no entra en el grupo exterior).
- **Plegado:** `inert` solo mientras se cierra; `hidden="until-found"` al asentar (con el respaldo del temporizador en jsdom); sin `hidden` en el mismo parche que `is-open`; `beforematch` despachado a mano abre con `is-instant` y emite; `OPEN_REQUEST` abre, cancela y, en `exclusive`, solo la primera del tick; foco al botón al plegar por programa con el foco dentro.
- **`lazy`:** un montaje tras abrir-cerrar-abrir; sin montar antes del primer abrir.
- **Teclado:** flechas sin vuelta, Inicio/Fin, solo en encabezados del grupo (no en anidados ni dentro del panel), `arrows: false`, con modificadores no; deshabilitado enfocable que no abre por clic, teclado ni avance, y sí por `beforematch`/`OPEN_REQUEST`.
- **Avance:** clic abre; con selección no; abierto no.
- **`#id`:** al montar y en `hashchange` abre sin `keepInPlace` y no mueve el foco; una sola escucha compartida (se quita con el último elemento).
- **SSR:** `renderToString` con plegados y abiertos: `hidden="until-found"` en el HTML (o la corrección al montar si Vue lo serializa booleano), sin `inert`, sin `is-ready`, sin acceso a `window`.
- **Avisos 1 a 10.**
- **Motor compartido:** las pruebas de `GFormSection` y `GFormReveal` en verde sin cambios.

### Playwright (`design/lab/theme-playground/`; puerto propio)

- `tests/accordion.spec.mjs`: el `verificar.mjs` de kiwi adaptado (base, A, pegado y cierre de B): árbol con `ariaSnapshot`, `#:~:text=` y `#id` de dentro que abren en los tres motores, `#id` del elemento al cargar y en `hashchange`, impresión (`emulateMedia('print')`: 0 contenidos de alto 0), Δ0 por cuadro en `exclusive` (≤ 1 px) y la cancelación al desplazar, `overflow-anchor`, movimiento reducido (sin `grid-template-rows` en la transición), RTL, ≥ 44 px, ≥ 12 px, contrastes, foco visible, 320 px sin desplazamiento horizontal, `sticky` con `--g-accordion-sticky-top` (pegado bajo una cabecera fija de prueba; cerrar desde el pegado Δ ≤ 1 px; Mayús+Tab dentro de un abierto deja el control entero a la vista), consola limpia.
- `tests/personalidad-accordion.spec.mjs`: continuidad del avance Δ ≤ 1 px por cuadro al abrir y cerrar, primera línea entera antes de la mitad del fundido, avance que sigue al estado, nada animado al montar.
- `tests/form-section*.spec.mjs`, `tests/form-reveal.spec.mjs` y `tests/form-distribution.spec.mjs` siguen pasando tras la extracción.

### coco (CSS y auditoría)

Solo `var(--g-*)` y `--_*`; contrastes en claro, oscuro y un tema distinto; ≥ 44 px; foco hacia dentro; `forced-colors` emulado; impresión; Δ0 y continuidad del avance medidos en el componente real. Resultado en `design/lab/accordion/auditoria.md`, con verificación propia.

### No verificado (entorno real)

Lector de pantalla (VoiceOver, NVDA) sobre `region` y su regla, el avance por `describedby` en modo exploración y la navegación por encabezados; Ctrl+F real (se mide con `#:~:text=` y `#id`, que siguen el mismo algoritmo de revelado); impresión en papel; táctil real (`sticky` con la barra del navegador móvil); `forced-colors` en Firefox y WebKit; texto al 200 %.

---

## Encargos

**Componente complejo** (se solapa con `GFormSection` y extrae su motor): **coco y bruno en Opus**.

### coco (`GAccordion.css` / `GAccordionItem.css`, banco y `estilo.md`)

1. CSS de las clases de «Clases y datos»: A (título `title-sm`, separador, avance en la celda del panel con `line-clamp: 1`, chevron al final), rejilla `0fr → 1fr` **sin `visibility: hidden`**, `overflow` según `is-animating`, `is-instant`, movimiento reducido, impresión, `forced-colors`, RTL, `overflow-anchor: none`.
2. `sticky`: `@property --g-accordion-sticky-top`, encabezado pegado con `--_sticky-bg` y su mapa de anfitrionas, `scroll-margin-block-start: var(--_head-size)` en lo enfocable del contenido (el botón y la raíz no llevan `scroll-margin`, #515), `--_scroll-pad` restado de la distancia de pegado y `--g-accordion-sticky-top` a 0 en `.g-dialog__body` (#517).
3. Banco de estilo en `design/lab/accordion/` y `estilo.md` con las medidas (alto del botón, contrastes, continuidad del avance).
4. Auditoría del componente real con un tema distinto (paso 5): `design/lab/accordion/auditoria.md`.

### bruno (`.vue`, motor, pruebas, registro)

1. `packages/vue/src/utils/collapse.js` sacado de `GFormSection.vue` según «Motor de plegado compartido», con `GFormSection` usándolo **sin cambio de comportamiento** (sus pruebas en verde sin tocarlas).
2. `GAccordion.vue`, `GAccordionItem.vue`, sus `.test.js` y `.meta.json` (`status: "draft"` hasta la auditoría); exportación y registro en `src/index.js`; CSS en `components.css`; excepción de `--g-accordion-sticky-top` en `levels.test.js`; tipos (#443) con `value: string | number`.
3. Medir el peso (compuerta de 8 KB) y anotarlo en los `meta.json`; compuertas de `dist`: `grep -q "g-accordion-item__peek" packages/vue/dist/grana.css` y `grep -q "g-accordion-item" packages/vue/dist/grana.js`.
4. Playground: sección `#sec-accordion` (preguntas frecuentes con avance, ajustes con avance que sigue al estado, `exclusive`, `sticky` bajo una cabecera fija con `--g-accordion-sticky-top`, suelto, `lazy`, anclas `#id`) y los specs de «Verificación».
5. **Después** (no bloquea el acordeón): la medición de #487 para `GFormSection` y, si pasa, su paso a `until-found`.
