# Entrega de coco · GCardGroup.css

**Archivo:** `packages/vue/src/components/GCardGroup/GCardGroup.css`. **`defaults.css` sin cambios:** ningún token nuevo (kiwi L10, `card-group.md` «Tokens consumidos»).
**Contrato:** `design/contracts/card-group.md` (DECISIONS.md #603 a #611; forma A · Lengüeta, #611). **Estructura:** `design/lab/card-group/r01/` (kiwi).
**Estado:** listo para bruno (`GCardGroup.vue`, registro en `components.css` después de `GCard.css` y `GTable.css`) y después para la auditoría (paso 5) sobre el componente real.
**Banco:** `design/lab/card-group/estilo-banco.html` (marcado exacto del contrato, `GCard`, `GMetric` y `GTable` reales de `dist/`, el CSS cargado dentro de `grana.components`). Parámetros `?dark=1`, `?dir=rtl`, `?theme=<generated>`, `?seed=1`, `?slow=1`.
**Verificación:** `GRANA_PW_PORT=4224 node design/lab/card-group/estilo-verificar.mjs` (Chromium, Firefox y WebKit) → **140/140** (Chromium 58, Firefox 41, WebKit 41; el único fallo de la pasada era el aviso de «bounce tracker» de Firefox sobre 127.0.0.1, ajeno al banco y ya filtrado). Las comprobaciones de transición corren con `?slow=1` (tiempos × 5) para no depender de la carga de la máquina.

## Personalidad (lo que la hace distinta)

La tarjeta que filtra no «se ilumina»: **se abre hacia lo que filtra**.

| Pieza | Qué hace el CSS | Por qué |
| --- | --- | --- |
| **Lengüeta en reposo** | Esquinas inferiores rectas (tarjeta, velo, anillos y estirado) y una ranura de `space × 2` hasta el marco del panel; las lengüetas nacen a `space × 3` del borde del marco | Antes de pulsar ya dicen «soy la cabeza de esa tabla» |
| **El borde se abre** | El puente ocupa la ranura y sube `2 × border-width` sobre la tarjeta: tapa su borde inferior doble y el borde superior del marco bajo ella, con el mismo relleno que la pulsada (tinte sobre superficie) y sus dos lados en la marca con el grosor del borde doble | Los lados de la tarjeta **bajan** hasta el marco, que toma la misma marca: tarjeta → marco → chip → recuento, sin buscar |
| **Crece, viaja, se recoge** | Aparece con `scale` de bloque desde arriba (`--g-duration-slow`); al cambiar, el mismo puente viaja con `translate` e `inline-size` (`--g-duration-press`); al soltar se recoge (`--g-duration-fast`). Todo `--g-ease-out`, sin muelle | El recorrido de la marca de `GTabs` sin su curva (#611, #299) |
| **El marco cambia de tinta** | `border-strong` → `primary-text` con `--g-duration-fast` | El estado de la vista entera, no solo de la tarjeta |

Lo que **no** hace (a propósito): no anima el primer posicionamiento (`is-ready`), ni el cambio de tamaño o el desplazamiento de la tira; ni keyframes ni muelle.

## Medidas (de tokens; constantes de diseño como alias `--_*`)

| Alias | Valor | Uso |
| --- | --- | --- |
| `--_slot` | `space × 2` | Ranura tarjeta → cara interior del marco, separación entre lengüetas |
| `--_edge` | `2 × border-width` (`3 ×` con `prefers-contrast: more`, como el anillo de `GCard`) | Borde del marco, lados del puente, solape del puente sobre la tarjeta |
| `--_cell-min` | `space × 34` | Mínimo de la rejilla sin panel |
| `--_tab-min` | `space × 44` | Mínimo de una lengüeta (por debajo, la fila se desplaza) |
| `--_inset` | `space × 3` | Sangría de las lengüetas y relleno del panel |

- **Rejilla sin panel:** `auto-fit` con `minmax(min(100%, space × 34), 1fr)`, separación `space × 3`. Medido: 5 por fila a 1200px (4 + «Total»), **2 columnas a 375px**. La seleccionada conserva la forma de `GCard`.
- **Tira con panel:** una fila (`grid-auto-flow: column`, columnas `minmax(space × 44, 1fr)`), `overflow-x: auto`, `scroll-snap` de proximidad, **sin barra visible** (como la fila de `GTabs`: una barra clásica se pondría entre la ranura y el marco y rompería la unión). La tira lleva `padding-block-start: space × 1` para no recortar la sombra de una tarjeta `raised` al pasar.
- **Un solo marco (decisión de coco):** el marco es el del panel (`2 × border-width`, `radius-lg`, superficie, relleno `space × 3`). `GTable` no tiene marco exterior propio (sin borde ni sombra en la raíz), así que no se le quita nada. Lo único que se doblaba era la línea de la última fila en `appearance="lines"` cuando la tabla es lo último del panel **sin paginación**: queda transparente. Con paginación (`pageSize`), esa línea separa las filas del pie y se queda. El selector es de clases de Grana conocidas (`.g-table…`), no de un hijo arbitrario de la aplicación (#383 no aplica). **No** se aplana un `GSurface`/`GCard` que la aplicación ponga alrededor de la tabla: el contrato dice que en el panel va la región filtrada y nada más (para el README).

## Contraste (≥ 3:1 frente a lo adyacente)

La marca (`primary-text`) dibuja el borde de la pulsada, los lados del puente y el marco filtrado; lo adyacente es el fondo de la página (fuera), la superficie del panel (dentro) y el tinte de la pulsada (`card-selected` sobre superficie, dentro de la tarjeta y del puente). Medido en Chromium:

| Tema | fondo | superficie | tinte |
| --- | --- | --- | --- |
| Por defecto, claro | 16,48 | 16,48 | 14,99 |
| Por defecto, oscuro | 16,46 | 15,22 | 12,93 |
| amazon claro / oscuro | 13,57 / 6,92 | 13,57 / 6,40 | 12,34 / 5,44 |
| stripe claro / oscuro | 4,70 / 4,90 | 4,70 / 4,53 | 4,27 / **3,85** |
| spotify oscuro | 9,60 | 8,88 | 7,55 |
| caracol-purpura claro / oscuro | 10,57 / 4,93 | 10,57 / 4,57 | 9,61 / **3,89** |
| linear oscuro | 5,04 | 4,66 | 3,96 |
| notion claro | 12,60 | 12,60 | 11,45 |

Mínimo **3,85:1** (stripe oscuro, marca frente al tinte). El marco **en reposo** (`border-strong`, 1,45:1) no es un estado: es un contenedor decorativo, como el borde de `GSurface`; el estado lo da la marca ≥ 3:1 **y** la forma (el borde que se abre).

## Accesibilidad

- **Foco:** el anillo de `GCard` (outline `focus` hacia dentro, con halo), distinto del borde de la marca; el grupo no añade otro. La tira (`tabindex="-1"`, #570) no pinta anillo.
- **Táctil:** el blanco es la tarjeta entera (estirado de `GCard`), ≥ 44px en los dos ejes.
- **RTL:** todo lógico; el puente se coloca con `translate: calc(--_dir × --_bridge-x)` desde `inset-inline-start: 0` (x desde el borde derecho en RTL, convención de `GTabs`). Medido Δ0.
- **`prefers-reduced-motion: reduce`:** el puente solo se funde (`opacity`, `--g-duration-fast`) al aparecer y al retirarse, y salta de sitio al cambiar; la tira sin desplazamiento suave.
- **`forced-colors`:** marco en `CanvasText`, filtrado en `Highlight`; puente con `Canvas` y lados `Highlight`.
- **`prefers-contrast: more`:** `--_edge` sube a `3 × border-width` (el anillo de la seleccionada de `GCard` ya sube a 2×, así que el borde total es 3×) y el marco en reposo pasa a `border-control`.

## Para bruno

- Clases y datos del contrato, más **`is-leaving`** en un puente que se retira: consérvalo en el DOM durante `--g-duration-fast` y quítalo después (como `g-breadcrumbs__item.is-leaving`). Sin él, el puente desaparece sin recogerse (correcto, sin movimiento). Si vuelve a pulsarse la misma tarjeta antes de terminar, cancela la retirada y reutiliza el nodo.
- `--_bridge-x` en RTL: `strip.clientWidth − card.offsetLeft − card.offsetWidth` dio Δ0 en el banco (con la tira desplazada también); en LTR, `card.offsetLeft`.
- Registro en `components.css` **después** de `GCard.css` y `GTable.css`.

## Para lima

- Añadir `is-leaving` (puente) a «Clases y datos» de `card-group.md`.
- Sin barra de desplazamiento visible en la tira con panel: si una integración real pide la pista de «hay más», la vía es la de `GTabs` (`is-scrollable-start`/`-end` con desvanecido en los bordes), que hoy no está en el contrato.
