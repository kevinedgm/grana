# GSpeechPill

Pill **colocable** de la captura de voz: muestra la grabación en curso donde la pongas (cabecera, barra de herramientas) con el estado (icono y texto), la duración, Pausar / Reanudar / Reintentar y Finalizar; su botón principal abre el panel. Es parte del sistema de captura de voz: **la documentación completa está en [`GSpeechHost/README.md`](../GSpeechHost/README.md)** (privacidad, instalación, adaptador, estados, accesibilidad medida).

**Etiqueta:** `<g-speech-pill>` · **Entrada:** `@grana/vue/speech` (la registra `app.use(speech)`) · **Estado:** `candidate` · **Desde:** 0.1.0

```vue
<header class="app-header">
  <h1>Consulta</h1>
  <GSpeechPill />
</header>
```

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `speech` | Object | el gestor provisto | Gestor de `createSpeech` que pinta esta pill |

Sin eventos ni slots: todo va por el gestor.

- **Opcional y una por gestor.** Sin ella, el anfitrión muestra su pill **flotante**; una segunda `GSpeechPill` no pinta nada y avisa. Sin sesión, su raíz existe con `hidden`.
- **Exactamente una pill visible y operable** mientras hay sesión: esta si se ve entera, no es inerte y está dentro del modal superior si lo hay (dentro de un `GDialog` modal aparece la flotante del anfitrión). Medido en la auditoría: cabecera visible → solo la colocada; cabecera fuera del visor o modal abierto → solo la flotante.
- **Medidas:** 34px de alto; el texto del estado se recorta con puntos suspensivos y por debajo de ~160px (`space × 40`) de ancho la pill desborda: dale sitio en tu cabecera.
- **Accesibilidad:** `role="group"` con `labels.region`; el botón principal anuncia el estado + «abrir panel», con `aria-expanded`, `aria-controls` y `aria-keyshortcuts` (Mayús+F8); la duración es un `role="timer"`. Contraste medido: texto ≥ 13.81:1, duración e iconos ≥ 6.49:1, icono de estado ≥ 4.10:1, borde de estado y medidor ≥ 4.52:1 (también con acentos pálidos).
- **No detectado:** una pill tapada por otra capa de tu aplicación sin salir del visor.

API: [`GSpeechPill.meta.json`](./GSpeechPill.meta.json) · Contrato: [`design/contracts/speech.md`](../../../../../design/contracts/speech.md) §7
