# Contrato de iconos · v0.6

**Dueño:** lima · DECISIONS.md #85, #86 (revisada por #197), #87, #197 a #203, #204 a #206, #224, #253 y #296 · **Basado en:** `design/lab/icons/r01/` (kiwi; `brief.md`, `declaracion.md`, `index.html`, `verificar.mjs` 53/53). **Regla única: [Lucide](https://lucide.dev) (licencia ISC) es la única fuente de iconos** en todo el repositorio (componentes, prototipos, bancos de prueba, playground, README y documentación) y, desde la v0.2, **también en lo que una aplicación dibuja con `GIcon`** (#198).

**Cambios respecto a la v0.1:** `GIcon` pasa a ser **público** (§2; #197, #199) con registro de iconos **por aplicación** (`createIcons`, §5; #200); la validación «solo Lucide» se impone a la aplicación por la forma del dato (§5.3; #198); la lista de la librería es **API pública** (§4; #201); convención de huecos «dato → nombre; plantilla → slot» (§5.8, `api.md`; #202); hueco `lead` en `GFormSection` (#203). Sin tokens nuevos.

**Cambios respecto a la v0.2** (auditoría de coco, `design/lab/icons/auditoria.md`, hallazgos 1, 3 y alias): la clase de la aplicación **gana siempre**, también dentro de un hueco, por capa y no por especificidad; no se ponen clases de tamaño en un icono dentro de un hueco (§2.2, §3; #204). `GBtn` dimensiona sus iconos con un alias local `--_icon` y se cierra el pendiente «Tamaño de icono por token» sin token (§9; #205). El nombre registrado es el de la **marca de la exportación**, siempre el canónico; la librería pasa de `circle-help` a **`circle-question-mark`** y conserva `circle-help` como **alias de compatibilidad** hasta la siguiente versión mayor (§4, §5.2; #206). Sin tokens nuevos.

**Cambios respecto a la v0.3:** la lista de la librería crece (cambio menor, #201) con los 11 iconos que usa la captura de voz (§4; `design/contracts/speech.md`; #224). Sin tokens nuevos ni cambios de API de `GIcon`.

**Cambios respecto a la v0.4:** la lista crece (cambio menor, #201) con los **12 iconos** de la Fase 2 de la captura de voz (`GTranscript` y la acción «Revisar» del panel; `speech.md` §28.2; #253): los cinco que estaban reservados (`text-cursor-input`, `undo-2`, `trash`, `pencil`, `copy`) y `redo-2`, `user-plus`, `merge`, `split`, `git-compare`, `users` y `file-pen-line`. Sin tokens nuevos ni cambios de API de `GIcon`.

**Cambios respecto a la v0.5:** la lista crece (cambio menor, #201) con **`user`**, el respaldo propio de `GAvatar` (`design/contracts/avatar.md`; #296). La prop `icon` de `GAvatar` es un **nombre** de la aplicación (§5.8, excepción acotada a «plantilla → slot»). Sin tokens nuevos ni cambios de API de `GIcon`.

## 1. Qué es un icono (y qué no)

Un **icono** es cualquier pictograma cuyo significado se lee por su forma: una marca de verificación, un chevron, una cruz, una advertencia, una flecha, unos puntos de menú, un asa, un calendario. **Solo se admite Lucide.** No se admiten:

- **Caracteres Unicode como iconos:** `✓ ✔ ✕ × ✖ ▲ ▼ ● ■ ◆ › ‹ ⚠ ⋮ ⋯ ✎ ⧉ ➜ ↗ → ←`, emojis y similares (ni en el HTML, ni en `content:` de CSS, ni en textos).
- **Pictogramas dibujados con CSS:** marcas hechas con bordes girados, `clip-path: polygon`, `box-shadow` para puntos, pseudo-elementos que forman una cruz o una flecha, barras que forman un «hamburguesa».
- **Iconos dibujados a mano o copiados de otra colección.**

No son iconos (y se siguen dibujando con CSS): rellenos, bordes, pistas y pulgares de controles (el riel de un interruptor, la pista de una barra de progreso, el círculo de un radio), sombras, contornos de foco, el esqueleto de carga y las **barras de asa de una sola pieza** (la asa de una hoja inferior y la de un evento del calendario: un borde redondeado, sin forma de pictograma).

**Ilustraciones y mascotas (DECISIONS.md #105):** tampoco son iconos. Una ilustración es un **dibujo compuesto** con partes (cuerpo, ojos, extremidades) que el componente anima por separado, y que **no tiene significado de pictograma**: no sustituye a ningún icono ni se usa como tal (no es «ayuda», «alerta» ni «cerrar»). Puede escribirse como SVG propio dentro de su componente (hoy solo `GAvatarMotion`), con colores de tokens. Si una ilustración empezara a usarse para comunicar una acción o un estado sin texto, deja de ser ilustración: se usa el icono de Lucide correspondiente.

### Formas de estado (insignias, leyendas)

Las **figuras que codifican estado o serie** (círculo, cuadrado, rombo y triángulo de `GBadge` y de la leyenda de `GDataList`, y el punto de estado) **también son Lucide** (`circle`, `square`, `diamond`, `triangle`, rellenas con `currentColor`): una sola fuente, sin excepciones.

### Alcance en la aplicación (#198)

- **Dentro de `GIcon`, solo Lucide, en modo estricto:** `GIcon` dibuja únicamente la lista de la librería (§4) o cadenas de `lucide-static` registradas por la aplicación que pasan la validación de §5.3. No hay forma de dibujar otra cosa con `GIcon`, ni en desarrollo ni en producción.
- **Lo que no es Lucide** (logotipos de marca, pictogramas propios de la aplicación, ilustraciones) **va por slot**, nunca por `GIcon`. Grana no valida el contenido de un slot: es responsabilidad de la aplicación (que sea decorativo o tenga nombre, que no tenga interactivos).

## 2. `GIcon` (público)

### 2.1 Datos de la librería

- **Fuente:** el paquete `lucide-static` (devDependency de `@grana/vue`; **no** es dependencia en tiempo de ejecución, #86). Un script (`scripts/build-icons.mjs`, de bruno) lee los SVG de la lista de la §4 y genera `src/icons/lucide.js` con **solo** esos iconos (trazos normalizados, `viewBox` 24). El archivo generado lleva el aviso de la licencia ISC y el repositorio incluye el texto de la licencia (`packages/vue/THIRD-PARTY-NOTICES.md`).
- **Exportación:** `GIcon` se exporta de `@grana/vue` y `install` lo registra como los demás componentes (`<g-icon>`, `<GIcon>`). `install` **no** cambia de firma: no acepta opciones (§5.5).

### 2.2 Props

| Prop | Tipo | Valores | Default | Nota |
| --- | --- | --- | --- | --- |
| `name` | String | Nombre **canónico** de Lucide en minúsculas con guiones (`lock-open`, `map-pin`) | **obligatorio** | Se resuelve según §5.4. Un nombre que no se encuentra **no dibuja nada** y avisa en desarrollo. Los alias de `lucide-static` (`Unlock`, `HelpCircle`, `Trash2`) no son nombres: el nombre es el de la marca de la exportación (`lock-open`, `circle-question-mark`, `trash`; §5.2). Única excepción: el alias de compatibilidad `circle-help` de la lista de la librería (§4, #206) |
| `label` | String | texto de la aplicación | sin valor | **Sin valor o vacío: decorativo.** Con valor: imagen con nombre (§2.4). Sin texto por defecto (Grana es internacional) |
| `filled` | Boolean | | `false` | Rellena con `currentColor` (figuras de estado, puntos) |
| `flipRtl` (`flip-rtl`) | Boolean | | `false` | Espeja el dibujo en horizontal **solo** cuando la dirección efectiva es RTL. Para iconos **direccionales** (flechas y chevrons de avance o retroceso, «ir a», «responder»). Nunca automático: Lucide no marca qué iconos son direccionales y espejar un `check` sería un error |

**No hay** `size`, `color`, `strokeWidth`, `spin` ni `title` (#199):

- **Color:** siempre `currentColor`; lo hereda del texto o del control que lo contiene.
- **Tamaño (#204):** `1em` del texto que lo rodea (regla base `:where(.g-icon)`). Dentro de un hueco de un componente, el hueco lo fija con su alias local (`--_icon`, `--_ico`, `--_mark`…). **Una clase de la aplicación gana siempre, dentro o fuera de un hueco**, y gana **por capa**, no por especificidad: el CSS de Grana va en la capa `grana.components` y el de la aplicación sin capa (#4), así que ni la especificidad 0 de la regla base ni la mayor de un hueco cuentan (medido por coco: 48px con una clase de la aplicación en el slot `icon` de `GTabs`, en el riel de `GSidebar` y en el `lead` de `GFormSection`, en los tres motores). En consecuencia:
  - **Fuera de un hueco** (un `GIcon` suelto en el texto de la aplicación), la clase de la aplicación es la forma de cambiar el tamaño, sin `!important`.
  - **Dentro de un hueco no se ponen clases de tamaño en el icono**: el tamaño lo manda el hueco, y una clase lo desborda o lo descentra (en `GTabs`, un icono de 48px en una caja de 16px).
  - **Si hay que cambiar el tamaño dentro de un hueco, se cambia el contenedor, no el icono:** primero con lo que el componente ofrece (`size`, `density`, los tokens del tema de los que deriva el hueco); si la aplicación necesita algo propio, con una regla sobre el **componente o el hueco** (los huecos en `em` siguen el `font-size` de su contenedor y conservan el centrado). Las clases de elemento (`__icon`, `__lead`…) y los alias `--_*` son contrato interno bruno ↔ coco, no API estable: quien los sobrescribe asume que pueden cambiar en una versión menor.
  - **Sin token de tamaño de icono** (#205, §9).
- **Grosor:** el de Lucide (2 en una caja de 24).
- **Giro:** los componentes que lo necesitan ya lo resuelven en su estado `loading` (`loader-circle`); un icono suelto no gira.
- **`title`:** no se emite `<title>` (tooltip nativo inconsistente entre navegadores y lectores; el nombre va en `aria-label`). Un tooltip, cuando exista el componente (#113), se pone en el control, no en el icono.

### 2.3 Anatomía del `svg`

| Atributo | Decorativo (sin `label`) | Con `label` |
| --- | --- | --- |
| `class` | `g-icon` (+ `g-icon--filled`, `g-icon--flip-rtl`) y las clases de la aplicación | igual |
| `xmlns`, `viewBox` | `http://www.w3.org/2000/svg`, `0 0 24 24` | igual |
| `fill` | `none` (`currentColor` con `filled`) | igual |
| `stroke`, `stroke-width`, `stroke-linecap`, `stroke-linejoin` | `currentColor`, `2`, `round`, `round` | igual |
| `focusable` | `false` | `false` |
| `aria-hidden` | `true` | — (no se pone) |
| `role` / `aria-label` | — | `img` / el `label` |
| Hijos | Trazos normalizados de la lista o del registro (cadena ya validada) | igual |

- **Atributos de la aplicación:** los no declarados (`class`, `id`, `data-*`, `style`) pasan al `<svg>`. Los que fija `GIcon` (los de la tabla, más `tabindex`, `aria-labelledby` y `aria-describedby`) **no** se sobrescriben desde fuera; si llegan, se ignoran, y los de accesibilidad (`role`, `aria-*`, `tabindex`) avisan en desarrollo (§2.6).
- **Clases** (contrato bruno ↔ coco): `g-icon`, `g-icon--filled`, `g-icon--flip-rtl`. No hay clase por nombre de icono.

### 2.4 Accesibilidad (#199)

- **Decorativo por defecto** (`aria-hidden="true"`): un icono junto a un texto que ya dice lo mismo no añade nada al árbol de accesibilidad (WCAG 1.1.1; H67 por analogía).
- **Con `label`:** `role="img"` + `aria-label` (WCAG 1.1.1, técnica ARIA24). Solo cuando el icono es **la única fuente del significado** y no está dentro de un control (una celda de estado «Bloqueado» sin texto).
- **Nunca enfocable** (`focusable="false"`, sin `tabindex`). Si hay que pulsarlo, el nombre y el foco van en el **control** (`<GBtn icon aria-label="Desbloquear">` con un `GIcon` decorativo dentro), no en el icono.
- **`label` dentro de un hueco `aria-hidden`:** el nombre se pierde (verificado por kiwi en el árbol real: el botón se llama solo por su texto). `GIcon` lo detecta **al montar** (en el cliente) y avisa en desarrollo; el icono se dibuja igual.
- **`forced-colors`:** el trazo es `currentColor` y se adapta solo.

### 2.5 Movimiento y RTL

- Los iconos pueden girar (`rotate`), revelarse (`clip-path` sobre el `svg`) o desplazarse con las transiciones de cada componente; con `prefers-reduced-motion` no se animan.
- **`flip-rtl`** (coco, `GIcon.css`): espejo horizontal con la dirección **efectiva** (`:dir(rtl)`), no con un atributo puesto en el propio icono. El espejo **no debe pisar** el `transform` que un hueco use para girar su icono (chevron de un padre de `GSidebar`): se compone con él. El espejo interno de `GCard` (marca de «actual») sigue siendo interno y no usa esta prop.

### 2.6 Avisos de desarrollo

`typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'` (nunca `import.meta.env.DEV`), una vez por causa y nombre, prefijo `[Grana GIcon]`:

| Causa | Qué hace el componente |
| --- | --- |
| `name` que no está en el registro ni en la lista de la librería | No dibuja nada. El aviso dice cómo registrarlo (`createIcons([...])` importando de `lucide-static`) |
| `label` con un antecesor `aria-hidden="true"` (comprobado al montar) | Dibuja igual. El aviso dice que el nombre se pierde y que va en el control (`aria-label`) |
| `role`, `aria-*` o `tabindex` pasados como atributos | Se ignoran. El aviso remite a `label` (nombre) o al control (foco) |

## 3. Reglas para quien escribe el CSS

- Un componente **no dibuja marcas con CSS**: si necesita una, el marcado lleva un `GIcon`.
- Un `content:` de CSS **no contiene** glifos pictográficos (solo texto o cadenas vacías).
- Las figuras de estado son `GIcon filled`, no `clip-path`.
- La regla base de `GIcon` sigue en `:where(.g-icon)` (especificidad 0). La clase de la aplicación gana sin `!important` **por la capa** (#4), no por esa especificidad: dentro de un hueco también gana (§2.2, #204). Un hueco **no** intenta ganarle (`!important`, selectores más fuertes): la aplicación siempre gana.
- El tamaño de un icono en un hueco sale de un **alias local** del componente en `em` del texto del hueco (o en unidades de `space` cuando el hueco es una caja fija, como `--_ico` de `GSidebar`); nunca de un token global de icono (#205). `GBtn`: `--_icon` (§9, `design/contracts/btn.md`).
- `g-icon--flip-rtl` espeja solo en RTL efectivo (§2.5). **Sin tokens nuevos.**

## 4. Lista de la librería (API pública)

**Es API pública desde la v0.2 (#201):** cualquier aplicación puede usar `<GIcon name="…">` con estos nombres **sin registrarlos**. La lista **puede crecer** (cambio menor); **quitar un icono es un cambio mayor**. Si un componente deja de usar un icono, el icono **sigue en la lista** hasta la siguiente versión mayor.

**Qué entra:** solo lo que usa un componente de Grana (la regla de la v0.1 se mantiene). Un icono que pide una aplicación **no** entra en el paquete: lo registra ella (§5). Por eso `lock-open` (migración del modal de Bootstrap), `image`, `map-pin` y `play` (ejemplos de `GCard`, #137) **no** están en la lista: ampliar la base por cada icono que pide una aplicación lleva a toda Lucide en el paquete (medido por kiwi: +74 % del gzip de `dist/grana.js` como mapa por nombre, que un empaquetador no puede podar), mientras que registrarlos desde `lucide-static` cuesta solo lo importado (1 icono ≈ 542 B, 373 B gzip; 4 iconos ≈ 1 748 B, 583 B gzip; con Vite).

Nombre de Lucide entre comillas.

| Componente | Dónde | Icono |
| --- | --- | --- |
| `GBtn`, `GInput`, `GTextarea`, `GSelect`, `GSwitch` | Indicador de carga (en `GSwitch`, sobre el pulgar) | `loader-circle` (gira) |
| `GCheckbox` | Marca marcada · mixta · ✓ del chip | `check` · `minus` · `check` |
| `GCheckbox`, `GCheckboxGroup`, `GInput`, `GTextarea`, `GSelect`, `GSwitch`, `GDatePicker`, `GFieldGroup`, `GInputGroup` | Mensaje: error · advertencia · válido (DECISIONS.md #164; el error era `triangle-alert`, ahora coincide con `GStepper`, `GTabs`, `GCard` y `GToast`) | `circle-alert` · `triangle-alert` · `circle-check` |
| `GSwitch` | Marca del pulgar: encendido · apagado | `check` · `minus` |
| `GSelect` | Flecha · limpiar · elegida · «Agregar nuevo…» | `chevron-down` · `x` · `check` · `plus` |
| `GInputGroup` | Flecha de cada parte de elección (`GInputGroupSelect`, `<select>` nativo; decorativa) | `chevron-down` |
| `GDatePicker` | Icono del campo · mes anterior · siguiente · cierre de la hoja · punto de hoy | `calendar` · `chevron-left` · `chevron-right` · `x` · `circle` (rellena) |
| `GCalendar` | Anterior · siguiente · puntos de eventos · punto de la línea de ahora | `chevron-left` · `chevron-right` · `circle` (rellena) · `circle` (rellena) |
| `GDialog` | Cierre | `x` |
| `GSidebar` | Chevron de un padre · cierre del drawer | `chevron-right` (gira) · `x` |
| `GBadge` | Figuras: círculo · cuadrado · rombo · triángulo · punto de estado | `circle` · `square` · `diamond` · `triangle` · `circle` (rellenas) |
| `GMetric` | Tendencia: sube · baja · igual | `arrow-up` · `arrow-down` · `minus` |
| `GDataList` | Muestras de la leyenda | `circle` · `square` · `diamond` · `triangle` (rellenas) |
| `GWidget` | Botón del menú de acciones | `ellipsis-vertical` |
| `GWidgetGrid` | Asa de mover · asa de redimensionar | `grip-vertical` · `move-diagonal-2` |
| `GWidgetGallery` | Marca de la categoría elegida | `check` |
| `GStepper` | Paso hecho · con error · con advertencia · bloqueado | `check` · `circle-alert` · `triangle-alert` · `lock` |
| `GHelper` | Disparador por defecto | `circle-question-mark` (antes `circle-help`, que sigue como alias de compatibilidad, ver abajo) |
| `GTable` | Orden: sin orden · ascendente · descendente | `chevrons-up-down` · `arrow-up` · `arrow-down` |
| `GPagination` | Anterior · siguiente | `chevron-left` · `chevron-right` |
| `GFilterBar` | Sugerir o agregar filtro · quitar filtro | `plus` · `x` |
| `GTabs` | Cargando (gira) · requiere atención · botones de borde · botón «Más» | `loader-circle` · `circle-alert` · `chevron-left` / `chevron-right` · `chevron-down` |
| `GCard` | Casilla / alternar · radio · menú de acciones · estados `error` / `warning` / `success` / `info` · marca de «actual» · «mostrar más» | `check` · `circle` (rellena) · `ellipsis-vertical` · `circle-alert` / `triangle-alert` / `circle-check` / `info` · `chevron-right` (espejado en RTL) · `chevron-down` |
| `GToast` | Tipos `info` · `success` · `warning` · `error` · `loading` (gira) · cerrar (`neutral` no lleva icono) | `info` · `circle-check` · `triangle-alert` · `circle-alert` · `loader-circle` · `x` |
| `GErrorSummary` | Título del resumen | `circle-alert` |
| `GMenu` | Casilla marcada · opción marcada · chevron de submenú · peligroso | `check` · `circle` (rellena) · `chevron-right` · `triangle-alert` |
| `GSpeechHost`, `GSpeechPill`, `GSpeechTrigger` (captura de voz, Fase 1; `speech.md` §2.1, §6.4, §7; #224) | Estados: `idle`/`ready` · `requesting` · `listening` · `speech` · `transcribing` · `paused` · `processing` (gira) · `reconnecting` · `denied` · `unavailable` · `error` · `completed` | `mic` · `shield-question-mark` · `circle` (rellena) · `audio-lines` · `captions` · `circle-pause` · `loader-circle` · `refresh-cw` · `mic-off` · `unplug` · `circle-alert` · `circle-check` |
| | Controles: pausar · reanudar / empezar · reintentar · finalizar · abrir panel · cerrar panel · cerrar sesión · fragmento fallido · privacidad local / externa | `pause` · `mic` · `rotate-ccw` · `square` (rellena) · `chevron-down` · `x` · `circle-check` · `triangle-alert` · `lock` / `globe` |
| | Fase 2 (`speech.md` §6.4; #253): «Revisar» / «Revisar transcripción» del panel | `file-pen-line` |
| `GAvatar` (`avatar.md`; #296) | Respaldo por defecto (sin imagen, `initials`, `icon` ni iniciales derivables de `name`) | `user` |
| `GTranscript` (captura de voz, Fase 2; `speech.md` §22, §23, §24, §28.2; #253) | Editar · corregido · eliminar · eliminado · restaurar / volver al original · deshacer · rehacer · copiar · insertar · usado en · mostrar cambios / ver original · hablantes / asignar / hablante cambiado · añadir / nuevo hablante · unir · separar · acciones de fila · ir al final · «Más» · cambió después de insertarlo · fallido | `pencil` · `pencil` · `trash` · `trash` · `rotate-ccw` · `undo-2` · `redo-2` · `copy` · `text-cursor-input` · `text-cursor-input` · `git-compare` · `users` · `user-plus` · `merge` · `split` · `ellipsis-vertical` · `arrow-down` · `chevron-down` · `triangle-alert` · `triangle-alert` |
| `GStatusIsland`, `GStatusMark` (isla de estado; `status.md`; #325) | Tipos `info` · `success` · `warning` · `error` · reintentando (gira) · descartar · copiar el detalle | `info` · `circle-check` · `triangle-alert` · `circle-alert` · `loader-circle` · `x` · `copy` (todos ya en la lista: **ninguno nuevo**; sin `icon` por condición en v0.1) |

**Alias de compatibilidad (#206):** `circle-help` estaba en la lista de la v0.2 con el nombre de un **archivo de alias** de `lucide-static` (`icons/circle-help.svg`, marca `lucide-circle-help`), no con el canónico: en `lucide-static` 1.49.0 `CircleHelp`, `HelpCircle` y `CircleQuestionMark` exportan el mismo módulo, `circle-question-mark`. Desde la v0.3 la lista usa el canónico **`circle-question-mark`** y **conserva `circle-help`** como alias del mismo dibujo (sin bytes duplicados en el paquete), sin aviso, hasta la siguiente versión mayor (#201: quitar un nombre es cambio mayor); está **obsoleto**: la documentación y los componentes usan el canónico. Es el único alias; uno nuevo solo entra por una decisión de lima cuando Lucide renombre un icono de la lista (§7, prueba 9).

| Alias (obsoleto) | Canónico | Se retira en |
| --- | --- | --- |
| `circle-help` | `circle-question-mark` | la siguiente versión mayor |

**Entran con la captura de voz (v0.4, #224):** `mic`, `mic-off`, `pause`, `circle-pause`, `audio-lines`, `captions`, `shield-question-mark`, `refresh-cw`, `unplug`, `rotate-ccw` y `globe` (nombres canónicos comprobados por lima en `lucide-static` 1.49.0: cada uno tiene su módulo en `dist/esm/icons/` con la marca `lucide-<nombre>`; `shield-question-mark`, no el archivo de alias `shield-question`). Bruno los añade a la lista `library` de `icons.json` (y a `lab`, para el prototipo) antes de usarlos. **Entran con la Fase 2 de la captura de voz (v0.5, #253):** los cinco reservados en la v0.4 (`text-cursor-input`, `undo-2`, `trash`, `pencil`, `copy`) y `redo-2`, `user-plus`, `merge`, `split`, `git-compare`, `users` y `file-pen-line` (nombres canónicos comprobados por lima en `lucide-static` 1.49.0: módulo `dist/esm/icons/<nombre>.mjs` con la marca `lucide-<nombre>`; `trash`, no el alias `Trash2`, #206). Bruno los añade a la lista `library` de `icons.json` antes de usarlos. **Entra con `GAvatar` (v0.6, #296):** `user` (nombre canónico comprobado por lima en `lucide-static` 1.49.0: `dist/esm/icons/user.mjs`, marca `lucide-user`); bruno lo añade a la lista `library` de `icons.json` antes de usarlo (ya estaba en `playground` y `lab`). **`undo-2` y `redo-2` llevan `flip-rtl` en todos sus usos** (Deshacer/Rehacer de la barra y «Deshacer inserción»; #261, #263): son flechas con sentido de lectura (atrás/adelante) y en RTL se leerían al revés; `arrow-down`, `split`, `merge` y el resto no se espejan (vertical o sin sentido de lectura).

`GProgress`, `GTextarea` (salvo el mensaje), `GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GFormActions`, `GInput` (los iconos de los slots `prepend` y `append`), `GWidgetConfig` y el resto **no traen iconos propios**.

**Listas del script** (`packages/vue/scripts/icons.json`): `library` es esta tabla (el paquete); `playground` y `lab` siguen siendo de playground y laboratorio, nunca del paquete (#137). Con la v0.2, el playground **usa la vía pública** para los suyos (§6).

**Regla:** añadir un icono a la librería exige **añadirlo a esta tabla** y a la lista `library` del script antes de usarlo en un componente, **con su nombre canónico** (el de su módulo en `dist/esm/icons/` de `lucide-static`, §5.2), nunca el de un archivo de alias de `icons/`.

## 5. Iconos de la aplicación: registro (`createIcons`)

### 5.1 API

Exportaciones de `@grana/vue` (bruno las registra en `src/index.js`):

| Exportación | Qué es |
| --- | --- |
| `createIcons(icons)` | Crea el **registro de iconos de la aplicación** a partir de un arreglo de cadenas de `lucide-static`. El objeto devuelto es **plugin de Vue**: `app.use(registro)` lo provee a toda la aplicación. Su forma interna **no es API** |
| `iconsKey` | Clave de inyección (`InjectionKey`) para `provide` manual (pruebas, microfrontends, un subárbol con otro registro), como `formKey` y `toasterKey` |
| `GIcon` | El componente (§2) |

```js
// main.js de la aplicación
import { createApp } from 'vue'
import Grana, { createIcons } from '@grana/vue'
import { LockOpen, MapPin, Image, Play } from 'lucide-static'

createApp(App)
  .use(Grana)
  .use(createIcons([LockOpen, MapPin, Image, Play]))
  .mount('#app')
```

```vue
<GIcon name="lock-open" />                         <!-- decorativo -->
<GIcon name="lock" label="Bloqueado" />            <!-- imagen con nombre (sin registrar: está en la librería) -->
<GBtn icon aria-label="Desbloquear"><GIcon name="lock-open" /></GBtn>
```

- **Argumento:** un arreglo de cadenas tal como las exporta `lucide-static` (un módulo ES por icono, `sideEffects: false`: el empaquetador solo lleva los importados; verificado con Vite). Un argumento que no es arreglo da un registro vacío y avisa en desarrollo.
- **No se escribe el nombre:** sale de la marca de la cadena (§5.2). Evita erratas y desajustes nombre ↔ dibujo.
- **Sin efectos al importar ni al crear:** `createIcons` no toca `document` ni `window`, no hace `fetch` y no guarda nada en el módulo (SSR, §5.6).

### 5.2 Nombre derivado de la marca; alias

- Cada cadena de `lucide-static` lleva en su `<svg>` la marca `class="lucide lucide-<nombre>"`; `<nombre>` (minúsculas, dígitos y guiones) es el **nombre canónico** con el que se usa en `GIcon`. Verificado por kiwi: las **2 117** exportaciones de `lucide-static` v1.49.0 la llevan.
- **El nombre es el de la marca de la exportación, no el del identificador ni el de un archivo (#206).** Las exportaciones con nombre salen de los módulos de `dist/esm/icons/`, uno por icono canónico, y su marca es **siempre el canónico**. En cambio, la carpeta `icons/` del paquete trae también **archivos de alias** con su propia marca (`icons/circle-help.svg` → `lucide-circle-help`, `icons/unlock.svg` → `lucide-unlock`): ni el nombre de un archivo de `icons/` ni el del identificador importado determinan el nombre registrado.
- **Alias:** `lucide-static` exporta el mismo módulo con varios identificadores (`export { default as LockOpen, default as Unlock }`). Como el nombre sale de la marca, todos registran el canónico y los nombres de alias **no** existen en `GIcon` (`<GIcon name="unlock">` no dibuja nada). Casos frecuentes (v1.49.0):

| Importación | Nombre registrado |
| --- | --- |
| `Unlock`, `LockOpen` | `lock-open` |
| `CircleHelp`, `HelpCircle`, `CircleQuestionMark` | `circle-question-mark` |
| `Building2`, `BuildingComplex` | `building-complex` |
| `Trash2`, `Trash` | `trash` |
| `Home`, `House` | `house` |

- **Cadenas que no vienen de una exportación** (un `?raw` de un archivo de `icons/`, una copia): si traen la marca y pasan §5.3 se aceptan con **el nombre de su marca**, que en un archivo de alias **no** es el canónico (`icons/circle-help.svg` registra `circle-help`). No es la vía documentada: se importa la exportación.
- **Repetidos:** dos entradas que dan el mismo nombre registran **una**; si sus dibujos normalizados difieren (dos versiones de Lucide), se queda la **primera** y avisa en desarrollo.
- **Nombres que ya trae la librería** (`lock`): se aceptan **sin aviso** (sirve de seguro si la lista base cambia en una versión mayor).

### 5.3 Validación estricta (#198)

Se valida **por texto** (sin `DOMParser`, funciona en SSR) y con **el mismo criterio en desarrollo y en producción**. Una entrada se acepta **si y solo si**:

1. Es una cadena (`string`).
2. Recortados los espacios de los extremos, es **un único** elemento `<svg …>…</svg>` cuya etiqueta de apertura contiene la marca `class="lucide lucide-<nombre>"`.
3. Su contenido son **solo** elementos de dibujo **vacíos y autocerrados** de la lista `path`, `circle`, `rect`, `line`, `ellipse`, `polyline`, `polygon`, separados únicamente por espacio en blanco (sin texto, comentarios, entidades ni `CDATA`).
4. Esos elementos llevan **solo** atributos geométricos de la lista `d`, `cx`, `cy`, `r`, `rx`, `ry`, `x`, `y`, `x1`, `x2`, `y1`, `y2`, `width`, `height`, `points` y `fill`, entre comillas dobles; los valores contienen solo letras, dígitos, espacio, `-`, `.` y `,`; `fill` solo vale `none` o `currentColor`.

- **Los atributos del `<svg>` raíz de la cadena se descartan**: `GIcon` pone los suyos (§2.3). Solo se guardan los hijos, normalizados (sin espacio entre elementos, `/>` sin espacio previo), que deben coincidir con lo que genera `build-icons.mjs` para el mismo icono.
- **Todo lo demás se rechaza entero** (nunca se registra una versión «limpiada»): no se registra, avisa en desarrollo con el motivo y en producción se ignora en silencio. Nunca lanza un error.

| Ejemplo rechazado | Motivo |
| --- | --- |
| `'lock-open'` (texto) | No es una cadena de `lucide-static`: el nombre no se escribe, se importa la cadena |
| Un SVG escrito a mano o de otra colección | Falta la marca de Lucide |
| Un componente u objeto (`lucide-vue-next`, un `import` de un `.svg` como componente) | No es una cadena |
| `<script>`, atributos `on*` (`onload`), `style`, `href`/`xlink:href` | Elemento o atributo fuera de la lista (verificado por kiwi: una cadena con `<script>` y `onload` disfrazada de Lucide no se ejecuta ni deja rastro en el DOM) |
| `<g>`, `<use>`, `<image>`, `<foreignObject>`, `<title>`, `<style>`, texto suelto | Elemento fuera de la lista |
| `fill="#f00"`, `fill="url(#a)"` | Valor no admitido (color literal o referencia) |

**Por qué estricto** (#198): aceptar cualquier SVG «con aviso» dibujaría en producción contenido arbitrario por `innerHTML` (vector de inyección si la cadena llega de datos) y diluiría la regla «solo Lucide». La marca y la lista de elementos de dibujo garantizan a la vez la procedencia declarada y que solo entra geometría.

### 5.4 Resolución de un nombre

| Origen del nombre | Orden |
| --- | --- |
| **De la aplicación:** un `GIcon` en una plantilla de la aplicación, o el `icon` (cadena) de un item de `GTabs`, `GMenu` o `GSidebar` o de una opción de `GRadioGroup` (§5.8) | (1) el registro **más cercano** (`inject(iconsKey)`) → (2) la lista de la librería → (3) nada y aviso en desarrollo |
| **De Grana:** los iconos propios de un componente (la tabla de §4: la `x` de `GDialog`, el `check` de `GCheckbox`…) | **Solo** la lista de la librería; el registro **nunca** se consulta |

La aplicación no puede cambiar por accidente un icono propio de un componente. El mecanismo interno con el que bruno separa los dos caminos (un componente interno distinto, una función de resolución…) **no es API** y no se documenta.

### 5.5 Un solo camino: sin opción `icons` en `install` (#200)

El registro existe **solo** como `createIcons` (y `iconsKey` para `provide` manual). **No** hay atajo `app.use(Grana, { icons })`:

- **Funciona sin `install`.** Quien importa componentes sueltos para podar el paquete no llama a `app.use(Grana)`; con el atajo, esas aplicaciones necesitarían otro camino y habría dos formas documentadas de lo mismo (lo que #196 descarta para los títulos).
- **Mismo patrón que los servicios** (`createToaster`, #140; `api.md`, «Servicios imperativos»): lo que la aplicación crea es el plugin.
- **`install` sin opciones** no se convierte en una bolsa de configuración y no hay que decidir cómo se mezclan dos listas (opción de `install` + `createIcons`).
- El coste para la aplicación es un `.use(...)` más en la misma línea.

**Un registro por aplicación:** instalar un segundo registro en la misma aplicación **lo sustituye** y avisa en desarrollo («pasa todos los iconos en una sola lista»). Un `provide(iconsKey, …)` en un subárbol **sustituye** al de la aplicación para ese subárbol (el más cercano gana entero; no se mezclan): quien necesite ambos los pasa juntos.

### 5.6 SSR y varias aplicaciones

- Registro **por aplicación** con `provide`/`inject`, **sin global de módulo** (CLAUDE.md, «sin globals de la app»): dos aplicaciones en la misma página, o dos peticiones simultáneas en un servidor, no comparten iconos. Verificado por kiwi con `renderToString` y un componente mínimo; con el `GIcon` real, lo verifica bruno.
- La validación es por texto; el `svg` se renderiza en el servidor igual que en el cliente. La comprobación de `label` dentro de un hueco `aria-hidden` (§2.4) solo corre al montar en el cliente.

### 5.7 `lucide-static` en la aplicación

- La aplicación **instala `lucide-static` por su cuenta** (su versión; la licencia ISC viaja en su bundle con el aviso `@license`, verificado en la salida de Vite).
- En `@grana/vue`, `lucide-static` sigue siendo **devDependency** (#86) y además se declara **`peerDependency` opcional** (`peerDependenciesMeta.optional`) con el rango verificado (hoy `^1.49.0`): documenta qué formato de marca valida Grana sin instalarlo a nadie (#201).
- **Sin CLI** (`grana icons add …`) en v0.2: con un empaquetador, importar de `lucide-static` ya lleva solo lo usado; solo serviría sin empaquetador (§9).

### 5.8 Huecos de icono en los componentes: «dato → nombre; plantilla → slot» (#202)

La convención completa y el mapa de huecos por componente están en `docs/contract/api.md` («Iconos en los componentes»). Resumen:

- **Items que llegan como datos** (`GTabs`, `GMenu`, `GSidebar`; `options` de `GRadioGroup`, #267): si el item trae `icon` **cadena** y **no** hay slot `icon`, el componente dibuja `GIcon` con ese nombre (resolución de la aplicación, §5.4) en su hueco `aria-hidden`. Con slot `icon`, **manda el slot** (como hoy). Un `icon` que no es cadena sigue siendo un dato opaco que solo recibe el slot (sin slot, no se dibuja nada).
- **Componentes en plantilla** (`GBtn`, `GInput`, `GSelect`, `GSwitch`, `GBadge`, `GCard`, `GDialog`, `GFormSection`…): **sin props nuevas**; slot + `<GIcon>`. En `GBtn`, `icon` sigue siendo **Boolean** (modo solo icono).
- **Títulos:** `GFormSection` gana el slot `lead` (#203); `GDialog` conserva su slot `icon`, que ya cumple esa función.
- **`GAvatar` (#296), excepción acotada:** su prop `icon` es un **nombre** (dato) resuelto como los de la aplicación (§5.4), porque el icono no decora un control: **es el contenido** de la identidad y llega de los datos, como `src` o `name`; `GAvatar` no tiene slots. Un nombre que no resuelve hace que el avatar siga con su respaldo (iniciales de `name` o `user`). Su icono por defecto `user` es propio: **solo la librería**.
- Todos los huecos de icono de los componentes son **decorativos** (`aria-hidden`): un `GIcon` con `label` dentro de ellos avisa (§2.4).

## 6. Prototipos, bancos, playground y documentación

- **Bancos y playground:** el marcado de cada componente es el real (con `svg` de Lucide). Los iconos de ejemplo que pone «la aplicación» se usan **por la vía pública**: el script genera el módulo del playground con las **cadenas completas** de `lucide-static` (con su marca) de la lista `playground`, y el playground las registra con `createIcons` y las dibuja con `GIcon`. **No** trazos escritos a mano.
- **Laboratorio** (`design/lab/lucide-icons.js`): sigue como hasta ahora para los prototipos de kiwi (no son componentes reales).
- **Prototipos de kiwi (wireframes):** si muestran un icono, es Lucide.
- **README y documentación:** los ejemplos de iconos usan `GIcon` con nombres de Lucide y, para los que no están en la §4, `createIcons` con importaciones de `lucide-static`. Ningún README enseña un `<svg>` escrito a mano dentro de un slot (hoy `GBtn/README.md` lo hace: mora-docs lo actualiza).
- **Migración del modal de Bootstrap** (`design/lab/migraciones/analisis/index.html`): sustituir su `<lucide-icon>` propio por `GIcon` + `createIcons([LockOpen])` cuando exista (fricción 11 y fricción 1 del patrón de bloqueo de `notas.md`).

## 7. Comprobación automática

Pruebas de bruno; **fallan** si:

1. **Repositorio** (`check-icons.mjs`, como en la v0.1): un carácter de la lista de la §1 fuera de un texto explicativo permitido (las cadenas de ejemplo de documentación se exceptúan de forma explícita y acotada); en un CSS de componente, `clip-path: polygon(` o un `content:` que no sea texto ni vacío.
2. **Iconos propios de los componentes:** un `GIcon` con nombre fijo en `packages/vue/src/components/**` que no está en la lista de la §4. **Esta comprobación aplica a los componentes de Grana, no a la aplicación** (ni a los nombres que llegan por datos, que se resuelven en ejecución).
3. **Validación contra Lucide entero:** **todas** las exportaciones de la versión instalada de `lucide-static` se aceptan; el nombre derivado coincide con el nombre de su **módulo** en `dist/esm/icons/` (no con el identificador exportado ni con un archivo de alias de `icons/`, #206); el dibujo normalizado coincide con el de `build-icons.mjs`. Si Lucide cambia el formato de la marca o de los elementos, **esta prueba debe fallar** antes de publicar.
4. **Rechazos:** cada ejemplo de la tabla de §5.3 se rechaza, nada se ejecuta y nada entra al DOM; un argumento que no es arreglo da un registro vacío.
5. **Resolución:** el registro gana a la librería para nombres de la aplicación; un icono propio de un componente ignora el registro; registrar un nombre de la librería no avisa; alias y repetidos dan una sola entrada.
6. **Accesibilidad de `GIcon`:** decorativo sin `label`; `role="img"` + `aria-label` con `label` (sin `aria-hidden`); nunca `tabindex`; aviso con `label` dentro de un antecesor `aria-hidden`; `role`/`aria-*`/`tabindex` como atributos se ignoran y avisan.
7. **SSR:** dos aplicaciones renderizadas a la vez con registros distintos no se mezclan; importar el paquete y llamar a `createIcons` no toca `document` ni `window`.
8. **Items por nombre** (`GTabs`, `GMenu`, `GSidebar`, `GRadioGroup`): `icon` cadena sin slot dibuja `GIcon` en el hueco; con slot manda el slot; `icon` no cadena sin slot no dibuja nada; en `GTabs`, `labelMode="icon"`/`auto` cuenta un `icon` cadena como icono.
9. **Nombres canónicos de la librería** (#206): cada nombre de la lista `library` tiene su módulo en `dist/esm/icons/` de la versión instalada (es canónico), salvo los alias de compatibilidad de la tabla de §4, cada uno con el **mismo dibujo** que su canónico y con el canónico en la lista. Si Lucide renombra un icono de la lista en una versión nueva, **esta prueba falla** y lima decide (renombrar y conservar el viejo como alias hasta la siguiente mayor). `circle-help` y `circle-question-mark` dibujan lo mismo; `GHelper` usa el canónico.

## 8. Límites conocidos

- Cada icono de la librería añade unos cientos de bytes al paquete (medido: la lista de 25 son 712 B gzip, el 0,6 % de `dist/grana.js`). Las cadenas de `lucide-static` que importa la aplicación traen espacios y el aviso de licencia (≈ 540 B frente a 120–170 B normalizados): es el coste de no copiar archivos.
- **La marca prueba la procedencia declarada, no la autenticidad:** una cadena hecha a mano con la marca `class="lucide lucide-…"` y solo elementos de dibujo pasaría la validación. No es un riesgo de seguridad (solo entra geometría) y en el repositorio lo impide la §7; en una aplicación, es una infracción deliberada de la regla.
- Las animaciones de dibujo que hoy usan `clip-path` sobre bordes (la marca de `GCheckbox`) pasan a revelar el `svg`; el aspecto cambia un poco (trazo de Lucide, más redondeado).
- **Lucide no es un sistema de iconos de marca de tema**: no cambia con `brand`; solo toma `currentColor` y el tamaño del componente.
- **No verificado** (de la ronda de kiwi): Firefox y WebKit; lectores de pantalla reales con `role="img"` en `svg`; `forced-colors` real; el componente Vue real (el prototipo simula `GIcon` y el registro); poda con otros empaquetadores (webpack, Rollup puro, esbuild); uso sin empaquetador; formato de la marca en versiones de `lucide-static` distintas de la 1.49.0 (lo cubre la prueba 3 de §7).

## 9. Fuera de v0.2 (diferido)

- **Icono por nombre en más datos:** opciones de `GSelect` y pasos de `GStepper` (`indicator="icon"`) siguen solo con su slot `icon`; hoy sus datos no tienen campo `icon`. Si se pide, entran con la misma regla de §5.8, sin romper nada.
- **`prependIcon` / `appendIcon`:** nombres **reservados** para una prop de icono por nombre en componentes sueltos, si algún día se piden; no existen en v0.2 y no se usan para otra cosa. Nunca `icon` en `GBtn` (es Boolean).
- **Token de tamaño de icono: cerrado sin token (#205).** Cada hueco sigue con su alias local en `em` (o en `space` si es una caja fija); `GBtn` gana el suyo (`--_icon`). Un token global no tendría un valor válido para todos los huecos (16,1px en `GTabs`, 17,7px en `GMenu`, 20px en `GSidebar` con el mismo texto de 14px) y daría a la aplicación una segunda forma de pisar el hueco además de la clase (#204).
- **CLI `grana icons add`** y uso **sin empaquetador** (UMD/CDN importando `lucide-static` desde una CDN): solo si hay demanda.
- **Tipos de TypeScript** para los nombres (autocompletado).
- **Tooltip** para iconos solos: cuando exista el componente (#113), en el control.
