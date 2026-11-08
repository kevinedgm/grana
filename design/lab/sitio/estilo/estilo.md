# Estilo · marco del sitio A (coco)

Hojas: `packages/vue/src/components/GPageIndex/GPageIndex.css` (nueva), `GSidebar/GSidebar.css` (filtro y código), `GMenu/GMenu.css` (`aria-current="location"`). Sin tokens nuevos (`defaults.css` intacto). Banco `estilo-banco.html`, verificación `GRANA_PW_PORT=4232 node estilo-verificar.mjs` (1876/1876 en los tres motores; 12 temas, claro y oscuro).

## Qué les da personalidad
- **El relevo** (`GPageIndex`): la etiqueta que dice dónde estás se funde y se desplaza un paso (`space × 1`) en el sentido de la lectura; otro cambio en menos de 600 ms es instantáneo (`is-burst`), así que desplazarse deprisa no encadena animaciones. El ancho lo fija una pila de etiquetas fantasma: el disparador no se mueve nunca. Reducido = solo fundido.
- **El número es una dirección** (`GSidebar`): el código vive dentro del asiento (lleno = estás aquí), con cifras tabulares; hereda la tinta del enlace, así que los contrastes del asiento (P1) ya valen.
- **El filtro no se mueve**: caja de altura fija, recuento de línea reservada, botón de vaciar por dentro, anillo hacia afuera; en el riel, un punto en el icono marca la consulta (forma, no solo color).

## Qué espera bruno
Ver el comentario de cabecera de `GPageIndex.css` (clases, `data-dir`, `data-phase="out|in"`, `is-burst`, `is-empty`) y el de «Filtro del índice» de `GSidebar.css` (`is-empty` en `__filter-count`, `is-filtering` junto a `g-sidebar__search` en el riel; `__filter-hint` fuera del DOM con texto; `__filter-clear` solo con texto; `data-code` en `g-sidebar__icon`).
