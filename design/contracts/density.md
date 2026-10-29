# Contrato · densidad global y por región (pieza 2 de la configuración global)

**Dueño:** lima · **Estado:** contratado (2026-10-29), pendiente de coco y de bruno (complejo: los dos en Opus) · **Basado en:** `design/lab/density/r01/` (kiwi, c7f42d1: `declaracion.md` D1 a D9, P1, P2, G1 a G6, L1 a L6; prototipo y `verificar.mjs` 36/36 en Chromium) · **Decisiones:** #974 a #982 (`DECISIONS.md`) · **Antecedentes que no se reabren:** #15 (multiplicador 1 · 0,875 · 0,75 y piso de 24 px), #561 (forma de emisión del CLI), #566 (el diálogo corta el contexto de formulario), #682 (rejilla de 0,5 px), #966 (el texto baja con `compact`: pieza 3), #967 (tres pasos), #969 (orden y mecanismo D), #970 a #973 (16 px editable en táctil), `tokens.md` §7 (44 px táctil).

**Regla en una línea.** La densidad viaja por CSS: un token heredable, `--g-density`, que reasigna el atributo `data-g-density` en cualquier elemento; la prop `density` de un componente **es la región de ese componente**; el JS solo lee la densidad donde hay lógica que mide.

---

## 1. Precedencia

