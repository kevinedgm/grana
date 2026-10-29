# Brief · «Una sola luz» en `GSidebar` y `GTable` (kiwi r01)

## Encargo

Extender M1 de `GMenu` («una sola luz que viaja», DECISIONS #305 y #308; `design/contracts/menu.md` «Personalidad»; regla 3 de `design/lab/personalidad/r01/declaracion.md` §9) a los enlaces de `GSidebar` y a las filas de `GTable`.

**La forma ya está elegida por el usuario (2026-10-29):** adoptarlo «como lo recomienda la skill Fluid Functionalism»: un único resaltado por lista que se desliza al elemento bajo el puntero. Esta ronda no abre conceptos A/B/C de identidad: decide **estructura y reglas** (qué es una lista, qué se registra, dónde vive la capa, qué datos escribe el `.vue`, cómo convive con cada estado).

## Problema medido (Chromium 1280, playground real y este prototipo)

| Componente | Hoy | Causa |
| --- | --- | --- |
| `GTable` | **dos filas con fondo a la vez** al barrer (32 muestras en el playground; `maxOwn` 2 en este banco) | `transition: background-color var(--g-duration-fast)` en cada `td` (`GTable.css:121`): la fila que se deja se funde mientras la nueva se enciende |
| `GSidebar` | **dos enlaces con fondo a la vez** (`maxOwn` 2 en este banco) y **apagón** en el hueco de 2px entre enlaces (2 de 4 muestras en el playground) | fondo por enlace con transición (`GSidebar.css:288`) y `gap: space × 0.5` en `.g-sidebar__list` y `.g-sidebar__sub` |
| `GMenu` | referencia: desliza, nunca dos, sin apagón | M1 ya construido (`utils/menuNav.js` `createHighlight`) |

Viola la regla 3 de la ronda de personalidad («una sola luz… nunca varias que se encienden y apagan»).

## Reglas de partida (de la skill, adaptadas a Grana sin React)

1. Un resaltado por lista; las filas se tocan; un hueco real lo apaga.
2. Solo se registran destinos de clic; los deshabilitados no se iluminan.
3. Un divisor entre grupos = otra lista; los hijos de un padre son de la lista del padre.
4. Al entrar el puntero desde fuera, aparece donde aterriza.
5. Solo lo que ya usa M1; `reduce` sin viaje; `forced-colors` oculta la capa.

## Fuentes leídas

`CLAUDE.md`, `AGENTS.md`, DECISIONS #299, #305, #308, #564, #592–#602, #612–#619; `design/contracts/{menu,sidebar,table}.md`; `docs/documentacion/{rubrica-movimiento,auditoria-visual}.md`; `GMenu.vue`/`.css`, `utils/menuNav.js`, `GSidebar.vue`/`.css`, `GTable.vue`/`.css`; la skill `fluid-functionalism` (`references/custom-motion.md` «Fluid hover», `references/craft.md` «Table» y «Sidebar»).

## Solapes revisados (no se duplica)

- **`GMenu` M1** ya tiene la capa por lista y el cálculo de caja (`createHighlight`). La geometría se comparte; lo que no existe es la **sesión del puntero** (M1 sigue al foco). Se propone una utilidad hermana, sin cambiar `GMenu` (declaración §4).
- **Motor de la pista** (`utils/visualTip.js`, #436) ya viaja entre controles del riel: convive, no se fusiona (la pista es otro canal: el nombre).
- **`GTabs` T3** (luz de hover en pestañas, idea de personalidad sin decidir) queda fuera; esta utilidad le serviría si se aprueba.

## Entregables

`declaracion.md` (puntos numerados, tablas de estados, «Qué lo hace distinto», hallazgos, reservas), `index.html` + `hg.js` + `hg.css` (prototipo sobre los componentes reales de `dist/` con el tema por defecto; `?glide=0` muestra el estado actual) y `verificar.mjs`.
