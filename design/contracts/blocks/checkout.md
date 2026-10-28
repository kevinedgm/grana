# Contrato · Checkout (`GbCheckout01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914 y #922, 2026-10-23; #932, #933, #938, #940, #941) · **Remates #932 a #941 (2026-10-26):** **EC-L7 decidida (2026-10-28, #950):** 03 recompuesta con `GSplit` (bruno 8710e80, coco b19cd65) y la sección en **`candidate`** (f285c25, #955) · **Peso:** ≤ 9,5 KiB (9 728 B) por variante, excepción de #932 · **Plan:** E8 (§4.2) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38; el motor de campos de `guest-form.md` · **Compone:** `GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GRadioGroup appearance="card"`, `GCheckbox`, `GFieldGroup`, `GErrorSummary`, `GFormActions`, `GStepper`, `GSummary`, `GAccordion`, `GSplit` (03, #950), `GBtn`, `GPrice` + `GPriceScope`, `GText` (con `dl`) y el resumen de Order summary (E9) · **Parte de bruno:** C · **Compleja: coco y bruno en Opus** (formulario por pasos, validación, paso de la aplicación por slot y resumen del pedido)

## Promesa

Pedir lo que hay en el carrito **dando solo lo necesario, paso a paso, sin perder nada al volver**, con el total siempre junto al botón. El bloque valida como el navegador y emite cada paso; **el pago es de la aplicación** (un slot con su pasarela), y el pedido lo hace la aplicación.

## Props

```ts
interface GbCheckoutProps {
  title: string                        // «Finalizar compra»
  steps: CheckoutStep[]                // 2 a 5 (C7 por encima de 5): envío, entrega, pago (slot), revisión
  step?: string                        // v-model:step (id del paso actual; el primero por defecto)
  values?: Record<string, string>      // v-model:values
  order: OrderSummary                  // lo que se compra (líneas y totales, de la aplicación)
  prices: PriceRegion                  // obligatoria
  busy?: boolean                       // enviando un paso
  errors?: Record<string, string>      // errores de la aplicación por name; ganan a la validación
  error?: string                       // error general (en el resumen de errores)
  locale?: string
  labels: {
    required: string                   // «Escribe {label}» (como Guest form)
    invalid: string                    // «Revisa {label}»
    choose?: string                    // «Elige {label}» (un campo choice sin elegir)
    consent?: string; consents?: string
    back: string                       // «Atrás»
    edit: string | ((step: string) => string)   // «Cambiar {step}» (resumen de un paso hecho)
    order: string                      // título del resumen del pedido («Tu pedido»)
    total: string                      // «Total»
    busy?: string
    lines?: string; quantity?: string | ((count: number) => string); pending?: string   // los de Order summary (#938): opcionales; C5 solo si el bloque pinta el pedido
    placedAt?: string | ((date: string) => string); delivery?: string | ((date: string) => string); reference?: string
    form?: GranaLabels; errorSummary?: GranaLabels; stepper?: GranaLabels; datePicker?: GranaLabels
    price?: PriceLabels & { legend?: string }
    external?: string
  }
}
```

## Anatomía (común)

```
GForm [data-gb] (labels.form; errors = los del paso ∪ errors de la app; un solo GForm para todos los pasos)
├─ GErrorSummary (labels.errorSummary; con `error`, el general)
├─ por paso: el paso actual con sus campos (GFormSection por `groups`, o los campos directos en un GFormLayout)
│  · campos de `fields` con el motor de Guest form (tipo cerrado → control, autocomplete, why, row, messages)
│  · `type: 'choice'` → GRadioGroup appearance="card" (label, name, options; cada opción con su descripción y su precio, ver abajo)
│  · `consents` → GFieldGroup (legend = labels.consents) › GCheckbox (nunca marcadas; enlace fuera del label)
│  · sin `fields` → slot `step-{id}` de la aplicación (p. ej. su pasarela de pago), con { step, values, submit }
├─ pasos hechos: su resumen en una línea (GSummary) con «Cambiar»
└─ GFormActions [sticky en 03] (status = el total) › «Atrás» (ghost, no valida) + GBtn type="submit" (step.action, loading = busy)
```

