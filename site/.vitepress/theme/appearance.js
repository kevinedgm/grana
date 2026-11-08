// Tema del sitio: sistema · claro · oscuro (design/contracts/sitio-marco.md §7).
//
// Una sola fuente: la preferencia guardada con la clave de siempre de VitePress (`vitepress-theme-appearance`:
// `auto` · `light` · `dark`), para que nadie pierda la suya. La clase `dark` de <html> (estilos de documento de
// VitePress y el tema doble de Shiki) la pone VitePress con su `isDark` (useDark de VueUse, script propio antes de
// pintar); el sitio guarda la preferencia con `useStorage` de la misma VueUse —que avisa a las demás instancias de la
// misma clave en el documento (evento `vueuse-storage`)— y escribe `data-theme` (tokens de Grana) desde `isDark`.
// Antes de pintar, `data-theme` lo pone el script del <head> de config.mjs. Con `auto`, `isDark` sigue al sistema en
// vivo (usePreferredDark de VueUse). Sin `matchMedia` ni `localStorage` en el primer render (SSR, #1033).
import { computed, onMounted, ref, watch } from 'vue'
import { useStorage } from '@vueuse/core'
import { useData, inBrowser } from 'vitepress'

export const APPEARANCE_KEY = 'vitepress-theme-appearance'
export const MODES = ['auto', 'light', 'dark']

export function useAppearance() {
  const { isDark } = useData()
  // En el servidor y en la hidratación, `auto`: el control se pinta en «Sistema» y se corrige al montar (sin mover
  // nada: solo cambia qué radio está marcado; los colores ya los puso el <head>).
  const stored = inBrowser ? useStorage(APPEARANCE_KEY, 'auto', undefined, { listenToStorageChanges: true }) : null
  const mounted = ref(false)
  onMounted(() => { mounted.value = true })
  const mode = computed({
    get: () => (mounted.value && stored && MODES.includes(stored.value) ? stored.value : 'auto'),
    set: (v) => {
      if (stored && MODES.includes(v)) stored.value = v
    }
  })
  if (inBrowser) {
    watch(isDark, (dark) => document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light'), { immediate: true })
  }
  return { mode, isDark }
}
