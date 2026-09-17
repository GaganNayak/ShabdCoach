# BUILDLOG — Shabd Coach

Running log of what was built, for handing off to any AI tool or developer.
**Newest entry at the top.** Each entry: what was done, files touched, how it was verified, the next step.

---

## ▶ Current state (keep this block updated)
- **Phase:** 0–4 done (except 2.4 Kannada review) · **Phase 5 in progress** (iPhone Safari ✅)
- **Next step (user):** 5.1b re-test on prod after the WebRTC switch: Kannada (smooth?) + Hinglish (card sync at "Word 2 of 5"?). Then 5.2 Android, 5.4 airplane mode + WhatsApp browser.
- **Connection:** `connectionType: "webrtc"` (jitter buffer; WebSocket PCM underran — 5.1a). Per-language greeting override ON.
- **ElevenLabs plan:** Starter (75 agent min/mo). Save minutes: avoid headless voice runs; handshake-only WebSocket checks cost ~0.
- **Test on prod, not localhost** (localhost isn't allowlisted).
- **Repo:** https://github.com/GaganNayak/ShabdCoach (branch `main`; user git has `pull.rebase=true`, so commit before pulling)
- **Live:** https://shabd-coach.vercel.app (auto-deploys on push; env `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`, type Config)
- **Agent:** ElevenLabs "Shabd Coach", ID `agent_7301m2q5ec0xf7m81qswyy0kdbpe`, **prompt v7** (+ updated `log_result` / `words_learned` descriptions), TTS V3 Conversational, allowlist `shabd-coach.vercel.app`, overrides: language + first message
- **Run locally:** `npm install` → `.env.local` with the agent ID → `npm run dev` (UI only; voice needs the prod domain)
- **Checks:** `npm run build` → `npx tsc --noEmit` → `npm run lint` → `npm test`, chained with `&&`
- **Gotcha:** `.next/` goes stale (iCloud `* 2.*` duplicates; deleted routes still referenced in `.next/dev/types`) and breaks `tsc` → `rm -rf .next` and rebuild

---

## 2026-09-17 — Phase 5.1: Kannada choppy → WebRTC (5.1a)
**Symptom:** Kannada session: card meanings, card sync and scoring all fine, but the voice was choppy and then went silent. Hinglish on the same phone/network was smooth; Kannada in the ElevenLabs dashboard was smooth.
**Diagnosis (raw WebSocket probes):**
- A long **pure Kannada** greeting was spoken in full (11.6 s, all 128 chars) → the voice model is not broken.
- Timing probe (`rate.mjs`): audio arrives barely ahead of playback — pure Kannada **+30 ms**, Hindi **+34 ms**, Kannada mixed with English **−9 ms (underrun)**.
- ⇒ On the WebSocket transport the SDK plays raw PCM as it arrives with **no jitter buffer**, so a slightly slower-generating language (or any network wobble) stalls playback. Hinglish only survived by ~30 ms of margin.
- Several probe rounds returned **zero audio in every language** for a few minutes, then recovered — the same account-side flakiness seen in 4.7b. That, not WebRTC, is what made WebRTC look broken then.
**Fix:**
- `connectionType: "webrtc"` again (LiveKit has a jitter buffer).
- WebRTC delivers audio via LiveKit tracks, so `onAudio` (raw PCM) doesn't fire. `createCueTracker` now commits a chunk on the next tick using the **alignment's own length** when no PCM arrives, and still uses `pcmMs` when it does. Test added for the alignment-only path (10/10 ✅).
**Also from this session:** 5.4 deny-mic ✅ and End-early ✅; Kannada card meanings, card sync, ½/✓ and summary ✅.
**Watch:** if sessions get dropped again after the WebRTC switch, check the ElevenLabs status/usage before assuming a code bug.

---

## 2026-09-17 — Phase 4 ✅ + 5.2 iPhone Safari ✅
- The user published prompt v7 + the new `log_result` tool description + `words_learned` description, and tested on **iPhone Safari** (deployed URL):
  - Safari mic prompt on Start ✅
  - Greeting audio heard ✅ (the iOS audio-gesture risk did not materialise, even with `getUserMedia` awaited before `startSession`)
  - Replies transcribed ✅
  - Right meaning + wrong sentence → no dot until after the sentence, then ½ / Almost there ✅; both right → ✓ / Learned ✅
  - Card switches exactly at "Word 2 of 5" ✅
  - Layout OK ✅, screen stays on ✅ (cause not verified; SDK has a `useWakeLock` option we don't set), End → summary ✅
- **Phase 4 closed.** Remaining Phase 5: Kannada session (5.1), Android Chrome (5.2), edge cases (5.4).

---

## 2026-09-17 — Phase 4.21 ✅ → 4.22 log timing + 3-state scoring
- The user tested v6 + the audio-synced card: the "yes" step is gone ✅; the card switches right as "Word 2 of 5" is spoken ✅.
- New bug: after a **correct meaning** (step 2), the ✓ appeared immediately, before the learner made a sentence (step 3). Cause: the agent called `log_result` after recall; the prompt didn't pin *when* to log.
- **Prompt v7** (`agent-prompt.md`):
  - RECALL: "Do NOT call any tool here".
  - USE: wait for the sentence (or a skip).
  - LOG: "Only now, after the sentence attempt… once… with both results… Never call it before step 3 is answered".
  - Tools: "only after the learner has attempted the sentence".
  - `log_result` tool description: "Call only after the learner has attempted their own sentence… (never right after the meaning)".
  - `end_session.words_learned`: BOTH meaning AND sentence correct.
- **✓ rule changed (user choice: 3 states).** Before: ✓ if recalled OR used.
  - `lib/session.ts` `wordStatus`: learned (both) / partial (one) / missed (none).
  - `SessionScreen`: dots ✓ green / "½" amber / ✗ red; the card uses exported `StatusBadge` (Learned ✓ / Almost there / Keep practising).
  - `SummaryScreen`: score = learned only, "· N almost there" subline, per-word `StatusBadge` next to the Meaning/Used marks; the row wraps (`flex-wrap`) for long words.
- Verified: tests 10/10 ✅ (+ wordStatus) · build ✅ tsc ✅ lint ✅. Summary layout checked at 375 px with a temporary preview route (deleted), using the longest words (inconvenience, professional, achievement): no overflow, clean wrap.
- Process note: the code commit 6748899 went in before this doc update, because a stale `.next/dev/types` reference to the deleted preview route failed `tsc` in the chain. Clean `.next` → all checks pass.

---

## 2026-09-17 — Phase 4.19 → 4.20 audio-synced word card + prompt v6
- User re-check of the debounce: the card stays put during feedback ✅. But the v5 "Ready for word N?" → "yes" step **feels irritating every word**.
- Goal: no pause, and the card switches exactly when "Word N of 5" is heard.
- **Evidence** (raw WebSocket probe, first_message override "Great answer! Ready? Word 2 of 5: refund…"):
  - `audio` events carry `alignment {chars, char_start_times_ms, char_durations_ms}`; times **restart at 0 per chunk**; "Word 2" and " of 5:" came in **different chunks**.
  - All audio for ~4 s of speech arrived within ~1.4 s; `agent_response` text arrived only at the end.
  - Output format `pcm_16000`.
  - SDK source: `VoiceConversation.handleAudio` calls `onAudioAlignment` then `onAudio` for the same event; mode → "listening" when the playback worklet reports finished.
- **Implementation**
  - `lib/session.ts` `createCueTracker(onCue, now)`: `alignment()` stashes a chunk; `audio(b64)` appends its chars with absolute offsets (`audioMs` + char start), scans for `CUE` (`1-5|one…five` `of|/` `5|five`), and schedules `onCue(n)` at `anchor + offset`. `anchor = now − audioMs`, reset when audio resumes after `drained()` (mode → listening). `interrupt()` cancels unplayed cues. `pcmMs(b64) = len·3/4/32` (pcm_16000). `ponytail:` format hard-coded.
  - `currentIndex(..., spokenIndex)`: spokenIndex is the primary signal; turn-based log/transcript rules remain as fallback.
  - `app/page.tsx`: `onAudioAlignment`, `onAudio`, `onInterruption` → tracker; `onModeChange` listening → `drained()`; `spokenIndex` state → SessionScreen.
  - Prompt **v6**: removed PAUSE/"yes" steps; step 6 NEXT = in the same turn, "Word N of 5" (English, digits).
- Tests 9/9 ✅: a fake-timer playback timeline (cue split across chunks fires at play time, not arrival; re-anchor after a 2 s drain; interrupted cue dropped) + `pcmMs`. build ✅ tsc ✅ lint ✅.
- Not verified live yet (needs the user's voice session).

---

## 2026-09-17 — Phase 4.17 → 4.18 turn-end debounce
- The user tested prompt v5: the coach pauses with "Ready for word 2?" ✅ and the card switches before the next word is explained ✅, but it **switched during the previous word's feedback**. The extra-yes pacing wasn't judged yet.
- Diagnosis (inferred, not measured): `onModeChange` flips to "listening" during short audio gaps inside one reply (e.g. while the agent issues `log_result`), so `turnsDone` incremented mid-feedback. The same flicker could also have triggered the `end_session` auto hang-up mid-goodbye.
- Fix (`app/page.tsx`): a turn is finished only after `TURN_END_MS = 1200` ms of continuous "listening" (setTimeout cancelled by "speaking"). `spoke` ref ensures only real coach turns count. Auto hang-up moved into the same debounced callback.
- **Calibration knob:** if the card still switches early, raise `TURN_END_MS` (e.g. 1800). If switching feels laggy, lower it.
- Verified: build ✅ tsc ✅ lint ✅ tests 8/8 ✅ (debounce itself not unit-tested; it's timer glue).

---

## 2026-09-17 — Phase 4.15 → prompt v5 (separate feedback and next-word turns)
- The user's re-check of v3: the card now switches when the coach stops, but the coach says **feedback + "Word N of 5" + the explanation in one response**, so the card only changes after the new word has already been explained.
- The user proposed splitting feedback and the next word. Implemented as **prompt v5** (no code change):
  - Lesson step 5: call `log_result` *before* giving feedback.
  - New step 6 PAUSE: end the feedback turn with "Ready for word N?" / "Ready for the revision quiz?" and wait.
  - New step 7: on any yes (haan / ok / ಹೌದು), start "Word N of 5" (digits).
- Resulting timeline: log → feedback turn (card shows ✓/✗ + tip) → turn ends → card switches → learner says yes → the coach teaches the word already on screen. Cost: one short learner turn per word.
- Rejected alternative: syncing to audio via `onAudioAlignment` (precise but more code and fragile).

---

## 2026-09-17 — Phase 4.13 re-check → 4.14 card timing v3
- User screenshot: orb "Listening — your turn", dot 1 ✗, the card **still on word 1** ("complaint", Keep practising + tip), while the transcript already had the coach teaching word 2: `…Word two of five है, [slow] patience. [/slow] Patience का मतलब…`.
- Causes:
  1. The cue regex only matched digits; the coach said "two of five".
  2. The "learner spoke after the log" fallback hadn't fired yet (the learner's turn had just started).
  3. V3 expressive voice tags (`[slow]`) are included in the agent transcript text.
- Fix:
  - `app/page.tsx` counts **finished coach turns** (`onModeChange` speaking → listening) in `turns` ref + `turnsDone` state. Each log and transcript line stores `turn` at arrival.
  - `currentIndex(..., turnsDone)`: a logged word or an agent "N of 5" cue moves the card only when its `turn < turnsDone`, i.e. after the coach finished the turn in which it arrived. The regex accepts `1-5|one…five`, `of|/`, `5|five`. The Hindi "में से" variant was dropped (wrong word order for "पाँच में से दो").
  - `cleanSpeech` strips `[tag]` / `[/tag]` from transcript lines.
  - Tests 8/8 ✅ (turn gating, number words, "15 of 20", user lines ignored, all-done, tag stripping) · build ✅ tsc ✅ lint ✅.
- This replaces 4.10 (mode gating) and 4.12 (user-spoke fallback); both were based on wrong timing assumptions.

---

## 2026-09-17 — Phase 4.11 re-check → 4.12 card timing v2
- The user's re-check: the card **still** switched to the next word during feedback, for both correct and wrong answers.
- Corrected diagnosis: the agent emits `log_result` **before** it starts speaking the feedback, so `mode` is still "listening" when the result arrives. Gating on `mode !== "speaking"` (4.10) was based on a wrong assumption and is removed.
- New rule (`lib/session.ts` `currentIndex`): the card index moves past a logged word only when
  1. the agent's transcript says "N of 5" (regex, unchanged), or
  2. a **user** transcript line exists after the log (`WordResult.at` = transcript length at log time, set in `page.tsx` from a `lines` ref counted in `onMessage`).
- Card UX while the feedback plays: the badge changes from "Now learning" to **Learned ✓** / **Keep practising**, and the tip shows (💡). Dots still update at once.
- Tests updated: a log alone doesn't advance; advances after a later user line; a user line before the log doesn't count; all-done case. 7/7 ✅ · build ✅ · tsc ✅ · lint ✅.
- Known limit: if the agent's feedback and "Word N of 5" arrive as **one** transcript message, the card switches when that message arrives (≈ start of that reply). If that still feels early, the next option is `onAudioAlignment` to switch when the audio reaches "Word N".

---

## 2026-09-17 — Phase 4.9 re-test → 4.10 card timing
- The user pasted prompt v4 + published. Live test with wrong answers: ✗ dots ✅, card advances ✅, summary shows ✗ + tips ✅ → **the wrong-answer logging bug is fixed**.
- New issue: the word card switched to the next word **before the coach finished speaking the feedback**. Cause: the agent emits `log_result` at the start of its reply (Wait for response = off), so results update while the feedback audio is still playing.
- Fix (`components/SessionScreen.tsx`): a separate `shown` index for the card, synced to `currentIndex` only when `mode !== "speaking"` (the "adjust state during render" pattern, no effect). Dots and "–" still use the live index. The current-word ring follows `shown`.
- Verified: build ✅ tsc ✅ lint ✅ tests 7/7 ✅. Not voice-tested (saves minutes) → user check 4.11.

---

## 2026-09-17 — Phase 4.7 live test → 4.8 fixes
**User's live Hinglish session (prod, WebSocket):** end-to-end flow worked, auto hang-up + summary ✅, experience "satisfying".
**Bugs:**
1. ✓ dots appeared for correct answers, but **no ✗ for wrong answers**.
2. After a deliberately wrong answer, the **word card stayed on word 3** (the conversation itself continued to the end).
**Diagnosis:** the page only advances on `log_result`, so no ✗ + stuck card = no matching `log_result` for wrong answers. Likely the agent skipped the call when the answer was wrong (the prompt didn't say it's mandatory), and/or the logged word text didn't match exactly. Not verified in ElevenLabs call history.
**Fixes**
- `lib/session.ts`:
  - `findResult` / `upsertResult` compare letters only (case, spaces, punctuation ignored).
  - New `currentIndex(words, results, transcript)`: max of (last logged word + 1) and the latest agent line matching `\b(\d) (of|/|में से) \d\b` → 0-based index.
  - Tests: 7 (+ punctuation match, index from logs, index from "Word 4 of 5", Hindi "में से", ignores user lines and "15 of 20").
- `SessionScreen`: uses `currentIndex`; words passed without a log show a grey "–" dot; the current word ring follows the index.
- `SummaryScreen`: uses `findResult`.
- `agent-prompt.md` **prompt v4**: lesson step 5 = ALWAYS call `log_result` for every word incl. wrong/skipped (false); Tools section: exactly once per word, 5 calls total; `word` param description: exact list text, no punctuation. **The user must paste + publish.**

**Verified:** build ✅ · tsc ✅ · lint ✅ · tests 7/7 ✅. UI change not voice-tested (saves minutes); covered by the `currentIndex` tests.

---

## 2026-09-17 — Phase 4.7b: WebRTC → WebSocket fix
- After the Starter upgrade, the dashboard "Test AI agent" worked, but the page still failed. Prod headless run: `{"reason":"error","message":"LiveKit connection state changed to disconnected"}` plus LiveKit DataChannel "User-Initiated Abort" errors.
- Diagnosis with a raw WebSocket script (`ws`, `Origin: https://shabd-coach.vercel.app`, handshake only, closed after `conversation_initiation_metadata`):
  - no dynamic vars → close 1008 "Missing required dynamic variables in first message: {'language', 'track'}" (expected)
  - dynamic vars ✅ · + `language: hi` ✅ · + `language: en` ✅ · + `first_message` ✅
  - ⇒ the config, allowlist, overrides and quota are all fine; the **WebRTC (LiveKit) transport** was failing.
- Fix: `connectionType: "websocket"` in `startSession`. Also turned on `GREETING_OVERRIDE` (first-message override verified allowed).
- Verified on prod (1b367a1): connected; the Hinglish greeting "नमस्ते! मैं Shabd Coach हूँ। आज हम Interview basics jobs के लिए 5 useful English words सीखेंगे। Ready हैं?" arrived; orb "Coach is speaking"; word card rendered.
- Unknown: why WebRTC failed (it worked once earlier). WebSocket is fine for this use; revisit only if audio quality or echo becomes an issue on phones (WebRTC has built-in echo cancellation).

---

## 2026-09-17 — Phase 4 blocker: quota exceeded
- The user found the dashboard error for the dropped sessions: `[quota_exceeded] You've run out of credits. Add credits or upgrade your plan to start a new conversation.`
- ElevenAgents pricing (elevenlabs.io/pricing/agents, checked 2026-09-17): billed by **call minutes**, not the shared credit pool. Free 15 min/mo (4 concurrent) · Starter $6 → 75 min (6) · Creator $22 → 275 min (10) · Pro $99 → 1,238 min (20). $0.08/min.
- Budget: a full session is ~5–6 min, so Starter ≈ 12 sessions (testing + reviewers).
- Code: the setup-screen message for "dropped before any message" now mentions a possible usage limit (the SDK only reports `reason: agent`, so we can't detect quota exactly).
- Implication for submission (Phase 7): the demo video matters as a backup if minutes run out while reviewers try the link.

---

## 2026-09-17 — Phase 4: voice wiring (code done, live test blocked)
**Did**
- Installed `@elevenlabs/react@1.15.2` (+ `@elevenlabs/client@1.25.0`). Read its types: the API is `ConversationProvider` + granular hooks, not the single `useConversation` from the older docs.
- `app/page.tsx`: `<ConversationProvider>` wraps `App`. **Start tap** → `getUserMedia` (then stops the tracks; the SDK opens its own) → `pickWords` → `startSession({ agentId, dynamicVariables {track, language, word_list}, overrides.agent.language, clientTools {log_result, end_session}, onMessage, onModeChange, onError, onDisconnect })`.
  - Client tools are passed in `startSession`, not registered via `useConversationClientTool` in `SessionScreen`: the provider builds the tool list **at start time**, and `SessionScreen` mounts after the tap.
  - Booleans are coerced (`true` or `"true"`) in case the LLM sends strings.
  - `end_session` → store the summary and set `ending`; the next `onModeChange → listening` (goodbye finished) calls `endSession()`; 15 s `setTimeout` fallback.
  - `onDisconnect` → summary if any message was received, else back to setup with "The coach couldn't start right now…". `onError` before any message → "Couldn't connect…". Errors are logged as `[shabd-coach]`.
- `components/SessionScreen.tsx`: mock removed; props now `{track, language, words, transcript, results, onEnd}`; orb from `useConversationStatus` + `useConversationMode`; "All 5 words done. Revision quiz time!" card after word 5; empty transcript hint.
- `components/SetupScreen.tsx`: `error` prop → alert above Start (mic denied, unsupported browser, missing agent ID, connect failure).
- `lib/session.ts`: `LANGUAGES[*].greeting` (English / Devanagari Hinglish / Kanglish with a `{track}` slot); test added (5/5). `page.tsx` sends it as `overrides.agent.firstMessage` only if `GREETING_OVERRIDE = true` (currently **false**).
  - Why: prod run 1 showed the default greeting for `hi` was formal Hindi ("मैं Hinglish में समझाऊँगा"). The Kannada greeting text needs a native check.

**Verified**
- tsc ✅ · lint ✅ · tests 5/5 ✅ · build ✅
- Localhost + fake mic: token 200, LiveKit connects, then the agent closes. Same with overrides removed → cause = **allowlist** (localhost not allowed). Error UX shows correctly.
- **Prod (db94e76) + fake mic: ✅ worked.** Greeting arrived (Devanagari), the fake mic was transcribed as "हाँ।", orb "Coach is speaking", word card + progress rendered.
- **Prod after that: ❌ every session is closed by the agent before any message** (with the greeting override, without it, and in English). So it's **not** caused by the overrides. Stopped testing to save credits. Suspects: account/agent side (credits or usage cap, concurrent session limit after several rapid headless runs, agent unpublished or edited, override permissions).

**Mistakes to avoid (for the next person)**
- A command chain with `;` let a commit through while `tsc` failed (6001a79 didn't build on Vercel; fixed in 0d55c00). Run checks with `&&` only.
- `useEffect(() => expr)` must not return a value (see Phase 3).

---

## 2026-09-17 — Phase 3: UI screens (mock data)
**Did**
- shadcn components added: `card`, `badge`, `toggle-group` (+ `toggle`), `scroll-area`, `progress`.
- `app/layout.tsx`: real title/description; added **Noto Sans Kannada** (`--font-kannada`) because Geist has no Kannada glyphs. Fixed the circular `--font-sans: var(--font-sans)` left by shadcn init in `globals.css`. Brand colour: `--primary`/`--ring` = green `oklch(0.52 0.12 165)`.
- `app/page.tsx` ("use client"): phase state machine `setup → session → summary`; holds track (default interview), language (default hinglish), words (`pickWords` on start), results, summary.
- `components/SetupScreen.tsx`: 4 track cards (radio semantics), language `ToggleGroup` (English / Hinglish / ಕನ್ನಡ + **Beta** badge), "Start speaking".
- `components/SessionScreen.tsx`: header + **End**, speaking/listening/connecting **orb**, 5-dot progress (✓/✗), **current-word card** (word, English meaning, meaning in the chosen language, example), which doubles as on-screen Kannada support. Transcript with auto-scroll. **Mock:** a "Simulate next word (mock)" button fakes transcript + `log_result` (marked `ponytail:`); Phase 4 replaces it with `useConversation`.
- `components/SummaryScreen.tsx`: score X/5 + progress bar, the agent's summary sentence, per-word Meaning/Used marks + tip ("Not reached" when missing), "Practice 5 new words", "Change job area or language".
- "Learned" = `recalled || used_correctly` (same rule as the `end_session` prompt).

**Verified**
- `tsc` ✅ · lint ✅ · `npm test` 4/4 ✅ · build ✅
- Headless Chrome (puppeteer-core scratch script, not in repo) at 375×812 and 1280×800: full flow, End-early → "Not reached", Change → setup. No console errors, no horizontal overflow.
- Bug caught and fixed: `useEffect(() => el.scrollIntoView(...))` returned a value, so React crashed with "destroy is not a function". Effects now use braces.

**Notes for next person**
- The mock button is live on Vercel until Phase 4.
- Keep `SessionScreen`'s `onFinish(results, summary | null)` contract; `null` = ended early/disconnected.

---

## 2026-09-17 — Phase 1.6c passed + 1.7 agent ID
- The user re-tested prompt v3: "everything is right" (words from the list, in order; off-topic refused).
- Agent ID: `agent_7301m2q5ec0xf7m81qswyy0kdbpe` (public by design, ARCHITECTURE §7). Written to `.env.local` (git-ignored, confirmed with `git check-ignore`).
- **Pending (user):** Vercel → Settings → Environment Variables → `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` for all environments. Confirm the agent is **published** (1.6b).
- Vercel shows a warning on `NEXT_PUBLIC_` ("Remove the public framework prefix… or change the variable to Config"). Decision: **keep the prefix and set the type to Config**. The browser needs the ID to connect to the public agent; it isn't a secret (protection = allowlist + origin check + duration cap). Never put the ElevenLabs API key in a `NEXT_PUBLIC_` var.
- Phase 1 is effectively complete. Remaining user tasks: 2.4 (Kannada word review), 4.0 (clear allowlist during local voice testing).

---

## 2026-09-17 — Phase 1.6a re-test → prompt v3
**Re-test of v2 (user):**
- Hinglish: said "Word N of 5" and kept order ✅, but **the words were not from the list**. Diagnosis: `{{word_list}}` most likely didn't reach the agent (multi-line paste into the dashboard's test value field), so the model invented 5 words. LLM = a Flash/mini model.
- Off-topic: the user asked "Who is the president of India?" and the agent answered. The user wants strict scope.
- Kannada (Kanglish): pronunciation better, wording "better but not satisfying". **User decision: keep spoken Kannada, label it Beta.**

**Changes**
- `lib/session.ts`: `buildWordList` now joins with ` | ` (single line). Added `beta: true` on `LANGUAGES.kannada`. Test asserts single line. `npm test` 4/4 ✅, `tsc` ✅.
- `agent-prompt.md` → **prompt v3**:
  - New guard: if the word list is empty or a placeholder → "today's lesson did not load", no invented words.
  - New "Scope (strict)" section: refuse all non-lesson questions even if known; lesson-word questions stay in scope. Removed the old "answer in one sentence" rule.
  - Test values regenerated as one line.
- ARCHITECTURE §5.3 (word_list format) and §6 (Kannada Beta, empty list, off-topic) updated.

**Next:** 1.6c — the user pastes prompt v3 and re-tests Hinglish with the one-line word_list plus an off-topic question. If words still don't match the list → try a larger LLM, or check the dynamic variable defaults in the agent settings.

---

## 2026-09-17 — Phase 1.5 results + 1.6 prompt v2
**Test results (user, dashboard):**
| | English | Hinglish | Kannada |
|---|---|---|---|
| Short turns | ✅ | ✅ | ✅ |
| Loop order | ✅ | ✅ | ✅ |
| Stayed on list | ❌ | ❌ | ❌ |
| log_result fired | ✅ | ✅ | ✅ |
| Latency | good | good | good |
| Language quality | clear | good | **not natural** (wording + pronunciation) |
- Off-list behaviour: **added extra words mid-lesson** and **changed order / skipped words**.
- Tool param values weren't visible in the dashboard; we'll verify them in the page (Phase 4).

**Prompt v2 changes (`agent-prompt.md`):**
- New "Word list rules" section: exactly 5 words, strict order, a "Word N of 5" marker, never teach other vocabulary, no word 6.
- "Tools" section: tools are silent, and the agent ignores tool errors (the dashboard shows "not defined on client").
- Kannada → **Kanglish** (the user chose to try this before falling back): everyday Kannada + English work words, **Kannada script only** (romanized Kannada is likely to be mispronounced by TTS).
- Revision quiz is clearly announced, so it isn't confused with reordering.
- Dashboard tip: set a separate voice for Kannada under Additional languages.

**Next:** 1.6a — the user re-pastes prompt v2 and re-tests Hinglish (order) + Kannada (Kanglish). If Kannada is still poor → text-card fallback (agent speaks simple English; UI shows the Kannada meaning).

---

## 2026-09-17 — Phase 1 prep (guide given to the user)
- Checked the ElevenLabs docs before writing the dashboard guide:
  - Agents can use all languages of **v3 Conversational + Flash v2.5**. Adding "Additional languages" switches the agent to the multilingual model.
  - Client tools: Tools → Add tool → type **Client** (name, description, params, "Wait for response").
  - Allowlist: Security tab, **exact hostname match**, up to 10 hosts → use `localhost:3000`, not `localhost`.
- `agent-prompt.md`: added dashboard **test values** (track/language/word_list) and fixed the allowlist host.
- Tool params: Value Type = **LLM Prompt** for all; clearer param descriptions added to `agent-prompt.md` (user asked during 1.2).
- **1.5 testing:** the dashboard shows "Client tool with name log_result is not defined on client". This is expected (client tools are implemented by the page in 4.5) and confirms the tool fires. Watching whether the agent mentions the error to the learner; if so, add a prompt rule in 1.6.
- **Publishing:** ElevenLabs agents have draft/publish versioning ("Nothing reaches the live agent until you publish"). Testing the draft in the dashboard is fine; publish before 1.7 and after every prompt change (new task 1.6b). Unverified: whether the dashboard test runs the draft or the published version.
- **Allowlist:** the dashboard rejects `localhost:3000` ("Hostname must consist of a domain and an optional port"). Decision: allowlist = `shabd-coach.vercel.app` only; clear it temporarily during local voice testing (new task 4.0). Rejected `lvh.me:3000`: it passes validation, but http on a non-localhost host isn't a secure context, so `getUserMedia` (mic) is blocked.
- **Kannada voice:** the Voice Library has no Kannada-native voice. That's not a blocker: set the TTS model to **V3 Conversational** (Kannada supported; Flash v2.5 isn't) and use an Indian-accent voice. Pending an ear test.
- **Open:** Kannada appearing in the Additional Languages dropdown and sounding right (task 1.5).

---

## 2026-09-17 — Phase 0.4: Vercel deploy
**Did:** the user imported GitHub `ShabdCoach` into Vercel (Hobby, default Next.js settings, no env vars yet). Production domain: **https://shabd-coach.vercel.app**
**Verified:** `curl` returns 200, and the page is public (no Vercel Authentication wall); it serves the default Next.js page.
**Also:** filled the domain into the allowlist lines in BUILDPLAN 1.4, `agent-prompt.md` and ARCHITECTURE §2.
**Next:** add `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` in Vercel → Settings → Environment Variables at task 1.7, then redeploy.

---

## 2026-09-17 — Phase 0.3 + 2.1–2.3: GitHub push, word bank, session logic
**Did**
- The user added `origin` → https://github.com/GaganNayak/ShabdCoach.git. The remote already had a GitHub "Initial commit" (README + .gitignore), so I merged with `--allow-unrelated-histories -X ours` (kept the local files) and pushed. No force push.
- **2.1** `words.js` → `lib/words.ts`: exports `Word`, `TRACKS` (checked with `satisfies`), and `TrackId = keyof typeof TRACKS`. Deleted `words.js`.
- **2.2** `lib/session.ts`: `LanguageId`, `WordResult`, `Phase`, `LANGUAGES` (label, native script name, agentCode en/hi/kn, meaning field), `WORDS_PER_SESSION = 5`, `pickWords` (Fisher-Yates), `buildWordList` (format in ARCHITECTURE §5.3), `upsertResult` (dedupe by word).
- **2.3** `lib/session.test.ts` using built-in `node:test`. Node 24 strips types, so there's no test dependency. Script: `npm test` → `node --test "lib/**/*.test.ts"`.
- `tsconfig.json`: added `allowImportingTsExtensions: true`, because Node needs `./words.ts` style imports inside `lib/`. The app can still import `@/lib/session` without an extension.

- Later the user ran `git pull --rebase` themselves, which stopped partway. I cleared it with `git rebase --quit` (not `--abort`, which would have reset `main` to `bc0a693`). `main` = `origin/main` = `459d337`. A leftover local branch `dev-nayak` (`4cf761a`) only holds the scaffold; it's safe to delete.

**Verified:** `npm test` 4/4 ✅ · `tsc --noEmit` ✅ · lint ✅ (0 warnings now) · build ✅

**Notes**
- `npm test` prints a harmless `MODULE_TYPELESS_PACKAGE_JSON` warning. Ignore it, because adding `"type": "module"` to package.json could affect Next config files.
- Inside `lib/`, keep the `.ts` extension on relative imports so the tests keep running.

---

## 2026-09-17 — Phase 0.5: shadcn/ui
**Did**
- The user asked for shadcn/ui. Ran `npx shadcn@latest init -d -b radix --no-monorepo -y` (shadcn CLI 4.21).
- Result: `components.json` (style `radix-nova`, base color neutral, CSS variables, lucide icons), `components/ui/button.tsx`, `lib/utils.ts`, and `app/globals.css` updated with theme tokens and `@import "shadcn/tailwind.css"`.
- New deps: `radix-ui`, `class-variance-authority`, `lucide-react`, `tw-animate-css`, `shadcn`, `cn`.
  - **Note:** newer shadcn uses its own `cn` package (github.com/shadcn-ui/cn) instead of `clsx` + `tailwind-merge`. `lib/utils.ts` re-exports it. This is expected, not a typo.

**Verified:** `npm run build` ✅ · `npm run lint` ✅ (same 1 expected warning)

**Next person:** add components with `npx shadcn@latest add <name>` as screens need them (list in BUILDPLAN Phase 3).

---

## 2026-09-17 — Phase 0.1 + 0.2: Next.js scaffold + git
**Did**
- Scaffolded with `create-next-app@latest` (Next.js **16.3.5**, React 19.2.8, TypeScript, Tailwind v4, ESLint, App Router, no `src/` dir, alias `@/*`, Turbopack). Built in a temp folder and copied in, so the existing docs weren't touched.
- The git repo was initialized by create-next-app on branch `main` (initial commit `c378d5f`). Committed the project docs on top.
- `.gitignore`: already ignores `.env*`; added an exception for `.env.example`.
- Added `.env.example` with `NEXT_PUBLIC_ELEVENLABS_AGENT_ID=`.
- Added `.claude/launch.json` (dev server config for Claude Code preview, port 3000).
- `AGENTS.md`: appended a "Project handoff" section pointing to the docs. **Note:** Next 16 ships `AGENTS.md`/`CLAUDE.md` saying its APIs differ from older versions. Read `node_modules/next/dist/docs/` before writing Next-specific code.

**Verified**
- `npm run build` ✅ (static `/` route)
- `npm run dev` ✅ default page renders at localhost:3000
- `npm run lint` ✅ 0 errors, 1 expected warning (`words.js` unused `TRACKS`; goes away in task 2.1 when ported to `lib/words.ts`)

**Files:** `package.json`, `app/*`, `public/*`, config files, `.gitignore`, `.env.example`, `.claude/launch.json`, `AGENTS.md`, `BUILDLOG.md`

**Notes for next person**
- `README.md` is still the create-next-app default; it gets replaced in task 7.1.
- `words.js` (root) is the draft word bank → port it to `lib/words.ts` in 2.1, then delete it.
- `agent-prompt.md` is the source of truth for the ElevenLabs dashboard config.

---

## 2026-09-17 — Planning (pre-build)
- Research + requirements → `CONTEXT.md`
- Word bank draft → `words.js` (4 tracks × 10 words; en / Hinglish / Kannada meanings; Kannada needs a native-speaker check)
- Agent prompt + tool schemas → `agent-prompt.md`
- Architecture decided → `ARCHITECTURE.md`
- Phased task list → `BUILDPLAN.md`
