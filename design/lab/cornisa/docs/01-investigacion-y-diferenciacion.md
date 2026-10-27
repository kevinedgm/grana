# Isla dinámica para la web: investigación y diferenciación (fase 0)

**Estado:** borrador para revisión. No hay código ni nada publicado.
**Ruta Fruti Squad:** Kiwi, fase 1 (brief funcional), como paso previo a F0–F2. Todavía no hay intervención de Lima, Coco ni Mora.
**Fecha:** 2026-10-26

---

## 0. Conflicto de alcance que hay que resolver primero

La primera frase de la petición habla de una **librería de diálogos y alertas que sustituya a `alert()`/`confirm()`**. El brief adjunto describe una **superficie no modal anclada al borde superior** que "no bloquea la interacción con el resto de la página".

Son patrones distintos y, en parte, incompatibles:

| | `alert()`/`confirm()` y diálogos | Isla dinámica |
|---|---|---|
| Modalidad | Modal: bloquea la página y atrapa el foco | No modal: la página sigue siendo usable |
| Semántica ARIA | `dialog`/`alertdialog` con `aria-modal` | `status`/`log` (región viva) más un disclosure o región no modal |
| Gestión del foco | Lo mueve y lo atrapa, y lo devuelve al cerrar | Nunca roba el foco (WCAG 3.2.1/3.2.2) |
| Respuesta del usuario | Obligatoria (`await confirm`) | Opcional |

**Recomendación:** que la isla cubra el feedback no bloqueante (avisos, progreso, temporizador, multimedia, deshacer). La confirmación bloqueante se resuelve con `<dialog>` nativo como producto aparte o como módulo hermano posterior, sin forzarla dentro de la isla. **Necesito tu decisión** (ver §9).

---

## 1. Fruti Squad: qué se inspeccionó y cómo encaja

Repositorio clonado: `github.com/kevinedgm/fruti-squad`. Leí `README.md`, `agentes/{kiwi,coco,mora}/AGENT.md`, `skills/lima/SKILL.md`, `skills/lima/reference/component-api.md` y la plantilla `agentes/kiwi/assets/plantillas/brief.md`. También revisé por encima los encabezados de `skills/impeccable` e `skills/improve-animations`.

Flujo real: **Kiwi (estructura) → Lima (gobierno y contrato) → Coco (F3, implementación y auditoría) → Mora (documentación de lo verificado)**.

| Fase del proyecto | Pieza del Squad que corresponde | Lo que exige |
|---|---|---|
| Brief, flujo y wireframes de estados | Kiwi, fases 1–6 | Brief con hechos, supuestos e incógnitas; F0–F2 en grises; política compact/medium/expanded; WCAG 2.2 AA; traspaso a Lima |
| Contrato de API y estados | Lima (`ui-artifact-contract.md`, `component-api.md`) | La API expresa intención y no estilo (nada de props `color`/`radius`). No hay variantes inventadas. El estado lo controla el consumidor |
| Prototipo visual F3 e implementación | Coco (R1/R2, después R3) | Exige perfil de proyecto activo antes de diseñar. Coco es el único auditor |
| Movimiento | `improve-animations` (solo auditoría y plan) y `impeccable` → `animate.md` | Auditoría de movimiento posterior a la implementación |
| Documentación | Mora | Solo lo implementado y verificado |

**Bloqueos reales que encontré:**
- No existe un **perfil de proyecto de Lima** para esta librería. Coco y Lima piden inicializarlo (`skills/lima/reference/first-run.md`) antes de diseñar. Yo no lo he creado.
- El Squad no está *instalado* en este entorno. Lo leí como documentación y seguí su protocolo a mano. **No he invocado ninguna skill**; este documento corresponde a la fase 1 de Kiwi hecha siguiendo sus plantillas.

---

## 2. Alternativas existentes

Licencias y dependencias comprobadas hoy contra el registro de npm (`/latest`). Las estrellas de GitHub no se verificaron porque la API me limitó las peticiones.

### 2.1 Implementaciones tipo "Dynamic Island"

| Proyecto | Licencia (npm) | Deps runtime | Observaciones |
|---|---|---|---|
| `js-dynamic-island` 2.1.6 | MIT | ninguna | Vanilla. API de funciones sueltas por caso (`BubbleMessage`, `ProgressBox`, `Spinner`, `AddToCart`…), sin instancia actualizable común. Socket señala una cadencia de releases poco saludable (última versión hace aproximadamente un año) |
| `react-live-island` 0.10.0 | MIT | peer `react` | Solo React. Dos tamaños (`small`/`large`) fijados con props de píxeles (`smallWidth`, `largeHeight`…), es decir, API de estilo y no de intención |
| `ob-react-dynamic-island` 0.1.0 | **sin licencia declarada** en npm | `motion`, `clsx`, `tailwind-merge`, `deepmerge-ts`, peers React | Se basa en morphing con Motion y estados definidos por el usuario. Al no declarar licencia, no se puede reutilizar legalmente |
| `jhaemin/dynamic-island` (GitHub) | **no verificada** | — | Su autor la describe como "Just for fun" y en desarrollo. Es una réplica fiel, no una librería |
| CodePen de jh3y | — | React | Demo, no un producto |

