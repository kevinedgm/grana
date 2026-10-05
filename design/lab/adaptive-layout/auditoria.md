> **SUSTITUIDA (coco, 2026-10-05).** Esta auditoría la escribió Codex fuera del flujo del Fruti Squad y **no vale** como paso 5: su «tema alternativo» eran cinco variables puestas a mano (no un tema de `@grana/cli`), sus bancos de estilo estaban en `/private/tmp/` y su script usa la prop `hints`, retirada por #364. La auditoría vigente es **`auditoria-coco.md`** (script `auditoria-coco-verificar.mjs`). Se conserva solo como historia.

# Coco · auditoría real de GAdaptiveLayout

Estado: **puerta Coco aprobada, sin bloqueantes**, primer prototipo funcional. Auditoría sobre dist final reconstruido tras corrección hidden, contrato vigente decisiones #339–348. Build y suite final de Bruno en Node24.19.0:74 archivos/2328 pruebas; banco funcional253 comprobaciones por motor/759 total. Metadatos y promoción pertenecen a Bruno. No se declara stable, publicación1.0 ni conformidad legal integral.

## Reproducción y resultado

`node design/lab/adaptive-layout/auditoria-verificar.mjs` desde raíz, después de build. Banco Vue real `packages/vue/playground/adaptive-layout.html`, recursos dist servidos por routing local de Playwright. Script y JSON/screenhots son evidencia de Coco.

| Motor | Versión | Assertions finales | Fallos |
|---|---|---:|---:|
| Chromium |153.0.8010.12|1994|0|
| Firefox |155.0|1994|0|
| WebKit |26.6|1994|0|
| Total | |5982|0|

Análisis estático CSS: solo tokens existentes y aliases locales, cero medidas de tema literales, var() sin respaldos, sin @layer ni tokens nuevos. Los porcentajes, ceros y factores son geometría/política aprobada. Layout carece de superficie, radio, sombra, fuente y movimiento propios.

## Matriz ejecutada

- Claro por defecto, oscuro por defecto y tema alternativo (Georgia, space5, column-gap25,row-gap30,radius0), todos a240/320/400/460/720/1120px y LTR/RTL real. Cada selección RTL verifica direction computado, luego límites de raíces, posiciones de contenido y etiquetas internas sin desborde horizontal ni fuente por debajo12px.
- Texto de etiquetas y controles en los tres temas: contraste calculado por luminancia WCAG sobre fondo opaco computado más cercano, ≥4.5:1; sin afirmación de contraste de contenido arbitrario aportado por aplicación. No añade colores propios.
- Las12 combinaciones density(default/comfortable/compact) y gap(default/none/small/large), separación computada de tokens con factores1/.875/.75 y1/0/.5/2. Cambio de fuente/tokens a mismo ancho realmente invalida geometría.
- Horizontal left/center/right permanece físico con RTL y LTR; posición de dos campos en fila invierte lectura visual en RTL conservando DOM. Vertical top/center/bottom con500px de altura libre produce alineación correcta del conjunto y alturas de contenido, sin inventar altura en caso normal.
- Foco, identidad de nodo e intervalo2..8 backward conservados al estrechar de460a320. Tab de Calle aExterior y Shift+Tab inverso nativos, sin rol grid/tabindex de layout. Sin clipping propio del foco; closingReveal se comprueba invisible durante antiguo fade.
- Número montado ocultado con hidden deja caja0 y carece data-line; al revelar recupera ancho/mínimo intrínseco. Reveal abierto, etiqueta larga, error y pie mantienen límites. Readonly/disabled visibles continúan presentes. Banco GForm real incluido en matriz de raíces; validación/FormData detallada corresponde al banco funcional de Bruno.
- Text spacing WCAG activo comprobado por letter-spacing computado (line-height1.5,letter-spacing.12em,word-spacing.16em,párrafos2em). Etiquetas/control del ejemplo con font200%; no recorte de etiquetas/pies ni desborde de raíces. Vista320CSSpx demuestra reflow equivalente a geometría de400% sobre1280, **no** prueba de zoom nativo.
- Grupo anidado, avatar natural y tabla directa: raíces dentro de contenedor, tabla mantiene overflow:auto propio para información bidimensional. GBtn y GCard reales con texto largo en240px no desbordan; genérico no garantiza comprender semántica arbitraria.
- ClosedReveal con cero/uno/tres hermanos antes de medición no reserva hueco. Una página real sin ResizeObserver permanece fallback, muestra campo editable y no gap final de reveal cerrado; SSR sinDOM fue validado por Bruno. Vacío sin contenido visible no fabrica fila de cerrado.
- Contexto touch separado activa pointer:coarse: todos botones de campos numéricos ≥44px en ambas dimensiones. Normal ≥24px. Forced colors y reduced motion: layout sin clipping ni animación propias; conserva delegación de colores/foco a los hijos.
- Regresiones finales #347: hint width:full por name canónico oculto de GNumberField con rango0..9 y steppers ocupa fila propia conservando ancho auto, mínimo intrínseco y máximo; avatar con hint full conserva sus64px naturales; targets siguen≥24px; cambiar etiqueta externa de input directo invalida perfil; style gap en raíz y font en ancestro cambian medidas a mismo ancho sin overflow.
- Cero pageerrors durante ejecución final. Capturas `auditoria-chromium.png`, `auditoria-firefox.png`, `auditoria-webkit.png`; revisión visual de Chromium confirma ausencia de superposición de líneas de etiquetas con overrides activos.

