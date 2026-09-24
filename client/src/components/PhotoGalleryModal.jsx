import React, { useState, useEffect } from 'react';
import { 
  X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, 
  Play, Pause, Info, Image as ImageIcon, Camera 
} from 'lucide-react';

export default function PhotoGalleryModal({ photo, allPhotos = [], onClose, onSelectPhoto }) {
  if (!photo) return null;

  const [zoom, setZoom] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [isSlideshow, setIsSlideshow] = useState(false);

  const currentIndex = allPhotos.findIndex(p => p.id === photo.id);

  // Auto-advance in slideshow mode
  useEffect(() => {
    if (!isSlideshow || allPhotos.length <= 1) return;
    const interval = setInterval(() => {
      const nextIdx = (currentIndex + 1) % allPhotos.length;
      onSelectPhoto(allPhotos[nextIdx]);
      setZoom(1);
    }, 4500);
    return () => clearInterval(interval);
  }, [isSlideshow, currentIndex, allPhotos]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextPhoto();
      else if (e.key === 'ArrowLeft') prevPhoto();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, allPhotos]);

  const nextPhoto = () => {
    if (allPhotos.length <= 1) return;
    const nextIdx = (currentIndex + 1) % allPhotos.length;
    onSelectPhoto(allPhotos[nextIdx]);
    setZoom(1);
  };

  const prevPhoto = () => {
    if (allPhotos.length <= 1) return;
    const prevIdx = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
    onSelectPhoto(allPhotos[prevIdx]);
    setZoom(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col justify-between select-none">
      
      {/* Top Action Bar */}
      <div className="p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between z-20">
        <div>
          <h2 className="text-base font-bold text-white drop-shadow truncate max-w-md">
            {photo.title}
          </h2>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
            <span className="uppercase text-indigo-400 font-bold">{photo.container}</span>
            <span>•</span>
            <span>{photo.width} × {photo.height}</span>
            <span>•</span>
            <span>{(photo.filesize / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.3, 3))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.3, 0.7))}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Slideshow */}
          <button
            onClick={() => setIsSlideshow(!isSlideshow)}
            className={`p-2 rounded-lg transition ${
              isSlideshow ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Toggle Slideshow"
          >
            {isSlideshow ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Info Drawer */}
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 rounded-lg transition ${
              showInfo ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="EXIF Details"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main High-Res Image Viewport */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4">
        {/* Navigation Chevrons */}
        {allPhotos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-6 z-20 p-3 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-md transition hover:scale-105"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-6 z-20 p-3 rounded-full bg-black/60 hover:bg-white/20 text-white backdrop-blur-md transition hover:scale-105"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        <img
          src={`/api/stream/image/${photo.id}`}
          alt={photo.title}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{ transform: `scale(${zoom})` }}
        />

        {/* Info / EXIF Slide-out Panel */}
        {showInfo && (
          <div className="absolute right-6 top-6 bottom-6 w-80 glass-panel rounded-2xl p-5 shadow-2xl z-30 flex flex-col justify-between animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 pb-3 mb-4 border-b border-white/10">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Metadata & EXIF</h3>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">File Name</span>
                  <span className="text-zinc-200 break-all">{photo.filename}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Dimensions</span>
                  <span className="text-zinc-200">{photo.width} × {photo.height} px</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Format & Container</span>
                  <span className="text-zinc-200 uppercase">{photo.container} ({photo.codec || 'Native'})</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">File Size</span>
                  <span className="text-zinc-200">{(photo.filesize / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Location</span>
                  <span className="text-zinc-400 break-all text-[11px]">{photo.filepath}</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-zinc-500 pt-3 border-t border-white/5">
              Universal Image Transmuter (HEIC / TIFF / RAW supported)
            </div>
          </div>
        )}
      </div>

      {/* Bottom Counter */}
      <div className="p-4 text-center text-xs font-mono text-zinc-500">
        {currentIndex + 1} of {allPhotos.length}
      </div>
    </div>
  );
}
