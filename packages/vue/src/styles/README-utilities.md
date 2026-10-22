# Clases utilitarias

229 clases `g-*` para el **último ajuste** de tu página: un margen, una fila, el tamaño de un texto. No son una escala de píxeles: **hablan el idioma del tema**. `g-p-4` es `padding: var(--g-space-4)`, `g-text-caption` es el rol `caption` del tema, `g-radius-lg` es el radio `lg`. Sin `!important`, sin breakpoints y sin colores propios: el color lo pone el tema.

**Etiqueta:** `class="g-…"` (sin componente) · **Estado:** `draft` (contratada, construida e integrada; pasa a `candidate` tras la auditoría de coco, que aún no existe en `design/lab/utilities/auditoria.md`) · **Desde:** sin publicar (`0.1.0-beta.0`, [`CHANGELOG.md`](../../../../CHANGELOG.md))

```js
import '@grana/vue/style.css'      // ya incluye las utilidades
```

```js
import '@grana/vue/utilities.css'  // solo las utilidades; necesita los tokens (ver «Uso»)
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio.

> **Son un ajuste puntual, no composición.** Para apilar bloques usa `GStack`; para los campos de un formulario, `GFormLayout` + `GFormRow`; para una caja con superficie, `GSurface`. Si repites el mismo ajuste en una pantalla, lo que falta es una de esas piezas, no más clases. Ver «Cuándo usarlas».

## En esta página

[§ Uso](#uso) · [§ Cuándo usarlas](#cuándo-usarlas) · [§ Ejemplos](#ejemplos) · [§ Clases](#clases) · [§ Sobre la raíz de un componente](#sobre-la-raíz-de-un-componente) · [§ Capas y especificidad](#capas-y-especificidad) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

Con `@grana/vue/style.css` no hay nada más que hacer: las utilidades ya vienen dentro, en la capa `grana.utilities`.

```vue
<GStack gap="md">
  <p>Resultado de hematología: sin alteraciones.</p>
  <p class="g-text-body-sm g-text-muted g-mt-2">Actualizado hace 5 min</p>
</GStack>

<GBtn class="g-ms-auto">Guardar</GBtn>
<span class="g-sr-only">(abre en una pestaña nueva)</span>
```

**Solo las utilidades.** Si usas los tokens de Grana sin los componentes, carga `@grana/vue/utilities.css` (1 892 B gzip). La hoja declara ella misma el orden de capas, así que da igual si la cargas antes o después de otra hoja de Grana. **Necesita los tokens**: un tema completo de `@grana/cli` o `@grana/vue/style.css`. Con `style.css` no hace falta cargarla además.

**Si tienes estilos de elemento propios** (un `h3 { margin: … }` o un reinicio de terceros), declara las capas de Grana detrás de la tuya para que no ganen a los componentes. La receta completa, con las cinco capas, es la de [`docs/contract/api.md`](../../../../docs/contract/api.md) «Estilos de elemento de la aplicación»:

```css
@layer base, grana.defaults, grana.components, grana.blocks, grana.utilities;
@layer base { h1, h2, h3, h4, h5, h6 { margin-block: 1.5em 0.5em; } }
```

La receta anterior, `@layer base, grana.defaults, grana.components;`, **sigue siendo correcta**: `grana.css` declara el orden completo y añade las dos capas que faltan detrás.

## Cuándo usarlas

| Necesito | Uso | No |
| --- | --- | --- |
| Apilar bloques de una página o de un panel con ritmo | `GStack` | `g-flex g-flex-col g-gap-6` repetido en cada sección |
| Separar **una** pieza más o menos de lo habitual dentro de una pila | `g-mt-*` / `g-mb-*` sobre el hijo (gana a la puesta a 0 de `GStack` y **se suma** a su `gap`; es intención explícita de tu aplicación, sin aviso) | Cambiar el `gap` de toda la pila |
| Campos de un formulario | `GFormLayout` + `GFormRow` | Utilidades de anchura, margen o alineación sobre campos dentro de una fila: rompen la distribución obligatoria y quedan fuera de contrato |
| Ocultar un campo según otro | `GFormReveal` | `g-hidden` en un campo de `GForm`: sigue registrado, valida y puede bloquear el envío con un error que no se ve |
| Repartir hijos en líneas según su tamaño | `GAdaptiveLayout` con las pistas `g-adapt-*` | `g-grow` o `g-w-full` sobre sus hijos |
| Relleno, fondo, borde y radio de una caja con superficie | `GSurface` o `GCard` | `g-p-4 g-radius-lg` más un fondo propio: una superficie a medias, sin zona ni contraste del tema |
| Relleno o radio de un elemento propio **sin** superficie (una celda, un hueco de un slot) | `g-p-*`, `g-radius-*` | — |
| La columna de la página y el sangrado | `GContainer` (`g-bleed`, `g-bleed-raw`) | Márgenes negativos (no existen) |
| Un título con nivel por anidación | `GSection` | `<h2 class="g-text-title">` cuando la jerarquía es de la página |
| Un texto tuyo con el tamaño de un rol del tema | `g-text-{rol}` | `font-size` escrito a mano |
| Una fila de piezas que se parte | `GStack orientation="horizontal"` | `g-flex` sin `g-flex-wrap` (no se parte: el reflujo a 320 px queda en tus manos) |
| Repartir con `between`, `around` o `evenly` | `g-justify-*` (en `GStack` no existe) | — |
| Texto solo para lectores de pantalla | `g-sr-only` | `g-hidden`: lo quita también del árbol de accesibilidad |

## Ejemplos

### e1 · Separar una pieza más de lo habitual dentro de una pila

```vue demo
<GStack gap="sm">
  <p>Resultado de hematología: sin alteraciones.</p>
  <p>Resultado de química sanguínea: pendiente de validar.</p>
  <p class="g-text-body-sm g-text-muted g-mt-4">Actualizado hace 5 min por el laboratorio central.</p>
