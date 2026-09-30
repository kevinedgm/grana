# Contrato · GWidgetConfig

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/widget/r02/` (kiwi) · **Complementa:** `design/contracts/widget.md`, `design/contracts/dialog.md`
**Tag:** `g-widget-config` · **Categoría:** superposiciones

**Carcasa del panel de configuración de un widget**: una hoja lateral modal con vista previa en vivo, pestañas, resumen de errores, «Restablecer», «Cancelar» y «Aplicar», y confirmación al descartar cambios. Alcance decidido por el usuario (DECISIONS.md #76): **el contenido lo pone la aplicación** (Datos, Estilo, Ajustes…) y Grana no conoce las opciones de cada widget; se abre desde la acción «Configurar» del menú del widget.

## Principios

- **Se construye sobre `GDialog`** (`placement="end"`), como `GWidgetGallery`.
- **Es una carcasa, no un formulario:** los campos de cada pestaña son de la aplicación (`GInput`, `GSelect`, `GSwitch`…), con **borrador propio**: nada se aplica hasta pulsar Aplicar.
- **Presenta y emite intención.** No valida ni guarda: emite `apply`; **la aplicación valida**, y si hay errores los devuelve en `errors`; si no, cierra (`modelValue = false`).
- **Sin un diálogo dentro de otro:** la confirmación de descarte vive en el pie.
- **Sin textos por defecto:** todo en `labels`.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | Boolean | abierto | `false` | compartida |
| `title` | String | nombre accesible de la hoja («Configurar Ingresos») | sin valor | propia |
| `description` | String | texto libre | sin valor | propia |
| `tabs` | Array | `[{ id, label }]` | `[]` | propia |
| `tab` | String | `id` de la pestaña activa (con `update:tab`) | la primera | propia |
| `errors` | Array | `[{ tab, field?, message }]` | `[]` | propia |
| `dirty` | Boolean | hay cambios sin aplicar | `false` | propia |
| `resettable` | Boolean | muestra «Restablecer» | `false` | propia |
| `applying` | Boolean | se está aplicando | `false` | compartida (`loading` precisada, ver abajo) |
| `size` | String | `sm` `md` `lg` | `sm` | compartida (subconjunto) |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `labels` | Object | ver «Textos (`labels`)» | `{}` | propia |
| `id` | String | | generado | propia |

### Reglas de props

- **`modelValue`:** abre y cierra. El componente no lo cambia por su cuenta: si el usuario cierra (Cancelar, ✕, Esc) y **no hay `dirty`**, emite `update:modelValue` con `false` y `cancel`; con `dirty`, primero la confirmación del pie.
- **`title`:** **obligatorio** (aviso en desarrollo). La aplicación lo compone («Configurar {widget}»).
- **`tabs`:** las pestañas en orden. Con **una o ninguna**, **no se renderiza la tablist** y el contenido se muestra sin pestañas (el slot de la única, o el `default`). Cada `id` debe tener un slot `tab-<id>`.
- **`tab`:** pestaña activa; `update:tab` al cambiar. Sin valor, la primera. Al abrir, **siempre la primera** (se reinicia a la pestaña inicial, o a la que trae un error).
- **`errors`:** la **aplicación** lo rellena tras `apply` (o al validar en vivo). Cada error: `tab` (id de pestaña), `field` (el `id` del elemento del campo, para enfocarlo) y `message`. Con errores: aparece el **resumen** (`role="alert"`, `tabindex="-1"`), recibe el foco **una vez por cada `apply`** que termina con errores, cada pestaña con errores muestra su **cantidad en texto** (`labels.errorCount`, `{count}`) y cada mensaje es un **enlace** que activa la pestaña y **enfoca el campo** (`field`); sin `field`, solo activa la pestaña. Al vaciar `errors`, el resumen desaparece.
- **`dirty`:** la aplicación sabe si el borrador difiere del widget; con `true`, Cancelar, ✕ y Esc piden confirmación.
- **`resettable`:** muestra «Restablecer» (`labels.reset`); emite `reset` (la aplicación devuelve el borrador a los valores con que se abrió). Sin `labels.reset`, no se renderiza y avisa.
- **`applying`:** `aria-busy="true"` en la hoja y «Aplicar» en `aria-disabled="true"` (sigue enfocable) mientras la aplicación guarda. No cambia el tamaño.
- **Resto de atributos:** `class`, `style` y `data-*` van al `<dialog>`.

## Comportamiento

1. **Al abrir**, el foco va a la **primera pestaña** (o al primer control si no hay pestañas); al cerrar, nativo de `GDialog` (vuelve al elemento que abrió la hoja, normalmente el botón de menú del widget; **la aplicación debe conservar ese elemento**: si se vuelve a pintar el widget con otro nodo, el foco se pierde).
2. **Vista previa:** slot `preview` **arriba**, `aria-hidden="true"` e `inert`; la aplicación pinta un widget real con los valores del **borrador**. Sin el slot, no hay vista previa.
3. **Pestañas (patrón APG):** `tablist` con nombre (`labels.tabs`), `tab` con `aria-selected` y `aria-controls`, `tabpanel` con `aria-labelledby` y `tabindex="0"`. **← →** mueven (cíclico), **Inicio/Fin**; solo la pestaña activa está en la secuencia de Tab; las demás pestañas se ocultan (`hidden`), pero **su contenido permanece montado** (el borrador y los errores no se pierden al cambiar de pestaña).
4. **Aplicar:** botón de envío del pie (`type="submit"` asociado al formulario de la hoja). Enter dentro de un campo aplica. Emite `apply`; **no cierra**: lo hace la aplicación si no hay errores.
5. **Cancelar, ✕ y Esc:** sin `dirty`, cierran directamente (`cancel` y `update:modelValue`); con `dirty`, el **pie cambia** a `labels.discardTitle`, «Seguir editando» (`labels.keepEditing`) y «Descartar» (`labels.discard`), con el foco en «Seguir editando» (`role="alert"`); «Descartar» cierra (`cancel` y `update:modelValue`); «Seguir editando» devuelve el foco a «Cancelar».
6. **Anuncios:** la región de estado está **dentro de la hoja**; el componente expone `announce(texto)` y anuncia `labels.errorSummary` al aparecer el resumen. «X configurado» tras aplicar lo anuncia la aplicación en su región (la hoja ya está cerrada).
7. **Sin cerrar con errores:** mientras `errors` no esté vacío, el componente no cierra por su cuenta.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | Boolean | El usuario cierra (Cancelar, ✕ o Esc sin cambios; «Descartar»), siempre `false` |
| `update:tab` | `id` | Cambia la pestaña activa |
| `apply` | | El usuario pulsa Aplicar (o Enter en un campo) |
| `reset` | | El usuario pulsa Restablecer |
| `cancel` | | El usuario cierra sin aplicar (sin cambios, o tras «Descartar») |
| `open`, `closed` | | Como en `GDialog` |

Método expuesto: `announce(texto)`.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `tab-<id>` | Contenido de la pestaña `<id>` | `{ errors }` (los de esa pestaña) | Dentro de `g-widget-config__panel` (`role="tabpanel"`) |
| `default` | Contenido sin pestañas (con una o ninguna) | `{ errors }` | Dentro del cuerpo |
| `preview` | Vista previa en vivo | | Dentro de `g-widget-config__preview` (`aria-hidden`, `inert` los pone el componente) |
| `footer-start` | Acciones extra a la izquierda del pie | | Después de «Restablecer» |

## Textos (`labels`)

Ninguno tiene valor por defecto. Marcador: `{count}`.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `tabs` | Nombre de la tablist («Secciones de la configuración») | Sí, con dos o más pestañas |
| `apply`, `cancel` | Botones Aplicar y Cancelar | Sí |
| `close` | Nombre de la ✕ («Cerrar sin aplicar») | Sí |
| `reset` | Botón Restablecer | Sí, con `resettable` |
| `discardTitle`, `keepEditing`, `discard` | Confirmación de descarte | Sí, con uso de `dirty` |
| `errorSummary` | Título del resumen («Corrige {count} campos») | Sí, con `errors` |
| `errorCount` | Marca de la pestaña («{count} errores») | Sí, con `errors` y pestañas |

## Estructura accesible

```html
<dialog class="g-dialog g-dialog--placement-end g-widget-config" aria-busy="true" …>
  <div class="g-dialog__header">… <h2>Configurar Ingresos</h2> …</div>
  <div class="g-dialog__inset">
    <div class="g-dialog__body">
      <form class="g-widget-config__form" id="ID-form" novalidate>
        <div class="g-widget-config__sr" role="status" aria-live="polite"></div>
        <div class="g-widget-config__preview" aria-hidden="true" inert>…slot preview…</div>
        <div class="g-widget-config__summary" role="alert" tabindex="-1">
          <b>Corrige 2 campos</b><ul><li><a href="#campo-meta">La meta debe ser un número mayor que 0.</a></li></ul></div>
        <div class="g-widget-config__tabs" role="tablist" aria-label="Secciones de la configuración">
          <button role="tab" type="button" id="ID-t-data" aria-controls="ID-p-data" aria-selected="true">Datos</button>
          <button role="tab" type="button" id="ID-t-set" aria-controls="ID-p-set" aria-selected="false" tabindex="-1">Ajustes <span class="g-widget-config__mark">1 errores</span></button></div>
        <div class="g-widget-config__panel" role="tabpanel" id="ID-p-data" aria-labelledby="ID-t-data" tabindex="0">…slot tab-data…</div>
        <div class="g-widget-config__panel" role="tabpanel" id="ID-p-set" aria-labelledby="ID-t-set" tabindex="0" hidden>…</div>
      </form>
    </div>
    <div class="g-dialog__footer">
      <button type="button">Restablecer</button>
      <span class="g-widget-config__confirm" role="alert"><span>¿Descartar los cambios?</span> <button type="button">Seguir editando</button> <button type="button">Descartar</button></span>
      <button type="button">Cancelar</button> <button type="submit" form="ID-form" aria-disabled="true">Aplicar</button>
    </div>
  </div>
