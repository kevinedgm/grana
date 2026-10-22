# Contrato · Newsletter (`GbNewsletter01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #817 y #824, 2026-10-22; remates #830, #839, #840, #841) · **Plan:** M11 (§4.1) · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GSection`, `GForm`, `GInput` (slot `action`), `GBtn`, `GCard`, `GSurface zone="brand"`

## Promesa

Un solo campo, el correo, con el botón acoplado, y **qué va a recibir la persona dicho antes de pedírselo**. El bloque valida con `GForm`, emite el correo y la aplicación suscribe.

## Props

```ts
interface GbNewsletterProps {
  title: string
  description?: string
  field: {
    label: string                      // «Tu correo»
    hint: string                       // la promesa: qué y cada cuánto («Un correo al mes con fechas libres»)
    placeholder?: string
    name?: string                      // nombre en el envío; sin valor, "email"
  }
  action: Pick<Action, 'label' | 'icon'>   // el botón de envío (href se ignora)
  legal?: { text: string; link?: NavLink } // «Puedes darte de baja cuando quieras.» + «Aviso de privacidad»
  busy?: boolean                       // enviando: GBtn loading
  error?: string                       // error de la aplicación (servidor), en el campo
  done?: string                        // confirmación de la aplicación, en el campo («Listo: revisa tu correo»)
  labels?: {
    busy?: string
    external?: string
    required?: string                  // «Escribe tu correo» (campo vacío al enviar; #839)
    invalid?: string                   // «Revisa el correo: falta algo como nombre@dominio.com» (#839)
    form?: { error?: string; valid?: string }   // prefijos ocultos del mensaje del campo, tal cual a `labels` de GForm (#840)
  }
}
```

## Variantes

| Variante | Concepto | Compone |
| --- | --- | --- |
| **01 · En línea** | La sección y el campo con el botón acoplado | `GSection` (título, descripción) › `GForm` › `GInput` + `p` con `legal` |
| **02 · Tarjeta** | La suscripción en una tarjeta | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`, descripción) › cuerpo: el `GForm` de 01 + `legal` |
| **03 · Banda de marca** | La suscripción en una banda de tinta de marca | `GSurface zone="brand" level="flat" padding="lg"` (raíz; sin borde ni radio, #830) › el contenido de 01 |

**El formulario (igual en las tres):** `GForm` › `GInput type="email" autocomplete="email" required` (`label`, `hint`, `placeholder`, `name`), con el slot **`action`** = `GBtn type="submit"` (`action.label`, `loading` = `busy`, `loadingText` = `labels.busy`). `error` llega al campo por `errors` de `GForm` (`{ [name]: error }`) y `done` como mensaje `valid` del `GInput`.

**Validación (#839; corrige la versión anterior, que decía «El `GForm` valida»: `GForm` no valida, #157).** El bloque lee el `ValidityState` del propio `input` (la regla del correo es la del navegador para `type="email"`, sin expresión propia): `valueMissing` → `labels.required`, `typeMismatch` → `labels.invalid`; ese texto entra en `errors` de `GForm` al escribir y al enviar, y con error el envío llama a `showErrors()` (revela, sacude, enfoca) y **no** emite `submit`. Sin el texto que el estado necesita: aviso C5 y, como último recurso, el `validationMessage` del navegador (sale en el idioma del navegador, no en el de la página). `error` (servidor) gana a la validación; `done` solo se pinta sin error. `labels.form` va tal cual a `labels` de `GForm` (#840): el bloque no avisa por él (avisa `GForm`, aviso 2).

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, email }` | Envío válido (el `submit` de `GForm`); `email` sin espacios a los lados |
| `navigate` | `{ event, href, item }` | El enlace de `legal` (interno) |

**Resultado:** el bloque no anuncia nada (#792). La aplicación pone `busy`, luego `done` o `error`, y si quiere que se oiga, `GToast` (receta del README).

## Slots

`legal` (escape: contenido rico del texto legal), `description`.

## Qué lo hace distinto (#824)

**Dice qué llega antes de pedir el correo, y no pide nada más.** La promesa (`field.hint`: qué, cada cuánto) es obligatoria y es la descripción del campo: quien usa lector la oye al llegar al campo, antes de escribir, no después de enviar. Un solo dato (sin nombre, sin casillas de intereses), botón acoplado a la caja (el anillo de foco rodea los dos, `input.md`) y el resultado dicho en el propio campo: el viajero en el teléfono no pierde de vista lo que acaba de enviar.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `busy` | Sí, si la aplicación usa `busy` (C5; `loadingText` de `GBtn`) |
| `required` | Sí: se necesita en cuanto alguien envía vacío (C5 al necesitarlo; sin él, `validationMessage`) |
| `invalid` | Sí: se necesita en cuanto el correo no está bien formado (C5 al necesitarlo; sin él, `validationMessage`) |
| `form.error` | Sí, con `error` o con un error de validación (avisa `GForm`) |
| `form.valid` | Sí, con `done` (avisa `GForm`) |
| `external` | Sí, con `legal.link` externo (C5) |

## Avisos propios (`[Grana GbNewsletter<NN>]`)

Comunes C5 y C6. Además: **N1** · falta `field.hint` (la promesa; se pinta sin ella), **N2** · `error` y `done` a la vez (gana `error`), **N3** · sin escucha de `submit` (el correo no irá a ninguna parte).

## Banco (`newsletter.bank.js`)

«Fechas libres, primero para ti», `description`, `field` completo, `action` «Suscribirme» con `icon: 'mail'` (registrado con `createIcons`), `legal` con enlace interno al aviso de privacidad, `labels` completos; estados de prueba: `busy`, `error` («No pudimos suscribirte; inténtalo de nuevo»), `done`.

## Verificación propia

Vitest: `GInput` con el slot `action` y `type="submit"`; `hint` en `aria-describedby` del campo; vacío → `labels.required` y correo mal formado → `labels.invalid` en el campo (no el `validationMessage`), **sin** `submit`; sin esos textos, C5 una vez y `validationMessage`; `labels.form` llega a `GForm` (sin avisos de `GForm` con el banco); 03 con `g-surface--level-flat`; válido → `submit` con el correo recortado; `busy` → `GBtn loading`; `error` y `done` en el campo; 02 con encabezado de la tarjeta al nivel de sección; 03 en zona de marca. Chromium: campo y botón en una línea a 390 y sin desbordamiento a 320 (el botón no se sale de la caja).
