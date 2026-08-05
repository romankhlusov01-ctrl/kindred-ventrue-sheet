import { useState } from "react";
import { BookMarked } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GLOSSARY } from "@/data/glossary-ru";

export function Glossary() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const list = GLOSSARY.filter(
    (g) =>
      !q.trim() ||
      `${g.term} ${g.body}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
      <h3 className="mb-2 flex items-center gap-2 font-display text-base">
        <BookMarked className="size-4 text-accent" /> Глоссарий
      </h3>
      <Input
        className="mb-3 h-11"
        placeholder="Поиск термина…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="max-h-96 space-y-1.5 overflow-y-auto scroll-thin">
        {list.map((g) => {
          const isOpen = open === g.term;
          return (
            <li key={g.term}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : g.term)}
                className="w-full rounded-[var(--radius)] border border-border bg-surface-2 p-3 text-left active:scale-[0.99]"
              >
                <div className="font-medium text-fg">{g.term}</div>
                {isOpen && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{g.body}</p>
                )}
                {!isOpen && (
                  <p className="mt-0.5 truncate text-xs text-faint">{g.body}</p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
