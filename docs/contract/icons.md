# Contrato de iconos · v0.1

**Dueño:** lima · DECISIONS.md #85 a #87. **Regla única: [Lucide](https://lucide.dev) (licencia ISC) es la única fuente de iconos** en todo el repositorio: componentes, prototipos, bancos de prueba, playground, README y documentación.

## 1. Qué es un icono (y qué no)

Un **icono** es cualquier pictograma cuyo significado se lee por su forma: una marca de verificación, un chevron, una cruz, una advertencia, una flecha, unos puntos de menú, un asa, un calendario. **Solo se admite Lucide.** No se admiten:

- **Caracteres Unicode como iconos:** `✓ ✔ ✕ × ✖ ▲ ▼ ● ■ ◆ › ‹ ⚠ ⋮ ⋯ ✎ ⧉ ➜ ↗ → ←`, emojis y similares (ni en el HTML, ni en `content:` de CSS, ni en textos).
- **Pictogramas dibujados con CSS:** marcas hechas con bordes girados, `clip-path: polygon`, `box-shadow` para puntos, pseudo-elementos que forman una cruz o una flecha, barras que forman un «hamburguesa».
- **Iconos dibujados a mano o copiados de otra colección.**

No son iconos (y se siguen dibujando con CSS): rellenos, bordes, pistas y pulgares de controles (el riel de un interruptor, la pista de una barra de progreso, el círculo de un radio), sombras, contornos de foco, el esqueleto de carga y las **barras de asa de una sola pieza** (la asa de una hoja inferior y la de un evento del calendario: un borde redondeado, sin forma de pictograma).

