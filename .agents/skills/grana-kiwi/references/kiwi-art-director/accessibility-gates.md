# Compuertas de accesibilidad

La accesibilidad en Kiwi es una compuerta sin umbral. A diferencia de la auto-auditoría estética, donde 3 señales indican un diseño genérico, aquí basta **un solo fallo** en cualquiera de los 6 criterios (contraste, foco visible, touch targets, motion, teclado, semántica) para bloquear la entrega hasta repararlo y volver a medirlo.

**Estándar aplicado.** El mínimo es WCAG 2.2 nivel AA. Sobre ese mínimo, el bundle impone reglas más estrictas que se declaran como tales y nunca se presentan como requisitos AA:

| Regla del bundle | Mínimo WCAG 2.2 AA | Origen de la regla más estricta |
|---|---|---|
| Touch targets de 44×44 CSS px en compact (móvil) | 24×24 CSS px (2.5.8 Target Size (Minimum), AA) | 2.5.5 Target Size (Enhanced), AAA, y guías de plataforma móvil |
| Respetar `prefers-reduced-motion` en todo motion no esencial | Solo se exige pausa para movimiento automático de más de 5 s (2.2.2, A) y no superar 3 destellos por segundo (2.3.1, A) | 2.3.3 Animation from Interactions, AAA |
| Indicador de foco con contraste de al menos 3:1 frente a los colores adyacentes | 2.4.7 Focus Visible (AA) exige que el foco sea visible, sin fijar ratio; 1.4.11 Non-text Contrast (AA) exige 3:1 a la información visual necesaria para identificar estados | 2.4.13 Focus Appearance, AAA, como referencia de área y contraste |

**Formato de reporte.** Cada hallazgo se registra en cuatro pasos: **observación → consecuencia para el usuario → cambio → re-verificación**. La re-verificación es una medida nueva sobre el artefacto renderizado, no la repetición del valor calculado antes del cambio.

**Lo no verificado se etiqueta.** Si una comprobación no pudo hacerse (sin lector de pantalla, sin dispositivo táctil real, sin navegador con emulación de movimiento reducido), la entrega lo dice con esa palabra: «no verificado», más la razón y la comprobación sustituta que sí se hizo. Un criterio no verificado nunca se reporta como aprobado.

**Regla de redondeo.** Los ratios se truncan a dos decimales; nunca se redondean hacia arriba. Un 4.497:1 es 4.49:1 y falla 4.5:1. Todos los ratios de este documento se calcularon con la fórmula de luminancia relativa de WCAG y se truncaron.

## Criterios WCAG 2.2 AA aplicables a diseño

### 1. Contraste

**Qué exige**

- **1.4.3 Contrast (Minimum), AA.** Texto normal: al menos 4.5:1 contra su fondo. Texto grande: al menos 3:1. Texto grande es ≥ 18 pt (24 CSS px) en peso normal, o ≥ 14 pt (≈ 18.66 CSS px) en negrita (700 o más).
- **1.4.11 Non-text Contrast, AA.** Al menos 3:1 contra los colores adyacentes para los componentes de interfaz (bordes de campos, controles, indicadores de estado y de foco) y para los objetos gráficos necesarios para entender el contenido (líneas de un gráfico, iconos que informan).
- **1.4.1 Use of Color, A.** El color no es el único medio para transmitir información, indicar una acción o distinguir un elemento. Un enlace dentro de un párrafo se distingue por algo más que el tono (subrayado, peso), y un estado de error lleva texto o icono además del rojo.
- **1.4.6 Contrast (Enhanced), AAA**, pide 7:1 para texto normal y 4.5:1 para texto grande. No es obligatorio; los tokens base del bundle lo alcanzan y se reporta como dato, no como exigencia.

Exentos de 1.4.3: texto puramente decorativo, texto de controles inactivos (`disabled`), texto que forma parte de una imagen sin función informativa y logotipos. La exención de `disabled` no cubre controles que solo parecen inactivos.

**Cómo verificarlo**

Manual:
1. Lista cada par texto/fondo **efectivo**: el color que llega a la pantalla, no el declarado. Con capas translúcidas, `backdrop-filter`, `mix-blend-mode`, imágenes o gradientes, el fondo efectivo es el compuesto.
2. En gradientes e imágenes, mide el punto más desfavorable del área que ocupa el texto (el stop más claro bajo texto claro, la zona más oscura bajo texto oscuro).
3. Repite la medida en cada estado: reposo, hover, foco, activo, error, seleccionado, y en cada tema.
4. Para no-texto, mide el borde o el relleno del control contra el fondo que lo rodea, y el indicador de estado contra el control.

