export type ClanId =
  | "brujah"
  | "gangrel"
  | "lasombra"
  | "nosferatu"
  | "toreador"
  | "ventrue"
  | "none";

export interface LevelRow {
  level: number;
  proficiencyBonus: number;
  features: string;
  bloodPoints: number;
  feedDice: string;
  feedDiceCount: number;
}

export const KINDRED_LEVELS: LevelRow[] = [
  { level: 1, proficiencyBonus: 2, features: "Feed, The Beast, Blood Potency, Kindred Biology", bloodPoints: 1, feedDice: "2d6", feedDiceCount: 2 },
  { level: 2, proficiencyBonus: 2, features: "Kindred Feat", bloodPoints: 2, feedDice: "2d6", feedDiceCount: 2 },
  { level: 3, proficiencyBonus: 2, features: "Kindred Subclass", bloodPoints: 2, feedDice: "2d6", feedDiceCount: 2 },
  { level: 4, proficiencyBonus: 2, features: "Ability Score Improvement", bloodPoints: 3, feedDice: "2d6", feedDiceCount: 2 },
  { level: 5, proficiencyBonus: 3, features: "Bestial Fury, Improved Feed", bloodPoints: 3, feedDice: "3d6", feedDiceCount: 3 },
  { level: 6, proficiencyBonus: 3, features: "Subclass feature", bloodPoints: 4, feedDice: "3d6", feedDiceCount: 3 },
  { level: 7, proficiencyBonus: 3, features: "Kindred Feat", bloodPoints: 4, feedDice: "3d6", feedDiceCount: 3 },
  { level: 8, proficiencyBonus: 3, features: "Ability Score Improvement", bloodPoints: 5, feedDice: "3d6", feedDiceCount: 3 },
  { level: 9, proficiencyBonus: 4, features: "Subclass feature", bloodPoints: 5, feedDice: "4d6", feedDiceCount: 4 },
  { level: 10, proficiencyBonus: 4, features: "Kindred Feat, Vampiric Will", bloodPoints: 6, feedDice: "4d6", feedDiceCount: 4 },
  { level: 11, proficiencyBonus: 4, features: "Subclass feature", bloodPoints: 6, feedDice: "4d6", feedDiceCount: 4 },
  { level: 12, proficiencyBonus: 4, features: "Ability Score Improvement", bloodPoints: 7, feedDice: "4d6", feedDiceCount: 4 },
  { level: 13, proficiencyBonus: 5, features: "Kindred Feat", bloodPoints: 7, feedDice: "5d6", feedDiceCount: 5 },
  { level: 14, proficiencyBonus: 5, features: "Efficient Feeding", bloodPoints: 8, feedDice: "5d6", feedDiceCount: 5 },
  { level: 15, proficiencyBonus: 5, features: "Subclass feature", bloodPoints: 8, feedDice: "5d6", feedDiceCount: 5 },
  { level: 16, proficiencyBonus: 5, features: "Ability Score Improvement", bloodPoints: 9, feedDice: "5d6", feedDiceCount: 5 },
  { level: 17, proficiencyBonus: 6, features: "Kindred Feat", bloodPoints: 9, feedDice: "6d6", feedDiceCount: 6 },
  { level: 18, proficiencyBonus: 6, features: "Subclass feature", bloodPoints: 10, feedDice: "6d6", feedDiceCount: 6 },
  { level: 19, proficiencyBonus: 6, features: "Epic Boon", bloodPoints: 10, feedDice: "6d6", feedDiceCount: 6 },
  { level: 20, proficiencyBonus: 6, features: "Ancient Awakening", bloodPoints: 11, feedDice: "6d6", feedDiceCount: 6 },
];

export interface ClanFeature {
  level: number;
  name: string;
  description: string;
}

export interface ClanDef {
  id: ClanId;
  name: string;
  tagline: string;
  bane: string;
  features: ClanFeature[];
}

