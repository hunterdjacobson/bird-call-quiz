import { useState, useCallback } from 'react'
import { pickRound, checkAnswer } from '../lib/gameLogic'
import birds from '../data/quizBank.json'

/**
 * Custom React hook managing the state and actions of the bird call quiz game.
 *
 * @returns {Object} Game state and handler functions:
 *   - round {Object|null} Details of the current active round (targetId, audioUrl, choices).
 *   - result {Object|null} Verification details of the user's answer.
 *   - score {number} Current score (total correct answers).
 *   - streak {number} Current consecutive correct answers.
 *   - bestStreak {number} High score streak persisted in localStorage.
 *   - selectedId {string|number|null} The ID of the option selected by the user in the current round.
 *   - difficulty {string} The active game difficulty ('easy' or 'hard').
 *   - submitAnswer {Function} Submits a choice and updates score, streak, and bestStreak.
 *   - nextRound {Function} Resets current state and begins a new round.
 *   - setDifficultyLevel {Function} Updates difficulty level and triggers a new round.
 */
function useGame() {
  const [difficulty, setDifficulty] = useState('easy');
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [birdStats, setBirdStats] = useState({});

  // Lazy initialize best streak from localStorage
  const [bestStreak, setBestStreak] = useState(() => {
    const saved = localStorage.getItem('bird-quiz-best-streak');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  // Lazy initialize the first round synchronously using the default difficulty ('easy')
  const [round, setRound] = useState(() => pickRound(birds, 'easy'));

  /**
   * Resets the round result and selected ID, then picks a new target bird and choices.
   *
   * @param {string} [diffOverride] - Optional difficulty override (used when changing difficulty).
   */
  const nextRound = useCallback((diffOverride) => {
    setResult(null);
    setSelectedId(null);
    const activeDifficulty = diffOverride !== undefined ? diffOverride : difficulty;
    const newRound = pickRound(birds, activeDifficulty);
    setRound(newRound);
  }, [difficulty]);

  /**
   * Verifies the chosen answer and updates scores and streaks.
   *
   * @param {string|number} answerId - The ID of the chosen bird choice.
   */
  const submitAnswer = useCallback((answerId) => {
    if (!round) return;

    setSelectedId(answerId);
    const isCorrect = checkAnswer(round.targetId, answerId);

    // Retrieve the target bird's full information from the quiz bank
    const targetBird = birds.find(b => b.id === round.targetId);

    const resultObj = {
      correct: isCorrect,
      common_name: targetBird?.common_name || '',
      scientific_name: targetBird?.scientific_name || '',
      thumbnail_url: targetBird?.thumbnail_url || null,
      fun_fact: targetBird?.fun_fact || null,
      recordist: targetBird?.recordist || null,
      license_url: targetBird?.license_url || null,
    };

    setResult(resultObj);

    // Update bird analytics locally
    setBirdStats(prev => {
      const current = prev[round.targetId] || { correct: 0, incorrect: 0 };
      return {
        ...prev,
        [round.targetId]: {
          correct: current.correct + (isCorrect ? 1 : 0),
          incorrect: current.incorrect + (isCorrect ? 0 : 1)
        }
      };
    });

    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prevStreak => {
        const newStreak = prevStreak + 1;
        setBestStreak(prevBest => {
          if (newStreak > prevBest) {
            localStorage.setItem('bird-quiz-best-streak', newStreak.toString());
            return newStreak;
          }
          return prevBest;
        });
        return newStreak;
      });
    } else {
      setStreak(0);
    }
  }, [round]);

  /**
   * Sets the active difficulty level and starts a new round with the updated level.
   *
   * @param {string} level - The new difficulty level ('easy' or 'hard').
   */
  const setDifficultyLevel = useCallback((level) => {
    setDifficulty(level);
    nextRound(level);
  }, [nextRound]);

  /**
   * Resets the accumulated bird stats.
   */
  const resetStats = useCallback(() => {
    setBirdStats({});
  }, []);

  return {
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
  };
}

export default useGame;
