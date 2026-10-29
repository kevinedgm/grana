# Contrato · Profile (`GbProfile01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #957 a #961 y #965, 2026-10-29) · **Plan:** S4 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54; el motor de campos de `guest-form.md` · **Compone:** `GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GInput`, `GTextarea`, `GSelect`, `GSwitch`, `GErrorSummary`, `GFormActions`, `GAvatar`, `GBtn`, `GCard`, `GSummary`, `GSplit` (02), `GText` · **Fase:** 4c·1 · **No compleja** (Sonnet)

## Promesa

Los datos y preferencias de la persona (nombre, correo, foto, idioma, zona horaria), **diciendo antes de guardar lo que cambia al guardar**: si el correo nuevo pide confirmación, si algo queda pendiente, cómo la verán los demás. El bloque valida como el navegador y emite lo que cambió; la aplicación guarda.

## Props

```ts
interface GbProfileProps {
  title: string                          // «Tu perfil»
  description?: string
  profile: Profile                       // §45: lo guardado (nombre, correo, foto, meta) para el avatar y la vista previa
  fields: ProfileField[]                 // 1 a 12 (C7 por encima de 12)
  groups?: { id: string; title: string; description?: string }[]   // agrupan en GFormSection (01)
  values?: Record<string, string | boolean>   // v-model:values
  saved?: Record<string, string | boolean>    // lo guardado por campo: con él se dice `change` y se calcula `changed`
  action: Pick<Action, 'label' | 'icon'> // «Guardar cambios»
  busy?: boolean
  errors?: Record<string, string>
  error?: string
  done?: string                          // «Guardado»: en el `status` del pie (lo anuncia GFormActions)
  locale?: string
  labels: {
    required: string; invalid: string    // como Guest form
    avatar: { change: string; remove?: string }   // «Cambiar foto», «Quitar foto»
    preview?: string                     // 02: título de la vista previa («Así te ven los demás»)
    unsaved?: string                     // «Tienes cambios sin guardar» (status del pie con cambios)
    form?: GranaLabels; errorSummary?: GranaLabels
    external?: string
  }
}
```

**`ProfileField`** (§45): el `GuestField` de Guest form con `type` `text` (por defecto) → `GInput`; `email`, `tel`, `url` → `GInput type`; `textarea` → `GTextarea`; `select` → `GSelect` con `options` (idioma, zona horaria; las opciones las da la aplicación ya traducidas); **`switch`** → `GSwitch` (preferencia booleana del perfil, que se guarda con el formulario: **no** es un interruptor de efecto inmediato, así que va dentro del `GForm` y su valor viaja en `FormData`). Además: **`change`** (lo que pasa si el valor cambia), **`pending`** (algo a medias, advertencia del campo) y **`readonly`** (String: por qué no se puede cambiar, como ayuda del campo). Contraseña, `cc-*` o `card*`: no se pintan (SA2): cambiar la contraseña es Auth `new-password`.

## Anatomía (común)

```
GForm [data-gb] (labels.form; errors; v-model de cada campo ↔ values)
├─ GErrorSummary
├─ la foto: GAvatar (src = profile.avatar, name = values.name ?? profile.name, size xl, decorativo) + GBtn outline «Cambiar foto» (avatar: change) + GBtn link «Quitar foto» (avatar: remove; solo con avatar)
├─ campos (por grupo o directos) con el motor de campos
└─ GFormActions (status = done › unsaved con cambios › nada) › GBtn type="submit" (action, loading = busy)
```

- **`change` a la vista antes de guardar** (§43.2 forma 1): con `saved`, en cuanto `values[name]` difiere de `saved[name]`, el texto de `field.change` se **suma a la ayuda** del campo (`hint`, ya enlazada como descripción): «Te enviaremos un enlace al correo nuevo; hasta confirmarlo seguirás entrando con ana@barroyagave.mx». Al volver al valor guardado, desaparece. Sin `saved`, se dice cuando el campo ha sido editado.
- **`pending`**: `warning` del campo (lo enseña y lo anuncia el campo; no bloquea): «Pendiente de confirmar: ana.ruiz@barroyagave.mx».
- **`readonly`** String: el campo de solo lectura con el motivo como ayuda («Lo cambia la administración del espacio»).
- **`changed`**: en `submit`, los `name` cuyo valor difiere de `saved` (sin `saved`: los editados), para que la aplicación guarde solo eso y sepa si pedir confirmación del correo.
- **Cambios sin guardar:** con cambios, el `status` del pie dice `labels.unsaved` (texto, siempre a la vista; lo anuncia `GFormActions` una vez al aparecer). Tras guardar, la aplicación baja los cambios (nuevo `saved`) y pone `done`.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · En secciones** | El formulario largo, ordenado por grupos | `GSection` › el `GForm` con un `GFormSection` por grupo (la foto al principio del primer grupo) y `GFormLayout` › `GFormRow` por `row` | `labels.preview` |
| **02 · Con vista previa** | El formulario y, al lado, cómo te verán los demás con lo que estás escribiendo | `GSection` › `GSplit ratio="3:2" gap="lg"` › [`#start` › el `GForm` (sin grupos: un `GFormLayout`)] + [`#end` › `GCard` (`title` = `labels.preview`, nivel por anidación) › `GSummary layout="stack"` con `avatar` (`GAvatar` del valor actual: foto y nombre), `title` = `values.name`, `subtitle` = `values.email`, `facts` = los campos de tipo `text`/`select` con valor y `profile.meta`] | `groups` (los campos van seguidos) |
| **03 · Compacto** | Una línea con quién eres y debajo los pocos campos | `GSection` › `GSummary layout="row"` (avatar, `profile.name`, `profile.email`) + el `GForm` con un solo `GFormLayout` y la foto como una línea de botones | `groups`, `labels.preview` |

