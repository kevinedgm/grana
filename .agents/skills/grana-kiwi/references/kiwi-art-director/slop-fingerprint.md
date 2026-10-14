# AI Slop Fingerprint

Referencia de las Fases 3 y 5. Se carga cuando hay que juzgar si una interfaz es reconocible como genérica, antes del test de sustitución o durante la observación del artefacto renderizado.

## Definición de "AI Slop Fingerprint"

El AI Slop Fingerprint es el patrón visual reconocible que produce un modelo generativo cuando nadie le impone restricciones: Inter en todos los tamaños, gradiente indigo→purple sobre blanco, hero centrado con tres tarjetas iguales, `rounded-lg` en todo, sombras de baja opacidad y textos de relleno. No es un estilo elegido; es la ausencia de elección.

Su origen es estadístico. El modelo regresa a la media de sus datos de entrenamiento, y esa media está dominada por plantillas de la era Tailwind UI y shadcn/ui, kits de landing page y tutoriales que repiten los mismos valores por defecto. Cada valor por defecto es razonable por separado; juntos producen una interfaz que podría pertenecer a cualquier producto y que no sobrevive al test de sustitución.

La huella se considera presente cuando aparecen **3 o más señales simultáneamente**. Una señal aislada puede ser una decisión legítima del material (un radius uniforme en un concepto de piedra pulida, un fondo claro en una herramienta de lectura prolongada). Este umbral es el mismo que usa la auto-auditoría de `SKILL.md`: con 3 SÍ el diseño ya se lee como plantilla y se repara antes de entregar; con menos, cada señal se justifica en la entrega o se corrige.

## Catálogo de anti-patrones

Cada anti-patrón incluye descripción, ejemplo del patrón genérico, forma concreta de detectarlo y la dirección alternativa. Las alternativas remiten a la Directiva Cero Absoluto y a Math-Based Harmony de `SKILL.md`; si el proyecto declara su propio sistema, ese sistema prevalece y la excepción se registra en la direction card.

### Tipografía

#### 1. Inter como única fuente

**Descripción:** toda la interfaz usa Inter (o Roboto, Arial, Open Sans, Helvetica, `system-ui`) para display, texto y datos. No hay contraste de voz entre titular y cuerpo, y la tipografía no aporta ninguna información sobre el producto.

**Ejemplo:**

```css
body { font-family: 'Inter', sans-serif; }
h1, h2, h3, p, button, td { font-family: inherit; }
```

**Cómo detectarlo:** `grep -nE "font-family:[^;]*\b(Inter|Roboto|Arial|Open Sans|Helvetica)\b"` y `grep -nE "family=(Inter|Roboto|Open\+Sans)"` en los `<link>` de Google Fonts; en Tailwind, `fontFamily.sans` sin sobrescribir. Visualmente: titular y párrafo comparten forma de letra y solo cambian de tamaño.

**Alternativa:** pareja display + texto de la lista permitida (por ejemplo Fraunces + Geist, o Clash Display + Space Grotesk) más JetBrains Mono para datos; `system-ui` solo como último fallback.

#### 2. Pesos 400/500/600 solamente

**Descripción:** la jerarquía se construye con tres pesos contiguos que apenas se distinguen. El 500 y el 600 se confunden en pantalla, y no hay ni un peso ligero en display ni un peso pesado que ancle la página.

**Ejemplo:**

```css
p { font-weight: 400; }
.label, .nav a { font-weight: 500; }
h1, h2, h3, .btn { font-weight: 600; }
```

**Cómo detectarlo:** `grep -oE "font-weight:\s*[0-9]+" | sort | uniq -c` devuelve solo 400, 500 y 600; en Tailwind, solo `font-normal`, `font-medium` y `font-semibold`. Visualmente: al desenfocar la captura, ningún bloque domina.

**Alternativa:** contraste de peso con salto deliberado (display en 300 o 800 según el material, texto en 400) y, si la familia es variable, un eje `wght` o `opsz` ajustado por nivel de la escala.

#### 3. letter-spacing 0 en todos los tamaños

**Descripción:** el tracking no cambia entre 14px y 64px. En tamaños grandes las letras quedan sueltas; en mayúsculas pequeñas, apretadas. Es la marca de que nadie miró el texto renderizado a cada tamaño.

**Ejemplo:**

```css
h1 { font-size: 64px; letter-spacing: 0; }
.eyebrow { font-size: 12px; text-transform: uppercase; letter-spacing: 0; }
```

**Cómo detectarlo:** ausencia total de `letter-spacing` o `tracking-` en el CSS, o el mismo valor en todos los niveles; `grep -c "letter-spacing"` igual a cero con más de tres tamaños tipográficos declarados.

**Alternativa:** tracking negativo proporcional en display (entre -0.02em y -0.04em) y positivo en mayúsculas pequeñas (entre 0.06em y 0.12em), ajustado a ojo sobre el render de la familia elegida.

#### 4. line-height 1.5 uniforme

