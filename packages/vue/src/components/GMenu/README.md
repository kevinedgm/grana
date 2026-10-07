# GMenu

Menú de acciones anclado a un **botón de menú** (patrón *Menu Button* y *Menu* de APG): acciones, separadores, grupos con título, **casillas y opciones**, **submenús** y elementos **peligrosos**. El contenido es un arreglo de `items`; el disparador es tuyo (slot `trigger`). **Presenta y emite intención:** el estado de casillas y opciones lo guarda tu aplicación.

**Etiqueta:** `<g-menu>` · **Estado:** `candidate` (auditado por coco con un tema propio: `design/lab/menu/auditoria.md`) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`. Usa `popover`.

## Uso

```vue
<script setup>
import { ref } from 'vue'

const abierto = ref(false)
const items = ref([
  { id: 'rename', label: 'Renombrar', icon: 'pencil', shortcut: 'F2', keyshortcuts: 'F2' },   // icon: nombre de Lucide
  { id: 'move', label: 'Mover a…', disabled: true },
  { type: 'separator' },
  { type: 'group', label: 'Mostrar', items: [
    { type: 'checkbox', id: 'grid', label: 'Cuadrícula', checked: true },
    { type: 'radio', id: 'by-name', label: 'Por nombre', checked: true },
    { type: 'radio', id: 'by-date', label: 'Por fecha' }
  ] },
  { label: 'Exportar como', items: [{ id: 'pdf', label: 'PDF' }, { id: 'csv', label: 'Datos' }] },
  { type: 'separator' },
  { id: 'del', label: 'Eliminar', danger: true }
])

const elegir = (e) => {
  if (e.type === 'checkbox') e.item.checked = e.checked            // la aplicación guarda el estado
  if (e.type === 'radio') e.group.items.forEach((x) => { if (x.type === 'radio') x.checked = x.id === e.id })
  if (e.type === 'item') ejecutar(e.id)
}
</script>

<template>
  <g-menu v-model="abierto" :items="items" label="Acciones del archivo" @select="elegir">
    <template #trigger="{ attrs }"><g-btn v-bind="attrs" variant="outline">Acciones</g-btn></template>
  </g-menu>
</template>
```

```js
// main.js: `pencil` no está en la lista de la librería; la aplicación lo registra (ver el README de GIcon)
import Grana, { createIcons } from '@grana/vue'
import { Pencil } from 'lucide-static'
createApp(App).use(Grana).use(createIcons([Pencil])).mount('#app')
```

**Icono por nombre (#202):** un `icon` **cadena** sin slot `icon` dibuja un [`GIcon`](../GIcon/README.md) con ese nombre en el hueco del elemento (decorativo, del tamaño de la marca de casilla, ≈ 18px). Se busca en el registro de tu aplicación y luego en la lista de la librería. **Con slot `icon`, manda el slot** (`<template #icon="{ item }">…</template>`, p. ej. para un logotipo); un `icon` que no es cadena solo llega al slot.

> En plantillas dentro del HTML (sin compilar), escribe `<g-menu ...></g-menu>`: Vue no admite etiquetas de componente autocerradas.

## Elementos (`items`)

| Campo | Uso |
| --- | --- |
| `type` | `item` (por defecto), `checkbox`, `radio`, `separator` o `group`. Un elemento con `items` es un **submenú** |
| `id` | Obligatorio en `item`, `checkbox` y `radio` (un padre de submenú puede no llevarlo); único en todo el menú |
| `label` | Obligatorio (salvo en un separador); es el **nombre accesible** |
| `icon` | Cadena: nombre de Lucide que el menú dibuja con `GIcon` si no hay slot `icon`. Otro valor: llega al slot `icon`. Decorativo |
| `shortcut`, `keyshortcuts` | Atajo **visible** (`aria-hidden`) y valor de `aria-keyshortcuts` |
| `disabled` | `aria-disabled`: sigue enfocable, atenuado y tachado; no se activa |
| `danger` | Un `triangle-alert` de Lucide y negrita, además del color |
| `checked` | Estado de `checkbox` y `radio` |
| `items` | En un `group`, sus elementos; en un `item`, el submenú (hasta tres niveles verificados) |

Un elemento sin `label`, sin `id` (cuando lo necesita) o de tipo desconocido se ignora y avisa en desarrollo.

