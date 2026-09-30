// Theme Playground (Fase 3 de Dark Color Presence). Solo investigación: no toca el Theme Engine ni ninguna regla.
// ?set=gaps carga los 5 temas de la Fase 4 (huecos de evidencia) en lugar de los 11 del benchmark
const SET = new URLSearchParams(location.search).get('set') === 'gaps' ? 'gaps' : 'benchmark'
const BASE = SET === 'gaps' ? '../tema-oscuro/dark-color-presence-gaps/' : '../tema-oscuro/dark-color-presence/'
const GAP_THEMES = [
  { id: 'gris-medio', name: 'Gris medio' }, { id: 'ocre-oliva', name: 'Ocre y oliva' }, { id: 'colision-ajustada', name: 'Colisión ajustada (adjust)' },
  { id: 'tinte-acento-violeta', name: 'Tinte del acento · violeta' }, { id: 'tinte-acento-rojo', name: 'Tinte del acento · rojo' }
]
const BENCH_THEMES = [
  { id: 'notion', name: 'Notion Inspired' }, { id: 'apple', name: 'Apple Inspired' }, { id: 'medium', name: 'Medium Inspired' },
  { id: 'stripe', name: 'Stripe Inspired' }, { id: 'caracol-purpura', name: 'Caracol Púrpura' }, { id: 'amazon', name: 'Amazon Inspired' },
  { id: 'github', name: 'GitHub Inspired' }, { id: 'spotify', name: 'Spotify Inspired' }, { id: 'linear', name: 'Linear Inspired' },
  { id: 'grana', name: 'Grana' }, { id: 'lustre', name: 'Lustre (control)' }
]
const THEMES = SET === 'gaps' ? GAP_THEMES : BENCH_THEMES
const ROLES = ['brand', 'accent', 'success', 'warning', 'danger', 'info']
const STRATEGY_TO_VARIANT = { current: 'A', b: 'B', c: 'C', d: 'D' }
const SURFACE_TO_ATTR = { low: 'low', real: 'actual', medium: 'medium', high: 'high' }
const STRATEGY_LABEL = { current: 'Current (A · solo 4.5:1)', b: 'B · piso L ≥ 0.70 (simulación)', c: 'C · ΔE ≥ 0.50 (simulación)', d: 'D · C + tope L 0.74 + croma ≥ 0.80 (experimento)' }

