# Contrato · Changelog & audit log (`GbChangelog01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #957 a #961 y #973, 2026-10-29) · **Plan:** S12 (§4.5; incluye el registro de auditoría) · **Entrada:** `@grana/blocks/saas` · **Común:** `_comun.md` §1 a §5 y §41 a §54 · **Compone:** `GSection`, `GStack`, `GCard` (01, 03), `GTable` con filtros de columna y paginación (02), `GTag` (`@grana/vue/tag`), `GBadge`, `GAvatar`, `GBtn`, `GText` · **Fase:** 4c·3 · **No compleja** (Sonnet)

## Promesa

Lo que ha cambiado: **en el producto** (novedades, mejoras, arreglos) y **en la cuenta** (quién hizo qué y cuándo), con su fecha exacta, **y lo nuevo desde la última visita dicho como tal**. La misma `LogEntry` sirve para las dos listas; la aplicación da las entradas ya ordenadas (más reciente primero) y filtra en su servidor.

## Props

```ts
interface GbChangelogProps {
  title: string                          // «Novedades» o «Registro de actividad»
  description?: string
  entries: LogEntry[]                    // las de la página (C7 por encima de 50)
  kinds?: LogKind[]                      // nombres de `kind` («Nuevo», «Mejora», «Arreglo», «Seguridad»)
  since?: string                         // v-model:since: ISO de la última visita; lo posterior es «nuevo»
  filters?: { key: string; op: string; value: unknown }[]   // v-model:filters (02, los de GTable)
  page?: number                          // v-model:page
  pageSize?: number
  total?: number                         // entradas en total (02)
  loading?: boolean; error?: boolean     // 02 (la tabla)
  actions?: Action[]                     // 03: «Ver todas las novedades»; como mucho dos (§3)
  locale?: string
  labels: {
    new: string                          // insignia de lo posterior a `since` («Nuevo»)
    newCount?: string | ((count: number, since: string) => string)   // 03: «3 novedades desde el {since}»
    none?: string                        // 03: «Nada nuevo desde tu última visita»
    seen?: string                        // 03: «Marcar como visto»
    columns?: { date: string; actor: string; action: string; target?: string; kind?: string }   // 02
    caption?: string                     // 02: caption de la tabla
    readMore?: string | ((title: string) => string)   // «Leer {title}» (01, con `body` largo sin `href`)
    table?: GranaLabels; pagination?: GranaLabels
    external?: string
  }
}
```

## Anatomía (común)

