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
import { effectivePb } from "@/lib/level-utils";
import { abilityMod, rollDie } from "@/lib/utils";
import { rollD20, rollDamage, type RollMode } from "@/lib/roll-engine";
import { conditionMode, type RollKind } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";
import { SKILLS, type SkillId } from "@/data/skills";
import { getLevelData } from "@/data/kindred-ru";

function modeFor(kind: RollKind): RollMode {
  const c = useCharacterStore.getState().character;
  const sticky = c.rollMode ?? "norm";
  let base: RollMode = sticky;
  if (c.beastActive || c.pendingAdv) {
    base = sticky === "dis" ? "norm" : "adv";
  }
  if (c.pendingDis) {
    base = sticky === "adv" ? "norm" : "dis";
  }
  return conditionMode(c, kind, base);
}

function publish(label: string, total: number, detail: string) {
  useSessionStore.getState().setLastRoll({ label, total, detail, at: Date.now() });
  useCharacterStore.getState().addLog(`${label}: ${total} (${detail})`);
  toast.message(`${label}: ${total}`);
}

export function tableCheckSkill(id: SkillId) {
  const c = useCharacterStore.getState().character;
  const sk = SKILLS.find((s) => s.id === id);
  if (!sk) return null;
  const pb = effectivePb(c.level, c.multiclass);
  const bonus = skillBonus(c.abilities[sk.ability], pb, c.skillProfs[id]);

  // Toreador Artist's Soul L3+: advantage on Investigation / Perception
  let mode = modeFor("check");
  if (
    c.clan === "toreador" &&
    c.level >= 3 &&
    (id === "investigation" || id === "perception")
  ) {
    mode = mode === "dis" ? "norm" : "adv";
  }

  const r = rollD20(sk.nameRu, bonus, mode);
  useCharacterStore.getState().consumeRollMode();

  let detail =
    r.detail + (r.crit ? " · крит" : r.fumble ? " · провал" : "");
  if (
    c.clan === "toreador" &&
    c.level >= 3 &&
    (id === "investigation" || id === "perception")
  ) {
    detail += " · Artist's Soul";
  }

  // Toreador Bane: natural d20 ≤9 on Inv/Perc → Restrained (Wis DC 10 EoT)
  if (
    c.clan === "toreador" &&
    c.level >= 3 &&
    (id === "investigation" || id === "perception") &&
    r.used <= 9
  ) {
    detail += " · BANE d20≤9 → Обездвижен";
    const store = useCharacterStore.getState();
    if (!store.character.conditions.includes("Обездвижен (Bane)")) {
      store.toggleCondition("Обездвижен (Bane)");
    }
    toast.error("Bane Тореадор: d20≤9 → Обездвижен (спас Муд. DC 10)");
  }

  publish(r.label, r.total, detail);
  return r;
}

export function tableCheckAbility(key: keyof Abilities, labelRu: string) {
  const c = useCharacterStore.getState().character;
  const r = rollD20(labelRu, abilityMod(c.abilities[key]), modeFor("check"));
  useCharacterStore.getState().consumeRollMode();
  publish(r.label, r.total, r.detail);
  return r;
}

export function tableSave(key: keyof Abilities, labelRu: string) {
  const c = useCharacterStore.getState().character;
  const pb = effectivePb(c.level, c.multiclass);
  const prof = c.saveProfs[key] ? pb : 0;
  let m = modeFor("save");
  // Ventrue Unshakably Confident: advantage on Wisdom saves
  if (c.clan === "ventrue" && key === "wis" && c.level >= 3) {
    m = m === "dis" ? "norm" : "adv";
  }
  const r = rollD20(`Спас ${labelRu}`, abilityMod(c.abilities[key]) + prof, m);
  useCharacterStore.getState().consumeRollMode();
  publish(
    r.label,
    r.total,
    r.detail + (c.clan === "ventrue" && key === "wis" ? " · Unshakable" : ""),
  );
  return r;
}

export function tableAttack(attackId: string) {
  const store = useCharacterStore.getState();
  const atk = store.character.attacks.find((a) => a.id === attackId);
  if (!atk) {
    toast.error("Нет атаки");
    return null;
  }
  const r = rollD20(atk.name, atk.bonus, modeFor("attack"));
  store.consumeRollMode();
  publish(r.label, r.total, r.detail + (r.crit ? " · КРИТ" : ""));
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
  let m = modeFor("init");
  if (c.selectedFeats.includes("alacrity")) m = m === "dis" ? "norm" : "adv";
  const r = rollD20("Инициатива", abilityMod(c.abilities.dex), m);
  store.consumeRollMode();
  store.setField("initiative", r.total);
  publish(r.label, r.total, r.detail);
  return r;
}

export function tableFeed(half = false) {
  const store = useCharacterStore.getState();
  const c = store.character;
  const row = getLevelData(c.level);
  const full = row.feedCount;
  // Ventrue Bane: half dice when not preferred blood (caller decides half)
  // Toreador: half is optional weak feed only
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
    half && c.clan !== "toreador"
      ? "Питание ½ Bane"
      : half
        ? "Питание ½"
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
  const r = rollD20(label, 0, modeFor("check"));
  useCharacterStore.getState().consumeRollMode();
  publish(r.label, r.total, r.detail);
  return r;
}
