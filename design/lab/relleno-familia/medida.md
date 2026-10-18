# Relleno de familia como forma después de #672: medida y cierre (coco + lima, 2026-10-18)

Revisión de los candidatos de `PENDIENTES.md` §5. Medido sobre los **componentes reales** (UMD de `dist/`) con
[`tests/relleno-familia.spec.mjs`](../theme-playground/tests/relleno-familia.spec.mjs) en Chromium, Firefox y WebKit.
Temas: el tema por defecto, los cinco del CLI de `btn-limitaciones.spec.mjs` (T1 `#1B1F4B`, T2 `#F2C200`,
T3 `#E6007E` + `#00A3FF`, T4 sin oscuro, T5 `primary` `#FFD400`, todos con `categories: 8`), y `data-g-zone="brand"`
con el tema por defecto y con T2. Todos en claro y oscuro.

**Forma** = el mayor entre relleno y contorno visible, medido contra lo que hay detrás del elemento. En una figura sin
caja se mide su tinta. Se exige ≥ 3:1 (WCAG 1.4.11) a todo lo que es control, estado o figura que transmite
información. Lo exento se mide e imprime, pero no se exige.

## Resultado por candidato (mínimo en todos los temas y motores)

| Candidato | Antes | Después | Cierre |
| --- | --- | --- | --- |
| `GBadge` figura sola `solid` | **1.43** (T5 claro, `brand`); 1.68 T2; 2.73 T3 `accent`; 2.88 zona clara `warning`; 2.20 zona T2 oscura | **4.50** | **Corregido**: `--_mark: var(--_text)` (#439, #673) |
| `GSidebar` punto (`dot`) | **1.32** (T5 claro); 1.56 T2; 2.52 T3; 2.50 zona clara; 1.93 zona T2 oscura | **4.15** | **Corregido**: `color: var(--_text)` y `--_text` en las siete familias (#439, #673) |
| `GSidebar` punto sobre la píldora actual del navbar | Cuadrado blanco: heredaba `background` y `outline` del contador invertido | Sin caja, `on-current`: **10.78** | **Corregido** (defecto previo, #673) |
| `GStepper` completado **al pasar el puntero** | **1.74** (zona T2 oscura); 1.86 T5; 2.06 zona clara; 2.22 T2 | **4.61** | **Corregido**: el borde sigue en `-text` (#438; antes `-strong`) |
| `GFab` acuse `done`/`failed` y «Confirmar» | El borde era igual al relleno semántico | `{sem}-text` → **4.51** (5.41 en la zona) | **Corregido** (§7.1, #672). Medido con el marcado del contrato y también con el componente montado (`fab.umd.js`). La insignia vive dentro del FAB con un aro de `surface`: se mide contra ese aro |
| `GBadge` `solid` con caja (texto, contador) | 1.43 T5; 1.68 T2; 2.73 T3; 2.88 zona clara; 2.20 zona T2 oscura | **4.50** | **Corregido por decisión del usuario** (#674): contorno `{color}-text` en el borde que ya existía |
| `GSidebar` contador | 1.32 T5; 1.56 T2; 2.52 T3; 2.50 zona clara; 1.93 zona T2 oscura | **4.15** | **Corregido por decisión del usuario** (#674): trazo interior `-text`, sin trazo sobre la píldora |
| Anfitriones de `.g-btn` sobre otra superficie: `GToast`, `GStatusIsland` (lista e inversa), panel y disparador de la voz, barra de `GTranscript` | — | **3.45** | **Ya cumplen**: son `outline`/`ghost` neutros con borde `border-control` o `surface`; el único `solid`, «Descartar», hereda #672 |
| `GAvatar` con `cat-k` | 1.04–1.15 (relleno `cat-k-soft`) | igual | **Exento**: par `soft` |
| `GTag` estática con `cat-k` | 1.04–1.72 (par `soft`) | igual | **Exento** (#470) |
| `GCard` con `color` (casilla marcada) | 4.50 | — | **Ya cumple**: contorno `--_mark` = `{color}-text` |
| `GTag` pulsada (neutra y `cat-k`) | 4.36 | — | **Ya cumple**. En la zona, `cat-k-text` = `on-brand-zone` lo pone el bloque del CLI (§44.6). La copia del playground, `playground/tag-categories.css`, era anterior a la zona y daba 2.81–2.92; se regeneró con `node design/lab/chip/estilo-temas.mjs` (#674) |
| `GSlider` píldora y tramo | 4.50 | — | **Ya cumple** (#454) |
| `GProgress` avance | 4.15 | — | **Ya cumple** (#439) |
| `GStepper` completado y actual en reposo | 4.50 | — | **Ya cumple** (#432) |
| Inventario de #432 | — | — | **Ya cumple**: `node design/lab/contraste-marcado/verificar.mjs` da 5391/5391. Cada uno lee `{familia}-text`, que el motor garantiza ≥ 4.5:1 en cualquier tema |

**Δ0 con el tema por defecto:** en claro y oscuro, cada contorno `-text` en reposo tiene el mismo color que su relleno.
La prueba «Δ0 en reposo» lo confirma en los tres motores. El hover del completado de `GStepper` deja un filo de un
trazo mientras dura, igual que el que #438 ya acepta.

## Lo que queda exento (lima)

- **La insignia con caja y el contador ya no están exentos.** WCAG no los exige, porque su número o texto conserva ≥ 4.5:1 sobre el relleno. Aun así, el usuario eligió la coherencia con el botón (#674): con cualquier marca, la píldora se sigue leyendo como forma.
- **La figura sola y el punto.** No tienen texto visible, solo un nombre oculto para lectores: la figura **es** la información. Entran en la regla de formas sin par (#439) y se corrigen.
- **El avatar y la etiqueta estática siguen exentos.** Son un par `soft`/`on-soft`: las iniciales o el texto dan ≥ 4.5:1, y el fondo suave nunca fue la forma.

Repetir: `GRANA_PW_PORT=4211 npx playwright test tests/relleno-familia.spec.mjs` desde `design/lab/theme-playground`
(59 casos por motor, 177 en total; `VERBOSE=1` imprime la tabla completa).
