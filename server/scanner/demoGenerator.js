const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEMO_DIR = path.join(__dirname, '..', 'data', 'demo_media');
if (!fs.existsSync(DEMO_DIR)) {
  fs.mkdirSync(DEMO_DIR, { recursive: true });
}

function runFfmpegCommand(args) {
  return new Promise((resolve) => {
    const proc = spawn('ffmpeg', args);
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

async function generateDemoMedia() {
  const mkvVideo = path.join(DEMO_DIR, 'Nebula_Odyssey_Trailer.mkv');
  const aviVideo = path.join(DEMO_DIR, 'Archive_Film_Test.avi');
  const flacAudio = path.join(DEMO_DIR, 'Celestial_Ambient_Soundtrack.flac');
  const mp3Audio = path.join(DEMO_DIR, 'Midnight_Synthwave_Journey.mp3');
  const tiffImage = path.join(DEMO_DIR, 'Cosmic_Pillars_DeepSpace.tiff');
  const pngImage = path.join(DEMO_DIR, 'Aurora_Borealis_4K.png');

  // 1. Generate MKV Video (Demonstrates MKV Remuxing Pipeline)
  if (!fs.existsSync(mkvVideo)) {
    console.log('Generating demo MKV video...');
    await runFfmpegCommand([
      '-f', 'lavfi', '-i', 'testsrc=duration=30:size=1920x1080:rate=30',
      '-f', 'lavfi', '-i', 'sine=frequency=432:duration=30',
      '-vf', 'drawtext=text=Nebula Odyssey (MKV Stream):fontcolor=white:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2',
      '-c:v', 'libx264', '-preset', 'ultrafast',
      '-c:a', 'aac',
      '-y', mkvVideo
    ]);
  }

  // 2. Generate AVI Video (Demonstrates Legacy Codec Transcoding)
  if (!fs.existsSync(aviVideo)) {
    console.log('Generating demo AVI video...');
    await runFfmpegCommand([
      '-f', 'lavfi', '-i', 'smptebars=duration=20:size=1280x720:rate=24',
      '-f', 'lavfi', '-i', 'sine=frequency=1000:duration=20',
      '-vf', 'drawtext=text=Vintage Archive Reel (AVI Transcode):fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2',
      '-c:v', 'mpeg4', '-q:v', '5',
      '-c:a', 'mp2',
      '-y', aviVideo
    ]);
  }

  // 3. Generate FLAC Audio (Demonstrates Audiophile FLAC streaming)
  if (!fs.existsSync(flacAudio)) {
    console.log('Generating demo FLAC audio...');
    await runFfmpegCommand([
      '-f', 'lavfi', '-i', 'sine=frequency=528:duration=45',
      '-metadata', 'title=Celestial Harmonics',
      '-metadata', 'artist=Solaris Ensemble',
      '-metadata', 'album=Aether Journeys',
      '-metadata', 'genre=Ambient',
      '-c:a', 'flac',
      '-y', flacAudio
    ]);
  }

  // 4. Generate MP3 Audio
  if (!fs.existsSync(mp3Audio)) {
    console.log('Generating demo MP3 audio...');
    await runFfmpegCommand([
      '-f', 'lavfi', '-i', 'sine=frequency=330:duration=40',
      '-metadata', 'title=Midnight Horizon',
      '-metadata', 'artist=Synthwave Pulse',
      '-metadata', 'album=Cyber Neon 2088',
      '-metadata', 'genre=Electronic',
      '-c:a', 'libmp3lame', '-b:a', '320k',
      '-y', mp3Audio
    ]);
  }

  // 5. Generate TIFF Photo (Demonstrates TIFF/RAW on-the-fly conversion)
  if (!fs.existsSync(tiffImage)) {
    console.log('Generating demo TIFF image...');
    await runFfmpegCommand([
      '-f', 'lavfi', '-i', 'mandelbrot=size=1920x1080',
      '-vframes', '1',
      '-y', tiffImage
    ]);
  }

  // 6. Generate PNG Photo
  if (!fs.existsSync(pngImage)) {
    console.log('Generating demo PNG image...');
    await runFfmpegCommand([
      '-f', 'lavfi', '-i', 'testsrc2=size=1920x1080',
      '-vframes', '1',
      '-y', pngImage
    ]);
  }

  return DEMO_DIR;
}

module.exports = {
  DEMO_DIR,
  generateDemoMedia
};
