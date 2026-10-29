# Contrato · GStack (pila)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #719, #717 y #723, 2026-10-21; `tokens.md` §49; enmienda #827, 2026-10-22) · **Basado en:** `design/lab/app-shell/r01/` (kiwi, commit 0c202e3; `declaracion.md` Parte 2, hallazgo L13; prototipo `.st` en `shell.css`; medido en `verificar.mjs`, 14/14 de pila y sección por motor)
**Tag:** `g-stack` · **Categoría:** distribución · **Paquete:** `@grana/vue` (principal, con compuerta de peso conjunta con `GSection`; #723)

**Sin forma visible propia:** no aplica «conceptos antes que caja» (#362); sí «Qué lo hace distinto». **No es complejo:** coco y bruno en Sonnet.

## Promesa

Apila sus hijos **en un eje** con la escala de separación de Grana, sin superficie y sin poder romper el reflujo. Es el ritmo de bloque que `GContainer` deja fuera (`container.md`, decisión 1 de la ronda) y el cuerpo de `GSection`.

## Qué lo hace distinto (#719)

La separación **es una relación, no una cifra**: `sm` «va con lo anterior», `md` «lo siguiente», `lg` «otro tema», el mismo vocabulario que `GAdaptiveLayout` (#360), `GSection` y la densidad del tema, así que una pantalla entera cambia de ritmo con `space` y nunca con un número escrito a mano. Y la pila **no puede romper el reflujo**: en línea siempre se parte, y es la **única** fuente de aire entre sus hijos (ni márgenes que se suman ni dos aires distintos según quién escribió el `p`).

## Cuándo usarlo (fronteras)

| Necesito | Uso | No |
| --- | --- | --- |
| Apilar bloques de una página o de un panel | **`GStack`** | Márgenes a mano |
| Campos de un formulario | `GFormLayout` + `GFormRow` (#171, #361) | `GStack` para distribuir campos |
| Repartir hijos en líneas por su tamaño | `GAdaptiveLayout` (#339 a #365) | `GStack horizontal` con `between` (no existe) |
| Exactamente dos regiones lado a lado con proporción que se apilan cuando no caben (un panel con varios controles junto a otra cosa) | `GSplit` (`split.md`, #946; comparte `gap` y `density`) | `GStack orientation="horizontal"` (sus hijos van a su tamaño intrínseco y no guardan proporción) |
| Un grupo de tarjetas que filtran | `GCardGroup` (#603) | — |
| Relleno, fondo, borde | `GSurface` | `GStack` (sin superficie) |
| La columna de la página | `GContainer` | — |

## Uso

```vue
<GStack gap="lg">
  <GSection title="Pendientes">…</GSection>
  <GSection title="Validadas">…</GSection>
</GStack>

<GStack orientation="horizontal" gap="sm" vertical="center">
  <GBadge>…</GBadge><GTag>…</GTag>
</GStack>
```

## Anatomía

```
<as>.g-stack [--orientation-*] [--gap-*] [--density-*] [--h-*] [--v-*] [--divided]   ← flex en un eje; ningún envoltorio por hijo
└─ [slot default]  hijos directos, en el orden del DOM
```

## Props

| Prop | Tipo | Valores | Default | Origen / nota |
| --- | --- | --- | --- | --- |
| `as` | String | etiqueta HTML no interactiva | `div` | Como `GSurface` (`surface.md`): `div`, `section`, `article`, `aside`, `nav`, `header`, `footer`, `ul`, `ol`, `form`, `fieldset`… La pila no añade roles **salvo** con `ul`/`ol`: ahí quita las marcas del navegador y repone `role="list"` (regla 6, #827); la aplicación pone los `li`. Con una etiqueta interactiva (`a`, `button`, `input`, `select`, `textarea`, `summary`, `label`) o `main`, aviso 1 (se pinta igual) |
| `orientation` | String | `vertical` `horizontal` | `vertical` | Nombre compartido (`GDivider`, `GTabs`) |
| `gap` | String | `none` `sm` `md` `lg` | `md` | Factor 0 · 0,5 · 1 · 2 (como #360) sobre la **base de página `space × 6`**: 0 · 12 · 24 · 48 px con `space` 4. Misma separación en los dos ejes (en línea, también entre filas) |
| `density` | String | `default` `comfortable` `compact` | sin valor: la región (`density.md`, #975) | Compartida (`api.md`): multiplica la separación 1 · 0,875 · 0,75. Medido: `compact` = 18 px. **Desde #975 la prop es una región:** aprieta también lo de dentro; sin valor, la pila sigue su región |
| `horizontal` | String | `start` `center` `end` | sin valor | Eje en línea, lógico (nombre de `GAdaptiveLayout`, #339, #359). En vertical: ancho de los hijos (sin valor = **estirar**). En horizontal: dónde va la fila (sin valor = `start`) |
| `vertical` | String | `top` `center` `bottom` | sin valor | Eje de bloque; **solo en horizontal** (sin valor = `center`). En vertical no actúa (aviso 3) |
| `divided` | Boolean | | `false` | Una línea `--g-color-border` entre hijos visibles, con el aire repartido a los dos lados de la línea (la distancia entre dos hijos es `2 × gap`); nunca antes del primero ni tras el último. **Solo en vertical** (en horizontal, aviso 3 y no se pinta) |

**No existen** (y por qué): `between`, `around`, `evenly` (eso **reparte**: `GAdaptiveLayout`); `nowrap` (en línea **siempre** se parte, 1.4.10); `reverse` y cualquier orden visual distinto del DOM (1.3.2, 2.4.3); `gap` numérico o en px (la escala es la relación); `padding`, `background`, `border` (`GSurface`); `inline` (la pila es de bloque; para una fila dentro de texto, un `span` de la aplicación).

Valores fuera de lista: aviso 2 y el default.

## Slots, eventos, métodos

Slot `default` (los hijos). **Ningún evento ni método.** Puro y sin JS de comportamiento (#444): ni medidas, ni observadores, ni estado.

## Reglas de los hijos

1. **Una sola fuente de aire:** los márgenes de bloque de los **hijos directos** valen 0 dentro de la pila, en la capa de Grana (una regla de la aplicación sin capa gana, #516). Medido por kiwi: el margen de un `p` hijo = 0.
2. **Ignora el nodo hermano de `GTooltip`** en todos sus selectores de hijos (`:not(:where(.g-tooltip))`, #383).
3. **`divided` y los hijos con superficie (#752):** la línea **no** se dibuja sobre un hijo con superficie propia (`.g-surface`, incluye `GCard`): ya está delimitado, y a ese hijo lo separa el `gap` (no `2 × gap`). Con la línea encima, la tarjeta quedaba con el borde de arriba de otro color y el relleno descompensado (24 px arriba frente a 16 abajo, medido por coco). La línea va solo entre hijos sin superficie; un hijo con borde superior propio de la aplicación (sin capa) conserva el suyo (#516). Para una lista de tarjetas con línea, la línea va entre hijos sin superficie. No hay otra forma sin elemento extra: un pseudoelemento cae dentro del mismo hijo y un `box-shadow` desaparece en `forced-colors`.
4. **Hijos ocultos:** un hijo con `hidden` no cuenta para `divided` (la línea va entre hijos visibles). También cuentan como ocultos `g-hidden` y `g-sr-only` (clases de Grana, #807/#808; #813). Un hijo que la aplicación oculta con una clase **propia** (`display: none`) no se puede detectar en CSS sin coste: límite conocido.
5. En horizontal, los hijos conservan su tamaño intrínseco y se parten en filas con la misma separación (medido a 320: varias filas, sin desplazamiento horizontal).
6. **`as="ul"`/`"ol"` (#827; cambia la v1):** la lista no lleva viñetas, sangría ni margen del navegador (`list-style: none`, `padding-inline-start: 0`, `margin-block: 0` en `ul.g-stack`/`ol.g-stack`, `GStack.css`, coco 04fd906): la pila es la única fuente de aire. Como Safari con VoiceOver deja de anunciar como lista un `ul` sin marcas, **`GStack.vue` pone `role="list"`** en la raíz con esas dos etiquetas; un `role` de la aplicación en `$attrs` gana. En `div` y las demás etiquetas, ningún rol.

## Estructura accesible

Ninguna propia: la semántica es la de `as` y la de los hijos. Orden del DOM = orden visual = orden de Tab. Sin `aria-*` ni foco; `role="list"` solo con `as` `ul`/`ol` (regla 6, #827).

## Avisos de desarrollo (`[Grana GStack]`, una vez por instancia y motivo)

Con la guarda canónica de #653 (`api.md` «Avisos de desarrollo»), al montar y al cambiar la prop que comprueban.

1. `as` es una etiqueta interactiva o `main` (una pila no es un control ni el punto de referencia de la página).
2. `orientation`, `gap`, `density`, `horizontal` o `vertical` fuera de lista (se usa el default).
3. `vertical` con `orientation="vertical"`, o `divided` con `orientation="horizontal"` (no actúan).

## Tokens consumidos (`tokens.md` §49)

**Ningún token nuevo.** `--g-space-1` (base `× 6` y factores), `--g-color-border` y `--g-border-width` (con `divided`). Dentro de la zona de marca, `border` está en §44.5.

**No son tokens (#717):** base de página **`space × 6`** y sus resultados **`space × 3`** (`sm`), **`space × 12`** (`lg`); factores `0 · 0,5 · 1 · 2`; densidad `1 · 0,875 · 0,75`. La base es **distinta** de `--g-form-gap` (de `GFormLayout` y `GAdaptiveLayout`): la pila no es un formulario.

## Clases (contrato bruno ↔ coco)

| Clase | Cuándo |
| --- | --- |
| `g-stack` | Siempre |
| `g-stack--orientation-vertical`, `g-stack--orientation-horizontal` | Según `orientation` |
| `g-stack--gap-{none\|sm\|md\|lg}` | Según `gap` |
| `g-stack--density-{default\|comfortable\|compact}` | Con la prop explícita, junto a `data-g-density` (#975): aprieta la separación **y lo de dentro** |
| `g-stack--h-{start\|center\|end}` | Con `horizontal` |
| `g-stack--v-{top\|center\|bottom}` | Con `vertical` en horizontal |
| `g-stack--divided` | Con `divided` en vertical |

## Movimiento

Ninguno. La pila no anima hijos que entran o salen (eso es de quien los pone).

## Peso y paquete (#723)

En el **principal** (`@grana/vue`), registrado en `src/index.js` y `components.css`. **Compuerta conjunta con `GSection`: ≤ 1,5 KiB (1536 B) gzip** de crecimiento de `dist/grana.js` sobre la medida anterior a añadirlos (215 449 B), con sus guardas de avisos (#653.5). **Enmienda #746** del 1 KiB de #723: medido +1381 B (gzip `-9`, 6cb6e76) con los avisos ya recortados; no se vuelve a subir. `role="list"` en `ul`/`ol` (#827) añade **+40 B** (bruno): pila y sección ≈ **1421 B de 1536** (#850), margen ≈ 115 B. Si la supera, las dos pasan a la entrada reservada **`@grana/vue/layout`** (vuelve a lima). Compuerta de `dist`: `grep -q "g-stack--divided" packages/vue/dist/grana.css`.

## `meta.json` y tipos (#443)

`GStack.meta.json`: las siete props con sus valores y defaults (`horizontal` y `vertical` sin default), slot `default`, `events: []`, `methods: []`, `status: "draft"` hasta la auditoría de coco.

## Verificación

- **bruno (vitest):** etiqueta por `as` y aviso 1; `role="list"` con `ul` y `ol`, ninguno con `div`, y el `role` de la aplicación gana (#827); clases por prop; avisos 2 y 3; sin efectos al importar; renderizado en SSR.
- **Playwright** (`tests/stack-section.spec.mjs`, puerto propio, tres motores): separación 24 / 12 / 48 / 0 y `compact` 18; márgenes de hijos a 0 (y una regla sin capa de la aplicación que gana); `divided` (línea en el segundo, ninguna en el primero, hijo `hidden` ignorado, `2 × gap`); horizontal a 320 sin desbordamiento; alineaciones en RTL; un `GTooltip` hijo no altera la separación.
- **coco:** `GStack.css` sin literales ni respaldos; auditoría con un tema distinto (cambiar `space` cambia el ritmo); `forced-colors` (la línea de `divided` sigue visible).

## Encargos

- **coco (Sonnet):** `GStack.css`.
- **bruno (Sonnet):** `GStack.vue`, `GStack.test.js`, `GStack.meta.json`, registro en `src/index.js` y `components.css`, compuerta, spec compartido con `GSection`, ejemplo en el playground.
- **mora-docs (Sonnet):** `GStack/README.md` con la frontera.
