# Contrato · GContainer (contenedor de página)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #721, #722, #717, #718, #723 y #724, 2026-10-21; `tokens.md` §50, `api.md` «Contención en línea» y «Paquete, entradas y tipos») · **Basado en:** `design/lab/container/r01/` (kiwi, commit 23f26c2, 2026-10-14: `brief.md`, `declaracion.md` con 19 decisiones de base, conceptos A/B/C y hallazgos L1 a L13, `index.html`, `ct.css`, `ct.js`, `verificar.mjs` 366/366 en Chromium, Firefox y WebKit) y su relación con el chasis (`design/lab/app-shell/r01/declaracion.md` «Relación chasis ↔ contenedor», S10)
**Tag:** `g-container` · **Categoría:** estructura de página · **Paquete:** `@grana/vue` (principal, con compuerta de peso propia; #723)

**Componente complejo** (L12: el código es pequeño, pero se solapa con `GSurface`, `GPageHeader` y `GDialog` —mapa de anfitrionas, sangrado—): **coco y bruno en Opus** (regla de `CLAUDE.md`).

## Promesa

Pone los **límites en línea** del contenido de una página: cuánto ancho ocupa, dónde se centra, cuánto aire deja contra el borde y qué elemento es. **Mide su sitio, no el visor.** No reparte, no apila, no hace columnas, no pinta superficie.

**Forma (decisión del usuario del 2026-10-21, #721):** «opción 1: B · Sangrado alineado con la medida de A como opción (`width="reading"` y `prose`), C · Medida a la mano reservada.»

- **Base:** raíz con el elemento pedido; ancho máximo por escala o completo; margen fluido medido sobre **su** caja (unidades de contenedor, sin JS ni puntos de corte); anidado sin margen acumulado; un solo `main`; RTL; 400 %.
- **B · Sangrado alineado (la forma):** no hay modo «ancho completo» para una banda. Un descendiente pide llegar al borde (`g-bleed`) y **su contenido sigue alineado con la columna**; `g-bleed-raw` llega al borde sin realinear (media, una línea).
- **A · Medida, como opción:** `width="reading"` (la columna entera es la medida de lectura) y `prose` (la prosa de la columna se queda en su medida y lo ancho usa toda la columna).
- **C · Medida a la mano: reservada** (`adjustable`, `v-model:measure`; «Fuera de v1»).

---

## Principios

1. **Solo el eje en línea.** Ancho máximo, márgenes laterales y alineación. Ni relleno de bloque, ni separación entre hijos, ni fondo, borde, radio o sombra (el ritmo es de `GStack`, `GFormLayout`, `GAdaptiveLayout`; la superficie, de `GSurface`).
2. **No distribuye:** la columna es un bloque; los hijos siguen en flujo normal (los márgenes de la prosa de la aplicación colapsan como siempre).
3. **Mide su caja, no el visor:** se adapta al plegar la barra lateral sin saber que existe.
4. **El ancho completo no parte la página:** un solo contenedor por página; el pegado de `GPageHeader` dura toda la página.
5. **Sin JS, sin medidas, sin parpadeo, sin movimiento:** el primer pintado (SSR) es el definitivo.

## Qué lo hace distinto (#722)

Un contenedor que **mide su sitio y no el visor**, con un margen que **respira de forma continua** en lugar de saltar en puntos de corte, que **no acumula relleno** al anidarse, y en el que **el ancho completo no rompe la página**: una banda pide el borde y su contenido se queda en la columna; una tabla ancha en un teléfono **arranca alineada con el texto y se desliza desde el borde de la pantalla**, donde el pulgar la empuja. La banda **sabe dónde está la columna** (los márgenes publicados, el mismo patrón que `--g-surface-padding` de `GCard`, #131, a escala de página) y nunca se mete bajo la barra lateral ni crea desplazamiento horizontal. Con `prose`, el contenedor limita **la línea**, no la caja: la prosa se lee a 66 caracteres aunque la tabla de al lado ocupe 1080 px.

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| La columna de una página | **`GContainer`** | `max-inline-size` y `padding` a mano |
| Una banda de borde a borde (encabezado de marca, aviso, tabla) | `g-bleed` en el hijo | Un segundo contenedor `full` (el «emparedado» corta el pegado) ni `100vw` |
| Repartir hijos en líneas | `GAdaptiveLayout` dentro | El contenedor (no reparte) |
| Ancho de un formulario | `GContainer width="sm"` alrededor de `GForm` | Un ancho en `GFormLayout` (sus filas siempre llenan, #171) |
| Separación vertical entre bloques | `GStack` dentro | Relleno de bloque del contenedor (no tiene) |
| Superficie | `GSurface` | El contenedor (sin superficie ni `zone`; la zona es `data-g-zone="brand"` en la raíz o en una banda) |
| Una línea de borde a borde de la página | `GDivider` con `g-bleed-raw` | `--g-divider-inset` (otra cosa, dentro de una anfitriona) |
| La página dentro de `GAppShell` | `GContainer` (`as="div"`, su defecto) dentro del slot por defecto | `as="main"` (el chasis ya pone el `main`; aviso 3, S10, #718) |
| La página **sin** chasis | `GContainer as="main"` con `GPageHeader` de primer hijo | Dos `main` |

## Uso

```vue
<!-- Con GAppShell -->
<GContainer>
  <GPageHeader title="Muestras" …/>
  <GStack gap="lg">
    <section class="g-bleed mi-banda" data-g-zone="brand">…</section>
    <div class="g-bleed mi-desplazable"><table>…</table></div>
  </GStack>
</GContainer>

<!-- Sin chasis: el contenedor es el main -->
<GContainer as="main" id="main" tabindex="-1" width="sm">
  <GPageHeader title="Ajustes" />
  <GForm>…</GForm>
</GContainer>
```

(`GPageHeader` es hijo directo de la columna, que es su contenedor largo. De primer nivel **sangra solo, como un `g-bleed`** (#760): no se le pone la clase; §«B · Sangrado alineado».)

## Anatomía

```
<as>.g-container [--width-*] [--horizontal-*] [--gutter-*] [--prose]   ← raíz: el elemento pedido; recibe $attrs (id, aria-*, data-g-zone, tabindex)
│                                                    container-type: inline-size → es la CAJA que se mide (cqi); sin contención de layout ni de paint
└─ div.g-container__body                             ← la COLUMNA: inline-size y margin-inline en cqi de la raíz (CSS, sin JS)
   └─ [slot default]
```

Dos cajas y no una: la raíz mide el sitio que le dan (lo que deja la barra lateral, un panel, un diálogo); la columna se coloca dentro. Así nunca mira el visor, y el ancho de la caja que necesita B está a mano para cualquier descendiente sin medir.

## Props (#722)

| Prop | Tipo | Valores | Default | Origen / nota |
| --- | --- | --- | --- | --- |
| `width` | String | `sm` `md` `lg` `xl` `2xl` `full` `reading` | `lg` | Ancho máximo de la columna: `space × 160 · 192 · 256 · 320 · 384` (640 · 768 · 1024 · 1280 · 1536 px con `space` 4); `full` sin máximo (la caja menos el margen); `reading` = la **medida de lectura** `66ch` de la fuente de la columna (A). Una sola prop: **`fluid` = `width="full"`**, sin `size` paralelo ni px por prop. Fuera de lista: aviso 1 y `lg` |
| `horizontal` | String | `center` `start` | `center` | Nombre de `GAdaptiveLayout` (#339). `start`: el margen al inicio lógico y el sobrante al final. **Sin `end`** (ningún caso real). Con `full` no tiene efecto (aviso 2). Sustituye a `centered` |
| `gutter` | String | `auto` `none` `sm` `md` `lg` | `auto` | Margen lateral fluido (§«Margen»). `auto` = `md` arriba y **0 anidado** (dentro de otro contenedor o de una anfitriona). Uno explícito siempre gana |
| `as` | String | `div` `main` `section` `article` | `div` | El contenedor no añade roles ni nombres; los `aria-*` van a la raíz por `$attrs`. Fuera de lista: aviso 4 y `div` |
| `prose` | Boolean | | `false` | A · Medida: la prosa de la columna (`p`, listas, `blockquote`, `h1`–`h6`, `figcaption`, `address`, a cualquier profundidad) se queda en `66ch`, alineada al inicio; excluye lo de dentro de un componente de Grana, de una tabla y de `.g-wide` |

**Propiedad pública de entrada `--g-container-max`** (longitud; `@property` `<length>`, `inherits: false`, `initial-value: 0px`; no es del tema): un ancho máximo a medida, **gana a `width`** (`0px`, el inicial, significa «sin valor», como `--g-adapt-chars`, #364). Sirve en SSR, sin JS, y se puede poner una vez en la hoja de la aplicación para toda una vista (`.mi-vista .g-container { --g-container-max: 70rem }`). `inherits: false`: no pasa a un contenedor anidado. coco lo resuelve en CSS sin respaldo (p. ej. con `sign()`).

**No existen** (y por qué): `size`, `fluid`, `centered` (la API contradictoria de la propuesta, L2); `width` numérico; `padding` de bloque (ritmo de `GStack`); `zone` (atributo público de la zona); `gap`; `adjustable` y `v-model:measure` (reservados, C).

### Reglas de props

- `width="reading"` y `prose` a la vez: la columna ya es la medida; `prose` no cambia nada (sin aviso).
- `--g-container-max` con `width="full"`: gana el máximo (deja de ser `full`; sin aviso).

## Margen lateral (`gutter`)

| `gutter` | Margen (a cada lado; crece de forma continua con la caja) |
| --- | --- |
| `sm` | `clamp(space-3, 2cqi, space-6)` (12 a 24 px con `space` 4) |
| `md` | `clamp(space-4, 4cqi, space-12)` (16 a 48 px) |
| `lg` | `clamp(space-6, 6cqi, space-16)` (24 a 64 px) |
| `none` | 0 |
| `auto` | `md`; **0** dentro de una anfitriona |

- **Área segura:** el margen es `max(<margen>, env(safe-area-inset-left), env(safe-area-inset-right))` (teléfono apaisado con muesca; no con `none`).
- **Sin puntos de corte:** `@container` y `@media` no admiten `var()` (#34, #39), pero aquí no hay consultas: `clamp()` con `cqi` sí admite tokens.
- **Anfitrionas de `auto` = 0** (L5, #722; contrato entre componentes como el mapa de `--_sticky-bg`, #484): `.g-container__body` (otro contenedor), `.g-surface` (incluye `GCard`, que compone `GSurface`) y `.g-dialog__body`. Una anfitriona nueva se añade aquí (lima) y en `GContainer.css` (coco).
- Medido por kiwi: con el mismo visor de 1440, barra ancha → caja 1176, margen 47; riel → caja 1376, margen 48 (tope); el formulario anidado empieza en el borde de la columna y el contenedor dentro de un `GSurface outlined` en su relleno (Δ 0).

**La columna = `min(caja − 2 × margen, máximo)`**, centrada o al inicio. Medido en 6 visores (320 a 1920), con y sin barra, en los cinco anchos: coincide al píxel, sin desplazamiento horizontal (56 casos por motor).

## B · Sangrado alineado (#722)

**La columna publica sus márgenes ya resueltos** como propiedades registradas heredables (solo lectura; `<length>`, `inherits: true`, `initial-value: 0px`):

- **`--g-container-inset-start`** y **`--g-container-inset-end`**: la distancia de cada borde de la columna al borde de la caja (px; lógicos: `start`/`end` siguen a la dirección).

**Dos clases públicas de entrada** en un descendiente (como `g-adapt-*`, #364):

| Clase | Qué hace |
| --- | --- |
| **`g-bleed`** | Margen negativo hasta los bordes de la caja **y el mismo valor como relleno en línea** y `scroll-padding-inline`: el fondo llega al borde; el texto, los botones y el foco siguen en la columna. **Un desplazable** (tabla ancha) empieza alineado con el texto, se desplaza hasta el borde de la caja y termina alineado con el final de la columna |
| **`g-bleed-raw`** | Solo el margen negativo: media, mapas, una línea (`GDivider`) de borde a borde |

- **Sirve a cualquier profundidad** mientras la caja del descendiente ocupe la columna (una `section`, un `div`, un `GStack`): los márgenes son px heredados. Dentro de una superficie con relleno llegaría al sitio equivocado (aviso 5).
- **El borde es el de la caja del contenedor, no el del visor:** nunca se mete bajo la barra lateral y no crea desplazamiento horizontal (el `100vw` habitual incluye la barra de desplazamiento y la lateral). Dentro de `GAppShell`, la caja es el marco, que además recorta con `overflow-x: clip`.
- **Relleno propio de la banda:** `g-bleed` pone `padding-inline` en la capa de Grana; si la aplicación da relleno propio a la banda (sin capa), el suyo gana y debe sumar el publicado. Receta: `padding-inline: calc(var(--g-container-inset-start) + <su relleno>) calc(var(--g-container-inset-end) + <su relleno>)`.
- **Zona de marca de borde a borde:** `data-g-zone="brand"` en el elemento con `g-bleed` (el fondo de la zona llega al borde; el contenido, alineado).
- **`GPageHeader` de primer nivel consume los márgenes publicados como un `g-bleed`** (L4, #751, #760): como hijo directo de `.g-container__body`, su raíz lleva margen negativo `--g-container-inset-start/-end` y el mismo valor como relleno de cada lado; el `h1`, las pestañas, las acciones, el título compacto y el muelle quedan a ras de la columna, y el fondo, la línea del suelo y la sombra del zócalo pegado llegan a los bordes de la caja. Es de `GPageHeader.css` (selector `.g-container__body > .g-page-header`); la aplicación no pone `g-bleed` en el encabezado. Con margen 0 (contenedor anidado, `GSurface`, `.g-dialog__body`) no sangra. Solo de primer nivel (§«Límites conocidos»).
- Medido por kiwi: encabezado de marca de borde a borde de la caja con el `h1` alineado; banda de auditoría; media y línea; tabla desplazable alineada en reposo y al final; margen publicado en un descendiente profundo igual al real; zócalo pegado en 56 a media página; un fijo dentro sigue pegado al visor; RTL; ningún desplazamiento horizontal.

## A · Medida, como opción (#722)

- **`width="reading"`:** la columna = `min(caja − 2 × margen, 66ch)` (un artículo sin nada ancho).
- **`prose`:** con una columna ancha, los elementos de prosa (lista de la tabla de props) **se quedan en `66ch`** de la fuente de la columna, calculada **una vez** en la columna (propiedad registrada privada, así todos los bloques comparten borde final), alineados al inicio; lo demás usa la columna entera. **Excluido:** la prosa de dentro de un componente de Grana (`[class^="g-"]`, `[class*=" g-"]`), de una `table` y de lo marcado con la clase pública **`g-wide`**. **Primitivas transparentes (#751):** `.g-stack`, `.g-section`, `.g-section__body`, `.g-bleed` y `.g-bleed-raw` **no cortan la medida** (sin esta lista, la exclusión por prefijo anulaba `prose` en `GStack` > `GSection` > `p` y en las bandas); el título y la descripción de `GSection` siguen fuera (tienen su propia medida). Es lista de contrato, como el mapa de anfitrionas: una primitiva de página nueva que deba dejar pasar la prosa se añade aquí. **La prosa medida lleva `box-sizing: border-box`** (una lista con sangría termina donde el párrafo; medido por coco). **Especificidad 0** (`:where`/`@scope`): la aplicación siempre gana.
- **La medida está en caracteres:** con el texto al 200 % la línea sigue teniendo ~66 caracteres hasta tocar la columna, y nunca la pasa (medido, sin desbordar).
- **Límite (para el README):** `prose` selecciona elementos de la aplicación por etiqueta; un `<p>` que la aplicación quiera ancho necesita `g-wide`. Por eso es opción y no defecto.

## Estructura accesible y semántica

- **`as`:** el contenedor no añade roles ni nombres. **`as="main"` solo sin `GAppShell`** (S10, #718): el contenedor es entonces el `main`, el encabezado su primer hijo y «Saltar al contenido» cae en él; `tabindex="-1"` lo pone la aplicación (destino de su salto), no el componente. **Dentro del chasis**, `as="div"` (el defecto): el chasis ya pone el `main` (aviso 3 de los dos componentes).
- **`as="section"`** sin `aria-labelledby` o `aria-label` no es punto de referencia (receta: pasarlo).
- **Lectura y foco:** no cambia el orden del DOM ni es enfocable.
- **Reflujo (1.4.10; L8):** la columna lleva `overflow-wrap: break-word` (heredado): una URL larga se parte antes de desbordar (medido a 390 y a 320 × 256). `break-word` no reduce el mínimo intrínseco (no rompe celdas de tabla; lección de `GAdaptiveLayout`) y no afecta a lo que ya tiene `nowrap`. Lo ancho de verdad necesita su propio desplazable: el contenedor **no recorta** (`overflow` visible; recortar rompería el pegado y los anillos de foco).
- **No atrapa lo fijo ni corta el pegado (#724):** `container-type: inline-size` no aplica contención de *layout* ni de *paint*; medido por kiwi en los tres motores, un descendiente `position: fixed` (el muelle de `GPageHeader`) queda pegado al visor y uno `sticky` se pega con normalidad. Por eso `page-header.md` deja de listar `container-type` entre los ancestros que atrapan el muelle.

## Contención en línea (#562; `api.md`)

La raíz tiene `container-type: inline-size`, así que declara **`contain-intrinsic-inline-size`** con su máximo, calculado con tokens: el de `width` (`space × 160 … 384`); `space × 256` con `full`; `66ch` con `reading`; `--g-container-max` si lo hay. Dentro de un padre que se ajusta al contenido no mide 0.

## Avisos de desarrollo (`[Grana GContainer]`, una vez por instancia y motivo)

Con la guarda canónica de #653, al montar y al cambiar la prop que comprueban.

1. `width` fuera de lista (se usa `lg`).
2. `horizontal` con `width="full"` (sin sobrante que repartir: no tiene efecto). Un `horizontal` **fuera de lista** avisa bajo el aviso 4 (#754).
3. `as="main"` y ya hay otro `main` visible en el documento (`<main>` o `[role="main"]` sin `hidden`), o el contenedor está dentro de otro `main` (incluye el de `GAppShell`, S10). **Un solo texto para los dos casos** (por peso, #754): «as="main" con otro main en el documento o alrededor».
4. `as`, `gutter` u `horizontal` fuera de lista (se usa el default; #754).
5. Un `g-bleed`/`g-bleed-raw` descendiente cuya caja no empieza y termina en los bordes de la columna (medido **una vez al montar**, solo los que existen entonces; L7): está dentro de una superficie con relleno o de una caja más estrecha y sangraría al sitio equivocado.

## Tokens consumidos (L3; `tokens.md` §50)

**Ningún token del tema nuevo.** `--g-space-1` (anchos), `--g-space-3`, `--g-space-4`, `--g-space-6`, `--g-space-12`, `--g-space-16` (márgenes). Sin color: el contenedor no pinta nada (la zona de marca la pinta el elemento que la lleva).

**Propiedad pública de entrada:** `--g-container-max`. **Propiedades publicadas (solo lectura):** `--g-container-inset-start`, `--g-container-inset-end`. **Clases públicas de entrada:** `g-bleed`, `g-bleed-raw`, `g-wide`.

**No son tokens (#717):**

- **Constantes de diseño:** anchos `space × 160 · 192 · 256 · 320 · 384`; pendientes del margen `2 · 4 · 6 cqi`; la medida de lectura `66ch` (y `45ch`–`90ch` reservados para C).
- **Literales de unidad** (amplían #187): `cqi` (`100cqi`, `2cqi`, `4cqi`, `6cqi`) y `66ch`.
- **Propiedades registradas privadas** (§29.7, con el nombre del componente): `--_container-gutter` (`<length>`, `inherits: false`, el margen resuelto) y `--_container-measure` (`<length>`, `inherits: true`, la medida en px de la fuente de la columna).
- ¿Anchos como tokens del tema? **No** (#722): `--g-container-max` ya cubre «otro ancho para toda la aplicación» sin que un tema pueda romper la escala.

## Clases y datos (contrato bruno ↔ coco)

| Clase | Dónde | Cuándo |
| --- | --- | --- |
| `g-container` | Raíz | Siempre |
| `g-container--width-{sm\|md\|lg\|xl\|2xl\|full\|reading}` | Raíz | Según `width` |
| `g-container--horizontal-{center\|start}` | Raíz | Según `horizontal` |
| `g-container--gutter-{auto\|none\|sm\|md\|lg}` | Raíz | Según `gutter` |
| `g-container--prose` | Raíz | Con `prose` |
| `g-container__body` | Columna | Siempre |
| `g-bleed`, `g-bleed-raw`, `g-wide` | Descendientes de la aplicación | Las pone la aplicación; las lee `GContainer.css` |

## Movimiento

Ninguno: cambiar de ancho (plegar la barra, redimensionar) no es un suceso del usuario y animarlo reflujaría el texto. Con `GAppShell`, el cambio de ancho llega una sola vez por A · Cortina.

## Peso y paquete (#723)

En el **principal** (`@grana/vue`), registrado en `src/index.js` y `components.css`. **Compuerta propia: ≤ 1 KiB (1024 B) gzip** de crecimiento de `dist/grana.js`, con sus guardas de avisos (#653.5); **medido 1015 B** (199f170; #746). Si la supera, pasa a la entrada reservada **`@grana/vue/layout`** junto con `GStack` y `GSection` (vuelve a lima). Compuerta de `dist`: `grep -q "g-container__body" packages/vue/dist/grana.css`.

## `meta.json` y tipos (#443)

`GContainer.meta.json`: las cinco props con valores y defaults, slot `default`, `events: []`, `methods: []`, `status: "draft"` hasta la auditoría de coco.

## Resolución de hallazgos de kiwi (L1 a L13)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| L1 | Nombre | `GContainer` / `g-container`; el README distingue «el contenedor (componente)» de «contenedor de consultas» (mora-docs) |
| L2 | API | `width`, `horizontal`, `gutter`, `as`, `prose` y `--g-container-max`; defecto `lg` (#722) |
| L3 | Tokens | Ninguno del tema; constantes y literales (#717) |
| L4 | `GPageHeader` | (a) **cerrado** (#751, #760; coco 13a4da3): de primer nivel en la columna, `GPageHeader` sangra como `g-bleed` (margen negativo con `--g-container-inset-*` y el mismo relleno); el `h1`, las pestañas, las acciones, el título compacto y el muelle quedan a ras de la columna y el fondo, la línea y la sombra del zócalo pegado llegan a los bordes de la caja; medido 0 px en los tres motores, con y sin chasis, LTR y RTL, `horizontal="start"`, con pestañas y en estrecho (`design/lab/container/l4-verificar.mjs`, 192/192 por motor); (b) el texto de su aviso 8: corregido (#724) |
| L5 | Anfitrionas | `.g-container__body`, `.g-surface`, `.g-dialog__body` (#722) |
| L6 | Contención | `api.md` «Contención en línea» (#722) |
| L7 | Sangrado fuera de sitio | Aviso 5 y receta del relleno propio |
| L8 | Reflujo | `overflow-wrap: break-word` en la columna, confirmado (#722) |
| L9 | `@property` | Públicas y privadas registradas; excepción en `levels.test.js` |
| L10 | `GTable` | Precisado por coco (#751): con `g-bleed`, la leyenda y las celdas se alinean con la columna en reposo; lo que no llega al borde de la caja es su desplazable interno cuando la tabla es más ancha. Adopción opcional más adelante (`PENDIENTES.md`) |
| L11 | Peso | Principal con compuerta (#723) |
| L12 | Complejidad | Complejo: coco y bruno en Opus (#722) |
| L13 | Receta de página | `as="main"` sin chasis, `as="div"` con chasis (#718); README |

## Fuera de v1 (reservado con nombre)

**C · Medida a la mano** (`adjustable`, `v-model:measure`, `labels`; asa con `role="separator"` de APG *Window Splitter* después del contenido, de 45 a 90 caracteres, guías sin reflujo hasta soltar; tiene sentido como **preferencia de lectura de toda la aplicación** que se pase a todos los contenedores; necesitaría JS y estado, y entrada propia). `horizontal="end"`. Adopción del sangrado en `GTable` (L10). (La decisión sobre el relleno lateral de `GPageHeader` dentro de la columna, L4a, está cerrada: #760.)

## Límites conocidos (para el README)

- **`GPageHeader` solo sangra de primer nivel** (hijo directo de la columna; #760). Dentro de un `GStack` u otro envoltorio conserva su relleno propio (`space × 6`, `space × 4` en estrecho) y queda por dentro de la columna; para alinearlo, que sea hijo directo. Sin verificar: de primer hijo de un contenedor anidado o dentro de `GSurface`/`.g-dialog__body` (margen 0: por cálculo no sangra).
- **`GTable` con `g-bleed`:** en reposo, la leyenda y las celdas se alinean con la columna; cuando la tabla es más ancha que la columna, su desplazable interno no llega al borde de la caja (L10, #751).
- **`prose`** selecciona elementos por etiqueta (`g-wide` para excluir); atraviesa `GStack`, `GSection` (su cuerpo, no su título ni su descripción) y las bandas `g-bleed`/`g-bleed-raw`, y no entra en otros componentes de Grana (#751).
- **Una banda solo sangra bien** si su caja ocupa la columna (aviso 5).
- **`--g-container-max`** no pasa a contenedores anidados (`inherits: false`).

## Verificación

- **bruno (vitest):** etiqueta por `as`; clases por prop; `$attrs` a la raíz; los cinco avisos (el 3 con y sin `GAppShell`; el 5 con una banda dentro de un `GSurface`); SSR.
- **Playwright** (`tests/container.spec.mjs`, puerto propio, tres motores; las de `verificar.mjs` de kiwi como base): los cinco anchos en seis visores con y sin barra; margen continuo; anidado y dentro de `GSurface` sin acumular; `start` LTR y RTL; `g-bleed` (fondo al borde, texto alineado, desplazable alineado en reposo y al final) y `g-bleed-raw`; publicado en un descendiente profundo; `GPageHeader` real pegado toda la página y su muelle fijo al visor dentro del contenedor; dentro de `GAppShell` (la caja es el marco, el sangrado no pasa bajo el sidebar); `width="reading"` y `prose` con la fuente real; 320 × 256 sin desbordamiento; `contain-intrinsic-inline-size` en un padre que se ajusta.
- **coco:** `GContainer.css`; auditoría con un tema distinto (otro `space`); `forced-colors` (nada que perder: sin pintura).

## Encargos

- **coco (Opus):** `GContainer.css` (raíz con contención e intrínseco, columna en `cqi`, márgenes con área segura, anfitrionas, `start`, `--g-container-max`, B con las dos clases y los márgenes publicados, A con `reading` y `prose`), `@property` de las públicas y privadas; banco y `design/lab/container/estilo.md`; después, la auditoría.
- **bruno (Opus):** `GContainer.vue` (render por `as`, clases, avisos), pruebas, `meta.json`, registro en `src/index.js` y `components.css`, compuerta de peso y de `dist`, excepciones en `levels.test.js` (`--g-container-max`, `--g-container-inset-start`, `--g-container-inset-end`), spec y ejemplo en el playground.
- **mora-docs (Sonnet):** `GContainer/README.md`: las dos recetas (con y sin chasis), `g-bleed` con la receta del relleno propio, `prose` y `g-wide`, límites.
