# Contrato · GSurface

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/surface/r01/` (kiwi); zona de marca: `design/lab/surface/r02/` (contrato nuevo, pendiente de coco y bruno)
**Tag:** `g-surface` · **Categoría:** primitivas de layout

Superficie visual genérica sobre la que vive cualquier contenido. **No tiene significado funcional ni rol:** es la base del lenguaje de profundidad de Grana, que después reutilizarán `GPanel`, `GSheet`, `GDialog`, `GMenu`, `GWidget` y el resto. Alcance decidido por el usuario: **solo la primitiva** (DECISIONS.md #99, que reabre #43); la migración de los componentes existentes queda para rondas propias.

---

## Principios

- **Un solo elemento, sin estructura.** Sin encabezado, cuerpo ni pie: organizar contenido es de `GPanel`.
- **Sin semántica propia.** El consumidor elige el elemento (`as`); `GSurface` no añade `role` ni `aria-*`.
- **No es interactiva.** Sin hover, foco ni pulsación. Una tarjeta pulsable es otro componente: `GCard` (`design/contracts/card.md`), que compone `GSurface`.
- **La profundidad es relativa al padre.** Una `inset` da **un paso de tono respecto a su superficie padre** y toma su **radio concéntrico**, sin JavaScript (propiedades CSS heredadas).
- **Dos pasos de tono como máximo.** Una `inset` dentro de otra no vuelve a cambiar de tono.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `level` | String | `flat` `outlined` `raised` `floating` `inset` | `outlined` | propia |
| `tone` | String | `surface` `sunken` | `surface` | propia |
| `padding` | String | `none` `xs` `sm` `md` `lg` | `md` | propia |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | según `level` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `as` | String | etiqueta HTML | `div` | propia |
| `zone` | String | `none` `brand` | `none` | propia (§«Zona de marca») |

### Reglas de props

- **`level`:**

  | Nivel | Fondo | Borde | Sombra | Radio por defecto |
  | --- | --- | --- | --- | --- |
  | `flat` | transparente | ninguno | ninguna | `none` |
  | `outlined` | según `tone` | `--g-color-border-strong` | ninguna | `--g-radius-lg` |
  | `raised` | según `tone` | `--g-color-border` | `--g-shadow-1` | `--g-radius-lg` |
  | `floating` | según `tone` | `--g-color-border` | `--g-shadow-2` | `--g-radius-lg` |
  | `inset` | tono contrario al del padre | `--g-color-border` | `--g-shadow-1` solo si es más clara que el padre | concéntrico |

  Cada nivel no plano se distingue del fondo por al menos **dos** señales. `floating` usa la elevación de los flotantes que ya existen (menús, listas, calendario); una **capa modal** (diálogo, sheet) añade su propia `--g-shadow-3` (DECISIONS.md #100).
- **`tone`:** `surface` lee `--g-color-surface`; `sunken` lee `--g-surface-shell`. En `inset` se ignora: el tono lo decide el padre.
- **`inset` (tono):** con padre de tono `surface` (o `flat`), toma `--g-color-surface-sunken` y **no** lleva sombra. Con padre `sunken`, toma `--g-surface-inset` y lleva `--g-shadow-1` (es la estructura de `GDialog`). **Sin superficie padre**, toma `--g-color-surface-sunken` y el radio `--g-radius-lg`.
- **`inset` (radio):** `max(--g-radius-xs, radio del padre − relleno del padre)`. Con padre `flat`, `--g-radius-lg`.
- **Tercer nivel** (una `inset` dentro de otra `inset`): fondo transparente, sin sombra; conserva el borde y su radio concéntrico respecto a la `inset` que la contiene.
- **La anidación funciona entre descendientes**, no solo entre hijos directos: un envoltorio intermedio (`div` de rejilla, `form`) no rompe la relación. La **superficie padre** es la `GSurface` no-inset más cercana.
- **`padding`:** `none` 0, `xs` `--g-surface-gap`, `sm` `space × 2`, `md` `space × 4`, `lg` `space × 6`, multiplicados por `density` (1×, 0.875×, 0.75×). Es prop, no CSS del consumidor, porque **forma parte del radio concéntrico** de sus hijas.
- **`rounded`:** la instancia gana, también en `inset` (desactiva el radio concéntrico).
- **`as`:** cualquier etiqueta HTML no interactiva (`div`, `section`, `article`, `aside`, `form`, `fieldset`, `header`, `footer`, `nav`, `main`, `ul`, `ol`, `li`). Con `a`, `button`, `input`, `select`, `textarea`, `summary` o `label`, en desarrollo se emite `console.warn` («`GSurface` no es interactiva»). Se renderiza igual.
- **Resto de atributos** (`class`, `style`, `id`, `role`, `aria-*`, `data-*`, escuchas): van a la raíz. Si el consumidor da un `role`, es suyo.

## Estructura

```html
<div class="g-surface g-surface--level-raised g-surface--tone-surface g-surface--padding-md g-surface--density-default">
  <!-- slot default -->
  <section class="g-surface g-surface--level-inset g-surface--padding-sm g-surface--density-default">…</section>
