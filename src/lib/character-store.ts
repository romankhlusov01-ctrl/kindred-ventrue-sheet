import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClanId } from "@/data/kindred";
import { getLevelData } from "@/data/kindred-ru";
import type { ProfLevel, SkillId } from "@/data/skills";
import { BLANK_TEMPLATE, PRESET_VENTRUE_PLAYER } from "@/data/presets";
import type { RollMode } from "@/lib/roll-engine";

export type Abilities = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
};

export type Attack = {
  id: string;
  name: string;
  bonus: number;
  damage: string;
  type: string;
  notes: string;
};

export type CustomResource = {
  id: string;
  name: string;
  current: number;
  max: number;
  note: string;
};

export type LogEntry = {
  id: string;
  at: number;
  text: string;
};

export type CharacterSheet = {
  id: string;
  name: string;
  player: string;
  clan: ClanId;
  level: number;
  background: string;
  backgroundId: string;
  species: string;
  alignment: string;
  abilities: Abilities;
  hpCurrent: number;
  hpMax: number;
  tempHp: number;
  ac: number;
  speed: number;
  bloodCurrent: number;
  beastUsed: number;
  hunger: boolean;
  preferredBlood: string;
  skillProfs: Partial<Record<SkillId, ProfLevel>>;
  saveProfs: Partial<Record<keyof Abilities, boolean>>;
  selectedFeats: string[];
  feats: string;
  equipment: string;
  notes: string;
  multiclass: string;
  attacks: Attack[];
  conditions: string[];
  deathSuccess: number;
  deathFail: number;
  inspiration: boolean;
  concentrating: string;
  voiceUses: number;
  hitDiceUsed: number;
  sessionLog: LogEntry[];
  customResources: CustomResource[];
  originFeatId: string;
  backgroundFeatId: string;
  luckyUsed: number;
  protectedUsed: number;
  humanSkill: SkillId | "";
  /** Solo combat session */
  actionUsed: boolean;
  bonusUsed: boolean;
  reactionUsed: boolean;
  movementUsed: boolean;
  /** Beast advantage active until end of turn / clear */
  beastActive: boolean;
  /** Sticky dice mode for next rolls */
  rollMode: RollMode;
  /** Last initiative total */
  initiative: number | null;
  /** Consume next roll as adv then clear (Lucky one-shot without sticky) */
  pendingAdv: boolean;
  pendingDis: boolean;
};

