import { useState } from 'react'
import useGame from './hooks/useGame'
import AudioPlayer from './components/AudioPlayer'
import AnswerChoices from './components/AnswerChoices'
import RoundResult from './components/RoundResult'
import ScoreBoard from './components/ScoreBoard'
import Analytics from './components/Analytics'

function App() {
  const [view, setView] = useState('quiz'); // 'quiz' or 'analytics'
  const {
    round,
    result,
    score,
    streak,
    bestStreak,
    selectedId,
    difficulty,
    birdStats,
    submitAnswer,
    nextRound,
    setDifficultyLevel,
    resetStats
  } = useGame();

  // Guard against round being null on first render
  if (!round) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">
          Loading bird calls...
        </div>
      </div>
    );
  }

  const uniqueEncounteredCount = Object.keys(birdStats).length;

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 flex flex-col justify-between items-center text-gray-800 font-sans">
      {/* Header and Interface Container */}
      <main className={`w-full ${view === 'analytics' ? 'max-w-4xl' : 'max-w-2xl'} flex flex-col items-center gap-6`}>
        {/* Title */}
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 flex items-center justify-center gap-2">
            <span>🐦</span> Bird Call Quiz
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium uppercase tracking-wider">
            Listen. Guess. Learn.
          </p>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 bg-gray-200/50 p-1.5 rounded-2xl w-full max-w-xs mx-auto shadow-inner mb-2">
          <button
            type="button"
            onClick={() => setView('quiz')}
            className={`flex-1 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              view === 'quiz'
                ? 'bg-feather-green text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
          >
            <span>🎯</span> Quiz
          </button>
          <button
            type="button"
            onClick={() => setView('analytics')}
            className={`flex-1 py-2 rounded-xl text-sm font-extrabold transition-all duration-200 flex items-center justify-center gap-2 relative cursor-pointer ${
              view === 'analytics'
                ? 'bg-feather-green text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
            }`}
          >
            <span>📊</span> Analytics
            {uniqueEncounteredCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-feather-orange text-[10px] font-bold text-white ring-2 ring-white animate-fade-in">
                {uniqueEncounteredCount}
              </span>
            )}
          </button>
        </nav>

        {view === 'quiz' ? (
          <div className="w-full flex flex-col items-center gap-6">
            {/* Difficulty Toggle */}
            <div className="flex items-center gap-2 bg-gray-200/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDifficultyLevel('easy')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  difficulty === 'easy'
                    ? 'bg-feather-green text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Easy
              </button>
              <button
                type="button"
                onClick={() => setDifficultyLevel('hard')}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  difficulty === 'hard'
                    ? 'bg-feather-green text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hard
              </button>
            </div>

            {/* Score Board */}
            <ScoreBoard score={score} streak={streak} bestStreak={bestStreak} />

            {/* Audio Player Container */}
            <div className="w-full flex justify-center py-2">
              <AudioPlayer key={round.targetId} audioUrl={round.audioUrl} />
            </div>

            {/* Answer Choices Grid */}
            <AnswerChoices
              choices={round.choices}
              onSelect={submitAnswer}
              disabled={!!result}
              selectedId={selectedId}
              correctId={result ? round.targetId : null}
            />

            {/* Result Card details */}
            <RoundResult result={result} onNext={nextRound} />
          </div>
        ) : (
          <Analytics
            birdStats={birdStats}
            resetStats={resetStats}
            onBackToQuiz={() => setView('quiz')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs text-gray-400 font-medium">
        Recordings via{' '}
        <a
          href="https://xeno-canto.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline hover:text-gray-600"
        >
          Xeno-canto
        </a>{' '}
        · Photos via{' '}
        <a
          href="https://wikipedia.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline hover:text-gray-600"
        >
          Wikipedia
        </a>
      </footer>
    </div>
  );
}

export default App;
