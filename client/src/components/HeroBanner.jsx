import React, { useState, useEffect } from 'react';
import { Play, Volume2, Sparkles, ChevronRight, ChevronLeft, ShieldCheck, Film } from 'lucide-react';

export default function HeroBanner({ featured = [], onPlayMedia }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featured.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featured.length]);

  if (!featured || featured.length === 0) return null;

  const active = featured[currentIndex] || featured[0];

  const getFormatBadge = (item) => {
    if (item.width >= 3840) return '4K UHD';
    if (item.width >= 1920) return '1080p Full HD';
    if (item.width >= 1280) return '720p HD';
    if (item.type === 'audio') return item.codec?.toUpperCase() || 'LOSSLESS';
    if (item.type === 'image') return item.container?.toUpperCase() || 'HI-RES';
    return item.container?.toUpperCase() || 'MEDIA';
  };

  const formatDuration = (sec) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden mb-10 glass-panel border border-white/10 shadow-2xl">
      {/* Background Poster / Thumbnail with Dark Gradient Overlay */}
      <div className="relative h-[380px] sm:h-[440px] w-full overflow-hidden">
        {active.thumbnail_path ? (
          <img
            src={active.thumbnail_path}
            alt={active.title}
            className="w-full h-full object-cover object-center scale-105 filter brightness-50 contrast-125 transition-transform duration-1000"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-indigo-950 via-zinc-900 to-violet-950" />
        )}

        {/* Cinematic Vignette & Gradient Fades */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-end max-w-3xl z-10">
          
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-3">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-black tracking-wider uppercase bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              {getFormatBadge(active)}
            </span>

            {active.codec && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-white/10 text-zinc-300 border border-white/10">
                {active.codec}
              </span>
            )}

            {active.duration > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/5">
                {formatDuration(active.duration)}
              </span>
            )}

            {active.container && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono text-zinc-400 bg-white/5 border border-white/5 uppercase">
                {active.container}
              </span>
            )}

            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold ml-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Universal Adaptive Stream</span>
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-md">
            {active.title}
          </h1>

          {/* Subtitle / Artist / Album */}
          {(active.artist || active.album) && (
            <p className="text-sm sm:text-base font-medium text-zinc-300 mb-6 drop-shadow">
              {active.artist} {active.album ? `• ${active.album}` : ''}
            </p>
          )}

          {/* Call to action buttons */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onPlayMedia(active)}
              className="px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm flex items-center gap-2.5 shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              {active.type === 'video' ? <Play className="w-4 h-4 fill-zinc-950" /> : <Volume2 className="w-4 h-4" />}
              <span>{active.type === 'video' ? 'Play in Theater' : 'Stream Master Audio'}</span>
            </button>

            {active.position_seconds > 0 && !active.completed && (
              <div className="text-xs text-zinc-400 font-mono">
                Resume from {formatDuration(active.position_seconds)}
              </div>
            )}
          </div>
        </div>

        {/* Carousel Switchers */}
        {featured.length > 1 && (
          <div className="absolute right-6 bottom-8 z-10 flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + featured.length) % featured.length)}
              className="p-2 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 text-white transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {featured.map((_, i) => (
                <span
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                    currentIndex === i ? 'w-6 bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % featured.length)}
              className="p-2 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-white/10 text-white transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
