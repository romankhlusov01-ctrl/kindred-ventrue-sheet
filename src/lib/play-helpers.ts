import type { CharacterSheet } from "@/lib/character-store";
import type { RollMode } from "@/lib/roll-engine";

/** Match condition names with suffixes like "Обездвижен (Проклятие)" */
function hasCond(conds: string[], roots: string[]) {
  return conds.some((c) => {
    const base = c.split("(")[0]!.trim().toLowerCase();
    return roots.some((r) => base === r.toLowerCase() || base.startsWith(r.toLowerCase()));
  });
}

const CHECK_DISADV = [
  "Отравленный",
  "Отравлен",
  "Испуганный",
  "Испуган",
  "Истощение",
  "Опутанный",
  "Обездвижен",
  "Схваченный",
  "Схвачен",
  "Ошеломлён",
  "Оглушён",
];

const ATTACK_DISADV = [
  "Отравленный",
  "Отравлен",
  "Ослеплённый",
  "Ослеплён",
  "Испуганный",
  "Испуган",
  "Опутанный",
  "Обездвижен",
  "Схваченный",
  "Схвачен",
  "Опрокинутый",
  "Сбит с ног",
  "Ошеломлён",
];

const ATTACK_ADV = ["Невидимый", "Невидим"];

const SAVE_DISADV = ["Отравленный", "Отравлен"];

export type RollKind = "check" | "attack" | "save" | "init";

export function conditionMode(
  c: CharacterSheet,
  kind: RollKind,
  base: RollMode,
): RollMode {
  const conds = c.conditions ?? [];
  let adv = false;
  let dis = false;

  if (kind === "check") {
    if (hasCond(conds, CHECK_DISADV)) dis = true;
  }
  if (kind === "attack") {
    if (hasCond(conds, ATTACK_DISADV)) dis = true;
    if (hasCond(conds, ATTACK_ADV)) adv = true;
  }
  if (kind === "save") {
    if (hasCond(conds, SAVE_DISADV)) dis = true;
  }

  // Hunger: disadv on ability checks
  if (kind === "check" && (c.hunger || hasCond(conds, ["Голод"]))) {
    dis = true;
  }

  if (base === "adv") adv = true;
  if (base === "dis") dis = true;

  if (adv && dis) return "norm";
  if (adv) return "adv";
  if (dis) return "dis";
  return "norm";
}

export function scenarioHints(scenario: string): string[] {
  switch (scenario) {
    case "combat":
      return [
        "1. Инициатива",
        "2. Новый ход → Действие/БД/Реакция",
        "3. Атака / силы клана",
        "4. Зверь = преим. на d20 до вашего след. хода (БМ раз / отдых)",
        "5. БМ = бонус мастерства (не ОБК!)",
      ];
    case "social":
      return [
        "1. Awe → соц. преимущество",
        "2. Навык = мод. хар-ки + БМ (или 2×БМ при экспертизе)",
        "3. Голос / Presence · Сл = 8+БМ+Хар",
        "4. Зверь: преим., провал (нат.1) → Голод",
      ];
    case "feed":
      return [
        "1. Цель в захвате / согласна",
        "2. Питание → кости + Тел",
        "3. «6» = +1 ОБК",
      ];
    case "rest":
      return [
        "Короткий: Зверь и Голос восстанавливаются",
        "Длинный: ≥1 ОБК → хиты + удача",
      ];
    default:
      return [];
  }
}
