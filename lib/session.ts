import { TRACKS, type TrackId, type Word } from "./words.ts";

export type { TrackId, Word };
export type LanguageId = "english" | "hinglish" | "kannada";
export type WordResult = { word: string; recalled: boolean; used_correctly: boolean; tip: string };
export type Phase = "setup" | "session" | "summary";
export type TranscriptLine = { role: "agent" | "user"; text: string };

// agentCode → overrides.agent.language; label → {{language}}; field → which meaning goes in {{word_list}}
// greeting → overrides.agent.firstMessage ({track} replaced). Without it, the agent's auto-translated Hindi greeting is formal, not Hinglish.
export const LANGUAGES = {
  english: {
    label: "English", native: "English", agentCode: "en", field: "en",
    greeting: "Hi! I'm Shabd Coach. Today we'll learn 5 useful English words for {track} jobs. Ready to start?",
  },
  hinglish: {
    label: "Hinglish", native: "Hinglish", agentCode: "hi", field: "hi",
    greeting: "नमस्ते! मैं Shabd Coach हूँ। आज हम {track} jobs के लिए 5 useful English words सीखेंगे। Ready हैं?",
  },
  kannada: {
    label: "Kannada", native: "ಕನ್ನಡ", agentCode: "kn", field: "kn", beta: true, // voice quality not yet natural (test 1.6a)
    greeting: "ನಮಸ್ಕಾರ! ನಾನು Shabd Coach. ಇವತ್ತು ನಾವು {track} jobs ಗೆ 5 useful English words ಕಲಿಯೋಣ. Ready ನಾ?",
  },
} as const satisfies Record<LanguageId, { label: string; native: string; agentCode: string; field: keyof Word; greeting: string; beta?: boolean }>;

export const WORDS_PER_SESSION = 5;

export function pickWords(track: TrackId, n = WORDS_PER_SESSION): Word[] {
  const words = [...TRACKS[track].words];
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return words.slice(0, n);
}

// Single line, so it survives single-line dashboard test inputs: `1. resolve — to solve a problem (Hinglish: ...) — e.g. "..." | 2. ...`
export function buildWordList(words: Word[], lang: LanguageId): string {
  const { field, label } = LANGUAGES[lang];
  return words
    .map((w, i) => {
      const local = field === "en" ? "" : ` (${label}: ${w[field]})`;
      return `${i + 1}. ${w.word} — ${w.en}${local} — e.g. "${w.example}"`;
    })
    .join(" | ");
}

// Agent may call log_result twice for a word; the latest call wins.
export function upsertResult(results: WordResult[], r: WordResult): WordResult[] {
  const key = r.word.trim().toLowerCase();
  return [...results.filter((x) => x.word.trim().toLowerCase() !== key), r];
}
