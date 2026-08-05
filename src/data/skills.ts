import type { Abilities } from "@/lib/character-store";

export type SkillId =
  | "acrobatics"
  | "animalHandling"
  | "arcana"
  | "athletics"
  | "deception"
  | "history"
  | "insight"
  | "intimidation"
  | "investigation"
  | "medicine"
  | "nature"
  | "perception"
  | "performance"
  | "persuasion"
  | "religion"
  | "sleightOfHand"
  | "stealth"
  | "survival";

export type SkillDef = {
  id: SkillId;
  name: string;
  nameRu: string;
  ability: keyof Abilities;
};

export const SKILLS: SkillDef[] = [
  { id: "acrobatics", name: "Acrobatics", nameRu: "Акробатика", ability: "dex" },
  { id: "animalHandling", name: "Animal Handling", nameRu: "Уход за животными", ability: "wis" },
  { id: "arcana", name: "Arcana", nameRu: "Магия", ability: "int" },
  { id: "athletics", name: "Athletics", nameRu: "Атлетика", ability: "str" },
  { id: "deception", name: "Deception", nameRu: "Обман", ability: "cha" },
  { id: "history", name: "History", nameRu: "История", ability: "int" },
  { id: "insight", name: "Insight", nameRu: "Проницательность", ability: "wis" },
  { id: "intimidation", name: "Intimidation", nameRu: "Запугивание", ability: "cha" },
  { id: "investigation", name: "Investigation", nameRu: "Анализ", ability: "int" },
  { id: "medicine", name: "Medicine", nameRu: "Медицина", ability: "wis" },
  { id: "nature", name: "Nature", nameRu: "Природа", ability: "int" },
  { id: "perception", name: "Perception", nameRu: "Внимательность", ability: "wis" },
  { id: "performance", name: "Performance", nameRu: "Выступление", ability: "cha" },
  { id: "persuasion", name: "Persuasion", nameRu: "Убеждение", ability: "cha" },
  { id: "religion", name: "Religion", nameRu: "Религия", ability: "int" },
  { id: "sleightOfHand", name: "Sleight of Hand", nameRu: "Ловкость рук", ability: "dex" },
  { id: "stealth", name: "Stealth", nameRu: "Скрытность", ability: "dex" },
  { id: "survival", name: "Survival", nameRu: "Выживание", ability: "wis" },
];

export type ProfLevel = "none" | "proficient" | "expertise";

export const CONDITIONS = [
  "Ослеплён",
  "Очарован",
  "Оглушён",
  "Испуган",
  "Схвачен",
  "Недееспособен",
  "Невидим",
  "Парализован",
  "Окаменел",
  "Отравлен",
  "Сбит с ног",
  "Обездвижен",
  "Ошеломлён",
  "Без сознания",
  "Истощение",
  "Кровная связь",
  "Голод",
  "Концентрация",
] as const;
