# @grana/cli

Genera el `tokens.css` de tu proyecto a partir de una configuración corta y **rechaza temas que rompan los mínimos de accesibilidad**, explicando cuál y por qué. Sin dependencias; Node ≥ 22.

**Estado: `1.0.0`** (semver: los comandos `theme`, `check` e `init`, los códigos de salida, las claves de configuración, los nombres de los tokens emitidos y los `code` de los diagnósticos son API pública; ver `api.md` «Estabilidad y versiones»). Las referencias `docs/contract/…` y `§n` de este documento remiten al [contrato de tokens](https://github.com/kevinedgm/grana/blob/main/docs/contract/tokens.md) del repositorio; la visión general de Grana está en el [README principal](https://github.com/kevinedgm/grana#readme).

```bash
npx @grana/cli init                       # instala Grana en un proyecto existente (ver abajo)
npx @grana/cli theme grana.config.json    # escribe tokens.css
npx @grana/cli check grana.config.json    # solo valida
```

## Instalar Grana en un proyecto (`init`)

En la raíz de un proyecto **que ya existe** (con `package.json`), una orden instala Grana, deja el tema configurado e imprime lo que falta:

```bash
npx @grana/cli init                  # npm
pnpm dlx @grana/cli init             # pnpm
yarn dlx @grana/cli init             # yarn ≥ 2
bunx @grana/cli init                 # bun
npx @grana/cli init --brand '#7A1F5C'   # con el color de tu marca
```

`init` **no crea proyectos** (para eso, `npm create vue@latest` o `npm create vite@latest`) y **no edita el código de tu aplicación**: ni `main.*`, ni `vite.config.*`, ni `nuxt.config.*`, ni `package.json` (este lo cambia tu gestor al instalar). Imprime las líneas exactas con el archivo donde van y tú las pegas. No pregunta nada, así que sirve igual en CI. Si el tema no es válido, para antes de instalar.

| Opción | Valores | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `--pm` | `npm` `pnpm` `yarn` `bun` | detección (ver abajo) | Fuerza el gestor de paquetes. |
| `--brand` | un color de la clave `brand` | — | Escribe `{ "brand": "<color>" }` en un `grana.config.json` nuevo y valida el tema antes de instalar. Con un `grana.config.json` existente y sin `--force`, error (código 2). |
| `--theme` | `auto` `vite` `file` | `auto` | Cómo llega el tema a la aplicación. `auto`: Nuxt → `file`; Vite → `vite`; el resto → `file`. `vite` con Nuxt está reservado y da error (código 2). |
| `--out` | ruta dentro del directorio actual | `tokens.css` | Dónde se escribe el tema en el modo `file`. Con el modo `vite` o fuera del directorio, error (código 2). |
| `--no-install` | — | instala | No ejecuta la instalación: imprime las órdenes. Los archivos se escriben igual. |
| `--dry-run` | — | — | No instala ni escribe nada: imprime el plan completo. Corre las mismas comprobaciones previas. Si va con `--no-install`, manda `--dry-run`. |
| `--force` | — | — | Sobrescribe `grana.config.json` y un archivo de tema que no generó Grana. No afecta a la instalación. |

**Qué instala** (lo ya declarado en `dependencies`, `devDependencies` o `peerDependencies` no se reinstala ni cambia de rango):

| Paquete | Dónde | Rango |
| --- | --- | --- |
| `@grana/vue` | `dependencies` | `^M.0.0`, con `M` la mayor del CLI |
| `vue` | `dependencies` | `^3.5.0`, solo si falta (con aviso: `init` no prepara un empaquetador) |
| `@grana/cli` | `devDependencies` | `^V`, con `V` la versión exacta del CLI |

La orden de instalación se imprime tal como se ejecuta. Si tu `vue` es anterior a 3.5 o no es de la mayor 3, `init` para con el código 2 sin instalar nada.

**Qué escribe, y qué no.** Solo archivos de Grana, en el directorio actual y siempre después de que la instalación haya ido bien:

| Archivo | Si no existe | Si existe |
| --- | --- | --- |
| `grana.config.json` | se escribe (`{}` si no hay `--brand`: el tema por defecto) | se conserva; `--force` lo sobrescribe |
| tema en `--out` (solo modo `file`) | se escribe, el mismo CSS que `grana theme` | se regenera si empieza por la cabecera de `@grana/cli`; si no, error (código 2) salvo `--force` |

Nunca borra archivos ni escribe fuera del directorio actual.

**Detección del gestor** (gana el primero que responde; la salida dice cuál fue y de dónde):

1. `--pm`.
2. Campo `packageManager` del `package.json` (o, si no lo tiene, el de la raíz del *workspace*). Un nombre fuera de los cuatro, error: usa `--pm`.
3. Archivo de bloqueo, buscado hacia arriba hasta un directorio con `.git`: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock` o `bun.lockb` → bun, `package-lock.json` o `npm-shrinkwrap.json` → npm. Con dos gestores distintos en el mismo directorio, error (código 2): no se adivina.
4. `npm_config_user_agent` (lo pone el gestor que lanzó la orden). Va detrás del bloqueo porque `npx` dice npm aunque el proyecto sea de pnpm.
5. npm.

`init` se ejecuta en el paquete de la aplicación: en la raíz de un *workspace* (`workspaces` en `package.json` o `pnpm-workspace.yaml`) da error (código 2); en un paquete dentro de uno, instala en ese paquete.

**Qué imprime para ti** al terminar (no edita nada):

- Modo `vite`: en tu `vite.config.*`, `import grana from '@grana/cli/vite'` y `grana({ config: 'grana.config.json' })` en `plugins`; en tu entrada, `import 'virtual:grana/tokens.css'`.
- Modo `file`: en tu entrada, la importación del archivo de tema, y el *script* `"theme": "grana theme grana.config.json"` que puedes añadir a `package.json` para regenerarlo.
- En los dos: en tu entrada (`src/main.{ts,js,mts,mjs}` si existe), `import Grana from '@grana/vue'`, `import '@grana/vue/style.css'`, `import '@grana/vue/fonts.css'` (opcional, la fuente por defecto) y `app.use(Grana)`.
- Nuxt: el contenido de un *plugin* (`plugins/grana.ts` o `.js`) con `nuxtApp.vueApp.use(Grana)` y la cadena `css` de `nuxt.config`.

**Códigos de salida de `init`:** `0` correcto (también con `--no-install` y `--dry-run`) · `1` el tema rompe un mínimo de accesibilidad · `2` uso o precondición (opción inválida, sin `package.json`, raíz de *workspace*, Vue incompatible, gestor desconocido o ambiguo, configuración inválida, choque de archivos sin `--force`) · `3` la instalación falló o el gestor no está en el sistema (solo `init` lo emite). Con 1 y 2 no se instala ni se escribe nada; con 3 no se escribe ningún archivo de Grana, pero el gestor puede haber dejado cambios en `package.json` y en el bloqueo, y la salida da la orden para reintentar a mano.

**Hoy** `@grana/vue` y `@grana/cli` aún no están en el registro de npm, así que `npx @grana/cli init` y la instalación que lanza no pueden resolverse todavía: darían el código 3 sin escribir archivos. Hasta la publicación, instala desde el repositorio (ver el [README principal](https://github.com/kevinedgm/grana#probarlo-en-este-repositorio)).

**Verificación.** `medido` a mano el 2026-11-13: en un proyecto Vite + Vue 3.5 limpio, `grana init --brand '#7A1F5C' --no-install` (ejecutado con el tarball de `@grana/cli`) escribió solo `grana.config.json`, detectó npm por `package-lock.json` y el modo `vite`, e imprimió las órdenes de instalación y las líneas para `vite.config.js` y `src/main.js`; tras instalar los dos tarballs y pegarlas, `vite build` pasó y en el navegador `<g-btn variant="soft">` se pintó con `--g-color-brand: #7A1F5C`. **Sin verificar:** la instalación desde el registro, pnpm, yarn y bun reales, Windows y Nuxt.

Fuentes: contrato `design/contracts/cli-init.md` y decisión #1078 de `DECISIONS.md`; la ayuda de `grana --help` y `packages/cli/src/init.js` mandan si algún texto difiere.

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
| `grana init [--pm …] [--brand <color>] [--theme auto\|vite\|file] [--out archivo] [--no-install] [--dry-run] [--force]` | Instala Grana en un proyecto existente, valida el tema, escribe `grana.config.json` e imprime las líneas que añadir a tu código ([detalle](#instalar-grana-en-un-proyecto-init)). |
| `--help`, `--version` | Ayuda y versión. |

**Códigos de salida:** `0` correcto (los avisos no cuentan) · `1` el tema rompe un mínimo · `2` uso o configuración inválidos · `3` la instalación de `init` falló (solo `init`).

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
