<script setup>
import { ref, onMounted } from 'vue'

const actual = ref('inicio')
const modo = ref('expanded')
const marco = ref(null)
// En un marco estrecho (móvil) la barra expandida no deja sitio: se empieza en automático.
onMounted(() => { if (marco.value.clientWidth < 600) modo.value = 'auto' })
const formato = ref({ mode: '', overlay: false })
const modos = [{ id: 'expanded', label: 'Expandida' }, { id: 'rail', label: 'Riel' }, { id: 'auto', label: 'Automático' }]
const items = [
  { label: 'Principal', items: [
    { id: 'inicio', label: 'Inicio', href: '#inicio', icon: 'house' },
    { id: 'bandeja', label: 'Bandeja', href: '#bandeja', icon: 'inbox', badge: 12, badgeLabel: '12 sin leer' },
    { id: 'agenda', label: 'Agenda', href: '#agenda', icon: 'calendar', dot: true, badgeLabel: 'Hay citas nuevas' }
  ] },
  { label: 'Clínica', items: [
    { id: 'pacientes', label: 'Pacientes', icon: 'users', children: [
      { id: 'activos', label: 'Activos', href: '#activos' },
      { id: 'alta', label: 'De alta', href: '#alta' }
    ] },
    { id: 'reportes', label: 'Reportes', href: '#reportes', icon: 'chart-column' },
    { id: 'facturacion', label: 'Facturación', icon: 'credit-card', disabled: true }
  ] },
  { id: 'ajustes', label: 'Ajustes', href: '#ajustes', icon: 'settings' }
]
const textos = { collapse: 'Contraer la barra lateral', expand: 'Expandir la barra lateral', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar' }
// La documentación no debe navegar: se cancela el href y se actualiza el destino a mano.
const navegar = ({ item, event }) => { event.preventDefault(); actual.value = item.id }
</script>

<template>
  <div class="demo">
    <div class="botones" role="group" aria-label="Formato de la barra">
      <g-btn v-for="m in modos" :key="m.id" size="sm" :variant="modo === m.id ? 'solid' : 'outline'"
             :aria-pressed="modo === m.id" @click="modo = m.id">{{ m.label }}</g-btn>
    </div>
    <div ref="marco" class="marco">
      <g-sidebar :model-value="actual" :items="items" label="Principal" :labels="textos" :mode="modo" contained
                 @navigate="navegar" @mode-change="formato = $event">
        <template #logo="{ collapsed }"><g-icon name="leaf"></g-icon><span v-if="!collapsed">Clínica Reforma</span></template>
        <template #toggle-icon><g-icon name="chevron-left" flip-rtl></g-icon></template>
        <template #more-icon><g-icon name="ellipsis-vertical"></g-icon></template>
        <template #user="{ collapsed }">
          <span class="usuario">
            <g-avatar name="Ana García" :label="collapsed ? 'Ana García' : undefined"></g-avatar>
            <span v-if="!collapsed">Ana García</span>
          </span>
        </template>
      </g-sidebar>
      <div class="contenido" :class="{ 'con-barra': formato.mode === 'navbar' }">
        <p>Página actual: <strong>{{ actual }}</strong></p>
        <p>Formato: <strong>{{ formato.mode }}</strong>. En «Automático» decide el ancho del marco: riel en un marco mediano y navbar con píldora en uno estrecho.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.demo { display: grid; gap: var(--g-space-3); }
.botones { display: flex; flex-wrap: wrap; gap: var(--g-space-2); }
.marco { position: relative; display: flex; block-size: calc(var(--g-space-1) * 120); overflow: hidden; border: var(--g-border-width) solid var(--g-color-border); border-radius: var(--g-radius-md); }
.marco > :first-child { flex: none; }
.contenido { flex: 1 1 auto; min-inline-size: 0; overflow: auto; padding: var(--g-space-4); }
.contenido.con-barra { padding-block-end: calc(var(--g-sidebar-bar) + var(--g-space-4)); }
.contenido p { margin: 0 0 var(--g-space-2); }
.usuario { display: flex; align-items: center; gap: var(--g-space-2); }
</style>
