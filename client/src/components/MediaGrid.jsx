import React from 'react';
import { Play, Volume2, Maximize2, Clock, Film, Music, Image as ImageIcon, Heart, Folder, SlidersHorizontal } from 'lucide-react';

export default function MediaGrid({ 
  media = [], 
  inProgress = [], 
  folders = [],
  selectedFolderId = 'all',
  onSelectFolder,
  onManageFolders,
  onSelectMedia, 
  onToggleFavorite 
}) {
  const formatDuration = (sec) => {
    if (!sec) return '';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getBadge = (item) => {
    if (item.width >= 3840) return '4K';
    if (item.width >= 1920) return '1080p';
    if (item.width >= 1280) return '720p';
    if (item.type === 'audio') return item.codec?.toUpperCase() || 'AUDIO';
    return item.container?.toUpperCase() || '';
  };

  // Group items by type if showing "all"
  const videos = media.filter(m => m.type === 'video');
  const audio = media.filter(m => m.type === 'audio');
  const images = media.filter(m => m.type === 'image');

  return (
    <div className="space-y-12">
      {/* 1. Continue Watching Row */}
      {inProgress.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Continue Watching</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">{inProgress.length} in progress</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {inProgress.map(item => {
              const pct = item.duration > 0 ? (item.position_seconds / item.duration) * 100 : 0;
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectMedia(item)}
                  className="glass-card rounded-2xl overflow-hidden cursor-pointer group relative"
                >
                  <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                    {item.thumbnail_path ? (
                      <img 
                        src={item.thumbnail_path} 
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                        <Film className="w-8 h-8 text-zinc-700" />
                      </div>
                    )}

                    {/* Play hover button */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-zinc-950 flex items-center justify-center shadow-lg">
                        <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />
                      </div>
                    </div>

                    {/* Progress Bar at bottom of thumbnail */}
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-950/80">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-r-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-3.5">
                    <h3 className="font-bold text-sm text-zinc-100 truncate group-hover:text-indigo-300 transition">
                      {item.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-zinc-500 mt-1 font-mono">
                      <span>Resume at {formatDuration(item.position_seconds)}</span>
                      <span>{formatDuration(item.duration)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Main Media Catalog */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Media Catalog</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">({media.length} items)</span>
          </div>

          {/* Folder Selection & Presentation Bar */}
          {folders && folders.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => onSelectFolder && onSelectFolder('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                  selectedFolderId === 'all'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>All Folders</span>
              </button>

              {folders
                .filter(f => f.is_enabled === 1 || f.is_enabled === null || f.is_enabled === undefined)
                .map(f => (
                  <button
                    key={f.id}
                    onClick={() => onSelectFolder && onSelectFolder(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 ${
                      String(selectedFolderId) === String(f.id)
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>{f.name}</span>
                    {f.item_count !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">
                        {f.item_count}
                      </span>
                    )}
                  </button>
                ))}

              {onManageFolders && (
                <button
                  onClick={onManageFolders}
                  className="px-2.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800/80 border border-white/5 transition shrink-0 flex items-center gap-1 font-semibold"
                  title="Select which folders are presented in the library"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Select Folders</span>
                </button>
              )}
            </div>
          )}
        </div>

        {media.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-2xl p-8">
            <Film className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-zinc-300 font-bold text-base">No Media Files Found</h3>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto">
              Scan your PC media folders or add a custom folder in Library Settings to index your movies, songs, and photos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {media.map(item => {
              const isVideo = item.type === 'video';
              const isAudio = item.type === 'audio';
              const isImage = item.type === 'image';

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectMedia(item)}
                  className="glass-card rounded-2xl overflow-hidden cursor-pointer group flex flex-col relative"
                >
                  {/* Thumbnail Viewport */}
                  <div className={`relative ${isVideo ? 'aspect-video' : 'aspect-square'} bg-zinc-900 overflow-hidden`}>
                    {item.thumbnail_path ? (
                      <img
                        src={item.thumbnail_path}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900/80">
                        {isVideo && <Film className="w-8 h-8 text-zinc-700" />}
                        {isAudio && <Music className="w-8 h-8 text-zinc-700" />}
                        {isImage && <ImageIcon className="w-8 h-8 text-zinc-700" />}
                      </div>
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                      {getBadge(item) && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md text-white border border-white/10">
                          {getBadge(item)}
                        </span>
                      )}
                    </div>

                    {/* Duration / Dimensions Bottom Badge */}
                    <div className="absolute bottom-2 right-2 z-10">
                      {item.duration > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/70 backdrop-blur-md text-zinc-300">
                          {formatDuration(item.duration)}
                        </span>
                      )}
                      {isImage && item.width > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/70 backdrop-blur-md text-zinc-300">
                          {item.width}×{item.height}
                        </span>
                      )}
                    </div>

                    {/* Hover Overlay Play Icon */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10">
                      <div className="w-11 h-11 rounded-full bg-white/95 text-zinc-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                        {isVideo && <Play className="w-5 h-5 fill-zinc-950 ml-0.5" />}
                        {isAudio && <Volume2 className="w-5 h-5 text-zinc-950" />}
                        {isImage && <Maximize2 className="w-5 h-5 text-zinc-950" />}
                      </div>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-xs text-zinc-100 truncate group-hover:text-indigo-300 transition">
                        {item.title}
                      </h3>
                      {(item.artist || item.album) && (
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {item.artist || item.album}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[10px] font-mono text-zinc-500 uppercase">
                      <span>{item.container}</span>
                      <span>{(item.filesize / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
