# Referencia de tokens

> **Estado:** `pre-alpha` · **Paquetes:** `aún no publicados` · **Versión actual:** `0.0.0`

Esta página ayuda a decidir qué cambiar en el tema. Para crear el tema desde cero, consulta [Tema y tokens](theming.md).

## Primero: usa las entradas de tema

Empieza con `grana.config.json`. Estas entradas son estables y de alto nivel:

| Entrada | Resultado que afecta |
| --- | --- |
| `brand` | Marca y, por defecto, acción principal. |
| `primary` | Acción principal si no coincide con la marca. |
| `accent` | Foco, enlaces, selección y estados activos. |
| `radius` / `shape` | Forma de botones, chips, insignias y controles. |
| `space` | Separación, tamaño de controles y ritmo visual. |
| `font` / `fontDisplay` / `fontSize` / `typeScale` | Texto, títulos y jerarquía. |
| `neutrals` / `neutralsHue` | Temperatura de fondos, bordes y texto. |
| `dark` | Esquema oscuro derivado o explícito. |

No cambies un token CSS individual si una entrada de tema ya expresa lo que quieres conseguir.

## Grupos de tokens generados

| Grupo | Ejemplos | Consumidores típicos |
| --- | --- | --- |
| Color de marca | `--g-color-brand`, `-strong`, `-soft`, `-text`, `--g-color-on-brand` | Botones, badges y acciones. |
| Color semántico | `--g-color-success`, `warning`, `danger`, `info`, `neutral` | Feedback, estados y acciones contextuales. |
| Superficie y texto | `--g-color-surface`, `surface-sunken`, `text`, `text-muted`, `border-control` | Campos, cards, diálogos, tablas y layouts. |
| Foco | `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Todos los componentes interactivos. |
| Radios | `--g-radius-xs` a `--g-radius-xl`, `--g-radius-pill` | Controles y superficies. |
| Espaciado | `--g-space-1` a `--g-space-16` | Padding, gaps y alturas derivadas. |
| Tipografía | `--g-font-ui`, `--g-text-body-size`, `--g-text-title-size` | Texto de interfaz y encabezados. |
| Movimiento | `--g-duration-fast`, `--g-ease-standard`, `--g-press-scale` | Hover, pulsación y carga. |

## Tokens de componente

Un token de componente existe sólo cuando su intención no puede expresarse con los grupos anteriores.

| Token | Para qué | Componente |
| --- | --- | --- |
| `--g-calendar-now-color` | Línea y marca de la hora actual. | Calendar |
| `--g-surface-shell` / `--g-surface-inset` | Dos niveles de superficie anidada. | Surface y Dialog |
| `--g-glass-opacity` | Opacidad del velo de cristal. | Badge y futuras superficies glass. |
| `--g-sidebar-width` / `--g-sidebar-rail` | Espacio que debe reservar una aplicación para la navegación. | Sidebar |
| `--g-divider-inset` | Sangría de un separador dentro de una anfitriona. | Divider |

No trates los tokens de componente como variables de marca universales. Cambiarlos afecta un comportamiento visual concreto.

## Overrides

Para un ajuste avanzado, usa `overrides` en la configuración:

```json
{
  "brand": "#7A1F5C",
  "overrides": {
    "--g-color-success": "#0F766E",
    "--g-glass-opacity": "0.7"
  }
}
```

El CLI valida los overrides en claro y oscuro. Si el ajuste genera un contraste insuficiente, no escribe el CSS.

## Inspecciona el resultado

```bash
npx @grana/cli theme grana.config.json --doc
```

El archivo `tokens.json` generado es la referencia de una configuración concreta: muestra nivel, origen, uso, valores claro/oscuro, contraste y si un valor es default, derivado, ajustado u override.

## Límites importantes

- Cambiar `--g-color-brand` sólo dentro de una sección no vuelve a derivar sus variantes locales.
- Los umbrales de adaptación, el área táctil mínima y las técnicas de texto oculto no son tokens de tema.
- Los componentes consumen `var(--g-*)` sin valores de respaldo; un token faltante es un tema incompleto, no una personalización válida.

## Referencia exhaustiva

Consulta el [Contrato de tokens](../contract/tokens.md) para nombres, derivaciones y reglas completas.
