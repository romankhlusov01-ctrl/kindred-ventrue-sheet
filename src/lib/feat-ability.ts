/**
 * Ability score bonuses from feats (Kindred + PHB half-feats).
 * Applied on toggle / applyToSheet / one-shot migrate.
 */
import type { Abilities } from "@/lib/character-store";

export type AbilityKey = keyof Abilities;

/** Unambiguous +1 feats only (no "Str or Dex" choice feats). */
export const FEAT_ABILITY_BONUS: Record<string, Partial<Record<AbilityKey, number>>> = {
  // Kindred
  convincing: { cha: 1 },
  "vitae-conc": { con: 1 },
  "self-control": { wis: 1 },
  hardened: { con: 1 },

  // PHB general
  durable: { con: 1 },
  actor: { cha: 1 },
  "resilient-str": { str: 1 },
  "resilient-dex": { dex: 1 },
  "resilient-con": { con: 1 },
  "resilient-int": { int: 1 },
  "resilient-wis": { wis: 1 },
  "resilient-cha": { cha: 1 },
  resilient: { wis: 1 },
};

export function bonusForFeat(featId: string): Partial<Record<AbilityKey, number>> {
  return FEAT_ABILITY_BONUS[featId] ?? {};
}

export function applyAbilityDelta(
  abilities: Abilities,
  delta: Partial<Record<AbilityKey, number>>,
  sign: 1 | -1,
  cap = 20,
): Abilities {
  const next = { ...abilities };
  for (const k of Object.keys(delta) as AbilityKey[]) {
    const d = delta[k] ?? 0;
    if (!d) continue;
    next[k] = Math.min(cap, Math.max(1, next[k] + sign * d));
  }
  return next;
}

/** Apply all feat ASI from selected lists (for applyToSheet / migrate). */
export function applyAllFeatAbilityBonuses(
  abilities: Abilities,
  selectedFeats: string[],
  generalFeats: string[],
): Abilities {
  let next = { ...abilities };
  for (const id of [...selectedFeats, ...generalFeats]) {
    next = applyAbilityDelta(next, bonusForFeat(id), 1);
  }
  return next;
}

export function featAbilityLabel(featId: string): string | null {
  const b = bonusForFeat(featId);
  const parts = (Object.entries(b) as [AbilityKey, number][])
    .filter(([, n]) => n)
    .map(([k, n]) => {
      const names: Record<AbilityKey, string> = {
        str: "Сил",
        dex: "Лов",
        con: "Тел",
        int: "Инт",
        wis: "Муд",
        cha: "Хар",
      };
      return `${names[k]}+${n}`;
    });
  return parts.length ? parts.join(" · ") : null;
}