</GStack>
```

**Por qué:** la pila ya reparte el aire entre sus hijos; la nota de actualización pertenece al conjunto, no a un resultado, y pide algo más de distancia. `g-mt-4` sobre **ese hijo** gana a la puesta a 0 de `GStack` y se suma al `gap`, sin tocar el ritmo del resto. Si todos los hijos necesitan más aire, cambia el `gap` de la pila, no pongas la clase en cada uno.

### e2 · Una fila con la acción al final

```vue demo
<div class="g-flex g-flex-wrap g-items-center g-gap-2">
  <span class="g-text-body-sm">Resultado pendiente de validar</span>
  <GBtn class="g-ms-auto" variant="outline" color="neutral" size="sm">Rechazar</GBtn>
  <GBtn size="sm">Validar</GBtn>
</div>
```

**Por qué:** una línea de texto con dos acciones que van al final es el caso típico donde `GStack` no llega (no reparte). `g-ms-auto` empuja los botones al final de la línea y, como es un eje lógico, también en `dir="rtl"`. `g-flex-wrap` deja que pasen a otra línea en un contenedor estrecho en lugar de desbordar. Los márgenes sobre la raíz de un componente son la parte **exterior** y estable; ver «Sobre la raíz de un componente».

### e3 · Texto de apoyo con el tamaño y el color del tema

```vue demo
<div>
  <p class="g-text-title-sm g-font-title">Informe de laboratorio</p>
  <p class="g-text-body">Muestra recibida el 21 de octubre, sin incidencias.</p>
  <p class="g-text-caption g-text-subtle">Folio 4821 · turno matutino</p>
</div>
```

**Por qué:** el tamaño, la interlínea, el tracking y el peso salen del rol del tema, y el color del par `muted`/`subtle`, que el tema garantiza con contraste suficiente y redeclara en oscuro. Si cambias `fontSize` en `grana.config.json`, estas líneas siguen al cuerpo de los componentes. `g-text-title-sm` no fija la familia: `g-font-title` la añade. Si lo que necesitas es un **título de sección** con nivel, es `GSection`.

### e4 · Un nombre accesible más largo que lo que se ve

```vue demo
<GBtn variant="ghost" color="danger" size="sm">
  <span class="g-sr-only">Eliminar el expediente 4821</span>
  <span aria-hidden="true">Eliminar</span>
