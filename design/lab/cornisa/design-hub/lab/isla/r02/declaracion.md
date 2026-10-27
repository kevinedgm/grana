# Declaración de cumplimiento · Isla «Top-Edge Droplet» · r02

| Campo | Valor |
|---|---|
| Ruta | R1 |
| Fidelidad | F2 + movimiento funcional (desviación declarada) |
| Pregunta de diseño | ¿Se percibe el movimiento como una superficie que emerge del borde, y no como una notificación que entra desde arriba, sin perder legibilidad, accesibilidad ni la no modalidad? |
| Artefactos | brief.md · index.html (prototipo + filmstrip + superposición de siluetas) · decisiones.yaml · hallazgos.md · declaracion.md |
| Modifica producción | No |

## Estándares leídos
- Los de r01, más `impeccable/reference/animate.md` y `improve-animations/AUDIT.md` §3–§6. **Solo se leyeron**: ninguna de las dos skills se invocó. improve-animations, además, es de solo lectura y produce planes, no prototipos.

## Desviaciones del protocolo
- **Movimiento en F2**, igual que en r01. Esta vez es el objeto mismo de la ronda; los valores de los muelles son provisionales (D2-02).
- **Elasticidad:** `animate.md` desaconseja el rebote «por reflejo». Aquí lo pide el brief y se acota al rango 0.1–0.3 de AUDIT.md.
- **Animación con rAF en JS** en lugar de CSS/WAAPI (H2-07, justificado en D2-01).

## Comprobaciones ejecutadas
- `check_artifact.py --fidelidad F2`: ✔ 0 errores · 0 avisos.
- Playwright: **150/150** en total (r01: 90, r02: 60 = 10 pruebas × 6 proyectos: Chromium 1440/834/393/320, Firefox 1440, WebKit 393 móvil). Lo que comprueba r02, frame a frame con `requestAnimationFrame`:
  - **Origen:** en todos los frames visibles, el `getBBox().y` del path es ≤ 0 y el path contiene la unión cóncava; la gota está centrada (±1.5 px).
  - **Emergencia y deformación:** la relación ancho/alto varía más de ×2 durante la entrada; la curvatura inferior supera 2 px; nace con menos de 1/3 del ancho final; ni el SVG ni la UI tienen animaciones CSS/WAAPI, y la UI nunca escala.
  - **Legibilidad:** la fila solo es visible si la silueta mide al menos lo que ocupa; el detalle, igual; al retirarse, el contenido ya es invisible cuando la silueta empieza a encoger.
  - **Secuencia completa:** pasa por todas las fases, de `birth` a `gone`. Al terminar no queda bucle rAF, el path está vacío y la UI desmontada.
  - **Interrupción** (retirar a los 160 ms y volver a mostrar a los 330 ms): sin saltos (Δalto < 30 px y Δancho < 60 px por frame) y termina en reposo.
  - **Movimiento reducido** (emulado): aparece con un único alto (sin fotogramas intermedios), transición solo de opacidad y sin bucle.
  - **No modal y teclado:** el foco no se mueve al aparecer; la página recibe clics; Enter expande, Tab llega a la acción, Esc contrae y devuelve el foco, y el foco fuera contrae. No hay `inert` ni `aria-modal`.
  - **Accesibilidad:** SVG con `aria-hidden`; grupo con nombre; anuncio en la región persistente.
  - **Responsive y safe-area:** cabe en el marco (≤ ancho − 24) en los estados expanded y long, con y sin notch; la fila queda bajo el inset; targets ≥ 44 px.
- **Pruebas de mutación** (para comprobar que las pruebas detectan fallos de verdad): (A) nacer a ancho completo y sin curvatura → falla «emergencia y deformación»; (B) texto siempre visible → falla «legibilidad». En ambos casos se restauró el prototipo (`diff` idéntico).
- **Coste de dibujo por frame** (solo JS: modelo + path, sin raster), p95: Chromium 0.2 ms; Firefox y WebKit 1.0 ms. Los navegadores limitan la resolución del reloj a 0.1 ms / 1 ms, así que son cotas superiores. **No es una medición de FPS en dispositivo.**
- Evidencia: `qa/evidence/r02-film.png` (secuencia fotograma a fotograma + superposición de siluetas del nacimiento) y `r02-hoja-{1440,393,320}.png` (estados asentados, con y sin notch).

## Matriz de adaptación
| Elemento | compact (<600) | medium | expanded (≥1024) | Técnica |
|---|---|---|---|---|
| Gota en reposo | Ancho del contenido (máx. 100 % − 24 px) × (inset + 52) | Ídem, máx. 400 | Ídem, máx. 400 | Medición + muelle |
| Gota expandida | 100 % − 24 px; alto según el contenido medido | 400 px | 400 px | Medición en un contenedor aparte (H2-01) |
| Notch | La gota cubre el inset; el contenido va debajo | — | — | `env(safe-area-inset-top)` (simulado con 48 px) |

## Comprobaciones NO ejecutadas
- **La sensación del movimiento, juzgada por una persona.** El criterio de aprobación («se percibe como una superficie que emerge del borde») **es tuyo**. Las pruebas comprueban propiedades geométricas que lo sostienen, no la percepción.
- FPS y jank en dispositivos reales (iOS Safari, Android de gama media); en 120 Hz vs 60 Hz el modelo es estable (paso fijo), pero no se ha observado.
- Lectores de pantalla reales; forced-colors (D2-09); zoom al 200 %; RTL.
- Varias actividades en el modelo de gota (D2-06): no diseñado.

## Traspaso
- **→ lima:** la máquina de estados suma la sub-fase visual `contracting` y las fases internas de retirada (`retract0/1/2`). Propuesta: que sigan siendo **internas del renderer** y no cambien la API pública (el estado público sigue siendo `dismissing`).
- **→ coco (F3):** valores de los muelles, color e identidad, forced-colors, rendimiento en dispositivo, H2-01 como regla de implementación.
- **→ mora:** nada todavía.

## Siguiente paso del usuario
Ver la secuencia (botón «▶ Secuencia completa», con «Cámara lenta ×4») y juzgar el criterio de aprobación. Resolver D2-06…D2-09. **Actualización 2026-10-26: el usuario aprobó la dirección de movimiento r02.** Quedan congeladas D2-01, D2-03, D2-04 y D2-05. D2-02 (valores de los muelles) sigue `proposed` para ajustarla en F3. D2-06…D2-09 siguen abiertas.
