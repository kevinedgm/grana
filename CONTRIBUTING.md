# Cómo contribuir a Grana

Gracias por querer aportar. Grana es una librería de componentes Vue 3 con tema por tokens (ver el [README](README.md)). Está en **`0.1.0-beta`**: la API puede cambiar y todavía hay mucho trabajo de verificación en entorno real, así que una buena contribución puede ser un error bien reportado, una prueba en un lector de pantalla o una propuesta de componente, no solo código.

Al participar aceptas el [Código de conducta](CODE_OF_CONDUCT.md). Para vulnerabilidades, **no abras un issue público**: sigue [`SECURITY.md`](SECURITY.md).

## Antes de empezar

Lee, en este orden:

1. [`AGENTS.md`](AGENTS.md): quién es dueño de cada archivo.
2. [`CLAUDE.md`](CLAUDE.md): contexto del proyecto, reglas y estado actual (está escrito para el asistente de código, pero es el resumen más completo).
3. [`DECISIONS.md`](DECISIONS.md): todas las decisiones con su porqué.
4. [`docs/contract/tokens.md`](docs/contract/tokens.md) y [`docs/contract/api.md`](docs/contract/api.md): los contratos vigentes.
5. [`PENDIENTES.md`](PENDIENTES.md): lo aplazado, para no proponer lo que ya está registrado.

## Montar el entorno

Requisito: **Node ≥ 22** (`.nvmrc` fija 22). El repositorio es un monorepo de npm workspaces (`packages/vue` y `packages/cli`).

```bash
git clone https://github.com/kevinedgm/grana.git
cd grana
npm install
```

### Comandos

```bash
npm test                 # vitest en @grana/vue y @grana/cli
npm run build            # vite build de cada entrada + scripts/build-fonts.mjs
node packages/vue/scripts/check-icons.mjs    # verifica que los iconos sean solo Lucide
python3 -m http.server 4173 -d packages/vue  # playground: http://localhost:4173/playground/ (necesita el build)
```

Para probar un solo archivo: `cd packages/vue && npx vitest run src/components/GBtn/GBtn.test.js`.

### Pruebas de navegador

Las pruebas de comportamiento en navegador (Playwright, en **Chromium, Firefox y WebKit**) viven en `design/lab/theme-playground/` y corren contra el `dist/` construido:

```bash
npm run build                                   # en la raíz
cd design/lab/theme-playground
npm install
npm run setup
npx playwright install chromium firefox webkit  # una vez
GRANA_PW_PORT=4208 npx playwright test          # todo
GRANA_PW_PORT=4208 npx playwright test tests/tooltip.spec.mjs --project=chromium   # un archivo, un motor
```

**Un solo proceso de Playwright por puerto:** dos ejecuciones con el mismo `GRANA_PW_PORT` se tumban el servidor mutuamente. Usa un puerto propio. Si la máquina está cargada, algunas pruebas largas de WebKit y Firefox agotan el tiempo (están listadas en [`PENDIENTES.md`](PENDIENTES.md)); usa `--workers=2` y repite sola la que falle antes de darla por rota.

### Verificación antes de cada commit

Lo que debe estar y lo que **no** debe estar en el build:

```bash
grep -q "g-btn--variant-soft" packages/vue/dist/grana.css   # el estilo del componente está registrado
! grep -q "data:font" packages/vue/dist/grana.css           # la fuente no quedó incrustada
! grep -q "createApp" packages/vue/dist/grana.umd.js        # Vue no quedó empaquetado
```

Esas tres y el resto de compuertas están reunidas en `bash .github/scripts/gates.sh` (se ejecuta tras `npm run build`, informa de cada fallo y sale con 1 si falla alguna); la integración continua lo corre con las pruebas, el build y `check-icons` en [`.github/workflows/ci.yml`](.github/workflows/ci.yml), y la pasada completa de navegador en Chromium, Firefox y WebKit está en [`.github/workflows/e2e-full.yml`](.github/workflows/e2e-full.yml) (nocturna y manual). Además, `npm test` y `npm run build` en verde.

