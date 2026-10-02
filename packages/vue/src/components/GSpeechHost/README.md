# Captura de voz (`createSpeech`, `GSpeechHost`, `GSpeechTrigger`, `GSpeechPill`)

Dictado a un campo y grabación de conversaciones con **transcripción provisional y confirmada**, pensado para información sensible (consultas, entrevistas, notas de campo). La sesión **es de la aplicación**, no del campo: sobrevive a cambios de pestaña, de paso o a un diálogo, y mientras el micrófono está en uso hay **siempre un indicador visible** con el estado, la duración y los controles. **Grana no transcribe ni hace red:** tu aplicación aporta un **adaptador** con su motor (un servicio local tipo Whisper, por ejemplo) y Grana pone la captura del micrófono, el estado, la interfaz y la accesibilidad.

Es un **servicio imperativo**, como `GToast`: creas un gestor (`createSpeech`), lo instalas como plugin, montas **un** `<GSpeechHost />` y colocas disparadores (`<GSpeechTrigger>`) junto a los campos; si quieres, una pill en la cabecera (`<GSpeechPill>`).

**Etiquetas:** `<g-speech-host>` (anfitrión) · `<g-speech-trigger>` (disparador) · `<g-speech-pill>` (pill colocable) · **Entrada:** `@grana/vue/speech` (no viaja en `@grana/vue`) · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/speech/auditoria.md`](../../../../../design/lab/speech/auditoria.md)) · **Desde:** 0.1.0 · **Fase:** 1 de 3

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (playground en `packages/vue/playground/`, sección «Captura de voz», con el adaptador simulado; `?speech=self` simula también el micrófono). Exige Vue `^3.5.0` y un contexto seguro (`https` o `localhost`) para el micrófono.

## Privacidad primero

Léelo antes de elegir motor: buena parte de la privacidad depende de **tu adaptador**, que Grana no puede comprobar.

- **Grana no hace red.** Ni `fetch`, ni WebSocket, ni analítica. El audio se entrega a tu adaptador **en memoria**; cómo llega a tu motor (localhost, red interna) lo decide el adaptador. Grana tampoco escribe en `localStorage`, `sessionStorage`, IndexedDB, caché ni disco.
- **El motor lo aporta la aplicación.** Grana no conoce Whisper, whisper.cpp, faster-whisper ni ningún otro: solo la interfaz del adaptador (abajo). **No usa la Web Speech API** (`SpeechRecognition`), que en Chromium envía el audio a servidores externos.
- **Nada sale de tu organización sin permiso explícito.** Un adaptador que declara `location: 'remote'` se **rechaza sin abrir el micrófono** (error `remote-not-allowed`) salvo que crees el gestor con **`allowRemote: true`**.
- **El audio no se conserva por defecto.** Si tu adaptador guarda audio temporal (`storesAudio: 'memory'` o `'disk'`), tu aplicación se compromete a: memoria o disco **cifrado** con clave efímera; **borrarlo** al finalizar, al descartar y al cerrar (y limpiar restos al arrancar); devolver `audioDeleted: true` **solo** si el borrado se completó; avisar de falta de espacio (`storage-full`); y decir la verdad sobre el audio en cada error. La interfaz dice «Audio temporal eliminado» **solo** con esa confirmación; si no llega, dice que el motor no lo confirmó.
- **Línea de privacidad siempre visible en el panel:** dónde se procesa (icono de candado en `device`/`local`, globo en `remote`) y qué pasa con el audio.
- **Micrófono abierto solo mientras se captura:** preparar una conversación no lo abre; **pausar detiene las pistas** (se apaga el indicador del navegador y del sistema); un error lo cierra. **Sin `GSpeechHost` montado no se abre** (no hay indicador), y si el anfitrión se desmonta en plena captura, la captura se detiene y la sesión queda en pausa.
- **Lo transcrito vive en memoria** del gestor hasta que cierras o descartas la sesión; al cerrar se entrega a tu `onComplete` y Grana no guarda copia.
- **Avisos de desarrollo y `onError` nunca incluyen texto transcrito.**
- **Consentimiento** (opcional, `requireConsent: true`): una conversación no empieza hasta marcar la casilla «he avisado a los participantes». Grana no guarda ni certifica ese consentimiento.

## Instalación

```js
// main.js de la aplicación
import { createApp } from 'vue'
import Grana from '@grana/vue'
import { createSpeech } from '@grana/vue/speech'
import '@grana/vue/style.css'                                        // el CSS de la captura va en la hoja de siempre
import { createLocalWhisperAdapter } from './speech/whisper-adapter.js'   // tuyo (ver «El adaptador»)
import { labels } from './speech/labels.es.js'                         // tus textos (ver «Textos»)

