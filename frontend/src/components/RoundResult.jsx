/**
 * RoundResult component to display feedback and bird details after answering.
 *
 * @param {Object} props - Component props.
 * @param {Object|null} props.result - The result of the current round.
 * @param {boolean} props.result.correct - Whether the user answered correctly.
 * @param {string} props.result.common_name - Common name of the bird.
 * @param {string} props.result.scientific_name - Scientific name of the bird.
 * @param {string} [props.result.thumbnail_url] - URL to the bird's photo thumbnail.
 * @param {string} [props.result.fun_fact] - A short fun fact about the bird.
 * @param {string} [props.result.recordist] - Name of the audio recordist.
 * @param {string} [props.result.license_url] - URL to the audio recording license.
 * @param {Function} props.onNext - Callback to start the next round.
 */
function RoundResult({ result, onNext }) {
  if (!result) return null;

  return (
    <div className="w-full max-w-xl mx-auto mt-8 p-6 bg-white border border-gray-100 rounded-2xl shadow-xl transition-all duration-300 transform scale-100 flex flex-col items-center gap-4 text-center">
      {/* Header Feedback */}
      <h3 className={`text-2xl font-bold ${result.correct ? 'text-feather-green' : 'text-feather-orange'}`}>
        {result.correct ? 'Correct! 🎉' : 'Not quite 🙁'}
      </h3>

      {/* Bird image or 🐦 placeholder */}
      {result.thumbnail_url ? (
        <img
          src={result.thumbnail_url}
          alt={result.common_name}
          className="rounded-xl object-cover max-h-[200px] w-auto shadow-md border border-gray-100"
        />
      ) : (
        <div className="w-32 h-32 flex items-center justify-center bg-feather-cream/30 text-5xl rounded-full border border-dashed border-feather-green/30 select-none">
          🐦
        </div>
      )}

      {/* Bird Names */}
      <div>
        <h4 className="text-xl font-bold text-gray-800">{result.common_name}</h4>
        <p className="text-sm italic text-gray-500">{result.scientific_name}</p>
      </div>

      {/* Fun Fact */}
      {result.fun_fact && (
        <blockquote className="w-full px-4 py-2 bg-feather-cream/20 border-l-4 border-feather-orange/50 text-gray-700 text-sm text-left italic rounded-r-lg">
          {result.fun_fact}
        </blockquote>
      )}

      {/* License / Credits */}
      {result.recordist && (
        <p className="text-xs text-gray-400">
          {result.license_url ? (
            <a
              href={result.license_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 transition-colors"
            >
              Recording by {result.recordist} via Xeno-canto
            </a>
          ) : (
            `Recording by ${result.recordist} via Xeno-canto`
          )}
        </p>
      )}

      {/* Next button */}
      <button
        type="button"
        onClick={onNext}
        className="w-full mt-2 py-3 px-6 text-white font-semibold rounded-xl bg-feather-green hover:bg-feather-green/90 active:scale-98 transition-all shadow-md focus:outline-none focus:ring-4 focus:ring-feather-green/20"
      >
        Next Bird →
      </button>
    </div>
  );
}

export default RoundResult;
