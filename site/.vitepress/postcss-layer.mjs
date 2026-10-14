// Mete todo el CSS del tema de VitePress (hojas y bloques <style> de sus componentes) en la capa
// `vitepress`, declarada antes que las de Grana en theme/layers.css:
//   @layer vitepress, grana.defaults, grana.components;
// Así los reinicios de elemento de VitePress (`button`, `h2`, `table`…) no ganan a los componentes
// de Grana de los ejemplos vivos. Es la receta de DECISIONS #516 aplicada al propio sitio.
// El CSS del sitio (theme/grana-site.css) va sin capa, como el tema de una aplicación: gana siempre.

const VITEPRESS = /[\\/]node_modules[\\/]vitepress[\\/]/

export function layerVitepress() {
  return {
    postcssPlugin: 'grana-layer-vitepress',
    Once(root, { AtRule, result }) {
      const from = root.source?.input?.file || result.opts.from || ''
      if (!VITEPRESS.test(from)) return
      const layer = new AtRule({ name: 'layer', params: 'vitepress' })
      const keep = []
      root.each((node) => {
        if (node.type === 'atrule' && ['import', 'charset', 'namespace'].includes(node.name)) keep.push(node)
      })
      root.each((node) => {
        if (!keep.includes(node)) layer.append(node.clone())
      })
      root.removeAll()
      keep.forEach((n) => root.append(n))
      if (layer.nodes?.length) root.append(layer)
    }
  }
}
layerVitepress.postcss = true
