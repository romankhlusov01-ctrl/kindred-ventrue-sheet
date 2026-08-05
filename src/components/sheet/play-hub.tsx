import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clover,
  Droplets,
  Heart,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DicePanel } from "@/components/sheet/dice-panel";
import { QuickActions } from "@/components/sheet/quick-actions";
import { SoloCombat } from "@/components/sheet/solo-combat";
import { DamageIntake } from "@/components/sheet/damage-intake";
import { RestWizard } from "@/components/sheet/rest-wizard";
import { ConcentrationHelper } from "@/components/sheet/concentration-helper";
import { EnvironmentHazards } from "@/components/sheet/environment-hazards";
import { TorporPanel } from "@/components/sheet/torpor-panel";
import { StakeHelper } from "@/components/sheet/stake-helper";
import { WarlockSnippet } from "@/components/sheet/warlock-snippet";
import { FeedWizard } from "@/components/sheet/feed-wizard";
import { DominateDc } from "@/components/sheet/dominate-dc";
import { PcSaves } from "@/components/sheet/pc-saves";
import { TempHp } from "@/components/sheet/temp-hp";
import { QuickCondition } from "@/components/sheet/quick-condition";
import { Passives } from "@/components/sheet/passives";
import { FreeRoll } from "@/components/sheet/free-roll";
import { CombatCard } from "@/components/sheet/combat-card";
import { ResourcePool } from "@/components/sheet/resource-pool";
import { FullHealButton } from "@/components/sheet/full-heal";
import { RecalcHp } from "@/components/sheet/recalc-hp";
import {
  getBloodMax,
  getLuckMax,
  useCharacterStore,
} from "@/lib/character-store";
import { effectivePb } from "@/lib/level-utils";
import { abilityMod, cn, formatMod } from "@/lib/utils";
import { rollD20, rollDamage } from "@/lib/roll-engine";
import { conditionMode } from "@/lib/play-helpers";
import { useSessionStore } from "@/lib/session-store";
import { getLevelData } from "@/data/kindred-ru";
import { rollDie } from "@/lib/utils";

/**
 * Mobile-first play surface — only YOU (no enemies / encounter tools).
 * Progressive disclosure: status → turn → attacks → powers → advanced.
 */
