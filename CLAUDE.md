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

**Fable (el modelo más avanzado) en tareas pesadas de kiwi, lima y bruno** (decisión del usuario, 2026-10-04): rondas de estructura de un componente nuevo, contratos de un componente nuevo y la construcción del `.vue` con su motor y pruebas se lanzan con `model: "fable"`. coco sigue en Opus en componentes complejos y Sonnet en el resto; mora-docs en Sonnet. Correcciones pequeñas, textos de contrato y remates siguen en Sonnet (u Opus si hay criterio delicado), sea cual sea el rol. **Haiku** para tareas mecánicas sin criterio (renumerar, actualizar índices, regenerar con un script existente).

## Personalidad e innovación (regla del usuario)

Grana no quiere ser «otro framework genérico». Cada componente debe aportar **personalidad**: explorar animaciones, comportamientos y formas propias con un factor de modernidad y vanguardia, no copiar el patrón común. Cómo se aplica en el flujo:

- **kiwi:** en cada `declaracion.md`, un apartado obligatorio **«Qué lo hace distinto»** con al menos una propuesta de comportamiento, estructura o movimiento más allá del patrón habitual (y por qué sirve al usuario, no solo adorna).
- **coco:** explora movimiento y forma con identidad (entradas y salidas, estados, microinteracciones; planes en `plans/`), siempre con tokens, `prefers-reduced-motion` y contraste intactos.
- **lima:** registra la decisión de personalidad del componente en `DECISIONS.md` para que no se pierda ni se reabra sin motivo.
- La innovación **nunca** sacrifica accesibilidad, rendimiento ni el contrato de tokens; si una idea choca con eso, se anota como pendiente y se busca otra.

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

