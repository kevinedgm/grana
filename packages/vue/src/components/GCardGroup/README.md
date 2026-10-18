# GCardGroup

Fila de tarjetas de métrica que filtran la región de debajo (casi siempre una `GTable`): «Pendientes 8 · Vencidas 4 · Pagadas 10 · En disputa 2». Pulsar una tarjeta filtra; pulsarla otra vez quita el filtro. **`GCardGroup` no dibuja tarjetas**: coordina las `GCard` hijas y les da lo que una tarjeta sola no puede tener: exclusividad (o varias con `multiple`), una sola parada de Tab y la cifra en la descripción del botón. **No es para valores de formulario**: si siempre tiene que haber una tarjeta elegida, usa `GCard selectType="radio"` con un `role="radiogroup"` tuyo o `GRadioGroup appearance="card"`.

**Etiqueta:** `<g-card-group>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/card-group/auditoria.md`](../../../../../design/lab/card-group/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`.

> **La lengüeta exige la región filtrada justo debajo.** Con el slot `panel`, las tarjetas se apoyan en el marco del panel y un puente visual une la pulsada al marco. Sin el slot `panel`, el grupo es una rejilla. Si entre las tarjetas y la tabla va algo más (un título, botones), no uses el slot `panel` y une el modelo con un `computed` (ver [Receta con la tabla](#receta-con-la-tabla)).

## En esta página

[§ Uso](#uso) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Teclado y foco](#teclado-y-foco) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Limitaciones conocidas](#limitaciones-conocidas)

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import GranaCardGroup from '@grana/vue/card-group'
import '@grana/vue/style.css'

createApp(App).use(Grana).use(GranaCardGroup).mount('#app')
```

```vue
<script setup>
import { ref, computed } from 'vue'

const metricas = [
  { value: 'pendiente', title: 'Pendientes', count: 8 },
  { value: 'vencida',   title: 'Vencidas',   count: 4 },
  { value: 'pagada',    title: 'Pagadas',     count: 10 },
]

const filters = ref([])
const estado = computed({
  get: () => {
    const f = filters.value.find((x) => x.key === 'estado' && x.op === 'in')
    return f && f.value.length === 1 ? f.value[0] : null
  },
  set: (v) => {
    const rest = filters.value.filter((x) => x.key !== 'estado')
    filters.value = v == null ? rest : [...rest, { key: 'estado', op: 'in', value: [v] }]
  }
})

const columns = [/* … */]
const rows    = ref([/* … */])
const textos  = { empty: 'No hay facturas', emptyFiltered: 'No hay resultados con estos filtros', retry: 'Reintentar', loading: 'Cargando facturas', loaded: 'Facturas cargadas' }
const tablabels = { caption: 'Facturas', /* … */ }
</script>

<template>
  <g-card-group v-model="estado" label="Filtrar facturas por estado">
    <g-card
      v-for="m in metricas"
      :key="m.value"
      :value="m.value"
      :title="m.title"
      :labels="{ loading: 'Cargando', loaded: 'Listo' }"
    >
      <g-metric :value="m.count" label="facturas" />
    </g-card>
    <template #panel="{ filtered }">
      <g-table
        :columns="columns"
        :rows="rows"
        v-model:filters="filters"
        :labels="tablabels"
        :empty-labels="textos"
      />
    </template>
  </g-card-group>
</template>
```

**Los textos no tienen valor por defecto** (Grana es internacional): el nombre de la barra va en `label` o `labelledby` (sin ninguno de los dos, aviso G1 en desarrollo).

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-card-group ...></g-card-group>`: Vue no admite etiquetas de componente autocerradas.

## Ejemplos

### e1 · Filtro de estado con lengüeta

```vue
<!-- Fragmento: `estado`, `columns`, `rows`, `filters` y `tablabels` son de tu aplicación -->
<!-- La tarjeta pulsada y el chip de la barra son la misma verdad; el computed las une -->
<g-card-group v-model="estado" label="Filtrar facturas por estado">
  <g-card value="pendiente" title="Pendientes" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
    <g-metric :value="8" label="facturas" />
  </g-card>
  <g-card value="vencida" title="Vencidas" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
    <g-metric :value="4" label="facturas" trend="up" trend-label="+1 desde ayer" />
  </g-card>
  <g-card value="pagada" title="Pagadas" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
    <g-metric :value="10" label="facturas" />
  </g-card>
  <template #panel>
    <g-table :columns="columns" :rows="rows" v-model:filters="filters" :labels="tablabels" />
  </template>
</g-card-group>
```

Úsalo cuando el estado filtra la tabla y quitar el chip debe soltar la tarjeta. El `computed` bidireccional es la receta de cinco líneas del [contrato](../../../../../design/contracts/card-group.md): no hay prop de filtros en el grupo. No lo uses si siempre debe haber una tarjeta activa: ahí es un radio.

### e2 · Filtro múltiple: Pendientes y Vencidas a la vez

```vue
<!-- Fragmento: `filters`, `columns`, `rows` y `tablabels` son de tu aplicación -->
<script setup>
import { computed } from 'vue'

const estados = computed({
  get: () => {
    const f = filters.value.find((x) => x.key === 'estado' && x.op === 'in')
    return f ? f.value : []
  },
  set: (v) => {
    const rest = filters.value.filter((x) => x.key !== 'estado')
    filters.value = v.length === 0 ? rest : [...rest, { key: 'estado', op: 'in', value: v }]
  }
})
</script>

<template>
  <g-card-group v-model="estados" multiple label="Filtrar facturas por estado">
    <g-card value="pendiente" title="Pendientes" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
      <g-metric :value="8" label="facturas" />
    </g-card>
    <g-card value="vencida" title="Vencidas" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
      <g-metric :value="4" label="facturas" />
    </g-card>
    <template #panel>
      <g-table :columns="columns" :rows="rows" v-model:filters="filters" :labels="tablabels" />
    </template>
  </g-card-group>
</template>
```

Con `multiple`, el modelo es un arreglo. Pulsar Pendientes y Vencidas aplica un filtro `in` con dos valores (OR entre los elegidos). El grupo conserva en el arreglo los valores que no reconoce (los que vinieron de la barra de filtros con otro chip), de modo que no se pierden al pulsar una tarjeta.

### e3 · Sin panel: rejilla de métricas independiente

```vue
<!-- Fragmento: `estado`, `columns`, `rows`, `filters` y `tablabels` son de tu aplicación -->
<!-- Sin slot panel: el grupo se convierte en una rejilla; la tabla va fuera -->
<g-card-group v-model="estado" label="Resumen por estado">
  <g-card value="pendiente" title="Pendientes" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
    <g-metric :value="8" label="facturas" />
  </g-card>
  <g-card value="vencida" title="Vencidas" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
    <g-metric :value="4" label="facturas" />
  </g-card>
</g-card-group>

<h2 id="titulo-tabla">Facturas</h2>
<g-table
  :columns="columns"
  :rows="rows"
  v-model:filters="filters"
  :labels="tablabels"
  aria-labelledby="titulo-tabla"
/>
```

Úsalo cuando entre las tarjetas y la tabla va contenido adicional (un título, acciones de fila), o cuando prefieras una rejilla adaptable en lugar de la fila con desplazamiento. Sin el slot `panel` no hay lengüeta ni puente: la relación con la tabla la comunicas con `controls`.

### e4 · Tarjeta de total estática (sin `value`)

```vue
<!-- Fragmento: `estado`, `columns`, `rows`, `filters` y `tablabels` son de tu aplicación -->
<!-- Una GCard sin value es estática: se pinta en la rejilla pero queda fuera de la parada de Tab -->
<g-card-group v-model="estado" label="Filtrar facturas por estado">
  <g-card title="Total" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
    <g-metric :value="24" label="facturas" />
  </g-card>
  <g-card value="pendiente" title="Pendientes" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
    <g-metric :value="8" label="facturas" />
  </g-card>
  <g-card value="vencida" title="Vencidas" :labels="{ loading: 'Cargando', loaded: 'Listo' }">
    <g-metric :value="4" label="facturas" />
  </g-card>
  <template #panel>
    <g-table :columns="columns" :rows="rows" v-model:filters="filters" :labels="tablabels" />
  </template>
</g-card-group>
```

Una tarjeta sin `value` queda fuera de la parada de Tab y no emite. Úsala para el total o cualquier métrica de contexto que no filtra.

## Receta con la tabla

El grupo no conoce la tabla y no tiene prop de filtros. La aplicación une el `v-model` del grupo con los `filters` de la tabla con un `computed` de lectura y escritura:

```js
// Sin multiple: la tarjeta queda pulsada solo si el filtro del campo tiene exactamente un valor
const estado = computed({
  get: () => {
    const f = filters.value.find((x) => x.key === 'estado' && x.op === 'in')
    return f && f.value.length === 1 ? f.value[0] : null
  },
  set: (v) => {
    const rest = filters.value.filter((x) => x.key !== 'estado')
    filters.value = v == null ? rest : [...rest, { key: 'estado', op: 'in', value: [v] }]
  }
})

// Con multiple: get devuelve f ? f.value : [] (el grupo conserva los desconocidos)
// set escribe { key, op: 'in', value: v } o quita el filtro si v está vacío
```

Quitar el chip de la barra suelta la tarjeta; pulsar otra sustituye el filtro. El anuncio del recuento lo hace la tabla al cambiar `filters` (#569), también cuando el cambio viene del grupo.

## Props

| Prop | Tipo y default | Descripción |
| --- | --- | --- |
| `modelValue` | `String \| Number \| Array \| null = null` | `v-model`. Sin `multiple`: el `value` de la tarjeta pulsada o `null`. Con `multiple`: arreglo de `value` en el orden de las tarjetas en el DOM (`[]` sin ninguna pulsada, nunca `null`). Los valores desconocidos se conservan al final. Igualdad `===`. |
| `multiple` | `Boolean = false` | Varias tarjetas pulsadas a la vez (un filtro `in` con varios valores). |
| `label` | `String = null` | Nombre accesible de la barra (`aria-label` de `role="toolbar"`). Uno de `label` / `labelledby` es obligatorio (aviso G1). |
| `labelledby` | `String = null` | `id` de un elemento visible que nombra la barra (`aria-labelledby`). |
| `controls` | `String = null` | `id` de la región que se filtra: se escribe como `aria-controls` en cada botón gestionado. Sin él y con el slot `panel`, vale el `id` del panel. Un `id` que no existe tras montar avisa (G9). |
| `id` | `String = null` | `id` de la raíz (se genera si falta). El panel es `ID-panel`. |

### Tarjetas hijas

Dentro de un `GCardGroup` cada `GCard` puede ser **gestionada** (con `value`) o **estática** (sin `value`). El grupo da un contexto que la `GCard` lee al detectar que está dentro de uno:

| `interaction` de la hija | `value` | Resultado |
| --- | --- | --- |
| `auto` (por defecto) | con `value` | `toggle` gestionado: `aria-pressed` del grupo, en la parada |
| `auto` | sin `value` | estática, fuera de la parada |
| `toggle` | con `value` | `toggle` gestionado |
| `toggle` | sin `value` | cae a `none` y avisa (G3) |
| `none` | cualquiera | `none`; el `value` se ignora sin aviso |
| `link`, `button`, `select` | cualquiera | cae a `none` y avisa (G2) |

Una tarjeta `disabled` o `loading` queda fuera de la parada. Si pasa a `disabled` mientras está pulsada, sigue `aria-pressed="true"` pero no se puede soltar desde ella: se suelta con la × del chip de la barra.

**En v1 no se admiten tarjetas gestionadas con controles secundarios** (menú, acciones, pie, enfocables en el contenido): la barra de una parada no puede tener paradas dentro. Aviso G5; reservado (#609).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String \| Number \| null` — con `multiple`, `Array` (nuevo) | La persona alterna una tarjeta gestionada (clic, toque, Espacio, Intro). Las flechas no emiten. Una tarjeta `disabled` o `loading` no emite. |
| `change` | `{ value, pressed }` | El mismo gesto, después de `update:modelValue`: `value` de la tarjeta alternada y su estado nuevo. No cancelable. Un cambio de `modelValue` desde fuera no lo emite. |

## Slots

| Slot | Propósito | Alcance |
| --- | --- | --- |
| `default` | Las `GCard` (gestionadas o estáticas). Dentro de la barra. | — |
| `panel` | La región que se filtra (la `GTable` con su `GFilterBar`) y nada más. Activa la lengüeta. | `{ filtered: Boolean }` |

## Teclado y foco

APG *Toolbar* pattern: una sola parada de Tab. Las flechas mueven el foco; no filtran. Elegible = tarjeta gestionada sin `disabled` ni `loading`.

| Tecla | Acción |
| --- | --- |
| **Tab** | Entra una vez en: la pulsada (la primera pulsada en el DOM en `multiple`) → si no hay o no es elegible, la última enfocada → si no, la primera elegible. Vuelve a salir hacia lo siguiente. |
| **→ / ←** | Siguiente / anterior elegible. **Se espejan en RTL** (según la dirección calculada de la barra). |
| **↓ / ↑** | Siguiente / anterior elegible, linealmente (útil en una rejilla con dos filas). |
| **Inicio / Fin** | Primera / última elegible. Sin vuelta en los extremos. |
| **Espacio / Intro** | Alternan la tarjeta enfocada. |
| Modificadores (Alt, Ctrl, ⌘) | No se interceptan. |

- **Foco itinerante:** exactamente una tarjeta elegible lleva `tabindex="0"`; el resto, `-1`. Se recalcula al cambiar el modelo, al montar o desmontar tarjetas y al cambiar `disabled` / `loading`. Si la del `0` deja de ser elegible con el foco dentro, el foco pasa a la siguiente elegible (si no, a la anterior).
- **Ver la tarjeta entera:** al mover el foco (flechas, Inicio, Fin, Tab) el grupo desplaza la tira para que la tarjeta entera quede visible, no solo su botón. Con `prefers-reduced-motion: reduce`, sin desplazamiento suave.
- **Sin `data-g-key-focus`:** las tarjetas son botones que WebKit sí marca con anillo de foco nativo (#441; medido en los tres motores por kiwi).
- **Tira desplazable (#570):** con el slot `panel`, la tira lleva `tabindex="-1"` para que Firefox no añada una parada en ella.

## Accesibilidad

- **Estructura:** la barra es `role="toolbar"` con `aria-label` o `aria-labelledby` (prop `label` / `labelledby`). Sin región viva propia: el lector dice «presionado» y el recuento lo anuncia la tabla (#569). Sin `role="radiogroup"`, `listbox`, `tablist` ni `aria-selected`.
- **Tarjeta pulsada:** `aria-pressed="true"`. Dentro del grupo, el botón principal de cada tarjeta gestionada lleva `aria-describedby` apuntando al `g-card__content`, de modo que el lector dice «Vencidas, botón de alternar, no presionado, Facturas 4, +1 desde ayer» en vez de solo «Vencidas».
- **Puente:** `aria-hidden="true"` y sin `pointer-events`; no es interactivo.
- **`aria-controls`:** apunta al `id` del panel (o a `controls`) en cada botón gestionado. Su soporte es desigual (JAWS lo ofrece, VoiceOver lo ignora): ayuda, pero el comportamiento no depende de él.
- **Sin depender del color:** el estado filtrado lo dice el borde que se abre hacia el panel (forma) además del color; en `forced-colors`, el puente usa `Canvas` de fondo y borde `Highlight` y el marco filtrado usa `Highlight`.
- **Contraste medido** (tema `stripe` oscuro, auditoría de coco 2026-10-14): marca vs. fondo de página 4.90:1 ≥ 3:1 (`medido`); marca vs. superficie del panel 4.53:1 ≥ 3:1 (`medido`); texto del título vs. fondo de tarjeta 15.22:1 ≥ 4.5:1 (`medido`).
- **Táctil:** la tarjeta entera es el blanco de toque (la acción principal se estira); área ≥ 44 × 44 px con `pointer: coarse` (`medido`, spec Playwright 39/39 en los tres motores).
- **RTL:** propiedades lógicas; las flechas del teclado se espejan; el puente se posiciona desde el borde derecho (`x` desde el derecho en RTL, como la marca de `GTabs`). Δx = 0, Δw = 0 con tira desplazada en RTL (`medido`).
- **Movimiento reducido:** con `prefers-reduced-motion: reduce`, el puente solo se funde (`opacity`) y salta de sitio; el marco cambia de color sin transición larga; la tira se desplaza sin suavizado. La forma del estado nunca es solo movimiento (`medido`, spec 39/39).
- **Avisos de desarrollo** (una vez cada uno, prefijo `[Grana GCardGroup]`): G1 sin `label` ni `labelledby` (G1b: `aria-label`/`aria-labelledby` en `$attrs`, usar las props); G2 tarjeta con `interaction` `link`/`button`/`select`; G3 `toggle` sin `value`; G4 `value` repetido; G5 tarjeta gestionada con controles secundarios; G6 `v-model` en una tarjeta gestionada; G7 `modelValue` de tipo distinto al modo; G8 `GCardGroup` dentro de otro; G9 `controls` con un `id` que no existe tras montar.

> **Peligro.** Poner `aria-label` o `aria-labelledby` directamente en `<g-card-group>` no nombra la barra: el atributo va a la raíz y avisa (G1b). El nombre de la barra va siempre en las props `label` o `labelledby`. Sin ninguna, la barra de herramientas queda sin nombre y los lectores de pantalla no pueden identificar qué controla.

## Personalidad

El puente («Lengüeta», decisión del usuario, #611): cuando hay un slot `panel`, al pulsar una tarjeta, un puente visual cierra la ranura entre la tarjeta y el marco del panel, de modo que la tarjeta pulsada parece la pestaña que abre la región. El marco toma la familia de la marca (`--g-color-primary-text`) mientras haya alguna tarjeta pulsada.

| Momento | Movimiento | Tokens |
| --- | --- | --- |
| Primer posicionamiento | Sin animar (clase `is-ready` tras el primero, como `GTabs`) | — |
| Aparece (nada pulsado → pulsada) | Crece desde la tarjeta hacia el marco (`transform` en el eje de bloque) | `--g-duration-slow`, `--g-ease-out` |
| Cambia de tarjeta (sin `multiple`) | Viaja (posición y ancho), como la marca de `GTabs` | `--g-duration-press`, `--g-ease-out` |
| Se retira (soltar) | Se recoge hacia la tarjeta (`is-leaving` mientras dura) | `--g-duration-fast`, `--g-ease-out` |
| Marco del panel | Cambio de color del borde | `--g-duration-fast`, `--g-ease-out` |
| Cambio de tamaño, densidad o desplazamiento de la tira | Sin animar | — |

**Sin muelle:** ni `--g-ease-spring` ni `--g-ease-bounce` (#299 limita el muelle a `GTabs`). El puente toma el recorrido de la marca de `GTabs`, no su curva.

**Con `prefers-reduced-motion: reduce`:** el puente solo se funde (`opacity`, `--g-duration-fast`) y salta de sitio. El marco cambia de color sin transición larga. La tira se desplaza sin suavizado. Patrón único de movimiento reducido de #299. (`medido`, spec 39/39 en los tres motores)

**Con `multiple`:** hay un puente por cada tarjeta pulsada; cada uno aparece y se retira por su cuenta (no viajan). Sin `multiple`, el mismo nodo DOM viaja de tarjeta en tarjeta. (`medido`)

**Geometría del puente:** posición con variables `--_bridge-x` y `--_bridge-w` en px, medidas contra la caja de relleno de la tira incluyendo su desplazamiento. Se recolocan con `ResizeObserver` sobre la tira y al cargar las fuentes; solo se escriben si cambian. Excepción justificada a «sin estilos en línea», como la marca de `GTabs` y `GMenu`. Δx = 0, Δw = 0 medidos con `stripe` oscuro. (`medido`)

## Tema

No hay tokens propios `--g-card-group-*`: el grupo reutiliza los del sistema. Los tokens de las `GCard` hijas se documentan en su [propio README](../GCard/README.md).

| Token | Qué es |
| --- | --- |
| `--g-color-border-strong` | Color del marco del panel en reposo |
| `--g-color-primary-text` | Color del marco filtrado y de los bordes del puente |
| `--g-card-selected` | Relleno del puente (mismo tinte que la tarjeta seleccionada) |
| `--g-color-surface` | Parte del relleno del puente que cubre la ranura |
| `--g-space-1` | Ranura entre tarjetas y marco (× 2), mínimo de la rejilla (× 34), mínimo de la lengüeta (× 44) |
| `--g-radius-lg` | Radio del marco del panel |
| `--g-border-width` | Grosor del borde; el borde doble de la tarjeta y del puente es `2 × --g-border-width` |
| `--g-duration-fast` | Retirada del puente y cambio de color del marco |
| `--g-duration-press` | Viaje del puente entre tarjetas |
| `--g-duration-slow` | Aparición del puente |
| `--g-ease-out` | Todas las transiciones del puente y del marco |

```css
:root {
  --g-color-primary-text: #7A1E3A;   /* el puente y el marco filtrado toman esta familia */
  --g-space-1: 5px;                  /* la ranura pasa a 10px y el área táctil a 220px */
  --g-border-width: 2px;             /* el borde doble pasa a 4px y el puente lo cubre */
}
```

La ranura, el mínimo de rejilla y el ancho mínimo de la lengüeta son constantes de diseño (alias locales `--_*` de coco), no tokens: no se pueden ajustar desde el tema.

## Clases

Las emite el componente y las estiliza `GCardGroup.css`:

- **Raíz:** `g-card-group`; `has-panel` (con slot `panel`), `is-filtered` (alguna tarjeta pulsada; también en `g-card-group__panel`), `is-multiple`, `is-ready` (tras el primer posicionamiento del puente).
- **Elementos:** `g-card-group__strip` (`role="toolbar"`; con panel, `tabindex="-1"`), `g-card-group__panel` (envoltorio del slot `panel`, `id` = `ID-panel`), `g-card-group__bridge` (`aria-hidden="true"`, dentro de la barra; `--_bridge-x` y `--_bridge-w` en línea); `is-leaving` en `g-card-group__bridge` mientras el puente de una tarjeta que se suelta se retira.

## Limitaciones conocidas

- **Lector de pantalla real sin verificar:** la barra con tarjetas que contienen encabezados (NVDA en modo exploración podría leer el `h3` y el botón por separado) y `aria-describedby` con el contenido de la métrica. VoiceOver, NVDA y TalkBack están en la lista de verificaciones pendientes.
- **`aria-controls`** no lo anuncian todos los lectores (documentado, no es el único mecanismo).
- **Tarjetas con controles secundarios** (menú, acciones, pie, enfocables en el contenido) no se admiten en v1 (aviso G5); `role="group"` con controles secundarios está reservado (#609).
- **En móvil con el slot `panel`**, la tira es una fila que se desplaza en horizontal; puede haber tarjetas fuera de la vista inicial.
- **Pista de «hay más tarjetas»** en la tira (como `GTabs`): fuera del contrato de v1, reservada. Hoy la tira se desplaza sin pista.
- **`filterKey` + `v-model:filters`** (atajo para la receta): reservado (#608).
- **Segunda forma (`appearance`)**: en v1 la forma la decide el slot `panel` (lengüeta) o su ausencia (rejilla). Las formas `sentence` (C) y `parts` (B) están reservadas para una versión posterior (#611).
- **`forced-colors` real:** la emulación de Playwright en macOS no reproduce `forced-colors` de Windows; las reglas `forced-colors` del CSS se inspeccionaron manualmente (`sin verificar` en entorno real).
- **`filterMode: 'external'`** con carga real: el anuncio del recuento depende de la tabla (#569); no verificado en producción.

## Fuentes

- API: [`GCardGroup.meta.json`](./GCardGroup.meta.json) · Contrato: [`design/contracts/card-group.md`](../../../../../design/contracts/card-group.md) · Auditoría: [`design/lab/card-group/auditoria.md`](../../../../../design/lab/card-group/auditoria.md) · Pruebas: [`GCardGroup.test.js`](./GCardGroup.test.js) · Spec Playwright: [`design/lab/theme-playground/tests/card-group.spec.mjs`](../../../../../design/lab/theme-playground/tests/card-group.spec.mjs)
