# Declaración de cumplimiento · GTabs · r01

**Estado:** en revisión (aprobada para pasar a lima salvo las preguntas de la última sección; las marcadas «recomendada» se asumen si el usuario no responde).
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises (sin colores de Grana).
**Siguiente dueño:** lima → `design/contracts/tabs.md`.
**Prototipo:** `index.html` (siete composiciones funcionales).

## Anatomía

| # | Parte | Obligatoria | Nota |
| --- | --- | --- | --- |
| 1 | Raíz (`.gtabs`) | Sí | Contenedor de consulta por ancho propio (#69/#98); orientación como atributo |
| 2 | Cabecera | Sí | Agrupa `tablist`, botones de borde y botón «Más». **Ningún** hijo de `tablist` que no sea `tab` |
| 3 | `tablist` con nombre (`aria-label` o `aria-labelledby`) y `aria-orientation` | Sí | Sin nombre → aviso en desarrollo |
| 4 | `tab` (un `<button type="button" role="tab">`) | Sí, ≥ 1 | Partes internas en este orden: icono (decorativo), etiqueta, contador |
| 5 | Marca de selección (indicador) | Sí | Elemento o pseudo-elemento; su forma (línea, caja, segmento) es de coco. No lleva información que no esté también en `aria-selected` |
| 6 | Contador | No | Visual `aria-hidden` + texto oculto aportado por el consumidor («3 sin leer»); mismo modelo que `GBadge` con `count` |
| 7 | Botones de borde (inicio/fin) | Solo en `overflow="scroll"` | Solo puntero, `aria-hidden`, `tabindex="-1"`; visibles únicamente si hay contenido oculto de ese lado |
| 8 | Botón «Más» y su menú | Solo en `overflow="menu"` | **Fuera** del `tablist`; `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` |
| 9 | `tabpanel` por pestaña | Sí | `id` enlazado por `aria-controls` y `aria-labelledby` (dos sentidos) |
| 10 | Región de anuncios (`role="status"`, oculta) | Sí | Existe antes del cambio (mismo criterio que #14); anuncia «cargando/listo» de un panel |

## Estados

| Estado | Representación estructural |
| --- | --- |
| Activa | `aria-selected="true"`, `tabindex="0"`, marca de selección. Una sola |
| Inactiva | `aria-selected="false"`, `tabindex="-1"` |
| Con foco | Foco visible sobre la pestaña (itinerante, puede ser distinta de la activa en modo manual) |
| Deshabilitada | `aria-disabled="true"`, `tabindex="-1"`, no activa, **se omite con las flechas**; sigue en el DOM y cuenta en el total |
| Cargando (panel) | Panel `aria-busy="true"`; la pestaña **sigue habilitada**; esqueleto en el panel + anuncio por la región de estado |
| Vacío (panel) | Contenido del consumidor (estado vacío); `GTabs` no lo dibuja |
| Desbordada | Pestaña con `hidden`, fuera del `tablist` visible pero con `aria-setsize`/`aria-posinset` correctos; aparece en el menú |
| Sin pestañas | No se renderiza nada y se avisa en desarrollo (un `tablist` vacío es inválido) |
| Panel no visitado (`lazy`) | Sin contenido hasta la primera activación; luego permanece montado |

Pestaña activa deshabilitada (el consumidor la deshabilita a posteriori): sigue mostrando su panel; es el consumidor quien cambia `modelValue`.

## Comportamiento y teclado

| # | Regla |
| --- | --- |
| 1 | **Tabindex itinerante:** solo la pestaña activa (o la enfocada en manual) está en el orden de Tab; Tab desde ella va al panel (o a su primer control), Shift+Tab sale antes del `tablist` |
| 2 | Horizontal: **→/←** siguiente/anterior con **vuelta** al final; en RTL se invierten. ↑/↓ no se interceptan (el panel/página sigue desplazándose) |
| 3 | Vertical: **↓/↑** (con vuelta); ←/→ no se interceptan |
| 4 | **Home / End:** primera / última pestaña habilitada y visible |
| 5 | **Activación automática (defecto):** enfocar activa. **Manual:** las flechas solo mueven el foco; **Enter o Espacio** activan; `aria-selected` no cambia antes |
| 6 | Clic o toque activa y enfoca la pestaña |
| 7 | El panel sin contenido enfocable lleva `tabindex="0"`; si lo tiene, **no** (se recalcula al mostrarse). Verificado: «Formulario» → Tab va al campo; «Texto» → Tab va al panel |
| 8 | Paneles **montados y ocultos** por defecto (`hidden`) para no perder borradores (#78); `lazy` retrasa el montaje a la primera visita |
| 9 | **Pestañas deshabilitadas omitidas por las flechas** (no enfocables). Fundamento: es lo que APG ejemplifica y no deja foco en un control inoperante; coste: no se descubren con teclado → el motivo debe ir en la propia etiqueta o en el panel (pregunta 2) |
| 10 | Evento de cambio **cancelable** (precedente #97): el consumidor puede impedirlo (p. ej. «cambios sin guardar») y el foco no se pierde |
| 11 | Si el valor activo deja de existir o se deshabilita por cambio de datos: se activa la primera habilitada y se avisa en desarrollo |
| 12 | **Desplazamiento:** la pestaña enfocada o activada se desplaza a la vista; los botones de borde mueven ~70% del ancho visible; sin barra de scroll visible |
| 13 | **Menú «Más»:** abre con Enter, Espacio, ↓ (primer ítem) o ↑ (último); ↑/↓/Home/End mueven, **Escape** cierra y devuelve el foco al botón, Tab cierra. Elegir un ítem activa esa pestaña, la hace visible y le da el foco. La activa nunca se oculta. Patrón de `GMenu` (#82), con `menuitemradio` |
| 14 | Con `orientation="vertical"` el desbordamiento es **desplazamiento** vertical con altura máxima del consumidor; el menú «Más» no aplica |

## Roles y ARIA

`tablist` › `tab` (`aria-selected`, `aria-controls`, `aria-disabled`, `aria-setsize`/`aria-posinset` solo cuando hay pestañas ocultas) ; `tabpanel` (`aria-labelledby`, `tabindex`, `aria-busy`, `hidden`); `aria-orientation` en `tablist` (sigue al **diseño real**: si pasa de vertical a horizontal por ancho, cambia con él); región `role="status"`; botón «Más» con `aria-haspopup="menu"`/`aria-expanded`; menú `menu` › `menuitemradio` (`aria-checked`). Iconos y contador visual: `aria-hidden`. El nombre accesible de la pestaña = etiqueta + texto del contador. Sin textos por defecto: `labels` del consumidor (nombre del `tablist`, «Más pestañas», anuncio de carga), con aviso en desarrollo si faltan (#97).

## Responsive

- **Por ancho del contenedor**, no de la ventana (#69, #98); sin consultas de medios con valores fijos. El umbral de vertical → horizontal debe **derivarse de `space`** (el prototipo usa 480px como ejemplo; el valor lo fija lima/bruno, como en `GSidebar`).
- Estrecho en horizontal: `overflow="scroll"` (defecto) u `overflow="menu"`. Sin desborde horizontal de la página a 320px (verificado con 9 pestañas en ambos modos).
- Objetivo táctil ≥ 44px con `pointer: coarse` y ≥ 24px siempre (tokens.md §7; lo aplica coco; el prototipo usa 40px solo como wireframe).
- `stretch`: las pestañas reparten el ancho (útil con 2–4); con desbordamiento no aplica.
- Densidad: `density` reduce altura y padding con piso de 24px (#15; prototipo `compact`/`comfortable`).

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | `tablist`/`tab`/`tabpanel` enlazados en ambos sentidos |
| WCAG 1.4.1 Uso del color | Pendiente de estilo | La estructura da `aria-selected` + marca de forma; coco no debe usar solo color |
| WCAG 1.4.10 Reajuste | Cumple | 320px sin desborde de página (scrollWidth = 320) |
| WCAG 2.1.1 Teclado | Cumple | Flechas, Home/End, Enter/Espacio, menú con Escape |
| WCAG 2.4.3 Orden del foco | Cumple | Tab: pestaña → panel/primer control; foco devuelto a «Más» al cerrar |
| WCAG 2.4.7 Foco visible | Cumple en prototipo | Contorno de 3px; estilo final de coco |
| WCAG 2.5.8 Tamaño del objetivo | Pendiente de estilo | Lo fija coco |
| WCAG 4.1.2 Nombre, función, valor | Cumple por diseño | Roles, `aria-selected`, `aria-expanded`, contador en el nombre |
| WCAG 4.1.3 Mensajes de estado | Cumple por diseño | Región `status` presente antes del cambio |
| Heurística: visibilidad del estado | Cumple | Activa marcada por forma y texto en negrita, cargando por esqueleto + anuncio |
| Heurística: control y libertad | Cumple | Cambio cancelable; la activa nunca se oculta |

## Comprobaciones ejecutadas

Playwright (Chromium), página local, sin errores de consola ni de página:

- Automática: → mueve y activa; End; vuelta al final; ↓ ignorada en horizontal; `aria-controls`/`aria-labelledby` consistentes; Tab sale al primer campo del panel con controles.
- Manual: → mueve el foco sin cambiar `aria-selected`; Enter activa.
- Deshabilitada: omitida por → y sin efecto al clic.
- Desplazamiento: botones de borde aparecen/desaparecen según el extremo (inicio → solo fin; tras End → solo inicio).
- Menú «Más»: con 9 pestañas en 420px, 6 ocultas con `aria-setsize` 9; ↓ abre y enfoca el primer ítem; Escape devuelve el foco al botón; elegir un ítem activa la pestaña (ahora visible) y la enfoca.
- Vertical: ↓ mueve, → no; al estrechar a 400px pasa a horizontal y `aria-orientation` cambia.
- Panel sin controles: `tabindex="0"` y Tab llega al panel; panel `lazy` con `aria-busy` true → false.
- RTL: ← avanza a la siguiente pestaña.
- 320px: sin desborde de página.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): «pestaña, 2 de 5», anuncio de contador y del estado de carga, y menú de desbordamiento con `aria-checked`.
- Firefox y WebKit (la verificación entre navegadores de #108 queda para bruno).
- Táctil real y zoom al 200%; scroll con rueda y gestos.
- Contraste, `forced-colors` (la marca de selección no debe depender solo del color o del fondo), `prefers-reduced-motion`: del estilo final.
- Cambio de `modelValue` desde fuera con la pestaña oculta en el menú (prototipo sin `v-model`).
- Panel con el menú «Más» abierto durante un redimensionado.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Entrega de pestañas | Alta | Prop `items` (`{ id, label, icon?, count?, countLabel?, disabled? }`) y `v-model` (`modelValue` = `id`). Contenido por **slot por id** (`panel-{id}`); slots opcionales `tab-{id}` para personalizar la pestaña manteniendo la anatomía |
| 2 | Ejes | Alta | `orientation` (`horizontal` \| `vertical`), `activation` (`auto` \| `manual`), `overflow` (`scroll` \| `menu`), `appearance` (`line` \| `enclosed`; nombre y valores finales: lima/coco, **no** `variant` de botón), `stretch` (booleano), `density` (compartida) |
| 3 | Adaptación | Media | `responsive` (`auto` por defecto \| `never`): vertical → horizontal por ancho de contenedor derivado de `space`; ampliar la excepción de literales de #34/#39 solo si hace falta |
| 4 | Montaje de paneles | Media | `keepMounted` (por defecto sí, #78) y `lazy` (montar en la primera visita). `inert`/`hidden` en los inactivos |
| 5 | Eventos | Alta | `update:modelValue` y `change` `{ id, index, source: 'keyboard' \| 'pointer' \| 'menu' }`, **cancelable**; `focus-change` solo en manual si el consumidor lo necesita |
| 6 | Carga por pestaña | Media | Marca `loading` por ítem: panel con `aria-busy`, texto/anuncio del consumidor (`labels.loading`); sin valor por defecto |
| 7 | Textos | Alta | `labels` sin valores por defecto (nombre del `tablist` obligatorio, «Más pestañas», anuncios); aviso en desarrollo |
| 8 | Tokens | Media | Reutilizar los existentes: marca de selección (color primario/acento y `--g-border-width`), separador, foco, `space`, `duration-fast`, `ease-standard`, radio de `enclosed`. Proponer solo los que falten (p. ej. grosor de la marca si no basta `border-width`) |
| 9 | Iconos | Baja | Lucide vía `GIcon` (`chevron-left`, `chevron-right`, `chevron-down`); icono por pestaña = nombre de Lucide, solo los de la lista de `icons.md` §4 (añadir los que falten) |
| 10 | Contador | Baja | Reutilizar `GBadge` en modo `count` dentro de la pestaña (decide lima si se compone o se replica) |
| 11 | Menú «Más» | Media | Reutilizar `GMenu` (`items` con casillas/opciones, #82–83) si su disparador-slot admite el botón fuera del `tablist`; si no, lista propia mínima |
| 12 | Pestaña activa que desaparece o se deshabilita | Baja | Ver comportamiento #11 |

## Preguntas abiertas para el usuario (decisiones de producto)

1. **Activación por defecto:** automática (recomendada: APG la prefiere si el panel se muestra al instante) o manual. Con paneles que cargan datos, ¿quieres que `activation="manual"` sea el defecto?
2. **Pestañas deshabilitadas:** hoy se omiten con las flechas (recomendada). Alternativa: que reciban foco para que sean descubribles y poder explicar el porqué. ¿Cuál?
3. **Desbordamiento por defecto:** `scroll` (recomendada: mantiene el orden y el modelo mental) o `menu`. ¿Se publican ambos en v0.1?
4. **Pestañas cerrables / añadibles:** fuera de r01. ¿Las necesitas ya (ronda r02) o se difieren?
5. **`appearance`:** el prototipo muestra `line` y `enclosed`. ¿Basta con esas dos en v0.1 o quieres además una tercera (p. ej. «píldora» tipo segmento)? Es decisión de identidad: la tomará coco con tu visto bueno.
6. **¿Contador y menú reutilizando `GBadge` y `GMenu`** (menos código, más acoplamiento) o implementación propia mínima?
