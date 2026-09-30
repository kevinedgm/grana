# Brief funcional · GBadge · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita **mostrar un estado, una categoría o una cantidad en un espacio mínimo** (Activo, Pendiente, «Nuevo», 12 mensajes sin leer, un punto de conexión) porque casi toda lista, tabla, tarjeta y barra de navegación lo usa, y cada insignia debe **comunicar su significado sin depender solo del color** y llegar con nombre accesible cuando no lleva texto, sin que el desarrollador lo reconstruya.

Decisiones del usuario (respuestas de alcance): **insignia no interactiva**; entran **texto + punto de estado, contador numérico con tope, icono opcional en la insignia, superponer sobre otro elemento (anclada)** y, además, **insignias que sean figuras o que sirvan para estatus, solo iconos o figuras**.

## Pregunta de diseño

¿Qué anatomía, contenido y comportamiento necesita `GBadge` para que el estado se lea por **forma, icono o texto** y no solo por color (WCAG 1.4.1), para que una insignia **solo de icono, figura o contador** tenga nombre accesible sin ruido para lectores de pantalla, y para que una insignia **anclada** a otro elemento no cambie el nombre ni el foco de ese elemento?

## Verbo y resultado

- **Verbo principal:** señalar un estado o una cantidad.
- **Resultado verificable:** el significado se distingue sin color (texto, figura o icono distintos); una insignia sin texto visible se anuncia con el texto que da la aplicación; la insignia **no recibe foco** ni intercepta el clic del elemento al que se ancla.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Raíz (`g-badge`) | Sí | `<span>` no interactivo, en línea; sin `tabindex`, sin rol interactivo |
| Texto | No | Contenido del slot por defecto; una línea, con elipsis si no cabe |
| Punto de estado | No | Figura pequeña delante del texto; su forma cambia con `shape` |
| Icono | No | Decorativo (`aria-hidden`), delante del texto o solo |
| Figura | No | Insignia **sin texto**: círculo, cuadrado, rombo o triángulo (solo forma y color) |
| Contador | No | Número con tope (`99+`); oculto con 0 salvo `showZero` |
| Texto para lectores (`g-badge__sr`) | Con contenido sin texto visible | Texto visualmente oculto con el nombre accesible que da la aplicación (`label`) |
| Ancla (`g-badge-anchor`) | Solo con el slot `anchor` | Envuelve el elemento destino y coloca la insignia en una esquina |

## Contenidos (por props y slots)

1. **Texto:** `Activo`, `Nuevo`, `Beta`.
2. **Texto + punto de estado:** punto con la forma de `shape` antes del texto (`Activo`, `Pendiente`, `Error`).
3. **Texto + icono:** icono decorativo antes del texto.
4. **Solo icono:** insignia circular con un icono; **exige nombre accesible**.
5. **Solo figura (estatus):** círculo, cuadrado, rombo o triángulo; **exige nombre accesible**; la forma da el significado cuando el color no basta (círculo = en línea / correcto, cuadrado = detenido, rombo = advertencia, triángulo = error, por convención de la aplicación).
6. **Contador:** `12`, `99`, `99+` (con `max`); con 0 no se muestra salvo `showZero`.
7. **Anclada:** cualquiera de los anteriores (punto, figura o contador, o texto corto) en una esquina de un icono, avatar o botón.

## Estados

`sin interacción`: no hay hover, foco ni pulsación. Estados visuales: `solid`, `soft`, `outline` × 7 colores semánticos; tamaños `sm`, `md`, `lg`; `contador en cero` (oculto), `con tope` (99+), `texto largo` (elipsis), `anclada` (cuatro esquinas), `RTL`.

## Comportamiento

- **No interactiva:** no se enfoca, no responde al ratón ni al teclado. Si la aplicación necesita una acción, usa un botón (`GBtn`), no una insignia.
- **Nombre accesible:** una insignia con **texto visible** se lee con su texto. Una insignia **sin texto** (icono, figura o contador) lleva un texto oculto para lectores con lo que la aplicación indique (`label`), y su parte visible es `aria-hidden`.
- **Contador con tope:** con `count` > `max` muestra `max+`; el texto para lectores lo da la aplicación (`label`, por ejemplo «120 mensajes sin leer»), porque un lector no debería oír «99+».
- **Sin anuncios automáticos:** cambiar el número no dispara un anuncio; si la aplicación quiere anunciarlo, usa su propia región viva.
- **Anclada:** el elemento destino conserva su nombre, su foco y su clic; la insignia queda **después** del destino en el orden de lectura y no captura eventos del puntero. Posición lógica (`top-end` por defecto; en RTL se espeja).
- **Elipsis:** el texto largo se corta con `…` en una línea; el texto completo sigue disponible para lectores.

## Riesgo por acción

Ninguna (solo presentación). El riesgo es de **significado**: una insignia solo de color («rojo») no lo transmite a quien no distingue colores ni a un lector de pantalla; por eso el diseño obliga a **texto, figura o icono** y a un nombre accesible cuando no hay texto.

## Continuidad

- **Contraste:** texto ≥ 4.5:1; figuras e iconos ≥ 3:1 contra el fondo (lo audita coco con el tema real).
- **Zoom 200% y 320px:** sin desborde; el texto largo se recorta.
- **Movimiento:** ninguno.
- **Colores forzados:** las figuras conservan su forma (bordes), no dependen de un relleno.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Insignia de texto (`solid`, `soft`, `outline`, 7 colores, 3 tamaños) | Punto de estado con forma | Animación al cambiar el contador | Insignia interactiva o cerrable (chip) |
| Solo icono y solo figura, con nombre accesible obligatorio | Contador con tope y `showZero` | | Avatar (componente aparte) |
| Anclada a otro elemento (cuatro esquinas) | Icono junto al texto | | Anuncios automáticos (región viva) |
