# BUILDPLAN — Shabd Coach

Small tasks, built in phases. Each task has a **Done when** check. Tick boxes as we go and log every step in `BUILDLOG.md`.
Owner: **G** = Gagan (needs your accounts or judgment) · **C** = Claude.
Architecture reference: `ARCHITECTURE.md`.

---

## Phase 0 — Project setup (~30 min) ✅ DONE
- [x] **0.1 (C)** Scaffold Next.js (App Router, TS, Tailwind, ESLint) in the project folder, keeping the existing docs.
  Done when: `npm run dev` shows the default page at localhost:3000.
- [x] **0.2 (C)** `git init`, `.gitignore` (incl. `.env.local`), first commit.
  Done when: `git log` shows the initial commit.
- [x] **0.3 (G)** Create a GitHub repo (public) and push.
  Done when: code is visible on GitHub.
- [x] **0.4 (G)** Import the repo into Vercel → deploy.
  Done when: a `*.vercel.app` URL loads. **Note the domain; it's needed for the agent allowlist.**
- [x] **0.5 (C)** Init shadcn/ui (Radix base, radix-nova style).
  Done when: `components.json` exists and the build passes.

## Phase 1 — ElevenLabs agent (~1 h, mostly G) ✅ DONE
- [x] **1.1 (G)** Create the agent "Shabd Coach"; paste the system prompt + first message from `agent-prompt.md`.
- [x] **1.2 (G)** Add client tools `log_result` and `end_session` with the exact params in `agent-prompt.md` (all params: Value Type = LLM Prompt; Wait for response off).
- [x] **1.3 (G)** Languages: default English; add Hindi + Kannada. TTS model **V3 Conversational** (needed for Kannada); Indian-accent voice; Flash/mini LLM.
- [x] **1.4 (G)** Security tab: public agent, allowlist `shabd-coach.vercel.app` (localhost not accepted, see agent-prompt.md), "Fail when Origin header is missing" on, overrides for **language** and **first message**, max duration ~8 min.
- [x] **1.5 (G+C)** Test in the dashboard: 1 session each in English, Hinglish, Kannada.
  Result: short turns + loop order OK in all; off-list words in all; Kannada unnatural.
- [x] **1.6 (C)** Tune `agent-prompt.md` from the test notes → prompt v2 (strict order, "Word N of 5", silent tools, Kanglish in Kannada script).
- [x] **1.6a (G)** Re-test v2. Result: order OK but invented words (list likely not received); answered off-topic; Kannada better, not great → **Beta** (user decision).
- [x] **1.6c (C+G)** Prompt v3 (one-line word_list, missing-list guard, strict scope) → re-test. Result: ✅ correct words in order, off-topic refused.
- [x] **1.6b (G)** **Publish** the agent. Re-publish after every prompt change.
- [x] **1.7 (G)** Agent ID `agent_7301m2q5ec0xf7m81qswyy0kdbpe` → `.env.local` ✅ + Vercel env var `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` ✅ (type Config).

> Phases 2–3 do not need the agent and can run in parallel with Phase 1.

## Phase 2 — Data & logic (~45 min) ✅ DONE except 2.4 (user)
- [x] **2.1 (C)** Port `words.js` → `lib/words.ts` with types; delete `words.js`.
- [x] **2.2 (C)** `lib/session.ts`: types, `LANGUAGES` config, `pickWords(track, n)`, `buildWordList(words, lang)`.
- [x] **2.3 (C)** `lib/session.test.ts`: checks that pickWords returns n unique words from the track and that buildWordList includes the right meaning field.
  Done when: the test passes.
- [ ] **2.4 (G)** Kannada meanings reviewed by a native speaker; fixes applied.

## Phase 3 — UI screens with mock data (~2 h) ✅ DONE
> Use shadcn/ui components. Likely set: `card`, `button`, `badge`, `toggle-group` (language), `scroll-area` (transcript), `progress`, `sonner` (toasts). Add them only when a screen needs them.
- [x] **3.1 (C)** `app/page.tsx`: phase state machine (setup → session → summary) + shared state.
- [x] **3.2 (C)** `SetupScreen`: 4 track cards, language picker (English / Hinglish / ಕನ್ನಡ **Beta** badge), Start button, one-line explainer.
- [x] **3.3 (C)** `SessionScreen` (mock): speaking/listening orb, transcript list, scoreboard of 5 words (pending / ✅ / ❌), End button.
- [x] **3.4 (C)** `SummaryScreen`: score, per-word tips, Practice again.
- [x] **3.5 (C)** Mobile-first styling; check at 375px width.
  Done when: all 3 screens are clickable end to end with fake data, on desktop and mobile widths.

