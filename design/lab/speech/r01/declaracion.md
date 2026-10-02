# Declaración de cumplimiento · Captura de voz (Speech-to-Text) · r01

**Estado:** en revisión. Fuente de verdad: `brief.md` de esta ronda (del usuario, con la «Nota de contexto del repo»).
**Ruta:** R2 (sistema: una sesión compartida y varias piezas) · **Fidelidad:** F2 · **Material:** kit neutral de grises, iconos solo Lucide (`design/lab/lucide-icons.js` + importados de `lucide-static`, §12.4).
**Siguiente dueño:** lima → contrato del sistema (`design/contracts/speech.md`), filas de `icons.md` §4 y la nota de servicios en `api.md`.
**Prototipo:** `index.html` (sesión, anfitrión, disparadores, pill, panel y un **adaptador simulado** implementados en JavaScript simple con la API propuesta; el nivel puede venir del micrófono real). **Verificación:** `node design/lab/speech/r01/verificar.mjs` (levanta su servidor; 115 comprobaciones, §13).
**Convención:** «propuesta kiwi» = recomendación que se asume si el usuario no dice lo contrario. Colores, radios, sombras y duraciones del prototipo son de wireframe, **no** propuestas. Los nombres (`createSpeech`, `GSpeechHost`…) son propuestas; los fija lima.

## 1. Arquitectura y sesión compartida

