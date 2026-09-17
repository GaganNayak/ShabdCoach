import { Check, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { findResult, type Word, type WordResult } from "@/lib/session";

type Props = {
  words: Word[];
  results: WordResult[];
  summary: string | null;
  onAgain: () => void;
  onChange: () => void;
};

export default function SummaryScreen({ words, results, summary, onAgain, onChange }: Props) {
  const find = (w: Word) => findResult(results, w);
  const learned = words.filter((w) => {
    const r = find(w);
    return r && (r.recalled || r.used_correctly);
  }).length;

  return (
    <div className="flex flex-1 flex-col gap-5">
      <header className="space-y-3 pt-2 text-center">
        <p className="text-sm font-medium text-primary">Session complete</p>
        <p className="text-5xl font-semibold">
          {learned}<span className="text-2xl text-muted-foreground">/{words.length}</span>
        </p>
        <p className="text-sm text-muted-foreground">words learned</p>
        <Progress value={(learned / words.length) * 100} aria-label="Words learned" />
        {summary && <p className="text-sm">{summary}</p>}
      </header>

      <ul className="space-y-2">
        {words.map((w) => {
          const r = find(w);
          return (
            <li key={w.word}>
              <Card size="sm">
                <CardContent className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{w.word}</p>
                    {r ? (
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <Mark ok={r.recalled} label="Meaning" />
                        <Mark ok={r.used_correctly} label="Used" />
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not reached</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{w.en}</p>
                  {r?.tip && <p className="text-sm">💡 {r.tip}</p>}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto space-y-2 pb-2">
        <Button size="lg" className="h-12 w-full text-base" onClick={onAgain}>
          <RotateCcw /> Practice 5 new words
        </Button>
        <Button variant="ghost" className="w-full" onClick={onChange}>
          Change job area or language
        </Button>
      </div>
    </div>
  );
}

function Mark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1">
      {ok ? <Check className="size-3.5 text-primary" /> : <X className="size-3.5 text-destructive" />}
      {label}
    </span>
  );
}
