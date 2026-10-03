# Brief — GFormSection, Fase 3 (r01)

> Brief de kiwi a partir del encargo (2026-10-03), verificado contra el repo. Fase 3 del sistema de formularios (`design/contracts/form.md`, «Fases siguientes», fila 3): los modos y props que el contrato dejó **reservados** en `GFormSection` (§3): `mode` (`collapsible`, `addable`), `open`/`v-model:open`, `added`/`v-model:added`, `headerPlacement`, `divider` y `labels` (`add`, `remove`).

## Qué es

`GFormSection` ya agrupa una **idea** del formulario (`<section>` + `hN`, sin tarjeta; #161). Esta ronda decide cómo se comporta cuando:

- **se puede plegar** (`collapsible`): información secundaria, avanzada o ya completa cuyos datos **siguen siendo parte del formulario** (valores por defecto); el usuario la abre con un botón;
- **se agrega a voluntad** (`addable`): un bloque opcional que no ocupa sitio hasta que el usuario decide incluirlo («Agregar datos fiscales»); sin agregar no existe para el formulario;
- **pone el encabezado al lado** (`headerPlacement="auto"`) cuando su ancho propio lo permite;
- **dibuja una línea** con la sección anterior (`divider`).

El usuario del brief original quiere **saber qué falta sin abrir todo**: una sección plegada debe decir en su encabezado si tiene errores y, si la aplicación quiere, qué contiene.

## Lo que ya está decidido y no se reabre

| Fuente | Qué fija |
| --- | --- |
| `form.md` §3, #161 | `<section>` + `hN` (`headingLevel`), **sin** `aria-labelledby` (no es punto de referencia); `__header`, `__heading`, `__lead` (#203, fuera del `hN`), `__title`, `__description`, `__actions`, `__help`, `__body`; `optional` con insignia |
| `form.md` §3, #283 | El cuerpo **no distribuye**: los campos van en un `GFormLayout` dentro de `__body` |
| `form.md` §3, #192 | Entre secciones, **espacio** (`--g-form-section-gap` × densidad). Reglas reservadas para `divider`: prop de la sección (default `false`); **`GDivider decorative`** `subtle` `inset="none"`; lo pinta la sección **dentro** de su `<section>`, antes de `__header`; la línea vive **dentro** del hueco (distancia = gap × densidad ±1px, centrada ±1px, dentro y fuera de `GForm`, tres densidades); sin línea en la primera sección ni antes de `GFormActions` |
| `form/r01/declaracion.md` §3.5, §4, guía | `static` por defecto; **no usar acordeón para lo esencial**. `collapsible`: botón **dentro del encabezado** con `aria-expanded`/`aria-controls` (APG Disclosure), nombre que no cambia, cerrada = `inert` pero sus datos **siguen en el envío** y se validan; un enlace del resumen a un campo dentro **la abre**; foco quieto en el botón. `addable`: botón normal «Agregar …» que **inserta** la sección (sin `aria-expanded`), la sección trae «Quitar …», sin agregar **no se envía ni valida**, al quitar se limpian sus errores, foco al **título** (`tabindex="-1"`) al agregar y de vuelta a «Agregar» al quitar. Encabezado al lado con el ancho **propio** ≥ `space × 200` |
| `form.md` §14, #274 a #280 | `GFormReveal`: cerrado = `inert` + `fieldset disabled` (fuera de `FormData`); registro **inactivo** en `GForm` (#276); rejilla `0fr → 1fr` con `--g-duration-slow`, Δ0 del disparador, `is-ready` sin animar al montar, movimiento reducido = fundido |
| `form.md` §1, §7, #157, #162 | `GForm` no valida; revela al salir habiendo escrito, al cambiar una elección y al enviar («castigar tarde»); el resumen enlaza a cada pregunta, sale en silencio al corregir; `navigate` y luego desplaza y enfoca |
| `dialog.md` | `role="alertdialog"`: sin cierre por fondo ni botón de cierre; el consumidor pone primero la acción segura |
| `divider.md` | `decorative` = `<hr aria-hidden="true">` sin rol |
| `GSidebar` (#71) | Precedente de chevron `chevron-right` que gira a abajo y se espeja en RTL |

## Componentes que se solapan (revisados para no duplicar)

| Existe | Por qué no sirve para esto / qué se reutiliza |
| --- | --- |
| `GFormReveal` (§14) | Lo decide **una respuesta**, no un botón; cerrado **sale** del envío. Se reutiliza su técnica de transición y, para `addable`, su **registro inactivo** (#276) |
| `<details>`/`<summary>` | Un `<summary>` es un botón: el `hN` dentro pierde su semántica de encabezado en varios lectores (los hijos de un botón son presentacionales); la animación de `::details-content` con `interpolate-size` solo existe en Chromium. Se descarta como base |
| `GCard expandable`, `GStepper` (lista móvil), `GHelper`, submenú de `GSidebar` | Divulgaciones de otra cosa (descripción, lista de pasos, ayuda, navegación). Se reutiliza el patrón (`aria-expanded` + `aria-controls`, chevron de `GSidebar`) |
| `GDialog role="alertdialog"` | Se **compone** para confirmar «Quitar» con datos escritos |
| `GDivider decorative` | Se **compone** para `divider` (#192) |
| `GBtn` (`outline`, `ghost`) | Se **compone** para «Agregar …» y «Quitar …» |
| `GFormNav` (Fase 3, sin ronda) | Navega a secciones; no pliega. Esta ronda solo deja anotado qué le pasa el estado de la sección |

## Lo que decide esta ronda (estructura)

`collapsible`: dónde va el botón, qué pasa con `actions`/`help`/descripción plegada, icono y giro, resumen de estado en el encabezado (errores y lo que la aplicación quiera decir), apertura desde `GErrorSummary`, desde el envío y desde `showErrors()`, `inert` sin `fieldset disabled` (los datos siguen en `FormData`), relación con `GFormNav`. `addable`: anatomía sin agregar, agregada y al quitar, confirmación, qué pasa con lo escrito, registro en `GForm`. `headerPlacement`: umbral por ancho propio, alineación con las pistas de `GFormRow`, botón de plegar al lado. `divider`: anatomía y ritmo. Transición y estados (estática, plegable abierta/cerrada, con error plegada, completa plegada, agregable sin agregar/agregada, `readonly`/`disabled`, RTL, `forced-colors`, 320, ancho).

## Lo que NO es esta ronda

- No es `GFormNav` ni el autoguardado (Fase 4).
- No escribe contrato, CSS ni `.vue`; no toca `GForm`, `useFormField`, `GErrorSummary` ni `GDialog` (lo que necesitan va como hallazgos).
- No decide valores estéticos (proporción de columnas al lado, sangrías, color del estado, duración): el prototipo usa valores de wireframe.

## Prototipo

`index.html` monta los **componentes reales** de `packages/vue/dist/` (`GForm`, `GFormSection` fija, `GFormLayout`, `GFormRow`, `GInput`, `GRadioGroup`, `GErrorSummary`, `GFormActions`, `GBtn`, `GBadge`, `GDivider`, `GDialog`) con Vue global, y un **`XFormSection` de prototipo** para los modos nuevos que reutiliza las clases reales de `GFormSection` (su ritmo es el del CSS real) y simula lo que necesita de `GForm` envolviendo su contexto. Casos: formulario largo (fija, dos plegables, una agregable) a 960 con resumen y a 320 sin él; `headerPlacement="auto"` a 1100 y 720; RTL a 480; `divider` en las tres densidades dentro y fuera de `GForm`; `addable` con registro inactivo frente a desmontar; `GForm readonly` y `disabled`; encabezado estrecho con acción (`GFormSection` real). Verificación: `node design/lab/form-section/r01/verificar.mjs` (Playwright de `design/lab/theme-playground/`, Chromium, Firefox y WebKit).
