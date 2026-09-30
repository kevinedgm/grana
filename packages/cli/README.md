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
  "dark": true,
  "overrides": { "--g-glass-opacity": "0.7" }
}
```

De `brand` y `accent` se derivan (en OKLCH) `strong`, `soft`, `on`, `text` y `on-soft` con contraste garantizado. Los colores semánticos y cualquier otro token se ajustan con `overrides`.

## Tema oscuro (`dark`)

Por defecto (`dark: true`) el CLI deriva **la variante oscura de lo que cambias** y la emite junto al claro (contrato `docs/contract/tokens.md` §15): el tema sigue al sistema (`prefers-color-scheme`) y se puede forzar con `data-theme="dark"` o `"light"` en cualquier elemento.

```json
{ "brand": "#0B1F4D", "dark": { "brand": "#8FACE5", "overrides": { "--g-color-text": "#ECECEC" } } }
```

| Valor | Efecto |
| --- | --- |
| `true` (por defecto) | Deriva el oscuro de `brand` y `accent` (en OKLCH: la base clara se conserva o se refleja y sube hasta 4.5:1 sobre la superficie oscura) |
| `{ brand, accent, overrides }` | `brand` y `accent` son colores explícitos del oscuro (se derivan con las mismas reglas); `overrides` solo aplica al oscuro |
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
| `grana theme <config> [--out archivo] [--stdout]` | Valida y escribe `tokens.css` (sin capa, gana siempre). Si algo falla, no escribe nada. |
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
