# Contrato · GBtn

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/btn/r01/` (kiwi)
**Tag:** `g-btn` · **Categoría:** acciones

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida |
| `variant` | String | `solid` `soft` `outline` `ghost` `link` | `solid` | compartida |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | compartida |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | sin valor: `md`, o `pill` si el tema tiene `shape: "pill"` | compartida |
| `block` | Boolean | | `false` | compartida |
| `disabled` | Boolean | | `false` | compartida |
| `loading` | Boolean | | `false` | compartida |
| `type` | String | `button` `submit` `reset` | `button` | propia |
| `href` | String | URL | sin valor | propia |
| `icon` | Boolean | | `false` | propia |
| `loadingText` | String | texto libre | sin valor | propia |

### Reglas de props propias

- **`type`:** se ignora cuando hay `href`.
- **`href`:** renderiza `<a>`. Con `disabled` (o `loading`), el `<a>` se renderiza **sin** `href`, con `aria-disabled="true"` y `tabindex="-1"`.
- **`icon`:** botón cuadrado (ancho = altura). Exige `aria-label`; en desarrollo, si falta, se emite `console.warn`. En producción no hay advertencia.
- **`loadingText`:** texto que se anuncia a lectores de pantalla cuando `loading` pasa a `true`. **Sin valor por defecto**, porque Grana es internacional: un texto fijo estaría en el idioma equivocado para la mayoría. Sin `loadingText`, solo queda `aria-busy`.

## Mecanismo de `loadingText`

**Hechos que condicionan la estructura:**

1. Los hijos de un `role="button"` son **presentacionales**: una región viva dentro del botón es ignorada por las tecnologías de asistencia. El anuncio tiene que vivir **fuera** del botón.
2. Una región viva solo se anuncia de forma confiable si **ya existe en el DOM** antes de que cambie su contenido.

**Estructura resultante:**

```html
<button class="g-btn is-loading" aria-disabled="true" aria-busy="true">…</button>
<span class="g-btn__status" role="status">Guardando…</span>  <!-- visualmente oculto, siempre presente -->
```

- La región `role="status"` (educada, `aria-live="polite"` implícito) se renderiza **siempre**. Está vacía mientras no hay carga.
- Al entrar en `loading`, recibe `loadingText`. Al salir, se vacía.
- El nombre accesible del botón no cambia: sigue siendo su etiqueta.
- El componente tiene **dos nodos raíz**. Por eso usa `inheritAttrs: false` y pasa `$attrs` al botón (o enlace), no a la región.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `click` | `MouseEvent` | Activación con puntero o teclado, **nunca** con `disabled` o `loading` |

**Nota para bruno:** `click` debe declararse en `emits`. Si no se declara, el `@click` del consumidor llegaría al `<button>` a través de `$attrs` y se dispararía aunque el botón esté cargando, porque `aria-disabled` no bloquea el evento nativo.

## Slots

| Slot | Propósito | Anatomía que debe conservar |
| --- | --- | --- |
| `default` | Etiqueta (o el icono, si `icon`) | Contenido de texto; nunca elementos interactivos |
| `prepend` | Icono antes de la etiqueta | Decorativo: el componente lo envuelve con `aria-hidden="true"` |
| `append` | Icono después de la etiqueta | Igual que `prepend` |

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-{color}`, `--g-color-on-{color}` | `solid`: fondo y texto |
| `--g-color-{color}-strong` | `solid`: hover y activo |
| `--g-color-{color}-soft`, `--g-color-on-{color}-soft` | `soft`: fondo y texto; hover de `outline` y `ghost` |
| `--g-color-{color}-text` | Texto de `outline`, `ghost` y `link`; borde de `outline` |
| `--g-color-focus` | Anillo de foco |
| `--g-radius-{rounded}` | Esquinas |
| `--g-space-1` | Unidad para altura (6, 7, 9, 11 y 13 unidades), padding y separación |
| `--g-font-ui` | Familia |
| `--g-text-caption-size` (`xs`), `--g-text-body-sm-size` (`sm`, `md`), `--g-text-body-size` (`lg`, `xl`) | Tamaño de la etiqueta |

**Tokens nuevos:** ninguno.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Entra y sale en el orden del documento |
| Enter | Activa (botón y enlace) |
| Espacio | Activa (solo botón) |

Sin manejadores de teclado propios: el comportamiento es el nativo.

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | ¿`density` reduce la altura? | **Sí:** altura × 1, 0.875 o 0.75, con piso de 24px. Actualizado en `docs/contract/tokens.md` §4 | Una tabla compacta con botones de altura completa no gana densidad |
| 2 | ¿Texto de carga para lectores de pantalla? | Prop `loadingText` con región viva externa (ver arriba) | Decisión del usuario; mecanismo por WCAG 4.1.3 (mensajes de estado) |
| 3 | `href` + `disabled` | Regla incorporada en "Reglas de props propias" | Un enlace no tiene estado deshabilitado nativo |
| 4 | `type` fuera de la API compartida | Prop propia, por defecto `button` | Evita envíos accidentales |
