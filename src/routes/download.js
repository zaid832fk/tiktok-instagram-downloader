'use strict';

const express = require('express');
const router = express.Router();
const { downloadValidationRules } = require('../middleware/validation');
const downloader = require('../utils/downloader');
const { logSecurityEvent } = require('../utils/securityLogger');

// POST /api/download - Download video without watermark
router.post('/', downloadValidationRules, async (req, res, next) => {
  try {
    const { url, quality = 'best', format = 'mp4' } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    // Log download request for security monitoring
    logSecurityEvent('DOWNLOAD_REQUEST', { url, quality, format, ip: clientIP });

    // Validate platform
    const isTikTok = /tiktok\.com/i.test(url);
    const isInstagram = /instagram\.com/i.test(url);

    if (!isTikTok && !isInstagram) {
      return res.status(400).json({ 
        error: 'Invalid platform', 
        message: 'Only TikTok and Instagram URLs are supported',
        code: 400 
      });
    }

    // Download video
    const result = await downloader.download(url, {
      quality,
      format,
      platform: isTikTok ? 'tiktok' : 'instagram',
      clientIP
    });

    if (!result.success) {
      return res.status(result.statusCode || 500).json({
        error: result.error || 'Download failed',
        message: result.message || 'Could not download the video',
        code: result.statusCode || 500
      });
    }

    res.json({
      success: true,
      message: 'Download ready',
      downloadUrl: result.downloadUrl,
      filename: result.filename,
      fileSize: result.fileSize,
      duration: result.duration,
      quality: result.quality,
      format: result.format,
      expiresIn: '1 hour',
      platform: result.platform
    });

  } catch (err) {
    logSecurityEvent('DOWNLOAD_ERROR', { error: err.message, ip: req.ip });
    next(err);
  }
});

// GET /api/download/info - Get video info without downloading
router.get('/info', downloadValidationRules, async (req, res, next) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required', code: 400 });
    }

    const info = await downloader.getVideoInfo(url);
    res.json({ success: true, ...info });
  } catch (err) {
    next(err);
  }
});

module.exports = router;