Automatizable: la función siguiente calcula el ratio sin dependencias y compone una capa translúcida sobre su fondo antes de medir.

```js
// Ratio de contraste WCAG 2.x, sin dependencias. Entrada: hex de 6 dígitos.
const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lin = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);

function contrastRatio(fgHex, bgHex) {
  const [hi, lo] = [luminance(hexToRgb(fgHex)), luminance(hexToRgb(bgHex))].sort((a, b) => b - a);
  return Math.floor(((hi + 0.05) / (lo + 0.05)) * 100) / 100; // truncar, nunca redondear hacia arriba
}

// Color efectivo de una capa rgba(layerHex, alpha) sobre un fondo opaco.
function composite(layerHex, alpha, bgHex) {
  const b = hexToRgb(bgHex);
  return '#' + hexToRgb(layerHex)
    .map((c, i) => Math.round(c * alpha + b[i] * (1 - alpha)).toString(16).padStart(2, '0'))
    .join('');
}

contrastRatio('#999999', '#FFFFFF'); // 2.84 → falla 4.5:1 y 3:1
contrastRatio('#767676', '#FFFFFF'); // 4.54 → cumple 4.5:1
```

**Ejemplo de fallo**

```css
.meta { color: #6B6B66; background: #050505; font-size: 14px; } /* 3.80:1, texto normal exige 4.5:1 → FALLA 1.4.3 */
.field { border: 1px solid #2A2A2A; }                            /* 1.42:1 sobre #050505 → FALLA 1.4.11 */
```

**Ejemplo de corrección**

```css
.meta { color: var(--color-paper-muted); background: var(--color-ink); } /* #A3A39E: 8.04:1 */
.field { border: 1px solid #6B6B66; }                                    /* 3.80:1 → cumple 3:1 no-texto */
```

`#6B6B66` falla como texto normal (3.80:1 < 4.5:1) pero cumple como borde de componente (≥ 3:1) y como texto grande. El mismo color tiene veredictos distintos según su función: registra la función junto al ratio.

**Trampas frecuentes en dirección de arte**

- **Texto sobre capas translúcidas o con blur.** `#A3A39E` sobre `#050505` mide 8.04:1, pero si una capa de cristal deja el fondo efectivo en `#3A3A3A`, el mismo texto mide 4.49:1 y falla. Mide contra el compuesto, y contra el contenido más claro que pueda pasar por detrás del `backdrop-filter`.
- **`mix-blend-mode`.** El color resultante depende de lo que hay debajo y cambia con el scroll. El texto va en una capa sin mezcla, por encima de la capa mezclada.
- **Gradientes.** Un gradiente radial de 3+ stops puede cumplir en el centro y fallar en el borde. Se mide el peor punto bajo el texto.
- **Texto sobre imagen.** Sin un velo opaco o un scrim medido, el contraste depende de la foto. Se mide contra la zona más desfavorable de la imagen real y del fallback.
- **Acento metálico sobre papel.** `#F5F5F0` sobre `#C4A77D` mide 2.09:1: falla incluso como texto grande. Sobre el acento va tinta (`#050505`, 8.90:1).
- **Placeholder como etiqueta.** El texto de placeholder también es texto y debe cumplir 4.5:1 si transmite información; además no sustituye a la etiqueta (ver criterio 6).

### 2. Foco visible

**Qué exige**

- **2.4.7 Focus Visible, AA.** Todo componente operable por teclado tiene un indicador de foco visible.
- **2.4.11 Focus Not Obscured (Minimum), AA** (nuevo en 2.2). Cuando un componente recibe foco, no queda **totalmente** oculto por contenido creado por el autor: cabeceras sticky, banners de cookies, barras inferiores fijas, paneles superpuestos. 2.4.12 Focus Not Obscured (Enhanced), AAA, pide que no quede oculta ninguna parte.
- **1.4.11 Non-text Contrast, AA.** El indicador de foco es información visual de estado; debe tener al menos 3:1 contra los colores adyacentes.
- **2.4.13 Focus Appearance, AAA** (nuevo en 2.2). Referencia, no exigencia: área de al menos el perímetro de 2 CSS px del componente y 3:1 entre el estado con foco y sin foco.
- **Regla del bundle:** indicador mediante `:focus-visible` con al menos 3:1 contra cada color adyacente (el fondo del componente y el fondo de la página), en todos los temas.

**Cómo verificarlo**

