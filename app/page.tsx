"use client";

import { useState } from "react";
import SetupScreen from "@/components/SetupScreen";
import SessionScreen from "@/components/SessionScreen";
import SummaryScreen from "@/components/SummaryScreen";
import { pickWords, type LanguageId, type Phase, type TrackId, type Word, type WordResult } from "@/lib/session";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [track, setTrack] = useState<TrackId>("interview");
  const [language, setLanguage] = useState<LanguageId>("hinglish");
  const [words, setWords] = useState<Word[]>([]);
  const [results, setResults] = useState<WordResult[]>([]);
  const [summary, setSummary] = useState<string | null>(null);

  function start() {
    setWords(pickWords(track));
    setResults([]);
    setSummary(null);
    setPhase("session");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      {phase === "setup" && (
        <SetupScreen track={track} language={language} onTrack={setTrack} onLanguage={setLanguage} onStart={start} />
      )}
      {phase === "session" && (
        <SessionScreen
          track={track}
          language={language}
          words={words}
          onFinish={(r, s) => {
            setResults(r);
            setSummary(s);
            setPhase("summary");
          }}
        />
      )}
      {phase === "summary" && (
        <SummaryScreen words={words} results={results} summary={summary} onAgain={start} onChange={() => setPhase("setup")} />
      )}
    </main>
  );
}
