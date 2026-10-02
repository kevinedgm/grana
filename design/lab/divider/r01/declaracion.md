# Declaración de cumplimiento · GDivider · r01

**Estado:** en revisión. Fuente de verdad: `brief.md` de esta ronda.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises, iconos solo Lucide (`design/lab/lucide-icons.js`).
**Siguiente dueño:** lima → `design/contracts/divider.md`; y, aparte, la decisión de la sección «Para lima» (separación entre `GFormSection`).
**Prototipo:** `index.html` (10 secciones; una sola fábrica `divider()` genera todos los dividers con las reglas de esta declaración). **Verificación:** `verificar.mjs` (Playwright, Chromium).
**Convención:** «propuesta kiwi pendiente de visto bueno» = recomendación que se asume si el usuario no responde. Los grises, el grosor y las separaciones del prototipo son de wireframe, **no** propuestas.

## 0. Solapes revisados antes de proponer

| Ya existe | Qué dibuja | Relación con `GDivider` |
| --- | --- | --- |
| `GMenu` (`{ type: 'separator' }`, #82) | `<li role="none"><div class="g-menu__separator" role="separator">` | **Se queda como está.** El menú gobierna sus hijos (`role="menu"` solo admite ciertos roles); `GDivider` **no** se usa dentro de `GMenu` |
| `GDialog` (`g-dialog__section`, #44) | Línea **a sangre** entre secciones (borde superior de la sección) | **Se queda.** La línea de borde a borde depende del relleno de la anfitriona; `GDivider` no sangra (§1.5) y no la duplica |
| `GCard` (pie), `GTable` (filas), `GFormActions` (pie fijo) | Bordes de la propia región | Detalle interno de cada componente; sin cambios |
| `GInputGroup` (`--_divider`, `--_divider-style`) | Borde entre partes fusionadas | Alias local de implementación; no se toca (brief) |
| `GSurface` (#99) | Superficies, no líneas | Sin relación |

`GDivider` es para **el contenido del consumidor**: lo que hoy se resolvería con un `<hr>` suelto o un borde ad hoc. No se migra ningún componente en esta ronda (mismo criterio que #99 y `GCard` r01 §1.3).

## 1. Decisiones estructurales (derivadas de estándares y de lo ya decidido)

| # | Pregunta | Decisión | Fundamento |
| --- | --- | --- | --- |
| 1.1 | ¿Qué elemento? | Horizontal sin texto: **`<hr>`** (separator nativo, horizontal implícito). Vertical: **`<div role="separator" aria-orientation="vertical">`**. Con texto: **`<div>` + `<span>`** (sin `role`, §4). Decorativo: el mismo elemento con **`aria-hidden="true"`** | HTML-AAM (`hr` → `separator`); WAI-ARIA `separator` (no enfocable, `aria-orientation` por defecto `horizontal`, así que el vertical lo declara); un `div` evita los estilos del agente de usuario de `hr` en una fila |
| 1.2 | ¿Semántico o decorativo por defecto? | **Semántico por defecto**; `decorative` lo saca del árbol. Es semántico cuando la línea es **la única marca** de que empieza otro grupo o tema; decorativo cuando un encabezado, el nombre de un grupo o el propio contenido ya lo dicen (§4) | WCAG 1.3.1: si lo único que comunica la separación es la línea, debe estar en el árbol. Fallar hacia «semántico» cuesta un anuncio de más; fallar hacia «decorativo» pierde estructura. Mismo modelo que `<hr>` y que el nombre ya usado en `GInputGroupText` (`decorative`, form.md §13) |
| 1.3 | ¿Cómo va el texto? | Un **contenedor flex** con la línea en **`::before` y `::after`** (con **borde**, nunca con fondo) y el texto en un `<span>` en medio; la raíz **no** es `separator`; el texto se lee como texto. Solo horizontal y solo centrado en v0.1 | Ver §5: `separator` tiene hijos presentacionales; los pseudo-elementos sin texto no entran en el árbol; un fondo desaparece en `forced-colors` |
| 1.4 | ¿De dónde sale la altura del vertical? | De la **fila**: el divider es hijo de un contenedor **flex en fila o grid** y toma su alto con `align-self: stretch` (también si la fila centra a sus hijos). **Ni** `block-size: 100%` **ni** alto explícito. Es un **requisito documentado** con aviso en desarrollo (§6) | Un porcentaje de alto no se resuelve contra un padre de alto automático (CSS 2.1 §10.5); un alto fijo se desacopla de `size`/`density` de los controles vecinos. Verificado: 32px con botones de 32px y 44px con botones de 44px, sin tocar el divider |
| 1.5 | ¿«Full width» es una variante? | **No: es la ausencia de inset** (`inset="none"`, por defecto). El divider ocupa la **caja de contenido** de su contenedor. **No sangra** sobre el relleno de la anfitriona: si la línea debe llegar de borde a borde, la dibuja la anfitriona (`GDialog` ya lo hace, #44) | El sangrado necesita conocer el relleno del padre (margen negativo), que el divider no conoce; ese problema ya apareció en `GCard` r01 (hallazgo 1) y se resolvió en la anfitriona |
| 1.6 | ¿Qué es «inset»? | `inset`: `none` · `both` · `start`. `both` acorta por los dos extremos (en vertical, arriba y abajo); `start` solo por el inicio en línea (alinear con el texto de una lista con icono; **solo horizontal**). **La cantidad la define la anfitriona** con una propiedad heredada (patrón de `--g-tabs-inset`, #120); el divider no sabe nada de la lista | La cantidad depende del icono, el relleno y la densidad de la lista, no del divider. Verificado: la línea empieza donde el texto (±1px) en `default` y `compact` |
| 1.7 | ¿Sutil y fuerte? | `emphasis`: `subtle` (por defecto) · `strong`. **Mismo grosor, dos tonos del neutro; nunca un color semántico.** `subtle` refuerza una separación que el espacio o un título ya dan; `strong` es para cuando la línea es **la única señal visual** y entonces debe tener **≥ 3:1** contra la superficie | WCAG 1.4.11 exige 3:1 a lo gráfico **necesario para entender**; una línea redundante no lo es. #89: `border-strong` (16 % / 20 %) **no** llega a 3:1; la que sí llega es `border-control`. El fuerte se define por el contraste, no por el nombre del token |
| 1.8 | ¿Quién pone el espacio alrededor? | **El contenedor** (`gap` de la pila o la fila). El divider **no tiene márgenes de bloque** (horizontal) ni de línea (vertical); solo los del inset | Regla del brief: el divider no sustituye al espacio. Mismo reparto que `GForm`/`GFormSection` (el aire es de la composición). Convención de Vuetify (`v-divider`) y MUI (`Divider`): sin margen de bloque |
| 1.9 | ¿Densidad propia? | **No.** No tiene alto, relleno ni separación propios que escalar; el inset lo pone la anfitriona con **su** densidad (verificado con la lista `default`/`compact`) | `density` multiplica altura, relleno y separación (tokens.md §4); un divider no tiene ninguna. Precedente: `GFormSection` no tiene densidad propia |
| 1.10 | ¿RTL? | **Automático, sin prop**: `margin-inline-*`, `border-inline-start`, `border-block-start` y flex | Verificado bajo `dir="rtl"`: el inset `start` queda a la derecha (45px a la derecha, 1px a la izquierda), el texto sigue centrado (±1px) y el vertical sigue a su fila |
| 1.11 | ¿Enfocable o redimensionable? | **Nunca.** Un separador enfocable es el patrón *Window Splitter* (con `aria-valuenow`), otro componente | WAI-ARIA `separator` enfocable = *splitter*; un divider estático no recibe foco ni tiene área táctil |

## 2. Anatomía

| Parte | Elemento | Cuándo | Nota |
| --- | --- | --- | --- |
| Raíz (línea) | `<hr>` (horizontal) / `<div role="separator" aria-orientation="vertical">` | Sin texto | Línea = un borde (`border-block-start` / `border-inline-start`), alto o ancho 0 |
| Raíz (con texto) | `<div>` sin `role` | Con texto | `display: flex`, `align-items: center` |
| Líneas | `::before` y `::after` de la raíz | Con texto | `flex: 1 1 0` con **mínimo** (en el prototipo, `space × 4`): con un texto largo el texto envuelve y las líneas no desaparecen |
| Texto | `<span class="…__label">` | Con texto | Texto en línea, **sin fondo**; envuelve, nunca se recorta; nada interactivo dentro |

Clases sugeridas (lima las fija): `g-divider`, `--horizontal`/`--vertical`, `--labeled`, `--inset-both`/`--inset-start`, `--emphasis-strong`; `g-divider__label`.

## 3. Variantes finales (v0.1)

| Eje | Valores | Por defecto | Combinaciones |
| --- | --- | --- | --- |
| Orientación | `horizontal` · `vertical` | `horizontal` | Todas |
| Texto | texto o ninguno | ninguno | **Solo horizontal**; en vertical se ignora con aviso |
| Inset | `none` (= «full width») · `both` · `start` | `none` | `start` solo horizontal; en vertical pasa a `both` con aviso |
| Énfasis | `subtle` · `strong` | `subtle` | Todas, también con texto (la línea, no el texto) |
| Semántica | separator · `decorative` | separator | Con texto no aplica (§4): el texto siempre es texto |

**Fuera de v0.1:** texto alineado al inicio o al final (si el texto titula lo que sigue, eso es un **encabezado**, §4); texto en vertical; grosores distintos; color semántico; sangrado; *splitter*.

## 4. Semántica ARIA y cuándo aplica cada una

**Regla:** si la línea es la **única** marca de que empieza otro grupo o tema → `separator` (por defecto). Si un encabezado, el nombre de un grupo o el contenido ya lo dicen → `decorative`.

| Contexto | Rol | Por qué | Prototipo |
| --- | --- | --- | --- |
| Entre párrafos que cambian de tema sin título | `separator` (`<hr>`) | Cambio temático a nivel de párrafo (HTML `hr`); nada más lo marca | §2 |
| Entre grupos de enlaces o acciones que nada nombra | `separator` | La línea es la estructura del grupo | §4 (lista), §5 (fila), §8 |
| Entre dos acciones de una fila (grupos de acciones) | `separator` vertical | Ídem; `aria-orientation="vertical"` | §5 |
| Entre secciones que ya tienen `hN` (diálogo, página) | `decorative` | El encabezado ya da la estructura y la navegación (WCAG 2.4.6, 2.4.10); un «separador» más es ruido | §7 |
| Entre grupos con título visible (`aria-labelledby` del grupo) | `decorative` | El grupo ya está nombrado | §4 (panel) |
| Adorno bajo la cabecera de una tarjeta | `decorative` | No separa contenidos distintos | §8 |
| Dentro de `GMenu` | El separador **propio** de `GMenu` | El menú gobierna sus hijos | §4 (nota) |
| Dentro de una lista `<ul>`/`<ol>` | **No va dentro**: se parte la lista en dos y el divider va **entre** las listas | ARIA `list` solo admite `listitem` como hijo; un `<li role="separator">` en un `<ul>` rompe la lista (Chromium lo expone dentro del `list`, verificado). Aviso en desarrollo | §4, §10 |
| Con texto («O bien», «Ayer») | Ninguno en la raíz; el texto es **texto** | Ver abajo | §3, §9 |

**Por qué el texto nunca va dentro de un `separator`:** en WAI-ARIA, `separator` tiene **hijos presentacionales** y su nombre viene **solo del autor** (`aria-label`/`aria-labelledby`), no del contenido. El sondeo en Chromium muestra que un `<div role="separator">O bien</div>` queda con **nombre vacío** y conserva el texto como hijo, cosa que la especificación permite podar: la exposición depende del navegador y del lector. Con la raíz sin rol, «O bien» se lee siempre como texto, en orden, y las líneas (pseudo-elementos sin texto) no entran en el árbol (verificado). Si el texto **titula** lo que sigue («Ajustes avanzados»), es un **encabezado**, no un divider: un separador no aparece en la navegación por encabezados.

**Con texto, `decorative` no cambia nada** (la línea ya es decorativa y el texto es contenido); se documenta, sin aviso.

**Verificable por el usuario:** la sección 8 del prototipo lista cada divider con lo que expone, y DevTools → *Accessibility* lo muestra nodo a nodo. `verificar.mjs` contrasta esa tabla con el árbol **real** de Chromium (CDP): 18 dividers, todos coinciden.

## 5. Estructura del texto

1. **Un contenedor con `::before`/`::after`**, no dos `<span>` de línea: no añade nodos al DOM ni al árbol, y el orden de lectura es simplemente el texto. (Dos `<span>` vacíos con `aria-hidden` funcionarían igual; los pseudo-elementos lo hacen sin marcado extra.)
2. **La línea nunca pasa por debajo del texto.** Por eso el texto **no lleva fondo** para «tapar» la línea, y funciona igual sobre superficie clara, hundida o cristal (verificado sobre superficie y superficie hundida). La alternativa (línea completa + texto encima con el color de la superficie) falla en cuanto cambia la superficie anfitriona.
3. **Líneas con borde, no con fondo:** en `forced-colors` el fondo se sustituye y la línea desaparecería; el borde pasa a `CanvasText` (verificado con la emulación de Chromium).
4. **Texto largo:** envuelve centrado; cada línea conserva un mínimo (`space × 4` en el prototipo); nunca se recorta ni se pone `…` (verificado a 200px).
5. **Tipografía:** la decide lima/coco con `tokens.md` §5 (`caption` 12px/500 o `body-sm` 14px/400). Requisitos de kiwi: **≥ 12px**, **≥ 4.5:1** contra la superficie anfitriona (es texto, no gráfico), sin depender del color. Con el tema por defecto, `text-muted` (#555) da 7.46:1 sobre `surface` y `text-subtle` (#6E6E6E) ~4.7:1 sobre `surface-sunken` (#F6F6F6): el segundo pasa por poco, a vigilar en la auditoría.
6. **Separación texto ↔ línea:** un paso de `space` (alias local); no escala con densidad (§1.9).

## 6. Orientación vertical: requisito para quien lo use

- El `GDivider` vertical debe ser **hijo directo de un contenedor flex en fila (`flex-direction: row`) o grid**. Toma el alto de la fila (`align-self: stretch`), aunque la fila tenga `align-items: center`.
- **No funciona** en un padre de bloque (alto 0) ni en una columna flex (el *stretch* le da ancho, no alto): verificado, y el prototipo emite el aviso en ambos casos (§10).
- `inset="both"` acorta por arriba y abajo (barra con borde: 26px en una barra de 42px de contenido con inset de 8px, verificado).
- **Límite conocido:** en una fila que **envuelve** (`flex-wrap`), el divider puede quedar al final o al principio de una línea, separando nada. Detectarlo exige medir; no entra en v0.1 (§13).

## 7. Densidad

Sin prop `density` (§1.9). Lo único que varía con la densidad del contexto es la **cantidad del inset**, y la pone la anfitriona con su propia densidad (la lista del prototipo la recalcula; la línea sigue alineada con el texto en `default` y `compact`). La tipografía del texto no cambia con la densidad (regla general, tokens.md §4).

## 8. RTL

Automático: `margin-inline-start` (inset `start`), `margin-inline` (`both` horizontal), `margin-block` (`both` vertical), `border-inline-start` (vertical) y flex (texto). Sin prop `dir` ni cálculo en JavaScript. Verificado en la sección 9 y en la página completa a 320px en `rtl` (sin desborde).

## 9. Contraste, modos de color forzado y movimiento

- `strong` ≥ 3:1 contra superficie **y** contra superficie hundida (kit: 3.45:1 y 3.17:1). Con el tema real, el valor que cumple hoy es el de `border-control`, no `border-strong` (#89); **coco lo mide en claro y oscuro**.
- `subtle` (kit: 1.48:1 y 1.36:1) **no** es la única señal por definición (§1.7); usarlo como única señal es un mal uso que se documenta, no algo que el componente pueda detectar.
- `forced-colors: active`: líneas en `CanvasText` (como `GMenu` y `GDialog`).
- Sin movimiento ni estados: no hay hover, foco, pulsado ni transición.

## 10. Regla de uso (del brief, para el README)

No usar `GDivider` como sustituto sistemático del espacio. Si dos secciones ya quedan separadas por título y aire, no hace falta una línea por instinto. Es guía de uso, **no** algo que el componente imponga. El prototipo lo muestra en el diálogo (§7): con `h4` por sección, la línea es opcional y, si se pone, decorativa.

## 11. Hallazgos para lima (API propuesta y tokens necesarios, sin valores)

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| 1 | Props | Alta | `orientation` (`horizontal` · `vertical`; defecto `horizontal`), `label` (String) + slot por defecto (texto; solo horizontal), `inset` (`none` · `both` · `start`; defecto `none`), `emphasis` (`subtle` · `strong`; defecto `subtle`; o un Boolean `strong`, a criterio de lima), `decorative` (Boolean, `false`; mismo nombre que `GInputGroupText`). **Sin** `density`, `color`, `variant`, `size`, `as` ni grosor |
| 2 | Marcado por caso | Alta | §1.1 y §2: `hr` / `div[role=separator][aria-orientation=vertical]` / `div > span` con texto / `aria-hidden="true"` con `decorative`. Con texto la raíz no lleva `role` y `decorative` no cambia nada |
| 3 | Eventos y slots | Media | Sin eventos. Slot por defecto = texto (contenido de frase, nada interactivo). Sin texto ni slot → la variante de línea |
| 4 | Avisos en desarrollo | Alta | (a) vertical cuyo padre no es flex en fila ni grid (alto 0); (b) divider hijo directo de `ul`/`ol`/`menu`; (c) `label`/slot en vertical (se ignora); (d) `inset="start"` en vertical (pasa a `both`); (e) contenido interactivo dentro del texto. El prototipo implementa (a) a (d) y los comprueba |
| 5 | Inset | Alta | Una propiedad **de entrada** heredada que define la anfitriona (nombre sugerido `--g-divider-inset`), con valor por defecto en `defaults.css` (un paso de `space`) y **sobrescrita por la anfitriona** con un selector más cercano, como `--g-tabs-inset` (#120). ¿Un solo valor para horizontal y vertical, o dos? (en el prototipo, uno: la barra vertical lo redefine) |
| 6 | Tokens (sin valores) | Alta | **Reutilizar:** grosor `--g-border-width`; línea `subtle` = el neutro de borde que ya usan las líneas internas; línea `strong` = el neutro **≥ 3:1** (hoy `border-control`, #89); texto = color `text-muted` o `text-subtle` (≥ 4.5:1) y rol tipográfico de §5 (`caption` o `body-sm`); separación texto ↔ línea y mínimo de cada línea = pasos de `space` (alias locales). **Nuevo, como mucho:** la propiedad de entrada del inset (hallazgo 5). Nada más (`tokens.md` §17.6) |
| 7 | Coherencia de las líneas internas | Media (coco) | Hoy `GMenu` separa con `border-strong` y `GDialog`/`GTable` con `border`. Si `GDivider subtle` toma uno de los dos, conviene que coco unifique (o justifique) las líneas internas para que un `GDivider` junto a un `GDialog` no tenga otro tono |
| 8 | Contraste en oscuro | Media (coco) | `strong` debe medirse ≥ 3:1 también en el tema oscuro y sobre `surface-sunken`; el texto ≥ 4.5:1 sobre ambas |
| 9 | Guía de uso | Media (mora-docs) | §10 y §6 (requisito del vertical) y §4 (cuándo `decorative`) en el README |

## 12. Comprobaciones ejecutadas

`node design/lab/divider/r01/verificar.mjs` (Playwright, Chromium, `file://`): **52 correctas, 0 fallidas**.

- **Árbol real (CDP)** de los 18 dividers de ejemplo: separators horizontales y verticales con su `orientation`; decorativos ignorados; con texto **no** separator y su texto («O bien», «أو» y el texto largo) presente como `StaticText`; ningún separator con nombre; ninguno dentro de una lista fuera de la sección 10. La tabla de la sección 8 coincide con el árbol.
- **Contraste:** texto 7.46:1, 6.84:1 y 7.46:1 (kit); `strong` 3.45:1 (superficie) y 3.17:1 (hundida).
- **Vertical:** alto = alto de contenido de la fila menos 2 × inset en las cuatro filas (32px, 44px, 26px, 32px en RTL), con `align-items: center`.
- **Inset `start`:** la línea empieza donde el texto (±1px) en `default` y `compact`.
- **RTL:** inset a la derecha; texto centrado (±1px); vertical con alto de su fila.
- **Texto largo** a 200px: envuelve, sin recorte, líneas ≥ 15px.
- **Avisos:** exactamente los cuatro usos indebidos de la sección 10.
- **Banco:** vertical decorativo sin `role`; vertical semántico con `role` y `aria-orientation`; con texto, «texto».
- **320px y 375px** sin desborde de página ni de dividers ni de botones; **320px en RTL** sin desborde.
- **`forced-colors`:** las tres formas de línea (hr, `::before`, vertical) quedan visibles con 1px; un fondo de prueba pierde su color.
- **Consola limpia** en todas las cargas (los avisos de desarrollo van a la página, no a la consola).
- `check-icons.mjs`: 0 infracciones en `design/lab/divider` (solo Lucide, sin glifos).
- Separación entre `GFormSection` con un divider puesto a mano, **con el CSS real** de `packages/vue/dist/grana.css` (para la sección «Para lima»): ver allí.

## 13. Qué NO verifiqué

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): si anuncian «separador» en `hr` y en el vertical, si VoiceOver los omite, cómo se lee el texto entre las dos líneas. Solo el árbol de Chromium.
- **Firefox y WebKit**: árbol de accesibilidad (en particular, el texto dentro de un `separator`, que es justo lo que se evita), `align-self: stretch` del vertical en grid, `forced-colors`.
- **Tema real**: los grises son del kit; el contraste de `subtle`/`strong` y del texto con los tokens reales, en claro y oscuro, lo mide coco.
- **Fila que envuelve** (`flex-wrap`) con un vertical al borde de una línea (§6).
- **Zoom al 200 %** y redondeo del grosor de 1px a escalas fraccionarias (una línea de 1px puede verse de 0 o 2px físicos).
- **Componentes reales:** el prototipo imita `GBtn`, `GDialog` y las listas sin usarlos.

## 14. Preguntas de producto realmente abiertas

Ninguna: todas las decisiones derivan de WAI-ARIA, HTML, WCAG o de decisiones vigentes. Asumidas como **propuesta kiwi pendiente de visto bueno**: semántico por defecto con `decorative` opcional; texto solo horizontal y centrado (alineado al inicio o al final queda fuera); «full width» = sin inset y sin sangrado; inset definido por la anfitriona; sin densidad ni márgenes propios; `strong` definido por ≥ 3:1 y no por el nombre del token; `GMenu` y `GDialog` conservan sus líneas internas.

## Para lima: separación entre `GFormSection` («espacio, no línea»)

El usuario pidió a lima decidir si se reabre. **Kiwi no lo decide**; aquí van los datos.

### Dónde está la decisión

El brief cita `design/contracts/form.md:529`, pero esa línea hoy es el marcado de `GErrorSummary` (la referencia quedó desfasada tras las ediciones de r02). La decisión está repartida en:

| Dónde | Qué dice |
| --- | --- |
| `design/contracts/form.md:249` (§3) | «Jerarquía por **espacio y tipografía**, sin tarjetas» |
| `design/contracts/form.md:299` y `:655` (§9) | Separación entre secciones = `--g-form-section-gap` × densidad |
| `DECISIONS.md` #161 | `GFormSection` en la Fase 1; fundamento: brief de formularios («no encerrar cada sección en otra Card») |
| `design/lab/form/r01/brief.md:118` | «divisores **sólo cuando ayuden**» |
| `design/lab/form/r01/declaracion.md:80` (§3.1) | «Sin tarjetas … divisores solo si ayudan (dialog: `g-dialog__section`)» |
| `design/lab/form/r02/declaracion.md:68` (§5.3) | «Secciones sin caja **ni divisor**» |
| `design/lab/form/estilo.md:76` (coco) | «Ningún divisor salvo la línea del pie fijo» |
| `packages/vue/src/components/GForm/GForm.css:7` y `GFormSection/GFormSection.css:6` (coco) | «sin cajas ni divisores» / «sin tarjeta, sin fondo y sin línea» |

**Matiz que importa:** el origen (brief y kiwi r01) **no prohibía** la línea: decía «solo si ayuda». La prohibición explícita («ni divisor») entra en r02 y en el estilo de coco. El contrato (§3) no menciona líneas en ningún sentido.

### Qué pasa hoy si el consumidor pone un `GDivider` a mano entre dos secciones

Medido con el CSS real (`packages/vue/dist/grana.css`, tema por defecto, `--g-form-section-gap` = 40px):

| Contexto | Sin divider | Con divider entre las dos secciones |
| --- | --- | --- |
| Dentro de `GForm` | 40px | **81px** (40 + línea + 40: el `gap` del formulario se aplica a ambos lados del divider) |
| Fuera de `GForm` (cuerpo de un diálogo, panel) | 40px | **1px** (la regla `:not(.g-form) > .g-form-section + .g-form-section` deja de cumplirse porque la hermana anterior ya no es una sección, y el divider no tiene márgenes) |

Es decir: aunque no se ofrezca nada, **el uso a mano ya rompe el ritmo** en los dos sentidos. Eso es un dato para la decisión, sea cual sea.

### Qué cambiaría si se reabre

- **Si se ofrece** (p. ej. una prop de `GForm` para todas las secciones, o de `GFormSection` para la suya): la línea iría **dentro** de `--g-form-section-gap` (la mitad a cada lado), para que el ritmo vertical no cambie; sería **`decorative`** por estándar, porque cada sección ya tiene su `hN` (WCAG 1.3.1, 2.4.6; §4 de esta declaración); y por defecto **apagada**. Archivos afectados: `form.md` §3 y §9 (lima), `GForm.css`/`GFormSection.css` y `estilo.md` (coco), `GFormSection.vue`/`GForm.vue`, `*.meta.json` y pruebas (bruno), README (mora-docs), y una fila nueva en `DECISIONS.md` que matice r02 §5.3.
- **Si no se ofrece:** igualmente convendría que el contrato diga qué hacer con un divider a mano (no ponerlo, o ponerlo con el reparto del `gap` arriba), por los 81px / 1px medidos.
- **Fase 3** (secciones plegables, «Agregar…»): las cabeceras de secciones cerradas no tienen cuerpo que dé aire; ahí una línea entre cabeceras es más defendible que en la Fase 1 (patrón de acordeón). Puede decidirse ahí sin tocar la Fase 1.

### Qué NO cambia en la Fase 1 ya construida (con la línea apagada por defecto)

- `<section>` sin `aria-labelledby`, títulos `hN` con `headingLevel`, `optional` y su insignia (#161).
- El valor y el significado de `--g-form-section-gap` (la línea, si existe, vive dentro del hueco).
- `GFormLayout`, `GFormRow`, el reparto en líneas (#175) y la **prueba obligatoria de distribución** (#184): mide filas y líneas, no la separación entre secciones.
- `GErrorSummary`, `GFormActions` y su línea del pie fijo, la convención de obligatorios.
- El aspecto de todos los formularios existentes, el playground y la auditoría r02 (nada se dibuja si no se pide).
