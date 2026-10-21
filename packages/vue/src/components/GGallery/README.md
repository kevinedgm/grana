# GGallery y GGalleryViewer

Las fotos de un lugar (una habitación, una carta, un recorrido) **ordenadas por lo que se vende**, con miniaturas que son enlaces a la foto grande y un **visor a pantalla completa** que te devuelve a la foto que estabas mirando. `GGallery` es la galería; `GGalleryViewer` es el visor, que `GGallery` usa por dentro y que también puedes usar suelto (por ejemplo, desde un botón «Ver 10 fotos» de una tarjeta). Grana no pide nada: las URL las pide el navegador, y cada foto llega con su `src`, `alt`, `width` y `height`. No trae color propio: el tema lo pone.

**Etiquetas:** `<g-gallery>` y `<g-gallery-viewer>` · **Estado:** `candidate` (ver [`design/lab/gallery/auditoria.md`](../../../../../design/lab/gallery/auditoria.md) y «Verificación») · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/gallery` (global UMD `GranaGallery`)

```js
import Gallery, { GGallery, GGalleryViewer } from '@grana/vue/gallery'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (banco del componente real en `packages/vue/playground/gallery.html`). Exige Vue `^3.5.0` y un navegador actual.

## Instalación: entrada propia

Ni `GGallery` ni `GGalleryViewer` viajan en `@grana/vue` (DECISIONS #742).

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Gallery from '@grana/vue/gallery'
import '@grana/vue/style.css'          // el CSS de la galería ya está en esta hoja única

createApp(App).use(Grana).use(Gallery).mount('#app')   // registra <g-gallery> y <g-gallery-viewer>
```

Sin empaquetador, carga `vue.global.js`, `dist/grana.umd.js` y `dist/gallery.umd.js` (global `GranaGallery`): `app.use(Grana).use(GranaGallery)`. En plantillas dentro del HTML (sin compilar), escribe las etiquetas con cierre: `<g-gallery ...></g-gallery>`.

**Peso.** Tope de la entrada: 12 KiB gzip (12 288 B). Medido por bruno y anotado en los `meta.json`: **9 114 B** (`dist/gallery.js`) y 8 166 B (`dist/gallery.umd.js`). Al documentar, el `dist/` del árbol recomprimido con `gzip` (nivel por defecto) dio 9 260 B: la misma cifra con otro nivel de compresión. `GDialog`, `GBtn`, `GLibIcon` y las utilidades llegan del principal por `__shared`, sin copia. `dist/grana.js` no contiene `GGallery`.

## Qué lo hace distinto

Formas elegidas por el usuario el 2026-10-21 (DECISIONS #730 y #735): **A «Recorrido por espacios»** por defecto y **B «La tira»** como apariencia; C reservada.

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **Recorrido por espacios (A)** | Si las fotos traen `group`, la galería se ordena por espacios (Habitación, Baño, Terraza) con un índice de enlaces, una portada que manda y, en el visor, un contador que dice **dónde estás** («Baño · 1 de 2») y un hilo que salta de un espacio a otro | Responde a la pregunta real («¿cómo es el baño?») en un toque |
| **La tira (B)** | `appearance="strip"`: la foto grande ya en la página, en una tira de alturas iguales con la proporción real de cada foto. Abrir el visor y cerrarlo deja la tira en la foto vista | Un estado con dos profundidades: ampliar y volver no te devuelve al principio, y la foto vertical se ve vertical |
| **Foco devuelto** | Al cerrar el visor, el foco vuelve a la miniatura de la foto que estabas **viendo**, no a la que abrió (abrí la 3, vi hasta la 4: vuelvo a la 4) | Nunca pierdes el sitio |
| **Escalonado y a la mano** | Esc **reduce** la foto ampliada antes de cerrar; la foto sigue al dedo al deslizar; ningún control se pone **encima** de la foto | El gesto no esconde nada y todo tiene su botón |

Sin autoavance, nunca (WCAG 2.2.2): no existe `autoplay` ni rotación, tampoco en la tira.

## Cuándo usarlo

| Necesito | Uso | No uses |
| --- | --- | --- |
| Fotos de un lugar con visor | **`GGallery`** | `GDocumentPreview` (documentos con páginas y acciones) |
| Abrir el visor desde un botón («Ver 10 fotos» en una tarjeta) | **`GGalleryViewer`** suelto con `from` = el botón | Una `GGallery` oculta |
| Una tarjeta con foto | [`GCard`](../GCard/README.md) (y, si abre fotos, un botón con `GGalleryViewer`) | La media de la tarjeta como control |
| Categorías de fotos | El índice de A **salta** a cada espacio (todo está en la página) | [`GTabs`](../GTabs/README.md) |

## Uso

Todos los textos van en `labels`: no hay valores por defecto. Cada foto trae `width`, `height` y `alt`.

```vue
<!-- Fragmento: `fotos` (las fotos de tu aplicación) y `labels` (tus textos, ver «Textos») son de tu aplicación -->
<template>
  <g-gallery
    title="Habitación Jardín"
    :photos="fotos"
    :groups="[{ value: 'hab', label: 'Habitación' }, { value: 'bano', label: 'Baño', id: 'fotos-bano' }]"
    :labels="labels"
  />
</template>
```

## Ejemplos

### e1 · Una habitación contada por espacios (A)

**Por qué:** cuando cada foto pertenece a un espacio y quien mira quiere saltar al baño. No lo uses si todas las fotos son del mismo espacio: sin `group`, la galería es una cuadrícula plana.

```vue
<!-- Fragmento: `labels` es de tu aplicación -->
<script setup>
const fotos = [
  { src: '/f/hab-1.jpg', thumb: '/f/hab-1-m.jpg', width: 1600, height: 1067, alt: 'Cama con lámparas de barro', group: 'hab' },
  { src: '/f/bano-1.jpg', thumb: '/f/bano-1-m.jpg', width: 1067, height: 1600, alt: 'Regadera de lluvia en el baño', group: 'bano' },
  { src: '/f/bano-2.jpg', thumb: '/f/bano-2-m.jpg', width: 1600, height: 1067, alt: 'Lavabo de cantera', group: 'bano' }
]
</script>

<template>
  <g-gallery title="Habitación Jardín" :photos="fotos" :labels="labels" />
</template>
```

Sin `groups`, los espacios salen de `photo.group` en el orden de su primera aparición, con el propio valor como etiqueta. Con `groups` fijas el orden y la etiqueta; su `id` es el **ancla enlazable** (`#fotos-bano` desde una campaña); sin `id`, `{id}-g-{n}`.

### e2 · La foto grande ya en la página (B)

**Por qué:** cuando la página se apoya en pocas fotos y no quieres un clic para verlas. La actual y la siguiente nunca difieren la carga. Necesita `labels.carousel` y `labels.slide` (si no, avisa y no pone `aria-roledescription`: mejor ninguno que uno en otro idioma).

```vue
<!-- Fragmento: `fotos` y `labels` (con `carousel`, `slide` y `position`) son de tu aplicación -->
<template>
  <g-gallery appearance="strip" title="El restaurante" :photos="fotos" :labels="labels" />
</template>
```

### e3 · Abrir el visor desde el botón de una tarjeta

**Por qué:** cuando ya tienes otra pieza (una oferta, una tarjeta) y solo quieres el visor. `from` es a quién vuelve el foco al cerrar.

```vue
<!-- Fragmento: `fotos`, `labels` y `abierto` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
const abierto = ref(false)
const i = ref(0)
const ver = ref(null)
</script>

<template>
  <g-btn ref="ver" @click="abierto = true">Ver 10 fotos</g-btn>
  <g-gallery-viewer v-model="abierto" v-model:index="i" :photos="fotos" title="Suite Jardín" :from="ver" :labels="labels" />
</template>
```

### e4 · Abrir la galería en una foto concreta desde fuera

**Por qué:** cuando otra parte de la página quiere abrir la foto 3 (por ejemplo, una reseña que la menciona). `v-model:index` y `v-model:open` controlan la galería; sin ellos, son internos.

```vue
<!-- Fragmento: `fotos` y `labels` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
const abierto = ref(false)
const actual = ref(0)
const verFoto = (n) => { actual.value = n; abierto.value = true }
</script>

<template>
  <g-btn variant="link" @click="verFoto(2)">Ver la foto de la terraza</g-btn>
  <g-gallery v-model:open="abierto" v-model:index="actual" title="Casa Alcalá" :photos="fotos" :labels="labels" />
</template>
```

## Datos de foto

| Campo | Tipo | Regla |
| --- | --- | --- |
| `src` | String | La foto grande (obligatorio) |
| `thumb` | String | Miniatura; sin ella, `src` |
| `srcset`, `sizes` | String | De la grande |
| `thumbSrcset`, `thumbSizes` | String | De la miniatura |
| `width`, `height` | Number | **Obligatorios** (reservan el hueco; avisa si faltan) |
| `alt` | String | **Obligatorio** (avisa si falta; sin él se pinta con `alt=""`) |
| `caption` | String | Pie visible (`dir="auto"`); no se repite en el nombre del enlace |
| `group` | String \| Number | Espacio (A) |
| `id` | String \| Number | Clave estable (sin ella, el índice) |

## Props de `GGallery`

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `photos` | Array | ver «Datos de foto»; vacío: no se pinta | `[]` |
| `groups` | Array | `[{ value, label, id? }]` | sin valor (se derivan de `photo.group`) |
| `title` | String | **obligatoria**; nombra la región y el visor | — |
| `headingLevel` | Number | `2` `3` `4` | el de `GSection` o `2` |
| `appearance` | String | `grid` `strip` | `grid` |
| `eager` | Number | miniaturas (en orden del DOM) sin `loading="lazy"` | `4` |
| `zoom` | Boolean | zoom del visor | `true` |
| `index` (`v-model:index`) | Number | foto actual, también la de la tira | sin valor |
| `open` (`v-model:open`) | Boolean | visor abierto | sin valor |
| `viewerZone` | String | `brand` `none` | `brand` |
| `labels` | Object | ver «Textos» | `{}` |
| `locale` | String | BCP 47 de las cifras | el `lang` del ancestro |
| `id` | String | base de los `id` | generado |

- **`appearance`:** `grid` es la base y, si alguna foto trae `group`, A (`g-gallery--grouped`: índice, espacios e hilo). `strip` es B; los grupos no forman espacios en la tira, pero el visor sigue hablando en el espacio. `inline` está **reservada**: avisa y se pinta como `grid`.
- **`groups`:** un `group` que no está en la lista avisa y va a un espacio al final, con su valor como etiqueta.
- **`index`:** fuera de rango, se toma el más cercano y avisa.
- **`zoom="false"`:** sin botón, sin `+`/`-` y sin doble clic; el pellizco del sistema sigue.
- **`viewerZone`:** el visor es, por defecto, una **zona de marca** (fondo y pares de color garantizados por el tema; con la marca por defecto, un «cuarto oscuro»). Con una marca de color (terracota, añil) el visor se tiñe: `none` usa la página. `inverse` está reservado.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`): van a la raíz `section`.

## Props de `GGalleryViewer`

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` (`v-model`) | Boolean | abierto; con `photos` vacío no abre | `false` |
| `photos` | Array | como en `GGallery` | `[]` |
| `groups` | Array | como en `GGallery` | sin valor |
| `index` (`v-model:index`) | Number | foto actual | sin valor |
| `title` | String | **obligatoria**; nombre del visor (con `labels.viewer`) y repetición visual | — |
| `zoom` | Boolean | | `true` |
| `zone` | String | `brand` `none` | `brand` |
| `from` | String \| HTMLElement | a quién vuelve el foco al cerrar | sin valor |
| `labels` | Object | ver «Textos» | `{}` |
| `locale` | String | BCP 47 | el `lang` del ancestro |
| `id` | String | base de los `id` | generado |

`from` es **vivo**: se resuelve otra vez al cerrar (DECISIONS #732). `GGallery` se lo pasa al visor y lo mantiene apuntando a la miniatura de la foto actual.

## Eventos

| Evento | Componente | Payload | Cuándo |
| --- | --- | --- | --- |
| `update:index` | ambos | `Number` | Cambia la foto actual (tira, visor o miniatura) |
| `update:open` | `GGallery` | `Boolean` | Se abre o se cierra el visor |
| `update:modelValue` | `GGalleryViewer` | `Boolean` | Se cierra (botón cerrar, Esc, deslizar hacia abajo); el `dismiss` de `GDialog` es cancelable |

La miniatura **no** emite `navigate`: no navega, abre el visor.

## Métodos (`GGalleryViewer`)

| Método | Efecto |
| --- | --- |
| `show(index)` | Lleva el visor a una foto |
| `zoomIn()`, `zoomOut()` | Amplía y reduce |

`GGallery` no declara slots: el texto llega por datos.

## Textos (`labels`)

Marcadores con `{…}`; las cifras salen de `Intl.NumberFormat(locale)`. Los **contados** (`total`, `groupLink`) admiten un String con marcador o una función `(count, vars)` para el plural de tu idioma. Si falta una clave, avisa una vez; los botones de solo icono se dibujan igual, pero sin nombre.

| Clave | Uso |
| --- | --- |
| `total` | «10 fotos» (`{count}`; contado) |
| `count` | Contador del visor («{index} de {total}») |
| `groupCount` | Contador en un espacio («{group} · {index} de {total}») |
| `position` | Nombre de la diapositiva en B («{index} de {total}») |
| `announce` | Anuncio del visor y de los botones de B («{position}. {alt}.») |
| `first`, `last` | Anuncio de extremo («Última foto.») |
| `prev`, `next`, `close` | Nombres de los botones |
| `zoom` | Nombre **constante** del botón de ampliar |
| `viewer` | Nombre del visor («{title}, galería») |
| `groups` | Nombre del índice y del hilo («Espacios») |
| `groupLink` | Enlace del índice («{group}, {count} fotos»; contado) |
| `broken` | «No se pudo cargar esta foto: {alt}» |
| `carousel`, `slide` | `aria-roledescription` de la tira (B) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| ← / → (espejados en RTL) | Foto anterior / siguiente. **Con la foto ampliada**, recorren la foto (desplazamiento nativo) |
| Inicio / Fin | Primera / última |
| Av Pág / Re Pág | (A) Primera foto del espacio siguiente / anterior |
| `+` / `-` | Amplía / reduce (con `zoom`) |
| Esc | **Escalonado:** con la foto ampliada, la primera Esc **solo reduce**; si no, cierra y devuelve el foco. Una Esc repetida se ignora |
| Tab | Cicla por cerrar, ampliar, anterior, siguiente y el hilo (A), sin salir del visor |
| Intro / Espacio | En una miniatura, abre el visor; en «siguiente», avanza |

- **Miniatura:** es un `<a href="{src}" aria-haspopup="dialog">`. Abre el visor con clic primario sin modificadores o con Intro; con Ctrl, ⌘, Mayús, Alt o botón central, el navegador hace lo suyo (abrir en pestaña, guardar). Sin JS, abre la foto.
- **Foco inicial del visor:** «Foto siguiente»; con una sola foto, sin flechas y el foco en «Cerrar».
- **Sin vuelta:** en la última foto, «siguiente» lleva `aria-disabled="true"` y **sigue enfocable**; igual «anterior» en la primera.
- **La tira (B):** una sola parada de Tab (la diapositiva actual); ←, →, Inicio y Fin la mueven y llevan el foco. Los botones ‹ › anuncian la foto; **el desplazamiento a mano no anuncia**.
- **Gesto:** deslizar en horizontal ≥ 18 % del ancho (o ≥ 40 px en < 250 ms) pasa de foto, y la foto sigue al dedo; deslizar hacia abajo ≥ 22 % del alto cierra. Doble toque o doble clic amplía en el punto. Todo gesto tiene su botón o su tecla.

## Accesibilidad

- a. **Anuncios.** Al abrir el visor y en cada cambio, una región viva cortés y atómica dice `labels.announce` con la posición y el `alt`; el título y el contador visuales van `aria-hidden` (los dice el nombre del visor y la región viva). `prueba`: `GGallery.test.js`, 32 de 32, en verde al documentar.
- b. **Controles fuera de la foto.** En 1280×800, 390×844 y 320×256, LTR y RTL, con foto apaisada y vertical, ningún control queda encima de la foto pintada. `medido`.
- c. **Contraste del visor.** Título, contador, pie, hilo e iconos ≥ 4,5:1 (mínimo 4,96:1) y trazo del espacio actual y borde de la navegación ≥ 3:1, con nueve temas, claro y oscuro, con y sin zona en Chromium (tres temas en Firefox y WebKit); el anillo de foco ≥ 3:1 contra el fondo del visor. `medido`.
- d. **Galería.** Índice, cifra, pies y recuento ≥ 4,5:1; borde del índice ≥ 3:1 y alto ≥ 24 px; sin desplazamiento horizontal a 1280, 390, 320 y 320×256, en LTR y RTL. `medido`.
- e. **Objetivos.** Controles del visor ≥ 24 px con puntero fino y ≥ 44 px con puntero grueso. `medido`.
- f. **Esc escalonado y foco devuelto** a la foto vista. `medido`.
- g. **Movimiento reducido:** la foto no se desplaza ni sigue al dedo; solo funde en `--g-duration-fast`. `medido`.
- h. **Colores forzados.** En Chromium, borde real en la miniatura, contorno en el visor y el espacio actual en `Highlight`. `medido` solo en Chromium.
- i. **Foto rota:** la miniatura lleva `is-broken` y el visor muestra `labels.broken` con el `alt`, no un hueco mudo.
- j. **Tira:** APG *Carousel* **sin rotación**: región con `aria-roledescription` (`labels.carousel`), cada foto como `role="group"` con `labels.slide` y su posición.

> **Peligro.** Una foto sin `alt` se pinta con `alt=""`, no entra en el anuncio del visor y su miniatura-enlace queda sin nombre: quien usa un lector de pantalla no sabe qué foto abre ni cuál está viendo. El componente solo avisa en desarrollo. Igual con `labels`: sin `labels.prev`, `next`, `close` o `zoom`, los botones de solo icono no tienen nombre.

## Personalidad

Movimiento mínimo y con tokens (sin `--g-ease-spring` ni `--g-ease-bounce`): la foto llega **desde el lado del gesto** (`space × 6` de desplazamiento y opacidad, `--g-duration-press` con `--g-ease-out`), así «siguiente» y «anterior» se sienten distintos; el arrastre la sigue al dedo; una ráfaga de cambios parte desde donde está, sin cola. El zoom no tiene transición. Con `prefers-reduced-motion: reduce` no hay desplazamiento ni seguimiento: solo un fundido corto. Nada se anima al montar.

## Tema

`GGallery` solo lee `var(--g-*)` (lista exacta de `GGallery.css`, DECISIONS #759):

- **Color:** `--g-color-surface-sunken` (miniatura rota y hueco del visor), `--g-color-bg` (fondo del visor), `--g-color-mold` (hueco mientras carga), `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` (botón en un extremo), `--g-color-border`, `--g-color-border-strong` (hover de la miniatura), `--g-color-border-control` (chips del índice y espacio actual del hilo), `--g-color-focus`.
- **Forma:** `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-md` (miniatura), `--g-radius-shape` (chips del índice e hilo).
- **Tipografía:** `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-title-sm-*` (título de la barra del visor), `--g-text-action-weight`, `--g-font-ui`.
- **Espacio y movimiento:** `--g-space-*`, `--g-duration-fast`, `--g-duration-press`, `--g-ease-out`, `--g-ease-standard`.

`--g-color-surface` **no** se lee. Dentro del visor (zona de marca) rigen los pares de color de la zona.

## Clases

Galería: `g-gallery`, `g-gallery--appearance-{grid|strip}`, `g-gallery--grouped`, `g-gallery__head`, `__title`, `__total`, `__strip-nav`, `__strip-count`, `__index`, `__index-link`, `__group`, `__group-title`, `__grid`, `__item`, `__thumb` (con `is-current` e `is-broken`), `__img`, `__strip`, `__slide`, `__caption`, `__live`. Visor: `g-gallery-viewer` (en el `<dialog>`), `__bar`, `__title`, `__count`, `__zoom`, `__close`, `__stage` (con `is-zoomed` e `is-dragging`), `__img` (con `is-arriving` y `data-direction`), `__broken`, `__caption`, `__nav`, `__prev`, `__next`, `__thread`, `__thread-item`, `__live`.

## Avisos de desarrollo

Prefijo `[Grana GGallery]` o `[Grana GGalleryViewer]`, una vez por instancia y motivo, solo fuera de producción:

1. Sin `title`.
2. Foto sin `width`/`height`.
3. Foto sin `alt`.
4. `group` que no está en `groups`; `value` repetido en `groups`.
5. `photos` vacío (no se pinta; el visor no abre).
6. `strip` sin `labels.carousel` o `labels.slide` (solo `GGallery`).
7. Falta una clave de `labels` al necesitarla.
8. `appearance="inline"` (reservada; solo `GGallery`).
9. `index` fuera de rango.

## Alcance

- **El visor es un [`GDialog`](../GDialog/README.md) `fullscreen bare`:** hereda el apilado, la Esc repetida ignorada, el fondo único y el orden del foco inicial. La página de debajo queda quieta con el visor abierto.
- **Zoom ×2 del tamaño contenido,** no continuo: el recorrido es solo foto (sin franjas vacías), con el desplazamiento nativo; el pellizco del sistema sigue funcionando.
- **Sin `fetch` ni autoavance:** las URL las pides tú; no existe `autoplay`.
- **Reservado** (no existe hoy): **C · Se abre en su sitio** (`appearance="inline"`); el tono `inverse` del visor (cuando exista el ámbito en la zona de marca); un **visor de alto corto** que pliegue pie e hilo (solo se contratará si fotos reales o un reporte lo piden, DECISIONS #762).
- **Límite aceptado: alto muy corto (DECISIONS #762).** A 320×256 (zoom del 400 %, el caso de reflujo de WCAG 1.4.10) la barra, el pie, la navegación y el hilo dejan a la foto unos **96×64 px** (apaisada) y unos **43×64 px** (vertical). Es usable: la foto se ve, se amplía ×2 y se recorre, y ningún control se solapa ni se sale. Es pequeña, y no hay una forma especial para ese alto.
- **Sin JS**, la miniatura es un enlace a la foto grande (no hay visor).

## Verificación

- **Pruebas** (vitest, jsdom): `GGallery.test.js`, **32 de 32** en verde, ejecutadas de nuevo al documentar. `prueba`.
- **Auditoría de coco** con el componente real (`dist/gallery.umd.js`, banco `packages/vue/playground/gallery.html`; el visor es el `GDialog` real) y temas distintos al por defecto (terracota, añil, pálida, stripe, github, spotify, caracol-púrpura y lustre): `node design/lab/gallery/auditoria-verificar.mjs`. El informe (2026-10-21) registra **1348 de 1348** en Chromium, Firefox y WebKit.
  - **Conflicto sin resolver.** Al documentar se volvió a correr el verificador sobre el árbol actual (después del remate de bruno `d11d4f2`, que corrige G-A1: el zoom ya no cuenta el relleno de la imagen) y dio **1330 de 1348**. Las 18 comprobaciones que fallan (seis por motor) son una sola: «ampliada desde el centro (vertical)», con la foto vertical a 1280×800 (fotos 0 y 4) y a 390×844 (foto 4), en LTR y RTL (lecturas `296/624` y `203/502`). El informe de coco es anterior a ese remate. No se sabe si el defecto está en el verificador (que mide el centro con la geometría anterior) o en el componente; no es de mora-docs decidirlo. Derivado a coco y bruno (ver la entrega). Hasta entonces, la cifra `medido` de este README es la del informe, y el centrado del zoom sobre una foto vertical queda **sin confirmar** en el árbol actual.
- **Specs de bruno** (`tests/gallery.spec.mjs`): en verde en los tres motores, según el informe (WebKit con un worker). No se corrieron al documentar.
- **Empaquetado** (al documentar): `dist/grana.js` no contiene `GGallery`; `dist/gallery.js`, `dist/gallery.umd.js` y `dist/gallery.d.ts` existen.
- **Rúbrica de movimiento:** propósito, comodidad, estabilidad, transiciones, control y accesibilidad, **cumple**; rendimiento e inmersión, **parcial** (fotos reales y su decodificación sin medir; el alto corto, ver «Alcance»).
- **Pendientes abiertos:** ninguno propio de este componente en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## No verificado

- **Gesto táctil real** y el **pellizco del sistema.**
- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): región viva, `aria-roledescription` y `aria-haspopup` en un enlace; solo se comprobó el marcado.
- **Fotos reales** y su rendimiento (decodificación, LCP).
- **`forced-colors` en Firefox y WebKit:** Playwright solo lo emula en Chromium.
- **Safari real.**

## Fuentes

API: [`GGallery.meta.json`](./GGallery.meta.json), [`GGalleryViewer.meta.json`](./GGalleryViewer.meta.json) · Contrato: [`design/contracts/gallery.md`](../../../../../design/contracts/gallery.md) (DECISIONS #730 a #735, #742, #744, #758, #759 y #762) y [`design/contracts/dialog.md`](../../../../../design/contracts/dialog.md) «Visor a pantalla completa» · Ronda de kiwi: [`design/lab/gallery/r01/`](../../../../../design/lab/gallery/r01/) · Estilo: [`design/lab/gallery/estilo.md`](../../../../../design/lab/gallery/estilo.md) · Auditoría: [`design/lab/gallery/auditoria.md`](../../../../../design/lab/gallery/auditoria.md) · Pruebas: `GGallery.test.js`, `design/lab/theme-playground/tests/gallery.spec.mjs`
