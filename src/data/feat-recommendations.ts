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
  // ─── PHB general ───
  "resilient-con": {
    tags: ["спас", "концентрация"],
    note: "Устойчивый Тел — топ для концентрации. Оба клана.",
    clans: ["ventrue", "toreador"],
  },
  "resilient-wis": {
    tags: ["спас"],
    note: "Устойчивый Муд — ментальная защита. Оба клана.",
    clans: ["ventrue", "toreador"],
  },
  "resilient-dex": {
    tags: ["спас"],
    note: "Устойчивый Лов — finesse / AoE. Тореадор и мобильные.",
    clans: ["toreador", "ventrue"],
  },
  "resilient-str": {
    tags: ["спас"],
    note: "Устойчивый Сил — захват-танк Вентру.",
    clans: ["ventrue"],
  },
  "resilient-int": {
    tags: ["спас"],
    note: "Устойчивый Инт — редко, но для Auspex-линии.",
    clans: ["toreador"],
  },
  "resilient-cha": {
    tags: ["спас"],
    note: "У Kindred уже спас Хар — обычно берите Тел/Муд/Лов.",
    clans: ["ventrue", "toreador"],
  },
  actor: {
    tags: ["соц"],
    note: "Тореадор-актёр / Вентру-двойник.",
    clans: ["toreador", "ventrue"],
  },
  "war-caster": {
    tags: ["концентрация"],
    note: "Концентрация + соматика. Вместе с Устойчивый·Тел — железо.",
    clans: ["ventrue", "toreador"],
  },
  observant: {
    tags: ["внимательность"],
    note: "Тореадор: ещё сильнее читает комнату. Вентру — соц-разведка.",
    clans: ["toreador", "ventrue"],
  },
  "skill-expert": {
    tags: ["навыки"],
    note: "Экспертиза Убеждения / Внимательности / Обмана. Оба клана.",
    clans: ["toreador", "ventrue"],
  },
  "inspiring-leader": {
    tags: ["лидер"],
    note: "Temp HP свите — Вентру-вождь и Тореадор-икона.",
    clans: ["ventrue", "toreador"],
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
  "shadow-touched": {
    tags: ["магия"],
    note: "Невидимость + некро/иллюзия 1 круга.",
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
  durable: {
    tags: ["хиты"],
    note: "Hit Dice эффективнее — оба клана.",
    clans: ["ventrue", "toreador"],
  },
  crusher: {
    tags: ["бой"],
    note: "Дробящий контроль — безоружный / Lethal Вентру.",
    clans: ["ventrue"],
  },
  piercer: {
    tags: ["бой"],
    note: "Короткий меч / клыки finesse — Тореадор.",
    clans: ["toreador"],
  },
  slasher: {
    tags: ["бой"],
    note: "Рубящий контроль скорости.",
    clans: ["ventrue", "toreador"],
  },
  "tough-general": {
    tags: ["хиты"],
    note: "+2 ХП/уровень — если не брали origin Крепкий.",
    clans: ["ventrue", "toreador"],
  },
  "weapon-master": {
    tags: ["оружие"],
    note: "Weapon Mastery PHB 2024 — оба клана с оружием.",
    clans: ["ventrue", "toreador"],
  },
};
