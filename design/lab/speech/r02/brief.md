# Brief — Captura de voz · r02 · Fase 2 (revisión y destino)

> Esta ronda no tiene brief nuevo del usuario: la fuente sigue siendo `../r01/brief.md`. Aquí se recoge **qué partes de ese brief cubre la Fase 2** y el encargo de la ronda.

## Del brief del usuario (`r01/brief.md`)

- **Transcripción:** provisional (puede cambiar, menor peso) frente a confirmado (estable); transición clara.
- **Diarización y roles:** segmentos por hablante (A / B) sin asumir quién es cada uno; asignar roles después (A → Profesional, B → Paciente) y corregirlos a mano; número probable de participantes (1, 2, varios); **cambiar el hablante no altera el transcript original**.
- **Destino del texto:** la sesión produce un transcript independiente: insertar todo en un campo, solo una selección, copiar fragmentos, asociar fragmentos a distintas secciones, conservar el completo, generar contenido derivado. **La sesión no pertenece al primer campo.**
- **Transcript editable:** editar palabras, eliminar fragmentos, cambiar hablante, seleccionar, copiar, reutilizar segmentos. **Nunca definitivo por defecto.**
- **Arquitectura de información:** audio original → transcript literal → transcript corregido → contenido derivado. **No sobrescribir silenciosamente el literal.**
- **Modos:** el dictado sigue siendo directo al campo; la conversación «se revisa antes de distribuirse».

## Lo que ya fija la Fase 1 (`design/contracts/speech.md`, DECISIONS #207 a #240)

- Forma estable del transcript (§1.4): `segments[]` con `literal`, `engineSpeaker`, `corrected`, `speaker`, `removed`, `failed`; `speakers[]`; `partial` único; `derived[]` (#211: solo datos).
- Reservado para la F2 (§18): `GTranscript` público (también para un transcript guardado), corregido, borrado lógico, reasignar sin tocar `engineSpeaker`, roles por hablante (lista de la app, sin valores por defecto), selección, copiar, destinos registrados `{ id, label, insert(text) → { undo() } }` que funcionan aunque el campo esté en otra pestaña, capa `derived`, evento `speakers.relabel`, slots del panel; iconos `text-cursor-input`, `undo-2`, `trash`, `pencil`, `copy`.

## Encargo de la ronda

1. **Capas:** corrección por segmento sin perder el literal, diferencias visibles, «volver al original», borrado lógico, deshacer/rehacer de la revisión, y provisionales que llegan mientras se edita sin pisar la edición.
2. **`GTranscript`:** estructura, estados por segmento, edición, selección (rango, varios), copia (texto y con hablantes), teclado completo, lector de pantalla, rendimiento con cientos de segmentos (virtualizar o no), dónde vive y si funciona sin sesión.
3. **Hablantes y roles:** participantes previstos, etiquetas neutras frente a roles, reasignar, unir/separar, sin asumir identidad, marcas sin depender del color, motor sin diarización.
4. **Destinos:** todo, selección o segmentos en uno o varios campos; registro ligado a `v-model`; cursor, selección o final; deshacer; marca de uso; derivado como datos.
5. **Integración** con el sistema de formularios y con la F1.

Criterio: WAI-ARIA APG (rejilla, menú, edición accesible), WCAG 2.2 (3.3.4/3.3.6 reversibilidad, 2.5.7 alternativas a arrastrar, 2.4.11 foco no tapado, 4.1.3 mensajes de estado sin ruido). Solo lo de producto va como pregunta.
