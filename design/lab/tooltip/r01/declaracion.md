# Declaración — tooltip (`GTooltip`, nombre de trabajo), r01: base funcional

> kiwi, 2026-10-05. Prototipo: `index.html` (kit gris) sobre `../engine.js`, con `GBtn`, `GIcon`, `GDialog` y `GHelper` reales de `dist/` y la posición de `packages/vue/src/utils/anchor.js` importada tal cual. Verificado con `../verificar.mjs` en Chromium, Firefox y WebKit (cifras en §16). Las decisiones derivan de APG y WCAG 2.2; las de producto e identidad están en `../r02/`.

## 1. Qué es y qué no

Un **tooltip** de Grana es un texto **corto y sin controles** que **nombra o describe un control enfocable** y aparece al **pasar el puntero** o al **llegar a él navegando con el teclado** (y con pulsación larga en táctil). No se pulsa, no se enfoca, no contiene enlaces ni botones, no anuncia nada por su cuenta y no es la única fuente de ningún dato que no esté ya en el nombre o la descripción del control.

No es: una ayuda que se abre al pulsar (eso es `GHelper`), un aviso (`GToast`, isla de estado), una etiqueta de un texto recortado ni un sustituto de una etiqueta visible en un campo de formulario (los campos tienen etiqueta visible siempre, `form.md`).

## 2. Frontera con `GHelper` (decisión: no hay toggletip aparte)

| | Tooltip (`GTooltip`) | `GHelper` |
| --- | --- | --- |
| Se abre con | Puntero encima (350 ms), foco por navegación (al instante), pulsación larga | Pulsar el disparador (Intro, Espacio, clic, toque) |
| Contenido | Una frase de texto; atajo opcional | Agnóstico: texto largo, enlaces, botones, formularios |
| Rol | `role="tooltip"`, referido por `aria-labelledby` o `aria-describedby` del control | `role="dialog"` no modal con nombre; el disparador lleva `aria-expanded`/`aria-controls` |
| Foco | Nunca entra | Tab entra en el contenido |
| Persiste | Mientras dure el puntero o el foco; Esc lo descarta | Hasta cerrarlo |
| Móvil | Pulsación larga; 1,5 s al soltar | Hoja (`GDialog`) |
| Disparador | **El control de la aplicación** (no lo crea) | Un `<button>` propio de `GHelper` |

**Regla:** si el texto tiene un enlace o un botón, si pasa de una frase, o si hay que poder leerlo con calma en táctil, va en `GHelper`. El patrón «toggletip» de la literatura (botón «i» que muestra un texto en una región viva) **ya lo cubre `GHelper`** con mejor semántica (diálogo con nombre en lugar de un anuncio que no se puede releer); un `GToggletip` sería un segundo componente para lo mismo. Verificado en el caso 6: `GHelper` y `GTooltip` conviven; un `GTooltip` sobre el disparador de un `GHelper` lo nombra al pasar y **no aparece con el `GHelper` abierto** (`aria-expanded="true"`, §5). Medido también: `GHelper` deja los `aria-*` que recibe en su **raíz** (`span`), no en su botón (`helper.md`: «los `aria-*` del botón se controlan con las props»), así que el `aria-labelledby` del tooltip cae en la raíz; con `ariaLabel` igual al texto no se nota, pero es un hallazgo (L21).

## 3. Semántica

