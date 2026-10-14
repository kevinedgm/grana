# Declaración · Zona de marca (GSurface) · r02

**Estado:** propuesta con **pregunta abierta al usuario** (elegir A, B o C; y el color de la zona en oscuro). La base funcional y la garantía de contraste derivan de WCAG 2.2 AA (1.4.3, 1.4.11, 2.4.7, 2.4.13 como referencia) y de los contratos vigentes (`tokens.md` §2, §10, §15, §17; `surface.md`); la forma de las superficies dentro de la zona es identidad y la decide el usuario.
**Material:** `index.html` con **componentes reales** (`packages/vue/dist`: `GBtn`, `GBadge`, `GTag`, `GMetric`, `GInput`, `GCard`) y temas generados con el CLI real (`generar-temas.mjs` → `temas.js`). Derivación propuesta en `zona.js` (usa `color.js` y `derive.js` del CLI). Medición: `verificar.mjs` → `mediciones.json`.
**Siguiente dueño:** el usuario (pregunta 1 y 2) → lima (`surface.md`, `tokens.md`, `DECISIONS.md`) → bruno (CLI) y coco (`GSurface.css`, `defaults.css`).

## 1. Base funcional (común a A, B y C)

1. **La zona es un ámbito de tokens, no un componente nuevo.** `GSurface tone="brand"` (y, para quien no use `GSurface`, un atributo equivalente que lima nombre) redeclara para **todos sus descendientes** el juego de color. Mismo mecanismo que `[data-theme]` (§15), ya probado: los componentes no cambian.
2. **Qué redeclara siempre** (lista exacta en `zona.js`, `zoneTokens`): fondo y superficies (`bg`, `surface`, `surface-sunken`, `surface-shell`, `surface-inset`, `mold`), tinta (`text`, `text-muted`, `text-subtle`, `border`, `border-strong`, `border-control`), interacción (`focus`, `link`, `selection`, `active`), acción principal (`primary*` y `brand*` → tinta invertida), `accent*`, `neutral*`, los `{success|warning|danger|info}-text`, velos de `GCard` y `GTabs`, sombras y `color-scheme`. **Regla para lima:** todo token del «grupo de color» de §15 que un componente lea dentro de la zona debe tener valor de zona; si no, se resuelve en `:root` y rompe (es el fallo del proyecto).
3. **Dentro de la zona la acción principal es la tinta invertida** (`primary` = `on-brand`, `on-primary` = la marca): la zona ya es el sólido de marca de la vista (`tokens.md` §2, «un solo sólido de `brand` por vista»). Un `GBtn color="brand"` también se invierte (`brand*` se redeclara): marca sobre marca no se puede ver (hoy 1,00:1 entre botón y zona).
4. **Neutro como velo de tinta, no gris de página** (hallazgo 22): `neutral-soft` = velo de `on-brand` sobre la marca, `on-neutral-soft` = `on-brand`. Medido: 6,61:1 (navy + lima, claro), 4,52:1 (oscuro); el botón ya no parece deshabilitado porque su texto es la tinta plena.
5. **Rellenos con su propia tinta se quedan** (`GBadge` solid/soft, categorías de `GTag`): llevan par propio garantizado por el CLI y no dependen del fondo. Solo cambia lo que se pinta **directamente** sobre la marca (`*-text`).
6. **Foco:** `focus` = el acento garantizado de la zona (§3), ≥ 4,5:1 frente a todas las superficies de la zona (≥ 3:1 exigido). Las paradas de Tab de la zona tienen indicador visible (9/9 medidas en A).
7. **Lo que sale de la zona vuelve a la página:** menús, listas y diálogos que se trasladan a la capa superior (`popover`, `<dialog>`, teletransporte) dejan de ser descendientes y toman el esquema de la página; no hay que hacer nada. **El tooltip es hermano del control** (#380): queda dentro y se invierte solo (`text`/`surface` de la zona). Lo verifica coco.
8. **Sin rol ni semántica:** la zona no añade `role` (decisión 2 de r01). Si es un encabezado, la región la pone `GPageHeader`.
9. **`forced-colors`:** la zona conserva un borde (como todo nivel no plano de r01) para no fundirse con la página cuando el fondo desaparece. No emulado en esta ronda.

### Componentes que deben funcionar dentro (y cómo se garantiza)

| Componente | Qué lee dentro de la zona | Garantía |
| --- | --- | --- |
| Texto, títulos | `text`, `text-muted`, `text-subtle` | `on-brand` (dado) y `on-brand-muted` (nuevo, ≥ 4,5:1) |
| Ruta, antetítulo, enlaces | `link`, `accent-text` | `on-brand-accent` (nuevo, hallazgo 15) |
| `GBtn` solid/soft/outline/ghost | `primary*`, `brand*`, `neutral*`, `accent*`, `focus` | Tinta invertida, velos con par garantizado (regla «soft» de §3) |
| `GMetric` | `text*`, `{sem}-text` | `{sem}-text` de zona (≥ 4,5:1) |
| `GBadge`, `GTag` | rellenos propios; neutro = velo | Par propio del CLI; velo con par garantizado |
| `GInput` (y campos) | `surface`, `border-control`, `text`, `text-subtle`, `focus` | Según el concepto (§2) |
| `GCard` en todos sus niveles | `surface`, `text*`, `border*`, velos, `focus` | Según el concepto (§2) |
| Foco de cualquier control | `focus` | `on-brand-accent` |

## 2. Tres conceptos (lo que cambia: qué hacen las superficies propias)

### A · Esquema de marca

La zona es un **esquema completo**, como el oscuro: la marca es el `bg`, y `surface`/`surface-sunken` son **pasos de tono de la propia marca** (más claro y más hundido, ±0,035–0,045 de L en OKLCH). Una `GCard outlined` dentro de la banda navy es un panel navy un paso más claro con texto blanco (9,65:1); el campo es una caja navy con contorno de tinta. Los semánticos se re-derivan enteros contra la superficie de la zona (con las reglas del oscuro, §15), así que sus `soft` también se tiñen.
- **Coste:** el CLI deriva un grupo de color entero por zona y esquema (≈ 70 tokens), como hoy hace el oscuro; se valida igual.
- **Fuerte:** todo funciona en cualquier nivel de anidación, sin excepciones por componente. Lo más coherente con «la zona es un esquema».
- **Débil:** el contenido de la banda se lee como «modo oscuro azul»: las tarjetas pierden el blanco que el usuario reconoce como «contenido».

### B · Islas de página

La zona redeclara la tinta y **toda superficie propia vuelve al esquema de la página** (`GSurface` no plana, y la caja visible de los campos): tarjetas blancas apoyadas sobre la marca, con texto de página (17,42:1). El anillo que se pinta **fuera** de la isla debe ser el de la zona (el de la página, oliva `#707B00`, da 2,49:1 sobre navy).
- **Hallazgo propio (medido):** **la caja del campo NO vuelve a la página.** `GInput` resuelve `--_bg: var(--g-color-surface)` en su raíz (`.g-input`, que está en la zona), y restablecer los tokens en `.g-input__control` llega tarde: la caja sigue navy (fila B, «inputbg #24366B»). Para que B funcione, cada componente con superficie debe declarar sus alias **en el elemento que pinta** o la isla debe ser la raíz entera (y entonces la etiqueta del campo queda oscura sobre la marca). Es una regla nueva para coco en `GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GCombobox`, `GFileField`, `GTimeField`, `GNumberField`, `GSlider`…
- **Lo mismo al revés, a favor:** `GInput` calcula `--_focus` en su raíz, así que su anillo ya sale con el foco de la zona aunque la caja sea isla. Funciona por casualidad de dónde se declara cada alias: frágil.
- **Coste:** juego de tinta pequeño + el CLI (o `defaults.css`) emite el grupo de la página también bajo el selector de «isla dentro de zona», en claro, consulta oscura y `[data-theme="dark"]`. Caso borde: un `[data-theme="light"]` dentro de un `[data-theme="dark"]` con una zona dentro (la isla debe volver al esquema más cercano, no a la raíz) no se resuelve solo con orden de selectores.
- **Fuerte:** lo más familiar (tarjeta blanca sobre banda de color).
- **Débil:** la regla «la isla es la caja que pinta» toca ~10 componentes y es fácil de romper en el siguiente.

### C · Plano de tinta

La zona redeclara la tinta y **las superficies propias se funden con la marca** (`surface` = la marca): una `GCard outlined` es una línea de tinta sobre la banda (11,57:1), `raised` conserva la sombra, el campo es contorno sobre la marca. La profundidad dentro de la zona se dice **solo con líneas y velos de tinta**; nunca hay un segundo tono.
- **Coste:** el más pequeño: tinta + velos, casi todo `color-mix` de `brand` y `on-brand` (coco), más los valores que necesitan búsqueda de contraste (CLI, §3).
- **Fuerte:** la banda se lee como un solo plano gráfico (cartel); imposible que un componente nuevo rompa la zona por tener superficie.
- **Débil:** tarjetas `outlined` y `flat` se distinguen solo por la línea; varias tarjetas en la banda se leen menos «contenidas» que en A o B.

### Mediciones (componentes reales; ratio WCAG medido en el DOM, `mediciones.json`)

Mínimos: texto 4,5:1, contorno y foco 3:1. **A, B y C: 0 pares bajo el mínimo** en 3 temas × 3 esquemas × 28 pares. «Hoy»: 5 a 14 pares bajo el mínimo por combinación.

| Tema · esquema | Zona (bg / tinta) | Hoy: título `GCard` | Hoy: ruta | Muted | Acento de zona | Foco | `GCard` título A / B / C | Campo: texto A / B / C |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Defecto · claro | `#1F1F1F` / `#FFFFFF` | 1,00 | 2,90 | 10,90 | `#4290FB` (movido) 5,19 | 5,19 | 14,35 / 17,40 / 16,48 | 14,35 / 16,48 / 16,48 |
| Defecto · oscuro | `#F2F2F2` / `#17151A` | 1,06 | 3,32 | 10,66 | `#0362CF` (movido) 5,14 | 5,14 | 17,97 / 15,22 / 16,19 | 17,97 / 16,19 / 16,19 |
| Proyecto · claro | `#24366B` / `#FFFFFF` | 1,00 | 2,49 | 8,11 | `#C1D324` (tal cual) 6,95 | 6,95 | 9,65 / 17,42 / 11,57 | 9,65 / 11,57 / 11,57 |
| Proyecto · oscuro (marca del oscuro) | `#768ECA` / `#17151A` | 1,06 | 1,94 | 5,28 | `#1D1D00` (movido: **pierde la identidad**) 5,29 | 5,29 | 6,43 / 15,23 / 5,60 | 6,43 / 5,60 / 5,60 |
| Proyecto · oscuro (marca profunda) | `#24366B` / `#FFFFFF` | — | — | 8,11 | `#C1D324` (tal cual) 6,95 | 6,95 | 9,65 / 15,23 / 11,57 | 9,65 / 11,57 / 11,57 |
| Hallazgo 15 · claro | `#0B1F4D` / `#FFFFFF` | 1,00 | 2,91 | 10,60 | `#4AA39B` (movido desde `#0F766E`, que daba 2,91) 5,32 | 5,32 | 13,75 / 17,44 / 15,94 | 13,75 / 15,94 / 15,94 |
| Hallazgo 15 · oscuro (marca del oscuro) | `#8FACE5` / `#17151A` | 1,06 | 1,65 | 6,06 | `#003D34` (movido) 5,36 | 5,36 | 8,99 / 15,23 / 7,94 | 8,99 / 7,94 / 7,94 |
| Hallazgo 15 · oscuro (marca profunda) | `#0B1F4D` / `#FFFFFF` | — | — | 10,60 | `#4AA39A` (movido) 5,31 | 5,31 | 13,75 / 15,23 / 15,94 | 13,75 / 15,94 / 15,94 |

Lectura: el texto secundario con la fórmula del proyecto (82 % de `on-brand`) da 8,11:1 en navy (el reporte decía 8,13). El anillo de foco más bajo es el de `GCard` hacia dentro en A (4,52:1, sobre el paso de tono) y en B (4,52:1, foco de página en tarjeta oscura); todos ≥ 3:1. En B, «Campo: texto» es la caja **navy**, no blanca (hallazgo de §2.B).

## 3. Acento sobre la marca (hallazgo 15): se garantiza, con un límite declarado

**Propuesta:** token nuevo derivado y validado por el CLI, **`--g-color-on-brand-accent`** (nombre para lima):
1. Si el acento da **≥ 4,5:1** frente a la marca (y frente a las superficies de la zona, en A), se usa **tal cual** (lima sobre navy, 6,95:1).
2. Si no, se mueve su **L en OKLCH alejándose de la marca, con el mismo tono** (reduce C si sale de gama) hasta 4,5:1: teal `#0F766E` → `#4AA39B` sobre `#0B1F4D` (de 2,91 a 5,32:1); el azul por defecto `#0B63CE` → `#4290FB` sobre la tinta `#1F1F1F`.
3. Si ninguna L llega, la zona usa `on-brand` y el CLI lo informa (`tokens.json`, estado `fallback`).
4. **Límite medido:** cuando la zona es **clara** (la marca del oscuro, `#768ECA`) y el acento también es claro (lima), el paso 2 lo lleva a `#1D1D00`: cumple (5,29:1) pero **ya no es lima**. Propuesta: el CLI marca ese caso como `lost` (diferencia de L > 0,35 o croma final < 0,04) y la zona usa `on-brand` en vez de un acento que ya no se reconoce; con «marca profunda» en oscuro (pregunta 2) no ocurre.
- **Dentro de la zona**, `accent-text`, `link`, `focus` y `active` leen este token; `accent` (relleno) también, con `on-accent` elegido por el CLI (`pickOn`). El `accent-text` de la página **nunca** se pinta sobre la marca (hoy 2,49:1).
- El mismo mecanismo resuelve los `{success|warning|danger|info}-text` de zona (tendencias de `GMetric`: hoy 2,11–2,16:1; con la regla, ≥ 5,03:1).

**Regla «soft» garantizada** (necesaria en los tres conceptos): un velo de `X` sobre la marca baja del 20 % al 8 % hasta que la primera tinta candidata (`X`, luego `on-brand`) dé ≥ 4,5:1. Sin ella, en la zona clara del oscuro, el velo neutro daba 4,39:1 y el de acento 3,90:1 (medido en la primera pasada).

## 4. Juego de tokens que necesita la zona (hallazgos 4 y 7)

| Valor | Hoy | Propuesta | Por qué |
| --- | --- | --- | --- |
| Fondo de la zona | `brand` | `brand` (o la «marca profunda» en oscuro, pregunta 2) | — |
| Tinta | `on-brand` | igual | Ya garantizado ≥ 4,5:1 |
| Tinta secundaria | — | **`on-brand-muted`** (nuevo): mezcla OKLab de `on-brand` con un 18 % de la marca; si baja de 4,5:1 frente a las superficies de la zona, la parte de marca baja en pasos de 0,01 | Hallazgo 7; la fórmula del proyecto como punto de partida, con garantía. `text-subtle` usa el mismo valor en la zona (dos niveles de tinta sobre marca bastan) |
| Acento | — | **`on-brand-accent`** (nuevo, §3) | Hallazgo 15 |
| Semánticos como texto | — | `{sem}-text` de zona (4 valores, misma regla que el acento) | Tendencias de `GMetric`, mensajes |
| Contorno de control | — | `on-brand-muted` (≥ 4,5:1, luego ≥ 3:1) | Sin token extra |
| Líneas | — | `on-brand` al 16 % y al 30 % (alias de coco) | Decorativas |
| Velos (`soft`, `card-*`, `tabs-*`) | — | Regla «soft» (§3) y alias de coco | Hallazgo 22 |
| Superficies propias | — | A: dos pasos de tono (CLI); B: el grupo de la página; C: la marca | Concepto |

**Mínimo del CLI** en los tres conceptos: `on-brand-muted`, `on-brand-accent` y los cuatro `{sem}` de zona, en claro y oscuro, validados. A añade el grupo entero (superficies y semánticos re-derivados).

## 5. Qué ofrece la zona a `GPageHeader` (hallazgo 9; la ronda del encabezado es de otro kiwi)

- Un ámbito: el encabezado pone `tone="brand"` (o su equivalente) en su banda y **todo lo que meta dentro funciona** sin reasignar nada: ruta (`link` = acento garantizado), `h1` (`text`), descripción (`text-muted` = `on-brand-muted`), acciones (`GBtn`: la principal en tinta invertida, `soft neutral` legible), métricas (`GMetric` con tendencias de zona), insignias y etiquetas.
- Lo que el encabezado **no** debe hacer: pintar la banda aparte ni reasignar tokens; leer `accent-text` de la página dentro de la banda; poner un `GBtn color="brand" solid` esperando que sea de marca (dentro es tinta invertida).
- Franja condensada al desplazar: si es la misma banda encogida, hereda la zona. Si es otro elemento (fijo, fuera del flujo), también lleva el ámbito.
- Lo que depende de la elección del usuario: si el encabezado lleva tarjetas o un campo de búsqueda en la banda, su aspecto (A tonal, B blanco, C línea).

## 6. Qué lo hace distinto

1. **La zona se declara una vez y lo demás se entera solo.** En los frameworks comunes, «sobre fondo oscuro» es una variante por componente (`dark`, `inverse`, `on-primary`) que el desarrollador recuerda poner en cada botón. Aquí ningún componente sabe que está en una zona: el ámbito redeclara el juego y el CLI garantiza cada par. Sirve al usuario final porque el desarrollador **no puede olvidarse** de un botón y dejarlo ilegible (el fallo del reporte). Y unifica lo que hoy hacen a su manera la isla, el tooltip y los avisos.
2. **El foco cambia de tinta al cruzar el borde.** El anillo dentro de la banda es el acento **garantizado** de la zona (lima sobre navy), no el de la página ni un blanco genérico: quien navega con teclado ve el foco con la identidad del producto y nunca lo pierde al entrar o salir de la banda (en el proyecto, el foco de página daba 2,49:1 sobre navy).
3. **El acento se corrige en luminosidad, no se sustituye.** Si el acento no llega sobre la marca, el CLI conserva su tono y solo mueve su luz (teal oscuro → teal claro): la ruta y el foco siguen siendo «el teal de la marca». Cuando eso ya no es reconocible, lo dice y usa la tinta, en vez de un color que nadie eligió.
4. **Por concepto:** A, profundidad hecha con el tono de la propia marca (un duotono, no grises encima de color); B, la isla es la caja que pinta y el anillo es del exterior (regla de frontera explícita); C, la banda como un solo plano de tinta donde las tarjetas son trazo, como un cartel.

## 7. Comparativa

| Criterio | A · Esquema de marca | B · Islas de página | C · Plano de tinta |
| --- | --- | --- | --- |
| Contraste (medido) | 0 fallos | 0 fallos | 0 fallos |
| Tarjeta `outlined` en la banda | Panel un tono más claro | Tarjeta blanca (de página) | Trazo sobre la marca |
| Campo en la banda | Caja tonal | **Hoy no funciona como isla** (caja navy): necesita mover alias en ~10 componentes | Contorno sobre la marca |
| Cambios en componentes | Ninguno | Regla nueva «alias en el elemento que pinta» en los campos | Ninguno |
| CLI | Grupo entero por zona y esquema (≈ 70 valores) | Tinta (6 valores) + grupo de la página bajo selector de isla | Tinta (6 valores) |
| Anidación profunda | Funciona a cualquier nivel | Caso borde con esquemas anidados | Funciona a cualquier nivel |
| Riesgo con componentes futuros | Bajo | Alto (cada componente con superficie debe cumplir la regla) | Bajo |
| Identidad | Duotono de marca | Familiar (blanco sobre color) | Gráfica, cartel |
| `tone="inverse"` con el mismo mecanismo | Sí | Sí | Sí |

## 8. Preguntas para el usuario

1. **¿Qué hacen las superficies propias (tarjetas, campos) dentro de la zona de marca: A (pasos de tono de la marca), B (islas blancas de la página) o C (se funden y quedan como trazo)?** Abre `index.html` y cambia tema y esquema: los tres funcionan; cambian el aspecto, el coste y el riesgo de la tabla anterior.
2. **En el tema oscuro, ¿la zona usa la marca del oscuro (`#768ECA`, banda clara con tinta oscura) o la «marca profunda» (la marca del claro, `#24366B`, banda oscura con tinta blanca)?** Con la marca del oscuro, la lima del proyecto deja de poder ser acento sobre la banda (§3.4); con la profunda, conserva 6,95:1. Con el tema por defecto, la profunda es una banda casi negra sobre una página casi negra (`#1F1F1F` sobre `#141414`, 1,12:1) que se separa solo por su borde.

## 9. Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| 1 | API de la zona | Alta | `GSurface tone="brand"` + un atributo equivalente para elementos propios (nombre de lima; **no** reutilizar `data-theme`, que significa claro/oscuro y se combina con la zona). Valorar `tone="inverse"` con el mismo mecanismo (isla #325, tooltip #387, `GToast`) |
| 2 | Tokens nuevos | Alta | `on-brand-muted`, `on-brand-accent` y `{sem}` de zona (§4); reglas de §3 en `tokens.md` §2 y §15; estados `kept`/`adjusted`/`fallback`/`lost` en `tokens.json` |
| 3 | Lista del grupo de la zona | Alta | La de `zona.js` (`zoneTokens`): todo token del grupo de color de §15 que se lea dentro. Registrar que `brand*` y `primary*` se invierten en la zona |
| 4 | Regla «soft» | Media | Velo con par garantizado (§3); aplica a `neutral-soft`, `primary-soft`, `brand-soft`, `accent-soft` de la zona |
| 5 | Personalidad | Media | Registrar en `DECISIONS.md` la elegida (§6) y la respuesta a la pregunta 2 |
| 6 | Solo si gana B | Alta | Regla de contrato para coco: cada componente con superficie declara sus alias de color **en el elemento que pinta la superficie**; lista de componentes afectados; caso de esquemas anidados |
| 7 | §2 «un sólido de `brand` por vista» | Baja | Aclarar que la zona cuenta como ese sólido y que dentro la acción principal es la tinta invertida |

**Para coco:** `GSurface.css` (redeclaraciones de la zona y alias de líneas y velos), `defaults.css` (valores de zona del tema por defecto), borde en `forced-colors`, tooltip dentro de la zona, `GTabs`/`GSlider`/`GStatusMark` dentro (no medidos).
**Para bruno:** derivación en el CLI (`on-brand-muted`, `on-brand-accent`, `{sem}` de zona; en A, el grupo entero), validación en claro y oscuro, `tokens.json`.

## 10. Comprobaciones ejecutadas

- `node design/lab/surface/r02/verificar.mjs` (Playwright Chromium, puerto 4211): 3 temas (defecto, proyecto, hallazgo 15) × 3 esquemas (claro, oscuro con la marca del oscuro, oscuro con marca profunda) × 4 montajes (hoy, A, B, C) × 28 pares medidos en el DOM de componentes reales (color de texto y de borde frente al fondo efectivo compuesto, con espera a que terminen las transiciones de color). **A/B/C: 0 pares bajo el mínimo. Hoy: 5 a 14 por combinación.**
- Teclado: 9 paradas de Tab en la zona A (ruta, botones, etiquetas, campo, tarjeta), todas con indicador pintado (contorno o `::after` del componente).
- 320px: `scrollWidth` 320, sin desplazamiento horizontal. Consola sin errores.
- Capturas: `captura-nisa-claro.png`, `captura-nisa-oscuro.png`.
- Primera pasada: la regla «soft» ingenua daba 4,39:1 y 3,90:1 en la zona clara; corregida con la regla de §3. Las tablas iniciales medían a mitad de la transición de color de `GBtn` (3,79:1 falsos); corregido esperando 900 ms.

## 11. Comprobaciones NO ejecutadas

- Firefox y WebKit; `forced-colors`; zoom 200 %; lector de pantalla (la zona no tiene rol: no aplica salvo lo que ponga `GPageHeader`).
- Estados `hover`, `active`, seleccionado y deshabilitado dentro de la zona (solo reposo y foco). La tarjeta conmutable se midió marcada.
- `GTabs`, `GSlider`, `GSelect`, `GDatePicker`, `GTooltip`, `GStatusMark`, `GAvatar` y `GProgress` dentro de la zona; menús y diálogos trasladados (se razona que vuelven a la página, §1.7).
- Temas con marca clara en el claro (p. ej. una marca amarilla): la derivación es polar y está escrita para ese caso, pero solo se midió la zona clara del oscuro.
- La derivación de `zona.js` es del banco; la definitiva la escribe bruno en el CLI.
