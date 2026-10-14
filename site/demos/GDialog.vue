<script setup>
import { reactive, computed, ref } from 'vue'

const contacto = reactive({ nombre: 'Lucía Fernández', telefono: '5512345678' })
const borrador = reactive({ nombre: '', telefono: '' })
const abierto = ref(false)

const errores = computed(() => ({
  nombre: borrador.nombre.trim() ? '' : 'Escribe el nombre del contacto',
  telefono: /^\d{10}$/.test(borrador.telefono) ? '' : 'Escribe el teléfono a 10 dígitos'
}))
const textos = { optional: '(opcional)', error: 'Error: ', warning: 'Advertencia: ', valid: 'Correcto: ' }

function editar() {
  Object.assign(borrador, contacto)
  abierto.value = true
}
// GForm solo emite submit sin errores; cerrar el diálogo es decisión nuestra
function guardar() {
  Object.assign(contacto, borrador)
  abierto.value = false
}
</script>

<template>
  <div class="demo">
    <p class="ficha"><strong>{{ contacto.nombre }}</strong> · {{ contacto.telefono }}</p>
    <g-btn variant="outline" @click="editar">
      <template #prepend><g-icon name="pencil" /></template>
      Editar contacto
    </g-btn>
  </div>

  <g-dialog v-model="abierto" title="Editar contacto" description="Se actualiza en las citas futuras." close-label="Cerrar" size="sm">
    <g-form id="demo-dialogo-contacto" aria-label="Editar contacto" :errors="errores" :labels="textos" @submit="guardar">
      <g-form-layout>
        <g-input v-model="borrador.nombre" label="Nombre" name="nombre" required autocomplete="name" />
        <g-input v-model="borrador.telefono" label="Teléfono" name="telefono" type="tel" inputmode="numeric" required autocomplete="tel-national" />
      </g-form-layout>
    </g-form>
    <!-- El pie está fuera del <form>: el botón se asocia con form="id" -->
    <template #footer="{ close }">
      <g-btn variant="outline" @click="close">Cancelar</g-btn>
      <g-btn type="submit" form="demo-dialogo-contacto">Guardar</g-btn>
    </template>
  </g-dialog>
</template>

<style scoped>
.demo {
  display: grid;
  gap: var(--g-space-3);
  justify-items: start;
}
.ficha {
  margin: 0;
}
</style>
