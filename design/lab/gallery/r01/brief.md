# Brief · galería con visor (`GGallery`), r01

> kiwi, 2026-10-21. Parte del encargo «primitivas de marketing» (inventario en `design/lab/marketing/r01/`): la galería es **componente de Grana**, prioridad 2, tras el héroe. Contexto de producto: sitios premium para hoteles boutique, restaurantes y tour operators en Oaxaca, hechos con Grana (temas rústico, minimalista, lujo; WCAG 2.2 AA; rápidos).

## Problema

Quien decide reservar quiere **ver antes**: la habitación, el baño, la vista desde la terraza; el plato, la barra de mezcal; la cascada del tour. Hoy, con Grana, la aplicación tendría que escribir a mano la cuadrícula, el visor modal, el teclado, el contador, el gesto táctil y la devolución del foco. Cada sitio lo haría distinto y casi siempre mal: el lightbox genérico pierde el foco al cerrar, no anuncia «3 de 10», no tiene salida en el teclado, desplaza la página por debajo o salta al pasar en el móvil.

## Quién lo usa

- **Huésped en el teléfono** (la mayoría del tráfico de un hotel boutique llega desde Instagram o Google Maps): una mano, conexión irregular, quiere comprobar *un* espacio concreto («¿cómo es el baño?») y volver a reservar sin perder el sitio.
- **Comensal** que mira la carta con fotos antes de ir: recorre platos, no «la galería».
- **Viajero que compara tours**: quiere ver el lugar y el grupo, y entender el orden del día.
- **Teclado, lector de pantalla, baja visión (zoom 200–400 %), movimiento reducido, `forced-colors`, RTL** (sitios bilingües con visitantes de todo el mundo; RTL es raro en Oaxaca pero Grana es internacional).
- **Quien integra** (desarrollador que vende el sitio): pasa una lista de fotos con su `alt`, su tamaño y, si quiere, su grupo; el componente no pide nada a la red (`AGENTS.md`).

## Tarea

1. Base funcional: lista de miniaturas con mejora progresiva (sin JS, enlaces a la foto grande), visor modal sobre el patrón de `GDialog`, teclado APG, contador anunciado, gesto táctil, zoom opcional, foco devuelto, movimiento reducido, sin desplazamiento horizontal a 320 px y a 400 %.
2. Dos o tres conceptos divergentes de forma y comportamiento (A/B/C) con los tokens reales del tema por defecto, comparativa y una pregunta de elección.

## Solapes revisados (no duplicar)

| Existente | Qué hace | Frontera con la galería |
| --- | --- | --- |
| `GDocumentPreview` (#638 a #649) | Ver y usar **un archivo**: PDF e imágenes, lomo con una muesca por página, zoom y giro declarados por el renderizador, acciones con acuse (descargar, imprimir, compartir) | Un documento es **un objeto con páginas**; una galería es **una colección de fotos con su texto**. La galería no descarga, no imprime, no gira ni tiene renderizadores: el `<img>` del navegador basta. Comparte ideas (la marca que llega, el foco que no se roba, «un estado, varias profundidades»), no código obligatorio. Una galería de PDFs es `GDocumentPreview` |
| `GDialog` (+ `topModal.js`, #565 a #568, #292, #301) | Modal con `<dialog>`, foco inicial, Esc, fondo, apilado, diálogo que nace del disparador con tope | **El visor es un `GDialog`** (o su motor `topModal`): no se reescribe el modal. Lo nuevo es el escenario de la foto, el contador y el teclado de recorrido |
| `GCard` `media` (#123 a #135) | Media decorativa o informativa dentro de una tarjeta; **la media no es un control** | Una tarjeta de habitación con su foto es `GCard`; si la foto debe abrir la galería de esa habitación, `GCard` lleva la galería dentro (en `media` con un control propio por encima) o un botón «Ver 10 fotos». La galería no es una tarjeta |
| `GCardGroup` (#603 a #611) | Grupo de tarjetas con `role="toolbar"` y lengüeta | Agrupa entidades con acciones; la galería agrupa fotos. No se mezclan |
| `GTabs` | Pestañas | El índice por espacios del concepto A **no son pestañas**: todas las fotos están en la página y el índice salta (enlaces), no oculta paneles |
| `GAdaptiveLayout`, `GStack`, `GContainer` | Reparto y medida | La galería vive dentro de `GContainer`; el mosaico es suyo porque depende de la proporción de cada foto |

## Auditoría previa (`docs/documentacion/auditoria-visual.md` §1 y §3, adaptada a una vista de contenido)

No hay galería en Grana ni en el playground; se audita el **patrón habitual** (cuadrícula de miniaturas + lightbox) que la aplicación escribiría sin el componente, y lo que exige la regla.

| Aspecto | Patrón habitual | Qué exige la ronda |
| --- | --- | --- |
| Estructura | Cuadrícula plana de `<img>` con `onclick`; sin título de colección ni recuento | Título o nombre de la colección, recuento («10 fotos»), lista semántica (`ul`), cada miniatura un control con nombre |
| Jerarquía | Todas las miniaturas iguales; nada dice qué espacio es cada foto | La primera foto (o la de cada grupo) manda; el texto de la foto (`caption`) es visible en el visor |
| Contraste y delimitación | Controles blancos sobre la foto (flechas, cerrar) que desaparecen sobre una foto clara | Controles **fuera de la foto** o sobre una banda con contraste garantizado (medido con los casos extremos `cielo` y `noche`) |
| Espaciado | Literales | Solo tokens (`space`), radios `--g-radius-*`, `--g-surface-*` |
| Controles | Flechas de 32 px pegadas al borde, cerrar en la esquina sin nombre | ≥ 44 px con `pointer: coarse` y ≥ 24 px siempre; nombres accesibles; orden de Tab lógico |
| Estados | Sin carga ni error de imagen | Carga (marcador `mold`), error de imagen (texto alternativo y aviso), una sola foto (sin flechas), vacío (no se pinta) |
| Teclado | ←/→ a veces; Esc a veces; el foco queda en `body` al cerrar | APG: ←/→ (espejo en RTL), Inicio/Fin, Esc, foco atrapado en el visor, **foco devuelto a la miniatura de la foto que se estaba viendo** |
| Movimiento | Deslizamiento de 400 ms siempre, rebote del zoom | Breve, interrumpible, nada al montar, reducido = cambio en el sitio |
| Rendimiento | Todas las fotos grandes cargadas al inicio | Miniaturas `loading="lazy"` salvo las primeras visibles; la grande se pide al abrir y se precarga solo la vecina |
| Consistencia | Estilo propio del lightbox | Reutiliza `GDialog`/`topModal`, `GBtn`, `GIcon` (Lucide) y los tokens |
