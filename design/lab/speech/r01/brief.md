# Brief — Speech Capture / Speech-to-Text privado y persistente (r01)

> Brief del usuario, tal como lo entregó (listas compactadas en línea; el contenido es el suyo).

Un componente genérico de **captura de voz y transcripción** para Grana. Debe pensarse para escenarios con información sensible o confidencial: la arquitectura prioriza procesamiento **local o self-hosted** y evita depender de servicios externos.

## Concepto

No un simple botón de micrófono, sino un sistema reutilizable capaz de: activar el micrófono; iniciar una sesión de grabación; **mantenerla activa aunque el usuario cambie de tab o sección**; mostrar **siempre** un indicador visible de que se graba; visualizar actividad de audio; transcribir voz a texto; permitir revisar y corregir; diferenciar hablantes cuando sea posible; asociar después el transcript a uno o varios campos. Debe sentirse como un **recorder inteligente persistente**.

## Principio principal

Separar: **Launcher → Recording Session → Persistent Indicator → Transcript**. La grabación no depende del campo ni del tab desde donde se inició; la sesión vive a nivel global dentro del flujo actual.

## Caso de uso principal

Flujos largos donde el usuario navega entre secciones mientras continúa la conversación: inicia la grabación en una sección; cambia entre tabs o pasos; la grabación sigue; el indicador persistente permanece; al finalizar hay un transcript completo para revisar y usar. El usuario nunca debe perder de vista que el micrófono sigue activo.

## Privacidad (requisito prioritario)

Procesamiento local, on-device, localhost, servidor interno o infraestructura self-hosted; sin dependencia obligatoria de proveedores externos. Independiente del motor, preparado para Whisper, whisper.cpp, faster-whisper y sistemas locales de diarización. La UI no se acopla a ningún proveedor.

## Modos

- **Dictation:** capturas simples y cortas (observaciones, notas, comentarios, textarea, input largo); destino definido; normalmente un hablante; el texto puede insertarse directo en el campo.
- **Conversation:** sesiones largas; varios hablantes; la sesión continúa entre vistas; transcript completo; diarización posible; no ligada a un único campo; se revisa antes de distribuirse.

## Launcher

Desde junto a un textarea o input, toolbar, formulario, dialog, acción global o panel. Inactivo: discreto (icon button, botón compacto o acción contextual).

## Recording Pill

Al iniciar, el control puede transformarse en una superficie compacta: grabación activa, duración, actividad del micrófono, estado, expandir, detener. Vive en header, toolbar, esquina flotante o región persistente del layout; visible toda la sesión.

## Indicador persistente

Si el usuario cambia de tab, sección, paso o panel, la grabación continúa y el indicador permanece. El componente que inició puede desmontarse visualmente; la sesión no depende de él. El estado global de grabación vive fuera del contenido temporal de cada tab.

## Panel expandido

Al seleccionar la pill: popover, floating panel, dialog, side panel o bottom sheet en móvil, con estado, duración, waveform, transcript parcial y confirmado, hablantes, controles, pausa, reanudar, finalizar, errores y estado de procesamiento.

## Waveform

Actividad **real** del micrófono (waveform, barras, pulsación o nivel); comunica silencio, voz detectada, actividad, procesamiento. No solo decorativa.

## Estados

idle; requesting permission; ready; listening; speech detected; transcribing; paused; processing; reconnecting; microphone denied; microphone unavailable; error; completed. Cada uno reconocible por **texto e icono**, no solo color.

## Transcripción

Provisional (puede cambiar, menor peso visual) vs confirmado (estable, parte del historial); transición clara.

## Diarización y roles

Preparado para segmentos por hablante (Speaker A / B). No asume quién es cada uno; permite asignar roles luego (A → Profesional, B → Paciente) y corregirlos a mano. Configurable por número probable de participantes (1, 2, varios). Cambiar el hablante no altera el transcript original.

## Destino del texto

La grabación produce un **Transcript Session** independiente: insertar todo en un textarea, solo una selección, copiar fragmentos, asociar fragmentos a distintas secciones, conservar el completo, generar contenido derivado. La sesión no pertenece al primer campo.

## Transcript editable

Editar palabras, eliminar fragmentos, cambiar speaker, seleccionar, copiar, reutilizar segmentos. Nunca definitivo por defecto.