export function PlayHub() {
  const c = useCharacterStore((s) => s.character);
  const setField = useCharacterStore((s) => s.setField);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const spendLucky = useCharacterStore((s) => s.spendLucky);
  const spendProtected = useCharacterStore((s) => s.spendProtected);
  const activateBeast = useCharacterStore((s) => s.activateBeast);
  const newTurn = useCharacterStore((s) => s.newTurn);
  const addLog = useCharacterStore((s) => s.addLog);
  const addAttack = useCharacterStore((s) => s.addAttack);
  const updateAttack = useCharacterStore((s) => s.updateAttack);
  const removeAttack = useCharacterStore((s) => s.removeAttack);
  const consumeRollMode = useCharacterStore((s) => s.consumeRollMode);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const addResource = useCharacterStore((s) => s.addResource);
  const removeResource = useCharacterStore((s) => s.removeResource);
  const setLastRoll = useSessionStore((s) => s.setLastRoll);
  const tickEffects = useSessionStore((s) => s.tickEffects);

  const pb = effectivePb(c.level, c.multiclass);
  const bloodMax = getBloodMax(c);
  const luckMax = getLuckMax(c.level, c.multiclass);
  const luckyLeft = Math.max(0, luckMax - (c.luckyUsed ?? 0));
  const protectedLeft = Math.max(0, luckMax - (c.protectedUsed ?? 0));
  const beastLeft = Math.max(0, pb - c.beastUsed);
  const cha = abilityMod(c.abilities.cha);
  const spellDc = 8 + pb + cha;
  const hpPct = c.hpMax ? Math.min(100, (c.hpCurrent / c.hpMax) * 100) : 0;
  const atZero = c.hpCurrent <= 0;

  function setBloodTo(index: number) {
    const next = index + 1;
    if (c.bloodCurrent === next) setField("bloodCurrent", Math.max(0, next - 1));
    else setField("bloodCurrent", Math.min(bloodMax, next));
  }

  function modeFor(kind: "check" | "attack" | "save" | "init") {
    const sticky = c.rollMode ?? "norm";
    let base = sticky;
    if (c.beastActive || c.pendingAdv) {
      base = sticky === "dis" ? "norm" : "adv";
    }
    if (c.pendingDis) {
      base = sticky === "adv" ? "norm" : "dis";
    }
    return conditionMode(c, kind, base);
  }

  function rollAttack(id: string) {
    const atk = c.attacks.find((a) => a.id === id);
    if (!atk) return;
    const m = modeFor("attack");
    const r = rollD20(atk.name, atk.bonus, m);
    consumeRollMode();
    setLastRoll({ label: r.label, total: r.total, detail: r.detail, at: Date.now() });
    addLog(`${r.label}: ${r.total} (${r.detail})`);
    const dmg = rollDamage(atk.damage);
    let total = dmg.total;
    if (r.crit) {
      total += rollDamage(atk.damage).total;
    }
    setLastRoll({
      label: `Урон · ${atk.name}`,
      total,
      detail: dmg.detail + (r.crit ? " · крит" : ""),
      at: Date.now(),
    });
    addLog(`Урон ${atk.name}: ${total}`);
    toast.success(`${atk.name}: ${r.total} → ${total} ${atk.type}`);
  }

  return (
    <div className="mx-auto max-w-lg space-y-3 sm:max-w-none sm:space-y-4">
      {/* ── Status hero ── */}
      <section
        className={cn(
          "rounded-[var(--radius-lg)] border p-4",
          atZero ? "border-primary bg-primary/10" : "border-border bg-surface",
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              {c.clan === "ventrue" ? "Вентру" : c.clan} · ур. {c.level}
              {c.multiclass ? ` / ${c.multiclass}` : ""}
            </div>
            <h2 className="font-display truncate text-xl text-fg">{c.name || "Сородич"}</h2>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase text-muted">Сл</div>
            <div className="font-display text-2xl tabular-nums text-primary">{spellDc}</div>
          </div>
        </div>

        {/* HP */}
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <Heart className="size-3.5 text-primary" />
              ХП
            </span>
            <span className="font-display tabular-nums">
              {c.hpCurrent}
              <span className="text-muted">/{c.hpMax}</span>
              {c.tempHp > 0 && (
                <span className="ml-1 text-accent">+{c.tempHp}</span>
              )}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {[-5, -1, 1, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => adjustHp(n)}
                className="flex h-11 items-center justify-center rounded-[var(--radius)] border border-border bg-surface-2 text-sm font-semibold active:scale-[0.97]"
              >
                {n > 0 ? `+${n}` : n}
              </button>
            ))}
          </div>
        </div>

        {/* Resources strip */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <ResChip
            icon={<Droplets className="size-3.5 text-primary" />}
            label="ОБК"
            value={`${c.bloodCurrent}/${bloodMax}`}
            onMinus={() => {
              if (c.bloodCurrent < 1) toast.error("Нет ОБК");
              else spendBlood(1);
            }}
            onPlus={() => gainBlood(1)}
          />
          <ResChip
            icon={<Sparkles className="size-3.5 text-beast" />}
            label="Зверь"
            value={`${beastLeft}/${pb}${c.beastActive ? "★" : ""}`}
            accent
            onMinus={() => {
              if (!activateBeast()) toast.error("Зверь исчерпан");
              else toast.success("Преимущество");
            }}
            onPlus={() => setField("beastUsed", Math.max(0, c.beastUsed - 1))}
          />
          <ResChip
            icon={<Shield className="size-3.5 text-accent" />}
            label="КД"
            value={String(c.ac)}
            onMinus={() => setField("ac", Math.max(1, c.ac - 1))}
            onPlus={() => setField("ac", c.ac + 1)}
          />
        </div>

        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center text-xs">
          <MiniStat label="Скор." value={c.speed} />
          <MiniStat
            label="Иниц"
            value={c.initiative != null ? c.initiative : formatMod(abilityMod(c.abilities.dex))}
          />
          <MiniStat label="Везуч." value={`${luckyLeft}/${luckMax}`} />
          <MiniStat label="Защищ." value={`${protectedLeft}/${luckMax}`} />
        </div>

        {atZero && (
          <Button
            type="button"
            variant="blood"
            className="mt-3 w-full"
            onClick={() => {
              if (!spendProtected()) {
                toast.error("Нет Защищённого");
                return;
              }
              setField("hpCurrent", 1);
              toast.success("0 → 1 хит");
            }}
          >
            Protected: 0 → 1 ХП
          </Button>
        )}
      </section>

      {/* ── Turn ── */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm">
            Ход · R{c.round ?? 1}
          </h3>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-9"
            onClick={() => {
              newTurn();
              tickEffects();
              toast.message(`Раунд ${(c.round ?? 1) + 1}`);
            }}
          >
            Новый ход
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              ["actionUsed", "Действ."],
              ["bonusUsed", "БД"],
              ["reactionUsed", "Реакц."],
              ["movementUsed", "Перем."],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setField(key, !c[key])}
              className={cn(
                "flex h-12 flex-col items-center justify-center rounded-[var(--radius)] border text-xs font-medium",
                c[key]
                  ? "border-primary/40 bg-primary/15 text-primary line-through opacity-70"
                  : "border-border bg-surface-2 text-fg",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Dual luck compact ── */}
      <section className="grid grid-cols-2 gap-2">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-accent">
            <Clover className="size-3.5" /> Везучий
          </div>
          <div className="mb-2 font-display text-xl tabular-nums">
            {luckyLeft}
            <span className="text-sm text-muted">/{luckMax}</span>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-10 w-full text-xs"
              onClick={() => {
                if (!spendLucky()) return toast.error("Нет очков");
                setField("pendingAdv", true);
                toast.success("Преим. на d20");
              }}
            >
              d20 +преим.
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 w-full text-xs"
              onClick={() => {
                if (!spendLucky()) return toast.error("Нет очков");
                setField("pendingDis", true);
                toast.success("Помеха на атаку по вам");
              }}
            >
              Атака → помеха
            </Button>
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" /> Защищ.
          </div>
          <div className="mb-2 font-display text-xl tabular-nums">
            {protectedLeft}
            <span className="text-sm text-muted">/{luckMax}</span>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              size="sm"
              variant="blood"
              className="h-10 w-full text-xs"
              onClick={() => {
                if (!spendProtected()) return toast.error("Нет очков");
                toast.success("Переброс ≤9");
                addLog("Protected: переброс");
              }}
            >
              Переброс ≤9
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 w-full text-xs"
              onClick={() => {
                if (!spendProtected()) return toast.error("Нет очков");
                setField("hpCurrent", 1);
                toast.success("1 хит");
              }}
            >
              0 → 1 ХП
            </Button>
          </div>
        </div>
      </section>

      {/* ── Attacks ── */}
      <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 font-display text-sm">
            <Swords className="size-3.5 text-primary" /> Атаки
          </h3>
          <Button type="button" size="sm" variant="ghost" className="h-9" onClick={addAttack}>
            +
          </Button>
        </div>
        {c.attacks.length === 0 && (
          <p className="text-xs text-muted">Добавьте атаку (билдер или +).</p>
        )}
        <div className="space-y-2">
          {c.attacks.map((atk) => (
            <div
              key={atk.id}
              className="rounded-[var(--radius)] border border-border bg-surface-2 p-2.5"
            >
              <div className="mb-2 flex items-center gap-2">
                <Input
                  className="h-10 flex-1"
                  value={atk.name}
                  onChange={(e) => updateAttack(atk.id, { name: e.target.value })}
                />
                <button
                  type="button"
                  className="text-muted"
                  onClick={() => removeAttack(atk.id)}
                >
                  ×
                </button>
              </div>
              <div className="mb-2 grid grid-cols-3 gap-1.5">
                <Input
                  type="number"
                  className="h-10"
                  value={atk.bonus}
                  onChange={(e) =>
                    updateAttack(atk.id, { bonus: Number(e.target.value) || 0 })
                  }
                  placeholder="+"
                />
                <Input
                  className="h-10"
                  value={atk.damage}
                  onChange={(e) => updateAttack(atk.id, { damage: e.target.value })}
                  placeholder="1d8"
                />
                <Input
                  className="h-10"
                  value={atk.type}
                  onChange={(e) => updateAttack(atk.id, { type: e.target.value })}
                  placeholder="тип"
                />
              </div>
              <Button
                type="button"
                variant="blood"
                className="h-12 w-full"
                onClick={() => rollAttack(atk.id)}
              >
                Атака + урон
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feed / Dominate / Saves — primary Kindred ── */}
      <DominateDc />
      <FeedWizard />
      <PcSaves />
      <Passives />

      {/* ── Powers ── */}
      <Collapsible title="Силы Kindred" icon={<Zap className="size-3.5 text-beast" />}>
        <QuickActions />
        <WarlockSnippet />
      </Collapsible>

      {/* ── Dice ── */}
      <Collapsible title="Кости и проверки" icon={<Sparkles className="size-3.5" />}>
        <DicePanel />
        <FreeRoll />
      </Collapsible>

      {/* ── Damage / rest ── */}
      <Collapsible title="Урон · отдых · состояния">
        <DamageIntake />
        <TempHp />
        <QuickCondition />
        <RestWizard />
        <div className="flex flex-wrap gap-2">
          <RecalcHp />
          <FullHealButton />
        </div>
      </Collapsible>

      {/* ── Turn extras from SoloCombat (death saves, HD) ── */}
      <Collapsible title="Ход · HD · 0 ХП">
        <SoloCombat />
      </Collapsible>

      {/* ── Advanced rare ── */}
      <Collapsible title="Редко (торпор, кол, солнце…)">
        <ConcentrationHelper />
        <EnvironmentHazards />
        <TorporPanel />
        <StakeHelper />
        <ResourcePool
          label="Очки крови"
          current={c.bloodCurrent}
          max={bloodMax}
          color="blood"
          onSpend={() => spendBlood(1)}
          onGain={() => gainBlood(1)}
          onToggle={setBloodTo}
        />
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Свои ресурсы</span>
            <Button type="button" size="sm" variant="ghost" onClick={addResource}>
              +
            </Button>
          </div>
          {c.customResources.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 rounded border border-border bg-surface-2 p-2"
            >
              <Input
                className="h-9 flex-1"
                value={r.name}
                onChange={(e) => updateResource(r.id, { name: e.target.value })}
              />
              <button
                type="button"
                className="h-9 w-9 rounded border border-border"
                onClick={() =>
                  updateResource(r.id, { current: Math.max(0, r.current - 1) })
                }
              >
                −
              </button>
              <span className="w-10 text-center tabular-nums text-sm">
                {r.current}/{r.max}
              </span>
              <button
                type="button"
                className="h-9 w-9 rounded border border-border"
                onClick={() =>
                  updateResource(r.id, {
                    current: Math.min(r.max, r.current + 1),
                  })
                }
              >
                +
              </button>
              <button type="button" onClick={() => removeResource(r.id)}>
                ×
              </button>
            </div>
          ))}
        </div>
        <CombatCard />
      </Collapsible>

      <p className="pb-2 text-center text-[10px] text-faint">
        Нижняя панель — одним пальцем. БМ {formatMod(pb)} · Питание{" "}
        {getLevelData(c.level).feed}
      </p>
    </div>
  );
}

function ResChip({
  icon,
  label,
  value,
  onMinus,
  onPlus,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border p-2",
        accent ? "border-beast/30 bg-beast/10" : "border-border bg-surface-2",
      )}
    >
      <div className="mb-1 flex items-center justify-center gap-1 text-[10px] text-muted">
        {icon}
        {label}
      </div>
      <div className="mb-1 font-display text-lg tabular-nums leading-none">{value}</div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onMinus}
          className="flex h-9 flex-1 items-center justify-center rounded border border-border bg-bg text-sm font-bold"
        >
          −
        </button>
        <button
          type="button"
          onClick={onPlus}
          className="flex h-9 flex-1 items-center justify-center rounded border border-border bg-bg text-sm font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-2 px-1 py-1.5">
      <div className="text-[9px] uppercase text-muted">{label}</div>
      <div className="font-display text-sm tabular-nums">{value}</div>
    </div>
  );
}

function Collapsible({
  title,
  children,
  defaultOpen = false,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
      >
        <span className="flex items-center gap-2 font-display text-sm">
          {icon}
          {title}
        </span>
        {open ? (
          <ChevronUp className="size-4 text-muted" />
        ) : (
          <ChevronDown className="size-4 text-muted" />
        )}
      </button>
      {open && <div className="space-y-3 border-t border-border px-3 pb-3 pt-3">{children}</div>}
    </div>
  );
}
