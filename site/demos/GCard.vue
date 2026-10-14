<script setup>
import { ref } from 'vue'

const textos = { menu: 'Acciones de', loading: 'Cargando tarjeta', loaded: 'Tarjeta cargada', retry: 'Reintentar', empty: 'Aún no hay proyectos' }
const plan = ref('equipo')
const planes = [
  { id: 'personal', nombre: 'Personal', texto: 'Una persona, 5 proyectos.' },
  { id: 'equipo', nombre: 'Equipo', texto: 'Hasta 10 personas y espacio ilimitado.' },
  { id: 'empresa', nombre: 'Empresa', texto: 'Inicio de sesión único y auditoría.' }
]
const ultima = ref('ninguna')
const acciones = [
  { id: 'renombrar', label: 'Renombrar' },
  { id: 'archivar', label: 'Archivar' }
]
</script>

<template>
  <div class="demo">
    <div role="radiogroup" aria-label="Plan" class="grid">
      <g-card
        v-for="p in planes" :key="p.id"
        v-model="plan" interaction="select" select-type="radio" name="plan" :value="p.id"
        :title="'Plan ' + p.nombre" :description="p.texto" color="accent" :labels="textos"
      ></g-card>
    </div>

    <g-card
      title="Proyecto Atlas" subtitle="Equipo de datos" badge="Activo" badge-color="success"
      :meta="[{ label: 'Responsable', value: 'Ana Pérez' }, { label: 'Tareas', value: 12 }]"
      :menu="acciones" :labels="textos" @action="(e) => (ultima = e.id)"
    >
      <template #lead><g-icon name="folder"></g-icon></template>
      <template #actions><g-btn variant="outline" @click="ultima = 'abrir'">Abrir</g-btn></template>
    </g-card>
    <p>Plan elegido: <strong>{{ plan }}</strong> · Última acción: <strong>{{ ultima }}</strong></p>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-4); }
.grid {
  display: grid;
  gap: var(--g-space-3);
  grid-template-columns: repeat(auto-fit, minmax(min(100%, calc(var(--g-space-1) * 40)), 1fr));
}
p { margin: 0; }
</style>
