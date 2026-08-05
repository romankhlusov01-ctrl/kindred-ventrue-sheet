import { toast } from "sonner";
import { Moon, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterStore, getLuckMax } from "@/lib/character-store";
import { useSessionStore } from "@/lib/session-store";
import { effectivePb } from "@/lib/level-utils";

export function RestWizard() {
  const c = useCharacterStore((s) => s.character);
  const shortRest = useCharacterStore((s) => s.shortRest);
  const longRest = useCharacterStore((s) => s.longRest);
  const spendHitDie = useCharacterStore((s) => s.spendHitDie);
  const addLog = useCharacterStore((s) => s.addLog);
  const pushUndo = useSessionStore((s) => s.pushUndo);
  const luckMax = getLuckMax(c.level, c.multiclass);
  const pb = effectivePb(c.level, c.multiclass);
  const hdLeft = c.level - c.hitDiceUsed;

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 font-display text-sm">Отдых</h3>
      <div className="mb-3 space-y-1 text-xs text-muted">
        <p>
          Зверь: {Math.max(0, pb - c.beastUsed)}/{pb} · HD: {hdLeft}/{c.level} · ОБК:{" "}
          {c.bloodCurrent}
        </p>
        <p>
          Удача: Везучий {luckMax - c.luckyUsed}/{luckMax} · Защищ.{" "}
          {luckMax - c.protectedUsed}/{luckMax}
        </p>
        <p>
          Awaken: долгий отдых требует <strong className="text-fg">≥1 ОБК</strong> для полных
          хитов.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          type="button"
          className="h-14 w-full"
          variant="secondary"
          onClick={() => {
            pushUndo("Короткий отдых");
            shortRest();
            toast.success("Короткий: Зверь, Голос");
          }}
        >
          <Coffee className="size-3.5" /> Короткий
        </Button>
        <Button
          type="button"
          className="h-14 w-full"
          variant="secondary"
          disabled={hdLeft <= 0}
          onClick={() => {
            const h = spendHitDie();
            if (h == null) toast.error("Нет HD");
            else {
              addLog(`HD: +${h}`);
              toast.success(`+${h} ХП (HD)`);
            }
          }}
        >
          HD d8
        </Button>
        <Button
          type="button"
          className="h-14 w-full"
          variant={c.bloodCurrent >= 1 ? "blood" : "outline"}
          onClick={() => {
            pushUndo("Долгий отдых");
            const ok = c.bloodCurrent >= 1;
            longRest();
            toast.message(
              ok
                ? "Долгий: хиты, удача, вдохновение"
                : "Долгий без ОБК — только короткий (Awaken)",
            );
          }}
        >
          <Moon className="size-3.5" /> Долгий
          {c.bloodCurrent < 1 ? " · нет ОБК" : ""}
        </Button>
      </div>
    </div>
  );
}
