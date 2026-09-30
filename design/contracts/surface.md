# Contrato · GSurface

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/surface/r01/` (kiwi)
**Tag:** `g-surface` · **Categoría:** primitivas de layout

Superficie visual genérica sobre la que vive cualquier contenido. **No tiene significado funcional ni rol:** es la base del lenguaje de profundidad de Grana, que después reutilizarán `GPanel`, `GSheet`, `GDialog`, `GMenu`, `GWidget` y el resto. Alcance decidido por el usuario: **solo la primitiva** (DECISIONS.md #99, que reabre #43); la migración de los componentes existentes queda para rondas propias.

---

## Principios

- **Un solo elemento, sin estructura.** Sin encabezado, cuerpo ni pie: organizar contenido es de `GPanel`.
- **Sin semántica propia.** El consumidor elige el elemento (`as`); `GSurface` no añade `role` ni `aria-*`.
- **No es interactiva.** Sin hover, foco ni pulsación. Una tarjeta pulsable será otro componente.
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

**Sin tokens nuevos.** El radio mínimo de una `inset` es `--g-radius-xs`; los rellenos derivan de `space` y `--g-surface-gap`.

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

## Límites conocidos

- Una superficie **no-inset dentro de una `inset`** (por ejemplo, una tarjeta dentro de un resumen) vuelve a publicar y puede romper el límite de dos pasos de tono. No se diseñó en r01.
- `--g-surface-radius-inset` (§11) no se usa: el radio concéntrico de `GSurface` se calcula con el relleno real, no con la separación fija.
- Colores forzados, zoom al 200% y la distinción `outlined`/`raised` están por verificar con el estilo real (coco).

## Abierto (no bloquea el paso siguiente)

- Valores de sombra, borde y separación en `defaults.css`: los ajusta coco si hace falta.
- Migración de `GDialog`, `GWidget`, `GMenu`, `GSelect` y `GSidebar` a `GSurface`: rondas propias.
