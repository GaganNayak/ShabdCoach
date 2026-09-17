# CONTEXT — Voice Vocabulary Agent (Apna Advantage assignment)

> Living doc. Update at every phase change. Newest entries in **Changelog** at bottom.

## 1. The ask
- **Source:** Apna Advantage application, role *Product Operations Associate*.
- **Prompt (verbatim):** "Build a simple working prototype of a voice agent that helps people learn vocabulary. Share the prototype link with us. You can use any AI/no-code tools you're comfortable with."
- **Deliverable:** a public link to a working prototype. Anyone who opens it should be able to use it with no setup.
- **Goal behind it:** get the job. The reviewers should see product judgment (who it's for, why these features, how we'd measure it) as well as a tool that works.

## 2. Research summary (basic, sourced)

### 2.1 Why this fits Apna
- Apna runs voice AI mock interviews at scale: 1.5M+ AI interviews and 7.5M voice minutes, built on ElevenLabs TTS with Blue Machines doing the orchestration. It is bilingual (Hindi + English). [S1 — primary, ElevenLabs blog]
- Apna's AI Job Prep supports "English, Hindi and Hinglish, via code-switching". It cites "only 32% of Indian job seekers feel prepared for interviews", and says confidence is lower among freshers and Tier 2/3 candidates. [S2 — secondary, press release coverage]
- **Inference:** the natural user is an Indian job seeker who wants workplace and interview English vocabulary. Explaining in Hinglish would feel native to Apna's product. *[ASSUMPTION: Apna expects this user. The prompt does not name a user.]*

### 2.2 Learning science → feature implications
- A meta-analysis of 242 studies found "The most effective techniques are Distributed Practice and Practice Testing". → **Quiz the user (retrieval) and space reviews over time.** [S3 — established secondary summarizing research]
- Webb & Nation (2017) name **repetition** and **quality of attention** as the two main factors in vocabulary learning. Their framework: noticing → retrieval → varied encounters → varied use (productive) → elaboration. → **Have the user say the word in their own sentence.** Speaking the word is productive use, and voice is the natural medium for it. [S4 — primary book / UCL summary]
- "8–12 meaningful encounters" per word: this claim comes only from a practitioner blog. [S5 — LOW CONFIDENCE, not verified against primary]

### 2.3 Competitors (for positioning, not copying)
- The AI speaking apps are Speak, ELSA Speak (pronunciation), Loora (English, has job-interview roleplay), Langua and Talkio. [S6 — unverified secondary review blogs]
- **Gap (inference):** these apps teach general conversation or pronunciation. None of the sources showed a voice-first vocabulary drill tied to job roles in Hinglish. *[ASSUMPTION: based on a quick scan only, not an exhaustive market study.]*

### 2.4 Tech options
- **Browser Web Speech API:** SpeechRecognition works in Chrome and Safari (with the webkit prefix). Firefox keeps it behind a flag. MDN calls it "Limited availability". Chrome sends audio to a server, so it needs internet. [S7 — primary, MDN]
- **ElevenLabs Agents:** full-stack voice agent with low latency and many languages. It needs no code and gives a hosted or embeddable agent. Apna itself uses ElevenLabs. [S8 — secondary comparisons; S1]
  - Free tier: the pricing page shows "10k credits per month" on free. Agent-specific minutes **could not be verified**. [S9 — primary, incomplete]
- **Vapi / Retell:** orchestration layers where you bring your own STT, LLM and TTS. Both are phone-call oriented and have more setup. Platform fees are about $0.07–0.20/min. [S8 — LOW CONFIDENCE for the pricing figure]

