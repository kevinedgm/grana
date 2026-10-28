# GbCheckout · GbCheckout01, GbCheckout02 y GbCheckout03

Pedir lo que hay en el carrito **dando solo lo necesario, paso a paso y sin perder nada al volver**: lo hecho se resume en una línea con «Cambiar», el precio de cada forma de envío se oye al elegirla y el total va **siempre junto al botón**. El bloque valida como el navegador y emite cada paso (cancelable); **el pago es de la pasarela de tu tienda, en su propio hueco**: Grana nunca toca un número de tarjeta. Compone `GSection`, `GStack`, `GSplit`, `GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GRadioGroup`, `GCheckbox`, `GFieldGroup`, `GErrorSummary`, `GFormActions`, `GStepper`, `GSummary`, `GAccordion`, `GBtn`, `GPrice` y `GPriceScope` (`@grana/vue/price`), `GText`, `GMetric` y `GAvatar`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-checkout-01>`, `<gb-checkout-02>`, `<gb-checkout-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/ecommerce`

```js
import { GbCheckout01, GbCheckout02, GbCheckout03 } from '@grana/blocks/ecommerce'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/ecommerce/checkout.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga la entrada que esta sección compone: `@grana/vue/price`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md#ecommerce).

## Qué lo hace distinto

**Volver no borra nada y lo hecho se pliega en una línea** (DECISIONS #922). Quien paga en el teléfono vuelve a cambiar la dirección sin perder lo que escribió en la entrega, y cada paso hecho queda como una frase («Envío · Macedonio Alcalá 202, Oaxaca · Estándar, de 3 a 5 días») con «Cambiar» al lado. El precio de cada forma de envío se oye al elegirla, el total va **siempre junto al botón**, y el pago es de la pasarela de la tienda en su propio hueco. Los consentimientos nunca vienen marcados y un error de la aplicación lleva al paso y al campo exactos.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbCheckoutProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbCheckout01` | Por pasos: un paso a la vista con `GStepper` arriba y el pedido plegado en una línea encima | `GSection` > `GPriceScope` > `GStack gap="lg"` > `GAccordion` («Tu pedido», con el total y la cuenta de piezas) + `GStepper navigation="back"` + `GForm` con **solo** el paso actual a la vista (los demás `hidden` y montados) y «Atrás» | — |
| `GbCheckout02` | Se pliega lo hecho: todos los pasos en la página, lo hecho plegado en su resumen con «Cambiar» y el siguiente abierto | `GSection` > `GPriceScope` > `GStack gap="lg"` > `GAccordion` del pedido + `GForm` > un `GFormSection mode="collapsible"` por paso (los posteriores al actual, plegados e `inert` hasta llegar) | `labels.stepper` |
| `GbCheckout03` | Con el pedido al lado: el formulario por pasos y, **al lado cuando cabe**, el pedido abierto; el pie con el total pegado | `GSection` > `GPriceScope` > `GSplit ratio="3:2" gap="lg"` > [`#start`: `GStepper` + `GForm` de 01 con `GFormActions sticky`] + [`#end`: `GSection` con el pedido abierto] | El `GAccordion` del pedido |

**03 con el pedido al lado, cuando cabe** (DECISIONS #950, que cierra CK-L1): `GSplit ratio="3:2" gap="lg"` pone el pedido junto al formulario **cuando el pedido cabe en 320 px**. Con el tema por defecto, a partir de **848 px de caja**: a 1440 son 586 · 390 y a 1024 son 536 · 358; a 768, 390, 320 y con el texto al 200 % queda **apilado**, con el pedido debajo del formulario por el orden del DOM. El `GStepper` en fila puede medir más que la región; `GSplit` no usa el contenido como suelo, así que la pareja no se queda apilada tras pasar por 768 ([`GSplit/README.md`](../../../../vue/src/components/GSplit/README.md#recetas-y-límites)). Con un tema de cuerpo mayor el umbral sube. El pie pegado se pega dentro de la región del formulario y no tapa el pedido; el campo enfocado nunca queda bajo él (2.4.11).

**Un solo `GForm` para todos los pasos.** El envío de un paso revela y comprueba **solo sus campos**; con errores no emite y el foco va al primero. Sin errores emite `submit`, **síncrono y cancelable**: sin `preventDefault()`, el bloque pasa al paso siguiente y el foco va al primer control del paso nuevo; con `preventDefault()` espera a que tu aplicación cambie `step` (comprobar una dirección, cotizar el envío) y entonces mueve el foco igual. Un error de la aplicación (`errors` por `name`) en un campo de otro paso lleva a ese paso y a ese campo. Los pasos ocultos de 01 siguen montados, así que sus datos van en el `FormData`.

**El motor de campos** es el de [`GbGuestForm`](../GbGuestForm/README.md): el mismo comportamiento (tipo cerrado → control, `autocomplete`, el porqué `why`, filas `row`, mensajes), en copia propia con una prueba de paridad (#941). Sin `GPartyField` (no hay consulta). Autocompletar en todos los campos de dirección y contacto (1.3.5).

**Opciones con precio** (`type: 'choice'`, envío y entrega): `GRadioGroup appearance="card"` con el slot `option` que compone la etiqueta, la descripción y el `GPrice size="sm"`; el contenido del slot es **todo el nombre del radio** («Estándar, de 3 a 5 días, 99 pesos mexicanos»), así el precio se oye al elegir. `Gratis` sale de `labels.price.free`. Una opción con `disabled` de texto queda deshabilitada y el motivo se lee en su descripción.

**Resumen de un paso hecho:** `GSummary layout="row"` con el título del paso y sus respuestas (un `choice` con la etiqueta de la opción; los consentimientos no se resumen), o `step.summary` si tu aplicación lo da, y un `GBtn variant="link"` `labels.edit(step.title)` que vuelve a ese paso **sin borrar nada**.

**El total junto al botón:** `GText size="body-sm"` con `labels.total` y `GPrice size="md"` del `order.totals.total.value`, en el `status` de `GFormActions`. **El pedido** es la pieza de [`GbOrderSummary02`](../GbOrderSummary/README.md) con `order` y los mismos textos, dentro del único `GPriceScope`.

## Recetas

### El pago es de tu pasarela

Un paso **sin `fields`** es de tu aplicación: el bloque pinta tu slot `step-{id}` dentro del formulario, con su título y su botón (`step.action`), y emite `submit` de ese paso. Ni lee ni valida lo que hay en el slot; tu aplicación informa con `errors` o `error` y decide cuándo avanzar con `preventDefault()`. Un campo de tarjeta en `fields` (`autocomplete` `cc-*` o `name` que empieza por `card`) **no se pinta** (aviso EC6).

```vue
<!-- Fragmento: `PasarelaDePago`, `pasos`, `pedido`, `precios`, `etiquetas` y `pagar` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbCheckout03 } from '@grana/blocks/ecommerce'

const paso = ref('contacto')
const valores = ref({})
const ocupado = ref(false)

async function enviar(e) {
  if (e.step === 'pago') {
    e.preventDefault() // el bloque espera: la pasarela decide cuándo avanzar
    ocupado.value = true
    const ok = await pagar(e.data)
    ocupado.value = false
    if (ok) paso.value = 'revision'
  }
}
</script>

<template>
  <GbCheckout03 title="Finalizar compra" :steps="pasos" :order="pedido" :prices="precios" :labels="etiquetas" :busy="ocupado"
    v-model:step="paso" v-model:values="valores" @submit="enviar">
    <template #step-pago>
      <!-- La pasarela es tuya y trae su propia accesibilidad: si va en un iframe, con `title` -->
      <PasarelaDePago />
    </template>
  </GbCheckout03>
</template>
```

### Mostrar el error del servidor en el campo exacto

```vue
<!-- Fragmento: los demás datos son de tu aplicación -->
<GbCheckout02 v-bind="checkout" v-model:step="paso" v-model:values="valores" :errors="{ cp: 'Ese código postal no existe en Oaxaca' }" />
```

`errors` gana a la validación del navegador y lleva al paso y al campo. Un `error` general (texto) va al final del resumen de errores.

## Uso

Los datos y textos comunes de la tienda (`precios`, `priceLabels`) están en [«Datos comunes de una tienda»](../../../README.md#datos-comunes-de-una-tienda).

```vue
<!-- Fragmento: `pedido` (un `OrderSummary`: líneas y totales), `precios` y `confirmar` son de tu aplicación -->
<script setup>
import { GbCheckout01 } from '@grana/blocks/ecommerce'

const mxn = (amount) => ({ amount, currency: 'MXN' })

const pasos = [
  {
    id: 'contacto', title: 'Contacto', description: 'Te escribimos solo por tu pedido.', action: 'Continuar al envío',
    fields: [
      { name: 'email', label: 'Correo electrónico', type: 'email', autocomplete: 'email', required: true },
      { name: 'tel', label: 'Teléfono', type: 'tel', autocomplete: 'tel', why: 'Para avisarte si el transportista no te encuentra.' }
    ]
  },
  {
    id: 'envio', title: 'Envío', action: 'Continuar al pago',
    fields: [
      { name: 'calle', label: 'Calle y número', autocomplete: 'address-line1', required: true },
      {
        name: 'forma', label: 'Forma de envío', type: 'choice', required: true,
        options: [
          { value: 'estandar', label: 'Estándar', description: 'de 3 a 5 días', price: { value: mxn(99) } },
          { value: 'taller', label: 'Recoger en el taller', price: { value: mxn(0) } },
          { value: 'mismo-dia', label: 'El mismo día', price: { value: mxn(180) }, disabled: 'No llega a tu código postal' }
        ]
      }
    ],
    groups: [{ id: 'direccion', title: 'Dirección', fields: ['calle'] }]
  },
  { id: 'pago', title: 'Pago', description: 'Lo cobra la pasarela de la tienda.', action: 'Revisar el pedido' }, // sin fields: slot step-pago
  { id: 'revision', title: 'Revisión', action: 'Confirmar pedido', consents: [{ name: 'condiciones', label: 'Acepto las condiciones de venta', required: true }] }
]

const etiquetas = {
  required: 'Escribe {label}', invalid: 'Revisa {label}', choose: 'Elige {label}',
  consent: 'Marca esta casilla para continuar', consents: 'Antes de confirmar',
  back: 'Atrás', edit: (paso) => `Cambiar ${paso}`, order: 'Tu pedido', total: 'Total', busy: 'Enviando…',
  form: { optional: 'opcional', error: 'Error: ', warning: 'Aviso: ', valid: 'Listo: ', sectionErrors: (n) => `${n} ${n === 1 ? 'error' : 'errores'}` },
  errorSummary: { title: (n) => (n === 1 ? 'Hay 1 dato por revisar' : `Hay ${n} datos por revisar`) },
  stepper: { complete: 'hecho', current: 'paso actual', pending: 'pendiente', error: 'con error', warning: 'con aviso', disabled: 'no disponible', optional: 'opcional', progress: 'Paso {current} de {total}', showAll: 'Ver todos los pasos', hideAll: 'Ocultar los pasos' },
  lines: 'Lo que compras', quantity: (n) => `${n} ${n === 1 ? 'pieza' : 'piezas'}`, pending: 'Se calcula en el siguiente paso',
  price: priceLabels, external: 'se abre en otra pestaña'
}
</script>

<template>
  <GbCheckout01 title="Finalizar compra" :steps="pasos" :order="pedido" :prices="precios" :labels="etiquetas" @submit="confirmar" />
</template>
```

Sin la escucha de `submit`, nada puede pedir el pedido (aviso CK2). `values` y `step` son opcionales (`v-model`): sin ellos el bloque guarda su copia. Un consentimiento **nunca** llega marcado.

## Ejemplos

### e1 · Un paso a la vez, con el pedido plegado (`GbCheckout01`)

**Por qué:** cuando se paga en el teléfono o se quiere un flujo corto. Un solo paso a la vista con el progreso arriba; el pedido, plegado en una línea con su total, para no perder de vista lo que se compra.

```vue
<!-- Fragmento: los datos son de tu aplicación -->
<GbCheckout01 title="Finalizar compra" :steps="pasos" :order="pedido" :prices="precios" :labels="etiquetas" @submit="confirmar" />
```

### e2 · Todo en una página, lo hecho plegado (`GbCheckout02`)

**Por qué:** cuando la persona quiere ver el recorrido completo y volver a cualquier paso: lo hecho se pliega en su resumen con «Cambiar» y el siguiente se abre; los que aún no tocan quedan cerrados e `inert`, así que no se salta un paso sin hacer el anterior.

```vue
<!-- Fragmento: los datos son de tu aplicación -->
<GbCheckout02 title="Finalizar compra" :steps="pasos" :order="pedido" :prices="precios" :labels="etiquetas" @submit="confirmar" />
```

### e3 · El pedido a la vista mientras se completa (`GbCheckout03`)

**Por qué:** cuando la persona decide con lo que paga delante, en escritorio. El pedido abierto junto al formulario y el total pegado al pie; en estrecho el pedido pasa debajo.

```vue
<!-- Fragmento: ver «El pago es de tu pasarela» -->
<GbCheckout03 title="Finalizar compra" :steps="pasos" :order="pedido" :prices="precios" :labels="etiquetas" @submit="confirmar" />
```

## Props

Una sola interfaz para las tres variantes (`GbCheckoutProps`). Los tipos de datos salen de `@grana/blocks/ecommerce`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | «Finalizar compra». |
| `steps` | `CheckoutStep[]` (requerida) | 2 a 5 (C7). `id` obligatorio (EC5: sin él, el paso se omite); sin `title` o sin `action`, C2. Sin `fields` ni `consents`: un paso de tu aplicación (slot `step-{id}`; CK1 sin él). Un campo de tarjeta no se pinta (EC6). |
| `step` | `string` | `v-model:step`: el `id` del paso actual (el primero por defecto; uno que no está en `steps`, CK3). |
| `values` | `Record<string, string>` | `v-model:values`; un consentimiento nunca llega marcado (G3). |
| `order` | `OrderSummary` (requerida) | Lo que se compra (de tu aplicación): el pedido con la pieza de `GbOrderSummary02` y el total del pie. |
| `prices` | `PriceRegion` (requerida) | Obligatoria (EC1): una región alrededor del pedido, los precios del envío y el total. |
| `busy` | `boolean = false` | Enviando un paso: el botón con `loading` y `labels.busy`. |
| `errors` | `Record<string, string>` | Errores de tu aplicación por `name`: ganan a la validación y llevan a su paso y a su campo. |
| `error` | `string` | Error general (al final del resumen de errores). |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `CheckoutLabels` (requerida) | `required`, `invalid`, `back`, `edit`, `order` y `total` (C5); `choose` con un `choice` obligatorio; `consent` y `consents` con consentimientos; `busy` con `busy`; los de `GbOrderSummary` para el pedido (`lines`, `quantity`, `pending`, `placedAt`, `delivery`, `reference`; opcionales, C5 solo cuando el bloque pinta el pedido); `form`, `errorSummary`, `stepper`, `datePicker` y `price` a sus componentes; `external`. Sin valores por defecto. |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, step, data, values, consents, final, preventDefault(), defaultPrevented }` (`CheckoutSubmit`) | Un paso válido (Intro o su botón). Síncrono y cancelable; `final` en el último paso |
| `update:step` | `string` | Avanzar, volver («Atrás», el `GStepper`) o «Cambiar» (sin validar ni borrar) |
| `update:values` | `Record<string, string>` | Cada cambio de un campo |
| `navigate` | `{ event, href, item }` (`BlockNavigate<NavLink \| OrderLine>`) | Un enlace de consentimiento o un producto del pedido, con clic primario; nunca con `external` |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `step-{id}` | `{ step, values }` | **Obligatorio** para un paso sin `fields`: el pago u otro paso de tu aplicación. El bloque no lo lee ni lo valida |
| `field-{name}` | `{ field, value, error, id }` | Escape de un campo (el del motor de `GbGuestForm`) |
| `order` | `{ order }` | Escape: el resumen del pedido propio |
| `description` | — | Descripción rica de la sección |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `required`, `invalid`, `back`, `edit`, `order`, `total` | Sí (C5) |
| `choose` | Sí, con un `choice` obligatorio (C5) |
| `consent`, `consents` | Sí, con `consents` (C5, G7) |
| `busy` | Sí, con `busy` (C5) |
| `lines`, `quantity`, `pending`, `placedAt`, `delivery`, `reference` | Los de `GbOrderSummary`: opcionales en el tipo; C5 cuando el bloque pinta el pedido (no con el slot `order`) |
| `form`, `errorSummary`, `stepper`, `datePicker`, `price` | Los de cada componente (avisan ellos) |
| `external` | Sí, con un enlace externo (C5) |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre el paso actual, «Atrás» y el botón del paso (y en 03, el pedido por el orden del DOM); en 02 los pasos posteriores no reciben foco hasta llegar a ellos |
| `Intro` en un campo | Envía el paso: valida sus campos y, si están bien, emite `submit` |
| `Intro` o `Espacio` en «Cambiar» | Vuelve a ese paso sin validar ni borrar nada |
| Flechas en la forma de envío | Mueven la elección (radios de `GRadioGroup`) |

**Foco al avanzar:** al primer control del paso nuevo (por el `id` que genera; nunca al título de `GFormSection`). Si el paso empieza por un `choice`, `GRadioGroup` no expone `focus()` y el foco se queda en el botón del paso (montado), nunca en `body` (CK-L1 reservado, #940).

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. Un solo `form` con su resumen de errores; el paso actual con su encabezado un nivel por debajo; `GStepper` anuncia el paso; «Cambiar» se nombra con su paso («Cambiar Envío»).
b. El precio de cada forma de envío está en el nombre del radio (árbol de accesibilidad): se oye al elegir.
c. El pago lo pone tu aplicación con la accesibilidad de su pasarela; el bloque no lee ni valida el slot.
d. El campo enfocado nunca queda bajo el pie pegado de 03 (2.4.11), a 390 × 844 (EC-C1 corregido).
e. 03 con el pedido al lado (CK-L1 cerrado por #950: 586 · 390 a 1440, 536 · 358 a 1024) y apilado a 768, 390 y 320 y con el texto al 200 %; la secuencia 768 → 1440 no se queda apilada; filas de `GFormRow` sin desbordar a 320.
f. Los consentimientos nunca vienen marcados; el error de la aplicación lleva al paso y al campo exactos.
g. Sin movimiento propio: lo de `GFormSection` plegable y `GAccordion`, con `prefers-reduced-motion` sin movimiento.

> **Peligro.** El bloque **no cobra ni valida el pago**. Si tu pasarela confirma el pago y tu aplicación no cambia `step` (o llama a `preventDefault()` en `submit` y nunca avanza), la persona se queda en «Pago» sin saber si pagó. Cuando uses `preventDefault()` en un paso, avanza siempre (`paso = 'revision'`) o muestra el fallo con `error` o `errors`. Nunca pidas el número de tarjeta en un campo de `fields`: no se pinta (EC6) y es tu pasarela, no el bloque, quien debe recogerlo.

## Avisos de desarrollo

Prefijo `[Grana GbCheckout<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K3, K4, EC1 a EC7) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-ecommerce). Los de esta sección: C2, C5, C7 (más de 5 pasos), EC1, EC5, EC6, los del motor de campos de `GbGuestForm` con este prefijo (G1, G2, G3, G7, G8; **G5 no aplica**) y los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| CK1 | Un paso sin `fields` y sin slot `step-{id}` | Se pinta el título y el botón, sin contenido |
| CK2 | Sin escucha de `submit` | Nada puede pedir el pedido |
| CK3 | `step` que no está en `steps` | Se usa el primero |
| CK4 | Un `name` de `groups[].fields` que no está en `fields` | Se ignora; un campo que ningún grupo cita va después de los grupos, sin título y sin aviso |

## Banco de datos de ejemplo

`checkout.bank.js` exporta `{ STEPS, LABELS, props, slots, states, app }`: Barro y Agave. «Contacto» (correo y teléfono con `autocomplete` y el porqué), «Envío» (la dirección en un grupo, código postal y ciudad en una fila, el estado en un `select` y la forma de envío como `choice` con su precio: Estándar $99, Exprés $249, Recoger en el taller gratis y una deshabilitada con su motivo), «Pago» (sin `fields`: el slot `step-pago` con una pasarela **simulada**, sin campos ni datos reales) y «Revisión» (las condiciones, obligatorias, con el ancla de la política de devoluciones); el pedido es el común de la tienda. `states` trae `ocupado`, `servidor` (errores del servidor en el código postal) y `general` (error general). Con él ninguna variante avisa. Banco real: `packages/blocks/playground/ecommerce/checkout.html`.

## Peso

`dist/ecommerce.js` pesa **49 557 B gzip** con sus trozos compartidos (`medido` con `node packages/blocks/scripts/measure-entry.mjs ecommerce`, 2026-10-28, tras recomponer con `GSplit`, que va en `@grana/vue` y es externo); tope de la entrada **51 200 B** (DECISIONS #932; no se vuelve a subir: con más, decide el usuario; margen de 1 643 B). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 7168 ecommerce GbCheckout=9728 +cartTotals=2048`): `GbCheckout01` 9 185 B, `GbCheckout02` 9 072 B, `GbCheckout03` 9 210 B; tope **9 728 B** para `GbCheckout` (formulario por pasos, copia del motor de campos, pedido y hueco del pago; excepción de #932 y #941). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No cobra ni valida el pago:** es de tu pasarela (#922). Ningún bloque pide, pinta, valida ni transmite datos de tarjeta, cuenta o identidad fiscal; muestra lo que tu aplicación ya resumió («Tarjeta terminada en 4242»).
- **No pide el pedido:** `submit` te da el paso y los valores; el pedido lo hace tu aplicación.
- **No calcula el envío ni los impuestos:** el `order.totals` y el precio de cada forma de envío los das tú.
- **No valida direcciones:** valida como el navegador (`required`, tipo, patrón); una comprobación del servidor entra por `errors`.
- **Sin `GPartyField`, sin consulta, sin lista de deseos ni guardado de borrador.**
- **Foco inicial de un paso que empieza por una forma de envío:** se queda en el botón del paso (CK-L1, `focus()` público de `GRadioGroup` reservado).
- **Sin columna pegada** (BK-L1): en 03 solo el pie con el total es pegado.
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbCheckout` (un paso con errores no emite y enfoca el primero; un paso válido emite `submit` con su carga exacta y avanza; con `preventDefault()` no avanza hasta que cambia `step`; «Atrás» y «Cambiar» conservan `values`; el resumen del paso hecho con las respuestas; el slot del pago se pinta sin que el bloque lo lea; un campo `cc-number` no se pinta; los pasos ocultos montados entran en el `FormData`; 02 con los pasos posteriores `inert`; el total del pie es `order.totals.total`; 03 con `GSplit`; paridad del motor de campos) | **45 de 45** (`npm test -w @grana/blocks`, 2026-10-28) | `prueba` |
| Auditoría de coco: CK-L1 cerrado con `GSplit` (586 · 390 a 1440, apilado a 768, 390 y 320 y con el texto al 200 %, y 768 → 1440 sin quedarse apilado) y EC-C1 (pie pegado) corregido | Ecommerce **11 129/11 129** en Chromium, Firefox y WebKit, tres temas, claro y oscuro, `forced-colors` y RTL (addendum del 2026-10-28). Veredicto `candidate` | `medido` |

**No verificado:** lector de pantalla real (el cambio de paso, el precio en el nombre del radio, el error del servidor en el campo); una pasarela de pago real en el hueco (el banco la simula); `forced-colors` real y en Firefox y WebKit; teléfono real, teclado virtual y el pie pegado con el pulgar; rendimiento con el perfilador. **Pendientes abiertos:** `focus()` público de `GRadioGroup` (CK-L1 de foco), columna pegada (BK-L1) y los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/checkout.md`](../../../../../design/contracts/blocks/checkout.md), el motor de campos en [`guest-form.md`](../../../../../design/contracts/blocks/guest-form.md), el pedido en [`order-summary.md`](../../../../../design/contracts/blocks/order-summary.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§26 a §40); `GSplit` en [`design/contracts/split.md`](../../../../../design/contracts/split.md).
- Decisiones: #909 a #914, #922, #932, #933, #938, #940, #941, #946 a #951 y #955 en `DECISIONS.md`.
- Metadatos: [`GbCheckout.meta.json`](./GbCheckout.meta.json). Pruebas: [`GbCheckout.test.js`](./GbCheckout.test.js). Auditoría: [`design/lab/blocks/ecommerce/auditoria.md`](../../../../../design/lab/blocks/ecommerce/auditoria.md).
