# Contrato · GCombobox

**Dueño:** lima · **Estado:** aprobado (forma A + B + C, C sumado a las dos y `multiple` en Fase 2: decisiones del usuario del 2026-10-04; el resto deriva de APG *Combobox with list autocomplete*, WCAG 2.2 y los contratos vigentes; **ninguna pregunta de producto abierta**) · **Basado en:** `design/lab/combobox/r01/` (kiwi; base funcional: frontera del `brief.md`, 27 decisiones, L1 a L15, `combo.js`, `verificar.mjs` 315/315) y `design/lab/combobox/r02/` (kiwi, commit `6187a1d`; conceptos A, B, C y la mezcla `?c=AC`, L16 a L25, 1407/1407 en los tres motores) · **Decisiones:** DECISIONS.md **#329 a #338** · **Convive con:** `input.md` (la caja; slots internos `field` y `end`, #309), `form.md` (contexto, `useFormField`, `GFormRow`; Fase 5), `select.md` (frontera), `dialog.md` (la superficie), `avatar.md`, `icons.md` (`search`, nuevo), `tokens.md` §32 · **Enmendado por #356** (2026-10-04, decisión del usuario): opción, ficha del valor y vista previa se pintan con **`GSummary`** (`summary.md`); ver «Fichas con `GSummary`» · **Fase 2 (`multiple`) contratada por #417 a #428** (2026-10-06, decisiones del usuario: A «La frase» por defecto, B «La receta» como `selection="list"`, C «La cesta» = `palette` + `multiple`; kiwi `design/lab/combobox/r03/`, commit `a6f731f`, L26 a L42): ver «Fase 2 · Selección múltiple», que manda con `multiple`
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
| Varias opciones de un catálogo | **`multiple`** del mismo componente (Fase 2, #417 a #428; frontera completa en «Fase 2 · Cuándo usarlo»). Etiquetas sin catálogo: `GTagInput` (reservado) | Varios `GCombobox` |

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

**Fase 2:** `multiple`, `selectedOptions`, `selection`, `numbered` y `max` están en «Fase 2 · Selección múltiple» (#417 a #428). **No existen** (#330, #338): `remote` (es `filter: false`), `expandable` (reservado: ampliar a la paleta desde `field`), `autoHighlight` (la primera opción activa es fija; nombre reservado), `createLabel` y `clearLabel` (van en `labels`), `emptyText`, `placeholder` como prop (es atributo, como en `GInput`), `prefix`, `suffix`, `output`, `type`, `surface` (colisiona con `GSurface` y `--g-surface-*`), `mode`.

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
- **Línea secundaria** (ficha en reposo y descripción accesible) = `description`; sin ella, los `facts` unidos como «rótulo valor · rótulo valor»; sin ninguno, nada. Solo cuentan los datos **visibles** (rótulo y valor no vacíos; «Fichas con `GSummary`»).
- Campos de más en la opción se conservan y llegan a los slots (`option`, `value`, `preview`, `lead`).

### Reglas de props

- **`modelValue`:** el `value` de la opción elegida, comparado con `===`. `null` o `undefined` = sin opción. El componente recuerda toda opción que haya pintado y elegido; para un valor inicial que no está en `options` (búsqueda remota), la aplicación pasa **`selectedOption`** (con `value === modelValue`; si no coincide, se ignora). Un valor sin opción conocida deja el campo vacío y avisa, **pero se envía igual**.
- **`custom`** (#331): el texto libre cuando el valor **no** es una opción. Exactamente uno de los dos tiene valor: elegir una opción emite `update:custom` con `''`; confirmar un texto libre emite `update:modelValue` con `null` y `update:custom` con el texto. Solo actúa con **`allowCustom`** (sin ella, un `custom` no vacío se ignora con aviso). Con los dos a la vez gana `modelValue` y se avisa. El componente no guarda copia: pinta las props.
- **`appearance`** (#330): `field` = A (la lista es el interior del campo abierto). `palette` = B (superficie modal con vista previa). **Con el visor ≤ 520px siempre se usa la superficie** (hoja, sin vista previa), con cualquier valor. Cambiarla con la lista abierta la cierra.
- **`filter`** (#332): `true`, el componente filtra `options` con su regla (todas las palabras del texto, sin acentos ni mayúsculas, sobre `label`, `code`, `description` y los valores de los `facts` visibles); una **función** sustituye la regla (`query` llega recortado); **`false`: la aplicación filtra** y el componente pinta lo que llega (resultados del servidor). Con `false` cambian cuatro cosas, y solo con `false`: abrir emite `search('')`, «Mostrar más» emite `more`, `total` cuenta, y existe la búsqueda **pendiente** («Datos»).
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
- **Coincidencia** (desde #356 la pinta `GSummary` con su prop `highlight`: la marca es `<mark class="g-summary__mark">`, misma regla)**:** `<mark>` sobre la primera aparición de cada palabra buscada (sin acentos ni mayúsculas) en `label`, `code`, `description` y los valores de los `facts` visibles; peso y subrayado, **no color** (WCAG 1.4.1). Si la forma sin acentos no mide lo mismo que el texto (ligaduras), no se marca.
- **Filas de acción** (#57): `role="option"` con `aria-selected="false"`, hijas directas del `listbox`, **fuera de los grupos y siempre al final**, en este orden: **`retry`** (solo con `loadError`; sustituye a `more`) o **`more`** · **`custom`** · **`create`**. Cuentan en la navegación. Iconos: `rotate-ccw`, `chevron-down`, `pencil`, `plus`.
  - `custom` (con `allowCustom`, texto no vacío y **ninguna opción a la vista con esa misma etiqueta**): elige el texto como `custom`, cierra.
  - `create` (con `creatable` y texto no vacío): cierra, **deja el foco en el campo antes de emitir** `create(texto)`, restaura el texto de la opción elegida y **no cambia el valor**.
- **Lista vacía de opciones** con filas de acción: el estado «Sin resultados» se muestra y debajo las filas.

### `appearance="field"` (A)

- **`g-combobox__popup`** es `popover="manual"` (capa superior; dentro de un `GDialog` funciona porque es descendiente suyo). Su caja **empieza en el borde superior del campo** y su zona alta, del alto del campo, es transparente y **no captura el puntero**: el campo real se ve y se usa a través de ella. Dentro, `g-combobox__popup-body` (la parte con fondo, que se despliega) contiene el panel.
- **Colocación** (bruno, con `placeBlock` de `utils/anchor.js`, sin separación): ancho y posición **de la caja**; hacia arriba (`is-up` en la raíz) si debajo quedan menos de 240px (o menos que el alto natural, si es menor) y arriba hay más sitio: entonces la forma termina en el borde inferior del campo. Se recalcula al abrir, al redimensionar y al cambiar el contenido; **al desplazarse cualquier ancestro solo sigue al ancla** (el lado con histéresis, `--_max` fijo y cierre sin devolver el foco al salir de la vista son las reglas comunes de `docs/contract/api.md` «Paneles anclados», #358). **Abrir no mueve nada** (Δ0 del campo, de la página y del alto del documento). La opción activa se mantiene a la vista desplazando **el panel**, nunca la página.
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
- **El campo de la página es el disparador:** conserva `role="combobox"` con `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls="ID-surface"`, **sin** `aria-autocomplete` ni `aria-activedescendant`, y `inputmode="none"` (no abre el teclado virtual). La raíz lleva `is-surface` y la flecha pasa a `chevrons-up-down`. Abre con clic, Intro, Espacio, ↓, ↑, Alt+↓, Alt+↑ **o al escribir** (la primera tecla, o lo pegado, **no se pierde**: es el texto inicial de la búsqueda). Enfocar no abre.
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

- **Dato visible (precisión de #356, encargo para bruno):** un dato de `facts` es **visible** si su `label` es una cadena no vacía tras recortar y su `value` es una cadena no vacía tras recortar **o un número** (como `present()` de `GSummary`; `visibleFact` de `engine.js`, commit 0b12669). Solo los visibles se pintan, **entran en la búsqueda** (`haystack` de `engine.js`: `label`, `code`, `description` y los valores de los visibles) y en `secondary()` (por tanto en `ID-about` y en `aria-describedby`). Un dato sin `label` ni se pinta, ni se busca, ni se anuncia, y avisa en desarrollo (#335, #356). Así lo que se busca y se oye coincide con lo que se ve; nada invisible produce un resultado «sin explicación». Bruno: `engine.js` filtra por `visibleFact(f)` (misma función que `hasFacts` de `GCombobox.vue`) y añade prueba en `engine`/`combobox.test.js`: opción con un dato sin `label` cuyo valor coincide **no** aparece al buscarlo ni lo lee `ID-about`. `description` con `facts` sigue sin pintarse pero alimentando búsqueda y `ID-about`: es la excepción documentada de #335, no cambia.
- **`highlight`** = el texto buscado recortado, solo en la opción.
- **Contraste entre homónimos:** `GCombobox` calcula `summaryDiff` sobre las **opciones pintadas** (no sobre el total del servidor), lo recalcula cuando cambian y pasa a cada ficha su `diff` (también a la vista previa de esa opción). Sin homónimos a la vista, ninguna marca. Completa la regla de #333: Tab no elige entre homónimas, y ahora se ve en qué se diferencian.
- **Texto libre:** la ficha del valor es `GSummary inline` con `title` = el texto, `subtitle` = `labels.custom` y el icono `pencil` en el slot `lead`; la cursiva sigue colgando de `is-custom`.
- **La elegida:** sigue con `aria-selected="true"` y `check`. El título de la ficha ya lleva peso de título en todas las opciones, así que **«más peso» deja de ser la señal**: la no cromática es `check`.
- **Contraste de la ficha «seleccionada» (encargo de coco, `summary.md` «Adopción en `GCombobox`»):** sobre `--g-color-selection` el rótulo y el valor compartido de `GSummary` miden 4,43:1 (< 4,5:1). `GCombobox.css` los **reapunta a `--g-color-text-muted`** con selectores propios sobre `g-summary__fact-label` e `is-same` y mide el resultado (también con el tema oscuro y uno distinto); `GSummary.css` no conoce al anfitrión.
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
| `lead` | Hueco inicial de una opción (sustituye a `avatar`/`icon`) | `{ option }` | Llega al slot `lead` de la `GSummary` de la fila, la ficha y la vista previa (decorativo, `aria-hidden`; `g-combobox__lead` es hoy solo el icono de las filas de acción). Un `.g-avatar` manda su caja (#295) |
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
| Alt+↑ | — (en `field`; el disparador de la superficie sí abre) | Cierra |
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
- **En la superficie:** el disparador abre con Intro, Espacio, ↓, ↑, Alt+↓, Alt+↑ o un carácter (en el disparador Alt no cambia nada: abrir no elige ni mueve, así que no choca con #333; en `field`, con la lista cerrada, Alt+↑ no hace nada, y la asimetría se deja así a propósito). Dentro, la tabla de «Lista abierta» sobre el campo de búsqueda, salvo que **Tab se mueve dentro del diálogo** (campo → cierre) y **nunca elige**, y Esc cierra la superficie (un nivel).
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
| `g-combobox__token` | Ficha en reposo: contiene la `g-summary` del valor (partes `g-summary__*`, `summary.md`) | Con `is-token` |
| `is-arriving` + `--_travel-x`, `--_travel-y` | `__token` | Mientras llega |
| `g-combobox__about`, `__clear-text` | Textos ocultos accesibles | Con valor; con limpiar |
| `g-combobox__clear`, `__arrow` | Limpiar; flecha | `clearable` con valor; editable |
| `g-combobox__live` | Región viva | Siempre (y otra en la superficie abierta) |
| `g-combobox__popup`, `__popup-body`, `is-empty` | Popover de A y su parte desplegable | `field` |
| `g-combobox__panel`, `__status`, `__status--{hint\|loading\|empty\|error}`, `__list` | Panel | Lista o superficie |
| `g-combobox__group`, `__group-label` | Grupo | Por grupo |
| `g-combobox__option`, `is-active` | Fila | Por opción y fila de acción |
| `g-combobox__action`, `__action--{retry\|more\|custom\|create}` | Fila de acción | Según estado |
| `g-combobox__check` | Marca de la opción elegida (`aria-selected`) | Opción elegida |
| `g-combobox__lead`, `__main`, `__label` | Partes de las **filas de acción** (icono, columna y texto). Las opciones llevan una `g-summary` (`g-summary__lead`, `__code`, `__title`, `__subtitle`, `__fact*`, `__mark`, `summary.md`) | Filas de acción |
| `g-combobox-surface`, `--palette`, `--sheet` | El `GDialog` | Superficie |
| `g-combobox__search`, `__search-icon`, `__search-field`, `__search-loader` | Campo de la superficie | Superficie |
| `g-combobox__surface-body`, `has-preview`, `g-combobox__preview`, `__preview-empty` | Cuerpo y vista previa (la ficha de la vista previa es una `g-summary` `stack`) | Superficie; `palette` |

El estado elegida y deshabilitada de una opción se estiliza con `aria-selected` y `aria-disabled`.

**Desde #356 (comprobado contra `GCombobox.vue` y `GCombobox.css`):** ya no existen `__token-label`, `__token-meta`, `__description`, `__facts`, `__fact`, `__fact-label`, `__preview-head`, `__preview-title` y `__preview-facts`, y en las opciones `__lead`, `__code`, `__main`, `__label` y `__mark` (las filas de acción conservan `__lead`, `__main` y `__label`); en su lugar va una `g-summary` (clases en `summary.md`). Lista completa en «Fichas con `GSummary`».

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
9. `type` en `$attrs`; slots `append` o `action`; slot `preview` con `appearance="field"`.
10. Dentro de un `GInputGroup` (no admitido en v0.1).
11. `limit` < 1, `delay` < 0 o `minChars` < 0 (además del validador: se usa el valor por defecto).

---

## Fase 2 · Selección múltiple (`multiple`) (#417 a #428)

**Origen:** kiwi `design/lab/combobox/r03/` (commit `a6f731f`; base funcional y conceptos A «La frase», B «La receta», C «La cesta», con los componentes reales de `dist/` y los tokens del tema por defecto; `verificar.mjs` **1077/1077** en Chromium, Firefox y WebKit; hallazgos L26 a L42) y las **decisiones del usuario del 2026-10-06** (las cuatro preguntas de la declaración). El resto deriva de APG (*Combobox* con *listbox popup*; *Listbox* de selección múltiple), WCAG 2.2 y los contratos vigentes. **Ninguna pregunta de producto abierta.**

**Alcance.** `multiple` es un **modo del mismo componente** (#338). Con `multiple`, **este apartado manda** sobre lo que el resto del contrato diga del modelo, el envío, la ficha (C de la Fase 1), el teclado, los textos y los anuncios. Lo que no se nombra aquí **sigue como en la Fase 1**: datos sin `fetch` (`filter`, `search`, `more`, pendiente, `loading`, `loadError`, «Mostrar más»), texto fantasma y aceptación con →, forma de A, superficie `GDialog`, `GSummary` en las opciones (#356), paneles anclados (#358), `--g-form-min`, `aria-required`, región viva propia, IME. **Componente complejo:** coco y bruno en Opus.

### Qué lo hace distinto (Fase 2; #417, decisión del usuario)

| | Concepto | Cómo se pide | Qué hace | Por qué sirve |
| --- | --- | --- | --- | --- |
| **A** | **La frase** (por defecto) | `multiple` (`selection="inline"`, con `appearance="field"`) | Lo elegido se escribe **en la línea del campo** como una frase de `Intl.ListFormat` («Penicilina, Látex y 3 más»), sin fichas ni ×; cede **por texto**, no con una insignia; al abrir, el grupo **«Elegidas»** va arriba. **El campo nunca crece** | Formularios densos sin saltos (Δ0 medido de 2 a 8 en una `GFormRow`); lo elegido se lee en reposo, impreso o en una captura; ningún objetivo diminuto junto a otro |
| **B** | **La receta** (opción) | `selection="list"` | La caja es solo la búsqueda; los elegidos van **debajo**, como renglones completos (`GSummary row`) en orden, numerados con `numbered`; lo agregado en la pasada dice «Nueva» y quitar deja un **rastro con «Deshacer» en el mismo sitio** | Diagnósticos, medicamentos, órdenes: cada elegido se verifica **entero**; quitar por error no mueve ni pierde nada; quien revisa ve qué cambió |
| **C** | **La cesta** | `appearance="palette"` + `multiple` | La paleta de la Fase 1 con **los resultados a un lado y la cesta de lo elegido al otro**, en el sitio de la vista previa; lo marcado **viaja** a la cesta; quitar deja rastro con «Deshacer»; en reposo, la frase de A (o la receta, con `list`) | Revisar y quitar **mientras se busca**; entre homónimos, `summaryDiff` compara en resultados y cesta: se comprueba que quedó la persona correcta |

**En los tres, quitar nunca es irreversible ni accidental** (la identidad de la base): Intro no borra lo que ya está, Retroceso sostenido no se lleva nada, quitar con Retroceso pide una segunda pulsación y todo quitar se deshace (**Ctrl/⌘+Z en los tres; rastro visible con «Deshacer» en B y C**, decisión del usuario 3). Ninguna regla añade pasos al camino normal: escribir, Intro, escribir, Intro.

**Semillas descartadas** (kiwi, `r03/brief.md`; #417): fichas con × dentro de una caja que crece (la referencia `?c=base`: la caja y lo de debajo, +168px de 2 a 8), fichas navegables con ← →, carril de fichas con desplazamiento horizontal, «+N» como única cesión, solo el recuento en el campo, borrador con «Aplicar» en la superficie y Tab que agrega. Sin reserva de nombres; se reabren solo con motivo nuevo.

### Cuándo usarlo (frontera, #428)

| Necesidad | Usar | Por qué no el otro |
| --- | --- | --- |
| Varias de hasta ~7 opciones a la vista | `GCheckboxGroup` | No hay nada que buscar: verlas todas es mejor que escribir |
| Una de una lista conocida y corta | `GSelect` | **`GSelect` no gana `multiple`** (`select.md`) |
| **Varias de un catálogo grande o del servidor**; cada una es un `value` con su etiqueta; texto libre opcional y marcado | **`GCombobox multiple`** | — |
| Etiquetas de texto **sin catálogo** (correos, palabras clave, folios): lo escrito es el valor, separadores (coma, Intro, pegar varios), validación por etiqueta | `GTagInput` (reservado, #338) | En `GCombobox multiple` pegar «penicilina, látex» es **un texto de búsqueda**, no dos valores; el texto libre es la excepción marcada y entra solo por su fila |
| Archivos | `GFileField` | Sus fichas en la caja son para archivos (#366) |
| Elegidos con prioridad que se reordena (el primero es el principal) | Fuera de esta fase (#420) | Hoy: orden de elección fijo, numerado en B |

### Props (Fase 2)

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `multiple` | Boolean | | `false` | propia (#338) |
| `modelValue` | **Array** de `value` | en el orden de elección | `[]` | compartida (#338, #420) |
| `custom` | **Array** de String | los textos libres, en el orden de elección | `[]` | propia (#338) |
| `selectedOptions` | Array | las opciones de los `value` elegidos que no están en `options` | `[]` | propia (#338) |
| `selection` | String | `inline` `list` | `inline` | propia (#426) |
| `numbered` | Boolean | | `false` | propia (#426) |
| `max` | Number | entero ≥ 1 | sin valor (sin límite) | propia (#422; el nombre de `GFileField`) |

- **`multiple`** se lee **al montar**: cambiarlo después no tiene efecto y avisa (aviso 13); para cambiar de modo, la aplicación cambia la `key`. Sin `multiple`, `selectedOptions`, `selection`, `numbered` y `max` se ignoran con aviso 15.
- **`modelValue`:** arreglo de `value` (String o Number), **nunca `null`**. `null`, `undefined` o `''` cuentan como `[]` sin aviso; cualquier otro no arreglo cuenta como `[v]` y avisa (14). Comparación `===`; un repetido se pinta y se envía una vez y avisa (14). Cada emisión es un **arreglo nuevo** (nunca se muta el de la prop). El componente no guarda copia: pinta las props (Fase 1).
- **`custom`:** arreglo de textos libres recortados y no vacíos, solo con `allowCustom` (sin ella, uno no vacío se ignora con aviso 5). Dos textos iguales sin acentos ni mayúsculas son el mismo: se pinta el primero y avisa (14). **Valores y textos libres conviven** (en la Fase 1 era uno u otro).
- **`selectedOptions`:** la forma de varios de `selectedOption`: las opciones de los `value` elegidos que la aplicación no entrega en `options` (búsqueda remota). Las que no son de `modelValue` se ignoran. `selectedOption` con `multiple` se ignora con aviso 15.
- **Valor sin opción conocida** (ni en `options`, ni recordada, ni en `selectedOptions`): **se pinta con `String(value)` como etiqueta** (frase, renglón, «Elegidas», `ID-about`), se puede quitar, **se envía** y avisa (14). Difiere de la Fase 1 (campo vacío) a propósito: entre varios, un valor invisible se enviaría sin que nadie pudiera verlo ni quitarlo (#420).
- **`selection`** (#426): dónde viven los elegidos **en reposo**. `inline` = A (la frase, en la línea del campo); `list` = B (la receta, debajo de la caja). Con `appearance="palette"` decide igual el reposo; la paleta abierta enseña siempre la cesta (C). En la hoja móvil el reposo conserva su `selection` (la receta sigue debajo de la caja).
- **`numbered`:** numera los renglones de la receta (B) y de la cesta (C) en el orden de elección, para cuando el orden significa algo (diagnósticos 1, 2, 3). Con `selection="inline"` y `appearance="field"` no hay renglones: se ignora con aviso 15.
- **`max`** (#422): ver «Tope».
- **`clearable`:** con elegidos, botón **«Quitar todas»** (`labels.clear`; mismo hueco y misma regla de nombre de la Fase 1: «Quitar todas Alergias»). Quita valores y textos libres en un gesto, lo anuncia (`clearedAll`), devuelve el foco al campo y se deshace con Ctrl/⌘+Z.
- **`allowCustom`:** la fila «Usar «texto» como texto libre» **agrega** el texto a `custom` y la lista sigue abierta. No se pinta si hay una opción a la vista con esa etiqueta (Fase 1) **ni si el texto ya está en `custom`** (sin acentos ni mayúsculas). **Salir nunca agrega**, tampoco en `field` (#418).
- **`creatable`:** como en la Fase 1 (cierra, deja el foco en el campo, emite `create(texto)`, no cambia el valor). Si la aplicación crea la opción y quiere elegirla, la añade ella a `modelValue`.
- **`required`:** `aria-required="true"` en el `<input>` visible (#334); «vacío» = sin elegidos. Valida la aplicación (#157).
- **`readonly`:** no abre; sin «Quitar», «Quitar todas», flecha ni rastros; lo elegido visible y en `ID-about`; **se envía**. **`disabled`:** sin botones; ocultos `disabled` (no se envía).
- `filter`, `loading`, `total`, `loadError`, `minChars`, `delay`, `limit`, `appearance`, `name`, `customName` y las compartidas: **como en la Fase 1**.

### Modelo, orden y envío (#420, #421)

| Estado | `modelValue` | `custom` | Ocultos `name` | Ocultos `customName` |
| --- | --- | --- | --- | --- |
| Sin elegidos | `[]` | `[]` | **ninguno** | ninguno |
| Solo valores | `['I10', 'E11.9']` | `[]` | uno por valor, en orden | ninguno |
| Valores y textos libres | `['penicilina']` | `['Polen de olivo']` | uno por valor | uno por texto, en orden |

- **Orden = orden de elección** (decisión del usuario 4): agregar pone al **final** de su arreglo; deshacer devuelve **a su posición**; marcar o desmarcar **no reordena** nada a la vista. **Sin reordenar** en esta versión (reservado, «Fuera de esta fase»).
- **No existe un orden mezclado (L29):** se conserva la forma de #338 (dos arreglos), **sin `order` ni otra prop**. Lo elegido se pinta, se lee y se envía **primero los valores en su orden y después los textos libres en el suyo**, en la frase, la receta, «Elegidas», la cesta, `ID-about` y `FormData`. Así lo que se ve es lo que se envía y lo que vuelve al recargar (el envío, con dos nombres, tampoco puede guardar el orden entre ambos). Consecuencia documentada: un valor agregado después de un texto libre se pinta **antes** que él (en la receta, el texto libre baja un renglón). Si en un producto un texto libre debe ocupar un puesto (el diagnóstico principal), la vía es `creatable`: pasa a ser opción del catálogo.
- **Envío** (#421): un `<input type="hidden">` **por valor** (`String(value)`), con el mismo `name`, en orden; **sin elegidos, ninguno** (como `<select multiple>`: `FormData` sin la clave y `getAll(name)` = `[]`). Igual con `customName` para los textos libres. `form` copiado a todos; con el campo deshabilitado, todos `disabled`; en solo lectura se envían. El `<input>` visible sigue **sin `name`**. El aviso 6 (`allowCustom` + `name` sin `customName`) sigue.
- **`GForm`:** registro por `name` (clave de `errors`), como en la Fase 1; cada gesto que cambia lo elegido llama **una vez** a `notifyChange()`.

### Eventos (Fase 2)

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | Array (nuevo) | Un gesto cambia los valores. Solo si cambian |
| `update:custom` | Array de String (nuevo) | Un gesto cambia los textos libres. Solo si cambian |
| `change` | `{ value, custom, options, added, removed }` | **Una vez por gesto**, después de los `update:*` |

- **Elemento** = la forma del `change` de la Fase 1: `{ value, custom: '', option }` para un valor (`option` `null` si no se conoce) y `{ value: null, custom: texto, option: null }` para un texto libre. **`added` y `removed`** son arreglos de elementos (como `GFileField`, #371: dicen qué cambió sin comparar arreglos). **`options`** es el arreglo de opciones alineado con `value` (`null` donde no se conoce).
- **Gestos:** marcar o desmarcar (Intro, clic), la fila de texto libre, la segunda pulsación de Retroceso, «Quitar» de un renglón, «Quitar todas» (`removed` con todo), Ctrl/⌘+Z y «Deshacer» (`added` con lo restaurado). Un cambio de `modelValue`/`custom` desde la aplicación no emite.
- `search`, `more`, `create`, `open` y `close` como en la Fase 1. Elegir no cierra, así que no emite `close`.

### Estructura accesible (Fase 2; #418)

```html
<div class="g-input … g-combobox g-combobox--appearance-field g-combobox--multiple g-combobox--selection-inline [has-chosen] [is-full] [is-open] [is-up] [is-surface]">
  <label class="g-input__label" id="ID-label" for="ID">Alergias</label>
  <div class="g-input__row"><div class="g-input__control">
    <span class="g-input__prepend" aria-hidden="true">…</span>
    <span class="g-combobox__value">                                                           <!-- slot interno field -->
      <span class="g-combobox__sentence" aria-hidden="true">                                    <!-- A: solo inline, con elegidos -->
        <span class="g-combobox__sentence-item">Penicilina</span><span class="g-combobox__sentence-sep">, </span>
        <span class="g-combobox__sentence-item is-custom">[GIcon pencil]Polen de olivo</span><span class="g-combobox__sentence-sep"> y </span>
        <span class="g-combobox__sentence-rest"><span class="g-combobox__num">3</span> más</span>
      </span>
      <input class="g-input__field g-combobox__field" id="ID" type="text" role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
             aria-expanded="true" aria-controls="ID-list" aria-activedescendant="ID-opt-c0" aria-describedby="ID-about ID-hint ID-message" …>
      <span class="g-combobox__ghost" aria-hidden="true">…</span>
      <span class="g-combobox__about" id="ID-about">5 seleccionadas: Penicilina, Látex, Ibuprofeno, Sulfonamidas y Polen de olivo (texto libre)</span>
      <input type="hidden" name="alergias" value="penicilina"> …                                <!-- uno por valor; ninguno sin elegidos -->
      <input type="hidden" name="alergias_libre" value="Polen de olivo">                         <!-- uno por texto libre, con customName -->
    </span>
    <button type="button" class="g-combobox__clear" aria-labelledby="ID-clear-text ID-label"><span class="g-combobox__clear-text" id="ID-clear-text">Quitar todas</span>[GIcon x]</button>
    <span class="g-combobox__arrow" aria-hidden="true">…</span>
  </div></div>
  <div class="g-input__support"> ayuda · región g-input__message
    <div class="g-combobox__chosen">                                                         <!-- B: selection="list", slot interno below de GInput (N5) -->
      <ul class="g-combobox__rows" id="ID-rows" aria-labelledby="ID-label">
        <li class="g-combobox__row [is-fresh] [is-armed] [is-custom] [is-entering]">
          <span class="g-combobox__row-number">1</span>                                         <!-- con numbered; se lee -->
          <span class="g-summary g-summary--layout-row …">…</span>                              <!-- slot chosen -->
          <span class="g-combobox__row-fresh">Nueva</span>
          <button type="button" class="g-combobox__remove" aria-label="Quitar E11.9 Diabetes mellitus tipo 2">[GIcon x]</button>
        </li>
        <li class="g-combobox__row is-trace">
          <span class="g-combobox__trace" id="ID-trace-1">I10 Hipertensión esencial quitada</span>
          <button type="button" class="g-combobox__undo" aria-describedby="ID-trace-1">[GIcon undo-2]Deshacer</button>
        </li>
      </ul>
      <button type="button" class="g-combobox__rows-all" aria-expanded="false" aria-controls="ID-rows">[GIcon chevron-down]Ver los 8</button>
    </div>
  </div>
  <div class="g-combobox__live" role="status" aria-live="polite" aria-atomic="true"></div>
  <div class="g-combobox__popup" popover="manual">…panel…</div>                                   <!-- o la superficie -->
</div>
```

Panel con varios (común a la forma de A y a la superficie):

```html
<ul class="g-combobox__list" id="ID-list" role="listbox" aria-multiselectable="true" aria-labelledby="ID-label">
  <li role="presentation"><ul class="g-combobox__group is-chosen" role="group" aria-labelledby="ID-grp-chosen">   <!-- «Elegidas»: A y hoja, texto vacío -->
    <li class="g-combobox__group-label" id="ID-grp-chosen" role="presentation">Elegidas <span class="g-combobox__group-tally"><span class="g-combobox__num">5</span></span></li>
    <li class="g-combobox__option [is-active] [is-armed]" id="ID-opt-c0" role="option" aria-selected="true">
      <span class="g-combobox__box [is-ticking]" aria-hidden="true">[GIcon check]</span>
      <span class="g-summary g-summary--layout-row …">…</span>
    </li>
    <li class="g-combobox__option g-combobox__action g-combobox__action--all" id="ID-opt-all" role="option" aria-selected="false">…Ver las 40</li>
  </ul></li>
  <li role="presentation"><ul class="g-combobox__group" role="group" aria-labelledby="ID-grp-0">…
    <li class="g-combobox__option" id="ID-opt-3" role="option" aria-selected="false" [aria-disabled="true"]>…</li>   <!-- con el tope: no elegible, recorrible -->
  </ul></li>
  …filas de acción de la Fase 1 (aria-selected="false")…
</ul>
```

- **`aria-multiselectable="true"`** en el `listbox`; **todas** las opciones con `aria-selected` **explícito** (`"true"`/`"false"`). **No `aria-checked`**: APG admite uno u otro, nunca los dos; `aria-selected` es el de la Fase 1 y el mejor soportado con `aria-activedescendant`.
- **Casilla** `g-combobox__box` al inicio de cada opción: forma de control, como `GCheckbox`, con la marca `check` del `GLibIcon`; **decorativa** (`aria-hidden`). Es la señal no cromática de «aquí se eligen varias» y del estado. Con `multiple` no se pinta el `g-combobox__check` del final.
- **Selección y opción activa son independientes:** mover la activa (flechas, puntero) nunca cambia la selección (APG, la selección no sigue al foco).
- **El `<input>` contiene siempre el texto de búsqueda**, nunca la etiqueta de un elegido: con `multiple` no hay ficha (`is-token`), ni llegada de la ficha al campo, ni slot `value` (aviso 15).
- **`ID-about`** (#423), solo con elegidos y primero en `aria-describedby`: `labels.about` con `{count}` y `{list}`; `list` = `Intl.ListFormat(lang, { type: 'conjunction' })` de los **nombres** de lo elegido, en el orden pintado, con `lang` el del ancestro más cercano (como las cifras de la Fase 1, sin prop `locale`). **Nombre de un elemento:** `code` + espacio + `label` si tiene `code`; si no, `label`; un texto libre, `labels.customItem` con `{text}`. Sin tope de longitud en v1 (40 elegidas son 40 nombres): se revisa con lector real.
- La frase (A) es `aria-hidden` (la dice `ID-about`). La receta (B) y la cesta (C) son **listas con nombre** (la etiqueta del campo; la cesta, su título) con botones reales.
- **«Quitar»** de un renglón: `aria-label` = `labels.remove` con `{label}` = el nombre del elemento; icono `x`; objetivo ≥ 24px (44px con `pointer: coarse`), aislado al final del renglón. **«Deshacer»** de un rastro: texto visible `labels.undo` con icono `undo-2` decorativo y `aria-describedby` = el texto del rastro.
- Los ids de las filas de «Elegidas» son propios (`ID-opt-c{n}`): la elegida que está en la instantánea **no se repite** en los grupos del catálogo de debajo.

### Teclado (Fase 2; #418, #419)

| Tecla | Lista cerrada | Lista abierta |
| --- | --- | --- |
| Carácter | Abre y busca | Busca |
| ↓ / ↑ | **`field`:** abre y activa la primera / la última fila. **Superficie** (paleta y hoja): abre **sin fila activa**, como en la Fase 1 (regla de «La superficie»: en el disparador, abrir no elige ni mueve); la siguiente ↓ / ↑ activa la primera / la última | Siguiente / anterior; no cicla; salta las deshabilitadas **del catálogo**; las no elegibles **por el tope sí se recorren** |
| Alt+↓ / Alt+↑ | Como la Fase 1 | Alt+↑ cierra |
| Av Pág / Re Pág | — | Diez adelante / atrás |
| → | Edición | Con texto fantasma y el cursor al final: acepta el texto **sin elegir** (Fase 1) |
| **Intro** | Nativo (envío implícito, como `GInput`) | **Alterna** la activa (marca o desmarca) y **la lista sigue abierta** con el texto **seleccionado**; sobre una fila de acción, la ejecuta. Excepciones de seguridad abajo |
| Esc | Con texto: lo vacía (sin propagar). Si no, nativo | Cierra y conserva el texto (`stopPropagation`: no cierra un `GDialog` anfitrión) |
| Tab | Sale (descarta el texto) | Cierra y sale. **Nunca elige** |
| **Retroceso** | Con texto, edita. **Campo vacío: en dos tiempos** | Igual |
| **Ctrl/⌘+Z** | Si lo último fue quitar, lo devuelve; si no, el deshacer nativo del texto | Igual |
| Espacio | Escribe un espacio (es un campo de texto: no marca) | Igual |

- **Intro alterna y la lista se queda** (decisión del usuario 2): tras marcar o desmarcar, los resultados siguen a la vista, la activa no se mueve y **el texto buscado queda seleccionado**: lo siguiente que se teclea lo reemplaza, y se pueden marcar varias del mismo resultado («amoxi» → dos presentaciones). Marcar o desmarcar **no reordena** (#358, regla 4); el orden se rehace al abrir y al cambiar el texto. El clic en una fila alterna igual.
- **Seguridad (#333 llevado a varios):**
  - **Intro sobre una opción ya elegida que quedó activa sola** (resaltado automático al escribir) **no la quita**: anuncia `labels.already` y selecciona el texto. Desmarcar con Intro exige haberla activado la persona (flechas, puntero o →). Sigue la regla de la Fase 1: con la activa puesta sola y búsqueda pendiente, Intro no hace nada.
  - **Tab nunca elige.** Con `multiple` no hay excepción del texto fantasma: Intro es la tecla de agregar y Tab es salir.
  - **Salir descarta** el texto a medio escribir (blur, Tab, `pointerdown` fuera): nunca se agrega al pasar, tampoco con `allowCustom`.
- **Retroceso en dos tiempos** (con el campo vacío; también en el campo de búsqueda de la superficie): la primera pulsación **marca** el último elegido (el último en el orden pintado) con `is-armed` donde se pinte (elemento de la frase, renglón de la receta o de la cesta, fila de «Elegidas»; si estaba cedido en «y N más» o pasado el tope de renglones, se saca a la vista) y anuncia `labels.armed`; la segunda lo quita (un gesto, con `change`). **Desarman:** cualquier otra tecla, el puntero, salir del campo, cerrar la superficie o un cambio del modelo. **Con `event.repeat` (Retroceso sostenido para borrar la búsqueda) ni marca ni quita.**
- **Ctrl/⌘+Z** (#419; en el campo y en el de búsqueda): si lo último que cambió lo elegido **en este campo** fue **quitar** (desmarcar, Retroceso, «Quitar», «Quitar todas»), lo devuelve **a su posición**, anuncia `restored` (o `restoredAll`) y hace `preventDefault`. **Un nivel.** El deshacer **caduca** al escribir en el campo, con cualquier otro gesto que cambie lo elegido o si la aplicación cambia `modelValue`/`custom`; caducado, Ctrl/⌘+Z es el deshacer nativo del texto. Si lo restaurado no cabe en `max` (la aplicación lo bajó), no restaura nada y anuncia `max`. Ctrl/⌘+Mayús+Z no se intercepta. Ninguna tecla actúa durante la composición IME (`isComposing`).
- **En la superficie:** la tabla de «Lista abierta» sobre el campo de búsqueda; Tab se mueve dentro del diálogo (campo → botones de la cesta → «Listo» → cierre, en el orden del DOM de `GDialog`) y nunca elige; Esc cierra la superficie (un nivel), conservando lo elegido.

### Tope (`max`, #422)

- **Lleno** cuando `modelValue.length + custom.length ≥ max`: la raíz lleva `is-full`; las opciones **no elegidas** llevan `aria-disabled="true"` **pero se recorren** con flechas (las deshabilitadas del catálogo se siguen saltando): se leen y se sabe por qué; Intro o clic sobre una no cambian nada y anuncian `labels.max`; la fila de texto libre lleva `aria-disabled="true"`; las elegidas siguen activas para desmarcar; «Agregar…» (`create`) sigue (no cambia el valor). Precedente: el tope de `GFileField` (#366).
- **Estado** `g-combobox__status--max` (`labels.max`, icono `triangle-alert`) en el panel, fuera del `listbox`. Orden de los estados (a lo sumo uno, Fase 1): error de carga › **tope** › pista de mínimo › nada si hay opciones › «Buscando…» › «Sin resultados».
- Recuento con tope: `labels.ofMax` («3 de 3») en «Elegidas», en la cesta y en el pie de la superficie.
- Un `modelValue` que llega con más elegidos que `max` se pinta y se envía **entero** (no se recorta), con `is-full` y aviso 16. Grana no valida (#157): `max` es un límite del control, como `maxlength`.

### A · La frase (`selection="inline"`, #425)

- **`g-combobox__sentence`** (`aria-hidden`) en la celda, antes del `<input>`: las partes de `Intl.ListFormat#formatToParts` (`type: 'conjunction'`, `lang` del ancestro); cada `element` es un **`__sentence-item`** y cada `literal` un **`__sentence-sep`**. **Elemento:** el `code` de la opción si lo tiene (así se escriben los diagnósticos: «E11.9, I10 y J45.9»); si no, `label`; un texto libre, su texto con `is-custom` (cursiva de coco) y el icono `pencil` decorativo.
- **Cede por el final y por texto**, no con una insignia: cuando no caben todos, el último elemento de la lista formateada es **`labels.rest`** con `{count}` («3 más»), en **`__sentence-rest`** con la cifra en `__num`: «Penicilina, Látex y 3 más». Si ni el primero cabe, el primero se recorta con elipsis y «y N más» se conserva. **Medida por lotes** como `GSummary` (#352; sin consultas de contenedor): una lectura del ancho de la frase y una escritura por cuadro; se rehace con `ResizeObserver`, al cambiar lo elegido o el `lang` y en `document.fonts.ready`.
- **Con el foco** la frase cede sitio al texto que se escribe y se apaga a `text-muted`; la proporción la fija coco (el prototipo da a la frase el 55 % de la celda; `estilo.md`) y la medida usa el ancho real. Sin elegidos, la celda es toda del `<input>` (y del `placeholder`).
- **La caja mide siempre lo mismo** (Δ0 de 0 a N elegidos; medido por kiwi de 2 a 8 en una `GFormRow`, caja, vecinas y línea de debajo).
- **Grupo «Elegidas»** (A en `field`, y la hoja móvil en los tres): al abrir con el texto vacío, y cada vez que el texto vuelve a quedar vacío con la lista abierta, es el **primer grupo**: `role="group"` con nombre `labels.chosen` y su recuento (`__group-tally`, cifra en `__num`; con `max`, `ofMax`). Es una **instantánea** de lo elegido en ese momento, en orden: desmarcar deja la fila en su sitio, sin marca, hasta cerrar o escribir; lo que se marca mientras tanto se marca donde está. Con texto escrito no hay «Elegidas»: las elegidas salen marcadas en su sitio del catálogo.
- **Tope de 12** filas en «Elegidas» (constante de diseño de JS, como las 10 de Av Pág; no es tema): con más, una fila de acción **«Ver las N»** (`labels.showAll`, `{count}`; icono `chevron-down`; `g-combobox__action--all`) **al final del propio grupo** (única fila de acción dentro de un grupo); ejecutarla pinta el resto y deja activa la fila 13.

### B · La receta (`selection="list"`, #426)

- **Hueco:** el **slot interno `below` de `GInput`** (N5, `input.md`): se pinta al final de `g-input__support`, después de la región del mensaje, y por tanto **en la tercera pista** de una `GFormRow` (la raíz sigue con tres hijos en flujo, C10). La receta **no** va en la ayuda: sería descripción del campo, con botones dentro.
- **La caja es solo la búsqueda** (el `placeholder` del consumidor, p. ej. «Agregar…»); sin frase.
- **`g-combobox__chosen` → `ul.g-combobox__rows`** (nombre por `aria-labelledby` = `ID-label`) → un **`li.g-combobox__row`** por elemento, en orden: `__row-number` (con `numbered`; **se lee**, es contenido; cuenta solo los renglones vivos) · `GSummary` `layout="row"` `:lines="2"` `size="md"` (o el slot `chosen`; mismas props que la opción, sin `highlight`; `diff` = `summaryDiff` sobre los renglones pintados) · `__row-fresh` · botón `__remove`.
- **«Nueva»** (`labels.fresh`, texto que se lee, más la barra de acento de coco) en lo agregado **en la pasada actual**.
- **Quitar no cierra el hueco:** el renglón pasa a **rastro** (`is-trace`) del **mismo alto**: `__trace` (`labels.trace` con `{label}`, tachado) y el botón **«Deshacer»** `__undo`; **el foco pasa a «Deshacer», en el mismo sitio**. «Deshacer» devuelve el elemento a su posición (si cabe en `max`; si no, anuncia `max`), retira el rastro y deja el foco en su «Quitar». «Quitar todas» convierte todos los renglones en rastros (el foco vuelve al campo).
- **Pasada** (#419): una pasada nueva empieza cuando la persona, **después de haber salido del componente, vuelve a escribir en el campo** (el primer `input`). Entonces los rastros se pliegan (`is-leaving`) y se retiran las marcas «Nueva». **Salir no pliega nada** (la línea a la que salta no se mueve bajo su atención). Un cambio de `modelValue`/`custom` que el componente no emitió (la aplicación reinicia el formulario) retira rastros y marcas, sin animación.
- **Tope de 6** renglones en reposo (constante de diseño de JS): los seis primeros en orden **más** los nuevos, los rastros y el marcado por Retroceso, que se ven siempre. Si quedan más, el botón **«Ver los N»** (`labels.showAll`; icono `chevron-down`; `__rows-all`) con `aria-expanded` y `aria-controls`, que pasa a «Ver menos» (`labels.showLess`; el mismo icono, girado por coco).
- **Mientras la lista está abierta, la forma de A tapa la receta** (límite aceptado): lo nuevo se ve al cerrar, con «Nueva». En `field` no hay grupo «Elegidas» (lo elegido está en la receta; al escribir, marcado en su sitio).
- **Crece:** lo de debajo baja un renglón por elección (kiwi: 196px de 2 a 8, con el tope de 6). Es su promesa, y la razón de que no sea el valor por defecto.

### C · La cesta (`appearance="palette"` + `multiple`, #424)

- La superficie de la Fase 1 (`GDialog`) con su campo de búsqueda; en el cuerpo, **los resultados a un lado y la cesta al otro, en el sitio de la vista previa** (`has-basket` en `g-combobox__surface-body`). **Con `multiple` la vista previa no se pinta** (el slot `preview` se ignora con aviso 15); la regla de #335 se cumple por la fila, que ya lleva el dato que distingue y la marca de `summaryDiff`. **Descartada** la vista previa compacta encima de la cesta: dos zonas compitiendo por el mismo lado y más coste de pintado (L41).
- **`section.g-combobox__basket`** (`aria-labelledby` → **`h3.g-combobox__basket-title`** = `labels.chosen` y `__basket-tally` con `selected` u `ofMax`); vacía, **`__basket-empty`** (`labels.basketEmpty`). Renglones **como los de B** (`numbered`, «Quitar», rastro con «Deshacer» y el foco en él), **sin «Nueva»**; los rastros duran **hasta cerrar** la superficie; tope de **12** con el botón «Ver las N» / «Ver menos» (`__rows-all`, como en B).
- **Homónimos:** `summaryDiff` sobre los renglones de la cesta, además de en los resultados.
- En la hoja móvil la cesta no cabe: la hoja común.

### Superficie y hoja móvil (#424)

- **Elegir no cierra** (paleta y hoja). Pie **`g-combobox__foot`**: el recuento (`__foot-tally`, `selected` u `ofMax`, texto visible) y **«Listo»** (`labels.done`): un `GBtn` con sus valores por defecto y el `size` del campo. **Esc, el fondo, el cierre y «Listo» cierran conservando** lo elegido: **no hay borrador** (el modelo cambia en cada gesto, como en `field`; el error se cubre con deshacer). El foco vuelve al campo (Fase 1). La primera tecla abre y no se pierde (Fase 1).
- **Hoja móvil (visor ≤ 520px), la misma para A, B y C:** búsqueda, lista con **«Elegidas» arriba** (el mecanismo de A) y el pie. Opciones ≥ 44px; sin desbordamiento a 375 ni a 320px.
- Los anuncios van a la región viva **de dentro** de la superficie.

### Anuncios (Fase 2; #423)

| Suceso | Texto |
| --- | --- |
| Agregar (Intro, clic, fila de texto libre) | `added` (`{label}` = el nombre del elemento, `{count}` = elegidos después) |
| Quitar (desmarcar, Retroceso, «Quitar») | `removed` |
| Deshacer de uno (Ctrl/⌘+Z o «Deshacer») | `restored` |
| «Quitar todas» · su deshacer | `clearedAll` · `restoredAll` (`{count}` = cuántos) |
| Primera pulsación de Retroceso | `armed` |
| Intro sobre una elegida resaltada sola | `already` |
| Intento con el tope alcanzado | `max` |

- **Se anuncia también al marcar dentro de la lista:** `aria-selected` cambia, pero con `aria-activedescendant` no todos los lectores lo dicen, y el recuento no lo da nadie más (puede duplicarse con algún lector: «No verificado»).
- Los de un gesto se anuncian **en el acto** (los 600 ms de la Fase 1 son para no pisar el eco de escritura en los recuentos de resultados, que siguen igual); un anuncio por gesto. No se anuncian abrir, cerrar, «Ver las N» ni el pliegue de los rastros.

### Textos nuevos (`labels`, sin valores por defecto; #423)

Mismas reglas de la Fase 1 (`fill`, cifras con `Intl.NumberFormat` del `lang`). Los contados admiten String con marcadores **o Function** (plural y género los pone la aplicación: «seleccionadas», «diagnósticos», «Ver los 8» frente a «Ver las 40»).

| Clave | Marcadores / firma | Dónde | Si falta |
| --- | --- | --- | --- |
| `selected` | `{count}` · `(count) => String` | Recuento: pie de la superficie y título de la cesta («3 seleccionadas») | Sin recuento; aviso al montar con `multiple` |
| `about` | `{count}`, `{list}` · `(count, list) => String` | `ID-about` («3 seleccionadas: Penicilina, Látex y Sulfonamidas») | `ID-about` = solo la lista; aviso |
| `customItem` | `{text}` | Nombre de un texto libre en `ID-about` y en los anuncios («Polen de olivo (texto libre)») | El texto solo; aviso con `allowCustom` |
| `added`, `removed`, `restored` | `{label}`, `{count}` · `(label, count) => String` | Anuncios | Sin ese anuncio; aviso al necesitarse |
| `clearedAll`, `restoredAll` | `{count}` · `(count) => String` | Anuncios de «Quitar todas» y de su deshacer | Ídem |
| `armed` | `{label}` | Anuncio de la primera pulsación de Retroceso | Ídem |
| `already` | `{label}` | Intro sobre una elegida resaltada sola | Ídem |
| `max` | `{max}` · `(max) => String` | Estado del tope y su anuncio | Estado sin texto; aviso con `max` |
| `ofMax` | `{count}`, `{max}` · `(count, max) => String` | Recuento con tope («3 de 3») | Usa `selected`; aviso con `max` |
| `chosen` | | Nombre del grupo «Elegidas» y título de la cesta | Grupo y cesta sin nombre visible; aviso al montar con `multiple` |
| `rest` | `{count}` · `(count) => String` | Último elemento de la frase cedida («3 más») | La frase se recorta con elipsis sin decir cuántas faltan; aviso con `selection="inline"` |
| `showAll` | `{count}` · `(count) => String` | «Ver las 40» («Elegidas», cesta) · «Ver los 8» (receta) | Sin fila ni botón: se pinta todo, sin tope; aviso al necesitarse |
| `showLess` | | «Ver menos» de la receta y de la cesta | Desplegada, no se vuelve a plegar; aviso al necesitarse |
| `done` | | «Listo» del pie de la superficie | Sin botón (cierran Esc, el fondo y el cierre); aviso al montar con `multiple` (la superficie existe siempre en móvil) |
| `remove` | `{label}` | Nombre de «Quitar» de un renglón (#338) | Sin «Quitar» (se quita desde la lista o con Retroceso); aviso con renglones |
| `undo` | | «Deshacer» del rastro | Sin rastro: quitar retira el renglón (Ctrl/⌘+Z sigue); aviso con renglones |
| `trace` | `{label}` | Texto del rastro («Diabetes mellitus tipo 2 quitada») | Ídem |
| `fresh` | | Marca «Nueva» de la receta | Solo la barra; aviso con `selection="list"` |
| `basketEmpty` | | Cesta vacía | Vacía, sin texto; aviso con `appearance="palette"` |
| `clear` (Fase 1) | | Con `multiple`, el texto de «Quitar todas» | Como en la Fase 1 |

### Movimiento (Fase 2; #427)

| Pieza | Qué | Duración y curva |
| --- | --- | --- |
| **Cifras que ruedan** | La cifra (`__num`) de «y N más», de «Elegidas», de la cesta y del pie, cuando el recuento cambia **por un gesto**: bruno pone **`is-rolling`**, coco anima con keyframes **`g-combobox-roll…`** (la cifra nueva entra desde abajo) y bruno la retira en `animationend`/`animationcancel` de ese prefijo, o en el acto sin animación calculada (patrón de #313) | `--g-duration-press` + `--g-ease-out`, como `g-number-roll` de `GNumberField` (#313); **no** el muelle del prototipo |
| **La casilla salta** | La marca `check` de `__box` al **marcar** por un gesto: bruno pone **`is-ticking`**, keyframes **`g-combobox-tick…`**, escala desde **0,4** (constante de §29.6), retirada como arriba. Desmarcar: la marca se funde | `--g-duration-slow` + **`--g-ease-bounce`** dentro de `@supports`; fuera, `--g-ease-out`. **Segundo uso aprobado del rebote** (§29.1). El fundido, `--g-duration-fast` |
| **B · el renglón nuevo** | `is-entering`: crece desde la línea anterior (`grid-template-rows` 0fr → 1fr, keyframes `g-combobox-row…`), retirada como arriba | `--g-duration-slow` + `--g-ease-out` |
| **B · el rastro** | Aparece con un fundido; al plegarse en la pasada siguiente (`is-leaving`) encoge como crece el nuevo y bruno retira el nodo en `animationend` o en el acto | Fundido `--g-duration-fast`; pliegue `--g-duration-slow` + `--g-ease-out` |
| **C · lo marcado viaja a la cesta** | El renglón nuevo de la cesta llega desde la fila marcada: bruno escribe `--_travel-x`/`--_travel-y` (px) y pone `is-arriving` en `g-combobox__row`; keyframes `g-combobox-arrive…` (los de la ficha de la Fase 1) | `--g-duration-slow` + `--g-ease-spring` dentro de `@supports`: **el mismo uso de #336** (algo elegido que llega), no uno nuevo |
| Despliegue de A, entrada de la paleta | Sin cambios (Fase 1) | |

- **Solo tras un gesto:** nada se anima al montar, al abrir, al cambiar el texto ni cuando la aplicación cambia el modelo (#336; medido por kiwi).
- **Movimiento reducido** (§29.3): nada se desplaza, crece ni escala; los fundidos de color y opacidad se quedan; las clases se retiran en el acto.
- Marcar no reordena ni mueve nada bajo el puntero (#358, regla 4).

### Tokens (Fase 2; #427)

**Ningún token nuevo** (`tokens.md` §32). Además de los de la Fase 1:

| Token | Para qué |
| --- | --- |
| `--g-color-border-control`; `--g-color-primary` / `--g-color-on-primary`; `--g-color-text`; `--g-color-surface` | Casilla (borde ≥ 3:1; kiwi midió 3.45:1). **Marcada** (enmiendas #429 y #430): relleno **`primary`** y marca **`on-primary`**, los mismos tokens que la casilla marcada de `GCheckbox` con su `color` por defecto (`tokens.md` §17.2: los componentes no leen `brand`), y **contorno `primary-text`** (regla general de `tokens.md` §7.1, #431 y #432; antes `text`, #429) (`surface` en la opción activa invertida de la paleta); `primary` solo como forma da 1,77 en lustre y 1,92 en spotify (medido con `brand`, que es su valor sin clave `primary`) |
| `--g-color-selection` | Elemento o renglón marcado para quitar (con tachado: no solo color) |
| `--g-color-accent-soft` / `--g-color-on-accent-soft`; `--g-color-accent-text` | «Nueva» (5:1) y su barra en **`accent-text`** (enmienda #429: `accent` como trazo da 1,29 en spotify, 2,14 en amazon y 2,64 en stripe, #228; con `accent-text`, 4,52 mínimo) |
| `--g-color-warning-soft` / `--g-color-on-warning-soft` | Estado del tope (enmienda #429: `warning-text` sobre `warning-soft` da 4,15:1 en el tema por defecto oscuro; el par del tinte llega a 4,66 mínimo) |
| `--g-color-accent-soft` / `--g-color-on-accent-soft` (al pasar `--g-color-accent` / `--g-color-on-accent`) | «Deshacer»: **píldora** (enmienda #429: `accent-text` sobre `surface-sunken` da 4,19 a 4,32 en siete temas claros; el par del tinte, 4,51 mínimo) |
| `--g-color-text` | «Ver las N» y «Ver los N» con peso de acción (como «Mostrar más»; `accent-text` no está garantizado sobre `surface-sunken`, la cesta) |
| `--g-color-text-muted` | Frase con el foco, número, rastro, recuentos |
| `--g-color-border` | Separación entre renglones y contorno de la receta y la cesta |
| `--g-ease-bounce`, `--g-ease-spring`, `--g-ease-out`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow` | «Movimiento» |

**No son tokens:** **12** (filas de «Elegidas» y de la cesta antes de «Ver las N») y **6** (renglones de la receta en reposo), constantes de diseño de JS; **`0.4`**, escala de partida de la marca de la casilla (`tokens.md` §29.6, #427); la proporción frase/texto con el foco (coco, `estilo.md`); `--_travel-x`/`--_travel-y` (ya en §32).

### Clases y datos (Fase 2; contrato bruno ↔ coco)

| Clase / dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-combobox--multiple`, `g-combobox--selection-{inline\|list}` | Raíz | Con `multiple` |
| `has-chosen`, `is-full` | Raíz | Con elegidos; tope alcanzado |
| `g-combobox__sentence`, `__sentence-item` (`is-custom`, `is-armed`), `__sentence-sep`, `__sentence-rest`, `__sentence-icon` | Frase (A) | `selection="inline"` con elegidos |
| `g-combobox__num`, `is-rolling` | Cifra de un recuento | Siempre; `is-rolling` mientras rueda |
| `g-combobox__box`, `is-ticking` | Casilla de una opción | Cada opción con `multiple`; `is-ticking` mientras salta |
| `g-combobox__group.is-chosen`, `__group-tally` | Grupo «Elegidas» | A y hoja, texto vacío |
| `g-combobox__action--all` | «Ver las N» de «Elegidas» | Más de 12 |
| `g-combobox__option.is-armed` | Fila de «Elegidas» marcada para quitar | Retroceso |
| `g-combobox__status--max` | Estado del tope | `is-full` con el panel abierto |
| `g-combobox__chosen`, `__rows`, `__rows-all` | Receta (B) y su «Ver los N» | `selection="list"` con elegidos o rastros |
| `g-combobox__row` (`is-fresh`, `is-trace`, `is-armed`, `is-custom`, `is-entering`, `is-leaving`, `is-arriving` + `--_travel-x`, `--_travel-y`; en el rastro, **`--_row-h`**) | Renglón (B y C) | Por elemento |
| `g-combobox__row-number`, `__row-fresh`, `__remove`, `__trace`, `__undo` | Partes del renglón | Con `numbered`; nuevo; editable; rastro |
| `g-combobox__surface-body.has-basket`, `g-combobox__basket`, `__basket-title`, `__basket-tally`, `__basket-empty` | Cesta (C) | `palette` con `multiple`, por encima de 520px |
| `g-combobox__foot`, `__foot-tally`, `__done` | Pie de la superficie («Listo» es un `GBtn` con esa clase) | Superficie con `multiple` |

**`--_row-h`** (dato del `.vue`, px; #429): al convertir un renglón en rastro, bruno escribe en línea el **alto medido del renglón** (antes de cambiar el contenido, fuera del render) y el CSS lo usa como `min-block-size` del rastro, de modo que el rastro tenga el mismo alto (Δ0) aunque el slot `chosen` mida más de dos líneas. Se retira con el rastro; sin medida (sin layout) no se escribe. Es una variable en línea de §29.5, no un token.

Las opciones elegidas, deshabilitadas o no elegibles por el tope se estilizan con `aria-selected` y `aria-disabled` (como en la Fase 1).

**Para coco** (`GCombobox.css`; nada en `GInput.css` ni en `GSummary.css`):

- **Casilla:** forma de control como `GCheckbox` (mismo radio y tamaño relativo), borde `border-control` ≥ 3:1, marcada relleno `primary`, marca `on-primary` (los de `GCheckbox`, #430) y contorno `primary-text` (`surface` en la activa invertida de la paleta; #429, enmendado por #432: un solo contorno para todo control marcado, `tokens.md` §7.1).
- **Frase (A):** una línea, sin saltos ni alto nuevo (Δ0); elipsis del primero; `__sentence-rest` con peso de acción; libres en cursiva con `pencil`; con el foco, la proporción frase/texto (anotarla en `estilo.md`) y `text-muted`; **marcada para quitar: tachado + `selection`** (no solo color).
- **Receta (B):** en la tercera pista de `GFormRow` sin romper el *subgrid*; renglones con `GSummary row` de dos líneas, número, «Nueva» (par `accent-soft` + barra `accent-text` al inicio, reflejada en RTL), «Quitar» ≥ 24px / 44px aislado al final; **rastro del mismo alto** que el renglón (Δ0, medir), tachado en `text-muted` (alto = `--_row-h`), «Deshacer» como píldora `accent-soft`/`on-accent-soft` (al pasar `accent`/`on-accent`); «Ver los N» en `text` con peso de acción, con el chevron girado al desplegar.
- **Cesta (C):** en el sitio de la vista previa, con su proporción; pie con recuento y «Listo»; estado del tope con el par `warning-soft`/`on-warning-soft`.
- **Movimiento** de la tabla, con `prefers-reduced-motion` (§29.3) y `@supports` para las dos curvas.
- **`forced-colors`** (L42, **sin medir por kiwi: medir**): casilla con `CanvasText` y marcada con `Highlight`; marca de Retroceso conserva el tachado; rastro y «Nueva» por su texto; recuentos legibles.
- **Medir** en el tema por defecto, en el oscuro y en uno distinto: casilla, «Nueva», barra, tope, rastro, «Deshacer», frase con foco, recuentos.

### En una `GFormRow` (Fase 2)

- **A y C:** la caja no cambia de alto (Δ0 de 2 a 8, medido); comparte fila como en la Fase 1 (`--g-form-min: 60` sigue).
- **B:** caja y etiqueta no se mueven; la receta crece en la **tercera pista** (la del pie) y lo de debajo baja. En una fila estrecha la receta ocupa la columna del campo: el consumidor sube `--g-form-min` o da al campo su propia fila (README).

### Rendimiento (#428)

- **Compuerta:** abrir con **500 opciones locales y 40 elegidas**, hasta el segundo cuadro, **< 150 ms en Chromium y Firefox y < 200 ms en WebKit**, con «Elegidas» (A) y con la cesta (C), con un solo worker (`--workers=1`, como #264). La mide bruno sobre el componente real; la del prototipo es orientativa (WebKit 133 a 187 ms en A con el prototipo compilando plantillas en el navegador).
- Los topes de 12 y 6 existen también por esto (WebKit sin tope, 91 filas: 165 a 284 ms en el prototipo). La frase se mide por lotes, nunca por elemento.

### Paquete (#428)

- **Sigue en `@grana/vue/combobox`** (un modo del mismo componente, una entrada); `@grana/vue` no cambia. **La entrada crecerá:** la Fase 1 mide 13,6 KB gzip; la Fase 2 (frase con su medida, renglones con rastro y pasada, deshacer, tope, «Elegidas», cesta, anuncios) se estima en **+4 a +7 KB gzip** (≈ 18 a 21 KB), que también paga quien use solo una opción. Bruno mide y lo anota en `GCombobox.meta.json`; **si el incremento supera 8 KB gzip** (el tope de #328), vuelve a lima antes de cerrar (alternativa prevista: llevar el modo a una entrada `@grana/vue/combobox-multiple` que lo active).
- `GBtn` («Listo») llega por `__shared` sin copia (bruno lo añade a `src/shared.js` si falta). **Compuertas nuevas:** `grep -q "g-combobox__sentence" packages/vue/dist/grana.css` y `grep -q "g-combobox__trace" packages/vue/dist/grana.css`; las de #337 y #350 siguen.

### SSR y RTL (Fase 2)

- **SSR:** el servidor pinta los ocultos (uno por valor y por texto), la receta (B), la frase **completa** (sin cesión) y `ID-about`, con `Intl` **sin `locale`**; al montar se lee el `lang` del ancestro y se rehacen frase, `ID-about` y cifras, y se mide la cesión (el primer pintado del cliente coincide con el del servidor). Nada se anima.
- **RTL:** propiedades lógicas; frase y renglones empiezan en el borde de inicio (medido); casilla y barra de «Nueva» al inicio; `Intl.ListFormat` sigue el `lang`, no `dir`; los textos de los elementos con `dir="auto"` (los de `GSummary`).

### Slots (Fase 2)

| Slot | Con `multiple` |
| --- | --- |
| `option`, `lead`, `empty`, `load-error`, `label`, `hint`, `error`, `prepend` | Como en la Fase 1 (el slot `option` va **después** de la casilla, que no se sustituye) |
| **`chosen`** (nuevo) | Contenido de un renglón de la receta y de la cesta. Alcance `{ option, custom }` (`option` `null` con texto libre). Sin interactivos; **conserva el texto que distingue**. Por defecto, la `GSummary row` |
| `value` | No aplica (no hay ficha): se ignora con aviso 15 |
| `preview` | No se pinta con `appearance="palette"` (la cesta ocupa su sitio): aviso 15 |

### Avisos de desarrollo (Fase 2; siguen a los de la Fase 1)

12. Un dato de `facts` sin `label` (no se pinta, ni se busca, ni se anuncia; #356, ya existente).
13. `multiple` cambiado después de montar (sin efecto; cambiar la `key`).
14. Con `multiple`: `modelValue` o `custom` que no son arreglos (se normalizan), repetidos (se pinta y se envía uno), `value` sin opción conocida ni en `selectedOptions` (se pinta `String(value)`).
15. `selectedOption` con `multiple` o `selectedOptions` sin él; `selection`, `numbered` o `max` sin `multiple`; `numbered` sin renglones (`inline` en `field`); slot `value` con `multiple`; slot `preview` con `multiple` en `palette`; slot `chosen` sin `multiple`.
16. `max` < 1 (además del validador: sin límite) o más elegidos que `max` (se pinta y envía todo).
17. Los textos de la tabla de «Textos nuevos» que hacen falta y no están (aviso 2 ampliado): `selected`, `chosen` y `done` al montar con `multiple`; los demás, la primera vez que se necesitan.

### Verificación (Fase 2)

**Criterio de hecho:** las medidas de kiwi (`r03/verificar.mjs`: A 89, B 94 y C 93 comprobaciones por motor; la base es referencia y no se reproduce) **sobre el componente real**, más lo de abajo. Verificación por niveles (CLAUDE.md); puerto propio de Playwright por agente.

- **bruno (vitest + jsdom):** modelo (normalización, repetidos, valor desconocido pintado y enviado, `selectedOptions`, textos libres sin duplicar, orden valores → libres); `change` una vez por gesto con `added`/`removed`/`options` y orden `update:*` → `change`; envío (un oculto por valor, ninguno sin elegidos, `customName`, `form`, `disabled`, solo lectura); teclado entero (Intro alterna y la lista sigue con el texto seleccionado; Intro sobre elegida resaltada sola no la quita y anuncia; con búsqueda pendiente no hace nada; Tab nunca elige, también con fantasma único; salir descarta; Retroceso en dos tiempos, desarme y `repeat` que no quita; Ctrl/⌘+Z de un nivel, su caducidad y el tope; Espacio escribe; IME); tope (`aria-disabled` recorrible, estado, anuncio, fila de texto libre); «Elegidas» (instantánea, sin repetir, 12 y «Ver las N», activa en la 13); semántica (`aria-multiselectable`, `aria-selected` en todas, casilla `aria-hidden`, `ID-about` con `Intl.ListFormat` y `lang` del ancestro, nombres de «Quitar» y «Deshacer»); receta (N5 en `g-input__support`, rastro con el foco en «Deshacer», «Deshacer» con el foco en «Quitar», pasada, 6 y «Ver los N», `numbered`); superficie (elegir no cierra, pie con «Listo», cerrar conserva, cesta sin vista previa, región de dentro); anuncios; movimiento (clases puestas solo tras un gesto y retiradas por `animationend` o en el acto); SSR; avisos 12 a 17; **la Fase 1 sin `multiple` no cambia** (sus pruebas en verde) y `GInput` sin N5 se pinta igual (instantánea).
- **Playwright** (`tests/combobox-multiple.spec.mjs` y `tests/personalidad-combobox-multiple.spec.mjs`, Chromium, Firefox y WebKit): la batería de `r03/verificar.mjs` por concepto (Δ0 de A y C en la `GFormRow` de 2 a 8; B: caja Δ0 y lo de debajo baja; rastro del mismo alto; cesión de la frase con 40; «Elegidas»; cesta con homónimos; dentro de `GDialog`; 375 y 320; RTL; contraste; consola limpia), la compuerta de rendimiento y el movimiento (cifras, casilla, renglón, viaje; con `reduce`, nada se mueve y no quedan clases). `tests/form-distribution.spec.mjs` sigue pasando.
- **coco:** auditoría con un tema distinto y con el oscuro; `forced-colors` emulado con medida (L42); resultado en `design/lab/combobox/auditoria-multiple.md`.

### No verificado (entorno real, Fase 2)

Lector de pantalla (VoiceOver, NVDA, TalkBack): si `aria-selected` se anuncia al cambiar con `aria-activedescendant` (el anuncio propio puede duplicarse), `ID-about` largo con 40 elegidas, la frase `aria-hidden` junto al campo, el grupo «Elegidas», la receta y la cesta como listas con botones, el rastro descrito y el foco en «Deshacer», los dos `combobox` de la superficie; `forced-colors` real; táctil y teclado virtual sobre la hoja; IME con varios; Safari y el foco en «Deshacer»/«Listo» (WebKit no tabula a botones salvo ajuste del sistema).

### Fuera de esta fase (reservado, #428)

| Qué | Nombres y forma | Requiere |
| --- | --- | --- |
| **Reordenar** (Alt+↑/↓ y arrastre; el primero como principal) | Prop **`reorderable`** (Boolean; el nombre de `GFileField`) | Ronda propia de kiwi; con ella se decide si hace falta guardar el orden mezclado entre valores y textos libres (hoy no existe, #420) |
| Tope de longitud de `ID-about` | — | Verificación con lector real |
| `GTagInput` | Etiquetas de texto sin catálogo (#338) | Ronda propia |
| Editor de valor de `GFilterBar` con `multiple` (filtro «uno de») | — | Ronda de `GFilterBar` (#338) |
| `multiple` en `GSelect` | **No**: `GSelect` no lo gana | — |
| Semillas descartadas (fichas con ×, ← → entre fichas, carril, «+N», solo recuento, borrador con «Aplicar», Tab que agrega; vista previa compacta sobre la cesta) | Sin reserva (#417, #424) | Motivo nuevo |

---

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

### r03 (`design/lab/combobox/r03/declaracion.md`, Fase 2)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L26 | Identidad | Decisión del usuario: A por defecto (`selection="inline"`), B como `selection="list"`, C = `palette` + `multiple`; «Qué lo hace distinto» y semillas descartadas registradas | #417 |
| L27 | Semántica | `aria-multiselectable`, `aria-selected` explícito en todas (no `aria-checked`), casilla `g-combobox__box` decorativa con `check` | #418 |
| L28 | Teclado | Intro alterna y la lista sigue con el texto seleccionado (decisión del usuario 2); Intro sobre elegida resaltada sola no la quita (`already`); Tab nunca elige; Retroceso en dos tiempos sin `repeat` (`armed`); Ctrl/⌘+Z de un nivel; Espacio escribe | #418, #419 |
| L29 | Orden | Orden de elección fijo (decisión del usuario 4). **Se conserva la forma de #338** (dos arreglos, sin `order`): se pinta, lee y envía valores y después textos libres; un texto libre con puesto entra por `creatable`. Reordenar y orden mezclado, a la ronda de `reorderable` | #420 |
| L30 | Envío | Un oculto por valor en orden; ninguno sin elegidos; `customName` igual; `form` a todos | #421 |
| L31 | `change` | `{ value, custom, options, added, removed }`; elementos con la forma `{ value, custom, option }` de la Fase 1 | #421 |
| L32 | `max` | Prop `max`; no elegidas `aria-disabled` y recorribles; estado `--max` y anuncio; fila de texto libre deshabilitada; deshacer respeta el tope; más elegidos que `max`, se pinta todo y avisa | #422 |
| L33 | Textos | Tabla de «Textos nuevos». Cambios sobre la propuesta: `more` de la frase → **`rest`** (`more` ya es «Mostrar más» de la Fase 1); `tomb` → **`trace`**; se añaden `about`, `customItem` y `restoredAll`; anuncios con `{label}` y `{count}` o función | #423 |
| L34 | `ID-about` | `about` con `{count}` y `{list}`; `Intl.ListFormat` del `lang` del ancestro; nombre = `code` + `label`; libres con `customItem`; sin tope de longitud en v1 | #423 |
| L35 | Superficie | Elegir no cierra; pie con recuento y «Listo» (`GBtn`); cerrar conserva, sin borrador; región de dentro | #424 |
| L36 | A · frase | `g-combobox__sentence` con `formatToParts`; elemento = `code` o `label`; cede con `rest` medido por lotes; «Elegidas» como instantánea, sin repetir en el catálogo, tope 12 y «Ver las N» dentro del grupo | #425 |
| L37 | B · receta | **Slot interno `below` de `GInput`** (N5) al final de `g-input__support`; prop **`selection="list"`** (no `layout` ni `display`) y **`numbered`**; «Nueva», rastro con el foco en «Deshacer», pasada al volver a escribir tras salir; tope 6 y «Ver los N»; slot `chosen` | #426 |
| L38 | C · cesta | La cesta ocupa el sitio de la vista previa; la vista previa no se pinta y el slot `preview` se ignora con aviso; #335 por la fila con `summaryDiff`; descartada la vista previa compacta; rastros hasta cerrar, tope 12, viaje con el mecanismo de la ficha | #424 |
| L39 | Tokens | Ninguno nuevo. Cifras con `press` + `ease-out` (como #313, no el muelle); casilla con `--g-ease-bounce` (**segundo uso**) desde `0.4` (constante nueva de §29.6); viaje a la cesta = el uso de #336 | #427 |
| L40 | Frontera | `GCheckboxGroup` · `GCombobox multiple` · `GTagInput` (reservado); `GSelect` sin `multiple` | #428 |
| L41 | Rendimiento | 500 opciones y 40 elegidas < 150 ms (Chromium, Firefox) y < 200 ms (WebKit) con «Elegidas» y con la cesta; topes 12 y 6 | #428 |
| L42 | `forced-colors` | Encargo a coco con medida (casilla, marca de Retroceso, rastro, «Nueva») | «Para coco» de la Fase 2 |

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
| ~~Selección múltiple~~ | **Contratada** (Fase 2, #417 a #428): ver «Fase 2 · Selección múltiple». La forma de #338 se conserva y se amplía (`change` con `added`/`removed`, #421) | Hecho: ronda r03 de kiwi |
| `GTagInput` | Etiquetas de texto libre **sin catálogo** | Ronda propia |
| **Ampliar a la paleta desde `field`** | Prop **`expandable`** (Boolean), `labels.expand`, icono `maximize-2` | Ronda corta de kiwi: no deriva limpio. Una fila de acción al final queda lejos de las homónimas (hasta 50 filas); un botón en la caja pierde el texto al salir del campo; un atajo no está en APG. Hay que medir el disparador y el traspaso lista → modal con búsqueda pendiente. Hoy: `appearance="palette"` en los campos con homónimos |
| Parte de `GInputGroup` (CP + colonia) | `GInputGroupCombobox` | Medir A en una caja fusionada |
| Editor de valor de `GFilterBar` | — | Ronda de `GFilterBar`; revisar la entrada del paquete |
| `autoHighlight: false` | Prop `autoHighlight` | Solo si la verificación con lector real lo pide |
| Semillas descartadas por kiwi (r02) | Fichas navegables en rejilla 2D (APG *grid popup*); Tab que acepta siempre | Motivo nuevo |
