import { useState, useRef, useEffect } from 'react'

/**
 * AudioPlayer component to play bird call audio.
 *
 * @param {Object} props - Component props.
 * @param {string} props.audioUrl - The URL of the audio file to play.
 */
function AudioPlayer({ audioUrl }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [prevAudioUrl, setPrevAudioUrl] = useState(audioUrl);
  const audioRef = useRef(null);

  // Sync state when audioUrl changes
  if (audioUrl !== prevAudioUrl) {
    setPrevAudioUrl(audioUrl);
    setIsPlaying(false);
  }

  // Load the new audio file when audioUrl changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((error) => {
          console.error('Audio playback failed:', error);
        });
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = 0;
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch((error) => {
        console.error('Audio playback failed:', error);
      });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setIsPlaying(false)}
        preload="auto"
      />

      {/* Circular Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`relative w-20 h-20 flex items-center justify-center rounded-full bg-feather-green text-white hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-feather-green/30 ${
          isPlaying ? 'pulse-ring' : ''
        }`}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isPlaying ? (
          <span className="text-3xl">⏸</span>
        ) : (
          <span className="text-3xl ml-1">▶</span>
        )}
      </button>

      {/* Replay Text Button */}
      <button
        type="button"
        onClick={handleReplay}
        className="text-sm font-medium text-feather-green/80 hover:text-feather-green hover:underline focus:outline-none transition-colors"
      >
        Replay
      </button>
    </div>
  );
}

export default AudioPlayer;
