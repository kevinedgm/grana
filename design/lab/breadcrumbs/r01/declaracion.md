# Declaración — migas de pan (`GBreadcrumbs`, nombre de trabajo), r01: base funcional y conceptos A, B y C

> kiwi, 2026-10-07. Prototipo: `index.html?c=base|A|B|C` (`&dir=rtl`, `&w=` ancho del marco; `?c=A&final=B` = la recomendación), motor `crumbs.js`, CSS `crumbs.css` (base con neutros del tema; A, B y C con los tokens reales del tema por defecto, `dist/grana.css`). Iconos solo Lucide vía `design/lab/lucide-icons.js`. Verificación: `node design/lab/breadcrumbs/r01/verificar.mjs` (puerto 4215), **324/324** en Chromium, Firefox y WebKit (cifras en «Comprobaciones»). La base deriva de WAI-ARIA APG *Breadcrumb* y *Disclosure Navigation*, WCAG 2.2 y los contratos vigentes; **la única pregunta de producto es la elección de concepto**.

## Anatomía (base)

```
nav.g-breadcrumbs  aria-label="{labels.nav}"                                  ← punto de referencia navigation
└─ ol.g-breadcrumbs__list                                                      ← una fila, nunca se parte
   ├─ li  > a[href] > [svg icono de la aplicación, aria-hidden] + span.__label[dir=auto]   (raíz)
   ├─ li  > svg.__sep (Lucide chevron-right, flip-rtl, aria-hidden) + a[href] > span.__label
   ├─ li.is-more > svg.__sep
   │             + button.__more type=button aria-expanded aria-controls aria-label="{count} niveles más"  «+3»
   │             + ol.__pop[hidden] > li > a[href] | span (los niveles cedidos, en orden)
   ├─ li  > svg.__sep + span.__link--text (nivel sin página: ni enlace ni parada de Tab)
   └─ li.is-current > svg.__sep + a[href][aria-current="page"]   (span[aria-current="page"] si no tiene href)
+ nodos de la pista visual (modo visual del motor del tooltip, #433): aria-hidden, sin rol, solo en lo truncado
```

## Decisiones de la base

**Semántica (APG *Breadcrumb*)**