## Comportamiento

- **Abrir:** clic, Enter, Espacio y ↓ abren con el foco en el **primero**; ↑, en el **último**. Un segundo clic cierra.
- **Elegir:** emite `select`. Con `closeOnSelect="auto"` las **acciones cierran** y devuelven el foco al disparador; las **casillas y opciones no cierran** (se cambian varias seguidas). Un elemento deshabilitado no hace nada. `event.preventDefault()` en `select` impide el cierre.
- **Cerrar:** **Esc** cierra y devuelve el foco (y no llega a un ancestro, como un `GDialog`); **Tab** cierra y el foco sigue su curso; un **clic fuera** cierra sin robar el foco.
- **Submenús:** → (en RTL, ←), Enter o Espacio los abren; ← (en RTL, →) o Esc cierran **solo ese nivel**. El puntero encima abre tras 180ms.
- **Posición:** debajo del disparador (encima si no cabe y hay más sitio), con el alto limitado al espacio y la lista desplazable; **sigue al disparador** al desplazar y se cierra si este sale del visor. Los submenús cambian de lado si no caben.
- **Sin anuncios propios:** el lector lee `aria-checked`; anunciar el resultado de una acción es tuyo.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | Boolean | menú abierto (con `update:modelValue`) | `false` |
| `items` | Array | ver «Elementos» | `[]` |
| `label` | String | nombre accesible de la lista (por defecto, el del disparador) | sin valor |
| `align` | String | `start` `end` (borde del disparador con el que se alinea) | `start` |
| `side` | String | `auto` `bottom` `top` | `auto` |
| `closeOnSelect` | String | `auto` `always` `never` | `auto` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `id` | String | | generado |

Un valor fuera de su lista avisa en desarrollo. **`class`, `style` y `data-*` van a la lista.**

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `select` | `{ id, item, type, checked?, group?, event }` | Se activa un elemento. `checked` es el valor **nuevo** de una casilla y `true` de una opción; `group` es el grupo que contiene la opción |
| `update:modelValue` | Boolean | El menú se abre o cierra por una vía de usuario |
| `open`, `closed` | | La lista ya se muestra / ya se ocultó |

## Slots

