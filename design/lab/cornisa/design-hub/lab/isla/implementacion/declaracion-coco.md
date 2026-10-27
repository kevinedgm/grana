# Declaración de cumplimiento (coco · R3) · cornisa 0.1.0-alpha.0

> Coco **no está instalado** como agente en este entorno. Su protocolo (pasos 1–5) se siguió **a mano** leyendo `agentes/coco/AGENT.md`. No hay `governance_scripts` en el perfil, así que la auditoría arquitectónica es **manual**.

```text
Ruta: R3 — porque hay una ronda aprobada (kiwi r02, aprobada por el usuario el 2026-10-26), una orden de construcción
      (lima, redactada a mano) y una instrucción explícita del usuario («implementa»).
Brief funcional: heredado de kiwi r01/r02 (Paso 1.0: no se rehace) · data_contract: no aplica (UI Primitive sin dominio).
Reglas aplicadas: estructura congelada de r02 · API v0 sin props de estilo (component-api.md) · una acción primaria por
      actividad (la 1.ª acción) + Cerrar separada · estados con forma de icono + texto, nunca solo color ·
      targets ≥ 44 px (perfil) · reduced-motion y forced-colors · i18n mediante labels.
Excepciones: identidad visual NEUTRA (decisión del usuario 7) → no hay color_law ni type_law; los tokens --cornisa-*
      son valores neutros por defecto, NO la ley visual del sistema (guarda NEW de lima).
      Etiquetas por defecto en inglés (Close / Show next…) aunque hub_language=es → decisión de producto pendiente.
Comprobado: tsc ✔ (0 errores, incluido un test de tipos con @ts-expect-error) · node:test 20/20 ✔ ·
      Playwright 147/147 ✔ (Chromium 156 a 1440/834/393/320, Firefox 157 a 1440, WebKit 27.2 iPhone 15 + escritorio) ·
      axe-core sin violaciones A/AA ✔ · CSP estricta sin violaciones ✔ · 5 mutaciones detectadas ✔ ·
      teclado/foco ✔ · estados (compacto, expandido, progreso, indeterminado, temporizador, error, cola +N,
      contenido largo, texto al 200 % aproximado) ✔ · capturas en evidence/.
Auditoría arquitectónica: UI Primitive · ver la tabla de abajo · Component Health: saludable con reservas.
Cobertura de doc: README + criterios de publicación + CHANGELOG (estilo mora, solo lo verificado);
      página del Hub NO creada (el estado sigue en draft).
No pudo comprobarse: lectores de pantalla reales · Safari/Edge reales · dispositivos físicos y FPS ·
      forced-colors en navegador · zoom nativo · suelo de navegadores · detector de impeccable (no instalado/ejecutado).
Siguiente paso del usuario: decidir licencia y labels por defecto; autorizar o no las pasadas de impeccable y la
      verificación con AT/dispositivos reales; aprobar la transición draft → candidate cuando proceda.
```

## Auditoría arquitectónica (manual)
| Sev. | Hallazgo | Acción | Confianza |
|---|---|---|---|
| MEDIUM | `renderer.js` (≈18 KB) concentra medición, pintado e interacción. Hoy es legible y está probado; separarlo ahora sería sobrearquitectura | RECOMMENDATION (revisar si crece) | medium |
| MEDIUM | Cada `update()` vuelve a medir clonando la UI (layout). Con progreso muy frecuente puede costar. No medido en dispositivo | RECOMMENDATION: medir solo si cambia el texto o la estructura | medium |
| MEDIUM | Si el anfitrión abre un `<dialog>` modal **después** de la isla, este la tapa; con un modal abierto la isla es inerte | REVIEW_REQUIRED (decisión de producto; documentado) | high |
| MEDIUM | Animación en JS por rAF (no CSS/WAAPI): justificada por la interrupción con velocidad (D2-01), pero sin FPS medidos en dispositivo | RECOMMENDATION: medir antes de la Stable Gate | high |
| LOW | `island._internals` (no enumerable) expone piezas internas para las pruebas | REVIEW_REQUIRED antes de publicar (ocultar tras un flag o documentarlo como inestable) | high |
| LOW | `.cornisa-icon:has(svg, img)` no existe por debajo de FF 121 / Safari 15.4: solo afecta al borde del icono (mejora progresiva) | NO_ACTION | high |
| INFO | Separación de responsabilidades: datos y estado en `core/manager`, física en `core/drop`, presentación e interacción en `dom/renderer`; el núcleo no importa DOM | NO_ACTION | high |

**RECOMMENDED ACTION PLAN** (por dependencias): 1) decidir el `_internals` → 2) medir en dispositivos (FPS + coste de medición) → 3) optimizar la medición si hace falta → 4) documentar o mitigar el caso del `<dialog>` posterior.

**Component Health:** las responsabilidades están separadas; se podría cambiar el renderer sin tocar el gestor (el núcleo se prueba sin DOM) y cambiar la identidad sin tocar el JS (tokens). Las reservas son de verificación (AT, dispositivos), no de estructura.
