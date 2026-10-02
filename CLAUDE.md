# Grana · contexto para Claude Code

Librería open source de componentes **Vue 3** con tema por tokens (tipo Vuetify, pero la estructura es de la librería y el color lo pone cada proyecto). Repo: https://github.com/kevinedgm/grana. Paquetes: `@grana/vue` (componentes) y `@grana/cli` (Theme Engine: deriva el tema desde la configuración). Prefijo `g-` (`<g-btn>`, `GBtn`, `--g-*`).

## Lee esto antes de tocar código

1. `AGENTS.md`: reparto de responsabilidades. **Un archivo, un dueño.**
2. `DECISIONS.md`: todas las decisiones con su porqué. No las reabras sin motivo nuevo.
3. `docs/contract/tokens.md` y `docs/contract/api.md`: contratos vigentes.
4. `.agents/skills/bruno/SKILL.md` y sus `references/`: cómo se construye un componente.
5. Para el botón: `design/lab/btn/r01/` (kiwi), `design/contracts/btn.md` (lima), `design/lab/btn/estilo.md` (coco).

## Cómo se trabaja: Fruti Squad

| Agente | Decide | Dueño de |
| --- | --- | --- |
| kiwi | Estructura: anatomía, estados, comportamiento | `design/lab/<nombre>/rNN/` |
| lima | Contratos: API y tokens | `design/contracts/`, `docs/contract/` |
| coco | Estética: CSS del componente, tema por defecto; audita | `G<Nombre>.css`, `styles/defaults.css` |
| bruno | Funcionalidad, pruebas, empaquetado, CLI | `*.vue`, `*.test.js`, `*.meta.json`, `src/index.js`, `components.css`, `grana.css`, `scripts/` |
| mora-docs | Documentación de lo verificado | `README.md` del componente |

Flujo por componente: kiwi → lima → coco → bruno → coco (auditoría) → mora-docs. Si falta una entrega previa, detente e invoca al dueño. Las aprobaciones se dan solas si todo deriva de un estándar; decisiones de producto o identidad se preguntan al usuario.

## Modelos por rol

Cada rol es un agente en `.claude/agents/` con su modelo por defecto:

| Rol | Modelo por defecto | Por qué |
| --- | --- | --- |
| kiwi | Opus | Decisiones de arquitectura que luego cuestan caro de cambiar |
| lima | Opus | API y tokens: el contrato del que dependen los demás |
| coco | Sonnet | Sigue el contrato; lo verifica con mediciones |
| bruno | Sonnet | Sigue contrato y CSS; las pruebas detectan los errores |
| mora-docs | Sonnet | Documenta lo verificado |

**Componente complejo → coco y bruno también en Opus** (al lanzar el agente, `model: "opus"`). Cuenta como complejo si cumple al menos uno:
- compone dos o más componentes existentes o se solapa con ellos (p. ej. `GCard` con `GSurface`, `GMetric`, `GWidget`);
- tiene teclado compuesto propio (tabs, menú, listbox, grid, árbol);
- se posiciona sobre otros elementos (popover, menú, tooltip, hoja);
- lleva un motor de datos o de estado (filtros, orden, paginación, fechas).

**Fable** solo si el usuario lo pide o si Opus falla dos veces en lo mismo. **Haiku** para tareas mecánicas sin criterio (renumerar, actualizar índices, regenerar con un script existente).

## Reglas que no se rompen