export const speech = createSpeech({
  adapter: createLocalWhisperAdapter({ url: 'http://localhost:8178' }),
  language: 'es',
  labels,
  onComplete: (transcript) => guardarBorrador(transcript),   // transcript.toJSON(), sin el provisional
  onError: (error) => registrar(error.kind)                 // sin contenido
})

createApp(App).use(Grana).use(speech).mount('#app')
```

```vue
<!-- App.vue: un solo anfitrión, lo más alto posible -->
<template>
  <header>… <GSpeechPill /> …</header>   <!-- opcional -->
  <RouterView />
  <GSpeechHost />
</template>
```

- **`app.use(speech)`** provee el gestor (`useSpeech()` lo inyecta) **y registra** `GSpeechHost`, `GSpeechPill` y `GSpeechTrigger`. `app.use(Grana)` va antes: la captura usa `GBtn`, `GIcon`, `GSurface`, `GSelect`, `GCheckbox` y `GProgress` del paquete principal.
- **Un `GSpeechHost` y una `GSpeechPill` por gestor.** Un segundo no pinta nada y avisa. `speechKey` sirve para un `provide` manual (pruebas, microfrontends); cada componente acepta `:speech="otro"`.
- **Sin CDN de módulos:** carga en orden `vue.global.js`, `dist/grana.umd.js` (global `Grana`) y `dist/speech.umd.js` (global `GranaSpeech`): `GranaSpeech.createSpeech(...)`.
- **En plantillas dentro del HTML** (sin compilar), cierra las etiquetas: `<g-speech-host></g-speech-host>`.
- **SSR:** importar la entrada y llamar a `createSpeech` no toca `document`, `window`, `navigator` ni `AudioContext`. En el servidor `GSpeechHost` no pinta nada, `GSpeechPill` pinta su raíz `hidden` y `GSpeechTrigger` su botón en reposo.

## El adaptador, paso a paso

El adaptador es un objeto **de tu aplicación** que conecta la captura de Grana con tu motor. Grana te entrega audio y tú le devuelves eventos.

```ts
{
  id: string,
  capabilities: {
    location: 'device' | 'local' | 'remote',      // dónde se procesa (remote exige allowRemote)
    input: { format: 'pcm', sampleRate, channels: 1, sampleFormat?: 'f32' | 's16', chunkMs? }
         | { format: 'encoded', mimeTypes: string[], timeslice }
         | { format: 'self' },                    // capturas tú (envoltorio nativo): emites level y capture
    partials: boolean,        // emites texto provisional
    vad: boolean,             // emites 'voice'; si no, Grana detecta la voz por energía
    diarization: boolean,     // los 'final' traen speaker
    offlineBuffer: boolean,   // si se cae el servicio, guardas el audio y la captura sigue; si no, se retiene
    storesAudio: 'none' | 'memory' | 'disk'
  },
  check?(): Promise<void>,          // salud del servicio SIN abrir el micrófono; rechaza con { kind }
  open(ctx): Promise<EngineSession> // ctx = { mode, expectedSpeakers, language, signal, emit(type, payload) }
}
```

| `EngineSession` | Cuándo la llama Grana | Qué debe hacer |
| --- | --- | --- |
| `push(chunk)` | Con cada trozo de audio (`{ seq, t0, t1, format, data, voice }`, `t0`/`t1` en ms de audio capturado) | Enviarlo al motor. **Grana no espera**: si lanza o rechaza, ese tramo queda como fallo no fatal con el audio perdido y la captura sigue |
| `pause()` | Al pausar y ante un fallo de captura | Cerrar el provisional en curso |
| `resume()` | Antes de volver a enviar trozos | — |
| `reconnect?()` | Al reanudar con el servicio caído | Reconectar o rechazar con `{ kind }` |
| `finish()` | Al finalizar | Cerrar el provisional y **resolver `{ audioDeleted }` cuando no quede nada pendiente**; rechaza con `{ kind, audio }` |
| `abort()` | Al descartar o cancelar | Descartarlo todo, borrar el audio temporal y resolver `{ audioDeleted }` |
| `retrySegment?(id)` | «Reintentar fragmento» | Reprocesar un fragmento fallido cuyo audio guardaste |

| Evento (`ctx.emit`) | `payload` | Efecto |
| --- | --- | --- |
| `partial` | `{ id, text, speaker? }` | Sustituye al provisional anterior (se ve en la nota y en el panel, nunca entra en el campo) |
| `final` | `{ id, text, speaker?, t0, t1 }` | Confirma el fragmento; con el **mismo `id`** que su provisional, lo sustituye en su sitio |
| `pending` | `{ count }` | Fragmentos capturados sin texto final |
| `connection` | `{ state: 'lost' \| 'retrying' \| 'restored', attempt? }` | Reconexión (ver «Errores») |
| `error` | `{ kind, fatal, segment?, audio, retryable? }` | No fatal: el fragmento queda marcado; fatal: la sesión pasa a error |
| `voice` · `level` · `capture` | | Solo con `vad: true` (`voice`) o `input.format: 'self'` (`level`, `capture`) |

**Ejemplo para un servicio local tipo Whisper.** El protocolo HTTP de este ejemplo (`/health`, `/sessions`…) es **inventado**: adáptalo al de tu servidor (whisper.cpp, faster-whisper o un envoltorio propio). Lo que importa es la forma del adaptador. **No está verificado contra un motor real** (ver «Limitaciones»).

```js
// speech/whisper-adapter.js (de tu aplicación, no de Grana)
export function createLocalWhisperAdapter({ url = 'http://localhost:8178', storesAudio = 'memory' } = {}) {
  const call = async (path, init = {}) => {
    let res
    try { res = await fetch(url + path, init) } catch { throw { kind: 'service-unavailable' } }
    if (res.status === 507) throw { kind: 'storage-full' }
    if (!res.ok) throw { kind: 'service-unavailable' }
    return res.status === 204 ? {} : res.json()
  }
  return {
    id: 'local-whisper',
    capabilities: {
      location: 'local',                                                           // servicio de tu organización
      input: { format: 'pcm', sampleRate: 16000, channels: 1, sampleFormat: 's16', chunkMs: 300 },
      partials: true, vad: false, diarization: true, offlineBuffer: false, storesAudio
    },
    check: () => call('/health'),                       // ready sin abrir el micrófono
    async open(ctx) {
      const { id } = await call('/sessions', {
        method: 'POST', signal: ctx.signal, headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ mode: ctx.mode, language: ctx.language, speakers: ctx.expectedSpeakers })
      })
      // La respuesta del servicio: { partial?, finals?: [{ id, text, speaker, t0, t1 }], pending, audioDeleted? }
      const apply = (r) => {
        for (const f of r.finals ?? []) ctx.emit('final', f)
        if (r.partial) ctx.emit('partial', r.partial)
        if (r.pending !== undefined) ctx.emit('pending', { count: r.pending })
      }
      let queue = Promise.resolve()                    // Grana no espera a push: tú mantienes el orden
      let lost = false
      // Servicio perdido: avisa, reintenta y avisa del restablecimiento (sin offlineBuffer, Grana retiene la captura
      // y al volver el servicio la deja en pausa hasta «Reanudar»)
      const recover = async () => {
        ctx.emit('connection', { state: 'lost' })
        for (let attempt = 1; attempt <= 3; attempt++) {
          ctx.emit('connection', { state: 'retrying', attempt })
          await new Promise((r) => setTimeout(r, 2000))
          if (ctx.signal.aborted) return
          try { await call('/health'); lost = false; ctx.emit('connection', { state: 'restored' }); return } catch {}
        }
        ctx.emit('error', { kind: 'service-unavailable', fatal: true, audio: 'none' })
      }
      return {
        push(chunk) {
          queue = queue.then(async () => {
            try {
              apply(await call(`/sessions/${id}/audio?seq=${chunk.seq}&t0=${chunk.t0}&t1=${chunk.t1}`, {
                method: 'POST', signal: ctx.signal, headers: { 'content-type': 'application/octet-stream' }, body: chunk.data
              }))
            } catch (e) {
              if (e.kind === 'storage-full') ctx.emit('error', { kind: 'storage-full', fatal: true, audio: 'processing' })
              else if (!lost) { lost = true; recover() }
            }
          })
          return queue
        },
        pause() { queue = queue.then(() => call(`/sessions/${id}/flush`, { method: 'POST' }).then(apply, () => {})) },
        resume() {},
        async reconnect() { await call('/health'); lost = false },   // «Reanudar» tras un error del servicio
        async finish() {
          await queue
          const r = await call(`/sessions/${id}/finish`, { method: 'POST' })   // el servicio responde cuando no queda nada
          apply(r)
          return { audioDeleted: r.audioDeleted === true }
        },
        async abort() {
          try { return { audioDeleted: (await call(`/sessions/${id}`, { method: 'DELETE' })).audioDeleted === true } }
          catch { return { audioDeleted: false } }                            // nunca afirmes lo que no sabes
        }
      }
    }
  }
}
```

Pautas:

1. **Declara lo que de verdad hace tu motor.** `location`, `storesAudio` y `diarization` se muestran al usuario tal cual.
2. **Mismo `id` en el provisional y en su `final`.** Así el texto confirmado sustituye al provisional en su sitio.
3. **`finish()` solo resuelve sin pendientes**, y `audioDeleted: true` solo tras borrar.
4. **Los errores responden a cuatro preguntas:** ¿la captura sigue?, ¿qué pasó con el audio (`audio: 'none' | 'processing' | 'kept' | 'lost'`)?, ¿se puede reintentar? Lo ya transcrito **siempre** se conserva.
5. **`ctx.signal`** se aborta al descartar o cancelar: pásalo a tus peticiones.
6. **Prueba tu adaptador** con la misma batería que el simulado (ver «Pruebas»).

## Dictado y conversación

```vue
<!-- Dictado a un campo: el disparador va JUSTO DESPUÉS del campo, como hermano -->
<GTextarea id="obs" v-model="form.obs" label="Observaciones" />
<GSpeechTrigger for="obs" />

