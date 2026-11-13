/**
 * Port : file de jobs. Phase 1 : en mémoire ; pg-boss (intervalle ≥ 30 s) puis BullMQ (phase 2)
 * se brancheront derrière la même interface. Voir docs/decisions.md (risque Neon).
 */
export interface Queue {
  publish<T>(name: string, payload: T): Promise<void>;
  subscribe<T>(name: string, handler: (payload: T) => Promise<void>): void;
}

export const QUEUE = Symbol('QUEUE');
