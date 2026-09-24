// Smart media title cleaner & parser
export function cleanMediaTitle(title, filename) {
  let raw = (title || filename || '').trim();

  // Strip common file extensions
  raw = raw.replace(/\.(mp4|mkv|avi|mov|webm|flv|ts|m4v|wmv|mp3|flac|wav|aac|ogg|m4a|wma|jpg|jpeg|png|webp|heic|tiff|tif)$/i, '');
  raw = raw.replace(/[-_.]+$/, ''); // trailing punctuation

  // 1. VLC screen / stream recordings:
  // e.g. "vlc-record-2025-12-31-15h19m58s-Kam Chancellor Top 15 Hits" -> "Kam Chancellor Top 15 Hits"
  const vlcMatch = raw.match(/^vlc-record-\d{4}-\d{2}-\d{2}(?:-\d{2}h\d{2}m\d{2}s)?-(.+)$/i);
  if (vlcMatch && vlcMatch[1]) {
    return {
      clean: vlcMatch[1].trim(),
      subtitle: 'VLC Recording',
      raw
    };
  }

  // 2. Camera & phone captures (VID_2026..., IMG_2026..., PXL_2026...)
  const cameraMatch = raw.match(/^(VID|IMG|PXL|MOV|REC)[-_](\d{4})(\d{2})(\d{2})[-_](\d{2})(\d{2})(\d{2})?/i);
  if (cameraMatch) {
    const isPhoto = cameraMatch[1].toUpperCase().startsWith('I') || cameraMatch[1].toUpperCase().startsWith('PXL');
    const typeLabel = isPhoto ? 'Photo' : 'Video';
    const dateFormatted = `${cameraMatch[2]}-${cameraMatch[3]}-${cameraMatch[4]}`;
    return {
      clean: `${typeLabel} • ${dateFormatted}`,
      subtitle: raw,
      raw
    };
  }

  // 3. TV show release naming:
  // e.g. "The.Wire.S01E01.The.Target.1080p.WEBRip.10Bit.DDP2.0.HEVC-d3g"
  const showMatch = raw.match(/^(.+?)[._ -]+(S\d{1,2}E\d{1,2})[._ -]+(.+?)(?:[._ -]+(?:1080p|720p|2160p|4k|web-?rip|bluray|x264|x265|hevc|dvdrip|aac|ac3|ddp.*|repack).*|$)/i);
  if (showMatch) {
    const showName = showMatch[1].replace(/[._]/g, ' ').trim();
    const episode = showMatch[2].toUpperCase();
    const epTitle = showMatch[3].replace(/[._]/g, ' ').trim();
    return {
      clean: `${showName} • ${episode}${epTitle ? ' - ' + epTitle : ''}`,
      subtitle: showMatch[0].replace(showMatch[1], '').trim(),
      raw
    };
  }

  // 4. Movie release format: "Movie.Name.2024.1080p..."
  const movieMatch = raw.match(/^(.+?)[._ -]+((?:19|20)\d{2})[._ -]+.*$/);
  if (movieMatch) {
    const movieName = movieMatch[1].replace(/[._]/g, ' ').trim();
    const year = movieMatch[2];
    return {
      clean: `${movieName} (${year})`,
      subtitle: raw,
      raw
    };
  }

  // 5. Clean dotted or underscore separated names
  let clean = raw;
  if ((clean.match(/\./g) || []).length >= 2 && !clean.includes(' ')) {
    clean = clean.replace(/\./g, ' ');
  } else if ((clean.match(/_/g) || []).length >= 2 && !clean.includes(' ')) {
    clean = clean.replace(/_/g, ' ');
  }

  return {
    clean,
    subtitle: raw !== clean ? raw : null,
    raw
  };
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
