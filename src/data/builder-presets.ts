/**
 * Билдер-пресеты v6 · по 2 на клан (старт L3 + стол L8)
 * Без устаревших warlock / дублей.
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
  asiPlus2: keyof Abilities;
  asiPlus1: keyof Abilities;
  backgroundId: string;
  originFeatId: string;
  humanSkill: SkillId;
  classSkills: SkillId[];
  selectedFeats: string[];
  preferredBlood: string;
  nameSuggestion: string;
};

export const BUILD_PRESETS: BuildPreset[] = [
  {
    id: "v-table-8",
    name: "Вентру · стол (8)",
    blurb: "Хар/Тел · dual luck · Голос · Forceful + Lethal · Проклятие: солдаты",
    clan: "ventrue",
    level: 8,
    multiclass: "",
    baseScores: { str: 8, dex: 14, con: 15, int: 8, wis: 10, cha: 13 },
    asiPlus2: "cha",
    asiPlus1: "con",
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
    blurb: "Первый клан · Голос власти · 1 черта сородича · учиться питанию",
    clan: "ventrue",
    level: 3,
    multiclass: "",
    baseScores: { str: 8, dex: 14, con: 15, int: 10, wis: 12, cha: 13 },
    asiPlus2: "cha",
    asiPlus1: "con",
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
    blurb: "Лов/Хар · dual luck · Душа художника · Forceful + Alacrity",
    clan: "toreador",
    level: 8,
    multiclass: "",
    baseScores: { str: 8, dex: 15, con: 14, int: 10, wis: 12, cha: 13 },
    asiPlus2: "dex",
    asiPlus1: "cha",
    backgroundId: "touchstone",
    originFeatId: "lucky",
    humanSkill: "perception",
    classSkills: ["persuasion", "insight"],
    selectedFeats: ["forceful", "alacrity"],
    preferredBlood: BANE.toreadorField,
    nameSuggestion: "Алая роза",
  },
  {
    id: "t-start-3",
    name: "Тореадор · старт (3)",
    blurb: "Душа художника · Анализ/Внимательность · Проклятие внимания",
    clan: "toreador",
    level: 3,
    multiclass: "",
    baseScores: { str: 8, dex: 14, con: 14, int: 12, wis: 13, cha: 15 },
    asiPlus2: "cha",
    asiPlus1: "dex",
    backgroundId: "touchstone",
    originFeatId: "lucky",
    humanSkill: "investigation",
    classSkills: ["persuasion", "perception"],
    selectedFeats: ["forceful"],
    preferredBlood: BANE.toreadorField,
    nameSuggestion: "Новая муза",
  },
];

/** Атаки по билду · заметки нейтральны к клану */
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
