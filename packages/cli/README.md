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
  "overrides": { "--g-glass-opacity": "0.7" }
}
```

De `brand` y `accent` se derivan (en OKLCH) `strong`, `soft`, `on`, `text` y `on-soft` con contraste garantizado. Los colores semánticos y cualquier otro token se ajustan con `overrides`.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `grana theme <config> [--out archivo] [--stdout]` | Valida y escribe `tokens.css` (sin capa, gana siempre). Si algo falla, no escribe nada. |
| `grana check <config> [--json]` | Solo valida; con `--json`, informe para CI. |
| `--help`, `--version` | Ayuda y versión. |

**Códigos de salida:** `0` correcto (los avisos no cuentan) · `1` el tema rompe un mínimo · `2` uso o configuración inválidos.

## Qué valida (contrato §7 y §12)

Foco ≥ 2px · contraste de texto ≥ 4.5:1 y de bordes de control ≥ 3:1 · texto ≥ 12px · pares `on-*`/`*-text` ≥ 4.5:1 · cristal: opacidad ≥ 0.55 y velo ≥ 4.5:1 sobre negro. Avisa (sin bloquear) de tokens desconocidos, colores que no puede medir y `space` < 4.

## Uso programático

```js
import { buildTheme } from '@grana/cli'
const { ok, css, issues } = buildTheme({ brand: '#7A1F5C' })
```

## Mantenimiento

`src/defaults.js` es copia de `packages/vue/src/styles/defaults.css`. Tras cambiar los defaults: `node packages/cli/scripts/sync-defaults.mjs` (una prueba falla si se desfasan).
