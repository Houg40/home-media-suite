import React, { useState } from 'react';
import { X, FolderPlus, Trash2, RefreshCw, Folder, HardDrive, Eye, EyeOff, CheckCircle, Sparkles } from 'lucide-react';

export default function LibraryModal({ 
  folders = [], 
  onClose, 
  onAddFolder, 
  onDeleteFolder, 
  onToggleFolder,
  onOpenSetupWizard,
  onTriggerScan, 
  isScanning 
}) {
  const [newPath, setNewPath] = useState('');
  const [folderType, setFolderType] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPath.trim()) return;
    onAddFolder(newPath.trim(), folderType);
    setNewPath('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-6 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Media Library &amp; Folder Presentation</h3>
              <p className="text-xs text-zinc-400">Select which PC folders to present in your media catalog</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Folder Form */}
        <form onSubmit={handleSubmit} className="space-y-3 bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
          <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <FolderPlus className="w-4 h-4 text-indigo-400" />
            <span>Add Custom PC Directory</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. D:\Movies or C:\Users\ignac\Downloads"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <select
              value={folderType}
              onChange={(e) => setFolderType(e.target.value)}
              className="px-3 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Media</option>
              <option value="videos">Videos Only</option>
              <option value="music">Music Only</option>
              <option value="pictures">Photos Only</option>
            </select>
            <button
              type="submit"
              disabled={!newPath.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0"
            >
              Add Folder
            </button>
          </div>
        </form>

        {/* Existing Folders List with Presentation Selectors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Configured PC Directories ({folders.length})</span>
            <button
              onClick={onTriggerScan}
              disabled={isScanning}
              className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 disabled:opacity-50 font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Scan Now'}</span>
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {folders.map((f) => {
              const isEnabled = f.is_enabled === 1 || f.is_enabled === null || f.is_enabled === undefined;
              return (
                <div
                  key={f.id}
                  className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 text-xs ${
                    isEnabled 
                      ? 'bg-zinc-900/60 border-white/10' 
                      : 'bg-zinc-950/40 border-white/5 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-xl shrink-0 ${isEnabled ? 'bg-indigo-500/10 text-indigo-400' : 'bg-zinc-800 text-zinc-500'}`}>
                      <Folder className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-200 truncate">{f.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-zinc-400 shrink-0">
                          {f.item_count || 0} items
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 truncate">{f.path}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle Presentation Button */}
                    <button
                      onClick={() => onToggleFolder && onToggleFolder(f.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        isEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                      }`}
                      title={isEnabled ? "Folder is currently presented in the catalog (click to hide)" : "Folder is currently hidden (click to present)"}
                    >
                      {isEnabled ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Presented</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Hidden</span>
                        </>
                      )}
                    </button>

                    {/* Delete Custom Folder Button */}
                    <button
                      onClick={() => onDeleteFolder(f.id)}
                      className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      title="Remove directory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-white/10">
          {onOpenSetupWizard && (
            <button
              onClick={onOpenSetupWizard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Initial Setup Wizard</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition ml-auto"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
