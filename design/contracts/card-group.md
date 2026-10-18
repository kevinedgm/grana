# Contrato · GCardGroup

**Dueño:** lima · **Estado:** aprobado (pendiente de CSS y construcción) · **Basado en:** `design/lab/card-group/r01/` (kiwi: `brief.md`, `declaracion.md` con 22 decisiones y hallazgos L1 a L12, prototipo `index.html` + `cardgroup.js` + `cardgroup.css`, `verificar.mjs` 424/424 en los tres motores) · **Origen:** hallazgo 19 (P3) de la integración real en NisaNabani · **Compone:** `card.md` (las tarjetas son `GCard` hijas) · **Se usa con:** `table.md` + `filter-bar.md` (la región que se filtra)
**Tag:** `g-card-group` · **Entrada:** `@grana/vue/card-group` (#610) · **Categoría:** controles de vista

Una **fila de tarjetas de métrica que filtran** la región que tienen debajo (casi siempre una `GTable`): «Pendientes 8 · Vencidas 4 · Pagadas 10 · En disputa 2». Pulsar una tarjeta filtra; pulsarla otra vez quita el filtro. `GCardGroup` **no dibuja tarjetas**: coordina las `GCard` hijas y les da lo que una tarjeta sola no puede tener: **exclusividad**, **una sola parada de Tab** y **la cifra en su descripción**. Decisión de forma del usuario: **A · Lengüeta** (#611). Decisiones: DECISIONS.md #603 a #611; enmienda de `card.md` (#606); se apoya en #124, #265/#569, #465, #505, #506/#550, #570.

---

## Principios

- **Coordinador, no tarjeta** (kiwi 1). Las tarjetas son `GCard` hijas por slot, con todo lo que ya saben (`GMetric`, insignia, tendencia, carga, personalidad C1/C2). El grupo no conoce la tabla, no hace `fetch` y no escribe texto propio.
- **Estado de la vista, no valor de formulario** (kiwi 2, #603). Regla de una línea para la documentación: **¿se envía con el formulario o siempre tiene que haber una? → radios** (`GCard selectType="radio"` o `GRadioGroup appearance="card"`). **¿Cambia la vista en el acto y se puede soltar? → `GCardGroup`.** Las tarjetas de formulario (mínimo/máximo, casilla maestra) siguen reservadas (#124).
- **Siempre se puede soltar.** No hay modo «siempre una» (`mandatory`) ni tarjeta «Todas» interactiva (kiwi 7 y 10): un `aria-pressed="true"` que no se suelta contradice al botón. Si siempre tiene que haber una, es un radio.
- **Las flechas no filtran** (kiwi 5 y 12): mueven el foco; Espacio e Intro alternan. Así recorrer las métricas no recarga la tabla ni encadena anuncios.
- **Una sola verdad con los filtros** (kiwi 19, #608): la tarjeta pulsada y el chip de la barra son dos vistas del mismo filtro. La aplicación lo une con una receta de cinco líneas; el grupo no tiene prop de filtros.
- **El grupo no anuncia** (kiwi 18): el lector ya dice «presionado» y el recuento lo anuncia la tabla, también cuando `filters` cambia desde fuera (#569).
- **Pulsar no mueve nada** (kiwi 21): ninguna caja ni cifra cambia de sitio al pulsar, soltar o cambiar de tarjeta (Δ 0 medido).

## Frontera con otros componentes

| Componente | Relación |
| --- | --- |
| `GCard interaction="toggle"` | **Se reutiliza tal cual**: el botón de alternar dentro del título, la marca estática, `is-selected`, C1 y C2. Dentro del grupo, la tarjeta lee su estado y su `tabindex` del grupo (ver «Tarjetas hijas») |
| `GCard selectType="radio"` + `role="radiogroup"` del consumidor | Valor **de formulario** (se envía, siempre uno, las flechas eligen). Sin cambio (#124) |
| `GRadioGroup appearance="card"` | Opción de formulario sin contenido propio (#273). Sin cambio |
| `GTag` / `GTagGroup` de alternar | Etiqueta **sin cifra**, independiente, una parada por etiqueta (#462, #465). Una **métrica** que filtra (cifra, tendencia, contexto) es `GCard` dentro de `GCardGroup` (kiwi 3) |
| `GTabs` | Siempre hay una pestaña activa y cambia **el panel**; aquí se filtra la misma región y se puede no filtrar. La lengüeta no es una pestaña: es `toolbar` + `aria-pressed`, nunca `tablist` (kiwi 6) |
| `GTable` + `GFilterBar` | La región que se filtra. Receta de unión en «Receta con los filtros de la tabla». El anuncio del recuento es de la tabla (#265, #569) |
| `GMetric` | Contenido de cada tarjeta; su texto entra en la descripción del botón (#606) |

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `modelValue` | String \| Number \| Array \| null | sin `multiple`: el `value` de la tarjeta pulsada o `null`; con `multiple`: arreglo de `value` | `null` | compartida (`v-model`) |
| `multiple` | Boolean | | `false` | propia (como `GCombobox`, `GSelect`) |
| `label` | String | nombre accesible de la barra (`aria-label`) | sin valor | propia (como `GTabs`, `GTagGroup`) |
| `labelledby` | String | `id` de un elemento visible que nombra la barra | sin valor | propia (como `GTabs`, `GTagGroup`) |
| `controls` | String | `id` de la región que se filtra | sin valor (con slot `panel`, el `id` del panel) | propia |
| `id` | String | | generado | propia |

**API mínima (L9).** No hay `density` (cada `GCard` lleva la suya), ni `disabled` de grupo (cada tarjeta tiene `disabled`), ni `labels` (el grupo no escribe texto en v1), ni `appearance` (v1 tiene una sola forma; ver «Fuera de v1»).

### Reglas de props

- **`modelValue` sin `multiple`:** el `value` de una tarjeta hija o `null`. Un valor que no es de ninguna tarjeta deja todas sin pulsar, no avisa (las tarjetas pueden llegar después) y no se reescribe. Un arreglo sin `multiple` avisa (G7) y se trata como `null`.
- **`modelValue` con `multiple`:** arreglo; `[]` sin ninguna pulsada, **nunca `null`** (un `null` o un escalar avisa, G7, y se trata como `[]`). Al emitir, los valores van **en el orden de las tarjetas en el DOM**, no en el de pulsación (el filtro `in` no tiene orden y así el arreglo es estable; kiwi 8). **Los valores que no son de ninguna tarjeta se conservan** al final, en su orden original: el grupo no borra lo que no conoce (p. ej. un estado elegido desde la barra que no tiene tarjeta).
- **Igualdad:** `===` entre el `value` de la tarjeta y el del modelo (como `GCard` radio). `'4'` y `4` son distintos.
- **`label` / `labelledby`:** nombre de la barra (`role="toolbar"`). **Obligatorio uno de los dos** (aviso G1, como `GTabs` #121). Van a la barra, no a la raíz.
- **`controls`:** se escribe como `aria-controls` en **cada** botón principal gestionado. Sin `controls` y con slot `panel`, vale el `id` del panel (`ID-panel`); sin ninguno de los dos, no hay `aria-controls`. Soporte desigual en lectores (JAWS lo ofrece, VoiceOver lo ignora): ayuda, no se depende de él (kiwi 17). Un `id` que no existe en el documento tras montar avisa (G9).
- **Atributos** (`class`, `style`, `data-*`, escuchas): a la **raíz**. `aria-label`/`aria-labelledby` en `$attrs` avisan (G1b) y no se copian a la barra: el nombre va por `label`/`labelledby`.

## Estructura accesible

```html
<div class="g-card-group [has-panel] [is-filtered] [is-multiple]" id="ID">
  <div class="g-card-group__strip" role="toolbar" aria-label="…" [tabindex="-1" si has-panel]>   <!-- la barra; con panel, tira desplazable -->
    <div class="g-card is-selected? …">                                                     <!-- GCard hija, sin cambios de estructura -->
      …<h3 class="g-card__title" id="C-title">
          <button type="button" class="g-card__primary" aria-pressed="true|false"
                  tabindex="0|-1" aria-describedby="C-content" aria-controls="ID-panel|controls">Vencidas</button>
        </h3>…
      <div class="g-card__content" id="C-content"> GMetric «Facturas 4 ↑ +1 desde ayer» </div>
    </div>
    …
    <div class="g-card …">…</div>                                                            <!-- GCard sin value: estática, fuera de la parada -->
    <span class="g-card-group__bridge" aria-hidden="true"></span>                           <!-- solo con panel: uno por tarjeta pulsada -->
  </div>
  <div class="g-card-group__panel" id="ID-panel">                                             <!-- slot panel: la región que se filtra -->
    <GTable …/>
  </div>
</div>
```

- **La raíz no tiene rol.** La barra es `g-card-group__strip` con `role="toolbar"` y nombre. Con panel, la tabla queda **fuera** de la barra (una barra de herramientas no contiene la región que controla). Sin panel, la estructura es la misma sin `__panel` ni `__bridge`.
- **Los hijos del slot por defecto** se pintan dentro de la barra, en su orden. Solo las `GCard` gestionadas (ver «Tarjetas hijas») son controles de la barra; una `GCard` sin `value` (p. ej. «Total 24» con `interaction="none"`) se pinta en la rejilla y queda fuera de la parada (kiwi 9).
- **Sin región viva propia** (kiwi 18). Sin `role="radiogroup"`, `listbox`, `tablist` ni `aria-selected` (kiwi 5 y 6, #128).
- **El puente** (`g-card-group__bridge`) es `aria-hidden`, va **dentro** de la barra (se desplaza con las tarjetas) y no es interactivo (`pointer-events: none`).

## Tarjetas hijas (L8, #605)

El grupo da un contexto (`provide`, clave interna en `utils/cardGroup.js`, no exportada) que la `GCard` lee con `inject`. Con contexto:

| `interaction` de la hija | `value` | Resultado |
| --- | --- | --- |
| `auto` (por defecto) | con `value` | **`toggle` gestionado**: botón con `aria-pressed` del grupo, en la parada |
| `auto` | sin `value` | `none` (estática, fuera de la parada) — lo de siempre sin `href` |
| `toggle` | con `value` | `toggle` gestionado |
| `toggle` | sin `value` | **cae a `none`** y avisa (G3), como `link` sin `href` |
| `none` | cualquiera | `none`; el `value` se ignora sin aviso |
| `link`, `button`, `select` | cualquiera | **cae a `none`** y avisa (G2): una segunda clase de activación rompería la barra de una parada |

- **Una tarjeta gestionada** toma del grupo: `aria-pressed`, `is-selected`, `tabindex` (0 o -1), `aria-controls` y `aria-describedby` con su contenido (#606). **Su `modelValue` se ignora** (aviso G6 si viene enlazado) y **no emite `update:modelValue`**: avisa al grupo y el grupo emite.
- **`value` repetido** entre hermanas: la segunda y siguientes caen a `none` y avisan (G4).
- **`disabled` y `loading`:** siguen el contrato de `GCard` (no emiten); quedan **fuera de la parada**. Una pulsada que pasa a `disabled` sigue `aria-pressed="true"` (el filtro sigue aplicado) pero no se puede soltar desde ella; se suelta con la × del chip de la barra.
- **Un filtro con 0 resultados no deshabilita la tarjeta:** la tabla enseña su vacío con causa (`GEmpty cause="filtered"`, #540; kiwi 22).
- **Orden:** el del DOM. Con tarjetas que se reordenan (`v-for` con otra clave), el grupo ordena por posición en el documento, no por orden de registro.
- **Anidar** `GCardGroup` avisa (G8); una `GCard` pertenece al grupo más cercano.
- **Fuera de un grupo**, `GCard` no cambia.

## Controles secundarios en las tarjetas (L5, #609)

Una barra de herramientas de una parada **no admite** paradas dentro de sus elementos. En v1, `GCardGroup` **no admite** tarjetas gestionadas con controles secundarios: `menu`, `selectable`, `expandable` con recorte, slots `actions`, `footer` o `more`, o cualquier enfocable en el contenido.

- **v1:** aviso de desarrollo G5 (una vez, con el título de la tarjeta). La barra sigue siendo `toolbar` y esos controles conservan su orden de Tab nativo (las flechas los ignoran): el resultado es operable pero no cumple el patrón de una parada; por eso se avisa y se documenta como no admitido.
- **Reservado:** el paso automático a **`role="group"`** con una parada por tarjeta y por control y sin flechas (la regla de `GTagGroup`, #465), con aviso. Se abrirá con un caso real y una ronda propia de kiwi (no prototipado en r01).
- Detección (bruno, solo en desarrollo): props y slots de la lista anterior, más una consulta de enfocables (`a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), summary`) dentro de `g-card__content` tras montar.

## Modelo y eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` | sin `multiple`: `value` o `null`; con `multiple`: arreglo nuevo | El usuario alterna una tarjeta gestionada (clic, toque, Espacio, Intro) |
| `change` | `{ value, pressed }` | El mismo gesto, **después** de `update:modelValue`: `value` de la tarjeta alternada y su estado nuevo. No cancelable |

- **Sin `multiple`:** pulsar la no pulsada emite su `value` (y la que estaba se suelta); pulsar la pulsada emite `null`.
- **Con `multiple`:** pulsar añade o quita su `value` (ver orden y desconocidos en «Reglas de props»). Medido: Pendientes + Vencidas = un solo filtro `in` con dos valores y la tabla enseña 8 + 4 = 12 (O dentro del filtro, #111).
- **Un cambio de `modelValue` desde fuera** (p. ej. quitar el chip) **no** emite `change`, no mueve el foco y desplaza **solo la tira** para que la pulsada (la primera, en `multiple`) se vea entera (sin desplazar la página).
- Los dos eventos se declaran en `emits`. Una tarjeta `disabled` o `loading` no emite.

## Teclado y foco (APG *Toolbar*)

| Tecla | Acción |
| --- | --- |
| **Tab** | Entra **una vez**, en: la pulsada (la primera pulsada en el DOM, en `multiple`) → si no hay o no es elegible, la última enfocada → si no, la primera elegible. Vuelve a salir hacia lo siguiente (la tabla). Elegible = gestionada, sin `disabled` ni `loading` |
| **→ / ←** | Siguiente / anterior elegible; **espejo en RTL** (por `direction` calculada de la barra) |
| **↓ / ↑** | Siguiente / anterior, **linealmente** (la rejilla puede tener dos filas y la persona no tiene por qué saber dónde se parte) |
| **Inicio / Fin** | Primera / última elegible |
| **Espacio / Intro** | Alternan la enfocada (nativo del `<button>`) |

- **Sin vuelta** en los extremos (Inicio y Fin ya llevan a ellos). **Las flechas no filtran.** Teclas con modificadores (Alt, Ctrl, ⌘) no se interceptan.
- **Foco itinerante:** exactamente una gestionada elegible con `tabindex="0"`; el resto `-1`. Se recalcula al cambiar el modelo, al montar o desmontar tarjetas y al cambiar `disabled`/`loading`. Si la del `0` deja de ser elegible con el foco dentro, el foco pasa a la siguiente elegible (si no, a la anterior).
- **Foco visible:** el anillo de `GCard` (`:has(.g-card__primary:focus-visible)`). **No usa `data-g-key-focus`**: son botones, que WebKit sí marca (#441; medido por kiwi en los tres motores, kiwi 13).
- **Traer a la vista la tarjeta entera (L7, para bruno).** Al mover el foco itinerante (flechas, Inicio, Fin, y también al entrar con Tab), el grupo desplaza la tira para que **la `.g-card` entera** quede visible, **no** el `g-card__primary`: el botón estirado mide solo el título y, en WebKit, `scrollIntoView` sobre él dejaba la última tarjeta a medias (medido: 228–404px en una tira de 32–343px). Con `scrollIntoView({ block: 'nearest', inline: 'nearest' })` sobre la tarjeta, o desplazando la tira por cálculo; con `prefers-reduced-motion: reduce`, sin desplazamiento suave.
- **Contenedor desplazable (#570):** con panel, la tira se desplaza en horizontal y lleva **`tabindex="-1"`** para que Firefox no añada una parada en ella (medido por kiwi).

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `default` | Las `GCard` (gestionadas o estáticas) | — | Dentro de la barra; ver «Tarjetas hijas» y «Controles secundarios» |
| `panel` | **La región que se filtra** (la `GTable` con su `GFilterBar`) | `{ filtered }` | Dentro de `g-card-group__panel`, **justo debajo** de la tira. Activa la lengüeta |

## Lengüeta (forma por defecto; decisión del usuario, #611)

La lengüeta **exige la región filtrada justo debajo** de las tarjetas: es el slot `panel`. Con él, las tarjetas se apoyan en el marco del panel como lengüetas de carpeta; sin él no hay a qué unirse.

| Con slot `panel` (`has-panel`) | Sin slot `panel` |
| --- | --- |
| **Una sola fila** que se desplaza en horizontal, también en móvil (dos filas romperían el contacto con la tabla); `tabindex="-1"` en la tira (#570) | **Rejilla que llena** (`auto-fit`, mínimo `space × 34`): cuatro en una fila a 1200px, dos columnas a 375px (kiwi 20) |
| Esquinas inferiores rectas en las tarjetas y una **ranura** de `space × 2` entre ellas y el marco del panel | La forma de `GCard` seleccionada de siempre (borde doble + marca + tinte) |
| **El puente**: al pulsar, cierra la ranura bajo la tarjeta y su borde doble (`2 × --g-border-width`) **se continúa en el marco del panel**, que toma la familia de la marca (`primary-text`) mientras haya alguna pulsada (`is-filtered`) | Sin puente; la relación con la tabla la dan `controls` y el chip de la barra |

- **Qué va en el panel:** la región filtrada **y nada más** (la tabla con su barra). Lo que deba ir entre las tarjetas y la tabla (un título, botones) va **fuera** del grupo, y entonces no se usa el panel: la lengüeta no tiene a qué unirse y el grupo es la rejilla (kiwi A «arriesga»). Va en el README.
- **Medición del puente (bruno):** un puente por tarjeta pulsada; posición con variables `--_bridge-x` y `--_bridge-w` en **px**, medidas contra la **caja de relleno de la tira** incluyendo su desplazamiento; en RTL, `x` desde el borde **derecho** (convención de la marca de `GTabs`, `tabs.md`). Excepción justificada a «sin estilos en línea», como la marca de `GTabs` y de `GMenu`. Se recolocan con `ResizeObserver` sobre la tira y al cargar las fuentes; **solo se escriben si cambian** (escribir siempre vuelve a pintar y re-mide en bucle; medido en el prototipo). Sin `multiple`, un solo puente con clave estable (viaja); con `multiple`, uno por valor (cada uno aparece y se retira por su cuenta, no viajan).
- **Rendimiento:** la medición no depende de un `watch` con getter que devuelva un arreglo nuevo (lección de bd888df): fuentes separadas o una clave de lo medido.

### Movimiento (personalidad, #611)

| Momento | Movimiento | Tokens |
| --- | --- | --- |
| Primer posicionamiento | **Sin animar** (clase `is-ready` tras el primero, como `GTabs`) | — |
| Aparece (nada pulsado → pulsada) | Crece desde la tarjeta hacia el marco (`transform` en el eje de bloque, origen arriba) | `--g-duration-slow`, `--g-ease-out` |
| Cambia de tarjeta (sin `multiple`) | **Viaja** como el borde de la marca de `GTabs`: posición y ancho | `--g-duration-press`, `--g-ease-out` |
| Se retira (soltar) | Se recoge hacia la tarjeta | `--g-duration-fast`, `--g-ease-out` |
| Marco del panel | Cambio de color del borde | `--g-duration-fast`, `--g-ease-out` |
| Cambio de tamaño, de densidad o desplazamiento de la tira | Sin animar | — |

- **Sin muelle:** ni `--g-ease-spring` ni `--g-ease-bounce` (decisión del usuario; #299 limita sus usos). La marca de `GTabs` usa muelle (#302): el puente toma su recorrido, no su curva.
- **`prefers-reduced-motion: reduce`:** el puente **solo se funde** (`opacity`, `--g-duration-fast`) y salta de sitio; el marco cambia de color sin transición larga; la tira se desplaza sin suavizado. Patrón único de movimiento reducido de #299 (`tokens.md` §29).
- Solo `transform`, tamaño y opacidad; transiciones, no *keyframes* (#71).
- **`forced-colors`:** puente con `Canvas` de fondo y borde `Highlight`; marco filtrado en `Highlight`. El estado nunca es solo color: la forma (el borde que se abre hacia la tabla) lo dice.

## Receta con los filtros de la tabla (L4, #608)

**Sin prop:** el grupo no conoce la tabla (funciona solo, como `GFilterBar`). La aplicación une el `v-model` del grupo con los `filters` de la tabla (`{ key, op, value }`, `filter-bar.md`) con un `computed` de lectura y escritura, de modo que **la tarjeta pulsada se lee de los filtros**: quitar el chip suelta la tarjeta y pulsar otra sustituye el filtro (un filtro por campo).

```js
// Un solo valor (sin multiple)
const filters = ref([])
const estado = computed({
  get: () => {
    const f = filters.value.find((x) => x.key === 'estado' && x.op === 'in')
    return f && f.value.length === 1 ? f.value[0] : null   // pulsada solo si el filtro tiene exactamente un valor
  },
  set: (v) => {
    const rest = filters.value.filter((x) => x.key !== 'estado')
    filters.value = v == null ? rest : [...rest, { key: 'estado', op: 'in', value: [v] }]
  }
})
// Con multiple: get devuelve f ? f.value : [] (el grupo conserva los desconocidos);
// set escribe { key, op: 'in', value: v } o quita el filtro si v está vacío.
```

```html
<g-card-group v-model="estado" label="Filtrar facturas por estado">
  <g-card v-for="m in metricas" :key="m.value" :value="m.value" :title="m.title"> <g-metric … /> </g-card>
  <template #panel>
    <g-table :columns="columns" :rows="rows" caption="Facturas" v-model:filters="filters" :labels="…" />
  </template>
</g-card-group>
```

- **Lectura sin `multiple`:** pulsada **solo si** el filtro del campo tiene **exactamente un** valor y es de una tarjeta. Si la barra deja dos estados, ninguna tarjeta aparece pulsada (ninguna lo describe); pulsar una sustituye el filtro por el suyo (gesto explícito).
- **Anuncio:** lo hace la tabla al cambiar `filters` desde fuera (#569); con `filterMode: 'external'`, al llegar los datos. El grupo no repite.
- **Página:** filtrar vuelve a la página 1 (lo hace la tabla; `filter-bar.md`).
- **Reservado con nombre:** el atajo `filterKey` + `v-model:filters` en el propio grupo, si la receta se repite en las integraciones (kiwi L4).

## Descripción con la cifra (L2, #606)

Dentro de un `GCardGroup`, el principal de cada tarjeta gestionada lleva **`aria-describedby="C-content"`**, el `id` del `g-card__content` (que contiene la descripción, el aviso de `status`, el vacío y el slot por defecto con la `GMetric`). El lector dice «Vencidas, botón de alternar, no presionado, Facturas 4, +1 desde ayer» y no solo «Vencidas». **Sustituye** a `C-desc` (la descripción ya va dentro del contenido; no se lee dos veces). El cambio es de `GCard` (`card.md` «ARIA», enmienda #606): la tarjeta lo hace al detectar el contexto del grupo.

## Tokens consumidos

**Ninguno nuevo** (kiwi L10). Existentes: los de `GCard` (que la tarjeta ya consume) y, en el grupo, `--g-color-border-strong` (marco en reposo), `--g-color-primary-text` (marco filtrado y bordes del puente), `--g-card-selected` y `--g-color-surface` (relleno del puente), `--g-space-1` (ranura `× 2`, mínimo de rejilla `× 34`, mínimo de lengüeta `× 44` y separaciones), `--g-radius-lg` (marco), `--g-border-width` (borde doble `× 2`), `--g-duration-{fast|press|slow}`, `--g-ease-out`. La ranura, el mínimo de rejilla y el ancho mínimo de lengüeta son **constantes de diseño** (alias locales `--_*` de coco, como los umbrales de #130), no tokens.

## Clases y datos (contrato bruno ↔ coco)

| Clase o dato | Elemento | Cuándo |
| --- | --- | --- |
| `g-card-group` | Raíz | Siempre |
| `has-panel` | Raíz | Con slot `panel` (lengüeta) |
| `is-filtered` | Raíz **y** `g-card-group__panel` | Alguna tarjeta gestionada pulsada |
| `is-multiple` | Raíz | Con `multiple` |
| `is-ready` | Raíz | Tras el primer posicionamiento de los puentes (antes, sin transición) |
| `is-leaving` | `g-card-group__bridge` | Mientras el puente de una tarjeta que se despulsa se retira (#609 a #611): el puente se queda hasta acabar su salida y luego se desmonta |
| `g-card-group__strip` | Barra (`role="toolbar"`) | Siempre |
| `g-card-group__panel` | Envoltorio del slot `panel` | Con slot `panel` |
| `g-card-group__bridge` | Puente (`aria-hidden`), dentro de la barra | Con panel, uno por tarjeta pulsada |
| `--_bridge-x`, `--_bridge-w` (px, en línea) | `g-card-group__bridge` | Siempre que hay puente |

La `GCard` hija conserva sus clases (`is-selected`, `g-card--interaction-toggle`…); coco la ajusta dentro del grupo con selectores de descendiente en `GCardGroup.css` (esquinas inferiores rectas, borde inferior de la seleccionada abierto hacia el puente). El borde exterior de la `GTable` dentro del panel lo decide coco (el marco es del panel; evitar el doble marco).

## Avisos de desarrollo

Con la guarda canónica de #653 (`try { if (process.env.NODE_ENV !== 'production' …) … } catch {}`, `api.md` «Avisos de desarrollo»), una vez cada uno, prefijo `[Grana GCardGroup]`:

| # | Aviso |
| --- | --- |
| G1 | Sin `label` ni `labelledby`. G1b: `aria-label`/`aria-labelledby` en `$attrs` (usar las props) |
| G2 | Tarjeta hija con `interaction` `link`, `button` o `select`: cae a `none` |
| G3 | Tarjeta hija con `interaction="toggle"` sin `value`: cae a `none` |
| G4 | `value` repetido entre tarjetas: la segunda y siguientes caen a `none` |
| G5 | Tarjeta gestionada con controles secundarios (no admitido en v1; `role="group"` reservado) |
| G6 | `v-model`/`modelValue` en una tarjeta hija gestionada: se ignora |
| G7 | `modelValue` de tipo distinto al modo (arreglo sin `multiple`; escalar o `null` con `multiple`) |
| G8 | `GCardGroup` dentro de otro `GCardGroup` |
| G9 | `controls` con un `id` que no existe en el documento tras montar |

## Paquete, `meta.json` y tipos (L1, #610)

- **Entrada propia `@grana/vue/card-group`** (global UMD `GranaCardGroup`), como `slider`, `tag` y `load-region`: el margen del principal está agotado (#550) y todo componente nuevo abre la valoración de #506. El CSS va en `grana.css`. Se declara en `exports`, `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js` (`api.md` «Paquete, entradas y tipos»).
- **`GCard` sigue en el principal** y llega a la entrada por `__shared`, **sin copia**. Lo que cambia en `GCard` para el grupo (lectura del contexto, `id` del contenido, `aria-describedby`) y la clave de contexto (`utils/cardGroup.js`) van en el principal.
- **Compuertas (bruno mide y registra en `CHANGELOG.md`):** crecimiento del `grana.js` gzip por el cambio de `GCard` **≤ 1 KiB** (con más, vuelve a lima antes del commit); la entrada `card-group.js` **≤ 8 KiB** gzip (la compuerta por componente de #472). Para `gates.sh`: `test -f packages/vue/dist/card-group.js`, `! grep -q "GCardGroup" packages/vue/dist/grana.js`, `grep -q "g-card-group__bridge" packages/vue/dist/grana.css` y que `card-group.js` no traiga una copia de `GCard` (una cadena propia de `GCard.vue` que no esté en el grupo).
- **`GCardGroup.meta.json`:** props, `emits` (`update:modelValue`, `change`) y slots (`default`, `panel` con `{ filtered }`) con sus tipos; `modelValue` como `string | number | null | Array<string | number>`.

## Resolución de hallazgos de kiwi (r01)

| # | Hallazgo | Resolución |
| --- | --- | --- |
| L1 | Nombre, entrega y peso | `GCardGroup`, `g-card-group`; **entrada propia** `@grana/vue/card-group` (#610) |
| L2 | La cifra en la descripción | `aria-describedby` = `g-card__content` dentro del grupo; fuera, sin cambio (#606) |
| L3 | `GTable` calla ante `filters` externos | Resuelto por #569 (`table.md`) |
| L4 | Una sola verdad | Receta sin prop; `filterKey` + `v-model:filters` reservado (#608) |
| L5 | Controles secundarios | No admitidos en v1, con aviso; `role="group"` reservado (#609) |
| L6 | Tira desplazable como parada en Firefox | Regla general #570; aplicada a la tira con panel |
| L7 | `scrollIntoView` sobre el control estirado | Traer la tarjeta entera (bruno; «Teclado y foco») |
| L8 | `interaction` de las hijas | Tabla de «Tarjetas hijas» (#605) |
| L9 | API mínima | `modelValue`, `multiple`, `label`/`labelledby`, `controls`; sin `density`, `labels` ni `appearance` en v1 (#604) |
| L10 | Tokens | Ninguno nuevo |
| L11 | Personalidad | A sola; C y B reservadas (#611) |
| L12 | `PENDIENTES.md` | Para el orquestador (no es de lima): la fila `GCardGroup` pasa a «contrato hecho»; tarjetas de formulario siguen reservadas (#124) |

## Límites conocidos (para el README)

- **Lector de pantalla real sin verificar:** la barra con tarjetas que contienen encabezados (NVDA en modo exploración podría leer el `h3` y el botón por separado) y `aria-describedby` con el contenido de la métrica.
- La lengüeta exige la tabla en el slot `panel`; con algo en medio se usa la rejilla.
- En móvil, con panel, hay tarjetas fuera de la vista (una fila que se desplaza).
- `aria-controls` no lo anuncian todos los lectores.
- Tarjetas con controles secundarios: no admitidas en v1.

## Fuera de v1 (reservado con nombre)

- **`appearance`**: en v1 la forma la decide el slot `panel` (lengüeta) o su ausencia (rejilla). Cuando entre una segunda forma, la prop se llamará `appearance` con **`tab`** (A, por defecto) y:
  - **`sentence`** · C · La frase (cifras que se pulsan dentro de un titular; cola «Se ven solo las 4 vencidas»; necesitaría `labels.showing` con `{count}` y `{label}`, `labels.all` e `Intl.ListFormat`). **Revisable**: el usuario no respondió si entra en la misma entrega; se aplazó por peso (#611).
  - **`parts`** · B · El todo y sus partes (anchos proporcionales; se vacían las de fuera). Su condición (las métricas reparten un total) no se comprueba desde el componente.
- **Pista de «hay más tarjetas»** en la tira con panel (`is-scrollable-start`/`-end` en la barra, como `GTabs`): **fuera del contrato de v1, reservada**. Hoy la tira se desplaza sin pista; se añadirá con los mismos nombres y la misma regla que `GTabs` si el uso lo pide.
- **`role="group"`** con controles secundarios (#609).
- **`filterKey` + `v-model:filters`** (#608).
- **Tarjetas de formulario:** `v-model` con mínimo/máximo y casilla maestra (#124).
- **`mandatory`** y tarjeta «Todas»: **descartados**, no reservados (kiwi 7 y 10).

## Verificación (cómo se da por hecho)

- **bruno** (unitarias y Playwright, puerto propio): `role="toolbar"` con nombre (y G1); una sola parada; Tab entra en la pulsada → última enfocada → primera elegible, y sale; ←/→ (espejo RTL), ↑/↓, Inicio/Fin sin vuelta; las flechas no emiten; Espacio/Intro alternan; `disabled`/`loading` fuera de la parada; `update:modelValue` y `change` en los dos modos (orden del DOM, desconocidos conservados, `[]` nunca `null`); cambio externo sin `change` ni foco, con desplazamiento solo de la tira; `aria-pressed`, `aria-controls` (prop y `ID-panel`), `aria-describedby="C-content"` dentro y `C-desc` fuera; la tabla de «Tarjetas hijas» y los avisos G1 a G9; `tabindex="-1"` en la tira con panel y **Firefox sin parada en la tira** (#570); **L7**: Fin trae la última tarjeta **entera** a la vista en WebKit a 375px; receta: quitar el chip suelta la tarjeta y pulsar otra sustituye el filtro, y la tabla anuncia (#569); puente: x y ancho Δ 0 respecto de la tarjeta, nace en su borde inferior, cubre el borde del panel, uno solo al cambiar sin `multiple`, se retira al soltar, RTL; Δ 0 de las cajas al pulsar; rendimiento sin re-medir en cada render del padre (bd888df); compuertas de peso.
- **coco** (auditoría con tema distinto al de defecto): forma del estado sin color (borde abierto hacia el marco), contraste del marco filtrado y del puente ≥ 3:1, foco visible distinto de la pulsada, claro y oscuro, `forced-colors`, `prefers-reduced-motion` (solo fundido), táctil 44px, RTL, rejilla a 375px (dos columnas) y tira con panel (una fila), sin desplazamiento horizontal de la página.
- **Solo en entorno real:** VoiceOver, NVDA y TalkBack (ver «Límites conocidos»); `forced-colors` real; `filterMode: 'external'` con carga real.
