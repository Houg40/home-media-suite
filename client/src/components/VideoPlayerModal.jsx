import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  RotateCcw, RotateCw, X, Settings, PictureInPicture2, Sparkles, Film, Loader2 
} from 'lucide-react';

export default function VideoPlayerModal({ item, onClose, onProgressUpdate }) {
  if (!item) return null;

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const isSeekingRef = useRef(false);

  // Resume position calculation
  const initialOffset = (item.position_seconds > 5 && !item.completed) 
    ? Math.min(item.position_seconds, Math.max(0, (item.duration || 999999) - 5)) 
    : 0;

  const streamOffsetRef = useRef(initialOffset);
  const [streamOffset, setStreamOffset] = useState(initialOffset);
  const [currentTime, setCurrentTime] = useState(initialOffset);
  const [duration, setDuration] = useState(item.duration || 0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isBuffering, setIsBuffering] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPreviewTime, setSeekPreviewTime] = useState(initialOffset);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Generates stream URL with offset timestamp
  const getStreamUrl = (offset) => {
    if (offset > 0) {
      return `/api/stream/video/${item.id}?startTime=${Math.floor(offset)}&_t=${Date.now()}`;
    }
    return `/api/stream/video/${item.id}`;
  };

  const [streamSrc, setStreamSrc] = useState(() => getStreamUrl(initialOffset));

  // Controls auto-hide timer
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isSeekingRef.current) setShowControls(false);
    }, 3500);
  };

  const handleMouseMove = () => {
    resetControlsTimer();
  };

  // Save watch progress to backend
  const saveProgress = (pos) => {
    const targetDuration = duration || item.duration || 0;
    if (pos <= 0 || targetDuration <= 0) return;
    const isCompleted = pos >= targetDuration * 0.92;
    fetch(`/api/progress/${item.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        position_seconds: Math.floor(pos),
        duration_seconds: Math.floor(targetDuration),
        completed: isCompleted ? 1 : 0
      })
    }).catch(() => {});

    if (onProgressUpdate) {
      onProgressUpdate(item.id, Math.floor(pos), Math.floor(targetDuration), isCompleted);
    }
  };

  // Video timeupdate handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (!video || isSeekingRef.current) return;
      const actualTime = streamOffsetRef.current + video.currentTime;
      setCurrentTime(actualTime);
      if (!duration && video.duration && !isNaN(video.duration) && isFinite(video.duration)) {
        setDuration(video.duration);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [duration]);

  // Periodic watch progress reporter
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSeekingRef.current && currentTime > 0) {
        saveProgress(currentTime);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      // Save on unmount
      const finalPos = streamOffsetRef.current + (videoRef.current ? videoRef.current.currentTime : 0);
      saveProgress(finalPos);
    };
  }, [currentTime, duration, item.id]);

  // Commit seek to backend stream and video element
  const commitSeek = (targetTime) => {
    const maxDur = duration || item.duration || targetTime;
    const clamped = Math.max(0, Math.min(targetTime, maxDur > 0 ? maxDur : targetTime));
    
    isSeekingRef.current = false;
    setIsSeeking(false);
    setIsBuffering(true);
    streamOffsetRef.current = clamped;
    setStreamOffset(clamped);
    setCurrentTime(clamped);
    setSeekPreviewTime(clamped);

    const newUrl = getStreamUrl(clamped);
    setStreamSrc(newUrl);

    if (videoRef.current) {
      videoRef.current.src = newUrl;
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.load();
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {});
    }

    saveProgress(clamped);
    resetControlsTimer();
  };

  const seekBy = (seconds) => {
    const current = isSeekingRef.current 
      ? seekPreviewTime 
      : (streamOffsetRef.current + (videoRef.current ? videoRef.current.currentTime : 0));
    commitSeek(current + seconds);
  };

  // Keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault();
        seekBy(10);
      } else if (e.key === 'ArrowLeft' || e.key === 'j') {
        e.preventDefault();
        seekBy(-10);
      } else if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, seekPreviewTime, currentTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    resetControlsTimer();
  };

  const handleVideoClick = () => {
    if (!showControls) {
      setShowControls(true);
      resetControlsTimer();
    } else {
      togglePlay();
    }
  };

  const handleClose = () => {
    const finalPos = isSeekingRef.current 
      ? seekPreviewTime 
      : (streamOffsetRef.current + (videoRef.current ? videoRef.current.currentTime : 0));
    saveProgress(finalPos);
    onClose();
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      videoRef.current.volume = volume || 0.5;
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const togglePiP = () => {
    if (!videoRef.current) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {});
    } else {
      videoRef.current.requestPictureInPicture().catch(() => {});
    }
  };

  const setSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) videoRef.current.playbackRate = rate;
    setShowSpeedMenu(false);
  };

  const formatTime = (sec) => {
    if (isNaN(sec) || !sec || sec <= 0) return '0:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayedTime = isSeeking ? seekPreviewTime : currentTime;

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={resetControlsTimer}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={streamSrc}
        autoPlay
        playsInline
        onClick={handleVideoClick}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onCanPlay={() => setIsBuffering(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (duration > 0) saveProgress(duration);
        }}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
          <div className="p-3.5 rounded-2xl bg-zinc-900/80 backdrop-blur-md flex items-center gap-3 text-white border border-white/10 shadow-2xl">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span className="text-xs font-medium">Buffering...</span>
          </div>
        </div>
      )}

      {/* Top Header Controls */}
      <div 
        className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md">
            <Film className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white drop-shadow truncate max-w-xl">
              {item.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <span className="uppercase text-indigo-400 font-bold">{item.container}</span>
              <span>•</span>
              <span>{item.codec?.toUpperCase()}</span>
              {item.width > 0 && (
                <>
                  <span>•</span>
                  <span>{item.width}×{item.height}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="p-2.5 rounded-full bg-black/50 hover:bg-white/20 text-white transition backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Control Bar */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-300 min-w-[56px] text-right">
            {formatTime(displayedTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={displayedTime}
            onPointerDown={() => {
              isSeekingRef.current = true;
              setIsSeeking(true);
              setSeekPreviewTime(currentTime);
            }}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              isSeekingRef.current = true;
              setIsSeeking(true);
              setSeekPreviewTime(val);
            }}
            onPointerUp={(e) => commitSeek(parseFloat(e.target.value))}
            onTouchEnd={(e) => commitSeek(parseFloat(e.target.value))}
            onKeyUp={(e) => commitSeek(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2.5 transition-all"
          />

          <span className="text-xs font-mono text-zinc-400 min-w-[56px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2.5 rounded-full bg-white text-zinc-950 hover:scale-105 transition"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-zinc-950" /> : <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />}
            </button>

            {/* Skip -10s */}
            <button
              onClick={() => seekBy(-10)}
              className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition"
              title="Rewind 10s (Left Arrow / J)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip +30s */}
            <button
              onClick={() => seekBy(30)}
              className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition"
              title="Fast Forward 30s (Right Arrow / L)"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={toggleMute}
                className="text-zinc-300 hover:text-white transition"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-white/10 hover:bg-white/20 text-zinc-200 transition"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 right-0 bg-zinc-900 border border-white/10 rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 z-50">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSpeed(rate)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-mono text-left ${
                        playbackRate === rate ? 'bg-indigo-600 text-white font-bold' : 'text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture in Picture */}
            <button
              onClick={togglePiP}
              className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full text-zinc-300 hover:text-white hover:bg-white/10 transition"
              title="Fullscreen (F)"
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
