# Contrato · Auth (`GbAuth01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #957 a #962, 2026-10-29) · **Plan:** S1 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 (sobre todo §44, seguridad) · **Compone:** `GCard`, `GForm`, `GInput` (`type` `email`/`text`/`password`/`tel`), `GSelect`, `GCheckbox`, `GFieldGroup`, `GErrorSummary`, `GFormLayout`, `GFormRow`, `GBtn`, `GDivider`, `GSummary`, `GText`, `GSplit` + `GSurface zone="brand"` (02), `GContainer` · **Fase:** 4c·1 · **Compleja: coco y bruno en Opus** (formulario por pasos, credenciales, gestores de contraseñas)

## Promesa

Entrar, crear la cuenta, pedir un enlace para recuperar la contraseña, fijar una nueva o escribir un código, **con el gestor de contraseñas funcionando siempre y sin sorpresas**: lo que se pide se dice antes (los requisitos de la contraseña, por qué se pide un dato) y lo que pasa al enviar se dice junto al botón. El bloque valida como el navegador y emite; **la aplicación autentica** (y redacta los errores). El bloque **no guarda** contraseñas ni códigos (§44).

## Props

```ts
interface GbAuthProps {
  mode: AuthMode                         // 'sign-in' | 'sign-up' | 'reset' | 'new-password' | 'verify'
  title: string                          // «Entra en Milpa»
  description?: string
  fields: AuthFields                     // §45: identifier (siempre), password, name, code, extra
  providers?: Provider[]                 // «Continuar con…» (sign-in y sign-up); 0 a 4 (C7 por encima de 4)
  identity?: string                      // a quién: «ana@barroyagave.mx» (new-password, verify y el paso 2 de 03): campo de solo lectura con autocomplete="username"
  step?: 'identifier' | 'secret'         // v-model:step (03): por defecto 'identifier'
  values?: Record<string, string>        // v-model:values: identidad, nombre y extra (NUNCA contraseña ni código, §44)
  consents?: Consent[]                   // sign-up: casillas nunca marcadas
  legal?: { text: string; link?: NavLink }   // «Al crear la cuenta aceptas…» (texto, no casilla)
  consequence?: string                   // junto al botón: qué pasa al enviar («Te enviaremos un correo para confirmar la cuenta»)
  aside?: { title: string; text?: string; points?: string[]; media?: Media }   // 02: el mensaje de marca
  routes?: Partial<Record<AuthMode, string>>   // con ruta, el cambio de modo es un enlace (guarda de navigate)
  action: Pick<Action, 'label' | 'icon'> // el botón de envío del modo («Entrar», «Crear cuenta», «Enviar enlace», «Guardar contraseña», «Verificar»)
  busy?: boolean
  errors?: Record<string, string>        // de la aplicación, por name; ganan a la validación
  error?: string                         // general («Correo o contraseña incorrectos»), en el resumen de errores
  done?: string                          // reset: «Si hay una cuenta con ese correo, te enviamos un enlace»
  labels: {
    required: string; invalid: string    // «Escribe {label}», «Revisa {label}» (como Guest form)
    switch?: Partial<Record<AuthMode, string>>   // «¿No tienes cuenta? Crear cuenta», «¿Olvidaste tu contraseña?», «Ya tengo cuenta»
    providers?: string                   // nombre del grupo («Otras formas de entrar»)
    or?: string                          // texto del separador («o»)
    next?: string                        // 03: «Continuar»
    change?: string | ((identity: string) => string)   // «Cambiar» la identidad (03, new-password, verify)
    showPassword?: string; hidePassword?: string       // a GInput (showPasswordLabel / hidePasswordLabel)
    rules?: string                       // título de los requisitos («La contraseña necesita»)
    ruleMet?: string; rulePending?: string            // texto oculto tras cada requisito («cumplido», «pendiente»)
    consent?: string; consents?: string  // como Guest form
    busy?: string
    form?: GranaLabels; errorSummary?: GranaLabels
    external?: string
  }
  locale?: string
}
```