type LibraryState = {
  activeId: string;
  characters: CharacterSheet[];
  character: CharacterSheet;
  setActive: (id: string) => void;
  addCharacter: (sheet?: CharacterSheet) => void;
  deleteCharacter: (id: string) => void;
  setField: <K extends keyof CharacterSheet>(key: K, value: CharacterSheet[K]) => void;
  setAbility: (key: keyof Abilities, value: number) => void;
  setSkillProf: (id: SkillId, level: ProfLevel) => void;
  toggleSave: (key: keyof Abilities) => void;
  toggleCondition: (c: string) => void;
  toggleFeat: (featId: string) => void;
  patch: (partial: Partial<CharacterSheet>) => void;
  spendBlood: (n?: number) => void;
  gainBlood: (n?: number) => void;
  fillBlood: () => void;
  useBeast: () => void;
  resetBeast: () => void;
  adjustHp: (delta: number) => void;
  shortRest: () => void;
  longRest: () => void;
  addAttack: () => void;
  updateAttack: (id: string, partial: Partial<Attack>) => void;
  removeAttack: (id: string) => void;
  addLog: (text: string) => void;
  loadCharacter: (data: CharacterSheet) => void;
  importLibrary: (chars: CharacterSheet[], activeId?: string) => void;
  exportLibrary: () => { activeId: string; characters: CharacterSheet[] };
  updateResource: (id: string, partial: Partial<CustomResource>) => void;
  addResource: () => void;
  removeResource: (id: string) => void;
  spendLucky: () => boolean;
  spendProtected: () => boolean;
  restoreLuck: () => void;
  /** Solo helpers */
  activateBeast: () => boolean;
  clearBeast: () => void;
  newTurn: () => void;
  setRollMode: (m: RollMode) => void;
  consumeRollMode: () => RollMode;
  markDeathSuccess: () => void;
  markDeathFail: () => void;
  resetDeathSaves: () => void;
  spendHitDie: () => number | null;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function bpMax(level: number, con: number, selectedFeats: string[]) {
  let max = getLevelData(level).bp;
  if (selectedFeats.includes("vitae-conc")) {
    max += Math.max(1, Math.floor((con - 10) / 2));
  }
  if (selectedFeats.includes("boon-gen")) max += 5;
  return max;
}

function migrateSheet(raw: Partial<CharacterSheet> | null | undefined): CharacterSheet {
  const base = BLANK_TEMPLATE();
  if (!raw) return base;
  return {
    ...base,
    ...raw,
    id: raw.id || base.id,
    abilities: { ...base.abilities, ...raw.abilities },
    skillProfs: { ...raw.skillProfs },
    saveProfs: { con: true, cha: true, ...raw.saveProfs },
    selectedFeats: raw.selectedFeats ?? [],
    attacks: raw.attacks ?? [],
    conditions: raw.conditions ?? [],
    sessionLog: raw.sessionLog ?? [],
    customResources: raw.customResources ?? [],
    backgroundId: raw.backgroundId ?? base.backgroundId,
    originFeatId: raw.originFeatId ?? base.originFeatId,
    backgroundFeatId: raw.backgroundFeatId ?? base.backgroundFeatId,
    luckyUsed: raw.luckyUsed ?? 0,
    protectedUsed: raw.protectedUsed ?? 0,
    humanSkill: raw.humanSkill ?? base.humanSkill,
    actionUsed: raw.actionUsed ?? false,
    bonusUsed: raw.bonusUsed ?? false,
    reactionUsed: raw.reactionUsed ?? false,
    movementUsed: raw.movementUsed ?? false,
    beastActive: raw.beastActive ?? false,
    rollMode: raw.rollMode ?? "norm",
    initiative: raw.initiative ?? null,
    pendingAdv: raw.pendingAdv ?? false,
    pendingDis: raw.pendingDis ?? false,
  };
}

function updateActive(
  state: { activeId: string; characters: CharacterSheet[] },
  updater: (c: CharacterSheet) => CharacterSheet,
): { activeId: string; characters: CharacterSheet[]; character: CharacterSheet } {
  const characters = state.characters.map((c) =>
    c.id === state.activeId ? updater(c) : c,
  );
  const character = characters.find((c) => c.id === state.activeId) ?? characters[0]!;
  return { activeId: character.id, characters, character };
}

const initial = (() => {
  const ventrue = migrateSheet(PRESET_VENTRUE_PLAYER);
  return {
    activeId: ventrue.id,
    characters: [ventrue],
    character: ventrue,
  };
})();

export const useCharacterStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      ...initial,
      setActive: (id) =>
        set((s) => {
          const character = s.characters.find((c) => c.id === id);
          if (!character) return s;
          return { activeId: id, character };
        }),
      addCharacter: (sheet) =>
        set((s) => {
          const next = migrateSheet(sheet ?? BLANK_TEMPLATE());
          return {
            characters: [...s.characters, next],
            activeId: next.id,
            character: next,
          };
        }),
      deleteCharacter: (id) =>
        set((s) => {
          if (s.characters.length <= 1) return s;
          const characters = s.characters.filter((c) => c.id !== id);
          const activeId = s.activeId === id ? characters[0]!.id : s.activeId;
          const character = characters.find((c) => c.id === activeId)!;
          return { characters, activeId, character };
        }),
      setField: (key, value) =>
        set((s) => updateActive(s, (c) => ({ ...c, [key]: value }))),
      setAbility: (key, value) =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            abilities: { ...c.abilities, [key]: clamp(value, 1, 30) },
          })),
        ),
      setSkillProf: (id, level) =>
        set((s) =>
          updateActive(s, (c) => {
            const skillProfs = { ...c.skillProfs };
            if (level === "none") delete skillProfs[id];
            else skillProfs[id] = level;
            return { ...c, skillProfs };
          }),
        ),
      toggleSave: (key) =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            saveProfs: { ...c.saveProfs, [key]: !c.saveProfs[key] },
          })),
        ),
      toggleCondition: (cond) =>
        set((s) =>
          updateActive(s, (c) => {
            const has = c.conditions.includes(cond);
            return {
              ...c,
              conditions: has
                ? c.conditions.filter((x) => x !== cond)
                : [...c.conditions, cond],
              hunger: cond === "Голод" ? !has : c.hunger,
            };
          }),
        ),
      toggleFeat: (featId) =>
        set((s) =>
          updateActive(s, (c) => {
            const has = c.selectedFeats.includes(featId);
            return {
              ...c,
              selectedFeats: has
                ? c.selectedFeats.filter((x) => x !== featId)
                : [...c.selectedFeats, featId],
            };
          }),
        ),
      patch: (partial) =>
        set((s) => updateActive(s, (c) => ({ ...c, ...partial }))),
      spendBlood: (n = 1) =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            bloodCurrent: Math.max(0, c.bloodCurrent - n),
          })),
        ),
      gainBlood: (n = 1) =>
        set((s) =>
          updateActive(s, (c) => {
            const max = bpMax(c.level, c.abilities.con, c.selectedFeats);
            return { ...c, bloodCurrent: Math.min(max, c.bloodCurrent + n) };
          }),
        ),
      fillBlood: () =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            bloodCurrent: bpMax(c.level, c.abilities.con, c.selectedFeats),
          })),
        ),
      useBeast: () =>
        set((s) =>
          updateActive(s, (c) => {
            const pb = getLevelData(c.level).pb;
            return { ...c, beastUsed: Math.min(pb, c.beastUsed + 1) };
          }),
        ),
      resetBeast: () =>
        set((s) => updateActive(s, (c) => ({ ...c, beastUsed: 0 }))),
      adjustHp: (delta) =>
        set((s) =>
          updateActive(s, (c) => {
            const next = clamp(c.hpCurrent + delta, 0, Math.max(c.hpMax + 100, 0));
            // Kindred auto-success death saves at 0 — still track if user wants
            return { ...c, hpCurrent: next };
          }),
        ),
      shortRest: () =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            beastUsed: 0,
            beastActive: false,
            voiceUses: 0,
            actionUsed: false,
            bonusUsed: false,
            reactionUsed: false,
            movementUsed: false,
            customResources: c.customResources.map((r) =>
              /голос|пакт|коротк|voice|pact|short/i.test(r.name + r.note)
                ? { ...r, current: r.max }
                : r,
            ),
            sessionLog: [
              { id: `log-${Date.now()}`, at: Date.now(), text: "Короткий отдых" },
              ...c.sessionLog,
            ].slice(0, 80),
          })),
        ),
      longRest: () =>
        set((s) =>
          updateActive(s, (c) => {
            const hasBlood = c.bloodCurrent >= 1;
            return {
              ...c,
              hpCurrent: hasBlood ? c.hpMax : c.hpCurrent,
              tempHp: 0,
              beastUsed: 0,
              beastActive: false,
              voiceUses: 0,
              luckyUsed: 0,
              protectedUsed: 0,
              inspiration: true,
              hitDiceUsed: hasBlood ? 0 : c.hitDiceUsed,
              deathSuccess: 0,
              deathFail: 0,
              actionUsed: false,
              bonusUsed: false,
              reactionUsed: false,
              movementUsed: false,
              concentrating: hasBlood ? "" : c.concentrating,
              customResources: c.customResources.map((r) => ({ ...r, current: r.max })),
              sessionLog: [
                {
                  id: `log-${Date.now()}`,
                  at: Date.now(),
                  text: hasBlood
                    ? "Продолжительный отдых (≥1 ОБК) — хиты, HD, удача, вдохновение"
                    : "Продолжительный отдых БЕЗ ОБК — только короткий (Awaken)",
                },
                ...c.sessionLog,
              ].slice(0, 80),
            };
          }),
        ),
      addAttack: () =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            attacks: [
              ...c.attacks,
              {
                id: `atk-${Date.now()}`,
                name: "Новая атака",
                bonus: 0,
                damage: "1d6",
                type: "Рубящий",
                notes: "",
              },
            ],
          })),
        ),
      updateAttack: (id, partial) =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            attacks: c.attacks.map((a) => (a.id === id ? { ...a, ...partial } : a)),
          })),
        ),
      removeAttack: (id) =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            attacks: c.attacks.filter((a) => a.id !== id),
          })),
        ),
      addLog: (text) =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            sessionLog: [
              { id: `log-${Date.now()}`, at: Date.now(), text },
              ...c.sessionLog,
            ].slice(0, 80),
          })),
        ),
      loadCharacter: (data) =>
        set((s) => {
          const next = migrateSheet(data);
          const exists = s.characters.some((c) => c.id === next.id);
          const characters = exists
            ? s.characters.map((c) => (c.id === next.id ? next : c))
            : [...s.characters, next];
          return { characters, activeId: next.id, character: next };
        }),
      importLibrary: (chars, activeId) => {
        const characters = chars.map(migrateSheet);
        if (!characters.length) return;
        const id =
          activeId && characters.some((c) => c.id === activeId)
            ? activeId
            : characters[0]!.id;
        set({
          characters,
          activeId: id,
          character: characters.find((c) => c.id === id)!,
        });
      },
      exportLibrary: () => {
        const s = get();
        return { activeId: s.activeId, characters: s.characters };
      },
      updateResource: (id, partial) =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            customResources: c.customResources.map((r) =>
              r.id === id ? { ...r, ...partial } : r,
            ),
          })),
        ),
      addResource: () =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            customResources: [
              ...c.customResources,
              {
                id: `res-${Date.now()}`,
                name: "Ресурс",
                current: 1,
                max: 1,
                note: "",
              },
            ],
          })),
        ),
      removeResource: (id) =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            customResources: c.customResources.filter((r) => r.id !== id),
          })),
        ),
      spendLucky: () => {
        const c = get().character;
        const pb = getLevelData(c.level).pb;
        if (c.luckyUsed >= pb) return false;
        set((s) => updateActive(s, (ch) => ({ ...ch, luckyUsed: ch.luckyUsed + 1 })));
        return true;
      },
      spendProtected: () => {
        const c = get().character;
        const pb = getLevelData(c.level).pb;
        if (c.protectedUsed >= pb) return false;
        set((s) =>
          updateActive(s, (ch) => ({ ...ch, protectedUsed: ch.protectedUsed + 1 })),
        );
        return true;
      },
      restoreLuck: () =>
        set((s) => updateActive(s, (c) => ({ ...c, luckyUsed: 0, protectedUsed: 0 }))),
      activateBeast: () => {
        const c = get().character;
        const pb = getLevelData(c.level).pb;
        if (c.beastUsed >= pb) return false;
        set((s) =>
          updateActive(s, (ch) => ({
            ...ch,
            beastUsed: ch.beastUsed + 1,
            beastActive: true,
            pendingAdv: true,
          })),
        );
        return true;
      },
      clearBeast: () =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            beastActive: false,
            pendingAdv: false,
          })),
        ),
      newTurn: () =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            actionUsed: false,
            bonusUsed: false,
            reactionUsed: false,
            movementUsed: false,
            beastActive: false,
            pendingAdv: false,
            pendingDis: false,
            sessionLog: [
              {
                id: `log-${Date.now()}`,
                at: Date.now(),
                text: "— Новый ход —",
              },
              ...c.sessionLog,
            ].slice(0, 80),
          })),
        ),
      setRollMode: (m) =>
        set((s) => updateActive(s, (c) => ({ ...c, rollMode: m }))),
      consumeRollMode: () => {
        const c = get().character;
        let mode: RollMode = c.rollMode;
        if (c.beastActive || c.pendingAdv) {
          mode = mode === "dis" ? "norm" : "adv";
        }
        if (c.pendingDis && !c.beastActive && !c.pendingAdv) {
          mode = mode === "adv" ? "norm" : "dis";
        }
        // Clear one-shots; beast stays until new turn unless user clears
        set((s) =>
          updateActive(s, (ch) => ({
            ...ch,
            pendingAdv: false,
            pendingDis: false,
          })),
        );
        return mode;
      },
      markDeathSuccess: () =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            deathSuccess: Math.min(3, c.deathSuccess + 1),
          })),
        ),
      markDeathFail: () =>
        set((s) =>
          updateActive(s, (c) => ({
            ...c,
            deathFail: Math.min(3, c.deathFail + 1),
          })),
        ),
      resetDeathSaves: () =>
        set((s) =>
          updateActive(s, (c) => ({ ...c, deathSuccess: 0, deathFail: 0 })),
        ),
      spendHitDie: () => {
        const c = get().character;
        if (c.hitDiceUsed >= c.level) return null;
        const conMod = Math.floor((c.abilities.con - 10) / 2);
        const roll = Math.floor(Math.random() * 8) + 1; // Kindred d8
        const heal = Math.max(1, roll + conMod);
        set((s) =>
          updateActive(s, (ch) => ({
            ...ch,
            hitDiceUsed: ch.hitDiceUsed + 1,
            hpCurrent: Math.min(ch.hpMax, ch.hpCurrent + heal),
          })),
        );
        return heal;
      },
    }),
    {
      name: "kindred-sheet-v5-solo",
      version: 5,
      migrate: (persisted: unknown) => {
        const p = persisted as {
          character?: CharacterSheet;
          characters?: CharacterSheet[];
          activeId?: string;
        } | null;
        if (p?.characters?.length) {
          const characters = p.characters.map(migrateSheet);
          const activeId =
            p.activeId && characters.some((c) => c.id === p.activeId)
              ? p.activeId
              : characters[0]!.id;
          return {
            characters,
            activeId,
            character: characters.find((c) => c.id === activeId)!,
          };
        }
        if (p?.character) {
          const c = migrateSheet(p.character);
          return { characters: [c], activeId: c.id, character: c };
        }
        return initial;
      },
    },
  ),
);

export function getBloodMax(c: CharacterSheet) {
  return bpMax(c.level, c.abilities.con, c.selectedFeats ?? []);
}

export function getLuckMax(level: number) {
  return getLevelData(level).pb;
}

export function encodeSharePayload(character: CharacterSheet): string {
  const json = JSON.stringify(character);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeSharePayload(payload: string): CharacterSheet | null {
  try {
    let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const data = JSON.parse(json) as CharacterSheet;
    if (!data || typeof data.name !== "string") return null;
    return migrateSheet(data);
  } catch {
    return null;
  }
}

export function skillBonus(
  abilityScore: number,
  pb: number,
  prof: ProfLevel | undefined,
): number {
  const mod = Math.floor((abilityScore - 10) / 2);
  if (prof === "expertise") return mod + pb * 2;
  if (prof === "proficient") return mod + pb;
  return mod;
}
