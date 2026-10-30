# @grana/cli

Genera el `tokens.css` de tu proyecto a partir de una configuración corta y **rechaza temas que rompan los mínimos de accesibilidad**, explicando cuál y por qué. Sin dependencias; Node ≥ 22.

**Estado: `0.1.0-beta`** (la API puede cambiar entre betas). Las referencias `docs/contract/…` y `§n` de este documento remiten al [contrato de tokens](https://github.com/kevinedgm/grana/blob/main/docs/contract/tokens.md) del repositorio; la visión general de Grana está en el [README principal](https://github.com/kevinedgm/grana#readme).

```bash
npx @grana/cli init                       # instala Grana en un proyecto Vite + Vue 3
npx @grana/cli theme grana.config.json    # escribe tokens.css
npx @grana/cli check grana.config.json    # solo valida
```

## `init`: instalar Grana en un proyecto Vite + Vue 3

```bash
npx @grana/cli init [directorio] [opciones]
```

> **Aviso: los paquetes aún no están en npm** (`0.1.0-beta.0` sin publicar, #442). Hoy `init` solo funciona con **`--from <dir>`** y los `.tgz` de `npm pack` ([ver más abajo](#paquetes-sin-publicar---from)); sin `--from`, la instalación falla con código 4. Esta sección describe el comando tal como queda al publicar.

Se escribe **`npx @grana/cli init`** y no `npx grana init`: `npx grana` resuelve el paquete `grana` del registro, que no es de este proyecto (#996). Dentro de un proyecto que ya tiene `@grana/cli` instalado, `npx grana init` sí funciona, porque el binario se llama `grana`. `directorio` es la raíz del proyecto (por defecto, el actual); no admite más de uno.

Contrato: [`design/contracts/cli-init.md`](https://github.com/kevinedgm/grana/blob/main/design/contracts/cli-init.md); decisiones #996 a #1003.

### Qué detecta

Antes de preguntar o escribir nada, y en este orden; la primera comprobación que falla termina con su código (3 salvo la del gestor):

1. `package.json` en la raíz, válido.
2. **Nuxt** (dependencia `nuxt` o un `nuxt.config.*`): no está soportado, código **3**. Nuxt está **reservado**; instala a mano con el [README principal](https://github.com/kevinedgm/grana#instalación).
3. **Vue 3** (por `node_modules/vue` o por el rango declarado). Con una versión menor que 3.5 avisa, porque `@grana/vue` pide `vue ^3.5.0`, pero no bloquea.
4. **Vite** (avisa bajo la versión 5).
5. El **archivo de entrada**: el `src` del primer `<script type="module">` de `index.html` o, si no, el primero que exista de `src/main.ts`, `main.js`, `main.mts`, `main.mjs`. Si no lo encuentra no falla: ese paso pasa a «pasos a mano».
6. `vite.config.ts`, `.mts`, `.js` o `.mjs`. Si no existe, no lo crea: da el archivo completo para que lo crees tú.
7. El **gestor de paquetes**: `--pm` manda; si no, el archivo de bloqueo (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`, `bun.lock`/`bun.lockb`), luego `packageManager` y luego el agente que lanzó el comando. Con varios archivos de bloqueo y sin `--pm` ni `packageManager`, código **2**.

Si hay cambios sin commitear en un archivo que va a editar, avisa y te pide revisar el diff.

### Las cuatro preguntas

Cada una con su valor por defecto entre corchetes; Intro lo acepta. Se hacen con `node:readline/promises`, sin biblioteca de prompts (#998), y sus respuestas pasan por las mismas reglas que `grana.config.json`.

| Pregunta | Valores | Por defecto | Opción | Clave en `grana.config.json` |
| --- | --- | --- | --- | --- |
| Color de marca (hex) | `#RGB`, `#RRGGBB`, con o sin `#`; vacío = el de Grana | vacío (sin clave) | `--brand <hex>` | `brand` |
| Forma | `rounded`, `pill` | `rounded` | `--shape rounded\|pill` | `shape` |
| Densidad | `default`, `comfortable`, `compact` | `default` | `--density <paso>` | `density` |
| Modo oscuro | sí / no | sí | `--dark` / `--no-dark` | `dark` |

El tema se **valida con el motor real antes de tocar el proyecto**. En interactivo, una marca que rompe un mínimo de accesibilidad enseña el informe y vuelve a preguntar el color («Elige otro color o pulsa Intro para el de Grana»); con `--yes` termina con código 1. Un contraste que no llega se informa **truncado** a dos decimales (`2.99:1, mínimo 3:1`), nunca redondeado hacia el mínimo.

### Qué instala y qué edita

| Qué | Cómo |
| --- | --- |
| Dependencias | `@grana/vue` en `dependencies` y `@grana/cli` en `devDependencies`, a la **versión exacta del CLI que corre** (no `latest`), con el gestor detectado |
| `grana.config.json` | Si no existe, lo escribe con tus respuestas (`brand` solo si diste uno; `shape`, `density` y `dark` siempre). Si existe y es válido, **lo conserva** |
| `vite.config.*` | `import grana from '@grana/cli/vite'` y `grana()` como primer elemento de `plugins` |
| Entrada (`src/main.*`) | `import '@grana/vue/style.css'`, `import '@grana/vue/fonts.css'` e `import 'virtual:grana/tokens.css'`, tras la última importación |

El tema va por el **plugin de Vite** (ver [Plugin de Vite](#plugin-de-vite)): `grana.config.json` es la única fuente, se recarga al guardarlo y el tema se valida en cada `vite build`. Con `--theme file` escribe en su lugar `src/grana-tokens.css`, lo importa en la entrada y añade el script `grana:theme` a `package.json`, sin tocar `vite.config`.

### Registro de componentes: por nombre por defecto

No escribe ningún registro en la entrada: importas cada componente donde lo usas.

```vue
<script setup>
import { GBtn } from '@grana/vue'
</script>

<template>
  <g-btn>Guardar</g-btn>
</template>
```

Es lo que ahorra peso: importar solo `GBtn` añade ≈ 10,9 KB gzip (#444), mientras que `app.use(Grana)` arrastra todo el paquete principal (`grana.js`, ≈ 219 KiB gzip), unas **17 veces más** (#1000). Con **`--register global`** añade `import Grana from '@grana/vue'` y `.use(Grana)` a la entrada, y las etiquetas `<g-btn>` funcionan sin importar nada, pero esa primera carga la pagan tus usuarios finales. `app.use(Grana)` no registra las entradas propias (`@grana/vue/combobox`, `/slider`…): esas se registran aparte. Para registrar solo lo usado en etiquetas globales hay un resolvedor reservado (#1000).

`--example` crea `src/GranaExample.vue` (dos `GBtn`); no edita `App.vue` y el resumen te dice cómo montarlo. Si el archivo existe, no lo toca.

### Seguridad de las ediciones

1. **Planifica antes de escribir.** Muestra la orden de instalación exacta y, de cada archivo, su **diff unificado**, y pide confirmación una a una (`[S/n]`). Con `--yes` no pregunta, pero imprime los diffs igual.
2. **Instala primero.** Si el gestor falla (código 4), no se escribe ningún archivo. Si respondes «no» a la instalación, termina con código 5 y nada escrito.
3. **Escrituras atómicas** que conservan el final de línea y la sangría del archivo.
4. **Edita por texto, sin parser de JavaScript**, y solo formas que entiende con exactitud. Un archivo se edita entero o no se edita: si su forma no encaja (p. ej. `createSSRApp`, `defineConfig(({ mode }) => …`, `plugins` calculado) o rechazas su diff, queda intacto y el comando termina con código **6** y las líneas exactas a añadir por `stderr` («pasos a mano»). En el caso de un `vite.config` que no entiende, sugiere `--theme file`.
5. **Idempotente.** Cada parte se comprueba por separado (dependencias, configuración, importaciones, plugin); si todo está hecho, dice «Grana ya está instalado en <dir>; nada que cambiar.», sale con 0 y no escribe ni ejecuta el gestor. Si falta una parte, solo planifica esa.
6. **`--dry-run`** hace la detección, las preguntas y la validación, imprime los diffs y la orden de instalación y **no escribe ni instala nada**. Su código es el que daría la ejecución real (0, 6…), nunca 5.

Con un `grana.config.json` existente y `--yes`, las opciones de tema (`--brand`, `--shape`…) se **ignoran con aviso** por `stderr`; para cambiar el tema, edita el archivo.

### Opciones

| Opción | Efecto |
| --- | --- |
| `-y`, `--yes` | Sin preguntas ni confirmaciones: toma las opciones dadas y los valores por defecto; imprime los diffs igual |
| `--dry-run` | Enseña diffs y órdenes; no escribe ni instala |
| `--brand <hex>` | Color de marca |
| `--shape rounded\|pill` | Forma |
| `--density default\|comfortable\|compact` | Densidad |
| `--dark` / `--no-dark` | Con o sin tema oscuro |
| `--register named\|global` | Registro de componentes (por defecto `named`) |
| `--theme plugin\|file` | Plugin de Vite o `src/grana-tokens.css` (por defecto `plugin`) |
| `--example` | Crea `src/GranaExample.vue` |
| `--pm npm\|pnpm\|yarn\|bun` | Gestor de paquetes (por defecto, el del archivo de bloqueo) |
| `--from <dir>` | Instala los `.tgz` de `npm pack` de `<dir>` |
| `--skip-install` | Escribe los archivos e imprime la orden de instalación sin ejecutarla |
| `--help` | Ayuda de `init` |

Sin terminal interactiva y sin `--yes`, termina con código 2 sin esperar entrada. Una opción desconocida o con valor inválido (`--shape square`) es código 2 con la lista de valores.

### Códigos de salida de `init`

| Código | Significado | ¿Escribió algo? |
| --- | --- | --- |
| 0 | Hecho, o ya estaba instalado | Sí / no |
| 1 | El tema rompe un mínimo de accesibilidad (como `theme`) | No |
| 2 | Uso: opción inválida, `grana.config.json` ilegible o inválido, varios archivos de bloqueo sin `--pm`, sin terminal y sin `--yes` | No |
| 3 | Proyecto no compatible: sin `package.json`, sin Vue 3, sin Vite o Nuxt | No |
| 4 | Falló el gestor de paquetes, o `--from` sin los `.tgz` necesarios | Ningún archivo |
| 5 | Cancelado: «no» a la instalación o Ctrl+C | No |
| 6 | Hecho con **pasos a mano pendientes** | Sí, lo demás |

Los avisos no cambian el código. Por **`stdout`** van las preguntas, los diffs, las órdenes previstas y el resumen `✔`; por **`stderr`**, errores, avisos (`⚠`), el informe de un tema inválido y los pasos a mano. Así `grana init --dry-run --yes > cambios.diff` guarda solo diffs y resumen.

El resumen final lista los archivos escritos, lo instalado, **lo que derivó del tema** (`brand`, `on-brand` y su contraste medido) y la **orden no interactiva equivalente** a tus respuestas (`npx @grana/cli init --yes --brand '#7A1F5C' --shape pill --density default --dark`), para el resto del equipo o la integración continua.

### Paquetes sin publicar: `--from`

Mientras `@grana/vue` y `@grana/cli` no estén en npm, la instalación desde el registro falla (código 4, con el mensaje «@grana/vue todavía no está en npm: prueba con --from…»). Genera los `.tgz` en el repositorio de Grana y pásalos:

```bash
npm run build                                   # packages/vue/dist es necesario
mkdir -p /tmp/grana-tgz
(cd packages/vue && npm pack --pack-destination /tmp/grana-tgz)
(cd packages/cli && npm pack --pack-destination /tmp/grana-tgz)
# deja grana-vue-0.1.0-beta.0.tgz y grana-cli-0.1.0-beta.0.tgz

cd mi-app-vite
node <repo>/packages/cli/bin/grana.mjs init --from /tmp/grana-tgz
```

`<dir>` debe tener `grana-vue-<versión>.tgz` y `grana-cli-<versión>.tgz` (la versión del CLI que corre o, si no está, la única que haya); si falta alguno, código 4 antes de instalar nada. Son **solo `.tgz`, no carpetas**: instalar una carpeta crea un enlace simbólico y la aplicación resolvería `vue` desde el `node_modules` del repositorio (dos copias de Vue) (#1002). `package.json` queda con rutas `file:`; **cámbialas por la versión de npm cuando se publique**.

### Verificación

| Qué | Nivel | Dónde |
| --- | --- | --- |
| 73 pruebas unitarias de `init` (detección, formas de edición, validación, códigos, salidas) | prueba, 73/73 | `packages/cli/test/init.test.js` |
| Extremo a extremo sobre las plantillas reales de `npm create vite@latest` `vue` y `vue-ts`: instalación desde `.tgz`, `npm run build` (con `vue-tsc -b`), Chromium (marca, `.g-btn`, fuente), segunda ejecución y `--dry-run` sin cambios, rechazo de `vanilla`, Nuxt y sin `package.json` | medido, 42/42 en Chromium (según bruno, commit 521d1da; con red) | `packages/cli/scripts/init-e2e.mjs` |
| Borde de solo lectura con neutros teñidos y contraste truncado (`#0F766E` ya pasa; 0 fallos en 2000 marcas) | prueba, 5/5 | `packages/cli/test/readonly-border.test.js` |

Comprobado al documentar: las 78 pruebas anteriores en verde y `init --dry-run --yes` sobre un directorio sin `package.json` sale con código 3 y el mensaje por `stderr`.

**Sin verificar:** yarn y bun reales (solo con el doble del gestor), Windows, Ctrl+C en una terminal real y la instalación desde el registro de npm (los paquetes no están publicados). El extremo a extremo solo se ejecutó en Chromium. El script de extremo a extremo no se reejecutó al documentar (necesita red).

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
| `grana init [dir] [opciones]` | Instala Grana en un proyecto Vite + Vue 3 (ver [`init`](#init-instalar-grana-en-un-proyecto-vite--vue-3)). |
| `grana theme <config> [--out archivo] [--stdout] [--doc[=archivo]]` | Valida y escribe `tokens.css` (sin capa, gana siempre). Si algo falla, no escribe nada. |
| `grana check <config> [--json]` | Solo valida; con `--json`, informe para CI. |
| `--help`, `--version` | Ayuda y versión. |

**Códigos de salida:** `0` correcto (los avisos no cuentan) · `1` el tema rompe un mínimo · `2` uso o configuración inválidos. `init` añade `3` a `6` (tabla en su sección).

**Avisos y notas salen siempre por `stderr`** (`theme` y `check` sin `--json`). Por `stdout` solo va el CSS (con `--stdout`) o las líneas de resumen `✔`; por eso `grana theme grana.config.json --stdout > tokens.css` produce CSS válido aunque haya avisos. `check --json` no cambia.

## Densidad y texto

La clave `density` (`"default"`, `"comfortable"` o `"compact"`; otro valor es un error) fija la densidad de todo el producto; `default` no emite nada. Con `comfortable` o `compact` el CLI escribe `--g-density` en una regla `:root:where(:not([data-g-density]))`, que cede ante `<html data-g-density>`, ante las regiones y, con puntero grueso, ante el dedo. Reglas de precedencia y de uso: [README principal](https://github.com/kevinedgm/grana#densidad-global-y-por-región).

**El texto baja con `compact`** (contrato `design/contracts/density.md` §16, decisiones #986 a #995): cada rol toma `min(paso normal, max(12px, paso normal × 15/16))`, con su interlineado por la regla de `tokens.md` §5.1. `comfortable` no cambia el texto. El CLI calcula esa escala **sobre tu tipografía**, con la misma función con la que genera `fontSize` y `typeScale`.

| Tu configuración | Qué emite para el texto |
| --- | --- |
| Sin `fontSize`, `typeScale` ni `--g-text-*` en `overrides`, y sin `density: "compact"` | Nada de texto (`tokens.css` sin cambio): mandan los valores de `grana.defaults` |
| Fija tipografía (`fontSize`, `typeScale` o algún `--g-text-*-size`/`-line` en `overrides`) | Cuatro reglas **sin capa** con los valores de tu tema: `[data-g-density="compact"]`, `[data-g-density="default"], [data-g-density="comfortable"]` (la vuelta dentro de una región compacta) y, con `@media (pointer: coarse)`, `[data-g-density]` y la prop explícita `compact` de un componente |
| `density: "compact"` | El texto compacto va **dentro de la misma regla de la clave**, y su valor de paso normal en la consulta táctil; sin selector nuevo |

Sin esas reglas, el `:root` sin capa de tu tema ganaría a la regla en capa de los defaults y una región compacta recibiría la escala **del tema por defecto**, no la tuya. Solo se escriben los roles que cambian, más los que cambia el tema por defecto, para que ninguno herede su valor compacto; `--g-text-*` en `dark.overrides` no entra (el texto no depende del esquema).

**Nota `text-density`.** Si un `--g-text-*` de `overrides` no es una longitud en `rem` o `px` (por ejemplo `clamp(…)` o `var(…)`), el CLI no puede derivar su paso compacto: se queda **igual en los tres pasos** y avisa con la nota «`--g-text-…` no es una longitud en rem o px: se queda igual en los tres pasos de densidad.» (por `stderr`).

**Un `tokens.css` escrito a mano no sigue la región (H5).** Un `--g-text-*` que sobrescribas en `:root` fuera del CLI solo vale fuera de los elementos con `data-g-density` (también de las raíces con `density` explícita en un componente): dentro, las reglas del tema lo reasignan. Para cambiar el texto, usa `fontSize`, `typeScale` u `overrides`, que emiten también sus reglas de región. `--g-hero-title-max` no sigue la región (H4).

**Evidencia:** pruebas del CLI en `packages/cli/test/density-text.test.js` (incluida una malla de `fontSize` 12 a 20 y `typeScale` 1,067 a 1,618 sin ningún valor compacto por debajo de 12 px) y comprobación a mano al documentar: con un tema `fontSize` 14, `typeScale` 1,2 y un `clamp(…)` en `--g-text-body-size`, `--stdout > archivo` deja `:root {` como primera regla, las cuatro reglas de región con la nota `text-density` y los avisos solo en `stderr`; con `{ "density": "compact" }` sale el texto en la regla de la clave y su vuelta táctil. Auditoría del CSS por defecto: [`design/lab/density-text/auditoria.md`](https://github.com/kevinedgm/grana/blob/main/design/lab/density-text/auditoria.md) (172/172 en Chromium). Los temas generados en un navegador **no están verificados** con Firefox ni WebKit.

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