// ---------- Color: OKLab/OKLCH y contraste (solo para leer valores vivos; no derivan nada) ----------
const toLin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
const parseHex = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(h).trim()); return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null }
const oklab = (rgb) => {
  const [r, g, b] = rgb.map(toLin)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return { L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s }
}
const lum = ([r, g, b]) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b)
const contrast = (x, y) => { const a = lum(x), b = lum(y); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
const r3 = (n) => Math.round(n * 1000) / 1000

const params = new URLSearchParams(location.search)
const pick = (key, allowed, fallback) => { const v = params.get(key); return allowed.includes(v) ? v : fallback }
const initial = {
  theme: pick('theme', THEMES.map((t) => t.id), THEMES[THEMES.length === 5 ? 0 : 9].id),
  scheme: pick('scheme', ['light', 'dark'], 'dark'),
  strategy: pick('strategy', ['current', 'b', 'c', 'd'], 'current'),
  surface: pick('surface', ['low', 'real', 'medium', 'high'], 'real')
}

const themeLink = document.getElementById('theme-css')
const variantsLink = document.getElementById('variants-css')
const loadLink = (link, href) => new Promise((resolve) => {
  if (link.getAttribute('href') === href) return resolve()
  link.onload = () => resolve(); link.onerror = () => resolve()
  link.setAttribute('href', href)
})

const { createApp, reactive, ref, nextTick, onMounted } = Vue
const app = createApp({
  setup() {
    const state = reactive({ ...initial })
    const live = reactive({ surfaceHex: '', surfaceL: 0, roles: Object.fromEntries(ROLES.map((r) => [r, { hex: '', L: 0, C: 0, contrast: 0, dL: 0, dE: 0 }])), ladder: { bg: '', sunken: '', surface: '', inset: '' } })
    const info = reactive({ name: '', brand: '', accent: '', radius: 0, shape: '', fontUi: '', fontDisplay: '', collision: '' })
    const fonts = reactive({ ui: { family: '', status: 'pending' }, display: { family: '', status: 'pending' }, fallbackNote: '' })
    const note = ref('')
    const f = reactive({ txt: '', area: 'Texto de ejemplo', sel: 'b', chk1: true, chk2: false, sw1: true, sw2: false, mail: '', terms: false, news: true })
    const cache = { config: {}, results: null }

    const themeConfig = async (id) => cache.config[id] ?? (cache.config[id] = await (await fetch(`${BASE}themes/${id}.json`)).json())
    const resultsJson = async () => cache.results ?? (cache.results = await (await fetch(`${BASE}results.json`)).json())

    const readTokens = () => {
      const cs = getComputedStyle(document.documentElement)
      const tok = (n) => cs.getPropertyValue(n).trim()
      const surf = parseHex(tok('--g-color-surface'))
      const so = surf && oklab(surf)
      live.surfaceHex = tok('--g-color-surface'); live.surfaceL = so ? r3(so.L) : 0
      for (const r of ROLES) {
        const hex = tok(`--g-color-${r}`)
        const rgb = parseHex(hex)
        if (!rgb || !so) continue
        const k = oklab(rgb)
        live.roles[r] = { hex, L: r3(k.L), C: r3(Math.hypot(k.a, k.b)), contrast: Math.round(contrast(rgb, surf) * 100) / 100, dL: r3(Math.abs(k.L - so.L)), dE: r3(Math.hypot(k.L - so.L, k.a - so.a, k.b - so.b)) }
      }
      live.ladder = { bg: tok('--g-color-bg'), sunken: tok('--g-color-surface-sunken'), surface: tok('--g-color-surface'), inset: tok('--g-surface-inset') }
    }

    // Fuentes: se cargan las del tema si están disponibles; si no, se registra el fallback usado (nunca se oculta)
    const checkFont = async (family, weight) => {
      const spec = `${weight} 16px "${family}"`
      try { await document.fonts.load(spec) } catch (e) { /* se registra abajo */ }
      const face = [...document.fonts].some((x) => x.family.replace(/"/g, '') === family && x.status === 'loaded')
      return face && document.fonts.check(spec) ? 'loaded' : 'fallback'
    }
    const loadFonts = async (cfg) => {
      const ui = cfg.font, disp = cfg.fontDisplay
      fonts.ui = { family: ui, status: await checkFont(ui, 400) }
      fonts.display = { family: disp, status: await checkFont(disp, 600) }
      const missing = [fonts.ui, fonts.display].filter((x) => x.status !== 'loaded').map((x) => x.family)
      const stack = getComputedStyle(document.documentElement).getPropertyValue('--g-font-ui').trim()
      fonts.fallbackNote = missing.length ? `fallback: ${missing.join(', ')} no disponible → ${stack}` : 'ninguno (las dos fuentes del tema están cargadas)'
    }

    const apply = async () => {
      document.body.dataset.ready = '0'
      const de = document.documentElement
      const cfg = await themeConfig(state.theme)
      await Promise.all([loadLink(themeLink, `${BASE}generated/${state.theme}.css`), loadLink(variantsLink, `${BASE}generated/${state.theme}.variants.css`)])
      de.dataset.theme = state.scheme
      de.dataset.variant = STRATEGY_TO_VARIANT[state.strategy]
      de.dataset.surface = SURFACE_TO_ATTR[state.surface]
      de.dataset.benchmarkTheme = state.theme
      const meta = THEMES.find((t) => t.id === state.theme)
      Object.assign(info, { name: meta.name, brand: cfg.brand, accent: cfg.accent, radius: cfg.radius, shape: cfg.shape, fontUi: cfg.font, fontDisplay: cfg.fontDisplay })
      const res = await resultsJson()
      info.collision = res.themes[state.theme].semanticClose.map((c) => `${c.token.replace('--g-color-', '')} ↔ ${c.collidedWith}${c.accentDerived ? ' (derivado)' : ''}`).filter((v, i, a) => a.indexOf(v) === i).join(', ') || 'ninguna'
      note.value = state.scheme === 'light' ? 'Strategy y Surface solo afectan a Dark' : ''
      await loadFonts(cfg)
      await nextTick()
      readTokens()
      const url = new URL(location.href)
      for (const k of ['theme', 'scheme', 'strategy', 'surface']) url.searchParams.set(k, state[k]) // `set` se conserva tal cual
      history.replaceState(null, '', url)
      window.__playground = { ...state, variant: STRATEGY_TO_VARIANT[state.strategy], fonts: JSON.parse(JSON.stringify(fonts)), version: (window.__playground?.version ?? 0) + 1 }
      document.body.dataset.ready = '1'
    }
    onMounted(apply)

    return {
      state, live, info, fonts, note, f, apply, themes: THEMES, roles: ROLES, semantics: ['success', 'warning', 'danger', 'info'],
      strategyLabel: Vue.computed(() => STRATEGY_LABEL[state.strategy]),
      opts: [{ value: 'a', label: 'Opción A' }, { value: 'b', label: 'Opción B' }],
      feedback: [
        { role: 'success', title: 'Guardado', text: 'Los cambios se aplicaron.' }, { role: 'warning', title: 'Por confirmar', text: 'Falta confirmar el anticipo.' },
        { role: 'danger', title: 'No se pudo enviar', text: 'Revisa los datos e inténtalo de nuevo.' }, { role: 'info', title: 'Aviso', text: 'Tu cita se reprogramó.' }
      ],
      ladder: [
        { id: 'bg', token: '--g-color-bg', label: 'Background' }, { id: 'sunken', token: '--g-color-surface-sunken', label: 'Surface sunken' },
        { id: 'surface', token: '--g-color-surface', label: 'Surface' }, { id: 'inset', token: '--g-surface-inset', label: 'Surface inset' }
      ]
    }
  }
})
app.use(Grana).mount('#app')
