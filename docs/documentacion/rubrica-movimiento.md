# Rúbrica: evaluación de un componente como pieza de experiencia (movimiento, transiciones, comodidad, control)

> Rúbrica del usuario (2026-10-19). Complementa `auditoria-visual.md` (regla obligatoria) en lo que toca a movimiento, transiciones, profundidad, control y accesibilidad. Se aplica en la auditoría posterior de coco y al contratar (lima) todo componente con movimiento o cambio de forma. Texto del usuario sin cambios, salvo el título.

Usa este brief como rúbrica. Evalúa solo lo que puedas inferir del componente o de la descripción aportada. Si falta información, marca **No verificable** y no inventes. Distingue entre evidencia observada, inferencia razonable y supuesto.

---

## 1. Contexto mínimo que conviene aportar

Para evaluar bien el componente, la IA debería saber:

- Qué componente es: botón, tarjeta, ventana, transición, animación, menú, objeto 3D, entorno inmersivo, etc.
- Plataforma y dispositivo: web, móvil, escritorio, consola, RV/RA, etc.
- Tipo de interacción: toque, ratón, teclado, gesto, mirada, mando, voz.
- Frecuencia de uso: ocasional, frecuente, repetitiva.
- Duración: interacción momentánea, lectura prolongada, experiencia inmersiva.
- Si hay movimiento, profundidad, 3D, cámara, oscilaciones o cambios de inmersión.
- Público objetivo y necesidades de accesibilidad.
- Si existe opción de reducir movimiento, ajustar contraste, tamaño o profundidad.

Si no se aporta esto, la IA debe declarar limitaciones.

---

## 2. Dimensiones de evaluación

### A. Propósito y utilidad del movimiento
- ¿El movimiento comunica algo útil o es decorativo?
- ¿Ayuda a entender cambios de estado, jerarquía, causa-efecto o continuidad?
- ¿Es breve, preciso y realista?
- ¿Evita animaciones gratuitas, excesivas o repetitivas en interacciones frecuentes?
- ¿El movimiento se puede cancelar o no bloquea al usuario?
- ¿Se ofrece una alternativa sin movimiento para quien no puede o no quiere usarlo?

**Riesgo si falla:** distracción, lentitud percibida, fatiga, desconexión.

### B. Comodidad visual y profundidad
- ¿Las señales de profundidad son coherentes? Tamaño, color, desenfoque, oclusión, sombras, textura, movimiento.
- ¿Hay señales contradictorias que puedan causar doble visión o fatiga?
- ¿El contenido cercano se reserva para interacción breve o directa?
- ¿El texto es legible sin girar cabeza o cuerpo?
- ¿Se evitan patrones repetitivos que confundan la convergencia visual?
- ¿Los cambios de brillo permiten adaptación visual?
- ¿El esfuerzo ocular se minimiza y hay pausas naturales?

**Riesgo si falla:** fatiga visual, doble visión, baja legibilidad, incomodidad.

### C. Comodidad de movimiento y estabilidad
- ¿El movimiento visual coincide con lo que el usuario espera sentir?
- ¿Se evita que objetos grandes en movimiento hagan creer que el usuario o el entorno se mueven?
- ¿Se evita contenido anclado a la cabeza o a la mirada de forma incómoda?
- ¿Las cámaras o desplazamientos tienen horizonte estable y foco de movimiento predecible?
- ¿Se evitan giros rápidos, rotaciones puras y objetos pasando muy cerca?
- ¿Se evitan oscilaciones sostenidas, sobre todo lentas y repetitivas?
- ¿Hay una referencia estacionaria que ayude a tolerar el movimiento?

**Riesgo si falla:** mareo, desorientación, inestabilidad, malestar físico.

### D. Transiciones y continuidad
- ¿La transición mantiene continuidad visual entre origen y destino?
- ¿Es fluida, comprensible y predecible?
- ¿Se puede interrumpir, cancelar o revertir?
- ¿El código o diseño soporta que una transición empiece en cualquier momento?
- ¿Se evita bloquear acciones porque “hay una transición en curso”?
- ¿El estado temporal se mantiene al mínimo y se limpia al terminar?
- ¿La transición ayuda a entender el cambio sin retrasar al usuario?

**Riesgo si falla:** desorientación, pérdida de contexto, fragilidad ante interrupciones.

### E. Control y expectativas del usuario
- ¿El usuario decide cuándo entrar, salir o cambiar de nivel de inmersión o movimiento?
- ¿Los controles de salida indican claramente qué ocurrirá?
- ¿Se evita forzar cambios bruscos de contexto?
- ¿La interacción respeta expectativas físicas y gestuales?
- ¿Se puede interactuar sin moverse físicamente, si aplica?

