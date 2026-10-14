<script setup>
import { ref } from 'vue'

const seccion = ref('datos')
const secciones = [
  { value: 'datos',    label: 'Datos' },
  { value: 'bitacora', label: 'Bitácora' },
  { value: 'adjuntos', label: 'Adjuntos' },
]
const ruta = [
  { label: 'Expedientes', href: '#expedientes' },
]
</script>

<template>
  <div style="height: 320px; overflow-y: auto; position: relative; scroll-padding-block-start: 44px;">
    <GPageHeader
      title="Expediente 2026-09-EX"
      eyebrow="Consulta externa"
      description="Actualizado hace 2 horas."
      :labels="{ actions: 'Acciones del expediente' }"
    >
      <template #trail>
        <GBreadcrumbs :items="ruta" label="Ruta de navegación" />
      </template>
      <template #meta>
        <GBadge color="info">Activo</GBadge>
      </template>
      <template #actions="{ narrow }">
        <GBtn v-if="!narrow" variant="outline" color="neutral">Descargar</GBtn>
        <GBtn>Archivar</GBtn>
      </template>
      <template #tabs>
        <GTabs
          id="demo-tabs"
          v-model="seccion"
          :items="secciones"
          detached
          label="Secciones del expediente"
        />
      </template>
    </GPageHeader>
    <GTabPanel tabs="demo-tabs" value="datos"    :active="seccion === 'datos'">
      <div style="padding: var(--g-space-4)">
        <p>Datos del expediente.</p>
        <div style="height: 400px; background: var(--g-color-surface); border-radius: var(--g-radius-md)" />
      </div>
    </GTabPanel>
    <GTabPanel tabs="demo-tabs" value="bitacora" :active="seccion === 'bitacora'">
      <div style="padding: var(--g-space-4)"><p>Bitácora del expediente.</p></div>
    </GTabPanel>
    <GTabPanel tabs="demo-tabs" value="adjuntos" :active="seccion === 'adjuntos'">
      <div style="padding: var(--g-space-4)"><p>Adjuntos del expediente.</p></div>
    </GTabPanel>
  </div>
</template>
