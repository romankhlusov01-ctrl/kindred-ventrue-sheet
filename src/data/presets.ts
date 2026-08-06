/**
 * Релизные пресеты · v6
 * Только актуальная логика: dual luck, оба клана, формулы HP/ОБК, Проклятие.
 * Старые id (preset-ventrue-7-wl1, preset-ventrue-8, …) удалены.
 */
import type { CharacterSheet } from "@/lib/character-store";
import { calcKindredHp } from "@/data/builder-ru";
import { getLevelData } from "@/data/kindred-ru";
import { BANE } from "@/data/terms-ru";
import { defaultAttacks } from "@/data/builder-presets";

const SOLO = {
  actionUsed: false,
  bonusUsed: false,
  reactionUsed: false,
  movementUsed: false,
  beastActive: false,
  rollMode: "norm" as const,
  initiative: null as number | null,
  pendingAdv: false,
  pendingDis: false,
  scenario: "combat" as const,
  round: 1,
};

function base(
  partial: Omit<CharacterSheet, keyof typeof SOLO> & Partial<typeof SOLO>,
): CharacterSheet {
  return { ...SOLO, ...partial } as CharacterSheet;
}

function pb(level: number) {
  return getLevelData(level).pb;
}

function bp(level: number) {
  return getLevelData(level).bp;
}

/** ─── Вентру 8 · dual luck · контроль ─── */
export const PRESET_VENTRUE_PLAYER: CharacterSheet = (() => {
  const level = 8;
  const abilities = { str: 8, dex: 14, con: 16, int: 8, wis: 10, cha: 17 };
  const hp = calcKindredHp(level, abilities.con, true);
  const b = pb(level);
  const feats = ["forceful", "lethal"] as string[];
  return base({
    id: "preset-ventrue-v6",
    name: "Владыка крови",
    player: "",
    clan: "ventrue",
    level,
    background: "Опора (Touchstone)",
    backgroundId: "touchstone",
    species: "Человек",
    alignment: "Законно-нейтральный",
    abilities,
    hpCurrent: hp,
    hpMax: hp,
    tempHp: 0,
    ac: 14,
    speed: 30,
    bloodCurrent: bp(level),
    beastUsed: 0,
    hunger: false,
    preferredBlood: "солдаты / военные",
    skillProfs: {
      persuasion: "proficient",
      survival: "proficient",
      intimidation: "proficient",
      deception: "proficient",
      insight: "proficient",
      perception: "proficient",
    },
    saveProfs: { con: true, cha: true },
    selectedFeats: feats,
    generalFeats: [],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
    luckyUsed: 0,
    protectedUsed: 0,
    humanSkill: "deception",
    fiendishLegacy: "",
    feats: [
      "Человек · Везучий (Lucky)",
      "Опора · Защищённый (Protected)",
      "Ур.2: Властное присутствие",
      "Ур.4: ASI (+Хар/+Тел)",
      "Ур.7: Смертельное тело",
      "Ур.8: ASI",
    ].join("\n"),
    equipment:
      "Нагрудник\nКороткий меч\n2 кинжала\nДорожная одежда\nФлакон vitae\nПерстень дома\n15 зм",
    notes: [
      "Вентру 8 · dual luck · Сл = 8+БМ+Хар.",
      BANE.ventrueLine("солдаты / военные"),
      "Голос власти = БМ / короткий. Непоколебимая уверенность: преим. спас Муд.",
      "Не дрогнуть (6): +макс. ХП.",
    ].join(" "),
    multiclass: "",
    attacks: defaultAttacks(level, abilities, feats),
    conditions: [],
    deathSuccess: 0,
    deathFail: 0,
    inspiration: true,
    concentrating: "",
    voiceUses: 0,
    hitDiceUsed: 0,
    sessionLog: [],
    customResources: [
      {
        id: "cr-voice",
        name: "Голос власти",
        current: b,
        max: b,
        note: "Приказ / Внушение · короткий или продолжительный",
      },
      {
        id: "cr-presence",
        name: "Властное присутствие",
        current: b,
        max: b,
        note: "Awe / Daunt · LR",
      },
    ],
  });
})();

