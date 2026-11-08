# Auditoría de coco · GDatePicker r02 (paso 5)

**Componente:** `GDatePicker` real (`GDatePicker.vue` de bruno en 952675e4 + `GDatePicker.css` de coco con las correcciones de esta auditoría) y `GBookingBar` real (`booking.umd.js`), construidos en un worktree aislado (`npm`/`vite build` + `build-fonts`), sin tocar el `dist/` del árbol principal.
**Contrato:** `design/contracts/datepicker.md` §«Un mes por defecto y salto a mes y año (r02)», #1020 a #1031.
**Método:** página `design/lab/datepicker/auditoria-r02.html` (componentes reales de `dist/`, once casos: un mes, dos meses, `auto`, compacto, compacto con dos meses, cómodo, rango de un mes que sigue fuera de la vista, `min`/`max`, hoy elegido, en línea de uno y de dos meses) y verificación propia `design/lab/datepicker/auditoria-r02-verificar.mjs` (Playwright, puerto 4232), cuadro a cuadro con `requestAnimationFrame` para el movimiento.
**Temas:** por defecto claro y oscuro; **tema de prueba** (`space` 5 px, `--g-press-scale` 0,95, marca `#0B1F4D`, acento propio, radios 0) claro y oscuro; temas generados `notion`, `spotify` y `caracol-purpura` claro y oscuro (`design/lab/tema-oscuro/dark-color-presence/generated/`).

```bash
GRANA_PW_PORT=4232 node design/lab/datepicker/auditoria-r02-verificar.mjs --root=<árbol con dist/ construido>   # por defecto, este repo
```

## Resultado: sin defecto bloqueante → `candidate`

| Motor | Comprobaciones | Fallos |
| --- | --- | --- |
| Chromium | 1870/1871 | 1: B1 con el tema de prueba (no bloqueante, de bruno) |
| Firefox | 1704/1705 | 1: B1 con el tema de prueba |
| WebKit | 1859/1860 | 1: B1 con el tema de prueba |
| **Total** | **5433/5436** | Los tres son el mismo hallazgo B1 |

Además, el banco de estilo (`estilo-r02-verificar.mjs`, sobre `src/`) sigue en **1426/1426** en Chromium con las correcciones.

## Correcciones de coco en esta auditoría

### C1 · El panel de dos meses vuelve a su ancho anterior (#1030, decisión del usuario)

La r02 fijó el mes del panel en siete celdas también con dos meses, y el panel de `GBookingBar` y de `months="auto"/2` pasó de 770 a 650 px. Ahora `--_pair-cells` celdas por mes con `g-datepicker__months--pair` (8,5 por defecto; 7 en compacto) y la columna única de meses o años mide `--_pair-cells × 2` celdas + la separación. Si el visor no da para tanto, los meses ceden hasta siete celdas, como antes de la r02 (el umbral de `auto` de bruno, 14 celdas, no cambia).

| Caso (Chromium, 1280 px) | Antes de la r02 (6535693c) | r02 (cad76fa2) | Ahora |
| --- | --- | --- | --- |
| Dos meses (`2`), por defecto | 340 + 340 · panel 770 | 280 + 280 · panel 650 | **340 + 340 · panel 770** |
| `auto`, por defecto | 340 + 340 · 770 | 280 + 280 · 650 | **340 + 340 · 770** |
| `GBookingBar` (fecha de llegada) | 2 × 340 | 2 × 280 | **2 × 340 · 770** (los tres motores) |
| Tema de prueba (`space` 5), dos meses | 425 + 425 · 950 | 350 + 350 · 800 | **425 + 425 · 950** |
| Un mes | 2 × 340 (era dos por defecto) | 280 · 330 | 280 · **330** (sin cambio) |
| Compacto, un mes | — | 216 · 254 | 216 · **254** (sin cambio) |
| Compacto, dos meses | — | 210 + 210 · 488 | 210 + 210 · **488** (7 celdas, sin cambio) |
| En línea, dos meses | 340 + 340 · 770 | 340 + 340 · 770 | sin cambio |