| Slot | Contenido |
| --- | --- |
| `trigger` | **Obligatorio.** El disparador; alcance `{ open, attrs }`: enlaza `v-bind="attrs"` a un `<button>` o a un componente que lo renderice (p. ej. `GBtn`). **No le pongas tu propio `id`**: ver [El disparador](#el-disparador) |
| `icon` | Icono de un elemento (decorativo). Alcance `{ item }` |
| `item` | Contenido de un elemento; alcance `{ item, active, checked }`. **Conserva el texto** (es el nombre accesible) |

## Teclado

| Tecla | Acción |
| --- | --- |
| Enter / Espacio / ↓ (en el disparador) | Abre con el foco en el primero |
| ↑ (en el disparador) | Abre con el foco en el último |
| ↑ ↓ / Inicio / Fin | Anterior, siguiente (cíclico), primero y último |
| Letra | Salta al siguiente elemento que empieza por ella (búfer de 500ms) |
| → (RTL: ←) | Abre el submenú |
| ← (RTL: →) o Esc en un submenú | Cierra ese nivel |
| Esc | Cierra y devuelve el foco |
| Tab | Cierra |

## El disparador

`attrs` trae el `id` del disparador, que genera `GMenu` (`{id}-trigger`, con `{id}` la prop `id` o uno generado), y `aria-labelledby` de la lista lo usa como nombre. **Regla:** no pongas tu propio `id` al botón; si necesitas conocerlo o fijarlo, usa la prop `id` de `GMenu`.

- **Con `GBtn` como disparador** (o cualquier componente de **varias raíces**): `GBtn` tiene dos raíces (el botón y su región de estado), así que la referencia del slot es una instancia cuyo `$el` es el **ancla vacía del fragmento**, no el botón. `GMenu` toma entonces el **primer hermano elemento** del ancla (que no sea una lista de menú). Antes de #308 solo buscaba `{id}-trigger`, y un `id` propio hacía que el menú **no se abriera, sin avisar**.
- **Un `id` propio ya no rompe el menú, pero sigue sin ser el camino:** el menú **se abre**, la lista usa **ese `id` real** en `aria-labelledby` (el nombre accesible no se pierde) y en desarrollo sale **un** aviso: «[Grana GMenu] el disparador tiene id="…"; GMenu necesita "…-trigger" (usa la prop `id` de GMenu).» Se mantiene el aviso para no dejar que un `id` ajeno funcione por casualidad.

## Personalidad

**Una sola luz que viaja.** Cada lista (y cada submenú) tiene **un único resaltado** que se desliza hasta el elemento activo, en lugar de que cada elemento encienda y apague su fondo. Por qué: al barrer con el puntero ya no queda una estela de dos elementos medio encendidos, y como **el puntero mueve el foco**, ratón y teclado son la misma señal: lo iluminado es donde seguirá la flecha. Es corto y firme (`--g-duration-press` con `--g-ease-out`, sin rebote: un menú se abre cien veces al día).

- **El activo** es el elemento enfocado de la lista; si el foco está en un submenú, es el padre expandido en la lista de arriba.
- **El puntero mueve el foco** en el acto al entrar en un elemento **habilitado** (ratón o lápiz; con `preventScroll`). Sobre un deshabilitado no mueve nada; con el teclado, el deshabilitado sí se enfoca, como antes. Abrir un submenú con el puntero sigue esperando 180ms. Un foco puesto por el puntero no dibuja el anillo de `:focus-visible`.
- **Al abrir**, el resaltado aparece en su sitio sin viajar desde arriba (primera colocación, `is-highlight-instant`); lo mismo al abrir un submenú. Si el puntero entra con la lista ya abierta, la luz **sí** viaja desde el elemento que tenía el foco.
- **Datos** (internos, en cada lista): `--_active-y` y `--_active-h` (px), y las clases `has-highlight` e `is-highlight-instant`. El elemento `g-menu__highlight` es decorativo (`aria-hidden`).
- **Con `prefers-reduced-motion: reduce`** el resaltado salta, sin desplazamiento, con fundido.
- **Con `forced-colors`** el resaltado se oculta y manda el estilo de foco del sistema: el contorno `Highlight` en el activo y en el padre expandido.

**Submenú con intención.** Con un submenú abierto, mientras el puntero va del padre hacia él **dentro del triángulo** que forman su posición y las dos esquinas del borde cercano del submenú (el lado se espeja en RTL), cruzar otros elementos del padre **no cambia el activo ni cierra el submenú**: se acabó que el submenú se cierre «solo» al cruzar en diagonal. Si el puntero se detiene **180ms** sobre otro elemento (o sale del triángulo), cambia como siempre. Los 180ms (`HOVER_MS`) son la misma pausa que abre un submenú, una constante de diseño y no un token. No rige con el teclado, con toque ni cuando el submenú tapa a su padre (pantallas estrechas).

**Con el puntero quieto** sobre un elemento del padre, abrir un submenú con → o Enter ya no lo cierra al instante ni suelta el foco: el teclado cancela la espera pendiente del puntero (defecto previo, corregido en `42a953a`).

### Verificación

Spec `design/lab/theme-playground/tests/personalidad-menu.spec.mjs` sobre el `GMenu` real del UMD, en Chromium, Firefox y WebKit salvo lo indicado (coco, [`estilo.md`](../../../../../design/lab/menu/estilo.md), «Personalidad»):

| Qué | Resultado |
| --- | --- |
| Barrido con el puntero (9 elementos, ida y vuelta, con el deshabilitado) | **0** elementos con fondo propio y como máximo **1** superficie por lista en todos los cuadros (102, 108 y 128 cuadros en Chromium, Firefox y WebKit); el puntero mueve el foco; termina exacto (±1px en las cuatro aristas) |
| Trayecto (Renombrar → Por nombre, de 6 a 225px), recorrido determinista cada 8ms | `translate` 160ms con `cubic-bezier(0.23, 1, 0.32, 1)`; 15 valores intermedios, monótono, **sin sobrepaso**, termina exacto |
| Tiempo real (solo Chromium) | 7 cuadros intermedios (kiwi: 7) |
| Teclado | la luz sigue al foco en los 8 elementos (incluido el deshabilitado) y en el submenú, que tiene la suya; el padre expandido conserva la suya; vuelve con Esc |
| Primera colocación | al abrir con clic, con ↑ y al abrir un submenú: `is-highlight-instant` en los dos primeros cuadros, 0 transiciones de posición o alto |
| Lista con desplazamiento y RTL | la luz sigue exacta al elemento con la lista desplazada; en RTL ocupa el ancho del elemento |
| `reduce` | `transition-property: opacity` (120ms); 0 transiciones de `translate` |
| `forced-colors` (emulado, solo Chromium) | luz `display: none`; contorno sólido de 3px en el activo y en el padre expandido |
| Puntero quieto sobre el padre | → abre el submenú, ← lo cierra y el foco no se pierde |
| Contraste sobre la luz (texto · atajo e icono · deshabilitado · peligroso) | claro por defecto 16,10 · 4,72 y 6,90 · 4,72 · 5,08; oscuro por defecto 17,00 · 6,93 y 9,59 · 6,93 · 5,05; tema generado `spotify` claro 16,19 · 4,70 y 6,87 · 4,70 · 5,11, oscuro 17,09 · 6,96 y 9,62 · 6,96 · 5,05 (iguales en los tres motores) |
| Consumidor: menú de fila de `GTable` (solo Chromium) | una superficie, el puntero mueve el foco y la luz termina exacta |

**El triángulo (M4) está cubierto por pruebas de vitest** (`GMenu.test.js`, jsdom): en diagonal no cambia foco ni submenú, en recto cambia en el acto y cierra a los 180ms, parado dentro del triángulo cambia, RTL espejado y sin triángulo en cascada. **No se ha medido en un navegador real** con el puntero físico.

**Sin verificar:** lector de pantalla real con el foco siguiendo al puntero (VoiceOver, NVDA), `forced-colors` real (solo emulado en Chromium) y táctil real (con toque, el foco no lo mueve el puntero y la luz sigue al foco).

## Accesibilidad

- `role="menu"` con nombre por el disparador (o `label`); `li role="none"`; `menuitem`, `menuitemcheckbox` y `menuitemradio`; los grupos con título que los nombra; los submenús con `aria-haspopup`, `aria-expanded` y el nombre del padre.
- **El significado no depende solo del color:** casilla con `check`, opción con `circle`, peligroso con `triangle-alert` y negrita, deshabilitado tachado; todos iconos de Lucide decorativos.
- Elementos de 36px (44px con puntero táctil); foco siempre visible.
- **Marca de lo elegido** (DECISIONS #431 y #432): la casilla marcada de `menuitemcheckbox` y la opción marcada de `menuitemradio` conservan el relleno `primary` y la marca `on-primary`; su **contorno** pasa a `--g-color-primary-text`. Sin cambio visible con el tema por defecto; con una marca pálida aparece el filo que recorta la marca contra la superficie. Mínimo medido contra la superficie: **4.21:1** (medido por coco, [`design/lab/contraste-marcado/estilo.md`](../../../../../design/lab/contraste-marcado/estilo.md), tres motores) en el tema por defecto, lustre, spotify y uno con clave `primary` propia, claro y oscuro.

## Tema

Solo lee `var(--g-*)`; **sin tokens nuevos** (la luz usa `--g-color-surface-sunken` y los tiempos `--g-duration-{fast|press}` y las curvas `--g-ease-{standard|out}`). El ancho mínimo y máximo de la lista derivan de `space` (200 y 320px con `space` 4).

## Límites

- Sin menú contextual ni anclaje a un elemento arbitrario; sin barra de menús ni elementos con contenido libre.
- El componente **no fuerza la exclusividad** de las opciones: la aplicación marca `checked`.
- Sin verificar: lector de pantalla real, Firefox y Safari (`popover`, `:dir()`), táctil real. Auditado con un tema propio (contrastes ≥ 7:1, foco de 3px, alto por token); `forced-colors` y `pointer: coarse` solo se comprobaron por presencia en la hoja (para la personalidad, `reduce` y `forced-colors` sí se emularon: ver arriba).

## Fuentes

API: [`GMenu.meta.json`](./GMenu.meta.json) · Contrato: [`design/contracts/menu.md`](../../../../../design/contracts/menu.md) · Prototipo: [`design/lab/menu/r01/`](../../../../../design/lab/menu/r01/) · Estilo: [`design/lab/menu/estilo.md`](../../../../../design/lab/menu/estilo.md) · Personalidad: [`design/lab/personalidad/r01/`](../../../../../design/lab/personalidad/r01/)
