import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "kindred-onboarding-v2-self";

export function OnboardingBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!open) return null;

  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-accent/40 bg-accent/10 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base text-accent">Лист для тебя</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-muted">
            <li>
              <strong className="text-fg">Игра</strong> — ХП, ОБК, удача, атаки, силы
            </li>
            <li>
              <strong className="text-fg">Низ панели</strong> — Атака · Питание · Зверь · Ход
            </li>
            <li>
              <strong className="text-fg">Билдер</strong> — один раз настроить, «Применить»
            </li>
            <li>Редкое (торпор, кол, солнце) — свёрнуто внизу «Игра»</li>
          </ol>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setOpen(false);
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
