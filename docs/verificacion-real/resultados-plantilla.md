# Plantilla de resultados de la verificación en entorno real

Copia este archivo a `docs/verificacion-real/resultados/AAAA-MM-DD-<entorno>.md` (por ejemplo `2026-10-20-nvda-windows-firefox.md`) y rellénalo. **Un archivo por entorno y sesión.** No edites este original.

## 1. Cabecera (obligatoria)

| Campo | Valor |
| --- | --- |
| Persona que probó | |
| Fecha | |
| Guion | `voiceover-safari-macos` / `nvda-windows` / `voiceover-ios` / `talkback-android` / `alto-contraste-windows` / `safari-macos` / `zoom-y-texto` |
| Sistema operativo y versión | (p. ej. macOS 26.0, Windows 11 24H2, iOS 26.0, Android 15) |
| Dispositivo | (p. ej. MacBook Air M2, iPhone 15, Pixel 8, ThinkPad…) |
| Navegador y versión | (p. ej. Safari 26, Firefox 140, Chrome 141) |
| Lector de pantalla y versión | (p. ej. VoiceOver de macOS 26, NVDA 2025.3, TalkBack 15.1; «ninguno» en alto contraste, Safari y zoom) |
| Teclado / ratón / táctil | (físico, Bluetooth, solo táctil…) |
| Idioma del sistema y del lector | |
| URL probada | (`http://localhost:4173/playground/` o la IP; o la URL del sitio de documentación) |
| Commit de Grana (`git rev-parse --short HEAD`) | |
| Versión de los paquetes | `0.1.0-beta.0` |
| Tema y modo del playground | (por defecto, Claro, salvo lo indicado) |
| Configuración no estándar | (ajustes del lector o del navegador que cambiaste; «ninguna») |

## 2. Resultados por paso

Una fila por paso hecho. `Resultado`: **pasa**, **falla**, **nota** (se cumple lo exigible pero hay algo que anotar) o **n/a** (no se pudo probar; di por qué).

| Paso | Resultado | Navegador | Lo que se oyó o se vio (copia el texto del visor del lector) | Evidencia (captura, grabación) | ¿Bloquea 0.1.0? | Entrada en PENDIENTES |
| --- | --- | --- | --- | --- | --- | --- |
| VM-01 | | | | | | |
| VM-02 | | | | | | |

Reglas para rellenar:

- **«¿Bloquea 0.1.0?»**: «sí» solo si el paso está marcado `[BLOQUEA 0.1.0]` **y** se cumple su línea «Bloquea si». En cualquier otro caso, «no».
- **Lo que se oyó**: copia el texto tal cual del visor (NVDA «Visor de voz», VoiceOver «Panel de subtítulos», TalkBack «Mostrar texto de voz») o transcríbelo. Es lo único que permite a otro rol reproducir el fallo.
- **Evidencia**: en un fallo bloqueante, siempre una captura o grabación de pantalla; el audio del lector si lo tienes.

## 3. Resumen de la sesión

| | |
| --- | --- |
| Pasos hechos / total del guion | |
| Pasan / fallan / notas / n/a | |
| Fallos que **bloquean 0.1.0** | (lista de IDs) |
| Pasos que no se pudieron probar y por qué | |
| Tiempo empleado | |
| Impresión general (una frase) | |

## 4. Cómo convertir un fallo en una entrada de `PENDIENTES.md`

`PENDIENTES.md` es la lista única de lo aplazado. Cada entrada es una **fila de tabla** `| Qué | Dueño |` en la sección que corresponda (§6 «Defectos y límites conocidos» para fallos; §7 «Solo en entorno real» para lo que sigue sin probarse). **No edites `PENDIENTES.md` a mano si no eres su dueño**: entrega estas filas a quien actualiza el archivo (la persona o rol que cierre el lote) con este formato.

Plantilla de la fila:

```
| <Componente>: <qué falla en una frase>. Entorno: <lector/navegador/SO y versión>. Paso <ID> de <guion>. Se oyó/vio: «<texto>». Se esperaba: «<texto>». Evidencia: <ruta>. [bloquea 0.1.0] | <dueño> |
```

Ejemplo:

```
| `GTable`: al terminar la carga con VoiceOver en Safari no se anuncia «N resultados» (la región queda muda mientras el `<table>` tiene `aria-busy`). Entorno: VoiceOver macOS 26 + Safari 26. Paso VM-11 de `voiceover-safari-macos.md`. Se oyó: nada tras «Cargando clientes…». Se esperaba: «5 resultados». Evidencia: `resultados/2026-10-20-…/vm-11.mov`. [bloquea 0.1.0] | bruno |
```

### Quién es el dueño de cada tipo de fallo

| Síntoma | Dueño | Por qué |
| --- | --- | --- |
| Falta un atributo ARIA, un nombre o un estado en el marcado; una región viva no anuncia o anuncia dos veces; el foco se pierde, no vuelve o va a otro sitio; un evento o un atajo no funciona | **bruno** | Es del `.vue` y su motor |
| El patrón elegido no es el adecuado (p. ej. rejilla frente a tabla, qué rol corresponde, el orden de Tab o la regla de teclado es incorrecta para ese lector) | **kiwi** | Decide estructura, teclado y ARIA |
| Hace falta una prop, una etiqueta (`labels`) o un token que el contrato no tiene; el contrato se contradice | **lima** | Dueña de la API y los tokens |
| El foco, el estado o un borde no se ve (`forced-colors`, contraste, zoom, reflujo, tamaño, recorte, solape, animación sin fin, `prefers-reduced-motion`) | **coco** | Dueña del CSS y del tema por defecto |
| Es una limitación permanente del navegador o del lector, no corregible en Grana (p. ej. Chromium expone el texto del campo como valor en un `spinbutton`) | **mora-docs** | Pasa a «Limitaciones conocidas» del README del componente |
| Un resultado limpio que cierra un «No verificado» | **mora-docs** | Actualiza el README del componente con lo verificado, fecha y entorno |
| El fallo está en el playground (banco), no en el componente (p. ej. una demo de ancho fijo) | **bruno** | Dueño de `playground/index.html` |
| Hay dudas de si es fallo o limitación | **kiwi** | Decide con el usuario y asigna |

Si el fallo es de **producto o identidad** (no de estándar), se pregunta al usuario antes de asignarlo.

### Qué ocurre después

1. Quien recibe la fila corrige y deja constancia en el commit (`bruno:`, `coco:`, `lima:`, `kiwi:`, `mora-docs:`).
2. **Se repite el paso** con la misma configuración y se anota en la misma fila: `repetido <fecha>: pasa` (o falla otra vez).
3. Un fallo `[bloquea 0.1.0]` queda abierto hasta que el paso se repite y pasa, o hasta que el usuario decide publicar con el límite declarado en las notas de la versión.
4. Cuando la sesión está limpia, mora-docs mueve lo verificado de «No verificado» a «Verificado» en los README afectados y registra el entorno.

## 5. Decisión

| | |
| --- | --- |
| ¿Hay algún fallo `[BLOQUEA 0.1.0]` abierto en este entorno? | sí / no |
| ¿Hay algún componente `candidate` que haya que bajar a `beta` por este informe? | (lista o «ninguno») |
| Decisión de publicar (la toma el usuario) | |
