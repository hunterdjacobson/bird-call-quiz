/**
 * Shuffles an array using the Fisher-Yates algorithm.
 * 
 * @param {Array} array - The array to shuffle.
 * @returns {Array} A new shuffled array.
 */
export function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Helper to get up to a specified number of random elements from an array.
 * 
 * @param {Array} arr - The array to select from.
 * @param {number} count - The number of elements to select.
 * @returns {Array} A new array containing the selected elements.
 */
function getRandomElements(arr, count) {
  return shuffle(arr).slice(0, count);
}

/**
 * Selects a target bird and three distractor birds for a quiz round based on difficulty.
 * 
 * @param {Array<Object>} birds - The array of all available bird objects.
 * @param {string} [difficulty='easy'] - The difficulty level ('easy' or 'hard').
 * @returns {Object} The round configuration:
 *   - targetId {string|number} The ID of the target bird.
 *   - audioUrl {string} The URL of the target bird's recording.
 *   - choices {Array<Object>} Shuffled list of 4 choices (target + 3 distractors),
 *     where each choice has 'id' and 'common_name'.
 */
export function pickRound(birds, difficulty = 'easy') {
  if (!birds || birds.length === 0) {
    throw new Error('Birds array must not be empty.');
  }

  // 1. Pick one random bird object as the target
  const targetIndex = Math.floor(Math.random() * birds.length);
  const target = birds[targetIndex];

  // 2. Pick 3 distractor birds
  let distractors = [];

  if (difficulty === 'hard') {
    // Prefer birds from the SAME family as the target (excluding the target)
    const sameFamilyCandidates = birds.filter(
      b => b.family === target.family && b.id !== target.id
    );
    const chosenSame = getRandomElements(sameFamilyCandidates, 3);
    distractors.push(...chosenSame);

    // If fewer than 3 exist in that family, fill the remainder with random birds from other families
    if (distractors.length < 3) {
      const needed = 3 - distractors.length;
      const otherFamilyCandidates = birds.filter(
        b => b.family !== target.family
      );
      const chosenOther = getRandomElements(otherFamilyCandidates, needed);
      distractors.push(...chosenOther);
    }
  } else {
    // Prefer birds from a DIFFERENT family than the target
    const differentFamilyCandidates = birds.filter(
      b => b.family !== target.family
    );
    const chosenDifferent = getRandomElements(differentFamilyCandidates, 3);
    distractors.push(...chosenDifferent);

    // In the rare case we have fewer than 3 birds in other families,
    // fill the remainder with birds from the same family (excluding target)
    if (distractors.length < 3) {
      const needed = 3 - distractors.length;
      const sameFamilyCandidates = birds.filter(
        b => b.family === target.family && b.id !== target.id
      );
      const chosenSame = getRandomElements(sameFamilyCandidates, needed);
      distractors.push(...chosenSame);
    }
  }

  // 3. Build an array of the 4 bird objects, shuffle it
  const pool = [target, ...distractors];
  const shuffled = shuffle(pool);

  // 4. Return the round details
  return {
    targetId: target.id,
    audioUrl: target.audio_url,
    choices: shuffled.map(b => ({
      id: b.id,
      common_name: b.common_name
    }))
  };
}

/**
 * Checks if the selected answer matches the target bird.
 * 
 * @param {string|number} targetId - The ID of the target bird.
 * @param {string|number} answerId - The ID of the chosen bird.
 * @returns {boolean} True if the answer is correct, false otherwise.
 */
export function checkAnswer(targetId, answerId) {
  return answerId === targetId;
}
