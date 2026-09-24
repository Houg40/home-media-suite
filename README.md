# Aurora • Home Media Suite

A self-hosted, cinematic home media streaming platform built for streaming videos, audio, and photos from your PC to any web browser on your local network (mobile, iPad, smart TV, or laptop).

---

## Key Capabilities

1. **Adaptive Universal Streaming Pipeline (FFmpeg 9.0)**
   - **Direct Play:** Instant HTTP 206 Partial Content (Byte-Range) streaming for web-native files (MP4, WebM, MP3, JPEG, PNG, WebP) with zero CPU overhead.
   - **On-The-Fly Remuxing:** Instant container swapping (e.g. `.mkv` with H.264 $\rightarrow$ live `.mp4` stream) copying video packets without re-encoding.
   - **Live Transcoding:** Real-time hardware-accelerated transcoding for incompatible formats (`.avi`, `.wmv`, `.flv`, `.ts`, HEVC on unsupported browsers, AC3/DTS audio, `.flac`, `.alac`, `.heic`, `.tiff`, `.raw`).

2. **State-of-the-Art Luxury Interface**
   - **Dynamic Ambient Canvas:** Background shifts colors based on active media artwork with glassmorphic depth.
   - **Hero Showcase:** Apple TV / Infuse-inspired featured banners for high-resolution 4K/1080p and master audio tracks.
   - **Cinematic Theater Video Player:** Custom scrubber bar with buffered indicators, resume playback tracking, speed selector (0.5x–2x), picture-in-picture, and fullscreen.
   - **Audiophile Music Deck & Turntable:** Sticky floating glassmorphic bar that expands into a full-screen turntable with animated vinyl record and soundwave visualizer.
   - **Photographer Lightbox:** High-res photo viewer with fluid zoom, pan, slideshow auto-play, and EXIF camera metadata drawer.

3. **Local Wi-Fi Streaming & Samsung Galaxy PWA App**
   - Built-in network discovery provides your local IP address (e.g., `http://192.168.88.7:5173`) so you can stream your PC media from anywhere in your home.
   - **Downloadable App for Samsung Galaxy / Mobile:** Installable as a standalone, native-feeling PWA application directly from Chrome or Samsung Internet with 1-click header install prompt, offline app shell caching, and custom app icons.

4. **Multi-Folder Library Management & Presentation Controls**
   - **Selectable Presentation:** Toggle any folder between **Presented** and **Hidden** to curate exactly what appears in your catalog without modifying files on disk.
   - **Interactive Folder Filter Bar:** Filter catalog views by specific directories or view all presented media at once.
   - Automatically indexes Windows default media folders:
     - `C:\Users\ignac\Videos`
     - `C:\Users\ignac\Music`
     - `C:\Users\ignac\Pictures`
   - Plus a built-in **Universal Format Showcase** demo directory with pre-generated MKV, AVI, FLAC, and TIFF files for instant testing.
   - Add/remove any custom directory or external hard drive from the UI anytime.

---

## One-Click Startup (Windows)

Simply double-click:
```cmd
start.bat
```
This automatically boots the server on port 3001 and the client on port 5173, and launches your browser.

---

## Manual Startup

### 1. Start Server
```powershell
cd server
npm install
node index.js
```

### 2. Start Client
```powershell
cd client
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).
