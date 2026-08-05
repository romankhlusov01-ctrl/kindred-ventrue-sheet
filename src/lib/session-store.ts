import { create } from "zustand";

/** Ephemeral session UI state (not in character save) */
export type LastRoll = {
  label: string;
  total: number;
  detail: string;
  at: number;
};

export type EffectTimer = {
  id: string;
  name: string;
  roundsLeft: number | null; // null = until rest / manual
  note: string;
};

export type Enemy = {
  id: string;
  name: string;
  hp: number;
  hpMax: number;
  ac: number;
  notes: string;
};

type SessionState = {
  lastRoll: LastRoll | null;
  setLastRoll: (r: LastRoll | null) => void;
  effects: EffectTimer[];
  addEffect: (name: string, rounds: number | null, note?: string) => void;
  tickEffects: () => void;
  removeEffect: (id: string) => void;
  enemies: Enemy[];
  addEnemy: () => void;
  updateEnemy: (id: string, partial: Partial<Enemy>) => void;
  removeEnemy: (id: string) => void;
  damageEnemy: (id: string, n: number) => void;
  clearEncounter: () => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  lastRoll: null,
  setLastRoll: (r) => set({ lastRoll: r }),
  effects: [],
  addEffect: (name, rounds, note = "") =>
    set((s) => ({
      effects: [
        {
          id: `fx-${Date.now()}`,
          name,
          roundsLeft: rounds,
          note,
        },
        ...s.effects,
      ].slice(0, 20),
    })),
  tickEffects: () =>
    set((s) => ({
      effects: s.effects
        .map((e) =>
          e.roundsLeft == null
            ? e
            : { ...e, roundsLeft: e.roundsLeft - 1 },
        )
        .filter((e) => e.roundsLeft == null || e.roundsLeft > 0),
    })),
  removeEffect: (id) =>
    set((s) => ({ effects: s.effects.filter((e) => e.id !== id) })),
  enemies: [],
  addEnemy: () =>
    set((s) => ({
      enemies: [
        ...s.enemies,
        {
          id: `en-${Date.now()}`,
          name: `Враг ${s.enemies.length + 1}`,
          hp: 20,
          hpMax: 20,
          ac: 13,
          notes: "",
        },
      ],
    })),
  updateEnemy: (id, partial) =>
    set((s) => ({
      enemies: s.enemies.map((e) => (e.id === id ? { ...e, ...partial } : e)),
    })),
  removeEnemy: (id) =>
    set((s) => ({ enemies: s.enemies.filter((e) => e.id !== id) })),
  damageEnemy: (id, n) =>
    set((s) => ({
      enemies: s.enemies.map((e) =>
        e.id === id ? { ...e, hp: Math.max(0, e.hp - n) } : e,
      ),
    })),
  clearEncounter: () => set({ enemies: [], effects: [] }),
}));
