# BUILDLOG — Shabd Coach

Running log of what was built, for handing off to any AI tool or developer.
**Newest entry at the top.** Each entry: what was done, files touched, how it was verified, the next step.

---

## ▶ Current state (keep this block updated)
- **Phase:** 0, 1, 2, 3 done (except 2.4 Kannada review) → **Phase 4 next: voice wiring**
- **Next step (AI):** 4.1 — install `@elevenlabs/react`, check its API in the installed version, and replace the mock in `components/SessionScreen.tsx` (keep its props contract).
- **Waiting on the user:** 4.0 clear the agent allowlist before local voice tests (re-add `shabd-coach.vercel.app` at 5.2) · 2.4 Kannada word review
- **Repo:** https://github.com/GaganNayak/ShabdCoach (branch `main`; user git has `pull.rebase=true`, so commit before pulling)
- **Live:** https://shabd-coach.vercel.app (Vercel, auto-deploys on push to `main`; env var `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` set, type Config)
- **Agent:** ElevenLabs "Shabd Coach", ID `agent_7301m2q5ec0xf7m81qswyy0kdbpe`, prompt v3 published, TTS V3 Conversational, allowlist `shabd-coach.vercel.app`
- **Run locally:** `npm install` → copy `.env.example` to `.env.local` with the agent ID → `npm run dev` → http://localhost:3000
- **Checks:** `npm test` · `npx tsc --noEmit` · `npm run lint` · `npm run build`
- **Blockers:** none

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
