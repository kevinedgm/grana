# GWidgetGallery

Galería para **añadir widgets a un panel**: una **hoja lateral modal** (sobre [`GDialog`](../GDialog/README.md), `placement="end"`) con búsqueda, categorías, contador de resultados y una tarjeta por widget disponible (vista previa, tamaño inicial y botón Añadir). **No crea widgets ni guarda el layout**: emite `add` y tu aplicación actualiza el layout de [`GWidgetGrid`](../GWidgetGrid/README.md).

**Etiqueta:** `<g-widget-gallery>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/widget/auditoria-2.md`](../../../../../design/lab/widget/auditoria-2.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`. Usa `<dialog>` e `inert`.

## Uso

```vue
<script setup>
import { computed, ref } from 'vue'
const abierta = ref(false)
const layout = ref([{ id: 'a', w: 2, h: 3, kind: 'revenue' }])

const items = [
  { id: 'revenue', title: 'Ingresos', category: 'Finanzas', description: 'Ingresos del periodo con tendencia y meta.', sizes: ['m', 'l'], unique: true },
  { id: 'tasks', title: 'Tareas abiertas', category: 'Equipo', description: 'Tareas pendientes por persona.', sizes: ['s', 'm', 'l'] }
]
const sizes = [{ id: 's', label: 'Pequeño (1×2)' }, { id: 'm', label: 'Mediano (2×2)' }, { id: 'l', label: 'Grande (2×3)' }]
const dims = { s: [1, 2], m: [2, 2], l: [2, 3] }
// Cuántas copias de cada widget hay ya en el panel
const added = computed(() => layout.value.reduce((o, e) => ({ ...o, [e.kind]: (o[e.kind] || 0) + 1 }), {}))

const añadir = ({ id, size }) => {
  const [w, h] = dims[size]
  layout.value = [...layout.value, { id: `${id}-${Date.now()}`, w, h, kind: id }]   // al final
}
// Todo texto lo pones tú (Grana no trae textos)
const labels = { search: 'Buscar widgets', all: 'Todas', categories: 'Categoría', add: 'Añadir', size: 'Tamaño inicial',
  results: '{count} widgets', empty: 'Ningún widget coincide con la búsqueda.', added: 'Ya añadido', addedCount: 'En el panel: {count}',
  addedShort: 'Añadido', addedToPanel: '{title} añadido', alreadyAdded: '{title} ya está en el panel', close: 'Cerrar', list: 'Widgets disponibles' }
</script>

<template>
  <g-btn @click="abierta = true">Añadir widget</g-btn>
  <g-widget-gallery v-model="abierta" title="Añadir widget" description="Elige un widget y su tamaño inicial."
    :items="items" :sizes="sizes" :added="added" :labels="labels" @add="añadir">
    <template #preview="{ item }">
      <g-widget :title="item.title" level="m" :labels="widgetLabels"><MiContenidoDeEjemplo :item="item" /></g-widget>
    </template>
  </g-widget-gallery>
</template>
```

> En plantillas dentro del HTML (sin compilar), escribe `<g-widget-gallery ...></g-widget-gallery>`: Vue no admite etiquetas de componente autocerradas.

## Comportamiento

- **Al abrir**, el foco va al **campo de búsqueda**. Al cerrar vuelve al elemento que abrió la galería (comportamiento nativo de `<dialog>`).
- **Búsqueda** en vivo, sin distinguir mayúsculas ni acentos, por título, descripción y categoría; se combina con la categoría.
- **Contador** de resultados en una región de estado, y mensaje (o slot `empty`) sin resultados.
- **Añadir** emite `add { id, size }`; el foco se queda en el botón (se pueden añadir varios seguidos) y se anuncia `labels.addedToPanel`. **Se añade al final:** después se reordena con `GWidgetGrid`. Arrastrar desde la galería a una posición no existe.
- **Ya añadido:** la tarjeta muestra una marca **de texto** (`labels.added` para un único, `labels.addedCount` para un repetible). Un widget `unique` ya añadido deja su botón en `aria-disabled="true"` con `labels.addedShort` (sigue enfocable) y, al pulsarlo, anuncia `labels.alreadyAdded`.
- **Vista previa:** un slot que pinta un widget con datos simulados. El componente la envuelve en un contenedor `aria-hidden` e `inert`: es decorativa, y el nombre y la descripción de la tarjeta dicen lo mismo en texto.
- Los **anuncios viven dentro de la hoja** (mientras un diálogo modal está abierto, el resto de la página es inerte). Con el método `announce(texto)` puedes anunciar algo más rico, por ejemplo la posición («Posición 3 de 3»).

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | Boolean | hoja abierta | `false` |
| `items` | Array | `[{ id, title, category?, description?, sizes?, unique? }]` | `[]` |
| `added` | Object | `{ [id]: copias en el panel }` | `{}` |
| `sizes` | Array | `[{ id, label }]`: catálogo de tamaños con sus nombres | sin valor |
| `categories` | Array | `[{ id, label }]`; sin valor, se derivan de `items[].category` | derivadas |
| `title` | String | título de la hoja (**obligatorio**) | sin valor |
| `description` | String | descripción de la hoja | sin valor |
| `size` | String | `sm` `md` `lg` (ancho de la hoja) | `sm` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `labels` | Object | ver «Textos» | `{}` |
| `id` | String | | generado |

- **`items`:** cada uno con `id` único y `title` (los demás se ignoran y avisan). `sizes` son los **ids** de tamaño permitidos para ese widget (el primero es el inicial); sin él, valen todos los del catálogo. Con un solo tamaño, el selector no se muestra. Los campos extra llegan a los slots.
- **`sizes`:** los ids son **los de tu aplicación** (normalmente los `presets` de `GWidgetGrid`) y `label` lo pones tú.
- **Sin categorías** el filtro no se muestra. «Todas» (`labels.all`) es siempre la primera.
- Un valor fuera de su lista avisa en desarrollo. **`class`, `style` y `data-*` van al `<dialog>`.**

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | Boolean | El usuario cierra la hoja (siempre `false`) |
| `add` | `{ id, size }` | Pulsa Añadir (no se emite para un único ya añadido) |
| `search` | `{ query, category, count }` | Cambia el filtro |
| `open`, `closed` | | Como en `GDialog` |

Método expuesto: `announce(texto)`.

## Slots

| Slot | Contenido |
| --- | --- |
| `preview` | Vista previa de la tarjeta. Alcance `{ item, size }` |
| `card` | Sustituye el contenido de la tarjeta (nombre, descripción, vista previa). Alcance `{ item, added, size }`; el selector y el botón los conserva el componente |
| `empty` | Estado vacío. Alcance `{ query }` |
| `footer` | Pie de la hoja. Alcance `{ close }`; sin él, un botón Cerrar si hay `labels.close` |

## Textos (`labels`)

Ninguno tiene valor por defecto. Marcadores: `{title}`, `{count}`.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `search` | Etiqueta del campo de búsqueda | Sí |
| `add` | Texto del botón Añadir | Sí |
| `results` | Contador («{count} widgets») | Sí |
| `close` | Botón Cerrar y nombre de la ✕ | Sí |
| `all`, `categories` | Categoría «Todas» y leyenda (oculta) del grupo | Sí, con categorías |
| `size` | Etiqueta del selector de tamaño | Sí, con más de un tamaño |
| `empty` | Mensaje sin resultados | Sí |
| `added`, `addedShort` | Marca y botón de un único ya añadido | Sí, con `unique` |
| `addedCount` | Marca de un repetible («En el panel: {count}») | Sí, con repetibles |
| `addedToPanel`, `alreadyAdded` | Anuncios | Recomendado |
| `list` | Nombre de la lista de tarjetas | Recomendado |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Búsqueda, categorías (un solo tope; ← → ↑ ↓ cambian de categoría), y en cada tarjeta el tamaño y Añadir; no sale de la hoja |
| Enter / Espacio (Añadir) | Emite `add` |
| Esc | Cierra |

## Accesibilidad

- Hoja modal de `GDialog`: nombre por el título, foco atrapado, Esc, hoja inferior en móvil.
- Categorías: radios nativos con **relleno y una marca ✓** (no solo color). La marca de añadido es **texto**.
- Cada tarjeta es un `<article>` con nombre y descripción; el botón lleva el título como texto oculto.
- Campos nativos con etiqueta visible; controles de 36px (44px con puntero táctil).

## Tema

Solo lee `var(--g-*)`; **sin tokens nuevos**. El ancho de la hoja sale de `size` (400px con `space` 4 y `sm`).

## Sin verificar

Lector de pantalla real (resultados y anuncios); Firefox y Safari (`<dialog>`, `inert`; en Safari el foco puede no volver al botón que abrió la hoja, porque no enfoca los botones al hacer clic); `forced-colors`, `pointer: coarse` y `prefers-reduced-motion` reales; catálogos de cientos de widgets (sin virtualización ni búsqueda en servidor).

## Fuentes

- API: [`GWidgetGallery.meta.json`](./GWidgetGallery.meta.json) · Contrato: [`design/contracts/widget-gallery.md`](../../../../../design/contracts/widget-gallery.md) · Prototipo: [`design/lab/widget/r02/`](../../../../../design/lab/widget/r02/) · Auditoría: [`design/lab/widget/auditoria-2.md`](../../../../../design/lab/widget/auditoria-2.md)
