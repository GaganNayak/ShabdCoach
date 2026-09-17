// Run: npm test  (Node 24 runs .ts directly via type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { TRACKS } from "./words.ts";
import { LANGUAGES, buildWordList, cleanSpeech, currentIndex, findResult, pickWords, upsertResult } from "./session.ts";

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
});

test("cleanSpeech strips voice delivery tags", () => {
  assert.equal(cleanSpeech("Word two of five, [slow] patience. [/slow] Patience ka matlab"), "Word two of five, patience. Patience ka matlab");
});
