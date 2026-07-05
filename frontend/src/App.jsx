import useGame from './hooks/useGame'
import AudioPlayer from './components/AudioPlayer'
import AnswerChoices from './components/AnswerChoices'
import RoundResult from './components/RoundResult'
import ScoreBoard from './components/ScoreBoard'

function App() {
  const {
    round,
    result,
    score,
    streak,
    bestStreak,
    selectedId,
    difficulty,
    submitAnswer,
    nextRound,
    setDifficultyLevel
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

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 flex flex-col justify-between items-center text-gray-800 font-sans">
      {/* Header and Quiz Interface */}
      <main className="w-full max-w-2xl flex flex-col items-center gap-8">
        {/* Title */}
        <header className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 flex items-center justify-center gap-2">
            <span>🐦</span> Bird Call Quiz
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium uppercase tracking-wider">
            Listen. Guess. Learn.
          </p>
        </header>

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
        <div className="w-full flex justify-center py-4">
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
