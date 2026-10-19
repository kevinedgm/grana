# GFormFold

Pliegue para crear lo que falta en su sitio: un formulario propio que se abre debajo del campo que lo pide, con su título, su propósito y su propio confirmar. Sus campos no viajan en el envío de fuera; abierto, bloquea ese envío con el mensaje de `labels.pending`.

**Etiqueta:** `<g-form-fold>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/form-fold/auditoria.md`](../../../../../design/lab/form-fold/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio. Exige Vue `^3.5.0`.

> **Dentro de un `GDialog` con pasos.** `GFormFold` vive dentro de un `GDialogStep` (o directamente en un `GDialog`): es el contenedor del formulario de cada paso. Usarlo fuera de ese contexto es válido, pero su caso principal es completar un dato —crear una opción que no está en el catálogo— sin salir del formulario que se llena.

## En esta página

[§ Uso](#uso) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Teclado y foco](#teclado-y-foco) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import GranaFormFold from '@grana/vue/form-fold'
import '@grana/vue/style.css'

createApp(App).use(Grana).use(GranaFormFold).mount('#app')
```

```vue
<!-- Fragmento: `categorias` es de tu aplicación -->
<script setup>
import { ref, computed } from 'vue'

const categoria = ref('')
const nuevaCategoria = ref('')
const abierto = ref(false)
const errores = computed(() => ({
  nuevaCategoria: nuevaCategoria.value.trim() ? '' : 'Escribe el nombre de la categoría'
}))
const textos = { pending: 'Termina o cancela «{title}» antes de enviar.' }
</script>

<template>
  <g-form id="producto" aria-label="Producto" :errors="{}" :labels="{ optional: '(opcional)' }">
    <g-form-layout>
      <g-select
        v-model="categoria"
        label="Categoría"
        name="categoria"
        :options="categorias"
        create-label="Crear categoría…"
        @create="abierto = true"
      />
      <g-form-fold
        v-model:open="abierto"
        title="Categoría nueva"
        description="Se elegirá en el campo Categoría."
        :errors="errores"
        :labels="textos"
        :for="'categoria'"
        @confirm="({ close }) => { categoria = nuevaCategoria; close({ announce: 'Categoría creada.' }) }"
      >
        <g-form-layout>
          <g-input v-model="nuevaCategoria" label="Nombre" name="nuevaCategoria" required />
        </g-form-layout>
        <template #actions="{ confirm, cancel }">
          <g-btn variant="outline" type="button" @click="cancel()">Cancelar</g-btn>
          <g-btn type="button" @click="confirm()">Crear categoría</g-btn>
        </template>
      </g-form-fold>
    </g-form-layout>
  </g-form>
</template>
```

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-form-fold ...></g-form-fold>`: Vue no admite etiquetas de componente autocerradas.

## Ejemplos

### e1 · Crear lo que falta sin salir del formulario

```vue demo
<script setup>
import { ref, computed } from 'vue'
const nueva = ref('')
const abierto = ref(false)
const categoria = ref('')
const opciones = ref([
  { value: 'medicamento', label: 'Medicamento' },
  { value: 'insumo',      label: 'Insumo médico' },
])
const errores = computed(() => ({
  nueva: nueva.value.trim() ? '' : 'Escribe el nombre de la categoría'
}))
const textos = { pending: 'Termina o cancela «{title}» antes de enviar el producto.' }
</script>
<template>
  <g-form id="e1-form" aria-label="Producto" :errors="{}" :labels="{ optional: '(opcional)' }">
    <g-form-layout>
      <g-select
        v-model="categoria"
        label="Categoría"
        name="categoria"
        :options="opciones"
      />
      <g-btn variant="ghost" size="sm" type="button" @click="abierto = true">
        + Crear categoría
      </g-btn>
      <g-form-fold
        v-model:open="abierto"
        title="Categoría nueva"
        description="Se asignará al campo Categoría al crear."
        :errors="errores"
        :labels="textos"
        for="categoria"
        @confirm="({ close }) => { opciones.push({ value: nueva.toLowerCase(), label: nueva }); categoria = nueva.toLowerCase(); close({ announce: 'Categoría «' + nueva + '» creada.' }) }"
        @cancel="() => { nueva = ''; abierto = false }"
      >
        <g-form-layout>
          <g-input v-model="nueva" label="Nombre" name="nueva" required />
        </g-form-layout>
        <template #actions="{ confirm, cancel }">
          <g-btn variant="outline" type="button" @click="cancel()">Cancelar</g-btn>
          <g-btn type="button" @click="confirm()">Crear</g-btn>
        </template>
      </g-form-fold>
    </g-form-layout>
  </g-form>
</template>
```

El `GFormFold` se abre desde el botón «Crear categoría» que está junto al `GSelect`. Al confirmar, el nuevo valor se añade a las opciones y se selecciona en el campo. Úsalo cuando la opción puede no existir en el catálogo y crearla no requiere salir de la página ni perder lo que ya se llena.

### e2 · Pliegues anidados: contacto que agrega una dirección

```vue
<!-- Fragmento: `abiertoContacto`, `abiertoDir`, `erroresContacto`, `erroresDir`, `guardarContacto`, `guardarDireccion`, `nombre`, `calle` y `ciudad` son de tu aplicación -->
<!--
  Un GFormFold dentro de otro: al crear un contacto se puede crear
  la dirección al mismo tiempo, sin diálogos separados.
  El segundo pliegue sana con un raíl de mayor profundidad.
-->
<g-form-fold
  v-model:open="abiertoContacto"
  title="Contacto nuevo"
  description="Se añadirá a la lista de contactos."
  :errors="erroresContacto"
  :labels="{ pending: 'Termina o cancela «{title}» antes de enviar.' }"
  @confirm="guardarContacto"
>
  <g-form-layout>
    <g-input v-model="nombre" label="Nombre" name="nombre" required />
    <g-btn variant="ghost" size="sm" type="button" @click="abiertoDir = true">
      + Agregar dirección
    </g-btn>
    <g-form-fold
      v-model:open="abiertoDir"
      title="Dirección"
      description="Se asignará al contacto."
      :errors="erroresDir"
      :labels="{ pending: 'Termina o cancela «{title}» antes de confirmar el contacto.' }"
      @confirm="guardarDireccion"
    >
      <g-form-layout>
        <g-input v-model="calle" label="Calle y número" name="calle" required />
        <g-input v-model="ciudad" label="Ciudad" name="ciudad" required />
      </g-form-layout>
      <template #actions="{ confirm, cancel }">
        <g-btn variant="outline" type="button" @click="cancel()">Cancelar</g-btn>
        <g-btn type="button" @click="confirm()">Agregar dirección</g-btn>
      </template>
    </g-form-fold>
  </g-form-layout>
  <template #actions="{ confirm, cancel }">
    <g-btn variant="outline" type="button" @click="cancel()">Cancelar</g-btn>
    <g-btn type="button" @click="confirm()">Crear contacto</g-btn>
  </template>
</g-form-fold>
```

Cada nivel de anidado añade un raíl de acento y una sangría. El límite recomendado es tres niveles: con más, aviso en desarrollo. La profundidad se propaga por contexto; no la calcules a mano.

### e3 · Confirmar con Enter en un campo de texto

En un `GFormFold` con un solo campo de texto de una línea, pulsar Enter en ese campo llama a `confirm()` sin enviar el formulario exterior. No hace falta un botón de confirmación para flujos de creación rápida, aunque sigue siendo necesario el slot `actions` con el botón de cancelar.

```vue
<!-- Fragmento: `abierto`, `errores`, `etiquetas` y `nueva` son de tu aplicación -->
<!-- El Enter en el input llama confirm(); sin textarea, sin composición activa -->
<g-form-fold
  v-model:open="abierto"
  title="Etiqueta nueva"
  description="Se añadirá al conjunto de etiquetas."
  :errors="errores"
  :labels="{ pending: 'Termina o cancela «{title}» antes de enviar.' }"
  @confirm="({ close }) => { etiquetas.push(nueva); close({ announce: 'Etiqueta «' + nueva + '» añadida.' }) }"
>
  <g-form-layout>
    <g-input v-model="nueva" label="Nombre" name="nueva" required />
  </g-form-layout>
  <template #actions="{ confirm, cancel }">
    <g-btn variant="outline" type="button" @click="cancel()">Cancelar</g-btn>
    <g-btn type="button" @click="confirm()">Añadir</g-btn>
  </template>
</g-form-fold>
```

## Props

| Prop | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `open` | `Boolean` | `false` | `v-model:open`. Lo pone a `true` la aplicación (normalmente en el `create` del campo); el pliegue emite `update:open(false)` al cancelar o al cerrar con resultado. Cerrar desde fuera no mueve el foco salvo que estuviera dentro |
| `title` | `String` | — | Nombre del pliegue y de su error pendiente. Sin él, aviso en desarrollo |
| `description` | `String` | — | Propósito: adónde va el resultado del pliegue |
| `headingLevel` | `Number` (2–6) | — | Sin valor: el del pliegue padre + 1; si no hay, el `headingLevel` del `GForm` de fuera; si no, `3` (máximo 6) |
| `for` | `String` | — | `id` del control que recibe el valor: destino por defecto del foco y de la llegada al cerrar con resultado, y el de vuelta si `from` no sirve |
| `from` | `String \| HTMLElement` | — | El disparador (id o elemento). Sin él, `document.activeElement` al abrir si está fuera del pliegue y no es `body` |
| `errors` | `Object` | `{}` | Errores del pliegue, `name → mensaje` (misma semántica que `GForm`; el pliegue no valida) |
| `warnings` | `Object` | `{}` | Advertencias del pliegue, como `GForm` |
| `labels` | `Object` | `{}` | `{ pending }`: texto del error que bloquea el envío de fuera mientras el pliegue está abierto. Acepta `String` con `{title}` o `Function(title) => String`. Obligatorio si el pliegue puede estar abierto dentro de un `GForm` o de otro pliegue |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:open` | `Boolean` | Al cancelar o al cerrar con resultado (siempre `false`) |
| `confirm` | `{ close(options) }` | Se pidió confirmar (`confirm()` o Enter en un campo de texto de una línea del pliegue) y no hay errores que bloqueen. La aplicación llama a `close(options)` cuando ha procesado el resultado |
| `invalid` | `{ errors: [{ name, message, id }] }` | Se pidió confirmar con errores: los revela, marca `is-rejected` en los campos y enfoca el primero |
| `cancel` | `{ reason: 'escape' \| 'cancel' }` | Escape con el foco dentro o `cancel()` |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `default` | `{ confirm, close, cancel }` | Campos del pliegue en una pila (`GFormRow`, `GFieldGroup`, `GInputGroup` y otros `GFormFold`). Nunca `GFormSection` ni `GForm` |
| `actions` | `{ confirm, close, cancel }` | Botones del pliegue (`type="button"`): al menos Cancelar con `cancel()` y Crear con `confirm()`. Obligatorio (aviso si falta) |

## Métodos expuestos

| Método | Qué hace |
| --- | --- |
| `confirm()` | Revela los campos del pliegue y emite `confirm` o `invalid` |
| `close(options)` | Cierra con resultado: foco a `options.focus` → `for` → `from`, llegada (`data-g-landed`) y anuncio en el canal de página si `options.announce` |
| `cancel()` | Cierra sin resultado: emite `cancel` con `reason: 'cancel'` y `update:open(false)`; foco a `from` → `for` |

## Teclado y foco

| Tecla | Efecto |
| --- | --- |
| Enter | En un campo de texto de una línea del pliegue (no `textarea`, no con composición activa, no si ya está `defaultPrevented`): llama a `confirm()` sin enviar el `<form>` exterior |
| Escape | Con el foco dentro: recoge solo este pliegue (`cancel`, `reason: 'escape'`) y consume el evento. `event.repeat` se ignora |

**Al abrir:** el foco va al primer control del pliegue (orden de `#292` dentro del pliegue, con `preventScroll`); al asentarse, `scrollIntoView block: 'nearest'`.

**Al cerrar con resultado (`close`):** foco a `options.focus` → `for` → `from` → primer control del contenedor.

**Al cancelar o Escape:** foco a `from` → `for` → primer control del contenedor.

**Cerrado desde fuera con el foco dentro:** foco a `from` → `for`.

## Accesibilidad

a. Raíz con `role="group"` y `aria-labelledby` apuntando al título; `aria-describedby` a la descripción. El lector de pantalla anuncia el nombre del grupo al entrar con Tab (prueba: 22/22 en vitest, nivel `prueba`).

b. Cerrado y asentado: `[hidden]`, sin rol y sin contenido accesible. Los campos dentro quedan fuera de `FormData` y del resumen de errores del `GForm` exterior.

c. `fieldset[disabled]` en el cuerpo mientras el pliegue está cerrado o cerrándose: los campos no son enfocables ni interactivos.

d. Abierto dentro de un `GForm`, el pliegue se registra como un campo con `ownError = labels.pending`: mientras está abierto, el botón de envío del formulario exterior aparece bloqueado y el resumen de errores incluye el nombre del pliegue. El error desaparece al cerrar.

e. La llegada (`data-g-landed`) en el control destino al cerrar con resultado permite a lectores de pantalla anunciar el cambio de valor (el componente de destino lo lee; ver la receta de `GSelect`/`GCombobox`).

f. Contraste del título: `--g-color-text` sobre `--g-color-surface`, mínimo 4.5:1 en el tema por defecto (nivel `manual`, 2026-10-14). Contraste de la descripción: `--g-color-text-muted`, mínimo 4.5:1 (nivel `manual`, 2026-10-14).

> **Peligro.** Omitir el slot `actions` deja el pliegue sin botón de cancelar: el usuario solo puede cerrarlo con Escape o desde fuera. Cualquier pliegue abierto debe tener al menos un botón de cancelar en el slot `actions` (`type="button"`, no `type="submit"`). Aviso en desarrollo si falta el slot.

## Personalidad

El raíl de acento nace bajo el campo que abrió el pliegue y se tiende hacia abajo mientras el pliegue se abre; el contenido se funde al final del deslizamiento. Los pliegues anidados forman hilos paralelos que señalan la profundidad de lo que se está creando.

Con `prefers-reduced-motion: reduce`, el deslizamiento desaparece y solo queda el fundido.

## Verificación

- **Pruebas de Playwright:** `design/lab/theme-playground/tests/form-fold.spec.mjs` (7 casos: el recorrido de tres pliegues anidados, Esc y Esc mantenida, el fondo, confirmar con error y con resultado, 375px, RTL y movimiento reducido) más un pliegue abierto en `form-distribution.spec.mjs`. Nivel `medido`: 7/7 en Chromium, Firefox y WebKit (reejecutado por mora-docs el 2026-10-18, `design/lab/limitaciones/revision.md`) y 17/17 en WebKit junto con `dialog-levels.spec.mjs` (auditoría de los niveles de `GDialog`, [`auditoria-pasos.md`](../../../../../design/lab/dialog/auditoria-pasos.md)).

- **Lector de pantalla en entorno real** no verificado: `role="group"` con nombre al recibir el foco, anuncio tras la llegada, cambio de valor en el destino.

- **Táctil y zoom al 200 %** no verificados en dispositivo real.

- **`letter-spacing` de la descripción (cerrado 2026-10-18, coco):** `.g-form-fold__description` lleva `letter-spacing: var(--g-text-body-sm-tracking)`; valor calculado correcto en los tres motores (sin cambio a la vista: ya se heredaba).

- **Pendientes abiertos:** ninguno propio de este componente (los generales, en [`PENDIENTES.md`](../../../../../PENDIENTES.md)).

## Fuentes

- Contrato: [`design/contracts/form.md` §15](../../../../../design/contracts/form.md)
- Decisiones: #580–#591 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- API: [`GFormFold.meta.json`](GFormFold.meta.json)
- Auditoría de coco: [`design/lab/form-fold/auditoria.md`](../../../../../design/lab/form-fold/auditoria.md)
- Pruebas: [`GFormFold.test.js`](GFormFold.test.js) (22 pruebas, nivel `prueba`)
