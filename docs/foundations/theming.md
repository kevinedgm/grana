# Tema y tokens

> **Estado:** `pre-alpha` · **Paquetes:** `aún no publicados` · **Versión actual:** `0.0.0`

Grana separa interfaz e identidad: los componentes resuelven comportamiento y accesibilidad; el tema decide color, tipografía, espacio, radios y movimiento.

## Crea un tema

```json
{
  "brand": "#7A1F5C",
  "accent": "#0F766E",
  "radius": 12,
  "shape": "rounded",
  "space": 4,
  "font": "Inter",
  "fontSize": 16,
  "typeScale": 1.25,
  "dark": true
}
```

Guarda la configuración como `grana.config.json` y genera los tokens:

```bash
npx @grana/cli theme grana.config.json --out src/styles/grana.css
```

El CLI rechaza temas que rompan contraste, foco, tamaño mínimo de texto o legibilidad.

## Niveles de tokens

| Nivel | Qué contiene | Cómo se usa |
| --- | --- | --- |
| Entrada de tema | `brand`, `accent`, `radius`, `space`, fuentes y `dark`. | Se define en `grana.config.json`. |
| Referencia | Escalas derivadas de color, radio, espacio, tipografía, duración y foco. | El CLI las calcula. |
| Semántico | Intención: acción, foco, superficie, texto, borde, peligro o éxito. | Los componentes consumen estos tokens. |
| Componente | Una decisión específica como `--g-calendar-now-color`. | Sólo existe si no hay un token global o semántico que la exprese. |

## Qué controla cada entrada

| Entrada | Controla |
| --- | --- |
| `brand` | Marca o color base. |
| `primary` | Acción principal cuando difiere de la marca; sin valor usa `brand`. |
| `accent` | Foco, enlaces, selección y estados activos. |
| `radius` y `shape` | Escala de radios y forma de botones, chips e insignias. |
| `space` | Ritmo de separación y tamaños de control. |
| `font`, `fontDisplay`, `fontSize`, `typeScale` | Tipografía y jerarquía. |
| `neutrals` y `neutralsHue` | Grises puros o teñidos. |
| `categories` | Serie de colores para datos categóricos. |
| `dark` | Variante oscura derivada, explícita o desactivada. |

## Claro y oscuro

Con `"dark": true`, Grana genera ambos esquemas y sigue la preferencia del sistema. Puedes fijar un contexto con `data-theme="light"` o `data-theme="dark"`.

No escribas sólo un par de variables en `:root`: podrías dejar derivados o el modo oscuro con valores incongruentes. Genera el CSS con el CLI.

## Personalización avanzada

Usa `overrides` sólo para tokens que ya entiendas y no tengan una entrada de tema de más alto nivel:

```json
{
  "brand": "#7A1F5C",
  "overrides": {
    "--g-glass-opacity": "0.7",
    "--g-color-success": "#0F766E"
  }
}
```

Los overrides pasan por la misma validación. Una clave de configuración desconocida es un error.

## Validación y diagnóstico

```bash
npx @grana/cli check grana.config.json
npx @grana/cli theme grana.config.json --doc
```

Con `--doc`, el CLI genera también `tokens.json` con origen, valores claro y oscuro, uso, contraste y estado de cada token.

## Reglas que no se tematizan

El tema puede cambiar identidad, pero no rebajar:

- foco visible de al menos 2px;
- contraste de texto de al menos 4.5:1;
- contraste de controles de al menos 3:1;
- texto de al menos 12px;
- área táctil de 44px cuando `pointer: coarse` aplica.

## Referencia completa

Consulta el [Contrato de tokens](../contract/tokens.md) para la lista exhaustiva y el [README de `@grana/cli`](../../packages/cli/README.md) para comandos, plugin de Vite y diagnóstico.
