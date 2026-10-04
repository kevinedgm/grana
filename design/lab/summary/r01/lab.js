// Banco de casos de la ficha de resumen: los MISMOS casos para la base (r01) y para cada concepto (r02). kiwi.
(function () {
  const { createApp, ref, computed, h } = Vue
  const { XSummary, diffOf } = SummaryLab
  const P = (id, title, exp, edad, visita, medico, status) => ({ id, title, avatar: true, status,
    facts: [{ label: 'Expediente', short: 'Exp.', value: exp, priority: 1 }, { label: 'Edad', value: edad, priority: 2, plain: true },
      { label: 'Última visita', value: visita, priority: 3 }, { label: 'Médico', value: medico, priority: 4, plain: true }] })
  const PEOPLE = [
    P('p1', 'María García López', '001000', '22 años', '03/02/2026', 'Dra. Ruiz', { label: 'Activa', color: 'success' }),
    P('p2', 'María García López', '004417', '47 años', '19/08/2026', 'Dr. Peña', { label: 'Activa', color: 'success' }),
    P('p3', 'María García López', '010238', '22 años', '03/02/2026', 'Dr. Ortega', { label: 'Alta', color: 'neutral' }),
    P('p4', 'María García López', '020951', '71 años', '11/11/2025', 'Dra. Ruiz', { label: 'Activa', color: 'success' }),
    P('p5', 'Mario Garza Lozano', '000317', '35 años', '27/09/2026', 'Dr. Peña', { label: 'Pendiente', color: 'warning' })
  ]
  const DX = { title: 'Diabetes mellitus tipo 2 sin complicaciones', code: 'E11.9', icon: 'activity',
    facts: [{ label: 'Grupo', value: 'Endocrinas' }, { label: 'Crónica', value: 'Sí', plain: false }, { label: 'Última revisión', value: '2026' }] }
  const PROD = { title: 'Paracetamol 500 mg, caja con 20 tabletas', icon: 'tag', status: { label: 'Agotado', color: 'danger' },
    facts: [{ label: 'SKU', value: 'MED-000482-MX', priority: 1 }, { label: 'Precio', value: '$ 48.50', priority: 2 }, { label: 'Existencia', value: '0 cajas', priority: 3 }, { label: 'Proveedor', value: 'Laboratorios Farmacéuticos del Sureste, S.A. de C.V.', priority: 4 }] }

  // Qué disposición usa cada concepto en cada caso (el anfitrión conoce su alto; la ficha se adapta a su ancho)
  const CFG = {
    base: { opt: { layout: 'row' }, field: { layout: 'inline' }, preview: { layout: 'stack' }, card: { layout: 'auto' }, cell: { layout: 'row' } },
    A: { opt: { layout: 'row' }, field: { layout: 'inline' }, preview: { layout: 'row', lines: 0, size: 'lg' }, card: { layout: 'row', lines: 4, size: 'lg' }, cell: { layout: 'row' } },
    B: { opt: { layout: 'row' }, field: { layout: 'inline' }, preview: { layout: 'stack' }, card: { layout: 'stack' }, cell: { layout: 'row' } },
    C: { opt: { layout: 'row' }, field: { layout: 'inline' }, preview: { layout: 'stack' }, card: { layout: 'auto', surface: true, expandable: true }, cell: { layout: 'row' } }
  }

  const TEMPLATE = `
  <header class="sh-bar">
    <span class="sh-brand">{{ brand }}</span>
    <nav class="sh-pick" aria-label="Concepto" v-if="picks.length"><a v-for="p in picks" :key="p" :href="'?c=' + p + (rtl ? '&dir=rtl' : '')" :aria-current="p === c ? 'page' : null">{{ p }}</a></nav>
    <div class="ctl">
      <label>Ancho del contenedor <input id="w" type="range" min="160" max="720" step="1" v-model.number="w"></label><output for="w">{{ w }}px</output>
      <button type="button" v-for="q in [160, 240, 360, 520, 720]" :key="q" @click="w = q">{{ q }}</button>
      <button type="button" :aria-pressed="String(rtl)" @click="toggleDir">RTL</button>
    </div>
  </header>
  <main>
    <h1>{{ title }}</h1>
    <p class="lead">{{ lead }}</p>
    <p class="concept" v-if="how" v-html="how"></p>
    <div class="cards">
      <section class="case"><h2>1 · Opción de combobox</h2>
        <p>Cuatro homónimas y un vecino. El anfitrión fija el alto de la fila; la ficha decide qué cabe en su ancho. Mueve el control: nada cruza la línea discontinua.</p>
        <div class="stage" :style="st"><ul class="lb" id="case-opt" role="listbox" aria-label="Paciente">
          <li v-if="c === 'B'" class="lb__head" role="presentation"><x-summary v-bind="headRow" concept="B" layout="row" heading></x-summary></li>
          <li v-for="(p, i) in people" :key="p.id" class="lb__opt" role="option" :aria-selected="String(i === 0)"><x-summary v-bind="{ ...p, ...cfg.opt }" :status="null" :diff="diffs[i]" :concept="c"></x-summary></li>
        </ul></div>
      </section>
      <section class="case"><h2>2 · Valor dentro del campo (una línea, Δ0 de alto)</h2>
        <p>Arriba, un campo con texto plano de referencia; abajo, el mismo campo con la ficha. Miden lo mismo de alto en cualquier ancho.</p>
        <div class="stage" :style="st"><div class="field" id="field-ref"><span class="field__plain">María García López</span></div></div>
        <div class="stage" :style="st"><div class="field" id="case-field"><x-summary v-bind="{ ...people[0], ...cfg.field }" :concept="c"></x-summary></div></div>
        <div class="stage" :style="st"><div class="field" id="case-field-dx"><x-summary v-bind="{ ...dx, ...cfg.field }" :concept="c"></x-summary></div></div>
      </section>
      <section class="case"><h2>3 · Vista previa de la paleta (bloque con espacio)</h2>
        <p>Con alto libre, los datos se despliegan todos.</p>
        <div class="stage" :style="st"><div class="preview" id="case-preview"><x-summary v-bind="{ ...people[0], ...cfg.preview }" :concept="c" group></x-summary></div></div>
      </section>
      <section class="case"><h2>4 · Tarjeta que se redimensiona</h2>
        <p>Una tarjeta al ancho del control y, debajo, una rejilla: arrastra la esquina inferior del marco o usa su control.</p>
        <div class="stage" :style="st"><component :is="c === 'C' ? 'div' : 'g-surface'" v-bind="c === 'C' ? {} : { padding: 'md' }" id="case-card">
          <x-summary v-bind="{ ...people[0], ...cfg.card }" :concept="c" group><template #action><g-btn size="xs" variant="ghost">Abrir</g-btn></template></x-summary>
        </component></div>
        <div class="row2 ctl">
          <label>Ancho de la rejilla <input id="gw" type="range" min="200" max="928" step="1" v-model.number="gw"></label><output for="gw">{{ gw }}px</output>
          <label>Mínimo por tarjeta <select v-model.number="gmin"><option :value="40">160px</option><option :value="56">224px</option><option :value="80">320px</option><option :value="130">520px</option></select></label>
        </div>
        <div class="stage gridframe" id="gridframe" tabindex="0" aria-label="Rejilla redimensionable" :style="{ inlineSize: gw + 'px' }"><div class="grid" id="grid" :style="{ '--_min': gmin }">
          <component :is="c === 'C' ? 'div' : 'g-surface'" v-bind="c === 'C' ? {} : { padding: 'md' }" v-for="(p, i) in people" :key="p.id">
            <x-summary v-bind="{ ...p, ...cfg.card }" :diff="diffs[i]" :concept="c" group></x-summary>
          </component>
        </div></div>
      </section>
      <section class="case"><h2>5 · Celda de tabla</h2>
        <p><code>GTable</code> real; la ficha va en <code>cell-paciente</code>. El alto de la fila no cambia con el ancho.</p>
        <div class="stage" :style="st"><div class="cellwrap" id="case-cell"><g-table :columns="cols" :rows="rows" row-key="id" responsive="table" caption="Pacientes" :labels="{}">
          <template #cell-paciente="{ row }"><span class="cellfit"><x-summary v-bind="{ ...row.p, ...cfg.cell }" :status="null" :diff="diffs[row.i]" :concept="c"></x-summary></span></template>
        </g-table></div></div>
      </section>
      <section class="case" v-if="c === 'base'"><h2>6 · Estados y variantes</h2>
        <p>Carga, vacío, entidad con código (el código es el identificador), icono en lugar de avatar, valores largos, tres líneas.</p>
        <div class="states" id="states">
          <div><small>Cargando (row)</small><x-summary loading layout="row"></x-summary></div>
          <div><small>Cargando (inline)</small><x-summary loading layout="inline"></x-summary></div>
          <div><small>Vacío</small><x-summary empty="Sin paciente" layout="row"></x-summary></div>
          <div><small>Código + título (diagnóstico)</small><x-summary v-bind="dx" layout="row"></x-summary></div>
          <div><small>Icono, estado y valores largos</small><x-summary v-bind="prod" layout="row"></x-summary></div>
          <div><small>lines = 3</small><x-summary v-bind="prod" layout="row" :lines="3"></x-summary></div>
          <div><small>Sin datos, con línea secundaria</small><x-summary title="Clínica del Valle" subtitle="Av. Reforma 120, Oaxaca de Juárez" icon="building-complex" layout="row"></x-summary></div>
          <div><small>stack</small><x-summary v-bind="prod" layout="stack"></x-summary></div>
        </div>
      </section>
    </div>
  </main>`

  window.SummaryLabMount = function (sel, c, text) {
    const q = new URLSearchParams(location.search)
    if (q.get('dir')) document.documentElement.dir = q.get('dir')
    const app = createApp({
      template: TEMPLATE,
      setup() {
        const w = ref(Number(q.get('w')) || 360), gw = ref(Number(q.get('gw')) || 720), gmin = ref(56), rtl = ref(document.documentElement.dir === 'rtl')
        const diffs = c === 'B' ? diffOf(PEOPLE) : PEOPLE.map(() => null)
        const headRow = { title: 'Paciente', facts: PEOPLE[0].facts.map((f) => ({ ...f, short: null, value: f.label === 'Expediente' ? 'Expediente' : f.label, label: f.label, head: true })) }
        window.__lab = { setWidth: (v) => { w.value = v }, setGrid: (v, m) => { gw.value = v; if (m) gmin.value = m } }
        return { c, w, gw, gmin, rtl, people: PEOPLE, dx: DX, prod: PROD, cfg: CFG[c], diffs, headRow,
          st: computed(() => ({ inlineSize: w.value + 'px' })),
          cols: [{ key: 'paciente', label: 'Paciente', min: 30 }, { key: 'estado', label: 'Estado', min: 10 }],
          rows: PEOPLE.map((p, i) => ({ id: p.id, p, i, paciente: p.title, estado: p.status.label })),
          brand: text.brand, title: text.title, lead: text.lead, how: text.how, picks: text.picks || [],
          toggleDir() { rtl.value = !rtl.value; document.documentElement.dir = rtl.value ? 'rtl' : 'ltr' } }
      }
    })
    app.component('XSummary', XSummary)
    ;['GSurface', 'GTable', 'GBtn', 'GBadge', 'GAvatar'].forEach((n) => app.component(n, Grana[n]))
    app.mount(sel)
    return app
  }
})()
