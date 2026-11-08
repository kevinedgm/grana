# Brief · GPageIndex, forma de columna (r01)

> kiwi, 2026-11-08. Encargo: el sitio vuelve al diseño anterior (`design/lab/sitio/referencia/`) hecho con Grana. «En esta página» era una **columna a la derecha**, pegada, con título, enlaces `h2`/`h3`, la sección actual en color y un **marcador de 2 px** sobre una línea guía; en estrecho se **plegaba en un desplegable** en una barra local. `GPageIndex` existe (`design/contracts/page-index.md`) solo con la forma `relay` (botón de menú en el zócalo de `GPageHeader`); `list`, `line` y `rail` están reservadas «con su ronda corta de kiwi sobre este motor». Esta es la ronda de la columna.

## Para qué sirve y a quién

- **Quién:** quien lee una página larga (una ficha de componente tiene 62 secciones) y quiere saber dónde está, saltar a otra sección o volver arriba; y, fuera del sitio, quien rellena un formulario largo o una página de ajustes (`GbSettingsLayout01` hoy compone el índice a mano).
- **Qué hace:** lista las secciones de **esta** página, marca la que se lee (`aria-current="location"`, línea de lectura de #1039), lleva a la elegida (y sostiene la elegida, #1048) y, en estrecho, cabe en una barra.
- **Qué no hace:** no navega entre páginas (`GSidebar`), no es un menú de comandos (`GMenu`), no intercambia paneles (`GTabs`).

## Auditoría previa (`docs/documentacion/auditoria-visual.md`)

| Punto | Estado en el sitio anterior (medido) | Consecuencia |
| --- | --- | --- |
| Estructura | Columna de 224 con línea guía, título 14/600, enlaces 14/400 en filas de 32, `h3` sangrados 16 | Se calca |
| Delimitación | Línea guía `border`; marcador 2 × 18 en `accent-text` | Se calca (el marcador es la señal de forma de 1.4.1) |
| Contraste | Actual `text` frente a reposo `text-muted`: 2,33:1 (claro), 1,77:1 (oscuro) | Solo el marcador distingue de verdad: obligatorio |
| Estados | Hover a `text`; actual a `text` con marcador | Se calcan |
| Alcance | La columna no tiene desplazamiento propio: con 62 secciones (2016 px) la actual se sale del visor | **Defecto que no se calca** (PI-N3) |
| Estrecho | Botón «En esta página ›» sin `aria-expanded`; panel con «Volver arriba» | Se calca con *disclosure* correcta |

## Restricciones

- Mismo motor que `relay` (secciones, actual, elegir, foco); solo cambia la forma.
- SSR sin CLS; tokens del tema por defecto; iconos Lucide; nada nuevo en el principal.
