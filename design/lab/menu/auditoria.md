# Auditoría de coco · GMenu (paso 5)

**Componente:** `GMenu` real (`.vue` + `GMenu.css`), playground (`localhost:4173`), Chromium.
**Método:** tema propio sobre el playground (superficie crema, texto marrón, borde 2px, radios 2px, `space` 5px, Georgia, foco verde azulado de 3px, `text-subtle` y `danger-text` propios). Teclado real (Enter, flechas) para el foco; eventos sintéticos para Fin y Esc.

## Resultado: aprobado

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Cambian superficie, borde (2px), radio (2px), fuente (Georgia) y alto del elemento (45px = `space × 9`); todo sale de tokens |
| Contraste (tema propio) | Texto 13.9:1 · peligroso 7.16 · atajo y título de grupo 7.48 (los tres ≥ 4.5) |
| Foco (teclado real) | `:focus-visible` con contorno sólido de 3px en `--g-color-focus`; fondo `surface-sunken` |
| Áreas de acción | Elemento ≥ 45px de alto con el tema propio (mínimo 24px, 44px táctil) |
| Iconos | Marca de casilla (check), opción (circle relleno), submenú (chevron-right) y aviso: Lucide vía `GIcon` |
| Teclado | Enter abre y enfoca el primero; ↓ avanza saltando deshabilitados; Fin va al último; Esc cierra y devuelve el foco al disparador |

## Nota de método
Al primer intento el playground estaba en oscuro por el sistema y mis colores de texto eran del tema oscuro sobre una superficie clara (contrastes 2.5 a 3.4). No era un defecto del componente: al definir también `text-subtle` y `danger-text` del tema, los contrastes pasan.

## Sin verificar (no bloquea `candidate`)
Lector de pantalla real; `forced-colors`, `pointer: coarse` y `prefers-reduced-motion` reales (solo presencia en la hoja); Firefox y Safari (`popover`, posicionamiento); táctil real; RTL con datos reales; submenús de tercer nivel con tema propio.

---

## Addendum · Elementos-enlace (#571–#579)

**Fecha:** 2026-10-14  
**Alcance:** `a.g-menu__item` con `href`, `target`, `external` y `current`; pie de destino (`g-menu__dest`); vista multi-pestaña; marca de activo (`aria-current="page"`); icono externo (`g-menu__leave`); texto de acceso (`g-menu__sr`); huella (`g-menu__trace`); modificador (`is-modifier`).  
**Método:** `GMenu.css` revisado con grep + lectura directa de los bloques nuevos. Spec `menu-links.spec.mjs` (15 pruebas) y `personalidad-menu-links.spec.mjs` (11 pruebas) en `GRANA_PW_PORT=4228 npx playwright test --project=chromium`.

### Resultado: aprobado, sin correcciones

| Prueba | Resultado |
| --- | --- |
| Token-only | Todos los bloques nuevos: `a.g-menu__item`, `.g-menu__leave`, `.g-menu__sr`, `.g-menu__trace`, `.g-menu__dest`, `is-modifier` usan solo `var(--g-*)` y `var(--_*)`; sin literales de tema ni valores de respaldo |
| `text-decoration: none` | `a.g-menu__item:is(:visited, :hover, :active, :focus)` — sin subrayado en ningún estado; verificado en la hoja |
| `aria-current="page"` | Barra de acento: `border-inline-start: 2px solid var(--g-color-accent)` con `margin-inline-start` negativo; peso `600`; sin cambio de `background` propio (hereda del hover cuando corresponde) |
| `.g-menu__leave` (icono externo) | `1em × 1em`, `currentColor`, `opacity: 0.5` (→ `text-muted`); en `is-modifier` sube a `currentColor` (plena); sin dimensión literal |
| `.g-menu__sr` (texto accesible) | Patrón correcto: `position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%)` |
| `.g-menu__trace` (huella) | Desliza desde `var(--_mark-x)` / `var(--_mark-y)` con `--g-ease-out` y `--g-duration-fast`; opacidad 0→1; sin literales de medida ni de tema |
| `is-modifier` | Los items de acción pasan a `text-subtle`; el icono externo de los enlaces aparece en `text` (opacidad plena); CSS correcto |
| `.g-menu__dest` | `position: sticky; inset-block-end: 0`; `background: var(--g-color-surface)`; `color: var(--g-color-text-muted)`; `aria-hidden` anulado en foco (solo visual); borde superior en `border-strong`; sin literales |
| `prefers-reduced-motion` | La huella (`g-menu__trace`) está dentro de `@media (prefers-reduced-motion: no-preference)`; en movimiento reducido no se produce |
| `forced-colors` | El selector de la barra activa (`aria-current`) y el icono externo están fuera del bloque de colores forzados; la barra cambia de `accent` a `Highlight` en el bloque correspondiente |
| Specs Playwright | `menu-links.spec.mjs` 15/15 · `personalidad-menu-links.spec.mjs` 11/11 — todos pasan |

### Sin verificar

Lector de pantalla real con el pie de destino (`aria-hidden` visual vs. descripción verbal del destino); Safari con `@starting-style` en la huella; multi-pestaña con un número real de pestañas > 3.