**Hecho y en GitHub** (todo `candidate`, con contrato, CSS, pruebas, `meta.json` y README): `GBtn`, `GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GCheckboxGroup`, `GRadioGroup` (cinco apariencias `list` `inline` `segmented` `chip` `card`, radios nativos, `inline`/`segmented` comparten fila en `GFormRow`; auditoría en `design/lab/radio-group/auditoria.md`, verificación propia `node design/lab/radio-group/auditoria-verificar.mjs`, 81093/81093 en los tres motores), `GSwitch`, `GBadge`, `GProgress`, `GMetric`, `GDialog`, `GMenu`, `GCalendar`, `GDatePicker`, `GDataList`, `GSidebar`, `GWidget` (+ `Config`, `Gallery`, `Grid`), `GStepper`, `GSurface`, `GHelper`, `GHelperScope`, `GAvatarMotion`, `GTable`, `GFilterBar`, `GPagination`, `GTabs` (+ `GTabPanel` y el slot `tabs` de `GDialog`), `GCard` (compone `GSurface`; auditoría en `design/lab/card/auditoria.md`), `GToast` (servicio imperativo: `createToaster`/`useToast`/`GToaster`; región viva única, traslado al modal; auditoría en `design/lab/toast/auditoria.md`), `GDivider` (horizontal `<hr>`, vertical `separator` en fila flex o grid, texto centrado, inset heredado `--g-divider-inset`, `subtle`/`strong`, `decorative`; auditoría en `design/lab/divider/auditoria.md`, verificación propia `node design/lab/divider/auditoria-verificar.mjs`, 1579/1579 en los tres motores); **sistema de formularios r02** (`GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GInputGroup` + partes, `GFieldGroup`, `GFormActions`, `GErrorSummary`; filas explícitas que siempre llenan el ancho, campos fusionados, `output`; `useFormField` exportado; auditoría en `design/lab/form/auditoria.md`, verificación propia `node design/lab/form/auditoria-verificar.mjs`; README principal en `GForm/README.md`); **`GFormReveal`** (Fase 3: campos condicionales con `when`; cerrado = `inert` + `fieldset disabled`, fuera de `FormData`, contenido nunca desmontado; registro inactivo en `GForm`, #276; token `--g-duration-slow`, #280; auditoría en `design/lab/form-reveal/auditoria.md`, verificación propia `node design/lab/form-reveal/auditoria-verificar.mjs`; README en `GFormReveal/README.md`); **`GFormSection` Fase 3** (`mode` `static`/`collapsible`/`addable`, `open`/`added` con o sin `v-model`, `summary`, `headerPlacement` `auto`, `divider` con `GDivider` #192, `labels` de quitar con `alertdialog`; plegada = `inert` con datos en el envío, agregable sin agregar = registro inactivo; `GForm` abre las plegadas con error antes de enfocar vía `g-open-request` interno y cuenta errores por sección con `labels.sectionErrors`; auditoría en `design/lab/form-section/auditoria.md`); **`GDialog`** enfoca al abrir `[autofocus]` → primer control del contenido → cierre (#292, `tests/dialog-focus.spec.mjs`); **`GNumberField`** (Fase 2 de formularios, sin moneda: `<input type="text" role="spinbutton">` con `inputmode` y `aria-valuetext`, modelo `Number|null` sin recortar, `Intl` al salir y canónico oculto en el envío, `min`/`max`/`step`/`precision`/`locale`/`grouping`, −/+ con repetición, `change` por gesto, mínimo publicado a `GFormRow` medido por posiciones (#312); compone `GInput` con slots internos `field`/`end` (#309); personalidad P1 unidad pegada, P2 cifras que ruedan, P3 tope (#313); contrato `design/contracts/number-field.md`, #309 a #314; auditoría en `design/lab/number-field/auditoria.md`); **`GAvatar`** (imagen → `initials` → `icon` → iniciales de `name` → `user`; decorativo o `role="img"` con `label`; tamaños `space × 5/6/8/10/16`; `shape` `circle`/`square`; color por categoría del tema con `color` fijo o `categories` + hash FNV-1a UTF-8 + fmix32 estable; sin `status` (presencia con `GBadge` anclada a 45°); los huecos de `GCard`, `GTable`, `GMenu` y `GSelect` adoptan su caja; convive con `GAvatarMotion`; `GAvatarGroup` reservada; auditoría en `design/lab/avatar/auditoria.md`; contrato `design/contracts/avatar.md`, #293 a #297); **`GIcon` público** (Lucide: 1em y `currentColor`, decorativo o con `label`, `flip-rtl`; registro por aplicación `createIcons` con cadenas de `lucide-static` y validación estricta; lista de la librería como API pública; icono por nombre en items de `GTabs`, `GMenu` y `GSidebar` y slot `lead` de `GFormSection`, #197 a #203; auditoría en `design/lab/icons/auditoria.md`, verificación propia `node design/lab/icons/auditoria-verificar.mjs`, 3558/3558 en los tres motores; los iconos propios de los componentes siguen en el `GLibIcon` interno). **Captura de voz, Fase 1** (entrada propia `@grana/vue/speech`, global UMD `GranaSpeech`, #238: `createSpeech`/`useSpeech`/`speechKey`, `GSpeechHost`, `GSpeechPill`, `GSpeechTrigger`; `app.use(speech)` registra los tres; 13 estados, adaptador de la aplicación sin red en Grana, dictado al cursor con deshacer propio, panel, hoja móvil, traslado al modal, borde compartido con `GToaster`; adaptador simulado en `@grana/vue/testing`; contrato `design/contracts/speech.md`, #207 a #238; auditoría en `design/lab/speech/auditoria.md`, verificación propia `node design/lab/speech/auditoria-verificar.mjs`, 6716/6716 en los tres motores; README principal en `GSpeechHost/README.md`; la barra activa de `GSidebar` pasó a `accent-text` por #228). **Captura de voz, Fase 2** (en la misma entrada: `GTranscript` —rejilla de datos de APG con una sola parada, edición en la celda, selección, hablantes y roles neutros, `speakerColors` solo con categorías del tema, original y cambios, historial compartido, modos editable/solo selección/solo lectura/compacto—, `createTranscript` —capas literal/corregido/derivado, carga de JSON F1 y F2—, `useSpeechTarget` y `speech.targets` —destinos ligados al modelo del formulario, inserción con vista previa, deshacer y «Usado en»—, «Revisar» / `speech.review()` y diálogo de respaldo `g-speech-review`; `GCheckbox` con `field: false` en sus casillas, #262; contrato `speech.md` §20 a §32, #241 a #264; auditoría en `design/lab/speech/auditoria-f2.md`, verificación propia `node design/lab/speech/auditoria-f2-verificar.mjs`, 27708/27708 en los tres motores tras cerrar los hallazgos 3 y 4; README en `GTranscript/README.md`). Utilidades: `anchor.js`, `filters.js`, `topModal.js`, `liveRegion.js`, `edgeReserve.js`. `@grana/cli` con motor de tema OKLCH (claves `primary`, `neutrals`, `categories`, `dark`, etc., #107; diagnóstico informativo de `active` < 3:1, #228). Decisiones hasta la **#314** (#274 a #282: `GFormReveal` en `form.md` §14, registro inactivo, `--g-duration-slow`; #281: `GDialog` debe crecer sin mover el disparador, ronda propia pendiente; #282: `GRadioGroup` `__label-text` con `dir="auto"`) #283: el cuerpo de `GFormSection` no distribuye; campos, `GFormRow` y `GFormReveal` van en un `GFormLayout` (aviso de desarrollo). #284 a #292: Fase 3 de `GFormSection` y orden del foco inicial de `GDialog`; #293 a #297: `GAvatar` (`categories` en vez de `colors`, hash FNV-1a + fmix32, `toUpperCase()` sin región, el hueco adopta la caja del avatar); #298: personalidad de `GAvatar` (revelado de la foto con asentamiento, morfo de `shape`, monograma `lining-nums`). #299 a #305: **ronda de personalidad** (`design/lab/personalidad/r01/`, decisiones del usuario: rebote sutil sí, diálogo desde el disparador con tope sí, sacudida única al enviar sí): tokens `--g-ease-spring`/`--g-ease-bounce`, patrón único de reduced motion, una decisión por componente (`GBtn`, `GDialog`, `GTabs`, `GCard`, `GInput`+`GForm`, `GMenu`) y planes 015 a 020 en `plans/`, **todos ejecutados** (specs `tests/personalidad-{btn,tabs,card,input,dialog,menu}.spec.mjs`; #306 `data-orientation` en paneles sueltos, #307 límites de `GDialog`, #308 `GMenu` con `id` propio y `HOVER_MS`). #309 a #314: `GNumberField`.

**Requisitos:** Node ≥ 22 (`.nvmrc`; `engines` en el raíz y en `@grana/cli`); `npm audit` en 0 vulnerabilidades con Vitest 4.1.11.

**Verificación:** `npm test` (vitest 4, 2061 pruebas en 65 archivos en `@grana/vue`; 141 en `@grana/cli`), `npm run build`, `node packages/vue/scripts/check-icons.mjs` y las compuertas (las tres del CLAUDE.md más `grep -q "g-input-group__part"`, `grep -q "g-card--media-background"`, `grep -q "g-toast--type-error"`, `grep -q "g-divider--labeled"`, `grep -q "g-icon--flip-rtl"`, `grep -q "g-form-section__lead"`, `grep -q "g-speech-panel__privacy"`, `grep -q "g-transcript__orig"`, `grep -q "g-radio-group__segment"`, `grep -q "g-form-reveal__body"`, `grep -q "g-form-section__panel"`, `grep -q "g-avatar--shape-square"`, `grep -q "g-reject-shake"`, `grep -q "g-menu__highlight"` y `grep -q "g-number-field"` sobre `packages/vue/dist/grana.css`; además `! grep -q "createSpeech" packages/vue/dist/grana.js`, `! grep -q "createTranscript" packages/vue/dist/grana.js` y `test -f packages/vue/dist/speech.js`: la captura no viaja en el paquete principal, #238). Pruebas de navegador con Playwright en Chromium, Firefox y WebKit en `design/lab/theme-playground/` (`GRANA_PW_PORT=4208 npx playwright test` allí; 627 pruebas en los tres motores, 586 pasan y 41 se omiten por diseño (pasada completa 2026-10-03 con `--workers=2`, 23 min); la compuerta de rendimiento de la voz F2 se exige solo con un worker: `npx playwright test tests/speech-f2-perf.spec.mjs --workers=1`, < 100 ms en Chromium y Firefox y < 200 ms en WebKit, #264; «disabled… no responden al hover» falla a veces en WebKit con carga en paralelo y pasa sola; igual «disparador Δ 0px…» de `form-reveal.spec.mjs` en WebKit (cuenta de cuadros, no el desplazamiento; hallazgo 4 de `design/lab/form-reveal/auditoria.md`, pendiente de bruno)), incluida la prueba obligatoria de distribución de formularios (`tests/form-distribution.spec.mjs`, #184).

**Verificación por niveles (decisión del usuario):** una corrección pequeña dentro de una ronda, o tras un reporte del usuario, se verifica solo con lo que toca: el spec o script afectado en Chromium, confirmando que fallaba antes y pasa después. La pasada completa (`npx vitest run`, `npm run build`, compuertas y specs en Chromium, Firefox y WebKit) se hace **una vez** al cerrar el componente o el lote de correcciones, siempre sobre el estado final, aunque ya hubiera pasado antes.

**Qué comprobar antes de dar algo por hecho:** el flujo completo kiwi → lima → coco → bruno → coco → mora-docs, y las auditorías de kiwi (`design/lab/table/auditoria-kiwi.md`) y de coco.

## Siguientes pasos

0. **Pendientes aplazados:** todos en `PENDIENTES.md` (personalidad segunda tanda, formularios fases 2–4, componentes aplazados, voz F3, tema, defectos conocidos, entorno real). Se actualiza al cerrar cada componente.
1. **Siguiente componente**, empezando por la ronda de kiwi (decisión de producto del usuario).
2. **Dark Color Presence:** la evidencia está reunida (`design/lab/tema-oscuro/dark-color-presence/`, `recommendation.md`). D es la opción preferida **pero no está adoptada**; adoptarla exige especificación y pruebas del motor, y decisión del usuario. No tocar el Theme Engine ni el contrato por esto sin esa decisión.
3. **Solo en entorno real** (no automatizable): lector de pantalla (VoiceOver, NVDA) sobre tabla, filtros, `GHelper` y la captura de voz (canales, `role="timer"`, la rejilla de `GTranscript` en modo foco y en exploración, `<del>`/`<ins>`, editor en la celda); captura de voz con Safari real, un motor real (Whisper local) y móvil real; hoja móvil del editor de filtros en móvil real; Safari, táctil y `forced-colors` reales; evaluación ciega de Dark Color Presence por una segunda persona (`design/lab/theme-playground/blind/`).

**Pendientes que no bloquean:** ver `PENDIENTES.md`.

## Lecciones ya aprendidas (no repetirlas)

- Vite en modo librería **incrusta en base64** todo recurso que el CSS referencie. Por eso la fuente se copia con `scripts/build-fonts.mjs`, fuera de Vite.
- `min-block-size` es un mínimo, no una altura: el padding vertical se calcula desde la altura objetivo.
- Avisos de desarrollo: `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`, nunca `import.meta.env.DEV`.
- Declarar los eventos en `emits`; si no, el listener del consumidor llega al elemento nativo por `$attrs`.
- Componentes con `inheritAttrs: false` que pasan `$attrs` al `<input>`: el manejador propio (`@input`, `@change`) debe ir **primero** con `mergeProps({ onX }, attrs)`; si va después, una escucha del consumidor ve el `v-model` sin actualizar (con un `<input v-model>` nativo no pasa). Hay una prueba de orden en `GInput` y `GCheckbox`.
- **Playwright: un solo proceso por puerto.** Dos agentes corriendo `GRANA_PW_PORT=4208` a la vez se tumban el servidor mutuamente (`NS_ERROR_CONNECTION_REFUSED` en masa). Cada agente que lance Playwright en paralelo usa un puerto propio (p. ej. 4208 bruno, 4209 coco, 4210 mora-docs) o espera a que termine el otro.
- La skill de bruno vive en `.agents/skills/bruno/`. Para que Claude Code la descubra como skill: `mkdir -p .claude/skills && ln -s ../../.agents/skills/bruno .claude/skills/bruno`.
