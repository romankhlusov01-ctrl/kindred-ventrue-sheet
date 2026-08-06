/** One-tap talent packages for Ventrue / Toreador by level band */

export type TalentPackage = {
  id: string;
  clan: "ventrue" | "toreador";
  name: string;
  blurb: string;
  minLevel: number;
  kindred: string[];
  general: string[];
  originFeatId?: string;
  backgroundFeatId?: string;
};

export const TALENT_PACKAGES: TalentPackage[] = [
  {
    id: "v-social",
    clan: "ventrue",
    name: "Социальный лорд",
    blurb: "Presence + Dominate. Forceful, Mind Tricks, Актёр, Устойчивый·Тел.",
    minLevel: 4,
    kindred: ["forceful", "mind-tricks"],
    general: ["actor", "resilient-con"],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
  },
  {
    id: "v-tyrant",
    clan: "ventrue",
    name: "Железный тиран",
    blurb: "Захват + танк: Lethal, Forceful, Grappler, Устойчивый·Тел.",
    minLevel: 4,
    kindred: ["forceful", "lethal"],
    general: ["grappler", "resilient-con"],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
  },
  {
    id: "v-prince",
    clan: "ventrue",
    name: "Принц совета",
    blurb: "Лидер + контроль: Forceful, Convincing, Inspiring Leader, War Caster.",
    minLevel: 7,
    kindred: ["forceful", "convincing"],
    general: ["inspiring-leader", "war-caster"],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
  },
  {
    id: "v-iron-will",
    clan: "ventrue",
    name: "Железная воля",
    blurb: "Концентрация: Forceful, War Caster, Устойчивый·Тел, Устойчивый·Муд (слоты ASI).",
    minLevel: 8,
    kindred: ["forceful", "self-control"],
    general: ["war-caster", "resilient-con"],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
  },
  {
    id: "t-artist",
    clan: "toreador",
    name: "Художник-хищник",
    blurb: "Auspex + Presence: Heightened, Forceful, Observant, Устойчивый·Лов.",
    minLevel: 4,
    kindred: ["heightened", "forceful"],
    general: ["observant", "resilient-dex"],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
  },
  {
    id: "t-dancer",
    clan: "toreador",
    name: "Танцор-celerity",
    blurb: "Темп: Alacrity, Heightened, Speedy, Defensive Duelist.",
    minLevel: 4,
    kindred: ["alacrity", "heightened"],
    general: ["speedy", "defensive-duelist"],
    originFeatId: "alert",
    backgroundFeatId: "protected",
  },
  {
    id: "t-siren",
    clan: "toreador",
    name: "Сирена салона",
    blurb: "Очарование: Kiss, Forceful, Actor, Fey Touched.",
    minLevel: 4,
    kindred: ["kiss", "forceful"],
    general: ["actor", "fey-touched"],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
  },
  {
    id: "t-focus",
    clan: "toreador",
    name: "Живая концентрация",
    blurb: "Presence + удержание: Forceful, War Caster, Устойчивый·Тел, Skill Expert.",
    minLevel: 8,
    kindred: ["forceful", "alacrity"],
    general: ["war-caster", "resilient-con"],
    originFeatId: "lucky",
    backgroundFeatId: "protected",
  },
];

export function packagesFor(clan: "ventrue" | "toreador", level: number) {
  return TALENT_PACKAGES.filter((p) => p.clan === clan && p.minLevel <= level);
}
