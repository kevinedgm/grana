# Contrato · GResourceList (Grana Blocks)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #709 a #722, 2026-10-20; respuestas del usuario #723 a #725, 2026-10-21); pendiente de coco (CSS del block y de las enmiendas) y de bruno (`.vue`, enmiendas, pruebas) · **Basado en:** `design/lab/resource-list/r01/` (kiwi, bb211db: `brief.md`, `declaracion.md` §1–§15, `rl.js`, `index.html?c=C`, `verificar.mjs` 432/432 en Chromium, Firefox y WebKit, puerto 4211)
**Tag:** `g-resource-list` · **Categoría:** block (pantalla de gestión) · **Paquete:** **`@grana/blocks`** (`packages/blocks/`, privado, `0.0.0`; #708) · **Avisos:** `[Grana GResourceList]`

**Componente complejo** (compone `GPageHeader`, `GTable` con su `GFilterBar` y su `GPagination`, `GEmpty`, `GMenu`, `GDialog`, `GTag`, `GInput`, `GBtn`, `GIcon`; motor de consulta y de selección; una superposición): **coco y bruno en Opus** (regla de `CLAUDE.md`).

La pantalla que toda aplicación de negocio repite: **ver** un conjunto de recursos, **encontrar** uno, **crearlo**, **cambiarlo** y **retirarlo**, sin perder dónde estaba la persona. El block **ensambla** componentes de `@grana/vue`; lo propio es el **orden** de la pantalla, la **frase** de la consulta, las **facetas**, el **sitio del editor**, la **selección** con sus masivas y **a dónde vuelve el foco**. No hace `fetch`, no valida, no guarda y no conoce endpoints (#708).

**Forma (decisión del usuario del 2026-10-20, #709): C · «La frase».** La consulta **se lee** como una frase con huecos («Tinas **en cualquier estado** de **cualquier agave** a cargo de **cualquier maestro**, **lo que pide atención primero**»), cada hueco un `GMenu` de radios; las **facetas** cuentan sin su propio filtro; la pantalla **empieza por lo que pide atención**; las bajas se confirman **en el sitio**; el editor es una **hoja lateral**. A · «En su sitio» y B · «Lente» **no se contratan**: quedan **reservadas** como formas futuras (`removal="undo"` y `editor="lens"`, #723), sin construir, con ronda propia.

---

## Principios

1. **El block compone; no repinta** (kiwi §3.1). Carga, refresco, error, vacío, recuento, rango, tarjetas, pie y estado de fila son de `GTable`, `GEmpty` y `GPagination`. Lo que esos componentes ya hacen no se duplica.
2. **Intención, nunca mutación.** El block no cambia `rows`, `total` ni la consulta por su cuenta: emite `update:query`, `create`, `edit`, `duplicate`, `remove` y la aplicación consulta, guarda y vuelve a pasar los datos.
3. **Solo API pública de `@grana/vue`** (#720, `api.md` «Grana Blocks»): `@grana/blocks` es otro paquete y no lee `__shared`. Lo que el block necesita y no es público se resuelve con una **enmienda del componente** (§«Enmiendas de `@grana/vue`»), nunca tocando su DOM interno.
4. **Una pantalla, una jerarquía:** un `h1` (el de `GPageHeader`), **una** acción principal sólida, y nada del block entre el título y su acción (#714).
5. **La consulta se lee** (personalidad, #710): lo que se ve está dicho en una frase de la aplicación, en su idioma, sin fragmentos concatenados por el block.
6. **Sin textos propios** (`labels`, sin valores por defecto, #226) y **sin región viva propia** (#720).

## Uso

```vue
<main id="main" tabindex="-1">
  <GResourceList
    ref="lista"
    title="Tinas de fermentación"
    description="Palenque Santa Catarina · 46 tinas"
    v-model:query="consulta"
    v-model:selected="elegidas"
    :columns="columnas"
    :rows="pagina.filas"
    row-key="id"
    :total="pagina.total"
    :row-status="estadoDeTina"
    :loading="cargando"
    :error="fallo"
    :phrase="frase"
    :blanks="huecos"
    :facets="facetas"
    :returns="pagina.vuelven"
    :page-sizes="[10, 25, 50]"
    :actions="{ create: puedeCrear, edit: motivoEdicion, duplicate: true, remove: motivoBaja }"
    selectable
    :labels="textos"
    @create="nueva" @edit="editar" @remove="darDeBaja" @retry="consultar"
  >
    <template #form="{ mode, item, close, cancel }">
      <TinaForm :mode="mode" :tina="item" @saved="(t) => close({ saved: true, key: t.id })" @cancel="cancel" />
    </template>
    <template #cell-estado="{ value }"><GBadge variant="soft">{{ ESTADO[value] }}</GBadge></template>
  </GResourceList>
</main>
```

```js
// La frase: plantilla de la aplicación con un {id} por hueco (orden y gramática del idioma, §«La frase»)
const frase = ({ estado }) => estado === 'vacia'
  ? 'Tinas {estado} de {agave}, {orden}.'                 // la aplicación cambia la frase entera, no un trozo
  : 'Tinas {estado} de {agave} a cargo de {maestro}, {orden}.'
const huecos = [
  { id: 'estado', key: 'estado', label: 'Estado',
    any: { label: 'Cualquier estado', phrase: 'en cualquier estado' },
    options: [{ value: 'fermentando', label: 'Fermentando', phrase: 'fermentando' }, /* … */] },
  { id: 'agave', key: 'agave', label: 'Agave', any: { label: 'Cualquier agave', phrase: 'cualquier agave' }, options: AGAVES },
  { id: 'maestro', key: 'maestro', label: 'Maestro mezcalero', any: { label: 'Cualquiera', phrase: 'cualquier maestro' }, options: MAESTROS },
  { id: 'orden', type: 'sort', label: 'Orden', custom: { phrase: 'en el orden de la tabla' }, options: [
    { value: 'atencion', label: 'Lo que pide atención primero', phrase: 'lo que pide atención primero', sort: { key: 'atencion', direction: 'ascending' } },
    { value: 'dias', label: 'Las de más días primero', phrase: 'las de más días primero', sort: { key: 'dias', direction: 'descending' } }
  ] }
]
// Las facetas: cuentas del servidor, cada una SIN su propio filtro (§«Facetas»)
const facetas = [
  { id: 'atencion', label: 'Requieren atención', filter: { key: 'atencion', op: 'is', value: true }, count: 8, pinned: true, icon: 'triangle-alert' },
  { id: 'fermentando', label: 'Fermentando', filter: { key: 'estado', op: 'in', value: ['fermentando'] }, count: 21 },
  /* … */
]
// La consulta empieza por lo que pide atención (receta de C, #710)
const consulta = ref({ search: '', filters: [], sort: { key: 'atencion', direction: 'ascending' }, page: 1, pageSize: 10 })
```

El ejemplo es ilustrativo: la forma exacta la documenta mora-docs con lo que bruno construya.

## Anatomía (forma elegida)

```
main                                              ← de la aplicación; el contenedor largo
└─ div.g-resource-list[.is-narrow]                ← raíz del block: hijo de main y el contenedor de GPageHeader
   │                                                 (sin container-type, transform, filter ni contain: page-header.md «Pegado», reglas 6 y 7)
   ├─ header.g-page-header (GPageHeader)           ← h1 #{id}-title; [trail] [meta] de la aplicación;
   │     └─ [actions] {narrow, docked}             ← las de la aplicación y, al final, «crear» (la única sólida de marca)
   │        ⚠ nada en el slot por defecto ni en meta lo pone el block (#714)
   └─ div.g-resource-list__body                    ← inset en línea = el de GPageHeader (#715)
      ├─ div.g-resource-list__query role="search" aria-label={labels.query}
      │  ├─ div.g-resource-list__facets role="group" aria-label={labels.facets}   ← GTag de alternar (aria-pressed)
      │  ├─ p.g-resource-list__phrase              ← texto de la plantilla + un GMenu de radios por hueco
      │  │     └─ GMenu > [trigger] button.g-resource-list__blank[.is-set]
      │  └─ GInput type="search" .g-resource-list__search   (con searchable)
      └─ GTable aria-labelledby={id}-title         ← GFilterBar (si alguna columna declara filter) · barra · tabla/tarjetas · GEmpty · GPagination
            ├─ [toolbar]  span.g-resource-list__total  |  div.g-resource-list__bulk role="group"   (#717)
            └─ [row-actions] GMenu (editar · duplicar · …de la aplicación · dar de baja con confirmación en el sitio, #718)
   GDialog.g-resource-list__editor placement="end" mobile="sheet"   ← el editor (hoja lateral), hermano del cuerpo
```

- **Orden del DOM = lectura = Tab** (1.3.2, 2.4.3): encabezado (ruta → `h1` → descripción → `meta` → acciones) → consulta (facetas → frase → búsqueda) → tabla (filtros → barra con masivas → filas → pie). Ni `order` ni `grid-area` que reordenen.
- **Las facetas son controles de la consulta** y viven en la región `search`, no en el encabezado (#714; corrige kiwi §2, donde iban en el slot por defecto de `GPageHeader` y empujaban la acción).
- Con `forbidden`, la región de consulta y la tabla no se pintan; en su lugar, `GEmpty cause="forbidden"` (§«Estados»).

## Props

| Prop | Tipo | Valores | Default | Va a |
| --- | --- | --- | --- | --- |
| `title` | String | texto | — (**obligatoria**) | `GPageHeader` `title`; nombra la tabla (`aria-labelledby`, kiwi §3.2) |
| `description` | String | texto | sin valor | `GPageHeader` |
| `headingLevel` | Number | `1` `2` `3` | `1` | `GPageHeader` (2 o 3 si el block vive en un panel o un `GDialog`) |
| `sticky` | Boolean | | `true` | `GPageHeader` |
| `query` | Object | `{ search, filters, sort, page, pageSize }` | — (**obligatoria**) | propia (`v-model:query`); §«Consulta» |
| `columns` | Array | la forma de `GTable` | `[]` | `GTable` (objetos para la estructura, slots para la celda; #711) |
| `rows` | Array | objetos con campos | `[]` | `GTable` (la página actual que da el servidor) |
| `rowKey` | String | nombre de campo | `id` | `GTable` |
| `total` | Number | ≥ 0 | sin valor | `GTable` (modo servidor siempre: `sortMode`/`filterMode` `external`, kiwi §3.5) |
| `rowStatus` | Function | `(row) => { status, text, key? } \| null` | sin valor | `GTable` (#600) |
| `rowHref` | Function | `(row) => string \| null` | sin valor | `GTable`: puerta de la fila a la ficha de la aplicación; re-emitida como `open` |
| `density` | String | `default` `comfortable` `compact` | `default` | `GTable` |
| `pageSizes` | Array | enteros ≥ 1 | sin valor | `GTable` **solo fuera de estrecho** (#716) |
| `loading` | Boolean | | `false` | `GTable` |
| `error` | Boolean | | `false` | `GTable` (#540) |
| `forbidden` | Boolean | | `false` | propia: `GEmpty cause="forbidden"` en lugar de consulta y tabla |
| `phrase` | String \| Function | plantilla con `{id}` por hueco, o `(values) => plantilla` | sin valor | propia; §«La frase». Sin `phrase` no hay frase (la consulta es solo facetas y búsqueda) |
| `blanks` | Array | §«Huecos» | `[]` | propia |
| `facets` | Array | §«Facetas» | `[]` | propia |
| `searchable` | Boolean | | `true` | propia: el `GInput type="search"` de la región |
| `returns` | Object | `{ total?: Number, search?: Number, filters?: { [key]: Number } }` | sin valor | propia: cuántos volverían quitando solo cada filtro (L10; `GEmpty` «La salida») |
| `actions` | Object | `{ create, edit, duplicate, remove }` → `true` · `false` · String (motivo) · `(row) => …` | `{}` | propia; §«Permisos» (#643) |
| `rowItems` | Function | `(row) => items de GMenu` | sin valor | propia: acciones de la aplicación en el menú de la fila (§«Acciones de la fila») |
| `selectable` | Boolean | | `false` | `GTable` + barra de masivas (§«Selección») |
| `selected` | Array | claves | `[]` | propia (`v-model:selected`) |
| `editor` | String | `sheet` `dialog` | `sheet` | propia: `GDialog placement="end"` (hoja lateral, C) o `center` (formularios que deban aislarse) |
| `labels` | Object | §«Textos» | `{}` (**sin valores por defecto**) | propia; `labels.table`, `labels.emptyExit` y `labels.menu` pasan a sus componentes |
| `id` | String | | generado (SSR-seguro) | base de ids (`{id}-title`, editor, frase) |

**No existen** (y por qué): `appearance`; **reservados como formas futuras por decisión del usuario (#723)**, sin construir ni coste de peso y con ronda propia de kiwi cuando se retomen: `removal="undo"` (la huella con «Deshacer» de A, con L1, L2 y L11) y `editor="lens"` (la lente de B, con L6 y `GTable` C · Lente, #601); `counts` suelto (las cuentas van en cada faceta); `filters`/`sort`/`page` sueltos (todo es `query`); `fetch`, `endpoint`, `adapter` (#708; los adaptadores `@grana/data` y `@grana/forms` siguen en `PENDIENTES.md`).

### Reglas de props

- **`query` es la única fuente de la consulta.** El block la lee para pintar facetas, frase, búsqueda, orden y página, y emite la siguiente completa (§«Consulta»). Sin `v-model:query`, nada cambia (aviso 2).
- **`rows` sin `rowKey`** en alguna fila: aviso 3 (el foco por clave y la selección dependen de ella).
- **Resto de atributos** (`class`, `style`, `data-*`): a la raíz. `aria-*` no se reenvían a la tabla (su nombre es el `h1`).

## Consulta (kiwi §3.4)

`query = { search: String, filters: Array<{ key, op, value }>, sort: { key, direction } | null, page: Number, pageSize: Number }`. Los filtros tienen la forma de `GFilterBar` (`filter-bar.md`).

- **`update:query(next, { reason })`**, con `reason` ∈ `search` · `phrase` · `facet` · `filters` (la `GFilterBar` de la tabla) · `sort` (frase o encabezado) · `page` · `pageSize` · `relax` · `clear`.
- **Toda consulta nueva vuelve a la página 1**, salvo `page` y `pageSize` (que siguen la regla del ancla de `GTable`, #594). El tamaño se conserva.
- **La búsqueda espera 300 ms** (constante de diseño `SEARCH_MS = 300`, no prop ni token) y se emite con `reason: 'search'`; Intro la emite en el acto.
- **Una clave, un filtro:** facetas y huecos con la misma `key` comparten estado (pulsar la faceta «Fermentando» deja el hueco «Estado» en «fermentando», y al revés). Elegir un valor **sustituye** el filtro de esa clave; volver a «cualquiera» o soltar la faceta lo **quita**.
- Una clave en un hueco **y** en una columna con `filter`: aviso 4 (dos controles para lo mismo); manda el hueco.
- **El block no ordena, no filtra, no pagina y no cuenta.** Todo eso es del servidor de la aplicación.

## La frase (#712)

La consulta se dice en **una frase de la aplicación**. El block no concatena fragmentos: la aplicación escribe la frase entera en su idioma, con el orden de palabras, el género y el número que pida, y marca dónde va cada hueco.

- **`phrase`**: plantilla (String) con un `{id}` por hueco, o **función** `(values) => plantilla`, donde `values` es `{ [id]: valor elegido | null }` (`null` = «cualquiera»; en un hueco de orden, el `value` de la opción o `null` si el orden no es ninguna). Con la función, la aplicación **cambia la frase entera** cuando la gramática lo exige (concordancia, preposiciones que dependen del valor, idiomas con otro orden): el block nunca cose trozos.
- **Cada hueco aparece exactamente una vez** en la plantilla vigente. Un `{id}` sin hueco declarado no se pinta (aviso 5); un hueco declarado que no aparece en la plantilla no es alcanzable (aviso 5): su filtro, si está puesto, se sigue aplicando y sale en `GEmpty`, pero la frase **no** lo dice; por eso es aviso.
- **El texto fijo** de la plantilla se pinta como texto (con `dir` del documento). Las llaves se escapan con `{{` y `}}`.
- **Qué dice el hueco:** la `phrase` de la opción elegida (la forma dentro de la frase: «fermentando»), o la de `any` sin filtro; sin `phrase`, su `label`. **El nombre accesible** del botón es `{label del hueco}: {texto visible}` («Estado: en cualquier estado»), con el prefijo como texto oculto accesible dentro del botón (WCAG 2.5.3: el nombre contiene el texto visible; el prefijo da el campo a quien no ve la frase entera).
- **Cambiar un valor** puede cambiar el número de líneas de la frase: es **efecto del gesto** (causa → efecto, en el acto). La frase no cambia de alto al llegar datos (las cuentas no van en la frase).

### Huecos (`blanks`)

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | String | Único; el `{id}` de la plantilla |
| `type` | `filter` (por defecto) · `sort` | `filter`: un filtro de lista de un valor. `sort`: el orden de la consulta |
| `key` | String | Solo `filter`: la clave del filtro (`{ key, op: 'in', value: [valor] }`, la forma `enum` de `GFilterBar`) |
| `label` | String | **Obligatorio.** Nombre del campo: prefijo oculto del botón y nombre del grupo de radios del menú |
| `any` | `{ label, phrase? }` | Solo `filter`, **obligatorio**: la primera opción («Cualquier estado») y lo que dice la frase sin filtro |
| `custom` | `{ phrase }` | Solo `sort`: lo que dice la frase cuando el orden vigente no es ninguna opción (orden por encabezado) |
| `options` | Array | `{ value, label, phrase?, sort? }`. `label`: el radio del menú. `phrase`: la forma dentro de la frase. `sort` (solo en `sort`): `{ key, direction }` que aplica |

- **Cada hueco es un `GMenu`** cuyo disparador es el botón del hueco (slot `trigger` con sus `attrs`; `id` propio, #308) y cuyos elementos son un `group` con el `label` del hueco y `radio` por opción (`checked` según la consulta); la opción «cualquiera» va primero. `closeOnSelect="always"`: elegir es una decisión, cierra y devuelve el foco al hueco (que ya dice el valor nuevo).
- **Buscar al escribir (#725):** los menús de los huecos filtran al escribir con la regla común (`api.md`) si llegan sus textos por `labels.menu` (`findHint`, `matches`, `matchesOne`, `none`); útil con listas largas (agaves, maestros). Sin ellos, saltan por letra.
- **Solo listas de un valor.** Rangos, fechas y varios valores **no** van en la frase: se declaran como `filter` en las columnas y los pinta la `GFilterBar` de la tabla (kiwi §6, riesgo). `multiple` en un hueco queda **reservado**.
- **En estrecho**, las facetas no fijadas se pliegan **dentro del hueco de su clave** (§«Facetas»): cada radio lleva su cuenta en el `label` (`labels.facetOption`).

### Huecos: aspecto (para coco)

El hueco **se reconoce como control sin depender del color** (1.4.1, 1.4.11): subrayado de `--g-border-width` en `--g-color-border-control` (≥ 3:1) y el `chevron-down` decorativo; con valor (`is-set`), texto `--g-color-text` con `--g-text-action-weight`; sin valor, `--g-color-text` con el peso del cuerpo (los dos ≥ 4,5:1). Al pasar, fondo `--g-color-neutral-soft` con `--g-radius-sm`; foco con `--g-color-focus`, `--g-focus-width` y `--g-focus-offset` (contorno ≥ 2 px medido por kiwi). Diana ≥ 24 × 24 y ≥ 44 × 44 con `pointer: coarse` (el interlineado de la frase lo acomoda; kiwi midió 40 y 44). Texto de la frase `--g-text-body-*` (no compite con el `h1`).

## Facetas (#713)

Las facetas dicen **cuántos hay** de cada cosa y se pulsan para quedarse con ellas. Son **`GTag` de alternar** (`pressed`, `aria-pressed`; `tag.md`: «un filtro de la vista que actúa en el acto»), sueltas dentro de `div role="group"` con `labels.facets`. **No se reconstruyen** como botones propios (regla de `auditoria-visual.md` §4).

| Campo | Tipo | Uso |
| --- | --- | --- |
| `id` | String | Único |
| `label` | String | **Obligatorio.** Lo que cuenta («Fermentando») |
| `filter` | `{ key, op, value }` | **Obligatorio.** Lo que aplica al pulsar (sustituye el filtro de esa `key`) |
| `count` | Number \| `null` | La cuenta **que da la aplicación**. `null` (cargando o desconocida): la faceta se pinta sin cifra, nunca con «0» |
| `pinned` | Boolean | Se queda a la vista en estrecho (§abajo). Por defecto `false` |
| `icon` | String | Nombre de la lista de la librería en el slot `lead` de `GTag` (decorativo; p. ej. `triangle-alert` para «Requieren atención»: la forma, no el color) |

- **Las cuentas son de la aplicación y honestas:** cada una se calcula **sin su propio filtro** (receta del `summary`, `table.md`, #601): con «Fermentando» pulsada, «Listas» sigue diciendo cuántas listas hay en el resto de la consulta. El block **no cuenta** ni recalcula; pinta lo que llega.
- **Pulsada** = la consulta contiene un filtro igual a `filter` (misma `key`, `op` y `value`). Pulsar una pulsada la suelta (quita ese filtro). Dos facetas con la misma `key` son **excluyentes** entre sí (y con el hueco de esa clave).
- **Texto:** `labels.facet({ label, count })` compone lo visible y el nombre («8 · Requieren atención»); sin él, `label` y aviso 6. La cifra va **en el cuerpo de la etiqueta** con cifras tabulares: misma familia y tamaño que el resto (`GTag`), así que **no compite con el `h1`** (kiwi §1.2, «jerarquía»).
- **Neutras** (`GTag` nunca es semántico, #461): la atención se dice con el texto y el icono, no con un color de aviso.
- **Sin anuncio propio:** el recuento que importa lo anuncia la tabla al llegar los datos (#569); la faceta solo cambia `aria-pressed`. Las cuentas que cambian no se anuncian (receta del `summary`).
- **Mientras carga** las facetas siguen operables (como la barra de `GTable`) y conservan las cuentas que había.

### Facetas en estrecho (#714)

En estrecho (`is-narrow`, §«Responsive») las facetas **no ocupan más de una fila**:

1. Las fijadas (`pinned`) se quedan a la vista, en el orden de `facets`.
2. Las demás **se pliegan en el hueco de su `key`**: sus cuentas pasan a los radios de ese hueco (`labels.facetOption({ label, count })` → «Fermentando · 21»). Nada se pierde: la cuenta sigue a un toque y en el mismo sitio que su valor.
3. Una faceta no fijada **sin hueco de su clave** se queda a la vista (no hay dónde plegarla). Si con ellas las facetas pasan de una fila a 360 px, aviso 7 (fijar menos o declarar el hueco).

## Permisos (#711; regla 1 de «Acciones con acuse», #643)

**Datos, no slots ni adaptador** (responde a la pregunta de Notion). `actions = { create, edit, duplicate, remove }`; cada valor:

| Valor | Efecto |
| --- | --- |
| ausente o `true` | Disponible |
| `false` | Oculta (no se pinta ni se anuncia) |
| String | Visible con **`aria-disabled="true"`** y **ese motivo legible**; nunca `disabled` nativo (se encuentra y se lee) |
| `(row) => true \| false \| String` | Por fila (`edit`, `duplicate`, `remove`); `create` no recibe fila |

- **`create`** con motivo: el `GBtn` de crear queda `aria-disabled` con el motivo como `detail` de su `GTooltip` (#643 regla 1); no emite `create`.
- **Por fila** (`edit`, `duplicate`, `remove`): elementos del menú de la fila con `disabled` = el motivo (enmienda de `GMenu`, #718): siguen enfocables, no se activan y el motivo es su descripción visible.
- **Masivas:** con `remove` por fila, la barra cuenta las que **sí** se pueden dar de baja (§«Selección»).
- Un valor de otro tipo: se trata como `false` y aviso 8.

## Acciones de la fila (#718)

Una sola parada por fila: **`GMenu`** en el slot `row-actions` de `GTable`, disparador `GBtn icon` (`ellipsis-vertical`) con nombre `labels.rowActions({ row, title })`. Elementos, en este orden: **Editar** (`pencil`) · **Duplicar** (`copy`) · los de **`rowItems(row)`** de la aplicación · separador · **Dar de baja** (`trash`, `danger`, **`confirm`** = `labels.confirmOne({ row, title })`, `confirmLabel` = `labels.confirmRemove`). Los que tienen `false` no se pintan; sin ninguno, la celda queda vacía (sin menú).

- `title` es el título de la fila según la columna principal (el mismo texto que usa `GTable` para sus nombres).
- **La baja se confirma dentro del menú** (enmienda de `GMenu`, #718: el patrón de `GFab`, #662): la fila «Dar de baja» se parte en «Cancelar» (con el foco) | «Dar de baja», en un grupo cuya pregunta es el nombre. **Nada de la tabla se mueve** (Δ0; corrige kiwi §6, que la confirmaba en la celda y ensanchaba la columna). Confirmar emite `select` → el block emite **`remove`**.
- Un elemento de `rowItems` emite **`row-select`** `{ id, item, row, key, event }`.

## Selección y masivas (#717)

Con `selectable`, `GTable` pinta las casillas (`v-model:selected` pasa por el block).

- **La barra de masivas vive en el `toolbar` de `GTable`** (la barra de la tabla, encima de las filas), **no** en una barra propia: un solo recuento (`labels.table.selectedCount` de `GTable`, ya con `role="status"`) y un solo sitio.
- **Alto constante (Δ0):** el `toolbar` nunca está vacío. **En reposo** lleva el total de la consulta (`span.g-resource-list__total`, `labels.total({ count })` con `total`; texto, sin región viva: la tabla ya anuncia los resultados). **Con algo seleccionado**, en su lugar, el grupo `div.g-resource-list__bulk role="group"` con nombre `labels.selectedCount({ count })`: **Dar de baja** (`GBtn size="sm" variant="outline" color="danger"`, con el recuento de las que se pueden), el slot **`bulk`** de la aplicación y **Quitar selección** (`GBtn size="sm" variant="ghost" color="neutral"`). Seleccionar la primera fila **no mueve las filas** bajo el puntero (rúbrica C). Con `GTable` sin el recuento visible a cero (enmienda #717), no hay «0 seleccionadas».
- **Confirmación en el sitio** (el mismo patrón que la fila, con `GBtn`): «Dar de baja» se parte en «Cancelar» (foco) | «Dar de baja N», dentro de `div.g-resource-list__bulk-confirm role="group"` con nombre `labels.confirmMany({ count, skipped })`. Se deshace con «Cancelar», Esc o el foco que sale del par, sin temporizador (2.2.1); un doble clic nunca ejecuta (#661: el segundo clic cae en «Cancelar»). La barra no cambia de alto; lo que sigue al par en la misma línea puede correrse en línea, nunca en bloque. Sin `labels.cancel`, «Dar de baja» masivo queda `aria-disabled` (fallo seguro, como #662) y aviso 9.
- **Con permisos por fila**, la cuenta y el evento usan solo las que se pueden; `skipped` dice cuántas no («2 no se pueden dar de baja»). Si ninguna se puede, el botón queda `aria-disabled` con `labels.noneRemovable`.
- **Lo seleccionado es lo visible:** cambiar la consulta (salvo `page` y `pageSize`) **vacía la selección** (`update:selected([])`): una baja masiva nunca alcanza filas que la persona ya no ve en la consulta. Entre páginas la selección se conserva (comportamiento de `GTable`) y el block recuerda cada fila elegida por su clave, para el permiso y el evento.
- **En estrecho** (tarjetas), la barra no puede cambiar de número de líneas entre reposo y selección (medido a 360 px); si lo hiciera, «Dar de baja» y «Quitar selección» pasan a solo icono (`trash`, `x`) con nombre y `tooltip`.
- `selectable` sin `remove` disponible ni slot `bulk`: aviso 10 (la selección no sirve para nada).

## Editor (#711)

**Un sitio:** `GDialog` hermano del cuerpo, `placement="end"` (hoja lateral, C) o, con `editor="dialog"`, centrado; `mobile="sheet"` en los dos; `size="md"`; `closeLabel` = `labels.close`; título `labels.editorCreate` · `labels.editorEdit({ row, title })` · `labels.editorDuplicate({ row, title })`. Responde a la pregunta de Notion: el sitio lo da la forma (C: la hoja), con una salida explícita para formularios que deban aislarse.

- **Abrir:** `create`, `edit` y `duplicate` se emiten **síncronos en el gesto** con `preventDefault()`: si la aplicación lo llama (p. ej. va a una ruta), el editor no se abre. Si no, se abre con `from` = el disparador (#583; el botón de crear o el disparador del menú de la fila, que `GMenu` ya enfocó al cerrar).
- **Slot `form`** con `{ mode: 'create' | 'edit' | 'duplicate', item, key, close, cancel }`: la aplicación pinta su `GForm`, valida y guarda; el block **no ve el modelo**. `GDialog` aísla el formulario (`provide(formKey, null)`, #566). El foco inicial es el de `GDialog` (#292: `[autofocus]` → primer control → cierre).
- **`close({ saved, key })`** cierra tras guardar; **`cancel()`** cierra sin guardar (igual que Esc y el botón de cierre). Sin slot `form`, al ir a abrir: aviso 11 y no se abre.
- **Lo que no guarda el borrador** (descartar cambios al cerrar) es de la aplicación y de `GForm` Fase 4 (`guard`, `PENDIENTES.md` §2).

## Foco (#719)

El foco **nunca cae en `body`** y vuelve a donde la persona estaba o a lo más cercano. El block usa la vía pública de `GTable` (enmienda #719: `focusRow(key, { part })` y `focus()`), que **espera a que termine la fase de carga** (#540) antes de buscar la fila.

| Después de | El foco va a |
| --- | --- |
| Cancelar o cerrar el editor | `from` (#583). Si `from` ya no está (la fila se volvió a pintar) o está inerte, `focusRow(key, { part: 'actions' })` |
| Guardar una edición (`close({ saved: true })`) | `focusRow(key, { part: 'actions' })`; si la fila ya no está en la página (dejó de cumplir la consulta), `focus()` de la tabla |
| Guardar una creación (`close({ saved: true, key })`) | `focusRow(key, { part: 'actions' })` si la fila nueva está en la página; si no, `from` (el botón de crear) |
| Confirmar una baja de fila | Se queda en el disparador del menú de esa fila hasta que la fila **deja de estar en `rows`**; entonces, si el foco seguía en ella o cayó en `body`, la **siguiente** fila (o la anterior si era la última; o `focus()` de la tabla si no queda ninguna) con `focusRow(…, { part: 'actions' })`. Si la fila sigue (la baja falló), el foco no se mueve |
| Confirmar una baja masiva | La selección se vacía y la barra vuelve al total: `focus()` de la tabla (nombrada por el `h1`) |
| Elegir en un hueco o pulsar una faceta | Se queda en el hueco o la faceta (el menú devuelve el foco a su disparador) |
| «Quitar «…»» o «Quitar todos» del vacío | La tabla lo recoge (`GTable`, #534 y su `clear`) |

## Anuncios (#720)

**El block no tiene región viva** ni crea ninguna (dos canales corteses en una página se pisan). Lo que se oye es de los componentes o de la aplicación:

- Recuento, carga, fallo y rango: la región de `GTable` (#265, #540, #569, #596).
- Recuento de seleccionadas: el `role="status"` de `GTable`.
- Elegir en un hueco: `aria-checked` del radio y el nombre nuevo del hueco; el recuento lo dice la tabla al llegar.
- **Resultado de crear, guardar y dar de baja:** la **aplicación**, con `GToast` (con «Deshacer» si puede restaurar; kiwi §3.12). El block no dice «guardado».
- L8 (canal cortés público) **no es necesario para C**; si un block futuro tiene algo propio que anunciar, la vía es una exportación pública de `@grana/vue` (nombre reservado: `announce`), nunca una región propia.

## Estados (kiwi §3.6; regla obligatoria de `auditoria-visual.md`)

| Estado | Qué se ve | De quién |
| --- | --- | --- |
| Primera carga | Encabezado, consulta (facetas sin cifra si `count` es `null`) y esqueleto de la tabla tras 200 ms | `GTable` (#540) |
| Refresco | Lo que había, inerte hasta 200 ms; luego esqueleto; mínimo 400 ms; aviso a los 5 s | `GTable` |
| Error con filas | Filas a la vista + barra «No se pudo…» con «Reintentar» → `retry` | `GTable` |
| Error sin filas | `GEmpty cause="error"` con «Reintentar» → `retry` | `GTable` |
| **Vacío inicial** (sin consulta y `total` 0, sin cargar) | `GEmpty cause="none"` con `labels.empty`; acción **crear** como `outline` (la sólida sigue en el encabezado; una sola principal, kiwi §3.7) si `create` está disponible. **La región de consulta no se pinta** (no hay nada que buscar) y vuelve con el primer registro | block + `GEmpty` en el slot `empty` de `GTable` |
| **Vacío de la consulta** | `GEmpty cause="filtered"` con `labels.emptyFiltered`, la salida con un botón por filtro que devuelve algo (`returns`; búsqueda incluida como filtro con `labels.searchFilter({ text })`) y «Quitar todos» → `update:query` con `reason` `relax`/`clear` | block + `GEmpty` |
| **Sin acceso** | `GEmpty cause="forbidden"` (`labels.forbidden`) **en lugar** de consulta y tabla; sin crear | block + `GEmpty` |
| No disponible | `aria-disabled` con el motivo (§«Permisos») | block, `GMenu`, `GBtn` |
| Hover, foco, pulsado | De cada componente; huecos y facetas según §«Huecos: aspecto» y `GTag` | coco |

Sin `returns`, `GEmpty` solo ofrece «Quitar todos» (`empty.md` «La salida»). Causas distintas, textos distintos (Notion).

## Responsive (#714, #715, #716)

- **Estrecho = ancho de la raíz del block < `space × 150`**, el mismo umbral que `GPageHeader` (constante pública por #715). El block mide su raíz con `ResizeObserver` (no consultas de contenedor: su raíz es el contenedor del encabezado, regla 7 de «Pegado») y **estima antes del primer pintado** con el ancho del visor (en el servidor, ancho), para que sus hijos no midan dos veces (kiwi §14, aviso de bucle en WebKit). Clase `is-narrow` en la raíz.
- **Inset:** el cuerpo usa el inset en línea de `GPageHeader` (`space × 6`; `space × 4` en estrecho, #715): `h1`, facetas, frase y tabla empiezan en el mismo borde (Δ0, kiwi §8).
- **Jerarquía en el teléfono (#714):** como nada del block va en el encabezado, la acción principal queda a la distancia que tiene `GPageHeader` solo (la del zócalo), igual en escritorio y en el teléfono. Medido por kiwi en C: 288 px en el teléfono con las facetas en el encabezado; con esta regla, **igual que en la base** (criterio de hecho: Δ ≤ 1 px frente a la base).
- **Acción principal sin pestañas (#715, L9b):** la resuelve la enmienda de `GPageHeader`: sin `tabs`, las acciones empiezan al principio del zócalo, alineadas con el `h1`, y no flotan al final de una fila vacía.
- **Pie en estrecho (#716):** en estrecho el block **no pasa `pageSizes`** a `GTable`: sin selector, el pie **no se acopla** (`table.md` «Pie acoplado») y la paginación va al final de la lista, en su sitio. Razones: (1) el pie acoplado de dos filas roba ≈ 100 px fijos (#595, kiwi §8); (2) **el muelle de `GPageHeader` ocupa el mismo borde inferior** en estrecho y pegado, y el pie de la tabla no es cliente de `edgeReserve`: se taparían (2.4.11); (3) lo pegado del block no puede pasar del cuarto del visor (regla del cuarto). El tamaño elegido en `query.pageSize` **se conserva** (la tabla pagina con él). Fuera de estrecho, `pageSizes` y el pie acoplado como en `GTable`.
- **Tarjetas:** `GTable` pasa a tarjetas por su propia medida. **Editor:** hoja (`mobile="sheet"`). **Crear:** solo icono con nombre y `tooltip` cuando `narrow && !docked` (receta del slot `actions` de `GPageHeader`; el mismo `GBtn`, cambiando props, nunca `v-if` entre dos). **Sin desplazamiento horizontal** a 360 y 390 px.

## Personalidad (#710; regla de `CLAUDE.md`)

**Qué lo hace distinto.** La pantalla **dice en una frase qué está viendo** y cada palabra se cambia donde está: nadie traduce chips a una pregunta. Las facetas **no mienten** (cada cuenta sin su propio filtro) y, en el teléfono, se pliegan en la palabra de su frase en vez de amontonarse. Y la pantalla **no empieza por 46 filas iguales**: empieza por las 8 que piden atención (el orden «lo que pide atención primero» es la primera opción del hueco de orden y la consulta inicial de la receta; `rowStatus` marca por qué). Retirar se confirma **donde se pidió**, sin capa y sin mover la tabla.

### Movimiento (rúbrica `docs/documentacion/rubrica-movimiento.md`)

El block casi no añade movimiento propio: menús, hoja lateral y carga son de `GMenu`, `GDialog` y `GTable`. Lo propio y lo permitido:

| Dimensión | Estado al contratar | Regla | Riesgo |
| --- | --- | --- | --- |
| A. Propósito | Cumple (por contrato) | Único movimiento propio permitido: la palabra nueva del hueco entra con un fundido (`opacity`) de `--g-duration-fast` + `--g-ease-out` (opcional para coco); dice «esto cambió» en la frase. Nada se anima al llegar datos (cuentas y filas son de la tabla) | Bajo |
| B. Profundidad | N/A | Sin profundidad propia (la hoja es `GDialog`) | — |
| C. Estabilidad | Cumple (por contrato; lo mide coco) | Δ0 de la tabla al seleccionar, al armar y deshacer la confirmación, al plegar facetas y al llegar cuentas; la frase solo cambia de líneas en el gesto; cifras tabulares en facetas | Medio: la frase reflota al cambiar una palabra |
| D. Transiciones | No verificable | El fundido del hueco es interrumpible (un cambio nuevo parte del estado actual); las de los componentes ya están auditadas | Bajo |
| E. Control | Cumple | Toda baja se cancela (Cancelar, Esc, el foco que sale); Esc cierra menú y hoja (un nivel por gesto, #565) | Bajo |
| F. Accesibilidad | Cumple (por contrato) | Con `prefers-reduced-motion: reduce`, sin fundido (patrón único, `tokens.md` §29) | Bajo |
| G. Rendimiento | No verificable | Sin trabajo por cuadro; el block mide su raíz con un `ResizeObserver` y no vuelve a pintar Vue al desplazar (lección de bd888df: ningún `watch` con getter que devuelva un arreglo nuevo) | Medio con muchas facetas |
| H. Inmersión | N/A | — | — |

## Textos (`labels`, sin valores por defecto)

Cadenas o funciones (las que reciben datos, `({ … }) => string`); las plantillas con `{x}` también valen.

| Clave | Uso | Sin ella |
| --- | --- | --- |
| `actions` | Nombre del grupo de acciones de `GPageHeader` | aviso 4 de `GPageHeader` |
| `create` | Botón de crear | Sin botón de crear y aviso 12 |
| `createFirst` | Acción de crear del vacío inicial | Sin acción en el vacío |
| `edit`, `duplicate`, `remove` | Elementos del menú de la fila | Ese elemento no se pinta y aviso 12 |
| `rowActions({ row, title })` | Nombre del disparador del menú de la fila | aviso 12 |
| `confirmOne({ row, title })`, `confirmRemove` | Pregunta y botón de la baja de una fila | La pregunta cae en `remove`; sin `confirmRemove`, el botón usa `remove` |
| `confirmMany({ count, skipped })` | Pregunta de la baja masiva | aviso 12 |
| `cancel` | «Cancelar» de las dos confirmaciones (también `labels.menu.cancel`) | Las bajas quedan `aria-disabled` (fallo seguro) y avisos 9 |
| `selectedCount({ count })`, `total({ count })`, `clearSelection`, `removeSelected({ count })`, `noneRemovable` | Barra de masivas | aviso 12 |
| `query`, `facets`, `search`, `searchFilter({ text })` | Región de consulta, grupo de facetas, búsqueda y su filtro en el vacío | aviso 12 |
| `facet({ label, count })`, `facetOption({ label, count })` | Texto de una faceta y de un radio con cuenta (estrecho) | `label` sin cuenta; aviso 6 |
| `editorCreate`, `editorEdit({ row, title })`, `editorDuplicate({ row, title })`, `close` | Título y cierre del editor | aviso 12 |
| `empty`, `emptyText`, `emptyFiltered`, `forbidden` (`{ title, description }`) | Los vacíos y sin acceso | aviso 12 |
| `table`, `emptyExit`, `menu` | Objetos que pasan tal cual a `GTable`, a los `labels` de `GEmpty` y a los de cada `GMenu` | Los avisos de cada componente |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:query` | `(query, { reason })` | §«Consulta» |
| `update:selected` | claves | Cambia la selección (también al vaciarla por una consulta nueva) |
| `create` | `{ from, event, preventDefault() }` | Pulsa crear (encabezado o vacío). Síncrono; sin `preventDefault`, abre el editor |
| `edit` | `{ row, key, from, event, preventDefault() }` | «Editar» de la fila |
| `duplicate` | `{ row, key, from, event, preventDefault() }` | «Duplicar» de la fila (el editor se abre con `mode: 'duplicate'` e `item` = la fila; qué se copia lo decide la aplicación) |
| `remove` | `{ rows, keys, source: 'row' \| 'bulk' }` | Tras **confirmar** una baja. La aplicación la ejecuta, avisa con `GToast` y vuelve a consultar |
| `row-select` | `{ id, item, row, key, event }` | Un elemento de `rowItems` |
| `open` | `{ row, key, href, event }` | La puerta de la fila (`rowHref`), re-emitida de `navigate` de `GTable` con la misma guarda (#505); `event.preventDefault()` para el router |
| `retry` | — | «Reintentar» de `GTable` |

Todos en `emits` (lección de `CLAUDE.md`). Ninguno muta nada dentro del block.

## Slots

| Slot | Alcance | Qué |
| --- | --- | --- |
| `form` | `{ mode, item, key, close, cancel }` | El formulario del editor (§«Editor») |
| `actions` | `{ narrow, docked }` | Acciones secundarias de la página, **antes** de crear (pasa al de `GPageHeader`) |
| `trail` | — | `GBreadcrumbs` (pasa a `GPageHeader`) |
| `meta` | — | Estado de la página (pasa a `GPageHeader`). **No** facetas ni métricas que empujen el zócalo (#714) |
| `cell-{key}`, `leading-{key}` | los de `GTable` | Celdas ricas (pasan a `GTable`) |
| `bulk` | `{ rows, keys, clear }` | Masivas de la aplicación en la barra de selección (`GBtn size="sm"`, nunca `solid` de marca) |
| `empty` | `{ cause, clear, relax }` | Sustituye los vacíos del block (recomendado `GEmpty`) |
| `error` | `{ retry }` | Pasa al de `GTable` |

**No hay** slot por defecto ni `summary` (las facetas son datos, §«Facetas»), `lens` (B) ni `row-actions` (el menú lo arma el block con `actions` y `rowItems`).

## Estructura accesible

- **Un `h1`** (el de `GPageHeader`) y la tabla nombrada por él (`aria-labelledby`); sin `caption` repetido (kiwi §3.2).
- **Una región `search`** con `labels.query`, antes de los datos, con todo lo que cambia la consulta (facetas, frase, búsqueda). La `GFilterBar` de la tabla, si existe, sigue dentro de `GTable` (es de la tabla).
- **Facetas:** `role="group"` con `labels.facets`; cada `GTag` con `aria-pressed`.
- **Frase:** un `<p>`; cada hueco un `button` con `aria-haspopup="menu"`/`aria-expanded` (los de `GMenu`) y el nombre `{campo}: {valor}`; su menú, un grupo de radios con el nombre del campo.
- **Masivas:** `role="group"` con el recuento; la confirmación, `role="group"` con la pregunta.
- **Editor:** `GDialog` modal con su título (WCAG 2.4.3; el resto inerte).
- Sin `role="grid"`, sin `aria-selected` en filas, sin regiones vivas propias.

## Teclado

| Tecla | Dónde | Acción |
| --- | --- | --- |
| Tab / Shift+Tab | Toda la pantalla | Orden del DOM (§«Anatomía») |
| Intro / Espacio | Faceta, hueco, botones | Alterna, abre el menú, activa (nativo) |
| ↑ ↓ Inicio Fin, letra | Menú de un hueco o de la fila | `GMenu` |
| ← → ↑ ↓ | Par de confirmación del menú | Recorren «Cancelar» y la confirmación (#662) |
| Esc | Menú, par armado, hoja, confirmación masiva | Un nivel por gesto (#565): cierra el menú, desarma el par, cierra la hoja, deshace la confirmación |
| Intro | Búsqueda | Emite la búsqueda sin esperar |

Una activación por gesto (#661) en todos los disparadores (lo da `GMenu` con su guarda; el par masivo la aplica el block).

## Tokens consumidos (`tokens.md` §48; ningún token nuevo)

Solo existentes: `--g-space-*` (inset, separaciones), `--g-color-text`, `--g-color-text-muted`, `--g-color-border-control` (subrayado del hueco, ≥ 3:1), `--g-color-neutral-soft` (hueco al pasar), `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-sm`, `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-duration-fast`, `--g-ease-out`. El resto lo traen los componentes que compone. Alias locales de coco (`--_inset`, `--_gap`) derivados de `space`.

## Clases y datos (contrato bruno ↔ coco)

| Clase o dato | Dónde | Cuándo |
| --- | --- | --- |
| `g-resource-list` | Raíz | Siempre |
| `is-narrow` | Raíz | Ancho de la raíz < `space × 150` |
| `g-resource-list__body` | Cuerpo | Siempre |
| `g-resource-list__query` | Región `search` | Sin `forbidden` y sin vacío inicial |
| `g-resource-list__facets` | Grupo de facetas | Con alguna faceta a la vista |
| `g-resource-list__phrase` | `<p>` | Con `phrase` |
| `g-resource-list__blank`, `is-set` | Botón del hueco | `is-set`: tiene valor (en `sort`, siempre) |
| `g-resource-list__blank-field` | Prefijo oculto del hueco | Siempre (patrón de texto oculto accesible) |
| `g-resource-list__blank-text`, `g-resource-list__blank-chev` | Valor y `chevron-down` | Siempre |
| `g-resource-list__search` | `GInput` | Con `searchable` |
| `g-resource-list__total` | `toolbar` de `GTable` | Sin selección |
| `g-resource-list__bulk`, `g-resource-list__bulk-confirm`, `is-armed` | `toolbar` de `GTable` | Con selección; armada |
| `g-resource-list__editor` | `GDialog` | Siempre que haya editor |

**CSS:** `packages/blocks/src/blocks/GResourceList/GResourceList.css` (coco), importado desde `packages/blocks/src/components.css`, en **`@layer grana.blocks`** con la declaración de orden `@layer grana.defaults, grana.components, grana.blocks;` al principio de `blocks.css` (#721). Solo `var(--g-*)` y alias `var(--_*)`, sin respaldos ni literales (salvo `24px`, `44px` y el patrón de texto oculto). Los selectores sobre hijos de la aplicación excluyen `.g-tooltip` (#383). El block **no** estiliza piezas internas de los componentes que compone (`.g-table__*`, `.g-menu__*`, `.g-tag__*`…): si algo no encaja, es una enmienda de ese componente.

## Avisos de desarrollo (`[Grana GResourceList]`, una vez por instancia y motivo)

Con la guarda canónica de #653 en el sitio de cada texto (`api.md` «Avisos de desarrollo»).

1. Falta `title`.
2. Sin escucha de `update:query` (la consulta no cambiará).
3. Una fila sin el campo `rowKey`.
4. Una `key` en un hueco y en una columna con `filter`.
5. Un `{id}` de la plantilla sin hueco; un hueco que no aparece en la plantilla vigente; un hueco repetido; un hueco `filter` sin `key` o sin `any`; un hueco sin `label`.
6. Faceta sin `label` o sin `filter`; facetas sin `labels.facet`.
7. En estrecho, las facetas a la vista pasan de una fila.
8. Un valor de `actions` de otro tipo (se trata como `false`).
9. Baja disponible sin `labels.cancel` (queda `aria-disabled`).
10. `selectable` sin `remove` disponible ni slot `bulk`.
11. El editor iba a abrirse sin slot `form` (no se abre).
12. Falta un texto que el estado actual necesita (`create`, `rowActions`, `query`… según §«Textos»).

## Accesibilidad y mínimos (no son tema)

| Criterio | Cómo se cumple |
| --- | --- |
| 1.3.1 / 1.3.2 | Un `h1`; región `search`; grupos con nombre; orden del DOM = lectura = Tab |
| 1.4.1 / 1.4.11 | Hueco con subrayado ≥ 3:1 y chevron; faceta pulsada con `check` de `GTag` y `aria-pressed`; atención con icono y texto, no color |
| 1.4.3 | Texto añadido por el block ≥ 4,5:1 (kiwi midió 7,46 a 17,4) |
| 1.4.10 | Sin desplazamiento horizontal a 360/390 px; facetas en una fila en estrecho; pie no acoplado en estrecho; regla del cuarto |
| 2.1.1 / 2.4.3 / 2.4.7 | Todo con teclado; foco de ida y vuelta (§«Foco»); nunca en `body` |
| 2.2.1 | Confirmaciones sin temporizador |
| 2.4.11 | Nada pegado del block tapa el foco (sin pie acoplado bajo el muelle) |
| 2.5.3 | Nombre del hueco contiene su texto visible |
| 2.5.8 | ≥ 24 × 24; ≥ 44 × 44 con `pointer: coarse` |
| 3.2.2 | Cambiar un hueco o una faceta cambia la consulta (es su propósito, anunciado por la tabla), no el contexto |
| 3.3.4 | Toda baja se confirma (o la aplicación ofrece «Deshacer») |
| 4.1.3 | Recuento y carga por `GTable`; resultados por `GToast` de la aplicación |

## Enmiendas de `@grana/vue` que C necesita (cambian la v1)

Resolución de los huecos L1–L11 de kiwi (`declaracion.md` §13). `@grana/blocks` no puede usar `__shared` (otro paquete): todo lo que falta se pide como **API pública** del componente.

| # | Hueco | ¿C lo necesita? | Resolución | Dónde | Peso |
| --- | --- | --- | --- | --- | --- |
| L1 | Fila retirada (huella) en `GTable` | **No** (es de A) | Reservado con A (`removal`) | — | 0 |
| L2 | Marca pública «nueva / recién editada» | **No** (C devuelve el foco a la fila y avisa la aplicación) | Reservado (`reveal(key)`) | — | 0 |
| L3 | Enfocar una fila por clave | **Sí** (foco tras guardar y tras la baja) | **`focusRow(key, { part })` y `focus()`** públicos (#719) | `table.md` «Métodos» | en el lote (#721) |
| L4 | «Lo que llegó ya está pintado» | **Sí**, fundido en L3 | `focusRow` **espera** a que acabe la fase de #540 (devuelve `Promise<boolean>`); sin evento nuevo | `table.md` «Métodos» | en L3 |
| L5 | `GMenu`: motivo de no disponible y confirmación en el sitio | **Sí** (permisos por fila y la baja sin mover la tabla) | `disabled: Boolean \| String` con motivo visible; `danger` + `confirm`/`confirmLabel` + `labels.cancel` con el patrón de `GFab` (#662), **opcional** (sin `confirm`, como hoy) (#718) | `menu.md` «Motivo y confirmación en el sitio» | en el lote |
| L6 | `GTable` C · Lente (`current`) | **No** (es de B) | Sigue reservado (#601) | — | 0 |
| L7 | «0 seleccionadas» siempre visible | **Sí** (la barra de masivas) | Con 0, el recuento sigue montado (`role="status"`) pero **vacío y oculto**; sin cambio de orden ni de API (#717) | `table.md` «Recuento de selección a cero» | en el lote |
| L8 | Anuncios desde `@grana/blocks` | **No** (C no anuncia nada propio, #720) | Nombre reservado `announce` en `@grana/vue` | `api.md` «Grana Blocks» | 0 |
| L9 | `GPageHeader` en una lista: inset privado y acción que flota sin pestañas | **Sí** | (a) inset en línea **de contrato**; (b) sin `tabs`, acciones al principio del zócalo; (c) sin `tabs` y en estrecho, sin zócalo pegado vacío (#715) | `page-header.md` «Pantallas de lista» | CSS + ≤ 150 B en `page-header.js` |
| L10 | Salida de `GEmpty` con cuentas | **Sí**, sin enmienda | Prop `returns` del block | este contrato | 0 |
| L11 | Fila borrador para crear en su sitio | **No** (es de A) | Reservado con A | — | 0 |

**Peso de las enmiendas (#721; `api.md` «Paquete, entradas y tipos», #506 y #550):** son ampliaciones de componentes que **ya están** en el principal (`GTable`, `GMenu`), no componentes nuevos: no abren entrada propia y llevan **presupuesto de lote: ≤ +1,5 KiB (1 536 B) gzip** de `dist/grana.js` sobre el `main` previo (estimación de lima: `focusRow`/`focus` ≈ 350 B, recuento a cero ≈ 50 B, motivo de `GMenu` ≈ 150 B, confirmación de `GMenu` ≈ 900 B). La enmienda de `GPageHeader` es CSS en `grana.css` y ≤ 150 B en `dist/page-header.js`. Las guardas de los avisos nuevos cuentan dentro (#653 punto 5). bruno mide antes y después y lo registra en `CHANGELOG.md`; **con más, vuelve a lima y no se sube el tope**: la salida es decisión del usuario (p. ej. la confirmación de `GMenu` como carga diferida).

## Paquete y peso del block (#721)

- **`@grana/blocks`** exporta `GResourceList` desde `src/index.js` (sin efectos en el nivel superior, #444) y un plugin opcional que lo registra. Importa **solo** las entradas públicas: `@grana/vue` (`GTable`, `GMenu`, `GDialog`, `GEmpty`, `GInput`, `GBtn`, `GIcon`), `@grana/vue/page-header` (`GPageHeader`) y `@grana/vue/tag` (`GTag`). Todas son *peer*: la aplicación que usa el block carga esas entradas (lo dice el README).
- **Archivos:** `packages/blocks/src/blocks/GResourceList/` con `GResourceList.vue`, `.test.js`, `.meta.json` (bruno), `.css` (coco) y `README.md` (mora-docs).
- **Tipos:** el `meta.json` es contrato de tipos también en `@grana/blocks` (#443 extendido): `scripts/build-types.mjs` del paquete genera `dist/blocks.d.ts` desde él, con props, eventos, slots y métodos.
- **Tope inicial: `dist/blocks.js` ≤ 8 KiB (8 192 B) gzip** con `GResourceList` (estimación de lima ≈ 6 KiB: frase, facetas, selección, editor, foco y avisos). bruno lo mide y lo anota en el `meta.json` (`bundle.cap`); superarlo vuelve a lima, que no sube el tope sin valorar recortes (#706: con más, decide el usuario).
- **Compuertas** (bruno, en el script del paquete o en `gates.sh`): `grep -q "g-resource-list__phrase" packages/blocks/dist/blocks.css`; `! grep -q "__shared" packages/blocks/dist/blocks.js`; `! grep -q "createApp" packages/blocks/dist/blocks.js`; ningún literal de `@grana/vue` empaquetado (`! grep -q "g-table__door" packages/blocks/dist/blocks.js`).
- **Iconos:** solo de la lista de la librería por `GIcon` (`ellipsis-vertical`, `pencil`, `copy`, `trash`, `chevron-down`, `x`, `triangle-alert` en la receta); ninguno nuevo.

## Verificación (cómo se da por hecho)

### bruno (Vitest + jsdom, `packages/blocks`)

`GResourceList.test.js`: plantilla y huecos (función de `values`, `{{`/`}}`, cada aviso 5), nombre del hueco, radios con `checked` y «cualquiera» primero, una clave = un filtro entre faceta y hueco, `update:query` con cada `reason` y vuelta a la página 1, `SEARCH_MS` con temporizadores falsos, facetas pulsadas por igualdad de filtro y plegado en estrecho (radios con cuenta), permisos (`false`, motivo, función por fila), menú de la fila en su orden, `remove` solo tras confirmar, barra de masivas (total en reposo, grupo con selección, `skipped`, `noneRemovable`, selección vaciada al cambiar la consulta y conservada al paginar), editor (`preventDefault`, `mode`, `close`/`cancel`), foco (llamadas a `focusRow`/`focus` según §«Foco», con `GTable` real), estados (vacío inicial sin región de consulta, filtrado con `returns`, sin acceso), `pageSizes` ausente en estrecho, los doce avisos y sin efectos al importar ni en el servidor. En `@grana/vue`: las pruebas de las enmiendas (`GTable.test.js`, `GMenu.test.js`, `GPageHeader.test.js`).

### Playwright (`design/lab/theme-playground/`, **puerto propio**, p. ej. 4212; `design/lab/resource-list/r01/verificar.mjs` parte C como base)

`tests/resource-list.spec.mjs` y `tests/personalidad-resource-list.spec.mjs` en Chromium, Firefox y WebKit, con los componentes reales: un `h1` y la tabla nombrada por él; una región `search`; frase con radios por teclado y puntero; facetas honestas; plegado a 390 px con `pointer: coarse` (una fila, cuentas en los radios); **distancia descripción → acción principal igual que la base** (Δ ≤ 1 px) en escritorio y teléfono, también **sin pestañas**; `h1`, frase y tabla al mismo borde (Δ0); una sola principal sólida; baja de fila confirmada en el menú con la tabla quieta (Δ0) y foco en la siguiente al irse la fila; masivas con la barra de alto constante (Δ0 al seleccionar la primera) y foco en la tabla; editor en hoja lateral con foco al primer campo y vuelta al disparador; sin pie acoplado en estrecho y muelle de `GPageHeader` sin solapes; vacío inicial, filtrado con su salida, error con y sin filas, sin acceso; sin desplazamiento horizontal a 360 y 390 px; movimiento reducido; RTL; consola limpia. `GEmpty`, `GTable`, `GMenu`, `GDialog`, `GTag` y `GPageHeader` **reales** del `dist/`.

### coco (Opus) · CSS y auditoría

`GResourceList.css` en `@layer grana.blocks`; los cambios de `GPageHeader.css` (#715), `GTable.css` (#717) y `GMenu.css` (#718); **auditoría posterior obligatoria** (`auditoria-visual.md` §3) del block construido con los **nueve aspectos** medidos —estructura, jerarquía (una principal, distancia a la descripción), contraste y delimitación (huecos ≥ 3:1, facetas, barra), espaciado e inset, controles (frase, facetas, búsqueda, menú, masivas), tablas y listas, formularios en la hoja, estados (los siete de §«Estados» más hover, foco y no disponible), consistencia (solo tokens y componentes existentes)— más la **rúbrica de movimiento** completa (A a H con estado, evidencia, riesgo y recomendación; «No verificable» en vez de suponer), tema oscuro y los temas del banco, `forced-colors`, RTL, zoom 200–400 %; verificación propia en `design/lab/resource-list/`. Cierra con «Cumplimientos / Correcciones / Pendientes».

### No verificado (entorno real)

Lector de pantalla real (VoiceOver, NVDA) con la frase en modo exploración y los huecos en modo foco; táctil real; la frase en idiomas de otro orden (lo cubre la plantilla por diseño, sin probar con una aplicación real); rendimiento con muchas facetas.

## Encargos

- **coco (Opus):** `GResourceList.css` (inset, región de consulta, facetas en una fila en estrecho, frase y huecos, total y barra de masivas de alto constante, confirmación masiva, editor si algo le toca), `components.css` del paquete con la declaración de capas; `GPageHeader.css` (#715 b: `:not(.has-tabs)` sin `margin-inline-start: auto`, alineado con el `hN`), `GTable.css` (#717: recuento vacío oculto con el patrón de texto oculto), `GMenu.css` (#718: motivo y par de confirmación con la geometría de `GFab`); banco y `design/lab/resource-list/estilo.md`; después, la auditoría.
- **bruno (Opus):** `GResourceList.vue`, `.test.js`, `.meta.json`, exportación en `packages/blocks/src/index.js`, tipos del paquete, compuertas; `GTable` (`focusRow`, `focus`, recuento a cero) y `GMenu` (`disabled` String, `confirm`, `confirmLabel`, `labels.cancel`) con sus `meta.json` y pruebas; `GPageHeader` (#715 c); specs y una página del playground; medidas de peso (#721).
- **mora-docs (Sonnet):** `GResourceList/README.md` tras la auditoría (la frase en varios idiomas con la función de plantilla, la receta de la consulta inicial por atención, las cuentas sin su propio filtro, `returns`, permisos, el editor y `close`, las entradas *peer* que carga la aplicación); y las secciones nuevas de los README de `GTable`, `GMenu` y `GPageHeader`.

## Dudas para el usuario (resueltas el 2026-10-21)

1. ~~**¿A y B quedan reservados como formas de `GResourceList`** (p. ej. `editor="lens"` para la lente de B y `removal="undo"` para la huella de A, con L1, L2, L6 y L11), **o se descartan?** Hoy no se contratan; sus nombres no se usan para otra cosa.~~ **Reservados (#723):** `removal="undo"` y `editor="lens"`, con ronda propia.
2. ~~**Selector de filas por página en el teléfono** (#716): el block lo quita en estrecho (el pie acoplado chocaba con el muelle y robaba ≈ 100 px). Si el producto lo quiere en el teléfono, la salida es otra forma del pie (ronda de kiwi sobre `GPagination`), no volver a acoplarlo.~~ **Cerrada (#724):** en el teléfono, sin selector, como dice #716.
3. ~~**Buscar al escribir en los menús de los huecos**~~ **Sí (#725)**, en todos los menús de Grana (§«Huecos»).
