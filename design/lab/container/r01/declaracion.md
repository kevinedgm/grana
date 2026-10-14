# Declaración — contenedor de página (`GContainer`, nombre de trabajo), r01: base funcional y conceptos A, B y C

> kiwi, 2026-10-14. Prototipo: `index.html?c=base|A|B|C` (`&w=sm|md|lg|xl|full`, `&h=start`, `&side=wide|rail|none`, `&dir=rtl`, `&guides=1`), CSS `ct.css`, montaje y asa de C en `ct.js`. Tokens reales del tema por defecto (`packages/vue/dist/grana.css`): espaciado, `GSidebar` (`--g-sidebar-width`, `-rail`), `GBtn` y `GSurface` reales por clases y la **zona de marca real** (`data-g-zone="brand"`). Iconos solo Lucide (`design/lab/lucide-icons.js`). Verificación: `node design/lab/container/r01/verificar.mjs` (puerto 4217), resultado en §«Comprobaciones». La base deriva de HTML (`main`, `section`), WCAG 2.2 (1.3.1, 1.4.4, 1.4.8, 1.4.10, 2.4.11, 2.5.8) y los contratos vigentes. **Preguntas de producto: la elección de concepto (una).**

## Anatomía (base)

```
<as> .g-container                      ← raíz: el elemento pedido (div | main | section | article); recibe $attrs (id, aria-*, data-g-zone)
│                                        container-type: inline-size  → es la CAJA que se mide (cqi), sin layout ni paint containment
└─ div.g-container__body               ← la COLUMNA: ancho y márgenes calculados en CSS con unidades de contenedor (sin JS)
   └─ [slot default]                     contenido de la aplicación y componentes (GPageHeader, GFormLayout, GAdaptiveLayout, GTable…)
```

Dos cajas y no una: la raíz mide el sitio que la aplicación le da (lo que deja la barra lateral, un panel, un diálogo); la columna se coloca dentro con `inline-size` y `margin-inline` escritos en `cqi` de la raíz. Así el contenedor **nunca mira el visor** y lo que necesita el sangrado de B (el ancho de la caja) está disponible para cualquier descendiente sin medir con JS.

## Decisiones de la base

**Qué es y qué no**

1. **Solo el eje en línea.** El contenedor decide ancho máximo, márgenes laterales y alineación. **No** pone relleno de bloque, separación entre hijos, fondo, borde, radio ni sombra: el ritmo vertical es de la distribución (Stack futura, `GFormLayout`, `GAdaptiveLayout`) y la superficie es de `GSurface`. Así el anidado no acumula relleno de bloque y no hay dos fuentes de «aire entre secciones».
2. **No distribuye.** Ni `display: grid` ni `flex` en la columna: los hijos siguen en flujo de bloque (los márgenes de la prosa de la aplicación colapsan como siempre). Una rejilla de una sola pista (el «breakout grid» habitual) se descartó por eso: convierte a cada hijo en elemento de rejilla y cambia el espaciado de la aplicación.
3. **No asume el layout global:** no sabe de barras laterales, cabeceras fijas ni bordes del visor; mide su caja. No reserva bordes (`edgeReserve`) ni se posiciona.

**Ancho**

