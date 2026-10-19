# Declaración — isla de estado, r04: tres propuestas sobre D · **elegida D1 · Cápsula de relevo**

**kiwi · 2026-10-19.** Prototipo `index.html?p=D1|D2|D3` (`&theme=dark`), tokens reales del tema por defecto en claro y oscuro, cabecera en zona de marca. Base funcional: `base.js` (copia de la de r03, con `resolve` que limpia la descripción y la regla de que una condición vive con su origen). Verificación: `node design/lab/alert/r04/verificar.mjs` (`GRANA_PW_PORT=4213`), **360/360** (40 por propuesta y motor en Chromium, Firefox y WebKit). Regla aplicada: `docs/documentacion/auditoria-visual.md` (§1 a §5).

## 0. Decisión

El usuario eligió **D1** al ver los prototipos: «me gusta la D1, solo que en el diseño de la pill mejóralo, hazlo más atractivo, visual, moderno». La estructura y el comportamiento de D1 quedan fijados aquí (§2 y §6). **La estética de la píldora pasa a coco** (§6.5), sin cambiar comportamiento. D2 y D3 quedan descartadas (§4), con lo que aportan a D1.

## 1. Auditoría previa (brief §1 y §3)

Sobre la isla real (`GStatusIsland`, playground) y sobre D de r03, solo en lo que aplica a una isla flotante. Integra `../auditoria-movimiento.md` de coco. Ojo con la numeración: la «F1» de kiwi en r03 (barra a todo el ancho) es la **F2 de coco**, y la «F2» de kiwi (fundido que no se ve) coincide con la **F1 de coco** (con «Guardar» en uso, la isla aparece abierta de golpe).