- **El motor de campos es el de Guest form** (`guest-form.md` «Anatomía», «Validación», «Consentimientos», «Contadores»): el mismo comportamiento, compartido por `common/` (§32). Sin `GPartyField` (no hay consulta) y sin `party`.
- **Validación por paso**: el envío de un paso revela y comprueba **solo sus campos** (como «Siguiente» de Guest form 02); con errores, `showErrors()`, foco al primero y **ningún** `submit`. Sin errores, **`submit { event, step, data, values, consents, final, preventDefault(), defaultPrevented }`** (`final` en el último paso), **síncrono y cancelable**: sin `preventDefault()`, el bloque pasa al paso siguiente (`update:step`) y el foco va al primer control del paso nuevo (por el `id` que genera; nunca al título de `GFormSection`, DOM interno); con `preventDefault()`, espera a que la aplicación cambie `step` (comprobar una dirección, cotizar el envío) y entonces mueve el foco igual. Un error de la aplicación en un campo de otro paso lleva a ese paso y a ese campo.
- **Paso de la aplicación** (sin `fields`, §27 regla 6): el bloque pinta el slot `step-{id}` dentro del formulario, con su título; su botón es el del paso (`step.action`) y emite `submit` del paso con `data` del formulario (lo que la pasarela ponga en el `FormData` es cosa suya). El bloque **no lee ni valida** lo que hay en el slot; la aplicación informa con `errors`/`error` y decide cuándo avanzar (con `preventDefault()`). Un campo de tarjeta en `fields` (`autocomplete` `cc-*`, `name` `card*`) no se pinta (**EC6**).
- **Opciones con precio** (`type: 'choice'`, envío y entrega): `GRadioGroup appearance="card"` con el slot `option` que compone `label`, `description` y `GPrice size="sm"` del `price` (`Gratis` con `labels.price.free`); el contenido del slot es **todo el nombre del radio** (`radio-group.md`: «Estándar, de 3 a 5 días, 99 pesos mexicanos»), así el precio se oye al elegir. Una opción con `disabled` String: deshabilitada y el motivo en su descripción (§27 regla 1).
- **Resumen de un paso hecho**: `GSummary layout="row"` (`title` = `step.title`, `facts` = las respuestas: por campo con valor, `{ label, value }`; un `choice` con la etiqueta de la opción; `step.summary` de la aplicación, si lo da, como `subtitle` y sin `facts`) y un `GBtn variant="link"` `labels.edit(step.title)` que vuelve a ese paso (**sin borrar nada**: `values` se conserva; §27 regla 3). Los consentimientos no se resumen.
- **El total junto al botón**: en el `status` de `GFormActions`, `GText size="body-sm"` con `labels.total` y `GPrice size="md"` del `order.totals.total.value` (dentro del `GPriceScope`). En 03 el pie es `sticky` (`GFormActions` ya cuida 2.4.11 dentro de `GForm`).
- **El pedido**: el resumen de Order summary (E9) con `order` y los `labels` comunes (por `common/`, la misma pieza que `GbOrderSummary02`), dentro del único `GPriceScope` del bloque.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Por pasos** | Un paso a la vista con `GStepper` arriba; el pedido plegado en una línea encima | `GSection` › `GStack gap="lg"` › `GAccordion` (un `GAccordionItem` «Tu pedido», `meta` = el total, `peek` = la cuenta de piezas; el pedido dentro) + `GStepper` (`steps` = los pasos, `navigation="back"`, `v-model` = `step`) + `GForm` con **solo** el paso actual a la vista (los demás `hidden`, montados: sus datos van en el `FormData`) | — |
| **02 · Se pliega lo hecho** | Todos los pasos en la página; el hecho se pliega en su resumen con «Cambiar» y el siguiente se abre | `GSection` › `GStack gap="lg"` › `GAccordion` del pedido (como 01) + `GForm` › un `GFormSection mode="collapsible"` por paso (`title`, `summary` = el resumen del paso hecho, `open` = es el actual; los posteriores al actual, cerrados e `inert` hasta llegar: no se salta un paso sin hacer el anterior) | `labels.stepper` |
| **03 · Con el pedido al lado** | El formulario por pasos y, al lado en ancho (debajo en estrecho), el pedido abierto; el pie con el total pegado | `GSection` › `GSplit ratio="3:2" gap="lg"` › [`#start` › `GStepper` + `GForm` de 01 con `GFormActions sticky`] + [`#end` › el pedido abierto (E9 02)] | el `GAccordion` del pedido |

