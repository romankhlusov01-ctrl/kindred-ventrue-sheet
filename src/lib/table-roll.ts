/**
 * Central table-play roller: every check/attack/save → session lastRoll + character log.
 * PHB 2024 d20 Test (dnd.su) + Bound by Blood Kindred.
 */
import { toast } from "sonner";
import {
  skillBonus,
  useCharacterStore,
  type Abilities,
} from "@/lib/character-store";
import { characterPb, skillBreakdown } from "@/lib/skill-math";
import { abilityMod, formatMod, rollDie } from "@/lib/utils";
import { rollD20, rollDamage, type RollMode } from "@/lib/roll-engine";
import { conditionMode, type RollKind } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";
import { SKILLS, type SkillId } from "@/data/skills";
import { getLevelData } from "@/data/kindred-ru";

function modeFor(kind: RollKind): { mode: RollMode; beast: boolean } {
  const c = useCharacterStore.getState().character;
  const sticky = c.rollMode ?? "norm";
  let base: RollMode = sticky;
  const beast = !!(c.beastActive || c.pendingAdv);
  if (beast) {
    base = sticky === "dis" ? "norm" : "adv";
  }
  if (c.pendingDis && !beast) {
    base = sticky === "adv" ? "norm" : "dis";
  }
  return { mode: conditionMode(c, kind, base), beast: !!(c.beastActive || c.pendingAdv) };
}

function publish(label: string, total: number, detail: string) {
  useSessionStore.getState().setLastRoll({ label, total, detail, at: Date.now() });
  useCharacterStore.getState().addLog(`${label}: ${total} (${detail})`);
  toast.message(`${label}: ${total}`);
}

/** After a d20 with Beast: fail → Hunger (RAW Kindred Beast) */
export function applyBeastHunger(reason = "провал d20") {
  const store = useCharacterStore.getState();
  store.setField("hunger", true);
  if (!store.character.conditions.includes("Голод")) {
    store.toggleCondition("Голод");
  }
  store.addLog(`Зверь · ${reason} → Голод / кровавая ярость`);
  toast.error("Зверь: провал → Голод (1 ОБК чтобы игнорировать)");
}

function maybeBeastHunger(used: number, total: number, dcHint?: number) {
  const store = useCharacterStore.getState();
  const c = store.character;
  if (!c.beastActive) return;
  // RAW: any failed d20 Test under Beast → Hunger
  const failed =
    used === 1 ||
    (dcHint != null ? total < dcHint : false) ||
    // solo table without DC: nat 1 always; total ≤ 8 treated as likely fail → still prompt
    false;
  if (failed) {
    applyBeastHunger(used === 1 ? "нат. 1" : `итог ${total} < Сл`);
    return;
  }
  // Always surface action for manual fail (master names DC)
  toast.message("Зверь активен — при провале нажмите «Голод»", {
    duration: 4000,
    action: {
      label: "Провал → Голод",
      onClick: () => applyBeastHunger("провал (ручной)"),
    },
  });
}

export function tableCheckSkill(id: SkillId) {
  const c = useCharacterStore.getState().character;
  const sk = SKILLS.find((s) => s.id === id);
  if (!sk) return null;
  const pb = characterPb(c.level, c.multiclass);
  const bd = skillBreakdown(c.abilities, id, pb, c.skillProfs);
  // keep store skillBonus in sync path
  const bonus = skillBonus(c.abilities[sk.ability], pb, c.skillProfs[id]);
  // assert
  if (bonus !== bd.total) {
    console.warn("skillBonus mismatch", id, bonus, bd.total);
  }

  let { mode, beast } = modeFor("check");
  const forceAdv =
    (c.clan === "toreador" &&
      c.level >= 3 &&
      (id === "investigation" || id === "perception")) ||
    (c.clan === "toreador" &&
      c.level >= 15 &&
      (id === "deception" || id === "persuasion")) ||
    (c.selectedFeats.includes("heightened") &&
      (id === "insight" || id === "perception"));
  if (forceAdv) {
    mode = mode === "dis" ? "norm" : "adv";
  }

  const r = rollD20(sk.nameRu, bd.total, mode);
  useCharacterStore.getState().consumeRollMode();

  let detail = `${r.detail}`;
  // Full formula: dice + formula
  detail += ` · ${bd.formula}`;
  if (beast || c.beastActive) detail += " · Зверь";
  if (r.crit) detail += " · крит";
  if (r.fumble) detail += " · провал";
  if (
    c.clan === "toreador" &&
    c.level >= 3 &&
    (id === "investigation" || id === "perception")
  ) {
    detail += " · Душа художника";
  }
  if (
    c.clan === "toreador" &&
    c.level >= 15 &&
    (id === "deception" || id === "persuasion")
  ) {
    detail += " · Величие";
  }

  // Toreador Bane: natural d20 ≤9 on Inv/Perc → Restrained
  if (
    c.clan === "toreador" &&
    c.level >= 3 &&
    (id === "investigation" || id === "perception") &&
    r.used <= 9
  ) {
    detail += " · Проклятие d20≤9 → Обездвижен";
    const store = useCharacterStore.getState();
    if (!store.character.conditions.includes("Обездвижен (Проклятие)")) {
      store.toggleCondition("Обездвижен (Проклятие)");
    }
    toast.error("Проклятие Тореадор: d20≤9 → Обездвижен (спас Муд. Сл 10)");
  }

  if (beast || c.beastActive) {
    maybeBeastHunger(r.used, r.total);
  }

  publish(r.label, r.total, detail);
  return r;
}