Δ 0 del panel, del escenario y de la cabecera entre días → meses → años → (Esc) meses → (Esc) días: **se mantiene** en los nueve casos, los cuatro temas y los tres motores, también con dos meses, en compacto con dos meses y en `GBookingBar`. Peso: `dist/grana.css` **+80 B** gzip sobre la base aceptada de 105 707 B (#1030).

Nota para lima: el texto de #1030 dice «cada mes ≈ 388 px por defecto»; lo medido antes de la r02 es **340 px por mes** (8,5 celdas) y 770 px de panel. 388 px era la superficie de **un** mes antes de la r02 (340 + 2 × 24 de relleno). Lo que vuelve es el ancho anterior, que es lo que pidió el usuario; conviene corregir la cifra del contrato.

### C2 · Elegido y actual (mes) o hoy (día) sin perder el trazo `{color}-text`

Con «actual» o «hoy», el aro on-`{color}` **sustituía** al trazo `{color}-text` de §7.1. Con un `{color}` claro el borde del elegido quedaba en el relleno solo: **1,92:1** con la superficie en `spotify` claro (marca verde). Ahora hay dos sombras interiores: el trazo `{color}-text` por fuera y el aro on-`{color}` dentro. Medido: **4,53:1** en el peor tema (`spotify`), en el mes y en el día. Sin cambio visible en el tema por defecto, donde trazo y relleno son el mismo tono. El mismo defecto venía de antes en el día de hoy elegido (`.g-datepicker__day.is-selected.is-today`). Se corrige aquí porque es el mismo CSS y la misma regla.

## Mediciones

### Tamaños, objetivos y texto

- Celda: 40 px por defecto, 35 px en cómodo, **30 px en compacto** (`space × 10 × d`); con el tema de prueba, 50 / 44 / 37,5 px.
- Con puntero grueso (Chromium y WebKit, `hasTouch` + móvil, 1280, 375 y 320 px): celda y botones del título **44 px**, también en compacto. A **320 px** y a **375 px**, la hoja no se desborda (el mes cabe en el panel y el panel en el visor). Todos los botones de la superficie miden ≥ 44 px.
- Puntero fino: todos los botones ≥ 24 px en todos los casos. Ningún texto visible < 12 px.
- La cabecera de días no se desborda en ningún caso (tampoco en compacto con dos meses, con 210 px por mes).
- Rejilla de meses: 3 × 4, llena el escenario (Δ ancho ≤ 1 px, Δ alto ≤ 1 px), con una sola sección. Con la pista y las cifras, la vista de años no sale del escenario.

### Contraste (mínimo en los 10 temas × 3 motores)

| Par | Mínimo | Dónde |
| --- | --- | --- |
| Texto del mes / título | 15,22:1 | por defecto oscuro |
| Texto del elegido sobre su relleno (mes y día) | 4,83:1 | `caracol-purpura` oscuro |
| Trazo del elegido (mes y día) / superficie | 4,53:1 | `spotify` |
| Elegido y actual / elegido y hoy (trazo) | 4,53:1 | `spotify` (antes 1,92:1, C2) |
| Aro de «actual» | 7,38:1 | `spotify` |
| Punto de «en el valor» (rango) | ≥ 7,38:1 | — |
| Chevron del título y flechas | 7,38:1 | `spotify` |
| Pista del año | 7,38:1 | `spotify` |
| Raya de los huecos de cifra | **3,43:1** | `spotify` (control, ≥ 3:1) |
| Anillo de foco | 4,57:1 | `notion` oscuro |

### Foco, teclado, RTL, colores forzados

- Intro sobre el botón del título lleva el foco a la celda del mes con `:focus-visible` y contorno ≥ 2 px; las flechas lo mantienen visible; Esc vuelve el foco visible al botón del título (tres motores).
- **RTL:** las flechas se espejan (`scale: -1 1`); las cifras del año se escriben de izquierda a derecha (`direction: ltr`); la franja que sigue se desvanece hacia la izquierda; el origen del zoom se refleja (Δ ≤ 2 px en un mes). En LTR, la franja que sigue se abre a la derecha y su celda lleva `is-open-end` sin `is-cap-end`.
- **`forced-colors`** (solo Chromium lo emula): el mes elegido y el actual llevan borde sólido ≥ 2 px, el foco es visible en meses y la franja que sigue pierde el desvanecido y conserva el extremo sin redondear.
- **Una sola luz:** al barrer las doce celdas de meses con el puntero, como máximo una celda tiene fondo de hover en cada cuadro (tres motores).
- Consola limpia en todas las páginas y motores.

## Movimiento · requisito del usuario «sutil y suave, no brusco»

Medido cuadro a cuadro (≈ 16,5 ms por cuadro en los tres motores). «Cuadros» son los que tienen la vista nueva con opacidad < 1.

| Momento | Chromium | Firefox | WebKit | Lectura |
| --- | --- | --- | --- | --- |
| Subir (días → meses), por defecto | 8 cuadros · 127 ms · escala 1,03 → 1 · Δ máx. por cuadro 0,012 de escala y 0,41 de opacidad | 9 · 132 ms · 0,010 / 0,33 | 8 · 124 ms · 0,011 / 0,35 | Fundido con un acercamiento de ≤ 3 % que se frena; sin rebote |
| Bajar (mes → días), por defecto | 8 · 118 ms · 0,97 → 1 · 0,012 / 0,41 | 8 · 115 ms · 0,012 / 0,40 | 9 · 140 ms · 0,012 / 0,41 | Igual, desde la celda elegida |
| Esc (sube y anima `in`, #1030 §14.1) | 8 · 116 ms · 0,012 / 0,41 | 9 · 123 ms | 8 · 128 ms · 0,015 / **0,49** | El salto mayor de opacidad en un cuadro (WebKit) |
| Tema de prueba (`press-scale` 0,95) | escala 1,05 → 1 · Δ 0,021 por cuadro | 0,021 | 0,026 | El tema manda en la amplitud, como se contrató |
| Reducido | 120 ms `linear`, **escala 1 en todos los cuadros**, Δ opacidad ≤ 0,14 por cuadro | ≤ 0,14 | ≤ 0,20 | Solo fundido |
| Cambiar de mes (flecha) | sin animación, panel quieto | igual | igual | Como contratado |
| Abrir el panel | 9 cuadros · 119 ms · desplazamiento ≤ 4 px (`space-1`) | 132 ms · 4 px | 139 ms · 3,9 px | Llega sin brincar |
| Cerrar el panel | fundido de 132 ms, sin desplazamiento | **instantáneo** | **instantáneo** | Firefox y WebKit no animan la salida de un popover (`overlay`/`display` discretos); se degrada a desaparecer, que no es brusco |
| Cifra del año | `g-datepicker-zoom-in` 120 ms `linear`, **escala 1** (solo fundido); la vista no se reinicia al recolocar la página | igual | igual | Microinteracción mínima |

En todos los casos y motores: escala dentro de [press-scale, 2 − press-scale], **monótona** hacia 1 y opacidad que solo sube (sin rebote, sin retroceso). Nunca hay dos vistas a la vez en una columna. El panel no se mueve durante el zoom. No aparece barra de desplazamiento lateral. La duración es `--g-duration-press` (160 ms) con `--g-ease-out` (reducido: `--g-duration-fast` + `linear`). **Interrupción:** dos cambios de nivel en 40 ms terminan en la vista de años con el foco en su rejilla y la vista en reposo.

**Veredicto: sutil y suave.** La amplitud es la de una pulsación (≈ 3 %: unos 4 px en el borde de una rejilla de 280 px y ≈ 11 px en el de dos meses), sin rebote ni retardo, y en ≈ 120 ms ya está quieto. **Observación (no bloquea):** `--g-ease-out` (`cubic-bezier(.23, 1, .32, 1)`) arranca rápido. El primer cuadro lleva ≈ 40 % del fundido (hasta 0,49 al subir con Esc en WebKit) y ≈ 40 % de la escala, unos 1,5 px en el borde. La curva es continua y sin rebote, así que no hay brinco de posición. Si el usuario lo percibe como «aparece de golpe», lima puede plantear `--g-ease-standard` solo para `cambiarNivel`. Es la misma curva de entrada que la tabla de movimiento (#1002) usa en todos los paneles, así que se mantiene por coherencia.

### Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito | Cumple | Subir aleja y bajar acerca desde la pieza: el origen cae en la celda (Δ ≤ 2 px con un mes, también en RTL); cambiar de mes no anima; no se repite en cada pulsación de flecha | Bajo | Corregir B1 (origen con dos meses) |
| B · Comodidad visual | Cumple | Escala ≤ 3 % (5 % con el tema de prueba), sin desenfoque, sin sombra ni brillo que cambie; opacidad monótona | Bajo | — |
| C · Estabilidad | Cumple | Δ 0 del panel, escenario y cabecera en todos los cuadros; cabecera, pie y campo quietos; sin barra lateral; la hoja a 320 px no se desborda | Bajo | — |
| D · Transiciones | Cumple | 160 ms, quieto a ≈ 120–140 ms; interrumpible (vista nueva por `:key`), sin bloquear foco ni teclado; las cifras no reinician la vista | Bajo | — |
| E · Control | Cumple | Solo cambia de nivel quien pulsa; Esc sube sin elegir y no navega | Bajo | — |
| F · Accesibilidad | Cumple | Reducido = solo fundido `fast` `linear` con escala 1 en los tres motores; el nivel lo dicen el foco y el nombre de la rejilla, no el movimiento | Bajo | Lector real: no verificable aquí |
| G · Rendimiento | Cumple (parcial en lo medido) | Solo `transform` y `opacity` en la vista; cuadros regulares (≈ 16,5 ms) en los tres motores, sin tirones | Bajo | La prueba de render con props en línea es de bruno |
| H · Inmersión | N/A | — | — | — |

## Hallazgos para bruno (`.vue`; no los corrige coco)

- **B1 (menor, no bloqueante) · Origen del zoom al bajar a días con dos meses.** `zoomVars(i, cols)` da `--_zoom-x = (2X − i) · 100 %` y supone que los dos meses se tocan, sin contar la separación. Medido: la vista del primer mes apunta 33,3 px a un lado de la celda elegida y la del segundo 6,7 px al otro (41,7 / 8,3 px con el tema de prueba), en los tres motores y reflejado en RTL. Lo visible es Δ × (1 − escala): 1,0 px por defecto y 2,1 px con `press-scale` 0,95. Es el único fallo de la verificación. **Propuesta, sin leer cajas:** `--_zoom-x: calc(${(2X − i) · 100}% + ${X − i} * var(--_months-gap))`. `--_months-gap` es el alias de la raíz que la vista ya hereda. Con un mes, y con las vistas de meses y años (una sola columna), el origen es exacto.
- Mi corrección C1 cambia el ancho del panel de dos meses (650 → 770 px). Si alguna prueba de bruno (vitest o Playwright: `GBookingBar`, `months="auto"`) fijaba 650 px o siete celdas por mes con dos meses, hay que actualizarla. El umbral de `auto` sigue siendo de 14 celdas.

## Hallazgos para lima

- **L1 · Cifra de #1030:** «≈ 388 px por mes» debe decir **340 px por mes (8,5 celdas), 770 px de panel**. 388 px era la superficie de un mes antes de la r02. Y en compacto con dos meses quedan siete celdas por mes (lo que dice el encargo: «la medida de siete celdas vale para un mes y para compacto»).
- **L2 (opcional) · Curva de `cambiarNivel`:** ver la observación del movimiento. Solo si el usuario la percibe brusca.

## No verificado

- Lector de pantalla real (título con dos botones, `__title-live`, rejillas de meses y años, sufijos), táctil y teléfono reales, Safari real (WebKit de Playwright sí).
- `forced-colors` en Firefox y WebKit (no se emula), y puntero grueso en Firefox (no se emula).
- La salida animada del popover en Firefox y WebKit: la plataforma la hace instantánea.
- Pruebas vitest y Playwright de bruno: no se corrieron en esta auditoría (solo el CSS cambió).

## Cumplimientos / Correcciones / Pendientes

- **Cumplimientos:** Δ 0 entre vistas en todos los casos, temas y motores; un mes de siete celdas y compacto de 30 px; objetivos ≥ 24 / 44 px; texto ≥ 12 px; contraste ≥ 4,5:1 en texto y ≥ 3:1 en marcas, iconos, foco y huecos en diez temas; foco visible; RTL; `forced-colors`; una sola luz; hoja a 320 y 375 px; movimiento sutil y suave medido cuadro a cuadro, con reducido y con interrupción; consola limpia.
- **Correcciones (coco):** C1, el panel de dos meses vuelve a 770 px (340 por mes), +80 B gzip; C2, elegido y actual / hoy conservan el trazo `{color}-text` (1,92 → 4,53:1 en `spotify`).
- **Pendientes:** B1 (bruno, menor), revisar las pruebas que fijen el ancho de dos meses (bruno), L1 y L2 (lima), lo no verificado de arriba y el README de mora-docs.
