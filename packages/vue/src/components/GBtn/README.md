# GBtn

Botón de acción. Si recibe `href`, se renderiza como enlace (`<a>`).

**Etiqueta:** `<g-btn>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/btn/auditoria.md`](../../../../../design/lab/btn/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'
import '@grana/vue/fonts.css' // opcional: Instrument Sans, la fuente del tema por defecto

createApp(App).use(Grana).mount('#app')
```

```vue
<g-btn @click="guardar">Guardar</g-btn>
<g-btn variant="outline" color="danger">Eliminar</g-btn>
<g-btn href="/reservas" variant="link">Ver reservas</g-btn>
```

También se puede importar solo el componente: `import { GBtn } from '@grana/vue'`.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` |
| `variant` | String | `solid` `soft` `outline` `ghost` `link` | `solid` |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: lo decide el tema (`--g-radius-shape`) |
| `block` | Boolean | | `false` |
| `disabled` | Boolean | | `false` |
| `loading` | Boolean | | `false` |
| `type` | String | `button` `submit` `reset` | `button` |
| `href` | String | URL | sin valor |
| `icon` | Boolean | | `false` |
| `loadingText` | String | texto libre | sin valor |

Un valor fuera de la lista muestra una advertencia en desarrollo.

- **`type`** se ignora cuando hay `href`.
- **`density`** reduce la altura: ×1, ×0.875 (`comfortable`) o ×0.75 (`compact`), con un mínimo de 24px.
- **`icon`** hace el botón cuadrado (ancho = alto) y exige `aria-label` o `aria-labelledby`. En desarrollo, si falta, se emite `console.warn`.
- **`loading`** conserva el ancho y el color del botón, oculta la etiqueta y muestra un indicador de giro. El botón queda en `aria-busy="true"` y `aria-disabled="true"`, pero **no** usa el atributo `disabled`, para no perder el foco.
- **`loadingText`** es el texto que se anuncia a lectores de pantalla cuando `loading` pasa a `true`. No tiene valor por defecto porque Grana es internacional: un texto fijo estaría en el idioma equivocado. Sin él, solo queda `aria-busy`.
- **Pon `loadingText` desde el principio** (fijo, no solo al empezar la carga): el botón pinta su región de anuncio (`g-btn__status`) **solo mientras `loadingText` tiene valor** (DECISIONS #257), y un lector solo anuncia los cambios de una región que **ya existía**. Si `loadingText` y `loading` llegan en el mismo cambio, la región se monta vacía y el texto se escribe en el ciclo siguiente para que se anuncie, pero lo seguro es que la región exista antes de la carga. Sin `loadingText` no hay región: así una vista con cientos de botones (filas de `GTranscript`, por ejemplo) no añade cientos de regiones vivas vacías.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `click` | `MouseEvent` | Con puntero o teclado. **Nunca** con `disabled` ni `loading`. Con `type="submit"` y `loading`, también se cancela el envío del formulario. |

## Slots

| Slot | Contenido |
| --- | --- |
| `default` | La etiqueta, o el icono si `icon` |
| `prepend` | Icono antes de la etiqueta. Decorativo: el componente lo marca con `aria-hidden="true"` |
| `append` | Icono después de la etiqueta. Igual que `prepend` |

Los iconos son de [Lucide](https://lucide.dev) con [`GIcon`](../GIcon/README.md) en el slot (no hay prop de icono: `icon` es Boolean, el modo solo icono). Los de la lista de la librería (`plus`, `x`, `check`…) se usan sin más; cualquier otro de Lucide (`download`, `lock-open`…) lo registra tu aplicación una vez con `createIcons` importándolo de `lucide-static` (ver el README de `GIcon`).

```vue
<g-btn icon aria-label="Añadir"><g-icon name="plus"></g-icon></g-btn>
<g-btn><template #prepend><g-icon name="plus"></g-icon></template>Nuevo</g-btn>
<g-btn variant="outline">Continuar<template #append><g-icon name="arrow-right" flip-rtl></g-icon></template></g-btn>
```

- El `GIcon` dentro del botón va **decorativo** (sin `label`): el nombre lo da el texto o, en solo icono, el `aria-label` del botón.
- **Tamaño del icono:** el botón lo fija con el `svg` hijo directo del hueco, en `em` del texto del botón (alias local `--_icon`, sin token): **1.15em en `prepend` y `append`** (13,8px en `xs`, 16,1px en `sm` y `md`, 18,4px en `lg` y `xl`) y **1.4em en el modo solo icono** (16,8px en `xs`, 19,6px en `sm` y `md`, 22,4px en `lg` y `xl`). Sigue a `size` y **no** a `density`; cabe sin tocar el borde en todos los tamaños y densidades, también con el piso de 24px (`xs` y `sm` en `compact`: holgura mínima de 2px entre el trazo y el borde), y no cambia la altura del botón. El indicador de carga mide lo mismo que el icono al que sustituye, así que el icono no encoge al cargar. Medido en Chromium, Firefox y WebKit. Otro contenido del hueco (una imagen, un logotipo) lo dimensionas tú. El icono toma su color (`currentColor`), también al pasar el puntero y en `forced-colors`.
- **No pongas clases de tamaño al icono del botón:** tu clase gana siempre (va sin capa; el CSS de Grana va en `grana.components`). Para otro tamaño, cambia `size` del botón.
- Flechas de avance o retroceso: `flip-rtl` las espeja en RTL.
- Un **logotipo** u otro dibujo que no sea Lucide va en el mismo slot con tu propio marcado (decorativo); `GIcon` solo dibuja Lucide.

## Accesibilidad

- **Teclado:** Tab y Shift+Tab entran y salen; Enter activa botón y enlace; Espacio activa el botón. El comportamiento es el nativo, sin manejadores propios.
- **Enlace deshabilitado:** un `<a>` con `disabled` (o `loading`) se renderiza sin `href`, con `role="link"`, `aria-disabled="true"` y `tabindex="-1"`.
- **`loadingText`:** el anuncio vive en una región `role="status"` **fuera** del botón (los hijos de un botón son presentacionales y no se anuncian). Con `loadingText` el componente tiene por eso dos nodos raíz (botón y región, presente y vacía hasta la carga) y pasa `$attrs` al botón, no a la región; **sin `loadingText`, solo el botón** (#257).
- **Foco:** contorno sólido visible con `:focus-visible`; ancho, color y separación salen del tema.
- **Área táctil:** el botón más pequeño tiene una zona de toque de al menos 24px de alto; en pantallas táctiles (`pointer: coarse`), 44px.
- **Contraste:** con el tema por defecto y con el tema de prueba de la auditoría, el texto de todas las combinaciones de color y variante en reposo llega a 4.5:1 o más, y el borde de `outline` a 3:1 o más.

## Movimiento

- Color, fondo y borde cambian en `--g-duration-fast` (120ms).
- Al pulsar, el botón se encoge a `--g-press-scale` (0.97) en `--g-duration-press` (160ms). No se encogen los botones deshabilitados, en carga ni la variante `link`.
- Con `prefers-reduced-motion: reduce`, las transiciones se quitan, no hay escala al pulsar y el indicador de carga sigue girando, 2.5 veces más lento.

## Tema

El componente solo lee tokens `--g-*`; no lleva colores ni medidas propias. Para cambiar su aspecto, redefine los tokens en tu CSS **sin capa** (siempre gana sobre el tema por defecto):

```css
:root {
  --g-color-primary: #0b1f4d;
  --g-color-primary-strong: #1e3464;
  --g-color-primary-soft: #eaf0fd;
  --g-color-primary-text: #0b1f4d;
  --g-color-on-primary-soft: #0b1f4d;
  --g-radius-shape: var(--g-radius-pill); /* botones de píldora */
}
```

Tokens que consume: `--g-color-{color}` (y `-strong`, `-soft`, `-text`), `--g-color-on-{color}` (y `-soft`), `--g-color-focus`, `--g-radius-*`, `--g-radius-shape`, `--g-space-1..6`, `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line}`, `--g-text-action-weight`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-spin`, `--g-ease-standard`, `--g-ease-out`, `--g-press-scale`. La definición de cada uno está en `docs/contract/tokens.md`.

## Clases

Las emite el componente y las estiliza `GBtn.css`: `g-btn`, `g-btn--color-*`, `g-btn--variant-*`, `g-btn--size-*`, `g-btn--density-*`, `g-btn--rounded-*` (solo si se pasa `rounded`), `g-btn--block`, `g-btn--icon`, `is-disabled`, `is-loading`, y los elementos `g-btn__prepend`, `g-btn__label`, `g-btn__append`, `g-btn__loader` y `g-btn__status`.

## Limitaciones conocidas

- Con `density="comfortable"` y ciertos valores de espacio, la altura es fraccionaria (por ejemplo 39.375px) y el borde puede verse difuso en pantallas de baja densidad. Está pendiente evaluar `round()` de CSS.
- No hay tema oscuro todavía.
- Sin verificar en navegador: la escala al pulsar vista a mano, la emulación de `prefers-reduced-motion` y `forced-colors` (las reglas están escritas), y hover/active de las variantes `soft`, `outline`, `ghost` y `link`.

## Fuentes

- API: [`GBtn.meta.json`](./GBtn.meta.json) · Contrato: [`design/contracts/btn.md`](../../../../../design/contracts/btn.md) · Prototipo: [`design/lab/btn/r01/`](../../../../../design/lab/btn/r01/) · Auditoría: [`design/lab/btn/auditoria.md`](../../../../../design/lab/btn/auditoria.md)
