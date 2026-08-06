/** Recommended Kindred + general feats by clan */
export const FEAT_RECS: Record<string, { tags: string[]; note: string; clans?: string[] }> = {
  forceful: {
    tags: ["соц", "presence"],
    note: "Awe + Daunt. Сильно для Вентру и Тореадор (соц).",
    clans: ["ventrue", "toreador"],
  },
  lethal: {
    tags: ["бой", "захват"],
    note: "Питание через захват. Сильно с Вентру 5+ и Potence-feel.",
    clans: ["ventrue"],
  },
  alacrity: {
    tags: ["бой", "celerity"],
    note: "Доп. действие — идеально с Тореадор Live Fast / finesse.",
    clans: ["toreador"],
  },
  convincing: {
    tags: ["соц", "dominate"],
    note: "+1 Хар и скрытое очарование. С 7 ур. — оба клана.",
    clans: ["ventrue", "toreador"],
  },
  heightened: {
    tags: ["auspex", "разведка"],
    note: "Тореадор: синергия с Душой художника и Проклятием (внимание).",
    clans: ["toreador"],
  },
  "self-control": {
    tags: ["зверь"],
    note: "Контроль Голода — полезно всем, кто жжёт Зверя.",
    clans: ["ventrue", "toreador"],
  },
  hardened: {
    tags: ["танк"],
    note: "+1 Тел и сопротивление. Линия Вентру-танка.",
    clans: ["ventrue"],
  },
  "mind-tricks": {
    tags: ["dominate"],
    note: "Бесплатный Приказ + «Забыть». Ядро Вентру.",
    clans: ["ventrue"],
  },
  daywalker: {
    tags: ["выживание"],
    note: "Если кампания днём — почти обязательно.",
    clans: ["ventrue", "toreador"],
  },
  kiss: {
    tags: ["питание", "соц"],
    note: "d4-питание с шансом очаровать — шпионский / романтичный стиль.",
    clans: ["toreador", "ventrue"],
  },
  cloak: {
    tags: ["скрытность"],
    note: "Стелс-Тореадор или скрытный Вентру.",
    clans: ["toreador"],
  },
  "vitae-conc": {
    tags: ["кровь"],
    note: "Больше ОБК — больше Presence/Dominate в раунде.",
    clans: ["ventrue", "toreador"],
  },
  loyal: {
    tags: ["миньон"],
    note: "Свита лорда Вентру.",
    clans: ["ventrue"],
  },
  // general
  actor: {
    tags: ["соц"],
    note: "Тореадор-актёр / Вентру-двойник.",
    clans: ["toreador", "ventrue"],
  },
  "war-caster": {
    tags: ["концентрация"],
    note: "Если держите Suggestion / Presence-эффекты с концентрацией.",
    clans: ["ventrue", "toreador"],
  },
  resilient: {
    tags: ["спас"],
    note: "Часто Тел (концентрация) или Муд.",
    clans: ["ventrue"],
  },
  observant: {
    tags: ["внимательность"],
    note: "Тореадор: ещё сильнее читает комнату.",
    clans: ["toreador"],
  },
  "skill-expert": {
    tags: ["навыки"],
    note: "Экспертиза Убеждения / Внимательности / Обмана.",
    clans: ["toreador", "ventrue"],
  },
  "inspiring-leader": {
    tags: ["лидер"],
    note: "Вентру-вождь: temp HP свите.",
    clans: ["ventrue"],
  },
  telepathic: {
    tags: ["контроль"],
    note: "Соц-контроль без слов — оба клана.",
    clans: ["ventrue", "toreador"],
  },
  "fey-touched": {
    tags: ["магия"],
    note: "Misty Step + очарование — мобильный хищник.",
    clans: ["toreador", "ventrue"],
  },
  grappler: {
    tags: ["захват"],
    note: "С Lethal + питание в захвате.",
    clans: ["ventrue"],
  },
  "defensive-duelist": {
    tags: ["кд"],
    note: "Тореадор finesse-билд.",
    clans: ["toreador"],
  },
  speedy: {
    tags: ["мобильность"],
    note: "С Alacrity / Live Fast.",
    clans: ["toreador"],
  },
};