## Defectos encontrados y corregidos

1. **Banco RTL/spacing no ejercitaba estados.** Directivas Vue en `main#app` raíz mount no se procesaban, por lo que dirección seguía LTR y spacing no aplicaba. Devuelto a Bruno, corregido colocando bindings en wrapper hijo y comprobando estilos computados. La evidencia anterior que decía cubrir RTL/textspacing queda **invalidada**; JSON final reemplaza reportes intermedios. No era fallo demostrado del planner.
2. **Fila fantasma de reveal cerrado.** Excluido planner pero Grid auto reservaba fila0+gap20; centro era top166/bottom186 y bottom dejaba20px. La solución `grid-row:1` se descartó por fila fantasma de fallback. Lima aprobó#346: containing block relativo y únicamente reveal cerrado inert fuera de flujo absoluto, origen lógico,width100%, datos/nodos/mediciones intactos. Al cerrar queda instantáneamente invisible sin transición para no superponerse a primera fila; abierto vuelve aGridfull y conserva apertura del componente. GFormReveal global no se modifica.
3. **hidden anulado por CSS autor.** Campo GInput con hidden aún tenía display:flex,height68 mientras planner lo excluía. CSS scoped root/direct-child[hidden] impone display:none. Readonly/disabled no son hidden. Regresión real recuperar mínimo numérico pasa.
4. **Banco estilo temprano auto encogía pila.** Antes de Bruno, inline-size:auto con justify-self:left encogía raíces: cambiado a100% como default previo a medida.36 assertions iniciales correctas; evidencia inicial no sustituyó esta auditoría real.

5. **width:full perdía el perfil base.** La rama inicial propagaba extremos del dominio numérico como max geométrico y omitía chrome/intrínsecos/natural. Devuelto a Bruno: calcula primero perfil normal/natural y agrega únicamente full:true; kind full estructural sigue separado. La puerta se reabrió aunque el banco anterior pasaba porque ese banco solo verificaba fila propia. Regresión añadida: activar/desactivar full por name canónico en número entero0..9 con steppers y por id en avatar64, exigir mismo ancho base/topes, fila propia y targets intactos.

## Rendimiento y límites

Evidencia de Bruno: `packages/vue/tests/adaptive-layout.performance.json`, CPU Intel Core i9-9880H2.30GHz, Darwin x64, Chromium153, Node24.19.0. Banco ejecutado sin otros bancos simultáneos:40 muestras planner puro,15resizes,10warmups, settling500ms. Series nativas conservadas de su corrida previa; series Grana repetidas tras preservar altura propia de cajas, sin aplicar estilos .native a componentes reales. No se infiere comparación causal entre corridas.

