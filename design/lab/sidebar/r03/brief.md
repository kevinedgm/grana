# Brief funcional · GSidebar · r03 · el índice calcado (`appearance="index"`)

**Agente:** kiwi · **Ruta:** R1 (enmienda de un componente `candidate`) · **Fidelidad:** F3 con el `GSidebar` **real** de `packages/vue/dist/` (filtro de `@grana/vue/sidebar-filter`, `code` 01–78, luz de #957, drawer) dentro del marco calcado de `design/lab/navbar/r01/`, con los tokens reales del tema por defecto, claro y oscuro.
**Origen:** decisión del usuario del 2026-11-08: el sitio de documentación debe quedar **idéntico al anterior** hecho con componentes de Grana, **también el índice izquierdo**: títulos de grupo en negrita, grupos plegables con flecha, separadores entre grupos, sin iconos, con las medidas, colores y estados del original; y **se conservan** el filtro con `/` y los números 01–79 (#1035 a #1037, #1050), que el original no tenía.
**Referencia medida:** `design/lab/sitio/referencia/medidas.md` §4 y `medidas.json` (`.VPSidebar*`, 44 vistas), capturas `combobox-*.png` y `estado-drawer-375-*.png`.
**Sin tocar:** nada fuera de `design/lab/sidebar/r03/`. Lima trabaja a la vez en `nav-bar.md`, `page-index.md` y `sitio-marco.md`.

## Enunciado

Quien lee la documentación de Grana necesita **encontrar una página entre 87** sin perder dónde está: el índice de siempre (el de VitePress que ya conoce), con los grupos que puede plegar, y además lo que A le dio (escribir para filtrar, ir por número). El integrador que monte un sitio de documentación o un índice largo con Grana necesita esa forma **como API**, no como CSS del sitio que pise clases internas.

## Preguntas de diseño

1. ¿Es una **apariencia nueva** de `GSidebar` o enmiendas de la actual? ¿Qué cambia de anatomía y qué no?
2. **Grupos plegables:** ¿`<details>`, disclosure con botón o el motor `utils/collapse.js`? ¿Qué estado inicial, qué persiste, qué se deriva de la ruta, qué pasa con el filtro y con la búsqueda de la página (Ctrl+F)?
3. ¿Dónde viven el **filtro** y los **números** sin mover el reposo calcado?
4. La marca del actual del original es **solo color** (medido: 1,31:1 frente a los vecinos): ¿cómo se corrige sin romper el calco?
5. ¿Qué personalidad de **comportamiento** cabe sin cambiar el reposo?

## Verbo y resultado

- **Verbo:** encontrar una página del índice y saber dónde estoy.
- **Resultado verificable:** a 1280 y 1024 (columna) y a 768 y 375 (cajón), en claro y oscuro, cada pieza del índice cae donde caía en el original (Δ en px por pieza en `paridad.json`); los grupos se pliegan con botón real (`aria-expanded`), el filtro abre los que tienen coincidencias y los devuelve al vaciar, `aria-current="page"` único, foco visible, drawer modal con Esc y devolución del foco, la marca del actual con una señal de forma ≥ 3:1; tres motores.

## Solapes revisados (no duplicar)

| Existente | Qué aporta | Qué toma esta ronda |
| --- | --- | --- |
| `GSidebar` expandida/drawer | `<nav>`, grupos con `aria-labelledby`, filtro (#1035), `code` (#1036), luz (#957), drawer `<dialog>`, `mode-change` | Todo: la apariencia es **otra piel y un plegado de grupo**, no otro componente |
| Padres con hijos de `GSidebar` (`is-open` + `inert`) | Plegado en línea de un item | El patrón de disclosure; el grupo **no** pasa a ser un padre (no navega ni tiene asiento) |
| `GAccordion` + `utils/collapse.js` (#486) | Plegado con rejilla 0fr→1fr y `hidden="until-found"` al asentar | El motor y el `until-found` (Ctrl+F abre el grupo) |
| `GFormSection collapsible` | Mismo motor | Nada nuevo |
| `GPageIndex list` (`page-index/r01`) | Marcador 2 × 18 que viaja por la línea guía | El lenguaje de la marca que viaja (aquí, 2 × 20 en el margen) |
| `GTabs` / P2 de `GNavBar` | Marca única que se desliza | Mismo patrón: una capa por `<nav>` |
