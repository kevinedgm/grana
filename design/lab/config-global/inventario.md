# Inventario · configuración global de Grana

**Autora:** lima · **Fecha:** 2026-10-29 · **Tipo:** inventario de solo lectura (no es una ronda de kiwi ni un contrato).
**Pregunta del usuario:** que Grana tenga una sola perilla global, como el `FluidProvider` de Fluid Functionalism (FF): una configuración y todos los componentes la siguen (esquinas, paso de tamaño, iconos, tema, acento, reducir movimiento).
**Fuentes:** el repo en `claude/relaxed-keller-5n1aqp` y la skill `~/.agents/skills/fluid-functionalism/` (`SKILL.md` «Composing with the system», `references/craft.md` §Sizes y §Typography, `references/components.md` «Setup»). El sitio fluidfunctionalism.com no se consultó: la red lo bloquea.

**Leyenda.** **H** = hecho, con archivo:línea. **I** = inferencia, con la confianza entre paréntesis. **R** = recomendación. Las rutas de componentes son relativas a `packages/vue/src/components/`.

---

## 0. Qué es el `FluidProvider` (H, desde la skill)

- Un solo envoltorio con cuatro cosas: movimiento reducido según el sistema, radio (`rounded` o `pill`), paso de tamaño (`default` o `compact`) e iconos (`references/components.md`, «Setup», fila *Fluid Provider*). Tema claro/oscuro y acento son ajustes del starter, no del provider.
- **Paso de tamaño:** son dos pasos. `default` deja los controles en 36 px y `compact` en 28 px. Con `compact` todo baja a la vez: texto 13→12, icono 16→14, relleno del control 12→10, relleno de la fila 8→6 y separación 8→4. La misma altura `control` vale para los controles y para las filas de lista o menú (`craft.md` §Sizes).
- **Orden de resolución:** prop del componente > `SizeProvider` que lo rodea > `default`. La densidad se decide por región, y llega a los menús que se abren desde esa región porque el contexto de React cruza los portales (`craft.md` §Sizes).
- **Tipografía:** seis roles, cada uno con tamaño e interlineado en los dos pasos. `display` 28/34 (24/30), `title` 16/22 (15/20), `subtitle` 14/20 (13/18), `body` 13/20 (12/18), `caption` 12/16 (11/14) y `micro` 11/14 (10/12). Un campo de texto sube a 16 px en táctil para que iOS no amplíe la página. No usa mayúsculas, ni tracking, ni *eyebrows*. Los pesos son 400/550/700 con tamaño óptico (`craft.md` §Typography).
- **Prosa:** la hoja `.typeset` (con su variante `-compact`) va en `@layer components` con selectores `:where()`. Separa 12 px entre bloques y 8 px bajo un encabezado, y 24/20 px sobre los encabezados (`craft.md` §Typography).

---

## 1. Tabla por eje

«Deciden por su cuenta» cuenta los componentes que fijan el valor sin leer nada global ni heredado.

