# Contrato · Captura de voz · Fases 1 y 2 (gestor `createSpeech`, anfitrión `GSpeechHost`, `GSpeechTrigger`, `GSpeechPill`; F2: modelo `createTranscript`, `GTranscript`, destinos `useSpeechTarget`)

**Dueño:** lima · **Estado:** Fase 1 aprobada y auditada (auditoría de coco, commit 93f40d9) · **Fase 2 aprobada en contrato** (§20 a §32, DECISIONS #241 a #256; CSS de coco reconciliado, commit f3ee87c, `GTranscript.css` y bloque F2 de `GSpeechHost.css`, `design/lab/speech/estilo.md` «Fase 2», 43 853/43 853 en los tres motores: #257 a #261; construido por bruno, commits 7514a2a..55aba85, `GTranscript.meta.json` y `GSpeechHost.meta.json`, reconciliado aquí: #262 a #264; basada en `design/lab/speech/r02/`: kiwi, commit cd406d8; `declaracion.md` con 20 puntos, `index.html`, `verificar.mjs` 123/123 en Chromium), pendiente de la auditoría de coco · **F1:** CSS entregado por coco (commit a70f366; `GSpeechPill.css`, `GSpeechHost.css`, `GSpeechTrigger.css`; `design/lab/speech/estilo.md`, 47 070/47 070 en los tres motores) y reconciliado aquí (#227 a #229) · construido por bruno (commits 53537f7..832286c; `GSpeechHost.meta.json`, `GSpeechPill.meta.json`, `GSpeechTrigger.meta.json`, `status: draft`) y reconciliado aquí (#230 a #238) · pendiente: entrada separada `@grana/vue/speech` (#238, bruno) y auditoría de coco · **Basado en:** `design/lab/speech/r01/` (kiwi, commit c0e9edb; `brief.md` del usuario, `declaracion.md` con 15 puntos, `index.html` con la sesión, el anfitrión y el adaptador simulados, `verificar.mjs` 115/115 en Chromium) · **Compone:** `btn.md`, `surface.md` (`level="floating"`), `GProgress` (`widget.md`), `select.md`, `checkbox.md`, `GIcon` (`icons.md`) · **Patrón:** `toast.md` (servicio imperativo con región persistente; #140, #141, #143, #145) · **Convive con:** `toast.md` (borde compartido, §6.7), `dialog.md` (traslado al modal superior y Esc)
**Tags:** `g-speech-host` (anfitrión) · `g-speech-pill` (pill colocable) · `g-speech-trigger` (disparador) · `g-transcript` (revisión, F2) · **Categoría:** comunicación y estado (entrada de datos por voz)

Un **sistema de captura de voz y transcripción** pensado para información sensible: una **sesión compartida por aplicación** que sobrevive a cambios de pestaña, paso, acordeón o diálogo; un **indicador siempre visible** mientras el micrófono está en uso; transcripción **provisional y confirmada**; dictado directo a un campo y conversaciones largas con varios hablantes. **Grana no conoce el motor ni hace red:** la aplicación aporta un **adaptador** (Whisper, whisper.cpp, faster-whisper, diarización local…) y Grana pone la captura, el estado, la interfaz y la accesibilidad.

Decisiones del usuario delegadas («decide tú» sobre las recomendaciones de kiwi): DECISIONS.md **#207 a #211**; regla del usuario fijada en el brief («el audio no se conserva tras finalizar»): **#209**. Propuestas de kiwi aprobadas por derivar de estándar o de contratos vigentes: **#212 a #226**. **Fase 2:** decisión del usuario delegada **#241** (sin marca de «revisado»); propuestas de kiwi de la r02 aprobadas por derivar de estándar, con los nombres y tipos fijados por lima: **#242 a #256**.

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
| Editar, reasignar hablantes, insertar en varios campos | No es el panel de la F1 (solo lectura) | `GTranscript` y destinos registrados (Fase 2, §22 y §24) |
| Tabla de datos con selección | `GTranscript` no es una tabla: necesita edición en la celda y una parada de tabulación (#244) | `GTable` |
| Error de un campo | Va junto al campo | Mensajes de `GInput`/`GTextarea` |

## Fases (alcance de este contrato)

| Fase | Contenido | Estado |
| --- | --- | --- |
| **F1 — Captura fiable y dictado** | Gestor + plugin + `useSpeech`; interfaz completa del adaptador y adaptador simulado; `GSpeechHost` (canales, pill flotante, panel, hoja, traslado al modal); `GSpeechTrigger` (dictado y conversación); `GSpeechPill`; los 13 estados y sus transiciones; nivel real; pausa, reanudación y finalización en 6 pasos; errores con sus cuatro respuestas; anuncios; dictado al cursor con deshacer propio; transcript de **solo lectura** en el panel (provisional frente a confirmado, hablante del motor); línea de privacidad; consentimiento opcional | **Este contrato** |
| **F2 — Revisión y destino** | Modelo `createTranscript` con capas e historial; `GTranscript` (rejilla editable, solo selección, solo lectura, compacta); hablantes y roles; destinos ligados al modelo con deshacer; capa `derived` con los usos; revisión en la página o en el diálogo de respaldo del anfitrión | **Este contrato, §20 a §32** |
| F3 — Robustez de producto | Recuperación tras cierre (opcional), kit de pruebas del audio temporal, selección de dispositivo, captura nativa y en segundo plano, transcript a pantalla completa en móvil, sesiones de horas | Reservado (§18) |

---

## 1. Entrega (API pública)

**Entrada propia `@grana/vue/speech`** (#238): la captura de voz **no** viaja en `@grana/vue` (quien no la usa no la paga: +27,5 KB gzip, +22 % de `dist/grana.js`, medido por bruno). Exportaciones de `@grana/vue/speech`:

| Exportación | Qué es |
| --- | --- |
| `createSpeech(options)` | Crea el **gestor de captura** de la aplicación (objeto con estado reactivo de solo lectura y métodos). También es **plugin de Vue**: `app.use(speech)` lo provee a toda la app **y registra globalmente** `GSpeechHost`, `GSpeechPill` y `GSpeechTrigger` (`<g-speech-host>`…) si no lo estaban (el `install` de Grana ya no los registra) |
| `useSpeech()` | Devuelve el gestor provisto (en `setup` o en un componente montado bajo la app). Sin gestor: aviso en desarrollo y `undefined` |
| `speechKey` | Clave de inyección (`InjectionKey`) para `provide` manual (pruebas, microfrontends) |
| `GSpeechHost` | Anfitrión: canales vivos, pill flotante de respaldo, panel y hoja móvil. Se monta **una vez**, lo más alto posible |
| `GSpeechTrigger` | Disparador: dictado a un campo o conversación |
| `GSpeechPill` | Pill **colocable** (cabecera, barra de herramientas). Opcional |
| `GTranscript` (F2) | Vista de revisión de un transcript: rejilla editable, solo selección, solo lectura o compacta (§22). `app.use(speech)` también la registra (`<g-transcript>`); suelta, se importa como cualquier componente (#251) |
| `createTranscript(data?)` (F2) | Crea un **modelo de transcript** (§21): el de la sesión (`speech.state.transcript`) es una instancia; con `data` (lo que guardó la aplicación con `toJSON()`) carga uno sin sesión (§25.4) |
| `useSpeechTarget(target, options?)` (F2) | Registra un **destino** (§24) en el gestor mientras viva el componente que lo llama |

**Entrada de pruebas** `@grana/vue/testing` (#216; bruno añade la exportación en `package.json` y la entrada en el build): `createSimulatedSpeechAdapter(options)` (§4.7). No viaja en el paquete principal.

**Tamaño medido con la F2** (#264): `dist/speech.js` pasa de 27,2 a **54,8 KB gzip** (modelo, `GTranscript` y destinos; el anfitrión importa `GTranscript` para el panel de conversación, así que también lo paga una aplicación que solo dicta); `grana.css` de 44,9 a **47,2 KB gzip** (+2,3 KB de `GTranscript.css`); **`dist/grana.js` no cambia** (#238 se cumple). **Estilos:** el CSS de la captura sigue en `grana.css` (≈ 5 KB gzip en la F1; inerte sin su marcado; una sola hoja que recordar). **UMD:** `dist/speech.umd.js` con la global `GranaSpeech` (requiere `Vue` y `Grana`, que aporta `GBtn`, `GIcon`, `GSurface`, `GSelect`, `GCheckbox`, `GProgress`). Los útiles compartidos con `GToaster` (`topModal`, reservas de borde, canales) se resuelven desde el paquete principal: la entrada `speech` **no** los duplica (bruno lo comprueba).

```js
// main.js de la aplicación
import { createApp } from 'vue'
import { createSpeech } from '@grana/vue/speech'
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
| `labels` | Object | §9 y §27 | `{}` (función) | **Sin valores por defecto** |
| `roles` (F2) | Array | `[{ id: String, label: String }]` | `[]` (función) | Lista de roles **de la aplicación** para asignar a los hablantes (§23.3; **sin roles por defecto**). Vacía: no hay selector de rol. `id` repetido: aviso y se ignora la repetición |
| `speakerColors` (F2) | Number | `0` a `12` | `0` | Cuántas categorías de color define el tema de la aplicación (`categories` del CLI, `tokens.md` §16.3). Con `n > 0`, el hablante en la posición `k ≤ n` lleva además el color `cat-k` como **complemento** (§23.6, #247); con `0`, ningún color. Grana no puede saber cuántas `--g-color-cat-*` hay sin leer el tema, y un componente no usa valores de respaldo: por eso lo declara la aplicación |
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
| `begin()` | `ready` | Abre el micrófono y el motor → `requesting` → captura. Con `requireConsent` y `state.consent !== true`: `false`. Desde el panel, «Empezar a grabar» muestra el **error de la casilla** (`GCheckbox`, con su mensaje vivo; `labels.consent.required`) y **lleva el foco a la casilla**, sin anunciar además `announce.consentRequired` (sería doble lectura); un `begin()` programático con el panel cerrado **sí** lo anuncia por el canal cortés (#230) |
| `setConsent(value)` | `ready` | Marca el aviso a participantes (la casilla del panel lo usa; una app con su propio flujo puede llamarlo) |
| `setExpectedSpeakers(value)` | `ready` | `1`, `2` o `'many'` |
| `pause()` | captura, `reconnecting` con captura viva | **Detiene las pistas** (§2.4) → `paused` |
| `resume()` | `paused`; `denied`/`unavailable`/`error` recuperables | Vuelve a pedir el micrófono → `requesting` → captura |
| `finish()` | captura, `paused`, `reconnecting`, errores con algo capturado | Finalización en 6 pasos (§2.3) → `processing` → `completed` |
| `discard()` | cualquiera salvo `idle` y `processing` | Descarta sesión, transcript y audio temporal (`engine.abort()`) → `idle`. Programático: **sin** confirmación (la confirmación es del panel). Pasa a `idle` **en el acto** (la captura ya no existe); `state.result`, el anuncio de descarte y `onDiscard` llegan **cuando `abort()` responde**; si rechaza, cuenta como `audioDeleted: false` (#234) |
| `close()` | `completed` | Entrega `onComplete(transcript)` → `idle` |
| `cancel()` | `ready`, `requesting` | Cancela antes de capturar → `idle` |
| `openPanel()` · `closePanel()` | sesión no `idle` | Abre o cierra el panel (§6.3); el foco sigue la regla de §11 |
| `retrySegment(segmentId)` | sesión con el fragmento fallido y `retryable` | Llama a `engine.retrySegment(id)` |
| `insertPending(fieldId)` | dictado con fragmentos sin insertar | Inserta, en orden, los fragmentos que quedaron sin insertar (§8.4) |
| `undoDictation(fieldId)` | registro de deshacer válido para ese campo | Deshace las inserciones del último dictado en ese campo; `false` si el campo cambió después (§8.5) |
| `onLevel(callback)` | siempre | `callback(level, live)` a cada fotograma (0..1, Boolean). Devuelve la función para darse de baja. **El nivel no es reactivo** (evita ~10 renders por segundo) |
| `configure(patch)` | siempre | §1.1 |
| `install(app)` | | Plugin de Vue: `provide(speechKey, speech)` |

Propiedades de solo lectura: `state` (§1.3), `capabilities` (las del adaptador, normalizadas, §4.2) y, en F2, **`targets`** (registro de destinos: `register(target) → unregister`, `list` reactiva de solo lectura; §24.2).

Métodos nuevos en F2: `review()` (lo que hace «Revisar» del panel, §25.2: lleva a la superficie de revisión registrada o abre el diálogo de respaldo; devuelve `false` sin sesión de conversación o sin transcript).

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

### 1.4 Transcript (datos; forma estable entre fases)

```ts
{
  id: string,
  mode: 'dictation' | 'conversation',
  createdAt: string,                           // ISO 8601
  expectedSpeakers: 1 | 2 | 'many',
  speakers: Array<{
    id: string,                                // opaco: del motor o generado por Grana; nunca se muestra
    role: string | null,                       // F2: id de `roles` de la app, o null
    mergedInto: string | null,                 // F2: id del hablante con el que se unió, o null
    origin: 'engine' | 'user'                  // F2: lo trajo el motor o lo creó quien revisa
  }>,                                          // por orden de aparición; la letra sale de la posición (estable)
  segments: Array<{
    id: string, t0: number, t1: number,        // ms desde el inicio del audio capturado
    literal: string,                           // del motor; inmutable tras el 'final' (el reintento de un fallido lo rellena)
    engineSpeaker: string | null,              // del motor (solo el evento `speakers` lo cambia, §21.8)
    corrected: string | null,                  // F2: null = igual al literal
    speaker: string | null,                    // F2: null = el del motor
    removed: boolean,                          // F2: borrado lógico
    failed: boolean
  }>,
  partial: { id: string, text: string, speaker: string | null } | null,   // uno solo; nunca en toJSON()
  derived: Array<{ id: string, kind: string, at: string, ... }>,           // #211: solo datos; F2: usos `kind: 'insert'` (§21.6)
  toJSON(): object                             // copia sin `partial` y sin historial
  // + operaciones del modelo (F2, §21.3 a §21.7)
}
```

En F1 el gestor es el **único** que escribe el transcript y `corrected`/`speaker`/`removed` valen siempre `null`/`null`/`false`. **La forma es estable entre fases** (#242): la F2 **llena** esos tres campos, **añade** `role`, `mergedInto` y `origin` a `speakers[]` y entradas a `derived[]`, y no cambia nada más. Un JSON de la F1 se carga en la F2 sin conversión (§21.9).

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

`navigator.permissions.query({ name: 'microphone' })` cuando existe (en `prepare`/`start`): decide si se anuncia la espera del permiso y si `denied` se detecta **sin abrir nada**. Mientras la sesión exista se escucha `change` para mantener `state.permission` al día; un permiso revocado durante la captura se trata como `denied`. Si la consulta no existe o falla: `unknown`. **Con `input.format: 'self'` no se consulta** (el adaptador captura con su propio permiso; `state.permission` queda `unknown`; #232).

### 3.6 Pantalla, salida y segundo plano

- **`wakeLock`** (opción, por defecto activa): `navigator.wakeLock.request('screen')` solo durante la **captura de una conversación**; se libera al pausar, detener o fallar; se vuelve a pedir al volver la pestaña a visible si sigue capturando. Si falla, se ignora sin aviso.
- **`guardUnload`**: escucha `beforeunload` solo con una sesión fuera de `idle`.
- **Segundo plano:** Grana **no** detiene la captura al ocultarse la pestaña. Si el sistema la suspende (iOS Safari), el vigilante la marca como interrumpida al volver. El segundo plano real en nativo es F3 (adaptador `self`).

### 3.7 Constantes de comportamiento (no son tema)

Bruno las expone como `SPEECH_TIMING` interno y las prueba: `frameMs` 100 · `chunkMs` por defecto 300 (si el adaptador PCM no lo declara) · `watchdogMs` 1500 · `watchdogTickMs` 250 · `flatMs` 2500 · `voiceThreshold` 0,12 · `voiceHoldMs` 450 · `announceGroupMs` 300 · `insertAnnounceMs` 2500 · `autoCloseMs` 1500 · `politeGapMs` 900 (separación mínima entre dos textos de la cola cortés; `POLITE_GAP_MS` en el código, #231) · `reducedMotionHz` 4 · rango de nivel −60..−10 dBFS. Son valores del prototipo (kiwi §14: no medidos con usuarios); cambiarlos es decisión de lima con evidencia.

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
| `speakers` | `{ relabel: Record<idDelMotor, idDelMotor> }` | **F2** (diarización revisada por el motor): cambia `engineSpeaker` de los fragmentos afectados y el hablante del provisional; **no** toca `speaker` del usuario ni el historial; un id nuevo se añade a `speakers[]` con `origin: 'engine'` (§21.8, #247) |
| `level` | `{ value }` (0..1) | Solo con `input.format: 'self'` |
| `capture` | `{ state: 'live' \| 'ended' \| 'muted' }` | Solo con `self`: `live` habilita la captura; `ended` → `unavailable`; `muted` → `error` (`interrupted`) |

Un evento desconocido, o cualquier evento después de que `finish()`/`abort()` resolvieran, se ignora con aviso en desarrollo. **Ids de hablante del adaptador** (`speaker` de `partial`/`final`, `relabel`): opacos, nunca se muestran; **no deben empezar por `user-`**, prefijo de los hablantes que crea quien revisa (§21.4; aviso en desarrollo).

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

Sin eventos públicos ni slots en F1 (todo va por el gestor, como `GToaster`). **Si el anfitrión se desmonta con la captura viva**, Grana **detiene las pistas** y la sesión pasa a `paused` (sin anfitrión no hay indicador, así que no hay micrófono; #233); al volver a montarse no reanuda solo. **Dos `GSpeechHost` del mismo gestor:** la segunda no pinta nada y avisa.

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
- **Canales vivos:** dos `g-speech-host__live` con el patrón de texto oculto accesible, **presentes y vacíos desde el montaje** y durante toda la vida del anfitrión (una región viva solo se anuncia si existe antes del cambio; #14, #137, #141). Son los **únicos que anuncian** algo de la captura: ni la pill, ni el panel, ni el disparador, ni la nota tienen `aria-live` propio. Los `GBtn` de la pill, el panel, el disparador y la nota **no** ponen `loadingText`, así que **no pintan** su `g-btn__status` (#257, que sustituye a la excepción #227).
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
| `__transcript` | Título `h3` (`labels.transcript.title`) y lista de solo lectura (§6.5); **en conversación (F2), `GTranscript compact`** nombrado por ese título (§25.1) |

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

**F2, solo en conversación** (#249): captura, `reconnecting` y `paused` añaden al final **Revisar** (`labels.actions.review`, `file-pen-line`, secundaria); `completed` pasa a **Revisar transcripción** (`labels.actions.reviewCompleted`, `file-pen-line`, **principal**) · **Cerrar sesión** (`circle-check`, secundaria) · Descartar. El dictado no cambia (se corrige en el propio campo).

Descartar y su confirmación van **sin icono** (también en F2: `trash` lo usa `GTranscript` para eliminar fragmentos, que es reversible; descartar la sesión no lo es y no comparte su icono). **Con usos** (inserciones vigentes en `derived`), la pregunta es `labels.actions.discardAskUsed` (plural, `{count}` = usos): dice que los textos insertados **se quedan** en los campos, porque ya son de la aplicación (#249). Botones: `GBtn` con las props de §13.1 (fijadas por coco).

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

**Desde la F2 esta lista solo se usa en dictado**; en conversación, el panel muestra `GTranscript compact` (§25.1). Las reglas de abajo siguen vigentes para el dictado.

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

Los textos de la Fase 2 (`speakerRole`, `actions.review*`, `actions.discardAskUsed`, `review.*` y `transcript.*` de la vista) están en **§27**.

Marcadores con `utils/template.js` (`fill`). Las claves marcadas «plural» admiten **String** con `{count}` o **Function** `(count) => String` (plurales del idioma; como `counterText`, #51, y `GErrorSummary`). **Una Function recibe solo `count`**; su resultado pasa después por `fill` con el resto de marcadores, de modo que puede devolver `{time}` u otro marcador de la clave (#237; p. ej. `completedConversation: (n) => n === 1 ? '1 fragmento, {time}.' : '{count} fragmentos, {time}.'`). Falta una clave: **aviso en desarrollo la primera vez que se necesita**; los botones con icono **se dibujan igual** (la salida es obligatoria), los textos quedan vacíos.

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
- **Si un cambio de estado retira el botón enfocado del panel** (p. ej. «Pausar» al pasar a `paused`, o las acciones al entrar en `processing`), el foco va al **título del panel** (`tabindex="-1"`), nunca a `body` (WCAG 2.4.3; #235).
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

**Iconos** (`icons.md` §4; #224): los de §2.1, §6.4 y §7 — nuevos en la librería: `mic`, `mic-off`, `pause`, `circle-pause`, `audio-lines`, `captions`, `shield-question-mark`, `refresh-cw`, `unplug`, `rotate-ccw`, `globe` (comprobados como canónicos en `lucide-static` 1.49.0); ya en la librería: `circle`, `square`, `loader-circle`, `circle-alert`, `circle-check`, `chevron-down`, `x`, `triangle-alert`, `lock`. Los reservados para F2 (`text-cursor-input`, `undo-2`, `trash`, `pencil`, `copy`) **entran con la F2** junto con otros siete (§28.2, #253).

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
| Panel F2: Revisar (captura, pausa, reconexión) | `size="md" variant="outline" color="neutral"`, `file-pen-line` en `prepend` (como las secundarias) |
| Panel F2: Revisar transcripción (`completed`) | `size="md"`, sólido por defecto, `file-pen-line` en `prepend` (principal); Cerrar sesión pasa a `variant="outline" color="neutral"` |

**Ningún `GBtn` de la captura usa `loading` ni `loadingText`**: sin `loadingText`, `GBtn` no pinta su `g-btn__status` (#257).

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

(Los de la Fase 2, en §30.)

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

- **Importar `@grana/vue` o `@grana/vue/speech` y llamar a `createSpeech` no toca `document`, `window`, `navigator`, `matchMedia` ni `AudioContext`.** El gestor es estado puro y métodos.
- En el servidor `GSpeechHost` **no renderiza nada**; `GSpeechPill` renderiza su raíz `hidden`; `GSpeechTrigger` renderiza su botón en `idle` (sin leer el DOM). Sin desajuste de hidratación.
- Captura, observadores (`IntersectionObserver`, `MutationObserver`), escuchas de documento (atajo, `beforeunload`, `visibilitychange`, `resize`, `pointerdown`, `input` para el deshacer), Permissions API y `wakeLock` existen **solo** con `GSpeechHost` montado y una sesión iniciada, y se retiran al terminar o desmontar.
- Llamar a métodos en el servidor no falla: devuelven `false` sin efectos.

---

## 17. Verificación (qué y cómo)

- **bruno** (vitest + jsdom con el adaptador simulado y una captura simulada; **Playwright** en Chromium, Firefox y WebKit para capa superior, modal, foco, móvil y micrófono falso `--use-fake-device-for-media-stream`):
  - **API:** exportaciones (`createSpeech`, `useSpeech`, `speechKey`, `GSpeechHost`, `GSpeechTrigger`, `GSpeechPill`) **solo en `@grana/vue/speech`**, ninguna en `@grana/vue` (#238); `app.use(speech)` registra los tres componentes; `dist/grana.js` vuelve a su tamaño anterior (compuerta: `! grep -q "createSpeech" packages/vue/dist/grana.js`); `createSimulatedSpeechAdapter` solo en `@grana/vue/testing`; `app.use` provee; `useSpeech` sin gestor avisa y devuelve `undefined`; importación en entorno `node` sin `document`.
  - **Estados:** tabla de transiciones completa (cada legal pasa; una muestra de ilegales se rechaza con `false` y aviso); icono y texto por estado; facetas.
  - **Sin anfitrión no hay micrófono**; `remote` sin `allowRemote` → `error` sin `getUserMedia` ni `open`; capacidades inválidas → `unsupported`.
  - **Captura:** `ready` sin pista; pausa con pista **detenida** (`readyState: 'ended'`); vigilante: captura congelada → `error` `interrupted` en < 2,5 s y la pill deja de decir «Grabando»; señal plana; `ended`/`mute`; mapeo de errores de `getUserMedia`; nivel > 0 con el micrófono falso; PCM a la `sampleRate` pedida y `chunkMs`; codificado con `mimeType` admitido; `self`.
  - **Adaptador:** `partial` → `final` en su sitio; `pending`; `connection` con y sin `offlineBuffer` (captura viva frente a retenida; restablecido retenido → `paused`, no reanuda solo); `error` no fatal → `issues` + «Reintentar fragmento»; fatal → estado y cuatro respuestas; `storage-full`; `push` que lanza.
  - **Finalización:** los 6 pasos en orden; `processing` sin acciones de cierre; `discard()` rechazado en `processing`; `finish` rechazada → `error`; `audioDeleted` confirmado frente a no confirmado (texto y aviso); dictado que se cierra solo; conversación que espera a `close()` → `onComplete` con `toJSON()` sin `partial`.
  - **Anfitrión:** raíz `popover` abierta y 2 canales **antes** de la primera sesión y durante ella; **ninguna otra región viva** en toda una sesión (los `GBtn` de la captura no pintan `g-btn__status`, #257); garantía de una pill (colocada visible → flotante oculta; colocada fuera del visor o inerte → flotante); `data-flipped` con un campo enfocado bajo la flotante; traslado a un **`GDialog` real** (flotante operable, panel dentro, Esc del panel no cierra el diálogo, vuelta a `body`); la hoja propia no dispara el traslado; móvil bajo `space × 130` (hoja, foco al título, Esc, reapertura al cruzar el umbral); `topModal.js` compartido con `GToaster` sin romper sus pruebas.
  - **Disparador:** dictado conmutable (`aria-pressed`, nombre fijo); conversación (`prepare` → panel); otra sesión → `aria-disabled`, descripción, anuncio y foco a la pill, **sin** sesión nueva; el disparador se desmonta y la sesión sigue (misma `sessionId`).
  - **Dictado:** inserción del confirmado en el cursor sin mover el foco; sustitución de la selección inicial; provisional fuera del valor; `v-model` actualizado; campo desmontado → orden conservado y «Insertar»; deshacer (válido, invalidado por edición, foco al campo); tipos de campo no admitidos.
  - **Anuncios:** textos y canales de §10; nada transcrito en los canales; agrupación de estados e inserciones.
  - **Teclado y foco:** Mayús+F8 ida y vuelta; F8 sola no interceptada; sin sesión no se intercepta; Esc con `defaultPrevented` y sin propagarse; foco al abrir y cerrar; IME.
  - **Borde compartido:** con `GToaster` montado en móvil, los avisos quedan encima de la pill flotante (reserva sumada a `--_toaster-offset-bottom`) y la pill no se mueve.
  - **Movimiento:** «Ocultar actividad»; `reducedMotion: 'reduce'` → medidor discreto, sin giro.
  - **Avisos de desarrollo** de §15 y **SSR** (render en servidor sin errores ni markup del anfitrión).
  - `check-icons.mjs`, prueba 9 de `icons.md` §7 (nombres canónicos) y `levels.test.js` sin infracciones.
- **coco** (auditoría con un tema distinto al de defecto, claro y oscuro): texto 4.5:1 (provisional incluido) y bordes, iconos y medidores 3:1 sobre `floating` y sobre la cabecera de la app; estado activo reconocible sin color y distinto del anillo de foco; problema distinguible en escala de grises; `forced-colors` (bordes y barras visibles); `prefers-contrast: more`; objetivos 24/44px en pill, panel, disparador y nota; foco visible dentro de la capa superior y de la hoja; movimiento reducido; 320×640 sin desbordamiento (página y hoja) con pill de cabecera y flotante dentro del visor; RTL; zoom 200 %.
- **No verificado y pendiente:** **lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): cola cortés y `alert`, cambio de nombre de pausar/reanudar con el foco encima, `role="timer"`, traslado de canales al modal, descripción de «grabación en curso» (**riesgo principal**; el ruido de las `g-btn__status` vacías de #227 desaparece con #257); **Safari**: si reanudar tras detener las pistas vuelve a pedir permiso (la reanudación pasa por `requesting` y lo anuncia, así que el contrato no cambia), Permissions API de `microphone`, `MediaRecorder` y sus formatos, `wakeLock`; **motores reales** (Whisper, whisper.cpp, faster-whisper, pyannote) y la entrega PCM real a 16 kHz; **móvil real** (llamada entrante, segundo plano en iOS/Android, `safe-area`, teclado virtual con la hoja, orientación); permiso revocado a mitad de sesión; varios modales apilados; pill colocada tapada por otra capa; sesiones de una hora o más (memoria, deriva del reloj); `beforeunload` en cada navegador; las constantes de §3.7 con usuarios.

---

## 18. Fases siguientes (reservado; no forma parte de este contrato)

| Fase | Contenido | Nombres reservados |
| --- | --- | --- |
| ~~F2 — Revisión y destino~~ | **Especificada en §20 a §32** (#241 a #256). Cambio sobre lo que aquí se reservaba: los destinos son `{ id, label, get, set, … }` ligados al modelo, no `{ id, label, insert(text) → { undo() } }`, que queda como vía de escape (#248) | — |
| **F3 — Robustez de producto** | Recuperación tras cerrar la aplicación (**opcional por app**, #210; audio y transcript cifrados en disco), kit de pruebas del contrato de audio temporal, selección de dispositivo (`enumerateDevices`, `devicechange`), captura `self` para envoltorios nativos y segundo plano, transcript a pantalla completa en móvil, sesiones de horas: **`GTranscript` virtualizado a partir de ~2 000 fragmentos** con `aria-rowcount`/`aria-rowindex`, aceptando sus pérdidas (buscar con Ctrl+F, selección de texto entre fragmentos lejanos; #250) | opción `recovery` |
| Sin fase (se decide con su ronda) | **Slots de contenido del panel** (reservados en la F1; la r02 no los necesitó y no se diseñaron); `GRadioGroup` en la inserción en lugar de `GSelect` cuando exista (#181) | — |
| Fuera de v0.1 | **Marca de «revisado»** (#241): Grana no certifica revisiones; queda reservada la opción **`requireReview`** (habilitaría insertar y cerrar solo tras marcarla, con fecha en los datos) si una aplicación la pide con su caso; **escuchar el audio de un fragmento** durante la revisión (#209: exigiría conservar el audio; si entra, ligado a `storesAudio` y con borrado al cerrar); interfaz propia para el contenido derivado (#211); un hueco de acción interactivo en `GTextarea`/`GInput` para colocar el disparador dentro de la caja (cambio de los contratos de campo; se decide con su ronda); arrastrar fragmentos a los campos (#248) | `requireReview` |

## 19. Preguntas de producto abiertas

**Ninguna.** Las cinco de kiwi de la F1 (§15 de su declaración) las resolvió el usuario por delegación (#207 a #211). La única de la r02 (§20 de la declaración: ¿marca de «revisado»?) también, por delegación sobre la recomendación de kiwi: **no en v0.1** (#241). El resto de propuestas de kiwi derivan de estándar o de contratos vigentes (#212 a #226; F2: #242 a #256).

---

# Fase 2 · Revisión y destino

**Basado en:** `design/lab/speech/r02/` (kiwi, commit cd406d8): `brief.md` (encargo de la ronda sobre el brief del usuario `r01/brief.md`), `declaracion.md` (20 puntos; §19 hallazgos para lima), `index.html` (modelo, `GTranscript`, registro de destinos y sesión simulada) y `verificar.mjs` (123/123 en Chromium, seis ejecuciones seguidas). **No reabre** ninguna decisión de la F1 (#207 a #240): solo llena lo reservado y añade. **Decisiones:** #241 (del usuario, delegada) y #242 a #256 (propuestas de kiwi aprobadas por derivar de estándar).

## 20. Qué añade la Fase 2

1. **Tres piezas, un modelo** (#242, #244, #248). (a) El **transcript es un modelo de datos con operaciones** (`createTranscript`, §21): capas, historial, composición y usos; `speech.state.transcript` es una instancia. (b) **`GTranscript`** (§22) es la **vista** que lo muestra y lo edita. (c) Los **destinos** (§24) son un registro de la aplicación (campos de su formulario) al que se inserta. Varias vistas del mismo transcript (panel, revisión en la página, diálogo de respaldo) **comparten el modelo y su historial**: una corrección en una aparece en las otras.
2. **El literal del motor es intocable para el usuario.** Toda corrección vive en su propia capa y se puede deshacer o devolver al original.
3. **Nada de la revisión es irreversible** (eliminar es lógico y todo se deshace): **sin confirmaciones** al eliminar ni al reasignar (WCAG 3.3.4, 3.3.6).
4. **Grana no certifica revisiones** (#241), igual que no certifica el consentimiento (#207): no hay marca de «revisado» en v0.1.
5. **Privacidad como en la F1:** sin red ni almacenamiento; el historial vive en memoria y **no** entra en `toJSON()`; **ningún anuncio, evento ni aviso de desarrollo lleva texto transcrito** (salvo las entradas de `derived`, que son datos de la aplicación y llevan el texto insertado).
6. **Se reutiliza:** `GMenu` (menús de fila, de hablante, de copiar, de asignar y «Más»), `GBtn`, `GIcon`, `GCheckbox`, `GSelect`, `GDialog` (diálogo de respaldo), los canales del anfitrión (F1 #219) y las convenciones de `GTable` (`v-model:selected` con claves, «Seleccionar todo» mixto, tono de la fila seleccionada, apilado por ancho del contenedor).

| Existente | Relación con la F2 |
| --- | --- |
| `GTable` | **No** se reutiliza: es una tabla de datos (`role="table"`, sin edición en celda, `table.md`). `GTranscript` necesita **edición en la celda y una sola parada de tabulación**: patrón rejilla de APG (#244). Copia sus convenciones |
| `GMenu` | Todos los menús de `GTranscript` son `GMenu` (`menuitem`, `menuitemradio`, `menuitemcheckbox`) |
| `GTextarea` | El editor de la celda es un `textarea` nativo con **la apariencia** de `GTextarea`, no un `GTextarea` completo (#252) |
| `GDialog` | Diálogo de revisión de respaldo del anfitrión (§25.3) |
| `GDataList` | No: es lectura clave/valor |
| Lista del panel F1 (§6.5) | En **conversación** la sustituye `GTranscript compact`; en **dictado** no cambia |

## 21. El modelo: `createTranscript(data?)` (#242, #243, #245)

### 21.1 Crear

`createTranscript(data?)` devuelve una instancia con la forma de §1.4 más las operaciones de este apartado. Sin `data`, un transcript vacío (`mode: 'conversation'`, `expectedSpeakers: 'many'`, `id` y `createdAt` generados). Es **estado puro**: crearlo no toca `document`, `window` ni `navigator` (SSR, §16). El gestor crea la instancia de cada sesión; la aplicación crea las suyas para cargar un transcript guardado (§21.9, §25.4).

### 21.2 Capas

| Capa | Campos | Quién escribe | Regla |
| --- | --- | --- | --- |
| **Literal** | `literal`, `engineSpeaker`, `t0`, `t1` | **Solo el motor** (`final`; `speakers.relabel` cambia `engineSpeaker`) | Inmutable para el usuario. Un `final` repetido de un fragmento confirmado se ignora (F1). Ninguna operación del usuario ni deshacer lo modifica |
| **Corregido** | `corrected` (`null` = igual al literal), `speaker` (`null` = el del motor), `removed` (borrado lógico) | El usuario, **solo** con las operaciones del modelo (§21.4) | Guardar un texto **igual al literal** deja `corrected = null`. Guardar **vacío** no borra el texto: **equivale a eliminar** (`removed = true`, `corrected` intacto) |
| **Derivado** | `derived[]` | Grana (usos `kind: 'insert'`, §21.6) y la aplicación (sus `kind`) | Solo datos (#211). **Nunca** reescribe las otras capas |

- **Hablante efectivo** de un fragmento: `resolve(speaker ?? engineSpeaker)`, siguiendo `mergedInto` (§23.5). Si una asignación del usuario coincide con el hablante efectivo del motor, se guarda `speaker = null` (no es un cambio).
- **«Corregido»** = `corrected !== null`. **«Hablante cambiado»** = `speaker !== null` y su resolución distinta de la del motor; se **calcula al mostrar**, así que un `relabel` del motor que acaba coincidiendo con la reasignación hace desaparecer la marca sin tocar los datos.
- **Eliminado** se queda en su sitio (no se oculta, §22.5); se excluye de copiar, insertar y del recuento de «Todo».
- **No se edita** un fragmento eliminado (primero «Restaurar»), fallido, ni el provisional (que no está en `segments`).
- **Las diferencias no se guardan**: se calculan al mostrar (§22.9).

### 21.3 Lectura

| Miembro | Devuelve |
| --- | --- |
| `segment(id)` | El fragmento, o `undefined` |
| `textOf(segment)` | `corrected ?? literal` |
| `speakerOf(segment)` | Id del hablante efectivo, o `null` (sin hablante) |
| `resolve(speakerId)` | Id final siguiendo `mergedInto` |
| `letter(speakerId)` | Letra por **posición** en `speakers[]`: `A`…`Z`, luego `AA`, `AB`… Estable: unir, separar o añadir no reletra a nadie |
| `visibleSpeakers()` | Hablantes no unidos que tienen fragmentos (o el provisional) o que creó el usuario |
| `usesOf(segmentId)` | Entradas `kind: 'insert'` de `derived` que lo usan |
| `compose(source, options)` | §21.7 |
| `canUndo` · `canRedo` | Boolean |
| `nextUndo` · `nextRedo` | Descriptor de la entrada que se desharía o reharía (`{ kind, ids, t0 }`) o `null`: lo usan los botones para su descripción («Deshacer: corrección de las 00:03») |
| `onChange(callback)` | §21.10 |

### 21.4 Operaciones del usuario (entran en el historial)

Síncronas. **Nunca lanzan**: un id inexistente o una operación imposible devuelve `false`, no crea entrada en el historial y avisa en desarrollo (§30). Una operación que no cambia nada devuelve `false` sin entrada. Cada llamada es **una** entrada aunque toque varios fragmentos.

| Operación | Hace | Devuelve |
| --- | --- | --- |
| `edit(id, text)` | Normaliza el espacio (colapsa blancos, sin saltos de línea: un fragmento es un párrafo; recorta). Igual al literal → `corrected = null`; vacío → `removed = true` y **la entrada del historial es `remove`** («Deshacer: eliminación»; el anuncio sigue siendo `emptied`; #263) | `'edited'` · `'emptied'` · `false` |
| `revert(id)` | «Volver al original»: `corrected = null` **y** `speaker = null` (texto y hablante). No toca `removed` (para eso, `restore`) | Boolean |
| `remove(ids)` · `restore(ids)` | Borrado lógico y su inverso. Ignora los fallidos | Boolean |
| `assignSpeaker(ids, speakerId \| null)` | Cambia `speaker` (**nunca** `engineSpeaker`). `null` = volver al del motor. Un id unido se resuelve a su destino. Id inexistente → `false` | Boolean |
| `assignNewSpeaker(ids)` | Crea un hablante (`origin: 'user'`) y le asigna los fragmentos, en **una** entrada (deshacer quita también el hablante) | Id nuevo · `false` |
| `addSpeaker()` | Crea un hablante sin fragmentos (`origin: 'user'`) | Id nuevo |
| `setRole(speakerId, roleId \| null)` | Rol del hablante (dato). El modelo no conoce la lista: un `roleId` que la vista no encuentra se muestra como sin rol (aviso en desarrollo) | Boolean |
| `mergeSpeakers(fromId, intoId)` | `from.mergedInto = resolve(into)`; los unidos a `from` pasan a `into`; las reasignaciones del usuario hacia `from` se redirigen. **No** cambia `engineSpeaker`. Ciclo o `from === into` → `false` | Boolean |
| `unmerge(speakerId)` | `mergedInto = null` (los fragmentos del motor vuelven a mostrarse con él) | Boolean |
| `undo()` · `redo()` | §21.5 | `{ kind, ids, t0 } \| null` |

Los ids que crea Grana para hablantes del usuario son **`user-1`, `user-2`…**, únicos en `speakers[]`. Un adaptador **no debe** usar ese prefijo para sus hablantes (§4.4; aviso en desarrollo si llega).

### 21.5 Historial de la revisión (#243)

1. **Vive en el modelo**, no en la vista: todas las vistas de un transcript comparten historial (deshacer en el panel deshace lo hecho en la página).
2. **Tamaño:** `TRANSCRIPT_LIMITS.history` = 200 entradas (§26.4); al pasarse, se pierde la más antigua. Una operación nueva vacía la pila de rehacer.
3. **Qué entra:** `edit`, `revert`, `remove`, `restore`, `assignSpeaker`, `assignNewSpeaker`, `addSpeaker`, `setRole`, `mergeSpeakers`, `unmerge`. Cada entrada guarda **instantáneas** de los campos del usuario (`corrected`, `speaker`, `removed`) de los fragmentos que toca y, si toca hablantes, de `speakers[]` (`role`, `mergedInto` y altas). **Deshacer restaura solo eso**: un fragmento o un hablante que llegó del motor después **no se pierde**; los hablantes que creó la operación se quitan.
4. **Qué no entra:** eventos del motor (`final`, `partial`, `speakers`), selección, «Mostrar cambios», **inserciones en destinos** (su propio deshacer, §24.6: son otro documento, el formulario; mezclar las pilas haría que Ctrl+Z en la transcripción cambiara un campo que no se ve) y los derivados de la aplicación.
5. **No se guarda en `toJSON()`**: al cargar un transcript guardado el historial empieza vacío. Las versiones intermedias de una corrección pueden ser sensibles y no aportan: literal y corregido bastan.
6. Teclas, botones, foco y anuncios: §22.10 a §22.13.

### 21.6 Capa derivada (`derived[]`)

Solo datos (#211). **Uso por inserción** (lo escribe Grana; `kind: 'insert'` está **reservado**):

```ts
{
  id: string,                      // generado, único en derived
  kind: 'insert',
  createdBy: 'user',
  at: string,                      // ISO 8601
  target: { id: string, label: string },
  position: 'end' | 'cursor' | 'selection',
  sourceSegmentIds: string[],
  text: string,                    // texto exacto insertado
  sources: Record<segmentId, string>   // texto de cada fragmento en ese momento
}
```

- `sources` permite marcar **«Cambió después de insertarlo»** si el texto del fragmento (o su eliminación) cambia después. **El campo no se actualiza solo**: lo insertado ya es del usuario.
- Deshacer una inserción (§24.6) **quita** su entrada de `derived` y con ella la marca «Usado en».
- **La aplicación** añade los suyos con `addDerived(entry)` → copia guardada (con `id` generado si falta, `at` si falta, `createdBy: 'app'` si falta). `kind` obligatorio; **`kind: 'insert'` se rechaza** (devuelve `false` y avisa). `removeDerived(id)` quita uno de la aplicación (los `insert` solo se quitan deshaciendo la inserción: `false` y aviso). Ninguno de los dos entra en el historial.

### 21.7 Composición: `compose(source, options)`

`source`: `{ kind: 'all' }` · `{ kind: 'segments', ids }` · `{ kind: 'text', parts: [{ id, start, end, text }] }` (selección de texto, §22.8). `options`: `withSpeakers` (`false`), `withTimes` (`false`), `multiline` (`true`), `speakerName` (`(speakerId) => String`, **obligatoria con `withSpeakers`**: los textos son de la vista). Devuelve `{ text, ids }`.

- Usa el **corregido**; excluye eliminados y fallidos.
- En conversación agrupa fragmentos **seguidos del mismo hablante** en un **turno**; los turnos se separan con salto de línea (en dictado, con espacio).
- `withTimes`: `[mm:ss] ` delante de cada turno (`h:mm:ss` desde una hora). `withSpeakers`: `Nombre: ` delante de cada turno; la vista da como nombre **el rol si es único** entre los hablantes visibles y, si no, la etiqueta completa («Familiar (C)», §23.2).
- **Un trozo de texto (`kind: 'text'`) se compone tal cual**: es una cita; ignora `withSpeakers` y `withTimes`.
- `multiline: false`: los saltos de línea pasan a espacios.

### 21.8 Eventos del motor (internos)

El gestor aplica los eventos del adaptador (§4.4) con métodos **internos** del modelo (no son API): `final` (inserta por `t0`; un `final` de un fallido lo rellena), fallo de fragmento, `partial` y **`speakers` `{ relabel }`** (#247): cambia `engineSpeaker` de los fragmentos afectados (capa literal) y el hablante del provisional; **no** toca `speaker` del usuario, el historial ni el editor abierto; un id nuevo entra en `speakers[]` con `origin: 'engine'`. Un `relabel` con un id `user-*` o hacia un hablante del usuario se ignora con aviso.

### 21.9 Cargar un transcript guardado (`createTranscript(data)`)

- Acepta lo que devolvió `toJSON()` en la **F1 o la F2**: los campos que faltan toman su valor inicial (`role: null`, `mergedInto: null`, `origin: 'engine'`, `corrected: null`, `speaker: null`, `removed: false`, `derived: []`).
- `partial` se ignora. Los fragmentos se ordenan por `t0` (orden estable). Un id de fragmento repetido: se conserva el primero y avisa. Un hablante referido por un fragmento y ausente de `speakers[]` se añade (`origin: 'engine'`). Un `mergedInto` hacia un hablante inexistente o en ciclo pasa a `null` y avisa.
- **Campos desconocidos** se ignoran y avisan en desarrollo: los datos propios de la aplicación van en `derived` con su `kind`, no en el transcript.
- El **historial empieza vacío**.

### 21.10 Reactividad y observación

- La instancia se **lee reactivamente** (plantillas, `computed`, `watch` sobre `segments`, `speakers`, `derived`, `partial`); el mecanismo es de bruno, con la condición de §26 (un cambio repinta solo lo que cambia). **Se escribe solo con las operaciones**: escribir directamente no está soportado (en desarrollo, la instancia es de solo lectura y avisa).
- **`onChange(callback)` → función para darse de baja.** `callback({ source, kind, ids })` tras cada cambio **salvo el provisional**: `source: 'user'` (operaciones de §21.4, `undo`, `redo`, `insert`, `undo-insert`), `'engine'` (`final`, `failed`, `relabel`) o `'app'` (`addDerived`, `removeDerived`). Pensado para el autoguardado de la aplicación. **Sin texto.**

## 22. `GTranscript` (#244, #246)

Vista pública de un transcript: el de la sesión o uno guardado. Patrón **rejilla de datos de APG** (`role="grid"`), **una fila por fragmento**, **una sola parada de tabulación** (foco itinerante). Motivo: es la colección de APG pensada para elementos con **selección múltiple y edición en la celda** con teclado completo; una lista con botones por fila daría unas 2 paradas por fragmento (600 con 300 fragmentos) y un `listbox` no admite controles dentro de las opciones. Riesgo aceptado: con lector de pantalla la rejilla activa el modo foco; leer de corrido sigue siendo posible en modo exploración (sin verificar con lector real, §31).

### 22.1 Props

| Prop | Tipo | Valores | Default | Regla |
| --- | --- | --- | --- | --- |
| `transcript` | Object | instancia de `createTranscript` (§21) | **obligatoria** | Sin ella: raíz vacía y aviso. Cambiarla en vivo vuelve a pintar la vista (la selección y el editor se vacían) |
| `editable` | Boolean | | `true` | Editar, eliminar, restaurar, volver al original, cambiar hablante, roles, unir/separar, deshacer |
| `selectable` | Boolean | | `true` | Columna de selección, «Seleccionar todo», acciones sobre la selección. `compact` la ignora |
| `selected` | Array | ids de fragmento | `[]` (función) | `v-model:selected` (como `GTable`). Solo confirmados (también eliminados); el provisional y los fallidos no son seleccionables (se descartan con aviso). La selección es **de la vista**, no del modelo |
| `compact` | Boolean | | `false` | §22.3. Lo usa el anfitrión en el panel |
| `copy` | Boolean | | `true` | Con `false` no hay acciones de copiar ni se intercepta Ctrl+C ni el evento `copy` (aplicaciones que no quieren portapapeles) |
| `targets` | Array | destinos (§24.1) | sin valor | Sin valor: los del gestor (`speech.targets.list`), si lo hay. Con valor: **solo esos** (uso suelto, sin gestor) |
| `roles` | Array | `[{ id, label }]` | sin valor | Sin valor: la opción `roles` del gestor; sin gestor, `[]` (sin selector de rol) |
| `diarization` | Boolean | | sin valor | Sin valor: si `transcript` es el de la sesión, `speech.capabilities.diarization`; si no, `true`. Con `false`: aviso visible en la vista y asignación manual (§23.7) |
| `speakerColors` | Number | `0` a `12` | sin valor | Sin valor: la opción del gestor; sin gestor, `0` (§23.6) |
| `labelledby` | String | id de un elemento | sin valor | **Nombre de la rejilla** (`aria-labelledby`) y destino de «Revisar» (§25.2). Recomendado: el título visible que pone la aplicación |
| `label` | String | texto | sin valor | Nombre sin título visible (`aria-label`). Sin `labelledby` ni `label`: aviso |
| `headingLevel` | Number | `2` a `6` | `3` | Nivel de los títulos internos (gestor de hablantes, inserción), como `GCard`/`GWidget` |
| `maxHeight` | String | longitud CSS | sin valor | Alto máximo del área desplazable (como `GTable`; variable en línea `--_max-height`). Sin valor, la lista crece con la página |
| `labels` | Object | forma de `createSpeech({ labels })` (§9, §27) | `{}` (función) | Se fusionan **por clave** sobre las del gestor; suelto, son las únicas. **Sin valores por defecto** |
| `speech` | Object (gestor) | | el inyectado | Para los canales, los destinos, los roles y la superficie de revisión |

Resto de atributos (`id`, `class`, `style`, `data-*`): a la raíz.

### 22.2 Eventos, métodos y slots

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `update:selected` | ids | Cambia la selección |
| `change` | `{ kind, ids }` | Tras una operación **iniciada en esta vista** (§21.4, también `undo`/`redo`). Para cambios de cualquier origen: `transcript.onChange` (§21.10) |
| `insert` | entrada de `derived` (§21.6) | Tras insertar en un destino |
| `undo-insert` | entrada de `derived` | Tras deshacer una inserción |
| `copy` | `{ count, withSpeakers, withTimes }` | Tras copiar al portapapeles. **Sin texto** |

**Métodos** (por `ref`): `focus()` (a la celda activa de la rejilla; en solo lectura, a la lista), `undo()` y `redo()` (lo mismo que los botones de la barra: anuncio y desplazamiento a la fila). **Sin slots en v0.1.**

### 22.3 Modos

| Modo | Props | Qué hay |
| --- | --- | --- |
| **Editable** (por defecto) | `editable` + `selectable` | Todo: selección, edición, hablantes, barra completa, ayuda de teclado, inserción (si hay destinos) |
| **Solo selección** | `editable: false` | Rejilla con selección, copiar, «Ver original»/«Mostrar cambios» e inserción; **sin** edición, eliminar, cambio de hablante, gestor de hablantes ni deshacer |
| **Solo lectura** | `editable: false`, `selectable: false` | **Lista simple** `<ol>` desplazable con `tabindex="0"` (como el panel F1): hora, hablante y texto corregido con sus marcas; sin barra ni inserción |
| **Compacto** | `compact` (+ `editable`) | Sin columna de selección, sin inserción, sin gestor de hablantes y **sin la línea visible** de ayuda de teclado (la rejilla la conserva como descripción, oculta). Conserva editar, eliminar/restaurar, volver al original, cambiar hablante, deshacer/rehacer, copiar y «Mostrar cambios» |

### 22.4 Estructura

```html
<div class="g-transcript" data-mode="edit" id="ID">                         <!-- data-mode: edit | select | read; + data-compact -->
  <p class="g-transcript__note">El motor no distingue hablantes…</p>       <!-- solo sin diarización en conversación (§23.7) -->
  <div class="g-transcript__bar" role="group" aria-label="Acciones de la transcripción">   <!-- §22.10 -->
    <GCheckbox class="g-transcript__all" :field="false" … />  <span class="g-transcript__count">3 seleccionados</span>  <GBtn …/> …
  </div>
  <div class="g-transcript__scroll" style="--_max-height: …">              <!-- contenedor de desplazamiento propio; no es tabulable -->
    <div class="g-transcript__grid" role="grid" aria-labelledby="TITLE" aria-describedby="ID-kbd" aria-multiselectable="true">
      <div class="g-transcript__head" role="rowgroup">
        <div role="row">                                                    <!-- encabezados ocultos visualmente (texto oculto accesible) -->
          <span role="columnheader">Selección</span><span role="columnheader">Hora</span>
          <span role="columnheader">Hablante</span><span role="columnheader">Texto</span><span role="columnheader">Acciones</span>
        </div>
      </div>
      <div class="g-transcript__body" role="rowgroup">
        <div class="g-transcript__row is-corrected is-selected" role="row" aria-selected="true" data-id="SEGID">
          <div class="g-transcript__cell g-transcript__cell--select" role="gridcell"><GCheckbox :field="false" … tabindex="-1" /></div>
          <div class="g-transcript__cell g-transcript__cell--time" role="rowheader"><time datetime="PT3S">00:03</time></div>
          <div class="g-transcript__cell g-transcript__cell--speaker" role="gridcell">
            <GBtn class="g-transcript__speaker" aria-haspopup="menu" aria-expanded="false" tabindex="-1">
              <span class="g-transcript__mark" aria-hidden="true">A</span>Profesional (A)<span class="g-transcript__sr">, cambiar hablante</span>
            </GBtn>
          </div>
          <div class="g-transcript__cell g-transcript__cell--text" role="gridcell" tabindex="0">   <!-- la única parada: tabindex="0" en una sola celda -->
            <span class="g-transcript__text">Texto corregido…</span>
            <span class="g-transcript__flags"><span class="g-transcript__flag g-transcript__flag--corrected"><svg class="g-icon" aria-hidden="true">pencil</svg>Corregido</span>…</span>
            <div class="g-transcript__orig" hidden>                              <!-- original y cambios, §22.9; un <p> por línea -->
              <p>Original del motor: …</p>
              <p>Cambios: <span class="g-transcript__diff">… <del><span class="g-transcript__sr">(eliminado: </span>dolor<span class="g-transcript__sr">)</span></del> <ins>…</ins> …</span></p>
            </div>
          </div>
          <div class="g-transcript__cell g-transcript__cell--actions" role="gridcell">
            <GBtn icon class="g-transcript__actions" aria-haspopup="menu" aria-expanded="false" aria-label="Acciones del fragmento de las 00:03" tabindex="-1">ellipsis-vertical</GBtn>
          </div>
        </div>
        <div class="g-transcript__row is-partial" role="row" data-id="SEGID">…</div>   <!-- provisional: última fila, §22.7 -->
      </div>
    </div>
  </div>
  <GBtn class="g-transcript__newer" hidden>3 fragmentos nuevos · Ir al final</GBtn>
  <p class="g-transcript__kbd" id="ID-kbd">Teclado: …</p>                     <!-- hidden en compacto (sigue describiendo) -->
  <section class="g-transcript__speakers" id="ID-speakers" aria-labelledby="ID-speakers-title" hidden>…</section>   <!-- §23.5 -->
  <section class="g-transcript__insert" aria-labelledby="ID-insert-title">…</section>                               <!-- §24 -->
  <div class="g-transcript__live" role="status" aria-live="polite" aria-atomic="true"></div>                          <!-- solo sin anfitrión (§22.12) -->
</div>
```

- Vacío: **un `<p class="g-transcript__empty">`** (`labels.transcript.empty`) en lugar de la rejilla (la barra y la inserción no se pintan).
- La celda que recibe el foco: el **control** si la celda tiene uno solo (casilla, botón de hablante, botón de acciones) y la **propia celda** en hora y texto (APG). `GCheckbox` y `GBtn` reciben `tabindex` por `$attrs` (van al `<input>` y al `<button>`).
- **Hablante sin botón** (solo selección, provisional): `<span class="g-transcript__speaker">` con la misma marca y la etiqueta; en el **fallido**, la celda de hablante va vacía y la de texto lleva solo `__flags` con `__flag--failed` (sin `__text`).
- **Marca de letra:** `__mark` con la letra; «Sin asignar» con `is-unassigned` y **sin letra** (vacía); `data-cat="k"` **solo** si `k ≤ speakerColors` (§23.6).
- **Editor:** `__editor` (`role="group"`) > `textarea.__field` + `p.__editor-orig` + `p.__editor-hint` + `div.__editor-actions`; la fila lleva `is-editing`.
- **Gestor e inserción:** el título `h{headingLevel}` es **hijo directo** de `__speakers` / `__insert`; marcado detallado en §23.5 y §24.5.
- Cualquier hijo con `hidden` dentro de la raíz queda oculto (`__kbd` en compacto, `__newer`, `__speakers` cerrado).
- **Solo lectura:** `<ol class="g-transcript__list" tabindex="0" aria-labelledby="…">` con `<li class="g-transcript__item">` y las mismas partes (`__time`, `__speaker` como texto, `__text`, `__flags`) y los mismos estados `is-*`.

### 22.5 Columnas, estados de fila y marcas

| Columna | Rol | Contenido | Cuándo |
| --- | --- | --- | --- |
| Selección | `gridcell` | `GCheckbox` **`:field="false"`** (sin región de mensaje ni contexto de `GForm`, #262; nombre `labels.transcript.row.select` con `{time}` en `aria-label`) | `selectable` y no `compact`. Vacía en el provisional y los fallidos |
| Hora | **`rowheader`** | `<time>` `mm:ss` relativo al inicio del audio capturado | Siempre (el lector la dice al cambiar de columna) |
| Hablante | `gridcell` | `GBtn` con marca de letra (`aria-hidden`), etiqueta y sufijo oculto `labels.transcript.row.changeSpeaker` → `GMenu` (§23.3). Sin `editable`: texto, sin botón | Conversación, **salvo** `expectedSpeakers === 1` sin que el motor distinga más de uno ni haya reasignaciones |
| Texto | `gridcell` (enfocable) | Corregido + marcas + original/cambios, o el editor | Siempre |
| Acciones | `gridcell` | `GBtn icon` `ellipsis-vertical` (`labels.transcript.row.actions` con `{time}`) → `GMenu` | Confirmados (no provisional ni fallidos) |

**Estados de fila** (clases; además `aria-selected` en las seleccionables): `is-partial`, `is-corrected`, `is-speaker-changed`, `is-removed` (texto tachado), `is-failed`, `is-selected`, `is-editing`, `is-stale` (cambió después de insertarlo). Mientras haya cambio, la fila lleva sus marcas.

**Marcas** (texto + icono, **nunca solo color ni solo estilo**, WCAG 1.4.1; en la celda de texto, **después** del texto):

| Marca | Icono | Texto | Cuándo |
| --- | --- | --- | --- |
| Corregido | `pencil` | `labels.transcript.flags.corrected` | `corrected !== null` |
| Hablante cambiado | `users` | `flags.speaker` (`{speaker}` = etiqueta del motor) | §21.2 |
| Eliminado | `trash` | `flags.removed` | `removed` (además, tachado) |
| Usado en | `text-cursor-input` | `flags.used` (`{targets}` = etiquetas unidas con coma) | Tiene usos |
| Cambió después de insertarlo | `triangle-alert` | `flags.stale` | §21.6 |
| Provisional | — | `labels.transcript.partialFlag` (F1) + prefijo oculto `partialPrefix` | Fila del provisional |
| Fallido | `triangle-alert` | `labels.transcript.failed` (F1) | `failed` (sin casilla ni acciones; «Reintentar fragmento» sigue en el panel de la F1) |

### 22.6 Edición en la celda (#244, #252)

1. **Intro o F2** en la celda de texto o de hora (o doble clic en el texto, o «Editar texto» del menú de la fila) abren el **editor** dentro de la celda de texto: `role="group"` (`labels.transcript.editor.group` con `{time}`), `textarea` nativo con el **corregido** y el cursor al final (`editor.field` con `{time}` como nombre; descrito por el original y la ayuda), el **original del motor** debajo (`diff.original`), la ayuda `editor.hint` y los botones «Guardar» / «Cancelar» (`editor.save`, `editor.cancel`).
2. **Intro guarda** (un fragmento no tiene saltos de línea) y el foco vuelve a la celda. **Esc cancela** sin guardar con `preventDefault()` + `stopPropagation()`: no cierra el panel, la hoja ni un `GDialog` (#143). Tab recorre `textarea` → Guardar → Cancelar.
3. **Salir del editor guarda** (el foco va a otro elemento de la página): convención de las rejillas editables; evita borradores huérfanos y es reversible. **No** guarda si la ventana pierde el foco (cambiar de aplicación): el editor sigue abierto.
4. Un editor a la vez por vista. No se edita un eliminado, el provisional ni un fallido.
5. Resultado anunciado (§22.12): `announce.edited` · `announce.emptied` (vacío = eliminado) · nada si no cambió.
6. **El editor nunca se repinta** mientras está abierto (§22.7).
7. No se edita «en línea siempre» (un campo por fila): rompería la navegación de la rejilla y multiplicaría las paradas.

### 22.7 Mientras llegan fragmentos

1. **El provisional es su propia fila** (la última), con la clave del `id` de su fragmento: no se edita, no se selecciona y no cambia de hablante; marca visible y prefijo oculto (F1). Cuando llega su `final`, **la misma fila** pasa a confirmada en su sitio (si tenía el foco, lo conserva).
2. **El editor nunca se repinta:** cada celda se reescribe solo si cambia lo que muestra; con el editor abierto, la celda de texto de ese fragmento queda **congelada** aunque cambie su hablante (`relabel`), sus marcas o el resto de la lista; insertar filas no mueve la fila editada en el DOM (no pierde el foco, el borrador ni el cursor).
3. **Seguir el final:** la lista se desplaza sola al final **solo** si ya estaba al final (margen `TRANSCRIPT_LIMITS.followMargin`) y no hay foco en otra fila, editor ni menú abiertos (WCAG 2.4.11: nunca se saca de la vista lo enfocado). Si no, aparece **«N fragmentos nuevos · Ir al final»** (`labels.transcript.newer`, plural; `GBtn`; **no** es región viva), que lleva el foco a la última fila.
4. Un `relabel` del motor con el editor abierto en otro fragmento no toca el borrador ni el foco.

### 22.8 Selección y copia

1. **Selección de fragmentos** (`v-model:selected`): casilla por fila (puntero y táctil, sin arrastre: WCAG 2.5.7); **Mayús+clic** en la casilla marca el rango desde la última marcada; teclado en §22.11; «Seleccionar todo» con estado mixto y contador visible (**no vivo**). **Todas las `GCheckbox` de la vista van con `:field="false"`** (#262): no son campos del formulario (§24.7) y no pintan región de mensaje. **Cambios de más de `TRANSCRIPT_LIMITS.selectionBatch` filas** (Ctrl+A, «Seleccionar todo», un rango largo): `selected`, `update:selected`, el contador y la inserción cambian **en el acto**; el pintado de las filas va primero a las visibles y a la enfocada y el resto en tramos de ese tamaño por fotograma (#263). Seleccionables: confirmados, también eliminados (para «Restaurar selección»).
2. **Acción sobre la fila o la selección:** si la fila enfocada está seleccionada y hay más de una, Supr y el menú de hablante actúan sobre **toda la selección**; si no, sobre la fila.
3. **Selección de texto** (ratón o selección nativa, dentro de uno o varios fragmentos): Grana la **mapea** a `{ id, start, end, text }[]` sobre el texto corregido (el texto de la fila es siempre el corregido, así que el mapeo es 1:1; los bloques de original y cambios y las marcas se excluyen). Una **selección nueva** pasa a ser la fuente de la inserción (§24.3); la elección manual de fuente se respeta mientras la selección no cambie. Espera de `selectionchange`: `TRANSCRIPT_LIMITS.selectionDebounce`.
4. **Copiar** (`navigator.clipboard.writeText`, contexto seguro; `copy: true`): barra «Copiar» → `GMenu` con «Copiar texto» (`bar.copyText`) y «Copiar con hablantes y horas» (`bar.copyFull`), sobre la selección o, sin ella, todo; menú de fila «Copiar fragmento»; **Ctrl/Cmd+C** en la rejilla **sin** texto seleccionado copia las filas seleccionadas (o la enfocada). **Copia nativa** de un texto seleccionado en la vista: Grana intercepta `copy` y escribe **texto limpio** (sin horas, marcas, original ni prefijos ocultos). Fallo del portapapeles → `announce.copyFailed`.
5. La composición es la de §21.7.

### 22.9 Original y cambios

- **«Ver original»** (menú de la fila, `menu.showOriginal` / `menu.hideOriginal`) y **«Mostrar cambios»** (barra, `GBtn` con `aria-pressed`, `git-compare`) muestran, **debajo del texto** y en un bloque aparte (`g-transcript__orig`): `diff.original` + el literal; `diff.changes` + la **diferencia por palabras** (literal → corregido; subsecuencia común más larga sobre palabras separadas por blancos) con `<del>` y `<ins>`, y `diff.originalSpeaker` si el hablante cambió.
- Cada `<del>`/`<ins>` lleva su texto **envuelto en un prefijo y un sufijo ocultos**, sacados de `labels.transcript.diff.deleted` / `diff.inserted` (plantillas con `{text}`: lo que va antes de `{text}` es el prefijo y lo que va después, el sufijo), porque los lectores no anuncian `del`/`ins` de forma fiable. El tachado y el subrayado no son la única señal.
- El texto principal de la fila es **siempre el corregido**: el bloque es complementario y no participa en la selección de texto ni en la copia.
- Por encima de `TRANSCRIPT_LIMITS.diffCells` (producto de palabras de ambos textos) la diferencia se muestra como un solo `<del>` del literal y un `<ins>` del corregido (el cálculo no bloquea la página).

### 22.10 Barra (#255)

`role="group"` (`labels.transcript.bar.label`). Botones `GBtn` (§28.3), en este orden, según el modo:

| Control | Cuándo | Detalle |
| --- | --- | --- |
| «Seleccionar todo» (`GCheckbox`, mixto) + contador | `selectable`, no `compact` | Contador `bar.count` (plural) o `bar.countNone`; no es región viva |
| «Asignar hablante» → `GMenu` | `selectable` + `editable`, no `compact`, en conversación | Sobre la selección; `menuitemradio` por hablante + «Nuevo hablante» |
| «Eliminar selección» / «Restaurar selección» | `selectable` + `editable`, no `compact` | El nombre cambia según la selección (si todos están eliminados, restaurar) |
| «Deshacer» · «Rehacer» | `editable` | `aria-keyshortcuts` (`Control+Z` · `Control+Shift+Z`; en Mac, `Meta+…`), descripción oculta `bar.undoWhat` / `bar.redoWhat` con `{what}` (`history.*`) o `bar.nothingUndo` / `bar.nothingRedo`; con la pila vacía, **`aria-disabled="true"`** (siguen enfocables; #236) |
| «Copiar» → `GMenu` | `copy` | §22.8 |
| «Mostrar cambios» | siempre (salvo solo lectura) | `aria-pressed` |
| «Hablantes» | `editable`, no `compact`, en conversación | Disclosure (`aria-expanded`, `aria-controls` → `__speakers`) |

**Contenedor estrecho** (C3 de kiwi; umbral medido por coco, #258): cuando el ancho de la raíz baja de **`space × 160`** (medido en ejecución con el valor de `--g-space-1`, como el umbral de la hoja de la F1; la raíz lleva entonces **`data-narrow`**, que también apila las filas, §22.14), **Copiar, Mostrar cambios y Hablantes** pasan a un `GMenu` **«Más»** (`bar.more`, `chevron-down` como «Más» de `GTabs`): «Copiar texto» y «Copiar con hablantes y horas» como `menuitem`, «Mostrar cambios» como `menuitemcheckbox`, «Hablantes» como `menuitem` que abre el gestor y lleva el foco a su título. Con 120 la barra ocupaba 3 líneas entre 480 y ~600px; con 160 nunca pasa de 2 desde 440px y deja margen a traducciones largas (`estilo.md` «Fase 2», decisión 1). bruno mide **fuera del callback del `ResizeObserver`** (en `requestAnimationFrame`): cambiar el atributo dentro del callback da «ResizeObserver loop completed…» en WebKit.

Debajo de la rejilla, la **línea de ayuda de teclado** visible (`labels.transcript.keyboard`), referida por `aria-describedby` de la rejilla.

### 22.11 Teclado (rejilla; APG *data grid*)

| Tecla | Acción |
| --- | --- |
| Tab / Mayús+Tab | Entra y sale de la rejilla (**una** parada); en el editor, recorre `textarea` → Guardar → Cancelar |
| ↑ ↓ | Fila anterior / siguiente, misma columna |
| ← → | Columna anterior / siguiente (lógicas: en RTL, invertidas) |
| Inicio / Fin | Primera / última columna de la fila |
| Ctrl+Inicio / Ctrl+Fin | Primera / última fila |
| RePág / AvPág | `TRANSCRIPT_LIMITS.pageRows` filas |
| Intro / F2 | Texto u hora: editar. Hablante o acciones: abre su menú (nativo del botón). Casilla: nada |
| Espacio | Casilla: marca. Otra celda: alterna la selección de la fila |
| Mayús+Espacio · Mayús+↑/↓ | Alterna la fila · amplía la selección |
| Ctrl/Cmd+A | Selecciona todo; otra vez, nada (anuncia el resultado) |
| Supr / Retroceso | Elimina (o restaura, si ya lo estaba) la fila o la selección |
| Ctrl/Cmd+Z · Ctrl/Cmd+Mayús+Z · Ctrl+Y | Deshacer · rehacer, **solo con el foco en la rejilla y fuera del editor** (en el `textarea` manda el deshacer nativo del texto) |
| Ctrl/Cmd+C | Sin texto seleccionado: copia la selección o la fila |
| En el editor: Intro · Esc | Guardar · cancelar |
| En un menú | `GMenu` (APG): ↑ ↓ Inicio Fin, Intro/Espacio elige, Esc cierra y vuelve al botón (sin cerrar panel ni diálogo), Tab cierra |

**Sin atajos de una sola tecla fuera de la rejilla** (WCAG 2.1.4: los de la rejilla solo actúan con ella enfocada). Con `event.isComposing` no se trata ninguna tecla (IME). Siempre hay **un solo** `tabindex="0"` en la rejilla.

### 22.12 Lector de pantalla y anuncios (WCAG 4.1.3)

1. **Nombres:** rejilla con `labelledby`/`label` y descrita por la ayuda de teclado; `aria-multiselectable` con selección; cabecera de fila = hora; botones de fila con la hora del fragmento en el nombre; editor nombrado y descrito por el original.
2. **Canal:** dentro de una sesión (el transcript es el de `speech.state.transcript` y hay anfitrión), `GTranscript` **usa los canales del anfitrión** (F1 #219: un solo par por gestor, que se traslada al modal). **Sin anfitrión** (transcript guardado, o gestor sin anfitrión montado) monta **una** región `role="status"` propia (`g-transcript__live`), **presente y vacía desde el montaje**, con la misma escritura (vaciar y escribir en el siguiente ciclo). Nunca más de una por vista; ninguna en la rejilla. **Los `GBtn` de la vista no pintan `g-btn__status`** (ninguno lleva `loadingText`, #257): no hay otras regiones vivas.
3. **Qué se anuncia** (cortés, **uno por acción; si se encadenan, gana el último**, agrupado con `announceGroupMs`): resultado de una acción cuyo efecto no está en el punto de foco o no se ve ahí (corregido, vaciado = eliminado, eliminado/restaurado con número si son varios, vuelta al original, hablante asignado, rol, unir/separar, hablante añadido, deshacer/rehacer con la acción, selección masiva por Ctrl+A o rango, copiado o fallo, insertado en un destino «puedes deshacerlo», inserción deshecha o no deshacible, cambios mostrados/ocultos).
4. **Nunca:** provisionales, confirmados nuevos, `relabel` del motor, «N fragmentos nuevos», mover el foco, marcar una casilla (el lector ya lee el estado) y **ningún texto transcrito** en ningún anuncio (los anuncios dicen la hora del fragmento, no su contenido).

### 22.13 Foco (WCAG 2.4.3, 3.2.2)

- **Nada lo mueve por sí solo**: ni confirmados nuevos, ni `relabel`, ni inserciones, ni cambios hechos en otra vista.
- Guardar o cancelar → la celda de texto. Eliminar o restaurar → se queda en la fila. Cerrar un menú → su botón. «Ir al final» → la última fila.
- **Deshacer/rehacer** desde la rejilla → a la primera fila afectada (misma columna); desde la barra → el foco se queda en el botón y la fila se desplaza a la vista.
- Si la fila enfocada desaparece (cambio de `transcript`), el foco va a la primera fila; si la rejilla queda vacía, a su nombre si es enfocable o a la raíz (`tabindex="-1"`), nunca a `body`.

### 22.14 Ancho estrecho y móvil

Las filas se **apilan por el ancho de `GTranscript`**, nunca por el visor (como #69/#130), con el **mismo atributo medido `data-narrow`** (bajo `space × 160`, #258) y no con una consulta de contenedor: una consulta no admite `var(--g-space-1)` y un ancho literal no está permitido. Apiladas: arriba casilla · hora · hablante · acciones; debajo, el texto a todo el ancho. La etiqueta del hablante se parte en vez de recortarse. Objetivos ≥ 24px (≥ 44px con `pointer: coarse`, los de `GBtn`/`GCheckbox`). Los menús se recolocan dentro del visor (`GMenu`); la barra pasa a «Más» (§22.10) y la inserción se apila. Sin desbordamiento horizontal a 320px.

## 23. Hablantes y roles (#247)

1. **Participantes previstos** (`expectedSpeakers` 1 · 2 · `'many'`, F1) siguen siendo una **pista** al motor y deciden si la columna de hablante aparece desde el principio (§22.5).
2. **Etiquetas neutras** por orden de aparición: «Hablante A/B/C» (`labels.speaker` con `{letter}`, F1). **Los ids del motor son opacos y nunca se muestran** (ni en la interfaz, ni en anuncios, ni en la composición). **Sin nombres propios**: el brief pide no asumir identidad; los roles los pone quien revisa. Con rol, la etiqueta es **«Rol (A)»** (`labels.speakerRole` con `{role}` y `{letter}`): la letra se conserva para distinguir dos hablantes con el mismo rol. Sin hablante: `labels.unassigned` (F1).
3. **Roles:** lista **de la aplicación** (`roles: [{ id, label }]`, opción del gestor o prop; **sin valores por defecto**), asignados **por hablante** en el gestor de hablantes (`GSelect` con etiqueta `speakers.role` y `{speaker}`; opción vacía `speakers.noRole`). El rol vive en `speakers[].role` (dato). Lista vacía: sin selector de rol.
4. **Reasignar un fragmento:** menú del hablante (`GMenu`): `menuitemradio` por hablante visible con el actual marcado, «Nuevo hablante» (`menu.newSpeaker`) y, si se cambió, «Volver al del motor (Hablante B)» (`menu.engineSpeaker` con `{speaker}`). Cambia `speaker`, **nunca** `engineSpeaker`; marca «Hablante cambiado». Con selección, sobre la selección (§22.8) o desde «Asignar hablante» de la barra.
5. **Gestor de hablantes** (disclosure «Hablantes», sección `__speakers` con título de `headingLevel` como hijo directo, `speakers.title`, y ayuda `speakers.help` en un `<p>` hijo directo; hablantes en una `<ul>` de `li.__speaker-row` con `span.__speaker` —marca y etiqueta—, un `<span>` para el recuento o «Unido a …», los `GSelect` y los botones; «Añadir hablante» en un `<div>` propio al final): por hablante visible, marca, etiqueta, número de fragmentos (`speakers.count`, plural), rol, **«Unir con»** (`GSelect`, `speakers.mergeWith`) + **«Unir»** (`merge`); en los unidos, «Unido a {speaker}» + **«Separar»** (`split`); al final **«Añadir hablante»** (`user-plus`).
   - **Unir** (el motor partió a una persona en dos): `mergeSpeakers` (§21.4); deshacer lo revierte.
   - **Separar** a una persona que el motor juntó con otra **no es automático** (no hay información para hacerlo): se seleccionan sus fragmentos y se asignan a un hablante nuevo («Asignar hablante» → «Nuevo hablante»).
6. **Sin depender del color** (WCAG 1.4.1): cada hablante se distingue por **texto** (etiqueta) y por una **marca de forma con su letra** (`g-transcript__mark`, `aria-hidden`: el texto ya la dice). **Color por hablante: solo complemento y solo si la aplicación lo declara** con `speakerColors` (§1.1): el hablante en la posición `k ≤ speakerColors` lleva `data-cat="k"` en su marca y coco lo pinta con la familia `--g-color-cat-k` (`tokens.md` §16.3); por encima de `speakerColors`, o con `0` (por defecto), sin color. «Sin asignar» lleva una marca de **borde discontinuo**.
7. **Motor sin diarización** (`diarization: false`), en conversación: aviso visible en la vista (`labels.transcript.noDiarization`, `g-transcript__note`, no región viva), todos «Sin asignar», asignación por fragmento o por selección a hablantes creados por el usuario (`origin: 'user'`). Sin la marca «Hablante cambiado» cuando el motor no dio ninguno.
8. **`speakers.relabel` del motor** solo afecta a la capa literal (§21.8).

## 24. Destinos (#248)

Cambio sobre lo reservado en la F1 (§18: `{ id, label, insert(text) → { undo() } }`): **el destino se liga al modelo del formulario, no al DOM**. Con `get`/`set`, Grana resuelve igual para todas las aplicaciones la posición, los separadores, el deshacer seguro y la marca de uso, y el destino funciona **con el campo desmontado** (otra pestaña o paso). `insert` queda como **vía de escape** para destinos que no son texto plano.

### 24.1 Forma

```ts
interface SpeechTarget {
  id: string                 // único en el registro; recomendado: el `name` del campo en `useFormField`
  label: string              // nombre visible del campo («Plan»)
  get?(): string             // valor actual del modelo de la app (el mismo que usa su v-model)
  set?(value: string): void  // escribe el modelo de la app
  field?: string             // id del control, solo para recordar su cursor y su selección
  multiline?: boolean        // false: campo de una línea (los saltos pasan a espacios). Default true
  insert?(text: string, ctx: { position: 'end' | 'cursor' }): { undo(): boolean }   // vía de escape
}
```

Obligatorio: `id`, `label` y **o** `get` + `set` **o** `insert` (si hay los dos, manda `insert`). Sin ellos: el destino se rechaza con aviso.

### 24.2 Registro

- **Con gestor:** `speech.targets.register(target)` → función para darlo de baja; `speech.targets.list` (reactiva, de solo lectura, por orden de registro). Un `id` ya registrado: aviso y **sustituye** al anterior (el último que se monta manda).
- **`useSpeechTarget(target, { speech? })`** (composable): registra en `onMounted` y da de baja en `onBeforeUnmount` del **componente que lo llama**; devuelve la función para darlo de baja antes. Se llama en el componente **que tiene el modelo del formulario** (la página), **no** en el campo: si lo registrara el campo, desaparecería al cambiar de pestaña. Sin gestor: aviso y no hace nada (en ese caso, prop `targets` de `GTranscript`). En el servidor no registra nada.
- **Suelto:** `<GTranscript :targets="[…]">`.

### 24.3 Qué se inserta

`GSelect` «Qué» (`insert.what`; hasta que exista `GRadioGroup`, como #181): **«Todo (N)»** (`insert.all`, plural) · **«Fragmentos marcados (N)»** (`insert.segments`, plural; deshabilitada sin selección) · **«Texto seleccionado «…»»** (`insert.text` con `{text}` recortado a `TRANSCRIPT_LIMITS.quoteChars`; sin selección de texto, `insert.textNone`, deshabilitada). Por defecto, **la fuente más específica disponible**; una selección nueva la activa (§22.8). Además, en el menú de cada fila, **«Insertar en {target}»** por destino (`menu.insert`): ese fragmento, al final.

### 24.4 Dónde

`GSelect` «Campo» (`insert.target`) con los destinos y `GSelect` «Dónde» (`insert.where`):

| Posición | Cuándo | Separadores |
| --- | --- | --- |
| **Al final** (`insert.end`, **por defecto**: predecible) | Siempre | Salto de línea delante (espacio en una línea) si el valor no acaba en blanco |
| En la posición del cursor (`insert.cursor`) | Solo si Grana conoce el cursor del campo (`field`) **y el valor no cambió desde entonces**; si no, **deshabilitada** con `insert.cursor` + `insert.unknown` | Un espacio a cada lado si hace falta, **pero no delante de un signo de cierre** (`. , ; : ! ? ) ] } » ” …`) **ni detrás de uno de apertura** (#263) |
| Sustituir la selección del campo (`insert.selection`, con `{text}` = lo seleccionado) | **Solo aparece** con una selección conocida y el valor sin cambios; sin ella la opción **no se muestra** (no hay frase sin `{text}`, así que no hace falta otra clave; #263) | Ídem |

Grana recuerda cursor y selección de cada `field` al teclear, seleccionar o salir del campo (escuchas de documento **solo** mientras haya una inserción montada). **Con `insert`**, «Dónde» ofrece «Al final» y «En la posición del cursor» (el destino resuelve su propio cursor o selección); Grana no calcula separadores.

### 24.5 «Con hablantes» y vista previa

- **«Con hablantes»** (`GCheckbox` `:field="false"`, #262; `insert.withSpeakers`): **activada por defecto en conversación** (sin prefijo, las palabras de dos personas se mezclan y se pierde quién dijo qué); no aparece en dictado ni con «Texto seleccionado» (es una cita, §21.7).
- **Vista previa** del texto exacto antes de insertar (WCAG 3.3.4: comprobar antes de enviar); `insert.nothing` si no hay texto. Marcado (#259): un **`<p>` rótulo** (`insert.preview`, con `id`) justo antes de **`__preview`**, que lleva **`tabindex="0"`, `role="region"` y `aria-labelledby` al rótulo** (se desplaza con alto máximo y debe poder desplazarse con el teclado, WCAG 2.1.1); **no** es región viva.
- **Orden de los hijos directos de `__insert`:** título, los tres `GSelect`, `GCheckbox` «Con hablantes», rótulo y `__preview`, el botón en un `<div>`, `p.__result` (`circle-check` + texto + «Deshacer inserción») y `__uses` (`<details>` con `<summary>` y una lista, o directamente la lista).
- Botón principal con el destino en el nombre: **«Insertar en Plan»** (`insert.go` con `{target}`, icono `text-cursor-input`).

### 24.6 Deshacer la inserción

- Cada inserción guarda el valor anterior y el posterior del destino. **Solo la última inserción de cada destino se puede deshacer, y solo si el destino no cambió después** (`get()` sigue devolviendo el valor posterior; regla del deshacer del dictado F1, #222). Con `insert`, decide su `undo()` (`false` = no se pudo).
- Aparece junto al resultado (`insert.done` con `{target}` y `{what}` + **«Deshacer inserción»**, `insert.undo`) y en **«Usos de esta transcripción»** (`insert.uses`; cada uso `insert.use` con `{target}`, `{what}`, `{time}`).
- Si el destino cambió: **no toca nada** y anuncia `announce.insertUndoFailed`. Deshacer quita el uso de `derived` y la marca de los fragmentos; emite `undo-insert`.
- **No entra** en el historial de la revisión (§21.5). El resultado no es un `GToast`: un aviso efímero con acción violaría el tiempo suficiente (WCAG 2.2.1) para deshacer.

### 24.7 Efecto en el formulario

- **El foco se queda en «Insertar»** (no se roba al campo, WCAG 3.2.2); el campo montado se actualiza por su `v-model`.
- Marca **«Usado en»** en cada fragmento usado (también con texto parcial) y **«Cambió después de insertarlo»** si se corrige luego (§21.6). **Nada se propaga solo** al campo.
- **Formularios (`GForm`, `useFormField`): sin API nueva en los campos.** La inserción escribe en el modelo; la validación de la aplicación reacciona al valor como a cualquier cambio programático (no lo marca como «tocado»: insertar no revela errores). `GErrorSummary` no cambia. `GTranscript` dentro de un `GForm` **no es un campo** (sin `name` ni valor de formulario).

## 25. Dónde vive (#249)

1. **En el panel del anfitrión, durante la conversación:** `GTranscript compact` sustituye a la lista de solo lectura de la F1 (§6.4, §6.5), nombrado por el título del panel `__transcript`. Se puede corregir, eliminar, cambiar de hablante y deshacer **mientras se graba**. Acción nueva en el panel: **Revisar** (§6.4).
2. **Revisión en la página (recomendada):** la aplicación coloca `<GTranscript :transcript="speech.state.transcript" labelledby="…">` junto a su formulario (solo ella conoce su maquetación; un panel superpuesto taparía campos, WCAG 2.4.11). Un `GTranscript` **montado, no compacto y ligado al transcript de la sesión** se registra (interno) como **superficie de revisión**; si hay varias, la última montada. **«Revisar» / `speech.review()`** cierra el panel (sin devolver el foco a quien lo abrió) y lleva el foco **al elemento de `labelledby`** (Grana le pone `tabindex="-1"` solo si no es enfocable) o, sin él, a la celda activa de la rejilla, y lo desplaza a la vista.
3. **Diálogo de respaldo del anfitrión** (sin superficie registrada): «Revisar» abre un **`GDialog` real** del anfitrión (`class="g-speech-review"`, que va al `<dialog>` y con la que `GSpeechHost.css` fija el alto de su rejilla, #259; `size="lg"`, `mobile="fullscreen"`, `title` = `labels.review.title`, `closeLabel` = `labels.review.close`) con un `GTranscript` editable del mismo transcript y los mismos destinos (se insertan por el modelo aunque el formulario quede inerte detrás). Al abrir, el foco va al **título del diálogo** (`tabindex="-1"`); al cerrar, a «Revisar» (o a la pill visible si ya no existe). Los canales vivos se trasladan a él (F1 §6.6, #141). **Esc en el editor o en un menú no lo cierra**; Esc en la rejilla, sí (`dismiss` de `GDialog`).
4. **Sin sesión:** `createTranscript(json)` carga lo que guardó la aplicación (correcciones, roles, usos) y `GTranscript` funciona igual (editable, solo selección o solo lectura), con su propia región de estado (§22.12) y el historial vacío.
5. **Dictado: sin cambios** (F1 #222): inserción en vivo al cursor y «Deshacer dictado»; el panel conserva la lista de solo lectura (corregir se hace en el propio campo).
6. **Cierre y descarte de una conversación:** `close()` entrega `toJSON()` con las tres capas a `onComplete`. **Descartar con usos:** los textos insertados **se quedan** en los campos (ya son de la aplicación); la confirmación lo dice (`actions.discardAskUsed`, §6.4).
7. **Sesiones de horas** y transcript a pantalla completa en móvil siguen siendo F3 (§18); el diálogo de respaldo ya es pantalla completa en móvil.

## 26. Rendimiento (#250)

1. **Sin virtualizar en la F2.** Una lista virtual rompería lo que la revisión necesita: **buscar con Ctrl+F**, **seleccionar texto** de varios fragmentos con el ratón, la **copia nativa**, la **lectura completa** con el lector y **anclas estables** para el foco itinerante. Con cientos de fragmentos el coste es aceptable si **solo se repinta lo que cambia**: filas con clave, **celdas que solo se reescriben si cambia lo que muestran**, provisional en su fila, menús creados al abrirse, barra e inserción que solo rehacen su estructura si cambia algo que no sea texto (un `GSelect` abierto no se cierra al llegar fragmentos).
2. **Medido por kiwi en el prototipo** (Chromium, `verificar.mjs`, teclas a ritmo de repetición): **320 fragmentos** (≈ 30-40 min de conversación), ~5 800 nodos, construcción ~40 ms, **cada tecla < 40 ms hasta el pintado** (peor: Ctrl+A, que repinta 320 filas), Event Timing máximo 32–48 ms. **1000 fragmentos** (informativo): ~18 000 nodos, peor tecla ~70–80 ms. Todo por debajo de los 200 ms de INP «bueno».
3. **Medido por bruno en el componente real** (#264; Playwright, Event Timing máximo por tecla de §22.11, **un solo worker**: en paralelo el reloj salta y la medida no vale): **Chromium** 88 ms con 320 fragmentos (1000: 120 ms) · **Firefox** 56 ms · **WebKit** 128 ms (flechas solas 80–112 ms con ~12 ms de JS: el resto es estilo, maquetación y pintado del motor; **1000 fragmentos: 856 ms**). Lo que lo hace posible: celdas en un subcomponente que no se repinta al marcar la fila, **un solo `GMenu` compartido por vista** (el que se abre toma el id de su disparador; no hay 640 instancias) y la selección masiva por tramos (§22.8).
4. **WebKit** (no es Safari real) queda por encima del umbral de Chromium pero por debajo de los 200 ms de INP «bueno» con 320 fragmentos; con 1000 se pasa de largo. Por eso tiene **compuerta propia** (§31) y el umbral de virtualización de la F3 se revisará **con Safari real**: en WebKit puede hacer falta mucho antes de ~2 000.
5. **Umbral F3:** por encima de **~2 000 fragmentos** (Chromium y Firefox; WebKit, arriba) hará falta virtualizar (con `aria-rowcount`/`aria-rowindex`) y aceptar sus pérdidas. **`content-visibility: auto` por fila se descarta en la F2:** gana ~50 ms en el primer pintado pero deja filas en blanco un fotograma al saltar con el desplazamiento.
6. **Constantes de comportamiento** (no son tema; bruno las expone como `TRANSCRIPT_LIMITS` interno y las prueba, como `SPEECH_TIMING` §3.7): `history` 200 · `followMargin` 32 (px de desplazamiento; es comportamiento, no medida de interfaz) · `pageRows` 10 · `selectionDebounce` 80 ms · `quoteChars` 60 · `diffCells` 40 000 · `selectionBatch` 40 (filas por fotograma en un cambio masivo de selección, #263). Valores del prototipo; cambiarlos es decisión de lima con evidencia.
7. **Durante la captura:** un provisional repinta **una** fila; un confirmado inserta **una** fila y actualiza contadores.

## 27. Textos de la Fase 2 (`labels`, sin valores por defecto; #256)

Mismas reglas que §9: `fill` con marcadores; las claves **plural** admiten String con `{count}` o Function `(count) => String` cuyo resultado pasa por `fill` con el resto de marcadores (#237); falta una clave → aviso la primera vez que se necesita, botones con icono se dibujan igual. Las del prototipo de kiwi (`index.html`, objeto `L`) sirven de **redacción de ejemplo** para la documentación. `{time}` es `mm:ss` (o `h:mm:ss`); `{speaker}`, una etiqueta completa («Profesional (A)»); `{target}`, la etiqueta de un destino.

### 27.1 Generales y anfitrión

| Clave | Marcadores | Dónde |
| --- | --- | --- |
| `speakerRole` | `{role}`, `{letter}` | Etiqueta de un hablante con rol («Profesional (A)») |
| `actions.review` · `actions.reviewCompleted` | | Botón «Revisar» del panel (captura/pausa/reconexión) y «Revisar transcripción» (`completed`) |
| `actions.discardAskUsed` (plural) | `{count}` | Pregunta de descarte con usos |
| `review.title` · `review.close` | | Título y nombre del cierre del diálogo de respaldo |

Se reutilizan de la F1: `speaker`, `unassigned`, `transcript.title`, `transcript.empty`, `transcript.partialFlag`, `transcript.partialPrefix`, `transcript.failed`.

### 27.2 `transcript.*` (vista)

| Clave | Marcadores | Dónde |
| --- | --- | --- |
| `cols.select` · `cols.time` · `cols.speaker` · `cols.text` · `cols.actions` | | Encabezados de columna (ocultos) |
| `row.select` | `{time}` | Nombre de la casilla de la fila |
| `row.actions` | `{time}` | Nombre del botón de acciones de la fila |
| `row.changeSpeaker` | | Sufijo oculto del botón de hablante («, cambiar hablante») |
| `flags.corrected` · `flags.removed` · `flags.stale` | | Marcas |
| `flags.speaker` | `{speaker}` | Marca «Hablante cambiado (motor: …)» |
| `flags.used` | `{targets}` | Marca «Usado en …» |
| `diff.original` · `diff.changes` | | Encabezados del bloque de original y cambios |
| `diff.originalSpeaker` | `{speaker}` | Hablante del motor en el bloque |
| `diff.deleted` · `diff.inserted` | `{text}` | Envoltura oculta de `<del>` / `<ins>` («(eliminado: {text})») |
| `editor.group` · `editor.field` | `{time}` | Nombre del grupo y del `textarea` |
| `editor.hint` · `editor.save` · `editor.cancel` | | Ayuda y botones del editor |
| `menu.edit` · `menu.showOriginal` · `menu.hideOriginal` · `menu.revert` · `menu.remove` · `menu.restore` · `menu.copy` · `menu.newSpeaker` | | Menús de fila y de hablante |
| `menu.insert` | `{target}` | «Insertar en …» |
| `menu.engineSpeaker` | `{speaker}` | «Volver al del motor (…)» |
| `bar.label` · `bar.selectAll` · `bar.countNone` · `bar.assign` · `bar.remove` · `bar.restore` · `bar.undo` · `bar.redo` · `bar.nothingUndo` · `bar.nothingRedo` · `bar.copy` · `bar.copyText` · `bar.copyFull` · `bar.changes` · `bar.speakers` · `bar.more` | | Barra |
| `bar.count` (plural) | `{count}` | Contador de seleccionados |
| `bar.undoWhat` · `bar.redoWhat` | `{what}` | Descripción oculta de deshacer/rehacer |
| `history.edit` · `history.revert` | `{time}` | Nombre de la entrada del historial (para `{what}`) |
| `history.remove` · `history.restore` · `history.speaker` · `history.role` · `history.merge` · `history.unmerge` · `history.addSpeaker` | | Ídem |
| `keyboard` | | Línea de ayuda de teclado |
| `noDiarization` | | Aviso de la vista sin diarización (distinto del `noDiarization` de `ready`, F1) |
| `newer` (plural) | `{count}` | «N fragmentos nuevos · Ir al final» |
| `speakers.title` · `speakers.help` · `speakers.noRole` · `speakers.mergeWith` · `speakers.merge` · `speakers.unmerge` · `speakers.add` | | Gestor de hablantes |
| `speakers.role` | `{speaker}` | Etiqueta del `GSelect` de rol |
| `speakers.count` (plural) | `{count}` | Fragmentos del hablante |
| `speakers.mergedInto` | `{speaker}` | «Unido a …» |
| `insert.title` · `insert.what` · `insert.textNone` · `insert.target` · `insert.where` · `insert.end` · `insert.cursor` · `insert.unknown` · `insert.withSpeakers` · `insert.preview` · `insert.undo` · `insert.uses` · `insert.nothing` | | Inserción |
| `insert.all` · `insert.segments` (plural) | `{count}` | Fuentes |
| `insert.text` · `insert.selection` | `{text}` | Fuente «Texto seleccionado «…»» y posición «Sustituir la selección del campo «…»» |
| `insert.go` | `{target}` | Botón «Insertar en …» |
| `insert.done` | `{target}`, `{what}` | Resultado junto al botón |
| `insert.use` | `{target}`, `{what}`, `{time}` | Elemento de «Usos» (`{time}` = hora de la inserción en el formato de la aplicación: Grana pasa la fecha ISO por `fill`; si la aplicación quiere otro formato, usa una Function) |
| `what.segments` (plural) | `{count}` | `{what}` de fragmentos |
| `what.text` | | `{what}` de un texto seleccionado |

### 27.3 `transcript.announce.*` (§22.12)

`edited` (`{time}`) · `emptied` (`{time}`) · `removed` (plural; `{count}`, `{time}`) · `restored` (plural; `{count}`, `{time}`) · `reverted` (`{time}`) · `speaker` (plural; `{count}`, `{time}`, `{speaker}`) · `role` (`{speaker}`, `{role}`) · `merged` (`{from}`, `{into}`) · `unmerged` (`{from}`) · `added` (`{speaker}`) · `undone` (`{what}`) · `redone` (`{what}`) · `nothingUndo` · `nothingRedo` · `selected` (plural; `{count}`) · `selectedNone` · `copied` (`{what}`) · `copyFailed` · `inserted` (`{target}`, `{what}`) · `insertUndone` (`{target}`) · `insertUndoFailed` (`{target}`) · `changesShown` · `changesHidden`.

## 28. Tokens, iconos y composición (#252, #253, #254)

### 28.1 Tokens: ninguno nuevo

Confirmado en `tokens.md` §24. Todo deriva de existentes (sin valores de respaldo):

| Necesidad | Fuente |
| --- | --- |
| Fila seleccionada | `--g-color-primary-soft` (el de `GTable`) **+ borde de inicio** en `--g-color-text` (forma, no solo color; 3:1) |
| Foco de celda | `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` (interior a la celda si el contenedor recorta) |
| Provisional | El de la F1 (`--g-color-text-muted` o el que eligió coco, cursiva, **≥ 4.5:1**) |
| Eliminado | `--g-color-text-muted` + **tachado** (≥ 4.5:1) |
| `<del>` / `<ins>` | Tachado / subrayado; si coco añade color, `--g-color-danger-text` / `--g-color-success-text`, **nunca solo** |
| Marcas | Rol `caption`, `--g-color-text-muted`, con icono; «Cambió después de insertarlo» en `--g-color-warning-text` (**sobre una fila seleccionada, el texto en `--g-color-text` y el icono en `warning-text`**: `warning-text` no garantiza 4.5:1 sobre `primary-soft`, medido 3.83 en el tema por defecto oscuro; #260) |
| Marca de letra del hablante | Borde en `--g-color-border-control` (3:1); «Sin asignar», discontinuo; con `speakerColors`, **relleno `--g-color-cat-k-soft`, letra `--g-color-on-cat-k-soft` (par garantizado), borde `--g-color-cat-k-text`** (medida por coco: borde ≥ 3.94:1 sobre la fila seleccionada en el peor tema; #260). Es la **única lectura de la familia `cat-*`** en un componente: excepción nombrada **`CAT_FAMILY_READERS`** de `levels.test.js` (solo `GTranscript.css`, sin respaldo, `k` de 1 a 12) |
| Editor | La apariencia de `GTextarea` con sus mismos tokens (`border-control`, radio, foco) |
| Separaciones, ritmo, alto de fila | Derivados de `space` en el CSS de coco (`estilo.md` «Fase 2», «Valores fijados») |
| Umbral de «Más» y de apilado | **`space × 160`**, medido en ejecución → `data-narrow` (#258) |
| Objetivos | Los de `GBtn` y `GCheckbox` (≥ 24px; ≥ 44px con `pointer: coarse`) |

**Variable en línea:** `--_max-height` (prop `maxHeight`, como `GTable`). Con `speakerColors`, `data-cat` en la marca (atributo, no variable).

### 28.2 Iconos (`icons.md` §4, v0.5)

| Dónde | Icono |
| --- | --- |
| Editar texto · marca «Corregido» | `pencil` |
| Eliminar · marca «Eliminado» | `trash` |
| Restaurar · volver al original | `rotate-ccw` (ya en la lista) |
| Deshacer · rehacer | `undo-2` · `redo-2` |
| Copiar | `copy` |
| Insertar · marca «Usado en» | `text-cursor-input` |
| Mostrar cambios · ver original | `git-compare` |
| Hablantes · asignar hablante · marca «Hablante cambiado» | `users` |
| Añadir hablante · nuevo hablante | `user-plus` |
| Unir · separar | `merge` · `split` |
| Revisar (panel) | **`file-pen-line`** (#253: «revisar un documento de texto»; `pencil` ya es «editar este fragmento» y `list`, del prototipo, no dice revisar) |
| Acciones de fila · Ir al final · «Más» · cambió después · fallido · elegido | `ellipsis-vertical` · `arrow-down` · `chevron-down` · `triangle-alert` · `triangle-alert` · `check` (ya en la lista; las marcas de `GMenu` son suyas) |

Nombres canónicos **comprobados por lima** en `lucide-static` 1.49.0: cada uno tiene su módulo en `dist/esm/icons/<nombre>.mjs` con la marca `lucide-<nombre>`.

### 28.3 Composición de `GBtn` (propuesta; coco la fija en su ronda)

| Dónde | Props de `GBtn` |
| --- | --- |
| Barra (todos) | `size="sm" variant="ghost" color="neutral"`, icono en `prepend` |
| Hablante de la fila | `size="sm" variant="ghost" color="neutral"`; marca, etiqueta y sufijo en el slot |
| Acciones de la fila | `icon size="sm" variant="ghost" color="neutral"` |
| Editor: Guardar · Cancelar | `size="sm"` sólido por defecto · `size="sm" variant="outline" color="neutral"` |
| «Ir al final» · «Deshacer inserción» · Unir · Separar · Añadir hablante | `size="sm" variant="outline" color="neutral"` (como «Deshacer dictado», §13.1) |
| «Insertar en {target}» | `size="md"`, sólido por defecto, `text-cursor-input` en `prepend` |

Ninguno usa `loading` ni `loadingText`, así que **ninguno pinta `g-btn__status`** (#257): con 320 filas no hay ~640 regiones `role="status"` vacías y §22.12 («ninguna otra región viva») se cumple al pie de la letra.

**Fijada por coco** (`estilo.md` «Fase 2», «Botones»): pulsados («Mostrar cambios» con `aria-pressed`, «Hablantes» con `aria-expanded`) con relleno `neutral-soft` + borde `border-control`; Deshacer/Rehacer con `aria-disabled` en `text-subtle`; **«Más»** como la barra con **`chevron-down` en `append`** y la clase `g-transcript__more` en el `GBtn` disparador del `GMenu`; Guardar/Cancelar del editor **sin icono**; «Ir al final», «Deshacer inserción», Unir, Separar y Añadir hablante con su icono en `prepend` (`arrow-down`, `undo-2`, `merge`, `split`, `user-plus`); `GCheckbox` de tamaño por defecto. **Todo `undo-2` y `redo-2` de la vista lleva `flip-rtl`** (#261, ampliada en #263): Deshacer y Rehacer de la barra y **«Deshacer inserción»** (resultado y usos).

## 29. Clases de la Fase 2 (contrato entre bruno y coco)

| Clase o atributo | Elemento | Cuándo |
| --- | --- | --- |
| `g-transcript`, `data-mode="edit\|select\|read"`, `data-compact`, `data-narrow` | Raíz | Siempre; `data-narrow` bajo `space × 160` de ancho de la raíz: «Más» **y filas apiladas** (§22.10, §22.14; #258) |
| `--_max-height` | `__scroll` (en línea) | Con `maxHeight` |
| `__note` · `__bar` · `__all` · `__count` | Aviso sin diarización · barra · «Seleccionar todo» · contador | §22.10, §23.7 |
| `__more` | **El `GBtn`** disparador del `GMenu` «Más» (con `chevron-down` en `append`) | Con `data-narrow` |
| `__scroll` · `__grid` · `__head` · `__body` · `__row` · `__cell` · `__cell--select` · `__cell--time` · `__cell--speaker` · `__cell--text` · `__cell--actions` | Rejilla | Editable y solo selección |
| `is-partial` · `is-corrected` · `is-speaker-changed` · `is-removed` · `is-failed` · `is-selected` · `is-editing` · `is-stale` | `__row` (y `__item`) | §22.5 |
| `__speaker` (`GBtn`, o `<span>` sin botón) · `__mark` (`data-cat="k"` solo si `k ≤ speakerColors`; `is-unassigned` **sin letra**) · `__actions` | Hablante, marca y acciones de la fila | §22.4, §22.5, §23.6 |
| `__text` · `__flags` · `__flag` · `__flag--{corrected\|speaker\|removed\|used\|stale\|partial\|failed}` | Celda de texto | §22.5 |
| `__orig` (un `<p>` por línea) · `__diff` (**`<span>`** dentro del `<p>` de cambios; contiene `del`/`ins`) · `__sr` | Original y cambios; texto oculto | §22.9 |
| `__editor` · `__field` · `__editor-orig` · `__editor-hint` · `__editor-actions` | Editor (`textarea` nativo con la apariencia de `GTextarea`, #252) | §22.6 |
| `__newer` · `__kbd` · `__empty` · `__live` | «Ir al final» · ayuda · vacío · región propia | §22.4 |
| `__list` · `__item` | Solo lectura | §22.3 |
| `__speakers` · `__speaker-row` · `__insert` · `__preview` (`tabindex="0"`, `role="region"`, `aria-labelledby` al `<p>` rótulo que lo precede) · `__result` · `__uses` | Gestor de hablantes; inserción | §23.5, §24.5 |
| `g-speech-review` | `GDialog` de respaldo del anfitrión (va al `<dialog>`) | §25.3 |

Las clases de elemento no son API estable para la aplicación (#204). El CSS de la vista va en `GTranscript.css` (coco); el del panel que la contiene, en `GSpeechHost.css` (alto del área desplazable dentro del panel incluido).

## 30. Avisos de desarrollo y SSR de la Fase 2

Mismo prefijo y reglas que §15 (`[Grana Speech]`, una vez por causa, **nunca con texto transcrito**):

1. `GTranscript` sin `transcript`, o con un objeto que no es una instancia de `createTranscript`; sin `labelledby` ni `label`; `selected` con ids no seleccionables (se descartan).
2. Destino sin `id`/`label` o sin `get`+`set` ni `insert` (rechazado); dos destinos con el mismo `id` (sustituye); `useSpeechTarget` sin gestor.
3. `roles` con `id` repetidos; `setRole` con un `roleId` que la vista no encuentra.
4. Operación con un id inexistente (fragmento o hablante); `assignSpeaker` a un hablante inexistente; `mergeSpeakers` en ciclo o consigo mismo.
5. `addDerived` sin `kind` o con `kind: 'insert'`; `removeDerived` de un `insert`.
6. Escritura directa en la instancia (no soportada).
7. `createTranscript(data)`: campos desconocidos, ids de fragmento repetidos, `mergedInto` roto.
8. Un hablante del motor con prefijo `user-`; `relabel` hacia un hablante del usuario.
9. Falta un `labels.transcript.*` (o de §27.1) la primera vez que se necesita.

**SSR:** `createTranscript` y `useSpeechTarget` no tocan `document`, `window` ni `navigator`; `GTranscript` renderiza en el servidor su estructura sin leer el DOM (sin selección de texto, portapapeles ni observadores, que existen solo montado); `useSpeechTarget` registra solo en el cliente.

## 31. Verificación de la Fase 2

- **bruno** (vitest + jsdom con el adaptador simulado; **Playwright en Chromium, Firefox y WebKit** para foco, teclado, selección de texto, portapapeles, `GDialog` y 320px):
  - **API:** `GTranscript`, `createTranscript`, `useSpeechTarget` **solo en `@grana/vue/speech`** (compuerta: `! grep -q "createTranscript" packages/vue/dist/grana.js`); `app.use(speech)` registra `GTranscript`; importación en `node` sin `document`.
  - **Modelo:** capas (tras editar, eliminar, reasignar, unir, volver al original y deshacer, **el literal sigue igual**); igual al literal → `corrected: null`; vacío → `removed` (`'emptied'`); historial compartido entre dos vistas; deshacer conserva lo llegado del motor después; límite 200; `toJSON()` sin historial ni `partial`; carga de un JSON de la **F1** sin conversión; `onChange` sin texto; `addDerived` rechaza `insert`; `relabel` solo en la capa literal.
  - **Rejilla:** un solo `tabindex="0"` en todo momento; teclado de §22.11 completo; Esc en el editor y en un menú **no** cierra el panel ni el diálogo (`defaultPrevented`); salir guarda y cambiar de ventana no; IME.
  - **Edición sin pisar parciales:** con el editor abierto llegan ≥ 2 confirmados y ≥ 3 provisionales y un `relabel`: foco, borrador y cursor intactos; la otra vista refleja el guardado.
  - **Anuncios:** canales del anfitrión dentro de la sesión, **una** región propia sin anfitrión, **ninguna otra región `role="status"`/`aria-live` en la vista** (tampoco `g-btn__status`, #257); uno por acción (tres Supr seguidos → un anuncio); 0 anuncios durante la captura sin acciones; **ningún anuncio con texto transcrito**.
  - **Selección y copia:** Mayús+Espacio, Mayús+↓, Mayús+clic, Ctrl+A ida y vuelta, `aria-selected`; copiar texto y con hablantes y horas (portapapeles real en Chromium); copia nativa limpia; `copy: false`.
  - **Destinos:** inserción con el campo **desmontado** y `v-model` al montar; posiciones y separadores; `multiline: false`; deshacer solo la última y solo sin cambios (anuncio si no); `derived` y marcas; `insert` como vía de escape; `useSpeechTarget` registra y da de baja con el componente.
  - **Dónde vive:** compacto en el panel; «Revisar» con superficie (foco al título) y sin ella (`GDialog` real, foco, canales trasladados y devueltos, Esc); `discardAskUsed`; `onComplete` con las tres capas; transcript guardado sin sesión.
  - **Rendimiento (compuerta, un solo worker; #264):** 320 fragmentos, cada tecla de §22.11 (incluida Ctrl+A) con **Event Timing < 100 ms en Chromium y Firefox** y **< 200 ms en WebKit**; 1000 fragmentos < 200 ms en Chromium (informativo en Firefox y WebKit). En paralelo la compuerta no se exige (el reloj salta).
  - **Casillas sin región (#262):** ninguna `g-checkbox__message` dentro de `GTranscript`; una `GTranscript` dentro de un `GForm` `readonly` o `disabled` deja la selección operable y no registra sus casillas.
  - **320×640 con táctil:** sin desbordamiento (página, vista, menú, inserción, diálogo), fila apilada, «Más», objetivos ≥ 24/44px.
  - `check-icons.mjs` y prueba 9 de `icons.md` §7 con los 12 iconos nuevos; `flip-rtl` en todo `undo-2`/`redo-2` de la vista, incluido «Deshacer inserción» (#261, #263).
  - **Compuerta de estilo:** `grep -q "g-transcript__orig" packages/vue/dist/grana.css` (`GTranscript.css` registrado en `components.css` **después de** `GBtn.css`, `GCheckbox.css`, `GSelect.css` y `GSurface.css`).
- **coco** (auditoría con un tema distinto al de defecto, claro y oscuro; §32 «Pendientes para coco»).
- **No verificado y pendiente** (de la declaración de kiwi, §18): **lector de pantalla real** (rejilla en modo foco y lectura de corrido en exploración, doble información `aria-selected` + casilla, `<del>`/`<ins>` con envoltura, editor dentro de la celda, anuncio de selección masiva; **riesgo principal**); Firefox y Safari reales (`selectionchange`, `ClipboardEvent`, permisos del portapapeles, Esc en `<dialog>` con el editor); móvil real (selección táctil con asas, teclado virtual con el editor en la hoja); teclados no QWERTY e IME con los atajos; equipos lentos y lector activo con > 1000 fragmentos; `forced-colors`, zoom 200 %, RTL; validación real de `GForm` ante una inserción.

## 32. Resolución de los hallazgos de kiwi (r02, §19 y §20)

| Hallazgo | Resolución | Decisión |
| --- | --- | --- |
| Pregunta §20 · marca de «revisado» | **No en v0.1**; `requireReview` reservada (§18) | #241 (usuario, delegada) |
| L1 · entrega | `GTranscript`, `createTranscript`, `useSpeechTarget` en `@grana/vue/speech`; `speech.targets`; opción `roles`; además `speakerColors` y `speech.review()` | #251 |
| L2 · forma aditiva | Aceptada tal cual (§1.4, §21.6); carga de JSON F1 sin conversión | #242 |
| L3 · operaciones | Aceptadas con cambios: `assignNewSpeaker(ids)` en lugar del centinela `'new'` (choca con un id de hablante); `nextUndo`/`nextRedo`; `removeDerived`; `onChange`; ids de usuario `user-N` | #245 |
| L4 · props y eventos | Aceptados con cambios: nombre por `labelledby`/`label` (props, porque el nombre es de la rejilla y no de la raíz); `headingLevel`, `maxHeight`, `speakerColors`; evento **`change`** `{ kind, ids }` en lugar de `edit` (cubre todas las operaciones) | #246 |
| L5 · destinos | Aceptado: `{ id, label, get, set, field?, multiline? }` + `insert` de escape (con «Al final» y «En el cursor») | #248 |
| L6 · anfitrión | Aceptado; diálogo de respaldo = **`GDialog` real** (`size="lg"`, `mobile="fullscreen"`) en lugar de un `<dialog>` propio | #249 |
| L7 · evento `speakers` | Aceptado (§4.4, §21.8) | #247 |
| L8 · textos | §27, con nombres fijados por lima | #256 |
| L9 · editor en la celda | `textarea` nativo con **clases propias** (`g-transcript__field`) y la apariencia de `GTextarea` escrita por coco en `GTranscript.css` con los mismos tokens; **no** una clase compartida de `GTextarea` (las clases de elemento no son API estable, #204, y cada CSS tiene un dueño) | #252 |
| L10 · avisos | §30, ampliados | #256 |
| L11 · constantes | `TRANSCRIPT_LIMITS` (§26.4), más `quoteChars` y `diffCells` | #256 |
| T1 · tokens | Ninguno nuevo (§28.1, `tokens.md` §24) | #254 |
| T2 · contraste | Pendiente de coco (abajo) | #254 |
| T3 · color por hablante | Complemento con `speakerColors` declarado por la aplicación (sin respaldo) | #247 |
| I1 · iconos | 12 nuevos en `icons.md` §4 (v0.5); «Revisar» = `file-pen-line` | #253 |
| C3 · barra estrecha | Menú «Más» bajo `space × 120`; **corregido a `space × 160`** con apilado por `data-narrow` tras la medición de coco | #255, #258 |

**Reconciliación con el CSS de coco** (commit f3ee87c, `estilo.md` «Fase 2»): umbral de «Más» y apilado a `space × 160` con `data-narrow` (#258); marcado que el CSS espera incorporado a §22.4, §23.5, §24.5, §25.3, §28.3 y §29 (#259); combinación `cat-k` y «Cambió después de insertarlo» sobre fila seleccionada (#260); `flip-rtl` en Deshacer/Rehacer (#261); `g-btn__status` solo con `loadingText` (#257). **Pendiente de coco:** la auditoría (paso 5) sobre los `.vue` de bruno.

**Reconciliación con lo construido por bruno** (commits 7514a2a..55aba85): casillas con `field: false` (#262); desviaciones aceptadas (un `GMenu` por vista, selección masiva por tramos, «Sustituir la selección» solo con selección conocida, sin espacio ante signos de cierre, vaciar = `remove` en el historial, `flip-rtl` también en «Deshacer inserción»; #263); cifras de rendimiento, compuerta de WebKit y tamaños (#264).

**Pendiente para bruno (#262):** `GCheckbox` gana `field` (Boolean, `true`): con `false`, sin `g-checkbox__message`, sin `useFormField` (ni registro ni herencia de `density`/`readonly`/`disabled`/errores/marcas) y aviso si llegan `error`/`warning`/`valid`/`required`/`mark`; todas las `GCheckbox` de `GTranscript` (fila, «Seleccionar todo», «Con hablantes») con `:field="false"`; `flip-rtl` en el `undo-2` de «Deshacer inserción»; `selectionBatch` en `TRANSCRIPT_LIMITS`; compuerta de rendimiento de §31 (Firefox < 100 ms, WebKit < 200 ms). Pruebas: `GCheckbox.test.js` (sin región ni `aria-live` con `field: false`; dentro de un `GForm` `readonly` sigue operable y no se registra; avisos), `GTranscript.test.js` (ninguna `g-checkbox__message` ni región viva en la vista salvo la propia sin anfitrión) y la prueba de navegador. Metas: `GCheckbox.meta.json` (prop `field`) y `GTranscript.meta.json` (quitar los dos pendientes de lima; desviaciones remitidas a #263). README de `GCheckbox`: mora-docs.

**Pendientes para bruno (construcción, hecho):** **primero `GBtn` (#257)**; después construir según §20 a §30 (modelo, vista, destinos, cambios del anfitrión) con el marcado de `estilo.md` «Fase 2» («Marcado que el CSS espera», 1 a 11), registrar `GTranscript.css` (§31), `GTranscript.meta.json`, los 12 iconos en la lista `library` de `icons.json` antes de usarlos, `TRANSCRIPT_LIMITS`, las pruebas de §31 y la compuerta de rendimiento; reflejar en `GSpeechHost.meta.json` las acciones nuevas del panel.
