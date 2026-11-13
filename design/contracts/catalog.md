# Contrato · Catálogo de componentes legible por agentes (`catalog.json`, `llms.txt`, `grana catalog`)

**Dueño:** lima · **Estado:** contratado y construido por bruno (6333808d, 8aba7d22), con las anotaciones de construcción de abajo (2026-11-13; DECISIONS.md #1080; `api.md` «Estabilidad y versiones» y «Paquete, entradas y tipos») · **Basado en:** petición del usuario del 2026-11-13 («algo para las IAs que sepan qué componentes hay, props y demás, como un catálogo, para que si se diseña con ellas los agentes y skills sepan consultar la disponibilidad») y en lo que ya existe: los `*.meta.json` (#443), `ENTRIES` y el lector de `scripts/build-types.mjs`, `types/overrides.mjs`, `scripts/icons.json`, `design/contracts/utilities.json` y `styles/defaults.css`.
**Paquetes:** `@grana/vue` (el catálogo y el texto, generados en `npm run build`) y `@grana/cli` (el comando `catalog`, y por tanto también `grana`, #1079) · **Construye:** bruno (`packages/vue/scripts/build-catalog.mjs`, `packages/cli/src/`), sin dependencias nuevas · **Documenta:** mora-docs (sección «Para agentes de IA» en el README de `@grana/vue` y el comando en `packages/cli/README.md`, cuando bruno lo entregue)

**Sin ronda de kiwi:** son datos y un comando de terminal, sin forma visible, estados de interfaz ni movimiento (como `utilities.md` y `cli-init.md`). No aplican «conceptos antes que caja», la auditoría visual ni la rúbrica de movimiento. **No es complejo:** bruno en Sonnet; el generador reutiliza lo que ya hace `build-types.mjs`.

## Promesa

Un agente (o una persona) que trabaja en un proyecto con Grana puede saber, **sin red y para la versión exacta instalada**, qué piezas existen, desde qué entrada se importan, si `app.use(...)` las registra, y qué props (con tipo, valores y por defecto), `v-model`, eventos, slots, métodos y claves de `labels` tienen; además, los nombres de los tokens `--g-*`, la lista de iconos de la librería y las clases utilitarias. Y sabe **qué no existe**: lo que no está en el catálogo no es API.

Tres piezas, una sola fuente:

| Pieza | Dónde | Para quién |
| --- | --- | --- |
| `catalog.json` | `@grana/vue/catalog.json` (`dist/catalog.json`) | máquinas: agentes, skills, editores, herramientas |
| `llms.txt` | `@grana/vue/llms.txt` (`dist/llms.txt`) | el agente que llega sin contexto: qué es Grana, reglas, índice y cómo preguntar |
| `grana catalog` | `@grana/cli` y `grana` | consulta puntual en terminal (`grana catalog GBtn`), `--json` y el bloque para `AGENTS.md`/`CLAUDE.md` |

## Qué lo hace distinto

1. **No puede desfasarse de los tipos.** El catálogo sale del mismo lector, de las mismas `ENTRIES` y de la misma función de tipos que el `.d.ts` (#443); cada prop lleva su tipo TypeScript ya resuelto (`ts`). Si el `meta.json`, la entrada o el `install` cambian, cambian a la vez el tipo y el catálogo, y una prueba falla si no.
2. **Responde «no existe» con alternativas reales.** `grana catalog GDatepickr` sale con código 1 y nombra las piezas más cercanas; `--find fecha` busca por descripción. Un agente que duda de una pieza o una prop comprueba en vez de inventar.
3. **Es la versión instalada, no la documentación de la última.** El CLI lee el `@grana/vue` que resuelve el proyecto; el agente ve lo que de verdad va a compilar.

## C1 · `catalog.json`: esquema (versión 1)

JSON con sangría de dos espacios y salto de línea final (legible y apto para `grep`), **determinista**: mismo código fuente → mismos bytes (sin fecha de generación; orden fijo). Raíz:

```jsonc
{
  "schemaVersion": 1,
  "package": { "name": "@grana/vue", "version": "1.x.y" },
  "entries":    [ /* C1.1, en el orden de ENTRIES */ ],
  "components": [ /* C1.2, por name */ ],
  "tokens":     [ /* C1.3 */ ],
  "icons":      { "library": [ … ], "aliases": { … } },
  "utilities":  [ /* C1.4 */ ]
}
```

### C1.1 · `entries[]`

| Campo | Tipo | Qué es | Fuente |
| --- | --- | --- | --- |
| `path` | string | Especificador de importación: `@grana/vue`, `@grana/vue/combobox`… | `ENTRIES` + `exports` |
| `install` | `"default"` \| `"manager"` \| `null` | Cómo se registra: `default` = `app.use(<importación por defecto>)`; `manager` = `app.use(<instancia de una fábrica>)` (voz, isla); `null` = no registra nada (`./testing`) | el fuente de la entrada |
| `manager` | string (solo con `manager`) | Nombre de la fábrica: `createSpeech`, `createStatus` | ídem |
| `components` | string[] | Nombres de las piezas que exporta, ordenados | `generateTypes().entries[*].components` |
| `functions` | string[] | Resto de lo que exporta como API (funciones, composables, claves, constantes), ordenados. Solo nombres: la firma está en `types` | `generateTypes().entries[*].api` (sin `default`) |
| `types` | string | Ruta del `.d.ts` dentro del paquete (`dist/combobox.d.ts`) | `exports[path].types` |

Una entrada que no exporta piezas ni API **pero registra algo** sí se lista (`sidebar-index`: `install: "default"`, `components: []`, `functions: []`); solo se omite la que además no registra nada (anotación 1). Lo interno (`__shared`) no se lista: `api` de `build-types` ya lo excluye; si no, el generador lo filtra por el prefijo `__`.

### C1.2 · `components[]` (piezas)

Una por cada pieza que `readMetas()` conoce (incluye las `parts` de `GInputGroup` y los `related` con props, como `GTabPanel`). **Lista blanca:** el catálogo solo lleva los campos de esta tabla; cualquier otra clave del `meta.json` (presente o futura) no sale. Un campo opcional que no aplica **se omite** (no `null`, no `[]`), salvo `props`, `events` y `slots`, que van siempre (vacíos si no hay).

| Campo | Tipo | Qué es | Fuente |
| --- | --- | --- | --- |
| `name` | string | `GBtn` | meta `name` |
| `tag` | string | `g-btn` | meta `tag` |
| `aliases` | string[] | Otros nombres registrados (`GDatepicker`) | `overrides.aliases` |
| `status` | `"stable"` \| `"candidate"` \| `"draft"` | C3 | meta `status` |
| `since` | string | Versión en que apareció | meta `since` |
| `deprecated` | `{ since, use }` | Retirada anunciada (`api.md` #1076) | meta `deprecated` |
| `description` | string | Una frase | meta `description` |
| `entry` | string | `path` de la entrada que la exporta | C1.1 (**no** el campo `entry` del meta, que es prosa) |
| `registered` | boolean | `true` si el registro de esa entrada (C1.1 `install`) la registra globalmente; `false` = hay que importarla y registrarla en el componente | el `install` de la entrada, comprobado en ejecución (C5) |
| `props[]` | objeto | ver abajo | meta `props` |
| `models[]` | objeto | `{ prop, directive }`: por cada prop `P` con evento `update:P`; `directive` es `v-model` si `P` es `modelValue` y `v-model:P` si no | derivado de `props` + `events` |
| `events[]` | objeto | `{ name, payload, ts, description }` (`description` = meta `trigger`) | meta `events` + tipo del `.d.ts` |
| `slots[]` | objeto | `{ name, props?, description }`; `props` = meta `scope` o `props` (texto), `description` = meta `purpose` | meta `slots` |
| `methods[]` | objeto | `{ name, signature, description? }` de lo expuesto con `ref` | meta `methods` (C1.5) |
| `labels` | string[] | Claves de `labels`, sin sus textos ni parámetros | meta `labels` (C1.5) |
| `cssProperties[]` | objeto | `{ name, description? }`: propiedades `--g-*` propias de la pieza que la aplicación puede fijar | meta `publicProperties` |

**`props[]`:** `{ name, type, ts, values?, default, resolvedDefault?, required?, since?, deprecated?, description? }`. `type` es el texto del meta (constructores de Vue: `String | Number`); `ts` es el tipo TypeScript que el `.d.ts` publica para esa prop, producido **por la misma función** que lo escribe (`propType`, con sus `overrides`); `values` es el arreglo del meta tal cual; `default` es el del meta (`null` cuando no hay); `description` es meta `note` o, si no hay, `description`. Lo mismo `events[].ts` con `payloadType` (`void` sin argumento).

### C1.3 · `tokens[]`

Nombres de las propiedades `--g-*` declaradas en `packages/vue/src/styles/defaults.css`, sin repetir y ordenados: `["--g-border-width", …]`. **Solo nombres, nunca valores** (los valores de `defaults.css` no son API, #1076). Es completo por regla: todo token que lea un componente tiene su valor por defecto ahí. Los tokens que solo emite el CLI con una configuración concreta no se listan; son del tema del proyecto (`grana theme --doc` y `tokens.json`).

### C1.4 · `icons` y `utilities[]`

- `icons.library`: la lista de la librería (API pública, `icons.md` §4), de `scripts/icons.json` `library`; `icons.aliases`: sus alias de compatibilidad (`circle-help`). Nunca `playground` ni `lab`.
- `utilities[]`: `{ class, group }` de cada clase de `design/contracts/utilities.json` (la lista canónica, #804), en su orden. Sin las declaraciones: la clase es la API.

### C1.5 · Normalización (estricta, como `build-types`)

El `meta.json` tiene formas heredadas; el generador las lleva al esquema y **se detiene con el motivo** ante una que no sepa leer (no adivina):

- `methods`: un texto `"nombre(args) → r"` da `{ name: <antes del paréntesis>, signature: <el texto> }`; un objeto da `{ name, signature, description: purpose ?? description }`. **Lo expuesto debe estar completo:** todo nombre de `overrides.exposed[Pieza]` debe salir en `methods`. Las piezas que hoy lo declaran con otras claves (`exposed`, `exposes`) las pasa bruno a `methods` en su `meta.json` (bruno es dueño del meta); los métodos de un gestor (`overrides.managerMethods`) no son de la pieza y no salen.
- `labels`: un arreglo de textos da la primera palabra de cada uno (`"remove {label}"` → `remove`; las claves con punto, `actions.start`, se conservan); un objeto plano da sus claves. Otra forma (p. ej. `GFileField` con `strings` en prosa) → error; bruno la pasa a una de las dos formas en el meta.
- `slots[].props`: `scope` o `props`, el que haya; los dos a la vez → error.
- Un nombre de pieza repetido, una pieza sin entrada que la exporte, o una entrada que exporta una pieza sin meta → error (la última ya la detiene `build-types`).

## C2 · `llms.txt`

Texto plano en Markdown, **generado** desde el mismo objeto del catálogo (nunca escrito a mano), en este orden:

1. Qué es Grana en dos líneas, con `package.version`.
2. **Cómo consultar:** `npx grana catalog` (lista), `npx grana catalog <Pieza>` (detalle), `--find <texto>`, `--json`; y la ruta del archivo `node_modules/@grana/vue/dist/catalog.json` para quien no pueda ejecutar órdenes.
3. **Reglas para agentes** (fondo contratado, texto de bruno):
   1. Usa solo piezas, props, valores, eventos, slots y clases que estén en el catálogo **de la versión instalada**. Si algo no está, no existe: no lo inventes; consulta con `grana catalog --find` o pregunta.
   2. Importa cada pieza desde su `entry`. Si no es `@grana/vue`, registra su entrada (`install`) o impórtala en el componente; `registered: false` obliga a importarla.
   3. `stable` está prometido por semver; `candidate` puede cambiar en una menor; `draft` no tiene promesa: no lo uses sin que la persona lo acepte. Lo `deprecated` no se usa: usa lo que dice `use`.
   4. Estilo por tokens: importa `@grana/vue/style.css`; el color y la marca vienen del tema (`grana.config.json`); no pises componentes con colores literales ni selectores sobre sus partes internas (`g-*__*` no es API).
   5. Iconos: solo Lucide. En las piezas, por nombre de `icons.library` o registrados con `createIcons`; nunca caracteres ni SVG a mano.
   6. Respeta las props obligatorias (`required`) y da nombre accesible a lo que lo pide (`labels`, `label`, `aria-label`).
4. **Entradas:** una línea por entrada con su `path`, cómo se registra y sus piezas.
5. **Índice:** una línea por pieza: `- GBtn \`<g-btn>\` · stable · @grana/vue — Botón de acción; se renderiza como enlace si recibe href.` (marca `draft`/`candidate`/`deprecated` visible).
6. Recuento de tokens, iconos y clases, y cómo listarlos (`--tokens`, `--icons`, `--utilities`).

**Nombre y lugar:** `llms.txt` es la convención que los agentes ya buscan; va en `dist/` (lo cubre `files`) y se exporta como `./llms.txt`. **No** se llama `AGENTS.md`: ese nombre lo leen los agentes del repositorio donde están, y dentro de `node_modules` confundiría con las reglas del proyecto. Publicarlo también en la raíz del sitio (`/llms.txt`) queda reservado.

## C3 · Estados y lo que se lista

- **Se listan todas las piezas con `meta.json` y entrada**, marcadas con su `status`: `stable`, `candidate` y **también `draft`** (hoy `GStatus`, `GStatusIsland`, `GStatusMark`). Porqué: ocultarlas haría que un agente que las ve en el código o en el README crea que no existen o las reconstruya; marcadas, la regla 3 de C2 le dice que no tienen promesa. `grana catalog` las muestra marcadas y acepta `--status` para filtrar.
- **Lo reservado no se lista** (no es API, #1076): ni piezas reservadas sin `meta.json` ni valores reservados que el `meta.json` no declara. Listarlo invitaría a usarlo.
- `deprecated` (de pieza o de miembro) sale tal cual; el CLI lo marca.

## C4 · `grana catalog` (`@grana/cli`, y por tanto `grana`)

```
grana catalog [<pieza>] [--find <texto>] [--entry <ruta>] [--status stable|candidate|draft] [--tokens | --icons | --utilities] [--json] [--agents]
```

**Origen del catálogo:** el `@grana/vue` que resuelve el proyecto desde el directorio actual (resolución de Node hacia arriba, como `require.resolve('@grana/vue/catalog.json')` desde el `package.json` del directorio). Sin red, sin descargar, sin dependencia de `@grana/cli` sobre `@grana/vue`. La salida de texto empieza nombrando la versión y la ruta leídas.

| Forma | Hace |
| --- | --- |
| `grana catalog` | Lista las piezas agrupadas por entrada: nombre, etiqueta, estado (si no es `stable`) y descripción. |
| `grana catalog <pieza>` | Detalle de una pieza: entrada y cómo se registra (con las líneas de importación), estado, `since`, props (tipo `ts`, valores, por defecto, obligatoria, retirada), `v-model`, eventos, slots, métodos, claves de `labels`, propiedades `--g-*`. Acepta el nombre (`GBtn`), el alias (`GDatepicker`) o la etiqueta (`g-btn`), sin distinguir mayúsculas. |
| `--find <texto>` | Piezas cuyo nombre, etiqueta o descripción contienen el texto (sin distinguir mayúsculas ni acentos). Con `<pieza>` → código 2. |
| `--entry`, `--status` | Filtran la lista. Valor fuera de lo listado → código 2. |
| `--tokens`, `--icons`, `--utilities` | Listan esa sección (una a la vez; con `<pieza>` → código 2). |
| `--json` | La misma consulta en JSON por la salida estándar: sin argumentos, **el `catalog.json` completo tal cual**; con `<pieza>`, su objeto de C1.2; con `--find`/filtros, `{ "components": [ … ] }`; con una sección, ese arreglo u objeto. Siempre con el esquema de C1. |
| `--agents` | Imprime un bloque Markdown para pegar en `AGENTS.md` o `CLAUDE.md` del proyecto: la versión instalada, las reglas de C2 y las órdenes de consulta. **No edita ningún archivo** (como `init`, `cli-init.md` I6). Con `<pieza>`, una sección, `--find` o `--json` → código 2. |

**Códigos de salida:**

| Código | Cuándo |
| --- | --- |
| `0` | Respuesta dada (lista, detalle, sección, bloque), también una lista filtrada vacía. |
| `1` | **La pieza pedida no existe** en el catálogo instalado, o `--find` no encuentra nada. La salida de error nombra hasta cinco piezas cercanas (por distancia de edición y por `--find`). Porqué 1 y no 2: no es un error de uso sino la respuesta «no existe», que el agente debe poder distinguir (como `grep`). |
| `2` | Uso (opción desconocida o combinación inválida); `@grana/vue` **no está instalado** (mensaje con `npx grana init`); está instalado pero **no trae catálogo** (versión anterior: el mensaje nombra la versión instalada y pide actualizar); el catálogo no se puede leer como JSON; o su `schemaVersion` es mayor que la que este CLI entiende (pide actualizar `@grana/cli`). |

`catalog` no emite el código 3 (no instala nada).

**`init`** (enmienda de `cli-init.md` I7): sus «Siguientes pasos» terminan con una línea que nombra `npx grana catalog --agents` para quien diseñe con agentes. Texto fuera de la promesa, como el resto de la salida de `init`.

**Paridad del envoltorio:** `grana catalog …` es `@grana/cli catalog …` (I9 de `cli-init.md`); el conjunto de órdenes de la prueba de paridad de I9 suma `catalog`, `catalog GBtn --json` y `catalog GNoExiste`.

## C5 · Generación y verificación (bruno)

**Generación:** `packages/vue/scripts/build-catalog.mjs`, al final de `npm run build` (después de `build-types.mjs`), exporta `generateCatalog({ root })` (en memoria, como `generateTypes`) y escribe `dist/catalog.json` y `dist/llms.txt`. Reutiliza `readMetas`, `ENTRIES` y `generateTypes` (para `ts` y `functions`, `propType`/`payloadType` se exportan desde `build-types.mjs` o se mueven a un módulo común; nunca se copian). `package.json` de `@grana/vue` gana en `exports` **`"./catalog.json": "./dist/catalog.json"`** y **`"./llms.txt": "./dist/llms.txt"`** (sin `types`; no son entradas de código: no van a `typesVersions`, `ENTRIES` ni `src/types.test.js`). `files` ya cubre `dist`.

**Pruebas** (`packages/vue/src/catalog.test.js`, Vitest, sobre `generateCatalog()` en memoria):

- **Sin desfase con el meta:** cada pieza de `readMetas()` sale exactamente una vez; cada pieza que exporta cada entrada de `ENTRIES` sale con esa `entry`; cada prop, evento y slot del meta sale con su nombre; el número de props por pieza coincide.
- **Sin desfase con los tipos:** para cada prop, `ts` aparece como tipo de esa prop en el `.d.ts` de su entrada generado por `generateTypes()`; lo mismo el payload de cada evento.
- **`registered` es real:** con `createApp`, se aplica el registro de cada entrada (`app.use(default)` o, en las de gestor, `app.use(<fábrica>())`) y el conjunto de componentes registrados coincide con las piezas `registered: true` de esa entrada (más `aliases`).
- **Lo expuesto completo:** todo nombre de `overrides.exposed[Pieza]` (salvo gestores) está en `methods`.
- **Lista blanca:** ninguna pieza lleva claves fuera de C1.2; ningún valor de texto del catálogo contiene rutas `design/` ni `packages/` (hoy una sola nota de las 1542 cita una; bruno la reescribe en el meta).
- **Secciones:** `tokens` = conjunto de `--g-*` declarados en `defaults.css`; `icons.library` = `icons.json` `library`; `utilities` = clases de `utilities.json` en su orden.
- **Determinismo:** dos generaciones dan los mismos bytes; `schemaVersion === 1`.
- **`llms.txt`:** contiene cada `name` de pieza, cada `path` de entrada y la versión; está bajo su tope.

**Compuertas en `.github/scripts/gates.sh`** (sobre `dist/` tras el build): `test -f packages/vue/dist/catalog.json`, `test -f packages/vue/dist/llms.txt`, `grep -q '"GBtn"' packages/vue/dist/catalog.json`, `! grep -q '"prototype"' packages/vue/dist/catalog.json`, y que `node -e "import('@grana/vue/catalog.json', { with: { type: 'json' } })"` resuelve desde la raíz del repositorio. `npm pack --dry-run` de `packages/vue` lista ambos archivos.

**Topes de tamaño** (archivos aparte: no cuentan en `grana.js` ni en #506): `catalog.json` **≤ 512 KiB** (estimación de lima con los 86 meta de hoy, sangrado y sin `ts`: ≈ 330 KB) y `llms.txt` **≤ 32 KiB** (debe caber de una vez en el contexto de un agente; estimación ≈ 16 KB). Bruno mide y lo anota en el CHANGELOG; superar un tope lo decide lima (recortar descripciones o partir el archivo), no se sube solo.

**`@grana/cli`** (`packages/cli/test/catalog.test.js`, sin red, con proyectos falsos en directorios temporales y un `node_modules/@grana/vue` mínimo con su `package.json`, `exports` y `catalog.json`): lista → 0; detalle por nombre, alias y etiqueta → 0; pieza inexistente → 1 con sugerencias; `--find` con y sin resultados → 0/1; sin `@grana/vue` → 2; `@grana/vue` sin la ruta `./catalog.json` en `exports` → 2 con la versión; JSON roto → 2; `schemaVersion: 2` → 2; opciones inválidas y combinaciones prohibidas → 2; `--json` sin argumentos es byte a byte el archivo; `--agents` imprime y no escribe nada (el directorio queda igual). Sin dependencias nuevas.

**No verificable aquí:** la resolución con Yarn PnP y con pnpm estricto desde `npx grana` (el CLI corre fuera del proyecto y resuelve `@grana/vue` del proyecto); que agentes reales (Claude Code, Cursor, Copilot) lean `llms.txt` o el bloque pegado y dejen de inventar props (eso se observa en uso, no se prueba). Tras publicar, una pasada manual en un proyecto creado con `npx grana init`.

## Anotaciones de construcción (bruno, 2026-11-13; confirmadas o corregidas por lima tras leer `build-catalog.mjs` y `catalog.js`)

Nada de lo siguiente cambia una decisión de #1080; no hay fila nueva en `DECISIONS.md`.

1. **Entradas sin piezas ni API.** Confirmado: `sidebar-index` (extensión que solo se registra) sale con `install: "default"`, `components: []` y `functions: []`; solo se omite una entrada sin piezas, sin API y sin registro. Corrige C1.1, que daba por vacías todas las extensiones (hoy hay cuatro de este tipo: `testing` con `install: null`, `sidebar-filter`, `sidebar-index` y `page-index-list`).
2. **Piezas sin `tag`, `status` o `since` en su meta.** Confirmado: las partes de `GInputGroup` y `GTabPanel` heredan `status` y `since` del meta de su archivo; `tag` sin declarar se deriva en kebab del nombre. **Corrección:** la derivación actual (`name.replace(/([a-z0-9])([A-Z])/g, …)`) da `ginput-group-input` para `GInputGroupInput`, y el tag real es `g-input-group-input` (también `-select`, `-text`). La regla es `g-` + kebab del nombre sin la `G` inicial; mejor aún, declarar `tag` en el meta de las partes (el meta es de bruno). **Pendiente de bruno**, con una prueba: todo `tag` del catálogo empieza por `g-` y es el nombre con que la pieza se registra.
3. **Claves de `labels`.** Confirmado: se conservan las claves dinámicas como patrón (segmentos `*`, `<nombre>` o numéricos: `states.<status>.short`, `transcript.cols.*`, `expectedSpeakers.options.1`); se rechazan `a|b` y `a/b`; se eliminan las repetidas. El agente las lee como patrón, no como claves literales: `llms.txt` no lo explica y el detalle del CLI tampoco (texto, no contrato).
4. **`registered`.** Confirmado y con un matiz: el generador lo lee **estáticamente** del fuente de cada entrada (`const components = {…}` y `app.component('Nombre', …)`), no lo ejecuta; la prueba `catalog.test.js` lo comprueba con `createApp` en las 24 entradas, y esa prueba es la red de seguridad si una entrada nueva registra de otra forma. C1.2 decía «comprobado en ejecución»: se lee como «leído del fuente y comprobado en ejecución por la prueba».
5. **`grana catalog`.** Confirmado: `--entry` acepta la forma corta (`combobox`) además de la ruta completa; `<pieza>` junto con `--entry`, `--status` o `--find` da 2 (C4 ya lo decía); `--find` sin resultados con `--json` imprime `{"components": []}` por la salida estándar y sale con 1 (el contrato decía solo «código 1»: el JSON vacío permite al agente leer la respuesta y el código a la vez). Con `--entry` o `--status`, las sugerencias de «¿quisiste decir?» salen de todo el catálogo, no del filtrado (texto, fuera de la promesa).
6. **Tamaños.** `llms.txt`: el índice de piezas usa la **primera frase** de cada descripción (a lo sumo 160 caracteres, con «…»), porque con las completas medía 38 757 B y el tope es 32 KiB; medido **16 946 B**. Es C2.5 aplicado, no una excepción: el texto completo está en `catalog.json` y en `grana catalog <Pieza>`. `catalog.json`: medido **453 363 B** (442,7 KiB) contra 512 KiB: margen del 13 %. **El tope se mantiene en 512 KiB.** Al acercarse: el generador falla el build al superarlo (ya lo hace); lo decide lima, por este orden: (a) recortar textos de prop y evento largos en los meta (`description`, `note`) sin quitar campos; (b) si no basta, una variante resumida de `catalog.json` es un campo o archivo nuevo (menor) y no un cambio de esquema, y se mantiene el archivo completo. No se sube el tope a ciegas: es un archivo que un agente puede leer entero. **Pendiente de bruno (aviso, no bloqueo):** que `build-catalog.mjs` avise por la salida al pasar del 90 % del tope (460 800 B).
7. **Reglas para agentes duplicadas.** Se acepta la duplicación (el CLI no puede importar scripts de `@grana/vue`, y no se añade un paquete ni una dependencia solo para compartir seis frases), **con una prueba de igualdad** como condición: sin ella las dos copias se separan sin que nada lo note, y ya difieren (la regla 5 dice `--icons` en el generador y `npx grana catalog --icons` en el CLI). **Pendiente de bruno:** (a) igualar el texto de las seis reglas en las dos copias; (b) una prueba en `packages/cli/test/` que importe `AGENT_RULES` de `packages/vue/scripts/build-catalog.mjs` por ruta relativa del monorepo (solo prueba, no viaja en el paquete) y compruebe igualdad exacta, y que se omita con aviso si esa ruta no existe (un checkout aislado de `@grana/cli`). Las reglas siguen sin ser contrato de texto (C5, «Fuera de la promesa»); la prueba protege la coherencia, no un texto.

**Discrepancias ajenas anotadas por bruno, comprobadas contra `origin/claude/project-thread-ex9rvi` (eca9d37f, PR #20) y no corregidas aquí:** (i) `api.md` (líneas «Entradas propias que no son servicios» y «Solo ESM») nombra `./document-preview` y `./document-preview/pdfjs` en `exports`, y `package.json` no los tiene, ni en esta rama ni en la de PR #20: `GDocumentPreview` solo tiene `GDocumentPreview.css` (sin `.vue`, meta ni entrada), así que `api.md` describe lo contratado, no lo construido; se cierra cuando bruno construya la entrada. Es el único caso (las demás entradas de esa lista existen en `package.json`). (ii) El `CHANGELOG.md` de esta rama dice `GTable` `candidate`; su meta dice `stable`. **La PR #20 ya lo corrigió** («`candidate`: ninguna pieza en la 1.0.0. `GTable` subió a `stable`…»); se resuelve al integrar la PR, sin acción propia.

## Qué pasa a ser API pública (semver, #1076)

**Se promete (romperlo es una 2.0):** las rutas `@grana/vue/catalog.json` y `@grana/vue/llms.txt`; el esquema de C1 con `schemaVersion: 1` (nombres y significado de los campos, sus tipos, que los opcionales se omiten); que el catálogo refleja exactamente el `meta.json`, las entradas y el registro de la versión que lo trae; el comando `grana catalog` con sus opciones, la forma de `--json` (el esquema de C1) y los códigos 0/1/2. **Añadir** un campo, una sección o una opción es una menor (el lector debe ignorar lo que no conozca); cambiar o quitar uno exige `schemaVersion: 2` y una mayor. **Fuera de la promesa:** los textos (`description`, notas, el contenido de `llms.txt` y de `--agents`, la salida de texto de `catalog`), el formato exacto de `ts` (se promete el tipo, no su escritura), el orden de las claves dentro de un objeto y las sugerencias de «¿quisiste decir?». Lo que el catálogo dice de una pieza `candidate` o `draft` sigue sin promesa (C3).

**Desde qué versión:** la primera publicada que lo traiga. Si `1.0.0` aún no se ha publicado cuando bruno lo entregue, entra en `1.0.0`; si ya se publicó, en la menor siguiente, y el mensaje del código 2 «no trae catálogo» nombra esa versión.

## Reservado

- **Servidor MCP** (`grana mcp`: las mismas consultas como herramientas para agentes) y **web-types/`vetur`** para editores: se generarían del mismo `catalog.json`; reservados hasta que haya uso que los pida.
- Teclado, roles ARIA y qué se envía en un formulario (prometidos por #1076, pero hoy el `meta.json` no los declara de forma uniforme: `keyboard` en 11 piezas, en prosa): entran como campos nuevos de C1.2 en una menor cuando bruno los normalice en el meta.
- Valores de los tokens, claves de configuración del tema (`tokens.md` §1) y `tokens.json` del proyecto: son del CLI y del tema de cada proyecto, no del catálogo de componentes.
- Globales UMD por entrada, `@grana/blocks` (privado, #1076) y `/llms.txt` en la raíz del sitio.
