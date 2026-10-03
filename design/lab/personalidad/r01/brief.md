# Brief · Personalidad (r01, ronda transversal)

> Brief de kiwi a partir del encargo del usuario (2026-10-03, decisión de producto): Grana no quiere ser «otro framework genérico». Los componentes cerrados se hicieron con el estándar como meta y la personalidad en segundo plano. Esta ronda propone qué haría **inconfundibles** a los seis más visibles, sin tocar accesibilidad, rendimiento ni el contrato de tokens. Verificado contra el repo (`CLAUDE.md` «Personalidad e innovación», #298, `plans/001`–`014`).

## Qué es

Una ronda **transversal**: no diseña un componente nuevo, propone movimiento, comportamiento y forma con identidad para `GBtn`, `GDialog`, `GTabs`, `GCard`, `GInput` y `GMenu`, y un **lenguaje de movimiento común** (curvas, duraciones por jerarquía y un patrón compartido de movimiento reducido). Cada idea dice qué hace, qué aporta al usuario final, coste, riesgo y cómo se mide. Al menos una por componente está prototipada **sobre el componente real** de `dist/` y medida.

## Cómo está hecho el prototipo

- `index.html` carga `dist/grana.css` y `dist/grana.umd.js` (componentes reales) y encima una capa **`@layer grana.personalidad`**, declarada después de `grana.components`. Esa capa modela lo que coco escribiría en `G<Nombre>.css`: solo `var(--g-*)`, alias locales y constantes de coreografía (fracciones, índices). **No se toca ningún archivo de coco ni de bruno.**
- Lo que el `.vue` tendría que aportar (dirección del cambio en `GTabs`, vector al disparador en `GDialog`, posición del puntero en `GCard`, elemento activo en `GMenu`, señal de envío en `GInput`) lo hace la página con unas pocas líneas, marcadas como «lo haría bruno».
- Cada demo va en dos columnas: **Hoy** (tal cual) y **Propuesta** (la misma pieza con la capa). Andamio gris de wireframe; iconos solo Lucide de la lista de la librería.
- `verificar.mjs` mide cada prototipo cuadro a cuadro (rAF), con y sin movimiento reducido, en táctil y en 375px. Abre la página por `file://`: no ocupa puertos.

## Lo que ya está decidido y no se reabre

| Fuente | Qué fija | Cómo lo respeta la ronda |
| --- | --- | --- |
| #71, #280 | Transiciones (no keyframes) con tokens; 240ms (`--g-duration-slow`) como máximo de la interfaz; el hover no se mueve | Ninguna propuesta supera 240ms; las curvas nuevas asientan antes del 75 % de ese tiempo |
| Plan 007 | Movimiento reducido: se conservan fundidos y colores, se quitan escalas y desplazamientos | Es el patrón compartido (§2.3 de la declaración) |
| Plan 012 | No animar al montar (`is-ready`) | Toda entrada nueva va tras `is-ready` o una señal del usuario |
| #127, `card.md` principios | El hover de `GCard` no mueve la tarjeta (sin `transform`) | La propuesta de `GCard` es luz, no movimiento; la inclinación con el puntero se descarta |
| #152, plan 009 | Entrada y salida de `GDialog` con `@starting-style`; salida más corta | D1 solo cambia **desde dónde** entra y **hacia dónde** sale |
| #281 | `GDialog` abierto crece hacia abajo (ronda propia; la colocación inicial no cambia sin preguntar) | D2 lo prototipa sin cambiar la colocación inicial |
| #298 | Personalidad de `GAvatar` (precedente de formato y de constantes de coreografía neutras, #187) | Mismo formato; las fracciones y topes de esta ronda son constantes de coreografía |
| #85 a #87, #197 a #203 | Iconos solo Lucide | Ninguna idea dibuja iconos; la de confirmación usaría `check` de la lista |

## Lo que decide esta ronda

Qué ideas entran en una primera tanda (1–2 por componente), qué tokens de movimiento hay que nombrar y qué decisiones de personalidad registra lima. Las tres preguntas de identidad que solo puede contestar el usuario van al final de la declaración.

## Lo que NO es esta ronda

- No escribe contratos, CSS de componente ni `.vue`: después de lima, cada idea aprobada se convierte en un plan en `plans/` para coco y bruno.
- No cambia colores, tipografía, radios ni densidades del tema por defecto.
- No adopta Dark Color Presence ni toca el Theme Engine.
