# Declaración · GSidebar · r03 · el índice calcado (`appearance="index"`)

> kiwi, 2026-11-08. Prototipo: `index.html?p=comp|guide` (`&theme=dark`; variantes `&filtro=banda|fila`, `&num=fin|filtro`; `&hilo=0` sin la marca que viaja). Es el **`GSidebar` real** de `packages/vue/dist/` (filtro de `@grana/vue/sidebar-filter`, `code`, luz de #957, drawer `<dialog>`, `mode-change`) dentro del marco calcado de `design/lab/navbar/r01/` (barra `GNavBar` prototipo, `GAppShell` real, `GPageIndex list` prototipo), con dos piezas de kiwi encima: **`indice.css`** (la piel de la apariencia que se propone a coco, sin capa) e **`indice.js`** (el plegado de grupo y la marca que viaja que se proponen a bruno, puestos sobre el DOM real sin sustituirlo). Tokens reales del tema por defecto, claro y oscuro. Referencia: `design/lab/sitio/referencia/medidas.md` §4 y `medidas.json`. Verificación: `node design/lab/sidebar/r03/verificar.mjs` (puerto 4239), tres motores; paridad pieza a pieza en `paridad.json`.
>
> **La forma no se elige:** la fija el original (decisión del usuario). La personalidad es de **comportamiento** y no cambia el reposo calcado. Lo único que el original no tenía (filtro y números) se ofrece en **dos variantes cada uno** porque decide cuánto se aparta el reposo del calco: es la única pregunta de producto (§10).

---

## 0. Solapes revisados (antes de proponer)

| Pieza existente | Qué hace | Qué toma esta ronda |
| --- | --- | --- |
| `GSidebar` expandida + drawer | `<nav>` con nombre, grupos `<ul aria-labelledby>`, filtro (#1035, #1050), `code` (#1036), luz (#957), drawer modal, `breakpoints` (#618) | **Todo.** No es otro componente: es otra piel y un plegado de grupo |
| Padres con hijos (`g-sidebar__sub`, `is-open` + `inert`) | Disclosure de un item | El patrón; el grupo **no** pasa a ser un padre (no navega, no tiene asiento, no tiene panel en el riel) |
| `GAccordion` + `utils/collapse.js` (#486) | Plegado con rejilla `0fr → 1fr`, `hidden="until-found"` al asentar, `beforematch` | El motor y la búsqueda de la página (Ctrl+F abre el grupo) |
| Asiento del actual (#612 a #617) | Lleno = aquí; hueco = la rama | En el índice no hay asiento (el original no tenía icono): su papel lo hace la **marca de 2 × 20**, llena = aquí, hueca = dentro de un grupo plegado |
| Marcador de `GPageIndex list` y P2 de `GNavBar` | Una marca única que viaja por una guía | El lenguaje de I2 (aquí, en el margen del índice) |

Nada se duplica: no hace falta un `GDocIndex`. Un índice de documentación es un `GSidebar` en otra apariencia, igual que un administrador con decenas de módulos (inventario #13) puede querer la misma piel.

## 1. Decisión: apariencia nueva, `appearance="index"`

**Una prop nueva `appearance` (`default` | `index`), no enmiendas de la actual.** Lo que cambia toca a toda aplicación que ya usa `GSidebar` (asiento, iconos, riel, peso del actual): enmendar la apariencia por defecto rompería el sidebar de un ERP para calcar un sitio de documentación. El nombre sigue la costumbre del repo (`GCombobox appearance="palette"`, `GFab appearance="arc"`, `GRadioGroup appearance`).

| | `default` (hoy) | `index` (r03) |
| --- | --- | --- |
| Formatos | expandida, riel, navbar, drawer | **expandida y drawer**. Sin riel ni navbar: un índice de texto sin iconos no tiene qué enseñar en 64 px ni en una barra inferior |
| `mode="auto"` | expandida / riel / móvil por `breakpoints` | expandida ≥ `breakpoints.expanded`, drawer por debajo (`rail` y `mobile` se ignoran) |
| Item | asiento con icono o `code`, fila 40, etiqueta `text-muted`, actual `text` + peso + asiento lleno | **sin icono ni asiento**, fila de 32, 14/24/500 `text-muted`; actual en **`accent-text` con el mismo peso** + **marca 2 × 20** en el margen |
| Título de grupo | caption, `text-subtle`, no interactivo | **14/24, 700, `text`**; si el grupo es plegable, **botón** con la flecha al final |
| Grupos | separados por margen | **línea de 1 px** (`border`) entre grupos, 10 arriba y 24 abajo (10 si está plegado) |
| Cabecera | logo + contraer + filtro | **la banda** (alto de `--g-app-shell-header`, la marca y su línea de 1 px de borde a borde del contenido) con el filtro dentro (§5); sin botón de contraer |
| Borde de la columna | `border-inline-end` 1 px | ninguno (el original separa la columna solo por el fondo hundido) |
| `code` | dentro del asiento | **al final de la fila** (§6) |
| Luz (#957) | sí | sí, ensanchada 8 px por lado (la etiqueta empieza a ras) |

Avisos nuevos: **I1** `appearance="index"` con `mode="rail"` o `"navbar"` (se pinta expandida o drawer). **I2** item con `icon` en `index` (se ignora). **I3** grupo `collapsible` sin `id` (§3).

## 2. Anatomía propuesta (prototipo: DOM real + `.ix-*` de `indice.js`)

```html
<div class="g-sidebar g-sidebar--appearance-index g-sidebar--mode-expanded …">
  <div class="g-sidebar__head">                       <!-- la banda: alto --g-app-shell-header, línea inferior -->
    <div class="g-sidebar__top"><div class="g-sidebar__logo">…slot logo…</div></div>   <!-- sin g-sidebar__toggle -->
    <div class="g-sidebar__filter">…campo de #1035 (sin cambios de DOM)…</div>
  </div>
  <nav class="g-sidebar__nav" aria-label="Documentación">
    <ul class="g-sidebar__groups" role="list">
      <li class="g-sidebar__group" role="presentation">                         <!-- no plegable: como hoy -->
        <span class="g-sidebar__group-title" id="ID-g0">Guía</span>
        <ul class="g-sidebar__list" aria-labelledby="ID-g0">…</ul>
      </li>
      <li class="g-sidebar__group [is-closed]" role="presentation">              <!-- plegable -->
        <button class="g-sidebar__group-title" id="ID-g1" type="button" aria-expanded="true" aria-controls="ID-g1-body">
          Campos de entrada<span class="g-sidebar__chevron" aria-hidden="true">…GLibIcon chevron-right…</span>
          <span class="g-sidebar__sr">, {labels.groupCurrent}</span>              <!-- solo plegado con el actual dentro -->
        </button>
        <div class="g-sidebar__group-body" id="ID-g1-body" [hidden="until-found"]> <!-- rejilla 0fr→1fr de collapse.js -->
          <ul class="g-sidebar__list" aria-labelledby="ID-g1">
            <li class="g-sidebar__highlight" aria-hidden="true"></li>             <!-- la luz, como hoy -->
            <li class="g-sidebar__item"><a class="g-sidebar__link" href aria-current="page">
              <span class="g-sidebar__label">GCombobox</span>
              <span class="g-sidebar__code" aria-hidden="true">24</span>         <!-- hoy: g-sidebar__icon[data-code] -->
              <span class="g-sidebar__sr">, 24</span></a></li>
          </ul>
        </div>
      </li>
    </ul>
    <span class="g-sidebar__mark" aria-hidden="true"></span>                    <!-- I2: una por <nav>, última hija -->
  </nav>
</div>
```

1. **El título plegable es un `<button>` real** (APG Disclosure), con su texto como nombre y `aria-controls` al cuerpo. **No `<details>`/`<summary>`**: `summary` dentro de una lista de navegación se anuncia distinto en cada lector, no admite la rejilla animada de `collapse.js` ni la marca que representa, y el filtro necesita abrir y cerrar sin tocar la elección del usuario (con `<details>` el `open` del filtro y el del usuario serían el mismo atributo). El original pintaba un `div` con `tabindex` (defecto 4 de la referencia): se corrige.
2. **Un grupo no plegable** sigue siendo `span` (no enfocable): «Guía» en el original no lleva flecha.
3. La lista conserva `aria-labelledby` al título (ahora el botón): el nombre del grupo no cambia.
4. **Cuerpo con `hidden="until-found"` al asentar plegado** (como `GAccordionItem`): Ctrl+F encuentra «GSlider» dentro de un grupo plegado y `beforematch` lo abre. Donde el navegador no conoce `until-found`, `hidden` a secas. **Ojo (SB-B4):** la regla `display` de `.g-sidebar__list` gana al `hidden` del navegador; por eso `hidden` va en el envoltorio, no en la lista (el prototipo, sin envoltorio, lo repone con CSS).

## 3. Grupos plegables: modelo y estado

| Campo / prop | Tipo | Qué hace |
| --- | --- | --- |
| grupo `collapsible` | Boolean, `false` | El título es un botón y el grupo se pliega. **Sirve en las dos apariencias** (en el riel se ignora: los títulos están ocultos y todo abierto) |
| grupo `collapsed` | Boolean, `false` | Estado **inicial** (el `collapsed: false` de VitePress). Se lee al montar y cuando llega un grupo nuevo con ese `id` |
| grupo `id` | String | **Obligatorio** con `collapsible` (clave del estado y de `aria-controls`). Sin él: aviso I3 y no se pliega |
| `closedGroups` + `update:closedGroups` | Array de `id`, opcional | Para la aplicación que quiera **controlar o persistir** el plegado (`sessionStorage`, preferencia del usuario). Con `v-model:closedGroups`, el servidor ya pinta los plegados: sin salto al hidratar |
| `labels.groupCurrent` | String, recomendado | Texto oculto en el botón de un grupo **plegado con el actual dentro** («contiene la página actual») |

Reglas de estado (un solo estado de navegación, como las ramas abiertas):

5. **Elección del usuario en memoria** de la instancia. En un sitio el índice vive en el `Layout` y no se vuelve a montar al navegar, así que el plegado dura toda la visita (medido: pliego en el cajón, cierro, reabro → sigue plegado; tres motores). **No se guarda entre recargas** salvo que la aplicación use `v-model:closedGroups` (el original tampoco lo guardaba).
6. **Derivado de la ruta:** cuando `modelValue` pasa a un item de un grupo plegado, **ese grupo se abre** (VitePress hace lo mismo). Mientras el actual no cambia, el usuario puede plegar su grupo: entonces la marca lo representa en el título, hueca (§4).
7. **Filtro (#1035):** con texto, todo grupo con coincidencias se pinta **abierto** (`aria-expanded="true"`) **sin tocar la elección**; un grupo sin coincidencias se oculta entero, como hoy. Al vaciar, cada grupo vuelve a su estado (medido: «Acciones y navegación» plegado → escribir «tabs» lo abre con GTabs → Esc lo devuelve a plegado). Mientras hay texto, el botón no pliega (no tendría efecto visible).
8. **Teclado:** Tab recorre botones de grupo y enlaces en orden (medido: filtro → 9 enlaces de Guía → [Estructura de página] → GAppShell…; los enlaces de un grupo plegado no reciben foco); **Intro y Espacio** pliegan y despliegan (medido); **↑ ↓ Inicio Fin** de `GSidebar` deben incluir los botones de grupo visibles en su recorrido (**no prototipado**: hoy solo recorren `.g-sidebar__link`; SB-L7). Sin flechas izquierda y derecha: no es un árbol (APG reserva `tree` para jerarquías que se recorren como tal; esto es una lista de enlaces con secciones).

## 4. El actual: color del original + la marca que el original dejaba transparente

**Corrección de la referencia (SB-K1, para kiwi en `sitio/referencia/medidas.md` §7):** la fila «Índice» dice «actual `text` / reposo `text-muted` 2,33:1» y que «el marcador de 2 px es la otra señal». **Lo medido es otra cosa:** el actual se pinta en `accent-text` (rgb 11 99 206 claro, 51 131 240 oscuro) y el indicador `.indicator` de VitePress en el nivel 1 es **`rgba(0,0,0,0)`**: invisible. El actual se distingue de sus vecinos **solo por color, a 1,31:1 (claro) y 1,88:1 (oscuro)**. Falla 1.4.1 (G183 pide ≥ 3:1 y otra señal).

9. **El índice pinta el indicador del propio original** (2 × 20, radio 2, a 15 px del borde, centrado en la fila) en `accent-text`: **5,27:1 claro, 5,12:1 oscuro** frente a la columna (≥ 3:1, 1.4.11). Es la única diferencia del reposo con el original en la columna y no es elegible: la impone un estándar (regla del repo: la innovación ni el calco sacrifican accesibilidad). Medido: x 15, w 2, h 20, y = fila + 6 en las 16 vistas (Δ 0 con la caja del indicador del original).
10. **Representa (`is-rep`):** con el actual dentro de un grupo plegado, la marca pasa a la fila del título, **hueca** (contorno de 1 px en `accent-text`), y el botón lleva `labels.groupCurrent` como texto oculto. Hueca = «está aquí dentro», como el asiento hueco de la rama (#612).
11. El color del actual y el del hover **ya no coinciden**: el hover pasa a `text` (y la luz), el actual sigue en `accent-text` (en el original, hover = actual: defecto 6).
12. `forced-colors`: la marca en `Highlight`.

## 5. El filtro sin romper el reposo (F1 por defecto · F2 alternativa)

- **F1 · En la banda** (`&filtro=banda`, recomendado): el campo de #1035 vive en el hueco a la derecha de la marca (120 × 32, sin caja en reposo: lupa, «Filtrar» y el atajo `/`). **La lista no se mueve: Δ 0 en todas las piezas a 1280 y 1024.** Al enfocarlo (clic, Tab o `/`) o con texto, **crece hasta 208 y tapa la marca** (I3, §8); al salir vacío, vuelve. El recuento aparece en una línea bajo la banda solo con texto.
- **F2 · En una fila bajo la banda** (`&filtro=fila`): siempre a lo ancho, siempre visible. Más descubrible; **la lista baja 42 px** (título de «Guía» en y 116 en vez de 74).
- **Recuento (enmienda de #1035, SB-L4):** en `index`, con el campo vacío el recuento está **oculto a la vista** (sigue en el DOM y en `aria-describedby`): «87 páginas» bajo el campo en reposo es ruido que el original no tenía. Con texto, visible como hoy.
- **`filterPlaceholder` corto** («Filtrar»): en F1 el campo en reposo mide 120. Es texto de la aplicación; el contrato lo recomienda para `index`.
- **Por debajo de 960 (cajón):** el campo y el botón de cerrar en la primera fila (32), sin marca (la marca está en la barra). La lista baja 32 frente al cajón del original (que no tenía ni campo ni cierre).

## 6. Los números sin romper el reposo (C1 por defecto · C2 alternativa)

- **C1 · Al final de la fila** (`&num=fin`, recomendado): el número como el **número de página del índice de un libro**, `caption`, cifras tabulares, `text-subtle` (**4,72:1 claro**, margen 0,22; **6,93:1 oscuro**), en la columna de las flechas de los grupos. **La etiqueta no se mueve de x = 32** (Δ 0). El del actual, en `accent-text`.
- **C2 · Solo al filtrar** (`&num=filtro`): en reposo no se ven (reposo = original al píxel); con texto en el campo aparecen al final de cada fila. El número sigue en el nombre accesible y en el filtro («24» → GCombobox, medido), pero ya no es una identidad visible ni sirve para «pulsa 24» con control por voz sin escribir antes.
- **Nombre accesible (enmienda de #1036, SB-L6):** en `index` el texto oculto del número va **después** de la etiqueta («GCombobox, 24»): sigue el orden visual (1.3.2) y el nombre empieza por la etiqueta visible (2.5.3, buena práctica). El prototipo conserva el orden de hoy («24 GCombobox»), que también cumple 2.5.3 (contiene la etiqueta).
- **Descartado (I4):** enseñar en un grupo plegado el tramo «09–19». Con los nombres reales («Acciones y navegación», «Estructura de formularios») el título parte en dos líneas a 208 px; un tramo truncado no orienta.

## 7. Cajón (< 960, el corte del original) y SSR

13. `mode="auto"` con `breakpoints: { expanded: 960 }` (en `index` no hay `rail`): expandida desde 960, drawer por debajo, abierto por el botón «Menú» de la barra local (`sitio-marco.md` §4). Medido en tres motores: `<dialog>` modal con el foco dentro, Esc cierra y devuelve el foco a «Menú» (abierto con el teclado; con clic en WebKit es el S8 de `PENDIENTES.md` §3).
14. **Ancho del original:** `min(space × 80, 100vw − space × 16)` (320, o el visor menos 64: **311 a 375**). Hoy `GSidebar` usa `min(space × 80, 86vw)` → 320 a 375 (SB-C3). Medido con la regla: Δ 0 a 768 y a 375.
15. **El actual a la vista al abrir** (nuevo, SB-B5): con 87 entradas, el cajón se abre con la lista desplazada para que el actual quede en el centro (medido: GCombobox visible a 768 y 375; el original abría arriba del todo y el actual quedaba 1289 px más abajo). `scrollTop` directo, sin animación.
16. **Velo:** el original `rgba(0,0,0,.6)` en claro y oscuro; `GSidebar` usa `--g-surface-backdrop` (**0,32 en claro**, 0,6 en oscuro). Δ visible en claro (SB-C4): o el sitio redeclara `--g-surface-backdrop` (afecta a `GDialog` también, que en el original era el mismo velo del buscador, `rgba(0,0,0,.6)`: coherente), o se acepta.
17. **SSR:** todo el marcado está en el HTML (grupos abiertos o, con `v-model:closedGroups`, los plegados ya con `hidden="until-found"`); la marca I2 se coloca tras montar (es decorativa; antes de montar se puede pintar el indicador estático del actual con CSS, como hace el prototipo con `&hilo=0`, para que el primer pintado ya lleve la señal).

## 8. Movimiento

| Qué | Cómo | Reducido |
| --- | --- | --- |
| Plegar y desplegar un grupo | Alto con `collapse.js` (rejilla), `--g-duration-slow` + `--g-ease-out`; flecha gira 90° igual; el relleno inferior pasa de 24 a 10 al asentar | Inmediato (medido) |
| I2 · la marca que viaja | `translate` con `--g-duration-slow` + **`--g-ease-spring`** (el muelle del asiento, #617/#635) | Sin viaje (medido: sin transición de `translate`) |
| I3 · el filtro que crece en la banda | `inline-size` 120 → 208 con `--g-duration-slow` + `--g-ease-out`; la marca se oculta con `fast` | Sin transición |
| La luz (#957) | La de siempre | La de siempre |
| Filtrar | **Nada** (#1040): los grupos que abre el filtro no animan | — |

El original animaba el color 0,25 s y el cajón 0,5 s con `cubic-bezier(.19,1,.22,1)` (sin token: se traduce a `slow`). Rúbrica (`rubrica-movimiento.md`): **A** cumple (la marca dice a dónde fuiste; el plegado, qué se fue); **C** cumple (nada empuja salvo el plegado, que es lo pedido; la marca y la luz son capas); **D** cumple (transiciones y WAAPI cancelables: un segundo clic a mitad parte del alto actual); **E** cumple (todo lo provoca el usuario o la ruta); **F** cumple; **G** a medir con bruno (la marca lee dos cajas por cambio de actual o de plegado, ninguna por tecla); **No verificable aquí:** comodidad con trackpad inercial y con lector de pantalla real.

## 9. Qué lo hace distinto

El reposo es un calco: lo distinto es **cómo se comporta**, y nada de esto cambia lo que se ve quieto.

- **I1 · La luz que no imita al actual.** La luz de #957 en el índice, ensanchada para que no corte el texto que empieza a ras. En el original el puntero pintaba la fila **en el color del actual**: al recorrer 87 entradas, «dónde estoy» parpadeaba. Ahora el puntero tiene su señal (la luz) y el actual la suya (color + marca). Medido: hover en `text`, luz 8 px por fuera a cada lado, el foco no se mueve (tres motores).
- **I2 · La marca que viaja.** Al cambiar de página, la marca de 2 px **se desliza** de la entrada anterior a la nueva con el muelle (también al saltar de grupo), y si pliegas el grupo del actual **sube al título y se vacía**. **Por qué:** el índice persiste entre páginas; el ojo ve a dónde ha ido sin buscar el azul entre 87 filas, y un grupo plegado no esconde dónde estás. Es la gramática del asiento (#612) y de `GTabs` llevada al índice. Medido: a mitad del viaje la marca no está en el destino; al final, ±1 px de su fila.
- **I3 · El filtro que espera en la banda.** El campo ocupa el hueco que el original dejaba vacío junto a la marca y, al pedirlo (`/` o clic), crece sobre ella. **Por qué:** quien no filtra ve el índice de siempre; quien filtra lo tiene donde mira primero, sin una fila más que empuje 87 entradas.
- **I5 · El cajón que se abre donde estás.** Al abrir el índice en el teléfono, el actual ya está en el centro. **Por qué:** en el original, abrir el cajón desde GCombobox enseñaba «Guía» y había que desplazar 1289 px para ver dónde estabas.

## 10. Pregunta de producto (la única abierta)

**SB-Q1 · ¿Cuánto se aparta el reposo del calco para enseñar lo que el original no tenía?**

| | F1 + C1 (recomendado) | F1 + C2 | F2 + C1 |
| --- | --- | --- | --- |
| Lista | Δ 0 | Δ 0 | baja 42 px |
| Filtro en reposo | «Filtrar /» en el hueco de la banda | igual | fila propia, siempre a lo ancho |
| Números en reposo | 01–78 al final de cada fila, en `text-subtle` | **ninguno** (reposo = original) | 01–78 al final |
| Lo que se pierde | — | el número como identidad visible y la voz «pulsa 24» sin escribir | 42 px de índice; el calco de la columna |
| Capturas | `proto-1280-claro.png` | `variante-C2-1280-*.png` | `variante-F2-1280-*.png` |

**Recomendación de kiwi: F1 + C1.** Conserva el calco de la columna al píxel y la identidad de #1036/#1037 (números visibles y estables), que fue decisión del usuario.

## 11. Enmiendas y piezas para lima

| Id | Qué | Dónde |
| --- | --- | --- |
| **SB-L1** | Prop `appearance` (`default` · `index`); tabla de §1; formatos de `index` (expandida y drawer); avisos I1 a I3 | `sidebar.md` (sección nueva «Apariencia `index`»), `GSidebar.meta.json` vía bruno |
| **SB-L2** | Grupo plegable: campos `collapsible`, `collapsed`, `id` obligatorio; `closedGroups` + `update:closedGroups`; reglas 5 a 8; título botón + cuerpo `until-found` | `sidebar.md` «Modelo de `items`», «Estructura accesible», «Teclado» |
| **SB-L3** | La marca del actual de `index` (2 × 20, llena/hueca, `accent-text`, ≥ 3:1) y su movimiento (`--g-ease-spring`) | `sidebar.md` «Item actual» (sección `index`) |
| **SB-L4** | Enmienda de #1035: en `index`, recuento oculto a la vista con el campo vacío; `filterPlaceholder` corto recomendado; posición F1/F2 según SB-Q1 | `sidebar.md` «Filtro del índice» |
| **SB-L5** | Ranura `--g-sidebar-group-title-weight` (por defecto `var(--g-text-title-sm-weight)`, 600); el sitio la pone a 700. Sin ella el calco se queda a 100 de peso del original | `tokens.md` (ranuras de `GSidebar`, §43) |
| **SB-L6** | Enmienda de #1036: en `index`, `code` al final de la fila (`g-sidebar__code`) y el texto oculto **después** de la etiqueta; C1/C2 según SB-Q1 | `sidebar.md` «Código del item» |
| **SB-L7** | ↑ ↓ Inicio Fin recorren también los botones de grupo visibles | `sidebar.md` «Teclado» |
| **SB-L8** | `labels.groupCurrent` (recomendado) | `sidebar.md` «Textos» |
| **SB-L9** | Cajón de `index`: ancho `min(space × 80, 100vw − space × 16)`, sin marca, campo + cerrar en la primera fila, actual a la vista al abrir; velo (SB-C4) | `sidebar.md` «Drawer» |
| **SB-L10** | Cierra N-L10 de `navbar/r01`: la cabecera de `index` **es** la banda (alto `--g-app-shell-header`, línea inferior) | `sidebar.md`; `sitio-marco.md` §4 deja de ser hueco (lima) |
| **SB-L11** | Peso: la apariencia y el plegado entran en `grana.js` (no es extensión: el plegado de grupo sirve también en `default`). Estimación sin medir: ≈ 0,9 KiB gzip (CSS aparte); si no cabe en el margen de #506, la apariencia `index` puede ir con la extensión `sidebar-filter` (un sitio de documentación la carga siempre) | `api.md` «Paquete, entradas y tipos» |
| **SB-L12** | `/blocks/` usa la misma apariencia con su barra propia (`blocksSidebar`, grupos por familia, `collapsed: false`): mismo modelo, sin números. **No prototipado** | `sitio-marco.md` §4 |

## 12. Hallazgos para otros dueños

- **SB-K1 (kiwi):** corregir `design/lab/sitio/referencia/medidas.md` §7, fila «Índice» (§4 de esta declaración). Fuera de la carpeta de esta ronda: no se toca aquí.
- **SB-B1 (bruno):** la raíz interna del drawer (`.g-sidebar__drawer > .g-sidebar`) no recibe la `class` de la aplicación ni ninguna clase de apariencia; con `appearance` debe llevar `g-sidebar--appearance-index` (el prototipo la alcanza con `.g-sidebar__drawer > .g-sidebar`).
- **SB-B2 (bruno):** con `breakpoints.rail === breakpoints.expanded` (sin riel posible) se sigue pintando el botón de contraer (`g-sidebar__toggle`, «Contraer»). En `index` no se pinta; en `default` valorar lo mismo.
- **SB-B3 (bruno):** el título plegable y el cuerpo nuevos salen del render, no de un `MutationObserver` como en el prototipo; el cuerpo con `useCollapse` (sin medir alturas), `hidden="until-found"` en `onSettle` y `beforematch`.
- **SB-B4 (bruno + coco):** `hidden` en un elemento con `display` de autor no oculta: va en el envoltorio `g-sidebar__group-body`, no en `.g-sidebar__list` (`display: flex`).
- **SB-B5 (bruno):** el actual a la vista al abrir el drawer (en `index`; en `default`, valorar).
- **SB-B6 (bruno, existente):** en **Firefox** la región `.g-sidebar__nav` es parada de Tab (región desplazable sin `tabindex="-1"`, #570): un Tab de más entre el filtro y el primer enlace. Medido en el `GSidebar` actual, no lo introduce `index`.
- **SB-C1 (coco):** la marca 2 × 20 (§4) y su versión hueca; `forced-colors`.
- **SB-C2 (coco):** el hover de `index` a `text` sin pisar el actual (`:not([aria-current])`); la luz ensanchada `space-2` por lado con radio `sm`.
- **SB-C3 (coco):** ancho del cajón en `index` (§7.14).
- **SB-C4 (coco + usuario vía lima):** velo del cajón 0,32 frente al 0,6 del original en claro.
- **SB-C5 (coco):** `.g-sidebar__filter-icon` vacío (sin slot `search-icon`) deja su hueco y la separación: el texto de ejemplo empieza 16 px más adentro. En `index` el sitio pasa la lupa (`search-icon`); sin ella, el hueco no debería ocupar.
- **SB-C6 (coco):** la flecha del grupo: `chevron-right` 18 px girada 90° abierta (calco de VitePress, que la pintaba recortada: defecto 5 de la referencia), en `text-muted` (6,9:1 claro, 9,59:1 oscuro), centrada a 9 px del borde del contenido (−7 de margen sobre su caja de 32). `chevron-right` ya está en la lista de la librería.

## 13. Tabla de paridad · índice del sitio anterior → `GSidebar appearance="index"`

Δ en px medidos por `verificar.mjs` (Chromium, misma página y ancho, coordenadas relativas al borde del índice); detalle en `paridad.json`. Colores comparados con el valor resuelto.

| # | Pieza del original | 1280 / 1024 (claro y oscuro) | 768 / 375, cajón (claro y oscuro) | Qué lo hace |
| --- | --- | --- | --- | --- |
| 1 | Columna 272 × visor, fondo `surface-sunken`, sin borde | Δ 0 (x, y, w, h); color igual | 320 / **311**: Δ 0 con SB-C3 | `GAppShell` + `--g-sidebar-width` del sitio; `index` sin borde |
| 2 | Banda de la marca 64 con línea 1 px de 32 a 240 | línea a y 63 (medido) | — (el cajón del original no tenía marca) | `index` (SB-L10) |
| 3 | Primer grupo (relleno 10/24) | Δ 0 (32, 64, 208 × 354) | **Δ y +32** (fila del filtro y cerrar) | `index` |
| 4 | Título de grupo 14/24, 700, `text` | Δ 0 (32, 74, 208 × 32); 700 con SB-L5 | Δ y +32 | `index` + SB-L5 |
| 5 | Separador 1 px `border` entre grupos | medido (1 px, `border`) | igual | `index` |
| 6 | Flecha del grupo plegable | caja 18 × 18 centrada en x 231 (Δ 0 con la del original) | igual | `index` (SB-C6) |
| 7 | Enlace 14/24, 500, `text-muted`, fila 32 | Δ 0 (32, 106, 208 × 32); color igual | Δ y +32 | `index` |
| 8 | Actual en `accent-text` | Δ 0 (32, 1331, 208 × 32); color igual | Δ y +32 | `index` |
| 9 | Indicador 2 × 20 a x 15 (**transparente** en el original) | Δ 0 en caja; **pintado** en `accent-text` | Δ y +32 | SB-L3 (estándar, no elegible) |
| 10 | Hover = color del actual | **Cambia**: `text` + la luz | — | I1 (corrige el defecto 6) |
| 11 | Velo del cajón `rgba(0,0,0,.6)` | — | claro **0,32**, oscuro 0,6 | SB-C4 |
| 12 | Grupos plegables (`collapsed: false`) | botón real, Intro/Espacio, `until-found` | igual, estado compartido | SB-L2 |
| 13 | (no existía) filtro `/` | F1: Δ 0 en la lista | campo en la primera fila | #1035 + SB-L4 |
| 14 | (no existía) números 01–78 | C1: al final de la fila, etiqueta Δ 0 | igual | #1036 + SB-L6 |

**Paridad: 12 de 14 piezas con Δ 0 en la columna (1280 y 1024, claro y oscuro).** Las diferencias son tres y todas explicadas: el indicador pintado (accesibilidad), el hover (corrige un defecto medido) y, en el cajón, la fila del filtro (+32) y el velo de claro.

## 14. Verificación

`node design/lab/sidebar/r03/verificar.mjs` (puerto 4239): **A** estructura, paridad y contraste en 4 anchos × claro/oscuro (consola limpia, sin desplazamiento horizontal, `<nav>` con nombre, 10 grupos y 87 enlaces, un solo `aria-current`, «Guía» no es botón y los 9 grupos de componentes sí con `aria-expanded`/`aria-controls`, listas con nombre, sin iconos, tipografía y colores, número dentro de la fila, flecha en su columna, línea de la banda, marca, F1 sin pisar la marca, cajón de 320/311 con velo y filtro; contraste ≥ 4,5:1 de enlace, actual y número, ≥ 3:1 de marca y flecha); **B** comportamiento a 1280 (plegar/desplegar con clic, Intro y Espacio; relleno 10; marca hueca en el título; la ruta abre el grupo del nuevo actual; la marca viaja; la luz sin mover el foco; `/` enfoca y el campo crece a 208; el filtro abre y devuelve el grupo; «24»; orden de Tab; foco visible; `until-found` + `beforematch`); **B9** movimiento reducido; **C** cajón a 768 y 375 (modal, foco dentro, Esc y devolución, estado compartido, actual a la vista); **D** variantes F2 y C2 en claro y oscuro. **Resultado: 743/743** (Chromium 248/248, Firefox 248/248, WebKit 247/247: en WebKit no se exige que un clic enfoque el botón, convención de macOS). Hallazgo informativo, no contado: SB-B6 en Firefox. Los fallos de red de Google Fonts (`net::ERR_`) no cuentan como error de consola. Paridad: 56 mediciones, Δ 0 en todas las de 1280 y 1024; en el cajón, solo Δ y +32 (la fila del filtro).

**No verificado:** lector de pantalla real (anuncio del botón de grupo, `groupCurrent`, el número después de la etiqueta), búsqueda real de la página con Ctrl+F (se prueba `beforematch` sintético; `until-found` solo existe en Chromium y Firefox recientes), táctil real (filas de 44 con `pointer: coarse` no medidas en un dispositivo), `forced-colors` real, RTL, ↑ ↓ sobre los botones de grupo (SB-L7, no prototipado), la barra `/blocks/` (SB-L12), rendimiento de la marca con 500 entradas.
