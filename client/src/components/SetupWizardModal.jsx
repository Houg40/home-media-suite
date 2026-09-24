import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  FolderCheck, 
  FolderPlus, 
  Film, 
  Music, 
  Image as ImageIcon, 
  HardDrive, 
  Check, 
  ArrowRight, 
  X, 
  SlidersHorizontal,
  CheckCircle2,
  FolderSync
} from 'lucide-react';

export default function SetupWizardModal({ 
  onClose, 
  onCompleteSetup, 
  isDismissable = false 
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detectedFolders, setDetectedFolders] = useState([]);
  const [selectedMap, setSelectedMap] = useState({}); // { [path]: boolean }
  const [customPath, setCustomPath] = useState('');
  const [customType, setCustomType] = useState('all');

  // Fetch detected folders on mount
  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        const detected = data.detectedFolders || [];
        setDetectedFolders(detected);

        // Pre-select recommended folders by default
        const initialSelected = {};
        detected.forEach(f => {
          if (f.recommended) {
            initialSelected[f.path] = true;
          }
        });
        setSelectedMap(initialSelected);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch setup status:', err);
        setLoading(false);
      });
  }, []);

  const toggleFolder = (folderPath) => {
    setSelectedMap(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleSelectAll = (selectAll) => {
    const next = {};
    detectedFolders.forEach(f => {
      next[f.path] = selectAll;
    });
    setSelectedMap(next);
  };

  const handleAddCustomFolder = (e) => {
    e.preventDefault();
    const clean = customPath.trim();
    if (!clean) return;

    // Check if already in list
    if (detectedFolders.some(f => f.path.toLowerCase() === clean.toLowerCase())) {
      setSelectedMap(prev => ({ ...prev, [clean]: true }));
      setCustomPath('');
      return;
    }

    const newFolder = {
      path: clean,
      name: clean.split(/[\\/]/).filter(Boolean).pop() || clean,
      type: customType,
      recommended: false,
      description: 'Custom user directory'
    };

    setDetectedFolders(prev => [newFolder, ...prev]);
    setSelectedMap(prev => ({ ...prev, [clean]: true }));
    setCustomPath('');
  };

  const handleFinish = async () => {
    setSubmitting(true);

    const payload = detectedFolders.map(f => ({
      path: f.path,
      name: f.name,
      type: f.type,
      is_enabled: !!selectedMap[f.path]
    }));

    try {
      await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folders: payload })
      });

      if (onCompleteSetup) {
        onCompleteSetup();
      }
    } catch (err) {
      console.error('Failed to complete setup:', err);
      setSubmitting(false);
    }
  };

  const selectedCount = Object.values(selectedMap).filter(Boolean).length;

  const getFolderIcon = (type) => {
    if (type === 'videos') return <Film className="w-5 h-5 text-indigo-400" />;
    if (type === 'music') return <Music className="w-5 h-5 text-violet-400" />;
    if (type === 'pictures') return <ImageIcon className="w-5 h-5 text-emerald-400" />;
    return <Sparkles className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10 flex flex-col gap-6 animate-scaleUp my-8">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold tracking-wide uppercase mb-1">
                Initial User Setup
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Welcome to Aurora • Choose Your Media
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Select which PC folders you want Aurora to catalog and present across your devices.
              </p>
            </div>
          </div>

          {isDismissable && onClose && (
            <button 
              onClick={onClose} 
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Custom Folder Input Box */}
        <form onSubmit={handleAddCustomFolder} className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-2">
          <div className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <FolderPlus className="w-4 h-4 text-indigo-400" />
            <span>Add Custom PC Directory (Optional)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder="e.g. D:\Movies or C:\Users\ignac\Downloads"
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <div className="flex items-center gap-2">
              <select
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                className="px-3 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-xs text-zinc-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Media</option>
                <option value="videos">Videos Only</option>
                <option value="music">Music Only</option>
                <option value="pictures">Photos Only</option>
              </select>
              <button
                type="submit"
                disabled={!customPath.trim()}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shrink-0"
              >
                Add
              </button>
            </div>
          </div>
        </form>

        {/* Discovered Media Folders Checklist */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <FolderCheck className="w-4 h-4 text-emerald-400" />
              <span>Discovered PC Directories ({detectedFolders.length})</span>
            </span>

            <div className="flex items-center gap-3 text-zinc-400">
              <button 
                type="button" 
                onClick={() => handleSelectAll(true)}
                className="hover:text-indigo-400 transition font-medium"
              >
                Select All
              </button>
              <span>•</span>
              <button 
                type="button" 
                onClick={() => handleSelectAll(false)}
                className="hover:text-zinc-200 transition font-medium"
              >
                Deselect All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
              <FolderSync className="w-8 h-8 animate-spin text-indigo-400" />
              <span className="text-xs">Detecting system media folders...</span>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
              {detectedFolders.map((folder) => {
                const isSelected = !!selectedMap[folder.path];
                return (
                  <div
                    key={folder.path}
                    onClick={() => toggleFolder(folder.path)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 group ${
                      isSelected
                        ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm'
                        : 'bg-zinc-900/40 border-white/5 opacity-60 hover:opacity-100 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 overflow-hidden">
                      <div className={`p-2.5 rounded-xl shrink-0 transition ${
                        isSelected ? 'bg-indigo-600/20 border border-indigo-500/30' : 'bg-zinc-800'
                      }`}>
                        {getFolderIcon(folder.type)}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-zinc-100 group-hover:text-indigo-200 transition truncate">
                            {folder.name}
                          </span>
                          {folder.recommended && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 truncate">{folder.description}</div>
                        <div className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">{folder.path}</div>
                      </div>
                    </div>

                    {/* Custom Checkbox Pill */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition shrink-0 ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/30' 
                        : 'border-zinc-700 bg-zinc-900 text-transparent'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer & Actions */}
        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>
              <strong>{selectedCount}</strong> folder{selectedCount === 1 ? '' : 's'} selected for presentation
            </span>
          </div>

          <button
            onClick={handleFinish}
            disabled={submitting || selectedCount === 0}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {submitting ? (
              <>
                <FolderSync className="w-4 h-4 animate-spin" />
                <span>Configuring Libraries...</span>
              </>
            ) : (
              <>
                <span>Complete Setup &amp; Launch Aurora</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
