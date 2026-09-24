import React from 'react';

export default function AmbientBackdrop({ activeTheme = 'default' }) {
  // Theme color maps for ambient glow
  const themes = {
    default: {
      blob1: 'bg-indigo-600/20',
      blob2: 'bg-violet-700/15',
      blob3: 'bg-fuchsia-600/10'
    },
    video: {
      blob1: 'bg-blue-600/25',
      blob2: 'bg-indigo-700/20',
      blob3: 'bg-cyan-600/15'
    },
    audio: {
      blob1: 'bg-emerald-600/25',
      blob2: 'bg-teal-700/20',
      blob3: 'bg-purple-600/15'
    },
    image: {
      blob1: 'bg-amber-600/20',
      blob2: 'bg-rose-700/15',
      blob3: 'bg-orange-600/15'
    }
  };

  const current = themes[activeTheme] || themes.default;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dark baseline overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-950/95 to-zinc-950" />

      {/* Dynamic ambient blobs */}
      <div 
        className={`absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] transition-all duration-1000 ambient-blob ${current.blob1}`} 
      />
      <div 
        className={`absolute top-1/4 -right-40 w-[650px] h-[650px] rounded-full blur-[150px] transition-all duration-1000 ambient-blob ${current.blob2}`} 
        style={{ animationDelay: '-4s' }}
      />
      <div 
        className={`absolute -bottom-40 left-1/3 w-[700px] h-[700px] rounded-full blur-[160px] transition-all duration-1000 ambient-blob ${current.blob3}`} 
        style={{ animationDelay: '-8s' }}
      />

      {/* Film grain effect for cinema feel */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />
    </div>
  );
}