<!-- Conversación: prepara la sesión y abre el panel -->
<GSpeechTrigger mode="conversation" />
```

**Dictado** (`mode="dictation"`, por defecto): botón de **solo icono** y conmutable (`aria-pressed`), con nombre fijo `labels.trigger.dictate` («Dictar en Observaciones»; `{target}` sale de la etiqueta del campo o de `target-label`). `for` es el `id` de un `<textarea>` o un `<input>` de tipo `text`, `search`, `url` o `tel` (no `password`, `email` ni `number`).

- Solo el **texto confirmado** entra en el campo, en el cursor (o en la selección, que sustituye) **sin mover el foco**, con un evento `input` que actualiza tu `v-model`. El provisional se ve **en la nota bajo el campo** («Texto provisional: …»), nunca en el valor.
- Pulsar de nuevo **finaliza**; el dictado se cierra solo al terminar si todo se insertó.
- **Deshacer dictado** (en la nota al terminar): Ctrl+Z no deshace texto insertado por script, así que Grana guarda su propio registro. Vale mientras el campo no cambie; deshace en orden inverso y devuelve el foco al campo.
- Si el campo **se desmonta** (otra pestaña, un paso), los fragmentos esperan en orden; al volver, la nota ofrece «Insertar».

**Conversación** (`mode="conversation"`): botón con texto («Grabar conversación»; con la sesión en curso, «Ver grabación»). Prepara la sesión **sin abrir el micrófono** (`ready`: participantes previstos, aviso si el motor no distingue hablantes, casilla de consentimiento si la pediste) y abre el panel; «Empezar a grabar» abre el micrófono. El panel muestra el transcript de **solo lectura** con hora, hablante («Hablante A», «Hablante B»…) y el provisional en cursiva con la ficha «provisional».

**Dónde va el disparador:** al **lado** del campo (hermano inmediatamente posterior; la nota queda bajo la caja), **no dentro**: el hueco `append` de `GInput` es decorativo, `GTextarea` no tiene huecos de acción y el slot `label` no admite controles.

**Una sesión cada vez.** Con otra sesión en curso, los demás disparadores quedan `aria-disabled` (siguen enfocables), se describen con `labels.trigger.busy` y al pulsarlos anuncian «Ya hay una grabación en curso» y llevan el foco a la pill. Volver a la pestaña donde empezó **no** crea otra sesión: el disparador se reconoce por modo y campo.

## La pill: cabecera y flotante

`<GSpeechPill />` va donde quieras que se vea la grabación (cabecera, barra de herramientas). Es opcional: el anfitrión trae una **flotante de respaldo**. Mientras haya sesión hay **exactamente una pill visible y operable**: la tuya si se ve entera, no es inerte y está dentro del modal superior si lo hay; si no, la flotante (arriba al centro en escritorio, `position` la cambia; **abajo al centro** en móvil).

- **Botón principal:** icono y texto del estado + abre el panel (chevron). **Duración** `mm:ss` (`role="timer"`). **Alternar** (el mismo botón: Pausar / Reanudar / Reintentar) y **Finalizar**.
- Captura viva: «lámpara» rellena detrás del icono, tinte del acento y **borde de doble grosor**; problema: borde **discontinuo** de peligro. El estado se lee siempre por **icono y texto**, nunca solo por color.
- Dentro de un `GDialog` modal la pill de la cabecera queda inerte: aparece la flotante **dentro del modal** y operable. Si la flotante tapa el elemento enfocado, salta al borde contrario.
- **Convive con `GToaster`:** si los dos usan el mismo borde (en móvil, abajo), los avisos se apilan **por encima** de la pill y la pill no se mueve.
- Con una ranura de menos de ~160px (`space × 40`) la pill desborda: el ancho de la cabecera lo pone tu aplicación.

## Estados

| `status` | Icono | Micrófono | Texto corto de ejemplo (`labels.states.*.short`) |
| --- | --- | --- | --- |
| `requesting` | `shield-question-mark` | abriéndose | «Pidiendo permiso» |
| `ready` | `mic` | **apagado** | «Listo» |
| `listening` | `circle` (relleno) | captura | «Grabando» |
| `speech` | `audio-lines` | captura | «Voz detectada» |
| `transcribing` | `captions` | captura | «Transcribiendo» |
| `paused` | `circle-pause` | **apagado** (pistas detenidas) | «En pausa» |
| `processing` | `loader-circle` (gira; quieto con movimiento reducido) | apagado | «Procesando» |
| `reconnecting` | `refresh-cw` | captura si `offlineBuffer`; si no, retenida | «Reconectando» / «Reconectando · grabando» |
| `denied` | `mic-off` | apagado | «Permiso denegado» |
| `unavailable` | `unplug` | apagado | «Sin micrófono» |
| `error` | `circle-alert` | apagado | «Error» |
| `completed` | `circle-check` | apagado | «Lista» |

«Grabando» solo se muestra si llegan fotogramas de verdad: si la captura se congela, la pill deja de decirlo en menos de 2,5 s (pasa a `error`, «Grabación interrumpida»). Una señal de solo silencio digital durante 2,5 s se avisa en el panel («No llega sonido del micrófono»).

## Pausar y finalizar

- **Pausar detiene las pistas** del micrófono: el indicador del navegador se apaga y «el micrófono no está capturando» es verdad. **Reanudar** vuelve a pedirlo (si el navegador pregunta otra vez, se anuncia). Nada se reanuda solo: ni tras una interrupción ni al volver el servicio.
- **Finalizar** sigue seis pasos: detener la captura → procesar lo pendiente (`processing`, con barra de progreso y **sin** poder cerrar ni descartar) → cerrar el provisional → transcript final → `completed` → revisión. La conversación queda en `completed` hasta «Cerrar sesión» (entrega `onComplete`) o «Descartar».
- **Descartar** pide confirmación en línea en el panel («Sí, descartar» / «Cancelar», con el foco en «Cancelar»); `speech.discard()` desde código no pregunta. El anuncio menciona la eliminación del audio **solo** si el adaptador la confirmó.
- Esc **nunca** detiene ni descarta: solo cierra el panel.

```js
import { useSpeech } from '@grana/vue/speech'
const speech = useSpeech()
await speech.start({ mode: 'conversation' })   // true si empezó
await speech.pause(); await speech.resume(); await speech.finish()
speech.state.status       // reactivo y de solo lectura
const off = speech.onLevel((level, live) => …)  // nivel 0..1 por fotograma (no reactivo)
```

Los métodos devuelven `Promise<boolean>` y **nunca rechazan**: una transición no permitida devuelve `false` (y avisa en desarrollo); los fallos van a `state.error`, `state.issues` y `onError`. La API completa (opciones, métodos, estado, `configure`) está en [`GSpeechHost.meta.json`](./GSpeechHost.meta.json) y en el [contrato](../../../../../design/contracts/speech.md) §1.

## Errores y qué pasó con el audio

Cada error se muestra en el panel y se anuncia (canal enérgico) con un texto que responde **las cuatro preguntas**: qué pasó, si la captura sigue, qué pasó con el audio y que lo transcrito se conserva; después, qué hacer. Lo compones con tus `labels`: `title. what capture.<c> audioFate.<a> [kept] fix`.

| `kind` | Estado | ¿Recuperable? | Origen |
| --- | --- | --- | --- |
| `permission-denied` | `denied` | sí (Reintentar) | permiso del navegador |
| `no-device` · `device-busy` · `device-disconnected` | `unavailable` | sí | micrófono |
| `interrupted` | `error` | sí (Reanudar) | captura congelada o silenciada por el sistema |
| `service-unavailable` | `error` | sí | tu motor (`check`, `open`, o tras agotar reintentos) |
| `processing-failed` | `error` si es fatal (p. ej. `finish` rechazada: «Finalizar» reintenta); si no, un fragmento marcado | sí | tu motor |
| `storage-full` | `error`; la captura se detiene, lo pendiente sigue procesándose | sí | tu motor |
| `remote-not-allowed` | `error`, **micrófono sin abrir** | no | Grana (`location: 'remote'` sin `allowRemote`) |
| `unsupported` | `unavailable` / `error` | no | navegador sin captura o capacidades inválidas |

- **Servicio caído** (`connection: lost`): con `offlineBuffer`, la captura **sigue** («Reconectando · grabando») y tu adaptador guarda el audio; sin él, la captura se **retiene** (pistas detenidas) y al restablecerse queda en pausa hasta «Reanudar».
- **Un fragmento fallido no detiene la captura:** queda marcado en el transcript con «Reintentar fragmento» si guardaste su audio (`retryable`), o «El audio de este fragmento se perdió».
- Con un error **sin nada capturado**, el panel ofrece «Cerrar» (descarta sin preguntar: no hay nada que perder).

## Teclado y foco

| Tecla | Dónde | Acción |
| --- | --- | --- |
| **Mayús+F8** (`hotkey`) | En cualquier parte, con una sesión | Lleva el foco al botón principal de la pill visible; otra vez, lo devuelve a donde estaba |
| Mayús+F8 sin sesión · **F8** sola | | No se interceptan (F8 es de `GToaster`) |
| **Esc** | Panel o hoja | Cierra el panel; **no** llega a un `GDialog` anfitrión ni detiene la grabación |
| Tab | | El panel no atrapa el foco (no modal); la hoja móvil sí (modal) |

Abrir el panel lleva el foco a su título; cerrarlo, a quien lo abrió. Si un cambio de estado retira el botón enfocado (p. ej. «Pausar» al pausar), el foco va al título del panel. **Nada roba el foco por sí solo**: ni el texto que llega, ni la inserción, ni el fin del procesamiento, ni un error. `hotkey: false` desactiva el atajo; `F6` se rechaza.

## Accesibilidad (medida)

Auditoría de coco sobre los componentes reales del playground en Chromium, Firefox y WebKit; tema por defecto y temas generados con acento pálido (`spotify` `#A7F3C1`, `amazon` `#FF9900`), `lustre` y `github`, claro y oscuro ([auditoría](../../../../../design/lab/speech/auditoria.md), `node design/lab/speech/auditoria-verificar.mjs`). Contraste compuesto sobre el fondo real:

