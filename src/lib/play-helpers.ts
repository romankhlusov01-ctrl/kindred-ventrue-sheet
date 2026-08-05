import type { CharacterSheet } from "@/lib/character-store";
import type { RollMode } from "@/lib/roll-engine";

/** Conditions that impose disadvantage on ability checks (2024-ish common) */
const CHECK_DISADV = new Set([
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
]);

/** Attack disadvantage */
const ATTACK_DISADV = new Set([
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
]);

/** Attack advantage */
const ATTACK_ADV = new Set(["Невидимый", "Невидим"]);

/** Save disadvantage */
const SAVE_DISADV = new Set(["Отравленный", "Отравлен"]);

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
    if (conds.some((x) => CHECK_DISADV.has(x))) dis = true;
  }
  if (kind === "attack") {
    if (conds.some((x) => ATTACK_DISADV.has(x))) dis = true;
    if (conds.some((x) => ATTACK_ADV.has(x))) adv = true;
  }
  if (kind === "save") {
    if (conds.some((x) => SAVE_DISADV.has(x))) dis = true;
  }

  // Hunger: disadvantage on ability checks (Beast pressure — common VtM table rule; optional toast)
  if (kind === "check" && (c.hunger || conds.includes("Голод"))) {
    dis = true;
  }

  // Merge with sticky base
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
        "1. Инициатива / Старт боя (патруль · охота · сородич)",
        "2. Новый ход → отметь Действие/БД/Реакцию",
        "3. Атака+урон или Приказ/Внушение (Сл в панели)",
        "4. Зверь / Lucky для преимущества",
        "5. Реакция: Protected / Flesh of Marble",
      ];
    case "social":
      return [
        "1. Awe (БД) → преим. на социальные 10 мин",
        "2. Убеждение / Запугивание / Обман",
        "3. Приказ или Внушение (Голос) · спас NPC vs Сл",
        "4. Daunt / Entrance / Terrify — бросок = Сл",
        "5. Bane: предпочтённая кровь для полного питания",
      ];
    case "feed":
      return [
        "1. Цель в захвате / согласна / 0 хитов",
        "2. Питание (или ½ Bane) → урон макс. хитам",
        "3. Каждая «6» = +1 ОБК",
        "4. Ур.5+: Питание как бонусное действие",
        "5. ≥1 ОБК на долгий отдых (Awaken)",
      ];
    case "rest":
      return [
        "Короткий: Зверь, Голос, HD",
        "Длинный: нужен ≥1 ОБК → полные хиты + удача + вдохновение",
        "Без ОБК: только эффекты короткого (Awaken)",
        "Protected / Lucky восстанавливаются на LR",
      ];
    default:
      return [];
  }
}
