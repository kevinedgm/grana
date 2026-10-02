# GSpeechTrigger

Disparador de la captura de voz: **dictado** a un campo (botón de solo icono, conmutable, con su nota bajo el campo) o **conversación** (botón con texto que prepara la sesión y abre el panel). Es parte del sistema de captura de voz: **la documentación completa está en [`GSpeechHost/README.md`](../GSpeechHost/README.md)** (privacidad, instalación, adaptador, estados, accesibilidad medida).

**Etiqueta:** `<g-speech-trigger>` · **Entrada:** `@grana/vue/speech` (lo registra `app.use(speech)`) · **Estado:** `candidate` · **Desde:** 0.1.0

```vue
<!-- Dictado: el disparador va JUSTO DESPUÉS del campo, como hermano (no dentro) -->
<GTextarea id="obs" v-model="form.obs" label="Observaciones" />
<GSpeechTrigger for="obs" />

<!-- Conversación -->
<GSpeechTrigger mode="conversation" />
```

| Prop | Tipo | Valores | Por defecto | Qué es |
| --- | --- | --- | --- | --- |
| `mode` | String | `dictation` `conversation` | `dictation` | Tipo de sesión |
| `for` | String | `id` de un `<textarea>` o un `<input>` `text`, `search`, `url` o `tel` | sin valor | Campo del dictado (obligatorio en dictado; `password`, `email` y `number` no se admiten) |
| `targetLabel` | String | | la etiqueta del campo | Nombre del campo en «Dictar en {target}» y en los anuncios |
| `size` | String | `xs` `sm` `md` `lg` `xl` | `md` | El de `GBtn` |
| `density` | String | `default` `comfortable` `compact` | `default` | El de `GBtn` |
| `disabled` | Boolean | | `false` | `disabled` nativo |
| `speech` | Object | | el gestor provisto | Gestor de `createSpeech` |

Sin eventos ni slots: todo va por el gestor.

- **Dictado:** solo el texto **confirmado** entra en el campo, en el cursor y **sin mover el foco** (con un evento `input` que actualiza `v-model`); el provisional se ve en la nota («Texto provisional: …», no es región viva). Pulsar otra vez finaliza. Al terminar, la nota ofrece «Deshacer dictado»; si el campo se desmontó, «Insertar» lo pendiente en orden.
- **Conversación:** «Grabar conversación» prepara la sesión sin abrir el micrófono y abre el panel; con la sesión en curso, «Ver grabación».
- **Con otra sesión en curso:** `aria-disabled="true"` (sigue enfocable) y descripción `labels.trigger.busy`; pulsarlo no crea otra sesión: lo anuncia y lleva el foco a la pill. El disparador **no lleva la sesión**: si se desmonta, la sesión sigue.
- **Accesibilidad medida:** icono ≥ 4.11:1; contorno de la captura viva ≥ 4.86:1 fuera y ≥ 4.52:1 sobre su tinte (interior, distinto del anillo de foco, que es exterior); problema con contorno **discontinuo**; texto provisional de la nota ≥ 7.38:1; área ≥ 24px (≥ 44px con `pointer: coarse`).

API: [`GSpeechTrigger.meta.json`](./GSpeechTrigger.meta.json) · Contrato: [`design/contracts/speech.md`](../../../../../design/contracts/speech.md) §8
