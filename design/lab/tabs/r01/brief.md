# Brief funcional · GTabs · r01

**Agente:** kiwi · **Ruta:** R1 · prototipo directo · **Fidelidad:** F2 (wireframe con kit neutral)

## Enunciado

Un **desarrollador que usa Grana** necesita **dividir un contenido en vistas hermanas** (ajustes, bandejas, informes por periodo) de las que **solo una se ve a la vez**, para que el usuario **cambie de vista sin salir de la página** y siempre sepa en cuál está.

## Pregunta de diseño

¿Qué anatomía y comportamiento necesita `GTabs` para cumplir el patrón *Tabs* de WAI-ARIA APG (un solo tab en el orden de Tab, flechas, paneles enlazados) y, a la vez, sobrevivir a muchas pestañas, contenedores estrechos, orientación vertical y paneles con contenido enfocable?

## Verbo y resultado

- **Verbo:** alternar entre vistas del mismo nivel.
- **Resultado verificable:** un lector de pantalla oye «pestaña, N de M, seleccionada» y el panel con el nombre de su pestaña; con teclado se llega a cualquier pestaña con flechas, Home y End; con 9 pestañas en 320px no hay desborde horizontal de la página.

## Casos de uso

1. Ajustes de proyecto (4–6 pestañas, paneles con formularios que **no deben perder el borrador** al cambiar; precedente: DECISIONS #78).
2. Bandeja con **contador** («Recibidos 3») e **icono**.
3. Informes por periodo, con panel que **carga bajo demanda**.
4. Muchas pestañas (≥ 8) en un contenedor estrecho: desplazamiento o menú «Más».
5. Preferencias en columna lateral (**vertical**), que en un contenedor estrecho se vuelve horizontal.

## Alcance de r01

Pestañas con etiqueta, icono opcional y contador opcional; pestañas deshabilitadas; paneles; activación automática y manual; orientación horizontal y vertical; desbordamiento (desplazamiento y menú); adaptación por ancho de contenedor; panel cargando y vacío; densidad; ocupar todo el ancho; RTL.

## Fuera de alcance (y por qué)

| Fuera | Motivo |
| --- | --- |
| Pestañas **cerrables, reordenables o añadibles** (tipo navegador/IDE) | Patrón distinto (gestión de documentos, foco tras cerrar, arrastre); se propone ronda aparte si el producto lo pide |
| **Sincronizar con la URL** (hash, ruta) | Es de la aplicación; `GTabs` es controlado por `modelValue` |
| **Navegación entre páginas** (barra de enlaces) | Son enlaces con `aria-current="page"`, no `tablist`; usar `GSidebar` o un futuro componente de navegación |
| Pestañas dentro de pestañas | Se pueden anidar sin soporte especial; no se diseña un caso |
| Estilo, color, movimiento del indicador | coco |

## Referencias de patrones

- **WAI-ARIA APG · Tabs** (`tablist`/`tab`/`tabpanel`, tabindex itinerante, `aria-selected`, `aria-controls`, `aria-labelledby`, `aria-orientation`; flechas con vuelta, Home/End; panel con `tabindex="0"` si no hay nada enfocable al inicio). Incluye las dos variantes: **activación automática** (el foco activa) y **manual** (Enter/Espacio).
- APG deja abierto si una pestaña deshabilitada recibe foco; aquí se decide en la declaración (#9).
- Reutilizados de decisiones previas: adaptación por **contenedor** (#69, #98), paneles que **permanecen montados** (#78), contador como **texto accesible** (#59, #78), evento **cancelable** (#97), menú de desbordamiento con el patrón de `GMenu` (#82), iconos solo Lucide (#85–87), sin textos por defecto (#97).
