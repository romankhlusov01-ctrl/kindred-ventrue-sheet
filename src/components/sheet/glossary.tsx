import { useState } from "react";
import { BookMarked } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GLOSSARY } from "@/data/glossary-ru";

export function Glossary() {
  const [q, setQ] = useState("");
  const list = GLOSSARY.filter(
    (g) =>
      !q.trim() ||
      `${g.term} ${g.body}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <h3 className="mb-2 flex items-center gap-2 font-display text-base">
        <BookMarked className="size-4 text-accent" /> Глоссарий
      </h3>
      <Input
        className="mb-3"
        placeholder="Поиск термина…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="max-h-80 space-y-2 overflow-y-auto scroll-thin">
        {list.map((g) => (
          <li key={g.term} className="rounded border border-border bg-surface-2 p-2.5 text-sm">
            <div className="font-medium text-fg">{g.term}</div>
            <p className="mt-1 text-xs text-muted">{g.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
