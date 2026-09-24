import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipForward, SkipBack, Disc, Music } from 'lucide-react';

export default function AudioPlayerBar({ 
  currentTrack, 
  isPlaying, 
  onTogglePlay, 
  onOpenTurntable, 
  onClose 
}) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioRef.current.duration) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const handleVolume = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 max-w-5xl mx-auto glass-panel rounded-2xl p-3 shadow-2xl border border-white/10 flex items-center justify-between gap-4 animate-slideUp">
      <audio
        ref={audioRef}
        src={`/api/stream/audio/${currentTrack.id}`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => onTogglePlay(false)}
        autoPlay
      />

      {/* Track Info */}
      <div className="flex items-center gap-3 min-w-[200px] max-w-xs cursor-pointer" onClick={onOpenTurntable}>
        <div className="relative w-12 h-12 rounded-xl bg-zinc-900 overflow-hidden shrink-0 shadow-md">
          {currentTrack.thumbnail_path ? (
            <img 
              src={currentTrack.thumbnail_path} 
              alt={currentTrack.title}
              className={`w-full h-full object-cover ${isPlaying ? 'animate-spin-slow' : ''}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-indigo-950 text-indigo-400">
              <Disc className={`w-6 h-6 ${isPlaying ? 'animate-spin' : ''}`} />
            </div>
          )}
        </div>

        <div className="truncate">
          <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{currentTrack.artist || 'Master Audio'}</p>
        </div>
      </div>

      {/* Center Controls & Progress */}
      <div className="flex-1 max-w-md flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}
            className="text-zinc-400 hover:text-white transition"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => onTogglePlay(!isPlaying)}
            className="w-9 h-9 rounded-full bg-white text-zinc-950 flex items-center justify-center shadow-lg hover:scale-105 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-zinc-950" /> : <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />}
          </button>

          <button 
            onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}
            className="text-zinc-400 hover:text-white transition"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Scrubber */}
        <div className="w-full flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-500 w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-indigo-500 hover:h-1.5 transition-all"
          />
          <span className="text-[10px] font-mono text-zinc-500 w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right Volume & Expand */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => setIsMuted(!isMuted)} className="text-zinc-400 hover:text-white">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolume}
            className="w-16 h-1 bg-white/20 rounded appearance-none cursor-pointer accent-white"
          />
        </div>

        <button
          onClick={onOpenTurntable}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition"
          title="Fullscreen Turntable View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
