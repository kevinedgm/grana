# GHero

La apertura de una página de un **sitio** (un hotel, un restaurante, un recorrido): el título, la promesa, la acción y **la foto que vende**. Garantiza tres cosas que una receta a mano suele romper: el texto **nunca** queda sobre la foto (vive en la página, en una placa opaca o en una tarjeta), la foto principal es la primera en llegar y **nada se mueve ni cambia solo** sin poder pararse. No trae color propio: el tema lo pone; `GHero` solo lee tokens. No es el encabezado de una vista de gestión (para eso, [`GPageHeader`](../GPageHeader/README.md)).

**Etiquetas:** `<g-hero>` · **Estado:** `candidate` (ver [`design/lab/hero/auditoria.md`](../../../../../design/lab/hero/auditoria.md) y «Verificación») · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/hero` (global UMD `GranaHero`)

```js
import Hero, { GHero } from '@grana/vue/hero'   // plugin por defecto; GHero para registrarlo a mano
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (banco del componente real en `packages/vue/playground/hero.html`). Exige Vue `^3.5.0` y un navegador actual.

## Instalación: entrada propia

`GHero` **no** viaja en `@grana/vue`: ni lo exporta ni lo registra su `install` (DECISIONS #742). Quien no lo usa no lo paga.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Hero from '@grana/vue/hero'
import '@grana/vue/style.css'          // el CSS del héroe ya está en esta hoja única

createApp(App).use(Grana).use(Hero).mount('#app')   // registra <g-hero>
```

Sin empaquetador, carga `vue.global.js`, `dist/grana.umd.js` y `dist/hero.umd.js` (global `GranaHero`): `app.use(Grana).use(GranaHero)`. En plantillas dentro del HTML (sin compilar), escribe `<g-hero ...></g-hero>`: Vue no admite etiquetas de componente autocerradas.

**Peso.** `GHero` no importa `GBtn` (las acciones son tuyas, por slot). `GLibIcon` (iconos `pause` y `play`) y `utils/keyFocus.js` llegan del principal por `__shared`. Tope de la entrada: 4 KiB gzip (4 096 B). Medido por bruno y anotado en `GHero.meta.json`: **4 007 B** (`dist/hero.js`) y 3 674 B (`dist/hero.umd.js`). Al documentar se volvió a comprimir el `dist/` del árbol con `gzip` (nivel por defecto): 4 022 B, la misma cifra con otro nivel de compresión; sigue bajo el tope, con 74 B de margen. `dist/grana.js` no contiene `GHero`.

## Qué lo hace distinto

El héroe de Grana no es «un rectángulo a sangre con texto encima». Ofrece tres formas (elegidas por el usuario el 2026-10-21, DECISIONS #725 y #729):

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **A · La ventana** (por defecto) | La foto se ve por un **vano de arco** junto al texto, con una segunda ventana de detalle. El texto nunca la toca. Al desplazar la página, la foto se mueve un 3 % **dentro** de su marco («la mirada») | Da forma de lugar a la foto y el contraste no depende de ella |
| **C · El umbral** | Foto a sangre sin nada encima; una **tarjeta** opaca cruza su borde inferior con el título y el hueco de la consulta (slot `consult`) | La reserva es parte de la apertura: el primer gesto de la página ya puede ser reservar |
| **B · Vistas a elegir** | Foto a sangre y una **placa de la zona de marca** que la solapa, con el texto, las acciones y de 2 a 4 vistas con nombre | El visitante pide la habitación por su nombre en vez de recorrer un carrusel. Nada cambia solo |

En los tres, el contraste está garantizado **por construcción** (el texto no toca la foto o vive en una placa opaca) y la foto que importa llega primero.

## Cuándo usarlo

| Necesito | Uso | No uses |
| --- | --- | --- |
| La apertura de una página de un sitio con foto | **`GHero`** | `GPageHeader` (es de aplicación: se pega, lleva migas y no tiene media) |
| El encabezado de una vista de gestión | [`GPageHeader`](../GPageHeader/README.md) | `GHero` (avisa si conviven) |
| Una tarjeta con foto de fondo | [`GCard`](../GCard/README.md) `media="background"` | `GHero` |
| Más de cuatro fotos | La acción secundaria abre [`GGallery`](../GGallery/README.md) | Vistas de B con cinco o más (avisa; se pintan solo cuatro) |
| La consulta de reserva en la apertura | `appearance="threshold"` y [`GBookingBar`](../GBookingBar/README.md) en `consult` | Una barra suelta flotando sobre la foto |
| Texto sobre la foto | B (placa de la zona de marca) | Un velo o degradado |

## Uso

Los textos van todos por props o slots, sin valores por defecto. `title` es obligatorio; `media` lleva `width` y `height` (reservan el hueco) y `alt` o `decorative`.

```vue
<!-- Fragmento: `patio` es una imagen de tu aplicación -->
<template>
  <g-hero
    title="Casa Alcalá"
    eyebrow="Hotel boutique · Centro histórico de Oaxaca"
    lead="Doce habitaciones alrededor de un patio de cantera."
    aside="Desayuno incluido · Llegada desde las 15:00"
    :media="{ src: patio, width: 1600, height: 2000, alt: 'Patio de cantera verde con buganvilias al atardecer' }"
  >
    <template #actions>
      <g-btn size="lg" href="#reservar">Reservar</g-btn>
      <g-btn size="lg" variant="link" href="#habitaciones">Ver habitaciones</g-btn>
    </template>
  </g-hero>
</template>
```

## Ejemplos

### e1 · El hotel que se enseña por un portal (A)

**Por qué:** es la forma por defecto. Úsala cuando una sola foto vertical y fuerte cuenta el lugar. No la uses si tu mejor foto es muy apaisada: el vano es 4:5.

```vue
<!-- Fragmento: `patio` y `copa` son imágenes de tu aplicación -->
<template>
  <g-hero
    title="Casa Alcalá"
    lead="Doce habitaciones alrededor de un patio de cantera."
    :media="{ src: patio, width: 1600, height: 2000, alt: 'Patio de cantera verde con buganvilias', credit: 'Foto: Ana Ruiz' }"
    :detail="{ src: copa, width: 600, height: 600 }"
    frame="arch"
  >
    <template #actions><g-btn size="lg" href="#reservar">Reservar</g-btn></template>
  </g-hero>
</template>
```

`detail` es una segunda ventana **siempre decorativa** (`alt=""`, `aria-hidden`). `frame="rect"` cambia el arco por un rectángulo con el radio de tarjeta; `:look="false"` apaga la mirada.

### e2 · Que el huésped elija la vista de la habitación (B)

**Por qué:** cuando hay de 2 a 4 vistas con nombre y quien visita debe pedir una, no recorrerlas. No lo uses con una sola vista (se pinta como A) ni con más de cuatro (solo cuentan cuatro). En el teléfono la foto va primero y la acción principal queda bajo el pliegue (medido a 390×844): es un riesgo aceptado de esta forma.

```vue
<!-- Fragmento: `fotoJardin`, `fotoPatio` y `fotoTerraza` son imágenes de tu aplicación -->
<script setup>
import { ref } from 'vue'
const vista = ref('jardin')
const vistas = [
  { value: 'jardin',  label: 'Jardín',  media: { src: fotoJardin,  width: 1600, height: 1000, alt: 'Habitación con vista al jardín' } },
  { value: 'patio',   label: 'Patio',   media: { src: fotoPatio,   width: 1600, height: 1000, alt: 'Habitación con vista al patio' } },
  { value: 'terraza', label: 'Terraza', media: { src: fotoTerraza, width: 1600, height: 1000, alt: 'Habitación con terraza' } }
]
</script>

<template>
  <g-hero
    appearance="views"
    title="Habitaciones"
    :media="vistas[0].media"
    :views="vistas"
    v-model:view="vista"
    :labels="{ views: 'Elige una vista' }"
  >
    <template #actions><g-btn size="lg" href="#reservar">Reservar</g-btn></template>
  </g-hero>
</template>
```

`labels.views` es el `legend` del grupo de vistas; sin él avisa y el `legend` queda vacío.

### e3 · Reservar desde la propia apertura (C)

**Por qué:** cuando el primer gesto de la página es consultar disponibilidad. **Una sola acción principal:** el envío de la consulta ya es la acción principal de la tarjeta; el slot `actions` lleva, a lo sumo, acciones **secundarias** (`variant="outline"` o `ghost`). Una segunda acción sólida compite con el envío. Esto es una **receta de uso, no una regla del componente**: `GHero` no inspecciona sus slots y no avisa (DECISIONS #762).

```vue
<!-- Fragmento: `patio`, `consulta`, `partyRows` y `labelsConsulta` son de tu aplicación -->
<template>
  <g-hero
    appearance="threshold"
    title="Casa Alcalá"
    lead="Doce habitaciones alrededor de un patio de cantera."
    :media="{ src: patio, width: 2400, height: 1200, alt: 'Fachada de cantera al amanecer' }"
  >
    <template #consult>
      <g-booking-bar v-model="consulta" kind="stay" title="Consulta disponibilidad"
                     :party-rows="partyRows" :labels="labelsConsulta" />
    </template>
    <template #actions>
      <g-btn size="lg" variant="outline" href="#habitaciones">Ver habitaciones</g-btn>
    </template>
  </g-hero>
</template>
```

La consulta va **antes** de las acciones en el orden de foco: la acción envía lo consultado. `GBookingBar` baja un nivel de título respecto al `h1` por sí sola.

### e4 · Con un vídeo de la casa, parable (slot `media`)

**Por qué:** cuando tienes un vídeo corto y mudo. El vídeo no arranca solo con movimiento reducido y siempre tiene una pausa visible. No pongas `autoplay`: el héroe llama a `play()` o `pause()` según `paused`, y un `<video autoplay>` avisa.

```vue
<!-- Fragmento: `portada` y `casaMp4` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
const enPausa = ref(false)
</script>

<template>
  <g-hero title="Casa Alcalá" v-model:paused="enPausa" :labels="{ pause: 'Pausar el vídeo' }">
    <template #media>
      <video muted playsinline loop :poster="portada" width="1600" height="2000">
        <source :src="casaMp4" type="video/mp4">
      </video>
    </template>
    <template #actions><g-btn size="lg" href="#reservar">Reservar</g-btn></template>
  </g-hero>
</template>
```

El botón de pausa tiene un **nombre constante** (`labels.pause`) y expresa el estado con `aria-pressed`; lo único visible es el icono, que cambia entre `pause` y `play`. Sin `labels.pause` avisa y el botón se pinta igual (la salida es obligatoria).

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `title` | String | **obligatoria**; nombra la región | — |
| `eyebrow` | String | antetítulo (`dir="auto"`) | sin valor |
| `lead` | String | bajada (`dir="auto"`) | sin valor |
| `aside` | String | dato al pie del contenido (`dir="auto"`) | sin valor |
| `headingLevel` | Number | `1` `2` | `1` |
| `appearance` | String | `window` `views` `threshold` | `window` |
| `media` | Object | `{ src, srcset?, sizes?, width, height, alt?, decorative?, credit? }` | sin valor |
| `detail` | Object | solo `window`: `{ src, srcset?, sizes?, width, height }` | sin valor |
| `frame` | String | solo `window`: `arch` `rect` | `arch` |
| `look` | Boolean | solo `window`: la mirada | `true` |
| `views` | Array | solo `views`: de 2 a 4 `{ value, label, media }` | `[]` |
| `view` (`v-model:view`) | String \| Number | `value` de la vista elegida | la primera |
| `paused` (`v-model:paused`) | Boolean | solo con un `<video>` en el slot `media` | `true` con movimiento reducido, si no `false` |
| `priority` | Boolean | `fetchpriority="high"` en la foto principal | `true` con `headingLevel` 1; `false` con 2 |
| `labels` | Object | `{ views, pause }` | `{}` |
| `id` | String | base de los `id` | generado |

- **`media`:** `width` y `height` son **obligatorios** (reservan el hueco; avisa si faltan). Con `alt` es informativa; con `decorative: true` lleva `alt=""`; sin ninguno de los dos avisa y se pinta con `alt=""`. `srcset` y `sizes` pasan tal cual. `credit` se pinta en un `figcaption`. La `img` lleva `loading="eager"`, `decoding="async"` y, con `priority`, `fetchpriority="high"`.
- **`priority`:** ninguna otra imagen del héroe lleva `fetchpriority="high"` (ni el detalle de A ni las vistas de B). Dos héroes con `priority` en el documento avisan.
- **`headingLevel`:** el tamaño del título **no** sigue al nivel (DECISIONS #196): siempre es fluido. Con `1`, avisa si ya hay otro `h1` en el documento (con un `GPageHeader`, el mensaje lo dice: no conviven).
- **`appearance`, `frame`, `look`, `detail`, `views`:** fuera de su apariencia se ignoran y avisan una vez. `views` con menos de 2 vistas se pinta como `window`.
- **`views`:** cada vista es una `img` estable que cambia de clase (así hay fundido). Mientras la foto principal no ha cargado, las demás no llevan `src`; después lo reciben con `fetchpriority="low"`. Si eliges una antes, esa se pide al instante.
- **`paused`:** solo existe si el slot `media` trae un `<video>`. Con `v-model:paused` se sincroniza con tu aplicación; sin él, es interno.
- **`labels`:** sin valores por defecto. `labels.resume` está retirado (DECISIONS #756): se ignora.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`): van a la raíz `section`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:view` | `String \| Number` | La persona elige una vista (radio de B): el `value` de la vista |
| `update:paused` | `Boolean` | La persona pulsa la pausa del vídeo: `true` en pausa |

## Slots

| Slot | Contenido |
| --- | --- |
| `actions` | Acciones (`GBtn size="lg"`), en `div.g-hero__actions` |
| `consult` | Solo `threshold`: la consulta (`GBookingBar`) entre la bajada y las acciones. Fuera de `threshold` se ignora y avisa |
| `media` | Sustituye a la foto: un `<video muted playsinline loop poster width height>` sin `autoplay`. En A va dentro del marco |
| `eyebrow`, `lead`, `aside` | Sustituyen al texto de su prop (sin elementos interactivos) |

## Teclado y foco

El título y el antetítulo no son enfocables. Sin manejadores de teclado propios salvo los nativos.

| Tecla | Efecto |
| --- | --- |
| Tab | Recorre, en este orden: (C) la consulta · la acción principal · las secundarias · (B) el grupo de vistas, **una sola parada** · (con vídeo) la pausa |
| ← → ↑ ↓ | (B) Cambian la vista elegida (radios nativos); el foco se queda en el radio |
| Intro / Espacio | Activan la pausa del vídeo y las acciones |

En WebKit los radios de B llevan `data-g-key-focus` para que el foco se vea al llegar con las flechas.

## Accesibilidad

- a. **Región con nombre.** `section` con `aria-labelledby` al título (APG *Landmark Regions*); sin `role` propio. Un `aria-label` o `aria-labelledby` tuyo lo sustituye (desaconsejado). `prueba`: `GHero.test.js`, 29 de 29, en verde al documentar.
- b. **Contraste del texto por construcción.** Antetítulo, título, bajada, dato, crédito, `legend` y nombre de vista ≥ 4,5:1 (mínimo 5,68:1) y borde de la vista ≥ 3:1, con ocho temas, claro y oscuro, y las tres apariencias en Chromium (tres temas en Firefox y WebKit). `medido`: [`auditoria-verificar.mjs`](../../../../../design/lab/hero/auditoria-verificar.mjs), ver «Verificación».
- c. **Pausa del vídeo.** 44 × 44 px; sobre las fotos de prueba «cielo», «noche» y «papel picado», el peor caso por píxeles es **4,34:1** en Chromium y 5,97:1 en Firefox y WebKit (mínimo exigido 3:1); el anillo de foco va sobre un halo de `--g-color-surface` (17,4:1), nunca sobre la foto. `medido` (mismo verificador).
- d. **Nada cambia solo (WCAG 2.2.2).** Ni carrusel ni rotación. El vídeo tiene pausa visible y arranca en pausa con movimiento reducido. Sin `aria-live`.
- e. **Nombre constante de la pausa (2.5.3).** `labels.pause` no cambia; el estado va en `aria-pressed`.
- f. **Foco visible** tras Tab y flechas en los tres motores (WebKit con Opción+Tab y `data-g-key-focus`), ≥ 3:1 contra la placa en tres temas, claro y oscuro. `medido`.
- g. **Puntero grueso:** vistas y pausa ≥ 44 px. `medido`.
- h. **Reflujo y RTL.** Sin desplazamiento horizontal a 1440, 390, 320 y 320×256 (zoom del 400 %), en LTR y RTL; el vano 4:5 no pasa de 80 % del alto del visor. `medido`.
- i. **Colores forzados.** En Chromium, la placa y la tarjeta llevan borde `CanvasText`, la vista elegida va en `Highlight` y la pausa en `ButtonText`. `medido` solo en Chromium.
- j. **Orden del DOM:** contenido antes que la foto.

> **Peligro.** Una `media` informativa sin `alt` (y sin `decorative: true`) se pinta con `alt=""`: quien usa un lector de pantalla se pierde la foto que vende el lugar. El componente solo avisa en desarrollo; el `alt` es tuyo. Igual con las vistas de B: cada `media` de una vista necesita `alt`.

## Personalidad

Dos movimientos, ambos con tokens y sin muelle ni rebote (DECISIONS #728, #299):

- **La mirada (A, `look`):** con soporte de `animation-timeline: view()` y sin movimiento reducido, la foto se desplaza ≤ 3 % de su alto dentro de su marco mientras la página atraviesa el visor. Lineal, solo `transform`; marco y texto se desplazan con la página sin desviarse entre sí (Δ < 1 px, medido); solo la foto se mueve dentro. Sin soporte, la foto queda **quieta**. `:look="false"`, el vídeo y el movimiento reducido la apagan.
- **El fundido de B:** al elegir una vista, la nueva funde sobre la anterior en `--g-duration-slow` con `--g-ease-out` (con movimiento reducido, `--g-duration-fast`). No hay vacío: a mitad, la anterior sigue opaca; elegir otra a mitad parte del estado actual.

## Tema

`GHero` solo lee `var(--g-*)`. Tokens (lista exacta de `GHero.css`, DECISIONS #759):

- **Color:** `--g-color-bg` (página y muro de A), `--g-color-surface` (tarjeta de C y relleno de la pausa), `--g-color-surface-sunken` (marco mientras carga), `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-control` (borde de las vistas), `--g-color-focus`.
- **Forma y sombra:** `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-*`, `--g-shadow-1` (pausa), `--g-shadow-2` (tarjeta de C), `--g-press-scale`.
- **Tipografía:** `--g-text-title-lg-size`, **`--g-hero-title-max`** (tope del título, token propio del componente; su valor por defecto lo deriva `defaults.css` de `--g-text-display-size`), `--g-text-title-sm-size`, `--g-text-title-sm-line`, `--g-text-display-weight`, `--g-text-display-tracking`, `--g-font-display`, `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-font-ui`.
- **Espacio y movimiento:** `--g-space-*`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-standard`.

