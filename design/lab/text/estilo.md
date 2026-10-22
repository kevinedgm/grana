# GText · estilo (coco)

**CSS:** `packages/vue/src/components/GText/GText.css` · **Contrato:** `design/contracts/text.md` (#851 a #856) · **Prototipo de kiwi:** `design/lab/text/r01/` (`tx.css` es la regla estructural; `GText.css` es su transcripción con los nombres del contrato) · **Verificación propia:** `GRANA_PW_PORT=4219 node design/lab/text/estilo-verificar.mjs` (3767/3767, prototipo de kiwi) y, sobre el componente real, `design/lab/text/auditoria-verificar.mjs` (900/900; ver `auditoria.md`).

## Qué le da personalidad aunque no tenga forma

El texto no trae aire propio: la raíz vale `margin: 0` y el aire entre piezas es siempre de quien las coloca (`GStack`, el `gap` del formulario). Dentro hay **una sola pausa por tamaño** (`space × 3 · 2,5 · 2`, medio renglón de cada rol), escrita en la regla de cada tamaño y no en una variable, de modo que una `GText` dentro de otra recibe el ritmo de la de fuera y manda en lo suyo por proximidad (`@scope`). Cambiar `space` en el tema mueve el ritmo de todo el texto (medido con `space` 5: 15 · 12,5 · 10). La línea tiene oficio sin JS: `text-wrap: pretty` y `balance` en `figcaption`.

## Decisiones de estilo

- **Transcripción fiel de `tx.css`** sin la capa propia (la capa `grana.components` la pone `components.css`) y sin las reglas de comillas (reservadas). Clase de tamaño `g-text--size-body-sm` (no `sm`) y tono `g-text--tone-default`/`--tone-muted`, ambos **siempre explícitos**: `default` y `muted` son lo que la zona de marca redeclara (§44.5).
- **Especificidad 0** en la raíz y en todo lo de dentro (`:where`, `@scope`): la aplicación sin capa y las utilidades ganan sin `!important` (#516, #806).
- **Ámbito:** se corta en cualquier clase `g-*` salvo `.g-text` y en `.g-tooltip` (#383). Los márgenes del bloque nativo junto a un componente se colapsan con el 0 del componente: `p` → `GStack` → `p` quedan a 10 y 10.
- **`strong` y `b` (decisión de coco para lima, `tokens.md` §56):** `font-weight: var(--g-text-title-sm-weight)`. Es el peso de énfasis del tema (600 en el defecto). Descartado `bolder`: con un tema 400/500/600 sube a 700, un peso que el tema no declara; descartado un número escrito. Un tema que quiera otro énfasis lo cambia en `--g-text-title-sm-weight`.
- **Sangría de listas:** `padding-inline-start: calc(space × 6)` (lógico; RTL medido). El mismo valor del prototipo: da sitio a la viñeta y a un marcador de dos cifras con `body`.
- **`cite`/`address` sin cursiva, `small` heredado** (12 px es el suelo), `em`, `i`, `a` y `code` intactos.
- **Peso `--g-text-body-weight` en los tres tamaños** (el rol `caption` del tema pesa 500: es de rótulo, no de texto).
- **`prose` (X-L2 resuelto):** `.g-text` entra en las primitivas transparentes de `GContainer.css`; una `GText` dentro de `prose` mide 703 px (66ch) igual que la prosa vecina, antes 1280 (tres motores).
- **Sin movimiento, sin foco, sin estados, sin `forced-colors` propio:** no pinta caja ni borde; el texto toma el color del sistema (medido en Chromium con `forced-colors: active`).

## Mediciones (tres motores, sobre el prototipo de kiwi cargando `GText.css` en lugar de `tx.css`)

| Qué | Resultado |
| --- | --- |
| Casos C1 a C8 de kiwi (anidada, componente dentro, fraseo, `GStack` y vacía, lista/oculto/RTL, zona de marca, `prose`, `text-wrap`) | todos en verde, claro y oscuro |
| Los mismos casos con `space` 5 (`--g-space-1: 5px`) | las pausas siguen a la escala: pasan |
| Bloques reales (Testimonials, CTA 01–03, Newsletter 01–03, Footer 01–03, Stats 03, FAQ 01 y 03) con el reparto de kiwi, tema por defecto, rústico y lujo, claro y oscuro | todo en verde; ayuda → legal 40 px (antes 54–56) |
| C8 `text-wrap` a 236 px | Chromium 2 palabras en la última línea (antes 1); WebKit pasa; Firefox no admite `pretty` y queda como estaba |
| **E1 · marca del pie sin enlace** (`p` con logo o con el nombre en lugar de `GBtn` link, Footer 01 a 03, tres temas, claro y oscuro) | margen 0 en las cuatro caras, sin cursiva, `body` del tema, peso 400, el nombre ≥ 4,5:1 sin atenuar; sin margen propio frente a su vecino (en Footer 02, fila, el vecino está al lado) |
| **E2 · FAQ 02 en la `GSection` anidada** (`as="div"` envolviendo los párrafos) | la `GText` es el único hijo del cuerpo y no tiene margen; título → respuesta = solo el `gap` de la sección (16 px, igual que antes); 12 px entre párrafos de una respuesta; consola limpia |
| **E3 · `strong`, `b`** | peso 600 (título-sm del tema) frente a 400 del texto; `em` cursiva, `a` subrayado y `code` con su familia |
| **E4 · `forced-colors`** (Chromium) | el color de `default` y `muted` lo fija el sistema; legible |
| Consola | limpia en todas las vistas |

Notas medidas que importan a otros roles:
- **FAQ 02:** las respuestas cambian de tamaño al llevar `GText`: antes heredaban la tipografía del cuerpo de la página (en rústico, 16 px, **fuera de la escala** del tema, hallazgo MK ya conocido); ahora son `body` del tema. La altura de los `li` varía unos 4 a 8 px (rol del tema y `text-wrap: pretty`), no por márgenes.
- **Newsletter:** el legal queda a 40 px de la ayuda en los tres temas (antes 54–56).

## Encargos

**lima:** la lista exacta de tokens consumidos (§56 de `tokens.md`) va en el informe de coco; el único añadido a lo que ya decía el contrato es **`--g-text-title-sm-weight`** (peso de `strong` y `b`). Ningún token nuevo del tema.

**bruno:** (1) registrar `GText.css` en `components.css` (el orden entre componentes no importa: todo va con especificidad 0); (2) el verificador de coco de los bloques (`design/lab/blocks/marketing/auditoria-verificar.mjs`) ya acepta el ritmo de `GText` como margen propio; nombres de clase del contrato `g-text--size-body-sm` (el prototipo `tx.js` de kiwi dice `sm`: no lo uses de modelo); (3) `dist/grana.css` debe reconstruirse para que `prose` incluya `.g-text` (medido sobre el CSS de `src` sirviéndolo en caliente; el `dist` actual aún no lo lleva).

**mora-docs:** la receta de utilidades en la raíz, `as="div"` con bloques y los límites de `text.md` ya están medidos; añade que `strong`/`b` pesan como el título pequeño del tema.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** solo `var(--g-*)` y alias `--_tx-*`, sin respaldos ni literales de tema (la única medida son las constantes de relación `3`, `2,5`, `2`, `6` sobre `space`, #717); clases del contrato; ritmo escrito en cada regla; anidada, ámbito cortado, primer/último sin margen contando `hidden`/`template`/tooltip; peso de texto en los tres tamaños; contraste ≥ 4,5:1 en claro, oscuro y zona de marca; texto ≥ 12 px; sin comillas; `prose` mide la `GText`; medido en tres motores, tres temas, claro y oscuro, `space` 5 y los casos E1 a E4.

**Correcciones:** `GContainer.css` (`.g-text` entre las primitivas de `prose`, X-L2) y `auditoria-verificar.mjs` de los bloques (el ritmo de `GText` cuenta como margen propio; con los bloques aún sin `GText` el resultado es idéntico al de antes y, con las clases de `GText` puestas en caliente, los hallazgos de márgenes desaparecen).

**Pendientes:**
- **No verificado:** lector de pantalla real; `forced-colors` en Firefox y WebKit (Playwright no lo emula); 1.4.12 con una hoja de usuario real (por construcción: especificidad 0); el peso real de `GText.css` en `grana.css` (no se midió; estimado ≈ 540 B gzip por kiwi); la auditoría sobre los **seis bloques reales** con `GText` puesto por bruno (aquí se midió con las clases de trabajo de kiwi sobre el DOM de los bloques actuales); el `dist/grana.css` actual todavía no incluye ni `GText.css` ni el cambio de `prose` en su forma final.
- **bruno:** construir `GText.vue`, registrar el CSS, reconstruir `dist` y cambiar los bloques; solo entonces coco cierra la auditoría de las secciones y pone `candidate`.
- **Límite aceptado (X-L3):** una utilidad (`g-mt-4`) sobre un bloque interno lo saca del ámbito de `GText` y de `prose`; receta en la raíz.