**Descripción:** el mismo interlineado para un titular de 56px y un párrafo de 16px. El titular queda flotando en un bloque demasiado alto y el ritmo vertical se rompe entre secciones.

**Ejemplo:**

```css
* { line-height: 1.5; }
h1 { font-size: 56px; }
```

**Cómo detectarlo:** `grep -nE "line-height:\s*1\.5"` aplicado a selectores universales o a encabezados; en Tailwind, `leading-normal` o `leading-6` en elementos `text-4xl` o mayores. Visualmente: titulares de varias líneas con huecos amplios entre líneas.

**Alternativa:** interlineado inverso al tamaño, como fija `SKILL.md`: display entre 0.95 y 1.1, texto entre 1.45 y 1.6.

#### 5. Tamaños 16/20/24/32 fijos

**Descripción:** la escala sale de los valores por defecto del framework, no de una proporción. Los saltos son irregulares (1.25, 1.2, 1.33) y el titular más grande rara vez supera 32px o 48px, con lo que la página no tiene un ancla tipográfica.

**Ejemplo:**

```css
p { font-size: 16px; }
h3 { font-size: 20px; }
h2 { font-size: 24px; }
h1 { font-size: 32px; }
```

**Cómo detectarlo:** `grep -oE "font-size:\s*[0-9]+px" | sort -u` devuelve exactamente un subconjunto de 12/14/16/18/20/24/30/32/36/48; en Tailwind, solo `text-base`, `text-xl`, `text-2xl`, `text-3xl`.

**Alternativa:** escala derivada del ratio: 16 → 26 → 42 → 68 con 1.618 (editorial) o 16 → 23 → 32 → 45 con 1.414 (densidad de datos), expresada en custom properties y con `clamp()` para la adaptación.

### Color

#### 6. Gradiente indigo→purple

**Descripción:** el gradiente lineal de dos stops de indigo-500 a purple-600 en botones, titulares con `background-clip: text` o fondos de hero. Es la señal de color más reconocible del patrón genérico.

**Ejemplo:**

```html
<section class="bg-white">
  <h1 class="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
    Build faster
  </h1>
  <a class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">Get started</a>
</section>
```

```css
.hero { background: linear-gradient(90deg, #6366F1, #8B5CF6); }
```

**Cómo detectarlo:** `grep -niE "#6366F1|#8B5CF6|#7C3AED|#4F46E5"` y `grep -nE "from-(indigo|violet|purple)-[0-9]{3}.*to-(purple|violet|pink)-[0-9]{3}"`. Visualmente: barrido azul violáceo de izquierda a derecha sobre fondo blanco.

**Alternativa:** gradientes de 3 o más stops definidos en OKLCH y derivados del material (por ejemplo, un radial que simula luz interior sobre near-black), nunca dos stops de la paleta por defecto.

#### 7. Púrpura puro #8B5CF6

**Descripción:** violet-500 como color de marca, de enlaces y de estados activos. No viene de ninguna intención del brief; es el acento que el modelo asocia con «producto tecnológico moderno».

**Ejemplo:**

```css
:root { --primary: #8B5CF6; }
a, .active, .badge { color: var(--primary); }
```

**Cómo detectarlo:** `grep -niE "#8B5CF6|#A855F7|#7C3AED|violet-500|purple-500"`. Nota de accesibilidad: #8B5CF6 sobre #FFFFFF mide 4.23:1, por debajo de 4.5:1 para texto normal; usado como color de enlace o de texto pequeño también falla AA.

**Alternativa:** acento derivado del material y del dominio (metálico, terroso, mineral) en OKLCH, con ratio calculado contra cada fondo donde aparece.

#### 8. Fondo blanco #FFFFFF

**Descripción:** blanco puro como lienzo de toda la interfaz, sin temperatura ni material. Hace que cualquier sombra gris y cualquier borde claro se vean iguales a los de otra plantilla.

**Ejemplo:**

```css
body { background: #FFFFFF; }
.card { background: #fff; }
```

**Cómo detectarlo:** `grep -niE "background(-color)?:\s*(#fff(fff)?|white|rgb\(255,\s*255,\s*255\))"`; en Tailwind, `bg-white` en `body`, `main` o en el contenedor raíz.

**Alternativa:** near-black (`#050505`–`#0A0A0A`) para temas oscuros o blanco roto con temperatura (por ejemplo `#F5F5F0`) para temas claros, siempre con contraste AA recalculado.

#### 9. Texto #333333 o #666666

**Descripción:** el gris carbón para texto principal y el gris medio para secundario son los dos valores más repetidos en plantillas. El problema no es el contraste: #333333 sobre #FFFFFF mide 12.63:1 y #666666 sobre #FFFFFF mide 5.74:1, ambos pasan AA para texto normal. El problema es que son grises neutros sin relación con la paleta, que no participan del material.

**Ejemplo:**

```css
body { color: #333333; }
.muted, .caption { color: #666666; }
```

