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
  /** Initiative total for this enemy */
  init: number;
  /** Optional attack bonus for solo GM rolls */
  atkBonus: number;
  /** Damage expression e.g. 1d8+3 */
  damage: string;
};

export type EnemyTemplate = {
  name: string;
  hp: number;
  ac: number;
  notes: string;
  init?: number;
  atkBonus?: number;
  damage?: string;
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
  addEnemyFromTemplate: (t: EnemyTemplate) => void;
  updateEnemy: (id: string, partial: Partial<Enemy>) => void;
  removeEnemy: (id: string) => void;
  damageEnemy: (id: string, n: number) => void;
  clearEncounter: () => void;
  /** Quick session note (not persisted to character) */
  sessionNote: string;
  setSessionNote: (n: string) => void;
};

export const ENEMY_TEMPLATES: EnemyTemplate[] = [
  {
    name: "Горожанин",
    hp: 9,
    ac: 12,
    notes: "commoner · безоружный",
    init: 10,
    atkBonus: 2,
    damage: "1d4",
  },
  {
    name: "Страж",
    hp: 32,
    ac: 16,
    notes: "guard · копьё/меч",
    init: 11,
    atkBonus: 5,
    damage: "1d8+3",
  },
  {
    name: "Охотник",
    hp: 45,
    ac: 15,
    notes: "hunter · stake ready · silver",
    init: 14,
    atkBonus: 6,
    damage: "1d10+3",
  },
  {
    name: "Волк",
    hp: 22,
    ac: 13,
    notes: "wolf · pack tactics",
    init: 12,
    atkBonus: 4,
    damage: "2d4+2",
  },
  {
    name: "Рыцарь",
    hp: 52,
    ac: 18,
    notes: "knight · heavy armor",
    init: 10,
    atkBonus: 7,
    damage: "2d6+4",
  },
  {
    name: "Сородич-враг",
    hp: 58,
    ac: 15,
    notes: "kindred · blood pool · fire vuln",
    init: 13,
    atkBonus: 6,
    damage: "1d8+3",
  },
  {
    name: "Жрец",
    hp: 27,
    ac: 13,
    notes: "cleric · radiant · turn undead",
    init: 10,
    atkBonus: 5,
    damage: "1d8+2",
  },
  {
    name: "Маг",
    hp: 22,
    ac: 12,
    notes: "mage · fire bolt · shield",
    init: 12,
    atkBonus: 5,
    damage: "1d10",
  },
  {
    name: "Гончая",
    hp: 16,
    ac: 13,
    notes: "mastiff · pack",
    init: 12,
    atkBonus: 3,
    damage: "1d6+1",
  },
];


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
          init: 10,
          atkBonus: 4,
          damage: "1d6+2",
        },
      ],
    })),
  addEnemyFromTemplate: (t) =>
    set((s) => ({
      enemies: [
        ...s.enemies,
        {
          id: `en-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: t.name,
          hp: t.hp,
          hpMax: t.hp,
          ac: t.ac,
          notes: t.notes,
          init: t.init ?? 10,
          atkBonus: t.atkBonus ?? 4,
          damage: t.damage ?? "1d6+2",
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
        e.id === id ? { ...e, hp: Math.max(0, Math.min(e.hpMax + 50, e.hp - n)) } : e,
      ),
    })),
  clearEncounter: () => set({ enemies: [], effects: [] }),
  sessionNote: "",
  setSessionNote: (n) => set({ sessionNote: n }),
}));
