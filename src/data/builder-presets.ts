import type { Abilities } from "@/lib/character-store";
import type { SkillId } from "@/data/skills";

export type BuildPreset = {
  id: string;
  name: string;
  blurb: string;
  /** ventrue | toreador */
  clan?: "ventrue" | "toreador";
  level: number;
  multiclass: string;
  baseScores: Abilities;
  /** before bg +2/+1 */
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

/** Готовые оптимизированные направления для Вентру */
export const BUILD_PRESETS: BuildPreset[] = [
  {
    id: "social-lord",
    name: "Социальный лорд",
    blurb: "Хар 17 · dual luck · Forceful + Lethal · контроль и переговоры",
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
    clan: "ventrue",
  },
  {
    id: "iron-tyrant",
    name: "Железный тиран",
    blurb: "Сил/Тел · захват · Lethal · ближний бой + Presence",
    level: 8,
    multiclass: "",
    baseScores: { str: 15, dex: 10, con: 14, int: 8, wis: 10, cha: 13 },
    asiPlus2: "str",
    asiPlus1: "con",
    backgroundId: "thrall",
    originFeatId: "lucky",
    humanSkill: "athletics",
    classSkills: ["intimidation", "athletics"],
    selectedFeats: ["lethal", "forceful"],
    preferredBlood: "преступники",
    nameSuggestion: "Железный кулак",
    clan: "ventrue",
  },
  {
    id: "pact-prince",
    name: "Принц с пактом (7+1)",
    blurb: "Kindred 7 / Колдун 1 · Eldritch Blast · dual luck",
    level: 7,
    multiclass: "Колдун 1",
    baseScores: { str: 8, dex: 14, con: 15, int: 8, wis: 10, cha: 13 },
    asiPlus2: "cha",
    asiPlus1: "con",
    backgroundId: "touchstone",
    originFeatId: "lucky",
    humanSkill: "arcana",
    classSkills: ["persuasion", "insight"],
    selectedFeats: ["forceful", "lethal"],
    preferredBlood: "аристократы",
    nameSuggestion: "Принц с пактом",
    clan: "ventrue",
  },
  {
    id: "new-blood",
    name: "Новая кровь (ур.3)",
    blurb: "Старт с подклассом · минимум слотов · учиться питанию",
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
    preferredBlood: "учёные",
    nameSuggestion: "Новорождённый",
    clan: "ventrue",
  },
  {
    id: "rose-siren",
    name: "Роза-сирена",
    blurb: "Тореадор · Хар/Лов · Presence · dual luck · социал + внимание",
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
    preferredBlood: "артисты / красавцы",
    nameSuggestion: "Алая роза",
  },
  {
    id: "gallery-hunter",
    name: "Охотник галереи",
    blurb: "Тореадор 3 · старт · Анализ/Внимательность · красота",
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
    preferredBlood: "артисты / красавцы",
    nameSuggestion: "Новая муза",
  },
  {
    id: "live-fast-blade",
    name: "Живи быстро (9+)",
    blurb: "Тореадор 9 · Лов 20+ · доп. действие · Celerity-feel",
    clan: "toreador",
    level: 9,
    multiclass: "",
    baseScores: { str: 8, dex: 15, con: 14, int: 10, wis: 12, cha: 13 },
    asiPlus2: "dex",
    asiPlus1: "cha",
    backgroundId: "thrall",
    originFeatId: "lucky",
    humanSkill: "acrobatics",
    classSkills: ["stealth", "persuasion"],
    selectedFeats: ["alacrity", "lethal"],
    preferredBlood: "танцоры",
    nameSuggestion: "Мгновение",
  },
];

/** Generate weapon attacks from build */
export function defaultAttacks(level: number, scores: Abilities, feats: string[]) {
  const pb = Math.ceil(level / 4) + 1;
  const strMod = Math.floor((scores.str - 10) / 2);
  const dexMod = Math.floor((scores.dex - 10) / 2);
  const conMod = Math.floor((scores.con - 10) / 2);
  const chaMod = Math.floor((scores.cha - 10) / 2);
  const useDex = dexMod >= strMod;
  const atkMod = useDex ? dexMod : strMod;
  const feed = level >= 17 ? 6 : level >= 13 ? 5 : level >= 9 ? 4 : level >= 5 ? 3 : 2;

  const attacks = [
    {
      id: "atk-unarmed",
      name: feats.includes("lethal") ? "Безоружный (Смертельное тело)" : "Безоружный",
      bonus: atkMod + pb,
      damage: feats.includes("lethal")
        ? `1d4${atkMod >= 0 ? "+" + atkMod : atkMod}+1d8`
        : `1d4${atkMod >= 0 ? "+" + atkMod : atkMod}`,
      type: "Дробящий",
      notes: feats.includes("lethal") ? "Lethal Body +1d8" : "",
    },
    {
      id: "atk-weapon",
      name: useDex ? "Короткий меч (Лов)" : "Длинный меч (Сил)",
      bonus: atkMod + pb,
      damage: useDex
        ? `1d6${dexMod >= 0 ? "+" + dexMod : dexMod}`
        : `1d8${strMod >= 0 ? "+" + strMod : strMod}`,
      type: useDex ? "Колющий" : "Рубящий",
      notes: "",
    },
    {
      id: "atk-feed",
      name: level >= 5 ? "Питание (улучш.)" : "Питание",
      bonus: 0,
      damage: `${feed}d6${conMod >= 0 ? "+" + Math.max(1, conMod) : Math.max(1, conMod)}`,
      type: "Некротический",
      notes: "Макс. хиты; ½ если не Bane",
    },
  ];

  if (level >= 7 || scores.cha >= 16) {
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
