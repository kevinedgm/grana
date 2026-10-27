import type { ActivityHandle, ActivityOptions, State } from './index';

export interface Clock {
  now(): number;
  setTimeout(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
}
export interface Snapshot {
  primary: { id: string; state: State; content: Required<ActivityOptions> } | null;
  waiting: number;
}
export interface Manager {
  show(options: ActivityOptions): ActivityHandle;
  get(id: string): ActivityHandle | null;
  dismissAll(reason?: string): Promise<void[]>;
  cycle(): boolean;
  ack(id: string, what: 'entered' | 'removed'): void;
  invokeAction(id: string, index: number): void;
  snapshot(): Snapshot;
  setPaused(reason: 'hover' | 'focus' | 'hidden', value: boolean): void;
  setPinned(value: boolean): void;
  setAutoAck(value: boolean): void;
  on(type: 'change', fn: (s: Snapshot) => void): () => void;
  on(type: 'announce', fn: (a: { politeness: 'polite' | 'assertive'; text: string }) => void): () => void;
  on(type: 'error', fn: (e: unknown) => void): () => void;
  destroy(): void;
  readonly destroyed: boolean;
}
export declare function createManager(options?: { clock?: Clock; announceGap?: number }): Manager;
export declare function transition(state: string, event: string): string | null;
export declare const STATES: readonly State[];
export declare const VISIBLE: readonly State[];
export declare const systemClock: Clock;
export declare const DEFAULT_DURATION: number;
export declare const MAX_ACTIONS: number;
export declare function normalize(input: Record<string, unknown>, prev: Record<string, unknown> | null): Record<string, unknown>;
export interface Dims { compactW: number; compactH: number; expandedW: number; expandedH: number }
export declare class Drop {
  h: { x: number; v: number; t: number };
  w: { x: number; v: number; t: number };
  sag: number;
  phase: string;
  d: Dims | null;
  /** Tiempo simulado acumulado en segundos. */
  t: number;
  readonly visible: boolean;
  readonly busy: boolean;
  readonly expandedShape: boolean;
  show(d: Dims): void;
  swap(d: Dims): void;
  expand(): boolean;
  collapse(): boolean;
  retract(): boolean;
  resize(d: Dims): void;
  step(dt: number): void;
  snap(): void;
  drain(): string[];
}
export declare function silhouette(cx: number, w: number, h: number, sag: number, expanded: boolean, radiusExpanded?: number): string;
export declare function spring(response: number, bounce: number): { k: number; c: number };
export declare const SPRINGS: Readonly<Record<string, { k: number; c: number }>>;
