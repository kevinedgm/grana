# Brief — selector de filas por página (`GPagination` + `GTable`), r02: base funcional y tres conceptos

> kiwi, 2026-10-13. Origen: integración real de Grana en NisaNabani (página de Notion «Hallazgos de integración real», **hallazgo 6, P1**): las tablas de inventario ofrecen 10/25/50/100 filas con paginación del servidor, y `GPagination` tiene `pageSize` pero no el control para elegirlo. La r01 de la paginación vive en `design/lab/table/r01/` (decisión 16); esta es su primera ronda propia.

## Para qué

Que quien revisa un inventario decida **cuánto ve de una vez** (10 lotes para revisar con calma, 100 para barrer una lista) sin perder **dónde estaba**. Lo usan personas de laboratorio y almacén en escritorio (puntero y Tab), en tableta y en móvil (dedo, 360px), y con lector de pantalla. Los datos suelen venir del servidor (`total`, `loading`): el componente no pide nada, emite la intención.

## El problema de lo que hay

- **La premisa común:** «Filas por página: [10 ▾]» en una esquina del pie. Funciona, pero:
  - **Pierde el sitio.** Los frameworks, al cambiar el tamaño, vuelven a la página 1 o conservan el **número** de página (página 3 de 10 en 10 → página 3 de 50 en 50: de la fila 21 a la fila 101). En ninguno de los dos casos la persona sigue viendo lo que miraba.
  - **Está lejos.** Con 100 filas el pie queda a 100 filas de distancia; quien quiere volver a 25 tiene que bajar hasta el final.
  - **No dice qué va a pasar.** Elegir «50» es un salto a ciegas: ¿en qué página caigo?, ¿veré todo?
  - **En modo servidor, el alto salta dos veces:** la tabla pinta el esqueleto con las filas que había (#540 punto 2) y luego crece de golpe al llegar las 50.
  - **Habla de más:** el rango del pie es `role="status"` y la tabla tiene su región viva; con carga, un cambio de tamaño se oye tres veces.

## Qué es esta ronda

1. **Base funcional** (forma convencional, a propósito): `pageSizes` + `v-model:pageSize` en `GPagination` y en `GTable`; **la fila ancla** (la primera fila **a la vista**, no la primera de la página) decide la página nueva y **no se mueve de la pantalla**; el foco se queda en el control; un solo anuncio; esqueleto con las filas que **van** a llegar; móvil y convivencia con `GFilterBar`.
2. **Tres conceptos** que cuestionan la premisa: **A · El rango se abre** (el tamaño vive en el rango que cambia y cada opción enseña dónde vas a caer), **B · Pie que acompaña** (opciones a la vista; el pie se acopla al borde de la pantalla cuando la tabla es larga, y la fila que mirabas no se mueve y se señala), **C · Tirar del borde** (el tamaño es el largo de la tabla: se tira del borde inferior, con muescas).
3. **Comparativa y una pregunta de elección.** kiwi no elige.

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GPagination` | `nav`, rango, compacta medida, foco a la página actual | **Se extiende** (no hay componente nuevo): el selector es parte de la paginación y funciona solo, sin tabla |
| `GTable` | `page`/`pageSize`/`total`, carga #540, foco por `rowKey` #534, región viva #265 | Expone `pageSizes` + `update:pageSize` y **es dueña del ancla** (sabe qué filas se ven); `GPagination` sola ancla a la primera fila de la página |
| `GSelect` | Lista de opciones con valor | **No se compone**: arrastraría su peso al principal (#506, margen agotado) y un desplegable para 3–5 números es más de lo que pide. La base usa un `<select>` nativo, como la barra de tarjetas de `GTable` |
| `GMenu` | Menú con `type: 'radio'` y grupo (`menu.md`) | **A lo usa** (ya está en el principal): elegir un tamaño es una opción exclusiva que cambia la vista, el caso de `menuitemradio` |
| `GRadioGroup` `segmented` | Fila de opciones exclusivas con radios nativos | **B toma su forma y su semántica** (radios nativos, `data-g-key-focus` #450); no se compone el componente entero (lleva `GFormRow`, etiqueta y error de formulario) |
| `GSlider` | Valor discreto, `input range` nativo | **C no lo compone** (vive en `@grana/vue/slider`, 11,3 KB): el agarre de C es un `slider` APG propio de cuatro valores. Si se elige C, valorar con lima |
| `GFilterBar` | Barra arriba, hoja en móvil por debajo de `space × 130`, cuenta = `total` | Convive: filtrar vuelve a la página 1 y **conserva** el tamaño; el selector va **en el pie**, nunca en la barra de filtros |
| `GLoadRegion` / motor de carga | Retraso 200 ms, mínimo 400 ms, molde | La tabla sigue con su motor; se precisa cuántas filas tiene el esqueleto tras un cambio de tamaño (L4) |
| Fila activable de `GTable` (ronda `design/lab/table/r03/`, en paralelo) | Foco dentro del `<tbody>` | El selector **no** depende de ella; solo se exige que el ancla y la vuelta del foco por `rowKey` (#534) sigan valiendo con una fila activable (punto 14 de la declaración) |

## Entregables

- `index.html` (página única, `?c=base|A|B|C`, `?w=` ancho del marco, `?server=1`, `?h=1` altura limitada), `pager.js` (motor del prototipo: datos, ancla, carga simulada, anuncios, los tres conceptos), `pager.css` (solo `var(--g-*)` del tema por defecto, que llega de `packages/vue/dist/grana.css`, junto con el CSS real de `GTable` y `GPagination`).
- `verificar.mjs` (Playwright en Chromium, Firefox y WebKit, **puerto 4213**).
- `declaracion.md`: decisiones numeradas, «Qué lo hace distinto», comparativa, comprobaciones, hallazgos L1… para lima y la pregunta de elección.

## Ver

Desde la raíz del repo: `python3 -m http.server 4213` y abrir `/design/lab/pagination/r02/index.html`. Requiere `packages/vue/dist` (`npm run build`). Verificación: `node design/lab/pagination/r02/verificar.mjs`.