Manual:
1. Recorre la vista con Tab y Shift+Tab sin ratón. Cada parada muestra un indicador claro y distinto del hover.
2. Mide el color del indicador contra el fondo de página y contra el relleno del componente.
3. Con cabeceras sticky o paneles fijos, avanza el foco hasta los elementos que pasan por debajo; comprueba que el navegador los desplaza a la vista y que el elemento no queda cubierto del todo.
4. Repite en compact, medium y expanded: un panel fijo inferior en móvil es la causa típica de fallos de 2.4.11.

Automatizable: el hook `validate-focus` del bundle detecta `outline: none` u `outline: 0` sin sustituto en `:focus-visible`. Un script en el navegador puede recorrer los elementos enfocables, llamar a `focus()` y comparar `getBoundingClientRect()` del elemento con el de los elementos fijos o sticky para detectar ocultación total.

**Ejemplo de fallo**

```css
button:focus {
  outline: none; /* el usuario de teclado pierde su posición → FALLA 2.4.7 */
}
```

**Ejemplo de corrección**

```css
:root { --focus-ring: #FF6B35; }                     /* 7.18:1 sobre #050505 */
:root[data-theme="light"] { --focus-ring: #050505; } /* 18.63:1 sobre #F5F5F0 */
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--focus-ring);
  outline-offset: 2px; /* el anillo queda sobre el fondo de página */
}
html { scroll-padding-block: 89px 55px; } /* 2.4.11: cabecera sticky y barra fija inferior */
```

Medida honesta del anillo `outline: 2px solid #FF6B35; outline-offset: 2px`:

| Indicador | Fondo adyacente | Ratio | Veredicto (≥ 3:1) |
|---|---|---|---|
| `#FF6B35` | `#050505` (tema oscuro) | 7.18:1 | Cumple |
| `#FF6B35` | `#F5F5F0` (tema claro) | 2.59:1 | **Falla** |
| `#FF6B35` | `#C4A77D` (botón de acento) | 1.23:1 | **Falla** |

Por eso el naranja solo se usa en el tema oscuro sobre near-black y el tema claro cambia el token a tinta. Aun con offset, mide también contra el relleno del componente: el borde interior del anillo lo toca.

**Trampas frecuentes en dirección de arte**

- **`outline: none` para limpiar el diseño.** Elimina el indicador sin sustituto. Si el material pide otro tratamiento (luz interior, borde), se añade además de un indicador medible, nunca en su lugar.
- **Anillo del mismo color que el acento.** Un anillo `#C4A77D` en un botón con relleno `#C4A77D` no se ve. Usa `outline-offset` y un color que contraste con el fondo de página.
- **Foco solo con `box-shadow` difuso.** Una sombra de baja opacidad no alcanza 3:1 y desaparece en el modo de colores forzados; `outline` se conserva en ese modo.
- **Superposiciones de Topological Betrayal.** Un bloque desplazado con `transform` o margen negativo puede cubrir un enlace al recibir foco → fallo de 2.4.11. Se corrige la superposición o el `z-index` del elemento enfocado, no se acepta el solapamiento.
- **`overflow: hidden` que recorta el anillo.** Un contenedor con recorte corta el `outline-offset`; usa offset negativo o padding en el contenedor.

### 3. Touch targets

**Qué exige**

- **2.5.8 Target Size (Minimum), AA** (nuevo en 2.2). El área de un objetivo de puntero mide al menos 24×24 CSS px, salvo estas excepciones:
  - **Spacing:** el objetivo es menor, pero un círculo de 24 CSS px de diámetro centrado en su caja no corta a otro objetivo ni al círculo de otro objetivo pequeño.
  - **Equivalent:** la misma función está disponible en otro control de la misma página que sí cumple.
  - **Inline:** el objetivo está dentro de una frase o bloque de texto y su tamaño lo limita el interlineado.
  - **User agent control:** el tamaño lo determina el navegador y el autor no lo modificó.
  - **Essential:** una presentación concreta es esencial o la exige la ley (por ejemplo, puntos en un mapa).
- **2.5.5 Target Size (Enhanced), AAA:** 44×44 CSS px.
- **Regla del bundle:** en compact (móvil y táctil), todo control interactivo tiene un área de 44×44 CSS px; en medium y expanded con puntero fino rige el mínimo AA de 24×24 con sus excepciones. Ninguna superposición reduce el área efectiva por debajo de ese valor.

**Cómo verificarlo**

Manual: en emulación de dispositivo de 360–390 CSS px de ancho, inspecciona cada control y lee su caja en las herramientas del navegador. Toca con el dedo en un dispositivo real si está disponible; si no, etiqueta la prueba táctil como «no verificada».

Automatizable:

```js
// Lista controles con área menor que el mínimo indicado.
function smallTargets(min = 44) {
  const sel = 'a[href], button, input, select, textarea, [role="button"], [tabindex]';
  return Array.from(document.querySelectorAll(sel))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.width > 0 && (r.width < min || r.height < min));
}
```

