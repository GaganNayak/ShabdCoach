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

// learned = meaning AND own sentence right; partial = one of the two; missed = neither.
export type WordStatus = "learned" | "partial" | "missed";
export const wordStatus = (r: WordResult): WordStatus =>
  r.recalled && r.used_correctly ? "learned" : r.recalled || r.used_correctly ? "partial" : "missed";

// Agent may call log_result twice for a word; the latest call wins.
export function upsertResult(results: WordResult[], r: WordResult): WordResult[] {
  return [...results.filter((x) => norm(x.word) !== norm(r.word)), r];
}

const NUM: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
const CUE = /\b([1-5]|one|two|three|four|five)\s*(?:of|\/)\s*(?:5|five)\b/gi; // "Word 2 of 5" / "two of five"
const cueNumber = (m: RegExpMatchArray) => NUM[m[1].toLowerCase()] ?? Number(m[1]);

// Index of the word being taught (words.length = all done).
// spokenIndex: set by the cue tracker the moment the audio says "Word N of 5" (primary signal).
// Fallback: a log or a transcript cue counts once the coach turn in which it arrived has finished.
export function currentIndex(words: Word[], results: WordResult[], transcript: TranscriptLine[], turnsDone: number, spokenIndex = 0): number {
  const finished = (turn = -1) => turn < turnsDone;
  let i = spokenIndex;
  words.forEach((w, idx) => {
    const r = findResult(results, w);
    if (r && finished(r.turn)) i = Math.max(i, idx + 1);
  });
  for (const line of transcript) {
    if (line.role !== "agent" || !finished(line.turn)) continue;
    for (const m of line.text.matchAll(CUE)) i = Math.max(i, cueNumber(m) - 1);
  }
  return Math.min(i, words.length);
}

type Alignment = { chars: string[]; char_start_times_ms: number[]; char_durations_ms: number[] };

// Agent output audio is pcm_16000 (16-bit mono) = 32 bytes per ms.
// ponytail: format hard-coded; read it from conversation metadata if the agent's output format changes.
export const pcmMs = (base64: string) => (base64.length * 3) / 4 / 32;

const alignMs = (a: Alignment) => (a.chars.length ? a.char_start_times_ms.at(-1)! + a.char_durations_ms.at(-1)! : 0);

// Calls onCue(n) when the coach's audio *plays* "Word n of 5". Audio chunks (with per-chunk character
// timings) arrive much faster than they play, so keep a playback clock: `anchor` = when audio offset 0 would
// have started playing. Re-anchor whenever playback drained (mode → listening) and audio resumes.
// Chunk length comes from the PCM when the page receives it (WebSocket), else from the alignment (WebRTC).
export function createCueTracker(onCue: (n: number) => void, now = () => performance.now()) {
  let text = "";
  let times: number[] = [];
  let audioMs = 0;
  let anchor = 0;
  let drained = true;
  let pending: Alignment | null = null;
  const scheduled = new Map<number, ReturnType<typeof setTimeout>>();
  const fired = new Set<number>();

  const commit = (a: Alignment | null, ms: number) => {
    if (drained) {
      anchor = now() - audioMs;
      drained = false;
    }
    if (a) {
      a.chars.forEach((c, i) => {
        text += c;
        times.push(audioMs + a.char_start_times_ms[i]);
      });
      for (const m of text.matchAll(CUE)) {
        const n = cueNumber(m);
        if (fired.has(n) || scheduled.has(n)) continue;
        const delay = Math.max(0, anchor + times[m.index!] - now());
        scheduled.set(n, setTimeout(() => (scheduled.delete(n), fired.add(n), onCue(n)), delay));
      }
    }
    audioMs += ms;
  };

  return {
    // The SDK calls onAudioAlignment right before onAudio for the same chunk — but only WebSocket sessions
    // deliver the audio to the page, so fall back to the alignment's own length on the next tick.
    alignment(a: Alignment) {
      pending = a;
      setTimeout(() => {
        if (pending !== a) return;
        pending = null;
        commit(a, alignMs(a));
      }, 0);
    },
    audio(base64: string) {
      const a = pending;
      pending = null;
      commit(a, pcmMs(base64));
    },
    drained() {
      drained = true;
    },
    // Learner cut in: unplayed audio is dropped, so forget cues that haven't played yet.
    interrupt() {
      scheduled.forEach(clearTimeout);
      scheduled.clear();
      text = "";
      times = [];
      pending = null;
      drained = true;
    },
  };
}

// V3 voices take delivery tags like [slow]…[/slow]; keep them out of the on-screen transcript.
export const cleanSpeech = (s: string) => s.replace(/\[\/?[a-z][a-z ]*\]/gi, "").replace(/\s{2,}/g, " ").trim();
