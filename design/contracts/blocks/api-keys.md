# Contrato · API keys & tokens (`GbApiKeys01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #957 a #961 y #970, 2026-10-29) · **Plan:** S9 (§4.5) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 (sobre todo §44 regla 3: el secreto de una vez) · **Compone:** `GSection`, `GStack`, `GTable` (01), `GAdaptiveLayout` + `GCard` (02, 03), `GBadge`, `GBtn`, `GIcon`, `GDialog` (crear y enseñar el secreto en 01 y 02), `GForm`, `GInput`, `GCheckboxGroup`, `GSelect`, `GFormLayout`, `GFormActions`, `GText` y la confirmación común (§43.2) · **Fase:** 4c·3 · **Compleja: coco y bruno en Opus** (secreto de una vez, diálogos, confirmación)

## Promesa

Las claves de acceso a la API del espacio: cuáles hay, qué pueden hacer, **cuándo se usaron por última vez** y cuándo caducan; crear una diciendo qué permisos lleva, **enseñar el secreto completo una sola vez** y revocar diciendo antes qué dejará de funcionar. El bloque **no conserva** el secreto (§44): lo enseña mientras la aplicación se lo da y, al cerrarlo, lo olvida.

## Props

```ts
interface GbApiKeysProps {
  title: string                          // «Claves de la API»
  description?: string
  keys: ApiKey[]
  scopes: Scope[]                        // los permisos que se pueden dar (y los nombres de los de cada clave)
  created?: OnceSecret | null            // v-model:created: el secreto recién creado (§44 regla 3)
  expirations?: { value: string; label: string }[]   // «30 días», «90 días», «Sin caducidad» (value '' = sin caducidad)
  creating?: boolean
  errors?: { name?: string; scopes?: string }
  error?: string
  open?: boolean                         // v-model:open (01 y 02): el diálogo de crear
  locale?: string
  labels: {
    keys: string                         // caption / nombre de la lista («Claves»)
    columns?: { name: string; key: string; scopes: string; lastUsed: string; expires: string }   // 01
    never: string                        // «Nunca» (sin uso / sin caducidad)
    lastUsed?: string | ((date: string) => string)   // «Usada el {date}»
    expires?: string | ((date: string) => string)    // «Caduca el {date}»
    createOpen?: string                  // 01/02: «Crear clave»
    name: string; nameHint?: string      // «Nombre», «Para reconocerla: dónde la vas a usar»
    scopesLabel: string                  // «Permisos»
    expiresLabel?: string                // «Caducidad»
    createAction: string                 // «Crear clave»
    required: string
    secretTitle: string                  // «Copia la clave ahora»
    secretNote: string                   // «Es la única vez que la verás completa. Guárdala en un lugar seguro.»
    secretLabel: string                  // etiqueta del campo de solo lectura («Clave nueva»)
    copy: string                         // «Copiar clave»
    done: string                         // «Ya la guardé»
    revoke: string | ((name: string) => string)   // «Revocar {name}»
    danger?: string                      // texto junto a un permiso `danger` («Puede modificar o borrar»)
    confirm: { revoke: ConfirmLabels }
    keep: string
    consequence?: ConsequenceLabels
    close?: string; busy?: string
    form?: GranaLabels; errorSummary?: GranaLabels; table?: GranaLabels
    external?: string
  }
}
```

## Anatomía (común)

- **Una clave:** nombre; `masked` (texto de la aplicación, en `code` dentro de un `GText`, nunca el secreto); permisos como lista de textos (`Scope.label`; los `danger` con `labels.danger` en texto y `GIcon triangle-alert` decorativo); `lastUsed` en `<time>` con `labels.lastUsed` (o `labels.never`: «Nunca se ha usado» es información de seguridad, a la vista); `expiresAt` con `labels.expires` (o `labels.never`); `statusText` y `attention` (§43.3: caducada, por caducar). Acción: «Revocar {nombre}» → confirmación con `consequences.revoke` («Las llamadas de "Servidor de pedidos" dejarán de funcionar al instante; no se puede deshacer») → `revoke`.
- **Crear:** `GForm` › `GFormLayout` › `GInput` (`labels.name`, `name="name"`, `required`, `autocomplete="off"`) + `GCheckboxGroup layout="card"` (`labels.scopesLabel`, `name="scopes"`, una casilla por `Scope` con su `description` y la marca de `danger`; agrupadas por `group` con `GFieldGroup`) + `GSelect` (`labels.expiresLabel`, `name="expires"`, con `expirations`) › `GFormActions` › `GBtn type="submit"` (`loading` = `creating`). Ningún permiso viene marcado (lo mínimo por defecto). Válido → `create`.
- **El secreto de una vez** (`created`, §44 regla 3): solo en el cliente (SA4); `GCard status="warning"` (`statusText` = `labels.secretTitle`) › `GText` `labels.secretNote` + `GInput readonly` (`labels.secretLabel`, `value` = `created.value`, `autocomplete="off"`, `spellcheck="false"`, sin `name`: **no** es un campo de envío) + `GBtn` `labels.copy` (`copy { event, keyId }`: la aplicación copia en su escucha síncrona; SA-L3) + `GBtn` sólido `labels.done` (emite `update:created(null)` y el bloque recuerda el `keyId`, SA3). Al aparecer, el foco va al campo del secreto (el valor queda seleccionable). **No hay «ver otra vez»**: tras «Ya la guardé» solo existe `masked`.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tabla** | Las claves en una tabla; crear y el secreto en un diálogo | `GSection` (acción `labels.createOpen` que abre el `GDialog` de crear; `v-model:open`) › `GTable` (`caption` = `labels.keys`; columnas nombre (principal), clave (`masked`), permisos, último uso, caducidad; `rowStatus` con `attention`; `row-actions` «Revocar {nombre}») · el `GDialog` lleva el formulario y, **cuando llega `created`, cambia su contenido por el secreto** en el mismo diálogo (`title` = `labels.secretTitle`); cerrarlo con el secreto a la vista equivale a «Ya la guardé» | — |
| **02 · Tarjetas** | Una tarjeta por clave, con sus permisos a la vista | `GSection` (misma acción y diálogo que 01) › `GAdaptiveLayout role="list" gap="md"` › `div role="listitem" class="g-adapt-standard"` › `GCard` (`title` = nombre, `subtitle` = `masked`, `meta` = último uso y caducidad, cuerpo = permisos, `status` con `attention`, `actions` = revocar) | `columns` |
| **03 · Crear arriba** | El formulario de crear a la vista, el secreto en su sitio y la lista debajo | `GSection` › `GStack gap="lg"` › el formulario (sin diálogo) — sustituido por la tarjeta del secreto mientras haya `created` — + `GStack as="ul" gap="sm"` de `GCard as="li" level="flat"` por clave | `open`, `labels.createOpen`, `labels.close` |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `create` | `{ event, name, scopes: string[], expires: string \| null }` | Formulario válido |
| `revoke` | `{ event, key }` | Tras confirmar |
| `copy` | `{ event, keyId }` | «Copiar clave» (la aplicación copia; el bloque no envía el valor en la carga: la aplicación ya lo tiene) |
| `update:created` | `null` | «Ya la guardé» o cerrar el diálogo con el secreto |
| `update:open` | `boolean` | 01 y 02 |

