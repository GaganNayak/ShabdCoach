# BUILDLOG — Shabd Coach

Running log of what was built, for handing off to any AI tool or developer.
**Newest entry at the top.** Each entry: what was done, files touched, how it was verified, the next step.

---

## ▶ Current state (keep this block updated)
- **Phase:** 2 done (except 2.4) → Phase 3 next
- **Done:** Phase 0 complete (0.1–0.5), 2.1, 2.2, 2.3
- **Next step:** Phase 3 — UI screens with mock data (AI). Waiting on the user: Phase 1 (ElevenLabs agent), 2.4 (Kannada review)
- **Repo:** https://github.com/GaganNayak/ShabdCoach (branch `main`)
- **Live:** https://shabd-coach.vercel.app (Vercel, auto-deploys on push to `main`)
- **Test:** `npm test`
- **Blockers:** none
- **Run locally:** `npm install` → `npm run dev` → http://localhost:3000
- **Env:** copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (not needed until Phase 4)

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
