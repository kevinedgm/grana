# Declaración · densidad global y por región (pieza 2) · r01

**Rol:** kiwi · **Fecha:** 2026-10-29 · Prototipo: `index.html` (+ `density-proto.css`) · Verificación: `verificar.mjs` (Chromium, 36/36).
Lo que sigue es **estructura**: los valores, los nombres finales de clases y el texto del contrato son de lima. El CSS es de coco. El `.vue` y la utilidad son de bruno.

---

## 1. La idea en una línea

**La densidad viaja por CSS; el JS solo lleva lo explícito.** Un token heredable, `--g-density` (el multiplicador 1 · 0,875 · 0,75), lo pone el tema y lo reasigna el atributo `data-g-density` en cualquier elemento. La raíz de cada componente lo lee **cuando no le pasan la prop**. La herencia del DOM resuelve sola la «región más cercana», la anidación y los paneles que se abren en la capa superior, y funciona sin JavaScript (SSR).

## 2. Precedencia (punto 1 del encargo)

| Orden | Fuente | Dónde vive | Quién la escribe |
| --- | --- | --- | --- |
| 1 | **Prop `density` explícita** del componente | Clase `--density-*` en su raíz (y, con la opción B de §4, también `data-g-density` en esa raíz) | La aplicación, por instancia |
| 2 | **Región más cercana**: el ancestro del DOM más próximo con `data-g-density` | `[data-g-density="…"] { --g-density: … }` en `grana.defaults` | La aplicación (cualquier elemento, incluidas las raíces de los componentes, porque los atributos llegan a la raíz) y los contenedores del sistema de formularios con prop (D9) |
| 3 | **Atributo en `<html>`**: la preferencia del usuario final en tiempo de ejecución | Igual que 2, sobre `:root` | La aplicación (un ajuste «vista compacta», guardado y pintado por el servidor) |
| 4 | **Clave `density` del CLI**: el valor del producto en el build | `:root:where(:not([data-g-density])) { --g-density: … }`, sin capa (forma de #561) | `@grana/cli` |
| 5 | **`default`** | `:root { --g-density: 1 }` en `grana.defaults` | coco |

**D1 · Distinguir «prop no pasada» de `default`.** Las 18 raíces que hoy declaran `default: 'default'` (`GBtn`, `GCard`, `GCheckbox` en su `meta.json`, `GDialog`, `GForm`, `GMenu`, `GSidebar`, `GSpeechTrigger`, `GSplit`, `GStack`, `GStepper`, `GSurface`, `GTable`, `GTabs`, `GWidget`, `GWidgetConfig`, `GWidgetGallery`, `GWidgetGrid`) pasan a `default: undefined`, con el **precedente exacto ya contratado** en los campos (`GInput.meta.json`: `"default": null`, `"resolvedDefault": "default"`, más una nota). El tipo no cambia (`'default' | 'comfortable' | 'compact'`, opcional), así que los `.d.ts` de #443 no cambian de forma. Sin prop, **no se emite la clase `--density-default`** (hoy `form.md` la declara «Siempre»: lima la pasa a «con prop explícita»). Con `density="default"` explícito, sí se emite y gana a la región (prototipo, 1.6 y 5.3).

**D2 · El token.** `--g-density` es un **número** (no una palabra) porque lo consumen `calc()`. Va sin registrar (como el resto de tokens) y sin valor de respaldo, porque `defaults.css` lo define. Solo admite los tres valores de #967. Un valor intermedio que escriba una aplicación no es contrato, y la lógica de JS lo lleva al paso más cercano (D7). Las clases de la pieza 3 (texto un escalón abajo) se cuelgan del mismo atributo y de las mismas clases, no del número.

**D3 · El 44 px y el 16 px ganan siempre (punto 6).** Ya van después del multiplicador (`max(44px, …)` y `max(16px, …)` dentro de `pointer: coarse`, §7 y #970). La región no los toca. Medido en el prototipo con `hasTouch`: en la región compacta la caja del campo mide 44, el área táctil del botón (`::after`) 44 y el texto editable 16 (7.2 y 7.3).

## 3. Cómo se lee la región (punto 2)

**D4 · CSS manda; no hay `provide`/`inject` de densidad.** Se descarta la clave de contexto como fuente (opción C del inventario) por tres motivos medidos o comprobados en el código:

- **SSR:** el atributo va en el marcado y la raíz sin clase lee el token. Sin JavaScript, el botón de servidor dentro de una región compacta ya mide 27 px (prototipo, 8.1). Un contexto solo serviría si el servidor conociera el valor, y un atributo escrito a mano en HTML no lo conoce.
- **La capa superior no corta la herencia de CSS:** `GMenu`, `GSelect`, `GDatePicker`, `GHelper`, `GTooltip`, `GBreadcrumbs`, `GPartyField`, `GBookingBar` y `GFab` abren `popover` **en su sitio**, y `GDialog` es un `<dialog>` en su sitio. `GCombobox` teletransporta, pero a la raíz de su `GInput`, así que tampoco sale. Es la regla 3 de la zona de marca (`api.md`). Lo que en Fluid Functionalism resuelve el contexto de React cruzando portales, aquí lo resuelve el DOM.
- **Peso:** un `inject` + `computed` en ~37 componentes costaría ~1–1,5 KiB gzip de `grana.js` (inventario §4 C), con #506 agotado.

**D5 · Lectura en JS, solo donde hay lógica:** una utilidad compartida, **`utils/density.js`** (bruno; nombre provisional):

- `readDensity(el)` devuelve `'compact' | 'comfortable' | 'default'` a partir del `--g-density` calculado del elemento (el paso más cercano). Lee la cascada real, CLI incluido.
- `densityEpoch`: un `shallowRef` contador que sube cuando cambia **cualquier** `data-g-density` del documento. Usa **un único** `MutationObserver` perezoso sobre `document.documentElement` (`subtree`, `attributeFilter: ['data-g-density']`), creado por el primer suscriptor en `onMounted` (sin efectos en el nivel superior del módulo, #444) y agrupado por cuadro.
- **Quién lo usa** (los `watch` que hoy miran `density` para volver a medir, según el código): `GTextarea:128`, `GRadioGroup:234`, `GSlider:741`, `GTabs:480-484`, `GCalendar:619`, `GAdaptiveLayout/useAdaptiveLayout.js:312`, `GFormRow:146`, la publicación de mínimos de `GNumberField:613` y `GTimeField:566`. Cada uno añade `densityEpoch` como fuente. Solo `GCard:407` (oculta la meta de prioridad baja en `compact`) necesita la palabra: `readDensity(root)`.
- **Peso estimado:** ≤ 512 B gzip (I, media). En CSS, con la opción B de §4, **desaparecen** las ~37 reglas `--density-*` (el atributo reasigna el token), así que la hoja baja. Con A se quedan.
- **Límite:** el observador ve el atributo, no un `style.setProperty('--g-density', …)` de la aplicación. Contrato: la densidad se cambia **con el atributo**, no tocando el token a mano.
- **Límite SSR de `GCard`:** con una región compacta y sin prop, la meta baja se pinta en el servidor y se quita al hidratar (una sola vez, sin animación). Pasarlo a CSS con `@container style(--g-density: 0.75)` lo resolvería sin JS donde haya soporte. Queda para coco y lima (no verifiqué el soporte en Firefox).

**D6 · Un componente que compone otro le pasa solo su densidad explícita, o `undefined`.** Hoy `GNumberField:749`, `GCombobox:2025`, `GTimeField` (`PASS`), `GCheckboxGroup:172`, `GSpeechTrigger:145,160`, `GWidgetConfig:155`, `GWidgetGallery:140`, `GFieldGroup:96` y `GCard:503,708` pasan un valor ya resuelto (`'default'` como último recurso). Eso convertiría cada hijo en «explícito» y taparía la región. Desde ahora pasan `prop ?? undefined`, y el hijo hereda por CSS. Lo mismo vale para la prop de slot `density` del slot `action` de `GInput:237`: un `<GBtn :density="density">` con `undefined` sigue a la región, que es lo correcto.

**D7 · `useFormField()` es público y no cambia de forma.** Su `density` sigue resolviendo prop > layout > formulario > `'default'`, documentado como «no ve la región; para el CSS, `var(--g-density)`». Los campos de Grana usan por dentro solo la prop explícita para su clase. Hallazgo L3: si un campo propio de la aplicación compone un `GInput`, necesita el valor explícito. Lima decide si `useFormField()` devuelve además un `densityExplicit` (nombre provisional).

## 4. A/B real: ¿la prop de un componente es también región para lo de dentro?

Este es el único punto con un intercambio real. Lo demás deriva de un estándar (la herencia del DOM, la regla de la zona).

| | **A · La prop es del componente** | **B · La prop es una región** |
| --- | --- | --- |
| Regla | `density` aprieta **ese** componente. Lo de dentro sigue a la región (`data-g-density`). Solo el sistema de formularios y `GAdaptiveLayout` publican su prop como región (D9), porque ya la comparten hoy | Una prop explícita **pone `data-g-density` en la raíz del componente**: vale para él y para todo lo que lleva dentro (botones de la barra de `GTable`, contenido de `GDialog`, `GCard`, `GSurface`, `GSidebar`…). La prop es una región con nombre corto |
| Prototipo | La tabla con `density="compact"` aprieta sus celdas, pero su barra y su menú siguen en 36 (1.10) | Barra 27 y menú 27 (5.1, 5.2). La prop explícita `default` de dentro sigue ganando (5.3) |
| Cambio para quien ya usa la prop | Δ0 fuera de los formularios. En los formularios, los botones de `GFormActions` y lo demás que esté dentro de un `GForm` con prop pasan a seguirlo (era la incoherencia del inventario §2.3) | Visible en cada contenedor con prop explícita distinta de `default`: lo de dentro también se aprieta. El paquete está en `0.1.0-beta.0` **sin publicar** |
| Modelo mental | Dos herramientas: `density` (yo) y `data-g-density` (lo de dentro) | Una: la densidad siempre es una región, y la prop es la región de ese componente. Es la frase de FF: «density is a region decision, not a per-control one» |
| CSS | Se quedan las ~37 reglas `--density-*` | Desaparecen: la raíz lee `var(--g-density)` y el atributo hace el resto. **La pieza 3 (texto) se escribe una sola vez** bajo `[data-g-density="compact"]`, en vez de en 37 clases |
| Riesgo | Barras con alturas mezcladas cuando se olvida el atributo (el problema de hoy) | Quien quiera celdas compactas pero botones normales en la barra escribe `density="default"` en esos botones o `data-g-density="default"` en la barra. `GStack` y `GSplit` (`stack.md`: «solo a su separación») pasan a apretar su contenido |
| Detalle de construcción | — | Si la aplicación pasa también `data-g-density` en la misma instancia, gana la prop (bruno: el componente lo escribe después de `$attrs`). Un componente con raíz de fragmento (`GMenu`) lo pone en el elemento que pinta (la lista) |

**Recomendación de kiwi: B.** Es una sola regla, coincide con el comportamiento de referencia, reduce CSS y deja la pieza 3 en un solo bloque. Es una decisión de producto (cambia lo que la prop promete), así que va como **pregunta 1**.

## 5. Paneles, diálogo, hoja, avisos (punto 3)

| Superficie | Hereda de | Por qué |
| --- | --- | --- |
| `popover` en su sitio: `GMenu` (y submenús), `GSelect`, `GDatePicker`, `GHelper`, `GTooltip`, `GBreadcrumbs` (escalera y puertas), `GPartyField`, `GBookingBar`, `GFab` (pila y paneles) | **La región de su disparador**, porque es su ancestro del DOM | Medido: el menú abierto desde la barra compacta está en `:popover-open`, hereda 0,75 y su fila mide 27 = el disparador (2.1 a 2.3), la regla de FF «la fila del menú se alinea con el control que la abrió». Con A, un disparador con prop explícita **no** arrastra su menú (lo arrastra la región), salvo `GCard`, que pasa la suya a su `GMenu` interno (D6) |
| `GCombobox` (popover y superficie del teléfono) | La región de su `GInput` | El `<Teleport>` va a la raíz de `GInput` (`GCombobox.vue:224`) |
| `GDialog` | **La región donde está escrito** | Medido: modal, carcasa con `--_d` 0,75, campo y botón de 27 (3.1, 3.2). #566 corta los **contextos de formulario** (lógica: registro, envío, validación), no la apariencia. Para salir de la región: `density` en el diálogo o `data-g-density` en su raíz. Es la **pregunta 2** |
| Hoja del teléfono (`GDialog mobile`, superficies de `GSelect`/`GCombobox`) | La misma que su panel | Con puntero grueso ya rigen 44 px y 16 px (D3). Ver P2 |
| `GToaster`, `GStatusIsland`, `GSpeechHost` | **Nada** (hoy no leen densidad: Δ0) | Se teletransportan a `body` y **se mudan al modal superior**. Si heredaran, un aviso cambiaría de tamaño al abrirse un diálogo compacto. Regla para el futuro: si un día tienen densidad, leen la de la página (`<html>` o el CLI), nunca la de su sitio. Reservado R3 |
| `GPageHeader` (muelle) | Su cabecera | El `<Teleport>` va a un nodo propio del muelle |

## 6. Anidación y `<html>` frente al CLI (punto 4)

- **D8 · Anidación:** manda la región más cercana (herencia del DOM). Medido: `compact` dentro de `comfortable` da 27 (1.9). `data-g-density="default"` es un valor válido y **devuelve el paso 1** dentro de una región compacta (no significa «heredar»: para heredar, no se escribe nada).
- **`<html data-g-density>` y la clave del CLI no son lo mismo.** Tienen el mismo efecto, pero otro dueño y otro momento. El CLI es **el valor del producto** (build). El atributo en `<html>` es **la elección de quien usa la aplicación** (tiempo de ejecución, guardable y pintado por el servidor sin parpadeo, como `data-theme`). El atributo gana al CLI porque el CLI emite con `:root:where(:not([data-g-density]))` (precedente #561). Así se evita el choque de #637 que tiene la zona de marca en `<html>`. Medido: CLI `compact` + `<html comfortable>` da 31,5, y CLI `compact` + `<html default>` da 36 (6).
- Una región `comfortable` sigue mandando en su caja con cualquier valor global (6).

## 7. Formularios (punto 5)

**D9 · El sistema de formularios pasa de «compartir por contexto» a «declarar región».** `GForm`, `GFormLayout`, `GFormRow`, `GFieldGroup`, `GInputGroup`, `GFormActions` y `GAdaptiveLayout` con prop explícita escriben `data-g-density` en su raíz. Sin prop no escriben nada.

- `GForm` deja de imponer `'default'` (`GForm.vue:17` pasa a `undefined`) y deja de emitir `g-form--density-default` sin prop. Así un `GForm` dentro de una región la sigue.
- Los campos **dejan de calcular su clase desde el contexto**: su clase sale solo de su prop, y el resto llega por CSS. Así una región que la aplicación ponga entre el formulario y el campo manda, como «la más cercana». `formContext.js:143` se conserva para `useFormField()` (D7) y deja de alimentar la clase.
- `GFormSection` (`GFormSection.css:54-55`), `GFormReveal` y `GFormFold` hoy leen `.g-form--density-*` o reprovén `'default'` (`GFormFold.vue:58`, `GFormReveal.vue:29`). Pasan a leer `var(--g-density)` heredado y dejan de reproveer un valor resuelto.
- **`GFormRow` y los mínimos publicados:** se miden por posiciones (#312), así que siguen la densidad real. Un cambio de región en tiempo de ejecución vuelve a medir por `densityEpoch` (D5) además del `ResizeObserver`. Una fila con un campo explícito `default` junto a otros de la región publica el mínimo de cada uno tal como mide. No hay regla nueva.
- `GDialog` sigue cortando `formKey`/`layoutKey` (#566). Como la densidad ya no viaja por ahí, el corte no la toca (§5).

## 8. Qué cambia en cada componente (punto 7)

| Grupo | Componentes | CSS (coco) | `.vue` / `meta.json` (bruno) |
| --- | --- | --- | --- |
| **G1 · Raíces con `'default'` fijo** (18) | `GBtn`, `GCard`, `GCheckbox`*, `GDialog`, `GForm`, `GMenu`, `GSidebar`, `GSpeechTrigger`, `GSplit`, `GStack`, `GStepper`, `GSurface`, `GTable`, `GTabs`, `GWidget`, `GWidgetConfig`, `GWidgetGallery`, `GWidgetGrid` | El alias local de la raíz (`--_density`, `--_d`, `--_df`…) pasa de `1` a `var(--g-density)`. Con B, se quitan las reglas `--density-*` | `default: undefined`; `meta.json` `default: null` + `resolvedDefault` + nota; sin prop no hay clase; con B, `data-g-density` en la raíz. *`GCheckbox`: solo el `meta.json` (el `.vue` ya es `undefined`; inventario §2.3) |
| **G2 · Campos y diseños que heredan del formulario** (20) | `GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GCheckboxGroup`, `GRadioGroup`, `GSwitch`, `GSlider`, `GNumberField`, `GTimeField`, `GCombobox`, `GFileField`, `GPartyField`, `GFormLayout`, `GFormRow`, `GFieldGroup`, `GInputGroup`, `GFormActions`, `GAdaptiveLayout`, `GCheckbox` (grupo) | Igual que G1 | La clase sale solo de la prop (D9); los contenedores de formulario con prop escriben `data-g-density`; lo que componen recibe `prop ?? undefined` (D6); se añade `densityEpoch` a los `watch` de medida (D5) |
| **G3 · Heredan sin prop** | `GFormSection`, `GFormReveal`, `GFormFold` | Leen `var(--g-density)` en vez de `.g-form--density-*` | Dejan de reproveer `'default'` |
| **G4 · Escala propia** | `GCalendar` | — (pieza 4, #967) | Pieza 4. Hasta entonces no lee la región. Lo anoto en su README como límite |
| **G5 · Sin densidad hoy** | `GPagination`, `GTag`/`GTagGroup`, `GBadge`, `GAccordion`, `GFilterBar`, `GBreadcrumbs` y el resto de los 41 | — | **Pieza 4.** Hasta entonces no siguen la región: en una barra compacta, una `GPagination` o un `GTag` quedan en el paso 1. Límite visible y aceptado por el orden de #969 |
| **G6 · Superficies de página** | `GToaster`, `GStatusIsland`, `GSpeechHost` | — | Δ0 (R3) |
| **Blocks** | `@grana/blocks` (`GResourceList`) | Heredan por CSS; su hoja declara las cuatro capas (#806) | Pasan a sus partes `prop ?? undefined` (D6) |
| **Tema** | `defaults.css` | `:root { --g-density: 1 }` y las tres reglas de atributo, en `grana.defaults` | `@grana/cli`: clave `density` (`compact`/`comfortable`/`default`, validada) emitida con `:root:where(:not([data-g-density]))` |

## 9. Qué lo hace distinto

**P1 · La densidad es una preferencia de quien usa la aplicación, no solo del desarrollador.** El `SizeProvider` de FF lo pone el código. En Grana, `data-g-density` en `<html>` funciona como `data-theme`: la aplicación ofrece «Vista compacta / normal / amplia» en sus ajustes, la guarda y el servidor la pinta en el primer cuadro sin parpadeo. Gana al valor del producto (CLI) y llega a todo, también a los avisos que viven en `body` y a los paneles de la capa superior. **Por qué sirve:** quien pasa ocho horas en una tabla elige ver más filas, y quien usa la aplicación con poca vista o con el ratón tembloroso elige aire, sin que el equipo tenga que diseñar dos pantallas. Medido: 6.

**P2 · «Cede al dedo»: con puntero grueso, una región compacta se comporta como `default` en sus separaciones.** Con `pointer: coarse` las cajas ya suben a 44 px, pero la separación sigue en × 0,75 y el texto (pieza 3) bajaría un escalón: se juntan dianas de 44 px con huecos menores (WCAG 2.5.8) y la fila queda desigual. Medido en el prototipo: en táctil, el botón compacto **se ve** de 27 px (su 44 es un `::after` invisible) junto a un campo de 44 px en la misma barra. Propuesta: `@media (pointer: coarse) { [data-g-density="compact"], [data-g-density="comfortable"] { --g-density: 1 } }`, también sobre el valor del CLI. La prop explícita de una instancia no cede, porque es la decisión concreta de alguien. **Por qué sirve:** la misma pantalla compacta de escritorio se vuelve usable en una tableta sin código por dispositivo. Cambia lo que el usuario ve en táctil: **pregunta 3**.

**Lo que consideré y descarto (no aporta):**
- **Regiones con nombre en el tema** (`data-g-density="toolbar"` definido en `grana.config.json`): añade un cuarto vocabulario a los tres pasos de #967 y esconde el valor real. Una clase de la aplicación con `data-g-density` ya lo da.
- **Animar el cambio de densidad:** reflujo de toda la página, mareo y tareas largas (lección de #964). El cambio es instantáneo (medido: mismo cuadro, sin transición de alto ni relleno, 4.1 y 4.2). Rúbrica de movimiento: no aplica, no hay movimiento nuevo.
- **Densidad que cambia con el foco o el hover** (una fila compacta que «respira» al recibir el foco): desplaza lo de alrededor bajo el puntero (WCAG 3.2.1, estabilidad) y rompe «nada se mueve» (#358).

## 10. Reservado

- **R1 · `setDensity(el, value)` con ancla de lectura:** un ayudante que, al cambiar la densidad, mantiene en su sitio la fila o el campo enfocado. WebKit no tiene `overflow-anchor` y el observador llega tarde para medir el «antes». Solo si se pide.
- **R2 · `GDensity`** (componente de región): no hace falta, porque el atributo lo da en cualquier elemento y en la raíz de cualquier componente.
- **R3 · Densidad de avisos, isla y voz:** si llega, lee la de la página (§5).
- **R4 · Meta de `GCard` por CSS** con consultas de estilo (D5).

## 11. Hallazgos para lima

- **L1 ·** `form.md` declara `g-form--density-{density}` «Siempre» (y lo mismo hacen `dialog.md`, `menu.md` y las tablas de clases de G1). Pasa a «con prop explícita». Además, `data-g-density` en la raíz (D9, y en G1 con B).
- **L2 ·** `api.md`, fila `density`: «por defecto: hereda (región › tema › `default`)»; la regla común de regiones, con la misma forma que «Zona de marca» (atributo público, herencia en la capa superior, lo que se teletransporta lo declara su contrato) y la regla «se cambia con el atributo, no con el token».
- **L3 ·** `useFormField()`: decidir si devuelve un `densityExplicit` (D7).
- **L4 ·** `stack.md`/`split.md`: con B, «la aplican solo a su separación» pasa a «a su separación y a lo de dentro». Con A, sin cambio.
- **L5 ·** `tokens.md`: el token `--g-density` (grupo de estructura, §6), sus tres valores, la forma de emisión del CLI y la excepción de #561.
- **L6 ·** Lo medido en táctil (P2): en la región compacta el **botón visible** queda en 27 px junto a un campo de 44 px. Pasa hoy igual con la prop explícita. Si P2 no se adopta, conviene anotarlo como límite en `btn.md`.

## 12. Preguntas para el usuario

1. **¿La prop `density` de un componente vale también para lo que lleva dentro?** A: solo para él (la región es otra cosa, `data-g-density`). B (recomendada): la prop es la región de ese componente; una tabla, un diálogo o una tarjeta compactos aprietan también sus botones y menús.
2. **Un diálogo escrito dentro de una región compacta, ¿es compacto?** Recomendación: **sí**, hereda de donde está escrito (una sola regla, como la zona de marca y los menús), con `density` en el diálogo para salir. La alternativa es que el modal vuelva siempre a la densidad de la página.
3. **¿Con pantalla táctil, una región compacta vuelve a `default` en sus separaciones (P2, «cede al dedo»)?** Recomendación: **sí** para las regiones y el valor global, y no para la prop explícita de una instancia.

---

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos**
- Los siete puntos del encargo están resueltos. Las decisiones que derivan de un estándar se toman aquí (herencia del DOM, regla de la zona, #561, 44/16 px), y las tres de producto van como preguntas.
- Solapes revisados antes de proponer (zona de marca, `data-theme`, contexto de formulario, FF). No nace ningún componente ni ninguna clave de contexto nueva.
- Prototipo con los **componentes reales de `dist/`** y el tema por defecto: `verificar.mjs` **36/36 en Chromium**. Comprueba alturas en la página, en `compact`, en `comfortable` y anidadas; la prop explícita que gana; la celda de `GTable`; el menú en la capa superior que hereda y alinea su fila con el disparador; el diálogo modal que hereda; el cambio en tiempo de ejecución sin animación; A frente a B; CLI frente a `<html>`; táctil (44 y 16 px, sin desplazamiento a 390 px) y marcado sin JavaScript.
- Auditoría previa (`auditoria-visual.md`): la página de prueba usa solo tokens y componentes existentes, las regiones están delimitadas con borde y etiqueta, y no hay decoración.

**Correcciones**
- Al encargo: el 44 px de `GBtn` en táctil es su área `::after` y no la caja visible. Se midió así y salió el hallazgo L6/P2.
- Al inventario: los componentes que componen a otros pasan hoy un valor **ya resuelto** (D6). Si no se corrige, taparían la región aunque se quite el `'default'` de las props.

**Pendientes (no verificado)**
- El shim emula «sin prop» con un marcador (`data-proto-explicit`) y va en la capa `grana.blocks` para ganar al `dist/`. No es el CSS definitivo: no midió el redondeo de 0,5 px de cada hoja ni las 37 hojas.
- Solo Chromium (por encargo). No se probaron Firefox, WebKit, un lector de pantalla ni un SSR real (se aproximó con JavaScript apagado sobre marcado estático).
- `utils/density.js` no existe todavía: el peso (≤ 512 B) es una inferencia. El observador y `densityEpoch` no están probados.
- La pieza 3 (texto) y la pieza 4 (G4, G5) quedan fuera. En una región compacta, `GPagination`, `GTag`, `GBadge` y compañía quedan en el paso 1 hasta la pieza 4.
- El soporte de consultas de estilo en Firefox (R4) no está comprobado.
