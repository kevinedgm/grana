# Declaración — operación en curso sobre una superficie (nombre de trabajo `GBusy`), r01: auditoría, base funcional y conceptos A, B y C

> kiwi, 2026-10-14. Entrada: la propuesta del usuario de `spinner` + `loading-indicator` + `loading-overlay` (prefijo `nn-`), tomada como **entrada a cuestionar**. Prototipo: `index.html` (`?theme=dark`, `?dir=rtl`, `?motion=reduce`), motor del laboratorio `busy.js`, CSS `busy.css`, con los **tokens reales del tema por defecto** (`packages/vue/dist/grana.css`) y el marcado real de `GBtn`, `GInput`, `GSurface` y `GDialog`. Iconos solo Lucide vía `design/lab/lucide-icons.js`. Verificación: `node design/lab/busy/r01/verificar.mjs` (puerto 4214), cifras en «Comprobaciones». La base deriva de WAI-ARIA (`aria-busy`, `inert`, `dialog` modal, regiones vivas), WCAG 2.2 (1.3.1, 1.4.1, 1.4.3, 1.4.11, 2.1.1, 2.2.2, 2.4.3, 2.4.7, 2.4.11, 4.1.2, 4.1.3), del lenguaje de movimiento (#299, #539) y de los contratos vigentes (`load-region.md`, `dialog.md`, `btn.md`, `api.md`); **la única pregunta de producto es la elección de concepto**.

## 1. Auditoría de solapamiento (antes de diseñar)

### Lo que ya existe y toca esto

| Pieza existente | Qué hace hoy | Relación con la propuesta | Decisión |
| --- | --- | --- | --- |
| `GLoadRegion` + motor `loadPhase.js` (#529 a #559) | Contenido que **llega** a una región: molde, lo último conocido, 200/400/5000 ms, foco por clave, canal cortés de página | Su refresco `keep` (lo de antes inerte, con filo y «Actualizando») **ya es** la «capa de card» de la propuesta para una **lectura** («Actualizando datos») | **Frontera:** lectura → `GLoadRegion`; escritura u operación lanzada por la persona → la pieza nueva. **Se reutiliza** el motor tal cual (constantes, `createLoadPhase`) y el canal de página |
| `GEmpty` | El vacío como contenido, con causa | Ninguna: una operación no deja vacío | Sin cambio |
| `liveRegion.js` (canal de página, #533) | Un canal cortés por documento, fusión en el ciclo de 50 ms, sin repetir idénticos, traslado al modal superior | Es el «mensaje de estado accesible» de la propuesta | **Se reutiliza** sin cambios |
| `topModal.js` | Saber cuál es el modal superior | El canal se traslada dentro del diálogo; la pantalla completa es un modal | **Se reutiliza** |
| `GBtn loading` + `loadingText` (#14, #17, plan 015) | Giro en el control, `aria-disabled` sin perder el foco, región `role="status"` propia | Es el escenario 01 «inline» | **Ya existe.** B y C lo usan tal cual; A propone que, **dentro** de la pieza nueva, el disparador no gire (L6). Regla: una operación, una voz (no `loadingText` en el disparador si la pieza anuncia) |
| `GInput`/`GTextarea`/`GSelect`/`GSwitch`/`GCombobox` `loading` | Giro que **no bloquea** | Controles que esperan, no superficies | Sin cambio |
| `GDialog loading` (`dialog.md`) | `aria-busy` + un pulso infinito; **no bloquea nada** | Es lectura («cargando el detalle al abrir»). La propuesta 03 es **escritura** dentro del diálogo | `loading` no cambia (su pulso ya va a finito por #539). La integración con la pieza nueva es un **contexto interno** de retención del cierre (L3), no una prop |
| `GProgress` (solo determinado) | `progressbar` con valor | «Barra solo si hay avance real» | **Se reutiliza** dentro de la capa solo con `value`; sin modo indeterminado (no se inventa) |
| Isla de estado (`@grana/vue/status`) | Condiciones que duran; fallo al guardar; acción con `busy` | Donde va el **error** de la operación cuando afecta a la página | Frontera: la capa nunca anuncia el error. La isla no tiene `type: loading` y está bien (#318: «cargando» no es una condición que dura) |
| `GToast` | Resultado de una acción | Donde va el **éxito** («Cambios guardados») | La capa no anuncia el resultado |
| `GForm` (`readonly`, `disabled`, `submit`) | Sin estado «enviando» | B se apoya en el aspecto de solo lectura de `GInput` (#165) | Reservado: una integración de `GForm` (L10) |
| `GCard`, `GWidget`, `GCalendar` `loading` y la **segunda entrega de la carga** (`PENDIENTES.md`) | Carga de contenido de anfitriones | Lectura, no operación | Sin solape con esta ronda; la segunda entrega sigue su curso |
| `edgeReserve.js` (voz → isla → avisos) | Reserva del borde del visor | B a pantalla completa pinta una banda en el borde superior | La banda vive en un modal en la capa superior (encima de todo, transitoria): **no reserva borde** |
| Capas | No hay tokens de `z-index` en Grana; lo flotante va en la **capa superior** (`<dialog>`, `popover`) | La propuesta pedía `zIndex` por tokens de capas | **Sobra** (ver abajo) |
| Giros privados | 15 componentes con su `g-*-spin` de `loader-circle`, `--g-duration-spin`, ×2,5 con movimiento reducido | La propuesta pedía un `spinner` público | No hace falta un componente (L7) |

### Qué de la propuesta sobra o cambia

1. **`spinner` como componente público: sobra en v1.** El giro ya existe 15 veces con el mismo icono (`loader-circle`), el mismo token (`--g-duration-spin`) y la misma regla de movimiento reducido. Lo que falta es que **la aplicación** pueda poner uno en su plantilla: basta un `spin` en el `GIcon` público (L7), no otra primitiva. `size` = el `1em` de `GIcon`; `color` = `currentColor`; **`speed` sobra** (es tema, `--g-duration-spin`, y por instancia rompería la coherencia); `label` = el de `GIcon` (pero un giro con nombre no es un mensaje de estado: el anuncio va por el canal).
2. **`loading-indicator`: de acuerdo en que no sea público.** Es la anatomía interna de la capa (nombre, descripción, etapas, avance real, cancelar).
3. **`loading-overlay`: se queda, pero no como «velo + indicador centrado»** (ver conceptos), y con otra frontera: es para **operaciones** (escrituras, procesos), no para **cargas** (eso es `GLoadRegion`).
4. **`scope` sobra como enum.** El alcance lo da **dónde se pone**: alrededor de una superficie → esa superficie; dentro de un `GDialog` → el diálogo (por contexto); `fullscreen` → la aplicación. Queda solo `fullscreen` (Boolean).
5. **`blocking` sobra.** Una operación en curso sobre una superficie **siempre** bloquea esa superficie (si no bloquea, no hace falta la pieza: basta `GBtn loading`).
6. **`backdrop` (transparente / atenuado / difuminado) sobra.** Atenuar baja el contraste de lo que la persona acaba de escribir y difuminar lo esconde; ninguno de los tres conceptos lo usa en una superficie. Solo C a pantalla completa usa el fondo de modal existente (`--g-surface-backdrop`).
7. **`placement` sobra.** Cada concepto fija dónde vive su capa (borde, fila de acciones, zona de acciones).
8. **`zIndex` sobra.** En una superficie la capa vive **dentro** de ella (no compite con nada de fuera ni se recorta: es suya); a pantalla completa vive en la **capa superior** (`showModal()`), por encima de todo sin números. Grana no tiene tokens de `z-index` y no debe tenerlos.
9. **Escenario 02 «Actualizando datos» cambia** a «Guardando cambios»: actualizar datos es lectura (`GLoadRegion`, #540).
10. **Escenario 04 «Cargando aplicación» cambia** a «Cambiando a Laboratorio Norte»: la carga inicial ocurre **antes** de que Vue monte, así que ningún componente la puede pintar (es HTML y CSS de la página de la aplicación; receta para el README, L12). Lo que sí bloquea una aplicación montada: cambiar de espacio, cerrar sesión, restaurar una copia.
11. **Se mantienen de la propuesta:** `aria-busy` en lo afectado; mensaje de estado accesible; nada de porcentajes inventados; retirar la capa al terminar aunque falle y comunicar el error aparte; integrar con `GDialog` sin crear otro; no recortarse ni romper el responsive; reduced motion. Y la regla arquitectónica, matizada: **el indicador comunica actividad; la pieza decide qué queda bloqueado y dónde va el foco.**

### Cuántas piezas

**Una pieza nueva** (nombre de trabajo **`GBusy`**, `g-busy`; L1) + un **contexto interno** en `GDialog` para retener el cierre + (opcional, L7) `spin` en `GIcon`. Nada más.

## 2. Anatomía (base, común a A, B y C)

```
p.g-load-live  aria-live="polite" aria-atomic="true"             ← canal de página existente (liveRegion.js); en el modal superior si lo hay

[superficie de la aplicación: tarjeta, sección, fila]
div.g-busy  [is-busy is-pending is-slow]                           ← envuelve lo que se bloquea (o, en un GDialog, pide al diálogo que lo bloquee)
├─ …contenido de la aplicación…  aria-busy="true|false"           ← lo afectado; inert en todo salvo el camino al disparador con foco
│   └─ GBtn (disparador)  aria-disabled="true"                     ← conserva el foco (#17); Esc = cancelar
└─ div.g-busy__status  role="group" aria-labelledby tabindex="-1" ← la capa (forma según A/B/C); recibe el foco si hace falta
   ├─ texto: label (· etapa)                                       ← lo mismo que se anuncia
   ├─ [GProgress]  solo con value/max                              ← avance real; nunca inventado
   └─ [Cancelar]  solo con cancelable                              ← único control vivo además del disparador

Pantalla completa
dialog.g-busy--fullscreen  (showModal: capa superior, resto inerte nativo)  aria-labelledby="{texto}"
└─ div.g-busy__status  role="group" tabindex="-1"                  ← recibe el foco; Esc = cancelar o nada
```

## 3. Decisiones de la base

**Frontera y alcance**

1. **Lectura frente a escritura.** Prueba de una línea: *¿lo que hay a la vista es la **entrada** de la operación o su **resultado**?* Entrada (lo que se guarda, se publica, se procesa) → `GBusy`. Resultado (lo que llega) → `GLoadRegion` o el `loading` del anfitrión. Un control que espera sin bloquear nada más → `GBtn`/`GInput` `loading`.
2. **El alcance lo da la posición** (sin `scope`): la pieza bloquea **lo que envuelve**; dentro de un `GDialog` bloquea **el diálogo entero** (cabecera con «Cerrar» incluida) por contexto; con `fullscreen`, **la aplicación** con un modal propio.

**Bloqueo**

3. **Bloqueo real desde el primer instante** (0 ms, antes del retraso de 200 ms): `inert` en todo lo cubierto (puntero, teclado, búsqueda en la página y tecnologías de apoyo), **nunca** solo `pointer-events`. Medido: un clic en un campo durante la operación no lo enfoca; Tab no entra en el contenido; un segundo clic en «Guardar» no lanza otra operación. **Un clic sobre lo bloqueado no mueve el foco:** el navegador no puede enfocar lo inerte, pero sí quitarle el foco a quien lo tenía (cae en `body`); la pieza previene el `mousedown` sobre toda su superficie, disparador incluido (en WebKit un clic en un botón le quita el foco), salvo en «Cancelar» (medido en los tres motores: el foco sigue en el disparador o en la capa tras el clic). Hallazgo de esta ronda: sin esto, C perdía el foco en `body` con un clic.
4. **El disparador conserva el foco.** Si el foco está en el botón que lanzó la operación, ese botón **no** queda inerte: `inert` va en los hermanos de cada nivel de su camino hasta la raíz, y el botón lleva `aria-disabled="true"` (la regla de `GBtn`, #17: deshabilitar un botón enfocado pierde el foco). Excepción: en C la hoja tapa la zona de acciones, así que el foco pasa a la hoja (2.4.11, foco no oculto).
5. **`aria-busy="true"` en lo afectado** (el contenido que puede cambiar), nunca en la capa; `false` al terminar. `aria-busy` no anuncia nada (4.1.3): solo pide a las tecnologías que lo respetan que no lean contenido a medias. A pantalla completa no hace falta fuera del modal: el resto es inerte y sale del árbol de accesibilidad (el laboratorio lo pone en `#lab` solo para comprobarlo; el componente no toca elementos de la aplicación fuera de sí).
6. **Popovers abiertos dentro** (un `GMenu` de la tarjeta) se cierran al bloquear: `inert` los saca del teclado, pero su panel en la capa superior seguiría a la vista (L11).

**Tiempos (motor existente, sin cambios)**

7. **200 ms antes de enseñar nada; 400 ms mínimos a la vista; 5 s de espera larga** (`DELAY`, `MINIMUM`, `SLOW` de `loadPhase.js`). Durante los 200 ms la superficie **ya está bloqueada** pero no se ve ni se oye nada: una operación de 100 ms no parpadea ni habla (medido: 0 indicadores, 0 anuncios). Si se vio, se queda ≥ 400 ms (medido).

**Anuncios (una operación, una voz)**

8. **Por el canal de página**, nunca por una región propia de la capa (la capa vive dentro de lo que podría estar `aria-busy`; el canal está fuera, medido) y nunca `assertive`.
   - **Al verse (200 ms):** `label` («Guardando cambios»), **salvo** si el foco se movió a la capa: el foco ya lee su nombre y no se repite (medido en C y con Intro en un campo).
   - **A los 5 s, una vez:** `labels.slow` + la etapa actual si hay etapas («Sigue guardando. Tarda más de lo normal. Avisando al equipo.»).
   - **Al terminar: nada.** El resultado es de su dueño: éxito → `GToast`; error de campos → `GForm`; fallo que afecta a la página → la isla. La capa no lo repite (medido: 0 anuncios de la capa al terminar, bien o mal).
   - Las etapas **no** se anuncian una a una (serían ruido); cuentan en el texto visible y en el anuncio de los 5 s.
   - Si el disparador lleva `loadingText` dentro de una `GBusy` activa, se oirían dos voces: aviso de desarrollo (L6).

**Foco**

9. **Foco fuera:** no se toca (medido). **En el disparador:** se queda (A, B). **En otro sitio dentro** (Intro en un campo): pasa a la capa (`role="group"` con nombre, `tabindex="-1"`, `preventScroll`), nunca a `body` (medido). **C y pantalla completa:** a la capa.
10. **Al terminar**, si el foco está en la capa o cayó en `body`: vuelve **al elemento que lo tenía** si sigue existiendo y es enfocable (medido: al campo tras Intro, al disparador tras un clic); si no, al encabezado de la superficie (`tabindex="-1"`). Si la persona lo movió fuera durante la operación, no se toca. Si el error lo enfoca `GForm` (primer campo con error), gana `GForm`: la capa se libera antes (mismo ciclo) y no lo pisa.

**Cancelar, terminar, fallar**

11. **Cancelar** solo si la operación lo permite (`cancelable`): «Cancelar» dentro de la capa (el único control vivo además del disparador) y **Esc** con el foco dentro. Emite `cancel`; la capa dice «Cancelando…» hasta que la aplicación ponga `active` a `false` (la petición la aborta la aplicación; Grana no hace `fetch`). Sin `cancelable`, Esc no hace nada dentro de una superficie y no cierra el diálogo (medido).
12. **Se retira siempre** que `active` pasa a `false`, bien, mal o cancelada; y al desmontarse con `active` puesto (inert, `aria-busy` y retención del diálogo se deshacen). Medido: 0 elementos inertes tras un fallo.
13. **Sin porcentajes inventados.** Indeterminado por defecto. Con avance real (`value`/`max`), la capa lleva un `GProgress` (C) o «3 de 24» en su texto (A); nunca `progressbar` sin valor (reservado, L2).

**Diálogo y pantalla completa**

14. **Dentro de un `GDialog`, ningún diálogo nuevo** (medido: un solo `dialog[open]`). La pieza le pide al diálogo, por contexto interno, **retener el cierre**: el evento `cancel` (Esc) se previene, el fondo no cierra y «Cerrar» queda inerte. Esc = cancelar si se puede; si no, nada (medido: el diálogo sigue abierto). El canal de página ya se traslada al modal superior (medido). Al terminar bien, cierra la aplicación (`v-model`); el foco vuelve a quien abrió el diálogo (medido).
15. **Pantalla completa: un `<dialog>` modal propio, no un `GDialog`** (sin cabecera, sin cerrar, sin pasos): `showModal()` da la capa superior (encima de todo sin `z-index`), el resto inerte de forma nativa y el foco atrapado. `aria-labelledby` = el texto de la operación; el foco va a su capa (medido); Esc = cancelar o nada (medido); al terminar, el foco vuelve al disparador (medido). El desplazamiento de la página se bloquea como en `GDialog` (L12). La carga **inicial** de la aplicación no es esto (punto 10 de la auditoría).

**Movimiento, contraste, tamaño, dirección**

16. **2.2.2 se aplica distinto según el bloqueo.** En una superficie, en línea y en un diálogo, el resto de la interfaz (o al menos su lectura) sigue a la vista: **ninguna animación pasados 5 s** (#539), el texto de espera larga toma el relevo (medido: 0 animaciones a los 5,4 s). A pantalla completa **nadie puede interactuar**: es la excepción «esencial» de la guía de 2.2.2 para una fase de espera que bloquea a todos, y el indicador sigue, más lento (×2,5) (medido). Con movimiento reducido, nada recorre, gira ni sube en ningún caso: solo fundidos (medido).
17. **Nada se atenúa.** El contenido conserva su contraste (medido ≥ 4,5:1 en A y B); los indicadores ≥ 3:1 frente a la superficie y sus textos ≥ 4,5:1, en claro y oscuro (medido). En colores forzados: `Highlight`/`HighlightText`/`CanvasText` con `forced-color-adjust: none` donde haga falta.
18. **Δ0:** la operación no mueve nada (medido en A, B y C: lo de debajo de la tarjeta, 0 px durante y después; la fila en línea, 0 px).
19. **Responsive:** la capa vive dentro de su superficie y cabe en ella a 390 px; sin desplazamiento horizontal (medido). En RTL todo es lógico (medido en A: el recorrido se invierte y la pestaña cuelga del final lógico).

## 4. Estados medidos

Reposo · pendiente (bloquea, invisible) · a la vista · espera larga · cancelando · liberada (bien, falla, cancelada) · foco fuera / en el disparador / en un campo · diálogo con y sin cancelar · pantalla completa · claro y oscuro · RTL · movimiento reducido · 390 px · consola limpia.

---

## A · El contorno

**Premisa cuestionada:** «para bloquear hay que tapar». Aquí **nada se tapa ni se atenúa**: el **borde de la superficie es el indicador**. Un tramo de acento (`--g-color-accent-text`, trazo `border-width × 2`) recorre el contorno de lo que queda bloqueado, con su mismo radio, y una **pestaña** de una línea cuelga del borde superior en el final lógico («Guardando cambios», con la etapa si la hay, y «Cancelar»). El contenido sigue a la vista con su contraste completo, quieto, con el cursor `progress`.

- **En línea:** el contorno recorre **el propio botón** y su etiqueta **se queda** («Guardar» sigue legible; hoy `GBtn loading` la esconde tras el giro). La leyenda reservada debajo de la fila dice «Guardando el nombre».
- **Tarjeta:** el tramo recorre el borde de la tarjeta; la pestaña cuelga arriba al final.
- **Diálogo:** el tramo recorre el marco del diálogo; la pestaña cuelga sobre «Cerrar», que no funciona mientras guarda: la pestaña explica por qué.
- **Pantalla completa:** el tramo recorre **el marco del visor**; la aplicación sigue a la vista (sin velo), inerte; la pestaña cuelga del borde superior, centrada.

**Comportamiento.** A los 5 s el contorno **se cierra entero y se queda quieto** (la superficie queda «enmarcada») y la pestaña pasa a «Sigue guardando…». Al terminar, el contorno se funde.

**Movimiento.** Un recorrido lineal de `--g-duration-spin × 2` por vuelta (el giro de siempre, desenrollado sobre el borde), al revés en RTL. Ninguna curva nueva. Reducido: el contorno entero, quieto.

### Qué lo hace distinto (A)

Los frameworks bloquean con un velo que tapa justo lo que la persona acaba de escribir y no dice dónde acaba el bloqueo. Aquí **el bloqueo tiene un borde visible**: se ve exactamente qué está ocupado (esta tarjeta, no la página), lo de dentro sigue legible para comprobarlo, y el indicador no es un dibujo añadido en medio de los datos sino el contorno de la propia superficie. Es la misma pieza en un botón, una tarjeta, un diálogo o la ventana entera.

### Gana y arriesga

- **Gana:** cero contenido tapado; el alcance del bloqueo se ve; sirve a **cualquier** superficie (no solo formularios); la etiqueta del botón no desaparece; lo más barato de construir (un `rect` SVG medido y una pestaña); encaja con la «pestaña» de `GTooltip` (#380) como lenguaje de Grana.
- **Arriesga:** la pestaña tapa la esquina superior final (un menú o «Cerrar», inertes de todos modos); el recorrido en la periferia es más sutil que un giro en el centro (a quien no lo note le habla el anuncio, el cursor y la pestaña); en una superficie sin borde visible, el contorno aparece donde no había línea (marca el límite, que es lo que se quiere).

**Coste:** bajo.

---

## B · En firme

**Premisa cuestionada:** «mientras se guarda, el formulario desaparece bajo una capa». Aquí **lo que se envía se queda a la vista como registro**: los campos pasan al **aspecto de solo lectura real de `GInput`** (borde discontinuo, relleno neutro, texto pleno, #165) y los que cambiaron llevan una **barra de acento** al inicio. La fila de acciones dice qué pasa en el sitio de las acciones secundarias: «Guardando 2 cambios» (con los nombres de los campos en el nombre accesible de la línea) y «Cancelar»; el disparador se queda donde estaba.

- **En línea:** el campo se congela y el botón usa `GBtn loading` tal cual.
- **Tarjeta:** campos congelados, barras en lo que cambió, la línea en el pie.
- **Diálogo:** igual en el cuerpo y el pie del diálogo.
- **Pantalla completa:** una banda en el borde superior dice **el cambio**: «Cambiando de laboratorio: ~~Laboratorio Sur~~ → **Laboratorio Norte**. Lo que ves sigue siendo de Laboratorio Sur.»

**Comportamiento.** Al terminar bien, los campos **se descongelan** y la línea deja «Cambios guardados» con `circle-check` unos instantes en el mismo sitio (visual; el anuncio es del aviso). Si falla, se descongelan con sus valores intactos y el error lo pinta `GForm`.

**Movimiento.** Solo un giro pequeño y finito en la línea (se detiene a los 5 s); los cambios de aspecto son fundidos de color.

### Qué lo hace distinto (B)

En los frameworks el formulario se esconde mientras viaja y la persona no sabe si lo que mandó era lo que quería. Aquí **lo enviado se queda firme a la vista**, marcado lo que cambió, y la línea dice cuántos cambios van: se puede comprobar **durante** el envío, nada salta, y si falla, todo vuelve tal como estaba para corregir.

### Gana y arriesga

- **Gana:** la respuesta más directa a «¿qué estoy guardando?»; reutiliza el aspecto de solo lectura que ya existe; Δ0; la banda a pantalla completa dice honestamente que lo visible es lo anterior.
- **Arriesga:** sirve sobre todo a **formularios** (necesita saber qué es un campo y qué cambió: integración con `GForm`, L10); fuera de un formulario se queda en la línea del pie; el «recibo» visual al terminar convive con el aviso (dos señales de éxito, una sola voz).

**Coste:** medio (integración con el contexto de `GForm` para congelar y saber qué cambió).

---

## C · Las etapas

**Premisa cuestionada:** «la espera es un spinner que no dice nada». Aquí la espera **se narra**: una **hoja** sube desde la zona de acciones (donde estaba la acción ahora está lo que pasa) y lista las **etapas reales** que da la aplicación: «Comprobando los datos ✓ · Guardando · Avisando al equipo», con la actual marcada (`aria-current="step"`, texto en peso de acción, `loader-circle`) y las hechas con `check`. Sin etapas, una sola línea. Con avance real, un `GProgress` bajo la etapa actual.

- **En línea:** `GBtn loading` tal cual y la etapa en la leyenda reservada.
- **Tarjeta:** la hoja sube desde el pie y tapa las acciones y su borde.
- **Diálogo:** sube desde el pie del diálogo.
- **Pantalla completa:** la hoja, centrada sobre el fondo de modal (`--g-surface-backdrop`), con las etapas del cambio de espacio.

**Comportamiento.** El foco pasa a la hoja (taparía el disparador). A los 5 s, la hoja añade «Sigue guardando. Tarda más de lo normal. Avisando al equipo.»: se ve **dónde** se atascó.

**Movimiento.** La hoja sube con `--g-duration-slow` + `--g-ease-out` (una entrada, sin muelle); el giro de la etapa actual se detiene a los 5 s. Reducido: fundido.

### Qué lo hace distinto (C)

Un spinner dice «espera»; las etapas dicen **qué** y **por dónde va**, sin inventar un porcentaje. Si «Avisando al equipo» tarda, la persona lo sabe (y puede contárselo a soporte). La hoja aparece donde estaba la acción, no en medio de los datos.

### Gana y arriesga

- **Gana:** la más informativa para operaciones largas o compuestas (importar, publicar, cambiar de espacio); honesta sin números; las etapas son de la aplicación (sin texto por defecto).
- **Arriesga:** **tapa** la zona de acciones (y parte del contenido en superficies bajas); mueve el foco siempre; sin etapas es un velo parcial con una línea; la aplicación tiene que conocer y mantener sus etapas.

**Coste:** medio.

---

## 5. Comparativa

| | A · El contorno | B · En firme | C · Las etapas |
| --- | --- | --- | --- |
| Pregunta que contesta | ¿Qué está bloqueado? | ¿Qué se está enviando? | ¿Qué está pasando y por dónde va? |
| ¿Tapa contenido? | No (una pestaña de una línea en la esquina final) | No | La zona de acciones |
| Indicador | Tramo que recorre el borde; a los 5 s, el borde entero quieto | Campos firmes + línea con giro finito | Etapas con la actual marcada |
| ¿Hay spinner? | No: el borde es la actividad | Uno pequeño, en la línea | Uno por etapa actual |
| Foco del disparador | Se queda (`aria-disabled`) | Se queda | Pasa a la hoja |
| Fuera de formularios | Sí, cualquier superficie | Limitado | Sí |
| En línea | Etiqueta legible + contorno del botón | `GBtn loading` | `GBtn loading` + etapa |
| Diálogo | El marco recorre; la pestaña tapa «Cerrar» | Cuerpo firme, pie que dice | Hoja desde el pie |
| Pantalla completa | Marco del visor, la aplicación a la vista | Banda «Sur → Norte» | Hoja centrada con fondo de modal |
| Δ0 | Sí | Sí | Sí (superpuesta) |
| Coste | Bajo | Medio (necesita `GForm`) | Medio |
| Riesgo principal | Sutileza en la periferia | Solo brilla en formularios | Tapa las acciones |

## 6. Recomendación

**A + las etapas de C dentro de la pestaña de A.** El contorno como forma de toda operación en curso (en línea, superficie, diálogo, pantalla completa) y, cuando la aplicación da `steps`, la pestaña dice la etapa («Guardando cambios · Avisando al equipo») y el texto de los 5 s la incluye. B queda **reservada** como integración futura de `GForm` (los campos se congelan además del contorno) para la Fase 4 de formularios; C como hoja queda descartada salvo que el usuario la prefiera.

- **A** porque responde lo que el velo genérico no responde (qué está bloqueado), **no tapa nada**, sirve a cualquier superficie con la misma pieza y es la más barata en un paquete sin margen de peso (#506, #550).
- **Las etapas de C** porque el «sin porcentajes inventados» de la propuesta necesita algo mejor que un giro mudo en las operaciones largas, y caben en una línea.
- **B** porque es la mejor respuesta **para formularios**, pero exige el contexto de `GForm`: mejor como segunda entrega que como forma general.

## Qué lo hace distinto (resumen de la recomendación)

Una operación en curso en Grana **no tapa nada**: enmarca. El borde de lo que está ocupado se recorre mientras trabaja y se cierra quieto si tarda; dentro, lo que la persona acaba de escribir sigue legible, quieto e intocable; el botón que lo lanzó conserva el foco y su nombre; una pestaña de una línea dice qué pasa y, si la aplicación lo sabe, en qué etapa va. Sin velo, sin spinner en medio de los datos, sin porcentajes inventados, sin otro diálogo, sin `z-index`. Una operación, una voz: el inicio se oye solo si se ve, el resultado lo dice su dueño.

## 7. Comprobaciones

`node design/lab/busy/r01/verificar.mjs` · 2026-10-14 · puerto 4214 · **624 de 624 pasan** (cada motor por separado tras el último cambio de `busy.js`).

| Motor | A | B | C |
| --- | --- | --- | --- |
| Chromium | 71/71 | 69/69 | 68/68 |
| Firefox | 71/71 | 69/69 | 68/68 |
| WebKit | 71/71 | 69/69 | 68/68 |

Historial honesto: la primera pasada completa dio 615/624 (WebKit no devuelve el foco al cerrar un `<dialog>`: el laboratorio lo devuelve como `GDialog` con `from`, #583; y un clic sobre lo inerte dejaba el foco en `body`, punto 3). La segunda, con otro agente corriendo Playwright a la vez, dio 608/624: los fallos de Chromium B eran de carga (una operación de 100 ms ya había terminado cuando se medía) y pasan solos; los de WebKit A y B eran reales (en WebKit un clic en un botón le quita el foco) y se corrigieron previniendo el `mousedown` también sobre el disparador. Tras eso, 208/208 en cada motor.

Cada concepto se comprueba en los cuatro escenarios: en línea (inert del campo, foco y `aria-disabled` del botón, etiqueta legible en A / `GBtn loading` en B y C, leyenda, Δ0, foco al terminar); tarjeta (bloqueo desde 0 ms, segundo clic ignorado, 100 ms sin indicador ni anuncio, liberación, 900 ms con aparición a ~200 ms y ≥ 400 ms a la vista, foco en el disparador o en la capa con nombre, solo el disparador o la capa enfocables, contraste de lo enviado, Δ0 durante y después, canal fuera de `aria-busy`, clic en un campo que no entra, un anuncio o ninguno si el foco lee la capa, sin anuncio de resultado, Intro en un campo con foco a la capa y de vuelta al campo, foco fuera intacto, falla liberada y anunciada solo por la aplicación, Esc que cancela, espera larga con texto ≥ 4,5:1 y 0 animaciones y un anuncio con la etapa, contraste de indicador y texto en claro y oscuro, movimiento reducido, RTL en A); diálogo (Esc retenido, «Cerrar» inerte, ningún diálogo nuevo, canal dentro del modal, foco dentro, cierre por la aplicación con foco de vuelta, Esc que cancela con el diálogo abierto y usable); pantalla completa (modal propio, foco dentro con nombre, puntero bloqueado, canal dentro, Esc retenido, movimiento más lento a los 5 s, limpieza y foco de vuelta, 390 px sin desplazamiento horizontal y capa de la tarjeta dentro de la tarjeta). Consola limpia en cada página.

**No comprobado:** lector de pantalla real (VoiceOver, NVDA, TalkBack): si el `group` enfocado se lee bien al recibir el foco, si `aria-busy` en lo afectado silencia algo indebido, y la lectura del `<dialog>` de pantalla completa sin título visible; `forced-colors` real (Windows); zoom 200/400 % y texto grande (la pestaña de A puede truncar con elipsis: su texto completo está en el nombre de la capa y en el anuncio); táctil real (el contorno en un botón pequeño); un tema distinto al por defecto (accent claro sobre superficie clara); bloqueo del desplazamiento a pantalla completa (L12); popovers abiertos dentro al bloquear (L11); el avance real (`value`/`max`) no está prototipado.

## 8. Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombre y entrega | **`GBusy`** (`g-busy`): una pieza; alternativas `GPending`, `GWorking`. Descartados `GLoadingOverlay` (promete un velo y choca con `loading` = lectura, `GLoadRegion`) y `GSpinner` como componente. **Entrada propia `@grana/vue/busy`** (global UMD `GranaBusy`; el margen del principal está agotado, #506, #550); el motor (`loadPhase.js`), el canal y `topModal.js` ya están en el principal y llegan por `__shared`. Estimación de kiwi: ≈ 2,5 KB gzip con A. **Componente complejo** (se solapa con `GDialog`, `GBtn`, `GForm`, `GLoadRegion`; se posiciona sobre otros a pantalla completa; motor de estado): coco y bruno en Opus |
| L2 | API | `active` (Boolean; **no** `loading`, que es lectura en `api.md`), `label` (String, obligatoria: el nombre de la operación, también el anuncio y el nombre de la capa), `description` (opcional; solo si el concepto la pinta), `labels` (`slow`, `cancel`, `canceling`; sin valores por defecto, #226), `cancelable` (Boolean) + evento `cancel`, `steps` (Array de String) + `step` (Number) para las etapas, `fullscreen` (Boolean). Slot por defecto: lo que se bloquea. **Reservados:** `value`/`max` (avance real → `GProgress` o «3 de 24»), `labels.done` (anuncio de éxito cuando no hay aviso). **Sobran** de la propuesta: `scope`, `blocking`, `backdrop`, `placement`, `zIndex`, `indicator`, `speed` |
| L3 | `GDialog` | **Contexto interno de retención** (`provide`/`inject` con `Symbol`, sin API pública): mientras una `GBusy` activa lo pida, el diálogo previene `cancel` (Esc), no cierra por el fondo y deja «Cerrar» inerte; Esc llega a la `GBusy` (cancelar o nada). Su `loading` (lectura) no cambia. Va en el principal con `GDialog` (pocos bytes) |
| L4 | Tokens | **Ninguno nuevo** si se elige A: tramo `--g-color-accent-text` (≥ 3:1) con `--g-border-width × 2`; pestaña `--g-color-accent-text` / `--g-color-on-accent` (≥ 4,5:1 medido en claro y oscuro), radio `--g-radius-md`, alto ≥ 24px (44px a pantalla completa); recorrido `--g-duration-spin × 2`, lineal. B: aspecto de solo lectura de `GInput` (#165). C: `GSurface floating` (`--g-shadow-2`), `--g-duration-slow` + `--g-ease-out`, `--g-surface-backdrop`. Las constantes de tiempo son las de `loadPhase.js` (#532), no tokens |
| L5 | 2.2.2 | Regla dividida para `tokens.md` §29 / `api.md`: en superficie, en línea y en diálogo, **ninguna animación pasados 5 s** (como #539); a **pantalla completa** (nadie puede interactuar), excepción esencial: sigue, ×2,5 más lenta. Con movimiento reducido, nada recorre ni gira en ningún caso |
| L6 | `GBtn` | Dentro de una `GBusy` activa, el disparador **no** pasa a `loading`: `GBusy` le pone `aria-disabled` y conserva su foco y su etiqueta (A). `GBtn loading` sin cambios fuera. Aviso de desarrollo: disparador con `loadingText` dentro de una `GBusy` activa (dos voces). Si se elige A, valorar como personalidad aparte que `GBtn loading` conserve la etiqueta con el contorno en vez del giro (cambio de #299/plan 015: decisión del usuario, no de esta ronda) |
| L7 | Giro público | Sin `GSpinner`. Para la plantilla de la aplicación, **`spin` en el `GIcon` público** (Boolean; `--g-duration-spin`, sin girar con movimiento reducido, se detiene a los 5 s salvo dentro de un bloqueo total). Unificar los 15 `g-*-spin` privados en una sola regla compartida es de coco (sin cambio visible) |
| L8 | Frontera en `api.md` | Tabla «Esperas»: control que espera → `loading` del control; contenido que llega → `GLoadRegion` / anfitrión; **operación sobre lo que está a la vista → `GBusy`**; resultado → `GToast`; condición que dura → isla; avance medible → `GProgress` |
| L9 | Anuncios | Por el canal de página (`announcePage`): inicio al verse salvo si el foco se movió a la capa; 5 s una vez con la etapa; nada al terminar. La capa no tiene región viva propia |
| L10 | `GForm` | Reservado (Fase 4 de formularios): integración de B. Un `GForm` dentro de una `GBusy` activa congela sus campos (aspecto `readonly`) y marca los que cambiaron (`dirty` por campo); o `GForm` acepta una promesa de `submit` y monta su `GBusy`. Ronda propia |
| L11 | Popovers dentro | Al activarse, la `GBusy` cierra los popovers abiertos de su contenido (`GMenu`, `GSelect`, `GTooltip`, `GHelper`): `inert` no los oculta de la capa superior |
| L12 | Pantalla completa | `<dialog>` propio con `showModal()`, `aria-labelledby` al texto de la operación, `cancel` prevenido, bloqueo del desplazamiento como `GDialog` (`html:has(...)`), foco de vuelta al disparador; no reserva borde (`edgeReserve.js`). La carga inicial de la aplicación (antes de montar) **no** es esto: receta HTML/CSS en el README |
| L13 | Personalidad | Registrar en `DECISIONS.md` la elegida. Con la recomendación: A «el bloqueo tiene borde» (nada se tapa, el contorno es el indicador, la pestaña dice qué pasa) + «las etapas en la pestaña» |
| L14 | Pruebas de bruno | Las de `verificar.mjs` como base de `tests/busy.spec.mjs`: tiempos (100/900/7000 ms), inert desde 0 ms y segundo clic, foco (fuera, disparador, campo, C, pantalla completa, vuelta), anuncios (uno, ninguno con foco en la capa, 5 s con etapa, nada al terminar), Esc (cancelar, retenido en diálogo y pantalla completa), Δ0, contraste claro y oscuro, reducido, RTL, 390 px |

## 9. Pregunta de producto (una)

**¿Qué forma tiene una operación en curso en Grana?**

1. **A + las etapas de C (recomendada):** el borde de lo que está ocupado es el indicador, nada se tapa; el botón conserva el foco y su nombre; con `steps`, la pestaña dice la etapa. B queda reservada para formularios (Fase 4).
2. **Solo A:** el contorno y la pestaña, sin etapas.
3. **B:** lo enviado se congela a la vista y la fila de acciones dice qué se guarda (centrado en formularios).
4. **C:** la hoja de etapas que sube desde las acciones.
