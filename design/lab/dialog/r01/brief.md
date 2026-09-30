# Brief funcional · GDialog · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita **mostrar contenido o pedir una decisión sobre una capa modal** (formulario, confirmación, detalle, configuración, vista previa) porque toda aplicación lo hace, y cada modal debe llegar con foco atrapado, cierre por teclado, nombre y descripción bien conectados y adaptación a móvil, sin que el desarrollador lo reconstruya. Además pide una **estética de superficies anidadas**: una carcasa exterior con una segunda superficie **inset** que aloja el contenido.

## Pregunta de diseño

¿Qué anatomía, estados y comportamiento necesita `GDialog` para que la carcasa exterior y la superficie inset se lean como una sola pieza ensamblada (no como una tarjeta sobre otra), sea genérico (formularios, confirmaciones, detalles, procesos) y se adapte a escritorio, tableta y móvil conservando las dos superficies?

## Verbo y resultado

- **Verbo principal:** abrir y resolver una tarea sin salir de la página.
- **Resultado verificable:** al abrir, el foco entra y queda atrapado; al cerrar (Esc, botón, acción), vuelve al disparador; el resto de la página queda inerte; el diálogo tiene nombre y, si hay, descripción.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Carcasa (superficie exterior) | Sí | El `<dialog>` nativo, modal (`showModal()`): capa superior, `inert` del resto y Esc resueltos por el navegador |
| Encabezado | Sí | Título (`h2`), descripción opcional, acción de cierre |
| Superficie inset | No | Segunda superficie con separación pequeña y radio concéntrico. Aloja cuerpo y pie. Sin ella, el diálogo es simple |
| Cuerpo | Sí | Contenido libre; con scroll interno cuando no cabe |
| Secciones | No | Separadas por línea fina dentro de la inset; no cajas |
| Superficie secundaria | No | Un nivel más (hundida) solo cuando agrupa algo que lo necesita |
| Pie | No | Acciones. Dentro de la inset; pegajoso cuando el cuerpo se desplaza |
| Fondo (backdrop) | Sí | Tinte plano, sin desenfoque |

## Composiciones (todas por props y slots de un solo componente)

1. **Simple:** carcasa + encabezado + contenido, sin inset.
2. **Con inset:** contenido dentro de la superficie inset.
3. **Con pie:** acciones al final de la inset.
4. **Con secciones:** varias secciones separadas por línea dentro de la misma inset.
5. **Con scroll:** el cuerpo se desplaza; encabezado y pie quedan fijos.
6. **Confirmación:** `role="alertdialog"`; foco inicial en la acción menos destructiva; el fondo no cierra.
7. **Formulario:** el botón de envío del pie se asocia con `form="id"`; no se cierra si el formulario no valida (lo decide el consumidor).
8. **Pantalla completa:** ocupa todo el visor; conserva las dos superficies.
9. **Adaptativo:** escritorio (centrado, ancho controlado) → tableta (más ancho, proporciones menores) → móvil (hoja inferior por defecto; ancho completo o pantalla completa por prop).

## Estados

`cerrado`, `abierto`, `focus-visible` (en cierre, acciones y cuerpo desplazable), `hover`, `scrolling` (con sombras/líneas de borde del pie y del encabezado), `busy` (acción en curso), `mobile-sheet`, `mobile-fullscreen`.

## Riesgo por acción

Cerrar es reversible salvo en formularios con cambios sin guardar: eso lo decide el consumidor (`dismiss` se emite y se puede cancelar). En **confirmación de acciones críticas** el fondo y Esc no cierran sin decisión explícita salvo Esc a "cancelar".

## Continuidad

- **Foco:** al abrir, al primer control (o a la acción segura en `alertdialog`); al cerrar, al disparador.
- **Teclado:** Esc cierra; Tab no sale del diálogo.
- **Scroll de la página:** bloqueado mientras esté abierto.
- **Cuerpo desplazable:** alcanzable por teclado (`tabindex="0"`, con nombre).
- **Zoom 200% / 320px:** sin desborde horizontal; la carcasa nunca supera el visor.
- **Movimiento:** entrada breve; sin animación con movimiento reducido.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Carcasa, encabezado, inset, cuerpo, pie, cierre, foco, Esc, fondo | Confirmación, formulario, scroll con pie fijo | Superficie secundaria | Componente `GSurface` aparte (los tokens de superficie quedan listos) |
| Adaptación por ancho (hoja, completo, pantalla completa) | Pantalla completa, secciones | | Apilar diálogos, arrastrar la hoja, diálogos no modales |
| | | | Pasos con navegación propia (se compone con el cuerpo) |
