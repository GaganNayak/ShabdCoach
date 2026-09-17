import { TRACKS, type TrackId, type Word } from "./words.ts";

export type { TrackId, Word };
export type LanguageId = "english" | "hinglish" | "kannada";
// turn = number of finished coach speaking turns when this happened (see currentIndex)
export type WordResult = { word: string; recalled: boolean; used_correctly: boolean; tip: string; turn?: number };
export type Phase = "setup" | "session" | "summary";
export type TranscriptLine = { role: "agent" | "user"; text: string; turn?: number };

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

// The agent may send "Flexible." or " follow-up"; compare letters only.
const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
export const findResult = (results: WordResult[], w: Word) => results.find((r) => norm(r.word) === norm(w.word));

// Agent may call log_result twice for a word; the latest call wins.
export function upsertResult(results: WordResult[], r: WordResult): WordResult[] {
  return [...results.filter((x) => norm(x.word) !== norm(r.word)), r];
}

const NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };

// Index of the word being taught (words.length = all done). The agent logs a word *before* speaking its
// feedback, so a log or a "Word 2 of 5" cue only moves the card once that coach turn has finished.
export function currentIndex(words: Word[], results: WordResult[], transcript: TranscriptLine[], turnsDone: number): number {
  const finished = (turn = -1) => turn < turnsDone;
  let i = 0;
  words.forEach((w, idx) => {
    const r = findResult(results, w);
    if (r && finished(r.turn)) i = Math.max(i, idx + 1);
  });
  for (const line of transcript) {
    const m = line.role === "agent" && finished(line.turn) && line.text.match(/\b([1-5]|one|two|three|four|five)\s*(?:of|\/)\s*(?:5|five)\b/i);
    if (m) i = Math.max(i, (NUM[m[1].toLowerCase()] ?? Number(m[1])) - 1);
  }
  return Math.min(i, words.length);
}

// V3 voices take delivery tags like [slow]…[/slow]; keep them out of the on-screen transcript.
export const cleanSpeech = (s: string) => s.replace(/\[\/?[a-z][a-z ]*\]/gi, "").replace(/\s{2,}/g, " ").trim();
