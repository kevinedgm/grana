# Contrato · Sistema de formularios · Fase 1 (núcleo de composición) · revisión r02 (distribución)

**Dueño:** lima · **Estado:** **revisado tras r02** (la distribución de la Fase 1 fue rechazada por el usuario; la dirección de r02 la **aprobó el usuario**, #171) · pendiente de coco (CSS de `GFormLayout`, `GFormRow`, `GInputGroup` y de las pistas de los campos) y de bruno · lo no tocado por r02 (§1 a §3, §6, §7) sigue como lo construyó bruno (commits b4db77c…4a778c7, reconciliado en #170) · **Basado en:** `design/lab/form/r01/` (kiwi; brief del usuario, declaración con 20 hallazgos) y **`design/lab/form/r02/`** (kiwi; `brief.md` con el rechazo del usuario, `declaracion.md` con 11 puntos y 10 hallazgos en §8, `index.html`, `comparacion.html`, `verificar.mjs` 57/57); auditoría interrumpida de coco (`design/lab/form/auditoria.md`) · **Compone:** `GInput`, `GTextarea`, `GSelect`, `GCheckbox`/`GCheckboxGroup`, `GSwitch`, `GDatePicker` (leen el contexto), `GBadge`, `GBtn`, `GIcon` (interno) · **Convive con:** `dialog.md` (envío con `form="id"`), `tabs.md` y `stepper.md` (marcas por pestaña o paso; integración documentada en la Fase 4)
**Tags:** `g-form`, `g-form-section`, `g-form-layout`, `g-form-row`, `g-input-group`, `g-field-group`, `g-form-actions`, `g-error-summary` · composable `useFormField()` · **Categoría:** entradas (composición)

Una **capa de composición** sobre los campos que ya existen: decide **cómo** se reparten, agrupan, marcan, cuándo enseñan sus errores y cómo se envían, sin duplicar ningún campo. La Fase 1 cubre formularios cortos, medianos y en dialog o drawer; los largos con navegación y secciones plegables llegan en la Fase 3 (ver «Fases siguientes»). Decisiones del usuario: DECISIONS.md #153 a #155 y **#171** (dirección r02); derivadas de estándar o de contratos vigentes: #156 a #170 y **#172 a #184** (r02).

**Qué cambió en r02** (resumen; detalle en §4, §5, §10, §13 y «Migración desde la Fase 1»): la rejilla de 12/6/1 columnas (`GFormGrid`) y los anchos máximos de lo compacto se **retiran**; la distribución pasa a **filas explícitas que siempre llenan el ancho** (`GFormLayout` + `GFormRow`), con tamaños que son **peso + mínimo**, líneas calculadas por el ancho propio de cada fila y **tres pistas compartidas** por línea (etiqueta, caja, pie); nace **`GInputGroup`** para campos fusionados («dos en uno»); `GFieldGroup` queda para preguntas compuestas y va siempre en su propia fila; el dato calculado deja de ser una caja (prop `output`).

**Por qué un solo contrato** (#156): las piezas comparten **un** contexto (`formKey`), **un** juego de textos (`labels` de `GForm`), **una** regla de momento de errores y **una** verificación; partirlas obligaría a repetir el contexto en cada una y a mantenerlo sincronizado. Cada pieza tiene su sección con props, estructura, clases y avisos, como si fuera su propio contrato. Los cambios que el sistema trae a los campos existentes se resumen aquí (§10) y se anotan, con su dueño, en el contrato de cada campo. **Numeración estable:** §1 a §12 conservan su número (el código los cita); `GInputGroup`, nuevo, es la **§13**.

---

## Principios

- **Grana presenta y emite intención; no valida ni guarda** (AGENTS.md, #76, #78). Las reglas son de la aplicación (cualquier librería o funciones propias): `GForm` recibe `errors` (`name → mensaje`) **ya calculados** y decide **cuándo** se muestran, construye el resumen y mueve el foco. Un error del servidor entra por la misma vía.
- **Contexto opcional, sin acoplamiento.** Ningún campo importa `GForm`: leen una `InjectionKey` exportada **solo si existe**. Fuera de `GForm` cada campo funciona exactamente como hoy. **La prop explícita del campo siempre gana al contexto.**
- **Componentes donde hay semántica o comportamiento; clases donde solo hay un dato de colocación.** `form`, `section`, filas (miden y calculan), `fieldset`, campos fusionados, resumen y pie son componentes; el **tamaño** de un campo dentro de una fila es una clase (`g-form-w-*`) que sirve también para campos del consumidor y no añade DOM.
- **Sin huecos** (brief r02, #171): toda fila y toda línea de una fila terminan en el **mismo borde** a cualquier ancho; la jerarquía de anchos se expresa como **proporción dentro de la fila**, nunca como ancho absoluto que deja aire a la derecha.
- **Qué va junto lo declara el consumidor** (una `GFormRow` por grupo de campos); nada se empaqueta solo.
- **Las cajas de una línea comparten línea**: ninguna etiqueta, ayuda, mensaje o leyenda puede bajar la caja de un vecino (tres pistas compartidas, §4).
- **Una sola estructura que se adapta por su ancho propio**, nunca por el visor (#69, #73, #130). **Orden del DOM = orden de lectura = orden de Tab = orden visual** en todos los anchos (WCAG 1.3.2, 2.4.3), salvo la excepción acotada del pie apilado (#155).
- **Sin textos por defecto** (Grana es internacional): `labels` sin valores, como en el resto de la librería.
- **Sin `fetch`, sin `action`, sin navegación**: `GForm` siempre cancela el envío nativo y emite.
- **Iconos solo Lucide vía `GIcon`** (`icons.md`).

## Frontera con otros componentes

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Formulario corto (≤ ~6 campos, una idea) | `GForm` + `GFormLayout` (+ `GFormRow` donde haya campos que van juntos), sin secciones ni resumen | Secciones de un campo |
| Varias ideas en una página | `GFormSection` (fija) por idea, con un `GFormLayout` dentro | Tarjetas por sección; acordeón para lo obligatorio |
| Campos distintos que van juntos (Nombre · Apellido; Calle · Ext. · Int.; signos vitales) | **`GFormRow`** con `g-form-w-*` en cada hijo | Anchos sueltos que dejan huecos; `GFieldGroup` (no son una pregunta) |
| **Un dato en varias partes que se lee como uno** (teléfono país + número; valor + unidad; moneda + importe; serie + folio; rango) | **`GInputGroup`** (una caja, una etiqueta, §13) | `GFieldGroup` con etiqueta por parte (las etiquetas de parte bajaban las cajas) |
| **Una pregunta compuesta cuyas partes necesitan su propia etiqueta** (contacto de emergencia: Nombre · Parentesco · Teléfono; fecha en Día · Mes · Año) | `GFieldGroup`, **siempre en su propia fila** (§5) | `GInputGroup` (sus partes no tienen etiqueta visible) |
| Unidad o símbolo fijo (`kg`, `%`, `$`) | `GInput` `prefix`/`suffix` (C13) | `GInputGroup` (no hay nada que elegir) |
| Dato calculado a partir de otro campo (edad desde la fecha) | Prop **`output`** del campo del que depende (§10, C14) | Un campo `readonly` vacío en la fila |
| Proceso secuencial | `GStepper` con un `GForm` por paso o uno con secciones (Fase 4 documenta la integración) | Stepper si cabe en una página |
| Grupos independientes | `GTabs` con paneles montados (#78) | Tabs con dependencia secuencial |
| Formulario en dialog o drawer | `GDialog` (`inset`, `placement="end"`), pie del dialog con `form="id"`; en drawer, `GFormLayout stack` si se quiere un campo por línea | Campos pegados a la carcasa |
| Navegación de secciones, plegables, «Agregar…», condicionales, guardado automático | Fases 3 y 4 | `GSidebar` para navegar secciones (§1.8 de kiwi) |

## Exportaciones

| Exportación | Qué es |
| --- | --- |
| `GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GFieldGroup`, `GFormActions`, `GErrorSummary` | Componentes de composición |
| `GInputGroup`, `GInputGroupInput`, `GInputGroupSelect`, `GInputGroupText` | Campo fusionado y sus partes (§13) |
| `useFormField(options)` | Composable para campos (los de Grana y los del consumidor) |
| `formKey` | `InjectionKey` del contexto, para `provide` manual (pruebas, microfrontends) |

Bruno las registra en `src/index.js`; los estilos entran en `components.css`. **`GFormGrid` se retira** (sin alias; #183).

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
- **`density`:** se comparte con todos los campos, layouts, filas, secciones y pie que **no** traen la suya. Multiplica separaciones y alturas como siempre (#15, #114); no toca tipografía ni mínimos táctiles. El `spacious` del brief es `default`.
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
  <!-- slot por defecto: resumen, secciones, GFormLayout, pie -->
</form>
```

- **`novalidate` siempre**: la validación nativa del navegador (burbujas, foco propio) no convive con mensajes en línea y resumen. Los atributos `required` de los campos se mantienen (exponen «obligatorio» a la tecnología de apoyo).
- **Formularios anidados:** HTML no los permite; un `GForm` dentro de otro avisa en desarrollo y el interior **no** pinta `<form>` (pinta `div`), pero sigue proveyendo su contexto.
- **Región `__message` de los campos y de `GFieldGroup` vacía = sin nodos de texto** (un comentario de Vue vale; un espacio no): el CSS usa `:not(:empty)` (#169).
- **«(opcional)»:** un **espacio de texto** antes del `<span class="g-*__optional">` dentro del `<label>`/`<legend>` (el CSS no pone margen; el nombre accesible necesita el espacio: «Segundo apellido (opcional)»).
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

`GFormLayout`, `GFormRow`, `GFieldGroup` y `GInputGroup` proveen **sub‑contextos** propios (en el layout y la fila: `block` y `stack`; en el grupo: partes, ver §5; en el campo fusionado: partes, ver §13). `GFormSection optional` provee `sectionOptional` (suprime «(opcional)» dentro, ver §3).

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

**Opciones internas** (no contractuales, solo para los campos de Grana; pueden cambiar sin aviso y la documentación pública no las menciona; #170): `markRule` (`both` · `required` · `none`: qué marcas admite el campo; `GSwitch` `none`, `GCheckbox` suelto `required`), `role` (`field` · `group`: `GFieldGroup`/`GCheckboxGroup` no se inyectan a sí mismos como grupo) y `register` (`false`: no se registra, p. ej. casillas de un grupo). Un campo propio del consumidor no las necesita.

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

**Campos propios en una `GFormRow`** (r02, C12): para compartir línea, la raíz del campo propio tiene **tres hijos en flujo** (etiqueta, caja, pie con ayuda y región de mensaje) y su CSS los coloca en las pistas (`grid-template-rows: subgrid` en `.g-form-row > .mi-campo`, etiqueta `align-self: end`). Sin esa estructura, el campo ocupa sus tres pistas como un solo bloque y su caja puede no alinearse.

**Orden de manejadores (lección de CLAUDE.md, hallazgo 4):** los campos con `inheritAttrs: false` fusionan `mergeProps(handlers, ownHandlers, attrs)`: **los del contexto y los propios primero**, las escuchas del consumidor después. Así una escucha `@blur`/`@input` del consumidor ve el estado ya actualizado. Prueba de orden en cada campo, como la de `GInput` y `GCheckbox`.

**Reglas de marca** (`mark`):

- **Dentro de `GForm`**, solo campos **editables** (ni `readonly` ni `disabled`, propios o heredados) llevan marca. **Fuera de `GForm`** la marca no mira `readonly`/`disabled`: el asterisco con `required` sigue exactamente como antes (#170).
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
  <div class="g-form-section__body"><!-- slot por defecto: normalmente un GFormLayout --></div>
</section>
```

- **Sin `aria-labelledby`** en la `<section>`: con nombre sería un punto de referencia `region` y un formulario largo tendría diez (ruido). Los encabezados dan la navegación (WCAG 1.3.1, 2.4.6, 2.4.10).
- `fieldset`/`legend` se reserva para **preguntas** (`GFieldGroup`, radios), no para secciones (W3C WAI «Grouping Controls»).
- La distribución de campos **no** la pone la sección: el consumidor coloca un `GFormLayout` en el cuerpo (una sola responsabilidad; secciones sin campos también son válidas).

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

## 4. Distribución: `GFormLayout` y `GFormRow` (r02; #171 a #176)

Sustituye por completo a la rejilla de la Fase 1 (`GFormGrid`, clases `g-form-w-full`, `g-form-break`, `g-form-row` como clase, `g-form-part-*`, máximos `--g-form-max-*`; #159 y la colocación de #160 quedan **superadas**). Origen: rechazo del usuario (`r02/brief.md`: huecos, bordes dentados, cajas a distinta altura, etiquetas que empujan) y dirección r02 **aprobada por el usuario** (#171).

### Modelo

1. **Dos niveles, ambos explícitos.** `GFormLayout` es una pila vertical de filas; `GFormRow` agrupa los campos **que van juntos**. Lo decide el consumidor; nada se empaqueta solo (como `FormLayout.Group` de Polaris).
2. **Un campo fuera de una `GFormRow` es una fila de uno: ocupa el ancho entero.** También uno compacto (`xs`/`sm`): suelto se estira; la guía es **agruparlo** con lo que lo acompaña (Temperatura con los demás signos, CP con Colonia y Ciudad). Un aviso de desarrollo lo sugiere (#172). No hay modo «con hueco».
3. **Tamaño = peso + mínimo** (clase `g-form-w-*` en el hijo de la fila; por defecto `md`). El peso reparte la fila; el mínimo decide cuándo la fila se parte en líneas (#174).
4. **La fila siempre llena su ancho**: cada línea reparte **todo** su ancho por pesos (menos las separaciones). Todas las filas y líneas terminan en el mismo borde, a cualquier ancho.
5. **Líneas por el ancho propio de la fila** (nunca el visor): si en una línea algún campo recibiría menos que su mínimo, la fila se parte en **líneas contiguas en orden del DOM**, con el **menor número de líneas** y, entre esas, la **más holgada**; cada línea vuelve a llenar el ancho (#175).
6. **Tres pistas compartidas por línea** (etiqueta · caja · pie), que cada campo toma por *subgrid*: las cajas de una línea comparten `top` con cualquier etiqueta, ayuda o mensaje (#176).

### `GFormLayout`

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `stack` | Boolean | | `false` | propia: cada `GFormRow` interior pone un campo por línea (salvo `keep`) |
| `density` | String | `default` `comfortable` `compact` | la de `GForm` o `default` | compartida |

- **Elemento:** `<div class="g-form-layout">`, columna de hijos separados por `--g-form-gap` × densidad. **Cada hijo directo ocupa el ancho entero** (campo suelto, `GFormRow`, `GFieldGroup`, `GCheckboxGroup`, casilla, interruptor, área de texto). **No mide** nada (no tiene `ResizeObserver`): quien mide es cada `GFormRow`.
- **Sub‑contexto:** provee `block: true` (los campos llenan su sitio; la prop explícita gana), `density` y `stack`.
- **`stack`** (r01 §7.3, hallazgo L10): para drawers u otros contenedores donde se quiere una sola columna fija: toda `GFormRow` interior se comporta como una línea por campo, **salvo** las que llevan `keep`. Sin `stack`, un contenedor estrecho ya parte las filas por sus mínimos.
- **Orden:** sin `order` ni posiciones explícitas: DOM = lectura = Tab = visual.
- **Antes de medir y en SSR** no cambia nada (la pila no depende de medidas).

**Clases:** `g-form-layout`, `g-form-layout--stack`, `g-form-layout--density-{d}`.

**Avisos de desarrollo** (`[Grana GFormLayout]`, una vez, al montar):

1. Un **hijo directo con `g-form-w-xs` o `g-form-w-sm`**: «queda solo en su fila y ocupa el ancho entero; agrúpalo con los campos que lo acompañan en una `GFormRow`» (#172). Con `g-form-w-md`/`-lg`: «`g-form-w-*` solo tiene efecto dentro de una `GFormRow`».
2. **Restos de la Fase 1** en el subárbol: `g-form-break`, `g-form-w-full`, `g-form-part-xs|sm`, o un elemento con clase `g-form-row` que no es la raíz de un `GFormRow`: el aviso dice qué usar (tabla «Migración desde la Fase 1»).
3. Un hijo con `order` distinto de 0.

### `GFormRow`

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `keep` | Boolean | | `false` | propia: la fila **nunca** se parte (Día · Mes · Año; partes de una pregunta) |
| `density` | String | `default` `comfortable` `compact` | la del contexto o `default` | compartida |

Slot por defecto: los campos. **Hijos** = los elementos hijos directos del DOM, en su orden (los nodos de texto y comentarios no cuentan; un `v-if` falso no existe). Atributos (`id`, `role`, `aria-label`…) van a la raíz `<div>`, que **no** lleva rol propio (el título de la sección ya nombra el grupo; si una fila necesita nombre, el consumidor pone `role="group"` y `aria-label`).

#### Tamaños (#174)

| Clase en el hijo | Peso | Mínimo | Con `space` 4 | Contenido típico |
| --- | --- | --- | --- | --- |
| `g-form-w-xs` | 2 | `space × 20` | 80px | edad, %, núm. interior, extensión, frecuencia |
| `g-form-w-sm` | 3 | `space × 32` | 128px | fecha, CP, RFC, temperatura con unidad |
| `g-form-w-md` (**por defecto**, sin clase) | 4 | `space × 40` | 160px | nombre, apellido, correo, ciudad, teléfono |
| `g-form-w-lg` | 8 | `space × 60` | 240px | calle, razón social |

- Los **pesos** son los anchos de columna de la Fase 1 (de 12): la jerarquía se conserva como **proporción** (Calle · Ext. · Int. = 8 : 2 : 2; RFC · Razón social = 3 : 8).
- **Pesos y mínimos son constantes de diseño derivadas de `space`, no tokens** (#174): los lee el JS de la fila para decidir las líneas (un token obligaría a leer el estilo calculado de cada hijo y permitiría que un tema cambie **qué** campos comparten línea, que es comportamiento, no aspecto); escalan solos con `space`; mismo criterio que los umbrales medidos (#130) y §17.6 de `tokens.md`.
- **Se conservan las clases** (`g-form-w-*`) en lugar de una prop: los campos ya tienen `size` (altura del control, `api.md`) y una clase sirve igual para campos del consumidor sin añadir props a cada componente. `class` y `style` llegan a la raíz de todos los campos (`rootAttrs`).
- **Mínimo propio** (un fusionado de teléfono necesita sitio para el selector y el número): propiedad pública de **entrada** **`--g-form-min`** en el hijo, **número sin unidad en múltiplos de `space`** (`style="--g-form-min: 50"` = `space × 50`). Mínimo efectivo = el mayor entre el de su tamaño y el propio. coco la **registra** con `@property` (`syntax: '<number>'`, `inherits: false`, valor inicial `0`) en `GFormRow.css`, para que no se herede a las partes de un hijo; la fila la lee del estilo calculado de cada hijo. No es del tema (no va en `tokens.json`; excepción documentada en `levels.test.js`, como `--g-form-actions-size`). Valores de referencia en las recetas (§8, §13).
- **`g-form-w-full`** desaparece: es el comportamiento de un campo suelto. Una clase `g-form-w-*` desconocida avisa y cuenta como `md`.

#### Reparto en líneas (#175, normativo)

Con `A` = ancho de contenido de la fila (`ResizeObserver`, `contentBoxSize` en línea), `g` = separación de columna resuelta, y para cada hijo peso `w` y mínimo efectivo `m` en px:

1. En una línea con los hijos `F`, cada uno recibe `w / Σw(F) × (A − g × (|F| − 1))`. La línea es **admisible** si todos reciben al menos su mínimo (tolerancia 0,5px) **o** si tiene un solo hijo (una línea de uno siempre es admisible: ocupa el ancho entero aunque sea menos que su mínimo; nunca desborda).
2. Entre todas las particiones en **líneas contiguas en orden del DOM** con todas las líneas admisibles, se elige: (a) la de **menos líneas**; (b) entre esas, la que **maximiza el menor cociente ancho recibido / mínimo** de todos sus hijos (evita una línea con un campo apretado cuando hay alternativa); (c) empate exacto: la que pone más hijos en las primeras líneas.
3. **`keep`:** una sola línea siempre; si no caben los mínimos, **ceden los mínimos** (anchos por peso; sin desborde: los hijos tienen `min-inline-size: 0`). **`stack`** del `GFormLayout`: un hijo por línea, salvo `keep`.
4. **Antes de medir, en SSR o sin `ResizeObserver`:** un hijo por línea (nunca desborda; la fila no lleva `data-lines`).
5. **Cuándo se recalcula:** al montar, cuando cambia `A`, y cuando cambian los hijos o sus clases de tamaño (bruno elige el mecanismo; el resultado se actualiza sin recargar). `--g-form-min` se lee en cada cálculo. Las escrituras van **fuera** de la devolución del `ResizeObserver` (en `requestAnimationFrame`) y **solo si cambian** (lección de #169). Se recomienda **un** `ResizeObserver` compartido por todas las filas.
6. **Complejidad:** con hasta 6 hijos se pueden enumerar las 2ⁿ⁻¹ particiones (32); para más, programación dinámica sobre prefijos (el criterio es lexicográfico y separable). Más de 6 hijos avisa en desarrollo.

Resultado verificado por kiwi en el formulario mediano (`r02/declaracion.md` §6): signos vitales en 1 línea a 1280 y 960, 2 a 720 (Temperatura · Presión / FC · Sat. · Peso · Estatura) y 3 a 360; Nombre | Apellido apilados a 360 y juntos a 375; Ext. | Int. juntos a 360.

#### Colocación (contrato bruno ↔ coco)

- **Columnas** = unión ordenada de los bordes de todos los hijos de todas las líneas, con **las separaciones como pistas propias** (la rejilla no usa `column-gap`, porque los bordes de líneas distintas no coinciden); la última pista es `minmax(0, 1fr)` y absorbe el redondeo. **Filas** = tres pistas `auto` por línea (etiqueta · caja · pie) y, entre líneas, una pista de separación: `--_form-row-rows: auto auto auto var(--_form-row-line-gap) auto auto auto …` (#188).
- **Variables dinámicas en línea** (alias `--_*`, excepción justificada como `--_toast-y`, #148; coco las declara en `GFormRow.css` con su valor neutro de «una por línea» y las de línea ganan): en la raíz, **`--_form-row-columns`** y **`--_form-row-rows`**; en cada hijo, **`--_form-row-column`** (`a / b`) y **`--_form-row-line`** (`n / span 3`, con **n = índice de línea × 4 + 1**: tres pistas más la de separación). coco declara los valores neutros (`minmax(0, 1fr)`, `none`; `1 / -1`, `auto / span 3`) **en cada hijo**, no en la fila, para que una fila anidada no herede la colocación de un antepasado. Atributos: **`data-lines`** (número de líneas) en la raíz y **`data-line`** (índice desde 0) en cada hijo.
- **Separación de columna resuelta:** coco declara en `.g-form-row` el alias **registrado** `--_form-row-gap` (`@property`, `syntax: '<length>'`, `inherits: false`) = `--g-form-column-gap` × densidad; la fila lee su valor calculado (px). Separación entre líneas `--_form-row-line-gap` = `--g-form-gap` × densidad (la misma que entre filas: una fila partida se lee como dos filas). Dentro de `GFieldGroup`, coco pone ambas a la mitad (#169).
- **RTL:** las líneas de la rejilla son lógicas; los bordes se calculan en el eje en línea y la fila se espeja sola.
- No hay CSS de `GFormRow` sobre el interior de los campos: **cada campo coloca sus tres partes** en las pistas cuando es hijo de `.g-form-row` (coco, en el CSS de cada campo; §10 C12).

#### Pistas y alineación (#176)

- **Tres pistas por línea:** **etiqueta**, **caja** y **pie** (ayuda + contador + mensaje en un solo contenedor `__support`). El hijo ocupa sus tres filas y las toma con `grid-template-rows: subgrid`.
- **Etiqueta apoyada abajo** de su pista (`align-self: end`): una etiqueta corta queda pegada a su caja aunque la vecina ocupe dos líneas. **Nunca se recorta** (ni elipsis ni límite de líneas; se parte, también palabras largas): recortar escondería «(opcional)» y rompería 1.4.4/1.4.10. Guía de contenido: etiquetas cortas en filas compartidas; la explicación va en la ayuda.
- **Caja:** todas las cajas de una línea comparten `top` (±1px) en cualquier estado. Una caja más alta (área de texto) solo alarga su línea.
- **Pie en una sola pista** (no dos): ayuda y mensaje siguen pegados a su caja; la línea siguiente empieza tras el pie más alto (kiwi §3.2: con dos pistas, el error de un campo se despegaba por la ayuda del vecino).
- Un campo **sin etiqueta visible** deja su pista vacía; su caja sigue alineada.
- **Admitidos como hijos de una fila con más de un hijo:** `GInput`, `GTextarea`, `GSelect`, `GDatePicker` (ni `inline` ni `split`), `GInputGroup`, campos propios del consumidor con la misma estructura de tres hijos (`useFormField`; ver §2) y, en la Fase 2, `GRadioGroup appearance="segmented"` y `GNumberField`. **Van en su propia fila** (hijos directos de `GFormLayout`): `GFieldGroup` y `GCheckboxGroup` (un `<legend>` no participa en la rejilla), `GCheckbox` y `GSwitch` sueltos (no tienen caja que alinear), `GDatePicker inline` y **`GDatePicker split`** (sus etiquetas Inicio/Fin van dentro de la pista de la caja y la bajarían respecto de sus vecinos; #188), otra `GFormRow`, `GFormActions`.

**Clases y atributos:** `g-form-row`, `g-form-row--keep`, `g-form-row--density-{d}`, `data-lines` (raíz, tras medir), `data-line` (hijos, tras medir). La raíz de un `GFormRow` es distinguible de un `div.g-form-row` heredado de la Fase 1 (bruno elige cómo; el aviso 2 de `GFormLayout` lo necesita).

**Avisos de desarrollo** (`[Grana GFormRow]`, una vez por fila, al montar o al cambiar los hijos):

1. Más de 6 hijos: «divide la fila en filas por idea».
2. Un hijo con `order` distinto de 0, dos clases `g-form-w-*`, o una `g-form-w-*` desconocida (incluida `g-form-w-full`).
3. Un hijo **no admitido** (lista de arriba) en una fila con más de un hijo: «va en su propia fila».
4. Una fila de **un solo hijo `xs` o `sm`**: «un campo compacto solo ocupa el ancho entero; agrúpalo con los que lo acompañan» (#172).
5. `--g-form-min` que no es un número positivo.

---

## 5. `GFieldGroup` (#160, revisado en r02: #179)

**Una pregunta compuesta cuyas partes necesitan su propia etiqueta visible** y un solo mensaje: Contacto de emergencia (Nombre · Parentesco · Teléfono), fecha en tres partes (Día · Mes · Año, GOV.UK *date input*). **Ya no** es el patrón del teléfono ni de valor + unidad: un dato que se lee como uno va en **`GInputGroup`** (§13). Campos distintos pero ligados van en `GFormRow`.

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `label` | String | texto libre | sin valor | propia (texto del `<legend>`) |
| `hint` | String | texto libre | sin valor | propia |
| `name` | String | | sin valor | propia (clave del grupo en `errors`) |
| `error`, `warning`, `valid` | String | texto libre | sin valor | propia |
| `required` | Boolean | | `false` | propia (marca de la pregunta) |
| `keep` | Boolean | | `false` | propia (r02): las partes nunca se parten en líneas (Día · Mes · Año) |
| `disabled` | Boolean | | `undefined` → `false` | compartida (nativo del `fieldset`; la prop explícita gana al contexto, #170) |
| `readonly` | Boolean | | `undefined` → `false` | compartida (se propaga a las partes; la prop explícita gana al contexto, #170) |
| `density` | String | | la de `GForm` | compartida |

**`joined` deja de estar reservada** (#160, #168): los campos fusionados son `GInputGroup` (§13).

### Reglas

- **Elemento:** `<fieldset>` + `<legend>` (rol `group` con nombre; WCAG 1.3.1). Sin `label` ni slot `label` avisa en desarrollo.
- **Siempre en su propia fila** (r02, hallazgo L5): hijo directo de `GFormLayout` (o suelto), **nunca** junto a campos independientes en una `GFormRow`: así su `<legend>` no puede bajar las cajas de nadie. Si es hijo de una `GFormRow` con más hijos, avisa (`[Grana GFieldGroup]`, además del aviso 3 de `GFormRow`).
- **Partes:** campos de Grana (o propios con `useFormField`) como hijos. Cada parte conserva **su etiqueta visible**: el grupo nombra la pregunta y la parte nombra su dato.
- **Colocación de partes (r02):** el contenedor de partes **es una `GFormRow`** (`GFieldGroup` la compone: mismo motor de líneas, mismos tamaños `g-form-w-*` en cada parte, mismas tres pistas compartidas, `keep` pasa a esa fila). Separaciones a **la mitad** de `--g-form-gap`/`--g-form-column-gap` (proximidad: una pregunta; #169). Las clases `g-form-part-*` desaparecen.
- **Momento de los errores del grupo:** `errors[name]` del grupo se revela al **salir** de cualquier parte de texto tras haber escrito en ella, o al **cambiar** cualquier parte de elección (además de al enviar), con la misma tabla de §1 (#170).
- **Un solo mensaje:** el del grupo (`error` propio, o `errors[name]`, o el **primer** error visible de sus partes en orden del DOM). Las partes **no pintan** texto de mensaje (su región sigue existiendo, vacía) pero las inválidas llevan `aria-invalid="true"` y su borde de error. El `fieldset` lleva `aria-describedby` → ayuda y mensaje del grupo. **Sin `aria-invalid` en el `fieldset`** (no admitido en el rol `group`, ARIA 1.3); lo llevan los controles.
- **Marcas:** el `<legend>` lleva la marca de la pregunta según `required` y la convención. Una parte lleva su propia marca **solo si difiere** de la del grupo.
- **Resumen y foco:** el grupo es **un** elemento del resumen, que lleva a la **primera parte inválida** (o a la primera parte si el error es del grupo).

### Estructura

```html
<fieldset class="g-field-group" aria-describedby="ID-hint ID-message">
  <legend class="g-field-group__label">Fecha de la última consulta</legend>          <!-- + marca según convención -->
  <div class="g-form-row g-form-row--keep g-field-group__parts" data-lines="1">         <!-- GFormRow compuesta -->
    <div class="g-input g-form-w-xs …"><label …>Día</label>…</div>
    <div class="g-input g-form-w-xs …"><label …>Mes</label>…</div>
    <div class="g-input g-form-w-sm …"><label …>Año</label>…</div>
  </div>
  <div class="g-field-group__support">
    <div class="g-field-group__hint" id="ID-hint">Por ejemplo, 27 3 2026</div>
    <div class="g-field-group__message" id="ID-message" aria-live="polite">…</div>     <!-- siempre presente -->
  </div>
</fieldset>
```

### Clases

`g-field-group`, `g-field-group--density-{d}`, `is-disabled` (además del `:disabled` nativo del `fieldset`), `is-readonly`, `is-invalid`, `is-warning`, `is-valid`, `__label`, `__optional`, `__required`, `__parts` (en la raíz de la `GFormRow` compuesta), **`__support`** (r02: contenedor de ayuda y mensaje), `__hint`, `__message`, `__message-type`, `__message-icon`. **Retiradas:** `g-form-part-xs`, `g-form-part-sm`.

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
- **Orden (decisión del usuario, #155):** en el DOM, **secundarias antes y la primaria al final**; en ancho, alineadas **al final** (a la derecha en LTR), primaria la última, como el pie de `GDialog`. **En estrecho** (ancho propio < `space × 104`, constante medida; la rejilla de la Fase 1 que compartía ese umbral ya no existe, el valor se conserva) la **primaria sube a su propia línea, arriba y a ancho completo**, y **las demás comparten la línea de debajo si caben** (cada una crece; si no caben, una por línea a ancho completo, en orden del DOM) (#185, ajuste sobre #155: con tres botones y estado, medido sobre el componente real, el pie apilado mide **105px a 360px** de contenedor —las dos secundarias caben juntas— y **149px a 320px** —ya no caben juntas y cada una baja a su propia línea, 35 % de un contenedor de 420—, con objetivos de 44px y 2.4.11 intactos en ambos casos). El CSS identifica la primaria por **`g-btn--variant-solid`** (por eso solo puede haber una; aviso 1). Excepción acotada a «DOM = visual»: en ese apilado el Tab recorre las demás en orden del DOM y llega a la primaria al final, aunque se vea arriba. Se acepta porque son acciones adyacentes de un mismo grupo cuyo significado no depende del orden (WCAG 2.4.3 pide un orden que conserve significado y operabilidad) y es decisión del usuario; queda en la verificación con lector real. Una primaria que **no** sea el último botón avisa en desarrollo.
- **Mismo borde que las filas** (r02, hallazgo L9): `GFormActions` ocupa el ancho de su contenedor y sus botones terminan en el mismo borde final que las filas del `GFormLayout`; el apilado se decide por **su propio** ancho.
- **Estado:** región `role="status"` **siempre presente** (vacía si no hay nada; #14) al inicio del pie: «Cambios sin guardar», «Guardado a las 10:42». Texto por `status` o slot `status`; la aplicación lo escribe (no hay textos por defecto). La máquina de autoguardado es de la Fase 4.
- **`sticky`:** pegado al borde inferior del contenedor que se desplaza (`position: sticky`), con fondo propio y línea superior (valores de coco). **Nunca tapa el campo enfocado** (WCAG 2.2 **2.4.11**): `GFormActions` mide su altura (`ResizeObserver`) y la comunica a `GForm` (`setActionsSize`), que la escribe en línea como **`--g-form-actions-size`** (propiedad pública de solo lectura, como `--g-surface-padding`, #131) y añade `g-form--sticky-actions`; **`GForm.css`** da `scroll-margin-block-end: calc(var(--g-form-actions-size) + margen)` a los elementos enfocables de su interior (regla de desplazamiento, no de aspecto de los campos). **Respaldo JS obligatorio** (bruno; #169): en `focusin`, si el elemento queda bajo el pie, desplaza la diferencia más el margen. No es opcional: WebKit ignora `scroll-margin` al enfocar y Chromium deja tapado un `<textarea>` final (lleva a la vista el cursor, no la caja; coco, `design/lab/form/estilo.md`). **La escritura de `--g-form-actions-size` y de `g-form--sticky-actions` va fuera de la devolución del `ResizeObserver`** (en `requestAnimationFrame`) y solo si el valor cambia; si no, WebKit da «ResizeObserver loop completed with undelivered notifications».
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

`g-form-actions`, `g-form-actions--sticky`, `g-form-actions--stacked` y `data-stacked` (bruno emite **los dos**; el CSS acepta cualquiera; dentro del pie de `GDialog` mide el ancho de la fila del pie), `g-form-actions--density-{d}`, `__status`, `__buttons`.

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

## 8. Recetas (documentación, no componentes) (#168, revisadas en r02)

Las partes de una dirección o un teléfono **dependen del país**: un componente cerrado acertaría en uno y estorbaría en los demás. Se documentan como composiciones con `GFormLayout`, `GFormRow` y `GInputGroup`; mora-docs las lleva al README con estos ejemplos. Los valores de `--g-form-min` son los que kiwi midió en r02 (`space` 4).

### Teléfono (con correo y extensión en la misma fila)

```vue
<GFormRow>
  <GInput label="Correo" name="correo" type="email" autocomplete="email" required />
  <GInputGroup label="Teléfono" name="telefono" required style="--g-form-min: 50">
    <GInputGroupSelect v-model="tel.pais" name="tel-pais" part-label="Código de país"
                       :options="paises" autocomplete="tel-country-code" />
    <GInputGroupInput v-model="tel.numero" name="tel-numero" principal type="tel"
                      autocomplete="tel-national" placeholder="951 123 4567" />
  </GInputGroup>
  <GInput class="g-form-w-xs" label="Extensión" name="tel-ext" inputmode="numeric" autocomplete="tel-extension" />
</GFormRow>
```

- **Un solo campo** «Teléfono» (una etiqueta, una caja): nombres accesibles «Teléfono» (número, principal) y «Teléfono Código de país» (selector). La **extensión es otro campo** en la misma fila: es un dato distinto y opcional.
- `paises` con **`value` en el formato del autocompletado** (`'+52'`) y `label` legible (`'MX +52'`), para que el valor que rellena el navegador coincida con una opción.
- `required` en el grupo se propaga a las dos partes (§13). Resultado verificado por kiwi: Correo | Teléfono | Ext. en una línea a 1280–720; Correo / Tel. · Ext. a 480–360; todo apilado a 320.
- Un campo de teléfono dedicado con formato por país sigue siendo de una ronda propia (Fase 5).

### Dirección (México; adaptar las partes a cada país)

```vue
<GFormSection title="Dirección">
  <GFormLayout>
    <GFormRow>
      <GInput class="g-form-w-lg" label="Calle" name="calle" autocomplete="address-line1" required />
      <GInput class="g-form-w-xs" label="Núm. exterior" name="num-ext" required />
      <GInput class="g-form-w-xs" label="Núm. interior" name="num-int" autocomplete="address-line2" />
    </GFormRow>
    <GFormRow>
      <GInput label="Colonia" name="colonia" autocomplete="address-level3" required />
      <GInput class="g-form-w-sm" label="Código postal" name="cp" inputmode="numeric" autocomplete="postal-code" required />
      <GInput label="Ciudad" name="ciudad" autocomplete="address-level2" required />
    </GFormRow>
    <GFormRow>
      <GSelect label="Estado" name="estado" :options="estados" />
      <GInput label="País" name="pais" autocomplete="country-name" />
    </GFormRow>
  </GFormLayout>
</GFormSection>
```

- Calle | Ext. | Int. = 8 : 2 : 2; a 360, Calle sola y Ext. | Int. juntos. «Núm. interior (opcional)» puede partirse en dos líneas **sin bajar su caja** (etiqueta apoyada abajo, §4).
- `autocomplete` correcto en cada parte (WCAG 1.3.5). La búsqueda de dirección es un combobox (Fase 5).

### Signos vitales (medidas con unidad en una fila)

```vue
<GFormRow>
  <GInputGroup class="g-form-w-sm" label="Temperatura" name="temp" required>
    <GInputGroupInput v-model="v.temp" name="temp" principal inputmode="decimal" placeholder="36.5" />
    <GInputGroupSelect v-model="v.unidad" name="temp-unidad" part-label="Unidad" :options="[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]" />
  </GInputGroup>
  <GInputGroup class="g-form-w-sm" label="Presión arterial" name="presion" style="--g-form-min: 38">
    <GInputGroupInput name="pa-sistolica" principal part-label="sistólica" inputmode="numeric" placeholder="120" />
    <GInputGroupText text="/" decorative />
    <GInputGroupInput name="pa-diastolica" part-label="diastólica" inputmode="numeric" placeholder="80" />
    <GInputGroupText text="mmHg" label="milímetros de mercurio" />
  </GInputGroup>
  <GInput class="g-form-w-xs" label="Frecuencia" name="fc" inputmode="numeric" suffix="lpm" suffix-label="latidos por minuto" />
  <GInput class="g-form-w-xs" label="Saturación" name="sat" inputmode="decimal" suffix="%" />
  <GInput class="g-form-w-xs" label="Peso" name="peso" inputmode="decimal" suffix="kg" suffix-label="kilogramos" />
  <GInput class="g-form-w-xs" label="Estatura" name="estatura" inputmode="numeric" suffix="cm" suffix-label="centímetros" />
</GFormRow>
```

- Unidad **fija** → `suffix` de `GInput` (C13); unidad **elegible** → `GInputGroup`. 1 línea a 1280/960, 2 a 720, 3 a 360 (kiwi §2.8).

### Fecha con valor calculado y sexo

```vue
<GFormRow>
  <GDatePicker class="g-form-w-sm" style="--g-form-min: 44" v-model="nac" label="Fecha de nacimiento" name="nacimiento"
               hint="La edad se calcula sola." :output="edad ? `${edad} años` : ''" required />
  <GSelect label="Sexo" name="sexo" :options="sexos" required />   <!-- segmentado: Fase 2, #181 -->
</GFormRow>
```

- **Valor calculado** (#180): la **aplicación** calcula la edad y la pasa en `output`; el campo la pinta como `<output>` dentro de su caja, al final, enlazada por `aria-describedby` («Fecha de nacimiento, 12/05/1990, 36 años»). No es un campo, no se envía y no ocupa sitio en la fila. **No** usar un campo `readonly` vacío para un dato derivado; si una pantalla necesita mostrarlo aparte, es texto (modo vista, `GDataList`).

---

## 9. Tokens (#167, revisado en r02: #182; `tokens.md` §21)

**Tokens del sistema (nombrados aquí; valores de coco en `defaults.css`, capa `grana.defaults`):**

| Token | Para qué | Regla |
| --- | --- | --- |
| `--g-form-gap` | Separación entre hijos de `GFormLayout` (filas) **y entre líneas de una `GFormRow` partida** (una fila partida se lee como dos filas); las partes de `GFieldGroup` usan **la mitad** (#169) | × densidad (1, 0.875, 0.75) |
| `--g-form-column-gap` | Separación entre campos de una misma línea de `GFormRow`; partes de `GFieldGroup`, la mitad | × densidad |
| `--g-form-section-gap` | Separación entre `GFormSection` consecutivas y entre la última sección y `GFormActions` | × densidad; del orden de 2× `--g-form-gap` (kiwi r01 §3.1, r02 §5.2) |

**Retirados en r02** (#182): `--g-form-max-xs` y `--g-form-max-sm`. Ya no hay anchos máximos: lo compacto se expresa como **peso dentro de una fila**. coco los quita de `defaults.css` y bruno de `packages/cli/src/defaults.js` (`scripts/sync-defaults.mjs`).

**Por qué siguen siendo tokens los tres de ritmo:** son el **aire** del formulario, que un producto puede querer ajustar (captura densa frente a configuración aireada), y se usan en CSS (admiten `var()`). Una base por densidad multiplicada (#15, #114).

**No son tokens:**

- **Pesos y mínimos de los tamaños** (`xs` 2 / `space × 20`, `sm` 3 / `× 32`, `md` 4 / `× 40`, `lg` 8 / `× 60`): constantes de diseño leídas por el JS de la fila (#174).
- **`--g-form-min`**: propiedad pública **de entrada** del consumidor (número en múltiplos de `space`), registrada con `@property` sin herencia; no es del tema ni va en `tokens.json` (#174).
- **Alias de colocación de `GFormRow`** (`--_form-row-columns`, `--_form-row-rows`, `--_form-row-column`, `--_form-row-line`, `--_form-row-gap`, `--_form-row-line-gap`): locales, en línea o de coco (§4).
- Umbral de apilado del pie (`space × 104`): constante medida (#155, #130).
- `--g-form-actions-size`: propiedad **pública de solo lectura** (#131, #163).
- **Literales de unidad** (#187; no son tema): `1ch` en `GInputGroup` (convierte el entero `--_input-group-chars` en longitud) y `left: 50%` en el área táctil de `GBtn` (centrar es simétrico en RTL).
- Separación entre título, descripción y cuerpo de una sección, ritmo etiqueta → caja → pie (kiwi propone 6 / 4px), margen del pie fijo, alto de los enlaces del resumen, separaciones internas de `GInputGroup`: derivados de `space` en el CSS de coco.
- **Solo lectura** (#165, revisado por #186, r02 L8): relleno **`--g-color-neutral-soft`** (rol existente; en claro un paso por debajo de la superficie, en oscuro un paso **por encima**, así que ya no es un pozo negro) + borde **discontinuo** en `--g-color-border-control` (3.02:1 sobre ese relleno en el tema por defecto) + texto `--g-color-text`; marcador de posición `--g-color-text-muted`. Casilla e interruptor conservan `surface-sunken` (su relleno es el propio control, no una caja). **Pendiente para el CLI** (bruno): validar `border-control` ≥ 3:1 también sobre `neutral-soft` (claro y oscuro), porque un tema con `neutral-soft` más oscuro haría fallar 1.4.11.
- Advertencia y válido: `--g-color-warning-text` y `--g-color-success-text`.

**Consumidos (existentes):** `--g-space-1`, `--g-font-ui`, `--g-text-{title|body|body-sm|caption}-*`, `--g-text-title-weight`, `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-control`, `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-neutral-soft` (solo lectura, #186), `--g-color-{danger|warning|success}-text`, `--g-surface-*` (fondo del pie fijo), `--g-border-width`, `--g-focus-*`, `--g-duration-*`, `--g-ease-*`; `GInputGroup` además los de `GInput` (caja, radios, alturas por `size`).

## 10. Cambios en los campos existentes (#158, #164, #165, #166; r02: #176, #180)

Afectan a **`GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GCheckboxGroup`, `GSwitch`, `GDatePicker`**. Se anotan en cada contrato («Cambio por el sistema de formularios»). **Dueños:** bruno (`.vue`, pruebas, `meta.json`), coco (CSS de cada campo).

| # | Cambio | Detalle | Dueño |
| --- | --- | --- | --- |
| C1 | **Leen el contexto con `useFormField()`** | `density`, `readonly`, `disabled`, `block` y `error` pasan a default `undefined`; precedencia prop › contexto › default de siempre. Fuera de `GForm`, sin cambios visibles | bruno |
| C2 | **`block` dentro del layout** (r02) | `GFormLayout`, `GFormRow` y `GFieldGroup` proveen `block: true` (antes `GFormGrid`); la prop explícita gana. **`GCheckbox` y `GSwitch` no tienen `block`** (ya ocupan su fila; #170) | bruno |
| C3 | **Marcas** | `GForm` decide: «(opcional)» como texto visible dentro de la etiqueta (`g-<tag>__optional`) o asterisco `aria-hidden` (`g-<tag>__required`), nunca ambos; nueva prop **`mark`** (Boolean, default `undefined`; `false` la quita). Reglas y excepciones en §2 | bruno (marcado), coco (aspecto de `__optional`: texto `--g-color-text-muted`, peso normal) |
| C4 | **Región de mensaje unificada** | La región viva `g-<tag>__error` (`id` `ID-error`) pasa a **`g-<tag>__message`** (`id` `ID-message`): **un** hueco para error, advertencia o válido, siempre presente, `aria-live` = `live` del contexto (`polite`, u `off` mientras se escriben mensajes revelados por un envío). Dentro: icono `GIcon` + prefijo oculto `g-<tag>__message-type` (`labels.error|warning|valid`) + texto. `aria-describedby` incluye `ID-message` mientras haya mensaje. El slot `error` se conserva (contenido rico del error) | bruno, coco |
| C5 | **Estados `warning` y `valid`** | Props nuevas **`warning`** y **`valid`** (String). Sin `aria-invalid`; no bloquean; prioridad error > advertencia > válido. Clases de raíz `is-warning`, `is-valid` (`is-invalid` sigue para el error). Señal no cromática: icono distinto y borde de **estilo** distinto (coco; precedente `GToast`: error sólida, advertencia discontinua), además del prefijo. «Válido» solo con un mensaje útil (no un check gratuito) | bruno, coco |
| C6 | **Iconos del mensaje** | Error **`circle-alert`** (antes `triangle-alert`; coherente con `GStepper`, `GTabs`, `GCard`, `GToast`), advertencia **`triangle-alert`**, válido **`circle-check`** (`icons.md`) | bruno, coco |
| C7 | **Solo lectura homogéneo** | Mismo aspecto en los seis: contraste completo (texto `--g-color-text`, sin opacidad), fondo **`--g-color-neutral-soft`** en las cajas (`GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GInputGroup`; #186; casilla e interruptor siguen con `surface-sunken`), marcador `text-muted`, borde **discontinuo** `--g-color-border-control` (con `soft`, la línea inferior discontinua), cursor normal, **enfocable**, valor **seleccionable** donde el elemento lo permite (en `GSelect`/`GDatePicker`, el texto del valor con `user-select: text`). Distinto de deshabilitado sin depender del color. Semántica sin cambios (nativo en `GInput`/`GTextarea`; `aria-readonly` en los demás). Relleno en oscuro resuelto con `neutral-soft` (r02 L8, #186) | coco (aspecto), bruno (verificar foco y envío) |
| C8 | **Silencio al enviar** | Ver C4: el mensaje revelado por un envío no se anuncia por la región del campo (lo anuncia el resumen o el foco al primer inválido); el revelado al salir del campo **sí** se anuncia | bruno |
| C9 | **Manejadores primero** | `mergeProps(handlers, propios, attrs)`; prueba de orden en los seis | bruno |
| C10 | **Registro** | Cada campo con `name` se registra (`control`, `root`, `required`, `disabled`, error explícito). `GInput`/`GTextarea`/`GCheckbox`/`GSwitch` toman `name` de `$attrs`; `GSelect`/`GDatePicker` de su prop. `GSelect` y `GDatePicker` llaman a `notifyChange()` al elegir (no tienen `input` nativo que burbujee) | bruno |
| C11 | **`GCheckboxGroup` gana `name` y `required`** (#170) | `required` (Boolean): marca en la `<legend>` según la convención (`g-checkbox-group__required` u `__optional`); el `fieldset` lleva `is-disabled`, `is-invalid`, `is-warning`, `is-valid`. `name`: String: clave del grupo en `errors` y `name` por defecto de sus casillas (la casilla con `name` propio lo conserva). Las casillas de un grupo **no** se registran sueltas | bruno |
| C12 | **Tres hijos directos: etiqueta, caja, pie** (r02, #176; **sustituye** a las cuatro pistas de la Fase 1) | En `GInput`, `GTextarea`, `GSelect` y `GDatePicker` (modo campo), la raíz tiene **exactamente tres hijos en flujo**: la etiqueta (`__label`), la caja (`GInput` `__row`, `GTextarea` `__control`, `GSelect` `__control`, `GDatePicker` el contenedor de su campo) y el **pie nuevo `g-<tag>__support`**, **siempre presente** (vacío no ocupa: sin margen propio), que agrupa ayuda (`__messages`/`__hint`, contador), la región `__message` (siempre presente, dentro del pie) y, en `GTextarea`, `__count-live` (#188). Lo demás que cuelgue de la raíz queda **fuera de flujo** y no genera celda: el `<input type="hidden">` y la lista emergente de `GSelect`, la región `__count-live` de `GTextarea` (pasa dentro del pie), el panel de `GDatePicker`. Sin etiqueta visible, la pista queda vacía. coco coloca las tres partes en las pistas de `GFormRow` en el CSS de cada campo (`.g-form-row > .g-input { grid-template-rows: subgrid }`, etiqueta `align-self: end`, nunca recortada). **`GCheckbox`, `GSwitch` y `GCheckboxGroup` no cambian** (van en su propia fila). Un campo propio del consumidor que quiera compartir línea sigue la misma estructura | bruno (estructura), coco (CSS) |
| C13 | **`GInput`: prefijo y sufijo de texto** | Props nuevas **`prefix`**, **`suffix`** (texto visible dentro de la caja: `$`, `kg`, `%`) y **`prefixLabel`**, **`suffixLabel`** (expansión accesible: «kilogramos»). Ver abajo. Los slots `prepend`/`append` siguen siendo **iconos decorativos** | bruno, coco |
| C14 | **Valor calculado: prop `output`** (r02, #180) en **`GInput`** y **`GDatePicker`** | Ver abajo | bruno, coco |

### C13 · `GInput` `prefix`/`suffix` (#166)

- Orden en la caja: `prepend` (icono) · **`prefix`** · `<input>` · **`suffix`** · **`output`** (C14) · `append` (icono) · indicador de carga · botón mostrar/ocultar.
- Accesibilidad: una unidad es **información** (hallazgo 9). Sin `*Label`, el texto visible (`g-input__prefix`/`__suffix`, con `id`) entra en `aria-describedby` **antes** de ayuda y mensaje. Con `*Label`, el texto visible es `aria-hidden` y un texto oculto (`g-input__prefix-label`/`__suffix-label`, con `id`) con la expansión entra en `aria-describedby`. Así «Peso, editar texto, kilogramos».
- Pulsar sobre el prefijo o el sufijo enfoca el `<input>` (comodidad de puntero; no son interactivos ni enfocables).
- **Ubicación de `__prefix-label`/`__suffix-label`:** dentro de `g-input__control`, justo después de su texto visible (`aria-hidden`); es texto oculto accesible, sin efecto en la caja (#169).
- Clases: `g-input--has-prefix`, `g-input--has-suffix`, `g-input__prefix`, `__suffix`, `__prefix-label`, `__suffix-label`. Texto en `--g-color-text-muted` (≥ 4.5:1), tamaño del texto escrito.
- `GTextarea` no gana prefijo ni sufijo (#50). `GNumberField` (Fase 2) reutiliza esta misma regla.

### C14 · Valor calculado: `output` (#180)

| Prop | Tipo | Default | En |
| --- | --- | --- | --- |
| `output` | String | sin valor | `GInput`, `GDatePicker` (modo campo) |

- **Qué es:** un dato que **calcula la aplicación** a partir del valor del campo (la edad desde la fecha, el IMC desde el peso). Grana no calcula nada.
- **Marcado:** `<output class="g-<tag>__output" id="ID-output" for="ID" aria-live="polite">` **dentro de la caja**, al final del texto: en `GInput`, `g-input__output` **inmediatamente tras el sufijo** (dentro de `g-input__control`); en `GDatePicker`, `g-datepicker__output` **tras `__value` dentro del botón** del campo (#188). **Siempre presente** (la región debe existir antes del contenido, #14), vacía **sin nodos de texto** cuando `output` está vacío.
- **Accesibilidad:** con texto, `ID-output` entra en `aria-describedby` del control **después** de prefijo/sufijo y **antes** de ayuda y mensaje; al cambiar se anuncia de forma cortés. No es enfocable ni interactivo; pulsarlo enfoca el control. **No se envía** (un `<output>` no es un control enviable).
- **Aspecto (coco):** texto `--g-color-text` (es un valor, no una ayuda), cifras tabulares, separado del valor escrito; no cambia la altura de la caja. Clase de raíz `g-<tag>--has-output` mientras tenga texto.
- **Patrón documentado:** un dato derivado **no** es un campo `readonly` vacío en la fila (r02 §1.6: «pozo negro» en oscuro). En modo vista o fuera del formulario, es texto (`GDataList`).

---

## 11. Accesibilidad (criterios que el contrato asegura)

| Criterio | Cómo |
| --- | --- |
| 1.3.1 Info y relaciones | `label for`; `fieldset`/`legend` en `GFieldGroup` (y radios en su propia fila, Fase 2); `role="group"` + `aria-labelledby` en `GInputGroup`; secciones con encabezado; ayuda, unidad, valor calculado y mensaje por `aria-describedby` |
| 1.3.2 Secuencia | Líneas **contiguas en orden del DOM** y colocadas en el sentido de lectura (aviso con `order`); excepción acotada del pie apilado (#155) |
| 1.3.5 Propósito de entrada | `autocomplete` pasa al control; en `GInputGroup`, **por parte** (`tel-country-code`, `tel-national`; extensión aparte con `tel-extension`), con un `<select>` nativo para que el navegador pueda rellenarlo (#178) |
| 1.4.1 Color | Error, advertencia y válido con icono, prefijo de texto y estilo de borde; parte inválida de un fusionado con marca propia; solo lectura con borde discontinuo |
| 1.4.4 / 1.4.10 Texto y reflujo | Etiquetas **nunca recortadas** (se parten; la pista absorbe la altura); a 320px ninguna fila desborda (una línea de uno siempre cabe) |
| 2.4.3 Orden del foco | DOM = Tab = visual; foco al resumen o al primer inválido tras enviar; enlace del resumen al control (o a la parte inválida) |
| 2.4.6 Encabezados y etiquetas | Etiqueta visible siempre; «(opcional)» en el nombre; secciones con `hN`; cada parte de un fusionado con nombre propio |
| 2.4.7 / 2.4.11 Foco visible y no oculto | Anillo **por parte** en `GInputGroup`; `scroll-margin` = `--g-form-actions-size` + margen, más respaldo JS |
| 2.5.3 Etiqueta en el nombre | El nombre de cada parte **empieza por la etiqueta visible** («Teléfono Código de país») |
| 2.5.8 Tamaño del objetivo | Los de cada campo y parte (≥ 24px; ≥ 44px táctil sin importar densidad); enlaces del resumen ≥ 24px |
| 3.3.1 Identificación de errores | Texto + `aria-invalid` (en la parte que falla) + prefijo oculto; resumen |
| 3.3.2 Etiquetas o instrucciones | Una convención de marcas por formulario; con asterisco, frase que lo explica; el mensaje de un fusionado dice qué parte corregir |
| 3.3.3 Sugerencia | Mensajes de la aplicación con la corrección (guía en el README; Grana no los escribe) |
| 4.1.3 Mensajes de estado | Mensaje al salir (`polite`); resumen (`alert` + foco); estado del pie (`status`); valor calculado (`<output>` cortés) |

## 12. Verificación (qué y cómo)

### Prueba obligatoria de distribución (r02, #184; la de kiwi, `design/lab/form/r02/verificar.mjs`, adaptada a los componentes reales)

Playwright en **Chromium, Firefox y WebKit** (subgrid, `@property` y `:has()` difieren entre motores), sobre la sección de formularios del playground (corto, mediano con secciones, dirección, fusionados y pregunta compuesta), con el **contenedor** a **1280, 960, 720, 480, 360 y 320px** y la **ventana** a esos mismos anchos con contenedor libre, en **cuatro estados**: limpio; ayuda + error + advertencia + válido; etiquetas largas; ambos. En **cada** caso:

1. **Mismo borde:** cada hijo de cada `GFormLayout` y **cada línea** de cada `GFormRow` (incluida la interior de `GFieldGroup`) termina en el borde final de su contenedor (±1px). Ninguna fila con hueco.
2. **Cajas en la misma línea:** todas las cajas de una línea comparten `top` (±1px), también con etiquetas de dos líneas, ayudas y mensajes en los vecinos.
3. **Sin solapes** entre hijos y **sin desborde** horizontal (ni de la página ni de los contenedores), también a 320px.
4. **Orden visual = DOM** dentro de cada línea (en el sentido de lectura) y de una línea a la siguiente; Tab sigue el DOM (una parada por parte en los fusionados).
5. **Líneas esperadas:** signos vitales 1 / 2 / 3 líneas a 1280 / 720 / 360; Calle sola y Ext. · Int. juntos a 360.
6. **Etiquetas sin recortar:** `scrollWidth ≤ clientWidth` y sin `text-overflow`/`line-clamp` en todas las etiquetas.
7. Consola limpia (sin «ResizeObserver loop»).

Además, densidades `comfortable` y `compact` y `pointer: coarse` en Chromium (las cajas crecen en alto; las comprobaciones 1–3 deben seguir pasando). Un fallo de esta prueba **bloquea** el paso a `candidate` de las piezas del formulario.

### bruno (vitest + jsdom; Playwright para medidas, foco y desplazamiento)

- **Precedencia:** en cada campo, fuera de `GForm` igual que hoy (instantánea de clases y atributos); dentro, hereda `density`/`readonly`/`disabled`/`block`/error; la prop explícita (incluido `false` y `''`) gana.
- **Momento:** vacío al salir no revela; escribir y salir revela; corregir oculta y el siguiente error espera al `blur`; elección revela al cambiar; envío revela todos; `showErrorsOn="submit"`; advertencias con la misma tabla y sin bloquear.
- **Envío:** `preventDefault` siempre; `formnovalidate` emite `submit` con `novalidate: true`; con errores emite `invalid` (orden del DOM, generales al final) y enfoca resumen o primer inválido; sin errores, `submit` con `FormData` y `submitter`; deshabilitados excluidos; `showErrors()`; `reset` cancelado, estado limpio, `update:dirty(false)`; `action` ignorado con aviso; formulario anidado.
- **Silencio:** regiones en `off` mientras se escriben mensajes revelados por envío y `polite` después; al salir del campo, `polite` todo el tiempo.
- **`dirty`:** primer `input`/`change` y `notifyChange()` lo suben; nada lo baja salvo `reset`.
- **Marcas:** convención `optional` y `required` en los seis campos, `GFieldGroup` (parte que difiere) y `GInputGroup` (una marca en la etiqueta); excepciones (`GSwitch`, casilla suelta, sección opcional, solo lectura); nombre accesible con «(opcional)»; `requiredHint`.
- **`GFormRow` (unidad, con anchos simulados):** el algoritmo de §4 con casos de mesa (menos líneas; la más holgada; empate; línea de uno con mínimo mayor que el ancho; `keep` que cede; `stack`; `--g-form-min`; clase desconocida = `md`); SSR y sin `ResizeObserver` = uno por línea; escrituras solo si cambian y fuera de la devolución; `data-lines`/`data-line`; avisos 1 a 5 y los de `GFormLayout` (compacto suelto, restos de la Fase 1).
- **Estructura C12:** en los cuatro campos, exactamente tres hijos en flujo (etiqueta, caja, `__support`), con la región `__message` dentro del pie y siempre presente.
- **`GFieldGroup`:** `fieldset`/`legend`; partes en una `GFormRow` compuesta (`keep`); un mensaje; `aria-invalid` en partes y no en el `fieldset`; enlace del resumen a la parte inválida; aviso dentro de una fila con más hijos.
- **`GInputGroup`** (§13): `role="group"` con nombre; `label for` → principal; nombre de cada parte = etiqueta + nombre de la parte (`getByRole(…, { name, exact: true })`); `aria-describedby` de cada parte (textos no decorativos, ayuda, mensaje) en ese orden; `aria-invalid` solo en la parte que falla (todas con error del grupo); `autocomplete` por parte; `required` propagado y anulable; solo lectura del selector como texto + oculto con el valor; `FormData` con un valor por parte; momento de errores del grupo (#170 (5)); resumen → parte inválida; avisos.
- **`output`** (C14): región siempre presente y vacía sin nodos de texto; en `aria-describedby` solo con texto y en su orden; no aparece en `FormData`.
- **`GErrorSummary`:** `role="alert"` interior, `tabindex="-1"`, foco una vez por envío; enlaces `href` reales; `navigate` cancelable; etiqueta a la vista y foco con `preventScroll`; elementos salen al corregir; oculto sin errores; `labels.title` String y Function.
- **`GFormActions`:** `role="status"` presente vacío; apilado bajo `space × 104` con la primaria sola arriba y las demás compartiendo línea si caben (#185); `--g-form-actions-size` en el `<form>`; Tab por todos los controles de un formulario largo sin ninguno tapado (con y sin respaldo JS); avisos de primaria.
- **Orden de manejadores** en los seis campos; **`GInput` `prefix`/`suffix`** en `aria-describedby` (con y sin `*Label`).
- `check-icons.mjs` y `levels.test.js` sin infracciones (incluidas las excepciones de `--g-form-actions-size` y `--g-form-min`).

### coco (auditoría con un tema distinto al de defecto)

Ritmo de secciones, filas y líneas en las tres densidades; etiquetas apoyadas abajo y partidas sin recorte; «(opcional)» y asterisco legibles (4.5:1); advertencia y válido distinguibles en escala de grises; solo lectura (`neutral-soft`, borde ≥ 3:1 sobre él) frente a deshabilitado frente a editable sin color, también en oscuro (#186); `GInputGroup`: anillo por parte visible (≥ 3:1) y dentro de la caja, marca de la parte inválida sin depender del color, separadores entre partes, selector nativo con `chevron-down` de Lucide, solo lectura y deshabilitado; `<output>` del valor calculado legible y distinto del valor escrito; `forced-colors` (bordes discontinuos, anillo por parte); pie fijo en claro y oscuro; 320px sin desborde; zoom 200 % (reflujo, 1.4.10); `prefers-contrast: more`; **la prueba obligatoria de distribución** repetida con su tema. **Pie fijo apilado** (auditoría hallazgo 6): resuelto por #185 (con tres botones y estado, 105px a 360 y 149px a 320, donde las secundarias ya no caben juntas; antes 177).

### No verificado y pendiente

Lector de pantalla real (VoiceOver, NVDA, TalkBack): doble lectura del resumen (`alert` + foco), silencio `off` → `polite`, «(opcional)» en el nombre, prefijo y sufijo en la descripción, orden del pie apilado, **verbosidad de «Teléfono, grupo; Teléfono Código de país»**, **`<output>` cortés al escribir la fecha**; teclado virtual tapando campos; **autocompletado real del navegador sobre país + número**; zoom 200/400 % y `forced-colors` del anillo por parte; rendimiento con muchas filas (un `ResizeObserver` compartido) y con cientos de campos registrados.

## 13. `GInputGroup`: campos fusionados (r02; #177, #178)

**Un dato en varias partes que se lee como uno:** **una** caja, **una** etiqueta visible, varias **partes** con foco y nombre accesible propios y **un** mensaje (el «dos en uno» que pidió el usuario). Precedentes: Polaris `TextField connectedLeft/Right`, Stripe (prefijo de país en el teléfono), Atlassian/Chakra `InputGroup`. Nombre definitivo **`GInputGroup`** (#177): es un campo de entrada compuesto, no un grupo de preguntas (eso es `GFieldGroup`); «group» coincide con su rol ARIA.

**Casos:** teléfono (país seleccionable + número), valor + unidad elegible (36.5 · °C/°F), moneda + importe (solo estructura: el formato de moneda sigue en su ronda propia, #154), código + número (Serie · folio), rango (18 a 65 años; presión 120 / 80 mmHg). **No es** para una unidad fija (eso es `suffix` de `GInput`, C13) ni para una pregunta cuyas partes necesitan etiqueta visible (`GFieldGroup`, §5).

### Piezas

| Componente | Qué pinta |
| --- | --- |
| `GInputGroup` | Raíz `role="group"`, etiqueta, caja, pie (ayuda + mensaje) |
| `GInputGroupInput` | Una parte de texto: `<input>` sin caja propia |
| `GInputGroupSelect` | Una parte de elección: **`<select>` nativo** sin caja propia (#178) |
| `GInputGroupText` | Un texto fijo entre partes o al final: separador («/», «a») o unidad («mmHg», «años») |

Solo estas cuatro piezas son hijos válidos; `GInput`, `GSelect` u otros campos dentro avisan (cada uno trae su propia etiqueta y caja). **`GSelect` como parte** (opciones ricas, búsqueda) y **`GNumberField` como parte** quedan para la Fase 2 (§ «Fases siguientes»).

### Props de `GInputGroup`

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `label` | String | texto libre | sin valor | propia (etiqueta visible; slot `label`) |
| `hint` | String | texto libre | sin valor | propia (slot `hint`) |
| `name` | String | | sin valor | propia: clave del **grupo** en `errors`/`warnings` (las partes tienen el suyo) |
| `error`, `warning`, `valid` | String | texto libre | sin valor | compartida (C4, C5) |
| `required` | Boolean | | `false` | propia: marca de la etiqueta y `required` por defecto de cada parte |
| `mark` | Boolean | | `undefined` | compartida (C3) |
| `readonly`, `disabled` | Boolean | | `undefined` → `false` | compartida (contexto; la prop explícita gana) |
| `size` | String | los de `GInput` | `md` | compartida (altura de la caja; `api.md`) |
| `variant` | String | `outline` `soft` | `outline` | compartida (como `GInput`) |
| `density` | String | `default` `comfortable` `compact` | la del contexto o `default` | compartida |
| `block` | Boolean | | `undefined` → `false` (dentro del layout, `true`) | compartida |

Atributos (`id`, `class`, `style` con `--g-form-min`…) van a la raíz. El tamaño en una fila se da con `g-form-w-*` como en cualquier campo; su mínimo propio, con `--g-form-min` (valores de referencia: teléfono `50`, presión `38`, copago y folio `38`, rango `43`; kiwi r02).

### Props de las partes

| Prop | `Input` | `Select` | `Text` | Tipo | Default | Para qué |
| --- | --- | --- | --- | --- | --- | --- |
| `modelValue` | sí | sí | | String | `''` | `v-model` de la parte |
| `name` | sí | sí | | String | sin valor | Nombre en `FormData` y clave de la parte en `errors` |
| `partLabel` | sí | sí | | String | sin valor | Nombre de la parte (texto oculto); obligatorio salvo en la principal |
| `principal` | sí | sí | | Boolean | `false` | Destino del `<label for>` (el número, el valor, el importe) |
| `required` | sí | sí | | Boolean | `undefined` → el del grupo | La explícita gana |
| `error` | sí | sí | | String | sin valor | Error de la parte (se muestra en el pie del grupo) |
| `type` | sí | | | String | `text` | `text` `tel` `email` `url` `search` |
| `chars` | sí | | | Number | sin valor | Ancho fijo en caracteres (Serie: 3); sin él, la parte crece |
| `options` | | sí | | Array | `[]` | `[{ value, label, disabled? }]` o grupos `{ label, options }` (como `GSelect`; `<optgroup>`) |
| `placeholder` | | sí | | String | sin valor | Primera opción vacía (`value=""`), `disabled` si la parte es obligatoria |
| `text` | | | sí | String | sin valor | Texto visible |
| `label` | | | sí | String | sin valor | Expansión accesible («milímetros de mercurio») |
| `decorative` | | | sí | Boolean | `false` | Separador sin significado propio («/», «a» entre partes ya nombradas) |

`autocomplete`, `inputmode`, `placeholder` (en `Input`), `maxlength`, `pattern` y escuchas llegan al control nativo por `$attrs` (manejadores propios **primero**, C9). Eventos: `update:modelValue` (y los nativos por `$attrs`), declarados en `emits`.

### Reglas

- **Nombre del grupo:** raíz `role="group"` con `aria-labelledby` → `ID-label` (la etiqueta visible). Sin `label` ni slot `label`, aviso.
- **Parte principal:** la que lleva `principal`; si ninguna, la **primera** parte `Input`/`Select`. El `<label for>` apunta a ella (pulsar la etiqueta la enfoca). Más de una `principal` avisa.
- **Nombre accesible de cada parte = etiqueta visible + nombre de la parte** (2.5.3): una parte con `partLabel` lleva `aria-labelledby="ID-label PARTE-name"` (texto oculto `g-input-group__part-name`): «Teléfono Código de país», «Presión arterial (opcional) sistólica». La principal **sin** `partLabel` se nombra solo por el `<label for>` («Teléfono»). Una parte no principal sin `partLabel` avisa.
- **Descripción:** cada parte lleva `aria-describedby` con, en este orden: los `GInputGroupText` no decorativos (su `label` oculto o, sin `label`, el texto visible con `id`), la ayuda y, **mientras haya mensaje**, `ID-message`. La raíz no lleva `aria-describedby` (evita la doble lectura al entrar).
- **Textos:** con `label`, la parte de texto visible es `aria-hidden` y va **seguida de su hermano** `g-input-group__text-label` (expansión oculta), que entra en la descripción; con `decorative`, `aria-hidden` y nada en la descripción; sin ninguno, el texto visible entra en la descripción. Pulsar un texto enfoca la parte siguiente (o la anterior si es el último).
- **Foco:** **un anillo por parte**, dentro de la caja; la caja **no** se ilumina entera. Tab recorre las partes en orden del DOM; el selector conserva su teclado nativo.
- **Mensajes (uno por campo):** como `GFieldGroup` (§5): el del grupo (`error` propio o `errors[name]`) o, si no hay, el **primero** de sus partes en orden del DOM; luego advertencias y válido. El pie es **del grupo**; las partes no pintan mensaje. Momento de los errores del grupo: al salir de cualquier parte tras escribir o al cambiar un selector, y al enviar (#170 (5)).
- **`aria-invalid`:** **solo en la parte que falla** (su `error` o `errors[nombreDeParte]`); con un error **del grupo** sin parte identificada, en **todas** las partes `Input`/`Select`. La raíz lleva `is-invalid` (borde de error de la caja) y cada parte inválida `is-invalid` (marca propia no cromática, coco). El texto del mensaje dice qué parte corregir («Elige el código de país»; lo escribe la aplicación).
- **Obligatorio:** `required` del grupo pone la marca en la etiqueta (convención de `GForm`, una sola marca) y `required` nativo en cada parte, salvo `required: false` explícito en la parte.
- **Envío:** cada parte envía su `name`; el grupo no tiene valor propio. Se registran el grupo (`name` del grupo, papel de grupo) y cada parte con `name` (no pintan mensaje).
- **Resumen y foco:** el campo es **un** elemento del resumen, que lleva a la **primera parte inválida** (o a la principal con un error del grupo).
- **Solo lectura:** las partes `Input` con `readonly` nativo; la parte `Select` se pinta como `<input type="text" readonly>` con el **texto** de la opción elegida (enfocable, seleccionable, #165) más un `<input type="hidden">` con el valor (un `<select>` no admite `readonly`). Aspecto de solo lectura en la caja (C7).
- **Deshabilitado:** `disabled` nativo en todas las partes (no se envían).
- **Anchos internos:** el selector mide su contenido; la parte principal crece; una parte con `chars` mide esos caracteres (variable dinámica en línea **`--_input-group-chars`, número entero sin unidad**, en el `__part` con `__part--chars`; coco la multiplica por `1ch`, #187); los textos miden su contenido. Separador visual entre partes adyacentes (coco).
- **Autocompletado (#178):** `autocomplete` por parte (`tel-country-code` en el selector, `tel-national` en el número; la **extensión es un campo aparte** con `tel-extension`). Por eso la parte de elección es un **`<select>` nativo**: `GSelect` es un `combobox` con `<input type="hidden">` y no participa del autocompletado (#54, §8 de la Fase 1). Recomendación: `value` en el formato que rellena el navegador (`+52`) y `label` legible (`MX +52`).

### Estructura

```html
<div class="g-input-group g-input-group--size-md g-input-group--variant-outline g-input-group--density-default g-input-group--block g-form-w-md is-invalid"
     role="group" aria-labelledby="ID-label" style="--g-form-min: 50">
  <label class="g-input-group__label" id="ID-label" for="NUM">Teléfono</label>          <!-- + marca según convención -->
  <div class="g-input-group__box">
    <span class="g-input-group__part g-input-group__part--select is-invalid">
      <span class="g-input-group__part-name" id="PAIS-name">Código de país</span>        <!-- texto oculto -->
      <select class="g-input-group__control" id="PAIS" name="tel-pais" autocomplete="tel-country-code" required
              aria-labelledby="ID-label PAIS-name" aria-describedby="ID-hint ID-message" aria-invalid="true">
        <option value="+52">MX +52</option>…
      </select>
      <svg class="g-icon g-input-group__select-icon" aria-hidden="true">…</svg>          <!-- chevron-down -->
    </span>
    <span class="g-input-group__part g-input-group__part--input">
      <input class="g-input-group__control" id="NUM" name="tel-numero" type="tel" autocomplete="tel-national" required
             aria-describedby="ID-hint ID-message">
    </span>
    <!-- texto: <span class="g-input-group__part g-input-group__part--text" aria-hidden="true">mmHg</span>
                <span class="g-input-group__text-label" id="T1">milímetros de mercurio</span> -->
  </div>
  <div class="g-input-group__support">
    <div class="g-input-group__hint" id="ID-hint">Lo usamos solo para confirmar la cita.</div>
    <div class="g-input-group__message" id="ID-message" aria-live="polite">…</div>      <!-- siempre presente; vacía sin nodos de texto -->
  </div>
</div>
```

Tres hijos directos (etiqueta, caja, pie): comparte pistas en una `GFormRow` como cualquier campo (C12).

### Clases

`g-input-group`, `--size-{s}`, `--variant-{v}`, `--density-{d}`, `--block`, `is-disabled`, `is-readonly`, `is-invalid`, `is-warning`, `is-valid`, `__label`, `__optional`, `__required`, `__box`, `__part`, `__part--input`, `__part--select`, `__part--text`, `__part--chars` (con `chars`, además de `__part--input`), `is-invalid` **solo en la parte que falla** (en todas las partes control con un error del grupo), `__part-name`, `__control`, `__select-icon`, `__text-label`, `__support`, `__hint`, `__message`, `__message-icon`, `__message-type`.

### Iconos

`chevron-down` en cada parte `Select` (decorativo, `aria-hidden`); los del mensaje (C6). Ningún otro.

### Avisos de desarrollo (`[Grana GInputGroup]`)

1. Sin `label` ni slot `label`.
2. Menos de dos partes `Input`/`Select` («para una sola parte, usa `GInput` con `prefix`/`suffix`»).
3. Más de una `principal`; una parte no principal sin `partLabel`.
4. Un hijo que no es una parte (`GInput`, `GSelect`, otro campo o un elemento suelto).
5. Una parte fuera de un `GInputGroup` (avisa y pinta el control nativo solo, funcional).
6. `chars` que no es un entero positivo; `options` con valores repetidos.

---

## Migración desde la Fase 1 (#183)

La librería está en `draft`: se cambia **sin capa de compatibilidad**; `GFormLayout` y `GFormRow` avisan en desarrollo con el reemplazo cuando encuentran restos de la Fase 1.

| Fase 1 | r02 | Qué hacer |
| --- | --- | --- |
| `GFormGrid` (12/6/1 columnas, `data-tier`, `g-form-grid--{tramo}`, `stack`) | **`GFormLayout`** (pila de filas; `stack` y `density` se conservan; sin columnas ni tramos) | Renombrar; los hijos que compartían fila se envuelven en `GFormRow`. `GFormGrid` deja de exportarse |
| Clase `g-form-row` (fila unida, 1–3 hijos, *subgrid* de cuatro pistas, no salta) | **`GFormRow`** (componente; mide, parte en líneas, tres pistas; `keep`) | `<div class="g-form-row">` → `<GFormRow>`; sin límite de 3 (aviso a partir de 6) |
| `g-form-w-{xs\|sm\|md\|lg}` = columnas de 12 | **Mismo nombre, nuevo significado:** peso + mínimo **dentro de una `GFormRow`**; fuera de una fila no hace nada (aviso) | Conservar las clases en los hijos de las filas |
| `g-form-w-full` | **Se retira**: es el comportamiento de un campo suelto | Quitar la clase |
| `g-form-break` | **Se retira**: una fila nueva es otra `GFormRow` | Partir el contenido en filas |
| `g-form-part-xs\|sm` (partes de `GFieldGroup`) | **Se retiran**: las partes usan `g-form-w-*` (el contenedor de partes es una `GFormRow`) | Renombrar |
| `--g-form-max-xs`, `--g-form-max-sm` | **Se retiran** (#182) | coco: `defaults.css`; bruno: `defaults.js` del CLI; lima: `tokens.md` §21 (hecho) |
| `--g-form-gap`, `--g-form-column-gap` | Se conservan con significado ampliado (filas y líneas; campos de una línea) | — |
| `GFieldGroup` para el teléfono (País · Número · Ext. con etiquetas de parte) | **`GInputGroup`** (país + número) + Extensión como campo aparte en la misma `GFormRow` | Reescribir la receta (§8) |
| `GFieldGroup` reservado `joined` | **Se retira** la reserva: es `GInputGroup` | — |
| `GFieldGroup` en cualquier celda | **Siempre en su propia fila**; prop nueva `keep` | Sacarlo de las filas compartidas |
| Edad como `GInput readonly suffix="años"` | **`output`** en el campo de la fecha (C14) | Cambiar el ejemplo del playground |
| Sexo (segmentado en kiwi) | `GSelect` hasta la Fase 2 (`GRadioGroup appearance="segmented"`, #181) | — |
| Campos: hijos directos etiqueta · caja · ayuda · mensaje (C12 de la Fase 1) | **Etiqueta · caja · pie** (`__support` con ayuda, contador y mensaje) | bruno cambia el marcado de `GInput`, `GTextarea`, `GSelect`, `GDatePicker`; coco, sus reglas de pista |

## Fases siguientes (reservado; no forma parte de este contrato)

| Fase | Contenido | Motivo de diferirlo |
| --- | --- | --- |
| **2 · Campos imprescindibles** | **`GRadioGroup`/`GRadio`** (`appearance` `list` `inline` `segmented` `chips` `cards`; `fieldset`/`legend`; radios nativos; relación con `GCard selectType="radio"`, #124) y **`GNumberField`** (`<input type="text" inputmode>`, `min` `max` `step` `precision` `locale`, prefijo/sufijo de C13, −/+ opcionales con `minus`/`plus`), **sin moneda** (#154). **Requisitos de r02** (#181): `GRadioGroup appearance="segmented"` usa raíz **`role="radiogroup"` + `aria-labelledby`** hacia una etiqueta visible (no `fieldset`/`legend`) y la estructura de tres hijos (C12), para poder compartir línea en una `GFormRow` (patrón APG *Radio Group*; radios nativos, una parada de Tab y flechas); las demás apariencias siguen con `fieldset`/`legend` y van en su propia fila. **Partes nuevas de `GInputGroup`:** `GSelect` como parte (opciones ricas, búsqueda; sin autocompletado) y `GNumberField` como parte. (`GFieldGroup joined` se retira: es `GInputGroup`, §13) | Sin ellos no hay Sí/No ni campos numéricos; cada uno merece su contrato y su verificación |
| **3 · Divulgación y navegación** | `GFormSection` `mode` `collapsible` (`aria-expanded`, cerrada `inert` pero se envía y valida; el resumen la abre) y `addable` («Agregar…»/«Quitar», foco al título con `tabindex="-1"`); `headerPlacement="auto"` (≥ `space × 200`); **`GFormReveal`** (`when`, `exclude`, `keepValues`, `indent`; `grid-template-rows` sin saltos; `inert` + deshabilitado al cerrar); **`GFormNav`** (`<nav>` con nombre, `aria-current="location"`, estado por sección en texto, *scroll-spy*, ≥ `space × 190`); tokens de la barra de condicional y del ancho de la navegación | Formularios largos; comportamiento nuevo que kiwi verificó pero necesita contrato propio |
| **4 · Estado y guardado** | `GFormStatus` (autoguardado: Guardando/Guardado/Error + Reintentar, revertir); `guard` (`beforeunload` con `dirty`); integración documentada con `GDialog` (cancelar `dismiss` con cambios, confirmación en el pie), `GStepper` (un `GForm` por paso, `status` por paso) y `GTabs` (`status: attention` con conteo); `GWidgetConfig` compone `GErrorSummary` | Depende de la Fase 1 y de los contratos vigentes de esos componentes |
| **5 · Rondas propias de kiwi** | `GCombobox` (prioridad alta), `GFileField`, `GTimeField`, **moneda** (#154), teléfono dedicado, búsqueda de dirección | Cada uno es un componente con su propio patrón APG y sus preguntas |

**Preguntas de producto abiertas: ninguna.** Las tres de kiwi r01 (§17) las respondió el usuario: #153, #154, #155. La dirección de r02 la aprobó el usuario («se ve mucho mejor», #171); la única pregunta de kiwi r02 (§11: el compacto suelto se estira) se resuelve como derivada de «sin huecos» (#172).

## Resolución de hallazgos de kiwi (r01, §15)

> Las filas 3, 5 y 12 (rejilla, `block` en la rejilla, alineación) quedan **superadas por r02** (tabla siguiente); se conservan como historial.

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

## Resolución de hallazgos de kiwi (r02, §8)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Contrato de `GFormLayout` y `GFormRow` | §4: `GFormLayout` (`stack`, `density`, contexto `block`/`stack`; sin medir); `GFormRow` (`keep`; mide su ancho; líneas por §4; columnas = bordes de todas las líneas con separaciones como pistas; tres pistas por línea; `data-lines`/`data-line`; variables `--_form-row-*` en línea); avisos con más de 6 hijos, `order`, hijos no admitidos, compacto suelto | #173, #175 |
| L2 | Pesos y mínimos | Tabla de §4 como **constantes** derivadas de `space` (no tokens: las lee el JS y deciden comportamiento); se conservan las **clases** `g-form-w-*` (la prop `size` ya es la altura del control); mínimo propio con **`--g-form-min`** (número en múltiplos de `space`, `@property` sin herencia); se retiran `--g-form-max-xs/sm` | #174, #182 |
| L3 | Tres pistas, no cuatro | C12 reescrito: etiqueta · caja · `__support` (ayuda, contador y mensaje); `__message` dentro del pie y siempre presente; casilla, interruptor y grupo de casillas sin cambio (van en su propia fila) | #176 |
| L4 | `GInputGroup` | §13: nombre definitivo `GInputGroup`; partes dedicadas `GInputGroupInput`, `GInputGroupSelect` (**`<select>` nativo** por el autocompletado) y `GInputGroupText`; nombre por parte = etiqueta + parte; anillo por parte; un mensaje; `aria-invalid` en la parte; `autocomplete` por parte; solo lectura del selector como texto | #177, #178 |
| L5 | `GFieldGroup` en su propia fila | §5: regla + aviso; partes en una `GFormRow` compuesta con `keep`; `g-form-part-*` y la reserva `joined` se retiran | #179 |
| L6 | Valor calculado | C14: prop **`output`** en `GInput` y `GDatePicker` (`<output for>` en la caja, `aria-describedby`, cortés, no se envía); desaconsejado el `readonly` vacío | #180 |
| L7 | Segmentado en fila | **Fase 2**: `GRadioGroup appearance="segmented"` con `role="radiogroup"` + `aria-labelledby` y tres hijos; hasta entonces el playground usa `GSelect` para Sexo (no es imprescindible para la demo de distribución) | #181 |
| L8 | Solo lectura en oscuro | Resuelto por coco sin token: relleno `--g-color-neutral-soft` (§9, C7); el CLI debe validar `border-control` ≥ 3:1 sobre él | #186 |
| L9 | Acciones en el mismo borde | §6: `GFormActions` termina en el mismo borde que las filas; el apilado se mide con su propio ancho (sin cambio de API) | #155 |
| L10 | Drawer | `GFormLayout stack`: un campo por línea en toda fila salvo `keep` | #173 |
| r02 §11 | Compacto suelto se estira | Aceptado como derivado de «sin huecos»: un campo fuera de fila ocupa el ancho entero; avisos en `GFormLayout` (hijo `xs`/`sm`) y `GFormRow` (fila de un solo `xs`/`sm`) sugieren agrupar | #172 |
