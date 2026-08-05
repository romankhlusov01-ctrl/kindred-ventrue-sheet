/** Источники: Bound by Blood PDF (RAW) + dnd.su / next.dnd.su (PHB 2024) */

export type OriginFeatDef = {
  id: string;
  name: string;
  nameEn: string;
  source: string;
  body: string;
  /** track as luck pool synced to PB */
  luckPool?: "lucky" | "protected";
};

export type BackgroundDef = {
  id: string;
  name: string;
  abilityScores: string;
  featId: string;
  skills: string;
  tool: string;
  equipment: string;
  description: string;
};

/** Человек · next.dnd.su/species/human · PHB 2024 */
export const HUMAN_SPECIES = {
  id: "human",
  name: "Человек",
  source: "dnd.su · PHB 2024",
  traits: [
    {
      name: "Тип существа",
      body: "Гуманоид. Размер: Средний (около 4–7 фт) или Маленький (2–4 фт) — на выбор. Скорость 30 футов.",
    },
    {
      name: "Находчивый (Resourceful)",
      body: "Вы получаете Героическое вдохновение каждый раз, когда завершаете Долгий отдых.",
    },
    {
      name: "Умелый (Skillful)",
      body: "Вы получаете владение одним навыком на ваш выбор.",
    },
    {
      name: "Гибкий (Versatile)",
      body: "Вы получаете одну черту Происхождения на ваш выбор. В этом билде: Везучий (Lucky).",
    },
  ],
};

/**
 * Везучий [Lucky] — черта происхождения PHB 2024
 * https://next.dnd.su/feats/313-lucky/
 */
export const FEAT_LUCKY: OriginFeatDef = {
  id: "lucky",
  name: "Везучий",
  nameEn: "Lucky",
  source: "dnd.su · PHB 2024 · черта происхождения",
  luckPool: "lucky",
  body: `Очки везения. Число = ваш Бонус мастерства. Восстановление всех после Долгого отдыха.

Преимущество. Когда вы совершаете Тест d20, можете потратить 1 Очко везения, чтобы дать этому броску Преимущество.

Помеха на атаку по вам. Когда существо совершает бросок атаки по вам, можете потратить 1 Очко везения, чтобы наложить на этот бросок Помеху.

Преимущества/помехи не складываются (см. правила d20 Test).`,
};

/**
 * Защищённый [Protected] — Origin Feat, Bound by Blood PDF
 * Даёт биография Touchstone (Опора)
 */
export const FEAT_PROTECTED: OriginFeatDef = {
  id: "protected",
  name: "Защищённый",
  nameEn: "Protected",
  source: "Bound by Blood · черта происхождения",
  luckPool: "protected",
  body: `Очки удачи (Luck Points). Число = ваш Бонус мастерства. Восстановление всех после Долгого отдыха.

Переброс. Когда вы совершаете Тест d20 и выпало 9 или меньше на d20, можете потратить 1 Очко удачи, чтобы перебросить d20. Нужно принять второй результат.

Стабилизация. Когда вас снижают до 0 хитов и не убивают outright, можете потратить 1 Очко удачи, чтобы вместо этого оказаться на 1 хите.

Это отдельный пул от Везучего (Lucky): эффекты разные, хотя оба масштабируются с БМ.`,
};

export const ORIGIN_FEATS: OriginFeatDef[] = [
  FEAT_LUCKY,
  FEAT_PROTECTED,
  {
    id: "healthy",
    name: "Здоровый",
    nameEn: "Healthy",
    source: "Bound by Blood",
    body: "Первый Hit Die после отдыха — эффект без траты кости. Владение одним спасброском, которым не владеете.",
  },
  {
    id: "nocturnal",
    name: "Ночной",
    nameEn: "Nocturnal",
    source: "Bound by Blood",
    body: "Тёмное зрение 60 фт (или +30). В тусклом/тьме: Ловкость (Скрытность) — d20 ≤9 считается 10.",
  },
  {
    id: "thin-blooded",
    name: "Тонкая кровь",
    nameEn: "Thin-Blooded",
    source: "Bound by Blood",
    body: "Питание 2d6, ОБК = БМ−1; можно брать Kindred Feats без класса Kindred; нельзя брать уровни Kindred.",
  },
];

/** Предыстории из Bound by Blood PDF */
export const BACKGROUNDS_PDF: BackgroundDef[] = [
  {
    id: "touchstone",
    name: "Опора (Touchstone)",
    abilityScores: "Тел, Инт, Хар",
    featId: "protected",
    skills: "Убеждение, Выживание",
    tool: "Один вид ремесленных инструментов",
    equipment: "A: те же инструменты, дорожная одежда, 16 зм · B: 50 зм",
    description:
      "Вы важны для сородича. Бессмертный охранял вас (часто из тени). Вы — эмоциональный якорь, напоминающий, что в смертном мире ещё есть кто-то важный. Это помогает ему сдерживать Зверя. Вы не сами вошли в мир сородичей — вас туда направили.",
  },
  {
    id: "ghoul",
    name: "Гуль (Ghoul)",
    abilityScores: "Сил, Лов, Хар",
    featId: "nocturnal",
    skills: "Внимательность, Выживание",
    tool: "Один вид ремесленных инструментов",
    equipment: "A: инструменты, кинжал, vitae, фонарь, короткий лук, стрелы, одежда, 10 зм · B: 50 зм",
    description: "Вы вкусили крови сородича и обрели силу — и риск кровавой связи.",
  },
  {
    id: "ritualist",
    name: "Ритуалист",
    abilityScores: "Инт, Муд, Хар",
    featId: "magic-initiate",
    skills: "Магия, История",
    tool: "Алхимические принадлежности",
    equipment: "A: принадлежности, книга ритуалов, кинжал, чернила, одежда, 9 зм · B: 50 зм",
    description: "Вы изучаете мистику и ритуалы Мира Тьмы.",
  },
  {
    id: "scholar",
    name: "Учёный охоты",
    abilityScores: "Тел, Инт, Муд",
    featId: "well-read",
    skills: "Магия, Анализ",
    tool: "Один игровой набор",
    equipment: "A: набор, кандалы, зеркало, одежда, 15 зм · B: 50 зм",
    description: "Вы изучали сверхъестественное по трактатам охотников на чудовищ.",
  },
  {
    id: "thrall",
    name: "Тралл (Thrall)",
    abilityScores: "Тел, Муд, Хар",
    featId: "healthy",
    skills: "Атлетика, Медицина",
    tool: "Игровой набор или музыкальный инструмент",
    equipment: "A: набор/инструмент, набор целителя, фонарь, одежда, 32 зм · B: 50 зм",
    description: "Вы были слугой и источником крови сородича — добровольно или нет.",
  },
];

export function backgroundById(id: string) {
  return BACKGROUNDS_PDF.find((b) => b.id === id);
}

export function originFeatById(id: string) {
  return ORIGIN_FEATS.find((f) => f.id === id);
}
