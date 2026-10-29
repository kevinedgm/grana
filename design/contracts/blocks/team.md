# Contrato · Team & roles (`GbTeam01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #957 a #961 y #969, 2026-10-29) · **Plan:** S8 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 · **Compone:** `GSection`, `GStack`, `GTable` (01), `GAdaptiveLayout` + `GCard` (02, 03), `GAvatar`, `GSelect`, `GBadge`, `GBtn`, `GDialog` (invitar en 01 y 02), `GForm`, `GTextarea`, `GFormLayout`, `GFormRow`, `GFormActions`, `GPriceScope` + `GPrice`, `GProgress` (decorativa, SA-L1), `GText` y la confirmación común (§43.2) · **Fase:** 4c·2 · **Compleja: coco y bruno en Opus** (tabla, diálogos, formulario de invitación, confirmaciones)

## Promesa

Quién está en el espacio, con qué rol, y quién está invitado y aún no entra; invitar, reenviar, cambiar el rol y quitar **diciendo antes lo que cambia**: lo que cuesta un asiento más, lo que deja de ver quien pierde el acceso, lo que puede hacer el rol nuevo. Las invitaciones pendientes y caducadas **se ven en la misma lista**. La aplicación invita y cambia; el bloque pregunta, dice y emite.

## Props

```ts
interface GbTeamProps {
  title: string                          // «Equipo»
  description?: string
  members: Member[]
  invites?: Invite[]
  roles: Role[]                          // en orden de menos a más permisos
  seats?: Seats                          // §45: ocupados, total y precio por asiento
  invite?: {
    roles?: string[]                     // roles asignables al invitar (por defecto, los `assignable`)
    defaultRole?: string
    consequence?: Consequence            // lo que cuesta cada invitación («Cada persona ocupa un asiento: + $49 al mes»)
    max?: number                         // correos por envío (C7 por encima)
  }
  prices?: PriceRegion                   // obligatoria con `seats.price` o consecuencias con `cost` (EC1)
  inviting?: boolean                     // enviando invitaciones
  errors?: { emails?: string; role?: string }   // de la aplicación (servidor)
  error?: string
  open?: boolean                         // v-model:open (01 y 02): el diálogo de invitar
  locale?: string
  labels: {
    members: string                      // caption de la tabla / nombre de la lista («Miembros»)
    invites: string                      // «Invitaciones pendientes»
    columns?: { person: string; role: string; status: string; lastActive?: string }   // 01
    you: string                          // «Tú»
    seats?: string | ((used: number, total: number | null) => string)   // «4 de 10 asientos»
    role: string                         // encabezado de la columna o etiqueta del rol en 02 y 03 («Rol»)
    roleOf?: string | ((name: string) => string)   // nombre accesible del selector por persona («Rol de Luis Mendoza»)
    sentAt?: string | ((date: string) => string)   // «Enviada el {date}»
    expiresAt?: string | ((date: string) => string)
    lastActive?: string | ((date: string) => string)
    resend: string | ((email: string) => string)   // «Reenviar a {email}»
    remove: string | ((name: string) => string)    // «Quitar a {name}»
    cancelInvite: string | ((email: string) => string)   // «Cancelar invitación a {email}»
    rowActions?: string | ((name: string) => string)    // nombre del menú de una fila
    inviteOpen?: string                  // 01/02: «Invitar personas» (abre el diálogo)
    emails: string                       // etiqueta del campo («Correos»)
    emailsHint: string                   // «Uno por línea o separados por comas»
    inviteRole: string                   // «Con el rol»
    inviteAction: string | ((count: number) => string)  // «Invitar a {count}»
    required: string; invalid: string | ((email: string) => string)   // «Escribe al menos un correo», «Revisa {email}»
    tooMany?: string | ((max: number) => string)
    confirm: { remove: ConfirmLabels; 'change-role': ConfirmLabels; cancelInvite: ConfirmLabels }
    keep: string
    consequence?: ConsequenceLabels
    close?: string                       // closeLabel del diálogo de invitar
    busy?: string
    form?: GranaLabels; errorSummary?: GranaLabels; table?: GranaLabels; dialog?: GranaLabels
    price?: PriceLabels & { legend?: string }
    external?: string
  }
}
```

## Anatomía (común)

