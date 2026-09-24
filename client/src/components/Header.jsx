import React from 'react';
import { 
  PlaySquare, Film, Music, Image as ImageIcon, Search, 
  Wifi, FolderCog, RefreshCw, Sparkles, Download, Smartphone 
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  onTabChange, 
  searchQuery, 
  onSearchChange, 
  isScanning, 
  onTriggerScan, 
  onOpenLibrary, 
  onOpenNetwork,
  installPromptAvailable,
  onInstallApp
}) {
  const tabs = [
    { id: 'all', label: 'All Media', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'video', label: 'Cinema & Video', icon: <Film className="w-4 h-4" /> },
    { id: 'audio', label: 'Music & Audio', icon: <Music className="w-4 h-4" /> },
    { id: 'image', label: 'Photo Gallery', icon: <ImageIcon className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-30 px-6 py-4 glass-panel border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3 self-start md:self-auto cursor-pointer" onClick={() => onTabChange('all')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-fuchsia-500 p-[1px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-xl flex items-center justify-center">
              <PlaySquare className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">AURORA</span>
              <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                SUITE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 tracking-wide">Universal Home Streaming Platform</p>
          </div>
        </div>

        {/* Category Navigation Pills */}
        <nav className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900/60 border border-white/5 shadow-inner">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          
          {/* Search Bar */}
          <div className="relative flex-1 md:w-48">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900/70 border border-white/10 rounded-lg text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Galaxy / Android App Install Button */}
          {installPromptAvailable && (
            <button
              onClick={onInstallApp}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 hover:scale-105 transition"
              title="Install Aurora on your Samsung Galaxy or Android device"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Action buttons */}
          <button
            onClick={onTriggerScan}
            disabled={isScanning}
            className="p-2 rounded-lg bg-zinc-900/70 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition disabled:opacity-50"
            title="Scan PC Media Folders"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={onOpenNetwork}
            className="p-2 rounded-lg bg-zinc-900/70 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-indigo-400 transition"
            title="Stream to Phone, Tablet, or TV"
          >
            <Wifi className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenLibrary}
            className="p-2 rounded-lg bg-zinc-900/70 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white transition"
            title="Manage Scanned Library Folders"
          >
            <FolderCog className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
