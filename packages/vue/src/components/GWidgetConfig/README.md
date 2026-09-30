# GWidgetConfig

**Carcasa del panel de configuración de un widget**: una **hoja lateral modal** (sobre [`GDialog`](../GDialog/README.md), `placement="end"`) con vista previa en vivo, pestañas, resumen de errores, «Restablecer», «Cancelar» y «Aplicar», y confirmación al descartar cambios. **El contenido de cada pestaña lo pones tú** (Datos, Estilo, Ajustes…) y **la validación también**: Grana no conoce las opciones de cada widget.

**Etiqueta:** `<g-widget-config>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/widget/auditoria-2.md`](../../../../../design/lab/widget/auditoria-2.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`. Usa `<dialog>` e `inert`.

## Uso

Un [`GWidget`](../GWidget/README.md) configurable incluye en `actions` una acción con `id: 'configure'`; al recibirla abres el panel. (No hay una prop ni un evento propios: es una convención.)

```vue
<script setup>
import { computed, reactive, ref } from 'vue'
const abierto = ref(false)
const pestaña = ref('data')
const errores = ref([])
const base = reactive({ title: 'Ingresos', period: '30', goal: '50000' })      // valores del widget
const borrador = reactive({ ...base })                                          // lo que edita el usuario
const modificado = computed(() => JSON.stringify(borrador) !== JSON.stringify(base))

const tabs = [{ id: 'data', label: 'Datos' }, { id: 'set', label: 'Ajustes' }]
const labels = { tabs: 'Secciones de la configuración', apply: 'Aplicar', cancel: 'Cancelar', close: 'Cerrar sin aplicar', reset: 'Restablecer',
  discardTitle: '¿Descartar los cambios?', keepEditing: 'Seguir editando', discard: 'Descartar',
  errorSummary: 'Corrige {count} campos', errorCount: '{count} errores' }

const configurar = (id) => { if (id === 'configure') { Object.assign(borrador, base); errores.value = []; abierto.value = true } }
const aplicar = () => {                                  // la validación es tuya
  const e = []
  if (!(Number(borrador.goal) > 0)) e.push({ tab: 'data', field: 'cfg-goal', message: 'La meta debe ser un número mayor que 0.' })
  if (!borrador.title.trim()) e.push({ tab: 'set', field: 'cfg-title', message: 'El título es obligatorio.' })
  errores.value = e
  if (e.length) return                                   // la carcasa muestra el resumen y enfoca el primero
  Object.assign(base, borrador)
  abierto.value = false
}
</script>

<template>
  <g-widget title="Ingresos" :actions="[{ id: 'configure', label: 'Configurar' }]" :labels="widgetLabels" @action="configurar($event.id)" />

  <g-widget-config v-model="abierto" v-model:tab="pestaña" :title="`Configurar ${base.title}`" :tabs="tabs"
    :errors="errores" :dirty="modificado" resettable :labels="labels"
    @apply="aplicar" @reset="Object.assign(borrador, base)">
    <template #preview><g-widget :title="borrador.title || '—'" level="m" :labels="widgetLabels">…</g-widget></template>
    <template #tab-data><MiCampo id="cfg-goal" v-model="borrador.goal" label="Meta mensual" /></template>
    <template #tab-set><MiCampo id="cfg-title" v-model="borrador.title" label="Título" /></template>
  </g-widget-config>
</template>
```

> En plantillas dentro del HTML (sin compilar), escribe `<g-widget-config ...></g-widget-config>`: Vue no admite etiquetas de componente autocerradas.

## Quién hace qué

| La carcasa (Grana) | Tu aplicación |
| --- | --- |
| Hoja, título, vista previa, pestañas, pie | Los campos de cada pestaña (`GInput`, `GSelect`, `GSwitch`…), con un **borrador** propio |
| Resumen de errores, marcas por pestaña, foco | La **validación** y el contenido de `errors` |
| Confirmación de descarte, Enter para aplicar | Saber si hay cambios (`dirty`) y **cerrar** tras aplicar |
| | Marcar cada campo con error (`aria-invalid`, texto con símbolo y `aria-describedby`) |

## Comportamiento

- **Al abrir**, el foco va a la **primera pestaña** (o al primer control si no hay pestañas) y se muestra la primera pestaña (o la del primer error). Si controlas `tab`, el componente te pide el cambio con `update:tab`. Al cerrar, el foco vuelve al elemento que abrió la hoja (**debe seguir en el DOM**).
- **Aplicar** es un botón de envío asociado al formulario de la hoja: Enter dentro de un campo también aplica. Emite `apply` y **no cierra**: lo haces tú si no hay errores.
- **Errores:** cuando rellenas `errors`, aparece el **resumen** (`role="alert"`) y recibe el foco **una vez por cada `apply`** que termina con errores (no al validar en vivo). Cada mensaje es un enlace que activa la pestaña y enfoca el campo (`field`: el `id` del elemento). Cada pestaña con errores muestra su **cantidad en texto**.
- **Cancelar, el botón de cierre (`x`) y Esc:** sin `dirty`, cierran (`cancel` y `update:modelValue`); con `dirty`, el **pie cambia** a «¿Descartar los cambios? · Seguir editando · Descartar», con el foco en «Seguir editando». Sin un diálogo dentro de otro.
- **Restablecer** (con `resettable`) emite `reset`: tú devuelves el borrador a los valores con que se abrió.
- **`applying`:** mientras guardas, `aria-busy` y «Aplicar» en `aria-disabled` (sigue enfocable); no vuelve a emitir.
- **Las pestañas no se desmontan** al cambiar: el borrador y los errores no se pierden.
- **Vista previa:** pintas un widget con los valores del borrador; el componente la hace `aria-hidden` e `inert`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | Boolean | hoja abierta | `false` |
| `title` | String | nombre accesible («Configurar Ingresos»; **obligatorio**) | sin valor |
| `description` | String | texto libre | sin valor |
| `tabs` | Array | `[{ id, label }]`; con una o ninguna no hay pestañas | `[]` |
| `tab` | String | `id` de la pestaña activa (con `update:tab`) | la primera |
| `errors` | Array | `[{ tab, field?, message }]` | `[]` |
| `dirty` | Boolean | hay cambios sin aplicar | `false` |
| `resettable` | Boolean | muestra «Restablecer» | `false` |
| `applying` | Boolean | se está aplicando | `false` |
| `size` | String | `sm` `md` `lg` | `sm` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `labels` | Object | ver «Textos» | `{}` |
| `id` | String | | generado |

Un valor fuera de su lista avisa en desarrollo. **`class`, `style` y `data-*` van al `<dialog>`.** Un error sin `message` se ignora.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `apply` | | Pulsa Aplicar (o Enter en un campo): tú validas y cierras |
| `reset` | | Pulsa Restablecer |
| `cancel` | | Cierra sin aplicar (sin cambios, o tras «Descartar») |
| `update:modelValue` | Boolean | El usuario cierra (siempre `false`) |
| `update:tab` | `id` | Cambia la pestaña activa |
| `open`, `closed` | | Como en `GDialog` |

Método expuesto: `announce(texto)` (región de estado dentro de la hoja). «X configurado» tras aplicar lo anuncias tú en tu región de la página (la hoja ya está cerrada).

## Slots

| Slot | Contenido |
| --- | --- |
| `tab-<id>` | Contenido de la pestaña `<id>` (uno por pestaña). Alcance `{ errors }`: los errores de esa pestaña |
| `default` | Contenido sin pestañas (con una o ninguna). Alcance `{ errors }` |
| `preview` | Vista previa en vivo |
| `footer-start` | Acciones extra a la izquierda del pie |

## Textos (`labels`)

Ninguno tiene valor por defecto. Marcador: `{count}`.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `apply`, `cancel` | Botones Aplicar y Cancelar | Sí |
| `close` | Nombre del botón de cierre («Cerrar sin aplicar») | Sí |
| `tabs` | Nombre de la lista de pestañas | Sí, con dos o más pestañas |
| `reset` | Botón Restablecer | Sí, con `resettable` |
| `discardTitle`, `keepEditing`, `discard` | Confirmación de descarte | Sí, si usas `dirty` |
| `errorSummary` | Título del resumen («Corrige {count} campos») | Sí, con `errors` |
| `errorCount` | Marca de la pestaña («{count} errores») | Sí, con `errors` y pestañas |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Pestaña activa, panel, campos y pie; no sale de la hoja |
| ← → / Inicio / Fin (en una pestaña) | Cambian de pestaña (cíclico) |
| Enter (en un campo) | Aplica |
| Esc | Cierra o pide confirmación |

## Accesibilidad

- Hoja modal de `GDialog`. **Pestañas según APG:** `tablist` con nombre, `tab` con `aria-selected` y `aria-controls`, `tabpanel` con `aria-labelledby`; solo la pestaña activa está en la secuencia de Tab.
- **Los errores no se ocultan en una pestaña inactiva:** el resumen los lista todos como enlaces y cada pestaña muestra su cantidad **en texto** (no solo color).
- Los botones del pie son ≥ 36px (44px con puntero táctil); foco siempre visible.

## Tema

Solo lee `var(--g-*)`; **sin tokens nuevos**. El resumen usa los tokens de peligro (`--g-color-danger`, `-soft`, `on-danger-soft`).

## Límites

- Sin guardado automático ni deshacer; un solo nivel de pestañas (no es un asistente).
- **El formulario vive en el cuerpo** y Aplicar se asocia con `form=`: el pie de `GDialog` queda fuera del formulario.
- El foco al cerrar exige que el elemento que abrió la hoja siga en el DOM (Safari no enfoca los botones al hacer clic: probarlo).
- Sin verificar: lector de pantalla real (pestañas, resumen y anuncios), Firefox y Safari, `forced-colors` y `pointer: coarse` reales, teclado virtual en móvil.

## Fuentes

- API: [`GWidgetConfig.meta.json`](./GWidgetConfig.meta.json) · Contrato: [`design/contracts/widget-config.md`](../../../../../design/contracts/widget-config.md) · Prototipo: [`design/lab/widget/r02/`](../../../../../design/lab/widget/r02/) · Auditoría: [`design/lab/widget/auditoria-2.md`](../../../../../design/lab/widget/auditoria-2.md)
