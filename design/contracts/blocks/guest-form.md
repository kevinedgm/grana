# Contrato · Guest form (`GbGuestForm01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #872, 2026-10-22) · **Plan:** B6 (§4.3) · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GPartyField` (`@grana/vue/booking`), `GCheckbox`, `GErrorSummary`, `GFormActions`, `GStepper`, `GBtn`, `GSummary`, `GCard`, `GText`, `describeQuery` (`design/contracts/form.md`, `stepper.md`, `booking-bar.md`) · **Parte de bruno:** A · **bruno en Opus** (formulario con pasos, validación y tres componentes compuestos)

## Promesa

Los datos de quien reserva, **sin volver a pedir lo que ya dijo**: la consulta (fechas y personas) llega hecha y se puede corregir en el sitio; se piden solo los campos que el lugar define, cada uno con por qué; los consentimientos nunca vienen marcados; el bloque valida como el navegador y emite los datos. La aplicación reserva.

## Props

```ts
interface GbGuestFormProps {
  title: string
  description?: string
  fields: GuestField[]                   // 1 a 20 (C7 por encima de 12)
  groups?: GuestGroup[]                  // agrupan los campos en secciones (01, 03) o pasos (02)
  values?: Record<string, string>        // v-model:values (valores iniciales o controlados)
  party?: { label: string; name?: string; hint?: string }   // con query.party y partyRows: GPartyField del grupo
  partyRows?: PartyRow[]
  query?: BookingQuery | null            // lo pedido: se dice arriba (03) y su `party` llena el campo de grupo
  context?: Omit<QueryContext, 'partyRows'>
  consents?: Consent[]                   // casillas, nunca marcadas al empezar
  offer?: Pick<Offer, 'id' | 'name' | 'kind' | 'photos' | 'price'>   // 03: lo pedido a la vista
  prices?: PriceRegion
  action: Pick<Action, 'label' | 'icon'> // el botón de envío
  step?: string                          // v-model:step (02): id del grupo actual
  busy?: boolean                         // enviando
  errors?: Record<string, string>        // errores de la aplicación (servidor), por name; ganan a la validación
  error?: string                         // error general de la aplicación (en el resumen de errores)
  locale?: string
  labels: {
    required: string                     // «Escribe {label}» (plantilla con {label}; un campo puede traer el suyo en messages)
    invalid: string                      // «Revisa {label}»
    consent?: string                     // «Marca esta casilla para continuar»
    consents?: string                    // título del grupo de casillas («Tu consentimiento») y del último paso de 02 (#880)
    next?: string; back?: string         // 02
    busy?: string
    forQuery?: string; query?: QueryLabels
    form?: GranaLabels                   // a GForm (optional, requiredHint, error, warning, valid…)
    errorSummary?: GranaLabels           // a GErrorSummary ({ title })
    stepper?: GranaLabels                // a GStepper (02)
    party?: GranaLabels                  // a GPartyField ({ done, separator })
    price?: PriceLabels & { legend?: string }
    datePicker?: GranaLabels             // a GDatePicker (type date)
    external?: string
  }
}
```

**`GuestField.type`** (lista cerrada): `text` (por defecto) → `GInput`; `email`, `tel` → `GInput type`; `textarea` → `GTextarea`; `select` → `GSelect` con `options`; `date` → `GDatePicker`. Otro valor: aviso G1 y `text`. `autocomplete` va al control (1.3.5): **sin él en `email` y `tel`, aviso G2** (el teléfono no autocompleta).

## Anatomía (común)

```
GForm [data-gb] (labels.form, errors = errores del bloque ∪ errors de la app)
├─ GErrorSummary (labels.errorSummary; con `error`, el general al final)
├─ GFormSection por grupo (title, description)      ← sin groups (#881): sin GFormSection; los campos van directos en el GFormLayout bajo el título de la GSection (no se repite el encabezado)
│  └─ GFormLayout › GFormRow por `row` (o uno por campo) › campo
│     · GPartyField mode="inline" (label = party.label, rows = partyRows, v-model = la `party` de la consulta)  ← si hay party
├─ GFieldGroup (legend = labels.consents; #880) › GCheckbox por consent (label + GBtn variant="link" con su link)
└─ GFormActions [sticky en 03] › GBtn type="submit" (action.label, loading = busy, loadingText = labels.busy)
```

