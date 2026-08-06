/** Справочник билдера Kindred · Ventrue / Toreador · PHB 2024 + Bound by Blood */

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
/** Ability Score Improvement levels (feat or ASI). L19 is Epic Boon separately. */
export const ASI_LEVELS = [4, 8, 12, 16] as const;
export const EPIC_BOON_LEVEL = 19;

export function asiCount(level: number) {
  return ASI_LEVELS.filter((l) => level >= l).length;
}

export function hasEpicBoon(level: number) {
  return level >= EPIC_BOON_LEVEL;
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

/** ─── Bane by clan (RAW-ish BBB) ─── */

/** Ventrue: preferred blood type for full feed dice */
export const VENTRUE_BANE_SHORT =
  "Предпочтённая кровь: питание «не тем» — половина костей (мин. 1).";

/** Toreador: attention trap on Investigation / Perception */
export const TOREADOR_BANE_SHORT =
  "d20 ≤9 на Анализ или Внимательность → Обездвижен (Restrained), спас Муд. DC 10.";

export const TOREADOR_BANE_FIELD =
  "Bane: d20≤9 Анализ/Внимательность → Обездвижен (DC 10 Муд.)";

export const TOREADOR_TOOLS = [
  "Лютня / музыкальный инструмент",
  "Набор художника",
  "Инструменты каллиграфа",
  "Воровские инструменты",
  "Набор гримёра",
  "Свой инструмент…",
] as const;

export function clanNameRu(clan: string | undefined | null): string {
  if (clan === "toreador") return "Тореадор";
  if (clan === "ventrue") return "Вентру";
  return clan || "—";
}

/** One-line Bane for HUD / export / reminders */
export function clanBaneLine(
  clan: string | undefined | null,
  preferredBlood?: string | null,
): string {
  if (clan === "toreador") {
    return TOREADOR_BANE_SHORT;
  }
  // ventrue + default
  const blood = (preferredBlood || "").trim();
  return blood
    ? `Bane (кровь): ${blood} · иначе ½ костей питания`
    : "Bane (Вентру): укажите предпочтённую кровь";
}

export function isVentrueClan(clan: string | undefined | null) {
  return !clan || clan === "ventrue" || clan === "none";
}

export function isToreadorClan(clan: string | undefined | null) {
  return clan === "toreador";
}

export const MECHANICS_GUIDE = [
  {
    id: "kindred",
    title: "База сородича",
    body: `Питание: кости d6 по уровню; 6 → +1 ОБК.
Зверь: преимущество, потом Голод.
Awaken: 1 ОБК после LR (иначе слабость).
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
    id: "toreador",
    title: "Клан Тореадор",
    body: `Bane (не про кровь!): если на проверке Анализа или Внимательности на d20 выпало 9 или меньше — вы Обездвижены (Restrained), пока не пройдёте спас Мудрости DC 10 (или как в PDF стола).

Душа художника / Artist's Soul: преимущество на Анализ и Внимательность, тёмное зрение и доп. навыки (см. вехи).
Presence / Aura: обаяние и контроль через чувства, не Dominate.
Не путайте с Bane Вентру (предпочтённая кровь).`,
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
    body: `Уровни Kindred 4, 8, 12, 16 (и 19 — эпик): +2 к одной характеристике (макс. 20) или +1 к двум, либо **любая черта**, для которой выполнены требования — в том числе **Kindred Feat** (RAW PDF).

Отдельно: на 2, 7, 10, 13, 17 класс **всегда** даёт слот черты сородича (Kindred Feat). Это не «вместо ASI», а **дополнительные** слоты.`,
  },
  {
    id: "multiclass",
    title: "Мультикласс",
    body: `Пример: Kindred 7 / Колдун 1.
ОБК и кости питания — по уровню Kindred.
Поле «Уровень» в билдере = уровень Kindred; «Мультикласс» — пометка.
БМ в D&D 2024 — по суммарному уровню персонажа (см. таблицу PB). Если играете 7+1=8, БМ=+3 — совпадает с Kindred 7–8.`,
  },
  {
    id: "session",
    title: "Соло-сессия (как играть с листом)",
    body: `1. Билдер → Применить.
2. Бой → Иниц (нижняя панель).
3. Новый ход → отметь Действие/БД/Реакцию.
4. Атака / Приказ / Питание — тап.
5. Урон по вам — «Получить урон».
6. 0 ХП — Protected 0→1 или автоуспех death saves.
7. Соц: Awe → Убеждение / Daunt.
8. Отдых: короткий (HD, Зверь, Голос) / длинный (≥1 ОБК).`,
  },
  {
    id: "sources",
    title: "Источники (RAW)",
    body: `• Vampire: The Masquerade – Bound by Blood (класс Kindred, Ventrue, Toreador, Touchstone, Protected).
• dnd.su / PHB 2024: Человек, Везучий (Lucky), point buy, стандартный массив, фоны +2/+1.
• Черты сородича: слоты 2/7/10/13/17 + можно взять Kindred Feat на ASI 4/8/12/16 вместо +2.`,
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

/** Ventrue preferred-blood presets only */
export const PREFERRED_BLOOD_PRESETS = [
  "солдаты / военные",
  "аристократы",
  "преступники",
  "учёные",
  "духовенство",
  "политики",
  "свой вариант…",
];

/** Optional aesthetic notes for Toreador (not a Bane requirement) */
export const TOREADOR_AESTHETIC_PRESETS = [
  "артисты / сцена",
  "красавцы / модели",
  "музыка / клубы",
  "галереи / богема",
  "ночные вечеринки",
  "свой вкус…",
];
