'use strict';

const express = require('express');
const router = express.Router();

// GET /api/security/headers - Get security headers info
router.get('/headers', (req, res) => {
  res.json({
    success: true,
    securityHeaders: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': 'enabled',
      'Strict-Transport-Security': 'enabled'
    },
    message: 'Security headers are active',
    timestamp: new Date().toISOString()
  });
});

// GET /api/security/status - Security status check
router.get('/status', (req, res) => {
  res.json({
    success: true,
    protections: [
      'Helmet (CSP, HSTS, X-Frame-Options, etc.)',
      'CORS with origin validation',
      'Express Rate Limiting (global + download-specific)',
      'XSS sanitization (xss-clean)',
      'NoSQL injection protection (mongo-sanitize)',
      'HTTP Parameter Pollution protection (hpp)',
      'Request size limits',
      'Input sanitization (null byte removal)',
      'Secure error handling (no stack traces)',
      'Graceful shutdown'
    ],
    timestamp: new Date().toISOString()
  });
});

module.exports = router;