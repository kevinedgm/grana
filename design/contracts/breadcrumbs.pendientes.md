> **Aplicado** el 2026-10-07 en `7678bd6` (lima). La sección nueva de `tokens.md` es **§41** (no §38: §38 a §40 son de `GSlider`, `GTag` y `GAccordion`); #501 cita §41. El «Ampliado en #501» de §7 va tras el de #313 (no había texto de `GSummary` en ese párrafo). En `tooltip.md` el modo visual con nombre recortado nombra también a `GTag` (#470), que usa el mismo caso: «primer cliente» de #496 se lee como «uno de los dos primeros». §8 (navigate de `GSidebar`) pasó a `PENDIENTES.md` §6, ampliado a `GCard` y `GTag`. **No aplicado:** §3.4 (`./breadcrumbs` solo si bruno mide más de 8 KB) y §7 `CLAUDE.md` (al cerrar el componente). Este archivo queda como rastro.

# Pendientes compartidos de `GBreadcrumbs` (lima, 2026-10-07)

Este encargo corrió en paralelo con otros contratos, así que **no se tocaron archivos compartidos**. Aquí va, ya redactado, lo que hay que integrar: las filas de `DECISIONS.md` (#490 a #503) y los cambios exactos en `docs/contract/tokens.md`, `docs/contract/api.md`, `docs/contract/icons.md`, `design/contracts/tooltip.md`, `PENDIENTES.md` y, al cerrar el componente, `CLAUDE.md`. Contrato: `design/contracts/breadcrumbs.md`.

---

## 1. `DECISIONS.md`: filas #490 a #503 (añadir al final de la tabla, en orden)

| 490 | **`GBreadcrumbs`: qué es, frontera y paquete** (kiwi r01 L1, L14; `design/contracts/breadcrumbs.md`). Migas de pan: dicen **dónde está** la página en una jerarquía y dejan **subir**; tag `g-breadcrumbs`, categoría navegación. **Paquete principal** `@grana/vue` con el tope de 8 KB gzip de #328 (estimación de kiwi ≈ 4 a 5 KB); **si bruno mide más, la salida ya está decidida:** entrada propia `@grana/vue/breadcrumbs` (global UMD `GranaBreadcrumbs`, lo compartido por `__shared`, CSS en `grana.css`), que bruno aplica sin volver a lima y declara en `exports`, `typesVersions`, `ENTRIES` y `src/types.test.js` (#442, #443). Compuertas: `grep -q "g-breadcrumbs__door"` y `grep -q "g-breadcrumbs__stairs"` sobre `grana.css`; con entrada propia, además `! grep -q "GBreadcrumbs" dist/grana.js` y `test -f dist/breadcrumbs.js`. Fronteras: `GSidebar` dice la sección y las migas la profundidad (mismo contrato de enlaces, #70); `GStepper` es un proceso, no un lugar; `GMenu` no se usa (los niveles son enlaces). **Componente complejo:** coco y bruno en Opus | Es navegación de cabecera que casi toda aplicación con jerarquía importa; ningún otro componente lo consume, así que una entrada propia es viable si pesa; decidir las dos ramas antes de construir evita que bruno se detenga (lección de #317 → #328 y de #415, donde la estimación de 3–4 KB acabó en 8,4) | Solo entrada propia sin medir; volver a lima si supera el tope; usar `GMenu` para los niveles cedidos |
| 491 | **Identidad de `GBreadcrumbs`: A «Ruta líquida» por defecto + la cara de B «Escalón» como su última etapa + las puertas de C con datos** (**decisión del usuario del 2026-10-07**; kiwi `design/lab/breadcrumbs/r01/`, commit `68a6ff2`, recomendación; `breadcrumbs.md` §«Forma elegida»). **A:** nada se esconde mientras quepan pastillas; los niveles se comprimen por prioridad con pesos de `flex-shrink` (en medio, luego el padre; la raíz entera o en su icono; el actual el último); la miga con foco por teclado se despliega en su sitio; al navegar en una SPA la ruta se extiende y se recoge (#500). **B como última etapa** (no es un modo): cuando ni las pastillas caben, «Subir · página» (pastilla `arrow-up` al antepasado con página + el nombre de la página como divulgación que abre la ruta entera en escalera); **«+N» no existe**. **C como capacidad:** el separador se vuelve botón que abre los hermanos del nivel siguiente **solo cuando la aplicación da `children`**. **Qué lo hace distinto:** no esconde la ruta para caber (a 560px seis de seis niveles visibles y en el Tab), la ruta crece y encoge a la vista, y al final queda la acción que se hace (subir) en vez de un «…»; los separadores son puertas al nivel de al lado | El problema real de las migas es el ancho: A lo resuelve sin esconder y casi en CSS, con el lenguaje de `GSummary` (#349); «+N» es una adivinanza en un teléfono y «Subir» es lo que se hace; C sirve mucho a unos productos (lotes, expedientes, archivos) y nada a otros, y cuesta Tab, así que solo existe con datos | Solo A con «+N» al final; B siempre (ver la ruta costaría un clic en escritorio); la base convencional + C; C siempre visible |
| 492 | **Semántica de `GBreadcrumbs`** (APG *Breadcrumb*; L10, L11; `breadcrumbs.md` §«Estructura accesible»). `nav` con nombre (`labels.nav` o `aria-labelledby` en los atributos; aviso si falta) + `ol` con **un `li` por nivel**; separador = Lucide `chevron-right` con `flip-rtl`, `aria-hidden`, **dentro del `li`** delante del enlace (ni `li` ni texto ni `content:`); **`aria-current="page"` una sola vez, en el último nivel** (`a` con `href`, `span` sin él; en la escalera, en su escalón); nivel sin `href` = `span` sin foco; en una puerta, el hijo de la ruta con **`aria-current="true"`** y `check`; `dir="auto"` en cada nombre; listas de los paneles sin rol ni nombre (divulgación APG); sin `title`; sin `role="list"` de entrada (pendiente de VoiceOver). **La ruta sin la página** (`current: false`) queda reservada (#503) | APG: el lector dice «lista, N elementos» y solo lee los niveles; `aria-current="true"` distingue «el de esta ruta» de la página actual, que ya lleva `page`; `role="list"` sin haber medido la pérdida añadiría ruido | Separadores como `li` o texto; `aria-current="page"` en el hijo de la puerta; `title` en lo recortado; `current` por nivel en v1 |
| 493 | **Props y datos de `GBreadcrumbs`** (L2, L3; `breadcrumbs.md` §«Props»). Solo **`items`** (Array, obligatoria) y **`labels`** (Object, `{}`). Nivel `{ label, href?, icon?, children? }`: `label` obligatorio (sin él se ignora con aviso), `href` hace enlace, `icon` es **nombre** de Lucide (#202, normalmente `house` en la raíz, registrado por la aplicación), `children` `[{ label, href? }]` son los **hermanos del nivel siguiente**; otros campos llegan a los slots. Clave = **índice**; identidad para el movimiento = `href` o, sin él, `label`. `items` vacío: no se pinta nada. **`labels`** (cadena con `{label}` o función `({ label })`, sin valores por defecto): `nav` (siempre), `up` y `path` (con dos o más niveles: la última etapa puede llegar en cualquier ancho) y `children` (si hay puertas); `up` y `path` deben contener `{label}` (2.5.3). **No existen:** `to`, `router`, `separator`, `maxItems`/`itemsBefore`/`itemsAfter`, `size`, `density`, `modelValue`, `id` (ids de `useId()`), `labels.more` | La cesión es intrínseca (sin umbrales) y la ruta es dato de la aplicación; el texto visible de «Subir» y de la divulgación es un nombre de nivel, así que el nombre accesible debe contenerlo; un nombre de nivel no es único, el `href` sí suele serlo | Umbrales de niveles visibles; separador configurable; `id` obligatorio por nivel; textos por defecto |
| 494 | **Enlaces, `navigate` y slot `link` de `GBreadcrumbs`** (L4; `breadcrumbs.md` §«Enlaces»). `<a href>` por defecto; `navigate` **`{ item, index, event, from }`** con el evento nativo **cancelable** (#70), `from` = `path` · `up` · `stairs` · `door` (con `door`, `item` es el hijo e `index` la posición del nivel delante del cual está la puerta). **Solo se emite con activación primaria sin modificadores** (botón 0, sin Ctrl/⌘/Mayús/Alt, o Intro): abrir en pestaña nueva es del navegador. Desde un panel: se cierra y el foco vuelve al disparador **antes** de emitir. **Slot `link` único** para todos los `<a>` (fila, «Subir», escalera, puertas), alcance `{ item, index, current, from, attrs, content }`: el elemento recibe `v-bind="attrs"` (`href`, clases, `aria-current`, `aria-label`, `onClick`) y pinta `<component :is="content" />` (el interior que corresponde); la medida no usa el slot. Slot **`icon`** `{ item, index }` que manda sobre `icon` por nombre (#202) | Sin dependencia de un router y con el mismo contrato que `GSidebar`; si se emitiera con Ctrl/⌘+clic, una aplicación que cancela para su router rompería «abrir en pestaña nueva»; `content` conserva la anatomía (hueco, `__label` con `dir="auto"`) que miden la cesión y la pista; un solo slot evita cuatro casi iguales | Prop `to`; un slot por lugar; que la aplicación pinte el interior a mano; emitir con modificadores |
| 495 | **Cesión de A: cuatro etapas y medida por lotes** (L9; `breadcrumbs.md` §«Cesión»). Etapas en orden, la primera que cabe: **`liquid`** (todos, comprimidos en CSS) → **`root-icon`** (si la raíz tiene `icon`) → **`shrink`** (el actual también se acorta, suelo `8ch`) → **`step`** (la cara de B; con dos o más niveles). Pesos de `flex-shrink` **en medio `100000`, padre `30`, actual `0` (`1` en `shrink`), raíz `flex: none`**; mínimo de pastilla `3ch` de nombre; tope `20ch` salvo el actual; 44px con `pointer: coarse`. Medida **por lotes** como `GSummary` (#352): lista de medida inerte o anchos en caché; el DOM real solo cambia si cambia la etapa; **solo el ancho** del `nav` (`observeSize`), medido **en el cuadro siguiente** (WebKit); se vuelve a medir con `items` y con `document.fonts`; `data-clipped` medido aparte (solo cambia el fondo); al cambiar de etapa se cierra lo abierto y **el foco se conserva por nivel**; primer pintado `liquid` con la lista recortada hasta `is-ready`; **cambiar de etapa nunca se anima**; **alto Δ0** de la raíz entre etapas | Kiwi midió las etapas iguales en los tres motores y el «ResizeObserver loop» de WebKit; sin la medida tras la fuente la primera etapa salía mal; el alto constante evita que la cabecera baile | Umbrales por ancho (`@container`, `@media`); medir en el propio callback; animar el paso de etapa |
| 496 | **Despliegue por foco y pista visual de `GBreadcrumbs`** (L7; `breadcrumbs.md` §«El foco despliega»; **enmienda** de `tooltip.md` §«Modo visual», #433). El `li` cuyo enlace tiene `:focus-visible` se despliega **en CSS** (`:has(> .g-breadcrumbs__link:focus-visible)`), sin transición de tamaño; con el puntero no se despliega. **Primer cliente del modo visual con el nombre visible pero recortado** (no oculto): un nodo por nivel de la fila, «Subir», la divulgación y **cada puerta**, al final de la raíz (nunca en el `ol`); texto = el `label` del nivel (en la puerta, su nombre resuelto, como el botón de contraer de `GSidebar`, #436); `disabled()` verdadero mientras cabe entero (medido al pedirlo: con foco por teclado la pista solo sale si ni desplegado cabe); la puerta siempre activa (control de solo icono); grupo `nav`, lado `bottom`; comportamiento del motor sin excepciones | Para quien ve, el nombre entero de una pastilla; el despliegue con puntero movería la fila bajo él; la pista de la puerta ayuda a descubrirla sin cambiar su forma en reposo (que decide coco, #498) | `title`; desplegar con el puntero; un nodo de tooltip propio |
| 497 | **La cara de B como última etapa** (`breadcrumbs.md` §«Última etapa»). «Subir» = `a` al **antepasado más cercano con `href`** con `arrow-up` y el nombre de ese nivel (nombre `labels.up`); si ninguno tiene página, no se pinta. La divulgación = `button` con el **nombre de la página** y `chevron-down` (nombre `labels.path`, `aria-expanded`, `aria-controls`) que abre la **escalera**: un `ol` con todos los niveles, sangría `space × 4` por nivel, guía en L de borde, actual con `aria-current="page"` y barra `accent-text` (#228); nombres en varias líneas; **sin puertas** en la escalera. Dos paradas de Tab a cualquier ancho | `arrow-up` y no `chevron-left`: subir en la jerarquía no es «atrás» en el historial; la escalera da a la ruta forma de profundidad y la conserva entera a un toque | «+N»; `chevron-left`; puertas dentro de la escalera en v1 |
| 498 | **Puertas de `GBreadcrumbs` (C)** (`breadcrumbs.md` §«Puertas»). Delante del nivel *i* cuando el nivel *i − 1* trae `children` no vacío, **solo en las etapas de fila**; sustituye al separador. `button` (`aria-expanded`, `aria-controls`, `aria-label` = `labels.children` con el nivel *i − 1*) con `chevron-right` `flip-rtl`, que abre una lista de **enlaces** con el hijo de la ruta marcado (mismo `href`; si no, mismo `label`). `children` en el último nivel no se pinta (aviso; reservado). **Aspecto en reposo: decisión estética de coco** en su banco con cuatro condiciones: parada de Tab con foco visible, nombre y pista; hover propio y `cursor: pointer`; **≥ 3:1 como control** (1.4.11) en claro, oscuro y un tema distinto; si en reposo se ve igual que el separador, justificado y medido en la auditoría | La «duda menor» de kiwi es estética y su respuesta depende de medir en el banco; las condiciones garantizan que se descubre con teclado y puntero sea cual sea la forma; solo con datos porque cuesta una parada de Tab por puerta | Preguntárselo al usuario; puerta siempre presente; `GMenu` |
| 499 | **Paneles de `GBreadcrumbs`** (L8; `breadcrumbs.md` §«Paneles»). Escalera y puertas en la **capa superior** (`popover="manual"`), dentro del `nav`; debajo del disparador alineados al inicio (al final si no caben; arriba si abajo no hay sitio) con `placeBlock`; reglas **1 a 3** de #358 (la 4 se cumple sola: no hay opción activa) y, sin hoja móvil, la 3 rige siempre. **Uno abierto a la vez.** Abrir no mueve el foco (APG); ↓ entra (puerta: al hijo de la ruta; escalera: al primero); ↑/↓ circulares, Inicio/Fin; Esc cierra y devuelve el foco con `preventDefault()` + `stopPropagation()` (**no** cierra un `GDialog` ancestro, como `GMenu`); salir con el foco, pulsar fuera, cambiar de etapa o salir el ancla cierran sin mover el foco | Las migas viven en cabeceras con `overflow: hidden`; mismas reglas que el resto de paneles anclados para que no «pivoten» al desplazar | Paneles en el flujo; hoja móvil; mover el foco al panel al abrir |
| 500 | **Movimiento de `GBreadcrumbs`** (L12, L13; `breadcrumbs.md` §«Movimiento»; `tokens.md` §29). **Bajar un nivel:** el nuevo sale de detrás del anterior con `translate` desde `space × 3` (reflejado en RTL) con **`--g-duration-slow` + `--g-ease-spring`** y opacidad con `--g-duration-press` + `--g-ease-out`: **quinto uso del muelle** (§29.1), acotado al `translate` de un desplazamiento que llega desde un elemento de origen, como la ficha de `GCombobox` (#336); aprobado por el usuario con A. **Subir:** el último se recoge hacia el anterior con `--g-duration-press` + `--g-ease-out` (#152), como **copia saliente** inerte (`aria-hidden`, `inert`, sin ids) hasta `animationend`. **Regla de L13:** con `is-ready` y en una etapa de fila, si los nuevos `items` son los anteriores más uno al final (misma identidad, `href` o `label`), entra el último; si son los anteriores sin el último, sale; cualquier otro cambio, sin animación; nunca al montar ni en `step`. **Escalera:** escalones desde `space × 2` con `--g-duration-slow` + `--g-ease-out` y retardo `--g-duration-fast × min(i, 4) / 4`; divulgación con giro de 180°. **Puerta:** giro de 90° (−90° en RTL) con `--g-duration-press` + `--g-ease-out`. **Sin animación:** el despliegue por foco y el cambio de etapa. Keyframes `g-breadcrumbs-enter…`, `-leave…`, `-stair…`. Reducido: nada se desplaza ni gira (§29.3) | La información (de dónde sale el nivel nuevo) es redundante con el foco y `aria-current`; el muelle se limita a lo que §29.1 permite (un desplazamiento que llega, 0,5px de rebase), sin que nada «nazca» con él; el retardo acotado evita que una ruta profunda tarde | Muelle en la opacidad o en la escalera; animar el cambio de etapa o el despliegue; retardo sin tope |
| 501 | **Tokens de `GBreadcrumbs`: ninguno nuevo** (L6; `breadcrumbs.md` §«Tokens»; `tokens.md` §38). Consume `body-sm`, `action-weight`, `text`/`text-muted`/`text-subtle`, `accent-soft`/`on-accent-soft`, `accent-text`, `neutral-soft`/`on-neutral-soft`, `neutral-strong`/`on-neutral`, `border`, `border-strong`, `surface`, radios `pill`/`sm`/`md`/`xs`, `shadow-2`, `space-1`, `border-width`, foco, `duration-fast`/`press`/`slow`, `ease-out`, `ease-spring` y, en la pista, los de `GTooltip`. **No son tokens:** literales de unidad **`20ch`**, **`3ch`**, **`8ch`** (amplían §7 y #187, como `7ch`/`4ch` de `GSummary`); constantes de diseño (pesos `100000`·`30`·`1`·`0`, sangría `space × 4`, anchos de paneles de coco); constantes de coreografía (`space × 3`, `space × 2`, retardo `fast × min(i, 4) / 4`, giros 90° y 180°); datos del `.vue` (`data-stage`, `data-clipped`, `is-ready`, `is-entering`, `is-leaving`, `--_depth`, `--_x`/`--_y`/`--_max`, `data-side`) | §17.6: ningún existente se queda corto; los topes en `ch` siguen al texto, no al tema | Tokens de componente `--g-breadcrumbs-*`; tope en píxeles |
| 502 | **Avisos de desarrollo de `GBreadcrumbs`** (`breadcrumbs.md` §«Avisos»; `[Grana GBreadcrumbs]`, una vez por instancia y motivo, guarda `process.env.NODE_ENV`): (1) sin `labels.nav` ni `aria-labelledby`; (2) `items` vacío o no arreglo; (3) nivel sin `label`; (4) con dos o más niveles, falta `up` o `path`; (5) hay puertas y falta `children`; (6) `up`/`path` en cadena sin `{label}`, o `children` sin `{label}` con más de una puerta; (7) `children` en el último nivel; (8) hijo sin `label`; (9) el elemento del slot `link` no recibió `attrs` | Los textos no tienen valor por defecto (Grana es internacional); 2.5.3 depende de que el nombre contenga el texto visible; un slot mal enlazado rompe la medida y la navegación sin error visible | Textos por defecto en un idioma; fallar en silencio |
| 503 | **Reservas de `GBreadcrumbs`** (L10, L15; `breadcrumbs.md` §«Fuera de v1»): «+N» y `labels.more`; **la ruta sin la página** (`current: false` en el último o prop global); `children` cargados al abrir (evento de petición y estado de carga, sin `fetch`) y búsqueda en una puerta larga; puerta al final (hijos de la página actual) y puertas en la escalera; `density`/`size`; exponer la etapa. **Nunca:** separador configurable, `to`/router propio, `role="menu"` para los niveles, `title`, partir la fila | APG y kiwi recomiendan la ruta con la página en v1; cada reserva añade API o estados sin un producto que la pida | Incluirlas en v1 |

---

## 2. `docs/contract/tokens.md`

### 2.1 Sección nueva al final (después de §37)

```markdown
## 38. Migas de pan (`GBreadcrumbs`; sin tokens nuevos)

**`GBreadcrumbs` no añade tokens** (`design/contracts/breadcrumbs.md`, DECISIONS.md #501; §17.6: ningún existente se queda corto). Texto **body-sm** (`--g-text-body-sm-{size|line|weight|tracking}`, `--g-font-ui`); niveles y nivel sin página en `--g-color-text-muted`, actual y hover en `--g-color-text` con `--g-text-action-weight`, separador decorativo en `--g-color-text-subtle`. **A:** actual como pastilla `--g-color-accent-soft` / `--g-color-on-accent-soft`, pastilla recortada (`data-clipped`) sobre `--g-color-neutral-soft`, `--g-radius-pill`. **B:** «Subir» `--g-color-neutral-soft` / `--g-color-on-neutral-soft` (hover `--g-color-neutral-strong` / `--g-color-on-neutral`), barra del escalón actual `--g-color-accent-text` (#228), guía en L `--g-color-border-strong` con `--g-radius-xs`. **C:** puerta abierta `--g-color-accent-soft` / `--g-color-on-accent-soft`, `check` del hijo de la ruta `--g-color-accent-text`; aspecto en reposo de coco con ≥ 3:1 como control (#498). Paneles `--g-color-surface`, `--g-color-border`, `--g-radius-md`, `--g-shadow-2`. Pista: tokens de §36, sin CSS propio.

**Movimiento** (amplía §29): el nivel que llega con `translate` en `--g-duration-slow` + **`--g-ease-spring`** (quinto uso, §29.1) y opacidad con `--g-duration-press` + `--g-ease-out`; el que se va con `--g-duration-press` + `--g-ease-out`; escalones con `--g-duration-slow` + `--g-ease-out`; giros con `--g-duration-press` + `--g-ease-out`; keyframes `g-breadcrumbs-enter…`, `g-breadcrumbs-leave…`, `g-breadcrumbs-stair…` (§29.4). Ni el despliegue por foco ni el cambio de etapa se animan. Con movimiento reducido, nada se desplaza ni gira (§29.3).

**No son tokens:**

- **Literales de unidad** (amplían §7, DECISIONS.md #187): **`20ch`** (tope del nombre de un nivel), **`3ch`** (nombre mínimo de una pastilla), **`8ch`** (suelo del actual en la etapa `shrink`).
- **Constantes de diseño:** pesos de `flex-shrink` `100000` (en medio), `30` (padre), `1` (actual en `shrink`), `0` (actual); sangría de la escalera `space × 4` por nivel; anchos de los paneles (coco, en `design/lab/breadcrumbs/estilo.md`).
- **Constantes de coreografía** (§29.6, abajo).
- **Datos del `.vue` al CSS** (§29.5, abajo).
- `24px` / `44px` (§7) como suelo de cada destino.
```

### 2.2 §29.1, tabla de curvas, fila `--g-ease-spring`, columna «Uso aprobado»: añadir al final de la celda

```markdown
; **el nivel que llega al bajar en `GBreadcrumbs`** (#500: quinto uso, solo el `translate`, desde detrás del nivel anterior; la opacidad va con `--g-ease-out`)
```

### 2.3 §29.5, añadir al final del párrafo (antes de «Las clases de estado que los acompañan…»)

```markdown
`data-stage`, `data-clipped`, `is-entering`, `is-leaving`, `--_depth` y `--_x`/`--_y`/`--_max` y `data-side` de sus paneles (`GBreadcrumbs`, #495, #499, #500).
```

### 2.4 §29.6, tabla de constantes: filas nuevas

```markdown
| `--g-space-1 × 3` (desplazamiento, reflejado en RTL) | El nivel que llega o se va en `GBreadcrumbs` (#500) |
| `--g-space-1 × 2` y retardo `--g-duration-fast × min(i, 4) / 4` | Escalones de la escalera de `GBreadcrumbs` (#500) |
| Giros `90°` (−90° en RTL) y `180°` | Puerta y divulgación de `GBreadcrumbs` (#500) |
```

### 2.5 §7, párrafo «Excepción documentada (DECISIONS.md #34)», tras la frase que empieza «**Ampliado en #299**» (y tras lo de `GSummary` si para entonces ya se integró, como pide §34): añadir

```markdown
**Ampliado en #501:** `20ch`, `3ch` y `8ch` en `GBreadcrumbs.css` (tope del nombre de un nivel, nombre mínimo de una pastilla y suelo del actual), que siguen al texto, no al tema.
```

### 2.6 §23.3 «Navegación y listas», fila nueva

```markdown
| `GBreadcrumbs` | body-sm 14/20, 400, `muted`; actual `text` con `action-weight`; en la escalera y los paneles, body-sm `text` | — |
```

---

## 3. `docs/contract/api.md`

### 3.1 «Paneles anclados: cuatro reglas comunes (#358)», primer párrafo: añadir a la lista de componentes

```markdown
, la escalera y las puertas de `GBreadcrumbs` (reglas 1 a 3; la 4 se cumple sola porque no hay opción activa; sin hoja móvil, así que la 3 rige siempre; #499)
```

### 3.2 «Iconos en los componentes», viñeta «Dato → nombre», añadir a «Aplica a …»

```markdown
, **`GBreadcrumbs`** (`items`: `icon` cadena en `g-breadcrumbs__icon`; con slot `icon`, manda el slot; #493, #494)
```

### 3.3 «Mapa de huecos», fila nueva

```markdown
| `GBreadcrumbs` | `icon` de cada nivel | `{ item, index }` | Sí (`item.icon`; normalmente solo la raíz) |
```

### 3.4 «Paquete, entradas y tipos» (solo si bruno mide > 8 KB y aplica la entrada propia de #490)

Añadir `./breadcrumbs` a la lista de entradas de `exports` del primer punto.

---

## 4. `docs/contract/icons.md`

### 4.1 §4 (tabla de iconos propios de cada componente), fila nueva

```markdown
| `GBreadcrumbs` | Separador · puerta (gira) · subir · divulgación de la página (gira) · el de la ruta en una puerta | `chevron-right` (espejado en RTL) · `chevron-right` (espejado en RTL) · `arrow-up` · `chevron-down` · `check` |
```

Ninguno es nuevo en la lista de la librería; `ellipsis` no se usa.

### 4.2 §5.4 (fila «De la aplicación») y §5.8: añadir `GBreadcrumbs` (`icon` de un nivel) a la enumeración de componentes cuyo `icon` cadena resuelve la aplicación.

---

## 5. `design/contracts/tooltip.md` (dueña: lima; integrar cuando no haya otra sesión con el archivo)

### 5.1 §«Motor interno y clientes de Grana», primer punto: añadir a la lista de clientes

```markdown
; y **`GBreadcrumbs`** (`breadcrumbs.md` §«El foco despliega», #496: niveles recortados, raíz en solo icono, «Subir», la divulgación y las puertas)
```

### 5.2 §«Modo visual», párrafo inicial: sustituir la primera frase por

```markdown
Para un control de Grana cuyo **nombre ya está en su DOM** como etiqueta **oculta visualmente** (patrón de texto oculto accesible) **o visible pero recortada** (elipsis; primer caso, `GBreadcrumbs`, #496): la pista solo **enseña** ese nombre a quien ve; no lo da.
```

### 5.3 §«Modo visual», punto 2: añadir al final

```markdown
Con un nombre **recortado**, el texto es la cadena entera de los datos (`item.label`); en un control de solo icono cuyo nombre es su `aria-label` (contraer de `GSidebar`, puerta de `GBreadcrumbs`), esa cadena.
```

### 5.4 §«Modo visual», punto 3: añadir al final

```markdown
Con un nombre recortado, `disabled()` es verdadero mientras **cabe entero** (`scrollWidth ≤ clientWidth + 1`), medido al pedirlo.
```

### 5.5 `docs/contract/tokens.md` §36, último párrafo: añadir `GBreadcrumbs` a la lista de clientes internos en modo visual.

---

## 6. `PENDIENTES.md`

Añadir en la sección de componentes (o donde se listan reservas por componente):

```markdown
- **`GBreadcrumbs` (reservado, #503):** «+N» y `labels.more`; la ruta sin la página (`current: false`); `children` cargados al abrir y búsqueda en una puerta larga; puerta al final (hijos de la página actual) y puertas en la escalera; `density`/`size`; exponer la etapa. Entorno real: VoiceOver con `list-style: none` dentro del `nav` (si se pierde la lista, `role="list"`), `RouterLink`/`NuxtLink` reales en el slot `link`.
```

---

## 7. `CLAUDE.md` (al cerrar el componente, no antes)

- En «Verificación», añadir a las compuertas `grep -q "g-breadcrumbs__door"` y `grep -q "g-breadcrumbs__stairs"` sobre `packages/vue/dist/grana.css` (y, solo con entrada propia, `! grep -q "GBreadcrumbs" packages/vue/dist/grana.js` y `test -f packages/vue/dist/breadcrumbs.js`).
- En «Estado actual», la línea de `GBreadcrumbs` con decisiones #490 a #503 cuando sea `candidate`.

---

## 8. Observación para otra decisión (no se aplica aquí)

**`GSidebar` emite `navigate` también con Ctrl/⌘+clic** (en `GSidebar.vue` no hay guarda de modificadores). Si la aplicación cancela el evento para su router, «abrir en pestaña nueva» deja de funcionar. `GBreadcrumbs` lo resuelve emitiendo solo con activación primaria sin modificadores (#494). Propuesta para lima en un encargo aparte: enmendar #70 y `sidebar.md` §«Eventos» con la misma guarda (bruno: `GSidebar.vue` y su prueba).
