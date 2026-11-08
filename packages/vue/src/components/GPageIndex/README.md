# GPageIndex

Índice de **las secciones de la página que estás leyendo**, con la sección actual siguiendo la lectura. Es un botón de menú que dice dónde estás («En esta página · API») y que, al abrirlo, lista las secciones como un [`GMenu`](../GMenu/README.md) de enlaces. Al elegir una, el navegador sigue el `#id` y el foco llega a la sección. Las secciones son un dato de tu aplicación (`items`); el componente no lee los títulos del documento, no navega por su cuenta más allá del `href` y todo texto lo pones tú en `label` y `labels`.

**Etiqueta:** `<g-page-index>` · **Estado:** `draft` (construido; falta la auditoría de coco, ver «Verificación») · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/page-index`

```js
import GranaPageIndex from '@grana/vue/page-index'   // plugin; también: import { GPageIndex } from '@grana/vue/page-index'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (banco `packages/vue/playground/page-index.html`). Exige Vue `^3.5.0`.

## En esta página

[§ Uso](#uso) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Teclado y foco](#teclado-y-foco) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

`GPageIndex` no viaja en `@grana/vue`: quien no lo usa no lo paga (DECISIONS #1042, #1051). Se conecta una vez por aplicación; el CSS ya va en `@grana/vue/style.css`.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import GranaPageIndex from '@grana/vue/page-index'
import '@grana/vue/style.css'

createApp(App).use(Grana).use(GranaPageIndex).mount('#app')   // registra <g-page-index>
```

Sin empaquetador, `dist/page-index.umd.js` (global `GranaPageIndex`) se carga después de `grana.umd.js` y se hace `app.use(GranaPageIndex.default)`. Su sitio natural es el slot `actions` de [`GPageHeader`](../GPageHeader/README.md), que ya se pega al desplazar; fuera de él funciona igual, por ejemplo en la barra de herramientas de un formulario largo.

```vue
<!-- Fragmento: `secciones` y `textos` son de tu aplicación -->
<g-page-header title="Muestra M-0007" :labels="{ actions: 'Acciones de la página' }">
  <template #actions>
    <g-page-index :items="secciones" label="En esta página" :labels="textos" />
  </template>
</g-page-header>
```

`secciones` es, por ejemplo, `[{ id: 'resumen', label: 'Resumen' }, { id: 'analitos', label: 'Analitos' }]`: el `id` es el del elemento de la página al que lleva cada entrada. Los textos van en `labels` y no tienen valores por defecto (Grana es internacional); los ocho que importan aquí están en «Props».

## Ejemplos

### e1 · Las secciones de una página larga

**Por qué:** una ficha de documentación o un expediente largo tienen secciones que el lector quiere saltar sin recorrer todo. El índice dice en cuál estás sin ocupar una columna. **Cuándo no:** si las secciones son vistas que se intercambian en el mismo sitio, eso es [`GTabs`](../GTabs/README.md); si son páginas distintas, [`GSidebar`](../GSidebar/README.md).

El ejemplo usa un contenedor con desplazamiento propio (`scroller`), así que cancela `navigate` y desplaza él mismo; con el documento entero como zona de lectura no hace falta.

```vue demo
<script setup>
import { ref } from 'vue'

const caja = ref(null)
const secciones = [
  { id: 'pi-e1-resumen', label: 'Resumen' },
  { id: 'pi-e1-analitos', label: 'Analitos' },
  { id: 'pi-e1-historia', label: 'Historia clínica' },
  { id: 'pi-e1-notas', label: 'Notas' }
]
const textos = {
  findHint: 'Escribe para buscar',
  matches: '{count} secciones',
  matchesOne: '1 sección',
  none: 'Ninguna sección',
  opened: 'Abierta',
  openedLive: '{label} abierta en otra pestaña',
  copied: 'Enlace copiado',
  copiedLive: 'Enlace de {label} copiado'
}

function ir({ item, event }) {
  event.preventDefault()
  const el = document.getElementById(item.id)
  const c = caja.value
  c.scrollTo({ top: el.getBoundingClientRect().top - c.getBoundingClientRect().top + c.scrollTop })
  requestAnimationFrame(() => el.focus({ preventScroll: true }))   // después de que el menú devuelva el foco al disparador
}
</script>

<template>
  <g-page-index :items="secciones" label="En esta página" scroller="#pi-e1-caja" :labels="textos" @navigate="ir" />
  <div
    id="pi-e1-caja"
    ref="caja"
    role="region"
    aria-label="Muestra M-0007"
    tabindex="0"
    style="block-size: calc(var(--g-space-1) * 44); overflow: auto; border: var(--g-border-width) solid var(--g-color-border); padding-inline: var(--g-space-4)"
  >
    <section v-for="s in secciones" :id="s.id" :key="s.id" tabindex="-1" style="min-block-size: calc(var(--g-space-1) * 36)">
      <p><strong>{{ s.label }}</strong></p>
      <p>Contenido de la sección «{{ s.label }}»: desplaza la región y el índice dice en cuál estás.</p>
    </section>
  </div>
</template>
```

### e2 · Con un router o un desplazamiento propio

**Por qué:** en una aplicación de una sola página, el `#id` del enlace no siempre es lo que quieres (rutas con `hash`, desplazamiento animado, cabecera fija propia). `navigate` llega con el evento nativo y es cancelable: si llamas a `preventDefault()` en el mismo instante, Grana ni cambia la actual ni mueve el foco, y lo haces tú. **Enfoca un cuadro después** (`requestAnimationFrame`): al cerrarse, `GMenu` devuelve el foco al disparador, y si enfocas en el mismo instante, el foco acaba en el disparador (medido en Chromium con el ejemplo e1).

```vue
<!-- Fragmento: `secciones`, `textos` y `router` son de tu aplicación -->
<g-page-index
  :items="secciones"
  label="En esta página"
  :labels="textos"
  @navigate="({ item, event }) => { event.preventDefault(); router.push({ hash: '#' + item.id }) }"
/>
```

`navigate` solo se emite con activación primaria sin modificadores (clic primario, Intro o Espacio): Ctrl/⌘+clic y el botón central abren la sección en otra pestaña con lo de `GMenu`, y no llegan a tu código.

### e3 · Cuando la actual la decides tú

**Por qué:** si el índice vive dentro de un panel que no se desplaza, o tu aplicación ya sabe en qué sección está (por la ruta, por un paso), la línea de lectura sobra. Con `track` en `false` la actual es solo `modelValue`.

```vue
<!-- Fragmento: `actual`, `secciones` y `textos` son de tu aplicación -->
<g-page-index v-model="actual" :items="secciones" :track="false" label="En esta página" :labels="textos" />
```

## Props

| Prop | Tipo | Valores | Por defecto | Descripción |
| --- | --- | --- | --- | --- |
| `items` | Array | `{ id, label, href? }` | `[]` | Secciones en el orden del documento. `id` es el del elemento destino; `href` por defecto es `#id`. Sin `id` o sin `label` se ignora y avisa; con `id` repetido, gana el primero. Cualquier otro campo se conserva y llega a `navigate` |
| `modelValue` | String \| null | `id` de la sección actual | `null` | `v-model` opcional. Con `track`, la lectura lo corrige en el siguiente desplazamiento; un `id` sin item cuenta como ninguno |
| `track` | Boolean | | `true` | Línea de lectura: la actual sigue el desplazamiento. `false`: la actual es solo `modelValue` |
| `scroller` | String \| Element \| null | selector o elemento | `null` | Lo que se desplaza. Sin valor, el documento. Se resuelve al montar; si no se encuentra, avisa y usa el documento |
| `appearance` | String | `relay` | `relay` | Forma. Solo existe `relay`; fuera de la lista, avisa |
| `label` | String | texto | sin valor (**obligatoria**) | Nombre del `<nav>` y texto fijo del disparador |
| `align` | String | `start` `end` | `end` | Alineación de la lista (la de `GMenu`) |
| `labels` | Object | ver abajo | `{}` | Textos de `GMenu`, tal cual y sin valores por defecto |
| `id` | String | | generado (SSR-seguro) | `id` de la raíz y prefijo de los de `GMenu` (`{id}-trigger`, `{id}-list`) |

**`class`, `style` y `data-*` van a la raíz** (`nav`). El disparador mide siempre la altura de un `GBtn` `md` (44 px con puntero grueso); una `density` que llegue por atributos no lo cambia.

**`labels`** no tiene claves propias: se pasa entero a `GMenu`. Los ocho que importan son los cuatro de buscar al escribir (`findHint`, `matches` con `{count}`, `matchesOne`, `none`) y las dos parejas de los gestos de enlace: `opened` y `openedLive` (Ctrl/⌘+clic y botón central abren la sección en otra pestaña con el menú abierto) y `copied` y `copiedLive` (Ctrl/⌘+C copia el enlace absoluto a la sección). Sin una pareja, ese gesto queda en el del navegador y `GMenu` avisa. Pásalos todos.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `id` \| `null` | La sección actual cambia por la lectura o por elegir una (no cuando cambia `modelValue` desde fuera) |
| `navigate` | `{ item, event }` | Se elige una sección con clic primario o Intro/Espacio sin modificadores. `preventDefault()` síncrono: Grana no cambia la actual ni mueve el foco |

## Slots

Ninguno.

## Métodos

| Método | Firma | Qué hace |
| --- | --- | --- |
| `refresh` | `refresh(): void` | Vuelve a leer la actual en el siguiente cuadro. Úsalo cuando el contenido crece sin desplazamiento (imágenes, un acordeón, `GFormReveal`). Con una sección elegida sostenida no hace nada |

## Teclado y foco

Es el teclado de `GMenu`.

| Tecla | Efecto |
| --- | --- |
| Intro, Espacio, ↓ en el disparador | Abre la lista con el foco en la primera sección |
| ↑ en el disparador | Abre la lista con el foco en la última |
| ↑ ↓ Inicio Fin | Recorren las secciones |
| Intro en una sección | Sigue el enlace; el foco acaba en la sección |
| Esc | Cierra y devuelve el foco al disparador |
| Tab | Cierra y sigue |

**Foco al elegir:** cuando `GMenu` cierra y devuelve el foco al disparador, el destino lo recibe con `preventScroll`, para que el siguiente Tab siga desde la sección y no desde el zócalo pegado. Si el destino no es enfocable y no tiene `tabindex`, Grana le pone `tabindex="-1"` y no lo quita. Si no existe en el documento, el foco se queda en el disparador y avisa.

**Línea de lectura.** La sección actual es la última cuyo borde superior ya cruzó la línea: el `scroll-padding` de la zona más un tercio de lo visible, y al final del documento, la última. Al elegir una, pasa a ser la actual al instante y se **sostiene** hasta el primer desplazamiento posterior: una sección corta, o la última, no cede la actual a la siguiente en el mismo salto. La lee el desplazamiento, nunca el puntero ni el foco.

## Accesibilidad

a. **`aria-current="location"` en una sola entrada**, y solo en la lista (el disparador no lo lleva: su texto ya lo dice). Nivel `prueba` (`GPageIndex.test.js`).

b. **`<nav>` con nombre** (`label`) y disparador de menú cuyo nombre accesible es su texto, «En esta página API»; la pila de etiquetas que fija el ancho es `aria-hidden`. Nivel `prueba` y `medido` en Chromium (`page-index.spec.mjs`, 11/11).

c. **Sin anuncios.** El cambio de sección es consecuencia del desplazamiento de quien lee; el nombre del disparador cambia en silencio, sin región viva (decisión de contrato, #1039). El lector de pantalla no lo ha escuchado nadie: `sin verificar`.

d. **Objetivo táctil:** disparador y elementos de la lista ≥ 44 px con `pointer: coarse`. Nivel `medido` en Chromium (`page-index.spec.mjs`).

e. **Movimiento reducido:** el relevo del texto se queda en un fundido, sin desplazamiento. Nivel `medido` en Chromium (`page-index.spec.mjs`).

f. **Contraste** del disparador (texto, valor y borde como control) en claro, oscuro y zona de marca: `sin verificar` hasta la auditoría de coco.

> **Peligro.** Sin `label` el `<nav>` queda sin nombre y el disparador sin su texto fijo: el lector anuncia un botón vacío dentro de un punto de referencia anónimo (el componente avisa en desarrollo). Y si el `id` de un item no existe en la página, elegirlo no lleva a ningún sitio.

## Personalidad

**El relevo.** Al cambiar la sección actual, el texto del disparador se funde y se desplaza un paso en el sentido de la lectura (hacia abajo o hacia arriba), en dos fases sobre una sola etiqueta: nunca hay dos visibles. El disparador **no cambia de ancho**: la celda del valor apila todas las etiquetas ocultas y mide la más larga desde el HTML del servidor, sin medir con JavaScript. Un cambio a menos de 600 ms del anterior es instantáneo, para que al desplazarse deprisa no se encadenen animaciones. Con `prefers-reduced-motion: reduce` queda solo el fundido. Nada se anima al montar. Decisiones #1038 a #1040 y #1047.

**Límites:** el desplazamiento es de un paso pequeño dentro de una celda fija (no mueve el disparador ni la página); la comodidad con desplazamiento inercial en un táctil real no se ha comprobado.

## Tema

No tiene tokens nuevos (`tokens.md` §59). El disparador se pinta con los de un `GBtn` `outline` `neutral`: `--g-color-border-control`, `--g-color-text`, `--g-color-text-muted`, `--g-radius-shape`, `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` y `--g-border-width`, más `--g-text-body-sm-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-1` a `--g-space-3`, `--g-duration-fast` y `--g-ease-out`. La lista es la de `GMenu`. El tope de ancho de la etiqueta actual es un alias local del CSS (`--_relay-max`, no es API).

## Clases

`g-page-index` con `g-page-index--appearance-relay` (raíz `nav`, más `is-empty` sin actual), `__trigger`, `__key`, `__value`, `__stack`, `__ghost`, `__current` e `__icon`. Durante el relevo, `__current` lleva `data-dir` (`down` o `up`) y `data-phase` (`out` o `in`), y `is-burst` en un cambio instantáneo.

## Alcance

- **Una sola forma, `relay`.** `list` (columna para ajustes y formularios largos, con errores por sección), `line` y `rail` están **reservadas** (#1038).
- **Un solo nivel.** Las subsecciones (`level`) y abrir la lista en la sección actual están **reservadas** (#1038, #1039).
- **Buscar al escribir** (los cuatro `labels` de búsqueda) **todavía no actúa**: `GMenu` sigue con el salto por letra; los textos se pasan a `GMenu` y esperan a esa función (#797; ver «Verificación»).
- **No navega ni enfoca si cancelas** `navigate`: es tu aplicación la que desplaza y enfoca, un cuadro después de que `GMenu` devuelva el foco (e2).
- **No lee el documento en el primer render:** `items` y `modelValue` se pintan tal cual para que el HTML del servidor ya traiga el índice; la lectura, el `hash` y el `scroller` se resuelven al montar (#1033).
- **El destino sin `tabindex`** recibe `tabindex="-1"` y lo conserva (límite aceptado, #1039).
- **Peso:** entrada propia de `dist/page-index.js`, **2 932 B gzip** frente a un tope de 3 072 B (#1051), anotado por bruno en `GPageIndex.meta.json` el 2026-11-08 (`gzip -9`; no se remidió al documentar). `GMenu`, `GLibIcon` y el motor del menú llegan de `@grana/vue`, sin copia.

## Verificación

- **`prueba`:** `GPageIndex.test.js` (18 pruebas: anatomía, modelo y avisos 1 a 6, elegir, línea de lectura, elegida sostenida, relevo en fases) y `GPageIndex.hydration.test.js` (1), en verde el 2026-11-08 (19/19).
- **`medido` en Chromium:** `design/lab/theme-playground/tests/page-index.spec.mjs`, 11/11 (anatomía, línea de lectura, foco al destino, elegida sostenida, Δ0 del disparador, relevo, movimiento reducido, 200 secciones con tareas < 50 ms, táctil ≥ 44 px), 2026-11-08, puerto 4236.
- **Sin verificar:** Firefox y WebKit (no se ejecutaron al documentar); contraste en claro, oscuro y zona de marca; rúbrica de movimiento; lector de pantalla real con `aria-current="location"` dentro de un `menu`; desplazamiento inercial en táctil real. **El estado es `draft` hasta la auditoría de coco**: esta página no lo promueve.
- **Pendientes abiertos:** [`PENDIENTES.md`](../../../../../PENDIENTES.md) §6. Afecta a este componente que **buscar al escribir en `GMenu` (#797) aún no está construido**.

## Fuentes

- API: [`GPageIndex.meta.json`](./GPageIndex.meta.json)
- Contrato: [`design/contracts/page-index.md`](../../../../../design/contracts/page-index.md) · Marco del sitio: [`design/contracts/sitio-marco.md`](../../../../../design/contracts/sitio-marco.md)
- Prototipo: [`design/lab/sitio/r01/`](../../../../../design/lab/sitio/r01/)
- Decisiones: #1034, #1038 a #1040, #1042, #1047 a #1049 y #1051 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- Pruebas: [`GPageIndex.test.js`](./GPageIndex.test.js) (nivel `prueba`); Playwright [`design/lab/theme-playground/tests/page-index.spec.mjs`](../../../../../design/lab/theme-playground/tests/page-index.spec.mjs) (nivel `medido`, Chromium)
