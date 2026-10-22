# Contrato · Newsletter (`GbNewsletter01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #817 y #824, 2026-10-22) · **Plan:** M11 (§4.1) · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GSection`, `GForm`, `GInput` (slot `action`), `GBtn`, `GCard`, `GSurface zone="brand"`

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
  labels?: { busy?: string; external?: string }
}
```

## Variantes

| Variante | Concepto | Compone |
| --- | --- | --- |
| **01 · En línea** | La sección y el campo con el botón acoplado | `GSection` (título, descripción) › `GForm` › `GInput` + `p` con `legal` |
| **02 · Tarjeta** | La suscripción en una tarjeta | `GCard as="section"` (raíz; título al nivel de `useSectionLevel()`, descripción) › cuerpo: el `GForm` de 01 + `legal` |
| **03 · Banda de marca** | La suscripción en una banda de tinta de marca | `GSurface zone="brand" padding="lg"` (raíz) › el contenido de 01 |

**El formulario (igual en las tres):** `GForm` › `GInput type="email" autocomplete="email" required` (`label`, `hint`, `placeholder`, `name`), con el slot **`action`** = `GBtn type="submit"` (`action.label`, `loading` = `busy`, `loadingText` = `labels.busy`). `error` llega al campo por `errors` de `GForm` (`{ [name]: error }`) y `done` como mensaje `valid` del `GInput`. El `GForm` valida (correo bien formado, obligatorio) y solo entonces el bloque emite `submit`.

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
| `external` | Sí, con `legal.link` externo (C5) |

## Avisos propios (`[Grana GbNewsletter<NN>]`)

Comunes C5 y C6. Además: **N1** · falta `field.hint` (la promesa; se pinta sin ella), **N2** · `error` y `done` a la vez (gana `error`), **N3** · sin escucha de `submit` (el correo no irá a ninguna parte).

## Banco (`newsletter.bank.js`)

«Fechas libres, primero para ti», `description`, `field` completo, `action` «Suscribirme» con `icon: 'mail'` (registrado con `createIcons`), `legal` con enlace interno al aviso de privacidad, `labels` completos; estados de prueba: `busy`, `error` («No pudimos suscribirte; inténtalo de nuevo»), `done`.

## Verificación propia

Vitest: `GInput` con el slot `action` y `type="submit"`; `hint` en `aria-describedby` del campo; correo inválido → error de `GForm` y **sin** `submit`; válido → `submit` con el correo recortado; `busy` → `GBtn loading`; `error` y `done` en el campo; 02 con encabezado de la tarjeta al nivel de sección; 03 en zona de marca. Chromium: campo y botón en una línea a 390 y sin desbordamiento a 320 (el botón no se sale de la caja).