**Cómo detectarlo:** `grep -niE "color:\s*#(333|333333|666|666666|555|555555)\b"`; en Tailwind, `text-gray-700` y `text-gray-500` como únicos tonos de texto. Ojo con la variante más clara: `#9CA3AF` (gray-400) sobre blanco mide 2.54:1 y sí falla AA.

**Alternativa:** neutros tintados derivados del matiz del material en OKLCH (por ejemplo, un gris cálido con croma bajo), desplazando L en pasos fijos y recalculando cada par texto/fondo.

#### 10. Acento único con saturación ~80% usado en todo

**Descripción:** un solo color muy saturado marca a la vez botón primario, enlace, foco, badge, gráfico, icono y borde activo. Al estar en todas partes deja de señalar nada, y la jerarquía de acciones desaparece.

**Ejemplo:**

```css
:root { --accent: hsl(239 84% 67%); }
.btn-primary, a, .badge, .icon, .chart-bar, :focus { color: var(--accent); border-color: var(--accent); }
```

**Cómo detectarlo:** contar usos del token de acento: `grep -c "var(--accent)"` o `grep -c "indigo-600"` frente al número de componentes; si el acento aparece en más de 4 roles distintos, hay saturación de señal. En HSL, saturación ≥ 80% en el único acento declarado.

**Alternativa:** un acento reservado para la acción principal y el foco, con roles secundarios resueltos por luminosidad, peso o material; como máximo 1 acento con saturación > 80%, según la directiva.

#### 11. Bordes gris #E5E7EB

**Descripción:** gray-200 como borde universal de tarjetas, tablas, inputs y separadores. Es el valor por defecto de Tailwind (`border` sin color) y aparece aunque el diseño no lo haya pedido.

**Ejemplo:**

```css
* { border-color: #E5E7EB; }
.card, .table, hr { border: 1px solid #E5E7EB; }
```

**Cómo detectarlo:** `grep -niE "#E5E7EB|#E2E8F0|border-gray-200|border-slate-200"`. Nota de accesibilidad: #E5E7EB sobre #FFFFFF mide 1.24:1. En separadores decorativos no hay requisito, pero si ese borde es lo único que delimita un control (un input, un checkbox), falla el 3:1 de contraste no textual (WCAG 1.4.11).

**Alternativa:** hairlines con intención del material (por ejemplo `rgba(255,255,255,0.08)` sobre near-black en divisores decorativos) y bordes de controles con ratio ≥ 3:1 calculado.

### Layout

#### 12. Hero centrado

**Descripción:** titular, subtítulo y dos botones alineados al centro, apilados en una columna estrecha con mucho aire arriba y abajo. Es simétrico, neutro y aplicable a cualquier producto.

**Ejemplo:**

```html
<section class="py-24 text-center">
  <h1 class="text-5xl font-semibold">The platform for modern teams</h1>
  <p class="mt-4 text-gray-500">Everything you need in one place.</p>
  <div class="mt-8 flex justify-center gap-4">
    <a class="btn">Get started</a><a class="btn-outline">Learn more</a>
  </div>
</section>
```

**Cómo detectarlo:** `grep -nE "text-center|text-align:\s*center"` en la primera `section` o en el contenedor del `h1`, junto a `justify-center` o `margin: 0 auto` en el grupo de botones. Visualmente: eje vertical de simetría que atraviesa todo el primer viewport.

**Alternativa:** Topological Betrayal: titular desplazado a un tercio, Split-screen con jerarquía desigual o Full-Bleed Editorial, conservando el orden del DOM y del foco.

#### 13. 3 cards iguales

**Descripción:** tres tarjetas de igual tamaño, con icono arriba, título y dos líneas de texto, en una fila. Comunica que las tres cosas pesan lo mismo, lo que casi nunca es cierto.

**Ejemplo:**

```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="card"><svg class="icon"></svg><h3>Fast</h3><p>Lightning quick performance.</p></div>
  <div class="card"><svg class="icon"></svg><h3>Secure</h3><p>Enterprise-grade security.</p></div>
  <div class="card"><svg class="icon"></svg><h3>Scalable</h3><p>Grows with your business.</p></div>
</div>
```

**Cómo detectarlo:** `grep -nE "grid-cols-3|repeat\(3,\s*1fr\)"` con tres hijos de la misma clase; títulos de una palabra genérica (Fast, Secure, Simple, Powerful). Visualmente: tres bloques gemelos bajo el hero.

**Alternativa:** Bento asimétrico donde el tamaño de cada celda refleja la importancia real del contenido, con una celda dominante en proporción 1.618 respecto a las demás.

#### 14. Grid 12 columnas simétrico

**Descripción:** toda la página se resuelve en divisiones exactas del grid de 12 (6+6, 4+4+4, 3+3+3+3). El grid es una herramienta, no una composición; usado así produce el aspecto Bootstrap.

**Ejemplo:**

```html
<div class="row">
  <div class="col-md-6"></div>
  <div class="col-md-6"></div>
</div>
```

