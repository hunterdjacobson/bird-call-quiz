# Bird Call Guessing Game — Project Context

## What this project is
A fully static, client-side trivia game. A round is generated entirely
in the browser: pick a random bird from a pre-built quiz bank, pick 3
plausible wrong answers, play its recording, and check the user's
choice — all without any server. The quiz bank itself (audio URLs,
photos, fun facts) is built ONCE, offline, by Python scripts that call
Xeno-canto and Wikipedia. The deployed app is React + Vite, shipped as
static files with no backend.

## Tech stack (deployed app)
- React 18 + Vite
- Tailwind CSS
- No backend. No database. No API server. No env vars at runtime.

## Tech stack (offline pipeline — not part of the deployed app)
- Python 3.11+, httpx, python-dotenv
- Run locally only, output committed as a static JSON file

## Data pipeline
- pipeline/species_list.json: curated list of birds (common_name,
  scientific_name, family)
- pipeline/01_fetch_recordings.py: queries Xeno-canto API v3
  (https://xeno-canto.org/api/3/recordings), picks one high-quality
  (q:A or q:B), short (3-30s) recording per species
- pipeline/02_fetch_photos.py: queries Wikipedia REST API
  (https://en.wikipedia.org/api/rest_v1/page/summary/{title}) for a
  thumbnail and a one-sentence fact per species
- pipeline/03_build_quiz_bank.py: merges both, writes
  frontend/src/data/quizBank.json

## Runtime game logic (entirely client-side, in src/lib/gameLogic.js)
- pickRound(quizBank, difficulty): picks a random target bird, then
  3 distractors — same family as the target for "hard" difficulty,
  different family for "easy" — shuffles all 4 into a choices array
- checkAnswer(targetId, answerId): simple equality check, done locally,
  no round-trip
- There is no anti-cheat mechanism by design — this is a casual game,
  not a graded assessment. Do not add a backend "just to hide the
  answer" unless a future feature (leaderboard, timed competitive mode)
  actually requires server-side trust.

## Coding rules
- gameLogic.js functions must be PURE (no DOM access, no React) so they
  stay trivially testable
- Frontend: all game state lives in useGame.js; components stay
  presentational (props in, callbacks out)
- Never use class components — hooks only
- Never reintroduce a backend call for something gameLogic.js can do
  locally

## What to never do
- Never call the Xeno-canto or Wikipedia APIs from the deployed app —
  only the offline pipeline/ scripts call them
- Never commit pipeline/.env (contains XENO_CANTO_API_KEY)
- Never use localStorage for anything except the best-streak high score
  (it's the one piece of state worth persisting between visits)