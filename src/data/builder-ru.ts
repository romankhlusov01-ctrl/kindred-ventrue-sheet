/** Справочник билдера · Сородич (Вентру / Тореадор) · PDF + dnd.su */

import type { SkillId } from "@/data/skills";
import type { Abilities } from "@/lib/character-store";
import { BANE, CLAN, COPY, FEATURES, baneLine, clanLabel } from "@/data/terms-ru";

export { BANE, CLAN, COPY, FEATURES, baneLine, clanLabel };
export { clanLabel as clanNameRu, baneLine as clanBaneLine };

/** Навыки класса Сородич — выбрать 2 */
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

/** ХП Сородича (d8): 8+Тел, далее среднее 5+Тел; Вентру L6+ — Dare Not Falter */
export function calcKindredHp(level: number, con: number, ventrueDareNotFalter: boolean) {
  const conMod = abilityMod(con);
  let hp = 8 + conMod;
  for (let i = 2; i <= level; i++) {
    hp += 5 + conMod;
  }
  // Dare Not Falter: +level at gain, then +1 per further level ⇒ total +level
  if (ventrueDareNotFalter && level >= 6) {
    hp += level;
  }
  return Math.max(1, hp);
}

export function kindredFeatSlots(level: number): number {
  let n = 0;
  for (const L of [2, 7, 10, 13, 17]) {
    if (level >= L) n++;
  }
  return n;
}

/** ASI: 4 / 8 / 12 / 16. Ур. 19 — эпическое благословение. */
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
  { id: "origin", title: "Происхождение", short: "Вид · био" },
  { id: "abilities", title: "Характеристики", short: "Статы" },
  { id: "skills", title: "Навыки", short: "Навыки" },
  { id: "feats", title: "Черты", short: "Черты" },
  { id: "mechanics", title: "Правила", short: "Справка" },
  { id: "finish", title: "Итог", short: "Готово" },
] as const;

export type BuilderStepId = (typeof BUILDER_STEPS)[number]["id"];

export const VENTRUE_BANE_SHORT = BANE.ventrueShort;
export const TOREADOR_BANE_SHORT = BANE.toreadorShort;
export const TOREADOR_BANE_FIELD = BANE.toreadorField;

export const TOREADOR_TOOLS = [
  "Музыкальный инструмент",
  "Набор художника",
  "Инструменты каллиграфа",
  "Воровские инструменты",
  "Набор гримёра",
  "Свой инструмент…",
] as const;

export function isVentrueClan(clan: string | undefined | null) {
  return clan === "ventrue";
}

export function isToreadorClan(clan: string | undefined | null) {
  return clan === "toreador";
}