## Qué pinta cada modo

| Modo | Campos (orden del DOM) | `autocomplete` | Proveedores | Cambios de modo |
| --- | --- | --- | --- | --- |
| `sign-in` | identidad · contraseña | `username` · `current-password` | Sí | `reset` («¿Olvidaste…?», junto a la contraseña), `sign-up` |
| `sign-up` | identidad · nombre · `extra` · contraseña (+ requisitos) · consentimientos | `username` · `name` · los de `extra` · `new-password` | Sí | `sign-in` |
| `reset` | identidad | `username` | No | `sign-in` |
| `new-password` | identidad (solo lectura, `identity`) · contraseña (+ requisitos) | `username` · `new-password` | No | `sign-in` |
| `verify` | identidad (solo lectura, `identity`) · código | `username` · `one-time-code` (`inputmode="numeric"`, `maxlength` = `length`) | No | `sign-in` |

- **Identidad:** `GInput` con `type` = `fields.identifier.type` (`email` por defecto) y `autocomplete="username"`, `name="identifier"` (la aplicación lee `data.get('identifier')`). Con `identity`, **solo lectura** con ese valor y un `GBtn variant="link"` `labels.change` que emite `switch` a `sign-in` (o vuelve al paso 1 en 03).
- **Contraseña:** `GInput type="password"` (`showPasswordLabel`/`hidePasswordLabel` = `labels.showPassword`/`hidePassword`: se puede ver lo escrito), `name="password"`, **sin `v-model` del bloque** (no controlado: el valor vive solo en el `input` y en el `FormData`; §44 regla 1), pegar permitido. Nunca un segundo campo «repite la contraseña» (ver lo escrito lo sustituye).
- **Requisitos** (`fields.password.rules`, solo `sign-up` y `new-password`): **a la vista antes de escribir**, debajo del campo: `GText as="div" size="body-sm"` con `labels.rules` y un `ul` con un `li` por requisito, enlazado como descripción del campo (`aria-describedby`: se oye al llegar). Con `test`, al escribir cada `li` lleva `GIcon` `check` (cumplido) o `minus` (pendiente), decorativo, **y** el texto oculto `labels.ruleMet`/`rulePending`; **no se anuncia en cada tecla** (sin región viva: lo lee quien vuelve a la descripción). Los requisitos **no bloquean** el envío: la aplicación decide con `errors` (el bloque no conoce la política).
- **Código:** `GInput type="text"` `inputmode="numeric"` `autocomplete="one-time-code"` `name="code"`, un solo campo (§44 regla 4), sin `v-model` del bloque.
- **`extra`** (solo `sign-up`): el motor de campos de Guest form/Checkout (§48) con el tipo cerrado de `AuthField`; `cc-*`, `card*` o un tipo fuera de lista no se pintan (SA2).
- **Proveedores:** `GStack gap="sm"` con `role="group"` y `aria-label` = `labels.providers`, un `GBtn variant="outline" block` por proveedor (`label`); el slot `provider` `{ provider }` pone el logo de la aplicación en el `prepend`. Van **antes** del formulario, separados por `GDivider label={labels.or}`.
- **Envío:** `GFormActions` › `GText size="caption" tone="muted"` con `consequence` (y su `id` en `aria-describedby` del botón) + `GBtn type="submit" block` (`action`, `loading` = `busy`, `loadingText` = `labels.busy`). `legal` va debajo como en Newsletter (`GText size="caption" tone="muted"`).
- **Validación:** la de Newsletter y Guest form (`ValidityState`: `valueMissing` → `labels.required`, `typeMismatch` → `labels.invalid`), `showErrors()` con errores y **ningún** `submit`; `errors` y `error` de la aplicación ganan. `done` (reset) va como mensaje `valid` del campo de identidad (lo anuncia el campo).

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tarjeta** | La tarjeta centrada de toda la vida, con lo justo | `GContainer width="reading"` (centrada: sin sección, §1 regla 4) › `GCard` (título al nivel de `useSectionLevel()`, `min(level, 6)`, #927; `description`) › proveedores + `GDivider` + `GForm` + cambios de modo (`GStack gap="sm"` de `GBtn variant="link"`) | `aside`, `step` |
| **02 · Dividida con marca** | El formulario y, al lado en ancho, el mensaje del producto en la zona de marca | `GSplit ratio="1:1" collapse="md" gap="lg"` › [`#start` › la tarjeta de 01] + [`#end` › `GSurface zone="brand" level="flat" padding="lg"` › `GSection` (`aside.title`, nivel por anidación) › `GText` (`aside.text`) + `GStack as="ul" gap="sm"` (`aside.points`) + imagen `aside.media` (§1 regla 9)]. Sin `aside`, la región `end` no se pinta y queda 01 (`split.md`: región vacía) | `step` |
| **03 · Un paso por pantalla** | Primero quién eres; después la contraseña, con tu identidad a la vista | La tarjeta de 01 con **dos pasos** en `sign-in` y `sign-up`: paso `identifier` (proveedores, identidad y `labels.next`) y paso `secret` (identidad de solo lectura con «Cambiar», nombre, `extra`, contraseña y requisitos, consentimientos, `action`). Los demás modos son de un paso | `aside` |

**03 · el paso de identidad** emite `submit` con `step: 'identifier'`, `final: false`, **cancelable** (§46): sin `preventDefault()`, pasa a `secret` (`update:step`) y el foco va al campo de contraseña; con él, espera a que la aplicación cambie `step` (p. ej. su servidor dice que la cuenta entra con SSO y la aplicación redirige). **Volver no borra** (#913): «Cambiar» vuelve a `identifier` con la identidad escrita. En `secret` la identidad sigue en el formulario como campo de solo lectura con `autocomplete="username"` (el gestor asocia la contraseña, §44 regla 4).

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, mode, step, data: FormData, values, consents, final, preventDefault(), defaultPrevented }` | Envío válido. `values` = identidad, nombre y `extra`, **sin** contraseña ni código (están solo en `data`) |
| `provider` | `{ event, provider, mode }` | «Continuar con…» |
| `switch` | `{ event, to }` | Cambio de modo; con `routes[to]` es un enlace con la guarda de `navigate` |
| `update:step` · `update:values` | el valor | 03 · cada cambio de identidad, nombre o `extra` |
| `navigate` | `{ event, href, item }` | El enlace de `legal` o de un consentimiento |

## Slots

`provider` `{ provider }` (el logo o el contenido del botón del proveedor; sin slot, solo el texto), `description`, `legal`, `aside` (02: escape del mensaje de marca), `field-{name}` (escape de un campo de `extra`, como Guest form).

## Estructura accesible

Un solo `form` (`GForm`, `aria-labelledby` al título de la tarjeta) con su `GErrorSummary`; **sin `h1`** (§42 regla 1, §53 SA-L2: la aplicación pone el de la página). Proveedores en un grupo con nombre, antes del formulario; el separador «o» es `GDivider` con texto. Requisitos como descripción del campo de contraseña. La consecuencia es descripción del botón de envío. Los cambios de modo son enlaces o botones con su texto completo. En 02, la zona de marca va **después** del formulario en el DOM (se lee después; `GSplit` no reordena) y su imagen es informativa con `alt` o `decorative`. WCAG 3.3.8: sin bloquear pegar, con gestor de contraseñas y sin pruebas cognitivas.

## Qué lo hace distinto (#962)

**Te dice antes lo que va a pasar, y el gestor de contraseñas nunca se pierde.** Los requisitos de la contraseña están a la vista **antes** de escribir (no aparecen como error al enviar) y se marcan al cumplirse sin hablar en cada tecla; lo que pasa al enviar («Te enviaremos un correo para confirmar») está junto al botón y se oye al llegar a él; en el flujo de un paso por pantalla la identidad sigue a la vista con «Cambiar», que no borra nada. Y lo que casi ningún formulario cuida: **cada campo con su `autocomplete` exacto**, la identidad presente en el formulario de la contraseña y el código en un solo campo, para que el gestor y el teléfono rellenen solos.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `required`, `invalid` | Sí (C5 al necesitarlos; sin ellos, `validationMessage`) |
| `switch.<modo>` | Sí, por cada modo al que se ofrece cambiar (C5; sin él no se pinta ese cambio) |
| `providers`, `or` | Sí, con `providers` (C5) |
| `next` | Sí en 03 con dos pasos (C5) |
| `change` | Sí con `identity` o en el paso 2 de 03 (C5) |
| `showPassword`, `hidePassword` | Los de `GInput` (avisa él) |
| `rules`, `ruleMet`, `rulePending` | Sí, con `rules` (C5; sin `ruleMet`/`rulePending` el estado no se dice y no se pintan las marcas) |
| `consent`, `consents` | Sí, con `consents` (C5) |
| `busy` | Sí, con `busy` (C5) |
| `form`, `errorSummary` | Los de cada componente |
| `external` | Sí, con un enlace externo (C5) |

## Avisos propios (`[Grana GbAuth<NN>]`)

C5, C6, C7, SA2, SA6 (`identity` ausente en `new-password`/`verify`: se pinta la identidad editable), SA7 (sin escucha de `submit`) y los del motor de campos para `extra` (G1, G2, G7, G8). Además: **AU1** · `fields.password` ausente en un modo que la pide (`sign-in`, `sign-up`, `new-password`: el modo no puede funcionar; se pinta sin el campo), **AU2** · `fields.code` ausente en `verify`, **AU3** · `values` trae una clave `password`, `code` o que empieza por `card` (se ignora: el bloque no la escribe en ningún campo), **AU4** · `providers` en `reset`, `new-password` o `verify` (no se pintan).

## Banco (`auth.bank.js`)

Milpa: `title` «Entra en Milpa», `fields` completos (identidad `email`, contraseña con tres `rules` —12 caracteres, una cifra, no es tu correo— con `test`, nombre, `extra` «Nombre del taller», código de 6), proveedores «Continuar con Arrecife» y «Entrar con el SSO de tu empresa», `consents` (condiciones `required` con enlace) , `legal`, `consequence` por modo, `aside` («Tu taller, en orden», tres `points`, una foto), `routes` de los cinco modos, `labels` completos; estados `busy`, `error`, `errors` en la identidad, `done` en `reset`, `identity` en `new-password` y `verify`.

## Verificación propia

Vitest: por modo, los campos y su `autocomplete` exactos (tabla de arriba); la contraseña y el código **sin `v-model`** y fuera de `values`, `update:values` y de toda carga salvo `data` de `submit` (prueba de no persistencia, §49); `values` con `password` → AU3 y no llega a ningún campo; requisitos en `aria-describedby` antes de escribir y marcados con `test` sin región viva; `consequence` en `aria-describedby` del botón; vacío o mal formado → mensajes, `showErrors()` y **sin** `submit`; 03: el paso 1 emite `submit` con `final: false`, avanza sin `preventDefault()` y no avanza con él; «Cambiar» vuelve con la identidad intacta; en el paso 2 la identidad está como campo de solo lectura con `username`; `switch` con y sin `routes` (guarda de `navigate`); proveedores con el slot `provider`; 02 sin `aside` = una región. Chromium: los `autocomplete` y `name` de cada modo en el DOM real (el gestor de contraseñas **no se puede verificar** en un navegador automatizado: queda para entorno real, `PENDIENTES.md` §7); 320 px sin desbordar con el texto largo; Tab recorre proveedores, campos, «ver contraseña», envío y cambios de modo con foco visible; 02 en ancho al lado y en el teléfono la marca debajo.
