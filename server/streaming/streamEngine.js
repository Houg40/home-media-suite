const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const mime = require('mime-types');

// Native web browser formats
const NATIVE_VIDEO_CONTAINERS = new Set(['.mp4', '.webm', '.m4v']);
const NATIVE_VIDEO_CODECS = new Set(['h264', 'avc1', 'vp8', 'vp9', 'av1']);
const NATIVE_AUDIO_CODECS = new Set(['aac', 'mp3', 'opus', 'vorbis']);

const NATIVE_AUDIO_CONTAINERS = new Set(['.mp3', '.aac', '.m4a', '.wav', '.ogg']);
const NATIVE_IMAGE_CONTAINERS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

/**
 * Streams video using Direct Play (HTTP 206) or Adaptive Remux/Transcode via FFmpeg
 */
function streamVideo(req, res, mediaItem) {
  const filePath = mediaItem.filepath;
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Media file not found on disk');
  }

  const ext = path.extname(filePath).toLowerCase();
  const codec = (mediaItem.codec || '').toLowerCase();
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  const isNative = NATIVE_VIDEO_CONTAINERS.has(ext) && (NATIVE_VIDEO_CODECS.has(codec) || !codec);

  // 1. DIRECT PLAY: Byte-range request for native video
  if (isNative) {
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime.lookup(ext) || 'video/mp4',
      };

      res.writeHead(206, headers);
      fileStream.pipe(res);
    } else {
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': mime.lookup(ext) || 'video/mp4',
      };
      res.writeHead(200, headers);
      fs.createReadStream(filePath).pipe(res);
    }
    return;
  }

  // 2. ON-THE-FLY ADAPTIVE TRANSCODE / REMUX
  // Supports MKV, AVI, WMV, FLV, TS, HEVC, AC3, DTS etc.
  const seekTime = parseFloat(req.query.startTime) || 0;

  // Decide if video stream can be copied or must be transcoded
  const canCopyVideo = NATIVE_VIDEO_CODECS.has(codec);
  const videoCodecArg = canCopyVideo ? ['-c:v', 'copy'] : ['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23'];
  const audioCodecArg = ['-c:a', 'aac', '-b:a', '192k', '-ac', '2'];

  const ffmpegArgs = [
    ...(seekTime > 0 ? ['-ss', String(seekTime)] : []),
    '-i', filePath,
    ...videoCodecArg,
    ...audioCodecArg,
    '-f', 'mp4',
    '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
    'pipe:1'
  ];

  res.writeHead(200, {
    'Content-Type': 'video/mp4',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache, no-store'
  });

  const ffmpegProc = spawn('ffmpeg', ffmpegArgs, { stdio: ['ignore', 'pipe', 'ignore'] });

  ffmpegProc.stdout.pipe(res);

  req.on('close', () => {
    try {
      ffmpegProc.kill('SIGKILL');
    } catch (e) {}
  });

  ffmpegProc.on('error', (err) => {
    console.error('FFmpeg transcode stream error:', err.message);
  });
}

/**
 * Streams audio using Direct Play or live transcoding to MP3/AAC
 */
function streamAudio(req, res, mediaItem) {
  const filePath = mediaItem.filepath;
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Audio file not found on disk');
  }

  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  const isNative = NATIVE_AUDIO_CONTAINERS.has(ext);

  // 1. Direct Play
  if (isNative) {
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime.lookup(ext) || 'audio/mpeg',
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mime.lookup(ext) || 'audio/mpeg',
      });
      fs.createReadStream(filePath).pipe(res);
    }
    return;
  }

  // 2. Transcode FLAC, ALAC, WMA, APE to 320k MP3 on the fly
  res.writeHead(200, {
    'Content-Type': 'audio/mpeg',
    'Transfer-Encoding': 'chunked'
  });

  const proc = spawn('ffmpeg', [
    '-i', filePath,
    '-c:a', 'libmp3lame',
    '-b:a', '320k',
    '-f', 'mp3',
    'pipe:1'
  ]);

  proc.stdout.pipe(res);

  req.on('close', () => {
    try {
      proc.kill('SIGKILL');
    } catch (e) {}
  });
}

/**
 * Streams images (serves native images directly, or converts HEIC/TIFF/RAW to WebP)
 */
function streamImage(req, res, mediaItem) {
  const filePath = mediaItem.filepath;
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Image file not found on disk');
  }

  const ext = path.extname(filePath).toLowerCase();
  const isNative = NATIVE_IMAGE_CONTAINERS.has(ext);

  if (isNative) {
    res.setHeader('Content-Type', mime.lookup(ext) || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return fs.createReadStream(filePath).pipe(res);
  }

  // Transmute HEIC, TIFF, RAW to WebP
  res.writeHead(200, {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=86400'
  });

  const proc = spawn('ffmpeg', [
    '-i', filePath,
    '-c:v', 'libwebp',
    '-quality', '90',
    '-f', 'image2pipe',
    'pipe:1'
  ]);

  proc.stdout.pipe(res);

  req.on('close', () => {
    try {
      proc.kill('SIGKILL');
    } catch (e) {}
  });
}

module.exports = {
  streamVideo,
  streamAudio,
  streamImage
};
