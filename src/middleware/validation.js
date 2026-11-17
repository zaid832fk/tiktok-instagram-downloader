'use strict';

const { body, param, query, validationResult } = require('express-validator');

function sanitizeInput(req, res, next) {
  // Remove any null bytes from input
  const clean = (obj) => {
    if (typeof obj === 'string') return obj.replace(/\0/g, '');
    if (Array.isArray(obj)) return obj.map(clean);
    if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [k, v] of Object.entries(obj)) {
        cleaned[k.replace(/\0/g, '')] = clean(v);
      }
      return cleaned;
    }
    return obj;
  };
  if (req.body) req.body = clean(req.body);
  if (req.query) req.query = clean(req.query);
  if (req.params) req.params = clean(req.params);
  next();
}

function validateDownloadRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: errors.array(),
      code: 400 
    });
  }
  next();
}

const downloadValidationRules = [
  body('url')
    .notEmpty().withMessage('URL is required')
    .isURL().withMessage('Invalid URL format')
    .matches(/(tiktok\.com|instagram\.com)/i).withMessage('Only TikTok and Instagram URLs are allowed')
    .isLength({ max: 500 }).withMessage('URL too long'),
  body('quality')
    .optional()
    .isIn(['360p', '480p', '720p', '1080p', 'best']).withMessage('Invalid quality option'),
  body('format')
    .optional()
    .isIn(['mp4', 'webm', 'mp3']).withMessage('Invalid format option')
];

module.exports = { sanitizeInput, validateDownloadRequest, downloadValidationRules };