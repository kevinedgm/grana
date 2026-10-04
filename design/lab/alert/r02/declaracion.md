# Declaración — aviso persistente, r02: **B · Isla de estado**

**kiwi · 2026-10-04.** Prototipo: `index.html?c=B` (componentes reales de `dist/`: `GForm`, `GInput`, `GFormActions`, `GTable`, `GCard`, `GDialog`, `GBtn`, `GToaster`; tokens reales del tema por defecto; `XbIsland`, `XbList` y `XbMark` de prototipo). Base funcional: `../r01/declaracion.md` (se conserva entera). Verificación: `node design/lab/alert/r02/verificar.mjs` (`GRANA_PW_PORT=4209`).

## 0. Decisión y comparativa

**El usuario aprobó B · Isla de estado** tras ver los tres conceptos en el lab (decisión transmitida por la coordinación; lima la registra en `DECISIONS.md`). A y C quedan **reservadas**: no se construyen, pero están prototipadas y verificadas (`?c=A`, `?c=C`) por si se quiere mezclar más adelante.

| | A · Nace de su causa | **B · Isla de estado** | C · Nota al margen |
| --- | --- | --- | --- |
| Forma | El control se abre: «Guardar» pasa a «Reintentar» y el mensaje sale de él; el fallo de carga ocupa el hueco de las filas | Una píldora oscura en el shell que crece, se repliega a un punto y reúne todo | Sin caja: regla en el margen de la región + texto con la secuencia de lo ocurrido |
| Lo que aportaba | Proximidad total al origen; el botón con foco es el mismo nodo (Δ0 sin compensar) | **Cero desplazamiento del contenido**, un solo sitio para todo, memoria de lo que sigue pasando | La línea de tiempo (enviada → falló → reintentando → guardada) en el sitio |
| Lo que arriesgaba | No aporta forma nueva a nivel de página (es una franja); exige integrarse en `GFormActions` y `GTable` | Lejos del origen; tapa contenido al abrirse; convive con la píldora de voz | Empuja el contenido; a nivel de página queda débil |
| Medido (3 motores) | 35/35 | **56/56** | 34/34 |
| Estado | Reservado. Rescatable: «el mismo botón pasa a Reintentar» | **Elegido** | Reservado. Rescatable: los pasos dentro de un aviso de la isla |

## 1. Qué es

Una **región única y persistente** de la aplicación que reúne lo que **está pasando y dura**: condiciones de página (sin conexión, sesión por caducar, mantenimiento, solo lectura), fallos del servidor al guardar o cargar, y resultados que deben quedarse (éxito con enlace). Vive en el borde superior del visor, **fuera del flujo**: nunca empuja ni mueve el contenido. Lo transitorio sigue siendo de `GToast`; la validación, de `GErrorSummary` (frontera de r01, sin cambios).

## 2. Anatomía y estados de forma

1. **Raíz** `section` con nombre (`labels.region`, «Estado de la aplicación») → región del árbol accesible. Contiene el resumen, el panel y (propuesta) su par de canales vivos.
2. **Resumen** (siempre visible mientras haya avisos): un `button` con `aria-expanded`, `aria-controls` y `aria-keyshortcuts`. Dentro: insignia del aviso más grave (icono Lucide sobre el color del tipo), título de ese aviso, cuenta atrás si la tiene (`role="timer"`, `aria-live="off"`) y «+N». Nombre accesible: «Estado: N avisos. Tipo: título y N más».
3. **Panel**: lista `ul` de avisos + pie con «Entendido». Cada aviso (`li`): insignia, prefijo oculto de tipo, título, texto, enlace opcional, **una** acción (`Reintentar`…), «Ir a…» (origen) y, si es descartable, un botón de descartar con nombre propio.
4. **Tres formas**, una sola raíz que cambia de tamaño con continuidad:
   - **Compacta**: resumen de una línea. Estado por defecto con avisos sin reconocer.
   - **Abierta**: resumen + panel. La abre la persona (clic, Enter, atajo, marca de origen) o un aviso **grave** nuevo (punto 14).
   - **Punto**: solo la insignia (el texto sigue en el nombre accesible). Cuando todos los avisos actuales están reconocidos. **No desaparece** mientras dure alguna condición.
   - **Vacía**: `hidden`; la raíz y los canales siguen montados.
5. **Tipo sin color**: forma del icono + prefijo oculto + estilo del borde de la insignia (sólido error, discontinuo advertencia, punteado información), convención de `GToast`/`GCard`.

## 3. Varias condiciones

