// GFileField · forma sobre el COMPONENTE REAL del playground (packages/vue/playground, #sec-file-field), en Chromium, Firefox
// y WebKit (file-field.md «Verificación · Playwright», hallazgo 5 de design/lab/file-field/auditoria.md): una GFormRow con un
// GFileField y un GInput se parte antes de que «Adjuntar archivo» baje de línea (--g-form-min: 62 de coco) y respeta el
// --g-form-min del consumidor; un campo dentro de un subárbol inert no despierta al arrastrar archivos a la página.
// El resto de la forma (Δ0 con GInput, 320px, RTL) está en file-field.spec.mjs.
import { test, expect } from '@playwright/test'

const PAGE = '/packages/vue/playground/index.html'

async function open(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.addInitScript(() => { window.__ffFast = true })
  await page.goto(PAGE)
  await page.waitForSelector('#ff-rx')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  await page.evaluate(() => document.fonts.ready)
  await page.locator('#ff-rx').scrollIntoViewIfNeeded()
}

test.describe('GFileField · forma (file-field.md)', () => {
  test('la GFormRow con GFileField y GInput se parte antes de que «Adjuntar archivo» baje de línea y respeta el --g-form-min del consumidor', async ({ page }) => {
    await open(page)
    // Una ficha en el campo: la línea que no debe romperse es «ficha + Adjuntar archivo» (la medida de coco, 245px = space × 61,3)
    await page.setInputFiles('#ff-rx', [{ name: 'Receta.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2000, 1) }])
    await page.evaluate(() => document.fonts.ready)
    const measure = (w) => page.evaluate((w) => {
      document.getElementById('ff-rx-form').style.inlineSize = w + 'px'
      return new Promise((res) => setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        const input = document.getElementById('ff-rx-folio').closest('.g-input').querySelector('.g-input__control').getBoundingClientRect()
        const root = document.getElementById('ff-rx').closest('.g-file-field')
        const box = root.querySelector('.g-file-field__box').getBoundingClientRect()
        const add = root.querySelector('.g-file-field__add').getBoundingClientRect()
        const chip = root.querySelector('.g-file-field__chip').getBoundingClientRect()
        res({
          same: Math.abs(input.top - box.top) < 0.5 && box.left > input.right - 1, // comparten línea
          oneLine: Math.abs(add.top + add.height / 2 - (chip.top + chip.height / 2)) < 1, // «Adjuntar archivo» sigue en la línea de la ficha
          boxWidth: box.width
        })
      })), 30))
    }, w)
    const sweep = async () => {
      let split = null
      const bad = []
      for (let w = 960; w >= 300; w -= 4) {
        const s = await measure(w)
        if (s.same && !s.oneLine) bad.push(w)
        if (!s.same && split === null) split = w
      }
      return { split, bad }
    }
    const base = await sweep()
    expect(base.bad, 'mientras comparte línea con el GInput, «Adjuntar archivo» no baja de línea').toEqual([])
    expect(base.split, 'la fila se parte antes de llegar a 300px').not.toBeNull()
    // A 960px comparten línea y a la anchura de partida el campo mide al menos el mínimo medido (245px)
    expect((await measure(960)).same).toBe(true)
    // Ya partida, la caja ocupa el ancho de la fila (siempre llena el ancho)
    const split = await measure(base.split)
    expect(split.same).toBe(false)
    // El consumidor sobrescribe --g-form-min sobre el campo: la fila se parte antes (a un ancho mayor)
    await page.evaluate(() => document.getElementById('ff-rx').closest('.g-file-field').style.setProperty('--g-form-min', '100'))
    const wide = await sweep()
    expect(wide.split, 'con --g-form-min mayor la fila se parte a un ancho mayor').toBeGreaterThan(base.split)
    expect(wide.bad).toEqual([])
    await page.evaluate(() => { document.getElementById('ff-rx-form').style.inlineSize = '' })
  })

  test('un campo dentro de un subárbol inert no despierta al arrastrar; el vecino alcanzable sí', async ({ page }) => {
    await open(page)
    await page.evaluate(() => { document.getElementById('ff-id-row').inert = true })
    const r = await page.evaluate(async () => {
      const dt = new DataTransfer()
      dt.items.add(new File([new Uint8Array(5)], 'x.png', { type: 'image/png' }))
      const root = (id) => document.getElementById(id).closest('.g-file-field')
      const target = (id) => root(id).querySelector('.g-file-field__target')
      await new Promise((res) => requestAnimationFrame(res))
      document.body.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }))
      await new Promise((res) => setTimeout(res, 300))
      const out = {
        inertAwake: root('ff-ine-a').classList.contains('is-awake'),
        inertOpacity: getComputedStyle(target('ff-ine-a')).opacity,
        liveAwake: root('ff-rx').classList.contains('is-awake'),
        liveOpacity: getComputedStyle(target('ff-rx')).opacity
      }
      document.body.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }))
      await new Promise((res) => setTimeout(res, 200))
      out.after = document.querySelectorAll('#sec-file-field .g-file-field.is-awake').length
      return out
    })
    expect(r.inertAwake).toBe(false)
    expect(r.inertOpacity).toBe('0')
    expect(r.liveAwake).toBe(true)
    expect(r.liveOpacity).toBe('1')
    expect(r.after).toBe(0)
    // Quitar el inert: el campo vuelve a despertar
    await page.evaluate(() => { document.getElementById('ff-id-row').inert = false })
    const back = await page.evaluate(async () => {
      const dt = new DataTransfer()
      dt.items.add(new File([new Uint8Array(5)], 'x.png', { type: 'image/png' }))
      document.body.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }))
      await new Promise((res) => setTimeout(res, 300))
      const ok = document.getElementById('ff-ine-a').closest('.g-file-field').classList.contains('is-awake')
      document.body.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }))
      return ok
    })
    expect(back).toBe(true)
  })
})
