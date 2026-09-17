# BUILDLOG — Shabd Coach

Running log of what was built, for handing off to any AI tool or developer.
**Newest entry at the top.** Each entry: what was done, files touched, how it was verified, the next step.

---

## ▶ Current state (keep this block updated)
- **Phase:** 0 — Project setup
- **Done:** 0.1, 0.2, 0.5
- **Next step:** 0.3 (user) — create a public GitHub repo and push. Then 0.4 — import into Vercel and note the `*.vercel.app` domain.
- **Can run in parallel:** Phase 1 (ElevenLabs agent setup, user) and Phase 2 (data & logic, AI)
- **Blockers:** none
- **Run locally:** `npm install` → `npm run dev` → http://localhost:3000
- **Env:** copy `.env.example` → `.env.local` and set `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` (not needed until Phase 4)

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
