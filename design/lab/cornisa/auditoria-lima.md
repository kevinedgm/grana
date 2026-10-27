# Auditoría de contrato · Cornisa (lima)

**Fecha:** 2026-10-27 · **Rama:** `claude/project-thread-2ck6nd` (PR #17, commit de entrada `c39a025`) · **Dueño:** lima · **Alcance:** solo contrato (API, tipos, máquina de estados, ARIA/teclado/foco, seguridad, errores), brecha frente a los contratos de Grana y solapamiento con la isla de estado. No cambia código de Cornisa, contratos de Grana ni `DECISIONS.md`. La auditoría estética y de CSS es de coco (`auditoria-coco.md`, en paralelo).

## Resumen

Cornisa tiene un núcleo sin DOM ordenado y bien separado: máquina pura, gestor con reloj inyectable, solo `textContent` y un atajo que exige modificador. Su contrato real, sin embargo, se ha desviado del contrato «aprobado» (`docs/04`). Tiene cuatro defectos de API confirmados en Node: `promise()` con una función que devuelve texto, `show()` idempotente que se pierde durante la salida, `update()` de prioridad que no reordena y `destroy()` sin eventos. Además deja abiertas dos cuestiones de WCAG 2.2.1 y 2.4.11 que Grana ya resolvió: acciones que caducan a los 5 s y relevo bajo el puntero. Frente a Grana incumple todas las «Reglas que no se rompen» (tokens, capas, literales, iconos, textos por defecto, avisos, borde compartido, modal) y contradice de frente decisiones del usuario sobre la isla (#693 «un error no se queda», #702 «nunca se releva bajo la mano», #704 frontera con `GToast`). Mi recomendación, **que es decisión del usuario**, es mantenerla aparte, declarada fuera de Grana y sin convivir con `GStatusIsland` en la misma aplicación. Lo que aporta de verdad (progreso determinado con anuncios por hitos, núcleo probado con reloj falso) se llevaría a `GToast`/`GStatusIsland` mediante una ronda de kiwi, sin sustituir la isla.

**Convención.** En cada hallazgo, **Hecho** es lo leído o ejecutado con evidencia `archivo:línea`; **Inferencia** es lo deducido sin ejecutarlo; **Propuesta** es mi recomendación para el dueño. Gravedad: **bloqueante** (impide declararlo conforme o produce un defecto visible para la persona), **importante** (contrato incoherente o riesgo de accesibilidad real), **menor**.

**Método.** Leí `packages/cornisa/{src,types,README.md,package.json,test}`, `design/lab/cornisa/docs/04-api-y-maquina-de-estados.md`, `design-hub/lab/isla/r03/decisiones.yaml`, `implementacion/compuerta-candidate.md` y `orden-de-construccion-lima.md`. Del lado de Grana: `docs/contract/api.md`, `tokens.md`, `icons.md`, `design/contracts/status.md`, `toast.md` y DECISIONS #315–#328 y #693–#707. **Ejecuté** un sondeo del núcleo en Node (`createManager`/`normalize` de `src/core`, réplica literal de `asOpts`) para confirmar L1, L9, L10 y L11. **No ejecuté** las pruebas de navegador ni un lector de pantalla.

---

## A. Calidad interna del contrato de Cornisa

### L1 · `promise()`: un desenlace como función que devuelve texto no cambia el título — **importante**
- **Hecho:** `src/index.js:63` aplica `asOpts = (m, v) => typeof m === 'function' ? m(v) : typeof m === 'string' ? { title: m } : m`. El resultado de la función no pasa por la conversión de texto, y `...'Listo 3'` se esparce como `{0:'L',1:'i',…}`. Sondeo: tras `success: (v) => \`Listo ${v}\``, el título sigue siendo «Cargando», con 7 claves numéricas que `normalize` ignora en silencio. Los tipos lo permiten (`types/index.d.ts:70-71`, `(value: T) => string | Partial<ActivityOptions>`) y lo usan la prueba de tipos (`test/types/usage.ts:10`) y el ejemplo ejecutable `examples/cdn/04-casos-de-uso.html:55`, que muestra el defecto.
- **Propuesta:** `const r = typeof m === 'function' ? m(v) : m; return typeof r === 'string' ? { title: r } : r;` y una prueba de núcleo con función→texto. Es lo que contrata `toast.md:271` para el mismo patrón.

### L2 · Acciones que caducan a los 5 s (D3-03 sin resolver) — **importante**
- **Hecho:** `duration` por defecto es `5000` para todo salvo `error` (`src/core/manager.js:10`, `:88`), también con `actions`. D3-03 («¿Actividades con acciones persistentes por defecto?») sigue `unresolved` (`design-hub/lab/isla/r03/decisiones.yaml`). La pausa solo existe con puntero o foco dentro.
- **Inferencia:** quien navega con teclado o lector y no llega a la isla en 5 s (ver L4) pierde la acción («Deshacer», «Abrir»). Es el caso que WCAG 2.2.1 pide evitar.
- **Propuesta:** resolver D3-03 como Grana: una actividad con `actions` no se descarta por tiempo (`toast.md:15`, #142). La otra salida es exigir una segunda vuelta visible (`status.md:219`). Es un cambio de valor por defecto de la API y lo decide el usuario de Cornisa.

### L3 · Relevo bajo el puntero — **importante**
- **Hecho:** solo el foco fija la visible (`renderer.js:331` `setPinned(true)`). El puntero solo pausa el tiempo (`renderer.js:339`). `reconcile` permite el desplazamiento si no está expandida ni fijada (`manager.js:202-203`). Una actividad `high` que llega mientras el puntero está sobre la acción rápida cambia el texto y la acción bajo el cursor.
- **Inferencia:** puede producir una activación por error, porque el clic cae en la acción de otra actividad.
- **Propuesta:** el puntero dentro también fija (`setPinned` con contador de causas: foco, puntero, dedo), como #702 («nunca se releva bajo la mano»). Lo nuevo sube «+N» y espera.

### L4 · El teclado llega a la isla solo al final de la página y el atajo viene apagado — **importante**
- **Hecho:** la raíz se añade al final del contenedor (`renderer.js:93`). El atajo es opcional y está desactivado por defecto (`index.js:43`, D3-02). Ninguna otra vía lleva el foco a la isla.
- **Inferencia:** con la configuración por defecto, quien usa teclado recorre toda la página antes de alcanzar la acción, y eso choca con L2. Un `popover="manual"` no cambia el orden de tabulación.
- **Propuesta:** documentar en el README que una isla con acciones necesita `shortcut`. Mejor aún: que el atajo venga activado por defecto con una combinación neutra y se pueda desactivar (WCAG 2.1.4 lo permite si se puede desactivar o reasignar).

### L5 · Devolución del foco: al `main`/`body`, con efectos sobre el DOM de la aplicación — **importante**
- **Hecho:** sin destino guardado, el foco va a `main` o a `body` (`renderer.js:253`). Si `main` no es enfocable, se le pone `tabindex="-1"` **para siempre** (`renderer.js:255`): Cornisa nunca lo quita. El «disparador» es el elemento enfocado **cuando entró la actividad** (`renderer.js:286`), no el que tenía el foco al entrar en la isla.
- **Inferencia:** en Safari un clic no enfoca el botón, así que el destino suele ser `null` y el foco acaba en `main`, arriba de la página.
- **Propuesta:** guardar el destino en `focusin` de la isla (`relatedTarget`), quitar el `tabindex` temporal al salir del foco y, sin destino, ir al siguiente tabulable. Es la regla de `status.md:427` («nunca a `body`»).

### L6 · WCAG 2.4.11: la píldora compacta persistente puede tapar el foco — **importante**
- **Hecho:** el expandido se contrae al salir el foco (`renderer.js:337`), pero la fila compacta se queda fija arriba. Con `error`, que es persistente por defecto (`manager.js:88`), se queda indefinidamente. La reserva `--cornisa-reserved` es opcional y la tiene que aplicar la aplicación (`README.md:95`).
- **Propuesta:** elegir una de las tres salidas de `api.md:354` (#664). La más cercana es la de la isla de Grana: recogerse si tapa el foco (`status.md:231`). La otra es escribir la reserva en `scroll-padding-block-start` mientras se ve.

### L7 · La intención no llega al lector — **importante**
- **Hecho:** el icono es `aria-hidden` (`renderer.js:73`) y el texto anunciado es `title. body` (`manager.js:141`). `warning`, `success` y `neutral` suenan igual y solo `error` cambia de canal (`manager.js:125`). `docs/04` §4 dice «forma de icono + texto», pero el texto no lleva la intención.
- **Propuesta:** etiquetas `labels.intents.{neutral,success,warning,error}` como prefijo oculto del título y del anuncio, como `types.*` en `toast.md:176` y `status.md:389` (WCAG 1.3.1).

### L8 · `role="timer"` dentro de un `button` — **menor**
- **Hecho:** la cuenta atrás (`meta`, `renderer.js:171`) es hija del conmutador (`renderer.js:77`). En un `button` los hijos son presentacionales, así que el rol se pierde y el nombre accesible del botón cambia cada segundo (`renderer.js:169`).
- **Propuesta:** sacar el temporizador del botón (hermano en la fila, con `aria-describedby`), como en `status.md:296`.

### L9 · `show({ id })` idempotente se pierde durante la salida — **importante**
- **Hecho:** si la actividad con ese `id` está en `dismissing`, `show` llama a `update` (que devuelve `false`) y devuelve el mismo asa sin avisar (`manager.js:266-267`). Sondeo: `show({id:'x',title:'B'})` en `dismissing` devuelve el asa en `dismissing` con el título «A», y unos milisegundos después `get('x')` es `null`.
- **Inferencia:** una condición que va y vuelve deprisa («Sin conexión» → «Conectado» → «Sin conexión») desaparece.
- **Propuesta:** si el `id` está saliendo, crear una actividad nueva (o reabrirla) y documentarlo. Es la promesa de `docs/04:28` («idempotente»).

### L10 · `update({ priority })` no reordena — **menor**
- **Hecho:** `update` emite `change` directamente sin `reconcile` (`manager.js:247`). Sondeo: subir a `high` una actividad en cola no la adelanta hasta el siguiente `show`.
- **Propuesta:** `update` pasa por `changed()` (lote + `reconcile`).

### L11 · `destroy()` es mudo y los motivos no están contratados — **menor**
- **Hecho:** `manager.destroy` pone `removed` y resuelve sin emitir `statechange` ni `dismiss` (`manager.js:311`; sondeo: 0 eventos). Los motivos (`api`, `user`, `timeout`, `settled`, `destroy`) no figuran en el README y el tipo es `string | null` (`types/index.d.ts:35`).
- **Propuesta:** emitir `dismiss` con `reason: 'destroy'` (o documentar que no se emite), y tipar `DismissReason` como unión abierta (`'api' | 'user' | 'timeout' | 'settled' | 'destroy' | (string & {})`).

### L12 · `promise()`: el desenlace hereda el cuerpo y las acciones de «cargando» — **menor**
- **Hecho:** `update` fusiona sobre lo anterior (`manager.js:30`), así que `body`, `actions` e `icon` de `loading` pasan al éxito o al error si el desenlace no los trae.
- **Propuesta:** cada desenlace sustituye `body` y `actions` (`toast.md:273`; F4 de `status.md:154`).

### L13 · Un oyente de la isla que lanza puede congelar la animación — **menor (inferencia)**
- **Hecho:** el `emit` de la isla no aísla errores (`index.js:45`), a diferencia del gestor (`manager.js:107`). `reservedchange` se emite dentro de `draw()` (`renderer.js:249` ← `onDropEvent` ← `draw`). `loop` solo vuelve a pedir cuadro después de `draw()`.
- **Inferencia:** un `reservedchange` que lanza deja la gota a mitad de movimiento. No lo verifiqué en el navegador.
- **Propuesta:** `try/catch` por oyente y reenvío a `error`, como el gestor.

### L14 · El contrato «aprobado» no es el que se construyó — **importante**
- **Hecho:** `docs/04` se titula «v0 APROBADA», pero difiere de `src`: `maxVisible` (línea 3 «fijo en 1» frente a línea 24 «por defecto 2»; no existe en el código), `labels` `{ region, expand, collapse, close, more }` (línea 23) frente a `{ close, more }` (`renderer.js:21`), `duration` 4000 (línea 36) frente a 5000, tokens `--isl-*` (línea 53) frente a `--cornisa-*`, `AbortController` (línea 48) frente al registro manual, y una máquina sin `demote` desde `entering` ni desde `expanded` (líneas 56-62) frente a `machine.js`. Además, §7 de `docs/04` sigue pidiendo aprobación.
- **Propuesta:** un contrato vigente único (p. ej. `docs/05-contrato-v0.2.md`) generado desde los tipos, que marque `docs/04` como histórico.

### L15 · Tipos y README con huecos — **menor**
- **Hecho:** `Snapshot.primary.content: Required<ActivityOptions>` (`types/core.d.ts:9`) promete `id` y `duration` definidos, y ninguno lo está. `Dims` (`core.d.ts:37`) omite `cx`, `radius`, `top`, `vw` y `scroll`. `island.on` acepta cualquier tipo sin aviso. El README se contradice sobre `npm test`: «solo el núcleo» (`README.md:10`) frente a «núcleo + navegador» (`README.md:127`). `IslandEvents` no documenta que sin oyentes de `error` el error se relanza en un `setTimeout` (`index.js:49`).
- **Propuesta:** corregir los tipos y el README. Una prueba `tsd`/`expect-type` de `Snapshot` lo vigilaría.

### L16 · Textos y formatos fijos — **menor**
- **Hecho:** textos por defecto en inglés (`renderer.js:21-24`). Formatos fijos `${title}: ${m}%` (`manager.js:243`), `mm:ss` (`renderer.js:170`) y `+N` sin `Intl`. El reloj del temporizador es `Date.now()`, fuera del `clock` inyectable (`renderer.js:169`). `endsAt` no dice que es un tiempo de época en ms.
- **Propuesta:** `labels.progress(title, pct)` y `labels.remaining(ms)`, formateo con `Intl.NumberFormat`/`Intl.DurationFormat` cuando exista, y `endsAt` documentado.

### L17 · El «candidate» de Cornisa no es el `candidate` de Grana — **importante**
- **Hecho:** el README dice «candidate en el registro del Design Hub» (`README.md:5`). Esa compuerta se evaluó «a mano» con una skill de lima ajena a este repo (`compuerta-candidate.md:3`, `orden-de-construccion-lima.md:3`). En Grana, `candidate` exige contrato en `design/contracts/`, `meta.json`, auditoría de coco y README de mora-docs.
- **Propuesta:** en este repo, llamarlo «candidate del Design Hub (externo)» o «alpha», para que nadie lo lea como estado de Grana.

### L18 · Seguridad — **menor**
- **Hecho:** todo el texto va por `textContent` y no hay red ni almacenamiento (cumple). `icon` acepta cualquier `Node` y lo clona con atributos (`renderer.js:140`): un `<img onerror>` del consumidor se ejecuta (sin CSP estricta). El ejemplo `04` usa `new Function` (`examples/cdn/04-casos-de-uso.html`, línea 36 de su script), lo que choca con la promesa de «CSP estricta» si alguien copia el ejemplo.
- **Propuesta:** documentar que `icon` es entrada **de confianza** (no viene del usuario final) y quitar `new Function` del ejemplo.

### L19 · Con un `<dialog>` modal abierto, la isla queda inerte y sus anuncios fuera del modal — **importante**
- **Hecho:** el README lo asume («Mientras haya un modal abierto, la isla es inerte», `README.md:120`). Las regiones `status`/`alert` viven en el contenedor, fuera del modal (`renderer.js:56-57`, `:93`).
- **Inferencia:** un error que llega con un modal abierto no se puede atender, y su anuncio probablemente no se lee, porque el contenido inerte sale del árbol de accesibilidad. No verificado con un lector.
- **Propuesta:** trasladar la raíz y los canales al modal superior mientras esté abierto (`utils/topModal.js` en Grana, `status.md:444`).

### L20 · Sin `offset` para una cabecera fija, y una variable escrita en `<html>` — **menor**
- **Hecho:** la posición es `safe-top + 4px` (`cornisa.css:30`). Solo se desplaza redefiniendo `--cornisa-safe-top`. `--cornisa-reserved` se escribe en el `style` de `<html>` (`renderer.js:248`) sin impedir dos islas.
- **Propuesta:** opción `offset.top` y aviso si se crea una segunda isla en el mismo documento.

---

## B. Brecha frente a los contratos de Grana

Hoy Cornisa **declara** que no sigue las reglas (`README.md:8`). Esta parte dice qué habría que cambiar **si** entrara en Grana: como componente, como motor de uno, o solo para convivir.

### L21 · Tokens, literales, respaldos y capas — **bloqueante** (para entrar)
- **Hecho:** valores en `:root` sin capa (`cornisa.css:3-15`). Literales de tema (`#111111`, `400px`, `24px`, `4px`, `16px`, `0.875rem`, `120ms`, `160ms`, `1.2s`, `2147483000`), `env(…, 0px)` con respaldo (`cornisa.css:13`) y duraciones en JS (`renderer.js:191` `duration: 160`). No hay declaración de capas. Las reglas exigen solo `var(--g-*)`/`--_*` sin respaldos, valores en `defaults.css` y las cuatro capas en la primera línea (CLAUDE.md «Reglas que no se rompen», #806).
- **Propuesta (sustitución por tokens existentes; ningún token del tema nuevo):**

| Cornisa | Grana | Nota |
| --- | --- | --- |
| `--cornisa-bg` / `--cornisa-fg` | `--g-color-text` / `--g-color-surface` (superficie inversa) **o** cristal grafito `--g-glass-*` con `light-dark()` (`tokens.md` §12.1, #694) | La isla de Grana dejó la inversa por #694 (decisión del usuario) |
| `--cornisa-muted`, `--cornisa-hover`, `--cornisa-track` | alias locales `--_*` con `color-mix()` sobre la tinta; pista `--g-color-border` | Los decide coco; no son tokens |
| `--cornisa-focus` | `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | |
| `--cornisa-max-width: 400px` | constante `space × 100` (`tokens.md` §29.6) | No es token |
| `--cornisa-radius-expanded: 24px` | la mitad de la fila (como `status.md`) o `--g-radius-lg`/`-xl` | |
| `--cornisa-z` | ninguno: siempre `popover` (capa superior), como `GToaster` (#141) | Sin respaldo `fixed` + z |
| `--cornisa-safe-top` | `env(safe-area-inset-top)` dentro de `calc()` con `--g-space-*` + `edgeReserve` | Sin respaldo |
| `--cornisa-font`, tamaños `rem` | `--g-font-ui`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-title-sm-weight` | 13px (0.8125rem) no es un rol: pasa a `caption` |
| `120ms` / `160ms` / indeterminado | `--g-duration-fast` / `--g-duration-press` / el indeterminado de `GProgress` | |
| muelles `SPRINGS` (`drop.js:17`) | `--g-ease-spring` + `--g-duration-slow` (ver L27) | |
| `--cornisa-reserved` | registro `utils/edgeReserve.js` (ver L25) | Sin variable en `<html>` |

  **Tokens nuevos:** ninguno si se integra como la isla (`status.md` «Tokens consumidos»: ninguno nuevo). Solo si el usuario quisiera una gota tematizable aparte nacería un token de componente, nombrado sin valor (`--g-cornisa-max-inline-size`). No lo recomiendo (§17.6: ningún existente se queda corto).

### L22 · Iconos dibujados a mano y `icon: Node` — **bloqueante** (para entrar)
- **Hecho:** `ICON_PATHS` son trazos propios (`renderer.js:11-17`), prohibidos (`icons.md` §1, #85–#87). `error` dibuja un círculo con aspa (equivale a `circle-x`), mientras Grana usa `circle-alert` para el error en `GToast` y en la isla (`icons.md:161`, `:169`). La opción `icon: Node` choca con «dato → nombre; plantilla → slot» (#202, `api.md:358`) y con el `icon` rechazado de la isla (`status.md:122`).
- **Propuesta:** `neutral` → sin icono o `info` · `success` → `circle-check` · `warning` → `triangle-alert` · `error` → `circle-alert` · chevrón → `chevron-down`. Todos están ya en la lista de la librería, así que no hace falta ninguno nuevo. Como Cornisa no tiene Vue, las cadenas se toman de `lucide-static` en el build (como `createIcons`). `icon` pasa a ser un nombre del registro de la aplicación.

### L23 · Textos por defecto y etiquetas que faltan — **bloqueante** (para entrar)
- **Hecho:** `DEFAULT_LABELS` en inglés (`renderer.js:21-24`). En Grana, los `labels` van sin valores por defecto, con aviso de desarrollo si faltan (#226, `status.md:22`, `:380-392`). No hay prefijos de tipo (L7), nombre de región ni texto de la cuenta atrás.
- **Propuesta:** `labels` `{ region, waiting, close, intents.*, remaining, progress }` sin valores, con marcadores `{count}`/`{time}` resueltos con `fill` y aviso al primer uso de cada uno.

### L24 · Errores: Cornisa lanza; Grana avisa y devuelve — **importante**
- **Hecho:** `normalize` y `createIsland` lanzan `TypeError`/`RangeError` (`manager.js:29-83`, `index.js:41`). En la isla de Grana, «ningún método lanza: devuelven `false`/`null` y avisan en desarrollo» (`status.md:148`), con la guarda canónica `try { if (process.env.NODE_ENV !== 'production') … } catch {}` (`api.md:230`, #653).
- **Propuesta:** si entra, la API pública avisa y devuelve, y el núcleo puede seguir lanzando por dentro. La guarda canónica funciona también sin empaquetador (el `catch` absorbe el `ReferenceError`), así que vale para el CDN.

### L25 · Borde compartido: no usa `edgeReserve` y vuelve a ponerse encima — **bloqueante** (para convivir)
- **Hecho:** Cornisa no lee ni publica en el registro de bordes. Ocupa arriba al centro, el mismo sitio que `GStatusIsland` (`status.md:96`), sin sumar `GAppShell`, `GPageHeader` ni la voz (`EDGE_ORDER = { appShell: 5, speech: 10, pageHeader: 15, bookingDock: 20, fab: 25, status: 30 }`, `status.md:440`). Llama a `showPopover()` en cada actividad nueva (`renderer.js:260`, `open()`).
- **Inferencia:** como «manda el último `showPopover()`» (`status.md:628`), Cornisa se pondría encima de `GToaster`/`GStatusIsland` cada vez, y las dos islas se solaparían.
- **Propuesta:** si convive, una entrada `EDGE_ORDER.cornisa` (después de `status`, por transitoria, #225). Leería `edgeReserve('top', { before })` y publicaría solo mientras se ve. Si no convive, regla de uso: **una isla por aplicación** (ver C).

### L26 · Modal: falta el traslado de `topModal` — **importante**
- Es L19 visto desde Grana: `GToaster`, la voz y la isla se trasladan al modal superior (#141). Cornisa tendría que hacerlo igual para convivir con `GDialog`.

### L27 · Movimiento: muelles en JS fuera de los tokens — **importante**
- **Hecho:** la gota es un path SVG movido por muelles en `requestAnimationFrame` con constantes propias (`drop.js:17-24`). Un tema de Grana no puede «apagar el rebote» con `--g-ease-spring: var(--g-ease-out)` (`tokens.md:770`). En Grana, todo lo interrumpible de la isla es transición de CSS (#702). Con movimiento reducido, Cornisa funde durante 160 ms literales (`renderer.js:191`) en lugar de `--g-duration-fast` (§29.3).
- **Inferencia:** el principio (interrumpible desde el estado actual) coincide con #702; lo que choca es el mecanismo. La silueta de gota es identidad, no solo implementación.
- **Propuesta:** si entra, leer `--g-ease-spring`/`--g-duration-slow` (o derivar los muelles de ellos) y respetar §29.3. La forma de gota frente a la cápsula D1 es decisión del usuario (ver C).

### L28 · Patrón de servicio y SSR — **importante**
- **Hecho:** `createIsland` une gestor y DOM y lanza sin `document` (`index.js:40-41`). En Grana, un servicio es `create<Servicio>` sin DOM (plugin de Vue con `InjectionKey`), más `use<Servicio>()` y un componente de región (`api.md:67-82`). El gestor no toca `document` al crearse.
- **Propuesta:** si entra, `createManager` (ya sin DOM) es el gestor y el renderer pasa a ser la región, montada aparte.

### L29 · Paquete y repo — **menor**
- **Hecho:** nombre sin ámbito (`cornisa`), `engines.node >= 18` frente a `>= 22` del raíz, tipos escritos a mano (sin `meta.json` ni `build-types.mjs`, #443), fuera de `gates.sh` y de `ci.yml`. `main`/`.` apuntan a `dist/`, que git ignora (`.gitignore`), así que en un clon limpio `import 'cornisa'` dentro del workspace falla hasta hacer el build (inferencia; `./core` apunta a `src` y sí resuelve).
- **Propuesta:** decidir si es `@grana/cornisa` o un paquete ajeno (ver C). En cualquier caso, `engines >= 22` y una línea en `gates.sh` si se queda.

### L30 · Atajo: semántica distinta de la de Grana — **menor**
- **Hecho:** Cornisa compara las letras por `e.code` (posición física, `index.js:25`, `:30`), así que con AZERTY «Alt+Shift+A» se pulsa en la tecla rotulada Q, aunque `aria-keyshortcuts` diga «A». No ignora `isComposing`. Grana compara `event.key` con los modificadores exactos e ignora `isComposing` (`status.md:420`), y reserva la familia F8 (F8 avisos, Mayús+F8 voz, Alt+F8 isla; `api.md:81`).
- **Propuesta:** documentar la elección por posición física (o pasarla a `key` con la excepción de macOS Option), ignorar `isComposing`/`repeat`, y en Grana prohibir los atajos de la familia F8.

---

## C. Solapamiento con la isla de estado de Grana

### Qué cubre cada una (hechos)

| | Cornisa | `GStatusIsland` (+ `GStatusMark`, `GStatus`) | `GToast` |
| --- | --- | --- | --- |
| Unidad | **Actividad** (suceso o tarea en curso) con `id` opcional | **Condición** con clave (estado que dura, #318) | Suceso que no deja nada pendiente |
| Visible | Una + «+N»; se expande en el sitio | Una + «+N»; asomo y lista (Alt+F8) | Pila |
| Orden | `priority` explícita (`low`/`normal`/`high`) | Gravedad por `type` (`error`→`success`), #696 | Llegada |
| Error | **Persistente** por defecto (`manager.js:88`) | **Transitorio** a la vista, persistente en el modelo y en la marca (#693) | Persistente |
| Acciones | Hasta 2 + acción rápida en compacto | 1 acción + 1 enlace + «Ir a…» + detalle técnico | 1 acción |
| Progreso | **Determinado (0–100) e indeterminado, anuncios por hitos del 25 %** | Ninguno (solo `busy` de la acción) | `loading` (indeterminado) |
| Cuenta atrás | `timer` sin evento al llegar a 0 | `deadline` + `onExpire`; no se recoge; anuncios en umbrales | — |
| Promesa | `promise()` | Acción que devuelve promesa (`busy` → `resolve`) | `promise()` |
| Memoria | No (al irse, se va) | Marca junto al origen, lista, retirada con su origen (#697) | No |
| Anuncio | Al hacerse visible (no en cola) | Al llegar, aunque espere (#698) | Al hacerse visible |
| Modal | Inerte | Traslado (#141) | Traslado |
| Borde | Propio | `edgeReserve`, orden 30 (#699) | `edgeReserve` |
| Forma | Gota SVG con muelles en JS | Cápsula D1 (#693), CSS | Tarjeta |

### Contradicciones con decisiones del usuario (hechos)
1. **#693 «un error no se queda»**: en Cornisa, un error se queda por defecto.
2. **#702 «nunca se releva bajo la mano»**: en Cornisa, el puntero no impide el relevo (L3).
3. **#704 frontera «si no queda nada pendiente, `GToast`»**: Cornisa mezcla los dos territorios en una superficie («Cambios guardados» y «Subiendo…» en la misma isla).
4. **#696/#319 orden por gravedad** frente a `priority` libre.
5. **#698 anunciar al llegar** frente a anunciar al hacerse visible.
6. **#226 sin textos por defecto**, **#141 traslado al modal** y **#322/#699 borde compartido**: ver L23, L19 y L25.
7. **Identidad:** la forma de la isla (D1 · cápsula de relevo, #693/#695) la eligió el usuario. Cornisa propone otra forma (gota que nace del borde) para el mismo sitio y el mismo propósito.

### Opciones (la elección es del usuario)

| Opción | Qué supone | A favor | En contra |
| --- | --- | --- | --- |
| **A · Mantener aparte** | Paquete vanilla independiente, declarado fuera de Grana (sin `@grana/`, sin `--g-*`), con una regla de uso: **no** se monta junto a `GStatusIsland`/`GToaster` en la misma aplicación | Sirve a quien no usa Vue; no reabre #693–#707; coste cero para Grana | Dos «islas» en el mismo repo con identidades y reglas opuestas; el repo aloja código que incumple sus propias reglas; mantenimiento doble |
| **B · Absorber ideas** | Sin cambiar `GStatusIsland`, una ronda de kiwi (y luego lima) valora llevar a Grana lo que Cornisa tiene y Grana no: **progreso determinado con anuncio por hitos** (en `GToast` `loading` o en la acción `busy` de la isla), **coalescencia de anuncios por `id`** y el **núcleo sin DOM con reloj inyectable** como patrón de pruebas | Aporta valor real sin tocar decisiones de identidad | Requiere ronda y contrato; Cornisa sigue existiendo (A + B) o se archiva |
| **C · Sustituir** | Cornisa (envuelta en Vue) pasa a ser la isla de Grana | Una sola implementación | Rehace #693–#707 (decididas por el usuario). Habría que añadir a Cornisa el modelo de condiciones, la marca, la lista, `origin`, `deadline` con `onExpire`, `busy`, el enlace, el detalle, el traslado al modal, el borde, `labels` y SSR, y corregir L1–L30. En la práctica es reescribirla |

**Recomendación de lima (decisión del usuario):** **A + B.** Mantener Cornisa aparte, sin `@grana/`, con una frase de frontera en su README («no convive con `GStatusIsland` ni `GToaster` en la misma aplicación; en una app de Grana usa `@grana/vue/status` y `GToast`»), y corregir sus defectos internos L1–L20 en su propio flujo. Abrir una ronda de kiwi solo para el **progreso determinado** (el hueco real de Grana) dentro de `GToast` o de la isla. Rechazo C: contradice siete decisiones del usuario y obliga a reescribir casi todo. Si el usuario prefiriera que Cornisa sea **la** forma de la isla, eso es una decisión de identidad que reabre #693 y #695, y pasa primero por kiwi.

---

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos (verificados leyendo el código):**
- Núcleo sin DOM, con máquina pura y tabla congelada (`machine.js`) y reloj inyectable (`manager.js:13-19`).
- Solo `textContent`; `icon` como `Node` clonado, nunca una cadena HTML; sin red ni almacenamiento.
- Regiones `status`/`alert` persistentes desde la creación, con anuncios corteses limitados y coalescidos por `id`; el error va por el canal enérgico.
- Disclosure con `aria-expanded`/`aria-controls`; `role="group"` con nombre; `progressbar` con valores; Esc contrae con `stopPropagation`.
- El atajo exige Alt, Ctrl o Meta (2.1.4) y no se intercepta sin actividad visible.
- `prefers-reduced-motion` y `forced-colors` contemplados; dianas de 44 px.
- Acción rápida sin duplicarse; detalle desplazable en pantallas bajas.

**Correcciones (para el dueño de Cornisa; ninguna aplicada aquí):**
- L1 `promise()` con función→texto.
- L9 `show` idempotente durante la salida.
- L10 `update` con `reconcile`.
- L3 el puntero fija la visible.
- L5 devolución del foco sin `tabindex` permanente.
- L7 prefijo de intención.
- L8 temporizador fuera del botón.
- L11–L13, L15, L16 y L18.
- L14: un contrato vigente único.
- L17: etiqueta de estado inequívoca.

**Pendientes (decisiones):**
- **Usuario:** opción A/B/C de la parte C. D3-03 (acciones persistentes por defecto, L2). Atajo activado por defecto (L4). Si Cornisa debe convivir con Grana en una misma app (L25), y su nombre y ámbito de paquete (L29).
- **lima, tras la decisión:** registrar en `DECISIONS.md` la incorporación de Cornisa como paquete ajeno a las reglas, con su frontera (no lo hago aquí por el encargo). Si se elige B, contratar el progreso determinado tras la ronda de kiwi.
- **kiwi, si B:** ronda de progreso determinado en `GToast`/isla.

## No verificado

- Pruebas de navegador de Cornisa (no las ejecuté; el README dice 259/259 el 2026-10-26).
- L13 (congelación por un oyente que lanza) y la consecuencia de L19 (anuncios perdidos bajo un modal inerte): son inferencias del código.
- L4/L5 en Safari real (foco al pulsar).
- El comportamiento con un lector de pantalla real (VoiceOver, NVDA): intención (L7), `role="timer"` dentro del botón (L8) y anuncios por hitos.
- La convivencia real con `GStatusIsland`/`GToaster` en una misma página (L25): deducida de `status.md:628` y de `renderer.js:260`, sin montar las dos.
- Que el build del workspace no modifique archivos versionados (`gen-cdn-examples.mjs` regenera `examples/cdn/01–03`).
