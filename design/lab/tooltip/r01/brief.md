# Brief — tooltip (`GTooltip`, nombre de trabajo), r01: base funcional

> kiwi, 2026-10-05. Origen: encargo del usuario (pieza básica que falta) y los pendientes que lo esperan: DECISIONS #113 («sin tooltip propio en v0.1, pendiente hasta que exista un componente de tooltip»), `icons.md` §2 y §9 («un tooltip, cuando exista el componente, se pone en el control, no en el icono»), `card.md` («solo iconos en `actions`: sin tooltip propio en v0.1»), `tabs.md` y `radio-group.md` (`labelMode` `icon`).

## Para qué

Dar **nombre visible** a lo que solo tiene icono —`GBtn icon` en barras de herramientas, las acciones de una fila de `GTable` o de una `GCard`, el riel de `GSidebar`, las pestañas y segmentos en solo icono— y, en segundo lugar, una **descripción corta** a un control que ya tiene nombre («Publicar» → «Visible para todo el equipo»), con su **atajo de teclado** cuando lo hay. Lo usan personas con ratón (que pasan por encima para saber qué hace un icono), con teclado (que recorren la barra) y en táctil (donde no hay «pasar por encima»). Las personas con lector de pantalla ya oyen el nombre: el tooltip no debe dárselo dos veces ni robarlo.

## Qué es esta ronda

La **base funcional**: semántica, retrasos, grupo, Esc, puente del puntero, foco, táctil, dirección, desbordes, movimiento reducido y la API. Todo deriva de WAI-ARIA APG (patrón Tooltip), WCAG 2.2 (1.4.13, 2.1.1, 2.5.3, 4.1.2, 2.4.7, 1.4.3) y los contratos vigentes (`api.md` «Paneles anclados» #358, `utils/anchor.js`, `helper.md`, `menu.md`, `icons.md`). La forma gris es la convencional **a propósito**: la identidad se decide en `../r02/` (tres conceptos).

## Frontera (leída en los contratos y en el código)

| Pieza existente | Qué hace | Relación con el tooltip |
| --- | --- | --- |
| **`GHelper`** (`helper.md`) | Disparador que se **pulsa** y abre un **diálogo no modal** (`role="dialog"`) con contenido agnóstico (texto, enlaces, un formulario); persiste hasta cerrarlo; hoja en móvil | **Es el toggletip de Grana.** Todo lo que tenga un enlace, un botón, más de una frase o deba poder leerse sin hover ni foco va en `GHelper`. El tooltip no tiene controles ni se pulsa. No se crea `GToggletip` (declaración §2) |
| `GSidebar` riel (`g-sidebar__tip`) | Pista propia: una instancia, `aria-hidden`, 350 ms y «otra hace poco → al instante» (600 ms) | **Mismo comportamiento** que la base adopta (350/600 vienen de aquí). Al construir `GTooltip`, el riel puede usar su motor interno con el nombre en su DOM (hallazgo L17) |
| `GMenu` (`shortcut` + `keyshortcuts`) | Atajo visible `aria-hidden` y `aria-keyshortcuts` en el elemento | **Se copia el par de props** para el atajo del tooltip (L6) |
| `GTabs`, `GRadioGroup` (`labelMode="icon"`), #113 | Etiqueta oculta en el DOM = nombre; sin pista visual | **Primeros clientes internos** del motor (L17): pista visual `aria-hidden`, el nombre sigue en su DOM |
| `GBtn icon` | Exige `aria-label` **o** `aria-labelledby` (aviso en desarrollo, `GBtn.vue`) | **Se compone**: el tooltip da el `aria-labelledby` (el aviso ya lo acepta). No se añade prop `tooltip` en v0.1 (L3) |
| `GIcon` con `label` (`icons.md` §2) | `role="img"`, nunca enfocable | **Sin tooltip**: no se puede enfocar, así que con teclado no se vería. «El tooltip va en el control, no en el icono» (`icons.md`) |
| Atributo `title` | Pista nativa | **No se usa** (#113, `icons.md`): no aparece con teclado ni en táctil, su tiempo no se controla y los lectores lo leen de forma desigual |
| `GSummary` (texto cedido) | Todo lo cedido sigue legible por diseño (#352) | Sin solape: el tooltip **no** es el arreglo del texto recortado (no hay foco en un texto) |
| `GToast`, isla de estado, `GStatusMark` | Avisos de lo que pasa | Sin solape: el tooltip no anuncia nada (no es región viva) |

## Entregables

- `../engine.js`: motor de la maqueta (comportamiento, sin estilo) sobre `packages/vue/src/utils/anchor.js` **importado tal cual**, y `XTooltip` (≈ `GTooltip`).
- `tt-base.css` (kit gris), `index.html` (siete casos con `GBtn`, `GIcon`, `GDialog` y `GHelper` reales de `dist/`).
- `../verificar.mjs`: la base y los conceptos con la misma batería, en Chromium, Firefox y WebKit.
- `declaracion.md`: decisiones, estados, comprobaciones y hallazgos L1… para lima.

## Ver

`node design/lab/tooltip/serve.mjs --keep` y abrir `http://127.0.0.1:4212/design/lab/tooltip/r01/` (`?dir=rtl` para RTL). Verificación: `node design/lab/tooltip/verificar.mjs` (puerto 4212; requiere `npm run build`).
