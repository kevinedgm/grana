// Plugin de Vite de @grana/cli: entrega el tema como módulo virtual, generado en build (DECISIONS #5, #62, #92).
//   // vite.config.js
//   import grana from '@grana/cli/vite'
//   export default { plugins: [grana({ config: 'grana.config.json' })] }
//   // main.js
//   import 'virtual:grana/tokens.css'
// Mismas reglas que la línea de comandos: si el tema rompe un mínimo de accesibilidad o la configuración no es
// válida, la compilación falla (en desarrollo, se muestra en la superposición de errores y se recupera al corregir).
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildTheme } from './index.js'

export const VIRTUAL_ID = 'virtual:grana/tokens.css'
const RESOLVED = `\0${VIRTUAL_ID}`

const format = (issues) => issues.map((i) => `[${i.id}] ${i.message}\n    Por qué: ${i.why}`).join('\n')

/**
 * @param {{ config?: string | object }} [options] ruta del JSON (relativa a la raíz del proyecto; por defecto
 *   `grana.config.json`) o el objeto de configuración directamente
 */
export default function grana({ config = 'grana.config.json' } = {}) {
  let root = process.cwd()
  return {
    name: 'grana',
    enforce: 'pre',
    configResolved(resolved) { if (resolved?.root) root = resolved.root },
    resolveId(id) { return id === VIRTUAL_ID ? RESOLVED : null },
    load(id) {
      if (id !== RESOLVED) return null
      let raw = config
      let source = 'configuración en línea'
      if (typeof config === 'string') {
        const path = resolve(root, config)
        source = config
        this.addWatchFile(path)
        try {
          raw = JSON.parse(readFileSync(path, 'utf8'))
        } catch (e) {
          this.error(`[grana] No se pudo leer ${config}: ${e.code === 'ENOENT' ? 'el archivo no existe' : e.message}`)
        }
      }
      const result = buildTheme(raw, { source })
      const errors = result.issues.filter((i) => i.severity === 'error')
      const warnings = result.issues.filter((i) => i.severity === 'warning')
      for (const w of warnings) this.warn(`[grana] ${format([w])}`)
      if (!result.ok) this.error(`[grana] El tema no es válido (${errors.length} ${errors.length === 1 ? 'error' : 'errores'}):\n${format(errors)}`)
      return result.css
    }
  }
}
