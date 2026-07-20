# Bird Call Guessing Game

[![Live Demo](https://img.shields.io/badge/demo-vercel-blue.svg)](https://bird-call-quiz.vercel-ten.app)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The Bird Call Guessing Game is a client-side web application that plays real bird songs and calls for the user to identify. Players are presented with four choices, matching the correct bird with distractors based on the selected game difficulty. Once a choice is selected, the game reveals the correct bird's photograph along with a quick, interesting fun fact.

---

## No Backend

This project is built as a fully static, serverless web app because it is a casual trivia game with no sensitive state or proprietary data worth protecting. Instead of deploying a typical FastAPI backend on Render—which would introduce cold starts, database management, and maintenance overhead—the entire game logic is executed directly in the browser. The quiz bank is generated offline, enabling us to ship static HTML, JS, CSS, and JSON data files files that run instantly, cost nothing to host, and scale infinitely without any server resource constraints.

---

## Architecture

```
+------------------------------------+
|              Browser               |
|  (Renders UI & Plays Audio URLs)   |
+------------------------------------+
                  │
                  │ Downloads static assets
                  ▼
+------------------------------------+
|    Static React Bundle (Vercel)    |
|  (HTML, CSS, JS, and Images)       |
+------------------------------------+
                  │
                  │ Reads static data
                  ▼
+------------------------------------+
|      bundled quizBank.json         |
|  (Contains audio, photos, facts)   |
+------------------------------------+
```

---

## Analytics Dashboard (WIP)

To help players review their learning and study bird calls, the app includes a comprehensive **Analytics** dashboard:

- **Encountered Species Tracker**: Tracks how many species you have heard/encountered out of the total available in the quiz bank.
- **Accuracy & Strengths**: Shows overall guessing accuracy, your top-performing species, and your struggling species.
- **Search & Filter**: Search all birds by common name, scientific name, or family. Filter by category, including *Encountered*, *Unplayed*, *Mastered* (accuracy >= 80%), and *Struggling* (accuracy < 50%).
- **Interactive Practice**: Expand any bird's card to view its photo, read its fun fact, and play its call directly from the dashboard.
- **Session Stats**: All stats are computed and updated dynamically in-memory per session, and can be reset at any time using the **Reset Stats** button.

---

## How the Quiz Bank Is Built

The quiz bank is generated offline using Python scripts that query external APIs and merge the results into a static database file.

1. **Audio Recordings**: [pipeline/01_fetch_recordings.py](pipeline/01_fetch_recordings.py) queries the Xeno-canto API v3 for high-quality, short audio clips.
2. **Photos & Fun Facts**: [pipeline/02_fetch_photos.py](pipeline/02_fetch_photos.py) queries the Wikipedia REST API for article summaries, extracting a thumbnail image and the first sentence as a fun fact.
3. **Compilation**: [pipeline/03_build_quiz_bank.py](pipeline/03_build_quiz_bank.py) merges these datasets, generates clean slug IDs, and compiles the final [frontend/src/data/quizBank.json](frontend/src/data/quizBank.json).

To add new birds:
1. Append the bird's common name, scientific name, and family to [pipeline/species_list.json](pipeline/species_list.json).
2. Re-run the three pipeline scripts in sequence.

---

## Local Development

Follow these steps in PowerShell to run the React frontend app locally:

1. Clone the repository:
   ```powershell
   git clone https://github.com/hunterdjacobson/bird-call-quiz.git
   ```
2. Navigate to the frontend directory:
   ```powershell
   cd bird-call-quiz/frontend
   ```
3. Install dependencies:
   ```powershell
   npm install
   ```
4. Start the development server:
   ```powershell
   npm run dev
   ```

---

## Re-building the Quiz Bank

To modify or rebuild the static quiz bank, set up the Python environment:

1. Navigate to the pipeline directory from the root:
   ```powershell
   cd pipeline
   ```
2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
4. Set up credentials:
   Create a `.env` file in the `pipeline/` directory containing your API key:
   ```env
   XENO_CANTO_API_KEY=your_key_here
   ```
5. Run the pipeline scripts in order:
   ```powershell
   python 01_fetch_recordings.py
   python 02_fetch_photos.py
   python 03_build_quiz_bank.py
   ```

---

## Data & Attribution

- **Audio Recordings**: Sourced from [Xeno-canto](https://xeno-canto.org/) under Creative Commons licenses. The specific recordist and license URL are credited dynamically in-app for every bird call played.
- **Photos & Fun Facts**: Sourced from [Wikipedia](https://en.wikipedia.org/) under CC BY-SA licenses via the Wikipedia REST API.

---

## Known Limitations

- **Quiz Bank Size**: The quiz bank currently contains 46 species. It can be easily expanded by adding names to `species_list.json` and re-running the build pipeline.
- **Wikipedia Matches**: In rare cases, if a species' common name does not match the Wikipedia page title exactly, the pipeline may fall back to the scientific name. If both fail, it defaults to no photo or fun fact.
- **No Anti-Cheat**: Because all game state and round evaluations are executed client-side, the correct answer is technically visible within the browser's developer tools. This is a deliberate design choice to keep the application entirely serverless and lightweight rather than an oversight.