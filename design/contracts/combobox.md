# Contrato · GCombobox

**Dueño:** lima · **Estado:** aprobado (forma A + B + C, C sumado a las dos y `multiple` en Fase 2: decisiones del usuario del 2026-10-04; el resto deriva de APG *Combobox with list autocomplete*, WCAG 2.2 y los contratos vigentes; **ninguna pregunta de producto abierta**) · **Basado en:** `design/lab/combobox/r01/` (kiwi; base funcional: frontera del `brief.md`, 27 decisiones, L1 a L15, `combo.js`, `verificar.mjs` 315/315) y `design/lab/combobox/r02/` (kiwi, commit `6187a1d`; conceptos A, B, C y la mezcla `?c=AC`, L16 a L25, 1407/1407 en los tres motores) · **Decisiones:** DECISIONS.md **#329 a #338** · **Convive con:** `input.md` (la caja; slots internos `field` y `end`, #309), `form.md` (contexto, `useFormField`, `GFormRow`; Fase 5), `select.md` (frontera), `dialog.md` (la superficie), `avatar.md`, `icons.md` (`search`, nuevo), `tokens.md` §32 · **Enmendado por #356** (2026-10-04, decisión del usuario): opción, ficha del valor y vista previa se pintan con **`GSummary`** (`summary.md`); ver «Fichas con `GSummary`»
**Tag:** `g-combobox` · **Categoría:** entradas · **Entrada del paquete:** `@grana/vue/combobox` (#337)
**Componente complejo** (CLAUDE.md, «Modelos por rol»: teclado compuesto, se posiciona sobre otros elementos, motor de datos, compone `GInput`, `GAvatar` y `GDialog`): **coco en Opus, bruno en Fable**.

Un campo para **elegir una opción de un catálogo grande escribiendo**: paciente entre miles, diagnóstico CIE-10, medicamento, cliente, colonia. Los resultados los entrega la aplicación (Grana no pide datos); el modelo es el `value` de la opción y, si se permite, un texto libre aparte.

---

## Principios

- **APG *Combobox with list autocomplete*.** `<input type="text" role="combobox">` y un `listbox`; el foco real **nunca** sale del campo mientras la lista está abierta (`aria-activedescendant`); las opciones no tienen manejadores de teclado ni `tabindex`.
- **No duplica `GInput`: lo compone** (#330, como `GNumberField`, #309). Etiqueta, caja, pie, mensaje, marcas, contexto de `GForm`, `is-ready` e `is-rejected` son los de `GInput`.
- **Sin `fetch`** (#332). Emite `search`, `more` y `create`; la aplicación entrega `options`, `loading`, `total`, `loadError` y `selectedOption`.
- **Seguridad antes que velocidad** (#333): Tab no elige (con una sola excepción acotada), Intro no elige un resultado obsoleto, la lista no parpadea a vacío, y el texto libre es un valor distinto y se nota.
- **Sin textos propios** (#226): todos en `labels`, sin valores por defecto.
- **Grana no valida** (#157): `error` lo pone la aplicación; `loadError` no es un error del valor.

## Qué lo hace distinto (identidad, #329; decisiones del usuario)

| | Concepto | Qué hace | Por qué sirve |
| --- | --- | --- | --- |
| **A** | **El campo se abre** (`appearance="field"`, por defecto) | No hay panel flotante aparte: abierto, contorno, anillo de foco y sombra abrazan campo y lista como **una sola forma**. La primera coincidencia por prefijo se completa en el propio campo como texto fantasma | En un formulario denso nadie tiene que relacionar un menú con su campo; «diab» + Tab es un diagnóstico entero sin mirar la lista |
| **B** | **Paleta con vista previa** (`appearance="palette"`, elegible por campo) | El campo se eleva a una superficie modal con su propio campo, los resultados y la **ficha de la opción activa**. Es la misma estructura de la hoja móvil | Entre cuatro «María García López» hay que ver a la persona antes de elegirla: la ficha convierte la elección en una comprobación |
| **C** | **El valor es un objeto** (siempre, en A y en B) | En reposo el campo enseña avatar + nombre + línea secundaria, o código + descripción, o la marca de texto libre; los resultados son fichas y la elegida viaja al campo, sin cambiar su alto | El formulario en reposo dice a quién y qué, verificable de un vistazo, en una captura o impreso; y distingue catálogo de texto tecleado |

Las tres reglas de seguridad de la base (Tab, Intro, lista que no parpadea) son parte de la identidad: no se reabren sin motivo nuevo.

## Cuándo usarlo (frontera)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Hasta 7 opciones visibles | `GRadioGroup` | `GCombobox` |
| Lista conocida de hasta unas decenas | `GSelect` (sin escritura; su fila «Agregar nuevo…» **pide**, #57) | `GCombobox` |
| Cientos o miles, resultados del servidor, o texto libre permitido | **`GCombobox`** | `GSelect` |
| Resultados parecidos que hay que distinguir antes de elegir (homónimos) | `GCombobox appearance="palette"` | `appearance="field"` con Tab |
| Sugerencias de **texto** sin valor asociado ni estados | `GInput` + `<datalist>` nativo (`list` por `$attrs`) | `GCombobox` |
| Ejecutar una acción | `GMenu` | `GCombobox` |
| Filtrar una colección | `GFilterBar` (podrá componer `GCombobox` como editor de valor: reservado, #338) | — |
| Varias opciones | **Fase 2**: `multiple` del mismo componente (reservado, #338). Etiquetas sin catálogo: `GTagInput` (reservado) | Varios `GCombobox` |

---

## Entrega y empaquetado (#337)

```js
import Combobox, { GCombobox } from '@grana/vue/combobox'
app.use(Combobox)            // registra <g-combobox>; o: components: { GCombobox }
```

- **Entrada propia `@grana/vue/combobox`** (`dist/combobox.js` y `dist/combobox.umd.js`, global UMD **`GranaCombobox`**, requiere `Vue` y `Grana`). `@grana/vue` **no** lo exporta ni lo registra en su `install`. Exporta `GCombobox` y, por defecto, un plugin (`install(app)` registra `GCombobox`). Sin gestor: no es un servicio.
- **Por qué ya** (para que bruno no se detenga a mitad): dos presentaciones, motor de datos, ficha y fantasma; el precedente más cercano (`GStatusIsland`, 29 K de fuente) pesó 16,3 KB gzip y el tope para entrar en el principal es 8 KB (#328). La estimación (35 a 45 K de fuente) lo supera con margen. Bruno **mide y anota** el peso en `GCombobox.meta.json`; el resultado no cambia la decisión.
- Lo compartido con el principal (`GInput`, `GAvatar`, `GDialog`, `GIcon` público y `GLibIcon`, `utils/anchor.js`, `utils/liveRegion.js`, `utils/template.js`, `utils/oneOf.js`; **desde #356, también `GSummary` y la utilidad de coincidencias** `fold`/`tokens`/`parts`, que suben de `engine.js` al principal) llega por **`__shared`** (#240) **sin duplicarse**: bruno añade a `src/shared.js` lo que falte (`GInput`, `GAvatar`, `GIcon`) y lo comprueba como en `status.test.js`.
- **El CSS sigue en `grana.css`** (una sola hoja; inerte sin su marcado).
- **Compuertas:** `grep -q "g-combobox__ghost" packages/vue/dist/grana.css`, `! grep -q "GCombobox" packages/vue/dist/grana.js`, `test -f packages/vue/dist/combobox.js`.

---

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | String \| Number \| null | el `value` de la opción elegida | `null` | compartida |
| `custom` | String | el texto libre (`v-model:custom`) | `''` | propia (#331) |
| `options` | Array | ver «Opciones» | `[]` | propia (como `GSelect`) |
| `selectedOption` | Object \| null | la opción de `modelValue` cuando no está en `options` | `null` | propia |
| `appearance` | String | `field` `palette` | `field` | propia (nombre de `GTable`, `GTabs` y `GRadioGroup`) |
| `filter` | Boolean \| Function | `true` · `false` · `(option, query) => Boolean` | `true` | propia (#332) |
| `loading` | Boolean | | `false` | compartida (control de entrada: no bloquea) |
| `total` | Number \| null | entero ≥ 0 | `null` | propia |
| `loadError` | String | texto libre | sin valor | propia |
| `minChars` | Number | entero ≥ 0 | `0` | propia |
| `delay` | Number | ms ≥ 0 | `250` | propia |
| `limit` | Number | entero ≥ 1 | `50` | propia |
| `allowCustom` | Boolean | | `false` | propia (#331) |
| `customName` | String | | sin valor | propia (#331) |
| `creatable` | Boolean | | `false` | propia (#57 con el texto) |
| `clearable` | Boolean | | `false` | propia (como `GSelect`) |
| `labels` | Object | ver «Textos» | `{}` | compartida (nombre) |
| `name` | String | | sin valor | propia |
| `label` | String | texto libre | sin valor | propia |
| `hint` | String | texto libre | sin valor | propia |
| `error` | String | texto libre | sin valor | propia (form.md C4) |
| `warning` | String | texto libre | sin valor | propia (form.md C5) |
| `valid` | String | texto libre | sin valor | propia (form.md C5) |
| `required` | Boolean | | `false` | propia |
| `mark` | Boolean | | `undefined` | propia (form.md §2) |
| `readonly` | Boolean | | `undefined` → `false` | compartida |
| `disabled` | Boolean | | `undefined` → `false` | compartida |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `variant` | String | `outline` `soft` | `outline` | compartida (subconjunto, como `GInput`) |
| `density` | String | `default` `comfortable` `compact` | `undefined` → contexto o `default` | compartida |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | sin valor (`--g-color-focus`) | compartida (solo el foco) |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor (`sm`) | compartida |
| `block` | Boolean | | `undefined` → `false` (dentro del layout, `true`) | compartida |
| `id` | String | | generado | propia |

**No existen** (#330, #338): `remote` (es `filter: false`), `multiple`, `selectedOptions` (reservados para la Fase 2; `multiple` se ignora con aviso), `expandable` (reservado: ampliar a la paleta desde `field`), `autoHighlight` (la primera opción activa es fija; nombre reservado), `createLabel` y `clearLabel` (van en `labels`), `emptyText`, `placeholder` como prop (es atributo, como en `GInput`), `prefix`, `suffix`, `output`, `type`, `surface` (colisiona con `GSurface` y `--g-surface-*`), `mode`.

### Opciones

`options` es un arreglo de **opciones** y de **grupos** (sin anidar), como en `GSelect`:

```js
[
  { value: 'p001000', label: 'María García López', avatar: true, description: 'Exp. 001000 · 22 años',
    facts: [{ label: 'Exp.', value: '001000' }, { label: 'Edad', value: '22 años' }, { label: 'Última visita', value: '03/02/2026' }] },
  { label: 'Sistema circulatorio (I00–I99)', options: [{ value: 'I10', code: 'I10', label: 'Hipertensión esencial (primaria)' }] }
]
```

| Campo | Tipo | Qué | Dónde se ve |
| --- | --- | --- | --- |
| `value` | String \| Number | Identidad; **único** en la lista | Modelo y campo oculto |
| `label` | String (obligatorio) | Texto del campo, nombre de la opción, lo que se busca | Fila, campo, ficha, vista previa |
| `description` | String | **Línea secundaria**: lo que distingue («Exp. 001000 · 22 años») | Fila (si no hay `facts`), ficha en reposo, `aria-describedby`, vista previa |
| `code` | String | Código en su caja («E11.9») | Antes de la etiqueta en fila, ficha y vista previa; se busca |
| `facts` | Array de `{ label, value }` (Strings); **opcionales desde #356:** `priority` (Number, menor = más importante), `short` (rótulo abreviado visible) y `bare` (Boolean: el valor se explica solo y su rótulo puede callarse a la vista), los de `summary.md` «Datos» | Datos que distinguen, con rótulo. **El de mayor prioridad (o el primero) es el identificador: lo último en ceder** | Fila (en lugar de `description`), ficha del valor y vista previa (rejilla de pares) |
| `avatar` | Boolean \| Object | `true` = `GAvatar` con `name = label`; objeto = props de `GAvatar` (`src`, `name`, `initials`, `icon`, `color`, `categories`, `colorKey`, `shape`; `size` y `label` se ignoran) | Hueco inicial de fila, ficha y vista previa (decorativo) |
| `icon` | String | Nombre de Lucide («dato → nombre», #202): `GIcon` público | Hueco inicial si no hay `avatar` |
| `disabled` | Boolean | No elegible; sigue visible | `aria-disabled="true"` |

- **Grupo:** `{ label, options }`; `label` es su nombre accesible (`role="group"`).
- Una opción sin `value` o sin `label` se ignora y avisa; un `value` repetido avisa.
- **Línea secundaria** (ficha en reposo y descripción accesible) = `description`; sin ella, los `facts` unidos como «rótulo valor · rótulo valor»; sin ninguno, nada.
- Campos de más en la opción se conservan y llegan a los slots (`option`, `value`, `preview`, `lead`).

### Reglas de props

- **`modelValue`:** el `value` de la opción elegida, comparado con `===`. `null` o `undefined` = sin opción. El componente recuerda toda opción que haya pintado y elegido; para un valor inicial que no está en `options` (búsqueda remota), la aplicación pasa **`selectedOption`** (con `value === modelValue`; si no coincide, se ignora). Un valor sin opción conocida deja el campo vacío y avisa, **pero se envía igual**.
- **`custom`** (#331): el texto libre cuando el valor **no** es una opción. Exactamente uno de los dos tiene valor: elegir una opción emite `update:custom` con `''`; confirmar un texto libre emite `update:modelValue` con `null` y `update:custom` con el texto. Solo actúa con **`allowCustom`** (sin ella, un `custom` no vacío se ignora con aviso). Con los dos a la vez gana `modelValue` y se avisa. El componente no guarda copia: pinta las props.
- **`appearance`** (#330): `field` = A (la lista es el interior del campo abierto). `palette` = B (superficie modal con vista previa). **Con el visor ≤ 520px siempre se usa la superficie** (hoja, sin vista previa), con cualquier valor. Cambiarla con la lista abierta la cierra.
- **`filter`** (#332): `true`, el componente filtra `options` con su regla (todas las palabras del texto, sin acentos ni mayúsculas, sobre `label`, `code`, `description` y los valores de `facts`); una **función** sustituye la regla (`query` llega recortado); **`false`: la aplicación filtra** y el componente pinta lo que llega (resultados del servidor). Con `false` cambian cuatro cosas, y solo con `false`: abrir emite `search('')`, «Mostrar más» emite `more`, `total` cuenta, y existe la búsqueda **pendiente** («Datos»).
- **`loading`:** indicador de `GInput` (y `aria-busy` en el `listbox`); **no vacía la lista** ni bloquea.
- **`total`:** con `filter: false`, cuántos resultados hay en el servidor para el texto actual; si es mayor que las opciones entregadas, aparece «Mostrar más». `null` = desconocido (no hay fila). Con filtro local se ignora (lo cuenta el componente) y avisa.
- **`loadError`:** con texto, el panel lo muestra con la fila «Reintentar» y lo anuncia; **no** marca el campo inválido.
- **`minChars`:** con 1 a `minChars − 1` caracteres no se emite `search` ni se pinta lista: se muestra `labels.minChars`. El texto vacío no cuenta (abrir enseña lo que la aplicación entregue, p. ej. «Recientes»).
- **`delay`:** antirrebote de `search` al escribir (ms); `0` lo desactiva. Abrir y «Reintentar» emiten sin esperar.
- **`limit`:** filas de opción pintadas con filtro local, y cuántas añade «Mostrar más». Con `filter: false` se pinta todo lo entregado (la página la decide la aplicación; se recomienda ≤ `limit`).
- **`allowCustom`:** el texto que no es una opción puede ser el valor (`custom`). Añade la fila «Usar «texto» como texto libre» y conserva el texto al salir.
- **`customName`:** `name` de un segundo campo oculto con el texto libre, para formularios nativos. Sin él, el texto libre **no** viaja en `FormData` (aviso si hay `name` y `allowCustom`).
- **`creatable`:** fila «Agregar «texto»…» (solo con `labels.create`; sin él no se pinta y avisa). No cambia el valor: emite `create`.
- **`clearable`:** botón de limpiar con valor (opción o texto libre); solo con `labels.clear`. Ausente en solo lectura y deshabilitado.
- **`name`:** va al `<input type="hidden">` del `value` y registra el campo en `GForm` (clave de `errors`); **el `<input>` visible no lleva `name`**.
- **`required`:** marca según la convención de `GForm` y **`aria-required="true"`** en el `<input>` visible; **nunca `required` nativo** (#334).
- **`readonly`:** `readonly` nativo y `aria-readonly="true"`; enfocable, legible, **no abre**, sin limpiar ni flecha, **se envía** (#266, C7). **`disabled`:** nativo en el visible y en los ocultos (no se envía).
- **`size`, `variant`, `density`, `color`, `rounded`, `block`, `label`, `hint`, `error`, `warning`, `valid`, `mark`, `id`:** pasan tal cual a `GInput`.
- **Atributos** (`placeholder`, `form`, `aria-*`, `data-*`, escuchas): al `<input>` visible, como en `GInput` (`class` y `style`, a la raíz). `form` se copia a los ocultos. `autocomplete="off"`, `autocapitalize="none"` y `spellcheck="false"` van **antes** de `$attrs`; `type`, `role` y los `aria-*` del patrón van **después** y ganan.

---

## Modelo, envío y texto libre (#331)

| Estado | `modelValue` | `custom` | Campo | Oculto `name` | Oculto `customName` |
| --- | --- | --- | --- | --- | --- |
| Sin valor | `null` | `''` | vacío | `''` | `''` |
| Opción elegida | su `value` | `''` | ficha de la opción | `String(value)` | `''` |
| Texto libre (`allowCustom`) | `null` | el texto | ficha «texto libre», `is-custom` | `''` | el texto |

- Tipos estables: `modelValue` es siempre un `value` de opción o `null`; `custom` es siempre String. Un texto libre que coincide con un `value` no se confunde con él.
- **Al salir del campo** (blur o Tab, `appearance="field"` por encima de 520px): texto **vacío** borra (`null` y `''`); texto que no es el de la opción elegida **se descarta** y vuelve el de la opción; con `allowCustom`, el texto **es** el valor (`custom`), aunque coincida con la etiqueta de una opción (nadie elige una opción por pasar de largo). En la superficie (paleta y hoja) no hay confirmación al salir: el texto libre solo entra por su fila.
- Elegir la opción ya elegida cierra sin emitir.

## Datos: sin `fetch` (#332)

- **`search(texto)`** se emite con el texto recortado: al escribir (tras `delay`), al abrir con `filter: false` (texto actual, `''` si no se ha escrito) y con «Reintentar». Con filtro local también se emite al escribir (informativo; el filtrado es inmediato).
- **Pendiente** (solo `filter: false`): hay una búsqueda sin asentar mientras corre el antirrebote, mientras `loading` es `true`, y **desde que se emite `search` o `more` hasta que la aplicación responde** (cambia `loading` a `true`, o cambian `options`, `total` o `loadError`). **Regla para la aplicación:** al recibir `search` o `more`, pone `loading` a `true` **en el mismo manejador** y a `false` al terminar, aunque responda de caché. Si tras emitir no hay respuesta en el siguiente ciclo, aviso de desarrollo; el campo se queda del lado seguro (Intro no elige la opción resaltada sola).
- **Respuestas fuera de orden:** descartarlas es de la aplicación (número de secuencia o `AbortController`); el README trae la receta. El componente no puede saber a qué texto corresponde una respuesta.
- **Asentar:** cuando una búsqueda deja de estar pendiente (o, con filtro local, en cada cambio del texto): la primera opción habilitada queda **activa sola** si hay texto escrito (una vez por búsqueda asentada, no por tecla); se programa el anuncio.
- **Cargando no vacía la lista:** las opciones anteriores siguen visibles y navegables con `aria-busy="true"`; «Buscando…» (`labels.loading`) solo aparece sin opciones previas.
- **Error de carga:** `loadError` en el panel (fuera del `listbox`), anuncio educado y fila «Reintentar» (re-emite `search` con el texto actual, sin esperar). Las opciones anteriores siguen. Ni la isla de estado ni el `error` del campo: no es un error del valor ni una condición de página (la aplicación puede publicarlo además en la isla, #327).
- **«Mostrar más ({shown} de {total})»:** fila de acción, sin desplazamiento infinito. Con filtro local sube el tope en `limit`; con `filter: false` emite `more`. La lista sigue abierta y, al llegar las nuevas, la activa pasa a **la primera opción nueva**.
- **Rendimiento:** tope de pintado, sin virtualizar (`aria-activedescendant` necesita que la opción exista). Medido por kiwi: abrir con 500 opciones locales < 150 ms.
- **Antes de escribir** se pinta lo que haya en `options`; sin filas ni estado, **no hay panel** (y `aria-expanded` sigue en `false`).

---

## Estructura accesible

### El campo (las dos presentaciones)

```html
<div class="g-input g-input--… g-combobox g-combobox--appearance-field [is-open] [is-up] [is-token] [is-custom] [is-surface]">
  <label class="g-input__label" id="ID-label" for="ID">Paciente</label>
  <div class="g-input__row">
    <div class="g-input__control">
      <span class="g-input__prepend" aria-hidden="true">…</span>                              <!-- slot prepend; oculto mientras hay ficha -->
      <span class="g-combobox__value">                                                        <!-- slot interno field de GInput: celda -->
        <input class="g-input__field g-combobox__field" id="ID" type="text" role="combobox"
               aria-autocomplete="list" aria-haspopup="listbox" aria-expanded="true" aria-controls="ID-list"
               aria-activedescendant="ID-opt-0" aria-required="true" aria-describedby="ID-about ID-hint ID-message"
               autocomplete="off" autocapitalize="none" spellcheck="false">
        <span class="g-combobox__ghost" aria-hidden="true">                                   <!-- solo A, con texto fantasma -->
          <span class="g-combobox__ghost-typed">mar</span><span class="g-combobox__ghost-rest">ía García López</span>
        </span>
        <span class="g-combobox__token [is-arriving]" aria-hidden="true">                     <!-- C: con valor y sin editar -->
          <span class="g-summary g-summary--layout-inline g-summary--size-xs">…</span>          <!-- #356: GSummary inline (summary.md) -->
        </span>
        <span class="g-combobox__about" id="ID-about">Exp. 001000 · 22 años</span>            <!-- texto oculto accesible -->
        <input type="hidden" name="paciente" value="p001000">                                 <!-- solo con name -->
        <input type="hidden" name="paciente_libre" value="">                                  <!-- solo con customName -->
      </span>
      <button type="button" class="g-combobox__clear" id="ID-clear" aria-labelledby="ID-clear-text ID-label">  <!-- slot interno end -->
        <span class="g-combobox__clear-text" id="ID-clear-text">Limpiar</span>[GIcon x]
      </button>
      <span class="g-combobox__arrow" aria-hidden="true">[GIcon chevron-down | chevrons-up-down]</span>
    </div>
  </div>
  <div class="g-input__support"> ayuda · región g-input__message (siempre presente) </div>
  <div class="g-combobox__live" id="ID-live" role="status" aria-live="polite" aria-atomic="true"></div>   <!-- fuera de flujo; existe desde el montaje -->
  <div class="g-combobox__popup [is-empty]" id="ID-popup" popover="manual">…panel…</div>      <!-- field; fuera de flujo -->
  <!-- o, en palette y en móvil: -->
  <dialog class="g-dialog g-combobox-surface g-combobox-surface--palette|--sheet" id="ID-surface">…</dialog>
</div>
```

- **Tres hijos en flujo** (etiqueta · caja · pie), los de `GInput`: comparte línea en una `GFormRow`. Región viva, panel y superficie quedan fuera de flujo.
- **Composición** (#330): slot interno **`field`** de `GInput` (la celda `g-combobox__value` con el `<input>`, las dos capas, la descripción oculta y los ocultos; de `bind` se quitan `name` y `required`) y slot interno **`end`** (limpiar y flecha). Las capas se colocan sobre la celda (`inset: 0`): **no hace falta medir** la posición del `<input>` dentro de la caja.
- **`aria-expanded="true"` solo con panel visible** (filas o estado); `is-open` en la raíz, igual. `aria-controls` y `aria-activedescendant` apuntan siempre a elementos que existen (`aria-activedescendant` solo con opción activa).
- **Nombre de «Limpiar»:** `aria-labelledby` = su texto oculto + `ID-label` («Limpiar Paciente»; respeta el slot `label`). Sin etiqueta visible: con `aria-labelledby` del consumidor, `"ID-clear-text {sus ids}"`; con `aria-label`, `aria-label="{labels.clear} {aria-label}"` (regla de `GNumberField`, #311). Botón aparte en el orden de Tab, ≥ 24px (44px con `pointer: coarse`); pulsarlo borra, vacía el texto y devuelve el foco al campo.
- **Flecha:** decorativa (`aria-hidden`); con puntero abre y cierra sin quitar el foco del campo. Ausente en solo lectura y deshabilitado.
- **Descripción del valor (C):** con un valor y sin texto a medio escribir, `aria-describedby` empieza por `ID-about` = la línea secundaria de la opción, o `labels.custom` si es texto libre. La ficha es visual (`aria-hidden`, sin puntero); el valor del `<input>` sigue siendo la etiqueta.
- **Región viva propia** (`g-combobox__live`): los anuncios de «Anuncios». Dentro de un `GDialog` anfitrión queda dentro del diálogo (la raíz lo está).

### El panel (común a lista y superficie)

```html
<div class="g-combobox__panel">
  <p class="g-combobox__status g-combobox__status--hint|--loading|--empty|--error" id="ID-status">[GIcon]<span>…</span></p>
  <ul class="g-combobox__list" id="ID-list" role="listbox" aria-labelledby="ID-label" aria-busy="true" [hidden]>
    <li role="presentation"><ul class="g-combobox__group" role="group" aria-labelledby="ID-grp-0">
      <li class="g-combobox__group-label" id="ID-grp-0" role="presentation">Recientes</li>
      <li class="g-combobox__option [is-active]" id="ID-opt-0" role="option" aria-selected="false" [aria-disabled="true"]>
        <span class="g-summary g-summary--layout-row g-summary--size-md">…</span>              <!-- #356: GSummary row, lines 2 (summary.md): identidad, código, título, datos, «+N» -->
        <span class="g-combobox__check" aria-hidden="true">[GIcon check]</span>               <!-- la elegida -->
      </li>
    </ul></li>
    <li class="g-combobox__option g-combobox__action g-combobox__action--more" id="ID-opt-more" role="option" aria-selected="false">…</li>
  </ul>
</div>
```

- **Estado** (fuera del `listbox`, a lo sumo uno, en este orden): error de carga (`loadError`, icono `circle-alert`) › pista de mínimo (`labels.minChars`, `search`) › nada si hay opciones › «Buscando…» (`labels.loading`, `loader-circle` que gira) › «Sin resultados para «x»» (`labels.noResults` o slot `empty`, `search`).
- **Opción:** `aria-selected="true"` **solo en la elegida** (además, más peso y `check`); la **activa** lleva `is-active`. `aria-disabled="true"` en las no elegibles. Sin `tabindex`. `pointerdown` sobre el panel **no quita el foco** del campo (`preventDefault`).
- **Coincidencia** (desde #356 la pinta `GSummary` con su prop `highlight`: la marca es `<mark class="g-summary__mark">`, misma regla)**:** `<mark>` sobre la primera aparición de cada palabra buscada (sin acentos ni mayúsculas) en `label`, `code`, `description` y los valores de `facts`; peso y subrayado, **no color** (WCAG 1.4.1). Si la forma sin acentos no mide lo mismo que el texto (ligaduras), no se marca.
- **Filas de acción** (#57): `role="option"` con `aria-selected="false"`, hijas directas del `listbox`, **fuera de los grupos y siempre al final**, en este orden: **`retry`** (solo con `loadError`; sustituye a `more`) o **`more`** · **`custom`** · **`create`**. Cuentan en la navegación. Iconos: `rotate-ccw`, `chevron-down`, `pencil`, `plus`.
  - `custom` (con `allowCustom`, texto no vacío y **ninguna opción a la vista con esa misma etiqueta**): elige el texto como `custom`, cierra.
  - `create` (con `creatable` y texto no vacío): cierra, **deja el foco en el campo antes de emitir** `create(texto)`, restaura el texto de la opción elegida y **no cambia el valor**.
- **Lista vacía de opciones** con filas de acción: el estado «Sin resultados» se muestra y debajo las filas.

### `appearance="field"` (A)

- **`g-combobox__popup`** es `popover="manual"` (capa superior; dentro de un `GDialog` funciona porque es descendiente suyo). Su caja **empieza en el borde superior del campo** y su zona alta, del alto del campo, es transparente y **no captura el puntero**: el campo real se ve y se usa a través de ella. Dentro, `g-combobox__popup-body` (la parte con fondo, que se despliega) contiene el panel.
- **Colocación** (bruno, con `placeBlock` de `utils/anchor.js`, sin separación): ancho y posición **de la caja**; hacia arriba (`is-up` en la raíz) si debajo quedan menos de 240px (o menos que el alto natural, si es menor) y arriba hay más sitio: entonces la forma termina en el borde inferior del campo. Se recalcula al redimensionar, al desplazarse cualquier ancestro y al cambiar el contenido. **Abrir no mueve nada** (Δ0 del campo, de la página y del alto del documento). La opción activa se mantiene a la vista desplazando **el panel**, nunca la página.
- **Variables en línea** (bruno → coco, excepción de `tokens.md` §29.5) sobre `g-combobox__popup`: `--_x`, `--_top`, `--_bottom` (uno de los dos, `auto` el otro), `--_w`, `--_max` (alto disponible), `--_field-h` (alto de la caja).
- **Sin panel** (ni filas ni estado): `is-empty` en el popup (coco lo oculta) y la caja conserva su contorno.
- **Texto fantasma** (#333): `g-combobox__ghost` existe solo si: `appearance="field"` por encima de 520px, lista abierta, texto escrito, **sin búsqueda pendiente**, sin composición IME, el cursor al final, la primera opción es la activa y su etiqueta **empieza por** el texto (sin acentos ni mayúsculas) y es más larga. `__ghost-typed` repite lo tecleado (invisible, ocupa su sitio) y `__ghost-rest` continúa la frase. `aria-hidden`: el lector recibe la opción por `aria-activedescendant`.
- **Sin panel separado por debajo de un ancho** (#336): la forma es siempre una; el ancho se protege en la fila (ver «En una `GFormRow`»).

### La superficie: `appearance="palette"` y móvil (B)

```html
<dialog class="g-dialog g-dialog--size-lg g-dialog--mobile-sheet g-combobox-surface g-combobox-surface--palette" id="ID-surface" aria-labelledby="ID-surface-title">
  <div class="g-dialog__header"> <h2 class="g-dialog__title" id="ID-surface-title">Paciente</h2> <button class="g-dialog__close" aria-label="Cerrar">…</button> </div>
  <div class="g-dialog__inset"><div class="g-dialog__body">
    <div class="g-combobox__search">
      <span class="g-combobox__search-icon" aria-hidden="true">[GIcon search]</span>
      <input class="g-combobox__search-field" id="ID-search" type="text" role="combobox" aria-autocomplete="list" aria-expanded="true"
             aria-controls="ID-list" aria-activedescendant="ID-opt-0" aria-labelledby="ID-surface-title"
             autocomplete="off" autocapitalize="none" spellcheck="false" enterkeyhint="search">
      <span class="g-combobox__search-loader" aria-hidden="true">[GIcon loader-circle]</span>   <!-- pendiente -->
    </div>
    <div class="g-combobox__surface-body [has-preview]">
      <div class="g-combobox__panel">…</div>
      <aside class="g-combobox__preview" id="ID-preview" aria-label="Vista previa">…</aside>     <!-- solo palette, no en móvil -->
    </div>
    <div class="g-combobox__live" role="status" aria-live="polite" aria-atomic="true"></div>
  </div></div>
</dialog>
```

- **Es un `GDialog` real** (#330; precedentes #103 y la hoja de la isla): `title` = el nombre del campo, `closeLabel = labels.close`, `size="lg"`, `mobile="sheet"`, clase `g-combobox-surface` y `--palette` (por encima de 520px) o `--sheet` (móvil). Foco atrapado, capa superior, Esc, fondo y vuelta del foco son los de `GDialog`; el foco inicial va al campo de búsqueda (#292). Va dentro de la raíz del componente (dentro de un `GDialog` anfitrión es un modal sobre otro: medido por kiwi, elige, vuelve al campo y el anfitrión sigue abierto).
- **Título:** la prop `label`; sin ella, el `aria-label` del consumidor; sin ninguno, `labels.surfaceTitle`. Si no hay ninguno, aviso.
- **El campo de la página es el disparador:** conserva `role="combobox"` con `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls="ID-surface"`, **sin** `aria-autocomplete` ni `aria-activedescendant`, y `inputmode="none"` (no abre el teclado virtual). La raíz lleva `is-surface` y la flecha pasa a `chevrons-up-down`. Abre con clic, Intro, Espacio, ↓, ↑, Alt+↓ **o al escribir** (la primera tecla, o lo pegado, **no se pierde**: es el texto inicial de la búsqueda). Enfocar no abre.
- **Campo de búsqueda:** el `combobox` de APG completo; nombre por `aria-labelledby` al título; `placeholder` = la etiqueta de la opción elegida o el `placeholder` del campo. Sin `name` ni contexto de `GForm`.
- **Vista previa** (`palette` por encima de 520px): `aside` con nombre `labels.preview`; pinta la **opción activa** (slot `preview`, o por defecto, desde #356, una **`GSummary layout="stack"`** con los datos de la fila: identidad `lg`, `code`, `label`, `description` si no hay `facts`, y los `facts` como rejilla de pares, sin `dl`); sin opción activa, `labels.previewEmpty` (si se da). **No es región viva.** **Regla (#335): la vista previa nunca es la única fuente del dato que distingue**; ese dato va también en la opción (`description` o `facts`). La vista previa por defecto la cumple por construcción (solo pinta datos de la fila); el slot `preview` queda bajo responsabilidad de la aplicación (README).
- **Móvil (visor ≤ 520px, `matchMedia`, literal de #42 y #56):** la misma superficie como **hoja anclada arriba**, de ancho completo, **sin vista previa**, opciones ≥ 44px. Arriba para que el teclado virtual no tape la lista (coco la coloca desde `g-combobox-surface--sheet`). Cruzar el umbral con la lista abierta la cierra.
- **Cerrar:** Esc, el fondo y el botón de cierre (`dismiss` de `GDialog`) cierran **sin elegir** y devuelven el foco al campo. Elegir cierra y devuelve el foco. No hay confirmación de texto al cerrar.
- **El cuerpo del diálogo no se desplaza:** se desplaza el panel (y la vista previa); `g-dialog__body` no debe recibir `tabindex` (coco fija el alto del cuerpo de la superficie; bruno lo prueba).

---

## Fichas con `GSummary` (#356; sustituye la regla provisional de dos líneas)

Decisión del usuario del 2026-10-04. El reporte de origen (fichas de opción amontonadas y desbordadas a 240px: 122px de alto, cinco líneas, `__main` 161 en 152px) se cierra con el componente **`GSummary`** (`design/contracts/summary.md`, #349 a #357), no con el arreglo mínimo de `GCombobox.css`. **Este apartado manda sobre lo que el resto del contrato diga de la pintura por defecto de fila, ficha y vista previa.** Modelo, datos, teclado, anuncios, slots y nombre accesible **no cambian**.

| Dónde | `GSummary` | Props |
| --- | --- | --- |
| **Opción** por defecto (sin slot `option`) | `layout="row"` `:lines="2"`; `size` `md` (con el campo en `xs` o `sm`, `sm`) | `title`, `code`, `subtitle`, `facts`, `avatar`, `icon`, `highlight`, `diff`; slot `lead` |
| **Ficha del valor** (dentro de `g-combobox__token`, sin slot `value`) | `layout="inline"` `size="xs"` | `title`, `code`, `subtitle`, `facts`, `avatar`, `icon`; slot `lead` |
| **Vista previa** de la paleta (sin slot `preview`) | `layout="stack"` `size="lg"` | Como la opción, sin `highlight` |

**Traducción de la opción (#335 intacto):**

| Campo | Prop | Regla |
| --- | --- | --- |
| `label` | `title` | Siempre |
| `description` | `subtitle` | **Solo si la opción no trae `facts`** (como hoy: «fila, si no hay `facts`»). Con `facts` no se pinta ni se lee dos veces; sigue alimentando `ID-about` |
| `code` | `code` | Identificador: no cede |
| `facts` | `facts` | Sin valor vacío (como hoy). Un dato **sin `label`** deja de pintarse y avisa (#335 ya lo pedía con rótulo). `priority`, `short` y `bare`, opcionales |
| `avatar`, `icon` | `avatar`, `icon` | Tal cual (la derivación de props de `GAvatar` pasa a la ficha) |
| slot `lead` (`{ option }`) | slot `lead` de la ficha | Manda sobre `avatar` e `icon` |

- **`highlight`** = el texto buscado recortado, solo en la opción.
- **Contraste entre homónimos:** `GCombobox` calcula `summaryDiff` sobre las **opciones pintadas** (no sobre el total del servidor), lo recalcula cuando cambian y pasa a cada ficha su `diff` (también a la vista previa de esa opción). Sin homónimos a la vista, ninguna marca. Completa la regla de #333: Tab no elige entre homónimas, y ahora se ve en qué se diferencian.
- **Texto libre:** la ficha del valor es `GSummary inline` con `title` = el texto, `subtitle` = `labels.custom` y el icono `pencil` en el slot `lead`; la cursiva sigue colgando de `is-custom`.
- **La elegida:** sigue con `aria-selected="true"` y `check`. El título de la ficha ya lleva peso de título en todas las opciones, así que **«más peso» deja de ser la señal**: la no cromática es `check`.
- **Llegada de la ficha (C):** sin cambios; el origen del vector es la `.g-summary` de la fila elegida.
- **`ID-about`**, la línea secundaria accesible, sigue saliendo de `secondary(option)`; la ficha del valor es `aria-hidden`.
- **Slots:** `option`, `value` y `preview` siguen ganando y reciben lo de siempre. `GSummary` es pública (`@grana/vue`): es lo que se recomienda poner dentro de ellos.
- **Clases que dejan de pintarse** (se retiran de `GCombobox.css`; el componente es `candidate`): `g-combobox__description`, `__facts`, `__fact`, `__fact-label`, `__token-label`, `__token-meta`, `__preview-head`, `__preview-title`, `__preview-facts`; y en las opciones, `__lead`, `__code`, `__main`, `__label` y `__mark` (las **filas de acción** conservan `__main` y `__label`). Sus equivalentes son las partes `g-summary__*`, que `GCombobox.css` puede reapuntar por estado (activa, activa invertida de la paleta, deshabilitada, `is-custom`, ficha «seleccionada»).
- **Altos:** una opción con datos mide lo que una ficha de dos líneas (44px en `md`) más el relleno de la fila, **igual en cualquier ancho**; sin datos ni descripción, una línea. Ficha del valor: Δ0. Hoja móvil: opciones ≥ 44px, como hoy.
- **Compuertas que siguen:** «500 opciones < 150 ms», `--g-form-min: 60`, las tres de #337 y las nuevas de #350 (`! grep -q "g-summary__" packages/vue/dist/combobox.js`).

---

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | `String \| Number \| null` | Se elige una opción distinta; se limpia; al salir con el texto vacío; al confirmar un texto libre (`null`) |
| `update:custom` | `String` | Se confirma un texto libre (el texto); se elige una opción, se limpia o se vacía (`''`). Solo si cambia |
| `change` | `{ value, custom, option }` | **Una vez por cambio confirmado** del valor, después de los `update:*`: `option` es la opción elegida o `null` |
| `search` | `String` | Ver «Datos» |
| `more` | `String` (el texto actual) | «Mostrar más» con `filter: false` |
| `create` | `String` (el texto) | Fila «Agregar «texto»…»; el foco ya volvió al campo |
| `open` | | El panel o la superficie pasan a verse |
| `close` | | Dejan de verse, por el motivo que sea |

- Todos se declaran en `emits` (lección de `emits`): el `@change` del consumidor recibe el objeto y no llega al `<input>` nativo. Los demás (`focus`, `blur`, `keydown`, `input`…) llegan nativos al `<input>` visible, **después** de los manejadores propios (`mergeProps`, C8).
- **Para `GForm`:** escribir es escritura (el `input` nativo, `notifyInput`: el error se revela al salir); elegir, limpiar y confirmar un texto libre llaman a **`notifyChange()`** (suben `dirty` y retiran `is-rejected`). Con `readonly` no se emite nada.

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `label`, `hint`, `error` | Los de `GInput` (`error` es el **mensaje del campo**) | | Como `GInput` |
| `prepend` | Icono decorativo del campo (lupa, icono del dominio) | | Como `GInput`: envuelto en `aria-hidden`. Se oculta mientras hay ficha (el hueco inicial de la opción lo sustituye, como en `GSelect`, #58) |
| `option` | Contenido de una fila de opción | `{ option, active, selected, query }` | Dentro del `li role="option"`; sin interactivos; **debe conservar el texto que distingue**; el nombre accesible es su texto |
| `lead` | Hueco inicial de una opción (sustituye a `avatar`/`icon`) | `{ option }` | Decorativo (`g-combobox__lead`, `aria-hidden`); se usa en fila, ficha y vista previa. Un `.g-avatar` manda su caja (#295) |
| `value` | Contenido de la ficha en reposo | `{ option, custom }` (`option` `null` con texto libre) | Dentro de `g-combobox__token` (`aria-hidden`, una línea, sin interactivos, sin cambiar el alto) |
| `preview` | Ficha de la opción activa en la paleta | `{ option }` | Dentro de `g-combobox__preview`; sin interactivos; regla de la vista previa |
| `empty` | Estado sin resultados | `{ query }` | Sustituye al texto de `labels.noResults`; el anuncio sigue usando `labels.noResults` |
| `load-error` | Estado de error de carga | `{ message, query }` | Sustituye al texto; la fila «Reintentar» y el anuncio (`loadError`) se conservan |

**Sin `append` ni `action`** (el final de la caja es de limpiar y flecha, y una caja fusionada rompe la forma única de A): si se pasan, no se pintan y se avisa. El slot `preview` con `appearance="field"` no se pinta por encima de 520px ni en móvil.

## Textos (`labels`, sin valores por defecto; #226)

Marcadores con `fill` (`utils/template.js`). Los **contados** admiten String con marcador o **Function** (para el plural).

| Clave | Marcadores / firma | Dónde | Si falta |
| --- | --- | --- | --- |
| `clear` | | Nombre del botón de limpiar (con la etiqueta por `aria-labelledby`) | Sin botón; aviso con `clearable` |
| `close` | | `closeLabel` de la superficie | Sin botón de cierre; **aviso al montar** (la superficie existe siempre en móvil) |
| `loading` | | Estado «Buscando…» | Estado sin texto; aviso al usarse |
| `noResults` | `{text}` | Estado y anuncio sin resultados | Ídem |
| `minChars` | `{count}` | Pista de mínimo | Aviso con `minChars > 0` |
| `results` | `{count}` · `(count) => String` | Anuncio con todos los resultados a la vista | Sin anuncio; aviso al usarse |
| `partial` | `{count}`, `{total}` · `(count, total) => String` | Anuncio con más resultados que los pintados | Usa `results`; aviso |
| `more` | `{shown}`, `{total}` | Fila «Mostrar más» | Fila sin texto; aviso al usarse |
| `retry` | | Fila «Reintentar» | Ídem |
| `useCustom` | `{text}` | Fila «Usar «texto» como texto libre» | Sin fila; aviso con `allowCustom` |
| `custom` | | Marca «Texto libre» de la ficha y su descripción accesible | Ficha sin marca; aviso con `allowCustom` |
| `create` | `{text}` | Fila «Agregar «texto»…» | Sin fila; aviso con `creatable` |
| `preview` | | Nombre de la región de vista previa | Aviso con `appearance="palette"` |
| `previewEmpty` | | Vista previa sin opción activa | Vacía, sin aviso |
| `surfaceTitle` | | Título de la superficie cuando el campo no tiene `label` ni `aria-label` | Aviso solo en ese caso |

Las cifras de `{count}`, `{shown}` y `{total}` se formatean con `Intl.NumberFormat` del `lang` del ancestro más cercano (como `GNumberField`, sin prop `locale`).

## Anuncios (región viva educada; WCAG 4.1.3)

- **Qué:** al asentarse una búsqueda, **un** anuncio: `partial` («20 de 1 240 resultados») o `results`; sin opciones y con texto, `noResults`; `loadError` cuando llega. Tras «Mostrar más», el recuento nuevo.
- **Cómo:** `utils/liveRegion.js`, con **600 ms** de retardo (constante de JS, no tema) para no pisar el eco de escritura; un anuncio por búsqueda asentada; nada si la lista se cerró.
- **Dónde:** `g-combobox__live` de la raíz; con la superficie abierta, la región de **dentro de la superficie** (la página está inerte).
- **No se anuncia:** «Buscando…», la pista de mínimo, la elección (el valor del campo ya cambia), abrir ni cerrar.

## Teclado (#333)

| Tecla | Lista cerrada | Lista abierta |
| --- | --- | --- |
| Carácter | Abre y busca | Busca |
| ↓ / ↑ | Abre; activa la elegida, o la primera / la última | Siguiente / anterior fila habilitada; **no cicla**; salta encabezados y deshabilitadas; las filas de acción cuentan |
| Alt+↓ | Abre sin mover la activa | — |
| Alt+↑ | — | Cierra |
| Av Pág / Re Pág | — | Diez adelante / atrás |
| Inicio / Fin / ← | Edición del texto | Edición del texto (no son de lista) |
| → | Edición del texto | Con texto fantasma y el cursor al final: **acepta el texto** (el campo queda con la etiqueta completa) **sin elegir** y sin nueva búsqueda; la opción pasa a contar como activada por la persona. Si no, edición |
| Intro | Nativo (envío implícito, como `GInput`) | Elige la activa y cierra; sobre una fila de acción, la ejecuta; sin activa, nada (y no envía). **Si la activa quedó resaltada sola y hay búsqueda pendiente, no hace nada** |
| Esc | Con texto sin confirmar: restaura el de la opción elegida y lo selecciona (sin propagar). Si no, nativo | Cierra y conserva el texto; `preventDefault` + `stopPropagation` (**no** cierra un `GDialog` anfitrión) |
| Tab | Sale; aplica «Al salir del campo» | Cierra y sale. **No elige**, salvo la excepción de abajo. Sobre una fila de acción, no la ejecuta |

- **Enfocar no abre.** Abren: escribir, ↓, ↑, Alt+↓ y el clic en la caja. Al entrar con valor, y tras elegir, **el texto queda seleccionado**: lo siguiente que se teclea lo reemplaza. Con ficha (C), el foco la pinta seleccionada entera; escribir la reemplaza, Retroceso la vacía.
- **Tab no elige** (difiere de `GSelect` a propósito): allí la activa la puso la persona con flechas; aquí la puso el componente. Elegir un paciente por pasar de largo es un cambio de contexto inesperado (WCAG 3.2.2).
- **Única excepción (A):** Tab elige la opción del **texto fantasma** cuando, además de las condiciones del fantasma, su etiqueta es **única** entre las opciones a la vista (sin acentos ni mayúsculas) **y no quedan resultados sin pintar** (no hay fila «Mostrar más»). Con homónimas, o con más resultados de los pintados, el campo completa el nombre pero Tab no elige. Es lo que la persona ve escrito en el campo, no una fila que no miró.
- **Intro y resultados obsoletos:** «pendiente» es el de «Datos». Una opción activada por la persona (flechas, puntero, →) sí se elige con Intro.
- **Composición (IME):** ninguna tecla de lista actúa mientras `isComposing`; no hay texto fantasma durante la composición.
- **En la superficie:** el disparador abre con Intro, Espacio, ↓, ↑, Alt+↓ o un carácter. Dentro, la tabla de «Lista abierta» sobre el campo de búsqueda, salvo que **Tab se mueve dentro del diálogo** (campo → cierre) y **nunca elige**, y Esc cierra la superficie (un nivel).
- **Puntero:** pasar sobre una fila la activa; el clic elige (o ejecuta la acción). Un `pointerdown` fuera cierra (en `field`, es la salida del campo).

## Estados

Reposo vacío · reposo con valor (ficha) · reposo con texto libre (`is-custom`) · foco · escribiendo con fantasma · pista de mínimo · cargando sin resultados · cargando con resultados anteriores (`aria-busy`) · resultados · resultados con «Mostrar más» · sin resultados · error de carga con «Reintentar» · fila de texto libre · fila de agregar · solo lectura · deshabilitado · error, advertencia y válido (los de `GInput`) · `is-rejected` · abierto hacia arriba (`is-up`) · paleta · paleta dentro de `GDialog` · hoja móvil (375 y 320) · RTL · reduced motion · `forced-colors`.

## En una `GFormRow` (#336)

- **Admitido como hijo** de una fila con más de un hijo (raíz de `GInput`, tres hijos; medido por kiwi en una fila de tres, Δ `top` 0).
- **Ancho mínimo de A:** la lista mide lo que el campo. Para que la fila se parta **antes** de que el campo quede estrecho, coco declara en `GCombobox.css` **`--g-form-min: 60`** (`space × 60` = 240px con `space` 4: el ancho en que kiwi midió A funcional, 239px) sobre `.g-form-row > .g-combobox--appearance-field`. Es la propiedad pública de entrada de `form.md` §4: **el consumidor la sobrescribe** con `style` (sube para fichas anchas, baja para catálogos de etiqueta corta). `palette` no la declara (su superficie no depende del campo). Sin JS ni medida: no usa `setIntrinsicMin`.
- Fuera de una fila el ancho es del consumidor; A funciona a cualquier ancho (las fichas se apilan).
- **No es parte de `GInputGroup`** en v0.1 (reservado, #338): dentro de uno, aviso.

---

## Movimiento (#336)

Con `prefers-reduced-motion: reduce` **ninguno se mueve** (#299 (3)); nada se anima al montar.

| Pieza | Qué | Duración y curva |
| --- | --- | --- |
| A · despliegue | `g-combobox__popup-body` crece desde la línea del campo (`grid-template-rows` 0fr → 1fr con `@starting-style`), solo **al abrir**; los cambios de alto entre resultados no se animan; cerrar es inmediato | `--g-duration-slow`, **`--g-ease-out`** (no el muelle: es una entrada, `tokens.md` §29.1) |
| B · entrada | La de `GDialog` desde su disparador (D1, #301), sin cambios: el disparador es el campo | La de `GDialog` |
| C · la ficha llega | Al elegir desde la lista de `field`, la ficha viaja de su fila a su sitio. Bruno escribe el vector en `--_travel-x` / `--_travel-y` (px) y pone **`is-arriving`** en `g-combobox__token`; coco anima con keyframes **`g-combobox-arrive…`**; bruno retira la clase en `animationend`/`animationcancel` de ese nombre, o en el acto si no hay animación calculada (patrón de `GNumberField`, #313) | `--g-duration-slow`, **`--g-ease-spring`** dentro de `@supports`; fuera, `--g-ease-out`. **Cuarto uso aprobado del muelle**: un desplazamiento que llega |
| Opción activa, hover, fantasma | Color y fondo | `--g-duration-fast`, `--g-ease-standard` |
| Indicador de carga | Giro | `--g-duration-spin` |

- La ficha **no viaja** al elegir desde la superficie (el campo está detrás del modal), al cargar con valor, ni al cambiar `modelValue` desde la aplicación.
- **Para coco:** medir el rebase de la llegada con la fila más lejana (3,8 % de la distancia); si pasa de `--g-space-1 × 2`, acotar el vector en CSS con `clamp` y anotarlo en `estilo.md` (alias local, §29.7; no cambia el contrato).

## Tokens consumidos (#336)

**Tokens nuevos: ninguno** (`tokens.md` §32). Además de los de `GInput` (caja, texto, foco, mensajes, solo lectura, `is-rejected`) y los de `GDialog` (la superficie):

| Token | Para qué |
| --- | --- |
| `--g-color-surface`, `--g-color-border`, `--g-color-border-control` | Fondo de la lista; costura campo–lista; contorno de la forma abierta |
| `--g-focus-width`, `--g-focus-offset`, `--g-color-focus` (o el `color` del campo) | Anillo de la forma completa (campo + lista) en A; barra de la opción activa |
| `--g-shadow-2` / `--g-shadow-3`, `--g-shadow-1` | Elevación de la forma abierta; ficha activa |
| `--g-color-surface-sunken` | Opción activa; fondo de la vista previa |
| `--g-color-text`, `--g-color-surface` (par inverso, #325) | Opción activa de la paleta |
| `--g-color-text-muted`, `--g-color-text-subtle` | Línea secundaria, rótulos, encabezado de grupo, texto fantasma (≥ 4.5:1); deshabilitada |
| `--g-color-selection` | Fondo del resto fantasma y de la ficha «seleccionada» con foco (primer consumidor del rol, `tokens.md` §17.5) |
| `--g-color-danger-text` | Estado de error de carga |
| `--g-radius-xs` … `--g-radius-lg`, `--g-radius-{rounded}` | Forma abierta (el radio de la caja), código, fichas, superficie |
| `--g-space-1`, `--g-border-width` | Rellenos, separaciones, alturas de fila (la caja del mismo `size` y `density`, piso 24px y 44px táctil) |
| Roles `body`, `body-sm`, `caption`, `title-sm`, `action` (`tokens.md` §23) | Etiqueta, línea secundaria, código, título de la vista previa, peso de la elegida |
| `--g-duration-fast`, `--g-duration-slow`, `--g-duration-spin`, `--g-ease-standard`, `--g-ease-out`, `--g-ease-spring` | «Movimiento» |

**No son tokens** (`tokens.md` §32): `delay` 250 ms (prop), **600 ms** del anuncio y **10** filas de Av Pág (constantes de JS), 240px del criterio «abre hacia arriba» (de `placeBlock`), **`--g-form-min: 60`**, el umbral literal 520px (#42), y las medidas de diseño derivadas de `space` que fija coco (alto máximo de la lista, alto del cuerpo de la superficie, proporción lista–vista previa).

## Clases y datos (contrato bruno ↔ coco)

Las de `GInput` siguen siendo de `GInput`. Bruno emite estas; coco las estiliza.

| Clase / dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-combobox`, `g-combobox--appearance-{field\|palette}` | Raíz (la de `GInput`) | Siempre |
| `is-open` | Raíz | Panel de `field` visible |
| `is-up` | Raíz | La forma se abre hacia arriba |
| `is-surface` | Raíz | El campo actúa como disparador (paleta o móvil) |
| `is-token` | Raíz | Ficha visible (valor, sin texto a medio escribir y sin lista de `field` abierta) |
| `is-custom` | Raíz | El valor es texto libre |
| `g-combobox__value`, `__field` | Celda; `<input>` visible | Siempre |
| `g-combobox__ghost`, `__ghost-typed`, `__ghost-rest` | Capa fantasma | Con texto fantasma |
| `g-combobox__token`, `__token-label`, `__token-meta` | Ficha en reposo | Con `is-token` |
| `is-arriving` + `--_travel-x`, `--_travel-y` | `__token` | Mientras llega |
| `g-combobox__about`, `__clear-text` | Textos ocultos accesibles | Con valor; con limpiar |
| `g-combobox__clear`, `__arrow` | Limpiar; flecha | `clearable` con valor; editable |
| `g-combobox__live` | Región viva | Siempre (y otra en la superficie abierta) |
| `g-combobox__popup`, `__popup-body`, `is-empty` | Popover de A y su parte desplegable | `field` |
| `g-combobox__panel`, `__status`, `__status--{hint\|loading\|empty\|error}`, `__list` | Panel | Lista o superficie |
| `g-combobox__group`, `__group-label` | Grupo | Por grupo |
| `g-combobox__option`, `is-active` | Fila | Por opción y fila de acción |
| `g-combobox__action`, `__action--{retry\|more\|custom\|create}` | Fila de acción | Según estado |
| `g-combobox__lead`, `__code`, `__main`, `__label`, `__description`, `__facts`, `__fact`, `__fact-label`, `__check`, `__mark` | Partes de la fila (y de ficha y vista previa donde aplique) | Según la opción |
| `g-combobox-surface`, `--palette`, `--sheet` | El `GDialog` | Superficie |
| `g-combobox__search`, `__search-icon`, `__search-field`, `__search-loader` | Campo de la superficie | Superficie |
| `g-combobox__surface-body`, `has-preview`, `g-combobox__preview`, `__preview-head`, `__preview-title`, `__preview-facts`, `__preview-empty` | Cuerpo y vista previa | Superficie; `palette` |

El estado elegida y deshabilitada de una opción se estiliza con `aria-selected` y `aria-disabled`.

**Desde #356:** de esta tabla dejan de emitirse `__token-label`, `__token-meta`, `__description`, `__facts`, `__fact`, `__fact-label`, `__preview-head`, `__preview-title` y `__preview-facts`, y en las opciones `__lead`, `__code`, `__main`, `__label` y `__mark`; en su lugar va una `g-summary` (clases en `summary.md`). Lista completa en «Fichas con `GSummary`».

**Para coco:**

- **A, una sola forma:** el contorno, el anillo y la sombra son del `popup` (campo + lista); mientras está abierto y con panel, el borde y el anillo propios de la caja se vuelven transparentes; entre campo y lista, solo una línea fina. Medidas de kiwi a reproducir: Δ izquierda, arriba y ancho entre caja y forma < 1px, costura < 1.5px, también hacia arriba; el punto central del campo devuelve el `<input>`.
- **Opción activa:** un solo indicador, no solo color, ≥ 3:1. En `field`, sin segundo contorno dentro de la forma (barra al inicio con `--g-focus-width`, reflejada en RTL, o el borde de ficha: lo que mida mejor). En la paleta, invertida (`--g-color-text` / `--g-color-surface`; medido 17.4:1).
- **Ficha (C):** sobre la celda, a la altura de siempre (**Δ0 de alto** con y sin ficha); con `is-token` el texto y el cursor del `<input>` son transparentes; el dato secundario **se recorta primero** (elipsis) y la etiqueta conserva sitio; avatar `xs`; texto libre con `pencil`, cursiva y `labels.custom`; con el foco, la ficha se ve seleccionada (`--g-color-selection`).
- **Texto fantasma:** misma tipografía que el campo, contraste ≥ 4.5:1 (medido 6.56:1), sin puntero.
- **`forced-colors`** (L23, **sin medir por kiwi: medir**): con `is-token`, **retirar la ficha y mostrar el texto del `<input>`** (colores del sistema); forma de A con `CanvasText`; activa con `Highlight` / `HighlightText`; fantasma en `GrayText`; `mark` conserva peso y subrayado; limpiar y flecha con `ButtonText`.
- Hover dentro de `@media (hover: hover)`; filas ≥ 24px y ≥ 44px con `pointer: coarse` y en la hoja; `cursor: pointer` en filas y limpiar; la superficie con las variables y clases de `GDialog` (sin tocar `GDialog.css` para lo propio: todo cuelga de `g-combobox-surface`).

## RTL

La forma de A se alinea al borde de inicio de la caja; hueco inicial al inicio; la barra de la activa se refleja; la vista previa pasa al otro lado (propiedades lógicas). `--_x` es físico (lo calcula bruno). Los iconos no son direccionales. El texto del campo sigue la dirección del contenido.

## SSR

Importar y renderizar en el servidor no toca `document`, `window`, `navigator` ni `matchMedia`. El servidor pinta el campo con la etiqueta de la opción elegida (de `options` o `selectedOption`) o el texto libre, la ficha, los ocultos y el panel cerrado; la superficie, cerrada. `is-surface` y el umbral móvil se resuelven **al montar** (el servidor pinta según `appearance`). Temporizadores, colocación, medidas y animaciones, solo en el cliente.

---

## Avisos de desarrollo (`[Grana GCombobox]`, una vez por instancia y motivo)

Con el patrón `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`.

1. Sin nombre accesible: sin `label`, slot `label`, `aria-label` ni `aria-labelledby`.
2. Un texto de `labels` que hace falta y no está (tabla de «Textos»): `close` al montar; los demás, la primera vez que se necesitan.
3. Opción sin `value` o sin `label` (se ignora); `value` repetido.
4. `modelValue` sin opción conocida y sin `selectedOption` (el campo queda vacío; el valor se envía); `selectedOption` cuyo `value` no es `modelValue`.
5. `modelValue` y `custom` con valor a la vez (gana `modelValue`); `custom` no vacío sin `allowCustom`.
6. `allowCustom` con `name` y sin `customName`: el texto libre no viaja en `FormData`.
7. `filter: false` y, tras emitir `search` o `more`, la aplicación no responde en el siguiente ciclo (ni `loading`, ni `options`, `total` o `loadError`).
8. `total` con filtro local (se ignora), o menor que las opciones entregadas.
9. `multiple` (reservado para la Fase 2: se ignora); `type` en `$attrs`; slots `append` o `action`; slot `preview` con `appearance="field"`.
10. Dentro de un `GInputGroup` (no admitido en v0.1).
11. `limit` < 1, `delay` < 0 o `minChars` < 0 (además del validador: se usa el valor por defecto).

## Resolución de hallazgos

### r01 (`design/lab/combobox/r01/declaracion.md`)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Composición | Compone `GInput` con los slots internos `field` (celda con `<input>`, capas y ocultos) y `end` (limpiar y flecha); contrato propio; entra en `form.md` como Fase 5 | #330; #309 |
| L2 | Props de datos | Tabla de «Props». **`filter`** (`true` · `false` · función) en lugar de `remote`: una sola prop dice quién filtra; `loading`, `total`, `loadError`, `selectedOption`, `minChars` 0, `delay` 250, `limit` 50 | #332 |
| L3 | Eventos | `update:modelValue`, `update:custom`, `change`, `search`, `more`, `create`, `open`, `close`; «Reintentar» re-emite `search` (sin `retry`) | #331, #332 |
| L4 | Texto libre | **Prop paralela `custom`** (`v-model:custom`) y `customName` para el envío: `modelValue` nunca cambia de tipo y `FormData` recibe dos claves distintas. `change` lleva `{ value, custom, option }` | #331 |
| L5 | Textos | `labels` sin valores por defecto (tabla de «Textos»). Cambios sobre la propuesta: `clear` sin `{label}` (el nombre se compone con `aria-labelledby`), `one` desaparece (`results` admite función), `empty` → `noResults`, `custom` → `useCustom` (fila) y `custom` (marca), `createLabel` → `creatable` + `labels.create`, más `preview`, `previewEmpty`, `surfaceTitle` | #335; #226 |
| L6 | Tab no elige | Registrado, con la excepción de A acotada | #333 |
| L7 | Intro con búsqueda pendiente | «Pendiente» incluye el tramo entre emitir y la respuesta de la aplicación; regla de `loading` en el mismo manejador; aviso 7 | #332, #333 |
| L8 | Error de carga | En el panel, con «Reintentar» y anuncio; `loadError` no es `error`; slot `load-error` (no `error`, que es el mensaje del campo) | #332 |
| L9 | Slots | `option` (`{ option, active, selected, query }`), `lead` (`{ option }`), `prepend`, más `value`, `preview`, `empty`, `load-error` | #335 |
| L10 | `required` | `aria-required`, nunca `required` nativo: el visible no es el que se envía. **Extiende #270 a `GCombobox`** (como #311); `GInput`, `GTextarea` y `GInputGroupSelect` siguen pendientes | #334 |
| L11 | Hoja móvil | Umbral literal 520px (#42, #56) con `matchMedia`; el disparador con `aria-haspopup="dialog"`; dos `combobox` (página y superficie): a «No verificado», con lector real | #330, #334 |
| L12 | `GInputGroup` | Reservado; aviso 10 | #338 |
| L13 | `GFilterBar` | Reservado: podrá componerlo como editor de valor (obligaría a revisar la entrada del paquete) | #338 |
| L14 | Selección múltiple | Decisión del usuario: `multiple` en Fase 2 con ronda propia; nombres y modelo reservados («Fuera de v0.1») | #338 |
| L15 | Tokens | Ninguno nuevo | #336 |

### r02 (`design/lab/combobox/r02/declaracion.md`)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L16 | A · ancho | **Sin panel separado de respaldo**: una sola forma de escritorio (kiwi midió A funcional a 239px). El ancho se protege en la fila con `--g-form-min: 60` por CSS, que el consumidor puede cambiar; sin `setIntrinsicMin` (no hay contenido que medir) | #336 |
| L17 | A · Tab | Tab elige solo con texto fantasma, etiqueta única a la vista **y sin resultados por pintar**; `→` acepta el texto sin elegir | #333 |
| L18 | A · texto fantasma | Solo por prefijo, sin búsqueda pendiente, sin IME, con el cursor al final; `aria-hidden`; contraste ≥ 4.5:1 | #333 |
| L19 | B · superficie | `appearance: 'field' \| 'palette'` (no `surface`); slot `preview` (`{ option }`) y vista previa por defecto; la superficie es un `GDialog` real y la hoja móvil es la misma sin vista previa | #330 |
| L20 | B · regla | La vista previa nunca es la única fuente del dato que distingue: la de por defecto solo pinta datos de la fila; el slot, documentado | #335 |
| L21 | C · datos | Campos `avatar`, `icon`, `code`, `description`, `facts`; slot `value` (`{ option, custom }`); la línea secundaria va en `aria-describedby` (`ID-about`) | #335, #334 |
| L22 | C · texto libre | Marca `labels.custom` (visible y en la descripción accesible), icono `pencil`, clase `is-custom` | #331, #335 |
| L23 | C · `forced-colors` | Retirar la ficha y mostrar el texto del `<input>`: encargo a coco **con medida** | «Para coco» |
| L24 | Personalidad | A + B + C registradas con su «Qué lo hace distinto»; nada queda descartado: semillas y reservas a `PENDIENTES.md` | #329, #338 |
| L25 | Tokens | Ninguno nuevo. El muelle solo en la llegada de la ficha (cuarto uso); el despliegue de A y la entrada de B, sin muelle | #336 |

## Límites conocidos (para el README)

- **Sin virtualización:** con `filter: false` se pinta todo lo entregado; cientos de filas acumuladas con «Mostrar más» pueden ir lentas.
- **Respuestas fuera de orden** y caché: de la aplicación. Si no pone `loading` al recibir `search`, Intro no elige la opción resaltada sola (hay que moverse con las flechas).
- **Tab solo elige en A** con etiqueta única y lista completa; en la paleta y en móvil, nunca.
- **Texto fantasma** solo con coincidencia por prefijo (no al buscar por código o expediente) y no durante la composición IME.
- **A dentro de `GInputGroup`** y con el slot `action` de `GInput`: no admitido.
- **Paleta dentro de un `GDialog`:** modal sobre modal; funciona, pero tapa el contexto. Para un código postal o un medicamento, `field`.
- **`required`** no participa en la validación nativa (el campo oculto no se valida): valida la aplicación y usa `error`.
- **Las filas de acción se anuncian como una opción más** («…, opción 21 de 21»): sus textos deben ser explícitos.
- **Dos `combobox`** con la superficie abierta (disparador y campo de búsqueda): sin verificar con lector real.
- **WebKit:** Tab no llega al botón de cierre de la superficie salvo ajuste del sistema (Esc y el fondo cierran).
- **Sin autocompletado del navegador** (`autocomplete="off"`).
- **Navegadores:** exige `popover`, `@starting-style` y `<dialog>` (los actuales); sin `@starting-style`, A se abre sin despliegue.

## Verificación (cómo se da por hecho)

**Criterio de hecho:** las medidas de kiwi (`r01/verificar.mjs`, 105 por motor; `r02/verificar.mjs`, A 114, B 112 y A+C 126 por motor) reproducidas **sobre el componente real**. Verificación por niveles (CLAUDE.md): durante la ronda, el spec afectado en Chromium; la pasada completa en los tres motores, una vez al cierre. Puerto propio de Playwright por agente.

### bruno (vitest + jsdom)

- **Modelo:** las tres filas de la tabla de «Modelo»; orden `update:*` → `change`; elegir la elegida no emite; `selectedOption`; valor sin opción conocida (vacío, aviso, oculto con el valor); `modelValue` + `custom`.
- **Datos:** antirrebote con temporizadores falsos (una emisión por pausa; `delay: 0`); `minChars`; abrir emite `search('')` solo con `filter: false`; filtro local (palabras, acentos, `code`, `description`, `facts`), función propia; `limit` y «Mostrar más» local; `more` y activa en la primera nueva; «pendiente» en sus tres tramos; `loading` no vacía la lista y pone `aria-busy`; `loadError` con «Reintentar» y opciones previas; aviso 7.
- **Teclado:** la tabla entera; Intro con resaltada sola y búsqueda pendiente no elige, y con activa puesta por flechas sí; Tab no elige con homónimas ni con «Mostrar más», y sí con fantasma único y lista completa; `→` acepta sin elegir ni buscar; Esc en dos niveles con `stopPropagation`; IME (`isComposing`).
- **Al salir:** vacío borra; texto sin coincidencia se descarta; `allowCustom` lo conserva en `custom`; fila `useCustom` oculta con etiqueta idéntica a la vista; `create` con el foco ya en el campo y sin cambiar el valor.
- **Semántica:** atributos del patrón en reposo y abierto; `aria-expanded` falso sin panel; `aria-required` sin `required`; `readonly` + `aria-readonly` (no abre, sin limpiar ni flecha, se envía); `disabled`; ocultos (`name`, `customName`, `form`, `disabled`) y **visible sin `name`**; `FormData`; registro en `GForm` por `name`, `errors[name]`, `notifyChange` al elegir, limpiar y confirmar; manejadores primero (prueba de orden); `ID-about` con la línea secundaria o `labels.custom`; nombre de «Limpiar».
- **Superficie:** `GDialog` real con sus props; el disparador (`aria-haspopup="dialog"`, `inputmode="none"`, la primera tecla como texto inicial); `dismiss` cierra sin elegir; vista previa por defecto y slot; región viva de dentro; `g-dialog__body` sin `tabindex`; cruce del umbral cierra.
- **Anuncios:** uno por búsqueda asentada, a los 600 ms; `partial` / `results` (función) / `noResults` / `loadError`; nada al cerrar.
- **Movimiento:** `is-arriving` y vector solo al elegir desde la lista de `field`; retirada por `animationend` `g-combobox-arrive…` y en el acto sin animación calculada.
- **SSR** (`renderToString` con y sin valor, sin acceso a `window`); **avisos** 1 a 11; **empaquetado**: `__shared` sin duplicados, las tres compuertas, peso gzip anotado en el `meta.json`; `GInput` sin cambios (sus pruebas en verde).

### Playwright (Chromium, Firefox, WebKit; `design/lab/theme-playground/`)

- `tests/combobox.spec.mjs`: la batería de r01 sobre el componente real (semántica, foco por Tab sin abrir, Δ0, capa superior, activa siempre a la vista sin mover la página, grupos, 500 opciones < 150 ms, `GFormRow` de tres y sin huecos, dentro de `GDialog` con Esc que no lo cierra y anuncio dentro, móvil 375 y 320 sin desborde con opciones ≥ 44px y foco de vuelta, RTL, contraste, consola limpia).
- `tests/combobox-forma.spec.mjs`: lo propio de r02. **A:** una sola forma (Δ < 1px, costura < 1.5px, también hacia arriba), el campo usable bajo la forma, fantasma y su contraste, Tab con homónimas y con etiqueta única. **B:** primera tecla, vista previa que cambia con ↓, `:modal`, Tab no sale, Esc y fondo, sobre `GDialog`, activa invertida. **C:** ficha (avatar, código, texto libre), Δ0 de alto, edición sobre la ficha y Esc × 2, fichas con rótulo en la lista. La fila se parte antes de 240px (`--g-form-min`) y respeta el valor del consumidor.
- `tests/personalidad-combobox.spec.mjs`: despliegue de A (≥ 2 alturas intermedias, solo al abrir), llegada de la ficha (≥ 2 posiciones intermedias, termina en 0 y retira la clase; rebase medido), entrada de B; con `reduce`, nada se mueve y no quedan clases.
- Prueba obligatoria de distribución (`tests/form-distribution.spec.mjs`, #184): sigue pasando.

### coco (CSS y auditoría)

Solo `var(--g-*)` y `--_*` más las constantes de `tokens.md` §32 y §7; A, B y C medidos en los tres motores; auditoría con un tema distinto y con el oscuro (forma abierta, ficha, fantasma, activa invertida, vista previa, hoja); **`forced-colors` emulado con medida** (L23). Resultado en `design/lab/combobox/auditoria.md`.

### No verificado (entorno real)

Lector de pantalla (VoiceOver, NVDA, TalkBack): eco de escritura con la primera opción activa, texto fantasma junto a `aria-activedescendant`, dos `combobox` y la vista previa, `aria-describedby` con la línea secundaria, filas de acción, recuentos; teclado virtual real sobre la hoja; IME real; `forced-colors` real; Safari real; zoom 200/400 %; pegado de texto largo.

## Fuera de v0.1 (reservado, #338)

| Qué | Nombres y forma reservados | Requiere |
| --- | --- | --- |
| **Selección múltiple** (Fase 2, decisión del usuario) | Prop **`multiple`** (Boolean). Con ella: `modelValue` = **Array** de `value` (`[]` sin selección, nunca `null`), `custom` = **Array** de Strings, **`selectedOptions`** (Array) en lugar de `selectedOption`, un oculto por valor con el mismo `name` (y `customName`), `change` con `{ value: Array, custom: Array, options: Array }`, `labels.remove` y `labels.selected` | Ronda propia de kiwi: anatomía de etiquetas dentro de la caja (choca con «sin saltos»), Retroceso y flechas entre etiquetas, anuncios de agregado y quitado |
| `GTagInput` | Etiquetas de texto libre **sin catálogo** | Ronda propia |
| **Ampliar a la paleta desde `field`** | Prop **`expandable`** (Boolean), `labels.expand`, icono `maximize-2` | Ronda corta de kiwi: no deriva limpio. Una fila de acción al final queda lejos de las homónimas (hasta 50 filas); un botón en la caja pierde el texto al salir del campo; un atajo no está en APG. Hay que medir el disparador y el traspaso lista → modal con búsqueda pendiente. Hoy: `appearance="palette"` en los campos con homónimos |
| Parte de `GInputGroup` (CP + colonia) | `GInputGroupCombobox` | Medir A en una caja fusionada |
| Editor de valor de `GFilterBar` | — | Ronda de `GFilterBar`; revisar la entrada del paquete |
| `autoHighlight: false` | Prop `autoHighlight` | Solo si la verificación con lector real lo pide |
| Semillas descartadas por kiwi (r02) | Fichas navegables en rejilla 2D (APG *grid popup*); Tab que acepta siempre | Motivo nuevo |