El título es fluido: `clamp(--g-text-title-lg-size, 7.5cqi, --g-hero-title-max)`, con interlineado 1,08 y `text-wrap: balance`; nunca baja de `title-lg`. Mide su caja (`container-type: inline-size`), no el visor: no hay puntos de corte. La placa de B lleva `data-g-zone="brand"` fijo (la foto queda fuera de la zona), y dentro de ella la acción principal se invierte sola. `--g-color-border-strong`, `--g-ease-spring` y `--g-ease-bounce` **no** se leen.

## Clases

`g-hero`, `g-hero--appearance-{window|views|threshold}`, `g-hero--frame-{arch|rect}`, `g-hero--has-detail`, `g-hero--has-video`, `g-hero--look`, `is-paused`; contenido: `g-hero__content`, `__eyebrow`, `__title`, `__lead`, `__consult`, `__actions`, `__aside`; media: `__media`, `__frame` (solo A), `__img`, `__detail`, `__credit`, `__motion` y `__motion-label`; B: `__plate`, `__views`, `__views-legend`, `__view` (con `is-current`), `__view-input`, `__view-thumb`, `__view-label`, `__layer`; C: `__card`.

## Avisos de desarrollo

Prefijo `[Grana GHero]`, una vez por instancia y motivo, solo fuera de producción:

