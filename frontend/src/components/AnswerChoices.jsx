/**
 * AnswerChoices component to display multiple choice options.
 *
 * @param {Object} props - Component props.
 * @param {Array<Object>} props.choices - The array of choice bird objects (each having 'id' and 'common_name').
 * @param {Function} props.onSelect - Callback fired when a choice is clicked.
 * @param {boolean} props.disabled - True if selection is disabled (e.g. while loading).
 * @param {string|number|null} props.selectedId - The ID of the selected choice, if any.
 * @param {string|number|null} props.correctId - The ID of the correct bird, if already submitted.
 */
function AnswerChoices({ choices = [], onSelect, disabled, selectedId, correctId }) {
  const hasSubmitted = correctId !== null && correctId !== undefined;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mx-auto px-4">
      {choices.map((choice) => {
        const isCorrect = hasSubmitted && choice.id === correctId;
        const isSelectedIncorrect = hasSubmitted && choice.id === selectedId && selectedId !== correctId;
        const isDimmed = hasSubmitted && !isCorrect && !isSelectedIncorrect;

        let buttonClasses = 'choice-button';

        if (isCorrect) {
          buttonClasses += ' choice-correct';
        } else if (isSelectedIncorrect) {
          buttonClasses += ' choice-incorrect';
        } else if (isDimmed) {
          buttonClasses += ' opacity-40 cursor-not-allowed';
        }

        return (
          <button
            key={choice.id}
            type="button"
            disabled={disabled || hasSubmitted}
            onClick={() => onSelect(choice.id)}
            className={buttonClasses}
          >
            {choice.common_name}
          </button>
        );
      })}
    </div>
  );
}

export default AnswerChoices;
