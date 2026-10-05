# Contrato · GSummary

**Dueño:** lima · **Estado:** aprobado (concepto **A + el contraste de B**, nombre `GSummary` y adopción inmediata en `GCombobox`: decisiones del usuario del 2026-10-04; el resto deriva de WCAG 2.2, de la base funcional de kiwi y de los contratos vigentes; **una confirmación pendiente, que no bloquea**: «Dudas para el usuario») · **Basado en:** `design/lab/summary/r01/` (kiwi; base funcional: 24 decisiones, L1 a L12, motor `summary.js` + `summary.css`, `verificar.mjs` 4 694 comprobaciones en tres motores) y `design/lab/summary/r02/` (kiwi, commit `c2def2c`; conceptos A, B y C, L13 a L20, 14 112 comprobaciones) · **Decisiones:** DECISIONS.md **#349 a #357** · **Convive con:** `combobox.md` (primer consumidor, #356), `avatar.md` (identidad, #295), `badge.md` (estado), `icons.md` (`GIcon` público, #202), `card.md`, `table.md` (anfitriones), `tokens.md` §34
**Tag:** `g-summary` · **Categoría:** contenido · **Entrada del paquete:** `@grana/vue` (principal, #350)
**Componente complejo** (CLAUDE.md, «Modelos por rol»: compone `GAvatar`, `GBadge` y `GIcon`, y se integra en `GCombobox`): **coco en Opus, bruno en Fable**.

El **resumen de una entidad** (persona, paciente, diagnóstico, cliente, producto): identidad + título + línea secundaria + **datos con prioridad** + estado, que se adapta **al ancho de su propio contenedor y al texto real**. Decide qué se ve y qué calla, nunca desborda y nunca deja al lector de pantalla sin un dato.

No es una tarjeta: no tiene superficie, selección, enlace ni media. Es **contenido** que vive dentro de una opción, un campo, una celda, una tarjeta o un panel.

---

## Principios

- **Sin versiones ni umbrales** (#349, #352). No hay «ficha compacta» y «ficha completa», ni consultas de contenedor, ni anchos en píxeles: la disposición es **intrínseca** y contesta en cada ancho «qué cabe aquí, con este texto», dato a dato.
- **Ceder no es ocultar** (#353). Nada se retira con `display: none` ni `visibility: hidden`: lo que no cabe salta entero a una línea recortada. Deja de verse y **sigue en el árbol de accesibilidad**.
- **El identificador es lo último en ceder** y, en una línea, **gana al título** (#351): entre cuatro «María García López», «Mar… 001000» distingue y «María García Ló…» no.
- **Todo es contenido de frase** (`span`): válido dentro de `option`, `button`, `a` y `td`. Dentro de un anfitrión interactivo no lleva roles ni controles.
- **No formatea ni traduce.** Fechas y cifras llegan como texto ya formateado; no tiene textos propios (#226): no hay `labels`.
- **El alto lo decide el anfitrión** (`layout`, `lines`), que es quien conoce su fila; el ancho lo da el contenedor, nunca el contenido.

## Qué lo hace distinto (identidad, #349; decisión del usuario)

La tarjeta de resumen habitual tiene dos maquetas y un umbral que las cambia, o deja que el texto se parta y crezca. `GSummary` no tiene maquetas: tiene **prioridad**.

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **A · Prioridad líquida** | Siempre es lo mismo: identidad, título y **una corriente de datos** en orden de prioridad, con el identificador anclado al inicio. Al estrechar, la corriente se bebe por el final, dato a dato; antes de soltar el primero **calla los rótulos que se explican solos** («22 años», «Dra. Ruiz»). «+N» dice cuántos no se ven. Al ensanchar, cada dato que vuelve a caber **entra** | Resuelve de raíz el reporte de origen (opciones amontonadas a 240px): a 520px se ven 4 de 4 datos, a 240px 1 de 4, sin desborde y con el mismo alto. Quien redimensiona ve llegar los datos de uno en uno, no una tarjeta que «se rompe» en otra. Y es igual en la opción, el campo, la celda y la tarjeta |
| **El contraste de B** | Entre fichas vecinas **con el mismo título** (homónimos), el valor que es **único** en el grupo **pesa** y el que **comparten** se apaga. Las fichas sin homónimos no llevan marcas | Convierte una lista de resultados en una comparación sin abrir nada: el ojo va a lo que distingue a esta «María García López» de la de al lado |

**Qué se toma de B y qué no** (delimitación de la decisión del usuario; r02, «B» y «Recomendación»):

- **Entra:** la comparación entre homónimos y su pintura (peso para lo único, tono para lo compartido; nunca solo color, WCAG 1.4.1). Vive en la prop `diff` y en la utilidad `summaryDiff` («Contraste entre homónimos»). No necesita casillas para funcionar.
- **No entra:** las **casillas de ancho fijo** (`space × 22`), la **fila de rótulos** que encabeza la lista, los valores **sin rótulo visible**, el paso a dos líneas por debajo de `space × 100` y los pares en dos columnas alineadas entre tarjetas. Cuestan datos por píxel (a 520px, 2 de 4 frente a 4 de 4 de A) y un umbral. Quedan reservadas («Fuera de v0.1»).
- **De C no entra nada:** ni superficie propia, ni píldora con forma, ni viaje entre tramos, ni «+N» como botón que abre la segunda cara.

Semillas descartadas por kiwi, sin reserva de nombres: la **ficha tipográfica** (sin rótulos nunca: una fecha o una cifra sin rótulo es ambigua) y las **dos caras** como concepto propio (en una opción no puede haber un control).

## Frontera

| Necesidad | Usar | Relación |
| --- | --- | --- |
| Contenedor con superficie, selección, enlace, media, acciones | `GCard` (o `GSurface`) | **La ficha va dentro**, en el slot por defecto. No sustituye a `title`/`meta` de `GCard`: una tarjeta de entidad es `GCard` sin `meta` con la ficha dentro, o `GSurface` + ficha |
| Todos los pares clave–valor, siempre visibles | `GDataList` | Intacta. La ficha elige cuáles caben |
| Una cifra protagonista con tendencia | `GMetric` | Intacta |
| Solo la identidad | `GAvatar` | La ficha lo compone; sus tamaños son los de `GAvatar` |
| Título + subtítulo en una celda, sin datos | Columna compuesta de `GTable` | Intacta; la ficha entra por `cell-{key}` |
| Opción, valor y vista previa de `GCombobox` | **`GSummary`** (por dentro, #356) | Primer consumidor |
| Fila rica de `GSelect` y `GMenu`, slot `user` de `GSidebar` | Lo de hoy | Candidatas, cada una con su ronda |

---

## Entrega y empaquetado (#350)

```js
import { GSummary, summaryDiff } from '@grana/vue'   // app.use(Grana) registra <g-summary>
```

- **Va en el paquete principal.** Es una pieza transversal (la usarán `GCard`, `GTable` y los menús) y `GCombobox`, que vive en otra entrada, solo puede recibirla por **`__shared`** (#240), que sale del principal. No tiene motor de datos, capa ni teclado.
- **Compuerta de peso:** el principal crece **≤ 8 KB gzip** (criterio de #328) contando `GSummary`, `summaryDiff` y la utilidad de coincidencias que sube al principal (ver «Coincidencia»). Bruno mide `dist/grana.js` gzip antes y después **en el mismo árbol** y lo anota en `GSummary.meta.json`. Estimación: 3 a 4 KB (el motor de prototipo de kiwi, con los tres conceptos, son 14,6 K de fuente). **Si lo supera, la decisión no cambia** (una entrada propia no puede alimentar a otra entrada): bruno devuelve la cifra a lima y se recorta contrato.
- **`GCombobox` lo recibe por `__shared`** (`src/shared.js`: `components/GSummary/GSummary.vue` y la utilidad de coincidencias), **sin copia**.
- **El CSS va en `grana.css`** (`GSummary.css`, registrado en `components.css`).
- **Compuertas nuevas:** `grep -q "g-summary__more" packages/vue/dist/grana.css`, `grep -q "g-summary__" packages/vue/dist/grana.js` y `! grep -q "g-summary__" packages/vue/dist/combobox.js` (la entrada del combobox no lleva copia). Siguen valiendo las de #337: el código de `GSummary` y `shared.js` **no pueden contener la cadena `GCombobox`**.

---

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `title` | String | texto libre | sin valor | propia (nombre de `GCard`) |
| `subtitle` | String | texto libre | sin valor | propia (nombre de `GCard`) |
| `code` | String | texto corto («E11.9») | sin valor | propia (nombre de la opción de `GCombobox`, #335) |
| `avatar` | Boolean \| Object | `true` u objeto de props de `GAvatar` | `false` | propia (igual que #335) |
| `icon` | String | nombre de Lucide | sin valor | propia («dato → nombre», #202) |
| `facts` | Array | ver «Datos» | `[]` | propia (nombre de #335) |
| `status` | Object | `{ label, color? }` | sin valor | propia |
| `layout` | String | `inline` `row` `stack` | `row` | propia |
| `lines` | Number | `0` o entero ≥ 2 | `2` | propia |
| `size` | String | `xs` `sm` `md` `lg` `xl` | según `layout` (`inline` `xs`, `row` `md`, `stack` `lg`) | compartida (los lados de `GAvatar`, #293) |
| `diff` | Object | `{ [label]: 'same' \| 'diff' }` | sin valor | propia (#354) |
| `highlight` | String | texto buscado | sin valor | propia |
| `group` | Boolean | | `false` | propia |
| `loading` | Boolean | | `false` | compartida |
| `placeholder` | String | texto libre | sin valor | propia |

**No existen:** `label` y `description` (son `title` y `subtitle`; `api.md`: sin sinónimos, y `label` en Grana es el nombre accesible de un control), `labels` (no hay textos propios), `color`, `variant`, `density`, `rounded`, `disabled`, `href`, `selected`, `modelValue` (no es un control ni un contenedor: eso es de `GCard`), `heading`/`headingLevel` (el encabezado es del anfitrión), `locale` (no formatea), `anchor` (el identificador se deriva). Reservados sin implementar (#357): `layout="panel"` y `"auto"`, `align`, `heading`, `expandable`, `surface`. El validador de `layout` rechaza `panel` y `auto`.

### Datos (`facts`)

```js
[
  { label: 'Expediente', short: 'Exp.', value: '001000', priority: 1 },
  { label: 'Edad', value: '22 años', bare: true },
  { label: 'Última visita', value: '03/02/2026' },
  { label: 'Médico', value: 'Dra. Ruiz', bare: true }
]
```

| Campo | Tipo | Qué |
| --- | --- | --- |
| `label` | String (obligatorio) | Rótulo. Es también la **clave** del dato (para `diff`): único dentro de la ficha |
| `value` | String \| Number (obligatorio) | Valor **ya formateado** por la aplicación. Vacío, `null` o `undefined`: el dato se omite sin aviso |
| `short` | String | Rótulo abreviado que se ve **en lugar** de `label` («Exp.»). El lector recibe ese mismo texto (dentro de `option` no cabe un `aria-label`) |
| `priority` | Number | Menor = más importante. Sin ella, después de los que la declaran, en el orden del arreglo. Empates, por orden del arreglo |
| `bare` | Boolean | El valor **se explica solo** («22 años», «Dra. Ruiz»): su rótulo puede callarse a la vista antes de soltar un dato. `false` por defecto: «03/02/2026» sin rótulo es ambiguo |

- **Orden:** el DOM sigue el orden de prioridad; orden visual = orden de lectura (WCAG 1.3.2). El arreglo no se muta.
- **Identificador (#351):** `code` si lo hay; si no, **el dato de mayor prioridad** (`is-anchor`). No hay prop aparte. Con `code`, ningún dato ancla (el código ya identifica y va antes del título).
- **`bare` (nombre decidido aquí; kiwi lo llamó `plain`):** la aplicación marca lo que se entiende sin rótulo. Si marca mal, queda un valor huérfano a la vista; el lector **siempre** recibe el rótulo.
- Campos de más en un dato se ignoran. **Sin slot por dato** en v0.1.

### Reglas de props

- **`title`:** el nombre de la entidad. Sin `title` (y sin `loading`) la ficha está **vacía**: pinta `placeholder` atenuado, o nada con aviso si tampoco lo hay.
- **`subtitle`:** línea secundaria. En `inline` y en `row` con `lines: 2`, **si hay datos solo la recibe el lector** (los datos ganan la línea); sin datos, ocupa esa línea con elipsis. En `row` con `lines` ≥ 3 o `0`, y en `stack`, se ve siempre bajo el título.
- **`avatar`:** `true` = `GAvatar` con `name = title`; objeto = props de `GAvatar` (`src`, `name`, `initials`, `icon`, `color`, `categories`, `colorKey`, `shape`; sin identidad propia, `name = title`). `size` y `label` del objeto se ignoran: el lado es el de la ficha y la identidad es decorativa.
- **`icon`:** `GIcon` público (registro de la aplicación → librería) en el hueco inicial, **si no hay `avatar`**. Precedencia del hueco: slot `lead` › `avatar` › `icon`.
- **`status`:** `GBadge size="sm"` con `color` (los de `api.md`; por defecto `neutral`) y el texto `label`. Para otra cosa, slot `status`.
- **`layout`:** quién decide el alto es el anfitrión («Disposición»). No cambia solo.
- **`lines`:** solo en `row`: **líneas totales** de la ficha (título + lo demás). `2` = título y una línea de datos. `0` = sin límite (la corriente ocupa lo que necesite). `1`, negativos o no enteros: aviso y se usa `2` (una línea es `layout="inline"`). Fuera de `row` se ignora con aviso.
- **`size`:** lado de la identidad (`space × 5/6/8/10/16`) y escala del título («Tipografía»). En `inline` solo fija la identidad: el texto hereda del anfitrión.
- **`diff`:** ver «Contraste entre homónimos». Una clave que no es `same` ni `diff` se ignora con aviso.
- **`highlight`:** ver «Coincidencia».
- **`group`:** para la ficha **suelta** (tarjeta, vista previa, lista propia): `role="group"` con `aria-labelledby` = el título. **Nunca dentro de un anfitrión interactivo** (`option`, `button`, `a`) ni de un contenedor `aria-hidden`.
- **`loading`:** `aria-busy="true"` y formas decorativas del alto del `layout` (Δ0 al llegar los datos). No pinta contenido ni mide. El anuncio es del anfitrión.
- **`placeholder`:** texto atenuado cuando no hay `title` («Sin paciente»). Lo entrega la aplicación.
- **Atributos** (`class`, `style`, `id`, `data-*`, `aria-*`, `lang`, `dir`): a la raíz.

---

## Disposición

| `layout` | Qué es | Alto | Dónde |
| --- | --- | --- | --- |
| **`inline`** | **Una línea**: identidad `xs`, [código] título, identificador y datos que ceden. Estado y línea secundaria (si hay datos), solo para el lector. Tipografía **heredada del anfitrión** | **Δ0**: no cambia el alto de su anfitrión | Dentro de un campo, celda densa, item de menú |
| **`row`** (por defecto) | Cabecera ([código] título · estado) + la corriente de datos, `lines` líneas en total | Con `lines: 2`, **constante en cualquier ancho** (44px en `md`: título 24 + datos 20). Con más líneas, como máximo `lines`, y solo **decrece** al ensanchar | Opción, celda, fila de lista; con `lines` 3 o 4, tarjeta; con `0`, panel |
| **`stack`** | Cabecera + **rejilla de pares** (rótulo sobre valor). **No cede ni recorta**: crece en alto; título y valores saltan de línea. Acción al pie | Variable (lo que pida el contenido) | Vista previa, detalle, tarjeta con alto libre |

- **`stack` no es la identidad: es la vista completa** (base r01, decisión 17). Existe porque la corriente de A es menos escaneable cuando sobra sitio, y porque la ficha recortada **nunca es la única fuente** de un dato: algún anfitrión ofrece la vista entera. **Nunca se elige solo** (no hay `auto` ni umbrales): lo pone el anfitrión.
- **`lines` en `row`:** la primera línea es la cabecera. Con datos y `lines: 2`, la segunda es de los datos (identificador fijo al inicio; el resto salta y se recorta). Con `lines` ≥ 3, la segunda es `subtitle` si existe, y el resto son de datos: identificador y datos **fluyen juntos**, el identificador siempre el primero de la primera línea (`g-summary--multi`). Bruno escribe el número de líneas de datos en **`--_lines`** (variable en línea, excepción de `tokens.md` §29.5) y `g-summary--free` con `lines: 0`.
- **El ancho lo da el contenedor:** la raíz lleva `contain: inline-size` e `inline-size: 100%`. **La ficha no aporta ancho a su anfitrión** (sin esto, en una celda de `GTable` ensancha la tabla: medido por kiwi). Un anfitrión de ancho automático debe darle sitio: `min` en la columna de `GTable`, `min-inline-size` o `flex: 1` en una fila flex. Si tras montar mide 0 de ancho, aviso.
- **Sin acción en `inline` ni `row`:** el anfitrión es lo accionable, y un control recortado seguiría recibiendo foco sin verse.

## Mecanismo de adaptación (#352)

**CSS intrínseco; JS solo cuenta.**

1. **Corriente:** los datos van en una línea flexible con salto (`flex-wrap`) y alto máximo de N líneas (`max-block-size: calc(var(--_lines) * 1lh)` + `overflow: hidden`). El que no cabe **salta entero** a una línea que no se ve. Ningún dato queda partido.
2. **Centinela:** un pseudoelemento de ancho cero **y una línea de alto** al inicio de la corriente; sin él el primer dato nunca salta (con alto cero la línea mide cero: medido en Chromium).
3. **Sin `@container`, sin `@media`, sin píxeles.** Depende del texto real, del idioma y de la fuente del tema.
4. **Lo que mide el `.vue`** (y solo esto), con el observador compartido `utils/sizeObserver.js` (un `ResizeObserver` para todas las fichas; devoluciones en el cuadro siguiente):

| Medida | Resultado | Para qué |
| --- | --- | --- |
| Qué datos quedaron fuera de la caja visible | `data-clipped` en cada uno; su cuenta en «+N» | Decir cuánto calla |
| ¿Hay recorte con todos los rótulos? | `data-terse` en la raíz: se callan los rótulos `bare` (todos a la vez) y se vuelve a contar | A: rótulo antes que dato |
| ¿El identificador ya no cabe entero? | `data-tight` en la raíz: sin «+N» y sin rótulo del identificador | Último tramo de la cesión |
| Qué partes tienen elipsis | `title` nativo con el texto completo, **solo** en esas | Ayuda de puntero |
| Qué datos pasaron de recortados a visibles **por un cambio de tamaño** | `data-enter` en cada uno | Movimiento |

- **Converge en tres pasadas como máximo** (sin marca → `data-terse` → con «+N» → `data-tight`), en el mismo cuadro, leyendo todo antes de escribir. **No hay estado reactivo por dato**: los `data-*`, `hidden` de «+N» y los `title` se escriben en el DOM fuera del render (una clase `is-*` la borraría el siguiente parche de Vue; por eso son atributos, como `data-size` de `GCard`, #130).
- **Cuándo:** al montar (antes del primer pintado si la ficha está a la vista), al cambiar de tamaño, al cambiar las props que afectan al contenido y en `document.fonts.ready`. Bruno **puede aplazar** la medida de las fichas fuera de la vista (`IntersectionObserver`): «+N» es decorativo y llegar tarde no cambia lo que se lee.
- **Sin medida** (SSR, sin `ResizeObserver`, antes de montar): la ficha **ya está bien** (cede y recorta por CSS); faltan «+N», el silencio de rótulos y el estado apretado.
- No se mide con `loading`, ni en `stack` (no recorta).

### Orden de cesión (contrato, no estilo)

Al estrechar, en este orden:

1. Los **rótulos `bare`** dejan de verse (todos a la vez), en cuanto un dato no cabe.
2. Los **datos**, por el final (menor prioridad primero). Aparece «+N».
3. El **estado**, cuando el título ya no conserva su suelo a su lado (salta a una línea recortada de la cabecera). En `inline` nunca se ve.
4. El **título**, con elipsis, hasta su suelo: **7ch** en `row`, **4ch** en `inline`.
5. **«+N»** y el **rótulo del identificador** (`data-tight`).
6. El **valor del identificador**, con elipsis. Es lo último.

- En `inline` todo compite en una línea, y por eso **el identificador gana al título** (pasos 4 a 6). En `row`, cabecera y datos son líneas distintas: ceden en paralelo.
- La **identidad** (hueco inicial) no cede. El **código** no cede.
- Los dos suelos (`7ch`, `4ch`) y el `1lh` son literales de unidad, no medidas de tema (`tokens.md` §34).

---

## Semántica y accesibilidad (#353)

```html
<span class="g-summary g-summary--layout-row g-summary--size-md" style="--_lines: 1" [data-terse] [data-tight]
      [role="group" aria-labelledby="ID-title"] [aria-busy="true"]>
  <span class="g-summary__lead" aria-hidden="true">…slot lead | GAvatar | GIcon…</span>
  <span class="g-summary__body">
    <span class="g-summary__head">
      <span class="g-summary__name">
        <span class="g-summary__code" dir="auto">E11.9</span><span class="g-summary__sep"> </span>
        <span class="g-summary__title" id="ID-title" dir="auto">María <mark class="g-summary__mark">Gar</mark>cía López</span><span class="g-summary__sep">; </span>
      </span>
      <span class="g-summary__status">…GBadge sm | slot status…<span class="g-summary__sep">; </span></span>
    </span>
    <span class="g-summary__subtitle" dir="auto">…</span><span class="g-summary__sep">; </span>
    <span class="g-summary__data">
      <span class="g-summary__flow">
        <span class="g-summary__fact is-anchor [is-diff|is-same]">
          <span class="g-summary__fact-label" dir="auto">Exp.</span> <span class="g-summary__fact-value" dir="auto">001000</span><span class="g-summary__sep">; </span>
        </span>
        <span class="g-summary__facts">
          <span class="g-summary__fact [is-bare] [is-diff|is-same]" [data-clipped] [data-enter]>…</span>
        </span>
      </span>
      <span class="g-summary__more" aria-hidden="true" [hidden]>+2</span>
    </span>
  </span>
  <span class="g-summary__action">…slot action (solo stack)…</span>
</span>
```

- **Todo `span`** (y `mark`): contenido de frase. `GAvatar`, `GBadge` y `GIcon` ya lo son.
- **Dentro de un anfitrión interactivo, sin rol:** el nombre accesible del anfitrión es su texto, que **incluye todos los datos con sus rótulos**, se vean o no.
- **Suelta, con `group`:** `role="group"` + `aria-labelledby` al título (el `id` va en el elemento que solo contiene el texto del título). **No es `article`** ni lleva encabezado: si hace falta uno, lo pone el anfitrión (`GCard` con `headingLevel`).
- **Sin `dl`:** dentro de `option` no es válido, y una sola marca en todos los modos evita dos árboles. Cada dato se lee «rótulo valor».
- **Identidad decorativa** (`aria-hidden`): el título ya nombra. `GAvatar` sin `label`; el hueco adopta su caja (#295: `g-summary__lead:has(> .g-avatar)` sin marco).
- **Lo cedido se sigue leyendo:** datos recortados por `overflow`, rótulos callados, estado y línea secundaria en `inline`, todos están en el árbol. Los que se retiran de la vista sin recorte usan el **patrón de texto oculto accesible**, nunca `display: none`.
- **Separadores para el lector:** cada parte termina con un separador oculto (`g-summary__sep`, «; »; tras el código, un espacio), para que el nombre de una opción no se lea «001000Edad». Es puntuación, no texto de interfaz (como el « · » de la línea secundaria de `GCombobox`). Cada texto oculto queda **contenido en una parte con `position: relative`** (si no, en RTL ensancha el desplazamiento del anfitrión: medido).
- **«+N»** (`g-summary__more`): **decorativa** (`aria-hidden`), porque el lector ya recibe todos los datos. Es texto («+» y la cifra, como «99+» de `GBadge`), no un pictograma. No existe sin recorte (`hidden`) ni en estado apretado.
- **Elipsis:** el texto completo sigue en el DOM. `title` nativo **solo** en la parte cortada, como ayuda de puntero. No llega a teclado ni a táctil: por eso **la ficha recortada nunca es la única fuente de un dato**; el anfitrión ofrece la vista completa (vista previa, detalle, `stack`). Regla para el README.
- **Bidi (kiwi L10):** título, línea secundaria, código, rótulo y valor llevan **`dir="auto"`** (precedente #282), para que «Exp. 001000» dentro de un contenedor RTL no se reordene.
- **Cifras:** `font-variant-numeric: tabular-nums` en toda la ficha.
- **Carga:** `aria-busy="true"`; las formas son `aria-hidden`. **Vacío:** el `placeholder` es texto normal, atenuado.
- **Sin foco propio, sin teclado, sin región viva.** Los controles del slot `action` son de la aplicación.

### Mínimos (no son tema)

| Mínimo | Cómo se cumple |
| --- | --- |
| Texto ≥ 12px | El rol más pequeño es `caption` (rótulos en `stack`, «+N») |
| Contraste ≥ 4.5:1 | `text`, `text-muted` y `text-subtle` lo garantizan sobre `bg`, `surface` y `surface-sunken` (`tokens.md` §2). **Sobre otra superficie** (opción activa invertida, selección) el **anfitrión** reapunta los tonos y lo mide («Para coco») |
| No solo color | Lo único **pesa**; la coincidencia lleva subrayado; el identificador va en negrita |
| Área táctil | La ficha no tiene controles. Los de `action` son de la aplicación (≥ 24px, ≥ 44px con `pointer: coarse`) |
| Reflow 320px, zoom 200 % | Sin desplazamiento horizontal: la ficha nunca aporta ancho |

---

## Contraste entre homónimos (#354)

```js
import { summaryDiff } from '@grana/vue'
const diffs = summaryDiff(visibles)          // [{ Edad: 'same', Expediente: 'diff', … } | null, …]
// <g-summary v-for="(p, i) in visibles" v-bind="p" :diff="diffs[i]" />
```

- **Quién compara es el anfitrión de la lista** (ve a todas); la ficha solo pinta lo que recibe en `diff`.
- **`summaryDiff(list)`** (función pura, sin estado): recibe un arreglo de objetos con `title` y `facts` y devuelve un arreglo paralelo con el `diff` de cada uno, o `null` si no tiene homónimos.
  - **Homónimos:** mismo `title` sin acentos ni mayúsculas, recortado y con los espacios colapsados (la misma regla con que `GCombobox` decide si una etiqueta es única, #333).
  - **Por cada dato** de una ficha con homónimos: `diff` si su valor (texto recortado, comparación exacta) **no lo tiene ninguna otra** del grupo en un dato con el mismo `label`; `same` si lo comparte con alguna. Un dato que las otras no tienen es `diff`.
  - Los datos sin valor no entran.
- **Solo entre fichas a la vista.** Comparar con resultados que el usuario no ve produce marcas que no se explican.
- **Pintura:** `is-diff` → el valor con el peso del título; `is-same` → el valor en `text-subtle`. El **identificador** conserva siempre su peso (ya es lo que distingue) y nunca se apaga. Sin `diff`, ningún dato lleva marca. Aplica en los tres `layout`.
- **No cambia la cesión:** `diff` no reordena ni protege datos. Lo que distingue se asegura con `priority`.
- **Límite:** exige que las vecinas traigan los mismos rótulos; en listas heterogéneas casi todo sale `diff`.

## Coincidencia (`highlight`)

- Con texto, la ficha marca con **`<mark class="g-summary__mark">`** la primera aparición de cada palabra (sin acentos ni mayúsculas) en `title`, `code`, `subtitle` y los **valores** de `facts` (no en los rótulos). **Peso y subrayado, no color** (WCAG 1.4.1). Si la forma sin acentos no mide lo mismo que el texto, no se marca. Es la regla de `GCombobox` (#335), ahora compartida.
- Bruno **sube al principal** las funciones puras que hoy viven en `GCombobox/engine.js` (`fold`, `tokens`, `parts`) como utilidad interna (`utils/`), y `GCombobox` las toma por `__shared`. `summaryDiff` usa el mismo `fold`.
- Sin `highlight`, nada. No busca ni filtra: solo pinta.

---

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `lead` | Identidad propia (sustituye a `avatar`/`icon`) | `{ size }` | Dentro de `g-summary__lead` (`aria-hidden`); decorativo, sin interactivos. Un hijo directo `.g-avatar` manda su caja (#295) |
| `status` | Estado propio (sustituye a la `GBadge` de `status`) | | Dentro de `g-summary__status`; **texto real** (se lee), sin interactivos, una línea |
| `action` | Acción al pie | | **Solo en `stack`**, dentro de `g-summary__action`. En `inline` y `row` no se pinta y avisa. Nunca dentro de un anfitrión interactivo |

**Sin slot por defecto, sin `title` ni slot por dato** en v0.1. Un slot vacío (comentarios, espacios) cuenta como ausente.

## Eventos

Ninguno. No es interactiva y el recorte no es una intención del usuario (no hay evento por cambio de tamaño ni por «+N»). Todo lo que llegue por `$attrs` va a la raíz.

## Teclado

Ninguno.

---

## Tipografía

| `size` | Identidad | Título | Datos, línea secundaria | Rótulos en `stack`, «+N» |
| --- | --- | --- | --- | --- |
| `xs` | `space × 5` | body-sm, peso de título | body-sm | caption |
| `sm` | `space × 6` | body-sm, peso de título | body-sm | caption |
| `md` | `space × 8` | **body**, peso de título | body-sm | caption |
| `lg` | `space × 10` | body, peso de título | body-sm | caption |
| `xl` | `space × 16` | title-sm | body-sm | caption |

- **`inline` hereda** tamaño, interlineado y familia del anfitrión (el texto del campo y el de la ficha deben coincidir: al empezar a editar no puede haber salto); `size` solo fija la identidad.
- Peso de título = `--g-text-title-sm-weight`; nunca un `600` literal. `row` `md` con `lines: 2` mide 24 + 20 = **44px** con el tema por defecto.
- Color: título y valores `text` (heredado del anfitrión); línea secundaria `text-muted`; rótulos `text-subtle`; código `text-muted` con peso de título.

## Movimiento (#355)

Con el lenguaje de #299 (`tokens.md` §29). **Ningún uso del muelle ni del rebote.**

| Pieza | Qué | Duración y curva |
| --- | --- | --- |
| **El dato que vuelve** | Al **ensanchar**, cada dato que pasa de recortado a visible **entra** desde el inicio de su sitio: opacidad 0 → 1 y `translate` desde `--g-space-1 × 3` (reflejado en RTL). El sitio ya era suyo: no hay salto de layout. Bruno pone **`data-enter`**; coco anima con keyframes **`g-summary-enter…`**; bruno lo retira en `animationend`/`animationcancel` de ese nombre, o en el acto si no hay animación calculada (patrón de #313) | `--g-duration-slow`, `--g-ease-out` (es una entrada: `tokens.md` §29.1) |
| Salir | **No se anima**: un dato que se va no debe retener la mirada | — |
| Rótulos que se callan, «+N», estado apretado, contraste | Sin movimiento | — |

- **Solo por cambio de tamaño.** No al montar (`tokens.md` §29.3), ni al cambiar los datos, ni al abrir la lista de un combobox.
- **Sin escalonado:** cada dato entra cuando cabe. Si varios caben a la vez (un panel que se despliega), entran juntos.
- **`prefers-reduced-motion: reduce`:** nada entra; bruno no pone `data-enter` y coco además lo neutraliza (patrón único de #299). El dato aparece en su sitio.
- `--g-space-1 × 3` es una **constante de coreografía** nueva (`tokens.md` §34; #187).

## Tokens consumidos (#355)

**Tokens nuevos: ninguno** (`tokens.md` §34; §17.6: ningún existente se queda corto).

| Token | Para qué |
| --- | --- |
| `--g-space-1` (y sus múltiplos) | Lado de la identidad, separaciones, columnas de la rejilla de `stack` |
| Roles `body`, `body-sm`, `caption`, `title-sm`; `--g-text-title-sm-weight` | «Tipografía» |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Título y valores; línea secundaria y código; rótulos y valores compartidos |
| `--g-color-border-strong` | Separador entre datos (una línea al inicio de cada dato, no un carácter) |
| `--g-color-accent-soft`, `--g-color-on-accent-soft` | «+N» (par garantizado ≥ 4.5:1) |
| `--g-radius-pill`, `--g-radius-sm`, `--g-radius-xs` | «+N»; caja del icono; formas de carga |
| `--g-color-surface-sunken` | Caja del icono de identidad; formas de carga |
| `--g-border-width` | Separador |
| `--g-duration-slow`, `--g-ease-out` | «Movimiento» |

**No son tokens** (`tokens.md` §34): los suelos del título **`7ch`** y **`4ch`** y la unidad **`1lh`** (literales de unidad, #187); el mínimo de columna de la rejilla de `stack` (`space × 28`, constante de diseño que fija coco); el desplazamiento de entrada (`space × 3`); **`--_lines`** (variable en línea).

## Clases y datos (contrato bruno ↔ coco)

| Clase / dato | Elemento | Cuándo | Quién |
| --- | --- | --- | --- |
| `g-summary`, `g-summary--layout-{inline\|row\|stack}`, `g-summary--size-{xs…xl}` | Raíz | Siempre | render |
| `g-summary--multi` | Raíz | `row` con más de una línea de datos | render |
| `g-summary--free` | Raíz | `row` con `lines: 0` | render |
| `--_lines` | Raíz (en línea) | `row`: líneas de datos | render |
| `is-loading`, `is-empty` | Raíz | `loading`; sin `title` | render |
| `g-summary__lead`, `__body`, `__head`, `__name`, `__code`, `__title`, `__status`, `__subtitle`, `__data`, `__flow`, `__facts`, `__more`, `__action`, `__sep`, `__mark`, `__bone` | Partes | Según contenido | render |
| `g-summary__fact`, `__fact-label`, `__fact-value` | Dato | Por dato | render |
| `is-anchor` | Dato | El identificador | render |
| `is-bare` | Dato | `bare: true` | render |
| `is-diff`, `is-same` | Dato | Según `diff` | render |
| `data-terse`, `data-tight` | Raíz | Medidos | medida |
| `data-clipped`, `data-enter` | Dato | Medidos | medida |
| `hidden` | `__more` | Sin recorte | medida |
| `title` | Parte con elipsis | Medido | medida |

**Las clases de las partes son contrato público** para los anfitriones de Grana: un anfitrión que pinta la ficha sobre otra superficie reapunta sus tonos con selectores propios sobre estas clases (como `:has(> .g-avatar)`, #295). `GSummary.css` no conoce a ningún anfitrión.

**Para coco:**

- **La regla base:** nada con `display: none` ni `visibility: hidden` para ceder (sí en `__more[hidden]`, que es decorativo). Recorte por `max-block-size` + `overflow: hidden`; retirada de la vista por el patrón de texto oculto.
- **A, tal como la vio el usuario** (`r02/concepts.css`, `[data-concept=A]`): rótulos en `text-subtle`; cada dato que no es el identificador, con línea de `--g-border-width` al inicio como separador; identificador con peso de título; «+N» en píldora.
- **Cabecera:** el estado cede antes de que el título baje de su suelo. En `stack`, la cabecera salta de línea: nada se recorta.
- **`stack`:** rejilla `auto-fill` de pares (rótulo `caption` sobre valor); **los valores saltan de línea**, sin elipsis (el prototipo los cortaba: se corrige aquí, porque `stack` es la vista completa).
- **`inline`:** una línea, `font` heredada; Δ0 de alto dentro de `g-combobox__token` con cualquier `size` y `density` del campo.
- **Carga:** formas con el alto del `layout` (Δ0 medido: kiwi no lo midió), con el patrón de esqueleto de `GCard`.
- **`forced-colors`** (sin medir por kiwi: medir): separadores y «+N» con `CanvasText`; formas de carga con `GrayText`; el peso de `is-diff` se conserva; `is-same` en `GrayText` solo si sigue leyéndose.
- **Contraste con otro tema y con el oscuro:** kiwi midió 4.72:1 (rótulo sobre la opción activa, tema claro por defecto): queda cerca del mínimo. Medir rótulo, `is-same` y «+N» sobre `surface`, `surface-sunken`, la opción activa de `field`, la activa invertida de la paleta y la ficha «seleccionada» del campo (`--g-color-selection`).
- **Bidi real:** medir con texto árabe o hebreo (kiwi midió RTL con texto latino).

## Estados

Normal · con recorte («+N») · rótulos callados (`data-terse`) · apretado (`data-tight`) · título con elipsis · sin identidad · con avatar, con icono, con código · sin datos (solo título y línea secundaria) · con estado · con `diff` (único, compartido, sin homónimos) · con `highlight` · `inline`, `row` (`lines` 2, 4 y 0), `stack` · `stack` con acción · carga · vacío con `placeholder` · suelta con `group` · dato que entra · RTL · reduced motion · `forced-colors`.

## SSR

Importar y renderizar en el servidor no toca `document`, `window` ni `matchMedia`. El servidor pinta la ficha completa y correcta (la cesión es CSS); «+N», `data-*` y `title` llegan al montar. El `id` del título se genera con `useId` (estable en la hidratación).

---

## Adopción en `GCombobox` (#356)

**Sustituye la regla provisional de dos líneas** de `GCombobox.css` («arreglo mínimo a la espera del componente de fichas»). Detalle normativo en `combobox.md`, «Fichas con `GSummary`». Resumen:

| Dónde | Hoy | Con `GSummary` |
| --- | --- | --- |
| Opción por defecto | `__lead` + `__code` + `__main` (`__label`, `__facts` o `__description`) | `<GSummary layout="row" :lines="2">` + `__check` |
| Ficha del valor (`__token`) | `__lead` + `__code` + `__token-label` + `__token-meta` | `<GSummary layout="inline">` dentro de `__token` |
| Vista previa de la paleta | Cabecera + `__description` + `dl` | `<GSummary layout="stack">` |

**Los campos de #335 no cambian:**

| Campo de la opción | Prop de `GSummary` | Nota |
| --- | --- | --- |
| `label` | `title` | Traduce `GCombobox`; la ficha no acepta sinónimos |
| `description` | `subtitle`, **solo si la opción no trae `facts`** | Como hoy («fila, si no hay `facts`»): con `facts`, `description` sigue siendo el respaldo de la descripción accesible (`ID-about`) y no se pinta dos veces |
| `code` | `code` | Identificador: no cede |
| `facts` | `facts` | Se añaden, **opcionales y aditivos**, `priority`, `short` y `bare` |
| `avatar`, `icon` | `avatar`, `icon` | Tal cual; el slot `lead` de `GCombobox` pasa al slot `lead` de la ficha |
| — | `highlight` | El texto buscado (solo en la opción) |
| — | `diff` | `summaryDiff` sobre las **opciones pintadas** (opción y vista previa) |

- `value`, `disabled` y los campos de más no llegan a la ficha. `status` **no** se añade a la opción en v0.1 (quien lo quiera, slot `option` con su propia `GSummary`).
- Los slots `option`, `value` y `preview` **siguen ganando**; `GSummary` es pública para usarla dentro de ellos.
- `ID-about`, el nombre de la opción (su texto), el modelo, el teclado y los anuncios **no cambian**.

---

## Avisos de desarrollo (`[Grana GSummary]`, una vez por instancia y motivo)

Con el patrón `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`.

1. Sin `title`, sin `placeholder` y sin `loading`: ficha vacía.
2. Un dato sin `label` (se omite); dos datos con el mismo `label` (se pintan los dos; `diff` es ambiguo).
3. `lines` igual a `1`, negativo o no entero (se usa `2`); `lines` distinto de `2` fuera de `row` (se ignora).
4. Slot `action` fuera de `stack` (no se pinta).
5. `diff` con un valor que no es `same` ni `diff` (se ignora esa clave).
6. `status` sin `label` y sin slot `status` (no se pinta).
7. `group` sin `title`.
8. Tras montar, la ficha mide 0 de ancho: el anfitrión no le da sitio («Disposición»).

## Resolución de hallazgos

### r01 (`design/lab/summary/r01/declaracion.md`)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Nombre y entrada | **`GSummary`** (`g-summary`), decisión del usuario; convive con `GErrorSummary` y la prop `summary` de `GFormSection`. Paquete principal | #350 |
| L2 | Datos | `title`, `subtitle`, `code`, `avatar`, `icon`, `facts`, `status`. **Sin sinónimos**: `GCombobox` traduce `label` y `description` | #351, #356 |
| L3 | Disposición | `layout` `inline` `row` `stack` (por defecto `row`); `lines` (2; 0 sin límite; total de líneas); `size` de `GAvatar`. **`panel` y `auto`, reservados** (traen umbrales y alto variable, contra A) | #352, #357 |
| L4 | Slots | `lead`, `status`, `action` (solo `stack`); sin slot por dato | #351 |
| L5 | Identificador | Sin prop: `code` o el dato de mayor prioridad. La cesión es contrato («Orden de cesión») | #351, #352 |
| L6 | Accesibilidad | Prop `group`; «+N» `aria-hidden`; separadores ocultos; `title` nativo solo en lo cortado | #353 |
| L7 | Estados | Derivados del render, clases (`is-anchor`, `is-bare`, `is-diff`, `is-same`); **medidos, atributos** (`data-clipped`, `data-terse`, `data-tight`, `data-enter`), porque se escriben fuera del render. `data-tier` desaparece con `auto` | #352 |
| L8 | `GCombobox` | Adopta ya; #335 intacto; las clases propias de ficha **se retiran** (el componente es `candidate`) | #356 |
| L9 | Tokens | Ninguno nuevo; suelos y `lh`, literales de unidad | #355 |
| L10 | Bidi | `dir="auto"` en cada texto; medir con texto RTL real (coco) | #353 |
| L11 | Anfitriones de ancho automático | La ficha no aporta ancho; aviso 8; `min` en `GTable` (README) | #352 |
| L12 | Avisos | Lista de arriba | — |

### r02 (`design/lab/summary/r02/declaracion.md`)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L13 | A · rótulo evidente | **`facts[].bare`**; clase `is-bare`, estado `data-terse` | #351, #352 |
| L14 | A · entrada | `data-enter`, keyframes `g-summary-enter…`, `--g-duration-slow` + `--g-ease-out`; solo por cambio de tamaño | #355 |
| L15 | A · líneas | `lines` en `row`; una línea es `inline` | #352 |
| L16 | B · comparación | **Las dos formas:** prop `diff` y utilidad `summaryDiff(list)`; clases `is-same` / `is-diff`; solo entre fichas a la vista | #354 |
| L17 | B · casillas | Reservado: `align`, `heading`, ancho de casilla | #357 |
| L18 | C · reservas | `expandable`, `labels.more`, `surface`: nombres reservados | #357 |
| L19 | Identidad | A + contraste de B, con lo que entra y lo que no; semillas descartadas | #349 |
| L20 | `GCombobox` | Opción `row` `lines: 2`, ficha `inline`, vista previa `stack`; el contraste, sobre las opciones pintadas | #356 |

## Límites conocidos (para el README)

- **La ficha recortada nunca es la única fuente de un dato:** el anfitrión ofrece la vista completa (vista previa, detalle, `stack`). El `title` nativo de lo cortado solo sirve al puntero.
- **El estado es de lo primero que cede.** Si es crítico (una alergia), va como dato con `priority` alta, no como `status`.
- **`bare` mal marcado** deja un valor sin rótulo a la vista.
- **`diff`** depende de que las vecinas traigan los mismos rótulos; con un tema cuyo peso de título sea igual al del cuerpo, lo único se distingue solo por tono.
- **Un anfitrión de ancho automático** (celda de tabla, fila flex) debe dar ancho a la ficha.
- **«+N»** no se localiza (cifras latinas).
- **Sin virtualización:** cada ficha se mide; con cientos, la medida de las que no están a la vista puede llegar un instante después.
- **Navegadores:** exige la unidad `lh` y `:has()` (los actuales).

## Verificación (cómo se da por hecho)

**Criterio de hecho:** las medidas de kiwi (`r01/verificar.mjs`, 1 564 por motor, y la parte A y el contraste de `r02/verificar.mjs`) reproducidas **sobre el componente real**. Verificación por niveles (CLAUDE.md); puerto propio de Playwright por agente.

### bruno (vitest + jsdom)

- **Datos:** orden por `priority` (declarados antes, empates por arreglo, sin mutar la prop); identificador (`code` › primer dato); `short` en lugar de `label`; valores vacíos omitidos; `bare` → `is-bare`.
- **Disposición:** clases por `layout` y `size` (y el `size` por defecto de cada `layout`); `lines` → `--_lines`, `--multi`, `--free`; `subtitle` con y sin datos en cada caso; `action` solo en `stack`.
- **Semántica:** todo `span`/`mark`; identidad `aria-hidden`; «+N» `aria-hidden` y `hidden` sin recorte; separadores; `group` → `role` y `aria-labelledby` a un `id` que existe; sin `group`, sin rol; `dir="auto"`; `aria-busy` con `loading` y sin contenido; `placeholder`.
- **`avatar` / `icon` / slot `lead`:** precedencia; `avatar: true` usa `title`; `size` y `label` del objeto ignorados.
- **`diff` y `summaryDiff`:** homónimos por título plegado; único, compartido, dato ausente en la vecina, sin homónimos → `null`; el identificador recibe la clase.
- **`highlight`:** marcas en título, código, línea secundaria y valores; no en rótulos; sin acentos ni mayúsculas.
- **Medida** (con cajas simuladas): `data-clipped` y cuenta; pasadas `terse` → «+N» → `tight` y su convergencia; `title` solo en lo cortado; `data-enter` solo por cambio de tamaño, nunca al montar ni con `reduce`, y su retirada; sin `ResizeObserver` no falla.
- **SSR** (`renderToString`, sin `window`); **avisos** 1 a 8; **empaquetado:** `__shared` sin duplicados, las tres compuertas nuevas, las de #337 intactas, peso gzip anotado.
- **`GCombobox`:** sus pruebas en verde con la ficha dentro (mapeo de campos, `description` solo sin `facts`, slots que ganan, `ID-about` igual, `diff` sobre las opciones pintadas).

### Playwright (Chromium, Firefox, WebKit; `design/lab/theme-playground/`)

- `tests/summary.spec.mjs`: la batería de r01 sobre el componente real, 160 a 720px (paso 20), LTR y RTL, en opción, campo, vista previa, tarjeta y celda de `GTable`: sin desborde; nada cortado a medias; **identificador entero en todos los anchos**; título ≥ 20px; «+N» = `data-clipped`; alto constante en `row` `lines: 2` y Δ0 en el campo; **el lector lee todo** (ningún dato con `display: none`, `visibility: hidden` ni ancestro `aria-hidden`; `ariaSnapshot` de la opción con los cuatro datos a 240px); datos visibles en la opción **1 / 2 / 4 de 4** a 240 / 360 / 520px; rejilla redimensionable; móvil 320 sin desplazamiento horizontal; contraste; consola limpia.
- `tests/personalidad-summary.spec.mjs`: al ensanchar de 190 a 520px hay datos entrando (≥ 2 posiciones intermedias, terminan en 0 y sin `data-enter`); nada al montar; con `reduce`, nada.
- `tests/combobox*.spec.mjs`: siguen pasando con la ficha dentro, **incluida la compuerta «500 opciones < 150 ms»** y Δ0 de la ficha del valor; el contraste entre las cuatro homónimas (peso de lo único mayor que el de lo compartido; el vecino sin homónimos, sin marcas).
- **Rendimiento:** 200 fichas en una rejilla, un cambio de ancho: tiempo de la medida anotado en el `meta.json` (sin avisos «ResizeObserver loop» en WebKit).

### coco (CSS y auditoría)

Solo `var(--g-*)` y `--_*` más los literales de `tokens.md` §34 y §7; los tres `layout` medidos en los tres motores; auditoría con un tema distinto y con el oscuro (lista de «Para coco»); `forced-colors` emulado con medida. Resultado en `design/lab/summary/auditoria.md`.

### No verificado (entorno real)

Lector de pantalla (VoiceOver, NVDA, TalkBack): que lo recortado por `overflow` y los rótulos callados se lean como en el árbol de Chromium; el `title` nativo dentro de una `option`. `forced-colors` real; táctil real; zoom de texto 200 %; idiomas de palabras largas y CJK; texto árabe o hebreo real.

## Fuera de v0.1 (reservado, #357)

| Qué | Nombres reservados | Requiere |
| --- | --- | --- |
| **Casillas alineadas** (resto de B) | Prop `align` (Boolean), prop `heading` (fila de rótulos, decorativa; en `listbox`, `role="presentation"`), ancho de casilla | Segunda entrega: decidir si el ancho es constante, prop o token; listas homogéneas |
| **Tramos por ancho** | `layout="auto"` y `layout="panel"` | Decisión de identidad: traen umbrales y alto variable, lo que A evita |
| **Segunda cara** (de C) | Prop `expandable`, `labels.more` («Ver {n} datos más de {title}»), «+N» como botón | Ronda propia: foco, capa anclada, solo fuera de anfitriones interactivos |
| **Superficie propia** (de C) | Prop `surface` | Se solapa con `GSurface` y `GCard`; no se recomienda |
| Slot por dato | `fact-{label}` | Un caso real que `value` como texto no cubra |
| `status` en la opción de `GCombobox` | Campo `status` de la opción | Petición real |
| Adopción en `GCard`, `cell-{key}` de `GTable`, `GMenu`, `GSelect`, `GSidebar` | — | Una ronda por anfitrión; hoy la ficha ya puede ir en sus slots |

## Dudas para el usuario

1. **Vista previa de la paleta en `stack`** (rejilla de pares) y no como corriente de A sin límite. Decidido así porque kiwi señaló que la corriente es menos escaneable cuando sobra sitio y la vista previa de hoy ya es una lista de pares; `stack` viene de la base r01, no de C, y nunca se elige sola. Si el usuario prefiere A pura también ahí, es `layout="row" :lines="0"` en `GCombobox`: un cambio de una línea, sin tocar este contrato.

## Encargos

**coco (Opus)** — `packages/vue/src/components/GSummary/GSummary.css`, banco y `design/lab/summary/estilo.md`:

1. Los tres `layout` con la anatomía y las clases de este contrato, partiendo de `r01/summary.css` y de `[data-concept=A]` de `r02/concepts.css`; la pintura de `is-diff` / `is-same` desde `[data-concept=B]` (solo esas tres reglas).
2. La lista de «Para coco» (medidas incluidas) y la entrada `g-summary-enter…`.
3. En `GCombobox.css`: **retirar** la regla provisional de dos líneas y las reglas de `__description` (en opciones), `__facts`, `__fact`, `__fact-label`, `__token-label`, `__token-meta`, `__preview-head`, `__preview-title` y `__preview-facts`; dar sitio a la ficha en la opción (`flex: 1`, `min-inline-size: 0`), en `__token` y en `__preview`; **reapuntar los tonos** de la ficha en la opción activa de `field`, en la activa invertida de la paleta, en la deshabilitada, en `is-custom` y en la ficha «seleccionada», con medida de contraste; conservar la columna de códigos (`space × 14`) sobre `g-summary__code` si sigue midiendo bien.
4. Auditoría del componente real y de `GCombobox` con la ficha (`design/lab/summary/auditoria.md`).

**bruno (Fable)** — `GSummary.vue`, `GSummary.test.js`, `GSummary.meta.json`, `summaryDiff`, registro en `index.js` y `components.css`, `shared.js`, playground:

1. El componente según este contrato; la medida con `utils/sizeObserver.js`, por lotes (leer todo, escribir después), tres pasadas como máximo, sin estado reactivo por dato.
2. Subir `fold`, `tokens` y `parts` de `GCombobox/engine.js` a una utilidad del principal y exponerla por `__shared`.
3. `GCombobox.vue`: opción por defecto, `__token` y vista previa con `GSummary` según «Adopción»; `summaryDiff` sobre las opciones pintadas; el origen del viaje de la ficha (`is-arriving`) pasa de `.g-combobox__main` a la `.g-summary` de la fila; las filas de acción no cambian.
4. Las compuertas y el peso; los specs de «Verificación». Si «500 opciones < 150 ms» no se sostiene ni con la medida aplazada, devolver las cifras a lima.

**mora-docs** — `GSummary/README.md` al cierre, desde el `meta.json`, con «Límites conocidos»; nota en `GCombobox/README.md` sobre `priority`, `short` y `bare`.
