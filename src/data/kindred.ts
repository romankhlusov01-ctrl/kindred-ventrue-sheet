/**
 * Clan types + picker list (implemented clans only).
 * Level table / features: see kindred-ru.ts (authoritative RU runtime).
 */
export type ClanId = "ventrue" | "toreador" | "none";

export type ClanDef = {
  id: ClanId;
  name: string;
  nameEn: string;
  tagline: string;
  /** short bane for picker */
  bane: string;
};

/** Only clans with full builder + play support */
export const CLANS: ClanDef[] = [
  {
    id: "ventrue",
    name: "Вентру",
    nameEn: "Ventrue",
    tagline: "Голос власти · Dominate",
    bane: "Предпочтённая кровь · иначе ½ костей Питания",
  },
  {
    id: "toreador",
    name: "Тореадор",
    nameEn: "Toreador",
    tagline: "Душа художника · Presence / Auspex",
    bane: "d20≤9 на Анализ/Внимательность → Обездвижен",
  },
];

export function getClan(id: ClanId): ClanDef | undefined {
  return CLANS.find((c) => c.id === id);
}
