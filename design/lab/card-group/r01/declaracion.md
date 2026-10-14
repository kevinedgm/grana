# Declaración — grupo de tarjetas que filtran (`GCardGroup`), r01: base funcional y tres conceptos

> kiwi, 2026-10-13. Prototipo: `index.html` con los componentes **reales** de `dist/` (`GCard`, `GMetric`, `GTable` con su `GFilterBar`) sobre Vue global, tema por defecto; el grupo de laboratorio (`cardgroup.js`) coordina las tarjetas; geometría de los conceptos en `cardgroup.css` (solo tokens; no es el CSS de coco). Iconos: los de los componentes (Lucide por `GLibIcon`). Verificación: `verificar.mjs`, **424/424** en Chromium (142), Firefox (140: sin las dos pruebas táctiles, que Firefox no emula) y WebKit (142), puerto 4218. La base deriva de HTML, APG y WCAG 2.2; la forma (A/B/C) es **la pregunta de producto** del final.

## Anatomía (base)

```
GCardGroup  <div class="g-card-group" role="toolbar" aria-label|aria-labelledby>      ← barra de herramientas con nombre
├─ GCard (hija, sin cambios de estructura)  <div|article class="g-card is-selected?">
│  └─ <hN class="g-card__title">
│       <button type="button" class="g-card__primary" aria-pressed="true|false"     ← el de siempre (#127, #128)
│               tabindex="0|-1"                                                     ← parada única: lo escribe el grupo
│               aria-describedby="ID-desc ID-content"                               ← descripción + la cifra (L2)
│               aria-controls="ID-tabla">Vencidas</button>                         ← si la aplicación da `controls`
│     <div class="g-card__content" id="ID-content"> GMetric «Facturas 4 ↑ +1 desde ayer» </div>
├─ GCard …
└─ [GCard interaction="none" de total, sin `value`: dentro del grupo, fuera de la parada]
(sin región viva propia: el recuento lo anuncia la tabla, #265 + L3)
```

## Decisiones de la base

**Qué es y qué no es**

