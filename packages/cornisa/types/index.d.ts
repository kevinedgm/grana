export type Intent = 'neutral' | 'success' | 'warning' | 'error';
export type Priority = 'low' | 'normal' | 'high';
export type State = 'queued' | 'entering' | 'compact' | 'expanded' | 'dismissing' | 'removed';

export interface Action {
  /** Texto del botón (verbo + objeto). */
  label: string;
  /** Se llama al pulsar. No descarta automáticamente: llama a `handle.dismiss()` si procede. */
  onSelect?: (handle: ActivityHandle) => void;
}

export interface ActivityOptions {
  /** Si ya existe una actividad con este id, `show()` equivale a `update()`. */
  id?: string;
  /** Obligatorio. Nombre accesible de la actividad. */
  title: string;
  body?: string | null;
  intent?: Intent;
  /** Nodo del consumidor (se clona). Nunca una cadena HTML. */
  icon?: Node | null;
  /** 0–100, 'indeterminate' o null para quitarlo. */
  progress?: number | 'indeterminate' | null;
  /** Cuenta atrás mostrada como mm:ss (role="timer"). */
  timer?: { endsAt: number } | null;
  /** Como máximo 2. */
  actions?: Action[];
  /** ms hasta autodescartar, o 'persistent'. Por defecto 5000; los errores son persistentes. */
  duration?: number | 'persistent';
  priority?: Priority;
}

export interface ActivityEvents {
  statechange: { state: State; previous: State };
  action: { index: number; label: string };
  dismiss: { reason: string | null };
}

export interface ActivityHandle {
  readonly id: string;
  readonly state: State;
  /** Actualiza la misma instancia. `null` borra un campo opcional. Devuelve false si ya se está descartando. */
  update(patch: Partial<ActivityOptions>): boolean;
  expand(): boolean;
  collapse(): boolean;
  /** Se resuelve cuando la actividad termina de retirarse. */
  dismiss(reason?: string): Promise<void>;
  on<K extends keyof ActivityEvents>(type: K, listener: (detail: ActivityEvents[K]) => void): () => void;
}

export interface Labels {
  close: string;
  more: (waiting: number) => string;
}

export interface IslandOptions {
  /** Dónde se insertan los nodos. Por defecto, document.body. */
  container?: HTMLElement;
  labels?: Partial<Labels>;
  /** ms mínimos entre anuncios corteses (por defecto 1000). */
  announceGap?: number;
  /**
   * Atajo opcional para llevar el foco a la isla y devolverlo (p. ej. "Alt+Shift+N").
   * Desactivado por defecto. Debe incluir Alt, Ctrl o Meta (WCAG 2.1.4).
   */
  shortcut?: string | null;
}

export interface PromiseMessages<T> {
  loading: string | ActivityOptions;
  success?: string | Partial<ActivityOptions> | ((value: T) => string | Partial<ActivityOptions>);
  error?: string | Partial<ActivityOptions> | ((error: unknown) => string | Partial<ActivityOptions>);
}

export interface IslandEvents {
  reservedchange: { height: number };
  error: unknown;
}

export interface Island {
  show(options: ActivityOptions): ActivityHandle;
  get(id: string): ActivityHandle | null;
  promise<T>(promise: Promise<T>, messages: PromiseMessages<T>): Promise<T>;
  dismissAll(reason?: string): Promise<void[]>;
  on<K extends keyof IslandEvents>(type: K, listener: (detail: IslandEvents[K]) => void): () => void;
  /** Quita nodos, listeners, temporizadores y la variable --cornisa-reserved. */
  destroy(): void;
  readonly destroyed: boolean;
  /**
   * @experimental INESTABLE. Acceso interno (gestor y renderer) pensado para pruebas y depuración.
   * No enumerable. Puede cambiar o desaparecer en cualquier versión, incluidas las de parche.
   * No forma parte del contrato semver.
   */
  readonly _internals: {
    manager: import('./core').Manager;
    renderer: { readonly running: boolean; readonly phase: string; readonly usesPopover: boolean; _debug(): Record<string, unknown> };
  };
}

export declare const DEFAULT_LABELS: Readonly<Labels>;
export declare function createIsland(options?: IslandOptions): Island;
export declare function parseShortcut(spec: string): { aria: string; matches(e: KeyboardEvent): boolean };