### 2.5 Regional language support (Kannada, Tulu, Konkani)
| Language | ElevenLabs TTS (voice out) | STT (voice in) | Sarvam AI (alt) |
|---|---|---|---|
| Hindi/Hinglish | ✅ v3, Multilingual v2, Flash v2.5 [S10] | ✅ | ✅ |
| Kannada | ✅ **Eleven v3** listed [S10]; not in the Multilingual v2 list, so unclear for low-latency agent models | ✅ ElevenLabs STT page [S11] | ✅ TTS + STT [S12] |
| Konkani | ❌ not listed [S10] | ❓ unverified on ElevenLabs | STT only (Saaras), no TTS [S12 — LOW CONFIDENCE, secondary search summary] |
| Tulu | ❌ not listed [S10] | ❌ none found | ❌ none found |
- **Implication:** Kannada can be spoken if the agent's voice model supports it (to check in the dashboard). Tulu and Konkani **cannot be spoken** with the tools we found.
- LLM-written Tulu/Konkani is low-resource and likely to be wrong. *[ASSUMPTION: general knowledge, not tested]* → use **curated, human-checked translations shown on screen**, not AI-generated ones.

### Sources
- S1 https://elevenlabs.io/blog/apna-interview-agents
- S2 https://businessnewsthisweek.com/business/apna-co-launches-ai-job-prep-clocks-39-lakh-minutes-across-7-6-lakh-ai-interviews/
- S3 https://evidencebased.education/resource/retrieval-and-spaced-practice-study-strategies-that-must-be-combined/
- S4 https://www.ucl.ac.uk/ioe/departments-and-centres/centre-applied-linguistics/research/maximising-impact-second-language-vocabulary-design-language-learning-apps/frameworks-evaluate-vocabulary-learning-conditions
- S5 https://gianfrancoconti.com/2025/04/26/what-really-matters-in-vocabulary-acquisition-a-ranked-analysis-of-key-influencing-factors/
- S6 https://www.issen.com/blog/ai-language-learning-apps-voice-practice/ , https://www.talkio.ai/blog/best-ai-language-speaking-practice-apps-in-2026
- S7 https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- S8 https://www.retellai.com/blog/retell-vs-bland-vs-vapi-vs-elevenlabs , https://www.digitalapplied.com/blog/voice-ai-agents-business-elevenlabs-vapi-retell-bland
- S9 https://elevenlabs.io/pricing
- S10 https://elevenlabs.io/docs/overview/models
- S11 https://elevenlabs.io/speech-to-text/kannada
- S12 https://docs.sarvam.ai/api/getting-started/models/bulbul

## 3. Requirements (draft v1)

### Target user
A job seeker in India: fresher, or Tier 2/3 city. They are comfortable in Hindi/Hinglish or Kannada and want English words for interviews and the workplace.

### Core learning loop (one session ≈ 5 min)
1. **Pick a track:** Interview basics, Customer support, Sales, Office/Corporate. The user can also say "surprise me".
2. **Teach:** the agent says a word, gives a simple meaning (in Hinglish if the user wants), and gives one example sentence from that job context.
3. **Recall:** the agent asks the user what the word means or which word fits a situation. This is retrieval.
4. **Use:** the user speaks their own sentence with the word. The agent gives short, kind feedback and a corrected version. This is productive use.
5. **Review:** at the end the agent re-quizzes that session's words in mixed order. This is a basic version of spacing.
6. **Wrap-up:** words learned, score, and a nudge to come back.

### MVP features (must-have)
- [ ] Voice in and voice out, with text shown on screen as a fallback and for accessibility
- [ ] Job-track word lists (about 10 words per track, curated)
- [ ] Teach → Recall → Use → Review loop
- [ ] Explanation language picker: English / Hinglish / Kannada (all spoken)
- [ ] Feedback on the user's sentence (was the word used correctly?)
- [ ] End-of-session summary
- [ ] Public shareable link that works on mobile and desktop

### Nice-to-have (only if time allows)
- Remember weak words across visits (in the browser)
- Pronunciation tip for each word
- Streak counter

### Out of scope (explicitly)
Tulu/Konkani (future: once TTS exists or with curated text cards), login, accounts, database, phone calls, full spaced-repetition scheduling, pronunciation scoring, analytics backend.

### Success metrics (for the pitch, not built)
Session completion rate, words correctly recalled in review, D1 return rate, average session minutes.

