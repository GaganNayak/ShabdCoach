# ARCHITECTURE — Shabd Coach (voice vocabulary agent)

Status: **decided 2026-09-17**. Product context lives in `CONTEXT.md`; the task breakdown lives in `BUILDPLAN.md`.

## 1. Decisions
| Area | Choice | Why |
|---|---|---|
| Voice agent | **ElevenLabs Agents** (STT + LLM + TTS in one) | Low latency, Hindi + Kannada voices, no backend. Apna uses ElevenLabs too. |
| Client ↔ agent | **`@elevenlabs/react` SDK** (`useConversation`) | We need a custom UI: live transcript, scoreboard, summary, and a language switch for each session |
| Frontend | **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**, on the Node.js runtime | The user's choice. Deploys natively to Vercel. |
| UI components | **shadcn/ui** (style `radix-nova`, base color neutral, Radix primitives, lucide icons) | The user's choice. Components are copied into `components/ui/` and fully editable. |
| Backend | **None in v1.** Next.js route handlers are the upgrade path. | The agent is public, so no secret needs protecting |
| Agent security | Public agent + domain allowlist + max call duration + usage cap | No backend needed. Upgrade path in §7. |
| Hosting | **Vercel ← GitHub** (auto-deploy on push) | Free `*.vercel.app` link; the repo can be shown in the application |
| Persistence | None (v1). Browser `localStorage` for weak words is a nice-to-have. | No login in scope |
| Languages | English / Hinglish / Kannada, via the SDK `overrides.agent.language` = `en` / `hi` / `kn` | See CONTEXT §2.5 |

## 2. System diagram
```
┌────────────────────────── Browser (Vercel-hosted Next.js page) ──────────────────────────┐
│                                                                                          │
│  SetupScreen ──start──► SessionScreen ──end_session / disconnect──► SummaryScreen        │
│  (track, language)      (transcript, scoreboard,                    (score, tips,        │
│                          speaking/listening orb)                     "practice again")   │
│         │                        ▲    ▲                                                  │
│         │ pickWords()            │    │ clientTools.log_result / end_session             │
│         ▼                        │    │ onMessage / onModeChange / onError               │
│  lib/words.ts, lib/session.ts    │    │                                                  │
│         │                        │    │                                                  │
│         └─► useConversation().startSession({ agentId, dynamicVariables, overrides })     │
└───────────────────────────────────────────┬──────────────────────────────────────────────┘
                                            │ WebRTC / WebSocket (mic audio ⇄ agent audio)
                                            ▼
┌──────────────────────────── ElevenLabs Agent "Shabd Coach" ──────────────────────────────┐
│  System prompt (agent-prompt.md) with {{track}} {{language}} {{word_list}}                 │
│  STT → LLM → TTS · Client tools declared: log_result, end_session                        │
│  Security: public, allowlist [localhost, <app>.vercel.app], overrides: language + first msg│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

## 3. Session flow
1. The user picks a **track** and a **language** → taps **Start**.
2. The page requests mic permission (`getUserMedia`). If denied → show a friendly message and stop.
3. `pickWords(track, 5)` chooses 5 random words. `buildWordList(words, language)` turns them into a text block.
4. `startSession({ agentId, dynamicVariables: { track, language, word_list }, overrides: { agent: { language, firstMessage } } })`.
5. The agent teaches the loop. After each word it calls **`log_result`** → the page appends to `results[]` → the scoreboard updates.
6. After the review quiz the agent calls **`end_session`** → the page stores the summary → ends the session → SummaryScreen.
7. If the connection drops, or the user taps **End** before `end_session` → go to SummaryScreen anyway, using whatever `results[]` has.

## 4. Folder structure
```
voice-agent/
├─ app/
│  ├─ layout.tsx          # fonts, metadata, <body> shell
│  ├─ page.tsx            # "use client"; phase state machine: setup | session | summary
│  └─ globals.css
├─ components/
│  ├─ ui/                 # shadcn/ui components (add with `npx shadcn@latest add <name>`)
│  ├─ SetupScreen.tsx     # track cards + language picker + Start
│  ├─ SessionScreen.tsx   # useConversation wiring, orb, transcript, scoreboard, End button
│  └─ SummaryScreen.tsx   # score, per-word tips, Practice again
├─ lib/
│  ├─ utils.ts            # shadcn `cn()` helper
│  ├─ words.ts            # TRACKS word bank (ported from words.js)
│  ├─ session.ts          # pickWords, buildWordList, LANGUAGES config, types
│  └─ session.test.ts     # one small check for session.ts
├─ agent-prompt.md        # source of truth for the agent's dashboard config
├─ components.json       # shadcn config
├─ .env.local             # NEXT_PUBLIC_ELEVENLABS_AGENT_ID=...
├─ CONTEXT.md · ARCHITECTURE.md · BUILDPLAN.md · README.md
```

## 5. Contracts

### 5.1 Types (`lib/session.ts`)
```ts
type TrackId = "interview" | "support" | "sales" | "office";
type LanguageId = "english" | "hinglish" | "kannada";
type Word = { word: string; en: string; hi: string; kn: string; example: string };
type WordResult = { word: string; recalled: boolean; used_correctly: boolean; tip: string };
type Phase = "setup" | "session" | "summary";
```

### 5.2 Language config
| LanguageId | `overrides.agent.language` | `{{language}}` value | Meaning field used |
|---|---|---|---|
| english | `en` | English | `en` |
| hinglish | `hi` | Hinglish | `hi` (+ `en`) |
| kannada | `kn` | Kannada | `kn` (+ `en`) |

### 5.3 Dynamic variables (page → agent)
`track` (label), `language` (label), `word_list` (5 lines: `1. word — meaning — e.g. "example"`).

### 5.4 Client tools (agent → page)
| Tool | Params | Page action | Returns |
|---|---|---|---|
| `log_result` | word, recalled, used_correctly, tip | push to `results[]` | `"ok"` |
| `end_session` | words_learned, summary | save summary, `endSession()`, go to summary | `"ok"` |

Tool schemas must match `agent-prompt.md` exactly (names + param names).

## 6. Error & edge cases
| Case | Handling |
|---|---|
| Mic permission denied | Message: "Allow microphone to talk to Shabd Coach" + retry button |
| No agent ID / connect error | `onError` → toast + back to setup |
| User taps End early | `endSession()` → summary with partial results |
| Unexpected disconnect | Same as End early |
| Agent logs the same word twice | Replace the earlier entry for that word |
| Unsupported / in-app browser (no WebRTC) | Advise opening in Chrome/Safari |
| Kannada voice unsupported by model | Hide Kannada or fall back to English; decided after the dashboard test |

## 7. Security & cost
- The agent ID is public by design (`NEXT_PUBLIC_`). Protection comes from the **allowlist** (only our domains), **max duration ~8 min** and a **usage cap** in the dashboard.
- Overrides enabled: **language** and **first message** only. The prompt is not overridable, so nobody can repurpose the agent from the browser.
- Upgrade path if abused: make the agent private → add `app/api/token/route.ts` (Node) that uses the API key to fetch a conversation token → pass `conversationToken` to `startSession`.

## 8. Unverified / to check during build
- Kannada support on the agent's chosen TTS model (only Eleven v3 lists it — CONTEXT §2.5).
- Exact `@elevenlabs/react` API in the installed version: `useConversation` options vs any provider requirement. Check the package README when installing.
- Free-tier agent minutes (not verified — CONTEXT §2.4).
