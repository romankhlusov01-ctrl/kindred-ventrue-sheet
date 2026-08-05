/** Справочник билдера Kindred · Ventrue · PHB 2024 + Bound by Blood */

import type { SkillId } from "@/data/skills";
import type { Abilities } from "@/lib/character-store";

/** Навыки класса Сородич (типичный список по PDF/справочникам 5e-класса) — выбрать 2 */
export const KINDRED_CLASS_SKILLS: SkillId[] = [
  "athletics",
  "deception",
  "insight",
  "intimidation",
  "perception",
  "persuasion",
  "stealth",
  "survival",
];

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8] as const;

export const POINT_BUY_COST: Record<number, number> = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

export const POINT_BUY_BUDGET = 27;

export function pointBuySpent(scores: number[]): number {
  return scores.reduce((sum, s) => sum + (POINT_BUY_COST[s] ?? 99), 0);
}

export function abilityMod(score: number) {
  return Math.floor((score - 10) / 2);
}

/** HP Kindred (d8): 8+Тел на 1 ур., затем среднее 5+Тел за уровень */
export function calcKindredHp(level: number, con: number, ventrueDareNotFalter: boolean) {
  const conMod = abilityMod(con);
  let hp = 8 + conMod;
  for (let i = 2; i <= level; i++) {
    hp += 5 + conMod;
  }
  // Ventrue L6: +level once when gained, then +1/level — approximate if level>=6: +level + (level-6)
  if (ventrueDareNotFalter && level >= 6) {
    hp += level; // flat +level at gain
    hp += Math.max(0, level - 6); // +1 each level after 6
  }
  return Math.max(1, hp);
}

/** Слоты черт сородича по уровню */
export function kindredFeatSlots(level: number): number {
  let n = 0;
  for (const L of [2, 7, 10, 13, 17]) {
    if (level >= L) n++;
  }
  return n;
}

/** ASI levels for Kindred */
export const ASI_LEVELS = [4, 8, 12, 16, 19] as const;

export function asiCount(level: number) {
  return ASI_LEVELS.filter((l) => level >= l).length;
}

export const BUILDER_STEPS = [
  { id: "concept", title: "Концепт", short: "Имя · ур." },
  { id: "origin", title: "Происхождение", short: "Раса · био" },
  { id: "abilities", title: "Характеристики", short: "Статы" },
  { id: "skills", title: "Навыки", short: "Навыки" },
  { id: "feats", title: "Черты", short: "Черты" },
  { id: "mechanics", title: "Механики", short: "Правила" },
  { id: "finish", title: "Итог", short: "Готово" },
] as const;

export type BuilderStepId = (typeof BUILDER_STEPS)[number]["id"];

export const MECHANICS_GUIDE: { id: string; title: string; body: string }[] = [
  {
    id: "feed",
    title: "Питание (Feed)",
    body: `Действие (с 5 ур. — бонусное): цель в 5 фт. — добровольна, Очарована, либо Недееспособна/Схвачена/Парализована/Обездвижена/Оглушена/Без сознания.

Бросок: Кости питания (по таблице) + мод. Тел (мин. 1). Урон некротический только снижает максимум хитов цели.

«6» на d6 → +1 Очко крови. Макс. хитов цели → 0: +1 ОБК.
Добровольные/Очарованные могут сжечь 1 HD → вы +1 ОБК.

Лимит крови с одной цели за LR: S1 / M3 / L5 / H7 / G10.`,
  },
  {
    id: "beast",
    title: "Зверь (The Beast)",
    body: `Бонусное действие: преимущество на d20-тесты до начала вашего следующего хода.
Использований = БМ; восстановление — короткий или долгий отдых.

Голод: провал d20 со Зверем → кровавая ярость 1 мин (или до Питания): обязаны гнаться за добычей и хватать/питаться.
1 ОБК снимает Голод при провале.`,
  },
  {
    id: "bp",
    title: "Очки крови",
    body: `Пул по таблице уровня (не восстанавливается отдыхом — только Питание и эффекты).

Исцеление ран: БД, 1 ОБК → 1d10 + уровень Kindred хитов.
Силы клана и черты сородича часто тратят ОБК.

Awaken: чтобы получить пользу долгого отдыха, нужно ≥1 ОБК; иначе только короткий.`,
  },
  {
    id: "biology",
    title: "Биология сородича",
    body: `Нежить (Kindred) + ваш тип. Не стареете. Тёмное зрение 60 фт.
Солнце: 5 лучистого в начале хода.
Уязвимость к Огню и Лучу.
Death saves: автоуспех. 0 хитов от Огня/Луча или обезглавливание = смерть.
Деревянный кол (крит/0 хитов) → Паралич, пока кол не вынут.
Сверхъестественное колдовство: Харизма; урон не сбивает концентрацию своих заклинаний.`,
  },
  {
    id: "ventrue",
    title: "Клан Вентру",
    body: `Bane: предпочтённый тип крови — при питании «не тем» бросайте половину костей питания (мин. 1).

Голос власти (3): Приказ / Внушение, число = БМ / короткий.
Непоколебимая уверенность: преимущество на спас Мудрости.
Ур.6: +макс. хиты; reroll спас vs Charm/Fear/Stun.
Далее: Entrance, Terrify, Mass Suggestion, Flesh of Marble, Imposing Aura…`,
  },
  {
    id: "luck",
    title: "Две удачи (Lucky + Protected)",
    body: `Везучий (человек / черта происхождения, dnd.su): пул = БМ.
• Потратить → преимущество на свой d20.
• Потратить → помеха на атаку по вам.

Защищённый (Опора / PDF): пул = БМ, отдельный.
• d20 ≤9 → переброс.
• 0 хитов → 1 хит.

Оба пула восстанавливаются на долгом отдыхе.`,
  },
  {
    id: "asi",
    title: "Улучшение характеристик (ASI)",
    body: `Уровни Kindred 4, 8, 12, 16, 19: +2 к одной характеристике (макс. 20) или +1 к двум, либо черта (не Kindred feat slot — обычная/общая, по правилам стола).

Черты сородича — отдельно на 2, 7, 10, 13, 17. Их нельзя заменить слотом ASI (RAW PDF).`,
  },
  {
    id: "multiclass",
    title: "Мультикласс",
    body: `Пример: Kindred 7 / Колдун 1.
ОБК и кости питания — по уровню Kindred.
БМ — по общему уровню персонажа (в этом листе БМ считается от уровня Kindred-поля; для 7/1 выставите уровень 7 Kindred и укажите «Колдун 1» в мультиклассе, а БМ вручную учтите как 3 если мастер требует суммарный 8-й уровень — см. таблицу PHB).

В этом билдере поле «Уровень» = уровень Kindred; «Мультикласс» — текстовая пометка.`,
  },
];

export const ABILITY_LABELS: { key: keyof Abilities; ru: string; short: string }[] = [
  { key: "str", ru: "Сила", short: "СИЛ" },
  { key: "dex", ru: "Ловкость", short: "ЛОВ" },
  { key: "con", ru: "Телосложение", short: "ТЕЛ" },
  { key: "int", ru: "Интеллект", short: "ИНТ" },
  { key: "wis", ru: "Мудрость", short: "МУД" },
  { key: "cha", ru: "Харизма", short: "ХАР" },
];

export const PREFERRED_BLOOD_PRESETS = [
  "солдаты / военные",
  "аристократы",
  "преступники",
  "учёные",
  "духовенство",
  "художники",
  "дети (тёмный Bane)",
  "свой вариант…",
];