**Ilustraciones y mascotas (DECISIONS.md #105):** tampoco son iconos. Una ilustración es un **dibujo compuesto** con partes (cuerpo, ojos, extremidades) que el componente anima por separado, y que **no tiene significado de pictograma**: no sustituye a ningún icono ni se usa como tal (no es «ayuda», «alerta» ni «cerrar»). Puede escribirse como SVG propio dentro de su componente (hoy solo `GAvatarMotion`), con colores de tokens. Si una ilustración empezara a usarse para comunicar una acción o un estado sin texto, deja de ser ilustración: se usa el icono de Lucide correspondiente.

### Formas de estado (insignias, leyendas)

Las **figuras que codifican estado o serie** (círculo, cuadrado, rombo y triángulo de `GBadge` y de la leyenda de `GDataList`, y el punto de estado) **también son Lucide** (`circle`, `square`, `diamond`, `triangle`, rellenas con `currentColor`): una sola fuente, sin excepciones.

## 2. Entrega: SVG en línea, solo los usados

- **Fuente de los datos:** el paquete `lucide-static` (devDependency de `@grana/vue`; **no** es dependencia en tiempo de ejecución). Un script (`scripts/build-icons.mjs`, de bruno) lee los SVG de la lista de la §4 y genera `src/icons/lucide.js` con **solo** esos iconos (datos de los trazos, `viewBox` 24). El archivo generado lleva el aviso de la licencia ISC y el repositorio incluye el texto de la licencia (`packages/vue/THIRD-PARTY-NOTICES.md`).
- **Componente interno `GIcon`:** `name` (obligatorio, de la lista) y `filled` (rellena con `currentColor`, para las figuras). Renderiza `<svg class="g-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">` con los trazos. Un nombre que no existe **avisa** en desarrollo y no dibuja nada. **No se registra como componente público** (los iconos de la aplicación los pone ella; ver §5).
- **Sin valores de respaldo ni literales de tema:** el color es `currentColor`; el tamaño lo fija cada componente con un alias local (`--_icon`, por defecto `1em`); el grosor es el de Lucide (2 en una caja de 24). **Sin tokens nuevos.**
- **Accesibilidad:** el icono es siempre **decorativo** (`aria-hidden="true"`); el significado lo lleva el texto o el nombre accesible del control. Con `forced-colors`, el trazo es `currentColor` y se adapta solo (mejor que un dibujo con bordes).
- **Movimiento:** los iconos pueden girar (`rotate`), revelarse (`clip-path` sobre el `svg`) o desplazarse con las mismas transiciones de hoy; con `prefers-reduced-motion` no se animan.

## 3. Reglas para quien escribe el CSS

- Un componente **no dibuja marcas con CSS**: si necesita una, el marcado lleva un `GIcon`.
- Un `content:` de CSS **no contiene** glifos pictográficos (solo texto o cadenas vacías).
- Las figuras de estado son `GIcon filled`, no `clip-path`.

## 4. Lista de iconos por componente

Nombre de Lucide entre comillas.

| Componente | Dónde | Icono |
| --- | --- | --- |
| `GBtn`, `GInput`, `GTextarea`, `GSelect`, `GSwitch` | Indicador de carga (en `GSwitch`, sobre el pulgar) | `loader-circle` (gira) |
| `GCheckbox` | Marca marcada · mixta · ✓ del chip | `check` · `minus` · `check` |
| `GCheckbox`, `GCheckboxGroup`, `GInput`, `GTextarea`, `GSelect`, `GSwitch`, `GDatePicker` | Mensaje de error (antes «⚠») | `triangle-alert` |
| `GSwitch` | Marca del pulgar: encendido · apagado | `check` · `minus` |
| `GSelect` | Flecha · limpiar · elegida · «Agregar nuevo…» | `chevron-down` · `x` · `check` · `plus` |
| `GDatePicker` | Icono del campo · mes anterior · siguiente · cierre de la hoja · punto de hoy | `calendar` · `chevron-left` · `chevron-right` · `x` · `circle` (rellena) |
| `GCalendar` | Anterior · siguiente · puntos de eventos · punto de la línea de ahora | `chevron-left` · `chevron-right` · `circle` (rellena) · `circle` (rellena) |
| `GDialog` | Cierre | `x` |
| `GSidebar` | Chevron de un padre · cierre del drawer | `chevron-right` (gira) · `x` |
| `GBadge` | Figuras: círculo · cuadrado · rombo · triángulo · punto de estado | `circle` · `square` · `diamond` · `triangle` · `circle` (rellenas) |
| `GMetric` | Tendencia: sube · baja · igual | `arrow-up` · `arrow-down` · `minus` |
| `GDataList` | Muestras de la leyenda | `circle` · `square` · `diamond` · `triangle` (rellenas) |
| `GWidget` | Botón del menú de acciones | `ellipsis-vertical` |
| `GWidgetGrid` | Asa de mover · asa de redimensionar | `grip-vertical` · `move-diagonal-2` |
| `GWidgetGallery` | Marca de la categoría elegida | `check` |
| `GStepper` | Paso hecho · con error · con advertencia · bloqueado | `check` · `circle-alert` · `triangle-alert` · `lock` |
| `GHelper` | Disparador por defecto | `circle-help` |
| `GTable` | Orden: sin orden · ascendente · descendente | `chevrons-up-down` · `arrow-up` · `arrow-down` |
| `GPagination` | Anterior · siguiente | `chevron-left` · `chevron-right` |
| `GFilterBar` | Sugerir o agregar filtro · quitar filtro | `plus` · `x` |
| `GTabs` | Cargando (gira) · requiere atención · botones de borde · botón «Más» | `loader-circle` · `circle-alert` · `chevron-left` / `chevron-right` · `chevron-down` |
| `GCard` | Casilla / alternar · radio · menú de acciones · estados `error` / `warning` / `success` / `info` · marca de «actual» · «mostrar más» | `check` · `circle` (rellena) · `ellipsis-vertical` · `circle-alert` / `triangle-alert` / `circle-check` / `info` · `chevron-right` (espejado en RTL) · `chevron-down` |
| `GMenu` | Casilla marcada · opción marcada · chevron de submenú · peligroso | `check` · `circle` (rellena) · `chevron-right` · `triangle-alert` |

`GProgress`, `GTextarea` (salvo el error), `GInput` (los iconos de los slots `prepend` y `append`), `GWidgetConfig` y el resto **no traen iconos propios**.

**Resuelto (DECISIONS.md #137):** `info` y `circle-check` están en la lista de la librería (`packages/vue/scripts/icons.json`, clave `library`) y en `design/lab/lucide-icons.js`. `image`, `map-pin` y `play` son iconos **de la aplicación** (§5): los usan los ejemplos de `GCard` (media, `lead`) y por eso viven solo en las listas del playground y del laboratorio (clave `playground` de `icons.json` y `design/lab/lucide-icons.js`), **nunca en el paquete**.

**Regla:** añadir un icono exige **añadirlo a esta tabla** y a la lista del script antes de usarlo.

## 5. Iconos de la aplicación (slots)

Los slots de icono (`icon`, `prepend`, `append`, `toggle-icon`, `search-icon`, `more-icon`…) **los pone la aplicación**: Grana sigue sin traer una colección. La documentación y los ejemplos usan **Lucide** (por ejemplo, con `lucide-vue-next`), y un icono en un slot es siempre decorativo (`aria-hidden`); el nombre accesible lo da el texto.

## 6. Prototipos, bancos, playground y documentación

- **Bancos y playground:** el marcado de cada componente es el real (con `svg` de Lucide); los iconos de ejemplo que pone «la aplicación» también son **Lucide exactos** (copiados de `lucide-static`, con su nombre en un atributo `data-lucide`), **no trazos escritos a mano**. El script genera el módulo de iconos del playground a partir de una lista propia.
- **Prototipos de kiwi (wireframes):** si muestran un icono, es Lucide. Las rondas ya cerradas se actualizan **al final** de la migración.
- **README y documentación:** los ejemplos de iconos usan nombres de Lucide.

## 7. Comprobación automática

Una prueba (bruno) recorre los `.vue`, `.css` y `.html` del repositorio y **falla** si encuentra:

- Un carácter de la lista de la §1 fuera de un texto explicativo permitido (las cadenas de ejemplo de documentación se exceptúan de forma explícita y acotada).
- En un CSS de componente, `clip-path: polygon(`, o un `content:` que no sea texto ni vacío.
- Un `GIcon` con un nombre que no está en la lista de la §4.

## 8. Límites conocidos

- Cada icono añade unos cientos de bytes al paquete (los trazos de Lucide); la lista es corta y solo se incluye lo usado.
- Las animaciones de dibujo que hoy usan `clip-path` sobre bordes (la marca de `GCheckbox`) pasan a revelar el `svg`; el aspecto cambia un poco (trazo de Lucide, más redondeado).
- **Lucide no es un sistema de iconos de marca de tema**: no cambia con `brand`; solo toma `currentColor` y el tamaño del componente.
- Verificación con lector de pantalla y con Firefox y Safari: pendiente, como en el resto.