1. Sin `title`.
2. `media` (o una vista) sin `width`/`height`.
3. `media` sin `alt` ni `decorative`; vista sin `alt`.
4. Otro `h1` en el documento con `headingLevel` 1.
5. Más de un `GHero` con `priority`.
6. `frame`, `look` o `detail` sin `window`; `views` sin `appearance="views"`; slot `consult` sin `threshold`.
7. `views` con menos de 2 o más de 4 entradas, o con `value` repetido.
8. `appearance="views"` sin `labels.views`.
9. `<video autoplay>` en el slot `media`.
10. Vídeo sin `labels.pause`.

## Alcance

Lo que `GHero` no hace, por diseño o por reserva:

- **Una sola foto prioritaria por página** y **sin fondo CSS**: la foto es una `img` para que el navegador la priorice (DECISIONS #725 a #729).
- **Sin carrusel ni rotación:** no existe autoavance; B es una elección de la persona.
- **Sin texto sobre la foto:** no hay velo ni degradado; `--g-card-scrim` no se reutiliza.
- **No inspecciona sus slots:** la receta de una sola acción principal en C (e3) no se impone ni avisa (#762).
- **Reservado** (no existe hoy): la **cabecera transparente sobre el héroe** (necesitaría una enmienda de `GAppShell`, DECISIONS #745); una prop `zone` (la placa de B es fija); el **vídeo de terceros** (sería un componente propio).
- **Límites aceptados:**
  - La mirada **no existe en Firefox** (sin `animation-timeline`): la foto queda quieta.
  - **B en el teléfono** pone la foto primero y la acción principal bajo el pliegue (medido a 390×844).
  - **C con `consult`:** la acción principal es el envío de la consulta; las acciones del héroe deberían ser secundarias (receta, no regla).

## Verificación

- **Pruebas** (vitest, jsdom): `GHero.test.js`, **29 de 29** en verde, ejecutadas de nuevo al documentar. `prueba`.
- **Auditoría de coco** con el componente real (`dist/hero.umd.js`, banco `packages/vue/playground/hero.html`) y temas distintos al por defecto (terracota, añil, pálida; stripe, apple, spotify y lustre): `node design/lab/hero/auditoria-verificar.mjs`. El informe (2026-10-21) registra **1114 de 1114** en Chromium, Firefox y WebKit. `medido` (cifra del informe) y que **se repitió al documentar** sobre el árbol actual: **1114 de 1114** (`medido`, 2026-10-21, tres motores).
- **Banco de estilo** (`estilo-verificar.mjs`): 811 de 811 en Chromium, según el informe. **Specs de bruno** (`tests/hero.spec.mjs`): en verde en los tres motores, según el informe (WebKit con un worker). No se corrieron al documentar.
- **Empaquetado** (al documentar): `dist/grana.js` no contiene `GHero`; `dist/hero.js`, `dist/hero.umd.js` y `dist/hero.d.ts` existen.
- **Rúbrica de movimiento:** propósito, comodidad, estabilidad, transiciones, control y accesibilidad, **cumple**; rendimiento, **parcial** (solo `transform`/`opacity` y `animation-timeline` sin JS; el LCP con fotos reales no se midió).
- **Hallazgo corregido en la auditoría:** el vídeo (y una foto vertical) en el vano de A estiraba el arco fuera del visor; corregido por coco en `GHero.css` (H-A1) y medido.
- **Pendientes abiertos:** ninguno propio de este componente en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## No verificado

- **Zoom de solo texto al 200 %** con el título fluido.
- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): solo se comprobó el marcado y el árbol de accesibilidad.
- **LCP con fotos reales** y **un vídeo real con fuente**: el banco usa un `poster` sin fuente.
- **La mirada en Safari real** (se midió con el WebKit de Playwright).
- **`forced-colors` en Firefox y WebKit:** Playwright solo lo emula en Chromium.
- **Táctil real.**

## Fuentes

API: [`GHero.meta.json`](./GHero.meta.json) · Contrato: [`design/contracts/hero.md`](../../../../../design/contracts/hero.md) (DECISIONS #725 a #729, #742, #744, #745, #755, #756, #759 y #762) · Ronda de kiwi: [`design/lab/hero/r01/`](../../../../../design/lab/hero/r01/) · Estilo: [`design/lab/hero/estilo.md`](../../../../../design/lab/hero/estilo.md) · Auditoría: [`design/lab/hero/auditoria.md`](../../../../../design/lab/hero/auditoria.md) · Pruebas: `GHero.test.js`, `design/lab/theme-playground/tests/hero.spec.mjs`