export const MECHANICS_GUIDE = [
  {
    id: "kindred",
    title: "База сородича",
    body: `Источник: Vampire: The Masquerade – Bound by Blood.

• ${FEATURES.feed}: кости d6 по таблице + Тел (мин. 1); «6» → +1 ${"ОБК"}.
• ${FEATURES.beast}: БД, преимущество на d20; провал → ${FEATURES.hunger}.
• ${FEATURES.awaken}: продолжительный отдых нужен ≥1 ОБК.
• Солнце: 5 лучистого в начале хода; уязвимость к Огню и Лучу.
• Death saves: автоуспех. 0 хитов от Огня/Луча или обезглавливание — смерть.
• Деревянный кол (крит / 0 хитов) → Паралич, пока не вынут.
• ${COPY.spellcasting}`,
  },
  {
    id: "clans",
    title: "Кланы (подклассы)",
    body: `${COPY.equalClans}

Оба клана открываются с 3 уровня. Билдер и лист поддерживают полный цикл: создание → apply → броски за столом.`,
  },
  {
    id: "ventrue",
    title: "Клан Вентру (Ventrue)",
    body: `${BANE.label}: ${BANE.ventrueShort}

• Ур. 3 — ${FEATURES.voice}: Приказ / Внушение, число = БМ / короткий или продолжительный отдых.
• Ур. 3 — ${FEATURES.unshakable}: преимущество на спас Мудрости.
• Ур. 6 — ${FEATURES.dnf}: +макс. хиты; переброс спас vs Очарование / Испуг / Оглушение.
• Далее: Entrance, Terrify, Mass Suggestion, Flesh of Marble, Imposing Aura (см. вехи и вкладку «Сородич»).`,
  },
  {
    id: "toreador",
    title: "Клан Тореадор (Toreador)",
    body: `${BANE.label}: ${BANE.toreadorShort}
(Это не предпочтённая кровь — у Тореадора другое проклятие.)

• Ур. 3 — ${FEATURES.artistSoul}: преимущество на Анализ и Внимательность; ТЗ 120 фт.; +2 навыка и инструмент.
• Ур. 6 — ${FEATURES.depth}: 2 ОБК взгляд ауры; 1 ОБК Calm / Charm.
• Ур. 9 — ${FEATURES.liveFast}: Лов +2 (макс. 25); БД 1 ОБК — доп. действие на БМ ходов.
• Ур. 11+ — Visionary, Truly Majestic, Magnum Opus (см. вехи).`,
  },
  {
    id: "luck",
    title: "Две удачи",
    body: `${COPY.dualLuck}

Везучий (человек / черта происхождения, dnd.su): пул = БМ.
• → преимущество на свой d20, или помеха на атаку по вам.

Защищённый (биография Опора, PDF): пул = БМ, отдельный.
• d20 ≤9 → переброс; 0 хитов → 1 хит.

Оба пула: продолжительный отдых.`,
  },
  {
    id: "asi",
    title: "ASI и черты",
    body: `Уровни 4, 8, 12, 16 — на выбор одно:
• ${FEATURES.asi}: +2 к одной или +1 к двум (макс. 20);
• универсальная черта PHB (dnd.su);
• ${FEATURES.kindredFeat}.

Слоты черты сородича на 2, 7, 10, 13, 17 — дополнительно, не вместо ASI.

Ур. 19 — ${FEATURES.epic} (или другая подходящая черта).`,
  },
  {
    id: "multiclass",
    title: "Мультикласс",
    body: `Пример: Сородич 7 / Колдун 1.
• ОБК и кости Питания — по уровню Сородича.
• БМ (dnd.su / PHB 2024) — по суммарному уровню.
• Поле «Уровень» в билдере = уровень Сородича; «Мультикласс» — пометка.`,
  },
  {
    id: "session",
    title: "Игра за столом",
    body: `1. Создать → шаги → Применить.
2. Играть → Проверки / Бой / Сородич.
3. Тап по навыку, спас, атаке, Питанию — бросок в журнал.
4. Урон по вам — «Получить урон»; 0 ХП — Защищённый 0→1 или авто death saves.
5. Отдых: короткий (Зверь, Голос, КХ) / продолжительный (≥1 ОБК).`,
  },
  {
    id: "sources",
    title: "Источники",
    body: `• Vampire: The Masquerade – Bound by Blood (класс Kindred, кланы Ventrue / Toreador, Protected, Touchstone).
• dnd.su / Player's Handbook 2024: вид (человек, тифлинг), Везучий, point buy, фоны +2/+1, универсальные черты.
• Черты сородича ≠ слоты ASI: 2/7/10/13/17 отдельно; на ASI можно взять Kindred Feat (RAW).`,
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

/** Предпочтённая кровь — только Вентру */
export const PREFERRED_BLOOD_PRESETS = [
  "солдаты / военные",
  "аристократы",
  "преступники",
  "учёные",
  "духовенство",
  "политики",
  "свой вариант…",
];

/** Эстетика Тореадора — не проклятие, опциональная заметка */
export const TOREADOR_AESTHETIC_PRESETS = [
  "артисты / сцена",
  "красавцы / модели",
  "музыка / клубы",
  "галереи / богема",
  "ночные вечеринки",
  "свой вкус…",
];
