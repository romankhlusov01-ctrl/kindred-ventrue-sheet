import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COPY } from "@/data/terms-ru";

const KEY = "kindred-onboarding-v4-modes";

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
    <div className="mb-3 rounded-[var(--radius-lg)] border border-accent/40 bg-accent/10 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-sm text-accent">Два режима</h2>
          <ol className="mt-1.5 list-decimal space-y-0.5 pl-4 text-xs text-muted">
            <li>
              <strong className="text-fg">Создать</strong> — {COPY.onboarding1.replace(/^Создать — /, "")}
            </li>
            <li>
              <strong className="text-fg">Играть</strong> — {COPY.onboarding2.replace(/^Играть — /, "")}
            </li>
            <li>{COPY.onboarding3}</li>
          </ol>
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="shrink-0"
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
