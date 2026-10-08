# Contrato · GEmpty

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #529 a #543, 2026-10-08; cambios en archivos compartidos aplicados en `api.md`, `tokens.md` §42, `icons.md` v0.9 y `PENDIENTES.md`) · **Basado en:** `design/lab/empty-skeleton/r01/` (kiwi, commit bdcbe69: `brief.md`, `declaracion.md` con hallazgos L1 a L14, `load.js`, `load.css`, `verificar.mjs` 577/577 en Chromium, Firefox y WebKit, puerto 4212)
**Tag:** `g-empty` · **Categoría:** contenido (estado) · **Paquete:** `@grana/vue` (principal; #530)

El **vacío con causa**: lo que una región enseña cuando no tiene nada que enseñar, diciendo **por qué** y **cómo salir**. Su compañera es la región que carga (`GLoadRegion`, `design/contracts/load-region.md`): las dos nacen de la misma ronda y comparten el motor de anuncios, pero son componentes distintos (#529: el vacío es contenido; el marcador de carga es decorativo).

**Forma (decisión del usuario del 2026-10-08, #529):** **A + B.** El vacío toma la **forma de A, «el primer hueco»**: un elemento en el sitio donde aparecerá el primero, del tamaño de un elemento, nunca un póster centrado. Cuando la causa es un filtro, toma el **contenido de B, «la salida con cuentas»**: cuántas había, qué filtro quitar y cuántas vuelven con cada uno. **C «La frase»** queda reservada (`appearance="phrase"`, #543).

---

## Principios

- **El vacío es contenido.** Texto real en el árbol de accesibilidad, a veces con un control; no es decorativo ni transitorio. Vive como un párrafo dentro de una sección que ya tiene su encabezado.
- **La causa la dice el texto**, no el icono ni el color (WCAG 1.4.1). Cuatro causas, cuatro salidas (declaración, punto 11).
- **Siempre una salida**, salvo que no la haya (`forbidden` sin a quién pedir): nunca un botón deshabilitado.
- **Sin región viva propia.** Lo anuncia quien lo contiene: `GLoadRegion` (por su título, #533) o el anfitrión (`GTable` por su `labels.results`, #265). Un `GEmpty` suelto, fuera de ambos, no se anuncia: es contenido que la aplicación pone en una vista que ya cambió.
- **Sin `fetch`**, sin estado de datos: la aplicación sabe por qué está vacío y cuántas vuelven; `GEmpty` lo presenta y emite intención (`relax`, `clear`).
- **Textos sin valores por defecto** (#226): `title` y `description` son props; las frases de la salida son `labels`.

## Cuándo usarlo (frontera)

| Caso | Pieza |
| --- | --- |
| Una región sin datos (lista, panel, ficha) | **`GEmpty`** dentro de la región (y de `GLoadRegion` si carga) |
| Slots `empty`/`error` de `GTable`, `GCard`, `GWidget`, `GWidgetGrid`, `GWidgetGallery`, `GCalendar`, `GTabs` | **`GEmpty`** dentro del slot (adopción, #540); `GTable` lo pinta por defecto |
| Líneas de estado del panel de `GCombobox` y `GSelect` («Sin resultados», «Cargando», error de carga) | **No**: son líneas de un panel con su propio teclado; se quedan |
| Un fallo que afecta a la página y dura (sin conexión, servidor caído) | Isla de estado (`status.md`); en la región, si hace falta, `GStatusMark` en el slot `actions` (#541) |
| El resultado transitorio de una acción | `GToast` |
| Cuánto falta de una tarea con medida | `GProgress` |

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `cause` | String | `none` `filtered` `error` `forbidden` | — (**obligatoria**) | propia |
| `title` | String | texto | — (**obligatoria**) | propia |
| `description` | String | texto | sin valor | propia (como `GToast`) |
| `headingLevel` | Number | `2` a `6` | sin valor (el título es un párrafo) | compartida (como `GCard`) |
| `filters` | Array | `{ key: String \| Number, label: String, count?: Number }` | `[]` (función) | propia; solo con `cause="filtered"` |
| `total` | Number | ≥ 0 | sin valor | propia; solo con `cause="filtered"`: cuántas había antes de los filtros |
| `locale` | String | etiqueta BCP 47 | el `lang` del ancestro más cercano, luego `navigator.language` (como `GNumberField`, #310) | compartida; solo para unir nombres y formatear cuentas con `Intl` |
| `labels` | Object | ver «Textos» | `{}` (función) | propia |

### Reglas de props

- **`cause`** elige el icono por defecto, el modificador `g-empty--cause-*` y, con `filtered`, la salida. No cambia el texto: el título y la descripción los escribe la aplicación (ejemplos de la declaración: «Aún no hay muestras», «Ninguna muestra con estos filtros», «No se pudieron cargar las muestras», «No tienes permiso para ver estas muestras»).
- **`title`** es el nombre del vacío y **lo que se anuncia** cuando está dentro de una `GLoadRegion` (#533). Con `headingLevel`, se pinta como `h2`…`h6`; sin él, como `p` (un encabezado por cada vacío ensuciaría el índice de encabezados; declaración, punto 11).
- **`description`** es la causa o el paso siguiente («El servidor no respondió (503).», «Pídeselo a la responsable del laboratorio, Laura Ortiz.»). El slot por defecto la sustituye cuando hace falta texto rico (un enlace dentro).
- **`filters`** (solo `filtered`) son los filtros activos que dejaron la región en cero; `count` es **cuántos elementos volverían quitando solo ese filtro** (lo calcula la aplicación). `key` es lo que devuelve `relax`. Con otra `cause`, `filters` y `total` se ignoran (aviso de desarrollo).
- **`total`** es cuántos había antes de los filtros (la cuenta de «Antes había 4»). Sin `total`, no se pinta la frase de la traza.
- **`locale`** solo afecta a `Intl.ListFormat` (`{filters}` de `labels.before`, tipo `conjunction`) y a `Intl.NumberFormat` (cuentas). Se lee al montar y cuando cambia la prop; un cambio del `lang` de un ancestro después de montar no se observa (límite de #310).

## La salida (B, solo `cause="filtered"` con `filters`)

Qué se ofrece, en este orden (declaración, B; medido por kiwi: quitar «Cerradas» devuelve las 2 anunciadas):

1. **La traza** (`g-empty__trace`, con `total`): `labels.before` con `{total}` y `{filters}` («Antes había 4; con «Urgentes» y «Cerradas», ninguna.»).
2. **Un botón por filtro que devuelve algo**: solo los que traen `count > 0`, **de más a menos** (orden estable ante empates: el de `filters`). Texto `labels.relax` con `{label}` («Quitar «{label}»»), seguido de la cuenta visible (`g-empty__count`, `aria-hidden="true"`, cifras tabulares) y de la cuenta para el lector (`g-empty__sr`, texto oculto accesible con `labels.returns`, «{count} vuelven»). El nombre accesible empieza por el texto visible (WCAG 2.5.3). Emite **`relax`** con la `key`.
3. **«Quitar todos»** (`labels.clear`): si hay **más de un filtro** o si **ningún** botón del punto 2 se ofrece. Emite **`clear`**.
4. El slot `actions`, si lo hay, **después** de lo anterior.

- **Sin ninguna `count`** (la aplicación no sabe cuántas vuelven): solo «Quitar todos». Un filtro sin `count` entre otros con `count` no se ofrece suelto (no se sabe qué devuelve).
- **Jerarquía:** botones `GBtn` `size="sm"`; los del punto 2 `variant="outline"`; «Quitar todos» `variant="ghost"` si hay botones del punto 2 y `outline` si va solo. Como mucho una acción principal (la primera del punto 2).
- **Foco:** al quitar un filtro el `GEmpty` desaparece con el foco dentro. Dentro de una `GLoadRegion`, la región lo recoge (#534); en `GTable`, la tabla (su `clear` ya lo resuelve). Suelto, la aplicación decide a dónde va (README).

## Slots

| Slot | Alcance | Propósito |
| --- | --- | --- |
| por defecto | | Descripción rica; **sustituye** a `description` |
| `icon` | `{ cause }` | Sustituye al icono por defecto (un `GIcon` de la aplicación, p. ej. `inbox` para `none`, #202). Decorativo: el componente lo envuelve en el hueco `aria-hidden` |
| `actions` | `{ cause }` | Acciones (`GBtn`): crear o importar (`none`), reintentar (`error`), pedir acceso (`forbidden`). Con la salida, van después de ella |

Sin prop `icon`: **«plantilla → slot»** (#202). `GEmpty` se escribe siempre en plantilla, así que el icono de la aplicación va en su slot; el `icon` por nombre es la excepción acotada de `GAvatar` (#296) y no se extiende.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `relax` | `key` (String \| Number) | Pulsa «Quitar «…»» de un filtro de la salida |
| `clear` | — | Pulsa «Quitar todos» |

Declarados en `emits` (lección del CLAUDE.md). Las acciones del slot `actions` emiten lo suyo (son `GBtn` de la aplicación).

## Textos (`labels`, sin valores por defecto)

Solo los usa la salida. Cada clave admite String con marcadores o Function con un objeto (como #51).

| Clave | Marcadores | Uso | Necesaria |
| --- | --- | --- | --- |
| `relax` | `{label}` | Texto visible del botón de un filtro | Sí, si se ofrece algún filtro suelto |
| `returns` | `{count}` | Cuenta para el lector, oculta, dentro del mismo botón | Sí, si algún filtro trae `count` |
| `clear` | | «Quitar todos» | Sí, con `filters` |
| `before` | `{total}`, `{filters}` | La traza | Sí, con `total` |

## Iconos (solo Lucide; `icons.md` v0.9)

Iconos **propios** por causa, de la lista de la librería, con el `GLibIcon` interno, decorativos:

| `cause` | Icono por defecto |
| --- | --- |
| `none` | **ninguno**: el hueco del icono queda vacío (el círculo discontinuo donde irá el primero). `inbox` lo registra la aplicación y lo pone en el slot `icon` (no entra en la lista: #201, «solo lo que usa un componente») |
| `filtered` | `search` |
| `error` | `circle-alert` |
| `forbidden` | `lock` |

**Ninguno nuevo**: los tres ya están en la lista (`GCombobox`, `GStepper`, `GErrorSummary`).

## Estructura accesible

```
div.g-empty.g-empty--cause-{cause}  [is-exit]
├─ span.g-empty__icon  aria-hidden="true"          ← hueco del icono (slot icon o propio; vacío en none)
├─ div.g-empty__text
│  ├─ p|hN.g-empty__title  dir="auto"              ← el nombre del vacío (lo que se anuncia)
│  ├─ p.g-empty__description dir="auto"            ← o div con el slot por defecto
│  └─ p.g-empty__trace                              ← solo la salida con total
└─ div.g-empty__actions                             ← salida (GBtn.g-empty__relax…, «Quitar todos») y slot actions
   └─ GBtn.g-empty__relax > {labels.relax} span.g-empty__count[aria-hidden] span.g-empty__sr
```

- Sin `role`: es contenido de flujo (no `status`, no `alert`, no `region`). Sin `tabindex`: nunca toma el foco por sí mismo.
- `dir="auto"` en título, descripción y nombres de filtro (#282).
- **Registro en la región:** dentro de una `GLoadRegion`, se registra por inyección (clave interna `loadRegionKey`, compartida por `__shared`, #530) con su `title` y su `cause`; al desmontarse con el foco dentro, avisa a la región para que lo recoja (#534). No lee ni escribe el DOM de la región.

## Forma: el primer hueco (A)

- **En su sitio y del tamaño de un elemento:** dentro de una `GLoadRegion`, su alto mínimo es el de **un elemento** de la plantilla (la región mide el primer `[data-g-key]` de su molde o de lo último conocido y lo publica como `--_load-slot` en su raíz, #535); fuera, el de su contenido. En una lista ocupa el sitio de la primera fila; en una rejilla de teselas, el de una tesela; en una ficha, el de la ficha.
- **Anatomía de fila:** hueco del icono donde irá el avatar, texto en medio y acciones al final; a poco ancho, las acciones bajan bajo el texto **sin `@media` ni `@container`** (rejilla o `flex-wrap` intrínsecos).
- **Contorno discontinuo** y círculo discontinuo en el hueco del icono: dicen «aquí irá algo», sin relleno.
- Nada se anima (no hay entrada ni salida propias).

## Geometría y estilo (lo que coco debe respetar)

- Contorno de la caja y del hueco del icono: `--g-border-width` discontinuo en `--g-color-border-strong` (decorativo: la información la lleva el texto); radio `--g-radius-md`; hueco del icono `space × 10` (el lado del avatar de la fila de la plantilla de kiwi) con el icono en `--g-color-text-muted`; en `error`, icono y su círculo en `--g-color-danger-text`.
- Título en el rol de la línea principal de una fila (`body`, `--g-text-action-weight`), `--g-color-text`; descripción y traza `body-sm` en `--g-color-text-muted` (≥ 4,5:1 en claro y oscuro); cuentas con `font-variant-numeric: tabular-nums`.
- Relleno `space × 3` / `space × 4` (el de una fila); sin margen exterior propio (lo pone el anfitrión).
- `GBtn` reales: área ≥ 24 × 24 y ≥ 44 × 44 con `pointer: coarse` (la del propio `GBtn`).
- **Colores forzados:** contorno y hueco en `CanvasText`; el icono sigue `currentColor`.
- **RTL:** todo con propiedades lógicas; el hueco del icono queda al inicio lógico.
- **Movimiento reducido:** nada que cambiar (no hay movimiento).

## Tokens consumidos (§42; sin tokens nuevos de componente)

`--g-color-border-strong`, `--g-color-text`, `--g-color-text-muted`, `--g-color-danger-text`, `--g-border-width`, `--g-radius-md`, `--g-space-1`…`--g-space-4`, `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-action-weight`, `--g-font-ui`; los de `GBtn` y `GIcon` por composición. Alias local `--_load-slot` (lo escribe `GLoadRegion` en línea, variable dinámica justificada como `--_sk-w` de `GCard`); sin valor de respaldo: fuera de una región la propiedad vuelve a su inicial (`auto`).

## Clases y datos (contrato bruno ↔ coco)

| Clase | Dónde | Cuándo |
| --- | --- | --- |
| `g-empty` | Raíz | Siempre |
| `g-empty--cause-{none\|filtered\|error\|forbidden}` | Raíz | Según `cause` |
| `is-exit` | Raíz | `filtered` con `filters` no vacío (se pinta la salida) |
| `g-empty__icon`, `__text`, `__title`, `__description`, `__trace`, `__actions` | Partes | Según lo presente |
| `g-empty__relax`, `__count`, `__sr` | Botones de la salida | Con la salida |

## Avisos de desarrollo

`typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`, una vez cada uno, prefijo `[Grana] <GEmpty>`, sin contenido de la aplicación:

1. `filters` o `total` con una `cause` distinta de `filtered` (se ignoran).
2. Salida con filtros sueltos sin `labels.relax`; con `count` sin `labels.returns`; con `filters` sin `labels.clear`; con `total` sin `labels.before`. El botón se dibuja igual con el texto que haya.
3. `cause="filtered"` sin `filters` y sin slot `actions`: un vacío por filtro sin salida.
4. Un `GIcon` con `label` en el slot `icon` (aviso de `GIcon`, `icons.md` §2.4).

## Paquete, `meta.json` y tipos

- **Paquete principal** `@grana/vue` (#530): exportado desde `src/index.js` y registrado en el plugin; `GEmpty.css` en `components.css`. **Compuerta de 8 KB gzip** por componente (#238 y siguientes); estimación de kiwi ≈ 1 KB. `GTable` lo usa por defecto (#540), así que tiene que estar en el principal. Compuerta de `dist`: `grep -q "g-empty__relax" packages/vue/dist/grana.css`.
- **`GEmpty.meta.json`** (#443): las ocho props con tipo, valores y default (`cause` y `title` obligatorias), `relax` con su payload, `clear`, los tres slots con su alcance. En `packages/vue/types/overrides.mjs`: `GEmpty.filters: Array<{ key: string | number; label: string; count?: number }>` y `GEmpty.labels: { relax?: Label<{ label: string }>; returns?: Label<{ count: number }>; clear?: string; before?: Label<{ total: number; filters: string }> }` (forma de `Label` como en los demás `labels` con marcadores).

## Personalidad (#542)

- **El vacío es el primer hueco** (A): no es un póster con ilustración; ocupa el sitio y el tamaño del primero que llegará, con el hueco del icono donde irá su avatar.
- **La salida con cuentas** (B): cuando un filtro deja la región en cero, dice cuántas había y **qué filtro quitar y cuántas vuelven**, ordenado de más a menos.

## Qué lo hace distinto

Los vacíos de los frameworks son un póster igual para «aún no hay nada», «tus filtros lo dejaron en cero» y «falló el servidor», centrado en media pantalla y sin decir cómo salir. El de Grana ocupa **el sitio del primero que llegará**, dice **por qué** con texto y, si es un filtro, **cuál quitar y cuántas vuelven**: la salida es la información.

## Resolución de hallazgos de kiwi (los de `GEmpty`)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| L1 | Nombre y entrega | `GEmpty` (`g-empty`), en el **principal** (#530) |
| L2 | API | `cause` y `title` obligatorias, `description`, `headingLevel`, slots por defecto, `icon` y `actions`, `filters` con `count`, `total`, `relax`/`clear`, `labels` sin valores. **Cambio sobre la propuesta:** sin prop `icon` (slot, #202); `total` y `locale` añadidos para la traza y las cuentas |
| L5 | `inbox` | No entra en la lista de la librería; lo registra la aplicación (#201) |
| L11 | Fronteras | Tabla «Cuándo usarlo»; isla y `GStatusMark` (#541) |
| L12 | Personalidad | #542 |
| L13 | Reservas | `cause="done"` (bandeja al día, vacío positivo) y `appearance="phrase"` (C) reservados (#543) |

## Fuera de v0.1 (reservado con nombre)

- `cause="done"`: «al día» (vacío positivo, sin salida); `appearance="phrase"` (C, la frase en una línea con sus acciones como enlaces) para celdas y paneles pequeños (#543).

## Límites conocidos (para el README)

- Suelto (fuera de `GLoadRegion` y de un anfitrión) no se anuncia y no recoge el foco al desaparecer: la aplicación decide.
- Las cuentas por filtro las calcula la aplicación; sin ellas, la salida se reduce a «Quitar todos».
- `forbidden` sin a quién pedir: sin acción (nunca un botón deshabilitado); la aplicación no debe poner uno.
- Fuera de una región, el alto mínimo es el del contenido (no hay elemento que medir).

## Verificación (cómo se da por hecho)

### bruno (vitest + jsdom, `GEmpty.test.js`)

`cause` obligatoria y validada; `title` como `p` sin `headingLevel` y como `hN` con él; icono por defecto por causa (`none` sin icono) y slot `icon` que lo sustituye, siempre dentro del hueco `aria-hidden`; sin `role` ni `tabindex` en la raíz; slot por defecto sustituye a `description`; **salida**: solo los filtros con `count > 0`, de más a menos y estable; «Quitar todos» con más de un filtro o sin sueltos; sin ninguna `count`, solo «Quitar todos»; `relax` con la `key` y `clear`; nombre accesible del botón = visible + `returns`; `{filters}` con `Intl.ListFormat` en el `lang` del ancestro; cuentas con `Intl.NumberFormat`; registro en la región (título anunciado, foco recogido al desmontar con el foco dentro); los cuatro avisos una vez cada uno; nada de esto escribe en una región viva propia.

### Playwright (`design/lab/theme-playground/`, puerto propio)

`tests/empty.spec.mjs`: contraste de título, descripción y traza ≥ 4,5:1 en claro y oscuro; área de los `GBtn` ≥ 44 × 44 a 390 px con `pointer: coarse`; RTL (hueco del icono a la derecha); `forced-colors` en Chromium (contorno visible); alto del hueco = alto de un elemento dentro de `GLoadRegion` (Δ ≤ 1 px).

### coco (CSS y auditoría)

`GEmpty.css` sin literales ni respaldos; auditoría conjunta con `GLoadRegion` con un tema distinto al por defecto.

## Encargos

- **coco** (Sonnet u Opus, componente complejo por la región): `GEmpty.css` según «Geometría y estilo».
- **bruno** (Opus, junto con `GLoadRegion`): `GEmpty.vue`, `GEmpty.test.js`, `GEmpty.meta.json`, `overrides.mjs`, registro en el principal, compuerta de `dist`.
- **mora-docs**: `GEmpty/README.md` tras la auditoría (recetas: `inbox` registrado en el slot `icon`; foco suelto; cuentas por filtro).
