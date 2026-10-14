<script setup>
// Mantiene `data-theme` de Grana igual a la apariencia de VitePress (clase `dark`), para que los
// componentes de los ejemplos y los tokens del sitio cambien a la vez. El primer valor lo pone el
// script del <head> (config.mjs) antes de pintar.
import { watchEffect } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme-without-fonts'

const { isDark } = useData()
if (typeof document !== 'undefined') {
  watchEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
  })
}
</script>

<template>
  <DefaultTheme.Layout />
</template>
