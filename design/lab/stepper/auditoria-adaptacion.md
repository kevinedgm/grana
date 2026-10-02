# Auditoría de adaptación de coco · GStepper

**Motivo:** el usuario dice que GStepper «no se adapta bien». En el playground (`/playground/#sec-stepper`, 5 pasos, unos 720px) se veía: títulos recortados a «P.», «Revi…» o «Confir…» con la descripción completa debajo y más ancha que su título; en `number`, el título del paso actual desaparecía; conectores como guiones o pegados al texto; en `dot`, un «(» suelto en el tercer paso.

**Componente:** `packages/vue/src/components/GStepper/` real (`dist/` reconstruido con `npm run build`), contrato `design/contracts/stepper.md`, decisiones #97 y #98.

**Método:** página de medición propia, [`adaptacion.html`](adaptacion.html), que monta el GStepper real en contenedores de **1200, 960, 720, 600, 480, 360 y 320px**, con un recorrido de Playwright en [`adaptacion.mjs`](adaptacion.mjs) para **Chromium, Firefox y WebKit**:

- `set=matrix`: 3, 5 y 7 pasos × títulos cortos y largos × con y sin descripción × los cinco `indicator` (420 steppers por ejecución). Claro con el tema por defecto en LTR, y oscuro con **Spotify** (tema generado por el CLI) en RTL.
- `set=props`: 5 pasos en cada ancho con `size` `sm` y `lg`, `density` `compact` y `comfortable`, `navigation` `free` y `back`, el actual primero, en medio o último, marcas (`error`, `warning`, `disabled`, `optional`) en `number`, `dot`, `line` y `segment`, título largo del actual, vertical (cortos y largos con marcas), `responsive="never"` y `responsive="compact"` (119 por ejecución). Claro por defecto (LTR), oscuro por defecto (RTL) y **lustre** (generado).
- Por stepper se mide el tramo (clase de la raíz) y unas **invariantes** que deben cumplirse en cualquier tramo: nada sale del contenedor; el título del paso actual no se recorta ni desaparece; no hay título recortado con su descripción visible (jerarquía invertida); no hay descripción más ancha que un título recortado; ningún título se queda en un muñón (recortado por debajo de `space × 12`); ningún fragmento de texto de menos de `space × 3` (el «(»); «opcional» no se recorta; el conector visible mide al menos `space × 6`; en compacto, el nombre del actual no se recorta y existe el botón. Además se registra la consola.

Uso: `python3 -m http.server 4191` en la raíz y `node design/lab/stepper/adaptacion.mjs --label <nombre> --shots`. Informes y capturas en `design/lab/playground-shots/stepper-adaptacion/` (directorio ignorado: 7 MB): `antes.txt`/`.json` y `antes/<navegador>/*.png`, `coco.*` tras el CSS, `final.*` tras el `.vue`.

## Comportamiento esperado por tramo

El contrato (#98) fija tres tramos con umbrales `n × space × 32` y `n × space × 28`, pero **no dice qué pasa con el texto dentro de cada tramo** ni de qué depende que quepa. Criterio de estándar (Carbon, Atlassian, Material: el título del paso actual nunca se pierde; la descripción es lo primero que cede; mejor menos texto completo que mucho texto mutilado), que **se anota para lima**:

| Tramo | Cuándo | Qué se ve |
| --- | --- | --- |
| **Completo** | Caben los anchos naturales de todos los pasos con título y descripción, más el conector mínimo | Títulos y descripciones enteros; el sobrante se reparte por igual entre los conectores |
| **Condensado** (`--condensed`) | No caben con descripción, sí sin ella | Títulos enteros, sin descripciones |
| **Solo el actual** (`--current-only`, nuevo) | No caben todos los títulos, sí el del actual con los demás indicadores y conectores mínimos | Indicador y conector en todos; título solo en el actual. Los demás títulos siguen en el árbol de accesibilidad (patrón de texto oculto), así cada paso conserva su nombre |
| **Compacto** (`--is-compact`) | Ni eso cabe | «Paso N de M», nombre del actual, barra y «Ver todos los pasos» |

- Los umbrales deben salir de los **anchos naturales medidos** (dependen del texto, la fuente, `size`, `density` e `indicator`), no de `n × space × k`: con `k` fijo, 5 títulos cortos con descripción a 720px quedan en «completo» aunque no quepan (el caso del playground) y 3 títulos largos a 960px igual.
- Invariantes en cualquier tramo: el título del actual no se recorta; nunca hay descripción visible junto a un título recortado; conector visible ≥ `space × 6`; nada sale del contenedor.
- `segment` y `line` reparten el ancho por igual (un tramo por paso); en «solo el actual», el actual toma su ancho natural y los demás se reparten el resto.
- `responsive="never"`: siempre completo; si no cabe, el CSS cede en este orden: descripción antes que título (cada línea se recorta por su cuenta), los demás pasos antes que el actual (ceden diez veces más), y nunca por debajo de indicador + conector mínimo.
- Vertical: no cambia (los títulos y las descripciones se parten en líneas).

## Resultado: aprobado tras el CSS de coco y el `.vue` de bruno (decisión #151); 0 incidencias en `auto` en los tres navegadores

### Incidencias por ancho (Chromium, `matrix`, claro por defecto; número de incidencias, no de steppers). Primer paso: solo CSS

| Ancho | Antes | Tras el CSS de coco |
| --- | --- | --- |
| 1200 | conector corto 70 · jerarquía invertida 65 · descripción más ancha que su título 32 · título muñón 22 · actual recortado 21 | jerarquía invertida 37 · actual recortado 6 |
| 960 | conector corto 96 · jerarquía 82 · título muñón 42 · descripción más ancha 38 · actual recortado 28 · **actual oculto 6** · fragmentos sueltos 16 | jerarquía 54 · actual recortado 20 · muñón 4 |
| 720 | conector corto 51 · jerarquía 43 · descripción más ancha 20 · actual recortado 16 · muñón 16 · **actual oculto 6** · fragmento suelto 2 | jerarquía 33 · actual recortado 10 · muñón 4 |
| 600 | conector corto 45 · actual recortado 20 · jerarquía 17 · muñón 6 · descripción más ancha 6 | jerarquía 11 · actual recortado 16 · muñón 22 |
| 480 | jerarquía 21 · conector corto 17 · muñón 17 · actual recortado 13 · fragmentos 8 · descripción más ancha 6 | jerarquía 15 · actual recortado 10 |
| 360 | conector corto 12 · actual recortado 10 | actual recortado 10 · muñón 8 · fragmento 2 |
| 320 | (compacto) sin incidencias | sin incidencias |

Steppers con alguna incidencia, por ejecución: antes 133/420 (claro LTR) y 136/420 (Spotify oscuro RTL), 65 o 66/119 en `props`; tras el CSS, 83 y 85/420, y 35/119. **Idéntico en Chromium, Firefox y WebKit** (±1 caso). Consola limpia en los tres. Lo que queda tras el CSS es de tramo: el `.vue` declara «completo» o «condensado» con un texto que no cabe (los umbrales de `k` fijo), y eso solo lo arregla medir (hallazgos 6 y 7).

Capturas antes/después de los casos del playground (`720-5-short-d-*`) y de `960-7-long-d-number`, `720-3-long-d-number`, `600`, `480` y `360` en `antes/`, `coco/` y `final/` por navegador.

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | **Alta** | coco (corregido) | **Jerarquía invertida.** `.g-stepper__text` era una rejilla `minmax(0, max-content) max-content` con la descripción en `1 / -1`; al estrecharse, la aportación de la descripción (que abarca dos columnas) inflaba la **segunda** columna (la de «opcional», `max-content`, que no cede), y la etiqueta, en la primera, se quedaba con lo que sobraba: «P.» con «Elige tu plan» entero debajo. Ahora el texto es **flujo de bloque**: etiqueta `inline-block` con `max-inline-size: 100%` y elipsis, descripción en bloque con elipsis. El ancho natural es el mayor de las dos líneas y, al estrecharse, ambas se recortan en el mismo ancho: la descripción nunca queda más ancha que un título recortado (0 casos en los tres navegadores, antes 32 a 38 por ancho). «Opcional» pasa a la línea siguiente si no cabe junto a la etiqueta |
| 2 | **Alta** | coco (corregido) | **El «(» suelto en `dot`** era la «C» de «Confirmación» con 6px de columna: el mismo reparto del hallazgo 1. Desaparece con él (fragmentos sueltos 0 en `auto` con títulos cortos) |
| 3 | **Alta** | coco (corregido) + bruno | **Título del actual oculto o recortado.** Con `flex: 1 1 0` todos los pasos medían lo mismo y el actual (en negrita, más ancho) cedía como los demás; con la rejilla podía quedarse a 0px. Ahora cada paso parte de su ancho natural (`flex: 1 1 auto`), el actual cede diez veces menos (los demás `flex-shrink: 10`, el actual 1; ver hallazgo 9) y el último no crece (`flex-grow: 0`), así la fila llega al borde y el sobrante va a los conectores. «Actual oculto» pasa de 6 a 0. Que **nunca** se recorte depende del tramo «solo el actual» (hallazgo 7, bruno) |
| 4 | Media | coco (corregido) | **Conectores diminutos.** `min-inline-size: space × 4` (16px) y, con `flex: 1 1 0` y títulos largos, el conector quedaba en su mínimo junto al texto. Nuevo alias `--_conn: space × 6` (24px con `space` 4, 30px con `space` 5) como mínimo; el paso no baja de indicador + conector + dos separaciones, y el último, del indicador. «Conector corto» pasa de 12 a 96 por ancho a **0** en `auto` |
| 5 | Baja | coco (corregido) | En vertical (y en la lista desplegada del compacto), el subrayado ondulado de error y el discontinuo de advertencia pisaban la descripción: `padding-block-end: space-1` en la etiqueta con marca, solo en vertical (en horizontal desalinearía las descripciones) |
| 6 | **Alta** | **bruno** (resuelto en 3977b82) | **Umbrales de `k` fijo.** `n × space × 32` y `× 28` no conocen el texto: con 5 títulos cortos y descripciones a 720px el `.vue` declara «completo» aunque la fila natural mida 758px; con 7 largos, ni a 1200px cabe y sigue «completo». Medir los anchos naturales con el propio componente: el CSS ofrece `g-stepper--measure` (lista a `max-content`, pasos `flex: none`; `segment` y `line` a columnas iguales), combinable con `--condensed` y `--current-only`, para leer en una sola pasada síncrona el ancho que necesita cada tramo y elegir el primero que quepa. Ojo: las reglas de variante llevan `:not(.g-stepper--is-compact)`, así que durante la lectura hay que quitar `--is-compact` |
| 7 | **Alta** | **bruno** + lima (resuelto en 3977b82, #151) | **Falta el tramo «solo el actual».** Entre «condensado» y «compacto» no hay término medio: o todos los títulos o ninguno. El CSS ya trae `g-stepper--current-only` (descripciones fuera; el texto de los demás pasos con el patrón de texto oculto, de modo que su botón conserva el nombre; en `segment` y `line`, el actual a su ancho natural). Falta que el `.vue` emita la clase y que el contrato la recoja |
| 8 | Media | **bruno** + lima (resuelto en 3977b82) | Para medir en compacto la lista completa tiene que existir: el CSS ya la oculta en compacto (`.g-stepper--is-compact > .g-stepper__list { display: none }`). Renderizarla siempre (oculta en compacto, fuera del árbol de accesibilidad) cambia el marcado del contrato («solo cuando no es compacto»). Al hacerlo, el foco tras activar un paso desde la lista desplegada debe buscar dentro de esa lista, no en la primera coincidencia |
| 9 | Media | coco (corregido en la re-medición) | Con `responsive="never"` y cinco títulos largos a 360 y 320px la fila desbordaba 37 y 73px: con `flex-shrink: 0.1` en el actual, cuando los demás llegan a su mínimo la suma de factores sin congelar es menor que 1 y el algoritmo de flex solo reparte esa fracción del espacio negativo. Factores enteros: los pasos `flex: 1 10 auto`, el actual `flex-shrink: 1`. Desborde 0 |
| 10 | Baja | coco (corregido en la re-medición) | En `segment` completo, las descripciones de pasos vecinos se tocaban (los tramos van a 2px): el texto deja `padding-inline-end: var(--_gap)` (entra en la medición, así que el tramo lo tiene en cuenta) |
| 11 | Baja | bruno (resuelto en 3977b82) | En WebKit, aplicar el cambio de tramo dentro del callback del `ResizeObserver` cambiaba la altura de la raíz observada y aparecía «ResizeObserver loop completed with undelivered notifications» en consola. El `.vue` aplica ancho y medición en el cuadro siguiente; consola limpia |

## Re-medición final (CSS de coco + `.vue` de bruno)

Mismas cinco ejecuciones × tres navegadores (`final.txt`, capturas en `final/`):

| Ejecución | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| `matrix` claro, defecto, LTR (420) | **0** incidencias | **0** | **0** |
| `matrix` oscuro, Spotify, RTL (420) | **0** | **0** | **0** |
| `props` claro / oscuro RTL / lustre (119 cada una) | 7 | 7 | 7 |
| Consola | limpia | limpia | limpia |

- Las 7 restantes por ejecución son el caso `never` (cinco títulos largos con descripción, uno por ancho): sin desborde, títulos y descripciones recortados en el mismo ancho, como pide `never` («siempre completo»). Las verticales no se cuentan: allí el conector mide el alto entre pasos (20px), no el mínimo horizontal.
- Reparto de tramos con títulos cortos y largos (Chromium, claro): 1200px 46 completo / 14 solo el actual; 720px 25 / 5 condensado / 30 solo el actual; 480px 12 / 2 / 32 / 14 compacto; 320px 5 / 5 / 20 / 30 compacto.
- Cambio de ancho en vivo (1200 → 960 → 720 → 600 → 480 → 360 → 320 → 1200 → 500 sobre los 60 casos): 0 incidencias en cada paso y consola limpia en los tres navegadores.
- Playground real (`/playground/#sec-stepper`, 630px de contenedor): `number`, `dot`, `line` e `icon` en «sin descripciones» con los cinco títulos enteros; `segment` completo; 320px compacto; vertical sin cambios. Consola limpia en los tres navegadores.
- Pruebas: `npx vitest run` 1178 en verde (GStepper 43); `npm run build` y compuertas; `npm test` de `design/lab/theme-playground` (143 en verde, 1 omitida).

## Notas para lima (aplicadas en 3977b82: contrato y decisión #151)

- Sustituir en «Adaptación» los umbrales `n × space × 32` / `× 28` por **anchos naturales medidos** y añadir el tramo **«solo el actual»** (`g-stepper--current-only`) con las invariantes de arriba; la clase de medición `g-stepper--measure` es interna (no la usa el consumidor). Sin tokens nuevos: `--_conn` es un alias local (`space × 6`).
- El texto de cada paso deja de ser una rejilla: el contrato no la fijaba, solo el orden etiqueta → opcional → descripción, que se mantiene.

## Qué no se verificó aquí

- Lector de pantalla real (la estructura accesible no cambia: el texto oculto es el mismo patrón que `__status`).
- `forced-colors` y movimiento reducido: sin cambios en este paso (no se tocaron sus reglas).
- Contraste: sin cambios de color; vale la auditoría de `auditoria.md`.
