# Contrato · Sistema de formularios · Fase 1 (núcleo de composición)

**Dueño:** lima · **Estado:** aprobado (pendiente de CSS de coco y construcción de bruno) · **Basado en:** `design/lab/form/r01/` (kiwi; `brief.md` del usuario, `declaracion.md` con 17 puntos y 20 hallazgos en §15, `index.html`) · **Compone:** `GInput`, `GTextarea`, `GSelect`, `GCheckbox`/`GCheckboxGroup`, `GSwitch`, `GDatePicker` (leen el contexto), `GBadge`, `GBtn`, `GIcon` (interno) · **Convive con:** `dialog.md` (envío con `form="id"`), `tabs.md` y `stepper.md` (marcas por pestaña o paso; integración documentada en la Fase 4)
**Tags:** `g-form`, `g-form-section`, `g-form-grid`, `g-field-group`, `g-form-actions`, `g-error-summary` · composable `useFormField()` · **Categoría:** entradas (composición)

Una **capa de composición** sobre los campos que ya existen: decide **cómo** se reparten, agrupan, marcan, cuándo enseñan sus errores y cómo se envían, sin duplicar ningún campo. La Fase 1 cubre formularios cortos, medianos y en dialog o drawer; los largos con navegación y secciones plegables llegan en la Fase 3 (ver «Fases siguientes»). Decisiones del usuario: DECISIONS.md #153 a #155; derivadas de estándar o de contratos vigentes: #156 a #168.

