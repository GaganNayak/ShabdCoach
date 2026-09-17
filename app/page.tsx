"use client";

import { useRef, useState } from "react";
import { ConversationProvider, useConversationControls } from "@elevenlabs/react";
import SetupScreen from "@/components/SetupScreen";
import SessionScreen from "@/components/SessionScreen";
import SummaryScreen from "@/components/SummaryScreen";
import { TRACKS } from "@/lib/words";
import {
  LANGUAGES,
  buildWordList,
  cleanSpeech,
  pickWords,
  upsertResult,
  type LanguageId,
  type Phase,
  type TrackId,
  type TranscriptLine,
  type Word,
  type WordResult,
} from "@/lib/session";

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
// The coach's audio can pause briefly mid-reply (e.g. while it calls a tool); only this much silence ends a turn.
const TURN_END_MS = 1200;
const GREETING_OVERRIDE = true; // agent allows the first-message override (verified 2026-09-17)

export default function Home() {
  return (
    <ConversationProvider>
      <App />
    </ConversationProvider>
  );
}

function App() {
  const { startSession, endSession } = useConversationControls();
  const [phase, setPhase] = useState<Phase>("setup");
  const [track, setTrack] = useState<TrackId>("interview");
  const [language, setLanguage] = useState<LanguageId>("hinglish");
  const [words, setWords] = useState<Word[]>([]);
  const [results, setResults] = useState<WordResult[]>([]);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnsDone, setTurnsDone] = useState(0); // finished coach speaking turns
  const turns = useRef(0); // same, readable synchronously inside tool/message callbacks
  const spoke = useRef(false); // coach spoke since the last finished turn
  const silence = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heard = useRef(false); // got at least one message → a real session happened
  const ending = useRef(false); // end_session called → hang up once the goodbye finishes

  async function start() {
    setError(null);
    if (!AGENT_ID) return setError("Voice coach is not configured (missing agent ID).");
    if (!navigator.mediaDevices?.getUserMedia) {
      return setError("This browser can't use the microphone. Please open the link in Chrome or Safari.");
    }
    try {
      // Ask inside the tap so the permission prompt is tied to a user gesture (iOS); the SDK opens its own stream.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      return setError("Please allow microphone access to talk to Shabd Coach, then tap Start again.");
    }

    const picked = pickWords(track);
    setWords(picked);
    setResults([]);
    setTranscript([]);
    setSummary(null);
    heard.current = false;
    turns.current = 0;
    spoke.current = false;
    clearTimeout(silence.current);
    setTurnsDone(0);
    ending.current = false;
    setPhase("session");

    startSession({
      agentId: AGENT_ID,
      // WebRTC (SDK default) sessions were dropped by LiveKit while the same config worked over WebSocket.
      connectionType: "websocket",
      dynamicVariables: {
        track: TRACKS[track].label,
        language: LANGUAGES[language].label,
        word_list: buildWordList(picked, language),
      },
      overrides: {
        agent: {
          language: LANGUAGES[language].agentCode,
          // Needs Security → Overrides → "First message" enabled on the agent, else the session is dropped.
          ...(GREETING_OVERRIDE ? { firstMessage: LANGUAGES[language].greeting.replace("{track}", TRACKS[track].label) } : {}),
        },
      },
      clientTools: {
        log_result: (p: Record<string, unknown>) => {
          setResults((r) =>
            upsertResult(r, {
              word: String(p.word ?? ""),
              recalled: p.recalled === true || p.recalled === "true",
              used_correctly: p.used_correctly === true || p.used_correctly === "true",
              tip: String(p.tip ?? ""),
              turn: turns.current,
            }),
          );
          return "ok";
        },
        end_session: (p: Record<string, unknown>) => {
          setSummary(p.summary ? String(p.summary) : null);
          ending.current = true;
          setTimeout(endSession, 15000); // fallback if the goodbye came before the tool call
          return "ok";
        },
      },
      onMessage: ({ message, role }) => {
        heard.current = true;
        setTranscript((t) => [...t, { role, text: cleanSpeech(message), turn: turns.current }]);
      },
      onModeChange: ({ mode }) => {
        clearTimeout(silence.current);
        if (mode === "speaking") {
          spoke.current = true;
          return;
        }
        silence.current = setTimeout(() => {
          if (spoke.current) setTurnsDone(++turns.current);
          spoke.current = false;
          if (ending.current) endSession(); // hang up only after the goodbye has really finished
        }, TURN_END_MS);
      },
      onError: (message) => {
        console.error("[shabd-coach]", message);
        if (!heard.current) setError("Couldn't connect to the voice coach. Check your internet and try again.");
      },
      onDisconnect: (details) => {
        console.info("[shabd-coach] disconnected", JSON.stringify(details));
        if (!heard.current) setError((e) => e ?? "The voice coach is unavailable right now (it may have reached its usage limit). Please try again later.");
        setPhase((p) => (p !== "session" ? p : heard.current ? "summary" : "setup"));
      },
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      {phase === "setup" && (
        <SetupScreen
          track={track}
          language={language}
          error={error}
          onTrack={setTrack}
          onLanguage={setLanguage}
          onStart={start}
        />
      )}
      {phase === "session" && (
        <SessionScreen track={track} language={language} words={words} transcript={transcript} results={results} turnsDone={turnsDone} onEnd={endSession} />
      )}
      {phase === "summary" && (
        <SummaryScreen words={words} results={results} summary={summary} onAgain={start} onChange={() => setPhase("setup")} />
      )}
    </main>
  );
}
