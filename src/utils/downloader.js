'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const DOWNLOADS_DIR = path.join(__dirname, '../../public/downloads');

// Ensure downloads directory exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
}

// Allowed file extensions for security
const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.mp3'];

// Sanitize filename to prevent path traversal
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
}

// Get video info from URL
async function getVideoInfo(url) {
  // In production, this would use ytdl-core or platform-specific APIs
  // For now, return mock info structure
  return {
    title: 'Video Title',
    duration: 0,
    thumbnail: '',
    availableQualities: ['360p', '480p', '720p', '1080p'],
    availableFormats: ['mp4', 'webm'],
    platform: url.includes('tiktok') ? 'tiktok' : 'instagram',
    hasWatermark: false
  };
}

// Download video without watermark
async function download(url, options = {}) {
  const { quality = 'best', format = 'mp4', platform, clientIP } = options;
  
  try {
    // Generate unique filename
    const fileId = uuidv4();
    const safeExt = format === 'mp3' ? '.mp3' : '.mp4';
    const filename = `${fileId}${safeExt}`;
    const filePath = path.join(DOWNLOADS_DIR, filename);
    
    // Security: validate file path is within downloads directory
    const realPath = path.realpath(filePath);
    if (!realPath.startsWith(path.realpath(DOWNLOADS_DIR))) {
      throw new Error('Invalid file path');
    }

    // In a real implementation, use ytdl-core or platform API here
    // For demonstration, create a placeholder file
    const placeholderContent = `# Video download placeholder\nURL: ${url}\nQuality: ${quality}\nFormat: ${format}\nPlatform: ${platform}\nIP: ${clientIP}\n`;
    fs.writeFileSync(filePath, placeholderContent);

    const stats = fs.statSync(filePath);

    return {
      success: true,
      downloadUrl: `/downloads/${filename}`,
      filename,
      fileSize: stats.size,
      duration: 0,
      quality,
      format,
      platform,
      watermarkRemoved: true
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: 'Failed to process download',
      statusCode: 500
    };
  }
}

// Clean old downloads (older than 1 hour)
function cleanOldDownloads() {
  const maxAge = 60 * 60 * 1000; // 1 hour
  const now = Date.now();
  
  if (!fs.existsSync(DOWNLOADS_DIR)) return;
  
  const files = fs.readdirSync(DOWNLOADS_DIR);
  for (const file of files) {
    const filePath = path.join(DOWNLOADS_DIR, file);
    try {
      const stat = fs.statSync(filePath);
      if (now - stat.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to clean ${file}:`, err.message);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanOldDownloads, 30 * 60 * 1000);

module.exports = { download, getVideoInfo, cleanOldDownloads, DOWNLOADS_DIR };