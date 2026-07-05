/**
 * ScoreBoard component to display current score, current streak, and best streak.
 *
 * @param {Object} props - Component props.
 * @param {number} props.score - The current score.
 * @param {number} props.streak - The current consecutive correct answers.
 * @param {number} props.bestStreak - The highest streak achieved.
 */
function ScoreBoard({ score = 0, streak = 0, bestStreak = 0 }) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="bg-feather-cream border border-feather-orange/20 rounded-2xl p-4 shadow-md flex justify-around items-center gap-2 sm:gap-4">
        {/* Score Block */}
        <div className="flex flex-col items-center flex-1 text-center">
          <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
            Score
          </span>
          <span className="mt-1 text-2xl sm:text-3xl font-extrabold text-feather-green">
            {score}
          </span>
        </div>

        {/* Divider */}
        <div className="h-10 w-[1px] bg-feather-orange/20" />

        {/* Streak Block */}
        <div className="flex flex-col items-center flex-1 text-center">
          <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
            Streak
          </span>
          <span className="mt-1 text-2xl sm:text-3xl font-extrabold text-feather-orange flex items-center gap-1 justify-center">
            {streak >= 3 && <span className="animate-bounce">🔥</span>}
            {streak}
          </span>
        </div>

        {/* Divider */}
        <div className="h-10 w-[1px] bg-feather-orange/20" />

        {/* Best Streak Block */}
        <div className="flex flex-col items-center flex-1 text-center">
          <span className="text-xs font-bold tracking-wider text-gray-500 uppercase">
            Best Streak
          </span>
          <span className="mt-1 text-2xl sm:text-3xl font-extrabold text-gray-700">
            {bestStreak}
          </span>
        </div>
      </div>
    </div>
  );
}

export default ScoreBoard;
