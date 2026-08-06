/**
 * Единый словарь UI · Bound by Blood (PDF) + dnd.su / PHB 2024.
 * Русский термин — основной; английский PDF — в скобках при первом упоминании.
 */

export const APP = {
  title: "Сородич · лист и билдер",
  sources: "Bound by Blood · dnd.su · PHB 2024",
  modeCreate: "Создать",
  modeCreateSub: "Вентру / Тореадор",
  modePlay: "Играть",
  modePlaySub: "лист · броски",
} as const;

export const CLAN = {
  ventrue: "Вентру",
  ventrueEn: "Ventrue",
  toreador: "Тореадор",
  toreadorEn: "Toreador",
  none: "Без клана",
} as const;

export function clanLabel(clan: string | undefined | null, withEn = false): string {
  if (clan === "toreador") return withEn ? `${CLAN.toreador} (${CLAN.toreadorEn})` : CLAN.toreador;
  if (clan === "ventrue") return withEn ? `${CLAN.ventrue} (${CLAN.ventrueEn})` : CLAN.ventrue;
  if (!clan || clan === "none") return CLAN.none;
  return clan;
}

/** Сокращения — всегда так */
export const ABBR = {
  bp: "ОБК",
  bpFull: "Очко крови (Blood Point)",
  pb: "БМ",
  pbFull: "бонус мастерства",
  ba: "БД",
  baFull: "бонусное действие",
  dc: "Сл",
  dcFull: "сложность",
  hp: "ХП",
  hd: "КХ",
  lr: "продолжительный отдых",
  sr: "короткий отдых",
} as const;

export const BANE = {
  label: "Проклятие (Bane)",
  ventrueShort:
    "Предпочтённая кровь: питание «не своей» — половина костей Питания (мин. 1).",
  ventrueLine: (blood?: string | null) => {
    const b = (blood || "").trim();
    return b
      ? `Проклятие Вентру: кровь «${b}» · иначе ½ костей Питания`
      : "Проклятие Вентру: укажите предпочтённую кровь";
  },
  toreadorShort:
    "d20 ≤ 9 на Анализ или Внимательность → Обездвижен; спас Муд. Сл 10 в конце хода.",
  toreadorField:
    "Проклятие: d20≤9 Анализ/Внимательность → Обездвижен (Сл 10 Муд.)",
  condition: "Обездвижен (Проклятие)",
} as const;

export function baneLine(clan: string | undefined | null, preferredBlood?: string | null): string {
  if (clan === "toreador") return BANE.toreadorShort;
  return BANE.ventrueLine(preferredBlood);
}

export const FEATURES = {
  kindred: "Сородич (Kindred)",
  feed: "Питание (Feed)",
  beast: "Зверь (The Beast)",
  hunger: "Голод (Hunger)",
  awaken: "Пробуждение (Awaken)",
  voice: "Голос власти (Voice of Authority)",
  unshakable: "Непоколебимая уверенность (Unshakably Confident)",
  dnf: "Не дрогнуть (Dare Not Falter)",
  artistSoul: "Душа художника (An Artist's Soul)",
  depth: "Глубина чувств (Depth of Feelings)",
  liveFast: "Живи быстро… (Live Fast…)",
  visionary: "Провидец (Visionary)",
  majestic: "Истинно величественный (Truly Majestic)",
  magnum: "Magnum Opus",
  lucky: "Везучий (Lucky)",
  protected: "Защищённый (Protected)",
  forceful: "Властное присутствие (Forceful Presence)",
  alacrity: "Проворство (Alacrity)",
  kindredFeat: "черта сородича (Kindred Feat)",
  asi: "Улучшение характеристик (ASI)",
  epic: "Эпическое благословение (Epic Boon)",
} as const;

export const COPY = {
  dualLuck: "Две удачи: Везучий (dnd.su) + Защищённый (Опора, PDF).",
  spellcasting: "Сверхъестественное колдовство: Харизма; Сл = 8 + БМ + Хар.",
  equalClans:
    "Оба клана равноправны: Вентру (Dominate) и Тореадор (Presence / Auspex). Выберите на шаге «Концепт».",
  onboarding1: "Создать — билдер Сородича: Вентру или Тореадор (PDF + dnd.su).",
  onboarding2: "Играть — лист: тап по проверке / атаке → бросок в журнал.",
  onboarding3: "Четыре вкладки: Проверки · Бой · Сородич · Ещё.",
  feedHalfVentrue: "½ Питания (Проклятие)",
  feedHalfOptional: "½ кости",
  feedFull: "Питание",
  healBp: "Лечение (−1 ОБК)",
} as const;

/** Единые подписи вкладок листа */
export const PLAY_TABS = {
  checks: "Проверки",
  combat: "Бой",
  kindred: "Сородич",
  more: "Ещё",
} as const;
