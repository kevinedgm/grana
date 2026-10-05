// coco · comprueba el CSS fuente de GAdaptiveLayout (colocación lógica #359, gap #360, pila sin medir)
// con alias escritos a mano. python3 -m http.server 4209 en la raíz; node design/lab/adaptive-layout/estilo-verificar.mjs
import { chromium, firefox, webkit } from '../theme-playground/node_modules/playwright/index.mjs'
const URL_ = `http://localhost:${process.env.GRANA_PW_PORT || 4209}/design/lab/adaptive-layout/estilo-banco.html`
let failed = 0
for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const b = await engine.launch(); const p = await b.newPage(); await p.goto(URL_); await p.waitForTimeout(300)
  const r = await p.evaluate(() => {
    const box = (id) => { const e = document.getElementById(id), R = e.parentElement.getBoundingClientRect(), r = e.getBoundingClientRect(); return { l: r.left - R.left, r: R.right - r.right, t: r.top - R.top, w: r.width } }
    const gap = (id) => { const s = getComputedStyle(document.getElementById(id)); return [parseFloat(s.columnGap), parseFloat(s.rowGap)] }
    const base = document.getElementById('base').getBoundingClientRect()
    const v = (id, k) => getComputedStyle(document.getElementById(id)).getPropertyValue(k).trim()
    const adapt = { parent: [v('adapt-parent', '--g-adapt-chars'), v('adapt-parent', '--g-adapt-weight')], child: [v('adapt-child', '--g-adapt-chars'), v('adapt-child', '--g-adapt-weight')], bad: v('adapt-bad', '--g-adapt-chars'), parentWidth: document.getElementById('adapt-parent').getBoundingClientRect().width }
    return { adapt, ltr: ['ltr-a', 'ltr-b', 'ltr-c'].map(box), rtl: ['rtl-a', 'rtl-b', 'rtl-c'].map(box), fb: ['fb-a', 'fb-b'].map(box), base: [base.width, base.height],
      gaps: Object.fromEntries(['gap-none', 'gap-sm', 'gap-md', 'gap-lg', 'gap-lg-compact'].map((id) => [id, gap(id)])) }
  })
  const checks = []
  const ok = (c, m) => { checks.push(m); if (!c) { failed++; console.log(`  ✗ ${name}: ${m}`) } }
  const near = (a, b) => Math.abs(a - b) < 0.6
  ok(near(r.ltr[0].l, 0) && near(r.ltr[1].l, 116) && near(r.ltr[2].l, 340), `LTR: start desde la izquierda ${JSON.stringify(r.ltr.map((x) => x.l))}`)
  ok(near(r.rtl[0].r, 0) && near(r.rtl[1].r, 116) && near(r.rtl[2].r, 340), `RTL: start desde la derecha ${JSON.stringify(r.rtl.map((x) => x.r))}`)
  ok(r.ltr.every((x, i) => near(x.w, [100, 80, 60][i])) && r.rtl.every((x, i) => near(x.w, [100, 80, 60][i])), 'anchos del alias')
  ok(near(r.ltr[0].t, r.ltr[1].t) && r.ltr[2].t > r.ltr[0].t, 'misma línea comparte fila; línea 2 debajo')
  ok(r.fb.every((x) => near(x.w, 400) && near(x.l, 0)) && r.fb[1].t > r.fb[0].t, 'sin medir: pila a ancho completo')
  ok(JSON.stringify(r.adapt.parent) === '["5","2"]', `--g-adapt-*: valor en el hijo que las declara ${r.adapt.parent}`)
  ok(JSON.stringify(r.adapt.child) === '["0","0"]', `--g-adapt-*: no se heredan (#364) ${r.adapt.child}`)
  ok(r.adapt.bad === '0', `--g-adapt-chars no numérico cae al inicial 0: «${r.adapt.bad}»`)
  ok(near(r.adapt.parentWidth, 400), 'la clase g-adapt-* no cambia el aspecto (ninguna regla la selecciona)')
  const [cg, rg] = r.base
  for (const [id, f] of [['gap-none', 0], ['gap-sm', 0.5], ['gap-md', 1], ['gap-lg', 2], ['gap-lg-compact', 1.5]]) ok(near(r.gaps[id][0], cg * f) && near(r.gaps[id][1], rg * f), `${id}: ${r.gaps[id]} = base ${cg}/${rg} × ${f}`)
  console.log(`${name}: ${checks.length} comprobaciones`)
  await b.close()
}
console.log(failed ? `${failed} fallos` : 'sin fallos')
process.exit(failed ? 1 : 0)