**03 en ancho (EC-L7 resuelto por #950):** `GSplit ratio="3:2" gap="lg"` pone el pedido al lado del formulario cuando la caja lo admite (586 · 390 a 1440, 536 · 358 a 1024) y debajo a 768, 390, 320 y con el texto al 200 % (`split.md` «Uso en los bloques»). Sin suelo de contenido (`split.md` regla 6): el `GStepper` en fila no deja la pareja apilada tras pasar por 768. El total sigue junto al botón en el `status` del pie pegado, que se pega dentro de la región `start` y no tapa el pedido.

**Volver no borra** en las tres (§27 regla 3): «Atrás» (01, 03) o «Cambiar» (02, y el resumen de 01/03) no valida, conserva `values` y lleva al paso; los pasos hechos siguen hechos al volver hacia delante si nada cambió.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, step, data: FormData, values, consents, final, preventDefault(), defaultPrevented }` | Un paso válido (cancelable; ver arriba) |
| `update:step` | `string` | Avanzar, volver o «Cambiar» |
| `update:values` | `Record<string, string>` | Cada cambio |
| `navigate` | `{ event, href, item }` | Un enlace de consentimiento o del pedido |

## Slots

`step-{id}` `{ step, values }` (**obligatorio** para un paso sin `fields`: el pago u otro paso de la aplicación), `field-{name}` `{ field, value, error, id }` (escape de Guest form), `order` `{ order }` (escape: el resumen propio), `description`.

## Estructura accesible

`GSection` con título; un solo `form` (`GForm`) con su resumen de errores; el paso actual con su encabezado (`GFormSection` o el título del paso, un nivel por debajo); `GStepper` anuncia el paso; los resúmenes de pasos hechos son texto con su «Cambiar» nombrado («Cambiar Envío»); el total del pie es texto con su frase de `GPrice`; el pago lo pone la aplicación con la accesibilidad de su pasarela (receta del README: su `iframe` con `title`). Autocompletar en todos los campos de dirección y contacto (1.3.5; aviso G2 de Guest form para correo y teléfono). Sin `h1`.

## Qué lo hace distinto (#922)

**Volver no borra nada y lo hecho se pliega en una línea.** Quien paga en el teléfono vuelve a cambiar la dirección sin perder lo que escribió en la entrega, y cada paso hecho queda como una frase («Envío · Macedonio Alcalá 202, Oaxaca · Estándar, de 3 a 5 días») con «Cambiar» al lado. El precio de cada forma de envío se oye al elegirla, el total va **siempre junto al botón**, y el pago es de la pasarela de la tienda en su propio hueco: Grana nunca toca un número de tarjeta. Los consentimientos nunca vienen marcados y el error de la aplicación lleva al paso y al campo exactos.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `required`, `invalid`, `back`, `edit`, `order`, `total` | Sí (C5) |
| `choose` | Sí, con un `choice` obligatorio (C5) |
| `consent`, `consents` | Sí, con `consents` (C5, G7) |
| `busy` | Sí, con `busy` (C5) |
| `lines`, `quantity`, `pending`, `placedAt`, `delivery`, `reference` | Los de Order summary (#938): opcionales en el tipo; C5 cuando el bloque pinta el pedido (no con el slot `order`) |
| `form`, `errorSummary`, `stepper`, `datePicker`, `price` | Los de cada componente (avisan ellos) |
| `external` | Sí, con un enlace externo (C5) |

## Avisos propios (`[Grana GbCheckout<NN>]`)

C5, C7, EC1, EC5, EC6 y los del motor de campos de Guest form con este prefijo (G1, G2, G3, G7, G8; **G5 no aplica**: los grupos de un paso citan campos por `name`, #938). Además: **CK1** · un paso sin `fields` y sin slot `step-{id}` (se pinta el título y el botón, sin contenido), **CK2** · sin escucha de `submit` (nada puede pedir el pedido), **CK3** · `step` que no está en `steps` (se usa el primero), **CK4** · un `name` de `step.groups[].fields` que no está en `step.fields` (se ignora; #938). Un campo del paso que ningún grupo cita va después de los grupos, sin título propio y sin aviso.

**Motor de campos (#941):** copia en `common/fields.js`, con el mismo comportamiento que el de Guest form y una prueba de paridad. **Foco al avanzar (#940):** al primer control del paso; si el paso empieza por un `choice`, `GRadioGroup` no expone `focus()` y el foco se queda en el botón del paso (montado), nunca en `body` (CK-L1 reservado).

## Banco (`checkout.bank.js`)

Barro y Agave: pasos «Contacto» (correo `email` con `autocomplete`, teléfono `tel` con `why` «Para avisarte si el transportista no te encuentra»), «Envío» (grupo dirección: calle `address-line1`, colonia `address-line2`, código postal `postal-code` en una fila con ciudad `address-level2`, estado `select` `address-level1`; `choice` «Forma de envío»: Estándar 3–5 días $99, Exprés 1–2 días $249, Recoger en el taller en Teotitlán `Gratis`, una deshabilitada con motivo «No llega a tu código postal»), «Pago» (sin `fields`: el slot con una pasarela simulada del banco, sin datos reales), «Revisión» (consentimiento de condiciones `required` con `policy: 'devoluciones'`, `action` «Confirmar pedido»); `order` del banco común; `prices` MXN; `labels` completos. Estados: `busy`, `errors` del servidor en el código postal, `error` general.

## Verificación propia

Vitest: un paso con errores no emite y enfoca el primero; un paso válido emite `submit` con su carga exacta y avanza; con `preventDefault()` no avanza hasta que cambia `step`; «Atrás» y «Cambiar» conservan `values`; el resumen del paso hecho con las respuestas (el `choice` con su etiqueta); el slot del pago se pinta y el bloque no lee su contenido; un campo `cc-number` no se pinta (EC6); los pasos ocultos montados entran en el `FormData`; 02 con los pasos posteriores `inert`; el total del pie es `order.totals.total`. Chromium: 03 a 390 × 844, el campo enfocado nunca bajo el pie pegado (2.4.11); filas de `GFormRow` sin desbordar a 320; el precio de cada envío en el nombre del radio (árbol de accesibilidad); Tab por todo el formulario e Intro envía el paso.
