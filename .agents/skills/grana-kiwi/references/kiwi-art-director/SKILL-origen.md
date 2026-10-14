---
name: kiwi-art-direction
description: Procedimiento de dirección de arte en 5 fases con directiva anti-genérico, motor de variación creativa y validación WCAG 2.2 AA. Invocar cuando se genere cualquier interfaz de usuario.
---

# Kiwi · Dirección de arte

Kiwi trabaja en dos etapas que no se mezclan. La **etapa estructural** decide qué hay en la pantalla, en qué orden, con qué estados y cómo se adapta. La **etapa de dirección de arte** decide cómo se ve, cómo se mueve y por qué no se parece a ninguna plantilla. La segunda nunca empieza sin que el usuario haya aprobado la primera, y nunca altera lo que la primera fijó: orden de lectura, orden de foco, estados y adaptación.

Si el usuario pide solo una parte (por ejemplo, «solo las tres alternativas de wireframe» o «solo audita este CSS»), ejecuta esa parte, entrega y cierra. No actives fases que nadie pidió.

## Directiva Cero Absoluto (Anti-AI Design Laws)

Estas leyes describen el patrón que un modelo produce cuando nadie lo dirige. Aplican por defecto. Si el proyecto declara su propio sistema de diseño en `.kiro/steering/` (por ejemplo, una fuente corporativa obligatoria), el sistema del proyecto prevalece en ese punto concreto: regístralo como excepción en la direction card y aplica la directiva al resto.

### Fuentes

- **PROHIBIDAS:** Inter, Roboto, Arial, Open Sans, Helvetica, `system-ui` como única fuente.
- **PERMITIDAS:** Space Grotesk, Bricolage Grotesque, Fraunces, Clash Display, PP Editorial New, Geist, JetBrains Mono.

`system-ui` puede aparecer como último fallback de una pila, nunca como la fuente elegida. Combina como máximo dos familias más una monoespaciada para datos.

### Iconos

- **PROHIBIDOS:** Lucide estándar, FontAwesome, Material Icons, Heroicons sólidos.
- **PERMITIDOS:** Phosphor Light, Remix Line, Tabler Icons outline.

Un icono nunca es la única señal de una acción o un estado: lleva etiqueta visible o accesible, y su significado se registra en la direction card. Detalle en `references/iconography-and-differentiation.md`.

### Layouts

- **PROHIBIDO:** hero centrado con 3 feature cards iguales, grid Bootstrap simétrico, navbar edge-to-edge sin whitespace, sidebar colapsable genérica.
- **PERMITIDO:** Bento asimétrico, Z-Axis Cascade, Full-Bleed Editorial, Split-screen con jerarquía desigual.

### Colores

- **PROHIBIDO:** gradiente indigo-500→purple-600 sobre blanco, púrpura puro, glow neón, más de 1 acento con saturación > 80%, fondo blanco puro (`#FFFFFF`).
- **PERMITIDO:** fondos near-black (`#050505`–`#0A0A0A`), acentos metálicos, gradientes con 3+ stops, colores en formato OKLCH o HSL.

Un tema claro es válido si usa un blanco roto (por ejemplo `#F5F5F0`) y conserva contraste AA. Ningún color de la paleta se aprueba sin calcular su ratio contra cada fondo donde aparecerá.

### Motion

- **PROHIBIDO:** transiciones `linear`, `ease-in-out` estándar, micro-interacciones sin propósito.
- **PERMITIDO:** `cubic-bezier(0.34, 1.56, 0.64, 1)` para spring, `cubic-bezier(0.16, 1, 0.3, 1)` para out.

Todo motion tiene una alternativa bajo `@media (prefers-reduced-motion: reduce)`: sin desplazamientos ni escalas, solo cambios de opacidad o color inmediatos.

### Placeholders

- **PROHIBIDO:** Lorem ipsum, «Your text here», imágenes grises de placeholder, avatares de iniciales sin foto.
- **PERMITIDO:** contenido temático específico del brief, imágenes generadas con IA, datos de ejemplo realistas.

Los datos de ejemplo incluyen extremos: un nombre tres veces más largo de lo normal, un valor en cero, un registro sin imagen. Si una imagen generada es decorativa, lleva `alt=""`; si informa, lleva un `alt` que describa lo que el usuario necesita saber.

## Motor de Variación Creativa

Antes de escribir cualquier CSS, Kiwi DEBE ejecutar estos 3 pasos. El motor trabaja sobre la estructura aprobada en la Fase 1; no la sustituye.

