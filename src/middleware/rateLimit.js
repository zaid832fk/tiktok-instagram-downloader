'use strict';

const rateLimit = require('express-rate-limit');

// Global rate limiter - protects against DDoS and brute force
const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests', message: 'Rate limit exceeded. Please try again later.', code: 429 },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

// Download rate limiter - stricter for download endpoint
const downloadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 download requests per minute
  message: { error: 'Too many requests', message: 'Download rate limit exceeded. Please slow down.', code: 429 },
  standardHeaders: true,
  legacyHeaders: false
});

// Login rate limiter (for future auth)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts', message: 'Too many login attempts. Please try again later.', code: 429 },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { globalRateLimiter, downloadRateLimiter, authRateLimiter };