/** Recommended Kindred feats by playstyle for Ventrue */
export const FEAT_RECS: Record<string, { tags: string[]; note: string }> = {
  forceful: {
    tags: ["соц", "контроль"],
    note: "Лучший соц-фичер: Awe + Daunt. Берите на 2 ур.",
  },
  lethal: {
    tags: ["бой", "захват"],
    note: "Питание через захват + урон без оружия. Отлично с Вентру 5+.",
  },
  alacrity: {
    tags: ["бой", "темп"],
    note: "Доп. действие и иниц. — если часто в ближнем.",
  },
  convincing: {
    tags: ["соц", "контроль"],
    note: "+1 Хар и скрытое очарование. С 7 ур.",
  },
  heightened: {
    tags: ["разведка"],
    note: "Преим. Внимательность/Проницательность + blindsight.",
  },
  "self-control": {
    tags: ["зверь"],
    note: "Контроль Голода. Полезно, если часто жжёте Зверя.",
  },
  hardened: {
    tags: ["танк"],
    note: "+1 Тел и сопротивление. С 7 ур.",
  },
  "mind-tricks": {
    tags: ["контроль"],
    note: "Бесплатный Приказ + «Забыть».",
  },
  daywalker: {
    tags: ["выживание"],
    note: "Если кампания днём — почти обязательно.",
  },
  kiss: {
    tags: ["питание", "соц"],
    note: "d4-питание с шансом очаровать — шпионский стиль.",
  },
};