| # | Pregunta | Decisión | Fundamento |
| --- | --- | --- | --- |
| 1.1 | ¿Componente o servicio? | **Servicio por aplicación** con el patrón de `createToaster` (#140, `api.md` «Servicios imperativos»): `createSpeech(options)` crea **la sesión compartida** de la app (objeto con estado reactivo de solo lectura y métodos) y es plugin (`app.use(speech)`, `speechKey`); `useSpeech()` la inyecta; `<GSpeechHost />` se monta **una vez** en la raíz del layout. **Sin instancia global de Grana** | La grabación no pertenece al campo ni al tab que la inicia (brief, «Principio principal»); una sesión por componente moriría al desmontarse. Sin globals de la app (CLAUDE.md); la instancia se puede importar fuera de componentes (guardia del router que pregunta antes de salir) |
| 1.2 | ¿Cuántas sesiones? | **Una activa por gestor** (un micrófono, una captura). Un disparador pulsado con otra sesión activa **no** crea otra: se marca `aria-disabled`, dice «Hay una grabación en curso. Mayús+F8 para ir a ella» (descripción) y lleva el foco a la pill | Dos capturas simultáneas mezclarían audio y confundirían el indicador; «volver al tab inicial no crea sesión nueva» (brief) |
| 1.3 | ¿Dónde vive el estado? | En el gestor (fuera de cualquier tab, paso o diálogo). Las piezas solo **leen** el estado y **llaman** métodos; ninguna guarda copia. El anfitrión vive fuera del contenido temporal | Brief, «Indicador persistente». **Verificado**: el disparador que inició la conversación se desmonta (stepper con `v-if`, peor caso) y la sesión sigue; volver muestra «Ver grabación» y abre el panel, misma `sessionId`, `sessions = 1` |
| 1.4 | ¿Qué monta `GSpeechHost`? | Raíz **`popover="manual"` siempre abierta** (capa superior, como `GToaster` #141, `GSelect` #55, `GHelper` #101) con: los **dos canales vivos** (status cortés y alert enérgico) desde el montaje, la **pill flotante de respaldo**, el **panel** (diálogo no modal anclado) y la **hoja móvil** (`<dialog>` modal) | Una región viva solo se anuncia si existe antes del cambio (#14, #137, #141). Ningún `overflow`, `z-index` ni cabecera fija la tapa |
| 1.5 | ¿Y con un `<dialog>` modal? | El anfitrión **se traslada al modal superior** mientras está abierto y vuelve a `body` (mismo mecanismo que #141: observa `open`, vuelve a `showPopover()`); ignora sus propios `<dialog>` (la hoja). Con el modal abierto la pill colocada queda inerte → se muestra la **flotante**, dentro del modal y operable | **Verificado**: el anfitrión pasa a `#dlg`, el botón de la flotante es alcanzable (`elementFromPoint`), pausar/reanudar funciona, el diálogo cambia de paso sin afectar a la sesión, Esc en el panel no cierra el diálogo, al cerrar el anfitrión vuelve a `body` |
| 1.6 | Indicador persistente: ¿qué pasa si la pill queda tapada o fuera de pantalla? | «RecordingIndicator» **no es un componente: es una garantía del anfitrión**. Mientras la sesión no esté en `idle` hay **exactamente una pill visible y operable**: la colocada (`<GSpeechPill>` en cabecera o barra) si es visible (`IntersectionObserver`), no está oculta y no es inerte (modal); si no, la **flotante**. Si la flotante tapa el elemento enfocado, pasa al **borde contrario** (2.4.11, como `GToaster` #145) | **Verificado**: al desplazar, la de cabecera sale del visor y aparece la flotante; al volver arriba se oculta. **No detectado**: una pill colocada tapada por otra capa de la app sin salir del visor (§14) |
| 1.7 | Persistencia | Sobrevive a cambios internos de la UI (tabs, pasos, acordeones, diálogos, navegación local). **No** a recargar o cerrar la app: con sesión activa se pide confirmación al salir (`beforeunload`, opción `guardUnload`, propuesta: activa). La recuperación tras cierre es F3 y de producto (§15.4) | Brief, «Persistencia» |
| 1.8 | ¿SSR? | Igual que #147: importar y crear el gestor no toca `document`/`window`/`navigator`; la captura, los observadores y las escuchas solo existen con `GSpeechHost` montado y una sesión iniciada | Patrón vigente |

## 2. Interfaz del adaptador (Grana no conoce el motor)

**Grana no hace red ni conoce Whisper** (CLAUDE.md: sin `fetch` en componentes). La aplicación aporta un **adaptador** que conecta su servicio local (Whisper, whisper.cpp, faster-whisper + diarización). Grana define la interfaz y la UI.

### 2.1 ¿Quién captura el audio? **Grana**, salvo que el adaptador declare lo contrario

| Opción | Decisión |
| --- | --- |
| **Grana captura** (defecto): `getUserMedia` → `MediaStreamTrack` + `AudioContext` con `AnalyserNode` (nivel) y entrega al adaptador en el formato que este declara: **PCM** (`AudioWorklet`, mono, a la `sampleRate` pedida, p. ej. 16 kHz para Whisper) o **codificado** (`MediaRecorder`, `mimeTypes` + `timeslice`) | **Elegida**. Una sola fuente de verdad para «¿el micrófono captura de verdad?»: `track.readyState`, eventos `ended`/`mute` y un **vigilante de fotogramas**; permisos y errores de `getUserMedia` mapeados igual para todos los motores; nivel real para la onda **independiente de la latencia del motor**. Grana entrega trozos (`push`) y el adaptador decide el transporte: Grana sigue sin red |
| **El adaptador captura** (`input.format: 'self'`) | Vía de escape para envoltorios nativos (Capacitor, Electron, app de escritorio con su propio servicio de audio) o captura en segundo plano. El adaptador **debe** emitir `level` y `capture` (`live`/`ended`/`muted`); sin ellos Grana no muestra «Grabando» (muestra «Escuchando (sin señal verificada)», propuesta) |

**Nivel de la onda:** RMS del dominio temporal del `AnalyserNode` cada 100 ms → dBFS → 0..1 (−60 dB a −10 dB en el prototipo). **Voz detectada:** umbral de energía con 450 ms de cola (prototipo); si el adaptador declara `vad: true`, sus eventos `voice` mandan.

### 2.2 Forma del adaptador (propuesta; lima fija nombres y tipos)

```ts
interface SpeechAdapter {
  id: string
  capabilities: {
    location: 'device' | 'local' | 'remote'   // lo declara la app; Grana no puede verificarlo (§3)
    input: { format: 'pcm'; sampleRate: number; channels: 1 }
         | { format: 'encoded'; mimeTypes: string[]; timeslice: number }
         | { format: 'self' }
    partials: boolean          // emite texto provisional
    vad: boolean               // emite 'voice'; si no, Grana detecta por energía
    diarization: boolean       // segmentos con hablante
    maxSpeakers?: number
    offlineBuffer: boolean     // guarda audio si se pierde el servicio (§3.3)
    storesAudio: 'none' | 'memory' | 'disk'   // 'disk' ⇒ cifrado obligatorio (contrato)
  }
  check?(): Promise<void>      // salud del servicio SIN abrir el micrófono (estado ready)
  open(ctx: { mode: 'dictation' | 'conversation'; expectedSpeakers: 1 | 2 | 'many'; language?: string;
              signal: AbortSignal; emit(type, payload): void }): Promise<SpeechEngineSession>
}
interface SpeechEngineSession {
  push(chunk: { seq: number; t0: number; t1: number; format: 'pcm' | 'encoded'; data: Float32Array | Int16Array | Blob }): void | Promise<void>
  pause(): void                 // cierra el provisional en curso (pasa a pendiente)
  resume(): void
  reconnect?(): Promise<void>
  finish(): Promise<{ audioDeleted: boolean }>   // resuelve cuando NO queda nada pendiente
  abort(): Promise<{ audioDeleted: boolean }>    // descarta; borra audio temporal
  retrySegment?(id: string): void
}
// Eventos (ctx.emit):
// 'partial'    { id, text, speaker? }                      — sustituye al provisional anterior
// 'final'      { id, text, speaker?, t0, t1, words?, confidence? } — mismo id que su provisional
// 'pending'    { count, ms? }                              — fragmentos capturados sin texto final
// 'voice'      { speech: boolean }                         — solo con vad: true
// 'connection' { state: 'lost' | 'retrying' | 'restored', attempt? }
// 'speakers'   { relabel: Record<string, string> }         — diarización revisada (F2)
// 'error'      { kind, fatal, segment?, audio: 'none' | 'processing' | 'kept' | 'lost', retryable? }
// 'level' / 'capture'                                       — solo con input.format 'self'
```

**Tipos de error** (`kind`), comunes a Grana y al adaptador: `permission-denied`, `no-device`, `device-busy`, `device-disconnected`, `interrupted` (los produce la captura de Grana), `service-unavailable`, `processing-failed`, `storage-full` (los produce el adaptador), `remote-not-allowed`, `unsupported` (Grana). Cada error de la sesión lleva **las cuatro respuestas del brief**: `capture` (`continues` · `paused` · `stopped` · `none`), `audio` (`none` · `processing` · `kept` · `lost`), si lo transcrito se conserva (siempre, en memoria del gestor) y `recoverable`.

### 2.3 Adaptador simulado

`createSimulatedSpeechAdapter(options)` en una **entrada de pruebas** (propuesta: `@grana/vue/testing`, para que no viaje en el paquete principal): emite provisional palabra a palabra (sin tildes ni puntuación) y el confirmado con puntuación tras una latencia; hablantes por guion; fallos inyectables (servicio caído con reintentos, fragmento fallido, sin espacio). Es el del prototipo; sirve a bruno para las pruebas y a mora-docs para la documentación.

## 3. Privacidad por diseño

1. **Sin red en Grana.** Grana entrega audio al adaptador en memoria; el transporte (localhost, red interna) es del adaptador. Grana **no** escribe en `localStorage`, IndexedDB ni disco.
2. **Sin terceros por defecto.** Un adaptador con `location: 'remote'` se **rechaza** salvo que la app pase `allowRemote: true`: estado `error` (`remote-not-allowed`), **el micrófono no se abre**, aviso de desarrollo (verificado). La ubicación se muestra siempre en el panel («Procesamiento en este dispositivo / en el servicio local de tu organización / en un servicio externo»). Grana **no puede verificar** lo que declara el adaptador: es responsabilidad de la app y así se documenta.
3. **Audio temporal: contrato del adaptador.** Si `storesAudio ≠ 'none'`: en memoria, o en disco **cifrado en reposo** (clave efímera no exportable, p. ej. WebCrypto, que no sale de la sesión); **eliminación** al `finish`/`abort`/cierre y limpieza de huérfanos al arrancar; **falta de espacio** → `error` `storage-full` fatal (la captura se detiene, lo pendiente se sigue procesando); **errores** con `audio: 'kept' | 'lost'`; **recuperación** solo en F3 y si el producto la activa. Por defecto **no se conserva tras finalizar**.
4. **Lo que hace la UI:** muestra la línea de privacidad (ubicación + destino del audio); al terminar **solo dice «Audio temporal eliminado» si el adaptador lo confirmó** (`audioDeleted: true`); si no, avisa «El motor no confirmó la eliminación del audio temporal». Igual al descartar.
5. **Micrófono abierto solo mientras captura.** `ready` comprueba permiso y servicio **sin abrir** el micrófono (verificado: sin pista). **Pausa = pistas detenidas** (el indicador del navegador/sistema se apaga; verificado), no `track.enabled = false`. Tras una interrupción o un servicio restablecido con la captura retenida, **no se reanuda solo**: hace falta «Reanudar» (propuestas kiwi).
6. **Señal veraz.** «Grabando» solo si la pista está viva, no silenciada y **llegan fotogramas**: vigilante de 1,5 s → `error` `interrupted` (verificado: con la captura congelada la pill deja de decir «Grabando» en < 2,5 s). Señal plana (ceros) > 2,5 s → aviso «No llega sonido del micrófono» sin cambiar de estado.
7. **Avisos de desarrollo sin contenido:** nunca incluyen texto transcrito.
8. **Bloqueo de pantalla** (`navigator.wakeLock`) solo durante la captura de una conversación (propuesta; evita que el móvil se duerma y corte la captura); se libera al pausar o detener.

## 4. Piezas y fases

| Pieza del brief | Qué es | Fase |
| --- | --- | --- |
| **TranscriptSession** | **Objeto de datos** (no componente): `speech.state.transcript`, exportable a JSON; `createTranscript(data)` para cargar uno guardado | F1 (lectura) · F2 (edición) |
| Recording Session | **El gestor** `createSpeech` / `useSpeech` / `speechKey` | F1 |
| (región) | **`GSpeechHost`** público: canales vivos, flotante, panel, hoja | F1 |
| **SpeechTrigger** | **`GSpeechTrigger`** público. `mode="dictation"` + `for` (id del campo) → botón conmutable de solo icono (`aria-pressed`); `mode="conversation"` → botón con texto que prepara la sesión («Grabar conversación» / «Ver grabación») | F1 |
| **RecordingPill** | **`GSpeechPill`** público, **opcional**: colocable en cabecera o barra. Sin él, solo la flotante | F1 |
| RecordingIndicator | **Garantía del anfitrión** (1.6), no componente | F1 |
| RecorderPanel | **Interno** de `GSpeechHost` (popover no modal en escritorio, hoja en móvil). Contenido ampliable por slots en F2 (propuesta) | F1 |
| Waveform | **Interno** (`aria-hidden`); el estado en texto es su equivalente | F1 |
| RecordingControls | **Interno** (pausar/reanudar/reintentar, finalizar, descartar con confirmación) | F1 |
| RecordingStatus | **Interno** (icono + texto corto en la pill, completo en el panel) | F1 |
| **TranscriptViewer** | **`GTranscript`** público: ve y edita **cualquier** transcript (también uno guardado, fuera de la sesión); dentro del panel lo usa el anfitrión | F2 (F1: lista de solo lectura en el panel) |
| SpeakerSegment | **Interno** de `GTranscript` | F2 |

**Fases entregables (propuesta kiwi):**
- **F1 — Captura fiable y dictado:** gestor + adaptador (interfaz + simulado) + `GSpeechHost` + `GSpeechTrigger` + `GSpeechPill`; los 13 estados y transiciones; nivel real; pausa/reanudar/finalizar en 6 pasos; errores con sus cuatro respuestas; anuncios; traslado al modal; dictado en vivo a un campo con deshacer; panel con transcript de solo lectura (provisional vs confirmado); línea de privacidad.
- **F2 — Revisión y destino:** `GTranscript` editable (corregido, eliminar/restaurar, reasignar hablante), hablantes y roles, selección, copiar, **destinos registrados** (`speech.targets`) con inserción y deshacer, capa `derived` (solo datos), relabel de diarización.
- **F3 — Robustez de producto:** recuperación tras cierre (si el producto la quiere), kit de pruebas del contrato de audio temporal, selección de dispositivo (`enumerateDevices`, `devicechange`), captura `self` para envoltorios nativos y segundo plano, transcript a pantalla completa en móvil, sesiones de horas (lista virtualizada).

## 5. Estados y transiciones

Trece estados visibles, **cada uno con icono y texto** (y la pill con borde discontinuo en los de problema: no solo color, 1.4.1). La tabla completa está generada en el prototipo (§4) con los mismos datos que usa la sesión.

| Estado | Icono Lucide | Pill | Micrófono | Anuncio |
| --- | --- | --- | --- | --- |
| `idle` | `mic` | (no hay pill) | apagado | — |
| `requesting` | `shield-question-mark` | Pidiendo permiso | abriéndose | cortés **solo si el navegador pregunta** («Activando el micrófono» si ya hay permiso) |
| `ready` | `mic` | Listo | **apagado** | cortés |
| `listening` | `circle` (relleno) | Grabando | captura | cortés al empezar / reanudar |
| `speech` | `audio-lines` | Voz detectada | captura | **no** |
| `transcribing` | `captions` | Transcribiendo | captura | **no** |
| `paused` | `circle-pause` | En pausa | **apagado (pistas detenidas)** | cortés |
| `processing` | `loader-circle` (gira; quieto con movimiento reducido) | Procesando | apagado | cortés |
| `reconnecting` | `refresh-cw` | Reconectando (· grabando) | captura si `offlineBuffer`; si no, **retenida** (apagado) | cortés |
| `denied` | `mic-off` | Permiso denegado | apagado | **enérgico** |
| `unavailable` | `unplug` | Sin micrófono | apagado | **enérgico** |
| `error` | `circle-alert` | Error | apagado | **enérgico** |
| `completed` | `circle-check` | Lista | apagado | cortés |

**Facetas** (estado de solo lectura del gestor): `status`, `mode`, `target`, `permission` (`prompt`/`granted`/`denied`/`unknown`, de la Permissions API si existe), `capture` (`off`/`live`/`held`), `voice`, `signal` (`ok`/`flat`), `duration` (audio **capturado**, sin pausas), `pending`, `engine` (`ok`/`lost`/`retrying`), `attempt`, `error`, `issues` (fallos no fatales), `transcript`, `result`. El nivel **no** es reactivo: `speech.onLevel(cb)` (evita 10 renders por segundo).

**Transiciones legales** (cualquier otra se rechaza con aviso de desarrollo; verificado que pausar sin sesión no hace nada):

| Desde | Hacia |
| --- | --- |
| `idle` | `requesting` (dictado), `ready` (conversación: `prepare()`), `denied`, `error` (`remote-not-allowed`, servicio caído) |
| `requesting` | `listening`/`speech`/`transcribing`, `denied`, `unavailable`, `error`, `idle` (cancelar) |
| `ready` | `requesting` (empezar), `denied`, `unavailable`, `error`, `idle` |
| `listening` ⇄ `speech` ⇄ `transcribing` | entre sí (voz / pendientes), `paused`, `processing`, `reconnecting`, `denied` (permiso revocado), `unavailable` (desconexión), `error`, `idle` (descartar) |
| `paused` | `requesting` (reanudar), `processing`, `reconnecting`, `error`, `idle` |
| `processing` | `completed`, `error` (**sin** descartar ni cerrar mientras haya pendientes) |
| `reconnecting` | captura (restablecido), `paused` (restablecido con captura retenida: **no** reanuda solo), `processing`, `denied`, `unavailable`, `error`, `idle` |
| `denied` | `requesting` (reintentar), `ready`, `processing` (si hay algo capturado), `idle` |
| `unavailable`, `error` | `requesting` (reintentar/reanudar si `recoverable`), `processing`, `idle` |
| `completed` | `idle` (cerrar sesión → `onComplete(transcript)`, o descartar) |

**Finalización explícita en 6 pasos** (verificado): detener captura (pistas paradas) → `pause()` cierra el provisional → `processing` con barra de progreso (`GProgress`) y **sin** acciones de cierre → `finish()` resuelve cuando no queda nada pendiente → `completed` → revisión. El dictado se **cierra solo** si todo se insertó (con «Deshacer dictado» bajo el campo); la conversación queda en `completed` hasta «Cerrar sesión».

**Un fallo de captura cierra el provisional** en curso (pasa a pendiente y se procesa; verificado tras desconectar). Un fallo de **un** fragmento (`processing-failed` no fatal) no detiene la captura: el fragmento queda marcado con «Reintentar fragmento» si el audio se guardó (verificado).

## 6. Transcript Session y capas

**Audio original → literal → corregido → derivado.** El literal **nunca se sobrescribe**.

| Capa | Dónde | Quién escribe |
| --- | --- | --- |
| Literal | `segment.literal`, `segment.engineSpeaker` (inmutables tras el `final`; el reintento de un fragmento fallido lo rellena) | Solo el motor |
| Corregido | `segment.corrected` (null = igual al literal), `segment.speaker` (reasignación), `segment.removed` (borrado **lógico**) | El usuario (F2) |
| Derivado | `transcript.derived[]` = `{ id, kind, text, sourceSegmentIds, createdBy }` | La aplicación (resumen, extracción); Grana solo guarda la referencia (§15.5) |

Segmento: `{ id, t0, t1, literal, engineSpeaker, corrected, speaker, removed, failed }`. Operaciones (F2): `edit`, `revert`, `remove`/`restore`, `assignSpeaker`, `setRole`, `compose(ids, { withSpeakers })`, `toJSON()`. **Provisional vs confirmado:** el provisional es uno solo (`transcript.partial`), en cursiva y más claro con la etiqueta visible «provisional» y prefijo oculto «Texto provisional:»; el `final` con el mismo `id` lo sustituye en su sitio. Verificado: tras editar, `literal` igual y `corrected` aparte; `onComplete` recibe ambos.

**Inserción en un campo:**
- **Dictado (en vivo, ligado al elemento):** el texto **confirmado** entra en el **punto de inserción** (cursor o selección del campo al empezar; si el campo tiene el foco, su cursor actual) con `setRangeText` + evento `input` (sirve a `v-model`), **sin mover el foco** (verificado: el foco sigue en el disparador). Espacio separador automático. El provisional **no** toca el valor. **Deshacer:** registro propio de inserciones, válido mientras el campo no cambie (verificado); el Ctrl+Z nativo **no** lo deshace (`setRangeText` no entra en la pila de deshacer; `execCommand('insertText')` sí, pero exige mover el foco al campo).
- **Campo desmontado** (otro tab): **no** se inserta a ciegas; al volver, «N fragmentos dictados sin insertar · Insertar» (verificado); la sesión no se cierra sola hasta entonces.
- **Revisión (F2, ligado al modelo):** la app registra **destinos** `{ id, label, insert(text) → { undo() } }` que escriben en su estado del formulario: funcionan aunque el campo esté en otro tab (verificado con Plan desmontado). Se inserta la selección (o todo) del **corregido**, opcionalmente con el rol del hablante; «Deshacer inserción».

## 7. Hablantes y roles

- Etiquetas neutras por orden de aparición: `labels.speaker` = «Hablante {letter}» (A, B, C…). **No** se asume quién es quién.
- **Participantes previstos** (`expectedSpeakers`: 1 · 2 · varios) se elige en `ready` y se pasa al adaptador como pista.
- **Roles**: lista que aporta la app (`roles: [{ id, label }]`, sin valores por defecto); se asignan **por hablante** en el panel (`GSelect`; «Hablante B · Paciente», verificado).
- **Reasignar** un fragmento a otro hablante (o a uno nuevo) es una **corrección**, no cambia `engineSpeaker`; se marca «hablante cambiado (motor: A)» (verificado).
- Sin diarización (`capabilities.diarization: false`): el panel lo dice y los hablantes se asignan a mano por fragmento.
- Diarización revisada por el motor (evento `speakers.relabel`, F2): actualiza la capa literal; las reasignaciones del usuario se conservan.

## 8. Accesibilidad y anuncios

**Anuncios (WCAG 4.1.3)** — un solo par de canales en el anfitrión (verificado: 2 regiones vivas en toda la página, también durante la sesión); el texto se vacía y reescribe (como #141); cola cortés con separación; los cambios de estado se agrupan (300 ms, gana el último):

| Se anuncia | Canal |
| --- | --- |
| Espera de permiso (solo si el navegador pregunta), listo, inicio («Grabando. Dictado en {campo}.» / «Grabando conversación.»), pausa («El micrófono no está capturando»), reanudación, procesando, fin («Transcripción lista: N fragmentos, mm:ss…» / «Dictado terminado. Texto añadido a {campo}.»), reconexión (dice si la grabación continúa), restablecimiento, inserción (agrupada: una tras 2,5 s sin nuevas), descarte (con la eliminación del audio solo si se confirmó), señal plana, fragmento fallido | cortés |
| `denied`, `unavailable`, `error`: «Título. Qué pasó. Qué pasa con la grabación. Qué pasa con el audio. Lo transcrito se conserva. Qué hacer.» | enérgico |
| **Nunca:** parciales, confirmados palabra por palabra, nivel, escuchando ↔ voz ↔ transcribiendo, duración | — |

Verificado: en una conversación con cambios de tab y paso, el inicio se anuncia **una** vez, ningún texto transcrito llega a los canales y hay ≤ 3 anuncios en la captura.

**Nombres y roles:** pill = `role="group"` con nombre (`labels.region`); su botón principal muestra estado + «abrir panel» (oculto), `aria-expanded`, `aria-controls`, `aria-keyshortcuts="Shift+F8"`; duración en `role="timer"` (vivo desactivado por defecto) con prefijo oculto «Duración:»; pausar/reanudar es **el mismo botón** que cambia de nombre (el anuncio lo confirma); finalizar con nombre. Disparador de dictado = botón conmutable **solo icono** con `aria-label` «Dictar en {campo}» y `aria-pressed`. Panel = `role="dialog"` **no modal** con `aria-labelledby`. Iconos decorativos (`aria-hidden`); la onda y el medidor `aria-hidden` (su equivalente es el texto de estado, 1.1.1).

**Teclado (2.1.1, 2.1.4):** todo es botón o control nativo. **Mayús+F8** lleva a la pill visible y, otra vez, devuelve el foco (verificado); **F8 queda para `GToaster`** (verificado que F8 solo no se intercepta); sin sesión no se intercepta nada; configurable (`hotkey`, `false` lo desactiva). Sin atajos de una sola tecla. **Esc** en el panel lo cierra con `preventDefault` + `stopPropagation` (no cierra un `GDialog` anfitrión, #143; verificado); Esc **nunca** detiene ni descarta. Descartar pide confirmación en línea con el foco en «Cancelar».

**Foco (2.4.3, 3.2.2):** abrir el panel → su título (`tabindex="-1"`); cerrar → quien lo abrió (o la pill visible); editar → el texto; guardar/cancelar → «Editar» del fragmento; eliminar → «Restaurar»; al cerrar la sesión con el foco en la pill → el disparador. **Nada roba el foco por sí solo**: ni al confirmar texto, ni al terminar el procesamiento (el aviso cortés invita a abrir el panel).

**Movimiento (2.2.2, 2.3.3):** la onda es contenido que se mueve más de 5 s en paralelo: «**Ocultar actividad**» (`aria-pressed`) oculta onda y medidor y deja el texto de estado (verificado). Con `prefers-reduced-motion`: medidor **discreto de 5 segmentos** a ≤ 4 Hz, sin historial que se desplaza, sin giro del `loader-circle` (verificado). La duración se considera **esencial** (es la información «cuánto lleva», brief) y no se oculta.

**Objetivos (2.5.8):** ≥ 24px (≥ 44px con `pointer: coarse`); verificado en pill, panel y disparadores. **Contraste:** coco (texto 4.5:1, bordes e iconos de estado 3:1, provisional incluido: más claro **pero** ≥ 4.5:1).

**Permisos:** `navigator.permissions.query({ name: 'microphone' })` cuando existe (decide si se anuncia la espera y si `denied` se detecta sin abrir nada); escuchar `change` para habilitar «Reintentar» cuando el usuario lo conceda (propuesta; no implementado en el prototipo). Errores de `getUserMedia`: `NotAllowedError` → `denied`; `NotFoundError`/`OverconstrainedError` → `unavailable` (`no-device`); `NotReadableError`/`AbortError` → `unavailable` (`device-busy`); `SecurityError`/sin `mediaDevices` (contexto no seguro) → `unavailable` (`unsupported`).

## 9. Móvil

- **< `space × 130`** (umbral de `GDialog`, #103, medido): el panel es una **hoja inferior** (`<dialog>` modal dentro del anfitrión) de alto máximo ~88 % del visor dinámico con `safe-area-inset-bottom`; la pill flotante va **abajo** (alcance con una mano; en escritorio, arriba al centro, propuesta) con `env(safe-area-inset-*)`. Verificado a 320×640: hoja dentro del visor, foco al título, Esc la cierra, sin desborde horizontal (página y hoja), pill de cabecera y flotante dentro del visor.
- **Orientación:** al cruzar el umbral con el panel abierto, se reabre en la forma correcta (popover ↔ hoja). Sin bloqueo de orientación.
- **Interrupciones** (llamada, otra app toma el micrófono): `mute`/`ended` de la pista o falta de fotogramas → `error` `interrupted` con «Lo transcrito se conserva» y «Reanudar»; **no reanuda solo**.
- **Segundo plano:** en web, Grana **no** detiene la captura al ocultarse la pestaña (lo que el sistema permita, sigue); si el sistema la suspende (iOS Safari), el vigilante la marca como interrumpida al volver. Segundo plano real en nativo: adaptador `self` (F3).
- **Pantalla:** `wakeLock` durante la captura de conversación (3.8). **Transcript a pantalla completa** en móvil: F3 (la hoja ya ocupa casi todo).
- **Teclado virtual** con la hoja abierta y edición de fragmentos: no verificado.

## 10. Integración con campos, tabs, diálogos y avisos

- **Campos:** `GSpeechTrigger mode="dictation" for="<id>"` junto a la etiqueta o en el hueco `append` de `GTextarea`/`GInput` o una parte de `GInputGroup` (hallazgo 12.6). La nota bajo el campo (provisional, sin insertar, deshacer) la pinta el disparador; **no** es región viva.
- **Tabs y stepper:** la sesión vive fuera; cambiar no detiene; volver al tab inicial no crea sesión (el disparador de conversación pasa a «Ver grabación»); solo una acción explícita (finalizar, descartar) la detiene. Verificado con el panel inactivo **desmontado**.
- **Diálogos:** traslado al modal superior (1.5); el panel se abre **dentro** del diálogo y por encima; Esc del panel no cierra el diálogo; el contenido del diálogo cambia de paso sin afectar a la sesión (verificado). Un disparador de dictado dentro del diálogo funciona igual (el destino es su campo).
- **Avisos (`GToaster`):** convivencia de dos raíces en capa superior y dos pares de canales (uno por servicio). **F8** avisos, **Mayús+F8** voz. En móvil ambos van abajo: hace falta coordinar el margen (hallazgo 12.7). No verificado juntos en la misma página.

## 11. Qué reutiliza y qué no

| Reutiliza | Para |
| --- | --- |
| Patrón `createToaster` / `GToaster` (#140, #141, #143) | Gestor por app + plugin + `use…()`; región permanente en capa superior; traslado al modal; Esc con `stopPropagation`; atajo de ida y vuelta |
| `GBtn` | Disparadores, controles de pill y panel (`icon` + `aria-label` en solo icono; `aria-pressed` en el dictado) |
| `GIcon` (público, #197–#206) | Todos los iconos de estado y control (§12.4) |
| `GProgress` | Procesamiento final |
| `GSelect` | Rol por hablante, destino, hablante de un fragmento |
| `GTextarea` / `GInput` / `GInputGroup` | Campo con disparador; editor de fragmento |
| `GSurface level="floating"` | Panel y pill flotante (coco decide) |
| `GDialog` (umbral `space × 130`, hoja) | Forma de la hoja móvil (el anfitrión usa su propio `<dialog>`: el de `GDialog` exigiría montar un componente público dentro de la región) |
| `GCheckbox` | Selección de fragmentos; aviso a participantes |
| `utils/template.js` (`fill`) | Plantillas de `labels` |

| No usa | Razón |
| --- | --- |
| `GToaster` para los anuncios de la voz | Acoplaría dos servicios opcionales; mismo patrón, canales propios |
| `GMenu` por fragmento | Un solo «Editar» por fragmento (2 paradas de tabulación con la casilla) agrupa texto, hablante, restaurar y eliminar |
| `GBadge` | El estado ya es texto + icono; un contador de «avisos» en la pill sería ruido (los fallos no fatales viven en el panel) |
| Rojo/`danger` para «grabando» | El brief pide énfasis sin alarma; `danger` solo para errores (12.3) |
| `utils/anchor.js` | Se puede usar para anclar el panel a la pill (bruno decide); el prototipo posiciona a mano |

## 12. Hallazgos para lima (API y tokens, sin valores)

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| 1 | Entrega del sistema | Alta | `createSpeech(options)` → gestor + plugin (`speechKey`); `useSpeech()`; `<GSpeechHost :speech?>` (una vez, por defecto el inyectado); `<GSpeechTrigger mode for label?>`; `<GSpeechPill>` (opcional, colocable); F2 `<GTranscript :transcript>`; `createTranscript(data)`; `createSimulatedSpeechAdapter` en entrada de pruebas. Añadir el sistema a «Servicios imperativos» de `api.md` |
| 2 | Opciones del gestor | Alta | `adapter` (obligatorio), `allowRemote` (Boolean, `false`), `hotkey` (sintaxis `aria-keyshortcuts`, propuesta `Shift+F8`, `false` desactiva), `expectedSpeakers` por defecto, `roles`, `floating` (`{ position }`, propuesta `top-center` escritorio · abajo en móvil), `pauseReleasesMic` (propuesta `true`, ¿debe ser opción?), `wakeLock` (propuesta `'conversation'`), `guardUnload` (propuesta `true`), `requireConsent` (§15.1), `labels`, callbacks `onComplete(transcript)`, `onDiscard`, `onError(error)` |
| 3 | Métodos y estado | Alta | `prepare()`, `start({ mode, target })`, `begin()`, `pause()`, `resume()`, `finish()`, `discard()`, `close()`, `cancel()`, `openPanel()`, `closePanel()`, `onLevel(cb)`; `targets.register({ id, label, insert })` (F2). Estado de solo lectura con las facetas del §5 |
| 4 | Interfaz del adaptador | Alta | La del §2.2 con los tipos de error y las cuatro respuestas; documentar el **contrato de audio temporal** (§3.3) como obligación de la app |
| 5 | Textos sin valores por defecto | Alta | `labels.region`, `openPanel`, `closePanel`, `duration`, acciones (`pause`, `resume`, `retry`, `finish`, `discard`, `discardAsk`, `discardYes`, `cancel`, `start`, `closeSession`, `dismiss`), `states.{13}.{short,long}`, `modes`, `speaker` (`{letter}`), `unassigned`, `trigger.{dictate,conversation,view}` (`{target}`), `busy`, `privacy.{device,local,remote}`, `audio.{none,memory,disk,deleted,notConfirmed}`, `pending` (`{n}`), `errors.{kind}.{title,what,fix}` (`{at}`, `{range}`), `capture.*`, `audioFate.*`, `announce.*`; aviso de desarrollo si falta alguno usado |
| 6 | Hueco en los campos | Media | Confirmar que `GSpeechTrigger` cabe en el `append` de `GTextarea`/`GInput` y como parte de `GInputGroup` sin API nueva; la nota bajo el campo como hermano (no en el `helper` del campo, que ya tiene su propio uso) |
| 7 | **Útil compartido** (bruno) | Media | Extraer el seguimiento del modal superior de `GToaster` (`MutationObserver` + pila) a `utils/topModal.js` y usarlo en ambos; y coordinar el **borde inferior** en móvil (pill flotante + avisos): propuesta, el anfitrión publica su alto en `--_speech-reserve-bottom` que `GToaster` suma a su `offset` (o un útil de «pila de bordes»); lima decide si es API |
| 8 | Avisos de desarrollo | Media | Sin adaptador; `remote` sin `allowRemote`; dos `GSpeechHost` del mismo gestor; `useSpeech()` sin gestor; `GSpeechTrigger` de dictado sin `for` o con `for` que no existe; transición ilegal; `hotkey` F8 (choca con `GToaster`) o F6; adaptador `self` sin eventos `level`/`capture`; `finish()` que no confirma `audioDeleted`. **Nunca** con texto transcrito |
| 9 | Tokens (sin valores) | Media | **Reutilizar**: superficie flotante (`--g-shadow-*`, borde, radio), alto de control (pill = `GBtn`), semánticos `danger` (errores), `warning` (reconectando, señal plana, fragmento fallido), `success` (lista), `--g-color-neutral*`, tipografía cuerpo/caption, foco, `--g-duration-*`/`--g-ease-*`, `--g-space-*`. **Énfasis del estado activo** (pill con captura): un rol existente que **no** sea `danger` (p. ej. el de marca o acento; coco elige) + forma (borde más grueso) para no depender del color. Ancho del panel, barras de la onda y separaciones derivados de `space`. Probablemente **ningún token nuevo** (`tokens.md` §17.6) |
| 10 | Iconos | Media | Añadir a `icons.md` §4 (los usa un componente, #201): `mic`, `mic-off`, `pause`, `circle-pause`, `audio-lines`, `captions`, `shield-question-mark`, `refresh-cw`, `unplug`, `rotate-ccw` (F1); `text-cursor-input`, `undo-2`, `trash`, `pencil`, `copy`, `globe` (F2 y línea de privacidad externa). Ya en la librería: `circle`, `square`, `loader-circle`, `circle-alert`, `circle-check`, `chevron-down`, `x`, `triangle-alert`, `lock`. Nombres canónicos comprobados en `lucide-static` 1.49.0. Bruno: añadirlos también a la lista `lab` de `icons.json` |
| 11 | Contraste | Alta (coco) | Provisional más claro **pero** ≥ 4.5:1; borde de la pill y de la onda 3:1; estados de problema distinguibles sin color (borde discontinuo en el prototipo); `forced-colors` (bordes y barras con `CanvasText`) |
| 12 | Eventos de componente | Baja | `GSpeechTrigger`, `GSpeechPill` y `GSpeechHost` sin eventos públicos (todo va por el gestor, como `GToaster`) |

## 13. Comprobaciones ejecutadas

`node design/lab/speech/r01/verificar.mjs`: Playwright (Chromium) con servidor propio; **115 comprobaciones, todas correctas**, consola sin errores ni avisos. Incluye:

- **Región única:** 2 canales (`status`, `alert`) dentro del anfitrión, abierto como popover en `body` antes de cualquier sesión; siguen siendo 2 durante la sesión.
- **Dictado:** `aria-pressed`; provisional bajo el campo sin tocar el valor; confirmado insertado en el cursor (entre «Uno» y «dos.»); el foco sigue en el disparador; finalizar al pulsar otra vez; cierre automático; anuncio de fin; texto no anunciado; deshacer devuelve el valor original.
- **Conversación:** `ready` sin micrófono abierto; foco al título del panel; Esc lo cierra y devuelve el foco al disparador; el disparador se desmonta (stepper) y la sesión sigue capturando más de 3 s a través de tabs y pasos con la misma `sessionId`; la transcripción crece; el indicador permanece; volver → «Ver grabación» abre el panel sin crear otra sesión; un solo anuncio de inicio; ningún parcial anunciado.
- **Pill flotante** al desplazar y oculta al volver; **Mayús+F8** ida y vuelta; F8 no interceptado.
- **Pausa:** pista detenida, texto «En pausa», botón «Reanudar», duración quieta; reanudar; anuncios.
- **Modal:** traslado, flotante operable y no inerte, pausa/reanudación desde el diálogo, cambio de paso, panel dentro del diálogo, Esc cierra el panel y no el diálogo, vuelta a `body`.
- **Finalización:** procesando con micrófono apagado, barra de progreso y sin acciones de cierre; completada; anuncios; «Audio temporal eliminado» confirmado por el adaptador; edición con literal intacto; reasignación de hablante con el del motor intacto; roles visibles; inserción en Plan **desmontado**; deshacer; cerrar sesión → `onComplete` con literal y corrección; la pill desaparece.
- **Dictado con el campo desmontado:** sigue; al volver «sin insertar · Insertar»; completada sin cierre automático; «Insertar» lo añade; luego se cierra.
- **Errores:** permiso denegado (enérgico, «No se grabó nada», micrófono sin abrir); sin micrófono; desconexión (dice que se detuvo, permite reanudar, el provisional se cierra y se procesa); servicio caído con almacenamiento (la captura sigue, «Reconectando · grabando», restablecido, anuncios); fragmento fallido (la captura sigue, «Reintentar fragmento»); servicio caído sin almacenamiento (captura retenida con la pista detenida, error tras 3 intentos, enérgico); captura congelada (error `interrupted` en < 2,5 s, la pill deja de decir «Grabando»); motor externo sin permiso (micrófono sin abrir, aviso de desarrollo); sin espacio; transición ilegal ignorada.
- **Movimiento reducido** (`reducedMotion: 'reduce'`): medidor de 5 segmentos, sin giro; «Ocultar actividad» oculta onda y medidor.
- **320×640:** hoja inferior dentro del visor con foco al título, sin desborde (página y hoja), Esc la cierra, pill de cabecera y flotante (abajo) dentro del visor.
- **Micrófono real** (dispositivo falso de Chromium, `--use-fake-device-for-media-stream`): captura con pista viva y **nivel medido > 0** del `AnalyserNode`; pausar detiene la pista.
- **Objetivos ≥ 24px** en pill, panel y disparadores.
- `packages/vue/scripts/check-icons.mjs`: 0 infracciones.

## 14. Qué NO verifiqué

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): lectura de la cola cortés y del `alert`, el cambio de nombre de pausar/reanudar con el foco encima, `role="timer"`, el traslado de canales al modal, el `aria-describedby` de «grabación en curso». **Riesgo principal.**
- **Firefox y WebKit/Safari:** `popover`, `:modal`, traslado, `getUserMedia` (en Safari, si **reanudar tras parar las pistas vuelve a pedir permiso**: afecta a `pauseReleasesMic`), Permissions API para `microphone`, `AudioContext` y su estado `suspended`, `wakeLock`.
- **Entrega real de audio** al adaptador: el prototipo solo pasa trozos con «hubo voz»; no implementé `AudioWorklet`/remuestreo a 16 kHz ni `MediaRecorder` (formatos en Safari). **Ningún motor real** (Whisper, whisper.cpp, faster-whisper, pyannote).
- **Móvil real:** interrupciones (llamada), segundo plano en iOS/Android, `safe-area`, teclado virtual con la hoja, táctil, orientación con hoja abierta.
- `devicechange`/selección de dispositivo; permiso revocado a mitad de sesión (`permissions.onchange`); varios modales apilados; convivencia con `GToaster` en la misma página; `GDialog` real (imitado).
- **Pill colocada tapada** por otra capa de la app sin salir del visor (el `IntersectionObserver` v1 no detecta oclusión; v2 `trackVisibility` solo en Chromium).
- Sesiones largas (1 h+): memoria, lista sin virtualizar, deriva del reloj de duración (suma de fotogramas de 100 ms).
- `forced-colors`, `prefers-contrast`, zoom 200 %; `beforeunload` en cada navegador.
- La latencia de 1,5 s del vigilante y los 2,5 s de señal plana son valores de prototipo, no medidos con usuarios.

## 15. Preguntas de producto realmente abiertas

1. **Consentimiento de los participantes** en conversación (requisito legal según el país): ¿Grana lo exige, lo ofrece como opción de la app o lo deja fuera? **Recomendación:** opción de la app (`requireConsent` + `labels.consent`), desactivada por defecto; el prototipo lo muestra con «Pedir aviso a participantes».
2. **Motor externo** (`location: 'remote'`): ¿se permite alguna vez? **Recomendación:** sí, solo con `allowRemote: true` explícito y la línea de privacidad siempre visible; la alternativa es prohibirlo en Grana.
3. **Escuchar el audio de un fragmento durante la revisión:** exige conservar el audio hasta cerrar la sesión, contra «no se conserva tras finalizar». **Recomendación:** fuera de v0.1; si entra, ligado a `storesAudio` y con borrado al cerrar.
4. **Recuperación tras cerrar la app** (F3): ¿el producto la quiere? Implica audio y transcript en disco cifrado. **Recomendación:** F3, opcional por app.
5. **Contenido derivado** (resumen, extracción a campos con un modelo local): ¿Grana solo guarda la capa `derived` como datos o también ofrece UI? **Recomendación:** solo datos en v0.1.

Sin pregunta (propuestas kiwi pendientes de visto bueno): servicio por aplicación con una sesión activa; Grana captura (adaptador `self` como escape); `ready` sin micrófono abierto; **pausa = pistas detenidas**; sin reanudación automática tras interrupción o servicio restablecido con captura retenida; **Mayús+F8**; flotante arriba al centro en escritorio y abajo en móvil; una sola pill visible; dictado con inserción en vivo del confirmado y deshacer propio; cierre automático del dictado; la conversación espera a «Cerrar sesión»; sin descartar durante el procesamiento; vigilante de 1,5 s; «Ocultar actividad» para 2.2.2; `wakeLock` solo en conversación; `beforeunload` con sesión activa; anuncios solo de ciclo de vida y errores.
