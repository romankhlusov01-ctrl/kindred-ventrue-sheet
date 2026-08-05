import { getLevelData } from "@/data/kindred-ru";

/** Parse "Колдун 1" → 1 */
export function parseMulticlassLevels(multiclass: string): number {
  if (!multiclass?.trim()) return 0;
  const nums = multiclass.match(/\d+/g);
  if (!nums) return 0;
  return nums.reduce((s, n) => s + Number(n), 0);
}

/** Total character level for PB if using multiclass text */
export function totalCharacterLevel(kindredLevel: number, multiclass: string): number {
  return kindredLevel + parseMulticlassLevels(multiclass);
}

export function proficiencyFromTotal(totalLevel: number): number {
  const l = Math.min(20, Math.max(1, totalLevel));
  return Math.ceil(l / 4) + 1;
}

/** Prefer total PB when multiclass present, else Kindred table */
export function effectivePb(kindredLevel: number, multiclass: string): number {
  const extra = parseMulticlassLevels(multiclass);
  if (extra > 0) return proficiencyFromTotal(kindredLevel + extra);
  return getLevelData(kindredLevel).pb;
}