**02 · la vista previa sigue lo escrito** (vista, no negocio): se calcula de `values` en cada cambio, sin animar (nada se mueve solo); no es región viva (no habla en cada tecla). Con el texto al 200 % o en el teléfono, la vista previa va **debajo** del formulario (`GSplit`).

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, data: FormData, values, changed: string[] }` | Envío válido |
| `avatar` | `{ event, action: 'change' \| 'remove' }` | «Cambiar foto» / «Quitar foto» (el selector, el recorte y la subida son de la aplicación) |
| `update:values` | `Record<string, string \| boolean>` | Cada cambio |
| `navigate` | `{ event, href, item }` | Un enlace en la ayuda de un campo (slot) |

## Slots

`field-{name}` `{ field, value, error, id }` (escape, como Guest form), `preview` `{ values }` (02: la vista previa propia), `description`.

## Estructura accesible

`GSection` con título (sin `h1`); un solo `form` con su resumen de errores; la foto es decorativa (el nombre está escrito al lado) y sus botones tienen texto; `change`, `pending` y el motivo de `readonly` son descripción o mensaje **del campo** (se oyen al llegar a él); los cambios sin guardar, en el `status` del pie. Autocompletar: `name`, `email`, `tel`, `url`, `language` (1.3.5; G2 de Guest form para correo y teléfono).

## Qué lo hace distinto (#965)

**Antes de guardar, te dice lo que va a pasar.** Cambiar el correo no es como cambiar el nombre: el campo lo dice en cuanto lo tocas («Te enviaremos un enlace al correo nuevo; hasta confirmarlo seguirás entrando con el actual»), lo que quedó a medias se ve en su campo («Pendiente de confirmar»), y en 02 ves **cómo te verán los demás** mientras escribes. El pie dice «Tienes cambios sin guardar» mientras los tengas, y el envío lleva solo lo que cambió.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `required`, `invalid` | Sí (C5 al necesitarlos) |
| `avatar.change` | Sí (C5) |
| `avatar.remove` | Sí, con `profile.avatar` (C5) |
| `preview` | Sí en 02 (C5) |
| `unsaved` | Sí (C5 al haber cambios) |
| `form`, `errorSummary` | Los de cada componente |
| `external` | Sí, con un enlace externo (C5) |

## Avisos propios (`[Grana GbProfile<NN>]`)

C5, C7, SA2, SA7 (sin escucha de `submit`) y los del motor de campos (G1, G2, G5, G7, G8). Además: **PR1** · `type: 'switch'` con `required` (un interruptor no se «rellena»: se ignora `required`, como `switch.md`), **PR2** · `saved` con claves que no son campos (se ignoran), **PR3** · sin escucha de `avatar` (no se pintan los botones de la foto).

## Banco (`profile.bank.js`)

Ana Ruiz, `ana@barroyagave.mx`, foto, `meta` «Dueña · Barro y Agave»; campos nombre (`autocomplete="name"`), correo (`change` con el texto de confirmación, `pending` en otro estado del banco), teléfono, idioma (`select`: Español, English, Zapoteco del Istmo), zona horaria (`select`, `America/Mexico_City` por defecto), «Recibir el resumen semanal» (`switch`), puesto (`readonly` «Lo cambia la administración del espacio»); grupos «Datos personales» y «Preferencias»; `saved` = los valores iniciales; estados `busy`, `error`, `errors` en el correo, `done`.

## Verificación propia

Vitest: cada tipo → su control; `switch` como `GSwitch` dentro del `form` con su `name` en `FormData`; `change` aparece en la ayuda al diferir de `saved` y desaparece al volver; `pending` como advertencia; `readonly` String como ayuda; `changed` exacto en `submit`; `unsaved` en el `status` con cambios y `done` tras guardar; `avatar` con `change`/`remove` (sin «Quitar» sin foto); 02 la vista previa sigue `values.name`; SA2 con un campo `password`. Chromium: 02 al lado a 1440 y debajo a 390; 320 px sin desbordar; Tab con foco visible; el campo enfocado no queda bajo el pie.