```css
.layout { display: grid; grid-template-columns: repeat(12, 1fr); }
.half { grid-column: span 6; }
```

**Cómo detectarlo:** `grep -nE "col-(md|lg)-(6|4|3)\b|span (6|4|3)\b|grid-cols-(2|3|4)\b"` sin ninguna columna asimétrica; todos los bloques empiezan en la columna 1 o en el centro exacto.

**Alternativa:** pistas proporcionales (`grid-template-columns: 1.618fr 1fr` o `1fr 1.414fr`) y áreas con nombre que permiten sangrados y superposiciones intencionales.

#### 15. Navbar sticky edge-to-edge

**Descripción:** barra de navegación fija arriba, de borde a borde, fondo blanco o translúcido con `backdrop-blur`, logo a la izquierda, enlaces al centro y botón a la derecha. Ocupa altura permanente sin aportar nada distintivo.

**Ejemplo:**

```html
<header class="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur">
  <nav class="flex items-center justify-between px-6 h-16">
    <a class="logo">Brand</a><ul class="flex gap-6"></ul><a class="btn">Sign up</a>
  </nav>
</header>
```

**Cómo detectarlo:** `grep -nE "sticky top-0|position:\s*sticky"` en `header` junto a `w-full`, `border-b` y `justify-between`. Visualmente: franja continua de 64px pegada al borde superior sin margen lateral.

**Alternativa:** navegación con whitespace propio (desplazada del borde, compacta o integrada en la composición), con landmark `nav`, enlace de salto al contenido y orden de foco intacto.

#### 16. Sidebar 240px fijo

**Descripción:** barra lateral de 240px o 256px con lista vertical de iconos y etiquetas, item activo con fondo tenue y botón de colapsar. Es la estructura por defecto de cualquier dashboard generado.

**Ejemplo:**

```css
.sidebar { position: fixed; width: 240px; height: 100vh; border-right: 1px solid #E5E7EB; }
.main { margin-left: 240px; }
```

**Cómo detectarlo:** `grep -nE "width:\s*(240|256)px|w-60|w-64"` en un elemento `aside` o `.sidebar` con `position: fixed`. Visualmente: columna gris clara con iconos alineados y el resto del ancho para el contenido.

**Alternativa:** navegación derivada de la tarea (por ejemplo, rail estrecho con etiquetas visibles, índice contextual o paneles en Z-Axis Cascade), validada en compact sin scroll horizontal.

#### 17. Footer 4 columnas

**Descripción:** cuatro columnas de enlaces (Product, Company, Resources, Legal) sobre un fondo gris, con copyright y tres iconos de redes debajo. Se genera aunque el producto no tenga páginas que enlazar.

**Ejemplo:**

```html
<footer class="grid grid-cols-4 gap-8 bg-gray-50 p-12">
  <div><h4>Product</h4><ul></ul></div>
  <div><h4>Company</h4><ul></ul></div>
  <div><h4>Resources</h4><ul></ul></div>
  <div><h4>Legal</h4><ul></ul></div>
</footer>
```

**Cómo detectarlo:** `grep -nE "<footer[^>]*grid-cols-4"` o cuatro `h4` dentro de `footer`; encabezados genéricos sin enlaces reales detrás (`href="#"`).

**Alternativa:** footer con solo los destinos que existen, compuesto con la misma lógica asimétrica de la página o reducido a una línea si el producto no lo necesita.

#### 18. Container max-width 1200px

**Descripción:** todo el contenido vive en una columna centrada de 1200px (o 1280px), con los mismos márgenes laterales en cada sección. Ninguna sección sangra, ninguna se estrecha para lectura.

**Ejemplo:**

```css
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
```

**Cómo detectarlo:** `grep -nE "max-width:\s*(1200|1280)px|max-w-(6xl|7xl)|container mx-auto"` repetido en todas las secciones. Visualmente: bordes izquierdo y derecho del contenido alineados en toda la página.

**Alternativa:** anchos por función: medida de lectura en `ch` para texto (entre 60ch y 75ch), secciones full-bleed para imagen y pistas con nombre que permiten salir del contenedor.

#### 19. Padding 24px uniforme

**Descripción:** el mismo padding de 24px (o 16px) en tarjetas, secciones, modales y botones grandes. Sin variación de densidad, nada se agrupa ni se separa con intención.

**Ejemplo:**

```css
.card, .section, .modal, .panel { padding: 24px; }
.stack > * + * { margin-top: 24px; }
```

**Cómo detectarlo:** `grep -oE "(padding|margin|gap):\s*[0-9]+px" | sort | uniq -c` dominado por 16px y 24px; en Tailwind, `p-6`, `gap-6` y `space-y-6` en la mayoría de componentes.

**Alternativa:** secuencia 8, 13, 21, 34, 55, 89 como custom properties, con espacio interno menor que el externo para que la proximidad agrupe.

### Componentes

#### 20. Button radius 8px

