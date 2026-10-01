# Declaración de cumplimiento · GToast · r01

**Estado:** en revisión. Fuente de verdad: `brief.md` de esta ronda (escrito por kiwi: el usuario eligió el componente sin brief; lo marcado **[propuesta]** allí y aquí se asume si el usuario no dice lo contrario).
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises, iconos solo Lucide (`design/lab/lucide-icons.js`).
**Siguiente dueño:** lima → `design/contracts/toast.md` (y una nota en `dialog.md`, hallazgo 5).
**Prototipo:** `index.html` (6 secciones; el gestor está implementado en JavaScript simple con la API propuesta para poder probar el comportamiento).
**Convención:** «propuesta kiwi pendiente de visto bueno» = recomendación que se asume si el usuario no responde. Los valores de color, sombra, radio, duración y curva del prototipo son de wireframe, **no** propuestas.

## 1. Decisión estructural

| # | Pregunta | Decisión | Fundamento |
| --- | --- | --- | --- |
| 1.1 | ¿API imperativa o declarativa? | **Imperativa** sobre un gestor que crea la aplicación: `createToaster(options)` devuelve el gestor (también es plugin de Vue: `app.use(toaster)` lo provee); `useToast()` lo inyecta en cualquier componente; `<GToaster />` lo pinta **una vez**. **Sin componente `<GToast>` declarativo en v0.1** | Un aviso nace de un evento (guardar, fallar), no de un estado de la vista; un `<GToast v-model>` en cada sitio crearía regiones o montajes dispersos y rompería la región única. **Sin global de Grana**: la instancia es de la aplicación, que puede importarla también fuera de componentes (interceptor, guardia del router) |
| 1.2 | ¿Cuántas regiones? | **Una por gestor, permanente**: se monta con `GToaster` (antes de cualquier aviso) y no se desmonta mientras la app vive. Dentro: **dos canales vivos** vacíos (`role="status"` cortés y `role="alert"` enérgico) y la lista visible. Dos `GToaster` del mismo gestor → aviso en desarrollo | APG y WCAG 4.1.3: una región viva solo se anuncia si existe antes del cambio (precedentes #14, #137) |
| 1.3 | ¿Lo que se anuncia es la lista visible? | **No.** La lista visible **no** es viva; se anuncia un texto compuesto en el canal: `tipo: título. descripción. [N veces.] [pista de la acción]`. Se limpia y se vuelve a escribir (permite repetir el mismo texto) y se vacía poco después | Si la lista fuera viva se leerían los nombres de los botones («Deshacer Cerrar notificación») y los cambios de orden de la pila |
| 1.4 | ¿Capa? | La raíz es un **`popover="manual"` siempre abierto** (capa superior), como `GSelect` (#55) y `GHelper` (#101): ningún `overflow`, `z-index` ni cabecera fija la tapa | |
| 1.5 | ¿Y con un `<dialog>` modal? | La raíz **se traslada al modal superior** mientras está abierto (y se vuelve a mostrar como popover para quedar encima) y **vuelve a `body`** al cerrarse. Detecta cualquier `<dialog>` modal (atributo `open` + `:modal`), no solo `GDialog` | **Verificado:** con `showModal()` un popover fuera del diálogo, aunque se abra después, queda **inerte y fuera del árbol de accesibilidad** (no se anuncia ni se puede pulsar). Trasladado dentro, se anuncia y se pulsa (§14) |
| 1.6 | ¿Usa `utils/anchor.js`? | **No.** Un toast se coloca respecto al **visor**, no a un elemento; las posiciones son CSS lógico | #102 es para contenido anclado a un disparador |

## 2. Anatomía

Orden del DOM = orden de lectura y de foco.

| # | Parte | Obligatoria | Nota |
| --- | --- | --- | --- |
| 1 | Raíz `GToaster` (`popover="manual"`, abierta siempre) | Sí | Sin rol. `pointer-events` solo en los avisos: no bloquea la página en los huecos |
| 2 | Canal cortés `role="status"` (`aria-live="polite"`, `aria-atomic="true"`) | Sí | Texto oculto; existe desde el montaje |
| 3 | Canal enérgico `role="alert"` (`aria-atomic="true"`) | Sí | Texto oculto; existe desde el montaje |
| 4 | Región `section` con nombre (`labels.region`, p. ej. «Notificaciones (F8)») y `aria-keyshortcuts` | Sí, **solo con avisos** | Punto de referencia para navegar; oculto cuando está vacío para no dejar un hito vacío |
| 5 | Lista `ol` › `li` por aviso | Sí | El más reciente junto al borde (abajo: último; arriba: primero) |
| 6 | Icono de tipo (`GIcon`, `aria-hidden`) | Según tipo | `neutral` no lleva |
| 7 | Título (`p`) con prefijo oculto del tipo («Error: ») | **Sí** | Sin título → aviso en desarrollo y no se muestra |
| 8 | Contador de repetidos (`GBadge` contador + texto oculto `labels.repeated`) | No | Solo si se repite (§7) |
| 9 | Descripción | No | Se ajusta en varias líneas; **nunca se recorta** |
| 10 | Acción (`GBtn`) | No, **máx. 1** | Antes del cierre |
| 11 | Cerrar (`GBtn icon`, `x`) | **Sí, siempre visible** | `aria-label` = `labels.close`, `aria-describedby` = título + descripción |
| 12 | Texto de cola («3 más en espera», `labels.queued`) | Si hay cola | Texto, no vivo |

## 3. Tipos y canal

| `type` | Color (`color`) | Icono Lucide | Canal | Autocierre |
| --- | --- | --- | --- | --- |
| `neutral` (defecto) | `neutral` | — | cortés | sí |
| `info` | `info` | `info` | cortés | sí |
| `success` | `success` | `circle-check` | cortés | sí |
| `warning` | `warning` | `triangle-alert` | cortés | sí |
| `error` | **`danger`** (precedente #133) | `circle-alert` | **enérgico** | **no** |
| `loading` (lo pone `promise()`) | `neutral` | `loader-circle` (gira) | cortés | **no** hasta resolverse; `aria-busy="true"` |

No solo color (1.4.1): el tipo se distingue por la **forma del icono** y por el **prefijo de texto** oculto (y anunciado). `politeness` por aviso (`polite` | `assertive`) permite subir un `warning` a enérgico; bajar un `error` a cortés no se impide pero avisa en desarrollo **[propuesta]**.

## 4. Duración y pausa (WCAG 2.2.1)

1. **Duración por longitud** por defecto (tiempo de lectura con mínimo y máximo); `duration` en ms o `Infinity` por aviso. Los números del prototipo (5 s a 12 s) son de wireframe; el criterio («por longitud, con suelo y techo») es la propuesta.
2. **Sin autocierre**: `error`, `loading` y **cualquier aviso con acción**.
3. **Pausa de todos los avisos** mientras: el puntero está sobre la pila, el foco está dentro, la pestaña está oculta (`visibilitychange`) o hay un dedo apoyado (deslizar). Al reanudar se conserva **el tiempo que quedaba** (mínimo 1 s), no se reinicia.
4. **Preferencia del usuario**: `autoClose: false` en el gestor (cambiable en vivo con `configure`) desactiva todo autocierre; la aplicación puede exponerlo como ajuste («Mantener las notificaciones hasta cerrarlas»). Es la vía «desactivar» de 2.2.1.
5. **Regla de uso**: nada imprescindible solo en un toast (brief).

## 5. Acciones y foco

- **Máximo una acción + cerrar.** Más de una → aviso en desarrollo; para decidir entre opciones se usa `GDialog`. La acción ejecuta su `onClick` y **cierra** el aviso (`dismiss` con motivo `action`).
- **Nunca roba el foco**: ni al aparecer, ni al actualizarse, ni con el modal abierto (verificado).
- **Atajo para llegar**: `hotkey` (propuesta **F8**, configurable) lleva el foco a la acción del aviso **más reciente** (o a su cierre); vuelve a pulsarse → el foco vuelve a donde estaba. Se anuncia en la pista de la acción (`labels.actionHint`, «Pulsa {hotkey} para {action}.») y en el nombre de la región. **No F6**: el navegador lo usa para moverse entre la página y la barra de direcciones. Sin avisos, el atajo no hace nada (no se intercepta).
- **Tab**: dentro de un aviso, acción → cerrar → siguiente aviso. La región está al final del DOM del anfitrión, así que también se llega tabulando.
- **Esc** con el foco en un aviso: lo cierra **y detiene la propagación** (no cierra el `GDialog` anfitrión). Esc fuera de un aviso no hace nada con los avisos.
- **Foco tras cerrar** (cerrar, Esc, acción): al cierre del aviso vecino si queda alguno; si no, al elemento donde estaba antes de entrar (guardado al entrar con el atajo o con Tab); si ya no existe o es inerte, al primer control del anfitrión.

## 6. Apilado, límite y cola

- Pila **desplegada** (sin montón 3D que se abre con hover: sería contenido que aparece al pasar, 1.4.13).
- `limit` visible (propuesta 3 en escritorio, **1 en móvil**, como la regla de un snackbar a la vez de Material). El resto, **en cola FIFO**; un `error` se adelanta en la cola (no expulsa a nadie).
- Un aviso en cola **se anuncia cuando se hace visible**, no antes (el usuario de lector puede encontrarlo).
- Orden visual = orden del DOM (el más reciente junto al borde).

## 7. Deduplicación y actualización

- Con `id`: `show({ id })` de un `id` existente **actualiza en su sitio** (`update(id, patch)`); así funciona `promise()`.
- Sin `id`: mismo `type` + `title` + `description` visible o en cola → **no se duplica**: sube el contador (visible con `GBadge`, oculto «3 veces»), **reinicia** su tiempo y **se vuelve a anunciar** (el usuario repitió la acción y necesita confirmación).
- Actualizar un aviso con el foco dentro conserva el foco en el control equivalente.

## 8. Promesa

`toaster.promise(p, { loading, success, error })` (cada uno texto, objeto o función del valor/error): un solo aviso `loading` (cortés, sin autocierre) que pasa **en su sitio** a `success` (cortés, con autocierre) o a `error` (enérgico, sin autocierre). Devuelve la misma promesa. Cerrar el aviso en `loading` solo lo oculta: la promesa sigue (**[propuesta]**; el resultado no vuelve a mostrarlo).

## 9. Posición, RTL, móvil y `safe-area`

- `position`: `top-start` `top-center` `top-end` `bottom-start` `bottom-center` `bottom-end` (defecto **`bottom-end`** **[propuesta]**). `start`/`end` lógicos: se invierten en RTL (verificado).
- **Móvil** (visor < `space × 130`, el umbral de hoja de `GDialog`, #103): siempre **abajo, ancho completo** menos un margen; un aviso a la vez; la acción baja bajo el texto. Consulta de medios literal **o** medida del visor: la misma excepción que #42/#56.
- **`safe-area`**: márgenes con `max(margen, env(safe-area-inset-*))` (requiere `viewport-fit=cover` en la app).
- **`offset`** (`{ top, bottom }` en el gestor): la app reserva su barra inferior o cabecera fija; verificado con una barra de 56px.
- **Deslizar para cerrar** (`swipe`, defecto activo **[propuesta]**): solo táctil/lápiz, horizontal, `touch-action: pan-y` (no roba el desplazamiento vertical); umbral por distancia o velocidad, si no vuelve a su sitio. **Alternativa no gestual siempre presente**: el botón cerrar (2.5.1).
- **Teclado virtual**: no verificado (§15).

## 10. No tapar el foco ni los controles (2.4.11 / 2.4.12)

- Si el elemento enfocado (fuera de la región) queda **bajo la pila**, la región pasa al **borde vertical contrario** mientras siga así; vuelve cuando el foco se mueve a otra cosa. Verificado: un campo al pie del visor queda descubierto en sus cuatro esquinas. Cumple 2.4.11 y, en el caso probado, 2.4.12.
- La raíz no captura el puntero fuera de los avisos; la cola y el ancho máximo limitan la superficie tapada.
- Con el foco **dentro** de la región no se mueve (no se desplaza bajo el usuario).

## 11. Movimiento

Entrada: desplazamiento corto desde el borde + fundido; salida: fundido (y desplazamiento lateral si se deslizó); recolocación de la pila con transición. **`prefers-reduced-motion: reduce`**: solo fundido, sin desplazamiento ni giro del `loader-circle` (verificado con `emulateMedia`). Duraciones y curvas: tokens existentes `--g-duration-*`/`--g-ease-*` (#71); coco decide.

## 12. Qué reutiliza y qué no

| Reutiliza | Para |
| --- | --- |
| `GBtn` | Acción (`sm`) y cierre (`icon`, `aria-label`) |
| `GIcon` | `info`, `circle-check`, `triangle-alert`, `circle-alert`, `loader-circle`, `x` (todos ya en `icons.md` y `lucide-icons.js`) |
| `GBadge` | Contador de repetidos (modo `count`, sin anuncio propio, #59) |
| Patrón de `GHelper`/`GSelect` | `popover="manual"` en capa superior |
| Patrón de `GCard`/`GBtn` | Región viva presente antes; `alert` solo para lo que aparece después del montaje |
| Umbral de `GDialog` | `space × 130` para móvil |

| No usa / no hace | Razón |
| --- | --- |
| `utils/anchor.js` | Sin ancla (1.6) |
| `GProgress` como cuenta atrás | Una barra que corre presiona y no aporta: el tiempo se pausa y los críticos no caducan **[propuesta]** |
| `GMenu` dentro de un aviso | Máximo una acción |
| `GSurface` | Coco decide si la superficie del aviso es una `GSurface level="floating"`; estructuralmente es compatible |

## 13. Hallazgos para lima (API y tokens, sin valores)

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| 1 | Entrega | Alta | `createToaster(options)` → gestor + plugin; `useToast()`; `<GToaster :toaster?>` (por defecto el inyectado). Gestor: `show(opts) → id`, `info/success/warning/error(title, opts)`, `promise(p, { loading, success, error })`, `update(id, patch)`, `dismiss(id?)`, `clear()`, `configure(patch)`. **Sin instancia global en Grana** |
| 2 | Opciones del gestor | Alta | `position` (6 valores), `limit`, `mobileLimit`, `hotkey`, `autoClose` (Boolean), `swipe`, `offset` (`{ top, bottom }`), `labels` |
| 3 | Opciones del aviso | Alta | `id`, `type` (`neutral` `info` `success` `warning` `error`), `title` (obligatorio), `description`, `action` (`{ label, onClick }`), `duration` (`auto` · ms · `Infinity`), `politeness`, `onDismiss(reason)` con `reason` ∈ `timeout` `close` `escape` `swipe` `action` `api`. **Solo texto** en v0.1 (sin VNodes ni slots) |
| 4 | Textos sin valores por defecto | Alta | `labels.region` (con `{hotkey}`), `labels.close`, `labels.types.{info,success,warning,error,loading}`, `labels.repeated` (`{count}`), `labels.queued` (`{count}`), `labels.actionHint` (`{action}`, `{hotkey}`); plantillas con `utils/template.js` (`fill`). Aviso en desarrollo si falta `region`, `close` o el del tipo usado |
| 5 | **Convivencia con modal** | Alta | La región sigue al `<dialog>` modal superior (observa `open` en el documento). Nota en `dialog.md`: **el Esc de un aviso no debe llegar al manejador de `GDialog`** (el aviso detiene la propagación; verificar que `GDialog` no escucha en captura). Sin cambios de API en `GDialog` |
| 6 | Avisos de desarrollo | Media | Sin título; más de una acción; dos `GToaster` para un gestor; `useToast()` sin gestor instalado; `error` con `politeness: 'polite'`; descripción muy larga (umbral de lima) |
| 7 | Detección de móvil | Media | Umbral `space × 130` medido en el visor (excepción vigente #42/#56/#103) |
| 8 | Tokens (sin valores) | Media | **Reutilizar**: superficie flotante (`--g-shadow-*`, borde, radio), semánticos `{info,success,warning,danger}` en `-text`/`-soft` para icono y marca, `--g-color-neutral*`, tipografía cuerpo/caption, foco, `--g-duration-*`/`--g-ease-*`, `--g-space-*`. **Necesidades**: ancho máximo del aviso (derivado de `space`, como #46), separación entre avisos y margen al borde (de `space`); posiblemente ningún token nuevo (`tokens.md` §17.6). La marca de tipo distinta a la del color (borde de inicio, icono) la decide coco |
| 9 | Iconos | Baja | Todos existentes en `icons.md`; añadir la fila `GToast` a la tabla §4 |
| 10 | Contraste | Alta (coco) | Texto 4.5:1 y borde/icono 3:1 sobre la superficie flotante en claro y oscuro; `forced-colors` (borde visible); texto de cola sobre la página (en móvil queda fuera de la tarjeta) |
| 11 | Eventos | Media | Imperativo: callbacks en las opciones; `GToaster` no emite eventos públicos **[propuesta]** |

## 14. Comprobaciones ejecutadas

Playwright (Chromium, `file://`), script fuera del repositorio, **69 comprobaciones, todas correctas**, consola sin errores ni avisos:

- **Región única:** 1 raíz, 2 canales (`status`/`polite` y `alert`), 0 regiones vivas fuera; abierta como popover en `body` y expuesta en el árbol de accesibilidad (CDP `Accessibility.getFullAXTree`) **antes** del primer aviso.
- **Anuncios:** `success` → «Correcto: Cambios guardados.» en cortés; `error` → enérgico; con acción incluye «Pulsa F8 para Deshacer.»; repetido «3 veces»; promesa «En curso: …» → «Correcto: Informe subido. informe.pdf» o error enérgico; un aviso en cola se anuncia al hacerse visible.
- **No roba el foco** al aparecer (página y modal).
- **Pausa:** con el puntero encima, con el foco dentro y con `visibilityState = hidden` sigue visible pasado su tiempo; al terminar reanuda con lo que quedaba y se cierra. Error, acción y preferencia «no cerrar solos» → `Infinity`.
- **Teclado:** F8 → acción del más reciente; Tab → cerrar (nombre + descripción); F8 → vuelve; Esc cierra y devuelve el foco; Enter en la acción la ejecuta y cierra; F8 sin avisos no hace nada.
- **Cola:** 6 → 3 visibles + 3 en cola con texto; cerrar promueve; un error se adelanta; orden DOM = orden visual.
- **Deduplicación:** 3 iguales → 1 aviso con contador 3.
- **Modal:** al abrir, la región pasa al diálogo y sigue abierta; el aviso está en el árbol de accesibilidad (no inerte) y se puede pulsar; F8 llega a la acción; Esc en el aviso no cierra el diálogo y el foco vuelve al botón; Esc fuera sí lo cierra; al cerrar, la región vuelve a `body` con el aviso pendiente. Experimento previo: **sin traslado**, el popover queda fuera del árbol y el clic no llega (inerte), aunque se re-muestre después del modal.
- **Foco tapado:** campo al pie del visor bajo la pila → la región pasa arriba y las 4 esquinas del campo son alcanzables (`elementFromPoint`); al enfocar otra cosa vuelve abajo.
- **Posiciones:** las 6 en 1280×800; RTL `bottom-end` a la izquierda; `offset` de 56px respetado.
- **Movimiento reducido:** sin `transform`, transición solo de `opacity`, sin giro.
- **Deslizar:** arrastre táctil horizontal largo cierra; corto y lento vuelve; `touch-action: pan-y`.
- **Objetivos:** ≥ 24px; ≥ 44px en modo táctil.
- **320×640:** `data-mobile`, abajo, de 8 a 312px, sin desborde (`scrollWidth` 320), acción bajo el texto, un visible y el resto en cola.
- `check-icons.mjs`: 0 infracciones.

## 15. Qué NO verifiqué

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): que el canal se lea al escribir tras limpiarlo, que el `alert` interrumpa, que el traslado de la región al modal **no repita** lo que ya había ni pierda el siguiente anuncio (solo comprobé que sigue en el árbol), el retardo de vaciado del canal (5 s en el prototipo) y la duplicación al recorrer con el cursor virtual. **Riesgo principal de la ronda.**
- **Firefox y WebKit/Safari:** `popover`, `:modal`, traslado y re-apertura del popover, `env(safe-area-inset-*)`. Solo Chromium.
- **Táctil real**: deslizar con inercia, conflicto con el gesto «atrás» del sistema en los bordes, objetivos con dedo; **teclado virtual** (el aviso abajo puede quedar bajo el teclado; `visualViewport` no se usa todavía).
- **`forced-colors`** y `prefers-contrast` reales.
- Varios modales apilados (solo uno); `GDialog` real (el prototipo imita su Esc); un `GMenu` abierto encima de un aviso.
- Zoom al 200 % y texto grande (reflujo de la acción).
- Rendimiento del `MutationObserver` de documento en apps grandes (filtrado a `open`).
- 2.4.12 en general (solo el caso del campo al pie).

## 16. Preguntas de producto realmente abiertas

1. **¿Historial o bandeja de notificaciones?** Un aviso que se cerró solo no se puede recuperar. Con la pausa, la preferencia `autoClose` y la regla «nada imprescindible solo en un toast» se cumple 2.2.1, pero muchas apps quieren «ver avisos recientes». **Recomendación:** fuera de v0.1; si entra, componente propio que lea del mismo gestor.
2. **¿Contenido enriquecido** (enlace en la descripción, avatar, slot)? v0.1 es solo texto, lo que garantiza el anuncio y evita interactivos anidados. **Recomendación:** solo texto en v0.1.

Sin pregunta (propuestas kiwi pendientes de visto bueno): API imperativa sin componente declarativo; F8 como atajo; `bottom-end` por defecto; límite 3 (1 en móvil); deslizar activo por defecto; `error` sin autocierre y enérgico; duración por longitud; cerrar un `loading` no cancela la promesa; sin barra de cuenta atrás; repetidos que se vuelven a anunciar.