## Slots

`key` `{ key }` (escape: el contenido de una clave), `description`.

## Estructura accesible

`GSection` con título (sin `h1`); tabla con `caption` o lista; «Revocar {nombre}» con el nombre en el control; permisos y su peligro en texto; fechas en `<time>`; el secreto en un campo de solo lectura con etiqueta, su advertencia en texto antes del campo y el foco en él al aparecer; la revocación es `alertdialog` con el foco en «Mantener». Sin región viva: «Copiado» lo dice la aplicación (`GToast`).

## Qué lo hace distinto (#970)

**Una sola vez, y nunca a ciegas.** El secreto se enseña completo **una vez**, con la advertencia antes del campo y el foco en él, y al cerrar se olvida (el bloque no lo guarda en ningún sitio y no lo vuelve a pintar aunque se lo pasen otra vez). Cada clave dice **cuándo se usó por última vez** —«Nunca se ha usado» es una señal para revocarla— y revocar dice antes **qué dejará de funcionar y que no se deshace**. Crear empieza sin permisos marcados y nombra los que pueden borrar.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `keys`, `never`, `name`, `scopesLabel`, `createAction`, `required`, `secretTitle`, `secretNote`, `secretLabel`, `copy`, `done`, `revoke` | Sí (C5) |
| `columns.*` | Sí en 01 (C5) |
| `lastUsed`, `expires` | Sí, con el dato (C5) |
| `expiresLabel` | Sí, con `expirations` (C5) |
| `createOpen`, `close` | Sí en 01 y 02 (C5) |
| `danger` | Sí, con un `Scope` `danger` (C5) |
| `confirm.revoke`, `keep` | Sí (SA9: sin ellos no se ofrece revocar) |
| `consequence` | Sí, con `consequences.revoke` (C5) |
| `busy` | Sí, con `creating` (C5) |
| `form`, `errorSummary`, `table` | Los de cada componente |

## Avisos propios (`[Grana GbApiKeys<NN>]`)

C1, C3, C5, SA1 (revocar sin consecuencia), SA3, SA4, SA5, SA6 (un `scope` de una clave sin `Scope`), SA7 (sin escucha de `create`), SA8, SA9. Además: **AK1** · `masked` que parece completo (más de 12 caracteres seguidos sin `…` ni `•`: no se pinta y avisa; la aplicación debe enmascarar), **AK2** · `created.keyId` que no está en `keys` (se pinta igual: la aplicación puede añadir la clave después), **AK3** · sin escucha de `copy` (no se pinta «Copiar clave»: la persona selecciona el texto).

## Banco (`api-keys.bank.js`)

Milpa: «Servidor de pedidos» (lectura y escritura de pedidos, `danger`; usada el 28 de octubre; sin caducidad; `consequences.revoke` irreversible), «Hoja de inventario» (lectura de inventario; nunca usada; caduca el 30 de noviembre, `attention` `warning` «Caduca pronto»), «Pruebas» (caducada, `statusText`); alcances de lectura y escritura de pedidos, productos e inventario en tres grupos; `expirations` 30, 90 y sin caducidad; un `created` de prueba con un valor **inventado** (`mlp_test_…`), nunca uno real; estados `creating`, `errors.name`; `labels` completos.

## Verificación propia

Vitest: el secreto solo en el cliente (SSR sin el valor), en un campo de solo lectura sin `name`, con el foco al aparecer; «Ya la guardé» emite `update:created(null)`, el valor desaparece del DOM y el mismo `keyId` no se vuelve a pintar (SA3); `copy` sin el valor en la carga; ningún almacenamiento, red ni `console` con el valor (§49 prueba 1); `masked` completo → AK1; crear sin permisos marcados, con `danger` en texto, válido → `create`; revocar solo tras confirmar con la consecuencia; `lastUsed` `null` → `labels.never`. Chromium: 01 el diálogo pasa del formulario al secreto sin cerrarse; 320 px sin desbordar (el secreto largo se parte o desplaza en su campo, sin desbordar la página); Tab y foco visible; el foco vuelve a «Crear clave» al cerrar.
