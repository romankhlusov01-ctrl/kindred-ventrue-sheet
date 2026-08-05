import { abilityMod, formatMod, rollDie } from "@/lib/utils";
import type { Abilities } from "@/lib/character-store";
import type { ProfLevel, SkillId } from "@/data/skills";
import { SKILLS } from "@/data/skills";
import { getLevelData } from "@/data/kindred-ru";
import { skillBonus } from "@/lib/character-store";

export type RollMode = "norm" | "adv" | "dis";

export type D20Result = {
  label: string;
  a: number;
  b?: number;
  used: number;
  mod: number;
  total: number;
  mode: RollMode;
  detail: string;
  crit: boolean;
  fumble: boolean;
};

export type DamageResult = {
  label: string;
  rolls: number[];
  bonus: number;
  total: number;
  detail: string;
  expression: string;
};

/** Parse "1d8+3", "2d6+3 + 1d8", "3d6+3" — takes first NdX+Y group and optional trailing +NdX */
export function parseDamageExpr(expr: string): { count: number; sides: number; bonus: number }[] {
  const cleaned = expr.replace(/,/g, "").replace(/[–—]/g, "-");
  const parts = cleaned.match(/(\d+)d(\d+)([+-]\d+)?/gi) ?? [];
  if (!parts.length) {
    const flat = cleaned.match(/([+-]?\d+)/);
    return [{ count: 0, sides: 0, bonus: flat ? Number(flat[1]) : 0 }];
  }
  return parts.map((p) => {
    const m = p.match(/(\d+)d(\d+)([+-]\d+)?/i)!;
    return {
      count: Number(m[1]),
      sides: Number(m[2]),
      bonus: m[3] ? Number(m[3]) : 0,
    };
  });
}

export function rollDamage(expr: string, label = "Урон"): DamageResult {
  const groups = parseDamageExpr(expr);
  const allRolls: number[] = [];
  let bonus = 0;
  const detailParts: string[] = [];
  for (const g of groups) {
    if (g.count > 0 && g.sides > 0) {
      const rolls = Array.from({ length: g.count }, () => rollDie(g.sides));
      allRolls.push(...rolls);
      detailParts.push(`${rolls.join("+")}`);
    }
    bonus += g.bonus;
  }
  const diceTotal = allRolls.reduce((a, b) => a + b, 0);
  const total = diceTotal + bonus;
  const detail =
    detailParts.join(" + ") +
    (bonus ? ` ${formatMod(bonus)}` : "") +
    ` = ${total}`;
  return {
    label,
    rolls: allRolls,
    bonus,
    total,
    detail,
    expression: expr,
  };
}

export function rollD20(
  label: string,
  mod: number,
  mode: RollMode = "norm",
): D20Result {
  const a = rollDie(20);
  let b: number | undefined;
  let used = a;
  let detail = `${a}`;
  if (mode === "adv") {
    b = rollDie(20);
    used = Math.max(a, b);
    detail = `преим. ${a}/${b}`;
  } else if (mode === "dis") {
    b = rollDie(20);
    used = Math.min(a, b);
    detail = `помеха ${a}/${b}`;
  }
  const total = used + mod;
  return {
    label,
    a,
    b,
    used,
    mod,
    total,
    mode,
    detail: `${detail} ${formatMod(mod)}`,
    crit: used === 20,
    fumble: used === 1,
  };
}

export function resolveMode(
  preferred: RollMode,
  beastActive: boolean,
  forceAdv = false,
): RollMode {
  if (forceAdv || beastActive) {
    if (preferred === "dis") return "norm"; // adv + dis cancel
    return "adv";
  }
  return preferred;
}

export function abilityCheckBonus(
  abilities: Abilities,
  key: keyof Abilities,
  pb: number,
  proficient: boolean,
): number {
  return abilityMod(abilities[key]) + (proficient ? pb : 0);
}

export function saveBonus(
  abilities: Abilities,
  key: keyof Abilities,
  pb: number,
  saveProfs: Partial<Record<keyof Abilities, boolean>>,
  ventrueWisAdv = false,
): { bonus: number; autoAdv: boolean } {
  const prof = !!saveProfs[key];
  return {
    bonus: abilityMod(abilities[key]) + (prof ? pb : 0),
    autoAdv: ventrueWisAdv && key === "wis",
  };
}

export function skillCheckBonus(
  abilities: Abilities,
  skillId: SkillId,
  pb: number,
  skillProfs: Partial<Record<SkillId, ProfLevel>>,
): number {
  const sk = SKILLS.find((s) => s.id === skillId);
  if (!sk) return 0;
  return skillBonus(abilities[sk.ability], pb, skillProfs[skillId]);
}

export function initiativeBonus(abilities: Abilities, selectedFeats: string[]): number {
  // Alacrity gives advantage on initiative, not +mod — bonus is just DEX
  return abilityMod(abilities.dex);
}

export function hasAlacrity(selectedFeats: string[]) {
  return selectedFeats.includes("alacrity");
}

export function hitDieMax(level: number) {
  return level; // Kindred uses d8 typically; max HD = level in class
}

export function formatD20Result(r: D20Result): string {
  const tag = r.crit ? " · КРИТ" : r.fumble ? " · ПРОВАЛ" : "";
  return `${r.label}: ${r.detail}${tag} = ${r.total}`;
}