## 4. Decisions
- [x] Build approach: **C. Hybrid** (own web page + ElevenLabs agent) — 2026-09-17
- [x] Language: **English + Hinglish toggle** in v1
- [x] Explanation languages (final, 2026-09-17): **English, Hinglish, Kannada**. All three are spoken by the agent.
  - Tulu and Konkani were considered and dropped: no TTS support and no native-speaker check available (§2.5). Listed as a future step.
  - Word data: `word`, `meaning_en`, `meaning_hinglish`, `meaning_kn`, `example`
  - Kannada needs a dashboard check that the agent voice model speaks it (Eleven v3 lists it; low-latency models unclear)
- [x] Stack (2026-09-17): **Next.js + React + TS + Tailwind + shadcn/ui** (user choice, over plain HTML); `@elevenlabs/react` SDK with custom UI; public agent + allowlist + cap; Vercel via GitHub.
- [x] Accounts available: ElevenLabs, Vercel/Netlify, GitHub. No separate LLM key needed (the ElevenLabs agent includes the LLM).

## 5. Architecture options (decided: C. Hybrid)
| | A. ElevenLabs Agent (no-code) | B. Custom web app | C. Hybrid |
|---|---|---|---|
| How | Agent configured in the ElevenLabs dashboard: system prompt + word list in its knowledge base, shared via its hosted page | Single HTML page: Web Speech API (STT/TTS) + LLM via a small serverless proxy on Vercel | Our own landing page (tracks, summary) with an embedded ElevenLabs agent widget |
| Voice quality | Best | Robotic TTS; STT is fine in Chrome | Best |
| Control over the loop and UI | Prompt only | Full | Medium |
| Build time | ~2–3 h | ~1 day | ~half day |
| Cost risk | Free credits may run out while reviewers test | Low (LLM tokens) | Same as A |
| Apna signal | Same vendor as Apna | Shows building skill | Both |

### 5.1 Chosen architecture → see `ARCHITECTURE.md`
Summary: Next.js (App Router, TS, Tailwind) on Vercel + `@elevenlabs/react` SDK → public ElevenLabs agent (allowlist + cap). No backend in v1. Language is switched per session via `overrides.agent.language` (en/hi/kn).

## 6. Build plan → see `BUILDPLAN.md`
8 phases (0 Setup · 1 Agent · 2 Data/logic · 3 UI mock · 4 Voice wiring · 5 Test · 6 Polish · 7 Submission).

## 7. Files
- `words.js` — `TRACKS` word bank (4 tracks × 10; fields: word, en, hi, kn, example). Page picks 5 random words per session.
- `BUILDLOG.md` — running build log + current state/next step (handoff doc).
- `ARCHITECTURE.md` — decided architecture, contracts, edge cases.
- `BUILDPLAN.md` — phased task checklist with owners and done-when checks.
- `agent-prompt.md` — agent name "Shabd Coach", first message, system prompt, client tool schemas, dashboard checklist.

## Changelog
- 2026-09-17: Created. Basic research done; requirements v1 drafted; architecture options listed, decision pending.
- 2026-09-17: Decided Hybrid + EN/Hinglish. Architecture (static page + ElevenLabs SDK + client tools) and 8-step build plan added.
- 2026-09-17: Added Kannada/Tulu/Konkani. Researched support; two-tier plan (voice: EN/Hinglish/Kannada; text: Tulu/Konkani).
- 2026-09-17: Scoped languages down to English + Hinglish + Kannada. Tulu/Konkani moved to future.
- 2026-09-17: Step 1 done (words.js). Step 2 drafted (agent-prompt.md); dashboard setup pending on the user's ElevenLabs account. Session = 5 words.
- 2026-09-17: Architecture decided (Next.js + ElevenLabs React SDK, no backend). ARCHITECTURE.md + BUILDPLAN.md created; CONTEXT §5.1/§6 now point to them.
- 2026-09-17: Phase 0.1–0.2 done (Next.js 16 scaffold + git). BUILDLOG.md started for handoff.
- 2026-09-17: shadcn/ui added as the UI component library (user request).
