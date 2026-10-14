# Changelog

Todos los cambios notables de Grana se documentan en este archivo.

El formato sigue [Keep a Changelog 1.1.0](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto adopta [Versionado Semántico](https://semver.org/lang/es/). Mientras la versión sea `0.x`, **la API puede cambiar entre versiones**.

Los números `#NNN` remiten a [`DECISIONS.md`](DECISIONS.md), el registro de decisiones con su porqué.

## [Sin publicar]

Fase C del plan de v1: seis componentes nuevos, la carga común y varias reglas compartidas. Todo en estado `candidate` (contrato, CSS, pruebas, `meta.json`, README y auditoría de coco sobre el componente real sin defectos bloqueantes). Sin versión nueva todavía: sigue siendo `0.1.0-beta.0`, sin publicar.

### Añadido

#### Componentes nuevos

- `GSlider` (entrada propia `@grana/vue/slider`, global UMD `GranaSlider`, ≈ 11 KB gzip): valor acotado o rango de dos extremos donde el asa es el valor, una píldora con la cifra dentro; modelo `Number` o `null`, o `[inicio, fin]` con `range`; comparte fila con `GInput` en `GFormRow` (#445 a #457, #509).
- `GTag` y `GTagGroup` (entrada propia `@grana/vue/tag`, global UMD `GranaTag`, ≈ 10 KB gzip): etiquetas de un conjunto, estáticas, enlace, de alternar o quitables. Al quitar queda una **huella** del mismo ancho con «Deshacer» en el sitio y con el foco; racimos por faceta (`layout="facets"`), tope «Ver N más», «Quitar todas» y color de categoría con el mismo hash que `GAvatar` (#460 a #473, #510 a #514, #524 a #526).
- `GAccordion` y `GAccordionItem` (en el principal): secciones plegables donde el encabezado cerrado enseña la primera línea de la respuesta (`peek`) y el que tocas no se mueve; lo plegado se encuentra con Ctrl+F, se enlaza con `#id` y se imprime abierto; `exclusive`, `lazy` y encabezado pegado opcional (`sticky`) (#475 a #488, #515 a #519).
- `GBreadcrumbs` (en el principal): migas de pan cuya ruta entera se aprieta por prioridad sin esconder niveles; al final, «Subir · página»; con `children`, puertas a los hermanos (#490 a #503, #520 a #523).
- `GEmpty` (en el principal): el vacío con causa (`none`, `filtered`, `error`, `forbidden`), del tamaño de un elemento; con un filtro, dice cuántas había y ofrece quitar cada filtro con las cuentas que devuelve (#529 a #543, #547, #551 a #556).
- `GLoadRegion` (entrada propia `@grana/vue/load-region`, global UMD `GranaLoadRegion`, ≈ 4 KB gzip; su CSS va en `grana.css`): la región cuyo contenido llega tarde. En la primera carga, la plantilla de tu aplicación sin tinta como molde que recibe la tinta en su sitio; al refrescar, lo de antes sigue a la vista, inerte y marcado, y un fallo no lo borra. Nada antes de 200 ms, mínimo de 400 ms a la vista, aviso de espera larga a los 5 s sin ninguna animación en curso, un canal cortés por página con fusión y foco que vuelve por clave y nunca cae en `body`. Token nuevo `--g-color-mold` (#529 a #548, #552 a #559).

#### Carga común en `GTable`

- `GTable` adopta el motor de carga común: retraso de 200 ms, mínimo de 400 ms y espera larga de 5 s (`labels.slow`); esqueleto quieto, con el tono `--g-color-mold`; props `error` y `announceError`, evento `retry`, slot `error` y textos `failed` y `retry`; vacío y fallo por defecto con `GEmpty`; foco que vuelve por `rowKey` (#540, #548, #555, #558, #559).

#### Tema y CLI

- Token `--g-color-mold`: el tono único del marcador de carga, en el tema por defecto (claro y oscuro) y en `@grana/cli` (#538).
- `@grana/cli` deriva los colores del tema oscuro contra la superficie oscura real, teñida por los neutros del tema, y no contra la de por defecto.
- `@grana/cli` conoce las ranuras del item actual de `GSidebar` (`--g-sidebar-current*`, grupo de color): si el tema las declara, diagnostica sus pares en claro y oscuro (`sidebar-current-contrast`, informativo) y, si se heredan del claro y fallan en el oscuro, deriva el oscuro (`sidebar-current-dark`: relleno `{f}-soft`, tinta `{g}-text` o el respaldo `on-{f}-soft`) (#614).

#### `GSidebar`

- Prop `breakpoints` (`{ expanded?, rail? }` en px del contenedor): cortes de `mode="auto"` por instancia; por ejemplo, drawer por debajo de 1024 px sin riel con `:breakpoints="{ expanded: 1024, rail: 1024 }" mobile="drawer"` (#618).

### Cambiado

- **Regla de modalidad del foco (#450):** el anillo de foco que WebKit no marca (`data-g-key-focus`) sigue la modalidad de la última entrada: aparece con cualquier tecla que no sea un modificador y se quita con el puntero. Los radios de `GRadioGroup`, `GCard` y `GWidgetGallery` pasan a esta regla.
- **`navigate` solo con activación primaria (#505):** `GCard` (`interaction="link"`) y `GSidebar` emiten `navigate` solo con el clic principal sin Ctrl, ⌘, Mayús ni Alt (o con Intro); con modificadores o clic central el navegador abre la pestaña nueva y el evento no se emite. `GTag`, `GTagGroup` y `GBreadcrumbs` nacen con la misma regla.
- **`GSidebar`: el item actual es un asiento (#612 a #617):** la fila del actual ya no se rellena (sin superficie `inset`, contorno `border-strong` ni barra de acento): un círculo detrás del icono, **lleno** en el destino actual y **hueco** en la rama que lo contiene, con un nodo y la línea encendida hasta el hijo actual; en el riel, el padre representa al hijo actual con el asiento lleno (`is-rep`, sin `aria-current`). Lo pintan tres ranuras nuevas del tema, `--g-sidebar-current`, `--g-sidebar-on-current` y `--g-sidebar-current-edge` (por defecto `primary`, `on-primary` y `primary-text`).
- **`GSidebar`: `color` ya no pinta la píldora del navbar (#615):** la píldora es el asiento crecido y lee las ranuras `--g-sidebar-current*`; `color` solo pinta los contadores y los puntos. Sin aviso de desarrollo. Con los valores por defecto (`color="brand"`, `primary` = `brand`) no cambia nada; quien teñía la píldora con `color` pasa a `--g-sidebar-current` (y `--g-sidebar-on-current`) en el tema.

### Cambios de comportamiento en `GTable`

Quien ya usaba `GTable` verá estos cambios al actualizar:

- **El slot `empty` ya no es el respaldo del error.** Un fallo sin filas pinta el slot `error` o su `GEmpty cause="error"` con `labels.failed` y «Reintentar»; si tenías un `empty` que también cubría el fallo, ponle un slot `error`.
- **El botón de limpiar filtros del vacío por defecto es ahora un `GBtn` dentro de `GEmpty`**, en lugar del botón `g-filter-bar__clear`. Mismo evento `clear`; cambian el marcado y la clase.
- **Con `loading: true`, las filas de antes siguen a la vista (inertes) durante 200 ms y el esqueleto se queda al menos 400 ms**; el esqueleto ya no late y `labels.loading` se anuncia cuando el esqueleto se ve, no al empezar.
- **La región viva se vacía al empezar una carga**, para que el anuncio del fin se oiga aunque el recuento no cambie.
- **El `<table>` lleva `tabindex="-1"`** y recoge el foco durante una carga.
- **Límite conocido:** con celdas compuestas con avatar, el esqueleto mide 44 px frente a 60 de la fila y la tabla encoge mientras carga (en la tabla simple, 44 = 44); lo cerraría un molde de `GTable` desde una muestra de filas, reservado (#543, #558).

### Peso

- El paquete principal crece **+15 200 B gzip (14,8 KiB) sobre 179 506 B** en la fase (`grana.js`), por `GBreadcrumbs`, `GAccordion` y `GEmpty` con el motor de carga y la adopción de `GTable` (cada uno se midió por separado sobre un árbol distinto, así que las cifras individuales no suman la total). Está dentro del tope de +15 KiB de la valoración conjunta (#506, #550) y **el margen está agotado**: todo componente nuevo que entre al principal abre esa valoración. Lo más pesado de la fase va en entradas propias (`slider`, `tag`, `load-region`) y, importados uno a uno, los componentes del principal son puros: no los paga quien no los usa.

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

#### Paquete, tipos e integración continua

- Tipos de TypeScript incluidos: los `.d.ts` se generan desde los `meta.json` de cada componente y viajan en el paquete (campo `types` por entrada), sin escribirlos a mano (#443).
- Paquete solo ESM (`"type": "module"`), con `exports` por entrada y sin build CommonJS; los UMD quedan solo para usar la librería con `<script>` desde una CDN (#442).
- Importación parcial sin arrastrar el resto: los componentes están marcados como puros y `sideEffects` cubre solo el CSS, de modo que importar solo `GBtn` pasó de 66,4 KB a ≈ 10,9 KB gzip con Rollup; importar toda la librería añade ≈ 155 KB gzip (#444).
- Integración continua en `.github/`: `ci.yml` (vitest, build, `check-icons`, compuertas del `dist/` y un subconjunto de Playwright en Chromium; `npm audit` informativo), `e2e-full.yml` (pasada completa en Chromium, Firefox y WebKit, nocturna y manual) y Dependabot semanal para npm y Actions.
- `LICENSE` (MIT) dentro de los dos tarballs y aviso de la fuente Instrument Sans (SIL OFL 1.1, con su copyright) en `THIRD-PARTY-NOTICES.md` de `@grana/vue`.

#### Accesibilidad y verificación

- Contraste de lo marcado: todo control seleccionable relleno con una familia de color lleva contorno `{familia}-text` para llegar a 3:1 contra la superficie; formas de familia sin par en `{familia}-text` (#431 a #440).
- Foco visible del radio en WebKit mediante el atributo interno `data-g-key-focus` (#441, WCAG 2.4.7).
- Pruebas: 2792 unitarias en `@grana/vue` y 141 en `@grana/cli`; pasada completa de navegador en Chromium, Firefox y WebKit con 1380 pruebas que pasan y 57 omitidas por diseño. Auditorías por componente en `design/lab/<nombre>/auditoria.md`.

### Limitaciones conocidas

- La API puede cambiar entre betas.
- Sin verificar en entorno real: lectores de pantalla, Safari real, táctil y móvil reales, `forced-colors` real, zoom real al 200 y 400 %, IME y teclado virtual.
- Sin matriz de versiones mínimas de navegador y sin prueba de SSR con Nuxt ni de hidratación real.
- La hoja de CSS es única y no se parte por componente.
- Dark Color Presence (presencia del color en el tema oscuro) está investigada pero no adoptada.
- Lo aplazado, con su origen y su dueño, está en [`PENDIENTES.md`](PENDIENTES.md).

[Sin publicar]: https://github.com/kevinedgm/grana/commits/main
