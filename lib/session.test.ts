// Run: npm test  (Node 24 runs .ts directly via type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { TRACKS } from "./words.ts";
import { buildWordList, pickWords, upsertResult } from "./session.ts";

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

test("upsertResult replaces a repeated word", () => {
  const a = { word: "refund", recalled: false, used_correctly: false, tip: "a" };
  const b = { word: "Refund ", recalled: true, used_correctly: true, tip: "b" };
  assert.deepEqual(upsertResult([a], b), [b]);
});
