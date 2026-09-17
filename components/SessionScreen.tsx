"use client";

import { useEffect, useRef, useState } from "react";
import { Check, PhoneOff, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TRACKS } from "@/lib/words";
import { LANGUAGES, upsertResult, type LanguageId, type TrackId, type TranscriptLine, type Word, type WordResult } from "@/lib/session";
import { cn } from "@/lib/utils";

type Props = {
  track: TrackId;
  language: LanguageId;
  words: Word[];
  onFinish: (results: WordResult[], summary: string | null) => void;
};

type Mode = "connecting" | "listening" | "speaking";

export default function SessionScreen({ track, language, words, onFinish }: Props) {
  const lang = LANGUAGES[language];
  // ponytail: mock state for Phase 3; Phase 4 replaces it with useConversation (transcript, mode, clientTools).
  const [mode, setMode] = useState<Mode>("speaking");
  const [transcript, setTranscript] = useState<TranscriptLine[]>([
    { role: "agent", text: `Hi! I'm Shabd Coach. Today we'll learn 5 useful English words for ${TRACKS[track].label} jobs. Ready?` },
  ]);
  const [results, setResults] = useState<WordResult[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [transcript]);

  const resultFor = (w: Word) => results.find((r) => r.word.trim().toLowerCase() === w.word.toLowerCase());
  const current = words.find((w) => !resultFor(w));

  function simulateWord() {
    if (!current) return onFinish(results, "Great effort today! Come back tomorrow for 5 more words.");
    const ok = Math.random() > 0.3;
    setTranscript((t) => [
      ...t,
      { role: "agent", text: `Word ${results.length + 1} of 5: ${current.word}. ${current.example}` },
      { role: "user", text: ok ? `I ${current.word} it every day.` : "Umm, I'm not sure." },
    ]);
    setResults((r) => upsertResult(r, { word: current.word, recalled: ok, used_correctly: ok, tip: ok ? "Nice sentence!" : "Try using it about your own work." }));
    setMode((m) => (m === "speaking" ? "listening" : "speaking"));
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{TRACKS[track].label}</p>
          <p className="text-xs text-muted-foreground">Explaining in {lang.native}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onFinish(results, null)}>
          <PhoneOff /> End
        </Button>
      </header>

      <Orb mode={mode} />

      <ol className="flex justify-center gap-2" aria-label="Progress">
        {words.map((w, i) => {
          const r = resultFor(w);
          const passed = r && (r.recalled || r.used_correctly);
          return (
            <li
              key={w.word}
              title={w.word}
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-xs font-medium ring-1 ring-foreground/10",
                !r && w === current && "ring-2 ring-primary",
                r && passed && "bg-primary text-primary-foreground ring-0",
                r && !passed && "bg-destructive/10 text-destructive ring-0",
              )}
            >
              {r ? passed ? <Check className="size-4" /> : <X className="size-4" /> : i + 1}
              <span className="sr-only">{w.word}{r ? (passed ? " learned" : " needs practice") : ""}</span>
            </li>
          );
        })}
      </ol>

      {current && (
        <Card size="sm">
          <CardContent className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl font-semibold">{current.word}</p>
              <Badge variant="secondary">Now learning</Badge>
            </div>
            <p className="text-sm">{current.en}</p>
            {lang.field !== "en" && <p className="text-sm text-muted-foreground">{current[lang.field]}</p>}
            <p className="pt-1 text-sm italic text-muted-foreground">“{current.example}”</p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-48 rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="space-y-2 p-3" aria-live="polite">
          {transcript.map((line, i) => (
            <p
              key={i}
              className={cn(
                "w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                line.role === "agent" ? "bg-muted" : "ml-auto bg-primary text-primary-foreground",
              )}
            >
              {line.text}
            </p>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <Button variant="secondary" className="mt-auto" onClick={simulateWord}>
        {current ? "Simulate next word (mock)" : "Simulate end of session (mock)"}
      </Button>
    </div>
  );
}

function Orb({ mode }: { mode: Mode }) {
  const label = { connecting: "Connecting…", listening: "Listening — your turn", speaking: "Coach is speaking" }[mode];
  return (
    <div className="flex flex-col items-center gap-4 py-3">
      <div className="relative flex size-28 items-center justify-center">
        <span
          className={cn(
            "absolute inset-0 rounded-full bg-primary/15 transition-transform duration-700",
            mode === "speaking" && "scale-110 animate-pulse",
            mode === "connecting" && "animate-pulse",
          )}
        />
        <span className={cn("size-20 rounded-full bg-primary transition-transform", mode === "listening" && "scale-90 bg-primary/70")} />
      </div>
      <p className="text-sm text-muted-foreground" role="status">{label}</p>
    </div>
  );
}
