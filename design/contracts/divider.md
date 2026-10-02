# Contrato · GDivider

**Dueño:** lima · **Estado:** aprobado (todo deriva de HTML, WAI-ARIA, WCAG o de decisiones vigentes; DECISIONS.md #190 y #191) · pendiente de coco (`GDivider.css`, valor de `--g-divider-inset` en `defaults.css`) y de bruno · **Basado en:** `design/lab/divider/r01/` (kiwi, commit edf3c0b: `brief.md`, `declaracion.md` con 11 hallazgos, `index.html`, `verificar.mjs` 52/52 en Chromium)
**Tag:** `g-divider` · **Categoría:** primitivas de layout

Una línea de separación **entre grupos de contenido del consumidor**, para cuando el espacio por sí solo no basta (lo que hoy sería un `<hr>` suelto o un borde ad hoc). Componente pequeño y deliberadamente simple: no tiene estados, ni movimiento, ni densidad, ni márgenes propios.

**Regla de uso (del usuario; guía, no la impone el software):** no usar `GDivider` como sustituto sistemático del espacio. Si dos secciones ya quedan separadas por título y aire, no hace falta una línea por instinto.

---

## Principios

- **Semántico por defecto.** Si la línea es la **única** marca de que empieza otro grupo o tema, es un `separator` (WCAG 1.3.1). `decorative` la saca del árbol cuando un encabezado, el nombre de un grupo o el propio contenido ya lo dicen.
- **El espacio lo pone el contenedor** (`gap` de la pila o de la fila). El divider no tiene márgenes salvo los del inset.
- **La cantidad del inset la define la anfitriona**, que es quien conoce su relleno, su icono y su densidad (patrón de `--g-tabs-inset`, #120).
- **No sangra.** «Ancho completo» es la ausencia de inset: la línea ocupa la caja de contenido de su contenedor. Una línea de borde a borde de una carcasa la dibuja la carcasa (`GDialog`, #44).
- **Nunca enfocable ni redimensionable.** Un separador enfocable es el patrón *Window Splitter* (otro componente).
- **RTL automático** por propiedades lógicas y flex, sin prop.
- **Iconos:** ninguno. Sin glifos ni pictogramas (`icons.md`).

## Frontera con otros componentes

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Separar grupos de contenido propio (párrafos que cambian de tema, grupos de enlaces o de acciones, adorno bajo una cabecera) | `GDivider` | `<hr>` o bordes ad hoc |
| Separar opciones de un menú | El separador propio de `GMenu` (`{ type: 'separator' }`, #82): el menú gobierna sus hijos | `GDivider` dentro de `GMenu` |
| Separar elementos de una lista `<ul>`/`<ol>` | Partir la lista en dos y poner el `GDivider` **entre** las listas | `GDivider` como hijo de la lista (una lista solo admite `listitem`) |
| Línea de borde a borde entre secciones de una carcasa | La de la carcasa (`g-dialog__section`, #44; pie de `GCard`; filas de `GTable`; pie fijo de `GFormActions`) | `GDivider` con sangrado |
| Separar `GFormSection` | **Espacio** (`--g-form-section-gap`); la línea queda reservada para la Fase 3 (#192, `form.md` §3) | `GDivider` a mano entre secciones (rompe el ritmo: 81px dentro de `GForm`, 1px fuera) |
| Texto que **titula** lo que sigue («Ajustes avanzados») | Un encabezado `hN` | `GDivider` con `label` (un separador no aparece en la navegación por encabezados) |
| Panel redimensionable | Un *splitter* (fuera de alcance) | `GDivider` con `tabindex` |
| Línea de fusión entre partes de `GInputGroup` | Su alias local (`--_divider`), detalle de implementación | `GDivider` |

No se migra ningún componente en esta ronda (mismo criterio que #99).

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `orientation` | String | `horizontal` `vertical` | `horizontal` | propia (mismo nombre y valores que `GTabs`, `GStepper`) |
| `label` | String | texto libre | sin valor | propia |
| `inset` | String | `none` `both` `start` | `none` | propia |
| `emphasis` | String | `subtle` `strong` | `subtle` | propia |
| `decorative` | Boolean | | `false` | propia (mismo nombre que `GInputGroupText`, `form.md` §13) |

**Sin** `density`, `color`, `variant`, `size`, `as`, `rounded` ni grosor. Cada prop enumerada declara `validator` con su lista (`api.md`).

### Reglas de props

- **`orientation`:** `horizontal` separa bloques apilados; `vertical` separa elementos de una **fila** (grupos de acciones de una barra). El vertical **requiere** ser hijo directo de un contenedor **flex en fila** (`flex-direction: row` o `row-reverse`) **o grid**: toma el alto de la fila con `align-self: stretch` (también si la fila tiene `align-items: center`). Nunca `block-size: 100%` ni un alto explícito (un porcentaje no se resuelve contra un padre de alto automático, CSS 2.1 §10.5; un alto fijo se desacopla del `size`/`density` de los controles vecinos). En un padre de bloque mide 0 y en una columna flex el estiramiento le da ancho, no alto: aviso 1.
- **`label` (y slot `label`):** texto corto **centrado** entre dos líneas («O bien», «Ayer»). **Solo horizontal**: en vertical se ignora (no se pinta) y avisa (aviso 3). Con texto, la raíz **no** es `separator` (ver «Semántica»). El slot gana a la prop (como `title` de `GFormSection`). Contenido de frase sin nada interactivo (aviso 5). Alineado al inicio o al final: fuera de v0.1 (si titula lo que sigue, es un encabezado).
- **`inset`:**
  - `none` (por defecto): la línea ocupa la caja de contenido del contenedor. Es lo que la propuesta llamaba «full width»; **no** sangra sobre el relleno de la anfitriona.
  - `both`: acorta por los dos extremos (horizontal: inicio y fin en línea; vertical: arriba y abajo).
  - `start`: acorta solo por el inicio en línea (alinear la línea con el texto de una lista con icono). **Solo horizontal**: en vertical se aplica `both` y avisa (aviso 4). La clase refleja el valor **efectivo**.
  - La **cantidad** es `--g-divider-inset` (ver «Tokens»): la misma para `both` y `start` y para ambas orientaciones; la anfitriona la redefine en su elemento y el divider la hereda. No se multiplica por densidad (si la cantidad depende de la densidad, la calcula la anfitriona con la suya).
  - Con `label`, el inset acorta la raíz entera (las dos líneas y el texto quedan dentro).
- **`emphasis`:** mismo grosor (`--g-border-width`), dos tonos del neutro; **nunca un color semántico**.
  - `subtle` (por defecto): refuerza una separación que el espacio o un título ya dan. **No** es la única señal por definición, así que no se le exige 3:1 (WCAG 1.4.11 se aplica a lo gráfico **necesario** para entender). Usarlo como única señal es un mal uso que se documenta; el componente no lo puede detectar.
  - `strong`: para cuando la línea es **la única señal visual**. Debe medir **≥ 3:1** contra la superficie anfitriona (`surface` y `surface-sunken`, claro y oscuro). Se define por el contraste, no por el nombre del token: **`--g-color-border-control`**, no `--g-color-border-strong` (16 % / 20 %, no llega a 3:1; #89).
  - Con `label`, `emphasis` afecta a las líneas, no al texto.
- **`decorative`:** `aria-hidden="true"` en la raíz y sin `role`. Úsese cuando un encabezado, el nombre de un grupo o el contenido ya marcan la separación (secciones con `hN` en un diálogo o una página; grupos con título visible; adorno bajo la cabecera de una tarjeta). **Con texto no cambia nada** (la línea ya no está en el árbol y el texto es contenido que se lee); no avisa.
- **Resto de atributos** (`id`, `class`, `style`, `data-*`, `aria-label`/`aria-labelledby` de un separador que lo necesite): a la raíz (`inheritAttrs` por defecto). Un `tabindex` del consumidor avisa (aviso 6) y se pasa igual (el consumidor manda en su atributo, pero el divider no gestiona teclado).

## Semántica (por caso)

| Caso | Raíz | Rol expuesto | Atributos que pone `GDivider` |
| --- | --- | --- | --- |
| Horizontal sin texto | `<hr>` | `separator` (HTML-AAM; horizontal implícito) | ninguno |
| Horizontal sin texto, `decorative` | `<hr>` | fuera del árbol | `aria-hidden="true"` |
| Vertical | `<div>` | `separator` | `role="separator"` `aria-orientation="vertical"` (el defecto de `separator` es horizontal) |
| Vertical, `decorative` | `<div>` | fuera del árbol | `aria-hidden="true"` (sin `role` ni `aria-orientation`) |
| Horizontal con texto (con o sin `decorative`) | `<div>` + `<span>` | ninguno en la raíz; el texto se lee como **texto** | ninguno |

**Por qué el texto nunca va dentro de un `separator`:** en WAI-ARIA, `separator` tiene **hijos presentacionales** y su nombre viene solo del autor (`aria-label`/`aria-labelledby`), no del contenido; Chromium deja un `<div role="separator">O bien</div>` con nombre vacío y la especificación permite podar el texto (kiwi §4, verificado con CDP). Con la raíz sin rol, el texto se lee en orden y las líneas, pseudo-elementos sin contenido textual, no entran en el árbol.

**Ningún divider** lleva `tabindex`, `aria-valuenow` ni manejadores de teclado o puntero.

## Estructura

```html
<!-- horizontal, semántico (por defecto) -->
<hr class="g-divider g-divider--orientation-horizontal g-divider--inset-none g-divider--emphasis-subtle">

<!-- horizontal decorativo, con inset start y fuerte -->
<hr class="g-divider g-divider--orientation-horizontal g-divider--inset-start g-divider--emphasis-strong" aria-hidden="true">

<!-- vertical, semántico -->
<div class="g-divider g-divider--orientation-vertical g-divider--inset-none g-divider--emphasis-subtle"
     role="separator" aria-orientation="vertical"></div>

<!-- vertical decorativo con inset -->
<div class="g-divider g-divider--orientation-vertical g-divider--inset-both g-divider--emphasis-subtle" aria-hidden="true"></div>

<!-- con texto (solo horizontal): la raíz sin rol; las líneas son ::before y ::after de la raíz -->
<div class="g-divider g-divider--orientation-horizontal g-divider--labeled g-divider--inset-none g-divider--emphasis-subtle">
  <span class="g-divider__label">O bien</span>
</div>
```

- **Sin texto:** un solo elemento vacío; la línea es un **borde** (`border-block-start` en horizontal, `border-inline-start` en vertical) con tamaño 0 en el otro eje.
- **Con texto:** la raíz es un contenedor flex en fila con `align-items: center`; las líneas son **`::before` y `::after`** de la raíz (sin nodos extra en el DOM ni en el árbol), cada una con `flex: 1 1 0` y un **mínimo** de ancho, de modo que con un texto largo el texto **envuelve** (centrado) y las líneas no desaparecen. El texto **nunca se recorta** ni lleva `…`.
- **Las líneas son bordes, nunca fondos** (en `forced-colors` un fondo se sustituye y la línea desaparecería; un borde pasa a `CanvasText`).
- **La línea nunca pasa por debajo del texto:** el texto **no lleva fondo** para taparla, así funciona igual sobre superficie, superficie hundida o cristal.
- **El `<hr>` pierde todo estilo del agente de usuario** (margen, borde, alto, color, `overflow`): lo resetea coco.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `label` | Texto entre las dos líneas (contenido de frase, sin nada interactivo) | Dentro de `g-divider__label`; solo en horizontal |

**Sin slot por defecto.** Contenido en el slot por defecto no se pinta y avisa (aviso 7: «usa `label` o el slot `label`»), para que un `<GDivider>O bien</GDivider>` no pierda el texto en silencio.

## Eventos

Ninguno.

## Teclado

No aplica: no es enfocable ni interactivo (aviso 6 si recibe `tabindex`).

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-divider` | Raíz | Siempre |
| `g-divider--orientation-{horizontal\|vertical}` | Raíz | Siempre |
| `g-divider--inset-{none\|both\|start}` | Raíz | Siempre (el valor **efectivo**: `start` en vertical → `both`) |
| `g-divider--emphasis-{subtle\|strong}` | Raíz | Siempre |
| `g-divider--labeled` | Raíz | Con texto efectivo (prop no vacía o slot `label`) y orientación horizontal |
| `g-divider__label` | `<span>` del texto | Con `--labeled` |

`decorative` no tiene clase: se expresa con `aria-hidden` (no cambia el aspecto).

## Geometría y estilo (lo que coco debe respetar)

- **Grosor:** `--g-border-width` en las dos orientaciones y en las dos líneas del texto.
- **Color de línea:** `subtle` = `--g-color-border`; `strong` = `--g-color-border-control`. En `forced-colors: active`, `CanvasText` (como `GMenu` y `GDialog`).
- **Márgenes:** ninguno de bloque en horizontal ni de línea en vertical. Inset: `both` horizontal → `margin-inline`; `start` → `margin-inline-start`; `both` vertical → `margin-block`; siempre con `var(--g-divider-inset)`.
- **Vertical:** `align-self: stretch`, ancho 0 más el borde, sin encoger (`flex: none`); en grid, el estiramiento por defecto de la celda.
- **Texto:** rol tipográfico **`body-sm`** (`--g-text-body-sm-size`, `--g-text-body-sm-line`; 14px y peso normal en el tema por defecto) en **`--g-color-text-muted`** (≥ 4.5:1 sobre `surface` y `surface-sunken` por la regla de derivación, `tokens.md` §16; `text-subtle` queda a ~4.7:1 sobre la hundida y se descarta). Es contenido de frase en el orden de lectura, no un metadato; `caption` (12px, el mínimo) se reserva para metadatos e insignias. Sin color como único significado; no cambia con la densidad (`tokens.md` §4). Centrado al envolver; `overflow-wrap: anywhere`.
- **Separación texto ↔ línea** y **mínimo de cada línea:** derivados de `space` en `GDivider.css` (alias locales `--_*`; kiwi usó `space × 3` y `space × 4`). No escalan con densidad.
- **Sin** hover, foco, pulsado, transición ni movimiento.

## Tokens

**Consumidos (existentes):** `--g-border-width`, `--g-color-border`, `--g-color-border-control`, `--g-color-text-muted`, `--g-text-body-sm-size`, `--g-text-body-sm-line`, `--g-font-ui`, `--g-space-*`.

**Nuevo (uno):** `--g-divider-inset` (`tokens.md` §22, #191). Sin valor en este contrato.

| Token | Para qué | Regla |
| --- | --- | --- |
| `--g-divider-inset` | Cantidad que acorta la línea con `inset="both"` (cada extremo) e `inset="start"` (el inicio), en ambas orientaciones | Valor por defecto en `defaults.css` (capa `grana.defaults`) **en `:root`**, derivado de `space` (lo fija coco; kiwi usó `space × 4`). **Se hereda**: una anfitriona lo redefine en su propio elemento (`.mi-lista { --g-divider-inset: … }`; una lista con icono, el relleno + icono + separación) y gana por cercanía. El divider **solo lo lee**; no lo declara en `GDivider.css`. No es de color: no se redeclara en el oscuro. No se multiplica por densidad |

**Por qué un token y no una prop:** la cantidad depende del contexto (icono, relleno y densidad de la lista anfitriona), que el divider no conoce, y se usa en CSS; una prop numérica obligaría a repetir la medida en cada instancia y la desacoplaría de la anfitriona. **Por qué en `defaults.css` y no con `0px` en el componente** (diferencia con `--g-tabs-inset`, que vale cero sin anfitriona): `inset="both"` pedido sin anfitriona que lo defina debe acortar algo visible; un cero haría la prop inútil por defecto.

**No son tokens** (§17.6): el tono `subtle`/`strong` (son semánticos existentes), la separación texto ↔ línea y el mínimo de línea (alias de coco desde `space`).

## Avisos de desarrollo (`[Grana GDivider]`)

Con `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'` (nunca `import.meta.env.DEV`), **una vez por instancia y motivo**, con `console.warn`. Los que miran el DOM se comprueban en `onMounted` y al cambiar `orientation`.

| # | Cuándo | Texto (idea) | Qué hace el componente |
| --- | --- | --- | --- |
| 1 | `orientation="vertical"` y el padre (el primer ancestro que no sea `display: contents`) no es `flex`/`inline-flex` con `flex-direction` `row`/`row-reverse` ni `grid`/`inline-grid` | «vertical necesita un padre flex en fila o grid para tomar su alto (padre: display …)» | Se pinta igual (mide 0 de alto o se estira a lo ancho) |
| 2 | El padre es `<ul>`, `<ol>` o `<menu>`, o tiene `role` `list`, `menu`, `menubar`, `listbox` o `tablist` | «un divider no puede ser hijo de una lista o un menú: parte la lista en dos y pon el divider entre ellas (en `GMenu`, usa su separador)» | Se pinta igual |
| 3 | `label` o slot `label` con `orientation="vertical"` | «label solo en horizontal; en vertical se ignora» | No pinta el texto; vertical sin texto |
| 4 | `inset="start"` con `orientation="vertical"` | «inset="start" solo en horizontal; en vertical se usa both» | Clase `--inset-both` |
| 5 | El texto contiene algo interactivo (`a[href]`, `button`, `input`, `select`, `textarea`, `summary`, `[tabindex]`, `[contenteditable]`) | «el texto del divider no admite contenido interactivo» | Se pinta igual |
| 6 | El consumidor pasa `tabindex` | «GDivider no es enfocable (un separador enfocable es un splitter)» | El atributo llega a la raíz |
| 7 | Contenido en el slot por defecto | «usa label o el slot label» | No lo pinta |
| — | Valor de enum fuera de lista | Validador de Vue | — |

**Límite conocido (sin aviso en v0.1):** en una fila que **envuelve** (`flex-wrap`), un vertical puede quedar al principio o al final de una línea, separando nada; detectarlo exige medir (kiwi §6, §13).

## Verificación

### bruno (vitest + jsdom; Playwright para medidas y árbol)

- **Marcado por caso:** las cinco filas de «Semántica» (elemento, `role`, `aria-orientation`, `aria-hidden`), con instantánea de clases; `--labeled` solo con texto efectivo en horizontal; clase de inset **efectiva**.
- **Slot y prop:** el slot `label` gana; sin texto (prop vacía y sin slot) → variante de línea; contenido en el slot por defecto no se pinta.
- **Avisos 1 a 7**, cada uno una sola vez y solo en desarrollo; ninguno en los usos correctos (vertical en flex fila y en grid, también con `align-items: center`; horizontal en bloque y en columna flex).
- **Sin foco:** Tab pasa de largo por todos los casos; ningún manejador de teclado ni puntero.
- **Árbol de accesibilidad real** (Playwright en **Chromium, Firefox y WebKit**; `page.accessibility.snapshot()` o `getByRole('separator')`): separators con su orientación; decorativos ausentes; con texto, ningún `separator` y el texto presente; ningún separator con nombre salvo el que dé el consumidor.
- **Medidas** (Playwright): alto del vertical = alto de contenido de la fila − 2 × inset, con botones `GBtn` reales de dos tamaños (32 y 44px), con `align-items: center`, también en RTL; inset `start` alineado con el texto de una lista anfitriona que redefine `--g-divider-inset` (±1px) en `default` y `compact`; texto largo a 200px envuelve sin recorte y con líneas ≥ su mínimo; 320px sin desborde, también en `dir="rtl"`.
- `GDivider.meta.json` (`status: "draft"`), registro en `src/index.js` y `components.css`; `levels.test.js` y `check-icons.mjs` sin infracciones; consola limpia.

### coco (auditoría con un tema distinto al de defecto)

- `strong` ≥ 3:1 sobre `surface` y `surface-sunken`, en claro y oscuro; texto ≥ 4.5:1 sobre ambas, en claro y oscuro.
- `forced-colors`: las tres formas de línea (hr, `::before`/`::after`, vertical) visibles.
- **Coherencia de líneas internas** (hallazgo 7 de kiwi): hoy `GMenu` separa con `border-strong` y `GDialog`, `GTable` y el pie de `GCard` con `border`. `GDivider subtle` toma `border` (el de la mayoría); coco decide si `GMenu` se unifica o se justifica, para que un `GDivider` junto a un menú o un diálogo no tenga otro tono.
- Zoom 200 % y escalas fraccionarias: la línea de 1px no desaparece ni se duplica.

### No verificado y pendiente

Lector de pantalla real (si anuncian «separador» en `hr` y en el vertical; si VoiceOver los omite; cómo se lee el texto entre líneas); Firefox y WebKit para el árbol, el estiramiento en grid y `forced-colors` (lo cubre la prueba de bruno); fila que envuelve; tema real (lo mide coco).

## Resolución de hallazgos de kiwi (r01, §11)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Props | `orientation`, `label` (prop + slot `label`, no slot por defecto), `inset`, **`emphasis`** (no un Boolean `strong`), `decorative`; sin `density`, `color`, `variant`, `size`, `as` ni grosor | #190 |
| 2 | Marcado por caso | «Semántica» y «Estructura», tal cual kiwi | HTML-AAM, WAI-ARIA `separator` |
| 3 | Eventos y slots | Sin eventos; slot `label` (nombre explícito, como `title` de `GFormSection`); el slot por defecto avisa | Evitar pérdida silenciosa de texto |
| 4 | Avisos | 1 a 4 de kiwi + 5 (interactivo en el texto) + 6 (`tabindex`) + 7 (slot por defecto); el 2 amplía a roles de lista y menú | WAI-ARIA (hijos requeridos de `list`, `menu`) |
| 5 | Inset | `--g-divider-inset`, uno para las dos orientaciones y para `both`/`start`, en `defaults.css` y heredado | #191; precedente #120 |
| 6 | Tokens | Solo `--g-divider-inset`; el resto, existentes; texto `body-sm` + `text-muted` | §17.6 |
| 7 | Líneas internas | Para coco (auditoría) | — |
| 8 | Contraste en oscuro | Para coco (auditoría) | #89 |
| 9 | Guía de uso | Para mora-docs: regla de uso, requisito del vertical, cuándo `decorative`, no dentro de listas ni de `GMenu`, no entre `GFormSection` | — |

**Por qué `emphasis` y no `strong` (Boolean):** un Boolean `strong` sugiere el token `--g-color-border-strong`, que es justo el que **no** cumple 3:1 (#89); `emphasis` nombra el papel de la línea (¿refuerza o es la única señal?) y sigue la forma de las props enumeradas de Grana (`level`, `tone`, `appearance`).

**Preguntas de producto abiertas: ninguna.**