| Medida (umbral) | Mínimo |
| --- | --- |
| Texto de la pill (4.5) | 13.81 |
| Duración, chevron, alternar y finalizar de la pill (4.5 / 3) | 6.49 |
| Icono de estado de la pill, incluido el de la lámpara (3) | 4.10 |
| Borde de estado de la pill, fuera y sobre su relleno (3) | 4.52 |
| Medidor de la pill (3) · onda del panel (3) | 4.52 · 4.57 |
| Título, estado, transcript confirmado, hablante, error del panel (4.5) | 15.21 |
| **Texto provisional** del panel y de la nota, modo, privacidad, hora (4.5) | 7.38 |
| Texto de los botones del panel (4.5) · borde `outline` (3) | 4.62 · 3.19 |
| Iconos y marcas de error y de fallo (3) | 4.52 |
| Disparador: icono (3) · contorno vivo fuera / sobre el tinte (3) · contorno de problema (3) | 4.11 · 4.86 / 4.52 · 4.52 |

- **El color nunca es la única señal:** cada estado tiene icono y texto; la captura viva añade forma (lámpara rellena, borde doble) y el problema, borde discontinuo. Con un acento pálido el relleno de la lámpara usa el color de marca con su par de contraste y los trazos (borde, medidor, onda) usan variantes legibles del acento.
- **Foco:** anillo sólido de 2px **dentro** del botón enfocado, separado ≥ 2px del borde vivo (no se confunden); visible dentro de la capa superior, del modal y de la hoja.
- **Tamaños:** pill de 34px de alto; todos los botones con área ≥ 24px y **≥ 44px** con `pointer: coarse`, sin que se pisen dentro de la pill.
- **Anuncios:** dos canales ocultos en el anfitrión (`status` y `alert`), presentes y vacíos desde el montaje, son los **únicos** que hablan. Se anuncia el ciclo de vida (inicio, pausa, reanudación, procesando, fin, reconexión, inserción, descarte) y los errores; **nunca** el texto transcrito, el nivel ni la duración. Las regiones `role="status"` de los `GBtn` existen y quedan **vacías toda la sesión** (verificado).
- **Movimiento:** «Ocultar actividad» (`aria-pressed`) quita la onda y los medidores; estado y duración siguen. Con `prefers-reduced-motion`: medidor y onda **discretos** (5 segmentos encendidos o apagados), sin giro, paneles solo con fundido.
- **Móvil** (visor < `space × 130`, 520px): el panel es una **hoja inferior modal** (≤ 88 % del alto, foco al título, Esc la cierra) y la flotante va abajo al centro. Medido a 320×640 sin desbordamiento y con un aviso de `GToaster` encima de la pill.
- **RTL**, **zoom 200 %** (panel y pill dentro del visor, el panel se desplaza dentro de su alto), **colores forzados** (bordes, lámpara invertida, medidor y onda visibles; emulados en Chromium) y **`prefers-contrast: more`** (bordes de control, secundarios en texto pleno): verificados.

