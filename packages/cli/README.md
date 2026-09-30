# @grana/cli

Genera el `tokens.css` de tu proyecto a partir de una configuración corta y **rechaza temas que rompan los mínimos de accesibilidad**, explicando cuál y por qué. Sin dependencias; Node ≥ 20.

```bash
npx @grana/cli theme grana.config.json    # escribe tokens.css
npx @grana/cli check grana.config.json    # solo valida
```

## Configuración

Todas las claves son opcionales (contrato en `docs/contract/tokens.md` §1); una clave desconocida es un error.

```json
{
  "brand": "#7A1F5C",
  "accent": "#0F766E",
  "radius": 12,
  "shape": "pill",
  "space": 4,
  "font": "Inter",
  "fontDisplay": "Instrument Serif",
  "fontSize": 16,
  "typeScale": 1.25,
  "primary": "#7D1230",
  "neutrals": "tinted",
  "neutralsHue": "brand",
  "semanticCollision": "warn",
  "categories": 6,
  "dark": true,
  "overrides": { "--g-glass-opacity": "0.7" }
}
```

`primary` (opcional) es el color de la acción principal cuando no es la marca: sin él, `primary` es un alias de `brand`. De `brand`, `accent` y `primary` se derivan (en OKLCH) `strong`, `soft`, `on`, `text` y `on-soft` con contraste garantizado. Los colores semánticos y cualquier otro token se ajustan con `overrides`.

## Derivación de paleta

Además de `strong`, `soft`, `text` y `on` de `brand` y `accent`, el CLI calcula **por reglas en OKLCH** (contrato `docs/contract/tokens.md` §16):

| Qué | Regla | Cómo controlarla |
| --- | --- | --- |
| **Semánticos sin choque** | Si `success`, `warning`, `danger` o `info` quedan a una distancia OKLab < 0.12 de `brand`/`accent` (en claro u oscuro), el CLI **avisa y propone la alternativa** (la separación mínima: tono ±45°, luminosidad ±0.15). Con `"semanticCollision": "adjust"` la aplica sola | `semanticCollision` (`warn` por defecto, `adjust`) y `overrides` del token (gana) |
| **Neutros teñidos** | Texto, bordes, superficie hundida y `neutral` con el tono de la marca a croma muy bajo, con contraste garantizado (texto ≥ 4.5:1, control ≥ 3:1) | `"neutrals": "pure"`; `"neutralsHue": "accent"` toma el tono del acento en lugar de la marca (solo el tono; no se infiere) |
| **Categorías** | `--g-color-cat-1` a `cat-N`: mismo L y C, tonos cada 360°/N | `"categories": 6` (0 a 12) |
| **Hover** | `strong` siempre se aleja del fondo de su texto | (regla fija) |

```bash
npx @grana/cli theme grana.config.json --doc     # además de tokens.css, escribe tokens.json
```

`tokens.json` documenta cada token: **nivel** (`reference` o `semantic`), **origen**, valor claro y oscuro, **uso**, contraste medido y **estado** (`default`, `derived`, `adjusted`, `override`); las colisiones sin aplicar llevan `recommended`, y la raíz trae `diagnostics` (`{ "name": "on-brand", "value": { "light": "#FFFFFF", "dark": "#17151A" }, "usage": "…", "contrast": { "against": "--g-color-brand", "light": 8.08, "dark": 7.1 } }`). También lo devuelve `buildTheme` como `doc`.

## Tema oscuro (`dark`)

Por defecto (`dark: true`) el CLI deriva **la variante oscura de lo que cambias** y la emite junto al claro (contrato `docs/contract/tokens.md` §15): el tema sigue al sistema (`prefers-color-scheme`) y se puede forzar con `data-theme="dark"` o `"light"` en cualquier elemento.

```json
{ "brand": "#0B1F4D", "dark": { "brand": "#8FACE5", "overrides": { "--g-color-text": "#ECECEC" } } }
```

| Valor | Efecto |
| --- | --- |
| `true` (por defecto) | Deriva el oscuro de `brand` y `accent` (en OKLCH: la base clara se conserva o se refleja y sube hasta 4.5:1 sobre la superficie oscura) |
| `{ brand, accent, primary, overrides }` | `brand`, `accent` y `primary` son colores explícitos del oscuro (se derivan con las mismas reglas); `overrides` solo aplica al oscuro |
| `false` | Sin tema oscuro: el tema claro se restablece completo dentro de la consulta oscura (el sistema oscuro no activa el oscuro de los defaults). Avisa: `data-theme="dark"` forzado mezclaría el oscuro de los defaults con tus colores claros |

Todo token de color que cambies en el claro (por ejemplo `overrides` de `--g-color-surface`) recibe también su valor oscuro (el de los defaults, o el que pongas en `dark.overrides`): el `tokens.css` no lleva capa y, sin eso, ganaría en el oscuro. **Los dos esquemas se validan** (los mensajes del oscuro empiezan por `[oscuro]`). El oscuro no cambia `radius`, `space`, `font`, `fontSize` ni `typeScale`.

```css
/* tokens.css generado (resumen) */
:root { /* lo que no es de color */ }
:root, [data-theme="light"] { /* colores claros */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; /* colores oscuros */ } }
[data-theme="dark"] { color-scheme: dark; /* colores oscuros */ }
```

## Comandos

| Comando | Qué hace |
| --- | --- |
| `grana theme <config> [--out archivo] [--stdout] [--doc[=archivo]]` | Valida y escribe `tokens.css` (sin capa, gana siempre). Si algo falla, no escribe nada. |
| `grana check <config> [--json]` | Solo valida; con `--json`, informe para CI. |
| `--help`, `--version` | Ayuda y versión. |

**Códigos de salida:** `0` correcto (los avisos no cuentan) · `1` el tema rompe un mínimo · `2` uso o configuración inválidos.

## Qué valida (contrato §7 y §12)

**En los dos esquemas (claro y oscuro):** foco ≥ 2px · contraste de texto ≥ 4.5:1 y de bordes de control ≥ 3:1 · texto ≥ 12px · pares `on-*`/`*-text` ≥ 4.5:1 · cristal: opacidad ≥ 0.55 y velo ≥ 4.5:1 sobre negro. Avisa (sin bloquear) de tokens desconocidos, colores que no puede medir y `space` < 4.

## Plugin de Vite

Genera el tema **en build**, sin archivo intermedio: se importa como módulo virtual.

```js
// vite.config.js
import grana from '@grana/cli/vite'
export default { plugins: [grana({ config: 'grana.config.json' })] }   // la ruta es relativa a la raíz; también acepta el objeto
```

```js
// main.js
import 'virtual:grana/tokens.css'
```

Aplica las mismas reglas que la línea de comandos: si la configuración no es válida o el tema rompe un mínimo de accesibilidad, **la compilación falla** con el motivo (los avisos se muestran sin bloquear). El archivo de configuración se vigila: en desarrollo, al guardarlo se regenera el tema y se recarga la página; si queda inválido, el servidor responde con el error y se recupera al corregirlo. Sin dependencias (no importa `vite`).

## Uso programático

```js
import { buildTheme } from '@grana/cli'
const { ok, css, issues } = buildTheme({ brand: '#7A1F5C' })
```

## Mantenimiento

`src/defaults.js` es copia de `packages/vue/src/styles/defaults.css` (`DEFAULTS`: el tema claro; `DARK`: el grupo de color del bloque `[data-theme="dark"]`). Tras cambiar los defaults: `node packages/cli/scripts/sync-defaults.mjs` (una prueba falla si se desfasan).