**Descripción:** botones con `border-radius: 8px` (`rounded-lg`), padding 8×16 y fondo de acento. Es el botón de cualquier kit, sin relación con el material.

**Ejemplo:**

```css
.btn { border-radius: 8px; padding: 8px 16px; background: #6366F1; color: #fff; }
```

**Cómo detectarlo:** `grep -nE "border-radius:\s*(6|8)px|rounded-(md|lg)"` en selectores de botón. Nota: blanco sobre #6366F1 mide 4.47:1, por debajo de 4.5:1 para texto normal; solo pasa como texto grande (≥ 24px, o ≥ 18.66px en negrita).

**Alternativa:** radius derivado del material (2px en Tantalio, 0 en concepto editorial, píldora en un material orgánico) y área táctil mínima de 44×44 px.

#### 21. Card radius 12px

**Descripción:** tarjetas con `rounded-xl`, fondo blanco, borde gris y sombra suave. Combinado con el botón de 8px produce el radius casi uniforme que la auto-auditoría marca como señal.

**Ejemplo:**

```css
.card {
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
}
```

**Cómo detectarlo:** `grep -nE "border-radius:\s*(12|16)px|rounded-(xl|2xl)"` y `grep -nE "rgba\(0,\s*0,\s*0,\s*0?\.(05|06|1)\)|shadow-(sm|md)"`. Contar valores distintos de radius: si hay uno o dos para toda la interfaz, hay uniformidad.

**Alternativa:** superficie definida por el material (blur y hairline en Obsidiana, textura lineal en Tantalio) y radius como decisión con jerarquía, no como constante.

#### 22. Input border 1px gris

**Descripción:** inputs con borde gris claro de 1px, placeholder gris y anillo de foco azul. Además del aspecto genérico, el borde gris claro suele no alcanzar el contraste que un control necesita.

**Ejemplo:**

```css
input { border: 1px solid #D1D5DB; border-radius: 6px; padding: 8px 12px; }
input:focus { outline: none; box-shadow: 0 0 0 3px rgba(99,102,241,0.5); }
```

**Cómo detectarlo:** `grep -nE "border:\s*1px solid #(D1D5DB|E5E7EB|CBD5E1)|border-gray-(200|300)"` en `input`, `select` o `textarea`. Nota de accesibilidad: #D1D5DB sobre #FFFFFF mide 1.47:1; si ese borde es lo único que identifica el campo, falla el 3:1 de WCAG 1.4.11. `outline: none` sin sustituto equivalente también rompe el foco visible.

