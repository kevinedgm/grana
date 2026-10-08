# GBreadcrumbs

Migas de pan: dicen **dónde está la página dentro de una jerarquía** y dejan **subir a cualquier nivel** (Inicio · Laboratorio central · Muestras · 2026 · Lote 2026-0412 · Muestra M-0007). Donde tu aplicación lo sabe, dejan además **moverse de lado** (del lote 0412 al 0413) sin subir y volver a bajar. La ruta es un dato de tu aplicación (`items`); el componente no conoce ningún router, no pide datos y no navega por su cuenta más allá del `href`: emite `navigate` con el evento nativo cancelable. Todo destino es un `<a href>` de verdad (pestaña nueva, URL al pasar, clic central), y todo texto lo pones tú en `labels` y en los datos.

**Etiqueta:** `<g-breadcrumbs>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/breadcrumbs/auditoria.md`](../../../../../design/lab/breadcrumbs/auditoria.md)) · **Desde:** 0.1.0 · **Entrada:** principal, `@grana/vue`

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GBreadcrumbs`, `#sec-breadcrumbs`). Exige Vue `^3.5.0` (usa `useId`) y un navegador actual.

## Instalación: paquete principal

`GBreadcrumbs` viaja en `@grana/vue`: lo exporta y lo registra su `install`. Importado solo (`import { GBreadcrumbs } from '@grana/vue'`), el componente está marcado como puro y quien no usa el resto no lo carga.

```js
import { createApp } from 'vue'
import Grana, { GBreadcrumbs } from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')    // registra <g-breadcrumbs>
// o, sin plugin: components: { GBreadcrumbs }
```

Sin empaquetador, `<g-breadcrumbs>` queda registrado al cargar `dist/grana.umd.js` (global `Grana`) y hacer `app.use(Grana)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-breadcrumbs ...></g-breadcrumbs>`.

