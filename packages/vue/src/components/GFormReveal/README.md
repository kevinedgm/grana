# GFormReveal

Un **bloque de campos que existe solo si una respuesta lo pide**: «¿Requiere factura? Sí → datos fiscales», «Tipo de persona: Física → CURP · Moral → razón social». Va **justo después de la pregunta** que lo condiciona. Mientras no aplica, sus campos **no forman parte del formulario** (ni `FormData`, ni Tab, ni validación nativa, ni errores, ni resumen) pero **conservan lo que se había escrito**.

Es una pieza del [sistema de formularios](../GForm/README.md) (Fase 3). Fuera de `GForm` también funciona; solo falta la parte del registro.

**Etiqueta:** `<g-form-reveal>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/form-reveal/auditoria.md`](../../../../../design/lab/form-reveal/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (playground en `packages/vue/playground/`, sección «Formularios (GForm)», panel «Bloque condicional (GFormReveal)»).

> **En plantillas dentro del HTML** (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-form-reveal ...></g-form-reveal>`.

## Uso

```vue
<script setup>
import { reactive, computed } from 'vue'

const m = reactive({ nombre: '', factura: null, razon: '', rfc: '' })
// Las reglas son de la aplicación y se calculan SIN condiciones: el bloque cerrado hace que no cuenten
const errores = computed(() => ({
  nombre: m.nombre.trim() ? '' : 'Escribe el nombre del paciente',
  factura: m.factura ? '' : 'Elige si requiere factura',
  razon: m.razon.trim() ? '' : 'Escribe la razón social',
  rfc: m.rfc.trim() ? '' : 'Escribe el RFC'
}))
</script>

<template>
  <g-form :errors="errores" aria-label="Facturación" @submit="guardar">
    <g-form-layout>
      <g-input v-model="m.nombre" name="nombre" label="Nombre del paciente" required></g-input>

      <!-- La pregunta -->
      <g-radio-group
        v-model="m.factura" name="factura" appearance="inline" label="¿Requiere factura?" required
        :options="[{ value: 'si', label: 'Sí' }, { value: 'no', label: 'No' }]"
      ></g-radio-group>

      <!-- El bloque: hermano de la pregunta, justo después -->
      <g-form-reveal :when="m.factura === 'si'">
        <g-input v-model="m.razon" name="razon" label="Razón social" required></g-input>
        <g-input v-model="m.rfc" name="rfc" label="RFC" required></g-input>
      </g-form-reveal>

      <g-textarea name="obs" label="Observaciones"></g-textarea>
    </g-form-layout>
    <g-form-actions><g-btn type="submit">Guardar</g-btn></g-form-actions>
  </g-form>
</template>
```

La condición la calcula **tu aplicación** con su modelo (`:when="m.factura === 'si'"`); el bloque solo la muestra. Con «No» (o sin responder) el bloque desaparece del flujo y de la validación; al volver a «Sí», los campos reaparecen con lo que habías escrito.

## Qué hace cerrado y qué hace abierto

| | Cerrado (`when` falso) | Abierto (`when` verdadero) |
| --- | --- | --- |
| Vista | Sin altura, sin hueco, invisible | Visible, con la barra y la sangría de pertenencia |
| `FormData` y envío nativo | Sus campos **no van**, tampoco los `<input hidden>` de `GSelect` y `GDatePicker` | Van |
| Tab | Los salta | Desde la pregunta, Tab entra en el bloque |
| Validación nativa (`:invalid`) | No cuentan | Cuentan |
| Errores, `invalid` y resumen (`GForm`) | No bloquean el envío, no se listan, no se revelan | Como cualquier campo |
| Lo escrito | **Se conserva** | — |
| Contenido | Sigue montado | Montado |

**Cómo se consigue.** La raíz es un `<div>` sin rol que recibe `inert` mientras está cerrado. Dentro hay un `<fieldset role="none">` con `disabled` mientras está cerrado: es el único mecanismo nativo que saca de `FormData` y de la validación de restricciones a **todos** los controles descendientes, también los tuyos. `inert` solo no basta: un control `inert` sigue enviándose. `role="none"` evita que un `fieldset` sin nombre se anuncie como un grupo vacío. No lleva `<legend>`.

**El contenido nunca se desmonta** (ni `v-if` ni montaje diferido). Por eso conserva los valores no controlados y el estado de los bloques anidados, y por eso las filas y el segmentado de dentro siguen midiendo mientras el bloque está cerrado. Esconder lo que no aplica sin borrar lo que el usuario ya escribió es lo que pide WCAG 3.3.7.

`inert` y `disabled` cambian **en el acto** con `when`, así que Tab llega al bloque desde el primer cuadro de la apertura.

## Bloques anidados: Física / Moral

Los bloques pueden anidarse; cada uno va justo después de **su** pregunta, dentro del bloque padre. Varios bloques excluyentes de la misma pregunta van seguidos: el cerrado no ocupa nada.

```vue
<g-radio-group v-model="m.factura" name="factura" appearance="inline" label="¿Requiere factura?" :options="sino"></g-radio-group>

<g-form-reveal :when="m.factura === 'si'">
  <g-radio-group v-model="m.persona" name="persona" appearance="inline" label="Tipo de persona" required
    :options="[{ value: 'fisica', label: 'Física' }, { value: 'moral', label: 'Moral' }]"></g-radio-group>

  <g-form-reveal :when="m.persona === 'fisica'">
    <g-input v-model="m.curp" name="curp" label="CURP" required></g-input>
  </g-form-reveal>

  <g-form-reveal :when="m.persona === 'moral'">
    <g-form-row>
      <g-input v-model="m.razon" name="razon" class="g-form-w-lg" label="Razón social" required></g-input>
      <g-date-picker v-model="m.constitucion" name="constitucion" class="g-form-w-sm" label="Constitución"></g-date-picker>
    </g-form-row>
  </g-form-reveal>

  <!-- Común a las dos ramas: una sola vez, fuera de ellas -->
  <g-input v-model="m.rfc" name="rfc" label="RFC" required></g-input>
</g-form-reveal>
```

- Un bloque está **activo** si su `when` es verdadero **y** todos sus bloques ancestros están activos. Un anidado conserva su propio estado visual (abierto) dentro de un padre cerrado, pero está inactivo: no se anima otra vez al reabrir el padre.
- **Cada campo tiene su `name` en todo el formulario**, también entre ramas excluyentes: un `name` repetido avisa en desarrollo (aviso de `GForm`). Un campo común a varias ramas (el RFC) va **una vez**, fuera de los bloques; la regla que cambia por rama (longitud del RFC) es de tu aplicación.
- Cada nivel anidado añade su barra.

Verificado en el componente real (`#fr-form` del playground): «Sí» → Física/Moral anidado, con `GRadioGroup`, `GInput`, `GFormRow`, `GDatePicker`, `GSelect` y `GCheckboxGroup` dentro, en los tres motores.

## Dentro de una sección

`GFormSection` **contiene** la pregunta y el bloque, nunca al revés. Si el bloque merece un título, ponlo en la sección que envuelve a ambos.

```vue
<g-form-section title="Antecedentes">
  <g-form-layout>
    <g-radio-group v-model="m.alergias" name="alergias" appearance="inline" label="¿Tiene alergias?" :options="sino"></g-radio-group>
    <g-form-reveal :when="m.alergias === 'si'">
      <g-textarea v-model="m.alergiasCual" name="alergias-cual" label="¿A qué?" required></g-textarea>
    </g-form-reveal>
  </g-form-layout>
</g-form-section>
```

**Pon siempre un `GFormLayout` dentro de la sección** (DECISIONS #283). El cuerpo de `GFormSection` **no es una pila**: no separa sus hijos ni pasa la densidad. Si la pregunta y el bloque van directamente en ese cuerpo, la distancia entre la pregunta y el bloque abierto es **0px** (en `GFormLayout` son 20px, medido). Ver [Limitaciones conocidas](#limitaciones-conocidas).

Si las partes del bloque forman **una pregunta** con título propio, es un `GFieldGroup` dentro del bloque, no una `GFormSection`.

## Cuándo usarlo (y cuándo no)

| Quieres… | Usa |
| --- | --- |
| Que **la respuesta** decida si un grupo de campos aplica | `GFormReveal` |
| Que el usuario abra o pliegue una sección con un botón, y sus datos **sigan** enviándose y validándose | `GFormSection collapsible` (Fase 3, reservado) |
| Que el usuario decida incluir un bloque | `GFormSection addable` (Fase 3, reservado) |
| Un dato que existe pero no se puede tocar ahora | `disabled` (mostrar todo y deshabilitar está **rechazado** para lo que no aplica) |
| Una sola pregunta compuesta | `GFieldGroup` |

## API

### Props

| Prop | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `when` | Boolean | `false` | El bloque aplica. Lo calcula tu aplicación con su modelo |

**Eso es todo.** No hay `v-model`, ni `is`/`equals`, ni `exclude`, ni `keepValues`, ni `indent`, ni `label`, ni `focus`, ni `density`, ni `for` (DECISIONS #274). El porqué de cada ausencia:

- **Sin `v-model` ni `is`/`equals`:** tu aplicación ya tiene el modelo de la pregunta y calcula la condición. Una comparación dentro del componente la duplicaría y pediría enseguida `in`, negación y combinaciones.
- **Sin `exclude`:** un bloque cerrado **siempre** sale del envío; un campo oculto que se envía es un error.
- **Sin `keepValues`:** un bloque cerrado **siempre** conserva lo escrito; borrarlo contradice WCAG 3.3.7, y `GForm` no posee los valores (son de tu modelo).
- **Sin `indent`:** la sangría es una sola convención visual.
- **Sin `label`:** no tiene nombre; lo dan sus campos y el orden.
- **Sin `focus`:** mover el foco al elegir es un cambio de contexto (WCAG 3.2.2) y con radios rompería las flechas.
- **Sin `density`:** la densidad es la del contexto (ver [Colocación](#colocación)).

### Eventos

**Ninguno.** Tu aplicación ya sabe cuándo cambia `when`. Quien necesite el final de la animación escucha el `transitionend` **nativo** en la raíz, filtrando `event.target === event.currentTarget` (con movimiento reducido solo hay transición de `opacity`):

```vue
<g-form-reveal :when="abierto" @transitionend="(e) => e.target === e.currentTarget && alTerminar()">…</g-form-reveal>
```

La escucha propia del componente se fusiona **primero**; la tuya, después.

### Slots

| Slot | Contenido |
| --- | --- |
| por defecto | Los campos condicionados, como hijos de una **pila**: cada hijo ocupa el ancho entero, como en `GFormLayout`. Admite campos sueltos, `GFormRow`, `GFieldGroup`, `GInputGroup`, `GCheckbox`/`GCheckboxGroup`, `GRadioGroup`, `GSwitch`, `GTextarea`, campos propios (`useFormField`) y otros `GFormReveal` anidados. **Nunca `GFormSection`** |

### Atributos

`id`, `class`, `style`, `data-*` y escuchas van a la raíz `<div>` (`inheritAttrs` normal). Tu `style` se conserva junto a la variable que escribe el componente.

## Datos, errores y envío (con `GForm`)

Los campos dentro de un bloque inactivo **siguen registrados** en `GForm`, marcados como inactivos. Eso es lo que permite que tu aplicación calcule `errors` **sin condiciones**: si el bloque los desregistrara, `errors.curp` pasaría a ser un error general sin enlace y **bloquearía** el envío.

| Situación | Qué pasa |
| --- | --- |
| Envío con el bloque cerrado | Evento `submit` (no `invalid`); el `FormData` **no** trae sus campos. Un `required` dentro no cuenta |
| `invalid` y `GErrorSummary` | No listan los campos de bloques cerrados |
| `showErrors()` | No revela ni lista los campos de bloques cerrados |
| `focusFirstError()` | Los salta |
| El bloque se cierra con errores visibles | Los errores salen **en silencio** del resumen (como cuando se corrige un campo); si no queda ninguno, el resumen se oculta. Los mensajes en línea se van con el bloque |
| El bloque se cierra | Sus campos vuelven a **sin editar y sin revelar**; el valor se conserva |
| El bloque se reabre | No hay errores a la vista. Un error reaparece por las reglas de siempre: salir del campo habiendo escrito, cambiar un control de elección o enviar. El resumen lo recupera en el siguiente envío o `showErrors()` |
| `dirty` | Abrir o cerrar no lo cambia (ya lo subió el cambio en la pregunta) |
| `readonly` / `disabled` de `GForm` | Pasan por el bloque a sus campos como siempre. El bloque no tiene esos estados: sigue a `when` |

Esto no depende de que los campos sean de Grana: un campo tuyo hecho con `useFormField` queda inactivo igual, sin cambiar su código.

### Receta: enviar tu modelo, no el `FormData`

El `FormData` excluye solo lo que el `fieldset disabled` ya saca. Si tu aplicación envía **su modelo** (un objeto reactivo, no el `FormData`), recibirá también los valores **conservados** de bloques cerrados: es tu modelo y Grana no lo limpia. Filtra con **la misma condición que pasas a `when`**, declarada una sola vez como `computed`:

```vue
<script setup>
import { reactive, computed } from 'vue'

const m = reactive({ factura: null, persona: null, curp: '', razon: '', rfc: '' })

// Cada condición, una sola vez
const pideFactura = computed(() => m.factura === 'si')
const esFisica = computed(() => m.persona === 'fisica')
const esMoral = computed(() => m.persona === 'moral')

function guardar() {
  const datos = { factura: m.factura }
  if (pideFactura.value) {
    datos.persona = m.persona
    datos.rfc = m.rfc
    // Un bloque anidado está activo con su `when` Y el de sus ancestros: filtra igual
    if (esFisica.value) datos.curp = m.curp
    if (esMoral.value) datos.razon = m.razon
  }
  return api.guardar(datos)
}
</script>

<template>
  <g-form-reveal :when="pideFactura">
    …
    <g-form-reveal :when="esFisica">…</g-form-reveal>
    <g-form-reveal :when="esMoral">…</g-form-reveal>
  </g-form-reveal>
</template>
```

No hay una lista `inactive` en `submit` ni un método `isActive(name)` (DECISIONS #277): los nombres registrados no son las claves de tu modelo (campos sin `name`, campos propios sin `useFormField`, partes de grupo con nombre propio), y una lista parcial daría falsa seguridad. Si un caso real lo pide, sería API nueva y se decide con el producto. El filtrado de arriba es código de tu aplicación: Grana no lo ejecuta ni lo prueba.

## Foco

- **Al abrir, el foco no se mueve** y no hay forma de pedirlo (WCAG 3.2.2). Tab, desde la pregunta, entra en el bloque abierto. Con un `GRadioGroup` de pregunta, las flechas eligen al moverse, así que el bloque se abre y se cierra **sin mover el foco**.
- **Al cerrar con el foco dentro** (solo ocurre por programa, porque la pregunta va antes): **antes** de aplicar `inert` y `disabled`, el foco va al **último elemento enfocable que precede al bloque** en el orden del documento (no deshabilitado, no `inert`, con caja). Si es un radio, a la **opción elegida** de su grupo, si la hay. Sin ningún enfocable anterior, al primero posterior. Con `preventScroll: true`. **Nunca queda en `<body>`** (WCAG 2.4.3).
- **Sin desplazamiento automático** al abrir ni al cerrar.

Comprobado en el playground: con el foco en el RFC, cerrar por programa lleva el foco a la opción elegida de «¿Requiere factura?», sin mover el desplazamiento.

## Accesibilidad

- **Sin `aria-expanded` ni `aria-controls`.** ARIA 1.2 no admite `aria-expanded` en `radio`, y en una casilla haría que sonara como un botón de divulgación. El bloque **no conoce a su disparador**: la relación la dan el orden de lectura y de Tab (el contenido nuevo es lo siguiente) y la barra, que la refuerza visualmente.
- **Sin región viva.** Con radios, las flechas eligen al moverse y una región viva produciría un anuncio por pulsación. Si conviene adelantar lo que aparecerá, dilo en la **descripción de la opción** («Te pediremos tus datos fiscales»): es una guía de contenido del contrato, no algo que el componente haga.
- **`fieldset role="none"` sin `legend`:** el árbol de accesibilidad del bloque abierto no añade un grupo sin nombre (comprobado con `ariaSnapshot` en el playground).
- **Cerrado = `inert` + `disabled`:** no se enfoca, no se lee ni se envía.
- **Señal de pertenencia:** una **barra** al inicio y una **sangría**. Es un **borde** (no sombra ni fondo), de modo que sobrevive a `forced-colors`; usa propiedades lógicas (en RTL va a la derecha). No es la única señal (también el orden y la sangría), por eso el contrato no le exige 3:1.
- **Medido** (Chromium, Firefox y WebKit, componente real del playground; temas: por defecto, uno de auditoría generado con `@grana/cli`, el «Tema de prueba» y los once generados de Dark Color Presence, claros y oscuros):
  - **Barra:** 2px; empieza en el borde de inicio de la pregunta (±1px) y termina con las filas, que acaban en el mismo borde que las de fuera del bloque (±1px). Sangría de **16 / 14 / 12px** en densidad `default` / `comfortable` / `compact`. Contraste de la barra: mínimo **3.45:1** en claro y **4.32:1** en oscuro con el tema por defecto; en todos los temas probados, de **3.43** a **5.35:1** en claro y de **4.28** a **4.35:1** en oscuro (superan el 3:1 aunque el contrato no lo exija).
  - **Separación:** la pila del cuerpo separa igual que `GFormLayout` en cada densidad. Un bloque cerrado entre dos campos no añade distancia (pregunta → siguiente campo = una separación).
  - **Anchos:** a 480, 360 y 320px, con dos niveles abiertos, sin desborde horizontal.
  - **Disparador quieto** (con el límite de [Limitaciones conocidas](#limitaciones-conocidas)): al abrir y al cerrar con un clic real, la pregunta no se mueve (Δ 0px de arriba e inicio, Δ del desplazamiento 0 en cada cuadro), en LTR y en RTL.
  - **Colores forzados** (emulado en Chromium): la barra toma `CanvasText` (≥ 3:1 sobre `Canvas`) y queda alineada en LTR y RTL; el bloque cerrado no se ve y no ocupa altura.
  - **RTL:** barra a la derecha; la etiqueta de `GRadioGroup` con `dir="auto"` se lee en orden («¿Requiere factura?»).

## Movimiento

La altura y el margen se animan con `--g-duration-slow` y `--g-ease-out`; el fundido, con `--g-duration-fast` y `--g-ease-standard`. La altura se anima con una rejilla de una pista (`grid-template-rows: 0fr → 1fr`): no se mide ninguna altura.

| Fase | Raíz | Cuerpo | Campos (en `GForm`) |
| --- | --- | --- | --- |
| Cerrado | sin `is-open`, `inert`, invisible, altura 0, margen de inicio negativo | `disabled`, recortado | inactivos |
| Abriendo | `is-open is-animating`, sin `inert` | habilitado, recortado | activos |
| Abierto | `is-open` | habilitado, `overflow: visible` (no recorta anillos de foco ni sombras) | activos |
| Cerrando | sin `is-open`, `is-animating`, `inert` | `disabled`, recortado | inactivos, revelado limpio |

- **Al abrir**, el fundido empieza con retraso y termina con la altura; **al cerrar**, el fundido es corto y desde el principio, y el bloque pasa a invisible solo al final.
- **`is-animating`** dura desde el cambio de `when` hasta el `transitionend` de `grid-template-rows` **cuya diana es la raíz**, o hasta un **temporizador de respaldo** igual a la mayor suma de `transition-duration` + `transition-delay` calculadas de la raíz, más 50ms. El respaldo existe porque una transición de 0s no emite `transitionend` (movimiento reducido).
- **No se anima al montar**: `is-ready` llega tras el primer pintado (dos cuadros) y, sin ella, no hay transiciones. Tampoco se anima un anidado cuyo estado no cambió al reabrir su padre.
- **Interrupción:** cambiar `when` a mitad de la transición revierte desde la altura actual (transiciones CSS): al volver a abrir a la mitad del cierre, la altura no salta (< 5 % de la altura total).
- **Movimiento reducido** (`prefers-reduced-motion: reduce`; menos, no cero): altura y margen cambian **en un cuadro** y el **fundido se conserva** al abrir y al cerrar; al cerrar, el bloque sigue visible hasta que acaba el fundido. Medido: sin transición de altura ni de margen, solo `opacity` y `visibility`; el disparador no se mueve; `is-animating` se retira por el temporizador de respaldo a los 246 a 328ms (fundido de 120ms + 50ms + la latencia del clic).
- **Sin hueco al cerrar:** el margen de inicio del bloque cerrado es `-` el `row-gap` de su elemento padre, que el componente lee y escribe en línea como `--_reveal-gap` (px) al montar, en cada cambio de `when` y cuando el padre cambia de tamaño. Así una pregunta seguida de un bloque cerrado y de otro campo deja **una** separación, y al abrir lo de abajo baja de forma continua. Es una variable **interna**: no la escribas ni la leas.

## Colocación

- **Inmediatamente después de la pregunta** que lo condiciona, como hermano en la misma pila: un `GFormLayout` (dentro de una sección, el `GFormLayout` de su cuerpo; el cuerpo de `GFormSection` **no** es una pila, #283) o el cuerpo de otro `GFormReveal`. En un contenedor propio tuyo, la separación es su `row-gap`; con `row-gap: normal` vale 0px y el bloque queda pegado a la pregunta.
- **Nunca dentro de una `GFormRow`.** Un bloque ocupa su propia fila y **contiene** filas: «Otro → Especifique» va debajo de la pregunta, no al lado. Un bloque dentro de una fila reserva una columna vacía aun cerrado y cambia el reparto de la línea del disparador al abrir (medido por kiwi).
- **Nunca `GFormSection` dentro del bloque.** Un título del nivel de la sección de la pregunta, dentro de un bloque sangrado, contradice la jerarquía de encabezados (WCAG 1.3.1).
- **Con o sin `GFormLayout`.** El cuerpo **re-provee** el sub-contexto de distribución: sus campos se comportan igual dentro y fuera de un `GFormLayout` (ocupan su sitio, `block`) y la densidad sale del sub-contexto de distribución, luego de `GForm` y, sin ninguno, `default`. `stack`, `readonly` y `disabled` del sub-contexto padre pasan al interior. Los avisos de `GFormLayout` no se aplican a los hijos del cuerpo.

## Avisos de desarrollo

Prefijo `[Grana GFormReveal]` o `[Grana GFormSection]`; una vez por instancia, al montar; solo fuera de producción. **Ninguno cambia el comportamiento.**

1. `GFormReveal`: su padre es la raíz de una `GFormRow` («ocupa su propia fila y contiene filas; colócalo después de la fila de la pregunta»).
2. `GFormReveal`: no tiene hermano anterior («debe ir justo después de la pregunta que lo condiciona»).
3. `GFormSection`: va dentro de un `GFormReveal` («la sección contiene la pregunta y el bloque, no al revés»).

Además, un `name` repetido entre bloques excluyentes avisa desde `GForm` (aviso 1 de `GForm`).

> **Aviso decidido, aún sin implementar.** DECISIONS #283 añade un cuarto aviso de `GFormSection` (un campo, una `GFormRow` o un `GFormReveal` como hijo directo del cuerpo de la sección). En el código actual de `GFormSection.vue` todavía no existe: lo aplica bruno. Hasta entonces, el uso incorrecto no avisa.

## Teclado

**Sin teclas propias.**

| Tecla | Acción |
| --- | --- |
| Tab / Mayús+Tab | Desde la pregunta entra en el bloque abierto; salta el cerrado (`inert` + `disabled`) |
| Flechas en un `GRadioGroup` (la pregunta) | Eligen al moverse (nativo): el bloque se abre o se cierra **sin mover el foco** |
| Espacio en una casilla (la pregunta) | Igual |

(En WebKit, las flechas de los radios no envuelven ni invierten ←/→ en RTL, y en macOS Tab no llega a los radios sin «Acceso total por teclado»: es el comportamiento de la plataforma, ver [`GRadioGroup`](../GRadioGroup/README.md#teclado).)

## Tema

El bloque **no añade tokens propios** (DECISIONS #280). Consume, con los valores de `defaults.css`:

| Token | Para qué |
| --- | --- |
| `--g-form-gap` | Separación entre los hijos del cuerpo (× densidad) |
| `--g-border-width` | Grosor de la barra (× 2) |
| `--g-color-border-control` | Color de la barra (nunca `accent`, `brand` ni `active`: no es estado ni acción) |
| `--g-space-4` | Sangría, distancia de la barra al contenido (× densidad) |
| `--g-duration-slow` | Altura y margen (**token nuevo**, 240ms con el tema por defecto; lo comparten `GSidebar` y `GStepper`) |
| `--g-duration-fast` | Fundido |
| `--g-ease-out`, `--g-ease-standard` | Curvas |

Densidad: `default` ×1, `comfortable` ×0.875, `compact` ×0.75 (sobre la sangría y la separación del cuerpo).

Como la barra usa `--g-color-border-control`, cambiar ese token cambia también el borde de las cajas de los campos. Los valores de tema van sin literales ni valores de respaldo; las únicas medidas literales del CSS son `0px` y `0s`.

## Clases

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-form-reveal` | Raíz `div` | Siempre |
| `g-form-reveal--density-{default\|comfortable\|compact}` | Raíz | Siempre |
| `is-open` | Raíz | `when` verdadero (en el acto) |
| `is-animating` | Raíz | Desde un cambio de `when` hasta asentarse |
| `is-ready` | Raíz | Tras el primer pintado (sin ella, sin transiciones) |
| `g-form-reveal__body` | `fieldset role="none"` | Siempre |

Variable en línea: `--_reveal-gap` (px, interna), en la raíz tras montar.

Render de servidor: se pinta con `inert` y `disabled` según `when`, de modo que un bloque cerrado queda fuera del envío desde el primer HTML; sin `is-ready`, sin `is-animating` y sin `--_reveal-gap` en línea hasta montar (un bloque cerrado deja, hasta entonces, una separación).

## Cambio colateral: `GRadioGroup`

Para que la pregunta de un bloque se lea bien en un formulario RTL, el texto de la etiqueta de `GRadioGroup` pasó a un `<span class="g-radio-group__label-text" dir="auto">` en línea dentro de `__label` (DECISIONS #282): sin él, «¿Requiere factura?» salía «?Requiere factura¿». Comprobado por coco: las capturas de la etiqueta con la envoltura y sin ella son **idénticas byte a byte** en `inline` y `segmented`, con el tema por defecto y con uno de auditoría en oscuro. No se extendió a las etiquetas de otros campos sin medir.

## Limitaciones conocidas

- **Límite de «Δ 0px» del disparador con la página desplazada hasta el final.** Si el bloque que se cierra es grande y no hay contenido debajo, el navegador **recorta el desplazamiento** al encoger la página, y la pregunta **baja** lo que encoge (medido con un bloque de 408px + 20px: **428px**, en los tres motores). Baja de forma continua, con la curva del bloque, y **sigue visible**. Al abrir con la página al final, el disparador no se mueve (Δ 0px). Es inherente al navegador (pasa igual con `<details>`) y no se arregla con CSS. Con contenido debajo, o con la página no desplazada al final, el disparador no se mueve. Anotado también en el contrato (`form.md` §14 «Transición», #283).
- **Un bloque directo en el cuerpo de `GFormSection`, sin `GFormLayout`, queda pegado a la pregunta, y hoy no avisa.** El cuerpo de la sección no es una pila (`row-gap: normal`), así que `--_reveal-gap` vale `0px` y la distancia de la pregunta al bloque abierto es 0px (de las opciones del radio a la etiqueta del primer campo del bloque, también 0px), frente a 20px en `GFormLayout`. No hay defecto de accesibilidad (la barra agrupa y la etiqueta se lee), pero rompe el ritmo de 20px. La auditoría lo midió así en el panel «Antecedentes» del playground, que hoy aún coloca la pregunta y el bloque directamente en el cuerpo. **Lima lo resolvió como regla (DECISIONS #283):** los campos de una sección van en un `GFormLayout`, y el cuerpo no se convierte en pila. Quedan pendientes de **bruno** el aviso de desarrollo y mover «Antecedentes» a un `GFormLayout`; de **coco**, ajustar `auditoria-verificar.mjs` a la nueva separación. Hasta entonces, sigue la regla y usa el `GFormLayout`.
- **Muchos bloques a la vez:** 40 bloques con 20 anidados abiertos o cerrados en la misma tarea se asientan en 240 a 330ms y quedan en su estado; el cuadro del cambio dura **59 a 81ms** (medido en motores sin pantalla). Un formulario real abre uno o dos. Pendiente de bruno perfilar de dónde viene ese cuadro; no bloquea.
- **`GDialog`:** en un diálogo centrado, el disparador sube al abrir un bloque (kiwi midió 120px con un bloque de 240px, y 240px en la hoja de 375px), porque el diálogo crece desde el centro. Es un problema de `GDialog`, no del bloque, y queda para su propia ronda (DECISIONS #281): un diálogo abierto crecería hacia abajo. No se verificó el componente real dentro de un `GDialog`.
- **Si envías tu modelo, filtra tú** (ver [la receta](#receta-enviar-tu-modelo-no-el-formdata)): Grana no limpia los valores de bloques cerrados.
- **Un campo común a varias ramas va una vez, fuera de los bloques**; repetir un `name` entre ramas es un error de uso.
- **Sin verificar:**
  - un **lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): qué se oye al elegir «Sí», qué se oye al tabular al bloque, y cómo se anuncia el `fieldset role="none"` sin grupo;
  - **Safari, iOS y un dispositivo táctil reales**;
  - **`forced-colors` real** de Windows (solo emulado en Chromium; en Firefox y WebKit no se emula);
  - el **zoom real** del navegador al 200 %;
  - **rendimiento con pantalla real** (las cifras de muchos bloques son de motores sin pantalla);
  - un `GBtn` dentro de un bloque del playground (no hay ninguno; el «salto a gris» al cerrar solo está medido en el banco de coco con el `GBtn` real de `dist/`).

## Verificación

- **Pruebas** (`GFormReveal.test.js`, vitest con jsdom): 33 pruebas de estructura (raíz sin rol, `fieldset role="none"` único hijo, sin `<legend>`), `inert` y `disabled` con `when`, valores conservados al reabrir, `FormData` (también los `<input hidden>` de `GSelect` y `GDatePicker`), anidados, fases (`is-ready`, `is-animating` con `transitionend` y con el temporizador de respaldo), `--_reveal-gap` (px, `0px` con `normal`, `ResizeObserver` compartido), sub-contexto de distribución, foco al cerrar, avisos, render de servidor y el registro inactivo de `GForm` (envío, `invalid`, resumen e instantánea, `showErrors()`, `focusFirstError()`, anidados, `GFieldGroup`, `GCheckboxGroup`, `GInputGroup`, `GRadioGroup` y un campo propio, fuera de `GForm`). La suite completa de `@grana/vue` pasó 1704/1704 al cierre de la auditoría.
- **Navegador** (Playwright en Chromium, Firefox y WebKit, sobre el componente real del playground): `form-reveal.spec.mjs` (carga sin transiciones; cerrado sin hueco y fuera de `FormData`, `:invalid` y Tab; Δ 0px en LTR y RTL; fases intermedias pausadas; interrupción; conservación; foco; ciclo resumen → «No» → envío → reabrir; `showErrors()`; movimiento reducido; 320px) junto con `form-distribution.spec.mjs`: 48 pasan y 6 se omiten por diseño (puntero grueso y colores forzados solo se emulan en Chromium).
- **Auditoría de coco** con el componente real y temas distintos: `node design/lab/form-reveal/auditoria-verificar.mjs`, **1857/1857** comprobaciones en los tres motores, consola limpia; el banco de estilo (`estilo-verificar.mjs`), 379/379. Detalle en [`design/lab/form-reveal/auditoria.md`](../../../../../design/lab/form-reveal/auditoria.md).

## Fuentes

- API: [`GFormReveal.meta.json`](./GFormReveal.meta.json) · Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md), §14 «`GFormReveal`: bloque condicional» y §2 «Registro inactivo» · Prototipo: [`design/lab/form-reveal/r01/`](../../../../../design/lab/form-reveal/r01/) · Estilo: [`design/lab/form-reveal/estilo.md`](../../../../../design/lab/form-reveal/estilo.md) · Auditoría: [`design/lab/form-reveal/auditoria.md`](../../../../../design/lab/form-reveal/auditoria.md)
- Decisiones en `DECISIONS.md`: #274 (API mínima), #275 (estructura y semántica), #276 (registro inactivo), #277 (sin `inactive` en `submit`), #278 (transición y pila), #279 (avisos), #280 (`--g-duration-slow`, barra y sangría sin tokens propios), #281 (`GDialog` crece hacia abajo; ronda propia), #282 (`GRadioGroup` con `dir="auto"` en la etiqueta) y #283 (el cuerpo de `GFormSection` no es una pila; límite del Δ 0px)
- Sistema de formularios: [`GForm/README.md`](../GForm/README.md)
