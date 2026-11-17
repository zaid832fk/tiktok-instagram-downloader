'use strict';

const rateLimit = require('express-rate-limit');

// Security headers middleware
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

// Request size limit
function requestSizeLimit(maxSize) {
  return (req, res, next) => {
    const len = parseInt(req.headers['content-length'] || '0', 10);
    if (len && len > parseMaxSize(maxSize)) {
      return res.status(413).json({ error: 'Request too large', code: 413 });
    }
    next();
  };
}

function parseMaxSize(size) {
  const units = { k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
  const match = String(size).toLowerCase().match(/^(\d+)([kmg]?)$/);
  if (!match) return 10 * 1024 * 1024;
  return parseInt(match[1], 10) * (units[match[2]] || 1);
}

// IP Filtering - block suspicious IPs
function ipFilter() {
  const blockedIPs = new Set(process.env.BLOCKED_IPS ? process.env.BLOCKED_IPS.split(',') : []);
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (blockedIPs.has(ip)) {
      return res.status(403).json({ error: 'Access denied', code: 403 });
    }
    next();
  };
}

module.exports = { securityHeaders, requestSizeLimit, ipFilter };