El script mide la caja del elemento, no la del pseudo-elemento que amplía el área; revisa a mano los controles que usan la técnica de `::before`.

**Ejemplo de fallo**

```css
.icon-close {
  width: 16px;
  height: 16px; /* 16×16: falla AA 24×24 y la regla 44×44 del bundle */
  padding: 0;
}
```

**Ejemplo de corrección**

Ampliar el área sin cambiar la huella visual, con padding y margen negativo, o con un pseudo-elemento:

```css
/* Opción A: padding */
.icon-close { inline-size: 16px; block-size: 16px; box-sizing: content-box;
  padding: 14px;   /* 16 + 14 + 14 = 44 */
  margin: -14px; } /* conserva la posición visual */

/* Opción B: ::before con inset negativo */
.icon-btn { position: relative; inline-size: 16px; block-size: 16px; }
.icon-btn::before { content: ""; position: absolute; inset: -14px; } /* área 44×44 */
```

Verifica que el `::before` ampliado no se solape con el área de otro control: dos áreas superpuestas generan toques ambiguos.

**Trampas frecuentes en dirección de arte**

- **Iconos finos de trazo light.** Un icono outline de 16 px se percibe pequeño y suele heredar un botón del mismo tamaño. El área táctil es independiente del tamaño del glifo.
- **Elementos superpuestos.** Una capa decorativa con `position: absolute` sobre un botón captura el toque; usa `pointer-events: none` en la capa decorativa y comprueba el área restante.
- **Spacing de la secuencia 8–13.** Dos controles de 24 px separados por 8 px pueden cumplir AA por la excepción de spacing y fallar la regla del bundle en compact.

### 4. Motion

**Qué exige**

- **2.2.2 Pause, Stop, Hide, A.** Todo contenido que se mueve, parpadea o se desplaza de forma automática, dura más de 5 segundos y se presenta junto a otro contenido, tiene un mecanismo para pausarlo, detenerlo u ocultarlo. Lo mismo para contenido que se actualiza automáticamente.
- **2.3.1 Three Flashes or Below Threshold, A.** Nada destella más de 3 veces en cualquier periodo de 1 segundo, salvo que el destello quede por debajo de los umbrales generales y de rojo.
- **2.3.3 Animation from Interactions, AAA.** El motion activado por una interacción puede desactivarse, salvo que sea esencial.
- **Regla del bundle:** todo motion no esencial respeta `@media (prefers-reduced-motion: reduce)`. Bajo esa preferencia: sin desplazamientos, escalas, parallax ni rebotes de spring; se conservan los cambios de opacidad o de color inmediatos y todos los cambios de estado. Esta regla supera el mínimo AA y se declara como regla del bundle.

| Motion Trinity | Movimiento completo | Con `prefers-reduced-motion: reduce` |
|---|---|---|
| Entrance | Desplazamiento de 13 px + opacidad, escalonado | Aparición inmediata o fundido de opacidad breve, sin desplazamiento |
| Hover | Cambio de luz del material | Cambio de color inmediato |
| Click | Compresión con spring | Cambio de estado sin compresión |
| Foco | Igual que hover + indicador | Indicador presente, sin transición de posición |

Qué se conserva siempre: la información de estado (carga, éxito, error), el indicador de foco y el progreso. Un spinner puede sustituirse por un indicador de progreso estático o un texto («Cargando» con `aria-live`), pero el estado no desaparece.

**Cómo verificarlo**

Manual: activa la preferencia en el sistema operativo o emúlala en las herramientas del navegador (en Chrome DevTools, panel Rendering, «Emulate CSS media feature prefers-reduced-motion»). Recarga y recorre todos los estados. Cronometra cualquier animación automática: si supera 5 s, busca el control de pausa.

Automatizable: comprobar en el CSS compilado que existe un bloque `prefers-reduced-motion: reduce` y que en él no quedan `transform`, `translate`, `scale` ni `animation` con desplazamiento. Buscar en el código `autoplay`, `setInterval` y animaciones `infinite` para revisar 2.2.2.

**Ejemplo de fallo**

```css
.card { animation: rise 640ms cubic-bezier(0.16, 1, 0.3, 1) both; }
.hero-bg { animation: drift 20s linear infinite; } /* automático, > 5 s, sin pausa → FALLA 2.2.2 */
/* Sin bloque de reduced motion → incumple la regla del bundle */
```

**Ejemplo de corrección**

```css
.card { animation: rise 320ms cubic-bezier(0.16, 1, 0.3, 1) both; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
  .card { animation: none; opacity: 1; transform: none; }
  .hero-bg { animation: none; }
}
```

