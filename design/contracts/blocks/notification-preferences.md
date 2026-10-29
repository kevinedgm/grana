# Contrato · Notification preferences (`GbNotificationPreferences01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #983 a #987 y #998, 2026-10-29) · **Plan:** S11 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 · **Compone:** `GSection`, `GTable` + `GCheckbox field: false` (01), `GFieldGroup` + `GCheckbox` (02), `GFormSection mode="collapsible"` (03), `GSwitch`, `GForm`, `GFormActions`, `GBtn`, `GText` · **Fase:** 4c·2 · **No compleja** (Sonnet)

## Promesa

Qué avisos recibe la persona y por dónde (correo, SMS, en la aplicación), **diciendo lo que no se puede apagar y por qué**, con pausar todo sin perder la configuración. Guarda al momento o con un botón, según quiera la aplicación; el bloque emite el valor.

## Props

```ts
interface GbNotificationPreferencesProps {
  title: string                          // «Avisos»
  description?: string
  events: NotifEvent[]                   // 1 a 20 (C7 por encima de 20)
  channels: NotifChannel[]               // 1 a 4 (C7 por encima de 4)
  value: NotifValue                      // v-model:value: evento → canales encendidos
  muted?: boolean                        // v-model:muted: pausar todo
  action?: Pick<Action, 'label' | 'icon'>   // con él: formulario con «Guardar» y `submit`; sin él: cada cambio es `update:value` y la aplicación guarda al momento
  busy?: boolean
  error?: string
  done?: string                          // «Guardado» (status del pie, con `action`)
  locale?: string
  labels: {
    cell: string | ((event: string, channel: string) => string)   // nombre de cada casilla («{event} por {channel}»)
    events: string                       // caption de la matriz / encabezado de la columna («Aviso»)
    mute: string                         // «Pausar todos los avisos»
    mutedNote: string                    // «Tu configuración se conserva. Los avisos de seguridad siguen llegando.»
    count?: string | ((on: number, total: number) => string)    // 03: resumen del canal («6 de 9 avisos»)
    unavailable?: string                 // canal no disponible sin motivo propio
    unsaved?: string                     // con `action`: «Tienes cambios sin guardar»
    sectionErrors?: string | ((n: number) => string)
    form?: GranaLabels; table?: GranaLabels
    external?: string
  }
}
```

## Anatomía (común)