1. **Un nodo `role="tooltip"` por control, persistente y hermano del control** en el DOM (`popover="manual"`, oculto mientras está cerrado). Existe desde el montaje, así que el nombre o la descripción están disponibles **antes** de que el tooltip se vea (el foco que llega al control ya los lee) y no dependen de que se abra.
2. **Las referencias apuntan al texto, no a la raíz.** `aria-labelledby`/`aria-describedby` → `ID-name` (el `span` del texto). Medido: referenciando la raíz, el atajo `aria-hidden` se colaba en el nombre («DeshacerCtrl Z»), porque el contenido oculto referenciado entra entero en el cálculo del nombre.
3. **`kind`: `auto` (por defecto), `label` o `description`.**
   - `label`: el tooltip **es el nombre** (`aria-labelledby`). Gana sobre un `aria-label` existente.
   - `description`: el tooltip **describe** (`aria-describedby`, **añadido** a los que ya tuviera el control, nunca reemplazados).
   - `auto`: si el control **no tiene nombre** (sin texto, sin `aria-label`, sin `aria-labelledby` ajeno) o su nombre **es el mismo texto** (sin mayúsculas ni espacios de diferencia) → `label`; si tiene **otro** nombre → `description`. Así nunca se lee dos veces lo mismo («Compartir, botón, Compartir»). Medido: `GBtn icon` sin `aria-label` → nombre «Duplicar»; «Publicar» → nombre «Publicar» + descripción; `aria-label="Compartir"` + texto «Compartir» → un solo nombre; enlace → descripción.
   - Hasta medir el DOM (antes del montaje), `auto` se comporta como `label`, para que `GBtn icon` no avise por falta de nombre en el primer render.
4. **Atajo:** `shortcut` es el texto visible (`kbd`, `aria-hidden`) y `keyshortcuts` el valor de `aria-keyshortcuts` en el **control** (sintaxis de ARIA, «Control+Z»). El mismo par que los elementos de `GMenu` (`menu.md`); sin traducción automática de teclas (el texto visible es de la aplicación: «Ctrl», «Strg», «⌘»).
5. **Nunca `title`** (ni en el control ni en el icono) y nunca región viva: el tooltip no se anuncia al aparecer; lo que dice ya está en el nombre o la descripción.
6. **Uso interno sin nombre propio (`none`)**: para los componentes cuyo nombre ya vive en su DOM (`GTabs` y `GRadioGroup` en `labelMode="icon"`, riel de `GSidebar`), la pista es solo visual, `aria-hidden`, sin referencias (regla de `sidebar.md`: «el tooltip es ayuda visual y `aria-hidden`, nunca la única fuente del nombre»). No es un valor público de `kind` en v0.1.

## 4. Tiempos (constantes de JS, no tokens; como `HOVER_MS` de `GMenu`, #308)

| Constante | Valor | Por qué |
| --- | --- | --- |
| `OPEN` | 350 ms | Reposo del puntero antes de abrir. El mismo que la pista de `GSidebar` (coherencia: un riel y una barra se recorren igual). Evita encender tooltips al cruzar la interfaz de camino a otra cosa |
| `CLOSE` | 100 ms | Gracia al salir del control o del tooltip: deja cruzar el hueco (con el puente, §7) |
| `SKIP` | 600 ms | Ventana de grupo: si otro tooltip se cerró hace menos (o hay uno abierto), el siguiente abre **sin espera y sin entrada**. El mismo que `GSidebar` |
| `NAV` | 1000 ms | Un foco cuenta como «por navegación» si hubo una tecla de navegación (Tab, flechas, Inicio, Fin, Av/Re Pág, F6) hace menos de esto y no hubo puntero después |
| `LONG` | 500 ms | Pulsación larga en táctil (cancelada si el dedo se mueve más de 10px) |
| `LINGER` | 1500 ms | En táctil, lo que queda visible al soltar |

Sin props de tiempo por instancia en v0.1: un retraso distinto en cada botón rompe el grupo (el usuario no sabría cuándo esperar).

## 5. Abrir y cerrar (matriz de sucesos)

