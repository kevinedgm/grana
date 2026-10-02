# Auditoría de coco · iconos públicos (paso 5)

**Componentes:** `GIcon` público (`GIcon.vue`, `registry.js`, `render.js`, `GLibIcon.js`; bruno, commits 1a95e35 y 9b7228c), registro `createIcons`, icono por nombre en `GTabs`, `GMenu` y `GSidebar` y slot `lead` de `GFormSection` (#202, #203), `GIcon.css` y `GFormSection.css` de coco (e724b63); contrato `docs/contract/icons.md` v0.2 (#197 a #203). Todo **real**: `dist/` reconstruido (`npm run build`), Vue global y `lucide-icons.js` registrado con `Grana.createIcons`, en el **playground** (`/playground/#sec-icons`, servido en `http://localhost:4173`) y en un banco montado **en la misma página con los componentes reales** (secciones con título largo, insignia, acciones, clase de la aplicación y RTL; `flip-rtl` con `rotate`/`transform` de la aplicación; `GSidebar` expandido, riel y navbar en LTR y RTL con `toggle-icon` `flip-rtl`; `GTabs` y `GSidebar` con slot `icon` y clase de la aplicación).
**Método:** `node design/lab/icons/auditoria-verificar.mjs` (Playwright de `design/lab/theme-playground/`) en **Chromium, Firefox y WebKit**: **3558/3558** comprobaciones. Temas: **defecto** y **«Tema de prueba»** del playground, y los **diez generados** de `design/lab/tema-oscuro/dark-color-presence/generated/` (entre ellos **Spotify**, marca pálida `#1ED760`, y **lustre**), cada uno en claro y oscuro: 24 configuraciones por motor. Además: RTL local, heredado y de página; 320px (LTR, RTL y Spotify oscuro); movimiento reducido; `forced-colors` emulado (Chromium, claro y oscuro); árbol de accesibilidad (`ariaSnapshot`, `getByRole`); `GMenu` abierto; comprobación estática de los `.vue`/`.js` nuevos.

## Resultado: aprobado. Un defecto menor corregido en `GSidebar.css`; ningún bloqueante; `GIcon` pasa a `status: "candidate"`

`GTabs`, `GMenu`, `GSidebar` y `GFormSection` ya eran `candidate` y siguen así.

### Mediciones (tema por defecto, 1280px; iguales en los tres motores salvo donde se indica)

| Medida | Valor |
| --- | --- |
| `GIcon` suelto | 1em del texto (16px a 16px), `currentColor` = color del texto; clase de la aplicación fuera de un hueco **48×48** |
| `lead` de `GFormSection` | Hueco 16×24 (tamaño × interlineado del título), icono 16px = tamaño del título, **Δ centro = 0,00px** respecto de la primera línea (criterio ±1px) en título corto, de 3+ líneas a 260px, con insignia `optional`, con insignia y acciones, RTL local y de página, y a 320px; separación = `gap` del encabezado (8px); el encabezado no crece con el lead |
| Contraste del `lead` (`text-muted` sobre la superficie) | mínimo **7,38:1** en claro (Spotify) y **8,59:1** en oscuro, en las 24 configuraciones (criterio ≥ 3:1); `forced-colors` 21:1 |
| `GTabs`, icono por nombre | **1,15em** de la pestaña (16,09px a 14px; 16,1 en Firefox) = el hueco; contraste del icono ≥ **4,96:1** (caracol-púrpura oscuro, pestaña inactiva) |
| `GMenu`, icono por nombre | = hueco `--_mark` (17,66px Chromium, 17,87 Firefox, 18 WebKit: el hueco sigue la métrica de la fuente de cada motor), decorativo |
| `GSidebar`, icono por nombre | **20px** = `--_ico` (`space-1 × 5`) en expandido, **riel** y **navbar**, LTR y RTL, en los 24 temas; contraste ≥ 6,87:1 |
| `GBtn` `prepend`/`append` (md) | 14px = 1em del texto (14px) |
| `GInput` `prepend` | 16px = 1em del texto (16px) |
| `GBadge` icono | 12px (1em del texto) dentro de una caja de 13,2px (1,1em) |

### Pruebas por comportamiento

| Prueba | Resultado |
| --- | --- |
| `flip-rtl` con el `GIcon` real | Sin espejo en LTR; espejado con `dir="rtl"` local, heredado de un antecesor y con RTL de página; un `dir="ltr"` local dentro de RTL no espeja; un `check` sin la prop nunca. Con `rotate: 90deg` y con `transform: rotate(90deg)` de la aplicación, el giro se conserva y el espejo se aplica (se componen). En el `append` de un `GBtn` RTL: espejado y a 1em |
| Huecos que giran o espejan un icono | Ver hallazgo 2. Todos los que giran (`GSidebar` chevron, `GCard` «mostrar más», `GSelect` flecha, `GMenu`, `GCalendar`, `GDatePicker`, `GCard` «actual») dibujan **iconos propios** (`GLibIcon`, sin `flipRtl`): ninguno recibe un icono de la aplicación. El único hueco que transforma un icono de la aplicación es `toggle-icon` de `GSidebar` en riel, corregido. Las escalas al pulsar (`GBtn`, enlaces de `GSidebar`) van en el control, antecesor del icono, y se componen solas |
| `toggle-icon` de `GSidebar` con `flip-rtl` | Signo horizontal neto: expandido LTR +1, riel LTR −1, expandido RTL −1, **riel RTL +1** (los dos espejos se anulan); también con movimiento reducido |
| Tamaño en huecos sin clase | `GTabs`, `GMenu`, `GSidebar` y `lead`: manda el hueco (tabla anterior) |
| Clase de la aplicación **dentro** de un hueco | **Gana la clase** (48px en el slot `icon` de `GTabs`, en el riel de `GSidebar` y en el `lead`): ver hallazgo 1 |
| Árbol de accesibilidad | En `#sec-icons` hay **un solo** `img` («Bloqueado», el del `label`); el decorativo no aparece («Formulario bloqueado» se lee solo por el texto); el botón solo icono se llama «Desbloquear» por su `aria-label`; el encabezado con `lead` se llama solo «Acceso y seguridad»; la pestaña y el enlace con icono por nombre se llaman por su texto; en `GMenu` abierto, `menuitem "Desbloquear"` sin `img`. Ningún `svg` con `tabindex` ni `focusable` distinto de `false` |
| Registro (`createIcons`) | `lock-open`, `map-pin` e `image` (no están en la librería) se dibujan desde el registro, también como dato en `GTabs`, `GMenu` y `GSidebar` |
| 320px | Documento 320/320 en LTR, RTL y Spotify oscuro; ningún icono, sección, pestaña ni botón fuera de la sección (salvo dentro de contenedores con desplazamiento propio, como la tira de pestañas); `lead` alineado ±1px |
| `forced-colors` (Chromium, claro y oscuro) | Trazo del `lead`, del `GIcon` con `label` y de los iconos de `GTabs` = `currentColor` (`CanvasText`); 21:1 |
| Consola | Sin errores, avisos ni peticiones fallidas en los tres motores (todas las cargas) |
| `.vue` / `.js` nuevos | `GIcon.vue`, `GLibIcon.js`, `registry.js`, `render.js` y las líneas nuevas de `GTabs.vue`, `GMenu.vue`, `GSidebar.vue` y `GFormSection.vue`: sin `<style>`, sin colores ni medidas, sin `style` en línea. Los únicos números del `svg` son los fijos del contrato (`viewBox 0 0 24 24`, `stroke-width 2`), geometría de Lucide, no tema |

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | Menor | lima | **Dentro de un hueco, una clase de tamaño de la aplicación gana al hueco.** El CSS de los componentes vive en la capa `grana.components` y el de la aplicación va sin capa (#4), así que la especificidad del hueco no cuenta: medido 48px en el slot `icon` de `GTabs` (caja de 16px, el icono desborda), en el riel de `GSidebar` y en el `lead`. `icons.md` §2.2 dice que dentro de un hueco «el tamaño lo fija el hueco» y mi `estilo.md` afirmaba que el hueco gana a la clase (el banco cargaba el CSS sin capa; corregido allí). Sin la clase, manda el hueco (lo normal). No es corregible en CSS sin `!important` y va contra #4 (la aplicación siempre gana); propuesta para lima: decir en §2.2 que la clase de la aplicación gana **siempre** (por capa, no por especificidad 0) y que **no se ponen clases de tamaño en un icono dentro de un hueco**. El README de `GIcon` ya lo advierte |
| 2 | Menor (corregido) | coco | **`toggle-icon` de `GSidebar` pisaba `flip-rtl` en riel.** El riel volteaba el icono con la propiedad individual `scale: -1 1`, la misma que usa `g-icon--flip-rtl`, y su selector ganaba: en RTL con riel el icono quedaba espejado (debía quedar sin espejo, los dos volteos se anulan). Además, con **movimiento reducido** una regla `scale: none` quitaba el volteo del riel: se perdía el estado (contraer / expandir) en pantalla, no solo la animación. Corregido en `GSidebar.css`: el riel voltea con `transform: scaleX(-1)` (se compone con `scale`), la transición pasa a `transform` y se retira el `scale: none` (la transición ya se quitaba). Verificado en los tres motores (expandido/riel × LTR/RTL, y con movimiento reducido) |
| 3 | Menor | lima | **Tamaño del icono en `GBtn` (1em).** A `md` el icono mide 14px junto a un texto de 14px (y 14px en el botón solo icono de 36px), frente a 16,1px de `GTabs` (1,15em), 17,7px de `GMenu` y 20px de `GSidebar` con texto de 14px. El dibujo de Lucide ocupa ~20/24 de su caja, así que a 1em el trazo visible queda en ~11,7px: se lee algo flojo junto a la etiqueta en peso 600 y en el solo icono. **Merece cambio**: un alias local `--_icon` en `GBtn` (≈ 1,15em en `prepend`/`append`, como `GTabs`, y algo mayor en modo `icon`), sin token nuevo, es decisión de lima (encaja en el pendiente «Tamaño de icono por token» de `GBtn.meta.json` y en `icons.md` §9) y luego de coco |
| 4 | Informativo | — | **`GInput` (1em) y `GBadge` (caja de 1,1em).** `GInput`: 16px a 16px de texto, coherente con el contrato y con el resto de campos; **no merece cambio**. `GBadge`: el `svg` mide 1em (12px) y la caja 1,1em solo le da aire para centrarlo; **no merece cambio** (12px es el tamaño del texto de la insignia y el mínimo de texto) |
| 5 | Informativo | bruno | `GIcon.meta.json` (aquí solo se cambió `status`): retirar de `pending` «Auditoría de coco sobre el componente real (paso 5)» y, tras el README, «README (mora-docs)». Siguen vigentes lector de pantalla real, `forced-colors` real, otros empaquetadores y tipos |
| 6 | Informativo | bruno | El playground no tiene un `GSidebar` en riel ni en RTL con iconos por nombre ni un `lead` con título largo o insignia (los cubre el banco de esta auditoría con los componentes reales). Si se amplía la sección «Iconos», añadirlos |
| 7 | Informativo | — (método) | Los huecos de `GMenu` (`--_mark`) miden distinto por motor (17,66 / 17,87 / 18px) porque siguen la métrica de la fuente; el icono siempre = hueco |

## Pendiente de estilo resuelto

El pendiente de `estilo.md` («el espejo se aplica antes del giro; quien use `flip-rtl` dentro de un hueco que gira debe probarlo en RTL») queda cerrado para los huecos actuales: ninguno gira un icono de la aplicación, y el único que lo transforma (`toggle-icon`) ya compone. Sigue valiendo para huecos futuros: si un hueco gira (`rotate`) un icono **de la aplicación** que pueda llevar `flip-rtl`, en RTL el giro se ve invertido y el hueco debe compensar (como hace `GSidebar` con su chevron propio) o girar con `transform`.

## Sin ejecutar

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack) con `role="img"` en `svg` y con el encabezado con `lead`; solo el árbol de Playwright.
- **`forced-colors` real** de Windows y en Firefox/WebKit (solo la emulación de Chromium).
- **Safari real** y táctil; zoom del navegador y escalas fraccionarias (no cambian respecto a la auditoría de `GDivider`: el icono es un `svg` sin bordes de 1px).
- Poda con otros empaquetadores y uso sin empaquetador fuera del playground (lo verifica bruno; aquí solo el UMD del playground).
- Fuentes de los temas generados (Inter, DM Sans) no cargadas: el contraste no depende de la fuente; los tamaños en `em` sí siguen su métrica.