- Los componentes solo leen `var(--g-*)` y alias locales `var(--_*)`. **Sin valores de respaldo** y sin literales de tema. Únicas medidas literales permitidas: `24px`, `44px` (área táctil) y el patrón de texto oculto accesible.
- Valores por defecto solo en `packages/vue/src/styles/defaults.css` (capa `grana.defaults`). El tema del usuario va sin capa y siempre gana.
- Mínimos de accesibilidad fuera del tema: área táctil ≥ 24px (≥ 44px táctil), texto ≥ 12px, contraste ≥ 4.5:1 (controles 3:1), foco siempre visible.
- El `.vue` no lleva `<style>`: el CSS es de coco, en su propio archivo.
- Sin `fetch` ni globals de la app en componentes.
- **Iconos: solo Lucide** (`docs/contract/icons.md`, DECISIONS #85 a #87): nada de caracteres `✓ ▲ ● › ⚠…`, ni pictogramas dibujados con CSS, ni trazos escritos a mano; en los componentes se usa el `GIcon` interno (`GLibIcon`, solo la lista de la librería) y la aplicación usa el `GIcon` público con `createIcons` (#197 a #203).

## Comandos

```bash
npm install
npm test                 # vitest (packages/vue)
npm run build            # vite build + scripts/build-fonts.mjs
python3 -m http.server 4173 -d packages/vue   # playground: http://localhost:4173/playground/
```

**Verificación antes de cada commit: lo que debe estar y lo que NO debe estar.**

```bash
grep -q "g-btn--variant-soft" packages/vue/dist/grana.css   # el estilo del componente está registrado
! grep -q "data:font" packages/vue/dist/grana.css           # la fuente no quedó incrustada
! grep -q "createApp" packages/vue/dist/grana.umd.js        # Vue no quedó empaquetado
```

## Estado actual

**Hecho y en GitHub** (todo `candidate`, con contrato, CSS, pruebas, `meta.json` y README): `GBtn`, `GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GCheckboxGroup`, `GSwitch`, `GBadge`, `GProgress`, `GMetric`, `GDialog`, `GMenu`, `GCalendar`, `GDatePicker`, `GDataList`, `GSidebar`, `GWidget` (+ `Config`, `Gallery`, `Grid`), `GStepper`, `GSurface`, `GHelper`, `GHelperScope`, `GAvatarMotion`, `GTable`, `GFilterBar`, `GPagination`, `GTabs` (+ `GTabPanel` y el slot `tabs` de `GDialog`), `GCard` (compone `GSurface`; auditoría en `design/lab/card/auditoria.md`), `GToast` (servicio imperativo: `createToaster`/`useToast`/`GToaster`; región viva única, traslado al modal; auditoría en `design/lab/toast/auditoria.md`), `GDivider` (horizontal `<hr>`, vertical `separator` en fila flex o grid, texto centrado, inset heredado `--g-divider-inset`, `subtle`/`strong`, `decorative`; auditoría en `design/lab/divider/auditoria.md`, verificación propia `node design/lab/divider/auditoria-verificar.mjs`, 1579/1579 en los tres motores); **sistema de formularios r02** (`GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GInputGroup` + partes, `GFieldGroup`, `GFormActions`, `GErrorSummary`; filas explícitas que siempre llenan el ancho, campos fusionados, `output`; `useFormField` exportado; auditoría en `design/lab/form/auditoria.md`, verificación propia `node design/lab/form/auditoria-verificar.mjs`; README principal en `GForm/README.md`); **`GIcon` público** (Lucide: 1em y `currentColor`, decorativo o con `label`, `flip-rtl`; registro por aplicación `createIcons` con cadenas de `lucide-static` y validación estricta; lista de la librería como API pública; icono por nombre en items de `GTabs`, `GMenu` y `GSidebar` y slot `lead` de `GFormSection`, #197 a #203; auditoría en `design/lab/icons/auditoria.md`, verificación propia `node design/lab/icons/auditoria-verificar.mjs`, 3558/3558 en los tres motores; los iconos propios de los componentes siguen en el `GLibIcon` interno). **Captura de voz, Fase 1** (entrada propia `@grana/vue/speech`, global UMD `GranaSpeech`, #238: `createSpeech`/`useSpeech`/`speechKey`, `GSpeechHost`, `GSpeechPill`, `GSpeechTrigger`; `app.use(speech)` registra los tres; 13 estados, adaptador de la aplicación sin red en Grana, dictado al cursor con deshacer propio, panel, hoja móvil, traslado al modal, borde compartido con `GToaster`; adaptador simulado en `@grana/vue/testing`; contrato `design/contracts/speech.md`, #207 a #238; auditoría en `design/lab/speech/auditoria.md`, verificación propia `node design/lab/speech/auditoria-verificar.mjs`, 6716/6716 en los tres motores; README principal en `GSpeechHost/README.md`; la barra activa de `GSidebar` pasó a `accent-text` por #228). Utilidades: `anchor.js`, `filters.js`, `topModal.js`, `liveRegion.js`, `edgeReserve.js`. `@grana/cli` con motor de tema OKLCH (claves `primary`, `neutrals`, `categories`, `dark`, etc., #107; diagnóstico informativo de `active` < 3:1, #228). Decisiones hasta la **#238** (la última, #238: la captura de voz sale a su propia entrada `@grana/vue/speech`; `@grana/vue` exporta `__shared` solo para uso interno de esa entrada).

**Verificación:** `npm test` (vitest, 1526 pruebas en 52 archivos en `@grana/vue`; 141 en `@grana/cli`), `npm run build`, `node packages/vue/scripts/check-icons.mjs` y las compuertas (las tres del CLAUDE.md más `grep -q "g-input-group__part"`, `grep -q "g-card--media-background"`, `grep -q "g-toast--type-error"`, `grep -q "g-divider--labeled"`, `grep -q "g-icon--flip-rtl"`, `grep -q "g-form-section__lead"` y `grep -q "g-speech-panel__privacy"` sobre `packages/vue/dist/grana.css`; además `! grep -q "createSpeech" packages/vue/dist/grana.js` y `test -f packages/vue/dist/speech.js`: la captura no viaja en el paquete principal, #238). Pruebas de navegador con Playwright en Chromium, Firefox y WebKit en `design/lab/theme-playground/` (`GRANA_PW_PORT=4204 npx playwright test` allí; 222 pruebas, 215 pasan y 7 se omiten por diseño; «disabled… no responden al hover» falla a veces en WebKit con carga en paralelo y pasa sola), incluida la prueba obligatoria de distribución de formularios (`tests/form-distribution.spec.mjs`, #184).

**Qué comprobar antes de dar algo por hecho:** el flujo completo kiwi → lima → coco → bruno → coco → mora-docs, y las auditorías de kiwi (`design/lab/table/auditoria-kiwi.md`) y de coco.

## Siguientes pasos

1. **Siguiente componente**, empezando por la ronda de kiwi (decisión de producto del usuario).
2. **Dark Color Presence:** la evidencia está reunida (`design/lab/tema-oscuro/dark-color-presence/`, `recommendation.md`). D es la opción preferida **pero no está adoptada**; adoptarla exige especificación y pruebas del motor, y decisión del usuario. No tocar el Theme Engine ni el contrato por esto sin esa decisión.
3. **Solo en entorno real** (no automatizable): lector de pantalla (VoiceOver, NVDA) sobre tabla, filtros, `GHelper` y la captura de voz (canales, `role="timer"`, `g-btn__status` vacías); captura de voz con Safari real, un motor real (Whisper local) y móvil real; hoja móvil del editor de filtros en móvil real; Safari, táctil y `forced-colors` reales; evaluación ciega de Dark Color Presence por una segunda persona (`design/lab/theme-playground/blind/`).

**Pendientes que no bloquean:** tema opcional grana + añil (en `tokens.md` §9); `round()` para alturas fraccionarias; adaptar las skills de kiwi, lima y coco al formato de `.agents/skills/bruno/references/handoffs.md`; actualizar Node 20 (sin soporte desde abril de 2026) a 22 o 24 LTS; revisar `npm audit` sin `--force`; texto de «cargando» para las filas esqueleto de `GTable` (requiere lima).

## Lecciones ya aprendidas (no repetirlas)

- Vite en modo librería **incrusta en base64** todo recurso que el CSS referencie. Por eso la fuente se copia con `scripts/build-fonts.mjs`, fuera de Vite.
- `min-block-size` es un mínimo, no una altura: el padding vertical se calcula desde la altura objetivo.
- Avisos de desarrollo: `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`, nunca `import.meta.env.DEV`.
- Declarar los eventos en `emits`; si no, el listener del consumidor llega al elemento nativo por `$attrs`.
- Componentes con `inheritAttrs: false` que pasan `$attrs` al `<input>`: el manejador propio (`@input`, `@change`) debe ir **primero** con `mergeProps({ onX }, attrs)`; si va después, una escucha del consumidor ve el `v-model` sin actualizar (con un `<input v-model>` nativo no pasa). Hay una prueba de orden en `GInput` y `GCheckbox`.
- La skill de bruno vive en `.agents/skills/bruno/`. Para que Claude Code la descubra como skill: `mkdir -p .claude/skills && ln -s ../../.agents/skills/bruno .claude/skills/bruno`.
