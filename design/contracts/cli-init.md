# Contrato · `grana init` (instalador de `@grana/cli`)

**Dueño:** lima · **Estado:** contratado, sin construir (2026-11-13; DECISIONS.md #1078 y #1079; `api.md` «Estabilidad y versiones») · **Basado en:** petición del usuario («un instalador de npm, npx») y la instalación vigente del README raíz («Instalación») y de `packages/cli/README.md`
**Paquete:** `@grana/cli` (bin `grana`, el mismo de `theme` y `check`) · **Construye:** bruno (`packages/cli/src/`, pruebas en `packages/cli/test/`), sin dependencias nuevas · **Documenta:** mora-docs (`packages/cli/README.md` y la sección «Instalación» del README raíz, cuando bruno lo entregue)

**Sin ronda de kiwi:** es un comando de terminal, sin forma visible, estados de interfaz ni movimiento (como `utilities.md`, #804). No aplican «conceptos antes que caja», la auditoría visual ni la rúbrica de movimiento. **No es complejo:** bruno en Sonnet salvo que el usuario pida otra cosa.

## Promesa

En la raíz de un proyecto que ya existe, **una orden deja Grana instalado y con tema**, y dice exactamente qué hizo y qué falta:

```bash
npx grana init                          # npm
pnpm dlx grana init                     # pnpm
yarn dlx grana init                     # yarn ≥ 2
bunx grana init                         # bun
```

`npx @grana/cli init` (y sus equivalentes con `@grana/cli`) hace **exactamente lo mismo**: ver I9.

`init` instala los paquetes con el gestor del proyecto, escribe `grana.config.json` (y `tokens.css` cuando hace falta) y **muestra** las líneas que la aplicación debe añadir a su código. **No edita código de la aplicación.**

## Qué lo hace distinto

1. **Valida el tema antes de tocar nada.** Con `--brand` (o un `grana.config.json` ya existente), el tema se deriva y se valida con `buildTheme` **antes** de instalar: un color que rompe un mínimo de accesibilidad para la orden en el código 1 sin haber cambiado el proyecto. Ningún otro instalador de librería de componentes rechaza una identidad que no se puede leer.
2. **No reescribe tu código.** Editar `main.js`, `vite.config.*` o `nuxt.config.*` exige leer y reescribir código ajeno (AST, formatos, comentarios, configuraciones que exportan funciones): frágil y sorprendente. `init` imprime las líneas exactas, con el archivo donde van; lo que escribe son solo archivos de Grana.
3. **Dice cada orden antes de ejecutarla.** La orden de instalación se imprime tal cual se ejecuta (gestor, paquetes, rangos), así que se puede copiar, repetir o auditar. `--no-install` y `--dry-run` la dejan solo impresa.

## Sintaxis

```
grana init [--pm npm|pnpm|yarn|bun] [--brand <color>] [--theme auto|vite|file] [--out <archivo>] [--no-install] [--dry-run] [--force]
```

Sin argumentos posicionales: uno da el código 2. **No interactivo:** nunca pregunta (sirve igual en CI y sin TTY); por eso no hay `--yes`. `--help` muestra la ayuda general, que pasa a listar `init`.

| Opción | Valores | Por defecto | Qué hace |
| --- | --- | --- | --- |
| `--pm` | `npm` `pnpm` `yarn` `bun` | detección (I2) | Fuerza el gestor. Otro valor → código 2. |
| `--brand` | un color que acepte la clave `brand` de `tokens.md` §1 | — | Escribe `{ "brand": "<color>" }` en un `grana.config.json` nuevo. Se valida antes de instalar (I4). Con un `grana.config.json` existente y sin `--force` → código 2 (no se mezcla con un archivo ajeno). |
| `--theme` | `auto` `vite` `file` | `auto` | Cómo llega el tema a la aplicación (I5). `auto` decide por detección. |
| `--out` | ruta relativa al directorio actual | `tokens.css` | Dónde se escribe el tema en el modo `file` (el mismo nombre por defecto que `grana theme`). Con el modo `vite` → código 2 (no se escribe ningún archivo de tema). |
| `--no-install` | — | instala | No ejecuta la instalación: la imprime. Escribe los archivos igual. |
| `--dry-run` | — | — | No instala ni escribe nada: imprime el plan completo (detección, órdenes, archivos que se escribirían o conservarían, siguientes pasos). Corre todas las comprobaciones previas y da el mismo código que daría la ejecución real **antes** de instalar. |
| `--force` | — | — | Sobrescribe `grana.config.json` y un archivo de tema que no generó Grana (I6). No afecta a la instalación. |

Opción desconocida, valor ausente o valor fuera de la lista → código 2 con la ayuda, como en `theme` y `check`.

## I1 · Precondiciones (se comprueban todas antes de instalar o escribir)

1. **`package.json` en el directorio actual**, legible como JSON. Si no existe: código 2 con el mensaje «`init` añade Grana a un proyecto existente» y la orden para crear uno (`npm create vue@latest` o `npm create vite@latest`, según el gestor elegido o el detectado). `init` **no crea proyectos** (motivo: duplicaría las plantillas de Vite y Vue y su mantenimiento).
2. **No es la raíz de un *workspace*.** Si el `package.json` del directorio declara `workspaces` o el directorio contiene `pnpm-workspace.yaml`: código 2, «ejecuta `init` en el paquete de la aplicación». Instalar componentes en la raíz de un monorepo casi nunca es la intención (y pnpm lo rechaza sin `-w`). Un **paquete dentro** de un *workspace* sí se admite (I2.3).
3. **Vue compatible.** Versión de Vue: la de `vue/package.json` resuelta desde el directorio (resolución de Node hacia arriba) si está instalada; si no, la primera `X.Y(.Z)` del rango declarado en `dependencies`, `devDependencies` o `peerDependencies`. Mayor ≠ 3, o 3 con menor < 5 → **código 2** («`@grana/vue` necesita `vue ^3.5.0`; tienes …»), sin instalar nada. Rango que no se puede leer (`latest`, `workspace:*`, git, URL) → **aviso** y sigue. Sin Vue → se añade `vue@^3.5.0` a la instalación (I3) con un aviso: `init` no prepara un empaquetador, y sin uno los componentes no se usan.
4. **El tema es válido** (I4).
5. **Los archivos se pueden escribir** según I6 (choques resueltos o `--force`).

Si falla cualquiera, no se instala ni se escribe nada.

## I2 · Gestor de paquetes

**Orden de detección** (gana el primero que responde):

1. `--pm`.
2. Campo `packageManager` del `package.json` del directorio y, si no lo tiene, del de la raíz del *workspace* (I2.3): el nombre antes de `@`. Un nombre fuera de `npm` `pnpm` `yarn` `bun` → código 2, «usa `--pm`».
3. **Archivo de bloqueo**, buscado desde el directorio hacia arriba hasta el primer directorio que tenga uno, sin pasar de un directorio con `.git` ni de la raíz del sistema: `pnpm-lock.yaml` → pnpm; `yarn.lock` → yarn; `bun.lock` o `bun.lockb` → bun; `package-lock.json` o `npm-shrinkwrap.json` → npm. **Dos o más gestores distintos en el mismo directorio** → código 2, «hay varios archivos de bloqueo; usa `--pm`» (instalar con el equivocado rompe el bloqueo del otro; no se adivina).
4. `npm_config_user_agent` (lo pone el gestor que lanzó la orden: `pnpm dlx` → pnpm, `bunx` → bun). Va detrás del bloqueo porque `npx` siempre dice npm aunque el proyecto sea de pnpm.
5. npm.

La salida dice el gestor **y de dónde salió** («pnpm, por `pnpm-lock.yaml`»).

**I2.3 · Paquete dentro de un *workspace*.** La raíz del *workspace* es el primer directorio hacia arriba con `workspaces` en su `package.json` o con `pnpm-workspace.yaml` (mismo límite de `.git`). La orden se ejecuta **en el directorio actual** (los cuatro gestores instalan en el paquete del directorio y actualizan el bloqueo de la raíz); la salida nombra la raíz detectada.

## I3 · Instalación

Paquetes, con el rango fijado por la versión del propio CLI (`M` = su mayor; `V` = su versión exacta):

| Paquete | Dónde | Rango | Cuándo |
| --- | --- | --- | --- |
| `@grana/vue` | `dependencies` | `^M.0.0` | si no está declarado en `dependencies`, `devDependencies` ni `peerDependencies` |
| `vue` | `dependencies` | `^3.5.0` (el *peer* de `@grana/vue`) | si no está declarado (I1.3) |
| `@grana/cli` | `devDependencies` | `^V` | si no está declarado; lo usan el plugin de Vite y `grana theme` |

**Porqué del rango:** los nombres de los tokens y las claves de configuración son API por mayor (#1076), así que componentes y motor de tema van en la misma mayor; `@grana/cli` se fija a su propia versión para que el proyecto regenere el tema con el motor con el que se validó.

**Órdenes** (se ejecutan en este orden, en el directorio actual, sin *shell* ni texto del usuario en los argumentos: solo nombres y rangos fijos):

| Gestor | Dependencias | De desarrollo |
| --- | --- | --- |
| npm | `npm install <paquetes>` | `npm install --save-dev <paquetes>` |
| pnpm | `pnpm add <paquetes>` | `pnpm add --save-dev <paquetes>` |
| yarn | `yarn add <paquetes>` | `yarn add --dev <paquetes>` |
| bun | `bun add <paquetes>` | `bun add --dev <paquetes>` |

Se omite la orden que no tenga paquetes. En Windows el ejecutable se resuelve con su `.cmd` (bruno decide cómo; los argumentos siguen sin pasar por un *shell* con texto del usuario). La salida del gestor se muestra tal cual (herencia de `stdio`).

**Ya instalado:** un paquete declarado no se reinstala ni se cambia su rango; la salida lo dice («`@grana/vue` ya está: `^1.2.0`»). Si su mayor declarada no es `M` → **aviso** (no se toca: actualizar es decisión de la aplicación).

**Fallo de la instalación** (código de salida distinto de 0, o el gestor no existe en el sistema): **código 3**, no se escribe ningún archivo, y la salida dice qué orden falló, cuáles ya se completaron, que el gestor puede haber dejado cambios en `package.json` y en el bloqueo, y la orden exacta para reintentar a mano. Gestor ausente: además sugiere instalarlo o elegir otro con `--pm`, avisando de que eso cambia el gestor del proyecto. **Porqué de instalar antes de escribir:** si la instalación falla, el proyecto queda como estaba (salvo lo que haya hecho el gestor) y repetir `init` no tropieza con archivos a medio escribir.

## I4 · Configuración y validación del tema

- **`grana.config.json` no existe:** se escribe con `{ "brand": "<color>" }` si hay `--brand`, o con `{}` si no (el tema por defecto; la salida invita a añadir `brand` y remite a `tokens.md` §1 y al README del CLI). JSON con dos espacios y salto de línea final.
- **Existe y sin `--force`:** se conserva intacto y se usa para validar y, en modo `file`, para generar. Con `--brand` → código 2 (I1).
- **Validación previa:** `buildTheme(config, { source: 'grana.config.json' })`, el mismo motor y las mismas reglas que `theme`: error de configuración → **código 2**; tema que rompe un mínimo → **código 1**; los avisos y las notas se muestran y no cambian el código. Los diagnósticos se imprimen con el mismo formato que `theme`.
- **`grana.config.json` existente que no es JSON** → código 2, como `theme`.

## I5 · Cómo llega el tema (`--theme`)

**Detección con `auto`:**

1. **Nuxt** (`nuxt` declarado, o `nuxt.config.{js,mjs,ts,mts}`) → `file`. Motivo: el módulo virtual por la cadena de `css` de Nuxt no está verificado; el archivo sí funciona igual en todo empaquetador. El modo `vite` con Nuxt queda **reservado** hasta verificarlo.
2. **Vite** (`vite` declarado, o `vite.config.{js,mjs,cjs,ts,mts,cts}`) → `vite`.
3. Cualquier otro caso → `file`.

| Modo | Escribe | Muestra |
| --- | --- | --- |
| `vite` | nada más que `grana.config.json` | En el archivo de configuración de Vite detectado (por su nombre real; si hay varios, el primero en el orden de arriba): `import grana from '@grana/cli/vite'` y `grana({ config: 'grana.config.json' })` en `plugins`. En la entrada: `import 'virtual:grana/tokens.css'` además de las líneas comunes. |
| `file` | el tema en `--out` (por defecto `tokens.css`), el mismo CSS que `grana theme` | La importación del archivo en la entrada (ruta relativa a la entrada si se encontró) y el *script* sugerido `"theme": "grana theme grana.config.json"` (con `--out` si no es el de por defecto) para regenerarlo. **No se añade a `package.json`.** |

**Líneas comunes de la entrada** (todos los modos): `import Grana from '@grana/vue'`, `import '@grana/vue/style.css'` (obligatorio), `import '@grana/vue/fonts.css'` (marcado opcional) y `.use(Grana)` en la creación de la aplicación. La entrada se nombra si existe una de `src/main.{ts,js,mts,mjs}`; si no, «tu archivo de entrada».

**Nuxt** sustituye la entrada por: un archivo de *plugin* de Nuxt con `nuxtApp.vueApp.use(Grana)` (contenido completo impreso, ruta sugerida `plugins/grana.ts` o `.js` según el proyecto use TypeScript) y, en `nuxt.config`, `css: ['@grana/vue/style.css', '@grana/vue/fonts.css', '~~/<out>']` (`~~` es la raíz en Nuxt 3 y 4).

## I6 · Archivos: qué escribe y qué no

| Archivo | Si no existe | Si existe |
| --- | --- | --- |
| `grana.config.json` | se escribe | se conserva; `--force` lo sobrescribe (con el nuevo contenido de I4) |
| tema en `--out` (modo `file`) | se escribe | se **regenera** si empieza por la cabecera de `@grana/cli` (`/* Generado por @grana/cli`), como hace `theme`; si no, código 2 salvo `--force` |

**Nunca escribe** `package.json` (lo cambia el gestor), el bloqueo, `main.*`, `vite.config.*`, `nuxt.config.*`, `index.html` ni nada fuera del directorio actual. **Nunca borra.** Una ruta de `--out` fuera del directorio actual → código 2.

## I7 · Salida

Por la salida estándar, en este orden de bloques (el texto exacto es de bruno y no es API):

1. **Detección:** gestor y su fuente, raíz del *workspace* si la hay, Vue (versión y fuente), marco (`vite`, `nuxt` o ninguno) y modo de tema.
2. **Diagnósticos del tema** (si los hay), con el formato de `theme`.
3. **Instalación:** cada orden exacta y si se ejecutó, se omitió (`--no-install`, `--dry-run`) o no hacía falta (paquetes ya declarados).
4. **Archivos:** cada uno como escrito, regenerado, conservado o «se escribiría» (`--dry-run`).
5. **Siguientes pasos:** las líneas de I5 en bloques de código con el archivo de destino, y con `--no-install` la orden pendiente.

Errores y avisos por la salida de error, como en `theme`. Sin colores ANSI obligatorios (si bruno los usa, se apagan con `NO_COLOR` y fuera de un TTY). Los símbolos de estado siguen el formato que ya usa `cli.js` (es salida de terminal, no un componente: la regla de iconos Lucide no aplica).

## I8 · Códigos de salida

| Código | Cuándo | Qué queda hecho |
| --- | --- | --- |
| `0` | todo correcto (también `--no-install` y `--dry-run`); los avisos no cuentan | lo descrito en la salida |
| `1` | el tema rompe un mínimo de accesibilidad (I4) | nada |
| `2` | uso, precondición o configuración: opción inválida, sin `package.json`, raíz de *workspace*, Vue incompatible, gestor desconocido o ambiguo, configuración inválida, choque de archivos sin `--force`, `--brand` con configuración existente, `--out` con `vite` o fuera del directorio | nada |
| `3` | **nuevo, solo de `init`:** la instalación falló o el gestor no está en el sistema | ningún archivo de Grana; lo que el gestor haya cambiado |

**Porqué de un código nuevo:** un fallo de red o de registro no es «uso o configuración» (2) ni «tema inválido» (1), y un CI que reintenta necesita distinguirlo. `theme` y `check` no lo emiten nunca; añadir un código para un comando nuevo es aditivo (menor).

## Casos borde

| Caso | Resultado |
| --- | --- |
| Paquetes aún sin publicar en npm (hoy) | La instalación falla con 404 del gestor → código 3, sin archivos. Es el comportamiento correcto; funciona sin cambios cuando estén publicados. |
| Todo ya instalado y configurado | Sin órdenes de instalación, archivos conservados, siguientes pasos impresos; código 0 (repetir `init` es inocuo). |
| `--no-install` y `--dry-run` a la vez | Vale; manda `--dry-run`. |
| Proyecto sin Vue y sin empaquetador | Instala `vue` y avisa (I1.3); modo `file`. |
| `vue@2` o `vue@3.4` | Código 2 antes de instalar (I1.3). |
| Yarn PnP | Igual que yarn; la resolución de Vue de I1.3 cae al rango declarado si no hay `node_modules`. |
| Deno u otro gestor en `packageManager` | Código 2, «usa `--pm`». |
| `packageManager` y bloqueo de gestores distintos | Gana `packageManager` (orden de I2), con un aviso del desacuerdo. |
| Proyecto con TypeScript | Mismas líneas; la entrada y el *plugin* de Nuxt se nombran con `.ts` si existen así. |

## Qué pasa a ser API pública (semver, #1076)

**Se promete (romperlo es una 2.0):** el comando `init`; sus opciones y valores; el código 3 y el significado de 0/1/2 en `init`; el orden de detección del gestor (I2) y de `--theme auto` (I5); qué paquetes instala, dónde y con qué rango (I3); los nombres por defecto `grana.config.json` y `tokens.css`; que nunca escribe fuera de I6 ni edita código de la aplicación; que valida antes de instalar. **Fuera de la promesa:** los textos y el formato de la salida, el orden interno de las líneas dentro de cada bloque, las órdenes sugeridas para crear un proyecto y la forma exacta de los fragmentos impresos (siguen lo que diga el README vigente). Añadir un gestor, un marco detectado o una opción es una menor.

## Verificación (bruno)

- **Sin red.** `run` acepta en su segundo argumento un ejecutor inyectable (p. ej. `exec(cmd, args, { cwd }) → { status, error }`; nombre y forma los decide bruno, **no es API**: `.` solo promete `buildTheme`). Las pruebas montan proyectos en directorios temporales y comprueban: cada rama de I2 (incluidos bloqueo ambiguo, `workspace` raíz y miembro, `packageManager` desconocido, *user agent*), las órdenes exactas de I3 por gestor, «ya instalado», I1.3 (Vue 2, 3.4, 3.5, rango ilegible, sin Vue), I4 (`--brand` válido, de configuración inválida → 2, que rompe un mínimo → 1, con archivo existente → 2), I5 (Vite, Nuxt, ninguno, `--theme` forzado, `--out` con `vite` → 2), I6 (cabecera propia regenerada, archivo ajeno → 2, `--force`, `--out` fuera → 2), I8 (fallo del ejecutor → 3 y **ningún archivo escrito**; gestor ausente → 3) y que `--dry-run` no escribe ni llama al ejecutor.
- **Paridad con `theme`:** el `tokens.css` de `init --theme file` es byte a byte el de `grana theme grana.config.json`.
- **Sin dependencias nuevas** en `@grana/cli` (ni de *prompts* ni de semver: la lectura de versión de I1.3 es una expresión regular).
- **No verificable aquí** hasta publicar: la instalación real desde el registro con los cuatro gestores. Tras publicar, una pasada manual en un `npm create vite@latest` (plantilla `vue`) con npm y pnpm, y en un Nuxt 4 nuevo, comprobando que la aplicación arranca con las líneas impresas.

## I9 · Paquete sin ámbito `grana` (#1079)

**Qué es.** Un paquete publicado como **`grana`** (`packages/grana/`), envoltorio sin lógica de `@grana/cli`, para que `npx grana init` funcione. **Porqué existe:** el bin de `@grana/cli` ya se llama `grana`; quien teclee `npx grana init` sin tener el CLI instalado descarga del registro el paquete sin ámbito `grana`, sea de quien sea (404 libre el 2026-11-13). Publicarlo cierra esa puerta (un tercero no puede servir código bajo la orden que Grana enseña) y acorta la orden. **Decisión del usuario del 2026-11-13** («decide tú qué es mejor»; decidió el coordinador).

**Forma del paquete.** `name: "grana"`, `version` **igual** a la de `@grana/cli`, `license: MIT`, `type: "module"`, `engines.node: ">=22"`, `bin: { "grana": "./bin/grana.mjs" }`, `files: ["bin"]`, `LICENSE` y un `README.md` de tres líneas que remite a `@grana/cli` (la documentación vive en un solo sitio). **Una única dependencia:** `"@grana/cli": "<versión exacta>"` (sin `^`).

**Cómo delega.** `@grana/cli` gana una ruta de `exports`, **`./main`**, que exporta `main(argv = process.argv.slice(2))`: lee la versión de su propio `package.json` y devuelve el código de salida (síncrono o promesa, lo decide bruno). El `bin/grana.mjs` de `@grana/cli` pasa a llamar a `main`, y el del envoltorio es solo `import { main } from '@grana/cli/main'; process.exitCode = await main()`. **Porqué así y no otras:**

- *Importar `bin/grana.mjs` de `@grana/cli`*: un módulo con efectos al importarse, y `bin/` no se resuelve por `exports`.
- *Reexportar `run` por `.`*: `.` solo promete `buildTheme`, y `run` recibe la versión del llamador; el envoltorio pasaría la suya y no la del motor.
- *Duplicar la lógica*: dos sitios que mantener y paridad sin garantía.
- *Con `main`:* el análisis de opciones, los comandos, la salida y los códigos son **el mismo código** (paridad por construcción), y la versión que `init` fija en `@grana/cli@^V` y la de `--version` salen del CLI, nunca del envoltorio.

**`./main` es interna: fuera de semver** (el nombre y la forma de `main` pueden cambiar en una menor de `@grana/cli`). Es seguro porque el envoltorio fija **la versión exacta** de `@grana/cli`: nunca corre contra un `main` que no conozca. Quien la use desde otro sitio no tiene promesa; no se documenta en el README.

**Versiones y publicación.** `grana` y `@grana/cli` se publican **siempre juntos y con el mismo número**; primero `@grana/cli`, después `grana` (el envoltorio depende de una versión que ya debe existir en el registro). Cada subida de `@grana/cli` obliga a subir `grana` a la misma versión, aunque no cambie nada. Lo que `init` instala en el proyecto **no cambia**: `@grana/vue@^M.0.0` y `@grana/cli@^V` con la versión del CLI (nunca `grana`, que no es una dependencia del proyecto). Publicar es del usuario: `npm publish` en `packages/cli` y luego en `packages/grana`, cada uno con su etiqueta. `packages/grana` no es `private` y entra en `workspaces` por `packages/*`.

**Documentación.** La orden **principal** es **`npx grana init`** (y `pnpm dlx grana init`, `yarn dlx grana init`, `bunx grana init`): es la que el usuario pidió, más corta y la que de todos modos teclea quien ve el bin `grana`. La forma `npx @grana/cli init` se muestra como **equivalente** y como la que se usa para **fijar una versión** (`npx @grana/cli@1 init`) o si el nombre sin ámbito no resolviera; ninguna de las dos es «la buena»: hacen lo mismo. Con `@grana/cli` ya instalado en el proyecto, `npx grana` usa su bin local (el mismo código).

**Qué es público (semver):** que el paquete `grana` existe y que `grana <comando> …` es **idéntico** a `@grana/cli`: mismos comandos, opciones, salida y códigos de salida (0/1/2/3); su comportamiento sigue entonces las promesas de «Qué pasa a ser API pública» de más arriba, sin lista propia. **No es público:** `./main`, la estructura interna del envoltorio y que dependa de la versión exacta (si algún día cambia el mecanismo, no es API).

**Verificación (bruno), sin red:**

- Paridad: para un conjunto de órdenes (`--help`, `--version`, `theme` y `check` con configuración válida e inválida, `init --dry-run` y fallos de uso), `packages/grana/bin/grana.mjs` y `packages/cli/bin/grana.mjs` dan la **misma salida estándar, de error y código de salida**, ejecutados como procesos con el mismo directorio.
- `packages/grana/package.json`: `version` igual a la de `@grana/cli`, dependencia exacta de esa versión, `bin.grana` presente, sin más dependencias, `license` MIT, `engines.node` `>=22`; el `bin` empieza por `#!/usr/bin/env node` y tiene permiso de ejecución.
- `@grana/cli`: `exports["./main"]` existe y se resuelve; `package.json` `files` lo cubre; `theme`, `check` e `init` siguen dando lo mismo tras mover la entrada a `main`.
- `npm pack --dry-run` de `packages/grana` lista solo `bin`, `LICENSE`, `README.md` y `package.json`.
- **No verificable aquí hasta publicar:** `npx grana init` descargando de verdad ambos paquetes del registro (con npm, pnpm, yarn y bun), y que `npx grana` con `@grana/cli` ya instalado elige el bin local.

## Reservado

- **`create-grana` / `npm create grana`** (crear un proyecto nuevo con Grana ya puesto): **reservado, no se construye ni se publica en 1.x** (#1079; el nombre queda libre en npm a sabiendas: `npm create` promete crear un proyecto y `init` no lo crea, y un paquete vacío para ocupar el nombre va contra la política de npm). Duplicaría las plantillas de `create-vue`/`create-vite`/`nuxi init` y su mantenimiento; la ruta es `npm create vue@latest` seguido de `npx grana init`. Si el usuario lo quiere, sería un paquete aparte que crea con la plantilla oficial y luego llama a `init`, sin lógica propia de instalación.
- **Editar código de la aplicación** (`--write-entry` o similar): reservado; solo con una decisión nueva y pruebas sobre AST reales.
- **`--theme vite` con Nuxt**, **`--config <ruta>`** y una opción para instalar en la raíz de un *workspace*: reservados.
- **Modo interactivo:** no. Las opciones bastan y un instalador que pregunta no sirve en CI.
