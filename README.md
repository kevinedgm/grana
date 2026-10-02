# Grana

> *The only bug you'll want in your UI.*

Componentes Vue 3 accesibles y tematizables por tokens. Grana fija el comportamiento; tu producto define el look.

> **No te impone un estilo visual.** Te da consistencia, accesibilidad y una capa de tema para que cada producto conserve su propia identidad.

El nombre viene de la **grana cochinilla**, el insecto oaxaqueño cuyo tinte coloreó medio mundo. Grana funciona igual: un armazón fijo y un color que pone cada proyecto.

**Estado:** pre-alfa. El contrato de tokens v0.1 está congelado; la API pública y el catálogo siguen evolucionando antes de una primera versión estable.

**¿Es para tu equipo?** Grana encaja especialmente bien cuando construyes productos Vue con identidad propia y quieres evitar resolver accesibilidad, foco, teclado y consistencia visual en cada pantalla. [Conoce el posicionamiento, casos de uso y límites](docs/foundations/product-positioning.md).

## Cómo se tematiza (objetivo de la v0.1)

```json
{
  "brand": "#F5B940",
  "accent": "#5B3FE0",
  "radius": 20,
  "shape": "pill",
  "space": 4,
  "font": "Instrument Sans",
  "fontDisplay": "Instrument Serif",
  "fontSize": 16,
  "typeScale": 1.4,
  "dark": true
}
```

Todas las claves son opcionales. Sin tema, Grana usa su estilo por defecto. Detalle completo en [docs/contract/tokens.md](docs/contract/tokens.md). El `tokens.css` lo genera [`@grana/cli`](packages/cli/README.md) y **rechaza los temas que rompan los mínimos de accesibilidad** (contraste, foco, tamaño de texto).

## Uso

```js
import '@grana/vue/style.css'   // componentes y tema por defecto
import '@grana/vue/fonts.css'   // fuente por defecto, Instrument Sans (opcional)
```

Si defines tu propia fuente en el tema, omite `fonts.css`.

## Tema oscuro

Grana trae un tema oscuro por defecto (gris casi negro; lo elevado es más claro). **Sigue la preferencia del sistema** y puedes forzarlo con el atributo `data-theme` en cualquier elemento:

```html
<html>                              <!-- automático: sigue al sistema -->
<html data-theme="dark">            <!-- oscuro siempre -->
<html data-theme="light">           <!-- claro siempre, aunque el sistema sea oscuro -->
<section data-theme="dark">…</section>   <!-- una sección oscura dentro de una página clara (o al revés) -->
```

- **Sin cambios en tus componentes:** el oscuro redeclara los mismos tokens de color; los componentes solo leen `var(--g-*)`.
- **Tu tema también tiene oscuro:** con `dark: true` (por defecto), el CLI deriva la variante oscura de tu `brand` y `accent` con el mismo contraste garantizado (4.5:1 para texto, 3:1 para controles) y valida **los dos esquemas**. Puedes fijar colores propios del oscuro con `"dark": { "brand": "#8FACE5", "accent": "#5CC1B6" }` (y `overrides` solo para el oscuro).
- **Genera el tema con el CLI (o el plugin de Vite), no a mano:** un `:root { --g-color-… }` con solo colores claros **no lleva capa y pisa el oscuro** (la superficie y el texto quedarían claros en modo oscuro). Si aun así lo escribes a mano, repite cada token de color dentro de `[data-theme="dark"]` y de `@media (prefers-color-scheme: dark)`.
- **Si no quieres oscuro:** `"dark": false` en el CLI (el sistema oscuro no lo activa), o `data-theme="light"` en `<html>`.
- **Quien use solo los defaults** y no ponga `data-theme` verá el oscuro en un sistema oscuro.
- **Guardar la preferencia** (un interruptor de tema) es de tu aplicación: alterna el atributo y guárdalo donde prefieras.
- **Las imágenes y los iconos** de tu aplicación no se adaptan solos.

Reglas y límites: [docs/contract/tokens.md §15](docs/contract/tokens.md). Verificación: [`design/lab/tema-oscuro/auditoria.md`](design/lab/tema-oscuro/auditoria.md).

## Estructura

| Ruta | Contenido |
| --- | --- |
| `packages/vue/` | `@grana/vue`: componentes, capas CSS y plugin de Vue |
| `packages/cli/` | `@grana/cli`: genera `tokens.css` desde el tema (claro y oscuro) y valida los mínimos de accesibilidad |
| `docs/contract/` | Contrato de tokens y API compartida de props |
| `design/` | Entregas de Fruti Squad: prototipos (kiwi) y contratos por componente (lima) |
| `.agents/skills/bruno/` | Agente que construye los componentes |
| `AGENTS.md` | Reparto de responsabilidades entre agentes |
| `DECISIONS.md` | Registro de decisiones y su porqué |

## Licencia

MIT
