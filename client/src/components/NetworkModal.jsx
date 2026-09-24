import React, { useState } from 'react';
import { X, Wifi, Smartphone, Tv, Copy, Check, Download, Sparkles } from 'lucide-react';

export default function NetworkModal({ networkInfo, onClose }) {
  const [copied, setCopied] = useState(false);

  const clientUrl = networkInfo?.clientUrls?.[0] || 'http://localhost:5173';

  const copyUrl = () => {
    navigator.clipboard.writeText(clientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-white/10 flex flex-col gap-6 animate-scaleUp">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Stream & Install on Galaxy / Mobile</h3>
              <p className="text-xs text-zinc-400">Watch your PC media from phone, tablet, or TV</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Network URL Display Card */}
        <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-5 text-center">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
            Your Local Wi-Fi Stream Address
          </div>
          
          <div className="flex items-center justify-center gap-3 bg-zinc-950 p-3 rounded-xl border border-white/10 font-mono text-sm text-indigo-300 font-bold mb-4">
            <span className="truncate select-all">{clientUrl}</span>
            <button
              onClick={copyUrl}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shrink-0"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
            Type this address into Samsung Internet or Chrome on your Galaxy phone while connected to the same Wi-Fi.
          </p>
        </div>

        {/* Samsung Galaxy App Download & Install Instructions */}
        <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Install on your Samsung Galaxy (Like PsyNurse Suite)</span>
          </div>

          <ol className="text-xs text-zinc-300 space-y-1.5 list-decimal list-inside leading-relaxed">
            <li>Open <strong className="text-white font-mono">{clientUrl}</strong> in Samsung Internet or Chrome on your Galaxy.</li>
            <li>Tap the <strong className="text-indigo-400">"Install App"</strong> button at the top, or tap browser menu <strong className="text-white">⋮</strong> and choose <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add page to &rarr; Apps screen"</strong>.</li>
            <li>Aurora will download and install directly to your Samsung Home Screen & App Drawer as a native full-screen application!</li>
          </ol>
        </div>

        {/* Device compatibility row */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <div className="font-bold text-zinc-200">Mobile & Tablet</div>
              <div className="text-[11px] text-zinc-500">Touch scrubbing & background audio</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-white/5 flex items-center gap-3">
            <Tv className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-zinc-200">Smart TV & Cast</div>
              <div className="text-[11px] text-zinc-500">Full-bleed theater fullscreen mode</div>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