</dialog>
```

- **El formulario** vive **dentro del cuerpo** (envuelve la región de estado, la vista previa, el resumen, las pestañas y los paneles; `display: contents`), sin validación nativa (`novalidate`); el botón **Aplicar** del pie se asocia con `form="ID-form"` (el pie de `GDialog` queda fuera del formulario, como en el contrato de `GDialog`). La validación es de la aplicación.
- **El error de cada campo** lo marca la aplicación en su propio campo (`aria-invalid`, texto con el símbolo ▲ y `aria-describedby`); **la carcasa pone el resumen y las marcas de pestaña**.
- **Objetivos ≥ 24px, 44px con `pointer: coarse`;** foco siempre visible.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Pestaña activa, panel, campos, pie; no sale de la hoja |
| ← → / Inicio / Fin (en una pestaña) | Cambian de pestaña (cíclico) |
| Enter (en un campo) | Aplica |
| Esc | Cierra o pide confirmación |

## Tokens consumidos

Los de `GDialog` y los controles (como `GWidgetGallery`); **sin tokens nuevos**.

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-widget-config` (+ `--density-*`, `is-applying`) | Raíz (`<dialog>`, junto a `g-dialog`) | Siempre |
| `g-widget-config__form`, `__preview`, `__summary`, `__tabs`, `__panel`, `__mark`, `__sr` | Partes | Según el estado |
| `g-widget-config__confirm` | Confirmación de descarte en el pie | Con `dirty` y cierre pedido |
| `g-widget-config__btn` (+ `--primary`, `--reset`) | Botones propios (Restablecer, Cancelar, Aplicar, Seguir editando, Descartar) | Siempre |

