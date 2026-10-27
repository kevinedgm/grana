# Compatibilidad de navegadores: investigación y propuesta

**Fuente:** `@mdn/browser-compat-data` **8.1.7**, consultado hoy (2026-10-26) con un script (`node`), no de memoria. Son los datos de MDN que usa caniuse para estas APIs. **Estado:** propuesta pendiente de aprobación.

## Versiones estables actuales (BCD, `status: current`)
| Chrome | Edge | Firefox | Safari | Chrome Android | Firefox Android | Safari iOS |
|---|---|---|---|---|---|---|
| 156 | 155 | 158 | 27 | 156 | 158 | 27 |

## Primera versión con soporte, por API
| API / CSS | Chrome | Edge | Firefox | Safari | Chr. And. | FF And. | Safari iOS | Papel en la librería |
|---|---|---|---|---|---|---|---|---|
| `Element.animate` (WAAPI) | 36 | 79 | 48 | 13.1 | 36 | 48 | 13.4 | **Requerida** |
| `Animation.finished` | 84 | 84 | 63 | 13.1 | 84 | 63 | 13.4 | **Requerida** (encadenar fases) |
| `ResizeObserver` | 64 | 79 | 69 | 13.1 | 64 | 79 | 13.4 | **Requerida** (medir contenido) |
| `AbortController` | 66 | 16 | 57 | 12.1 | 66 | 57 | 12.2 | **Requerida** (limpieza de listeners) |
| `env()` (safe-area) | 69 | 79 | 65 | 11.1 | 69 | 65 | 11.3 | **Requerida** |
| `prefers-reduced-motion` | 74 | 79 | 63 | 10.1 | 74 | 64 | 10.3 | **Requerida** |
| `MediaQueryList` evento `change` | 39 | 79 | 55 | 14 | 39 | 55 | 14 | **Requerida** (reaccionar en caliente) |
| `:focus-visible` | 86 | 86 | 85 | 15.4 | 86 | 85 | 15.4 | Mejora progresiva (con alternativa `:focus`) |
| Unidades `dvh` | 108 | 108 | 101 | 15.4 | 108 | 101 | 15.4 | Opcional |
| `forced-colors` | 89 | 79 | 89 | 16 | 89 | 89 | 16 | Mejora (modo de alto contraste) |
| `prefers-contrast` | 96 | 96 | 101 | 14.1 | 96 | 101 | 14.5 | Mejora |
| **Popover API** | 114 | 114 | 125 | 17 | 114 | 125 | **18.3** | **Opcional** (capa superior por encima de `<dialog>` del anfitrión) |
| **View Transitions** (mismo documento) | 111 | 111 | **144** | 18 | 111 | 144 | 18 | **Opcional**: no se usará en el núcleo |
| `@starting-style` | 117 | 117 | 129 | 17.5 | 117 | 129 | 17.5 | Opcional |
| `interpolate-size` | 129 | 129 | **no** | **no** | 129 | no | no | **Descartada** (solo Chromium) |
| Custom Elements `define` | 54 | 79 | 63 | 10.1 | 54 | 63 | 10.3 | Solo para el futuro adaptador WC |

## Propuesta
1. **Objetivo probado:** las versiones estables actuales (tabla superior), en escritorio y móvil, como pediste.
2. **Suelo funcional declarado:** el máximo, por navegador, de las APIs requeridas:
   **Chrome/Edge ≥ 84** (`Animation.finished`) · **Firefox ≥ 69** (`ResizeObserver`; en Android ≥ 79) · **Safari ≥ 14 / iOS ≥ 14** (evento `change` de `matchMedia`).
   Este suelo **sale de los datos y no se ha probado**: solo se probarán las versiones actuales. Si prefieres no declarar un suelo sin pruebas, la alternativa es «últimas 2 versiones mayores» de cada navegador.
3. **Popover:** si existe `HTMLElement.prototype.popover`, se usa `popover="manual"` para quedar por encima de los `<dialog>` modales del anfitrión. Si no existe, `position:fixed` + `z-index` configurable. La diferencia de comportamiento se documentará: sin Popover, un `<dialog>` modal del anfitrión tapa la isla.
4. **Animación:** solo WAAPI, interrumpible (se parte del tamaño medido actual). View Transitions no se usa: no permite interrumpir a mitad con la misma granularidad, y en Firefox llegó tarde (144).
5. **Sin polyfills** en el paquete.

## Verificación de navegadores disponible
- Disponible aquí: Playwright con Chromium, Firefox y WebKit 27.2 (las builds de Playwright).
- **No disponible:** Safari real, Edge real, dispositivos iOS/Android físicos. Antes de publicar habrá que probarlos (p. ej. con un servicio de dispositivos o hardware propio); está anotado como criterio de publicación.


## Corrección (2026-10-26, al preparar el build para CDN)
La tabla anterior solo cubría las APIs que se eligieron entonces. La auditoría sistemática de **todo** lo que usa el código (APIs, sintaxis y CSS, script `audit.cjs` contra BCD 8.1.7) encontró usos por encima del suelo:
| Uso | Necesitaba | Efecto | Corrección |
|---|---|---|---|
| `Element.replaceChildren` | Chrome/Edge 86 · FF 78 | Error de JS | Helper con `removeChild`/`appendChild` |
| `addEventListener({ signal })` | Chrome/Edge 90 · FF 86 · Safari 15 | `destroy()` dejaba listeners vivos | Registro manual de listeners |
| CSS `inset` | Chrome/Edge 87 · Safari 14.1 | La isla perdía su posición | `top` / `right` / `left` |
| CSS `padding-block` | Chrome/Edge 87 · Safari 14.1 | Sin relleno en el título expandido | Propiedades longhand |
| `?.` / `??` en `src/` | FF 74 / 72 | Error de sintaxis | `dist/` transpilado como entrada del paquete; `src/` documentado como FF ≥ 74 |
El suelo se mantiene **para `dist/`**, verificado por análisis estático y **no probado** en navegadores antiguos.