### 2.2 Toasts y notificaciones (vanilla o agnósticas)

| Proyecto | Licencia | Deps | Lo que aporta | Por qué no basta |
|---|---|---|---|---|
| Notyf 3.10.0 | MIT | 0 | Ligero, con swipe | Toasts discretos que no se actualizan ni se transforman |
| Toastify-js 1.12.0 | MIT | 0 | Opción `ariaLive` | Estilos inline (`style.background`), sin estados ni actualización |
| Toastive 1.2.2 | MIT | 0 | Web component con buenos valores a11y por defecto (status/alert según tipo, pausa con hover o foco, Esc, reduced-motion) | Es una **referencia de a11y a igualar**. Pero el modelo es una pila de toasts, no una única superficie que se transforma |
| SweetAlert2 11.x | MIT | 0 | Referencia para sustituir `alert`/`confirm` | Es modal. Además, versiones de 2022 incluyeron comportamiento condicionado por geolocalización/dominio (*protestware*), un argumento a favor de dependencias mínimas y auditables |

### 2.3 Referencias React (no utilizables sin framework)
Sonner (MIT, peers React) y react-hot-toast (MIT, deps `goober`) establecen el estándar de experiencia de desarrollo: `toast.promise`, expandir al pasar el ratón y actualizar por id. Sonner es la **referencia de UX de movimiento** más próxima, pero va atado a React.

### 2.4 Primitivas de la plataforma (base, no competencia)
- **Popover API** (`popover="manual"`): capa superior sin z-index y sin modalidad. Es un buen candidato para montar la isla sobre ella.
- **`<dialog>`**: lo correcto para la confirmación modal (§0).
- **View Transitions API** y **WAAPI** (`element.animate`): permiten morphing de tamaño sin librería de animación.
- `env(safe-area-inset-top)`: notch y áreas seguras.
- Floating UI: posicionamiento anclado a un elemento. La isla va anclada al viewport, así que no lo necesita.

> **Pendiente de verificar:** la matriz exacta de compatibilidad de Popover API y View Transitions en los navegadores objetivo. No la he comprobado hoy y tiene que fijarse en el perfil antes de decidir la estrategia de animación.

---

## 3. Limitaciones comunes detectadas

1. **El modelo "pila de toasts" frente al de "superficie única que cambia de forma".** Las librerías vanilla crean y destruyen nodos. Ninguna de las analizadas ofrece una instancia persistente que pase de compacta a expandida y vuelva sin recrearse.
2. **Las islas que existen están atadas a React** o son demos. La única vanilla (`js-dynamic-island`) no tiene un modelo de estados unificado.
3. **API de estilo en lugar de intención** (px, colores inline), justo lo que `component-api.md` de Lima prohíbe.
4. **No hay una a11y del morphing.** Nadie trata qué se anuncia cuando el contenido *se actualiza* (p. ej. progreso al 37 %, 38 %…) sin saturar al lector de pantalla, ni cómo funciona el foco al expandir una superficie no modal.
5. **Estado y vista acoplados:** no se puede probar la lógica sin DOM ni sustituir el renderer.
6. **Reduced motion** se suele resolver quitando la animación, sin definir una transición alternativa como el fundido.

## 4. Oportunidad de diferenciación (concreta)

| # | Diferenciador | ¿Lo tiene alguna de las analizadas? |
|---|---|---|
| D1 | **Una superficie, muchas actividades:** cola con prioridad; si hay dos activas, una se compacta (como la isla dividida) | No |
| D2 | **`update()` sin recrear** y con morphing de tamaño medido (FLIP/WAAPI) | Solo parcialmente en React |
| D3 | **Núcleo sin DOM** (máquina de estados pura y testeable en Node) más un renderer DOM opcional y reemplazable | No |
| D4 | **Contrato de a11y explícito para contenido vivo:** anuncios limitados en frecuencia, progreso con `role="progressbar"` sin anunciar cada tick, expandir como disclosure que nunca roba el foco | Parcial (Toastive cubre toasts, no actualizaciones) |
| D5 | **Tematización solo con tokens CSS** (custom properties y `::part` si se usa un web component), sin identidad impuesta | Parcial |
| D6 | 0 deps runtime, ESM, sin framework | Sí en las vanilla, pero sin D1–D4 |

**Conclusión honesta:** la oportunidad existe y es estrecha. No es "otra librería de toasts", sino **una superficie de actividad en vivo, no modal, con un núcleo testeable y a11y para contenido que cambia**. Si D1–D4 no te parecen valiosos, Toastive o Notyf ya cubren el caso de los toasts simples.

