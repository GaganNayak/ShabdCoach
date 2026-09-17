# Shabd Coach — learn job English by talking

**Live prototype → https://shabd-coach.vercel.app** (works on a phone; allow the microphone)

A 5-minute voice lesson that teaches English words a job seeker actually needs at work and in interviews. You talk to the coach, it explains in **English, Hinglish or Kannada (beta)**, and you practise each word by using it in your own sentence.

Built for the Apna Advantage assignment: *"Build a simple working prototype of a voice agent that helps people learn vocabulary."*

---

## 1. Who it's for, and why this shape

Apna's own AI Job Prep reports that [only 32% of Indian job seekers feel prepared for interviews](https://businessnewsthisweek.com/business/apna-co-launches-ai-job-prep-clocks-39-lakh-minutes-across-7-6-lakh-ai-interviews/), and that confidence is lowest among freshers and candidates from Tier 2–3 towns. Apna already runs voice at scale — [1.5M AI mock interviews, 7.5M voice minutes on ElevenLabs](https://elevenlabs.io/blog/apna-interview-agents) — in English, Hindi and Hinglish.

So the user here is **a fresher or Tier 2–3 job seeker who can speak, but freezes on workplace English**. Reading a word list doesn't fix that. Saying the word out loud, badly, and being corrected kindly does.

**Why voice, not flashcards:** vocabulary research points at two things — [practice testing and spaced practice beat re-reading](https://evidencebased.education/resource/retrieval-and-spaced-practice-study-strategies-that-must-be-combined/) (meta-analysis of 242 studies), and [productive use — actually producing the word — is where knowledge becomes usable](https://www.ucl.ac.uk/ioe/departments-and-centres/centre-applied-linguistics/research/maximising-impact-second-language-vocabulary-design-language-learning-apps/frameworks-evaluate-vocabulary-learning-conditions) (Webb & Nation, 2017). A voice agent is the cheapest way to make someone *produce* a word and get feedback in the same second.

Existing AI speaking apps (Speak, ELSA, Loora, Langua) teach general conversation or pronunciation. None of the ones I looked at drill **job-specific vocabulary, in an Indian language, by voice**.

## 2. The lesson loop

Each session: pick a job track → 5 words → about 5 minutes.

For every word:

| Step | What happens | Why |
|---|---|---|
| **Teach** | "Word 1 of 5: escalate" + meaning in your language + an example from that job | Noticing, with a first encounter in context |
| **Recall** | "What does escalate mean?" — answer in any language | Retrieval practice |
| **Use** | "Make your own sentence with it" | Productive use — the hard, useful part |
| **Feedback** | Specific praise, or one kind tip plus a corrected sentence | Correction without discouragement |
| **Review** | A 3-word quiz at the end of the session | Spacing inside the session |

Words you didn't fully learn are saved in your browser and **come back first in your next session** — spaced repetition, lite.

Scoring is honest, per word: **✓ learned** (meaning *and* sentence right), **½ almost there** (one of the two), **✗ keep practising**.

## 3. What's in it

- **4 job tracks** — Interview basics, Customer support, Sales, Office & workplace — 10 curated words each, so a session never repeats within a track.
- **3 explanation languages** — English, Hinglish, **ಕನ್ನಡ (beta)**. Target words and examples always stay in English; only the explanation switches.
- **Live screen** — speaking/listening indicator, progress dots, a word card with the meaning in your language (so Kannada is readable even when the voice is imperfect), and a running transcript.
- **Summary** — score, per-word meaning/usage marks, and the coach's tip for each word.
- **Works on a shared phone** — no login, no install, no data stored on a server.

## 4. How it's built

```
Browser (Next.js on Vercel)          ElevenLabs Agent "Shabd Coach"
┌───────────────────────────┐        ┌──────────────────────────────┐
│ Setup → Session → Summary │        │ system prompt + 5-word list  │
│ word list, language,      │──────► │ speech-to-text → LLM → voice │
│ live transcript, scoring  │ ◄──────│ log_result / end_session     │
└───────────────────────────┘        └──────────────────────────────┘
        no backend, no database              one public agent
```

- **Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui**, deployed on Vercel.
- **[ElevenLabs Agents](https://elevenlabs.io/docs/eleven-agents/overview)** handles listening, thinking and speaking in one low-latency loop (the same vendor Apna uses), driven by `@elevenlabs/react`.
- **The page stays in charge of the lesson.** It picks the 5 words and sends them to the agent per session, and the agent reports each word's result back through a client tool, which drives the dots, the card and the summary.
- **The word card follows the coach's speech.** The page reads the audio's character timings and flips the card at the moment "Word 2 of 5" is actually spoken, not when the text arrives.
- **No backend and no personal data.** The agent is public but locked to this domain, with a call-duration cap. Progress lives in `localStorage`.

Details: [`ARCHITECTURE.md`](ARCHITECTURE.md) · agent config: [`agent-prompt.md`](agent-prompt.md) · word bank: [`lib/words.ts`](lib/words.ts)

## 5. What I'd measure

| Question | Metric |
|---|---|
| Does the loop hold? | Session completion rate (reached the review quiz) |
| Does it teach? | Words at ✓ per session; recall rate for repeated (weak) words |
| Do they come back? | D1 / D7 return rate, sessions per user per week |
| Is it comfortable? | Median session minutes; share of sessions in Hinglish / Kannada vs English |
| Where does it break? | Drop-off by step (teach / recall / use), mic-permission failures |

First thing I'd run as a PM: does a learner who practises a word out loud recall it a week later more often than one who only heard it? That's the whole bet.

## 6. Honest limitations

- **Kannada voice is beta.** The voice model generates Kannada slightly slower than real time, and our connection has no audio buffer, so it can stutter or pause. The buffered connection (WebRTC) is dropped by the agent — a vendor-side issue I could reproduce but not fix. The Kannada *meaning* is always on screen, and the app says so before you start.
- **40 words, hand-written**, including the Kannada meanings (these still need a native-speaker review). It's a prototype word bank, not a curriculum.
- **Pronunciation isn't scored.** The coach judges meaning and usage, not accent.
- **Spacing is within-session and within-browser.** No accounts, so progress doesn't follow a user across devices.
- **Costs voice minutes.** Each session is ~5 minutes of agent time on a paid plan.

## 7. What I'd do next

1. **Real spaced repetition** across days, with a proper review schedule (the "weak words" list is the seed).
2. **Words from the job you applied to** — pull vocabulary from the actual job description or role on Apna, instead of fixed tracks.
3. **Pronunciation feedback**, which ELSA-style scoring makes possible and which interview candidates ask for.
4. **More languages** — Kannada voice done properly once buffering works, then Tamil, Telugu, Marathi, Bengali, using the same text-first fallback.
5. **Hook into mock interviews** — teach the words, then have the learner use them in an Apna AI interview and report which ones they actually used.

## 8. Run it locally

```bash
npm install
cp .env.example .env.local   # add NEXT_PUBLIC_ELEVENLABS_AGENT_ID
npm run dev
```

The UI runs anywhere, but **voice only works on the deployed domain**, because the agent's allowlist blocks localhost. Checks: `npm test` (logic), `npm run build`, `npx tsc --noEmit`, `npm run lint`.

Project docs: [`CONTEXT.md`](CONTEXT.md) (decisions and research) · [`BUILDPLAN.md`](BUILDPLAN.md) (phased task list) · [`BUILDLOG.md`](BUILDLOG.md) (what was built, what broke, how it was diagnosed).
