import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BookOpen,
  Copy,
  Download,
  Droplets,
  Heart,
  Link2,
  Plus,
  RefreshCw,
  Share2,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Upload,
  Users,
  Zap,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResourcePool } from "@/components/sheet/resource-pool";
import { DicePanel } from "@/components/sheet/dice-panel";
import { QuickActions } from "@/components/sheet/quick-actions";
import {
  featsForLevel,
  getLevelData,
  unlockedCore,
  unlockedVentrue,
  VENTRUE_LORE,
  type FeatureBlock,
} from "@/data/kindred-ru";
import { CLANS, type ClanId } from "@/data/kindred";
import { CONDITIONS, SKILLS, type ProfLevel } from "@/data/skills";
import {
  PRESET_VENTRUE_7_WARLOCK_1,
  PRESET_VENTRUE_8,
} from "@/data/presets";
import {
  decodeSharePayload,
  encodeSharePayload,
  getBloodMax,
  skillBonus,
  useCharacterStore,
  type Abilities,
} from "@/lib/character-store";
import { abilityMod, cn, formatMod, rollDie } from "@/lib/utils";

const ABILITY_KEYS: { key: keyof Abilities; label: string; short: string }[] = [
  { key: "str", label: "Сила", short: "СИЛ" },
  { key: "dex", label: "Ловкость", short: "ЛОВ" },
  { key: "con", label: "Телосложение", short: "ТЕЛ" },
  { key: "int", label: "Интеллект", short: "ИНТ" },
  { key: "wis", label: "Мудрость", short: "МУД" },
  { key: "cha", label: "Харизма", short: "ХАР" },
];

const CLAN_RU: Record<string, string> = {
  ventrue: "Вентру",
  brujah: "Бруха",
  gangrel: "Гангрел",
  lasombra: "Ласомбра",
  nosferatu: "Носферату",
  toreador: "Тореадор",
  none: "—",
};

type Tab = "combat" | "skills" | "features" | "feats" | "gear" | "log";

