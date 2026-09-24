import React, { useState } from 'react';
import { X, Play, Copy, Check, Film, Music, Image as ImageIcon, Folder, HardDrive, Info, Clock, Monitor } from 'lucide-react';
import { cleanMediaTitle, formatBytes } from '../utils/formatters';

export default function MediaInfoModal({ item, onClose, onPlayMedia }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!item) return null;

  const { clean, subtitle } = cleanMediaTitle(item.title, item.filename);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatDuration = (sec) => {
    if (!sec) return 'N/A';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const isVideo = item.type === 'video';
  const isAudio = item.type === 'audio';
  const isImage = item.type === 'image';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg glass-panel rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-5 animate-scaleUp max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
              {isVideo && <Film className="w-5 h-5" />}
              {isAudio && <Music className="w-5 h-5" />}
              {isImage && <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-white leading-snug">{clean}</h3>
              {subtitle && <p className="text-xs font-mono text-zinc-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnail preview */}
        {item.thumbnail_path && (
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-950 border border-white/5">
            <img 
              src={item.thumbnail_path} 
              alt={clean} 
              className="w-full h-full object-cover"
            />
            {item.duration > 0 && (
              <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs font-mono bg-black/80 text-zinc-200">
                {formatDuration(item.duration)}
              </span>
            )}
          </div>
        )}

        {/* Technical specs grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-zinc-500 uppercase">Resolution</div>
            <div className="font-bold text-zinc-200 mt-0.5">
              {item.width > 0 ? `${item.width} × ${item.height}` : 'Audio Only'}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-zinc-500 uppercase">Format & Codec</div>
            <div className="font-bold text-zinc-200 mt-0.5 uppercase">
              {item.codec || item.container || 'Unknown'}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-zinc-500 uppercase">File Size</div>
            <div className="font-bold text-zinc-200 mt-0.5">
              {formatBytes(item.filesize)}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/5">
            <div className="text-[10px] text-zinc-500 uppercase">Duration</div>
            <div className="font-bold text-zinc-200 mt-0.5">
              {formatDuration(item.duration)}
            </div>
          </div>

          <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/5 col-span-2 sm:col-span-2">
            <div className="text-[10px] text-zinc-500 uppercase">Folder Origin</div>
            <div className="font-bold text-indigo-300 mt-0.5 truncate flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 shrink-0" />
              <span>{item.folder_name || 'Library'}</span>
            </div>
          </div>
        </div>

        {/* Full filename details with copy */}
        <div className="space-y-2 text-xs">
          <div>
            <div className="text-[11px] text-zinc-400 font-semibold mb-1 flex items-center justify-between">
              <span>Full Exact Filename:</span>
              <button 
                onClick={() => copyToClipboard(item.filename, 'filename')}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedField === 'filename' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'filename' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 font-mono text-[11px] text-zinc-300 break-all select-all">
              {item.filename}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-zinc-400 font-semibold mb-1 flex items-center justify-between">
              <span>PC Storage Filepath:</span>
              <button 
                onClick={() => copyToClipboard(item.filepath, 'filepath')}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                {copiedField === 'filepath' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedField === 'filepath' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 font-mono text-[11px] text-zinc-400 break-all select-all">
              {item.filepath}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onPlayMedia(item);
            }}
            className="flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Play Now</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
