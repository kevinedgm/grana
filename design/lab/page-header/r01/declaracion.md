# Declaración — encabezado de página (`GPageHeader`, nombre de trabajo), r01: base funcional y conceptos A, B y C

> kiwi, 2026-10-13. Prototipo: `index.html?c=base|A|B|C` (`?c=B&final=C` = la recomendación; `&zone=brand`, `&theme=nsa`, `&tabs=0`, `&dir=rtl`), motor `ph.js`, CSS `ph.css` (base con neutros del tema; A, B y C con los tokens reales del tema por defecto, `dist/grana.css`; segundo tema, el de NisaNabani, generado con `@grana/cli`). Iconos solo Lucide vía `design/lab/lucide-icons.js`. Verificación: `node design/lab/page-header/r01/verificar.mjs` (puerto 4215), **258/258** en Chromium, Firefox y WebKit. La base deriva de HTML (`header`, `h1`, `nav`), WAI-ARIA APG (*Tabs*, *Breadcrumb*), WCAG 2.2 (1.3.1, 1.3.2, 1.4.10, 2.4.3, 2.4.6, 2.4.11, 2.5.8) y los contratos vigentes. **Preguntas de producto: la elección de concepto (una).** **Dependencia abierta:** el mecanismo de la zona de marca (`design/lab/surface/r02/`), §«Dependencia».

## Anatomía (base)

```
main                                                       ← de la aplicación; el encabezado es su primer hijo (receta)
└─ header.g-page-header                                    ← sin rol de banner (dentro de main); sin landmark propio
   ├─ [slot trail]  <GBreadcrumbs>  nav[aria-label] > ol > li > a[aria-current="page"]     ← único landmark del encabezado
   ├─ div.__head
   │  ├─ div.__titles
   │  │  ├─ p.__eyebrow                       (opcional, como GCard)
   │  │  ├─ h1.__title#ID-title tabindex="-1" dir="auto"   ← h1 único de la página
   │  │  ├─ p.__desc                          (opcional)
   │  │  └─ [slot meta]                       (GBadge, GTag, GSummary, texto)
   │  └─ div.__actions-slot                    ← el hueco: guarda su tamaño si las acciones se mudan (A, C)
   │     └─ div.__actions role="group" aria-label="{labels.actions}"   [slot actions: GBtn, GMenu]
   ├─ div.__band   (solo A)  aria-hidden mientras no se ve; sin rol
   ├─ div.__dock   (solo C y la recomendación)  idem
   ├─ div.__content  [slot default]            (GMetric, GAdaptiveLayout…)
   └─ div.__base   («zócalo», última fila)
      ├─ span.__base-title aria-hidden="true"  (solo B: el título compacto, copia visual)
      ├─ [slot tabs]  <GTabs detached>          (los paneles, GTabPanel en el cuerpo de la página, #118)
      └─ (B) el hogar de las acciones
```

## Decisiones de la base

**Semántica y orden**

