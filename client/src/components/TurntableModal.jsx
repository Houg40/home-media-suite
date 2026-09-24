import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Disc, Volume2, Sparkles, Music2 } from 'lucide-react';

export default function TurntableModal({ track, isPlaying, onTogglePlay, onClose }) {
  if (!track) return null;

  // Visualizer animated bars
  const [visualizerHeights, setVisualizerHeights] = useState(Array(32).fill(20));

  useEffect(() => {
    if (!isPlaying) {
      setVisualizerHeights(Array(32).fill(12));
      return;
    }
    const interval = setInterval(() => {
      setVisualizerHeights(Array(32).fill(0).map(() => Math.floor(Math.random() * 60) + 15));
    }, 120);
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl flex flex-col justify-between p-8 sm:p-14 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Music2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest uppercase text-indigo-400 font-bold">
              AUDIOPHILE DECK
            </span>
            <div className="text-xs text-zinc-400">Master Lossless Audio Engine</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center Turntable and Vinyl Record */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 my-auto">
        
        {/* Spinning Vinyl Record Container */}
        <div className="relative group">
          <div className="w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-zinc-900 via-black to-zinc-900 border-4 border-zinc-800/80 shadow-[0_0_80px_rgba(99,102,241,0.2)] flex items-center justify-center p-3 relative">
            
            {/* Vinyl Grooves (concentric circles) */}
            <div className="absolute inset-4 rounded-full border border-white/5" />
            <div className="absolute inset-8 rounded-full border border-white/5" />
            <div className="absolute inset-12 rounded-full border border-white/5" />
            <div className="absolute inset-16 rounded-full border border-white/5" />
            <div className="absolute inset-20 rounded-full border border-white/5" />

            {/* Spinning Center Label / Album Art */}
            <div 
              className={`w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl relative ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '6s' }}
            >
              {track.thumbnail_path ? (
                <img 
                  src={track.thumbnail_path} 
                  alt={track.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full bg-indigo-900 flex items-center justify-center">
                  <Disc className="w-12 h-12 text-indigo-300" />
                </div>
              )}
              {/* Spindle hole */}
              <div className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-zinc-950 border-2 border-white/30" />
            </div>
          </div>
        </div>

        {/* Track Metadata & Audio Specs */}
        <div className="max-w-md text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white">
              {track.codec?.toUpperCase() || 'AUDIO'}
            </span>
            {track.bitrate > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10">
                {Math.round(track.bitrate / 1000)} kbps
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/10 uppercase">
              {track.container}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            {track.title}
          </h1>

          <p className="text-lg text-zinc-300 font-medium mb-1">
            {track.artist || 'Unknown Artist'}
          </p>

          {track.album && (
            <p className="text-sm text-zinc-500 font-mono mb-6">
              Album: {track.album} {track.year ? `(${track.year})` : ''}
            </p>
          )}

          {/* Soundwave Visualizer Bars */}
          <div className="flex items-end justify-center lg:justify-start gap-1 h-16 my-6">
            {visualizerHeights.map((h, i) => (
              <div
                key={i}
                className="w-1.5 bg-gradient-to-t from-indigo-500 via-violet-500 to-fuchsia-400 rounded-full transition-all duration-100"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          {/* Big Play/Pause Toggle */}
          <button
            onClick={() => onTogglePlay(!isPlaying)}
            className="px-8 py-3.5 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-extrabold text-sm flex items-center justify-center gap-3 shadow-2xl transition hover:scale-105 active:scale-95 mx-auto lg:mx-0"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-zinc-950" /> : <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />}
            <span>{isPlaying ? 'Pause Track' : 'Resume Playback'}</span>
          </button>
        </div>

      </div>

      {/* Bottom Status */}
      <div className="flex items-center justify-between text-xs text-zinc-500 font-mono pt-4 border-t border-white/5">
        <span>File: {track.filename}</span>
        <span>Universal Audio Engine • Direct & Transcoded Streaming</span>
      </div>
    </div>
  );
}