## 5. Casos de uso (para el brief)
- Progreso de subida o exportación con resultado final (éxito o error) **en la misma instancia**.
- Temporizador o cuenta atrás (Pomodoro, sesión que expira).
- Mini controles multimedia persistentes.
- Acción contextual con deshacer ("Archivado · Deshacer").
- Notificación breve que se descarta sola.
- Estado de conexión (sin conexión, reconectando, conectado).

## 6. Propuesta de arquitectura

```
@pkg/core   (sin DOM)  máquina de estados · cola/prioridad · temporizadores inyectables · eventos
@pkg/dom    renderer: Popover API, medición FLIP, WAAPI, regiones vivas, teclado
@pkg/css    tokens (--island-*) y estilos base neutros
```
- El núcleo no toca `document`. Recibe un `clock` inyectable, lo que permite tests deterministas.
- El renderer se suscribe al núcleo, nunca al revés.
- El contenido se pasa como **datos estructurados** (icono, título, texto, progreso, acciones) que se renderizan con `textContent`. HTML arbitrario solo mediante `Node` del consumidor, nunca con cadenas `innerHTML` (para evitar XSS y facilitar CSP).
- Grana: solo para prototipar en el Hub, nunca en `dependencies`.

## 7. Borrador de contrato de API (a aprobar)

```js
import { createIsland } from 'pkg';

const island = createIsland({ root?, labels? });     // un gestor por página

const a = island.show({
  id?, intent: 'neutral'|'success'|'warning'|'error',   // intención, no color
  icon?, title, body?, progress?: number|'indeterminate',
  actions?: [{ label, onSelect }],                       // máx. 2
  duration?: number | 'persistent',
  priority?: 'low'|'normal'|'high',
});

a.update({ title, progress, ... });   // misma instancia, transición de forma
a.expand(); a.collapse();
a.dismiss(reason?);                   // → Promise<void> al terminar la salida
a.state;                              // solo lectura
a.on('statechange' | 'action' | 'dismiss', fn) → off()

island.promise(p, { loading, success, error });   // azúcar sobre show/update
island.destroy();                                  // limpia nodos, timers, listeners
```
Lo que **no** incluye, de forma deliberada: props de color, radio o tamaño en píxeles, ni HTML como string.

## 8. Máquina de estados (por actividad)

```
idle ──show──▶ entering ──animend──▶ compact ◀──collapse── expanded
                                      │   ▲                   ▲
                                      │   └──────expand───────┘
                                update│ (cualquier estado visible → updating → estado previo)
                                      ▼
            dismiss (o timeout si no es persistente) ──▶ dismissing ──animend──▶ removed
```
- `persistent` es un **flag** (anula el timeout), no un estado.
- `updating` es transitorio y vuelve al estado anterior al terminar la medición y la animación.
- El temporizador se pausa en hover, en foco, en `expanded` y con `document.hidden` (WCAG 2.2.1).
- Reduced motion: los mismos estados, con fundido corto en vez de morphing (las transiciones no se saltan, y así los eventos siguen siendo deterministas).
- Gestor: una actividad principal visible y como mucho una secundaria compacta. El resto se encola por prioridad.

## 9. Prototipos visuales que haría (Kiwi F2, en grises, pendiente de tu visto bueno)
Panel de estados con: compacto (icono y texto) · compacto con progreso · expandido con acciones · actualizando (de progreso a éxito) · dos actividades (dividida) · descartando · persistente multimedia · contenido largo y zoom al 200 %. Cada uno en compact (393 px, con notch y safe-area), medium (834) y expanded (1440) como **tamaños de referencia declarados**. La identidad visual (F3, Coco) queda fuera hasta que la definas tú.

## 10. Decisiones que necesito de ti
1. **Alcance:** ¿solo la isla no modal, o isla más un módulo hermano `confirm()` sobre `<dialog>`?
2. **Navegadores objetivo** (determina si se usa Popover API o View Transitions con fallback).
3. **Forma de distribución:** ¿funciones con renderer DOM, web component `<x-island>`, o ambos?
4. **Nombre del paquete** (comprobaré disponibilidad en npm cuando haya candidatos).
5. **¿Inicializo el perfil de proyecto de Lima** (`first-run.md`) para que Kiwi, Coco y Mora puedan seguir su flujo real?

## Hechos · Supuestos · Incógnitas
**Verificado:** lectura de los archivos del Squad citados; licencias, versiones y dependencias en npm de 10 paquetes; los resultados de búsqueda citados.
**Supuesto:** que las demos de React no son librerías mantenidas; el valor de D1–D4 para tus usuarios.
**No verificado:** licencia de `jhaemin/dynamic-island`, estrellas y actividad en GitHub, compatibilidad de las APIs de plataforma, código interno de las librerías (solo leí READMEs y metadatos).