export const CLANS: ClanDef[] = [
  {
    id: "brujah",
    name: "Brujah",
    tagline: "Восставай, стой твёрдо и сражайся за что-то",
    bane: "Если провален D20 Test от Beast и вы тратите BP, чтобы игнорировать Hunger — нужно потратить PB Blood Points вместо 1.",
    features: [
      { level: 3, name: "Fighting Fury", description: "1 BP на 1 мин: Adv на первую melee/unarmed атаку в ход; Dash/Dodge как BA; proficiency Martial + mastery 2 melee." },
      { level: 6, name: "Fearsome", description: "1 BP → Fear; Adv на Charisma (Intimidation)." },
      { level: 9, name: "Fleetness", description: "3 BP → Haste на себя без Incapacitated/Speed 0 в конце." },
      { level: 11, name: "Burning Wrath", description: "BA, 2 BP: 1 мин Unarmed +2d8 Necrotic (пока атакуешь)." },
      { level: 15, name: "Rouse Emotions", description: "3 BP: усиленный Charm Person / Confusion / Fear." },
      { level: 18, name: "Puissant Might", description: "Str +4 (max 30); melee/unarmed +2 extra damage dice." },
    ],
  },
  {
    id: "gangrel",
    name: "Gangrel",
    tagline: "Впусти Зверя, чтобы контролировать его",
    bane: "Под Hunger: Disadv на Charisma (Deception, Persuasion) до Long Rest.",
    features: [
      { level: 3, name: "Gifts of the Beast", description: "Darkvision 240 ft; BA 1 BP: когти 2d6 Slash, Dex вместо Str на Unarmed." },
      { level: 6, name: "Feral Spirit", description: "Телепатия с Beasts; Animal Friendship; под Hunger +1d6 Slash и size+1 для grapple." },
      { level: 9, name: "Gifts of Survival", description: "Reaction: снизить урон (кроме Fire/Radiant) на PB+Con; Meld Into Stone (земля) 1 BP." },
      { level: 11, name: "Corporeal Mastery", description: "Shape-shift в зверей (2/4 BP), Temp HP = level." },
      { level: 15, name: "Command the Beast", description: "Dominate Beast 7 без слота 1/LR; Reaction 1 BP — заставить Kindred использовать Beast." },
      { level: 18, name: "Protean Rewards", description: "2 BP: double DR 1 мин; 2 BP: Gaseous Form без Concentration." },
    ],
  },
  {
    id: "lasombra",
    name: "Lasombra",
    tagline: "Манипулируй тьмой и слабостью",
    bane: "При 1 на d20 D20 Test — Disadv на следующий D20 Test в течение 1 мин.",
    features: [
      { level: 3, name: "Taste of Oblivion", description: "Видишь в Dim/Dark (mag/non) 120 ft; Adv Stealth; Hide как BA." },
      { level: 6, name: "Shadow Mastery", description: "2 BP → Black Tentacles (1d6 Bldg + 2d6 Cold); 1 BP → Darkness." },
      { level: 9, name: "Force of Will", description: "1 BP → Suggestion; Magic action 1 BP: sleep Unconscious 10 мин (Wis save)." },
      { level: 11, name: "Abyssal Strength", description: "BA 2 BP: Str + PB на 1 мин." },
      { level: 15, name: "Crush Weakness", description: "Reaction 2 BP: 4d8 Psychic при fail check/save; 2d8 Bldg + 2d8 Cold при miss." },
      { level: 18, name: "Tenebrous Form", description: "5 BP, 1 мин: +4 AC, 4d10 Temp HP, Misty Step в тьме, reach Unarmed +2d10 Cold." },
    ],
  },
  {
    id: "nosferatu",
    name: "Nosferatu",
    tagline: "Скройся и раскрой свою чудовищность",
    bane: "Disadv на Charisma checks с non-Undead, которые видят твоё лицо.",
    features: [
      { level: 3, name: "Hidden in Plain Sight", description: "Disguise Self без слота; Invisibility PB раз / short rest." },
      { level: 6, name: "Monstrous Gifts", description: "Выбери 2: Animalist, Ears of the Bat, Feral Talons, Leathery Hide, Patagia, The Terror." },
      { level: 9, name: "Inhuman Strength", description: "Str +2 (max 25); BA 3 BP: 1 мин melee/unarmed +1d10 Force." },
      { level: 11, name: "The Concealing", description: "3 BP: скрыть объект/память; Cloak the Gathering (+BP за цели Invisibility)." },
      { level: 15, name: "Greater Monstrous Gifts", description: "Выбери 1: Call the Wretched, Distending Jaws, One with the Night, Skin of the Chameleon, Stony Flesh, Wings of the Gargoyle." },
      { level: 18, name: "What Goes Bump", description: "3 BP: 1d4+1 swarms 1/rest; Greater Invisibility PB / short rest." },
    ],
  },
  {
    id: "toreador",
    name: "Toreador",
    tagline: "Смотри на мир, как никто другой",
    bane: "При 9 или ниже на d20 Investigation/Perception — Restrained (DC 10 Wis save в конце хода).",
    features: [
      { level: 3, name: "An Artist's Soul", description: "Adv Investigation & Perception; Darkvision 120; +2 skills +1 tool (Expertise если уже есть)." },
      { level: 6, name: "Depth of Feelings", description: "2 BP: Aura Sight (2 yes/no); 1 BP: Calm Emotions / Charm Monster / Charm Person." },
      { level: 9, name: "Live Fast…", description: "Dex +2 (max 25); BA 1 BP: extra action (Attack once / Dash / Disengage / Hide / Utilize) на PB ходов." },
      { level: 11, name: "Visionary", description: "Expertise в 3 навыках; 2 BP: Spirit's Touch (вопросы = PB)." },
      { level: 15, name: "Truly Majestic", description: "Adv Deception & Persuasion; Entrancement saves Disadv; 3 BP Sanctuary без break." },
      { level: 18, name: "Magnum Opus", description: "Выбери 2: Flicker, Clairvoyance, Open Mind, Star Magnetism." },
    ],
  },
  {
    id: "ventrue",
    name: "Ventrue",
    tagline: "Контролируй других влиянием и хитростью",
    bane: "Выбери preferred physical/social aspect (не creature type). Feed не по аспекту → half Feed Dice.",
    features: [
      {
        level: 3,
        name: "Voice of Authority",
        description:
          "Command и Suggestion без слота — каждый PB раз / Short or Long Rest. Unshakably Confident: Advantage on Wisdom saving throws.",
      },
      {
        level: 6,
        name: "Dare Not Falter",
        description:
          "Toughened: +Kindred level к HP max при получении (+1 HP за каждый последующий Kindred level). Unswayable Mind: при fail save vs Charmed/Frightened/Stunned — reroll (must use new).",
      },
      {
        level: 9,
        name: "Domineering Control",
        description:
          "1 BP → Hypnotic Pattern (Int≤3 auto-success; Int≥4 Disadv). Entrance: Magic action, Persuasion check + 2 BP → Wis save DC=check или Stunned. 1 BP Charm Monster. Terrify: Intimidation check + 1 BP → Frightened 1 min.",
      },
      {
        level: 11,
        name: "Mass Manipulation",
        description:
          "3 BP → Mass Suggestion. Ур.15: 4 BP as 7th; ур.18: 5 BP as 8th; ур.20: 6 BP as 9th.",
      },
      {
        level: 15,
        name: "Sanguine Fortification",
        description:
          "Reaction 2 BP: пьющий твою vitae в 60 ft получает Temp HP = 2×level. Flesh of Marble: Reaction 2 BP half dmg / 4 BP zero (кроме Fire/Radiant).",
      },
      {
        level: 18,
        name: "Lordly Power",
        description:
          "Imposing Aura (Wis save vs targeting you). Disadv on saves to end Charmed by you. Summon 3 BP — compel Beast/Humanoid/Undead you've touched.",
      },
    ],
  },
];