| Serie | Hijos | Montaje frío ms | Resize p50 ms | Resize p95 ms |
|---|---:|---:|---:|---:|
| Nativos, sin pistas compartidas |10|3.7|19.4|27.6|
| Nativos, sin pistas compartidas |50|11.8|27.2|38.1|
| Nativos, sin pistas compartidas |200|38.9|47.6|61.7|
| Nativos, sin pistas compartidas |500|113.6|103.9|144.9|
| Grana C12, pistas compartidas |200|51.2|64.4|111.2|
| Grana C12, pistas compartidas |500|171.1|146.5|248.8|

Tiempos acumulan callbacks rAF instrumentados de todos layouts montados de la demo; no son duración aislada del componente ni de un frame. Lecturas/escrituras se solapan con esos callbacks. El coste de200/500 campos reales es un límite de este primer prototipo; pistas compartidas solo se habilitan cuando alguna fila tiene pareja C12 reconocida. No se oculta ese coste ni se promete fluidez de resize sostenido para grandes formularios.

No se promete60fps, rendimiento portátil ni rendimiento móvil. Más64hijos usa fallbackgreedy acotado, no virtualización. El caso500requiere seguimiento/optimización para experiencias con resize sostenido; no se convierte en omisión de contenido.20 ciclos mount/unmount conservaron10targetsRO antes/después y0targetsdesprendidos: indica limpieza observada de observers, **no** prueba exhaustiva de ausencia de fugas de heap.

No ejecutados: lector de pantalla humano (VoiceOver/NVDA), móvil físico, zoom nativo de navegador200/400%, acreditación completa EN301549/Section508. Contraste es prueba automatizada de escenarios, no todas combinaciones posibles de tema. Tabla puede tener scroll interno por naturaleza bidimensional. CSS fijo arbitrario del consumidor, breakwords visuales bajo mínimo y controles de terceros desconocidos siguen límites documentados. Text200+spacing puede separar una palabra en ancho estrecho sin elipsis ni pérdida; no promete porcentaje fijo7/2/1.

## Traspaso

Bruno conserva propiedad de meta.json y aplica status candidate solo si sus puertas funcionales/contrato finales están cerradas; cualquier hallazgo ulterior de hints o integración se resuelve por su dueño. Mora-docs documenta API y estos resultados reales, las limitaciones, fallback/64hijos/hints y excepción de cierre instantáneo de Reveal dentro del layout. No declarar stable por esta auditoría.

## Refinamiento verificado #348

El banco final incorpora alineación de etiquetas/cajas/pies en campos C12, anchos240/320/400/460/720/1120, temas, RTL y gaps. Campos genéricos y filas sin pareja C12 mantienen la geometría original. Fixture real mixto GInput readonly sin etiqueta visible, GNumberField con steppers, GSelect y GTextarea con etiqueta/error largos comprueba cajas con top común y alturas propias intactas; full elimina la pareja y vuelve al modo original. Montar500 inputs nativos no activa pistas compartidas y unmount elimina su raíz.

Defectos resueltos del refinamiento: Firefox calculaba altura intrínseca de etiqueta estrecha con ancho de pista padre; clamp al alias de ancho únicamente en label/pie evita invasión sin recortar contenido. Stretch de pista caja ampliaba controles bajos al alto de textarea; align-self:start conserva cada altura. La regla subgrid de campos vencía a hidden; selector directo hidden con especificidad suficiente, al final del CSS, conserva display:none aun cuando otros dos campos siguen activando pistas compartidas. La auditoría anterior detectó esta última regresión en los tres motores; se invalidó ese gate y se reconstruyó dist antes de repetir.

Sin soporte CSS subgrid se conserva fallback original; no se garantiza alineación compartida de controles en ese entorno. Las limitaciones de lectores de pantalla, dispositivos y zoom físico siguen vigentes.

## Confirmación definitiva

Ejecución final:1994 comprobaciones por motor,5982 total, cero fallos en Chromium153/Firefox155/WebKit26.6. JSON y capturas corresponden al rebuild final con corrección hidden. La regresión de ocultar un campo mientras otros dos conservan pistas compartidas pasa en los tres motores; la alineación C12 y alturas propias pasan sin estirar compactos. Sin cambios adicionales solicitados por Coco. Lista la documentación de Mora-docs y promoción por Bruno según sus puertas funcionales.