1. **`GCardGroup` es un coordinador, no una tarjeta.** Recibe `GCard` hijas por slot (con todo lo que ya saben: `GMetric`, insignia, tendencia, carga) y les da tres cosas que una tarjeta sola no puede tener: **exclusividad**, **una parada de Tab** y **la descripción con su contenido**. No dibuja tarjetas, no conoce la tabla ni hace `fetch`. Nombre reservado por #124; tag `g-card-group`, avisos `[Grana GCardGroup]`.
2. **Ámbito de v1: estado de la vista** (filtros, vistas rápidas), es decir `GCard interaction="toggle"`. Las **tarjetas de formulario** (radio con `name`, casillas con mínimo/máximo y casilla maestra) siguen reservadas como en #124: el radio nativo ya da estado, envío y flechas, y mezclar las dos cosas en un componente obligaría a una API con dos semánticas. Regla de una línea: **¿se envía con el formulario o siempre tiene que haber una? → radios (`GCard selectType="radio"` o `GRadioGroup appearance="card"`). ¿Cambia la vista en el acto y se puede soltar? → `GCardGroup`.**
3. **Frontera con `GTagGroup`:** una etiqueta que filtra (texto corto, sin cifra) es `GTag` de alternar (#462), independiente y con su parada (#465). Una **métrica** que filtra (cifra, tendencia, contexto) es `GCard` dentro de `GCardGroup`.

**Semántica (APG *Toolbar* + *Button* con `aria-pressed`)**

4. **Raíz `role="toolbar"` con nombre** (`label` o `labelledby`; aviso de desarrollo si faltan, como `GTabs` #121). Cada tarjeta conserva su `<button aria-pressed>` dentro del título (#127): «Vencidas, botón de alternar, no presionado».
5. **No es `radiogroup`.** Medido el problema en el caso real: (a) un radio **no se suelta** (HTML y APG; «ninguna» no es un estado del grupo, `radio-group.md` lo resuelve con una opción más) y apagar el filtro es la mitad del uso; (b) en un `radiogroup` **las flechas eligen**: cada flecha filtraría la tabla, la recargaría (con `filterMode: 'external'`, una petición por paso) y anunciaría un recuento por paso. Con botones de alternar, **las flechas solo mueven el foco** y Espacio/Intro filtran.
6. **No es `listbox` ni `aria-selected`** (#128: sin `aria-selected` en tarjetas). **No es `tablist`:** las pestañas siempre tienen una elegida y cambian el panel; aquí se filtra la misma tabla y se puede no filtrar.
7. **No hay modo «siempre una» (`mandatory`).** Un `aria-pressed="true"` que no se suelta al pulsarlo contradice al propio botón. Si la aplicación necesita siempre una, es un radio (decisión 2).

**Modelo**

8. **`v-model` único:** el `value` de la tarjeta pulsada o `null`. Pulsar la pulsada emite `null`. **`multiple`:** arreglo de `value` en el **orden de las tarjetas** (no en el de pulsación: el filtro `in` no tiene orden y así el arreglo es estable), `[]` sin ninguna, nunca `null`. Medido en `multiple`: Pendientes + Vencidas = un solo filtro `{ key: 'estado', op: 'in', value: ['pendiente', 'vencida'] }` y la tabla enseña 8 + 4 = 12 (O dentro del filtro, #111).
9. **El `value` lo pone cada `GCard`** (prop existente, String o Number). Una `GCard` **sin `value`** dentro del grupo es una tarjeta normal (p. ej. «Total 24» con `interaction="none"`): se pinta en la rejilla y queda fuera de la parada. Una tarjeta hija con otra `interaction` explícita avisa (L10).
10. **Sin tarjeta «Todas» interactiva:** se suelta pulsando de nuevo la pulsada o con la × del chip en la barra de la tabla. Una «Todas» de alternar mentiría igual que el modo «siempre una» (decisión 7).

**Teclado (una parada, APG *Toolbar*)**

11. **Tab entra una vez** en: la pulsada (la primera pulsada en `multiple`) → si no hay, la última enfocada → si no, la primera. **Tab sale** del grupo a la tabla. Medido en los tres motores.
12. **← →** mueven el foco (espejo en RTL, medido), **↑ ↓** también, linealmente (en móvil la rejilla tiene dos filas y la persona no tiene por qué saber dónde se parte), **Inicio/Fin** a los extremos, **sin vuelta** (los extremos ya tienen tecla). **Espacio/Intro** alternan. Las flechas **no filtran**.
13. **Foco visible:** el anillo de `GCard` (`:has(.g-card__primary:focus-visible)`) aparece tras la flecha en los tres motores (medido: `:focus-visible` verdadero y `outline-style: solid` en WebKit). **No hace falta `data-g-key-focus`:** son botones, no radios (#441 lo limita a controles que WebKit no marca).
14. **El foco mueve la tarjeta entera a la vista**, no el botón: el botón estirado mide solo el título, y en WebKit `scrollIntoView` sobre él dejaba la última tarjeta a medias en una fila con desplazamiento (medido: 228–404px en una tira de 32–343px). Ver L7.
15. **Tarjetas con controles secundarios** (menú `⋮`, acciones, enlace en el pie): una barra de herramientas con paradas dentro de sus elementos rompe el modelo de una parada. En ese caso el grupo **pasa a `role="group"`** con una parada por tarjeta y por control (la regla de `GTagGroup`, #465), sin flechas, y avisa una vez en desarrollo. No está prototipado: lo decide lima (L5).

**Accesibilidad del contenido y de la relación**

16. **La cifra es parte de la descripción del botón.** Hoy el nombre es solo el título y la cifra queda fuera («Vencidas, botón de alternar» sin el 4). En el grupo, `aria-describedby` del principal = la descripción de la tarjeta (si hay) **más el contenido** (`g-card__content`). Medido: la descripción incluye «Facturas 4 … +1 desde ayer». Es un cambio de `GCard` (L2).
17. **`controls`** (id de la región que se filtra) → `aria-controls` en cada principal. Soporte desigual (JAWS lo ofrece; VoiceOver lo ignora): ayuda, no se depende de él. La relación visible la dan los conceptos.
18. **Anuncio: el grupo no anuncia.** El lector ya dice «presionado» al alternar y el recuento es de quien lo sabe, la tabla (#265: `labels.results` en su región). **Hallazgo medido:** `GTable` solo anuncia cuando el filtro cambia desde **su** barra; un cambio de la prop `filters` desde fuera (la tarjeta) es **silencioso** en los tres motores. El prototipo lo **emula** con una región de laboratorio que copia el recuento visible de la tabla («4 facturas») para mostrar el resultado propuesto (L3).
19. **Una sola verdad con los filtros.** La tarjeta no guarda un estado aparte: la aplicación traduce el `v-model` del grupo a `filters` de la tabla y **lo lee de ellos** (receta de cinco líneas, `bridgeFilters` en `cardgroup.js`). Medido: pulsar crea el chip «Estado: vencida» en la barra; **quitar el chip suelta la tarjeta**; pulsar otra sustituye el filtro (un filtro por campo, `filter-bar.md`). Si la barra deja dos estados en un grupo único, ninguna tarjeta aparece pulsada (ninguna lo describe). Ver L4.

**Forma, rejilla y móvil**

20. **Rejilla que llena** (`auto-fit`, mínimo `space × 34`): cuatro en una fila a 1200px y **dos columnas a 375px** con el margen de 16px (medido; con `space × 38` caía a una columna y las cuatro métricas ocupaban una pantalla). Sin container queries con `var()` (#130): cada `GCard` ya mide su caja.
21. **Pulsar no mueve nada:** Δ 0,00px en las cuatro cajas al pulsar, soltar y cambiar, en base, A, B y C (medido relativo al documento).
22. **Estados heredados de `GCard`:** `disabled` (fuera de la parada, como un botón deshabilitado), `loading` (esqueleto sin enfocables, fuera de la parada), personalidad C2 (el tinte nace de la marca) y C1 (luz del puntero) intactas. Un filtro con 0 resultados no se deshabilita: la tabla enseña su vacío con causa (`GEmpty cause="filtered"`, #540).

## Los tres conceptos

Los tres comparten la base entera (semántica, teclado, modelo, una sola verdad). Cambia **cómo se nota que filtran y qué filtran**.

### A · Lengüeta — «la elegida se une a lo que filtra»

Las tarjetas se apoyan en el borde de la tabla como lengüetas de carpeta: esquinas inferiores rectas y una ranura de `space × 2` entre ellas y el marco. **En reposo** ya dicen «soy la cabeza de esa tabla». **Al pulsar**, un puente (`aria-hidden`) cierra la ranura bajo la tarjeta, su borde doble baja y **se continúa en el marco de la tabla**, que toma el color de la marca (`primary-text`): el ojo va de la tarjeta al chip y al recuento sin buscar. **Al cambiar** de tarjeta, el puente viaja como el borde de la marca de `GTabs` (`--g-duration-press`, `--g-ease-out`); al aparecer crece desde la tarjeta (`--g-duration-slow`, `--g-ease-out`, sin muelle: #299 lo limita a dos usos). **Movimiento reducido:** solo fundido. **Móvil:** una sola fila que se desplaza (dos filas romperían el contacto con la tabla); la tira no es parada de Tab (L6).

- **Gana:** responde a las dos preguntas a la vez (es un filtro / filtra esto); conserva la tarjeta de métrica completa; el estado se dice con **forma** (el borde que se abre hacia la tabla), no con un tinte.
- **Arriesga:** exige la tabla **justo debajo** (si la aplicación pone algo en medio, la lengüeta no tiene a qué unirse: hay que degradar a la base); puede leerse como pestañas (siempre una) hasta que se suelta la primera vez; en móvil hay tarjetas fuera de la vista.
- **Medido:** puente con x y ancho Δ 0,00px respecto de la tarjeta, nace en su borde inferior (Δ 0,00) y cubre exactamente el borde de la tabla (2/2px, el borde de `2 × --g-border-width`); un solo puente al cambiar; se retira al soltar; RTL igual; con `reduce` solo `opacity`.

### B · El todo y sus partes — «se apaga lo que queda fuera»

Las tarjetas son **las partes de un total** y lo dicen con su **ancho**: cada una ocupa su proporción de la fila (con mínimo legible) y lleva su porcentaje («42 % del total»). **Al pulsar no se ilumina la elegida: se vacían las demás** (pierden el relleno `surface-sunken` y pasan a contorno discontinuo `border-control`, con el texto aún a ≥ 4.5:1), y una línea dice «**4** de 24 facturas · 17 %». Lo que se ve es **lo que queda fuera** del filtro, que es lo que la persona deja de ver en la tabla.

- **Gana:** cambia la pregunta de «¿cuál elegí?» a «¿qué parte del total estoy mirando?»; los anchos hacen visible el reparto sin un gráfico aparte.
- **Arriesga:** **solo vale si las métricas reparten un total** (estados de una misma cosa); con métricas cruzadas («Vencidas» y «Mayores de $10,000») los anchos mienten; las cifras no se alinean entre tarjetas de anchos distintos; al envolver en móvil la proporción se pierde.
- **Medido:** Pagadas 10 > Pendientes 8 > Vencidas 4 en ancho; fuera = `dashed` (forma, no solo color); lo de fuera a 6,90:1 en claro (≥ 4.5:1 también en oscuro); «4 de 24 facturas».

### C · La frase — «no hay tarjetas: hay un titular con cifras»

Cuestiona la premisa entera: las métricas que filtran **son el titular de la tabla**. «**24** facturas: **8** pendientes, **4** vencidas, **10** pagadas y **2** en disputa. Se ven todas.» Cada cifra con su palabra es un botón de alternar (subrayado de puntos: «esto se pulsa»). Al pulsar, la elegida gana relleno `primary-soft` y subrayado **continuo** grueso, las demás se atenúan, y **la cola** de la frase dice «Se ven solo las 4 vencidas.». Lo que cambia va **al final**: ninguna cifra se mueve bajo el puntero (medido Δ 0). Se parte como texto en móvil; con puntero grueso cada cifra mide ≥ 44px de alto.

- **Gana:** lo más compacto (una línea en escritorio, tres en móvil, sin tarjetas de 150px de alto); se lee de corrido con lector; une la cifra a la palabra en el propio nombre («4 vencidas»).
- **Arriesga:** **pierde la tendencia y el contexto** de la métrica (no caben en una frase); el plural y el orden de la frase son de la aplicación (idiomas); no hay sitio para un gráfico o una insignia; una frase de seis cifras deja de leerse como frase.
- **Medido:** nombres «4 vencidas»; cola correcta; pulsada `solid` frente a `dotted` (forma); contraste de la pulsada 14,46:1 y de las atenuadas 7,46:1 en claro (12,82 y 9,29 en oscuro).

## Comparativa

| | Base | A · Lengüeta | B · El todo y sus partes | C · La frase |
| --- | --- | --- | --- | --- |
| ¿Se nota en reposo que filtran? | No | **Sí**: apoyadas en la tabla | A medias: parecen un reparto | **Sí**: titular de la tabla |
| ¿Se ve qué filtran? | No | **Sí**: el puente lleva al chip y al recuento | Por cercanía | **Sí**: la cola lo dice |
| Señal de la elegida | Borde doble + tinte | Borde que se abre hacia la tabla | Las demás se vacían | Relleno + subrayado continuo |
| Conserva tendencia y contexto | Sí | Sí | Sí (+ porcentaje) | **No** |
| Móvil 375px | 2 columnas | Una fila que se desplaza | Envuelve; pierde la proporción | Texto que se parte |
| No sirve si… | — | la tabla no está justo debajo | las métricas no reparten un total | la métrica es rica o la frase no se puede redactar |
| Coste de construir | Bajo | Medio (medir el puente, como la marca de `GTabs`) | Bajo (CSS) | Medio (otro dibujo, sin `GCard`) |
| Semántica y teclado | Iguales en los cuatro | | | |

## Recomendación

**A · Lengüeta por defecto**, con **C · La frase como `appearance`** para cabeceras densas y móvil (comparten todo salvo el dibujo), y **B reservada** con su nombre (su condición —métricas que reparten un total— no se puede comprobar desde el componente y fallaría en silencio). Si el usuario prefiere no tener dos apariencias en v1, A sola.

## Qué lo hace distinto

1. **La tarjeta elegida se une a la tabla que filtra** (A): el estado no es «iluminarse» sino **abrirse hacia el resultado**; la relación causa → efecto se ve en el espacio y el ojo cae en el chip y el recuento. Sirve a quien no sabe que esas tarjetas filtran (lo dicen en reposo) y a quien vuelve a la pantalla y quiere saber por qué la tabla tiene 4 filas.
2. **Las flechas no filtran** (base): una parada para todas las métricas, recorrido con flechas **sin** recargar la tabla en cada paso. Más rápido con teclado que N paradas y sin la cascada de peticiones y anuncios de un `radiogroup`.
3. **Una sola verdad** (base): la tarjeta pulsada y el chip de la barra son dos vistas del mismo filtro; quitar uno suelta el otro. Lo que la integración real hacía a mano desaparece, y nunca hay una tarjeta encendida con la tabla sin filtrar.
4. **La cifra se oye** (base): el lector dice «Vencidas … Facturas 4, +1 desde ayer» y no solo «Vencidas».
5. **Lo que cambia nunca está bajo el puntero** (base, A, B, C): pulsar no mueve ninguna caja ni ninguna cifra (Δ 0 medido en los cuatro).

Nada de esto toca contraste, foco ni movimiento reducido: el puente se funde con `reduce`, el estado siempre lleva forma (borde abierto, contorno discontinuo, subrayado continuo) además del color, y en `forced-colors` el puente, el marco y la cifra pulsada usan `Highlight`.

## Comprobaciones (`verificar.mjs`, puerto 4218)

**424/424**: Chromium 142, Firefox 140, WebKit 142. Por concepto (base, A, B, C): `role="toolbar"` con nombre; cuatro `<button type="button">`; una sola parada; `aria-controls` a la tabla; todas sin pulsar al montar; cifra en la descripción (C: en el nombre); pulsar → solo esa pulsada, 4 filas, chip en la barra, recuento anunciado (emulación de L3) y **L3 confirmado** (la región de `GTable` calla); Δ 0 en las cajas; volver a pulsar suelta y vuelve a 24; exclusiva; quitar el chip suelta la tarjeta. Teclado (base, A, C): Tab entra en la primera; → mueve sin filtrar; foco visible tras la flecha; Espacio filtra; Fin/Inicio; ← en la primera no da la vuelta; volver con Tab entra en la pulsada con una sola parada; Intro suelta; Tab sale. RTL: ← avanza, → retrocede; el puente sigue a la tarjeta. Múltiple: dos pulsadas, 12 filas, un solo filtro `in` con dos valores, soltar una deja la otra. Móvil 375: sin desplazamiento horizontal de la página, base en dos columnas, A en una fila que se desplaza, Tab entra en una tarjeta (no en la tira), Fin trae la última a la vista; con toque (Chromium y WebKit) cifras de C ≥ 44px y tocar filtra. Oscuro + `reduce`: contrastes de B y C ≥ 4.5:1, el puente solo se funde, sin errores ni avisos en consola.

**No verificado:** lector de pantalla real (VoiceOver, NVDA, TalkBack) sobre la barra de herramientas con tarjetas que contienen encabezados (el modo exploración de NVDA podría leer el `h3` y el botón por separado) y sobre `aria-describedby` con el contenido de la métrica; `forced-colors` real; el caso de tarjetas con controles secundarios (decisión 15, sin prototipo); `filterMode: 'external'` con carga real.

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombre, entrega y peso | `GCardGroup` (`g-card-group`). Es pequeño (coordina, no dibuja), pero el principal tiene el margen agotado (#506, #550): abre la valoración de #506. Alternativa: con `GCard` en el principal y el grupo en una entrada propia `@grana/vue/card-group`. Decide lima |
| L2 | La cifra en la descripción (cambio de `GCard`) | Dentro de un `GCardGroup`, el `aria-describedby` del principal de `GCard` = descripción + `g-card__content` (id nuevo `ID-content`). Fuera del grupo no cambia (o se valora para todo `toggle`/`button`: la métrica de una tarjeta pulsable tampoco se oye hoy). Enmienda de `card.md` «ARIA»; bruno |
| L3 | **`GTable` calla ante un cambio externo de `filters`** (medido en los tres motores) | Enmienda de #265 en `table.md`: la tabla anuncia `labels.results` cuando cambian los filtros efectivos **desde cualquier vía** (su barra o la prop), con la misma regla de carga (#540: con `external`, al terminar la carga). Afecta a toda aplicación que filtre desde fuera (tarjetas, búsqueda propia, URL), no solo a este grupo. bruno |
| L4 | Una sola verdad con los filtros | **Receta documentada** (get/set entre el `v-model` del grupo y `filters`), **sin** enlazar `GCardGroup` con `GTable` (funciona solo, como `GFilterBar`). Reservar con nombre un atajo `filterKey` + `v-model:filters` si la receta se repite. Semántica de la lectura: grupo único pulsado solo si el filtro del campo tiene **exactamente** un valor conocido |
| L5 | Tarjetas con controles secundarios | Paso automático a `role="group"` con todas las paradas y sin flechas (#465), con aviso; o prohibirlo con aviso y documentarlo. Recomiendo el paso automático (no rompe a quien ya tiene `menu` en sus tarjetas) |
| L6 | Contenedor con desplazamiento como parada en Firefox (medido) | Toda tira desplazable cuyos hijos usan `tabindex` itinerante lleva `tabindex="-1"` en el contenedor; si no, Firefox añade una parada en la tira. Regla para `api.md` (también vale para otros desplazables con foco itinerante) |
| L7 | `scrollIntoView` sobre el control estirado (medido en WebKit) | Al mover el foco itinerante, traer a la vista **la tarjeta** (`.g-card`), no el `g-card__primary`. bruno |
| L8 | `interaction` de las hijas | Dentro del grupo, `auto` resuelve a `toggle` en las tarjetas con `value`; otra `interaction` explícita avisa; sin `value`, la tarjeta es estática y queda fuera de la parada |
| L9 | API mínima propuesta | `modelValue` (`value`\|`null`, o Array con `multiple`), `multiple`, `label`/`labelledby`, `controls`, `density` (se reparte a las hijas, como `GForm`), `appearance` (según la elección: `tab` = A, `sentence` = C), `columns`/mínimo de rejilla solo si coco lo necesita. Eventos `update:modelValue` y `change` `{ value, pressed }` (el gesto, como `GCombobox` `change`). Sin textos propios (`labels`): el grupo no escribe texto, salvo C, que necesita la plantilla de la cola (`labels.showing` con `{count}` y `{label}`, y `labels.all`) y la unión de la frase (`Intl.ListFormat`) |
| L10 | Tokens | **Ninguno nuevo** en A, B ni C: `border-strong`, `primary-text`, `card-selected`, `surface`, `surface-sunken`, `border-control`, `primary-soft`/`on-primary-soft`, `card-hover`, `duration-press`/`slow`/`fast`, `ease-out`. La ranura de A (`space × 2`) y el mínimo de rejilla (`space × 34`) son constantes de diseño como los umbrales de #130 |
| L11 | Personalidad (si gana A) | Registrar en `DECISIONS.md`: el puente es un **uso de movimiento** de la familia de la marca de `GTabs` (borde que avanza con `ease-out`), **sin** `--g-ease-spring` (#299 limita sus usos); con `reduce`, fundido |
| L12 | `PENDIENTES.md` | La fila `GCardGroup` pasa a «ronda r01 hecha, pendiente de elección»; las tarjetas de formulario (mínimo/máximo, casilla maestra) siguen reservadas (#124) |

## Pregunta de producto (una)

**¿Qué forma quieres por defecto para las tarjetas que filtran?**

- **A · Lengüeta:** la tarjeta elegida se une a la tabla que filtra (recomendada).
- **B · El todo y sus partes:** anchos proporcionales; al elegir se vacían las demás.
- **C · La frase:** sin tarjetas; un titular con cifras que se pulsan.

Y, si eliges A: ¿añadimos **C como apariencia** para móvil y cabeceras densas en la misma entrega, o A sola en v1?