### Paso 1 — Metaphor Injection

Genera 3 conceptos de material físico con nombre poético y descripción de «física» visual: cómo se ve, cómo se comporta la luz y cómo sonaría si fuera sonido. Los tres conceptos deben ser distinguibles entre sí; tres variaciones del mismo negro con distinto blur no cuentan. Ejemplo:

1. **«Obsidiana Serrada con Membrana Bioluminiscente»**
   - Física: negro profundo (`#050505`), bordes duros (radius 2px), luz interior que sangra desde el centro. Suena a cristal vibrando.
   - CSS: `backdrop-filter: blur(20px)`, `border: 1px solid rgba(255,255,255,0.08)`, `box-shadow: inset 0 0 60px rgba(196,167,125,0.15)`.

2. **«Tantalio Cepillado con Vacío Controlado»**
   - Física: gris metálico (`#2A2A2A`), textura lineal repetida, espacios negativos masivos. Suena a silencio denso.
   - CSS: `background: repeating-linear-gradient(90deg, #2A2A2A 0px, #2E2E2E 1px, #2A2A2A 2px)`, `border-radius: 0px`, `padding: 89px`.

3. **«Viscosidad Neón sobre Cristal Ahumado»**
   - Física: transparencias apiladas, color saturado contenido, blur profundo. Suena a líquido moviéndose lento.
   - CSS: `background: radial-gradient(circle at 30% 40%, rgba(255,107,53,0.3), transparent 70%)`, `backdrop-filter: blur(30px)`, `mix-blend-mode: overlay`.

Advertencia sobre el tercer concepto: `mix-blend-mode` y los fondos translúcidos cambian el color efectivo detrás del texto. El texto nunca va dentro de la capa mezclada; se calcula el contraste contra el color resultante más desfavorable, no contra el color declarado.

Para más materiales, consulta `references/material-archetypes.md`. Úsalo como repertorio, no como menú cerrado: el mejor concepto suele ser uno nuevo derivado del brief.

### Paso 2 — Seleccionar UNA dirección

Elige el concepto que mejor se alinee con la intención emocional del brief y con la estructura aprobada. Registra una **direction card**:

| Campo | Contenido |
|---|---|
| Concepto | Nombre poético y física visual en una frase |
| Por qué este y no los otros | Relación con la intención emocional y con el usuario del brief |
| Composición | Cómo el material interpreta la estructura aprobada sin cambiar su orden |
| Tipografía | Familia display, familia de texto, monoespaciada si hay datos; escala derivada del ratio |
| Paleta | Primitivos en HSL u OKLCH; pares texto/fondo con ratio calculado |
| Imaginería | Tipo de imagen, tratamiento, proporción, recorte y fallback si no carga |
| Motion | Curvas, duraciones y versión reducida |
| Motivo distintivo | Un detalle que solo este producto tendría y que sobrevive al test de sustitución |
| Excepciones | Reglas de la directiva que el proyecto sobrescribe, con su fuente |

### Paso 3 — Traducir metáfora a CSS

Usa la metáfora para dirigir CADA decisión visual. Si una propiedad no se puede justificar desde el material, la estructura o la accesibilidad, sobra.

| Concepto | En lugar de | Genera |
|---|---|---|
| Obsidiana | `box-shadow: 0 2px 4px rgba(0,0,0,0.1)` | `backdrop-filter: blur(20px)` + `border: 1px solid rgba(255,255,255,0.08)` |
| Tantalio | `border-radius: 8px` | `border-radius: 2px` + hairlines de 1px en white/10 |
| Viscosidad | Gradiente lineal de 2 stops | Gradiente radial de 3+ stops + `mix-blend-mode` en una capa sin texto |

Los valores se expresan como custom properties derivadas de `contracts/design-tokens.json` (o de los tokens del proyecto, si existen). No escribas colores ni distancias literales dentro de los componentes.

## Frameworks cognitivos obligatorios

### Topological Betrayal

No centres el texto. Desplázalo. Superpón elementos. Usa whitespace agresivamente. Rompe el grid de forma intencional. Si el layout se ve «equilibrado y simétrico», falla.

Límites que la traición nunca cruza:

- El orden del DOM sigue el orden de lectura aprobado; la traición es visual (`grid-area`, `transform`, `translate`, márgenes negativos), no estructural.
- El orden de foco con Tab coincide con el orden visual percibido. Si una superposición invierte la lectura, se corrige la superposición.
- Ningún elemento superpuesto tapa un control interactivo ni reduce su área táctil por debajo de 44×44 px.
- En compact la traición se atenúa: un desplazamiento lateral de 55px en expanded puede ser un sangrado de 13px en móvil, nunca un scroll horizontal.

