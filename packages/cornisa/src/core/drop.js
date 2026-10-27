/**
 * Modelo físico de la gota (Top-Edge Droplet, ronda r02 aprobada).
 * Puro: sin DOM. Integra dos muelles (alto y ancho) y una curvatura inferior
 * por inercia; genera la silueta como path SVG anclado a y = 0.
 * @module cornisa/core/drop
 */

/**
 * Muelle con la forma response/bounce: k = (2π/response)², c = 4π(1−bounce)/response (masa 1).
 * @param {number} response segundos
 * @param {number} bounce 0..1
 */
export function spring(response, bounce) {
  return { k: (2 * Math.PI / response) ** 2, c: 4 * Math.PI * (1 - bounce) / response };
}

export const SPRINGS = Object.freeze({
  hBirth: spring(0.46, 0.28),
  wBirth: spring(0.50, 0.22),
  hExpand: spring(0.42, 0.18),
  wExpand: spring(0.40, 0.12),
  hExit: spring(0.26, 0),
  wExit: spring(0.22, 0),
});

export const SEED_W = 30;
export const FILLET = 12;
export const CONTENT_HOLD = 0.12; // s: el contenido se recoge antes de que la silueta se mueva

const RETRACTING = ['retract0', 'retract1', 'retract2'];

/**
 * @typedef {{ compactW: number, compactH: number, expandedW: number, expandedH: number, cx?: number, radius?: number, top?: number, vw?: number, scroll?: boolean }} Dims
 */

export class Drop {
  constructor() {
    this.h = { x: 0, v: 0, t: 0, cfg: SPRINGS.hBirth };
    this.w = { x: 0, v: 0, t: 0, cfg: SPRINGS.wBirth };
    this.sag = 0;
    /** @type {string} */
    this.phase = 'empty';
    this.hold = 0;
    /** @type {Dims|null} */
    this.d = null;
    /** @type {string[]} */
    this.events = [];
    /** Tiempo simulado acumulado (s): permite medir continuidad sin depender del reloj de pantalla. */
    this.t = 0;
  }

  /** @private */
  _set(axis, target, cfg) { this[axis].t = target; this[axis].cfg = cfg; }

  get visible() { return this.phase !== 'empty' && this.phase !== 'gone'; }
  get expandedShape() {
    return this.phase === 'expanding' || this.phase === 'expanded' || this.phase === 'collapsing' ||
      (this.phase === 'contracting' && this.d !== null && this.h.x > this.d.compactH + 4);
  }

  /** @param {Dims} d */
  show(d) {
    this.d = d;
    if (!this.visible) { this.h.x = 0; this.w.x = SEED_W * 0.4; this.h.v = 0; this.w.v = 0; this.sag = 0; }
    this.phase = 'birth';
    this._set('h', d.compactH, SPRINGS.hBirth);
    this._set('w', SEED_W, SPRINGS.wBirth);
  }

  /** Cambia de contenido sin retirarse: el contenido se recoge y la silueta se reajusta. @param {Dims} d */
  swap(d) {
    if (!this.visible || RETRACTING.includes(this.phase)) { this.show(d); return; }
    this.d = d; this.phase = 'swapping'; this.hold = CONTENT_HOLD;
  }

  expand() {
    if (!['rest', 'settling', 'birth', 'contracting'].includes(this.phase) || !this.d) return false;
    this.phase = 'expanding';
    this._set('w', this.d.expandedW, SPRINGS.wExpand);
    this._set('h', this.d.expandedH, SPRINGS.hExpand);
    return true;
  }

  collapse() {
    if (this.phase !== 'expanded' && this.phase !== 'expanding') return false;
    this.phase = 'collapsing'; this.hold = CONTENT_HOLD; return true;
  }

  retract() {
    if (!this.visible || RETRACTING.includes(this.phase)) return false;
    this.phase = 'retract0'; this.hold = CONTENT_HOLD; return true;
  }

  /** Contenido actualizado o viewport cambiado. @param {Dims} d */
  resize(d) {
    this.d = d;
    if (['rest', 'settling', 'contracting'].includes(this.phase)) {
      this._set('w', d.compactW, SPRINGS.wExpand); this._set('h', d.compactH, SPRINGS.hExpand); this.phase = 'settling';
    } else if (this.phase === 'expanded' || this.phase === 'expanding') {
      this._set('w', d.expandedW, SPRINGS.wExpand); this._set('h', d.expandedH, SPRINGS.hExpand); this.phase = 'expanding';
    } else if (this.phase === 'birth') {
      this._set('h', d.compactH, SPRINGS.hBirth);
    }
  }

  /** @private */
  _integrate(s, dt) { const a = -s.cfg.k * (s.x - s.t) - s.cfg.c * s.v; s.v += a * dt; s.x += s.v * dt; }
  /** @private */
  _atRest(s) { return Math.abs(s.x - s.t) < 0.25 && Math.abs(s.v) < 4; }

