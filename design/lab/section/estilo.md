# GSection · estilo (coco)

**CSS:** `packages/vue/src/components/GSection/GSection.css` · **Contrato:** `design/contracts/section.md` (#720, #717, #723) · **Banco:** `design/lab/section/estilo-banco.html` · **Verificación propia:** `node design/lab/section/estilo-verificar.mjs` (Playwright de `design/lab/theme-playground`; 1963/1963 en Chromium, Firefox y WebKit).

## Qué le da personalidad aunque no tenga forma

**El encabezado sabe dónde está.** Sin superficie, la jerarquía la hace solo la tipografía y el aire: el título baja un rol por profundidad (title-sm 20/28 › body 16/24 › body-sm 14/20, siempre 600 y con suelo en 14 px), y como el nivel (`h2 › h3 › h4`) y el tamaño salen de la misma anidación, **lo que oye el lector y lo que ve el ojo no se desalinean**. El aire también es jerarquía: título → descripción `space × 1`, cabecera → cuerpo `space × 4` y entre hijos del cuerpo `space × 6` (la pila `md`), de modo que el cuerpo se separa más entre sí que de su título y la cabecera se lee como una unidad. Las acciones bajan solas bajo el título sin punto de corte de pantalla (base de `space × 60` en las `titles` con `flex-wrap`), así que funcionan igual en un contenedor de 260 px que en un teléfono.

## Decisiones de estilo

- El tamaño depende de la **clase de profundidad** (`g-section--depth-1|2|3`), no de cadenas de descendientes ni del nivel del `hN` (#196: `headingLevel` fijado cambia la etiqueta y no el tamaño; medido).
- Título en `--g-font-title` solo en la primera profundidad (como pide §23.1); en 2 y 3 usa `--g-font-ui`, el rol de `GCard` y `GFormSection`. En el tema por defecto son la misma familia; con un `font-title` serif la primera sección sería serif y las anidadas no (ver encargo a lima).
- Descripción body-sm 14/20 en `--g-color-text-muted`, `max-inline-size: 66ch` (unidad de medida de lectura, #717).
- Cuerpo: la regla de pila `md` de `GStack` **escrita en `GSection.css`** (no dependen una de otra al importarlas por separado): `gap: space × 6` y márgenes de bloque de los hijos a 0 con `:where(:not(.g-tooltip))` (#383, #516).
- `scroll-margin-block-start: var(--g-space-4)` en la raíz (aire bajo lo pegado, #515); sin fondo ni borde: la sección no tiene superficie (medido).
- `dir="auto"` del título lo pone el `.vue`; el CSS no usa `text-align` físico.
- Sin movimiento (rúbrica de movimiento: no aplica). Sin estados: no interactivo, no hay foco ni área táctil propios (las acciones son `GBtn`).

## Mediciones (tema por defecto, `space` 4)

| Qué | Resultado |
| --- | --- |
| Título por profundidad | 1: 20/28 · 2: 16/24 · 3 y 4.ª anidada: 14/20, peso 600; con escala propia del «Tema de prueba» sigue la escala |
| Niveles automáticos | `h2 › h3 › h4 › h4`; `headingLevel` fijado a 3 → `h3` con tamaño de profundidad 1 |
| Título → descripción · cabecera → cuerpo · entre hijos del cuerpo | 4 · 16 · 24 px (con `space` 5: 5 · 20 · 30) |
| Márgenes de hijos del cuerpo y del título | 0 |
| Contraste mínimo sobre página, superficie y hundida, 5 temas (defecto, «Tema de prueba», notion, caracol-purpura, spotify) × claro/oscuro | título 13,36:1 · descripción 5,94:1 (mínimos ≥ 4,5) |
| Acciones | misma fila en ancho normal; bajan bajo el título a 320 px (LTR, RTL, tema de prueba oscuro) y en un contenedor de 260 px, sin desbordar; título largo sin cortes no se recorta |
| Sin descripción ni acciones | no se pinta ni el `p` ni el grupo |
| `landmark` | `aria-labelledby` solo en la que lo pide (comprobado por atributo; el árbol de accesibilidad de Playwright no se pudo leer en este entorno) |
| `forced-colors` (Chromium) | título y descripción con colores del sistema distintos del fondo; no hay superficie que desaparezca |
| Escala y `space` del tema | cambiar `--g-space-1` y `--g-text-title-sm-*` mueve el aire y el título (20 px y 28 px medidos) |
| Peso | `GSection.css` ≈ 417 B gzip minificado; con `GStack.css` 664 B juntos. El CSS va a `grana.css`, no a `grana.js` (la compuerta de ≤ 1 KiB del contrato mide `grana.js`: de bruno) |
| Consola | limpia en los tres motores |

## Encargos

**bruno:** `GSection.vue` con exactamente las clases del contrato; el banco incluye la fábrica `section()` que reproduce lo que debe emitir (profundidad con tope 3 en la clase, nivel automático con tope 4, `aria-labelledby` solo con `landmark`, `dir="auto"` en el `hN`, grupo de acciones con `role="group"` y nombre). El `.vue` **no** pone clases de pila al cuerpo: `GSection.css` ya lleva su regla. Si prefiere ahorrar bytes, puede poner `g-stack g-stack--gap-md` al cuerpo y yo quito las dos reglas del CSS: dime y lo hago, pero crea una dependencia de orden entre los dos archivos.

**lima:**
1. Confirmar la familia de los títulos de profundidad 2 y 3 (`--g-font-ui`, como `GCard` y `GFormSection`) frente a `--g-font-title` en todas (prototipo de kiwi): el contrato solo fija `--g-font-title` en la primera. Cambiarlo es una línea en el CSS.
2. `§23.1` menciona `--g-font-title` en la fila de `GSection`; añadir «las anidadas, `--g-font-ui`» o decidir lo contrario.
3. La base de `space × 60` del bloque de títulos es el punto en que las acciones bajan (constante de coco, no es token); si quieres que figure en `tokens.md` §49, dímelo.
4. Ningún token nuevo hace falta.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** sin literales de tema ni respaldos; solo `var(--g-*)` y alias; 20 › 16 › 14 y `h2 › h3 › h4` medidos; contraste ≥ 4,5:1 en 5 temas claro y oscuro; 320 px, RTL, `forced-colors` (Chromium) y escala y `space` del tema medidos; sin superficie ni movimiento.
**Correcciones:** ninguna sobre el contrato; respecto al prototipo de kiwi, el cuerpo usa `space × 6` (corrección de lima), el título lleva `color: var(--g-color-text)` explícito y `letter-spacing` del rol (en el prototipo faltaban) y se quita la dependencia de cadenas de descendientes por clases de profundidad.
**Pendientes:** familia de los títulos anidados (lima, arriba); el árbol de accesibilidad real con lector de pantalla no se probó (solo `aria-labelledby` y etiquetas); `forced-colors` solo emulado en Chromium; `#id` con aire bajo lo pegado dentro de `GAppShell` es del spec de bruno y de la otra sesión de coco; la compuerta de peso de `grana.js` la mide bruno con el `.vue`.
