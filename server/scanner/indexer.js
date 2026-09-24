const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const db = require('../db/database');

const THUMBNAILS_DIR = path.join(__dirname, '..', 'data', 'thumbnails');
if (!fs.existsSync(THUMBNAILS_DIR)) {
  fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

const EXTENSIONS = {
  video: new Set(['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv', '.ts', '.m4v', '.wmv', '.vob', '.3gp', '.mpg', '.mpeg']),
  audio: new Set(['.mp3', '.flac', '.wav', '.aac', '.ogg', '.m4a', '.wma', '.alac', '.opus', '.ape']),
  image: new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.tiff', '.tif', '.bmp', '.svg', '.raw', '.cr2', '.nef', '.arw'])
};

function getMediaType(ext) {
  const cleanExt = ext.toLowerCase();
  if (EXTENSIONS.video.has(cleanExt)) return 'video';
  if (EXTENSIONS.audio.has(cleanExt)) return 'audio';
  if (EXTENSIONS.image.has(cleanExt)) return 'image';
  return null;
}

// Execute ffprobe on file
function probeFile(filePath) {
  return new Promise((resolve) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ];
    const proc = spawn('ffprobe', args);
    let output = '';

    proc.stdout.on('data', (d) => { output += d; });
    proc.on('close', (code) => {
      if (code !== 0 || !output) return resolve(null);
      try {
        resolve(JSON.parse(output));
      } catch (e) {
        resolve(null);
      }
    });
    proc.on('error', () => resolve(null));
  });
}

// Generate WebP thumbnail
function generateThumbnail(filePath, type, mediaId, duration = 0) {
  return new Promise((resolve) => {
    const thumbName = `thumb_${mediaId}.webp`;
    const thumbPath = path.join(THUMBNAILS_DIR, thumbName);

    if (fs.existsSync(thumbPath)) {
      return resolve(`/api/thumbnail/${thumbName}`);
    }

    let args = [];
    if (type === 'video') {
      const seekTime = duration > 10 ? Math.min(duration * 0.15, 60) : 1;
      args = [
        '-ss', String(seekTime),
        '-i', filePath,
        '-vframes', '1',
        '-vf', 'scale=640:-1',
        '-c:v', 'libwebp',
        '-quality', '80',
        '-y',
        thumbPath
      ];
    } else if (type === 'image') {
      args = [
        '-i', filePath,
        '-vf', 'scale=640:-1',
        '-c:v', 'libwebp',
        '-quality', '85',
        '-y',
        thumbPath
      ];
    } else if (type === 'audio') {
      // Try to extract embedded album art
      args = [
        '-i', filePath,
        '-an',
        '-vcodec', 'libwebp',
        '-quality', '85',
        '-y',
        thumbPath
      ];
    }

    if (args.length === 0) return resolve(null);

    const proc = spawn('ffmpeg', args);
    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(thumbPath)) {
        resolve(`/api/thumbnail/${thumbName}`);
      } else {
        resolve(null);
      }
    });
    proc.on('error', () => resolve(null));
  });
}

// Recursively find files in directory
async function scanDirectory(dirPath, folderId = null, folderName = null, onProgress = null) {
  const filesList = [];

  function walk(current) {
    if (!fs.existsSync(current)) return;
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) {
          // Skip hidden and system folders
          if (!entry.name.startsWith('.') && !['node_modules', '$RECYCLE.BIN', 'System Volume Information'].includes(entry.name)) {
            walk(full);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          const type = getMediaType(ext);
          if (type) {
            filesList.push({ fullPath: full, fileName: entry.name, ext, type });
          }
        }
      }
    } catch (err) {
      console.warn(`Cannot read directory: ${current} (${err.message})`);
    }
  }

  walk(dirPath);

  let processed = 0;
  for (const item of filesList) {
    try {
      const stats = fs.statSync(item.fullPath);
      const probe = await probeFile(item.fullPath);

      let duration = 0;
      let width = 0;
      let height = 0;
      let codec = null;
      let bitrate = 0;
      let title = path.basename(item.fileName, item.ext);
      let artist = null;
      let album = null;
      let year = null;
      let genre = null;

      if (probe) {
        const fmt = probe.format || {};
        const tags = fmt.tags || {};
        duration = parseFloat(fmt.duration) || 0;
        bitrate = parseInt(fmt.bit_rate) || 0;

        if (tags.title) title = tags.title;
        if (tags.artist) artist = tags.artist;
        if (tags.album) album = tags.album;
        if (tags.date || tags.year) year = tags.date || tags.year;
        if (tags.genre) genre = tags.genre;

        if (probe.streams) {
          const vStream = probe.streams.find(s => s.codec_type === 'video');
          if (vStream) {
            width = vStream.width || 0;
            height = vStream.height || 0;
            codec = vStream.codec_name;
          }
          const aStream = probe.streams.find(s => s.codec_type === 'audio');
          if (aStream && !codec) {
            codec = aStream.codec_name;
          }
        }
      }

      // Check if already in DB
      const existing = await db.get('SELECT id, thumbnail_path FROM media_items WHERE filepath = ?', [item.fullPath]);
      let mediaId;
      let thumbPath = existing?.thumbnail_path;

      if (existing) {
        mediaId = existing.id;
        await db.run(`
          UPDATE media_items 
          SET filesize = ?, duration = ?, width = ?, height = ?, codec = ?, bitrate = ?, artist = ?, album = ?, year = ?, genre = ?,
              folder_id = COALESCE(?, folder_id), folder_name = COALESCE(?, folder_name)
          WHERE id = ?
        `, [stats.size, duration, width, height, codec, bitrate, artist, album, year, genre, folderId, folderName, mediaId]);
      } else {
        const ins = await db.run(`
          INSERT INTO media_items (
            type, title, filepath, filename, filesize, duration, width, height, codec, container, bitrate, artist, album, year, genre, folder_id, folder_name
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.type, title, item.fullPath, item.fileName, stats.size, duration, width, height, codec, item.ext.replace('.', ''), bitrate, artist, album, year, genre, folderId, folderName
        ]);
        mediaId = ins.lastID;
      }

      // Generate thumbnail if missing
      if (!thumbPath) {
        thumbPath = await generateThumbnail(item.fullPath, item.type, mediaId, duration);
        if (thumbPath) {
          await db.run('UPDATE media_items SET thumbnail_path = ? WHERE id = ?', [thumbPath, mediaId]);
        }
      }

    } catch (e) {
      console.error(`Error processing file ${item.fullPath}:`, e.message);
    }

    processed++;
    if (onProgress) {
      onProgress(processed, filesList.length, item.fileName);
    }
  }

  return { totalScanned: filesList.length };
}

// Get or initialize default Windows media folders
async function initDefaultLibraries() {
  const userHome = process.env.USERPROFILE || 'C:\\Users\\ignac';
  const defaultFolders = [
    { path: path.join(userHome, 'Videos'), type: 'videos', name: 'My Videos' },
    { path: path.join(userHome, 'Music'), type: 'music', name: 'My Music' },
    { path: path.join(userHome, 'Pictures'), type: 'pictures', name: 'My Pictures' }
  ];

  for (const f of defaultFolders) {
    if (fs.existsSync(f.path)) {
      try {
        await db.run(`
          INSERT OR IGNORE INTO library_folders (path, type, name, last_scanned)
          VALUES (?, ?, ?, NULL)
        `, [f.path, f.type, f.name]);
      } catch (err) {}
    }
  }
}

module.exports = {
  scanDirectory,
  initDefaultLibraries,
  THUMBNAILS_DIR
};
