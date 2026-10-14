import { describe, it, expect } from 'vitest'
import { analyze, blocksOf } from '../scripts/check-readme-fragments.mjs'

describe('check-readme-fragments: detector de ejemplos no montables', () => {
  it('un bloque con <script setup> completo no tiene pendientes', () => {
    const r = analyze(`<script setup>
import { ref } from 'vue'
import { GBtn } from '@grana/vue'
const n = ref(0)
function sumar() { n.value++ }
</script>
<template><g-btn @click="sumar">{{ n }}</g-btn></template>`)
    expect(r).toEqual({ free: [], orphanSlot: false })
  })

  it('el template con un nombre sin declarar lo reporta', () => {
    const r = analyze('<g-btn @click="guardar">Guardar</g-btn>')
    expect(r.free).toEqual(['guardar'])
  })

  it('un slot suelto sin componente que lo reciba se reporta', () => {
    expect(analyze('<template #footer><p>Hola</p></template>').orphanSlot).toBe(true)
    expect(analyze('<g-card><template #footer><p>Hola</p></template></g-card>').orphanSlot).toBe(false)
  })

  it('reconoce la marca de fragmento', () => {
    const md = '```vue\n<!-- Fragmento: `guardar` es de tu aplicación -->\n<g-btn @click="guardar" />\n```\n\n```vue\n<g-btn @click="guardar" />\n```'
    const b = blocksOf(md)
    expect(b.map((x) => x.marked)).toEqual([true, false])
  })

  it('detecta una llamada sin declarar dentro del <script setup>', () => {
    const r = analyze(`<script setup>
import { ref } from 'vue'
const datos = ref(null)
async function cargar() { datos.value = await api.clientes() }
</script>
<template><button @click="cargar">Cargar</button></template>`)
    expect(r.free).toEqual(['api'])
  })

  it('falso positivo: «if» dentro de un manejador en línea no es un identificador', () => {
    const r = analyze(`<script setup>
import { ref } from 'vue'
const n = ref(0)
</script>
<template><button @click="if (n > 0) n--">Quitar</button></template>`)
    expect(r.free).toEqual([])
  })

  it('falso positivo: nombres con ñ y acentos', () => {
    const r = analyze(`<script setup>
import { ref } from 'vue'
const niño = ref('a')
const año = ref(2026)
</script>
<template><p>{{ niño }} {{ año }}</p></template>`)
    expect(r.free).toEqual([])
  })

  it('falso positivo: declaraciones con coma y desestructuración', () => {
    const r = analyze(`<script setup>
const a = 1, b = [1, 2], { c, d: e = 3 } = { c: 1 }
let [x, y] = [1, 2]
</script>
<template><p>{{ a }} {{ b }} {{ c }} {{ e }} {{ x }} {{ y }}</p></template>`)
    expect(r.free).toEqual([])
  })

  it('claves de objeto, flechas y v-for no cuentan como libres', () => {
    const r = analyze(`<script setup>
import { ref } from 'vue'
const items = ref([])
const m = items.value.map((i) => ({ id: i.id }))
</script>
<template><ul><li v-for="(it, i) in items" :key="it.id" @click="() => pick(it)">{{ i }}</li></ul></template>`)
    expect(r.free).toEqual(['pick'])
  })

  it('las macros de <script setup> no cuentan como libres', () => {
    expect(analyze('<script setup>\ndefineOptions({ inheritAttrs: false })\n</script>').free).toEqual([])
  })
})
