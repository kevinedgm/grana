# Verificación en entorno real · Fase D del plan de v1

Guiones para probar Grana con lo que **no se puede automatizar**: lectores de pantalla, Safari, táctil, colores forzados de Windows y zoom real. Los escribió kiwi (estructura, teclado y ARIA); no hace falta conocer Grana para seguirlos.

Todo lo que las pruebas automáticas ya cubren (Chromium, Firefox y WebKit de Playwright, emulaciones, mediciones de contraste) **no se repite aquí**. Estos guiones buscan lo que esas pruebas declaran «no verificado» en `CLAUDE.md` § «Solo en entorno real», `PENDIENTES.md` §7, las auditorías (`design/lab/*/auditoria*.md`) y los README de cada componente.

## Los guiones

| Archivo | Entorno | Pasos | `[BLOQUEA 0.1.0]` | Núcleo | Tiempo (completo · bloqueantes · núcleo) |
| --- | --- | --- | --- | --- | --- |
| [`voiceover-safari-macos.md`](./voiceover-safari-macos.md) | VoiceOver + Safari en macOS | 53 | 40 | 19 | 2 h 30 · 1 h 55 · 1 h |
| [`nvda-windows.md`](./nvda-windows.md) | NVDA + Firefox y Chrome en Windows | 42 | 35 | 18 | 2 h 30 · 2 h · 1 h (+40 min en Chrome, 11 pasos) |
| [`voiceover-ios.md`](./voiceover-ios.md) | VoiceOver + Safari en iPhone/iPad | 32 | 25 | 15 | 1 h 30 · 1 h 10 · 45 min |
| [`talkback-android.md`](./talkback-android.md) | TalkBack + Chrome en Android | 23 | 20 | 11 | 1 h · 55 min · 35 min |
| [`alto-contraste-windows.md`](./alto-contraste-windows.md) | Temas de contraste de Windows (`forced-colors`) | 18 | 14 | 11 | 50 min · 40 min · 30 min |
| [`safari-macos.md`](./safari-macos.md) | Safari en macOS **sin lector** | 19 | 13 | 8 | 50 min · 35 min · 25 min |
| [`zoom-y-texto.md`](./zoom-y-texto.md) | Zoom 200 y 400 %, solo texto, espaciado y texto del sistema | 18 | 12 | 9 | 45 min · 30 min · 25 min |
| [`resultados-plantilla.md`](./resultados-plantilla.md) | Plantilla para registrar y para convertir fallos en `PENDIENTES.md` | | | | |
| **Total** | | **205** | **159** | **91** | **≈ 10 h · ≈ 8 h · ≈ 5 h** |

Los números se cuentan con `grep` sobre los propios guiones (ver «Mantenimiento» al final). Un paso `[BLOQUEA 0.1.0]` es uno cuyo fallo, según su línea «Bloquea si», impediría publicar; «núcleo» marca los de **más riesgo** (los que cada auditoría declaró como «riesgo principal» o que dependen de regiones vivas, foco tras una carga, capas superiores o gestos).

## Qué preparar

1. **El playground** (en la raíz del repositorio, con `npm install` y `npm run build` hechos; sin `packages/vue/dist/` no carga nada):

   ```bash
   python3 -m http.server 4173 -d packages/vue
   ```

   Se abre en `http://localhost:4173/playground/`. Cada sección tiene ancla: `http://localhost:4173/playground/#sec-form`. Cada paso de los guiones cita el ancla de su sección.
2. **Internet.** El playground carga Vue desde `unpkg.com`; sin red no monta.
3. **Dispositivos que no son el que sirve** (iPhone, Android, un Windows aparte): sirve el playground en la red local y abre la IP del equipo servidor:

   ```bash
   python3 -m http.server 4173 -d packages/vue --bind 0.0.0.0
   # macOS: ipconfig getifaddr en0   ->   http://[IP]:4173/playground/#sec-form
   ```

   Misma red Wi-Fi en ambos. **La captura de voz con el micrófono real no funciona por `http://<IP>`** (el navegador exige contexto seguro): en esos dispositivos usa siempre `?speech=self` (el adaptador simula el micrófono). En el equipo servidor, por `localhost`, el micrófono sí funciona.
