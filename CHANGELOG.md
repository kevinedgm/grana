# Changelog

Todos los cambios notables de Grana se documentan en este archivo.

El formato sigue [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto adopta [Versionado Semántico](https://semver.org/lang/es/). Mientras la versión sea `0.x`, **la API puede cambiar entre versiones**.

Los números `#NNN` remiten a [`DECISIONS.md`](DECISIONS.md), el registro de decisiones con su porqué.

## [Sin publicar]

Nada todavía.

## [0.1.0-beta.0] - fecha por fijar al publicar

Primera beta. Todos los componentes están en estado `candidate` (contrato, CSS, pruebas, `meta.json`, README y auditoría del componente real sin defectos bloqueantes, en Chromium, Firefox y WebKit). La verificación en entorno real (lectores de pantalla, Safari real, móvil real, `forced-colors` real, zoom real) sigue pendiente: ver [`PENDIENTES.md`](PENDIENTES.md).

### Añadido

#### Paquetes y entradas

- `@grana/vue`: componentes Vue 3, un plugin (`app.use(Grana)`), una hoja de CSS única (`@grana/vue/style.css`) y una fuente opcional (`@grana/vue/fonts.css`, Instrument Sans). Exige Vue `^3.5.0`; `lucide-static` es dependencia par opcional.
- `@grana/cli`: motor de tema (`grana theme`, `grana check`), plugin de Vite (`@grana/cli/vite`) y uso programático (`buildTheme`). Sin dependencias; Node ≥ 22.
- Entradas propias, fuera del paquete principal para que solo las pague quien las usa (#238, #328, #337, #367, #415): `@grana/vue/speech` (global UMD `GranaSpeech`), `@grana/vue/status` (`GranaStatus`), `@grana/vue/combobox` (`GranaCombobox`), `@grana/vue/file-field` (`GranaFileField`) y `@grana/vue/time-field` (`GranaTimeField`).
- `@grana/vue/testing` (`GranaTesting`): `createSimulatedSpeechAdapter` y `createSimulatedUploader`, adaptadores sin red para probar tu aplicación (#216, #367).

#### Tema y tokens

- Contrato de tokens ([`docs/contract/tokens.md`](docs/contract/tokens.md)) y contrato de API compartida ([`docs/contract/api.md`](docs/contract/api.md)).
- Tema por defecto neutro (`brand` `#1F1F1F`, `accent` `#0B63CE`, Instrument Sans), en la capa `grana.defaults`; el tema del usuario va sin capa y siempre gana.
- Claves del tema: `brand`, `accent`, `primary`, `radius`, `shape`, `space`, `font`, `fontDisplay`, `fontSize`, `typeScale`, `neutrals`, `neutralsHue`, `semanticCollision`, `categories`, `dark`, `name`, `overrides` (#107).
- Derivación de paleta en OKLCH con contraste garantizado: `strong`, `soft`, `text`, `on`; neutros teñidos; colisión de semánticos con la marca; categorías `--g-color-cat-1` a `cat-N`; `tokens.json` con el origen y el contraste de cada token (`--doc`) (#93).
- Tema oscuro por defecto: sigue al sistema y se fuerza con `data-theme="dark"` o `"light"` en cualquier elemento, anidable; el CLI deriva y valida los dos esquemas (#79 a #81).
- Mínimos de accesibilidad que ningún tema puede bajar y que el CLI valida: área táctil ≥ 24 px (≥ 44 px táctil), texto ≥ 12 px, contraste de texto ≥ 4.5:1 y de controles ≥ 3:1, foco siempre visible.
- Tokens de movimiento `--g-ease-spring` y `--g-ease-bounce`, `--g-duration-slow`, y un patrón único de `prefers-reduced-motion` (#299 a #305, #280).

#### Iconos

- `GIcon` público con Lucide como única fuente: `1em`, `currentColor`, decorativo o con `label`, `flip-rtl`; registro por aplicación con `createIcons` y validación estricta por forma; la lista de la librería es API pública. Convención «dato → nombre; plantilla → slot» en `GTabs`, `GMenu`, `GSidebar`, `GRadioGroup` y `GCombobox` (#85 a #87, #197 a #206, [`docs/contract/icons.md`](docs/contract/icons.md)).

#### Componentes: acciones y navegación

- `GBtn` (botón o enlace con `href`, estado de carga con región viva externa), `GMenu`, `GTabs` y `GTabPanel`, `GSidebar` (expandida, riel, navbar inferior y drawer), `GPagination`, `GStepper`, `GHelper` y `GHelperScope`.
- `GTooltip`: pestaña que viaja entre los controles de un grupo, segunda etapa con `detail`, pulsación larga en táctil, atajo `<GBtn tooltip>` (#380 a #399). Modo visual del motor para la pista de solo icono de `GTabs`, `GRadioGroup` y el riel de `GSidebar` (#433 a #437).
- Paneles anclados estables: cuatro reglas comunes (lado con histéresis, `--_max` fijo, cierre sin devolver el foco, puntero quieto que no desplaza la lista) en `GSelect`, `GMenu`, `GDatePicker`, `GHelper`, el editor de `GFilterBar` y `GCombobox` (#358).

#### Componentes: campos y formularios

- Campos: `GInput`, `GTextarea`, `GSelect`, `GCheckbox`, `GCheckboxGroup`, `GRadioGroup` (cinco apariencias: `list`, `inline`, `segmented`, `chip`, `card`), `GSwitch`, `GDatePicker`, `GNumberField` (#309 a #314).
- `GCombobox`: búsqueda en catálogo con resultados de tu aplicación, sin `fetch`; «el campo se abre» por defecto, paleta con vista previa (`appearance="palette"`), valor como objeto y texto libre; con `multiple`, la frase, la receta (`selection="list"`) y la cesta, tope `max`, un oculto por valor y Ctrl/⌘+Z (#329 a #338, #417 a #430).
- `GTimeField` («La hora dicha»: se escribe como se dice y vuelve en palabras, 12 o 24 h, `step`, arcos que cruzan la medianoche) (#400 a #416).
- `GFileField` («Línea de adjuntos»: subida al añadir con el adaptador de tu aplicación, el envío se bloquea con pendientes o fallidos, la página entera responde al arrastre) (#366 a #379).
- Sistema de formularios: `GForm`, `GFormSection` (fija, `collapsible` y `addable`), `GFormLayout`, `GFormRow`, `GFormReveal` (campos condicionales con `when`), `GInputGroup` y sus partes, `GFieldGroup`, `GFormActions`, `GErrorSummary` y el composable `useFormField` (#274 a #292, #283).
- Personalidad de los campos: sacudida única al enviar un campo rechazado y mensaje que sale del campo (#299 a #305).

#### Componentes: datos

- `GTable` (columnas compuestas, celdas por slot, filtros por columna), `GFilterBar`, `GDataList`, `GCalendar` (Día, Semana, Mes y Timeline), `GMetric`, `GProgress`, `GBadge`.
- `GSummary`: ficha de resumen adaptable con prioridad líquida, y `summaryDiff` para distinguir homónimos en una lista (#349 a #357).
- `GAvatar` (imagen, iniciales o icono; color por categoría del tema con hash estable) y `GAvatarMotion` (#293 a #298).

#### Componentes: superficies y composición

- `GSurface`, `GCard` (compone `GSurface`; acción principal por enlace estirado), `GDialog` (nace desde su disparador; enfoca al abrir `[autofocus]`, el primer control o el cierre), `GDivider`, `GAdaptiveLayout` (layout automático por necesidades de tamaño, con pistas `g-adapt-*` en el hijo) (#339 a #348, #359 a #365, #292, #299 a #305).
- Paneles: `GWidget`, `GWidgetGrid`, `GWidgetGallery`, `GWidgetConfig`.

#### Componentes: avisos y estado

- `GToast` (`createToaster`, `useToast`, `GToaster`): servicio imperativo con región viva única, traslado al modal y borde compartido.
- Isla de estado (`createStatus`, `useStatus`, `GStatusIsland`, `GStatusMark`, `GStatus`): aviso persistente que cambia de forma; atajo `Alt+F8`; orden de borde voz → isla → avisos (#315 a #328).

#### Captura de voz

- Fase 1 (`createSpeech`, `useSpeech`, `GSpeechHost`, `GSpeechPill`, `GSpeechTrigger`): 13 estados, adaptador de tu aplicación (sin red en Grana), dictado al cursor con deshacer propio, panel, hoja móvil y traslado al modal (#207 a #238).
- Fase 2 (`GTranscript`, `createTranscript`, `useSpeechTarget`, «Revisar»): rejilla de revisión con edición en la celda, hablantes y roles, destinos ligados al modelo del formulario con vista previa y deshacer (#241 a #264).

#### Accesibilidad y verificación

- Contraste de lo marcado: todo control seleccionable relleno con una familia de color lleva contorno `{familia}-text` para llegar a 3:1 contra la superficie; formas de familia sin par en `{familia}-text` (#431 a #440).
- Foco visible del radio en WebKit mediante el atributo interno `data-g-key-focus` (#441, WCAG 2.4.7).
- Pruebas: 2792 unitarias en `@grana/vue` y 141 en `@grana/cli`; pasada completa de navegador en Chromium, Firefox y WebKit con 1380 pruebas que pasan y 57 omitidas por diseño. Auditorías por componente en `design/lab/<nombre>/auditoria.md`.

### Limitaciones conocidas

- La API puede cambiar entre betas.
- Sin verificar en entorno real: lectores de pantalla, Safari real, táctil y móvil reales, `forced-colors` real, zoom real al 200 y 400 %, IME y teclado virtual.
- Sin matriz de versiones mínimas de navegador, sin medida del tree-shaking del JavaScript y sin prueba de SSR con Nuxt ni de hidratación real.
- La hoja de CSS es única y no se parte por componente.
- Dark Color Presence (presencia del color en el tema oscuro) está investigada pero no adoptada.
- Lo aplazado, con su origen y su dueño, está en [`PENDIENTES.md`](PENDIENTES.md).

[Sin publicar]: https://github.com/kevinedgm/grana/commits/main
