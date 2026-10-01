# GTabs y GTabPanel

Pestañas para navegar **entre vistas del mismo nivel dentro de una misma vista** (patrón *Tabs* de APG): cuatro apariencias (`underline`, `pill`, `segmented`, `contained`) por dos orientaciones, una marca que se desliza, activación automática o manual, desbordamiento por scroll, flechas o menú «Más», solo icono según el espacio, contador, insignia y estados (`loading`, `attention`). Los paneles pueden ir integrados, ser perezosos o vivir en otra parte del árbol con `GTabPanel`.

**Etiquetas:** `<g-tabs>` y `<g-tab-panel>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/tabs/auditoria.md`](../../../../../design/lab/tabs/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`; el menú «Más» usa la API `popover`.

> **No es navegación entre páginas ni un árbol.** No se anidan: un `GTabs` dentro del panel de otro avisa en desarrollo. Para pasos de un proceso usa `GStepper`.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<script setup>
import { ref } from 'vue'
const pestanas = [
  { id: 'general', label: 'General' },
  { id: 'msgs', label: 'Mensajes', count: 8, countLabel: '8 sin leer' },
  { id: 'news', label: 'Novedades', badge: 'Nuevo' },
  { id: 'errs', label: 'Errores', status: 'attention', statusLabel: 'requiere atención' },
  { id: 'rep', label: 'Informe', status: 'loading', statusLabel: 'cargando' },
  { id: 'perm', label: 'Permisos', disabled: true }
]
const textos = { more: 'Más pestañas', menu: 'Todas las pestañas', loading: '{label}: cargando', loaded: '{label}: listo' }
const activa = ref('general')
</script>

<template>
  <g-tabs v-model="activa" :items="pestanas" :labels="textos" label="Cuenta">
    <template #panel="{ item }">Contenido de «{{ item.label }}».</template>
  </g-tabs>
</template>
```

**Los textos no tienen valor por defecto** (Grana es internacional): el nombre de la lista va en `label` o `labelledby` (sin ninguno, aviso en desarrollo) y los demás textos en `labels` y en cada elemento de `items`.

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-tabs ...></g-tabs>`: Vue no admite etiquetas de componente autocerradas.

### Apariencias y orientación

```vue
<g-tabs v-model="activa" :items="pestanas" :labels="textos" label="Cuenta"></g-tabs>                                   <!-- underline (por defecto) -->
<g-tabs v-model="activa" :items="pestanas" :labels="textos" label="Cuenta" appearance="pill" color="accent"></g-tabs>
<g-tabs v-model="periodo" :items="periodos" label="Periodo" appearance="segmented" activation="manual"></g-tabs>
<g-surface level="raised" padding="none" style="overflow: hidden">
  <g-tabs v-model="activa" :items="pestanas" :labels="textos" label="Cuenta" appearance="contained">
    <template #panel="{ item }">Panel fundido con la pestaña «{{ item.label }}».</template>
  </g-tabs>
</g-surface>
<g-tabs v-model="activa" :items="pestanas" :labels="textos" label="Cuenta" orientation="vertical"></g-tabs>
```

| Apariencia | Se ve así | Cuándo |
| --- | --- | --- |
| `underline` | Marca en línea bajo la activa (al borde de inicio en vertical) y línea base fina | El caso general |
| `pill` | La activa lleva una superficie redondeada con contorno | Barras de herramientas y secciones con color |
| `segmented` | Todas en una pista común; la activa es un segmento elevado | **2 a 6** opciones equivalentes (periodo, vista). No admite `vertical` |
| `contained` | Banda a sangre; la activa se **funde** con el panel y lleva una línea de color arriba | Dentro de una superficie (card, panel, diálogo). No admite `vertical` |

`segmented` y `contained` con `orientation="vertical"` caen a `horizontal` y avisan en desarrollo; `segmented` con más de 6 también avisa, y si no cabe, **degrada a scroll** sin cambiar de apariencia.

### Desbordamiento

```vue
<g-tabs v-model="activa" :items="muchas" :labels="textos" label="Secciones"></g-tabs>                          <!-- scroll, con degradado -->
<g-tabs v-model="activa" :items="muchas" :labels="textos" label="Secciones" overflow="arrows"></g-tabs>      <!-- + botones en los bordes -->
<g-tabs v-model="activa" :items="muchas" :labels="textos" label="Secciones" overflow="more"></g-tabs>        <!-- las que no caben van a «Más» -->
```

- **`scroll`** (por defecto): lista desplazable, degradado en el borde como indicio y la rueda vertical del ratón se convierte en desplazamiento horizontal.
- **`arrows`:** lo anterior más botones anterior y siguiente. Son **solo para puntero** (`aria-hidden`, fuera del teclado: las flechas ya alcanzan todas).
- **`more`:** las que no caben salen del `tablist` y pasan a un menú (`GMenu`) con **todas** las pestañas como opciones de radio. La activa siempre entra en la barra. Exige `labels.more`; sin él se cae a `scroll` y hay aviso en desarrollo.
- En los tres casos **la activa siempre queda visible**: se desplaza a ella al activarla, al enfocarla y al montar, sin mover la página.
- `labelMode="auto"` (cuando **todas** las pestañas tienen `icon`) reduce las inactivas a solo icono antes de desbordar; la activa conserva icono y etiqueta.

### Solo iconos

```vue
<g-tabs v-model="vista" :items="vistas" :labels="textos" label="Vista" label-mode="auto" appearance="pill">
  <template #icon="{ item }"><MiIcono :name="item.icon" /></template>
</g-tabs>
```

Grana no trae iconos para tus pestañas: usa [Lucide](https://lucide.dev) u otro; el slot `icon` es decorativo. En solo icono la etiqueta **sigue en el DOM** (texto oculto) y es el nombre accesible. **No hay tooltip propio todavía** (ver «Limitaciones conocidas»).

### Cancelar un cambio

```vue
<g-tabs v-model="activa" :items="pestanas" :labels="textos" label="Cuenta"
  @change="(e) => { if (hayCambiosSinGuardar) e.preventDefault() }"></g-tabs>
```

Llama a `preventDefault()` de forma síncrona: no cambian el valor, ni la marca, ni el foco. Un cambio de `modelValue` desde fuera **no** emite `change` ni mueve el foco, pero sí desplaza la lista y recoloca la marca.

### Diálogo con pestañas (slot `tabs` de `GDialog`)

```vue
<g-dialog v-model="abierto" title="Ajustes del equipo" close-label="Cerrar" size="md">
  <template #tabs>
    <g-tabs v-model="seccion" :items="secciones" detached id="ajustes" label="Ajustes del equipo" density="compact"></g-tabs>
  </template>
  <g-tab-panel v-for="s in secciones" :key="s.id" tabs="ajustes" :value="s.id" :active="seccion === s.id">
    <FormularioDe :seccion="s.id" />
  </g-tab-panel>
</g-dialog>
```

La cabecera de pestañas queda **fija**, a sangre, entre el encabezado y el cuerpo; solo el cuerpo se desplaza. `GDialog` alinea el texto de la primera pestaña con el del título (`--g-tabs-inset`) y el cuerpo no se anuncia además como `region`. Con la superficie `inset` del diálogo no se duplica la línea base.

### Paneles separados: `GTabPanel` (headless)

Con `detached`, `GTabs` pinta solo la cabecera y **los paneles los pones tú** con `GTabPanel`, donde quieras (otra rama del árbol, otra zona de la página). El enlace es por `id`, sin `provide/inject`, y el estado es explícito:

```vue
<g-tabs v-model="activa" :items="pestanas" detached id="mis-tabs" label="Cuenta"></g-tabs>

<g-tab-panel v-for="p in pestanas" :key="p.id" tabs="mis-tabs" :value="p.id" :active="activa === p.id" lazy>
  Contenido de «{{ p.label }}».
</g-tab-panel>
```

Pasa el **mismo `id`** a `GTabs` y a cada `GTabPanel` (`tabs`). `busy` pone `aria-busy` (ligado, si quieres, al `status: 'loading'` de la pestaña). Sin el `GTabPanel` correspondiente, el `aria-controls` de la pestaña queda colgante: es tu responsabilidad en modo `detached`.

### Persistencia: `v-model`, hash y router

`GTabs` solo expone `v-model` y el evento: **no conoce rutas ni la URL**. La sincronización es tuya y opcional.

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
const ids = pestanas.filter((p) => !p.disabled).map((p) => p.id)
const activa = ref('general')
const leer = () => { const id = new URLSearchParams(location.hash.slice(1)).get('pestana'); if (ids.includes(id)) activa.value = id }
const escribir = (id) => { activa.value = id; history.pushState(null, '', '#pestana=' + id) }
onMounted(() => { leer(); addEventListener('popstate', leer); addEventListener('hashchange', leer) })
onBeforeUnmount(() => { removeEventListener('popstate', leer); removeEventListener('hashchange', leer) })
</script>

<template>
  <g-tabs :model-value="activa" @update:model-value="escribir" :items="pestanas" :labels="textos" label="Cuenta"></g-tabs>
</template>
```

Con un router, liga `modelValue` a un parámetro o a la ruta, haz `router.push` en `update:modelValue` y usa `change` con `preventDefault()` para guardias de navegación. Ignora ids desconocidos o deshabilitados. Con un router **cada pestaña sigue siendo `role="tab"`**; el router solo sincroniza el valor.

## Props de `GTabs`

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `items` | Array | ver «Pestañas» | `[]` |
| `modelValue` (`v-model`) | String \| Number | `id` de la activa | la primera habilitada |
| `appearance` | String | `underline` `pill` `segmented` `contained` | `underline` |
| `orientation` | String | `horizontal` `vertical` | `horizontal` |
| `color` | String | `brand` `accent` `neutral` | `brand` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `align` | String | `start` `center` `distribute` `fill` | `start` |
| `activation` | String | `auto` `manual` | `auto` |
| `overflow` | String | `scroll` `arrows` `more` | `scroll` |
| `labelMode` | String | `full` `icon` `auto` | `full` |
| `snap` | Boolean | | `false` |
| `lazy` | Boolean | | `false` |
| `responsive` | String | `auto` `never` | `auto` |
| `detached` | Boolean | | `false` |
| `disabled` | Boolean | | `false` |
| `label` | String | nombre accesible de la lista | sin valor |
| `labelledby` | String | `id` de un elemento que nombra la lista | sin valor |
| `labels` | Object | ver abajo | `{}` |
| `id` | String | base de los ids de pestañas y paneles | generado |

Un valor fuera de la lista muestra una advertencia en desarrollo.

- **`modelValue`:** `id` de la activa. Si no coincide con ninguna o apunta a una deshabilitada, **ninguna** está activa (ningún panel visible), la primera habilitada es la tabulable y en desarrollo hay `console.warn`. **El componente nunca cambia el prop por su cuenta.**
- **`color`:** familia de la marca y de la superficie de la activa en `pill`; el resto es neutro. `attention` usa siempre `warning` y `loading` es neutro.
- **`density`:** multiplica altura, relleno, separación y grosor de la marca (1×, 0.875×, 0.75×) con piso de 24px; con `pointer: coarse`, **44px** en todas las densidades. No cambia la tipografía.
- **`align`:** `start`, `center`, `distribute` (huecos iguales) y `fill` (columnas iguales). Con desbordamiento, `center`, `distribute` y `fill` degradan a `start`. En vertical solo tiene efecto `fill`.
- **`activation`:** `auto` (enfocar con flechas activa) o `manual` (Enter o Espacio activan). Usa `manual` cuando activar es costoso (carga de red por pestaña).
- **`orientation="vertical"`:** el desbordamiento es scroll vertical limitado por el alto que le des (`overflow` no aplica). Con `responsive="auto"` pasa a horizontal si el ancho **del contenedor** es menor que `--g-space-1 × 120` (480px con `space` 4); `never` lo mantiene vertical. La columna mide de `space × 40` a `space × 64` y nunca más de la mitad del contenedor.
- **`lazy`:** por defecto los paneles están **montados y ocultos** (`hidden`), para no perder borradores. Con `lazy`, un panel se monta la primera vez que se activa y **luego se conserva**. No hay `unmount`.
- **`snap`:** `scroll-snap-type: x proximity` en la lista (móvil nativo).
- **`disabled`:** todas las pestañas quedan `aria-disabled`.
- **`id`:** pestaña `ID-tab-{id}`, panel `ID-panel-{id}`.
- **Resto de atributos** (`class`, `style`, `data-*`, escuchas): van a la raíz.

### Pestañas (`items`)

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | String \| Number | **Obligatorio y único.** Sin `id` la pestaña se ignora (aviso en desarrollo) |
| `label` | String | **Obligatorio.** Nombre accesible, también en solo icono |
| `icon` | cualquiera | Llega al slot `icon`; decorativo |
| `count` | Number | Contador (`GBadge`); `0` no se pinta; exige `countLabel` |
| `countLabel` | String | Texto accesible del contador |
| `badge` | String | Insignia de texto breve |
| `badgeLabel` | String | Se lee **en lugar** del texto visible de la insignia |
| `status` | `'loading'` `'attention'` | Estado con icono y texto oculto; exige `statusLabel` |
| `statusLabel` | String | Texto oculto del estado |
| `disabled` | Boolean | `aria-disabled`; las flechas, `Home` y `End` la omiten |

Orden interno fijo: icono, etiqueta, estado, insignia, contador. Más de una de las tres informaciones secundarias a la vez avisa en desarrollo. El nombre accesible de una pestaña es etiqueta + `statusLabel` + insignia + `countLabel`.

| Estado | Cómo se ve (nunca solo por color) |
| --- | --- |
| Activa | Marca **y** peso 600 **y** color de texto; el ancho en negrita está reservado, así que no desplaza a las demás |
| Foco | Contorno sobre la pestaña enfocada, **distinto de lo activo** |
| Deshabilitada | Atenuada y `not-allowed` |
| `loading` | Icono que gira (quieto con movimiento reducido) y texto oculto; la pestaña **sigue habilitada** y, si es la visible, su panel lleva `aria-busy` |
| `attention` | Icono `circle-alert` y texto oculto, en el tono de advertencia |

### `labels`

| Clave | Uso | Si falta |
| --- | --- | --- |
| `more` | Nombre del botón «Más» (`overflow="more"`) | El botón no existe; se cae a `scroll` y hay aviso en desarrollo |
| `menu` | Nombre del menú de «Más» | Se nombra por el botón |
| `loading` | Anuncio al empezar a cargar, con `{label}` | No se anuncia el inicio; un aviso en desarrollo |
| `loaded` | Anuncio al terminar, con `{label}` | No se anuncia el fin |

## Props de `GTabPanel`

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `tabs` | String | `id` del `GTabs` al que pertenece | **obligatorio** |
| `value` | String \| Number | `id` de la pestaña que lo gobierna | **obligatorio** |
| `active` | Boolean | si es el panel visible (lo calculas con el mismo `v-model`) | `false` |
| `lazy` | Boolean | monta al activarse por primera vez y luego conserva | `false` |
| `busy` | Boolean | `aria-busy` | `false` |

Pinta `<div class="g-tabs__panel" role="tabpanel" id="TABS-panel-VALUE" aria-labelledby="TABS-tab-VALUE">`, con `hidden` si no está activo. Los atributos van a ese `div`. Avisos en desarrollo: sin `tabs` o `value`, o un `id` de `GTabs` que no existe al montar.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `id` de la pestaña | El usuario activa una pestaña y nadie impidió `change` |
| `change` | `{ id, index, source, preventDefault() }` | El usuario activa una pestaña. `source`: `keyboard`, `pointer` o `menu`. **Cancelable** |

Con `activation="manual"`, `change` se emite al pulsar Enter o Espacio, no al enfocar.

## Slots

| Slot | Alcance | Contenido |
| --- | --- | --- |
| `panel-{id}` | `{ item, active }` | Contenido del panel de esa pestaña |
| `panel` | `{ item, active }` | Contenido genérico de panel (si no hay `panel-{id}`) |
| `icon` | `{ item, index, active }` | Icono de la pestaña (`item.icon`); decorativo |
| `label` | `{ item, index, active }` | Etiqueta con contenido rico, **sin interactivos**; el nombre accesible sigue saliendo de `item.label` |
| `empty` | | Sin pestañas: se pinta en lugar de la cabecera |

Con `detached` no hay slots `panel*`: los paneles son `GTabPanel`.

## Teclado y foco

| Tecla | Acción |
| --- | --- |
| Tab | Entra en la pestaña activa (la única tabulable) y de ahí sale al panel; no recorre las demás |
| Shift+Tab | Sale antes de la lista |
| → / ← (horizontal) | Siguiente / anterior pestaña habilitada, con vuelta; **invertidas en RTL**. Con `activation="auto"` además activa |
| ↓ / ↑ (vertical) | Ídem en vertical. Las flechas del eje contrario no se interceptan |
| Home / End | Primera / última pestaña habilitada |
| Enter / Espacio | Activa la pestaña enfocada (necesario con `manual`) |
| «Más» | Enter, Espacio o ↓ abren con el foco en la marcada; ↑, ↓, Inicio y Fin dentro; Esc cierra y devuelve el foco al botón; Tab cierra |

- Las deshabilitadas se omiten. Enfocar o activar una pestaña la desplaza a la vista sin mover la página.
- **Esc no se intercepta** en la lista: un `GDialog` anfitrión se cierra con Esc.
- Al elegir en «Más», la pestaña entra en la barra y **recibe el foco**.

## Accesibilidad

- **Estructura:** un `role="tablist"` con `aria-orientation` (que sigue siempre al diseño **real**) y `aria-label` o `aria-labelledby`; solo contiene pestañas (`role="tab"`, `aria-selected`, `aria-controls`). La marca, los botones de borde y «Más» están **fuera** de la lista. Cada panel es un `role="tabpanel"` con `aria-labelledby`; lleva `tabindex="0"` solo si no contiene elementos enfocables.
- **Con pestañas ocultas** (`overflow="more"`): `aria-setsize` y `aria-posinset` en las renderizadas. Con `lazy`, un panel aún no montado no se renderiza y su pestaña no lleva `aria-controls`.
- **Anuncios:** una región `role="status"` existe desde el montaje y anuncia el inicio y el fin de carga con `labels.loading` y `labels.loaded`.
- **Sin depender del color:** la activa lleva marca, peso y color; el foco, un anillo distinto de la marca; los estados, icono y texto oculto.
- **Contraste medido** (tema por defecto, Spotify con marca pálida, Apple y un tema granate con serif, `space` 5 y borde de 2px; claro y oscuro): texto activo ≥ 5.1:1 (la píldora con marca pálida; ≥ 8.8:1 en el resto), inactivo ≥ 6.6:1, marca y línea de `contained` ≥ 3:1 (mínimo 4.16:1), contornos de píldora y segmento ≥ 3:1, anillo de foco ≥ 4:1. Excepción conocida: el contorno del segmento, **por su lado interior** en oscuro, queda en 2.59:1 (contra la pista, 3.8:1).
- **Tamaños:** altura mínima 40, 35 y 30px según densidad (24px el piso, segmento compacto), y **44px** con `pointer: coarse` en todas las densidades, también en los botones de borde y en «Más».
- **Movimiento:** la marca se desliza solo con `prefers-reduced-motion: no-preference`; sin él salta, el icono de carga no gira, el panel no entra con fundido y el desplazamiento programático es instantáneo. El primer posicionamiento no se anima.
- **RTL:** propiedades lógicas; la marca, el degradado del borde y los chevrones de los botones se espejan; las flechas del teclado se invierten.
- **Colores forzados:** marca en `Highlight`, texto de la activa en `HighlightText` (`CanvasText` en `underline`), línea base y deshabilitadas en `GrayText`.
- **Navegadores:** medido y comprobado en Chromium; marca, foco, «Más», flechas y RTL también en Firefox y WebKit (Playwright).

## Tema

Los valores por defecto de los tokens propios están en `defaults.css`; cambiarlos en tu tema los sobreescribe.

| Token | Por defecto (claro) | Qué es |
| --- | --- | --- |
| `--g-tabs-track` | `rgb(0 0 0 / 0.05)` | Pista de `segmented`: un velo sobre la anfitriona (más claro en oscuro) |
| `--g-tabs-thumb` | `var(--g-color-surface)` | Segmento seleccionado de `segmented` |
| `--g-tabs-band` | `rgb(0 0 0 / 0.04)` | Banda de `contained` |
| `--g-tabs-panel` | `var(--g-color-surface)` | Activa fundida con el panel en `contained`: debe coincidir con la superficie anfitriona |
| `--g-tabs-mark-default` / `-comfortable` / `-compact` | `calc(var(--g-border-width) * 3)` / `* 2` / `* 2` | Grosor de la marca por densidad |
| `--g-tabs-inset` | `0px` | Relleno inline de la cabecera de pestañas; lo define la anfitriona (`GDialog`) y tú puedes sobreescribirlo en un contenedor propio (`.mi-panel { --g-tabs-inset: … }`) |

```css
:root {
  --g-color-primary-text: #7A1E3A;     /* marca y texto de la activa (la marca exige 3:1 sobre la superficie) */
  --g-color-primary-soft: #F6E4EA;     /* superficie de la activa en pill */
  --g-color-border-control: #7D7590;   /* contorno de pill y segmented: debe llegar a 3:1 */
  --g-tabs-track: rgb(122 30 58 / 0.06);
  --g-space-1: 5px;                    /* altura y relleno escalan: 40px pasan a 50px */
}
```

La marca lee el rol `-text` de la familia (`primary-text`, `accent-text`, `neutral-text`), que el tema garantiza ≥ 4.5:1 sobre la superficie. Consume también `--g-color-{primary|accent|neutral|warning}-soft`, `--g-color-on-primary-soft`, `--g-color-surface`, `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle`, `--g-color-border`, `--g-color-focus`, `--g-focus-width`, `--g-border-width`, `--g-radius-*`, `--g-space-*`, `--g-font-ui`, `--g-text-*`, `--g-shadow-1`, `--g-duration-press` y `--g-ease-{standard|out}`. El CLI **aún no emite** los `--g-tabs-*`: los temas generados usan los de `defaults.css`.

## Clases

Las emite el componente y las estiliza `GTabs.css` (que cubre también `GTabPanel`):

- **Raíz:** `g-tabs`, `g-tabs--appearance-*`, `--orientation-*`, `--color-*`, `--density-*`, `--align-*`, `--overflow-*`, `--icon-only`, `is-ready`, `is-scrollable-start|end` e `is-disabled`.
- **Elementos:** `__header`, `__scroller`, `__list`, `__tab` (con `is-active`, `is-attention`, `is-loading`), `__icon`, `__label` (con `data-text`), `__status`, `__sr`, `__mark`, `__edge` (`--prev`, `--next`), `__more`, `__panels`, `__panel` y `__live`.
- **Diálogo:** `.g-dialog__tabs` (en `GDialog.css`).

## Limitaciones conocidas

- **Sin tooltip propio** para solo iconos, hasta que exista un componente de tooltip (el nombre accesible sí está).
- **Pestañas cerrables** (`closable`, `close`): reservadas, **diferidas** a una versión posterior; el CSS no deja hueco todavía.
- **`overflow="combined"` y `"auto"`** se difieren a una r03 (el validador los rechaza).
- **Sin deslizar entre paneles** (*swipe*) ni desmontar los paneles inactivos: los paneles se conservan montados.
- **La marca no se vuelve a medir** si una pestaña cambia de ancho sin que cambie la raíz ni el `scroller` (p. ej. al cambiar en caliente la familia tipográfica del tema): pendiente de bruno. Las fuentes que cargan por `@font-face` sí se cubren.
- **Contorno del segmento en oscuro,** lado interior: 2.59:1 (excepción documentada).
- **Sin verificar:** un lector de pantalla real (VoiceOver, NVDA, TalkBack: anuncio de estado y contador y el menú «Más»), un dispositivo táctil real (`snap` con dedo), zoom al 200%, `forced-colors` real de Windows (se probó emulado), rendimiento con decenas de pestañas y redimensionar con «Más» abierto.

## Fuentes

- API: [`GTabs.meta.json`](./GTabs.meta.json) · Contrato: [`design/contracts/tabs.md`](../../../../../design/contracts/tabs.md) · Prototipo: [`design/lab/tabs/r02/`](../../../../../design/lab/tabs/r02/) · Estilo: [`design/lab/tabs/estilo.md`](../../../../../design/lab/tabs/estilo.md) · Auditoría: [`design/lab/tabs/auditoria.md`](../../../../../design/lab/tabs/auditoria.md)