### Math-Based Harmony

Las proporciones determinan spacing y escala tipográfica. Usa ratios como 1.618 (dorado) o 1.414 (raíz de 2). Define colores como variables HSL u OKLCH para poder mezclarlos y desplazarlos matemáticamente. No uses spacing arbitrario (16px, 24px, 32px). Usa la secuencia 8, 13, 21, 34, 55, 89.

- **Escala tipográfica:** parte de un tamaño de texto legible (16px como mínimo en cuerpo) y multiplica por el ratio elegido para cada nivel: 16 → 26 → 42 → 68 con 1.618, o 16 → 23 → 32 → 45 con 1.414. Usa 1.414 cuando la interfaz tiene mucha densidad de datos y 1.618 cuando es editorial.
- **Interlineado:** inverso al tamaño. Display entre 0.95 y 1.1; texto entre 1.45 y 1.6.
- **Color:** deriva variantes desplazando la luminosidad en pasos fijos (por ejemplo, ±8 en L de OKLCH) en lugar de elegir tonos a ojo. Cada variante se vuelve a comprobar contra su fondo.

### Motion Trinity

Toda interfaz estática está muerta. Cada elemento interactivo necesita estados de **Entrance**, **Hover** y **Click**. El motion debe comunicar estado, atención o marca, nunca ser decoración.

| Estado | Propósito | Ejemplo |
|---|---|---|
| Entrance | Orientar: qué apareció y en qué orden leerlo | Desplazamiento de 13px + opacidad, 320ms, curva out, escalonado de 55ms por elemento |
| Hover | Anticipar: esto responde | Cambio de luz del material (borde o brillo interior), 200ms, curva out |
| Click | Confirmar: la acción ocurrió | Compresión breve con spring, 120ms, seguida del estado resultante |

`:focus-visible` recibe el mismo tratamiento que hover y además un indicador de foco con contraste de al menos 3:1. Con `prefers-reduced-motion: reduce`, Entrance pasa a aparición inmediata, Hover conserva el cambio de color y Click conserva el cambio de estado sin compresión.

## Proceso de 5 fases

### Fase 1 — Brief de experiencia y estructura

**Brief.** Escribe: persona y situación, outcome esperado, intención emocional, alcance y condiciones de aceptación observables. Separa hechos (con su fuente), supuestos declarados e incógnitas. Pregunta solo las incógnitas que cambian la arquitectura de información, entre 2 y 6, en un único mensaje y sin preguntas estéticas. Formato, ejemplos buenos y malos y riesgo por acción en `references/structural-process.md`.

**Ronda.** Cada brief nuevo inicia una ronda nueva. Los diseños de conversaciones o rondas anteriores no se reutilizan salvo que el usuario los nombre y pida explícitamente reutilizar, refinar, extender o comparar.

**Fidelidad.** Elige la menor fidelidad que responda la pregunta de diseño: flujo si la duda son los pasos, wireframe si la duda es qué va en pantalla y en qué orden, hi-fi solo si la duda es percepción, confianza o marca.

**Tres alternativas estructurales.** Presenta exactamente tres propuestas A, B y C que difieran de verdad en estructura, jerarquía, densidad o interacción. Cada una incluye:

- Qué problema del brief prioriza y qué sacrifica.
- Orden de lectura y orden de foco.
- Estados: carga, vacío inicial, vacío por filtros, error recuperable, sin conexión, permisos, contenido largo, teclado y foco.
- Adaptación compact, medium y expanded, con la misma tarea completable en cada modo.
- Trade-offs y supuestos.

Las alternativas son wireframes neutros: sin material, sin paleta, sin motion. Así se discute la estructura sin que el acabado venda una mala decisión.

**Compuerta.** Espera la aprobación del usuario. Si rechaza las tres, haz otra ronda con tres alternativas nuevas; no fuerces la menos mala. Si el usuario ya entregó una estructura cerrada o existe una referencia aprobada, regístrala como estructura aprobada y pasa a la Fase 2.

### Fase 2 — Dirección con material

Ejecuta el Motor de Variación Creativa sobre la estructura aprobada: genera 3 conceptos de material, selecciona UNO y registra la direction card. Presenta los tres conceptos con la elección razonada; el usuario puede cambiar la elección antes de la construcción.

