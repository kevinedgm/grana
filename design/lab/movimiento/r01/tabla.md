# Tabla única de movimiento · propuesta r01

**Estado:** propuesta para aprobar. No cambia ningún componente ni contrato.
**Origen:** pregunta del usuario del 2026-11-07: ¿hay un solo gobierno de las animaciones?
**Respuesta corta:** los valores sí (tokens y `tokens.md` §29); los comportamientos no. Esta tabla los fija por tipo de pieza.
**Evidencia:** `medir.mjs` sobre el `dist/` real, en Chromium, Firefox y WebKit, con y sin movimiento reducido (`medir.json`, `medir-reducido.json`).

Dos tiempos por pieza, una sola forma de moverse: quien añade un componente elige su tipo de pieza y hereda la fila. Salirse de la fila exige una decisión con número (identidad, §3).

## 1. La tabla

Duraciones: `fast` 120 ms, `press` 160 ms, `slow` 240 ms. La columna «Reducido» aplica §29.3: se queda el fundido, se va el desplazamiento.

| Tipo de pieza | Componentes | Entrar o abrir | Salir o cerrar | Reducido |
| --- | --- | --- | --- | --- |
| **Panel anclado** | `GSelect`, `GDatePicker`, `GMenu`, `GHelper`, editor de `GFilterBar` | `press` + `ease-out`: fundido y `space × 1` desde el lado del disparador, sin escala (D1) | `fast` + `ease-out`: solo fundido | Fundido `fast` `linear` en las dos direcciones |
| **Hoja móvil** (≤ 520 px) | Las mismas listas y `GDialog` en hoja | `press` + `ease-out`: fundido y `space × 6` desde su borde; fondo con fundido `press` | `fast`: solo fundido, fondo también | Solo fundido |
| **Diálogo** | `GDialog` | `press` + `ease-out`: fundido, `--g-press-scale`, D1 de #301 | `fast` + `ease-out`, hacia su origen | Solo fundido |
| **Plegado** | `GAccordion`, `GFormSection`, `GFormReveal`, submenú de `GSidebar`, detalle de `GTable` | `slow` + `ease-out`: altura | `slow` + `ease-out`: altura, contenido con fundido `fast` | Sin transición de altura |
| **Aviso flotante** | `GToast`, isla de estado | `press` + `ease-out` (la isla, su contrato) | `fast` el fundido | Solo fundido |

