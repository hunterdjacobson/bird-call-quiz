import { useState, useMemo, useRef, useEffect } from 'react';
import birds from '../data/quizBank.json';

/**
 * Analytics component to show user progress, correct/incorrect counts,
 * and list of all birds with details.
 *
 * @param {Object} props - Component props.
 * @param {Object} props.birdStats - Stats tracking ({ [birdId]: { correct: 0, incorrect: 0 } }).
 * @param {Function} props.resetStats - Callback to clear bird stats.
 * @param {Function} props.onBackToQuiz - Callback to navigate back to quiz.
 */
function Analytics({ birdStats = {}, resetStats, onBackToQuiz }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all'); // all, encountered, unplayed, mastered, struggling
  const [sortBy, setSortBy] = useState('encountered-desc'); // name-asc, scientific-asc, family-asc, encountered-desc, accuracy-desc, accuracy-asc
  const [expandedId, setExpandedId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const audioRef = useRef(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Sync audio ref actions when playingId changes
  const handleToggleAudio = (birdId, audioUrl) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl);
    }

    if (playingId === birdId) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.pause();
      audioRef.current.src = audioUrl;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setPlayingId(birdId);
        })
        .catch(err => {
          console.error('Audio playback failed:', err);
          setPlayingId(null);
        });

      audioRef.current.onended = () => {
        setPlayingId(null);
      };
    }
  };

  // Compile statistics for each bird
  const statsList = useMemo(() => {
    return birds.map(bird => {
      const stats = birdStats[bird.id] || { correct: 0, incorrect: 0 };
      const total = stats.correct + stats.incorrect;
      const accuracy = total > 0 ? (stats.correct / total) * 100 : 0;
      return {
        ...bird,
        correct: stats.correct,
        incorrect: stats.incorrect,
        total,
        accuracy,
        encountered: total > 0
      };
    });
  }, [birdStats]);

  // Aggregate stats
  const totalBirds = statsList.length;
  const encounteredBirdsList = statsList.filter(b => b.encountered);
  const encounteredCount = encounteredBirdsList.length;
  const unplayedCount = totalBirds - encounteredCount;

  const totalGuesses = statsList.reduce((sum, b) => sum + b.total, 0);
  const totalCorrect = statsList.reduce((sum, b) => sum + b.correct, 0);
  const overallAccuracy = totalGuesses > 0 ? (totalCorrect / totalGuesses) * 100 : 0;

  // Filter lists for badges
  const masteredCount = statsList.filter(b => b.encountered && b.accuracy >= 80).length;
  const strugglingCount = statsList.filter(b => b.encountered && b.accuracy < 50).length;

  // Top performer (highest accuracy, resolving ties with total correct)
  const topBird = useMemo(() => {
    const candidates = statsList.filter(b => b.encountered && b.correct > 0);
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => b.accuracy - a.accuracy || b.correct - a.correct)[0];
  }, [statsList]);

  // Struggling bird (lowest accuracy, resolving ties with total incorrect)
  const strugglingBird = useMemo(() => {
    const candidates = statsList.filter(b => b.encountered && b.incorrect > 0);
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => a.accuracy - b.accuracy || b.incorrect - a.incorrect)[0];
  }, [statsList]);

  // Filtered and sorted birds to display
  const filteredBirds = useMemo(() => {
    let list = statsList;

    // Apply Filter
    if (filterBy === 'encountered') {
      list = list.filter(b => b.encountered);
    } else if (filterBy === 'unplayed') {
      list = list.filter(b => !b.encountered);
    } else if (filterBy === 'mastered') {
      list = list.filter(b => b.encountered && b.accuracy >= 80);
    } else if (filterBy === 'struggling') {
      list = list.filter(b => b.encountered && b.accuracy < 50);
    }

    // Apply Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        b =>
          b.common_name.toLowerCase().includes(q) ||
          b.scientific_name.toLowerCase().includes(q) ||
          b.family.toLowerCase().includes(q)
      );
    }

    // Apply Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.common_name.localeCompare(b.common_name);
      } else if (sortBy === 'scientific-asc') {
        return a.scientific_name.localeCompare(b.scientific_name);
      } else if (sortBy === 'family-asc') {
        return a.family.localeCompare(b.family);
      } else if (sortBy === 'encountered-desc') {
        if (a.encountered !== b.encountered) {
          return b.encountered ? 1 : -1;
        }
        return b.total - a.total || a.common_name.localeCompare(b.common_name);
      } else if (sortBy === 'accuracy-desc') {
        if (a.encountered !== b.encountered) {
          return b.encountered ? 1 : -1;
        }
        return b.accuracy - a.accuracy || b.total - a.total || a.common_name.localeCompare(b.common_name);
      } else if (sortBy === 'accuracy-asc') {
        if (a.encountered !== b.encountered) {
          return b.encountered ? 1 : -1; // keep unplayed at bottom
        }
        return a.accuracy - b.accuracy || b.total - a.total || a.common_name.localeCompare(b.common_name);
      }
      return 0;
    });

    return list;
  }, [statsList, filterBy, searchQuery, sortBy]);

  const handleResetClick = () => {
    if (confirmReset) {
      resetStats();
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => {
        setConfirmReset(false);
      }, 3000); // Reset confirm state after 3 seconds
    }
  };

  const getAccuracyBarColor = (accuracy) => {
    if (accuracy >= 80) return 'bg-emerald-500';
    if (accuracy >= 50) return 'bg-sky-500';
    return 'bg-rose-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6 text-gray-800 text-left">
      {/* Header and Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span>📊</span> Your Bird Call Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track your strengths and identify birds that need practice.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBackToQuiz}
            className="flex-1 sm:flex-initial px-4 py-2 bg-feather-green hover:bg-feather-green/90 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
          >
            <span>🎯</span> Back to Quiz
          </button>
          <button
            type="button"
            onClick={handleResetClick}
            className={`px-4 py-2 border font-semibold rounded-xl text-sm transition-all duration-200 ${
              confirmReset
                ? 'bg-rose-600 border-rose-600 text-white animate-pulse'
                : 'bg-white hover:bg-rose-50 border-gray-200 text-rose-600'
            }`}
          >
            {confirmReset ? 'Are you sure?' : 'Reset Stats'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Encountered Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Encountered</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">{encounteredCount}</span>
            <span className="text-sm text-gray-400">/ {totalBirds}</span>
          </div>
          <div className="mt-2 w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-feather-green h-full rounded-full transition-all duration-500"
              style={{ width: `${(encounteredCount / totalBirds) * 100}%` }}
            />
          </div>
        </div>

        {/* Accuracy Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Accuracy</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {totalGuesses > 0 ? Math.round(overallAccuracy) : '—'}
            </span>
            <span className="text-sm text-gray-400">{totalGuesses > 0 ? '%' : 'no guesses'}</span>
          </div>
          <div className="mt-2 text-xs text-gray-400 font-medium">
            {totalGuesses} total guesses so far
          </div>
        </div>

        {/* Top Performer Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Top Performer</span>
          {topBird ? (
            <div className="mt-2">
              <span className="block font-bold text-gray-800 text-sm truncate">{topBird.common_name}</span>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                {Math.round(topBird.accuracy)}% accuracy ({topBird.correct}/{topBird.total})
              </span>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-400 italic">No correct guesses yet</div>
          )}
        </div>

        {/* Struggling With Card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Struggling With</span>
          {strugglingBird ? (
            <div className="mt-2">
              <span className="block font-bold text-gray-800 text-sm truncate">{strugglingBird.common_name}</span>
              <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                {Math.round(strugglingBird.accuracy)}% accuracy ({strugglingBird.correct}/{strugglingBird.total})
              </span>
            </div>
          ) : (
            <div className="mt-2 text-sm text-gray-400 italic">No incorrect guesses yet</div>
          )}
        </div>
      </div>

      {/* Search and Filters Controls */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, scientific name, or family..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-feather-green/30 focus:border-feather-green transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <span className="text-xs font-bold text-gray-400 uppercase shrink-0">Sort By</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-feather-green/30 focus:border-feather-green transition-all cursor-pointer font-medium text-gray-700"
            >
              <option value="encountered-desc">Guesses (Most to Least)</option>
              <option value="accuracy-desc">Accuracy (Highest first)</option>
              <option value="accuracy-asc">Accuracy (Lowest first)</option>
              <option value="name-asc">Common Name (A-Z)</option>
              <option value="scientific-asc">Scientific Name (A-Z)</option>
              <option value="family-asc">Family (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setFilterBy('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filterBy === 'all'
                ? 'bg-feather-green text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            All ({totalBirds})
          </button>
          <button
            type="button"
            onClick={() => setFilterBy('encountered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filterBy === 'encountered'
                ? 'bg-feather-green text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            Encountered ({encounteredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterBy('unplayed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filterBy === 'unplayed'
                ? 'bg-feather-green text-white shadow-sm'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            Unplayed ({unplayedCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterBy('mastered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filterBy === 'mastered'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700'
            }`}
          >
            Mastered ({masteredCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterBy('struggling')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filterBy === 'struggling'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 hover:bg-rose-100/80 text-rose-700'
            }`}
          >
            Struggling ({strugglingCount})
          </button>
        </div>
      </div>

      {/* Bird list count feedback */}
      <div className="text-xs text-gray-400 font-bold uppercase">
        Showing {filteredBirds.length} of {totalBirds} Birds
      </div>

      {/* Bird Grid */}
      {filteredBirds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBirds.map(bird => {
            const isExpanded = expandedId === bird.id;
            const isPlaying = playingId === bird.id;

            return (
              <div
                key={bird.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
                  isExpanded ? 'border-feather-orange/40 ring-1 ring-feather-orange/10' : 'border-gray-100'
                } flex flex-col justify-between`}
              >
                {/* Main Card row */}
                <div
                  onClick={() => bird.encountered && setExpandedId(isExpanded ? null : bird.id)}
                  className={`p-4 flex gap-4 items-center ${
                    bird.encountered ? 'cursor-pointer' : 'cursor-default opacity-85'
                  }`}
                >
                  {/* Photo or Lock */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-gray-50 flex items-center justify-center select-none">
                    {bird.encountered && bird.thumbnail_url ? (
                      <img
                        src={bird.thumbnail_url}
                        alt={bird.common_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-300">
                        <span className="text-2xl">🔒</span>
                      </div>
                    )}
                  </div>

                  {/* Bird Names & Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-extrabold text-gray-900 truncate text-base">
                        {bird.common_name}
                      </h4>
                      {bird.encountered && (
                        <span className="shrink-0 text-xs font-semibold text-feather-orange">
                          {Math.round(bird.accuracy)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs italic text-gray-400 truncate">{bird.scientific_name}</p>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">Family: {bird.family}</p>

                    {/* Stats or Lock text */}
                    {bird.encountered ? (
                      <div className="mt-2">
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex">
                          <div
                            className={`${getAccuracyBarColor(bird.accuracy)} h-full rounded-l-full`}
                            style={{ width: `${bird.accuracy}%` }}
                          />
                          <div
                            className="bg-gray-200 h-full rounded-r-full"
                            style={{ width: `${100 - bird.accuracy}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase mt-1">
                          <span>{bird.correct} correct</span>
                          <span>{bird.incorrect} incorrect</span>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-block text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md mt-2 uppercase tracking-wide">
                        Locked (Unencountered)
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details section */}
                {bird.encountered && isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-50 bg-feather-cream/10 flex flex-col gap-3">
                    {/* Fun Fact */}
                    {bird.fun_fact && (
                      <div className="text-xs text-gray-700 italic border-l-2 border-feather-orange/40 pl-2 py-0.5">
                        {bird.fun_fact}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-4 pt-1 mt-1 border-t border-gray-100/50">
                      {/* Audio Controls */}
                      <button
                        type="button"
                        onClick={() => handleToggleAudio(bird.id, bird.audio_url)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                          isPlaying
                            ? 'bg-feather-orange text-white'
                            : 'bg-feather-green/10 text-feather-green hover:bg-feather-green/20'
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <span>⏸</span> Pause Call
                          </>
                        ) : (
                          <>
                            <span>🔊</span> Play Call
                          </>
                        )}
                      </button>

                      {/* Wiki Credit / Source */}
                      {bird.recordist && (
                        <span className="text-[10px] text-gray-400 truncate">
                          Recordist: {bird.recordist}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-gray-400 text-lg font-medium">No birds found matching the filters/search query.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterBy('all');
            }}
            className="mt-4 text-sm font-semibold text-feather-green hover:underline focus:outline-none"
          >
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default Analytics;