La animación de fondo lleva además un botón visible «Pausar animación de fondo» con `aria-pressed`, para 2.2.2 con la preferencia desactivada. El reset global de 1 ms es una red de seguridad, no el diseño: cada componente declara su versión reducida.

**Trampas frecuentes en dirección de arte**

- **Parallax y scroll-driven animations.** Son movimiento disparado por interacción; bajo reduced motion se eliminan por completo.
- **Entrances escalonadas largas.** Diez elementos con 55 ms de escalonado y 320 ms de duración tardan casi 1 s en estar disponibles; bajo reduced motion aparecen a la vez.
- **Gradientes animados o «respiración» del material.** Un fondo que pulsa sin fin es movimiento automático: si dura más de 5 s y comparte pantalla con contenido, necesita pausa (2.2.2).
- **Glow intermitente o cambios bruscos de luminancia.** Un parpadeo de alto contraste más rápido que 3 por segundo puede desencadenar crisis; 2.3.1 es nivel A.
- **Vídeo de fondo con `autoplay`.** Necesita control de pausa visible y accesible por teclado, y bajo reduced motion se muestra un fotograma estático.

### 5. Teclado

**Qué exige**

- **2.1.1 Keyboard, A.** Toda la funcionalidad es operable con teclado, sin tiempos específicos por pulsación.
- **2.1.2 No Keyboard Trap, A.** Si el foco entra en un componente con teclado, puede salir con teclado; si requiere algo distinto de Tab o flechas, se informa al usuario.
- **2.4.3 Focus Order, A.** El orden de foco preserva el significado y la operabilidad: coincide con el orden de lectura aprobado en la Fase 1.
- **2.4.7 Focus Visible, AA** (ver criterio 2).

Convenciones obligatorias en el bundle:

- Enter activa enlaces y botones; Space activa botones, casillas y conmutadores.
- Esc cierra overlays (diálogos, menús, popovers) y el foco vuelve al control que los abrió.
- Un diálogo modal mantiene el foco dentro mientras está abierto (esto no es una trampa: Esc y el botón de cierre permiten salir).
- Widgets compuestos (tabs, listbox, menú, grid, toolbar) usan **roving tabindex**: una sola parada de Tab para el grupo y flechas para moverse dentro.

**Cómo verificarlo**

Manual: desconecta el ratón o no lo toques. Completa la tarea principal del brief de principio a fin solo con Tab, Shift+Tab, Enter, Space, flechas y Esc, en compact, medium y expanded. Anota cada parada de foco y compárala con el orden de lectura aprobado.

Automatizable: un script en el navegador puede listar los elementos enfocables en orden DOM con su `getBoundingClientRect()` y señalar los que saltan hacia arriba respecto al anterior. Un salto puede ser legítimo (nueva columna); la decisión final es manual.

**Ejemplo de fallo**

```html
<div class="card" onclick="openDetail()">Ver detalle</div>
<!-- No recibe foco ni responde a Enter o Space → FALLA 2.1.1 -->
```

**Ejemplo de corrección**

```html
<button type="button" class="card" aria-expanded="false" aria-controls="detail-42">Ver detalle</button>
```

Para overlays, `<dialog>` con `showModal()` gestiona el foco interno y Esc; al evento `close` se devuelve el foco con `trigger.focus()`. Para widgets compuestos, roving tabindex:

```js
function rovingTabs(tablist) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  tablist.addEventListener('keydown', (e) => {
    const i = tabs.indexOf(document.activeElement);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (i < 0 || next === undefined) return;
    e.preventDefault();
    const target = tabs[(next + tabs.length) % tabs.length];
    tabs.forEach((t) => t.setAttribute('tabindex', t === target ? '0' : '-1'));
    target.focus();
  });
}
```

**Trampas frecuentes en dirección de arte**

- **Reordenación visual con CSS.** `order`, `grid-area`, `grid-template-areas`, `flex-direction: row-reverse` o `column-reverse` y el posicionamiento absoluto cambian el orden visual sin cambiar el DOM. La traición topológica es visual; si invierte la lectura percibida, el orden de foco ya no coincide y se corrige el layout, no el `tabindex`.
- **`tabindex` positivo.** `tabindex="1"` o mayor rompe el orden natural de toda la página. Solo se usan `0` y `-1`.
- **Hover como única vía.** Un menú o una acción que solo aparece con `:hover` es inalcanzable con teclado; muestra el mismo contenido con `:focus-within`.
- **Contenido fuera de pantalla enfocable.** Paneles ocultos con `transform` o `opacity: 0` siguen recibiendo foco; usa `inert` o `hidden` cuando no estén visibles.

