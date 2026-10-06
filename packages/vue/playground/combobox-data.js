// Datos y «servidor» simulado de la sección GCombobox del playground (dueño: bruno). Adaptado de la maqueta de kiwi
// (design/lab/combobox/r01/combo.js). Es LA APLICACIÓN: Grana nunca hace fetch; el componente emite `search` y `more`, y
// la aplicación entrega options, loading, total y loadError (combobox.md «Datos», #332).
// Interruptores para las pruebas: window.__cbFast (red y antirrebote cortos), window.__cbSlow (red lenta),
// window.__cbFailNext (la próxima búsqueda falla).
(function () {
  const foldCh = (c) => c.normalize('NFD')[0].toLowerCase()
  const fold = (s) => Array.from(String(s ?? ''), foldCh).join('')
  const tokens = (q) => fold(q).split(/\s+/).filter(Boolean)
  function rng(seed) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296 } }

  const NOM = ['María', 'José', 'Guadalupe', 'Juan', 'Ana', 'Luis', 'Sofía', 'Carlos', 'Fernanda', 'Miguel', 'Valeria', 'Jorge', 'Camila', 'Pedro', 'Daniela', 'Andrés', 'Regina', 'Óscar', 'Ximena', 'Raúl', 'Renata', 'Iván', 'Paola', 'Héctor', 'Lucía', 'Ángel', 'Elena', 'Rubén', 'Itzel', 'Tomás']
  const APE = ['García', 'Hernández', 'Martínez', 'López', 'González', 'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Cruz', 'Flores', 'Gómez', 'Morales', 'Vázquez', 'Jiménez', 'Reyes', 'Díaz', 'Torres', 'Gutiérrez', 'Ruiz', 'Mendoza', 'Aguilar', 'Ortiz', 'Castillo', 'Chávez', 'Núñez', 'Juárez', 'Santiago', 'Velasco', 'Zárate']
  const MED = ['Dra. Ibáñez', 'Dr. Salgado', 'Dra. Córdova', 'Dr. Lara']

  // 2 400 pacientes; los cuatro primeros son homónimas («María García López»): se distinguen por expediente y edad
  const patients = []
  ;(function () {
    const r = rng(7)
    const mk = (i, n, a1, a2) => {
      const age = 1 + Math.floor(r() * 92)
      const exp = String(1000 + i * 7).padStart(6, '0')
      const d = 1 + Math.floor(r() * 27)
      const m = 1 + Math.floor(r() * 9)
      const last = `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/2026`
      const medico = MED[Math.floor(r() * MED.length)]
      return {
        value: 'p' + exp, label: `${n} ${a1} ${a2}`, avatar: true, description: `Exp. ${exp} · ${age} años`,
        facts: [{ label: 'Exp.', value: exp }, { label: 'Edad', value: `${age} años` }, { label: 'Última visita', value: last }, { label: 'Médico', value: medico }]
      }
    }
    for (let i = 0; i < 2400; i++) patients.push(i < 4 ? mk(i, 'María', 'García', 'López') : mk(i, NOM[Math.floor(r() * NOM.length)], APE[Math.floor(r() * APE.length)], APE[Math.floor(r() * APE.length)]))
  })()
  const RECENT = [patients[0], patients[57], patients[123], patients[900]]

  const CIE = [
    ['Infecciosas y parasitarias (A00–B99)', [['A09', 'Diarrea y gastroenteritis de presunto origen infeccioso'], ['A90', 'Fiebre del dengue [dengue clásico]'], ['B34.9', 'Infección viral, no especificada']]],
    ['Endocrinas, nutricionales y metabólicas (E00–E89)', [['E03.9', 'Hipotiroidismo, no especificado'], ['E10.9', 'Diabetes mellitus tipo 1, sin mención de complicación'], ['E11.9', 'Diabetes mellitus tipo 2, sin mención de complicación'], ['E66.9', 'Obesidad, no especificada'], ['E78.5', 'Hiperlipidemia, no especificada']]],
    ['Trastornos mentales (F00–F99)', [['F32.9', 'Episodio depresivo, no especificado'], ['F41.1', 'Trastorno de ansiedad generalizada']]],
    ['Sistema nervioso (G00–G99)', [['G43.9', 'Migraña, no especificada'], ['G47.0', 'Trastornos del inicio y del mantenimiento del sueño [insomnios]']]],
    ['Sistema circulatorio (I00–I99)', [['I10', 'Hipertensión esencial (primaria)'], ['I20.9', 'Angina de pecho, no especificada'], ['I25.9', 'Enfermedad isquémica crónica del corazón, no especificada'], ['I50.9', 'Insuficiencia cardíaca, no especificada']]],
    ['Sistema respiratorio (J00–J99)', [['J00', 'Rinofaringitis aguda [resfriado común]'], ['J02.9', 'Faringitis aguda, no especificada'], ['J03.9', 'Amigdalitis aguda, no especificada'], ['J06.9', 'Infección aguda de las vías respiratorias superiores, no especificada'], ['J18.9', 'Neumonía, no especificada'], ['J20.9', 'Bronquitis aguda, no especificada'], ['J45.9', 'Asma, no especificada']]],
    ['Sistema digestivo (K00–K95)', [['K21.9', 'Enfermedad del reflujo gastroesofágico sin esofagitis'], ['K29.7', 'Gastritis, no especificada'], ['K30', 'Dispepsia'], ['K59.0', 'Constipación']]],
    ['Sistema osteomuscular (M00–M99)', [['M54.5', 'Lumbago no especificado'], ['M79.1', 'Mialgia']]],
    ['Sistema genitourinario (N00–N99)', [['N39.0', 'Infección de vías urinarias, sitio no especificado']]],
    ['Síntomas y signos (R00–R99)', [['R05', 'Tos'], ['R10.4', 'Otros dolores abdominales y los no especificados'], ['R50.9', 'Fiebre, no especificada'], ['R51', 'Cefalea']]]
  ]
  // Diagnóstico: código en su caja + descripción; la línea secundaria (ficha en reposo y aria-describedby) es el capítulo
  const dx = CIE.map(([label, list]) => ({ label, options: list.map(([code, d]) => ({ value: code, code, label: d, description: label.replace(/ \(.*/, '') })) }))
  const MEDS = [['Paracetamol 500 mg, tabletas', 'Analgésico · vía oral'], ['Paracetamol 100 mg/ml, solución gotas', 'Analgésico · vía oral · pediátrico'], ['Ibuprofeno 400 mg, tabletas', 'AINE · vía oral'], ['Naproxeno 250 mg, tabletas', 'AINE · vía oral'], ['Amoxicilina 500 mg, cápsulas', 'Antibiótico · vía oral'], ['Amoxicilina con ácido clavulánico 875/125 mg, tabletas', 'Antibiótico · vía oral'], ['Azitromicina 500 mg, tabletas', 'Antibiótico · vía oral'], ['Metformina 850 mg, tabletas', 'Hipoglucemiante · vía oral'], ['Losartán 50 mg, tabletas', 'Antihipertensivo · vía oral'], ['Enalapril 10 mg, tabletas', 'Antihipertensivo · vía oral'], ['Omeprazol 20 mg, cápsulas', 'Inhibidor de la bomba de protones'], ['Loratadina 10 mg, tabletas', 'Antihistamínico · vía oral'], ['Salbutamol 100 µg, aerosol', 'Broncodilatador · inhalado'], ['Atorvastatina 20 mg, tabletas', 'Hipolipemiante · vía oral'], ['Levotiroxina 100 µg, tabletas', 'Hormona tiroidea · vía oral']]
  const meds = MEDS.map(([label, description], i) => ({ value: 'm' + i, label, description }))
  const clientes = ['Laboratorios Alfa', 'Clínica del Valle', 'Hospital San Ángel', 'Farmacia La Paz', 'Distribuidora Médica del Sur', 'Grupo Sanatorio Oaxaca'].map((label, i) => ({ value: 'c' + i, label, icon: 'building-complex' }))
  const big = Array.from({ length: 500 }, (_, i) => ({ value: 'b' + i, label: `Insumo ${String(i + 1).padStart(3, '0')} · ${['gasas', 'jeringas', 'guantes', 'catéteres', 'vendas'][i % 5]}` }))
  const medicos = [['Dra. Elena Ibáñez Cruz', 'Medicina interna'], ['Dr. Raúl Salgado Núñez', 'Cardiología'], ['Dra. Itzel Córdova Ruiz', 'Pediatría'], ['Dr. Tomás Lara Juárez', 'Traumatología'], ['Dra. Paola Zárate Flores', 'Ginecología']]
    .map(([label, description], i) => ({ value: 'd' + i, label, description, avatar: true }))
  const rtl = [['طبيب عام', 'الطب العام'], ['طبيب أطفال', 'طب الأطفال'], ['طبيب قلب', 'أمراض القلب'], ['طبيب أسنان', 'طب الأسنان']].map(([label, description], i) => ({ value: 'r' + i, label, description }))

  const PAGE = 20
  const server = {
    calls: 0,
    /** Devuelve { items, total } tras una latencia simulada; rechaza una vez si window.__cbFailNext */
    patients(q, offset) {
      server.calls++
      return new Promise((res, rej) => setTimeout(() => {
        if (window.__cbFailNext) { window.__cbFailNext = false; return rej(new Error('503')) }
        const toks = tokens(q)
        const all = toks.length ? patients.filter((p) => { const h = fold(p.label + ' ' + p.description); return toks.every((t) => h.includes(t)) }) : RECENT.slice()
        const f0 = fold(q)
        if (toks.length) all.sort((a, b) => Number(fold(b.label).startsWith(f0)) - Number(fold(a.label).startsWith(f0)))
        res({ items: all.slice(offset, offset + PAGE), total: all.length })
      }, window.__cbFast ? 30 : window.__cbSlow ? 1800 : 380))
    }
  }

  // Fase 2 (`multiple`, #417 a #428): catálogos de la ronda r03 de kiwi (design/lab/combobox/r03/multi.js)
  const A = (cat, list) => ({ label: cat, options: list.map(([label, description]) => ({ value: fold(label).replace(/[^a-z0-9]+/g, '-'), label, description })) })
  const allergens = [
    A('Medicamentos', [['Penicilina', 'Antibiótico betalactámico'], ['Amoxicilina', 'Antibiótico betalactámico'], ['Cefalosporinas', 'Antibiótico betalactámico'], ['Sulfonamidas', 'Antibiótico (sulfas)'], ['Ácido acetilsalicílico', 'AINE · aspirina'], ['Ibuprofeno', 'AINE'], ['Naproxeno', 'AINE'], ['Metamizol', 'Analgésico'], ['Codeína', 'Opioide'], ['Morfina', 'Opioide'], ['Lidocaína', 'Anestésico local'], ['Carbamazepina', 'Anticonvulsivo'], ['Fenitoína', 'Anticonvulsivo'], ['Alopurinol', 'Antigotoso'], ['Vancomicina', 'Antibiótico glucopéptido'], ['Ciprofloxacino', 'Antibiótico quinolona'], ['Medios de contraste yodados', 'Imagen']]),
    A('Alimentos', [['Huevo', 'Alimento'], ['Leche de vaca', 'Alimento'], ['Cacahuate', 'Alimento'], ['Nueces', 'Alimento'], ['Mariscos', 'Alimento · crustáceos y moluscos'], ['Pescado', 'Alimento'], ['Trigo', 'Alimento'], ['Soya', 'Alimento'], ['Ajonjolí', 'Alimento'], ['Fresa', 'Alimento'], ['Kiwi', 'Alimento']]),
    A('Ambientales', [['Polen de pasto', 'Estacional'], ['Ácaros del polvo', 'Perenne'], ['Pelo de gato', 'Animal'], ['Pelo de perro', 'Animal'], ['Picadura de abeja', 'Himenópteros'], ['Picadura de avispa', 'Himenópteros'], ['Moho', 'Perenne']]),
    A('Materiales', [['Látex', 'Guantes, sondas'], ['Níquel', 'Metal'], ['Clorhexidina', 'Antiséptico'], ['Yodopovidona', 'Antiséptico'], ['Esparadrapo', 'Adhesivo']])
  ]
  const P = (label, area, ext, value) => ({ value, label, avatar: true, facts: [{ label: 'Área', value: area, priority: 1 }, { label: 'Ext.', value: ext }] })
  const people = [P('Ana López Ruiz', 'Urgencias', '2104', 'u1'), P('Ana López Ruiz', 'Pediatría', '3310', 'u2'), P('Luis Hernández Cruz', 'Urgencias', '2108', 'u3'), P('Sofía Martínez Díaz', 'Laboratorio', '4402', 'u4'),
    P('Carlos Gómez Reyes', 'Imagenología', '4510', 'u5'), P('Valeria Torres Ortiz', 'Enfermería', '2201', 'u6'), P('Jorge Ramírez Flores', 'Trabajo social', '1107', 'u7'), P('Regina Chávez Núñez', 'Farmacia', '1302', 'u8'),
    P('Iván Juárez Velasco', 'Urgencias', '2112', 'u9'), P('Paola Santiago Zárate', 'Admisión', '1001', 'u10'), P('Héctor Aguilar Mendoza', 'Quirófano', '5101', 'u11'), P('Lucía Castillo Ruiz', 'Pediatría', '3302', 'u12')]
  const tags = ['Urgente', 'Seguimiento', 'Interconsulta', 'Laboratorio', 'Imagen', 'Referencia', 'Contrarreferencia', 'Alta voluntaria', 'Crónico', 'Embarazo', 'Pediátrico', 'Geriátrico'].map((label, i) => ({ value: 't' + i, label }))

  window.PlaygroundCombobox = { patients, RECENT, dx, meds, clientes, big, medicos, rtl, server, PAGE, allergens, people, tags }
})()
