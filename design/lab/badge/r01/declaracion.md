# Declaración de cumplimiento · GBadge · r01

**Estado:** aprobada. Las decisiones de estructura y accesibilidad se derivan de estándares (WCAG 2.2 AA: 1.1.1, 1.3.1, 1.4.1, 1.4.11, 4.1.2). El usuario decidió el alcance: **insignia no interactiva**; entran **texto + punto de estado, contador numérico con tope, icono opcional, anclada a otro elemento**, y además **insignias de figura o icono solo, para estatus**.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises (sin color: el significado se lee por texto, figura o icono, que es justo lo que se quiere demostrar).
**Siguiente dueño:** lima → `design/contracts/badge.md`.

`solid`, `soft`, `outline` × tamaños `sm`, `md`, `lg`; texto + punto (círculo, cuadrado, rombo, triángulo); texto + icono; solo icono (`solid`, `soft`, `outline`, 3 tamaños); solo figura (4 formas, 3 tamaños); contador (0 oculto, 1, 12, 99, 100 → 99+, `showZero`, tope 9); anclada (cuatro esquinas, sobre avatar y sobre botón); RTL; texto largo (elipsis a 160px).

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | La insignia es un `<span>` **no interactivo**: sin `tabindex`, sin rol interactivo; **ninguna de las 41 insignias del prototipo es enfocable ni interactiva** (verificado). Una acción es un `GBtn`, no una insignia | WCAG 4.1.2: no aparentar un control que no lo es; alcance decidido por el usuario |
| 2 | El significado **no depende solo del color**: texto, figura (círculo, cuadrado, rombo, triángulo) o icono distintos. El prototipo es en grises a propósito | WCAG 1.4.1 |
| 3 | Sin texto visible (icono, figura, contador), la insignia lleva un **texto oculto** (`g-badge__sr`, patrón estándar de texto oculto) con el nombre que da la aplicación, y su parte visible es `aria-hidden` (verificado: 25 de 25 insignias sin texto lo cumplen) | WCAG 1.1.1, 4.1.2 |
| 4 | El nombre accesible **lo da la aplicación** (`label`), sin valor por defecto: una figura o un icono no tienen texto propio y el idioma es de la aplicación. Es **obligatorio** en solo icono, solo figura y contador (aviso en desarrollo si falta) | Internacionalización; WCAG 1.1.1 |
| 5 | Contador con tope: `count` > `max` muestra `max+` (verificado: 100 → `99+`, 15 con tope 9 → `9+`); el texto para lectores es **el número real** («100 mensajes sin leer»), no «99+» | WCAG 1.1.1: la abreviatura visual no debe empobrecer lo que se anuncia |
| 6 | Con 0 no se muestra el contador salvo `showZero` (verificado) | Reducir ruido; convención de notificaciones |
| 7 | **Sin anuncios automáticos** al cambiar el número (sin `aria-live`) | Un contador que cambia con frecuencia sería spam; si la aplicación quiere anunciarlo, usa su propia región viva |
| 8 | Anclada: un envoltorio posicionado (`g-badge-anchor`) con la insignia en una esquina lógica (`top-end` por defecto; `top-start`, `bottom-end`, `bottom-start`); en RTL se espeja (verificado: `top-end` cae a la izquierda) | Propiedades lógicas; internacionalización |
| 9 | La insignia anclada tiene `pointer-events: none` y va **después** del destino en el orden del documento: no captura clics ni foco (verificado: el clic en la esquina compartida llega al botón y el foco nunca va a la insignia) | WCAG 2.4.3, 2.5.8: no restar área ni foco al destino |
| 10 | El destino conserva su nombre (`aria-label` del botón o avatar); la insignia se lee **después** («Bandeja de entrada, 120 mensajes sin leer») | WCAG 4.1.2 |
| 11 | Texto largo: una línea con elipsis (`text-overflow`), el texto completo sigue en el DOM para lectores (verificado a 160px) | WCAG 1.4.10 |
| 12 | Las figuras se dibujan con formas de CSS, no con un relleno de fondo que `forced-colors` elimine (círculo y cuadrado con `currentColor`, rombo girado, triángulo con bordes) | WCAG 1.4.1 con colores forzados |
| 13 | Convención de figuras para estatus (la aplicación la ratifica): círculo = en línea o correcto, cuadrado = detenido, rombo = advertencia, triángulo = error | Diferenciar por forma cuando el color no basta |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.1.1 Contenido no textual | Cumple | 25 de 25 insignias sin texto llevan texto para lectores |
| WCAG 1.3.1 Información y relaciones | Cumple | Insignia anclada después del destino; partes visibles sin texto en `aria-hidden` |
| WCAG 1.4.1 Uso del color | Cumple por diseño | Prototipo en grises: el significado se lee por texto, figura o icono |
| WCAG 1.4.10 Reajuste | Cumple | Elipsis a 160px, sin desborde horizontal |
| WCAG 2.4.3 Orden del foco | Cumple | 0 insignias enfocables; Tab pasa al botón anclado sin detenerse en la insignia |
| WCAG 4.1.2 Nombre, función, valor | Cumple por diseño, sin confirmar con lector real | Sin rol interactivo; nombre por texto oculto |
| WCAG 1.4.11 Contraste no textual | Sin verificar | Lo audita coco con el tema real (figuras e iconos ≥ 3:1) |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`. Sin errores en consola.
- Estructura: 41 insignias, 0 enfocables, 0 interactivas; 25 sin texto, todas con texto para lectores y partes visibles `aria-hidden`.
- Contadores: 1, 12, 99, `99+` (de 100 y de 120), `9+` (tope 9), `showZero`, y texto para lectores con el número real.
- Anclada: clic en la esquina compartida llega al botón; `pointer-events: none`; orden del documento; RTL espejado.
- Texto largo: elipsis y sin desborde.
- Corregido durante la ronda: las figuras solas medían 0 de alto (`min-block-size` no da una altura definida al `100%` interior); se les dio `block-size`.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): cómo se anuncian la insignia sin texto y la anclada junto a su destino.
- **Contraste** (texto 4.5:1; figuras e iconos 3:1), colores reales y `forced-colors`: lo audita coco.
- Zoom al 200% y dispositivo táctil (no aplica: no hay interacción).

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | `variant` | Media | Subconjunto `solid`, `soft` y `outline` (`ghost` y `link` no aplican a una insignia) |
| 2 | `size` | Baja | `sm`, `md` y `lg` (subconjunto, como `GDialog`); altura y texto derivados de `space` y de la tabla de tipografía, sin piso táctil (no es interactiva) |
| 3 | `color` | Baja | Los siete semánticos, como el resto; por defecto `neutral` |
| 4 | Contenido | Alta | Props `count`, `max` (99), `showZero`, `shape` (`circle` `square` `diamond` `triangle`), `dot` (Boolean: punto delante del texto con la forma de `shape`), `label` (nombre accesible); slots: por defecto (texto), `icon` (decorativo) y `anchor` (elemento destino) |
| 5 | Nombre accesible | Alta | `label` **obligatorio** (aviso en desarrollo) cuando no hay texto visible: solo icono, solo figura o contador; con texto visible, opcional (y si se da, se lee **en lugar** del texto visible: no se duplica) |
| 6 | Modo de la insignia | Alta | Se deduce: con slot por defecto = texto (con `dot`/`icon` opcionales); con `count` = contador; con `shape` sin texto = figura; con `icon` sin texto = solo icono |
| 7 | Anclada | Alta | Slot `anchor` con el destino; prop `placement` (`top-end` por defecto, `top-start`, `bottom-end`, `bottom-start`); la raíz pasa a ser el envoltorio `g-badge-anchor` y la insignia `g-badge` va dentro |
| 8 | Contador en cero | Media | Con `count` 0 y sin `showZero`, no se renderiza la insignia (anclada: solo el destino) |
| 9 | Anuncios | Media | Sin región viva |
| 10 | Atributos | Baja | `class`, `style` y `data-*` a la raíz (la insignia, o el envoltorio si es anclada); sin eventos declarados (no es interactiva) |
| 11 | Elipsis | Baja | Una línea, `max-inline-size: 100%` |