| Suceso | Efecto |
| --- | --- |
| Puntero entra en el control (ratón o lápiz) | Abre a los 350 ms; **al instante** si hay otro abierto o se cerró hace < 600 ms (sin entrada animada, `data-instant`) |
| Puntero sale del control | Cierra a los 100 ms, salvo que entre en el tooltip |
| Puntero entra en el tooltip | Sigue abierto (1.4.13); al salir de él, cierra a los 100 ms |
| Foco **por navegación** en el control (`:focus-visible` y tecla de navegación reciente) | Abre **al instante** |
| Foco por clic o por programa (un diálogo que enfoca su primer control al abrirse con Intro) | **No abre** (§8) |
| El control pierde el foco | Cierra, salvo que el puntero siga encima |
| Pulsar el control (botón principal del ratón) | **Cierra** y no vuelve hasta que el puntero salga y entre de nuevo («pulsar es usar»: el nombre ya no hace falta y taparía lo que el control abre) |
| Esc | Cierra **sin mover el foco**; no vuelve con el puntero quieto ni con el foco en el mismo control hasta salir o perder el foco (§6) |
| Pulsar fuera | Cierra |
| Se abre otro tooltip | El anterior se cierra: **uno solo abierto** en todo el documento |
| El control tiene `aria-expanded="true"` (su menú o panel abierto) | **No abre** (taparía el menú) |
| El control está `disabled` nativo | **No abre** (§10) |
| Se desplaza la página o un contenedor | Sigue al control una vez por cuadro, **sin cambiar de lado**; si el control sale del visor o de su contenedor, cierra sin mover el foco (reglas 1 y 3 de «Paneles anclados», #358) |
| Con el puntero encima, el desplazamiento se lleva el control de debajo del puntero | Cierra por hover (el navegador emite la salida del puntero): correcto, ya no se está sobre él |
| Cambia el tamaño del visor | Se recoloca (conservando el lado) |
| Pulsación larga (táctil) | Abre; queda 1,5 s al soltar; el clic que sigue **no** activa el control (§9) |

**Sin cierre automático** mientras dure el puntero o el foco (1.4.13, «persistente»). El único cierre por tiempo es el de táctil, donde no hay hover que mantener.

## 6. Esc

Una escucha de documento (captura) **solo mientras hay un tooltip abierto**: Esc cierra el tooltip, pone `preventDefault()` y **no** detiene la propagación. Es la convención de Grana: «un descendiente que ya trató Esc lo cancela» (`GDialog.vue`, `onKeydown` ignora un Esc con `defaultPrevented`, como con `GToaster`, `GMenu` y `GSelect`). Medido con `GDialog` real en los tres motores: con un tooltip abierto dentro del diálogo, el **primer** Esc cierra solo el tooltip y el diálogo sigue abierto con el foco donde estaba; el **segundo** cierra el diálogo. Para que esto no obligue a pulsar Esc dos veces sin motivo, el tooltip **no** aparece por el foco que el diálogo pone al abrirse (§8): medido, abrir con Intro enfoca el primer control (que tiene tooltip) y no se abre nada.

## 7. El puntero cruza al tooltip (WCAG 1.4.13, «hoverable»)

- El tooltip recibe el puntero (no lleva `pointer-events: none`) y se puede **seleccionar su texto** (útil con lupa).
- Un **puente invisible** (`::before`) cubre el hueco entre control y tooltip en el lado usado (`data-side`), así que el puntero nunca «sale» al cruzarlo; la gracia de 100 ms cubre el resto.
- **Límite conocido (por diseño):** en una barra, ir **en diagonal** hacia el tooltip pasa por encima de los vecinos, que toman el relevo al instante (ventana de grupo). Como el tooltip no tiene nada que pulsar, la única razón para alcanzarlo es leer o ampliar, y eso se hace en línea recta (medido). No se implementa «triángulo de seguridad»: retrasaría el relevo, que es lo que hace rápida la lectura de una barra.

## 8. Foco

- El tooltip **nunca** recibe foco ni mueve el foco.
- **Solo el foco que llega navegando lo abre** (`:focus-visible` **y** tecla de navegación en el último segundo, sin puntero después). Ni el foco por clic, ni el foco por programa: un `GDialog` que se abre con Intro y enfoca su primer control, un error de `GForm` que enfoca su campo, una isla que devuelve el foco. Así el tooltip aparece cuando la persona **está recorriendo** controles (lo necesita para saber qué hay) y no cuando la interfaz la lleva a un sitio (ya sabe a qué va, y el tooltip le costaría un Esc).
- En una barra (`role="toolbar"`, una sola parada de Tab y flechas, APG), las flechas cuentan como navegación: el tooltip pasa al siguiente al instante.
- WebKit con los ajustes por defecto solo recorre campos de texto con Tab (los botones con Opción+Tab): el comportamiento es el mismo; la verificación usa Opción+Tab.

## 9. Táctil: pulsación larga (decisión) y no «nada»

En táctil no hay hover, y un icono sin nombre visible es justo el problema que el tooltip resuelve. «Nada» dejaría sin nombre a quien no usa lector de pantalla. Se elige **pulsación larga** (500 ms sin moverse más de 10px), el gesto que la plataforma ya asocia a «¿qué es esto?» (los botones de solo icono de Android lo hacen así):

- Abre al cumplirse el tiempo; al soltar queda **1,5 s** y luego se va; tocar en otro sitio lo cierra.
- **El clic que sigue a la pulsación larga no activa el control**: la persona preguntó «qué es», no «hazlo». Medido: con pulsación larga, 0 activaciones; con toque normal, 1 activación y ningún tooltip.
- El menú contextual del sistema se cancela solo durante esa pulsación; `-webkit-touch-callout: none` y `user-select: none` en el control con tooltip y `pointer: coarse` (CSS de coco).
- Con lector de pantalla en móvil (VoiceOver, TalkBack) no hace falta nada: el nombre y la descripción ya se leen al llegar al control.

## 10. Estados del control

| Estado | Comportamiento |
| --- | --- |
| Normal | §5 |
| `disabled` nativo | **No abre**: no recibe foco, así que solo el ratón vería la explicación (contra 2.1.1). Aviso en desarrollo: «usa `aria-disabled` si el motivo importa». Medido en el caso 6 |
| `aria-disabled="true"` (enfocable, `GBtn` lo respeta) | Abre y **describe el motivo** («Necesitas permiso de edición»). Es la forma de explicar por qué algo no se puede usar |
| `aria-expanded="true"` | No abre (su menú o panel ya está abierto) |
| `loading` de `GBtn` | Sin cambio: el tooltip nombra el control; el estado lo anuncia `GBtn` |
| `GTooltip disabled` | No abre; las referencias ARIA **se conservan** (el nombre no puede desaparecer por apagar la pista) |

## 11. Posición: la de `anchor.js`, sin inventar otra

- `placeAround` (la de `GHelper`): prueba el lado pedido, el opuesto y los perpendiculares; en el primero que cabe, se desplaza en el eje secundario hasta quedar dentro con margen `space × 2`. Medido: el botón de la cabecera (sin sitio arriba) abre abajo; los de los extremos quedan a ≥ 8px del borde.
- **Lado por defecto `top`**; `placement` con los 12 valores de `GHelper`. `left`/`right` son **lógicos** (inicio/fin de línea): medido en RTL, `placement="left"` se abre a la derecha.
- Hueco `space × 2`; ancho máximo **`space × 70`** (280px con `space` 4); el texto se parte en líneas y **nunca se recorta** (`overflow-wrap: anywhere`).
- **Capa superior** (`popover="manual"`, posición fija): ningún `overflow: hidden` lo recorta (`card.md` avisaba de ese límite). Como es **hermano del control**, dentro de un `<dialog>` modal vive dentro del diálogo y no queda inerte (medido: el tooltip abierto está dentro del `<dialog>`). `popover="hint"` (pensado para tooltips) no está en los tres motores: se anota para el futuro.
- Reglas de «Paneles anclados» (#358): **1** (el lado se decide al abrir y se conserva al desplazar) y **3** (si el control sale del visor o de su contenedor, se cierra sin mover el foco) **sí**; **2** (`--_max`) y **4** (lista) **no aplican**: el tooltip no tiene alto máximo ni lista.

## 12. Movimiento

Solo **opacidad** (`--g-duration-fast`); en el grupo, **sin entrada** (aparece en su sitio). Sin desplazamiento ni escala en la base, con o sin `prefers-reduced-motion` (con `reduce`, el mismo fundido, §29.3 de `tokens.md`). Nada se anima al montar. La personalidad del movimiento se propone en r02.

## 13. Mínimos

- Texto **`body-sm`** (14px con el tema por defecto; caption, 12px, es el suelo y queda para el atajo). Un tooltip se lee de un vistazo: el tamaño de cuerpo pequeño lo permite sin forzar.
- Contraste ≥ 4.5:1 (el kit gris mide 6.9:1; los conceptos de r02 usan la superficie inversa del tema, 17.4:1).
- **Borde transparente** del ancho de borde: en `forced-colors` aparece y el tooltip no se confunde con el fondo.
- Nunca se recorta ni se abrevia. Sin icono propio dentro.

## 14. API (decisión)

**Componente envolvente `GTooltip` con un único hijo**, el control:

```vue
<GTooltip text="Duplicar" shortcut="Ctrl D" keyshortcuts="Control+D">
  <GBtn icon variant="ghost"><GIcon name="copy" /></GBtn>
</GTooltip>
```

| Prop | Tipo | Valores | Default |
| --- | --- | --- | --- |
| `text` | String | obligatorio | — |
| `kind` | String | `auto` `label` `description` | `auto` |
| `placement` | String | los 12 de `GHelper` | `top` |
| `shortcut` | String | texto visible del atajo | — |
| `keyshortcuts` | String | `aria-keyshortcuts` del control | — |
| `disabled` | Boolean | | `false` |

- Renderiza **el hijo (clonado, con sus referencias ARIA fusionadas) y el nodo del tooltip a su lado**; no añade envoltorio al DOM. Si el hijo es un componente con raíz de fragmento (`GBtn` lleva su región viva al lado), se toma su primer elemento; si ese elemento no es enfocable, el primer descendiente enfocable (el `<input>` de un campo). Sin hijo único o sin elemento enfocable: aviso en desarrollo.
- **Por qué no una directiva** (`v-g-tooltip`): sobre un componente cae en su raíz, que no siempre es el control (en `GInput` es la caja, no el `<input>`); no puede renderizar el nodo persistente con Vue (habría que crearlo a mano y moverlo); y no tiene SSR sin `getSSRProps`.
- **Por qué no una prop `tooltip` en `GBtn`** (en v0.1): el envoltorio sirve para cualquier control (enlace, `GHelper`, `GSwitch`, un control propio); una prop en `GBtn` invitaría a añadirla en cada componente. Es un buen atajo de sintaxis para el caso más común (`GBtn icon`); se deja **reservado** y se pregunta al usuario (r02, pregunta 4).
- **Sin componente de grupo en la base**: el grupo es por tiempo (`SKIP`), así que recorrer cualquier conjunto de controles funciona sin envolverlo. (El concepto B de r02 sí necesitaría uno.)
- **Motor interno** (`utils/tooltip.js`, no público): el comportamiento de §4 a §11, compartido por `GTooltip` y por los componentes que tienen pista propia (L17).
- Sin `fetch`, sin globals de la aplicación; una escucha de documento (Esc, navegación, clic fuera) para todos los tooltips, no una por instancia.

## 15. Estados del tooltip

| Estado | Atributos |
| --- | --- |
| Cerrado | `popover` cerrado (no se ve, no ocupa); referencias ARIA vivas |
| Abierto | `:popover-open`, `data-side` (lado real tras el volteo), `--_x`/`--_y` (en línea, de `anchor.js`) |
| Abierto en grupo | además `data-instant` (sin entrada) |
| Descartado con Esc | cerrado y suprimido hasta salir/perder foco |

## 16. Comprobaciones (base, `verificar.mjs`, 42 por motor; **42/42 en Chromium, Firefox y WebKit**)

Nombres de la barra = texto, sin atajo; `aria-keyshortcuts`; referencia al texto dentro del `role="tooltip"` hermano; `auto` (descripción, mismo nombre sin duplicar, enlace, `label` explícito); nada a 200 ms y abierto a 500 ms; el siguiente del grupo en < 200 ms, sin entrada y uno solo; el puntero cruza al tooltip y sigue abierto; cierra al salir; Esc sin mover el foco y sin reaparecer con el puntero quieto; reaparece al volver; pulsar cierra; Tab (Opción+Tab en WebKit) abre el del control enfocado al instante; flechas pasan al siguiente; Esc con foco; el foco por clic no abre; volteo arriba → abajo; texto largo ≤ 280px en varias líneas dentro del visor; `placement="left"` en LTR y en RTL; sigue al control al desplazar su contenedor y se cierra al salir sin mover el foco; `disabled` nativo no abre; `aria-disabled` abre y describe; `aria-expanded="true"` no abre; `GTooltip` sobre `GHelper` (nombra el disparador y calla con el `GHelper` abierto); aviso en desarrollo con un control `disabled` nativo; táctil (sin nada a 250 ms, abierto a 650 ms, clic bloqueado, queda al soltar, se va a los 1,5 s; un toque activa y no muestra); `GDialog`: el foco por programa al abrir no muestra, Tab sí y dentro del `<dialog>`, primer Esc cierra el tooltip y el diálogo sigue, segundo Esc cierra el diálogo; contraste 6.9:1 y 14px; con movimiento reducido solo opacidad; sin errores ni avisos en consola.

**No verificado aquí:** lector de pantalla real (VoiceOver, NVDA, TalkBack) leyendo nombre, descripción y `aria-keyshortcuts`; táctil real (los eventos de puntero `touch` son sintéticos); Safari real con Tab por defecto; zoom al 400 % (el ancho máximo cabe en 320px por cálculo, no medido); `forced-colors` real.

## 17. Qué lo hace distinto (ya en la base)

- **El foco que te lleva no enciende el tooltip; el que tú mueves, sí.** Los frameworks muestran el tooltip con cualquier `focus` o con cualquier `focus-visible`; entonces abrir un diálogo con Intro, o volver de un menú, enciende un globo que nadie pidió y el primer Esc se gasta en cerrarlo. Aquí solo lo enciende la navegación, y el Esc del diálogo vuelve a ser del diálogo.
- **Pulsar es usar.** Al pulsar, el tooltip se va y no vuelve hasta salir: no tapa el menú ni el panel que el botón acaba de abrir (y con `aria-expanded="true"` no aparece).
- **La pulsación larga pregunta, no actúa.** En táctil, mantener el dedo sobre un icono dice su nombre y **no** lo activa al soltar.
- **Nunca se lee dos veces.** `kind="auto"` decide nombre o descripción mirando el nombre real del control.

## 18. Hallazgos para lima (L…)

| # | Decisión o hallazgo | Base |
| --- | --- | --- |
| **L1** | Componente **`GTooltip`**, categoría superposiciones, en `@grana/vue` (es pequeño y lo usan componentes del paquete principal); medir el peso al construir | Encargo; `api.md` |
| **L2** | **Frontera:** sin controles ni contenido interactivo; el toggletip es `GHelper`; **no** se crea `GToggletip` (§2) | APG Tooltip; `helper.md` |
| **L3** | **API:** envoltorio con un único hijo; props `text`, `kind`, `placement`, `shortcut`, `keyshortcuts`, `disabled` (§14). Sin directiva. Prop `tooltip` en `GBtn` **reservada** (pregunta al usuario en r02) | §14 |
| **L4** | Nodo `role="tooltip"` **por control, persistente, hermano**, `popover="manual"`; las referencias apuntan a `ID-name` (y `ID-detail` si hay descripción aparte, r02 C) | APG; medido (§3.2) |
| **L5** | **`kind="auto"`**: sin nombre o mismo texto → `label`; otro nombre → `description`; provisional `label` antes de medir; `aria-describedby` se **añade**, nunca reemplaza | WCAG 4.1.2, 2.5.3 |
| **L6** | Atajo: `shortcut` visible `aria-hidden` + `keyshortcuts` → `aria-keyshortcuts` del control (par de `menu.md`) | ARIA 1.2 |
| **L7** | Constantes `OPEN` 350, `CLOSE` 100, `SKIP` 600, `NAV` 1000, `LONG` 500, `LINGER` 1500 ms y 10px de movimiento: JS, no tokens (§29.6 de `tokens.md`); 350/600 = `GSidebar` | §4 |
| **L8** | **Un solo tooltip abierto** en el documento; grupo por tiempo, sin componente de grupo | §5 |
| **L9** | **Solo el foco por navegación abre** (`:focus-visible` + tecla de navegación < 1 s, sin puntero después) | §8; 2.4.7 |
| **L10** | Pulsar cierra y suprime hasta salir; `aria-expanded="true"` no abre; `disabled` nativo no abre (aviso en desarrollo: usar `aria-disabled`); `GTooltip disabled` conserva las referencias | §5, §10; 2.1.1 |
| **L11** | **Esc**: escucha de documento en captura solo con uno abierto; `preventDefault` sin detener la propagación; suprime hasta salir o perder el foco. `GDialog` no cambia (ya respeta `defaultPrevented`) | §6; medido |
| **L12** | **1.4.13**: el tooltip recibe el puntero; puente sobre el hueco por `data-side`; gracia 100 ms; sin cierre por tiempo con hover o foco; límite de la diagonal anotado | §7 |
| **L13** | **Táctil**: pulsación larga 500 ms / 10px, 1,5 s al soltar, clic siguiente bloqueado, menú contextual cancelado; CSS `-webkit-touch-callout: none` y `user-select: none` con `pointer: coarse` (coco) | §9 |
| **L14** | **Posición**: `placeAround` de `anchor.js` (sin utilidad nueva), `top` por defecto, 12 valores lógicos, hueco y margen `space × 2`, ancho máximo `space × 70`; reglas 1 y 3 de #358 sí, 2 y 4 no aplican (`api.md` debería listar `GTooltip` entre los paneles anclados con esa salvedad) | §11 |
| **L15** | **Capa superior** con `popover="manual"` (no `hint`: soporte); hermano del control para vivir dentro de un `<dialog>` modal | §11; medido |
| **L16** | Sin tooltip en contenido no enfocable (`GIcon label`, texto): aviso en desarrollo si el hijo no tiene nada enfocable | 2.1.1; `icons.md` |
| **L17** | **Motor interno** `utils/tooltip.js` con modo `none` (pista `aria-hidden`, el nombre en el DOM del componente) para cerrar #113: `GTabs` y `GRadioGroup` en `labelMode="icon"`, y el riel de `GSidebar` (sustituye su lógica propia de `g-sidebar__tip`, mismos tiempos). **Encargo aparte** tras `GTooltip`, uno por componente | #113; `sidebar.md` |
| **L18** | Sin tokens nuevos previstos: texto `body-sm`, atajo `caption`, colores del concepto elegido (r02); lo mide coco | `tokens.md` §17.6 |
| **L19** | **Riesgo del hermano en el DOM**: el nodo cerrado no ocupa, pero cuenta para `:last-child`/`+` del consumidor. En Grana, `.g-dialog__body > :last-child` y `.g-form-section__actions > … :first-child` podrían verse afectados si el último o primer hijo lleva tooltip: comprobar al construir (bruno/coco) | Revisado en el CSS de componentes |
| **L20** | `api.md` y contratos afectados: `card.md` y `tabs.md` («sin tooltip propio en v0.1»), `icons.md` §9 y `radio-group.md` pasan a remitir a `GTooltip`/L17 | Coherencia de contratos |
| **L21** | **Dónde caen las referencias.** `GTooltip` pasa `aria-labelledby`/`aria-describedby`/`aria-keyshortcuts` como atributos del hijo: llegan al control en `GBtn`, `GInput` (que ya **fusiona** un `aria-describedby` externo con los suyos), `GSwitch`, `GCheckbox` y los elementos nativos. **`GHelper` los deja en su raíz** (medido). O `GHelper` reenvía esos tres a su botón (cambio pequeño de `helper.md`), o `GTooltip` los escribe en el elemento enfocable resuelto. Recomendación de kiwi: lo primero (un solo mecanismo, sin escribir en el DOM de otro componente) | Medido en el caso 6 |

## 19. Preguntas de producto abiertas

Ninguna en la base: todo deriva de APG, WCAG y los contratos vigentes. Las preguntas de identidad, de táctil y del atajo de sintaxis en `GBtn` están en `../r02/declaracion.md`.