**Riesgo si falla:** sensación de pérdida de control, claustrofobia, confusión.

### F. Accesibilidad y opcionalidad
- ¿El movimiento no es la única forma de comunicar información?
- ¿Existe opción de reducir o desactivar movimiento?
- ¿Se complementa con audio, háptica, texto o cambios de estado?
- ¿Se respetan tamaños, contrastes y distancias cómodas?
- ¿Se ofrecen alternativas para personas con discapacidad visual, motriz o vestibular?

**Riesgo si falla:** exclusión, incomodidad, incumplimiento de accesibilidad.

### G. Rendimiento y sostenibilidad
- ¿La animación mantiene fluidez sin sacrificar batería o rendimiento?
- ¿Hay opciones de calidad/rendimiento?
- ¿El movimiento es proporcionado al dispositivo y al contexto?

**Riesgo si falla:** tirones, consumo excesivo, experiencia pobre.

### H. Inmersión y contenido espacial, si aplica
- ¿El nivel de inmersión está justificado por la tarea?
- ¿Se puede convivir con otras tareas o se aísla al usuario sin necesidad?
- ¿Se mantiene conexión con el entorno cuando conviene?
- ¿Las transiciones entre niveles de inmersión son suaves y controlables?
- ¿Se evita movimiento en visión periférica?
- ¿Los objetos grandes usan translucidez, bajo contraste o tamaño controlado?
- ¿Hay suelo, referencia espacial y entorno expansivo?
- ¿Se evita rotar el mundo virtual de forma incómoda?

**Riesgo si falla:** desorientación, pérdida de contexto, incomodidad, ruptura de inmersión.

---

## 3. Escala de evaluación

Para cada criterio, usar:

- **Cumple:** hay evidencia clara y suficiente.
- **Parcial:** cumple en parte o con riesgos menores.
- **No cumple:** hay un problema claro.
- **N/A:** no aplica al componente.
- **No verificable:** falta información.

Añadir siempre:

- **Evidencia:** qué se observa o se deduce.
- **Riesgo:** Alto / Medio / Bajo.
- **Recomendación:** concreta y accionable.

---

## 4. Checklist rápido

| Área | Pregunta clave | Estado |
|---|---|---|
| Propósito | ¿El movimiento o transición tiene una función clara? | |
| Comodidad visual | ¿Evita fatiga, doble visión y esfuerzo ocular innecesario? | |
| Profundidad | ¿Las señales de profundidad son coherentes? | |
| Legibilidad | ¿Se lee y se entiende sin esfuerzo? | |
| Movimiento | ¿Evita mareo, oscilaciones y movimiento periférico incómodo? | |
| Transiciones | ¿Son fluidas, interrumpibles y predecibles? | |
| Control | ¿El usuario decide y puede salir o cancelar? | |
| Accesibilidad | ¿Hay alternativas y opción de reducir movimiento? | |
| Rendimiento | ¿Mantiene fluidez y no derrocha recursos? | |
| Inmersión | Si aplica, ¿el nivel de inmersión está justificado y es controlable? | |

---

## 5. Formato de salida que debe producir la IA

Para cada dimensión:

> **Dimensión — Estado — Evidencia — Riesgo — Recomendación**

Al final:

1. **Resumen ejecutivo:** 3–5 líneas.
2. **Riesgos principales:** máximo 5, ordenados por severidad.
3. **Prioridades de mejora:** qué corregir primero y por qué.
4. **Limitaciones de la evaluación:** qué no se pudo verificar.

---

## 6. Regla final para la IA

Evalúa el componente como **pieza general de experiencia de usuario**, no como implementación de una plataforma concreta. Si el componente no tiene movimiento, profundidad o inmersión, marca esas dimensiones como **N/A** y céntrate en claridad, comodidad, control, accesibilidad y rendimiento.

---

## Primera aplicación: isla de estado, D1 · Cápsula de relevo (2026-10-19)

Evaluada por el agente principal sobre `design/lab/alert/r04/` (kiwi) y `design/lab/alert/auditoria-movimiento.md` (coco). Resumen: A, C y E cumplen; B, D, F y G parciales; H no aplica. Riesgos en orden: (1) interrupciones de transición sin especificar, (2) asomo de la acción sin gesto táctil, (3) delimitación sobre fondos oscuros y zona de marca (hoy 1,06:1; D1 16,48:1 en prototipo), (4) coste de animar tamaño en vez de `transform`, (5) eco en la marca sin marca visible. Para lima: (1) y (2) antes de construir; para coco: (3) en la exploración visual; para bruno: (4) y (5) en la construcción.