4. **Una sola prop de ancho, `width`:** `sm` · `md` · `lg` · `xl` · `2xl` · `full`. Se elimina la contradicción de la propuesta: **`fluid` = `width="full"`** (no hay dos formas de decir lo mismo), **sin `size`** paralelo y **sin un `width` de px por prop** (ver punto 5). Valores propuestos, múltiplos de `space` como los umbrales de #130 y §13 (siguen a la densidad del tema): **160, 192, 256, 320, 384** → 640, 768, 1024, 1280, 1536 px con `space` 4. Por defecto propongo **`lg`** (aplicaciones administrativas); lima decide (L2).
5. **Ancho a medida por propiedad pública de entrada `--g-container-max`** (longitud, registrada, `inherits: false`), como `--g-form-min` (#174) y `--g-adapt-chars` (#364): sirve en SSR, sin JS, y se puede poner una vez en la hoja de la aplicación para toda una vista. Gana a `width`. No es del tema.
6. **La columna = `min(caja − 2 × margen, máximo)`.** Medido en 6 visores (320 a 1920), con y sin barra lateral, en los cinco anchos: coincide al píxel, centrada y sin desplazamiento horizontal (§«Comprobaciones», 56 casos por motor).

**Margen lateral (`gutter`)**

7. **Fluido, medido sobre su caja, sin puntos de corte:** `clamp(space-4, 4cqi, space-12)` para `md` (16 a 48 px con `space` 4), y `sm` = `clamp(space-3, 2cqi, space-6)`, `lg` = `clamp(space-6, 6cqi, space-16)`, `none` = 0. El margen **crece de forma continua** con la caja: no hay saltos a 768 o 1024 px del visor que no tengan que ver con el contenido. `@container` y `@media` no admiten `var()` (#34, #39), pero aquí no hay consultas: `clamp()` con `cqi` sí admite tokens. Las pendientes 2/4/6 `cqi` son constantes de diseño a registrar (L3).
8. **Mide su caja, no el visor.** Medido: con el mismo visor de 1440, barra ancha (264) → caja 1176, margen 47; riel (64) → caja 1376, margen 48 (tope). El contenedor se adapta al plegar la barra sin saber que existe.
9. **Área segura:** el margen es `max(margen, env(safe-area-inset-left), env(safe-area-inset-right))` (teléfono apaisado con muesca). Medido solo en navegador de escritorio (env = 0); entorno real pendiente.
10. **`gutter="auto"` (por defecto): `md` arriba; 0 anidado.** Un contenedor dentro de otro, o dentro de una superficie que ya deja aire (mapa de anfitrionas: `.g-surface`, `.g-dialog__body`; L5), **no añade margen**: el relleno no se acumula. Medido: el formulario anidado (`sm`, al inicio) empieza en el borde de la columna y el contenedor dentro de un `GSurface outlined` empieza en el relleno de la superficie (Δ 0). Un `gutter` explícito siempre gana.

**Alineación**

11. **`horizontal`: `center` (por defecto) · `start`.** Mismo nombre que `GAdaptiveLayout` (#339). `start` pone el margen al inicio lógico y deja el sobrante al final (útil junto a una barra lateral en pantallas muy anchas, o un formulario anidado alineado con su encabezado). **Sin `end`** (ningún caso real). **`centered` desaparece**: con `width="full"` no hay sobrante que repartir, así que `horizontal` no tiene efecto (aviso de desarrollo si se pide).
12. **Propiedades lógicas en todo:** RTL medido (el margen de `start` va a la derecha; el sangrado de B, a los dos bordes).

**Semántica**

13. **`as`: `div` (por defecto) · `main` · `section` · `article`.** El contenedor no añade roles ni nombres; los `aria-*` van a la raíz por `$attrs`. `main` es la receta de página (el contenedor **es** el `main`, el encabezado su primer hijo, «Saltar al contenido» cae en él). **Aviso de desarrollo** si con `as="main"` ya hay otro `main` visible, o si el contenedor `main` está dentro de otro `main` (HTML: un solo `main` sin `hidden`). Un `section` sin nombre no es punto de referencia: la receta dice pasar `aria-labelledby`.
14. **Lectura y foco:** el contenedor no cambia el orden del DOM ni es enfocable. En la receta de página, el `main` lleva `tabindex="-1"` de la aplicación (destino del enlace de salto), no del componente.

**Robustez**

15. **Contención en línea con ancho intrínseco** (#562): la raíz declara `contain-intrinsic-inline-size` = su máximo; dentro de un padre que se ajusta al contenido no mide 0.
16. **No atrapa lo fijo ni corta el pegado.** `container-type: inline-size` no aplica contención de *layout* ni de *paint* (el CSSWG la quitó): **medido en los tres motores**, un descendiente `position: fixed` queda pegado al visor (como el muelle de `GPageHeader`) y uno `sticky` se pega con normalidad. Hallazgo para `GPageHeader` (L4).
17. **Reflujo (1.4.10):** la columna lleva `overflow-wrap: break-word` (heredado): una URL larga se parte antes de desbordar (medido a 390 y a 320 × 256 ≈ 400 %). `break-word` no reduce el mínimo intrínseco (no rompe celdas de tabla, lección de `GAdaptiveLayout`). Lo que es ancho de verdad (una tabla) necesita su propio desplazable: el contenedor **no recorta** (`overflow` visible; recortar rompería el pegado y los anillos de foco). L8.
18. **Sin JS, sin medidas, sin parpadeo:** todo es CSS; el primer pintado (SSR) es el definitivo. Nada se anima: el contenedor no tiene movimiento propio (cambiar de ancho no es un suceso del usuario).
19. **Lo que no hace:** columnas, distribución en fila, posición de la barra lateral, carga, superposiciones, estilos de tarjetas, botones o formularios.

## Estados medidos (base)

Reposo · cinco anchos × seis visores × con/sin barra · `start` LTR y RTL · barra ↔ riel · 320 × 256 (zoom 400 %) · anidado · dentro de `GSurface` · banda de ancho completo **por composición** (el emparedado: `width="full" gutter="none"` + un contenedor dentro) · consola limpia.

**El coste del emparedado, medido:** el zócalo del encabezado (`sticky`) vive en el primer tramo y **deja de pegarse** al acabar ese tramo (en la base, a media página el zócalo está en `top ≈ −300`, no en 56). Es la razón de B.

---

## A · Medida

**Premisa cuestionada:** «un ancho máximo para todo». En una página de configuración o de detalle conviven la prosa (que se lee mal por encima de 75–80 caracteres por línea, WCAG 1.4.8) y lo ancho (tablas, métricas, rejillas) que quiere todo el sitio. Con una sola caja, o la prosa queda larguísima o la tabla queda encogida, y la aplicación acaba anidando contenedores.

**Estructura.** Columna ancha (`width="xl"` en el prototipo) con **`prose`**: los elementos de prosa (`p`, listas, `blockquote`, `h1`–`h6`, `figcaption`, `address`) a cualquier profundidad **se quedan en la medida de lectura** (`66ch` de la fuente de la columna, propiedad registrada calculada una vez en la columna, así todos los bloques comparten borde final), alineados al inicio; lo demás usa la columna entera. **Excluido:** la prosa de dentro de un componente de Grana (`[class^="g-"]`), de una tabla o de lo marcado con `g-wide`. Especificidad 0 (`:where`): la aplicación siempre gana. Además, **`width="reading"`**: la columna entera es la medida (artículo sin nada ancho).

**Comportamiento.** La medida está en **caracteres**, no en píxeles: con el texto al 200 % la línea sigue teniendo ~66 caracteres (la medida crece con el texto) hasta tocar la columna, y nunca la pasa (medido: sin desbordar).

### Qué lo hace distinto (A)

El contenedor de los frameworks limita la caja; este limita **la línea**. El ancho lo decide lo que se lee: la prosa de una página de configuración se lee a 66 caracteres aunque la tabla de al lado ocupe 1080 px, sin anidar nada ni elegir un tamaño por página. Es tipografía de libro aplicada a una pantalla de administración.

### Gana y arriesga

- **Gana:** legibilidad sin pensar (1.4.8); una sola caja por página; sigue al zoom de texto; CSS puro.
- **Arriesga:** **selecciona elementos de la aplicación por etiqueta** (aunque con especificidad 0, una regla así en una biblioteca sorprende: un `<p>` que la aplicación quería ancho necesita `g-wide`); la prosa alineada al inicio deja aire a la derecha en pantallas anchas (es lo buscado, pero se ve «vacío» comparado con una caja centrada); la lista de exclusión (componentes, tablas) es una heurística.

### Medidas (A)

| Medida | Resultado |
| --- | --- |
| Columna 1082 px | Párrafo 703 px ≈ 65 caracteres (66ch con la fuente servida), empieza en el borde de la columna |
| Tabla | Toda la columna |
| Prosa dentro de `GSurface` | No se limita |
| Texto al 200 % | La medida crece, acotada por la columna, sin desbordar |

**Coste:** muy bajo (una regla).

---

## B · Sangrado alineado

**Premisa cuestionada:** «el ancho completo es otro contenedor». No hay modo «ancho completo» para una banda: **un descendiente pide llegar al borde** y su contenido **sigue alineado con la columna**.

**Estructura.** La columna publica sus márgenes **ya resueltos en px** como propiedades registradas heredables, **`--g-container-inset-start`** y **`--g-container-inset-end`** (solo lectura, como `--g-surface-padding` de `GCard`, #131: es el mismo patrón a escala de página). Dos clases de entrada en el hijo (como `g-adapt-*`, #364):

- **`g-bleed`** (alineado): margen negativo hasta los bordes de la caja y el mismo valor como relleno. El fondo llega al borde; el texto, los botones y el foco siguen en la columna. Con `scroll-padding-inline` igual: **un desplazable** (tabla ancha) empieza alineado con el texto, **se desplaza hasta el borde de la caja** y termina alineado con el final de la columna.
- **`g-bleed-raw`** (en crudo): solo el margen negativo: media, mapas, una línea (`GDivider`) de borde a borde.

Sirve a cualquier profundidad mientras la caja del hijo ocupe la columna (una `section`, un `div`): los márgenes son px heredados. Dentro de una superficie con relleno no tiene sentido (aviso, L7).

**Comportamiento.** Todo CSS. El borde es **el de la caja del contenedor, no el del visor**: nunca se mete bajo la barra lateral y no crea desplazamiento horizontal (el `100vw` habitual incluye la barra de desplazamiento y la lateral). Un solo contenedor por página: el encabezado pegado dura toda la página.

### Qué lo hace distinto (B)

En los frameworks, una banda de borde a borde **parte la página** en tramos, o se escapa con `100vw` bajo la barra lateral. Aquí la banda **sabe dónde está la columna**: el fondo toca el borde de la caja, el contenido se queda alineado con el texto de arriba y abajo, y una tabla ancha en un teléfono **arranca alineada pero se desliza desde el borde de la pantalla**, donde el pulgar la empuja. La página es una sola pieza y el lector de pantalla recorre un solo `main` con un solo encabezado.

### Gana y arriesga

- **Gana:** resuelve el ancho completo sin anidar; la zona de marca del encabezado (#620, #626) de borde a borde con el `h1` alineado; tablas desplazables de borde a borde con la primera columna alineada; el pegado de `GPageHeader` dura toda la página; CSS puro, sin JS; precedente directo en `GCard`.
- **Arriesga:** dos propiedades públicas nuevas de solo lectura (y su `@property`); `g-bleed` pone `padding-inline`: si la aplicación da relleno propio a la banda (sin capa), el suyo gana y debe sumar el publicado (receta); **`GPageHeader` tiene relleno lateral propio** (`space × 6`) que se suma al margen (L4); `GTable` no sangra su desplazable interno sin adoptarlo (L10).

### Medidas (B)

| Medida | Resultado (1440 con barra · 1440 con riel · 390) |
| --- | --- |
| Encabezado de marca (`g-bleed` + `data-g-zone="brand"`) | De borde a borde **de la caja** (empieza en 264 o 64, nunca bajo la barra); `h1` alineado con la columna |
| Banda de auditoría | Al borde; su texto, en los dos bordes de la columna |
| Media y línea (`g-bleed-raw`) | De borde a borde |
| Tabla desplazable | Llega al borde; en reposo empieza en la columna; al final del desplazamiento termina en la columna |
| Margen publicado en un descendiente profundo | px, igual al margen real |
| Zócalo pegado | Sigue en 56 a media página (un solo contenedor) |
| Fijo dentro | Pegado al visor (no atrapado) |
| RTL | Sangrado a los dos bordes, texto en la columna |
| Desplazamiento horizontal | Ninguno |

**Coste:** bajo (CSS, tres `@property`).

---

## C · Medida a la mano

**Premisa cuestionada:** «el ancho lo decide quien diseña». La línea cómoda depende de quien lee (baja visión con ampliación, dislexia, lectura en voz de pantalla con seguimiento visual). WCAG 1.4.8 (AAA) pide que el usuario pueda elegir el ancho del texto.

**Estructura.** La columna es la medida (`66ch` por defecto, de 45 a 90). Un **asa** en el margen, a cada lado de la columna, **pegada a media altura del visor** mientras la página pasa (fila de alto 0, `sticky`: no ocupa ni mueve nada). La del final es un **separador de APG** (*Window Splitter*): `role="separator"`, `aria-orientation="vertical"`, `aria-valuenow`/`min`/`max` en caracteres, `aria-valuetext` «66 caracteres por línea», `aria-controls` a la columna, nombre por `labels`; la del inicio es su espejo para el puntero (`aria-hidden`). **Va después del contenido en el DOM**: no añade una parada de Tab antes de la página.

**Comportamiento.** Teclado: ←/→ (o ↑/↓) ± 2 caracteres, Re Pág / Av Pág ± 10, Inicio / Fin = mínimo / máximo que cabe; en RTL ← ensancha. Puntero: al arrastrar aparecen **dos guías** y la cifra; **la columna no cambia hasta soltar** (sin reflujo por cuadro, Δ0 medido); Esc cancela; doble clic vuelve a 66. **Solo aparece si hay holgura**: en un teléfono (la columna ya es toda la pantalla) no hay asa. `v-model:measure` para que la aplicación lo recuerde (preferencia del usuario).

**Movimiento.** El asa aparece al acercarse al margen y con el foco (`--g-duration-fast`); con puntero grueso, siempre visible y de 44 px. El cambio de ancho al soltar no se anima (animar el ancho reflujaría el texto en cada cuadro).

### Qué lo hace distinto (C)

Ningún contenedor deja al **lector** decidir su línea. Este convierte una preferencia de accesibilidad de nivel AAA en un gesto: se arrastra el margen como se ajusta un atril, las guías enseñan el resultado antes de aplicarlo y la página no baila mientras tanto.

### Gana y arriesga

- **Gana:** 1.4.8 de verdad; personalidad visible y útil; se apoya en A (la medida en caracteres).
- **Arriesga:** **JS y estado en una primitiva** (la base no tiene nada); una parada de Tab más por página; descubribilidad (el asa aparece al acercarse); la preferencia tiene más sentido **para toda la aplicación** que por contenedor (lo lógico es un ajuste global que la aplicación pase a todos los contenedores); en la práctica sirve para páginas de lectura, no para tableros.

### Medidas (C)

| Medida | Resultado |
| --- | --- |
| Separador | Rol, orientación, nombre, valores y texto del valor; último en el Tab |
| Teclado | → 68 · Inicio 45 · Fin = máximo que cabe · doble clic 66 · RTL ← ensancha |
| Arrastre | Dos guías, columna quieta (Δ0) hasta soltar; al soltar se aplica; Esc cancela |
| 390 | Sin holgura: sin asa |
| Foco | Visible con el foco |

**Coste:** medio (asa, arrastre, teclado, `v-model`, holgura medida con `ResizeObserver`).

---

## Comparativa

| | Base | A · Medida | B · Sangrado alineado | C · A la mano |
| --- | --- | --- | --- | --- |
| Qué decide el ancho | `width` | Lo que se lee (prosa en `ch`, lo ancho a toda la columna) | `width`; los hijos piden el borde | El lector |
| Ancho completo | Emparedado (corta el pegado) | Igual que la base | **`g-bleed` en el hijo, alineado** | Igual que la base |
| Anidar contenedores para leer cómodo | Sí | **No** | A veces | No |
| Tabla ancha en teléfono | Desplazable dentro del margen | Igual | **Desde el borde, alineada en reposo** | Igual |
| JS | No | No | No | Sí |
| API pública nueva además de la base | — | `prose`, `width="reading"`, `g-wide` | `g-bleed`, `g-bleed-raw`, `--g-container-inset-*` | `adjustable`, `v-model:measure`, `labels` |
| Toca a otros componentes | — | Excluye su prosa | `GPageHeader` (relleno, L4), `GTable` (desplazable, L10), opcional | — |
| Riesgo principal | El emparedado | Selecciona elementos de la aplicación | Relleno propio de la banda; adopción en `GPageHeader` | JS y estado en una primitiva |
| Coste | Muy bajo | Muy bajo | Bajo | Medio |

## Recomendación

**B · Sangrado alineado, con la medida de A como opción** (`width="reading"` y `prose`), y **C reservada** para cuando haya un ajuste de lectura de toda la aplicación (la medida en `ch` de A es lo que C necesita, así que no se pierde nada).

- **B** porque resuelve el problema que la propuesta del usuario deja abierto (el ancho completo y el anidado) **sin un segundo contenedor**, conserva el pegado del encabezado en toda la página, pone la zona de marca de borde a borde con el `h1` alineado y repite un patrón que Grana ya tiene (`--g-surface-padding`). Es CSS puro.
- **A como opción**, no por defecto: limitar la prosa por etiqueta es lo bastante sorprendente como para pedirlo (`prose`), y `width="reading"` es la forma explícita para un artículo.
- **C reservada:** es la idea con más personalidad, pero mete JS y estado en la pieza más básica, y su valor real es una preferencia global.

## Qué lo hace distinto (resumen de la recomendación)

Un contenedor que **mide su sitio y no el visor**, con un margen que **respira de forma continua** en lugar de saltar en puntos de corte, que **no acumula relleno** al anidarse, y en el que **el ancho completo no rompe la página**: una banda pide el borde y su contenido se queda en la columna; una tabla ancha se desliza desde el borde de la pantalla y empieza alineada con el texto. Todo en CSS, sin medir, sin moverse y sin parpadear en el primer pintado.

---

## Frontera con lo que existe

| Pieza | Del contenedor | De la pieza |
| --- | --- | --- |
| `GAdaptiveLayout` | La caja (ancho, margen) | El reparto de hijos en líneas. Va dentro |
| `GFormLayout` + `GFormRow` | El ancho máximo de un formulario (`width="sm"`) | Filas que llenan el ancho (#171) y el ritmo (`--g-form-*`) |
| `GSurface` | Nada de superficie | Fondo, nivel, relleno, radio, zona. Dentro de una superficie, el contenedor no añade margen (anfitriona). La zona de marca se pone con `data-g-zone="brand"` en la raíz del contenedor o en una banda `g-bleed`: **sin prop `zone`** |
| `GPageHeader` | La columna en la que vive y el borde al que sangra | Su forma, pegado, muelle. Receta: primer hijo del contenedor `as="main"`. Su relleno lateral propio choca con el margen (L4) |
| `GDivider` | `g-bleed-raw` para una línea de borde a borde de la página | `--g-divider-inset` (otra cosa, dentro de una anfitriona); el contenedor no lo redefine |
| `GCard` | — | Mismo patrón de publicar el relleno (`--g-surface-padding` ↔ `--g-container-inset-*`) |
| `GSidebar` | Mide lo que la aplicación le deja | La reserva de sitio (`--g-sidebar-width`) es de la aplicación |
| `GTable` | `g-bleed` en un desplazable de la aplicación | Su propio desplazable interno no sangra sin adoptarlo (L10) |
| `GDialog` | Dentro de `.g-dialog__body`, sin margen (anfitriona) | Su relleno y su ancho |
| `edgeReserve`, isla, avisos | Nada | Siguen al visor |
| **Stack, Grid, Flex (siguiente paso)** | **No.** El contenedor no pone separación entre hijos ni columnas | Grana no las tiene. La propuesta del usuario las recomienda como primitivas de distribución; serían la siguiente ronda de kiwi, con su frontera con `GAdaptiveLayout` (reparto automático), `GFormLayout` (formularios) y `GCardGroup`, y una escala de separación de `space` distinta de `--g-form-gap` |

## Hallazgos para lima

| # | Tema | Hallazgo | Propuesta |
| --- | --- | --- | --- |
| L1 | Nombre | `GContainer`/`g-container` sirve y es el nombre esperado; «contenedor» ya se usa en Grana para *container queries* y «contenedor largo» (#629). | Mantener `GContainer`; el README distingue «el contenedor (componente)» de «contenedor de consultas» |
| L2 | API | Sustituye `size`/`fluid`/`width`/`centered` por **`width`** (`sm`…`2xl`, `full`; A: `reading`), **`horizontal`** (`center`/`start`), **`gutter`** (`auto`/`none`/`sm`/`md`/`lg`), **`as`** (`div`/`main`/`section`/`article`) y la propiedad de entrada **`--g-container-max`**. Sin `padding` de bloque, sin `zone`. Defecto de `width`: `lg` (propuesta) | Contrato con estas cinco piezas; avisos: `horizontal` con `full`; `main` duplicado o anidado |
| L3 | Tokens | **Ningún token del tema nuevo.** Constantes de diseño a registrar: anchos `space × 160/192/256/320/384`; márgenes `clamp(space-3, 2cqi, space-6)`, `clamp(space-4, 4cqi, space-12)`, `clamp(space-6, 6cqi, space-16)`; medida `66ch` (45–90 en C). **Literales de unidad nuevos** (amplía #187): `cqi` (`100cqi`, `2/4/6cqi`) y `66ch` | Registrar en `tokens.md` como constantes y literales de unidad; ¿anchos como tokens del tema? Desaconsejado: `--g-container-max` ya cubre «otro ancho para toda la aplicación» |
| L4 | `GPageHeader` | (a) Su relleno lateral propio (`--_pad`, `space × 6`) **se suma** al margen del contenedor: dentro de la columna, el `h1` queda 24 px más adentro que el texto de la página; con `g-bleed`, el relleno del sangrado y el suyo se pelean (mismo nivel de cascada). (b) Su aviso 8 / #629(4) incluye `container-type` entre lo que atrapa el muelle: **medido, `container-type: inline-size` no atrapa `position: fixed` en Chromium, Firefox ni WebKit** (sí lo harían `contain: layout/paint`, `transform`, `filter`…). | (a) Decidir antes de cerrar la construcción en curso de `GPageHeader`: dentro de `.g-container__body`, `--_pad` = 0, y con `g-bleed` = el margen publicado (mapa de anfitrionas en `GPageHeader.css`, coco); o aceptar el desfase con receta. (b) Quitar `container-type` del texto del aviso (el aviso mide la geometría, así que no da falsos positivos; es solo el texto) |
| L5 | Anfitrionas | `gutter="auto"` = 0 dentro de otro contenedor y de `.g-surface` y `.g-dialog__body` (lee clases públicas del contrato bruno ↔ coco, como el mapa de `--_sticky-bg`, #484) | Fijar la lista en el contrato; ¿`GCard`? (compone `GSurface`: ya cubierta) |
| L6 | Contención | Raíz con `container-type: inline-size` ⇒ `contain-intrinsic-inline-size` = el máximo (#562) | Añadir `GContainer` a la lista de `api.md` |
| L7 | B, sangrado | Solo tiene sentido si la caja del hijo ocupa la columna. Dentro de una superficie con relleno llegaría al sitio equivocado | Aviso de desarrollo (bruno mide una vez al montar los `g-bleed` del contenedor) y receta de relleno propio: `padding-inline: calc(var(--g-container-inset-start) + …)` |
| L8 | Reflujo | `overflow-wrap: break-word` heredado en la columna afecta a todo lo que contiene (sin efecto en lo que ya tiene `nowrap`) | Confirmar; alternativa: solo en A/`prose` |
| L9 | `@property` | `--g-container-inset-start/-end` (públicas, solo lectura, `<length>`, `inherits: true`), `--g-container-max` (entrada, `inherits: false`), alias `--_ct-g` y `--_ct-measure` registrados. Excepción en `levels.test.js` como `--g-surface-padding` y `--g-form-min` | Registrar |
| L10 | `GTable` | `g-bleed` en `GTable` sangra la raíz pero no su desplazable interno (la primera columna no se alinea) | Adopción opcional más adelante (como la segunda entrega de la carga), no en este componente: el usuario pidió no tocar componentes para adaptarlos |
| L11 | Peso | Base + B (+ A): un render de `<component :is>` con clases y nada de JS (estimo < 0,5 KiB gzip). #550: entrada propia por defecto | Recomiendo **principal** con compuerta de ≤ 1 KiB (es la primitiva que las recetas de página de los demás citan, y es puro, #444); lima valora. C, si se elige: entrada propia |
| L12 | Complejidad | El código es pequeño, pero **se solapa con `GSurface`, `GPageHeader` y `GDialog`** (mapa de anfitrionas, sangrado, L4): cuenta como **complejo** por el primer criterio de CLAUDE.md → coco y bruno en Opus. Con C, además motor de estado y teclado propio | — |
| L13 | Receta de página | `GContainer as="main"` con `GPageHeader` de primer hijo; `--g-page-header-top` y `scroll-padding` como en #629; la barra lateral la reserva la aplicación | README (mora-docs) |

## Pregunta para el usuario

**¿Qué forma quieres para el contenedor de página?**
1. **B · Sangrado alineado con la medida de A como opción y C reservada** (recomendado): un solo contenedor por página; las bandas, el encabezado de marca y las tablas piden el borde y su contenido sigue alineado con la columna; `width="reading"` y `prose` para leer cómodo.
2. **A sola:** la prosa siempre en su medida dentro de una columna ancha; el ancho completo, por composición.
3. **B sola**, sin la medida de A.
4. **B + A + C ahora:** además el asa para que el lector ajuste el ancho de lectura (más JS, entrada propia).

## Comprobaciones

`node design/lab/container/r01/verificar.mjs` · 2026-10-14 · puerto 4252 (`GRANA_PW_PORT`) · resultado abajo.

**366 de 366 pasan.**

| Motor | Base | Anchos | A | B | C |
| --- | --- | --- | --- | --- | --- |
| Chromium | 9/9 | 56/56 | 6/6 | 35/35 | 16/16 |
| Firefox | 9/9 | 56/56 | 6/6 | 35/35 | 16/16 |
| WebKit | 9/9 | 56/56 | 6/6 | 35/35 | 16/16 |

**Nombres del prototipo → propuesta:** `.ct` = `.g-container`, `.ct__body` = `.g-container__body`, `ct-bleed` / `ct-bleed-raw` = `g-bleed` / `g-bleed-raw`, `ct-wide` = `g-wide`, `.ct--prose` = prop `prose`, `.ct--adjust` = prop `adjustable` (C).

**No verificado:** `packages/vue/dist/fonts.css` no estaba en `dist` durante la pasada (otro rol reconstruía): las medidas en caracteres de A y C usan la fuente de reserva (`system-ui`); con Instrument Sans las cifras en px cambian, la regla no. Área segura (`env(safe-area-inset-*)`) y puntero grueso reales, lector de pantalla con el separador de C, `forced-colors` real, zoom real del navegador (simulado con visor de 320 × 256 y `font-size: 200%`), y `GPageHeader`, `GTable` y `GDivider` reales dentro del contenedor (el encabezado y la tabla del prototipo los simulan).
