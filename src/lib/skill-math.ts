/**
 * Единый RAW-расчёт навыков / БМ / пассивов (PHB 2024 + Kindred).
 * Бонус навыка = мод. характеристики + (0 | БМ | 2×БМ при экспертизе).
 */
import type { Abilities } from "@/lib/character-store";
import type { ProfLevel, SkillId } from "@/data/skills";
import { SKILLS } from "@/data/skills";
import { abilityMod, formatMod } from "@/lib/utils";
import { getLevelData } from "@/data/kindred-ru";
import { effectivePb } from "@/lib/level-utils";

/** Стандартный БМ 5e/2024: L1–4 +2 … L17–20 +6 */
export function pbFromLevel(level: number): number {
  const l = Math.min(20, Math.max(1, Math.floor(level) || 1));
  return Math.ceil(l / 4) + 1;
}

/** БМ персонажа: таблица Kindred, либо суммарный уровень при мультиклассе */
export function characterPb(level: number, multiclass = ""): number {
  const fromTable = getLevelData(level).pb;
  const fromTotal = effectivePb(level, multiclass);
  // Sanity: both should match pure Kindred; prefer effectivePb
  return fromTotal || fromTable || pbFromLevel(level);
}

export type SkillBreakdown = {
  skillId: SkillId;
  nameRu: string;
  ability: keyof Abilities;
  abilityScore: number;
  abilityMod: number;
  pb: number;
  prof: ProfLevel;
  profBonus: number; // 0 | pb | 2*pb
  total: number;
  /** e.g. "ХАР+3 · БМ+3" or "МУД+1 · БМ+3×2 (эксп.)" */
  formula: string;
  short: string; // "+6"
};

const ABIL_SHORT: Record<keyof Abilities, string> = {
  str: "СИЛ",
  dex: "ЛОВ",
  con: "ТЕЛ",
  int: "ИНТ",
  wis: "МУД",
  cha: "ХАР",
};

export function skillBreakdown(
  abilities: Abilities,
  skillId: SkillId,
  pb: number,
  skillProfs: Partial<Record<SkillId, ProfLevel | undefined>>,
): SkillBreakdown {
  const sk = SKILLS.find((s) => s.id === skillId);
  const ability = sk?.ability ?? "cha";
  const nameRu = sk?.nameRu ?? skillId;
  const abilityScore = abilities[ability] ?? 10;
  const mod = abilityMod(abilityScore);
  const raw = skillProfs[skillId];
  const prof: ProfLevel =
    raw === "expertise" || raw === "proficient" || raw === "none" ? raw : "none";
  const profBonus =
    prof === "expertise" ? pb * 2 : prof === "proficient" ? pb : 0;
  const total = mod + profBonus;
  const abilPart = `${ABIL_SHORT[ability]}${formatMod(mod)}`;
  let pbPart = "";
  if (prof === "expertise") pbPart = ` · БМ${formatMod(pb)}×2 (эксп.)`;
  else if (prof === "proficient") pbPart = ` · БМ${formatMod(pb)}`;
  return {
    skillId,
    nameRu,
    ability,
    abilityScore,
    abilityMod: mod,
    pb,
    prof,
    profBonus,
    total,
    formula: abilPart + pbPart,
    short: formatMod(total),
  };
}

/** skillBonus API used across app */
export function skillBonusTotal(
  abilityScore: number,
  pb: number,
  prof: ProfLevel | undefined,
): number {
  const mod = abilityMod(abilityScore);
  if (prof === "expertise") return mod + pb * 2;
  if (prof === "proficient") return mod + pb;
  return mod;
}

/** Пассив = 10 + бонус навыка (+ БМ если Observant на Perception/Investigation) */
export function passiveScore(
  abilities: Abilities,
  skillId: "perception" | "insight" | "investigation",
  pb: number,
  skillProfs: Partial<Record<SkillId, ProfLevel | undefined>>,
  generalFeats: string[] = [],
): number {
  const b = skillBreakdown(abilities, skillId, pb, skillProfs);
  let p = 10 + b.total;
  // Observant (PHB): +PB to passive Perception and Investigation (2024)
  if (
    generalFeats.includes("observant") &&
    (skillId === "perception" || skillId === "investigation")
  ) {
    p += pb;
  }
  return p;
}
