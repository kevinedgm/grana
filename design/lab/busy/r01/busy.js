// Prototipo de kiwi (busy r01). Motor del laboratorio: NO es el .vue (eso es de bruno).
// Base común a A, B y C: bloqueo real con `inert` (salvo el disparador con el foco, que queda aria-disabled, #17),
// tiempos del motor de carga (200 / 400 / 5000 ms, loadPhase.js), un canal cortés de página que se traslada al modal
// superior, foco que nunca cae en body, Esc = cancelar (o nada), y la superficie que se libera siempre al terminar.
/* global LUCIDE_ICONS */
(function () {
  const DELAY = 200
  const MINIMUM = 400
  const SLOW = 5000
  const Q = new URLSearchParams(location.search)
  const root = document.documentElement
  if (Q.get('theme') === 'dark') root.dataset.theme = 'dark'
  if (Q.get('dir') === 'rtl') root.dir = 'rtl'
  if (Q.get('motion') === 'reduce') root.classList.add('reduce')
  const reduced = () => root.classList.contains('reduce') || matchMedia('(prefers-reduced-motion: reduce)').matches

  const icon = (name, cls = '') => `<svg class="g-icon ${cls}" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${LUCIDE_ICONS[name]}</svg>`
  const btn = (label, { variant = 'solid', color = 'brand', size = 'md', cls = '', attrs = '' } = {}) =>
    `<button type="button" class="g-btn g-btn--color-${color} g-btn--variant-${variant} g-btn--size-${size} g-btn--density-default ${cls}" ${attrs}><span class="g-btn__label">${label}</span>${icon('loader-circle', 'g-btn__loader')}</button>`
  const field = (id, label, value, changed) =>
    `<div class="g-input g-input--variant-outline g-input--size-md g-input--density-default g-input--block${changed ? ' is-changed' : ''}">` +
    `<label class="g-input__label" for="${id}">${label}</label><div class="g-input__row"><div class="g-input__control" data-g-tooltip-box>` +
    `<input class="g-input__field" id="${id}" name="${id}" value="${value}"></div></div></div>`

  // ---------------- Canal cortés de página (uno; se traslada al modal superior) ----------------
  const live = document.createElement('p')
  live.className = 'bz-sr'
  live.id = 'bz-live'
  live.setAttribute('aria-live', 'polite')
  live.setAttribute('aria-atomic', 'true')
  document.body.appendChild(live)
  const spoken = []
  let tSay = 0
  let tClear = 0
  // como el canal de página de liveRegion.js (#533): lo escrito en el mismo ciclo de 50 ms sale en UNA escritura,
  // y un texto idéntico pendiente no se repite
  let pending = []
  function say (text, from = 'busy') {
    if (pending.some((p) => p.text === text)) return
    pending.push({ text, from })
    if (tSay) return
    live.textContent = ''
    clearTimeout(tClear)
    tSay = setTimeout(() => {
      const out = pending.map((p) => p.text).join(' ')
      spoken.push({ text: out, from: pending.map((p) => p.from).includes('app') ? (pending.every((p) => p.from === 'app') ? 'app' : 'mixto') : 'busy', t: Math.round(performance.now()) })
      pending = []; tSay = 0
      live.textContent = out
      renderLog()
      tClear = setTimeout(() => { live.textContent = '' }, 5000)
    }, 50)
  }
  function syncLive () {
    const modals = [...document.querySelectorAll('dialog[open]')].filter((d) => d.matches(':modal'))
    const top = modals[modals.length - 1]
    const host = top || document.body
    if (live.parentNode !== host) host.appendChild(live)
  }
  const logEl = () => document.getElementById('log')
  function renderLog () {
    const el = logEl(); if (!el) return
    el.innerHTML = spoken.slice(-8).map((s) => `<li><span class="lab-src">${s.from === 'busy' ? 'componente' : s.from === 'app' ? 'aplicación' : 'ambos'}</span> ${s.text}</li>`).join('')
  }

  // ---------------- Bloqueo: inert en todo menos el camino al disparador ----------------
  function inertExcept (scope, keep) {
    const done = []
    const mark = (el) => { if (!el.inert && !el.matches('.bz-layer, .bz-layer *, script, style')) { el.inert = true; done.push(el) } }
    if (!keep || !scope.contains(keep)) {
      for (const c of scope.children) mark(c)
      return done
    }
    let node = keep
    while (node && node !== scope) {
      const parent = node.parentElement
      for (const sib of parent.children) if (sib !== node) mark(sib)
      node = parent
    }
    return done
  }
  const isTrigger = (el) => !!el && (el.matches('button, [role="button"], input[type="submit"]'))
  const focusable = (el) => el && el.isConnected && !el.closest('[inert]') && el.getClientRects().length > 0

  // ---------------- La operación ----------------
  class Busy {
    constructor (o) {
      Object.assign(this, o)
      this.active = false
      this.ev = []
      this.ignored = 0
      this.timers = []
    }
    log (what, extra = {}) { this.ev.push({ what, t: Math.round(performance.now() - this.t0), ...extra }) }
    later (ms, fn) { const id = setTimeout(fn, ms); this.timers.push(id); return id }

    start ({ dur = 900, outcome = 'ok', cancelable = false, steps = false } = {}) {
      if (this.active) { this.ignored++; return false }
      this.active = true
      this.t0 = performance.now()
      this.ev = []
      this.opts = { dur, outcome, cancelable, steps }
      this.stepIx = 0
      this.shown = false
      this.slow = false
      this.phase = 'pending'
      const active = document.activeElement
      this.returnTo = active && active !== document.body ? active : null
      const scopeEl = this.scope === 'full' ? null : (this.lockRoot || this.surface)
      const inside = !!(scopeEl && this.returnTo && scopeEl.contains(this.returnTo))
      // C tapa la zona de acciones: el disparador quedaría oculto bajo la hoja (2.4.11), así que el foco pasa a la hoja
      this.keep = inside && isTrigger(this.returnTo) && !(this.concept === 'C' && this.scope !== 'inline') ? this.returnTo : null
      this.log('start', { inside, keep: !!this.keep })

      if (this.scope === 'full') return this.startFull()

      // 1) bloqueo real desde el primer instante
      this.inerted = inertExcept(scopeEl, this.keep)
      this.busyEl = this.busyTarget || this.content || scopeEl
      this.busyEl.setAttribute('aria-busy', 'true')
      if (this.keep) { this.keep.setAttribute('aria-disabled', 'true'); if (this.concept !== 'A' || this.scope !== 'inline') this.keep.classList.toggle('is-loading', this.useBtnLoading()) }
      this.surface.classList.add('is-busy', 'is-pending')
      if (this.dialog) this.holdDialog(true)
      // 2) la capa propia de cada concepto (ya en el DOM, invisible en la fase pendiente)
      this.render()
      this.exposeLayer(scopeEl)
      // 3) foco: si estaba dentro y no es el disparador, a la capa (con nombre); nunca a body
      this.focusMoved = false
      if (inside && !this.keep) { this.status.focus({ preventScroll: true }); this.focusMoved = document.activeElement === this.status }
      this.timeline()
      return true
    }
    // la capa nunca queda dentro de algo inerte: se abre su camino y se inertizan los hermanos de ese camino
    exposeLayer (scopeEl) {
      let node = this.layer
      while (node && node !== scopeEl && node.parentElement) {
        const parent = node.parentElement
        if (node.inert) { node.inert = false; this.inerted = this.inerted.filter((x) => x !== node); for (const sib of node.children) if (sib !== this.layer && !sib.contains(this.layer) && !sib.inert) { sib.inert = true; this.inerted.push(sib) } }
        node = parent
      }
    }
    useBtnLoading () { return this.scope === 'inline' && this.concept !== 'A' }

    timeline () {
      const { dur, steps } = this.opts
      this.later(DELAY, () => {
        if (!this.active) return
        this.shown = true; this.shownAt = performance.now(); this.phase = 'shown'
        this.surface.classList.remove('is-pending')
        this.log('shown')
        if (!this.focusMoved) say(this.label + '.')
        if (this.concept === 'A' && this.edge) this.measureEdge()
      })
      this.later(SLOW, () => {
        if (!this.active) return
        this.slow = true; this.phase = 'slow'
        this.surface.classList.add('is-slow')
        this.updateText()
        this.log('slow')
        say(this.slowText())
      })
      if (steps) {
        const n = this.steps.length
        for (let i = 1; i < n; i++) this.later((dur * i) / n, () => { if (this.active) { this.stepIx = i; this.updateText() } })
      }
      this.later(dur, () => this.finish(this.opts.outcome))
    }
    slowText () {
      const st = this.opts.steps ? ` ${this.steps[this.stepIx]}.` : ''
      return `${this.slowLabel}${st}`
    }
    cancel () {
      if (!this.active || !this.opts.cancelable || this.canceling) return
      this.canceling = true
      this.log('cancel')
      this.updateText()
      // la aplicación aborta su petición; la capa dice «Cancelando…» hasta que `active` vuelve a false
      this.later(300, () => this.finish('cancel'))
    }
    finish (outcome) {
      if (!this.active) return
      const wait = this.shown ? MINIMUM - (performance.now() - this.shownAt) : 0
      if (wait > 0) { this.later(wait, () => this.finish(outcome)); return }
      for (const id of this.timers) clearTimeout(id)
      this.timers = []
      this.release(outcome)
    }

    // ---------------- Liberación: siempre, también si falla ----------------
    release (outcome) {
      const focusWasOnLayer = this.layer && this.layer.contains(document.activeElement)
      const focusLost = document.activeElement === document.body
      if (this.scope === 'full') {
        this.full.close()
        this.full.remove()
        this.busyEl.setAttribute('aria-busy', 'false')
        syncLive()
      } else {
        for (const el of this.inerted) el.inert = false
        this.busyEl.setAttribute('aria-busy', 'false')
        if (this.keep) { this.keep.removeAttribute('aria-disabled'); this.keep.classList.remove('is-loading') }
        if (this.dialog) this.holdDialog(false)
        this.surface.classList.remove('is-busy', 'is-pending', 'is-slow')
        this.unrender(outcome)
      }
      this.active = false
      this.canceling = false
      this.log('end', { outcome })
      // foco: vuelve a donde estaba (el disparador), o a la cabeza de la superficie; nunca a body
      if (focusWasOnLayer || focusLost || (this.scope === 'full')) {
        const back = focusable(this.returnTo) ? this.returnTo : this.home
        if (back) back.focus({ preventScroll: true })
      }
      this.outcome = outcome
      if (this.onEnd) this.onEnd(outcome)
    }

    // ---------------- GDialog: retener el cierre (Esc, fondo, cerrar) sin abrir otro diálogo ----------------
    holdDialog (on) {
      const d = this.dialog
      if (on) {
        this.onCancelEv = (e) => { e.preventDefault(); this.log('esc-held'); this.cancel() }
        d.addEventListener('cancel', this.onCancelEv)
        d.dataset.busy = 'true'
      } else {
        d.removeEventListener('cancel', this.onCancelEv)
        delete d.dataset.busy
      }
    }

    // ---------------- Pantalla completa: un <dialog> modal propio, sin GDialog ----------------
    startFull () {
      const d = document.createElement('dialog')
      d.className = `bz-full bz-full--${this.concept} bz-layer is-pending`
      d.setAttribute('aria-labelledby', `${this.id}-t`)
      this.full = d
      this.surface = d
      this.layer = d
      d.innerHTML = this.fullMarkup()
      document.body.appendChild(d)
      this.busyEl = this.appRoot
      this.busyEl.setAttribute('aria-busy', 'true')
      d.addEventListener('cancel', (e) => { e.preventDefault(); this.log('esc-held'); this.cancel() })
      d.addEventListener('click', (e) => { const c = e.target.closest('.bz-cancel'); if (c) this.cancel() })
      d.addEventListener('mousedown', (e) => { if (!e.target.closest('.bz-cancel')) e.preventDefault() })
      d.showModal()
      syncLive()
      this.status = d.querySelector('.bz-status')
      this.status.focus({ preventScroll: true })
      this.focusMoved = document.activeElement === this.status
      this.edge = d.querySelector('.bz-edge')
      this.updateText()
      this.timeline()
      return true
    }
    fullMarkup () {
      const t = `${this.id}-t`
      const cancel = this.opts.cancelable ? `<button type="button" class="bz-cancel">${this.cancelLabel}</button>` : ''
      if (this.concept === 'A') {
        return `<svg class="bz-edge bz-visual" aria-hidden="true"><rect pathLength="100"/></svg>` +
          `<div class="bz-tab bz-visual bz-status" role="group" tabindex="-1" aria-labelledby="${t}"><span class="bz-tab__text" id="${t}">${this.label}</span>${cancel}</div>`
      }
      if (this.concept === 'B') {
        return `<div class="bz-band bz-visual bz-status" role="group" tabindex="-1" aria-labelledby="${t}">` +
          `<span class="bz-line__icon">${icon('loader-circle', 'bz-spin')}</span>` +
          `<span id="${t}"><span class="bz-band__lead">${this.label}</span>: <span class="bz-band__from">${this.from}</span> ${icon('arrow-right', 'g-icon--flip-rtl')} <span class="bz-band__to">${this.to}</span>.</span>` +
          `<span class="bz-band__note" data-slot="note">${this.note}</span>${cancel}</div>`
      }
      return `<div class="bz-sheet bz-visual bz-status" role="group" tabindex="-1" aria-labelledby="${t}">${this.sheetInner(t)}</div>`
    }

    // ---------------- Capa de cada concepto (superficie, diálogo, en línea) ----------------
    render () {
      const t = `${this.id}-t`
      const big = this.concept === 'C' && this.scope !== 'inline'
      const cancel = this.opts.cancelable ? `<button type="button" class="bz-cancel${big ? ' g-btn g-btn--color-neutral g-btn--variant-outline g-btn--size-sm g-btn--density-default' : ''}">${big ? `<span class="g-btn__label">${this.cancelLabel}</span>` : this.cancelLabel}</button>` : ''
      const host = this.surface
      let html = ''
      if (this.scope === 'inline') {
        // en línea: sin capa sobre nada; la leyenda reservada debajo de la fila dice la etapa y la espera larga
        const edge = this.concept === 'A' ? `<svg class="bz-edge bz-edge--own bz-visual" aria-hidden="true"><rect pathLength="100"/></svg>` : ''
        if (edge) { this.keep && this.keep.insertAdjacentHTML('beforeend', edge); this.edgeHost = this.keep }
        this.cap.innerHTML = `<span class="bz-layer bz-status bz-visual" role="group" tabindex="-1" aria-labelledby="${t}"><span id="${t}">${this.capText()}</span> ${cancel}</span>`
        this.layer = this.cap.firstElementChild
        this.status = this.layer
        this.edge = this.edgeHost ? this.edgeHost.querySelector('.bz-edge') : null
        if (this.edge) this.edge.closest('button').style.position = 'relative'
        this.bindLayer()
        return
      }
      if (this.concept === 'A') {
        html = `<div class="bz-layer"><svg class="bz-edge bz-visual" aria-hidden="true"><rect pathLength="100"/></svg>` +
          `<div class="bz-tab bz-visual bz-status" role="group" tabindex="-1" aria-labelledby="${t}"><span class="bz-tab__text" id="${t}">${this.tabText()}</span>${cancel}</div></div>`
        host.insertAdjacentHTML('beforeend', html)
        this.layer = host.lastElementChild
        // la capa es un envoltorio sin caja: los hijos se posicionan contra la superficie
        this.layer.style.display = 'contents'
        this.edge = this.layer.querySelector('.bz-edge')
        this.status = this.layer.querySelector('.bz-status')
      } else if (this.concept === 'B') {
        // congelar lo que se envía: la apariencia de solo lectura real de GInput (#165), sin moverse
        this.frozen = [...(this.content || host).querySelectorAll('.g-input')]
        for (const f of this.frozen) { f.classList.add('is-readonly'); if (f.classList.contains('is-changed')) f.querySelector('.g-input__control').classList.add('bz-sent') }
        const changed = this.frozen.filter((f) => f.classList.contains('is-changed')).map((f) => f.querySelector('.g-input__label').textContent)
        this.what = changed.join(', ')
        this.count = changed.length
        this.hidden = [...this.foot.querySelectorAll('.g-btn')].filter((b) => b !== this.keep)
        for (const b of this.hidden) b.classList.add('bz-hide')
        this.foot.style.position = 'relative'
        this.foot.insertAdjacentHTML('afterbegin', `<div class="bz-layer bz-line bz-visual bz-status" role="group" tabindex="-1" aria-labelledby="${t}"><span class="bz-line__icon">${icon('loader-circle', 'bz-spin')}</span><span class="bz-line__text" id="${t}">${this.lineText()}</span>${cancel}</div>`)
        this.layer = this.foot.firstElementChild
        this.status = this.layer
        this.layer.style.insetInlineEnd = `${this.keep ? this.keep.offsetWidth + 12 : 0}px`
      } else {
        host.insertAdjacentHTML('beforeend', `<div class="bz-layer bz-sheet bz-visual bz-status" role="group" tabindex="-1" aria-labelledby="${t}">${this.sheetInner(t, cancel)}</div>`)
        this.layer = host.lastElementChild
        this.status = this.layer
      }
      this.bindLayer()
      this.updateText()
    }
    bindLayer () {
      this.layer.addEventListener('click', (e) => { if (e.target.closest('.bz-cancel')) this.cancel() })
      const esc = (e) => { if (e.key === 'Escape' && this.active) { if (!this.dialog) { this.log('esc'); this.cancel() } } }
      this.escHandler = esc
      ;(this.lockRoot || this.surface).addEventListener('keydown', esc)
      // un clic sobre lo bloqueado no mueve el foco (sin esto, el navegador lo deja en body)
      // (también sobre el disparador: en WebKit un clic en un botón le quita el foco)
      this.downHandler = (e) => { if (this.active && !(this.layer && this.layer.contains(e.target) && e.target.closest('.bz-cancel'))) e.preventDefault() }
      ;(this.lockRoot || this.surface).addEventListener('mousedown', this.downHandler)
    }
    unrender (outcome) {
      ;(this.lockRoot || this.surface).removeEventListener('keydown', this.escHandler)
      ;(this.lockRoot || this.surface).removeEventListener('mousedown', this.downHandler)
      if (this.scope === 'inline') {
        if (this.edge) this.edge.remove()
        this.cap.innerHTML = ''
        return
      }
      if (this.concept === 'B') {
        for (const f of this.frozen) { f.classList.remove('is-readonly'); const c = f.querySelector('.bz-sent'); if (c) c.classList.remove('bz-sent') }
        if (outcome === 'ok') {
          // el recibo: «Cambios guardados» unos instantes en el mismo sitio, sin anunciar (el resultado lo anuncia el aviso)
          this.layer.classList.add('is-done')
          this.layer.removeAttribute('tabindex')
          this.layer.querySelector('.bz-line__icon').innerHTML = icon('circle-check')
          this.layer.querySelector('.bz-line__text').textContent = this.doneText
          const c = this.layer.querySelector('.bz-cancel'); if (c) c.remove()
          const layer = this.layer; const hidden = this.hidden
          setTimeout(() => { layer.remove(); for (const b of hidden) b.classList.remove('bz-hide') }, 1200)
          return
        }
        for (const b of this.hidden) b.classList.remove('bz-hide')
      }
      this.layer.remove()
    }

    // ---------------- Textos ----------------
    stepName () { return this.steps[this.stepIx] }
    tabText () {
      if (this.canceling) return this.cancelingLabel
      if (this.slow) return this.slowLabel.replace(/\.$/, '') + (this.opts.steps ? ` · ${this.stepName()}` : '')
      return this.opts.steps ? `${this.label} · ${this.stepName()}` : this.label
    }
    lineText () {
      if (this.canceling) return this.cancelingLabel
      if (!this.what) return this.slow ? this.slowLabel.replace(/\.$/, '') : this.label
      // corto a la vista («Guardando 2 cambios»); los nombres de lo que se envía, en el nombre accesible de la línea
      const head = this.slow ? this.slowShort : this.countLabel(this.count)
      return `${head}<span class="bz-sr">: ${this.what}</span>`
    }
    capText () {
      if (this.canceling) return this.cancelingLabel
      if (this.slow) return this.slowLabel
      return this.opts.steps ? `${this.label} · ${this.stepName()}` : this.label
    }
    sheetInner (t, cancel = this.opts.cancelable ? `<button type="button" class="bz-cancel g-btn g-btn--color-neutral g-btn--variant-outline g-btn--size-sm g-btn--density-default"><span class="g-btn__label">${this.cancelLabel}</span></button>` : '') {
      const list = this.opts.steps
        ? `<ol class="bz-steps">${this.steps.map((s, i) => `<li class="bz-step" data-i="${i}">${icon('circle')}<span>${s}</span></li>`).join('')}</ol>`
        : ''
      return `<div class="bz-sheet__head"><p class="bz-sheet__title" id="${t}">${this.label}</p>${cancel}</div>${list}<p class="bz-slow" hidden></p>`
    }
    updateText () {
      if (this.concept === 'A' && this.scope !== 'inline') { const el = this.status.querySelector('.bz-tab__text'); if (el && this.scope !== 'full') el.textContent = this.tabText(); else if (el) el.textContent = this.canceling ? this.cancelingLabel : (this.slow ? this.slowLabel.replace(/\.$/, '') : this.label) }
      if (this.scope === 'inline') { const el = this.status.querySelector('span'); if (el) el.textContent = this.capText() }
      if (this.concept === 'B' && this.scope !== 'inline') {
        if (this.scope === 'full') { const n = this.status.querySelector('[data-slot="note"]'); if (n) n.textContent = this.canceling ? this.cancelingLabel : (this.slow ? this.slowLabel : this.note) } else { const el = this.status.querySelector('.bz-line__text'); if (el) el.innerHTML = this.lineText() }
      }
      if (this.concept === 'C' && this.scope !== 'inline') {
        const title = this.status.querySelector('.bz-sheet__title'); if (title && this.canceling) title.textContent = this.cancelingLabel
        for (const li of this.status.querySelectorAll('.bz-step')) {
          const i = Number(li.dataset.i)
          const s = i < this.stepIx ? 'done' : i === this.stepIx ? 'now' : 'next'
          if (li.dataset.s === s) continue
          li.dataset.s = s
          li.querySelector('.g-icon').outerHTML = s === 'done' ? icon('check') : s === 'now' ? icon('loader-circle', 'bz-spin') : icon('circle')
          if (s === 'now') li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current')
        }
        const sl = this.status.querySelector('.bz-slow'); if (sl && this.slow) { sl.hidden = false; sl.textContent = this.slowText() }
      }
    }
    measureEdge () {
      const e = this.edge; if (!e) return
      const host = e.parentElement.classList.contains('bz-layer') ? this.surface : e.parentElement
      const r = e.getBoundingClientRect()
      const w = r.width; const h = r.height
      const rad = parseFloat(getComputedStyle(this.scope === 'full' ? document.body : host).borderStartStartRadius) || 0
      const sw = parseFloat(getComputedStyle(e.querySelector('rect')).strokeWidth) || 2
      const rect = e.querySelector('rect')
      rect.setAttribute('x', sw / 2); rect.setAttribute('y', sw / 2)
      rect.setAttribute('width', Math.max(0, w - sw)); rect.setAttribute('height', Math.max(0, h - sw))
      rect.setAttribute('rx', Math.max(0, rad - sw / 2))
    }
  }

  window.__BZ = { Busy, icon, btn, field, say, syncLive, spoken, reduced, Q }
})()
