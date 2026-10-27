# Declaración — isla de estado, r05: progreso determinado · **en revisión** (falta la elección del usuario)

**kiwi · 2026-10-27.** Prototipo `index.html?p=A|B|C` (`&theme=dark`, `&t=ms`, `&speed=n`) montado sobre **el CSS real** de la isla y de la marca (`GStatusIsland.css`, `GStatusMark.css`, `GBtn.css`, `defaults.css`): los conceptos se juzgan con el material elegido (L1 claro, V2C oscuro), no con un kit gris. Lo nuevo de la ronda va en un `<style>` con prefijo `x-`. Verificación: `node design/lab/alert/r05/verificar.mjs` (`GRANA_PW_PORT=4214`), **74/74 en Chromium**; Firefox y WebKit no están instalados en este entorno (el script los corre donde existan). Origen: DECISIONS **#946** (rama `claude/project-thread-2ck6nd`). Brief: `brief.md`.

**Convención.** **Hecho** = leído o ejecutado, con evidencia. **Inferencia** = deducido sin ejecutarlo. **Propuesta** = recomendación de kiwi.

## 1. Auditoría previa (`auditoria-visual.md` §1 y §3, solo lo que aplica a la isla)

| Aspecto | Isla real hoy (hechos) | Qué falta para el progreso |
| --- | --- | --- |
| Modelo | Condición con clave; `busy` solo para la acción que devuelve promesa, sin cifra (`status.md` «Acción y resolución», punto 2) | Una cifra que cambia **sin** ser un cambio de título (no debe volver a mostrar ni anunciar en cada paso) |
| Insignia | El **anillo dice el tiempo de lectura** y se vacía (`status.md` «Tiempo»; `GStatusIsland.css:353`) | Si el avance también es un anillo, hay que impedir que la misma insignia diga dos cosas a la vez |
| Ancho | El titular se mide antes de mostrarse y cambia con muelle (`--_island-w`) | Una cifra que crece («9 %» → «100 %») movería el ancho en cada paso: hay que reservarlo |
| Vida | Transitoria; lo pendiente vive en la marca y en Alt+F8 (#693) | Una subida de 2 min no puede ocupar el titular todo el rato (#693: «estorba») ni desaparecer sin rastro |
| Anuncios | Uno por suceso; el relevo no anuncia (#698) | Hitos: cuántos, por qué canal, qué pasa si llegan seguidos |
| Frontera | `GToast` si no queda nada pendiente (#704) | Mientras sube, **sí** queda algo (la propia subida): es isla. Al terminar sin enlace, se lee y se va (motivo `read`) |
| Solape | `GFileField` ya pinta el avance de cada archivo en su ficha (`GProgress`, #366 a #379) | La isla no debe repetir un avance que ya se ve en el campo |
| Peso | `dist/status.js` 19 591 de 19 968 B (#706): **quedan 377 B** | Cualquier concepto lo supera (§6) |

## 2. Base funcional común (vale para A, B y C)

1. **Una actividad es una condición** con `progress` (propuesta: número de 0 a 1, o `{ value, max }` como `GProgress`; lo fija lima). `type` por defecto `info`. **No hay tipo nuevo ni icono nuevo**: el icono sigue siendo el del tipo.
2. **Cambiar el avance no es cambiar la condición:** no vuelve `seen` a `false`, no reanuncia, no releva y **no cambia el ancho**. *Hecho (prototipo):* el titular mide lo mismo a 9 % y a 18 % (la cifra reserva el ancho de «100 %»).
3. **El final lo decide la aplicación:** llegar a 100 % no resuelve nada (subido ≠ procesado). `resolve(id, { title: 'Informe subido', link? })` pasa en el **mismo elemento** a resultado, como hoy. El fallo es `update` a `error` con su acción («Reintentar»). Cancelar es la **acción** de la condición (una, como hoy).
4. **Un anillo que se llena es avance; uno que se vacía es tiempo. Nunca los dos en la misma insignia.** El avance arranca arriba y va en el sentido del reloj (también en RTL, como el de tiempo). Al terminar, el anillo lleno pasa a ser de tiempo y empieza a vaciarse: no hay salto.
5. **Anuncios** (WCAG 4.1.3): el inicio, al llegar (regla vigente); **hitos 25, 50 y 75 % por el canal cortés**; si el anuncio anterior de esa actividad fue hace menos de 5000 ms (la ventana de `createLiveWriter`), se espera al final de la ventana y se dice **solo el último hito cruzado**; **100 % no se anuncia** (lo dice el final). Texto `fill(labels.progress, { title, percent })` con `Intl.NumberFormat` de porcentaje. *Hecho:* cruzar 25 y 75 en el primer segundo da un único «Subiendo informe-t3.pdf: 75 %».
6. **Nombre accesible:** el resumen (botón) lleva la cifra en texto oculto («Información: Subiendo informe-t3.pdf, 40 %»); la cifra visible es `aria-hidden`. **En la lista** (Alt+F8), cada `li` con avance lleva un `role="progressbar"` real (`aria-valuenow`, `aria-valuetext` con la cifra), porque dentro de un `button` el rol se perdería (como `role="timer"`, L8 de lima sobre Cornisa). La marca enlace lleva la cifra en su texto.
7. **La marca lleva el avance** (en los tres conceptos): la misma insignia con anillo que se llena y la cifra («Subiendo 62 %»). Es la memoria de lo pendiente (#323): lo que dura, dura en la marca.
8. **Gravedad y mano** sin cambios: un `error` de otra parte releva a la actividad (*hecho*), salvo bajo la mano (#702); la actividad vuelve después.
9. **Frontera** (propuesta para lima, §7): si el origen ya enseña el avance a la vista (`GFileField`), no hay actividad en la isla; la isla es para lo que **sigue cuando la vista se va** o no tiene dónde verse (exportar, importar, subir en segundo plano). Una promesa breve sin cifra sigue siendo `GToast.promise`.
10. **Nada se mueve en la página** (*hecho*: Δ 0px en tabla y botón), **nunca toma el foco** (*hecho*), 320px sin desplazamiento horizontal (*hecho*), movimiento reducido: sin caída y el anillo cambia sin transición (*hecho*).

## 3. Los tres conceptos

Divergen en **una sola pregunta**: *¿qué se queda a la vista mientras la actividad dura?*

### A · El anillo cambia de oficio — se queda **todo el titular**

- Al empezar cae como cualquier condición. **Mientras dura, no hay tiempo de lectura** (la lectura está en pausa, como con `busy`): el titular se queda con el anillo que se llena y la cifra.
- «Ocultar» (o Esc) la recoge: sigue en la marca y en Alt+F8. El final vuelve a caer.
- **Qué lo hace distinto:** el anillo de la insignia cambia de oficio sin cambiar de sitio: se llena con el trabajo y, al terminar, el mismo anillo lleno empieza a vaciarse como tiempo de lectura.
- **Contra:** una subida de dos minutos deja el titular (≈ 306px) dos minutos arriba al centro. Es lo que el usuario rechazó en #693 («siento que estorba»). Es también lo más parecido a Cornisa y a la isla dinámica de iOS.
- *Hecho:* el titular sigue tras su lectura; tras un error que lo releva, vuelve.

### B · La isla avisa, la marca lleva — **no se queda nada** en la isla

- La isla dice que empezó («Subiendo informe-t3.pdf · 12 %», anillo de **tiempo**) y se recoge con su lectura, como cualquier condición. El **eco** cae en la marca, que desde ahí lleva el avance.
- La isla vuelve a caer con el final o el fallo.
- **Qué lo hace distinto:** la isla vierte la actividad en su origen: lo que tarda vive junto al botón que lo empezó, no flotando.
- **Contra:** sin una marca visible (la exportación se lanzó desde un menú que ya se cerró, o la marca quedó fuera del visor) **el avance solo está en Alt+F8**: nadie ve que sigue viva. *Inferencia:* para la mayoría de personas eso equivale a «no sé si se colgó».
- *Hecho:* la isla se recoge con su lectura y la marca lleva «80 %» con su anillo.

### C · Cápsula testigo — se queda **la cápsula vacía** (96 × 44px)

- Al empezar cae y se lee como cualquier condición (con el anillo de **avance**: no va a desaparecer, solo a encogerse). Al acabar la lectura **no sube**: se queda en la **cápsula de `fold`** (la forma que la isla ya atraviesa al recogerse: `space × 24` × fila) con la insignia, el anillo que se llena y la cifra. Sin título ni cola.
- Pasar el puntero, enfocar o tocar la **abre en el sitio** (asomo: título, descripción, «Cancelar», «Ocultar»); al salir vuelve a la testigo. «Ocultar» la recoge del todo (queda la marca).
- El final **crece desde la testigo** (`grow`) hacia «Informe subido», se lee y se va. Si llega un error de otra parte, la testigo crece hacia él y, leído, vuelve.
- **Qué lo hace distinto:** la cápsula vacía, que hasta ahora era un paso de 240 ms, se vuelve un estado con sentido: **el testigo** de que algo sigue en marcha. No se inventa una forma; se para la que ya existe.
- **Contra:** sigue habiendo algo arriba al centro, aunque ocupe un tercio. Con el foco tapado rige 2.4.11 (se recoge, `hide()`), así que nunca tapa lo que se usa.
- *Hecho:* tras la lectura mide 96px; el puntero la abre a 306px y al salir vuelve a 96px; el final crece desde ella.

## 4. Comparativa

| | **A · Anillo de oficio** | **B · La marca lleva** | **C · Cápsula testigo** |
| --- | --- | --- | --- |
| A la vista mientras dura | Titular entero (≈ 306px) | Nada en la isla; la marca | Cápsula de 96px |
| ¿Respeta «estorba» (#693)? | No | Sí | En parte (un tercio, y se aparta del foco) |
| ¿Se ve que sigue viva sin marca? | Sí | **No** (solo Alt+F8) | Sí |
| Anillo de la insignia | Avance → tiempo al final | Tiempo (la cifra va en el texto) | Avance → tiempo al final |
| Formas nuevas | Ninguna | Ninguna (avance en la marca) | Un estado de reposo nuevo con la forma de `fold` |
| Interrupciones nuevas | Pocas | Ninguna | Las de la testigo (asomo, relevo, final, 2.4.11) |
| Coste en bytes (*inferencia*, gzip) | ≈ +0,5 a 0,8 KiB | ≈ +0,6 a 0,9 KiB | ≈ +0,9 a 1,3 KiB |
| Verificado (Chromium) | 24/24 | 23/23 | 27/27 |

**Recomendación (propuesta):** **C, con la regla de B para la marca**: si al acabar la lectura la marca enlace de la actividad está **visible**, la isla se recoge entera (B); si no, se queda la testigo (C). Es la misma regla que ya rige para una acción sin otra vuelta visible (`status.md` «Lo que no se recoge solo», #696): se queda arriba solo lo que no tiene otro sitio donde verse. Confianza media: el criterio deriva de una regla vigente, pero el prototipo implementa C sin esa regla (se evaluaría en una r06 corta si la eliges).

## 5. Pregunta de elección (producto, para el usuario)

¿Qué se queda a la vista mientras dura una actividad con progreso: **A** (el titular entero), **B** (nada en la isla; la marca), **C** (la cápsula testigo) o **C con la regla de B** (testigo solo si no hay marca visible)?

## 6. Peso (hecho y consecuencia)

- **Hecho:** tope de `dist/status.js` 19 968 B gzip; medido 19 591 B (#706): quedan **377 B**. #706 dice que **no se vuelve a subir** sin una decisión del usuario.
- **Inferencia:** cualquiera de los tres necesita entre ≈ 0,5 y 1,3 KiB (modelo de `progress`, coalescencia de hitos, anillo de avance en la isla y en la marca, `progressbar` en la lista; C además el estado de reposo). Ninguno cabe.
- **Consecuencia:** al elegir, lima mide la estimación y te trae **una sola** decisión de peso (subir el tope con cifra o sacar algo de la entrada). No la adelanto aquí para no mezclarla con la de forma.

## 7. Hallazgos para lima

1. **`progress` en el modelo** (`set`, `update`, `GStatus`): tipo y escala (0–1 o `{ value, max }` como `GProgress`), fuera de rango (recorte con aviso), `null` = sin actividad. Indeterminado: **no** se añade (es `busy`); anotar la frontera.
2. **Reglas de §2.2** en «Modelo» y «Lectura y relevo»: el avance no toca `seen`, no anuncia, no releva, no mide.
3. **Anuncios** (§2.5): `labels.progress` (`{title}`, `{percent}`, String o Function, sin valor por defecto, aviso al primer uso); hitos 25/50/75 corteses con coalescencia por actividad en la ventana de 5000 ms; 100 % mudo. Añadir a «Se anuncia» y a «Verificación».
4. **ARIA** (§2.6): cifra oculta en el nombre del resumen; `role="progressbar"` en el `li` de la lista; cifra en la marca. Nunca `progressbar` dentro del `button`.
5. **Anillo** (§2.4): regla «llena = avance, vacía = tiempo, nunca los dos» para coco; la clase y la propiedad (`__progress` o similar, `--_progress` número 0–1) en «Clases y datos».
6. **Frontera** (§2.9): fila nueva en la tabla de #704 («Actividad larga con avance que sigue fuera de su vista → isla + marca») y la exclusión de `GFileField` (su avance ya está en la ficha).
7. **Según la elección:** A enmienda «Pausa» (la actividad pausa la lectura, como `busy`); C añade un **estado de reposo** a «Formas» (propuesta: `data-form="witness"`, sin `data-stage`), sus filas en «Interrupciones» (asomo desde la testigo, relevo desde ella, final con `grow`, 2.4.11 con `hide()`) y la regla de B si se elige.
8. **Peso** (§6): estimación medida antes de contratar; decisión de tope al usuario.
9. **Varias actividades** a la vez: cada una con su `id`; la testigo (C) enseña la primera en llegar y no lleva «+N» (no cabe). Si la aplicación quiere una sola cifra para un lote, la suma ella (un `id` para el lote). Confirmar.

## 8. Teclado, foco y estados

- **Teclado:** sin cambios respecto al contrato. Tab al resumen abre el asomo (en C, la testigo se abre en el sitio); Alt+F8 abre la lista con los `progressbar`; Esc recoge.
- **Foco:** nunca lo toma; con el foco dentro, ninguna recogida ni paso a testigo (pausa).
- **Estados (los nuevos en negrita):** **actividad en curso** (anillo que se llena + cifra), **testigo** (solo C), **asomo desde la testigo** (solo C), **hito anunciado**, **final** (resultado en el mismo elemento), **fallo** (error con «Reintentar»), **cancelada** (resultado sin enlace), más todos los vigentes (titular, asomo, lista, pausa, relevo, ocupado, cuenta atrás, cuatro tipos, reducido, 320px).

## 9. Auditoría posterior e informe

**Comprobaciones ejecutadas** (`verificar.mjs`, Chromium, 74/74): carga sin anuncios; un anuncio cortés al empezar; la isla no toma el foco; Δ 0px; el avance no cambia el ancho ni anuncia; anillo de avance en A y C (y de tiempo en B), nunca los dos; nombre del titular con la cifra; hitos coalescidos («75 %» único); el comportamiento de cada concepto tras la lectura; la marca con anillo y cifra; C: la testigo se abre en el sitio y vuelve, «Cancelar» ≥ 24px; un error ajeno releva y se anuncia por el canal enérgico; vuelve la actividad (A titular, C testigo); final anunciado una vez, en el mismo elemento, con el anillo vuelto a tiempo; el resultado sin enlace se va; 320px; movimiento reducido. Capturas: `{A,B,C}-2-durante-*`, `C-3-asomo-*`, `{A,B,C}-4-final-*` en claro y oscuro.

**No ejecutadas:** Firefox y WebKit (no instalados aquí; el script los corre donde existan); lector de pantalla real (hitos, nombre del resumen que cambia); táctil real (asomo de la testigo con el primer toque); RTL; `forced-colors`; zona de marca; la lista con `progressbar` (no prototipada: estructura en §2.6); contraste medido del anillo de avance (*inferencia*: usa la misma tinta y la misma pista que el anillo de tiempo en pausa, medidos por coco ≥ 4,51:1 los gráficos; coco lo mide al construir); la regla de B dentro de C.

**Cumplimientos / Correcciones / Pendientes**

- **Cumplimientos:** reutiliza la forma D1 entera, el material, la marca, la frontera, la gravedad, los canales y el foco vigentes; ningún token, icono ni forma nueva en A y B; en C, la forma es la de `fold`.
- **Correcciones** (frente a Cornisa, de donde viene la idea): los hitos no se apilan (coalescencia), el anillo no dice dos cosas, la cifra no mueve la cápsula, el `progressbar` no va dentro de un botón, el error no se queda, nada se releva bajo la mano.
- **Pendientes:** la elección del usuario (§5); la decisión de peso (§6) tras la medición de lima; lo no ejecutado de arriba; los hallazgos de §7.