export function tableCheckAbility(key: keyof Abilities, labelRu: string) {
  const c = useCharacterStore.getState().character;
  const mod = abilityMod(c.abilities[key]);
  const { mode, beast } = modeFor("check");
  const r = rollD20(labelRu, mod, mode);
  useCharacterStore.getState().consumeRollMode();
  let detail = r.detail;
  if (beast || c.beastActive) {
    detail += " · Зверь";
    maybeBeastHunger(r.used, r.total);
  }
  publish(r.label, r.total, detail);
  return r;
}

export function tableSave(key: keyof Abilities, labelRu: string) {
  const c = useCharacterStore.getState().character;
  const pb = characterPb(c.level, c.multiclass);
  const abMod = abilityMod(c.abilities[key]);
  const prof = c.saveProfs[key] ? pb : 0;
  const totalMod = abMod + prof;
  let { mode, beast } = modeFor("save");
  if (c.clan === "ventrue" && key === "wis" && c.level >= 3) {
    mode = mode === "dis" ? "norm" : "adv";
  }
  const r = rollD20(`Спас ${labelRu}`, totalMod, mode);
  useCharacterStore.getState().consumeRollMode();
  let detail = r.detail;
  detail += prof
    ? ` · мод${formatMod(abMod)} · БМ${formatMod(pb)}`
    : ` · мод${formatMod(abMod)} (без влад.)`;
  if (c.clan === "ventrue" && key === "wis") detail += " · Непоколебимая";
  if (beast || c.beastActive) {
    detail += " · Зверь";
    maybeBeastHunger(r.used, r.total);
  }
  publish(r.label, r.total, detail);
  return r;
}

export function tableAttack(attackId: string) {
  const store = useCharacterStore.getState();
  const atk = store.character.attacks.find((a) => a.id === attackId);
  if (!atk) {
    toast.error("Нет атаки");
    return null;
  }
  const { mode, beast } = modeFor("attack");
  const r = rollD20(atk.name, atk.bonus, mode);
  store.consumeRollMode();
  let detail = r.detail + (r.crit ? " · КРИТ" : "");
  if (beast || store.character.beastActive) {
    detail += " · Зверь";
    maybeBeastHunger(r.used, r.total);
  }
  publish(r.label, r.total, detail);
  const dmg = rollDamage(atk.damage);
  let total = dmg.total;
  if (r.crit) total += rollDamage(atk.damage).total;
  publish(`Урон · ${atk.name}`, total, dmg.detail + (r.crit ? " · ×2" : ""));
  toast.success(`${atk.name}: ${r.total} → ${total} ${atk.type}`);
  return { hit: r, damage: total };
}

export function tableInitiative() {
  const store = useCharacterStore.getState();
  const c = store.character;
  let { mode, beast } = modeFor("init");
  if (c.selectedFeats.includes("alacrity")) mode = mode === "dis" ? "norm" : "adv";
  const r = rollD20("Инициатива", abilityMod(c.abilities.dex), mode);
  store.consumeRollMode();
  store.setField("initiative", r.total);
  let detail = r.detail;
  if (c.selectedFeats.includes("alacrity")) detail += " · Alacrity";
  if (beast || c.beastActive) detail += " · Зверь";
  publish(r.label, r.total, detail);
  return r;
}

export function tableFeed(half = false) {
  const store = useCharacterStore.getState();
  const c = store.character;
  const row = getLevelData(c.level);
  const full = row.feedCount;
  const count = half ? Math.max(1, Math.floor(full / 2)) : full;
  const rolls = Array.from({ length: count }, () => rollDie(6));
  const sixes = rolls.filter((x) => x === 6).length;
  const con = Math.max(1, abilityMod(c.abilities.con));
  const sum = rolls.reduce((a, b) => a + b, 0) + con;
  if (sixes) {
    useSessionStore.getState().pushUndo("Питание ОБК");
    store.gainBlood(sixes);
  }
  const label =
    half && c.clan === "ventrue"
      ? "½ Питания (Проклятие)"
      : half
        ? "½ кости"
        : "Питание";
  publish(label, sum, `${rolls.join("+")}+Тел · +${sixes} ОБК`);
  toast.success(`${label}: ${sum}${sixes ? ` · +${sixes} ОБК` : ""}`);
  return sum;
}

export function tableHealBlood() {
  const store = useCharacterStore.getState();
  const c = store.character;
  if (c.bloodCurrent < 1) {
    toast.error("Нет ОБК");
    return null;
  }
  useSessionStore.getState().pushUndo("Лечение ОБК");
  store.spendBlood(1);
  const heal = rollDie(10) + c.level;
  store.adjustHp(heal);
  publish("Лечение (−1 ОБК)", heal, `1d10+ур = ${heal}`);
  toast.success(`+${heal} ХП (−1 ОБК)`);
  return heal;
}

export function tableD20Plain(label = "d20") {
  const c = useCharacterStore.getState().character;
  const { mode, beast } = modeFor("check");
  const r = rollD20(label, 0, mode);
  useCharacterStore.getState().consumeRollMode();
  let detail = r.detail;
  if (beast || c.beastActive) {
    detail += " · Зверь";
    maybeBeastHunger(r.used, r.total);
  }
  publish(r.label, r.total, detail);
  return r;
}