1. **`nav` con nombre obligatorio.** `aria-label` = `labels.nav` («Ruta de navegación»), sin valor por defecto (Grana es internacional) y con aviso en desarrollo si falta, como `GPagination`. Con varias migas en la página, la aplicación les da nombres distintos.
2. **`ol` de `li`, un nivel por `li`.** El orden de la lista es la jerarquía. Los separadores **no** son `li` ni texto: el lector dice «lista, 6 elementos» y lee solo los niveles. Medido con `ariaSnapshot` en los tres motores: `navigation "Ruta de navegación"` › `list` › 6 `listitem`, 5 `link` (el nivel sin página no es enlace). `list-style: none` dentro de un `nav`: comprobar con VoiceOver que la lista se conserva (no medido; si se pierde, `role="list"` en el `ol`).
3. **La última miga es la página actual: `aria-current="page"`, una sola vez.** Es enlace si trae `href` (como el ejemplo de APG: en el Tab se oye «Muestra M-0007, página actual, enlace») y `span` si no. Se distingue por peso y color de texto, no solo por color (1.4.1). En forzados, subrayada.
4. **Separador = Lucide `chevron-right` con `flip-rtl`**, `aria-hidden`, dentro del `li`, delante del enlace. Nada de `›`, `/` ni `content:` en CSS (#85, la comprobación de `check-icons.mjs` pasa). El chevron dice «dentro de» y tiene dirección (se espeja en RTL); `slash` no la tiene. Contraste medido 5,10:1 (decorativo, no exigido).
5. **Nivel sin página** (sin `href`, p. ej. «2026», una agrupación sin índice): `span`, sin foco, sin subrayado ni cursor de enlace, en `text-muted` (7,46:1). Dentro de «+N» y de la escalera de B sigue siendo texto.
6. **Enlaces sin router.** Por defecto `<a href>`; al activarlo, evento **`navigate` `{ item, index, event }`** con el evento nativo **cancelable** (`event.preventDefault()` para un router), igual que `GSidebar` (#70). Sin prop `to` ni dependencia de un router. Para `RouterLink`/`NuxtLink` (precarga, clase activa), un **slot con ámbito** por enlace (`{ item, index, current, attrs }`, la aplicación pone `v-bind="attrs"`: clase, `aria-current`, `data-*`); el componente sigue midiendo el `li`, así que el slot no rompe la cesión. Medido: el clic emite `navigate`, la aplicación cancela y la URL no cambia.
7. **Datos, no hijos:** `items` = `[{ label, href?, icon?, children? }]`. `label` es el nombre accesible (obligatorio); `icon` es un **nombre** de Lucide decorativo (convención #202; normalmente solo la raíz, `house`, registrado por la aplicación); `children` solo lo usa C. El componente no pide datos (sin `fetch`).

**Cesión en anchos estrechos (sin `@container` ni `@media`)**

8. **Una sola fila, siempre.** Las migas no se parten en líneas: el alto de la cabecera no baila al redimensionar y la página no salta. 1.4.10 se cumple porque nada se pierde: todo se recupera a 320px CSS.
9. **Orden de cesión (base):** todo → **los de en medio**, empezando por el de la raíz → **el actual se acorta** hasta ~10ch (repite el `h1` de la página: es lo que menos se pierde) → **la raíz se queda en su icono** (si lo tiene; el nombre sigue en el árbol con el patrón de texto oculto) → **cede el padre** → **cede la raíz**. Se quedan hasta el final el actual (dónde estoy) y el padre (subir uno, lo más usado). Medido (Chromium, Firefox y WebKit dan las mismas etapas): 1100 todo; 720 `Inicio · +1 · Muestras · 2026 · Lote… · Muestra M-0007`; 560 `Inicio · +3 · Lote… · Muestra M-0007`; 400 y 320 `[icono] · +4 · Muestra M-0007`; sin desbordar el `nav` en ningún ancho, LTR ni RTL.
10. **Cómo se decide (para bruno):** el componente mide **por lotes**, como `GSummary` (#352): prueba las etapas en una lista de medida (`aria-hidden`, `inert`, sin `id`) y solo toca el DOM real si cambia la etapa; observa el ancho del `nav` con `ResizeObserver` y **mide en el cuadro siguiente** (medir dentro del callback provoca «ResizeObserver loop» en WebKit, medido); vuelve a medir al cargar la fuente (`document.fonts`), porque la fuente cambia los anchos sin cambiar el del `nav` (medido: sin esto la primera etapa quedaba mal). Al cambiar de etapa se cierra lo abierto y **el foco se conserva** por índice (medido).
11. **«+N» = divulgación con enlaces de verdad** (APG *Disclosure Navigation*), no `GMenu`: `GMenu` es de acciones (`role="menu"`, `select`) y los niveles cedidos son **enlaces** (abrir en pestaña nueva, URL al pasar, clic central). `button` con texto visible «+3» (dice **cuántos** niveles hay, como «+N» de `GSummary`; no hace falta el icono `ellipsis`, que no está en la lista) y nombre `labels.more` con `{count}` que **contiene el número visible** (2.5.3). Los cedidos pasan a un `ol` **anidado en el mismo `li`**: el orden del DOM es el del Tab (botón → niveles cedidos → padre). El foco **se queda en el botón** al abrir (APG); ↓ entra en la lista; ↑/↓/Inicio/Fin recorren; Esc cierra y devuelve el foco; salir con Tab, pulsar fuera o cambiar de etapa cierran. Panel anclado con las reglas de #358.
12. **Truncado con el nombre entero accesible.** Cada nivel tiene un tope (20ch, constante de coco) salvo el actual; `text-overflow: ellipsis` sobre el texto entero, que sigue en el árbol (medido: el nombre del lote llega entero). Para quien ve: la **pista del modo visual del motor del tooltip** (#433, `utils/visualTip.js`; nodo `aria-hidden`, sin rol ni referencias) **solo en lo truncado o en la raíz con solo icono**; nunca `title` (#113). Medido: aparece a los 350 ms con el nombre entero y no aparece en lo que cabe. En táctil, la pulsación larga del motor (#385; no prototipada).
13. **Móvil:** con `pointer: coarse` todos los objetivos miden ≥ 44 × 44px (enlaces, «+N», puertas de C, controles de B), con puntero fino ≥ 24px (la raíz con solo icono también). Medido a 390px en los tres motores (Chromium con `isMobile`, Firefox y WebKit con `hasTouch`), sin desbordar la página. En un teléfono, la cesión llega a «+N · actual» o, en la recomendación, a la cara de B.
14. **RTL:** el chevron se espeja con `flip-rtl` (`scale: -1 1` bajo `:dir(rtl)`) y la fila sigue el orden lógico; funciona también en un bloque `dir="rtl"` dentro de una página LTR. Cada nombre lleva **`dir="auto"`** (nombres mezclados: «דגימה M-0007»), como #282 y #353. Medido: chevron `scale -1 1`, raíz a la derecha.
15. **Lo que no hace:** no mueve el foco al navegar (es de la aplicación: llevarlo al `h1` de la página nueva), no genera datos estructurados (`BreadcrumbList` es SEO de la aplicación), no tiene `title`, no tiene separador configurable (siempre el chevron de Lucide).
16. **Primer pintado sin medir (SSR):** hasta medir se pinta la etapa «todo»; en un teléfono podría desbordar un cuadro. Propuesta: la lista recorta su desbordamiento horizontal hasta tener `is-ready` (como `GInput`). A lo resuelve casi entero en CSS (punto A2).

## Estados medidos

Reposo · puntero (texto y subrayado) · foco visible · actual · sin página · truncado con pista · raíz con solo icono · «+N» cerrado y abierto · etapa por ancho (1100, 720, 480, 320, 240) · RTL de página y de bloque · táctil 390 · consola limpia. En forzados (reglas escritas, sin medir): actual subrayado, botones con borde `ButtonText`.

---

## A · Ruta líquida

**Estructura.** La de la base, pero los niveles no esperan a desaparecer: cada uno puede **comprimirse a una pastilla** con sus primeras letras (`neutral-soft`, `radius-pill`). El actual es siempre una pastilla de acento (`accent-soft`, «estás aquí»), el único color de la fila. Una pastilla gris significa «aquí hay más nombre del que ves», también a 1100px en un nombre largo.

**Comportamiento.** Al estrechar, la fila **se bebe por el medio**: primero los de en medio hasta su pastilla (3ch), luego el padre; la raíz queda **entera o en su icono, nunca a medias**; el actual, el último. Todo en CSS con **pesos de `flex-shrink` y mínimos** (en medio 100000, padre 30, actual 0 y, en su etapa, 1); JavaScript solo elige entre cuatro etapas (líquida, raíz con icono, actual que se acorta y, cuando ni las pastillas caben, «+N»). **Nada se esconde mientras quepa una pastilla**: de 1100 a 400px los seis niveles siguen en la fila, en el árbol y en el Tab (la base ya agrupa tres en «+3» a 560px); a 320px, «+3» con el padre y el actual. Con el **foco por teclado**, la pastilla enfocada **se despliega en su sitio** con su nombre entero y las demás se aprietan (si ni así cabe, la pista dice el nombre); con el **puntero**, la pista (un despliegue bajo el puntero haría que la fila se moviera bajo él).

**Movimiento.** En una aplicación de una sola página, **la ruta se extiende y se recoge**: al bajar un nivel, la miga nueva sale de detrás de la anterior (`translate` desde `space × 3` hacia el inicio y opacidad, `--g-duration-slow` + `--g-ease-spring`: un desplazamiento que llega, #299); al subir, la última se recoge hacia la anterior (`--g-duration-press` + `--g-ease-out`) antes de desaparecer. Con movimiento reducido, nada (medido: sin animaciones).

### Qué lo hace distinto (A)

Las migas de los frameworks tienen dos estados: caben o «…». Estas **no tienen umbral**: son una ruta que se aprieta como un acordeón y que, a 560px, todavía deja ver y alcanzar los seis niveles. El lector de pantalla y el teclado reciben siempre la ruta entera (lo que «…» les quita). Y al navegar, la ruta **crece y encoge** a la vista: quien baja un nivel ve de dónde sale el nuevo, en lugar de ver la fila sustituida de golpe.

### Gana y arriesga

- **Gana:** más niveles visibles por píxel (a 560px, 6 de 6; la base, 3 y «+3»); la ruta entera en el árbol y en el Tab mientras caben pastillas; sin JavaScript hasta el último recurso (casi todo es CSS, mejor primer pintado); el mismo lenguaje que `GSummary` (#349, «prioridad líquida»).
- **Arriesga:** una pastilla de 2 o 3 letras («La…», «M…») no se lee: hay que pasar por encima o tabular. El despliegue con el foco mueve a las vecinas (solo con teclado, sin puntero encima). Las pastillas duplican el lenguaje de `GBadge`/`chip`: coco debe distinguirlas (son enlaces).

### Medidas (A)

| Medida | Resultado |
| --- | --- |
| 1100px | Sin pastillas salvo el nombre largo del lote (tope de 20ch) |
| 560px | Etapa líquida: 6 de 6 niveles, sin «+N», 4 pastillas, el actual entero, sin desbordar |
| Foco por teclado | A 720px la pastilla enfocada se ve entera; a 560px se despliega y, si no cabe, la pista da el nombre; se pliega al irse el foco |
| 480 y 400px | 6 de 6 (a 400px la raíz pasa a su icono y el actual empieza a acortarse) |
| 320 y 240px | Agrupa en «+N»; ningún objetivo < 24px; sin desbordar a 1100/720/480/400/320 |
| Táctil 390px | Objetivos ≥ 44 × 44 (mínimo de pastilla con puntero grueso: `1em + 44px`) |
| Contraste | Pastilla 17,40:1; actual en `on-accent-soft` sobre `accent-soft` |
| Movimiento | Bajar: la miga nueva tiene animación y es la actual; subir: una sola actual; reducido: ninguna animación |

**Coste:** medio (pesos y mínimos en CSS; el `.vue` mide por lotes y compara `items` para saber si bajó o subió, L15).

---

## B · Escalón

**Estructura.** La premisa cuestionada: «unas migas son una frase de lugares». Aquí son **una acción**: una pastilla **«Subir»** (`arrow-up` + el nombre del padre, al antepasado más cercano con página) y, a su lado, el **nombre de la página como disclosure** (`chevron-down`) que abre la **ruta completa como una escalera**: un `ol` vertical, cada nivel un escalón más adentro (`space × 4`), una guía en L de borde entre escalones (estructura, como las guías de un árbol; no es un icono) y el actual marcado con una barra `accent-text` (como la barra activa de `GSidebar`, #228).

**Comportamiento.** La cara mide **lo mismo a 240 que a 1100px** y nunca cede: dos controles, dos paradas de Tab. El enlace de subir se llama «Subir a {padre}» (contiene el texto visible); el disclosure, «Ruta hasta {página}». El foco se queda en el disclosure al abrir; ↓ entra en la escalera; Esc cierra y devuelve el foco. `arrow-up` y no `chevron-left`: subir en la jerarquía no es «atrás» en el historial (la confusión clásica del botón atrás de las apps).

**Movimiento.** La escalera **baja escalón a escalón**: cada nivel entra desde su sangría con un retardo de `--g-duration-fast × profundidad / 4` (`--g-duration-slow`, `--g-ease-out`); el chevron gira 180°. Reducido: aparece entera.

### Qué lo hace distinto (B)

Ningunas migas dicen qué hacer con ellas. Estas ponen delante **lo que la gente hace** (subir un nivel), dan a la ruta una **forma de profundidad** (una escalera, no una frase) y **no tienen versión móvil**: son la misma en un teléfono y en un monitor.

### Gana y arriesga

- **Gana:** la acción más usada con el objetivo más grande; alto y ancho constantes; sin medición ni etapas (lo más barato); la profundidad se ve.
- **Arriesga:** en escritorio, **ver la ruta cuesta un clic** (las migas dejan de ser un vistazo); el `h1` y la cara repiten el nombre de la página; quien busca «las migas» de siempre no las encuentra.

### Medidas (B)

Subir = `#lote-0412`, nombre «Subir a Lote 2026-0412 · …»; disclosure cerrado que controla un `ol`; abrir: seis escalones, actual al final con `aria-current="page"`, cada uno más adentro (LTR a la derecha, RTL a la izquierda); ↓ entra; Esc vuelve; la cara no desborda a 1100/320/240, alto ≤ 40px; contraste 6,54:1 (subir) y 17,40:1 (página); táctil 390: 44px de alto.

**Coste:** bajo.

---

## C · Puertas

**Estructura.** La premisa cuestionada: «el separador es decoración». Donde la aplicación da los **hermanos del nivel siguiente** (`children` del nivel anterior), el chevron se convierte en **puerta**: un `button` («Otras páginas en {nivel}», `aria-expanded`, `aria-controls`) que abre una lista de **enlaces** de ese nivel, con el de la ruta marcado (`aria-current="true"` + `check` de Lucide). Sin datos, el separador sigue siendo decorativo (medido: 4 puertas de 5 separadores; «Muestras» no da hijos porque su siguiente nivel no tiene páginas).

**Comportamiento.** Del lote 0412 al 0413 sin subir y volver a bajar. Clic o Intro abren con el foco en la puerta; **↓ abre y pone el foco en el de la ruta** (el punto de partida natural para ir al de al lado); ↑/↓ recorren; Esc vuelve a la puerta; elegir emite `navigate` con ese destino. Se combina con la cesión de la base (o de A): una puerta cedida dentro de «+N» no se muestra.

**Movimiento.** La puerta **gira** su chevron hacia abajo al abrir (90°; −90° sobre el espejo en RTL, medido) y toma `accent-soft`: el separador «se abre» hacia la lista que cuelga de él.

### Qué lo hace distinto (C)

Las migas solo suben. Estas también **se mueven de lado**, que es lo que hace quien revisa lotes, expedientes o carpetas uno tras otro, y lo hacen **sin añadir piezas**: el sitio que ya ocupaba el separador hace el trabajo.

### Gana y arriesga

- **Gana:** navegación lateral en dos gestos; cero espacio extra en reposo; se enciende sola con los datos (sin prop).
- **Arriesga:** **descubrimiento**: en reposo una puerta parece un separador (coco puede darle una pista de forma); **casi el doble de paradas de Tab** (5 enlaces + 4 puertas); la aplicación debe dar `children` (o cargarlos al abrir, reservado); con puntero grueso cada puerta suma 44px a la fila (cede antes).

### Medidas (C)

Puertas solo donde hay hijos; nombre «Otras páginas en 2026»; ↓ abre con el foco en el lote de la ruta (`aria-current="true"`); ↓ siguiente; Esc vuelve a la puerta; clic abre sin mover el foco al panel; elegir emite `navigate` con «Lote 2026-0413»; puerta ≥ 24 × 24 (44 × 44 en táctil); contraste del chevron 5,00:1 (control, ≥ 3); sin desbordar a 720/480/320.

**Coste:** medio (un panel por nivel con datos).

---

## Comparativa

| | Base | A · Ruta líquida | B · Escalón | C · Puertas |
| --- | --- | --- | --- | --- |
| Pregunta que contesta | ¿Dónde estoy? | ¿Dónde estoy, entero, en cualquier ancho? | ¿Cómo subo? | ¿Qué hay al lado? |
| Seis niveles a 560px / 400px | 3 + «+3» / 2 + «+4» | **6 de 6 / 6 de 6** (pastillas) | Subir + nombre | 3 + «+3» / 2 + «+4» |
| Lo cedido, para lector y teclado | Dentro de «+N» | **Todo en la lista** mientras caben pastillas | Dentro de la escalera | Como la base |
| Paradas de Tab (seis niveles, ancho) | 5 | 5 | 2 | 9 |
| Datos de la aplicación | `label`, `href`, `icon` | Igual | Igual | + `children` |
| Movimiento propio | — | La ruta se extiende y se recoge; la miga enfocada se despliega | La escalera baja | La puerta gira y abre |
| JavaScript de medida | Etapas | Casi todo CSS; etapas al final | Ninguno | Etapas |
| Coste | Bajo | Medio | Bajo | Medio |
| Riesgo principal | Genérico; lo de en medio desaparece | Pastillas de 2–3 letras | Un clic más en escritorio | Descubrir las puertas; Tab casi doble |

## Recomendación

**A por defecto, con la cara de B como su última etapa, y las puertas de C como capacidad que se enciende sola cuando la aplicación da `children`.** Se ve en `?c=A&final=B` (medido: a 480px sigue líquida; a 260px pasa a «Subir · página»; al ensanchar vuelve a la ruta sin perder el foco).

- **A** porque resuelve el problema real de las migas (el ancho) **sin esconder**: a 560px la ruta entera sigue visible, en el árbol y en el Tab; casi todo es CSS y habla el mismo idioma que `GSummary`.
- **B como última etapa** porque cuando ni las pastillas caben (un teléfono con seis niveles), «+N» es una adivinanza y «Subir · página» es la acción que se hace; la escalera conserva la ruta entera a un toque. No es un modo que la aplicación elija: es lo que A hace al final.
- **C como capacidad** porque sirve mucho a unos productos (lotes, expedientes, archivos) y nada a otros; si no hay `children`, no existe. Cuesta Tab, así que no debe estar siempre.

## Qué lo hace distinto (resumen de la recomendación)

Unas migas que **no esconden la ruta para caber**: se aprietan nivel a nivel por prioridad, la miga que recibe el foco se abre en su sitio, la ruta **crece y encoge** al navegar, y cuando ya no queda sitio no dejan un «…» sino la acción que importa, **subir**, con la ruta entera como una escalera a un toque. Donde la aplicación lo sabe, los separadores son **puertas** al nivel de al lado. Todo con enlaces de verdad (nada de `role="menu"`), el nombre entero siempre en el árbol y 44px en táctil.

## Comprobaciones

`node design/lab/breadcrumbs/r01/verificar.mjs` · 2026-10-07 · puerto 4215 · **324 de 324 pasan**.

| Motor | Base | A | B | C | A + B |
| --- | --- | --- | --- | --- | --- |
| Chromium | 45/45 | 25/25 | 17/17 | 17/17 | 4/4 |
| Firefox | 45/45 | 25/25 | 17/17 | 17/17 | 4/4 |
| WebKit | 45/45 | 25/25 | 17/17 | 17/17 | 4/4 |

Diferencias por motor: en WebKit de Playwright el Tab no llega a los enlaces (como Safari sin «Tab resalta cada elemento»), así que «Tab desde +N abierto entra en sus enlaces» se anota como no medido allí y el foco por teclado se simula con una tecla seguida de `focus()` (`:focus-visible`) en los tres motores; `pointer: coarse` se emula en los tres (Chromium con `isMobile`, Firefox y WebKit con `hasTouch`); en WebKit un clic no enfoca el botón (el criterio comprueba que el foco no entra en el panel).

**No comprobado:** lector de pantalla real (VoiceOver, NVDA, TalkBack): la lista dentro del `nav` con `list-style: none` en Safari, «página actual» en el último enlace, «+N» con su lista anidada, la escalera de B y las puertas de C con `aria-current="true"`; táctil real (pulsación larga del motor sobre lo truncado, no prototipada); `forced-colors` real (reglas escritas, sin medir); zoom 200 % y texto grande; un tema distinto al por defecto y el tema oscuro; IME y nombres muy largos en CJK; el slot de enlace con un `RouterLink` real.

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombre y entrega | `GBreadcrumbs` (`g-breadcrumbs`), categoría navegación, contrato propio `design/contracts/breadcrumbs.md`. En el paquete principal si cabe en el tope de 8 KB gzip de #328 (estimación de kiwi: base + A ≈ 3 KB, + escalera y puertas ≈ 5 KB); si no, entrada propia. **Componente complejo** (paneles anclados sobre otros elementos y medición): coco y bruno en Opus |
| L2 | Props | `items` (Array, obligatorio), `labels` (`nav` siempre; `more`, `up`, `path` y `children` según lo que pueda pintarse, con `{count}`/`{label}`; sin valores por defecto, avisos en desarrollo como `GPagination`), `id`. **No existen:** `to`, `router`, `separator`, `maxItems`/`itemsBefore`/`itemsAfter` (la cesión es intrínseca, sin umbrales), `size` (hereda la tipografía `body-sm`; decidir con coco si hace falta `density`) |
| L3 | Datos | Nivel `{ label, href?, icon?, children? }`; `label` = nombre y texto; `icon` = nombre de Lucide decorativo (#202, registrado por la aplicación; `house` no está en la lista de la librería); `children` = `[{ label, href }]`. Clave para `v-for`: `href` o índice (decidir; sin `id` obligatorio). Un nivel sin `label` se ignora con aviso |
| L4 | Eventos y slot | `navigate` `{ item, index, event }` cancelable (#70), también desde «+N», la escalera y las puertas. Slot con ámbito para el enlace (`{ item, index, current, attrs }`; nombre a decidir, `link` propuesto). Sin `update:modelValue`: la ruta es dato de la aplicación |
| L5 | Iconos | Ninguno nuevo en la lista de la librería: `chevron-right` (separador y puerta, `flip-rtl`), `arrow-up` (subir, B), `chevron-down` (disclosure, B) y `check` (el de la ruta, C) ya están. **No** se usa `ellipsis` («+N» es texto) |
| L6 | Tokens y constantes | **Ningún token nuevo.** Constantes de diseño para `tokens.md` y #187: tope de una miga 20ch, pastilla 3ch, suelo del actual 10ch (base) y 8ch (A), sangría de la escalera `space × 4`, desplazamiento de entrada `space × 3`, retardo de escalón `duration-fast × d / 4`. A usa `accent-soft`/`on-accent-soft` (actual) y `neutral-soft` (pastilla); B, `accent-text` (barra) y `neutral-soft`; C, `accent-soft` (puerta abierta) |
| L7 | Pista | `GBreadcrumbs` es un cliente más del **modo visual** del motor (#433): un nodo por enlace truncado o raíz con solo icono, `disabled()` mientras el nombre cabe; grupo `nav` (#388), lado `bottom`. Sin `title`. La pista del foco de A sale solo si ni desplegada cabe |
| L8 | Paneles | «+N», la escalera y las puertas son paneles anclados con las cuatro reglas de #358 y `placeAround`/`placeBlock`; en la capa superior (`popover="manual"`), porque las migas suelen vivir en cabeceras con `overflow: hidden`. Uno abierto a la vez. Esc no llega a un `GDialog` ancestro |
| L9 | Medición | Por lotes, con lista de medida o anchos en caché; `ResizeObserver` del `nav` con medida en el cuadro siguiente (WebKit); volver a medir con `document.fonts`; conservar el foco por índice al cambiar de etapa; primer pintado recortado hasta `is-ready` (punto 16) |
| L10 | Página actual | `aria-current="page"` siempre en el último (APG). Reservar una forma de decir «la ruta no incluye la página» (`current: false` en el último o prop global) si un producto lo pide; no en v1 |
| L11 | Idioma | `dir="auto"` en cada nombre (#282, #353); el chevron con `flip-rtl` |
| L12 | Personalidad | Registrar en `DECISIONS.md` la elegida: A «la ruta se extiende y se recoge» con `--g-ease-spring` (uso permitido por #299: desplazamiento que llega) y `--g-duration-slow`, recogida con `--g-duration-press` + `--g-ease-out`; B escalera con retardo por escalón; C giro del chevron. Patrón único de movimiento reducido (#299) |
| L13 | Subir o bajar | Regla para animar (A): si los nuevos `items` son los anteriores más uno al final (mismos `href`), la última entra; si son los anteriores sin el último, el último sale; cualquier otro cambio, sin animación |
| L14 | Fronteras | `GSidebar` dice la sección, `GBreadcrumbs` la profundidad (receta: barra lateral + migas en la cabecera); `GStepper` es un proceso, no un lugar (ningún concepto dibuja pasos); `GMenu` no se usa para los cedidos (son enlaces) |
| L15 | Reservas | `children` cargados al abrir (evento de petición + estado de carga, sin `fetch`); datos estructurados `BreadcrumbList` (de la aplicación); `current: false`; separador configurable (no se recomienda) |
| L16 | Pruebas de bruno | Las de `verificar.mjs` como base de `tests/breadcrumbs.spec.mjs`: etapas por ancho, «+N» y teclado, pista, RTL, táctil, `navigate` cancelable, foco al cambiar de etapa, movimiento reducido |

## Pregunta de producto (una)

**¿Qué forma tienen las migas de pan de Grana?**

1. **A + B al final + C con datos (recomendada):** la ruta se aprieta en pastillas sin esconder niveles; en un teléfono, «Subir · página» con la ruta en escalera; puertas a los hermanos cuando la aplicación da `children`.
2. **Solo A:** la ruta líquida; cuando no caben ni las pastillas, «+N». C y B reservadas.
3. **B siempre:** «Subir · página» en todos los anchos y la ruta como escalera a un toque.
4. **La base + C:** la forma convencional con «+N», y las puertas cuando hay `children`.

*Si se elige una opción con C, una segunda pregunta menor (puede decidirla coco con su banco):* ¿la puerta se distingue del separador en reposo (forma de botón) o solo al pasar el puntero o enfocarla?