## Resolución de hallazgos de r02

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 4 | API de `GWidgetConfig` | Props `tabs`, `tab`, `errors`, `dirty`, `resettable`, `applying`, `labels`; slots `tab-<id>`, `preview`; eventos `apply`, `reset`, `cancel` | DECISIONS.md #76 |
| 5 | Validación | La valida la aplicación; `errors` con `tab`, `field` y `message`; la carcasa pinta el resumen, marca pestañas y enfoca | DECISIONS.md #76 |
| 6 | Vista previa | Slot; `aria-hidden` e `inert` | DECISIONS.md #76 |
| 8 | Dónde se anuncia | Región dentro de la hoja | DECISIONS.md #76 |

## Límites conocidos

- **Sin guardado automático ni deshacer:** se aplica o se descarta.
- **Un solo nivel de pestañas**, sin pasos secuenciales (no es un asistente).
- **El contenido de las pestañas no se desmonta** al cambiar: las pestañas muy pesadas son responsabilidad de la aplicación.
- **El foco al cerrar** exige que el elemento que abrió la hoja siga en el DOM.
- **Lector de pantalla:** pestañas, resumen de errores y anuncios por verificar con lectores reales; Firefox y Safari, por verificar.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (vista previa, resumen de errores, marca de pestaña, confirmación): los decide coco.