### 6. Semántica

**Qué exige**

- **1.3.1 Info and Relationships, A.** La estructura que se ve (encabezados, listas, tablas, grupos de campos, regiones) está en el markup o es determinable por programa.
- **4.1.2 Name, Role, Value, A.** Cada componente de interfaz expone nombre accesible, rol y estado; los cambios de estado se notifican.
- **3.3.2 Labels or Instructions, A.** Los campos que piden datos tienen etiqueta o instrucciones.
- **1.1.1 Non-text Content, A.** Las imágenes informativas tienen texto alternativo equivalente; las decorativas se ocultan a la tecnología de apoyo.
- **3.1.1 Language of Page, A.** El documento declara su idioma con `lang`.

Reglas de markup del bundle:

- Landmarks completos: `header`, `nav`, `main` (uno por vista), `footer`; `aside` y `section` con nombre cuando aporten.
- Un `h1` por vista y encabezados sin saltos de nivel (`h2` → `h4` no).
- `button` para acciones en la misma vista; `a href` para navegar a otra URL o ancla.
- `label for` asociado a cada campo; `fieldset` y `legend` para grupos de opciones.
- ARIA solo cuando el HTML nativo no alcanza; un `role` incorrecto es peor que ninguno.
- Botones de solo icono con nombre accesible (`aria-label` o texto visualmente oculto).
- `alt=""` en imágenes decorativas; `alt` descriptivo de lo que el usuario necesita saber en las informativas.
- `<html lang="es">` (o el idioma del contenido), y `lang` en fragmentos de otro idioma.

**Cómo verificarlo**

Manual: inspecciona el árbol de accesibilidad en las herramientas del navegador (panel Accessibility en Chrome o Firefox). Comprueba el nombre, el rol y el estado de cada control. Recorre la vista con un lector de pantalla (VoiceOver, NVDA, TalkBack) navegando por encabezados y landmarks. Si no hay lector disponible, la entrega declara: «sin lector de pantalla real disponible: semántica revisada solo en el markup y el árbol de accesibilidad».

Automatizable: axe DevTools y Lighthouse detectan imágenes sin `alt`, campos sin etiqueta, botones sin nombre, `lang` ausente, saltos de encabezado y landmarks duplicados.

**Ejemplo de fallo**

```html
<div class="nav">
  <span class="link" onclick="go('/lotes')">Lotes</span>
</div>
<div class="title-xl">Inventario</div>
<button><i class="ph-light ph-trash"></i></button>
<input placeholder="Correo">
<img src="lote-17.jpg">
```

**Ejemplo de corrección**

```html
<html lang="es">
  <header><nav aria-label="Principal"><a href="/lotes">Lotes</a></nav></header>
  <main>
    <h1>Inventario</h1>
    <button type="button" aria-label="Eliminar lote 17">
      <i class="ph-light ph-trash" aria-hidden="true"></i>
    </button>
    <label for="email">Correo</label>
    <input id="email" type="email" autocomplete="email">
    <img src="lote-17.jpg" alt="Lote 17: doce cajas apiladas, etiqueta de caducidad visible">
    <img src="textura.png" alt="">
  </main>
</html>
```

**Trampas frecuentes en dirección de arte**

- **Tamaño visual como jerarquía.** Un display enorme en un `div` no es un encabezado. Si el material pide que el `h2` se vea más grande que el `h1`, se cambia el estilo, no el nivel.
- **Texto decorativo en el DOM.** Palabras gigantes de fondo, numerales ornamentales o letras sueltas se leen en voz alta; llevan `aria-hidden="true"` y no contienen información única.
- **Iconos como única señal.** Un icono de estado sin texto falla 1.1.1 si informa, y falla 1.4.1 si solo el color distingue el estado.
- **Etiquetas visibles distintas del nombre accesible.** Si el botón dice «Guardar» y su `aria-label` dice «Enviar formulario», un usuario de control por voz no puede activarlo (2.5.3 Label in Name, A).
- **Imágenes generadas con `alt` genérico.** «Imagen generada por IA» no es texto alternativo; describe lo que aporta o márcala decorativa.

### Criterios complementarios

Estos criterios no son compuertas independientes, pero un fallo en ellos se reporta dentro del criterio de la tabla y bloquea igual.