4. **Sitio de documentación.** Cuando exista (lo construye bruno en `site/`; aún sin URL pública), los guiones se pueden repetir allí: las anclas de componente del sitio serán distintas, pero los pasos y lo esperado son los mismos. Anota la URL probada en la plantilla de resultados. Hasta entonces el playground es el banco oficial.
5. **Barra superior del playground.** «Modo» (Automático / Claro / Oscuro) y «Tema» (Por defecto / Tema de prueba). **Salvo que el paso diga otra cosa: Modo Claro y Tema Por defecto.** El índice lateral (o el botón «Índice» en pantallas estrechas) lleva a cada sección.
6. **Versión probada.** Anota `git rev-parse --short HEAD` (los guiones se escribieron sobre `f417af3`) y la versión del paquete (`0.1.0-beta.0`).

## Prioridades: qué bloquea la 0.1.0 y qué no

Cada paso lleva una etiqueta en el título:

- **`[BLOQUEA 0.1.0]`**: si falla el criterio de su línea «Bloquea si», **no se publica** hasta corregirlo y repetir el paso. El criterio es siempre uno de estos dos:
  - **un fallo de nivel A o AA de WCAG** en un componente `candidate` (sin nombre, rol o valor accesibles; foco perdido, atrapado o invisible; algo no operable con teclado; un cambio de estado importante que ningún lector comunica; texto que se pierde o se corta con zoom o reflujo; información que desaparece con colores forzados);
  - **pérdida de datos**: lo escrito o elegido se pierde, el envío queda bloqueado sin salida, o se envía algo distinto de lo que se ve.
- **`[no bloquea]`**: comodidad y verbosidad: el orden o la redundancia de anuncios, un nombre más largo de lo ideal, una animación torpe, una diferencia entre lectores que no oculta información, o una estética pobre con colores forzados que **no pierde** información. Se registra como nota, entra en `PENDIENTES.md` y, si es un límite permanente, en «Limitaciones conocidas» del README del componente.

**Regla de oro para decidir un fallo:** ¿la persona puede completar la tarea y entender el estado, aunque sea con más esfuerzo del ideal? Si sí, es nota. Si no, o si pierde datos, es bloqueante.

**Cuando el lector dice algo distinto del texto esperado**, no es fallo por sí solo. Los lectores difieren en verbosidad y orden. Lo exigible es que **estén presentes nombre, rol, estado y valor** y que **se anuncie lo que cambia**. Los textos esperados de los guiones son los del playground (en español) y sirven para reconocer qué se debería oír.

### Rondas recomendadas (la decisión de qué exigir es del usuario)

1. **Ronda núcleo (≈ 5 h entre todos los entornos):** solo los pasos marcados `núcleo` de cada guion. Cubre lo que más puede fallar: formularios con resumen de errores y bloques condicionales, la carga de `GTable` y de `GLoadRegion` con su foco, `GDialog`, `GMenu`, `GCombobox` (también dentro de un diálogo y con `multiple`), `GTooltip`, la captura de voz y `GTranscript`, `GSlider`, `GTag`, avisos e isla, y en visual: foco, estados, `forced-colors`, reflujo.
2. **Ronda bloqueante (≈ 8 h):** todos los `[BLOQUEA 0.1.0]`. Es lo que de verdad exige la 0.1.0.
3. **Ronda completa (≈ 10 h):** además, los `[no bloquea]`. Puede esperar a la 0.1.1.

Qué entorno es imprescindible:

- `voiceover-safari-macos.md`, `nvda-windows.md` (Firefox), `voiceover-ios.md`, `alto-contraste-windows.md`, `zoom-y-texto.md` y `safari-macos.md`: sus pasos `[BLOQUEA 0.1.0]` bloquean.
- `talkback-android.md`: sin dispositivo Android, la 0.1.0 puede salir declarando «sin verificar con TalkBack» en las notas de la versión; con dispositivo, sus `[BLOQUEA 0.1.0]` también bloquean.
- NVDA con Chrome: solo los 11 pasos «también en Chrome».
- `safari-macos.md` se hace **antes** que VoiceOver, en la misma sesión.

