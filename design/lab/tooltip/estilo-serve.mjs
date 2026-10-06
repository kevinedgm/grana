// Servidor del banco de estilo del tooltip (coco). Sirve la raíz del repositorio y, bajo /__head/, los archivos tal como
// estaban en el commit de referencia (antes de #383), para medir Δ0 frente al CSS anterior.
// Ver a mano: GRANA_PW_PORT=4209 node design/lab/tooltip/estilo-serve.mjs  →  http://127.0.0.1:4209/design/lab/tooltip/estilo-banco.html
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
export const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
export const REF = '5dba395'
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json', '.woff2': 'font/woff2' }
const cache = new Map()
export async function serve(port = Number(process.env.GRANA_PW_PORT) || 4209) {
  const server = http.createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
      let body
      if (path.startsWith('/__head/')) {
        const rel = normalize(path.slice('/__head/'.length))
        if (rel.startsWith('..')) throw new Error('fuera')
        if (!cache.has(rel)) cache.set(rel, execFileSync('git', ['show', `${REF}:${rel}`], { cwd: ROOT }))
        body = cache.get(rel)
      } else {
        const p = normalize(join(ROOT, path))
        if (!p.startsWith(ROOT)) throw new Error('fuera')
        body = await readFile(p)
      }
      res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' }).end(body)
    } catch { if (!res.headersSent) res.writeHead(404).end() }
  })
  await new Promise((r) => server.listen(port, '127.0.0.1', r))
  return { server, base: `http://127.0.0.1:${server.address().port}/design/lab/tooltip/estilo-banco.html` }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) { const { base } = await serve(); console.log(base) }