| Aspecto del brief | Isla real (hoy) | D (r03) |
| --- | --- | --- |
| **Jerarquía** (insignia, título, descripción, acción) | Correcta en la abierta: título en `title-sm-weight`, descripción `body-sm`, acción `GBtn sm` y «Ir a…» discreto. En la compacta solo insignia y título; «+N» sin decir qué hay detrás | Una sola línea: **la acción no está en la isla**, solo en la marca y en Alt+F8. La descripción no se ve nunca sin abrir |
| **Contraste y delimitación** | Superficie inversa: 17,4:1 frente a la página. **Frente a la zona de marca del tema por defecto, 1,06:1** (zona `#1F1F1F`, tinta `#1A1A1A`): pegada a una cabecera de marca, la isla parece un saliente de la cabecera y no un objeto propio. `shadow-2` (10 % de negro) no se ve sobre la zona. **Contradice el argumento de #692** («la inversa se separa de la zona de marca»), que solo vale con una marca de color. En oscuro, 14,7:1 | Igual que hoy (misma superficie) |
| **Espaciado y alineación** | Insignia que cruza la isla al ir al punto (M2 de coco), punto que se pellizca por debajo de su tamaño (M1), panel que desaparece en el primer cuadro (M3) | Sin punto ni panel automático: M1 a M3 no aplican; queda la alineación de la fila |
| **Estados** | Faltan: **pausa** (no existe), lo **nuevo** (el resumen enseña lo más grave), **qué guarda el punto** (I3 de coco). Hay: tipos con forma de icono y borde, cuenta atrás, ocupado, foco, reducido, 320px | Pausa invisible (se detiene, pero nada lo enseña); varias condiciones: la última sustituye sin decir que hay más; cuenta atrás que se queda (bien) |
| **Movimiento** (coco) | F1 aparece abierta de golpe con «Guardar» en uso; F2 barra a todo el ancho; F3 sin fundido al vaciarse en Firefox; I1 nacer en `press`, el 86 % en ~50 ms; I2 nace abierta; I4 caja vacía al vaciarse | Corregidos por diseño: mide antes de mostrar, cae en `slow`, no se abre sola, se recoge con su contenido |
| **Consistencia** | Insignias de `GToast`, botones `GBtn`, `GIcon` interno, tokens: bien. El punto es un control de solo icono **sin pista** (choca con #433 a #436) | Bien; sin punto, el choque desaparece |

**Lo que hay que cambiar** (y entra en las tres propuestas): delimitación frente a la zona de marca, acción alcanzable desde la isla, pausa que se vea, varias condiciones que se entiendan, y el movimiento sin golpes. **Lo que podría romper comportamiento**: quitar el punto y la apertura sola reabre #316 y #319 (hallazgos para lima, §7).

## 2. Las tres propuestas (todas sobre la base D)

Comunes: transitoria (lectura de `GToast` #142, `clamp(5000, 2000 + 60 × caracteres, 12000)` ms), pausa con puntero o foco en la isla o en su marca y con la pestaña oculta, sin punto, lo pendiente en la marca (con **eco**: un anillo único en la marca cuando la isla se recoge con algo pendiente) y en Alt+F8, una cuenta atrás (`deadline`) se queda hasta actuar (2.2.1), un resultado sin enlace se lee y se va, nada se abre solo, anuncios y foco de la base.

### D1 · Cápsula de relevo (**elegida**)

- **Forma:** superficie inversa con **doble filo**: un anillo exterior de `--g-border-width` del color de la página (`--g-color-bg`) más `shadow-2`. Sobre la página el anillo no se ve; sobre la zona de marca la separa (16,48:1).
- **Nacer:** una cápsula sin texto (`space × 24` × fila) cae del borde (`--g-duration-slow`, `--g-ease-out`; escala 0,9 y fundido) y se ensancha hasta su titular con `--g-ease-spring`; el texto aparece con `--g-duration-press`.
- **Una línea, la acción asoma:** insignia + título + «+N». Al pasar el puntero o enfocar, la cápsula crece hacia abajo (asomo) y enseña la descripción, la acción, «Ir a…», el enlace y «Ocultar».
- **Tiempo a la vista:** un **anillo alrededor de la insignia** se vacía con el tiempo de lectura y se detiene en pausa. Con `deadline`, el anillo cede el sitio a la cuenta atrás `m:ss` (`role="timer"`).
- **Varias:** **relevo** en la misma cápsula: lo más grave pasa delante (si llega un error mientras se lee otra cosa, la releva y la anterior espera la primera); las demás esperan con «+N» y entran una tras otra con un rodillo vertical del texto. La cápsula no desaparece entre una y otra.
- **Recogerse:** el texto se apaga (`fast`), la cápsula se estrecha (`slow`, `ease-out`) y sube fundiéndose (`slow`, `ease-standard`).
- **Lista:** pulsar la cápsula, la marca o Alt+F8 abre «Pendiente (N)» con todas las condiciones, en la misma superficie; «Cerrar», Esc o pulsar fuera la recogen.
- **Qué lo hace distinto:** una sola forma que cuenta su vida (cápsula vacía, titular, cápsula vacía) y un reloj que se ve sin ser un número. Varias condiciones no se amontonan: se relevan por gravedad en el mismo sitio.
- **Coste de accesibilidad:** el asomo depende de puntero o foco (en táctil: el toque abre la lista). El relevo cambia el texto de la cápsula sin anunciar (ya se anunció al llegar). El anillo es solo visual.
- **Cuánto cambia frente a D:** poco (añade asomo, anillo, relevo, doble filo).

### D2 · Tarjetas en mazo (descartada)

Dos líneas con la acción siempre a la vista y una «×» por tarjeta; varias se **apilan** (la última arriba, las de debajo asoman `space × 3` con su contenido apagado e `inert`) y se **despliegan** al pasar o enfocar; el tiempo es una línea fina en el borde inferior de cada tarjeta. Es lo más parecido a `GToast` (lo que el usuario quería evitar al separar la isla de los avisos); cambia más frente a D.

### D3 · Repisa del encabezado (descartada)

Banda **clara** (superficie de la página, contorno `border-control`) que sale de debajo de la cabecera, unida a ella; una línea con la acción, **«Fijar»** (`aria-pressed`) y «×» a la vista; lo nuevo **sustituye** y «N más» abre el resto. Se relaciona con la estructura de la página (brief §2), pero en oscuro se funde con una cabecera en zona de marca y pierde el carácter de isla.

## 3. Auditoría posterior (brief §3)

`verificar.mjs`, **360/360** (D1 40/40, D2 40/40, D3 40/40 en cada motor). Por propuesta y motor: carga sin anuncios; error con un anuncio enérgico exacto, foco en «Guardar», Δ0 en cuatro referencias; **nacer**: ningún cuadro más ancho que la isla, primer cuadro visible entrando desde el borde, sin saltos de opacidad (≤ 0,75 por cuadro); pausa con el puntero; **recogerse** subiendo; eco en la marca; el error sigue vigente en la marca; la marca trae la lista con el foco en «Reintentar»; Esc la recoge y devuelve el foco; varias condiciones según la propuesta; cuenta atrás que se queda en `role="timer"`; resultado sin enlace que se va; `resolve` limpio; Alt+F8 ida y vuelta; un solo par de canales y la isla no es región viva; abrir y cerrar no anuncian; **contraste en claro y en oscuro** de texto, insignias de los cuatro tipos y bordes de control, y **delimitación frente a la página, la superficie de formulario y tabla, y la zona de marca**; controles ≥ 24×24; **320px y 640px** (equivalente a texto al 200 %) sin desplazamiento horizontal, en línea y en lista; movimiento reducido sin nada que se mueva.

**D1 medido (Chromium):** nacer, primer cuadro visible con opacidad 0,29 a 38px de su sitio, máximo 313px frente a 305px finales (el sobrepaso del muelle), +0,24 de opacidad por cuadro como mucho; texto 13,45:1 (claro) y 13,71:1 (oscuro); iconos sobre insignia 5,35 a 5,73:1 (claro) y 4,81 a 4,90:1 (oscuro); botón 13,45:1; **delimitación: página 17,4:1, superficie 17,4:1, zona de marca 16,48:1** (gracias al anillo; sin él, 1,06:1) en claro, y 16,46 / 15,22 / 14,72:1 en oscuro; 320px y 640px dentro del visor.

## 4. Comparativa y elección

| | **D1 · Cápsula de relevo** | D2 · Tarjetas en mazo | D3 · Repisa del encabezado |
| --- | --- | --- | --- |
| Forma | Cápsula inversa de una línea con doble filo | Tarjeta inversa de dos líneas | Banda clara colgada de la cabecera |
| Nace / vuelve | Cae del borde, se ensancha / se estrecha y sube | Cae del borde / sube | Sale de debajo de la cabecera / vuelve bajo ella |
| Acción | Asoma al pasar o enfocar | Siempre a la vista | Siempre a la vista |
| Varias | Relevo por gravedad («+N») | Mazo que se despliega | Sustituye; «N más» |
| Tiempo y pausa | Anillo en la insignia | Línea inferior por tarjeta | «Fijar» explícito |
| Frente a `GToast` | Distinta | **Casi igual** | Distinta |
| Verificado | 40 × 3 | 40 × 3 | 40 × 3 |
| Estado | **Elegida** | Descartada | Descartada |

**Lo que D2 y D3 aportan a D1** (propuestas, no decididas): de D3, **«Fijar»** como control explícito para quien necesite más tiempo sin dejar el puntero encima (2.2.1 «ampliar»), dentro del asomo; de D2, la **«×» por condición** en el asomo en lugar del texto «Ocultar» si coco lo prefiere visualmente (mismo comportamiento).

## 5. Pregunta de elección

Respondida por el usuario: **D1**. No quedan preguntas de comportamiento abiertas. Quedan dos de detalle, con recomendación, que lima puede cerrar sin preguntar si deriva de un estándar: «Fijar» dentro del asomo (recomendado: sí, por 2.2.1), y la duración (recomendado: la de `GToast`, #142).

## 6. Entrega a coco (D1)

### 6.1 Anatomía y marcado del prototipo (estructura, de kiwi)

```html
<div class="isle" data-p="D1" data-form="empty|line|list" data-paused>       <!-- fija, centrada; --_top = bajo la cabecera -->
  <div class="sr x-live"> role=status (cortés) · role=alert (enérgico) </div>  <!-- canales, desde el montaje -->
  <section aria-label="Estado de la aplicación (Alt+F8)">
    <div class="d1 inv [is-peek] [is-list] [is-veiled] [is-leaving] [is-in|is-out]" style="--_w;--_h;--_left">
      <div class="d1__inner">
        <div class="d1__row">
          <button class="d1__summary" aria-expanded aria-keyshortcuts="Alt+F8">
            <span class="badge" data-type aria-hidden="true"><svg class="g-icon"/><svg class="ring"/></span>
            <span class="d1__text"><span class="sr">Tipo: </span>Título</span>
            <span role="timer" aria-live="off">m:ss</span>                        <!-- solo con deadline, en lugar del anillo -->
          </button>
          <span class="d1__count">+N <span class="sr">, N más en espera</span></span>
          <span aria-hidden="true">chevron-down</span>
        </div>
        <div class="d1__more" hidden>                                         <!-- asomo: descripción + acciones; lista: «Pendiente» -->
          <p class="d1__desc">…</p>
          <div class="d1__acts"> acción · «Ir a…» · enlace · «Ocultar» </div>
        </div>
      </div>
    </div>
  </section>
</div>
<button class="mark [is-echo]">insignia + «No se guardó» / «Reintentando…» / «Guardada»</button>  <!-- junto al control -->
```

### 6.2 Estados

`line` (titular), **asomo** (`is-peek`: puntero o foco), `list` (todo lo pendiente), **pausa** (`data-paused`: el anillo se detiene), **relevo** (texto nuevo con rodillo; «+N»), **ocupado** (insignia `loader-circle` que gira, botón `aria-disabled`), **cuenta atrás** (`m:ss` en vez del anillo; no se recoge), los cuatro tipos (forma del icono + prefijo oculto; en la cápsula el anillo de tiempo sustituye al borde de estilo de la insignia: coco decide si el estilo del borde debe sobrevivir), foco (anillo interior de `--_ink`), hover, `forced-colors`, movimiento reducido, 320px.

### 6.3 Comportamiento y movimiento (estructura, de kiwi: no cambia)

| Paso | Qué | Duración y curva |
| --- | --- | --- |
| Nacer | Cápsula sin texto (`space × 24` × fila) cae del borde: `translate` desde `-(100% + margen)`, escala 0,9 → 1, fundido | `--g-duration-slow`, `--g-ease-out` (entrada: sin muelle, #299, #324) |
| Ensancharse | De la cápsula al titular medido (el tamaño se mide **antes** de mostrar) | `--g-duration-slow`, `--g-ease-spring` (uso aprobado del muelle, #324 a) |
| Texto | Aparece al terminar la caída | `--g-duration-press`, `--g-ease-out` |
| Asomo / lista | Crece hacia abajo con continuidad | `--g-duration-slow`, `--g-ease-spring` |
| Relevo | El texto entra desde abajo; el ancho se ajusta | `--g-duration-slow`, `--g-ease-out` (texto) y `--g-ease-spring` (ancho) |
| Lectura | `clamp(5000, 2000 + 60 × caracteres, 12000)` ms; pausa con puntero o foco en la isla o la marca, pestaña oculta | Constantes de `GToast` (#142) |
| Recogerse | Texto fuera; se estrecha a la cápsula; sube y se funde | `fast` + `ease-standard`; `slow` + `ease-out`; `slow` + `ease-standard` |
| Eco en la marca | Un anillo que se abre y se apaga, una vez | `slow × 3`, `ease-out` |
| Reducido | Solo fundidos | `--g-duration-fast` |

### 6.4 Qué es de quién

- **kiwi (fijado aquí):** las formas y estados, el orden del DOM, el relevo por gravedad, el asomo, la lista, el tiempo y la pausa, de dónde nace y cómo se recoge, la marca y su eco, el foco y el teclado, y que la isla se delimite frente a cualquier fondo (≥ 3:1).
- **coco (abierto):** todo lo visual de la píldora: proporciones, radio, alto de fila, sombra, cómo se resuelve el doble filo, tipografía y peso, insignia (tamaño, relleno, borde, el anillo de tiempo), separación, cómo se ve el asomo y la lista, el velo al pasar, el rodillo, el eco, los tonos sobre claro, oscuro y zona de marca. Con tokens y sin tocar comportamiento.

### 6.5 Punto de partida para coco: por qué hoy se ve «poco atractiva» (criterio de kiwi, sin diseñarlo)

1. **Es un bloque plano casi negro** con una sombra de 10 % que no se ve sobre fondos oscuros: no tiene profundidad ni borde propio; sobre la zona de marca del tema por defecto desaparece (1,06:1). El doble filo del prototipo lo resuelve funcionalmente, pero es un trazo de 1px, no un diseño.
2. **La insignia pesa más que el texto:** un círculo de 32px de color saturado con un icono de 18px y un contorno discontinuo o punteado, en una fila de 48px, compite con el título. En la cápsula el anillo de tiempo añade otro trazo alrededor.
3. **Proporciones de botón grande, no de isla:** alto de 48px con relleno interior pequeño y el título en `text-action-weight`; la isla dinámica de referencia es más baja, más ancha de radio y con más aire lateral.
4. **El «+N» y el chevron** van como texto suelto al final, sin jerarquía ni agrupación.
5. **El asomo y la lista** reutilizan las piezas de la abierta de hoy (botones contorneados blancos, tiras con velo del 8–9 %): se lee como un panel de formulario, no como una prolongación de la cápsula.
6. **En oscuro** la superficie inversa es casi blanca: la píldora brillante sobre una página oscura llama más que el contenido; merece una revisión del tono (sin perder ≥ 3:1 de delimitación).
7. Hay que mantener: contraste ≥ 4,5:1 del texto y ≥ 3:1 de insignias, anillo, bordes y delimitación en claro, oscuro y zona de marca; diana ≥ 24px (44px táctil); tipo reconocible sin color; reducido solo con fundidos.

## 7. Hallazgos para lima

**Decisiones que D1 enmienda:**

- **#315** (y la frontera de `toast.md`): la isla deja de ser «información persistente de página»; es **transitoria con memoria fuera de ella**. Regla de frontera: si al irse queda algo pendiente, isla; si no, `GToast`.
- **#316**: **D2 sale** (no hay un sitio visible con memoria: la memoria es la marca y Alt+F8); **D3 sale** (nada se abre solo). Se mantienen **D1** (nada se mueve), **D4** (una sola superficie: cápsula → titular → lista) y **D5** (marca, «Ir a…», Alt+F8).
- **#319**: formas `empty` / `line` / `list` más el asomo; **sin punto, sin «Entendido», sin `autoOpen`**; recogida por tiempo de lectura con pausa; `deadline` se queda; varias condiciones en **relevo por gravedad**; «no desaparece mientras dure alguna condición» pasa a valer para el **modelo**, no para la pantalla.
- **#320**: anuncios sin cambios; el relevo no anuncia (cada condición se anunció al llegar).
- **#322**: la isla publica su reserva de borde **solo mientras está visible**; el móvil: la lista abre la hoja de `GDialog` como hoy (no prototipado aquí).
- **#323**: la marca guarda lo vigente y recibe el **eco** al recogerse la isla.
- **#324**: nacer cayendo (`slow` + `ease-out`), ensancharse con el muelle, recogerse subiendo; sustituye al nacer en `press` (I1 de coco) y al toque `is-nudge`.
- **#325 y #692**: superficie inversa sí, pero **con delimitación garantizada frente a la zona de marca** (en el tema por defecto claro la zona y la tinta están a 1,06:1). Corrige el argumento de #692.
- **#318**: `resolve` limpia `description` y `details`; una condición con `origin` **vive con su origen** (motivo `origin`).
- **#142** se reutiliza: la lectura de la isla usa `TOAST_DURATION`.

**Contrato que necesita** (`status.md`): reescribir «Las tres formas», «Apertura automática» (se elimina `autoOpen`), «Movimiento» y «Foco»; sección nueva **«Lectura y relevo»** (duración, pausa, `deadline`, orden por gravedad, interrupción por un error); opción del gestor `duration` (`'auto'` o ms, como `GToast`); textos nuevos y retirados en `labels` (`waiting` con `{count}` para «+N en espera», `hide` «Ocultar», `listTitle` «Pendiente», `close`; retirar `acknowledge`; `pin` si se adopta «Fijar»); clases y datos (`data-form="line|list"`, `is-peek`, `data-paused`, `--_left`, `is-echo` en la marca); y las comprobaciones de F1 y F2 de coco convertidas en regla: **el primer cuadro visible siempre tiene su tamaño**.

## 8. Informe (brief §5)

- **Cumplimientos (ya respetaban el brief):** jerarquía de la abierta (título, descripción, acción), insignias y botones de `GToast`/`GBtn`, `GIcon`, tokens existentes, contraste de texto (17,4:1) y de insignias (≥ 4,8:1), foco visible, 320px, movimiento reducido, nada se mueve en la página (Δ0).
- **Correcciones (D1 frente a hoy):** delimitación frente a la zona de marca (1,06:1 → 16,48:1); nacer sin barra a todo el ancho ni golpe (primer cuadro con 0,29 de opacidad, entrando desde el borde); no se abre sola; se recoge sola con pausa y un tiempo que se ve; sin punto mudo; acción alcanzable al pasar o enfocar, en la marca y en Alt+F8; varias condiciones relevadas por gravedad con «+N»; resultado sin enlace que se va; `resolve` limpio.
- **Pendientes (no verificados o por decidir):** lector de pantalla real (el relevo sin anuncio, el asomo, Alt+F8 con lector), táctil real (asomo sin puntero: el toque abre la lista), RTL (el anillo y el rodillo), la hoja móvil de `GDialog` para la lista, convivencia con la voz y con `GPageHeader` (reserva de borde solo visible), `forced-colors` real, Safari real a 60/120 Hz; la estética de la píldora (coco); «Fijar» en el asomo y la duración (lima, §5); las enmiendas de §7 (lima).