- **Una casilla por evento y canal** (los de `event.channels`, o todos): `GCheckbox` marcada si el canal está en `value[event.id]`, con el nombre completo `labels.cell(event.label, channel.label)` («Pedido nuevo por correo»), sin `name` en el modo inmediato (no es un campo de formulario, #934) y con `name="{eventId}"` + `value="{channelId}"` con `action` (dentro del `GForm`, va en `FormData`).
- **Lo que no se apaga** (`event.required[channelId]`): la casilla marcada y **`readonly`** (enfocable y legible, nunca `disabled`, `checkbox.md`) con el motivo como `hint`/descripción («Los avisos de seguridad siempre llegan por correo»). Nunca se esconde.
- **Canal no disponible** (`channel.available` falso o String): sus casillas `readonly` sin marcar y el motivo una vez, junto al nombre del canal («SMS · Agrega un teléfono en tu perfil»). No se esconde.
- **Pausar todo** (`muted`): `GSwitch` `labels.mute` **antes** de las casillas (fuera del `form` con `action`, como el patrón de bloqueo de `form.md` §8). Encendido: las casillas quedan **`readonly`** con su estado **intacto** (pausar no borra la configuración) y debajo del interruptor `GText size="body-sm"` con `labels.mutedNote`, enlazado como `hint` del interruptor (**se dice antes de encender**). Los `required` siguen marcados. Emite `update:muted`.
- **Guardar:** sin `action`, cada cambio emite `update:value` (con el valor nuevo entero) y la aplicación guarda (y si quiere, lo dice con `GToast`). Con `action`, todo va dentro de `GForm` › … › `GFormActions` (`status` = `done` o `labels.unsaved` con cambios) › `GBtn type="submit"`, y emite `submit { event, value, muted }`.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Matriz** | Avisos en filas, canales en columnas, una casilla en cada cruce | `GSection` › interruptor + `GTable` (`caption` = `labels.events`; `rowKey="id"`; columna principal = el aviso con su `description` como subtítulo; una columna por canal con `label` = `channel.label`; `cell-{channelId}` = la casilla `field: false`; `responsive="auto"`: en estrecho, tarjetas por aviso con las casillas dentro, cada una con su nombre completo, SA-L8) | `labels.count`, `sectionErrors` |
| **02 · Por aviso** | Cada aviso con sus canales debajo, agrupados | `GSection` › interruptor + (por `group`, `GFormSection` con el título del grupo) `GStack gap="md"` de `GFieldGroup` por aviso (`label` = el aviso, `hint` = `description`) › `GCheckbox` por canal (etiqueta = el canal; el aviso lo da la leyenda del grupo) | `labels.cell` como etiqueta visible (sí como nombre accesible si hiciera falta), `labels.count` |
| **03 · Por canal** | Cada canal plegado con su resumen; al abrirlo, sus avisos | `GSection` › interruptor + un `GFormSection mode="collapsible"` por canal (`title` = canal, `summary` = `labels.count(on, total)`, `description` = `detail`) › `GCheckbox` por aviso (etiqueta = el aviso) | `labels.cell` visible |

En 02 y 03, fuera de un `GForm` (sin `action`), `GFieldGroup` y `GFormSection` siguen siendo agrupación con nombre (`fieldset`/sección); las casillas no llevan `name`.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:value` | `NotifValue` | Cada cambio de casilla |
| `update:muted` | `boolean` | El interruptor |
| `submit` | `{ event, value, muted }` | Con `action`, al guardar |
| `navigate` | §4 | Un enlace en un motivo (slot) |

## Slots

`event` `{ event }` (escape: la etiqueta rica de un aviso), `description`.

## Estructura accesible

`GSection` con título (sin `h1`); el interruptor de pausa antes de las casillas, con su consecuencia como descripción; 01 tabla con `caption`, encabezados de fila (avisos) y de columna (canales) y cada casilla con nombre completo; 02 `fieldset` por aviso; 03 secciones plegables con su resumen; lo que no se apaga y lo no disponible, `readonly` con su motivo (nunca escondido ni `disabled`).

## Qué lo hace distinto (#998)

**Lo que no se puede apagar se dice, y pausar no borra.** Los avisos de seguridad siguen marcados con su motivo al lado, en vez de desaparecer de la lista; un canal sin configurar dice qué falta («Agrega un teléfono»); y «Pausar todos los avisos» explica **antes** de encenderlo que la configuración se conserva y qué seguirá llegando. Al volver, todo está como lo dejaste.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `cell`, `events`, `mute`, `mutedNote` | Sí (C5) |
| `count` | Sí en 03 (C5) |
| `unavailable` | Sí, con un canal `available: false` (C5) |
| `unsaved` | Sí, con `action` (C5 al haber cambios) |
| `form`, `table` | Los de cada componente |

## Avisos propios (`[Grana GbNotificationPreferences<NN>]`)

C1, C2, C3, C5, C7, SA5, SA6 (un canal de `value`, `channels` o `required` que no existe). Además: **NP1** · `value` con un canal apagado que es `required` (se pinta marcado: lo obligatorio gana y la siguiente emisión lo incluye), **NP2** · sin escucha de `update:value` ni de `submit` (los cambios no irán a ninguna parte: SA7).

## Banco (`notification-preferences.bank.js`)

Milpa: grupos «Pedidos» (pedido nuevo, pedido cancelado), «Inventario» (existencias bajas), «Equipo» (alguien aceptó la invitación), «Seguridad» (entrada desde un dispositivo nuevo, `required` por correo con su motivo); canales correo (`detail` `ana@barroyagave.mx`), SMS (`available: 'Agrega un teléfono en tu perfil'`) y en la aplicación; `value` con una mezcla; `muted: false` y un estado `muted: true`; con y sin `action`; `labels` completos.

## Verificación propia

Vitest: cada casilla con su nombre completo; `required` marcada y `readonly` con el motivo; canal no disponible `readonly` con el motivo una vez; pausar deja las casillas `readonly` con su estado intacto y la nota como descripción del interruptor; sin `action`, `update:value` con el valor entero en cada cambio y casillas sin `name`; con `action`, `FormData` con `evento=canal` y `submit`; NP1. Chromium: 01 en tarjetas a 390 sin perder el nombre de las casillas; 03 plegado con movimiento reducido; 320 px sin desbordar; Tab y foco visible.
