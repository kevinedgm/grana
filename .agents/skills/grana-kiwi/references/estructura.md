# Estructura de la ronda (brief, base, conceptos)

Adaptación de `kiwi-art-director/structural-process.md` a un componente de librería. El origen piensa en pantallas y *viewport*; un componente de Grana vive dentro de la página de otra persona, así que se piensa en **tareas** y **ancho del contenedor**.

## 1. Brief (`brief.md`)

Si no cabe en una página, el componente está mal delimitado.

| Campo | Buena forma | Mala forma |
| --- | --- | --- |
| Persona y situación | «Quien registra una cita mientras atiende el teléfono» | «Usuarios» |
| Tarea (verbo) | elegir, quitar, comparar, confirmar, deshacer | gestionar, manejar |
| Pregunta de diseño | «¿Se distingue en 2 s qué opción está elegida?» | «¿Se ve bien?» |
| Dato dominante | Lo que se mira primero y decide la acción | Todas las props posibles |
| Resultado verificable | «El valor cambia y el foco sigue en el control» | «El usuario queda satisfecho» |
| Intención emocional | «Calma: quitar no mueve nada bajo la mano» | «Moderno y limpio» |
| Componentes que se solapan | Cuáles existen y por qué no bastan | (omitido) |
| Criterios de aceptación | Observables y medibles en el prototipo | Opiniones |

Separa explícitamente **hechos** (con su fuente: archivo, decisión, contrato, estándar), **supuestos** declarados para avanzar e **incógnitas**. Solo las incógnitas que cambian la estructura van al usuario, entre 2 y 6, en un mensaje, sin preguntas estéticas; la intención emocional es la única no funcional permitida.

### Riesgo por acción

| Tipo | Ejemplo | Respuesta |
| --- | --- | --- |
| Reversible | Filtrar, alternar | Sin confirmación; respuesta inmediata |
| Con deshacer | Quitar una etiqueta, archivar | «Deshacer» en el sitio donde se actuó |
| Destructiva | Eliminar | `alertdialog` que nombra la consecuencia con el verbo del resultado |

## 2. Fidelidad

La menor que responda la pregunta: flujo si la duda son los pasos; base funcional en gris si la duda es anatomía y teclado; conceptos con tokens reales si la duda es identidad (siempre en un componente con forma visible).

## 3. Base funcional y conceptos

1. **Base funcional** (gris, kit neutro): semántica, nombre accesible, teclado APG, foco, anuncios, envío en formularios, estados. Ningún concepto la cambia; si un concepto necesita cambiarla, se declara como decisión aparte.
2. **Tres conceptos A/B/C** (`direccion-creativa.md` §2 y §3), con tokens reales del tema por defecto, cada uno con su ficha de dirección. Difieren en estructura, jerarquía, densidad o interacción.
3. **Comparativa** con recomendación razonada y una sola pregunta de elección. Si el usuario rechaza los tres, nueva ronda con tres nuevos que respondan a sus objeciones; no se fuerza el menos malo.

## 4. Adaptación por contenedor

Un componente no conoce el *viewport*: se adapta a su contenedor y al tipo de puntero. Describe al menos:

| Aspecto | Estrecho (≈ 280 px) | Medio (≈ 480 px) | Ancho (≥ 720 px) |
| --- | --- | --- | --- |
| Qué se conserva | | | |
| Qué cede o cambia de forma | | | |
| Qué pasa a bajo demanda | | | |
| Puntero grueso (44 px) | | | |
| RTL y texto 30 % más largo | | | |

Al estrecharse, conserva en este orden: 1) estado que pide atención, 2) acción principal, 3) dato para ejecutarla, 4) contexto. No escondas un dato operativo porque no cabe: cambia su representación (como la cesión por prioridad de `GSummary`). Ninguna medida sin origen: dila de dónde sale (rango de contenido, 24/44 px, un token).

## 5. Procedencia de decisiones

Cada decisión numerada de `declaracion.md` dice su fuente: estándar (WCAG, APG), contrato o decisión vigente, contexto del producto o **inferencia**. Nunca atribuyas una inferencia a un estándar. Las derivadas por completo de un estándar o contrato se aprueban solas (`AGENTS.md`).

## 6. Aislamiento de rondas

Cada ronda (`rNN`) parte de su brief. Las rondas anteriores y otros componentes son historia: no alimentan los conceptos salvo que el usuario nombre el artefacto y pida reutilizarlo, refinarlo o compararlo. La declaración dice qué entradas usó y qué continuidad se autorizó. Las piezas compartidas ya aprobadas (motores en `utils/`, componentes existentes, tokens) **sí** se reutilizan: eso es composición, no continuidad de diseño.

## 7. Copy funcional

- Nombra las cosas como las entiende el usuario. Un botón dice qué pasa.
- Error: qué pasó + qué significa + siguiente acción.
- Vacío: qué aparecerá y la primera acción.
- Etiqueta visible; el placeholder no es etiqueta. Unidad pegada al número.
- Los textos visibles del componente son `labels` traducibles, no literales.
