import React, { useState, useEffect } from 'react';
import AmbientBackdrop from './components/AmbientBackdrop';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import MediaGrid from './components/MediaGrid';
import VideoPlayerModal from './components/VideoPlayerModal';
import AudioPlayerBar from './components/AudioPlayerBar';
import TurntableModal from './components/TurntableModal';
import PhotoGalleryModal from './components/PhotoGalleryModal';
import LibraryModal from './components/LibraryModal';
import NetworkModal from './components/NetworkModal';
import SetupWizardModal from './components/SetupWizardModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState('all');
  const [media, setMedia] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [libraryFolders, setLibraryFolders] = useState([]);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showSetupWizard, setShowSetupWizard] = useState(false);

  // Active Players State
  const [activeVideo, setActiveVideo] = useState(null);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [showTurntable, setShowTurntable] = useState(false);
  const [activePhoto, setActivePhoto] = useState(null);

  // PWA Install Prompt for Galaxy / Android
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handlePrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Check if initial user setup is completed
  useEffect(() => {
    fetch('/api/setup/status')
      .then(res => res.json())
      .then(data => {
        if (!data.setupCompleted) {
          setShowSetupWizard(true);
        }
      })
      .catch(console.error);
  }, []);

  const handleSetupComplete = () => {
    setShowSetupWizard(false);
    fetchMedia();
    fetchFeatured();
    fetchInProgress();
    fetchLibraryFolders();
    setIsScanning(true);
    setTimeout(() => {
      fetchMedia();
      fetchFeatured();
      fetchInProgress();
      fetchLibraryFolders();
      setIsScanning(false);
    }, 4000);
  };

  // Fetch initial data & react to filters
  useEffect(() => {
    fetchMedia();
    fetchFeatured();
    fetchInProgress();
    fetchLibraryFolders();
    fetchNetworkInfo();
  }, [activeTab, searchQuery, selectedFolderId]);

  const fetchMedia = async () => {
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('type', activeTab);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedFolderId && selectedFolderId !== 'all') params.append('folder_id', selectedFolderId);
      const res = await fetch(`/api/media?${params.toString()}`);
      const data = await res.json();
      setMedia(data);
    } catch (err) {
      console.error('Error fetching media:', err);
    }
  };

  const fetchFeatured = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFolderId && selectedFolderId !== 'all') params.append('folder_id', selectedFolderId);
      const res = await fetch(`/api/featured?${params.toString()}`);
      const data = await res.json();
      setFeatured(data);
    } catch (err) {
      console.error('Error fetching featured:', err);
    }
  };

  const fetchInProgress = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedFolderId && selectedFolderId !== 'all') params.append('folder_id', selectedFolderId);
      const res = await fetch(`/api/in-progress?${params.toString()}`);
      const data = await res.json();
      setInProgress(data);
    } catch (err) {
      console.error('Error fetching in-progress:', err);
    }
  };

  const fetchLibraryFolders = async () => {
    try {
      const res = await fetch('/api/library/folders');
      const data = await res.json();
      setLibraryFolders(data);
    } catch (err) {}
  };

  const fetchNetworkInfo = async () => {
    try {
      const res = await fetch('/api/system/network');
      const data = await res.json();
      setNetworkInfo(data);
    } catch (err) {}
  };

  const handleSelectMedia = (item) => {
    if (item.type === 'video') {
      // Pause audio if playing video
      setIsAudioPlaying(false);
      setActiveVideo(item);
    } else if (item.type === 'audio') {
      setCurrentAudioTrack(item);
      setIsAudioPlaying(true);
    } else if (item.type === 'image') {
      setActivePhoto(item);
    }
  };

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      await fetch('/api/library/scan', { method: 'POST' });
      // Poll progress for 4 seconds then refresh
      setTimeout(() => {
        fetchMedia();
        fetchFeatured();
        fetchInProgress();
        fetchLibraryFolders();
        setIsScanning(false);
      }, 4000);
    } catch (e) {
      setIsScanning(false);
    }
  };

  const handleAddFolder = async (path, type) => {
    try {
      await fetch('/api/library/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, type })
      });
      fetchLibraryFolders();
      handleTriggerScan();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFolder = async (id) => {
    try {
      await fetch(`/api/library/folders/${id}`, { method: 'DELETE' });
      fetchLibraryFolders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleFolder = async (id) => {
    try {
      await fetch(`/api/library/folders/${id}/toggle`, { method: 'PATCH' });
      await fetchLibraryFolders();
      await fetchMedia();
      await fetchFeatured();
      await fetchInProgress();
    } catch (e) {
      console.error(e);
    }
  };

  const handleProgressUpdate = (id, pos, dur, completed) => {
    fetchInProgress();
  };

  // Determine ambient background theme
  const getAmbientTheme = () => {
    if (activeVideo) return 'video';
    if (currentAudioTrack && isAudioPlaying) return 'audio';
    if (activePhoto) return 'image';
    if (activeTab !== 'all') return activeTab;
    return 'default';
  };

  const allPhotos = media.filter(m => m.type === 'image');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Ambient Blur Canvas */}
      <AmbientBackdrop activeTheme={getAmbientTheme()} />

      {/* Main Glass Navigation Bar */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isScanning={isScanning}
        onTriggerScan={handleTriggerScan}
        onOpenLibrary={() => setShowLibraryModal(true)}
        onOpenNetwork={() => setShowNetworkModal(true)}
        installPromptAvailable={!!deferredPrompt}
        onInstallApp={handleInstallApp}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10 pb-32">
        
        {/* Apple TV-Style Hero Showcase (only in 'all' or 'video' mode when not searching) */}
        {!searchQuery && (activeTab === 'all' || activeTab === 'video') && (
          <HeroBanner
            featured={featured}
            onPlayMedia={handleSelectMedia}
          />
        )}

        {/* Media Catalog Grid */}
        <MediaGrid
          media={media}
          inProgress={inProgress}
          folders={libraryFolders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onManageFolders={() => setShowLibraryModal(true)}
          onSelectMedia={handleSelectMedia}
        />
      </main>

      {/* Sticky Audiophile Bottom Player Bar */}
      {currentAudioTrack && (
        <AudioPlayerBar
          currentTrack={currentAudioTrack}
          isPlaying={isAudioPlaying}
          onTogglePlay={setIsAudioPlaying}
          onOpenTurntable={() => setShowTurntable(true)}
          onClose={() => setCurrentAudioTrack(null)}
        />
      )}

      {/* Fullscreen Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          item={activeVideo}
          onClose={() => setActiveVideo(null)}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {/* Fullscreen Vinyl Turntable Modal */}
      {showTurntable && currentAudioTrack && (
        <TurntableModal
          track={currentAudioTrack}
          isPlaying={isAudioPlaying}
          onTogglePlay={setIsAudioPlaying}
          onClose={() => setShowTurntable(false)}
        />
      )}

      {/* High-Res Photo Lightbox Modal */}
      {activePhoto && (
        <PhotoGalleryModal
          photo={activePhoto}
          allPhotos={allPhotos}
          onClose={() => setActivePhoto(null)}
          onSelectPhoto={setActivePhoto}
        />
      )}

      {/* Library PC Folders Modal */}
      {showLibraryModal && (
        <LibraryModal
          folders={libraryFolders}
          onClose={() => setShowLibraryModal(false)}
          onAddFolder={handleAddFolder}
          onDeleteFolder={handleDeleteFolder}
          onToggleFolder={handleToggleFolder}
          onOpenSetupWizard={() => {
            setShowLibraryModal(false);
            setShowSetupWizard(true);
          }}
          onTriggerScan={handleTriggerScan}
          isScanning={isScanning}
        />
      )}

      {/* Local Wi-Fi Streaming Info Modal */}
      {showNetworkModal && (
        <NetworkModal
          networkInfo={networkInfo}
          onClose={() => setShowNetworkModal(false)}
        />
      )}

      {/* Initial User Setup & Onboarding Wizard */}
      {showSetupWizard && (
        <SetupWizardModal
          isDismissable={true}
          onClose={() => setShowSetupWizard(false)}
          onCompleteSetup={handleSetupComplete}
        />
      )}
    </div>
  );
}
