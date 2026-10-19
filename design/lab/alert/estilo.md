# Estilo · Isla de estado transitoria (coco)

**Contrato:** `design/contracts/status.md` (lima, reescrito en 181c524; #693 a #705). **Estructura:** `design/lab/alert/r04/` (kiwi, **D1 · Cápsula de relevo**). **Estética elegida:** `r04/estilo.md` §10 (L1 · Grafito esmerilado en claro, V2C · Cristal con filo en oscuro). Este documento sustituye al de la isla persistente (#325, superficie inversa, punto y «Entendido»).
**CSS:** `packages/vue/src/components/GStatusIsland/GStatusIsland.css` (cápsula, lista `g-status-item`, hoja `g-status-sheet`) y `packages/vue/src/components/GStatusMark/GStatusMark.css`.
**Banco:** `estilo-banco.html`, con el marcado exacto del contrato y el CSS real de `src/` (`packages/vue/src/styles/grana.css`). `XIsland`, `XList` y `XMark` hacen de `.vue` solo en lo que el CSS necesita: miden `__inner`, escriben `--_island-w/-h`, `--_left` y `--_run-ms`, ponen `data-stage` y avanzan al terminar las transiciones de `__shape`, y ponen `is-peek`, `is-paused` e `is-echo`. Parámetros: `?dark`, `?rtl`, `?mobile`, `?t=ms` y `?solo` (sin los ejemplares quietos).
**Verificación:** `node design/lab/alert/estilo-verificar.mjs [--capturas]` (puerto 4214). Resultado: **285/285**.
- análisis estático: 49/49;
- Chromium con el tema por defecto y los 11 temas del CLI, claro y oscuro: 124/124;
- Firefox: 56/56;
- WebKit: 56/56.

**Capturas:** `estilo-isla-claro.png` y `estilo-isla-oscuro.png`.

## 1. Auditoría previa: el CSS vigente frente al contrato nuevo

| | Qué había | Qué pasa |
| --- | --- | --- |
| **Se reutiliza** | Raíz fija en la capa superior (`popover`) con `container-type`, margen `space × 2` con `safe-area` y `--_status-offset-top`, `data-align` y su origen. Una sola superficie que mide `__inner` + borde con `border-box` explícito. Texto oculto. Lista con desplazamiento propio y pie a la vista. Detalle técnico partido. Alias de `GBtn`. Hoja móvil. Área táctil de la marca. Marca de texto con sangría francesa | Se conserva. Cambian los valores |
| **Sobra** | Superficie inversa (#325). Formas `compact`, `dot` y `open`. Toque (`is-nudge`, `g-status-nudge`, 0,86). Nacer en `press`. Eco de la insignia «hay más». «Entendido» (`__ack`). `is-acknowledged`. Bordes de estilo por tipo en la insignia. Cascada del panel. Radio `xl` de la abierta. Apertura automática. Insignias de 32 px | Fuera (#694, #696, #701) |
| **Falta** | El material de cristal con `light-dark()`. Las etapas `drop`, `grow`, `fold` y `rise` con transiciones interrumpibles. La cápsula `space × 24`. El asomo `__peek`. La cola `__tail` con el chevrón. El anillo de tiempo con `--_left`, `--_run-ms` e `is-paused`. El relevo del texto. El muelle solo al crecer. El eco de la marca. Las respuestas a `prefers-reduced-transparency` y a la falta de `light-dark()` | Hecho (§2) |

Lo que podía romper el comportamiento: nada. El CSS solo lee las clases y los datos del contrato.

## 2. Implementación

### 2.1 Geometría (constantes de `space`, no tokens)

| Pieza | Medida |
| --- | --- |
| Fila del titular | `space × 11` (44 px) con el borde. Mínimo `24px + 2 bordes`; con `pointer: coarse`, `44px + 2 bordes` (el resumen mide 44 por dentro) |
| Radio | La mitad de la fila en todas las formas, también en el asomo y la lista |
| Insignia | `space × 6`, concéntrica con el extremo (hueco al inicio = hueco arriba = 10 px), glifo al 62 % |
| Columna del texto | El asomo, la lista y los separadores arrancan en `--_text-start` (relleno + insignia + `space × 2`) |
| Cápsula al caer y al recogerse | `space × 24` × la fila (96 × 44) |
| Ancho máximo y ancho de la lista | `min(space × 104, ancho disponible)`. El titular y el asomo miden su contenido (`max-content`) hasta ese máximo. La lista ocupa ese ancho |
| Marca enlace | Cápsula `space × 8` con insignia `space × 5` concéntrica; área táctil de 24 y 44 px |

### 2.2 Material

Valores de `r04/estilo.md` §10.2, sin variantes. Cada valor va en `light-dark(claro, oscuro)` sobre `.g-status-island__shape` y `.g-status-mark--link`. La lista, la insignia y los botones heredan los alias `--_ink`, `--_on-ink`, `--_veil`, `--_hair`, `--_focus` y `--_ring-*`; la hoja móvil los redefine con los colores de la página. La rama clara se declara también en `@supports not (color: light-dark(red, red))`.

**`prefers-reduced-transparency` y la falta de `backdrop-filter`:** el cuerpo pasa a ser opaco (claro: `text`; oscuro: `--g-glass-tint`).

### 2.3 Tamaño animado: el muelle solo al crecer (M1)

El contrato pide el muelle al ensancharse, en el relevo y al abrir el asomo y la lista, y nunca al encoger. El `.vue` no dice en qué sentido cambia el tamaño, así que el CSS lo resuelve solo:
- el ancho es `max(--_status-w, --_status-w-out)`, y el alto, lo mismo con `-h`;
- son cuatro propiedades registradas (`@property`, `<length>`) que van al mismo destino;
- la primera usa `--g-ease-spring` y la segunda, `--g-ease-out`, las dos en `slow`.

Al crecer manda la del muelle, que sobrepasa (3,6–3,7 % medido). Al encoger manda la de `ease-out`, que nunca baja del destino.

**Medido:**
- cerrar el asomo nunca baja del titular;
- estrecharse nunca baja de la cápsula;
- las dos propiedades interpolan desde el valor actual, así que una interrupción no reinicia el movimiento (#702).

`min-inline-size` y `min-block-size` de cápsula garantizan que, sin destino medido, la forma nunca colapse.

### 2.4 Etapas, coreografía y solape de la salida

| Etapa | Forma | Texto | Curva |
| --- | --- | --- | --- |
| `drop` | Cápsula; `@starting-style` desde `translate: 0 calc(-100% - margen)`, escala 0,9, opacidad 0 | Fuera. **La insignia, sí** | `slow` + `ease-out` |
| `grow` | Al destino medido | Entra (`press` + `ease-out`) | Tamaño `slow`, con muelle al crecer |
| reposo | El destino; el asomo y la lista crecen hacia abajo | El relevo (`slow` + `ease-out`) | Muelle al crecer y `ease-out` al encoger |
| `fold` | A la cápsula | Sale (`fast` + `standard`) **a la vez** que se estrecha | `slow` + `ease-out` |
| `rise` | Sube a `-(100% + margen)`, 0,9 y se funde, con su insignia | Fuera | `slow` + `standard` |

**Solape:** entrada = `drop` + `grow` = 2 × `slow`. Salida = `fold` + `rise` = 2 × `slow`, con el texto fuera dentro del primer tramo (`fast` < `slow`). La salida nunca dura más que la entrada (#152).

**Medido en el banco:**

| | Entrada | Salida |
| --- | --- | --- |
| Chromium | 521 ms | 506 ms |
| Firefox | 519 ms | 493 ms |
| WebKit | 543 ms | 503 ms |

El banco suma unos cuadros por etapa al avanzar.

### 2.5 Las demás piezas

**Relevo.** Un `__text` nuevo (el `.vue` le pone su clave) entra desde una línea por debajo con `@starting-style`. La copia que sale, con `aria-hidden="true"` y la misma clase, se va una línea por encima. Las dos comparten la celda: el resumen es una rejilla y la copia se coloca en absoluto dentro de esa celda, así que no mide. El resumen recorta (`overflow: clip`).

**Anillo de tiempo.**
- Se dibuja con un degradado cónico de la tinta, recortado a corona de 2 bordes, a un borde de la insignia.
- La propiedad registrada `--_status-ring` avanza de 0 a 1 en `calc(var(--_run-ms) * 1ms)`, en `linear`. El arco es `--_left × (1 − avance)`.
- **Con `is-paused`:** `animation-play-state: paused`, el arco pasa a ser `--_left` (lo que el `.vue` escribe al pausar) y la pista sube del 14 al 40 % de la tinta.
- **Sin `--_run-ms`:** el anillo no se anima y queda en `--_left`.
- **Sentido:** arranca arriba y gira en el del reloj, también en RTL (un reloj no se espeja).
- **Firefox:** medido, se vacía.

**Asomo y lista.**
- El contenido se funde al aparecer (`press`) con `@starting-style` y sale primero (`fast`) al quitar `is-peek` o `data-form="list"`.
- En el asomo el título se ve entero (sin elipsis).
- La lista son renglones con separador sangrado desde el texto, sin teselas.
- La acción es una cápsula rellena de tinta. «Ir a…» y el enlace son texto subrayado. «Ocultar», «Cerrar», el detalle, «Copiar» y «Descartar» son texto en la tinta.
- El foco va dentro de la isla, como anillo interior de la tinta.

**Chevrón.** Media vuelta en `slow` + `ease-out` con el asomo o la lista abiertos (corrección de lima: no muelle).

**Eco de la marca.** Es un `::before` que abre un anillo de `--g-color-focus` `space × 2` y se apaga: keyframes `g-status-echo`, `slow` + `ease-out` (corrección de lima: no `slow × 3`). Con movimiento reducido es la misma keyframe redefinida dentro de la consulta: un fundido del anillo en su sitio. Así `animationend` llega igual a la marca.

**Movimiento reducido** (solo fundidos de `fast`):

| Etapa | Qué se ve |
| --- | --- |
| `drop` | Nada (opacidad 0, sin transición) |
| `grow` | La isla aparece con su tamaño y en su sitio, fundida |
| `fold` | No hace nada |
| `rise` | Se funde entera con su texto |

- El relevo es un fundido cruzado.
- El tamaño no se anima.
- El anillo sigue diciendo el tiempo: cambia el arco y no desplaza nada.

**`forced-colors`:**
- borde `CanvasText`;
- sin brillo especular;
- contorno `CanvasText` en la insignia;
- el anillo con `forced-color-adjust: none` en `CanvasText` sobre `GrayText` (el modo quita los degradados: medido);
- «+N» y separadores en `CanvasText`;
- acción con borde `ButtonText`;
- foco `Highlight`.

## 3. Qué le da personalidad (regla «Personalidad e innovación»)

- **La cápsula cae con su insignia.** El tipo se reconoce antes de leer y la insignia viaja con el extremo cuando la cápsula se ensancha o se estrecha. Al recogerse, se va con ella. La cápsula nunca es una caja vacía (I4).
- **El tiempo se ve sin un número.** El anillo se vacía alrededor de la insignia y, en pausa, se queda quieto con la pista completa.
- **El muelle solo cuando algo llega.** Crecer tiene masa y volver es seco. Va resuelto en el CSS, sin que el `.vue` tenga que decir el sentido.
- **El relevo es un rodillo.** El titular nuevo sube desde abajo mientras el viejo se va arriba, en la misma cápsula.
- **Un solo objeto oscuro en los dos esquemas** («estilo Apple»): el mismo cristal con otra luz.
- **El eco** une la cápsula que se va con el sitio donde queda lo pendiente.

## 4. Medidas

**Mínimos medidos:**

| | Texto (≥ 4,5) | Gráficos (≥ 3) | Delimitación (≥ 3) |
| --- | --- | --- | --- |
| Chromium, 24 temas × esquemas | 4,56 | 4,14 | 3,10 |
| Firefox y WebKit, tema por defecto | 4,58 | 4,51 | 6,36 |

En gráficos cuentan el glifo, el anillo, el chevrón, la acción, «+N» y el foco.

**Delimitación con el tema por defecto:**

| | Página | Tabla | Zona | Marca en la página | Marca en la zona |
| --- | --- | --- | --- | --- | --- |
| Claro | 10,59 | 10,59 | 9,75 | 10,59 | 12,41 |
| Oscuro | 7,11 | 6,58 | 6,36 | 6,58 | 12,41 |

**Cómo se mide el contraste:**
- La isla se mide contra el peor fondo (negro, blanco) y contra el fondo real.
- La marca en la página, igual.
- La marca dentro de una zona se mide contra la zona, que es una superficie opaca. Con el peor fondo, `linear` y `stripe` darían 2,85 y 2,92; detrás de la marca solo está la zona.

### Rúbrica de movimiento (B, D, F y G)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| **B · Profundidad y brillo** | Cumple | Una luz: filo arriba, sombra cerca y lejos. Opacidad por cuadro ≤ 0,5 al nacer y al recogerse (normalizada a 16,7 ms) en los tres motores | Bajo | — |
| **B · Delimitación sobre tres fondos** | Cumple | ≥ 3,10 en los 11 temas, claro y oscuro (§4) | Bajo | — |
| **D · Nacer sin tamaño ajeno (F1/F2)** | Cumple | Primer cuadro visible: cápsula de 96 px sin texto, por encima de su sitio. Durante `drop`, tamaño de cápsula. Ningún cuadro pasa del destino más que el muelle (3,7 %) | Bajo | — |
| **D · Interrumpible desde el estado actual** | Cumple | Algo nuevo durante `fold`: vuelve a crecer desde el ancho actual, sin bajar a la cápsula. Durante `rise`: baja desde donde está, sin reaparecer. La lista se abre en cualquier etapa | Bajo | bruno lo repite con el `.vue` real |
| **D · Sin muelle al encoger (M1)** | Cumple | Asomo 44 → 136 → 44 sin bajar de 44. Estrecharse sin bajar de 96 | Bajo | — |
| **F · Sin depender del movimiento** | Cumple | Tipo por la forma y el prefijo. Pausa visible por la pista. Con `reduce`, nada se desplaza ni cambia de tamaño (0 animaciones de desplazamiento, escala o tamaño en la isla y la marca) y el anillo sigue avanzando | Bajo | — |
| **F · `forced-colors`** | Cumple (emulado en Chromium) | §2.5 | Bajo | Verificar en Windows real |
| **G · Coste del cristal** | Parcial | Chromium sin GPU: con la isla viva como única superficie de cristal, 17 ms por cuadro mientras cambia de tamaño (lo mismo que sin `backdrop-filter`). Con 20 ejemplares de cristal más en la página, 41 ms | Medio | Una aplicación tiene una isla y pocas marcas. Medir en equipo modesto real; con muchas marcas a la vista, valorar marcas sin `backdrop-filter` |

## 5. Informe

**Cumplimientos:**
- material, tokens y valores de §10.2, sin variantes;
- formas, etapas, asomo, lista, relevo, anillo, «+N», ocupado y cuenta atrás del contrato;
- movimiento con las duraciones y curvas del contrato, con las dos correcciones de lima (chevrón y eco);
- reducido, transparencia reducida, `forced-colors`, 320 px, texto al 200 %, dianas de 24 y 44, RTL;
- solo `var(--g-*)` y alias `--_*`, sin respaldos ni literales de tema;
- `on-brand-zone` solo en `GStatusIsland.css`.

**Correcciones** (frente al CSS vigente y al banco de r04):
- deja la superficie inversa;
- el muelle ya no actúa al encoger (M1);
- la salida no dura más que la entrada;
- el eco pasa a `slow` (antes `slow × 3`);
- el chevrón gira con `ease-out` (antes con muelle);
- el anillo, visible en `forced-colors`;
- la marca de texto pierde el borde de estilo por tipo (el tipo se lee por la forma del icono, como en la isla).

**Pendientes:**
- **No verificado:** Safari real, `forced-colors` real, lector de pantalla, táctil real y el coste de `backdrop-filter` en un equipo modesto (G).
- El detalle técnico en oscuro está justo (4,56 a 4,58): vigilar si un tema baja `--g-glass-opacity`.
- La compilación y las compuertas no se corrieron: `npm run build` reescribe `dist/` mientras bruno usa el suyo. Las dos compuertas de la isla ven selectores que siguen en el CSS: `g-status-island__shape` y `g-status-island__peek` (esta, nueva y de bruno). La minificación de esbuild 0.25 (la de Vite 6.4) conserva `light-dark()`, `@starting-style` y `@property`; comprobado.

**Para bruno (el marcado que espera el CSS):**
1. Quitar `hidden` de `__shape` **y** poner `data-stage="drop"` en el mismo cuadro, y solo con `is-ready`. La caída es un `@starting-style`: si la forma se muestra antes sin etapa, aparece sin caer.
2. `--_island-w/-h` = `offsetWidth`/`offsetHeight` de `__inner`, **sin** el borde (el CSS lo suma; el ejemplo de 44 px del contrato es la fila con el borde). El `.vue` puede escribirlas durante `drop`: el CSS usa la cápsula hasta `grow`.
3. Avanzar de etapa con `transitionend`/`transitioncancel` de `__shape` (`e.target === shape`) cuando `shape.getAnimations()` no tenga ninguna en curso. Las transiciones de tamaño son de las propiedades `--_status-w`, `--_status-w-out`, `--_status-h` y `--_status-h-out` (llegan como `transitionend` con ese `propertyName`).
4. **Relevo:** `__text` con clave por condición mostrada (un elemento nuevo entra desde abajo). Para que el viejo salga hacia arriba, conservarlo un `slow` como copia con `aria-hidden="true"` (fuera del nombre accesible) y quitarlo después.
5. Un `__ring` nuevo por tramo con `--_left` y `--_run-ms`. Al pausar, `is-paused` en la raíz y `--_left` con la fracción actual. Sin `deadline` y sin tramo, sin `--_run-ms`.
6. **Cerrar el asomo:** quitar `is-peek` primero y `hidden` de `__peek` tras `--g-duration-fast`. Si se ponen a la vez, el contenido desaparece sin fundido: Firefox no transiciona `display`. Lo mismo con `__panel`.
7. En `fold` y `rise`, conservar el contenido que se mostraba (texto y, si venía de la lista, el panel) hasta el fin de `rise`.
8. **Eco:** la clase `is-echo` en la marca; `animationend` y `animationcancel` llegan desde su `::before` (`animationName === 'g-status-echo'`), también con movimiento reducido.
9. Botones: la acción `GBtn size="sm"`; «Ir a…», «Ocultar», «Cerrar», el detalle, «Copiar» y «Descartar» `GBtn size="sm" variant="ghost" color="neutral"`. El CSS reasigna todos sus alias.
10. **Compuerta:** `g-status-island__shape` sigue. Añadir la de `__peek` (#705).

**Para lima:**
1. El ejemplo de «Estructura accesible» escribe `--_island-h: 44px`. El CSS (y el `.vue` vigente) tratan `--_island-w/-h` como el tamaño de `__inner` sin el borde: con borde de 1 px el titular es 42 + 2. Fijarlo en el contrato.
2. «Relevo» no nombra la copia que sale. El CSS usa `.g-status-island__text[aria-hidden="true"]`: es el mismo elemento de clase, que además debe quedar fuera del nombre accesible. Anotarlo en «Clases y datos».
3. «Fila `space × 11` (44px también con `pointer: coarse`)», en `tokens.md` §31 y en el contrato. El CSS sigue `r04/estilo.md` §10.2: con `coarse`, `44px + 2 bordes`, para que el resumen (la diana) mida 44 por dentro. Unificar el texto.
4. El asomo, por contrato, lleva la «cuenta atrás» en su orden del DOM, pero la cuenta atrás ya está en el titular (`__timer`). El CSS no da estilo a una segunda. Aclarar si el asomo la repite.
5. **Constantes nuevas de este CSS** (para §29.6 y §31):
   - `100 %` del relevo, la geometría de una línea, como el rodillo de `GNumberField`;
   - `0.5turn` del chevrón;
   - `1ms` como conversión del número `--_run-ms`;
   - las propiedades registradas privadas `--_status-w`, `--_status-w-out`, `--_status-h`, `--_status-h-out` y `--_status-ring` (§29.7).