## Arquitectura de información

**Audio original → Transcript literal → Transcript corregido → Contenido derivado.** No sobrescribir silenciosamente el literal con transformaciones automáticas.

## Audio temporal

Si se guarda audio durante la sesión, estrategia clara de almacenamiento, cifrado, eliminación, errores y recuperación. Por defecto **no** se conserva tras finalizar.

## Procesamiento local

**Browser/App → Local Speech Service → Transcription Engine → Diarization Engine → Transcript Session.** El componente visual no conoce los detalles del motor.

## Estado de procesamiento

Diferenciar: audio capturado, procesándose, texto provisional, texto confirmado, procesamiento final pendiente. Nunca decir «Grabando correctamente» ante un fallo de captura o procesamiento.

## Finalización

Acción explícita: detener captura → procesar audio pendiente → cerrar provisional → transcript final → sesión completada → revisión. No cerrar la interfaz mientras haya segmentos pendientes.

## Pausa

Pausar y reanudar; en pausa debe quedar claro que el micrófono ya no captura.

## Errores

Permiso denegado; micrófono no disponible; dispositivo desconectado; servicio local no disponible; error de procesamiento; falta de espacio; sesión interrumpida. Indicar si la grabación continúa, se detuvo, hay audio pendiente o se puede recuperar.

## Persistencia

Sobrevive a cambios internos de UI (tabs, accordions, panels, navegación local). No necesariamente a un cierre completo de la app, salvo recuperación explícita del producto.

## Mobile

Experiencia nativa: pill persistente, bottom sheet, panel fullscreen para el transcript; safe areas, targets táctiles, una mano, permisos, interrupciones, orientación, background cuando el entorno lo permita.

## Desktop

Botón junto a campo, pill, recorder flotante, panel expandible, indicador en header. La versión completa no ocupa mucho espacio permanente.

## Integración

- **Con campos:** experiencia ligera (textarea + micrófono: inicia, muestra actividad, el texto entra al campo) sin limitar las sesiones largas.
- **Con Tabs:** la sesión vive fuera del tab; indicador visible; cambiar de tab no detiene; volver al tab inicial no crea sesión nueva; solo una acción explícita la detiene.
- **Con Dialogs:** la sesión no se pierde si el dialog cambia de contenido; se asocia al flujo principal; el panel puede expandirse fuera del dialog.

## Accesibilidad

Labels accesibles, foco visible, estados anunciables, teclado, texto visible para grabando/pausado/procesando, reduced motion. La waveform nunca es la única indicación.

## Estética

Minimalista, moderna, discreta, confiable, tecnológica, limpia, integrada. El estado activo con más énfasis, sin convertir la interfaz en alarma. Comunica **seguridad y control**.

## Piezas conceptuales

SpeechTrigger; RecordingPill; RecordingIndicator; RecorderPanel; Waveform; TranscriptViewer; SpeakerSegment; RecordingControls; RecordingStatus; TranscriptSession. No duplican lógica: todas dependen de **una misma sesión compartida**.

## Objetivo final

Dictado directo y conversaciones largas; prioridad a privacidad, procesamiento local, persistencia, claridad del estado, transcripción editable, diarización opcional, adaptabilidad, reutilización e independencia del motor. El usuario siempre sabe si el micrófono está activo, cuánto lleva, si realmente se captura audio, si la transcripción funciona, cómo pausar y detener, y dónde revisar el resultado.

---

## Nota de contexto del repo (no es del usuario; añadida al abrir la ronda)

- Regla de CLAUDE.md: **«Sin `fetch` ni globals de la app en componentes.»** Los componentes de Grana no hacen red. Por eso el motor (Whisper, etc.) debe entrar como un **adaptador que aporta la aplicación**, no como código de Grana: Grana define la interfaz del adaptador y la UI; la app conecta su servicio local. Precedente de servicio por aplicación con provide/inject: `createToaster` (GToast) y `createIcons`.
- Precedentes reutilizables: GToast (región persistente única, traslado al modal superior, regiones vivas), GTabs/GStepper (el flujo), GDialog (hoja móvil, slot), GHelper (popover), GProgress, GBadge, GMenu, GSurface, GCard, GFormSection, tokens de color semántico (`danger`, `warning`, `success`).