**Por qué un solo contrato** (#156): las seis piezas comparten **un** contexto (`formKey`), **un** juego de textos (`labels` de `GForm`), **una** regla de momento de errores y **una** verificación; partirlas en seis archivos obligaría a repetir el contexto en cada uno y a mantenerlo sincronizado. Cada pieza tiene su sección con props, estructura, clases y avisos, como si fuera su propio contrato. Los cambios que la Fase 1 trae a los campos existentes se resumen aquí (§10) y se anotan, con su dueño, en el contrato de cada campo.

---

## Principios

- **Grana presenta y emite intención; no valida ni guarda** (AGENTS.md, #76, #78). Las reglas son de la aplicación (cualquier librería o funciones propias): `GForm` recibe `errors` (`name → mensaje`) **ya calculados** y decide **cuándo** se muestran, construye el resumen y mueve el foco. Un error del servidor entra por la misma vía.
- **Contexto opcional, sin acoplamiento.** Ningún campo importa `GForm`: leen una `InjectionKey` exportada **solo si existe**. Fuera de `GForm` cada campo funciona exactamente como hoy. **La prop explícita del campo siempre gana al contexto.**
- **Componentes donde hay semántica o comportamiento; clases donde solo hay colocación.** `form`, `section`, `fieldset`, resumen y pie son componentes; anchos, salto de fila y fila unida son clases que sirven también para campos del consumidor y no añaden DOM.
- **Una sola estructura que se adapta por su ancho propio**, nunca por el visor (#69, #73, #130). **Orden del DOM = orden de lectura = orden de Tab = orden visual** en todos los tramos (WCAG 1.3.2, 2.4.3), salvo la excepción acotada del pie apilado (#155).
- **Sin textos por defecto** (Grana es internacional): `labels` sin valores, como en el resto de la librería.
- **Sin `fetch`, sin `action`, sin navegación**: `GForm` siempre cancela el envío nativo y emite.
- **Iconos solo Lucide vía `GIcon`** (`icons.md`).

## Frontera con otros componentes

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Formulario corto (≤ ~6 campos, una idea) | `GForm` + `GFormGrid`, sin secciones ni resumen | Secciones de un campo |
| Varias ideas en una página | `GFormSection` (fija) por idea | Tarjetas por sección; acordeón para lo obligatorio |
| Una pregunta con varias partes (teléfono: país · número · ext.) | `GFieldGroup` | Varios campos sueltos sin `fieldset` |
| Preguntas distintas pero ligadas que comparten fila también en móvil (Núm. ext. · Núm. int.) | Clase `g-form-row` | `GFieldGroup` (no son una pregunta) |
| Proceso secuencial | `GStepper` con un `GForm` por paso o uno con secciones (Fase 4 documenta la integración) | Stepper si cabe en una página |
| Grupos independientes | `GTabs` con paneles montados (#78) | Tabs con dependencia secuencial |
| Formulario en dialog o drawer | `GDialog` (`inset`, `placement="end"`), pie del dialog con `form="id"` | Campos pegados a la carcasa |
| Navegación de secciones, plegables, «Agregar…», condicionales, guardado automático | Fases 3 y 4 | `GSidebar` para navegar secciones (§1.8 de kiwi) |

## Exportaciones

| Exportación | Qué es |
| --- | --- |
| `GForm`, `GFormSection`, `GFormGrid`, `GFieldGroup`, `GFormActions`, `GErrorSummary` | Componentes |
| `useFormField(options)` | Composable para campos (los de Grana y los del consumidor) |
| `formKey` | `InjectionKey` del contexto, para `provide` manual (pruebas, microfrontends) |

Bruno las registra en `src/index.js`; los estilos de las seis piezas entran en `components.css`.

---

## 1. `GForm`

`<form novalidate>` con contexto. Decide **cuándo** se ven los errores, envía, resume y mantiene el estado sucio (#157).

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `errors` | Object | `{ [name]: String }` | `{}` (función) | propia |
| `warnings` | Object | `{ [name]: String }` | `{}` (función) | propia |
| `showErrorsOn` | String | `blur` `submit` | `blur` | propia |
| `marks` | String | `optional` `required` | `optional` | propia (#153) |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `readonly` | Boolean | | `false` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `headingLevel` | Number | 2 a 6 | `3` | propia (como `GCard`, `GWidget`) |
| `dirty` | Boolean | | `false` | propia (`v-model:dirty`) |
| `labels` | Object | ver «Textos» | `{}` (función) | propia |

### Reglas de props

- **`errors`:** objeto `name → mensaje`. Cadena vacía o ausente = sin error. **Lo calcula la aplicación** (reactivo, del modelo; o tras una respuesta del servidor). `GForm` no lo modifica.
- **`warnings`:** igual que `errors` pero **no bloquea** el envío ni entra en el resumen; sigue el mismo momento de aparición que los errores. Un campo con error y advertencia muestra el error.
- **`showErrorsOn`:** momento en que un error de `errors` se hace visible (ver «Momento de los errores»). Se llama así y no `validateOn` (como proponía kiwi) porque `GForm` **no valida**: solo enseña.
- **`marks`:** convención de marcas de **todo** el formulario (#153). `optional` (por defecto): los campos no obligatorios llevan «(opcional)» (`labels.optional`) en su etiqueta y los obligatorios **no** llevan asterisco. `required`: los obligatorios llevan el asterisco (`aria-hidden`) y los opcionales nada; `GForm` pinta `labels.requiredHint` al principio del formulario. **Nunca se mezclan**: un campo no puede elegir la otra convención (sí puede ocultar su marca con `mark: false`).
- **`density`:** se comparte con todos los campos, rejillas, secciones y pie que **no** traen la suya. Multiplica separaciones y alturas como siempre (#15, #114); no toca tipografía ni mínimos táctiles. El `spacious` del brief es `default`.
- **`readonly`:** «modo vista» del formulario entero: todos los campos sin `readonly` propio pasan a solo lectura (aspecto unificado, #165). No oculta acciones: la aplicación decide qué pie muestra.
- **`disabled`:** todos los campos sin `disabled` propio pasan a deshabilitados (no se envían). Para un bloque que no aplica, mejor ocultarlo (Fase 3, `GFormReveal`).
- **`headingLevel`:** nivel de los títulos de `GFormSection` y de `GErrorSummary` dentro del formulario (su prop propia gana). Dentro de `GDialog` (título `h2`) el valor por defecto 3 ya es correcto; en una página cuyo formulario cuelga de un `h1`, se pasa `2`.
- **`dirty`:** `GForm` lo pone a `true` (emite `update:dirty`) con la **primera** interacción del usuario: un evento `input` o `change` nativo que burbujea desde dentro, o `notifyChange()` de un campo sin control nativo (`GSelect`, `GDatePicker`, campos propios). **Nunca lo vuelve a `false` por su cuenta**, salvo con el evento `reset` del formulario; la aplicación lo baja tras guardar. No compara valores (el modelo es de la aplicación). La guardia `beforeunload` (`guard`) es de la Fase 4.
- **Atributos:** `id`, `name`, `aria-label`, `aria-labelledby`, `autocomplete` y escuchas van al `<form>` (raíz; `inheritAttrs` normal). El `id` es el que usa un botón externo con `form="id"` (pie de `GDialog`). **`action` y `method` se ignoran** con aviso en desarrollo.

### Momento de los errores («castigar tarde, premiar pronto», #157)

Cada campo registrado tiene un estado **revelado** (`shown`). Un error es **visible** si `errors[name]` tiene texto **y** el campo está revelado.

| Suceso | Con `showErrorsOn="blur"` | Con `"submit"` |
| --- | --- | --- |
| El usuario escribe (`input`) | Marca el campo como **editado**; si ya estaba revelado, el error se actualiza al escribir (desaparece en cuanto la aplicación lo quita) | Igual (solo actualiza si ya estaba revelado) |
| Sale del campo (`blur`/`focusout`) **habiendo editado** | **Revela** | — |
| Sale sin haber escrito nada | Nada (un vacío no se marca al pasar) | — |
| Cambio en un control de elección (`GCheckbox`, `GCheckboxGroup`, `GSwitch`, `GSelect`, `GDatePicker`; `trigger: 'change'`) | **Revela** | — |
| Envío (`submit`) o `showErrors()` | **Revela todos** | **Revela todos** |
| `errors[name]` pasa a vacío (corregido) | **Oculta** el revelado: el próximo error de ese campo espera al siguiente `blur` o envío | Igual (espera al siguiente envío) |
| `reset` del formulario o `resetState()` | Todos sin editar ni revelar | Igual |

Las advertencias (`warnings`) siguen la misma tabla. Un **`error` explícito** en el campo (prop) se muestra siempre, sin momento (como hoy), y **cuenta** para el bloqueo y el resumen.

### Envío (#157)

1. `GForm` escucha `submit` del `<form>` y **siempre** llama a `preventDefault()`.
2. Si el botón que envía (`event.submitter`) lleva **`formnovalidate`** (p. ej. «Guardar borrador»), no se revela ni se comprueba nada: emite `submit` con `novalidate: true`. Es la semántica nativa del atributo (HTML), y cubre el borrador que no valida de kiwi (§5.9).
3. Si no: revela todos los campos; los mensajes que aparecen por este envío se escriben con la región viva del campo en **`off`** y vuelven a `polite` en el cuadro siguiente (#164; el resumen ya los anuncia). Tras `nextTick` (para que la aplicación haya recalculado `errors`), reúne los **errores que bloquean**: el error resuelto (prop explícita o `errors[name]`) de cada campo **registrado y no deshabilitado**, más las claves de `errors` con texto que **no** corresponden a ningún campo registrado (errores generales o de servidor).
4. **Con errores:** emite `invalid` y mueve el foco: al `GErrorSummary` del formulario si hay uno montado; si no, al **primer control inválido** en orden del DOM, desplazando para que se vea su etiqueta (respetando el pie fijo).
5. **Sin errores:** emite `submit` con `FormData` construido con el `submitter` (así la aplicación distingue «Guardar» de otros botones de envío por su `name`/`value`).
6. **Errores del servidor:** la aplicación los pone en `errors` tras la respuesta y llama a `showErrors()`, que hace los pasos 3 y 4 sin emitir `invalid` de nuevo.

**Enter** en un campo de texto envía por el botón por defecto del formulario (comportamiento nativo; también si el botón está en el pie del dialog con `form="id"`).

### Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, data: FormData, submitter: HTMLElement \| null, novalidate: Boolean }` | Envío sin errores que bloqueen, o con un `submitter` `formnovalidate` |
| `invalid` | `{ event, errors: [{ name, message, id }] }` | Envío con errores (orden del DOM; los generales al final con `id: null`) |
| `reset` | `{ event }` | Evento `reset` nativo (botón `type="reset"` o `form.reset()`): `GForm` lo **cancela** (los valores son de la aplicación, el `reset` nativo los desincronizaría), limpia editados y revelados, baja `dirty` y emite; la aplicación restaura su modelo |
| `update:dirty` | `Boolean` | Primera interacción (`true`) y `reset` (`false`) |

Todos en `emits` (lección de CLAUDE.md: si no, el `submit` del consumidor llegaría al `<form>` nativo por `$attrs` y se dispararía dos veces).

### Métodos expuestos (`defineExpose`)

| Método | Hace |
| --- | --- |
| `showErrors()` | Revela todos y mueve el foco (resumen o primer inválido), como un envío con errores pero sin emitir. Para errores asíncronos o del servidor |
| `focusFirstError()` | Enfoca el primer control con error visible (etiqueta a la vista) |
| `resetState()` | Limpia editados, revelados y `dirty` **sin** tocar valores (p. ej. tras guardar y recargar datos). Se llama así y no `reset()` para no confundirlo con `form.reset()` |

### Textos (`labels`, sin valores por defecto)

| Clave | Dónde | Si falta |
| --- | --- | --- |
| `optional` | Marca de los campos opcionales con `marks="optional"` («(opcional)») | Aviso en desarrollo la primera vez que un campo la necesita; **sin marca** |
| `requiredHint` | Párrafo al principio con `marks="required"` («Los campos con * son obligatorios») | Aviso en desarrollo; sin párrafo |
| `sectionOptional` | Insignia de `GFormSection optional` («Opcional») | Aviso en desarrollo al usarla; sin insignia |
| `error` · `warning` · `valid` | Prefijo **oculto** del mensaje de cada campo («Error: », «Advertencia: », «Correcto: »; WCAG 1.4.1, 3.3.1) | Aviso en desarrollo la primera vez que aparece ese tipo; el mensaje va sin prefijo |

Los textos del resumen son de `GErrorSummary` (su propia `labels`).

### Estructura

```html
<form class="g-form g-form--density-default g-form--marks-optional" id="ID" novalidate
      style="--g-form-actions-size: 64px">                        <!-- variable solo con un GFormActions sticky montado -->
  <p class="g-form__required-hint">Los campos con * son obligatorios.</p>   <!-- solo con marks="required" -->
  <!-- slot por defecto: resumen, secciones, rejillas, pie -->
</form>
```

- **`novalidate` siempre**: la validación nativa del navegador (burbujas, foco propio) no convive con mensajes en línea y resumen. Los atributos `required` de los campos se mantienen (exponen «obligatorio» a la tecnología de apoyo).
- **Formularios anidados:** HTML no los permite; un `GForm` dentro de otro avisa en desarrollo y el interior **no** pinta `<form>` (pinta `div`), pero sigue proveyendo su contexto.
- `GForm` **no** añade `aria-describedby` ni rol: un `<form>` con nombre ya es un punto de referencia `form`.

### Clases

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-form` | `<form>` | Siempre |
| `g-form--density-{density}` | Raíz | Siempre |
| `g-form--marks-{optional\|required}` | Raíz | Siempre |
| `g-form--readonly`, `g-form--disabled` | Raíz | Según props |
| `g-form--sticky-actions` | Raíz | Con un `GFormActions sticky` montado |
| `--g-form-actions-size` (en línea) | Raíz | Ídem: altura medida del pie (ver §6) |
| `g-form__required-hint` | `p` | `marks="required"` con `labels.requiredHint` |

### Avisos de desarrollo (`[Grana GForm]`)

1. Dos campos registrados con el mismo `name` (salvo partes de un mismo `GCheckboxGroup`).
2. Falta `labels.optional`, `labels.requiredHint`, `labels.sectionOptional` o un prefijo `labels.error|warning|valid` cuando se necesita (una vez cada uno).
3. `action` o `method` en `$attrs` (se ignoran).
4. `GForm` dentro de otro `GForm`.
5. Más de un `GErrorSummary` o más de un `GFormActions sticky` en el mismo formulario.
6. Un `name` de `errors` con texto que no corresponde a ningún campo registrado **al enviar** se lista sin enlace (no es error de uso; sin aviso).

---

## 2. Contexto y `useFormField()` (#158)

### Qué provee `GForm` (`formKey`)

Estado reactivo de solo lectura para los campos: `density`, `marks`, `readonly`, `disabled`, `labels`, `headingLevel`, `live` (`polite`/`off`), y funciones `register(entry)` → `unregister`, `notifyInput(name)`, `notifyBlur(name)`, `notifyChange(name)`, `isShown(name)`, `setActionsSize(px)`. Es **interno**: el contrato público es `useFormField()`; `formKey` se exporta solo para `provide` manual.

`GFormGrid` y `GFieldGroup` proveen **sub‑contextos** propios (en la rejilla: `block`; en el grupo: partes, ver §4). `GFormSection optional` provee `sectionOptional` (suprime «(opcional)» dentro, ver §3).

### Precedencia (regla única)

`valor = prop explícita del campo ?? contexto ?? default de siempre`.

Para que «explícita» se distinga del default, **las props que leen el contexto pasan a default `undefined`** en los seis campos: `density`, `readonly`, `disabled`, `block` (Boolean con `default: undefined`: Vue no las convierte a `false` si declaran default) y `error`. El valor resuelto fuera de `GForm` es exactamente el de hoy (`'default'`, `false`, `false`, `false`, sin error). Bruno lo prueba en cada campo.

### `useFormField(options)`

Para los campos de Grana y **para campos propios del consumidor** (el slot «custom fields» del brief).

**Opciones** (cada una, valor, `ref` o getter):

| Opción | Tipo | Para qué |
| --- | --- | --- |
| `name` | String | Clave en `errors`/`warnings` y en el registro. Sin `name`, el campo lee densidad, marcas y estados globales pero no se registra ni recibe errores del contexto |
| `id` | String | `id` del control; sin él se genera (`useId`) |
| `error`, `warning`, `valid` | String | Mensajes explícitos (ganan) |
| `required`, `readonly`, `disabled`, `density`, `block`, `mark` | según tipo | Props explícitas del campo |
| `trigger` | `'blur'` \| `'change'` | Cuándo revela el error al interactuar (`blur` para texto; `change` para controles de elección) |
| `control` | `Ref<HTMLElement>` | Elemento enfocable (destino del resumen y del foco al primer inválido) |
| `root` | `Ref<HTMLElement>` | Raíz del campo (para desplazar con la etiqueta a la vista) |

**Devuelve** (computados de solo lectura salvo las funciones):

| Clave | Qué |
| --- | --- |
| `id`, `messageId` | `id` del control y de su región de mensaje |
| `inForm` | Boolean: hay contexto |
| `density`, `readonly`, `disabled`, `block` | Resueltos con la precedencia |
| `mark` | `'required'` (asterisco), `'optional'` (texto) o `null` |
| `markText` | `labels.optional` cuando `mark === 'optional'` |
| `message` | `{ type: 'error' \| 'warning' \| 'valid', text, prefix } \| null` (prioridad error > advertencia > válido; solo lo **visible**) |
| `invalid` | Boolean: hay error visible (pone `aria-invalid`) |
| `live` | `'polite'` u `'off'` para `aria-live` de la región de mensaje |
| `handlers` | `{ onInput, onChange, onFocusout }` para fusionar **primero** |
| `notifyChange()` | Para controles sin evento nativo (`GSelect`, `GDatePicker`, propios): marca sucio y, con `trigger: 'change'`, revela |

**Orden de manejadores (lección de CLAUDE.md, hallazgo 4):** los campos con `inheritAttrs: false` fusionan `mergeProps(handlers, ownHandlers, attrs)`: **los del contexto y los propios primero**, las escuchas del consumidor después. Así una escucha `@blur`/`@input` del consumidor ve el estado ya actualizado. Prueba de orden en cada campo, como la de `GInput` y `GCheckbox`.

**Reglas de marca** (`mark`):

- Solo campos **editables** (ni `readonly` ni `disabled`, propios o heredados) llevan marca.
- `marks="optional"`: `'optional'` si el campo no es `required`; `null` si lo es.
- `marks="required"`: `'required'` si es `required`; `null` si no.
- **Fuera de `GForm`** (sin contexto): `'required'` con `required`, como hoy.
- **Excepciones:** `GSwitch` nunca lleva marca (no tiene `required`, #47); un `GCheckbox` **suelto** no lleva «(opcional)» (sin marcar ya es una respuesta válida), sí asterisco con `required` en la convención `required`; dentro de una `GFormSection optional` no hay «(opcional)» (lo dice la sección); dentro de un `GFieldGroup`, ver §4.
- La prop **`mark`** (Boolean, default `undefined`) del campo: `false` quita la marca; `true` **no** inventa otra convención (solo restituye la que toca).
- «(opcional)» es **texto visible dentro del `<label>`** (forma parte del nombre accesible: «Segundo apellido (opcional)»); el asterisco sigue siendo `aria-hidden` y lo acompaña `required`/`aria-required`.

---

## 3. `GFormSection` (Fase 1: solo fija) (#161)

Agrupa una **idea** (Información básica, Contacto, Dirección). Jerarquía por **espacio y tipografía**, sin tarjetas.

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `title` | String | texto libre | sin valor | propia |
| `description` | String | texto libre | sin valor | propia |
| `headingLevel` | Number | 2 a 6 | el de `GForm` (3) | propia |
| `optional` | Boolean | | `false` | propia |

**Reservadas para la Fase 3** (no se aceptan en la Fase 1; un uso avisa en desarrollo): `mode` (`static` · `collapsible` · `addable`), `open`/`v-model:open`, `added`/`v-model:added`, `headerPlacement` (`top` · `auto`), `labels` (`add`, `remove`).

- **`title`:** obligatorio en la práctica: sin `title` ni slot `title` avisa en desarrollo.
- **`optional`:** insignia `GBadge` con texto `labels.sectionOptional` de `GForm` (texto, no color), `size="sm"`, `variant="soft"`, `color="neutral"`; y suprime el «(opcional)» de sus campos.
- `id`, `class` y demás atributos van a `<section>` (los anclajes de la Fase 3 los usarán).

### Estructura

```html
<section class="g-form-section" id="datos">
  <div class="g-form-section__header">
    <div class="g-form-section__heading">
      <h3 class="g-form-section__title">Datos fiscales</h3>
      <span class="g-badge …">Opcional</span>                  <!-- solo con optional -->
    </div>
    <p class="g-form-section__description">Solo si el paciente pide factura.</p>
    <div class="g-form-section__actions">…</div>               <!-- slot actions: acciones secundarias (Copiar de…) -->
    <div class="g-form-section__help">…</div>                  <!-- slot help: GHelper -->
  </div>
  <div class="g-form-section__body"><!-- slot por defecto: normalmente un GFormGrid --></div>
</section>
```

- **Sin `aria-labelledby`** en la `<section>`: con nombre sería un punto de referencia `region` y un formulario largo tendría diez (ruido). Los encabezados dan la navegación (WCAG 1.3.1, 2.4.6, 2.4.10).
- `fieldset`/`legend` se reserva para **preguntas** (`GFieldGroup`, radios), no para secciones (W3C WAI «Grouping Controls»).
- La rejilla de campos **no** la pone la sección: el consumidor coloca un `GFormGrid` en el cuerpo (una sola responsabilidad; secciones sin campos en rejilla también son válidas).

### Slots

| Slot | Propósito | Anatomía |
| --- | --- | --- |
| `title` | Título con contenido rico | Dentro del `hN`; nada interactivo |
| `description` | Descripción rica | En `__description` |
| `actions` | Acciones secundarias de la sección (botones `GBtn` `ghost`/`outline`) | Al final del encabezado; nunca la primaria del formulario |
| `help` | Ayuda contextual (`GHelper`) | En `__help` |
| default | Campos | En `__body` |

### Clases

`g-form-section`, `g-form-section--optional`, `__header`, `__heading`, `__title`, `__description`, `__actions`, `__help`, `__body`. Separación entre secciones consecutivas: `--g-form-section-gap` × densidad (§9).

---

## 4. Rejilla: `GFormGrid` y clases de colocación (#159)

### `GFormGrid`

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `stack` | Boolean | | `false` | propia: una columna siempre (drawers, brief) |
| `density` | String | `default` `comfortable` `compact` | la de `GForm` o `default` | compartida |

- **Mide su propio ancho** (`ResizeObserver`), nunca el visor, y elige un **tramo**: `wide` (≥ `space × 176`, 704px con `space` 4) → **12 columnas**; `medium` (≥ `space × 104`, 416px) → **6**; `narrow` (por debajo) → **1**. Son **constantes de diseño** derivadas de `space`, medidas por bruno (como #130); no son tokens ni excepción nueva. Cada rejilla anidada (dentro de una inset de `GDialog`, de un grupo, de una sección) **se mide sola**. Con `stack`, siempre `narrow`. En SSR y antes de medir: `narrow` (una columna nunca desborda).
- Provee el sub‑contexto **`block`**: los campos dentro de la rejilla (y sus partes) se dibujan `block` por defecto para **llenar su celda** (hallazgo 3). No hay CSS de la rejilla sobre `.g-input` ni sobre otros campos: cada componente estiliza lo suyo.
- Separaciones: fila `--g-form-gap` y columna `--g-form-column-gap`, ambas × densidad (§9).
- **Orden:** la rejilla coloca por orden del DOM **sin** `order`, `grid-auto-flow: dense` ni posiciones explícitas que reordenen.

### Clases públicas para los hijos

| Clase | `wide` (12) | `medium` (6) | `narrow` (1) | Contenido típico |
| --- | --- | --- | --- | --- |
| `g-form-w-xs` | 2 col | 2 col | 100% con máximo `--g-form-max-xs` | temperatura, edad, %, cantidad, núm. interior |
| `g-form-w-sm` | 3 col | 2 col | 100% con máximo `--g-form-max-sm` | código postal, fecha, prefijo, RFC |
| `g-form-w-md` | 4 col | 3 col | 100% | nombre, apellido, correo, ciudad, teléfono suelto |
| `g-form-w-lg` | 8 col | 6 col | 100% | calle, razón social, teléfono compuesto |
| `g-form-w-full` (por defecto, sin clase) | 12 col | 6 col | 100% | observaciones, descripción, opciones en tarjetas |
| `g-form-break` | Empieza fila nueva (se combina con una de ancho) | | | El siguiente campo empieza otra idea |
| `g-form-row` | Ver abajo | | | Preguntas ligadas que comparten fila **también** en una columna |

- **El ancho expresa contenido, no simetría:** una fila puede quedar con huecos (brief).
- **Estrecho = una columna**, pero **lo compacto conserva su máximo** (`--g-form-max-xs`/`-sm`, §9): 36.5 no se estira a 320px; el objetivo táctil crece en altura (`pointer: coarse`), no en ancho.
- **Compartir fila en una columna solo con relación explícita** (`GFieldGroup` o `g-form-row`), nunca por empaquetado automático de campos pequeños.

### `g-form-row` (fila unida)

- Contenedor con su propia clase de ancho (`g-form-row g-form-w-md`) cuyos hijos se reparten la fila **en partes iguales** en los tres tramos (con `g-form-part-*`, §5, pueden fijar la suya).
- **Alineación de cajas con *subgrid*** (hallazgo 12): cada campo hijo directo de `.g-form-row` coloca sus partes en **cuatro pistas con nombre** compartidas: etiqueta · caja · ayuda · mensaje. Lo escribe **coco en el CSS de cada campo** (`.g-form-row > .g-input { … }`: el campo estiliza su propia raíz según dónde está), colocando cada parte **por nombre de pista**, no por orden (una ayuda ausente deja su pista vacía). Bruno garantiza que la raíz de cada campo tiene esas partes como hijos directos (§10).
- Máximo recomendado: **3 hijos**; con más, aviso en desarrollo (brief: «sin filas con demasiados controles»).
- **En la rejilla general no hay subgrid** en la Fase 1 (un `<legend>` no participa en la rejilla): alineación superior y la regla de contenido «etiquetas cortas en filas compartidas», documentada.

### Clases y atributos de `GFormGrid`

| Clase o atributo | Cuándo |
| --- | --- |
| `g-form-grid` | Siempre |
| `g-form-grid--{wide\|medium\|narrow}` y `data-tier` | Tramo medido |
| `g-form-grid--stack` | `stack` |
| `g-form-grid--density-{density}` | Siempre (resuelta) |

### Avisos de desarrollo (`[Grana GFormGrid]`, una vez, al montar)

1. Un hijo con `order` distinto de 0 o la rejilla con `grid-auto-flow: dense` (rompería DOM = lectura).
2. Un `g-form-row` con más de 3 hijos.
3. Dos clases `g-form-w-*` en el mismo hijo.

---

## 5. `GFieldGroup` (#160)

**Una pregunta con varias partes** y un solo mensaje: Teléfono (país · número · ext.), Fecha en partes. Preguntas distintas pero ligadas usan `g-form-row`, no esto.

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `label` | String | texto libre | sin valor | propia (texto del `<legend>`) |
| `hint` | String | texto libre | sin valor | propia |
| `name` | String | | sin valor | propia (clave del grupo en `errors`) |
| `error`, `warning`, `valid` | String | texto libre | sin valor | propia |
| `required` | Boolean | | `false` | propia (marca de la pregunta) |
| `disabled` | Boolean | | `false` | compartida (nativo del `fieldset`) |
| `readonly` | Boolean | | `false` | compartida (se propaga a las partes) |
| `density` | String | | la de `GForm` | compartida |

**Reservada para la Fase 2:** `joined` (partes fusionadas en una sola caja: «Temperatura [36.5 | °C]»), que llega con `GNumberField`; exige reglas de esquinas y foco sobre las cajas de las partes y merece su propia verificación.

### Reglas

- **Elemento:** `<fieldset>` + `<legend>` (rol `group` con nombre; WCAG 1.3.1). Sin `label` ni slot `label` avisa en desarrollo.
- **Partes:** campos de Grana (o propios con `useFormField`) como hijos. Cada parte conserva **su etiqueta visible** (País, Número, Extensión): el grupo nombra la pregunta y la parte nombra su dato.
- **Un solo mensaje:** el del grupo (`error` propio, o `errors[name]`, o el **primer** error visible de sus partes en orden del DOM). Las partes **no pintan** texto de mensaje (su región sigue existiendo, vacía) pero las inválidas llevan `aria-invalid="true"` y su borde de error. El `fieldset` lleva `aria-describedby` → ayuda y mensaje del grupo. **Sin `aria-invalid` en el `fieldset`** (no es un atributo admitido en el rol `group` en ARIA 1.3); lo llevan los controles.
- **Marcas:** el `<legend>` lleva la marca de la pregunta según `required` y la convención. Una parte lleva su propia marca **solo si difiere** de la del grupo (la extensión opcional de un teléfono obligatorio: «Extensión (opcional)»).
- **Resumen y foco:** el grupo es **un** elemento del resumen (una pregunta, un enlace), que lleva a la **primera parte inválida** (o a la primera parte si el error es del grupo).
- **Colocación de partes:** fila que salta de línea; cada parte crece salvo que lleve `g-form-part-xs` o `g-form-part-sm` (base y máximo `--g-form-max-xs`/`-sm`). Una parte que no cabe **pasa debajo** (la extensión en 320px). Orden del DOM = lectura.
- El grupo se coloca en la rejilla como cualquier hijo (`class="g-form-w-lg"`) y es `block` en su celda.

### Estructura

```html
<fieldset class="g-field-group g-form-w-lg" aria-describedby="ID-hint ID-message">
  <legend class="g-field-group__label">Teléfono</legend>                       <!-- + marca según convención -->
  <div class="g-field-group__parts">
    <div class="g-select g-form-part-sm …">…</div>
    <div class="g-input …">…</div>
    <div class="g-input g-form-part-sm …"><label …>Extensión <span class="g-input__optional">(opcional)</span></label>…</div>
  </div>
  <div class="g-field-group__hint" id="ID-hint">…</div>
  <div class="g-field-group__message" id="ID-message" aria-live="polite">…</div>  <!-- siempre presente -->
</fieldset>
```

### Clases

`g-field-group`, `g-field-group--density-{d}`, `is-disabled`, `is-readonly`, `is-invalid`, `is-warning`, `is-valid`, `__label`, `__optional`, `__required`, `__parts`, `__hint`, `__message`, `__message-type` (prefijo oculto), `__message-icon`; clases de parte `g-form-part-xs`, `g-form-part-sm`.

---

## 6. `GFormActions` (#155, #163)

Pie de acciones con jerarquía, estado y, opcionalmente, fijo.

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `sticky` | Boolean | | `false` | propia |
| `status` | String | texto libre | sin valor | propia |
| `density` | String | | la de `GForm` | compartida |

### Reglas

- **Jerarquía:** **una** primaria (`GBtn` `solid`: Guardar, Registrar, Crear), secundaria con borde (Guardar borrador, con `formnovalidate` si no debe validar), terciaria `ghost`/`link` (Cancelar). Más de una primaria → aviso en desarrollo.
- **Orden (decisión del usuario, #155):** en el DOM, **secundarias antes y la primaria al final**; en ancho, alineadas **al final** (a la derecha en LTR), primaria la última, como el pie de `GDialog`. **En estrecho** (ancho propio < `space × 104`, medido, el mismo umbral que el tramo `narrow` de la rejilla) se **apilan a ancho completo con la primaria arriba** (`column-reverse` sobre el orden del DOM). Excepción acotada a «DOM = visual»: en ese apilado el orden de Tab (Cancelar → … → primaria) va de abajo arriba. Se acepta porque son acciones adyacentes de un mismo grupo cuyo significado no depende del orden (WCAG 2.4.3 pide un orden que conserve significado y operabilidad) y es decisión del usuario; queda en la verificación con lector real. Una primaria que **no** sea el último botón avisa en desarrollo.
- **Estado:** región `role="status"` **siempre presente** (vacía si no hay nada; #14) al inicio del pie: «Cambios sin guardar», «Guardado a las 10:42». Texto por `status` o slot `status`; la aplicación lo escribe (no hay textos por defecto). La máquina de autoguardado es de la Fase 4.
- **`sticky`:** pegado al borde inferior del contenedor que se desplaza (`position: sticky`), con fondo propio y línea superior (valores de coco). **Nunca tapa el campo enfocado** (WCAG 2.2 **2.4.11**): `GFormActions` mide su altura (`ResizeObserver`) y la comunica a `GForm` (`setActionsSize`), que la escribe en línea como **`--g-form-actions-size`** (propiedad pública de solo lectura, como `--g-surface-padding`, #131) y añade `g-form--sticky-actions`; **`GForm.css`** da `scroll-margin-block-end: calc(var(--g-form-actions-size) + margen)` a los elementos enfocables de su interior (regla de desplazamiento, no de aspecto de los campos). **Respaldo JS** (bruno): en `focusin`, si el elemento queda bajo el pie, desplaza la diferencia. Kiwi verificó 29 focos sin tapar, también solo con CSS.
- **En `GDialog`** las acciones van en su slot `footer` (ya fijo; el envío con `form="id"`). Se puede usar `GFormActions` (sin `sticky`) dentro del pie del dialog para tener la misma jerarquía, el estado y el apilado; el pie de `GDialog` **no cambia** en esta fase.
- Fuera de `GForm` funciona igual (sin publicar altura).

### Estructura

```html
<div class="g-form-actions g-form-actions--sticky" data-stacked>     <!-- data-stacked solo en estrecho -->
  <div class="g-form-actions__status" role="status">Cambios sin guardar</div>
  <div class="g-form-actions__buttons">
    <button class="g-btn … g-btn--variant-ghost" type="button">Cancelar</button>
    <button class="g-btn … g-btn--variant-outline" type="submit" formnovalidate name="intent" value="draft">Guardar borrador</button>
    <button class="g-btn … g-btn--variant-solid" type="submit">Guardar</button>
  </div>
</div>
```

### Clases

`g-form-actions`, `g-form-actions--sticky`, `g-form-actions--stacked` (+ `data-stacked`), `g-form-actions--density-{d}`, `__status`, `__buttons`.

### Avisos de desarrollo (`[Grana GFormActions]`)

1. Más de un `GBtn` con variante resuelta `solid` en el slot por defecto.
2. La primaria no es el último botón.
3. `sticky` con otro `GFormActions sticky` ya montado en el mismo `GForm`.

---

## 7. `GErrorSummary` (#162)

Generaliza el resumen de `GWidgetConfig` (#76, #78): título con la cantidad, un enlace por **pregunta** con el mismo texto que el error en línea, y foco al aparecer (patrón GOV.UK).

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `errors` | Array | `[{ name?, id?, message }]` | sin valor: los del `GForm` que lo contiene | propia |
| `headingLevel` | Number | 2 a 6 | el de `GForm` (3) | propia |
| `labels` | Object | `{ title }` | `{}` (función) | propia |

- **Dentro de `GForm`** (sin `errors`): muestra los errores que **bloquearon** el último envío o `showErrors()`, en orden del DOM (generales al final, sin enlace), y se mantiene al día: **al corregir**, el elemento sale en silencio; sin elementos, el resumen se **oculta**. Recibe el foco **una vez por cada envío** que acaba con errores (y por cada `showErrors()`). No aparece por errores revelados al salir de un campo.
- **Fuera de `GForm`** (con `errors`): visible mientras `errors` tenga elementos; recibe el foco al pasar de vacío a con elementos. `id` es el del control al que lleva el enlace; sin `id`, texto sin enlace.
- **`labels.title`:** String con `{count}` (se rellena con `fill`) o **Function** `(count) => String` (plurales del idioma; como `counterText` de `GTextarea`, #51). Sin él, aviso en desarrollo y el título queda vacío (el resumen sigue funcionando).

### Estructura

```html
<div class="g-error-summary" id="ID" tabindex="-1" aria-labelledby="ID-title">       <!-- hidden sin errores -->
  <div role="alert">
    <h3 class="g-error-summary__title" id="ID-title">
      <svg class="g-icon g-error-summary__icon" aria-hidden="true">…</svg>Hay 3 problemas con el formulario   <!-- circle-alert -->
    </h3>
    <ul class="g-error-summary__list">
      <li><a class="g-error-summary__link" href="#CONTROL-ID">Escribe el correo con el formato nombre@dominio.com</a></li>
      <li class="g-error-summary__item">No se pudo guardar: el folio ya existe.</li>   <!-- error general: sin enlace -->
    </ul>
  </div>
</div>
```

- Estructura del precedente #78: contenedor enfocable `tabindex="-1"` con `role="alert"` **interior**; la raíz existe siempre (con `hidden` sin errores) para que la región exista antes del contenido.
- **Enlace:** `href="#id"` real (funciona sin JS y se puede abrir en otra pestaña del navegador sin romper nada). Al activarlo, `preventDefault()` y se emite **`navigate`** (cancelable). Si nadie lo cancela: espera un `nextTick` (para que la aplicación cambie de pestaña o de paso si lo necesitó en su manejador), **desplaza la raíz del campo para que se vea su etiqueta** (respetando el pie fijo) y **enfoca el control** con `preventScroll: true` (GOV.UK). En la Fase 3, además abre la sección plegable que lo contiene.
- Los enlaces cumplen el objetivo mínimo de 24px de alto (WCAG 2.5.8; valores de coco).

### Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ name, id, event, preventDefault() }` | Antes de llevar al campo. Con `preventDefault()` el resumen no enfoca ni desplaza (la aplicación lo hace) |

### Clases

`g-error-summary`, `__title`, `__icon`, `__list`, `__link`, `__item`.

### Avisos de desarrollo (`[Grana GErrorSummary]`)

1. Falta `labels.title`.
2. Fuera de `GForm` y sin `errors`: no pinta nada.
3. Un elemento con `id` que no existe en el documento al activarlo.

**`GWidgetConfig`** conserva su resumen propio en esta fase; componer `GErrorSummary` en él es un cambio aparte, posterior (sin cambio de API pública).

---

## 8. Recetas (documentación, no componentes) (#168)

Las partes de una dirección o un teléfono **dependen del país**: un componente cerrado acertaría en uno y estorbaría en los demás. Se documentan como composiciones con la rejilla; mora-docs las lleva al README con estos ejemplos.

### Teléfono

```vue
<GFieldGroup class="g-form-w-lg" label="Teléfono" name="telefono" required>
  <GSelect class="g-form-part-sm" label="País" name="tel-pais" :options="paises" />
  <GInput label="Número" name="tel-numero" type="tel" autocomplete="tel-national" placeholder="951 123 4567" />
  <GInput class="g-form-part-sm" label="Extensión" name="tel-ext" inputmode="numeric" autocomplete="tel-extension" />
</GFieldGroup>
```

- País y número comparten fila también en 320px; la extensión pasa debajo si no cabe.
- **Límite:** `GSelect` no participa en el autocompletado del navegador (es un `combobox` con `<input type="hidden">`, #54). Si importa, el prefijo puede ser un `GInput` con `autocomplete="tel-country-code"` e `inputmode="tel"`. Un campo de teléfono dedicado con formato por país es de una ronda propia (Fase 5).

### Dirección (México; adaptar las partes a cada país)

```vue
<GFormSection title="Dirección">
  <GFormGrid>
    <GInput class="g-form-w-lg" label="Calle" name="calle" autocomplete="address-line1" />
    <div class="g-form-row g-form-w-md">
      <GInput label="Núm. exterior" name="num-ext" />
      <GInput label="Núm. interior" name="num-int" autocomplete="address-line2" />
    </div>
    <GInput class="g-form-w-md g-form-break" label="Colonia" name="colonia" autocomplete="address-level3" />
    <GInput class="g-form-w-sm" label="Código postal" name="cp" inputmode="numeric" autocomplete="postal-code" />
    <GInput class="g-form-w-md" label="Ciudad" name="ciudad" autocomplete="address-level2" />
    <GSelect class="g-form-w-md g-form-break" label="Estado" name="estado" :options="estados" />
    <GInput class="g-form-w-md" label="País" name="pais" autocomplete="country-name" />
  </GFormGrid>
</GFormSection>
```

- Composición verificada por kiwi en 12/6/1 (§2.5): Calle `lg` | [Núm. ext. | Núm. int.] `md` / Colonia `md` | CP `sm` | Ciudad `md` / Estado `md` | País `md`.
- `autocomplete` correcto en cada parte (WCAG 1.3.5). La búsqueda de dirección es un combobox (Fase 5).
- En la convención por defecto, «Núm. interior (opcional)» sale solo (no es `required`).

---

## 9. Tokens (#167; `tokens.md` §21)

**Tokens nuevos (nombrados aquí; valores de coco en `defaults.css`, capa `grana.defaults`):**

| Token | Para qué | Regla |
| --- | --- | --- |
| `--g-form-gap` | Separación entre filas de campos en `GFormGrid` y entre partes de `GFieldGroup` | × densidad (1, 0.875, 0.75) |
| `--g-form-column-gap` | Separación entre columnas de `GFormGrid` y de `g-form-row` | × densidad |
| `--g-form-section-gap` | Separación entre `GFormSection` consecutivas y entre la última sección y `GFormActions` | × densidad; del orden de 2× `--g-form-gap` (kiwi §3.1) |
| `--g-form-max-xs` | Ancho máximo de `g-form-w-xs` en una columna y base/máximo de `g-form-part-xs` | No cambia con la densidad (el ancho expresa el contenido) |
| `--g-form-max-sm` | Ídem para `sm` | Ídem |

**Por qué tokens y no constantes:** son el **ritmo** del formulario (aire entre campos y secciones) y el tamaño esperado de lo compacto, que un tema de producto puede querer ajustar (formularios de captura densos frente a configuración aireada), y se usan en CSS (admiten `var()`). Son una base **por** densidad multiplicada por el factor compartido (#15, #114), no tres tokens por densidad: una sola escala en todo el sistema.

**No son tokens:**

- Umbrales de tramo (`space × 176`, `× 104`) y de apilado del pie (`× 104`): constantes medidas por bruno (#130).
- `--g-form-actions-size`: propiedad **pública de solo lectura** (no es del tema, no va en `tokens.json`), como `--g-surface-padding` (#131).
- Separación entre título, descripción y cuerpo de una sección, margen del pie fijo, alto de los enlaces del resumen: derivados de `space` en el CSS de coco.
- **Solo lectura:** `--g-color-surface-sunken` + borde **discontinuo** en `--g-color-border-control` + texto `--g-color-text` (#165). Deshabilitado: lo de hoy (`text-subtle`, atenuado).
- Advertencia y válido: `--g-color-warning-text` y `--g-color-success-text` (texto ≥ 4.5:1), además de icono, prefijo y estilo de borde distinto del error.

**Consumidos (existentes):** `--g-space-1`, `--g-font-ui`, `--g-text-{title|body|body-sm|caption}-*`, `--g-text-title-weight`, `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-control`, `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-{danger|warning|success}-text`, `--g-surface-*` (fondo del pie fijo), `--g-border-width`, `--g-focus-*`, `--g-duration-*`, `--g-ease-*`.

## 10. Cambios en los campos existentes (Fase 1) (#158, #164, #165, #166)

Afectan a **`GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GCheckboxGroup`, `GSwitch`, `GDatePicker`**. Se anotan en cada contrato («Cambio por el sistema de formularios»). **Dueños:** bruno (`.vue`, pruebas, `meta.json`), coco (CSS de cada campo).

| # | Cambio | Detalle | Dueño |
| --- | --- | --- | --- |
| C1 | **Leen el contexto con `useFormField()`** | `density`, `readonly`, `disabled`, `block` y `error` pasan a default `undefined`; precedencia prop › contexto › default de siempre. Fuera de `GForm`, sin cambios visibles | bruno |
| C2 | **`block` dentro de la rejilla** | `GFormGrid` (y `GFieldGroup`) proveen `block: true`; la prop explícita gana. `GCheckbox`/`GSwitch` ya ocupan su fila; para ellos `block` no cambia nada visual | bruno |
| C3 | **Marcas** | `GForm` decide: «(opcional)» como texto visible dentro de la etiqueta (`g-<tag>__optional`) o asterisco `aria-hidden` (`g-<tag>__required`), nunca ambos; nueva prop **`mark`** (Boolean, default `undefined`; `false` la quita). Reglas y excepciones en §2 | bruno (marcado), coco (aspecto de `__optional`: texto `--g-color-text-muted`, peso normal) |
| C4 | **Región de mensaje unificada** | La región viva `g-<tag>__error` (`id` `ID-error`) pasa a **`g-<tag>__message`** (`id` `ID-message`): **un** hueco para error, advertencia o válido, siempre presente, `aria-live` = `live` del contexto (`polite`, u `off` mientras se escriben mensajes revelados por un envío). Dentro: icono `GIcon` + prefijo oculto `g-<tag>__message-type` (`labels.error|warning|valid`) + texto. `aria-describedby` incluye `ID-message` mientras haya mensaje. El slot `error` se conserva (contenido rico del error) | bruno, coco |
| C5 | **Estados `warning` y `valid`** | Props nuevas **`warning`** y **`valid`** (String). Sin `aria-invalid`; no bloquean; prioridad error > advertencia > válido. Clases de raíz `is-warning`, `is-valid` (`is-invalid` sigue para el error). Señal no cromática: icono distinto y borde de **estilo** distinto (coco; precedente `GToast`: error sólida, advertencia discontinua), además del prefijo. «Válido» solo con un mensaje útil (no un check gratuito) | bruno, coco |
| C6 | **Iconos del mensaje** | Error **`circle-alert`** (antes `triangle-alert`; coherente con `GStepper`, `GTabs`, `GCard`, `GToast`), advertencia **`triangle-alert`**, válido **`circle-check`** (`icons.md`) | bruno, coco |
| C7 | **Solo lectura homogéneo** | Mismo aspecto en los seis: contraste completo (texto `--g-color-text`, sin opacidad), fondo `--g-color-surface-sunken`, borde **discontinuo** `--g-color-border-control` (con `soft`, la línea inferior discontinua), cursor normal, **enfocable**, valor **seleccionable** donde el elemento lo permite (en `GSelect`/`GDatePicker`, el texto del valor con `user-select: text`). Distinto de deshabilitado sin depender del color. Semántica sin cambios (nativo en `GInput`/`GTextarea`; `aria-readonly` en los demás) | coco (aspecto), bruno (verificar foco y envío) |
| C8 | **Silencio al enviar** | Ver C4: el mensaje revelado por un envío no se anuncia por la región del campo (lo anuncia el resumen o el foco al primer inválido); el revelado al salir del campo **sí** se anuncia | bruno |
| C9 | **Manejadores primero** | `mergeProps(handlers, propios, attrs)`; prueba de orden en los seis | bruno |
| C10 | **Registro** | Cada campo con `name` se registra (`control`, `root`, `required`, `disabled`, error explícito). `GInput`/`GTextarea`/`GCheckbox`/`GSwitch` toman `name` de `$attrs`; `GSelect`/`GDatePicker` de su prop. `GSelect` y `GDatePicker` llaman a `notifyChange()` al elegir (no tienen `input` nativo que burbujee) | bruno |
| C11 | **`GCheckboxGroup` gana `name`** | String: clave del grupo en `errors` y `name` por defecto de sus casillas (la casilla con `name` propio lo conserva). Las casillas de un grupo **no** se registran sueltas | bruno |
| C12 | **Pistas para *subgrid*** | La raíz de cada campo tiene como hijos directos etiqueta, caja (fila), ayuda y mensaje, para que coco las coloque por nombre de pista dentro de `g-form-row` (§4) | bruno (estructura), coco (CSS) |
| C13 | **`GInput`: prefijo y sufijo de texto** | Props nuevas **`prefix`**, **`suffix`** (texto visible dentro de la caja: `$`, `kg`, `%`) y **`prefixLabel`**, **`suffixLabel`** (expansión accesible: «kilogramos»). Ver abajo. Los slots `prepend`/`append` siguen siendo **iconos decorativos** | bruno, coco |

### C13 · `GInput` `prefix`/`suffix` (#166)

- Orden en la caja: `prepend` (icono) · **`prefix`** · `<input>` · **`suffix`** · `append` (icono) · indicador de carga · botón mostrar/ocultar.
- Accesibilidad: una unidad es **información** (hallazgo 9). Sin `*Label`, el texto visible (`g-input__prefix`/`__suffix`, con `id`) entra en `aria-describedby` **antes** de ayuda y mensaje. Con `*Label`, el texto visible es `aria-hidden` y un texto oculto (`g-input__prefix-label`/`__suffix-label`, con `id`) con la expansión entra en `aria-describedby`. Así «Peso, editar texto, kilogramos».
- Pulsar sobre el prefijo o el sufijo enfoca el `<input>` (comodidad de puntero; no son interactivos ni enfocables).
- Clases: `g-input--has-prefix`, `g-input--has-suffix`, `g-input__prefix`, `__suffix`, `__prefix-label`, `__suffix-label`. Texto en `--g-color-text-muted` (≥ 4.5:1), tamaño del texto escrito.
- `GTextarea` no gana prefijo ni sufijo (#50). `GNumberField` (Fase 2) reutiliza esta misma regla.

---

## 11. Accesibilidad (criterios que el contrato asegura)

| Criterio | Cómo |
| --- | --- |
| 1.3.1 Info y relaciones | `label for`; `fieldset`/`legend` en `GFieldGroup` (y radios, Fase 2); secciones con encabezado; ayuda, unidad y mensaje por `aria-describedby` |
| 1.3.2 Secuencia | DOM = visual en 12/6/1 (aviso con `order`/`dense`); excepción acotada del pie apilado (#155) |
| 1.3.5 Propósito de entrada | `autocomplete` pasa al control; recetas con sus valores |
| 1.4.1 Color | Error, advertencia y válido con icono, prefijo de texto y estilo de borde; solo lectura con borde discontinuo |
| 2.4.3 Orden del foco | Foco al resumen o al primer inválido tras enviar; enlace del resumen al control |
| 2.4.6 Encabezados y etiquetas | Etiqueta visible siempre; «(opcional)» en el nombre; secciones con `hN` |
| 2.4.11 Foco no oculto | `scroll-margin` = `--g-form-actions-size` + margen, más respaldo JS |
| 2.5.8 Tamaño del objetivo | Los de cada campo (≥ 24px; ≥ 44px táctil sin importar densidad); enlaces del resumen ≥ 24px |
| 3.3.1 Identificación de errores | Texto + `aria-invalid` + prefijo oculto; resumen |
| 3.3.2 Etiquetas o instrucciones | Una convención de marcas por formulario; con asterisco, frase que lo explica |
| 3.3.3 Sugerencia | Mensajes de la aplicación con la corrección (guía en el README; Grana no los escribe) |
| 4.1.3 Mensajes de estado | Mensaje al salir (`polite`); resumen (`alert` + foco); estado del pie (`status`) |

## 12. Verificación (qué y cómo)

- **bruno** (vitest + jsdom; Playwright para medidas, foco y desplazamiento):
  - **Precedencia:** en cada campo, fuera de `GForm` igual que hoy (instantánea de clases y atributos); dentro, hereda `density`/`readonly`/`disabled`/`block`/error; la prop explícita (incluido `false` y `''`) gana.
  - **Momento:** vacío al salir no revela; escribir y salir revela; corregir oculta y el siguiente error espera al `blur`; elección revela al cambiar; envío revela todos; `showErrorsOn="submit"`; advertencias con la misma tabla y sin bloquear.
  - **Envío:** `preventDefault` siempre; `formnovalidate` emite `submit` con `novalidate: true`; con errores emite `invalid` (orden del DOM, generales al final) y enfoca resumen o primer inválido; sin errores, `submit` con `FormData` y `submitter`; deshabilitados excluidos; `showErrors()`; `reset` cancelado, estado limpio, `update:dirty(false)`; `action` ignorado con aviso; formulario anidado.
  - **Silencio:** regiones en `off` mientras se escriben mensajes revelados por envío y `polite` después; al salir del campo, `polite` todo el tiempo.
  - **`dirty`:** primer `input`/`change` y `notifyChange()` lo suben; nada lo baja salvo `reset`.
  - **Marcas:** convención `optional` y `required` en los seis campos y en `GFieldGroup` (parte que difiere); excepciones (`GSwitch`, casilla suelta, sección opcional, solo lectura); nombre accesible con «(opcional)»; `requiredHint`.
  - **Rejilla:** tramos 12/6/1 por ancho propio (960/600/360) y anidadas; `stack`; orden visual = DOM = Tab; avisos (`order`, `dense`, fila de más de 3).
  - **`GFieldGroup`:** `fieldset`/`legend`; un mensaje; `aria-invalid` en partes y no en el `fieldset`; enlace del resumen a la parte inválida.
  - **`GErrorSummary`:** `role="alert"` interior, `tabindex="-1"`, foco una vez por envío; enlaces `href` reales; `navigate` cancelable; etiqueta a la vista y foco con `preventScroll`; elementos salen al corregir; oculto sin errores; `labels.title` String y Function.
  - **`GFormActions`:** `role="status"` presente vacío; apilado bajo `space × 104` con primaria arriba; `--g-form-actions-size` en el `<form>`; Tab por todos los controles de un formulario largo sin ninguno tapado (con y sin respaldo JS); avisos de primaria.
  - **Orden de manejadores** en los seis campos; **`GInput` `prefix`/`suffix`** en `aria-describedby` (con y sin `*Label`).
  - `check-icons.mjs` y `levels.test.js` sin infracciones (incluida la excepción de `--g-form-actions-size`).
- **coco** (auditoría con un tema distinto al de defecto): ritmo de secciones y campos en las tres densidades; «(opcional)» y asterisco legibles (4.5:1); advertencia y válido distinguibles en escala de grises; solo lectura frente a deshabilitado frente a editable sin color; `forced-colors` (bordes discontinuos visibles); subgrid de `g-form-row` con etiqueta en dos líneas; pie fijo en claro y oscuro; 320px sin desborde; zoom 200 % (reflujo, 1.4.10); `prefers-contrast: more`.
- **No verificado y pendiente:** lector de pantalla real (VoiceOver, NVDA, TalkBack): doble lectura del resumen (`alert` + foco), silencio `off` → `polite`, «(opcional)» en el nombre, prefijo y sufijo en la descripción, orden del pie apilado; Firefox y WebKit (subgrid, `scroll-margin` al enfocar, `ResizeObserver`; Playwright cubre lo automatizable, #108); teclado virtual tapando campos; autocompletado del navegador en compuestos; rendimiento con cientos de campos registrados.

## Fases siguientes (reservado; no forma parte de este contrato)

| Fase | Contenido | Motivo de diferirlo |
| --- | --- | --- |
| **2 · Campos imprescindibles** | **`GRadioGroup`/`GRadio`** (`appearance` `list` `inline` `segmented` `chips` `cards`; `fieldset`/`legend`; radios nativos; relación con `GCard selectType="radio"`, #124) y **`GNumberField`** (`<input type="text" inputmode>`, `min` `max` `step` `precision` `locale`, prefijo/sufijo de C13, −/+ opcionales con `minus`/`plus`), **sin moneda** (#154); `GFieldGroup joined` (temperatura valor · unidad) | Sin ellos no hay Sí/No ni campos numéricos; cada uno merece su contrato y su verificación |
| **3 · Divulgación y navegación** | `GFormSection` `mode` `collapsible` (`aria-expanded`, cerrada `inert` pero se envía y valida; el resumen la abre) y `addable` («Agregar…»/«Quitar», foco al título con `tabindex="-1"`); `headerPlacement="auto"` (≥ `space × 200`); **`GFormReveal`** (`when`, `exclude`, `keepValues`, `indent`; `grid-template-rows` sin saltos; `inert` + deshabilitado al cerrar); **`GFormNav`** (`<nav>` con nombre, `aria-current="location"`, estado por sección en texto, *scroll-spy*, ≥ `space × 190`); tokens de la barra de condicional y del ancho de la navegación | Formularios largos; comportamiento nuevo que kiwi verificó pero necesita contrato propio |
| **4 · Estado y guardado** | `GFormStatus` (autoguardado: Guardando/Guardado/Error + Reintentar, revertir); `guard` (`beforeunload` con `dirty`); integración documentada con `GDialog` (cancelar `dismiss` con cambios, confirmación en el pie), `GStepper` (un `GForm` por paso, `status` por paso) y `GTabs` (`status: attention` con conteo); `GWidgetConfig` compone `GErrorSummary` | Depende de la Fase 1 y de los contratos vigentes de esos componentes |
| **5 · Rondas propias de kiwi** | `GCombobox` (prioridad alta), `GFileField`, `GTimeField`, **moneda** (#154), teléfono dedicado, búsqueda de dirección | Cada uno es un componente con su propio patrón APG y sus preguntas |

**Preguntas de producto abiertas: ninguna.** Las tres de kiwi (§17) las respondió el usuario: #153, #154, #155.

## Resolución de hallazgos de kiwi (r01, §15)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | API `GForm` | §1. Cambios sobre la propuesta: `validateOn` → **`showErrorsOn`** (no valida); `reset()` → **`resetState()`**; `guard` → Fase 4; `labels` solo con lo de la Fase 1 (`unsaved`/`saved` son textos del estado que pone la aplicación); `submit` con `submitter` y `novalidate` (`formnovalidate` nativo para el borrador); `warnings` como `errors` sin bloquear | #157; HTML (`formnovalidate`, `submitter`) |
| 2 | Contexto y `useFormField` | §2: `formKey` exportada; `useFormField` con opciones y retorno cerrados; precedencia con defaults `undefined` | #158 |
| 3 | `block` en la rejilla | Sub‑contexto de `GFormGrid`/`GFieldGroup`; sin CSS cruzado | #159; «cada componente estiliza lo suyo» |
| 4 | Orden de manejadores | Contexto y propios primero; prueba de orden en los seis | Lección de CLAUDE.md |
| 5 | Rejilla | §4: `GFormGrid` (`stack`, `data-tier`, `g-form-grid--{wide\|medium\|narrow}`), clases públicas, umbrales `× 176`/`× 104` como constantes; máximos estrechos como **tokens** (`--g-form-max-xs`/`-sm`, se usan en CSS); umbrales `× 200`/`× 190` → Fase 3; avisos `order`/`dense` | #159, #167; #130 |
| 6 | Anuncios al enviar | `live` del contexto: `off` mientras se escriben los revelados por envío | #164 |
| 7 | `warning` y `valid` | Props `warning`/`valid` en los campos y `GFieldGroup`; `warnings` en `GForm`; un solo hueco de mensaje | #164; precedente `GStepper` `status: warning` |
| 8 | Marca «opcional» | Texto visible en el nombre (`labels.optional`), decidido por `marks`; prop `mark` para quitarla | #153 |
| 9 | Prefijo/sufijo de texto | `GInput` `prefix`/`suffix` + `*Label` ya en la Fase 1 (C13); `GNumberField` lo reutiliza | #166 |
| 10 | `GErrorSummary` | §7; `labels.title` String o Function; `navigate` cancelable; `GWidgetConfig` lo compondrá en la Fase 4 | #162; #78 |
| 11 | `GFormSection` | §3: solo fija en la Fase 1; `mode`, `open`, `added`, `headerPlacement`, `labels` reservadas para la Fase 3; insignia con `labels.sectionOptional` de `GForm` | #161 |
| 12 | Alineación de cajas | *Subgrid* solo en `g-form-row` (CSS de cada campo, pistas con nombre); en la rejilla general, alineación superior y regla de contenido | #159 |
| 13 | `GFormReveal` | **Fase 3** | Divulgación es un bloque propio |
| 14 | `GFormActions` | §6: `sticky`, `status`; sin `align` (orden fijado por el usuario); `--g-form-actions-size` publicada por `GForm`; avisos de primaria | #155, #163 |
| 15 | `GFormNav` | **Fase 3** (no reutiliza `GSidebar`) | §1.8 de kiwi |
| 16 | `GRadioGroup` | **Fase 2** | Contrato propio |
| 17 | `GNumberField` | **Fase 2**, **sin moneda** | #154 |
| 18 | Tokens | §9 y `tokens.md` §21: cinco tokens nuevos; solo lectura y estados con existentes; barra de condicional y navegación → Fase 3 | #167; §17.6 |
| 19 | Iconos | Error `circle-alert` (cambio), advertencia `triangle-alert`, válido `circle-check`, resumen `circle-alert`; `minus`/`plus` en la Fase 2 (ya en la lista) | `icons.md`; #85 a #87 |
| 20 | Solo lectura homogéneo | C7: un aspecto común; `GForm readonly` como modo vista | #165 |