</div>
```

## Eventos

Ninguno.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `default` | Contenido libre | Directamente dentro de la raíz |

## Teclado

No aplica: `GSurface` no es interactiva ni enfocable. El contenido conserva su propio orden y foco.

## Tokens consumidos

Existentes: `--g-color-surface`, `--g-color-surface-sunken`, `--g-surface-shell`, `--g-surface-inset`, `--g-surface-gap`, `--g-color-border`, `--g-color-border-strong`, `--g-radius-{none|xs|sm|md|lg|xl|pill}`, `--g-shadow-1`, `--g-shadow-2`, `--g-space-1`, `--g-border-width`.

**Sin tokens de tema nuevos.** (Hay una propiedad pública derivada, `--g-surface-padding`: ver «Cambio aparte».) El radio mínimo de una `inset` es `--g-radius-xs`; los rellenos derivan de `space` y `--g-surface-gap`.

## Clases (contrato entre bruno y coco)

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-surface` | Raíz | Siempre |
| `g-surface--level-{flat\|outlined\|raised\|floating\|inset}` | Raíz | Siempre |
| `g-surface--tone-{surface\|sunken}` | Raíz | Siempre (en `inset` no tiene efecto) |
| `g-surface--padding-{none\|xs\|sm\|md\|lg}` | Raíz | Siempre |
| `g-surface--density-{default\|comfortable\|compact}` | Raíz | Siempre |
| `g-surface--rounded-*` | Raíz | Solo con `rounded` |

Los alias con los que una superficie **publica** a sus descendientes (tono contrario, sombra y radio concéntrico) son internos de `GSurface.css` (`--_*`). **Regla para coco:** una `inset` lee esos alias y **no** los redeclara con el mismo nombre (si lo hiciera, se leería a sí misma; hallazgo de kiwi).

