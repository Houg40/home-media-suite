const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const db = require('./db/database');
const { scanDirectory, initDefaultLibraries, THUMBNAILS_DIR } = require('./scanner/indexer');
const { generateDemoMedia, DEMO_DIR } = require('./scanner/demoGenerator');
const { streamVideo, streamAudio, streamImage } = require('./streaming/streamEngine');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve static thumbnails
app.use('/api/thumbnail', express.static(THUMBNAILS_DIR));

// Helper: Get local network IP addresses
function getNetworkIps() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

// 1. Get all media with filters
app.get('/api/media', async (req, res) => {
  try {
    const { type, search, folder_id, sort = 'recent', limit = 100 } = req.query;
    let query = `
      SELECT m.*, 
             p.position_seconds, 
             p.duration_seconds as progress_duration, 
             p.completed
      FROM media_items m
      LEFT JOIN watch_progress p ON m.id = p.media_id
      WHERE 1=1
    `;
    const params = [];

    // Folder selection & presentation filter
    if (folder_id && folder_id !== 'all') {
      query += ' AND m.folder_id = ?';
      params.push(parseInt(folder_id));
    } else {
      // By default, only present media from enabled folders
      query += ' AND (m.folder_id IS NULL OR m.folder_id IN (SELECT id FROM library_folders WHERE is_enabled = 1))';
    }

    if (type && type !== 'all') {
      query += ' AND m.type = ?';
      params.push(type);
    }

    if (search) {
      query += ' AND (m.title LIKE ? OR m.artist LIKE ? OR m.album LIKE ? OR m.filename LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (sort === 'title') {
      query += ' ORDER BY m.title ASC';
    } else if (sort === 'duration') {
      query += ' ORDER BY m.duration DESC';
    } else {
      query += ' ORDER BY m.created_at DESC, m.id DESC';
    }

    query += ' LIMIT ?';
    params.push(parseInt(limit));

    const items = await db.all(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get single media item
app.get('/api/media/:id', async (req, res) => {
  try {
    const item = await db.get(`
      SELECT m.*, p.position_seconds, p.duration_seconds as progress_duration, p.completed
      FROM media_items m
      LEFT JOIN watch_progress p ON m.id = p.media_id
      WHERE m.id = ?
    `, [req.params.id]);

    if (!item) return res.status(404).json({ error: 'Media not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Featured Hero Items
app.get('/api/featured', async (req, res) => {
  try {
    const { folder_id } = req.query;
    let query = `
      SELECT m.*, p.position_seconds, p.completed
      FROM media_items m
      LEFT JOIN watch_progress p ON m.id = p.media_id
      WHERE m.type IN ('video', 'audio')
    `;
    const params = [];

    if (folder_id && folder_id !== 'all') {
      query += ' AND m.folder_id = ?';
      params.push(parseInt(folder_id));
    } else {
      query += ' AND (m.folder_id IS NULL OR m.folder_id IN (SELECT id FROM library_folders WHERE is_enabled = 1))';
    }

    query += ' ORDER BY m.is_favorite DESC, m.width DESC, m.duration DESC LIMIT 5';
    const items = await db.all(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. In-Progress items (Continue Watching)
app.get('/api/in-progress', async (req, res) => {
  try {
    const { folder_id } = req.query;
    let query = `
      SELECT m.*, p.position_seconds, p.duration_seconds as progress_duration, p.completed, p.updated_at
      FROM media_items m
      INNER JOIN watch_progress p ON m.id = p.media_id
      WHERE p.position_seconds > 5 AND (p.completed = 0 OR p.completed IS NULL)
    `;
    const params = [];

    if (folder_id && folder_id !== 'all') {
      query += ' AND m.folder_id = ?';
      params.push(parseInt(folder_id));
    } else {
      query += ' AND (m.folder_id IS NULL OR m.folder_id IN (SELECT id FROM library_folders WHERE is_enabled = 1))';
    }

    query += ' ORDER BY p.updated_at DESC LIMIT 8';
    const items = await db.all(query, params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Video Stream
app.get('/api/stream/video/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM media_items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).send('Not found');
    streamVideo(req, res, item);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 6. Audio Stream
app.get('/api/stream/audio/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM media_items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).send('Not found');
    streamAudio(req, res, item);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 7. Image Stream
app.get('/api/stream/image/:id', async (req, res) => {
  try {
    const item = await db.get('SELECT * FROM media_items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).send('Not found');
    streamImage(req, res, item);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// 8. Watch progress update
app.post('/api/progress/:id', async (req, res) => {
  try {
    const { position_seconds, duration_seconds, completed = 0 } = req.body;
    await db.run(`
      INSERT INTO watch_progress (media_id, position_seconds, duration_seconds, completed, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(media_id) DO UPDATE SET
        position_seconds = excluded.position_seconds,
        duration_seconds = excluded.duration_seconds,
        completed = excluded.completed,
        updated_at = CURRENT_TIMESTAMP
    `, [req.params.id, position_seconds, duration_seconds, completed]);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Toggle Favorite
app.post('/api/media/:id/favorite', async (req, res) => {
  try {
    const item = await db.get('SELECT is_favorite FROM media_items WHERE id = ?', [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Media not found' });
    const nextVal = item.is_favorite ? 0 : 1;
    await db.run('UPDATE media_items SET is_favorite = ? WHERE id = ?', [nextVal, req.params.id]);
    res.json({ is_favorite: nextVal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Library Folders Management
app.get('/api/library/folders', async (req, res) => {
  try {
    const folders = await db.all(`
      SELECT f.*, COUNT(m.id) as item_count 
      FROM library_folders f
      LEFT JOIN media_items m ON f.id = m.folder_id
      GROUP BY f.id
      ORDER BY f.id ASC
    `);
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/library/folders/:id/toggle', async (req, res) => {
  try {
    const folder = await db.get('SELECT is_enabled FROM library_folders WHERE id = ?', [req.params.id]);
    if (!folder) return res.status(404).json({ error: 'Folder not found' });
    const nextVal = (folder.is_enabled === 1 || folder.is_enabled === null) ? 0 : 1;
    await db.run('UPDATE library_folders SET is_enabled = ? WHERE id = ?', [nextVal, req.params.id]);
    res.json({ id: parseInt(req.params.id), is_enabled: nextVal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/library/folders', async (req, res) => {
  try {
    const { path: folderPath, type = 'all', name } = req.body;
    if (!folderPath || !fs.existsSync(folderPath)) {
      return res.status(400).json({ error: 'Valid folder path is required' });
    }
    const folderName = name || path.basename(folderPath);
    await db.run(`
      INSERT OR REPLACE INTO library_folders (path, type, name, is_enabled, last_scanned)
      VALUES (?, ?, ?, 1, NULL)
    `, [folderPath, type, folderName]);

    res.json({ success: true, path: folderPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/library/folders/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM library_folders WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Trigger Full Library Scan
let isScanning = false;
app.post('/api/library/scan', async (req, res) => {
  if (isScanning) {
    return res.status(409).json({ message: 'Scan already in progress' });
  }

  isScanning = true;
  res.json({ message: 'Library scan initiated in background' });

  (async () => {
    try {
      console.log('--- Starting media library scan ---');
      const folders = await db.all('SELECT * FROM library_folders');
      for (const f of folders) {
        if (fs.existsSync(f.path)) {
          console.log(`Scanning: ${f.name} (${f.path})`);
          await scanDirectory(f.path, f.id, f.name);
          await db.run('UPDATE library_folders SET last_scanned = CURRENT_TIMESTAMP WHERE id = ?', [f.id]);
        }
      }
      console.log('--- Library scan completed successfully ---');
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      isScanning = false;
    }
  })();
});

// 12. Initial User Setup & Onboarding
app.get('/api/setup/status', async (req, res) => {
  try {
    const setupCompleted = (await db.getSetting('setup_completed', '0')) === '1';
    const userHome = process.env.USERPROFILE || 'C:\\Users\\ignac';

    // Candidate folders detectable on Windows
    const candidates = [
      { path: path.join(userHome, 'Videos'), type: 'videos', name: 'My Videos', recommended: true, description: 'Movies, TV shows & home recordings' },
      { path: path.join(userHome, 'Music'), type: 'music', name: 'My Music', recommended: true, description: 'Lossless audio, albums & tracks' },
      { path: path.join(userHome, 'Pictures'), type: 'pictures', name: 'My Pictures', recommended: true, description: 'Photos, camera roll & wall art' },
      { path: DEMO_DIR, type: 'all', name: 'Universal Format Showcase', recommended: true, description: 'Pre-generated MKV, AVI, FLAC & TIFF samples' },
      { path: path.join(userHome, 'Downloads'), type: 'all', name: 'Downloads Directory', recommended: false, description: 'Browser and peer download folder' }
    ];

    // Detect additional drive letters
    ['D:\\', 'E:\\', 'F:\\'].forEach(drive => {
      if (fs.existsSync(drive)) {
        candidates.push({
          path: drive,
          type: 'all',
          name: `Drive (${drive.replace('\\', '')})`,
          recommended: false,
          description: `External or secondary storage drive ${drive}`
        });
      }
    });

    const detected = candidates.filter(c => fs.existsSync(c.path));
    const configured = await db.all('SELECT * FROM library_folders ORDER BY id ASC');

    res.json({
      setupCompleted,
      detectedFolders: detected,
      configuredFolders: configured
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/setup/complete', async (req, res) => {
  try {
    const { folders = [] } = req.body;

    for (const f of folders) {
      if (f.path && fs.existsSync(f.path)) {
        const isEnabled = f.is_enabled !== false ? 1 : 0;
        const folderName = f.name || path.basename(f.path);
        const folderType = f.type || 'all';

        await db.run(`
          INSERT INTO library_folders (path, type, name, is_enabled, last_scanned)
          VALUES (?, ?, ?, ?, NULL)
          ON CONFLICT(path) DO UPDATE SET 
            type = excluded.type,
            name = excluded.name,
            is_enabled = excluded.is_enabled
        `, [f.path, folderType, folderName, isEnabled]);
      }
    }

    await db.setSetting('setup_completed', '1');

    // Trigger initial scan of selected enabled folders in background
    (async () => {
      try {
        console.log('--- Starting Initial Setup Media Scan ---');
        const activeFolders = await db.all('SELECT * FROM library_folders WHERE is_enabled = 1');
        for (const f of activeFolders) {
          if (fs.existsSync(f.path)) {
            console.log(`Initial scan: ${f.name} (${f.path})`);
            await scanDirectory(f.path, f.id, f.name);
            await db.run('UPDATE library_folders SET last_scanned = CURRENT_TIMESTAMP WHERE id = ?', [f.id]);
          }
        }
        console.log('--- Initial Setup Media Scan Complete ---');
      } catch (e) {
        console.error('Initial setup scan error:', e);
      }
    })();

    res.json({ success: true, message: 'Setup completed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/setup/reset', async (req, res) => {
  try {
    await db.setSetting('setup_completed', '0');
    res.json({ success: true, message: 'Setup reset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Network & LAN Info
app.get('/api/system/network', (req, res) => {
  const ips = getNetworkIps();
  res.json({
    port: PORT,
    localIps: ips,
    streamUrls: ips.map(ip => `http://${ip}:${PORT}`),
    clientUrls: ips.map(ip => `http://${ip}:5173`)
  });
});

// Startup sequence
async function start() {
  await db.initDb();

  // Generate demo media showcasing universal format support
  try {
    await generateDemoMedia();
    await db.run(`
      INSERT OR IGNORE INTO library_folders (path, type, name, is_enabled, last_scanned)
      VALUES (?, 'all', 'Universal Format Showcase', 1, NULL)
    `, [DEMO_DIR]);
    const demoFolder = await db.get('SELECT id, name FROM library_folders WHERE path = ?', [DEMO_DIR]);
    if (demoFolder) {
      await scanDirectory(DEMO_DIR, demoFolder.id, demoFolder.name);
    }
  } catch (err) {
    console.error('Demo media init error:', err);
  }

  const isSetupDone = (await db.getSetting('setup_completed', '0')) === '1';

  // Only perform background auto-scan if initial setup is already complete
  if (isSetupDone) {
    setTimeout(async () => {
      const folders = await db.all('SELECT * FROM library_folders WHERE is_enabled = 1');
      for (const f of folders) {
        if (fs.existsSync(f.path) && f.path !== DEMO_DIR) {
          scanDirectory(f.path, f.id, f.name).catch(console.error);
        }
      }
    }, 1000);
  } else {
    console.log('--- Initial user setup pending: waiting for user folder selection in setup wizard ---');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  Home Media Suite Server running on http://localhost:${PORT}`);
    const ips = getNetworkIps();
    if (ips.length > 0) {
      console.log(`  Local Network (Wi-Fi) Stream: http://${ips[0]}:${PORT}`);
    }
    console.log(`=======================================================`);
  });
}

start().catch(console.error);
