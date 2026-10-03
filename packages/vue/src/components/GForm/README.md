# Sistema de formularios (`GForm`, `GFormSection`, `GFormLayout`, `GFormRow`, `GInputGroup`, `GFieldGroup`, `GFormActions`, `GErrorSummary`)

Capa de **composición** sobre los campos de Grana (`GInput`, `GTextarea`, `GSelect`, `GDatePicker`, `GCheckbox`, `GCheckboxGroup`, `GSwitch`): distribuye los campos en filas que **siempre llenan el ancho**, alinea sus cajas, fusiona datos de varias partes en un solo campo, decide **cuándo** se ven los errores, los resume y mantiene el pie de acciones a la vista sin tapar el foco.

**Grana no valida ni guarda.** Las reglas son de tu aplicación (una librería de validación o funciones propias): `GForm` recibe los mensajes **ya calculados** en `errors` (`name → mensaje`) y decide cuándo enseñarlos. Un error del servidor entra por el mismo camino.

Este es el README principal del sistema. Cada pieza tiene un README breve que remite aquí.

**Etiquetas:** `<g-form>`, `<g-form-section>`, `<g-form-layout>`, `<g-form-row>`, `<g-input-group>` (+ `<g-input-group-input>`, `<g-input-group-select>`, `<g-input-group-text>`), `<g-field-group>`, `<g-form-actions>`, `<g-error-summary>` · **Estado:** `candidate` (revisión r02; auditoría de coco aprobada, ver [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (playground en `packages/vue/playground/`, sección «Formularios (GForm)», con un banco de anchos, mensajes, etiquetas largas y densidad).

## Uso

```vue
<script setup>
import { reactive, computed } from 'vue'
const m = reactive({ nombre: '', apellido: '', correo: '', lada: '+52', tel: '', ext: '' })
// Las reglas son de la aplicación: Grana solo enseña los mensajes
const errores = computed(() => ({
  nombre: m.nombre.trim() ? '' : 'Escribe tu nombre',
  correo: /.+@.+\..+/.test(m.correo) ? '' : 'Escribe el correo con el formato nombre@dominio.com',
  'tel-numero': /^\d{10}$/.test(m.tel) ? '' : 'Escribe el teléfono a 10 dígitos, sin el código de país'
}))
const textos = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }
const ladas = [{ value: '+52', label: 'MX +52' }, { value: '+1', label: 'US +1' }]
</script>

<template>
  <GForm aria-label="Contacto" :errors="errores" :labels="textos" @submit="guardar" @invalid="avisar">
    <GFormLayout>
      <GFormRow>
        <GInput v-model="m.nombre" label="Nombre" name="nombre" required autocomplete="given-name" />
        <GInput v-model="m.apellido" label="Apellido" name="apellido" required autocomplete="family-name" />
      </GFormRow>
      <GFormRow>
        <GInput v-model="m.correo" label="Correo" name="correo" type="email" required autocomplete="email" />
        <GInputGroup label="Teléfono" name="telefono" required style="--g-form-min: 50">
          <GInputGroupSelect v-model="m.lada" name="tel-pais" part-label="Código de país" :options="ladas" autocomplete="tel-country-code" />
          <GInputGroupInput v-model="m.tel" name="tel-numero" principal type="tel" autocomplete="tel-national" placeholder="951 123 4567" />
        </GInputGroup>
        <GInput v-model="m.ext" class="g-form-w-xs" label="Extensión" name="tel-ext" inputmode="numeric" autocomplete="tel-extension" />
      </GFormRow>
      <GTextarea label="Comentarios" name="comentarios" />
    </GFormLayout>
    <GFormActions><GBtn type="submit">Enviar</GBtn></GFormActions>
  </GForm>
</template>
```

- `@submit` recibe `{ event, data: FormData, submitter, novalidate }` solo si no hay errores que bloqueen; `@invalid` recibe `{ event, errors: [{ name, message, id }] }`. `GForm` **siempre** cancela el envío nativo (sin `action`, sin navegación).
- Los textos no tienen valor por defecto (Grana es internacional): todo va en `labels`.

> **En plantillas dentro del HTML** (sin compilar) escribe las etiquetas con cierre: `<g-form-row></g-form-row>`.

## Guía de distribución

### Filas explícitas y pesos

`GFormLayout` es una **pila de filas**: cada hijo directo ocupa el ancho entero. `GFormRow` agrupa **los campos que van juntos** (Nombre · Apellido; Calle · Ext. · Int.; los signos vitales). Qué va junto lo decides tú; nada se empaqueta solo.

Dentro de una fila cada campo lleva un **tamaño**, que es un **peso** (cuánto de la fila le toca) y un **mínimo** (cuándo la fila deja de caber en una línea):

| Clase en el campo | Peso | Mínimo (`space` 4) | Para |
| --- | --- | --- | --- |
| `g-form-w-xs` | 2 | `space × 20` (80px) | edad, %, núm. interior, extensión, frecuencia |
| `g-form-w-sm` | 3 | `space × 32` (128px) | fecha, CP, RFC, temperatura con unidad |
| `g-form-w-md` (por defecto, sin clase) | 4 | `space × 40` (160px) | nombre, apellido, correo, ciudad, teléfono |
| `g-form-w-lg` | 8 | `space × 60` (240px) | calle, razón social |

**Cada línea reparte todo su ancho por pesos**: Calle · Ext. · Int. = 8 : 2 : 2, RFC · Razón social = 3 : 8. No hay anchos absolutos que dejen hueco a la derecha: **todas las filas terminan en el mismo borde**. Pesos y mínimos no son tokens: escalan con `space` (con `--g-space-1: 5px` el mínimo de `md` es 200px).

**Mínimo propio:** un fusionado necesita sitio para todas sus partes. Dale un mínimo mayor con `style="--g-form-min: N"` (número en múltiplos de `space`; mínimo efectivo = el mayor entre el de su tamaño y el propio). Valores de referencia medidos: teléfono `50`, presión arterial `38`, moneda + importe y serie + folio `38`, rango `43`, fecha con edad calculada `44`.

### Adaptación por ancho

Cada `GFormRow` mide **su propio ancho** (no el de la ventana). Si en una línea algún campo recibiría menos que su mínimo, la fila se parte en **líneas contiguas en orden del DOM**: las menos posibles y, entre ellas, la más holgada. Cada línea vuelve a llenar el ancho. Medido en el playground:

| Fila | 1280 / 960 | 720 | 360 |
| --- | --- | --- | --- |
| Signos vitales (Temperatura · Presión · FC · Sat. · Peso · Estatura) | 1 línea | 2 (Temperatura · Presión / FC · Sat. · Peso · Estatura) | 3 |
| Calle · Ext. · Int. | 1 línea | 1 línea | Calle sola; Ext. · Int. juntos |
| Nombre · Apellido | 1 línea | 1 línea | apilados a 360, juntos a 375 |

- **`keep`** en una `GFormRow` (o en un `GFieldGroup`): la fila **nunca** se parte; si no caben los mínimos, ceden (Día · Mes · Año).
- **`stack`** en `GFormLayout` (drawers, columnas estrechas): toda fila interior pone un campo por línea, salvo las que llevan `keep`.
- Antes de medir, en SSR o sin `ResizeObserver`: un campo por línea (nunca desborda).

### Campo suelto a ancho completo

Un campo fuera de una `GFormRow` es una fila de uno y **ocupa el ancho entero**, también uno compacto (`xs`/`sm`). Si un campo corto queda solo y se ve demasiado ancho, **agrúpalo** con lo que lo acompaña (CP con Colonia y Ciudad; Temperatura con los demás signos). Un aviso de desarrollo lo sugiere.

### Alineación: tres pistas por línea

Cada línea de una fila tiene tres pistas compartidas: **etiqueta · caja · pie** (ayuda y mensaje). La etiqueta se apoya **abajo**: una corta queda pegada a su caja aunque la vecina ocupe dos líneas, y **nunca se recorta** (se parte). Así **ninguna etiqueta, ayuda o mensaje baja la caja de un vecino**. Guía de contenido: etiquetas cortas en filas compartidas; la explicación va en la ayuda.

**Qué puede compartir línea:** `GInput`, `GTextarea`, `GSelect`, `GDatePicker` (modo campo) y `GInputGroup`, más campos propios con la misma estructura (ver `useFormField`). **Van en su propia fila** (hijos directos de `GFormLayout`): `GFieldGroup`, `GCheckboxGroup`, `GCheckbox` y `GSwitch` sueltos, `GDatePicker` `inline` o `split`. Ponerlos en una fila con más campos avisa.

### Cuándo agrupar, fusionar o separar

| Necesidad | Usa |
| --- | --- |
| Campos distintos que van juntos | `GFormRow` |
| **Un dato en varias partes que se lee como uno** (teléfono, valor + unidad elegible, moneda + importe, serie + folio, rango) | **`GInputGroup`**: una caja, una etiqueta, un mensaje |
| Una unidad o símbolo **fijo** (`kg`, `%`, `$`) | `GInput` con `suffix`/`prefix` |
| **Una pregunta compuesta cuyas partes necesitan su propia etiqueta** (contacto de emergencia; fecha en Día · Mes · Año) | **`GFieldGroup`**, siempre en su propia fila |
| Un dato **calculado** a partir de otro (la edad desde la fecha) | Prop **`output`** del campo del que depende |
| Varias ideas en una página | Una `GFormSection` por idea |

## Campos fusionados (`GInputGroup`)

Una caja con varias **partes**: `GInputGroupInput` (texto), `GInputGroupSelect` (**`<select>` nativo**, para que el navegador pueda autocompletarlo) y `GInputGroupText` (texto fijo: «/», «a», «mmHg», «años»). Cada parte tiene **su foco** (un anillo por parte, dentro de la caja) y **su nombre accesible** = etiqueta + nombre de la parte («Teléfono Código de país»). La parte `principal` recibe el `<label for>`.

```vue
<!-- Teléfono: país + número; la extensión es otro campo de la misma fila -->
<GInputGroup label="Teléfono" name="telefono" required style="--g-form-min: 50">
  <GInputGroupSelect v-model="tel.pais" name="tel-pais" part-label="Código de país" :options="paises" autocomplete="tel-country-code" />
  <GInputGroupInput v-model="tel.numero" name="tel-numero" principal type="tel" autocomplete="tel-national" />
</GInputGroup>

<!-- Valor + unidad elegible -->
<GInputGroup class="g-form-w-sm" label="Temperatura" name="temp" required>
  <GInputGroupInput v-model="v.temp" name="temp" principal inputmode="decimal" placeholder="36.5" />
  <GInputGroupSelect v-model="v.unidad" name="temp-unidad" part-label="Unidad" :options="[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]" />
</GInputGroup>

<!-- Moneda + importe (solo estructura: el formato de moneda es de otra ronda) -->
<GInputGroup class="g-form-w-sm" label="Copago" name="copago" style="--g-form-min: 38">
  <GInputGroupSelect v-model="pago.moneda" name="moneda" part-label="Moneda" :options="[{ value: 'MXN', label: 'MXN' }, { value: 'USD', label: 'USD' }]" />
  <GInputGroupInput v-model="pago.importe" name="importe" principal inputmode="decimal" placeholder="0.00" />
</GInputGroup>

<!-- Serie + folio: `chars` fija el ancho de una parte en caracteres -->
<GInputGroup class="g-form-w-sm" label="Folio de factura" name="folio" style="--g-form-min: 38">
  <GInputGroupInput name="serie" part-label="Serie" :chars="3" placeholder="A" />
  <GInputGroupInput name="folio-num" principal inputmode="numeric" />
</GInputGroup>

<!-- Rango y presión: textos fijos entre partes -->
<GInputGroup class="g-form-w-sm" label="Rango de edad" name="rango" style="--g-form-min: 43">
  <GInputGroupInput name="edad-desde" principal part-label="desde" inputmode="numeric" />
  <GInputGroupText text="a" decorative />
  <GInputGroupInput name="edad-hasta" part-label="hasta" inputmode="numeric" />
  <GInputGroupText text="años" />
</GInputGroup>
<GInputGroup class="g-form-w-sm" label="Presión arterial" name="presion" style="--g-form-min: 38">
  <GInputGroupInput name="pa-sistolica" principal part-label="sistólica" inputmode="numeric" placeholder="120" />
  <GInputGroupText text="/" decorative />
  <GInputGroupInput name="pa-diastolica" part-label="diastólica" inputmode="numeric" placeholder="80" />
  <GInputGroupText text="mmHg" label="milímetros de mercurio" />
</GInputGroup>
```

- **Textos:** `decorative` («/», «a» entre partes ya nombradas) no se lee; con `label` se lee la expansión («milímetros de mercurio»); sin ninguno se lee el texto visible. Pulsar un texto enfoca la parte vecina.
- **Un mensaje para todo el campo**; la parte que falla lleva `aria-invalid` y una **marca propia** (un subrayado bajo su valor, además del borde de error de la caja), así se ve **qué** corregir sin depender del color. Escribe el mensaje diciendo la parte («Elige el código de país»). Con un error **del grupo** (`errors[name]` del grupo) se marcan todas las partes.
- `required` en el grupo pone una sola marca en la etiqueta y `required` en cada parte (una parte puede decir `:required="false"`).
- Cada parte envía su `name`; el grupo no tiene valor propio.
- **Solo lectura:** las partes de texto quedan `readonly`; el selector se pinta como texto (la opción elegida, seleccionable) más un campo oculto con el valor; sin flecha.
- `options` del selector: `value` en el formato que rellena el navegador (`'+52'`) y `label` legible (`'MX +52'`).

## Preguntas compuestas (`GFieldGroup`)

`<fieldset>` + `<legend>`: el grupo nombra la pregunta y cada parte conserva **su etiqueta visible**. Va **siempre en su propia fila**; sus partes forman una `GFormRow` interna (mismos tamaños `g-form-w-*`, mismas tres pistas, separaciones a la mitad: es una sola pregunta).

```vue
<GFieldGroup label="Contacto de emergencia" name="emergencia" hint="A quién llamamos si no podemos localizarte.">
  <GInput label="Nombre" name="emer-nombre" autocomplete="section-emer name" />
  <GInput class="g-form-w-sm" label="Parentesco" name="emer-parentesco" />
  <GInputGroup label="Teléfono" name="emer-telefono" style="--g-form-min: 50">…</GInputGroup>
</GFieldGroup>

<GFieldGroup label="Fecha de la última consulta" name="ultima-consulta" keep hint="Por ejemplo, 27 3 2026">
  <GInput class="g-form-w-xs" label="Día" name="uc-dia" inputmode="numeric" />
  <GInput class="g-form-w-xs" label="Mes" name="uc-mes" inputmode="numeric" />
  <GInput class="g-form-w-sm" label="Año" name="uc-anio" inputmode="numeric" />
</GFieldGroup>
```

Un solo mensaje (el del grupo o el primero de sus partes); las partes inválidas llevan `aria-invalid` y su borde de error. La marca va en la `<legend>`; una parte solo lleva la suya si difiere.

## Valor calculado (`output`)

Un dato que **calcula tu aplicación** a partir de un campo (la edad desde la fecha, el IMC desde el peso) no es un campo: va en la prop **`output`** de `GInput` o `GDatePicker`. Se pinta como `<output>` al final de la caja, con cifras tabulares y separado del valor por una línea fina; se anuncia de forma cortés al cambiar y **no se envía**.

```vue
<GFormRow>
  <GDatePicker v-model="nac" class="g-form-w-sm" style="--g-form-min: 44" label="Fecha de nacimiento" name="nacimiento"
               hint="La edad se calcula sola." :output="edad ? `${edad} años` : ''" required />
  <GSelect label="Sexo" name="sexo" :options="sexos" required />
</GFormRow>
```

No uses un campo `readonly` vacío para un dato derivado. En modo vista o fuera del formulario, es texto (`GDataList`).

## Marcas: «(opcional)» o asterisco

`marks` de `GForm` elige **una** convención para todo el formulario; nunca se mezclan:

- **`optional`** (por defecto): los campos no obligatorios llevan «(opcional)» (`labels.optional`) como **texto dentro de la etiqueta**, que forma parte del nombre accesible («Segundo apellido (opcional)»); los obligatorios no llevan nada. Recomendada cuando la mayoría de campos son obligatorios.
- **`required`**: los obligatorios llevan asterisco (oculto a lectores; lo acompaña `required`) y `GForm` pinta `labels.requiredHint` al principio («Los campos con * son obligatorios.»).

Excepciones: solo llevan marca los campos editables; `GSwitch` nunca; una casilla suelta no lleva «(opcional)»; dentro de una `GFormSection optional` no hay «(opcional)» (lo dice su insignia). `mark: false` en un campo quita su marca.

## Cuándo se ven los errores

«Castigar tarde, premiar pronto». Un error de `errors` se ve cuando el campo está **revelado**:

| Suceso | `showErrorsOn="blur"` (por defecto) | `"submit"` |
| --- | --- | --- |
| Escribir | Si ya estaba revelado, el mensaje se actualiza al escribir (y desaparece en cuanto lo quitas de `errors`) | Igual |
| Salir del campo **tras escribir** | Revela | — |
| Salir sin escribir | Nada (un vacío no se marca al pasar) | — |
| Elegir en `GSelect`, `GDatePicker`, casillas, interruptor, selector de una parte | Revela | — |
| Enviar o `showErrors()` | Revela todos | Revela todos |
| El error se corrige | Se oculta; el siguiente espera al próximo `blur` o envío | Igual |
| `reset` o `resetState()` | Todo sin revelar | Igual |

`warnings` sigue la misma tabla pero **no bloquea** ni entra en el resumen. `valid` (en el campo) premia con un mensaje útil, no con un check gratuito. Un `error` puesto en el campo se ve siempre y cuenta para el bloqueo. Los mensajes revelados por un envío no se anuncian campo a campo (los anuncia el resumen o el foco).

**Errores del servidor:** ponlos en `errors` tras la respuesta (una clave que no es de ningún campo es un error general) y llama a `showErrors()` (`ref` del `GForm`).

## Resumen de errores (`GErrorSummary`)

Dentro de un `GForm`, colócalo al principio. Tras un envío con errores aparece con el título («Hay 3 problemas con el formulario»), **un enlace por pregunta** con el mismo texto que el error en línea, y **recibe el foco**; los errores generales van al final sin enlace. Al corregir, cada elemento sale en silencio; sin elementos, se oculta. Un enlace lleva a su campo (a la parte inválida en un fusionado), con la etiqueta a la vista. Sin resumen, el envío lleva el foco al primer campo inválido.

```vue
<GErrorSummary :labels="{ title: (n) => (n === 1 ? 'Hay 1 problema con el formulario' : `Hay ${n} problemas con el formulario`) }" />
```

`@navigate` es cancelable (por ejemplo, para cambiar de pestaña antes). Fuera de `GForm`, pásale `errors` (`[{ name?, id?, message }]`).

## Pie de acciones y pie fijo (`GFormActions`)

Secundarias antes y **una primaria al final** (`GBtn` `solid`); la región de estado (`status` o slot `status`, `role="status"`) va al inicio. En un ancho propio menor que `space × 104` el pie se **apila**: la primaria sube sola a su línea, a ancho completo, y las demás comparten la línea de debajo si caben (si no, una por línea). En ese apilado el Tab recorre las secundarias y llega a la primaria al final.

```vue
<GFormActions sticky :status="sucio ? 'Cambios sin guardar' : guardadoA">
  <GBtn type="reset" variant="ghost">Restablecer</GBtn>
  <GBtn type="submit" variant="outline" formnovalidate name="intent" value="draft">Guardar borrador</GBtn>
  <GBtn type="submit" name="intent" value="save">Guardar</GBtn>
</GFormActions>
```

- **`sticky`** lo pega al borde inferior del contenedor que se desplaza y **nunca tapa el campo enfocado** (WCAG 2.4.11): mide su altura, `GForm` la publica en `--g-form-actions-size` y desplaza el campo si quedaría debajo. Medido: 0 campos tapados con Tab por el formulario mediano a 1280 y 320px, LTR y RTL, en Chromium, Firefox y WebKit. Alto: 61px; apilado 105px a 360 y 149px a 320 (tres botones que ya no caben dos en una línea).
- `formnovalidate` en un botón de envío («Guardar borrador») envía sin revelar ni comprobar nada: `@submit` llega con `novalidate: true`. Distingue botones por `submitter.name`/`value`.
- **En un `GDialog`**, las acciones van en su slot `footer` con `form="id-del-form"`; puedes envolverlas en un `GFormActions` sin `sticky` para tener jerarquía, estado y apilado.

## Secciones (`GFormSection`)

Una sección por **idea** (Información básica, Contacto, Dirección), separadas por aire (`--g-form-section-gap`, el doble que entre filas) y tipografía, sin tarjetas. Título (`hN` según `headingLevel`), descripción, y slots `actions` y `help`. Con `optional`, una insignia «Opcional» (`labels.sectionOptional` de `GForm`) sustituye a los «(opcional)» de sus campos. Pon un `GFormLayout` dentro. Con `mode="collapsible"` la sección se pliega con el botón de su título (sus datos siguen en el envío y, plegada, dice cuántos errores tiene) y con `mode="addable"` el usuario decide incluirla con «Agregar …»; también admite el encabezado al lado (`headerPlacement="auto"`) y una línea con la sección anterior (`divider`). Guía completa en [`GFormSection`](../GFormSection/README.md).

## Solo lectura y modo vista

`GForm readonly` pone todos los campos en solo lectura (los que no lo fijan ellos): relleno `--g-color-neutral-soft` (en claro un paso por debajo de la superficie, en oscuro un paso **por encima**: nunca un pozo negro), borde **discontinuo** y texto pleno; los valores siguen siendo enfocables y seleccionables, y las marcas desaparecen. Se distingue de deshabilitado (borde continuo, texto tenue, no se envía) sin depender del color. `GForm disabled` deshabilita todos. Para bloquear un formulario ya guardado con un interruptor, ver [Bloqueo con interruptor](#bloqueo-con-interruptor).

## Bloqueo con interruptor

Un formulario de captura **ya guardado** (un expediente, una orden, una ficha) que se abre **bloqueado** para evitar ediciones y envíos por error, y se desbloquea con un interruptor «Permitir edición». No es una vista de consulta. **Es una receta con la API actual, no un componente ni una prop**: no existe `locked` ni `v-model:locked` en `GForm`. `readonly` ya da todo lo que el bloqueo necesita del formulario, y lo demás (la copia guardada, la confirmación, los permisos) es estado de tu aplicación: `GForm` no posee los valores. Ejemplo completo y verificado en [`design/lab/migraciones/analisis/`](../../../../../design/lab/migraciones/analisis/) (`index.html` y `notas.md`).

```vue
<div class="ficha__estado">
  <!-- Fuera del <form> y antes de él: dentro heredaría readonly y su cambio marcaría dirty -->
  <GSwitch id="permitir" label="Permitir edición" :model-value="!bloqueado" @update:model-value="alternar" />
</div>
<GForm id="muestra" aria-label="Información de la muestra" :readonly="bloqueado"
       :errors="bloqueado ? {} : errores" v-model:dirty="sucio" @submit="guardar" ref="form">
  …
  <GFormActions :status="estado">
    <GBtn variant="ghost" type="button" @click="bloqueado ? cerrar() : cancelar()">{{ bloqueado ? 'Cerrar' : 'Cancelar' }}</GBtn>
    <GBtn type="submit" :disabled="bloqueado">Guardar</GBtn>
  </GFormActions>
</GForm>
```

```js
const bloqueado = ref(true)                    // un registro guardado se abre bloqueado
function alternar(v) {                         // controlado: el interruptor no cambia hasta que lo aceptas
  if (v) { bloqueado.value = false; return }   // el foco se queda en el interruptor
  if (sucio.value) return pedirConfirmacion()  // GDialog role="alertdialog": «Seguir editando» / «Descartar cambios»
  bloquear()
}
function bloquear(mensaje) {
  bloqueado.value = true
  form.value.resetState()                      // los errores revelados no se quedan en campos que ya no se pueden corregir
  estado.value = mensaje || ''                 // región `status` del pie, solo para bloqueos causados por otra acción
  nextTick(() => document.getElementById('permitir')?.focus())   // al bloquear por Guardar o Cancelar
}
```

| Regla | Qué hacer | Por qué |
| --- | --- | --- |
| Atributo | `readonly` de `GForm` ligado al bloqueo. **Nunca `disabled`** | Con `readonly` los campos siguen **enfocables, legibles y copiables** y **dentro del envío** (`FormData`). `disabled` los saca del Tab, los atenúa y los excluye del envío y de los errores: un envío por otra vía perdería datos sin aviso |
| Alcance | Todo el `GForm`. Para bloquear solo una parte, pon `readonly` en los campos o en un `GFieldGroup` (la prop explícita gana). `GFormSection` no tiene `readonly` | Una sola fuente del estado, sin props nuevas |
| Interruptor | `GSwitch` **controlado** (`:model-value` + `@update:model-value`), con etiqueta de acción («Permitir edición»; apagado = bloqueado), **fuera del `<form>` y antes de él** en el DOM | Dentro heredaría `readonly` (no podría desbloquear), su `change` marcaría `dirty` y, con `name`, entraría en `FormData`. Antes en el DOM: se encuentra antes de los campos que controla |
| Estado inicial | Registro guardado: bloqueado al abrir (y al reabrir un diálogo). Registro nuevo: editable y normalmente sin interruptor | Lo que se protege es lo ya capturado |
| Foco | Al **desbloquear**, el foco se queda en el interruptor (no salta al primer campo). Al **bloquear por Guardar o Cancelar**, el foco vuelve al interruptor | Cambiar un control no cambia de contexto (WCAG 3.2.2). Tras Guardar o Cancelar el botón se deshabilita o cambia de texto y el foco no puede quedarse en un control deshabilitado (2.4.3) |
| Anuncio | El cambio hecho **con el interruptor** lo anuncia el propio interruptor (`role="switch"`, activado o desactivado): no lo repitas en otra región. El bloqueo causado por **otra acción** (Guardar, Cancelar) va a la región `status` de `GFormActions` o, sin ella, a una región `role="status"` de tu aplicación **dentro** del diálogo. Con un `GToast`, **solo uno** de los dos lleva el texto | Sin dobles anuncios (WCAG 4.1.3) |
| Estado visible | Opcional: un texto junto al interruptor («Formulario bloqueado» / «Edición permitida») con icono `lock` / `lock-open` (`lock-open` lo registras tú con `createIcons`). No es región viva | El aspecto de solo lectura ya lo distingue sin color (borde discontinuo) |
| Marcas y validación | Bloqueado, las marcas y `required` se conservan. **No pases `errors`, `warnings` ni la prop `error` de un campo** mientras esté bloqueado (`:errors="bloqueado ? {} : errores"`) y llama a `resetState()` al bloquear | Un error en un campo que no se puede corregir no es accionable; `GForm` no valida, solo enseña |
| Envío | El botón de envío va **`disabled`** mientras está bloqueado (también en el pie de un `GDialog` con `form="id"`) y tu `submit` ignora el envío si el bloqueo está puesto | `readonly` no impide el envío implícito con Enter; un botón por defecto deshabilitado sí |
| Volver a bloquear | Sin cambios: apagar el interruptor bloquea. Con `dirty`: pide confirmación con un `GDialog role="alertdialog"` y el interruptor sigue encendido hasta confirmar. **Cancelar** es descartar explícito y no confirma. Descartar = restaurar **tu** copia guardada, `resetState()`, bajar `dirty` y bloquear | `GForm` no guarda los valores: no puede revertirlos |
| Guardar | Con éxito, bloquea. Si falla en el servidor, sigue desbloqueado y llamas a `showErrors()` | El usuario no pierde lo que escribió |
| Cerrar con cambios | En un `GDialog`, Esc, la X o «Cerrar» con `dirty`: `@dismiss` + `preventDefault()` y la misma confirmación | El diálogo no puede cerrarse y perder cambios sin avisar |

**Fuera de la receta:** quién ve el interruptor (permisos por rol: tu aplicación lo oculta) y el autoguardado, la guardia `beforeunload` y un `revert()` de valores en `GForm` (Fase 4, si hace falta).

**Verificado:** 3 pruebas en `GForm.test.js` (el interruptor fuera del `<form>` no marca `dirty` ni entra en `FormData`; con `readonly` los valores siguen en `FormData` y los campos enfocables, con envío `disabled` y marca `required` conservada; `resetState()` oculta los errores revelados) y el ejemplo de migración con Playwright, 15/15 en Chromium, Firefox y WebKit (confirmación al volver a bloquear con cambios, foco al interruptor y un solo anuncio). Sin verificar con lector de pantalla real (ver «Limitaciones conocidas»).

## Receta: dirección con autocompletado

```vue
<GFormSection title="Dirección">
  <GFormLayout>
    <GFormRow>
      <GInput class="g-form-w-lg" label="Calle" name="calle" autocomplete="address-line1" required />
      <GInput class="g-form-w-xs" label="Núm. exterior" name="num-ext" required />
      <GInput class="g-form-w-xs" label="Núm. interior" name="num-int" autocomplete="address-line2" />
    </GFormRow>
    <GFormRow>
      <GInput label="Colonia" name="colonia" autocomplete="address-level3" required />
      <GInput class="g-form-w-sm" label="Código postal" name="cp" inputmode="numeric" autocomplete="postal-code" required />
      <GInput label="Ciudad" name="ciudad" autocomplete="address-level2" required />
    </GFormRow>
    <GFormRow>
      <GSelect label="Estado" name="estado" :options="estados" />
      <GInput label="País" name="pais" autocomplete="country-name" />
    </GFormRow>
  </GFormLayout>
</GFormSection>
```

Las partes dependen del país (este es México): adapta las filas, no busques un componente cerrado. `autocomplete` en cada parte (WCAG 1.3.5). La receta del teléfono es el ejemplo de «Uso» (país + número fusionados con `tel-country-code` / `tel-national`, extensión aparte con `tel-extension`); los signos vitales y la fecha con edad, arriba.

## Campos propios: `useFormField`

Los campos de Grana leen el contexto con `useFormField()`, que se exporta para que **tus campos** participen igual (errores por `name`, momento, marcas, resumen y foco):

```js
import { useFormField } from '@grana/vue'
const control = ref(null), root = ref(null)
const f = useFormField({ name: () => props.name, error: () => props.error, required: () => props.required,
                         trigger: 'change', control, root })
// f.id, f.messageId, f.invalid, f.message ({ type, text, prefix } | null), f.mark, f.markText,
// f.readonly, f.disabled, f.density, f.block, f.live ('polite' | 'off'), f.handlers, f.notifyChange()
```

- **Opciones** (valor, `ref` o función): `name`, `id`, `error`, `warning`, `valid`, `required`, `readonly`, `disabled`, `density`, `block`, `mark`, `trigger` (`'blur'` para texto, `'change'` para controles de elección), `control` (lo que enfoca el resumen) y `root` (lo que se desplaza a la vista).
- **Fusiona `handlers` primero** y las escuchas del consumidor después: `mergeProps(f.handlers, propios, attrs)`. Un control sin evento nativo que burbujee llama a `f.notifyChange()` al elegir.
- **Para compartir línea en una `GFormRow`**, la raíz de tu campo tiene **tres hijos**: etiqueta, caja y pie (ayuda + región de mensaje siempre presente), y su CSS los coloca en las pistas (`.g-form-row > .mi-campo { display: grid; grid-template-rows: subgrid }`, etiqueta `align-self: end`).
- `formKey` se exporta para un `provide` manual (pruebas, microfrontends).
- **`useCompositeField`** es **interno** (lo usan `GFieldGroup` y `GInputGroup` para reunir el mensaje de sus partes y registrarse como un solo elemento del resumen); no se exporta ni forma parte de la API.

## API

### `GForm`

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `errors` | Object | `{}` | `{ [name]: String }` calculados por la aplicación; vacío = sin error |
| `warnings` | Object | `{}` | Igual, sin bloquear ni entrar en el resumen |
| `showErrorsOn` | String | `blur` | `blur` · `submit` |
| `marks` | String | `optional` | `optional` · `required` |
| `density` | String | `default` | `default` · `comfortable` · `compact`; la heredan campos, filas, secciones y pie sin densidad propia |
| `readonly` | Boolean | `false` | Modo vista; también el atributo del [bloqueo con interruptor](#bloqueo-con-interruptor) |
| `disabled` | Boolean | `false` | Todos los campos deshabilitados (no se envían). No sirve para bloquear un formulario ya capturado: usa `readonly` |
| `headingLevel` | Number | `3` | Nivel de títulos de secciones y resumen (2 a 6) |
| `dirty` | Boolean | `false` | `v-model:dirty`: sube con la primera interacción; solo `reset` lo baja (tú lo bajas tras guardar) |
| `labels` | Object | `{}` | Ver abajo |

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `submit` | `{ event, data: FormData, submitter, novalidate }` | Envío sin errores que bloqueen, o con un botón `formnovalidate` |
| `invalid` | `{ event, errors: [{ name, message, id }] }` | Envío con errores (orden del DOM; generales al final con `id: null`) |
| `reset` | `{ event }` | `reset` nativo: `GForm` lo cancela, limpia el estado y baja `dirty`; tú restauras el modelo |
| `update:dirty` | Boolean | Primera interacción y `reset` |

| Método (`ref`) | Hace |
| --- | --- |
| `showErrors()` | Revela todos, abre las secciones plegables con un error que bloquea y mueve el foco (resumen o primer inválido) sin emitir `invalid` |
| `focusFirstError()` | Enfoca el primer control con error visible, abriendo antes la sección plegable que lo contiene. Devuelve **`Promise<boolean>`** (`true` si encontró un control): con una sección que abrir, el foco llega tras un `nextTick` |
| `resetState()` | Limpia editados, revelados y `dirty` sin tocar valores |

| `labels` | Dónde | Si falta |
| --- | --- | --- |
| `optional` | «(opcional)» con `marks="optional"` | Aviso; sin marca |
| `requiredHint` | Frase inicial con `marks="required"` | Aviso; sin frase |
| `sectionOptional` | Insignia de `GFormSection optional` | Aviso; sin insignia |
| `sectionErrors` | Estado de errores de una `GFormSection collapsible` plegada: String con `{count}` o Function `(count) => String` | Aviso la primera vez que una plegada tiene errores visibles; sin estado |
| `error` · `warning` · `valid` | Prefijo oculto de cada mensaje («Error: ») | Aviso; sin prefijo |

`id`, `name`, `aria-label`/`aria-labelledby` y `autocomplete` van al `<form>` (siempre `novalidate`); `action` y `method` se ignoran con aviso. Un `GForm` dentro de otro pinta un `div`.

### `GFormLayout`

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `stack` | Boolean | `false` | Un campo por línea en todas las filas interiores, salvo `keep` |
| `density` | String | la de `GForm` | |

Slot por defecto: filas y campos sueltos. No mide nada. Avisa de compactos sueltos, de `g-form-w-*` fuera de una fila, de restos de la Fase 1 (`g-form-break`, `g-form-w-full`, `g-form-part-*`, `div.g-form-row`) y de hijos con `order`.

### `GFormRow`

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `keep` | Boolean | `false` | La fila nunca se parte |
| `density` | String | la del contexto | |

Hijos con `g-form-w-xs|sm|md|lg` y, opcionalmente, `--g-form-min`. Emite `data-lines` (raíz) y `data-line` (hijos) tras medir. Sin rol propio: si una fila necesita nombre, ponle `role="group"` y `aria-label`. Avisa con más de 6 hijos, `order`, dos clases de tamaño o una desconocida, un hijo que va en su propia fila, una fila de un solo compacto y un `--g-form-min` no válido.

### `GInputGroup` y sus partes

| Prop de `GInputGroup` | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `label` | String | | Etiqueta visible (o slot `label`) |
| `hint` | String | | Ayuda (o slot `hint`) |
| `name` | String | | Clave del grupo en `errors`/`warnings` |
| `error` · `warning` · `valid` | String | | Mensajes explícitos |
| `required` | Boolean | `false` | Marca y `required` por defecto de cada parte |
| `mark` | Boolean | | `false` quita la marca |
| `readonly` · `disabled` | Boolean | del contexto | |
| `size` | String | `md` | `xs` · `sm` · `md` · `lg` · `xl` (como `GInput`) |
| `variant` | String | `outline` | `outline` · `soft` |
| `density` | String | del contexto | |
| `block` | Boolean | `true` en un layout | |

| Prop de parte | `Input` | `Select` | `Text` | Qué es |
| --- | --- | --- | --- | --- |
| `modelValue` | sí | sí | | `v-model` (`update:modelValue`) |
| `name` | sí | sí | | Nombre en `FormData` y clave en `errors` |
| `partLabel` | sí | sí | | Nombre de la parte (oculto); obligatorio salvo en la principal |
| `principal` | sí | sí | | Destino de la etiqueta; por defecto la primera parte |
| `required` | sí | sí | | Sin valor: el del grupo |
| `error` | sí | sí | | Error de la parte (se muestra en el pie del grupo) |
| `type` | sí | | | `text` · `tel` · `email` · `url` · `search` |
| `chars` | sí | | | Ancho fijo en caracteres |
| `options` | | sí | | `[{ value, label, disabled? }]` o grupos `{ label, options }` |
| `placeholder` | | sí | | Primera opción vacía (deshabilitada si la parte es obligatoria) |
| `text` · `label` · `decorative` | | | sí | Texto visible, su expansión accesible, o separador sin significado |

`autocomplete`, `inputmode`, `placeholder`, `maxlength`, `pattern` y escuchas llegan al control nativo; `class` y `style` a la parte. Avisa sin etiqueta, con menos de dos partes («usa `GInput` con `prefix`/`suffix`»), con dos principales, una parte sin `partLabel`, un hijo que no es parte, una parte fuera de un grupo, `chars` no entero u `options` repetidas.

### `GFieldGroup`

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `label` | String | | Texto del `<legend>` (o slot `label`) |
| `hint` | String | | Ayuda del grupo (o slot `hint`), tras las partes |
| `name` | String | | Clave del grupo en `errors` |
| `error` · `warning` · `valid` | String | | |
| `required` | Boolean | `false` | Marca de la pregunta |
| `keep` | Boolean | `false` | Las partes nunca se parten |
| `disabled` · `readonly` | Boolean | del contexto | |
| `density` | String | del contexto | |

### `GFormSection`

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `title` | String | | Título (o slot `title`); sin él avisa |
| `description` | String | | (o slot `description`) |
| `headingLevel` | Number | el de `GForm` | 2 a 6 |
| `optional` | Boolean | `false` | Insignia «Opcional» y sin «(opcional)» dentro |

Slots `title`, `description`, `actions` (acciones secundarias de la sección), `help` (`GHelper`) y por defecto. Fase 3: `mode` (`static`·`collapsible`·`addable`), `open` y `added` (`v-model`), `summary` (y slot), `headerPlacement` (`top`·`auto`), `divider` y `labels` (textos de la agregable); props, eventos y slots completos en [`GFormSection/README.md`](../GFormSection/README.md#api).

### `GFormActions`

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `sticky` | Boolean | `false` | Fijo al borde inferior sin tapar el foco |
| `status` | String | | Texto de estado (o slot `status`) |
| `density` | String | la de `GForm` | |

Avisa con más de una primaria, una primaria que no es el último botón y dos pies fijos en un formulario.

### `GErrorSummary`

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `errors` | Array | los del `GForm` | `[{ name?, id?, message }]` fuera de un `GForm` |
| `headingLevel` | Number | el de `GForm` | |
| `labels` | Object | `{}` | `title`: String con `{count}` o `(count) => String` |

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ name, id, event, preventDefault() }` | Antes de llevar al campo; con `preventDefault()` no enfoca ni desplaza |

## Teclado

| Tecla | Dónde | Acción |
| --- | --- | --- |
| **Tab** / **Shift+Tab** | Formulario | Orden del DOM = orden visual en todos los anchos; **una parada por parte** en un fusionado. Excepción acotada: en el pie apilado la primaria (arriba) llega la última |
| **Enter** | Campo de texto | Envía por el botón de envío por defecto (también si está en el pie de un `GDialog` con `form="id"`) |
| **Flechas**, **Alt+↓** | Selector de una parte | Teclado nativo del `<select>` |
| **Enter** | Enlace del resumen | Lleva al campo (o a la parte inválida) con su etiqueta a la vista |
| Clic en la etiqueta / en un texto fijo | `GInputGroup` | Enfoca la parte principal / la parte vecina |

## Accesibilidad

Medido sobre los componentes reales (playground), en Chromium, Firefox y WebKit, con el tema por defecto, Spotify (marca pálida, generado por el CLI), el «Tema de prueba» del playground y un tema con `space` 5, borde 2px y serif, en claro y oscuro (auditoría r02).

- **Distribución (prueba obligatoria):** a 1280/960/720/480/360/320px de contenedor y de ventana, limpio, con ayudas y los tres mensajes, con etiquetas largas y con ambos, en LTR y **RTL**: cada línea termina en el mismo borde (±1px), las cajas de una línea comparten `top` (±1px), sin solapes ni desborde (también a 320), orden visual = DOM, etiquetas sin recortar. 587 comprobaciones de coco y la suite de bruno en verde.
- **Contraste** (mínimo en todos los temas y modos): etiqueta 15.22:1; «(opcional)», ayudas, descripción de sección, estado del pie, sufijo, textos fijos de un fusionado y `chevron-down` 6.99:1; asterisco, mensaje, borde y marca de parte de error 4.52:1; advertencia 4.54:1; válido 4.61:1; insignia «Opcional» 4.56:1; borde de caja en reposo 3.43:1; **anillo de foco por parte** 4.58:1; título del resumen 15.22:1, enlaces 4.52:1. **Solo lectura:** valores 12.53:1, sufijo 5.57:1, borde discontinuo sobre su relleno **3.02:1** (el CLI valida `border-control` ≥ 3:1 sobre `neutral-soft`). La línea entre partes de un fusionado es decorativa (1.40–1.90:1); con `prefers-contrast: more` pasa al borde de control.
- **No solo color:** error con borde doble, advertencia con borde **discontinuo** doble, válido con borde sencillo; icono y prefijo oculto en cada mensaje; parte inválida con su subrayado propio; solo lectura discontinuo frente a deshabilitado continuo.
- **Nombres:** etiqueta visible siempre; «(opcional)» dentro del nombre; cada parte de un fusionado se nombra «etiqueta + parte» (2.5.3) y se describe por sus textos no decorativos, la ayuda y el mensaje; `role="group"` en `GInputGroup`, `fieldset`/`legend` en `GFieldGroup`.
- **Regiones vivas:** mensaje de cada campo (cortés al salir; en silencio tras un envío, que anuncia el resumen con `role="alert"` y foco), estado del pie (`role="status"`), `output` (cortés). Todas existen antes de tener contenido.
- **Tamaños:** con `pointer: coarse` y densidad `compact`, cajas, cajas de fusionado, filas de casilla e interruptor y botones del pie miden **44px**; la parte más estrecha de un fusionado, 49.95px de ancho. Densidades: cajas de 36 / 31.5 / 27px y filas separadas 20 / 17.5 / 15px.
- **Foco no tapado** por el pie fijo (2.4.11) y **foco visible** por parte (2.4.7).
- **Colores forzados** (emulados): anillo en la parte, no en la caja; solo lectura y advertencia discontinuos; error del fusionado con borde de 2px; subrayado de parte inválida y línea entre partes visibles.
- **RTL:** filas, partes, `chevron-down`, sufijos, iconos de mensaje y pie se espejan; mismas garantías de distribución.

## Tema

Tres tokens propios (valores de `defaults.css`, × densidad): `--g-form-gap` (entre filas y entre líneas de una fila partida; 20px), `--g-form-column-gap` (entre campos de una línea; 16px) y `--g-form-section-gap` (entre secciones y antes del pie; 40px). Las partes de un `GFieldGroup` usan la mitad. Consumen además `--g-color-neutral-soft` (solo lectura), `--g-color-{danger|warning|success}-text`, `--g-color-border-control`, `--g-color-border-strong` (línea entre partes), `--g-color-text`, `--g-color-text-muted`, `--g-color-surface`, `--g-color-border`, `--g-color-focus`, `--g-focus-width`, `--g-border-width`, `--g-radius-*`, `--g-space-1`, `--g-font-ui`, `--g-text-*`, `--g-duration-fast` y `--g-ease-standard`.

**No son tokens:** pesos y mínimos de los tamaños, el umbral de apilado del pie (`space × 104`), `--g-form-min` (entrada tuya) y `--g-form-actions-size` (salida de solo lectura en el `<form>`).

## Clases

- **`GForm`:** `g-form`, `--density-*`, `--marks-optional|required`, `--readonly`, `--disabled`, `--sticky-actions`; `g-form__required-hint`.
- **`GFormLayout` / `GFormRow`:** `g-form-layout`, `--stack`, `--density-*`; `g-form-row`, `--keep`, `--density-*`; tamaños `g-form-w-xs|sm|md|lg`.
- **`GInputGroup`:** `g-input-group`, `--size-*`, `--variant-*`, `--density-*`, `--block`, `is-disabled|readonly|invalid|warning|valid`; `__label`, `__optional`, `__required`, `__box`, `__part` (`--input`, `--select`, `--text`, `--chars`; `is-invalid` en la que falla), `__part-name`, `__control`, `__select-icon`, `__text-label`, `__support`, `__hint`, `__message`, `__message-icon`, `__message-type`.
- **`GFieldGroup`:** `g-field-group`, `--density-*`, `is-*`; `__label`, `__optional`, `__required`, `__parts`, `__support`, `__hint`, `__message`.
- **`GFormSection`:** `g-form-section`, `--optional`; `__header`, `__heading`, `__title`, `__description`, `__actions`, `__help`, `__body`.
- **`GFormActions`:** `g-form-actions`, `--sticky`, `--stacked` (y `data-stacked`), `--density-*`; `__status`, `__buttons`.
- **`GErrorSummary`:** `g-error-summary`; `__title`, `__icon`, `__list`, `__link`, `__item`.

## Limitaciones conocidas

- **Sin verificar con lector de pantalla real** (VoiceOver, NVDA, TalkBack): la doble lectura del resumen (`alert` + foco), el silencio de los mensajes tras un envío, «(opcional)» en el nombre, la verbosidad de «Teléfono, grupo; Teléfono Código de país», el anuncio de `output` al escribir la fecha, el orden del pie apilado y, en el bloqueo con interruptor, que el interruptor se anuncie solo y que el aviso del bloqueo por Guardar o Cancelar no se duplique.
- **Sin verificar con teclado virtual** (que el pie fijo no quede tras el teclado en iOS/Android), zoom 200/400 %, `forced-colors` real de Windows (solo emulado), el menú nativo del `<select>` en oscuro ni el autocompletado real del navegador sobre país + número.
- **Fase 2:** [`GRadioGroup`](../GRadioGroup/README.md) (ya existe: también segmentado para Sí/No o Sexo) y `GNumberField` (pendiente); `GSelect` y `GNumberField` como partes de un `GInputGroup`. Moneda con formato, teléfono con formato por país y búsqueda de dirección son rondas propias (Fase 5).
- **Fase 3:** [`GFormReveal`](../GFormReveal/README.md) (campos condicionales) ya existe: un bloque que aparece justo después de la pregunta que lo condiciona y, cerrado, sale del envío, de Tab y de la validación sin perder lo escrito. [`GFormSection`](../GFormSection/README.md) ya es plegable (`collapsible`) y agregable (`addable`). Pendientes: «Agregar…» de varias instancias de una misma sección y la navegación lateral de secciones (`GFormNav`).
- **Fase 4:** autoguardado (`GFormStatus`), guardia de salida con cambios (`beforeunload`), integración documentada con `GDialog`, `GStepper` y `GTabs`, y un posible bloqueo de edición integrado, `revert()` de valores y permisos por rol (hoy, [receta](#bloqueo-con-interruptor): sin prop `locked`).
- Rendimiento con muchas filas (un `ResizeObserver` compartido) y cientos de campos registrados: sin medir.

## Fuentes

- API: [`GForm.meta.json`](./GForm.meta.json), [`GFormSection`](../GFormSection/GFormSection.meta.json), [`GFormLayout`](../GFormLayout/GFormLayout.meta.json), [`GFormRow`](../GFormRow/GFormRow.meta.json), [`GInputGroup`](../GInputGroup/GInputGroup.meta.json), [`GFieldGroup`](../GFieldGroup/GFieldGroup.meta.json), [`GFormActions`](../GFormActions/GFormActions.meta.json), [`GErrorSummary`](../GErrorSummary/GErrorSummary.meta.json)
- Contrato: [`design/contracts/form.md`](../../../../../design/contracts/form.md) · Prototipo: [`design/lab/form/r02/`](../../../../../design/lab/form/r02/) · Estilo: [`design/lab/form/estilo.md`](../../../../../design/lab/form/estilo.md) · Auditoría: [`design/lab/form/auditoria.md`](../../../../../design/lab/form/auditoria.md) · Decisiones: #153–#188 y #266 (bloqueo con interruptor) en `DECISIONS.md`