- **Una persona:** `GAvatar` (decorativo: el nombre va escrito) + nombre + correo; `labels.you` en una `GBadge` de texto si `you`; `statusText` y `attention` (§43.3); `lastActive` en `<time>`.
- **Su rol:** `GSelect` **sin `name`** (no es un campo de formulario, #934) con `aria-label` = `labels.roleOf(name)` y las opciones = `roles` asignables, con la descripción de cada rol en el slot `option` de `GSelect` (nombre y, debajo, lo que puede hacer; contenido sin interactivos, `select.md` slots). Cambiarlo **no cambia nada todavía**: abre la confirmación de §43.2 (`labels.confirm['change-role']`, «¿Dar a Luis Mendoza el rol Administración?»), cuyo cuerpo dice la **descripción del rol nuevo** («Puede invitar y quitar personas, y cambiar el plan») y `consequences['change-role']`; al confirmar, `change-role`; «Mantener» o Esc devuelven el `GSelect` al rol de siempre (el valor es controlado: `member.role`). Con `locked` (la dueña, tú si no puedes cambiarte), el rol es **texto** con el motivo como descripción («Es la dueña del espacio»), sin control.
- **Quitar:** en el menú de la fila / tarjeta (o un `GBtn` en 03), `labels.remove(name)` → confirmación con `consequences.remove` («Luis Mendoza dejará de ver los pedidos de Barro y Agave; sus cambios se conservan. Se libera un asiento: − $49 al mes desde el 1 de diciembre») → `remove`. No se ofrece con `locked` ni a ti mismo.
- **Invitaciones** (`invites`): en la **misma vista** que los miembros, después (§43.3: lo pendiente donde se decide): correo, rol, `sentAt`, `expiresAt` o `attention` («Caducó el 20 de octubre»), «Reenviar» (`resend`, sin confirmación: no destruye) y «Cancelar invitación» (confirmación con `consequences.remove`).
- **Asientos** (`seats`): `labels.seats(used, total)` en texto y, con `total`, una barra `GProgress` decorativa (SA-L1); con `price`, `GPrice size="sm"` «por asiento».
- **Invitar** (el mismo formulario en las tres): `GForm` › `GFormLayout` › `GFormRow` › `GTextarea` (`labels.emails`, `hint` = `labels.emailsHint`, `name="emails"`, `autocomplete="off"`, `rows` 3) + `GSelect` (`labels.inviteRole`, `name="role"`, valor por defecto `invite.defaultRole`) › la **consecuencia** `invite.consequence` (§43.1) **y la cuenta** («Invitar a 3» en el botón: el texto de `labels.inviteAction(count)` se calcula de los correos escritos) › `GFormActions` › `GBtn type="submit"` (`loading` = `inviting`). **Validación:** el bloque parte el texto por comas, espacios y saltos de línea, quita repetidos y comprueba cada correo con el `ValidityState` de un `input type="email"` creado en el manejador (la regla del navegador, sin expresión propia; sin tocar el DOM de la página); vacío → `labels.required`; uno mal formado → `labels.invalid(email)` (el primero); más de `max` → `labels.tooMany(max)`; con error, `showErrors()` y **ningún** `invite`. `errors` de la aplicación ganan.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tabla** | La tabla de miembros y, debajo, la de invitaciones | `GSection` (acción en `actions`: `GBtn` `labels.inviteOpen` que abre el **`GDialog`** con el formulario de invitar; `v-model:open`) › `GStack gap="lg"` › asientos + `GTable` miembros (`caption` = `labels.members`; columna compuesta persona con `leading-person` = `GAvatar size="md"`; `cell-role` con el `GSelect`; estado con `rowStatus` para `attention`; `row-actions` con un `GBtn variant="link"` «Quitar a…»: una sola acción, ver abajo) + `GTable` invitaciones (`caption` = `labels.invites`; correo, rol en texto, enviada, `rowStatus` de la caducada; `row-actions` con «Reenviar» y «Cancelar invitación») | — |
| **02 · Tarjetas** | Una tarjeta por persona, para equipos pequeños | `GSection` (misma acción que 01) › `GStack gap="lg"` › asientos + `GAdaptiveLayout role="list" gap="md"` › `div role="listitem" class="g-adapt-standard"` › `GCard` por miembro (`media` = `GAvatar size="lg"`, `title` = nombre, `subtitle` = correo, `badge` = `labels.you`, `status`/`statusText` con `attention`; cuerpo: el rol; `actions`: quitar) + la lista de invitaciones igual, con `GCard level="flat"` | `columns` |
| **03 · Invitar arriba** | El formulario de invitar a la vista y, debajo, la lista | `GSection` › `GStack gap="lg"` › asientos + el formulario (sin diálogo) + `GStack as="ul" gap="sm"` de miembros (`GCard as="li" level="flat" orientation="horizontal"`) + invitaciones | `open`, `labels.inviteOpen`, `labels.close` |

**La acción de un renglón en 01** es un `GBtn variant="link"` con el nombre completo («Quitar a Luis Mendoza») y no un menú: una sola acción por miembro no necesita menú (y el menú añadiría una parada de foco). Las invitaciones llevan dos (`resend`, cancelar) como dos `GBtn variant="link"`.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `invite` | `{ event, emails: string[], role: string }` | Invitación válida (`role` = `Role.id`) |
| `change-role` | `{ event, member, role }` | Tras confirmar (`role` = el `Role` nuevo) |
| `remove` | `{ event, member }` · `{ event, invite }` | Tras confirmar |
| `resend` | `{ event, invite }` | «Reenviar» |
| `update:open` | `boolean` | 01 y 02: abrir o cerrar el diálogo de invitar |
| `navigate` | §4 | Un enlace en un slot |

**Foco** (§43.2): tras confirmar «Quitar», cuando la persona desaparece de los datos, el foco va al «Quitar» de la siguiente (o la anterior) y, sin nadie, al botón de invitar. Tras `invite` con éxito la aplicación cierra el diálogo (`open: false`) y el foco vuelve a «Invitar personas» (`GDialog from`).

## Slots

`person` `{ member }` (escape: el contenido de la celda o tarjeta de una persona), `invite-form` `{ submit }` (escape: el formulario de invitar propio), `description`.

## Estructura accesible

`GSection` con título (sin `h1`); tablas con `caption` (01) o listas (02, 03); cada selector de rol con el nombre de la persona; el rol bloqueado es texto con su motivo; «Quitar a {nombre}», «Reenviar a {correo}»: nombres completos en el control; estado y atención en texto (`rowStatus`, `statusText`); el diálogo de invitar con título y cierre; las confirmaciones son `alertdialog` con el foco en «Mantener». El formulario de invitar dice la consecuencia y la cuenta antes del botón.

## Qué lo hace distinto (#969)

**Nadie pierde el acceso ni paga un asiento sin saberlo.** Invitar dice lo que cuesta **antes** de enviar y cuántas personas van («Invitar a 3 · Cada persona ocupa un asiento: + $49 al mes»); cambiar un rol enseña **lo que podrá hacer** con el nuevo antes de aplicarlo; quitar dice qué deja de ver y qué se conserva. Y las invitaciones que nadie aceptó o que caducaron **están en la misma pantalla** que el equipo, con «Reenviar» al lado: lo pendiente no se queda en un correo perdido.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `members`, `you`, `role`, `roleOf`, `remove`, `emails`, `emailsHint`, `inviteRole`, `inviteAction`, `required`, `invalid` | Sí (C5) |
| `invites`, `sentAt`, `resend`, `cancelInvite` | Sí, con `invites` (C5) |
| `columns.*` | Sí en 01 (C5) |
| `seats` | Sí, con `seats` (C5) |
| `expiresAt`, `lastActive` | Sí, con el dato (C5) |
| `inviteOpen`, `close`, `dialog` | Sí en 01 y 02 (C5; `close` lo pide `GDialog`) |
| `tooMany` | Sí, con `invite.max` (C5) |
| `confirm.*`, `keep` | Sí (SA9: sin ellos no se ofrece esa acción) |
| `consequence` | Sí, con alguna consecuencia (C5) |
| `busy` | Sí, con `inviting` (C5) |
| `form`, `errorSummary`, `table`, `price` | Los de cada componente |

## Avisos propios (`[Grana GbTeam<NN>]`)

C1, C3, C5, C7, EC1, SA1 (quitar, cambiar rol o cancelar sin consecuencia), SA5, SA6 (`member.role` o `invite.defaultRole` sin `Role`), SA7 (sin escucha de `invite`), SA8, SA9. Además: **TM1** · ningún miembro con `you` (no se sabe a quién no ofrecer «Quitar»: se ofrece a todos salvo a los `locked`), **TM2** · `seats.used` distinto del número de miembros activos (se pinta lo que diga `seats`: la aplicación cuenta), **TM3** · un rol asignable sin `description` (la confirmación no puede decir lo que cambia: SA1).

## Banco (`team.bank.js`)

Barro y Agave: Ana Ruiz (Dueña, `you`, `locked` «Es la dueña del espacio»), Luis Mendoza (Edición, `consequences` de quitar y de cambiar rol), Rosa Hernández (Lectura, `attention` `warning` «No ha entrado en 60 días»), Donaudampfschifffahrtsgesellschaft García (texto largo); invitaciones `carmen@…` (pendiente, `expiresAt`) y `pedro@…` (caducada, `attention`); roles Dueña (no asignable), Administración, Edición, Lectura con descripciones; asientos 4 de 10 a $49; `invite.consequence` con `cost`; `prices` MXN; estados `inviting`, `errors.emails`; `labels` completos.

## Verificación propia

Vitest: el selector de rol sin `name`, con el nombre de la persona y controlado (cancelar la confirmación devuelve el valor); `change-role` y `remove` solo tras confirmar, con la consecuencia y la descripción del rol nuevo en el diálogo; ningún «Quitar» para `you` ni `locked`; invitaciones en la misma vista con «Reenviar» (sin confirmación) y cancelar (con confirmación); el formulario de invitar parte, quita repetidos y valida con `ValidityState`, la cuenta del botón sigue a los correos y la consecuencia está en `aria-describedby`; con error no emite; foco tras quitar (al siguiente, al anterior, al botón de invitar); barra de asientos `aria-hidden`. Chromium: 01 en tarjetas en estrecho (`GTable responsive`); el diálogo de invitar en el teléfono como hoja; 320 px sin desbordar; Tab y foco visible; el foco vuelve al disparador al cerrar diálogos.
