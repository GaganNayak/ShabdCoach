// Run: npm test  (Node 24 runs .ts directly via type stripping)
import { mock, test } from "node:test";
import assert from "node:assert/strict";
import { TRACKS } from "./words.ts";
import { LANGUAGES, buildWordList, cleanSpeech, createCueTracker, currentIndex, findResult, pcmMs, pickWords, upsertResult } from "./session.ts";

test("word bank: 10 complete words per track", () => {
  for (const [id, t] of Object.entries(TRACKS)) {
    assert.equal(t.words.length, 10, id);
    for (const w of t.words) assert.ok(w.word && w.en && w.hi && w.kn && w.example, w.word);
  }
});

test("pickWords returns n unique words from the track", () => {
  const picked = pickWords("sales", 5);
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked.map((w) => w.word)).size, 5);
  assert.ok(picked.every((w) => TRACKS.sales.words.includes(w)));
});

test("buildWordList uses the chosen language's meaning", () => {
  const [w] = TRACKS.support.words;
  assert.equal(buildWordList([w], "english"), `1. ${w.word} — ${w.en} — e.g. "${w.example}"`);
  assert.ok(buildWordList([w], "hinglish").includes(`(Hinglish: ${w.hi})`));
  assert.ok(buildWordList([w], "kannada").includes(`(Kannada: ${w.kn})`));
  assert.ok(!buildWordList(TRACKS.support.words.slice(0, 5), "english").includes("\n"), "single line");
});

test("every language greeting has a {track} slot", () => {
  for (const l of Object.values(LANGUAGES)) assert.ok(l.greeting.includes("{track}"), l.label);
});

test("upsertResult replaces a repeated word", () => {
  const a = { word: "refund", recalled: false, used_correctly: false, tip: "a" };
  const b = { word: "Refund ", recalled: true, used_correctly: true, tip: "b" };
  assert.deepEqual(upsertResult([a], b), [b]);
  assert.deepEqual(upsertResult([a], { ...b, word: "Refund." }), [{ ...b, word: "Refund." }]);
});

test("findResult ignores case and punctuation", () => {
  const w = TRACKS.sales.words.find((x) => x.word === "follow up")!;
  assert.ok(findResult([{ word: "Follow-up.", recalled: false, used_correctly: false, tip: "" }], w));
});

test("currentIndex moves only after the coach turn that followed the log/cue", () => {
  const ws = TRACKS.office.words.slice(0, 5);
  const r = (word: string, turn: number) => ({ word, recalled: false, used_correctly: false, tip: "", turn });
  const agent = (text: string, turn: number) => ({ role: "agent" as const, text, turn });
  assert.equal(currentIndex(ws, [], [], 0), 0);
  assert.equal(currentIndex(ws, [r(ws[0].word, 3)], [], 3), 0, "logged, feedback not spoken yet");
  assert.equal(currentIndex(ws, [r(ws[0].word, 3)], [], 4), 1, "feedback turn finished");
  assert.equal(currentIndex(ws, [], [agent("Word two of five hai, [slow] patience", 2)], 2), 0, "cue still being spoken");
  assert.equal(currentIndex(ws, [], [agent("Word two of five hai, [slow] patience", 2)], 3), 1, "number words");
  assert.equal(currentIndex(ws, [], [agent("Word 4 of 5: agenda.", 1)], 2), 3);
  assert.equal(currentIndex(ws, [], [agent("We handled 15 of 20 calls.", 0)], 1), 0);
  assert.equal(currentIndex(ws, [], [{ role: "user", text: "5 of 5", turn: 0 }], 1), 0);
  assert.equal(currentIndex(ws, ws.map((w) => r(w.word, 0)), [], 1), 5);
  assert.equal(currentIndex(ws, [], [], 0, 2), 2, "spoken cue wins immediately");
});

test("cleanSpeech strips voice delivery tags", () => {
  assert.equal(cleanSpeech("Word two of five, [slow] patience. [/slow] Patience ka matlab"), "Word two of five, patience. Patience ka matlab");
});

test("cue tracker fires when the audio *plays* 'Word 2 of 5', across chunks and playback gaps", () => {
  mock.timers.enable({ apis: ["setTimeout"] });
  let clock = 0;
  const tick = (ms: number) => ((clock += ms), mock.timers.tick(ms));
  const cues: number[] = [];
  const t = createCueTracker((n) => cues.push(n), () => clock);
  const chunk = (s: string, stepMs: number) => ({ chars: [...s], char_start_times_ms: [...s].map((_, i) => i * stepMs), char_durations_ms: [...s].map(() => stepMs) });
  const audio = (ms: number) => "A".repeat((ms * 32 * 4) / 3); // base64 length for `ms` of pcm_16000

  assert.equal(Math.round(pcmMs(audio(500))), 500);
  // Feedback chunk: 1000 ms of audio, arrives at t=0.
  t.alignment(chunk("Nice! Ready? ", 10));
  t.audio(audio(1000));
  // Next chunk arrives 50 ms later (long before it plays): "Word 2" at offset 1000 ms, " of 5" split into another chunk.
  tick(50);
  t.alignment(chunk("Word 2", 10));
  t.audio(audio(300));
  t.alignment(chunk(" of 5: refund", 10));
  t.audio(audio(700));
  // "2" is char 5 of the chunk that starts at 1000 ms → plays at 1050 ms.
  tick(990); // clock 1040
  assert.deepEqual(cues, [], "not yet played");
  tick(20); // clock 1060
  assert.deepEqual(cues, [2]);

  // Playback drains (tool call gap), then audio resumes 2 s later: re-anchor to the resume time.
  t.drained();
  tick(2000); // clock 3060, audioMs = 2000
  t.alignment(chunk("Great. Word 3 of 5", 10)); // "3" at char 12 → 120 ms after resume
  t.audio(audio(500));
  tick(110);
  assert.deepEqual(cues, [2]);
  tick(20);
  assert.deepEqual(cues, [2, 3]);

  // Interruption before "Word 4" plays → dropped.
  t.alignment(chunk("Word 4 of 5", 100));
  t.audio(audio(1000));
  t.interrupt();
  tick(5000);
  assert.deepEqual(cues, [2, 3]);
  mock.timers.reset();
});