  /** @param {number} dt segundos (se recomienda ≤ 1/240) */
  step(dt) {
    const d = this.d;
    if (!d) return;
    this.t += dt;
    if (this.hold > 0) {
      this.hold -= dt;
      if (this.hold <= 0) {
        this.hold = 0;
        if (this.phase === 'collapsing') { this._set('w', d.compactW, SPRINGS.wExpand); this._set('h', d.compactH, SPRINGS.hExpand); this.phase = 'contracting'; }
        else if (this.phase === 'swapping') { this.events.push('swapped'); this._set('w', d.compactW, SPRINGS.wExpand); this._set('h', d.compactH, SPRINGS.hExpand); this.phase = 'settling'; }
        else if (this.phase === 'retract0') { this._set('w', SEED_W, SPRINGS.wExit); this._set('h', Math.min(this.h.x, d.compactH), SPRINGS.hExit); this.phase = 'retract1'; }
      }
    }
    this._integrate(this.h, dt); this._integrate(this.w, dt);
    if (this.h.x < 0) { this.h.x = 0; this.h.v = Math.max(0, this.h.v); } // nunca por encima del borde
    if (this.w.x < 0) this.w.x = 0;
    const target = Math.max(-5, Math.min(14, Math.abs(this.h.v) * 0.022));
    this.sag += (target - this.sag) * Math.min(1, dt * 18);

    if (this.phase === 'birth' && this.h.x >= d.compactH * 0.55) { this._set('w', d.compactW, SPRINGS.wBirth); this.phase = 'settling'; }
    if ((this.phase === 'settling' || this.phase === 'contracting') && this._atRest(this.h) && this._atRest(this.w)) { this.phase = 'rest'; this.events.push('rest'); }
    if (this.phase === 'expanding' && this._atRest(this.h) && this._atRest(this.w)) { this.phase = 'expanded'; this.events.push('expanded'); }
    if (this.phase === 'retract1' && this.w.x <= SEED_W + 8) { this._set('h', 0, SPRINGS.hExit); this._set('w', 0, SPRINGS.wExit); this.phase = 'retract2'; }
    if (this.phase === 'retract2' && this.h.x < 0.6) {
      this.h.x = this.w.x = this.h.v = this.w.v = this.sag = 0; this.phase = 'gone'; this.events.push('gone');
    }
  }

  /** Movimiento reducido: salta al estado estable de la fase actual. */
  snap() {
    const d = this.d; this.hold = 0; this.sag = 0; this.h.v = this.w.v = 0;
    if (!d) return;
    if (['birth', 'settling', 'collapsing', 'contracting', 'swapping', 'rest'].includes(this.phase)) {
      if (this.phase === 'swapping') this.events.push('swapped');
      this.h.x = this.h.t = d.compactH; this.w.x = this.w.t = d.compactW;
      if (this.phase !== 'rest') { this.phase = 'rest'; this.events.push('rest'); }
    } else if (this.phase === 'expanding' || this.phase === 'expanded') {
      this.h.x = this.h.t = d.expandedH; this.w.x = this.w.t = d.expandedW;
      if (this.phase !== 'expanded') { this.phase = 'expanded'; this.events.push('expanded'); }
    } else if (RETRACTING.includes(this.phase)) {
      this.h.x = this.w.x = this.h.t = this.w.t = 0; this.phase = 'gone'; this.events.push('gone');
    }
  }

  /** ¿Necesita más frames? */
  get busy() { return !['empty', 'gone', 'rest', 'expanded'].includes(this.phase); }

  /** @returns {string[]} eventos pendientes (y los vacía) */
  drain() { return this.events.splice(0); }
}

/**
 * Silueta: un único path cerrado cuyo borde superior está en y = 0 (y se extiende a y = −2).
 * @param {number} cx centro horizontal
 * @param {number} w ancho
 * @param {number} h alto
 * @param {number} sag curvatura inferior
 * @param {boolean} expanded esquinas de expandido
 * @param {number} [radiusExpanded=24]
 * @returns {string}
 */
export function silhouette(cx, w, h, sag, expanded, radiusExpanded = 24) {
  if (h < 0.4 || w < 0.4) return '';
  const R = expanded ? Math.min(radiusExpanded, h / 2, w / 2) : Math.min(h, w) / 2;
  const f = Math.max(0, Math.min(FILLET, h - R, w * 0.6));
  const L = cx - w / 2, Rt = cx + w / 2, k = 0.5523;
  const flat = Math.max(0, w - 2 * R), s = sag * Math.min(1, flat / 24), mid = flat / 3;
  const n = (v) => (Math.round(v * 100) / 100).toString();
  return `M${n(L - f)} -2L${n(L - f)} 0Q${n(L)} 0 ${n(L)} ${n(f)}L${n(L)} ${n(h - R)}`
    + `C${n(L)} ${n(h - R + k * R)} ${n(L + R - k * R)} ${n(h)} ${n(L + R)} ${n(h)}`
    + `C${n(L + R + mid)} ${n(h + s)} ${n(Rt - R - mid)} ${n(h + s)} ${n(Rt - R)} ${n(h)}`
    + `C${n(Rt - R + k * R)} ${n(h)} ${n(Rt)} ${n(h - R + k * R)} ${n(Rt)} ${n(h - R)}`
    + `L${n(Rt)} ${n(f)}Q${n(Rt)} 0 ${n(Rt + f)} 0L${n(Rt + f)} -2Z`;
}