6. **Orden**: gravedad (error, advertencia, información, éxito, neutro) y, dentro, la más reciente primero. Es el orden del DOM. El resumen muestra la primera.
7. **Sin máximo**: todas caben en la lista; el panel desplaza si no cabe en el visor (`max-block-size` del visor menos el margen).
8. **Clave por aviso** (`id`): volver a declarar la misma clave **actualiza** el aviso en el sitio (mismo nodo), no crea otro.

## 4. Ciclo de vida

9. **Aparecer**: la isla nace (o da un toque con `--g-ease-spring` si ya estaba) y **anuncia** el aviso. Los que ya existen al montar no se anuncian.
10. **Reconocer** («Entendido»): todos los avisos actuales quedan reconocidos → **punto**. Los **resultados** (éxito que se queda) se retiran al reconocerlos; las **condiciones** siguen hasta que la aplicación las quita.
11. **Volver de punto a compacta**: llega un aviso nuevo o uno reconocido cambia de tipo.
12. **Resolver en el sitio**: error → reintentando (`aria-busy` en el aviso, la insignia gira, la acción queda con `aria-disabled`) → éxito, **en el mismo `li`**. Medido: identidad del nodo.
13. **Descartar** un aviso descartable (p. ej. mantenimiento): lo quita solo a él.
14. **Lo grave se abre solo**, con tres límites medidos: **no toma el foco**; **no se abre si taparía el elemento que la persona está usando** (WCAG 2.4.11: entonces se queda compacta, muestra el error en su línea y da el toque); **nunca en móvil** (allí abrir es una hoja modal).
15. **Cerrar la abierta**: Esc con el foco dentro, pulsar fuera, «Entendido», «Ir a…» o el atajo de vuelta.

## 5. Anclaje y convivencia

