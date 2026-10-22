# GText · auditoría de coco (paso 5)

**Componente real:** `GText.vue` (a4d7190) + `GText.css` (e65f9ca) + `.g-text` transparente en `prose` (`GContainer.css`) · **Contrato:** `design/contracts/text.md` (#851 a #856) · **Verificación propia:** `GRANA_PW_PORT=4219 node design/lab/text/auditoria-verificar.mjs` sobre `design/lab/text/auditoria-banco.html` (plantillas compiladas contra `packages/vue/dist/grana.js` reconstruido): **900/900** en Chromium, Firefox y WebKit. Se suma `estilo-verificar.mjs` (prototipo de kiwi con `GText.css`, 3767/3767) y, sobre los seis bloques reales, `design/lab/blocks/marketing/auditoria.md` (addendum).

## Auditoría previa y posterior (`docs/documentacion/auditoria-visual.md`)

Sin forma visible: no hay caja, borde, fondo, foco ni estado. La previa se reduce a: ¿reutiliza lo existente? Sí (roles `--g-text-*`, `space`, colores de texto del tema, `GStack` para el aire de fuera). La posterior: jerarquía (tres roles del tema), alineación y espaciado (una pausa por tamaño, cero hacia fuera), contraste, consistencia con tokens, texto ≥ 12 px. Carga, vacío y error: el vacío no pinta (comportamiento medido). **Rúbrica de movimiento: no aplica** (sin movimiento, transición ni cambio de forma; `prefers-reduced-motion` sin nada que reducir).

## Qué se midió, con `GText.vue` real (por modo: tema por defecto, rústico y lujo, claro y oscuro; space 5 en el defecto claro)

| Caso | Resultado |
| --- | --- |
| Etiqueta, clases y `$attrs` (`lang`, `dir`) | `figure/blockquote/figcaption/address/p` por `as`; `g-text g-text--size-* g-text--tone-*` |
| **C1** anidada (figure › blockquote + figcaption) | raíz a 0; párrafos de la cita a `space × 3`, cita → pie a `space × 2,5` (el de la figura); cita sin sangría; nada antes del primero ni tras el último; `cite` normal; el pie `caption` pesa como texto, no como rótulo |
| **C2** componente dentro (`address` › `p`, `GStack`, `p`) | 10 y 10 px (el margen del bloque nativo se colapsa con el 0 del componente); sin cursiva |
| **C3** fraseo | `small` 12 px (no baja), `em` cursiva, `a` subrayado y con su color, `strong`/`b` con `--g-text-title-sm-weight` (600) frente a 400, `code` conserva su familia |
| **C4** en `GStack` y vacía | 12 entre vecinos; sin slot, con comentario y con blancos no dejan elemento (3 hijos) |
| **C5** lista, primer hijo oculto, RTL | oculto no cuenta; lista con el ritmo de los párrafos; sangría `space × 6` dentro de la caja; RTL a la derecha |
| **C6** contraste | `default` y `muted` ≥ 4,5:1 sobre fondo, superficie y zona de marca, en los seis modos |
| **C7** `prose` | `GText` (raíz y `as="div"`) mide 66ch como la prosa vecina; la utilidad en un `p` interno sale de `prose` y conserva su margen (X-L3, límite documentado) |
| **C8** `text-wrap` a 236 px | sin `GText` 1 palabra en la última línea; con `GText`: Chromium 2, WebKit 4, Firefox 1 (no admite `pretty`; `balance` sí). Es mejora, no garantía |
| **E1** marca del pie sin enlace | margen 0, sin cursiva, `body`, peso de texto, ≥ 4,5:1, solo el gap de la pila |
| **E2** FAQ 02 anidada | `GText` sin margen; respuestas a `space × 3` |
| **E4** componente (botón) dentro de `as="div"` | 12 y 12 a los lados del botón |
| Avisos de desarrollo | `as="h1" size="xl" tone="loud"`: un aviso por prop, sin repetirse; se pinta `p`, `body`, `default` |
| `forced-colors` (Chromium) | `default` y `muted` toman el mismo color del sistema, legible; sin borde ni contorno propio |
| Reflujo | sin desplazamiento horizontal a 1440, 390 y 320 |
| Consola | limpia con props válidas |

## Peso

`GText.css`: 4470 B en bruto; 2400 B sin comentarios ni blancos; **548 B gzip -9** (medido sobre el fichero, no dentro de `grana.css`). Por encima de la estimación de kiwi (≈ 540 B) en 8 B: sin consecuencia, el CSS no entra en la compuerta de JS de 512 B (#853). El JS (`GText.vue` dentro de `grana.js`) lo mide bruno.

## Tokens que lee `GText.css` (para `tokens.md` §56, lima)

`--g-font-ui` · `--g-text-body-size`, `-line`, `-tracking` · `--g-text-body-sm-size`, `-line`, `-tracking` · `--g-text-caption-size`, `-line`, `-tracking` · `--g-text-body-weight` (los tres tamaños, X-L4) · **`--g-text-title-sm-weight`** (peso de `strong` y `b`; **añadido a lo que decía el contrato**) · `--g-color-text`, `--g-color-text-muted` · `--g-space-1` (ritmo `× 3 · 2,5 · 2` y sangría de listas `× 6`; relación con la escala, no tema, #717). No lee `--g-text-caption-weight`, `density` ni colores de familia. Ningún token nuevo.

## Hallazgos

Ninguno de CSS ni bloqueante. Anotados:
- **TX-A1 (bruno, informativo):** `GText.vue` y su compuerta de peso ≤ 512 B de JS no se midieron aquí; son de bruno (#853).
- **TX-A2 (lima, §56):** añadir `--g-text-title-sm-weight` a la lista de tokens consumidos (decisión de coco: el énfasis es el peso del título pequeño del tema; descartado `bolder`, que con un tema 400/500/600 daría 700).
- **TX-A3 (mora-docs):** las dos recetas ya medidas (`as="div"` con bloques; utilidad en la raíz) y el límite de Firefox con `pretty` van al README.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** solo `var(--g-*)` y alias `--_tx-*`, sin respaldos ni literales de tema (las constantes `3`, `2,5`, `2`, `6` son relación con `space`); especificidad 0; ámbito cortado en componentes `g-*` salvo `.g-text` y en el tooltip; contraste ≥ 4,5:1 en claro, oscuro y zona de marca con tres temas; texto ≥ 12 px; vacío sin nodo; sin movimiento; 900/900 en tres motores sobre el componente real.

**Correcciones:** ninguna en `GText.css` en esta pasada (la de `prose` ya estaba en e65f9ca). Se añadió el banco y verificador con el componente real y se corrigió `design/lab/blocks/marketing/auditoria-verificar.mjs` (selector de `assurance` `.g-text[id]`; hueco ayuda → legal ≤ 40 px del `gap` de `GForm`, B-L5 regla 2; presencia de `GText` real por bloque).

**Pendientes / no verificado:**
- Lector de pantalla real (la `figure` nombrada por su `figcaption`, `cite`, `address`, la garantía por `aria-describedby`).
- 1.4.12 con una hoja de usuario real (por construcción: especificidad 0).
- `forced-colors` solo en Chromium (Playwright no lo emula en Firefox ni WebKit); zoom del navegador (solo reflujo a 320).
- SSR del `p` con bloques dentro (razonado por contrato, no ejecutado aquí).
- El peso real de `GText.css` dentro de `dist/grana.css`.

**Veredicto:** `GText` puede pasar a **`candidate`** (cambio de `status` en `GText.meta.json`, de bruno).