export function CharacterSheet() {
  const character = useCharacterStore((s) => s.character);
  const characters = useCharacterStore((s) => s.characters);
  const activeId = useCharacterStore((s) => s.activeId);
  const setActive = useCharacterStore((s) => s.setActive);
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);
  const setField = useCharacterStore((s) => s.setField);
  const setAbility = useCharacterStore((s) => s.setAbility);
  const setSkillProf = useCharacterStore((s) => s.setSkillProf);
  const toggleSave = useCharacterStore((s) => s.toggleSave);
  const toggleCondition = useCharacterStore((s) => s.toggleCondition);
  const toggleFeat = useCharacterStore((s) => s.toggleFeat);
  const spendBlood = useCharacterStore((s) => s.spendBlood);
  const gainBlood = useCharacterStore((s) => s.gainBlood);
  const fillBlood = useCharacterStore((s) => s.fillBlood);
  const useBeast = useCharacterStore((s) => s.useBeast);
  const adjustHp = useCharacterStore((s) => s.adjustHp);
  const shortRest = useCharacterStore((s) => s.shortRest);
  const longRest = useCharacterStore((s) => s.longRest);
  const addAttack = useCharacterStore((s) => s.addAttack);
  const updateAttack = useCharacterStore((s) => s.updateAttack);
  const removeAttack = useCharacterStore((s) => s.removeAttack);
  const loadCharacter = useCharacterStore((s) => s.loadCharacter);
  const exportLibrary = useCharacterStore((s) => s.exportLibrary);
  const importLibrary = useCharacterStore((s) => s.importLibrary);
  const addResource = useCharacterStore((s) => s.addResource);
  const updateResource = useCharacterStore((s) => s.updateResource);
  const removeResource = useCharacterStore((s) => s.removeResource);
  const addLog = useCharacterStore((s) => s.addLog);

  const [tab, setTab] = useState<Tab>("combat");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [openFeature, setOpenFeature] = useState<string | null>(null);

  const row = getLevelData(character.level);
  const pb = row.pb;
  const bloodMax = getBloodMax(character);
  const beastMax = pb;
  const beastLeft = Math.max(0, beastMax - character.beastUsed);
  const chaMod = abilityMod(character.abilities.cha);
  const spellDc = 8 + pb + chaMod;
  const passivePer =
    10 + skillBonus(character.abilities.wis, pb, character.skillProfs.perception);
  const passiveIns =
    10 + skillBonus(character.abilities.wis, pb, character.skillProfs.insight);

  const core = useMemo(() => unlockedCore(character.level), [character.level]);
  const ventrue = useMemo(() => unlockedVentrue(character.level), [character.level]);
  const availableFeats = useMemo(() => featsForLevel(character.level), [character.level]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#c=/, "");
    if (!hash) return;
    const data = decodeSharePayload(hash);
    if (data) {
      loadCharacter(data);
      toast.success("Персонаж загружен по ссылке");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [loadCharacter]);

  // Sync Voice max with PB
  useEffect(() => {
    const voice = character.customResources.find((r) => /голос/i.test(r.name));
    if (voice && voice.max !== pb) {
      updateResource(voice.id, { max: pb, current: Math.min(voice.current, pb) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.level, pb]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(exportLibrary(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `biblioteka-sorodichey.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Библиотека сохранена");
  }

  function importJson() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (Array.isArray(data.characters)) importLibrary(data.characters, data.activeId);
        else loadCharacter(data);
        toast.success("Импорт успешен");
      } catch {
        toast.error("Не удалось прочитать файл");
      }
    };
    input.click();
  }

  async function copyShareLink() {
    const url = `${window.location.origin}${window.location.pathname}#c=${encodeSharePayload(character)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Ссылка скопирована");
    } catch {
      window.prompt("Скопируй ссылку:", url);
    }
  }

  function setBloodTo(index: number) {
    const next = index + 1;
    if (character.bloodCurrent === next) setField("bloodCurrent", Math.max(0, next - 1));
    else setField("bloodCurrent", Math.min(bloodMax, next));
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "combat", label: "Бой", icon: <Swords className="size-3.5" /> },
    { id: "skills", label: "Навыки", icon: <Zap className="size-3.5" /> },
    { id: "features", label: "Способности", icon: <Crown className="size-3.5" /> },
    { id: "feats", label: "Черты", icon: <Sparkles className="size-3.5" /> },
    { id: "gear", label: "Снаряжение", icon: <BookOpen className="size-3.5" /> },
    { id: "log", label: "Сессия", icon: <Heart className="size-3.5" /> },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-28 pt-3 sm:px-5 sm:pb-16 sm:pt-5">
      <header className="mb-4 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              Bound by Blood · D&D 2024 · Интерактивный лист
            </div>
            <h1 className="font-display truncate text-2xl tracking-wide text-fg sm:text-3xl">
              {character.name || "Сородич"}
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              {CLAN_RU[character.clan] ?? character.clan} · Сородич {character.level}
              {character.multiclass ? ` / ${character.multiclass}` : ""} · БМ{" "}
              {formatMod(pb)} · Сл {spellDc}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setLibraryOpen((v) => !v)}>
              <Users className="size-3.5" /> Персонажи
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={copyShareLink}>
              <Share2 className="size-3.5" /> Ссылка
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={exportJson}>
              <Download className="size-3.5" />
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={importJson}>
              <Upload className="size-3.5" />
            </Button>
          </div>
        </div>

        {libraryOpen && (
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="blood"
                onClick={() => {
                  addCharacter({ ...PRESET_VENTRUE_8, id: `v8-${Date.now()}` });
                  toast.success("Пресет: Вентру 8");
                }}
              >
                + Вентру 8
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  addCharacter({ ...PRESET_VENTRUE_7_WARLOCK_1, id: `v7-${Date.now()}` });
                  toast.success("Пресет: Сородич 7 / Колдун 1");
                }}
              >
                + 7 / Колдун 1
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => addCharacter()}>
                <Plus className="size-3.5" /> Пустой
              </Button>
            </div>
            <ul className="space-y-1">
              {characters.map((ch) => (
                <li
                  key={ch.id}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2",
                    ch.id === activeId ? "bg-surface-3" : "hover:bg-surface-2",
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left text-sm"
                    onClick={() => {
                      setActive(ch.id);
                      setLibraryOpen(false);
                    }}
                  >
                    <span className="font-medium text-fg">{ch.name}</span>
                    <span className="ml-2 text-xs text-muted">
                      {CLAN_RU[ch.clan]} · {ch.level} ур.
                    </span>
                  </button>
                  {characters.length > 1 && (
                    <button type="button" onClick={() => deleteCharacter(ch.id)}>
                      <Trash2 className="size-3.5 text-muted hover:text-primary" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Имя">
            <Input value={character.name} onChange={(e) => setField("name", e.target.value)} />
          </Field>
          <Field label="Клан">
            <select
              className="flex h-10 w-full rounded-[var(--radius)] border border-border bg-surface-2 px-3 text-sm"
              value={character.clan}
              onChange={(e) => setField("clan", e.target.value as ClanId)}
            >
              {CLANS.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {CLAN_RU[cl.id] ?? cl.name}
                </option>
              ))}
              <option value="none">—</option>
            </select>
          </Field>
          <Field label="Уровень сородича">
            <Input
              type="number"
              min={1}
              max={20}
              value={character.level}
              onChange={(e) =>
                setField("level", Math.min(20, Math.max(1, Number(e.target.value) || 1)))
              }
            />
          </Field>
          <Field label="Мультикласс">
            <Input
              value={character.multiclass}
              placeholder="Колдун 1"
              onChange={(e) => setField("multiclass", e.target.value)}
            />
          </Field>
        </div>
      </header>

      {/* Sticky HUD */}
      <div className="sticky top-0 z-20 -mx-3 mb-4 border-y border-border bg-bg/95 px-3 py-2 backdrop-blur sm:mx-0 sm:rounded-[var(--radius-lg)] sm:border sm:px-4">
        <div className="flex flex-wrap items-center gap-3">
          <HudStat label="ХП" value={`${character.hpCurrent}/${character.hpMax}`} />
          <HudStat label="КД" value={String(character.ac)} />
          <HudStat label="ОБК" value={`${character.bloodCurrent}/${bloodMax}`} blood />
          <HudStat label="Зверь" value={`${beastLeft}/${beastMax}`} />
          <HudStat label="Иниц" value={formatMod(abilityMod(character.abilities.dex))} />
          <HudStat label="Пас.В" value={String(passivePer)} />
          <div className="ml-auto flex flex-wrap gap-1.5">
            <Button type="button" size="sm" variant="secondary" onClick={() => adjustHp(-1)}>
              −ХП
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => adjustHp(1)}>
              +ХП
            </Button>
            <Button type="button" size="sm" variant="blood" onClick={() => spendBlood(1)}>
              −ОБК
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={shortRest}>
              Короткий
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={longRest}>
              Длинный
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto scroll-thin rounded-[var(--radius)] border border-border bg-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex h-10 shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-primary text-primary-fg"
                : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === "combat" && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {ABILITY_KEYS.map(({ key, short }) => {
                const score = character.abilities[key];
                const mod = abilityMod(score);
                const saveProf = !!character.saveProfs[key];
                const saveBonus = mod + (saveProf ? pb : 0);
                return (
                  <div
                    key={key}
                    className="rounded-[var(--radius-lg)] border border-border bg-surface p-2.5 text-center"
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      {short}
                    </div>
                    <div className="font-display text-2xl tabular-nums leading-none text-accent sm:text-3xl">
                      {formatMod(mod)}
                    </div>
                    <Input
                      type="number"
                      className="mx-auto mt-1.5 h-8 w-full max-w-[4.5rem] text-center text-sm"
                      value={score}
                      min={1}
                      max={30}
                      onChange={(e) => setAbility(key, Number(e.target.value) || 1)}
                    />
                    <button
                      type="button"
                      onClick={() => toggleSave(key)}
                      className={cn(
                        "mt-1.5 w-full rounded text-[10px] font-medium",
                        saveProf ? "text-primary" : "text-faint",
                      )}
                    >
                      Спас {formatMod(saveBonus)}
                      {saveProf ? " ●" : ""}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-display text-base">
                    <Heart className="size-4 text-primary" /> Хиты
                  </h3>
                  <div className="flex gap-1">
                    {[-5, -1, 1, 5].map((n) => (
                      <Button
                        key={n}
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => adjustHp(n)}
                      >
                        {n > 0 ? `+${n}` : n}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Текущие">
                    <Input
                      type="number"
                      value={character.hpCurrent}
                      onChange={(e) => setField("hpCurrent", Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Макс">
                    <Input
                      type="number"
                      value={character.hpMax}
                      onChange={(e) => setField("hpMax", Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Временные">
                    <Input
                      type="number"
                      value={character.tempHp}
                      onChange={(e) => setField("tempHp", Number(e.target.value) || 0)}
                    />
                  </Field>
                </div>
                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-3">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, character.hpMax ? (character.hpCurrent / character.hpMax) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted">
                  Сородич: автоуспех death saves (Вампирская стойкость). 0 от Огня/Луча или
                  обезглавливание — смерть.
                </p>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                <h3 className="mb-3 flex items-center gap-2 font-display text-base">
                  <Shield className="size-4 text-accent" /> Защита
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="КД">
                    <Input
                      type="number"
                      value={character.ac}
                      onChange={(e) => setField("ac", Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Скорость">
                    <Input
                      type="number"
                      value={character.speed}
                      onChange={(e) => setField("speed", Number(e.target.value) || 0)}
                    />
                  </Field>
                  <Field label="Сл заклинаний">
                    <Input readOnly value={spellDc} />
                  </Field>
                  <Field label="Вдохновение">
                    <button
                      type="button"
                      onClick={() => setField("inspiration", !character.inspiration)}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-[var(--radius)] border text-sm font-medium",
                        character.inspiration
                          ? "border-accent bg-accent/20 text-accent"
                          : "border-border bg-surface-2 text-muted",
                      )}
                    >
                      {character.inspiration ? "Есть" : "Нет"}
                    </button>
                  </Field>
                </div>
                <div className="mt-2">
                  <Field label="Концентрация">
                    <Input
                      value={character.concentrating}
                      placeholder="На чём держишь"
                      onChange={(e) => setField("concentrating", e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base">Атаки</h3>
                <Button type="button" size="sm" variant="secondary" onClick={addAttack}>
                  <Plus className="size-3.5" /> Атака
                </Button>
              </div>
              <div className="space-y-2">
                {character.attacks.map((atk) => (
                  <div
                    key={atk.id}
                    className="grid gap-2 rounded-[var(--radius)] border border-border bg-surface-2 p-3 sm:grid-cols-12"
                  >
                    <Input
                      className="sm:col-span-3"
                      value={atk.name}
                      onChange={(e) => updateAttack(atk.id, { name: e.target.value })}
                    />
                    <Input
                      className="sm:col-span-1"
                      type="number"
                      title="Бонус"
                      value={atk.bonus}
                      onChange={(e) =>
                        updateAttack(atk.id, { bonus: Number(e.target.value) || 0 })
                      }
                    />
                    <Input
                      className="sm:col-span-2"
                      value={atk.damage}
                      onChange={(e) => updateAttack(atk.id, { damage: e.target.value })}
                    />
                    <Input
                      className="sm:col-span-2"
                      value={atk.type}
                      onChange={(e) => updateAttack(atk.id, { type: e.target.value })}
                    />
                    <Input
                      className="sm:col-span-3"
                      value={atk.notes}
                      placeholder="заметки"
                      onChange={(e) => updateAttack(atk.id, { notes: e.target.value })}
                    />
                    <div className="flex gap-1 sm:col-span-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="blood"
                        className="flex-1"
                        onClick={() => {
                          const d20 = rollDie(20);
                          const total = d20 + atk.bonus;
                          toast.message(`${atk.name}: ${d20}${formatMod(atk.bonus)} = ${total}`);
                          addLog(`Атака ${atk.name}: ${total}`);
                        }}
                      >
                        Брос
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeAttack(atk.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DicePanel />
          </div>

          <aside className="space-y-4 lg:col-span-4">
            <ResourcePool
              label="Очки крови"
              current={character.bloodCurrent}
              max={bloodMax}
              color="blood"
              onSpend={() => spendBlood(1)}
              onGain={() => gainBlood(1)}
              onToggle={setBloodTo}
            />
            <Button type="button" variant="blood" className="w-full" onClick={fillBlood}>
              <Droplets className="size-3.5" /> Полный пул
            </Button>

            <ResourcePool
              label={`Зверь (осталось ${beastLeft})`}
              current={beastLeft}
              max={beastMax}
              color="beast"
              onSpend={useBeast}
              onGain={() => setField("beastUsed", Math.max(0, character.beastUsed - 1))}
              onToggle={(i) => {
                const want = beastLeft === i + 1 ? i : i + 1;
                setField("beastUsed", Math.max(0, beastMax - want));
              }}
            />

            <QuickActions />

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-sm">Ресурсы (настраиваемые)</h3>
                <Button type="button" size="sm" variant="ghost" onClick={addResource}>
                  <Plus className="size-3.5" />
                </Button>
              </div>
              <div className="space-y-2">
                {character.customResources.map((r) => (
                  <div key={r.id} className="rounded border border-border bg-surface-2 p-2">
                    <div className="mb-1 flex items-center gap-1">
                      <Input
                        className="h-8"
                        value={r.name}
                        onChange={(e) => updateResource(r.id, { name: e.target.value })}
                      />
                      <button type="button" onClick={() => removeResource(r.id)}>
                        <Trash2 className="size-3.5 text-muted" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          updateResource(r.id, { current: Math.max(0, r.current - 1) })
                        }
                      >
                        −
                      </Button>
                      <span className="min-w-12 text-center tabular-nums text-sm">
                        {r.current}/{r.max}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          updateResource(r.id, {
                            current: Math.min(r.max, r.current + 1),
                          })
                        }
                      >
                        +
                      </Button>
                      <Input
                        className="h-8 w-14"
                        type="number"
                        value={r.max}
                        onChange={(e) =>
                          updateResource(r.id, { max: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={r.note}
                      placeholder="заметка"
                      onChange={(e) => updateResource(r.id, { note: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <h3 className="mb-2 font-display text-sm">Состояния</h3>
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.map((cond) => {
                  const on =
                    character.conditions.includes(cond) ||
                    (cond === "Голод" && character.hunger);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => {
                        if (cond === "Голод") {
                          setField("hunger", !character.hunger);
                          return;
                        }
                        toggleCondition(cond);
                      }}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium",
                        on
                          ? "border-primary bg-primary/25 text-fg"
                          : "border-border text-muted",
                      )}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-sm">
              <h3 className="mb-2 font-display">Профиль {character.level} ур.</h3>
              <dl className="space-y-1.5">
                <Row k="Макс. очк. крови" v={String(bloodMax)} />
                <Row k="Кости питания" v={row.feed} />
                <Row k="Кости хитов" v={`${character.level}d10`} />
                <Row k="Фичи уровня" v={row.features} />
              </dl>
              <div className="mt-2">
                <Field label="Предпочтительная кровь (Bane Вентру)">
                  <Input
                    value={character.preferredBlood}
                    placeholder="солдаты, добровольцы…"
                    onChange={(e) => setField("preferredBlood", e.target.value)}
                  />
                </Field>
              </div>
            </div>

            {character.clan === "ventrue" && (
              <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-surface p-4">
                <h3 className="mb-1 font-display text-accent">{VENTRUE_LORE.name}</h3>
                <p className="text-xs text-muted">{VENTRUE_LORE.tagline}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {VENTRUE_LORE.description}
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {tab === "skills" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <h2 className="mb-2 font-display text-lg">Навыки</h2>
            <p className="mb-3 text-xs text-muted">
              Кружок: нет → владение → экспертиза. Клик по бонусу — бросок. Kindred:
              выбери 2 из Атлетика, Обман, История, Запугивание, Внимательность, Убеждение,
              Выживание, Скрытность (+ фоновые).
            </p>
            <ul className="space-y-1">
              {SKILLS.map((sk) => {
                const prof = character.skillProfs[sk.id] ?? "none";
                const bonus = skillBonus(
                  character.abilities[sk.ability],
                  pb,
                  prof === "none" ? undefined : prof,
                );
                return (
                  <li
                    key={sk.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-surface-2"
                  >
                    <button
                      type="button"
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold",
                        prof === "expertise"
                          ? "border-accent bg-accent/20 text-accent"
                          : prof === "proficient"
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-border text-faint",
                      )}
                      onClick={() => {
                        const order: ProfLevel[] = ["none", "proficient", "expertise"];
                        const idx = order.indexOf(prof);
                        setSkillProf(sk.id, order[(idx + 1) % order.length]!);
                      }}
                    >
                      {prof === "expertise" ? "Э" : prof === "proficient" ? "В" : "—"}
                    </button>
                    <span className="w-8 text-[10px] uppercase text-faint">
                      {ABILITY_KEYS.find((a) => a.key === sk.ability)?.short}
                    </span>
                    <span className="flex-1 text-sm">{sk.nameRu}</span>
                    <button
                      type="button"
                      className="font-display tabular-nums text-accent"
                      onClick={() => {
                        const d20 = rollDie(20);
                        toast.message(
                          `${sk.nameRu}: ${d20}${formatMod(bonus)} = ${d20 + bonus}`,
                        );
                        addLog(`${sk.nameRu}: ${d20 + bonus}`);
                      }}
                    >
                      {formatMod(bonus)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-center">
                <div className="text-xs text-muted">Пасс. внимательность</div>
                <div className="font-display text-3xl text-accent">{passivePer}</div>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 text-center">
                <div className="text-xs text-muted">Пасс. проницательность</div>
                <div className="font-display text-3xl text-accent">{passiveIns}</div>
              </div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 space-y-2">
              <Field label="Предыстория">
                <Input
                  value={character.background}
                  onChange={(e) => setField("background", e.target.value)}
                />
              </Field>
              <Field label="Вид">
                <Input
                  value={character.species}
                  onChange={(e) => setField("species", e.target.value)}
                />
              </Field>
              <Field label="Мировоззрение">
                <Input
                  value={character.alignment}
                  onChange={(e) => setField("alignment", e.target.value)}
                />
              </Field>
              <Field label="Игрок">
                <Input
                  value={character.player}
                  onChange={(e) => setField("player", e.target.value)}
                />
              </Field>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-4 text-xs text-muted">
              <div className="mb-1 flex items-center gap-1 font-medium text-fg">
                <Link2 className="size-3.5" /> Удалённый стол
              </div>
              Long Story / Foundry / Discord + этот лист. Продолжительный отдых без ≥1
              ОБК = только короткий (Awaken).
            </div>
          </div>
        </div>
      )}

      {tab === "features" && (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-surface p-4">
            <h2 className="font-display text-lg text-accent">{VENTRUE_LORE.title}</h2>
            <p className="mt-1 text-sm text-muted">
              Полная прогрессия Kindred + Вентру по PDF. Нажми карточку — развернуть
              правила. Уровень листа: {character.level} (открыто всё ≤ этого уровня).
            </p>
          </div>

          <section>
            <h3 className="mb-2 font-display text-base">Базовый класс · Сородич</h3>
            <div className="grid gap-2 lg:grid-cols-2">
              {core.map((f) => (
                <FeatureCard
                  key={f.id}
                  feature={f}
                  open={openFeature === f.id}
                  onToggle={() => setOpenFeature(openFeature === f.id ? null : f.id)}
                />
              ))}
            </div>
          </section>

          {(character.clan === "ventrue" || character.clan === "none") && (
            <section>
              <h3 className="mb-2 font-display text-base">Клан Вентру · прогрессия</h3>
              <div className="grid gap-2 lg:grid-cols-2">
                {ventrue.map((f) => (
                  <FeatureCard
                    key={f.id}
                    feature={f}
                    open={openFeature === f.id}
                    onToggle={() => setOpenFeature(openFeature === f.id ? null : f.id)}
                    accent
                  />
                ))}
              </div>
              {character.level < 18 && (
                <p className="mt-2 text-xs text-muted">
                  Ещё не открыто:{" "}
                  {unlockedVentrue(20)
                    .filter((f) => f.level > character.level)
                    .map((f) => `ур.${f.level} ${f.name}`)
                    .join(" · ")}
                </p>
              )}
            </section>
          )}

          <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2">Ур.</th>
                  <th className="px-3 py-2">БМ</th>
                  <th className="px-3 py-2">Фичи</th>
                  <th className="px-3 py-2">ОБК</th>
                  <th className="px-3 py-2">Питание</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 20 }, (_, i) => getLevelData(i + 1)).map((r) => (
                  <tr
                    key={r.level}
                    className={cn(
                      "border-t border-border",
                      r.level === character.level && "bg-primary/15",
                      r.level < character.level && "text-muted",
                    )}
                  >
                    <td className="px-3 py-1.5 font-medium">{r.level}</td>
                    <td className="px-3 py-1.5">+{r.pb}</td>
                    <td className="px-3 py-1.5">{r.features}</td>
                    <td className="px-3 py-1.5">{r.bp}</td>
                    <td className="px-3 py-1.5">{r.feed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "feats" && (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <h2 className="font-display text-lg">Черты сородича</h2>
            <p className="mt-1 text-sm text-muted">
              Отметь взятые черты (слоты: 2, 7, 10, 13, 17 + ASI 4/8/12/16). Можно
              настроить под себя. Доступны черты с prerequisite ≤ твоего уровня.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {character.selectedFeats.map((id) => {
                const f = availableFeats.find((x) => x.id === id);
                return (
                  <span
                    key={id}
                    className="rounded-full border border-primary bg-primary/20 px-3 py-1 text-xs"
                  >
                    {f?.name ?? id}
                  </span>
                );
              })}
              {character.selectedFeats.length === 0 && (
                <span className="text-xs text-muted">Пока ничего не выбрано</span>
              )}
            </div>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {availableFeats.map((f) => {
              const on = character.selectedFeats.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleFeat(f.id)}
                  className={cn(
                    "rounded-[var(--radius-lg)] border p-4 text-left transition-colors",
                    on
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface hover:bg-surface-2",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-fg">{f.name}</span>
                    <span className="text-[10px] text-faint">{f.prereq}</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
                  <div className="mt-2 text-xs font-medium text-primary">
                    {on ? "✓ Взято — нажми, чтобы снять" : "Нажми, чтобы отметить"}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <Label>Свободные заметки по чертам / ASI</Label>
            <Textarea
              className="mt-1 min-h-28"
              value={character.feats}
              onChange={(e) => setField("feats", e.target.value)}
              placeholder="Ур.4: +2 Хар… Ур.8: +2 Тел…"
            />
          </div>
        </div>
      )}

      {tab === "gear" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <Label>Снаряжение</Label>
            <Textarea
              className="mt-1 min-h-48"
              value={character.equipment}
              onChange={(e) => setField("equipment", e.target.value)}
            />
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <Label>Заметки / Bonds / цели сессии</Label>
            <Textarea
              className="mt-1 min-h-48"
              value={character.notes}
              onChange={(e) => setField("notes", e.target.value)}
            />
          </div>
        </div>
      )}

      {tab === "log" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg">Журнал</h2>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => {
                  const t = prompt("Заметка:");
                  if (t) addLog(t);
                }}
              >
                <Plus className="size-3.5" /> Запись
              </Button>
            </div>
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto scroll-thin">
              {character.sessionLog.length === 0 && (
                <li className="text-sm text-muted">Пусто — броски и отдых появятся здесь.</li>
              )}
              {character.sessionLog.map((e) => (
                <li
                  key={e.id}
                  className="rounded border border-border bg-surface-2 px-3 py-2 text-sm"
                >
                  <div className="text-[10px] text-faint">
                    {new Date(e.at).toLocaleTimeString("ru-RU")}
                  </div>
                  <div>{e.text}</div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <Label>JSON персонажа</Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={async () => {
                  await navigator.clipboard.writeText(JSON.stringify(character, null, 2));
                  toast.success("Скопировано");
                }}
              >
                <Copy className="size-3.5" />
              </Button>
            </div>
            <pre className="max-h-[28rem] overflow-auto rounded bg-bg p-3 text-xs text-muted scroll-thin">
              {JSON.stringify(character, null, 2)}
            </pre>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  shortRest();
                  toast.success("Короткий отдых");
                }}
              >
                <RefreshCw className="size-3.5" /> Короткий
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  longRest();
                  toast.message("Длинный отдых (нужен ≥1 ОБК)");
                }}
              >
                Длинный
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 p-2 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={() => adjustHp(-1)}>
            −ХП
          </Button>
          <Button type="button" variant="blood" className="flex-1" onClick={() => spendBlood(1)}>
            −ОБК
          </Button>
          <Button type="button" variant="secondary" className="flex-1" onClick={useBeast}>
            Зверь
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={() => setTab("features")}>
            Фичи
          </Button>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  feature,
  open,
  onToggle,
  accent,
}: {
  feature: FeatureBlock;
  open: boolean;
  onToggle: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "rounded-[var(--radius-lg)] border p-4 text-left transition-colors",
        accent ? "border-primary/40 bg-surface" : "border-border bg-surface",
        open && "ring-1 ring-primary/40",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-medium text-fg">{feature.name}</span>
        <span className="shrink-0 text-xs text-faint">ур. {feature.level}</span>
      </div>
      <p className="mt-1 text-sm text-muted">{feature.summary}</p>
      {open && (
        <p className="mt-3 whitespace-pre-line border-t border-border pt-3 text-sm leading-relaxed text-fg/90">
          {feature.body}
        </p>
      )}
      {feature.costs && (
        <div className="mt-2 flex flex-wrap gap-1">
          {feature.costs.map((c) => (
            <span
              key={c}
              className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function HudStat({ label, value, blood }: { label: string; value: string; blood?: boolean }) {
  return (
    <div className="min-w-[3.25rem]">
      <div className="text-[9px] font-bold uppercase tracking-wider text-faint">{label}</div>
      <div
        className={cn(
          "font-display text-base tabular-nums leading-tight sm:text-lg",
          blood ? "text-primary" : "text-fg",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/50 py-1 last:border-0">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium text-fg">{v}</dd>
    </div>
  );
}
