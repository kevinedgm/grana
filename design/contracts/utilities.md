# Contrato · Clases utilitarias

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #804 a #811, 2026-10-22; `tokens.md` §55; `api.md` «Clases utilitarias») · **Basado en:** decisión de producto del usuario del 2026-10-22 (eligió **A · escala de tokens** frente a una escala en píxeles, y el alcance en tres grupos: espacio, disposición, texto y forma)
**Prefijo:** `g-` · **Categoría:** utilidades de la aplicación · **Paquete:** dentro de `@grana/vue/style.css` y suelto como `@grana/vue/utilities.css` (#810)
**Lista canónica:** [`utilities.json`](utilities.json) (229 clases, en el orden de las reglas). Las tablas de este contrato son su lectura; **si difieren, manda el JSON**.

**Sin ronda de kiwi (#804):** las utilidades no tienen forma visible, estados ni comportamiento propios (como `GStack`, #719, «sin forma visible propia»); cada clase es una declaración CSS de un token que ya existe. No aplica «conceptos antes que caja» (#362); sí «Qué lo hace distinto». **No es complejo:** coco y bruno en Sonnet. **Rúbrica de movimiento:** no aplica (ninguna utilidad anima, transiciona ni cambia de forma).

## Promesa

Un **ajuste puntual** de la aplicación, entre o dentro de componentes, que habla el mismo idioma que el tema: `g-p-4` es `padding: var(--g-space-4)`, `g-text-caption` es el rol `caption` del tema, `g-radius-lg` es el radio `lg` del tema. Ningún número escrito a mano, ninguna regla con `!important` y ningún caso en que una utilidad gane a la aplicación.

## Qué lo hace distinto (#807, decisión de personalidad del lote)

1. **La escala es la del tema, no una de píxeles.** El sufijo de la clase es el sufijo del token: con `space` 5 en `grana.config.json`, `g-p-4` pasa de 16 a 20 px **en toda la página a la vez**, junto con los componentes; con `fontSize` 18, `g-text-body` sigue al cuerpo de los componentes. Una utilidad nunca desacompasa una pantalla del resto de Grana.
2. **Ejes lógicos por construcción.** Solo `t b s e x y` (bloque inicial/final, línea inicial/final, línea, bloque): no hay `l` ni `r`, así que una pantalla escrita con utilidades se da la vuelta en `dir="rtl"` sin tocar una clase. `w`/`h` son `inline-size`/`block-size`.
3. **Sin breakpoints ni variantes de estado.** Grana compone por tamaño intrínseco y consultas de contenedor (#34, #362), no por el ancho de la pantalla; una utilidad `md:` reintroduciría lo que los componentes evitan. La respuesta al ancho es de `GAdaptiveLayout`, `GStack` (que siempre se parte) y `GContainer`.
4. **Gana sin `!important` y pierde ante la aplicación.** Una capa propia, `grana.utilities`, después de la de los componentes y los blocks: la utilidad gana a cualquier regla de Grana y cualquier regla de la aplicación sin capa le gana a ella (#4, #516). La salida de la aplicación nunca se cierra.
5. **Respeta `hidden`.** Una utilidad de `display` no muestra un elemento con el atributo `hidden` (el error clásico de `class="flex" hidden`): se aplica con `:where(:not([hidden]))`, sin subir la especificidad.

## Cuándo usarlo (fronteras, #807)

Las utilidades son el **ajuste puntual de la aplicación**; **no sustituyen** a las primitivas de composición. Si el ajuste se repite en una pantalla, lo que falta es una primitiva, no más clases.

| Necesito | Uso | No |
| --- | --- | --- |
| Apilar bloques de una página o de un panel con ritmo | **`GStack`** (`gap` como relación, #719) | `g-flex g-flex-col g-gap-6` repetido en cada sección |
| Separar **una** pieza más o menos de lo habitual dentro de una pila | **`g-mt-*` / `g-mb-*`** sobre el hijo (gana a la puesta a 0 de `GStack`, se **suma** a su `gap`; intención explícita de la aplicación, sin aviso) | Cambiar el `gap` de toda la pila |
| Campos de un formulario | `GFormLayout` + `GFormRow` (#171, #361) | Utilidades de anchura, margen o alineación sobre campos dentro de una fila: rompen la distribución obligatoria (#184) y quedan fuera de contrato |
| Ocultar un campo según otro | `GFormReveal` (#274) | `g-hidden` en un campo de `GForm`: sigue registrado, valida y puede bloquear el envío con un error que no se ve |
| Repartir hijos en líneas por su tamaño | `GAdaptiveLayout` con las pistas `g-adapt-*` (#364) | `g-grow`/`g-w-full` sobre sus hijos |
| Relleno, fondo, borde y radio de una caja con superficie | **`GSurface`** / `GCard` | `g-p-4 g-radius-lg` más un fondo propio de la aplicación (una superficie a medias, sin zona ni contraste del tema) |
| Un relleno o un radio sobre un elemento propio sin superficie (una celda, un hueco de un slot) | **`g-p-*`, `g-radius-*`** | — |
| La columna de la página y el sangrado | `GContainer` (`g-bleed`, `g-bleed-raw`, #721) | Márgenes negativos (no existen, #809) |
| Un título con nivel por anidación | `GSection` (#720) | `<h2 class="g-text-title">` cuando la jerarquía es de la página |
| Un texto de la aplicación con el tamaño de un rol del tema | **`g-text-{rol}`** | `font-size` escrito a mano |
| Una fila de piezas que se parte | `GStack orientation="horizontal"` | `g-flex` sin `g-flex-wrap` (no se parte: 1.4.10 queda en manos de la aplicación) |
| Repartir con `between`/`around`/`evenly` | **`g-justify-*`** (no existe en `GStack`, que no reparte) | — |
| Texto solo para lectores de pantalla | **`g-sr-only`** | `g-hidden` (lo quita también del árbol de accesibilidad) |

### Sobre la raíz de un componente de Grana: exterior sí, interior no (#807)

| Clase | En la raíz de un componente |
| --- | --- |
| Márgenes (`g-m*`), `g-self-*`, `g-grow`, `g-shrink-0`, `g-w-full`, `g-min-w-0`, `g-hidden` | **Sí (exterior):** colocan el componente entre sus vecinos; son API estable. Si el componente tiene una prop para lo mismo, se usa la prop (`GBtn block` antes que `g-w-full`) |
| Relleno (`g-p*`), `display`, `g-flex-*`, `g-items-*`, `g-justify-*`, `gap`, texto (`g-text-*`, `g-font-*`, `g-truncate`), `g-radius-*`, `g-h-full`, `g-sr-only` | **Fuera de contrato (interior):** ganan (por capa) y por eso pueden romper alturas de contrato, rejillas, el área táctil o la tipografía del componente (§23). No se abren defectos por su efecto; la forma de cambiar el interior es la prop, el tema o una regla de la aplicación sobre el componente (como #204) |

Dentro de los slots, sobre elementos de la aplicación, todas las utilidades son API estable.

## Uso

```vue
<GStack gap="md">
  <GSection title="Pedidos">…</GSection>
  <p class="g-text-body-sm g-text-muted g-mt-2">Actualizado hace 5 min</p>  <!-- se suma al gap de la pila -->
</GStack>

<div class="g-flex g-flex-wrap g-items-center g-gap-2">
  <GAvatar … /><span class="g-truncate g-min-w-0 g-grow">Nombre muy largo…</span>
</div>

<GBtn class="g-ms-auto">Guardar</GBtn>   <!-- exterior: empuja el botón al final de la línea, también en RTL -->
<span class="g-sr-only">(abre en una pestaña nueva)</span>
```

## Clases

**Pasos de espacio** (`{paso}`): `0` y la escala existente `1 2 3 4 5 6 8 12 16` → `0` o `var(--g-space-{paso})` (`tokens.md` §4). Diez pasos, sin negativos (#809).

**Ejes** (`{eje}`): sin eje = los cuatro lados; `x` = línea; `y` = bloque; `t` = bloque inicial; `b` = bloque final; `s` = línea inicial; `e` = línea final.

### Espacio (177)

| Patrón | Declaración | Clases |
| --- | --- | --- |
| `g-m-{paso}` | `margin` | 10 |
| `g-mx-{paso}` · `g-my-{paso}` | `margin-inline` · `margin-block` | 20 |
| `g-mt-{paso}` · `g-mb-{paso}` · `g-ms-{paso}` · `g-me-{paso}` | `margin-block-start` · `margin-block-end` · `margin-inline-start` · `margin-inline-end` | 40 |
| `g-m-auto`, `g-mx-auto`, `g-my-auto`, `g-mt-auto`, `g-mb-auto`, `g-ms-auto`, `g-me-auto` | la propiedad de su eje con `auto` (solo márgenes) | 7 |
| `g-p-{paso}`, `g-px-{paso}`, `g-py-{paso}`, `g-pt-{paso}`, `g-pb-{paso}`, `g-ps-{paso}`, `g-pe-{paso}` | `padding`, `padding-inline`, `padding-block`, `padding-block-start`, `padding-block-end`, `padding-inline-start`, `padding-inline-end` | 70 |
| `g-gap-{paso}` · `g-gap-x-{paso}` · `g-gap-y-{paso}` | `gap` · `column-gap` · `row-gap` | 30 |

`g-my-auto` completa el juego de ejes (no estaba en la lista del encargo; deriva de la regla de ejes, #805).

### Disposición (30)

| Clase | Declaración |
| --- | --- |
| `g-block`, `g-inline`, `g-inline-block`, `g-flex`, `g-inline-flex`, `g-grid` | `display: block` · `inline` · `inline-block` · `flex` · `inline-flex` · `grid`; selector **`.g-{clase}:where(:not([hidden]))`** (#808) |
| `g-hidden` | `display: none` (última de las de `display`: gana a cualquiera de ellas) |
| `g-flex-row` · `g-flex-col` · `g-flex-wrap` | `flex-direction: row` · `flex-direction: column` · `flex-wrap: wrap` |
| `g-items-{start\|center\|end\|stretch\|baseline}` | `align-items: start` · `center` · `end` · `stretch` · `baseline` |
| `g-justify-{start\|center\|end\|between\|around\|evenly}` | `justify-content: start` · `center` · `end` · `space-between` · `space-around` · `space-evenly` |
| `g-self-{start\|center\|end\|stretch}` | `align-self: start` · `center` · `end` · `stretch` |
| `g-grow` · `g-shrink-0` | `flex-grow: 1` · `flex-shrink: 0` |
| `g-w-full` · `g-h-full` · `g-min-w-0` | `inline-size: 100%` · `block-size: 100%` · `min-inline-size: 0` |

`start`/`end` (no `flex-start`/`flex-end`): valen igual en flex y en rejilla y siguen la dirección del texto; coco lo mide en WebKit (Verificación b).

### Texto y forma (21)

| Clase | Declaración |
| --- | --- |
| `g-text-{caption\|body-sm\|body\|title-sm\|title\|title-lg}` | `font-size: var(--g-text-{rol}-size)`; `line-height: var(--g-text-{rol}-line)`; `letter-spacing: var(--g-text-{rol}-tracking)`; `font-weight: var(--g-text-{rol}-weight)` (los cuatro del rol, §5; la familia no) |
| `g-text-muted` · `g-text-subtle` | `color: var(--g-color-text-muted)` · `color: var(--g-color-text-subtle)` |
| `g-text-start` · `g-text-center` · `g-text-end` | `text-align: start` · `center` · `end` |
| `g-truncate` | `overflow: hidden`; `text-overflow: ellipsis`; `white-space: nowrap` |
| `g-font-ui` · `g-font-title` | `font-family: var(--g-font-ui)` · `font-family: var(--g-font-title)` |
| `g-radius-{none\|xs\|sm\|md\|lg\|xl\|pill}` | `border-radius: var(--g-radius-{paso})` |

`g-font-title` se añade a `g-font-ui` (el encargo lo dejaba opcional): `g-text-title*` no fija la familia (#753: los componentes ponen `--g-font-title` solo en la profundidad 1), y sin ella un título de la aplicación no podría seguir la familia de títulos del tema.

### Accesibilidad (1)

| Clase | Declaración |
| --- | --- |
| `g-sr-only` | `position: absolute`; `inline-size: 1px`; `block-size: 1px`; `padding: 0`; `margin: -1px`; `overflow: hidden`; `clip-path: inset(50%)`; `white-space: nowrap`; `border: 0` (patrón de texto oculto accesible, `tokens.md` §7; última regla del archivo) |

## Reglas (#806, #808)

1. **Solo `var(--g-*)`**, sin respaldos y sin literales de tema. Valores sin medida admitidos (lista exacta en `utilities.json`, `allowedLiterals`): `0`, `auto`, `1`, `100%`, `none` y las palabras clave de `display`, `flex-*`, alineación, `overflow`, `text-overflow` y `white-space` de las tablas. `g-sr-only` además: `absolute`, `1px`, `-1px`, `inset(50%)` (`allowedLiteralsSrOnly`). **Ningún token nuevo** (`tokens.md` §55).
2. **Sin `!important`** en ninguna regla, ni en `utilities.css` ni en el `dist/`.
3. **Capa `grana.utilities`**, la última de Grana. Orden completo: `@layer grana.defaults, grana.components, grana.blocks, grana.utilities;`, declarado al principio de **cada** punto de entrada de CSS de Grana (`grana.css`, `utilities.css` suelto, `components.css` de `@grana/blocks`): el orden de las capas lo fija la primera vez que aparece cada nombre, y así da igual qué hoja cargue primero. `grana.blocks` se declara aunque esté vacía (sin `@grana/blocks` no cuesta nada). Sin esto, un `utilities.css` cargado antes que `grana.css` dejaría las utilidades como la capa **más débil**. El CSS de la aplicación, sin capa, gana a todo.
4. **Especificidad única `0,1,0`** en todas las reglas (una clase; la guarda de `hidden` va en `:where()`). Dentro de la capa decide el **orden del archivo**, que es el del arreglo de `utilities.json`: en cada familia, primero los cuatro lados, luego los ejes (`x`, `y`) y luego los lados (`t`, `b`, `s`, `e`), así que `g-p-4 g-pt-0` deja 0 arriba y `g-mx-auto g-ms-0` deja `auto` solo al final. `g-hidden` después de las demás de `display`; `g-sr-only` la última.
5. **`hidden` manda (#808):** las seis utilidades de `display` llevan `:where(:not([hidden]))`; con el atributo `hidden` (también `hidden="until-found"`) el elemento sigue oculto como lo deja el navegador. Las demás utilidades no lo necesitan (no muestran nada).
6. **Sin densidad (#808):** las utilidades leen el token tal cual; `density` es local de un componente (`api.md`) y una utilidad no tiene contexto de componente. `g-p-4` mide `--g-space-4` dentro de un `GDialog density="compact"`.
7. **Siguen al esquema y a la zona:** el oscuro y la zona de marca (§44.5) redeclaran `--g-color-text-muted` y `--g-color-text-subtle`; `g-text-muted` dentro de `zone="brand"` lee el de la zona. Los dos cumplen ≥ 4.5:1 sobre `bg`, `surface` y `surface-sunken` (§15); sobre un fondo propio de la aplicación, el contraste es de la aplicación.
8. **Mínimo de texto (§7):** `caption` (0,75 rem = 12 px con la raíz a 16 px) es el rol más pequeño y es el mínimo; ninguna utilidad baja de ahí. La aplicación no combina `g-text-caption` con un `font-size` menor propio.
9. **`g-sr-only` nunca en un elemento enfocable ni en un antepasado de uno:** el foco caería en algo invisible (2.4.7). El enlace de salto con texto que aparece al enfocar está reservado (`g-sr-only-focusable`, #809).
10. **`g-truncate` corta la vista, no el contenido:** el texto completo sigue en el DOM (lo lee el lector), pero quien ve necesita otra forma de leerlo si importa (`GTooltip`, un detalle). Necesita un ancho que lo limite: en una fila flex, con `g-min-w-0`.
11. **Sin JS y sin avisos de desarrollo:** son CSS puro; los usos fuera de contrato de la tabla «exterior / interior» no se detectan.
12. **Sin nombres de componente que choquen:** los prefijos de las utilidades quedan reservados para componentes futuros (#809): un `GGrid`, `GFlex`, `GText`, `GBlock`, `GInline`, `GHidden`… no puede tener la etiqueta `g-grid`, `g-flex`…; ni ningún componente una clase que empiece por `g-m-`, `g-p-`, `g-gap-`, `g-text-`, `g-items-`, `g-justify-`, `g-self-`, `g-radius-`, `g-font-`, `g-w-`, `g-h-`, `g-min-w-` con los sufijos de este contrato. Hoy no hay ninguna colisión (comprobado sobre `packages/vue/src`, 2026-10-22).

## Reservados (#809)

| Reservado | Por qué |
| --- | --- |
| Pasos negativos (`g-mt-n4`…) | El uso común, sacar algo hasta el borde, es `g-bleed`/`g-bleed-raw` de `GContainer` (#721), que conoce el margen real; un negativo a ciegas solapa piezas y rompe el reflujo (1.4.10). Se abre con un caso que el sangrado no cubra |
| Variantes por ancho (`md:`, `lg:`) | Grana no usa consultas de ancho de pantalla (#34, #362); la respuesta al tamaño es de las primitivas. Una variante por contenedor necesitaría un contenedor con nombre: se valora si aparece el caso |
| Variantes de estado (`hover:`, `focus:`, `dark:`) | El estado es de los componentes (y del tema para el oscuro); una utilidad de foco podría quitar el foco visible (§7) |
| `l`/`r` (`g-ml-*`, `g-pr-*`) | Solo ejes lógicos (#805) |
| `g-text-display`, `g-font-display` | `display` es el rol de `GHero` y los titulares de marketing (§51); fuera del alcance aprobado. Coste despreciable si el usuario lo pide |
| `g-radius-shape` | `--g-radius-shape` es la forma de los **controles** (`shape` del tema); en una caja de la aplicación acoplaría esa caja a los botones |
| `g-sr-only-focusable` | Necesita `:focus-visible` (una variante de estado) y su propia forma visible |
| `g-flex-row-reverse`, `g-flex-col-reverse`, `g-order-*` | Orden visual distinto del DOM (1.3.2, 2.4.3), como `GStack` |
| `g-flex-nowrap`, `g-inline-grid`, columnas de rejilla (`g-cols-*`), anchos fraccionarios (`g-w-1/2`) | Filas y columnas declaradas son lo que `GAdaptiveLayout` y `GFormRow` evitan o resuelven; `nowrap` es el valor inicial de flex |
| Fondo, borde, sombra (`g-bg-*`, `g-border-*`, `g-shadow-*`) | Son la superficie: `GSurface` (zona, contraste, delimitación del tema) |
| Posición, capa y desbordamiento (`g-relative`, `g-absolute`, `g-z-*`, `g-overflow-*`, `g-sticky`) | Lo pegado y lo flotante tienen orden de borde (`EDGE_ORDER`) y receta de cabecera fija (#515, #629); una utilidad de `z-index` lo rompería |
| `!important` o una variante «fuerte» | #204, #516: quitaría a la aplicación su salida |

## Verificación (#811)

- **(a) bruno · prueba de Vitest** (`packages/vue/src/styles/utilities.test.js`): lee `utilities.css` y `design/contracts/utilities.json` y comprueba (1) que el conjunto **y el orden** de selectores coincide con el JSON (229), (2) que cada declaración es exactamente la del JSON, (3) que todo valor es `var(--g-…)` sin coma (sin respaldo) o un literal de `allowedLiterals` (los de `allowedLiteralsSrOnly` solo en `g-sr-only`), (4) que no hay `!important`, (5) que todo token leído existe en `defaults.css`, (6) que las seis de `display` llevan `:where(:not([hidden]))` y ninguna otra, y (7) que `dist/utilities.css` empieza por la declaración de orden completa y envuelve sus reglas en `@layer grana.utilities`.
- **(b) coco · banco** `design/lab/utilities/estilo-banco.html` con verificación propia en Playwright (`design/lab/utilities/verificar.mjs`, puerto propio, tres motores): `g-p-4` mide 16 px con el tema por defecto y 20 px con un tema del CLI con `space` 5 (todos los `--g-space-*`); `g-ms-4` cae a la izquierda en `ltr` y a la derecha en `dir="rtl"`; `g-mt-4` sobre un hijo directo de `GStack` gana a su margen 0 (16 px de margen además del `gap`) y **pierde** ante una regla de la aplicación sin capa; la misma utilidad gana a una regla de `grana.components` de mayor especificidad; `g-flex` con `hidden` sigue oculto y sin `hidden` es `flex`; `g-hidden` gana a `g-flex`; `g-p-4 g-pt-0` deja 0 arriba; `g-items-start`/`g-justify-end` en flex y en rejilla en los tres motores (incluido WebKit); `g-text-*` mide lo que su rol en el tema por defecto y en otro tema, y `caption` ≥ 12 px; `g-text-muted` dentro de `zone="brand"` lee el de la zona; `utilities.css` suelto cargado **antes** que `grana.css` sigue ganando a los componentes.
- **(c) `g-sr-only`** sigue en el árbol de accesibilidad (nombre accesible de un botón con icono y texto `g-sr-only`, leído con `page.accessibility` o `getByRole(…, { name })`) y no ocupa sitio (0 de desplazamiento en su fila); con `g-hidden`, en cambio, sale del árbol.
- **(d) Mínimo de texto:** ninguna `g-text-*` por debajo de 12 px en el tema por defecto ni en un tema del CLI con `fontSize` mínimo.
- **Compuertas de `dist`** (bruno, en `gates.sh`): `grep -q "g-mx-auto" packages/vue/dist/grana.css`, `grep -q "g-sr-only" packages/vue/dist/grana.css`, `test -f packages/vue/dist/utilities.css`, `! grep -q "!important" packages/vue/dist/utilities.css`, `grep -q "grana.utilities" packages/vue/dist/utilities.css` y, sobre `grana.css`, que la declaración de orden incluye `grana.blocks` y `grana.utilities` (la forma exacta del `grep` la fija bruno según la salida minificada).

## Paquete y peso (#810)

- **Fuente:** `packages/vue/src/styles/utilities.css` (**coco**), sin capa propia dentro del archivo, como el CSS de los componentes. **bruno** lo importa en `grana.css` con `@import url("./utilities.css") layer(grana.utilities);` y cambia la declaración de orden a la de la regla 3.
- **Suelto:** `@grana/vue/utilities.css` → `./dist/utilities.css` en `exports` (como `./style.css` y `./fonts.css`; un CSS no va en `typesVersions` ni en `ENTRIES`). Lo genera el build de bruno (fuera de Vite, como `fonts.css`): la declaración de orden completa y las reglas dentro de `@layer grana.utilities { … }`. Es para quien usa los tokens de Grana sin los componentes; **necesita los tokens** (`style.css`, que ya incluye las utilidades, o un tema completo del CLI). Con `style.css` no hace falta cargarlo.
- **Peso:** tope **≤ 3 KiB (3072 B) gzip** (`gzip -9`) de crecimiento de `dist/grana.css` sobre la medida inmediatamente anterior a añadirlas; bruno mide y registra en `CHANGELOG.md` y `CLAUDE.md` (como #723). Estimación de lima: unas 1,8 KiB gzip el archivo suelto minificado. Si se supera, vuelve a lima (opciones: recortar pasos o sacar las utilidades de `style.css` y dejarlas solo sueltas). No afecta a `grana.js` ni al UMD.

## Estado (#811)

No hay `meta.json` (no es componente). El estado vive en este contrato:

| Estado | Cuándo |
| --- | --- |
| `contratado` | Este contrato y `utilities.json` (hoy) |
| `draft` | Con `utilities.css` de coco, el import, el `export`, la prueba (a) y las compuertas de bruno |
| `candidate` | Tras la auditoría de coco con el banco (b) a (d) en los tres motores, en `design/lab/utilities/auditoria.md`; lima actualiza esta cabecera |

**README:** `packages/vue/src/styles/README-utilities.md` (**mora-docs**), desde `utilities.json` y este contrato, con la tabla de fronteras, la regla exterior/interior y la receta de capas; además, una página «Utilidades» en el sitio (`site/`), fuera de la lista de componentes.

## Límites conocidos

- **Un tema escrito a mano que cambie solo `--g-space-1`** mueve los componentes (que calculan `space × n`) pero no las utilidades (que leen `--g-space-{n}`): §4 define los nueve pasos como `space × n` y el CLI los emite todos; un `tokens.css` a mano debe redeclarar los nueve. Es la consecuencia de la escala A elegida por el usuario (el sufijo es el token, #804), no un defecto.
- **Estilos en línea:** una propiedad que el `.vue` de un componente escribe en `style` (posiciones, alias `--_*`) gana a cualquier capa; una utilidad no la cambia.
- **`GStack divided`** no detecta un hijo oculto por una clase (`stack.md` «Reglas de los hijos» 4); con `g-hidden` o `g-sr-only` es detectable porque la clase es de Grana (pendiente de coco, abajo).

## Pendientes por rol

- **coco (Sonnet):** `packages/vue/src/styles/utilities.css` transcrito de `utilities.json` en su orden (229 reglas, guarda de `hidden`, sin `!important`); banco `design/lab/utilities/estilo-banco.html` y `verificar.mjs` (b, c, d); auditoría en `design/lab/utilities/auditoria.md` con «Cumplimientos / Correcciones / Pendientes». Valorar en `GStack.css` que `divided` trate `.g-hidden` y `.g-sr-only` como `[hidden]` (coherencia, no bloquea).
- **bruno (Sonnet):** `grana.css` (declaración de orden de la regla 3 e `@import … layer(grana.utilities)`), `./utilities.css` en `exports` de `packages/vue/package.json` y su generación en el build, `utilities.test.js` (a), compuertas en `.github/scripts/gates.sh`, medida de peso en `CHANGELOG.md` y `CLAUDE.md`; en `packages/blocks/src/components.css`, la declaración de orden con `grana.utilities` al final.
- **mora-docs (Sonnet):** `packages/vue/src/styles/README-utilities.md` y la página del sitio; actualizar la receta de capas de #516 en los README y páginas que la citan (`GAccordion` y `site/src/**/accordion.md`): `@layer base, grana.defaults, grana.components, grana.blocks, grana.utilities;` (la receta anterior sigue siendo correcta: `grana.css` añade las dos que faltan detrás).
- **Agente principal:** `AGENTS.md` no es de lima: anotar que `packages/vue/src/styles/utilities.css` es de coco y su import en `grana.css`, la generación de `dist/utilities.css` y la prueba son de bruno. Fila nueva en `README.md` raíz (`@grana/vue/utilities.css`) y en `CLAUDE.md` al cerrar el lote.