| Momento de control | Dónde | Regla | Reducido |
| --- | --- | --- | --- |
| **Hover de un control** | Botones, campos, enlaces | Color y borde con `fast` + `standard`. Sin escala. Solo con `@media (hover: hover)` | Igual: es color |
| **Pulsar** | `GBtn` y lo que lo compone | Aprieta `fast` + `ease-out` a `--g-press-scale`; suelta `slow` + `ease-bounce` | Sin escala |
| **Foco** | Todo | Nunca se anima: el anillo aparece en el acto | Igual |
| **Recorrer una lista con filas que se tocan** | `GMenu`, `GSidebar`, `GTable`, **`GSelect`** | Una sola luz: viaja `press` + `ease-out`; la primera colocación aparece sin viajar; aparece con fundido `fast` | Solo fundido, sin viaje |
| **Recorrer una lista con huecos o una rejilla** | `GCombobox` (fichas), `GDatePicker` (días), navbar | Una marca por elemento, nunca dos a la vez; salida instantánea | Igual |
| **Marcar o elegir** | Casillas, radios, interruptores, opción elegida | Color y marca con `fast` | Sin escala |
| **Carga** | Todo giro | `--g-duration-spin`, `linear`; con reducido, × 2,5. Tiempos 200/400/5000 ms de `loadPhase.js` donde aplique | Giro lento |
| **Señal de llegada** | `data-g-landed`, `is-here` de `GTable` | Decorativa y sin bloquear, hasta `slow × 4` (#589, #594). No es transición: no cuenta para el tope de 240 ms | Fundido corto |

**Quién mueve la luz** (`api.md`, «Una sola luz», regla 1, ampliada con un tercer caso):

| Lista | La luz sigue a | ¿El puntero mueve el foco? | Anillo |
| --- | --- | --- | --- |
| Foco dentro de la lista (`GMenu`) | El foco | Sí | El del foco |
| Foco fuera de la lista, con opción activa (`GSelect`) | La opción activa, por puntero o teclado | No: el foco sigue en el control | **Solo tras usar el teclado** |
| Lista en la secuencia de Tab (`GSidebar`, `GTable`) | El puntero | No | Solo con teclado |

## 2. Qué cambiaría

| Componente | Hoy (medido) | Con la tabla | Dueños |
| --- | --- | --- | --- |
| `GSelect` | Recorrer: salto sin transición en los tres motores, y el puntero pinta el anillo | Luz con `utils/glide.js`; anillo solo tras teclado | lima, coco, bruno |
| `GMenu` | Abre en `fast` (113 a 125 ms), con escala 0,96 | Abre en `press`; la escala depende de D1 | coco |
| `GHelper` | Cierre instantáneo en los tres motores | Fundido `fast` | coco, bruno |
| `GFilterBar` (editor) | Sin salida (CSS y plan 011; no medido aquí) | Fundido `fast` | coco, bruno |
| `GCombobox` | Cierre instantáneo en los tres motores; con reducido abre sin fundido | Fundido `fast` al cerrar y al abrir con reducido | coco, bruno |
| `GDatePicker` (días) | La celda que sale se funde (`fast`): puede haber dos encendidas | Salida instantánea | coco |
| `GTable` (detalle) | Plegado con `--g-ease-spring` (`table.md`), uso que no consta en la lista de §29.1 | lima elige: registrarlo en §3 o pasarlo a `ease-out` como `GAccordion` | lima, coco |
| `tokens.md` §29 | «Nada supera 240 ms», con #589 y #594 como excepción de hecho | Separar transición de señal de llegada | lima |
| `select.md`, `datepicker.md`, `helper.md`, `filter-bar.md` | Sin sección de movimiento | Una línea: su tipo de pieza | lima |

No cambian: `GDialog`, `GSidebar`, `GTable`, `GTooltip`, hover de controles, pulsación y movimiento reducido de `GSelect`, `GDatePicker` y `GMenu`.

## 3. Excepciones de identidad que se conservan

Elegidas por el usuario o con decisión propia. Quedan listadas para que la excepción sea visible, no para reabrirlas.

| Pieza | Qué hace distinto | Decisión |
| --- | --- | --- |
| `GCombobox` A, «el campo se abre» | Despliegue de `slow` que continúa el campo | #336 |
| `GCombobox`, recorrer | Salto sin fundido: la transición por fila dio dos marcos parpadeando (reporte del usuario) | Comentario en `GCombobox.css`; lima lo registra |
| `GTooltip` | Pestaña que viaja entre controles | #388 |
| `GFab` | Pila que crece | #655 |
| `GTabs` | Marca que se estira, con muelle | #302 |
| Usos aprobados de `--g-ease-spring` y `--g-ease-bounce` | Lista cerrada de §29.1 | #299 y ampliaciones |
| `GAvatarMotion` | Tiempos y curvas propios: es ilustración, no control | Fuera de la tabla; lima lo registra |

## 4. Decisiones del usuario

**D1 · ¿Cómo entra un panel anclado?**
- **A (recomendada): todos con desplazamiento de `space × 1`.** `GMenu` pierde su escala y todo panel se siente igual.
- **B: `GMenu` conserva la escala desde la esquina del disparador**, como excepción de §3. Solo sube a `press`.

**D2 · ¿Qué hacemos con la salida en Firefox y WebKit?** Hoy los paneles salen con fundido solo en Chromium. En Firefox y WebKit desaparecen en el acto, incluido `GMenu`: depende de `overlay`, y el plan 011 aceptó ese límite.
- **A (recomendada): se acepta y se escribe en la tabla.** Son 120 ms, sin código nuevo, y el margen de peso del paquete principal está agotado (#506).
- **B: utilidad común que retrasa el cierre.** Mismo fundido en todos, a cambio de JS en cada panel y de peso en el principal. `GSelect` y `GHelper` usan `popover="manual"`, así que el cierre es suyo y se puede retrasar; en los demás paneles no lo comprobé.

## 5. Cómo se hace cumplir

1. **Fuente única:** `design/contracts/motion.json` (lima), como `utilities.json`: tipo de pieza por componente y lista cerrada de usos de las curvas. Si la tabla y el JSON difieren, manda el JSON.
2. **Compuerta estática:** `packages/vue/scripts/check-motion.mjs` (bruno), en el job `verify`:
   - sin tiempos ni curvas literales en el CSS de componentes, salvo excepciones listadas;
   - `--g-ease-spring` y `--g-ease-bounce` solo en los archivos autorizados;
   - todo multiplicador de duración listado;
   - todo componente nuevo declarado en el JSON.
3. **Prueba de comportamiento:** `tests/movimiento.spec.mjs`, nacida de `medir.mjs`: abrir, cerrar y recorrer por tipo de pieza, comparados con el JSON, también con movimiento reducido.
4. **Flujo:** lima declara el tipo de pieza al contratar; salirse de la fila es una decisión con número.

Límite: la integración continua no arranca desde el 2026-10-14 por la facturación de GitHub; hasta arreglarla, la compuerta corre a mano.

## 6. Orden tras la aprobación

1. lima: `motion.json`, §29 y `api.md` (tercer caso de la luz), líneas en los cuatro contratos.
2. coco: CSS de §2.
3. bruno: luz de `GSelect`, salida de `GHelper`, `GFilterBar` y `GCombobox`, `check-motion.mjs`, spec. Mide el peso (#506).
4. coco: auditoría con `rubrica-movimiento.md`.
5. mora-docs: README afectados.

`GSelect` acaba de cerrar correcciones (#1001): conviene empezar cuando esa sesión termine.

## 7. Rúbrica de movimiento sobre la propuesta

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A. Propósito | Cumple | Cada fila dice qué comunica: origen, continuidad o posición | Bajo | Mantener la lista cerrada de curvas |
| B. Comodidad visual | No verificable | Desplazamientos de 4 a 24 px; sin observación con personas | Bajo | Mirarlo en la auditoría de coco |
| C. Estabilidad | Cumple | Sin oscilación sostenida; el giro es la única animación infinita | Bajo | — |
| D. Transiciones | Parcial | CSS interrumpible; la luz de `GSelect` y las salidas nuevas no están construidas | Medio | Probar reabrir a mitad de salida y mantener una flecha pulsada |
| E. Control | Cumple | Nada bloquea; todo dura ≤ 240 ms salvo señales decorativas | Bajo | — |
| F. Accesibilidad | Parcial | Reducido medido en los tres motores; anillo solo tras teclado sin probar con lector de pantalla | Medio | Comprobar con VoiceOver y NVDA el anillo de `GSelect` |
| G. Rendimiento | No verificable | Sin medir con la lista larga de `GSelect` | Medio | Reutilizar la lección de `glide.js`: leer cajas antes de escribir |
| H. Inmersión | N/A | No aplica | — | — |

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos**
- Tabla por tipo de pieza, con diferencias por componente, excepciones, decisiones y compuerta.
- Medido en tres motores, con y sin reducido: `GSelect`, `GMenu`, `GHelper`, `GDatePicker`, `GCombobox`, `GTooltip`, y el recorrido de las tres listas.

**Correcciones a la revisión anterior**
- `GCombobox` no incumple la regla de la luz: sus fichas tienen huecos y entran por la regla 9.
- Los 720 y 960 ms sí tienen decisión (#589, #594).
- El cierre de `GMenu`, `GSelect` y `GDatePicker` solo se funde en Chromium: en Firefox y WebKit es instantáneo.

**Pendientes y no verificado**
- `GDialog`: el banco no lo abrió; sus valores vienen del CSS. `GFilterBar`, hojas móviles, `GToast`, isla y plegados: CSS y contratos, sin medir aquí.
- Las medidas son de navegadores de Playwright, no de Safari ni Firefox instalados; sin móvil real.
- Peso del cambio sin medir: la luz de `GSelect` está en el principal, con el margen agotado.
