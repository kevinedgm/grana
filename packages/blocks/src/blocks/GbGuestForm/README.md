# GbGuestForm · GbGuestForm01, GbGuestForm02 y GbGuestForm03

Los datos de quien reserva, **sin volver a pedir lo que ya dijo**: la consulta (fechas y personas) llega hecha y se puede corregir en el sitio; se piden solo los campos que define el lugar, cada uno con por qué; los consentimientos nunca vienen marcados. El bloque valida como el navegador, lo ensambla en una sola intención (`submit`) y tu aplicación reserva; no hace `fetch`. Va en una página, por pasos o con lo pedido a la vista. Compone `GSection`, `GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GPartyField` (`@grana/vue/booking`), `GCheckbox`, `GFieldGroup`, `GErrorSummary`, `GFormActions`, `GStepper`, `GBtn`, `GSummary`, `GCard`, `GPrice` y `GText`; no trae color, CSS ni textos propios.

**Etiquetas:** `<gb-guest-form-01>`, `<gb-guest-form-02>`, `<gb-guest-form-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/booking`

```js
import { GbGuestForm01, GbGuestForm02, GbGuestForm03 } from '@grana/blocks/booking'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/booking/guest-form.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Además de `@grana/vue`, la aplicación carga las entradas que esta sección compone: `@grana/vue/booking`, `@grana/vue/price`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Lo que ya dijiste no se vuelve a pedir, y lo que se pide dice por qué** (DECISIONS #872). Las personas llegan de la consulta: el grupo arranca con lo que eligió el viajero y se corrige ahí mismo; las fechas se dicen (en la 03) y se cambian en la consulta, no se vuelven a escribir. Cada campo puede llevar **por qué se pide** («Para avisarte si cambia algo de tu llegada»), que forma parte de su ayuda y lo oye quien usa lector antes de escribir. El teléfono se rellena solo (`autocomplete` obligatorio en correo y teléfono). Los consentimientos **nunca** vienen marcados y su política está a un toque, sin que tocar el enlace marque la casilla. En la 03, lo que se está pidiendo y su total no se pierden de vista mientras se escribe, y el botón de enviar sigue a mano sin tapar el campo enfocado.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbGuestFormProps`, el mismo objeto `props` de `props.js`). Lo que una variante no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| `GbGuestForm01` | Una página: todos los grupos uno debajo de otro y el envío al final | `GSection` > `GForm` (`GErrorSummary`, un `GFormSection` por grupo, `GFormLayout` > `GFormRow` > campo, el `GFieldGroup` de consentimientos y `GFormActions`) | `step`, `labels.next`, `back`, `stepper`, `offer` |
| `GbGuestForm02` | Por pasos: un grupo por paso con `GStepper` arriba; «Siguiente» valida el paso, «Atrás» no | `GSection` > `GStepper` (`steps` = los grupos y, de último, los consentimientos; `navigation="back"`) + `GForm` con **solo** el grupo actual a la vista (los demás, `hidden` pero montados: sus datos van en el envío) + `GFormActions` con «Atrás» y «Siguiente» o el envío | `offer` |
| `GbGuestForm03` | Con lo pedido a la vista: arriba, lo que se va a reservar; abajo, el formulario de 01 con el pie de envío pegado | `GSection` > `GStack gap="lg"` > [`GCard level="flat"` con la oferta, la consulta y su precio] + el `GForm` de 01 con `GFormActions sticky` | `step`, `labels.next`, `back`, `stepper` |

**Los campos (`GuestField.type`, lista cerrada):** `text` (por defecto) y `email`/`tel` van a `GInput`, `textarea` a `GTextarea`, `select` a `GSelect` con `options`, `date` a `GDatePicker`. Otro valor avisa G1 y se usa `text`. Los campos con el mismo `row` comparten `GFormRow`.

