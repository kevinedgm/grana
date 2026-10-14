# Brief funcional · GSidebar · r02 · el item actual con identidad

**Agente:** kiwi · **Ruta:** R1 (mejora de un componente `candidate`) · **Fidelidad:** F3 con los **tokens reales** del tema por defecto (`packages/vue/src/styles/defaults.css`) y del tema del proyecto de integración (`theme-nisa.css`, generado con `@grana/cli` desde `{"brand":"#24366B","accent":"#C1D324"}`, acotado a `.t-nisa`).
**Origen:** hallazgos de una integración real de Grana (página de Notion «Hallazgos de integración real», proyecto NisaNabani). P1: hallazgo 2. P2 que entran por decisión del usuario: hallazgos 10 y 11.
**Sin tocar:** `GSidebar.css` (coco corrige ahora el hallazgo 1, hover sobre el actual), ni nada fuera de `design/lab/sidebar/r02/`.

## Enunciado

Un **desarrollador que integra Grana** en un sistema con identidad propia necesita que el **item actual** de `GSidebar` hable su idioma (en el caso real: «marino relleno + texto lima») **sin tocar clases internas**, que no son API de estilo. Hoy el actual se pinta con la superficie `inset`, `--g-color-text`, un contorno `border-strong` y la barra `accent-text` (#89, #239): se distingue poco por su superficie (1.08:1 frente a la carcasa, README) y no admite tinta propia. Además, el integrador necesitó **cortes de adaptación propios** (drawer por debajo de 1024px, sin riel; hallazgo 10) y un **hueco de icono mayor** para un icono con fondo (hallazgo 11).

## Pregunta de diseño

1. ¿Qué **ranuras** del activo hacen falta para cualquier identidad, qué pares deben cumplir y cómo se comportan hover, foco, barra de acento, rama, riel, navbar, drawer y `forced-colors` con un activo **relleno**?
2. Más allá de exponer tokens: ¿qué **forma y movimiento** del item actual dan a Grana personalidad y además orientan mejor? (Tres conceptos A/B/C.)
3. ¿Cómo se configuran los cortes de `mode="auto"` (H10) y el tamaño del hueco del icono (H11) sin romper #69 (adaptación por contenedor, sin consultas de medios) ni el contrato de tokens?

## Verbo y resultado

- **Verbo:** reconocer dónde estoy, con la identidad de mi producto.
- **Resultado verificable:** el actual se ve con relleno, tinta y filo del tema en los cuatro formatos; tinta/relleno ≥ 4.5:1 y una señal gráfica ≥ 3:1 frente a la carcasa en claro **y** oscuro; el hover no le quita su superficie; foco visible; en `forced-colors`, `Highlight`/`HighlightText`; el caso real (drawer < 1024px, sin riel) se expresa con API, sin `matchMedia` externo; un icono con fondo de 28px no desborda.

## Solapamientos revisados (no duplicar)

| Existente | Qué aporta | Qué toma esta ronda |
| --- | --- | --- |
| `GTabs` (`--_mark-*`, marca que se desliza, #122) | Una marca única posicionada por variables del `.vue` | A reutiliza el patrón (una ficha por `<nav>`), no el componente |
| Navbar de `GSidebar` («píldora activa», #68) | Relleno `--g-color-{color}` / `on-` | Las ranuras unifican la píldora con el activo de la barra lateral (hallazgo L4) |
| `GTooltip` «pestaña que viaja» (#380) | Viaje con `--g-ease-out` y relevo | A comparte el lenguaje de viaje; sin motor nuevo |
| §7.1 tokens (#431): marcado relleno → contorno `{familia}-text` | Regla de filo para controles marcados | La rama y el filo de B; la validación de pares |
| `GAvatar` en un hueco (#295) | El hueco adopta la caja de su hijo | Opción 11-B |
| `GStatusIsland` superficie inversa (#325) | Relleno sin token nuevo | Descartado como valor por defecto: invierte la carcasa entera, demasiado peso para un item |
| `GCard` `--g-card-selected` (#134) | Fondo de seleccionado relativo a la anfitriona | Precedente de token de componente para un estado |

## Anatomía (sin cambios de DOM salvo lo marcado)

| Parte | Cambio |
| --- | --- |
| `g-sidebar__link[aria-current="page"]` | Lee las ranuras del activo |
| Forma del actual | A: un nodo `aria-hidden` por `<nav>` (la ficha). B: ninguno (pseudo-elementos del hueco del icono y del hijo). C: un nodo `aria-hidden` por `<nav>` (la lengüeta) |
| `g-sidebar__icon` | Tamaño desde H11 |
| `g-sidebar__bar > li.is-current` | La píldora lee las ranuras (L4) |
| Raíz | Filo interior en vez de `border-inline-end` solo si se elige C |

## Estados del actual

reposo, hover (sin cambio de superficie: hallazgo 1), foco por teclado (anillo fuera, separado por la carcasa), pulsado, rama (hijo actual: en expandida el padre con peso; en riel y navbar el **representante visible** toma la marca completa, como ya hace la píldora), deshabilitado (nunca es actual), movimiento reducido, `forced-colors`, RTL.

## Alcance

| Must | Should | Could | Won't (esta ronda) |
| --- | --- | --- | --- |
| Ranuras del activo y sus pares; reglas de hover/foco/rama/barra/forced-colors | Un concepto de forma elegido por el usuario | Derivación de las ranuras en el CLI (diagnóstico, no rechazo) | Variantes múltiples del activo como prop |
| H10: cortes configurables | H11: hueco del icono configurable | Tinta propia para la rama | Cambiar el formato navbar (#68, #437) |