export const CORE_FEATURES = [
  {
    id: "feed",
    name: "Feed",
    level: 1,
    summary:
      "Action (с 5 ур. — Bonus Action): цель willing / Charmed / Incapacitated / Grappled / Paralyzed / Restrained / Stunned / Unconscious в 5 ft. Feed Dice + Con (min 1) necrotic → снижает max HP. 6 на d6 → +1 BP. Max HP 0 → +1 BP. Размер цели ограничивает BP за кормление.",
  },
  {
    id: "beast",
    name: "The Beast",
    level: 1,
    summary:
      "BA: Advantage на D20 Tests до начала своего следующего хода. PB раз / Short or Long Rest. При fail — Hunger (bloodlust 1 мин или до Feed).",
  },
  {
    id: "blood-potency",
    name: "Blood Potency",
    level: 1,
    summary:
      "BA 1 BP: heal 1d10 + Kindred level. 1 BP: ignore Hunger от fail Beast. Vitae powers — feats/subclass.",
  },
  {
    id: "biology",
    name: "Kindred Biology",
    level: 1,
    summary:
      "Darkvision 60; Sanguivore; Sunlight 5 Radiant start of turn in sunlight; Undead (Kindred); Vulnerability Fire/Radiant; auto-success death saves; Fire/Radiant to 0 or beheading kills; wooden stake Piercing critical/to 0 → Paralyzed; Torpor at Exhaustion 6; Long Rest needs ≥1 BP (Awaken).",
  },
  {
    id: "bestial-fury",
    name: "Bestial Fury / Flurry",
    level: 5,
    summary:
      "1/turn hit melee/unarmed: spend Beast use → roll damage dice twice, use either (no leave-at-1). Under Beast: Attack twice when you take Attack action.",
  },
  {
    id: "improved-feed",
    name: "Improved Feed",
    level: 5,
    summary: "Feed как Bonus Action. Grappled by you: Disadvantage on checks to escape.",
  },
  {
    id: "vampiric-will",
    name: "Vampiric Will",
    level: 10,
    summary: "Advantage on saves to avoid/end Charmed и against turn undead.",
  },
  {
    id: "efficient-feeding",
    name: "Efficient Feeding",
    level: 14,
    summary: "Reroll any Feed die (must use new).",
  },
  {
    id: "ancient",
    name: "Ancient Awakening",
    level: 20,
    summary: "+2 к четырём Ability Scores (max 25, или выше если subclass позволяет).",
  },
];

export function getLevelRow(level: number): LevelRow {
  const clamped = Math.min(20, Math.max(1, level));
  return KINDRED_LEVELS[clamped - 1]!;
}

export function getClan(id: ClanId): ClanDef | undefined {
  return CLANS.find((c) => c.id === id);
}
