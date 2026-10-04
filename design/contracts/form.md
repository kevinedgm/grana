# Contrato · Sistema de formularios · Fase 1 (núcleo de composición) · revisión r02 (distribución) · Fase 3: `GFormReveal` (§14) y `GFormSection` plegable, agregable, al lado y con línea (§3)

**Dueño:** lima · **Fase 3, `GFormReveal` (§14):** contratado desde `design/lab/form-reveal/r01/` (#274 a #280; cambia `GForm` y `useFormField`: registro inactivo, §2), construido y auditado · **Fase 3, `GFormSection` (§3):** contratado desde `design/lab/form-section/r01/` (#284 a #291; cambia `GForm`, `useFormField`, `revealAndFocus` y `revealKey`, §1 y §2), **pendiente de coco y de bruno, los dos en Opus** · **Estado:** **revisado tras r02** (la distribución de la Fase 1 fue rechazada por el usuario; la dirección de r02 la **aprobó el usuario**, #171) · pendiente de coco (CSS de `GFormLayout`, `GFormRow`, `GInputGroup` y de las pistas de los campos) y de bruno · lo no tocado por r02 (§1 a §3, §6, §7) sigue como lo construyó bruno (commits b4db77c…4a778c7, reconciliado en #170) · **Basado en:** `design/lab/form/r01/` (kiwi; brief del usuario, declaración con 20 hallazgos) y **`design/lab/form/r02/`** (kiwi; `brief.md` con el rechazo del usuario, `declaracion.md` con 11 puntos y 10 hallazgos en §8, `index.html`, `comparacion.html`, `verificar.mjs` 57/57); auditoría interrumpida de coco (`design/lab/form/auditoria.md`) · **Compone:** `GInput`, `GTextarea`, `GSelect`, `GCheckbox`/`GCheckboxGroup`, `GSwitch`, `GDatePicker`, `GRadioGroup` (Fase 2, `radio-group.md`) (leen el contexto), `GBadge`, `GBtn`, `GIcon` (interno) · **Convive con:** `dialog.md` (envío con `form="id"`), `tabs.md` y `stepper.md` (marcas por pestaña o paso; integración documentada en la Fase 4)
**Tags:** `g-form`, `g-form-section`, `g-form-layout`, `g-form-row`, `g-input-group`, `g-field-group`, `g-form-actions`, `g-error-summary`, `g-form-reveal` · composable `useFormField()` · **Categoría:** entradas (composición)

Una **capa de composición** sobre los campos que ya existen: decide **cómo** se reparten, agrupan, marcan, cuándo enseñan sus errores y cómo se envían, sin duplicar ningún campo. La Fase 1 cubre formularios cortos, medianos y en dialog o drawer; los largos con navegación y secciones plegables llegan en la Fase 3 (ver «Fases siguientes»). Decisiones del usuario: DECISIONS.md #153 a #155 y **#171** (dirección r02); derivadas de estándar o de contratos vigentes: #156 a #170 y **#172 a #184** (r02).

**Qué cambió en r02** (resumen; detalle en §4, §5, §10, §13 y «Migración desde la Fase 1»): la rejilla de 12/6/1 columnas (`GFormGrid`) y los anchos máximos de lo compacto se **retiran**; la distribución pasa a **filas explícitas que siempre llenan el ancho** (`GFormLayout` + `GFormRow`), con tamaños que son **peso + mínimo**, líneas calculadas por el ancho propio de cada fila y **tres pistas compartidas** por línea (etiqueta, caja, pie); nace **`GInputGroup`** para campos fusionados («dos en uno»); `GFieldGroup` queda para preguntas compuestas y va siempre en su propia fila; el dato calculado deja de ser una caja (prop `output`).

**Por qué un solo contrato** (#156): las piezas comparten **un** contexto (`formKey`), **un** juego de textos (`labels` de `GForm`), **una** regla de momento de errores y **una** verificación; partirlas obligaría a repetir el contexto en cada una y a mantenerlo sincronizado. Cada pieza tiene su sección con props, estructura, clases y avisos, como si fuera su propio contrato. Los cambios que el sistema trae a los campos existentes se resumen aquí (§10) y se anotan, con su dueño, en el contrato de cada campo. **Numeración estable:** §1 a §12 conservan su número (el código los cita); `GFormReveal` (Fase 3) es la **§14**; `GInputGroup`, nuevo, es la **§13**.

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
| Varias ideas en una página | `GFormSection` (fija) por idea, con un `GFormLayout` dentro; separadas por espacio y título | Tarjetas por sección; acordeón para lo obligatorio; `GDivider` entre secciones (#192, §3) |
| Campos distintos que van juntos (Nombre · Apellido; Calle · Ext. · Int.; signos vitales) | **`GFormRow`** con `g-form-w-*` en cada hijo | Anchos sueltos que dejan huecos; `GFieldGroup` (no son una pregunta) |
| **Un dato en varias partes que se lee como uno** (teléfono país + número; valor + unidad; moneda + importe; serie + folio; rango) | **`GInputGroup`** (una caja, una etiqueta, §13) | `GFieldGroup` con etiqueta por parte (las etiquetas de parte bajaban las cajas) |
| **Una pregunta compuesta cuyas partes necesitan su propia etiqueta** (contacto de emergencia: Nombre · Parentesco · Teléfono; fecha en Día · Mes · Año) | `GFieldGroup`, **siempre en su propia fila** (§5) | `GInputGroup` (sus partes no tienen etiqueta visible) |
| Unidad o símbolo fijo (`kg`, `%`, `$`) | `GInput` `prefix`/`suffix` (C13) | `GInputGroup` (no hay nada que elegir) |
| Dato calculado a partir de otro campo (edad desde la fecha) | Prop **`output`** del campo del que depende (§10, C14) | Un campo `readonly` vacío en la fila |
| Proceso secuencial | `GStepper` con un `GForm` por paso o uno con secciones (Fase 4 documenta la integración) | Stepper si cabe en una página |
| Grupos independientes | `GTabs` con paneles montados (#78) | Tabs con dependencia secuencial |
| Formulario en dialog o drawer | `GDialog` (`inset`, `placement="end"`), pie del dialog con `form="id"`; en drawer, `GFormLayout stack` si se quiere un campo por línea | Campos pegados a la carcasa |
| Campos que solo aplican según una respuesta («¿Requiere factura? Sí → datos fiscales») | **`GFormReveal`** justo después de la pregunta (§14) | Mostrar todo y deshabilitar; `v-if` (pierde lo escrito); una `GFormSection` plegable (se sigue enviando) |
| Información secundaria, avanzada o ya completa que se sigue enviando | **`GFormSection mode="collapsible"`** (§3) | Plegar lo esencial; `GFormReveal` (saca del envío) |
| Bloque opcional que el usuario decide incluir («Agregar datos fiscales») | **`GFormSection mode="addable"`** (§3) | Mostrar todo y deshabilitar; `GFormReveal` (lo decide una respuesta, no un botón) |
| Navegación de secciones, guardado automático | `GFormNav` (Fase 3, sin ronda) y Fase 4 | `GSidebar` para navegar secciones (§1.8 de kiwi) |

## Exportaciones

| Exportación | Qué es |
| --- | --- |
| `GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GFieldGroup`, `GFormActions`, `GErrorSummary` | Componentes de composición |
| `GFormReveal` | Bloque condicional (Fase 3, §14) |
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
- **`readonly`:** «modo vista» del formulario entero: todos los campos sin `readonly` propio pasan a solo lectura (aspecto unificado, #165). No oculta acciones: la aplicación decide qué pie muestra. Es también el atributo del **bloqueo con interruptor** (§8, «Patrón: bloqueo con interruptor», #266).
- **`disabled`:** todos los campos sin `disabled` propio pasan a deshabilitados (no se envían). Para un bloque que no aplica: `GFormReveal` (§14). **No** sirve para bloquear un formulario ya capturado: eso es `readonly` (#266).
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
| Cambio en un control de elección (`GCheckbox`, `GCheckboxGroup`, `GRadioGroup`, `GSwitch`, `GSelect`, `GDatePicker`; `trigger: 'change'`) | **Revela** | — |
| Envío (`submit`) o `showErrors()` | **Revela todos** | **Revela todos** |
| `errors[name]` pasa a vacío (corregido) | **Oculta** el revelado: el próximo error de ese campo espera al siguiente `blur` o envío | Igual (espera al siguiente envío) |
| `reset` del formulario o `resetState()` | Todos sin editar ni revelar | Igual |

Las advertencias (`warnings`) siguen la misma tabla. Un **`error` explícito** en el campo (prop) se muestra siempre, sin momento (como hoy), y **cuenta** para el bloqueo y el resumen.

### Envío (#157)

1. `GForm` escucha `submit` del `<form>` y **siempre** llama a `preventDefault()`.
2. Si el botón que envía (`event.submitter`) lleva **`formnovalidate`** (p. ej. «Guardar borrador»), no se revela ni se comprueba nada: emite `submit` con `novalidate: true`. Es la semántica nativa del atributo (HTML), y cubre el borrador que no valida de kiwi (§5.9).
3. Si no: revela todos los campos **activos** (los de un `GFormReveal` inactivo no, §2 «Registro inactivo»); los mensajes que aparecen por este envío se escriben con la región viva del campo en **`off`** y vuelven a `polite` en el cuadro siguiente (#164; el resumen ya los anuncia). Tras `nextTick` (para que la aplicación haya recalculado `errors`), reúne los **errores que bloquean**: el error resuelto (prop explícita o `errors[name]`) de cada campo **registrado, no deshabilitado y activo**, más las claves de `errors` con texto que **no** corresponden a ningún campo registrado, activo o inactivo (errores generales o de servidor).
4. **Con errores:** emite `invalid`, **abre las `GFormSection collapsible` plegadas que contienen un error que bloquea** (en un cuadro, sin animar; §3 «Abrir antes de enfocar», #287), **marca cada campo que bloquea con `is-rejected`** (sacudida única, #304; ver §2 «Rechazo al enviar» e `input.md` «Personalidad») y mueve el foco: al `GErrorSummary` del formulario si hay uno montado; si no, al **primer control inválido** en orden del DOM, desplazando para que se vea su etiqueta (respetando el pie fijo).
5. **Sin errores:** emite `submit` con `FormData` construido con el `submitter` (así la aplicación distingue «Guardar» de otros botones de envío por su `name`/`value`).
6. **Errores del servidor:** la aplicación los pone en `errors` tras la respuesta y llama a `showErrors()`, que hace los pasos 3 y 4 sin emitir `invalid` de nuevo. `is-rejected` también se pone (decisión del usuario 3, #304).

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
| `showErrors()` | Revela todos, abre las plegadas con error que bloquea y mueve el foco (resumen o primer inválido), como un envío con errores pero sin emitir. Para errores asíncronos o del servidor. Devuelve una promesa con la lista |
| `focusFirstError()` | Enfoca el primer control con error visible (etiqueta a la vista), abriendo antes la sección plegada que lo contiene (#287). Devuelve **`Promise<boolean>`** (`true` si encontró un control): con una sección que abrir, el foco llega tras un `nextTick` |
| `resetState()` | Limpia editados, revelados y `dirty` **sin** tocar valores (p. ej. tras guardar y recargar datos). Se llama así y no `reset()` para no confundirlo con `form.reset()` |

### Textos (`labels`, sin valores por defecto)

| Clave | Dónde | Si falta |
| --- | --- | --- |
| `optional` | Marca de los campos opcionales con `marks="optional"` («(opcional)») | Aviso en desarrollo la primera vez que un campo la necesita; **sin marca** |
| `requiredHint` | Párrafo al principio con `marks="required"` («Los campos con * son obligatorios») | Aviso en desarrollo; sin párrafo |
| `sectionOptional` | Insignia de `GFormSection optional` («Opcional») | Aviso en desarrollo al usarla; sin insignia |
| `sectionErrors` | Estado de errores de una `GFormSection collapsible` plegada («1 error», «3 errores»): **String** con `{count}` o **Function** `(count) => String` (plurales del idioma), como `labels.title` de `GErrorSummary` (§3, #286) | Aviso en desarrollo la primera vez que una plegada tiene errores visibles; **sin estado** (un icono solo no basta, 1.4.1) |
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
2. Falta `labels.optional`, `labels.requiredHint`, `labels.sectionOptional`, `labels.sectionErrors` o un prefijo `labels.error|warning|valid` cuando se necesita (una vez cada uno).
3. `action` o `method` en `$attrs` (se ignoran).
4. `GForm` dentro de otro `GForm`.
5. Más de un `GErrorSummary` o más de un `GFormActions sticky` en el mismo formulario.
6. Un `name` de `errors` con texto que no corresponde a ningún campo registrado **al enviar** se lista sin enlace (no es error de uso; sin aviso).

---

## 2. Contexto y `useFormField()` (#158)

### Qué provee `GForm` (`formKey`)

Estado reactivo de solo lectura para los campos: `density`, `marks`, `readonly`, `disabled`, `labels`, `headingLevel`, `live` (`polite`/`off`), y funciones `register(entry)` → `unregister`, `notifyInput(name)`, `notifyBlur(name)`, `notifyChange(name)`, `isShown(name)`, `setActionsSize(px)`. Es **interno**: el contrato público es `useFormField()`; `formKey` se exporta solo para `provide` manual.

`GFormLayout`, `GFormRow`, `GFieldGroup` y `GInputGroup` proveen **sub‑contextos** propios (en el layout y la fila: `block` y `stack`; la fila, además, la función interna `setIntrinsicMin(el, px)` para el mínimo intrínseco de un hijo, §4, #271; en el grupo: partes, ver §5; en el campo fusionado: partes, ver §13). `GFormSection` provee **`sectionKey`** (interna): `optional` (suprime «(opcional)» dentro, ver §3) y, desde la Fase 3, **`register(entry)` → `unregister`** (recuento de errores por sección; la sección lo propaga a sus secciones ancestro) y **`notifyEdit()`** (marca la sección como editada para la confirmación de «Quitar», §3, #286, #288). **`GFormReveal`** y **`GFormSection mode="addable"`** proveen la clave interna **`revealKey`** (`{ active, fromReveal }`, ver «Registro inactivo») y `GFormReveal` re‑provee el sub‑contexto de distribución (§14).

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

### Rechazo al enviar (`is-rejected`, #304)

Interno (no contractual para campos del consumidor en v0.1; puede hacerse público si un producto lo pide). Reglas para bruno:

| Pieza | Regla |
| --- | --- |
| `GForm` | Conjunto reactivo interno de nombres **rechazados**. En el paso 4 de «Envío» y en `showErrors()`: vacía el conjunto y, en el cuadro siguiente (`requestAnimationFrame`), añade los nombres de los registros que bloquean (los mismos de `blocking()`: activos, no deshabilitados; las claves generales no tienen campo). Nunca con `formnovalidate`. Nunca por cambios de `errors` sin `showErrors()` |
| `useFormField` / `useCompositeField` | Devuelve entre los **internos** `rejected` (computado: el nombre está en el conjunto) y una función `endRejected()`. `notifyInput`/`notifyChange` del campo lo sacan del conjunto. Los grupos lo resuelven una vez (una pregunta) |
| Campo de Grana | Pinta `is-rejected` en su raíz mientras `rejected`; escucha en la raíz `animationend` y `animationcancel` y llama a `endRejected()` solo si `event.animationName` empieza por `g-reject`. Al desmontarse, sale del conjunto |
| CSS | Coco, por campo; keyframes `g-reject…` con nombre propio por componente. Pieza que se mueve y nombre de cada uno en la tabla de `input.md` «Personalidad» I2 (`GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GSwitch`, `GDatePicker`, `GCheckboxGroup`, `GRadioGroup`, `GFieldGroup`, `GInputGroup`); `GDatePicker inline` no tiene campo y no se mueve (la clase llega igual). Nada con `prefers-reduced-motion: reduce` |

### Registro inactivo (`GFormReveal`, #276; `GFormSection addable`, #288)

Un campo dentro de un `GFormReveal` **inactivo** (§14: `when` falso en él o en un bloque ancestro) o de una **`GFormSection addable` sin agregar** (§3) **sigue registrado** pero no cuenta. Reglas para bruno (nombres exactos; todo es interno salvo el comportamiento):

| Pieza | Cambio |
| --- | --- |
| `formContext.js` | Nueva clave **interna** `revealKey` (`Symbol('GFormReveal')`, **no** se exporta desde `src/index.js`). Valor provisto: `{ active: ComputedRef<boolean>, fromReveal: boolean }`. **`active`** = el estado propio **y** el `active` del `revealKey` ancestro, si lo hay (así se componen bloques y secciones agregables en cualquier orden). **`fromReveal`** (#288): `true` si lo provee un `GFormReveal` **o** si el ancestro ya lo tenía; una `GFormSection addable` provee `fromReveal` = el del ancestro (`false` sin él). El aviso 3 de §14 («`GFormSection` dentro de un `GFormReveal`») sale solo con `fromReveal` verdadero: una sección dentro de una agregable no avisa |
| `useFormField` | Inyecta `revealKey` (opcional) y `sectionKey` (opcional): registra su entrada **también** en la sección más cercana cuando la registra en `GForm` (misma condición y mismo `unregister`), y su `notifyChange()` llama además a `notifyEdit()` de la sección (#286, #288). `inactive = computed(() => reveal ? !reveal.active.value : false)`. El registro (`entry`) gana **`inactive: () => inactive.value`**. Devuelve `inactive` entre los **internos** (no se documenta como API pública). Funciona igual en los campos propios del consumidor, sin cambios en su código |
| `useCompositeField` | El registro del grupo gana `inactive: () => ff.inactive.value` (sus partes ya lo traen por su propio `useFormField`) y se registra también en la sección más cercana (una pregunta, como en `GForm`) |
| `GForm` · `blocking()` | Salta los registros con `inactive()` (como `inGroup` y `disabled()`), pero **sus nombres siguen en `covered`**: sus claves de `errors` **no** son generales |
| `GForm` · `revealAll()` | No añade a `shownErr`/`shownWarn` los nombres de registros inactivos; de las claves de `errors`, solo las que no pertenecen a un registro inactivo |
| `GForm` · `focusFirstError()` | Salta los inactivos. Desde la Fase 3 de `GFormSection`, abre antes la sección plegada (§3 «Abrir antes de enfocar», #287) |
| `GForm` · `visible(n, kind)` / `isShown(n)` | `''` / `false` si `n` es nombre de un registro inactivo |
| `GForm` · `notifyInput` / `notifyBlur` / `notifyChange` | Con un nombre inactivo no marcan editado ni revelan (`notifyChange` sigue subiendo `dirty`) |
| `GForm` · al pasar a inactivo | Un `watch` sobre el conjunto de nombres inactivos: los que entran salen de `edited`, `shownErr` y `shownWarn`, y las claves de sus registros salen de la **instantánea** del resumen (`snapshot`). Silencioso (como al corregir, #162) |
| `GForm` · al volver a activo | Nada: empiezan sin editar ni revelar; el resumen los recupera solo en el siguiente envío o `showErrors()` |
| `GForm` · `invalid`, `submit` | `invalid` no los lista (sale de `blocking()`); `submit` **sin** campo nuevo (#277): el `FormData` ya los excluye por el `fieldset disabled` |
| Aviso 1 de `GForm` | Sin cambio: un `name` repetido avisa también entre bloques excluyentes (§14, «Colocación») |

**Abrir antes de enfocar** (§3, #287): `revealAndFocus(control, root)` (interno de `formContext.js`) despacha antes el evento interno `OPEN_REQUEST` (`'g-open-request'`, burbujea, cancelable) desde el control; si alguien lo cancela, espera un `nextTick` y después desplaza y enfoca. Devuelve una `Promise`. `GForm` despacha la misma petición para **cada** error que bloquea antes de mover el foco tras un envío o `showErrors()`.

**Por qué no desregistrar:** `errors.curp` pasaría a error general sin enlace y **bloquearía** el envío; así la aplicación calcula `errors` **sin condiciones**. **Por qué no `disabled()`:** cambiaría el aspecto y la precedencia del campo (#158). Medido en el prototipo de kiwi (`design/lab/form-reveal/r01/index.html`, `XFormReveal`, que lo simula con un contexto intermedio: **referencia de comportamiento, no de implementación**; no cubre `showErrors()`).

---

## 3. `GFormSection` (Fase 1: fija, #161 · Fase 3: plegable, agregable, encabezado al lado y línea, #284 a #291)

Agrupa una **idea** (Información básica, Contacto, Dirección). Jerarquía por **espacio y tipografía**, sin tarjetas. **Fase 3** (kiwi `design/lab/form-section/r01/`: `brief.md`, `declaracion.md` con 40 puntos y los hallazgos L1 a L12, `index.html` con `XFormSection` sobre los componentes reales, `verificar.mjs` 176/176 en los tres motores; commit `b0a4dc0`): tres **modos** (`static`, `collapsible`, `addable`), encabezado **al lado** por su ancho propio (`headerPlacement`) y **línea** opcional con la sección anterior (`divider`). **Componente complejo** (CLAUDE.md, «Modelos por rol»: compone `GBtn`, `GDialog` y `GDivider`, se solapa con `GFormReveal`, cambia `GForm`, `useFormField` y el foco de `GErrorSummary`): **coco y bruno en Opus**.

**Qué es cada modo** (#284):

| Modo | Lo decide | Cerrada / sin agregar | Datos |
| --- | --- | --- | --- |
| `static` (por defecto) | — | — | Como siempre (#161). Su DOM no cambia en la Fase 3 salvo por `headerPlacement`, `divider` y las acciones que bajan de línea (L9) |
| `collapsible` | El usuario, con el botón del título | Panel `inert`, **sin** `fieldset disabled` | **Siguen en el formulario** plegada: van en `FormData`, se registran, bloquean el envío, salen en el resumen. Para lo secundario, avanzado o ya completo; **nunca para lo esencial** (form r01 §3.5) |
| `addable` | El usuario, con «Agregar …» | Panel `inert` + `fieldset role="none" disabled`; registro **inactivo** (#276) | Sin agregar **no existen** para el formulario (ni `FormData`, ni Tab, ni errores, ni resumen) aunque la aplicación calcule sus errores sin condiciones. «Quitar» **descarta** |

**Frontera con `GFormReveal`** (§14): allí **decide una respuesta** y cerrado **conserva** lo escrito (3.3.7: una respuesta cambia de paso con las flechas); en `addable` **decide el usuario** con un botón explícito y «Quitar» descarta (con confirmación si hay algo que perder). `collapsible` no saca nada del envío. Los tres comparten la técnica de transición (§14 «Transición», #278).

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `title` | String | texto libre | sin valor | propia |
| `description` | String | texto libre | sin valor | propia |
| `headingLevel` | Number | 2 a 6 | el de `GForm` (3) | propia |
| `optional` | Boolean | | `false` | propia |
| `mode` | String | `static` `collapsible` `addable` | `static` | propia (#284) |
| `open` | Boolean | | `false` | propia; `v-model:open`; solo `collapsible` |
| `added` | Boolean | | `false` | propia; `v-model:added`; solo `addable` |
| `summary` | String | texto libre | sin valor | propia; solo `collapsible`, visible plegada |
| `headerPlacement` | String | `top` `auto` | `top` | propia; los tres modos (#289) |
| `divider` | Boolean | | `false` | propia; los tres modos (#192, #290) |
| `labels` | Object | `{ add, remove, removeTitle, removeBody, removeConfirm, removeCancel }` | `{}` (función) | propia; solo `addable` (sin valores por defecto) |

- **`title`:** obligatorio en la práctica: sin `title` ni slot `title` avisa en desarrollo.
- **`optional`:** insignia `GBadge` con texto `labels.sectionOptional` de `GForm` (texto, no color), `size="sm"`, `variant="soft"`, `color="neutral"`; y suprime el «(opcional)» de sus campos. En `collapsible` la insignia va **fuera** del botón (el nombre del botón no cambia por ser opcional). En `addable` **no se pinta** (el botón «Agregar …» ya dice que es opcional) y avisa (aviso 5); sigue suprimiendo el «(opcional)» de sus campos.
- **`mode`:** estructural. Se espera fijo durante la vida de la sección; si cambia tras montar, avisa (aviso 8) y la sección se pinta en el modo nuevo con el estado de sus props.
- **`open`** (`collapsible`): `true` = abierta. **Controlado y no controlado**: la sección guarda un estado local que parte de `open` y lo sigue cuando la prop cambia (patrón de `dirty` en `GForm`); cada cambio que hace la sección (botón, apertura para llevar a un campo) emite `update:open`. Sin `v-model` funciona igual (la aplicación no se entera). Con otro modo: se ignora y avisa (aviso 1).
- **`added`** (`addable`): `true` = agregada. Controlado y no controlado como `open`; «Agregar …» y «Quitar …» emiten `update:added`. **Agregar por programa** (`added` pasa a `true` desde la aplicación: datos ya guardados) **no mueve el foco**. **Quitar por programa** (`false` desde la aplicación) descarta igual que «Quitar …» (vuelve a montar el cuerpo) y, si el foco estaba dentro, lo lleva a «Agregar …» (nunca a `<body>`). Con otro modo: se ignora y avisa (aviso 2).
- **`summary`** (y slot `summary`, que gana): texto de la **aplicación** para la línea de estado de una sección plegada («Completa», «Español · CDMX», «Falta el teléfono»). Grana **no sabe** si una sección está completa (no valida): no hay estado «completa» automático ni marca propia. Sin nada interactivo (aviso 7). Con otro modo: no se pinta y avisa (aviso 3).
- **`headerPlacement`:** `top` = encabezado arriba (como hoy). `auto` = **al lado** cuando el ancho **propio** de la sección es ≥ `space × 200` (constante derivada de `space`, sin token, como #130; umbral de form r01 §3.4); arriba por debajo. Ver «Encabezado al lado».
- **`divider`:** línea decorativa con la sección anterior, **dentro** del hueco que ya las separa (reglas de #192, concretadas en «Separación entre secciones»).
- **`labels`** (`addable`): textos **completos** de cada sección, no plantillas (#284): `add` («Agregar datos fiscales»: texto y nombre accesible de «Agregar …»; el título solo, «Datos fiscales», no dice la acción, y una plantilla con `{title}` rompería mayúsculas y concordancia), `remove` («Quitar datos fiscales»: único en la página, 2.4.6), `removeTitle` («¿Quitar los datos fiscales?»), `removeBody` («Se descartará lo que escribiste en esta sección»; opcional), `removeConfirm` («Quitar»), `removeCancel` («Cancelar»). Sin `add`, **no se pinta** «Agregar …» (la aplicación aún puede agregar con `added`); sin `remove`, no se pinta «Quitar …»; sin `removeTitle`, `removeConfirm` o `removeCancel`, «Quitar …» **quita sin confirmar** (no se pinta un diálogo sin nombre ni botones sin texto). Las tres situaciones avisan (aviso 4). Precedente: `closeLabel` de `GDialog` (sin texto, sin botón).
- `id`, `class` y demás atributos van a `<section>`. El `id` (del consumidor o generado con `useId`) es la **base** de los `id` internos (`{id}-toggle`, `{id}-panel`, `{id}-summary`, `{id}-add-description`, `{id}-title`); el generado **no** se escribe en la raíz (el DOM de la sección fija no cambia). Los anclajes y `GFormNav` usan el `id` del consumidor.

**Ya no hay props reservadas**: el aviso «reservadas para la Fase 3» se retira.

### Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:open` | `Boolean` | `collapsible`: el usuario abre o pliega con el botón, **y también** cuando la sección se abre para llevar a un campo (envío, `showErrors()`, enlace del resumen, `focusFirstError()`): la aplicación ve el estado real |
| `update:added` | `Boolean` | `addable`: el usuario pulsa «Agregar …» (`true`) o quita (`false`; tras confirmar si hubo diálogo) |

**Ningún otro** (#284): sin `toggle`, `add` ni `remove`. `update:added` con `false` **es** «el usuario quitó la sección»: la aplicación vacía **su** modelo de esa sección al recibirlo (receta para mora-docs; el modelo es suyo, #266). Ambos en `emits`. Quien necesite el final de la animación escucha `transitionend` en el panel (como §14).

### Slots

| Slot | Propósito | Anatomía |
| --- | --- | --- |
| `lead` | Icono decorativo antes del título (normalmente un `GIcon`; #203). **Sin icono por defecto** | En `__lead` (`aria-hidden`), fuera del `hN` en `static`/`addable`; en `collapsible`, **dentro del botón**, después del chevron (fuera, pulsar el icono no plegaría). No entra en el nombre; nada interactivo |
| `title` | Título con contenido rico | Dentro del `hN` (en `collapsible`, dentro del botón); nada interactivo |
| `description` | Descripción rica | En `__description` (en `addable` sin agregar, debajo de «Agregar …» y unida a él por `aria-describedby`) |
| `summary` | Texto de estado de la aplicación (gana a la prop). Admite un `GIcon` (con o sin `label`) o un `GBadge` de la aplicación | En `__summary-text`, dentro de `__summary`; solo `collapsible` plegada; nada interactivo (aviso 7) |
| `actions` | Acciones secundarias de la sección (`GBtn` `ghost`/`outline`) | En `__actions`, **visibles abierta y plegada** (#285); en `addable`, antes de «Quitar …»; nunca la primaria del formulario |
| `help` | Ayuda contextual (`GHelper`) | En `__help` |
| default | Un `GFormLayout` con los campos (#283); o contenido que no son campos | En `__body` (contenedor simple, no pila); en `collapsible`/`addable`, dentro de `__panel` |

### Estructura

**`static`** (Fase 1, sin cambios):

```html
<section class="g-form-section g-form-section--mode-static" id="datos">
  <hr class="g-divider … g-form-section__divider" aria-hidden="true">   <!-- solo con divider -->
  <div class="g-form-section__header">
    <div class="g-form-section__heading">
      <span class="g-form-section__lead" aria-hidden="true">…</span>   <!-- solo con slot lead (#203) -->
      <h3 class="g-form-section__title">Datos fiscales</h3>
      <span class="g-badge …">Opcional</span>                  <!-- solo con optional -->
    </div>
    <p class="g-form-section__description">Solo si el paciente pide factura.</p>
    <div class="g-form-section__actions">…</div>               <!-- slot actions: acciones secundarias (Copiar de…) -->
    <div class="g-form-section__help">…</div>                  <!-- slot help: GHelper -->
  </div>
  <div class="g-form-section__body"><!-- slot por defecto: un GFormLayout con los campos (#283) --></div>
</section>
```

**`collapsible`** (#285; anatomía de kiwi, puntos 4 a 13):

```html
<section class="g-form-section g-form-section--mode-collapsible is-ready" id="avanzada">        <!-- abierta: is-open -->
  <hr class="g-divider … g-form-section__divider" aria-hidden="true">                            <!-- solo con divider -->
  <div class="g-form-section__header">
    <div class="g-form-section__heading">
      <h3 class="g-form-section__title">
        <button type="button" class="g-form-section__toggle" id="avanzada-toggle"
                aria-expanded="false" aria-controls="avanzada-panel" aria-describedby="avanzada-summary">
          <span class="g-form-section__chevron" aria-hidden="true"><svg class="g-icon">…chevron-right…</svg></span>
          <span class="g-form-section__lead" aria-hidden="true">…</span>                          <!-- solo con slot lead -->
          <span class="g-form-section__toggle-text">Configuración avanzada</span>
        </button>
      </h3>
      <span class="g-badge …">Opcional</span>                                                     <!-- solo con optional, fuera del botón -->
    </div>
    <p class="g-form-section__summary" id="avanzada-summary">                                     <!-- solo PLEGADA y con algo que decir -->
      <span class="g-form-section__status"><svg class="g-icon" aria-hidden="true">…circle-alert…</svg>1 error</span>
      <span class="g-form-section__summary-text">Español · America/Mexico_City</span>
    </p>
    <p class="g-form-section__description">…</p>
    <div class="g-form-section__actions">…</div>
    <div class="g-form-section__help">…</div>
  </div>
  <div class="g-form-section__panel" id="avanzada-panel" inert>                                    <!-- abierta: sin inert -->
    <div class="g-form-section__body"><!-- GFormLayout con los campos (#283) --></div>
  </div>
</section>
```

1. **El título entero es el botón: `hN > button type="button"`** (APG *Disclosure*; forma del encabezado de APG *Accordion*). Conserva la navegación por encabezados (1.3.1, 2.4.6, 2.4.10), da un objetivo grande (2.5.8) y el **nombre del botón es el título**, invariable: el estado lo dice `aria-expanded` (`"true"`/`"false"`, siempre presente). Sin `aria-label`.
2. **`aria-controls` → `__panel`**, que existe siempre. El panel **no** lleva `role="region"` ni nombre (diez regiones serían ruido, el mismo motivo de #161).
3. **Chevron** al inicio del botón, `aria-hidden`: Lucide **`chevron-right`** (lista de la librería, `GLibIcon`); abierta gira a abajo; en RTL se espeja y abierta también apunta abajo (precedente `GSidebar`, #71). Sin transición con movimiento reducido. `circle-alert` para el estado de errores. Ningún icono nuevo.
4. **`__actions`, `__description` y `__help` visibles en los dos estados** (ocultar las acciones movía el título 5px; medido por kiwi). La descripción se alinea con el texto del título (sangría del chevron; coco). Guía de contenido (mora-docs): una acción que cambia campos de la sección debe reflejarse en `summary` para que plegada se vea su efecto.
5. **Línea `__summary`**, bajo el título, **solo plegada y solo si tiene contenido**, con dos partes en este orden: el **estado de errores** (`__status`, automático, ver «Estado de errores por sección») y el **texto de la aplicación** (`__summary-text`, prop o slot `summary`). Abierta no existe (el contenido ya está a la vista).
6. **`aria-describedby` del botón → `__summary`** solo mientras existe; sin ella, el atributo no se pinta. Al llegar al botón se oye título, botón, contraído y el estado. **Sin región viva**: el estado cambia por acciones en otro sitio y el resumen ya anunció los errores (#162).
7. **Panel plegado = `inert` + `visibility: hidden`**, **sin `fieldset disabled`**: los controles **siguen en `FormData`** y Tab los salta (lo contrario de `GFormReveal`, a propósito). Contenido **siempre montado**.
8. **Teclado: sin teclas propias.** Tab y Enter/Espacio nativos del botón; el foco se queda en el botón al abrir y al plegar. **Sin flechas** entre encabezados (opcionales en APG *Accordion*; aquí las secciones no forman un grupo: varias abiertas a la vez y campos entre ellas).
9. **Plegar con el foco dentro** (solo por programa: `open` a `false` desde la aplicación; el botón está fuera del panel): **antes** de aplicar `inert` (en el mismo ciclo, antes de pintar), el foco va al **botón de la sección** con `preventScroll: true`. Nunca a `<body>` (2.4.3). A diferencia de `GFormReveal` (#275), aquí hay un control propio.
10. **`GForm readonly`/`disabled`:** plegar sigue funcionando (consultar no es editar); el botón nunca se deshabilita. Las acciones del consumidor siguen sus reglas.

**`addable`** (#288; anatomía de kiwi, puntos 30 a 36):

```html
<!-- sin agregar -->
<section class="g-form-section g-form-section--mode-addable is-ready" id="fiscales">
  <hr class="g-divider … g-form-section__divider" aria-hidden="true">                            <!-- solo con divider -->
  <div class="g-form-section__add">
    <button class="g-btn g-btn--variant-outline g-btn--color-neutral … g-form-section__add-button" type="button"
            aria-describedby="fiscales-add-description">
      <span aria-hidden="true"><svg class="g-icon">…plus…</svg></span>Agregar datos fiscales
    </button>
    <p class="g-form-section__description" id="fiscales-add-description">Solo si el paciente pide factura.</p>
  </div>
  <div class="g-form-section__panel" id="fiscales-panel" inert>
    <fieldset class="g-form-section__body" role="none" disabled><!-- GFormLayout… --></fieldset>
  </div>
  <dialog class="g-dialog g-dialog--alert … g-form-section__confirm" role="alertdialog">…</dialog>   <!-- GDialog, cerrado -->
</section>

<!-- agregada: is-open is-added; en lugar de __add, el encabezado -->
  <div class="g-form-section__header">
    <div class="g-form-section__heading"><h3 class="g-form-section__title" id="fiscales-title" tabindex="-1">Datos fiscales</h3></div>
    <p class="g-form-section__description">Solo si el paciente pide factura.</p>
    <div class="g-form-section__actions">…acciones del consumidor…
      <button class="g-btn g-btn--variant-ghost g-btn--color-neutral … g-form-section__remove" type="button">Quitar datos fiscales</button>
    </div>
  </div>
  <div class="g-form-section__panel" id="fiscales-panel"><fieldset class="g-form-section__body" role="none">…</fieldset></div>
```

11. **Sin agregar: una acción, no un encabezado.** `GBtn variant="outline" color="neutral"` (tamaño por defecto de `GBtn`) con `plus` en su hueco `prepend` y el texto `labels.add`; la descripción de la sección **debajo**, como texto secundario, unida al botón con `aria-describedby`. **Sin `hN`** hasta que la sección existe (un encabezado sin contenido mentiría al navegar por encabezados). Botón de su tamaño, no a todo el ancho. Sin `aria-expanded` (inserta, no divulga). La raíz es `<section>` **siempre** (sin nombre es genérica: el árbol no cambia y el `id` del anclaje no salta). Ocupa el sitio de la sección con el mismo ritmo (y su `divider`).
12. **Panel sin agregar = `inert` + `visibility: hidden` + `fieldset role="none" disabled`** (fuera de `FormData` y de la validación nativa, como `GFormReveal` cerrado, #275) y **registro inactivo** (#276; ver «Datos, errores y envío»). Contenido montado.
13. **Agregar** (usuario): emite `update:added(true)`; `__add` se sustituye por `__header` (`hN tabindex="-1"` + `__actions` con «Quitar …») y el panel crece con la transición. **Foco al título** con `preventScroll: true` (contexto antes que campo, form r01 §4); Tab desde el título: acciones del consumidor, «Quitar …» y el primer campo. No cambia `dirty` (aún no hay datos).
14. **Quitar descarta** (#288): emite `update:added(false)`, el cuerpo **se vuelve a montar** (clave nueva: se descarta lo no controlado) y la aplicación vacía su modelo; sus campos vuelven a inactivos, «sin editar ni revelar», y sus errores salen **en silencio** del resumen (#276). Volver a agregar empieza **vacía y sin errores revelados**. Quitar (del usuario) **sube `dirty`** de `GForm` (`notifyChange` sin nombre): descartar datos es un cambio. Foco a «Agregar …» con `preventScroll` (nunca a `<body>`).
15. **Confirmación con `GDialog role="alertdialog"`** (APG *Alert Dialog*; WCAG 3.3.4 como criterio de «revertir, revisar o confirmar») **cuando hay algo que perder**: (a) el usuario escribió en la sección desde que se agregó (**editado**: un `input`/`change` nativo que burbujea en `__body`, o `notifyChange()` de un campo dentro, vía `sectionKey`; interacción, no comparación de valores, como `dirty`, #157), o (b) la sección la **agregó la aplicación** (`added` verdadero al montar o puesto a `true` por programa: datos guardados que no se recuperan repitiendo una acción; motivo nuevo sobre kiwi 33, #288). Sin ninguna de las dos (el usuario la agregó y no escribió nada; o solo la rellenó una acción de la aplicación tras agregarla, que se repite), **quita directo**. El diálogo: `title` = `labels.removeTitle`, `description` = `labels.removeBody`, pie con **`removeCancel` primero** (`GBtn variant="outline" color="neutral"`, **`autofocus`**: la acción segura, `dialog.md` «Foco», #292) y **`removeConfirm`** (`GBtn variant="solid" color="danger"`), `size="sm"`. Es el **último hijo de la `<section>`**, fuera de `__header` y de `__panel` (nunca dentro del `fieldset disabled` ni de un `inert`). **Cancelar** o Esc: cierra y el foco vuelve a «Quitar …» (nativo). **Confirmar**: la sección quita en el acto (punto 14) y, al recibir `closed` del diálogo, enfoca «Agregar …» (el retorno nativo iría a un botón que ya no existe).
16. **`GForm readonly`/`disabled`:** ni «Agregar …» ni «Quitar …» (editar la estructura es editar); una agregada se ve con sus datos; una **sin agregar no se pinta**: atributo `hidden` en la raíz (en modo vista no hay nada que mostrar).

### Datos, errores y envío (con `GForm`; #286 a #288)

| Situación | `collapsible` | `addable` |
| --- | --- | --- |
| Registro | Normal (activos) aunque esté plegada | Sin agregar: **inactivo** (#276), por `revealKey` provisto por la sección (ver §2) |
| `FormData` | Incluye los campos plegados | Sin agregar: los excluye (`fieldset disabled`) |
| Envío o `showErrors()` con errores | **Se abren, en un cuadro y sin animar, todas las plegadas que contienen un error que bloquea, antes de mover el foco** (#287); las plegadas sin errores siguen plegadas; el foco va después al resumen o al primer inválido | Sin agregar: sus errores no bloquean ni se revelan |
| Enlace del resumen, `focusFirstError()` | Abre la que contiene el control (sin animar) y luego desplaza y enfoca (#287) | — (no hay enlace a un inactivo) |
| Volver a plegar con errores visibles | Siguen contando; el encabezado los dice («1 error») | — |
| `dirty` | Abrir o plegar no lo cambia | Agregar no; quitar sí (punto 14) |

**Por qué se abren las plegadas con error:** «revela todos» (#157) no se cumple si el mensaje en línea queda en un panel `inert` (3.3.1: el error se identifica junto a su campo; 2.4.3: Tab debe poder llegar al campo). Abrir lo que está **debajo** del foco no mueve lo que el usuario ve. **Por qué sin animar** (medido por kiwi): con la transición, `scrollIntoView` desplaza también el cuerpo recortado (`overflow: hidden` es contenedor de desplazamiento): 80px de desplazamiento interno en los tres motores, y en Firefox el anclaje de desplazamiento se desactiva. Abrir para llevar a un campo es navegación, no un cambio que haya que seguir con la vista.

### Estado de errores por sección (#286)

- **Qué cuenta:** las **preguntas** de la sección (los mismos registros que recibe `GForm`: un campo con `name` fuera de un grupo, o un grupo — `GFieldGroup`, `GCheckboxGroup`, `GInputGroup`, `GRadioGroup` — como **uno**; las partes de un grupo no cuentan) que tienen un **error visible**: el que el campo pinta (prop `error` explícita, o `errors[name]` ya **revelado** por las reglas de #157). Una sección plegada no anuncia errores que el usuario aún no ha provocado. **No cuentan:** registros deshabilitados, registros inactivos (un `GFormReveal` cerrado dentro) y las advertencias (no bloquean).
- **De dónde sale:** `useFormField` y `useCompositeField` registran su entrada **también en la sección más cercana** (`sectionKey`) cuando la registran en `GForm` (misma condición, mismo momento, mismo `unregister`); la sección la **propaga a sus secciones ancestro** (una sección plegada que contiene otra cuenta también las preguntas de la interior). La sección cuenta con el mismo criterio de visibilidad que usa `GForm` para llevar el foco (bruno puede reutilizar `visibleTarget()` del registro). Referencia de comportamiento: el `XFormSection` de kiwi (envuelve `register` del contexto); no de implementación.
- **Texto:** **`labels.sectionErrors` de `GForm`** (String con `{count}`, rellenado con `fill`, o Function `(count) => String` para los plurales del idioma; como `labels.title` de `GErrorSummary`, #162): lo usan todas las secciones, como `sectionOptional`. Icono `circle-alert` (`aria-hidden`) + texto, nunca solo color (1.4.1).
- **Cuándo se pinta:** solo en `collapsible`, solo plegada, con cuenta > 0 **y** con texto. Sin `labels.sectionErrors` el estado **no se pinta** (un icono solo no basta) y `GForm` avisa una vez (aviso 2 de §1). **Fuera de `GForm`** no hay estado de errores (no hay texto ni revelado); la línea muestra solo `summary`.

### Abrir antes de enfocar (#287)

Mecanismo **sin acoplar** `GErrorSummary` ni `GForm` a la sección: un **evento DOM interno** que sale del control que se va a enfocar.

1. **`revealAndFocus(control, root)`** (`formContext.js`, el útil que ya comparten `GForm` y `GErrorSummary`) **despacha** antes de desplazar un `CustomEvent` con el nombre de la constante interna **`OPEN_REQUEST`** (`'g-open-request'`; exportada desde `formContext.js`, **no** desde `src/index.js`), `bubbles: true`, `cancelable: true`, desde `control`. `dispatchEvent` funciona dentro de un subárbol `inert`.
2. **Cada `GFormSection collapsible` lo escucha en su `__panel`** (no en la raíz: una petición desde el encabezado no abre nada). Si está plegada: pasa a abierta con **`is-instant`** en el mismo parche que `is-open` (sin transición), emite `update:open(true)` y llama a **`preventDefault()`** («he cambiado: espera un parche»). No detiene la propagación: las secciones anidadas plegadas se abren todas. `is-instant` se retira tras el primer pintado (doble `requestAnimationFrame`).
3. Si el evento quedó cancelado, `revealAndFocus` **espera un `nextTick`** (Vue quita `inert` y aplica `1fr` sin transición) y **luego** desplaza la raíz y enfoca con `preventScroll: true` (GOV.UK, §7). Si no, sigue síncrono como hoy. **Devuelve una `Promise`** que se resuelve con el foco ya puesto.
4. **`GForm`, en el envío con errores y en `showErrors()`**, antes de mover el foco (al resumen o al primer inválido): despacha la misma petición desde el control (o la raíz) de **cada** registro de la lista de errores que bloquean (los generales no tienen campo), espera un `nextTick` si alguna se canceló y entonces enfoca. Así se abren todas las plegadas con error que bloquea, también cuando el foco va al resumen.
5. **`focusFirstError()`** pasa por `revealAndFocus` y abre igual; **devuelve `Promise<boolean>`** (`true` si encontró un control). `showErrors()` ya devolvía una promesa.
6. **`GErrorSummary`** no cambia de API: su enlace (`navigate` no cancelado → `nextTick` → `revealAndFocus`) abre la sección sin saber que existe; funciona **dentro y fuera de `GForm`** (con `errors` propios) y con secciones anidadas.
7. **Por qué un evento y no un registro de secciones en `GForm`:** un registro no cubre el resumen fuera de `GForm` ni un contenedor intermedio; el evento sigue el DOM real y, sin cambio de API, sirve mañana para `GTabs`/`GStepper` (Fase 4) o para `GFormNav`. El nombre es **interno** y queda reservado; hacerlo público (contenedores propios de la aplicación) sería API de producto.

### Encabezado al lado y acciones que bajan de línea (#289)

- **`headerPlacement="auto"`:** la sección mide su **ancho propio** con un `ResizeObserver` **compartido** por todas las secciones (escrituras en `requestAnimationFrame` y solo si cambian, #173) y pone **`is-header-side`** con ancho ≥ `space × 200` (`space` leído del estilo calculado, como `GFormRow`). No `@container`: su condición no admite `var()` (#34, #39, #130).
- **Al lado:** dos columnas, **encabezado · cuerpo** (proporción de coco, sin token, como §4). En la columna del encabezado se apilan título, `__summary`, descripción, **acciones (debajo, al inicio)** y ayuda; el cuerpo es un `GFormLayout` normal que mide su propia columna. **Alineación:** el borde superior del título coincide con el de la **primera etiqueta de la primera fila** (Δ ±1px; misma línea superior, sin alinear líneas base). En `collapsible`, el botón va en la columna del encabezado y el panel en la del cuerpo (plegada, la fila mide lo que el encabezado). En `addable` sin agregar, `__add` ocupa **el ancho entero**; agregada, dos columnas. Orden del DOM = orden de lectura (1.3.2).
- **Guía (mora-docs):** en un formulario, todas las secciones con el mismo `headerPlacement`. Dentro de un `GDialog` o un panel estrecho, `auto` cae en `top` solo.
- **Acciones que bajan de línea (L9; vale también para la Fase 1):** con `__actions` presente, el encabezado (sus columnas: `__heading` · `__actions`) debe dejar al **título** al menos **`space × 40`** (constante, sin token; con menos, un título se parte letra a letra: 58–59px medidos por kiwi a 320). Cuando no cabe, **`is-actions-below`**: las acciones bajan a **su propia línea, al inicio, después de la descripción** (como al lado), y el orden visual pasa a ser el del DOM. Lo **mide la sección** con el mismo `ResizeObserver` compartido: ancho del encabezado − ancho natural de `__actions` (suma de sus hijos y separaciones, que no cambia entre los dos estados: sin vaivén) − separación de columnas < `space × 40` → `is-actions-below`. Con `is-header-side` no aplica (las acciones ya van debajo). Una medida por JS y no CSS porque el umbral depende del contenido de las acciones y de `space` (#130).
- **SSR y antes de medir:** encabezado arriba y acciones al lado (lo de hoy; renderizar lo pedido sin medida, precedente #271).

### Transición (`collapsible` y `addable`; la de §14, #278)

- **`__panel`** es una rejilla de una pista `0fr → 1fr` (es quien anima, no la raíz); `__body` con `min-block-size: 0` y `overflow: hidden` mientras anima, `overflow: visible` al asentarse (no recorta anillos de foco). Plegado en reposo `visibility: hidden` (los `GFormRow` de dentro siguen midiendo). Altura y margen con **`--g-duration-slow`**; fundido con `--g-duration-fast` (al abrir termina con la altura; al plegar, corto desde el principio); `visibility` pasa a `hidden` al final.
- **Sin hueco plegado:** el panel cerrado anula con margen negativo el `gap` **propio** de la sección (encabezado → cuerpo); no se lee nada del padre (al revés que `--_reveal-gap`). Mecanismo de coco.
- **`is-open`** (y `inert`, y en `addable` el `disabled` del `fieldset`) cambian en el acto. **`is-animating`** desde el cambio hasta el `transitionend` de `grid-template-rows` **cuya diana es el panel**, o un temporizador de respaldo (mayor duración + retraso calculados del panel + 50ms). **`is-ready`** tras el primer pintado: sin animar al montar. **`is-instant`**: apertura para llevar a un campo (#287), sin transición, un cuadro.
- **Δ0** del encabezado y del desplazamiento al abrir y al plegar (medido por kiwi a media vista, pegado arriba, LTR, RTL y al lado). **Límite heredado** (#283): plegar con la página desplazada hasta el final recorta el desplazamiento; no se compensa.
- **Movimiento reducido:** altura y margen en un cuadro, **fundido conservado**; al plegar sigue visible mientras se funde y ya es `inert`. El chevron gira sin transición.
- **SSR:** se pinta según `open`/`added` (`inert`, y en `addable` `disabled`, desde el primer HTML; la hidratación debe coincidir), sin `is-ready`.

### Clases (contrato bruno ↔ coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-form-section` | `<section>` | Siempre |
| `g-form-section--mode-{static\|collapsible\|addable}` | Raíz | Siempre (convención `--{prop}-{valor}`, `api.md`) |
| `g-form-section--optional` | Raíz | `optional` (también en `addable`, aunque sin insignia) |
| `is-open` | Raíz | Panel visible: `collapsible` abierta o `addable` agregada (en el acto) |
| `is-added` | Raíz | `addable` agregada |
| `is-animating` · `is-ready` · `is-instant` | Raíz | Ver «Transición» |
| `is-header-side` | Raíz | `headerPlacement="auto"` medido ≥ `space × 200` |
| `is-actions-below` | Raíz | Acciones en su propia línea (L9) |
| `__divider` | `GDivider` (`<hr>`) | Con `divider` |
| `__header`, `__heading`, `__lead`, `__title`, `__description`, `__actions`, `__help` | | Como en la Fase 1 |
| `__toggle` | `button` dentro del `hN` | `collapsible` |
| `__chevron` | `span aria-hidden` con el icono | `collapsible` |
| `__toggle-text` | `span` con el texto del título | `collapsible` |
| `__summary` | `p` | `collapsible` plegada con contenido |
| `__status` | `span` (icono + recuento) | Dentro de `__summary`, con errores |
| `__summary-text` | `span` | Dentro de `__summary`, con `summary` |
| `__add` | `div` con el botón y la descripción | `addable` sin agregar y editable |
| `__add-button` | el `GBtn` «Agregar …» | Ídem |
| `__remove` | el `GBtn` «Quitar …» | `addable` agregada y editable |
| `__panel` | `div` (rejilla, `inert` cerrada) | `collapsible` y `addable` |
| `__body` | `div` (`static`, `collapsible`) · `fieldset role="none"` (`addable`) | Siempre |
| `__confirm` | el `GDialog` | `addable` |

Separación entre secciones consecutivas: `--g-form-section-gap` × densidad (§9).

### Estados

| Estado | Encabezado | Panel / cuerpo | Datos | Árbol · Tab |
| --- | --- | --- | --- | --- |
| Estática | como hoy | `__body` sin panel | registrados | dentro |
| Plegable abierta | `aria-expanded="true"`, sin `__summary` | sin `inert`, visible | registrados, cuentan | dentro |
| Plegable plegada | `aria-expanded="false"`, `__summary` (si hay) y `aria-describedby` | `inert`, invisible, altura 0, margen −gap | **en `FormData`**, cuentan | botón sí · cuerpo fuera |
| Plegada con error | `__status` «N errores» + icono | igual | cuentan; el envío y el resumen la abren | igual |
| Abriendo / plegando | igual (Δ0) | `is-animating` | igual | `inert` cambia en el acto |
| Apertura para navegar | — | `is-instant` | — | — |
| Agregable sin agregar | `__add`, **sin `hN`** | `inert` + `fieldset disabled` | **inactivos**, fuera de `FormData` | fuera |
| Agregada | `hN tabindex="-1"` + «Quitar …» | habilitado | registrados, cuentan | dentro |
| Confirmando «Quitar» | igual | igual | igual | `alertdialog` |
| `readonly` / `disabled` | sin «Agregar…»/«Quitar…»; plegar funciona | — | como siempre | sin agregar: `hidden` |
| Al lado | columna 1 | columna 2 | — | mismo orden |
| Acciones abajo | acciones en su línea, al inicio | — | — | orden del DOM |
| RTL | chevron espejado | propiedades lógicas | — | — |
| `forced-colors` | chevron `currentColor`, anillo y línea visibles | — | — | — |
| Movimiento reducido | chevron sin transición | un cuadro + fundido | — | — |

### Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Mayús+Tab | Botón del título (`collapsible`), acciones, campos del panel abierto; salta el panel plegado y la agregable sin agregar |
| Enter / Espacio en `__toggle` | Abre o pliega (nativo); el foco se queda en el botón |
| Enter / Espacio en «Agregar …» | Agrega; foco al título |
| Enter / Espacio en «Quitar …» | Quita (foco a «Agregar …») o abre la confirmación (foco en «Cancelar») |
| Esc en la confirmación | Cancela (foco a «Quitar …») |

Sin flechas ni teclas propias.

### Tokens consumidos (#291: ninguno nuevo)

| Token | Para qué |
| --- | --- |
| `--g-form-section-gap` | Separación entre secciones y posición de la línea de `divider` (× densidad) |
| `--g-space-*` | Separaciones internas, sangría del chevron, umbrales `× 200` y `× 40` (constantes leídas por el JS) |
| `--g-duration-slow` | Altura y margen del panel (#280) |
| `--g-duration-fast` | Fundido; giro del chevron |
| `--g-ease-out` / `--g-ease-standard` | Curvas |
| `--g-color-danger-text` | Estado de errores (`__status`) |
| `--g-color-text`, `--g-color-text-muted` | Título y botón; `__summary-text` y descripción |
| `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-title-sm-*` | Título (body 16/600, §23) y línea de estado (body-sm) |
| `--g-focus-*`, `--g-radius-xs` | Anillo del botón y del título enfocado |
| Los de `GDivider`, `GBtn`, `GDialog`, `GBadge` | Las piezas que compone |

**Sin `--g-divider-inset` propio:** la línea va sin inset (#192); el mapa de anfitrionas de `levels.test.js` sigue **vacío** (#195). Proporción de columnas al lado y sangrías: coco, derivadas de `space`.

### Avisos de desarrollo (`[Grana GFormSection]`)

Una vez por instancia (en `setup` o al montar, según el dato):

1. `open` (o `onUpdate:open`) con un modo que no es `collapsible`: se ignora.
2. `added` (o `onUpdate:added`) con un modo que no es `addable`: se ignora.
3. `summary` o slot `summary` con un modo que no es `collapsible`: no se pinta.
4. `addable` sin `labels.add` (sin botón «Agregar …»), sin `labels.remove` (sin «Quitar …») o sin `removeTitle`/`removeConfirm`/`removeCancel` (quita sin confirmar). Sin `removeBody` no avisa.
5. `optional` con `addable`: sin insignia (el botón ya lo dice).
6. Sin `title` ni slot `title` (Fase 1).
7. Algo interactivo en `__summary` (`a[href]`, `button`, `input`, `select`, `textarea`, `[tabindex]`), comprobado al pintarse: la línea es una descripción del botón y su contenido no se puede usar.
8. `mode` cambia tras montar.

Y los que ya existían: dentro de un `GFormReveal` (§14 aviso 3, #279: solo si un **`GFormReveal`** está por encima, no por una sección agregable, ver §2); campos directos en el cuerpo (#283); `GDivider` a mano entre dos secciones (ahora con el texto «entre secciones la separación es el espacio; para una línea, usa `divider` en la sección»). **Falta `labels.sectionErrors`** la primera vez que una plegada tiene errores: lo avisa `GForm` (§1, aviso 2).

### Accesibilidad (además de §11)

`hN > button` con nombre invariable, `aria-expanded` y `aria-controls` (APG *Disclosure*; 1.3.1, 2.4.6, 4.1.2); estado de errores en texto + icono (1.4.1) en `aria-describedby`; foco nunca en `<body>` al plegar o quitar (2.4.3); errores siempre alcanzables (las plegadas con error se abren, 3.3.1); objetivo del botón ≥ 24px, ≥ 44px con `pointer: coarse` (2.5.8; valores de coco); confirmación al descartar con algo que perder (3.3.4); sin cambio de contexto al abrir (3.2.2); título con al menos `space × 40` (1.4.10, L9).

### Límites conocidos (para el README)

- **Buscar en la página** (Ctrl+F) no encuentra ni abre el contenido plegado (`inert`). `hidden="until-found"` + `beforematch` existe en los tres motores, pero no se midió su convivencia con la rejilla, `inert` y la transición: **pendiente no bloqueante** (ronda corta de kiwi si un caso real lo pide; L11).
- Plegar al final de la página recorta el desplazamiento (#283).

### Separación entre secciones: espacio por defecto; línea con `divider` (#192, #290)

**Por defecto dos secciones se separan solo por espacio** (`--g-form-section-gap` × densidad) y por su título; #192 no se reabre: la línea **no** es sistemática. **Por qué:** cada sección lleva título (`hN`; sin él avisa), así que la separación ya la dan título y aire, que es exactamente el caso en que la regla de producto de `GDivider` dice que no hace falta una línea «por instinto» (`divider.md`). Donde sí aporta es en las cabeceras de secciones **plegadas**, que no tienen cuerpo que dé aire (patrón de acordeón): para eso está `divider`.

**`GDivider` a mano entre dos secciones: no.** Rompe el ritmo en los dos contextos (medido por kiwi, `design/lab/divider/r01/declaracion.md`): dentro de `GForm`, **81px** en lugar de 40; fuera, **1px**. **Aviso de desarrollo** en `GFormSection` (una vez, en `onMounted`) si su hermano anterior inmediato es un `.g-divider` y el anterior a este una `.g-form-section`, con el texto de arriba. No cambia nada de lo que se pinta.

**`divider` (reglas de #192 concretadas):**

1. **Prop de `GFormSection`** (no de `GForm`), default `false`, en los tres modos y con el encabezado al lado (la línea ocupa todo el ancho de la sección).
2. **Un `GDivider` real**: `decorative` (`<hr aria-hidden="true">` sin rol), `emphasis="subtle"`, `inset="none"`, clase `g-form-section__divider`.
3. **Primer hijo de la `<section>`**, antes de `__header` o `__add`: no añade un hijo a `GForm` ni se interpone entre dos secciones hermanas.
4. **Fuera del flujo y dentro del hueco:** la sección es su contenedor posicionado y la línea se coloca a la mitad del hueco que la precede, centrada en su grosor (kiwi: `−(--g-form-section-gap × densidad) / 2` del borde superior). **Ninguna distancia cambia**: un solo mecanismo dentro de `GForm` (el `gap` del formulario) y fuera (el `margin-block-start` de `:not(.g-form) > .g-form-section + .g-form-section`), porque los dos valen gap × densidad. Normativo: distancia entre el final de la sección anterior y el inicio del encabezado = `--g-form-section-gap` × densidad (±1px) y línea centrada (±1px), dentro y fuera de `GForm` y en las tres densidades (kiwi: 40/35/30 dentro y 40 fuera, ±0, tres motores). Mecanismo de coco.
5. **Sin línea en la primera sección:** la línea se pinta **solo si hay una sección hermana anterior visible** (regla de CSS, sin JS: `.g-form-section:not([hidden]) ~ …`), así vale en SSR, con secciones que aparecen por `v-if` y con una agregable oculta en `readonly`. Nunca entre la última sección y `GFormActions` (la línea va **arriba** de una sección).

**Qué NO cambia de lo ya construido:** `<section>` sin `aria-labelledby`, títulos `hN` con `headingLevel`, `optional` y su insignia (#161); el valor y el significado de `--g-form-section-gap`; `GFormLayout`, `GFormRow`, el reparto en líneas (#175) y la prueba obligatoria de distribución (#184); `GErrorSummary` (API), `GFormActions`; la convención de obligatorios; el DOM de la sección fija (salvo la clase `--mode-static`, la línea opcional y `is-actions-below`).

**Dentro de un `GFormReveal` (Fase 3, #279):** `GFormSection` avisa (una vez, al montar) si un `GFormReveal` está por encima: «la sección contiene la pregunta y el bloque, no al revés» (§14). No cambia nada de lo que se pinta.

**Campos directos en el cuerpo (#283):** `GFormSection` avisa (una vez por sección, al montar) si algún **hijo directo** de `__body` es la raíz de un campo de Grana (`GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GInputGroup`, `GRadioGroup`, `GCheckbox`, `GCheckboxGroup`, `GSwitch`, `GFieldGroup`), una `GFormRow` o un `GFormReveal`: «los campos de una sección van en un `GFormLayout` (separación, ancho completo y densidad); el cuerpo de la sección no distribuye». Un solo aviso aunque haya varios hijos así. bruno elige cómo reconocer las raíces; un campo propio del consumidor no se detecta (limitación aceptada). Vale en los tres modos (el cuerpo sigue siendo `__body`).

**El cuerpo no distribuye (#283):** `__body` es un contenedor simple, **no una pila**: sin `gap` entre sus hijos y sin sub‑contexto de distribución (`block`, `density`, `stack`). **Los campos de una sección van en un `GFormLayout`** dentro del cuerpo, y con ellos sus `GFormRow` y sus `GFormReveal`. Una sección **sin campos** (texto, una tabla, un `GDataList`) es válida y pone su contenido directamente en el cuerpo.

**Otras reglas de la Fase 1 que siguen:** **sin `aria-labelledby`** en la `<section>` (con nombre sería un punto de referencia `region`; los encabezados dan la navegación, WCAG 1.3.1, 2.4.6, 2.4.10); `fieldset`/`legend` se reserva para **preguntas** (`GFieldGroup`, radios), no para secciones (W3C WAI «Grouping Controls»; el `fieldset role="none"` de `addable` no es un grupo, solo el mecanismo de exclusión, como §14); **`lead`** (#203): hueco de icono, su tamaño y alineación los fija coco con un alias local tomando como referencia la **primera línea del título**; decorativo; un `GIcon` con `label` dentro avisa (`icons.md` §2.4).

### Verificación (Fase 3)

- **bruno (vitest + jsdom):** props y avisos 1 a 8; `static` sin cambio de DOM (instantánea, salvo `--mode-static`); `collapsible`: `hN > button type="button"` con `aria-expanded`/`aria-controls`, nombre invariable, `aria-describedby` solo con `__summary`, `inert` sin `fieldset`, `FormData` con los plegados, `update:open` controlado y no controlado, foco al botón al plegar por programa con el foco dentro, `lead` dentro del botón y `optional` fuera; recuento: cuenta preguntas (`GFieldGroup` como uno), solo errores visibles, no advertencias, ni deshabilitados, ni inactivos, propagado a la sección ancestro, `labels.sectionErrors` String y Function, sin texto no pinta y avisa; **abrir antes de enfocar**: envío, `showErrors()` (con error del servidor en otra plegada), enlace del resumen dentro y fuera de `GForm`, `focusFirstError()` (devuelve `Promise<boolean>`), anidadas, petición desde el encabezado que no abre, sin plegadas sigue síncrono; `addable`: sin `hN` sin agregar, `aria-describedby` del botón, registro inactivo (envía con errores sin condiciones; sus claves no son generales), aviso 3 de §14 **no** sale por una sección agregable y **sí** por un `GFormReveal` por encima; agregar → foco al título, por programa sin foco; quitar sin nada que perder directo; con edición o agregada por la aplicación → `alertdialog` con «Cancelar» enfocado, Cancelar/Esc devuelven el foco, Confirmar quita y enfoca «Agregar …» tras `closed`; cuerpo remontado (lo no controlado se vacía), errores fuera del resumen en silencio, `dirty` sube al quitar; `readonly`/`disabled` (sin botones, sin agregar = `hidden`); sin textos de confirmación quita directo; `headerPlacement` e `is-actions-below` con anchos simulados (escrituras solo si cambian); SSR (`renderToString`): `inert`/`disabled` según props, sin `is-ready`, arriba y acciones al lado.
- **Playwright** (Chromium, Firefox y WebKit; adaptar `design/lab/form-section/r01/verificar.mjs` al componente real en `design/lab/theme-playground/`): sin transición al cargar; Δ0 del encabezado y del desplazamiento en cada cuadro (a media vista, pegado arriba, RTL, al lado); a la mitad, altura y opacidad intermedias; apertura para navegar sin desplazamiento interno del cuerpo (0px) y etiqueta a la vista; Tab salta plegadas y no agregadas; `auto` al lado/arriba por ancho propio y al redimensionar, título alineado con la primera etiqueta (±1px); **L9**: a 320 con una acción de texto, título ≥ `space × 40` en la Fase 1 y con chevron; `divider` 40/35/30 dentro y 40 fuera (±1px), centrada, sin línea en la primera, con plegadas **y con abiertas** (kiwi no midió las abiertas); 320 sin desborde con todo abierto y agregado; movimiento reducido; añadir una sección plegable abierta a la **prueba obligatoria de distribución** (#184).
- **coco (auditoría con un tema distinto):** chevron y su giro (LTR, RTL), anillo del botón y del título, estado de errores legible (4.5:1) en claro y oscuro, línea `subtle` en las tres densidades, `forced-colors` (chevron `currentColor`, anillo, línea), columnas al lado, acciones abajo, 44px con `pointer: coarse`.
- **No verificado y pendiente:** lector de pantalla real (qué se oye en el botón con `aria-describedby`; `hN > button` anunciado como encabezado y botón; `fieldset role="none"` sin grupo; el `alertdialog`); Safari, iOS y táctil reales; `forced-colors` real y en Firefox/WebKit; `GSelect`, `GDatePicker`, `GCheckboxGroup` y `GFormReveal` dentro de plegadas y agregables; secciones dentro de `GDialog`; rendimiento con muchas secciones y el `ResizeObserver` compartido.

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

- **Elemento:** `<div class="g-form-layout">`, columna de hijos separados por `--g-form-gap` × densidad. **Cada hijo directo ocupa el ancho entero** (campo suelto, `GFormRow`, `GFormReveal` (§14), `GFieldGroup`, `GCheckboxGroup`, casilla, interruptor, área de texto). **No mide** nada (no tiene `ResizeObserver`): quien mide es cada `GFormRow`.
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
- **Mínimo intrínseco** (#271; primer uso: `GRadioGroup appearance="segmented"`, `radio-group.md`): un hijo de Grana cuyo mínimo depende de su **contenido medido** (en px; cambia con la fuente y las opciones) lo **publica** con la función interna del sub‑contexto de la fila **`setIntrinsicMin(el, px)`** (`el` = su raíz, que debe ser **hijo directo** de la fila; `0` lo retira, también al desmontar). La fila lo guarda por elemento y, si cambia (≥ 0,5px), programa un recálculo. **Mínimo efectivo = el mayor entre el de su tamaño, `--g-form-min` × `space` y el intrínseco.** Es interno (como `markRule`): no es API pública ni una propiedad `--g-*`; un campo propio del consumidor usa `--g-form-min`. `GFormLayout` y `GFieldGroup` no la proveen por sí mismos (la parte de un `GFieldGroup` la recibe de su `GFormRow` compuesta).
- **`g-form-w-full`** desaparece: es el comportamiento de un campo suelto. Una clase `g-form-w-*` desconocida avisa y cuenta como `md`.

#### Reparto en líneas (#175, normativo)

Con `A` = ancho de contenido de la fila (`ResizeObserver`, `contentBoxSize` en línea), `g` = separación de columna resuelta, y para cada hijo peso `w` y mínimo efectivo `m` en px:

1. En una línea con los hijos `F`, cada uno recibe `w / Σw(F) × (A − g × (|F| − 1))`. La línea es **admisible** si todos reciben al menos su mínimo (tolerancia 0,5px) **o** si tiene un solo hijo (una línea de uno siempre es admisible: ocupa el ancho entero aunque sea menos que su mínimo; nunca desborda).
2. Entre todas las particiones en **líneas contiguas en orden del DOM** con todas las líneas admisibles, se elige: (a) la de **menos líneas**; (b) entre esas, la que **maximiza el menor cociente ancho recibido / mínimo** de todos sus hijos (evita una línea con un campo apretado cuando hay alternativa); (c) empate exacto: la que pone más hijos en las primeras líneas.
3. **`keep`:** una sola línea siempre; si no caben los mínimos, **ceden los mínimos** (anchos por peso; sin desborde: los hijos tienen `min-inline-size: 0`). **`stack`** del `GFormLayout`: un hijo por línea, salvo `keep`.
4. **Antes de medir, en SSR o sin `ResizeObserver`:** un hijo por línea (nunca desborda; la fila no lleva `data-lines`).
5. **Cuándo se recalcula:** al montar, cuando cambia `A`, cuando un hijo publica otro mínimo intrínseco (#271), y cuando cambian los hijos o sus clases de tamaño (bruno elige el mecanismo; el resultado se actualiza sin recargar). `--g-form-min` se lee en cada cálculo. Las escrituras van **fuera** de la devolución del `ResizeObserver` (en `requestAnimationFrame`) y **solo si cambian** (lección de #169). Se recomienda **un** `ResizeObserver` compartido por todas las filas.
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
- **Admitidos como hijos de una fila con más de un hijo:** `GInput`, `GTextarea`, `GSelect`, `GDatePicker` (ni `inline` ni `split`), `GInputGroup`, campos propios del consumidor con la misma estructura de tres hijos (`useFormField`; ver §2), **`GRadioGroup` con `appearance` `inline` o `segmented`** (raíz `div role="radiogroup"` de tres hijos; `inline` amplía #181, #268; el segmentado publica su mínimo intrínseco, #271; `radio-group.md`) y, en la Fase 2, `GNumberField`. **Van en su propia fila** (hijos directos de `GFormLayout`): `GFieldGroup`, `GCheckboxGroup` y `GRadioGroup` con `appearance` `list`, `chip` o `card` (un `<legend>` no participa en la rejilla), `GCheckbox` y `GSwitch` sueltos (no tienen caja que alinear), `GDatePicker inline` y **`GDatePicker split`** (sus etiquetas Inicio/Fin van dentro de la pista de la caja y la bajarían respecto de sus vecinos; #188), otra `GFormRow`, `GFormActions`. **`GFormReveal` nunca va dentro de una `GFormRow`**, ni como único hijo (lo avisa el propio bloque, §14, #279).

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
- **Enlace:** `href="#id"` real (funciona sin JS y se puede abrir en otra pestaña del navegador sin romper nada). Al activarlo, `preventDefault()` y se emite **`navigate`** (cancelable). Si nadie lo cancela: espera un `nextTick` (para que la aplicación cambie de pestaña o de paso si lo necesitó en su manejador), **abre en un cuadro y sin animar la `GFormSection` plegada que contiene el control** (por el evento interno de `revealAndFocus`, sin conocer la sección; también fuera de `GForm`; §3 «Abrir antes de enfocar», #287), **desplaza la raíz del campo para que se vea su etiqueta** (respetando el pie fijo) y **enfoca el control** con `preventScroll: true` (GOV.UK). Sin cambio de API.
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

### Patrón: bloqueo con interruptor («lock-edit», #266)

Un formulario **de captura** ya guardado que se abre **bloqueado** para evitar ediciones y envíos accidentales, y se desbloquea con un interruptor. **No** es una vista de consulta. Es una **receta con la API actual**, no una prop: `readonly` de `GForm` ya da todo lo que el bloqueo necesita del formulario, y el resto (copia guardada, confirmación, permisos) es estado de la aplicación. Precedente verificado: `design/lab/migraciones/analisis/` (12/12 en los tres motores).

```vue
<div class="ficha__estado">
  <GSwitch label="Permitir edición" :model-value="!locked" @update:model-value="toggleLock" />
</div>
<GForm id="muestra" aria-label="Información de la muestra" :readonly="locked"
       :errors="locked ? {} : errors" v-model:dirty="dirty" @submit="save">
  …
  <GFormActions :status="status">
    <GBtn variant="ghost" type="button" @click="locked ? close() : cancel()">{{ locked ? 'Cerrar' : 'Cancelar' }}</GBtn>
    <GBtn type="submit" :disabled="locked">Guardar</GBtn>
  </GFormActions>
</GForm>
```

| Regla | Qué | Por qué |
| --- | --- | --- |
| Atributo | **`readonly`** de `GForm` ligado al bloqueo. **Nunca `disabled`** | `readonly` mantiene los campos **enfocables, legibles y copiables** (C7, #165) y **dentro del envío** (`FormData`); `disabled` los saca del Tab, los atenúa y los **excluye** del envío y de los errores (§1, «Envío» paso 3): un envío por otra vía perdería datos sin aviso |
| Alcance | **Todo el `GForm`**. Bloqueo parcial: `readonly` en los campos o en un `GFieldGroup` (la prop explícita gana, #158). `GFormSection` no tiene `readonly` y este patrón no lo añade | Una sola fuente del estado; sin props nuevas |
| Interruptor | `GSwitch` **fuera del `<form>`** y **antes** de él en el DOM (cerca del título o del estado). Etiqueta de **acción**: «Permitir edición»; apagado = bloqueado. **Controlado** (`:model-value` + `@update:model-value`): no cambia hasta que la aplicación lo acepta | Dentro heredaría `readonly` (no podría desbloquear), su `change` nativo burbujearía y **marcaría `dirty`** (§1, `dirty`) y, con `name`, entraría en `FormData`. Antes en el DOM: se encuentra antes que los campos que controla |
| Estado inicial | Registro guardado: **bloqueado** al abrir (y al reabrir un diálogo). Registro nuevo: editable y, normalmente, sin interruptor (lo decide la aplicación) | Lo que se protege es lo ya capturado |
| Foco | Al **desbloquear**, el foco **se queda en el interruptor** (no salta al primer campo). Al **bloquear por Guardar o Cancelar**, el foco va **al interruptor** | WCAG 3.2.2 (cambiar un control no cambia de contexto). Tras Guardar/Cancelar el botón pasa a deshabilitado o cambia de texto: el foco no puede quedarse en un control deshabilitado (2.4.3) |
| Anuncio | El cambio **por el interruptor** lo anuncia el propio interruptor (`role="switch"`, activado/desactivado): **no** se repite en otra región. El bloqueo causado por **otra acción** (Guardar, Cancelar) se escribe en la región `role="status"` del pie (`GFormActions` `status`, siempre presente) o, sin `GFormActions`, en una región `role="status"` de la aplicación **dentro** del diálogo. Si además se muestra un `GToast`, **uno solo** de los dos lleva el texto | WCAG 4.1.3 sin dobles anuncios |
| Estado visible | Opcional: texto junto al interruptor («Formulario bloqueado» / «Edición permitida») con icono `lock` / `lock-open` (`lock-open` lo registra la aplicación con `createIcons`). No es región viva. El aspecto de solo lectura de los campos ya lo distingue sin color (borde discontinuo, C7) | WCAG 1.4.1 |
| `required` y validación | Bloqueado: **las marcas y `required` se conservan** (el formulario no cambia de forma al bloquear). La aplicación **no pasa errores ni advertencias** (`:errors="locked ? {} : errors"`, ídem `warnings`) y llama a **`resetState()` al bloquear**: un error en un campo que no se puede corregir no es accionable. Tampoco pasa la prop `error` de un campo mientras está bloqueado (se mostraría siempre) | WCAG 3.3.1 con errores que se puedan corregir; `GForm` no valida (#157) |
| Envío | Bloqueado: el botón de envío **`disabled`** (nativo, también si está en el pie de `GDialog` con `form="id"`), así **Enter en un campo no envía** (HTML: sin envío implícito con el botón por defecto deshabilitado). La aplicación además ignora `submit` con el bloqueo puesto. Secundaria: «Cerrar» bloqueado, «Cancelar» editable. Desbloqueado: envío habilitado (la aplicación puede además exigir `dirty`) | Readonly no impide el envío implícito; el botón deshabilitado sí |
| Volver a bloquear | **Sin cambios**: apagar el interruptor bloquea. **Con `dirty`**: pide confirmación (`GDialog role="alertdialog"`: «Seguir editando» / «Descartar cambios»); el interruptor sigue encendido hasta confirmar. **Cancelar** es descartar explícito: no confirma. Descartar = la aplicación restaura su copia guardada, `resetState()`, baja `dirty` y bloquea. **Guardar con éxito** bloquea; con error del servidor, sigue desbloqueado con `showErrors()` | Los valores son de la aplicación (#157): `GForm` no puede revertirlos |
| Cerrar con cambios | Esc, X o «Cerrar» con `dirty` en un `GDialog`: `@dismiss` + `preventDefault()` y la misma confirmación | Integración con `GDialog` (Fase 4 la documenta en general) |

**Fuera de este patrón (no se decide aquí):** quién puede ver el interruptor (permisos por rol: la aplicación lo oculta); autoguardado, `guard` de `beforeunload` y un `revert()` de valores (Fase 4).

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

**Consumidos (existentes):** `--g-space-1`, `--g-font-ui`, `--g-text-{title|body|body-sm|caption}-*`, `--g-text-title-weight`, `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-control`, `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-neutral-soft` (solo lectura, #186), `--g-color-{danger|warning|success}-text`, `--g-surface-*` (fondo del pie fijo), `--g-border-width`, `--g-focus-*`, `--g-duration-*` (incluido **`--g-duration-slow`**, nuevo para `GFormReveal`, #280; también lo usa el panel de `GFormSection`), `--g-ease-*`; `GInputGroup` además los de `GInput` (caja, radios, alturas por `size`). **`GFormSection` Fase 3: ningún token nuevo** (§3 «Tokens consumidos», #291).

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
| 3.2.2 / 3.3.7 / 2.4.3 (Fase 3, `GFormReveal`) | Abrir un bloque no mueve el foco ni anuncia nada (lo nuevo es lo siguiente en el orden); cerrado conserva lo escrito y sale del envío; cerrar con el foco dentro lo lleva a la pregunta, nunca a `<body>` (§14) |
| 1.4.1 · 2.4.3 · 3.3.1 · 3.3.4 · 4.1.2 (Fase 3, `GFormSection`) | `hN > button` con nombre invariable, `aria-expanded`, `aria-controls`; estado de errores con texto e icono en `aria-describedby`; las plegadas con error que bloquea se abren antes de enfocar; foco nunca en `<body>` al plegar o quitar; confirmación al descartar con algo que perder; título con al menos `space × 40` (§3) |
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

Además, densidades `comfortable` y `compact` y `pointer: coarse` en Chromium (las cajas crecen en alto; las comprobaciones 1–3 deben seguir pasando). Un fallo de esta prueba **bloquea** el paso a `candidate` de las piezas del formulario. **`GFormReveal`** añade un bloque abierto a esta prueba (§14, «Verificación»).

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
- **`GFormSection` (#192):** el aviso del `GDivider` a mano entre dos secciones sale una vez, dentro y fuera de `GForm` (texto nuevo, #290), y no sale con un divider antes de la primera sección ni entre una sección y otro hijo. **Fase 3:** §3 «Verificación (Fase 3)»; el aviso de reservadas se retira.
- **`GFormActions`:** `role="status"` presente vacío; apilado bajo `space × 104` con la primaria sola arriba y las demás compartiendo línea si caben (#185); `--g-form-actions-size` en el `<form>`; Tab por todos los controles de un formulario largo sin ninguno tapado (con y sin respaldo JS); avisos de primaria.
- **Orden de manejadores** en los seis campos; **`GInput` `prefix`/`suffix`** en `aria-describedby` (con y sin `*Label`).
- **`GFormReveal` y registro inactivo:** §14, «Verificación», y §2, «Registro inactivo».
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

## 14. `GFormReveal`: bloque condicional (Fase 3; #274 a #280)

**Un bloque de campos que existe solo si una respuesta lo pide**: aparece justo después de la pregunta que lo condiciona («¿Requiere factura? Sí → datos fiscales»; «Tipo de persona: Física → CURP · Moral → razón social») y, mientras no aplica, sus campos **no forman parte del formulario** (ni `FormData`, ni Tab, ni validación nativa, ni errores, ni resumen) pero **conservan lo escrito** (WCAG 3.3.7). **Basado en:** `design/lab/form-reveal/r01/` (kiwi; `brief.md`, `declaracion.md` con los hallazgos L1 a L9, `index.html` con `XFormReveal` sobre los componentes reales, `verificar.mjs` 121/121 en los tres motores; commit `1bc028d`). **Componente complejo** (CLAUDE.md, «Modelos por rol»: cambia el estado del registro de `GForm` y se solapa con `GFormSection collapsible`/`addable` y con el submenú de `GSidebar`): **coco y bruno en Opus**.

**Frontera** (sin duplicar): `GFormSection collapsible` (§3) la abre el usuario con un botón y sus datos **siguen** enviándose y validándose; `addable` = el usuario decide incluir; `disabled` = el dato existe pero no se puede tocar ahora («mostrar todo y deshabilitar» está **rechazado** para lo que no aplica, §1); `GFieldGroup` = una pregunta compuesta. Aquí **la respuesta decide**.

### Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `when` | Boolean | | `false` | propia: el bloque aplica. Lo calcula la aplicación con su modelo (`:when="factura === 'si'"`, `:when="persona === 'moral'"`) |

- **Nada más** (#274): sin `v-model`, `is`/`equals`, `exclude`, `keepValues`, `indent`, `label`, `focus`, `density` ni `for`. Cerrado **siempre** sale del envío y **siempre** conserva; la sangría es una sola convención; el nombre lo dan sus campos y el orden; la densidad, el contexto.
- **Atributos** (`id`, `class`, `data-*`, escuchas) van a la raíz `<div>` (`inheritAttrs` normal). La escucha propia de `transitionend` se fusiona **primero** (`mergeProps`), la del consumidor después.
- **Activo** = `when` **y** todos sus `GFormReveal` ancestros activos. Un anidado conserva su propio estado visual (`is-open`) dentro de un padre cerrado, pero está inactivo.

### Eventos

**Ninguno.** La aplicación ya sabe cuándo cambia `when`. Quien necesite el final de la animación escucha `transitionend` nativo en la raíz (con `event.target === event.currentTarget`; con movimiento reducido solo hay transición de `opacity`).

### Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| default | Campos condicionados: campos sueltos, `GFormRow`, `GFieldGroup`, `GInputGroup`, `GCheckbox`/`GCheckboxGroup`, `GRadioGroup`, `GSwitch`, `GTextarea`, campos propios, `GFormReveal` anidados (justo después de **su** pregunta, dentro del bloque) | Dentro de `__body`, como hijos de una **pila** (cada hijo ocupa el ancho entero, como en `GFormLayout`). **Nunca `GFormSection`** (aviso c): si el bloque merece título, la sección contiene la pregunta y el bloque. Si las partes forman **una pregunta** con título, es un `GFieldGroup` dentro del bloque |

### Estructura

```html
<!-- inmediatamente después de la pregunta, hermano suyo en la misma pila -->
<div class="g-form-reveal g-form-reveal--density-default is-open is-ready" id="…"
     style="--_reveal-gap: 20px">                                   <!-- cerrado: sin is-open, con inert="" -->
  <fieldset class="g-form-reveal__body" role="none">                <!-- cerrado: disabled -->
    <!-- slot por defecto -->
  </fieldset>
</div>
```

1. **Raíz `<div>` sin rol** (#275): rejilla de **una pista** (`grid-template-rows: 0fr` → `1fr`); es quien anima y quien recibe **`inert`** (atributo presente solo cerrado).
2. **Cuerpo `<fieldset role="none">`**, **`disabled` mientras está cerrado**: el único mecanismo nativo que saca de `FormData` y de la validación de restricciones a **todos** los controles descendientes (los del consumidor y los `<input hidden>` de `GSelect`/`GDatePicker` incluidos) y se hereda en los anidados. `inert` solo no basta. `role="none"` (permitido en `fieldset` por *ARIA in HTML*): sin nombre, un `fieldset` sería un grupo vacío. **Sin `<legend>`.**
3. **Contenido siempre montado** (ni `v-if` ni montaje diferido): conserva valores no controlados y el estado de los anidados; `GFormRow` y el segmentado siguen midiendo mientras está cerrado.
4. **Pila:** el cuerpo separa sus hijos con `--g-form-gap` × densidad (clase `g-form-reveal--density-{d}`, con la densidad del sub‑contexto de distribución › `GForm` › `default`) y **re‑provee el sub‑contexto de distribución** (`layoutKey`: `block: true`, `density` resuelta y `stack`, `readonly`, `disabled` del sub‑contexto padre), así sus campos se comportan igual dentro y fuera de un `GFormLayout`. Los avisos de `GFormLayout` no se aplican a los hijos del cuerpo.
5. **Sin vínculo ARIA con la pregunta** (#275): ni `aria-expanded` (ARIA 1.2 no lo admite en `radio`; en una casilla la haría sonar como botón de divulgación) ni `aria-controls`. El bloque **no conoce a su disparador**.
6. **Sin región viva**: el contenido nuevo es lo siguiente en el orden de lectura y de Tab. Guía de contenido (README): si conviene adelantarlo, lo dice la descripción de la opción («Te pediremos tus datos fiscales»).
7. **Fuera de `GForm`** funciona igual (`inert`, `fieldset`, transición); solo falta la parte del registro.
8. **SSR:** se pinta con `inert` y `disabled` según `when` (fuera del envío desde el primer HTML); sin `--_reveal-gap` en línea hasta montar (un bloque cerrado deja una separación hasta entonces); sin `is-ready`.

### Colocación (#275, #279)

- **Inmediatamente después de la pregunta que lo condiciona**, como hermano en la misma pila: un `GFormLayout` (dentro de una sección, el `GFormLayout` de su cuerpo: el cuerpo de `GFormSection` **no** es una pila, §3, #283) o el cuerpo de otro `GFormReveal`. En un contenedor propio del consumidor (fuera de `GForm`), la separación es su `row-gap`; con `row-gap: normal`, `0px` y el bloque queda pegado a la pregunta. Varios bloques excluyentes de la misma pregunta van seguidos (Física → …; Moral → …): el cerrado no ocupa nada.
- **Nunca dentro de una `GFormRow`**: un bloque ocupa su propia fila y **contiene** filas («Otro → Especifique» va debajo, no al lado).
- **Nombres:** cada campo tiene su `name` en todo el formulario, también entre ramas excluyentes (aviso 1 de `GForm`). Un campo común a varias ramas (RFC para persona física y moral) va **una vez**, fuera de los bloques; la regla de longitud distinta es de la aplicación.

### Señal de pertenencia (#275, #280)

**Barra al inicio + sangría** del cuerpo: dice «esto depende de la respuesta de arriba» sin texto. La barra se alinea con el **borde de inicio de la pregunta** (el del bloque; no con el centro del primer radio); **solo cambia el borde de inicio**, el de fin es el de todas las filas (#171); cada nivel anidado añade su barra; es un **borde** (no sombra ni fondo) para que sobreviva a `forced-colors`; propiedades lógicas (RTL: a la derecha). Grosor, color y sangría los elige coco con tokens existentes (§«Tokens consumidos»). No es la única señal (orden y sangría): no se le exige 3:1, como `GDivider subtle` (#89).

### Foco y desplazamiento (#275)

- **Al abrir, el foco no se mueve** y no hay prop para moverlo (WCAG 3.2.2; con radios rompería las flechas). Tab desde la pregunta entra en el bloque abierto.
- **Al cerrar con el foco dentro** (solo por programa: la pregunta va antes): **antes** de aplicar `inert` y `disabled` (en el mismo ciclo, antes de pintar), el foco va al **último elemento enfocable que precede a la raíz** en orden del documento (fuera del bloque, no deshabilitado, no `inert`, con caja); si es un radio, a la **opción elegida** de su grupo (mismo `name` y mismo formulario), si la hay. Sin ninguno anterior, al primero posterior. Con `preventScroll: true`. **Nunca queda en `<body>`** (2.4.3).
- **Sin desplazamiento automático** al abrir ni al cerrar.

### Transición (#278)

| Fase | Raíz | Cuerpo | Campos (en `GForm`) |
| --- | --- | --- | --- |
| Cerrado | sin `is-open`, `inert`, `visibility: hidden`, altura 0, `margin-block-start` = −`--_reveal-gap` | `disabled`, recortado | inactivos |
| Abriendo | `is-open is-animating`, sin `inert` | habilitado, recortado (`overflow: hidden`, `min-block-size: 0`) | activos |
| Abierto | `is-open` | habilitado, `overflow: visible` (no recorta anillos de foco ni sombras) | activos |
| Cerrando | sin `is-open`, `is-animating`, `inert` | `disabled`, recortado | inactivos, revelado limpio |

- **`is-open`, `inert` y `disabled` cambian en el acto** con `when` (Tab llega al bloque desde el primer cuadro de la apertura).
- **`is-animating`** desde el cambio de `when` hasta el `transitionend` de `grid-template-rows` **cuya diana es la raíz**, o un **temporizador de respaldo** = la mayor suma de `transition-duration` + `transition-delay` calculadas de la raíz + 50ms (una transición de 0s no emite el evento: movimiento reducido).
- **`is-ready`** tras el primer pintado (doble `requestAnimationFrame`): **sin animar al montar** (plan 012) ni al reabrir un padre cuyo anidado ya estaba abierto (su estado no cambió).
- **Interrupción:** cambiar `when` a mitad revierte desde la altura actual (transiciones CSS; nada que medir).
- **Separación del contenedor:** `--_reveal-gap` (px) = `row-gap` calculado del **elemento padre** (0 si no es un número), escrito en línea al montar, en cada cambio de `when` y cuando el padre cambia de tamaño (`ResizeObserver` **compartido** por todos los bloques, observando a cada padre; escrituras en `requestAnimationFrame` y solo si cambian, #173). No se mide ninguna altura. Así un bloque cerrado no deja hueco (pregunta → siguiente campo = una separación) y al abrir lo de abajo baja de forma continua. El disparador no se mueve (Δ 0px), con el límite siguiente.
- **Límite del Δ 0px: cerrar al final de la página** (auditoría de coco, hallazgo 2; #283). Si la página está desplazada hasta el final y lo que hay debajo no basta para conservar ese desplazamiento, al **cerrar** un bloque la página encoge y el navegador **recorta el desplazamiento**: el disparador baja lo que encoge la página (bloque de 408px + separación de 20px: 428px, medido en los tres motores). Baja en continuo, con la curva del bloque, y sigue visible. Es inherente (pasa igual con `<details>`) y **no tiene arreglo en CSS**; compensarlo desplazando por programa queda descartado (contradice «sin desplazamiento automático», §«Foco y desplazamiento»). Al **abrir** al final, Δ 0px. Va en la sección «Límites» del README.
- **Opacidad:** al abrir, fundido que termina con la altura (empieza con retraso); al cerrar, fundido corto desde el principio; `visibility` pasa a `hidden` solo al final.
- **Movimiento reducido** (plan 007: menos, no cero): altura y margen en **un cuadro**; el **fundido se conserva** al abrir y al cerrar, y al cerrar el bloque sigue visible hasta que acaba.
- **`GFormLayout` pone `margin: 0` a sus hijos** (`.g-form-layout > *`): el margen negativo del bloque cerrado debe ganarle (para coco).

### Datos, errores y envío (con `GForm`; #276, #277)

| Situación | Comportamiento |
| --- | --- |
| Bloque inactivo | Sus campos **siguen registrados**, marcados inactivos: no bloquean el envío, no van en `invalid` ni en el resumen, `submit` y `showErrors()` no los revelan, `focusFirstError()` los salta, y **sus claves de `errors` no son generales**. La aplicación puede calcular `errors` **sin condiciones** |
| Pasa a inactivo con errores visibles | Salen **en silencio** del resumen (como al corregirse, #162) y de su instantánea; sin elementos, el resumen se oculta; los mensajes en línea se van con el bloque |
| Pasa a inactivo | Sus campos vuelven a **sin editar, sin revelar** (el valor se conserva) |
| Vuelve a activo | Un error reaparece por las reglas de siempre (salir habiendo escrito, cambio en un control de elección, envío); el resumen lo recupera en el siguiente envío o `showErrors()` |
| Envío con el bloque cerrado | `FormData` **sin** sus campos (por el `fieldset disabled`); `required` dentro conserva su marca y no cuenta |
| La aplicación envía **su modelo** (no `FormData`) | Recibe también los valores conservados de bloques cerrados: es su modelo y Grana no lo limpia. Receta: declarar la condición **una vez** (`const esMoral = computed(() => persona.value === 'moral')`), pasarla a `:when` y usarla para filtrar el modelo al enviar. **Sin** lista `inactive` en `submit` (#277) |
| `GForm readonly` / `disabled` | Pasan por el bloque a sus campos como siempre; el bloque no tiene esos estados (sigue a `when`) |
| `dirty` | Abrir o cerrar no lo cambia (ya lo subió el cambio en la pregunta) |

### Teclado

**Sin teclas propias.**

| Tecla | Acción |
| --- | --- |
| Tab / Mayús+Tab | Desde la pregunta entra en el bloque abierto; salta el cerrado (`inert` + `disabled`) |
| Flechas en un `GRadioGroup` (la pregunta) | Eligen al moverse (nativo, #272): el bloque se abre o se cierra **sin mover el foco** |
| Espacio en una casilla (la pregunta) | Igual |

### Tokens consumidos (#280)

| Token | Para qué |
| --- | --- |
| `--g-form-gap` | Separación entre los hijos del cuerpo (× densidad) |
| `--g-border-width` o `--g-space-1` | Grosor de la barra (coco elige; derivado, sin literal) |
| `--g-color-border-strong` o `--g-color-border-control` | Color de la barra (nunca `accent`, `brand` ni `active`) |
| `--g-space-*` | Sangría (distancia de la barra al contenido) |
| **`--g-duration-slow`** (nuevo, `tokens.md` §6) | Altura (`grid-template-rows`) y margen |
| `--g-duration-fast` | Fundido |
| `--g-ease-out` / `--g-ease-standard` | Curvas |

**Variable dinámica en línea:** `--_reveal-gap` (alias local; coco declara `0px` en `.g-form-reveal` y la de línea gana; excepción justificada como `--_form-row-*`, #173). En `forced-colors` la barra es un borde y toma el color del sistema sola.

### Clases (contrato bruno ↔ coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-form-reveal` | Raíz `div` | Siempre |
| `g-form-reveal--density-{default\|comfortable\|compact}` | Raíz | Siempre |
| `is-open` | Raíz | `when` verdadero (en el acto) |
| `is-animating` | Raíz | Desde un cambio de `when` hasta asentarse |
| `is-ready` | Raíz | Tras el primer pintado (sin ella, sin transiciones) |
| `g-form-reveal__body` | `fieldset role="none"` | Siempre |
| `--_reveal-gap` (en línea) | Raíz | Separación del padre en px, tras montar |

### Avisos de desarrollo (#279)

`[Grana GFormReveal]`, una vez por instancia, al montar:

1. Su elemento padre es la raíz de una `GFormRow`: «ocupa su propia fila y contiene filas; colócalo después de la fila de la pregunta».
2. No tiene hermano anterior: «debe ir justo después de la pregunta que lo condiciona».

`[Grana GFormSection]`, al montar:

3. Una `GFormSection` dentro de un `GFormReveal` (la sección lo detecta al inyectar `revealKey` con **`fromReveal`** verdadero; una `GFormSection addable` también provee `revealKey`, pero con el `fromReveal` de su ancestro, así que una sección dentro de una agregable **no** avisa, #288): «la sección contiene la pregunta y el bloque, no al revés».
4. Un `GFormReveal` (o un campo, o una `GFormRow`) como hijo directo del cuerpo de una `GFormSection` (lo detecta la sección; §3, «Campos directos en el cuerpo», #283): «los campos de una sección van en un `GFormLayout`…».

Ninguno cambia el comportamiento.

### Verificación

- **bruno (vitest + jsdom):** estructura (`div` sin rol, `fieldset role="none"`, sin `<legend>`); `inert` y `disabled` según `when`, también en SSR (`renderToString`); contenido montado con `when` falso; clases `is-open`/`is-animating`/`is-ready` (sin `is-ready` en el primer render); `--_reveal-gap` desde el `row-gap` del padre (simulado) y solo si cambia; atributos y orden de la escucha `transitionend`; re‑provisión de `layoutKey`; foco al cerrar (anterior, radio elegido, posterior); los cuatro avisos (el 4, en `GFormSection`: avisa con un campo, una `GFormRow` o un `GFormReveal` directos en el cuerpo y calla con un `GFormLayout` o con contenido que no son campos, #283). **Registro inactivo en `GForm`** (§1, §2): con `errors` sin condiciones para campos de un bloque cerrado, `submit` sale **sin** `invalid`; `showErrors()` y el envío no los revelan; `invalid` no los lista; sus claves no aparecen como generales; cerrar con errores visibles los quita del resumen (y lo oculta si queda vacío) y limpia editado y revelado; reabrir no muestra el error y el siguiente envío sí; anidado activo solo con el padre; `GFieldGroup`, `GCheckboxGroup`, `GInputGroup` y `GRadioGroup` dentro; un campo propio con `useFormField` dentro.
- **Playwright** (Chromium, Firefox y WebKit): adaptar `design/lab/form-reveal/r01/verificar.mjs` al componente real en `design/lab/theme-playground/` (sin transición al cargar; `FormData` y `:invalid` según la respuesta, con `GSelect` y `GDatePicker` dentro; Tab; disparador Δ 0px en cada cuadro al abrir y cerrar, LTR y RTL; Δscroll 0; altura y opacidad intermedias; `overflow` visible al asentarse; interrupción; movimiento reducido; 320px con dos niveles sin desborde; foco al cerrar por programa) y añadir un bloque abierto a la **prueba obligatoria de distribución** (#184: las filas del cuerpo terminan en el mismo borde que las de fuera, menos la sangría en el inicio).
- **coco (auditoría con un tema distinto):** barra visible y alineada con el inicio de la pregunta en las tres densidades, anidados, RTL y `forced-colors`; que el aspecto deshabilitado nativo de los controles (`GBtn:disabled`, etiquetas de grupo con `:disabled`) no destaque durante el fundido de cierre; `--g-duration-slow` en `GSidebar` y `GStepper` sin cambio visible.
- **No verificado y pendiente:** lector de pantalla real (qué se oye al elegir «Sí» y al tabular al bloque; que `fieldset role="none"` no se anuncie como grupo); Safari, iOS y táctil reales; `forced-colors` en Firefox y WebKit; rendimiento con muchos bloques. (Cerrar un bloque grande con la página al final: medido por coco y anotado como límite en «Transición», #283.)

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
| Sexo (segmentado en kiwi) | `GSelect` hasta la Fase 2 (`GRadioGroup appearance="segmented"`, #181) | Contratado (`radio-group.md`, #267 a #273): al construirse `GRadioGroup`, el playground cambia Sexo a `GRadioGroup appearance="segmented"` |
| Campos: hijos directos etiqueta · caja · ayuda · mensaje (C12 de la Fase 1) | **Etiqueta · caja · pie** (`__support` con ayuda, contador y mensaje) | bruno cambia el marcado de `GInput`, `GTextarea`, `GSelect`, `GDatePicker`; coco, sus reglas de pista |

## Fases siguientes (reservado; no forma parte de este contrato)

| Fase | Contenido | Motivo de diferirlo |
| --- | --- | --- |
| **2 · Campos imprescindibles** | **`GRadioGroup`: contratado** en `design/contracts/radio-group.md` (#267 a #273; kiwi r01): `appearance` `list` `inline` `segmented` **`chip` `card`** (singular, los valores ya publicados de `GCheckbox` `layout`; corrige la reserva en plural, #267); `options` como `GSelect`; **sin `GRadio` en v0.1** (nombre reservado: un radio suelto no tiene sentido); raíz `role="radiogroup"` en todas (`fieldset` en `list`, `chip`, `card`); **`inline` y `segmented` comparten línea** (#268); `aria-required` en el grupo y nunca `required` nativo (#269); radios nativos; relación con `GCard selectType="radio"`, #124 y **`GNumberField`** (`<input type="text" inputmode>`, `min` `max` `step` `precision` `locale`, prefijo/sufijo de C13, −/+ opcionales con `minus`/`plus`), **sin moneda** (#154). **Requisitos de r02** (#181): `GRadioGroup appearance="segmented"` usa raíz **`role="radiogroup"` + `aria-labelledby`** hacia una etiqueta visible (no `fieldset`/`legend`) y la estructura de tres hijos (C12), para poder compartir línea en una `GFormRow` (patrón APG *Radio Group*; radios nativos, una parada de Tab y flechas); las demás apariencias siguen con `fieldset`/`legend` y van en su propia fila. **Partes nuevas de `GInputGroup`:** `GSelect` como parte (opciones ricas, búsqueda; sin autocompletado) y `GNumberField` como parte. (`GFieldGroup joined` se retira: es `GInputGroup`, §13) | Sin ellos no hay Sí/No ni campos numéricos; cada uno merece su contrato y su verificación |
| **3 · Divulgación y navegación** | **`GFormSection` `mode` `collapsible` y `addable`, `headerPlacement` y `divider`: contratados en §3** (#284 a #291; kiwi `form-section/r01`); **`GFormReveal`: contratado en §14** (#274 a #280; solo `when`; `exclude`, `keepValues` e `indent` **no entran**); **`GFormNav`** (sin ronda: `<nav>` con nombre, `aria-current="location"`, estado por sección en texto, *scroll-spy*, ≥ `space × 190`; **lee de cada sección** su `id`, título, `open`, el recuento de errores de §3 y `summary`; un clic en una sección plegada lleva a su encabezado y **enfoca su botón sin abrirla** —navegar no es desplegar—, un enlace a un **campo** sí abre por `OPEN_REQUEST`; kiwi L12); token del ancho de la navegación (la barra del bloque condicional y las secciones de la Fase 3 no llevan tokens propios, #280, #291); **buscar en la página** dentro de plegadas (`hidden="until-found"`, kiwi L11): pendiente no bloqueante | Formularios largos; comportamiento nuevo que kiwi verificó pero necesita contrato propio |
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
| 11 | `GFormSection` | §3: solo fija en la Fase 1; `mode`, `open`, `added`, `headerPlacement`, `labels` reservadas para la Fase 3 (**contratadas**: §3, #284 a #291); insignia con `labels.sectionOptional` de `GForm` | #161 |
| 12 | Alineación de cajas | *Subgrid* solo en `g-form-row` (CSS de cada campo, pistas con nombre); en la rejilla general, alineación superior y regla de contenido | #159 |
| 13 | `GFormReveal` | **Fase 3**: **contratado en §14** (kiwi `form-reveal/r01`; tabla «Resolución de hallazgos de kiwi (`GFormReveal` r01, §8)») | Divulgación es un bloque propio; #274 a #280 |
| 14 | `GFormActions` | §6: `sticky`, `status`; sin `align` (orden fijado por el usuario); `--g-form-actions-size` publicada por `GForm`; avisos de primaria | #155, #163 |
| 15 | `GFormNav` | **Fase 3** (no reutiliza `GSidebar`) | §1.8 de kiwi |
| 16 | `GRadioGroup` | **Fase 2**: contrato propio `radio-group.md` (kiwi r01; #267 a #273) | Contrato propio |
| 17 | `GNumberField` | **Fase 2**, **sin moneda** | #154 |
| 18 | Tokens | §9 y `tokens.md` §21: cinco tokens nuevos; solo lectura y estados con existentes; navegación → Fase 3; barra de condicional sin tokens propios (#280) | #167; §17.6 |
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
| L7 | Segmentado en fila | **Fase 2**: `GRadioGroup appearance="segmented"` con `role="radiogroup"` + `aria-labelledby` y tres hijos; hasta entonces el playground usa `GSelect` para Sexo (no es imprescindible para la demo de distribución). **Contratado** en `radio-group.md`; `inline` también comparte línea (#268) y el segmentado publica su mínimo intrínseco (#271) | #181, #268, #271 |
| L8 | Solo lectura en oscuro | Resuelto por coco sin token: relleno `--g-color-neutral-soft` (§9, C7); el CLI debe validar `border-control` ≥ 3:1 sobre él | #186 |
| L9 | Acciones en el mismo borde | §6: `GFormActions` termina en el mismo borde que las filas; el apilado se mide con su propio ancho (sin cambio de API) | #155 |
| L10 | Drawer | `GFormLayout stack`: un campo por línea en toda fila salvo `keep` | #173 |
| r02 §11 | Compacto suelto se estira | Aceptado como derivado de «sin huecos»: un campo fuera de fila ocupa el ancho entero; avisos en `GFormLayout` (hijo `xs`/`sm`) y `GFormRow` (fila de un solo `xs`/`sm`) sugieren agrupar | #172 |

## Resolución de hallazgos de kiwi (`GFormReveal` r01, §8)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | API mínima: solo `when` | **Confirmada**: `when` (Boolean, `false`) + slot por defecto; sin eventos, sin `v-model`, sin `density`. Contrato como **§14 de este archivo** (no archivo propio) | #274; AGENTS.md (la lógica es de la aplicación); #156 |
| L2 | Reserva `exclude`, `keepValues`, `indent` | **No entran**, tampoco `label` ni `focus`: cerrado siempre fuera del envío, siempre conserva, una convención de sangría; nombre por los campos; foco quieto. «Fases siguientes» actualizada | #274; WCAG 3.3.7, 3.2.2 |
| L3 | Registro inactivo en `GForm` y `useFormField` | §2 «Registro inactivo»: `revealKey` interna con `active`; `inactive()` en cada registro (`useFormField` y `useCompositeField`); `blocking()`, `revealAll()`, `focusFirstError()`, `visible()`/`isShown()` y `notify*` los saltan; nombres **siguen cubiertos**; al desactivarse se limpian editado, revelado **y la instantánea del resumen** | #276; #157, #162 |
| L4 | Estructura y clases | §14: `g-form-reveal` (`div` sin rol, `inert`), `g-form-reveal__body` (`fieldset role="none"`, `disabled`), `is-open`, `is-animating`, `is-ready`, `--_reveal-gap`; **añadido**: `g-form-reveal--density-{d}` y re‑provisión del sub‑contexto de distribución (el cuerpo es una pila con `--g-form-gap` × densidad) | #275, #278 |
| L5 | Avisos de desarrollo | §14: (1) dentro de una `GFormRow`, (2) sin hermano anterior, desde `GFormReveal`; (3) `GFormSection` dentro, desde la sección al inyectar `revealKey` | #279 |
| L6 | Nombres inactivos para quien envía su modelo | **No se añade** `inactive` a `submit` ni `isActive(name)`: `FormData` ya excluye; receta con la condición declarada una vez y reutilizada en `when` y al filtrar el modelo. `inactive` queda reservado (sería API de producto) | #277 |
| L7 | Tokens | Nace **`--g-duration-slow`** (tercer componente con los 240ms; `GSidebar` y `GStepper` migran su `--_t-slow`); barra y sangría **sin tokens propios** (borde, `space`, color de borde existente); se cierra la reserva de `tokens.md` §21 | #280; `plans/README.md`; §17.6 |
| L8 | `GDialog` mueve el disparador al crecer | Se deriva de «sin saltos» (form r01 §11): **ronda propia de `GDialog`** (crecer hacia abajo con el borde superior fijo; la hoja conserva su borde superior mientras quepa), anotada en `dialog.md` «Abierto»; **no bloquea** `GFormReveal` | #281 |
| L9 | Etiqueta del grupo de radios sin `dir="auto"` | `radio-group.md`: el texto de `__label` va en `<span class="g-radio-group__label-text" dir="auto">` (no en `__label`, para no cambiar su alineación); bruno en esta ronda | #282; #269 |

## Resolución de hallazgos de kiwi (`GFormSection` Fase 3 r01, §10)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Props de la Fase 3 | §3 «Props»: `mode` (`static`·`collapsible`·`addable`, `static`), `open` y `added` (Boolean, `false`, controlados y no controlados), `summary` (String) + slot `summary`, `headerPlacement` (`top`·`auto`), `divider`; `labels` de la sección con textos **completos** (`add`, `remove`, `removeTitle`, `removeBody`, `removeConfirm`, `removeCancel`; el título solo no dice la acción y una plantilla rompe concordancia); sin un texto, sin su botón o sin confirmación (precedente `closeLabel`). `GForm labels.sectionErrors` (String con `{count}` o Function) | #284, #286; precedentes #162, `dialog.md` |
| L2 | Eventos | Solo `update:open` (también al abrir para llevar a un campo) y `update:added`; sin `toggle`/`add`/`remove`: `update:added(false)` es «quitó» y la aplicación vacía su modelo | #284 |
| L3 | Abrir antes de enfocar | Evento DOM interno **`OPEN_REQUEST`** (`'g-open-request'`, burbujea, cancelable) despachado por `revealAndFocus` desde el control y por `GForm` para cada error que bloquea; cada plegable lo escucha en su `__panel`, abre con `is-instant` y cancela; quien lo despachó espera un `nextTick`. `focusFirstError()` → `Promise<boolean>`. Sin registro de secciones en `GForm`: no acopla `GErrorSummary` y funciona fuera de `GForm` y con anidadas | #287 |
| L4 | Errores por sección | `sectionKey.register(entry)` desde `useFormField`/`useCompositeField` (misma condición que en `GForm`), propagado a las secciones ancestro; cuenta preguntas con error **visible**, sin advertencias, deshabilitados ni inactivos; solo dentro de `GForm` (texto y revelado son suyos) | #286; #157 |
| L5 | `addable` con registro inactivo | `revealKey` provisto por la sección con `active` = `added` y el ancestro, y **`fromReveal`** heredado (el aviso 3 de §14 solo sale por un `GFormReveal`); «editado» por `input`/`change` nativos en el cuerpo y `sectionKey.notifyEdit()`. **Cambio sobre kiwi 33:** también confirma si la sección la **agregó la aplicación** (datos guardados que no se recuperan repitiendo una acción); quitar sube `dirty` | #288; WCAG 3.3.4 |
| L6 | Avisos | §3 avisos 1 a 8 (añadidos: `mode` que cambia tras montar; sin textos de confirmación, quita directo). **Cambio:** un `GIcon` **con `label`** en `summary` **no** avisa: `summary` es texto que describe el botón, no un hueco de icono decorativo, y un icono con nombre es contenido legítimo; sí avisa lo interactivo. Se retira el aviso de reservadas | #284; `api.md` «Iconos» |
| L7 | Clases | §3 «Clases»: `g-form-section--mode-{modo}` (convención `--{prop}-{valor}`), `is-open`, `is-added`, `is-animating`, `is-ready`, `is-instant`, **`is-header-side`** y **`is-actions-below`** (estados medidos, como `is-stacked`, #271), partes `__toggle`, `__chevron`, `__toggle-text`, `__summary`, `__status`, `__summary-text`, `__add`, `__add-button`, `__remove`, `__panel`, `__divider`, `__confirm`; `__body` se conserva | #285, #289; `api.md` |
| L8 | Tokens | Ninguno nuevo; `--g-duration-slow`/`-fast`, `--g-ease-*`, `--g-color-danger-text`; umbrales `space × 200` y `× 40` como constantes; sin `--g-divider-inset` propio (mapa de anfitrionas vacío) | #291; #130, #195 |
| L9 | Título contra acciones en estrecho (también Fase 1) | Título con al menos **`space × 40`**; si no cabe junto a las acciones, **`is-actions-below`**: acciones en su propia línea, al inicio, después de la descripción. Lo mide la sección con el `ResizeObserver` compartido (ancho natural de las acciones, sin vaivén); CSS de coco | #289; WCAG 1.4.10 |
| L10 | Foco inicial de `GDialog` | No es de esta sección: bruno lo corrigió (commit `2a77a7c`) y lima fija el orden en `dialog.md` «Foco». La confirmación de «Quitar» pone `autofocus` en «Cancelar» | #292 |
| L11 | Buscar en la página | **No entra** en esta fase: límite documentado en el README; `hidden="until-found"` queda pendiente no bloqueante (ronda corta si un caso real lo pide) | #291 |
| L12 | `GFormNav` | Anotado en «Fases siguientes»: lee `id`, título, `open`, recuento y `summary`; ir a una sección enfoca su botón sin abrirla; ir a un campo abre por `OPEN_REQUEST` | #291 |

