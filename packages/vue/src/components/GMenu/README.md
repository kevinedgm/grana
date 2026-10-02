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
| `trigger` | **Obligatorio.** El disparador; alcance `{ open, attrs }`: enlaza `v-bind="attrs"` a un `<button>` o a un componente que lo renderice (p. ej. `GBtn`) |
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

## Accesibilidad

- `role="menu"` con nombre por el disparador (o `label`); `li role="none"`; `menuitem`, `menuitemcheckbox` y `menuitemradio`; los grupos con título que los nombra; los submenús con `aria-haspopup`, `aria-expanded` y el nombre del padre.
- **El significado no depende solo del color:** casilla con `check`, opción con `circle`, peligroso con `triangle-alert` y negrita, deshabilitado tachado; todos iconos de Lucide decorativos.
- Elementos de 36px (44px con puntero táctil); foco siempre visible.

## Tema

Solo lee `var(--g-*)`; **sin tokens nuevos**. El ancho mínimo y máximo de la lista derivan de `space` (200 y 320px con `space` 4).

## Límites

- Sin menú contextual ni anclaje a un elemento arbitrario; sin barra de menús ni elementos con contenido libre.
- El componente **no fuerza la exclusividad** de las opciones: la aplicación marca `checked`.
- Sin verificar: lector de pantalla real, Firefox y Safari (`popover`, `:dir()`), táctil real. Auditado con un tema propio (contrastes ≥ 7:1, foco de 3px, alto por token); `forced-colors`, `pointer: coarse` y `prefers-reduced-motion` solo se comprobaron por presencia en la hoja.

## Fuentes

API: [`GMenu.meta.json`](./GMenu.meta.json) · Contrato: [`design/contracts/menu.md`](../../../../../design/contracts/menu.md) · Prototipo: [`design/lab/menu/r01/`](../../../../../design/lab/menu/r01/) · Estilo: [`design/lab/menu/estilo.md`](../../../../../design/lab/menu/estilo.md)