## Textos

**Sin valores por defecto** (Grana es internacional): todos los textos van en `labels` y falta uno → aviso en desarrollo la primera vez que se necesita (los botones con icono se dibujan igual). La lista completa de claves está en [`GSpeechHost.meta.json`](./GSpeechHost.meta.json) (`labels`) y un juego completo en español en el playground (`packages/vue/playground/index.html`). Las claves contadas admiten String con `{count}` o una función `(count) => String` cuyo resultado pasa después por los demás marcadores (`{time}`, `{target}`…).

## Pruebas: el adaptador simulado

```js
import { createSimulatedSpeechAdapter } from '@grana/vue/testing'   // NO viaja en el paquete principal

const adapter = createSimulatedSpeechAdapter({
  latency: 900,
  input: { format: 'self' },   // simula también el micrófono (sin getUserMedia): útil en jsdom y CI
  script: { dictation: ['Primera frase.', 'Segunda frase.'], conversation: [{ speaker: 'A', text: 'Hola.' }] }
})
const speech = createSpeech({ adapter, labels })

adapter.goOffline(); adapter.goOnline()        // servicio perdido y restablecido
adapter.failNextSegment({ retryable: true })   // fragmento fallido no fatal
adapter.storageFull()                          // error fatal storage-full
adapter.failFinish('processing-failed')        // finish() rechaza
adapter.confirmDeletion(false)                 // el motor no confirma el borrado del audio
adapter.muteCapture(); adapter.endCapture()    // solo self: captura interrumpida / micrófono desconectado
adapter.log                                    // { opened, checks, pushed[], aborted, finished, paused, resumed, retried[] }
```