| Orden | Fuente | Dónde vive | Quién la escribe |
| --- | --- | --- | --- |
| 1 | **Prop `density` explícita** | `data-g-density="{valor}"` **y** clase `g-<tag>--density-{valor}` en la raíz del componente | La aplicación, por instancia |
| 2 | **Región más cercana**: el ancestro del DOM más próximo con `data-g-density` (incluida la raíz de un componente con prop, que es una región por la regla 1) | `[data-g-density="…"] { --g-density: … }` en `grana.defaults` | La aplicación, en **sus propios elementos** (§3.3) |
| 3 | **`<html data-g-density>`**: la preferencia de quien usa la aplicación (P1) | La misma regla, sobre `:root` | La aplicación (un ajuste «Vista compacta · normal · amplia», guardado y pintado por el servidor) |
| 4 | **Clave `density` del CLI**: el valor del producto | `:root:where(:not([data-g-density])) { --g-density: … }`, **sin capa** (forma de #561) | `@grana/cli` (§6) |
| 5 | **`default`** | `:root { --g-density: 1; }` en `grana.defaults` | coco |

- **Anidación:** manda la región más cercana (herencia del DOM). `data-g-density="default"` es un valor válido que **devuelve el paso 1** dentro de una región más apretada; para heredar no se escribe nada.
- **Con puntero grueso** (`pointer: coarse`) las fuentes 2 a 4 **ceden al dedo** y valen 1; la 1 no cede (§5).
- **Sin `provide`/`inject` de densidad** (#975): la herencia del DOM ya resuelve la región, la anidación, el top layer y el SSR.

## 2. El token y el atributo

| Nombre | Qué es | Valores |
| --- | --- | --- |
| **`--g-density`** | Multiplicador de densidad heredable (número, no palabra: lo consumen los `calc()`). Grupo de estructura (`tokens.md` §6 y §58) | `1` (`default`), `0.875` (`comfortable`), `0.75` (`compact`). **Solo esos tres** (#967); cualquier otro valor no es contrato |
| **`data-g-density`** | Atributo público de región | `default` · `comfortable` · `compact`. Otro valor: no hace nada (ninguna regla lo reconoce); sin aviso |

- **Lo escriben solo** `defaults.css` (coco: las reglas de §2.1) y el CLI (§6). Ninguna hoja de componente declara `--g-density`; cada raíz lo **lee** en su alias local (`--_density: var(--g-density)`, `--_d`, `--_df`…), sin valor de respaldo.
- **Se cambia con el atributo, no con el token.** Una aplicación que escriba `style.setProperty('--g-density', …)` o un `tokens.css` con `--g-density` en `:root` queda fuera de contrato: el observador de §7 no lo ve y una regla sin capa en `:root` taparía `<html data-g-density>`. Por eso el CLI **rechaza** `--g-density` en `overrides` (§6).

### 2.1 Reglas de `defaults.css` (capa `grana.defaults`; texto exacto a criterio de coco, efecto de contrato)

```css
:root { --g-density: 1; }
[data-g-density="default"] { --g-density: 1; }
[data-g-density="comfortable"] { --g-density: 0.875; }
[data-g-density="compact"] { --g-density: 0.75; }

@media (pointer: coarse) {                                   /* P2 · cede al dedo (§5) */
  :root, [data-g-density] { --g-density: 1; }
  [data-g-density="comfortable"][class*="--density-comfortable"] { --g-density: 0.875; }
  [data-g-density="compact"][class*="--density-compact"] { --g-density: 0.75; }
}
```

`sync-defaults.mjs` del CLI copia solo el bloque `:root` (con `--g-density: 1`): las reglas de atributo y la consulta táctil no entran en `DEFAULTS` (bruno lo comprueba en su prueba de desfase).

## 3. La prop es una región (B, decisión del usuario)

### 3.1 Qué emite un componente con `density`

| | Sin prop (`undefined`) | Con prop explícita (incluido `'default'`) |
| --- | --- | --- |
| Clase `g-<tag>--density-{d}` | **No** | Sí, en la raíz |
| Atributo `data-g-density="{d}"` | **No** | Sí, en el **mismo elemento** que la clase, escrito **después** de `$attrs` (la prop gana a un `data-g-density` de la aplicación) |
| Qué aprieta | Sigue la región por CSS | El componente **y todo lo que lleva dentro** (botones de la barra de `GTable`, contenido de `GDialog`, `GCard`, `GSurface`, `GSidebar`, `GStack`, `GSplit`…) |

- **Raíz de fragmento o raíz que no es la caja:** clase y atributo van en el elemento que pinta. `GMenu`: en `g-menu__list` (la lista y sus submenús, que van dentro). `GCard`: en su raíz, que es la `GSurface` (`g-surface--density-*`, `card.md`). `GWidgetConfig` y `GWidgetGallery`: en el `<dialog>` raíz, junto a `g-dialog`.
- **Para salir de la región dentro de un componente con prop:** `density` en el hijo (`<GBtn density="default">`) o `data-g-density` en un elemento propio que envuelva la parte. Es el coste aceptado de B.
- **`GDatePicker inline` ignora la prop pero sigue la región** (#983): su superficie lee `var(--g-density)` como cualquier hoja; no escribe clase ni atributo (la prop se ignora con su aviso, `datepicker.md`). Antes de #976 un `GForm` con `density` no lo apretaba porque `inline` no leía el contexto; ahora sí porque la densidad ya no viaja por el contexto, y es lo que B pide (la región manda sobre lo que contiene).
- **`GCalendar` no entra** (escala propia `compact`/`comfortable`/`spacious`, #967): sigue con su clase «Siempre», no escribe `data-g-density` y no lee la región hasta la pieza 4.

### 3.2 Default de la prop: `null` con `resolvedDefault` (D1)

Las **18 raíces** que hoy declaran `default: 'default'` —`GBtn`, `GCard`, `GCheckbox` (solo su `meta.json`; el `.vue` ya es `undefined`), `GDialog`, `GForm`, `GMenu`, `GSidebar`, `GSpeechTrigger`, `GSplit`, `GStack`, `GStepper`, `GSurface`, `GTable`, `GTabs`, `GWidget`, `GWidgetConfig`, `GWidgetGallery`, `GWidgetGrid`— pasan a `default: undefined` en el `.vue` y, en el `meta.json`, a la forma ya contratada de los campos:

```json
{ "name": "density", "type": "String", "default": null, "values": ["default", "comfortable", "compact"], "resolvedDefault": "default", "note": "Sin valor: la región más cercana (data-g-density) › <html data-g-density> › clave density del tema › default (density.md §1)" }
```

El tipo de los `.d.ts` no cambia (`'default' | 'comfortable' | 'compact'`, opcional; #443). La **nota de los campos** (`GInput` y los de G2, que hoy dicen «prop explícita › contexto de GForm › default de siempre») pasa al mismo texto. También `GResourceList` (`@grana/blocks`, `resource-list.md`): `default: null` y pasa `density ?? undefined` a `GTable`.

### 3.3 Dónde escribe la aplicación el atributo

- **En sus propios elementos** (`<section data-g-density="compact">`, `<html>`), y en la raíz de un componente **que no tiene `density`** y hereda atributos en la raíz.
- **En un componente con `density`, la prop**, nunca el atributo: los campos (`GInput`, `GSelect`, `GTextarea`…) tienen `inheritAttrs: false` y mandan los atributos al control nativo, así que un `data-g-density` en `<GInput>` caería en el `<input>` y no apretaría nada. Sin aviso de desarrollo (no compensa su peso en 37 componentes); lo dice el README de cada uno (mora-docs).

### 3.4 Componentes que componen otros: solo lo explícito (D6)

Un componente que compone otro le pasa **`density ?? undefined`** (nunca un valor resuelto con `'default'` como último recurso, que convertiría al hijo en explícito y taparía la región). Lista comprobada por kiwi: `GNumberField`, `GCombobox`, `GTimeField` (`PASS`), `GCheckboxGroup`, `GSpeechTrigger`, `GWidgetConfig`, `GWidgetGallery`, `GFieldGroup`, `GCard` (a su `GSurface` y a su `GMenu`), la prop de slot `density` del slot `action` de `GInput` (vale `undefined` sin prop) y los blocks (`GResourceList`, y cualquier `Gb*` que pase un valor resuelto). Bruno busca en el repo cualquier `density ?? 'default'` o `|| 'default'` que alimente a un hijo y lo corrige.

### 3.5 Qué cambia para quien ya usa la prop

Cambio visible aceptado por el usuario (paquete sin publicar): un contenedor con `density` distinta de `default` aprieta ahora su contenido. Casos conocidos que coco revisa en su auditoría: `GbProductCard03` y `GbConfirmation03` (`GCard density="compact"`: su `GBtn` de acción pasa a compacto), `GResourceList` con `density` (barra y menús de la tabla), `GStack`/`GSplit` con `density` (`stack.md`, `split.md`: ya no «solo a su separación»), y `GForm` con `density` (los botones de `GFormActions` y todo lo de dentro lo siguen; era la incoherencia del inventario §2.3). **Lista completa de blocks que cambian** (#984, construcción de bruno; todos por `GCard density="compact"`, que ahora aprieta lo que lleva dentro): `GbProductCard03`, `GbConfirmation03`, `GbCart`, `GbOfferList03`, `GbOrderHistory03`, `GbTrust01`, `GbCategoryPreviews02` y `GbCategoryPreviews03` (más `GResourceList` con `density`). Coco audita su coherencia visual (criterio 18 se amplía a la lista); si alguno resulta una regresión, la salida es `density="default"` en el hijo afectado o quitar la prop del `GCard`, decisión de producto del block, no de este contrato.

## 4. Formularios (D9, D7)

- **`GForm`, `GFormLayout`, `GFormRow`, `GFieldGroup`, `GInputGroup`, `GFormActions` y `GAdaptiveLayout`** con prop explícita escriben `data-g-density` y su clase (§3.1); sin prop, nada. `GForm` deja de imponer `'default'` (`default: undefined`) y deja de emitir `g-form--density-default` sin prop: un `GForm` dentro de una región la sigue.
- **Los campos sacan su clase solo de su prop.** Lo que hoy reciben del contexto (`formKey`, `layoutKey`) les llega por CSS, porque el contenedor con prop es una región. Así una región que la aplicación ponga entre el formulario y el campo manda («la más cercana»).
- **`GFormSection`, `GFormReveal` y `GFormFold`** (sin prop `density`) leen `var(--g-density)` heredado. `GFormSection.css` deja de leer `.g-form--density-* .g-form-section`. **`GFormReveal` y `GFormFold` dejan de emitir** `g-form-reveal--density-{d}` y `g-form-fold--density-{d}` (reflejaban el valor del contexto y mentirían bajo una región) y dejan de reproveer un valor resuelto con `'default'`.
- **El contexto conserva `density` solo para la lógica.** `useFormField()` es público y **no cambia de forma ni de valor**: su `density` sigue resolviendo prop › sub‑contexto › `GForm` › `'default'` y **no ve la región**. Se documenta así: «para medir o pintar, `var(--g-density)` o `readDensity(el)`». **No se añade `densityExplicit`** (L3): un campo propio que compone un `GInput` le pasa **su propia prop** (`props.density`), que ya tiene, no `ff.density`.
- **`GFormRow` y los mínimos publicados** (#312, #410) se miden por posiciones y siguen la densidad real; un cambio de región en marcha vuelve a medir por `densityEpoch` (§7) además del `ResizeObserver`. Sin regla nueva.
- **`GDialog` sigue cortando `formKey`/`layoutKey`** (#566); como la densidad ya no viaja por ahí, el corte no la toca (§5.2).

## 5. Superficies, top layer y táctil

### 5.1 Qué hereda cada superficie

| Superficie | Hereda de | Regla |
| --- | --- | --- |
| `popover` en su sitio: `GMenu` (y submenús), `GSelect`, `GDatePicker`, `GHelper`, `GTooltip`, `GBreadcrumbs`, `GPartyField`, `GBookingBar`, `GFab` | La región de su disparador | El top layer no corta la herencia (regla 3 de la zona de marca, `api.md`). La fila del menú se alinea con el control que lo abrió |
| `GCombobox` (popover y superficie del teléfono) | La región de su `GInput` | Su `<Teleport>` va a la raíz de `GInput` |
| **`GDialog`** (y `GWidgetConfig`, `GWidgetGallery`, `GDialogStep`) | **La región donde está escrito** (decisión del usuario, #977) | Para salir: `density` en el diálogo o un envoltorio propio. La hoja del teléfono, igual que su panel |
| `GPageHeader` (muelle) | Su cabecera | El nodo del muelle vive dentro de la cabecera |
| **`GToaster`, `GStatusIsland`, `GSpeechHost`** (y el diálogo de revisión `g-speech-review`, que va a `body`) | **Nada: Δ0** | Su raíz lleva **`data-g-density="default"` fijo** (sin clase). Viven en `body` y se mudan al modal superior: si heredaran, un aviso cambiaría de tamaño al abrirse un diálogo compacto. Seguir la densidad de la página queda reservado (R3) |

**Regla para componentes nuevos:** lo que se abre en su sitio hereda; lo que un `<Teleport>` saca a `body` o a otro nodo lo declara en su contrato (tomará la página) o fija `data-g-density`.

### 5.2 P2 · «Cede al dedo» (decisión del usuario, #978)

Con `pointer: coarse` (la misma consulta del 44 px), **las regiones, `<html data-g-density>` y la clave del CLI vuelven a `1`**; **la prop explícita de una instancia no cede**.

- **Cómo se distingue sin JS:** la raíz con prop es la única que lleva a la vez `data-g-density="X"` **y** una clase que contiene `--density-X` (§3.1). La regla de §2.1 reafirma el valor solo en ese caso (especificidad 0,2,0 frente a 0,1,0, misma capa). Una región de la aplicación no lleva esa clase y cede. El CLI emite su propio restablecimiento táctil (§6), porque su regla va sin capa y ganaría a la de `grana.defaults`.
- **Lo de dentro de una raíz con prop** sigue heredando su valor (es su región, B); una región de la aplicación escrita **dentro** cede a 1 como cualquier otra.
- **44 px y 16 px ganan siempre** (D3): ya van después del multiplicador (`max(44px, …)`, `max(16px, …)`). P2 no los toca.
- **Falso positivo aceptado:** un elemento de la aplicación con `data-g-density="compact"` y una clase propia que contenga `--density-compact` no cede. Es un nombre que la aplicación no tiene por qué usar; se documenta.

### 5.3 Límite L6 (sin P2, con prop explícita)

Con puntero grueso, un `GBtn density="compact"` **se ve** de 27 px (su 44 px es el área `::after`, invisible) junto a un campo de 44 px en la misma barra. Con P2 ya no pasa en las regiones; con la prop explícita sigue pasando y es deliberado (la instancia lo pidió). Queda escrito en `btn.md` como límite.

## 6. Clave `density` del CLI (`@grana/cli`, contrato para bruno)

| Aspecto | Contrato |
| --- | --- |
| Clave | `density` en `grana.config.json`, opcional; se añade a `KEYS` (`config.js`) y a `tokens.md` §1 |
| Valores | `"default"` · `"comfortable"` · `"compact"` (cadena). Sin valor = `default` |
| Validación | Otro valor o tipo (incluidos los números `0.75`, `1`): error **`bad-density`**: «`density` debe ser "default", "comfortable" o "compact"; se recibió …». `--g-density` dentro de `overrides` o de `dark.overrides`: error **`density-override`**: «`--g-density` no se sobrescribe: usa la clave `density` (density.md §6)». `grana check` informa igual que `theme` |
| Salida con `default` o sin clave | **Nada** (Δ0 de bytes en `tokens.css`) |
| Salida con `comfortable`/`compact` | Después del bloque `:root` de tokens que no son de color, y fuera de los bloques de color y de oscuro: |

```css
:root:where(:not([data-g-density])) { --g-density: 0.75; }
@media (pointer: coarse) {
  :root:where(:not([data-g-density])) { --g-density: 1; }
}
```

- **Especificidad (0,1,0)**, como el resto de selectores de `:root` del CLI (#561): un segundo tema cargado después gana por orden.
- **`<html data-g-density>` gana al CLI** porque el selector deja de coincidir con el atributo presente; entonces rigen las reglas de §2.1 (en capa), sin choque con el tema sin capa (el problema de #637 no se da).
- **`tokens.json` (`--doc`):** `--g-density` figura con el valor emitido, sin valor oscuro (no depende del esquema) y con su uso; si `usage.js` exige uso por token, bruno añade la entrada.
- **Pruebas** (`packages/cli/test/`): los tres valores, cada error con su `id`, Δ0 de bytes sin clave y con `default`, el orden de los bloques y que `sync-defaults` deja fuera las reglas de atributo.

## 7. Lectura en JS: `utils/density.js` (bruno)

| Nombre | Firma | Contrato |
| --- | --- | --- |
| **`readDensity(el)`** | `(Element) → 'compact' \| 'comfortable' \| 'default'` | Lee el `--g-density` calculado del elemento y devuelve el paso más cercano (≤ 0,8125 → `compact`; ≤ 0,9375 → `comfortable`; si no, `default`; vacío o no numérico → `default`). Ve la cascada real: región, `<html>`, CLI y P2. Sin `el` o sin `getComputedStyle` (servidor): `'default'` |
| **`densityEpoch`** | `ShallowRef<number>` | Contador que sube **una vez por cuadro** cuando cambia cualquier `data-g-density` del documento. Un **único** `MutationObserver` perezoso sobre `document.documentElement` (`subtree: true`, `attributes: true`, `attributeFilter: ['data-g-density']`), creado por el primer suscriptor **en `onMounted`** y desconectado al desmontar el último (sin efectos en el nivel superior del módulo, #444) |
| **`useDensityEpoch()`** (o el nombre que bruno elija; interno) | composable | Registra la suscripción en `onMounted`/`onUnmounted` y devuelve `densityEpoch` |

- **Interno, no público:** no se exporta desde `src/index.js` (sin API nueva). Si una aplicación lo pide, se abre como API con su decisión.
- **Quién lo usa** (los `watch` que hoy miran `density` para volver a medir): `GTextarea`, `GRadioGroup`, `GSlider`, `GTabs`, `GAdaptiveLayout` (`useAdaptiveLayout.js`), `GFormRow`, la publicación de mínimos de `GNumberField` y `GTimeField`, y la lectura de separación de `GFormReveal` y `GFormFold` (`--_reveal-gap`, `--_fold-gap`). Cada uno añade `densityEpoch` como **fuente separada** del `watch` (lección de bd888df: nunca un getter que devuelva un arreglo nuevo). `GCalendar` no (pieza 4).
- **`GCard`** (oculta la meta de prioridad `low` en `compact`) usa `readDensity(root)` al montar y en cada `densityEpoch`. **Límite SSR aceptado:** sin prop y en una región compacta, la meta baja se pinta en el servidor y se quita al hidratar, una sola vez y sin animación (R4: por CSS con consultas de estilo, cuando las tres familias las tengan).
- **Rendimiento:** en un mismo cuadro, primero todas las lecturas (`getComputedStyle`) y después las escrituras (lección de #964). Ninguna lectura en el render del padre.
- **Límite:** el observador ve el atributo, no un cambio del token a mano (§2).

## 8. Qué lee cada hoja (para coco)

- **Alias de raíz:** el `1` literal del alias local (`--_density`, `--_d`, `--_df`, `--_adaptive-density`) pasa a `var(--g-density)`. Las reglas de clase `--density-*` que solo reasignan ese multiplicador **se quitan** (las hace el atributo); con ellas desaparece la mayor parte del CSS de densidad.
- **Valores por paso que no son un multiplicador** (`GTabs`: `--_mark-t` elige `--g-tabs-mark-default|comfortable|compact`, `tokens.md` §18): se interpolan **exactamente** desde `--g-density` sin token nuevo, con los pesos de Lagrange en los tres pasos:
  `--_mark-t: calc((var(--g-density) - 0.875) * (var(--g-density) - 0.75) * 32 * var(--g-tabs-mark-default) - (var(--g-density) - 1) * (var(--g-density) - 0.75) * 64 * var(--g-tabs-mark-comfortable) + (var(--g-density) - 1) * (var(--g-density) - 0.875) * 32 * var(--g-tabs-mark-compact))`.
  Da el token exacto en 1, 0,875 y 0,75 (los tres son binarios exactos). Coco puede escribir una forma equivalente; el criterio 14 mide el resultado.
- **Superficies de página:** `GStatusIsland.css` y `GSpeechPill.css` leen `--_density` por dentro; con la raíz fijada a `default` (§5.1) quedan en Δ0.
- **Pieza 3 (texto)** se escribirá reasignando los tokens de texto **en el elemento de la región** (`[data-g-density="compact"] { --g-text-…: … }`, como la zona de marca redeclara el color), nunca con selectores descendientes del tipo `[data-g-density="compact"] .g-btn`, que no respetan «la más cercana». B deja preparado eso: el atributo está en toda raíz con prop.
- **Literales:** ninguno nuevo; `0.75`/`0.875`/`1` viven solo en `defaults.css` (y los pesos numéricos de la interpolación, que no son medidas).

## 9. Movimiento (rúbrica `docs/documentacion/rubrica-movimiento.md`)

**El cambio de densidad no se anima** (decisión derivada: reflujo de toda la página, mareo, tareas largas; #964). No hay movimiento nuevo.

| Dimensión | Estado | Evidencia / riesgo / recomendación |
| --- | --- | --- |
| Propósito | No aplica | Sin movimiento; el cambio es instantáneo, en el mismo cuadro (kiwi 4.1, 4.2) |
| Comodidad visual | Cumple por diseño | Sin transiciones de alto, relleno ni separación al cambiar el token. Riesgo: una hoja con `transition` sobre `block-size`, `padding*`, `gap`, `min-block-size` o `inline-size` se dispararía; criterio 10 |
| Estabilidad | Riesgo medido aparte | El contenido se reordena al cambiar la densidad de una región grande; el foco no se pierde (criterio 10). Mantener en su sitio la fila enfocada queda reservado (R1, `setDensity`) |
| Interrumpible / control | No aplica | No hay animación que interrumpir; el control es el ajuste de la aplicación (P1) |
| Accesibilidad | Cumple por diseño | `prefers-reduced-motion` no cambia nada (no hay movimiento); 44/16 px intactos; P2 evita dianas de 44 con huecos compactos (WCAG 2.5.8) |
| Rendimiento | Criterio 10 y peso §11 | Un observador por documento, lecturas agrupadas, sin medida por render |

## 10. Criterios de aceptación (spec de bruno `tests/density.spec.mjs`; auditoría de coco)

Tema por defecto (`space` 4: `md` = 9 unidades = 36 px → 31,5 en `comfortable` y 27 en `compact`); tres motores salvo donde se dice.

1. **Δ0 por defecto.** Página sin regiones, sin prop y sin clave del CLI: alto, relleno y separación de los 37 componentes con `density` iguales al `dist/` anterior (Δ0 px). En el marcado, ninguna raíz sin prop lleva `--density-*` ni `data-g-density` (cambio de marcado esperado; las pruebas que esperaban `--density-default` se actualizan), salvo las tres superficies de página (`data-g-density="default"`) y `GCalendar` (su clase de siempre).
2. **Región.** Dentro de `<section data-g-density="compact">`: `GBtn`, `GInput`, `GSelect`, `GDatePicker`, `GTextarea rows=1` y `GInputGroup` `md` miden 27; en `comfortable`, 31,5; la fila de `GTable`, el item de `GSidebar`, el item de `GMenu`, la casilla, el interruptor, el deslizador y los demás de G1/G2 miden lo mismo que con la prop explícita del mismo paso (Δ0 frente a la prop).
3. **Anidación.** `compact` dentro de `comfortable` → 27; `default` dentro de `compact` → 36; tres niveles alternos, cada uno con el valor de su región más cercana.
4. **La prop gana.** `GBtn density="default"` dentro de `compact` → 36; `density="compact"` dentro de `comfortable` → 27. La raíz con prop lleva clase y atributo con el mismo valor; un `data-g-density` de la aplicación en la misma instancia (componente que hereda atributos en la raíz) pierde ante la prop.
5. **B · la prop es región.** `GTable density="compact"`: botones de su `toolbar` y el `GMenu` que abren → 27. `GCard density="compact"`: su acción `GBtn` → 27. `GDialog density="compact"`: un `GInput` de su contenido → 27. `GStack density="compact"`: un `GBtn` hijo → 27 y la separación × 0,75.
6. **Top layer.** `GMenu` abierto (`:popover-open`) desde un disparador en una región compacta: alto del item = alto del disparador (27). Lo mismo para las opciones de `GSelect` y el campo/panel de `GCombobox`.
7. **Diálogo heredado.** `GDialog` sin prop escrito en una región compacta, abierto como modal: relleno de carcasa × 0,75 y su `GInput` 27; con `density="default"` → 36.
8. **Superficies de página Δ0.** Con `<html data-g-density="compact">`, con la clave del CLI `compact` y con el `GToaster`/`GStatusIsland` trasladado a un `GDialog density="compact"`: sus `GBtn` miden lo mismo que en el `dist/` anterior.
9. **Formularios.** `GForm` sin prop dentro de una región compacta → campos 27. `GForm density="compact"` → campos y botones de `GFormActions` 27. Región `default` entre un `GForm compact` y un campo → el campo 36. Separaciones de `GFormSection`, `GFormReveal` y `GFormFold` siguen a la región. `useFormField().density` devuelve lo mismo que hoy en todos los casos (prueba unitaria).
10. **Cambio en marcha.** Cambiar el atributo de `<html>` (`default` → `compact` → `comfortable`) y el de una región: los altos cambian en el siguiente cuadro; `document.getAnimations()` no contiene ninguna `CSSTransition` sobre `block-size`, `min-block-size`, `inline-size`, `padding*`, `gap*` o `margin*`; el foco sigue en el mismo elemento; `GTextarea autosize`, el ajuste de `GRadioGroup`, `GSlider`, la marca de `GTabs`, las líneas y mínimos de `GFormRow`, los mínimos de `GNumberField`/`GTimeField` y la separación de `GFormReveal`/`GFormFold` se vuelven a medir en ≤ 2 cuadros. **Un solo** `MutationObserver` de densidad en el documento con 1 o con 200 componentes, ninguno antes del primer montaje y ninguno tras desmontar el último (instrumentado). Sin tareas largas (> 50 ms) al cambiar `<html>` con una tabla de 500 filas (entorno sin vecinos, #965).
11. **CLI frente a `<html>`.** Con `tokens.css` de `density: "compact"`: página → 27; `<html data-g-density="comfortable">` → 31,5; `<html data-g-density="default">` → 36; una región `comfortable` dentro sigue mandando. Un segundo tema cargado después (`density: "comfortable"`) gana por orden.
12. **Táctil** (Chromium y WebKit con `hasTouch` e `isMobile`; precondición `matchMedia('(pointer: coarse)').matches`; Firefox se omite, precedente `btn-limitaciones.spec.mjs`). Región `compact`, `<html compact>` y CLI `compact`: `--g-density` calculado = 1 en los elementos, separaciones iguales a `default` y el `GBtn` **visible** 36 (no 27). `GBtn density="compact"` explícito: `--g-density` 0,75, caja visible 27, área táctil 44; `GInput density="compact"`: caja 44 y texto editable 16. Lo de dentro de una raíz con prop hereda 0,75; una región de la aplicación dentro de ella, 1.
13. **Sin JS.** Marcado estático (SSR con `@vue/server-renderer`, o el HTML servido con JavaScript desactivado): región compacta → `GBtn` 27; la raíz con prop ya trae clase y atributo; ninguna diferencia de marcado al hidratar (sin avisos de hidratación).
14. **`GTabs`.** Grosor calculado de la marca = `--g-tabs-mark-{paso}` en los tres pasos, por región y por prop (Δ ≤ 0,01 px), también con un tema que cambie los tres tokens.
15. **`GCard`.** Meta `low` oculta en región `compact` tras montar, visible en `default`/`comfortable` y visible en región `compact` con puntero grueso (P2); con prop `compact`, oculta también en táctil.
16. **Rejilla y mínimos.** Con `--g-space-1` 4,375 y 3,75 px, alto × 2 entero (±0,01) en cada paso por región (#682); 24, 44 y 16 px intactos (los criterios de #972 siguen en verde).
17. **Grep.** Ninguna hoja de `components/` declara `--g-density`; ninguna lee `.g-form--density-*` desde un descendiente; no queda ninguna regla `--density-*` que solo reasigne el multiplicador (salvo `GCalendar`); `16px`, `24px` y `44px` como hoy.
18. **Blocks.** `GbProductCard03`, `GbConfirmation03` y `GResourceList` con `density` se ven coherentes (auditoría de coco, cambio esperado de §3.5); `dist/blocks.js` dentro de su tope.

**No verificable aquí:** SSR real de una aplicación con su servidor (se aproxima con `@vue/server-renderer` y JS desactivado), una tableta con teclado y panel táctil cambiando de puntero en caliente (P2 se evalúa al cambiar la consulta; los mínimos publicados se miden al montar y en cada época), lector de pantalla (sin cambio semántico esperado).

## 11. Peso (lote propio fuera de #506; con más, vuelve a lima y decide el usuario)

| Salida | Tope (gzip -9, copia aislada antes y después; bruno lo registra en `CHANGELOG.md`) |
| --- | --- |
| `dist/grana.js` | **≤ +768 B** para todo el lote: `utils/density.js`, props a `undefined`, atributo y clase solo con prop, `?? undefined` en los compuestos, épocas en los `watch`, formularios y superficies fijadas. Kiwi estimó ≤ 512 B solo para la utilidad, sin medir; quitar el `'default'` y el cálculo desde el contexto puede ahorrar |
| Entradas propias (`combobox`, `time-field`, `slider`, `file-field`, `speech`, `status`, `fab`, `page-header`, `app-shell`, `card-group`, `form-fold`, `tag`, `load-region`) | **≤ +256 B** cada una (la utilidad llega por `__shared`, sin copia) |
| `dist/blocks.js` (`@grana/blocks`) | **≤ +128 B** |
| `dist/grana.css` | **≤ +256 B**; lo esperado es que **baje** (se quitan ~37 × 3 reglas de clase y se añaden siete reglas en `defaults.css` y la interpolación de `GTabs`). Si crece, coco lo explica en su informe |
| `tokens.css` del CLI | Sin la clave o con `default`: **Δ0 bytes**; con la clave: las dos reglas de §6 |

**Medido por bruno (`CHANGELOG.md`, #985):** `grana.js` **+586 B** (tope +768), `grana.css` **−739 B**, entradas propias **≤ +57 B** (tope +256; `slider` +57, `time-field` +32, `speech` +19…), `dist/blocks.js` **Δ0** (tope +128) y `tokens.css` **Δ0 sin clave**. Dentro de tope en todas las salidas.

## 12. Reparto y orden

| Paso | Quién | Qué | Archivos |
| --- | --- | --- | --- |
| 1 (en paralelo) | **coco** | Token y atributo: §2.1 en `defaults.css`; alias de raíz a `var(--g-density)` **conservando** por ahora las reglas de clase (Δ0 mientras bruno no cambia el marcado); `GFormSection`, `GFormReveal`, `GFormFold` leen el token; interpolación de `GTabs`; verificadores de coco | `styles/defaults.css` y las 40 hojas que hoy leen densidad (todas salvo `GCalendar.css`): `GAdaptiveLayout`, `GBtn`, `GCard`, `GCheckbox`, `GCombobox`, `GDatePicker`, `GDialog`, `GFieldGroup`, `GFileField`, `GForm`, `GFormActions`, `GFormFold`, `GFormLayout`, `GFormReveal`, `GFormRow`, `GFormSection`, `GInput`, `GInputGroup`, `GMenu`, `GNumberField`, `GPartyField`, `GRadioGroup`, `GSelect`, `GSidebar`, `GSlider`, `GSpeechPill`, `GSplit`, `GStack`, `GStatusIsland`, `GStepper`, `GSurface`, `GSwitch`, `GTable`, `GTabs`, `GTextarea`, `GTimeField`, `GWidget`, `GWidgetConfig`, `GWidgetGallery`, `GWidgetGrid` |
| 1 (en paralelo) | **bruno** | Props a `undefined` y `meta.json` (§3.2); clase y atributo solo con prop (§3.1); `?? undefined` (§3.4); formularios (§4); superficies fijadas (§5.1); `utils/density.js` y sus usuarios (§7); clave del CLI (§6); pruebas unitarias y `tests/density.spec.mjs` | Los `.vue` y `meta.json` de G1 (18), G2 (`GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GCheckboxGroup`, `GRadioGroup`, `GSwitch`, `GSlider`, `GNumberField`, `GTimeField`, `GCombobox`, `GFileField`, `GPartyField`, `GFormLayout`, `GFormRow`, `GFieldGroup`, `GInputGroup`, `GFormActions`, `GAdaptiveLayout`, `GCheckbox`), G3 (`GFormSection`, `GFormReveal`, `GFormFold`), `GToaster`, `GStatusIsland`, `GSpeechHost`, `GCard`, `formContext.js`, `utils/density.js` (+ prueba), `packages/cli/src/config.js` y `theme.js` (+ pruebas), `packages/blocks` (`GResourceList` y los `Gb*` que pasen valores resueltos), playground |
| 2 | **coco** | Quitar las reglas de clase `--density-*` que solo reasignan el multiplicador (necesita el atributo de bruno: si se quitan antes, la prop explícita deja de apretar) | Las mismas hojas |
| 3 | **coco** | Auditoría posterior (`auditoria-visual.md` y rúbrica de movimiento) con los criterios de §10; banco `design/lab/density/` | `design/lab/density/auditoria.md` |
| 4 | **mora-docs** | README: la fila `density` de cada componente («sin valor: la región»), la regla de §3.3 y una sección común | READMEs |

**Fuera de esta pieza:** el texto que baja con `compact` (pieza 3, #966; B deja el atributo en cada raíz con prop para escribirla una vez por región), la densidad de `GPagination`, `GTag`/`GTagGroup`, `GBadge`, `GAccordion`, `GFilterBar`, `GBreadcrumbs` y la alineación de `GCalendar` (pieza 4, #967): **hasta entonces no siguen la región** (en una barra compacta quedan en el paso 1; límite visible aceptado por el orden de #969).

## 13. Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Pruebas y snapshots que esperan `--density-default` siempre | Se actualizan en el mismo commit de bruno; el criterio 1 fija el marcado nuevo |
| Contenedores con prop que aprietan lo de dentro (§3.5) | Auditoría de coco en los casos listados; salida con prop en el hijo |
| `data-g-density` en un campo cae en el `<input>` | Regla §3.3 y README |
| Falso positivo del selector de P2 | §5.2; nombre que la aplicación no usa |
| Coste del observador | Uno por documento, filtrado por atributo, agrupado por cuadro, lecturas antes que escrituras |
| Valores resueltos que se cuelan en un compuesto | Búsqueda de bruno (§3.4) y criterio 2 (Δ0 frente a la prop) |
| Orden coco/bruno | Paso 2 solo tras el atributo de bruno |
| `GCalendar` y G5 no siguen la región | Límite escrito en sus README hasta la pieza 4 |

## 14. Reservado

- **R1 · `setDensity(el, value)`** que mantenga en su sitio la fila o el campo enfocado al cambiar (WebKit sin `overflow-anchor`). Solo si se pide.
- **R2 · `GDensity`** (componente de región): no hace falta; el atributo lo da.
- **R3 · Densidad de avisos, isla y voz:** si llega, leen la de la página (`<html>` o el CLI), nunca la de su sitio; hoy fijas en `default`.
- **R4 · Meta de `GCard` por CSS** con consultas de estilo sobre `--g-density`.
- **Exportar `readDensity`/`densityEpoch`** como API pública: solo con un caso real.

## 15. Auditoría visual previa (`docs/documentacion/auditoria-visual.md`)

Pieza de mecanismo, sin forma nueva. Estructura y jerarquía: no cambian (la densidad aprieta, no reordena). Contraste y delimitación: sin cambio de color; las regiones las delimita la aplicación. Espaciado: deriva de los tres pasos de #15 y de la herencia; P2 impide huecos compactos entre dianas de 44 px. Controles, tablas y formularios: alturas comunes por paso (criterio 2, Δ0 frente a la prop). Estados de interfaz: sin cambio. Consistencia: reutiliza el patrón de la zona de marca (`data-g-zone`) y la forma de #561; ningún componente ni clave de contexto nuevos; un solo token global. **Sin decoración y sin movimiento.**
