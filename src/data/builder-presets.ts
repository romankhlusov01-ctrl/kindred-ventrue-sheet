/**
 * Билдер-пресеты · старт L3 + стол L8 на клан.
 * Итоговые статы согласованы с release presets (presets.ts).
 */
import type { Abilities } from "@/lib/character-store";
import type { SkillId } from "@/data/skills";
import { BANE } from "@/data/terms-ru";

export type BuildPreset = {
  id: string;
  name: string;
  blurb: string;
  clan: "ventrue" | "toreador";
  level: number;
  multiclass: string;
  baseScores: Abilities;
  /** Background +2 */
  asiPlus2: keyof Abilities;
  /** Background +1 */
  asiPlus1: keyof Abilities;
  /** ASI levels 4/8/… spent as points (not feats) */
  asiExtra: Partial<Abilities>;
  backgroundId: string;
  originFeatId: string;
  humanSkill: SkillId;
  classSkills: SkillId[];
  /** Toreador Artist's Soul picks (2) */
  artistSkills?: SkillId[];
  selectedFeats: string[];
  preferredBlood: string;
  nameSuggestion: string;
};

export const BUILD_PRESETS: BuildPreset[] = [
  {
    id: "v-table-8",
    name: "Вентру · стол (8)",
    blurb: "Хар 17 / Тел 16 · dual luck · Голос · Forceful + Lethal · кровь: солдаты",
    clan: "ventrue",
    level: 8,
    multiclass: "",
    // standard-ish array before bg/ASI
    baseScores: { str: 8, dex: 14, con: 15, int: 8, wis: 10, cha: 13 },
    asiPlus2: "cha",
    asiPlus1: "con",
    // L4+L8 as ASI: +2 Cha → 17 (после bg 15)
    asiExtra: { cha: 2 },
    backgroundId: "touchstone",
    originFeatId: "lucky",
    humanSkill: "deception",
    classSkills: ["intimidation", "insight"],
    selectedFeats: ["forceful", "lethal"],
    preferredBlood: "солдаты / военные",
    nameSuggestion: "Владыка крови",
  },
  {
    id: "v-start-3",
    name: "Вентру · старт (3)",
    blurb: "Первый клан · Голос · Forceful · учиться питанию",
    clan: "ventrue",
    level: 3,
    multiclass: "",
    baseScores: { str: 8, dex: 14, con: 15, int: 10, wis: 12, cha: 13 },
    asiPlus2: "cha",
    asiPlus1: "con",
    asiExtra: {},
    backgroundId: "touchstone",
    originFeatId: "lucky",
    humanSkill: "perception",
    classSkills: ["persuasion", "intimidation"],
    selectedFeats: ["forceful"],
    preferredBlood: "аристократы",
    nameSuggestion: "Новорождённый",
  },
  {
    id: "t-table-8",
    name: "Тореадор · стол (8)",
    blurb: "Лов 16 / Хар 16 · Душа художника · Forceful + Alacrity",
    clan: "toreador",
    level: 8,
    multiclass: "",
    baseScores: { str: 8, dex: 14, con: 14, int: 12, wis: 12, cha: 14 },
    asiPlus2: "dex",
    asiPlus1: "cha",
    // bg: dex16 cha15 · ASI +1 cha → 16 (и +1 leftover unused → +1 int already in base)
    asiExtra: { cha: 1 },
    backgroundId: "touchstone",
    originFeatId: "lucky",
    humanSkill: "perception",
    classSkills: ["persuasion", "insight"],
    artistSkills: ["perception", "performance"],
    selectedFeats: ["forceful", "alacrity"],
    preferredBlood: BANE.toreadorField,
    nameSuggestion: "Алая роза",
  },
  {
    id: "t-start-3",
    name: "Тореадор · старт (3)",
    blurb: "Душа художника · Проклятие внимания · Forceful",
    clan: "toreador",
    level: 3,
    multiclass: "",
    baseScores: { str: 8, dex: 14, con: 14, int: 12, wis: 13, cha: 15 },
    asiPlus2: "cha",
    asiPlus1: "dex",
    asiExtra: {},
    backgroundId: "touchstone",
    originFeatId: "lucky",
    humanSkill: "investigation",
    classSkills: ["persuasion", "perception"],
    artistSkills: ["investigation", "performance"],
    selectedFeats: ["forceful"],
    preferredBlood: BANE.toreadorField,
    nameSuggestion: "Новая муза",
  },
];

/** Атаки по билду */
export function defaultAttacks(level: number, scores: Abilities, feats: string[]) {
  const pb = level >= 17 ? 6 : level >= 13 ? 5 : level >= 9 ? 4 : level >= 5 ? 3 : 2;
  const strMod = Math.floor((scores.str - 10) / 2);
  const dexMod = Math.floor((scores.dex - 10) / 2);
  const conMod = Math.floor((scores.con - 10) / 2);
  const chaMod = Math.floor((scores.cha - 10) / 2);
  const useDex = dexMod >= strMod;
  const atkMod = useDex ? dexMod : strMod;
  const feed = level >= 17 ? 6 : level >= 13 ? 5 : level >= 9 ? 4 : level >= 5 ? 3 : 2;
  const conBonus = Math.max(1, conMod);

  const attacks = [
    {
      id: "atk-unarmed",
      name: feats.includes("lethal") ? "Безоружный (Смертельное тело)" : "Безоружный",
      bonus: atkMod + pb,
      damage: feats.includes("lethal")
        ? `1d4${atkMod >= 0 ? "+" + atkMod : atkMod}+1d8`
        : `1d4${atkMod >= 0 ? "+" + atkMod : atkMod}`,
      type: "Дробящий",
      notes: feats.includes("lethal") ? "+1d8 Смертельное тело" : "",
    },
    {
      id: "atk-weapon",
      name: useDex ? "Короткий меч (Лов)" : "Длинный меч (Сил)",
      bonus: atkMod + pb,
      damage: useDex
        ? `1d6${dexMod >= 0 ? "+" + dexMod : dexMod}`
        : `1d8${strMod >= 0 ? "+" + strMod : strMod}`,
      type: useDex ? "Колющий" : "Рубящий",
      notes: useDex ? "Лёгкое, фехтовальное" : "",
    },
    {
      id: "atk-feed",
      name: level >= 5 ? "Питание (улучш.)" : "Питание",
      bonus: 0,
      damage: `${feed}d6${conBonus >= 0 ? "+" + conBonus : conBonus}`,
      type: "Некротический",
      notes: "Урон к макс. ХП · Вентру: ½ если не предпочтённая кровь",
    },
  ];

  if (level >= 3 || scores.cha >= 16) {
    attacks.unshift({
      id: "atk-spell",
      name: "Атака заклинанием",
      bonus: chaMod + pb,
      damage: "—",
      type: "—",
      notes: `Сл ${8 + pb + chaMod}`,
    });
  }

  return attacks;
}
