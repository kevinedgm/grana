# Auditoría · GStack (paso 5, coco)

**Componente:** `GStack` (`GStack.vue` de bruno, 6cb6e76; principal) sobre `GStack.css` (coco, ebd961d) y `stack.md` (lima, 86297b9; #717, #719, #723) · **Fecha:** 2026-10-21 · **Resultado:** un defecto corregido en `GStack.css` (`divided` con hijos con superficie), sin defecto bloqueante → **`candidate`**

**Verificación propia:** `GRANA_PW_PORT=4215 node design/lab/stack/auditoria-verificar.mjs` (requiere `npm run build`), sobre `design/lab/stack/auditoria-banco.html` con `GStack`, `GSurface`, `GCard`, `GBadge`, `GBtn` y `GTooltip` **reales** de `dist/`.

| Motor | Comprobaciones |
| --- | --- |
| Chromium | 122/122 |
| Firefox | 120/120 |
| WebKit | 120/120 |
| **Total** | **362/362** |

Además, los specs de bruno sobre el estado final (`GRANA_PW_PORT=4217 npx playwright test tests/app-shell.spec.mjs tests/app-shell-perf.spec.mjs tests/container.spec.mjs tests/stack-section.spec.mjs`, tres motores): **196 pasan, 2 omitidos por diseño** (`forced-colors` solo en Chromium); aquí cuentan `stack-section.spec.mjs`.

**Temas:** por defecto, `spotify` de `generated/`, `grana` derivado por `@grana/cli`, y el de prueba (`space` 5, borde de 2 px), todos en claro y oscuro; RTL.

## Auditoría previa

La pila no tiene superficie, estados ni movimiento: lo que se audita es el **ritmo** (una sola fuente de aire con la escala del tema), la **línea** de `divided` y que no rompa el reflujo. Riesgo anotado a lima en la entrega de estilo: `divided` sobre hijos con superficie propia («mide qué pasa»).

## Auditoría posterior

| Aspecto | Estado | Evidencia (componente real, tres motores, 8 temas) |
| --- | --- | --- |
| Ritmo por tema | Cumple | `gap` sm · md · lg · none = `space × 3 · 6 · 12 · 0` (12 · 24 · 48 · 0 con `space` 4; 15 · 30 · 60 · 0 con `space` 5); `density` comfortable y compact = × 0,875 y × 0,75 |
| Una sola fuente de aire | Cumple | Márgenes de bloque de `p` y `h3` hijos en 0 |
| `divided` (hijos simples) | Cumple | Línea del grosor del tema (1 o 2 px) en cada visible salvo el primero; el `hidden` no cuenta; entre contenidos `2 × gap + línea` |
| `divided` con hijos con superficie | **Corregido** | **Antes:** la regla escribía la línea y el aire en el borde y el relleno superiores del hijo; una `GSurface` quedaba con el borde de arriba en `border` (0,08 de alfa) frente a `border-strong` (0,16) en sus otros lados y con 24 px de relleno arriba frente a 16 abajo; una `GCard`, con el borde de arriba de otro color. **Ahora:** los hijos `.g-surface` (también `GCard`) conservan su caja (relleno y borde iguales a los de la misma superficie sin `divided`) y los separa el `gap` |
| Hijo con borde propio de la aplicación | Cumple (límite) | Una regla sin capa de la aplicación (borde de 3 px y relleno de 6 px arriba) gana a la línea: #516 |
| Horizontal | Cumple | En 320 px se parte en varias filas sin desbordar, con la misma separación entre filas (`row-gap` 12 px); empieza al inicio lógico; `horizontal="end"` al final lógico; en vertical `horizontal="start"` no estira; LTR y RTL |
| `GTooltip` hijo | Cumple | Con la pista abierta, la separación entre hermanos no cambia (#383) |
| Contraste | Cumple (decorativa) | La línea de `divided` mide 1,17–1,30:1 contra la página: es decorativa (la separación también la da el aire), como el borde de la banda del chasis; el contrato no exige 3:1 |
| `forced-colors` (Chromium) | Cumple | La línea es un borde `solid` visible |
| Estados, carga, vacío, error | N/A | No interactivo |
| Movimiento | N/A | Ninguno (rúbrica: no aplica) |
| Consola | Cumple | Limpia |

## Correcciones de esta auditoría

- **`GStack.css`:** `.g-stack--divided > … ~ :where(:not(.g-tooltip, [hidden], .g-surface))`. Un hijo con superficie propia no recibe la línea ni el aire de `divided`; queda delimitado por su borde y separado por el `gap`. `estilo.md` actualizado. El banco de estilo (`estilo-verificar.mjs`) sigue pasando (988/988).

## Para lima

1. **Registrar la regla de `divided` con superficies** en `stack.md` «Reglas de los hijos»: «`divided` no dibuja sobre un hijo con superficie propia (`.g-surface`, incluye `GCard`): lo separa el `gap`. Para una lista de tarjetas con línea, la línea va entre hijos sin superficie». Alternativa sin elemento extra no hay (un pseudoelemento cae dentro del mismo hijo; un `box-shadow` desaparece en `forced-colors`). Si prefieres que la línea se pinte también sobre superficies, hace falta otra forma de pintarla (un hijo envoltorio): dímelo y lo revierto.
2. Un hijo que la aplicación oculta con una clase propia (`display: none`) sigue contando para `divided` (límite ya escrito, regla 3).
3. Ningún token nuevo.

## Para bruno

Nada. El `.vue` pone exactamente las clases del contrato; la compuerta de peso conjunta con `GSection` es suya (en 6cb6e76).

## Para mora-docs (`GStack/README.md`)

La frontera con `GAdaptiveLayout` y `GFormLayout`; `divided` no pinta sobre tarjetas (usa `gap`); un estilo de la aplicación sin capa sobre los hijos gana (#516).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** Ritmo por `space` del tema, una sola fuente de aire, `divided` con hidden, horizontal que se parte, alineaciones lógicas en RTL, `GTooltip` hijo, `forced-colors`, consola limpia, en los tres motores y 8 temas.

**Correcciones.** `divided` ya no deforma a los hijos con superficie (`GStack.css`).

**Pendientes.** Que lima registre la regla; `forced-colors` en Firefox y WebKit no verificable aquí.