## Orden de trabajo dentro de cada guion

Los pasos van **por prioridad**: primero lo más usado y de más riesgo (formularios con `GForm` y `GErrorSummary`, `GTable` con filtros y carga, `GDialog`, `GMenu`, `GCombobox`, `GTooltip`, captura de voz, `GTranscript`, `GSlider`, `GTag`, `GAccordion`, `GBreadcrumbs`, `GLoadRegion`) y después los campos y superficies restantes. Si el tiempo apremia, **detente cuando termines los `[BLOQUEA 0.1.0]`** y deja los `[no bloquea]` para otra sesión.

Formato de cada paso:

```
### VM-07 · GTable: estructura · `#sec-table` · [BLOQUEA 0.1.0] · **núcleo**
**Hacer:** …
**Debe oírse / verse:** …
**Bloquea si:** …
**Resultado:** [ ] pasa   [ ] falla   [ ] n/a — Nota:
```

## Cómo registrar los resultados

1. Copia `resultados-plantilla.md` a `docs/verificacion-real/resultados/AAAA-MM-DD-<entorno>.md` (por ejemplo `2026-10-20-voiceover-safari-macos.md`).
2. Rellena la cabecera: persona, fecha, **versión de SO, navegador y lector**, commit y URL probada, tema y modo.
3. Por cada paso, una fila: `pasa`, `falla` o `nota`, con **lo que se oyó o se vio** (copia el texto del visor de voz: NVDA «Visor de voz», VoiceOver «Panel de subtítulos», TalkBack «Mostrar texto» en las opciones para desarrolladores si lo tienes) y, si falla, una captura o grabación de pantalla.
4. Cada fallo o nota con efecto se convierte en una **entrada de `PENDIENTES.md`** (la plantilla explica el formato y qué rol es el dueño). Los bloqueantes se marcan «bloquea 0.1.0».
5. Los resultados limpios actualizan el «No verificado» del README del componente: lo hace **mora-docs** (no edites README ni auditorías a mano).

## Errores comunes al probar

- **Probar con la extensión del navegador o el modo de lectura puestos.** Desactiva extensiones de accesibilidad y bloqueadores que toquen la página.
- **Confundir el modo del lector.** En NVDA, el modo exploración y el modo foco cambian lo que ocurre con las flechas: los pasos dicen en cuál estar.
- **Teclas de función en Mac.** `F8` y `Mayús+F8` pueden ser teclas multimedia: usa `Fn+F8` o activa «Usar teclas F1, F2, etc. como teclas de función estándar».
- **Safari no tabula a todo por defecto.** Ver `safari-macos.md` § preparación (`Opción+Tab` o el ajuste de Safari).
- **Probar a la vez dos variables** (tema oscuro + lector, por ejemplo): un fallo así es difícil de asignar. Una variable cada vez.

## Mantenimiento

Los números de la tabla salen de estos recuentos (desde la raíz del repositorio):

```bash
for f in voiceover-safari-macos nvda-windows voiceover-ios talkback-android alto-contraste-windows safari-macos zoom-y-texto; do
  p=docs/verificacion-real/$f.md
  printf '%s pasos=%s bloquea=%s nucleo=%s\n' "$f" \
    "$(grep -c '^### [A-Z][A-Z]-[0-9]' "$p")" \
    "$(grep -c '^### [A-Z][A-Z]-[0-9].*\[BLOQUEA 0.1.0\]' "$p")" \
    "$(grep -c '^### [A-Z][A-Z]-[0-9].*núcleo' "$p")"
done
```

Cada ancla de sección citada en los guiones existe como `id` en `packages/vue/playground/index.html` (comprobado al escribirlos: 36 anclas distintas, ninguna ausente). Si el playground cambia de ancla, actualiza el guion; si un componente cambia de comportamiento, **lima y bruno** avisan a kiwi para ajustar el paso.
