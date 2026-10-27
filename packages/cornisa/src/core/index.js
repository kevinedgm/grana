/**
 * Núcleo sin DOM: máquina de estados, gestor de actividades y modelo físico de la gota.
 * @module cornisa/core
 */
export { transition, STATES, VISIBLE } from './machine.js';
export { createManager, normalize, systemClock, DEFAULT_DURATION, MAX_ACTIONS } from './manager.js';
export { Drop, silhouette, spring, SPRINGS } from './drop.js';
