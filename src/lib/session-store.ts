import { create } from "zustand";
import { useCharacterStore } from "@/lib/character-store";

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

/** Snapshot for one-tap undo of self resources */
export type UndoSnap = {
  hpCurrent: number;
  tempHp: number;
  bloodCurrent: number;
  beastUsed: number;
  luckyUsed: number;
  protectedUsed: number;
  label: string;
  at: number;
};

type SessionState = {
  lastRoll: LastRoll | null;
  setLastRoll: (r: LastRoll | null) => void;
  rollHistory: LastRoll[];
  effects: EffectTimer[];
  addEffect: (name: string, rounds: number | null, note?: string) => void;
  tickEffects: () => void;
  removeEffect: (id: string) => void;
  /** Quick session note (not persisted to character) */
  sessionNote: string;
  setSessionNote: (n: string) => void;
  /** Mobile: hide chrome, full play focus */
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
  /** Undo last resource change */
  undoStack: UndoSnap[];
  pushUndo: (label: string) => void;
  undo: () => boolean;
  clearUndo: () => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  lastRoll: null,
  rollHistory: [],
  setLastRoll: (r) =>
    set((s) => ({
      lastRoll: r,
      rollHistory: r ? [r, ...s.rollHistory].slice(0, 12) : s.rollHistory,
    })),
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
  sessionNote: "",
  setSessionNote: (n) => set({ sessionNote: n }),
  focusMode: (() => {
    try {
      return typeof localStorage !== "undefined" && localStorage.getItem("kindred-focus") === "1";
    } catch {
      return false;
    }
  })(),
  setFocusMode: (v) => {
    try {
      localStorage.setItem("kindred-focus", v ? "1" : "0");
    } catch {
      /* */
    }
    set({ focusMode: v });
  },
  undoStack: [],
  pushUndo: (label) => {
    const c = useCharacterStore.getState().character;
    set((s) => ({
      undoStack: [
        {
          hpCurrent: c.hpCurrent,
          tempHp: c.tempHp,
          bloodCurrent: c.bloodCurrent,
          beastUsed: c.beastUsed,
          luckyUsed: c.luckyUsed ?? 0,
          protectedUsed: c.protectedUsed ?? 0,
          label,
          at: Date.now(),
        },
        ...s.undoStack,
      ].slice(0, 12),
    }));
  },
  undo: () => {
    const stack = get().undoStack;
    if (stack.length === 0) return false;
    const [snap, ...rest] = stack;
    if (!snap) return false;
    useCharacterStore.getState().patch({
      hpCurrent: snap.hpCurrent,
      tempHp: snap.tempHp,
      bloodCurrent: snap.bloodCurrent,
      beastUsed: snap.beastUsed,
      luckyUsed: snap.luckyUsed,
      protectedUsed: snap.protectedUsed,
    });
    set({ undoStack: rest });
    return true;
  },
  clearUndo: () => set({ undoStack: [] }),
}));
