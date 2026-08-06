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
  const r = rollD20(sk.nameRu, bonus, modeFor("check"));
  useCharacterStore.getState().consumeRollMode();
  publish(r.label, r.total, r.detail + (r.crit ? " · крит" : r.fumble ? " · провал" : ""));
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
  if (c.clan === "ventrue" && key === "wis") {
    m = m === "dis" ? "norm" : "adv";
  }
  const r = rollD20(`Спас ${labelRu}`, abilityMod(c.abilities[key]) + prof, m);
  useCharacterStore.getState().consumeRollMode();
  publish(r.label, r.total, r.detail);
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
  const count = half ? Math.max(1, Math.floor(row.feedCount / 2)) : row.feedCount;
  const rolls = Array.from({ length: count }, () => rollDie(6));
  const sixes = rolls.filter((x) => x === 6).length;
  const con = Math.max(1, abilityMod(c.abilities.con));
  const sum = rolls.reduce((a, b) => a + b, 0) + con;
  if (sixes) store.gainBlood(sixes);
  const label = half ? "Питание ½ Bane" : "Питание";
  publish(label, sum, `${rolls.join("+")}+Тел${sixes ? ` · +${sixes} ОБК` : ""}`);
  toast.success(`${label}: ${sum}${sixes ? ` · +${sixes} ОБК` : ""}`);
  return { sum, sixes, rolls };
}

export function tableHealBlood() {
  const store = useCharacterStore.getState();
  const c = store.character;
  if (c.bloodCurrent < 1) {
    toast.error("Нет ОБК");
    return null;
  }
  useSessionStore.getState().pushUndo("Исцеление");
  store.spendBlood(1);
  const heal = rollDie(10) + c.level;
  store.adjustHp(heal);
  publish("Исцеление ран", heal, `1d10+${c.level} (−1 ОБК)`);
  toast.success(`+${heal} ХП`);
  return heal;
}

export function tableD20Plain(label = "d20") {
  const r = rollD20(label, 0, modeFor("check"));
  useCharacterStore.getState().consumeRollMode();
  publish(r.label, r.total, r.detail);
  return r;
}