**El `meta.json` es el contrato de los tipos de TypeScript:** `npm run build` genera `dist/<entrada>.d.ts` desde él, así que todo prop, evento o slot nuevo debe constar en el `meta.json` del componente o el build falla (lo que el `meta.json` no puede expresar va en `packages/vue/types/`). Si añades un componente, añade al menos una compuerta `grep -q "<clase-del-componente>"` sobre `grana.css` (la lista completa está en `CLAUDE.md`, «Verificación»). Corrige primero lo que toca: una corrección pequeña se verifica con el archivo de pruebas afectado y se confirma que **fallaba antes y pasa después**; la pasada completa se hace una vez al cerrar el componente o el lote de cambios.

## Las reglas que no se rompen

- **Solo `var(--g-*)` y alias locales `var(--_*)`.** Los componentes no llevan valores de respaldo (`var(--x, valor)`) ni literales de tema (colores, radios, sombras, duraciones). Las únicas medidas literales permitidas son `24px` y `44px` (área táctil), el patrón de texto oculto accesible y las constantes que ya están anotadas en [`tokens.md` §7](docs/contract/tokens.md).
- **Los valores por defecto viven en un solo lugar:** `packages/vue/src/styles/defaults.css`, en la capa `grana.defaults`. El tema del usuario va sin capa y siempre gana.
- **Mínimos de accesibilidad fuera del tema:** área táctil ≥ 24 px (≥ 44 px con `pointer: coarse`), texto ≥ 12 px, contraste de texto ≥ 4.5:1 y de controles ≥ 3:1, foco siempre visible.
- **El `.vue` no lleva `<style>`.** El CSS va en su propio archivo (`G<Nombre>.css`).
- **Sin `fetch` ni globals de la aplicación** en los componentes: presentan y emiten intención. Los servicios (avisos, voz, estado, iconos) se crean por aplicación, sin instancia global ni efectos al importar (SSR).
- **Iconos: solo [Lucide](https://lucide.dev)** ([`docs/contract/icons.md`](docs/contract/icons.md), decisiones #85 a #87 y #197 a #203). Nada de caracteres Unicode como icono (marcas de verificación, triángulos, puntos, chevrons, signos de aviso), ni pictogramas dibujados con CSS, ni trazos escritos a mano. En los componentes se usa el `GIcon` interno; la aplicación usa el `GIcon` público con `createIcons`.
- **Textos sin valor por defecto** (Grana es internacional): se pasan por props o por `labels`.
- **Declara los eventos en `emits`**; si no, el listener del consumidor llega al elemento nativo por `$attrs`.
- **Avisos de desarrollo** con `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`, nunca `import.meta.env.DEV`.
- **Selectores estructurales sobre hijos de la aplicación** (`> *`, `:last-child`, `+`, `~`) ignoran el nodo de `GTooltip` con `:not(:where(.g-tooltip))` ([`api.md`](docs/contract/api.md), «Nodos hermanos de `GTooltip`»).

## El flujo de trabajo: Fruti Squad

Cada componente pasa por seis etapas, cada una con un **dueño** que decide una sola cosa y es el único que edita sus archivos («un archivo, un dueño»). Si falta la entrega de una etapa anterior, la siguiente se detiene y se la devuelve a su dueño: nadie rellena el hueco de otro.

| # | Rol | Decide | Entrega | Archivos |
| --- | --- | --- | --- | --- |
| 1 | **kiwi** | Estructura: anatomía, estados, comportamiento y teclado. Sin estilo | Una ronda con prototipo gris o de conceptos y `declaracion.md` | `design/lab/<nombre>/rNN/` |
| 2 | **lima** | Contrato: API del componente y tokens que consume | Contrato del componente y decisiones numeradas | `design/contracts/`, `docs/contract/`, `DECISIONS.md` |
| 3 | **coco** | Estética: el CSS, el tema por defecto y el movimiento | `G<Nombre>.css` y un banco de estilo | `G<Nombre>.css`, `styles/defaults.css` |
| 4 | **bruno** | Funcionalidad: props, eventos, slots, `v-model`, accesibilidad funcional, rendimiento, empaquetado | `.vue`, pruebas, `meta.json`, registro | `*.vue`, `*.test.js`, `*.meta.json`, `src/index.js`, `components.css`, `grana.css`, `scripts/`, `packages/cli/` |
| 5 | **coco** | Auditoría del componente real, cambiando de tema | `design/lab/<nombre>/auditoria.md` con mediciones | (la misma auditoría) |
| 6 | **mora-docs** | Documentación de lo ya verificado | `README.md` del componente | `packages/vue/src/components/G<Nombre>/README.md` |

Cosas que conviene saber:

- **Quién ejecuta los roles.** Hoy el flujo lo ejecutan agentes de IA (Claude Code, con un agente por rol en `.claude/agents/` y sus skills en `.agents/skills/`) bajo la dirección del mantenedor, que decide el producto. Una persona puede asumir cualquiera de los roles con las mismas reglas: cada uno tiene su skill en `.agents/skills/` con lo que debe entregar y cómo se verifica.
- **Decisiones de producto o identidad** (API nueva que no deriva de un estándar, valores estéticos por defecto, alcance) las toma el mantenedor. Lo que se deriva por completo de un estándar (WCAG 2.2 AA, APG de la W3C) o de un contrato vigente se aprueba sin preguntar, con una tabla de criterios que lo demuestre.
- **Personalidad.** Cada componente con forma visible debe aportar algo propio (comportamiento, movimiento o forma), no copiar el patrón común; la ronda de kiwi lo propone en «Qué lo hace distinto», y nunca a costa de accesibilidad, rendimiento ni del contrato de tokens.
- **Documentar solo lo verificado.** El README de un componente no promete lo planeado: si el `meta.json`, el contrato y el comportamiento discrepan, se devuelve la discrepancia a su dueño.

Si tu cambio toca un archivo cuyo dueño es otro rol (por ejemplo, quieres cambiar el CSS pero tu cambio es de lógica), descríbelo en el issue o en el PR y deja ese archivo a su dueño.

## `DECISIONS.md`

Es el registro de todas las decisiones: qué se decidió, por qué y qué se descartó. **No se reabren sin un motivo nuevo** (un dato medido, un caso que la decisión no cubría). Si tu propuesta contradice una decisión, cítala por su número (`#NNN`) y explica qué ha cambiado. Una decisión nueva se añade al final de la tabla con el siguiente número libre; la redacta el rol de contrato (lima).

## Cómo proponer un componente

1. **Busca primero:** el [catálogo](README.md#componentes), `PENDIENTES.md` (sección 3, componentes aplazados y reservados) y `DECISIONS.md`. Es posible que ya exista, esté reservado o se haya descartado con motivo.
2. **Abre un issue** con la plantilla «Propuesta de componente». Lo que más ayuda: el problema real y quién lo tiene, por qué no lo resuelve un componente existente (o su composición), los estados y el uso con teclado, qué es accesible de serie y cómo te imaginas que se distingue («qué lo hace distinto»).
3. **No abras un PR con el componente completo sin acuerdo previo:** una propuesta nueva empieza por la ronda de estructura (kiwi) y el contrato (lima), y un componente construido sin ellas se devolverá a esas etapas.
4. Si la propuesta se acepta, entra por el flujo de arriba.

## Cómo enviar un cambio

- Para correcciones pequeñas (un error, una errata, un README), abre directamente un PR.
- Para algo mayor, abre antes un issue y comenta tu plan.
- **Un PR, un tema.** Incluye en la descripción qué cambia, por qué, qué pruebas añadiste o corriste (y en qué motores) y qué **no** verificaste.
- Usa la [plantilla de PR](.github/pull_request_template.md).
- Mensajes de commit en español, con un prefijo que indique el rol del cambio (`bruno:`, `coco:`, `lima:`, `kiwi:`, `mora-docs:`) o `docs:` / `fix:` si no encaja en ninguno.
- Un error de accesibilidad es un error de primera clase: reporta el lector de pantalla, el navegador y el sistema con los que lo viste.
