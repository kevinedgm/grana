# Contrato · Captura de voz · Fase 1 (gestor `createSpeech`, anfitrión `GSpeechHost`, `GSpeechTrigger`, `GSpeechPill`)

**Dueño:** lima · **Estado:** aprobado (Fase 1) · CSS entregado por coco (commit a70f366; `GSpeechPill.css`, `GSpeechHost.css`, `GSpeechTrigger.css`; `design/lab/speech/estilo.md`, 47 070/47 070 en los tres motores) y reconciliado aquí (#227 a #229) · pendiente de bruno (gestor, captura, componentes, adaptador simulado, útiles compartidos) y de la auditoría de coco · **Basado en:** `design/lab/speech/r01/` (kiwi, commit c0e9edb; `brief.md` del usuario, `declaracion.md` con 15 puntos, `index.html` con la sesión, el anfitrión y el adaptador simulados, `verificar.mjs` 115/115 en Chromium) · **Compone:** `btn.md`, `surface.md` (`level="floating"`), `GProgress` (`widget.md`), `select.md`, `checkbox.md`, `GIcon` (`icons.md`) · **Patrón:** `toast.md` (servicio imperativo con región persistente; #140, #141, #143, #145) · **Convive con:** `toast.md` (borde compartido, §6.7), `dialog.md` (traslado al modal superior y Esc)
**Tags:** `g-speech-host` (anfitrión) · `g-speech-pill` (pill colocable) · `g-speech-trigger` (disparador) · **Categoría:** comunicación y estado (entrada de datos por voz)

Un **sistema de captura de voz y transcripción** pensado para información sensible: una **sesión compartida por aplicación** que sobrevive a cambios de pestaña, paso, acordeón o diálogo; un **indicador siempre visible** mientras el micrófono está en uso; transcripción **provisional y confirmada**; dictado directo a un campo y conversaciones largas con varios hablantes. **Grana no conoce el motor ni hace red:** la aplicación aporta un **adaptador** (Whisper, whisper.cpp, faster-whisper, diarización local…) y Grana pone la captura, el estado, la interfaz y la accesibilidad.

Decisiones del usuario delegadas («decide tú» sobre las recomendaciones de kiwi): DECISIONS.md **#207 a #211**; regla del usuario fijada en el brief («el audio no se conserva tras finalizar»): **#209**. Propuestas de kiwi aprobadas por derivar de estándar o de contratos vigentes: **#212 a #226**.

---

## Principios

- **Servicio por aplicación, no componente suelto** (#212; patrón #140). La grabación no pertenece al campo ni a la pestaña que la inicia: vive en un **gestor** (`createSpeech`) que la aplicación crea, instala como plugin y monta con **un** `<GSpeechHost />`. Las piezas visibles solo **leen** el estado del gestor y **llaman** a sus métodos; ninguna guarda copia.
- **Una sesión activa por gestor** (un micrófono, una captura). Un disparador pulsado con otra sesión activa **no** crea otra.
- **Sin indicador no hay micrófono** (#212). Grana **no abre el micrófono** si no hay un `GSpeechHost` montado para ese gestor: el usuario nunca graba sin ver que graba (brief, «el usuario nunca debe perder de vista que el micrófono sigue activo»).
- **Señal veraz** (#215). «Grabando» solo se muestra si la pista está viva, no silenciada **y llegan fotogramas**. Nunca se dice que se graba ante un fallo de captura o de procesamiento.
- **Privacidad por diseño** (#208, #209, #218). Grana no hace red ni guarda nada en disco; un motor externo solo con `allowRemote: true`; el panel dice siempre **dónde** se procesa y **qué pasa con el audio**; «Audio temporal eliminado» solo si el adaptador lo confirmó.
- **El literal del motor nunca se sobrescribe**: el transcript separa literal, corregido (Fase 2) y derivado (solo datos, #211).
- **Estado reconocible sin color**: cada uno de los 13 estados tiene **icono y texto** (WCAG 1.4.1); la onda es complemento (`aria-hidden`), nunca la única señal (1.1.1).
- **Nada roba el foco por sí solo** (3.2.2); el anfitrión se alcanza con **Mayús+F8** (F8 es de `GToaster`).
- **Sin textos por defecto** (Grana es internacional): `labels` del gestor, todos sin valor.
- **Sin dependencias ni globals de la app**: importar el paquete y crear el gestor no toca `document`, `window` ni `navigator` (SSR).
- **Se reutiliza, no se duplica:** `GBtn`, `GIcon`, `GSurface floating`, `GProgress`, `GSelect`, `GCheckbox`, el umbral de hoja de `GDialog` (`space × 130`, #103), `utils/template.js` (`fill`), el seguimiento del modal superior de `GToaster` (extraído a útil compartido, §6.6).

## Frontera con otros componentes

| Necesidad | No es esto | Usar |
| --- | --- | --- |
| Avisar del resultado de una acción | La captura de voz tiene sus propios canales vivos | `GToast` (los dos servicios conviven, §6.7) |
| Reconocimiento de voz del navegador (`SpeechRecognition`, Web Speech API) | **Grana no lo usa**: en Chromium envía el audio a servidores externos | Si una aplicación lo quiere, lo envuelve en un adaptador con `location: 'remote'` y necesita `allowRemote: true` (#208, #218) |
| Grabar audio para conservarlo (notas de voz, adjuntos) | La captura **no conserva** el audio tras finalizar (#209) | Fuera de alcance; componente propio si se pide |
| Editar, reasignar hablantes, insertar en varios campos | Fase 2 | `GTranscript` y destinos registrados (§18) |
| Error de un campo | Va junto al campo | Mensajes de `GInput`/`GTextarea` |

## Fases (alcance de este contrato)

| Fase | Contenido | Estado |
| --- | --- | --- |
| **F1 — Captura fiable y dictado** | Gestor + plugin + `useSpeech`; interfaz completa del adaptador y adaptador simulado; `GSpeechHost` (canales, pill flotante, panel, hoja, traslado al modal); `GSpeechTrigger` (dictado y conversación); `GSpeechPill`; los 13 estados y sus transiciones; nivel real; pausa, reanudación y finalización en 6 pasos; errores con sus cuatro respuestas; anuncios; dictado al cursor con deshacer propio; transcript de **solo lectura** en el panel (provisional frente a confirmado, hablante del motor); línea de privacidad; consentimiento opcional | **Este contrato** |
| F2 — Revisión y destino | `GTranscript` editable, roles, selección, copiar, destinos registrados, capa `derived` | Reservado (§18) |
| F3 — Robustez de producto | Recuperación tras cierre (opcional), kit de pruebas del audio temporal, selección de dispositivo, captura nativa y en segundo plano, transcript a pantalla completa en móvil, sesiones de horas | Reservado (§18) |

---

## 1. Entrega (API pública)

Exportaciones de `@grana/vue` (bruno las registra en `src/index.js`):

| Exportación | Qué es |
| --- | --- |
| `createSpeech(options)` | Crea el **gestor de captura** de la aplicación (objeto con estado reactivo de solo lectura y métodos). También es **plugin de Vue**: `app.use(speech)` lo provee a toda la app |
| `useSpeech()` | Devuelve el gestor provisto (en `setup` o en un componente montado bajo la app). Sin gestor: aviso en desarrollo y `undefined` |
| `speechKey` | Clave de inyección (`InjectionKey`) para `provide` manual (pruebas, microfrontends) |
| `GSpeechHost` | Anfitrión: canales vivos, pill flotante de respaldo, panel y hoja móvil. Se monta **una vez**, lo más alto posible |
| `GSpeechTrigger` | Disparador: dictado a un campo o conversación |
| `GSpeechPill` | Pill **colocable** (cabecera, barra de herramientas). Opcional |

**Entrada de pruebas** `@grana/vue/testing` (#216; bruno añade la exportación en `package.json` y la entrada en el build): `createSimulatedSpeechAdapter(options)` (§4.7). No viaja en el paquete principal.

```js
// main.js de la aplicación
import { createApp } from 'vue'
import { createSpeech } from '@grana/vue'
import { createLocalWhisperAdapter } from './speech/whisper-adapter.js' // de la aplicación, no de Grana

export const speech = createSpeech({
  adapter: createLocalWhisperAdapter({ url: 'http://127.0.0.1:8178' }),
  language: 'es',
  labels: { /* textos de la app (§9) */ },
  onComplete: (transcript) => saveDraft(transcript),
})
createApp(App).use(speech).mount('#app')
```

```vue
<!-- App.vue -->
<template>
  <header>… <GSpeechPill /> …</header>       <!-- opcional -->
  <RouterView />
  <GSpeechHost />
</template>
```

```vue
<!-- Un campo con dictado -->
<GTextarea id="obs" v-model="form.obs" label="Observaciones" />
<GSpeechTrigger for="obs" />

<!-- Una conversación (prepara la sesión y abre el panel) -->
<GSpeechTrigger mode="conversation" />
```

### 1.1 Opciones del gestor (`createSpeech(options)` y `configure(patch)`)

| Opción | Tipo | Valores | Default | Regla |
| --- | --- | --- | --- | --- |
| `adapter` | Object | interfaz de §4 | **obligatorio** | Sin adaptador (o sin `open`/`capabilities`), ningún método inicia sesión: devuelven `false` y avisan en desarrollo. Con `configure` solo se cambia en `idle` |
| `allowRemote` | Boolean | | `false` | Permite un adaptador con `location: 'remote'` (#208). Sin él, ese adaptador se **rechaza sin abrir el micrófono** (§5) |
| `requireConsent` | Boolean | | `false` | Opción de la aplicación (#207). Con `true`, una **conversación** no empieza hasta marcar la casilla de aviso a los participantes (§6.4) |
| `language` | String | etiqueta BCP 47 (`es`, `es-MX`) | sin valor | Se pasa tal cual al adaptador (`ctx.language`); Grana no la interpreta |
| `expectedSpeakers` | Number \| String | `1` `2` `'many'` | `'many'` | Valor inicial del selector de participantes previstos en `ready` (conversación). Es una **pista** para el adaptador; `'many'` no presupone cuántos hablan (#226). En dictado es siempre `1` |
| `hotkey` | String \| `false` | sintaxis de `aria-keyshortcuts` | `'Shift+F8'` | Va y vuelve a la pill visible (§11). `false` lo desactiva. `F6` o ilegible: se rechaza y se conserva el anterior. `F8`: se acepta con aviso (atajo de `GToaster`) |
| `position` | String | `top-start` `top-center` `top-end` `bottom-start` `bottom-center` `bottom-end` | `top-center` | Borde y alineación lógicos de la **pill flotante** en escritorio (#213). En móvil se ignora: abajo al centro |
| `offset` | Object | `{ top?, bottom? }`: Number (px) o String (longitud CSS) | `{}` (función) | Reserva para una cabecera o barra fija de la app; se suma al margen y a `safe-area` (como `GToaster`) |
| `guardUnload` | Boolean | | `true` | Con una sesión que no esté en `idle`, pide confirmación al salir (`beforeunload`) |
| `wakeLock` | Boolean | | `true` | Mantiene la pantalla encendida **solo mientras se captura una conversación** (§3.6) |
| `labels` | Object | §9 | `{}` (función) | **Sin valores por defecto** |
| `onComplete` | Function | `(transcript) => void` | sin valor | Al cerrar una sesión `completed` (`close()`, o cierre automático del dictado). Recibe `transcript.toJSON()` |
| `onDiscard` | Function | `({ audioDeleted }) => void` | sin valor | Al descartar (§2.3) |
| `onError` | Function | `(error) => void` | sin valor | Al entrar en `denied`, `unavailable` o `error`, y con cada fallo no fatal (`issues`). Recibe una copia del objeto de error (§4.5) |

`configure(patch)` fusiona superficialmente (`labels` y `offset` por clave), aplica en vivo (posición, atajo, textos) y **no** reanuncia nada. `adapter` y `allowRemote` solo se aplican a la **siguiente** sesión; cambiar `adapter` fuera de `idle` avisa y se ignora. Valor fuera de lista u opción desconocida: aviso en desarrollo y se conserva el anterior.

### 1.2 El gestor: métodos

Todos los métodos que cambian de estado devuelven **`Promise<boolean>`**: `true` si se produjo la transición pedida, `false` si se rechazó (sesión ocupada, transición ilegal, falta de anfitrión). **Nunca rechazan la promesa**: los fallos van a `state.error`/`state.issues` y a `onError`.

| Método | Desde | Hace |
| --- | --- | --- |
| `prepare({ expectedSpeakers? }?)` | `idle` | **Conversación.** Crea la sesión, comprueba el permiso (Permissions API) y la salud del servicio (`adapter.check()`) **sin abrir el micrófono** → `ready` |
| `start({ mode, target? })` | `idle` | `mode: 'dictation'` exige `target: { id, label? }` (§8.3) → `requesting`. `mode: 'conversation'`: `prepare()` y, si no hace falta consentimiento, `begin()` |
| `begin()` | `ready` | Abre el micrófono y el motor → `requesting` → captura. Con `requireConsent` y `state.consent !== true`: `false` (el panel lo explica, §6.4) |
| `setConsent(value)` | `ready` | Marca el aviso a participantes (la casilla del panel lo usa; una app con su propio flujo puede llamarlo) |
| `setExpectedSpeakers(value)` | `ready` | `1`, `2` o `'many'` |
| `pause()` | captura, `reconnecting` con captura viva | **Detiene las pistas** (§2.4) → `paused` |
| `resume()` | `paused`; `denied`/`unavailable`/`error` recuperables | Vuelve a pedir el micrófono → `requesting` → captura |
| `finish()` | captura, `paused`, `reconnecting`, errores con algo capturado | Finalización en 6 pasos (§2.3) → `processing` → `completed` |
| `discard()` | cualquiera salvo `idle` y `processing` | Descarta sesión, transcript y audio temporal (`engine.abort()`) → `idle`. Programático: **sin** confirmación (la confirmación es del panel) |
| `close()` | `completed` | Entrega `onComplete(transcript)` → `idle` |
| `cancel()` | `ready`, `requesting` | Cancela antes de capturar → `idle` |
| `openPanel()` · `closePanel()` | sesión no `idle` | Abre o cierra el panel (§6.3); el foco sigue la regla de §11 |
| `retrySegment(segmentId)` | sesión con el fragmento fallido y `retryable` | Llama a `engine.retrySegment(id)` |
| `insertPending(fieldId)` | dictado con fragmentos sin insertar | Inserta, en orden, los fragmentos que quedaron sin insertar (§8.4) |
| `undoDictation(fieldId)` | registro de deshacer válido para ese campo | Deshace las inserciones del último dictado en ese campo; `false` si el campo cambió después (§8.5) |
| `onLevel(callback)` | siempre | `callback(level, live)` a cada fotograma (0..1, Boolean). Devuelve la función para darse de baja. **El nivel no es reactivo** (evita ~10 renders por segundo) |
| `configure(patch)` | siempre | §1.1 |
| `install(app)` | | Plugin de Vue: `provide(speechKey, speech)` |

Propiedades de solo lectura: `state` (§1.3) y `capabilities` (las del adaptador, normalizadas, §4.2).

### 1.3 Estado (`speech.state`, reactivo y de solo lectura)

| Faceta | Valores | Nota |
| --- | --- | --- |
| `status` | los 13 de §2.1 | |
| `sessionId` | String \| `null` | El `id` del transcript de la sesión |
| `mode` | `'dictation'` \| `'conversation'` \| `null` | |
| `target` | `{ id, label }` \| `null` | Solo dictado |
| `permission` | `'prompt'` `'granted'` `'denied'` `'unknown'` | De la Permissions API si existe; si no, `unknown` hasta el primer intento |
| `capture` | `'off'` `'live'` `'held'` | `held`: captura retenida porque se perdió el servicio sin `offlineBuffer` (pistas detenidas) |
| `voice` | `'silence'` `'speech'` | |
| `signal` | `'ok'` `'flat'` | `flat`: llegan fotogramas pero solo ceros más de 2,5 s (§3.3) |
| `duration` | Number (ms) | Audio **capturado** (suma de fotogramas; sin pausas) |
| `pending` | Number | Fragmentos capturados sin texto final (del adaptador) |
| `engine` | `'ok'` `'lost'` `'retrying'` | Conexión con el servicio |
| `attempt` | Number | Intento de reconexión en curso (del adaptador) |
| `error` | objeto de §4.5 \| `null` | El error que tiene la sesión en `denied`/`unavailable`/`error` |
| `issues` | Array | Fallos **no fatales** (fragmento sin transcribir): `{ kind, segmentId, t0, t1, audio, retryable }` |
| `transcript` | objeto de §1.4 \| `null` | |
| `result` | `{ audioDeleted }` \| `null` | Tras `finish()` o `discard()` |
| `consent` | Boolean | §6.4 |
| `expectedSpeakers` | `1` `2` `'many'` | |
| `panelOpen` | Boolean | |
| `activityHidden` | Boolean | «Ocultar actividad» (§12); dura lo que el gestor (no se guarda) |

### 1.4 Transcript (datos; en F1 de solo lectura)

```ts
{
  id: string,
  mode: 'dictation' | 'conversation',
  createdAt: string,                           // ISO 8601
  expectedSpeakers: 1 | 2 | 'many',
  speakers: Array<{ id: string }>,             // por orden de aparición; F2 añade role
  segments: Array<{
    id: string, t0: number, t1: number,        // ms desde el inicio del audio capturado
    literal: string,                           // del motor; inmutable tras el 'final' (el reintento de un fallido lo rellena)
    engineSpeaker: string | null,              // del motor
    corrected: null, speaker: null, removed: false,  // reservados para F2 (corrección del usuario); en F1 siempre así
    failed: boolean
  }>,
  partial: { id: string, text: string, speaker: string | null } | null,   // uno solo; nunca en toJSON()
  derived: [],                                 // reservado (#211): la aplicación añade sus derivados en F2
  toJSON(): object                             // copia sin `partial`
}
```

El gestor es el **único** que escribe el transcript en F1. La forma es estable entre fases: F2 llena `corrected`, `speaker`, `removed`, `role` y `derived` sin cambiar el resto.

---

## 2. Estados y transiciones (#214)

### 2.1 Los 13 estados

Cada estado tiene **icono** (Lucide vía `GIcon`) y **texto** corto (pill) y largo (panel) de `labels.states` (§9). «Tono» es el semántico que coco aplica (§13); los de problema llevan además una **señal de forma** (no solo color).

| `status` | Icono | Micrófono | Tono | Anuncio (§10) |
| --- | --- | --- | --- | --- |
| `idle` | `mic` (en el disparador) | apagado | — | — (no hay pill) |
| `requesting` | `shield-question-mark` | abriéndose | neutro | cortés **solo si el navegador pregunta**; si ya hay permiso, nada (texto largo `longGranted`) |
| `ready` | `mic` | **apagado** | neutro | cortés |
| `listening` | `circle` (relleno) | captura | **activo** | cortés al empezar o reanudar |
| `speech` | `audio-lines` | captura | **activo** | **no** |
| `transcribing` | `captions` | captura | **activo** | **no** |
| `paused` | `circle-pause` | **apagado (pistas detenidas)** | neutro | cortés |
| `processing` | `loader-circle` (gira; quieto con movimiento reducido) | apagado | neutro | cortés |
| `reconnecting` | `refresh-cw` | captura si `offlineBuffer`; si no, **retenida** (apagado) | `warning` | cortés (dice si la grabación continúa) |
| `denied` | `mic-off` | apagado | `danger` | **enérgico** |
| `unavailable` | `unplug` | apagado | `danger` | **enérgico** |
| `error` | `circle-alert` | apagado | `danger` | **enérgico** |
| `completed` | `circle-check` | apagado | `success` | cortés |

`listening`, `speech` y `transcribing` son **captura**: se derivan del gestor (`voice` y `pending`) y se mueven entre sí sin anunciarse. Prioridad: `speech` si hay voz; si no, `transcribing` si `pending > 0`; si no, `listening`.

### 2.2 Transiciones legales

Quedarse en el mismo estado no es transición. **Cualquier otra transición se rechaza** (el estado no cambia; el método devuelve `false`) **con aviso de desarrollo** que nombra los dos estados (nunca contenido).

| Desde | Hacia |
| --- | --- |
| `idle` | `requesting` (dictado), `ready` (`prepare`), `denied` (permiso ya denegado), `error` (`remote-not-allowed`, `unsupported`, servicio caído) |
| `requesting` | captura, `denied`, `unavailable`, `error`, `idle` (cancelar) |
| `ready` | `requesting` (`begin`), `denied`, `unavailable`, `error`, `idle` (cancelar) |
| captura (`listening` ⇄ `speech` ⇄ `transcribing`) | entre sí, `paused`, `processing`, `reconnecting`, `denied` (permiso revocado), `unavailable` (desconexión), `error`, `idle` (descartar) |
| `paused` | `requesting` (reanudar), `processing`, `reconnecting`, `error`, `idle` |
| `processing` | `completed`, `error` — **sin** descartar ni cerrar mientras haya pendientes |
| `reconnecting` | captura (restablecido con captura viva), `paused` (restablecido con captura **retenida**: no reanuda solo), `processing`, `denied`, `unavailable`, `error`, `idle` |
| `denied` | `requesting` (reintentar), `ready`, `processing` (si hay algo capturado), `idle` |
| `unavailable`, `error` | `requesting` (reintentar o reanudar si `recoverable`), `processing` (finalizar con lo capturado, o reintentar una finalización fallida), `idle` |
| `completed` | `idle` (`close()` o `discard()`) |

### 2.3 Finalización explícita en 6 pasos (#217)

1. **Detener la captura**: pistas paradas, `capture: 'off'`, se libera el bloqueo de pantalla.
2. **Procesar lo pendiente**: `processing`, con `GProgress` determinado (`value` = procesados / total de pendientes al empezar) y **sin** acciones de cierre ni descarte.
3. **Cerrar el provisional**: `engine.finish()` cierra el provisional en curso (pasa a pendiente, como en la pausa).
4. **Transcript final**: `finish()` resuelve `{ audioDeleted }` cuando **no queda nada pendiente**; `transcript.partial` pasa a `null`.
5. **Sesión completada**: `completed`; se anuncia el fin (§10).
6. **Revisión**: el **dictado** se cierra solo (`close()`, tras `SPEECH_TIMING.autoCloseMs`) **si todo se insertó**; si quedaron fragmentos sin insertar, espera a «Insertar» (§8.4). La **conversación** queda en `completed` hasta «Cerrar sesión» (`close()` → `onComplete`) o «Descartar».

Si `finish()` rechaza (`{ kind, audio }`), la sesión pasa a `error` con `capture: 'stopped'` y el audio que diga el adaptador; «Finalizar» vuelve a intentarlo. **Nada cierra la interfaz con segmentos pendientes**: ni Esc, ni el botón de cierre del panel (que solo cierra el panel), ni `discard()` (rechazado en `processing`).

**Descartar** desde el panel pide **confirmación en línea** (`labels.actions.discardAsk`, foco en «Cancelar»). Llama a `engine.abort()`, que resuelve `{ audioDeleted }`; el anuncio solo menciona la eliminación del audio si se confirmó (§5). En un error **sin nada capturado**, el panel ofrece «Cerrar» (`labels.actions.dismiss`): descarta sin confirmación y sin anuncio (no hay nada que perder).

### 2.4 Pausa, interrupciones y reanudación (#215)

- **Pausa = pistas detenidas** (`track.stop()`), no `track.enabled = false`: el indicador del navegador y del sistema se apaga y «el micrófono ya no captura» es verdad. `engine.pause()` cierra el provisional en curso. Reanudar vuelve a pedir el micrófono (pasa por `requesting`; si el navegador vuelve a preguntar, se anuncia).
- **Sin reanudación automática**: tras una interrupción (`interrupted`, `device-disconnected`) o un servicio restablecido con la captura **retenida**, la sesión **no** vuelve a capturar sola: hace falta «Reanudar».
- **Un fallo de captura cierra el provisional** en curso (`engine.pause()`): pasa a pendiente y se sigue procesando.
- **Un fallo de un fragmento** (`processing-failed` no fatal) **no** detiene la captura: el fragmento queda marcado y, si el adaptador guardó su audio, con «Reintentar fragmento».

---

## 3. Captura (la hace Grana; #215)

### 3.1 Flujo

Grana captura salvo que el adaptador declare `input.format: 'self'` (§4.2):

1. `navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } })` → `MediaStreamTrack`.
2. `AudioContext` (reanudado si está `suspended`) con un **`AnalyserNode`** para el nivel, **independiente de la latencia del motor**.
3. Entrega al adaptador en el formato que este declara: **PCM** (`AudioWorklet`, mono, remuestreado a `sampleRate`, en trozos de `chunkMs`) o **codificado** (`MediaRecorder` con el primer `mimeTypes` que el navegador admita, `timeslice`). Si ningún `mimeType` es admitido: `unavailable` con `kind: 'unsupported'`.
4. Cada trozo va a `engine.push(chunk)`; **Grana no espera** a `push` (§4.3). El transporte (localhost, red interna) es del adaptador: **Grana sigue sin red**.

### 3.2 Nivel y voz

- **Nivel:** RMS del dominio temporal cada fotograma (`frameMs`) → dBFS → 0..1 entre −60 dB y −10 dB (recortado). Se publica con `onLevel`; nunca en el estado reactivo.
- **Voz:** si el adaptador declara `vad: true`, mandan sus eventos `voice`. Si no, Grana detecta por energía: nivel > `voiceThreshold` con `voiceHoldMs` de cola.

### 3.3 Señal veraz (vigilante)

- **Vigilante de fotogramas:** si con `capture: 'live'` no llega un fotograma en `watchdogMs`, la sesión pasa a `error` con `kind: 'interrupted'`, `capture: 'stopped'`. Comprobación cada `watchdogTickMs`: la pill deja de decir «Grabando» en menos de **2,5 s** desde que se congela la captura (verificado por kiwi).
- **Pista:** `ended` → `unavailable` (`device-disconnected`); `mute` → `error` (`interrupted`). `AudioContext` que deja de estar `running` cuenta como falta de fotogramas.
- **Señal plana:** fotogramas que llegan con RMS exactamente 0 durante `flatMs` → `signal: 'flat'` sin cambiar de estado; aviso cortés una vez y texto en el panel. Vuelve a `ok` con el primer fotograma no nulo.
- Con `input.format: 'self'`, el vigilante usa los eventos `level` del adaptador, y la sesión **no pasa a captura** hasta recibir `capture { state: 'live' }` (§4.4).

### 3.4 Errores de `getUserMedia`

| Error | Estado | `kind` |
| --- | --- | --- |
| `NotAllowedError` | `denied` | `permission-denied` |
| `NotFoundError`, `OverconstrainedError` | `unavailable` | `no-device` |
| `NotReadableError`, `AbortError` | `unavailable` | `device-busy` |
| `SecurityError`, sin `navigator.mediaDevices` (contexto no seguro), sin `AudioContext` | `unavailable` | `unsupported` |

### 3.5 Permisos

`navigator.permissions.query({ name: 'microphone' })` cuando existe (en `prepare`/`start`): decide si se anuncia la espera del permiso y si `denied` se detecta **sin abrir nada**. Mientras la sesión exista se escucha `change` para mantener `state.permission` al día; un permiso revocado durante la captura se trata como `denied`. Si la consulta no existe o falla: `unknown`.

### 3.6 Pantalla, salida y segundo plano

- **`wakeLock`** (opción, por defecto activa): `navigator.wakeLock.request('screen')` solo durante la **captura de una conversación**; se libera al pausar, detener o fallar; se vuelve a pedir al volver la pestaña a visible si sigue capturando. Si falla, se ignora sin aviso.
- **`guardUnload`**: escucha `beforeunload` solo con una sesión fuera de `idle`.
- **Segundo plano:** Grana **no** detiene la captura al ocultarse la pestaña. Si el sistema la suspende (iOS Safari), el vigilante la marca como interrumpida al volver. El segundo plano real en nativo es F3 (adaptador `self`).

### 3.7 Constantes de comportamiento (no son tema)

Bruno las expone como `SPEECH_TIMING` interno y las prueba: `frameMs` 100 · `chunkMs` por defecto 300 (si el adaptador PCM no lo declara) · `watchdogMs` 1500 · `watchdogTickMs` 250 · `flatMs` 2500 · `voiceThreshold` 0,12 · `voiceHoldMs` 450 · `announceGroupMs` 300 · `insertAnnounceMs` 2500 · `autoCloseMs` 1500 · `reducedMotionHz` 4 · rango de nivel −60..−10 dBFS. Son valores del prototipo (kiwi §14: no medidos con usuarios); cambiarlos es decisión de lima con evidencia.

---

## 4. Interfaz del adaptador (#216)

Grana define esta interfaz; **la aplicación la implementa** (su servicio local). Grana no conoce Whisper ni ningún motor, no hace red y no puede verificar lo que el adaptador declara: es **responsabilidad de la aplicación**, y así se documenta.

### 4.1 Forma

```ts
interface SpeechAdapter {
  id: string
  capabilities: SpeechCapabilities
  check?(): Promise<void>                       // salud del servicio SIN abrir el micrófono (prepare → ready). Rechaza con { kind }
  open(ctx: {
    mode: 'dictation' | 'conversation'
    expectedSpeakers: 1 | 2 | 'many'
    language?: string
    signal: AbortSignal                         // se aborta con discard/cancel
    emit(type: string, payload: object): void
  }): Promise<SpeechEngineSession>              // rechaza con { kind } → error, sin abrir el micrófono
}
```

### 4.2 `capabilities`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `location` | `'device'` \| `'local'` \| `'remote'` | Dónde se procesa: en este dispositivo, en un servicio de la organización (localhost, red interna) o fuera. **`remote` exige `allowRemote: true`** (#208). Se muestra siempre en el panel |
| `input` | `{ format: 'pcm', sampleRate: Number, channels: 1, sampleFormat?: 'f32' \| 's16', chunkMs?: Number }` · `{ format: 'encoded', mimeTypes: String[], timeslice: Number }` · `{ format: 'self' }` | Formato que recibe. `sampleFormat` por defecto `'f32'` (`Float32Array`; `'s16'` → `Int16Array`). `self` (vía de escape para envoltorios nativos o captura en segundo plano): **el adaptador captura** y debe emitir `level` y `capture` |
| `partials` | Boolean | Emite texto provisional |
| `vad` | Boolean | Emite `voice`; si no, Grana detecta por energía |
| `diarization` | Boolean | Los `final` traen `speaker`. Si `false`, el panel lo dice |
| `maxSpeakers` | Number (opcional) | Informativo |
| `offlineBuffer` | Boolean | Si se pierde el servicio, el adaptador **guarda** el audio y la captura **continúa**; si no, la captura se **retiene** (pistas detenidas) |
| `storesAudio` | `'none'` \| `'memory'` \| `'disk'` | Qué hace con el audio temporal (§4.6). `'disk'` ⇒ cifrado en reposo obligatorio (contrato de la app) |

Capacidades inválidas (campo fuera de lista, `input` mal formado): la sesión pasa a `error` con `kind: 'unsupported'`, `recoverable: false`, **sin abrir el micrófono**, y aviso en desarrollo.

### 4.3 Sesión del motor (`SpeechEngineSession`)

| Método | Regla |
| --- | --- |
| `push(chunk)` | `chunk = { seq, t0, t1, format: 'pcm' \| 'encoded', mimeType?, data: Float32Array \| Int16Array \| Blob, voice: Boolean }` (`t0`/`t1` en ms de audio capturado; `voice`: detección de Grana, pista para motores sin VAD). **Grana no espera**: si lanza o rechaza, se registra un fallo no fatal `processing-failed` con `audio: 'lost'` para ese tramo (la captura sigue) y avisa en desarrollo |
| `pause()` | Cierra el provisional en curso (pasa a pendiente). Grana la llama al pausar y ante un fallo de captura |
| `resume()` | Antes de volver a entregar trozos tras una pausa o un fallo |
| `reconnect?()` | Grana la llama al reanudar con `engine` distinto de `ok`; rechaza con `{ kind }` |
| `finish()` | Cierra el provisional y **resuelve `{ audioDeleted: Boolean }` cuando no queda nada pendiente**; rechaza con `{ kind, audio }` |
| `abort()` | Descarta todo y borra el audio temporal; resuelve `{ audioDeleted: Boolean }` |
| `retrySegment?(segmentId)` | Vuelve a procesar un fragmento fallido cuyo audio guardó; el resultado llega como `final` con el mismo `id` |

### 4.4 Eventos (`ctx.emit(type, payload)`)

| `type` | `payload` | Efecto |
| --- | --- | --- |
| `partial` | `{ id, text, speaker? }` | Sustituye al provisional anterior (`transcript.partial`) |
| `final` | `{ id, text, speaker?, t0, t1, words?, confidence? }` | Confirma el fragmento; **mismo `id` que su provisional** (lo sustituye en su sitio). Un `final` de un fragmento fallido lo rellena (`failed: false`) |
| `pending` | `{ count }` | Fragmentos capturados sin texto final (`state.pending`) |
| `voice` | `{ speech: Boolean }` | Solo con `vad: true` |
| `connection` | `{ state: 'lost' \| 'retrying' \| 'restored', attempt? }` | `lost` → `reconnecting` (captura viva con `offlineBuffer`, retenida sin él); `restored` → captura, o `paused` si estaba retenida |
| `error` | `{ kind, fatal, segment?: { id, t0, t1 }, audio, retryable? }` | No fatal: entra en `issues` y el fragmento queda `failed`. Fatal: estado según §4.5 |
| `speakers` | `{ relabel }` | **Reservado F2** (diarización revisada); en F1 se ignora sin aviso |
| `level` | `{ value }` (0..1) | Solo con `input.format: 'self'` |
| `capture` | `{ state: 'live' \| 'ended' \| 'muted' }` | Solo con `self`: `live` habilita la captura; `ended` → `unavailable`; `muted` → `error` (`interrupted`) |

Un evento desconocido, o cualquier evento después de que `finish()`/`abort()` resolvieran, se ignora con aviso en desarrollo.

### 4.5 Errores tipados: las cuatro respuestas del brief

Objeto de error de la sesión (en `state.error`, `onError` y la composición de textos):

```ts
{
  kind: 'permission-denied' | 'no-device' | 'device-busy' | 'device-disconnected' | 'interrupted'   // los produce la captura de Grana
      | 'service-unavailable' | 'processing-failed' | 'storage-full'                             // los produce el adaptador
      | 'remote-not-allowed' | 'unsupported',                                                    // los produce Grana
  capture: 'continues' | 'paused' | 'stopped' | 'none',   // ¿la captura continúa?
  audio: 'none' | 'processing' | 'kept' | 'lost',         // ¿audio pendiente, guardado o perdido?
  recoverable: boolean,                                    // ¿se puede reintentar o reanudar?
  at: number,                                              // ms de audio capturado cuando ocurrió
  segment?: { id, t0, t1 }
}
```

La cuarta respuesta, **«lo transcrito se conserva»**, es **siempre sí** (vive en memoria del gestor hasta `close`/`discard`) y se dice (`labels.kept`) cuando hay fragmentos.

| `kind` | Estado | `recoverable` |
| --- | --- | --- |
| `permission-denied` | `denied` | sí (reintentar) |
| `no-device`, `device-busy`, `device-disconnected` | `unavailable` | sí |
| `unsupported` | `unavailable` (o `error` si viene de capacidades inválidas) | **no** |
| `interrupted` | `error` | sí (reanudar) |
| `service-unavailable` (fatal) | `error` | sí |
| `processing-failed` (fatal, p. ej. `finish` rechazada) | `error` | sí (finalizar otra vez) |
| `storage-full` (fatal) | `error`; la captura se **detiene**, lo pendiente se sigue procesando | sí |
| `remote-not-allowed` | `error`, **micrófono sin abrir** | **no** |

Un `processing-failed` **no fatal** no cambia de estado: se añade a `issues`.

### 4.6 Contrato del audio temporal (obligación de la aplicación; #209)

Grana no guarda audio. Si el adaptador declara `storesAudio` distinto de `'none'`, **la aplicación se compromete** a:

1. **Ubicación y cifrado:** en memoria, o en disco **cifrado en reposo** con clave efímera no exportable (p. ej. WebCrypto) que no sale de la sesión.
2. **Eliminación** al `finish()`, al `abort()` y al cerrar la aplicación; **limpieza de huérfanos** al arrancar.
3. **Confirmación:** `finish()`/`abort()` resuelven `audioDeleted: true` **solo** si el borrado se completó.
4. **Falta de espacio:** `error` `storage-full` fatal.
5. **Errores** con `audio: 'kept' | 'lost'` veraz.
6. **Por defecto el audio no se conserva tras finalizar** (regla del usuario, brief). Conservarlo (recuperación, escucha de fragmentos) queda fuera de v0.1 y, si entra, será opción explícita de la aplicación (#209, #210).

Grana lo documenta y lo refleja en la interfaz; no puede comprobarlo. El kit de pruebas de este contrato es F3.

### 4.7 Adaptador simulado (`@grana/vue/testing`)

`createSimulatedSpeechAdapter(options)`: el del prototipo de kiwi, para las pruebas de bruno y la documentación de mora-docs. Sin red. Emite provisional palabra a palabra y el confirmado tras una latencia; hablantes por guion; capacidades configurables (`location`, `diarization`, `offlineBuffer`, `storesAudio`, `partials`, `vad`); fallos inyectables por métodos de control (servicio caído con reintentos, fragmento fallido, sin espacio, `finish` que no confirma el borrado). Sus opciones y métodos de control los fija bruno en su `meta.json`; no forman parte del contrato del adaptador.

---

## 5. Privacidad (#208, #209, #218)

1. **Sin red en Grana.** El audio se entrega al adaptador en memoria; el transporte es del adaptador. Grana **no** escribe en `localStorage`, `sessionStorage`, IndexedDB, caché ni disco.
2. **Sin terceros por defecto.** Un adaptador con `location: 'remote'` sin `allowRemote: true` se rechaza: `error` `remote-not-allowed`, `recoverable: false`, **el micrófono no se abre** (ni `getUserMedia` ni `adapter.open`), aviso en desarrollo.
3. **Línea de privacidad siempre visible en el panel:** ubicación del procesamiento (`labels.privacy.<location>`, icono `lock` en `device`/`local`, `globe` en `remote`) + qué pasa con el audio (`labels.audio.<storesAudio>`).
4. **Eliminación solo con confirmación:** al terminar o descartar, «Audio temporal eliminado» (`labels.audio.deleted`) **solo** si `storesAudio !== 'none'` y el adaptador devolvió `audioDeleted: true`; si no lo devolvió, `labels.audio.notConfirmed` y aviso en desarrollo. Con `storesAudio: 'none'` se mantiene `labels.audio.none`.
5. **Micrófono abierto solo mientras captura:** `ready` no lo abre; la pausa detiene las pistas; los errores lo cierran.
6. **Avisos de desarrollo y `onError` sin contenido:** nunca incluyen texto transcrito.
7. **Consentimiento** (#207): opción de la aplicación (`requireConsent`), desactivada por defecto. Grana no guarda ni certifica el consentimiento: solo impide empezar la conversación sin la casilla marcada.

---

## 6. `GSpeechHost` (anfitrión; #213)

### 6.1 Props

| Prop | Tipo | Default | Regla |
| --- | --- | --- | --- |
| `speech` | Object (gestor) | el inyectado (`speechKey`) | Sin gestor: no pinta nada y avisa |

Sin eventos públicos ni slots en F1 (todo va por el gestor, como `GToaster`). **Dos `GSpeechHost` del mismo gestor:** la segunda no pinta nada y avisa.

### 6.2 Estructura

```html
<div class="g-speech-host" id="ID" popover="manual" data-edge="top" data-align="center">   <!-- + data-mobile, data-flipped, data-reduced-motion -->
  <div class="g-speech-host__live" role="status" aria-live="polite" aria-atomic="true"></div>
  <div class="g-speech-host__live" role="alert" aria-atomic="true"></div>
  <div class="g-speech-host__float g-surface g-surface--level-floating" hidden>               <!-- pill flotante de respaldo -->
    <div class="g-speech-pill" data-placement="floating" role="group" aria-label="…">…</div>  <!-- §7.2 -->
  </div>
  <div class="g-speech-panel g-surface g-surface--level-floating" id="ID-panel"
       role="dialog" aria-labelledby="ID-panel-title" hidden>…</div>                          <!-- §6.3 -->
  <dialog class="g-speech-sheet" aria-labelledby="ID-panel-title"></dialog>                    <!-- móvil: el panel se mueve aquí -->
</div>
```

- **Raíz `popover="manual"` abierta siempre** desde el montaje (`showPopover()`), capa superior como `GToaster` (#141), `GSelect` (#55) y `GHelper` (#101): ningún `overflow`, `z-index` ni cabecera fija la tapa. La raíz no captura el puntero; la pill flotante y el panel sí.
- **Canales vivos:** dos `g-speech-host__live` con el patrón de texto oculto accesible, **presentes y vacíos desde el montaje** y durante toda la vida del anfitrión (una región viva solo se anuncia si existe antes del cambio; #14, #137, #141). Son los **únicos que anuncian** algo de la captura: ni la pill, ni el panel, ni el disparador, ni la nota tienen `aria-live` propio. **Excepción aceptada (#227, como #149):** cada `GBtn` de la pill, el panel, el disparador y la nota trae su `g-btn__status` (`role="status"`, #14); los componentes de voz **nunca** ponen `loading` ni `loadingText` en sus `GBtn`, así que esas regiones quedan **vacías siempre** y no anuncian nada.
- **Pill flotante:** la misma pill de §7 con `data-placement="floating"`, dentro de una `GSurface level="floating"`.

### 6.3 Pill visible: la garantía del indicador

«RecordingIndicator» **no es un componente: es una garantía del anfitrión.** Mientras la sesión no esté en `idle` hay **exactamente una pill visible y operable**:

- la **colocada** (`GSpeechPill`) si está montada, se ve (`IntersectionObserver`, proporción ≥ 0,95), no está oculta y **no es inerte** (ni bajo `[inert]` ni fuera del `<dialog>` modal superior cuando lo hay);
- si no, la **flotante** del anfitrión.

La flotante va en `position` (por defecto **`top-center`**, lejos del `bottom-end` por defecto de `GToaster`) en escritorio y **abajo al centro** en móvil (alcance con una mano), con `max(margen, env(safe-area-inset-*))` + `offset`. Si **tapa el elemento enfocado** (fuera del anfitrión), pasa al **borde vertical contrario** (`data-flipped`) mientras siga así (WCAG 2.4.11, como `GToaster` #145). Con la sesión en `idle`, la flotante está `hidden` y la colocada también.

**No detectado** (límite conocido): una pill colocada tapada por otra capa de la aplicación sin salir del visor (el `IntersectionObserver` v1 no detecta oclusión).

### 6.4 Panel (escritorio)

**Diálogo no modal** (`role="dialog"`, `aria-labelledby`, sin `aria-modal`), dentro del anfitrión, **anclado a la pill visible**: debajo si cabe (o si hay más sitio que encima), si no encima; alineado al final de la pill y recortado al visor; alto máximo = sitio disponible. Bruno puede usar `utils/anchor.js` (`placeBlock`). Se reposiciona al cambiar la pill visible, al desplazar y al redimensionar. Ancho: el de coco (derivado de `space`).

Contenido en F1, en orden de lectura:

| Parte | Contenido |
| --- | --- |
| `__head` | Título `h2` (`labels.region`, `tabindex="-1"`); línea de modo (`labels.mode.dictation` / `labels.mode.conversation`); cerrar (`GBtn icon` con `x`, `labels.closePanel`) |
| `__status` | Icono del estado + texto largo (`labels.states.<status>.long`; en problema, el título del error) + duración (`role="timer"`, §7.3) |
| `__sub` | Datos secundarios en texto: intento de reconexión (`labels.attempt`), señal plana (`labels.signalFlat`), pendientes (`labels.pending` / `labels.pendingNone`) |
| `__privacy` | Línea de privacidad (§5.3) |
| `__activity` | Onda (`aria-hidden`) + «Ocultar actividad» (`GBtn` con `aria-pressed`, §12) |
| `__setup` (solo `ready`) | Participantes previstos (`GSelect`, `labels.expectedSpeakers`; hasta que exista `GRadioGroup`, como #181); aviso sin diarización (`labels.noDiarization`); con `requireConsent`, `GCheckbox` (`labels.consent.label`) y su mensaje si falta (`labels.consent.required`, como error del campo) |
| `__error` | Error en curso (título + texto compuesto, §9.3) y fallos no fatales (`issues`) |
| `__progress` (solo `processing`) | `GProgress` determinado (`labels.progress`) |
| `__controls` | Acciones según estado (tabla abajo); confirmación en línea de descarte |
| `__transcript` | Título `h3` (`labels.transcript.title`) y lista de solo lectura (§6.5) |

| Estado | Acciones (en este orden) |
| --- | --- |
| `requesting` | Cancelar |
| `ready` | Empezar a grabar (`mic`) · Cancelar |
| captura | Pausar (`pause`) · **Finalizar** (`square` relleno; principal) · Descartar |
| `reconnecting` | Pausar (solo con captura viva) · Finalizar · Descartar |
| `paused` | Reanudar (`mic`) · Finalizar · Descartar |
| `denied` · `unavailable` · `error` | Reanudar (`mic`, si hay algo capturado) o Reintentar (`rotate-ccw`), solo si `recoverable` · con algo capturado: Finalizar · Descartar; sin nada: Cerrar (`dismiss`) |
| `processing` | ninguna |
| `completed` | **Cerrar sesión** (`circle-check`; principal) · Descartar |

Descartar y su confirmación van **sin icono** en F1 (`trash` queda reservado a F2). Botones: `GBtn` con las props de §13.1 (fijadas por coco).

**Marcado del panel que el CSS necesita** (#229):
- La raíz `.g-speech-panel` lleva los mismos `data-status`, `is-live` e `is-problem` que la pill.
- En `__sub`, la línea de señal plana lleva `is-warning`.
- En `__error`, el **mensaje fatal** es el hijo que **no** es `__issue`: su **primer hijo es el título** (icono `circle-alert` + título del error) y después el texto compuesto (§9.3). Cada fallo no fatal es un `__issue`.
- `__status-icon` lleva `is-spinning` en `processing` (como el icono de la pill).
- La duración del panel (`__time`, `role="timer"`) lleva su prefijo oculto en `g-speech-panel__sr`.
- Posición: `--_speech-x` y `--_speech-y` (coordenadas **físicas** `left`/`top`, las que devuelve `placeBlock` de `utils/anchor.js`) y `--_speech-max-block` (alto disponible), en línea en el panel. Con zoom alto el panel entero se desplaza dentro de ese alto.
- `__confirm` puede ser parte del panel o ir dentro de `__controls` (ocupa su fila).
- `hidden` en `__time`, `__toggle`, `__finish`, `g-speech-meter`, `g-speech-wave`, la envoltura flotante y el panel cuando no proceden (el CSS lo respeta).

**Cierre ligero:** un `pointerdown` fuera del panel, de la pill y de los disparadores cierra el panel **sin mover el foco**. Tab no está atrapado (no modal).

### 6.5 Transcript en el panel (F1, solo lectura)

`<ol class="g-speech-transcript" aria-labelledby="…">`, un `li` por fragmento en orden de `t0`:

- **Confirmado** `g-speech-segment`: hora (`<time>`, `mm:ss`), en conversación el hablante del motor (`labels.speaker` con `{letter}`, o `labels.unassigned`) y el texto.
- **Provisional** (uno solo, al final) `g-speech-segment is-partial`: etiqueta visible `labels.transcript.partialFlag`, prefijo oculto `labels.transcript.partialPrefix`, texto **más claro y en cursiva (coco) pero ≥ 4.5:1**. El `final` con el mismo `id` lo sustituye **en su sitio**.
- **Fallido** `g-speech-segment is-failed`: intervalo, `labels.transcript.failed` (icono `triangle-alert`) y «Reintentar fragmento» (`labels.actions.retrySegment`) si `retryable`; si no, `labels.transcript.failedLost`.
- Vacío: **un `<p>`** con `labels.transcript.empty` dentro de `__transcript`, en lugar de la lista vacía (#229).
- La lista es su **propio contenedor de desplazamiento**: `tabindex="0"` para llegar con el teclado y desplazarla (WCAG 2.1.1; nombre por `aria-labelledby` al título).
- La lista se desplaza sola al final **solo** si ya estaba al final.
- **Rendimiento:** el texto confirmado no se reescribe si no cambió (lista con clave; no se rehace el DOM a cada provisional).

### 6.6 Hoja móvil y traslado al modal

- **Móvil:** visor de ancho < `--g-space-1 × 130` (umbral de `GDialog`, #103; **medido**, excepción vigente #42/#56/#103), `data-mobile` en la raíz. El panel se mueve dentro de `g-speech-sheet` (`<dialog>` **modal**, `showModal()`), hoja inferior con alto máximo ~88 % del visor dinámico y `safe-area-inset-bottom` (coco). Esc o `cancel` del `<dialog>` → `preventDefault()` y cerrar el panel por la misma vía. Al **cruzar el umbral** con el panel abierto, se reabre en la otra forma con el foco en el título.
- **Traslado al modal superior** (#141): con un `<dialog>` modal abierto **que no sea la hoja del propio anfitrión**, la raíz se traslada a él (mismos nodos, sin remontar: los canales vivos siguen existiendo) y vuelve a `showPopover()`; al cerrarse vuelve a `body`. Con el modal abierto, la pill colocada queda inerte → se muestra la **flotante, dentro del modal y operable**; el panel se abre dentro del modal y por encima. La sesión no se entera del traslado.
- **Útil compartido (bruno):** extraer el seguimiento del modal superior de `GToaster` (`MutationObserver` filtrado a `open` + pila de `:modal`) a **`utils/topModal.js`** y usarlo en ambos, con un predicado para **ignorar los `<dialog>` propios** (la hoja). Es interno, no API.

### 6.7 Borde compartido con `GToaster` (#225)

Regla: **la pill flotante, persistente, conserva su borde; los avisos, transitorios, se apilan por dentro de ella.** Mientras la pill flotante esté visible, el anfitrión **reserva** en su borde efectivo (`top` o `bottom`) su alto más su margen; un `GToaster` montado cuyo borde efectivo coincida **suma esa reserva** a su `offset` de ese borde (bruno la escribe en las variables en línea existentes `--_toaster-offset-top`/`--_toaster-offset-bottom` como `calc(offset + reserva)`: **`GToast.css` no cambia**). Aplica en móvil (ambos abajo: los avisos quedan encima de la pill) y en escritorio si la aplicación pone los avisos en el borde de la pill.

- **Mecanismo interno** (bruno): un registro de reservas **por documento** (el visor es compartido aunque haya varias aplicaciones), solo en el cliente y solo con los componentes montados (`utils/edgeReserve.js` o el nombre que elija). **No es API pública** ni opción de ninguno de los dos servicios.
- La pill nunca se mueve por los avisos; los avisos nunca tapan la pill (el indicador es garantía, §6.3). El cambio de borde por foco (`data-flipped`) de cada uno usa el borde **efectivo**.
- Los dos servicios conservan sus canales vivos propios (dos pares en la página; cada uno anuncia lo suyo) y sus atajos (**F8** avisos, **Mayús+F8** voz).

---

## 7. `GSpeechPill` (pill colocable; #212)

### 7.1 Props

| Prop | Tipo | Default | Regla |
| --- | --- | --- | --- |
| `speech` | Object (gestor) | el inyectado | Sin gestor: no pinta nada y avisa |

Opcional: sin ella, solo existe la flotante. **Una por gestor**: una segunda `GSpeechPill` montada no pinta nada y avisa. Con la sesión en `idle`, la raíz existe con `hidden` (el anfitrión la observa en cuanto se muestra). Sin eventos ni slots.

### 7.2 Estructura (compartida por la colocada y la flotante)

```html
<div class="g-speech-pill g-speech-pill--status-listening is-live" data-placement="placed" data-status="listening"
     role="group" aria-label="Grabación de voz">                                  <!-- labels.region -->
  <button class="g-btn … g-speech-pill__main" type="button"
          aria-expanded="false" aria-controls="HOSTID-panel" aria-keyshortcuts="Shift+F8">
    <span class="g-speech-pill__icon" aria-hidden="true"><svg class="g-icon">…</svg></span>
    <span class="g-speech-pill__text">Grabando</span>                          <!-- labels.states.<status>.short -->
    <span class="g-speech-pill__sr">, abrir panel</span>                       <!-- texto oculto: labels.openPanel -->
    <span class="g-speech-meter" aria-hidden="true"><i class="g-speech-meter__bar"></i>…</span>   <!-- 4 barras; solo con captura viva -->
    <span class="g-speech-pill__chevron" aria-hidden="true"><svg class="g-icon">chevron-down</svg></span>
  </button>
  <span class="g-speech-pill__time" role="timer"><span class="g-speech-pill__sr">Duración: </span>00:42</span>
  <button class="g-btn g-btn--icon … g-speech-pill__toggle" type="button" aria-label="Pausar">…</button>
  <button class="g-btn g-btn--icon … g-speech-pill__finish" type="button" aria-label="Finalizar">…</button>
</div>
```

### 7.3 Reglas

- **Principal** (`GBtn`): nombre = texto corto del estado + `labels.openPanel` oculto; `aria-expanded` = panel abierto; `aria-controls` = panel; `aria-keyshortcuts` = `hotkey` (sin atributo con `hotkey: false`). Abre o cierra el panel.
- **Duración** `role="timer"` (vivo desactivado por defecto) con prefijo oculto `labels.duration`, formato `mm:ss` (`h:mm:ss` desde una hora). Oculta en `requesting` y `ready`. Es **esencial** (brief: «cuánto lleva»): no la oculta «Ocultar actividad».
- **Alternar** (`GBtn icon`): **el mismo botón** cambia de nombre e icono — `labels.actions.pause` (`pause`) con captura viva; `labels.actions.resume` (`mic`) en `paused` o en error recuperable con algo capturado; `labels.actions.retry` (`rotate-ccw`) en error recuperable sin nada capturado; oculto en el resto. El anuncio confirma el cambio.
- **Finalizar** (`GBtn icon`, `square` relleno, `labels.actions.finish`): visible con captura, en `paused`, en `reconnecting` y en error con algo capturado.
- **Medidor:** 4 barras con el nivel (`--_speech-bar` en línea, 0..1); oculto sin captura viva o con `activityHidden`; con movimiento reducido, discreto (§12).
- **Texto `reconnecting` con captura viva:** `labels.states.reconnecting.shortLive` («Reconectando · grabando»).

---

## 8. `GSpeechTrigger` (disparador; #212, #222)

### 8.1 Props

| Prop | Tipo | Valores | Default | Regla |
| --- | --- | --- | --- | --- |
| `mode` | String | `dictation` `conversation` | `dictation` | Validador con la lista |
| `for` | String | `id` de un `<textarea>` o un `<input>` de tipo `text`, `search`, `url` o `tel` | sin valor | **Obligatorio en dictado** (aviso si falta). Otros tipos (incluido `password`, por privacidad, y `email`/`number`, que no admiten `setRangeText`): aviso y no inicia sesión |
| `targetLabel` | String | texto de la app | el nombre visible del campo (`el.labels[0]` al iniciar) | Rellena `{target}` (nombre del disparador, modo, anuncios). Si no se puede resolver: aviso y `{target}` vacío |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | El del `GBtn` (`api.md`) |
| `density` | String | `default` `comfortable` `compact` | `default` | Ídem |
| `disabled` | Boolean | | `false` | `disabled` nativo |
| `speech` | Object (gestor) | | el inyectado | |

Sin eventos públicos ni slots (todo va por el gestor).

### 8.2 Estructura y comportamiento

```html
<div class="g-speech-trigger g-speech-trigger--mode-dictation" data-status="idle">                  <!-- raíz <div> (#229) -->
  <button class="g-btn g-btn--icon … g-speech-trigger__btn" type="button"
          aria-label="Dictar en Observaciones" aria-pressed="false">                 <!-- + aria-disabled y aria-describedby si hay otra sesión -->
    <svg class="g-icon" aria-hidden="true">mic</svg>
  </button>
  <span class="g-speech-trigger__busy" id="ID-busy" hidden>…</span>                 <!-- texto oculto: labels.trigger.busy, solo con otra sesión -->
  <p class="g-speech-trigger__note" id="ID-note">                                   <!-- solo dictado; sin contenido: hidden (§8.4) -->
    <span class="g-speech-trigger__sr">Texto provisional: </span><span class="g-speech-trigger__note-text">…</span>
  </p>
</div>
```

**Dictado** (botón conmutable de **solo icono**): nombre fijo `labels.trigger.dictate` con `{target}` (el nombre no cambia; cambia `aria-pressed`, patrón APG). `aria-pressed="true"` mientras la sesión es suya y no está `completed`. Icono: `mic` sin sesión; el del estado con su sesión.

| Estado de **su** sesión | Pulsar |
| --- | --- |
| sin sesión | `start({ mode: 'dictation', target })` |
| `requesting` | `cancel()` |
| captura, `paused`, `reconnecting` | `finish()` |
| `denied`, `unavailable`, `error` | `resume()` |
| `processing`, `completed` | abre el panel |

**Conversación** (botón con texto): `labels.trigger.conversation` con `mic` sin sesión → `prepare()` y, en `ready`, abre el panel con el foco en su título; con **su** sesión, `labels.trigger.view` con el icono del estado → abre el panel. No es conmutable (sin `aria-pressed`).

**Con otra sesión activa** (cualquier modo, otro campo): `aria-disabled="true"` (sigue enfocable), `aria-describedby` → `__busy` (`labels.trigger.busy`, p. ej. «Hay una grabación en curso. Mayús+F8 para ir a ella.»). Pulsar **no crea otra sesión**: anuncia `labels.announce.busy` (cortés) y **lleva el foco a la pill visible**. Volver a la pestaña o paso donde se inició **no crea sesión nueva**: el disparador se reconoce por `mode` (+ `for` en dictado).

El disparador **no lleva la sesión**: si se desmonta (otra pestaña, un paso con `v-if`), la sesión sigue.

**Colocación** (#212): el disparador es un **hermano del campo**, inmediatamente **después** de él (la nota queda bajo la caja). No cabe en el hueco `append` de `GInput` (decorativo, `aria-hidden`), `GTextarea` no tiene huecos de acción y el slot `label` no admite interactivos; tampoco es una parte de `GInputGroup` (solo admite sus cuatro piezas). Sin API nueva en los campos en F1 (§18).

### 8.3 Inserción al cursor (dictado en vivo)

- **Solo el texto confirmado** entra en el campo; el provisional **no toca el valor** (se ve en la nota y en el panel).
- **Punto de inserción:** si el campo tiene el foco, su cursor o selección actuales; si no, el cursor o selección que tenía **al empezar** el dictado, avanzando tras cada inserción. Si al empezar había una **selección**, el primer texto la **sustituye** (como escribir).
- `el.setRangeText(texto, inicio, fin, foco ? 'end' : 'preserve')` + evento `input` que burbujea (sirve a `v-model` de `GTextarea`/`GInput` y a cualquier campo nativo). **Sin mover el foco** (verificado: el foco sigue en el disparador).
- **Separador:** un espacio delante si el carácter anterior no es espacio en blanco y no es el inicio.
- El campo se busca por `id` **en cada inserción** (puede haberse desmontado y vuelto a montar).

### 8.4 Campo desmontado: orden y fragmentos sin insertar

- Si el campo no está en el documento al llegar un `final`, el fragmento **no se inserta a ciegas**: queda **sin insertar**. Desde ese momento **todos los siguientes** también esperan, para **conservar el orden**.
- Al volver el campo, la nota dice `labels.note.notInserted` (`{count}`) con «Insertar» (`labels.note.insert`, `GBtn` de texto sin icono): inserta en orden, en el cursor del campo si tiene el foco o **al final** si no.
- Un dictado con fragmentos sin insertar **no se cierra solo** al completarse; se cierra tras insertarlos.

### 8.5 Deshacer propio

- El Ctrl+Z nativo **no** deshace `setRangeText` (no entra en la pila de deshacer del navegador; `execCommand('insertText')` sí, pero exige mover el foco). Por eso Grana guarda un **registro propio** de las inserciones del último dictado de cada campo (posición, texto insertado y texto sustituido).
- **Válido mientras el campo no cambie:** cualquier `input` en ese campo que no venga de una inserción de Grana lo invalida. También lo invalidan un dictado nuevo en ese campo y `discard()`.
- La nota muestra, tras completarse el dictado, `labels.note.inserted` con «Deshacer dictado» (`labels.note.undo`, `GBtn` de texto sin icono). Deshacer revierte en orden inverso, emite `input`, anuncia `labels.announce.undone` y **devuelve el foco al campo**. Si el campo cambió, no toca nada y anuncia `labels.announce.undoFailed`.

### 8.6 La nota

`g-speech-trigger__note` (solo dictado; **no es región viva**; sin contenido, `hidden`): provisional en curso (prefijo oculto `labels.note.partialPrefix`, texto más claro, ≥ 4.5:1), fragmentos sin insertar con «Insertar», o «Dictado insertado» con «Deshacer dictado». No usa el `hint` del campo (tiene su propio uso).

---

## 9. Textos (`labels`, sin valores por defecto; #226)

Marcadores con `utils/template.js` (`fill`). Las claves marcadas «plural» admiten **String** con `{count}` o **Function** `(count) => String` (plurales del idioma; como `counterText`, #51, y `GErrorSummary`). Falta una clave: **aviso en desarrollo la primera vez que se necesita**; los botones con icono **se dibujan igual** (la salida es obligatoria), los textos quedan vacíos.

### 9.1 Generales, pill, panel y disparador

| Clave | Marcadores | Dónde |
| --- | --- | --- |
| `region` | | Nombre del grupo de la pill y título del panel («Grabación de voz») |
| `openPanel` | | Sufijo oculto del botón principal de la pill |
| `closePanel` | | `aria-label` del cierre del panel |
| `duration` | | Prefijo oculto de la duración |
| `actions.start` · `cancel` · `pause` · `resume` · `retry` · `finish` · `discard` · `discardConfirm` · `closeSession` · `dismiss` · `retrySegment` · `hideActivity` | | Botones |
| `actions.discardAsk` | | Pregunta de la confirmación de descarte |
| `states.<status>.short` · `states.<status>.long` | | Para los 12 estados distintos de `idle` |
| `states.requesting.longGranted` | | Texto largo si el permiso ya estaba concedido («Activando el micrófono») |
| `states.reconnecting.shortLive` · `states.reconnecting.longLive` | | Con la captura viva durante la reconexión |
| `mode.dictation` | `{target}` | Línea de modo del panel |
| `mode.conversation` | `{speakers}` | Ídem (`{speakers}` = la opción de participantes) |
| `expectedSpeakers.label` · `expectedSpeakers.options.1` · `.2` · `.many` | | Selector de `ready` |
| `noDiarization` | | Aviso de `ready` y del panel si el motor no distingue hablantes |
| `consent.label` · `consent.required` | | Casilla y mensaje (solo con `requireConsent`) |
| `speaker` | `{letter}` | Etiqueta neutra de hablante (A, B, C…) |
| `unassigned` | | Fragmento sin hablante |
| `attempt` | `{attempt}` | Intento de reconexión |
| `signalFlat` | | Señal plana (panel) |
| `pending` (plural) · `pendingNone` | `{count}` | Pendientes |
| `progress` | | Nombre de `GProgress` del procesamiento final |
| `privacy.device` · `privacy.local` · `privacy.remote` | | Línea de privacidad |
| `audio.none` · `audio.memory` · `audio.disk` · `audio.deleted` · `audio.notConfirmed` | | Destino y eliminación del audio |
| `transcript.title` · `transcript.empty` · `transcript.partialFlag` · `transcript.partialPrefix` · `transcript.failed` · `transcript.failedLost` | | Lista del panel |
| `trigger.dictate` | `{target}` | Nombre del disparador de dictado |
| `trigger.conversation` · `trigger.view` · `trigger.busy` | | Disparador de conversación; descripción con otra sesión |
| `note.partialPrefix` · `note.notInserted` (plural) · `note.insert` · `note.inserted` · `note.undo` | `{count}` | Nota del dictado |

### 9.2 Anuncios (`announce.*`)

`requesting` · `ready` · `startDictation` (`{target}`) · `startConversation` · `resumed` · `paused` · `processing` · `completedDictation` (`{target}`) · `completedConversation` (plural, `{count}`, `{time}`) · `reconnecting` · `reconnectingHeld` · `restored` · `restoredHeld` · `inserted` (`{target}`) · `undone` · `undoFailed` · `discarded` · `discardedUnconfirmed` · `closed` · `signalFlat` · `segmentFailed` · `busy` · `consentRequired`.

### 9.3 Errores (composición)

| Clave | Marcadores |
| --- | --- |
| `errors.<kind>.title` · `errors.<kind>.what` · `errors.<kind>.fix` (los 10 `kind` de §4.5) | `{at}` (`mm:ss`), `{range}` (`mm:ss–mm:ss`) |
| `capture.continues` · `capture.paused` · `capture.stopped` · `capture.none` | |
| `audioFate.processing` · `audioFate.kept` · `audioFate.lost` | |
| `kept` | |

Texto compuesto (panel y canal enérgico): **`title. what capture.<c> audioFate.<a> [kept] fix`**, omitiendo vacíos (`audio: 'none'` no añade nada; `kept` solo si hay fragmentos). Responde siempre a las cuatro preguntas del brief.

---

## 10. Anuncios (#219; WCAG 4.1.3)

Un solo par de canales en el anfitrión. Escritura como `GToaster`: se **vacía** el canal y se escribe en el siguiente ciclo (`ANNOUNCE.delay`), se vacía pasado `ANNOUNCE.clear`; si el anunciador de `GToaster` se puede compartir como útil interno, mejor (bruno). **Cola cortés** con separación entre textos; los cambios de estado se **agrupan** (`announceGroupMs`, gana el último); un anuncio enérgico **vacía la cola cortés**.

| Se anuncia | Canal |
| --- | --- |
| Espera de permiso (**solo si el navegador pregunta**), listo, inicio (dictado con `{target}` / conversación), pausa («el micrófono no está capturando»), reanudación, procesando, fin (conversación con número de fragmentos y duración; dictado con el campo), reconexión (dice si la grabación continúa), restablecimiento (con captura retenida: «sigue en pausa, pulsa Reanudar»), inserción (**agrupada**: una tras `insertAnnounceMs` sin nuevas; el fin del dictado la cancela), deshacer, descarte (con la eliminación del audio **solo si se confirmó**), cierre de sesión, señal plana, fragmento fallido, sesión ocupada, consentimiento pendiente | cortés |
| Entrada en `denied`, `unavailable` o `error`: el texto compuesto de §9.3 | enérgico |
| **Nunca:** provisionales, confirmados (ni palabra a palabra ni enteros), nivel, cambios entre `listening` ⇄ `speech` ⇄ `transcribing`, duración | — |

Verificado por kiwi: en una conversación con cambios de pestaña y paso, el inicio se anuncia **una** vez, ningún texto transcrito llega a los canales y hay ≤ 3 anuncios durante la captura.

---

## 11. Foco y teclado (#220)

| Tecla | Dónde | Acción |
| --- | --- | --- |
| `hotkey` (**Mayús+F8**) | Documento, sesión fuera de `idle`, foco **fuera** de la pill y del panel | Guarda el elemento enfocado y lleva el foco al **botón principal de la pill visible**. `preventDefault` |
| `hotkey` | Foco **dentro** de la pill o del panel | Devuelve el foco al guardado (si sigue conectado y no es inerte) |
| `hotkey` sin sesión | | **No se intercepta** |
| F8 sola | | **No se intercepta** (es de `GToaster`) |
| Esc | Foco en el panel | Cierra el panel con **`preventDefault()` + `stopPropagation()`** (no llega a `GDialog`, #143); en la hoja, el `cancel` se cancela y se cierra por la misma vía. **Esc nunca detiene ni descarta** |
| Enter / Espacio | Botones | Nativo |

- **Abrir el panel** → foco a su **título** (`tabindex="-1"`). **Cerrarlo** → a quien lo abrió (pill o disparador) si sigue conectado, visible y no inerte; si no, a la pill visible. El cierre ligero (§6.4) **no** mueve el foco.
- **Descartar** → confirmación en línea con el foco en «Cancelar»; cancelar → vuelve a «Descartar».
- **Al cerrar la sesión** con el foco en la pill o el panel (que desaparecen) → al disparador que la inició si sigue conectado; si no, a donde estaba antes del atajo; nunca se pierde en `body` si el anfitrión está en un modal.
- **Nada roba el foco por sí solo**: ni al confirmar texto, ni al insertar, ni al terminar el procesamiento, ni ante un error (el anuncio invita a abrir el panel).
- **Composición IME:** con `event.isComposing` no se trata ni el atajo ni Esc. Coincidencia del atajo como `GToaster` (`event.key` + modificadores exactos).
- Sin atajos de una sola tecla (2.1.4).

---

## 12. Movimiento y actividad (#221)

- **«Ocultar actividad»** (WCAG 2.2.2: la onda es contenido que se mueve más de 5 s en paralelo a otro): `GBtn` con `aria-pressed` en el panel (`labels.actions.hideActivity`); oculta la onda del panel y los medidores de la pill (`state.activityHidden`). El texto de estado y la duración siguen.
- **`prefers-reduced-motion: reduce`** (el anfitrión lo refleja en `data-reduced-motion`, porque cambia también el ritmo de pintado): medidor **discreto** (onda de 5 segmentos encendidos o apagados, sin historial que se desplaza; pill con barras encendidas o apagadas) a ≤ `reducedMotionHz`; **sin giro** del `loader-circle`; panel y pill sin desplazamiento (solo fundido).
- La duración se considera **esencial** y no se oculta.
- **Onda del panel:** historial del nivel en N barras (32 en el prototipo; coco puede pedir otro número) con `--_speech-bar` en línea; `aria-hidden`.

---

## 13. Tokens e iconos (#223, #224)

**Ningún token nuevo** (`tokens.md` §24; §17.6). Todo deriva de existentes:

| Necesidad | Fuente |
| --- | --- |
| Pill flotante y panel | `GSurface level="floating"` (`--g-shadow-2`, radio y borde de `floating`, #100) |
| **Énfasis del estado activo** (captura viva) | **La lámpara** (disco relleno detrás del icono de estado) en el rol **`active`** (`--g-color-active`, alias de `accent`; `tokens.md` §17.5, §17.23; `accent` señala, #6) con el icono en **`on-accent`** (par que el motor garantiza); tinte de la pill `--g-color-accent-soft`. **Los trazos no usan `active`** (#228): el borde vivo (doble de grosor) y el medidor van en **`--g-color-on-accent-soft`** (≥ 4.5:1 sobre `accent-soft` por derivación, §2) y la onda del panel, sobre la superficie, en **`--g-color-accent-text`** (≥ 4.5:1 sobre `surface`). En el tema por defecto los tres son el mismo azul. **Nunca `danger`**: grabar no es un error ni una acción destructiva (§17.7). El anillo de foco dentro de la pill es **interior** al botón y queda a ≥ 2px del borde vivo (coco) |
| Problema (`denied`, `unavailable`, `error`) | `--g-color-danger-text` (icono y texto) + señal de forma (kiwi: borde discontinuo) |
| Aviso (`reconnecting`, señal plana, fragmento fallido) | `--g-color-warning-text` |
| `completed` | `--g-color-success-text` |
| Provisional | Texto atenuado (`--g-color-text-muted` o el que elija coco) en cursiva, **≥ 4.5:1** |
| Texto | `--g-color-text`, `--g-color-text-muted`, `--g-font-ui`, roles `body-sm` y `caption` (`tokens.md` §23: título del panel `title-sm` como `GDialog` o `body`, lo decide coco con la regla de §23.4) |
| Foco | `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` |
| Movimiento | `--g-duration-*`, `--g-ease-*` |
| Separaciones, ancho del panel (kiwi: 440px ≈ `space × 110`), barras, márgenes | Derivados de `space` en el CSS de coco |
| Objetivos | Los de `GBtn` (≥ 24px; ≥ 44px con `pointer: coarse`) |

**Variables dinámicas en línea** (alias `--_*`, excepción justificada como `--_toaster-offset-*`): `--_speech-offset-top`, `--_speech-offset-bottom` (opción `offset`), `--_speech-bar` (nivel de cada barra, 0..1), `--_speech-x` y `--_speech-y` (posición física del panel, de `placeBlock`) y `--_speech-max-block` (alto disponible del panel). Con movimiento reducido, cada barra o segmento lleva además `data-on` (encendido o apagado).

**Iconos** (`icons.md` §4; #224): los de §2.1, §6.4 y §7 — nuevos en la librería: `mic`, `mic-off`, `pause`, `circle-pause`, `audio-lines`, `captions`, `shield-question-mark`, `refresh-cw`, `unplug`, `rotate-ccw`, `globe` (comprobados como canónicos en `lucide-static` 1.49.0); ya en la librería: `circle`, `square`, `loader-circle`, `circle-alert`, `circle-check`, `chevron-down`, `x`, `triangle-alert`, `lock`. **Reservados para F2** (no entran hasta que un componente los use): `text-cursor-input`, `undo-2`, `trash`, `pencil`, `copy`.

### 13.1 Composición de `GBtn` (fijada por coco, #229)

| Dónde | Props de `GBtn` |
| --- | --- |
| Pill: principal | `variant="ghost" color="neutral" size="sm"`; icono, texto, `__sr`, medidor y chevron en el slot por defecto (dentro de `g-btn__label`, que el CSS vuelve fila) |
| Pill: alternar · finalizar | `icon variant="ghost" color="neutral" size="sm"`; `pause` / `mic` / `rotate-ccw` · `square` relleno |
| Panel: cerrar | `icon variant="ghost" color="neutral" size="sm"`, `x` |
| Panel: acción principal (Empezar a grabar; Finalizar en captura, pausa o reconexión; Cerrar sesión; Reanudar o Reintentar en un problema) | `size="md"`, sólido por defecto (`color` por defecto de `GBtn`), icono en `prepend` |
| Panel: secundarias (Pausar; Reanudar en pausa; Cancelar; Finalizar en un problema) | `size="md" variant="outline" color="neutral"` (el CSS las pasa a `text` + `border-control`, como la acción de `GToast`) |
| Panel: Descartar · Cerrar (`dismiss`) | `size="md" variant="ghost" color="neutral"`, sin icono |
| Confirmación de descarte | Cancelar `variant="outline" color="neutral"` · Sí, descartar `variant="solid" color="danger"` (destructivo, §17.7), `size="md"` |
| Ocultar actividad | `size="sm" variant="ghost" color="neutral"` con `aria-pressed` |
| Reintentar fragmento · Insertar · Deshacer dictado | `size="sm" variant="outline" color="neutral"` |
| Disparador de dictado | `icon variant="ghost" color="neutral"` + `size`/`density` de sus props |
| Disparador de conversación | `variant="outline" color="neutral"`, icono en `prepend`, + `size`/`density` |
| `GProgress` del procesamiento | `color="neutral"` |

**Ningún `GBtn` de la captura usa `loading` ni `loadingText`** (#227): su `g-btn__status` queda vacío siempre.

**Medidas fijadas por coco** (constantes de `space`, no tokens; `estilo.md`): pill de 34px con `space` 4 (`GBtn sm` + relleno `space × 0.5` + borde), lámpara `space × 5`; panel `min(space × 110, 100vw − space × 8)`; margen de la flotante `space × 4` (`× 2` con `data-mobile`); onda de 32 barras (5 segmentos con movimiento reducido); hoja `88dvh`. Con una pill de menos de ~`space × 40` de ancho, la pill colocada desborda: la ranura de cabecera la dimensiona la aplicación.

---

## 14. Clases (contrato entre bruno y coco)

| Clase o atributo | Elemento | Cuándo |
| --- | --- | --- |
| `g-speech-host` | Raíz (`popover`) | Siempre |
| `data-edge="top\|bottom"`, `data-align="start\|center\|end"` | Raíz | **Siempre**; efectivos (móvil: `bottom`/`center`; `data-flipped`: borde invertido) |
| `data-mobile` · `data-flipped` · `data-reduced-motion` | Raíz | Visor < `space × 130` · la flotante tapaba el foco · movimiento reducido |
| `g-speech-host__live` | Canales | Siempre (2) |
| `g-speech-host__float` (+ clases de `GSurface floating`) | Envoltura de la flotante | `hidden` salvo §6.3 |
| `g-speech-pill` · `data-placement="placed\|floating"` · `data-status` · `g-speech-pill--status-<status>` | Pill | Siempre |
| `is-live` | Pill | Captura viva (también en `reconnecting` con captura) |
| `is-problem` | Pill | `denied`, `unavailable`, `error` |
| `g-speech-pill__main`, `__icon` (`.g-icon` hijo directo; `is-spinning` en `processing`), `__text`, `__sr`, `__chevron`, `__time`, `__toggle`, `__finish` | Partes | Según estado |
| `g-speech-meter`, `__bar` (`--_speech-bar`), `data-on` en cada barra con movimiento reducido | Medidor | Captura viva y sin `activityHidden` |
| `g-speech-panel` (+ `GSurface floating`), `__head`, `__title`, `__mode`, `__close`, `__status`, `__status-icon` (`is-spinning` en `processing`), `__status-text`, `__time`, `__sr`, `__sub` (la línea de señal plana con `is-warning`), `__privacy`, `__activity`, `__setup`, `__error` (mensaje fatal = hijo que no es `__issue`, título primero), `__issue`, `__progress`, `__controls`, `__confirm`, `__transcript` | Panel | Según §6.4 |
| `data-status`, `is-live`, `is-problem` | Panel | Como en la pill (#229) |
| `--_speech-x`, `--_speech-y`, `--_speech-max-block` | Panel (en línea) | Posición y alto disponible |
| `g-speech-wave`, `__bar` (`--_speech-bar`; `data-on` con movimiento reducido) | Onda | Sin `activityHidden` |
| `g-speech-sheet` | `<dialog>` de la hoja | Siempre en el DOM; abierto en móvil con el panel abierto |
| `g-speech-transcript` (`tabindex="0"`), `g-speech-segment`, `is-partial`, `is-failed`, `__meta`, `__time`, `__speaker`, `__flag`, `__text`, `__sr`; vacío: `<p>` dentro de `g-speech-panel__transcript` | Lista | §6.5 |
| `g-speech-trigger` (raíz `<div>`), `g-speech-trigger--mode-{dictation\|conversation}`, `data-status` (de su sesión, o `idle`), `is-busy` (otra sesión), `__btn`, `__busy`, `__note` (`<p>`; `is-partial` con provisional), `__note-text`, `__note-action`, `__sr` (prefijo oculto del provisional) | Disparador | Según §8 |
| `--_speech-offset-top`, `--_speech-offset-bottom` | Raíz (en línea) | Con `offset` |

---

## 15. Avisos de desarrollo

Con `typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'`, `console.warn` con prefijo `[Grana Speech]`, una vez por causa. **Nunca incluyen texto transcrito** ni datos del audio.

1. `createSpeech` sin `adapter`, o adaptador sin `open`/`capabilities`.
2. Capacidades inválidas (la sesión pasa a `error` `unsupported`).
3. `location: 'remote'` sin `allowRemote: true` (no se abre el micrófono).
4. **Intento de iniciar sin `GSpeechHost` montado** para ese gestor: no se abre el micrófono, el método devuelve `false`.
5. Dos `GSpeechHost` o dos `GSpeechPill` del mismo gestor (la segunda no pinta); `GSpeechHost`/`GSpeechPill`/`GSpeechTrigger` sin gestor; `useSpeech()` sin gestor (devuelve `undefined`).
6. `GSpeechTrigger` de dictado sin `for`, con un `for` que no existe al pulsar, o con un campo de tipo no admitido; `targetLabel` no resoluble.
7. Transición ilegal (nombra los dos estados).
8. `hotkey` `F6` o ilegible (rechazado, se conserva el anterior); `hotkey` `F8` (aceptado; choca con `GToaster` por defecto).
9. Adaptador `self` sin `capture { state: 'live' }` o sin eventos `level` (la sesión no pasa a captura o el vigilante la interrumpe).
10. `finish()`/`abort()` que no devuelven `audioDeleted` Boolean con `storesAudio` distinto de `'none'`.
11. `push` que lanza o rechaza; evento desconocido o posterior a `finish`/`abort`.
12. `begin()` con `requireConsent` sin consentimiento; `setConsent`/`setExpectedSpeakers` fuera de `ready`.
13. Falta un `labels.*` la primera vez que se necesita.
14. Valor fuera de lista u opción desconocida en `createSpeech`/`configure`; `adapter` cambiado fuera de `idle`.

En producción no hay avisos ni comprobaciones extra (las reglas de seguridad —no abrir el micrófono sin anfitrión, rechazar `remote`— **sí** se aplican en producción).

## 16. SSR

- **Importar `@grana/vue` y llamar a `createSpeech` no toca `document`, `window`, `navigator`, `matchMedia` ni `AudioContext`.** El gestor es estado puro y métodos.
- En el servidor `GSpeechHost` **no renderiza nada**; `GSpeechPill` renderiza su raíz `hidden`; `GSpeechTrigger` renderiza su botón en `idle` (sin leer el DOM). Sin desajuste de hidratación.
- Captura, observadores (`IntersectionObserver`, `MutationObserver`), escuchas de documento (atajo, `beforeunload`, `visibilitychange`, `resize`, `pointerdown`, `input` para el deshacer), Permissions API y `wakeLock` existen **solo** con `GSpeechHost` montado y una sesión iniciada, y se retiran al terminar o desmontar.
- Llamar a métodos en el servidor no falla: devuelven `false` sin efectos.

---

## 17. Verificación (qué y cómo)

- **bruno** (vitest + jsdom con el adaptador simulado y una captura simulada; **Playwright** en Chromium, Firefox y WebKit para capa superior, modal, foco, móvil y micrófono falso `--use-fake-device-for-media-stream`):
  - **API:** exportaciones (`createSpeech`, `useSpeech`, `speechKey`, `GSpeechHost`, `GSpeechTrigger`, `GSpeechPill`; `createSimulatedSpeechAdapter` solo en `@grana/vue/testing`); `app.use` provee; `useSpeech` sin gestor avisa y devuelve `undefined`; importación en entorno `node` sin `document`.
  - **Estados:** tabla de transiciones completa (cada legal pasa; una muestra de ilegales se rechaza con `false` y aviso); icono y texto por estado; facetas.
  - **Sin anfitrión no hay micrófono**; `remote` sin `allowRemote` → `error` sin `getUserMedia` ni `open`; capacidades inválidas → `unsupported`.
  - **Captura:** `ready` sin pista; pausa con pista **detenida** (`readyState: 'ended'`); vigilante: captura congelada → `error` `interrupted` en < 2,5 s y la pill deja de decir «Grabando»; señal plana; `ended`/`mute`; mapeo de errores de `getUserMedia`; nivel > 0 con el micrófono falso; PCM a la `sampleRate` pedida y `chunkMs`; codificado con `mimeType` admitido; `self`.
  - **Adaptador:** `partial` → `final` en su sitio; `pending`; `connection` con y sin `offlineBuffer` (captura viva frente a retenida; restablecido retenido → `paused`, no reanuda solo); `error` no fatal → `issues` + «Reintentar fragmento»; fatal → estado y cuatro respuestas; `storage-full`; `push` que lanza.
  - **Finalización:** los 6 pasos en orden; `processing` sin acciones de cierre; `discard()` rechazado en `processing`; `finish` rechazada → `error`; `audioDeleted` confirmado frente a no confirmado (texto y aviso); dictado que se cierra solo; conversación que espera a `close()` → `onComplete` con `toJSON()` sin `partial`.
  - **Anfitrión:** raíz `popover` abierta y 2 canales **antes** de la primera sesión y durante ella; **ninguna otra región viva con contenido** en toda una sesión (las `g-btn__status` de los `GBtn` de la captura existen y siguen **vacías** de principio a fin, #227); garantía de una pill (colocada visible → flotante oculta; colocada fuera del visor o inerte → flotante); `data-flipped` con un campo enfocado bajo la flotante; traslado a un **`GDialog` real** (flotante operable, panel dentro, Esc del panel no cierra el diálogo, vuelta a `body`); la hoja propia no dispara el traslado; móvil bajo `space × 130` (hoja, foco al título, Esc, reapertura al cruzar el umbral); `topModal.js` compartido con `GToaster` sin romper sus pruebas.
  - **Disparador:** dictado conmutable (`aria-pressed`, nombre fijo); conversación (`prepare` → panel); otra sesión → `aria-disabled`, descripción, anuncio y foco a la pill, **sin** sesión nueva; el disparador se desmonta y la sesión sigue (misma `sessionId`).
  - **Dictado:** inserción del confirmado en el cursor sin mover el foco; sustitución de la selección inicial; provisional fuera del valor; `v-model` actualizado; campo desmontado → orden conservado y «Insertar»; deshacer (válido, invalidado por edición, foco al campo); tipos de campo no admitidos.
  - **Anuncios:** textos y canales de §10; nada transcrito en los canales; agrupación de estados e inserciones.
  - **Teclado y foco:** Mayús+F8 ida y vuelta; F8 sola no interceptada; sin sesión no se intercepta; Esc con `defaultPrevented` y sin propagarse; foco al abrir y cerrar; IME.
  - **Borde compartido:** con `GToaster` montado en móvil, los avisos quedan encima de la pill flotante (reserva sumada a `--_toaster-offset-bottom`) y la pill no se mueve.
  - **Movimiento:** «Ocultar actividad»; `reducedMotion: 'reduce'` → medidor discreto, sin giro.
  - **Avisos de desarrollo** de §15 y **SSR** (render en servidor sin errores ni markup del anfitrión).
  - `check-icons.mjs`, prueba 9 de `icons.md` §7 (nombres canónicos) y `levels.test.js` sin infracciones.
- **coco** (auditoría con un tema distinto al de defecto, claro y oscuro): texto 4.5:1 (provisional incluido) y bordes, iconos y medidores 3:1 sobre `floating` y sobre la cabecera de la app; estado activo reconocible sin color y distinto del anillo de foco; problema distinguible en escala de grises; `forced-colors` (bordes y barras visibles); `prefers-contrast: more`; objetivos 24/44px en pill, panel, disparador y nota; foco visible dentro de la capa superior y de la hoja; movimiento reducido; 320×640 sin desbordamiento (página y hoja) con pill de cabecera y flotante dentro del visor; RTL; zoom 200 %.
- **No verificado y pendiente:** **lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): cola cortés y `alert`, cambio de nombre de pausar/reanudar con el foco encima, `role="timer"`, traslado de canales al modal, descripción de «grabación en curso», que las `g-btn__status` vacías de los `GBtn` (#227) no añaden ruido al recorrer (**riesgo principal**); **Safari**: si reanudar tras detener las pistas vuelve a pedir permiso (la reanudación pasa por `requesting` y lo anuncia, así que el contrato no cambia), Permissions API de `microphone`, `MediaRecorder` y sus formatos, `wakeLock`; **motores reales** (Whisper, whisper.cpp, faster-whisper, pyannote) y la entrega PCM real a 16 kHz; **móvil real** (llamada entrante, segundo plano en iOS/Android, `safe-area`, teclado virtual con la hoja, orientación); permiso revocado a mitad de sesión; varios modales apilados; pill colocada tapada por otra capa; sesiones de una hora o más (memoria, deriva del reloj); `beforeunload` en cada navegador; las constantes de §3.7 con usuarios.

---

## 18. Fases siguientes (reservado; no forma parte de este contrato)

| Fase | Contenido | Nombres reservados |
| --- | --- | --- |
| **F2 — Revisión y destino** | `GTranscript` público (ve y edita **cualquier** transcript, también uno guardado; dentro del panel lo usa el anfitrión): corregido, eliminar/restaurar (borrado lógico), reasignar hablante (no toca `engineSpeaker`), roles por hablante (lista de la app, sin valores por defecto), selección, copiar, **destinos registrados** (`{ id, label, insert(text) → { undo() } }`, funcionan aunque el campo esté en otra pestaña) con inserción del corregido y deshacer, capa `derived` **solo como datos** (#211), evento `speakers.relabel` del adaptador, slots de contenido del panel | `GTranscript`, `createTranscript(data)`, `speech.targets.register()`, opción `roles`, operaciones `edit` `revert` `remove` `restore` `assignSpeaker` `setRole` `compose`; iconos `text-cursor-input`, `undo-2`, `trash`, `pencil`, `copy` |
| **F3 — Robustez de producto** | Recuperación tras cerrar la aplicación (**opcional por app**, #210; audio y transcript cifrados en disco), kit de pruebas del contrato de audio temporal, selección de dispositivo (`enumerateDevices`, `devicechange`), captura `self` para envoltorios nativos y segundo plano, transcript a pantalla completa en móvil, sesiones de horas (lista virtualizada) | opción `recovery` |
| Fuera de v0.1 | **Escuchar el audio de un fragmento** durante la revisión (#209: exigiría conservar el audio; si entra, ligado a `storesAudio` y con borrado al cerrar); interfaz propia para el contenido derivado (#211); un hueco de acción interactivo en `GTextarea`/`GInput` para colocar el disparador dentro de la caja (cambio de los contratos de campo; se decide con su ronda) | — |

## 19. Preguntas de producto abiertas

**Ninguna.** Las cinco de kiwi (§15 de la declaración) las resolvió el usuario por delegación (#207 a #211); el resto de propuestas de kiwi derivan de estándar o de contratos vigentes (#212 a #226).
