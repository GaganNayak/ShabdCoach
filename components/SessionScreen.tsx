"use client";

import { useEffect, useRef } from "react";
import { useConversationMode, useConversationStatus } from "@elevenlabs/react";
import { Check, PhoneOff, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TRACKS } from "@/lib/words";
import { LANGUAGES, currentIndex, findResult, type LanguageId, type TrackId, type TranscriptLine, type Word, type WordResult } from "@/lib/session";
import { cn } from "@/lib/utils";

type Props = {
  track: TrackId;
  language: LanguageId;
  words: Word[];
  transcript: TranscriptLine[];
  results: WordResult[];
  turnsDone: number;
  spokenIndex: number;
  onEnd: () => void;
};

type Mode = "connecting" | "listening" | "speaking";

export default function SessionScreen({ track, language, words, transcript, results, turnsDone, spokenIndex, onEnd }: Props) {
  const lang = LANGUAGES[language];
  const { status } = useConversationStatus();
  const { mode: agentMode } = useConversationMode();
  const mode: Mode = status === "connected" ? agentMode : "connecting";
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [transcript]);

  const index = currentIndex(words, results, transcript, turnsDone, spokenIndex);
  const current = words[index];
  const currentResult = current && findResult(results, current); // logged, feedback being spoken

  return (
    <div className="flex flex-1 flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-primary">{TRACKS[track].label}</p>
          <p className="text-xs text-muted-foreground">Explaining in {lang.native}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onEnd}>
          <PhoneOff /> End
        </Button>
      </header>

      <Orb mode={mode} />

      <ol className="flex justify-center gap-2" aria-label="Progress">
        {words.map((w, i) => {
          const r = findResult(results, w);
          const passed = r && (r.recalled || r.used_correctly);
          const unlogged = !r && i < index; // coach moved on without logging a result
          return (
            <li
              key={w.word}
              title={w.word}
              className={cn(
                "flex size-9 items-center justify-center rounded-full text-xs font-medium ring-1 ring-foreground/10",
                i === index && "ring-2 ring-primary ring-offset-2",
                unlogged && "bg-muted text-muted-foreground ring-0",
                r && passed && "bg-primary text-primary-foreground ring-0",
                r && !passed && "bg-destructive/10 text-destructive ring-0",
              )}
            >
              {r ? passed ? <Check className="size-4" /> : <X className="size-4" /> : unlogged ? "–" : i + 1}
              <span className="sr-only">{w.word}{r ? (passed ? " learned" : " needs practice") : unlogged ? " done" : ""}</span>
            </li>
          );
        })}
      </ol>

      {current ? (
        <Card size="sm">
          <CardContent className="space-y-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl font-semibold">{current.word}</p>
              {currentResult ? (
                currentResult.recalled || currentResult.used_correctly ? (
                  <Badge>Learned ✓</Badge>
                ) : (
                  <Badge variant="destructive">Keep practising</Badge>
                )
              ) : (
                <Badge variant="secondary">Now learning</Badge>
              )}
            </div>
            <p className="text-sm">{current.en}</p>
            {lang.field !== "en" && <p className="text-sm text-muted-foreground">{current[lang.field]}</p>}
            <p className="pt-1 text-sm italic text-muted-foreground">“{current.example}”</p>
            {currentResult?.tip && <p className="pt-1 text-sm">💡 {currentResult.tip}</p>}
          </CardContent>
        </Card>
      ) : (
        <Card size="sm">
          <CardContent className="text-center text-sm">All 5 words done. Revision quiz time!</CardContent>
        </Card>
      )}

      <ScrollArea className="h-48 rounded-xl bg-card ring-1 ring-foreground/10">
        <div className="space-y-2 p-3" aria-live="polite">
          {transcript.length === 0 && <p className="text-center text-sm text-muted-foreground">Say hello when the coach greets you 👋</p>}
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