1. **Raíz `header`, dentro de `main`, sin rol de `banner`.** El `banner` es la barra de la aplicación; un `header` dentro de `main` no es un punto de referencia (HTML-AAM). Receta: el encabezado es el **primer hijo de `main`**, así «Saltar al contenido» cae en él. Medido en los tres motores: un solo `banner` (la barra de la aplicación) y el encabezado dentro de `main`. Sin `role` propio ni `aria-label` en la raíz: no añade un punto de referencia que nadie busca. El único landmark del encabezado es la ruta (`nav` del `GBreadcrumbs`).
2. **`h1` único de la página**, con `headingLevel` 1 por defecto (L3: 1 a 3 para un encabezado dentro de una vista anidada, p. ej. un panel de detalle o un `GDialog` a pantalla completa con su propio `h2`). En desarrollo, aviso si con nivel 1 hay otro `h1` en el documento al montar. Medido: un `h1`, con el texto de la página. `dir="auto"` en el título (#282).
3. **`h1` enfocable por programa (`tabindex="-1"`) y método `focus()`.** `GBreadcrumbs` no mueve el foco al navegar («llevarlo al `h1` de la página nueva es de la aplicación»): el encabezado le da a la aplicación **dónde** llevarlo, con un método público, sin decidir **cuándo**. El anillo solo con `:focus-visible`.
4. **Orden del DOM = orden de lectura = orden del Tab:** ruta → eyebrow → `h1` → descripción → `meta` → acciones → contenido → zócalo (pestañas). El eyebrow va antes del `h1` como en `GCard`. Medido con `compareDocumentPosition` en los tres motores. Ni `order` ni `grid-area` que reordenen lo que se lee (1.3.2, 2.4.3).
5. **Acciones en un `role="group"` con nombre** (`labels.actions`, sin valor por defecto; aviso si falta y hay acciones). Las pone la aplicación (`GBtn`, `GMenu`): el encabezado no tiene un modelo de acciones como datos (las acciones de la aplicación ya tienen estado: carga, menú abierto, `tooltip`). **Una sola acción sólida de marca** (`tokens.md` §2): la principal; el resto `outline`/`ghost` o dentro de «Más acciones».
6. **Estrecho por el ancho del propio encabezado, no del dispositivo:** un `ResizeObserver` sobre la raíz (como `GCard`, #130) pone `data-narrow` por debajo de un umbral de coco (el prototipo usa 600 px). Estrecho = la cabecera apila título y acciones, y el slot `actions` recibe **`{ narrow }`** para que la aplicación pase las secundarias a su `GMenu` «Más acciones» (el prototipo las oculta para mostrarlo). Sin motor de prioridad propio en v1 (L5). Medido a 390 px: sin desbordamiento horizontal en ningún concepto.
7. **Ruta por slot `trail` con el `GBreadcrumbs` real** (no un `items` duplicado): conserva sus `labels`, puertas, etapas y `navigate`. El encabezado necesita el **padre** para «Subir» (franja de A): `GBreadcrumbs` se registra en el encabezado por `provide/inject` (L4). Sin ruta, no hay «Subir».
8. **Contenido** (slot por defecto: métricas, `GAdaptiveLayout`) y **pestañas** (slot `tabs`, última fila) son de la aplicación. Con `GTabs` el caso es el de paneles separados (`GTabPanel`, `detached`, #118): las pestañas en el encabezado y los paneles en el cuerpo de la página.
9. **Táctil:** con `pointer: coarse`, todo lo que se pulsa dentro del encabezado, la franja, el zócalo y el muelle mide ≥ 44 × 44 (enlaces de la ruta, «Subir», título de la franja, acciones, pestañas). Medido a 390 px en los tres motores (Chromium con `isMobile`, Firefox y WebKit con `hasTouch`).
10. **RTL:** todo con propiedades lógicas; la franja sigue la caja del encabezado y el muelle va al final lógico (izquierda en RTL). Medido.
11. **Zona de marca: el encabezado solo lee tokens.** Sobre la superficie normal y sobre la zona (navy de NisaNabani o el `brand` del tema por defecto) funciona **sin prop propia** si la zona redefine los tokens en la raíz del encabezado. Supuesto del prototipo y dependencia: §«Dependencia». Contraste medido con la zona: tema por defecto `h1` 16,48:1, descripción y ruta 10,37:1, principal 16,48:1, foco 16,48:1; NisaNabani `h1` 11,57:1, descripción y ruta 7,78:1, principal (lima con `on-accent`) 10,88:1 y su relleno 6,95:1 sobre el navy, foco lima 6,95:1.

**Franja: reglas comunes a los tres conceptos** (lo que cambia es la forma, §A, §B, §C)

12. **Entrada pública `--g-page-header-top`** (longitud, como `--g-accordion-sticky-top`, #484): el alto de la cabecera fija de la **aplicación**. La franja se coloca debajo, nunca encima. Medido: la franja empieza en 56 px, el alto de la barra del laboratorio.
13. **Receta de `scroll-padding` (#515):** la cabecera fija es de la aplicación y la suma una vez: `scroll-padding-block-start: calc(var(--app-header) + <alto de la franja>)`. El alto de la franja es una **constante de diseño** (`space × 12` en el prototipo) para que la receta no dependa de JS (L7). Medido: el título de la franja lleva al `h1` y el `h1` queda visible bajo la barra (2.4.11).
14. **Nada se copia.** Ni el `h1` (la franja y el zócalo no tienen encabezados; el título compacto de B es `aria-hidden`, el de A y C es un **enlace al `h1`**), ni las acciones: o no se mueven (B) o **se mudan los mismos nodos** (A y C; en Vue, `Teleport` con `disabled` conmutado, que conserva instancia y estado). Medido en los tres motores: cada acción existe una vez antes, durante y después.
15. **El hueco guarda su tamaño.** Cuando las acciones se mudan, su sitio en la cabecera conserva alto y ancho: **la página no se mueve** (medido: Δ 0 px del contenido al pegar y al volver, en A, B y C).
16. **Lo que tiene el foco no se muda.** Si el foco está dentro de las acciones, la mudanza espera a que salga (medido: con el foco en «Editar» y la cabecera fuera de vista, las acciones se quedan; al salir el foco, se mudan). Así el foco nunca se pierde por un desplazamiento con rueda o con el lector.
17. **El orden de lectura no cambia al mudarse:** la franja y el muelle están en el DOM **justo después de la cabecera**, así que las acciones mudadas siguen después del `h1` y antes del contenido (medido). Con la franja oculta, `hidden` + `inert`: fuera del árbol y del Tab.
18. **Sin anuncios.** Aparecer la franja es consecuencia del desplazamiento del propio usuario y no cambia el contenido: nada en regiones vivas (4.1.3 no aplica). Sin rol para la franja ni el muelle (no son puntos de referencia: no hay nada nuevo que encontrar).
19. **La franja nunca ocupa más de un cuarto del alto visible.** Con zoom de 200–400 % o un teléfono apaisado, no aparece (A, C) o no se pega (B). Medido con un visor de 1280 × 180: A no muestra la franja, B queda estático. Es la forma de cumplir 1.4.10 sin que lo pegado se coma la pantalla.
20. **Bordes compartidos (`edgeReserve`, #322):** la franja reserva el borde de arriba y el muelle el de abajo, con un orden **anterior a voz → isla → avisos** (la estructura de la página va primero). La reserva es la del **sitio final** (alto de caja, no la traslación en curso), así los avisos no persiguen la animación. Medido con el aviso de prueba: debajo de la franja (A, B) y encima del muelle (C).
21. **Movimiento reducido:** nada se desliza; los estados intermedios ligados al desplazamiento se vuelven 0 o 1 (medido: `p ∈ {0, 1}`; el muelle sin transición).
22. **El encabezado debe ser hijo directo del contenedor largo.** B usa `position: sticky` sobre la raíz (y A y C miden la caja del encabezado): un envoltorio de la aplicación (o de la zona de marca) alrededor del encabezado limita el pegado a ese envoltorio. Aviso en desarrollo si el padre mide lo mismo que el encabezado (L11). **Restricción para la zona de marca** (§«Dependencia»).
23. **Primer pintado sin JS (SSR):** sin medir, la base: el encabezado se va con la página (sin franja en A y C; sin pegado en B, que necesita su alto). Nada salta al hidratar: la franja aparece solo al desplazar.
24. **Lo que no hace:** no navega, no pide datos (sin `fetch`), no mueve el foco al cambiar de ruta por su cuenta (ofrece `focus()`), no pinta la barra de la aplicación, no tiene «volver atrás» (subir no es atrás, como en `GBreadcrumbs`).

## Estados medidos (base)

Reposo · estrecho (390, táctil) · con y sin pestañas · zona de marca (tema por defecto y NisaNabani) · RTL · desplazado (base: el encabezado se va, las acciones no se mueven) · consola limpia. Forzados: reglas escritas (borde `CanvasText` en franja, zócalo y muelle; marca de la pestaña en `Highlight`), sin medir.

---

## A · Relevo

**Estructura.** Una franja (`__band`) bajo la barra de la aplicación, con **la caja del encabezado** (no la de la ventana: no tapa la barra lateral), y dentro: «Subir a {padre}» (`arrow-up`, el padre del `GBreadcrumbs` registrado), el **título como enlace al `h1`** y el hueco de las acciones.

**Comportamiento.** No es una cabecera que encoge ni una copia que aparece: es un **relevo**. Mientras el `h1` pasa bajo el borde, la franja baja desde detrás de la barra de la aplicación **al ritmo del desplazamiento** (`--p` de 0 a 1 ligado a la posición del `h1`, sin temporizadores) y el título sube a ella; cuando el `h1` se ha ido, **las mismas acciones se mudan** a la franja (y vuelven al subir, con histéresis 0,95 / 0,25 para no titubear en el umbral). Pulsar el título lleva al `h1` con el foco, y la franja se retira.

**Movimiento.** Ligado al dedo (reversible por definición: si el usuario se detiene a medias, la franja se detiene a medias). Las acciones llegan con una traslación corta desde su sitio (FLIP, `--g-duration-slow` + `--g-ease-spring`: desplazamiento que llega, #299). Reducido: la franja aparece entera de golpe y las acciones sin traslación.

### Qué lo hace distinto (A)

La franja de los frameworks **aparece** (de golpe o con un temporizador) y **duplica**. Esta **se gana con el desplazamiento**, a la velocidad de la mano, y no tiene nada propio: el título es un enlace al `h1` real y las acciones son las de la cabecera, que se mudan con su estado. El usuario ve de dónde vienen.

### Gana y arriesga

- **Gana:** la forma que todos reconocen (acciones arriba a la derecha, siempre); «Subir» a mano; con o sin pestañas igual.
- **Arriesga:** las **pestañas no llegan** a la franja (en «Resultados», a media página, cambiar de pestaña obliga a subir); más JavaScript (posición `fixed` alineada a la caja del encabezado, mudanza de nodos, medición por cuadro); en un teléfono el título de la franja queda en 4–6 letras junto a la principal.

### Medidas (A)

| Medida | Resultado (tres motores) |
| --- | --- |
| Arriba | Franja `hidden` (fuera del árbol), acciones en la cabecera, `p = 0` |
| `h1` a medio pasar | `0,2 < p < 0,8` (ligado al desplazamiento) |
| Pasado el `h1` | `p = 1`, acciones en la franja, franja en `top = 56` y con el ancho y la `x` del encabezado (no sobre la barra lateral), cada acción una vez, contenido Δ 0 |
| Foco en «Editar» y desplazar | Las acciones esperan; al salir el foco, se mudan |
| Título de la franja | Foco en el `h1`, visible bajo la barra; la franja se retira |
| Aviso de prueba | Debajo de la franja (reserva = 56 + 48 + 8) |
| Reducido / visor 180 px | `p ∈ {0, 1}` / la franja no aparece |
| 390 táctil · RTL | Objetivos ≥ 44 × 44, sin desbordar · la franja sigue al encabezado |

**Coste:** medio-alto (franja fija medida a la caja del encabezado, mudanza con `Teleport`, cálculo por cuadro).

---

## B · Zócalo

**Estructura.** La premisa cuestionada: «hace falta una franja». No la hay. **Las acciones viven en la última fila del encabezado**, el zócalo, junto a las pestañas (en reposo también: es la forma estática de B). El título, la descripción, el estado y las métricas quedan arriba, para leer.

**Comportamiento.** La raíz es `position: sticky` con `top: calc(var(--g-page-header-top) − <alto hasta el zócalo>)`: el encabezado **entero se hunde bajo el borde** hasta que solo asoma el zócalo, y ahí se queda. **No encoge, no se copia, no se muda nada** (0 mudanzas medidas): las pestañas y las acciones que estaban abajo siguen ahí. Al pasar el `h1` bajo el borde, el **título compacto** (copia visual `aria-hidden`) aparece al principio del zócalo, ligado al desplazamiento. Al **cambiar de pestaña pegado**, la página se coloca para que el panel nuevo empiece justo bajo el zócalo (si la página ya no da para tanto, el panel queda igualmente visible justo debajo: medido con un panel corto).

**Movimiento.** El título compacto sube a su sitio con el desplazamiento; el zócalo pegado gana un borde y `--g-shadow-2`. Reducido: el título aparece entero.

### Qué lo hace distinto (B)

Ningún encabezado de framework **se hunde**: o encogen (y la página salta) o pintan otro encima. Este se queda **con su forma**, y lo que asoma no es un resumen inventado sino **la fila que ya tenía lo que se usa a media página**: las pestañas y las acciones. Es el único concepto en el que se puede cambiar de sección sin volver arriba, y el único sin JavaScript de mudanza: una sola medida (el alto hasta el zócalo).

### Gana y arriesga

- **Gana:** cero copias y cero mudanzas (lo más robusto con lector, foco y estado); las pestañas a mano a media página; alineado a la columna sin medir la ventana (es `sticky`, no `fixed`); lo más barato.
- **Arriesga:** **las acciones abajo** no es donde se las espera en escritorio (arriba a la derecha); exige que el encabezado sea hijo directo del contenedor largo (punto 22); **en un teléfono** el zócalo reparte el ancho entre pestañas y acciones (la principal queda en su icono, con nombre accesible y la pista del `tooltip`).

### Medidas (B)

| Medida | Resultado (tres motores) |
| --- | --- |
| Reposo | Acciones en el zócalo, después de las pestañas |
| Pegado | Zócalo en `top = 56`; el encabezado mantiene su alto (se hunde, no encoge); 0 mudanzas; título compacto opaco y `aria-hidden`; contenido Δ 0; reserva = 56 + 48 + 8 |
| Cambiar de pestaña pegado | Panel largo: sigue pegado y el panel empieza bajo el zócalo · panel corto: visible justo debajo |
| Teclado de pestañas pegadas | ←/→ como siempre |
| Reducido / visor 180 px | Sin estados intermedios / `position: static` |
| 390 táctil | Pegado sin desbordar; principal en su icono con nombre; objetivos ≥ 44 × 44 |

**Coste:** bajo.

---

## C · Muelle

**Estructura.** La premisa cuestionada: «lo condensado va arriba». Arriba **no queda nada** del encabezado (la lectura recupera toda la pantalla bajo la barra de la aplicación). Las acciones bajan a un **muelle**: en escritorio, una píldora flotante al final de la columna; en un teléfono, una barra de borde a borde con el área segura. Lleva el título como enlace al `h1` y las mismas acciones.

**Comportamiento.** Cuando el `h1` sale por arriba (histéresis de un alto de `h1`), el muelle se abre y las acciones se mudan a él (mismas reglas 14 a 17). Abajo, en el **área del pulgar**, donde un teléfono se maneja con una mano. Reserva el borde inferior: los avisos se apilan encima.

**Movimiento.** El muelle sube desde abajo con `--g-duration-slow` + `--g-ease-spring` y se va con `--g-duration-press` + `--g-ease-out`. Reducido: aparece y desaparece sin moverse.

### Qué lo hace distinto (C)

Las cabeceras condensadas le quitan altura a la lectura justo cuando se está leyendo. Esta **se la devuelve entera** y pone lo que se hace donde se hace con una mano: abajo. Las acciones viajan con su estado; no hay una «barra de acciones» paralela.

### Gana y arriesga

- **Gana:** máximo espacio de lectura; ergonomía de teléfono; nada tapa los `#id` arriba (la receta de `scroll-padding` no cambia).
- **Arriesga:** en escritorio una píldora abajo es inusual y **compite con los avisos, la isla abajo y la píldora de la voz** (todo el borde inferior); sin ruta ni pestañas al desplazar; mudanza de nodos como A.

### Medidas (C)

| Medida | Resultado (tres motores) |
| --- | --- |
| Pasado el `h1` | Muelle abierto con las acciones; del encabezado no queda nada arriba; alineado al final de la columna (`right` = encabezado − `space × 6`) |
| Sin copias · contenido | Una vez cada acción · Δ 0 |
| Aviso de prueba | Encima del muelle (reserva del sitio final) |
| Arriba otra vez | Muelle `hidden` + `inert`, acciones de vuelta |
| Reducido | Sin transición |
| 390 táctil · RTL | Barra de borde a borde abajo, objetivos ≥ 44 × 44 · el muelle va a la izquierda |

**Coste:** medio.

---

## Comparativa

| | Base | A · Relevo | B · Zócalo | C · Muelle |
| --- | --- | --- | --- | --- |
| Qué queda al desplazar | Nada | Subir + título + acciones, arriba | La última fila: pestañas + acciones (+ título compacto) | Título + acciones, abajo |
| Pestañas a media página | No | No | **Sí** | No |
| Copias en el árbol | — | 0 (se muda) | **0 (nada se mueve)** | 0 (se muda) |
| Mudanzas de nodos | — | Sí | **No** | Sí |
| Posicionamiento | — | `fixed` medido a la caja del encabezado | **`sticky`** (sigue a la columna solo) | `fixed` medido |
| Alto que quita a la lectura | 0 | 48 px | 48 px | 0 arriba (el muelle flota abajo) |
| Teléfono | — | Título en pocas letras | Principal en su icono | **Barra del pulgar** |
| Choca con | — | La isla arriba (reserva) | La isla arriba (reserva) | Avisos, isla abajo y voz (reserva) |
| Movimiento propio | — | La franja baja con el dedo; las acciones llegan | El encabezado se hunde; el título sube al zócalo | El muelle sube con resorte |
| Coste | Bajo | Medio-alto | **Bajo** | Medio |
| Riesgo principal | Se pierde todo al desplazar | Más JS; sin pestañas | Acciones abajo en escritorio; ancho en teléfono | Inusual en escritorio; borde inferior lleno |

## Recomendación

**B · Zócalo por defecto, con el muelle de C como su forma estrecha.** Se ve en `?c=B&final=C` (medido en los tres motores: en escritorio se comporta como B, sin muelle; a 390 px, al pegarse, **el zócalo se queda con las pestañas a todo lo ancho y las acciones bajan al muelle** con la principal y su texto; arriba otra vez, vuelven al zócalo; sin copias ni desbordamiento).

- **B** porque es la única forma sin copias ni mudanzas en escritorio, deja las pestañas a mano a media página (la página de detalle con secciones es el caso de NisaNabani), es `sticky` y no mide la ventana (barra lateral incluida), y es lo más barato.
- **El muelle de C en estrecho** porque resuelve el punto débil de B (el teléfono reparte el ancho entre pestañas y acciones) con lo mejor de C (el pulgar), y solo ahí paga la mudanza. No es un modo que la aplicación elija: es lo que B hace cuando el encabezado es estrecho.
- **A** queda como alternativa si el producto exige las acciones arriba a la derecha en escritorio también al desplazar.

## Qué lo hace distinto (resumen de la recomendación)

Un encabezado que **no encoge ni se copia: se hunde**. Al desplazar, la página sigue quieta bajo el dedo y lo único que asoma es la fila que ya tenía lo que se usa a media página, las pestañas y las acciones, con el título que sube a su sitio al ritmo de la mano. En un teléfono, las acciones **bajan al pulgar** y las pestañas se quedan arriba con todo el ancho. Nada se duplica en el árbol, nada pierde su estado ni el foco, nada se pega si el zoom no lo permite, y la isla y los avisos saben dónde está.

## Comprobaciones

`node design/lab/page-header/r01/verificar.mjs` · 2026-10-13 · puerto 4215 · **258 de 258 pasan**.

| Motor | Base | A | B | C | B + muelle | Zona |
| --- | --- | --- | --- | --- | --- | --- |
| Chromium | 14/14 | 23/23 | 17/17 | 11/11 | 7/7 | 14/14 |
| Firefox | 14/14 | 23/23 | 17/17 | 11/11 | 7/7 | 14/14 |
| WebKit | 14/14 | 23/23 | 17/17 | 11/11 | 7/7 | 14/14 |

Notas: una pasada intermedia tuvo en Firefox un `page.goto` por encima de 30 s con la máquina cargada (otros agentes); repetida, pasa. El foco se pone con `focus()` (no con Tab: WebKit de Playwright no tabula a botones); `pointer: coarse` se emula con `hasTouch` (y `isMobile` en Chromium); el contraste se resuelve con un lienzo (sirve para `color-mix` en los tres motores).

**No comprobado:** lector de pantalla real (VoiceOver, NVDA, TalkBack): que el `header` dentro de `main` no se anuncie como banner, el grupo de acciones, y sobre todo **la mudanza de las acciones con el cursor virtual** (A, C y la forma estrecha de la recomendación: el lector desplaza la página al recorrer y eso puede mudar lo que está leyendo; la regla 16 protege el foco, no el cursor virtual); táctil real (inercia del desplazamiento en iOS con `sticky` negativo); `forced-colors` real; zoom de navegador real al 200 % y 400 % (se emuló con el visor); el tema oscuro; `Teleport` de Vue real (el prototipo mueve nodos del DOM); `GBreadcrumbs`, `GTabs` y `GMenu` reales dentro (el prototipo usa sus clases o un equivalente).

## Dependencia: zona de marca (`design/lab/surface/r02/`, en curso)

**No se decide aquí el mecanismo.** Supuesto del prototipo: la zona es una clase en la **raíz** del encabezado que redefine en ella los tokens de color (superficie y fondo, texto, apagado, sutil, bordes, foco, enlace, acento, neutros suaves y el par de marca invertido). Lo que la ronda aporta a esa decisión, medido:

- **Z1 · Los alias no siguen a la zona.** `--g-color-primary` vale `var(--g-color-brand)` declarado en `:root` y **se resuelve ahí**: redefinir `--g-color-brand` en la zona no cambia `primary`, y el `GBtn` sólido de marca (que lee `primary`) salió **invisible** sobre el navy en la primera prueba. La zona tiene que redefinir también los derivados que consumen los componentes (`primary` y su familia, `text-subtle`, los `-text` semánticos que se pinten dentro), o el CLI tiene que emitirlos para la zona.
- **Z2 · La zona debe poder ir en la raíz del componente, no solo como envoltorio.** Con B, un envoltorio de zona alrededor del encabezado limitaría el pegado a ese envoltorio (punto 22).
- **Z3 · Qué es «acento» dentro de la zona.** Con NisaNabani, el lima sirve de foco (6,95:1 sobre el navy), enlace y acción principal (`on-accent` 10,88:1); con el tema por defecto (marca casi negra) el acento azul no llega, y el prototipo usa `on-brand` (blanco). La zona necesita un token para «la marca de foco y acento dentro de la zona».
- **Z4 · La franja y el muelle heredan la zona** porque viven dentro de la raíz (medido: mismo fondo). Si la zona fuese un ancestro fuera del encabezado, también; si fuese un fondo pintado por otro componente, no.

## Hallazgos para lima

| # | Tema | Propuesta |
| --- | --- | --- |
| L1 | Nombre y entrega | `GPageHeader` (`g-page-header`), categoría estructura de página, contrato propio `design/contracts/page-header.md`. **Peso (#506, #550):** el margen del principal está agotado y todo componente nuevo en él abre la valoración; propuesta: **entrada propia `@grana/vue/page-header`** (global UMD `GranaPageHeader`), con `GBreadcrumbs`, `GBtn`, `edgeReserve` y el `ResizeObserver` compartido por `__shared`. Estimación de kiwi: base + B ≈ 2 KB gzip; + muelle (mudanza con `Teleport`, histéresis, reserva) ≈ 3,5 KB; + A ≈ 5 KB. **Componente complejo** (compone `GBreadcrumbs`, `GTabs`, `GBtn`/`GMenu`; se posiciona sobre otros elementos): coco y bruno en Opus |
| L2 | Props | `title` (o slot), `headingLevel` (1 por defecto; 1 a 3), `eyebrow`, `description`, `labels` (`actions`, y `up` con `{label}` si se elige A; sin valores por defecto), `sticky` (Boolean, por defecto `true`? decidir: la franja/zócalo **de serie** o con prop, como `GAccordion` #484 decidió «solo con una prop») · **No existen:** `actions` como datos, `breadcrumbs`/`items` (la ruta es el slot `trail`), `size`, `level`/`elevation` (no es superficie) |
| L3 | Nivel | `headingLevel` 1 a 3 (aviso de desarrollo si 1 y ya hay otro `h1`); método `focus()` que enfoca el `h1` (`tabindex="-1"`) |
| L4 | Composición | Slots `trail`, `meta`, `actions` (ámbito `{ narrow, docked }`), por defecto (contenido), `tabs`. `GBreadcrumbs` se registra en el encabezado (`provide/inject`, clave interna) para dar el padre a «Subir» (solo A); `GTabs` va con `detached` y los `GTabPanel` en el cuerpo (#118) |
| L5 | Estrecho | Umbral por el ancho de la raíz (constante de coco; el prototipo usa 600 px); `data-narrow` en la raíz y `narrow` en el ámbito de `actions`. Sin motor de prioridad de acciones en v1: la aplicación decide qué va a su `GMenu` |
| L6 | Entrada pública | **`--g-page-header-top`** (longitud, `@property` `<length>`, `inherits: true`, `0px`; no es del tema, como `--g-accordion-sticky-top` y `--g-form-min`). Receta de una sola variable de la aplicación para la barra, el encabezado, el acordeón pegado y el `scroll-padding` |
| L7 | Alto de la franja / zócalo | **Constante de diseño** expresada en tokens (`space × 12`; con `pointer: coarse`, lo que den 44 px + relleno) para que la receta de `scroll-padding` se escriba sin JS: `calc(var(--app-header) + var(--g-space-12))`. Con pegado, el `--g-accordion-sticky-top` de un acordeón bajo el encabezado suma lo mismo |
| L8 | Mudanza (A, C, forma estrecha) | `Teleport` con `disabled` conmutado (mismas instancias); el hueco guarda su tamaño; nunca mueve lo enfocado (espera al `focusout`); histéresis; la franja/muelle en el DOM justo después de la cabecera (orden de lectura estable); `hidden` + `inert` cerrados |
| L9 | Bordes | Cliente de `utils/edgeReserve.js`: `EDGE_ORDER.pageHeader` **anterior** a `speech` (10) y `status` (20); arriba (franja/zócalo pegado) o abajo (muelle); reserva del sitio final, no de la traslación. `GStatusIsland` y `GToaster` ya leen la reserva: sin API nueva para la aplicación |
| L10 | Regla del cuarto | La franja/zócalo/muelle no se activa si su alto pasa del 25 % del alto visible (constante de diseño; 1.4.10). Se revalúa en `resize` |
| L11 | Avisos de desarrollo | `[Grana GPageHeader]`: falta `title`; más de un `h1` con nivel 1; acciones sin `labels.actions`; con pegado, el padre de la raíz mide lo mismo que ella (no hay contenedor largo: el pegado no hará nada; punto 22) |
| L12 | Movimiento y personalidad | Registrar en `DECISIONS.md` la elegida: B «se hunde» (sin animación propia: el desplazamiento es el movimiento) y el título compacto ligado al desplazamiento (una variable `--p` por cuadro, solo `opacity` y `translate`; coco puede usar `animation-timeline: view()` donde exista y el valor de JS donde no); el muelle con `--g-ease-spring` + `--g-duration-slow` (desplazamiento que llega, #299) y salida `--g-duration-press` + `--g-ease-out`; A: franja ligada al desplazamiento y acciones con FLIP corto. Patrón único de movimiento reducido |
| L13 | Tokens | **Ningún token nuevo** propuesto por el encabezado. Consume `--g-color-bg`/`surface`, `text`, `text-muted`, `border`/`border-strong`, `neutral-soft` (A), `--g-shadow-2` (pegado) y `--g-shadow-3` (muelle flotante), `--g-text-title-lg-*` (h1) y `title-sm-*` (título compacto), `--g-space-*`, `--g-radius-pill` (muelle). Los de la zona son de la ronda de `surface` |
| L14 | Fronteras | `GCard` resume una entidad (h2–h6, enlace estirado); `GPageHeader` abre la página (h1); no se compone `GSurface`; la ruta es `GBreadcrumbs`; las acciones, `GBtn`/`GMenu`; las secciones, `GTabs` + `GTabPanel` |
| L15 | Reservas | Carga del encabezado como molde de `GLoadRegion`; botón «volver arriba» (no: el título de la franja/muelle ya lleva al `h1`); acciones como datos con prioridad automática; `animation-timeline: view()` como única vía (cuando los tres motores lo tengan) |
| L16 | Pruebas de bruno | Las de `verificar.mjs` como base de `tests/page-header.spec.mjs`: `h1` único, orden, pegado y Δ 0, cero copias, foco que no se muda, regla del cuarto, cambio de pestaña pegado, reserva de bordes, reducido, 390 táctil, RTL, zona |

## Pregunta de producto (una)

**¿Qué hace el encabezado de página al desplazarse?**

1. **B + el muelle de C en estrecho (recomendada):** el encabezado se hunde hasta su última fila (pestañas y acciones) con el título compacto; en un teléfono, el zócalo se queda con las pestañas y las acciones bajan al muelle del pulgar.
2. **A · Relevo:** la franja de arriba con «Subir», el título y las mismas acciones, que llega al ritmo del desplazamiento; las pestañas no van en ella.
3. **Solo B:** el zócalo también en el teléfono (la principal en su icono).
4. **C · Muelle:** arriba no queda nada; las acciones bajan siempre a un muelle (píldora en escritorio, barra en el teléfono).

*Pregunta menor, que puede decidir lima con coco si se elige B:* ¿el pegado viene **de serie** o con una prop `sticky` (como `GAccordion`, #484)? Recomendación de kiwi: de serie cuando hay zócalo (pestañas o acciones), porque sin él el encabezado no se pega y no hay nada que configurar.