| Criterio | Nivel | Qué vigilar en dirección de arte | Compuerta |
|---|---|---|---|
| 1.4.10 Reflow | AA | A 320 CSS px de ancho (400 % de zoom sobre 1280) no hay scroll en dos dimensiones; los sangrados y desplazamientos de la traición no generan scroll horizontal | Semántica / adaptación |
| 1.4.12 Text Spacing | AA | Con interlineado 1.5, espaciado de párrafo 2×, letras 0.12× y palabras 0.16× del tamaño, no se pierde ni se recorta texto; evita alturas fijas en contenedores de texto | Contraste / legibilidad |
| 2.5.7 Dragging Movements | AA | Alternativa de puntero único para todo arrastre | Touch targets |
| 3.2.6 Consistent Help | A | Mismo orden relativo de los mecanismos de ayuda entre páginas | Semántica |
| 3.3.7 Redundant Entry | A | No pedir dos veces el mismo dato en un proceso | Teclado |
| 3.3.8 Accessible Authentication (Minimum) | AA | Permitir pegar y autocompletar en campos de acceso | Semántica |

## Tokens accesibles por construcción

El contraste se decide al definir el token, no al revisar el componente. Cada token de color de texto o de primer plano declara contra qué fondo se usa, su ratio truncado y el nivel que alcanza. Un componente solo puede combinar pares declarados.

Formato DTCG con los valores del bundle. Las propiedades de accesibilidad van bajo una clave con espacio de nombres dentro de `$extensions`, como recomienda el formato:

```json
{
  "color": {
    "ink": { "$type": "color", "$value": "#050505", "$description": "Fondo near-black base" },
    "accent": { "$type": "color", "$value": "#C4A77D", "$description": "Acento metálico; solo con tinta encima" },
    "paper": {
      "$type": "color",
      "$value": "#F5F5F0",
      "$description": "Texto principal sobre ink",
      "$extensions": {
        "kiwi.a11y": { "contrastAgainst": "{color.ink}", "contrastRatio": 18.63, "wcagLevel": "AAA" }
      }
    },
    "paper-muted": {
      "$type": "color",
      "$value": "#A3A39E",
      "$description": "Texto secundario sobre ink",
      "$extensions": {
        "kiwi.a11y": { "contrastAgainst": "{color.ink}", "contrastRatio": 8.04, "wcagLevel": "AAA" }
      }
    },
    "on-accent": {
      "$type": "color",
      "$value": "{color.ink}",
      "$description": "Texto sobre el acento",
      "$extensions": {
        "kiwi.a11y": { "contrastAgainst": "{color.accent}", "contrastRatio": 8.90, "wcagLevel": "AAA" }
      }
    }
  }
}
```

Valores medidos (truncados a dos decimales):

| Primer plano | Fondo | Ratio | Texto normal | Texto grande | No-texto |
|---|---|---|---|---|---|
| `#F5F5F0` paper | `#050505` ink | 18.63:1 | AAA | AAA | Cumple |
| `#A3A39E` paper-muted | `#050505` ink | 8.04:1 | AAA | AAA | Cumple |
| `#050505` ink | `#C4A77D` accent | 8.90:1 | AAA | AAA | Cumple |
| `#F5F5F0` paper | `#C4A77D` accent | 2.09:1 | Falla | Falla | Falla |
| `#A3A39E` paper-muted | `#F5F5F0` paper | 2.31:1 | Falla | Falla | Falla |

`wcagLevel` registra el nivel más alto alcanzado para texto normal: AA desde 4.5:1, AAA desde 7:1. Si un par solo cumple como texto grande o como no-texto, se registra con esa restricción en `$description` y no se usa en texto normal.

Reglas:

1. **Toda variante derivada se vuelve a medir.** Desplazar la luminosidad ±8 en OKLCH, cambiar el tema o ajustar la saturación produce un color nuevo con un ratio nuevo. El ratio del token padre no se hereda.
2. **Todo override de proyecto se vuelve a medir.** Si el sistema del proyecto sustituye un primitivo, cada par que lo usa se recalcula y el resultado se registra en la direction card.
3. **Superficies translúcidas y overlays se miden compuestos.** Un token `rgba()` o una capa con `backdrop-filter` no tiene ratio propio: se calcula el color compuesto contra el contenido más desfavorable que pueda quedar detrás y se registra ese valor. Si el fondo de detrás es variable (imagen, vídeo, scroll), se añade un velo opaco medido o el par no se aprueba.
4. **Los estados son pares propios.** Hover, foco, activo, error y seleccionado declaran su par con ratio; un estado sin par declarado no se construye.
5. **El indicador de foco es un token con dos ratios.** `--focus-ring` declara su ratio contra el fondo de página y contra el relleno de cada componente donde aparece, por tema.

## Procedimiento de verificación antes de entregar

Se ejecuta en este orden, sobre el artefacto renderizado. Cada paso deja evidencia (captura, medida o registro) de la ronda actual; la evidencia de una ronda anterior no cuenta.

