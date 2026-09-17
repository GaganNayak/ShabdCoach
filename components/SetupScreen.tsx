import { BriefcaseBusiness, Building2, CircleAlert, Headset, Mic, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TRACKS } from "@/lib/words";
import { LANGUAGES, WORDS_PER_SESSION, type LanguageId, type TrackId } from "@/lib/session";
import { cn } from "@/lib/utils";

const ICONS = { interview: BriefcaseBusiness, support: Headset, sales: TrendingUp, office: Building2 } satisfies Record<TrackId, unknown>;
const STEPS = ["Learn", "Recall", "Use it", "Review"];

type Props = {
  track: TrackId;
  language: LanguageId;
  error: string | null;
  onTrack: (t: TrackId) => void;
  onLanguage: (l: LanguageId) => void;
  onStart: () => void;
};

export default function SetupScreen({ track, language, error, onTrack, onLanguage, onStart }: Props) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <header className="space-y-2 pt-2">
        <p className="text-sm font-medium text-primary">Shabd Coach</p>
        <h1 className="text-2xl font-semibold tracking-tight">Learn English words for your job, by talking.</h1>
        <p className="text-sm text-muted-foreground">
          {WORDS_PER_SESSION} words · about 5 minutes · {STEPS.join(" → ")}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">1. Pick your job area</h2>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Job area">
          {(Object.keys(TRACKS) as TrackId[]).map((id) => {
            const Icon = ICONS[id];
            const selected = id === track;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onTrack(id)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl bg-card p-4 text-left ring-1 ring-foreground/10 transition",
                  "hover:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected && "bg-primary/5 ring-2 ring-primary",
                )}
              >
                <Icon className={cn("size-5", selected ? "text-primary" : "text-muted-foreground")} />
                <span className="text-sm font-medium">{TRACKS[id].label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">2. Explain in</h2>
        <ToggleGroup
          type="single"
          variant="outline"
          value={language}
          onValueChange={(v) => v && onLanguage(v as LanguageId)}
          className="w-full"
          aria-label="Explanation language"
        >
          {(Object.keys(LANGUAGES) as LanguageId[]).map((id) => {
            const l = LANGUAGES[id];
            return (
              <ToggleGroupItem key={id} value={id} className="h-11 flex-1 gap-1.5 data-[state=on]:border-primary data-[state=on]:text-primary">
                {l.native}
                {"beta" in l && <Badge variant="secondary" className="px-1.5 text-[10px]">Beta</Badge>}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">Words are always English. The coach explains them in your language.</p>
        {language === "kannada" && (
          <p className="text-xs text-amber-700">
            Kannada voice is in beta and can stutter. The meaning is always shown on screen too.
          </p>
        )}
      </section>

      <div className="mt-auto space-y-2 pb-2">
        {error && (
          <p role="alert" className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {error}
          </p>
        )}
        <Button size="lg" className="h-12 w-full text-base" onClick={onStart}>
          <Mic /> Start speaking
        </Button>
        <p className="text-center text-xs text-muted-foreground">We&apos;ll ask for microphone access.</p>
      </div>
    </div>
  );
}