**Peso (DECISIONS #490).** El tope para ir en el principal era de 8 KB gzip; bruno anotó el 2026-10-07 en `GBreadcrumbs.meta.json` **+6,3 KB gzip** en `grana.js` (179 506 → 185 840 B), +5,7 KB en `grana.umd.js` y +1,9 KB en `grana.css`, medido en el mismo árbol. No se remidió al documentar. Si en el futuro la suma de los componentes de la Fase C supera lo previsto, vuelve a lima (DECISIONS #506); la salida a entrada propia `@grana/vue/breadcrumbs` estaba decidida de antemano y no hizo falta.

## Qué lo hace distinto

Forma **A «Ruta líquida»**, elegida por el usuario el 2026-10-07 mirando los prototipos de kiwi (`design/lab/breadcrumbs/r01/`, DECISIONS #491), con **la cara de B «Subir · página»** como su última etapa y **las puertas de C** cuando tu aplicación da `children`.

Las migas habituales esconden niveles tras un «…» para caber. `GBreadcrumbs` no esconde la ruta:

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **Ruta líquida (A)** | Todos los niveles siguen en la fila y se **aprietan por prioridad**: primero los de en medio, luego el padre; la raíz queda entera o en su icono, nunca a medias, y la página actual se acorta la última. Un nombre recortado se vuelve **pastilla**; el actual es la pastilla de acento («estás aquí») | A 560 px caben **seis de seis niveles**, visibles, en el árbol de accesibilidad y en el Tab. La pastilla solo aparece donde falta texto |
| **La miga con foco se despliega** | La que recibe el foco **por teclado** muestra su nombre entero en su sitio (las vecinas se aprietan). Sin transición de tamaño | Quien tabula lee cada nombre sin pasar el puntero |
| **La ruta se extiende y se recoge** | Al navegar en una aplicación de una sola página, el nivel nuevo **sale de detrás del anterior**; al subir, el último se recoge hacia el anterior | Se ve de dónde sale el lugar nuevo |
| **La última etapa, «Subir · página» (cara de B)** | Cuando ni las pastillas caben, la fila se convierte en una pastilla `arrow-up` con el nombre del padre (lleva al antepasado más cercano con página) y el nombre de la página como divulgación que abre **la ruta entera como una escalera vertical** | No queda un «…» que adivinar, queda la acción que se hace: subir. «+N» **no existe** |
| **Puertas (C)** | Con `children`, el separador entre dos niveles se vuelve **botón** que abre los hermanos del nivel siguiente, con el de la ruta marcado | Moverse de lado sin subir y bajar. Sin datos, el separador sigue siendo decorativo: se enciende sola, sin prop |

**Con `prefers-reduced-motion: reduce` nada se desplaza ni gira.** Nada se anima al montar, ni al cambiar de etapa, ni en el despliegue por foco.

## Uso

### Lo mínimo

```vue
<script setup>
const ruta = [
  { label: 'Inicio', href: '/', icon: 'house' },
  { label: 'Laboratorio central', href: '/lab' },
  { label: 'Muestras', href: '/lab/muestras' },
  { label: 'Lote 2026-0412', href: '/lab/lotes/0412' },
  { label: 'Muestra M-0007' }          // el último nivel es siempre la página actual
]
const textos = {
  nav: 'Ruta de navegación',
  up: 'Subir a {label}',
  path: 'Ruta hasta {label}'
}
</script>

<template>
  <g-breadcrumbs :items="ruta" :labels="textos"></g-breadcrumbs>
</template>
```

`labels` no tiene valores por defecto (Grana es internacional). `nav` es obligatorio siempre; `up` y `path`, con dos o más niveles (la última etapa puede llegar en cualquier ancho); `children`, si hay puertas. Un `icon` es un **nombre** de Lucide que resuelve tu aplicación con su registro (`createIcons`, DECISIONS #202); `house` no está en la lista de la librería, la registras tú.

### Con puertas a los hermanos

```vue
<g-breadcrumbs
  :items="[
    { label: 'Inicio', href: '/', icon: 'house' },
    { label: 'Laboratorio central', href: '/lab' },
    { label: 'Muestras', href: '/lab/muestras' },
    { label: '2026', children: lotesDe2026 },        // sin página: texto; sus hijos encienden una puerta
    { label: 'Lote 2026-0412', href: '/lab/lotes/0412' },
    { label: 'Muestra M-0007', href: '/lab/muestras/m-0007' }
  ]"
  :labels="{
    nav: 'Ruta de navegación',
    up: 'Subir a {label}',
    path: 'Ruta hasta {label}',
    children: 'Otras páginas en {label}'
  }"></g-breadcrumbs>
```

`children` está en el nivel *i − 1* y enciende una puerta **delante** del nivel *i*, con los hermanos `{ label, href? }` de ese nivel. `lotesDe2026` sería, por ejemplo, `[{ label: 'Lote 2026-0411', href: '/lab/lotes/0411' }, { label: 'Lote 2026-0412', href: '/lab/lotes/0412' }, …]`. En el último nivel no se pinta (avisa). Las puertas se pintan solo en las etapas de fila, no en `step`.

### Con un router: `navigate` cancelable

```vue
<g-breadcrumbs :items="ruta" :labels="textos"
               @navigate="({ item, event }) => { event.preventDefault(); router.push(item.href) }"></g-breadcrumbs>
```

`navigate` se emite con el evento nativo del clic, **cancelable**: `preventDefault()` deja la navegación a tu router. Solo con activación primaria (ver «Eventos»).

### Con `RouterLink` o `NuxtLink`: slot `link`

```vue
<g-breadcrumbs :items="ruta" :labels="textos">
  <template #link="{ item, attrs, content }">
    <RouterLink :to="item.href" v-bind="attrs"><component :is="content" /></RouterLink>
  </template>
</g-breadcrumbs>
```

Un solo slot para todos los `<a>` (fila, «Subir», escalera y puertas). El elemento debe ser **un solo enfocable**, recibir `v-bind="attrs"` y llevar `<component :is="content" />` como único contenido. Detalles en «Slots».

### Icono propio de un nivel: slot `icon`

```vue
<g-breadcrumbs :items="ruta" :labels="textos">
  <template #icon="{ item }">
    <MiIcono :name="item.icon" />
  </template>
</g-breadcrumbs>
```

Manda sobre el `GIcon` por nombre de `item.icon`; va dentro de un hueco `aria-hidden` (decorativo).

## Qué es y qué no (fronteras)

| Componente | Frontera |
| --- | --- |
| [`GSidebar`](../GSidebar/README.md) | La barra lateral dice **la sección**; las migas, **la profundidad**. Conviven (receta: barra lateral y migas en la cabecera). Comparten el contrato de enlaces (`href` + `navigate` cancelable) |
| [`GStepper`](../GStepper/README.md) | El stepper es un **proceso** (orden temporal, estado de cada paso); las migas, un **lugar**. Ni círculos, ni conectores, ni estados de paso |
| [`GMenu`](../GMenu/README.md) | No se usa: `GMenu` es de **acciones**; la escalera y las puertas son **enlaces** |
| [`GTabs`](../GTabs/README.md) | Las pestañas cambian de panel en la misma página; las migas cambian de página |
| [`GPagination`](../GPagination/README.md) | Mismo patrón de `nav` + lista, `aria-current="page"` y `labels.nav` obligatorio |

**Lo que no hace:** no mueve el foco al navegar (llevarlo al `h1` de la página nueva es de tu aplicación), no genera datos estructurados (`BreadcrumbList` es SEO de tu aplicación), no lleva `title` y no tiene separador configurable.

## Cesión: las cuatro etapas

El componente elige entre cuatro etapas, en este orden, la primera que cabe. **Solo el ancho de su propio `nav` decide** (no hay umbrales ni `@container` que configurar).

| Etapa (`data-stage`) | Qué cambia | Cuándo existe |
| --- | --- | --- |
| `liquid` | Todos los niveles en la fila; se comprimen en CSS por prioridad | Siempre |
| `root-icon` | La raíz pasa a **solo su icono** (el nombre sigue en el árbol con el patrón de texto oculto accesible) | Si la raíz tiene `icon` y hay dos o más niveles |
| `shrink` | El actual también se acorta (hasta un suelo de `8ch`) | Siempre |
| `step` | La cara de B: «Subir · página» | Con dos o más niveles |

- **Compresión en `liquid`:** cada `li` cede con un peso de `flex-shrink` por papel (en medio `100000`, padre `30`, actual `0`, y `1` en `shrink`; la raíz no cede). Una pastilla muestra como mínimo **`3ch`** de nombre y el nombre de cualquier nivel salvo el actual se corta a **`20ch`** con elipsis (un nombre largo es pastilla incluso a 1100 px). Con un solo nivel, el actual se acorta sin suelo.
- **Una fila, un alto:** las migas nunca se parten en dos líneas y la raíz mide **lo mismo en todas las etapas** (Δ0): `max(24px, space × 7, body-sm-line)`, y `max(44px, …)` con puntero grueso.
- **Medida por lotes:** una lista de medida inerte (`aria-hidden`, `inert`, sin ids ni slots) prueba las etapas; una cabe si la suma de los anchos de sus niveles ≤ el ancho de la lista + 0,5 px. El DOM real solo cambia si cambia la etapa. La medida corre un cuadro después del aviso del observador (medir dentro del callback provoca el bucle de `ResizeObserver` en WebKit) y se repite al cambiar `items` y al cargar las fuentes (`document.fonts`).
- **`data-clipped`** marca cada nivel cuyo nombre está recortado (`scrollWidth > clientWidth + 1`); solo cambia su fondo (la pastilla), nunca su tamaño.
- **Al cambiar de etapa** se cierra lo abierto sin devolver el foco y **el foco se conserva por nivel**: de un enlace de la fila a «Subir» o a la divulgación y de vuelta; de una puerta, a la divulgación. Cambiar de etapa nunca se anima.
- **Primer pintado** (también en SSR): `liquid`, con la lista recortando su desbordamiento hasta que la raíz tenga `is-ready` (un cuadro después de la primera etapa aplicada).

**Medido en la auditoría** (fuente servida, los tres motores, ruta de seis niveles): 1100, 720, 560 y 480 px en `liquid` con seis de seis; 400 px en `shrink` con seis de seis en la fila y **cinco enlaces en el Tab**; 320, 260 y 240 px en `step` con **dos paradas**. Con puertas: 1100, 720 y 560 en `liquid`, 400 y 320 en `step`. Un barrido de 1100 a 200 px y de vuelta (de 10 en 10, LTR y RTL, con y sin puertas) recorre las etapas en orden, vuelve a `liquid` al ensanchar y mantiene **un solo alto**. Con el tema de la auditoría (Georgia de 19 px, `space` 3) 480 px pasa a `root-icon` en Firefox y WebKit y sigue en `liquid` en Chromium (ver «Limitaciones conocidas»).

## La última etapa: «Subir · página»

- **«Subir»** es un `a` al **antepasado más cercano con `href`** (normalmente el padre), con `arrow-up` y el nombre de ese nivel; nombre accesible `labels.up`. Emite `navigate` con `from: 'up'`. Si ningún antepasado tiene `href`, no se pinta.
- **La divulgación** es un `button` con el **nombre de la página** y `chevron-down`; nombre accesible `labels.path`; `aria-expanded` y `aria-controls`. Abre **la escalera**: todos los niveles en orden, cada uno más adentro (sangría `space × 4` por nivel), una guía en L de borde entre escalones y el actual con `aria-current="page"` y una barra `accent-text`. Los nombres se **parten en líneas** (no se recortan); los niveles sin página son texto; **no hay puertas en la escalera**.
- **Dos paradas de Tab** a cualquier ancho. La cara no cede: solo recorta los dos nombres.
- La divulgación es **la misma pastilla de acento** que el actual de la fila: el marcador de «estás aquí» se reconoce en cualquier etapa.

## Puertas (cuando hay `children`)

- Una puerta sustituye al separador decorativo delante de un nivel cuando el anterior trae `children` no vacío. Es un `button` (`type="button"`, `aria-expanded`, `aria-controls`) con `chevron-right`; nombre accesible `labels.children` con `{label}` = el nivel cuyos hermanos abre. Abre una lista de **enlaces** (texto si el hijo no tiene `href`).
- **El hijo de la ruta** lleva `aria-current="true"` y un `check` decorativo (nunca `page`, que es solo del último nivel de la fila). Coincidencia: mismo `href` si los dos lo tienen; si no, mismo `label`. Si ninguno coincide, nada se marca.
- **En reposo** la puerta es «entornada» (DECISIONS #498, decisión de coco): el mismo chevron dentro de un hueco redondo `neutral-soft`, un tono más fuerte que el separador; al pasar aparece un marco `border-control`; abierta, el chevron gira 90° hacia su panel (−90° en RTL) y toma `accent-soft`. Se distingue del separador por forma, tono y cursor.
- **Cuesta una parada de Tab por puerta**, por eso solo existe con datos; con puntero grueso cada puerta suma 44 px a la fila y la fila cede antes.

## Paneles (escalera y puertas)

`popover="manual"` en la capa superior, dentro del `nav` (viven en cabeceras con `overflow: hidden`). Debajo del disparador, alineados a su inicio y, si no caben, a su final (arriba si abajo no cabe). Cumplen las cuatro reglas de los paneles anclados estables (DECISIONS #358): lado con histéresis, alto máximo fijo mientras se desplaza, cierre sin devolver el foco si el ancla sale del visor o de su contenedor, y la lista no se desplaza con el puntero quieto.

- **Uno abierto a la vez** en la instancia.
- **Abrir no mueve el foco** (se queda en el disparador); ↓ lo lleva dentro.
- **Se cierran** con Esc (el foco vuelve al disparador), pulsando el disparador, pulsando fuera (sin mover el foco), cuando el foco sale, al cambiar de etapa, al salir el ancla del visor y al elegir un destino.
- **Esc** cierra el panel con `preventDefault()` y `stopPropagation()`: **no** llega a un `GDialog` ancestro. Medido: dentro de un `GDialog`, el primer Esc cierra la puerta y el segundo, el diálogo.

## Teclado

| Tecla | Dónde | Acción |
| --- | --- | --- |
| Tab / Mayús + Tab | Fila | Recorre los enlaces y las puertas en el orden del documento; un nivel sin página no es parada |
| Intro | Enlace | Navega (nativo) y emite `navigate` |
| Intro / Espacio | Puerta, divulgación | Abre o cierra; el foco se queda en el botón |
| ↓ | Puerta | Abre (si está cerrada) y enfoca **el hijo de la ruta** (o el primero si ninguno coincide) |
| ↓ | Divulgación | Abre (si está cerrada) y enfoca el primer escalón con enlace |
| ↑ / ↓ | Dentro del panel | Enlace anterior / siguiente, circular |
| Inicio / Fin | Dentro del panel | Primer / último enlace |
| Esc | Disparador o panel | Cierra y devuelve el foco al disparador; si solo hay pista abierta, la cierra |
| Tab | Dentro del panel | Recorre los enlaces del panel y, desde el último, sale y cierra |

El panel va inmediatamente después de su disparador en el DOM (la puerta, dentro de su `li`; la escalera, después de la cara), así el orden del Tab es el del documento.

## Pista del nombre entero

El nombre entero de un nivel recortado vive en el DOM y en el árbol de accesibilidad; la pista **solo lo enseña a quien ve**. Usa el modo visual del motor de [`GTooltip`](../GTooltip/README.md) (DECISIONS #433 y #496): nodos `g-tooltip` `aria-hidden`, sin rol ni id, al final del `nav` (nunca dentro del `ol`). Nunca `title`.

- Hay uno por nivel de la fila, uno por puerta y, en `step`, uno para «Subir» y otro para la divulgación.
- Está **activa solo cuando el nombre no cabe entero** (medido al pedirla) o en la raíz en solo icono; **la puerta, siempre** (es un control de solo icono: la pista ayuda a descubrirla).
- Comportamiento del motor: 350 ms con el puntero, al instante con el foco por navegación; Esc la cierra sin mover el foco; **viaja** entre niveles y puertas (grupo `nav`); en táctil, la **pulsación larga** muestra el nombre y soltar no activa; se cierra al abrir un panel.
- Con el foco por teclado, el despliegue ya se aplicó: la pista solo sale si **ni desplegado** cabe el nombre.
- Un **nivel sin página** recortado (texto, no enfocable) tiene pista con el puntero; con teclado no se llega a ella (el nombre entero está en el árbol).

## Props

| Prop | Tipo | Valores | Por defecto | Obligatoria |
| --- | --- | --- | --- | --- |
| `items` | Array | niveles `{ label, href?, icon?, children? }`, de la raíz a la página actual | — | **sí** |
| `labels` | Object | `{ nav?, up?, path?, children? }`: cada uno, cadena con `{label}` o función `({ label }) => String` | `{}` | no |

**No existen:** `to`, `router`, `separator`, `maxItems`, `itemsBefore`, `itemsAfter`, `size`, `density`, `modelValue` (la ruta es dato de tu aplicación) ni `id` (los ids internos salen de `useId()`).

### Modelo de `items`

| Campo | Tipo | Notas |
| --- | --- | --- |
| `label` | String | Texto visible y nombre accesible. Un nivel sin `label` (o vacío) se ignora y avisa |
| `href` | String | Con `href` el nivel es un `<a>`; sin `href` es **texto** (`span`, sin foco, sin cursor de enlace): una agrupación sin página, como «2026» |
| `icon` | String | Nombre de Lucide (tu registro y, si no, la lista de la librería). Pensado para la raíz; vale en cualquier nivel. Con el slot `icon`, manda el slot |
| `children` | Array | `[{ label, href? }]`: hermanos del nivel **siguiente**; enciende una puerta delante de él. Un hijo sin `label` se ignora (avisa); sus `icon` y `children` se ignoran. En el último nivel no se pinta (avisa) |

- **El último nivel es siempre la página actual** (`aria-current="page"`). La ruta que no incluye la página queda reservada.
- Cualquier otro campo del nivel se conserva y llega a los slots.
- **Clave** de cada nivel: su índice. **Identidad** para el movimiento: su `href` o, sin él, su `label`.
- `items` vacío o que no es un arreglo: **no se pinta nada** (ningún `nav` vacío en el árbol) y avisa.

### `labels`

Sin valores por defecto. Cada uno es una **cadena** con el marcador `{label}` o una **función** `({ label }) => String`.

| Clave | Uso | `{label}` es | Requerido |
| --- | --- | --- | --- |
| `nav` | Nombre del `nav` (`aria-label`) | — | **Siempre**, salvo `aria-labelledby` en los atributos |
| `up` | Nombre del enlace «Subir» | el nivel al que sube | Con dos o más niveles |
| `path` | Nombre de la divulgación de la página | la página actual | Con dos o más niveles |
| `children` | Nombre de cada puerta | el nivel cuyos hijos abre (el *i − 1*) | Si hay al menos una puerta |

- **Etiqueta en el nombre (WCAG 2.5.3):** el texto visible de «Subir» es el nombre del padre y el de la divulgación es el nombre de la página; por eso `up` y `path` **deben contener `{label}`** (avisa si una cadena no lo trae; con función, es cosa tuya). La puerta no tiene texto visible.
- **Atributos** (`inheritAttrs`): `class`, `style`, `id`, `data-*` y `aria-*` van a la raíz `nav`. Un `aria-labelledby` (un encabezado visible) sustituye a `labels.nav`. Con varias migas en la misma página, dales `nav` distintos.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ item, index, event, from }` | Activación **primaria** de un destino con página |

- **Primaria** (DECISIONS #505, regla común de los enlaces con `navigate`): clic con el botón 0 **sin Ctrl, ⌘, Mayús ni Alt**, o Intro. Con modificadores o clic central **no se emite** y no cierra paneles: abrir en pestaña nueva es del navegador, y si cancelaras para tu router, lo romperías.
- `item` es el nivel, o el **hijo** si `from === 'door'`; `index` es la posición en `items` del nivel destino (con `door`, la del nivel delante del cual está la puerta); `event` es el evento nativo, cancelable; `from` es `'path'` (la fila), `'up'` («Subir»), `'stairs'` (la escalera) o `'door'` (una puerta).
- **Desde un panel**, el panel se cierra y el foco vuelve a su disparador **antes** de emitir: el foco nunca queda en el `body` si cancelas y actualizas `items`.
- **Un nivel sin `href` no emite nada.**
- **Con el slot `link`**, el router navega en su propio manejador y `navigate` se sigue emitiendo, con `event.defaultPrevented` ya verdadero si el router lo canceló.
- Declarado en `emits`: tu `@navigate` no llega a ningún nativo. Sin `update:*`: no hay estado que controles.

**Métodos expuestos:** ninguno.

## Slots

| Slot | Propósito | Alcance |
| --- | --- | --- |
| `link` | Sustituye el `<a>` de cada destino con página (fila, «Subir», escalera y puertas), p. ej. `RouterLink` o `NuxtLink` | `{ item, index, current, from, attrs, content }` |
| `icon` | Icono de un nivel; sustituye al `GIcon` por nombre de `item.icon` | `{ item, index }` |

- **`link`:** `attrs` trae `href`, `class` (las del componente), `aria-current` cuando toca, `aria-label` en «Subir» y `onClick` (emite `navigate` y cierra el panel). `content` es un **componente sin props** que pinta el interior (hueco de icono + nombre con `dir="auto"`; en «Subir», `arrow-up` + el nombre del padre; en una puerta, el `check` del de la ruta). **Reglas:** un solo enfocable, con `v-bind="attrs"` y `content` como único contenido; nada visible añadido (la medida no ve el slot: pinta el `<a>` por defecto con las mismas clases). Los niveles **sin `href`** nunca pasan por el slot. Si el elemento no aplica `attrs`, avisa.
- **`icon`:** va dentro de `g-breadcrumbs__icon` (`aria-hidden`, decorativo), solo en los niveles con `icon`. Un `GIcon` con `label` ahí avisa.
- **No hay** slot por defecto ni slot de separador.

## Movimiento

Con `is-ready` y en una etapa de fila, al cambiar `items` se comparan las identidades:

| Cambio | Qué pasa |
| --- | --- |
| Los nuevos son **los anteriores más uno al final** (bajar) | El último lleva `is-entering`: `translate` desde `space × 3` hacia el inicio (reflejado en RTL) con `--g-duration-slow` y `--g-ease-spring`; opacidad con `--g-duration-press` y `--g-ease-out`. Va **detrás** del anterior y tiene `aria-current="page"` desde el primer cuadro |
| Los nuevos son **los anteriores sin el último** (subir) | Una **copia saliente** inerte (`aria-hidden`, `inert`, sin ids ni `aria-controls`) al final de la lista se recoge hacia el anterior con `--g-duration-press` y `--g-ease-out`, y se retira al terminar |
| Cualquier otro cambio, el montaje o la etapa `step` | **Sin animación** |

Además: la escalera entra escalón a escalón (retardo `--g-duration-fast × min(i, 4) / 4`, acotado) y su divulgación gira 180°; la puerta gira 90° (−90° en RTL); los fundidos de color van con `--g-duration-fast`. `--g-ease-spring` se usa una sola vez, en el `translate` del nivel que llega y dentro de `@supports (transition-timing-function: linear(0, 1))` (DECISIONS #500); `--g-ease-bounce`, nunca.

**Con `prefers-reduced-motion: reduce`:** el nivel que llega solo se funde (`--g-duration-fast`); no hay copia saliente; la escalera aparece entera; los chevrons cambian sin girar y el panel no se desplaza.

**Medido en la auditoría:** nada se anima al cargar; al bajar, `g-breadcrumbs-enter` (240 ms con el muelle) más `g-breadcrumbs-enter-fade` (160 ms), con posición intermedia y terminando en su sitio; `is-entering` se retira a 255 / 244 / 247 ms y la copia saliente a 168 / 168 / 166 ms en Chromium / Firefox / WebKit, por el fin de la animación y no por el respaldo (`--g-duration-slow` + 400 ms y `--g-duration-press` + 400 ms); un cambio que no es bajar ni subir, ninguna clase; un cambio de etapa 720 → 300 → 720 px, ninguna animación.

## Idioma y dirección

- **Cada nombre lleva `dir="auto"`** (niveles, «Subir», la divulgación, la escalera, las puertas y las pistas).
- **RTL:** la fila sigue el orden lógico; los chevrones de separador y puerta llevan `flip-rtl`; la puerta abierta gira −90°; `arrow-up` y `chevron-down` no se espejan; la entrada y la salida de un nivel se reflejan; la escalera sangra hacia el inicio lógico (medido en LTR y RTL, `space × 4` por nivel). Funciona en un bloque `dir="rtl"` dentro de una página LTR. Medido: los barridos de ancho y el alto Δ0 se repitieron en RTL.
- **Sin textos propios** (DECISIONS #226): todo va en `labels` y en los datos.

## Accesibilidad

Etapas de fila:

```html
<nav class="g-breadcrumbs is-ready" aria-label="Ruta de navegación" data-stage="liquid">
  <ol class="g-breadcrumbs__list">
    <li class="g-breadcrumbs__item is-root">
      <a class="g-breadcrumbs__link" href="/"><span class="g-breadcrumbs__icon" aria-hidden="true">…</span>
        <span class="g-breadcrumbs__label" dir="auto">Inicio</span></a>
    </li>
    <li class="g-breadcrumbs__item is-mid">
      <svg class="g-breadcrumbs__sep g-icon--flip-rtl" aria-hidden="true">…</svg>
      <a class="g-breadcrumbs__link" href="/lab"><span class="g-breadcrumbs__label" dir="auto">Laboratorio central</span></a>
    </li>
    …
    <li class="g-breadcrumbs__item is-current">
      <svg class="g-breadcrumbs__sep g-icon--flip-rtl" aria-hidden="true">…</svg>
      <a class="g-breadcrumbs__link" href="…" aria-current="page"><span class="g-breadcrumbs__label" dir="auto">Muestra M-0007</span></a>
    </li>
  </ol>
  <div class="g-tooltip" popover="manual" aria-hidden="true">…</div>   <!-- pistas, fuera del ol -->
</nav>
```

- **`nav` con nombre** (`labels.nav` o `aria-labelledby`); un solo punto de referencia por instancia. **`ol` con un `li` por nivel** (APG *Breadcrumb*): el lector dice «lista, N elementos» y solo lee los niveles. Los separadores **no son `li` ni texto**: un `svg` de Lucide `aria-hidden` dentro del `li` (nada de caracteres de flecha ni `content:`).
- **`aria-current="page"` una sola vez, en el último nivel**, sea `a` o `span`; en la escalera, en su escalón. El actual se distingue por peso y color, no solo por color, y en `forced-colors` por subrayado.
- **En una puerta**, el hijo de la ruta lleva `aria-current="true"` con un `check` decorativo.
- **El nombre entero siempre en el DOM:** lo recortado sigue entero en el árbol; la pista visual es `aria-hidden`. **Sin `title`.**
- **Enlaces de verdad** (`<a href>`); `span` sin foco para los niveles sin página. Las listas de los paneles no llevan rol ni nombre propios: son la lista de enlaces de una divulgación (APG *Disclosure Navigation*). No se usa `role="menu"`.
- **Áreas:** destinos de **24 × 24 px o más** con puntero fino (también la raíz en solo icono y las puertas) y **44 × 44 px con puntero grueso**, también escalones y enlaces de panel.
- **Reflujo:** 1.4.10, nada se pierde a 320 px CSS (la cara de B conserva la ruta entera a un toque).

**Contraste medido** (auditoría, 28 configuraciones por motor: tema por defecto, el de la auditoría, el propio del estilo y los once de Dark Color Presence, claro y oscuro; mismas cifras en los tres motores):

| Pieza | Mínimo en las 28 | Exigido |
| --- | --- | --- |
| Nivel y nivel sin página (`text-muted`); raíz en solo icono | **7,38:1** | 4,5 |
| Pastilla recortada (`on-neutral-soft` / `neutral-soft`) | **4,53:1** | 4,5 |
| Actual y divulgación (`on-accent-soft` / `accent-soft`) | **4,51:1** | 4,5 |
| Nivel al pasar, enlaces de panel y escalera (`text`) | **15,14:1** | 4,5 |
| «Subir» (`on-neutral-soft` / `neutral-soft`) y al pasar | **4,53:1** y **6,17:1** | 4,5 |
| Panel al pasar (`text` / `neutral-soft`) | **13,85:1** | 4,5 |
| Pista visual (tokens de `GTooltip`) | **15,14:1** | 4,5 |
| Puerta en reposo: chevron sobre el hueco | **6,49:1** | 3 |
| Puerta al pasar: marco `border-control` | **3,43:1** | 3 |
| Puerta abierta: chevron sobre `accent-soft` | **4,51:1** | 3 |
| `check` del hijo de la ruta, barra del escalón actual, anillo de foco | **4,52:1** | 3 |

El separador (decorativo) mide 5,05:1 como mínimo y la guía en L de la escalera 1,39:1: es estructura (la sangría dice la profundidad; la barra, el peso y `aria-current` dicen el actual), no transmite estado. Los pares `on-*-soft` / `*-soft` los garantiza el motor del tema de al menos 4,5:1; en algunos temas oscuros quedan en el límite (4,51 a 4,56).

**`forced-colors`** (emulado en Chromium; tema por defecto claro, oscuro y el de la auditoría): actual subrayado en la fila, la divulgación y la escalera; bordes en puerta, «Subir», divulgación y panel; puerta abierta distinguible (`Highlight`); barra del escalón actual distinta de las demás; anillo visible.

## Táctil

Con `pointer: coarse` (emulado en los tres motores a 390 px, tema por defecto y el de la auditoría): todo destino de la fila y de la cara, escalones y enlaces de panel **≥ 44 × 44 px**; alto 44 en todas las etapas (Δ0); nada fuera del `nav`; la página sin desborde. La pulsación larga sobre lo recortado muestra el nombre y soltar no activa (medida en Chromium por CDP). Con puerta, cada una suma 44 px a la fila y la fila cede antes: es el precio aceptado.

## Tema

El componente solo lee tokens `--g-*` y alias locales (`--_bc-*`, `--_*`). **No define tokens nuevos** (DECISIONS #501), no usa valores de respaldo y no lleva colores literales. Según la auditoría, en `GBreadcrumbs.css` solo hay literales de `24px`, `44px`, el patrón de texto oculto, `20ch`/`3ch`/`8ch` y los giros de 90° y 180°; un solo `--g-ease-spring`, ningún `--g-ease-bounce` ni curva propia; todo `:hover` bajo `(hover: hover)`; y ningún selector toma hijos de tu aplicación por estructura (DECISIONS #383).

| Token | Para qué |
| --- | --- |
| `--g-font-ui`, `--g-text-body-sm-{size,line,weight,tracking}` | Todo el texto; la línea fija el suelo del alto de la fila |
| `--g-text-action-weight` | Actual, divulgación, «Subir», escalón actual y hijo de la ruta |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Nivel al pasar y enlaces de panel; niveles, nivel sin página y puerta en reposo; separador decorativo |
| `--g-color-accent-soft`, `--g-color-on-accent-soft` | Actual, divulgación y puerta abierta |
| `--g-color-accent-text` | `check` del hijo de la ruta y barra del escalón actual |
| `--g-color-neutral-soft`, `--g-color-on-neutral-soft` | Pastilla recortada, «Subir», hueco de la puerta y enlace de panel al pasar |
| `--g-color-neutral-strong`, `--g-color-on-neutral` | «Subir» al pasar |
| `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control` | Borde del panel; guía en L; marco de la puerta al pasar |
| `--g-color-surface`, `--g-shadow-2`, `--g-radius-md` | Paneles |
| `--g-radius-pill`, `--g-radius-sm`, `--g-radius-xs` | Pastillas; puerta y enlaces de panel; codo de la guía |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Anillo de foco |
| `--g-border-width`, `--g-space-1` | Bordes; todas las medidas |
| `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-spring` | Movimiento |

**Medidas del componente** (de tokens; constantes de diseño, no tokens): alto de la fila y de la cara `max(24px, space × 7, body-sm-line)` (`max(44px, …)` con puntero grueso), medido 28 con el tema por defecto, 24 con el de la auditoría y 35 con el propio del estilo (`space` 5), 40 y 48 con el texto al 200 % (por defecto y auditoría); puerta `max(24px, space × 6, 1em + space × 2)`; relleno de una pastilla `space × 2`; panel de una puerta de `space × 48` a `min(space × 80, 100vw − space × 4)`; escalera de `space × 56` a `min(space × 90, 100vw − space × 4)`. **Crecen con el texto** (auditoría, hallazgo 1): sin esto el chevron de una puerta medía 28 px en 24 al 200 %.

## SSR

Se renderiza la etapa `liquid` con todos los niveles, las pistas cerradas y los ids de `useId()`; ninguna lectura de `document`, `window` ni escucha fuera de `onMounted`; los paneles, cerrados; `is-ready` solo en el cliente. La lista de medida solo existe en el cliente.

## Avisos de desarrollo

Prefijo `[Grana GBreadcrumbs]`; una vez por instancia y motivo; solo fuera de producción; sin el texto de tu aplicación en el mensaje.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | Falta `labels.nav` y no hay `aria-labelledby` en los atributos | Avisa |
| 2 | `items` vacío o no es un arreglo | No pinta nada |
| 3 | Un nivel sin `label` (o vacío) | Se ignora |
| 4 | Con dos o más niveles, falta `labels.up` o `labels.path` | Avisa (la última etapa puede llegar en cualquier ancho) |
| 5 | Hay al menos una puerta y falta `labels.children` | Avisa |
| 6 | `labels.up` o `labels.path` en cadena sin `{label}`; `labels.children` sin `{label}` con más de una puerta | Avisa (2.5.3 / todas se llamarían igual) |
| 7 | `children` en el último nivel | No se pinta |
| 8 | Un hijo de `children` sin `label` | Se ignora |
| 9 | El elemento del slot `link` no recibió `attrs` | Avisa |

## Clases

- **Raíz `nav`:** `g-breadcrumbs`, `is-ready`, `data-stage` (`liquid` · `root-icon` · `shrink` · `step`).
- **Fila:** `__list`, `__item` con `is-root` · `is-mid` · `is-parent` · `is-current` (con dos niveles, la raíz lleva `is-root` e `is-parent`), `is-icon` (raíz en solo icono), `data-clipped`, `is-entering`, `is-leaving`; `__link`, `__link--text`, `__icon`, `__label`, `__sep`.
- **Puertas y paneles:** `__door` (`aria-expanded`), `__panel` (`data-side`, `--_x`, `--_y`, `--_max`), `__here`.
- **Última etapa:** `__face`, `__up`, `__toggle`, `__chevron`, `__stairs`, `__stair` (con `--_depth` y `is-current`).
- **Medida:** `__measure` (`aria-hidden`, `inert`, solo cliente).
- **Interno:** los datos del `.vue` al CSS no son API.

## Limitaciones conocidas

- **El panel de una puerta puede entrar desde el lado equivocado cuando la estimación del lado falla (hallazgo 3 de la auditoría, abierto).** El lado se estima antes de abrir el panel con un alto previsto (un enlace por hijo); si los hijos se parten en varias líneas y el alto real es mayor, el panel **se coloca bien** (dentro del visor, arriba cuando abajo no cabe) pero **entra con el desplazamiento del lado contrario**: se aleja del disparador en vez de acercarse (`space × 1`, 160 ms). Reproducido en los tres motores con hijos de tres líneas (alto real 202 px, previsto 144 px) y 185 px libres bajo la puerta. Con una estimación correcta, la entrada es la buena. **Sigue abierto**: `GBreadcrumbs.vue` no ha cambiado desde el commit de bruno `5e5ed5a`; la corrección propuesta (cerrar y reabrir en la misma tarea cuando el lado medido difiere del estimado) es de bruno. No bloquea el uso.
- **La etapa a un ancho dado depende de la métrica de la fuente (hallazgo 6, información).** Con una fuente del sistema distinta, la etapa a un mismo ancho puede cambiar: con Georgia de 19 px, 480 px pasa a `root-icon` en Firefox y WebKit y sigue en `liquid` en Chromium. No es un defecto de la medida: el barrido confirma el orden de las etapas y el alto Δ0 en los tres. No fijes anchos de etapa en tu aplicación; la medida ocurre en vivo y se repite al cargar las fuentes.
- **Una pastilla de 3 letras no se lee sin pasar por encima o tabular** (el precio de no esconder la ruta). Con el puntero, la pista da el nombre; con el teclado, el despliegue.
- **Un nivel sin página recortado no es enfocable:** con el teclado no se ve su nombre entero (sí en el árbol, con el puntero y, en `step`, en la escalera).
- **Las puertas casi duplican las paradas de Tab,** y con puntero grueso la fila cede antes.
- **En `step`, ver la ruta cuesta un toque** (la divulgación).
- **El despliegue por foco muestra el nombre «entero o casi»:** a 560 px, «Laboratorio central» enseña 119 de 122 px (≈ 97 %) y la pista completa el resto; un peso `0` lo dejaría entero pero haría desbordar la fila cuando de verdad no cabe.
- **Con el slot `link`,** `navigate` llega con `event.defaultPrevented` ya verdadero si el router canceló en su propio manejador.
- **Pasa tú los textos:** sin `labels.nav` el `nav` no tiene nombre; `up` y `path` deben contener `{label}`.
- **No lleva foco ni lectura al navegar:** llevar el foco al `h1` de la página nueva es de tu aplicación.
- **Navegadores:** usa `:has()`, capas CSS, `popover` y `ResizeObserver`. No se midió ningún navegador anterior a los tres motores de Playwright (Chromium, Firefox, WebKit).

## Reservado (fuera de v0.1)

Hoy no existen (DECISIONS #503):

- **«+N»** y `labels.more` (la forma elegida no lo usa).
- **La ruta sin la página** (`current: false` en el último nivel o prop global).
- **`children` cargados al abrir** (evento de petición y estado de carga, sin `fetch`) y búsqueda dentro de una puerta larga.
- **Puerta al final** (los hijos de la página actual, «bajar») y **puertas en la escalera**.
- `density` / `size`; exponer la etapa (`stage`) como evento o slot.
- **Nunca:** separador configurable, prop `to` o router propio, `role="menu"` para los niveles, `title`, partir la fila en dos líneas.

## Verificación

- **Pruebas** (vitest con jsdom): `GBreadcrumbs.test.js`, **46 de 46 en verde al documentar** (ejecutadas de nuevo). Además `src/types.test.js` (los tipos se generan del `meta.json`, DECISIONS #443; la forma de `items` y `children` está en `types/overrides.mjs`), que no se ejecutó al documentar.
- **Auditoría de coco** con el componente real publicado (`dist/grana.umd.js` + `dist/grana.css` + `dist/fonts.css`) y un tema distinto al por defecto (generado con `@grana/cli`: primario `#7C2D12`, `space` 3, texto de 19 px, Georgia, sin esquinas redondeadas): `node design/lab/breadcrumbs/auditoria-verificar.mjs`. **14 486 de 14 486** comprobaciones (estático 23/23, Chromium 4827/4827, Firefox 4818/4818, WebKit 4818/4818). **No se repitió al documentar.** Resultado: sin defecto bloqueante, `candidate`. Hallazgos: 1 (la puerta y la raíz en solo icono no crecían con su texto; corregido), 2 (la lista de medida ensanchaba la página a 320 px; corregido con `overflow: clip`), 3 (lado de entrada del panel; abierto), 4 (WebKit sin cabeza a ≈ 90 ms; no reproducido), 5 (registros para lima) y 6 (métrica de la fuente; información).
- **Specs de bruno** (`breadcrumbs.spec.mjs`, `personalidad-breadcrumbs.spec.mjs`, `panel-estable.spec.mjs`): **no se corrieron con el CSS corregido** (la auditoría los dejó pendientes) ni al documentar.
- **Empaquetado** (al documentar, sobre el `dist/` del árbol): `dist/grana.js` contiene `GBreadcrumbs`; `dist/grana.css` contiene `g-breadcrumbs__door` y `g-breadcrumbs__stairs`, y la lista de medida con `overflow: clip`. El peso es el anotado por bruno (no remedido).

## No verificado

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): la lista dentro del `nav` con `list-style: none` en Safari (si se pierde la semántica de lista, se añadiría `role="list"`; pendiente de bruno, `meta.json` `pending`), «página actual» en el último enlace, la escalera y las puertas con `aria-current="true"`. Solo se comprobó el marcado y el árbol de accesibilidad.
- **Táctil real** (iOS, Android): la pulsación larga solo se midió en Chromium por CDP.
- **`forced-colors` real** (Windows): emulado solo en Chromium; en Firefox y WebKit ni siquiera emulado.
- **`RouterLink` y `NuxtLink` reales** en el slot `link`: la auditoría usó un simulado (`inheritAttrs: false`, `v-bind="attrs"` + `<component :is="content" />`).
- **IME y nombres muy largos en CJK.**
- **Zoom real** de solo texto y de página al 200 y 400 % (aproximado con `html` al 200 % y con visores de 640 y 320 px).
- **El estado de `main` posterior a `2bb4a3d`:** la auditoría se hizo sobre ese árbol (otro bruno trabajaba en `main`).
- **Cifras de este README tomadas de otros informes** (peso de bruno, auditoría y estilo de coco) y no remedidas al documentar, salvo las marcadas como «ejecutadas de nuevo» o «al documentar».

## Fuentes

- API: [`GBreadcrumbs.meta.json`](./GBreadcrumbs.meta.json) · Contrato: [`design/contracts/breadcrumbs.md`](../../../../../design/contracts/breadcrumbs.md) (DECISIONS #490 a #503 y #505) · Ronda de kiwi: [`design/lab/breadcrumbs/r01/`](../../../../../design/lab/breadcrumbs/r01/) · Estilo: [`design/lab/breadcrumbs/estilo.md`](../../../../../design/lab/breadcrumbs/estilo.md) · Auditoría: [`design/lab/breadcrumbs/auditoria.md`](../../../../../design/lab/breadcrumbs/auditoria.md) · Motor de la pista: [`GTooltip`](../GTooltip/README.md) · Frontera: [`GSidebar`](../GSidebar/README.md), [`GStepper`](../GStepper/README.md), [`GTabs`](../GTabs/README.md)