1. **Renderizar en un navegador real** en los tres modos de adaptación: compact (360–390 CSS px), medium (≈ 768 CSS px) y expanded (≥ 1280 CSS px). Comprobar a 320 CSS px que no hay scroll horizontal (1.4.10).
2. **Primera pasada automática.** Ejecutar los hooks del bundle (`validate-contrast`, `validate-focus`) y axe DevTools sobre cada modo. Registrar los hallazgos; no se cierra ninguno sin comprobarlo a mano.
3. **Contraste de cada par efectivo.** Listar todos los pares texto/fondo y no-texto/fondo de la vista en todos sus estados y temas. Medir compuestos en capas translúcidas y el peor punto en gradientes e imágenes. Truncar y comparar con 4.5:1, 3:1 o 3:1 no-texto.
4. **Pasada solo con teclado.** Completar la tarea principal del brief con Tab, Shift+Tab, Enter, Space, flechas y Esc. Verificar orden de foco igual al orden de lectura, indicador visible con ≥ 3:1, ningún foco oculto del todo bajo elementos fijos (2.4.11), ninguna trampa y retorno del foco al cerrar overlays.
5. **Movimiento reducido activado.** Emular `prefers-reduced-motion: reduce`, recargar y recorrer los estados: sin desplazamientos ni escalas, estados conservados. Con la preferencia desactivada, cronometrar animaciones automáticas (> 5 s exige pausa) y descartar destellos de más de 3 por segundo.
6. **Touch targets en compact.** Medir cada control: 44×44 CSS px (regla del bundle). En medium y expanded, 24×24 o una excepción de 2.5.8 documentada.
7. **Semántica.** Revisar el árbol de accesibilidad: landmarks, un `h1`, niveles sin saltos, nombre, rol y estado de cada control, etiquetas de campos, `alt` y `lang`.
8. **Lector de pantalla.** Recorrer por encabezados, landmarks y controles con VoiceOver, NVDA o TalkBack si hay uno disponible. Si no, declarar el paso como «no verificado» con la razón.
9. **Texto ampliado y espaciado.** Zoom al 200 % y aplicar los valores de 1.4.12; comprobar que no se recorta ni se solapa texto.
10. **Registro.** Cada fallo en formato observación → consecuencia → cambio → re-verificación; después de cada cambio, repetir los pasos afectados. La entrega lista los 6 criterios con su veredicto y los pasos no verificados.

Ejemplo de registro:

> **Observación:** el anillo de foco `#FF6B35` sobre el fondo claro `#F5F5F0` mide 2.59:1.
> **Consecuencia:** en el tema claro, un usuario de teclado con baja visión no localiza el control activo.
> **Cambio:** `--focus-ring` pasa a `#050505` en el tema claro.
> **Re-verificación:** 18.63:1 contra `#F5F5F0`; recorrido con teclado repetido en compact y expanded, sin ocultación bajo la cabecera.

## Herramientas recomendadas

| Herramienta | Uso | Límite |
|---|---|---|
| axe DevTools (extensión de navegador) | Análisis de la página renderizada: contraste de texto sólido, nombres, roles, etiquetas, landmarks, `lang` | No resuelve contraste sobre imágenes, gradientes ni capas mezcladas; marca esos casos como «necesita revisión» |
| Lighthouse (Chrome DevTools) | Auditoría de accesibilidad rápida por vista y modo de dispositivo | Puntuación ponderada; un 100 no significa ausencia de fallos |
| WebAIM Contrast Checker | Medida puntual de un par hex, con veredicto AA y AAA para texto normal, texto grande y componentes | Mide colores declarados; el compuesto lo calculas tú antes |
| Panel Accessibility y emulación de Rendering en las herramientas del navegador | Árbol de accesibilidad, `prefers-reduced-motion`, deficiencias de visión simuladas | Simulación, no sustituye a usuarios ni a lectores reales |
| Hooks del bundle `validate-contrast` y `validate-focus` | Primera pasada automática sobre tokens y CSS: pares por debajo del umbral, `outline: none` sin sustituto | Analizan el código, no el artefacto renderizado; no ven compuestos, superposiciones ni orden de foco real |

Las herramientas automáticas detectan solo una parte de los problemas de accesibilidad: no juzgan si un `alt` es útil, si el orden de foco tiene sentido, si un foco queda oculto tras una superposición ni si la tarea se completa con teclado. Un informe automático limpio es el punto de partida de la revisión manual, nunca su conclusión. La compuerta solo se da por superada cuando los 6 criterios tienen veredicto con evidencia de la ronda actual y lo no verificado está etiquetado.