</GBtn>
```

**Por qué:** en una lista con varios «Eliminar», quien usa lector de pantalla necesita saber **cuál**. El texto con `g-sr-only` no ocupa sitio, no se ve y sigue en el árbol de accesibilidad: el botón mide lo mismo que sin él y su nombre es «Eliminar el expediente 4821». El `aria-hidden` evita que el lector diga «Eliminar» dos veces. No sirve `g-hidden` aquí: lo quita del árbol.

## Clases

La lista completa y su orden exacto es [`design/contracts/utilities.json`](../../../../design/contracts/utilities.json); aquí están las familias y su fórmula. Cada clase es **una sola declaración** (las de texto, las cuatro del rol; `g-sr-only`, las del patrón de texto oculto).

**Pasos de espacio `{paso}`:** `0` y `1 2 3 4 5 6 8 12 16`, que leen `var(--g-space-{paso})`. Con el tema por defecto son 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 px. Diez pasos, sin negativos.

**Ejes `{eje}`:** sin eje = los cuatro lados · `x` = línea · `y` = bloque · `t` = bloque inicial · `b` = bloque final · `s` = línea inicial · `e` = línea final. **No hay `l` ni `r`.**

### Espacio (177)

| Patrón | Declaración | Clases |
| --- | --- | --- |
| `g-m-{paso}` · `g-mx-` · `g-my-` · `g-mt-` · `g-mb-` · `g-ms-` · `g-me-` | `margin`, `margin-inline`, `margin-block`, `margin-block-start`, `margin-block-end`, `margin-inline-start`, `margin-inline-end` | 70 |
| `g-m-auto` · `g-mx-auto` · `g-my-auto` · `g-mt-auto` · `g-mb-auto` · `g-ms-auto` · `g-me-auto` | la propiedad de su eje con `auto` (solo márgenes) | 7 |
| `g-p-{paso}` · `g-px-` · `g-py-` · `g-pt-` · `g-pb-` · `g-ps-` · `g-pe-` | `padding` y sus ejes lógicos | 70 |
| `g-gap-{paso}` · `g-gap-x-{paso}` · `g-gap-y-{paso}` | `gap` · `column-gap` · `row-gap` | 30 |

### Disposición (30)

| Clase | Declaración |
| --- | --- |
| `g-block` `g-inline` `g-inline-block` `g-flex` `g-inline-flex` `g-grid` | `display`. Respetan el atributo `hidden` (ver «Reglas que conviene saber») |
| `g-hidden` | `display: none`; gana a las seis anteriores |
| `g-flex-row` `g-flex-col` `g-flex-wrap` | `flex-direction: row` · `column` · `flex-wrap: wrap` |
| `g-items-{start\|center\|end\|stretch\|baseline}` | `align-items` |
| `g-justify-{start\|center\|end\|between\|around\|evenly}` | `justify-content` (`between` = `space-between`…) |
| `g-self-{start\|center\|end\|stretch}` | `align-self` |
| `g-grow` · `g-shrink-0` | `flex-grow: 1` · `flex-shrink: 0` |
| `g-w-full` · `g-h-full` · `g-min-w-0` | `inline-size: 100%` · `block-size: 100%` · `min-inline-size: 0` |

`start` y `end` (no `flex-start` ni `flex-end`) valen igual en flex y en rejilla y siguen la dirección del texto.

### Texto y forma (21)

| Clase | Declaración |
| --- | --- |
| `g-text-{caption\|body-sm\|body\|title-sm\|title\|title-lg}` | `font-size`, `line-height`, `letter-spacing` y `font-weight` del rol (la familia no) |
| `g-text-muted` · `g-text-subtle` | `color: var(--g-color-text-muted)` · `var(--g-color-text-subtle)` |
| `g-text-start` · `g-text-center` · `g-text-end` | `text-align` |
| `g-truncate` | `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap` |
| `g-font-ui` · `g-font-title` | `font-family: var(--g-font-ui)` · `var(--g-font-title)` |
| `g-radius-{none\|xs\|sm\|md\|lg\|xl\|pill}` | `border-radius: var(--g-radius-{paso})` |

### Accesibilidad (1)

| Clase | Declaración |
| --- | --- |
| `g-sr-only` | El patrón de texto oculto accesible: `position: absolute`, 1 × 1 px, `margin: -1px`, `overflow: hidden`, `clip-path: inset(50%)`, `white-space: nowrap`, sin borde ni relleno |

### Reglas que conviene saber

- **El orden del atributo `class` no importa; manda el orden de la hoja.** En cada familia van primero los cuatro lados, luego los ejes (`x`, `y`) y luego los lados (`t`, `b`, `s`, `e`): `g-p-4 g-pt-0` y `g-pt-0 g-p-4` dejan 0 arriba, y `g-mx-auto g-ms-0` deja `auto` solo al final.
- **`hidden` manda sobre `g-flex`.** Las seis utilidades de `display` no muestran un elemento con el atributo `hidden` (también `hidden="until-found"`): `class="g-flex" hidden` sigue oculto. `g-hidden`, en cambio, gana a cualquiera de ellas.
- **Sin densidad.** Una utilidad lee el token tal cual: `g-p-4` mide `--g-space-4` también dentro de un `GDialog density="compact"`.
- **Siguen al esquema y a la zona.** El tema oscuro y la zona de marca redeclaran `--g-color-text-muted` y `--g-color-text-subtle`; `g-text-muted` dentro de `zone="brand"` lee el de la zona.
- **`g-truncate` corta la vista, no el contenido.** Necesita un ancho que lo limite: en una fila flex, con `g-min-w-0`.
- **`GStack divided`** trata un hijo con `g-hidden` o `g-sr-only` como oculto (no le dibuja línea). Una clase propia que oculte con `display: none` no se detecta.

## Sobre la raíz de un componente

Las utilidades valen sobre tus elementos y **dentro de los slots** de cualquier componente. Sobre la **raíz** de un componente de Grana hay dos clases de utilidad:

| Clase | En la raíz de un componente |
| --- | --- |
| Márgenes (`g-m*`), `g-self-*`, `g-grow`, `g-shrink-0`, `g-w-full`, `g-min-w-0`, `g-hidden` | **Exterior, estable:** colocan el componente entre sus vecinos. Si el componente tiene una prop para lo mismo, usa la prop (`GBtn block` antes que `g-w-full`) |
| Relleno (`g-p*`), `display`, `g-flex-*`, `g-items-*`, `g-justify-*`, `gap`, texto (`g-text-*`, `g-font-*`, `g-truncate`), `g-radius-*`, `g-h-full`, `g-sr-only` | **Interior, fuera de contrato:** ganan por capa y por eso pueden romper una altura de contrato, una rejilla, el área táctil o la tipografía del componente. No se abren defectos por su efecto: para cambiar el interior, usa la prop, el tema o una regla tuya sobre el componente |

## Capas y especificidad

Las utilidades viven en la capa **`grana.utilities`**, la última de Grana. El orden completo, de más débil a más fuerte, es `grana.defaults`, `grana.components`, `grana.blocks`, `grana.utilities`, y tu CSS **sin capa** gana a todo. Dos consecuencias:

1. **Una utilidad gana a cualquier regla de Grana sin `!important`**: `g-mt-4` sobre un hijo de `GStack` gana a su margen 0, y gana a una regla de `grana.components` aunque sea más específica.
2. **Una regla tuya sin capa le gana a la utilidad**: nunca hay un caso en que una utilidad se imponga a tu aplicación. Si `.nota { margin-block-start: 3px }` y `class="nota g-mt-4"` coinciden, mide 3 px.

Todas las reglas tienen la misma especificidad (una clase; la guarda de `hidden` va en `:where()` y no suma), así que dentro de la capa decide solo el orden de la hoja. Cada hoja de Grana (`style.css`, `utilities.css` suelta y el `components.css` de `@grana/blocks`) declara el orden completo al principio: el orden de las capas lo fija la primera vez que aparece cada nombre, y así las utilidades nunca quedan como la capa más débil, cargues la hoja que cargues primero.

## Accesibilidad

a. **Texto no más pequeño que 12 px.** `caption` (0,75 rem) es el rol más pequeño y es el mínimo: ninguna utilidad de texto baja de ahí en el tema por defecto ni en un tema del CLI (`medido`, `design/lab/utilities/verificar.mjs`, coco). No combines `g-text-caption` con un `font-size` propio menor.

b. **Contraste de `g-text-muted` y `g-text-subtle`** sobre la página: 7,46:1 y 5,10:1 en claro, 9,29:1 y 6,71:1 en oscuro (`medido`, mismo verificador). El contrato los garantiza ≥ 4,5:1 sobre `bg`, `surface` y `surface-sunken`; **sobre un fondo propio de tu aplicación, el contraste es tuyo**.

c. **`g-sr-only` sigue en el árbol de accesibilidad y no ocupa sitio:** un botón con texto `g-sr-only` conserva su nombre accesible («Guardar cambios») y mide lo mismo que su gemelo sin él (`medido` con el nombre que calculan los motores; no con un lector de pantalla real). `g-hidden`, en cambio, lo saca del árbol.

d. **Dirección del texto:** al ser ejes lógicos, `g-ms-4` cae a la izquierda en `ltr` y a la derecha en `dir="rtl"`, y `g-text-start`, `g-text-end`, `g-items-*` y `g-justify-*` siguen la dirección (`medido`, en LTR y RTL, en los tres motores).

e. **Foco:** ninguna utilidad toca el contorno de foco; no hay variantes de estado (`focus:`, `hover:`) que pudieran quitarlo.

f. **Reflujo:** `g-flex` no se parte por sí solo. Para que una fila no desborde a 320 px (WCAG 1.4.10), añade `g-flex-wrap` o usa `GStack orientation="horizontal"`, que siempre se parte.

> **Peligro.** `g-sr-only` no va nunca en un elemento enfocable ni en un antepasado de uno: el foco caería en algo invisible y quien navega con teclado perdería la referencia (WCAG 2.4.7, foco visible). Para un enlace de salto que aparece al enfocar, la clase `g-sr-only-focusable` está **reservada** (#809); por ahora no existe. Y `g-truncate` recorta lo que se ve, no el texto: si el contenido importa, quien ve necesita otra forma de leerlo completo (`GTooltip`, un detalle).

## Personalidad

Lo que las hace distintas de otras hojas de utilidades:

- **La escala es la del tema, no una de píxeles.** El sufijo de la clase es el sufijo del token: con `space` 5 en `grana.config.json`, `g-p-4` pasa de 16 a 20 px **en toda la página a la vez**, junto con los componentes, (`medido`: `g-p-4` mide 16 px con el tema por defecto y 20 px con `space` 5, tanto en el «Tema de prueba» como en un tema del CLI). Los roles de texto igual: `g-text-title` mide lo que el rol `title` del tema en cada tema (`medido`, contra una sonda con las cuatro variables del rol). Una utilidad nunca desacompasa una pantalla del resto de Grana.
- **Ejes lógicos por construcción.** Una pantalla escrita con utilidades se da la vuelta en `dir="rtl"` sin tocar una clase.
- **Sin breakpoints ni variantes de estado.** Grana compone por tamaño intrínseco y consultas de contenedor, no por el ancho de la pantalla; una utilidad `md:` reintroduciría lo que los componentes evitan. La respuesta al ancho es de `GAdaptiveLayout`, `GStack` y `GContainer`.
- **Gana sin `!important` y pierde ante tu aplicación:** tu salida nunca se cierra.

Sin movimiento: ninguna utilidad anima, transiciona ni cambia de forma, así que `prefers-reduced-motion` no interviene.

## Tema

No añaden ningún token. Leen exactamente:

| Token | Qué controla |
| --- | --- |
| `--g-space-{1\|2\|3\|4\|5\|6\|8\|12\|16}` | Márgenes, rellenos y separaciones. Se leen **por paso**, no como `--g-space-1 × n` |
| `--g-text-{caption\|body-sm\|body\|title-sm\|title\|title-lg}-{size\|line\|tracking\|weight}` | Los cuatro valores de cada rol de `g-text-*` |
| `--g-font-ui`, `--g-font-title` | `g-font-ui`, `g-font-title` |
| `--g-color-text-muted`, `--g-color-text-subtle` | `g-text-muted`, `g-text-subtle` (redeclarados por el oscuro y por la zona de marca) |
| `--g-radius-{none\|xs\|sm\|md\|lg\|xl\|pill}` | `g-radius-*`. `--g-radius-shape` no: es la forma de los controles |

## Alcance

- **Límite del tema a mano.** Un `tokens.css` escrito a mano que cambie solo `--g-space-1` mueve los componentes (que calculan `space × n`) pero **no** las utilidades (que leen `--g-space-{n}`). Redeclara los nueve pasos; el CLI ya los emite todos. Es consecuencia de la escala elegida (el sufijo es el token), no un defecto.
- **Estilos en línea:** una propiedad que un componente escribe en su `style` (posiciones, alias `--_*`) gana a cualquier capa; una utilidad no la cambia.
- **Frontera con `GStack`:** las utilidades de margen sobre los hijos de una pila ganan a su puesta a 0 a propósito (e1).
- **Reservado (#809):**
  - pasos negativos (`g-mt-n4`…): para sacar algo hasta el borde, `g-bleed` de `GContainer`;
  - variantes por ancho (`md:`) y por estado (`hover:`, `focus:`, `dark:`);
  - `g-ml-*`, `g-pr-*` (solo ejes lógicos);
  - `g-text-display` y `g-font-display`;
  - `g-radius-shape`;
  - `g-sr-only-focusable`;
  - `g-flex-row-reverse`, `g-flex-col-reverse` y `g-order-*` (orden visual distinto del DOM);
  - `g-flex-nowrap`, `g-inline-grid`, columnas de rejilla (`g-cols-*`) y anchos fraccionarios;
  - fondo, borde y sombra (`g-bg-*`, `g-border-*`, `g-shadow-*`): son la superficie, `GSurface`;
  - posición, capa y desbordamiento (`g-relative`, `g-z-*`, `g-overflow-*`, `g-sticky`);
  - `!important` o una variante «fuerte».
- **Nombres reservados:** los prefijos de las utilidades (`g-m-`, `g-p-`, `g-gap-`, `g-text-`, `g-items-`, `g-justify-`, `g-self-`, `g-radius-`, `g-font-`, `g-w-`, `g-h-`, `g-min-w-`) y los nombres `g-grid`, `g-flex`, `g-block`, `g-inline` y `g-hidden` quedan reservados: ningún componente futuro los usará como etiqueta ni como clase.
- **Sin JS ni avisos de desarrollo:** son CSS puro; los usos fuera de contrato de la tabla exterior/interior no se detectan.
- **Peso:** `@grana/vue/utilities.css` suelta pesa **1 892 B gzip** (`gzip -9`, `medido` sobre `dist/utilities.css`); dentro de `dist/grana.css` suman **+1 561 B gzip** (100 163 → 101 724 B; `medido` por bruno, [`CHANGELOG.md`](../../../../CHANGELOG.md)), dentro del tope de 3 KiB. No afectan a `grana.js` ni al UMD.

## Verificación

- **Pruebas de bruno** (`prueba`): [`utilities.test.js`](utilities.test.js), 13 pruebas en verde (mora-docs, 2026-10-22). Comprueban que el conjunto **y el orden** de selectores coincide con `utilities.json` (229), que cada declaración es la del JSON, que todo valor es `var(--g-…)` sin respaldo o un literal permitido, que no hay `!important`, que todo token leído existe en `defaults.css`, que las seis de `display` (y solo ellas) llevan la guarda de `hidden` y que `dist/utilities.css` empieza por la declaración del orden de capas completo y envuelve sus reglas en `@layer grana.utilities`.
- **Banco de coco** (`medido`): `design/lab/utilities/verificar.mjs` sobre el `dist/` real, **565/565 en cada uno de Chromium, Firefox y WebKit (1695/1695 en total)**, ejecutado por mora-docs el 2026-10-22 con la versión de trabajo de coco (sin commit al escribir esto). Cubre las 229 clases contra su declaración, seis configuraciones por motor (defecto claro, defecto oscuro, «Tema de prueba» con `space` 5, tema del CLI con `space` 5 y `fontSize` 14, RTL y `utilities.css` cargado antes que `grana.css`) y `dist/utilities.css` cargada **sola**. Antes de integrar, coco había medido 553/553 por motor en `design/lab/utilities/estilo.md`.
- **No verificado:** (1) con lector de pantalla real, solo el nombre accesible que calculan los motores; (2) `forced-colors` y `prefers-reduced-motion` no aplican; (3) con `fontSize` 14 como mínimo del CLI no se mide un tema con `body-sm` por debajo de 12 px (el motor lo rechaza a propósito); (4) **la auditoría de coco** (`design/lab/utilities/auditoria.md`) no existe todavía: hasta entonces el estado es `draft` y las cifras de arriba son del banco, no de una auditoría. Al llegar, esta página se sincroniza (M3).
- **Pendientes abiertos:** ninguno propio; los generales, en [`PENDIENTES.md`](../../../../PENDIENTES.md) §6.

## Fuentes

- Contrato: [`design/contracts/utilities.md`](../../../../design/contracts/utilities.md) y la lista canónica [`design/contracts/utilities.json`](../../../../design/contracts/utilities.json) (229 clases; si difieren, manda el JSON)
- Decisiones: #804 a #811 en [`DECISIONS.md`](../../../../DECISIONS.md)
- API y tokens: [`docs/contract/api.md`](../../../../docs/contract/api.md) «Clases utilitarias» y [`docs/contract/tokens.md`](../../../../docs/contract/tokens.md) §8 y §55
- Hoja: [`utilities.css`](utilities.css) (coco) y su generación suelta en `dist/utilities.css` (bruno)
- Estilo y mediciones: [`design/lab/utilities/estilo.md`](../../../../design/lab/utilities/estilo.md); verificación propia [`design/lab/utilities/verificar.mjs`](../../../../design/lab/utilities/verificar.mjs); banco [`design/lab/utilities/estilo-banco.html`](../../../../design/lab/utilities/estilo-banco.html)
- Pruebas: [`utilities.test.js`](utilities.test.js)
- Banco: `#sec-utilities` de [`packages/vue/playground/index.html`](../../playground/index.html)
