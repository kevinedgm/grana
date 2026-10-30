# Contrato · `grana init` (instalador en un proyecto Vite + Vue 3)

Estado: **contratado por lima** (2026-10-30, #996 a #1003). Lo construye **bruno** en `packages/cli` (sin rondas de kiwi ni CSS de coco: no tiene forma visible). Decisión del usuario del 2026-10-30: «el comando para instalar Grana y que se instale en Vite y todo eso», como `npm create vuetify`. Resumen en `docs/contract/api.md` «Instalador `grana init`»; este archivo manda si difieren.

Fuera de este lote (**reservado**, el usuario lo pospuso): partir el CSS por componente y `grana add <componente>`. También reservados: Nuxt (§9), crear el proyecto desde cero (`npm create grana`, §12), un resolvedor de importación automática (§6.3) y `--json`.

## 1. Comando y alcance

```bash
npx @grana/cli init [directorio] [opciones]
```

- **Se invoca como `npx @grana/cli init`**, no `npx grana init`: `npx grana` resuelve el paquete `grana` del registro, que no es nuestro. Dentro de un proyecto que ya tiene `@grana/cli` instalado, `npx grana init` funciona porque el binario se llama `grana`; la documentación usa siempre la forma con ámbito.
- `directorio` (opcional) es la raíz del proyecto; por defecto, el directorio actual. Un solo positional; más es error de uso (código 2).
- Mismo binario y mismo `run` de `src/cli.js`. `init` vive en su propio módulo (`src/init/…`) y `cli.js` lo carga con `import()` **solo** cuando el comando es `init`: `theme`, `check` y el plugin de Vite no cargan nada nuevo. `run` devuelve `number` para `theme`/`check` (sin cambios) y `Promise<number>` para `init`; `bin/grana.mjs` espera la promesa antes de fijar `process.exitCode`.
- `HELP` añade la línea de `init` y la tabla de códigos de §8.

## 2. Detección (nada se toca hasta pasarla)

Orden de comprobaciones; la primera que falla termina con su código y **no escribe nada**:

1. **`package.json`** en la raíz: si no existe o no es JSON válido → código **3** («No hay package.json en <dir>: ejecuta `grana init` en la raíz de tu aplicación»).
2. **Nuxt** (§9): `nuxt` en `dependencies`/`devDependencies` o un `nuxt.config.{ts,js,mjs,mts}` → código **3**.
3. **Vue 3**: versión de `node_modules/vue/package.json` si existe; si no, la del rango declarado en `dependencies`/`devDependencies`/`peerDependencies` (el primer número del rango es la versión mayor; `latest`, `next`, `*`, `workspace:` y `catalog:` cuentan como «no se sabe»). Mayor ≠ 3 o ausente → código **3** («Grana necesita Vue 3; este proyecto declara vue@<rango>»). Mayor 3 con mínimo < 3.5 → **aviso** (no bloquea): `@grana/vue` pide `vue ^3.5.0` como dependencia par. «No se sabe» → aviso y sigue.
4. **Vite**: `vite` en `devDependencies` o `dependencies` → si no, código **3** («No es un proyecto Vite; para otra configuración, sigue la instalación manual del README»). Mayor < 5 → aviso.
5. **Archivo de entrada**: el `src` del primer `<script type="module" src="…">` de `index.html` en la raíz (ruta relativa a la raíz; `/src/main.ts` → `src/main.ts`); si no hay `index.html` o no tiene ese script, el primero que exista de `src/main.ts`, `src/main.js`, `src/main.mts`, `src/main.mjs`. Si no se encuentra: **no es error**; la edición de la entrada pasa a «pasos a mano» (§5.4) con las líneas exactas.
6. **`vite.config`**: el primero que exista de `vite.config.ts`, `.mts`, `.js`, `.mjs` (el orden de Vite). Si no existe y el tema va por el plugin (§4), pasa a «pasos a mano» con el archivo completo que habría que crear (no se crea solo: un `vite.config` nuevo cambia la configuración por defecto del proyecto).
7. **Gestor de paquetes**: `--pm npm|pnpm|yarn|bun` manda. Si no, por archivo de bloqueo en la raíz: `package-lock.json` → npm, `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock` o `bun.lockb` → bun. Con **varios** archivos de bloqueo: el campo `packageManager` de `package.json` si existe; si no, código **2** («Hay varios archivos de bloqueo (…): elige con --pm»). Sin ninguno: `packageManager`, luego el agente de `npm_config_user_agent` (quien lanzó `npx`/`pnpm dlx`/`bunx`), y si no, npm.
8. **Grana ya instalado** (idempotencia, §5.3): se lee qué partes ya están; no es un error.

Aviso (no bloquea): si la raíz es un repositorio git y alguno de los archivos que se van a editar tiene cambios sin commitear, se dice cuál («Revisa el diff antes de aceptar»).

## 3. Preguntas y opciones

Cuatro preguntas, en este orden, cada una con su valor por defecto entre corchetes; Intro acepta el valor por defecto. Una respuesta inválida se vuelve a preguntar con el mismo mensaje de error que daría `grana check`.

| Pregunta | Valores | Por defecto | Opción equivalente | Clave en `grana.config.json` |
| --- | --- | --- | --- | --- |
| Color de marca (hex) | `#RGB`, `#RRGGBB`, con o sin `#`; vacío = el de Grana | vacío (sin clave) | `--brand <hex>` | `brand` |
| Forma | `rounded`, `pill` | `rounded` | `--shape rounded\|pill` | `shape` |
| Densidad | `default`, `comfortable`, `compact` | `default` | `--density <paso>` | `density` |
| Modo oscuro | sí / no | sí | `--dark` / `--no-dark` | `dark` (`true`/`false`) |

Opciones de comportamiento (todas también en modo interactivo):

| Opción | Efecto |
| --- | --- |
| `--yes`, `-y` | Sin preguntas ni confirmaciones: toma las opciones dadas y los valores por defecto del resto. Nunca sobrescribe un `grana.config.json` existente (§5.2) |
| `--dry-run` | Hace la detección, las preguntas (salvo con `--yes`) y la validación, imprime los diffs y la orden de instalación, y **no escribe ni instala nada**. Su código de salida es el que daría la ejecución real (0, 6…), nunca 5 |
| `--register named\|global` | Registro de componentes (§6). Por defecto `named` |
| `--theme plugin\|file` | Integración del tema (§4). Por defecto `plugin` |
| `--example` | Crea `src/GranaExample.vue` (§7). Por defecto no |
| `--pm npm\|pnpm\|yarn\|bun` | Gestor de paquetes (§2.7) |
| `--from <dir>` | Instala desde los `.tgz` de `npm pack` en `<dir>` (§10) |
| `--skip-install` | No ejecuta el gestor: escribe los archivos e imprime la orden que habría corrido. Para entornos sin red y para las pruebas |
| `--help` | Ayuda de `init` |

- Sin terminal interactiva (`stdin` no es TTY) y sin `--yes` → código **2** («Sin terminal interactiva: usa --yes y las opciones (--brand, --shape, --density, --dark/--no-dark)»). No se espera a una entrada que no llegará.
- **Validación única:** las respuestas se convierten en el objeto de configuración y pasan por `readConfig` y `buildTheme` de `src/` (las mismas reglas que `grana.config.json`; nada se valida dos veces con reglas distintas). Error de configuración (`kind: 'config'`) con opciones → código **2**; un tema que rompe un mínimo de accesibilidad → código **1** con el informe de `formatIssues`. En los dos casos, **antes de tocar nada**. En interactivo, un tema que rompe un mínimo **no termina**: enseña el informe y vuelve a preguntar la marca («Elige otro color o pulsa Intro para el de Grana»); solo con `--yes` (o con un `grana.config.json` existente) da el código 1.
- Una opción de tema (`--brand`, `--shape`, `--density`, `--dark`/`--no-dark`) con un `grana.config.json` que ya existe y `--yes`: se **ignora** con aviso por stderr («Se ignoró --brand: ya existe grana.config.json; edítalo para cambiar el tema»). En interactivo, las preguntas de tema solo se hacen si se va a escribir el archivo (§5.2).
- Las opciones desconocidas o con valor inválido (`--shape square`, `--register all`) → código **2** con la lista de valores, como hoy.

**Sin dependencias de producción para las preguntas** (#998): `node:readline/promises` sobre `stdin`/`stdout`. Son cuatro preguntas de texto y sí/no; una biblioteca de prompts añadiría entre decenas y cientos de KB a un paquete que hoy declara «Sin dependencias» y que `npx` descarga en cada uso. Ctrl+C durante las preguntas o confirmaciones → código **5**, nada escrito.

## 4. Tema: plugin de Vite por defecto (#999)

**`--theme plugin` (por defecto):** añade `import grana from '@grana/cli/vite'` y `grana()` a `plugins` en `vite.config`, y `import 'virtual:grana/tokens.css'` en la entrada.

Por qué el plugin:
- **Una sola fuente de verdad:** `grana.config.json`. No hay un `tokens.css` generado que se quede atrás cuando alguien cambia la marca y olvida regenerarlo.
- **Recarga:** el plugin ya vigila el archivo de configuración y recarga la página al guardarlo; un error de accesibilidad sale en la superposición de Vite y se recupera al corregirlo.
- **Build y SSR:** el tema se valida en cada `vite build` (un tema roto no llega a producción) y es un módulo CSS virtual, que Vite trata igual en cliente y en SSR (sin código que corra en el servidor).
- **Coste:** `@grana/cli` queda como dependencia de desarrollo, que el build ya necesita; cero bytes en la aplicación.

**`--theme file`:** escribe `src/grana-tokens.css` con `buildTheme` (la misma salida que `grana theme`), lo importa en la entrada (`import './grana-tokens.css'`, ruta relativa a la entrada) y añade a `package.json` el script `"grana:theme": "grana theme grana.config.json --out src/grana-tokens.css"` (si ya existe un `grana:theme` distinto, no se toca y va a «pasos a mano»). No edita `vite.config`. Es la salida cuando el `vite.config` tiene una forma que el instalador no entiende (§5.4), y el mensaje de ese caso la sugiere.

**Requisito de paquete para bruno:** `@grana/cli` publica los tipos del plugin (`src/vite.d.ts`, `export default function grana(options?: { config?: string | object }): import('vite').Plugin` con `import type`, sin exigir `vite` como dependencia de producción) y `exports["./vite"]` pasa a `{ "types": "./src/vite.d.ts", "default": "./src/vite.js" }`. Sin ellos, el `vue-tsc -b` del build de la plantilla TS de Vite falla con TS7016 al leer `vite.config.ts` (`strict` activo). `virtual:grana/tokens.css` y `@grana/vue/style.css` ya quedan cubiertos por `declare module '*.css'` de `vite/client`, también con `noUncheckedSideEffectImports`.

## 5. Qué hace, en qué orden

### 5.1 Planificar → confirmar → aplicar

1. **Detectar** (§2) y **preguntar/validar** (§3). Nada escrito.
2. **Planificar en memoria** todo lo que va a cambiar: el contenido final de cada archivo y la orden de instalación.
3. **Mostrar y confirmar**, una vez por cada cambio, en este orden:
   - la orden de instalación exacta (`npm install @grana/vue@0.1.0-beta.0` y `npm install -D @grana/cli@0.1.0-beta.0`, o sus equivalentes, §5.5) → «¿Instalar? [S/n]»; un «no» cancela todo (código **5**, nada escrito: sin los paquetes, los demás cambios romperían el build);
   - cada archivo con su **diff unificado** (`--- a/src/main.ts` / `+++ b/src/main.ts`, tres líneas de contexto; un archivo nuevo, todo con `+`) → «¿Aplicar a src/main.ts? [S/n]»; un «no» deja ese archivo sin tocar y lo pasa a «pasos a mano».
   Con `--yes` no se pregunta, pero los diffs **se imprimen igual**.
4. **Aplicar**: primero la instalación; si falla, código **4** y **ningún archivo escrito**. Después los archivos, cada uno con escritura atómica (archivo temporal en el mismo directorio + `rename`), conservando el final de línea (LF/CRLF) y la sangría que ya usa el archivo.
5. **Resumen** (§11).

### 5.2 `grana.config.json`

- No existe → se escribe con las respuestas: `{ "brand": …, "shape": …, "density": …, "dark": … }` (dos espacios, salto final). `brand` solo si se dio; las otras tres siempre, también con su valor por defecto, para que quien abra el archivo vea las perillas (`density: "default"` es Δ0 en el CSS, #981).
- Existe → se lee y se valida (§3). Inválido → código **2**, nada tocado, con los errores de `readConfig`. Válido → **se conserva**: con `--yes` sin preguntar; en interactivo se pregunta «Ya existe grana.config.json. ¿Mantenerlo? [S/n]» y solo con «n» se hacen las preguntas de tema y se muestra el diff del archivo nuevo frente al existente con su propia confirmación. No se escribe una clave que el usuario no respondió.

### 5.3 Idempotencia: qué cuenta como «ya está»

| Parte | Se considera hecha si… |
| --- | --- |
| Dependencias | `@grana/vue` en `dependencies` **y** `@grana/cli` en `devDependencies` (o `dependencies`) de `package.json`, con cualquier rango o `file:`. No se reinstala ni se cambia la versión |
| Configuración | Existe `grana.config.json` (§5.2) |
| Hoja de componentes | La entrada tiene una importación cuyo especificador es exactamente `@grana/vue/style.css` |
| Fuente | Ídem con `@grana/vue/fonts.css` |
| Tema (plugin) | `vite.config` importa `@grana/cli/vite` **y** la entrada importa `virtual:grana/tokens.css` (cada mitad por separado) |
| Tema (archivo) | La entrada importa un especificador que termina en `grana-tokens.css`; el archivo existe |
| Registro global | La entrada importa el default de `@grana/vue` y tiene `.use(<ese nombre>` |
| Registro por nombre | Nada que comprobar: no escribe en la entrada |
| Ejemplo | Existe `src/GranaExample.vue` (nunca se sobrescribe) |

Si todo está hecho: imprime «Grana ya está instalado en <dir>; nada que cambiar.» y código **0**, sin escribir ningún archivo (ni siquiera con el mismo contenido: las fechas de modificación no cambian) y sin ejecutar el gestor. Si falta una parte, solo se planifica esa.

### 5.4 Formas que el instalador entiende (y qué hace con las demás)

El instalador **no usa un parser de JavaScript** (sería una dependencia de cientos de KB): edita por texto con reglas estrictas y, si una regla no se cumple con exactitud, **no edita ese archivo** y lo pasa a «pasos a mano» con las líneas exactas que hay que añadir y dónde. Un archivo nunca se edita a medias.

**Entrada (`src/main.*`):**
- Imports: se insertan **después de la última sentencia `import` de nivel superior** (incluidas las de varias líneas, hasta su especificador entre comillas); si no hay ninguna, al principio. Orden de las líneas nuevas: `@grana/vue/style.css`, `@grana/vue/fonts.css`, el tema (`virtual:grana/tokens.css` o `./grana-tokens.css`) y, con `--register global`, `import Grana from '@grana/vue'`. Se respeta el estilo de comillas y de punto y coma de la última importación existente.
- Registro global, solo dos formas, cada una **exactamente una vez** en el archivo:
  - `createApp(<X>).mount(` → `createApp(<X>).use(Grana).mount(` (también con otros `.use(…)` en la cadena: se añade justo antes de `.mount(`);
  - `const|let <app> = createApp(` en una sentencia y, más abajo, una línea que empieza por `<app>.mount(` → se inserta `<app>.use(Grana)` en la línea anterior, con su sangría.
  Cualquier otra forma (`createSSRApp`, varias aplicaciones, montaje dentro de una función o de un `then`) → pasos a mano.
- Si el nombre `Grana` ya está tomado en el archivo como identificador importado, se usa `GranaPlugin`.

**`vite.config.*`:**
- Import: `import grana from '@grana/cli/vite'` tras la última importación (si `grana` ya es un identificador del archivo, `granaTheme`).
- Plugin: si hay **exactamente una** aparición de `plugins:` seguida (con espacios) de `[`, se inserta `grana()` como **primer** elemento: en línea (`plugins: [grana(), vue()]`) o, si el siguiente elemento va en otra línea, en una línea propia con la sangría de ese elemento. El orden no importa: el plugin es `enforce: 'pre'`. Si no hay `plugins:` y hay exactamente una apertura `defineConfig({` o `export default {`, se añade `plugins: [grana()],` en la línea siguiente. Cualquier otra forma (`defineConfig(({ mode }) => …`, `plugins` calculado, `mergeConfig`, varias apariciones) → pasos a mano, con la sugerencia de `--theme file`.

### 5.5 Instalación

| Gestor | Dependencia | Desarrollo |
| --- | --- | --- |
| npm | `npm install <spec>` | `npm install -D <spec>` |
| pnpm | `pnpm add <spec>` | `pnpm add -D <spec>` |
| yarn | `yarn add <spec>` | `yarn add -D <spec>` |
| bun | `bun add <spec>` | `bun add -d <spec>` |

- `<spec>` es **la misma versión exacta que el CLI que corre** (`@grana/vue@0.1.0-beta.0`, `@grana/cli@0.1.0-beta.0`; se lee de su `package.json`), no el `latest` del registro: los dos paquetes van a la par y una prerelease publicada solo con `--tag beta` no tiene por qué tener `latest`. El gestor escribe el rango en `package.json` (`^0.1.0-beta.0` con npm).
- Se ejecuta con `child_process.spawnSync(gestor, args, { cwd, stdio: 'inherit' })`, argumentos como arreglo y **sin shell** (en Windows, el `.cmd` del gestor y las rutas de `--from` entre comillas). La salida del gestor se ve tal cual.
- Si falla: código **4**, el error del gestor queda en pantalla y se añade por stderr: sin `--from`, «Si el error es 404 o "No matching version", @grana/vue todavía no está en npm: prueba con --from <dir> y los .tgz de `npm pack` (ver la guía)»; con `--from`, la ruta del `.tgz` usado.

## 6. Registro de componentes: por nombre por defecto (#1000)

### 6.1 `--register named` (por defecto)

No escribe registro en la entrada: cada componente se importa donde se usa (`import { GBtn } from '@grana/vue'`). El resumen final enseña el patrón con un ejemplo de tres líneas.

Por qué por defecto, con el dato medido: importar **solo `GBtn` añade ≈ 10,9 KB gzip** a la aplicación (#444), y **`app.use(Grana)` arrastra todo el principal** (`dist/grana.js` 223 897 B ≈ 219 KiB gzip; una aplicación Vite que importa todo, ≈ 186 KiB con Vue, #653). Son ~17 veces el coste del primer componente, y lo paga cada usuario final en la primera carga de cada aplicación nueva. Grana ha gastado muchas decisiones en que «quien no lo usa no lo paga» (#328, #444, #506, entradas propias); un instalador que pusiera por defecto lo contrario desharía ese trabajo en el primer minuto. Además `app.use(Grana)` tampoco registra «todo»: las entradas propias (`@grana/vue/combobox`, `/slider`, …) tienen su propio plugin.

### 6.2 `--register global`

Añade `import Grana from '@grana/vue'` y `.use(Grana)` (§5.4). Las etiquetas `<g-btn>` funcionan en cualquier plantilla y quedan tipadas por `GlobalComponents` (#443). El resumen recuerda el coste y que las entradas propias se registran aparte.

### 6.3 Reservado

Un resolvedor para `unplugin-vue-components` (etiquetas globales y solo se paga lo usado) es la forma de tener las dos cosas; queda **reservado** como su propia decisión (añade una dependencia del lado de la aplicación).

## 7. Ejemplo (`--example`)

Crea `src/GranaExample.vue`: un `<script setup>` que importa `GBtn` (o nada, con `--register global`) y una plantilla con `<g-btn>Guardar</g-btn>` y `<g-btn variant="soft">Cancelar</g-btn>`. **No edita `App.vue`** (es código de la aplicación): el resumen dice cómo montarlo (`import GranaExample from './GranaExample.vue'` y `<GranaExample />`). Si el archivo ya existe, no se toca. No va por defecto: con `--yes` en un proyecto real dejaría un archivo de demostración que nadie pidió.

## 8. Salida y códigos

- **stdout:** las preguntas, los diffs (con `--dry-run`, solo diffs y resumen, para poder redirigirlos a un archivo), las órdenes previstas y el resumen `✔`.
- **stderr** (#992): errores, avisos (`⚠`), el informe de un tema inválido y la lista de «pasos a mano».

| Código | Significado | ¿Escribió algo? |
| --- | --- | --- |
| 0 | Hecho, o ya estaba instalado y no había nada que cambiar | Sí / no |
| 1 | El tema de las respuestas o de `grana.config.json` rompe un mínimo de accesibilidad (igual que `grana theme`) | No |
| 2 | Uso: opción desconocida o inválida, `grana.config.json` ilegible o inválido, varios archivos de bloqueo sin `--pm`, sin terminal y sin `--yes` | No |
| 3 | Proyecto no compatible: sin `package.json`, sin Vue 3, sin Vite, o Nuxt | No |
| 4 | Falló el gestor de paquetes, o `--from` sin los `.tgz` necesarios | No (ningún archivo) |
| 5 | Cancelado: «no» a la instalación o Ctrl+C | No |
| 6 | Hecho con **pasos a mano pendientes** (un archivo con forma no entendida, sin entrada, sin `vite.config`, o un archivo rechazado en la confirmación) | Sí, lo demás |

Los avisos no cambian el código, como en `theme`/`check`.

## 9. Nuxt (reservado)

Con Nuxt detectado (§2.2): código **3** y «Nuxt todavía no lo instala `grana init` (reservado). Instalación manual: añade `@grana/vue/style.css` y `@grana/vue/fonts.css` a `css` en `nuxt.config` y registra los componentes en un plugin; ver el README». Un módulo de Nuxt es su propia decisión.

## 10. Paquetes sin publicar: `--from <dir>` (#1002)

- `<dir>` contiene los `.tgz` de `npm pack`: `grana-vue-<versión>.tgz` y `grana-cli-<versión>.tgz`. Se toma la **versión igual a la del CLI**; si no está, la única que haya; si hay varias y ninguna coincide, código **4** con la lista. Si falta alguno de los dos y su paquete no está ya instalado → código **4** antes de instalar nada.
- `<spec>` pasa a ser la ruta absoluta del `.tgz`; el gestor la escribe en `package.json` como `file:` y el resumen avisa: «package.json apunta a archivos locales (file:…); cámbialo a la versión de npm cuando se publique».
- **Solo tarballs, no carpetas de paquete:** instalar una carpeta crea un enlace simbólico y la aplicación resolvería `vue` desde el `node_modules` del repositorio de Grana (dos copias de Vue, avisos de `inject` y componentes que no renderizan). El `.tgz` es exactamente lo que se publicará.
- Para probarlo hoy, sin el CLI publicado: `node <repo>/packages/cli/bin/grana.mjs init --from <dir>` o `npx --package <dir>/grana-cli-<v>.tgz grana init --from <dir>`.

## 11. Resumen final

Por stdout, en este orden: los archivos escritos (`✔ src/main.ts`, `✔ vite.config.ts`, `✔ grana.config.json`), lo instalado con su versión o su `file:`, **lo derivado del tema** (marca, `on-brand` y su contraste medido sobre `brand` en claro y, si hay, en oscuro, tomados de `result.doc`), la **orden no interactiva equivalente** (`npx @grana/cli init --yes --brand '#7A1F5C' --shape pill --density default --dark`) y el siguiente paso (`npm run dev`; con `named`, el ejemplo de importación). Por stderr, los «pasos a mano» si los hay, cada uno con archivo, posición y líneas exactas.

## 12. Qué lo hace distinto

1. **La accesibilidad antes que el proyecto:** el tema se valida con el motor real antes de instalar o escribir nada; una marca que no da contraste se rechaza con su porqué y el proyecto queda intacto. Ningún instalador de librerías de componentes comprueba el contraste del tema que configura.
2. **Lo que derivó, a la vista:** el resumen enseña `brand`/`on-brand` y su contraste medido; quien elige un color sabe en el acto qué texto llevará encima y con qué margen.
3. **Reproducible:** imprime la orden no interactiva equivalente a las respuestas, para el resto del equipo o la integración continua.
4. **Nunca a medias:** un archivo se edita entero o no se edita, con su diff mostrado; lo que no entiende lo dice con las líneas exactas.

Reservado: `npm create grana` (paquete `create-grana`) para crear el proyecto Vite y ejecutar `init` en un paso, a lo Vuetify.

## 13. Peso (#1003)

- **Sin dependencias de producción nuevas.** Solo `node:` (`fs`, `path`, `readline/promises`, `child_process`, `url`); el diff unificado lo calcula un módulo propio (LCS por líneas; los archivos son pequeños).
- Compuerta: el `.tgz` de `npm pack` de `@grana/cli` crece **≤ 12 KiB** (base medida hoy: 43,8 kB, 20 archivos). Si lo supera, vuelve a lima.
- `theme`, `check` y el plugin de Vite no importan nada de `init` (§1); una prueba lo comprueba (p. ej. que `src/vite.js` y el camino de `theme` no tienen `init` en su grafo de importaciones).

## 14. Criterios de aceptación (bruno)

Pruebas con Vitest en `packages/cli/test/init*.test.js` (proyectos simulados en directorios temporales, el gestor sustituido por un doble inyectable en `run`, sin red) y **una prueba de extremo a extremo** (script en `packages/cli/scripts/` o spec de Playwright; Chromium), sobre `.tgz` reales de `npm pack` de `packages/vue` (con su `dist/` construido) y de `packages/cli`, y con red para la plantilla de Vite:

**De extremo a extremo** (en un directorio temporal del scratchpad):
1. `npm create vite@latest app-js -- --template vue` y `npm create vite@latest app-ts -- --template vue-ts`, cada uno con `npm install`.
2. `node <repo>/packages/cli/bin/grana.mjs init --yes --from <tarballs> --brand '#7A1F5C' --example` en cada uno → código **0**; `package.json` tiene `@grana/vue` en `dependencies` y `@grana/cli` en `devDependencies` (ambos `file:`); `grana.config.json` es `{ "brand": "#7A1F5C", "shape": "rounded", "density": "default", "dark": true }`; `vite.config.*` contiene `@grana/cli/vite` y `grana()`; la entrada contiene `@grana/vue/style.css`, `@grana/vue/fonts.css` y `virtual:grana/tokens.css` **una vez cada una**.
3. La prueba (no el instalador) monta `GranaExample` en `App.vue`; `npm run build` pasa en los dos (en TS incluye `vue-tsc -b`, §4).
4. `npx vite preview` y Playwright en Chromium: hay un `.g-btn`; `getComputedStyle(document.documentElement).getPropertyValue('--g-color-brand')` normalizado es `#7A1F5C`; el `background-color` del `.g-btn` (variante por defecto, `solid`) coincide con el valor de `--g-color-primary` que da `buildTheme({ brand: '#7A1F5C' })` para el esquema del navegador de la prueba; `document.fonts.check('1em "Instrument Sans"')` es verdadero tras `document.fonts.ready`.
5. **Segunda ejecución** de la misma orden → código **0**, «nada que cambiar», el gestor no se ejecuta y la suma SHA-256 de todos los archivos del proyecto (sin `node_modules` ni `dist`) y sus `mtime` no cambian.
6. `--register global` en una copia de `app-js` con `<g-btn>` escrito en `App.vue` sin importar: build y Playwright como en 4.
7. **`--dry-run`** en un proyecto recién creado → código **0**, imprime los diffs y las dos órdenes de instalación, y la suma de 5 (esta vez también de `node_modules/.package-lock.json`) no cambia.
8. **Proyecto no Vue** (`npm create vite@latest -- --template vanilla`) → código **3**, mensaje por stderr, nada cambia (suma de 5). Ídem para un `package.json` con `nuxt` y para un directorio sin `package.json`.

**Unitarias** (sin red):
9. Detección del gestor: cada archivo de bloqueo, `packageManager`, `npm_config_user_agent`, varios archivos sin `--pm` → 2.
10. Entrada encontrada por `index.html`, por la lista de respaldo y ausente (→ pasos a mano, código 6).
11. Cada forma de §5.4 que se entiende produce exactamente el texto esperado (en línea y multilínea, comillas simples y dobles, con y sin punto y coma, CRLF); cada forma que no se entiende deja el archivo **byte a byte igual** y da código 6 con las líneas exactas por stderr.
12. Validación: `--brand nope` → 2; `--shape square` → 2; un tema que rompe un mínimo (con una configuración existente que lo provoque) → 1; en los tres casos el doble del gestor no se llamó y no se escribió nada.
13. `grana.config.json` existente: con `--yes` se conserva byte a byte y `--brand` se ignora con aviso por stderr; inválido → 2.
14. Sin TTY y sin `--yes` → 2 sin esperar entrada. Respuesta «n» a la instalación → 5, nada escrito. Fallo del gestor → 4, ningún archivo escrito.
15. `--from` sin `grana-cli-*.tgz` → 4 antes de instalar.
16. Las salidas: con `--dry-run`, stdout contiene solo diffs y resumen (sin `⚠` ni `✖`); los avisos van por stderr.
17. Peso: compuerta de §13 (medida en el commit de bruno y anotada en `CHANGELOG.md`).

**No verificable aquí** (se declara así en el informe): bun y yarn reales (se prueban con el doble), Windows, y la instalación desde el registro de npm hasta que se publique.

## 15. Hallazgo para bruno (fuera de este contrato, medido al redactarlo)

`buildTheme({ brand: '#0F766E' })` (verde azulado) **falla** con `border-control-readonly`: con neutros teñidos, `--g-color-border-control` sobre `--g-color-neutral-soft` queda en 2,99:1 y el mensaje lo redondea a «contraste 3:1, mínimo 3:1», que se lee como si cumpliera. Con `neutrals: "pure"`, con `{}`, `#7A1F5C` o `#2563EB` pasa. Dos defectos: (a) la derivación de neutros teñidos debería garantizar ese par (como garantiza texto ≥ 4,5:1 y control ≥ 3:1), y (b) el mensaje no debe redondear hacia el mínimo (dos decimales, o truncar). Importa para `init`: con un color de marca corriente el primer contacto sería un rechazo. Lo arregla bruno en `packages/cli/src` con su prueba; hasta entonces el criterio 2 usa `#7A1F5C`.

## 16. Reparto

- **bruno:** `packages/cli/src/init/` (módulos de detección, preguntas, plan, diff, edición por texto, instalación), cambios en `src/cli.js` y `bin/grana.mjs` (§1), `src/vite.d.ts` y `exports` (§4), pruebas y el script de extremo a extremo (§14).
- **mora-docs:** `packages/cli/README.md` (sección `init` con las tablas de §3 y §8) y el apartado «Instalación» del README raíz (`npx @grana/cli init` como camino principal; la instalación manual queda como alternativa). El README raíz y el del CLI no son de lima.
- **lima:** este contrato, `api.md` «Instalador `grana init`» y #996 a #1003.