## Resolución de hallazgos

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Nombre del eje | `level`, no `variant` | `api.md`: los valores de `variant` (`solid`, `soft`…) no describen una superficie |
| 2 | Tono | `tone`: `surface` \| `sunken` | Necesario para la carcasa de `GDialog` (floating hundida) |
| 3 | Elemento | `as`, `div` por defecto; aviso con elementos interactivos | WCAG 1.3.1; decisión de kiwi #11 (no interactiva) |
| 4 | Relleno | `padding` `none`…`lg` desde `space` y `--g-surface-gap` | El relleno es parte del radio concéntrico |
| 5 | Radio | `rounded` compartida; por defecto según `level` | `api.md` |
| 6 | Sombras | `floating` = `--g-shadow-2`; la capa modal añade `--g-shadow-3` | Uso actual: menús, selects y calendario en `shadow-2`; diálogo y sidebar en `shadow-3` (DECISIONS.md #100) |
| 7 | Tokens | Ninguno nuevo; radio mínimo `--g-radius-xs` | `tokens.md` §17.6 |
| 8 | Mecanismo | Funciona entre descendientes; la regla de no redeclarar queda para coco | Prototipo de kiwi |
| 9 | `density` | Compartida: multiplica el relleno y, con él, el radio concéntrico | `api.md` |
| 10 | Migración | Fuera de alcance | Decisión del usuario |

**Default de `level`: `outlined`.** Es el nivel no plano más neutro (sin sombra), coherente con el brief («sin sombras excesivas»). Decisión de producto propuesta por lima: se confirma con el usuario.

## Cambio aparte: relleno publicado (DECISIONS.md #131, por `GCard`)

Una región **a sangre** (la media y el pie de `GCard`) necesita conocer el relleno **real** de la superficie que la contiene, y hasta ahora ese valor era un alias privado (`--_pad`). Cambio, **solo de CSS**:

- `GSurface.css` declara en cada `.g-surface` la propiedad **pública** `--g-surface-padding: var(--_pad)` (ya multiplicada por `density`). Es **solo lectura** para los descendientes: nadie la sobrescribe; la superficie más cercana gana (una superficie anidada la redeclara para los suyos).
- No cambia ningún valor, prop, clase ni el `.vue`. El radio concéntrico sigue calculándose con `--_pad`.
- Quién: **coco** (`GSurface.css`, auditoría de que no cambia nada visible), **bruno** (`levels.test.js` debe aceptar que un componente lea una propiedad `--g-*` que **declara la superficie que compone**; registro en `tokens.md` §19). Sin cambios en `GSurface.vue`.
- Alternativa descartada: `padding="none"` con relleno propio por región (rompe el radio concéntrico de las `inset` hijas).

## Zona de marca (`zone`, DECISIONS.md #620 a #625)

**Basado en:** `design/lab/surface/r02/` (kiwi; hallazgos 4, 7, 15 y 22 de la integración real). **Decisión del usuario (2026-10-13):** C «Plano de tinta» + marca profunda en oscuro. Tokens y reglas: `tokens.md` §44. Regla común para otros componentes: `api.md` §«Zona de marca».

### Prop

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `zone` | String | `none` `brand` | `none` | propia |

- **`zone="brand"`** pone `data-g-zone="brand"` en la raíz: la superficie se pinta con la marca (`--g-color-bg` de la zona) y **todos sus descendientes** reciben el grupo de color de la zona (`tokens.md` §44.5). Los componentes de dentro no cambian.
- **Por qué no `tone="brand"`:** `tone` ya elige el fondo de la propia superficie (`surface`/`sunken`) y se ignora en `inset`; la zona cambia el ámbito de tokens de **todo el subárbol** y debe pintar en cualquier `level`, también en `flat`. Son ejes distintos. **Por qué no `data-theme`:** significa claro/oscuro y se combina con la zona (una zona dentro de una sección oscura).
- **`level` dentro de la zona:** la raíz de la zona **siempre pinta** la marca, también con `flat` (sin borde ni sombra: es una banda, el caso de `GPageHeader`). `outlined`, `raised` y `floating` conservan su borde y su sombra con los valores de la zona. Con `inset` y `zone` a la vez, gana la zona (fondo de marca; radio concéntrico igual).
- **`tone` se ignora con `zone="brand"`** (el fondo es la marca). Aviso de desarrollo W3.
- **Superficies anidadas dentro de la zona** (C, «Plano de tinta»): una `GSurface` (o `GCard`) dentro lee `surface` = la marca y queda como **trazo**; `inset` toma el `surface-sunken` de la zona (velo de tinta ≤ 8 %); sin segundo tono.
- **`inverse`: reservado** (DECISIONS.md #621). Pasar `zone="inverse"` cae en W1.

### Atributo y clase (contrato entre bruno y coco)

| Marca | Elemento | Cuándo |
| --- | --- | --- |
| `data-g-zone="brand"` | Raíz | Con `zone="brand"`. Es el **mecanismo** (el bloque de `defaults.css` lo selecciona) |
| `g-surface--zone-brand` | Raíz | Con `zone="brand"`. Para lo propio de `GSurface.css` (pintar en `flat`, filo, `forced-colors`) |

El atributo es **público**: la aplicación lo puede poner en cualquier elemento propio y **en la raíz de cualquier componente** (Z2 de `design/lab/page-header/r01/`: los atributos van a la raíz). Un componente que ofrezca la zona como prop la llama `zone` con los mismos valores y pone el atributo en su raíz (`api.md`).

### Avisos de desarrollo (`console.warn`, patrón de CLAUDE.md)

| # | Cuándo | Texto (idea) | Resultado |
| --- | --- | --- | --- |
| W1 | `zone` con un valor que no es `none` ni `brand` (también `inverse`) | «`zone` admite `none` y `brand`; `inverse` está reservado» | Sin zona |
| W2 | `zone="brand"` y `data-theme` en la misma raíz (por `$attrs`) | «La zona y `data-theme` no van en el mismo elemento: pon `data-theme` en un ancestro o en un descendiente» | Se renderiza igual (el tema del CLI ganaría a la zona en ese elemento, `tokens.md` §44.6) |
| W3 | `zone="brand"` con `tone="sunken"` | «Con `zone`, el fondo es la marca: `tone` se ignora» | Se ignora `tone` |

Se avisa una vez por instancia y valor. Sin aviso por zonas anidadas (inocuas).

**Límites de la zona (#637):**
- **No en `<html>`.** Con un tema del CLI, el tema sin capa en `:root` gana en ese elemento al bloque de la zona (la misma razón que W2); la zona no se aplicaría. Receta: poner `zone="brand"` / `data-g-zone="brand"` en un **hijo** de `<html>` (`<body>` o un contenedor de la aplicación). No hay aviso de desarrollo propio: `GSurface` nunca es la raíz del documento.
- **`--g-glass-filter` no se redeclara en la zona** (no es color; el valor del tema del usuario sigue valiendo dentro). Lo demás de §12 sí: tinte, filo, brillo y opacidad (`tokens.md` §44.5).
- **Sombras de la zona:** `--g-shadow-1..3` valen los literales de coco; un tema con sombras propias no las ve dentro de la zona. Es un efecto aceptado (C · plano de tinta no cambia); quien necesite sombras propias dentro escribe su propio `[data-g-zone="brand"] { --g-shadow-…: … }` sin capa.

### Tokens consumidos (además de los de arriba)

`--g-color-bg` (fondo de la zona, ya redeclarado), `--g-color-text` (color de la raíz) y **`--g-color-zone-edge`** (filo de la raíz frente a la página, `--g-border-width`; nuevo, `tokens.md` §44.2). **No** lee las demás fuentes de la zona: las lee el bloque `[data-g-zone="brand"]` de `defaults.css`.

### Para coco

1. **`defaults.css`:** las fuentes de §44.2 en los tres bloques de esquema (valores del tema por defecto de §44.8, iguales en los tres; `zone-edge: var(--g-color-border-strong)` en cada uno) y el bloque `[data-g-zone="brand"]` **después** de `[data-theme="dark"]` con la lista completa de §44.5, `color-scheme: dark`, `background-color: var(--g-color-bg)` y `color: var(--g-color-text)`. Tus valores: hundido (≤ 8 %), bordes, `mold`, mezclas `-strong`, cristal, `tabs-*`, `card-*`, sombras. Correr `sync-defaults.mjs`.
2. **`GSurface.css`:** `.g-surface--zone-brand` pinta `--g-color-bg` en todos los niveles (incluido `flat`) y dibuja el filo `--g-color-zone-edge` sin cambiar el tamaño (en `flat` como trazo interior; en los demás niveles, el borde del nivel queda dentro de la zona). En `forced-colors`, borde `CanvasText` en la raíz de la zona (el fondo desaparece). Los alias `--_*` que la superficie publica a sus hijas no cambian.
3. **Auditoría** (`design/lab/surface/auditoria-zona.md`): los 28 pares de r02 y además `hover`, `active`, seleccionado y deshabilitado de `GBtn` (cinco variantes × `brand`, `accent`, `neutral`), `GTabs`, `GSlider`, `GSelect` abierto, `GDatePicker`, `GTooltip`, `GStatusMark`, `GAvatar`, `GProgress`, `GCheckbox` marcado y un `GMenu` abierto **dentro** de la zona (§44.6: hereda la zona); temas por defecto, NisaNabani, hallazgo 15 y marca pálida (`#F5B940`), claro y oscuro; `forced-colors` emulado; 320 px. Mínimos: texto 4,5:1, contornos y foco 3:1, `mold` ≥ 1,3:1 y < 3:1.

### Para bruno

1. **`GSurface.vue` y `GSurface.meta.json`:** prop `zone` (`'none' | 'brand'`), atributo y clase de la tabla, W1 a W3. Pruebas: atributo y clase presentes solo con `brand`; W1/W2/W3; `$attrs` siguen en la raíz.
2. **CLI** (`packages/cli/`): derivación de §44.2 a §44.4 en los tres bloques (mismo valor; `dark.overrides` lo cambia solo en el oscuro), el bloque `[data-g-zone="brand"]` sin capa solo con `color-scheme` (zona clara) y `cat-k-text`, validación y `tokens.json` de §44.7. Pruebas: los cuatro temas de §44.8 reproducen la tabla; 2000 temas aleatorios sin un par de §44.7 bajo el mínimo; estados `kept`/`adjusted`/`fallback`/`lost` con un caso cada uno (`lost`: zona `#768ECA` con acento `#C1D324`); `defaults.js` sincronizado.
3. **`levels.test.js`:** todo token del bloque claro de `defaults.css` está en el bloque de la zona o en la lista «no se redeclaran» de §44.5; ningún componente lee las fuentes salvo `GSurface.css` con `zone-edge`.
4. **Playwright** (`tests/zone.spec.mjs`, puerto propio): la base de `design/lab/surface/r02/verificar.mjs` con C y marca profunda (3 temas × claro/oscuro/`data-theme="dark"` × 28 pares, 0 bajo el mínimo); foco visible en todas las paradas de Tab de la zona; un `GMenu` abierto dentro hereda la zona y cumple; `data-theme="light"` dentro de la zona vuelve a la página; fuera de la zona, Δ0 frente a una página sin zona; 320 px sin desplazamiento horizontal.
5. **Compuerta** en `gates.sh`: `grep -q 'data-g-zone="brand"' packages/vue/dist/grana.css` (o la forma sin comillas que deje el minificador) y `grep -q "g-surface--zone-brand"`.

### Para mora-docs (README de `GSurface`, y la receta que citen los demás)

- Qué es la zona y que **no hay que reasignar tokens**; el atributo `data-g-zone="brand"` para elementos propios y raíces de componentes.
- **`GBtn` dentro de la zona:** acción principal `variant="solid"` con el `color` por defecto (`brand`): sale **en tinta invertida** (blanca con texto de la marca en una zona oscura). Secundaria: `variant="outline"` o `variant="soft" color="neutral"` (velo de tinta). Terciaria: `ghost` o `link` (enlace en el acento de la zona). `color="accent" solid` solo para un acento puntual que no compita con la principal; si el CLI informa `zone-accent-lost` o `-fallback`, el acento **es** la tinta y ese botón sería igual que la principal: no usarlo. Los semánticos (`danger`…) en `outline` o `ghost` (leen `{sem}-text` de la zona); en `solid` o `soft` conservan su par de página (legibles, pero llamativos sobre la marca).
- **No** pintar la banda aparte ni redeclarar `text`, `text-muted` o `focus` a mano (el arreglo de la integración real); **no** poner `data-theme` en el mismo elemento; un menú o diálogo abierto en su sitio se verá como la zona (para que se vea como la página, `data-theme` en él).
- Documenta solo lo que coco y bruno verifiquen.

### Resolución de hallazgos (r02 §9)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| 1 | API de la zona | `zone="brand"` + `data-g-zone="brand"` público; no `tone`, no `data-theme`; `inverse` reservado (#620, #621) |
| 2 | Tokens nuevos | Once fuentes (`tokens.md` §44.2); estados en `tokens.json` (§44.7) (#622, #625) |
| 3 | Lista del grupo | `tokens.md` §44.5, con `brand*` y `primary*` invertidos y la regla para tokens futuros (#623) |
| 4 | Regla «soft» | §44.4, del 20 al 0 %, tinta plena encima (#622) |
| 5 | Personalidad | C + marca profunda (#620) |
| 6 | Solo si gana B | No aplica (ganó C) |
| 7 | «Un sólido de `brand` por vista» | `tokens.md` §2: la zona es ese sólido; dentro, la principal es la tinta invertida (#623) |
| — | §1.7 de r02 (menús y diálogos «vuelven a la página») | **Corregido:** `popover` y `<dialog>` en su sitio heredan la zona; solo `<Teleport>` fuera sale (#624) |

## Límites conocidos

- Una superficie **no-inset dentro de una `inset`** (por ejemplo, una tarjeta dentro de un resumen) vuelve a publicar y puede romper el límite de dos pasos de tono. Para `GCard` se resuelve como superficie nueva y el tercer nivel se aplana (`card.md`, «Jerarquía de superficies»); el radio concéntrico de ese caso lo verificó coco sin `rounded` del consumidor (DECISIONS.md #136).
- `--g-surface-radius-inset` (§11) no se usa: el radio concéntrico de `GSurface` se calcula con el relleno real, no con la separación fija.
- Colores forzados, zoom al 200% y la distinción `outlined`/`raised` están por verificar con el estilo real (coco).

## Abierto (no bloquea el paso siguiente)

- Valores de sombra, borde y separación en `defaults.css`: los ajusta coco si hace falta.
- Migración de `GDialog`, `GWidget`, `GMenu`, `GSelect` y `GSidebar` a `GSurface`: rondas propias.