/** ─── Тореадор 8 · dual luck · Presence / Auspex ─── */
export const PRESET_TOREADOR_PLAYER: CharacterSheet = (() => {
  const level = 8;
  const abilities = { str: 8, dex: 16, con: 14, int: 12, wis: 12, cha: 16 };
  const hp = calcKindredHp(level, abilities.con, false);
  const b = pb(level);
  const feats = ["forceful", "alacrity"] as string[];
  return base({
    id: "preset-toreador-v6",
    name: "Алая роза",
    player: "",
    clan: "toreador",
    level,
    background: "Опора (Touchstone)",
    backgroundId: "touchstone",
    species: "Человек",
    alignment: "Хаотично-нейтральный",
    abilities,
    hpCurrent: hp,
    hpMax: hp,
    tempHp: 0,
    ac: 14,
    speed: 40,
    bloodCurrent: bp(level),
    beastUsed: 0,
    hunger: false,
    preferredBlood: BANE.toreadorField + " · вкус: артисты",
    skillProfs: {
      persuasion: "proficient",
      survival: "proficient",
      insight: "proficient",
      perception: "expertise",
      investigation: "proficient",
      performance: "proficient",
      deception: "proficient",
    },
    saveProfs: { con: true, cha: true },
    selectedFeats: feats,
    generalFeats: [],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
    luckyUsed: 0,
    protectedUsed: 0,
    humanSkill: "deception",
    fiendishLegacy: "",
    feats: [
      "Человек · Везучий (Lucky)",
      "Опора · Защищённый (Protected)",
      "Ур.2: Властное присутствие",
      "Ур.3: Душа художника (+Анализ/Вним, ТЗ 120, +2 навыка)",
      "Ур.4: ASI",
      "Ур.6: Глубина чувств",
      "Ур.7: Проворство",
      "Ур.8: ASI",
    ].join("\n"),
    equipment:
      "Кожаный доспех\nКороткий меч\nКинжал\nЛютня\nВечерняя одежда\n15 зм",
    notes: [
      "Тореадор 8 · dual luck · Сл = 8+БМ+Хар.",
      BANE.toreadorShort,
      "Душа художника: преим. Анализ/Внимательность. Глубина чувств: ОБК.",
      "Проворство: +10 ск., преим. иниц.",
    ].join(" "),
    multiclass: "",
    attacks: defaultAttacks(level, abilities, feats).map((a) =>
      a.id === "atk-feed"
        ? { ...a, notes: "Урон к макс. ХП · с 5 ур. БД" }
        : a,
    ),
    conditions: [],
    deathSuccess: 0,
    deathFail: 0,
    inspiration: true,
    concentrating: "",
    voiceUses: 0,
    hitDiceUsed: 0,
    sessionLog: [],
    customResources: [
      {
        id: "cr-presence",
        name: "Властное присутствие",
        current: b,
        max: b,
        note: "Awe / Daunt · LR",
      },
      {
        id: "cr-alacrity",
        name: "Проворство",
        current: b,
        max: b,
        note: "доп. действие · 1 ОБК",
      },
    ],
  });
})();

/** Пустой лист L3 — выбор клана в билдере */
export const BLANK_TEMPLATE = (): CharacterSheet => {
  const level = 3;
  const abilities = { str: 10, dex: 12, con: 14, int: 10, wis: 12, cha: 15 };
  const hp = calcKindredHp(level, abilities.con, false);
  return base({
    id: `char-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "Новый сородич",
    player: "",
    clan: "none",
    level,
    background: "Опора (Touchstone)",
    backgroundId: "touchstone",
    species: "Человек",
    alignment: "",
    abilities,
    hpCurrent: hp,
    hpMax: hp,
    tempHp: 0,
    ac: 13,
    speed: 30,
    bloodCurrent: bp(level),
    beastUsed: 0,
    hunger: false,
    preferredBlood: "",
    skillProfs: {
      persuasion: "proficient",
      survival: "proficient",
    },
    saveProfs: { con: true, cha: true },
    selectedFeats: [],
    generalFeats: [],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
    luckyUsed: 0,
    protectedUsed: 0,
    humanSkill: "perception",
    fiendishLegacy: "",
    feats: "Человек · Везучий · Опора · Защищённый",
    equipment: "",
    notes: "Откройте Создать → выберите Вентру или Тореадор → Применить.",
    multiclass: "",
    attacks: defaultAttacks(level, abilities, []),
    conditions: [],
    deathSuccess: 0,
    deathFail: 0,
    inspiration: false,
    concentrating: "",
    voiceUses: 0,
    hitDiceUsed: 0,
    sessionLog: [],
    customResources: [],
  });
};

/** Каталог релизных пресетов (библиотека) */
export const RELEASE_PRESETS: { id: string; label: string; sheet: () => CharacterSheet }[] = [
  {
    id: "ventrue-8",
    label: "+ Вентру 8",
    sheet: () => ({
      ...PRESET_VENTRUE_PLAYER,
      id: `vp-${Date.now()}`,
    }),
  },
  {
    id: "toreador-8",
    label: "+ Тореадор 8",
    sheet: () => ({
      ...PRESET_TOREADOR_PLAYER,
      id: `tr-${Date.now()}`,
    }),
  },
];

/** Старые id — при migrate v6 выкидываем */
export const LEGACY_PRESET_IDS = [
  "preset-ventrue-player",
  "preset-ventrue-7-wl1",
  "preset-ventrue-8",
  "preset-toreador-1",
  "preset-ventrue-v5",
  "preset-toreador-v5",
];

/** Стартовая библиотека релиза */
export function releaseLibrary(): {
  activeId: string;
  characters: CharacterSheet[];
  character: CharacterSheet;
} {
  const v = { ...PRESET_VENTRUE_PLAYER };
  const t = { ...PRESET_TOREADOR_PLAYER };
  return {
    activeId: v.id,
    characters: [v, t],
    character: v,
  };
}