**Alternativa:** campo resuelto con el material (por ejemplo, línea inferior con ratio ≥ 3:1 sobre near-black, como #6B6B6B sobre #0A0A0A a 3.72:1), `label` visible y `:focus-visible` con contraste ≥ 3:1.

#### 23. Badge con fondo azul

**Descripción:** etiquetas de estado como píldoras de fondo azul pálido y texto azul medio, idénticas para «Nuevo», «Activo» o «Beta». El color no significa nada concreto.

**Ejemplo:**

```html
<span class="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-500">Active</span>
```

**Cómo detectarlo:** `grep -nE "bg-blue-(50|100).*text-blue-(500|600|700)|rounded-full.*text-xs"`. Nota de accesibilidad: #3B82F6 (blue-500) sobre #DBEAFE (blue-100) mide 3.01:1, falla AA para texto de 12px; #1D4ED8 sobre el mismo fondo mide 5.49:1 y pasa.

**Alternativa:** badge con vocabulario propio del dominio y codificación redundante (texto, forma o icono además del color), con ratio ≥ 4.5:1 calculado.

#### 24. Avatar circular con iniciales

**Descripción:** círculo de color con dos iniciales en blanco en lugar de una foto. La directiva lo prohíbe como placeholder porque oculta el caso real (personas con foto, sin foto, con nombres largos) y repite el mismo motivo en todos los productos.

**Ejemplo:**

```html
<div class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white">JD</div>
```

**Cómo detectarlo:** `grep -nE "rounded-full[^>]*>[A-Z]{2}<"` o elementos de 32 a 48px con `border-radius: 50%` y dos mayúsculas como contenido. Visualmente: columna de círculos de colores con iniciales en una lista de usuarios.

**Alternativa:** foto real o generada con `alt` adecuado; si el registro no tiene imagen, un fallback diseñado desde el material y probado como caso extremo, no como estado por defecto.

#### 25. Modal centrado con overlay negro 50%

**Descripción:** diálogo blanco centrado sobre un velo `rgba(0,0,0,0.5)`, con título, texto y dos botones a la derecha. Lo genérico es la forma visual, no el comportamiento: el núcleo accesible del modal es correcto y debe conservarse.

**Ejemplo:**

```css
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); }
.modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #fff; border-radius: 12px; }
```

**Cómo detectarlo:** `grep -nE "rgba\(0,\s*0,\s*0,\s*0?\.5\)|bg-black/50|bg-opacity-50"` junto a `translate(-50%, -50%)`. Visualmente: caja blanca flotando en el centro exacto de un velo gris.

**Alternativa:** reinterpretar la superficie y la entrada desde el material (panel lateral, hoja desde el borde o capa de cristal) sin quitar nada del comportamiento: `<dialog>` o `role="dialog"` con `aria-modal`, trampa de foco, cierre con Escape, retorno del foco al disparador y contenido de fondo inerte.

### Motion

#### 26. transition: all 0.3s ease

**Descripción:** una transición genérica sobre todas las propiedades, con la misma duración y la curva por defecto. Anima cosas que no deberían moverse (layout, color de borde al cargar) y ninguna con intención.

**Ejemplo:**

```css
* { transition: all 0.3s ease; }
.btn { transition: all 300ms ease-in-out; }
```

**Cómo detectarlo:** `grep -nE "transition:\s*all|transition-all|ease-in-out|\bease\b\s*;|linear\s*;"`. Visualmente: todo responde con el mismo retardo blando, incluidos cambios de tamaño que hacen saltar el contenido.

**Alternativa:** transiciones por propiedad (`opacity`, `transform`, `border-color`) con `cubic-bezier(0.16, 1, 0.3, 1)` para salidas y `cubic-bezier(0.34, 1.56, 0.64, 1)` para spring, con duraciones de la Motion Trinity.

#### 27. Hover scale 1.02

**Descripción:** tarjetas y botones que crecen un 2% al pasar el ratón, a menudo con sombra más grande. No comunica qué va a pasar, solo que algo es clicable, y escala también el texto, que se emborrona durante la transición.

**Ejemplo:**

```css
.card:hover { transform: scale(1.02); box-shadow: 0 10px 15px rgba(0,0,0,0.1); }
```

```html
<div class="transition hover:scale-105 hover:shadow-lg"></div>
```

**Cómo detectarlo:** `grep -nE "hover:scale-(102|105)|:hover[^{]*\{[^}]*scale\(1\.0[2-5]\)"`. Comprobar además si existe `@media (prefers-reduced-motion: reduce)`: si no existe, el escalado se aplica también a quien pidió reducir movimiento.

**Alternativa:** cambio de luz del material en hover (borde o brillo interior) y el mismo tratamiento en `:focus-visible`; bajo `prefers-reduced-motion: reduce`, sin escala ni desplazamiento, solo cambio de color u opacidad.

#### 28. Fade-in 300ms

**Descripción:** todos los bloques aparecen con el mismo fundido de opacidad al entrar en viewport, sin orden ni dirección. No orienta la lectura y retrasa el acceso al contenido.

**Ejemplo:**

```css
.fade-in { animation: fadeIn 300ms ease-in-out both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
```

**Cómo detectarlo:** `grep -nE "@keyframes (fadeIn|fade-in)|animate-fade|data-aos=\"fade"`; la misma clase aplicada a todas las secciones sin `animation-delay` escalonado.

**Alternativa:** Entrance con desplazamiento de 13px más opacidad, 320ms con curva out y escalonado de 55ms en el orden de lectura aprobado; aparición inmediata con `prefers-reduced-motion: reduce`.

### Contenido

#### 29. Lorem ipsum

**Descripción:** texto latino de relleno en titulares, párrafos o tarjetas. Oculta los problemas reales de longitud, tono y jerarquía, y hace imposible el test de sustitución porque no hay producto que sustituir.

**Ejemplo:**

```html
<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</p>
```

**Cómo detectarlo:** `grep -niE "lorem|ipsum|dolor sit amet|consectetur adipiscing"`.

**Alternativa:** contenido temático del brief con datos de ejemplo realistas, incluidos los extremos: texto tres veces más largo, valor en cero y registro vacío.

#### 30. "Your text here"

**Descripción:** instrucciones de plantilla dejadas como contenido: «Your text here», «Heading goes here», «Feature title», «Add description». Señal directa de que el diseño no partió de un brief.

**Ejemplo:**

```html
<h2>Your headline here</h2>
<p>Add a short description of your feature.</p>
<button>Button</button>
```

**Cómo detectarlo:** `grep -niE "your (text|title|headline|heading) here|goes here|add (a )?(short )?description|feature (title|name)|>Button<|>Title<"`.

**Alternativa:** copy específico de la tarea del usuario, con verbos de acción concretos en botones y encabezados que nombran el contenido real.

#### 31. Imagen gris de placeholder

**Descripción:** rectángulos grises, servicios de imágenes de relleno o SVG con una montaña y un sol. Esconden la decisión de imaginería (tipo, recorte, proporción, tratamiento) que la direction card exige.

**Ejemplo:**

```html
<img src="https://via.placeholder.com/600x400" alt="placeholder">
<div class="aspect-video bg-gray-200"></div>
```

**Cómo detectarlo:** `grep -niE "placeholder\.com|placehold\.co|picsum\.photos|dummyimage|alt=\"(placeholder|image)\"|bg-gray-(200|300)[^\"]*aspect-"`. Visualmente: bloques grises lisos donde debería haber imagen.

**Alternativa:** imágenes reales o generadas con tratamiento definido en la direction card, `alt` informativo o `alt=""` si es decorativa, y fallback diseñado si la imagen no carga.

#### 32. "John Doe" como nombre

**Descripción:** nombres de relleno (John Doe, Jane Smith, Acme Inc., user@example.com) en tablas, testimonios y perfiles. Todos tienen la misma longitud corta, así que la interfaz nunca se prueba con nombres reales.

**Ejemplo:**

```html
<td>John Doe</td><td>john@example.com</td>
<blockquote>"This product changed our workflow." <cite>Jane Smith, CEO at Acme Inc.</cite></blockquote>
```

**Cómo detectarlo:** `grep -nE "John Doe|Jane (Doe|Smith)|Acme( Inc| Corp)?|example\.com"`.

**Alternativa:** datos de ejemplo verosímiles para el dominio y la región del brief, con un nombre tres veces más largo de lo normal, caracteres no ASCII y un registro sin imagen.

## Lo que SÍ es diseño premium

Diez contraejemplos concretos. Ninguno es una receta: cada uno funciona porque deriva de un material, una jerarquía o una tarea, y deja de funcionar si se copia sin esa razón.

**1. Escala tipográfica con ratio y pareja con contraste de voz.**

```css
:root {
  --step-0: 1rem;
  --step-1: 1.618rem;
  --step-2: 2.618rem;
  --step-3: 4.236rem;
  --font-display: 'Fraunces', Georgia, serif;
  --font-text: 'Geist', system-ui, sans-serif;
  --font-data: 'JetBrains Mono', ui-monospace, monospace;
}
h1 { font: 300 var(--step-3)/1 var(--font-display); letter-spacing: -0.03em; }
p  { font: 400 var(--step-0)/1.55 var(--font-text); }
```

Por qué funciona: la jerarquía se lee aunque se desenfoque la captura, porque cada nivel cambia de tamaño en una proporción fija y de voz entre display y texto. El cuerpo se mantiene en 16px, legible.

**2. Fondo near-black con texto tintado y ratios calculados.**

```css
:root {
  --bg: #0A0A0A;
  --text: #E8E6DF;    /* 15.85:1 sobre --bg */
  --text-muted: #9A968C; /* 6.71:1 sobre --bg */
  --accent: #C4A77D;  /* 8.65:1 sobre --bg */
}
```

Por qué funciona: el fondo tiene profundidad y los neutros comparten temperatura con el acento metálico, así que todo pertenece al mismo material. Cada par supera 4.5:1 con margen, también el texto secundario.

**3. Tema claro en blanco roto.**

```css
:root[data-theme="light"] {
  --bg: #F5F5F0;
  --text: #1A1A1A;       /* 15.91:1 */
  --text-muted: #5C5A55; /* 6.30:1 */
}
```

Por qué funciona: el blanco roto aporta temperatura sin perder legibilidad. El secundario se eligió calculando: un gris como #7A766D sobre #F5F5F0 mide 4.14:1 y se habría descartado.

**4. Bento asimétrico con proporción dorada.**

```css
.bento {
  display: grid;
  grid-template-columns: 1.618fr 1fr;
  grid-template-areas: "main side-a" "main side-b";
  gap: var(--space-21);
}
```

Por qué funciona: la celda dominante dice qué importa más, y el orden del DOM sigue siendo main, side-a, side-b, igual que el orden de lectura y de foco. En compact se apila en ese mismo orden.

**5. Topological Betrayal sin romper la estructura.**

```css
.hero h1 { grid-column: 2 / span 7; transform: translateX(calc(var(--space-55) * -1)); }
@media (max-width: 40rem) {
  .hero h1 { grid-column: 1 / -1; transform: translateX(calc(var(--space-13) * -1)); }
}
```

Por qué funciona: el desplazamiento es visual (`transform`), no estructural, y en compact se atenúa a 13px para evitar scroll horizontal. El titular no tapa ningún control.

**6. Superficie de material en lugar de tarjeta con sombra.**

```css
.surface {
  background: oklch(0.16 0.01 80 / 0.72);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 2px;
}
```

Por qué funciona: la superficie se define por luz y borde del material, no por una sombra gris de baja opacidad. El contraste del texto se mide contra el color resultante más desfavorable detrás del blur, no contra el valor declarado.

**7. Motion con propósito y alternativa reducida.**

```css
.item { transition: opacity 320ms cubic-bezier(0.16, 1, 0.3, 1), transform 320ms cubic-bezier(0.16, 1, 0.3, 1); }
.btn:active { transform: scale(0.97); transition: transform 120ms cubic-bezier(0.34, 1.56, 0.64, 1); }
@media (prefers-reduced-motion: reduce) {
  .item, .btn:active { transition: none; transform: none; }
}
```

Por qué funciona: cada animación cumple un rol de la Motion Trinity (orientar, anticipar, confirmar) y se limita a las propiedades que necesita. Quien pidió reducir movimiento recibe el cambio de estado sin desplazamiento.

**8. Foco visible tratado como parte del material.**

```css
.btn:hover, .btn:focus-visible { border-color: var(--accent); box-shadow: inset 0 0 21px oklch(0.75 0.08 75 / 0.25); }
.btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
```

Por qué funciona: el foco no es un anillo azul por defecto sino la misma luz del material, con contraste ≥ 3:1 contra el fondo adyacente. Teclado y ratón reciben el mismo nivel de respuesta.

**9. Badge con codificación redundante y vocabulario del dominio.**

```html
<span class="status" data-state="pendiente">
  <svg aria-hidden="true" class="status__mark"></svg>
  Pendiente de revisión
</span>
```

Por qué funciona: el estado se comunica con texto, forma y color a la vez, así que no depende de percibir el matiz. La etiqueta nombra la situación real del usuario y no podría trasladarse a otro producto, por lo que supera el test de sustitución.

**10. Datos de ejemplo con extremos.**

```html
<tr><td>María Fernanda Villaseñor de la Concepción Altamirano</td><td>0</td><td>Sin imagen</td></tr>
<tr><td>Lü Wen</td><td>1 284 930</td><td><img src="registro-07.webp" alt="Etiqueta del lote 07 con fecha de envasado"></td></tr>
```

Por qué funciona: la tabla se prueba con un nombre muy largo, uno muy corto con caracteres no ASCII, un cero, una cifra grande y un registro sin imagen. Los defectos de truncado, alineación numérica y fallback aparecen en el diseño y no en producción.

## Checklist de detección rápida

Las mismas 6 preguntas de la auto-auditoría de `SKILL.md`. Responder SÍ o NO sobre el artefacto renderizado, no sobre la intención:

1. ¿Hay hero centrado con 3 feature cards iguales? (anti-patrones 12 y 13)
2. ¿Hay gradiente indigo→purple sobre blanco? (anti-patrones 6 y 8)
3. ¿Radius uniforme (mismo valor) en todo? (anti-patrones 20 y 21)
4. ¿Sombras de baja opacidad sin propósito? (anti-patrón 21)
5. ¿Fuentes genéricas (Inter, Roboto, Arial)? (anti-patrón 1)
6. ¿Placeholders (Lorem ipsum, «Your text here»)? (anti-patrones 29 a 32)

Con 3 o más SÍ la huella está presente y se repara antes de entregar; con menos, cada SÍ se justifica en la entrega o se corrige. La accesibilidad bloquea de forma independiente y sin umbral: un solo fallo de contraste, foco visible, touch target, teclado, `prefers-reduced-motion` o semántica detiene la entrega aunque la auditoría estética dé cero SÍ.

## Señales para detección automática

Patrones que el script de hook del bundle puede buscar en HTML, CSS y clases utilitarias. Son indicios, no veredictos: una coincidencia aislada se revisa en contexto y la huella se declara solo con 3 o más señales distintas.

| Señal | Regex (extendida, sin distinción de mayúsculas) | Pregunta |
|---|---|---|
| Fuente genérica | `font-family:[^;]*\b(Inter\|Roboto\|Arial\|Open Sans\|Helvetica)\b` | 5 |
| Fuente genérica en Google Fonts | `family=(Inter\|Roboto\|Open\+Sans)` | 5 |
| Hex indigo/purple | `#(6366F1\|4F46E5\|8B5CF6\|7C3AED\|A855F7)\b` | 2 |
| Gradiente Tailwind indigo→purple | `from-(indigo\|violet)-[0-9]{3}[^"]*to-(purple\|violet\|pink)-[0-9]{3}` | 2 |
| Fondo blanco puro | `background(-color)?:\s*(#fff(fff)?\|white)\b\|\bbg-white\b` | 2 |
| Sombra de baja opacidad | `rgba\(0,\s*0,\s*0,\s*0?\.(05\|06\|1)\)\|\bshadow-(sm\|md)\b` | 4 |
| Radius por defecto | `border-radius:\s*(8\|12)px\|\brounded-(lg\|xl)\b` | 3 |
| Hero centrado + 3 columnas | `text-center` y `grid-cols-3\|repeat\(3,\s*1fr\)` en el mismo archivo | 1 |
| Lorem ipsum | `lorem\|ipsum\|dolor sit amet` | 6 |
| Texto de plantilla | `your (text\|title\|headline) here\|goes here` | 6 |
| Imagen de relleno | `placeholder\.com\|placehold\.co\|picsum\.photos` | 6 |
| Nombre de relleno | `John Doe\|Jane (Doe\|Smith)\|Acme Inc` | 6 |

En la tabla, `\|` representa la alternancia `|` de la regex escapada para Markdown; en el script se usa `|` sin barra invertida. Para la pregunta 3, el hook cuenta valores distintos de `border-radius` además de buscar los por defecto: un único valor en toda la interfaz es señal aunque no sea 8px ni 12px.