- **Encabezados:** el `title` de la sección es el título del `GForm` en la página: el bloque pone **`GSection`** alrededor (título, descripción) y las `GFormSection` van un nivel por debajo (`GForm headingLevel` = `min(sección + 1, 6)` con `useSectionLevel()`).
- **Validación (como Newsletter, #839):** el bloque lee el `ValidityState` de cada control nativo (`valueMissing` → `field.messages.required ?? fill(labels.required, { label })`, `typeMismatch`/`patternMismatch` → `messages.invalid ?? fill(labels.invalid, { label })`); `select`, `date` y el grupo, vacío con `required` → `required`. Ese texto entra en `errors` de `GForm` (que no valida, #157) con su momento («castigar tarde», `form.md`); al enviar con errores, `showErrors()` y **ningún** `submit`. `errors` de la aplicación ganan.
- **Consentimientos:** `GCheckbox` sin marcar al empezar (un `values[name] = 'true'` inicial en un consentimiento se ignora con aviso G3: el consentimiento no se da por adelantado); `required` → sin marcar al enviar, `labels.consent` como error. El enlace del consentimiento (`link`, «Política de cancelación») es un `GBtn variant="link"` **junto** a la casilla, nunca dentro de su etiqueta (un enlace dentro del `label` cambia la casilla al tocarlo). Con `policy` y sin `link`, el enlace **se pinta** y es `#{policy}` (el ancla de `GbPolicies`; el texto es `Consent.linkLabel`; sin él, `policy` no pinta enlace y avisa G8). **Título (#880):** los consentimientos van en un **`GFieldGroup`** (un `fieldset` con `legend`) con `labels.consents`, no en `GFormSection` (no son un grupo de datos de la persona y no cuentan como sección de `GForm`); en 02 son el último paso y `labels.consents` es su rótulo en el `GStepper`. Sin `labels.consents`: aviso **G7**, el grupo sin `legend` visible y `aria-label` omitido.
- **03, la consulta a la vista (#882):** `GSummary` no admite un dato sin rótulo (aviso 12), así que la consulta de 03 va en un `GText` con las palabras de `describeQuery` y la tarjeta lleva `role="group"` y `aria-label` = `offer.name`. Queda así; si un `GSummary` con dato sin rótulo llega, se cambia sin tocar la API del bloque.
- **La consulta en el formulario:** con `query` y `party`, el grupo es un `GPartyField` que **arranca con `query.party`** (lo ya dicho no se vuelve a escribir) y se puede corregir; sus ocultos con `party.name`. Las fechas **no** se vuelven a pedir: se dicen (03) y se corrigen en la consulta, no aquí.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Una página** | Todos los grupos uno debajo de otro y el envío al final | `GSection` › `GForm` (anatomía común) | `step`, `labels.next`/`back`/`stepper`, `offer` |
| **02 · Por pasos** | Un grupo por paso con `GStepper` arriba; «Siguiente» valida el paso, «Atrás» no | `GSection` › `GStepper` (`steps` = `groups` + consentimientos como último paso, `navigation="back"`, `v-model` = `step`) + `GForm` con **solo** el grupo actual a la vista (los demás `hidden`, montados: sus datos van en el envío) + `GFormActions` con «Atrás» (`ghost`) y «Siguiente» o el envío | `offer` |
| **03 · Con lo pedido a la vista** | Arriba, lo que se va a reservar; el formulario de 01 con el pie de envío pegado | `GSection` › `GStack gap="lg"` › [`GCard level="flat"` con `GSummary` (`title` = `offer.name`, `facts` = la consulta en palabras) y `GPrice` del `offer.price` en un `GPriceScope`] + `GForm` de 01 con **`GFormActions sticky`** | `step`, `labels.next`/`back`/`stepper` |

**Pasos (02):** «Siguiente» revela y comprueba **solo los campos del paso** (el bloque calcula los errores del grupo; si hay, los revela, enfoca el primero y no cambia de paso). Sin errores, `update:step` al siguiente y el foco va al **primer control del paso nuevo** (por el `id` que el bloque genera para cada campo; nunca al título de `GFormSection`, que es DOM interno, §1 regla 2); el cambio lo anuncia `GStepper`. «Atrás» no valida. El último paso envía. Un error de la aplicación (`errors`) en un campo de otro paso lleva a ese paso al enviar (y al primer campo con error).

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, data: FormData, values, party, consents, query }` | Envío sin errores (el `submit` de `GForm`); `values` recortados; `consents` = `{ [name]: boolean }`; `party` = el valor del grupo; `query` con la `party` corregida |
| `update:values` | `Record<string, string>` | Cada cambio |
| `update:step` | `string` | 02, al avanzar o retroceder |
| `navigate` | `{ event, href, item }` | Un enlace interno de consentimiento |

## Slots

`field-{name}` `{ field, value, error, id }` (escape: un campo propio de la aplicación en lugar del generado, dentro del mismo `GFormRow`; la aplicación lo nombra y lo valida), `consents` (escape), `description`.

## Qué lo hace distinto (#872)

**Lo que ya dijiste no se vuelve a pedir, y lo que se pide dice por qué.** Las fechas y las personas llegan de la consulta: el grupo arranca con lo que el viajero eligió y las fechas se dicen, no se vuelven a escribir. Cada campo puede llevar **por qué se pide** («Para avisarte si cambia el clima del recorrido»), que es parte de su ayuda y lo oye quien usa lector antes de escribir. El teléfono rellena solo (`autocomplete` obligatorio en correo y teléfono). Los consentimientos **nunca** vienen marcados y su política está a un toque, sin que tocar el enlace marque la casilla. En 03, lo que se está pidiendo y su total no se pierden de vista mientras se escribe, y el botón de enviar sigue a mano sin tapar el campo enfocado.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `required`, `invalid` | Sí (C5 al necesitarlo; sin él, el `validationMessage` del navegador, como #839) |
| `consent` | Sí, con un `consent` `required` |
| `next`, `back`, `stepper` | Sí, en 02 |
| `busy` | Sí, con `busy` |
| `forQuery`, `query` | Sí, con `query` en 03 (K2) |
| `form`, `errorSummary`, `party`, `price`, `datePicker` | Los de cada componente (avisan ellos) |
| `external` | Sí, con un enlace externo |

## Avisos propios (`[Grana GbGuestForm<NN>]`)

C1 a C7 (C1: `fields` vacío), K1 a K3. Además: **G1** · `type` fuera de lista, **G2** · `email` o `tel` sin `autocomplete`, **G3** · un consentimiento marcado por `values` al empezar (se ignora), **G4** · `party` sin `partyRows`, **G5** · un `field.group` que no está en `groups` (va a un grupo final sin título propio), **G6** · sin escucha de `submit`, **G7** · `consents` sin `labels.consents`, **G8** · `policy` sin `link` y sin `linkLabel`.

## Banco (`guest-form.bank.js`)

Casa Alcalá: grupos «Quién viene» (nombre `given-name`, apellidos `family-name`, correo, teléfono `tel` con `why`) y «Tu llegada» (hora estimada `select`, peticiones `textarea` opcional); `party` con las `partyRows` comunes y la consulta común; dos consentimientos (política de cancelación `required` con `policy: 'cancelacion'`; ofertas por correo opcional); `offer` Suite Jardín con precio y total; `prices` MXN; `action` «Confirmar reserva»; `labels` completos. Estados de prueba: `busy`, `errors` del servidor en el teléfono, `error` general.

## Verificación propia

Vitest: un control por campo con su `type`, `autocomplete` y ayuda (`hint` + `why` en `aria-describedby`); el grupo arranca con `query.party`; vacío → `labels.required` con `{label}` y mal formado → `labels.invalid` en el campo, **sin** `submit`; consentimiento `required` sin marcar bloquea; G3 ignora la marca inicial; el enlace del consentimiento fuera del `label`; `submit` con su carga exacta; 02: «Siguiente» no avanza con errores del paso y enfoca el primero, avanza y enfoca el primer control del paso nuevo, los grupos ocultos montados entran en el `FormData`; 03 con `GFormActions sticky` y lo pedido arriba igual a `describeQuery`. Chromium: 03, el campo enfocado nunca queda bajo el pie pegado (2.4.11) a 390 × 844; filas de `GFormRow` sin desbordar a 320; teclado: Tab por todo el formulario, Intro envía.
