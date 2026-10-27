/**
 * Máquina de estados de una actividad. Pura: sin DOM, sin tiempo.
 * Estados públicos: queued · entering · compact · expanded · dismissing · removed.
 * @module cornisa/core/machine
 */

/** @type {Readonly<Record<string, Readonly<Record<string, string>>>>} */
const TABLE = Object.freeze({
  queued:     Object.freeze({ promote: 'entering', dismiss: 'removed', update: 'queued' }),
  entering:   Object.freeze({ entered: 'compact', expand: 'expanded', dismiss: 'dismissing', update: 'entering', demote: 'queued' }),
  compact:    Object.freeze({ expand: 'expanded', dismiss: 'dismissing', update: 'compact', demote: 'queued' }),
  expanded:   Object.freeze({ collapse: 'compact', dismiss: 'dismissing', update: 'expanded', demote: 'queued' }),
  dismissing: Object.freeze({ removed: 'removed' }),
  removed:    Object.freeze({}),
});

export const STATES = Object.freeze(Object.keys(TABLE));

/**
 * @param {string} state
 * @param {string} event
 * @returns {string|null} siguiente estado, o null si la transición no está permitida
 */
export function transition(state, event) {
  const row = TABLE[state];
  return (row && Object.prototype.hasOwnProperty.call(row, event)) ? row[event] : null;
}

/** Estados en los que la actividad ocupa la superficie visible. */
export const VISIBLE = Object.freeze(['entering', 'compact', 'expanded', 'dismissing']);