Sin red ni almacenamiento: emite el provisional palabra a palabra y el confirmado tras `latency`, con hablantes por guion. Sus opciones y métodos completos están en `GSpeechHost.meta.json` («testing»). En UMD: `dist/testing.umd.js`, global `GranaTesting`. Úsalo también como modelo para probar **tu** adaptador: los mismos fallos deben producir los mismos estados.

## Coste en tamaño

La captura **no** está en `@grana/vue`: va en su propia entrada y solo la paga quien la importa. Medido (gzip): **`dist/speech.js` 27.4 KB** (lo que sumaría al paquete principal: +27.5 KB, un 22 %); `dist/grana.js` queda en 126.2 KB. El CSS de la captura (≈ 5 KB gzip) sigue en `grana.css` y es inerte sin su marcado. El adaptador simulado (`@grana/vue/testing`) va aparte.

## Tema

**Sin tokens propios.** Pill flotante y panel son `GSurface level="floating"`. Consume `--g-color-active` + `--g-color-on-accent` (lámpara), `--g-color-accent-soft` (tinte vivo), `--g-color-on-accent-soft` (borde vivo y medidor), `--g-color-accent-text` (onda), `--g-color-{danger|warning|success}-text`, `--g-color-text`, `-text-muted`, `-text-subtle`, `--g-color-border*`, `--g-color-neutral-soft`, `--g-color-surface*`, `--g-color-focus`, `--g-focus-width`, `--g-border-width`, `--g-radius-*`, `--g-shadow-3` (hoja), `--g-space-*`, `--g-font-ui`, `--g-text-{body|body-sm|caption}-*` y `--g-duration-*`/`--g-ease-*`. Medidas derivadas de `space` (no tokens): pill de 34px, lámpara `space × 5`, panel `min(space × 110, 100vw − space × 8)`, margen de la flotante `space × 4` (`× 2` en móvil), umbral de móvil `space × 130`, hoja hasta 88 % del alto.