## Phase 4 — Voice wiring (~1.5 h, needs 1.7) 🟡 code done, awaiting 4.7 live run by the user
- [x] ~~**4.0 (G)** Clear the allowlist for local testing~~ → **not needed**: test on https://shabd-coach.vercel.app (already allowlisted). Localhost is dropped by the allowlist (confirmed).
- [x] **4.1 (C)** Install `@elevenlabs/react` (1.15.2). API differs from the docs we planned against: `ConversationProvider` + `useConversationControls` / `useConversationStatus` / `useConversationMode`.
- [x] **4.2 (C)** Mic permission requested inside the Start tap; denied / no-mediaDevices → error on the setup screen.
- [x] **4.3 (C)** `startSession` with dynamicVariables + `overrides.agent.language` + per-language greeting (`firstMessage`, `GREETING_OVERRIDE = true`) + `connectionType: "websocket"`.
- [x] **4.4 (C)** `onMessage` → transcript; `useConversationMode` + status → orb.
- [x] **4.5 (C)** `clientTools.log_result` → results (upsert); `end_session` → summary, hang up when the agent goes back to listening (15 s fallback).
- [x] **4.6 (C)** End button + disconnect → summary; disconnect before any message → back to setup with an error.
- [x] **4.7a (G)** Add agent minutes (upgraded to Starter). Cause of dropped sessions = `quota_exceeded` (free plan: 15 min/mo). Recommended: Starter ($6, 75 min). Set max call duration to ~6 min.
- [x] **4.7b (C)** After the upgrade, WebRTC sessions still dropped (LiveKit `connection_state_changed`). Fix: WebSocket. Verified on prod: connects, Hinglish greeting spoken.
- [x] **4.7 (G+C)** First full live Hinglish session: flow + hang-up + summary ✅, "satisfying". Bugs: no ✗ for wrong answers; word card stuck at word 3.
- [x] **4.8 (C)** Fix: prompt v4 (log_result mandatory for every word), tolerant word matching, card advances on "Word N of 5"; unlogged words show "–".
- [x] **4.9 (G)** Paste prompt v4 → Publish → re-run with wrong answers. Result: ✗ dots ✅, card advances ✅, summary ✗ + tips ✅. Bug: card switched before the feedback finished.
- [x] **4.10 (C)** Fix: the word card only advances when the coach isn't speaking (dots still update at once).
- [ ] **4.11 (G)** Quick re-check: the card changes only after the feedback is spoken.
  Phase 4 done when: a full live 5-word session with wrong answers shows ✗ dots, the card advances, and it lands on a correct summary.

## Phase 5 — Test & harden (~1 h)
- [ ] **5.1 (G+C)** Live test: Hinglish and Kannada sessions end to end.
- [ ] **5.2 (G)** Deployed-URL test on Android Chrome + iPhone Safari (mic prompt, audio playback, layout).
- [ ] **5.3 (C)** Fix the bugs found; re-deploy.
- [ ] **5.4 (C)** Edge cases from ARCHITECTURE §6: deny mic, End early, airplane mode mid-session, open inside the WhatsApp in-app browser.
  Done when: every §6 row behaves as specified on the live URL.

## Phase 6 — Polish (optional, ~1 h)
- [ ] **6.1 (C)** `localStorage` "weak words": words missed last time are included first next session.
- [ ] **6.2 (C)** Branding: name, favicon, OG image/title for a nice link preview when shared.
- [ ] **6.3 (C)** Small "How it works" section on the setup screen (Teach → Recall → Use → Review).

## Phase 7 — Submission (~1 h)
- [ ] **7.1 (C)** `README.md`: problem, target user, learning loop + research, architecture diagram, metrics we'd track, what's next (Tulu/Konkani, SRS, pronunciation).
- [ ] **7.2 (G)** Record a 60–90s demo video (Loom), one Hinglish or Kannada session.
- [ ] **7.3 (G)** Final check of the live link in an incognito window; confirm **enough agent minutes remain for reviewers** (each session ≈ 5–6 min).
- [ ] **7.4 (G)** Submit: live link + GitHub repo + demo video.

---

### Critical path
`0.1 → 0.4 (domain) → 1.4 (allowlist) → 1.7 (agent ID) → Phase 4 → Phase 5 → Phase 7`
Phases 2–3 run alongside Phase 1.