**Validación (como Newsletter):** el bloque lee el `ValidityState` del control nativo: vacío con `required` da `field.messages.required` o, si no, `labels.required` con `{label}`; un valor mal formado da `messages.invalid` o `labels.invalid`. Ese texto entra en los `errors` de `GForm` (que no valida) con su momento («castigar tarde»); al enviar con errores, el formulario los revela, enfoca el primero y **no** emite `submit`. Los `errors` de tu aplicación (el servidor) ganan a la validación y se revelan en el acto.

**Consentimientos:** `GCheckbox` en un `GFieldGroup` (un `fieldset` con `legend` = `labels.consents`; en 02, el último paso y su rótulo en `GStepper`). Un consentimiento marcado por `values` al empezar se ignora (G3). El enlace (`link`, «Leer la política de cancelación») es un `GBtn variant="link"` junto a la casilla, nunca dentro de su etiqueta: tocarlo no cambia la casilla. Con `policy` y sin `link`, el enlace se pinta y es `#{policy}` (el ancla de [`GbPolicies`](../GbPolicies/README.md)), con el texto de `Consent.linkLabel`.

**Pasos (02):** «Siguiente» revela y comprueba solo los campos del paso; si hay errores, enfoca el primero y no avanza. Sin errores emite `update:step` y el foco va al primer control del paso nuevo (no al título de la sección); `GStepper` anuncia el cambio. El último paso envía. Un error de la aplicación en un campo de otro paso lleva a ese paso al enviar. La `GFormSection` del paso lleva título pero no descripción (el paso ya la dice, #900).

## Recetas

### La consulta que viaja

Pasa a `query` la misma `BookingQuery` de [`GbSearch`](../GbSearch/README.md#la-consulta-que-viaja), con `partyRows` y `labels.query`. El grupo (`party`) arranca con `query.party` y, al enviar, `submit.query` trae la consulta con la `party` corregida. En la 03, la consulta se dice con `describeQuery`, con las mismas palabras que la búsqueda.

### Un campo propio de tu aplicación

El slot `field-{name}` sustituye al campo generado, dentro del mismo `GFormRow`; tu aplicación lo nombra y lo valida:

```vue
<!-- Fragmento: `formulario`, `reservar` y `MiCampoDeDocumento` son de tu aplicación -->
<GbGuestForm01 v-bind="formulario" @submit="reservar">
  <template #field-documento="{ field, error, id }">
    <MiCampoDeDocumento :id="id" :label="field.label" :error="error" />
  </template>
</GbGuestForm01>
```

## Uso

Los datos comunes (`consulta`, `partyRows`, `queryLabels`, `precios`, `priceLabels`) están en [«Datos comunes de una reserva»](../../../README.md#datos-comunes-de-una-reserva).

```vue
<!-- Fragmento: `enviarReserva` es de tu aplicación -->
<script setup>
import { ref } from 'vue'
import { GbGuestForm01 } from '@grana/blocks/booking'
import { consulta, partyRows } from './reserva.js'

const busy = ref(false)
const errors = ref({})

const formulario = {
  title: 'Tus datos',
  description: 'Solo lo necesario para guardar tu habitación.',
  groups: [
    { id: 'quien', title: 'Quién viene', description: 'La persona que hace la reserva.' },
    { id: 'llegada', title: 'Tu llegada' }
  ],
  fields: [
    { name: 'nombre', label: 'Nombre', autocomplete: 'given-name', required: true, group: 'quien', row: 'nombre' },
    { name: 'apellidos', label: 'Apellidos', autocomplete: 'family-name', required: true, group: 'quien', row: 'nombre' },
    { name: 'correo', label: 'Correo', type: 'email', autocomplete: 'email', required: true, hint: 'Ahí te llega la confirmación.', group: 'quien' },
    { name: 'telefono', label: 'Teléfono', type: 'tel', autocomplete: 'tel', required: true, why: 'Para avisarte por WhatsApp si cambia algo de tu llegada.', group: 'quien' },
    { name: 'peticiones', label: 'Peticiones', type: 'textarea', hint: 'Cuna, almohada extra, alergias...', group: 'llegada' }
  ],
  party: { label: 'Huéspedes', name: 'huespedes', hint: 'Lo que pediste en la consulta; puedes corregirlo aquí.' },
  partyRows,
  query: consulta,
  consents: [
    { name: 'politica', label: 'Acepto la política de cancelación', required: true, policy: 'cancelacion', linkLabel: 'Leer la política de cancelación' },
    { name: 'ofertas', label: 'Quiero recibir ofertas por correo (una al mes)' }
  ],
  action: { label: 'Confirmar reserva' },
  locale: 'es',
  labels: {
    required: 'Escribe {label}.',
    invalid: 'Revisa {label}.',
    consent: 'Marca esta casilla para continuar.',
    consents: 'Tu consentimiento',
    busy: 'Confirmando...',
    form: { optional: 'opcional', error: 'Error: ', warning: 'Aviso: ', valid: 'Listo: ', sectionErrors: (n) => `${n} ${n === 1 ? 'error' : 'errores'}` },
    errorSummary: { title: (n) => `Revisa ${n === 1 ? 'un dato' : `${n} datos`} antes de continuar` },
    party: { done: 'Listo', separator: ' · ' },
    external: 'se abre en otra pestaña'
  }
}

async function reservar({ values, party, consents, query }) {
  busy.value = true
  errors.value = {}
  try {
    await enviarReserva({ values, party, consents, query }) // tu aplicación reserva; el bloque no hace fetch
  } catch (e) {
    errors.value = e.fieldErrors ?? {} // por name: ganan a la validación
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <GbGuestForm01 v-bind="formulario" :busy="busy" :errors="errors" @submit="reservar" />
</template>
```

Sin escucha de `submit`, el botón funciona y los datos no llegan a ninguna parte (aviso G6). Los `labels.form`, `errorSummary`, `stepper`, `party`, `price` y `datePicker` van tal cual a su componente, que avisa por ellos.

## Ejemplos

### e1 · Los datos en una sola página (`GbGuestForm01`)

**Por qué:** cuando son pocos campos (menos de ocho) y la persona prefiere ver todo. Los grupos se leen uno debajo de otro y el envío está al final.

```vue
<!-- Fragmento: `busy`, `errors`, `formulario`, `reservar` son de tu aplicación -->
<GbGuestForm01 v-bind="formulario" :busy="busy" :errors="errors" @submit="reservar" />
```

### e2 · Los datos por pasos (`GbGuestForm02`)

**Por qué:** cuando hay varios grupos (quién viene, la llegada, el consentimiento) y en el teléfono cada pantalla debe pedir poco. `GStepper` lleva la cuenta de pasos y los consentimientos son el último. Controla el paso con `v-model:step` si tu aplicación lo necesita.

```vue
<!-- Fragmento: `paso` es de tu aplicación -->
<GbGuestForm02 v-bind="formulario" v-model:step="paso" :errors="errors" @submit="reservar" />
```

### e3 · Lo pedido a la vista mientras se escribe (`GbGuestForm03`)

**Por qué:** cuando la persona duda de qué está reservando. Arriba se queda la oferta, la consulta en palabras y su precio; el botón de enviar queda pegado abajo sin tapar el campo enfocado.

```vue
<!-- Fragmento: `suite` es de tu aplicación ({ id, name, kind, photos, price }) -->
<GbGuestForm03 v-bind="{ ...formulario, offer: suite, prices: precios }" @submit="reservar" />
```

### e4 · Un error del servidor en un campo

**Por qué:** cuando tu aplicación rechaza un dato (un teléfono que no existe). `errors` lo pone en ese campo y lo revela en el acto; en la 02, lleva a ese paso al enviar. El error general (`error`) va al final del resumen de errores.

```vue
<!-- Fragmento: `formulario`, `reservar` son de tu aplicación -->
<GbGuestForm01 v-bind="formulario" :errors="{ telefono: 'Ese teléfono no tiene WhatsApp.' }" error="No pudimos guardar tu reserva; inténtalo de nuevo." @submit="reservar" />
```

## Props

Una sola interfaz para las tres variantes (`GbGuestFormProps`). Los tipos de datos salen de `@grana/blocks/booking`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | Título de la sección (`GSection`); las `GFormSection` van un nivel por debajo. |
| `description` | `string` | Descripción; el slot `description` la sustituye. |
| `fields` | `GuestField[]` (requerida) | 1 a 20 (C7 por encima de 12); type de la lista cerrada (G1); autocomplete obligatorio en email y tel (G2); why se suma a la ayuda |
| `groups` | `GuestGroup[]` | Secciones (01, 03) o pasos (02); sin groups, una sola GFormSection con el título de la sección; un field.group que no está, al final (G5) |
| `values` | `Record<string, string>` | v-model:values; un consentimiento marcado aquí al empezar se ignora (G3) |
| `party` | `GuestParty` | Con query.party y partyRows: GPartyField mode="inline" al principio del primer grupo, arrancando con lo ya dicho (G4 sin partyRows) |
| `partyRows` | `PartyRow[]` | Las filas de `GPartyField` (con `party` y `query.party`). |
| `query` | `BookingQuery \| null` | Lo pedido: se dice arriba (03) y su party llena el campo del grupo; las fechas no se vuelven a pedir |
| `context` | `QueryContextExtra` | `times` y `tours` para decir una consulta `table` o `tour`. |
| `consents` | `Consent[]` | Casillas en un GFieldGroup con legend = labels.consents (#880; en 02, el último paso), nunca marcadas al empezar; required a labels.consent al enviar sin marcar; el enlace va junto a la casilla, fuera de su etiqueta; con policy y sin link, el enlace #{policy} con linkLabel (G8 sin él) |
| `offer` | `OfferRef` | Lo pedido a la vista: `id`, `name`, `kind`, `photos` y `price` (03). Solo 03. Solo `GbGuestForm03`; las demás lo ignoran. |
| `prices` | `PriceRegion` | Una región de precios para el de `offer` (03). Solo `GbGuestForm03`; las demás lo ignoran. |
| `action` | `{ label: string; icon?: string }` (requerida) | El botón de envío |
| `step` | `string` | v-model:step: id del grupo actual. Solo `GbGuestForm02`; las demás lo ignoran. |
| `busy` | `boolean = false` | Enviando: GBtn loading con loadingText = labels.busy |
| `errors` | `Record<string, string>` | Errores de la aplicación (servidor) por name; ganan a la validación y se revelan en el acto; en 02, al enviar llevan a su paso |
| `error` | `string` | Error general de la aplicación, al final del resumen de errores |
| `locale` | `string` | BCP 47; sin él, el `lang` del ancestro al montar. |
| `labels` | `GuestFormLabels` (requerida) | required e invalid (plantillas con {label}), consent, consents (título del grupo de casillas y del último paso de 02, G7), next/back/stepper (02), busy, forQuery y query (03, K2), form, errorSummary, party, price y datePicker (pasos directos), external |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, data: FormData, values, party, consents, query }` (`GuestSubmit`) | Envío sin errores (el submit de GForm y la validez de los controles en el navegador); values recortados; query con la party corregida |
| `update:values` | `Record<string, string>` | Cada cambio de un campo |
| `update:step` | `String` (`string`) | 02, al avanzar o retroceder |
| `navigate` | `{ event, href, item }` (`BlockNavigate<NavLink>`) | El enlace interno de un consentimiento con clic primario; item es consent.link |

`submit` solo se emite sin errores. `consents` es `{ [name]: boolean }`; `party`, el valor del grupo; `query`, la consulta con la `party` corregida. `data` es el `FormData` completo (en 02 incluye los pasos ocultos, que siguen montados).

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `field-{name}` | `GuestFieldSlot` | Escape: un campo propio de la aplicación en lugar del generado, dentro del mismo GFormRow (la aplicación lo nombra y lo valida) |
| `consents` | — | Escape: los consentimientos |
| `description` | — | Sustituye a la prop description de la GSection |

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `required`, `invalid` | Sí, plantillas con `{label}` (C5 al necesitarlas; sin ellas, el mensaje del navegador, en el idioma del navegador y no el de la página) |
| `consent` | Sí, con un `consent` `required` |
| `consents` | Sí, con `consents` (título del grupo y del último paso de 02; sin él, aviso G7) |
| `next`, `back`, `stepper` | Sí, en 02 |
| `busy` | Sí, con `busy` |
| `forQuery`, `query` | Sí, con `query` en 03 (K2) |
| `form`, `errorSummary`, `party`, `price`, `datePicker` | Los de cada componente (avisan ellos) |
| `external` | Sí, con un enlace externo |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| `Tab` | Recorre campos, contadores del grupo, casillas, sus enlaces y el botón de envío |
| `Intro` | Envía |
| `Intro` o `Espacio` en «Siguiente» o «Atrás» | Avanza (valida el paso) o vuelve (sin validar), solo en 02 |

El foco tras un error va al primer campo con error; tras «Siguiente», al primer control del paso nuevo. En 03 el campo enfocado nunca queda bajo el pie pegado (2.4.11, medido a 390 × 844).

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md)), tres motores, tres temas, claro y oscuro (`medido`):

a. Cada control tiene su etiqueta, `autocomplete` (1.3.5) y su ayuda en `aria-describedby` (`hint` y `why`); si falta en correo o teléfono, el bloque avisa G2 (`prueba`).
b. Enviar vacío revela al menos cinco errores con el resumen a la vista y ningún `submit`; el error del servidor queda ligado al teléfono y el error general tiene contraste ≥ 4,5:1.
c. Los consentimientos van en un grupo con `legend` (`labels.consents`), nunca marcados y con el enlace fuera de la etiqueta (BK-B1, cerrado; en verde en los tres motores). En 02 son el último paso.
d. `busy` con contraste ≥ 4,5:1.
e. 03 a 390 × 844: ningún control enfocado queda bajo el pie pegado (2.4.11).
f. Sin desplazamiento horizontal a 1440, 390, 320 ni a 320 con el texto al 200 %; el botón con una palabra larga parte la etiqueta sin desbordar (BK-C2, corregido en `GBtn.css` y `GFormActions.css`).
g. Nada se mueve.

> **Peligro.** Sin `labels.required` y `labels.invalid`, el error de validación sale con el mensaje del navegador, en el idioma del navegador y no en el de la página. Y un campo `email` o `tel` sin `autocomplete` no se rellena solo (G2): quien reserva en el teléfono lo escribe entero.

## Avisos de desarrollo

Prefijo `[Grana GbGuestForm<NN>]`, una vez por instancia y motivo, solo en desarrollo. Los comunes (C1 a C8, K1 a K5) están en [`packages/blocks/README.md`](../../../README.md#avisos-comunes-de-booking). Los propios:

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| G1 | `type` fuera de la lista | Se usa `text` |
| G2 | `email` o `tel` sin `autocomplete` | Se pinta, sin rellenado automático |
| G3 | Un consentimiento marcado por `values` al empezar | Se ignora: el consentimiento no se da por adelantado |
| G4 | `party` sin `partyRows` | No se pinta el grupo |
| G5 | Un `field.group` que no está en `groups` | Va a un grupo final sin título propio |
| G6 | Sin escucha de `submit` | Los datos no llegan a ninguna parte |
| G7 | `consents` sin `labels.consents` | El grupo sin título visible |
| G8 | `policy` sin `link` y sin `linkLabel` | No se pinta el enlace |

C1 es `fields` vacío y C7, más de doce campos.

## Banco de datos de ejemplo

`guest-form.bank.js` exporta `{ appIcons, props, slots, states }`: Casa Alcalá con los grupos «Quién viene» (nombre, apellidos, correo, teléfono con `why`) y «Tu llegada» (hora estimada en `select`, peticiones en `textarea` opcional), `party` con las `partyRows` y la consulta comunes, dos consentimientos (la política de cancelación `required` con `policy: 'cancelacion'` y las ofertas por correo), `offer` Suite Jardín con precio y total, `prices` MXN, `action` «Confirmar reserva» y `labels` completos; `appIcons` son los iconos que la página registra con `createIcons`. `states` trae `busy`, errores del servidor en el teléfono y un error general (se activan con `?estado=` en el banco real, `packages/blocks/playground/booking/guest-form.html`). Con el banco por defecto ninguna variante avisa.

## Peso

`dist/booking.js` pesa **36 851 B gzip** con su trozo compartido de `common/` (las 11 secciones y 33 variantes; `medido` con `node packages/blocks/scripts/measure-entry.mjs booking`  2026-10-23); tope de la entrada **37 888 B** (DECISIONS #907; el tope inicial de 36 KiB no se vuelve a subir). Una variante importada sola (esbuild minificado  `vue` y `@grana/vue*` externos; `node packages/blocks/scripts/measure-partial.mjs 5120 booking GbGuestForm=7168`): `GbGuestForm01` 6 375 B  `GbGuestForm02` 6 473 B  `GbGuestForm03` 6 940 B; tope por variante **7 168 B** (#887). `@grana/vue` y sus entradas son *peer*: las paga la aplicación.

## Alcance

- **No reserva ni guarda:** `submit` entrega los datos y tu aplicación decide (#780).
- **Las fechas no se vuelven a pedir:** se dicen (03) y se corrigen en la consulta, no aquí.
- **Los consentimientos no son una `GFormSection`:** son un `GFieldGroup` con `legend` (#880).
- **Sin `groups`** no hay `GFormSection`: los campos van directos bajo el título de la sección (#881).
- **Límites aceptados:**
  - BK-L8 (#901): el enlace de la política no se alinea con el texto de su casilla (empieza en el borde de la casilla, 208 px, y no bajo «Acepto...», 240 px). Queda **reservado** un hueco de descripción en `GCheckbox`, que cambiaría un componente de la v1.
  - BK-L9 (#902): los contadores de `GPartyField` (Adultos, Niños, Habitaciones) no se marcan «opcional»; el bloque los pasa como obligatorios, sin cambiar la API de `GPartyField` (cerrado por bruno).
  - 03 dice la consulta en un `GText` con las palabras de `describeQuery`, porque `GSummary` no admite un dato sin rótulo (#882).
- **Sin CSS ni utilidades** (#763, #807).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbGuestForm` (un control por campo con su `type`, `autocomplete` y ayuda; el grupo arranca con `query.party`; vacío y mal formado sin `submit`; consentimiento `required` bloquea; G3; enlace fuera del `label`; `submit` con su carga exacta; 02: avance, foco, pasos ocultos montados en el `FormData`; 03 con `GFormActions sticky`) | 50/50 (`npm test -w @grana/blocks`, 2026-10-23) | `prueba` |
| Auditoría de coco: Guest form 01, 02 y 03; BK-B1 (consentimientos con `legend`, último paso en 02), BK-B3 y BK-C2 cerrados | Veredicto `candidate` tras el remate de bruno; en verde en los tres motores (addendum del 2026-10-23) | `medido` |

**No verificado:** lector de pantalla real (el grupo de consentimientos, el resumen de errores, el cambio de paso); `forced-colors` real; teléfono real, con el teclado virtual sobre el pie pegado de 03; rendimiento con el perfilador. **Pendientes abiertos:** BK-B2 (el nombre del paso dicho dos veces en 02): lima lo resolvió en #900 (título sin descripción) y el addendum de coco no lo vuelve a medir; BK-L8 (límite aceptado); los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md).

## Fuentes

- Contrato: [`design/contracts/blocks/guest-form.md`](../../../../../design/contracts/blocks/guest-form.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§15 a §25); [`form.md`](../../../../../design/contracts/form.md) y [`stepper.md`](../../../../../design/contracts/stepper.md) para lo que compone.
- Decisiones: #860 a #866, #872, #880 a #882, #900 a #902, #907 en `DECISIONS.md`.
- Metadatos: [`GbGuestForm.meta.json`](./GbGuestForm.meta.json). Pruebas: [`GbGuestForm.test.js`](./GbGuestForm.test.js). Auditoría: [`design/lab/blocks/booking/auditoria.md`](../../../../../design/lab/blocks/booking/auditoria.md).
