# GSurface

Superficie visual genérica sobre la que vive cualquier contenido: sección, grupo de formulario, tarjeta, popover, carcasa de diálogo o zona incrustada. **No tiene significado funcional ni estructura:** es la base del lenguaje de profundidad de Grana, para que todas las superficies compartan fondo, borde, radio y sombra en lugar de que cada componente los decida.

**Etiqueta:** `<g-surface>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/surface/auditoria.md`](../../../../../design/lab/surface/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<g-surface level="raised" as="article">
  <h3>Plan Pro</h3>
  <g-surface level="inset" padding="sm">3 asientos · $36/mes</g-surface>
</g-surface>
```

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-surface ...></g-surface>`: Vue no admite etiquetas de componente autocerradas.

## Niveles

| Nivel | Relación con lo que tiene detrás | Para | Cómo se ve |
| --- | --- | --- | --- |
| `flat` | Integrada al layout | Secciones, contenido base | Sin fondo, sin borde, sin radio |
| `outlined` (por defecto) | Delimitada | Grupos, formularios, configuración | Fondo + borde marcado |
| `raised` | Ligeramente elevada | Tarjetas, widgets | Fondo + borde tenue + sombra corta |
| `floating` | Claramente separada | Popovers, menús | Fondo + borde tenue + sombra amplia |
| `inset` | Incrustada en su padre | Resúmenes, zonas dentro de diálogos y paneles | Un paso de tono respecto al padre + borde + radio concéntrico |

Cada nivel no plano se distingue por al menos dos señales, no solo por tono. Una capa modal (diálogo, sheet) añade su propia sombra mayor: ningún nivel la usa.

## Cómo funciona la `inset`

Una `inset` **no necesita saber quién es su padre**: la superficie más cercana que no es `inset` le pasa, por CSS heredado, tres datos.

1. **Tono:** el contrario al suyo.
   - Padre claro (`tone="surface"` o `flat`) → la inset es **hundida** y sin sombra.
   - Padre hundido (`tone="sunken"`) → la inset es **clara** y lleva una sombra mínima. Es la estructura de una carcasa de diálogo.
2. **Radio concéntrico:** radio del padre − relleno del padre, nunca menos de `--g-radius-xs`. Con `flat`, `--g-radius-lg`.
3. **Sin padre:** una inset suelta es hundida, con radio `--g-radius-lg`.

```vue
<!-- Carcasa de diálogo: la inset toma el tono claro y el radio 12 − 6 = 6px (tema por defecto) -->
<g-surface level="floating" tone="sunken" padding="xs" rounded="xl">
  <header>Guardar cambios</header>
  <g-surface level="inset">Cuerpo</g-surface>
</g-surface>
```

- **Funciona entre descendientes:** un `<form>` o un `<div>` intermedio no rompe la relación.
- **Dos pasos de tono como máximo:** una `inset` dentro de otra `inset` es transparente y sin sombra; conserva la línea y su radio concéntrico. Esto vale también si entre ambas hay otra superficie (una tarjeta dentro de un resumen).
- **El relleno cuenta:** por eso `padding` es una prop y no CSS tuyo. Si pones el relleno con `style` o una clase, el radio de las hijas no lo sabrá.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `level` | String | `flat` `outlined` `raised` `floating` `inset` | `outlined` |
| `tone` | String | `surface` `sunken` | `surface` |
| `padding` | String | `none` `xs` `sm` `md` `lg` | `md` |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | según `level` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `as` | String | etiqueta HTML | `div` |

Un valor fuera de la lista muestra una advertencia en desarrollo. No hay `variant`: el eje es `level`.

- **`tone`:** `surface` (claro) o `sunken` (hundido, `--g-surface-shell`). En `inset` no tiene efecto: el tono lo decide el padre.
- **`padding`:** `none` 0, `xs` `--g-surface-gap` (6px por defecto), `sm` 8px, `md` 16px, `lg` 24px con `space` 4, multiplicados por `density`.
- **`rounded`:** la instancia gana, también en `inset` (desactiva el radio concéntrico). Por defecto: `flat` sin radio, el resto `--g-radius-lg`, `inset` concéntrico.
- **`density`:** 1×, 0.875× o 0.75× del relleno; el radio concéntrico de las hijas lo sigue.
- **`as`:** el elemento (`section`, `article`, `aside`, `form`, `fieldset`, `ul`…). **`GSurface` no añade rol ni `aria-*`**: la semántica es tuya. Con `a`, `button`, `input`, `select`, `textarea`, `summary` o `label` se renderiza igual, pero en desarrollo avisa: no es interactiva.
- **Resto de atributos** (`class`, `style`, `id`, `role`, `aria-*`, `data-*`, escuchas): van a la raíz.

## Eventos y slots

Sin eventos. Un solo slot, `default`, con contenido libre directamente dentro de la raíz.

## Accesibilidad

- **Sin semántica propia:** elige el elemento con `as` y, si lo necesitas, pon tú el `role` y el nombre (`aria-label`).
- **No es interactiva:** sin foco, hover ni pulsación. Para una tarjeta pulsable, pon un enlace o botón dentro.
- **Contraste medido:** el texto sobre cualquier nivel y tono llega a 16.1:1 con el tema por defecto, 12.1:1 con un tema de prueba y 15.2:1 en oscuro.
- **Colores forzados:** el fondo y la sombra desaparecen; todo nivel no plano conserva un borde visible.

## Tema

`GSurface` solo lee tokens `--g-*` y **no añade tokens propios**:

```css
:root {
  --g-color-surface: #FFFAF2;        /* tono claro */
  --g-surface-shell: #E9DCC6;        /* tono hundido (tone="sunken") */
  --g-color-surface-sunken: #EFE4D2; /* inset sobre un padre claro, e inset suelta */
  --g-surface-inset: #FFFDF8;        /* inset sobre un padre hundido */
  --g-color-border: rgb(80 50 20 / 0.14);
  --g-color-border-strong: rgb(80 50 20 / 0.3); /* borde de outlined */
  --g-shadow-1: 0 1px 3px rgb(80 50 20 / 0.12); /* raised, e inset clara */
  --g-shadow-2: 0 6px 16px -6px rgb(80 50 20 / 0.25); /* floating */
  --g-surface-gap: 10px;             /* padding="xs" */
}
```

Consume también `--g-color-text`, `--g-radius-{none|xs|sm|md|lg|xl|pill}`, `--g-space-1` y `--g-border-width`.

## Clases

Las emite el componente y las estiliza `GSurface.css`: `g-surface`, `g-surface--level-*`, `g-surface--tone-*`, `g-surface--padding-*`, `g-surface--density-*` y, solo con `rounded`, `g-surface--rounded-*`.

## Limitaciones conocidas

- **Todavía no la usan los demás componentes.** `GDialog`, `GWidget`, `GMenu`, `GSelect` y `GSidebar` conservan su propio CSS; migrarlos es trabajo de rondas propias.
- **Una tarjeta dentro de una inset** hace que la inset de esa tarjeta quede transparente (se respeta el límite de dos tonos). Si necesitas otra cosa, no anides así.
- **`--g-surface-radius-inset` no se usa:** el radio concéntrico se calcula con el relleno real.
- **Sin verificar:** `forced-colors` real (se probó emulado), Firefox y Safari (usa `:not()` con selectores complejos: Safari 9+, Firefox 84+) y zoom al 200%.

## Fuentes

- API: [`GSurface.meta.json`](./GSurface.meta.json) · Contrato: [`design/contracts/surface.md`](../../../../../design/contracts/surface.md) · Prototipo: [`design/lab/surface/r01/`](../../../../../design/lab/surface/r01/) · Estilo: [`design/lab/surface/estilo.md`](../../../../../design/lab/surface/estilo.md) · Auditoría: [`design/lab/surface/auditoria.md`](../../../../../design/lab/surface/auditoria.md)