16. **Dónde**: borde superior del visor, centrada, capa superior (`popover="manual"` abierto siempre, como `GToaster` #141). Se monta **una vez**, lo más alto posible. Opciones sugeridas: `position` (`top-center` por defecto; `top-start`, `top-end`) y `offset` como `GToaster`. Respeta `safe-area`.
17. **Con `GSpeechHost`** (su píldora flotante también es `top-center`, #226): la voz conserva el borde (su indicador de grabación es una garantía, #213). La isla **lee** la reserva del borde (`edgeReserve('top', { except })`) y se coloca **debajo**; a su vez **publica** su alto **replegado** + margen (no el de la abierta). Orden desde el borde: voz → isla → avisos flotantes. `edgeReserve.js` hoy solo lo escribe la voz y lo lee `GToaster`: hay que generalizarlo (L5).
18. **Con `GToaster`**: medido con el real en `top-center`: el aviso flotante queda por debajo de la isla y la isla no se mueve. Regla de uso: **un suceso, un canal** (o flotante o isla, nunca los dos).
19. **Con un `GDialog` modal**: la isla **se traslada al modal superior** (mismos nodos, `utils/topModal.js`, como `GToaster` y la voz) y vuelve al cerrarse. Medido. Excluye su propia hoja móvil.
20. **Con `GErrorSummary`**: no se tocan. La validación (también los 422 y los errores generales de `errors`) nunca va a la isla.

## 6. Teclado y foco

21. **Nunca toma el foco** al aparecer ni al abrirse sola.
22. **Atajo `Alt+F8`** (propuesto; `hotkey` configurable, `false` lo quita): lleva al resumen y abre la isla; otra vez, devuelve el foco al elemento guardado. Sin avisos no se intercepta. Completa la familia F8 (avisos) / Mayús+F8 (voz). `Ctrl+F8` se descartó: en macOS mueve el foco a los menús de estado.
23. Resumen: Enter/Espacio abre o repliega. Abierta: Tab recorre acción, «Ir a…», descartar y «Entendido». **Esc** repliega con `preventDefault` + `stopPropagation` (no cierra el diálogo anfitrión) y deja el foco en el resumen.
24. **Si el control con foco desaparece** («Reintentar» al resolverse, un aviso descartado): el foco va al resumen. **Si la isla se vacía con el foco dentro**: vuelve al elemento guardado por el atajo o la marca; si no hay, al siguiente tabulable. Nunca al `body`.
25. «Ir a…» repliega la isla y enfoca el origen (`tabindex="-1"` temporal si no es enfocable).

## 7. Semántica y anuncios (base de r01)

26. La isla **no es una región viva**; sus canales sí: un par (`status` cortés + `alert` enérgico, `aria-atomic`) dentro de la raíz, presentes desde el montaje, escritos con `createLiveWriter` (`liveRegion.js`), que viajan con ella al modal. (El prototipo usa el anunciador por anfitrión de r01: el efecto medido es el mismo.)
27. Se anuncia `tipo: título. texto`: al aparecer un aviso (error → enérgico; resto → cortés), al cambiar de tipo y en los umbrales de una cuenta atrás (5 min, 1 min, 30 s). **No** se anuncia abrir, replegar, reconocer, descartar ni «Ir a…». Medido: ningún texto repetido entre las regiones vivas del documento.
28. Las **marcas de origen** (§8) no anuncian nada.

## 8. Los cinco casos con B

| Caso | En la isla | En el origen |
| --- | --- | --- |
| 1. Error de servidor al guardar | Aviso `error` con «Reintentar» e «Ir al formulario»; se abre solo si no tapa | **Marca** «No se guardó» junto a «Guardar», en su misma fila (no empuja nada): un botón que abre la isla en ese aviso |
| 2. Fallo al cargar una tabla | Aviso `error` con «Reintentar» e «Ir a Facturas» | **Marca** en el hueco de las filas (slot `empty` de `GTable`) |
| 3. Condición de página | Aviso (con cuenta atrás, acción o descartar) | Nada: su origen es la aplicación |
| 4. Éxito que se queda | El mismo aviso pasa a `success` con el enlace a lo creado; se va al reconocerlo | La marca pasa a «Guardada» |
| 5. Advertencia de una sección o un diálogo | **No va a la isla** | **Marca de texto** en la sección: una línea (insignia + texto + una acción opcional), sin caja |

29. **B necesita un complemento mínimo en línea: la marca.** Sin ella, el error de «Guardar» aparece lejos de donde mira la persona, y la advertencia que pertenece a una sección convertiría la isla en un cajón de sastre (medido en la primera versión: 5 avisos al cargar). La marca tiene dos usos: **enlace** (botón-cápsula del mismo lenguaje que la isla, abre la isla en su aviso y enfoca su acción) y **texto** (línea estática para lo que es contenido de una sección, no estado de la aplicación). No tiene cuerpo, detalle ni varias acciones: eso es de la isla. → Pregunta 1.

## 9. Móvil, RTL, movimiento, contraste

30. **Móvil** (< `space × 130`, 520px, el umbral de hoja de `GDialog` #103): la isla replegada sigue arriba; **abierta es una hoja inferior modal** (`GDialog` real: foco atrapado, Esc, el foco vuelve a la isla). Solo la abre la persona. Medido en 320px: cabe, sin desplazamiento horizontal.
31. **RTL**: centrada; insignia al inicio; relleno lógico.
32. **Movimiento reducido**: sin cambio de tamaño animado, sin toque, sin giro. Medido: 0 animaciones en curso.
33. **`forced-colors`**: borde `CanvasText` en la isla, la marca-enlace y las insignias (no medido en real).
34. **Contraste** medido con el tema por defecto: texto de la isla 16,48:1; icono sobre insignia de error 5,49:1; borde de la insignia sobre la isla 16,48:1; marca-enlace 16,48:1; marca de texto 17,4:1 y su insignia de advertencia 5,73:1 sobre la superficie. Solo se midieron las insignias de error y advertencia. La isla usa `brand`/`on-brand`: en tema oscuro se invierte (clara sobre oscuro).

## 10. Qué lo hace distinto (medido)

- **D1 · Nada se mueve, nunca.** Ningún aviso cambia la posición de nada en la página: las posiciones de cinco elementos de referencia son idénticas antes y después (Δ 0px), y el botón con foco no se mueve en ningún cuadro, también en 320px. Los avisos en línea de otros sistemas empujan el contenido.
- **D2 · Un solo sitio con memoria.** Reconocer no borra: la isla queda en un punto mientras dure la condición y conserva su nombre accesible. La persona sabe siempre dónde mirar y qué sigue pendiente.
- **D3 · Se abre sola sin estorbar.** Lo grave abre la isla sin tomar el foco y **solo si no tapa lo que se está usando**; si lo taparía, avisa con un toque. Medido en los dos sentidos.
- **D4 · Continuidad de forma.** Punto ↔ compacta ↔ abierta es una raíz que cambia de tamaño con `--g-ease-spring`; error → reintentando → éxito ocurre en el mismo elemento.
- **D5 · Ida y vuelta con el origen.** La marca abre la isla en su aviso y enfoca su acción; «Ir a…» repliega la isla y enfoca el origen; `Alt+F8` va y vuelve.

## 11. Comprobaciones

**Hechas** (Chromium, Firefox, WebKit; B 56/56 en cada uno; A 35/35 y C 34/34): carga sin anuncios; error al guardar (1 anuncio enérgico, foco en «Guardar», Δ0, isla abierta sin foco y sin tapar, marca en la fila del botón); reintentar → éxito en el mismo nodo, foco en la isla, enlace visible, no se cierra solo; reconocer → punto con nombre; tabla (resolución, fallo posterior, marca → isla → origen sin anuncios); condición de página, su resolución y cuenta atrás; sin textos repetidos en regiones vivas; diálogo (advertencia sin anuncio, traslado al modal y vuelta); ≥ 24×24; Enter, Esc, `Alt+F8` ida y vuelta; descartar; `GToaster` real debajo de la isla; lo grave no abre si taparía; contraste; 320px y hoja móvil; RTL; movimiento reducido.

**No hechas**: lector de pantalla real (nombre del resumen al cambiar, canales tras el traslado al modal, `role="timer"`); Safari y táctil reales; convivencia real con `GSpeechHost` (especificada en el punto 17, no prototipada); `forced-colors`; tema oscuro; zoom 400 %; muchas condiciones (más de 6) y el desplazamiento del panel; `Alt+F8` con lectores de pantalla y en teclados sin fila de función; reintentar desde la hoja móvil cuando el control con foco desaparece (el foco de reserva apunta fuera del modal).

## 12. Hallazgos para lima

- **L1 · Nombres.** Propuesta: gestor **`createStatus()` / `useStatus()` / `statusKey`**, región **`GStatusIsland`** (`<g-status-island>`, se monta una vez) y marca **`GStatusMark`** (`<g-status-mark>`). `GNotice`/`GAlert`/`GBanner` ya no describen la forma.
- **L2 · Imperativo con clave, y declarativo.** Una condición es **estado**, no suceso: `status.set(id, { type, title, text, action, link, origin, deadline, dismissible, result })`, `status.update(id, patch)`, `status.clear(id)`, `status.promise(...)` como `GToast`. Además, un componente sin pintura (`<GStatus id … />`) que registra mientras está montado y limpia al desmontarse: el fallo de carga de una vista no debe sobrevivir a la vista.
- **L3 · Solo texto**, como `GToast` (#139): título, texto, un enlace, una acción. Sin slots: garantiza el anuncio.
- **L4 · `labels` sin valores por defecto** (#226): `region`, `summary` (con `{count}`), `more`, `types.*`, `acknowledge`, `dismiss` (con `{title}`), `remaining`, y los de la hoja (`sheetTitle`, `close`).
- **L5 · `edgeReserve.js`**: hoy escribe la voz y lee `GToaster`. La isla debe leer (voz) y escribir (su alto replegado). Decidir el orden por prioridad, no por montaje.
- **L6 · `GStatusMark`**: `type`, `for` (id del aviso; con él es botón y abre la isla), `busy`; slot por defecto (texto corto) y `action` (solo sin `for`). Clases y tokens: los de la isla, sin token nuevo previsto.
- **L7 · `GFormActions`**: la marca va como hijo del slot por defecto, antes del botón. **No** en el slot `status`: es `role="status"` y duplicaría el anuncio.
- **L8 · `GTable`**: sigue sin estado de error; la marca va en `empty`. Documentarlo.
- **L9 · Atajo** `Alt+F8` por defecto; validar como `speech.md` (`F6` rechazado; aviso si coincide con F8 o Mayús+F8).
- **L10 · Entrada del paquete**: ¿en el principal (como `GToaster`) o entrada propia (como la voz, #238)? Recomendado: principal; es pequeño y lo usa cualquier aplicación.
- **L11 · Personalidad**: registrar D1 a D5. Para coco: la curva del cambio de tamaño (el prototipo usa `--g-duration-slow` × 1,6 con `--g-ease-spring`: uso nuevo de la curva, #299 pide decisión), el toque, el punto.
- **L12 · De r01 siguen vigentes** L5 (segundo fallo idéntico: `status.update` debe poder forzar el anuncio), L6, L7 (`GForm`: el mensaje que aparece al perder el foco mueve «Guardar» bajo el puntero) y la frontera del brief de r01.

## 13. Preguntas al usuario (2)

1. **¿Apruebas la marca en línea como complemento de la isla?** Recomendación: **sí**, con esta regla: a la isla va lo que *pasa* (condiciones de página, fallos del servidor, resultados); la advertencia que es contenido de una sección o de un diálogo se queda allí como marca de texto y no entra en la isla. Alternativa: todo a la isla sin marcas (más puro, pero el error de «Guardar» queda lejos de la vista y la isla se llena de avisos estáticos).
2. **¿Una isla o dos píldoras con la voz?** Recomendación para v0.1: **dos**, apiladas en el mismo borde (voz primero, isla debajo), porque la sesión de voz tiene garantías propias (#213) y su contrato ya está auditado. Alternativa: que la sesión de voz sea un aviso más de la isla (una sola forma en el shell; exige reabrir `speech.md`).
