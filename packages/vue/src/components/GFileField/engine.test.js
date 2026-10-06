// Motor puro de GFileField (file-field.md «Añadir y validar» y «Arrastre de página», #370, #373)
import { describe, it, expect } from 'vitest'
import { accepts, dragAccepts, formatFileSize, iconOf, isPreviewable, sameFile, validate } from './engine.js'

const f = (name, size, type = '', lastModified = 1) => ({ name, size, type, lastModified })

describe('formatFileSize (L9: unidades decimales con Intl)', () => {
  it('bytes, kB, MB y GB decimales; una cifra decimal por debajo de 10', () => {
    expect(formatFileSize(220000, 'en-US')).toBe('220 kB')
    expect(formatFileSize(1240000, 'en-US')).toBe('1.2 MB')
    expect(formatFileSize(12800000, 'en-US')).toBe('13 MB')
    expect(formatFileSize(999, 'en-US')).toMatch(/^999 /)
    expect(formatFileSize(3.2e9, 'en-US')).toBe('3.2 GB')
  })
  it('respeta el idioma (coma decimal en es-MX… o el separador que dé Intl) y no falla con valores raros', () => {
    expect(formatFileSize(1240000, 'de-DE')).toBe('1,2 MB')
    expect(formatFileSize(-5, 'en-US')).toMatch(/^0 /)
    expect(formatFileSize(NaN, 'en-US')).toMatch(/^0 /)
    expect(formatFileSize(1500, 'xx-invalid-@@')).toMatch(/1[.,]5/)
  })
})

describe('accepts (#370): por extensión y por MIME', () => {
  it('extensión sin mayúsculas, MIME exacto y comodín', () => {
    expect(accepts(f('Receta.PDF', 1, 'application/pdf'), '.pdf')).toBe(true)
    expect(accepts(f('a.png', 1, 'image/png'), 'image/*')).toBe(true)
    expect(accepts(f('a.png', 1, 'image/png'), 'application/pdf')).toBe(false)
    expect(accepts(f('a.pdf', 1, 'application/pdf'), '.docx, application/pdf')).toBe(true)
    expect(accepts(f('a.exe', 1, 'application/x-msdownload'), '.pdf,image/*')).toBe(false)
    expect(accepts(f('a.exe', 1, ''), undefined)).toBe(true)
  })
  it('un archivo sin MIME casa solo por extensión', () => {
    expect(accepts(f('foto.heic', 1, ''), 'image/*')).toBe(false)
    expect(accepts(f('foto.heic', 1, ''), 'image/*,.heic')).toBe(true)
  })
})

describe('dragAccepts (r01, 12): durante el arrastre solo hay MIME', () => {
  it('sin accept o sin tipos, se da por bueno', () => {
    expect(dragAccepts([], 'image/*')).toBe(true)
    expect(dragAccepts(['application/pdf'], undefined)).toBe(true)
  })
  it('con alguna extensión en accept, se da por bueno (la decisión es al soltar)', () => {
    expect(dragAccepts(['application/x-msdownload'], '.pdf,image/*')).toBe(true)
  })
  it('solo MIME: cada tipo debe casar; un tipo vacío no descarta', () => {
    expect(dragAccepts(['image/png', 'image/jpeg'], 'image/*')).toBe(true)
    expect(dragAccepts(['image/png', 'application/pdf'], 'image/*')).toBe(false)
    expect(dragAccepts([''], 'image/*')).toBe(true)
  })
})

describe('validate (#370): tipo › vacío › tamaño › duplicado › número', () => {
  const o = { accept: 'image/*', maxSize: 100, room: 2, single: false, existing: [f('ya.png', 10, 'image/png', 7)] }
  it('cada archivo con su primer motivo, en este orden; entran los primeros que caben', () => {
    const files = [f('a.pdf', 0, 'application/pdf'), f('vacio.png', 0, 'image/png'), f('grande.png', 200, 'image/png'), f('ya.png', 10, 'image/png', 7), f('b.png', 5, 'image/png'), f('c.png', 5, 'image/png'), f('d.png', 5, 'image/png')]
    const r = validate(files, o)
    expect(r.accepted.map((x) => x.name)).toEqual(['b.png', 'c.png'])
    expect(r.rejected.map((x) => [x.name, x.reason])).toEqual([['a.pdf', 'type'], ['vacio.png', 'empty'], ['grande.png', 'size'], ['ya.png', 'duplicate'], ['d.png', 'count']])
  })
  it('duplicados dentro del mismo gesto; sin multiple entra el primero que pasa y el resto es count, sin duplicados', () => {
    const r = validate([f('x.png', 5, 'image/png'), f('x.png', 5, 'image/png')], { ...o, existing: [] })
    expect(r.rejected.map((x) => x.reason)).toEqual(['duplicate'])
    const s = validate([f('bad.pdf', 1, 'application/pdf'), f('ya.png', 10, 'image/png', 7), f('z.png', 5, 'image/png')], { ...o, single: true })
    expect(s.accepted.map((x) => x.name)).toEqual(['ya.png'])
    expect(s.rejected.map((x) => x.reason)).toEqual(['type', 'count'])
  })
})

describe('miniatura e icono', () => {
  it('imágenes que el navegador pinta; HEIC lleva el icono image; el resto file-text', () => {
    for (const t of ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/avif', 'image/bmp', 'image/svg+xml']) expect(isPreviewable(t), t).toBe(true)
    expect(isPreviewable('image/heic')).toBe(false)
    expect(iconOf('image/heic')).toBe('image')
    expect(iconOf('application/pdf')).toBe('file-text')
    expect(iconOf('')).toBe('file-text')
  })
  it('sameFile: name, size y lastModified', () => {
    expect(sameFile(f('a', 1, '', 3), f('a', 1, 'x', 3))).toBe(true)
    expect(sameFile(f('a', 1, '', 3), f('a', 1, '', 4))).toBe(false)
  })
})