| Eje | Hoy existe | Dónde (H) | Deciden por su cuenta | Qué haría falta para que fuera global |
| --- | --- | --- | --- | --- |
| **Color / tema** | Global en el build: CLI `brand`, `accent`, `primary`, `neutrals`, `dark`… → `--g-color-*`. El cambio claro/oscuro en tiempo de ejecución va por el atributo `data-theme`. La zona de marca va por región con `data-g-zone="brand"` | `packages/cli/src/config.js:4`; `styles/defaults.css:14-16`, `:291` (oscuro), `:649` (zona) | 0 | **Ya es global.** Lo que falta respecto de FF es cambiar el acento en tiempo de ejecución: el CLI deriva en el build y no hay modo en tiempo de ejecución (`tokens.md` §8 lo deja «opcional, con parpadeo», sin construir; `packages/cli/src/` no tiene ningún módulo de ese modo). Fuera del alcance de una perilla |
| **Forma / radios** | Global en el build: `radius` → escala `--g-radius-*`; `shape: "pill"` → `--g-radius-shape: var(--g-radius-pill)`. Prop `rounded` por instancia en 12 componentes | `packages/cli/src/scales.js:7-17`; `defaults.css:165-173`; `tokens.md:74` | **Parcial.** Solo 7 hojas leen `--g-radius-shape` (`GBtn.css:38`, `GTabs.css:345,358`, `GTag.css:62`, `GTagGroup.css:129`, `GCard.css:327`, `GGallery.css:159`, `GAvatar`). Los campos usan `--g-radius-sm` fijo (`GInput.css:26`), y 43 hojas usan `--g-radius-pill` fijo para piezas que siempre son píldora | Para que `pill` llegue también a los campos haría falta un rol de radio de campo: un token nuevo, p. ej. `--g-radius-field` (alias de `sm`, y de `pill` con `shape: "pill"`), que leerían `GInput`, `GSelect`, `GDatePicker`, `GInputGroup`, `GFileField`, `GPartyField`… `GTextarea` necesita una regla propia (una píldora de varias líneas no sirve). Es una decisión de identidad |
| **Espaciado** | Global: CLI `space` → `--g-space-1…16` | `config.js:53`; `defaults.css:230-238`; `tokens.md` §4 | 0 | **Ya es global** |
| **Densidad / tamaño** | **Prop por componente**, con herencia dentro de los formularios por `formKey`/`layoutKey`. No hay ajuste global ni por región. Hay dos ejes aparte: `size` (xs…xl) y `density` | Ver §2 | **18** componentes de raíz con `density` por defecto `"default"` que no heredan nada (`GForm` entre ellos, que además lo provee); **20** campos o diseños que heredan de `GForm`/`GFormLayout`/`GAdaptiveLayout`/`GFormFold`; `GCalendar` con escala propia | Ver §4: un token `--g-density` + un atributo de región + un orden de resolución prop > región > global |
| **Tipografía** | Global en el build: `font`, `fontDisplay`, `fontSize`, `typeScale` → `--g-text-*` y `--g-font-*` en rem | `packages/cli/src/scales.js:35-41`, `theme.js:131-132`; `defaults.css:241-286` | Cada componente elige su rol (`tokens.md` §23). **La densidad nunca cambia el texto** (H: no hay ninguna regla `--density-*` que toque `font-size`, `--_fs` ni `--_lh`; `tokens.md:90` lo fija: «sin cambiar la tipografía», #15) | Ver §3 |
| **Movimiento** | Duraciones y curvas globales como tokens. Movimiento reducido **solo por el sistema** (`@media (prefers-reduced-motion)`) | `defaults.css:181-194`; `tokens.md` §29.3 | 58 hojas con su propia consulta de medios y unos 15 `.vue`/`.js` con su propio `matchMedia('(prefers-reduced-motion: reduce)')` (`GTabs.vue:21`, `GBreadcrumbs.vue:24`, `GDialog/steps.js:18`, `GSummary/measure.js:15`…) | Seguir al sistema **ya es** lo que hace FF (`MotionConfig reducedMotion="user"`). Lo que no existe es forzarlo desde la aplicación (un interruptor «reducir movimiento» del producto). Haría falta un atributo, p. ej. `data-g-motion="reduce"` en `<html>`, añadido a las 58 consultas de medios (`:root[data-g-motion=reduce]` no entra en un `@media`, así que se duplica cada regla) y un helper único para los ~15 `matchMedia`. Coste alto y valor medio. Apagar solo el rebote ya se puede con tokens (`tokens.md` §29.1, «Apagar el rebote») |
| **Iconos** | Solo Lucide por decisión (#85–#87, #197). El grosor de trazo es fijo | `GIcon/GIcon.vue:12` (`stroke-width` en `FIXED`) | — | **No es perilla** por decisión. Una perilla de grosor de trazo cabría (FF engorda el trazo en hover, `craft.md` Button) pero no se ha pedido |
| **Foco** | Global: `--g-focus-width`, `--g-focus-offset` | `defaults.css:177-178` (49 hojas los leen) | 0 | **Ya es global** (se ajusta con `overrides`) |
| **Táctil** | Regla de contrato fuera del tema: 44 px con `pointer: coarse`, sin importar la densidad | `tokens.md` §7; 49 hojas con `@media (pointer: coarse)` | 49, a propósito: es un mínimo, no tema | Mantenerlo fuera del tema. **Falta** el texto ≥ 16 px en los campos táctiles (H: ninguna regla `pointer: coarse` toca `font-size` ni `--_fs` en `components/*/*.css`. `GInput` md usa `body-sm` 14 px, `GInput.css:23,449`, y en táctil solo sube la altura, `GInput.css:117-121`) |
| **Prosa** | `GContainer prose` fija la medida (66ch) y nada más. `GText` para el texto suelto | `GContainer.css:94,105,171-177`; `tokens.md` §23.2 (`GText`) | — | No hay ritmo entre bloques. Haría falta una hoja de prosa (§3.3) |
| **Altura de fila = altura de control** | Coincide por construcción en `GMenu` (fila = 9 unidades, como el control `md`). `GSidebar` usa 10 unidades | `GMenu.css:15`; `GSidebar.css:35-36` | — | I (media): para FF esto es una regla del sistema. En Grana se cumple en el menú y no en el sidebar (40 frente a 36). Que sea una regla común lo decidiría lima en un contrato; no es una perilla |
| **Peso sin reflujo** | `GTabs` reserva el ancho con `data-text` | `tokens.md` §23.3 | — | Ya existe donde hace falta. No es perilla |

---

## 2. Densidad en detalle

### 2.1 Valores admitidos (H, de los `*.meta.json`)

- **`default` / `comfortable` / `compact`**, en **37 componentes**: `GAdaptiveLayout`, `GBtn`, `GCard`, `GCheckbox`, `GCheckboxGroup`, `GCombobox`, `GDatePicker`, `GDialog`, `GFieldGroup`, `GFileField`, `GForm`, `GFormActions`, `GFormLayout`, `GFormRow`, `GInput`, `GInputGroup`, `GMenu`, `GNumberField`, `GPartyField`, `GRadioGroup`, `GSelect`, `GSidebar`, `GSlider`, `GSpeechTrigger`, `GSplit`, `GStack`, `GStepper`, `GSurface`, `GSwitch`, `GTable`, `GTabs`, `GTextarea`, `GTimeField`, `GWidget`, `GWidgetConfig`, `GWidgetGallery`, `GWidgetGrid`.
- **`compact` / `comfortable` / `spacious`** (por defecto `comfortable`), solo en **`GCalendar`** (`GCalendar.meta.json`). Es una escala propia: cambia las unidades de la hora y el relleno, no un multiplicador (`GCalendar.css:81-83`). Su `comfortable` es el **paso por defecto**, mientras que en los demás `comfortable` es 0,875. #114 ya resolvió la misma ambigüedad en `GTabs`.
- **Sin prop, pero con densidad heredada:** `GFormFold` (`GFormFold.vue:58`, `.css:50-52`), `GFormReveal` (`.css:36-38`) y `GFormSection` (`GFormSection.css:54-55`, por el selector `.g-form--density-*`).
- **Sin densidad (41; 44 sin prop menos los tres de arriba):** `GAccordion`, `GBadge`, `GBreadcrumbs`, `GPagination`, `GFilterBar`, `GTag`/`GTagGroup`, `GToast`, `GTooltip`, `GHelper`, `GPageHeader`, `GSection`, `GContainer`, `GAppShell`, `GSummary`, `GEmpty`, `GProgress`, `GAvatar`, `GDivider`, `GMetric`, `GFab`, `GStatusIsland`, `GTranscript`… I (alta): algunos son controles que en FF bajarían con la región (`GPagination`, `GTag`, `GBadge`, `GAccordion`, `GFilterBar`, `GBreadcrumbs`).

### 2.2 Qué cambia cada valor (H)

**Escalera común.** Los 37 usan el mismo multiplicador (`GCard` a través de su `GSurface`; `GNumberField`, `GTimeField` y `GCombobox` a través de `GInput`), **1 · 0,875 · 0,75**, como alias local (`--_density`, o `--_d` en `GDialog`, `GMenu`, `GStack`, `GTabs`, `GWidgetConfig`, `GWidgetGallery`; `--_df` en `GSplit`; `--_adaptive-density` en `GAdaptiveLayout`). Ejemplos: `GBtn.css:262-264`, `GInput.css:454-456`, `GTable.css:28-30`, `GMenu.css:61-62`. `GTabs` cambia además el grosor de la marca (`GTabs.css:95-96`, `--g-tabs-mark-*`).

El multiplicador entra en **altura, relleno y separación**: `GBtn.css:37` (`--_h`), `:44` (`gap`), `:50` (`padding-inline`); `GTable.css:18` (relleno de celda); `GSidebar.css:35-36` (items). **Nunca entra en el texto ni en los iconos.** La altura tiene piso de 24 px y se redondea a 0,5 px; en táctil, 44 px (`tokens.md:90`, §7).

Altura de la caja con `space` 4 (H, calculada con la fórmula de `GBtn.css:99`/`GInput.css`):

| `size` | unidades | `default` | `comfortable` | `compact` | texto (igual en los tres) |
| --- | --- | --- | --- | --- | --- |
| `xs` | 6 | 24 | 24 (21→piso) | 24 (18→piso) | caption 12/16 |
| `sm` | 7 | 28 | 24,5 | 24 (21→piso) | body-sm 14/20 |
| **`md`** | 9 | **36** | 31,5 | **27** | body-sm 14/20 |
| `lg` | 11 | 44 | 38,5 | 33 | body 16/24 |
| `xl` | 13 | 52 | 45,5 | 39 | body 16/24 |

El relleno en línea de `md` pasa de 12 a 10,5 y a 9 (`GInput.css:449`, `--_px` × densidad); la separación de `md`, de 8 a 7 y a 6.

### 2.3 Herencia hoy (H)

- **Campos y diseños** (19 con `density` por defecto `undefined` en el `meta.json`, más `GCheckbox`): la prop gana; si no hay prop, heredan de `layoutKey`, luego de `formKey`, y si no, `'default'` (`GForm/formContext.js:143`; `GFormLayout.vue:19`; `GFormActions.vue:24`; `GCheckbox.vue:74,82`, que hereda del grupo).
- **`GForm`** tiene `density` por defecto **`'default'`** (`GForm.vue:17`) y lo provee siempre (`:189`). I (alta): un ajuste de región **no llegaría** a los campos de un `GForm` sin prop mientras ese valor por defecto no pase a `undefined`.
- **Raíces sin herencia** (por defecto `'default'`, sin `inject`): `GBtn.vue:15`, `GTable.vue:63`, `GMenu.vue:34`, `GDialog.vue:24`, `GSurface.vue:20`, `GCard.vue:46`, `GSidebar.vue:40`, `GTabs`, `GStepper`, `GStack`, `GSplit`, `GWidget*`. **Un `GBtn` dentro de un `GForm` compacto no hereda nada**: `GFormActions` compacta su propio relleno (`GFormActions.css:93`) pero no sus botones (I alta: el `GBtn` no lee `formKey`).
- **Paso a hijos por prop:** `GCard` pasa su densidad a su `GSurface` y a su `GMenu` (`GCard.vue:503,708`), y en `compact` además oculta la meta de prioridad baja (`GCard.vue:407`). **Es un comportamiento en JS, no en CSS.**
- **`GDialog` corta todos los contextos** (`GDialog.vue:66-71`, #566). Un mecanismo global de densidad necesita una clave propia que el diálogo **no** corte.
- **Remedición en JS por densidad:** `GCalendar.vue:619`, `GAdaptiveLayout/useAdaptiveLayout.js:312`, `GStepper` (anchos naturales) y `GFormRow` (mínimos publicados). I (media): un cambio de densidad solo por CSS no los avisa; `ResizeObserver` cubre lo que cambia de tamaño, pero no lo que se mide una sola vez.
- **Inconsistencia anotada para bruno:** `GCheckbox.meta.json` declara `density` por defecto `"default"`, pero el `.vue` lo deja en `undefined` (`GCheckbox.vue:20`). La documentación está bien en efecto, no en la letra.

### 2.4 Frente a la escalera de FF

| | FF | Grana hoy |
| --- | --- | --- |
| Pasos | 2 (`default`, `compact`) | 3 multiplicadores × 5 `size` = dos ejes |
| Control por defecto | 36 | `md` 36 (**coincide**) |
| Control compacto | 28 | `md compact` 27, `sm default` 28 |
| Texto | baja un escalón (13→12) | no baja (14 en `md`, sea cual sea la densidad) |
| Icono | 16→14 | no baja con la densidad (`em` del texto; `GBtn` sigue a `size`, #205) |
| Separación | 8→4 (la mitad) | 8→6 (× 0,75) |
| Alcance | región; cruza portales | por componente y formulario; `GDialog` corta |
| Fila de menú = control | sí | sí en `GMenu`, no en `GSidebar` |

**I (alta):** la diferencia de fondo no está en los números, sino en que **el `compact` de Grana aprieta la caja y deja el texto igual**: es lo que FF llama «una copia apretada», no «un hermano menor». La segunda diferencia es que **no hay región**.

---

## 3. Tipografía

### 3.1 Escalas lado a lado (H)

Grana, con `fontSize` 16 y `typeScale` 1,25 (`tokens.md` §5 y §23; `defaults.css:246-279`): caption 12/16 w500 · body-sm 14/20 · body 16/24 · title-sm 20/28 w600 · title 25/36 · title-lg 31/40 · display 39/48. Se escriben en rem y el tracking de los títulos va de −0,004 a −0,022 em.

| FF (default / compact) | Equivalente en Grana | Nota |
| --- | --- | --- |
| `micro` 11/14 (10/12) | — | **Choca** con el mínimo de texto de 12 px (§7) |
| `caption` 12/16 (11/14) | `caption` 12/16 | Igual en el paso por defecto; el 11 compacto choca con §7 |
| `body` 13/20 (12/18) | — (los controles usan body-sm 14/20) | Grana es 1 px mayor en los controles |
| `subtitle` 14/20 (13/18) | `body-sm` 14/20 | Igual |
| `title` 16/22 (15/20) | `body` 16/24 w600 (títulos de `GCard`, `GFormSection`) | Interlineado 24 frente a 22 |
| `display` 28/34 (24/30) | entre `title` 25 y `title-lg` 31 | Grana tiene tres pasos más de título (escala geométrica, #8 y `typeScale`) |

### 3.2 Lo que aportaría valor sin cambiar la identidad

1. **Campo ≥ 16 px en táctil** (R, valor alto). Es un defecto real en iOS, no un gusto. Solo cambia el tamaño del texto editable en `pointer: coarse`. El alto de la caja ya es 44 y no cambia, y el interlineado de `body-sm` (20) cabe. Candidatos a revisar (H: tienen `<input>`, `<textarea>` o `contenteditable`): `GInput` (y con él `GNumberField`, `GTimeField`, `GCombobox`), `GTextarea`, `GInputGroupInput`, `GDatePicker`, `GPartyField`, `GSlider` (cifra que se teclea), `GPagination`, `GFilterBar` (editor), `GBookingBar`, `GHero`, `GTranscript/TranscriptCells.vue`.
   - **Choque menor:** «16px» no está entre los literales permitidos (solo 24 y 44, `tokens.md` §7). Hay dos salidas: (a) ampliar §7 con «16px de texto editable en `pointer: coarse`», que es un mínimo de plataforma y no tema (no debe poder bajarlo un `tokens.css`), o (b) un token nuevo. R: (a), por el mismo motivo que 44 px no es token.
   - **Riesgo:** el espejo de `GNumberField`/`GTimeField` (P1) y el medidor de la cifra de `GSlider` miden el texto y tienen que seguirlo; los mínimos publicados a `GFormRow` cambian en táctil.
2. **Texto que baja con la densidad** (R, valor alto, pero **enmienda #15** y `tokens.md:90`). En una región compacta, cada rol baja un escalón, **con piso de 12** (caption se queda en 12). Así el compacto de Grana deja de ser una caja apretada con el texto del paso normal. Hacen falta valores compactos de los roles, que el CLI generaría desde `fontSize`/`typeScale` como hoy genera los normales. I (media): como mucho un valor nuevo (un `body-sm` compacto de unos 13 px); los demás pueden reutilizar el rol de abajo.
3. **Hoja de prosa** (R, valor medio). Una sola clase con ritmo vertical entre bloques (párrafo, encabezados, listas, regla, cita, código), con selectores `:where()` y en la capa `grana.components`, de modo que una utilidad o la aplicación gane sin `!important` (compatible con #806). `GContainer prose` ya da la medida y esto completaría el ritmo. Es una pieza de API nueva (clase pública), no una perilla.
4. **Interlineado entero ligado a la altura de la fila** (I, ya se cumple): en Grana `body-sm` 20 + 8 + 8 = 36, la misma aritmética de FF.

### 3.3 Lo que choca con decisiones vigentes (H)

- **Sin eyebrows:** `GCard __eyebrow` y `GWidget __eyebrow` existen (`tokens.md` §23.1, observación 23.5 c). Quitarlos es identidad: no se toca.
- **Sin tracking:** Grana aplica tracking negativo a los títulos (`tokens.md` §5) como parte de la identidad.
- **Cuerpo 13 en los controles:** Grana usa 14 en los controles y 16 de base (`fontSize`). Bajar a 13 cambia la identidad y el contraste percibido. Ya se puede hacer con `fontSize` en el CLI, y entonces baja todo.
- **`micro` 11 y `caption` compacto 11:** violan el mínimo de 12 px (§7). Fuera.
- **Pesos 400/550/700 con tamaño óptico:** Grana usa 400/500/600 (`tokens.md` §5). Instrument Sans es variable, pero el eje óptico no está verificado (no consta en `defaults.css`). Fuera del alcance.
- **Px frente a rem:** FF fija px; Grana escribe rem para respetar el tamaño de letra del navegador. Se queda en rem. En el 16 táctil, el umbral de iOS va en px calculados, de ahí `max(16px, …)`.

---

## 4. Mecanismos posibles (opciones, no decisión)

Todas parten de la misma pieza: **un token global de densidad** (p. ej. `--g-density`, nombre provisional; su valor por defecto lo pondría coco en `defaults.css`) que la raíz de cada componente lee en lugar del `1` literal de su alias local, más **dejar de emitir la clase `--density-default` cuando no hay prop**. Sin eso, la prop por defecto de los 18 componentes de raíz y la de `GForm` taparía cualquier ajuste global.

| Opción | Cómo | Coste | Riesgo | SSR | Capas (#806) | Peso (#506 agotado) |
| --- | --- | --- | --- | --- | --- | --- |
| **A · Clave del CLI** | `"density": "compact"` en `grana.config.json` → `:root { --g-density: … }` (y, con §3.2-2, los roles compactos) | Bajo en el CLI (una clave más en `config.js:4`, validación y emisión) | Global para toda la app: no permite una región compacta dentro de una página normal | Perfecto: CSS estático | Sin cambio: el tema va sin capa y gana | 0 B de JS; ~0 de CSS |
| **B · Atributo de región** | `data-g-density="compact"` en cualquier elemento (también `<html>`); `defaults.css` reasigna `--g-density` (y los roles) bajo el atributo. **Precedente exacto:** la zona de marca `data-g-zone="brand"` (#620–#625, `defaults.css:649`), y los paneles que se abren dentro la heredan | Medio: coco toca las ~37 raíces (alias = token) y bruno quita la clase por defecto en los 18 `.vue` de raíz (sin API nueva, salvo el atributo) | (1) Los nodos que se teletransportan a `<body>` (`GToaster`, `GStatusIsland`, `GSpeechHost`) solo lo heredan si el atributo está en `<html>`; los `popover` del sitio sí lo heredan, porque la capa superior no cambia la herencia del DOM. (2) La lógica de JS por densidad (`GCard.vue:407`, las remediciones de §2.3) no se entera | Perfecto: el atributo va en el marcado | Las reglas del atributo van en `grana.defaults`; un tema del CLI sin capa puede redefinirlas | 0 B de JS; CSS: I (media) unos cientos de bytes gzip en `grana.css` |
| **C · `provide` / plugin** | `app.use(grana, { density })` o `app.provide(granaConfigKey, …)` exportada (quien importa por partes no llama a `install`, `index.js:99-106`), más un componente de región (p. ej. `GConfig`) que hace `provide`. Cada componente hace `inject` y resuelve prop > región > global | Alto: ~37 `.vue` + `meta.json`/tipos de la clave y del componente nuevo | Hay que llegar a componentes que hoy no tienen contexto. `GDialog` corta los contextos de formulario (#566): la clave nueva no debe estar entre las que corta. El contexto sí cruza `Teleport` | Bien: `provide` funciona en SSR, pero la clase la pinta el servidor solo si el valor es conocido al renderizar | Sin efecto | **Le cuesta a `grana.js`**: I (media) ~1–1,5 KiB gzip (un `inject` + `computed` por componente). Con #506 agotado, necesita la aceptación del usuario como cargo único (precedentes #653, #964) |
| **D · Combinada (B + A, con C mínima)** | El CSS manda (B, con A como valor global desde el CLI). En JS, un único helper `readDensity(el)` que lee `getComputedStyle` solo donde hay lógica (`GCard` meta, remediciones), o una C reducida a esos pocos componentes | Medio | El menor de los tres: cada pieza hace lo suyo | Bien | Bien | JS: I (media) < 512 B; CSS como B |

**Shape y prosa** se resuelven sin mecanismo nuevo: `shape` ya es clave del CLI (A). Llevarla a los campos es un token de rol (§1). La prosa es una clase.

**Movimiento forzado por la app** sería otro atributo de B (`data-g-motion`), pero el coste es el de §1 (58 hojas + ~15 `matchMedia`). No entra con la densidad.

R: **D**. Encaja con lo que Grana ya hace con `data-theme` y `data-g-zone`: el CSS es la fuente de verdad, funciona con SSR y no gasta `grana.js`. La región es la que pide FF.

---

## 5. Orden propuesto

| # | Pieza | Impacto | Esfuerzo | Roles |
| --- | --- | --- | --- | --- |
| 1 | **Campo ≥ 16 px en táctil** (§3.2-1): regla común en `tokens.md` §7 y en `api.md`, aplicada a los campos de texto | Alto: corrige la ampliación de iOS en todos los formularios; sin cambio en escritorio | Bajo-medio: CSS de ~12 componentes, una decisión de §7 y una prueba de WebKit táctil | lima → coco → bruno (prueba) |
| 2 | **Densidad global y por región** (§4 D): `--g-density`, `data-g-density` y la clave `density` del CLI; la prop por defecto deja de tapar; `GForm` sin `'default'` impuesto | Alto: una perilla para toda la app o para una región, que llega a menús y paneles | Medio: ~37 hojas + 18 `.vue` + CLI; sin API de componente nueva | lima (contrato y orden de resolución) → coco → bruno |
| 3 | **El texto baja con la densidad** (§3.2-2), dentro de la pieza 2 o justo después | Alto en lo percibido: «hermano menor» y no «copia apretada» | Medio: enmienda de #15, roles compactos en el CLI y en `defaults.css`; coco mide el contraste y las alturas de 0,5 px | lima → coco → bruno (CLI) |
| 4 | **Ampliar la densidad a los controles que no la tienen** (`GPagination`, `GTag`, `GBadge`, `GAccordion`, `GFilterBar`, `GBreadcrumbs`) y alinear `GCalendar` con la escalera común | Medio | Medio (componente por componente) | lima → coco → bruno |
| 5 | **Hoja de prosa** (§3.2-3) | Medio (documentación, contenido de CMS, ayuda) | Bajo-medio: una hoja nueva y una entrada en `utilities.json` o en `api.md` | kiwi (ritmo) → lima → coco |

Quedan fuera del orden: `shape: pill` en los campos (es identidad, va en la pregunta 3), el movimiento forzado por la app (coste alto, valor medio) y el acento en tiempo de ejecución (es otro proyecto, el modo de tiempo de ejecución del CLI).

### Preguntas de producto (para el usuario)

1. **¿La densidad compacta baja también el texto?** (enmienda #15: hoy «sin cambiar la tipografía»). Si es sí, cada rol baja un escalón con piso de 12 px, como FF. Si es no, la región solo aprieta las cajas, como hoy.
2. **¿Cuántos pasos?** ¿Se quedan los tres de hoy (`default`/`comfortable`/`compact`) o se pasa a dos como FF (`default`/`compact`, con `comfortable` como alias)? ¿Y `GCalendar` se alinea (hoy su `comfortable` es el paso por defecto)?
3. **¿`shape: "pill"` llega a los campos?** (`GInput`, `GSelect`, `GDatePicker`…; `GTextarea` se quedaría redondeado). Hoy la píldora solo afecta a botones, pestañas, etiquetas y tarjetas-acción.

---

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos**
- Inventario de solo lectura: no toqué código, contratos, `DECISIONS.md` ni `design/lab/hover-glide/`. Solo escribí este archivo.
- Comprobé con grep sobre los archivos reales, no de memoria, lo que el encargo daba por sabido: las claves del CLI (`config.js:4`), la densidad como prop con herencia en formularios (`formContext.js:143`), que la densidad no toca el texto (ninguna regla `--density-*` cambia `font-size`/`--_fs`/`--_lh`), `GInput` a 14 px con solo la altura en táctil (`GInput.css:23,117-121`) y que `prose` es solo la medida (`GContainer.css:94-105,171-177`).
- Las alturas de §2.2 están calculadas con la fórmula del CSS (unidades × 4 × densidad, redondeo a 0,5 y piso de 24), no medidas en un navegador.

**Correcciones** (al planteamiento del encargo)
- La densidad no se hereda en `GFormFold` como prop: `GFormFold` no tiene prop `density`; la hereda y la reprovee (`GFormFold.vue:58,119`).
- `GForm` impone `'default'` (`GForm.vue:17`), así que la herencia de los campos **ya** cortaría un ajuste de región. Hay que tenerlo en cuenta en la pieza 2.
- `shape: "pill"` no es una forma global completa: la leen 7 hojas y los campos quedan fuera.
- `GCheckbox.meta.json` dice que `density` vale `"default"` por defecto y el `.vue` dice `undefined`. Lo anoto para bruno.

**Pendientes / no verificado**
- No medí nada en el navegador: ni alturas reales, ni la ampliación de iOS (necesita Safari táctil real), ni el peso de las opciones B, C y D (las cifras de peso de §4 son inferencias).
- No confirmé si `GDatePicker`, `GPagination`, `GBookingBar` o `GHero` tienen un campo de texto editable o solo controles de otro tipo. La lista de §3.2-1 es de candidatos.
- No verifiqué el eje óptico de Instrument Sans.
- No leí el sitio de FF (red bloqueada). El `FluidProvider` está descrito solo por la skill.
- La rúbrica de movimiento no aplica: no se propone movimiento nuevo.