## Limitaciones conocidas

- **Sin verificar con lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): cola cortés y `alert`, cambio de nombre de Pausar/Reanudar con el foco encima, `role="timer"`, traslado de los canales al modal, regiones vacías de los botones al recorrer. Es el riesgo principal.
- **Sin verificar en Safari real** (WebKit de Playwright no es Safari): si reanudar tras detener las pistas vuelve a pedir permiso, Permissions API del micrófono, `MediaRecorder` y sus formatos, `wakeLock`.
- **Sin verificar con motores reales** (Whisper, whisper.cpp, faster-whisper, diarización local) ni con PCM real a 16 kHz contra un servicio; el adaptador de ejemplo de este README tampoco.
- **Sin verificar en móvil real:** llamada entrante, segundo plano (iOS suspende la pestaña: se detecta como interrupción al volver), `safe-area`, teclado virtual con la hoja, orientación; ni con permiso revocado a mitad de sesión, varios modales apilados o sesiones de más de una hora.
- **Pill colocada tapada por otra capa** sin salir del visor: no se detecta (`IntersectionObserver` v1).
- **Fase 1:** el transcript del panel es de **solo lectura**. Quedan para la **Fase 2** el transcript editable (`GTranscript`), reasignar hablantes y roles, copiar y **destinos** (insertar en varios campos), y para la **Fase 3** la recuperación tras cerrar la aplicación, el kit de pruebas del audio temporal, la selección de dispositivo, la captura nativa en segundo plano y las sesiones de horas. Escuchar el audio de un fragmento queda fuera de la v0.1.

## Fuentes

- API: [`GSpeechHost.meta.json`](./GSpeechHost.meta.json) · [`GSpeechPill`](../GSpeechPill/README.md) · [`GSpeechTrigger`](../GSpeechTrigger/README.md) · Contrato: [`design/contracts/speech.md`](../../../../../design/contracts/speech.md) · Prototipo: [`design/lab/speech/r01/`](../../../../../design/lab/speech/r01/) · Estilo: [`design/lab/speech/estilo.md`](../../../../../design/lab/speech/estilo.md) · Auditoría: [`design/lab/speech/auditoria.md`](../../../../../design/lab/speech/auditoria.md) · Decisiones #207 a #238
