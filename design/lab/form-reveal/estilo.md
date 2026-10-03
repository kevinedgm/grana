# GFormReveal · estilo (coco)

**CSS:** `packages/vue/src/components/GFormReveal/GFormReveal.css`. **Contrato:** `design/contracts/form.md` §14 (#274 a #280). **Estructura:** `design/lab/form-reveal/r01/` (kiwi).
**Banco:** `estilo-banco.html` (componentes reales de `dist/` + marcado del contrato hecho a mano). **Verificación:** `node design/lab/form-reveal/estilo-verificar.mjs` → **379/379** en Chromium, Firefox y WebKit, consola limpia.

## Carácter

No es una tarjeta ni una sección: dice «esto depende de la respuesta de arriba» con lo mínimo. Una **barra** al inicio y una **sangría**; el resto es la pila de siempre (las filas de dentro se ven como las de fuera). Sin fondo, sin sombra, sin título.

## Decisiones

| Qué | Valor | Por qué |
| --- | --- | --- |
| Barra | `border-inline-start`, `calc(var(--g-border-width) * 2)` (2px), `--g-color-border-control` | El borde de control es el único gris de borde del tema que llega a 3:1 (3,43 a 3,48 en claro, 4,28 a 4,35 en oscuro, en el tema por defecto y los once generados). `border-strong` (≈ 1,4:1) se pierde junto al marco de los campos. 1px se confundía con un separador; `space-1` (4px) pesaba más que el marco de los campos. 2px = el grosor de la barra activa de `GSidebar` (`--_line`) y de la marca de `GTabs` en `comfortable`. Es un **borde**: sobrevive a `forced-colors` |
| Sangría | `calc(var(--g-space-4) * var(--_density))` (16 / 14 / 12px) | La misma separación que `--g-form-column-gap`; sigue a la densidad como el resto del aire |
| Alineación | La barra empieza en el borde de inicio de la raíz = el de la pregunta (hermanas en la misma pila); el fin no cambia | #171: todas las filas terminan en el mismo borde; cada nivel anidado añade su barra |
| Separación del cuerpo | `calc(var(--g-form-gap) * var(--_density))`, densidades 1 / 0,875 / 0,75 | Igual que `GFormLayout` (medido: el `row-gap` del cuerpo = el de la pila de fuera en las tres) |
| Altura | `grid-template-rows: 0fr → 1fr`, `--g-duration-slow` (240ms), `--g-ease-out` | Movimiento grande; la curva de salida del submenú de `GSidebar` |
| Margen | Cerrado: `margin-block-start: calc(var(--_reveal-gap) * -1)` → 0, misma duración y curva | Sin hueco cerrado; lo de abajo baja de forma continua. **Dos clases** (`.g-form-reveal:not(.is-open)` / `.g-form-reveal.is-open`, 0,2,0) para ganar a `.g-form-layout > * { margin: 0 }` (0,1,0) sin `!important` y sin depender del orden de registro |
| Fundido | `--g-duration-fast` (120ms), `--g-ease-standard`. Abrir: con retraso `slow − fast`, termina con la altura. Cerrar: desde el principio; `visibility` pasa a `hidden` al final (`0s linear var(--_t)`) | #278 |
| Recorte | Cuerpo `overflow: hidden` + `min-block-size: 0`; asentado y abierto (`.is-open:not(.is-animating)`), `overflow: visible` | No recorta anillos de foco ni sombras |
| Sin `is-ready` | Sin transiciones | No se anima al montar (plan 012) |
| Movimiento reducido | Sin transición de altura ni de margen; fundido `--g-duration-fast` al abrir y al cerrar; al cerrar, visible hasta que acaba (`visibility 0s linear var(--_t-fade)`) | Plan 007: menos, no cero |
| `forced-colors` | `border-inline-start-color: CanvasText` | El borde ya lo fuerza el navegador; se fija a `CanvasText` (y no a `GrayText`) porque es una señal, no un control inactivo |
| `fieldset` | Reinicio del agente de usuario (`margin`, `padding`, `border`, `min-inline-size: 0`) | `min-inline-size: min-content` desbordaba a 320px |
| `--_reveal-gap` | `0px` neutro en la raíz | #187; la variable en línea de bruno gana |

## `:disabled` heredado durante el cierre (cambio en otros componentes)

`is-open`, `inert` y `disabled` cambian **en el acto** (#278): en el primer cuadro del cierre el `<fieldset disabled>` del cuerpo deshabilita a todos los controles de dentro y el bloque sigue a opacidad 1 durante el fundido. **Medido** (antes del arreglo, Chromium, Firefox y WebKit): saltaban a gris la etiqueta de `GCheckboxGroup` (26 → 110), la de `GFieldGroup` y el `GBtn` (fondo `neutral-soft`, texto `text-subtle`, con su propia transición de color); la captura del bloque cambiaba hasta 209/255 en un canal. Los demás cambios calculados (radios nativos del segmentado, `<input>` oculto de `GSelect`) no se ven.

**Arreglo:** las reglas `:disabled` que cambian el aspecto llevan `:where(:not(.g-form-reveal:not(.is-open) *))` (especificidad intacta) y, al lado, `[disabled]` propio para que un control deshabilitado por su cuenta siga pareciéndolo dentro de un bloque:

- `GBtn.css`: `.g-btn:disabled`, `ghost`/`link` y la regla de `forced-colors`.
- `GCheckboxGroup.css`: etiqueta y contador.
- `GFieldGroup.css`: etiqueta.
- `GHelper.css`: el disparador (`opacity: 0.5`; puede ir en la etiqueta de un campo dentro de un bloque).

Fuera de un bloque cerrado no cambia nada (un `<fieldset disabled>` del consumidor sigue pintando). Bajo un bloque cerrado y asentado nada se ve (`visibility: hidden` e `inert`). **Medido después:** captura idéntica en el primer cuadro del cierre (≤ 8/255 por canal; las diferencias de 3/255 son el suavizado del texto al componer la raíz en su capa).

No se tocaron `GInput__toggle`, `GDatePicker__chip`, `GPagination`, `GCalendar` ni `GCard__select`: solo cambian `cursor` o no van dentro de un formulario.

## `--g-duration-slow` (#280)

`defaults.css`: `--g-duration-slow: calc(var(--g-duration-press) * 1.5)` (240ms), en el grupo de movimiento, una sola vez (no es de color). `GSidebar.css` y `GStepper.css` pierden su alias `--_t-slow` y leen el token. **Sin cambio visible** (medido: submenú de `GSidebar` y conector de `GStepper` a 0,24s; `library.spec` y `playground.spec` en Chromium, 51/51).

## Qué mide `estilo-verificar.mjs`

Análisis estático (sin literales ni respaldos, sin `@layer`, sin `!important`, sin `display: none`, propiedades lógicas, tokens existentes, ni `accent`/`brand`/`primary`/`active`; `--_t-slow` retirado; las cuatro hojas con el `:where`); sin transición al cargar; cerrado sin hueco en `GFormLayout` real (las tres densidades, RTL, 320) y en el cuerpo de `GFormSection`, con el margen = −`row-gap`; disparador Δ0 y Δscroll 0 en cada cuadro al abrir y al cerrar (LTR y RTL); a la mitad, altura intermedia, recortado y sin `inert`; a 3/4 de abrir y a 1/4 de cerrar, opacidad intermedia; cerrando, visible e `inert`/`disabled`; interrupción desde la altura actual; asentado con `overflow: visible`; barra alineada con el inicio de la pregunta (±1px) y fin igual al de las filas, en las tres densidades, anidado, RTL y 320; sangría por densidad; 320 con dos niveles sin desborde; captura del cierre sin salto a gris; barra ≥ 3:1 en 24 combinaciones de tema; movimiento reducido; `forced-colors` (Chromium; también RTL); 240ms en `GSidebar` y `GStepper`; consola limpia.

## No verificado

`forced-colors` real y en Firefox/WebKit (sin emulación); Safari, iOS y táctil reales; el registro inactivo de `GForm` (es de bruno). El componente real, el bloque grande cerrado con la página al final y muchos bloques a la vez están medidos en la auditoría (`auditoria.md`, `auditoria-verificar.mjs`, 1857/1857).

**Banco endurecido (auditoría, hallazgo 5):** la «interrupción» reanuda, cambia la respuesta y pausa en una sola tarea, y `__at` pausa la transición viva más reciente (Firefox listaba a veces la vieja).

## Para bruno

- Marcado exacto del contrato: raíz `div.g-form-reveal.g-form-reveal--density-{d}` con `is-open`, `is-animating`, `is-ready` e `inert`; cuerpo `fieldset.g-form-reveal__body[role=none]` como **primer y único hijo** de la raíz (el CSS usa `> .g-form-reveal__body`). Sin `is-ready` no hay transiciones.
- `--_reveal-gap` en línea en **px** (número + `px`; `0px` si el `row-gap` del padre no es un número: el cuerpo de `GFormSection` sin `GFormLayout` da `normal`).
- `transitionend` de `grid-template-rows` en la raíz; en movimiento reducido solo hay `opacity` y `visibility`: el respaldo es el temporizador (mayor `duration + delay` + 50ms). El nombre de la propiedad del margen que da `getAnimations()` es `margin-top` en Chromium.
- Registro en `components.css`: después de `GFormLayout.css`/`GFormRow.css` (no depende del orden, pero queda junto al sistema de formularios). Compuerta sugerida: `grep -q "g-form-reveal__body" packages/vue/dist/grana.css`.
- `packages/cli/src/defaults.js`: regenerar con `scripts/sync-defaults.mjs` (`--g-duration-slow`); hoy `derive.test.js` del CLI falla por eso (1/141).
