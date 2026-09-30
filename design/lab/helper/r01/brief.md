# Brief funcional · GHelper y GHelperScope · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral
**Fuente:** especificación técnica del usuario «`GHelper` y `GAvatarMotion`» (Draft → Candidate).

## Alcance de la ronda (decisiones del usuario)

- **Solo `GHelperScope` y `GHelper`.** `GAvatarMotion` va después, cuando exista su prototipo validado y `icons.md` admita ilustraciones.
- **Posicionamiento:** se extrae el de `GMenu` como utilidad interna compartida, con volteo por colisión. **Sin dependencias** en tiempo de ejecución.
- **Hoja móvil:** cuando el contenido no cabe como popover, se abre en `GDialog` (`mobile="sheet"`).

## Enunciado

Un **desarrollador que usa Grana** necesita **colocar una ayuda contextual junto a una región de la interfaz** (formulario, tarjeta, diálogo, barra de herramientas), en el flujo del layout o flotando sobre un borde de esa región, para que el usuario abra un contenido agnóstico (texto, acciones, un formulario, un asistente de IA) sin salir de donde está.

## Pregunta de diseño

¿Qué anatomía, geometría (`placement` × `attach` × `offset`) y comportamiento necesita `GHelper` para que el disparador sea siempre un botón real, su contenido se abra junto a él sin quedar recortado y, si no hay espacio, pase a una hoja inferior, sin que el desarrollador escriba posicionamiento ni gestión de foco?

## Verbo y resultado

- **Verbo principal:** pedir ayuda sobre esta región.
- **Resultado verificable:** el disparador es un `<button>` con nombre, `aria-expanded` y `aria-controls`; Enter o Espacio abre y cierra; Esc cierra y devuelve el foco; el contenido nunca queda cortado por el borde del visor ni por un contenedor con `overflow: hidden`.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| `GHelperScope` | No | Contenedor sin aspecto propio que fija el contexto de posición |
| Disparador | Sí | `<button>`. Por defecto: círculo con `circle-help` (Lucide). Personalizable (icono, texto, avatar) |
| Contenido | Sí | Libre. Popover no modal junto al disparador, o hoja inferior modal si no cabe |

## Composiciones

1. **Inline:** el disparador ocupa su sitio en el flujo (barra de herramientas).
2. **Float:** el disparador flota sobre la región, en uno de 12 `placement`, con `attach` `inside`, `edge` u `outside` y un `offset` en unidades de `space`.
3. **Contenido con otra orientación:** el disparador arriba y el contenido abriéndose hacia abajo (`contentPlacement`).
4. **Colisión:** el contenido pedido abajo que no cabe se voltea arriba; si no cabe de lado, se desplaza.
5. **Adaptativo:** si no cabe en ninguna posición, hoja inferior.
6. **Scope implícito:** sin `GHelperScope`, el disparador flota respecto al ancestro posicionado más cercano (p. ej. el cuerpo de un `GDialog`).

## Continuidad

- **Teclado:** Enter/Espacio abre y cierra; Esc cierra; Tab navega normal (sin trampa de foco en el popover).
- **Foco:** siempre visible con el sistema de Grana (`--g-focus-*`).
- **Zoom 200% / 320px:** el popover nunca supera el visor; por debajo del espacio mínimo, hoja.
- **Movimiento:** entrada breve solo con `prefers-reduced-motion: no-preference` (lo decide coco).
