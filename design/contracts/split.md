# Contrato · GSplit (dos regiones)

**Dueño:** lima · **Estado:** **`candidate`** (cierre #954, 2026-10-28: coco b19cd65, 2241/2241; bruno fdb65eb y f285c25) · contratado (DECISIONS.md #946 a #951 y #953, 2026-10-28; el usuario aprobó la primitiva el 2026-10-28, «Sí, GSplit», sobre la recomendación de #933) · **Basado en:** `design/lab/split/r01/` (kiwi, commit c8a34ce: `brief.md`, `declaracion.md` con 24 puntos y hallazgos S-L1 a S-L11, regla de trabajo en `sp.css`, «después» sobre los bloques reales con `sp.js`; `verificar.mjs`, **1272/1272** en Chromium, Firefox y WebKit)
**Tag:** `g-split` · **Categoría:** distribución · **Paquete:** `@grana/vue` (principal, con compuerta de peso propia ≤ 640 B gzip; #949)

**Sin forma visible propia:** no aplica «conceptos antes que caja» (#362); sí «Qué lo hace distinto». **No es complejo** (S-L10: ni compone componentes ni tiene teclado, posición ni motor): coco y bruno en Sonnet.

## Promesa

Pone **dos regiones lado a lado con una proporción** cuando caben y **una debajo de otra** cuando no, en el orden del DOM y solo con CSS. Es la pieza para **un panel con varios controles junto a otra cosa**: el panel de compra junto a las fotos, el resumen junto a las líneas del carrito, el pedido junto al formulario de pago, lo elegido junto al calendario. Lo usan primero los bloques de `@grana/blocks`, que no llevan CSS (#763); después, cualquier aplicación.

## Qué lo hace distinto (#947)

Las rejillas de los frameworks deciden las columnas por el **visor** (`col-md-8` / `col-md-4`): el mismo carrito en un cajón de 480 px de una pantalla grande sale con dos columnas aplastadas, y quien lee con el texto al 200 % recibe un resumen de 300 px con tres palabras por línea. `GSplit` cambia la pregunta:

1. **El umbral lo dice el lado estrecho, en palabras del diseño:** «el resumen no baja de 320» (`collapse="md"`), no «a partir de 992 px». El punto de corte sale solo de la proporción, la separación y la densidad.
2. **Crece con el texto.** El mínimo del lado estrecho se mide también en cuerpos de texto: con el texto al 200 % la pareja se apila antes, sin que nadie escriba una consulta (medido en los cuatro bloques).
3. **Mide su sitio, no la pantalla:** en un cajón, un diálogo, anidado o junto a una barra lateral, decide por su caja (K3, K4).
4. **Determinista:** decide solo con la caja y el texto, nunca con lo que el contenido mide en ese instante, así que no se queda atascado tras girar la tablet o cambiar la ventana (el defecto se midió en la alternativa y se descartó, regla 6).
5. **Proporción exacta y primer pintado definitivo**, todo en CSS: ni JS, ni medición, ni parpadeo en SSR.

Sirve a quien compra o reserva: el panel con el botón o el resumen con el total **nunca se aplastan** (la razón de EC-L7), y quien lee con texto grande no pelea con dos columnas estrechas.

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| **Exactamente dos regiones** lado a lado con proporción, que se apilan cuando no caben; una o las dos con varios controles, una sección o una tabla | **`GSplit`** | `GAdaptiveLayout` (pone en línea propia un hijo con varios controles, una `section` o una `table`: #361, #365); márgenes o rejilla a mano |
| Repartir **n** hijos en líneas por su tamaño, con pistas | `GAdaptiveLayout` (#339 a #365) | `GSplit` anidados para simular n columnas |
| Una línea de piezas cortas que se parte (resumen, total y acción: Booking summary 03, #906) | `GAdaptiveLayout` | `GSplit` (no son dos regiones con proporción) |
| Apilar bloques en un eje | `GStack` (comparten `gap` y `density`, #719) | — |
| Campos de un formulario | `GFormLayout` + `GFormRow` (#171, #361) | `GSplit` para repartir campos. Un formulario **entero** sí puede ir en una región (Checkout 03) |
| El ancho y el margen de la página | `GContainer` (el `GSplit` va dentro de su columna) | — |
| Tarjetas que filtran | `GCardGroup` (#603) | — |
| La navegación lateral de la aplicación | `GAppShell` + `GSidebar` (#708) | `GSplit` con el menú en una región |

**Convivencia:** un `GSplit` hijo directo de `GAdaptiveLayout` es un **bloque de línea completa** (regla 10). Dentro de una región puede ir cualquier cosa, también otro `GSplit` (regla 9) o un `GAdaptiveLayout`.

## Uso

```vue
<GSplit ratio="3:2" gap="lg">
  <template #start>
    <GStack as="ul" gap="md">…líneas…</GStack>
  </template>
  <template #end>
    <GCard title="Resumen">…</GCard>
  </template>
</GSplit>
```

## Anatomía

```
<as>.g-split.g-split--ratio-{…}.g-split--collapse-{…}.g-split--gap-{…}.g-split--density-{…}.g-split--align-{…}   ← fila flexible que se parte; sin rol, sin contención; recibe $attrs
├─ div.g-split__region.g-split__region--start   ← slot `start`: lo primero en el DOM y en la lectura; al inicio en línea al lado, arriba al apilar
└─ div.g-split__region.g-split__region--end     ← slot `end`
```

Los envoltorios son **de Grana**: las reglas de flex van en sus `div`, nunca en elementos de la aplicación (#516); un nodo hermano de `GTooltip` (#383) o un comentario de `v-if` nunca cuentan como región. Sin JS de comportamiento (#444): ni medidas, ni observadores, ni estado.

## Props (#946)

| Prop | Tipo | Valores | Default | Origen / nota |
| --- | --- | --- | --- | --- |
| `as` | String | `div` `section` `article` `aside` `header` `footer` `form` | `div` | Lista **cerrada**. Fuera de lista (una etiqueta interactiva, `main`, `ul`/`ol` —dos regiones no son elementos de lista—, `nav`, `fieldset` —el `legend` sería un tercer hijo— o cualquier otra): aviso 1 y se pinta `div`. Las regiones son `div` sin rol: la semántica la pone el contenido (el resumen ya es un `GCard` o una `section` con su encabezado) |
| `ratio` | String | `1:1` `3:2` `2:1` `2:3` `1:2` | `3:2` | Proporción `start:end` al lado (a = `start`, b = `end`). **`3:2` por defecto** (S-L2, punto 12 de kiwi; corrige el `2:1` de #933): dos de los cuatro casos lo piden (Cart, Checkout) y con `2:1` el resumen del carrito se apila a 1024 dentro del contenedor por defecto (caja 942 < umbral 1008), mientras que `3:2` lo deja a 358 px |
| `collapse` | String | `sm` `md` `lg` | `md` | **El ancho mínimo del lado estrecho**, no un punto de corte: `max(space × 64 · 80 · 96, --g-text-body-size × 16 · 20 · 24)` (256 · 320 · 384 px con el tema por defecto, regla 2). El README lo explica con esas palabras |
| `gap` | String | `none` `sm` `md` `lg` | `md` | Vocabulario de `GStack` (#719): factor 0 · 0,5 · 1 · 2 sobre la base de página `space × 6` = 0 · 12 · 24 · 48 px con `space` 4. **La misma en los dos ejes** (al lado y apiladas, K7). Entra en el umbral. Los bloques piden `lg` |
| `density` | String | `default` `comfortable` `compact` | sin valor: la región (`density.md`, #975) | Compartida (`api.md`): multiplica la separación 1 · 0,875 · 0,75 (medido: `compact` = 18 px con `gap="md"`). Solo toca el umbral a través de la separación. Sin valor **sigue la región** (CSS) y no lee ningún contexto de formulario; con valor **es una región** y aprieta también las dos regiones de dentro (#975) |
| `align` | String | `start` `stretch` | `start` | Alineación de bloque de las dos regiones **al lado**: `start` (el resumen no se estira con la lista) o `stretch` (alturas iguales, p. ej. dos tarjetas). Apiladas no actúa |

**No existen** (y por qué): `order`, `reverse` y cualquier «la segunda primero al apilar» (1.3.2, 2.4.3; regla 7); `breakpoint` o anchos de visor (la decisión es de la caja, regla 3); `ratio` numérico o libre (la lista cerrada es la que se puede verificar exacta); `padding`, `background`, `border` (`GSurface`); tres o más regiones (`GAdaptiveLayout`). **Reservados** (§«Reservados»): `sticky`, `ratio="auto"` y `align="center"`.

## Slots

| Slot | Contenido | Nota |
| --- | --- | --- |
| `start` | Lo que se lee primero | Región `g-split__region--start` |
| `end` | Lo que se lee después | Región `g-split__region--end` |

**Sin slot `default` en el contrato de tipos** (una sola forma de decirlo). Si llega contenido por `default`, **no se pierde**: se pinta al final de la región `start` (o como `start` si no hay slot `start`) y sale el aviso 2. Ningún evento ni método (`events: []`, `methods: []`).

## Reglas (#946, #948)

1. **Región vacía = no se pinta.** Un slot ausente o que solo deja comentarios (`v-if` falso), texto en blanco o fragmentos vacíos no crea envoltorio (el mismo criterio de vacío que `GText`, regla 2 de `text.md`); la otra región ocupa **todo el ancho** (K6). Las dos vacías: la raíz se pinta sin hijos y sin aviso (una lista que aún no ha llegado no es un error). La comprobación va **en el propio render**, sin `onMounted`, así que el HTML del servidor y el del cliente coinciden.
2. **El umbral lo fija el lado estrecho.** Mínimo del lado estrecho: **`n = max(space × k, --g-text-body-size × k / 4)`** con k = 64 · 80 · 96 para `sm` · `md` · `lg`. Cada región tiene **de base su parte mínima** —el lado estrecho `n`, el ancho en proporción: base = `n / min(a, b) × a` y `× b`— y **crece con su peso** (`flex-grow` a y b). Como las bases ya están en proporción, el sobrante se reparte conservándola **exacta** (K1: ±1,5 px en las cinco proporciones). Si las dos bases más la separación no caben en la caja, la fila se parte: **apiladas**. Van al lado si `n × (a + b) / min(a, b) + gap ≤ caja` (tabla de umbrales abajo).
3. **Sin consultas ni JS, y sin contención.** `@container` y `@media` no admiten `var()` (#34, #39): la regla es una fila flexible que se parte (`flex-wrap`). La decisión es **del ancho de la raíz**, no del visor: el mismo carrito en un cajón de 480 px dentro de una página de 1440 se apila (K3). **No lleva `container-type` ni `cqi`** (corrige la propuesta de #933: no hacen falta, la base se resuelve contra la propia fila), así que no le aplica #562 y no aporta 0 a un padre que se ajusta. Primer pintado = definitivo.
4. **Crece con el texto.** Con el tema por defecto los dos términos de `n` valen lo mismo (4 px × 80 = 16 px × 20 = 320); con el texto al 200 % (`--g-text-body-size` en `rem`) el término de texto se dobla y la pareja se apila antes. Medido: Cart 01 al lado a 1440 con el texto al 100 % y apilado al 200 %; ninguna región de texto grande queda en 320 px. `min()` de números sin unidad dentro de `calc()` funciona en los tres motores. **Un cuerpo de tema mayor también sube el umbral (SP-N1, #953; comportamiento contratado, no defecto):** con el tema rústico (cuerpo 17 px, `space` 4) el lado estrecho de `md` es `max(320, 17 × 20) = 340` y Availability 03 (`2:1 md`, `gap="lg"`) pide `340 × 3 + 48 = 1068` px: a 1440 su caja de 1024 no llega y **se apila**, mientras que con el tema por defecto y lujo (16 px) pide 1008 y va al lado. Es la misma regla que protege el texto ampliado: un tema de letra mayor necesita más ancho para que el lado estrecho no quede en menos de 20 cuerpos. Quien quiera las dos columnas con ese tema baja `gap` o elige `3:2`; **no** se compensa con un token (#948).
5. **Apiladas, cada región ocupa todo el ancho de la caja** y ninguna la desborda (medido a 390 y 320 en los cuatro bloques y en las dos escalas de texto, sin desplazamiento horizontal; 1.4.10).
6. **Sin suelo de contenido** (`min-inline-size: 0` en las regiones), con `box-sizing: border-box` y **`overflow-wrap: break-word`** (una palabra larga se parte en su región, como la columna de `GContainer`; no reduce el mínimo intrínseco). **Por qué, medido (S-L4; no «arreglarlo» poniendo el suelo):** con el `min-content` de cada región como mínimo, los componentes que se miden a sí mismos (`GStepper`, `GAdaptiveLayout`, el mínimo publicado de `GFormRow`, los meses de `GCalendar`) informan el `min-content` **de su disposición actual**: Checkout 03 que pasa por 768 (apilado; el `GStepper` en fila mide 693 px) **se quedaba apilado a 1440** para siempre, y Availability daba un orden no monótono (al lado a 768, apilado a 1024). Sin suelo, la decisión al cargar es la misma que tras cualquier secuencia de cambios de tamaño (768 → 1440 → 1024 → 1440 → 320 → 1440, medida en los cuatro bloques). **Límite aceptado:** un contenido **rígido** más ancho que su región (una imagen sin `max-inline-size`, un `nowrap` largo) sobresale al lado (K9: 520 px en una región de 325 sobresalen 207). No ocurre en ninguno de los casos reales (0 px en todos los anchos, igual que antes). Receta del README: subir `collapse` o elegir otra proporción.
7. **Ningún orden visual distinto del DOM** (1.3.2, 2.4.3): sin `order`, `reverse` ni reordenar al apilar. Al lado, `start` va al **inicio en línea** (a la derecha en RTL, K5, sin código: todo lógico); apiladas, arriba. Orden de lectura = orden de Tab = orden visual (K10 con Tab real). Que en el teléfono el resumen del carrito quede al final es el orden del DOM; quien lo quiera arriba usa otra variante (Cart 02, Checkout 01), no `GSplit`.
8. **Sin movimiento.** Pasar de dos columnas a una no es un suceso del usuario: no se anima. La rúbrica de movimiento (`rubrica-movimiento.md`) **no aplica**: no hay transición que interrumpir ni que reducir.
9. **Anidado:** permitido y sin reglas propias; cada `GSplit` mide su caja (K4).
10. **Dentro de `GAdaptiveLayout`, bloque de línea completa** (enmienda de `adaptive-layout.md` «Frontera», #950): la raíz `.g-split` cuenta como bloque completo, como una `section` (#365), tenga o no controles. Dos regiones con proporción no se reparten con otros hijos en la misma línea.
11. **Dentro de `GContainer prose`, transparente** (enmienda de `container.md`, lista de primitivas transparentes de #751, #950): `.g-split` y `.g-split__region` no cortan la medida; la prosa de una región se mide a `66ch` como la de la columna (y nunca más ancha que su región).
12. **Cascada:** todo en `grana.components`; las reglas seleccionan solo `.g-split` y sus `.g-split__region` (hijos directos). Una utilidad sobre la raíz gana (#806); una regla de la aplicación sin capa gana sin `!important` (#516).

### Umbrales del tema por defecto (`space` 4, cuerpo 16 px, texto al 100 %)

**Solo valen con el tema por defecto** (#953): con otro `space` o otro cuerpo se recalculan con la fórmula de la regla 2 (rústico, cuerpo 17 px: `n` = 272 · 340 · 408).

Ancho de caja a partir del cual van **al lado** (sin la separación; súmese 0 · 12 · 24 · 48 según `gap`, por la densidad):

| `ratio` | `sm` (n = 256) | `md` (n = 320) | `lg` (n = 384) |
| --- | --- | --- | --- |
| `1:1` | 512 | 640 | 768 |
| `3:2` · `2:3` | 640 | 800 | 960 |
| `2:1` · `1:2` | 768 | 960 | 1152 |

Ejemplos con `gap="lg"`: `3:2 md` → 848; `2:1 md` → 1008; `1:1 lg` → 816. K2 (`2:1 md`, `gap="md"`): a 983 se apila y a 984 va al lado con el estrecho a 320 exactos.

## Uso en los bloques (medido por kiwi; #950)

| Bloque | `GSplit` | 1440 (caja 1024) | 1024 (942) | 768 (707) | 390 · 320 | Texto 200 % |
| --- | --- | --- | --- | --- | --- | --- |
| Product overview 01 | `ratio="1:1" collapse="lg" gap="lg"`: galería · panel | Al lado 488 · 488 | Al lado 447 · 447 | Apilado | Apilado | Apilado |
| Cart 01 | `ratio="3:2" gap="lg"`: líneas · resumen | 586 · 390 | 536 · 358 | Apilado | Apilado | Apilado |
| Checkout 03 | `ratio="3:2" gap="lg"`: pasos y formulario · pedido | 586 · 390 | 536 · 358 | Apilado | Apilado | Apilado |
| Availability 03 | `ratio="2:1" gap="lg"`: calendario · tarjeta | 651 · 325 | Apilado | Apilado | Apilado | Apilado |

`collapse="md"` (el default) en los tres últimos. Product overview con `lg` se apila a 768 (con `md` quedaría al lado a 329 · 329): el panel a todo el ancho de la tablet, como en las tiendas de referencia. Availability con `2:1` es monótono y da al calendario de dos meses 651 px a 1440 (pide 650). **No son casos:** Booking summary 03 (una línea de tres piezas, `GAdaptiveLayout`, #906) y Product grid 02 (ya queda al lado con `GAdaptiveLayout`, #942; puede adoptarlo sin cambiar de API si un día se quiere).

## Estructura accesible

**Sin `role`, `aria-*` ni foco propios**; la semántica es la de `as` y la del contenido. Nada se oculta ni se mueve; el reflujo es CSS (1.4.10 medido a 320 y con el texto al 200 %, 1.4.4); el foco nunca queda tapado porque nada se superpone (sin `sticky`, 2.4.11). `lang`, `dir`, `id`, `aria-labelledby` (con `as="section"`), `class` y `style` llegan a la raíz por `$attrs`.

## Avisos de desarrollo (`[Grana GSplit]`, una vez por instancia y motivo; S-L8)

Con la guarda canónica de #653 (`api.md` «Avisos de desarrollo») escrita en el sitio de cada texto, al montar y al cambiar la prop que comprueban.

1. **Valor fuera de lista** en `as`, `ratio`, `collapse`, `gap`, `density` o `align` (se usa el default; `as` fuera de lista → `div`). **Un solo texto** para las seis props, con el nombre de la prop y el valor recibido (por peso, como `GText` y #754).
2. **Contenido en el slot `default`** (se pinta al final de `start`; usar `#start` y `#end`).

**Sin aviso** que mida si una región desborda (metería medición en una pieza pura; S-L8) ni de `GSplit` dentro de `GFormRow` (frontera documentada en el README).

## Tokens consumidos (`tokens.md` §57)

**Ningún token nuevo** (S-L3). `--g-space-1` (separación y mínimo del lado estrecho) y `--g-text-body-size` (mínimo que sigue al texto). Nada de color, superficie, borde, radio, sombra, fuente ni duración.

**No son tokens (#717, #948):** `space × 64 · 80 · 96` y `--g-text-body-size × 16 · 20 · 24` de `collapse`; la base de separación `space × 6` con los factores 0 · 0,5 · 1 · 2 y la densidad 1 · 0,875 · 0,75 de `GStack` (§49). ¿Token del tema `--g-split-*`? **No**: el umbral sigue a `space` y al cuerpo, como las alturas de §4; un token dejaría que un tema desacompasara la pareja del texto que contiene. Sin literales de unidad nuevos.

## Clases (contrato bruno ↔ coco)

| Clase | Cuándo |
| --- | --- |
| `g-split` | Siempre |
| `g-split--ratio-{1-1\|3-2\|2-1\|2-3\|1-2}` | Según `ratio` (siempre una; `:` → `-`) |
| `g-split--collapse-{sm\|md\|lg}` | Según `collapse` (siempre una) |
| `g-split--gap-{none\|sm\|md\|lg}` | Según `gap` (siempre una) |
| `g-split--density-{default\|comfortable\|compact}` | Con la prop explícita, junto a `data-g-density` (#975) |
| `g-split--align-{start\|stretch}` | Según `align` (siempre una) |
| `g-split__region`, `g-split__region--start`, `g-split__region--end` | En cada envoltorio pintado |

Una región sola se detecta en CSS con `:only-child` (`flex-basis: 100%`); no hay clase para eso. Nombres del prototipo → contrato: `.sp` → `.g-split`, `.sp__region--*` → `.g-split__region--*`, `.sp--ratio-3-2` → `.g-split--ratio-3-2`… **No pasan** al CSS `.sp--align-center` (reservado) ni `.sp--lab-sticky` (experimento).

## SSR y efectos

Render puro por `as`, con la comprobación de región vacía en el propio render: el HTML del servidor y el del cliente coinciden. Ningún acceso a `document` ni `window`; ningún efecto al importar (#444).

## Peso y paquete (#949; S-L9)

En el **principal** (`@grana/vue`), registrado en `src/index.js` (exportación e `install`) y `components.css`. **Compuerta propia: ≤ 640 B gzip (`gzip -9`) de crecimiento de `dist/grana.js`** sobre la medida inmediatamente anterior a añadirlo, con las guardas de sus avisos dentro (#653.5) **y** la línea que hace de `.g-split` un bloque completo en `GAdaptiveLayout` (regla 10). Estimación de kiwi: 400–550 B. Es la excepción de #550 (pura, sin estado ni registro, vocabulario de los bloques y de las recetas de página), como `GText` (#853) y las primitivas de #723; **no** cuenta en la de pila + sección (#746), ni en la de `GContainer`, ni en la de `GText`. **Si la supera:** primero se recortan los textos de los avisos; si sigue, vuelve a lima (la comprobación de región vacía no se quita: es comportamiento). CSS en `grana.css` (≈ 300–400 B gzip estimados), fuera de la compuerta; bruno lo mide y lo registra (`CHANGELOG.md`). Sin entrada nueva: no toca `exports`, `typesVersions` ni `ENTRIES`. Compuerta de `dist`: `grep -q "g-split--ratio-3-2" packages/vue/dist/grana.css`.

**Bloques:** recomponer los cuatro cambia un `GAdaptiveLayout` o un `GStack` por un `GSplit` (externo, *peer*): no deben crecer de forma apreciable y **no se suben los topes** (`ecommerce.js` ≤ 51 200 B, variante ≤ 7 168 B, Checkout ≤ 9 728 B, #932; `booking.js` ≤ 37 888 B, #907).

## `meta.json` y tipos (#443)

`GSplit.meta.json`: las seis props con sus valores y defaults, slots `start` y `end` (sin `default`), `events: []`, `methods: []`, `status: "draft"` hasta la auditoría de coco. `GlobalComponents` gana `GSplit` por el `install` del principal; `src/types.test.js` la cubre sin entrada nueva.

## Verificación

- **bruno (Vitest, `GSplit.test.js`):** etiqueta por `as` en los siete valores y `div` con uno fuera de lista; clases por prop (siempre una de cada) y `ratio` con `:` → `-`; aviso 1 una vez por instancia y motivo con prop y valor; región vacía (slot ausente, solo un comentario de `v-if`, solo espacios, fragmento vacío) → sin envoltorio; las dos vacías → raíz sin hijos y sin aviso; `default` → al final de `start` (o como `start`) y aviso 2; `$attrs` (`id`, `lang`, `dir`, `aria-labelledby`, `class`) en la raíz; SSR (`renderToString`) igual que el cliente; sin efectos al importar; guarda de #653 (`src/devWarnings.test.js`). En `GAdaptiveLayout.test.js`: un `GSplit` hijo directo es bloque completo.
- **Playwright** (`tests/split.spec.mjs`, puerto propio, tres motores; los casos K1 a K10 de `design/lab/split/r01/verificar.mjs` como base, sobre el componente real): K1 cinco proporciones exactas (±1,5 px); K2 umbral exacto (`2:1 md`, `gap="md"`: 983 apila, 984 al lado con el estrecho a 320); K3 cajón de 480 en una página de 1440; K4 anidado; K5 RTL; K6 una región a todo el ancho; K7 separaciones 0 · 12 · 24 · 48 y `compact` 18, iguales al lado y apiladas; K8 `start` y `stretch`; K9 palabra larga partida (y el límite del contenido rígido, para que conste); K10 Tab real 1 → 2 → 3 al lado y apiladas (WebKit: orden del DOM); texto al 200 % (umbral doblado); secuencia de cambios de tamaño sin histéresis; 320 px sin desplazamiento horizontal; dentro de `GAdaptiveLayout` en línea propia; dentro de `GContainer prose` con la prosa a 66ch; consola limpia.
- **Bloques:** los cuatro de la tabla de uso, a 1440, 1024, 768, 390 y 320 con el texto al 100 % y al 200 %: al lado o apilado según el umbral, proporción exacta, estrecho ≥ `collapse`, sin desplazamiento horizontal, orden del DOM = Tab, nada sobresale más que antes (S-L11 (a) aparte), la secuencia de cambios de tamaño (como `verificar.mjs` «bloques»).
- **coco:** `GSplit.css` sin literales ni respaldos (solo `var(--g-*)` y alias `--_*`); auditoría con un tema distinto (`space` 5 o cuerpo de 17 px: cambian los umbrales, no la regla); `forced-colors` (no pinta nada: nada que perder); rúbrica de movimiento «no aplica».

## Reservados (#951)

- **`sticky`** (BK-L1 **sigue abierto**; `GSplit` no lo resuelve hoy). Medido en los tres motores (K11): con la región final más alta que el visor y pegada, al llevar el foco a su último control el navegador desplaza y el control **sigue fuera de la vista** (top 724 en un visor de 700): falla 2.4.7/2.4.11 sin aviso. Condiciones para la ronda que la abra (punto 19 de kiwi, `api.md` «Flotantes persistentes y el foco», #664): (a) **solo `end`** puede pegarse —apilada es la última de la caja y no tiene recorrido, así que se anula sola sin consultas; `start` pegada taparía a `end`—; (b) una **salida para lo que no cabe**: alto máximo con desplazamiento propio y su `tabindex="-1"` (#570), o pegarse por abajo; (c) la **suma de la cabecera** (`--g-app-shell-top`, #515, #595); (d) la prueba de foco de K11 en verde en los tres motores. Product overview 01 es el caso más claro (panel corto junto a una galería larga). Ronda propia de kiwi.
- **`ratio="auto"`** (la primera región a su contenido): con flex, apilada, se queda a su ancho natural y no a todo el ancho (no hay forma de decir «natural al lado, completa debajo» sin `calc-size()`, solo Chromium) y reintroduce el suelo de contenido de la regla 6. Ningún caso real la necesita. Se reabre con `calc-size()` en los tres motores y un caso.
- **`align="center"`**: medido (K8), sin caso real.

## Límites conocidos (para el README)

- **Contenido rígido más ancho que su región** sobresale al lado (regla 6): subir `collapse` u otra proporción.
- **Tema distinto del por defecto (SP-N1, #953):** con `space` 5 o un cuerpo de 17 px los umbrales cambian (la regla no); los de la tabla son **del tema por defecto**. Un cuerpo mayor apila antes: con rústico, Availability 03 se apila a 1440 (caja 1024 < 1068).
- **Sin verificar** (kiwi): lector de pantalla real (no hay nada que anunciar, pero no se escuchó); zoom real del navegador (el 200 % medido es el del texto; el de página se cubre con los anchos de 768 a 320); temas del CLI distintos del por defecto (lo mide coco); `forced-colors` (no pinta nada); SSR real (razonado, no ejecutado); un re-render de Vue dentro del laboratorio (`sp.js` movía nodos ya montados: lo cubre el spec de bruno sobre el componente real).
- **Fuera de `GSplit`** (S-L11): (a) a 320 px con el texto al 200 %, el calendario de Availability sobresale 15 px de su caja **antes y después** (mínimo de `GCalendar` 320 > 288 de caja): pendiente de coco, no bloquea `GSplit`; (b) los componentes que se miden a sí mismos informan el `min-content` de su disposición actual: cualquier pieza futura que use el contenido como suelo debe tenerlo en cuenta (regla 6).

## Resolución de hallazgos de kiwi (S-L1 a S-L11)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| S-L1 | Nombre | `GSplit` / `g-split` (#946). «split» de `GDatePicker` es otra cosa y no choca de clase |
| S-L2 | API | Props, slots y defaults de este contrato (#946); `ratio` `3:2` por defecto; `collapse` como mínimo del lado estrecho |
| S-L3 | Tokens | Ninguno; constantes en `tokens.md` §57 (#948) |
| S-L4 | Sin suelo de contenido | Regla 6 con el porqué medido y el límite (#948) |
| S-L5 | `sticky` | Reservado con condiciones; `_comun.md` §37: no resuelve BK-L1 (#951) |
| S-L6 | Bloques | Tabla de uso; enmiendas de los cuatro contratos de sección y de #892/#899 (#950) |
| S-L7 | #933 | Lista corregida: Product overview 01, Cart 01, Checkout 03 y Availability 03; Booking summary 03 y Product grid 02 no son casos (#950) |
| S-L8 | Avisos | Dos (fuera de lista, un texto; slot `default`), sin medir desbordes (#946) |
| S-L9 | Peso | Principal con compuerta propia ≤ 640 B (#949) |
| S-L10 | Complejidad | No complejo: coco y bruno en Sonnet |
| S-L11 | Otros | (a) a coco en `PENDIENTES.md`; (b) anotado en la regla 6 y en `PENDIENTES.md` |

## Encargos

- **coco (Sonnet):** `packages/vue/src/components/GSplit/GSplit.css` desde `design/lab/split/r01/sp.css` con los nombres de este contrato (capa `grana.components`; sin `.sp--align-center` ni el experimento de `sticky`); `.g-split` y `.g-split__region` en las primitivas transparentes de `prose` en `GContainer.css` (regla 11); lista exacta de tokens en `tokens.md` §57 si cambia (vuelve a lima). **S-L11 (a):** el calendario de Availability que sobresale 15 px a 320 con texto al 200 % (`GCalendar`/`GDatePicker`, no de `GSplit`). Después, la **auditoría** sobre el componente y los cuatro bloques recompuestos, con un tema distinto.
- **bruno (Sonnet):** `GSplit.vue` (render por `as`, clases, región vacía en el render, `default` al final de `start`, avisos 1 y 2 con la guarda de #653), `GSplit.test.js`, `GSplit.meta.json`, registro en `src/index.js` (exportación e `install`) y `components.css`, tipos (`GlobalComponents`), la línea de `GAdaptiveLayout` que trata `.g-split` como bloque completo (regla 10) con su prueba, compuerta de peso ≤ 640 B y de `dist` en `gates.sh`, `tests/split.spec.mjs`, ejemplo en el playground. **Después**, la recomposición de los cuatro bloques (`_comun.md` §40) con sus pruebas y el verificador, y su paso a `candidate` cuando la auditoría de coco lo confirme.
- **mora-docs (Sonnet):** `GSplit/README.md` con las fronteras, `collapse` explicado como mínimo del lado estrecho, la tabla de umbrales **marcada como del tema por defecto** con la fórmula y el ejemplo de rústico (SP-N1, #953), la receta del contenido rígido y los límites; los README de los cuatro bloques recompuestos.

## Cierre (#954, 2026-10-28)

`GSplit` y las cuatro recomposiciones en **`candidate`**. Auditoría de coco `design/lab/split/auditoria.md` **2241/2241** (tres motores, tres temas, claro y oscuro, `forced-colors`); addenda Ecommerce **11 129/11 129** y Booking **6507/6516** (los 9 fallos son AV-C1, de `GDatePicker`, anterior a `GSplit`: #952). Pesos: `grana.js` **+527 B** gzip de 640; `ecommerce.js` **49 557** de 51 200; `booking.js` **37 140** de 37 888 (sin subir topes). Hallazgos: SP-N1 contratado (#953); SP-N2 (tramo «bloques» de `estilo-verificar.mjs` obsoleto) es del banco de coco. Reservados sin cambio (#951). **Sin verificar:** lector de pantalla real, zoom real del navegador, teléfono real, SSR ejecutado (razonado y probado con `renderToString`).