- **Fecha exacta** en `<time datetime>` con `Intl` (día, mes y año; con hora en el registro de 02), **sin relativas** («hace 2 días», §42 regla 1).
- **Lo nuevo** (con `since`): las entradas con `date > since` llevan `GBadge` de texto `labels.new` (`color="accent"`); el texto es lo que distingue, nunca solo el color. Sin `since`, nada es «nuevo».
- **Tipo** (`kind` + `kinds`): `GTag` estático con el nombre (sin `kinds`, el `kind` no se pinta: SA6); `tags` como `GTag` estáticos.
- **Quién** (registro): `GAvatar size="sm"` decorativo + nombre del `actor`; `target` en texto.
- **Enlace:** con `href`, el título es enlace (`GCard interaction="link"` o puerta de `GTable`, `navigate`); sin `href` y con `body`, la entrada enseña el `body` (01) o emite `open`.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Novedades** | Las novedades del producto, una tarjeta por entrada, de la más reciente a la más antigua | `GSection` › `GStack as="ol" gap="md"` › `GCard as="li"` (slot `eyebrow` = `<time>` + `labels.new`; `title` (nivel `useSectionLevel()` + 1); `description` = `summary`; cuerpo = `body` en `GText as="div"` (párrafos) y `media` §1 regla 9; pie = `kind` y `tags` como `GTag`; `interaction="link"` con `href`) | `filters`, `page`, `total`, `loading`, `error`, `actions`, `actor` |
| **02 · Registro filtrable** | Quién hizo qué y cuándo, en una tabla que filtra y pagina el servidor | `GSection` › `GTable` (`caption` = `labels.caption`; `rowKey="id"`; columnas fecha (`cell-date` con `<time>` y hora), quién (compuesta con `leading-actor` = `GAvatar`), acción (principal: `title`, puerta con `rowHref` = `href`, o `activatable` → `open`), sobre qué (`target`), tipo (`filter: { type: 'enum', options: kinds }`); `filterMode="external"` + `v-model:filters`; `page`/`pageSize`/`total`; `loading`, `error` + `retry`; lo nuevo como `GBadge` en `cell-date`) | `media`, `body` (solo `summary` como subtítulo), `actions` |
| **03 · Qué hay de nuevo** | Una tarjeta pequeña que dice cuántas novedades hay desde tu última visita y las tres primeras | `GCard` (título = `title`, nivel `min(level, 6)`, #927; `description` = `labels.newCount(count, since)` o `labels.none`) › `GStack as="ul" gap="sm"` de las **tres** más recientes nuevas (`GBtn variant="link"` al `href`, o texto) + `actions` + «Marcar como visto» (`GBtn variant="outline"`, `labels.seen`) | `filters`, `page`, `total`, `loading`, `error`, `media`, `body` |

**03 · Marcar como visto:** emite `update:since` con la **fecha de la entrada más reciente** (no la hora del reloj: determinista y sin depender del dispositivo); la aplicación lo guarda y la tarjeta pasa a `labels.none`. Sin `since`, todas cuentan como nuevas.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `open` | `{ event, entry }` | Una entrada sin `href` (02 puerta `activatable`) |
| `navigate` | `{ event, href, item }` | Una entrada con `href` o una `Action` |
| `update:since` | `string` (ISO) | 03: «Marcar como visto» |
| `update:filters` · `update:page` | el valor | 02 |
| `retry` | `{ event: null }` | 02: «Reintentar» |
| `activate` | §4 | Una `Action` sin `href` |

## Slots

`entry` `{ entry, isNew }` (escape: el cuerpo de una entrada en 01), `cell-{key}` (02, pasa a `GTable`), `description`.

## Estructura accesible

`GSection` (01, 02) o `GCard` (03) con título (sin `h1`); 01 lista ordenada de entradas con encabezado y fecha en `<time>`; 02 tabla de datos con `caption`, filtros y paginación de `GTable` (su recuento y anuncios, #569, #596), la puerta por fila y la fecha en `<time>`; «Nuevo» en texto; el `lang` de una entrada en su raíz (3.1.2). Sin región viva propia.

## Qué lo hace distinto (#973)

**Lo nuevo desde tu última visita, con su fecha de verdad.** Ninguna entrada dice «hace 2 días» (cambia con la caché y miente en una captura): todas dicen el día, y en el registro, la hora. 03 aparece con **cuántas novedades hay desde la última vez** y cuáles, y «Marcar como visto» guarda la fecha de la última entrada, no la del reloj del teléfono. El registro de actividad dice **quién, qué, sobre qué y cuándo** en una tabla que filtra el servidor: lo que cambió en la cuenta no sorprende a nadie.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `new` | Sí, con `since` (C5) |
| `newCount`, `none`, `seen` | Sí en 03 (C5) |
| `columns.*`, `caption` | Sí en 02 (C5) |
| `readMore` | Sí en 01 con un `body` largo sin `href` (C5) |
| `table`, `pagination` | Los de cada componente |
| `external` | Sí, con una entrada externa (C5) |

## Avisos propios (`[Grana GbChangelog<NN>]`)

C1, C2, C3, C5, C6, C7, SA5, SA6 (`kind` sin `kinds`). Además: **CL1** · entradas fuera de orden (una más antigua antes que una más reciente: se pintan como llegan; 03 cuenta igual las nuevas), **CL2** · `date` no ISO (se pinta el texto tal cual, sin `datetime`, y no cuenta como nueva).

## Banco (`changelog.bank.js`)

Milpa: ocho novedades (etiquetas por lote, una de seguridad, una en inglés con `lang="en"`, una con foto, una con `href` externo, una con `body` de tres párrafos) y doce entradas del registro de Barro y Agave (Ana cambió el rol de Luis, Luis dio de alta 40 productos, Rosa revocó una clave, una entrada del sistema sin `actor`); `kinds` Nuevo, Mejora, Arreglo, Seguridad; `since` = el 20 de octubre (tres nuevas); `total` 37; `labels` completos.

## Verificación propia

Vitest: fechas en `<time datetime>` sin relativas; «Nuevo» solo después de `since`; `kind` con su nombre; 01 lista ordenada con nivel de encabezado correcto; 02 `GTable` con `filterMode="external"`, `update:filters`/`update:page`, puerta (`navigate`/`open`), `retry` con `event: null`; 03 cuenta y tres primeras, `update:since` con la fecha de la más reciente (no `Date.now()`), `labels.none` sin nuevas; CL2. Chromium: 02 en tarjetas en estrecho; 320 px sin desbordar con la palabra larga; Tab y foco visible.