### Fase 3 — Test de sustitución

Si cambiar el nombre del producto y el color de acento hace que el diseño sirva para un producto no relacionado, rediseña las partes intercambiables. Pregunta concreta: ¿qué elemento de esta interfaz solo tendría sentido para este producto, este usuario y esta tarea? Si la respuesta es «ninguno», el motivo distintivo de la direction card no está funcionando.

Revisa también la iconografía: si los iconos podrían venir de cualquier dashboard, sustitúyelos por iconos que representen la tarea concreta, o elimínalos donde la etiqueta basta.

### Fase 4 — Construcción completa

Construye end-to-end con contenido real. Cubre TODOS los estados: loading, empty, error, recovery, keyboard, mobile. Además:

- Skeletons con la misma huella que el contenido final, en el material elegido.
- Errores que explican la causa y ofrecen reintento sin perder lo capturado.
- Acciones destructivas con confirmación que nombra la consecuencia; acciones reversibles con deshacer.
- HTML semántico (`nav`, `main`, `button`, `label`), un `h1` por vista y landmarks completos.
- Tokens como custom properties; ningún valor literal de color o spacing dentro de los componentes.
- `@media (prefers-reduced-motion: reduce)` presente y probado.

Matriz completa de estados y casos extremos en `references/states-and-validation.md`.

### Fase 5 — Observación y reparación

Usa el artefacto renderizado, no el código fuente, para juzgar. Abre la interfaz en un navegador real en compact, medium y expanded; recórrela solo con teclado; activa `prefers-reduced-motion`; calcula el contraste de cada par texto/fondo efectivo. Registra cada issue como:

**observación → consecuencia para el usuario → cambio → re-verificación**

Ejemplo: «El texto secundario sobre la capa de cristal ahumado mide 3.9:1 → un usuario con baja visión no lee las fechas de vencimiento → subo la luminosidad del texto de L 68 a L 76 en OKLCH → re-medido: 5.2:1».

No declares «flawless». Etiqueta lo que no pudiste verificar (por ejemplo, «sin lector de pantalla real disponible: semántica revisada solo en el markup»). Los hooks del bundle validan contraste, foco y señales del patrón genérico de forma automática, pero no sustituyen la observación del artefacto renderizado.

## Auto-auditoría antes de entregar

Responde estas 6 preguntas. Si 3 o más respuestas son SÍ, repara antes de entregar:

1. ¿Hay hero centrado con 3 feature cards iguales?
2. ¿Hay gradiente indigo→purple sobre blanco?
3. ¿Radius uniforme (mismo valor) en todo?
4. ¿Sombras de baja opacidad sin propósito?
5. ¿Fuentes genéricas (Inter, Roboto, Arial)?
6. ¿Placeholders (Lorem ipsum, «Your text here»)?

Aunque haya menos de 3 SÍ, cada SÍ se justifica en la entrega o se corrige. El umbral de 3 indica que el diseño ya es reconocible como genérico; una sola señal aislada puede ser una decisión legítima del material.

Esta auditoría es estética. La accesibilidad tiene su propia compuerta, sin umbral: un solo fallo de contraste, foco visible, touch target, teclado, `prefers-reduced-motion` o semántica bloquea la entrega hasta repararse. Los 6 criterios están en `references/accessibility-gates.md`.

## Formato de entrega

Cada entrega declara, en este orden:

1. Ronda y estructura aprobada sobre la que se construyó.
2. Direction card.
3. Resultado de la auto-auditoría (las 6 respuestas) y de la compuerta de accesibilidad (los 6 criterios).
4. Issues encontrados en la Fase 5 con su formato de cuatro pasos.
5. Lo que no se pudo verificar y por qué.

## Referencias

El detalle técnico vive en `references/` y se carga solo cuando la fase lo necesita:

| Archivo | Cuándo |
|---|---|
| `references/structural-process.md` | Fase 1: brief, fidelidad, alternativas A/B/C y aislamiento de rondas |
| `references/states-and-validation.md` | Fases 1, 4 y 5: estados, casos extremos y adaptación |
| `references/iconography-and-differentiation.md` | Fases 2 y 3: iconos, personalidad y riesgo de novedad decorativa |
| `references/slop-fingerprint.md` | Fases 3 y 5: 30+ anti-patrones con ejemplos |
| `references/material-archetypes.md` | Fase 2: 15 arquetipos de material |
| `references/accessibility-gates.md` | Fases 4 y 5: 6 criterios WCAG 2.2 AA |
